#!/usr/bin/env bash
#
# Driver för Aosom-importen. Anropar /api/cron/aosom-import om och om igen och
# matar tillbaka markören tills sortimentet är inne.
#
# VARFÖR ETT SKRIPT OCH INTE ETT ANROP
#
# 5 566 produkter bär 50 018 bilder, och varje bild är ett eget Wix-anrop. En
# serverless-rutt har 300 sekunder och hinner en bråkdel av svepet. Rutten
# stannar därför på sin tidsbudget och lämnar en markör; det här skriptet är
# bara loopen runt den. Avbryt när du vill (Ctrl-C) — nästa körning fortsätter
# där du slutade, och dubblettspärren gör en omkörning till en no-op.
#
# ANVÄNDNING
#
#   export BAS="https://din-app.vercel.app"
#   export CRON_SECRET="..."
#
#   ./tools/aosom/sweep.sh rökprov      # 3 produkter, skarpt — börja här
#   ./tools/aosom/sweep.sh torr         # hela sortimentet, skriver ingenting
#   ./tools/aosom/sweep.sh kör          # hela sortimentet, skarpt
#   ./tools/aosom/sweep.sh kör-lönsamma # hoppar över de 1 175 där frakten > varan
#
# Varje varv loggas till tools/aosom/sweep-log.jsonl så en avbruten körning går
# att granska i efterhand.

set -uo pipefail

BAS="${BAS:-}"
CRON_SECRET="${CRON_SECRET:-}"
LIMIT="${LIMIT:-150}"
LAGE="${1:-torr}"
LOGG="$(dirname "$0")/sweep-log.jsonl"

if [[ -z "$BAS" || -z "$CRON_SECRET" ]]; then
  echo "Sätt BAS och CRON_SECRET först. Se huvudet i den här filen." >&2
  exit 1
fi

DRY="true"
EXTRA=""
case "$LAGE" in
  rökprov)      DRY="false"; EXTRA="&sku=350-219V00PK,845-030CG,833-132V00BK" ;;
  torr)         DRY="true" ;;
  kör)          DRY="false" ;;
  kör-lönsamma) DRY="false"; EXTRA="&skipFreightHeavy=1" ;;
  *) echo "Okänt läge: $LAGE (rökprov | torr | kör | kör-lönsamma)" >&2; exit 1 ;;
esac

after=""
varv=0
totalt=0
fel=0

while :; do
  varv=$((varv + 1))
  url="${BAS}/api/cron/aosom-import?dryRun=${DRY}&limit=${LIMIT}${EXTRA}"
  [[ -n "$after" ]] && url="${url}&after=$(printf '%s' "$after" | sed 's/ /%20/g')"

  svar="$(curl -sS --max-time 310 -X POST "$url" -H "Authorization: Bearer ${CRON_SECRET}")"
  rc=$?
  if [[ $rc -ne 0 || -z "$svar" ]]; then
    echo "varv ${varv}: anropet failade (curl ${rc}) — väntar 30 s och försöker igen" >&2
    sleep 30
    continue
  fi

  printf '%s\n' "$svar" >> "$LOGG"

  las() { printf '%s' "$svar" | python3 -c "import sys,json;print(json.load(sys.stdin).get('$1',''))" 2>/dev/null; }
  ok="$(las ok)"
  if [[ "$ok" != "True" && "$ok" != "true" ]]; then
    echo "varv ${varv}: rutten svarade fel:" >&2
    printf '%s\n' "$svar" >&2
    exit 1
  fi

  imported="$(las imported)"
  failed="$(las failed)"
  remaining="$(las remaining)"
  stoppedBy="$(las stoppedBy)"
  after="$(las cursor)"
  totalt=$((totalt + ${imported:-0}))
  fel=$((fel + ${failed:-0}))

  echo "varv ${varv}: +${imported} (fel ${failed}) — ${remaining} kvar, stopp: ${stoppedBy}"

  # Tomt cursor-fält = allt är klart.
  if [[ -z "$after" || "$after" == "None" ]]; then
    echo "klart: ${totalt} produkter, ${fel} fel, ${varv} varv."
    break
  fi
  # Rökprovet ska gå EN gång, inte svepa.
  [[ "$LAGE" == "rökprov" ]] && { echo "rökprov klart: ${totalt} produkter."; break; }
done
