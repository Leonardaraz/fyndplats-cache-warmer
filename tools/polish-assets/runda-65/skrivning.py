# -*- coding: utf-8 -*-
"""Bygger skrivning.json — EN post per produkt, exakt det som PATCH:as.

☠️ Texten skrivs i en FIL först och grep:as, aldrig inline i API-anropet.
   Uppmätt i batch 64: fem produkter skrivna inline gav NIO fel som nådde Wix,
   tre skrivna via fil gav noll. En sträng i ett JSON-anrop kan inte granskas
   innan den lämnar chatten, och svaret ekar tillbaka exakt det man skrev.
"""
import io
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)
from texter import PRODUKTER, bygg                                   # noqa: E402

ut = []
for p in PRODUKTER:
    ut.append({
        "id": p["id"],
        "kort": p["kort"],
        "name": p["name"],
        "slug": p["slug"],
        "sku": p["sku"],
        "seoData": {"tags": [
            {"type": "title", "children": p["title"]},
            {"type": "meta", "props": {"name": "description",
                                       "content": p["meta"]}},
        ]},
        "plainDescription": bygg(p),
    })

io.open(os.path.join(HAR, "skrivning.json"), "w", encoding="utf-8").write(
    json.dumps(ut, ensure_ascii=False, indent=1))
print("skrev %d poster" % len(ut))
