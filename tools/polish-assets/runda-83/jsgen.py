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
  "a353ea02": "a353ea02-df1f-42ad-af50-77bcbe0c7bbc",
  "5078bedf": "5078bedf-91c6-4971-b7e3-9637debc899f",
  "a9555a7d": "a9555a7d-dbd9-4e35-a856-d22db42da79b",
  "754a4749": "754a4749-d67f-4d12-9cb6-0c9d849de350",
  "251f0429": "251f0429-49bc-4520-91ba-d6496fe80136",
  "ed7a86fd": "ed7a86fd-84d8-47f0-9d29-5fca2e6cd97d",
  "2cfd373a": "2cfd373a-4b73-4646-8a35-9124402b16f4",
  "d7eca2ba": "d7eca2ba-9825-4366-a21c-a3756d5d866f",
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
