# -*- coding: utf-8 -*-
"""Bygger nyttolasten till Wix UR DEN GRINDADE TEXTEN.

☠️ Texten får aldrig skrivas in i API-anropet för hand. Batch 64 mätte nio fel
som nådde Wix den vägen mot noll när texten passerade en fil och en grind.
Den här filen är bryggan: den läser texter.py, kör lint.py en sista gång, och
skriver skrivning.json + facit.json.
"""
import json
import os
import re
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)

import lint                                                          # noqa: E402
from grindar import sku_bas                                          # noqa: E402
from texter import PRODUKTER, bygg                                   # noqa: E402

WIXID = {
    "d760fffc": "d760fffc-571a-4e6f-a2df-a614a40673b6",
    "79eaab59": "79eaab59-708f-4e21-a03c-56ee9ffd048c",
    "4b2a7407": "4b2a7407-d3a1-4c5e-9313-a92d12d6bc30",
    "1a1d04f7": "1a1d04f7-7bf7-4e51-8f32-b1c55dea392b",
    "99492092": "99492092-687b-47b2-8e1d-4c8b66887709",
    "79690bf4": "79690bf4-3fda-43c5-9691-f8f9b0dd84b8",
    "89273d39": "89273d39-0b98-4a00-8035-6d8fd1640fbe",
    "9c1889f1": "9c1889f1-45fa-4a19-9c15-667180a579f2",
}
# ☠️ Wix-variantens id, aldrig feedens artikelnummer. Två fält heter `sku` och
#    betyder olika saker — den förväxlingen lät prissynken skriva till
#    ingenting i en månad (se CLAUDE.md).
VARIANTID = {
    "d760fffc": "1b952be5-8f7e-4f66-b28d-4b746298cb60",
    "79eaab59": "559dc127-9c20-413f-a5a6-823b3bc1ef61",
    "4b2a7407": "a1dfdd94-a7e3-4762-aa51-6960576ea6e5",
    "1a1d04f7": "c5b507a8-117c-4de1-aa85-e7772085c793",
    "99492092": "bd9e73b3-79a6-4978-b417-653fa95cba86",
    "79690bf4": "f956850c-82d5-4150-96eb-2ee3ef06f3c0",
    "89273d39": "32e0b74d-a964-4ee9-a4b7-d7e07c74d770",
    "9c1889f1": "9006347b-eeb7-4b15-98a5-490deae190e7",
}


def synlig(html):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html)).strip()


def hash_(text):
    h = 0
    for c in text:
        h = (h * 31 + ord(c)) % 1000000007
    return h


if __name__ == "__main__":
    fel = lint.kor()
    if fel:
        for f in fel:
            print("FEL  " + f)
        raise SystemExit("☠️ grinden fäller — ingenting skrivs")

    ut, facit = [], {}
    for p in PRODUKTER:
        k = p["kort"]
        html = bygg(p)
        ut.append({
            "kort": k,
            "id": WIXID[k],
            "variantId": VARIANTID[k],
            "name": p["name"],
            "slug": p["slug"],
            "sku": "FP-" + sku_bas(p["slug"]),
            "seoTitle": p["title"],
            "seoDescription": p["meta"],
            "html": html,
        })
        s = synlig(html)
        facit[k] = {"slug": p["slug"], "sku": "FP-" + sku_bas(p["slug"]),
                    "name": p["name"], "title": p["title"], "meta": p["meta"],
                    "synligLangd": len(s), "synligHash": hash_(s)}

    json.dump(ut, open(os.path.join(HAR, "skrivning.json"), "w"),
              ensure_ascii=False, indent=1)
    json.dump(facit, open(os.path.join(HAR, "facit.json"), "w"),
              ensure_ascii=False, indent=1)
    print("grinden ren. %d produkter, %d byte nyttolast"
          % (len(ut), sum(len(x["html"]) for x in ut)))
    for x in ut:
        print("  %s  %-36s %s" % (x["kort"], x["slug"], x["sku"]))
