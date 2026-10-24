#!/bin/bash
# bort.sh <id8>: tar bort korten på EN sida med bilder-bort.yml: torrt först, sedan skarpt med planens sha (aldrig med en sha som skrivits av).
# Läser den fulla sidan ur agare_<id8>.json och filerna ur bort_<id8>.txt (båda byggda av bygg.py). Loggar till ${BORT_LOGG:-/tmp/bort-logg}/<id8>.log.
# Kör från repots rot. ☠️ Kör aldrig två sidor samtidigt (kor_wf.py kopplar annars ihop fel körning): använd kedja.sh.
ID8="$1"
[ -n "$ID8" ] || { sed -n '2,4p' "$0"; exit 2; }
R="$(cd "$(dirname "$0")" && pwd)"
UT="${BORT_LOGG:-/tmp/bort-logg}"
mkdir -p "$UT"
exec > "$UT/$ID8.log" 2>&1
cd "$R/../../.." || exit 1
FULL=$(python3 -I -c "import json,sys;print(json.load(open(sys.argv[1]))[0]['id'])" "$R/agare_$ID8.json")
BILDER=$(tr -d '\n' < "$R/bort_$ID8.txt")
echo "sida $FULL"; echo "bilder $BILDER"
python3 tools/polish-kedja/kor_wf.py bilder-bort.yml main "sida=$FULL" "bilder=$BILDER" skarp=nej > "$UT/${ID8}_torr.json"
cat "$UT/${ID8}_torr.json"
RUN=$(python3 -I -c "import json,sys;print(json.load(open(sys.argv[1]))['id'])" "$UT/${ID8}_torr.json")
OK=$(python3 -I -c "import json,sys;print(json.load(open(sys.argv[1])).get('conclusion'))" "$UT/${ID8}_torr.json")
J=$(gh api repos/Leonardaraz/fyndplats-cache-warmer/actions/runs/$RUN/jobs --jq '.jobs[0].id')
gh api repos/Leonardaraz/fyndplats-cache-warmer/actions/jobs/$J/logs 2>/dev/null | sed 's/\x1b\[[0-9;]*m//g' > "$UT/${ID8}_torr.txt"
grep -E "^[0-9T:.Z-]* ?(plan:|  val |  hinder|sha:|Torrk)" "$UT/${ID8}_torr.txt" | sed 's/^[^ ]*Z //'
SHA=$(grep -o 'sha: [0-9a-f]\{64\}' "$UT/${ID8}_torr.txt" | tail -1 | grep -o '[0-9a-f]\{64\}$')
if [ "$OK" != "success" ] || [ -z "$SHA" ]; then echo "TORRKÖRNINGEN FALLT eller saknar sha: $OK"; exit 1; fi
python3 tools/polish-kedja/kor_wf.py bilder-bort.yml main "sida=$FULL" "bilder=$BILDER" skarp=ja "bekrafta=$SHA" > "$UT/${ID8}_skarp.json"
cat "$UT/${ID8}_skarp.json"
RUN2=$(python3 -I -c "import json,sys;print(json.load(open(sys.argv[1]))['id'])" "$UT/${ID8}_skarp.json")
J2=$(gh api repos/Leonardaraz/fyndplats-cache-warmer/actions/runs/$RUN2/jobs --jq '.jobs[0].id')
gh api repos/Leonardaraz/fyndplats-cache-warmer/actions/jobs/$J2/logs 2>/dev/null | sed 's/\x1b\[[0-9;]*m//g' | sed 's/^[^ ]*Z //' | grep -E "^(plan:|  val|steg:|klart:|sha:|::error)"
