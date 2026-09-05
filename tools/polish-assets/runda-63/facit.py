# -*- coding: utf-8 -*-
"""Facit för runda 62: längd + hash av den SYNLIGA texten, räknad ur filen.

Skrivningen till Wix kräver att texten transkriberas in i ett API-anrop, och
det är precis där batch 64 mätte nio fel. Facit är motmedlet: efter PATCH:en
läses texten tillbaka, taggarna strippas, blanktecken kollapsas — och längd och
hash måste stämma. Byte-exakt jämförelse fungerar inte, för Wix normaliserar
HTML:en (<strong> blir <span style="font-weight: 700"> osv).
"""
import json
import os
import re
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HAR)
import texter  # noqa: E402


def synlig(html):
    t = re.sub(r"<[^>]+>", " ", html)
    return re.sub(r"\s+", " ", t).strip()


def hasha(s):
    h = 0
    for ch in s:
        h = (h * 31 + ord(ch)) % 1000000007
    return h


def bygg_facit():
    ut = {}
    for p in texter.PRODUKTER:
        s = synlig(texter.bygg(p))
        ut[p["kort"]] = {
            "id": p["id"], "slug": p["slug"], "name": p["name"],
            "langd": len(s), "hash": hasha(s),
        }
    return ut


if __name__ == "__main__":
    f = bygg_facit()
    with open(os.path.join(HAR, "facit.json"), "w", encoding="utf-8") as fh:
        json.dump(f, fh, ensure_ascii=False, indent=1, sort_keys=True)
    for k, v in sorted(f.items()):
        print("%s  langd %4d  hash %10d  %s" % (k, v["langd"], v["hash"], v["slug"]))
