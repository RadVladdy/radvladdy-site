# radvladdy.com

Personal site of RadVladdy — writing, projects, and signal from the Bitcoin
frontier.

## Stack

- [Astro](https://astro.build) static build → `dist/`
- Cloudflare Worker with static assets binding (`wrangler.jsonc`); the worker
  (`src/worker.js`) adds `/.well-known/lnurlp/*` (Lightning address proxy) on
  top of the static site
- Self-hosted NIP-05 at `public/.well-known/nostr.json` (CORS via
  `public/_headers`)

## Develop

```sh
npm install
npm run dev      # local dev server
npm run build    # production build → dist/
```

Deploys to Cloudflare on push to `main`.

## Status

Phase A: interim one-pager (this). Phase B: full site — writing (essays,
signal, recommendations), Nostr feed, chain dashboard.
