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
  "983fe163": "983fe163-22ba-4958-85cb-b77beefc89fe",
  "98c1b3cb": "98c1b3cb-5e1c-452a-8416-b606d6a986f1",
  "711f7859": "711f7859-3b6e-4f42-82bb-95ad824f93c5",
  "93b7d87b": "93b7d87b-218c-422c-b6b3-558559fa2128",
  "c328a7c0": "c328a7c0-5037-4a7f-8127-b5b83e5605d9",
  "12ce97db": "12ce97db-26dc-4352-a236-e3d130cbd208",
  "20782c24": "20782c24-c8b1-47e7-97aa-00836eb9217a",
  "1d0ba82d": "1d0ba82d-30c1-4812-92b8-f1206522b561",
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
