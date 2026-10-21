#!/bin/bash
SP=/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad
cd /home/user/fyndplats-cache-warmer || exit 1
vanta() {
  while true; do
    H=$((10#$(date -u +%H))); M=$((10#$(date -u +%M)))
    if [ $((H % 3)) -eq 0 ] && [ $M -ge 15 ] && [ $M -lt 30 ]; then sleep 15; else break; fi
  done
}
echo "N262 kedja start $(date -u +%H:%M:%S)"
vanta
echo "N262 start $(date -u +%H:%M:%S)"
python3 tools/polish-kedja/ghw.py write runda-n262-hollywoodgunga-overdrag-paviljongtak-kaffe bda2caac06e57dc32a27c65055418630f572745c321f8ee985e76df221fb48f7 torr,skriv || { echo "N262 FALLT"; echo "EXIT 1"; exit 1; }
echo "N262 KLAR $(date -u +%H:%M:%S)"
echo "EXIT 0"
