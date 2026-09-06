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
  "466e799a": "466e799a-2cea-4b91-ae7d-820096fe5356",
  "7846d05f": "7846d05f-a531-440c-bb41-f3ab9815f5c5",
  "aabcd677": "aabcd677-93df-4af4-9d90-3477e4a11b29",
  "0cc5c634": "0cc5c634-06c6-4cd3-ab56-c793de585116",
  "4ef74d40": "4ef74d40-2c38-4f13-9ed3-71074a1c428a",
  "dcd756bd": "dcd756bd-afde-450c-b991-19b1079b2e78",
  "96beca79": "96beca79-a83d-4d8e-a453-94b248a46360",
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
