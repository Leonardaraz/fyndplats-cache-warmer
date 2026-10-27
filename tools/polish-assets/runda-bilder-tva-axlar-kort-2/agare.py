#!/usr/bin/env python3
"""agare.py: bygger ägarspecarna (agare_<id8>.json) för bygg-agare.py ur galleri-fore.json och kortfiler.json.

Kör från rundans katalog:  python3 -P agare.py
galleri-fore.json  galleriets ordning och ägare per bild, mätt i butikens egen sidodata 2026-10-23 04:54 UTC (före korten)
kortfiler.json     kort -> Wix fil-id (uppladdade 2026-10-23 05:2x UTC)
plan_<id8>.json    produktens fulla id (planer.py)

Varje bild som redan ligger i galleriet behåller sin ägare (en bild utan ägare blir "-", gemensam). Varje nytt kort ägs av sin storlek. De gamla måttbilderna som
korten ersätter ligger kvar med sin ägare tills bilder-bort.yml tagit bort dem: ingen vy tappar en bild innan kortet finns, och ingen bild ligger oägd i mellanrummet.
"""
import json, sys

STORLEK = {
    "4d9ba658-fyra": "60 × 40 cm", "4d9ba658-tre": "45 × 40 cm",
    "c3d1fa41-liten": "75 × 51 × 18 cm",
    "44d4907b-244": "Ø244 cm",
    "38f70f83-200": "200 cm", "38f70f83-300": "300 cm",
    "75a38b7b-120": "120 cm",
    "934297b1-106": "106 × 76 cm",
    "01ac2f63-92": "92 × 76 cm",
    "92fc308c-50": "50 liter", "92fc308c-42": "42 liter", "92fc308c-30": "30 liter",
    "4a2ab58e-213": "213 cm",
    "5466fe81-397": "300 × 397 cm",
    "79ab08fe-109": "109 cm", "79ab08fe-136": "136 cm",
    "3b868848-63": "63 cm", "3b868848-80": "80 cm",
    "7d1fb82b-40": "40 cm",
    "c438d4ba-50x70": "50 × 70 cm", "c438d4ba-60x90": "60 × 90 cm", "c438d4ba-50x110": "50 × 110 cm",
    "b129d5ae-m": "M", "b129d5ae-l": "L",
}


def hex6(fil):
    assert fil.startswith("b379ce_"), fil
    return fil[len("b379ce_"):][:6]


fore = json.load(open("galleri-fore.json", encoding="utf-8"))
filer = json.load(open("kortfiler.json", encoding="utf-8"))
per_sida = {}
for k in STORLEK:
    per_sida.setdefault(k[:8], []).append(k)
for id8, korten in per_sida.items():
    d = fore[id8]
    id_full = json.load(open(f"plan_{id8}.json", encoding="utf-8"))["id"]
    storlekar = set(d["axlar"].get("Storlek", []))
    agare = {}
    for r in d["rader"]:
        h = hex6(r["fil"])
        assert h not in agare, (id8, h)
        agare[h] = r["agare"] or "-"
    for k in korten:
        if STORLEK[k] not in storlekar:
            sys.exit(f"{k}: storleken {STORLEK[k]!r} finns inte på sidan: {sorted(storlekar)}")
        h = hex6(filer[k])
        assert h not in agare, (k, h)
        agare[h] = STORLEK[k]
    with open(f"agare_{id8}.json", "w", encoding="utf-8") as f:
        json.dump([{"id": id_full, "agare": agare, "tomt": []}], f, ensure_ascii=False, indent=1)
    print(f"agare_{id8}.json: {len(d['rader'])} bilder + {len(korten)} kort")
