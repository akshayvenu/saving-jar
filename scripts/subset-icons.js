/**
 * Builds a Material Community Icons font containing only the glyphs this app uses.
 * The full font is ~1.3 MB / ~7,000 glyphs; the app uses a few dozen.
 *
 * Scans src/ for string literals that are MDI icon names (a superset is harmless — each glyph
 * is a few hundred bytes), then writes:
 *   assets/fonts/material-community-subset.ttf
 *   src/components/ui/icon-glyphs.json   (name → codepoint, drives the `Icon` name type)
 *
 * Run `npm run icons` after using a new icon name; `tsc` flags names missing from the subset.
 */
const fs = require('fs');
const path = require('path');
const subsetFont = require('subset-font');

const root = path.resolve(__dirname, '..');
const vectorIcons = path.dirname(require.resolve('@expo/vector-icons/package.json'));
const vendor = path.join(vectorIcons, 'build/vendor/react-native-vector-icons');
const fullGlyphMap = require(path.join(vendor, 'glyphmaps/MaterialCommunityIcons.json'));
const fullFont = path.join(vendor, 'Fonts/MaterialCommunityIcons.ttf');

const fontOut = path.join(root, 'assets/fonts/material-community-subset.ttf');
const glyphsOut = path.join(root, 'src/components/ui/icon-glyphs.json');

function collectNames(dir, names) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) collectNames(p, names);
    else if (/\.(t|j)sx?$/.test(entry.name)) {
      for (const [, name] of fs.readFileSync(p, 'utf8').matchAll(/['"`]([a-z0-9-]+)['"`]/g)) {
        if (Object.hasOwn(fullGlyphMap, name)) names.add(name);
      }
    }
  }
  return names;
}

async function main() {
  const names = [...collectNames(path.join(root, 'src'), new Set())].sort();
  const glyphs = Object.fromEntries(names.map((n) => [n, fullGlyphMap[n]]));
  const text = names.map((n) => String.fromCodePoint(fullGlyphMap[n])).join('');

  const subset = await subsetFont(fs.readFileSync(fullFont), text, { targetFormat: 'truetype' });

  fs.mkdirSync(path.dirname(fontOut), { recursive: true });
  fs.writeFileSync(fontOut, subset);
  fs.writeFileSync(glyphsOut, JSON.stringify(glyphs, null, 2) + '\n');

  const kb = (n) => (n / 1024).toFixed(1) + ' KB';
  console.log(`${names.length} icons → ${kb(subset.length)} (full font ${kb(fs.statSync(fullFont).size)})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
