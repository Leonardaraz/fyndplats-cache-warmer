# -*- coding: utf-8 -*-
"""Runda 79 Steg 4 + 11 — medialistan per produkt.

☠️ TVÅ BILDER PLOCKAS BORT: position 4 på `983fe163` och `98c1b3cb` är ett
   kollage med TYSK TEXT INBRÄND i pixlarna ("Schönheitssalon",
   "Tattoo-Studio", "Heimarbeitsplatz", "Nageldesignerin",
   "Arbeitsbereich zu Hause"). Den går inte att polera bort och kan inte
   visas för en svensk kund. Övriga 38 bilder är rena — måttritningarna bär
   bara siffror och cm, alltså språkneutralt.

⚠️ KORTET LIGGER PÅ PLATS 3, efter huvudbilden och livsstilsbilden. Det är
   samma plats som runda 77, 78 och F1 använder.

☠️ SKRIVFORMEN ÄR {id, altText} — INTE {image: {id}}. Läsningen returnerar
   den andra formen, och en skrivning byggd ur läsningen får
   400 "id or url must not be empty". Tredje fältet i samma familj som
   `slug` och kategorins `item`.

☠️ `media.main` SKICKAS INTE. Den är read-only i V3 och gav en extra
   omimport av huvudbilden när den ändå skickades (uppmätt 2026-08-28).
"""
import json

BILDER = json.load(open("bilder.json", encoding="utf-8"))
KORT_ID = {
  "983fe163": "b379ce_1865d689fb634d34839a0517b2f7896f~mv2.jpg",
  "98c1b3cb": "b379ce_0232ff264b2b417caff2b65e22829efc~mv2.jpg",
  "711f7859": "b379ce_0e1d5cb0e81f4b2eacb07a4457bef539~mv2.jpg",
  "93b7d87b": "b379ce_bf012d795a374cbc9111f97c6e16eb35~mv2.jpg",
  "c328a7c0": "b379ce_dedf387e1db44d5a93f7c5b134ffa69c~mv2.jpg",
  "12ce97db": "b379ce_2438560bc8bf4f09ae4342bdc8d40bf4~mv2.jpg",
  "20782c24": "b379ce_b907ea6c30dc458f8b24603d93bfa90f~mv2.jpg",
  "1d0ba82d": "b379ce_985589ac784b4746843e9bb43c7d84bc~mv2.jpg",
}
# Bilder som bär tysk text inbränd och därför INTE följer med.
STRYK = {"983fe163": [4], "98c1b3cb": [4]}

ALT = {
  "983fe163": "Rullpall i vit konstläder med oval rygg på fjäderstam, fotring och femarmad fot på hjul",
  "98c1b3cb": "Rullpall i svart konstläder med oval rygg på fjäderstam, fotring och femarmad fot på hjul",
  "711f7859": "Salongspall i gräddvit konstläder med kupad rygg och kromad femarmad fot på fem hjul",
  "93b7d87b": "Salongspall i svart konstläder med hög svängd rygg och kromad femarmad fot på fem hjul",
  "c328a7c0": "Två svarta rullpallar med låg rygg, fotring och kromad femarmad fot på fem hjul",
  "12ce97db": "Sadelpall med grå sits utan ryggstöd och svart femarmad nylonfot med dubbelhjul",
  "20782c24": "Sadelpall med rosa sits utan ryggstöd och kromat femarmat kryss med nylonhjul",
  "1d0ba82d": "Vit salongspall utan ryggstöd med fotring runt pelaren och femarmad fot på hjul",
}
KORT_ALT = {k: "Faktakort: " + v.split(" med ")[0].split(" utan ")[0] for k, v in ALT.items()}

plan = {}
for k, ids in BILDER.items():
    stryk = set(STRYK.get(k, []))
    kvar = [(i + 1, m) for i, m in enumerate(ids) if (i + 1) not in stryk]
    rader = []
    for n, (pos, mid) in enumerate(kvar):
        if n == 2:                                  # kortet på PLATS 3
            rader.append({"id": KORT_ID[k], "altText": KORT_ALT[k]})
        rader.append({"id": mid, "altText": ALT[k]})
    if len(kvar) <= 2:                              # kortet sist om färre än 3
        rader.append({"id": KORT_ID[k], "altText": KORT_ALT[k]})
    plan[k] = rader

json.dump(plan, open("media-plan.json", "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
for k, r in plan.items():
    kortpos = [i + 1 for i, x in enumerate(r) if x["id"] == KORT_ID[k]][0]
    print("%s  %d bilder, kort på plats %d  (strök %s)"
          % (k, len(r), kortpos, sorted(STRYK.get(k, [])) or "-"))
