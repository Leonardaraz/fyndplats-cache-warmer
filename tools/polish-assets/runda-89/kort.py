# -*- coding: utf-8 -*-
"""Runda 89 — Fyndplats eget faktakort, ett per sparkcykel.

☠️ HJÄLTEBILDEN ÄR `<id>-0.jpg`. Runda 88 mätte varför: livsstilsbilder med
   gräs och lövverk sprängde 215 kB-taket på alla åtta, och en framsökning
   av oskärpan nådde radie 5,7 utan att konvergera. Här är alla sex redan
   fotade mot VIT botten, så taket klaras utan oskärpa.

   `kortbygge.kalla()` slår upp `<har>/rawbilder/<id>-1.jpg`, så vald hjälte
   kopieras till `kortkalla/rawbilder/` och DEN katalogen skickas som `har`.
   Råbilderna rörs aldrig.

☠️ RUBRIKERNA ÄR VALDA MOT HJÄLTEBILDEN, inte mot texten. Steg 4 mätte tre
   saker som rubrikerna nu bär:
   · A2 har V-broms och kromad gaffel — syns rakt av i förstoringen.
   · D har LIKA STORA hjul; F har ett märkbart större framhjul. Det är det
     enda som skiljer dem i en liten bild, och båda finns i turkos.
   · `479e9c2e`:s fälg är SILVERFÄRGAD. Bara gaffeln är röd — rubriken
     säger gaffeln, inget annat.

⚠️ STYRHÖJDEN LIGGER PÅ VARJE KORT. Den är rundans egentliga storleksaxel:
   A2:s lägsta läge (92 cm) ligger ÖVER D:s högsta (80 cm), medan alla tre
   anges "från 5 år". Åldern kan alltså inte hjälpa kunden välja — höjden kan.
"""
import json
import os
import shutil
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)

from kortbygge import bygg                                            # noqa: E402
from texter import PRODUKTER                                          # noqa: E402

KORTPLAN = {
    "c4375606": ("Sparkcykel barn, 143 cm", "Svart ram, kromad gaffel, V-broms",
                 ["Mått", "Hjul", "Bromsar", "Maxlast", "Vikt", "Färg"]),
    "79186373": ("Sparkcykel barn, 143 cm", "Rosa ram och två lika stora 16-tumshjul",
                 ["Mått", "Hjul", "Bromsar", "Maxlast", "Vikt", "Färg"]),
    # Gaffeln är röd, fälgen silverfärgad — mätt i Steg 4, inte läst i feeden.
    "479e9c2e": ("Sparkcykel barn, 120 cm", "Svart ram med röd framgaffel",
                 ["Mått", "Hjul", "Bromsar", "Maxlast", "Vikt", "Färg"]),
    "d9239c8e": ("Sparkcykel barn, 120 cm", "Turkos ram och familjens lägsta styre",
                 ["Mått", "Hjul", "Bromsar", "Maxlast", "Vikt", "Färg"]),
    "4fd26086": ("Sparkcykel barn, 135 cm", "Orange ram och stort framhjul Ø41 cm",
                 ["Mått", "Framhjul", "Bakhjul", "Bromsar", "Maxlast", "Färg"]),
    "89deaca7": ("Sparkcykel barn, 135 cm", "Turkos ram och stort framhjul Ø41 cm",
                 ["Mått", "Framhjul", "Bakhjul", "Bromsar", "Maxlast", "Färg"]),
}


def index_for(spec, etikett):
    """Radens index, uppslaget på HELA etiketten. Kastar hellre än gissar."""
    traff = [i for i, r in enumerate(spec)
             if ": " in r and r.split(": ", 1)[0].lower() == etikett.lower()]
    if len(traff) != 1:
        raise SystemExit("%r matchar %d rader i specen — tvetydigt"
                         % (etikett, len(traff)))
    return traff[0]


kortdata = {}
for p in PRODUKTER:
    kicker, rubrik, etiketter = KORTPLAN[p["kort"]]
    kortdata[p["kort"]] = (kicker, rubrik,
                           [(e, index_for(p["spec"], e)) for e in etiketter])

KALLA = os.path.join(HAR, "kortkalla")
os.makedirs(os.path.join(KALLA, "rawbilder"), exist_ok=True)
for p in PRODUKTER:
    shutil.copyfile(os.path.join(HAR, "rawbilder", p["kort"] + "-0.jpg"),
                    os.path.join(KALLA, "rawbilder", p["kort"] + "-1.jpg"))

namn, facit = bygg(KALLA, PRODUKTER, kortdata)
json.dump(facit, open(os.path.join(HAR, "kort-facit.json"), "w",
                      encoding="utf-8"), ensure_ascii=False, indent=1)
print("kort-facit.json skriven")
