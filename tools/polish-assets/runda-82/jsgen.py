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
  "d6a11ae3": "d6a11ae3-8ec3-44bd-9317-081e98793d4a",
  "f5d857b6": "f5d857b6-6992-4b2c-99e1-ca5c3e77e52e",
  "2a16c507": "2a16c507-8005-4785-b24e-8b934d00b0fb",
  "9ed7ad7a": "9ed7ad7a-c130-4f73-95f4-8b38cbbc678c",
  "85ffb47b": "85ffb47b-c9b4-4f04-bde1-04acc0f83c10",
  "1628620b": "1628620b-76db-4179-a96d-04f916b2a4d7",
  "4ca8a6c0": "4ca8a6c0-9441-49eb-ab8e-6c0ef5e61749",
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
