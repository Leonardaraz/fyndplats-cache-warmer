# -*- coding: utf-8 -*-
"""Bygger nyttolasten till Wix UR DEN GRINDADE TEXTEN. (Runda 75.)

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
    "75f6c433": "75f6c433-8ec2-44cc-b98d-ffbf8f3670ac",
    "7ab2f8aa": "7ab2f8aa-d858-40b8-92f1-12fa0f8b90ea",
    "60c803f0": "60c803f0-14a0-408f-a454-76f48a075742",
    "cc81673d": "cc81673d-de53-42fa-a8d1-6390b7fd847b",
    "0945e4dd": "0945e4dd-5c4c-478c-86fc-822b3732a598",
    "348ee535": "348ee535-e1c7-4677-a6f1-335e0500b1ad",
    "4d83eca6": "4d83eca6-2877-4fc9-9698-424241ac7e9d",
}
# ☠️ Wix-variantens id, aldrig feedens artikelnummer. Två fält heter `sku` och
#    betyder olika saker — den förväxlingen lät prissynken skriva till
#    ingenting i en månad (se CLAUDE.md).
VARIANTID = {
    "75f6c433": "d133872f-f4a2-405e-90a9-16f865206fe5",
    "7ab2f8aa": "491cf3df-0318-4100-a547-05c22812e2fb",
    "60c803f0": "83863ddb-3f86-4ccf-8718-d7205218f77b",
    "cc81673d": "2e11b5b8-da1e-4b96-a143-a7ce14588077",
    "0945e4dd": "2b40afb4-664f-45d4-ac0e-b81d67329d55",
    "348ee535": "b8461fc6-cda0-4a48-8548-349aa3dc1f02",
    "4d83eca6": "7dd640af-9c08-456c-a30b-dfc523f597c5",
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
