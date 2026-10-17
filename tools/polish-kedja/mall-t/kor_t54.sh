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
echo "T54 kedja start $(date -u +%H:%M:%S)"
until grep -q "EXIT" $SP/n258/kor_n258.log; do sleep 10; done
vanta
echo "T54 värd start $(date -u +%H:%M:%S)"
python3 $SP/n100/ghw.py write runda-t54-storlek-pa-publicerad-ljustrad fb29724f0ccd7da752425ea4a0a38bcc3b31295b197177ebfae39ad2341a2f95 torr,skriv || { echo "T54 värdrunda FALLT"; echo "EXIT 1"; exit 1; }
python3 $SP/kor_wf.py redirect-add.yml $REF from_slug=ljustrad-150-cm-korsbarsblommor to_path=/produkt/ljustrad-korsbarsblommor-varmvitt-flerfargat-ljus reason="T54: ny adress" || echo "redirect ljusträd FALLT"
vanta
echo "T54 givarbilder $(date -u +%H:%M:%S)"
python3 $SP/n100/ghw.py bilder runda-t54-givare-alt 0e35cd61d2ab8435095f2b295d3874e0399536c36806de354cc5b78d064cbf57 torr,skriv || { echo "T54 givarrunda FALLT"; echo "EXIT 1"; exit 1; }
vanta
echo "T54 sammanslagning $(date -u +%H:%M:%S)"
python3 $SP/n100/ghw.py merge $SP/t54/merge_t54.json
echo "T54 KLAR $(date -u +%H:%M:%S)"
echo "EXIT 0"
