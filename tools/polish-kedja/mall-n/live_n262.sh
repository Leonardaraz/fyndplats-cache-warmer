#!/bin/bash
cd /home/user/fyndplats-cache-warmer/tools/polish-assets/runda-n262-hollywoodgunga-overdrag-paviljongtak-kaffe || exit 1
SP=/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad
echo "live start $(date -u +%H:%M:%S)"
bash ../../polish-gates/hamta-live.sh 130 > $SP/n262r/live.out 2>&1
echo "hamta klar $(date -u +%H:%M:%S)"
python3 ../../polish-gates/livegrind.py > $SP/n262r/live.grind.log 2>&1
python3 ../../polish-gates/livekoll.py > $SP/n262r/live.koll.log 2>&1
echo "live KLAR $(date -u +%H:%M:%S)"
