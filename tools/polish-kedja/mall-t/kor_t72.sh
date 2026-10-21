#!/bin/bash
SP=/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad
cd /home/user/fyndplats-cache-warmer || exit 1
GHW=tools/polish-kedja/ghw.py
vanta() {
  local marg=${1:-0}
  while true; do
    H=$((10#$(date -u +%H))); M=$((10#$(date -u +%M)))
    if [ $((H % 3)) -eq 0 ] && [ $M -ge $((15 - marg)) ] && [ $M -lt 30 ]; then sleep 15; else break; fi
  done
}
SLUTKOD=0
echo "T72 start $(date -u +%H:%M:%S)"
vanta 3
python3 $GHW write runda-t72-svart-skrivbord-pa-hjul 69faebfc05f6e0c7b96eb1cbea6014c0f1f113d9a593e77d5b19e2d51211bb57 torr,skriv || { echo "T72 värdrunda FALLT"; echo "EXIT 1"; exit 1; }
vanta 3
echo "T72 givarbilder $(date -u +%H:%M:%S)"
python3 $GHW bilder runda-t72-givare-alt 2e3e3acdef217f5f9bd8fd9da1d795d72fbb6207156d0a111145ededbc5a4123 torr,skriv || { echo "T72 givarrunda FALLT"; echo "EXIT 1"; exit 1; }
vanta 8
echo "T72 sammanslagning $(date -u +%H:%M:%S)"
python3 $GHW merge $SP/t72/merge_t72.json || SLUTKOD=2
echo "T72 KLAR $(date -u +%H:%M:%S)"
echo "EXIT $SLUTKOD"
exit $SLUTKOD
