import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { GoogleGenAI } from "@google/genai";
import { Octokit } from "@octokit/rest";
import { z } from "zod";
import { SYSTEM_INSTRUCTION } from "./prompt.ts";

const DIFF_BUDGET_BYTES = 400_000;
const REVIEW_MARKER = "<!-- ai-review -->";
const SKIP_PATTERNS = [
  /(^|\/)package-lock\.json$/,
  /(^|\/)(bun\.lock|yarn\.lock|pnpm-lock\.yaml)$/,
  /^(android|ios)\//,
  /^assets\//,
  /\.(png|jpe?g|gif|webp|svg|ico|ttf|otf|woff2?|mp3|mp4|snap)$/i,
];

const CATEGORIES = ["bug", "security", "performance", "architecture", "missing_tests"] as const;
const SEVERITIES = ["critical", "high", "medium", "low"] as const;

const ReviewSchema = z.object({
  summary: z.string(),
  findings: z.array(
    z.object({
      path: z.string(),
      line: z.number().int(),
      category: z.enum(CATEGORIES),
      severity: z.enum(SEVERITIES),
      title: z.string(),
      body: z.string(),
      suggestion: z.string().optional(),
    }),
  ),
});
type Finding = z.infer<typeof ReviewSchema>["findings"][number];

interface AnnotatedFile {
  path: string;
  text: string;
  commentable: Set<number>;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name}`);
  return value;
}

/** Prefix each new-file line with its line number and collect lines GitHub accepts comments on. */
function annotatePatch(path: string, patch: string): AnnotatedFile {
  const commentable = new Set<number>();
  const out: string[] = [];
  let newLine = 0;

  for (const raw of patch.split("\n")) {
    const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(raw);
    if (hunk) {
      newLine = Number(hunk[1]);
      out.push(raw);
      continue;
    }
    if (raw.startsWith("\\")) continue; // "\ No newline at end of file"
    if (raw.startsWith("-")) {
      out.push(`       ${raw}`);
    } else if (raw.startsWith("+")) {
      commentable.add(newLine);
      out.push(`${String(newLine).padStart(5)}  ${raw}`);
      newLine++;
    } else {
      commentable.add(newLine);
      out.push(`${String(newLine).padStart(5)}  ${raw}`);
      newLine++;
    }
  }
  return { path, text: `### ${path}\n${out.join("\n")}`, commentable };
}

function markerFor(f: Finding): string {
  const hash = createHash("sha1").update(`${f.path}|${f.category}|${f.title}`).digest("hex").slice(0, 12);
  return `<!-- ai-review:${hash} -->`;
}

function commentBody(f: Finding): string {
  const parts = [`**${f.severity.toUpperCase()} · ${f.category.replace("_", " ")}** — ${f.title}`, "", f.body];
  if (f.suggestion) parts.push("", "```suggestion", f.suggestion, "```");
  parts.push("", markerFor(f));
  return parts.join("\n");
}

async function callGemini(prompt: string): Promise<z.infer<typeof ReviewSchema>> {
  const client = new GoogleGenAI({});
  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  const schema = z.toJSONSchema(ReviewSchema) as Record<string, unknown>;
  delete schema.$schema;

  for (let attempt = 1; ; attempt++) {
    try {
      const res = await client.interactions.create({
        model,
        system_instruction: SYSTEM_INSTRUCTION,
        input: prompt,
        store: false,
        response_format: { type: "text", mime_type: "application/json", schema },
      });
      const text = res.output_text;
      if (!text) throw new Error("Gemini returned no text output");
      try {
        return ReviewSchema.parse(JSON.parse(text));
      } catch (err) {
        console.error("Invalid model output:\n" + text);
        throw err;
      }
    } catch (err) {
      const status = (err as { status?: number }).status;
      const retryable = status === 429 || (status !== undefined && status >= 500);
      if (attempt >= 2 || !retryable) throw err;
      console.warn(`Gemini call failed (${status}), retrying in 10s`);
      await new Promise((r) => setTimeout(r, 10_000));
    }
  }
}

