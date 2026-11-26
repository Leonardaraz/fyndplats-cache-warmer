#!/bin/bash
# Bygger leveransfilerna ur de renderade bildrutorna: ./leverans.sh [antal fynd]
# Film med ljud, film utan ljud, fredagsversionen (slutbild "i dag till kl 19") och omslagsbild.
cd "$(dirname "$0")"
PY=/opt/render-venv/bin/python
ANTAL="${1:-100}"
KV="${KVALITET:-final}"
node titles/rendera.js out/titlar/torsdag torsdag "$ANTAL" | tail -1
node titles/rendera.js out/titlar/fredag fredag "$ANTAL" | tail -1
$PY -m film.audio | tail -1
mkdir -p leverans
$PY -m film.comp film --kvalitet "$KV" --titlar out/titlar/torsdag --ljud out/ljud.wav --ut leverans/fyndplats-black-friday-torsdag.mp4 | tail -1
$PY -m film.comp film --kvalitet "$KV" --titlar out/titlar/torsdag --ut leverans/fyndplats-black-friday-torsdag-utan-ljud.mp4 | tail -1
$PY -m film.comp film --kvalitet "$KV" --titlar out/titlar/fredag --ljud out/ljud.wav --ut leverans/fyndplats-black-friday-fredag.mp4 | tail -1
$PY -m film.comp film --kvalitet "$KV" --titlar out/titlar/fredag --ut leverans/fyndplats-black-friday-fredag-utan-ljud.mp4 | tail -1
for f in leverans/*.mp4; do ffprobe -v error -show_entries format=duration,size -of csv=p=0 "$f" | sed "s|^|$f: |"; done
