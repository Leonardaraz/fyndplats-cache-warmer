# -*- coding: utf-8 -*-
"""Runda 113 Steg 4 — vilka bilder som behålls, och varför de andra går bort.

☠️ NITTON AV FYRTIO BILDER BÄR TEXT I PIXLARNA. Det är hälften av materialet,
   och det är den högsta andelen någon runda mätt upp. Tre sorter:

     tysk marknadstext   "KOMPAKTE GRÖSSE, GROSSER RAUM", "UV-SCHUTZ",
                         "LEISER BETRIEB", "R600a-Kompressor / Energiesparend /
                         Geräuscharm / Manuelle Abtauung", serveringstabeller
                         med "Halbtrockener Rotwein"
     engelsk text        "35L Mini Freezer", "Ice Shovel", "Ice Cube Tray",
                         "0,21 m² Footprint", "Fits Anywhere / Dormitory"
     ☠️ ARTIKELNUMMER    de två EU-energietiketterna, se nedan

☠️ TVÅ BILDER ÄR EU-ENERGIETIKETTER MED AOSOMS ARTIKELNUMMER TRYCKT PÅ SIG:
   `b2c76518` bild 5 bär `800-127V90BK` och `480849a7` bild 5 bär
   `800-196V90BK`. Numret står i Aosoms egen produkt-URL och dealproffsen.se
   publicerar samma sträng som `sku`/`mpn` — en googling ställer vår sida
   bredvid deras. Bilderna går bort.

   ⚠️ Och det är en ÄKTA MÅLKONFLIKT: bilaga VII i (EU) 2019/2016 kräver att
   etiketten visas vid distansförsäljning, och modellidentifieraren är en
   obligatorisk del av etiketten. Regeln säger "visa numret", husregeln säger
   "publicera det aldrig". Det som görs här är det säkra: bilden bort, det
   REGLERADE INNEHÅLLET (klass, skala, kWh/år) i texten på alla åtta sidorna.
   Etikettfil + EPREL-nummer är en fråga till Aosom, och den ligger hos Leonard.

✅ Men etiketterna LÄSTES innan de plockades bort, och de gav två mätta tal som
   inte fanns någon annanstans: 148 kWh/annum för `b2c76518` och 43 dB (inte
   spec-blockets 41) för `480849a7`.

⚠️ Tre måttritningar går att RÄDDA med beskärning — den tyska rubriken ligger i
   ett band överst och flasktexten i ett block till höger, medan alla måttpilar
   ligger i vänstra och nedre delen. Samma grepp som runda 112:s packlista.
   De två frysarnas engelska ritning går INTE att rädda: "35L Mini Freezer"
   ligger mitt på skåpsdörren i renderingen.

☠️ BESKURNA RITNINGAR MÅSTE PADDAS TILLBAKA TILL KVADRAT. PDP:n använder
   `fill/…,al_c` och mittbeskär, alltså precis de sidor där måttetiketterna
   sitter. Runda 112 lärde sig det på en liggande ritning.
"""
import matt

# nyckel -> lista av (råindex, roll). KORT är vårt eget Fyndplats-kort.
GALLERI = {
    "8cfe5171": [(1, "hjälte"), (2, "livsstil"), (4, "livsstil"), (5, "livsstil"), ("KORT", "kort")],
    "a33ece7a": [(1, "hjälte"), (2, "livsstil"), (4, "livsstil"), (5, "livsstil"), ("KORT", "kort")],
    "9a33e15f": [(1, "hjälte"), (2, "livsstil"), ("KORT", "kort"), (3, "ritning")],
    "b2c76518": [(1, "hjälte"), (2, "livsstil"), ("KORT", "kort"), (3, "ritning")],
    "47a91a17": [(1, "hjälte"), (2, "livsstil"), ("KORT", "kort"), (3, "ritning")],
    "15d30e23": [(1, "hjälte"), (2, "livsstil"), ("KORT", "kort"), (3, "ritning")],
    "480849a7": [(1, "hjälte"), (2, "livsstil"), ("KORT", "kort"), (3, "ritning")],
    "fdbfcea0": [(1, "hjälte"), (2, "livsstil"), ("KORT", "kort"), (3, "ritning")],
}

BORTTAGNA = {
    "8cfe5171": {3: "engelsk text i pixlarna: '35L Mini Freezer' mitt på dörren, "
                    "'01 Ice Shovel / 02 Ice Cube Tray' uppe till höger och "
                    "'0,21 m² Footprint' nedtill"},
    "a33ece7a": {3: "samma engelska overlay som 8cfe5171 bild 3"},
    "9a33e15f": {4: "tysk text: 'R600a-Kompressor · Energiesparend · Geräuscharm · "
                    "Manuelle Abtauung'",
                 5: "engelsk text: 'Fits Anywhere / Living Room / Apartment / "
                    "Home Office / Dormitory'"},
    "b2c76518": {4: "tysk text: 'R600a-Kompressor · Energiesparend · Geräuscharm · "
                    "Manuelle Abtauung'",
                 5: "☠️ EU-energietikett med Aosoms ARTIKELNUMMER tryckt överst"},
    "47a91a17": {4: "tysk text: 'UV-SCHUTZ … Dreistufige Glastür'",
                 5: "tysk serveringstabell: 'Halbtrockener Rotwein', 'Süßwein' …"},
    "15d30e23": {4: "tysk text: 'UV-SCHUTZ … Doppelstöckige Glastür'",
                 5: "tysk serveringstabell"},
    "480849a7": {4: "tysk text: 'LEISER BETRIEB' med '41dB Unser Weinkühlschrank' — "
                    "dessutom FEL tal, etiketten säger 43 dB",
                 5: "☠️ EU-energietikett med Aosoms ARTIKELNUMMER tryckt överst"},
    "fdbfcea0": {4: "tysk text: 'UV-SCHUTZ … Doppelstöckige Glastür'",
                 5: "tysk serveringstabell"},
}