async function main() {
  const event = JSON.parse(readFileSync(requireEnv("GITHUB_EVENT_PATH"), "utf8"));
  const pr = event.pull_request;
  const [owner, repo] = (event.repository.full_name as string).split("/");
  const pull_number: number = pr.number;
  const headSha: string = pr.head.sha;
  const dryRun = process.env.DRY_RUN === "1";

  const octokit = new Octokit({ auth: requireEnv("GITHUB_TOKEN") });

  // 1. Collect and annotate the diff.
  const files = await octokit.paginate(octokit.rest.pulls.listFiles, { owner, repo, pull_number, per_page: 100 });
  const annotated: AnnotatedFile[] = [];
  const skipped: string[] = [];
  let size = 0;
  for (const file of files) {
    if (file.status === "removed" || !file.patch) continue;
    if (SKIP_PATTERNS.some((p) => p.test(file.filename))) continue;
    if (size + file.patch.length > DIFF_BUDGET_BYTES) {
      skipped.push(file.filename);
      continue;
    }
    size += file.patch.length;
    annotated.push(annotatePatch(file.filename, file.patch));
  }

  if (annotated.length === 0) {
    console.log("No reviewable changes.");
    return;
  }

  // 2. Ask Gemini.
  const prompt = [
    `Pull request: ${pr.title}`,
    pr.body ? `\nDescription:\n${pr.body}` : "",
    "\nAnnotated diff (each line starts with its new-file line number; removed lines have none):\n",
    annotated.map((f) => f.text).join("\n\n"),
  ].join("\n");
  const review = await callGemini(prompt);

  // 3. Split findings into inline-able vs body-only, and drop ones we already posted.
  const lineMap = new Map(annotated.map((f) => [f.path, f.commentable]));
  const existingComments = await octokit.paginate(octokit.rest.pulls.listReviewComments, {
    owner,
    repo,
    pull_number,
    per_page: 100,
  });
  const existingReviews = await octokit.paginate(octokit.rest.pulls.listReviews, {
    owner,
    repo,
    pull_number,
    per_page: 100,
  });
  const seen = new Set(
    [...existingComments.map((c) => c.body), ...existingReviews.map((r) => r.body)].flatMap(
      (b) => b?.match(/<!-- ai-review:[0-9a-f]+ -->/g) ?? [],
    ),
  );
  const previouslyReviewed = existingReviews.some((r) => r.body?.includes(REVIEW_MARKER));

  const fresh = review.findings.filter((f) => !seen.has(markerFor(f)));
  const inline = fresh.filter((f) => lineMap.get(f.path)?.has(f.line));
  const unanchored = fresh.filter((f) => !lineMap.get(f.path)?.has(f.line));

  if (fresh.length === 0 && previouslyReviewed) {
    console.log("No new findings; nothing to post.");
    return;
  }

  // 4. Compose and post a single review.
  const body = [REVIEW_MARKER, `## AI review`, "", review.summary];
  if (fresh.length === 0) {
    body.push("", "No issues found.");
  } else {
    const counts = new Map<string, number>();
    for (const f of fresh) counts.set(f.category, (counts.get(f.category) ?? 0) + 1);
    body.push("", `**${fresh.length} new finding(s):** ` + [...counts].map(([c, n]) => `${c.replace("_", " ")} ${n}`).join(" · "));
  }
  for (const f of unanchored) {
    body.push("", `- **${f.severity.toUpperCase()} · ${f.category.replace("_", " ")}** (\`${f.path}:${f.line}\`) — ${f.title}: ${f.body}`, markerFor(f));
  }
  if (skipped.length) {
    body.push("", `_Not reviewed (diff size budget exceeded): ${skipped.map((s) => `\`${s}\``).join(", ")}_`);
  }

  const comments = inline.map((f) => ({ path: f.path, line: f.line, side: "RIGHT" as const, body: commentBody(f) }));

  if (dryRun) {
    console.log(JSON.stringify({ body: body.join("\n"), comments }, null, 2));
    return;
  }
  await octokit.rest.pulls.createReview({
    owner,
    repo,
    pull_number,
    commit_id: headSha,
    event: "COMMENT",
    body: body.join("\n"),
    comments,
  });
  console.log(`Posted review with ${comments.length} inline comment(s), ${unanchored.length} in body.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
