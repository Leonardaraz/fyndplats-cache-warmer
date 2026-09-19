# -*- coding: utf-8 -*-
"""Bygger runda 140:s Steg 7-payload till en FIL, som sedan grindas.

☠️ FILEN ÄR HELA POÄNGEN (batch 64: 9 fel inline mot 0 via fil).

☠️ ExecuteWixAPI svarar 403 hela rundan, så skrivningen går via
   `CallWixSiteAPI` — en kropp som KLISTRAS för hand. Det är precis den risk
   hashen finns för. Varje produkt bär därför både teckenantal och
   klisterhash här, och ingen produkt räknas som skriven förrän Steg 14:s
   live-grind läst tillbaka sidan och jämfört den byte för byte.

☠️ `visible` SKICKAS INTE. Att skriva ut `visible: false` speglas ned på
   VARIANTEN, och en variant med `visible: false` saknar köpbar variant den
   dag sidan publiceras.

☠️ INGET `variantsInfo`. Varje sådan PATCH raderar variantens media (#501)
   och PUBLICERAR dessutom ett utkast.
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
                  "costAndProfitData", "media", "options", "ribbon")

FALTMASK = ["name", "slug", "plainDescription", "seoData"]


def hash_(t):
    """Samma formel i Python och i JS: h = (h*31 + charCode) % 1e9+7."""
    h = 0
    for c in t:
        h = (h * 31 + ord(c)) % 1000000007
    return h


def payload(pid, revision):
    return {
        "product": {
            "revision": str(revision),
            "name": T.NAMN[pid],
            "slug": T.SLUG[pid],
            "plainDescription": T.bygg(pid),
            "seoData": {
                "tags": [
                    {"type": "title", "children": T.TITEL[pid],
                     "custom": False, "disabled": False},
                    {"type": "meta", "children": "",
                     "custom": True, "disabled": False,
                     "props": {"name": "description", "content": T.META[pid]}},
                ],
                "settings": {
                    "preventAutoRedirect": False,
                    "keywords": [{"term": t, "isMain": i == 0, "origin": "USER"}
                                 for i, t in enumerate(T.SOKORD[pid])],
                },
            },
        },
        "fieldMask": FALTMASK,
    }


# Revisionerna lästa 2026-09-13 ~09:50 UTC. En felaktig revision ger 409
# INVALID_REVISION — den skriver aldrig tyst.
REVISION = {
    "01fcdf1d": 1, "bb3cd4ed": 1, "881540a6": 2, "5b8162d1": 1,
    "1835c144": 3, "9ee2fa6e": 1, "c11948ac": 1, "c9ccf5a3": 1,
    "4c5d4687": 2, "68f8cae9": 1, "ee19a8c8": 1, "2ba6baf0": 1,
    "22c7de56": 2, "07ac9918": 1,
}

if __name__ == "__main__":
    fel = 0
    ut = {}
    for pid in sorted(T.NAMN):
        f = GR.granska(pid)
        if f:
            fel += len(f)
            print("%s: %d GRINDFEL" % (pid, len(f)))
            for x in f:
                print("   - " + x)
            continue
        p = payload(pid, REVISION[pid])
        for falt in FORBJUDNA_FALT:
            assert falt not in p["product"], (pid, falt)
        assert set(p["product"]) - {"revision"} == set(FALTMASK), pid
        ut[pid] = {
            "id": M.ID[pid],
            "revision": p["product"]["revision"],
            "namn": T.NAMN[pid],
            "slug": T.SLUG[pid],
            "sku": T.SKU[pid],
            "tecken": len(p["product"]["plainDescription"]),
            "hash": hash_(p["product"]["plainDescription"]),
            "body": p,
        }
    if fel:
        print("\n%d GRINDFEL — ingenting skrivs" % fel)
        sys.exit(1)
    with open(os.path.join(HAR, "steg7.json"), "w", encoding="utf-8") as fh:
        json.dump(ut, fh, ensure_ascii=False, indent=1)
    print("%d produkter klara" % len(ut))
    print("%-9s %-30s %6s %12s" % ("p8", "slug", "tecken", "hash"))
    for pid, d in sorted(ut.items()):
        print("%-9s %-30s %6d %12d" % (pid, d["slug"], d["tecken"], d["hash"]))
