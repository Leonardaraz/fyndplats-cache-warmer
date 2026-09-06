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
    "64856235": "64856235-88ed-4d49-89e0-c51291a9d21f",
    "35872574": "35872574-16c7-4f63-b6c3-2835508cc157",
    "4f6bef7d": "4f6bef7d-34dc-4266-bc37-309f216bf3f7",
    "f192540f": "f192540f-2ea7-46b9-8744-561b22246ee1",
    "78cb09ba": "78cb09ba-d942-458d-bc90-8ac2c8d3bcfe",
    "8f6636e4": "8f6636e4-74fc-48d1-a974-89b76e51341d",
    "b8001a1b": "b8001a1b-b143-4a32-85ed-ca8b875e7aee",
    "dbbe7253": "dbbe7253-6718-4ac7-b1fd-3e968cbc9bc8",
}
# ☠️ Wix-variantens id, aldrig feedens artikelnummer. Två fält heter `sku` och
#    betyder olika saker — den förväxlingen lät prissynken skriva till
#    ingenting i en månad (se CLAUDE.md).
VARIANTID = {
    "64856235": "4f51355b-827e-4871-a104-f585b70f4d54",
    "35872574": "64bc3ba9-5262-4497-810d-3833f319b5c2",
    "4f6bef7d": "b1f62d0b-64c0-4af2-8f6d-e23120577b2f",
    "f192540f": "0404363b-7644-4335-a030-8a0844bd48d9",
    "78cb09ba": "cb795f9c-9304-4ef5-bc26-92df99b07b05",
    "8f6636e4": "644062e3-c368-48d0-b022-dc39613f0f97",
    "b8001a1b": "e26e43f4-a6ff-4f07-85d8-1a6af5b79ebd",
    "dbbe7253": "39b22122-b027-41d7-b743-269ceddd6b42",
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
