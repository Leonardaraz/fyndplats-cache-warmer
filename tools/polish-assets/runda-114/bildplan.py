# -*- coding: utf-8 -*-
"""Runda 114 Steg 9 — bildplanen. Vad som stannar, vad som går, vad som beskärs.

Galleriets ordning är husets fasta: hjälte, verklighetsbild, VÅRT kort, ev.
fler foton, måttritningen sist.

☠️ NIO AV FEMTON BORTTAGNA BÄR TYSK TEXT. Position 4 och 5 är leverantörens
   funktionsgrafiker på sju av nio produkter — "GUT ZU TRANSPORTIEREN",
   "FÜR DRAUSSEN GEMACHT", "SICHER & GESCHÜTZT ZUGANG", "MEHRFACHER LAGERRAUM".

☠️ TVÅ TAS BORT AV ETT ANNAT SKÄL: de visar NAPPFLASKOR MED MJÖLK. Källan
   säljer 4-litersmodellen för "Muttermilch und Medikamenten", och Steg 2
   strök den användningen ur texten — en Peltier-kyl med tillåten omgivning
   upp till 30 °C kan inte garantera kylkedjan. En bild som visar samma sak
   påstår det lika tydligt som en mening. Texten och galleriet måste säga
   samma sak.

☠️ EN TAS BORT AV ETT TREDJE SKÄL: `e6d2e70b` bild 4 påstår i ikonform
   "Schloss & Schlüssel". Den tyska brödtexten nämner inget lås och ingen av
   de andra fyra bilderna visar ett. Bilden bär alltså ett påstående sidan
   inte får göra — och den bär tysk text ändå.

⚠️ OCH EN BILD SOM SÅG UT ATT VARA FEL FICK STANNA. På kontaktarket ser
   `d754d015` bild 2 ut att visa en GRÖN enhet på en sida som säljs som vit.
   I förstoring är det en grön stol som speglar sig i dörrspegeln. Runbookens
   regel höll: en färg skrivs aldrig ur en kontaktkarta, bara ur en zoom.
"""
import sys
import os

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HAR)
import matt                                                        # noqa: E402

# Positionerna är 1-indexerade mot `matt.BILDER`. `None` = vårt eget kort.
GALLERI = {
    "397b845e": [1, 2, None, 3],
    "412c9f43": [1, 2, None, 5, 3],
    "d754d015": [1, 2, None, 4, 5, 3],
    "758f0a80": [1, 2, None, 4, 3],
    "d5cc9efa": [1, 2, None, 4, 5, 3],
    "b3e3aac8": [1, 2, None, 3],
    "b815de72": [1, 2, None, 3],
    "e6d2e70b": [1, 2, None, 5, 3],
    "ef0fa603": [1, 2, None, 3],
}

BORTTAGNA = {
    "397b845e": {4: "tysk text: GUT ZU TRANSPORTIEREN, 2 Räder mit Bremsen",
                 5: "tysk text: DURCHDACHTES DESIGN, Ablaufstopfen"},
    "412c9f43": {4: "visar nappflaskor med mjölk — användning Steg 2 strök"},
    "758f0a80": {5: "visar nappflaskor med mjölk — användning Steg 2 strök"},
    "b3e3aac8": {4: "tysk text: FÜR DRAUSSEN GEMACHT, Robuste HDPE-Schale",
                 5: "tysk text: DESIGN FÜR MÜHELOSE MOBILITÄT"},
    "b815de72": {4: "tysk text: SICHER & GESCHÜTZT ZUGANG, 90° Deckel öffnen",
                 5: "tysk text: MÜHELOSE REINIGUNG, Eingebautes Ablassventil"},
    "e6d2e70b": {4: "tysk text OCH ett låspåstående utan underlag: "
                    "Schloss & Schlüssel"},
    "ef0fa603": {4: "tysk text: MEHRFACHER LAGERRAUM, Türaufbewahrung",
                 5: "tysk text: Verstellbarer Nivellierfuß, LED-Innenbeleuchtung"},
}

# ☠️ TVÅ MÅTTRITNINGAR BÄR SKRÄP I ETT BAND — resten av bilden är ren.
#    Bandet beskärs bort och bilden fylls tillbaka till KVADRAT, för PDP:n
#    beskär med `al_c` och skulle annars kapa måttetiketterna i sidorna.
BESKARNING = {
    # Överkanten bär en låg-badge med 10–30 °C. Den siffran är exakt spec-
    # blockets tillåtna OMGIVNING, och 6-litersmodellens tyska text nämner
    # ingen värmefunktion — bilden påstår alltså något sidan inte gör.
    # ⚠️ 0,17 RÄCKTE INTE — den kapade badgen på MITTEN och lämnade "2-" och
    #    en låga kvar, alltså sämre än att inte beskära alls. Kontrollarket
    #    visade det på en sekund; API-svaret hade sagt "sparad". 0,25 tar hela
    #    bågen och ligger med marginal ovanför etiketten "35,6 cm".
    "412c9f43": (3, (0.0, 0.25, 1.0, 1.0), "värmebadge utan underlag i texten"),
    # Nederkanten bär ENGELSKA ordet COMPACT SIZE.
    "758f0a80": (3, (0.0, 0.0, 1.0, 0.90), "engelsk text: COMPACT SIZE"),
}


def kontroll():
    fel = []
    for k in matt.WIX:
        plan = GALLERI[k]
        bort = set(BORTTAGNA.get(k, {}))
        kvar = [p for p in plan if p is not None]
        if sorted(kvar + list(bort)) != list(range(1, 6)):
            fel.append("%s: %s + borttagna %s täcker inte 1–5"
                       % (k, kvar, sorted(bort)))
        if None not in plan:
            fel.append("%s: saknar vårt eget kort" % k)
        if plan.index(None) < 2:
            fel.append("%s: kortet ligger på plats %d — aldrig plats 1 eller 2"
                       % (k, plan.index(None) + 1))
        if plan[0] != 1:
            fel.append("%s: hjältebilden ligger inte först" % k)
        if plan[-1] != 3 and 3 in kvar:
            fel.append("%s: måttritningen ligger inte sist" % k)
    # ☠️ Färgtvillingar får inte dela en enda miljöscen — två av VÅRA egna
    #    URL:er med identiska foton är den dubblett Google straffar.
    for a, b in (("412c9f43", "d754d015"), ("758f0a80", "d5cc9efa")):
        delade = set(matt.BILDER[a]) & set(matt.BILDER[b])
        if delade:
            fel.append("%s och %s delar %d bildfiler" % (a, b, len(delade)))
    # ☠️ Ingen bild som Steg 4 dömt ut får ligga i ett galleri.
    for k, d in BORTTAGNA.items():
        for pos in d:
            if pos in GALLERI[k]:
                fel.append("%s: bild %d är utdömd men ligger i galleriet" % (k, pos))
    return fel


if __name__ == "__main__":
    fel = kontroll()
    if fel:
        raise SystemExit("BILDPLANEN FALLER:\n  " + "\n  ".join(fel))
    n = sum(len(v) for v in BORTTAGNA.values())
    print("bildplanen: 0 fel — %d bilder bort, %d beskärningar, %d gallerier"
          % (n, len(BESKARNING), len(GALLERI)))
    for k in matt.WIX:
        print("  %s  %s" % (k, ["kort" if p is None else p for p in GALLERI[k]]))
