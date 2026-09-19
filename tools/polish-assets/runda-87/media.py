# -*- coding: utf-8 -*-
"""Runda 87, Steg 9 — bildordning och alt-texter.

☠️ ORDNINGEN: hjältebilden först, livsstilsbilden andra, VÅRT KORT TREDJE,
   och MÅTTRITNINGEN SIST. Ritningen är den bild som säger minst i ett
   galleri och mest när man redan bestämt sig — den ska inte konkurrera med
   fotot om andraplatsen.

☠️ ALT-TEXTERNA MÅSTE VARA UNIKA ÖVER HELA RUNDAN. Två färgsyskonpar delar
   bild 3, 4 och 5 som SAMMA SCEN omfärgad, så det enda som skiljer texterna
   åt är färgordet och måttet. Utan den skillnaden får två av våra egna
   URL:er identiska alt-texter — samma dubblett Google straffar, skapad av
   oss.

☠️ SAMMA TALGRIND SOM LINTEN. Runda 86 mätte upp att `m²` saknades i
   alt-grinden medan den fanns i lint, och en muterad "0,43 m² golvyta"
   slapp rakt igenom. Här delas mönstren med lint.py i stället för att
   kopieras — en tvilling glider isär.
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)

import texter                                                        # noqa: E402

# Wix-fil-id för de åtta egna korten, importerade 2026-09-07 från commit
# 222b35d. sizeInBytes kontrollerad mot filen: alla åtta exakta.
KORT = {
    "72051417": "b379ce_8a9289fe09a34b74a00481e681ca9c38~mv2.jpg",
    "a165b178": "b379ce_be44d2b1822b4cb1af0a3abf2c926f9f~mv2.jpg",
    "5f6592ad": "b379ce_9bf812458db94f8ba31e6ef138f9a08d~mv2.jpg",
    "20c0942e": "b379ce_87a71da76ff44c8682521733ae69f3e5~mv2.jpg",
    "8bdba748": "b379ce_e2e689f8d7114d7b833b31fa9c1c522c~mv2.jpg",
    "0f5e3fea": "b379ce_3bc6b119f70b48558ea865f2a922ddbd~mv2.jpg",
    "6a419d8b": "b379ce_b46a4303a97d4a898460c6fefe2a38d1~mv2.jpg",
    "95a9d7cc": "b379ce_e83cbfbc85274024b1f0810af480851d~mv2.jpg",
}

BILDER = json.load(open(os.path.join(HAR, "bilder.json"), encoding="utf-8"))

# Alt-text per leverantörsbild, i ORIGINALORDNING 1-5. Kortets alt-text står
# separat. Varje text beskriver det som FAKTISKT syns på bilden — granskat på
# kontaktarken i Steg 4.
ALT = {
 "72051417": [
   "Ljusgrått garagetält 120 × 179 cm med sadeltak och öppen front",
   "Ljusgrått garagetält i trädgård med vedvagn, hopfällda stolar och planteringsbord",
   "Måttritning för garagetält: 120 cm brett, 179 cm djupt, 165 cm i nock och 134 cm takfot",
   "Ljusgrått garagetält med skottkärra, ved och krukväxt framför öppningen",
   "Ljusgrått garagetält vid stenmur med vedtrave, spade och verktyg",
 ],
 "a165b178": [
   "Mörkgrått garagetält 120 × 179 cm med sadeltak och öppen front",
   "Mörkgrått garagetält vid grönt plank med en cykel inställd",
   "Måttritning för mörkgrått garagetält: 120 × 179 cm och 165 cm i nock",
   "Mörkgrått garagetält med skottkärra, ved och krukväxt framför öppningen",
   "Mörkgrått garagetält vid stenmur med vedtrave, spade och verktyg",
 ],
 "5f6592ad": [
   "Mörkgrått garagetält 162 × 221,5 cm med dörren upprullad i toppen",
   "Mörkgrått garagetält på altan med cykel, arbetsbänk och krukor",
   "Måttritning för garagetält: 162 cm brett, 221,5 cm djupt och 163 cm i nock",
   "Mörkgrått garagetält med en motorcykel inställd på gräsmattan",
   "Mörkgrått garagetält i regn med vattendroppar på duken",
 ],
 "20c0942e": [
   "Ljusgrått garagetält 162 × 221,5 cm med dörren upprullad i toppen",
   "Ljusgrått garagetält på altan med cykel, arbetsbänk och krukor",
   "Måttritning för ljusgrått garagetält: 162 × 221,5 cm och 163 cm i nock",
   "Ljusgrått garagetält med en motorcykel inställd på gräsmattan",
   "Ljusgrått garagetält i regn med vattendroppar på duken",
 ],
 "8bdba748": [
   "Cykelgarage 245 cm brett med bågformat tak och upprullad dörr",
   "Cykelgarage på trädäck med två cyklar inställda bredvid varandra",
   "Måttritning för cykelgarage: 245 cm brett, 120 cm djupt och 200 cm högt",
   "Cykelgarage fyllt med staplad ved upp till taket",
   "Cykelgarage med stängd dörr på plattor framför en häck",
 ],
 "0f5e3fea": [
   "Mörkgrått garagetält 190 × 230 cm med hög gavel och öppen dörr",
   "Garagetält i trädgård med förvaringslådor och vattenkanna framför",
   "Måttritning för garagetält: 190 cm brett, 230 cm djupt, 220 cm högt och dörr 147 cm",
   "Garagetält mot husvägg med gräsklippare, räfsor och cykel intill",
   "Garagetält vid garageport med skottkärra och trädgårdsverktyg inne",
 ],
 "6a419d8b": [
   "Mörkgrått garagetält 300 × 300 cm med korsstag synligt i bakväggen",
   "Garagetält med hyllställ och röd åkgräsklippare inne vid vitt hus",
   "Måttritning för garagetält: 300 cm brett, 300 cm djupt och 210 cm i nock",
   "Garagetält vid plank med hyllställ och röd åkgräsklippare inne",
   "Garagetält vid tegelvägg med hyllställ och grön åkgräsklippare inne",
 ],
 "95a9d7cc": [
   "Ljusgrått förrådstält 300 × 447 cm med nätfönster på sidan",
   "Förrådstält med motorcykel och hyllställ inne vid brun vägg",
   "Måttritning för förrådstält: 300 cm brett, 447 cm djupt och 255 cm i nock",
   "Ljusgrått förrådstält med stängd dörr vid plattgång i trädgård",
   "Ljusgrått förrådstält sett från sidan med plattgång framför",
 ],
}

KORTALT = {
 "72051417": "Faktakort för garagetält 120 × 179 cm: takfot 134 cm och dörr 106 × 126 cm",
 "a165b178": "Faktakort för mörkgrått garagetält 120 × 179 cm med mått och vikt",
 "5f6592ad": "Faktakort för garagetält 162 × 221,5 cm med snölast 10 kg/m²",
 "20c0942e": "Faktakort för ljusgrått garagetält 162 × 221,5 cm med snölast 10 kg/m²",
 "8bdba748": "Faktakort för cykelgarage 245 cm brett med bågformat tak",
 "0f5e3fea": "Faktakort för garagetält 190 × 230 cm med snölast 5 kg/m²",
 "6a419d8b": "Faktakort för garagetält 300 × 300 cm med 9 m² golvyta",
 "95a9d7cc": "Faktakort för förrådstält 300 × 447 cm med 13,4 m² golvyta",
}

# ☠️ ORDNINGEN: 1, 2, KORT, 4, 5, 3 — ritningen sist.
ORDNING = [0, 1, "KORT", 3, 4, 2]


def plan():
    ut = []
    for p in texter.PRODUKTER:
        k = p["kort"]
        filer, alt = BILDER[k], ALT[k]
        poster = []
        for steg in ORDNING:
            if steg == "KORT":
                poster.append({"id": KORT[k], "altText": KORTALT[k], "kort": True})
            else:
                poster.append({"id": filer[steg], "altText": alt[steg], "kort": False})
        ut.append({"kort": k, "poster": poster})
    return ut


if __name__ == "__main__":
    p = plan()
    json.dump(p, open(os.path.join(HAR, "media-plan.json"), "w",
                      encoding="utf-8"), ensure_ascii=False, indent=1)
    print("media-plan.json:", len(p), "produkter,",
          sum(len(x["poster"]) for x in p), "bilder")
