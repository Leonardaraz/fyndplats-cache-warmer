# -*- coding: utf-8 -*-
"""Runda 127 Steg 9 — alt-texter och de fem bilder som plockas bort.

☠️ FEM AV ÅTTA SIDOR TAPPAR EN BILD. Fyra bär TYSK text inbränd i pixlarna,
   en bär ENGELSK, och en bär leverantörens LOGOTYP:

     `4d5b3bb5` pos 4  *KLEINE, KOMPAKTE GRÖSSE — Passt leicht unter…*
     `66866eb7` pos 4  *PASST UNTER SCHREIBTISCHE — Kompakte Größe…*
     `3273d2ee` pos 4  *NUR DIE ROLLEN MONTIEREN*
     `21a12739` pos 4  *SAFETY DESIGN — It is only possible to open a drawer…*
     `9b8c7308` pos 5  ☠️ HOMCOM-logotyp inbränd uppe till vänster

   Innehållet i de två sista följer ändå med till TEXTEN där det är belagt:
   `3273d2ee` skriver ut att bara hjulen monteras (står i Lieferumfang).
   Lådspärren i `21a12739`:s overlay skrivs INTE ut — se `STEG3-5.md` §5.

☠️ ALT-TEXTEN ÄR KUNDTEXT och grindas som sådan (uppgift #381). Samma
   förbudslista som brödtexten, plus: högst 125 tecken, måste namnge
   produkten, och ingen får vara identisk med någon annan i rundan.

⚠️ SKRIVAREN STÅR I TVÅ LIVSSTILSBILDER (`521aec3c` pos 2, `3273d2ee` pos 2)
   och nämns i INGEN alt-text. Sidorna anger last per LÅDA, aldrig för
   toppskivan — en alt-text som skriver ut skrivaren hade gjort ett
   belastningspåstående som ingen av de två sidorna backar upp. Samma
   avvägning som fällde `709f7aac`:s "Druckerablage" i Steg 5.

⚠️ `9b8c7308` pos 4 är en KOMPONERAD render, inte ett foto av tre utdragna
   lådor (rättelsen i `STEG3-5.md`). Alt-texten säger därför "visar
   innehållet i", aldrig "tre lådor öppna samtidigt".
"""
import re
import sys

sys.path.insert(0, "..")

import grindar as G          # noqa: E402
import grind as GR           # noqa: E402
import texter as T           # noqa: E402

# (produkt, position) som plockas bort.
BORT = {("4d5b3bb5", 4), ("66866eb7", 4), ("3273d2ee", 4),
        ("21a12739", 4), ("9b8c7308", 5)}

ALT = {
    "709f7aac": {
        1: "Vit kubhylla på hjul med tre öppna fack vända åt olika håll, "
           "sedd snett framifrån",
        2: "Kubhyllan står vid ett skrivbord i trä med papper och pärmar "
           "i två av facken",
        3: "Måttritning på kubhyllan: 111 centimeter hög, 33,5 × 33,5 "
           "centimeter i botten och 9 kilo maxlast",
        4: "Person står vid kubhyllan i ett sovrum med sminkbord och säng "
           "i bakgrunden",
        5: "Kubhyllan står mellan ett skrivbord och en bokhylla med "
           "tidskrifter i det mellersta facket",
    },
    "4d5b3bb5": {
        1: "Svart hurts med tre lådor och nyckellås, med pennfack och "
           "pappersställ ovanpå",
        2: "Den svarta hurtsen står bredvid ett skrivbord med ett "
           "skrivbordsställ ovanpå och en papperskorg intill",
        3: "Måttritning på hurtsen: 37 centimeter bred, 43,5 djup och "
           "60 hög",
        5: "Pappersställ i metallnät på den svarta hurtsens topp, med "
           "översta lådan utdragen under",
    },
    "66866eb7": {
        1: "Svart hurts med två lådor och nyckellås, sedd snett framifrån "
           "med kontorsmaterial ovanpå",
        2: "Den svarta hurtsen med två lådor står vid ett skrivbord med en "
           "trådkorg med ritningar intill",
        3: "Måttritning på hurtsen med två lådor: 37 centimeter bred, "
           "43,5 djup och 67,5 hög",
        5: "Pappersställ med pärmar, pennor och gem står på den svarta "
           "hurtsens topp",
    },
    "521aec3c": {
        1: "Vit hurts med två lådor och infällda greppskålar, sedd snett "
           "framifrån",
        2: "Den vita hurtsen med två lådor står bredvid ett skrivbord i "
           "trä i ett hemmakontor",
        3: "Måttritning på hurtsen: 39 centimeter bred, 48 djup och 67 hög",
        4: "Blå pärmar i ett pappersställ ovanpå den vita hurtsen med två "
           "lådor",
        5: "Närbild på den vita hurtsens lås med nyckeln isatt",
    },
    "9ba9af92": {
        1: "Vit hurts med tre lådor och ett lås överst, sedd snett "
           "framifrån på hjul",
        2: "Den vita hurtsen står bredvid ett skrivbord i trä med en svart "
           "vägghylla bakom",
        3: "Måttritning på den vita hurtsen: 39 centimeter bred, 48 djup "
           "och 60 hög",
        4: "Närbild på hängmappsskenan i hurtsens arkivlåda med färgade "
           "hängmappar uppsatta",
        5: "Hurtsens arkivlåda utdragen med färgade hängmappar på plats i "
           "det svarta lådtråget",
    },
    "3273d2ee": {
        1: "Vit hurts med tre släta lådfronter utan handtag, sedd snett "
           "framifrån",
        2: "Den vita hurtsen med greppfria fronter står vid ett skrivbord "
           "i ett ljust arbetsrum",
        3: "Måttritning på hurtsen: 39 × 48 × 59 centimeter, lådor "
           "32,6 × 43,2 och 50 kilo sammanlagt",
        5: "Hand som greppar under kanten på den vita hurtsens översta "
           "lådfront",
    },
    "9b8c7308": {
        1: "Vit hurts med ett avlångt handtag infällt i varje front och "
           "rundade hörn",
        2: "Den vita hurtsen med infällda handtag står vid ett skrivbord "
           "med en trådkorg med ritningar intill",
        3: "Måttritning på den vita hurtsen med infällda handtag: "
           "39 × 48 × 59 centimeter",
        4: "Bild som visar innehållet i hurtsens tre lådor, med hängmappar "
           "i arkivlådan längst ned",
    },
    "21a12739": {
        1: "Svart hurts med ett avlångt handtag infällt i varje front och "
           "rundade hörn",
        2: "Den svarta hurtsen med infällda handtag står vid ett mörkt "
           "skrivbord i ett arbetsrum",
        3: "Måttritning på den svarta hurtsen: 39 centimeter bred, 48 djup "
           "och 59 hög",
        5: "Närbild på den svarta hurtsens rundade hörn och infällda "
           "handtag",
    },
}

