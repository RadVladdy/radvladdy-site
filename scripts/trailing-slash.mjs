// Internal links are normalised to the trailing-slash form at RENDER time.
//
// WHY AT RENDER TIME AND NOT IN THE SOURCE. Every file in src/content/writing/
// is OpenTimestamps-stamped: the stamped bytes and the .ots proof are served
// from public/proofs/, and editing a published post breaks its proof. Twelve
// links in eight stamped essays name the slashless form (`/archive`,
// `/writing/the-widow-test`, …), and this site's Worker answers 307 — a
// TEMPORARY redirect — between the two forms. _Standards-Projects § "How every
// site talks to Google" records why that is load-bearing: a link/sitemap
// mismatch is cosmetic behind a 308 and load-bearing behind a 307. Fixing the
// href in the rendered HTML fixes the crawl path and leaves the stamped source
// byte-identical, so every proof holds. Found 2026-09-14, when the 08-15 slash
// fix turned out to have missed the archive index as well.
//
// `slashHref` is pure and exported so scripts/check-internal-links.mjs can
// apply the same rule to the built output — one definition of "the canonical
// form", two places that enforce it.

const SITE = 'https://radvladdy.com';

// /nostr/<bech32 entity> is a Worker rewrite that accepts BOTH forms and
// redirects neither (src/worker.js), so there is no 307 to remove and the
// client-side viewer reads the entity off the path. Left exactly as written.
const NOSTR_ENTITY = /^\/nostr\/(npub|nprofile|note|nevent|naddr)1[02-9ac-hj-np-z]+$/;

export function slashHref(href) {
  if (typeof href !== 'string') return href;
  let prefix = '';
  let rest = href;
  if (rest.startsWith(SITE + '/')) {
    prefix = SITE;
    rest = rest.slice(SITE.length);
  } else if (!rest.startsWith('/') || rest.startsWith('//')) {
    return href; // external, protocol-relative, relative, mailto:, #hash-only
  }
  const m = /^([^?#]*)(.*)$/.exec(rest);
  const path = m[1];
  const tail = m[2];
  if (path === '' || path.endsWith('/')) return href;
  if (NOSTR_ENTITY.test(path)) return href;
  const last = path.slice(path.lastIndexOf('/') + 1);
  if (last.includes('.')) return href; // a file: .xml .json .png .md .ots .js
  return `${prefix}${path}/${tail}`;
}

// A rehype plugin with no dependencies: walk the hast tree, fix every <a href>.
export function rehypeTrailingSlash() {
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'element' && node.tagName === 'a' && node.properties
        && typeof node.properties.href === 'string') {
      node.properties.href = slashHref(node.properties.href);
    }
    if (Array.isArray(node.children)) node.children.forEach(walk);
  };
  return (tree) => walk(tree);
}
