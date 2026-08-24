// Edge worker in front of the static site. Static assets are served first
// (the worker only runs for routes that match no asset), so everything here
// is additive API surface on the same domain.
//
// /.well-known/lnurlp/<name> — LUD-16 Lightning addresses on this domain.
// Thin proxy to the upstream wallet provider's lnurlp endpoint: the upstream
// JSON passes through VERBATIM (rewriting `metadata` would break wallets that
// validate the invoice description_hash against it, and `callback` must keep
// pointing at the provider, which actually generates invoices). Zap support
// (allowsNostr/nostrPubkey) flows through unchanged. Proxy, never redirect —
// wallet support for redirects is spotty.
//
// The NIP-05 endpoint (/.well-known/nostr.json) is a static asset and never
// reaches this worker.

// Swapping a name's backend is a one-line change here; the public address
// never changes.
const LNURLP_UPSTREAM = {
  // Cut over to our own sovereign LNbits node 2026-07-16 (was ZeusPay/Cashu).
  // Rollback = restore the ZeusPay line below.
  // rad: 'https://zeuspay.com/.well-known/lnurlp/intelligentdragon65',
  rad: 'https://ln.radvladdy.com/.well-known/lnurlp/rad',
};

// ── The dead WordPress structure, retired properly (2026-08-23) ─────────────
// WHY THIS EXISTS. The 2026-08-20 pass stripped every link *this site* emitted
// to the old WordPress URLs, and it worked: an internal crawl finds 119 pages
// and 0 broken links. It did nothing about the half of the problem that lives
// in Bing's memory rather than in our markup — Bing learned those URLs before
// the rebuild and still crawls them, and with no redirect map every one of them
// answered a bare 404. Bing's post-fix 4xx share was still 8 of 47 (17 %) over
// 08-20 → 08-23, against a 15 % alarm threshold.
//   📐 A 404 TEACHES A CRAWLER NOTHING. It means "not here, ask again later",
// so the URL stays in the crawl set and the same request comes back forever.
// A 301 retires it and hands its history to the successor; a 410 retires it
// outright. The distinction is the whole point of this block.
//   🗺️ THE OLD STRUCTURE, recovered from commit 4538f16 — the unlink pass is
// the only surviving inventory of what the WordPress site published, because
// its archive posts linked to it. Two of those URLs have an exact successor;
// the rest were curriculum and buying-guide pages that genuinely did not come
// across, and their nearest true successor is the archive index — the same
// era's writing, kept verbatim. That is a real relation, not a soft-404 dodge.
//   ⚠️ 410 IS USED SPARINGLY AND DELIBERATELY: only for machinery that was
// never content (`/wp-admin`, `/xmlrpc.php`, the login probe). A 410 still
// counts as 4xx in Bing's crawl stats, so spending it on real content URLs
// would leave the very number this block exists to bring down.

const LEGACY_EXACT = {
  // The two old URLs with a genuine one-to-one successor.
  '/bitcoin-education/bitcoin-101-what-is-bitcoin': '/archive/bitcoin-101-what-is-bitcoin/',
  '/long-term-investment-thesis-bitcoin/the-investment-case-for-bitcoin-vaneck':
    '/archive/the-investment-case-for-bitcoin-vaneck/',
  // Yoast published the sitemap at these two names for years, and they are what
  // every crawler and most SEO tooling probes by default before reading
  // robots.txt. Astro's integration emits /sitemap-index.xml.
  '/sitemap.xml': '/sitemap-index.xml',
  '/sitemap_index.xml': '/sitemap-index.xml',
  '/post-sitemap.xml': '/sitemap-index.xml',
  '/page-sitemap.xml': '/sitemap-index.xml',
  // WordPress's feed URLs. Readers still hold subscriptions to these.
  '/feed': '/rss.xml',
  '/comments/feed': '/rss.xml',
  '/rss': '/rss.xml',
};

