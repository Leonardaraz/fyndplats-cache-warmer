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
  "6307893c": "6307893c-03b4-40be-8ffe-e4ab06e0a575",
  "46d2c85a": "46d2c85a-d2e1-4ef7-98d3-d96d2a436237",
  "4401be4f": "4401be4f-1d5b-44db-a1ba-f1fa62b7064a",
  "8b66533f": "8b66533f-0a91-4c55-b60d-d9676c25367b",
  "65c84a9b": "65c84a9b-6ff7-4dc2-867b-cfaf6ae803b3",
  "bdb600fe": "bdb600fe-6d04-4af1-87b9-c28b375b5a60",
  "cce86277": "cce86277-05a1-47c9-98bb-606f24b7c1e6",
  "e39db7dd": "e39db7dd-055d-4958-b618-8da78fbab313",
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
