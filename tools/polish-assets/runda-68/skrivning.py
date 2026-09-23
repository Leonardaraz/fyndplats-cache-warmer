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
    "8ca7b3c3": "8ca7b3c3-8d8b-4b6a-b501-9c77c8c5f9b4",
    "79797c9a": "79797c9a-e56d-4fbb-9da1-045b5c77a9d5",
    "9a2f6417": "9a2f6417-3613-4540-a1f7-dace6b90faf3",
    "dfb7fcbe": "dfb7fcbe-d0f2-4caa-9478-e4a76be7c1c5",
    "fbba0de8": "fbba0de8-8b11-4c9c-ac90-2c34632516e8",
    "99e2d675": "99e2d675-4e19-4223-b840-f33becfbd28d",
    "07d52f21": "07d52f21-5daf-44f1-a4d3-c36e50b256cf",
    "ed930c42": "ed930c42-a204-4fda-99aa-34659871ced4",
}
VARIANTID = {
    "8ca7b3c3": "1adba6f9-0c7d-4506-9b64-b665a6a66100",
    "79797c9a": "04440bcc-207c-41a3-839a-ebc0096c3a52",
    "9a2f6417": "e6827f92-9e82-4836-89e9-458f4e3e7b1b",
    "dfb7fcbe": "41bb5db1-37ca-477c-8bbc-fbd3bfefe4a8",
    "fbba0de8": "18faf009-ae33-44b3-ba7e-794ad36572aa",
    "99e2d675": "677c16dd-b2b2-437e-a2b9-fb57e76ac544",
    "07d52f21": "6fd5dd8c-e47b-4b98-b8f2-b7322a5fcbd2",
    "ed930c42": "e87d141f-d074-4ab1-ab5b-7e2b30222971",
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
