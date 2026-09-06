# -*- coding: utf-8 -*-
"""Bygger nyttolasten till Wix UR DEN GRINDADE TEXTEN. (Runda 76.)

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
    "10235819": "10235819-719f-462c-b721-0936cc017c8e",
    "4fa0ae0a": "4fa0ae0a-276e-48eb-a720-60bfeb107824",
    "143f9b2d": "143f9b2d-9e47-42bd-81ed-65336015a5f0",
    "6e05f8b7": "6e05f8b7-c7e1-4181-b26e-5d8e5ccdaa40",
    "4293c5ce": "4293c5ce-971b-489d-8596-f8b64dca3289",
    "a5454821": "a5454821-28f8-4fe7-acdd-73b1dc6bbceb",
    "0f7021fb": "0f7021fb-b223-4f86-80dc-825a1683c05f",
    "ce10bfe8": "ce10bfe8-03da-4bd7-b37b-9b089046fd71",
}
# ☠️ Wix-variantens id, aldrig feedens artikelnummer. Två fält heter `sku` och
#    betyder olika saker — den förväxlingen lät prissynken skriva till
#    ingenting i en månad (se CLAUDE.md).
VARIANTID = {
    "10235819": "6a9fc4e5-33c9-4746-9547-300e97e2369d",
    "4fa0ae0a": "2be4dc94-4a9a-4d41-9673-e239627f82f7",
    "143f9b2d": "e2c1f27b-d8ac-44fd-97eb-bb5bcafcb83b",
    "6e05f8b7": "a26c2d4c-2626-4aaf-a720-8cded676c8ea",
    "4293c5ce": "3e0e316f-3609-4214-b643-535e5c954394",
    "a5454821": "dbcfc452-4edb-4aa4-be1b-6386cbecaf1c",
    "0f7021fb": "b315f139-dd2a-46bc-9908-0393dee365d3",
    "ce10bfe8": "165a1f3d-bb92-4d79-b6f8-ee55f1ca80d9",
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
