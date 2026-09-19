# -*- coding: utf-8 -*-
"""Runda 86 — Fyndplats eget faktakort, ett per trädgårdsskåp.

⚠️ RADERNA SLÅS UPP PÅ ETIKETT, aldrig på position. Familjens spec-listor är
   olika långa och olika uppbyggda: `d6666869` har `Grundyta` där `8b00022f`
   har `Bottenmått`, `364bc564` har `Fackhöjder uppifrån och ner` som ingen
   annan har, och `43e312b7` har en `Fällbart bord`-rad mitt i måtten. Ett
   fast index hade pekat på fel rad på nästan varje kort.

☠️ MAXLASTEN LIGGER PÅ SEX AV SJU KORT — men `d6666869` har ingen rad att
   slå upp, och får därför ingen. Kortet byggs ur `p["spec"]`, alltså ur
   samma lista linten granskar, så en uppgift källan inte ger kan inte smyga
   in via kortet. Det är hela poängen med att inte skriva korten för hand.

☠️ AVSAKNADEN FÅR INTE BLI KORTETS RUBRIK — husets regel sedan runda 82.
   `d6666869`:s kort bär de två dörrarna, som är det skåpet ÄR; att
   maxlasten saknas står som sidans vanliga fråga, där den som undrar letar.

☠️ RUBRIKERNA ÄR VALDA MOT FOTOT, INTE MOT TEXTEN. Varje rubrik pekar på
   något som syns i bilden ovanför: kryssdörren, den grå ytan med vita
   lister, fönstret under taket, de två dörrarna över varandra, det fällda
   bordet, lamellerna, dubbeldörren. Höjden står aldrig ensam i en rubrik —
   den syns inte i ett foto utan referens.

⚠️ YTTERMÅTTET LIGGER FÖRST PÅ VARJE KORT. Familjen är sju skåp som skiljs
   på var de får plats, och det är den axeln kunden jämför på.
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
    # Bilden: ljus obehandlad ton, ett kryss över hela dörren, låg låda.
    "c9a24404": ("Trädgårdsskåp i trä, 115 cm", "Naturträ med kryssad dörr",
                 ["Yttermått", "Invändigt", "Hyllplan", "Maxlast",
                  "Material", "Vikt med emballage"]),
    # Bilden: grå stomme, vitt kryss, mörkt tak.
    "bb112e08": ("Trädgårdsskåp i trä, 115 cm", "Grått med vita lister",
                 ["Yttermått", "Invändigt", "Hyllplan", "Maxlast",
                  "Färg", "Vikt med emballage"]),
    # Bilden: smal och hög, grönt sadeltak, ett litet fönster högst upp.
    "1e11480e": ("Trädgårdsskåp, 77 cm brett", "Fönster högst upp under taket",
                 ["Yttermått", "Invändigt", "Golvyta", "Hyllor", "Maxlast",
                  "Vikt"]),
    # Bilden: två dörrar över varandra, båda öppna, hyllor och nisch.
    # ☠️ Ingen maxlastrad — källan anger ingen för det här skåpet.
    "d6666869": ("Trädgårdsskåp, 191,5 cm", "Två dörrar över varandra",
                 ["Yttermått", "Grundyta", "Dörrar", "Hyllplan", "Tak",
                  "Vikt med emballage"]),
    # Bilden: grått skåp med det fällbara bordet utfällt på vänster sida.
    "43e312b7": ("Trädgårdsskåp grått, 182 cm", "Fällbart bord på utsidan",
                 ["Yttermått", "Invändigt", "Fällbart bord", "Maxlast",
                  "Markfrigång", "Vikt med emballage"]),
    # Bilden: naturträ, två dörrar helt klädda med lameller.
    "364bc564": ("Trädgårdsskåp, 160 cm", "Lamelldörrar som släpper in luft",
                 ["Yttermått", "Dörrar", "Hyllplan",
                  "Fackhöjder uppifrån och ner", "Maxlast",
                  "Vikt med emballage"]),
    # Bilden: brett grått skåp, vita kryss, två dörrar över hela fronten.
    "8b00022f": ("Trädgårdsskåp, 139 cm brett", "Dubbeldörr över hela fronten",
                 ["Yttermått", "Bottenmått", "Dörrar", "Maxlast", "Fothöjd",
                  "Vikt med emballage"]),
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
