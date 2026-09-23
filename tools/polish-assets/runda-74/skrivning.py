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
    "e1c41327": "e1c41327-6f98-46e6-9de9-0b5a96c7420b",
    "58fb3025": "58fb3025-8ab9-462c-a518-55357029ba88",
    "66adcdff": "66adcdff-a7f2-4bd2-af13-e49ed5e75759",
    "4a9c33d2": "4a9c33d2-da68-402b-a142-5cd0e5b03f26",
    "791e7292": "791e7292-31ed-49ad-a410-10037d265b52",
    "bc220489": "bc220489-c456-4215-a961-c435f05fbe3b",
    "84082d41": "84082d41-0e82-40dd-ba3a-d53d085b7d0c",
    "7e00970f": "7e00970f-f9d5-4e05-a87e-1dcf10468c64",
}
# ☠️ Wix-variantens id, aldrig feedens artikelnummer. Två fält heter `sku` och
#    betyder olika saker — den förväxlingen lät prissynken skriva till
#    ingenting i en månad (se CLAUDE.md).
VARIANTID = {
    "e1c41327": "3372a05b-3e1a-4834-bff4-24b244a580a3",
    "58fb3025": "6f11b900-89f3-483a-8d8b-1c7388a27cdf",
    "66adcdff": "ea2a89cd-4141-4330-94ff-834d883a0fec",
    "4a9c33d2": "8ca2df4d-085a-486c-b291-fd3eed1976af",
    "791e7292": "cd7e9aea-8d7d-4b9b-8b00-51fc12774b79",
    "bc220489": "848828e5-0cbc-424e-af1f-57c17aab8436",
    "84082d41": "99fcb9de-4858-4f77-8573-9c60c6477326",
    "7e00970f": "a469efef-9750-4ae4-bb29-0c13da27790c",
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
