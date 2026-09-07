# -*- coding: utf-8 -*-
"""Runda 90 — Fyndplats eget faktakort, ett per sparkcykel.

☠️ HJÄLTEBILDEN ÄR `<id>-0.jpg`, produktbilden mot vit botten. Alla sju är
   fotade så, vilket är varför 215 kB-taket klaras utan oskärpa — runda 88:s
   livsstilsbilder med lövverk sprängde det på alla åtta.

☠️ RUBRIKERNA ÄR VALDA MOT HJÄLTEBILDEN, inte mot texten. Steg 4 mätte fyra
   saker som rubrikerna nu bär:
   · `5129f6b0` har en RÖD BROMSVAJER som löper längs den vita ramen.
   · `50b28808` har en RÖD FRAMGAFFEL — resten av ramen är svart.
   · `85be4535` är familjens ENDA modell C med svarta fälgar; blå och rosa
     har fälgar i sin egen färg. Det är det enda som skiljer dem i en
     miniatyr.
   · `eb4418ad` har en ORANGE stötdämpare under styrstammen.

⚠️ HJULTYPEN LIGGER PÅ VARJE KORT, och det är rundans egentliga axel:
   modell G har LUFTDÄCK och kan gå platt, modell A och C massiva EVA-hjul
   som inte kan det. Ett kort som bara sa "Ø40 cm" mot "Ø30 cm" hade dolt
   den skillnad som faktiskt avgör vilken kunden ska välja.
"""
import json
import os
import shutil
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)

from kortbygge import bygg                                            # noqa: E402
import texter                                                         # noqa: E402

KORTPLAN = {
    "5129f6b0": ("Sparkcykel barn, 139 cm", "Vit ram med röd bromsvajer",
                 ["Mått", "Hjul", "Broms", "Maxlast", "Vikt", "Färg"]),
    "50b28808": ("Sparkcykel barn, 139 cm", "Svart ram med röd framgaffel",
                 ["Mått", "Hjul", "Broms", "Maxlast", "Vikt", "Färg"]),
    "9518db1e": ("Sparkcykel barn, 115 cm", "Blå ram och blå femekersfälgar",
                 ["Mått", "Hjul", "Broms", "Maxlast", "Vikt", "Färg"]),
    "473084eb": ("Sparkcykel barn, 115 cm", "Rosa och vit ram med rosa fälgar",
                 ["Mått", "Hjul", "Broms", "Maxlast", "Vikt", "Färg"]),
    # Den enda modell C med SVARTA fälgar — blå och rosa har fälgar i sin
    # egen färg. Mätt i Steg 4, inte läst i källan.
    "85be4535": ("Sparkcykel barn, 115 cm", "Vit och svart ram med svarta fälgar",
                 ["Mått", "Hjul", "Broms", "Maxlast", "Vikt", "Färg"]),
    "68f8f1a7": ("Sparkcykel barn, 12 tum", "Ljust rosa ram och svarta hjul",
                 ["Mått", "Hjul", "Broms", "Maxlast", "Vikt", "Färg"]),
    "eb4418ad": ("Hopfällbar sparkcykel, 94 cm", "Orange stötdämpare under styret",
                 ["Mått", "Hopfälld", "Hjul", "Broms", "Maxlast", "Vikt"]),
}


def specrader(pid):
    """Spec-tabellen som `Etikett: värde`-strängar, samma form kortbygget tar."""
    return ["%s: %s" % (k, v) for k, v in texter.P[pid]["spec"]]


def index_for(spec, etikett):
    """Radens index, uppslaget på HELA etiketten. Kastar hellre än gissar."""
    traff = [i for i, r in enumerate(spec)
             if ": " in r and r.split(": ", 1)[0].lower() == etikett.lower()]
    if len(traff) != 1:
        raise SystemExit("%r matchar %d rader i specen för produkten — tvetydigt"
                         % (etikett, len(traff)))
    return traff[0]


PRODUKTER, kortdata = [], {}
for pid in texter.P:
    spec = specrader(pid)
    kicker, rubrik, etiketter = KORTPLAN[pid]
    PRODUKTER.append({"kort": pid, "spec": spec})
    kortdata[pid] = (kicker, rubrik, [(e, index_for(spec, e)) for e in etiketter])

KALLA = os.path.join(HAR, "kortkalla")
os.makedirs(os.path.join(KALLA, "rawbilder"), exist_ok=True)
for p in PRODUKTER:
    shutil.copyfile(os.path.join(HAR, "rawbilder", p["kort"] + "-0.jpg"),
                    os.path.join(KALLA, "rawbilder", p["kort"] + "-1.jpg"))

namn, facit = bygg(KALLA, PRODUKTER, kortdata)
json.dump(facit, open(os.path.join(HAR, "kort-facit.json"), "w",
                      encoding="utf-8"), ensure_ascii=False, indent=1)
print("kort-facit.json skriven,", len(namn), "kort")
