# -*- coding: utf-8 -*-
"""Runda 135 Steg 13 — publiceringens payload, byggd till FIL och grindad.

☠️ SKRIV TEXTEN I EN FIL FÖRST. En sträng som skrivs direkt i ett API-anrop
   kan ingen grind läsa innan den lämnar chatten, och svaret ekar tillbaka
   exakt det man skrev (husets mätning 2026-09-04: 9 fel mot 0).

☠️ `seoData` skrivs HELT, så `tags` måste följa med — Steg 7:s titel och
   meta skulle annars nollas av en PATCH som bara bär `settings.keywords`.

☠️ `variantsInfo` ligger INTE i den här payloaden, med flit. Fältet ersätts
   helt (samma familj som `media.itemsInfo`), så en variant skickad utan
   `price` kan nolla priset — och priset är det enda huset ALDRIG rör.
   Variantens synlighet mäts i stället EFTER produktskrivningen, på EN
   produkt, och åtgärdas bara om mätningen visar att den behövs.
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))

import grindar as G          # noqa: E402
import grind as GR           # noqa: E402
import texter as T           # noqa: E402
import matt as M             # noqa: E402

STEG7 = json.load(open(os.path.join(HAR, "steg7.json"), encoding="utf-8"))


def bygg():
    ut = {}
    for pid, sok in T.SOKORDSLISTA.items():
        tags = STEG7[pid]["seoData"]["tags"]
        ut[pid] = {
            "id": M.WIX[pid],
            "visible": True,
            "seoData": {
                "tags": tags,
                "settings": {
                    "preventAutoRedirect": False,
                    "keywords": [
                        {"term": t, "isMain": (i == 0), "origin": "USER"}
                        for i, t in enumerate(sok)
                    ],
                },
            },
        }
    return ut


def grinda(p):
    """Allt som inte får nå Wix. Returnerar en lista fel."""
    fel = []
    forbjudet = GR.FORBJUDET + GR.SVENSKAN
    for pid, d in p.items():
        namn = T.NAMN[pid]

        # 1. Fokusordet är FÖRST och ensamt isMain
        kw = d["seoData"]["settings"]["keywords"]
        huvud = [k for k in kw if k["isMain"]]
        if len(huvud) != 1:
            fel.append("%s: %d huvudsökord, ska vara exakt 1" % (pid, len(huvud)))
        elif kw[0]["term"] != huvud[0]["term"]:
            fel.append("%s: huvudsökordet ligger inte först" % pid)

        # 2. Inga dubbletter inom produkten
        termer = [k["term"] for k in kw]
        if len(set(termer)) != len(termer):
            fel.append("%s: dubblerat sökord" % pid)

        # 3. ☠️ Ingen tyska, inget leverantörsnamn, inget artikelnummer i sökorden
        for t in termer:
            for monster, skal in forbjudet:
                if monster.search(t):
                    fel.append("%s: sökord %r fälls — %s" % (pid, t, skal))
            if G.ARTNR.search(t):
                fel.append("%s: ARTIKELNUMMER i sökord %r" % (pid, t))
            if G.versalfel(t):
                fel.append("%s: versal mitt i ord i sökord %r" % (pid, t))

        # 4. ☠️ Produkttypen måste stämma — klöspelare är INTE klösträd (#462)
        ratt, fel_ord = M.TYP[pid]
        if not any(ratt in t.lower() for t in termer):
            fel.append("%s: inget sökord bär produkttypen %r" % (pid, ratt))
        for t in termer:
            if fel_ord in t.lower():
                fel.append("%s: FEL produkttyp %r i sökord %r" % (pid, fel_ord, t))

        # 5. seoData.tags måste följa med, annars nollas Steg 7:s titel/meta
        tags = d["seoData"]["tags"]
        titel = [x for x in tags if x["type"] == "title"]
        meta = [x for x in tags if x["type"] == "meta"]
        if len(titel) != 1 or titel[0]["children"] != T.TITEL[pid]:
            fel.append("%s: titeln matchar inte texter.TITEL" % pid)
        if len(meta) != 1 or meta[0]["props"]["content"] != T.META[pid]:
            fel.append("%s: metan matchar inte texter.META" % pid)

        # 6. visible MÅSTE vara True här — och det är enda stället i kedjan
        if d.get("visible") is not True:
            fel.append("%s: visible är inte True" % pid)

        # 7. ☠️ Inget pris- eller variantfält får smyga med
        for farligt in ("variantsInfo", "price", "priceData", "costAndProfitData"):
            if farligt in d:
                fel.append("%s: payloaden bär %s — får aldrig skrivas här" % (pid, farligt))

        # 8. Namnet ska finnas i katalogens facit (fångar en tappad produkt)
        if pid not in M.WIX:
            fel.append("%s: saknar Wix-id" % pid)
        assert namn

    if len(p) != 8:
        fel.append("payloaden bär %d produkter, rundan är 8" % len(p))
    return fel


if __name__ == "__main__":
    payload = bygg()
    fel = grinda(payload)
    for f in fel:
        print("FEL:", f)
    print("%d produkter, %d sökord, %d fel"
          % (len(payload),
             sum(len(d["seoData"]["settings"]["keywords"]) for d in payload.values()),
             len(fel)))
    if not fel:
        with open(os.path.join(HAR, "steg13.json"), "w", encoding="utf-8") as fh:
            json.dump(payload, fh, ensure_ascii=False, indent=1)
        print("skrivet: steg13.json")
    else:
        sys.exit(1)
