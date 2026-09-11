# -*- coding: utf-8 -*-
"""Runda 124 Steg 11 — elva Fyndplats-kort, byggda i efterhand.

☠️ FAMILJEN ÄR FYRA FÄRGPAR OCH TRE SYSKON I SAMMA STORLEK. Kortet är det som
   skiljer dem i en kategorilista, så kickern måste bära det som FAKTISKT är
   olikt — annars får kunden fyra kort som ser likadana ut:

   | par | skiljs av |
   |---|---|
   | aafbf543 / 5541fbb0 | färgen, tre lådor båda |
   | 0283be34 / 8a6922ce | färgen, fyra lådor båda |
   | 94925af2 / aae03048 | färgen, sex lådor båda |
   | b9cca4a6 / f50b75d8 | färgen — och VIKTEN, 10,8 mot 12 kg |

   De 51 cm-långa lådorna skiljs dessutom på HÖJDEN: tre lådor ger 32 cm,
   fyra ger 39,5. Det talet står i kickern på fyrlådorna.

`kontroll()` fäller identiska kort och delade kickers FÖRE bygget.

☠️ 7b544155:s RUBRIK ÄNDRAD PÅ KONTAKTARKET. Den stod "Fem fack i tre plan"
   medan hjältebilden visar lådan STÄNGD — facken syns inte. Samma fel som
   runda 123:s hopfällbara vagn och runda 61:s skrivbord. Saxmekanismen ÄR
   synlig i fotot, så rubriken säger nu det man ser; femman står kvar i raden
   `Antal fack`, där siffror hör hemma.

⚠️ 22bedfb0:s lådantal går INTE att räkna i hjältebilden — vinkeln skymmer
   stacken. Rubriken motsägs inte av fotot, och talet är facit ur spec-tabellen
   och produktnamnet, men den som byter hjältebild ska veta att den inte bär
   räkningen.
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
    "7b544155": ("Verktygslåda 56 cm, röd", "Fälls upp i tre plan"),
    "22bedfb0": ("Verktygslåda 45 cm", "Tre lådor och övre fack"),
    "370918a9": ("Verktygslåda 49,7 cm, två lådor", "Minilådor i locket"),
    "aafbf543": ("Verktygslåda 51 cm i svart", "Tre lådor och hänglåsögla"),
    "5541fbb0": ("Verktygslåda 51 cm i rött", "Tre lådor och hänglåsögla"),
    "0283be34": ("Verktygslåda 39,5 cm hög, svart", "Fyra lådor och hänglåsögla"),
    "8a6922ce": ("Verktygslåda 39,5 cm hög, röd", "Fyra lådor och hänglåsögla"),
    "b9cca4a6": ("Verktygslåda 49,7 cm, gul", "Fyra lådor och minilådor"),
    "f50b75d8": ("Verktygslåda 49,7 cm, orange", "Fyra lådor och minilådor"),
    "94925af2": ("Verktygslåda 60 cm, röda fronter", "Sex lådor och nyckellås"),
    "aae03048": ("Verktygslåda 60 cm, helsvart", "Sex lådor och nyckellås"),
}

RADER = {
    "7b544155": [("Mått stängd", "Stängd"), ("Mått uppfälld", "Uppfälld"),
                 "Antal fack", "Bärförmåga", "Vikt"],
    "22bedfb0": ["Mått", "Antal lådor", "Lådmått", "Bärförmåga", "Vikt"],
    "370918a9": ["Mått", "Antal lådor", "Minilådor", "Bärförmåga", "Vikt"],
    "aafbf543": ["Mått", "Antal lådor", "Lådmått", "Bärförmåga", "Vikt"],
    "5541fbb0": ["Mått", "Antal lådor", "Lådmått", "Bärförmåga", "Vikt"],
    "0283be34": ["Mått", "Antal lådor", "Lådmått", "Bärförmåga", "Vikt"],
    "8a6922ce": ["Mått", "Antal lådor", "Lådmått", "Bärförmåga", "Vikt"],
    "b9cca4a6": ["Mått", "Antal lådor", "Minilådor", "Bärförmåga", "Vikt"],
    "f50b75d8": ["Mått", "Antal lådor", "Minilådor", "Bärförmåga", "Vikt"],
    "94925af2": ["Mått", "Antal lådor", ("Genomgående lådor", "Genomgående"),
                 "Bärförmåga", "Vikt"],
    "aae03048": ["Mått", "Antal lådor", ("Genomgående lådor", "Genomgående"),
                 "Bärförmåga", "Vikt"],
}

FILER = {
    "7b544155": "b379ce_58fb07b9bd0b4614819e0a6e02f1deb2~mv2.jpg",
    "22bedfb0": "b379ce_d5c0a329dc6946cf9564ea9a8f1f6a02~mv2.jpg",
    "370918a9": "b379ce_3fe7a948ea1f41198399351d681bf018~mv2.jpg",
    "aafbf543": "b379ce_0499f3d8fe2740419d67aa90a204d316~mv2.jpg",
    "5541fbb0": "b379ce_044949a895544fe6bdf87b1e452a5c71~mv2.jpg",
    "0283be34": "b379ce_2618a0108cd9467baa9731db0d7975f4~mv2.jpg",
    "8a6922ce": "b379ce_7aaa20d607ec40c2baba2bf616e8fc15~mv2.jpg",
    "b9cca4a6": "b379ce_c0d366c343ba43439868dd9203de204c~mv2.jpg",
    "f50b75d8": "b379ce_708bc77e3e9c43c8b73c14c741098fed~mv2.jpg",
    "94925af2": "b379ce_6efec84eaa384575a159a1b57fd102da~mv2.jpg",
    "aae03048": "b379ce_2ec5917f48d244d480e962664639d0e1~mv2.jpg",
}

if __name__ == "__main__":
    KR.kor(HAR, T, KORT, RADER, FILER,
           forbjudet=GR.FORBJUDET + GR.TONGRINDAR)
