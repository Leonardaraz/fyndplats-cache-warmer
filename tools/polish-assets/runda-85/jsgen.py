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
  "17fb1869": "17fb1869-3d17-4542-86f5-649d2bfa0473",
  "b10b80ee": "b10b80ee-c9d1-40a3-8591-3b15aaca962a",
  "10c47f8e": "10c47f8e-2a4a-4605-8cf3-43a3cf4844b2",
  "213be879": "213be879-063d-47d0-8566-90dc5d0e4ff8",
  "a00882ed": "a00882ed-3d85-48c1-a945-d5ab6b6b41cc",
  "ec672f4d": "ec672f4d-32df-4b21-9367-034fa58f5a22",
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
