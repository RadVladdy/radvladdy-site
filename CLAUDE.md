# radvladdy.com — build & design conventions

Astro static one-pager (Phase A), deployed to Cloudflare on push to `main`.
This is the **person** site (RadVladdy) — cousin of bitcoineconomy.ai (the
brand site), deliberately grittier and more personal.

## Pseudonymity — non-negotiable

This is a pseudonymous site. Commit as
`RadVladdy <30393919+RadVladdy@users.noreply.github.com>` (verify
`git config user.name` before committing — never the global identity). No
real-world identity, no real names, no local absolute paths (`/Users/…`) in
committed files. Leak-scan the diff before every commit.

## Design tokens (locked, Phase A)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0b0f14` | page background |
| `--panel` | `#11161d` | cards, skyline |
| `--line` | `#1f2630` | borders |
| `--text` | `#e6edf3` | primary text |
| `--dim` | `#8b949e` | muted text |
| `--cyan` | `#22d3ee` | signature accent (the avatar's eye) |
| `--orange` | `#f7931a` | bitcoin-specific elements, sparingly |
| `--green` | `#39d353` | terminal/chain data only (ticker, dashboard) |

All-mono typography (system mono stack — no webfonts, no third-party
requests). Motifs: prompt-style header (`rad@radvladdy:~$`), blinking cursor,
film grain overlay, glitch-on-hover wordmark, the **hero video backdrop**
(rainy street scene, `public/videos/hero.mp4`) under a heavy dark overlay
(the `.hero-band::after` gradient — keep text-over-video contrast high), and
the flat SVG skyline strip as a foreground silhouette with flickering
windows. Only external call: mempool.space API for the ticker (client-side).

Hero video rules: **desktop-only** (the inline script gates on
`min-width: 700px`, `prefers-reduced-motion`, and `saveData` — mobile and
reduced-motion users get the static `images/hero-still.jpg`, which is a frame
of the same video, so the looks match). Always `muted loop playsinline
preload="none"`; never autoplay audio. Keep the file ≲6 MB (current: 960×540
H.264 via `avconvert --preset Preset960x540`). `images/skyline.jpg` (golden
Bitcoin-moon panorama) is an unused-but-kept asset — og-banner / Phase B
candidate.

## Identity rails

- NIP-05: `public/.well-known/nostr.json` — `_` and `rad` → the RadVladdy
  pubkey. Served static; CORS header in `public/_headers`; must never redirect.
- Lightning address `rad@radvladdy.com`: `src/worker.js` lnurlp proxy →
  upstream is a ZEUS Pay ecash (Cashu) address — always-on receive via the
  mint, zap receipts via `allowsNostr`. Backend swap = one line in
  `LNURLP_UPSTREAM`; the public address never changes.
- The canonical person-string is **`rad@`** (it's Rad Vladdy), locked
  2026-06-10. `_@` also maps for the bare-domain NIP-05 badge.

## The /nostr viewer (njump replacement)

Self-hosted, client-side, zero dependencies: `public/js/nostr.js` (bech32/
NIP-19 codec + relay pool + query helpers) and `public/js/nostr-view.js`
(rendering + views), styled by `public/css/nostr.css`. `/nostr` is the
profile home; `/nostr/<npub|nprofile|note|nevent|naddr>` renders any entity —
the worker rewrites those paths to the `/nostr/id` shell (no asset matches
them). Dev fallback without the worker: `/nostr/id/?id=<bech32>`. Relays:
nos.lol / damus / primal. Display-only — no client-side signature
verification (v2 = worker-side SSR). Never link njump.me from this site.

**Essay comments ride the same machinery:** `src/data/nostr-posts.js` maps
essay slug → nostr pointer (naddr/nevent) once an essay is cross-posted as
NIP-23; an entry lights up `~/comments` on that essay's page. The map lives
outside the essay files because stamped posts are immutable (below) — never
add nostr pointers to post frontmatter after publication.

## OG cards

Per-post 1200x630 dark cards in `public/og/`, generated LOCALLY by
`npm run og` (`scripts/og-cards.mjs`, needs macOS Menlo — never runs in CI)
and committed. Regenerate when a post's title/subtitle changes or a new post
ships. Non-post pages fall back to `images/skyline.jpg` via the layout's
`ogImage` default.

## Stamped posts are immutable

Every file in `src/content/writing/` is OpenTimestamps-stamped; the exact
stamped source + its `.ots` proof are served from `public/proofs/`. **Editing
a published post breaks its proof.** Material edits require: edit → re-stamp
→ replace both files in `public/proofs/` → disclose the revision in the post.
Typo-level edits: same mechanics, lighter disclosure. Periodically run
`ots upgrade` on the proofs once anchored and re-commit.

## Verify before push

`npm run build`, check `dist/`, leak-scan, then push (= live deploy).
