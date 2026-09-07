# -*- coding: utf-8 -*-
"""Runda 93 — Fyndplats eget faktakort, ett per pergoladuk.

☠️ HJÄLTEBILDEN ÄR BILD 1, produktrendern mot VIT botten. Den är också den
   enda av leverantörens fem bilder som är helt fri från både tysk text och
   logotyp i originalskick — de tre livsstilsbilderna bar båda.

☠️ RUBRIKEN ÄR VALD MOT HJÄLTEBILDEN och lintas i `texter.KORT`. Det som
   skiljer de tre sidorna åt i en miniatyr är ENBART dukens kulör, så
   rubriken måste namnge färgen. Färgerna är mätta i bilden, inte lånade
   ur tyskan: kaffe är MÖRKARE än braun.

⚠️ "Ingår" är med på kortet med flit. Att bara duken följer med — ingen
   stomme, inga skenor, inga stänger — är den dyraste missuppfattningen
   en kund kan göra på den här sidan, och den hör hemma i miniatyren.
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)

from kortbygge import bygg                                            # noqa: E402
import texter                                                         # noqa: E402

ETIKETTER = ["Mått", "Passar", "Material", "Dräneringshål", "Stångfickor", "Ingår"]

KORTPLAN = texter.KORT


def specrader(pid):
    return ["%s: %s" % (k, v) for k, v in texter.spec(texter.FARG[pid])]


def index_for(spec, etikett):
    traff = [i for i, r in enumerate(spec)
             if ": " in r and r.split(": ", 1)[0].lower() == etikett.lower()]
    if len(traff) != 1:
        raise SystemExit("%r matchar %d rader — tvetydigt" % (etikett, len(traff)))
    return traff[0]


PRODUKTER, kortdata = [], {}
for pid in texter.PRODUKTER:
    spec = specrader(pid)
    kicker, rubrik = KORTPLAN[pid]
    PRODUKTER.append({"kort": pid, "spec": spec})
    kortdata[pid] = (kicker, rubrik, [(e, index_for(spec, e)) for e in ETIKETTER])

KALLA = os.path.join(HAR, "kortkalla")

if __name__ == "__main__":
    namn, facit = bygg(KALLA, PRODUKTER, kortdata)
    json.dump(facit, open(os.path.join(HAR, "kort-facit.json"), "w",
                          encoding="utf-8"), ensure_ascii=False, indent=1)
    print("kort-facit.json skriven,", len(namn), "kort")
