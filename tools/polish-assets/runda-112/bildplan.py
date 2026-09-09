# -*- coding: utf-8 -*-
"""Runda 112 Steg 4/9 — vilka bilder som behålls, i vilken ordning, och varför.

☠️ SJU AV 45 BILDER BÄR TEXT I PIXLARNA, och en av dem är en HJÄLTEBILD.

     1b87909f-4   EIN BILDSCHIRM, UNENDLICHE EINSATZMÖGLICHKEITEN + fyra
                  tyska bildtexter (Bürobesprechung, Hinterhofkino, …)
     ddca577d-4   AUTOMATISCHER VERRIEGELUNGSMECHANISMUS
     623b6504-4   FUNKFERNBEDIENUNG
     77e4a558-4   ZWEI MONTAGEOPTIONEN / Wandmontage / Deckenmontage
     77e4a558-5   EIN BILDSCHIRM UNENDLICHE EINSATZMÖGLICHKEITEN
     77e4a558-1   FULL HD 1080 · 4K ULTRAHD · 8K ULTRAHD · HD READY · 4:3
     1b87909f-3   2 x Stative · 8 x Bodenpfähle · 2 x 5 m Seile   ← MÅTTRITNINGEN

☠️ DEN SJUNDE HITTADES FÖRST I STEG 9, inte i Steg 4 — och det är lärdomen.
   Steg 4 läser bilderna som BILDER och frågar "bär den text?". Måttritningarna
   lästes samma dag, men i ett eget zoomark och med en annan fråga: "vilket
   tumtal står det?". Den tyska packlistan låg i ett mörkt band ÖVANFÖR duken,
   den lästes som en del av ritningen, och båda genomgångarna gick vidare.
   **En bild som granskas för en fråga är inte granskad för den andra.**

   Här går den DÄREMOT att beskära bort, tvärtemot 77e4a558-1: bandet ligger
   helt ovanför ramens överkant, alltså på bakgrunden och inte på varan, och
   varje mått överlever kapningen — 309, 263×148, 120", 159, 217, 275, 62 och
   180 cm står alla kvar. Uppmätt: den tyska texten slutar vid y≈203 av 1400,
   måttpilen `309 cm` börjar vid y≈259. Snittet läggs på **y = 212**.

☠️ DEN FEMTE ÄR VÄRST, av två skäl. Den är produktens FÖRSTA bild — alltså
   huvudbild och delningsbild — och den påstår något som inte är sant om en
   duk: en duk har ingen upplösning. `8K ULTRAHD` är ett påstående om
   PROJEKTORN kunden redan äger. Texten går inte att alt-sätta bort; den
   ligger i pixlarna.

   ☠️ OCH BESKÄRNINGEN VAR FEL HYPOTES — mätningen slog ihjäl den. Emblemen
   SÅG ut att ligga i en egen vänsterspalt mot bakgrunden, alltså sådant
   Leonards regel tillåter oss att röra. De ligger i själva den PROJICERADE
   BILDEN, på duken: samma plan, samma ljus. En kapning på 20 % tog halva
   spalten och lämnade `80`, `K`, `AHD`, `D` och `3` kvar — halvläsligt skräp
   mitt på varan. Att kapa hela vägen (~26 %) hade tagit dukens vänstra
   fjärdedel och kassettens vänstra fäste med sig.

   Bilden tas därför BORT, och hjältebilden blir livsstilsbilden. En beskärning
   som klipper ett emblem itu är sämre än emblemet: den gör bilden obegriplig
   i stället för bara felaktig. Regeln som gällde var inte "rör bakgrunden" —
   den var "mät var pixlarna sitter innan du kallar dem bakgrund".

☠️ `77e4a558` TAPPAR TRE AV FEM BILDER och står kvar med två plus vårt kort.
   Det är familjens tunnaste galleri, och det är rätt utfall: hellre tre
   ärliga bilder än fyra där en påstår 8K om en bit tyg. Syskonet `623b6504`
   är samma produkt i svart och har fyra — färgparet blir alltså ojämnt, och
   det är en följd av vad leverantören lagt i pixlarna, inte av varan.

⚠️ TVÅ RENDER ÅTERANVÄNDS mellan storlekssyskonen: `422ab1bd-4` är samma bild
   som `a8c82049-5`, och `ddca577d-5` samma som `77d2b35c-4`. Det är väntat —
   det är samma modell i två storlekar — men det betyder att sidorna INTE får
   påstå att bilden visar just den storleken.
"""

