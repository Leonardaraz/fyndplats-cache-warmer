# -*- coding: utf-8 -*-
"""Facit för runda 101.

Hashar TAGGBEFRIAD, mellanslagsnormaliserad SYNLIG text — aldrig råmarkup.
Wix skriver om markupen (<strong> -> <span style=...>, <li>x</li> ->
<li><p>x</p></li>, lägger till target="_self"), så en hash över HTML kan
aldrig stämma hur rätt texten än är.

Aritmetiken (h*31 % 1e9+7) är exakt i BÅDE Python och JavaScript — h*31 med
h < 1e9 ger 3,1e10, långt under 2^53. FNV-1a:s h*16777619 gör det inte.
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import texter as T


def synlig(h):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h)).strip()


def hasha(s):
    h = 0
    for ch in s:
        h = (h * 31 + ord(ch)) % 1000000007
    return str(h)


def normalisera(h):
    """Det Wix FAKTISKT lagrar, givet vad vi skickar."""
    h = re.sub(r">\s*\n\s*<", "><", h)
    h = h.replace("<strong>", '<span style="font-weight: 700">')
    h = h.replace("</strong>", "</span>")
    h = re.sub(r'(<a href="[^"]+")>', r'\1 target="_self">', h)
    h = re.sub(r"<li>(?!<p>)(.*?)</li>", r"<li><p>\1</p></li>", h, flags=re.S)
    return h


if __name__ == "__main__":
    facit = {}
    for pid in T.PRODUKTER:
        h = T.bygg(pid)
        s = synlig(h)
        facit[pid] = {
            "modell": T.MODELL[pid],
            "namn": T.NAMN[pid],
            "slug": T.SLUGG[pid],
            "sku": T.SKU[pid],
            "seoTitel": T.SEO_TITEL[pid],
            "seoBeskrivning": T.SEO_BESKRIVNING[pid],
            "kalla_tecken": len(h),
            "lagrat_tecken": len(normalisera(h)),
            "synlig_tecken": len(s),
            "synlig_hash": hasha(s),
        }
    p = os.path.join(os.path.dirname(os.path.abspath(__file__)), "facit.json")
    with open(p, "w", encoding="utf-8") as f:
        json.dump(facit, f, ensure_ascii=False, indent=1)
    for pid, d in facit.items():
        print(f"{pid} {d['modell']}  källa {d['kalla_tecken']:5d} -> lagrat "
              f"{d['lagrat_tecken']:5d}  synlig {d['synlig_tecken']:5d}  "
              f"hash {d['synlig_hash']}")
