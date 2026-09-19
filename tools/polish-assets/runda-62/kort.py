# -*- coding: utf-8 -*-
"""Runda 62 — DATAN till de åtta egna korten. Bygget bor i ../kortbygge.py.

☠️ RUNDA 62 HAR INGEN `spec`-NYCKEL. Två modeller (`spec_d` / `spec_g`)
   returnerar FÄRDIG HTML, och färg och vikt vävs in per produkt. Raderna
   plockas därför ur samma `<li>` som kunden läser — inte ur en andra,
   handskriven lista. En sådan hade varit en tvilling som glider isär, och
   kortets hela poäng är att värdet är HÄRLETT ur spec-tabellen.

Åtta produkter men bara TVÅ modeller: tre D och fem G, i övrigt färgsyskon.
Rubriken skiljer alltså på MODELL (en lång knädyna mot två separata) och
kickern på FÄRG — det är den enda skillnad fotot faktiskt visar.
"""
import json
import os
import re
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)

from kortbygge import bygg                                        # noqa: E402
import texter                                                     # noqa: E402

LI = re.compile(r"(?s)<li>(.*?)</li>")


def specrader(p):
    """Spec-tabellens rader, ordagrant ur den HTML produktsidan visar."""
    html = (texter.spec_d if p["modell"] == "D" else texter.spec_g)(
        p["farg"], p["vikt"])
    return [re.sub(r"<[^>]+>", "", r).strip() for r in LI.findall(html)]


# modell -> (rubrik, [(etikett, radindex)])
MODELL = {
    # Fotot: EN lång, genomgående knädyna och medar som bär hela stommen.
    "D": ("En enda lång knädyna", [
        ("Mått", 0), ("Sittyta", 1), ("Knädyna", 2),
        ("Skrivbordshöjd", 4), ("Maxlast", 5), ("Vikt", 9)]),
    # Fotot: TVÅ separata knädynor bredvid varandra.
    "G": ("Två separata knädynor", [
        ("Mått", 0), ("Sittyta", 1), ("Sitthöjd", 2),
        ("Knädyna", 3), ("Maxlast", 5), ("Vikt", 9)]),
}
KICKER = {"D": "Gungande knästol, %s", "G": "Knästol i björk, %s"}

PRODUKTER = [dict(p, spec=specrader(p)) for p in texter.PRODUKTER]
KORT = {p["kort"]: (KICKER[p["modell"]] % p["farg"].lower(),
                    MODELL[p["modell"]][0], MODELL[p["modell"]][1])
        for p in PRODUKTER}

if __name__ == "__main__":
    namn, facit = bygg(HAR, PRODUKTER, KORT)
    with open(os.path.join(HAR, "kort-facit.json"), "w", encoding="utf-8") as f:
        json.dump(facit, f, ensure_ascii=False, indent=1)
    for n in namn:
        print("%-20s %7d byte" % (n, os.path.getsize("jpg/%s.jpg" % n)))
