---
name: commit
description: Write a Conventional Commits message (feat, fix, refactor, chore, …) for the staged or working-tree changes, and optionally create the commit. Use when the user asks for a commit message, to commit, or runs /commit.
---

# Commit message skill

Generate a commit message that follows [Conventional Commits 1.0](https://www.conventionalcommits.org/) and git best practices.

## Steps

1. Inspect the changes:
   - `git status --short`
   - `git diff --staged` (if nothing is staged, use `git diff` and note that nothing is staged)
   - `git log --oneline -10` to match the repo's existing style
2. Work out **why** the change was made, not just what changed. Read the files if the diff alone doesn't make the intent clear.
3. If the diff mixes unrelated changes (for example a new feature and a dependency bump), suggest splitting them into separate commits and give one message per group, with the `git add` paths for each.
4. Write the message in the format below and show it to the user in a code block.
5. Only run `git commit` if the user asked you to commit. Pass the message with a heredoc so the formatting survives:
   ```bash
   git commit -F - <<'MSG'
   <message>
   MSG
   ```
   Never use `--no-verify`, never amend, and never push unless asked.

## Format

```
<type>(<optional scope>): <subject>

<body: optional>

<footer: optional>
```

### Types

| Type       | Use for                                                     |
|------------|-------------------------------------------------------------|
| `feat`     | A new user-facing feature                                   |
| `fix`      | A bug fix                                                   |
| `refactor` | A code change that neither fixes a bug nor adds a feature   |
| `perf`     | A performance improvement                                   |
| `style`    | Formatting only: whitespace, semicolons, no logic change    |
| `test`     | Adding or fixing tests                                      |
| `docs`     | Documentation only                                          |
| `build`    | Build system or dependencies (package.json, metro, babel)   |
| `ci`       | CI configuration (GitHub Actions, EAS workflows)            |
| `chore`    | Maintenance that doesn't touch src or tests                 |
| `revert`   | Reverts an earlier commit (`revert: feat(x): …`)            |

For choosing between types: a new screen is `feat`, a crash fix is `fix`, and moving code without changing behavior is `refactor`.

### Scope

Optional. Use a short noun for the area touched, taken from this repo's structure: `jar`, `baskets`, `history`, `settings`, `store`, `ui`, `theme`, `deps`, `config`. Leave it out if the change spans many areas.

### Subject rules

- Imperative mood: "add", not "added" or "adds". It should complete the sentence "If applied, this commit will …"
- Lowercase first letter and no trailing period
- 50 characters or fewer is the target; 72 is the hard limit
- Be specific: `fix(jar): prevent balance going negative on withdraw`, not `fix: bug`

### Body

- Leave one blank line after the subject, and wrap lines at 72 characters
- Explain **what** and **why**, not how; the diff already shows how
- Bullet points (`- `) are fine for listing several changes
- Leave the body out when the subject says everything

### Footer

- Breaking changes: add `!` after the type/scope **and** a `BREAKING CHANGE: <description>` footer
- Issue references: `Closes #12`, `Refs #34`
- Co-author lines go last

## Examples

```
feat(jar): add savings goal progress to jar card
```

```
fix(store): keep balance at zero when minus exceeds amount

applyAmount subtracted the full amount even when it was larger than
the current balance, leaving jars with negative totals.

Closes #18
```

```
refactor(ui): extract shared Screen and ScreenHeader components
```

```
build(deps): add nativewind and tailwind config
```

```
feat(store)!: store amounts in minor units

BREAKING CHANGE: persisted jars saved with decimal amounts must be
migrated; amounts are now integers in cents.
```

## Anti-patterns to avoid

- `update files`, `wip`, `fixes`, `misc changes`
- Past tense (`added login`) or a capitalised subject ending in a period
- Listing every changed file in the body
- One commit that bundles a feature, a refactor, and a dependency bump
