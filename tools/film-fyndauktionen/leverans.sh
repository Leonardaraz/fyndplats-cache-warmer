#!/bin/bash
# Bygger leveransfilerna ur de renderade bildrutorna: ./leverans.sh
# En version for aret runt: film med ljud, samma film utan ljud, en 4:5-version for flodet och en omslagsbild.
cd "$(dirname "$0")"
PY=/opt/render-venv/bin/python
KV="${KVALITET:-final}"
# varje pris i filmen ska vara butikens pris vid inspelningen, annars levereras inget
$PY -m film.prisvakt || { echo "STOPP: priserna stammer inte, se ovan"; exit 1; }
$PY -m film.texturer >/dev/null
node titles/rendera.js out/titlar | tail -1
$PY -m film.audio | tail -1
mkdir -p leverans
UT=leverans/fyndplats-fyndauktionen
$PY -m film.comp film --kvalitet "$KV" --titlar out/titlar --ljud out/ljud.wav --ut "$UT.mp4" | tail -1
# utan ljud: samma videostrom, bara utan ljudspar (ingen ny kodning)
ffmpeg -y -loglevel error -i "$UT.mp4" -an -c:v copy -movflags +faststart "$UT-utan-ljud.mp4"
# 4:5 for flodet: utsnittet y 210-1560 haller rubrikerna och slutbilden med marginal
ffmpeg -y -loglevel error -i "$UT.mp4" -vf "crop=1080:1350:0:210" -c:v libx264 -preset slow -crf 14 -maxrate 16M -bufsize 32M \
  -profile:v high -level:v 4.2 -g 30 -keyint_min 30 -sc_threshold 0 -bf 2 -pix_fmt yuv420p \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv -c:a copy -movflags +faststart "$UT-4x5.mp4"
$PY -m film.omslag --kvalitet "$KV" --ruta 50 | tail -1
for f in leverans/fyndplats-fyndauktionen*.mp4; do
  echo "== $f"
  $PY -m film.koll "$f" | grep -E "langd|rutor:|VARNING"
  ls -la "$f" | awk '{printf "  storlek %.1f MB\n", $5/1048576}'
done
