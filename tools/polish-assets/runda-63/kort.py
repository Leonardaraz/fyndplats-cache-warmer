# -*- coding: utf-8 -*-
"""Runda 63 — DATAN till de åtta egna korten. Bygget bor i ../kortbygge.py.

Rubriken är det enda kortbygget inte kan kontrollera: den ska bäras av
HJÄLTEBILDEN under den. Varje rad här är vald mot bild 1 med ögon, och
kontaktarket granskas efter renderingen.

☠️ Fem av åtta är KONSTROTTING, inte naturmaterial (`KONSTMATERIAL` i
   lint.py). Rubriker och kickers säger därför "flätad", aldrig "rotting"
   eller "naturmaterial" — bara e16338a9 och 73cb432c är äkta gräs.

☠️ f6e3098e får INTE bära ett lasttal (`LAST[...] = set()`, källan
   motsäger sig själv), och 165471af/1ed0d9cb får inte påstå tvättbart.
   Ingen kortrad rör de fälten.
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)

from kortbygge import bygg                                        # noqa: E402
from texter import PRODUKTER                                      # noqa: E402

# kort -> (kicker, rubrik, [(etikett, spec-radindex)])
KORT = {
    "b3672df6": ("Kattbädd med kattöron", "Två flätade öron på kanten", [
        ("Mått", 0), ("Invändigt", 1), ("Öppning", 2),
        ("Kudde", 3), ("Maxlast", 4), ("Färg", 7)]),
    "165471af": ("Kattsäng på ben", "Öppen flätning i lösa slingor", [
        ("Mått", 0), ("Öppning", 1), ("Kudde", 2),
        ("Maxlast", 3), ("Färg", 6), ("Vikt", 7)]),
    "ad90a1cc": ("Flätad kattigloo", "Kupol med rund ingång", [
        ("Mått", 0), ("Bas", 1), ("Ingång", 2),
        ("Kudde", 3), ("Färg", 7)]),
    "f6e3098e": ("Kattkorg i två plan", "Platt tak att ligga på", [
        ("Mått", 0), ("Ingång", 1), ("Kudde", 2),
        ("Plan", 3), ("Stomme", 4), ("Färg", 6)]),
    "1ed0d9cb": ("Upphöjd kattgrotta", "Klotformad korg på smala ben", [
        ("Mått", 0), ("Ingång", 1), ("Matta", 2),
        ("Maxlast", 3), ("Färg", 6)]),
    "e16338a9": ("Kattkoja i vattenhyacint", "Kudde både uppe och inne", [
        ("Mått", 0), ("Invändigt", 1), ("Övre liggyta", 2),
        ("Dörröppning", 3), ("Bärighet", 5), ("Material", 6)]),
    "73cb432c": ("Sittpuff med kattgömma", "Trälock att sitta på", [
        ("Mått", 0), ("Invändigt", 1), ("Kattöppning", 2),
        ("Lock", 3), ("Benhöjd", 5), ("Material", 6)]),
    "d82950a3": ("Fotpall med kattbädd", "Stoppat lock med fyra knappar", [
        ("Mått", 0), ("Invändigt", 1), ("Öppning", 2),
        ("Golvavstånd", 4), ("Maxlast", 5), ("Stomme", 6)]),
}

# ☠️ Fotot mjukas, ALDRIG kortet. 165471af:s flätning är lösa slingor mot vit
#    botten — ren högfrekvens, och JPEG betalar för varje kant. Kortet låg 225 661
#    byte vid q=85, alltså 10 661 över taket. Samma medicin som runda 65:s bouclé.
# Radien följer överskottet: ~0,5 px per 15 kB. Uppmätt vid q=85 utan mjukning:
#   165471af +10,7 kB · 1ed0d9cb +13,9 · 73cb432c +15,0 · ad90a1cc +28,6
#   f6e3098e +38,5 · e16338a9 +54,6
MJUKA = {"165471af": 0.7, "1ed0d9cb": 0.6, "73cb432c": 0.6,
         "ad90a1cc": 0.9, "f6e3098e": 1.1, "e16338a9": 1.4}

if __name__ == "__main__":
    namn, facit = bygg(HAR, PRODUKTER, KORT, MJUKA)
    with open(os.path.join(HAR, "kort-facit.json"), "w", encoding="utf-8") as f:
        json.dump(facit, f, ensure_ascii=False, indent=1)
    for n in namn:
        print("%-20s %7d byte" % (n, os.path.getsize("jpg/%s.jpg" % n)))
