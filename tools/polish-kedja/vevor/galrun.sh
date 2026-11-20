#!/bin/bash
# galrun.sh <rundkatalog-namn> [arbetskatalog]: webbläsarkontroll av rundans sidor (en i taget): galleriets bilder i ordning (#1, #2 ...), väljare och pris,
# så som kunden ser dem. Läser slugs.txt och nyttolast-media.json i rundkatalogen och skriver en rad per sida (`START {...}` när sidan saknar val).
# Kör efter livekollen, inte parallellt med hamta-live.sh: Vercels edge strypar (403) när sidorna hämtas för tätt.
R=/home/user/fyndplats-cache-warmer/tools/polish-assets/$1
A=${2:-/tmp}
mkdir -p "$A"
cd "$R" || exit 1
python3 - "$A" <<'PY'
import json, sys
m = json.load(open('nyttolast-media.json', encoding='utf-8'))
for k, v in m.items():
    json.dump([x['id'] for x in v], open(f'{sys.argv[1]}/galleri-{k}.json', 'w'))
PY
while read -r kort slug; do
  [ -z "$kort" ] && continue
  echo "== $kort $slug"
  (cd /home/user/fyndplats-cache-warmer && node tools/polish-gates/live-galleri.mjs "$slug" "$A/galleri-$kort.json") 2>&1 | tail -40
done < slugs.txt
