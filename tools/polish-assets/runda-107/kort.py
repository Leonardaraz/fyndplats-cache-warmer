# -*- coding: utf-8 -*-
"""Runda 107 — ett eget Fyndplats-kort per stall (Leonards regel 2026-08-26).

☠️ SPEC-RADERNA HÄMTAS MEKANISKT UR SIDANS EGEN TEXT, aldrig omskrivna för hand.
   `kortbygge.varde` kräver dessutom att kortets etikett finns i radens egen
   etikett, så ett kort inte kan skriva "Vikt: grå".

⚠️ RUBRIKEN MÅSTE BÄRAS AV FOTOT. Granskad mot varje hjältebild (`hjaltar.jpg`)
   innan uppladdning — en rubrik per MODELL, eftersom färgsyskonen är samma
   konstruktion fotograferad i samma vinkel:

  P a75fcfde/c0770388  huset sitter HÖGT I MITTEN med en löpgård åt vardera
                       hållet under sluttande tak. Det syns direkt i fotot och
                       är det som skiljer modellen från de andra tre.
  Q 2253c509           huset ligger upptill till vänster och HELA bottenplanet
                       är nät — löpgården går alltså under huset också, i full
                       längd. ☠️ Rubriken "Uppfällbart tak" fick strykas: taket
                       ÄR uppfällbart (spec-rad 8) men ligger stängt i fotot.
  R 2435c4d1/dcdf889d  brickans front sitter mitt i bild med sitt handtag, på
                       båda syskonen. ☠️ Rubriken var först "Ramp mellan huset
                       och löpgården". Rampen FINNS (spec-rad 8, 63 × 15 cm)
                       men syns edge-on som en tunn stång på 2435c4d1 — den
                       läses inte i samma ögonkast som rubriken, och då är
                       rubriken ett löfte ögat inte kan kvittera.
  S 525e6acf/079f2901  en bred ramp går diagonalt upp genom löpgården till
                       husets inre öppning, tydlig på båda. ☠️ Rubriken var
                       först "Löpgården saknar botten" — sant (spec-rad 2 och
                       8) och namnet säger det redan, men en FRÅNVARO är det
                       svåraste ett foto kan bevisa. Faktumet står kvar som
                       kortrad; rubriken pekar på något som finns.

☠️ FOTOT ÄR FÖRBEHANDLAT, se `bygg-panelfoton.py`.
"""
import re
import sys

BAS = "/home/user/fyndplats-cache-warmer/tools/polish-assets"
sys.path.insert(0, BAS)
import kortbygge                                                   # noqa: E402
sys.path.insert(0, BAS + "/runda-107")
import texter as T                                                 # noqa: E402

HAR = BAS + "/runda-107"


def specrader(nyckel):
    """<li>-raderna ur produktens EGEN spec-tabell, ordagrant."""
    block = re.search(r"<h2>Tekniska specifikationer</h2><ul>(.*?)</ul>",
                      T.PRODUKTER[nyckel]["html"], re.S).group(1)
    return [re.sub(r"<[^>]+>", "", li) for li in re.findall(r"<li>(.*?)</li>", block, re.S)]


KICKER = "Smådjursstall för utomhusbruk"
RUBRIK = {
    "a75fcfde": "Huset i mitten, löpgård åt båda hållen",
    "c0770388": "Huset i mitten, löpgård åt båda hållen",
    "2253c509": "Löpgård i hela bottenplanet",
    "2435c4d1": "Brickan dras ut framifrån",
    "dcdf889d": "Brickan dras ut framifrån",
    "525e6acf": "Ramp upp till huset",
    "079f2901": "Ramp upp till huset",
}
# etikett -> radindex i produktens EGEN spec-tabell. Indexen skiljer sig mellan
# modellerna, därav en lista per produkt och inte en delad.
RADER = {
    "a75fcfde": [("Yttermått", 0), ("Bottenyta", 1), ("Hus", 4),
                 ("Material", 8), ("Vikt", 10), ("Montering", 12)],
    "c0770388": [("Yttermått", 0), ("Bottenyta", 1), ("Hus", 4),
                 ("Material", 8), ("Vikt", 10), ("Montering", 12)],
    "2253c509": [("Yttermått", 0), ("Bottenyta", 1), ("Hus", 4),
                 ("Material", 9), ("Vikt", 11), ("Montering", 13)],
    # ☠️ R får `Bricka` i stället för `Material`, av samma skäl som S får
    #    `Botten`: kortet ska bära beviset för sitt eget löfte.
    "2435c4d1": [("Yttermått", 0), ("Bottenyta", 1), ("Hus", 4),
                 ("Bricka", 9), ("Vikt", 12), ("Montering", 14)],
    "dcdf889d": [("Yttermått", 0), ("Bottenyta", 1), ("Hus", 4),
                 ("Bricka", 9), ("Vikt", 12), ("Montering", 14)],
    # ☠️ S behåller `Botten`: bottenlösheten är modellens verkliga skillnad och
    #    ska stå kvar på kortet även när rubriken pekar på rampen i stället.
    "525e6acf": [("Yttermått", 0), ("Bottenyta", 1), ("Hus", 4),
                 ("Botten", 8), ("Vikt", 11), ("Montering", 13)],
    "079f2901": [("Yttermått", 0), ("Bottenyta", 1), ("Hus", 4),
                 ("Botten", 8), ("Vikt", 11), ("Montering", 13)],
}

if __name__ == "__main__":
    kortdata = {k: (KICKER, RUBRIK[k], RADER[k]) for k in T.PRODUKTER}
    produkter = [{"kort": k, "spec": specrader(k)} for k in T.PRODUKTER]
    foton = {k: "%s/panelfoton/%s.jpg" % (HAR, k) for k in T.PRODUKTER}

    print("=== spec-rader som kommer på korten ===")
    for p in produkter:
        k = p["kort"]
        print("  %s  %s" % (k, RUBRIK[k]))
        for e, i in RADER[k]:
            print("        %-12s %s" % (e + ":", kortbygge.varde(p["spec"][i], e)))

    print("\n=== bygger ===")
    namn, facit = kortbygge.bygg(HAR, produkter, kortdata, foton=foton)
    print("  %d kort byggda" % len(namn))
