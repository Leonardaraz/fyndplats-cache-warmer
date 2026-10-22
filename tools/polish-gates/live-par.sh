#!/bin/bash
# live-par.sh <slugfil> <utkatalog> <prefix> [delar=3]: mäter butikens färgvyer för många sidor parallellt (ren läsning).
#
#   slugfil      en rad per sida: "<id8> <slug>"
#   utkatalog    får en fil <prefix>_<id8>.json per sida (samma form som live-bilder.mjs skriver)
#   TVAAX        sidor med två axlar (id8, mellanslagsseparerade) mäts med live-farg-vy.mjs, som klickar färgaxeln och inget annat.
#                live-bilder.mjs klickar storleken efter färgen och hamnar ibland i en annan färgs vy (hundtrappan 543b9076).
#
# Omgång 3: 25 sidor på 75 sekunder med tre delar, mot ungefär tio minuter i följd. Butikens cache har uppdaterats på alla sidor
# fem till sju minuter efter en skrivning, så vänta så länge innan mätningen och mät om bara de sidor som visar fel antal.
# Fyra kärnor räcker till tre delar; OCR (kand.py) samtidigt gör det långsammare men går.
slugfil="$1"; ut="$2"; prefix="$3"; n="${4:-3}"
cd "$(git rev-parse --show-toplevel)" || exit 1
mkdir -p "$ut/del"
rm -f "$ut"/del/del_*
split -n l/"$n" -d "$slugfil" "$ut/del/del_"
mal() {
  while read -r id8 slug; do
    [ -z "$id8" ] && continue
    if [[ " ${TVAAX:-} " == *" $id8 "* ]]; then
      timeout 200 node tools/polish-gates/live-farg-vy.mjs "$slug" "$ut/${prefix}_$id8.json" 2>&1 | tail -1
    else
      timeout 150 node tools/polish-gates/live-bilder.mjs "$slug" "$ut/${prefix}_$id8.json" 2>&1 | tail -1
    fi
  done < "$1"
}
for f in "$ut"/del/del_??; do
  mal "$f" > "$f.logg" 2>&1 &
done
wait
sort "$ut"/del/*.logg | grep -v '^$' | head -40
echo "klart $(ls "$ut" | grep -c "^${prefix}_") av $(grep -c . "$slugfil") sidor $(date -u +%H:%M:%S)"