// Whole sections of the old site. Everything under them lands on the archive
// index — the surviving body of that era's writing.
const LEGACY_PREFIXES = [
  '/bitcoin-education',
  '/buy-bitcoin',
  '/long-term-investment-thesis-bitcoin',
  '/books',
  '/podcasts',
  '/cashapp',
  // Top-level course and book pages, kept as exact stems rather than a broad
  // prefix so they cannot swallow a future real page.
  '/bitcoin-202-money-and-economics',
  '/bitcoin-203-the-origins-of-money-szabo',
  '/the-bitcoin-standard-the-decentralized-alternative-to-central-banking',
  // The WordPress taxonomy. These were listings OF the archived posts, so the
  // archive index is what they were listing.
  '/category',
  '/tag',
  '/author',
  // Old uploads — the three PDFs the unlink pass found, and anything else that
  // era served. No file survives, but the posts that cited them do.
  '/wp-content',
];

// Never content. Retired outright rather than redirected somewhere polite.
const LEGACY_GONE = [
  '/wp-admin', '/wp-includes', '/wp-json', '/wp-login.php', '/xmlrpc.php',
];

// Exported for `scripts/check-legacy-redirects.mjs`. A named export alongside
// the default is inert at runtime — the Workers runtime reads `default` and
// ignores the rest — and it is the difference between a redirect table that
// is tested and one that is merely believed.
export function legacyDisposition(pathname) {
  // Trailing slashes are how WordPress wrote every one of these; the current
  // site uses them too. Compare on the bare form so both spellings match.
  const bare = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (LEGACY_EXACT[bare]) return { to: LEGACY_EXACT[bare] };
  for (const p of LEGACY_GONE) {
    if (bare === p || bare.startsWith(p + '/')) return { gone: true };
  }
  for (const p of LEGACY_PREFIXES) {
    if (bare === p || bare.startsWith(p + '/')) return { to: '/archive/' };
  }
  return null;
}

const JSON_HEADERS = {
  'content-type': 'application/json',
  'access-control-allow-origin': '*',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const match = url.pathname.match(/^\/\.well-known\/lnurlp\/([a-z0-9\-_.]+)$/i);
    if (match) {
      const upstream = LNURLP_UPSTREAM[match[1].toLowerCase()];
      if (!upstream) {
        return new Response(
          JSON.stringify({ status: 'ERROR', reason: 'Unknown lightning address' }),
          { status: 404, headers: JSON_HEADERS },
        );
      }
      try {
        // no-store: payment parameters must be live — Cloudflare otherwise
        // edge-caches the upstream response.
        const res = await fetch(upstream + url.search, {
          headers: { accept: 'application/json' },
          cache: 'no-store',
        });
        return new Response(await res.text(), { status: res.status, headers: JSON_HEADERS });
      } catch {
        return new Response(
          JSON.stringify({ status: 'ERROR', reason: 'Upstream unavailable' }),
          { status: 502, headers: JSON_HEADERS },
        );
      }
    }
    // /api/nodes is GONE (2026-08-07). It proxied bitnodes.io for
    // /dash's reachable-node cell — CORS was the reason it needed a proxy at all —
    // and bitnodes.io no longer resolves anywhere, so the route could only ever
    // return null. The cell went with it; see the note in src/pages/dash.astro.

    // /nostr/<bech32 entity> — clean njump-style URLs for the nostr viewer.
    // No asset matches these paths, so the worker serves the /nostr/id shell;
    // the client script reads the identifier back out of location.pathname.
    if (/^\/nostr\/(npub|nprofile|note|nevent|naddr)1[02-9ac-hj-np-z]+\/?$/.test(url.pathname)) {
      return env.ASSETS.fetch(new URL('/nostr/id/', url));
    }
    // Legacy WordPress URLs. Checked LAST, immediately before the asset
    // fallthrough, so it can only ever act on a path that would otherwise have
    // 404'd — a real page always wins, and a future route named like an old one
    // is not silently hijacked.
    const legacy = legacyDisposition(url.pathname);
    if (legacy) {
      if (legacy.gone) {
        return new Response('410 Gone\n', {
          status: 410,
          headers: { 'content-type': 'text/plain; charset=utf-8' },
        });
      }
      return Response.redirect(new URL(legacy.to, url).toString(), 301);
    }

    return env.ASSETS.fetch(request);
  },
};
