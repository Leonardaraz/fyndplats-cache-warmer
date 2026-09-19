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
    "969d9ec9": "969d9ec9-6d25-429d-981f-5285028cf46f",
    "b72f093d": "b72f093d-d72d-4c1e-9aa8-e2202ad1ef36",
    "54cf1f44": "54cf1f44-9ae5-4f13-aa1b-3dd1a19dc61b",
    "acb1f904": "acb1f904-3af1-494e-8648-a17e98928d86",
    "e57125fb": "e57125fb-7f34-4287-8f7b-0f9d47a1a9a6",
    "b1e98da4": "b1e98da4-473b-467a-b363-47a77aa26fd4",
    "b67fdc2b": "b67fdc2b-7999-4720-998d-35fe01f65533",
    "7eee41b6": "7eee41b6-4e06-4ea1-aadc-0d831fb75e6b",
}
# ☠️ Wix-variantens id, aldrig feedens artikelnummer. Två fält heter `sku` och
#    betyder olika saker — den förväxlingen lät prissynken skriva till
#    ingenting i en månad (se CLAUDE.md).
VARIANTID = {
    "969d9ec9": "8c5b6495-fe85-4ec7-b673-2d38ca272653",
    "b72f093d": "0e572fff-5111-42e4-81de-75fd681ec1be",
    "54cf1f44": "6c74affe-6b1e-4359-85fb-b6bc0f7aab71",
    "acb1f904": "5d0df1ca-3705-43c9-a3c5-0c935e20d96c",
    "e57125fb": "858be6e0-a32b-4a7b-8dfa-a0918dc8a3f1",
    "b1e98da4": "b49511fa-ecc9-4876-ba30-86b383648821",
    "b67fdc2b": "113172f9-1e27-4b15-9f07-effab1e86968",
    "7eee41b6": "169a84d3-a234-4f9d-95b5-b0192e04f130",
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
