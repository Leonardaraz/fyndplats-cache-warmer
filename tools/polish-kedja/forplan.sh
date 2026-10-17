#!/bin/bash
SP=/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad
cd /home/user/fyndplats-cache-warmer || exit 1
i=0
run() {
  i=$((i+1))
  python3 $SP/kvar/kor_wf_log2.py aosom-sammanslagning.yml "$1" $SP/t61/plan_$i.txt
}
run '{"mode": "plan", "behall": "834c66fd-8231-4df3-8fb1-1967189c8861", "utkast": "4374a31f-665f-429a-bd82-2591afd7f340", "farg_utkast": "Grå", "storlek_utkast": "", "farg_behall": "", "storlek_behall": "", "omdirigera": "ja", "sku": "FP-metallskjul-277x195-gra", "bilder": "1"}'
run '{"mode": "plan", "behall": "26ae7fb2-f96e-4d16-885b-3a20fb9da82b", "utkast": "07435f1a-4c8b-4d09-9526-ab96673f03c3", "farg_utkast": "", "storlek_utkast": "90 × 200 cm", "farg_behall": "", "storlek_behall": "80 × 200 cm", "omdirigera": "ja", "sku": "FP-extrasang-90x200-hjul", "bilder": "1,3"}'
echo "KLAR $(date -u +%H:%M:%S)"
