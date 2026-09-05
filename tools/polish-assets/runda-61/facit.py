# -*- coding: utf-8 -*-
"""Facit för texten. ☠️ Jämför den SYNLIGA texten, inte HTML:en: Wix
normaliserar taggar (<strong> → <span style="font-weight: 700">, <li>X</li> →
<li><p>X</p></li>, <a> får target="_self"), så en byte-exakt HTML-jämförelse
fäller varje korrekt skrivning. Normaliseringen rör aldrig ORDEN."""
import re, json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from texter import P

def synlig(h):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h)).strip()

def hasha(s):
    h = 0
    for c in s:
        h = (h * 31 + ord(c)) % 1000000007
    return h

if __name__ == "__main__":
    ut = {}
    for k, v in P.items():
        s = synlig(v["html"])
        ut[k] = {"langd": len(s), "hash": hasha(s), "namn": v["name"],
                 "slug": v["slug"], "title": v["title"], "meta": v["meta"]}
        print("%-10s langd %4d  hash %10d" % (k, len(s), hasha(s)))
    json.dump(ut, open("facit.json", "w"), ensure_ascii=False, indent=1)
