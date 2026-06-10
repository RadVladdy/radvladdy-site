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
  rad: 'https://zeuspay.com/.well-known/lnurlp/intelligentdragon65',
};

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
    return env.ASSETS.fetch(request);
  },
};
