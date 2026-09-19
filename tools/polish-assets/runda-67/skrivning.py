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
    "04feb176": "04feb176-a4fb-4fdc-a8a0-64df247d93aa",
    "6a4e92c4": "6a4e92c4-8ce6-498a-8da7-ade9dd849dd1",
    "ceae31c1": "ceae31c1-74aa-4784-98a5-3da442973e9a",
    "1b39b14e": "1b39b14e-17e7-4517-8578-d6ae01910232",
    "7f437bac": "7f437bac-f115-494b-8d99-c34fcad0eaff",
    "87262869": "87262869-9ed3-4da9-9b5e-e636698931af",
    "9794b6df": "9794b6df-5043-4989-a7f9-a6c3dd761e18",
    "9946e1eb": "9946e1eb-58e1-4fde-9108-c18ab3d0b6fb",
}
VARIANTID = {
    "04feb176": "adc0f312-e1f5-4300-aee4-2e1fbc66bf50",
    "6a4e92c4": "2354917c-b5ba-44da-8606-b68e72480a2f",
    "ceae31c1": "97846ae5-eee0-4b31-8e14-8c5ec7d475e8",
    "1b39b14e": "693fe8f0-5705-47b7-9e19-3de64bc34a8a",
    "7f437bac": "b7f14649-685e-47a8-a465-40575cc5266f",
    "87262869": "60579ec3-09fc-4d4b-9e05-8754f2f1b4d2",
    "9794b6df": "0b002743-8515-4c2e-affc-93fd008ec5a3",
    "9946e1eb": "c65c7356-c45c-4a6c-8557-062b41c8b8ca",
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
