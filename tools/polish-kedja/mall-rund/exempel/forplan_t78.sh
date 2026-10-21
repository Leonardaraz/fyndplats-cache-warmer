#!/bin/bash
SP=/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad
REF=claude/seo-polering-runbook-review-uq6fwl
cd /home/user/fyndplats-cache-warmer || exit 1
plan() {
  nm=$1; shift
  /usr/bin/python3 $SP/kor_wf.py aosom-sammanslagning.yml $REF mode=plan "$@" > $SP/t78/plan_$nm.res 2>&1
  ID=$(tail -1 $SP/t78/plan_$nm.res | /usr/bin/python3 -c "import sys,json; print(json.loads(sys.stdin.read())['id'])")
  gh run view $ID --repo Leonardaraz/fyndplats-cache-warmer --log 2>&1 | sed -n '/Läge: plan/,$p' | cut -c1-600 | sed 's/^[^\t]*\t[^\t]*\t[^ ]* //' > $SP/t78/plan_$nm.log
  echo "klar $nm $(tail -1 $SP/t78/plan_$nm.res | cut -c1-120)" >> $SP/t78/forplan.run.log
}
echo "start $(date -u +%H:%M:%S)" > $SP/t78/forplan.run.log
plan agility behall=8ad49cfe-ca9d-4ed4-84a4-663be9fcf788 utkast=7b1f5287-9f0e-4e5e-898f-d0e50f1cbe02 "farg_utkast=Vit och svart" "farg_behall=Vit och orange" sku=FP-agilityset-fyra-delar-svart bilder=1,2,3,4 omdirigera=nej
plan koner behall=6d35a04f-bdff-49bc-8de6-29d2bab1ae2d utkast=d02269aa-b935-48e9-816d-7e84d03e489b "farg_utkast=Orange och gul" "farg_behall=Blå och gul" "storlek_utkast=3 hinder" "storlek_behall=6 hinder" sku=FP-hinderset-koner-hund-3-hinder bilder=1,2,3,4 omdirigera=nej
plan trappa behall=93d1f14d-331c-4548-a7cf-7cb0fffa2bd9 utkast=01397d97-f142-4983-b3ff-2c0a3fcc8af4 farg_utkast=Brun farg_behall=Gräddvit sku=FP-hundtrappa-3-steg-brun bilder=1,2,3,4 omdirigera=nej
echo "KLAR $(date -u +%H:%M:%S)" >> $SP/t78/forplan.run.log
