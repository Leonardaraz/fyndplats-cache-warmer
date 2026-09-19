# -*- coding: utf-8 -*-
"""Facit för Steg 14: längd + hash på den SYNLIGA texten.

☠️ Grinden ligger INNE i API-anropet. En felskriven sträng ska skriva
   NOLL, inte skriva fel och upptäckas efteråt.
"""
import json, re, sys
sys.path.insert(0, ".")
import texter

def synlig(html):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html)).strip()

def hasha(s):
    h = 0
    for c in s:
        h = (h * 31 + ord(c)) % 1000000007
    return h

ut = {}
for p in texter.PRODUKTER:
    s = synlig(texter.bygg(p))
    ut[p["kort"]] = {"synligLangd": len(s), "synligHash": hasha(s)}
json.dump(ut, open("facit.json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)
for k, v in ut.items():
    print(k, v["synligLangd"], v["synligHash"])
