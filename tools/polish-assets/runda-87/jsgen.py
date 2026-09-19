# -*- coding: utf-8 -*-
"""Bygger JS-nyttolasten för Wix-skrivningen ur texter.py.

☠️ Texten går ALDRIG inline i anropet. Batch 64 mätte nio fel mot noll.
☠️ Facit-grinden ligger INNE i det genererade anropet: stämmer inte längd
   och hash skrivs ingenting alls för den produkten.
☠️ `slug` skickas som NAKEN STRÄNG i en PATCH — GET returnerar {name: …},
   och en skrivning byggd ur läsningen väljer fel gren.

☠️ `seoData.settings.keywords` SKRIVS I SAMMA ANROP den här rundan.
   Runda 86 upptäckte fältet först i Steg 12 och fick rätta det separat på
   alla sju: det bär leverantörens TYSKA rubrik (`gartenschuppen lagerzelt
   robust wetterfest`) och överlever hela poleringen, eftersom en skrivning
   av `seoData.tags` inte rör `settings`. Uppmätt på båda utkasten som
   lästes den här rundan.
"""
import json, sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import texter
from facitgen import synlig, hasha            # noqa: E402

IDN = {
  "72051417": "72051417-e179-4f73-9ad8-d25f160cf29c",
  "a165b178": "a165b178-b8e7-4826-bae5-a137a7e4994c",
  "5f6592ad": "5f6592ad-b7e0-4919-b96a-31d84112f073",
  "20c0942e": "20c0942e-ed05-476f-8097-12541059e859",
  "8bdba748": "8bdba748-1286-4e7d-96fe-9616672fc10c",
  "0f5e3fea": "0f5e3fea-08a1-458e-87ad-919e111b75c8",
  "6a419d8b": "6a419d8b-c924-4045-8b04-d23911a5f6df",
  "95a9d7cc": "95a9d7cc-a0cf-4ffc-9cff-f739b71f3157",
}

# Fokusordet + ett relaterat, per produkt. Huvudordet är mätt i Steg 1:
# `garagetält` är kategorinamnet hos Jula och BAUHAUS. Det relaterade bär
# storleken, som är det enda som skiljer sidorna åt.
SOKORD = {
  "72051417": ("garagetält", "garagetält 120 x 179 cm"),
  "a165b178": ("garagetält", "garagetält mörkgrått"),
  "5f6592ad": ("garagetält", "garagetält 162 x 221 cm"),
  "20c0942e": ("garagetält", "garagetält ljusgrått"),
  "8bdba748": ("cykelgarage", "cykelförråd tält"),
  "0f5e3fea": ("garagetält", "garagetält att gå in i"),
  "6a419d8b": ("garagetält", "förvaringstält 9 kvm"),
  "95a9d7cc": ("förrådstält", "lagertält trädgård"),
}

rader = []
for p in texter.PRODUKTER:
    html = texter.bygg(p)
    s = synlig(html)
    huvud, rel = SOKORD[p["kort"]]
    rader.append({
        "kort": p["kort"], "id": IDN[p["kort"]],
        "name": p["name"], "slug": p["slug"],
        "html": html,
        "title": p["title"], "meta": p["meta"],
        "huvudord": huvud, "relord": rel,
        "langd": len(s), "hash": hasha(s),
    })
json.dump(rader, open(os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                   "skrivplan.json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
print("skrivplan.json:", len(rader), "produkter")
