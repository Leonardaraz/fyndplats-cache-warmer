#!/bin/bash
# Renderar en del av en tagning: ./kor_del.sh <kvalitet> <tagning> <fran> <till> <bild|volym|bada>
# For att varje korning ska hinna klart inom bakgrundsjobbens tidsgrans (2 h). Fardiga rutor hoppas over.
cd "$(dirname "$0")"
KV="$1"; T="$2"; FRAN="$3"; TILL="$4"; PASS="${5:-bada}"
OVER=""
# trappans kranakning (A) far kortare slutare, sa att prisskylten gar att lasa medan kameran foljer varan
if [ "$KV" = "final" ] && [ "$T" = "A" ]; then OVER='{"slutare":0.3}'; fi
if [ "$KV" = "final" ] && [ "$T" = "C" ]; then OVER='{"spp":24,"troskel":0.08}'; fi
if [ "$KV" = "final" ] && [ "$T" = "D" ]; then OVER='{"spp":24,"troskel":0.08,"skala":0.85}'; fi
find out/exr -name "*.exr" -size 0 -delete 2>/dev/null
if [ "$PASS" != "volym" ]; then
  if [ -n "$OVER" ]; then
    /opt/render-venv/bin/python -m film.render anim --tagning "$T" --kvalitet "$KV" --fran "$FRAN" --till "$TILL" --over "$OVER" 2>&1 | grep -E "KLAR|Error|Traceback|rror"
  else
    /opt/render-venv/bin/python -m film.render anim --tagning "$T" --kvalitet "$KV" --fran "$FRAN" --till "$TILL" 2>&1 | grep -E "KLAR|Error|Traceback|rror"
  fi
fi
if [ "$PASS" != "bild" ]; then
  /opt/render-venv/bin/python -m film.render anim --tagning "$T" --kvalitet "$KV" --fran "$FRAN" --till "$TILL" --volym 2>&1 | grep -E "KLAR|Error|Traceback|rror"
fi
echo "DEL $T $FRAN-$TILL $PASS KLAR $(TZ=Europe/Stockholm date +%H:%M)"
