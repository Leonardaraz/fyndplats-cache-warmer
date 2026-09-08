# -*- coding: utf-8 -*-
"""Runda 106 — ett eget Fyndplats-kort per hage (Leonards regel 2026-08-26).

☠️ SPEC-RADERNA HÄMTAS MEKANISKT UR SIDANS EGEN TEXT, aldrig omskrivna för
   hand. Runda 60 fick en andra sanning när ett kort skrev "3 min 15 s" mot
   tabellens "3 minuter 15 sekunder". `kortbygge.varde` kräver dessutom att
   kortets etikett finns i radens egen etikett, så ett kort inte kan skriva
   "Vikt: grå".

⚠️ RUBRIKEN MÅSTE BÄRAS AV FOTOT. Granskad mot varje hjältebild i ett
   kontaktark innan uppladdning:

  a4c0595f/7eebd0eb  lång låg ram där man ser RAKT IGENOM till bakgrunden —
                     nät på alla sidor och ingen botten. ☠️ Första rubriken var
                     "Två lock på taket": locken är 45 × 100 cm av en 181 cm
                     lång ovansida och går inte att skilja från den fasta
                     nätdelen i renderingen. Rubriken lovade något ögat inte
                     kan kontrollera.   -> "Nät runt om, ingen botten"
  b54e7a23/1f7ebf33  slutet hus med grönt pulpettak i ena änden, öppen
                     nätgård i den andra  -> "Hus i ena änden, löpgård i den andra"
  edc81021           nästan kvadratisk nätram med ett slutet hus INBYGGT i ena
                     änden, inte fristående inne i hagen. ☠️ Rubriken sa först
                     "Hus i hörnet" och spec-raden "står inne i hagen" — båda
                     motsagda av fotot.
                     -> "Slutet hus i ena änden, nät runt om"
  117691b5           låg grå ram, nät på alla sidor och över hela taket
                     -> "Nät på alla sidor och över taket"

☠️ FOTOT ÄR FÖRBEHANDLAT, se `bygg-panelfoton.py`. Panelen är 1,83 och
   `fit=True` ger `object-fit: contain`; ett kvadratiskt foto krymper då till
   ~55 % av panelbredden. Hagarna är låga och breda, så de beskärs till varans
   bbox och fylls ut i SIDLED med vitt — runda 93:s regel: beskär aldrig varan.
"""
import re
import sys

BAS = "/home/user/fyndplats-cache-warmer/tools/polish-assets"
sys.path.insert(0, BAS)
import kortbygge                                                   # noqa: E402
sys.path.insert(0, BAS + "/runda-106")
import texter as T                                                 # noqa: E402

HAR = BAS + "/runda-106"


def specrader(nyckel):
    """<li>-raderna ur produktens EGEN spec-tabell, ordagrant."""
    block = re.search(r"<h2>Tekniska specifikationer</h2><ul>(.*?)</ul>",
                      T.PRODUKTER[nyckel]["html"], re.S).group(1)
    return [re.sub(r"<[^>]+>", "", li) for li in re.findall(r"<li>(.*?)</li>", block, re.S)]


KICKER = "Smådjurshage för utomhusbruk"
RUBRIK = {
    "a4c0595f": "Nät runt om, ingen botten",
    "7eebd0eb": "Nät runt om, ingen botten",
    "b54e7a23": "Hus i ena änden, löpgård i den andra",
    "1f7ebf33": "Hus i ena änden, löpgård i den andra",
    "edc81021": "Slutet hus i ena änden, nät runt om",
    "117691b5": "Nät på alla sidor och över taket",
}
# etikett -> radindex i produktens EGEN spec-tabell. Indexen skiljer sig mellan
# modellerna, därav en lista per produkt och inte en delad.
RADER = {
    "a4c0595f": [("Yttermått", 0), ("Golvyta", 1), ("Botten", 2),
                 ("Material", 4), ("Vikt", 6), ("Montering", 8)],
    "7eebd0eb": [("Yttermått", 0), ("Golvyta", 1), ("Botten", 2),
                 ("Material", 4), ("Vikt", 6), ("Montering", 8)],
    "b54e7a23": [("Yttermått", 0), ("Löpgård", 1), ("Hus", 2),
                 ("Material", 8), ("Vikt", 10), ("Montering", 12)],
    "1f7ebf33": [("Yttermått", 0), ("Löpgård", 1), ("Hus", 2),
                 ("Material", 8), ("Vikt", 10), ("Montering", 12)],
    "edc81021": [("Yttermått", 0), ("Golvyta", 1), ("Hus", 2),
                 ("Material", 6), ("Vikt", 8), ("Montering", 10)],
    "117691b5": [("Yttermått", 0), ("Hopfälld", 1), ("Golvyta", 2),
                 ("Material", 6), ("Vikt", 8), ("Montering", 10)],
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
