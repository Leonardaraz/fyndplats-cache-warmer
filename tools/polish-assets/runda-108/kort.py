# -*- coding: utf-8 -*-
"""Runda 108 — ett eget Fyndplats-kort per rumsavdelare (Leonards regel 2026-08-26).

☠️ SPEC-RADERNA HÄMTAS MEKANISKT UR SIDANS EGEN TEXT, aldrig omskrivna för hand.
   `kortbygge.varde` kräver att kortets etikett finns i radens egen etikett, så
   ett kort inte kan skriva "Vikt: vit".

⚠️ RUBRIKEN MÅSTE BÄRAS AV FOTOT — runda 107 fick stryka två rubriker som var
   sanna men inte läsbara i bilden. Här är rubriken **antalet paneler**, och
   det är valt just för att det går att RÄKNA i studiobilden:

   4 paneler  5f14c112 / 957b042d   fyra fält, tre skarvar, sicksacken tydlig
   6 paneler  6649471e / 854371fe   sex fält
   8 paneler  da1a8a75 / 64c0809d   åtta fält, nästan panelens egen proportion

   Rubriken skiljer alltså de tre storlekarna åt på kortet, och kunden kan
   kvittera den utan att läsa en siffra i texten. Två alternativ prövades och
   valdes bort:

   ☠️ "Vecklas ut i sicksack" — sant och synligt, men lika sant på alla sex,
      så kortet hade inte sagt vilken av tre sidor man tittar på.
   ☠️ "Bågformad ovankant" — familjens signatur och tydlig i bild, men den är
      ett utseende, inte ett köpavgörande. Panelantalet ÄR valet kunden gör.

⚠️ Kickern säger `inomhus`. Det är inte kosmetik: ramen är obehandlad tall och
   väven saknar UV-skydd, och det är den vanligaste felanvändningen av en
   vikskärm. Kortet är det enda i galleriet som kan säga det utan text.

☠️ FOTOT ÄR FÖRBEHANDLAT, se `bygg-panelfoton.py`.
"""
import re
import sys

BAS = "/home/user/fyndplats-cache-warmer/tools/polish-assets"
sys.path.insert(0, BAS)
import kortbygge                                                   # noqa: E402
sys.path.insert(0, BAS + "/runda-108")
import texter as T                                                 # noqa: E402

HAR = BAS + "/runda-108"


def specrader(nyckel):
    """<li>-raderna ur produktens EGEN spec-tabell, ordagrant."""
    block = re.search(r"<h2>Tekniska specifikationer</h2><ul>(.*?)</ul>",
                      T.PRODUKTER[nyckel]["html"], re.S).group(1)
    return [re.sub(r"<[^>]+>", "", li) for li in re.findall(r"<li>(.*?)</li>", block, re.S)]


KICKER = "Rumsavdelare för inomhusbruk"
ORD = {4: "Fyra", 6: "Sex", 8: "Åtta"}
RUBRIK = {k: "%s paneler i sicksack" % ORD[v[0]] for k, v in T.PRODUKTER_IN.items()}

# etikett -> radindex. Spec-blocket byggs av samma `bygg()` för alla sex, så
# indexen är identiska — men de skrivs ändå ut per produkt, för en delad lista
# hade tystnat om en enda sida någon gång får en rad till.
_RADER = [("Mått", 0), ("Panel", 2), ("Gångjärn", 4),
          ("Material", 6), ("Vikt", 8), ("Montering", 10)]
RADER = {k: list(_RADER) for k in T.PRODUKTER}

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