# nyckel -> {råindex: ((x0, y0, x1, y1) i PROCENT av originalet, skäl)}
BESKARNING = {
    "47a91a17": {3: ((0, 18, 76, 100),
                     "tysk rubrik 'KOMPAKTE GRÖSSE, GROSSER RAUM' i bandet överst")},
    "15d30e23": {3: ((0, 18, 76, 100),
                     "tysk rubrik överst och '16 Flaschen / 750mL Wein' till höger")},
    "fdbfcea0": {3: ((0, 18, 75, 100),
                     "tysk rubrik överst och '20 Flaschen / 750mL Wein' till höger")},
}

# ☠️ `47a91a17` gick INTE att beskära fri. Den tyska texten '12 Flaschen /
#    750mL Wein' ligger på y≈36 % och djupmåttet '51,5cm' på y≈93 % — i samma
#    x-spann. En beskärning som tar texten tar måttet, och tvärtom.
#
#    Texten målas därför över i stället. Det är inom bildpoleringens mandat och
#    ingen tolkning av det: regeln säger uttryckligen att vi tvättar bort det
#    som är PÅLAGT I BILDFILEN — overlay-text, banderoller, vattenstämplar —
#    och rutan ligger på suddig mörk bakgrund, inte på varan. Avgörande-testet
#    håller: fotade du kylen själv skulle rutan inte finnas.
#
# nyckel -> {råindex: [(x0, y0, x1, y1) i PROCENT AV DEN BESKURNA bilden]}
OVERMALNING = {
    "47a91a17": {3: [(70, 15, 100, 42)]},
}


def kontroll():
    fel = []
    for k, rader in GALLERI.items():
        rå = [i for i, _ in rader if i != "KORT"]
        if len(rå) != len(set(rå)):
            fel.append("%s: samma råbild två gånger" % k)
        # en borttagen bild får aldrig ligga kvar i galleriet
        for i in BORTTAGNA.get(k, {}):
            if i in rå:
                fel.append("%s: bild %d är både borttagen och med i galleriet" % (k, i))
        # exakt ett eget kort
        if [r for _, r in rader].count("kort") != 1:
            fel.append("%s: ska ha exakt ett Fyndplats-kort" % k)
        # behållna + borttagna ska bli fem — leverantören ger fem bilder
        if len(rå) + len(BORTTAGNA.get(k, {})) != 5:
            fel.append("%s: %d behållna + %d borttagna ≠ 5"
                       % (k, len(rå), len(BORTTAGNA.get(k, {}))))
        # ritningen ligger SIST, så den inte blir delningsbild
        roller = [r for _, r in rader]
        if "ritning" in roller and roller[-1] != "ritning":
            fel.append("%s: ritningen ligger inte sist" % k)
        # ☠️ en beskärning måste peka på en bild galleriet faktiskt visar
        for i in BESKARNING.get(k, {}):
            if i not in rå:
                fel.append("%s: beskärning av bild %d som inte visas" % (k, i))
        # ☠️ En övermålning måste ligga på en bild som faktiskt beskärs — annars
        #    är procenttalen räknade mot fel bild och rutan hamnar var som helst.
        for i in OVERMALNING.get(k, {}):
            if i not in BESKARNING.get(k, {}):
                fel.append("%s: övermålning av bild %d som inte beskärs" % (k, i))
    if set(GALLERI) != set(matt.WIX):
        fel.append("galleriet täcker inte rundan")
    # ☠️ Ingen av de två etikettbilderna får finnas kvar någonstans.
    for k, i in [("b2c76518", 5), ("480849a7", 5)]:
        if i in [x for x, _ in GALLERI[k]]:
            fel.append("☠️ %s bild %d är ETIKETTEN MED ARTIKELNUMMER" % (k, i))
    return fel


if __name__ == "__main__":
    f = kontroll()
    for x in f:
        print("  ✗", x)
    behallna = sum(len([i for i, _ in r if i != "KORT"]) for r in GALLERI.values())
    borttagna = sum(len(v) for v in BORTTAGNA.values())
    print("%d bilder behålls, %d tas bort, %d beskärs, %d övermålas, %d egna kort — %d fel"
          % (behallna, borttagna, sum(len(v) for v in BESKARNING.values()),
             sum(len(v) for v in OVERMALNING.values()), len(GALLERI), len(f)))
    raise SystemExit(1 if f else 0)
