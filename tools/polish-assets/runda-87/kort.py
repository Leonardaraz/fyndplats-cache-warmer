# -*- coding: utf-8 -*-
"""Runda 87 — Fyndplats eget faktakort, ett per tält.

⚠️ RADERNA SLÅS UPP PÅ ETIKETT, aldrig på position. Familjens spec-listor är
   olika långa och olika uppbyggda: `72051417` har `Takfotshöjd` där
   `5f6592ad` har `Invändigt`, `0f5e3fea` har en `Bakre ventil`-rad ingen
   annan har, `8bdba748` har `Kantbredd mot marken`, och två av åtta har
   `Golvyta` där de övriga har `Grundyta`. Ett fast index hade pekat på fel
   rad på nästan varje kort — därför slås indexet upp här och kortbygget
   kontrollerar dessutom att etiketten hör till raden.

☠️ SNÖLASTEN LIGGER PÅ TRE AV ÅTTA KORT — de tre där källan anger en siffra.
   De fem andra har `Snölast: anges inte`, och den raden hör inte hemma på
   ett kort: ett kort är sidans starkaste yta och ska bära det produkten ÄR,
   inte det källan tiger om. Avsaknaden står i spec-tabellen och i en vanlig
   fråga, precis som runda 86:s maxlast.

☠️ `8bdba748` BÄR `Ingår` I STÄLLET. Den är det enda tältet som levereras
   UTAN förankring, och det är den viktigaste uppgiften på hela sidan.
   Raden säger "tält och monteringsanvisning" och inget mer — det är
   upplysningen, inte en frånvaro.

☠️ RUBRIKERNA ÄR VALDA MOT FOTOT, INTE MOT TEXTEN. Varje rubrik pekar på
   något som syns i bild 1: den ljusa duken, den mörka, den upprullade
   dörren i toppen, de mörka innerväggarna bakom den ljusa duken, det
   bågformade taket, den öppna dörren du går in genom, hyllstället med
   åkgräsklipparen, nätfönstret på sidan.

⚠️ HÖJDEN STÅR ALDRIG ENSAM I EN RUBRIK (runda 86:s regel) — den syns inte i
   ett foto utan referens. `0f5e3fea` bär därför DÖRRMÅTTET, som är den
   öppning man ser rakt in genom på bilden.

⚠️ YTTERMÅTTET LIGGER FÖRST PÅ VARJE KORT. Familjen är åtta tält som skiljs
   på var de får plats, och det är den axeln kunden jämför på.
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)

from kortbygge import bygg                                            # noqa: E402
from texter import PRODUKTER                                          # noqa: E402

KORTPLAN = {
    # Bild 1: ljusgrå duk, sadeltak, öppen front på trädäck.
    "72051417": ("Garagetält, 120 × 179 cm", "Ljusgrå duk på galvaniserad stomme",
                 ["Yttermått", "Grundyta", "Takfotshöjd", "Dörr", "Färg",
                  "Vikt med emballage"]),
    # Bild 1: samma form i mörkgrått.
    "a165b178": ("Garagetält, 120 × 179 cm", "Mörkgrå duk och sadeltak",
                 ["Yttermått", "Grundyta", "Takfotshöjd", "Dörr", "Färg",
                  "Vikt med emballage"]),
    # Bild 1: dörren upprullad och buntad högst upp under nocken.
    "5f6592ad": ("Garagetält, 162 × 221,5 cm", "Dörren rullas upp i toppen",
                 ["Yttermått", "Grundyta", "Invändigt", "Dörr", "Snölast",
                  "Vikt med emballage"]),
    # Bild 1: ljus ytterduk, mörka innerväggar — syns tydligt i öppningen.
    "20c0942e": ("Garagetält, 162 × 221,5 cm", "Ljus duk, mörka innerväggar",
                 ["Yttermått", "Grundyta", "Invändigt", "Dörr", "Snölast",
                  "Vikt med emballage"]),
    # Bild 1: bågformat tak — familjens enda, och det syns direkt.
    "8bdba748": ("Cykelgarage, 245 cm brett", "Bågformat tak, 120 cm djupt",
                 ["Yttermått", "Grundyta", "Invändigt", "Dörr", "Tak",
                  "Ingår"]),
    # Bild 1: hög gavel med öppen dörr rakt in.
    "0f5e3fea": ("Garagetält, 190 × 230 cm", "Dörr 147 × 185 cm — gå in stående",
                 ["Yttermått", "Grundyta", "Dörr", "Bakre ventil", "Snölast",
                  "Vikt med emballage"]),
    # Bild 1: stor mörk lada med korsstaget synligt i bakväggen. Rubriken
    # måste bäras av DENNA bild — hyllstället och åkgräsklipparen finns
    # bara på bild 4 och 5.
    "6a419d8b": ("Garagetält, 300 × 300 cm", "Extra stag i stommen",
                 ["Yttermått", "Golvyta", "Invändigt", "Dörr", "Stomme",
                  "Vikt med emballage"]),
    # Bild 1: ljusgrå, störst, med nätfönstret synligt på sidan.
    "95a9d7cc": ("Förrådstält, 300 × 447 cm", "Nätfönster på sidan",
                 ["Yttermått", "Golvyta", "Takfotshöjd", "Dörr", "Fönster",
                  "Vikt med emballage"]),
}


def index_for(spec, etikett):
    """Radens index, uppslaget på ETIKETT. Kastar hellre än gissar."""
    forsta = etikett.split()[0].lower()
    traff = [i for i, r in enumerate(spec)
             if ": " in r and forsta in r.split(": ", 1)[0].lower()]
    if len(traff) != 1:
        raise SystemExit("%r matchar %d rader i specen — tvetydigt"
                         % (etikett, len(traff)))
    return traff[0]


kortdata = {}
for p in PRODUKTER:
    kicker, rubrik, etiketter = KORTPLAN[p["kort"]]
    kortdata[p["kort"]] = (kicker, rubrik,
                           [(e, index_for(p["spec"], e)) for e in etiketter])

facit = bygg(HAR, PRODUKTER, kortdata)
json.dump(facit, open(os.path.join(HAR, "kort-facit.json"), "w",
                      encoding="utf-8"), ensure_ascii=False, indent=1)
print("kort-facit.json skriven")
