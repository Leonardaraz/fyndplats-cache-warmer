# -*- coding: utf-8 -*-
"""Runda 65 — ett spec-kort per produkt (Klart-kriteriet: minst ett eget kort).

☠️ VÄRDENA HÄRLEDS UR spec-tabellen, de skrivs aldrig om. Kortet pekar på en
RAD (index i p["spec"]) och tar det som står efter kolonet. Runda 60 fick en
andra sanning när ett kort skrev "3 min 15 s" där tabellen sa "3 minuter
15 sekunder"; med härledning kan det inte hända.

☠️ RUBRIKEN MÅSTE BÄRAS AV FOTOT under den. Varje titel nedan är vald mot
bild 1 (produkten på vit botten) och beskriver något som syns i den — aldrig
en egenskap man måste läsa sig till.
"""

import io
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HAR)
sys.path.insert(0, os.path.dirname(HAR))
import kortbygge                                                  # noqa: E402
from texter import PRODUKTER                                      # noqa: E402

KORT = {
    "db645ff8": ("Golvfåtölj i blått", "Sitter direkt på golvet", [
        ("Mått uppställd", 0), ("Helt utfälld", 1), ("Stoppning", 2),
        ("Ryggens lägen", 3), ("Maxlast", 4), ("Vikt", 7)]),
    "88425b27": ("Böjd träfanér", "Fåtölj och fotpall i samma ram", [
        ("Fåtölj", 0), ("Fotpall", 1), ("Sitthöjd", 3),
        ("Nackkudde", 5), ("Maxlast stol", 6), ("Maxlast fotpall", 7)]),
    "03c9d570": ("Liten fåtölj, 60 cm", "Fyra smala metallben", [
        ("Mått", 0), ("Sits", 1), ("Ryggstöd", 2),
        ("Armstöd", 4), ("Maxlast", 5), ("Vikt", 8)]),
    "bb7b7bd4": ("Loungefåtölj i björkfanér", "Böjd ram utan bakben", [
        ("Mått", 0), ("Sits", 1), ("Ryggstöd", 2),
        ("Armstödshöjd", 3), ("Maxlast", 4), ("Vikt", 7)]),
    "89c89322": ("Armlös snurrfåtölj", "Hela bredden är sittyta", [
        ("Mått", 0), ("Sits", 1), ("Sittdyna", 2),
        ("Ryggstöd", 3), ("Sockel", 4), ("Maxlast", 5)]),
    "3dab61f0": ("Reclinerfåtölj i konstläder", "Fotpallen står på egen fot", [
        ("Fåtölj", 0), ("Fotpall", 3), ("Sits", 1),
        ("Fotplattan", 4), ("Maxlast stol", 5), ("Maxlast fotpall", 6)]),
    "eb400961": ("Fåtölj i konstläder", "Medar i stället för bakben", [
        ("Mått", 0), ("Sits", 1), ("Sittdyna", 2),
        ("Ryggstöd", 3), ("Maxlast", 5), ("Vikt", 8)]),
    "2823c605": ("Reclinerfåtölj med snurrfot", "Bas i böjt trä", [
        ("Mått upprätt", 0), ("Fullt fälld", 1), ("Fotpall", 2),
        ("Fritt bakom", 6), ("Maxlast", 7), ("Vikt", 10)]),
}


# ☠️ Bouclén är högfrekvent brus som JPEG inte komprimerar; kortet låg 107
#    byte över taket vid q=85. Uppmjukningen träffar FOTOT, aldrig kortet.
MJUKA = {"89c89322": 0.6}


if __name__ == "__main__":
    namn, facit = kortbygge.bygg(HAR, PRODUKTER, KORT, MJUKA)
    io.open(os.path.join(HAR, "kort-facit.json"), "w", encoding="utf-8").write(
        json.dumps(facit, ensure_ascii=False, indent=1))
    for n in namn:
        print("%-22s %7d byte" % (n, os.path.getsize("jpg/%s.jpg" % n)))
