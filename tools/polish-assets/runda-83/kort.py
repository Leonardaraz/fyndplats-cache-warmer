# -*- coding: utf-8 -*-
"""Runda 83 — Fyndplats eget faktakort, ett per massagebänk.

⚠️ RADERNA SLÅS UPP PÅ ETIKETT, aldrig på position. Rundans spec-listor är
   olika uppbyggda: fyra bänkar har `Totalbredd med armhyllor`, fyra har
   ingen; `ed7a86fd` har `Totalmått` där andra har `Liggyta`; och två bänkar
   säger `Rekommenderad maxlast` där de andra säger `Maxlast`. Ett fast index
   hade pekat på fel rad på minst hälften av korten.

☠️ `d7eca2ba` HAR INGEN HÖJDRAD ATT SLÅ UPP, och `ed7a86fd` inte heller —
   höjdspannen är utelämnade med flit (två källor, två svar). Kortet byggs ur
   `p["spec"]`, så ett tal som inte finns i specen kan inte smyga in via
   kortet. Det är hela poängen med att bygga kortet ur samma lista linten
   granskar.

☠️ AVSAKNADEN FÅR INTE BLI KORTETS RUBRIK — husets regel sedan runda 82. Ett
   faktakort i galleriet ska bära det produkten ÄR. Att höjden saknas står
   som sidans vanliga fråga, där den som söker måttet faktiskt letar.
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
    "a353ea02": ("Massagebänk 3 zoner, vit", "Aluminiumram, tre vikbara zoner",
                 ["Liggyta", "Totalbredd med armhyllor", "Höjd", "Hopfälld",
                  "Vikt", "Maxlast"]),
    "5078bedf": ("Massagebänk 3 zoner, svart och röd", "Samma bänk som den vita",
                 ["Liggyta", "Totalbredd med armhyllor", "Höjd", "Hopfälld",
                  "Vikt", "Maxlast"]),
    "a9555a7d": ("Massagebänk i trä, creme", "Bärväska ingår",
                 ["Liggyta", "Totalbredd med armhyllor", "Höjd", "Hopfälld",
                  "Vikt", "Maxlast"]),
    "754a4749": ("Massagebänk i trä, svart", "Bärväska ingår",
                 ["Liggyta", "Totalbredd med armhyllor", "Höjd", "Hopfälld",
                  "Vikt", "Maxlast"]),
    "251f0429": ("Massagebänk 70 cm bred", "Rundans bredaste liggyta",
                 ["Liggyta", "Totallängd med ansiktsstöd", "Höjd", "Hopfälld",
                  "Vikt", "Maxlast"]),
    # ☠️ Ingen `Höjd`-rad att slå upp — spannet är utelämnat med flit.
    #    `Höjdlägen` är det båda källorna är eniga om och står i stället.
    "ed7a86fd": ("Massagebänk med armstöd", "Handbrädor och rundans tjockaste dyna",
                 ["Totalmått", "Höjdlägen", "Dynans tjocklek", "Hopfälld",
                  "Vikt", "Maxlast"]),
    "2cfd373a": ("Massagebänk 2 zoner, cremevit", "Rundans lättaste: 13 kg",
                 ["Totalmått", "Hopfälld", "Skummets tjocklek", "Ansiktskudde",
                  "Vikt", "Rekommenderad maxlast"]),
    # ☠️ Samma sak här: ingen höjdrad finns, och kortet ska inte hitta på en.
    "d7eca2ba": ("Massagebänk 2 zoner, svart", "Två zoner i trä, 13 kg",
                 ["Liggyta", "Hopfälld", "Skummets tjocklek", "Antal zoner",
                  "Vikt", "Rekommenderad maxlast"]),
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
