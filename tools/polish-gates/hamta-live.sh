#!/bin/bash
# HAMTA LIVE-SIDORNA at livegrind.py — ISR-medvetet.
#
# ⚠️ VANTA UT BUTIKENS ISR-CACHE. Sidorna ar prerenderade
# (x-nextjs-stale-time: 300). En hamtning direkt efter skrivningen serverar
# den GAMLA sidan, och den ser ut precis som en fungerande ny — samma falla
# som recensionsverifieringen gick i. Forsta traffen efter fonstret triggar
# en BAKGRUNDSRENDERING; NASTA hamtning far den farska sidan. `?cb=` hjalper
# inte: den kringgar inte ISR, den ger bara en ny cache-nyckel.
#
# Darav tva svep: en varm traff som triggar renderingen, en paus, sedan den
# skarpa hamtningen. `age` i svaret ska vara UNGEFAR pausens langd — da vet
# man att man laser renderingen den varma traffen utloste, och inte en aldre
# cachad sida.
#
# ☠️ HTTP-koden skrivs ut for varje sida. En hamtning som far 000
# (anslutningsfel) lamnar en TOM fil, och en tom fil ser for ett sidsvep ut
# precis som en ren sida. Las koderna innan du litar pa grinden.
#
# ANVANDNING (kor fran batch-katalogen):
#   bash ../../polish-gates/hamta-live.sh [pausSekunder]
#   slugs.txt: "p1 min-produkt-slug", en rad per PUBLICERAD produkt
#   -> live/p1.html ... som livegrind.py sedan laser

set -u
paus="${1:-60}"
mkdir -p live

# ☠️ EN VARM TRAFF TRIGGAR BARA OMRENDERING OM SIDAN REDAN AR INAKTUELL.
# Det har var skriptets tysta bugg fram till 2026-09-06: en sida som renderats
# for 130 sekunder sedan ar FARSK (stale-time 300), sa traffen serverade den
# rakt av och startade ingenting. Pausen gick, den skarpa hamtningen fick samma
# gamla sida — och grinden jamforde mot en rendering som var aldre an
# skrivningen. Uppmatt: age 281 pa alla atta sidor efter en 150-sekunders paus.
#
# Ratt ordning ar darfor: vanta tills sidan HUNNIT bli inaktuell, traffa den DA
# (det ar traffen som startar omrenderingen), och las forst efter pausen.
STALE=300
echo "== varm traff (triggar bakgrundsrendering) =="
while read -r pid slug; do
  [ -z "${pid:-}" ] && continue
  hdr=$(curl -s -D - -o /dev/null "https://www.fyndplats.se/produkt/$slug")
  code=$(printf '%s' "$hdr" | grep -iE '^HTTP/' | tail -1 | awk '{print $2}')
  age=$(printf '%s' "$hdr" | grep -i '^age:' | tr -d '\r' | tr -dc '0-9')
  age=${age:-0}
  if [ "$age" -lt "$STALE" ]; then
    kvar=$((STALE - age + 5))
    echo "  $pid $slug  $code  age=$age — annu farsk, vantar ${kvar}s och traffar igen"
    sleep "$kvar"
    curl -s -o /dev/null "https://www.fyndplats.se/produkt/$slug"
  else
    echo "  $pid $slug  $code  age=$age — inaktuell, omrendering startad"
  fi
done < slugs.txt

sleep "$paus"

echo "== skarp hamtning =="
brist=0
while read -r pid slug; do
  [ -z "${pid:-}" ] && continue
  # ETT omforsok, och bara ett. En hamtning som ger 000 (anslutningsfel) eller
  # inte lyckas skriva sin fil ar det transienta fallet — 2026-09-06 kostade en
  # sadan miss hela atta-siders cykeln, alltsa tva minuters paus till, for en
  # sida som gick fram direkt nar den kordes om. Faller aven omforsoket star
  # AVBRYT-et kvar: grinda aldrig pa en ofullstandig hamtning.
  code=000; size=0; age=""
  for forsok in 1 2; do
    hdr=$(curl -s -D - -o "live/$pid.html" -w "%{http_code}" "https://www.fyndplats.se/produkt/$slug")
    code=$(printf '%s' "$hdr" | tail -1)
    age=$(printf '%s' "$hdr" | grep -i '^age:' | tr -d '\r' | head -1)
    size=$([ -f "live/$pid.html" ] && wc -c < "live/$pid.html" || echo 0)
    [ "$code" = "200" ] && [ "$size" -gt 1000 ] && break
    [ "$forsok" = "1" ] && echo "  $pid $slug  HTTP $code ${size}B — gor ett omforsok" && sleep 3
  done
  echo "  $pid $slug  HTTP $code  ${size}B  ${age:-age: -}"
  [ "$code" = "200" ] || brist=1
  [ "$size" -gt 1000 ] || brist=1
done < slugs.txt

if [ "$brist" != "0" ]; then
  echo "AVBRYT: minst en sida gav inte 200 eller ar tom — grinda inte pa det har" >&2
  exit 1
fi
echo "KLART — kor nu: python3 ../../polish-gates/livegrind.py"
