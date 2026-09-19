# -*- coding: utf-8 -*-
"""Runda 123 Steg 11 — nio Fyndplats-kort, byggda i efterhand.

⚠️ TVÅ AV NIO ÄR UTKAST: 46a5eeda och db2f05f9 hålls tillbaka på slutsålt lager
   (uppgift #456). Korten byggs ändå så sidorna är kompletta när lagret kommer
   tillbaka; media-PATCHen måste eka `visible: false` oförändrat.

⚠️ Familjen är nio rullvagnar som konkurrerar om samma sökord, och sex av dem
   har "tre plan". Kortet är det som skiljer dem i en kategorilista, så rubriken
   måste peka på det som FAKTISKT är olikt: kantens höjd, plattan, låsbara
   lådan, hopfällbarheten.
"""
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import grind as GR                                               # noqa: E402
import kortrunda as KR                                           # noqa: E402
import texter as T                                               # noqa: E402

KORT = {
    "887d388d": ("Verktygsvagn 83 cm", "Tre plan med verktygshål"),
    "7be028f5": ("Verktygsvagn 81 cm", "Tre släta plan"),
    "46a5eeda": ("Verktygsvagn 56 cm", "Hålskivor och tio krokar"),
    "c8105590": ("Verkstadsvagn 70 cm", "Tre plan i lackad metall"),
    "df9475dc": ("Verktygsvagn 83 cm i stål", "Tre plan med 7 cm kant"),
    "4e0a06c0": ("Verkstadsvagn 84,5 cm", "Två plan med 9 cm kant"),
    "db2f05f9": ("Verktygsvagn 102 cm", "Två plan och verktygsplatta"),
    "2bf00891": ("Hopfällbar verktygsvagn", "Tre plan som fälls ihop"),
    "12cb8a2c": ("Verkstadsvagn 78 cm", "Tre plan och låsbar låda"),
}

# ⚠️ ("spec-etikett", "kort-etikett") där tabellens egen etikett är för lång
#    för kortets smala kolumn. `kortbygge.varde` kräver ändå att kortets första
#    ord finns i spec-radens etikett, så förkortningen kan inte peka på fel rad.
FRITT = ("Fritt utrymme mellan planen", "Fritt mellan plan")

RADER = {
    "887d388d": ["Totalmått", "Hyllplan", FRITT, "Maxlast", "Vikt"],
    "7be028f5": ["Totalmått", "Hyllplan", FRITT, "Maxlast", "Vikt"],
    "46a5eeda": ["Totalmått", "Hyllplan", "Ingår", "Maxlast", "Vikt"],
    "c8105590": ["Totalmått", "Plan", FRITT, "Maxlast", "Vikt"],
    "df9475dc": ["Totalmått", ("Nedersta planet", "Nedersta planet"),
                 FRITT, "Maxlast", "Vikt"],
    "4e0a06c0": ["Totalmått", ("Översta planet", "Översta planet"),
                 FRITT, "Maxlast", "Vikt"],
    # ☠️ db2f05f9 har ingen maxlast i spec-tabellen — kortet får inte låna en
    #    från en syskonvagn. Verktygsplattan bär raden i stället.
    "db2f05f9": ["Totalmått", "Plan", "Verktygsplatta", FRITT, "Vikt"],
    "2bf00891": [("Totalmått utfälld", "Utfälld"),
                 ("Tjocklek hopfälld", "Hopfälld"),
                 "Hyllplan", "Maxlast", "Vikt"],
    "12cb8a2c": ["Totalmått", "Plan", "Låda", "Maxlast", "Vikt"],
}

FILER = {
    "887d388d": "b379ce_ab98a13385bc4402b59c7cdf4288a44c~mv2.jpg",
    "7be028f5": "b379ce_d19a7a8481aa4788a0898676f40ba3a3~mv2.jpg",
    "46a5eeda": "b379ce_717797a9412e45c880c5802001e03ef6~mv2.jpg",
    "c8105590": "b379ce_0199a127906244629e241c64fa1354d0~mv2.jpg",
    "df9475dc": "b379ce_4479de71779042929baff093b76ead3b~mv2.jpg",
    "4e0a06c0": "b379ce_10ba58da0e144b318af9ed01c1b0db04~mv2.jpg",
    "db2f05f9": "b379ce_afdba851ed9043d7954ed8c6dce5e19d~mv2.jpg",
    "2bf00891": "b379ce_014d0b50cad54ec5b7aaa3118741df7f~mv2.jpg",
    "12cb8a2c": "b379ce_456cbf1c1e4948c8a0dc21ae236e3735~mv2.jpg",
}

if __name__ == "__main__":
    KR.kor(HAR, T, KORT, RADER, FILER,
           forbjudet=GR.FORBJUDET + GR.TONGRINDAR)
