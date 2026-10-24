#!/bin/bash
# live-alla-kombinationer.sh <planmapp> <utkatalog> <id8>...: mäter varje sida i en riktig webbläsare, en kombination i taget, och jämför med planens ägare (ren läsning).
#
#   tools/polish-gates/live-alla-kombinationer.sh tools/polish-assets/tva-axlar-revision-2026-10-23 /tmp/live 926ec7a2 79ab08fe c3d1fa41
#
# <planmapp> har `agare-<id8>.json` (planerna för bygg-agare.py, med `slug`). <utkatalog> får `live-<id8>.txt` med webbläsarens utskrift (finns kvar för felsökning).
# Per sida: live-galleri.mjs, och om första raden är `KORT` (färgen väljs med kort) live-galleri-kortfarg.mjs, sedan verifiera-live.py. Sidor där BÅDA axlarna är kort
# ger inga kombinationer här ("inga kombinationer lästes"): kör live-galleri-kort.mjs på dem och verifiera-live.py för hand.
#
# Tar ungefär 15–25 sekunder per sida, och sidorna körs efter varandra. Kör gärna tre rundor parallellt (olika id8) när det är många sidor: de delar inget.
# ☠️ Butikens cache fylls på var femte minut efter en skrivning i Wix. Ett ☠️ strax efter en skrivning är oftast en gammal sida: mät om efter några minuter.
HERE="$(cd "$(dirname "$0")" && pwd)"
if [ "$#" -lt 3 ]; then
  sed -n '2,10p' "$0" | sed 's/^# \{0,1\}//'
  exit 2
fi
P="$1"
UT="$2"
shift 2
mkdir -p "$UT" || exit 1
FEL=0
for id8 in "$@"; do
  slug=$(python3 -I -c "import json,sys;print(json.load(open(sys.argv[1],encoding='utf-8'))[0]['slug'])" "$P/agare-$id8.json") || { echo "== $id8 saknar plan eller slug"; FEL=1; continue; }
  timeout 150 node "$HERE/live-galleri.mjs" "$slug" > "$UT/live-$id8.txt" 2>&1
  if grep -q '^KORT' "$UT/live-$id8.txt"; then timeout 170 node "$HERE/live-galleri-kortfarg.mjs" "$slug" > "$UT/live-$id8.txt" 2>&1; fi
  echo "== $id8 $slug"
  python3 -I "$HERE/verifiera-live.py" "$P/agare-$id8.json" "$UT/live-$id8.txt" | sed 's/^/   /'
  [ "${PIPESTATUS[0]}" -eq 0 ] || FEL=1
done
echo "KLART $(date -u +%H:%M:%S) UTC"
exit $FEL