FORBJUDET = [m for m, _ in GR.FORBJUDET] + [m for m, _ in GR.TONGRINDAR]
ETIKETT = ({m: e for m, e in GR.FORBJUDET}
           | {m: e for m, e in GR.TONGRINDAR})

# Ordet som måste stå i alt-texten för att den ska namnge produkten.
HUVUDORD = {"709f7aac": "kubhylla", "4d5b3bb5": "hurts", "66866eb7": "hurts",
            "521aec3c": "hurts", "9ba9af92": "hurts", "3273d2ee": "hurts",
            "9b8c7308": "hurts", "21a12739": "hurts"}

# ☠️ Skrivaren står i två livsstilsbilder men får inte nämnas — se modulens
#    docstring. Egen grind i stället för en tyst vana.
SKRIVARE = re.compile(r"\bskrivar\w*|\bprinter\w*", re.I)

# ☠️ `9b8c7308` pos 4 är en render; "öppna samtidigt" vore ett påstående om
#    en lådspärr som ingen text backar upp.
SAMTIDIGT = re.compile(r"\böppna\w*\s+samtidigt|\bsamtidigt\s+öppna\w*"
                       r"|\balla\s+tre\s+lådor\w*\s+(?:är\s+)?(?:ut)?dragna",
                       re.I)


def granska():
    fel = []
    sedda = {}
    for pid, rader in ALT.items():
        for n, txt in sorted(rader.items()):
            if (pid, n) in BORT:
                fel.append(f"{pid} pos {n}: bilden ska BORT men har alt-text")
            for m in FORBJUDET:
                if m.search(txt):
                    fel.append(f"{pid} pos {n} "
                               f"{ETIKETT.get(m, 'FÖRBJUDET')}: {txt}")
            if SKRIVARE.search(txt):
                fel.append(f"{pid} pos {n} SKRIVARE — ingen sida anger last "
                           f"för toppskivan: {txt}")
            if SAMTIDIGT.search(txt):
                fel.append(f"{pid} pos {n} LÅDSPÄRR — renderad bild bevisar "
                           f"inte att lådorna öppnas samtidigt: {txt}")
            if len(txt) > 125:
                fel.append(f"{pid} pos {n}: {len(txt)} tecken, max 125")
            if HUVUDORD[pid] not in txt.lower():
                fel.append(f"{pid} pos {n}: namnger inte produkten "
                           f"({HUVUDORD[pid]!r} saknas) — {txt}")
            if txt in sedda:
                fel.append(f"{pid} pos {n}: IDENTISK med {sedda[txt]} — {txt}")
            sedda[txt] = f"{pid} pos {n}"
            fel += [f"{pid} pos {n} HOMOGLYF {c} ({b})"
                    for c, b, _ in G.homoglyfer(txt)]
        # Varje produkt ska ha exakt så många alt-texter som den har kvar.
        kvar = 5 - sum(1 for (p, _) in BORT if p == pid)
        if len(rader) != kvar:
            fel.append(f"{pid}: {len(rader)} alt-texter, väntade {kvar}")
    # Varje produkt i rundan ska finnas med.
    for pid in T.NAMN:
        if pid not in ALT:
            fel.append(f"{pid}: saknas helt i ALT")
    return fel


# Grindarnas egna grindar: texter som MÅSTE fällas.
SJALVTEST = [
    ("Den vita hurtsen med en skrivare ovanpå", "SKRIVARE"),
    ("Hurtsen med alla tre lådor öppna samtidigt", "LÅDSPÄRR"),
]


def _sjalvtest():
    fel = []
    for txt, vad in SJALVTEST:
        traff = (SKRIVARE.search(txt) and vad == "SKRIVARE") or \
                (SAMTIDIGT.search(txt) and vad == "LÅDSPÄRR")
        if not traff:
            fel.append(f"SJÄLVTEST: {vad!r} fällde INTE {txt!r}")
    return fel


if __name__ == "__main__":
    f = _sjalvtest() + granska()
    n = sum(len(r) for r in ALT.values())
    print(f"galleri.granska(): {n} alt-texter, {len(BORT)} borttagna bilder, "
          f"{len(SJALVTEST)} självtest, {len(f)} fel")
    for rad in f:
        print("  ☠️", rad)
    sys.exit(1 if f else 0)
