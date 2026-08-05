#!/usr/bin/env bash
# Deploy radvladdy.com to Cloudflare. Run via: npm run deploy
#
# ONE PATTERN across every site repo. Same command name, same token handling,
# same shape, so there is one thing to fix rather than four. Exactly two things
# differ per repo and both are named right here:
#
#   TARGET      — a Worker (wrangler deploy) or a Pages direct upload
#   TOKEN_FILE  — the credential that target type actually accepts
#
# WHY THE TOKEN FILE IS NOT THE SAME EVERYWHERE. A Pages-scoped token CANNOT
# deploy a Worker — wrangler fails with `Authentication error [code: 10000]` —
# and the two token files here are scoped differently. Copying another repo's
# line without checking what this repo deploys to is a real bug that shipped
# once already, and it stayed invisible because every deploy happened to run
# with a working token already in the environment, so the fallback below was
# never the path that ran. If this file is ever edited, test it the way it is
# actually broken: run with CLOUDFLARE_API_TOKEN explicitly unset.
#
# This site is a WORKER (wrangler.jsonc: src/worker.js + dist/ as assets), so it
# needs the Workers-capable token.
#
# GitHub deploys nothing. Shipping is a deliberate act that follows verification.
set -euo pipefail
cd "$(dirname "$0")/.."

TOKEN_FILE="$HOME/secure/cloudflare-api-token"

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
