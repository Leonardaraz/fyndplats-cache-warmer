# -*- coding: utf-8 -*-
"""Bygger runda 136:s Steg 13-payload till en FIL, som sedan grindas.

☠️ PUBLICERINGEN ÄR PRODUKTNIVÅ-`visible: true`, INGET MER. Uppmätt i runda
   135: produktens `true` speglas NED på varianten precis som dess `false`
   gör. En `variantsInfo`-PATCH hade varit farligare — fältet ERSÄTTS i sin
   helhet, och en utelämnad delmängd kan nolla priset.

☠️ PAYLOADEN FÅR ALDRIG BÄRA `variantsInfo`, `price`, `priceData` eller
   `costAndProfitData`. Priset rörs aldrig.

Grinden nedan körs på det som faktiskt SKICKAS, inte på det som byggdes.
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import grindar as G                                              # noqa: E402
import grind as GR                                               # noqa: E402
import matt as M                                                 # noqa: E402
import texter as T                                               # noqa: E402

FORBJUDNA_FALT = ("variantsInfo", "price", "priceData", "costAndProfitData",
                  "media", "plainDescription", "seoData", "name", "slug")


def payload(pid):
    # Revisionen hämtas färsk vid skrivningen — den står inte i filen.
    return {"id": M.WIX[pid], "visible": True}


if __name__ == "__main__":
    fel = []
    ut = {}
    for pid in T.NAMN:
        p = payload(pid)
        ut[pid] = p
        if p.get("visible") is not True:
            fel.append("%s: payloaden publicerar inte" % pid)
        for f in FORBJUDNA_FALT:
            if f in p:
                fel.append("%s: payloaden bär %r — Steg 13 rör bara synligheten"
                           % (pid, f))
        # ☠️ SISTA GRINDEN FÖRE KUNDEN. Allt som redan är skrivet prövas en
        #    gång till, för det är nu det blir synligt.
        for x in GR.granska(pid):
            fel.append("%s: %s" % (pid, x))
        ratt, forbjudna = M.TYP[pid]
        for falt, text in (("namn", T.NAMN[pid]), ("titel", T.TITEL[pid]),
                           ("meta", T.META[pid])):
            for m in G.ARTNR.finditer(text):
                fel.append("%s %s: ARTIKELNUMMER %r" % (pid, falt, m.group(0)))
            for o, s in G.versalfel(text):
                fel.append("%s %s: VERSAL MITT I ORD %r — %r" % (pid, falt, o, s))
            if not GR._vikt(ratt).search(text):
                fel.append("%s %s: saknar huvudordet %r" % (pid, falt, ratt))
            for f in forbjudna:
                if GR._vikt(f).search(text):
                    fel.append("%s %s: FEL TYPORD %r" % (pid, falt, f))
        if T.TITEL[pid] == T.NAMN[pid]:
            fel.append("%s: TITEL == NAMN" % pid)
        if len(T.NAMN[pid]) > 80:
            fel.append("%s: NAMN %d tecken" % (pid, len(T.NAMN[pid])))
    for x in fel:
        print("☠️", x)
    with open(os.path.join(HAR, "steg13.json"), "w", encoding="utf-8") as f:
        json.dump(ut, f, ensure_ascii=False, indent=1)
    print("steg13.json: %d produkter, %d fel" % (len(ut), len(fel)))
    sys.exit(1 if fel else 0)
