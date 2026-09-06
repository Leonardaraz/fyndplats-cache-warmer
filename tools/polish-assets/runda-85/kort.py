# -*- coding: utf-8 -*-
"""Runda 85 — Fyndplats eget faktakort, ett per sorteringstunna.

⚠️ RADERNA SLÅS UPP PÅ ETIKETT, aldrig på position. `a00882ed` saknar
   `Doftblockshållare` och har därför en rad KORTARE spec än de tre första;
   `ec672f4d` är byggd på en helt annan axel (`Rammått`, `Öppningsmått`,
   `Stora hinken`, `Små hinkarna`) och har ingen `Öppning`-rad alls. Ett
   fast index hade pekat på fel rad på fyra av sex kort.

☠️ RUBRIKERNA ÄR VALDA MOT FOTOT, INTE MOT TEXTEN — och rundans familj gör
   den regeln svår på ett nytt sätt: `b10b80ee` och `10c47f8e` är SAMMA
   tunna i två ytor, och den naturliga rubriken ("Samma tunna, i svart")
   är precis den sortens ord utan referent som lint-grind 5c fäller.
   Kortet ligger ensamt i galleriet: kunden ser inte det andra syskonet.
   Båda beskriver därför sin EGEN yta, som syns i bilden ovanför.

☠️ INGEN RUBRIK NÄMNER MATERIALET på de fyra i rostfritt. Rundan har tre
   olika stommaterial bland sex syskon, och materialet är den enda uppgift
   där ett kopierat kort hade blivit en lögn. Det står i spec-raden
   `Stomme`, som byggs ur `p["spec"]` — alltså ur samma lista linten
   granskar — och kan därför inte glida från brödtexten.

⚠️ VOLYMEN LIGGER FÖRST PÅ VARJE KORT. Fem av sex tunnor har två fack och
   skiljs i praktiken på storlek; det är den axeln kunden jämför på.
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)

from kortbygge import bygg                                            # noqa: E402
from texter import PRODUKTER                                          # noqa: E402

KORTPLAN = {
    # ☠️ Rubriken hette "Låg och bred" i ett första utkast och var FEL: tunnan
    #    är 41,7 cm bred och 43,2 cm hög, alltså knappt högre än bred — inte
    #    bred. Felet syntes först i kontaktarket, där rubriken står bredvid
    #    fotot. Talet i rubriken bär den nu, utan jämförelseord.
    # Bilden: låg, kompakt låda i mörk borstad yta, två pedaler bredvid varandra.
    "17fb1869": ("Soptunna med 2 fack, 30 liter", "Låg modell — 43,2 cm hög",
                 ["Volym", "Mått", "Öppning", "Lock", "Stomme", "Vikt"]),
    # Bilden: blank silverfärgad stålyta som speglar ljuset.
    "b10b80ee": ("Soptunna med 2 fack, 40 liter", "Polerad stålyta i silver",
                 ["Volym", "Mått", "Antal fack", "Innerhinkar", "Stomme", "Vikt"]),
    # Bilden: samma kropp, men blank svart yta.
    "10c47f8e": ("Soptunna med 2 fack, 40 liter", "Blank svart yta",
                 ["Volym", "Mått", "Antal fack", "Innerhinkar", "Stomme", "Vikt"]),
    # Bilden: tydligt smalare och högre proportion än de andra.
    "213be879": ("Soptunna med 2 fack, 40 liter", "Smal och hög — 40 cm bred",
                 ["Volym", "Mått", "Öppning", "Handtag", "Stomme", "Vikt"]),
    # Bilden: matt vit kropp med svart lockram och svart sockel.
    "a00882ed": ("Soptunna med 2 fack, 60 liter", "Matt vit yta, 67 cm hög",
                 ["Volym", "Mått", "Lock", "Innerhinkar", "Stomme", "Vikt"]),
    # Bilden: en grå enhet där ram, skenor och lock sitter ihop.
    "ec672f4d": ("Utdragbar soptunna med 3 fack, 31 liter",
                 "Ram, skenor och lock i en enhet",
                 ["Volym", "Antal fack", "Rammått", "Stora hinken",
                  "Små hinkarna", "Montering"]),
}


def index_for(spec, etikett):
    """Radens plats i spec-listan, uppslagen på etikett — aldrig gissad."""
    for i, rad in enumerate(spec):
        if rad.split(":")[0].split("(")[0].strip() == etikett:
            return i
    raise SystemExit("saknar spec-raden %r i %s" % (etikett, spec))


KORT = {}
for _p in PRODUKTER:
    _k = _p["kort"]
    _rub, _und, _etiketter = KORTPLAN[_k]
    KORT[_k] = (_rub, _und,
                [(e, index_for(_p["spec"], e)) for e in _etiketter])

# ☠️ FOTOT MJUKAS UPP, ALDRIG KORTET — husets regel sedan runda 63. Fylls i
#    först när ett kort faktiskt spränger 215 kB-taket, inte i förväg.
MJUKA = {}

if __name__ == "__main__":
    namn, facit = bygg(HAR, PRODUKTER, KORT, MJUKA)
    with open(os.path.join(HAR, "kort-facit.json"), "w", encoding="utf-8") as f:
        json.dump(facit, f, ensure_ascii=False, indent=1)
    for n in namn:
        print("%-26s %7d byte" % (n, os.path.getsize(os.path.join(HAR, "jpg/%s.jpg" % n))))
