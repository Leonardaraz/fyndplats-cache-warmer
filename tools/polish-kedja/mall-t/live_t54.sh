#!/bin/bash
cd /home/user/fyndplats-cache-warmer/tools/polish-assets/runda-t54-storlek-pa-publicerad-ljustrad || exit 1
SP=/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad
echo "live start $(date -u +%H:%M:%S)"
bash ../../polish-gates/hamta-live.sh 130 > $SP/t54/live.out 2>&1
echo "hamta klar $(date -u +%H:%M:%S)"
python3 ../../polish-gates/livegrind.py > $SP/t54/live.grind.log 2>&1
python3 ../../polish-gates/livekoll.py > $SP/t54/live.koll.log 2>&1
echo "live KLAR $(date -u +%H:%M:%S)"
