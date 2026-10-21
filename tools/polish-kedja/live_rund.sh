#!/bin/bash
# live_rund.sh <rundkatalog-namn> <logg-katalog>: ISR-medveten hämtning + livegrind + livekoll i bakgrunden
R=/home/user/fyndplats-cache-warmer/tools/polish-assets/$1
L=$2
mkdir -p $L
cd $R || exit 1
echo "live start $(date -u +%H:%M:%S)" > $L/live.run.log
bash ../../polish-gates/hamta-live.sh 130 > $L/live.out 2>&1
echo "hamta klar $(date -u +%H:%M:%S)" >> $L/live.run.log
python3 ../../polish-gates/livegrind.py > $L/live.grind.log 2>&1
python3 ../../polish-gates/livekoll.py > $L/live.koll.log 2>&1
echo "live KLAR $(date -u +%H:%M:%S)" >> $L/live.run.log
