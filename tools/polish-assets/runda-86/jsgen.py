# -*- coding: utf-8 -*-
"""Bygger JS-nyttolasten för Wix-skrivningen ur texter.py.

☠️ Texten går ALDRIG inline i anropet. Batch 64 mätte nio fel mot noll.
☠️ Facit-grinden ligger INNE i det genererade anropet: stämmer inte längd
   och hash skrivs ingenting alls för den produkten.
☠️ `slug` skickas som NAKEN STRÄNG i en PATCH — GET returnerar {name: …},
   och en skrivning byggd ur läsningen väljer fel gren.
"""
import json, sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import texter
from facitgen import synlig, hasha            # noqa: E402

IDN = {
  "c9a24404": "c9a24404-517d-4b0c-a0de-843d7efe54e8",
  "bb112e08": "bb112e08-f7cd-41c1-a9cc-a74d3d108364",
  "1e11480e": "1e11480e-c817-4940-848d-6f2e2aa13621",
  "d6666869": "d6666869-34ef-4e89-bd03-6e05c6a5c733",
  "43e312b7": "43e312b7-4a18-4b05-aec0-1dafcedaafb5",
  "364bc564": "364bc564-1ff7-40c2-9c53-e35fb5f48a6f",
  "8b00022f": "8b00022f-c84b-4643-8c06-b811c20383d7",
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
json.dump(rader, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "skrivplan.json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
print("skrivplan.json:", len(rader), "produkter")
