#!/bin/bash
SP=/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad
REF=claude/seo-polering-runbook-review-uq6fwl
cd /home/user/fyndplats-cache-warmer || exit 1
vanta() {
  while true; do
    H=$((10#$(date -u +%H))); M=$((10#$(date -u +%M)))
    if [ $((H % 3)) -eq 0 ] && [ $M -ge 15 ] && [ $M -lt 30 ]; then sleep 15; else break; fi
  done
}
echo "T65 kedja start $(date -u +%H:%M:%S)"
vanta
echo "T65 värd start $(date -u +%H:%M:%S)"
python3 tools/polish-kedja/ghw.py write runda-t65-farg-pa-publicerad-klattervagg-for-katt 8a5f17af64183748ff22d90fe704485d1601546c856945971e76fc2b9212a694 torr,skriv || { echo "T65 värdrunda FALLT"; echo "EXIT 1"; exit 1; }
python3 tools/polish-kedja/kor_wf.py redirect-add.yml $REF from_slug=klattervagg-katt-fyra-delar-beige-hangmatta to_path=/produkt/klattervagg-katt-fyra-delar-hangmatta-trappa reason="T65: ny adress utan färgen" || echo "redirect klättervägg FALLT"
vanta
echo "T65 sammanslagning $(date -u +%H:%M:%S)"
python3 tools/polish-kedja/ghw.py merge $SP/t65/merge_t65.json
echo "T65 KLAR $(date -u +%H:%M:%S)"
echo "EXIT 0"
