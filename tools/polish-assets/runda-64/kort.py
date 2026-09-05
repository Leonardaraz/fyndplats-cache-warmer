# -*- coding: utf-8 -*-
"""Runda 64 — ett spec-kort per produkt. Byggreglerna bor i ../kortbygge.py.

Rubrikerna är valda mot bild 1 och beskriver något som SYNS där: de två
snurrfötterna, mugghållarna i armstöden, de spretande benen, träarmstöden.
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
    "5e2dee74": ("Reclinerfåtölj som gungar", "Vilar på en svart snurrfot", [
        ("Mått upprätt", 0), ("Tillbakalutad", 1), ("Sits", 2),
        ("Sidofickor", 6), ("Maxlast", 8), ("Vikt", 12)]),
    "e76002c1": ("Tv-fåtölj i mikrofiber", "Mugghållare i båda armstöden", [
        ("Mått upprätt", 0), ("Liggläge", 1), ("Sits", 2),
        ("Mugghållare", 5), ("Maxlast", 6), ("Vikt", 10)]),
    "17620f5b": ("Reclinerfåtölj med fotpall", "Fotpallen har egen snurrfot", [
        ("Mått upprätt", 0), ("Liggläge", 1), ("Fotpall", 2),
        ("Fritt bakom", 5), ("Maxlast sits", 6), ("Maxlast fotpall", 7)]),
    "b09d20b7": ("Snurrfåtölj med fotpall", "Både stol och pall snurrar", [
        ("Fåtölj", 0), ("Fotpall", 1), ("Sits", 2),
        ("Ryggstöd", 3), ("Maxlast", 5), ("Vikt", 8)]),
    "b01d8af2": ("Sammetsfåtölj med fotpall", "Smala ben som spretar utåt", [
        ("Fåtölj", 0), ("Fotpall", 1), ("Sits", 2),
        ("Ryggstöd", 3), ("Benhöjd", 5), ("Maxlast", 6)]),
    "ca92e3ce": ("Fåtölj i skandinavisk stil", "Armstöd och ben i gummiträ", [
        ("Mått", 0), ("Sits", 1), ("Ryggstöd", 2),
        ("Benhöjd", 3), ("Maxlast", 4), ("Paketmått", 7)]),
    "90caeb9d": ("Djup fåtölj i manchesterlook", "Rund och helt utan ben", [
        ("Mått", 0), ("Sits", 1), ("Sittdyna", 2),
        ("Armstödshöjd", 4), ("Maxlast", 5), ("Vikt", 9)]),
    "beacff5a": ("Vilstol i björk", "Fotstödet fälls ut ur ramen", [
        ("Mått", 0), ("Sits", 3), ("Fotdel", 4),
        ("Ramprofil", 5), ("Maxlast", 6), ("Vikt", 9)]),
}

if __name__ == "__main__":
    namn, facit = kortbygge.bygg(HAR, PRODUKTER, KORT)
    io.open(os.path.join(HAR, "kort-facit.json"), "w", encoding="utf-8").write(
        json.dumps(facit, ensure_ascii=False, indent=1))
    for n in namn:
        print("%-22s %7d byte" % (n, os.path.getsize("jpg/%s.jpg" % n)))
