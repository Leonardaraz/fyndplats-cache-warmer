# -*- coding: utf-8 -*-
"""Runda 140 Steg 8, halva 1: Wix EGEN variant-SKU.

☠️ STEGET HAR TVÅ HALVOR. `polish-mapping.yml` skriver MAPPNINGENS
   `variants[].sku`; Wix egen variant-SKU rörs inte av den, och det är den
   kunden och feeden ser (#388, uppmätt i runda 108).

☠️ `visible` SKICKAS EXPLICIT I BÅDA LEDEN. En `variantsInfo`-PATCH
   publicerar annars utkastet, och produktens `false` speglas ned på
   varianten.

☠️ `price` SKICKAS TILLBAKA VERBATIM — en `variantsInfo`-skrivning kräver
   fältet, och den som utelämnar det rör priset.

☠️ Matchning på `wixVariantId`, ALDRIG på position.
"""
import collections
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import texter as T                                               # noqa: E402
import matt as M                                                 # noqa: E402

with open(os.path.join(HAR, "steg8-plan.json"), encoding="utf-8") as fh:
    _rad = json.load(fh)
PLAN = {k: v for k, v in _rad.items() if not k.startswith("_")}


def body(pid):
    p = PLAN[pid]
    return {
        "product": {
            "revision": p["rev"],
            "visible": False,
            "variantsInfo": {"variants": [{
                "id": p["vid"],
                "visible": True,
                "sku": T.SKU[pid],
                "price": {"actualPrice": {"amount": p["pris"]}},
            }]},
        },
        "fieldMask": ["visible", "variantsInfo"],
    }


if __name__ == "__main__":
    assert set(PLAN) == set(T.NAMN), set(T.NAMN) ^ set(PLAN)
    gamla = collections.Counter(v["gammal"] for v in PLAN.values())
    print("gamla tyska SKU som DELAS av flera produkter:")
    for s, n in sorted(gamla.items()):
        if n > 1:
            print("   %-30s %d produkter" % (s, n))
    nya = collections.Counter(T.SKU[k] for k in PLAN)
    print("krockar i de NYA:", [s for s, n in nya.items() if n > 1] or "inga")
    print("alla nya <= 40 tecken:", all(len(T.SKU[k]) <= 40 for k in PLAN))
    fel = [k for k, v in PLAN.items() if int(v["pris"]) != M.M[k]["pris"]]
    print("pris som INTE stammer mot Steg 3:", fel or "inga")
    print()
    for k in sorted(PLAN):
        print("### %s  %s" % (k, M.ID[k]))
        print(json.dumps(body(k), ensure_ascii=False))
