# -*- coding: utf-8 -*-
"""Runda 116 Steg 8 — SKU:erna, räknade ur SLUGGEN och inte ur namnet.

☠️ IMPORTEN GAV TRE PRODUKTER SAMMA SKU. Alla tre i grupp A bär
   `FP-hundebuggy-hundewagen`, och tre av fyra i grupp B bär
   `FP-hundewagen-faltbar`. Krocken skapas av `lib/import/sku.ts`, som kapar
   den tyska sluggen vid 24 tecken — inte av poleringen (uppgift #272).

☠️ KAPNINGEN KAN SLÅ IHOP TVÅ SLUGGAR IGEN. `hundvagn-med-korg-dammrosa` och
   `hundvagn-med-korg-ljusgra` blir efter fogeordsstrykning
   `hundvagn-korg-dammrosa` (22) och `hundvagn-korg-ljusgra` (21) — båda under
   taket, alltså distinkta. Men marginalen är två tecken, så `kontroll()`
   räknar efter i stället för att lita på det.
"""
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
import grindar as G                                              # noqa: E402
sys.path.insert(0, HAR)
import matt as M                                                 # noqa: E402
import texter as T                                               # noqa: E402

SKU = {k: "FP-" + G.sku_bas(T.SLUG[k]) for k in M.ALLA}


def kontroll():
    if len(set(SKU.values())) != len(SKU):
        dubbla = [v for v in SKU.values() if list(SKU.values()).count(v) > 1]
        raise SystemExit(f"☠️ SKU-KROCK EFTER KAPNINGEN: {sorted(set(dubbla))} "
                         f"— sluggen måste skilja sig INOM 24 tecken")
    for k, v in SKU.items():
        if len(v) > 27:                       # "FP-" + 24
            raise SystemExit(f"☠️ {k}: SKU {v!r} är {len(v)} tecken")
        # ☠️ SKU:n är ASCII, färgordet är det inte. `röd` finns aldrig i
        #    `FP-hundvagn-4-kg-rod`, så kontrollen måste vika ned å/ä/ö —
        #    annars fäller den på varenda rad och blir bortkommenterad.
        farg = M.FARG[k].translate(str.maketrans("åäöÅÄÖ", "aaoAAO"))
        if farg not in v:
            raise SystemExit(f"☠️ {k}: färgen {farg!r} överlevde inte kapningen "
                             f"i {v!r} — då skiljer SKU:erna inte färgerna åt")
    print(f"sku.kontroll: {len(set(SKU.values()))} unika SKU på {len(SKU)} "
          f"produkter, färgen bevarad i alla   OK")


if __name__ == "__main__":
    kontroll()
    for k in M.ALLA:
        print(f"  {k}  {T.SLUG[k]:<28} → {SKU[k]}  ({len(SKU[k])} tecken)")
