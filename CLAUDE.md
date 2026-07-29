# radvladdy.com — build & design conventions

Astro static one-pager (Phase A), deployed to Cloudflare. **Pushing to `main`
does not deploy** — see "Deploying" below.
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
| `--orange` | `#f7931a` | bitcoin-specific elements + chain-data values (ticker, /dash) |
| `--green` | `#39d353` | status accents only (live pills, archive badges) |

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

## Project marks (the `~/projects` cards)

Each live card carries that site's own logo from `public/images/logo-*.png`,
30px tall, left of the name; the status pill sits on its own right-aligned
line above it (it cannot share the name's row — at 3-up card width the pill
gets clipped). **Copy the artwork in; never hotlink another site's logo** —
the no-third-party-requests rule applies to images too. Sibling repos are the
source: `~/dev/{bitcoineconomy-ai,bitcoinkeys-guide,timechain-wiki-astro}`.
Two caveats learned the hard way: a favicon is usually a *tile crop*, so it
clips artwork that runs to the edge (timechain's sunburst) — prefer the
transparent logo and size up; and a wide mark whose glyph fills less of its
height needs a few px more than 30 to sit level with the others (`.logo.tall`
34px, `.logo.rays` 40px).

**timechain's mark — settled 2026-07-29.** The card runs the **no-sunburst**
`logo-timechain.png` (`.logo.tall`, 46x34). The full sunburst variant
(`logo-timechain-rays.png`, `.logo.rays`, 42x40) was tried at 40px and
reverted: its rays are hairline and pale, so at card size they don't resolve
into detail — they read as haze around the glyph, and the mark looks dimmer
and busier than the flat, single-weight ₿ marks on the other two cards. The
rays file is kept for a one-line revert; the swap is spelled out in a comment
above the `<img>` in `src/pages/index.astro`. General lesson for this row:
**a mark that carries fine linework loses to a bold one at 40px** — pick the
simplified variant.

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
ships.

**Generate on a Mac or not at all.** `wrap()` sizes lines from a hardcoded
Menlo advance width (`CHAR_W = 0.602`), so a substitute font keeps Menlo's
line breaks while drawing different glyph widths — and the prompt's `▮`
(U+25AE) plus the subtitle italic simply may not exist in the fallback. The
Least-American card was generated with JetBrains Mono on the headless box and
shipped a missing-glyph box where the cursor belongs, with the subtitle
upright instead of italic.

Subtitles are capped at **two lines** — a third lands at y=506 and collides
with the byline at y=512 — so long ones step 27px → 25px → 23px to fit. Before
that stepdown existed, a long subtitle was silently truncated mid-sentence. Non-post pages fall back to `images/skyline.jpg` via the layout's
`ogImage` default.

## Stamped posts are immutable

Every file in `src/content/writing/` is OpenTimestamps-stamped; the exact
stamped source + its `.ots` proof are served from `public/proofs/`. **Editing
a published post breaks its proof.** Material edits require: edit → re-stamp
→ replace both files in `public/proofs/` → disclose the revision in the post.
Typo-level edits: same mechanics, lighter disclosure. Periodically run
`ots upgrade` on the proofs once anchored and re-commit.

## Deploying

**Workers Builds CI has never fired — nine pushes, nine no-ops.** Treat `git
push` as source control only; it publishes nothing. The real deploy is:

```
source ~/.secrets/bea-cloudflare.env
npm run build && npx wrangler deploy
```

**Then verify every new or changed asset over the wire.** `wrangler` has
reported a clean success while silently skipping a brand-new file, so a green
deploy log is not evidence. `curl -sI` each changed URL and compare the served
`content-length` against the local byte size — matching sizes, not a 200, is
what proves the upload landed.

## Verify before push

`npm run build`, check `dist/`, leak-scan, deploy (above), verify over the
wire, then push.
