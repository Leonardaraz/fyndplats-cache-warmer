#!/bin/bash
# usage: commit_push.sh "<commit-meddelande>" <rundkatalog> [<rundkatalog> ...]
# Lägger bara till filerna i rundkatalogens rot (inte ark/, orig/ eller skriv/) och pushar grenen.
set -e
REPO=/home/user/fyndplats-cache-warmer
cd $REPO
MSG="$1"; shift
for r in "$@"; do
  d=tools/polish-assets/$r
  find $d -maxdepth 1 -type f \( -name '*.tsv' -o -name '*.txt' -o -name '*.json' -o -name '*.html' \) -print0 | xargs -0 git add --
done
git commit -q -m "$MSG

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_014sbYs9fJmaJfbnMG9apXbq"
for i in 1 2 3 4; do
  if git push -q -u origin claude/seo-polering-runbook-review-uq6fwl; then break; fi
  sleep $((2**i))
done
git log --oneline -1
