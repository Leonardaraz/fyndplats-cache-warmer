#!/bin/bash
SP=/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad
REF=claude/seo-polering-runbook-review-uq6fwl
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
echo "T78 kedja start $(date -u +%H:%M:%S)"
vanta 3
echo "T78 värdar start $(date -u +%H:%M:%S)"
python3 $GHW write runda-t78-farg-pa-agility-koner-och-hundtrappa 3df52a585ff11fb5d4c251c68de3acc9bd79a51857365c3d099bc65cec42d491 torr,skriv || { echo "T78 värdrunda FALLT"; echo "EXIT 1"; exit 1; }
echo "T78 omdirigering $(date -u +%H:%M:%S)"
python3 $SP/kor_wf.py redirect-add.yml $REF from_slug=hinderset-med-koner-hund-sex-hinder to_path=/produkt/hinderset-med-koner-hund "reason=T78: hindersetet blev en sida med två storlekar och två färger och fick ny adress" || { echo "T78 OMDIRIGERING FALLT"; SLUTKOD=3; }
vanta 3
echo "T78 givarbilder $(date -u +%H:%M:%S)"
python3 $GHW bilder runda-t78-farg-pa-agility-koner-och-hundtrappa-givare-alt 19d4981d2df100bd3483b08fa8ee5ff0fdfc8de8f4632ca528774125b6fb4455 torr,skriv || { echo "T78 givarrunda FALLT"; echo "EXIT 1"; exit 1; }
vanta 8
echo "T78 sammanslagning $(date -u +%H:%M:%S)"
python3 $GHW merge $SP/t78/merge_t78.json || SLUTKOD=2
echo "T78 KLAR $(date -u +%H:%M:%S)"
echo "EXIT $SLUTKOD"
exit $SLUTKOD
