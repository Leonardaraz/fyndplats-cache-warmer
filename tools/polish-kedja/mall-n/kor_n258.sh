#!/bin/bash
SP=/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad
cd /home/user/fyndplats-cache-warmer || exit 1
vanta() {
  while true; do
    H=$((10#$(date -u +%H))); M=$((10#$(date -u +%M)))
    if [ $((H % 3)) -eq 0 ] && [ $M -ge 15 ] && [ $M -lt 30 ]; then sleep 15; else break; fi
  done
}
echo "N258 kedja start $(date -u +%H:%M:%S)"
until grep -q "EXIT" $SP/t53/kor_t53.log; do sleep 10; done
vanta
echo "N258 start $(date -u +%H:%M:%S)"
python3 $SP/n100/ghw.py write runda-n258-utomhusmatta-bladmonster 74f2af1a8900084f21ceba2dc6763bc47224029152bc1ad61ac60ac1d2970827 torr,skriv || { echo "N258 FALLT"; echo "EXIT 1"; exit 1; }
echo "N258 KLAR $(date -u +%H:%M:%S)"
echo "EXIT 0"
