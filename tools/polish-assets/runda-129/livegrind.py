# -*- coding: utf-8 -*-
"""Runda 129 Steg 14 — grindar den PUBLICERADE sidan, inte utkastet.

☠️ FILEN ÄR AVSIKTLIGT TUNN. Reglerna bor i `grind.granska(pid, html, live=True)`;
   den här hämtar HTML:en och skickar in den. Runda 127:s live-grind var 219
   rader egna kopior — alltså en tvilling till källgrinden, och tvillingar
   glider isär (`SHIP_AXIS_RE`, `EU_TULL_CODES`, live-grindens TVÄTT som gav
   12 fel på 8 korrekta sidor i runda 121).

⚠️ HÄMTNINGEN MÅSTE CACHE-BUSTA. ISR-cachen ligger en timme, så en vanlig
   hämtning direkt efter publiceringen serverar UTKASTET — och det ser ut
   precis som en trasig sida. Runda 60 fällde åtta korrekta sidor på det.
   `G.hamta_isr` lägger på `?cb=` OCH väntar ut ett `x-vercel-cache: STALE`.

☠️ KORTGRINDEN (`G.kortfel`) KÖRS HÄR. Klart-kriteriet "minst ett eget
   Fyndplats-kort i galleriet" stod i runbooken men i ingen kod, och steget
   glömdes i åtta rundor i rad. Steg 14 är sista steget före "klar".
"""
import sys

sys.path.insert(0, "..")
sys.path.insert(0, ".")

import grindar as G          # noqa: E402
import grind as GR           # noqa: E402
import texter as T           # noqa: E402

BAS = "https://www.fyndplats.se/produkt/"


def main(pids=None):
    sfel, santal = G._sjalvtest()
    print("grindar._sjalvtest(): %d fall, %d fel" % (santal, len(sfel)))
    for f in sfel:
        print("   SJÄLVTEST:", f)

    pids = pids or list(T.SLUG)
    total = 0
    for pid in pids:
        slug = T.SLUG[pid]
        try:
            html, huvuden = G.hamta_isr(BAS + slug)
        except SystemExit as e:
            print("%-9s HÄMTNING FÖLL: %s" % (pid, e))
            total += 1
            continue
        cache = huvuden.get("x-vercel-cache", "?")
        fel = G.kortfel(html) + GR.granska(pid, html=G.butikstvatt(html), live=True)
        total += len(fel)
        print("%-9s %-42s %-6s %d fel" % (pid, slug, cache, len(fel)))
        for f in fel:
            print("     -", f)
    print()
    print("SUMMA: %d sidor, %d fel" % (len(pids), total))
    return total


if __name__ == "__main__":
    sys.exit(1 if main(sys.argv[1:] or None) else 0)
