# -*- coding: utf-8 -*-
"""Runda 126 Steg 9 — alt-texter och de två bilder som plockas bort.

☠️ `ed44170a` POSITION 4 OCH 5 BÄR STOR TYSK TEXT I PIXLARNA:
   *4 VERSTELLBARE STÜTZARME · Passend für 2x6 Holz* respektive
   *RUTSCHFESTE DETAILS · EVA-Oberfläche · Rutschfeste Fußpolster*.
   Den går inte att polera bort. Sidan behåller tre bilder.

☠️ ALT-TEXTEN ÄR KUNDTEXT och grindas som sådan (uppgift #381). Samma
   förbudslista som brödtexten, plus: högst 125 tecken, måste namnge
   produkten, och ingen får vara identisk med någon annan i rundan.

⚠️ `9e9c78b9` position 5 bär tre läsbara tredjepartsmärken i SCENEN, inte
   på varan. Bilden ligger kvar; beslutet är Leonards (uppgift #461).
"""
import re
import sys

sys.path.insert(0, "..")

import grindar as G          # noqa: E402
import grind as GR           # noqa: E402
import texter as T           # noqa: E402

# (produkt, position) som plockas bort.
BORT = {("ed44170a", 4), ("ed44170a", 5)}

ALT = {
    "3afe7275": {
        1: "Två stödbockar i svart metall med teleskopben i förzinkad plåt, "
           "sedda snett framifrån",
        2: "Person sågar en bräda som vilar över de två stödbockarna",
        3: "Måttritning på stödbocken: 68 × 56 centimeter och 80 till 130 "
           "centimeter hög",
        4: "Närbild på stödbockens teleskopben med låssprint och säkringskedja",
        5: "Hand som drar ut låssprinten ur stödbockens teleskoprör",
    },
    "17e683e0": {
        1: "Två orange sågbockar med svarta ben, uppfällda sida vid sida",
        2: "Tjock planka som vilar över två orange sågbockar i en verkstad",
        3: "Måttritning på sågbocken: 93 centimeter lång, 71 till 85,5 "
           "centimeter hög och 14 centimeter hopfälld",
        4: "Person kapar en regel som ligger över de två orange sågbockarna",
        5: "Två orange sågbockar bär en träpanel i en trädgård",
    },
    "ed44170a": {
        1: "Två röda arbetsbockar med svarta ben och förkromade benskenor",
        2: "Grov träplanka vilar över två röda arbetsbockar i en snickarverkstad",
        3: "Måttritning på arbetsbocken: 116 centimeter lång, 64 till 81 "
           "centimeter hög och 7 centimeter hopfälld",
    },
    "4a8e7f21": {
        1: "Kapsågstativ i svart stål med två utdragbara rullstöd och två hjul",
        2: "Kapsågstativet står utfällt i ett rum under renovering",
        3: "Måttritning på kapsågstativet: 96 centimeter högt, 73 centimeter "
           "brett och 123,5 till 245 centimeter långt",
        4: "Närbild på kapsågstativets två snabbfästen på skenorna",
        5: "Närbild på kapsågstativets ben, handtag och låsning",
    },
    "941867cb": {
        1: "Hopfällbar verkstadsbänk i svart stål med hålplank och krokar",
        2: "Verkstadsbänkens hålplank fullt med handverktyg i ett garage",
        3: "Måttritning på verkstadsbänken: 115 × 62 × 143,5 centimeter och "
           "9 centimeter hopfälld",
        4: "Verkstadsbänken står med borrmaskin och skruvlåda på arbetsytan",
        5: "Verkstadsbänken används som bakbord med formar och redskap på "
           "hålplanket",
    },
    "9e9c78b9": {
        1: "Verkstadsbänk 155 centimeter i svart stål med hålplank, låda och "
           "två hyllplan i MDF",
        2: "Verkstadsbänken står fullt utrustad i en däckverkstad",
        3: "Måttritning på verkstadsbänken: 80 × 40,5 × 155 centimeter med "
           "bänkskivan på 91,5 centimeter",
        4: "Person lyfter en kartong intill verkstadsbänken i ett garage",
        5: "Verkstadsbänkens hålplank och hyllplan fyllda med verktyg och "
           "sprayflaskor",
    },
}

FORBJUDET = [m for m, _ in GR.FORBJUDET] + [m for m, _ in GR.TONGRINDAR]
ETIKETT = ({m: e for m, e in GR.FORBJUDET}
           | {m: e for m, e in GR.TONGRINDAR})

# Ordet som måste stå i alt-texten för att den ska namnge produkten.
HUVUDORD = {"3afe7275": "stödbock", "17e683e0": "sågbock",
            "ed44170a": "arbetsbock", "4a8e7f21": "kapsågstativ",
            "941867cb": "verkstadsbänk", "9e9c78b9": "verkstadsbänk"}


def granska():
    fel = []
    sedda = {}
    for pid, rader in ALT.items():
        for n, txt in sorted(rader.items()):
            if (pid, n) in BORT:
                fel.append(f"{pid} pos {n}: bilden ska BORT men har alt-text")
            for m in FORBJUDET:
                for t in m.finditer(txt):
                    fel.append(f"{pid} pos {n} {ETIKETT.get(m, 'FÖRBJUDET')}: {txt}")
            if len(txt) > 125:
                fel.append(f"{pid} pos {n}: {len(txt)} tecken, max 125")
            if HUVUDORD[pid] not in txt.lower():
                fel.append(f"{pid} pos {n}: namnger inte produkten "
                           f"({HUVUDORD[pid]!r} saknas) — {txt}")
            if txt in sedda:
                fel.append(f"{pid} pos {n}: IDENTISK med {sedda[txt]} — {txt}")
            sedda[txt] = f"{pid} pos {n}"
            fel += [f"{pid} pos {n} HOMOGLYF {c} ({b})" for c, b, _ in G.homoglyfer(txt)]
        # Varje produkt ska ha exakt så många alt-texter som den har bilder kvar.
        kvar = 5 - sum(1 for (p, _) in BORT if p == pid)
        if len(rader) != kvar:
            fel.append(f"{pid}: {len(rader)} alt-texter, väntade {kvar}")
    return fel


if __name__ == "__main__":
    f = granska()
    n = sum(len(r) for r in ALT.values())
    print(f"galleri.granska(): {n} alt-texter, {len(BORT)} borttagna bilder, "
          f"{len(f)} fel")
    for rad in f:
        print("  ☠️", rad)
    sys.exit(1 if f else 0)
