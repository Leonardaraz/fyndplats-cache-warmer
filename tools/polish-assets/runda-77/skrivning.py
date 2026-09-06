# -*- coding: utf-8 -*-
"""Runda 77, Steg 6 — bygger skrivning.json och facit.json ur texter.py.

Facit är synlig längd + hash. Grinden flyttas sedan IN i API-anropet
(`jsgen.py`), så att en text som ändras på vägen genom chatten aldrig når Wix.
"""
import json
import os
import re

import lint
import texter

HAR = os.path.dirname(os.path.abspath(__file__))
BILDER = json.load(open(os.path.join(HAR, "bilder.json"), encoding="utf-8"))

lint.FEL = []
lint.kor()
if lint.FEL:
    raise SystemExit("linten fäller — skriv inte:\n" + "\n".join(lint.FEL))


def hasha(s):
    h = 0
    for c in s:
        h = (h * 31 + ord(c)) % 1000000007
    return h


def synlig(h):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h)).strip()


skriv, facit = [], {}
for p in texter.PRODUKTER:
    html = texter.bygg(p)
    s = synlig(html)
    skriv.append({"kort": p["kort"], "id": BILDER[p["kort"]]["id"],
                  "name": p["name"], "slug": p["slug"],
                  "seoTitle": p["title"], "seoDescription": p["meta"],
                  "html": html})
    facit[p["kort"]] = {"synligLangd": len(s), "synligHash": hasha(s)}
    print("%-9s %-30s len %4d  hash %d" % (p["kort"], p["slug"], len(s), hasha(s)))

json.dump(skriv, open(os.path.join(HAR, "skrivning.json"), "w"),
          ensure_ascii=False, indent=1)
json.dump(facit, open(os.path.join(HAR, "facit.json"), "w"),
          ensure_ascii=False, indent=1)
print("\nskrivning.json + facit.json skrivna")
