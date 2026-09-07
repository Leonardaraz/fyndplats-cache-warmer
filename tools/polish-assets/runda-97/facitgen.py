# -*- coding: utf-8 -*-
"""Runda 97 — facit för återläsningen efter PATCH.

☠️ WIX SKRIVER OM HTML:EN VID SPARANDE (`<strong>` → `<span style=…>`,
   `<li>x</li>` → `<li><p>x</p></li>`, `<a href>` får `target="_self"`). En
   hash på RÅMARKUP kan därför aldrig stämma. Facit räknas på TAGGSTRIPPAD,
   blanksteg-normaliserad SYNLIG TEXT — det kunden läser, och det Wix inte rör.
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
    alt = json.load(open("media-alt.json", encoding="utf-8"))
    plan = json.load(open("bildplan.json", encoding="utf-8"))
    facit = {}
    for pid in T.PRODUKTER:
        h = T.beskrivning(pid)
        s = synlig(h)
        # ⚠️ Bilderna + kortet ska vara lika många som alt-texterna.
        vantat = len(plan[pid]) + 1
        if len(alt[pid]) != vantat:
            raise SystemExit("%s har %d alt-texter men %d bilder + kort"
                             % (pid, len(alt[pid]), vantat))
        if len(set(alt[pid])) != len(alt[pid]):
            raise SystemExit("%s har alt-texter som inte är inbördes unika" % pid)
        facit[pid] = {
            "grupp": T.GRUPP[pid],
            "slug": T.SLUGG[pid],
            "namn": T.namn(pid),
            "seoTitel": T.seo_titel(pid),
            "seoBeskrivning": T.seo_beskrivning(pid),
            "sokord": T.SOKORD[pid],
            "sku": T.SKU[pid],
            "bilder": plan[pid],
            "altTexter": len(alt[pid]),
            "htmlTecken": len(h),
            "synligaTecken": len(s),
            "synligHash": hasha(s),
            "lankar": re.findall(r'href="([^"]+)"', h),
        }
        open("html-%s.html" % pid, "w", encoding="utf-8").write(h)
        print("%s  %s  %4d synliga tecken  %d bilder + kort  hash %d"
              % (pid, T.GRUPP[pid], len(s), len(plan[pid]), hasha(s)))
    json.dump(facit, open("facit.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print("\nfacit.json skrivet")
