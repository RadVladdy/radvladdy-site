#!/usr/bin/env node
// Pre-deploy gate: no page in dist/ may link an internal URL in the form the
// Worker redirects away from.
//
// WHY A GATE AND NOT A FIX. The 2026-08-15 fix removed the slashless links from
// the nav and shipped with them still in the generated essay links; a second
// pass fixed those and shipped with the archive index — all 30 posts — still
// slashless, under a layout comment that said the matter was handled. Twice a
// fix looked complete because the check was "the places we remembered". This
// reads EVERY href on EVERY built page against the one rule in
// scripts/trailing-slash.mjs, so a third miss cannot deploy.
//
// Run: node scripts/check-internal-links.mjs            (after `astro build`)
//      node scripts/check-internal-links.mjs --selftest (offline negative controls)
import fs from 'node:fs';
import path from 'node:path';
import { slashHref } from './trailing-slash.mjs';

const HREF = /href="([^"]*)"/g;

export function offenders(html) {
  const out = [];
  for (const m of html.matchAll(HREF)) {
    const h = m[1];
    if (slashHref(h) !== h) out.push(h);
  }
  return out;
}

function* htmlFiles(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* htmlFiles(p);
    else if (e.name.endsWith('.html')) yield p;
  }
}

function selftest() {
  let fails = 0;
  const case_ = (name, ok, detail = '') => {
    if (!ok) fails++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
  };
  case_('a slashless internal link is FLAGGED',
    offenders('<a href="/archive/intro">x</a>').length === 1);
  case_('a slashless absolute self-link is FLAGGED',
    offenders('<a href="https://radvladdy.com/writing/moscow-time">x</a>').length === 1);
  case_('a slashless link with a hash is FLAGGED and the hash survives the fix',
    slashHref('/verify#proofs') === '/verify/#proofs');
  case_('a slashless link with a query is FLAGGED and the query survives',
    slashHref('/writing/x?y=1') === '/writing/x/?y=1');
  case_('the canonical form is left alone',
    offenders('<a href="/archive/intro/">x</a>').length === 0);
  case_('a file is left alone', offenders('<a href="/rss.xml">x</a><a href="/og/x.png">y</a>').length === 0);
  case_('an external link is left alone',
    offenders('<a href="https://bitcoineconomy.ai/x">x</a>').length === 0);
  case_('a protocol-relative link is left alone', offenders('<a href="//x.test/y">x</a>').length === 0);
  case_('a hash-only link is left alone', offenders('<a href="#top">x</a>').length === 0);
  case_('a mailto is left alone', offenders('<a href="mailto:rad@radvladdy.com">x</a>').length === 0);
  case_('the root is left alone', offenders('<a href="/">x</a>').length === 0);
  case_('a /nostr/<entity> link is left alone — the Worker serves both forms and redirects neither',
    offenders('<a href="/nostr/npub10ye7ap5xas4v0gxpzn8lfp2dvkgykz6pwsu2u6c0x4q0e2tk43ys6mh5n5">x</a>').length === 0);
  case_('...but a /nostr/ PAGE that is not an entity is still held to the rule',
    slashHref('/nostr') === '/nostr/');
  // The real shapes this gate exists for, verbatim from the site as found 2026-09-14.
  case_('the archive index shape (30 posts) is FLAGGED',
    offenders('<a class="list-item" href="/archive/the-number-zero-and-bitcoin">').length === 1);
  case_('the in-essay shape is FLAGGED',
    offenders('an inheritance plan decays exactly like <a href="/writing/your-zaps-are-probably-broken">everything else</a>').length === 1);
  console.log();
  if (fails) { console.log(`${fails} negative control(s) FAILED`); return 1; }
  console.log('all negative controls pass — every check above can go red, and does');
  return 0;
}

function main() {
  if (process.argv.includes('--selftest')) return selftest();
  const dist = path.resolve('dist');
  if (!fs.existsSync(dist)) {
    console.error('check-internal-links: no dist/ — run `astro build` first. A gate that reads nothing must not pass.');
    return 2;
  }
  let pages = 0;
  const found = new Map();
  for (const f of htmlFiles(dist)) {
    pages++;
    for (const h of offenders(fs.readFileSync(f, 'utf8'))) {
      if (!found.has(h)) found.set(h, []);
      found.get(h).push(path.relative(dist, f));
    }
  }
  if (pages === 0) {
    console.error('check-internal-links: dist/ holds no HTML — refusing to pass on an empty read.');
    return 2;
  }
  if (found.size) {
    console.error(`check-internal-links: ${found.size} internal href(s) in the form the Worker 307s, across ${pages} pages:`);
    for (const [h, files] of [...found.entries()].sort()) {
      console.error(`  ${h}  ← ${files.length} page(s), e.g. ${files[0]}`);
    }
    console.error('Fix the emitting template, or the rule in scripts/trailing-slash.mjs if the form is deliberate.');
    return 1;
  }
  console.log(`check-internal-links: clean — ${pages} pages, every internal href names the canonical form`);
  return 0;
}

process.exit(main());
