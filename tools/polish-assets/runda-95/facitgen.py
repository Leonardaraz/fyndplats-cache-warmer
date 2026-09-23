# -*- coding: utf-8 -*-
"""Runda 95 — facit for aterlasningen efter PATCH.

☠️ WIX SKRIVER OM HTML:EN VID SPARANDE. `<strong>X</strong>` blir
   `<span style="font-weight: 700">X</span>`, varje `<li>text</li>` far ett
   `<p>` inuti, och `<a href>` far `target="_self"`. En hash pa RAMARKUP kan
   darfor aldrig stamma. Facit rakans pa TAGGSTRIPPAD, blanksteg-normaliserad
   SYNLIG TEXT — det ar det kunden laser, och det ar det Wix inte ror.
"""
import json
import re

import texter as T


def synlig(h):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h)).strip()


def hasha(s):
    h = 0
    for ch in s:
        h = (h * 31 + ord(ch)) % 1000000007
    return h


if __name__ == "__main__":
    facit = {}
    for pid in T.PRODUKTER:
        h = T.beskrivning(pid)
        s = synlig(h)
        facit[pid] = {
            "grupp": T.GRUPP[pid],
            "slug": T.SLUGG[pid],
            "namn": T.namn(pid),
            "seoTitel": T.seo_titel(pid),
            "seoBeskrivning": T.seo_beskrivning(pid),
            "sokord": T.SOKORD[pid],
            "sku": T.SKU[pid],
            "kort": list(T.KORT[pid]),
            "htmlTecken": len(h),
            "synligaTecken": len(s),
            "synligHash": hasha(s),
            "lankar": re.findall(r'href="([^"]+)"', h),
        }
        open("html-%s.html" % pid, "w", encoding="utf-8").write(h)
        print("%s  %s  %d synliga tecken  hash %d"
              % (pid, T.GRUPP[pid], len(s), hasha(s)))
    json.dump(facit, open("facit.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print("\nfacit.json skrivet")
