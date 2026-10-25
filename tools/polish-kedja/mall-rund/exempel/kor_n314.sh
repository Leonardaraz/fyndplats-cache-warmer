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
echo "N314 kedja start $(date -u +%H:%M:%S)"
vanta 3
echo "N314 värdar start $(date -u +%H:%M:%S)"
python3 $GHW write runda-n314-farg-pa-klostrad-tonna-och-takspant-trad f2beeb42dc1aaa10693dbceeea154ca70c961547355c9e0ef44c935118ed9220 torr,skriv || { echo "N314 värdrunda FALLT"; echo "EXIT 1"; exit 1; }
echo "N314 omdirigering $(date -u +%H:%M:%S)"
python3 $SP/kor_wf.py redirect-add.yml $REF from_slug=klostrad-220-240-cm-gront-och-rosa to_path=/produkt/klostrad-220-240-cm-golv-till-tak "reason=T96: det takspända klösträdet fick ny adress när sidan blev en sida med två färger" || { echo "N314 OMDIRIGERING FALLT"; SLUTKOD=3; }
vanta 3
echo "N314 givarbilder $(date -u +%H:%M:%S)"
python3 $GHW bilder runda-n314-givare-alt c47423b272b02256137fa8f43efb275950eae6e5dabde585882dcb86dec59531 torr,skriv || { echo "N314 givarrunda FALLT"; echo "EXIT 1"; exit 1; }
vanta 8
echo "N314 sammanslagning $(date -u +%H:%M:%S)"
python3 $GHW merge $SP/n314/merge_n314.json || SLUTKOD=2
echo "N314 KLAR $(date -u +%H:%M:%S)"
echo "EXIT $SLUTKOD"
exit $SLUTKOD
