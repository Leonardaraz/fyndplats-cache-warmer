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
    "73112149": "73112149-1b60-47ea-843a-4ed4ff884850",
    "5c0e83d1": "5c0e83d1-f400-40f3-b606-235c04449727",
    "84e3794d": "84e3794d-ace2-45d4-bf2b-886d04c5ff6e",
    "021a268e": "021a268e-9b20-4ea1-95ce-b40e993e12f1",
    "266c5e75": "266c5e75-9806-4d5f-a598-9cb14368bf1f",
    "d2409a95": "d2409a95-3340-4cf3-ac28-0435825c4941",
    "9bd6d1d4": "9bd6d1d4-f694-4a09-9bfc-b5d8e3853659",
    "566c7702": "566c7702-4338-4f24-b93f-8b43dd01c033",
}
# ☠️ Wix-variantens id, aldrig feedens artikelnummer. Två fält heter `sku` och
#    betyder olika saker — den förväxlingen lät prissynken skriva till
#    ingenting i en månad (se CLAUDE.md).
VARIANTID = {
    "73112149": "ef740cf7-c3c3-42ac-8974-f860d3fdd2dd",
    "5c0e83d1": "4e7b8e39-8ac2-4e87-9e94-628be47bc88b",
    "84e3794d": "24944ae0-f194-4dba-a80f-c1b54f98d90b",
    "021a268e": "f3127a92-13a5-4f9d-9396-32dc4eed84a9",
    "266c5e75": "f75c72d8-dfd5-4173-b670-985dd9c343ea",
    "d2409a95": "71c71318-ab08-4927-b323-bdebf8b111ae",
    "9bd6d1d4": "a5dbed0a-3099-4748-996b-add4f378a14a",
    "566c7702": "0c419bc9-c060-4479-b55e-fa278691215d",
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
