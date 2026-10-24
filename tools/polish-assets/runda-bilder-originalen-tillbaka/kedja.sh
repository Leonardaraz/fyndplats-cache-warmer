#!/bin/bash
# kedja.sh <id8>...: kör bort.sh för varje sida, EN I TAGET. Skriver ${BORT_LOGG:-/tmp/bort-logg}/kedja.log.
# Läs `klart:`-raden i varje sidas logg efteråt: exit-koden räcker inte (bort.sh slutar på en grep).
R="$(cd "$(dirname "$0")" && pwd)"
UT="${BORT_LOGG:-/tmp/bort-logg}"
mkdir -p "$UT"
for ID8 in "$@"; do
  echo "$(date -u +%H:%M:%S) start $ID8" >> "$UT/kedja.log"
  bash "$R/bort.sh" "$ID8"
  echo "$(date -u +%H:%M:%S) klar $ID8 (exit $?)" >> "$UT/kedja.log"
done
echo "$(date -u +%H:%M:%S) KEDJAN KLAR" >> "$UT/kedja.log"
