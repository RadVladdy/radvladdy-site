#!/usr/bin/env bash
# Deploy radvladdy.com to Cloudflare. Run via: npm run deploy
#
# ONE PATTERN across every site repo. Same command name, same token, same file,
# so there is one thing to fix rather than four. Only the deploy command itself
# differs, according to what this site IS — here, a Worker (wrangler.jsonc:
# src/worker.js + dist/ as assets).
#
# THE TOKEN IS THE SAME IN ALL FOUR REPOS and that is deliberate. Until
# 2026-08-05 there were two half-scoped Cloudflare tokens, one that could deploy
# Pages and one that could deploy Workers, so the correct credential depended on
# what a repo shipped to. Copying a sibling repo's token line then produced a
# deploy that could never authenticate (`Authentication error [code: 10000]`) —
# and it stayed invisible because every deploy happened to run with a working
# token already exported in the environment, so the fallback below was never once
# the path that actually ran. One token with both scopes removes the whole class.
#
# If this file is ever edited, test it the way it actually breaks: run it with
# CLOUDFLARE_API_TOKEN explicitly unset, so the fallback IS the path that runs.
#
# GitHub deploys nothing. Shipping is a deliberate act that follows verification.
set -euo pipefail
cd "$(dirname "$0")/.."

TOKEN_FILE="$HOME/secure/cloudflare-deploy-token"

if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  if [ -f "$TOKEN_FILE" ]; then
    CLOUDFLARE_API_TOKEN="$(tr -d '\n\r ' < "$TOKEN_FILE")"
    export CLOUDFLARE_API_TOKEN
  else
    echo "ERROR: set CLOUDFLARE_API_TOKEN or provide $TOKEN_FILE" >&2
    exit 1
  fi
fi

npx wrangler deploy

echo "── deployed. Verify on the live domain before calling it done."

# ── Drop the edge cache, then PROVE the edge matches origin ───────────────────
# A green wrangler log plus a stale edge is indistinguishable from a fix that
# does not work. It happened here twice — the 2026-08-15 canonical fix and the
# 2026-08-20 archive-404 fix — and both times the live site served the OLD HTML
# under `cf-cache-status: HIT` while the origin was already correct. Both times
# it was purged by hand afterwards, by someone who thought to check.
#
# The lesson was written down the first time and changed nothing, because it was
# recorded as knowledge and never wired as behaviour. This is the wiring.
#
# ⚠️ IT RUNS BEFORE INDEXNOW ON PURPOSE. Telling six search engines to come and
# index right now, while the edge is still handing out the previous version, is
# worse than not telling them — it banks the stale page.
#
# A failure here must NOT fail the deploy: the site is already live, and the
# fault this reports is a cache, not a bad ship. But it must not be silent, and
# `cf-purge verify` is the half that can actually go red — it compares a
# cache-busted fetch against an ordinary one, because a plain check can be
# answered by the very cache it is meant to catch.
"$HOME/bin/cf-purge" deploy radvladdy.com || echo "── ⚠️ CACHE PURGE/VERIFY FAILED — the deploy itself was fine. Do not call it live until: cf-purge deploy radvladdy.com"

# ── Tell the non-Google engines, immediately ──────────────────────────────────
# IndexNow reaches Bing, Yandex, Naver, Seznam.cz, Yep and DuckDuckGo in one
# call. NOT Google, which declined to adopt it — Google discovers this deploy on
# its own schedule and nothing here changes that.
#
# It lives HERE rather than in the nightly wrapper for the reason this file's own
# header gives about the deploy itself: the automated and manual paths must not
# drift into two implementations. Every route that ships this site runs this line.
#
# ⚠️ A FAILURE HERE MUST NOT FAIL THE DEPLOY — the site is already live and
# rolling that back over a search-engine ping would be absurd. But it must not be
# SILENT either, so it prints loudly and records the result to
# ~/.local/state/indexnow.json, which is what a staleness check reads later.
# Absolute path: cron's PATH does not include ~/bin.
"$HOME/bin/indexnow" submit radvladdy.com || echo "── ⚠️ IndexNow submission FAILED (the deploy itself was fine; run: indexnow check)"
