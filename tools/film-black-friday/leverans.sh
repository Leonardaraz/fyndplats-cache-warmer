#!/bin/bash
# Bygger leveransfilerna ur de renderade bildrutorna: ./leverans.sh [antal fynd]
# Film med ljud, film utan ljud, fredagsversionen (slutbild "i dag till kl 19") och omslagsbilder for bada.
cd "$(dirname "$0")"
PY=/opt/render-venv/bin/python
ANTAL="${1:-100}"
KV="${KVALITET:-final}"
# varje pris i filmen ska vara butikens pris just nu, annars levereras inget
$PY -m film.prisvakt || { echo "STOPP: priserna stammer inte, se ovan"; exit 1; }
node titles/rendera.js out/titlar/torsdag torsdag "$ANTAL" | tail -1
node titles/rendera.js out/titlar/fredag fredag "$ANTAL" | tail -1
$PY -m film.audio | tail -1
mkdir -p leverans
$PY -m film.comp film --kvalitet "$KV" --titlar out/titlar/torsdag --ljud out/ljud.wav --ut leverans/fyndplats-black-friday-torsdag.mp4 | tail -1
$PY -m film.comp film --kvalitet "$KV" --titlar out/titlar/fredag --ljud out/ljud.wav --ut leverans/fyndplats-black-friday-fredag.mp4 | tail -1
# utan ljud: samma videostrom, bara utan ljudspar (ingen ny kodning)
for v in torsdag fredag; do
  ffmpeg -y -loglevel error -i "leverans/fyndplats-black-friday-$v.mp4" -an -c:v copy -movflags +faststart "leverans/fyndplats-black-friday-$v-utan-ljud.mp4"
done
$PY -m film.omslag --kvalitet "$KV" --ruta 50 | tail -2
for f in leverans/fyndplats-black-friday-*.mp4; do
  echo "== $f"
  $PY -m film.koll "$f" | grep -E "langd|rutor:|VARNING"
  ls -la "$f" | awk '{printf "  storlek %.1f MB\n", $5/1048576}'
done
