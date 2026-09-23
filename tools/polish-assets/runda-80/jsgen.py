# -*- coding: utf-8 -*-
"""Bygger JS-nyttolasten för Wix-skrivningen ur texter.py.

☠️ Texten går ALDRIG inline i anropet. Batch 64 mätte nio fel mot noll.
☠️ Facit-grinden ligger INNE i det genererade anropet: stämmer inte längd
   och hash skrivs ingenting alls för den produkten.
☠️ `slug` skickas som NAKEN STRÄNG i en PATCH — GET returnerar {name: …},
   och en skrivning byggd ur läsningen väljer fel gren.
"""
import json, sys
sys.path.insert(0, ".")
import texter
from facitgen import synlig, hasha            # noqa: E402

IDN = {
  "b9ab45db": "b9ab45db-1f3a-49c1-ae08-981ae679ded7",
  "0fe80797": "0fe80797-acff-411e-9eb3-d7cb36f65e30",
  "57ae1ddf": "57ae1ddf-b1d5-4a55-a6fc-b62b7e60b3f4",
  "558eb67a": "558eb67a-3e53-4250-abfb-4ef35eda42c1",
  "7046314f": "7046314f-7f76-4633-83e0-7c6605966c2c",
  "2cae1147": "2cae1147-0934-404b-879a-748faa627d94",
  "5302daf2": "5302daf2-8243-4d0c-8a81-3368c694f00c",
  "bd554433": "bd554433-a231-43f7-9034-b5cbc5f135ff",
}

rader = []
for p in texter.PRODUKTER:
    html = texter.bygg(p)
    s = synlig(html)
    rader.append({
        "kort": p["kort"], "id": IDN[p["kort"]],
        "name": p["name"], "slug": p["slug"],
        "html": html,
        "title": p["title"], "meta": p["meta"],
        "langd": len(s), "hash": hasha(s),
    })
json.dump(rader, open("skrivplan.json", "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
print("skrivplan.json:", len(rader), "produkter")
