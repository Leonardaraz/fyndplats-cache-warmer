# -*- coding: utf-8 -*-
"""Uppgift #509: svep de PUBLICERADE sidorna med trekonsonantsregeln.

☠️ Anledningen är mätt, inte misstänkt. Runda 134 skrev `hoppplattform` i nio
   fält och tog sig grön genom hela Steg 7; det som fällde ordet var ÖGONEN på
   ett kontaktark. Steg 14:s kontrollsida visade sedan att felet redan ligger
   PUBLICERAT: `klostrad-200-cm-sex-nivaer` bär `Hoppplattform: 24 × 40 cm` i
   sin spec-tabell, och sitemapens sluggar bär `takhogt-katttrad`.

⚠️ INGEN CACHE-BUSTNING. Svepet LÄSER, det verifierar ingen färsk skrivning —
   en timmes ISR-cache är precis det kunden ser, och `hamta_isr`:s paus hade
   gjort 2 615 sidor till timmar. Cache-bust hör till Steg 14, inte hit.
"""
import collections
import concurrent.futures as cf
import io
import re
import sys
import urllib.request

sys.path.insert(0, "/home/user/fyndplats-cache-warmer/tools/polish-assets")
import grindar as G                                              # noqa: E402

ORD = re.compile(r"[0-9A-Za-zÅÄÖåäöÉéÜü][0-9A-Za-zÅÄÖåäöÉéÜü-]*")


def hamta(u):
    r = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(r, timeout=60) as s:
        return s.read().decode("utf-8", "replace")


def granska(u):
    slug = u.rsplit("/", 1)[-1]
    try:
        html = hamta(u)
    except Exception as e:                                       # noqa: BLE001
        return slug, None, str(e)
    text = G.synlig_meningstext(G.butikstvatt(html))
    traff = set()
    for m in G.TREKONSONANT.finditer(text):
        # Hela ORDET, inte bara de tre bokstäverna — runbokens regel är att
        # rätta per ORD, aldrig per förekomst.
        o = ORD.search(text, max(0, m.start() - 40))
        while o and o.end() <= m.start():
            o = ORD.search(text, o.end())
        traff.add(o.group(0) if o else m.group(0))
    return slug, traff, None


def main(urler):
    per_ord = collections.defaultdict(set)
    fel, klara = [], 0
    with cf.ThreadPoolExecutor(max_workers=16) as ex:
        for slug, traff, e in ex.map(granska, urler):
            klara += 1
            if e is not None:
                fel.append((slug, e))
                continue
            for o in traff:
                per_ord[o].add(slug)
            if klara % 250 == 0:
                print("   … %d/%d" % (klara, len(urler)), flush=True)
    print("\n%d publicerade sidor lästa, %d hämtningsfel" % (klara, len(fel)))
    for slug, e in fel[:20]:
        print("   HÄMTNING FÖLL", slug, e)
    print("\n%d ord med tre lika konsonanter:\n" % len(per_ord))
    for o, sidor in sorted(per_ord.items(), key=lambda kv: -len(kv[1])):
        print("%6d sidor  %-28s  %s" % (len(sidor), o,
                                        " ".join(sorted(sidor)[:4])))
    return per_ord


if __name__ == "__main__":
    u = [x.strip() for x in io.open("/tmp/alla-url.txt", encoding="utf-8")
         if "/produkt/" in x]
    main(u)