# nyckel -> lista av (råbildsindex eller "KORT"), i galleriordning.
# Måttritningen (index 3) läggs SIST, vårt kort på plats 3.
GALLERI = {
    "1b87909f": [1, 2, "KORT", 5, 3],
    "422ab1bd": [1, 2, "KORT", 4, 5, 3],
    "a8c82049": [1, 2, "KORT", 4, 5, 3],
    "ddca577d": [1, 2, "KORT", 5, 3],
    "77d2b35c": [1, 2, "KORT", 4, 5, 3],
    "0370673c": [1, 2, "KORT", 4, 5, 3],
    "fe11166f": [1, 2, "KORT", 4, 5, 3],
    "623b6504": [1, 2, "KORT", 5, 3],
    "77e4a558": [2, "KORT", 3],
}

BORTTAGNA = {
    "1b87909f": {4: "EIN BILDSCHIRM, UNENDLICHE EINSATZMÖGLICHKEITEN + fyra "
                    "tyska bildtexter inbränt i pixlarna"},
    "ddca577d": {4: "AUTOMATISCHER VERRIEGELUNGSMECHANISMUS inbränt i pixlarna"},
    "623b6504": {4: "FUNKFERNBEDIENUNG inbränt i pixlarna"},
    "77e4a558": {1: "FULL HD 1080 · 4K · 8K ULTRAHD · HD READY · 4:3 inbränt i "
                    "den PROJICERADE bilden — går inte att beskära bort",
                 4: "ZWEI MONTAGEOPTIONEN / Wandmontage / Deckenmontage inbränt",
                 5: "EIN BILDSCHIRM UNENDLICHE EINSATZMÖGLICHKEITEN inbränt"},
}

# nyckel -> {råbildsindex: (box, skäl)} — beskärningar som görs på en bild som
# BEHÅLLS i galleriet. Boxen är (vänster, övre, höger, undre) i råbildens egna
# pixlar.
#
# ☠️ Bara EN av rundans två beskärningskandidater fick göras, och skillnaden
#    är var pixlarna satt: 1b87909f-3:s tyska packlista ligger på BAKGRUNDEN
#    ovanför ramen, 77e4a558-1:s emblem ligger på den projicerade bilden, på
#    VARAN. Den första kapas, den andra ströks.
BESKARNING = {
    "1b87909f": {3: ((0, 212, 1400, 1400),
                     "tysk packlista `2 x Stative / 8 x Bodenpfähle / "
                     "2 x 5 m Seile` i bandet ovanför ramen")},
}


def kontroll():
    """☠️ Grinden mot mig själv: en borttagen bild får inte ligga kvar i
    galleriet, och en behållen får inte saknas i råmaterialet."""
    fel = []
    for k, ordning in GALLERI.items():
        index = [x for x in ordning if isinstance(x, int)]
        if len(set(index)) != len(index):
            fel.append(f"{k}: samma råbild två gånger i galleriet")
        for i in BORTTAGNA.get(k, {}):
            if i in index:
                fel.append(f"{k}: bild {i} är borttagen men ligger i galleriet")
        if ordning.count("KORT") != 1:
            fel.append(f"{k}: kortet ligger {ordning.count('KORT')} gånger")
        # ⚠️ Kortet ligger på plats 3 — utom i det galleri som tappat så många
        #    bilder att det inte FINNS en plats 3 att lägga det på. Där ligger
        #    det på plats 2, direkt efter hjältebilden.
        if ordning.index("KORT") != (1 if len(ordning) <= 3 else 2):
            fel.append(f"{k}: kortet ligger på plats "
                       f"{ordning.index('KORT') + 1}, inte där det ska")
        # Måttritningen (3) sist — utom där den beskurna hjälten byter form.
        if 3 in index and ordning[-1] != 3:
            fel.append(f"{k}: måttritningen ligger inte sist")
        kvar = len(index)
        borta = len(BORTTAGNA.get(k, {}))
        if kvar + borta != 5:
            fel.append(f"{k}: {kvar} behållna + {borta} borttagna != 5 råbilder")
        # ☠️ En beskärning som pekar på en bild galleriet inte visar är en
        #    beskärning ingen gör — och den ser i koden ut som en åtgärdad
        #    bild. Samma familj som "ett svar utan fel är inget kvitto".
        for i in BESKARNING.get(k, {}):
            if i not in index:
                fel.append(f"{k}: bild {i} ska beskäras men ligger inte i galleriet")
            if i in BORTTAGNA.get(k, {}):
                fel.append(f"{k}: bild {i} är både borttagen och beskuren")
    return fel


if __name__ == "__main__":
    for k, o in GALLERI.items():
        print(f"{k}  {len(o)} poster  {o}"
              + (f"   (borttagna: {sorted(BORTTAGNA[k])})" if k in BORTTAGNA else ""))
    f = kontroll()
    print(f"\nkontroll: {len(f)} fel")
    for x in f:
        print("  ✗", x)
