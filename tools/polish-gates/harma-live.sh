#!/bin/bash
# harma-live.sh <slugs.txt> <utkatalog> [id8 ...]: mäter sidorna i en riktig webbläsare, en kombination i taget (ren läsning, 2026-10-24).
#
#   tools/polish-gates/harma-live.sh slugs.txt /tmp/live              # alla sidor i slugs.txt, tre åt gången
#   tools/polish-gates/harma-live.sh slugs.txt /tmp/live 3b868848 c841717c
#
# <slugs.txt> har en rad per sida: "<åtta första tecknen i Wix-id> <slug>". <utkatalog> får `live-<id8>.txt` med webbläsarens utskrift (KOMBO-rader).
# Per sida: live-galleri.mjs (färgrutor och knappar). Börjar utskriften med `KORT` (färgen väljs med kort) tas live-galleri-kortfarg.mjs, och ger ingen av dem några kombinationer
# (båda axlarna är kort) tas live-galleri-kort.mjs. Jämförelsen mot butikens modell görs av harma-kolla.py med --live <utkatalog>.
# Tar 15–25 sekunder per sida; tre sidor körs samtidigt. ☠️ Butikens cache fylls på var femte minut efter en skrivning i Wix: mät inte förrän `age` på sidan är lägre än tiden sedan skrivningen.
HERE="$(cd "$(dirname "$0")" && pwd)"
if [ "$#" -lt 2 ]; then
  sed -n '2,10p' "$0" | sed 's/^# \{0,1\}//'
  exit 2
fi
SLUGS="$1"
UT="$2"
shift 2
mkdir -p "$UT" || exit 1
if [ "$#" -eq 0 ]; then set -- $(awk '{print $1}' "$SLUGS"); fi
en() {
  id8="$1"
  slug=$(awk -v i="$id8" '$1==i {print $2}' "$SLUGS")
  [ -n "$slug" ] || { echo "== $id8 saknar slug"; return 1; }
  timeout 150 node "$HERE/live-galleri.mjs" "$slug" > "$UT/live-$id8.txt" 2>&1
  if grep -q '^KORT' "$UT/live-$id8.txt"; then timeout 170 node "$HERE/live-galleri-kortfarg.mjs" "$slug" > "$UT/live-$id8.txt" 2>&1; fi
  if ! grep -q '^KOMBO' "$UT/live-$id8.txt"; then timeout 170 node "$HERE/live-galleri-kort.mjs" "$slug" > "$UT/live-$id8.txt" 2>&1; fi
  echo "== $id8 $(grep -c '^KOMBO' "$UT/live-$id8.txt") kombinationer"
}
export -f en
export HERE SLUGS UT
printf '%s\n' "$@" | xargs -P 3 -I{} bash -c 'en {}'
echo "KLART $(date -u +%H:%M:%S) UTC"
