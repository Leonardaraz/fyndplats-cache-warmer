#!/bin/bash
# Renderar tagningar i foljd: ./kor.sh <kvalitet> A B C ...   (bild + volympass, hoppar over fardiga rutor)
# Glasskivans tagning (D) renderas med nagot farre stralar och 85 % storlek: bakgrunden ar oskarp och texten stor.
# Hallens tagning (C) far full upplosning: produktkortens namn och priser ska vara skarpa.
cd "$(dirname "$0")"
KV="$1"; shift
for T in "$@"; do
  OVER=""
  # trappans kranakning (A) far kortare slutare, sa att prisskylten gar att lasa medan kameran foljer varan
  if [ "$KV" = "final" ] && [ "$T" = "A" ]; then OVER='{"slutare":0.3}'; fi
  if [ "$KV" = "final" ] && [ "$T" = "C" ]; then OVER='{"spp":24,"troskel":0.08}'; fi
  if [ "$KV" = "final" ] && [ "$T" = "D" ]; then OVER='{"spp":24,"troskel":0.08,"skala":0.85}'; fi
  find out/exr -name "*.exr" -size 0 -delete 2>/dev/null
  if [ -n "$OVER" ]; then
    /opt/render-venv/bin/python -m film.render anim --tagning "$T" --kvalitet "$KV" --over "$OVER" 2>&1 | grep -E "KLAR|Error|Traceback|rror"
  else
    /opt/render-venv/bin/python -m film.render anim --tagning "$T" --kvalitet "$KV" 2>&1 | grep -E "KLAR|Error|Traceback|rror"
  fi
  /opt/render-venv/bin/python -m film.render anim --tagning "$T" --kvalitet "$KV" --volym 2>&1 | grep -E "KLAR|Error|Traceback|rror"
  echo "TAGNING $T KLAR $(TZ=Europe/Stockholm date +%H:%M)"
done
echo "ALLT KLART $KV $*"
