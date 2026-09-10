"""Genererar skrivning.json ur texter.bygg() med ordsumma per produkt.

Ordsumman är kvittot i Steg 12/14: h = (h*31 + charCode) % 1000000007 över
taggstrippad, blankstegsnormaliserad text.
"""
import json
import re

import matt
import texter


def ordsumma(html):
    text = re.sub(r"<[^>]+>", "", html)
    text = re.sub(r"\s+", " ", text).strip()
    h = 0
    for ch in text:
        h = (h * 31 + ord(ch)) % 1000000007
    return h


if __name__ == "__main__":
    ut = {}
    for pid in matt.ALLA:
        namn, slug, titel, meta, sokord, html = texter.bygg(pid)
        ut[pid] = {"namn": namn, "slug": slug, "titel": titel, "meta": meta,
                   "sokord": sokord, "html": html, "ordsumma": ordsumma(html)}
    gammal = json.load(open("skrivning.json"))
    for pid in matt.ALLA:
        f, t = gammal[pid]["ordsumma"], ut[pid]["ordsumma"]
        mark = "  ← ÄNDRAD" if f != t else ""
        print(f"{pid}  {f:>10} → {t:>10}{mark}")
    json.dump(ut, open("skrivning.json", "w"), ensure_ascii=False, indent=1)
    print("\nskrivning.json omgenererad")
