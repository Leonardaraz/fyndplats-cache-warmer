# -*- coding: utf-8 -*-
"""Bygger runda 139:s Steg 7-payload till en FIL, som sedan grindas.

☠️ FILEN ÄR HELA POÄNGEN (batch 64: 9 fel inline mot 0 via fil).

☠️ `visible` SKICKAS INTE. Att skriva ut `visible: false` speglas ned på
   VARIANTEN, och en variant med `visible: false` saknar köpbar variant den
   dag sidan publiceras (uppmätt runda 120).

☠️ INGET `variantsInfo`. Varje sådan PATCH raderar variantens media (#501)
   och PUBLICERAR dessutom ett utkast (mätt 2026-08-28).
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import texter as T                                               # noqa: E402
import matt as M                                                 # noqa: E402
import grind as GR                                               # noqa: E402

FORBJUDNA_FALT = ("visible", "variantsInfo", "price", "priceData",
                  "costAndProfitData", "media", "options", "revision")


def hash_(t):
    """Samma formel i Python och i JS-sandboxen: h = (h*31 + charCode) % 1e9+7."""
    h = 0
    for c in t:
        h = (h * 31 + ord(c)) % 1000000007
    return h


def payload(pid):
    return {
        "id": M.WIX[pid],
        "name": T.NAMN[pid],
        "slug": T.SLUG[pid],
        "plainDescription": T.bygg(pid),
        "seoData": {
            "tags": [
                {"type": "title", "children": T.TITEL[pid],
                 "custom": False, "disabled": False},
                {"type": "meta", "children": "",
                 "custom": False, "disabled": False,
                 "props": {"name": "description", "content": T.META[pid]}},
            ],
            "settings": {
                "preventAutoRedirect": False,
                "keywords": [{"term": t, "isMain": i == 0, "origin": "USER"}
                             for i, t in enumerate(T.SOKORD[pid])],
            },
        },
    }


if __name__ == "__main__":
    fel = 0
    for x in GR._sjalvtest():
        print("  SJÄLVTEST:", x)
        fel += 1
    ut, hashar = {}, {}
    for pid in sorted(T.NAMN):
        f = GR.granska(pid)
        for x in f:
            print("  %s: %s" % (pid, x))
        fel += len(f)
        p = payload(pid)
        for fb in FORBJUDNA_FALT:
            if fb in p:
                print("  %s: FÖRBJUDET FÄLT %s i payloaden" % (pid, fb))
                fel += 1
        ut[pid] = p
        hashar[pid] = {"namn": hash_(p["name"]), "slug": hash_(p["slug"]),
                       "titel": hash_(T.TITEL[pid]), "meta": hash_(T.META[pid]),
                       "brod": hash_(p["plainDescription"]),
                       "brodlangd": len(p["plainDescription"])}
    if fel:
        print("\n%d FEL — ingenting skrivs" % fel)
        sys.exit(1)
    json.dump(ut, open(os.path.join(HAR, "steg7.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    json.dump(hashar, open(os.path.join(HAR, "steg7-hashar.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print("steg7.json + steg7-hashar.json skrivna, %d produkter, 0 fel" % len(ut))
