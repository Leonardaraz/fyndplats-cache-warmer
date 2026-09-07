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

# ☠️ 403 FRAN VERCELS EDGE AR EN STRYPNING, INTE ETT TRASIGT SLUG. Uppmatt
# 2026-09-07 pa runda J1: tva av atta sidor gav `403 Forbidden` med en
# `iad1::`-request-id i kroppen — alltsa Vercels edge-brandvagg och inte
# butikens app, som svarar 404 pa ett okant slug. Vilka sidor som faller
# varierar mellan svepen, och samma slug gick fram nagra sekunder senare.
# Butiken svarade dessutom 200 pa vanlig curl och 403 pa en browser-UA i
# samma minut — det ar tempo som utloser den, inte anropets form.
#
# ⚠️ PAUSEN NEDAN AR INTE KUREN, och den forsta versionen av den har
# kommentaren pastod fel. Den skrev att pacingen tog bort 403:orna, pa ett
# enda svep: 2 av 8 pa varm traff utan paus, 0 av 8 med en sekund. Nasta
# korning med TRE sekunder gav 3 av 8. Uppmatt samma kvall:
#
#   paus 0 s  ->  2 av 8 pa varm traff
#   paus 1 s  ->  0 av 8
#   paus 3 s  ->  3 av 8
#
# Mer paus gav alltsa FLER avvisningar, inte farre. Det som skilde korningarna
# at var inte avstandet mellan anropen utan hur mycket trafik butiken nyss
# tagit emot — den sista kordes direkt efter atta media-skrivningar och ett
# helt foregaende svep. Sparren ar ett rullande fonster over nyligen trafik,
# och en sekund hit eller dit inuti svepet syns inte i det.
#
# Pausen far sta kvar: den kostar 16 sekunder pa en cykel som anda vantar ut
# ett femminutersfonster, och den kan inte gora skada. Men det som FAKTISKT ar
# uppmatt att fungera ar backofftrappan langre ned — den raddade tre fallna
# hamtningar i ett enda svep. Vanta ut spärren, spring inte om den.
PAUS_MELLAN_SIDOR="${HAMTA_LIVE_DELAY:-1}"

echo "== varm traff (triggar bakgrundsrendering) =="
# ⚠️ VANTA EN GANG, INTE PER SIDA. Forsta versionen av det har vantade ut
# stale-fonstret inuti loopen: en batch dar tva sidor var farska kostade 218 + 305
# sekunder i rad, och under tiden hann de sex som redan var inaktuella bli
# inaktuella IGEN — sa den skarpa hamtningen fick en gammal sida anda. Sidorna i
# en batch skrivs i samma veva och blir darfor mogna ungefar samtidigt: matt
# aldern pa alla forst, vanta en gang pa den yngsta, och traffa sedan om bara de
# som annu inte hade hunnit bli inaktuella.
farska=""
langst=0
while read -r pid slug; do
  [ -z "${pid:-}" ] && continue
  hdr=$(curl -s -D - -o /dev/null "https://www.fyndplats.se/produkt/$slug")
  code=$(printf '%s' "$hdr" | grep -iE '^HTTP/' | tail -1 | awk '{print $2}')
  age=$(printf '%s' "$hdr" | grep -i '^age:' | tr -d '\r' | tr -dc '0-9')
  age=${age:-0}
  if [ "$age" -lt "$STALE" ]; then
    kvar=$((STALE - age + 5))
    [ "$kvar" -gt "$langst" ] && langst=$kvar
    farska="$farska$pid $slug\n"
    echo "  $pid $slug  $code  age=$age — annu farsk"
  else
    echo "  $pid $slug  $code  age=$age — inaktuell, omrendering startad"
  fi
  sleep "$PAUS_MELLAN_SIDOR"
done < slugs.txt

if [ -n "$farska" ]; then
  echo "  -- vantar ${langst}s en gang, traffar sedan om de farska --"
  sleep "$langst"
  printf '%b' "$farska" | while read -r pid slug; do
    [ -z "${pid:-}" ] && continue
    curl -s -o /dev/null "https://www.fyndplats.se/produkt/$slug"
    sleep "$PAUS_MELLAN_SIDOR"
  done
fi

sleep "$paus"

echo "== skarp hamtning =="
brist=0
while read -r pid slug; do
  [ -z "${pid:-}" ] && continue
  # OMFORSOK MED BACKOFF. En hamtning som ger 000 (anslutningsfel) eller inte
  # lyckas skriva sin fil ar det transienta fallet — 2026-09-06 kostade en
  # sadan miss hela atta-siders cykeln, alltsa tva minuters paus till, for en
  # sida som gick fram direkt nar den kordes om. Faller alla forsok star
  # AVBRYT-et kvar: grinda aldrig pa en ofullstandig hamtning.
  #
  # ☠️ TRAPPAN AR MATT, INTE VALD. Den var 3 s och ETT omforsok fram till
  # 2026-09-07, och det racker inte mot edge-strypningen (se kommentaren vid
  # PAUS_MELLAN_SIDOR): uppmatt pa runda J1 gav forsok 1 och 2 med 20 sekunders
  # mellanrum bada 403, och forst det tredje gav 200. Ett for kort omforsok
  # rapporterar en strypt sida som trasig, och da avbryts en cykel som bara
  # behovde vanta.
  code=000; size=0; age=""
  for paus in 5 20 45 0; do
    hdr=$(curl -s -D - -o "live/$pid.html" -w "%{http_code}" "https://www.fyndplats.se/produkt/$slug")
    code=$(printf '%s' "$hdr" | tail -1)
    age=$(printf '%s' "$hdr" | grep -i '^age:' | tr -d '\r' | head -1)
    size=$([ -f "live/$pid.html" ] && wc -c < "live/$pid.html" || echo 0)
    [ "$code" = "200" ] && [ "$size" -gt 1000 ] && break
    [ "$paus" = "0" ] && break
    echo "  $pid $slug  HTTP $code ${size}B — gor ett omforsok om ${paus}s"
    sleep "$paus"
  done
  echo "  $pid $slug  HTTP $code  ${size}B  ${age:-age: -}"
  sleep "$PAUS_MELLAN_SIDOR"
  [ "$code" = "200" ] || brist=1
  [ "$size" -gt 1000 ] || brist=1
done < slugs.txt

if [ "$brist" != "0" ]; then
  echo "AVBRYT: minst en sida gav inte 200 eller ar tom — grinda inte pa det har" >&2
  echo "  403 = Vercels edge-strypning, inte ett trasigt slug. Hamta DEN sidan" >&2
  echo "  ensam om en stund; en sida i taget ar facit, ett svep ar ett stickprov." >&2
  exit 1
fi
echo "KLART — kor nu: python3 ../../polish-gates/livegrind.py"
