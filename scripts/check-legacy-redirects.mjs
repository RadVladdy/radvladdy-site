#!/usr/bin/env node
// Negative controls for the dead-WordPress redirect table in src/worker.js.
//
// WHY A CHECKER AND NOT JUST THE TABLE. This repo's own history is the argument:
// the 2026-08-15 SEO fix shipped with the defect it was written to remove still
// in it, because the nav was checked and the generated essay links were not.
// A redirect map is exactly the kind of thing that looks right and silently
// misses a case. Every assertion below can go red.
//
// Run: node scripts/check-legacy-redirects.mjs   (offline, no build needed)
import { legacyDisposition as d } from '../src/worker.js';

let fails = 0;
const case_ = (name, ok, detail = '') => {
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
};
const to = (p) => (d(p) || {}).to;

// ── The two URLs with a genuine one-to-one successor ──
case_('the old bitcoin-101 URL reaches the surviving post',
  to('/bitcoin-education/bitcoin-101-what-is-bitcoin/') === '/archive/bitcoin-101-what-is-bitcoin/',
  to('/bitcoin-education/bitcoin-101-what-is-bitcoin/'));
case_('the old VanEck URL reaches the surviving post',
  to('/long-term-investment-thesis-bitcoin/the-investment-case-for-bitcoin-vaneck/')
    === '/archive/the-investment-case-for-bitcoin-vaneck/');

// ── Both sitemap names every crawler probes before reading robots.txt ──
case_('Yoast /sitemap_index.xml reaches the real sitemap',
  to('/sitemap_index.xml') === '/sitemap-index.xml');
case_('the bare /sitemap.xml reaches the real sitemap',
  to('/sitemap.xml') === '/sitemap-index.xml');

// ── Feeds people still hold subscriptions to ──
case_('the old WordPress feed reaches the current one', to('/feed/') === '/rss.xml');
case_('the comments feed reaches the current one', to('/comments/feed/') === '/rss.xml');

// ── Whole sections with no exact successor land on the archive ──
for (const p of ['/bitcoin-education/bitcoin-401/', '/buy-bitcoin/kraken-exchange/',
                 '/books/why-buy-bitcoin-investing-today-in-the-money-of-tomorrow/',
                 '/podcasts/', '/cashapp/', '/category/bitcoin/', '/tag/bitcoin/',
                 '/author/radvladdy/', '/wp-content/uploads/2020/01/x.pdf',
                 '/bitcoin-202-money-and-economics/']) {
  case_(`a retired section URL lands on the archive: ${p}`, to(p) === '/archive/', to(p));
}

// ── Trailing slash is not a way to slip past the table ──
case_('the slashless spelling matches too',
  to('/bitcoin-education/bitcoin-401') === '/archive/', to('/bitcoin-education/bitcoin-401'));

// ── Machinery is retired outright, and ONLY machinery ──
case_('/wp-login.php is 410 Gone', (d('/wp-login.php') || {}).gone === true);
case_('/xmlrpc.php is 410 Gone', (d('/xmlrpc.php') || {}).gone === true);
case_('410 is NOT spent on real content URLs',
  !['/bitcoin-education/bitcoin-401/', '/category/bitcoin/', '/wp-content/uploads/x.pdf']
    .some((p) => (d(p) || {}).gone),
  'a 410 still counts as 4xx in Bing crawl stats');

// ── And the half that matters most: live pages must be untouched ──
for (const p of ['/', '/writing/', '/writing/moscow-time/', '/archive/',
                 '/archive/bitcoin-101-what-is-bitcoin/', '/dash', '/connect',
                 '/verify', '/library', '/nostr/id/', '/rss.xml',
                 '/sitemap-index.xml', '/sitemap-0.xml',
                 '/.well-known/nostr.json', '/.well-known/lnurlp/rad']) {
  case_(`a live path is left alone: ${p}`, d(p) === null, JSON.stringify(d(p)));
}
// The prefix table must match on a path SEGMENT, never on a bare string prefix.
case_('a prefix does not swallow a longer sibling name',
  d('/tagline') === null && d('/authors-note') === null && d('/booksellers') === null,
  'startsWith() without the segment boundary would have caught these');

console.log(fails
  ? `\n${fails} check(s) FAILED`
  : '\nall negative controls pass — every legacy URL is retired, every live one untouched');
process.exit(fails ? 1 : 0);
