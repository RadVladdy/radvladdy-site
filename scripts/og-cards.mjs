// Generates the per-post OG cards (1200x630 dark terminal cards: prompt
// header, avatar, title/subtitle, posted/block byline, skyline silhouette).
// Run LOCALLY (`npm run og`) and commit the PNGs — the script needs the real
// Menlo face, so it never runs in CI. Pages without a card fall back to
// images/skyline.jpg via the layout default.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const W = 1200, H = 630, MARGIN = 80;

// Menlo ships with macOS; on Linux it's a hand-placed copy under the user
// font dir. That copy is deliberately NOT in this repo — the face is Apple's,
// licensed with the machine, so it travels by scp and never by git. Paths are
// resolved at runtime so no local absolute path is ever committed.
const MENLO = [
  '/System/Library/Fonts/Menlo.ttc',
  join(homedir(), '.local', 'share', 'fonts', 'Menlo.ttc'),
].find(existsSync);

// Hard-fail rather than substitute. A fallback face keeps Menlo's line breaks
// (CHAR_W below is hardcoded) while drawing different glyph widths, and may
// lack the prompt's ▮ (U+25AE) or an italic face entirely — which is exactly
// how two cards shipped with a tofu box and an upright subtitle.
if (!MENLO) {
  console.error('Menlo not found. Install it at ~/.local/share/fonts/Menlo.ttc — see CLAUDE.md § OG cards.');
  process.exit(1);
}

const FONT = { fontFiles: [MENLO], defaultFontFamily: 'Menlo', loadSystemFonts: false };
const CHAR_W = 0.602; // Menlo advance width per em

const esc = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#39;');

const wrap = (text, maxChars) => {
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? line + ' ' + word : word;
    if (next.length > maxChars && line) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  return lines;
};

// The homepage skyline silhouette, rescaled from its 760x80 viewBox.
const SKYLINE_PATH = 'M0,80 L0,48 L40,48 L40,32 L64,32 L64,54 L102,54 L102,20 L132,20 L132,42 L166,42 L166,58 L208,58 L208,27 L236,27 L236,13 L262,13 L262,49 L302,49 L302,38 L338,38 L338,56 L378,56 L378,22 L410,22 L410,45 L446,45 L446,9 L472,9 L472,40 L510,40 L510,53 L550,53 L550,29 L582,29 L582,47 L618,47 L618,18 L646,18 L646,51 L686,51 L686,36 L720,36 L720,58 L760,58 L760,80 Z';

const avatarB64 = readFileSync(new URL('../public/images/avatar.jpg', import.meta.url)).toString('base64');

function card({ title, subtitle, date, block }) {
  // Long titles step the font down instead of overflowing.
  const titleSize = title.length <= 38 ? 62 : title.length <= 70 ? 52 : 44;
  const titleLines = wrap(title, Math.floor((W - 2 * MARGIN) / (titleSize * CHAR_W))).slice(0, 3);
  const titleLH = Math.round(titleSize * 1.3);
  // Long subtitles step the font down, the same way long titles do above. Two
  // lines is a hard cap — a third would land at y=506 and collide with the
  // byline at y=512 — so without the stepdown the slice() silently drops the
  // end of the sentence.
  const subFit = (size) => wrap(subtitle, Math.floor((W - 2 * MARGIN) / (size * CHAR_W)));
  const subSize = subtitle ? ([27, 25, 23].find((s) => subFit(s).length <= 2) ?? 23) : 27;
  const subLines = subtitle ? subFit(subSize).slice(0, 2) : [];

  let y = 250;
  const titleText = titleLines.map((l) => `<text x="${MARGIN}" y="${(y += titleLH) - titleLH}" font-size="${titleSize}" font-weight="bold" fill="#e6edf3">${esc(l)}</text>`).join('');
  y += 14;
  const subText = subLines.map((l) => `<text x="${MARGIN}" y="${(y += 40) - 40}" font-size="${subSize}" font-style="italic" fill="#22d3ee">${esc(l)}</text>`).join('');
  const byline = `posted ${date}${block ? ` · block ${Number(block).toLocaleString('en-US')}` : ''}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" font-family="Menlo">
  <rect width="${W}" height="${H}" fill="#0b0f14"/>
  <rect width="${W}" height="4" fill="#22d3ee" opacity="0.85"/>
  <text x="${MARGIN}" y="120" font-size="28" fill="#8b949e">rad@radvladdy<tspan fill="#22d3ee">:~$</tspan> <tspan fill="#22d3ee">▮</tspan></text>
  <clipPath id="av"><circle cx="1056" cy="112" r="56"/></clipPath>
  <circle cx="1056" cy="112" r="60" fill="none" stroke="#22d3ee" stroke-width="3" opacity="0.35"/>
  <circle cx="1056" cy="112" r="58" fill="none" stroke="#22d3ee" stroke-width="2.5"/>
  <image href="data:image/jpeg;base64,${avatarB64}" x="1000" y="56" width="112" height="112" clip-path="url(#av)" preserveAspectRatio="xMidYMid slice"/>
  ${titleText}
  ${subText}
  <text x="${MARGIN}" y="512" font-size="24" fill="#8b949e">${esc(byline)}</text>
  <text x="${W - MARGIN}" y="512" font-size="24" fill="#22d3ee" text-anchor="end">radvladdy.com</text>
  <g transform="translate(0, 550) scale(${(W / 760).toFixed(4)}, 1)">
    <path d="${SKYLINE_PATH}" fill="#11161d"/>
    <rect x="112" y="27" width="3" height="3" fill="#22d3ee"/>
    <rect x="244" y="20" width="3" height="3" fill="#f7931a"/>
    <rect x="388" y="29" width="3" height="3" fill="#22d3ee"/>
    <rect x="455" y="15" width="3" height="3" fill="#f7931a"/>
    <rect x="590" y="34" width="3" height="3" fill="#22d3ee"/>
    <rect x="697" y="41" width="3" height="3" fill="#22d3ee"/>
  </g>
</svg>`;
}

const srcDir = new URL('../src/content/writing/', import.meta.url);
const outDir = new URL('../public/og/', import.meta.url);
mkdirSync(outDir, { recursive: true });

const fmValue = (fm, key) => {
  const m = fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  return m ? m[1].trim().replace(/^"(.*)"$/, '$1') : undefined;
};

for (const file of readdirSync(srcDir).filter((f) => f.endsWith('.md'))) {
  const fm = (readFileSync(new URL(file, srcDir), 'utf8').match(/^---\n([\s\S]*?)\n---/) || [])[1] || '';
  const data = {
    title: fmValue(fm, 'title') || file.replace(/\.md$/, ''),
    subtitle: fmValue(fm, 'subtitle'),
    date: (fmValue(fm, 'date') || '').slice(0, 10),
    block: fmValue(fm, 'block'),
  };
  const png = new Resvg(card(data), { font: FONT, fitTo: { mode: 'width', value: W } }).render().asPng();
  const out = file.replace(/\.md$/, '.png');
  writeFileSync(new URL(out, outDir), png);
  console.log(`og/${out}  (${(png.length / 1024).toFixed(0)} KB)`);
}
