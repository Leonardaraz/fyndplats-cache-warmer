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
    "37e5dfcf": "37e5dfcf-b1c2-4277-815c-3600dc29afd5",
    "dd5553fa": "dd5553fa-7e6e-4a5b-b017-1298d3bc57fb",
    "fd16efbc": "fd16efbc-61bb-4adf-b670-92a44a0abdc6",
    "4c1f5303": "4c1f5303-79f5-4ae4-ae78-eb2fd5e7a3ce",
    "7702de01": "7702de01-e472-482e-bcc0-6515c534f729",
    "e818cf7e": "e818cf7e-bf48-46e2-a796-19d9b1e83b9d",
    "afab8a41": "afab8a41-0e86-4683-8865-65fb8ea7eb3b",
    "a9c0fc05": "a9c0fc05-4516-4d44-adcc-8b42da8f9243",
    "75e5fa26": "75e5fa26-5ea0-4196-974a-4f4cad8eb7a9",
}
# ☠️ Wix-variantens id, aldrig feedens artikelnummer. Två fält heter `sku` och
#    betyder olika saker — den förväxlingen lät prissynken skriva till
#    ingenting i en månad (se CLAUDE.md).
VARIANTID = {
    "37e5dfcf": "a281dbb6-a699-460c-8637-17d801db7320",
    "dd5553fa": "42a11636-de71-43c2-aeff-cbec63e434dc",
    "fd16efbc": "d57c1a60-1340-4b7f-b674-7e874e84c5f5",
    "4c1f5303": "da32936b-660f-4933-8a19-7ccb774abef5",
    "7702de01": "7c5bb8e3-5c9e-4e48-8531-b9d7335961b4",
    "e818cf7e": "1015aece-1169-41c7-aa5b-0cd6732d32b5",
    "afab8a41": "4de4c7e7-c3f6-4317-beec-9a4a28359414",
    "a9c0fc05": "42a0a18d-16f4-4c0c-ad56-aed14446f4ca",
    "75e5fa26": "fec4d170-3e53-4822-9a8c-096601e00c98",
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
