# -*- coding: utf-8 -*-
"""Facit: längd + hash på den SYNLIGA texten, räknat ur texter.py.

Skrivningen går genom ett API-anrop, och en avskrivning kan drifta. Facit gör
driften mekaniskt upptäckbar: samma tal ska falla ut ur den lagrade texten och
ur den renderade sidan. Samma hash som runda 62 och 63.
"""
import io, json, re
from texter import PRODUKTER, bygg


def synlig(html):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html)).strip()


def hasha(s):
    h = 0
    for c in s:
        h = (h * 31 + ord(c)) % 1000000007
    return h


if __name__ == "__main__":
    ut = {}
    for p in PRODUKTER:
        t = synlig(bygg(p))
        ut[p["kort"]] = {"len": len(t), "hash": hasha(t),
                         "slug": p["slug"], "sku": p["sku"]}
        print("%s  len %4d  hash %10d  %s" % (p["kort"], len(t), hasha(t), p["slug"]))
    io.open("facit.json", "w", encoding="utf-8").write(
        json.dumps(ut, ensure_ascii=False, indent=1))
