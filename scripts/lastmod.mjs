// Sitemap <lastmod> dates, resolved from GIT COMMIT HISTORY.
//
// WHY GIT AND NOT FILE MTIME. mtime is the time the file last landed on this
// disk, which is a property of the checkout rather than of the content. A fresh
// clone, a `git clean`, or (on timechain.wiki) a nightly content sync sets every
// mtime to "just now" — so every page would claim to have changed today, every
// day, forever. That is not a missing signal, it is a FALSE one: Google learns
// that a site's lastmod carries no information and starts ignoring the field
// site-wide, which is strictly worse than emitting no lastmod at all.
//
// A git commit date is the real answer to "when did this content last change",
// it is identical on every machine, and it survives re-cloning.
//
// WHY lastmod AT ALL: all four RadVladdy sites shipped bare `sitemap()`, so no
// sitemap carried a single lastmod. It is one of the signals Google uses to
// decide which discovered URLs to re-crawl and in what order.
//
// SHARED SCRIPT, ONE COPY PER REPO — only the ROUTES block at the bottom of
// urlToSources() may differ, the same convention scripts/check-pseudonymity.py
// follows. If you change the resolver, change it in every copy.

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

/**
 * `-c core.quotePath=false` IS LOAD-BEARING, not a style choice. By default git
 * renders any non-ASCII byte in a path as a backslash escape and wraps
 * the whole path in quotes, so a filename with an umlaut, an accent or a dash
 * from outside Latin-1 never matches a lookup key. Measured on timechain.wiki:
 * exactly 3 of 400 articles silently lost their lastmod — Bohm-Bawerk, Hulsmann
 * and Walras — and nothing failed, which is what makes it worth a comment.
 */

/**
 * Last commit date for every tracked path, from ONE `git log` pass.
 * `git log` walks newest-first, so the FIRST time a path appears is its most
 * recent commit — hence the `has()` guard rather than overwriting.
 * NUL-prefixing the date line is what makes it distinguishable from a filename;
 * a filename can contain almost anything else, including spaces and colons.
 */
function gitDates() {
  const out = execSync('git -c core.quotePath=false log --format=%x00%cI --name-only --no-renames', {
    maxBuffer: 256 * 1024 * 1024,
    encoding: 'utf8',
  });
  const dates = new Map();
  let current = null;
  for (const line of out.split('\n')) {
    if (line.startsWith('\0')) { current = line.slice(1).trim(); continue; }
    const path = line.trim();
    if (path && current && !dates.has(path)) dates.set(path, current);
  }
  return dates;
}

/** `https://site/a/b/` -> `/a/b` (no trailing slash, no origin). */
function pathOf(url, siteUrl) {
  let p = url.startsWith(siteUrl) ? url.slice(siteUrl.length) : url;
  try { p = new URL(url).pathname; } catch { /* already a path */ }
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p || '/';
}

/**
 * Candidate source files for a route, most specific first.
 * A route backed by a content collection resolves to the MARKDOWN FILE, so a
 * post edit moves that one page's lastmod and nothing else. Static routes
 * resolve to their .astro file.
 */
function urlToSources(p) {
  if (p === '/') return ['src/pages/index.astro'];
  const clean = p.replace(/^\//, '');
  const segments = clean.split('/');
  const candidates = [
    `src/pages/${clean}.astro`,
    `src/pages/${clean}/index.astro`,
  ];
  // ROUTES — repo-specific. Collection-backed routes: /writing/<slug> and
  // /archive/<slug> render one markdown file each.
  if (segments.length === 2 && ['writing', 'archive'].includes(segments[0])) {
    candidates.unshift(`src/content/${segments[0]}/${segments[1]}.md`);
  }
  return candidates;
}

export function buildLastmod(siteUrl) {
  const dates = gitDates();
  // A dynamic route's own template is the floor for pages it generates: if the
  // template changed more recently than the content, the rendered page did too.
  const templateDate = (p) => {
    const seg = p.replace(/^\//, '').split('/')[0];
    return dates.get(`src/pages/${seg}/[slug].astro`);
  };
  const newer = (a, b) => (!a ? b : !b ? a : (a > b ? a : b));

  return (item) => {
    const p = pathOf(item.url, siteUrl);
    let date;
    for (const c of urlToSources(p)) {
      if (existsSync(c) && dates.has(c)) { date = dates.get(c); break; }
    }
    date = newer(date, templateDate(p));
    // No date resolved => emit NO lastmod for this URL rather than a guess.
    // A sitemap may carry lastmod on some entries and not others; inventing one
    // is the failure this whole file exists to avoid.
    return date ? { ...item, lastmod: date } : item;
  };
}
