# -*- coding: utf-8 -*-
"""Runda 126 Steg 11 — sex Fyndplats-kort, byggda i efterhand.

⚠️ TRE BOCKPAR I RAD. 3afe7275, 17e683e0 och ed44170a är alla "2-pack bockar"
   och konkurrerar om samma sökord. Det som SKILJER dem är bärförmågan per
   bock — 200, 250 och 580 kg — och den siffran ska kunden se på kortet, inte
   behöva räkna ut ur tre nästan lika rubriker.

☠️ 941867cb:s RUBRIK ÄNDRAD PÅ KONTAKTARKET. Den stod "Hålplank med trettio
   krokar" medan hjältebilden visar planket TOMT — krokarna ingår, men de
   syns inte. Samma fel som runda 123:s 2bf00891, runda 124:s 7b544155 och
   runda 125:s tre. Antalet står kvar i raden `Krokar`.
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
    "3afe7275": ("Stödbockar, 2-pack", "Teleskop i sex lägen"),
    "17e683e0": ("Sågbockar, 2-pack orange", "Urtag för regel i 2x4"),
    "ed44170a": ("Arbetsbockar, 2-pack röda", "Sju höjdlägen per bock"),
    "4a8e7f21": ("Kapsågstativ 245 cm", "Två rullstöd på skenor"),
    "941867cb": ("Verkstadsbänk på hjul", "Hålplank över arbetsytan"),
    "9e9c78b9": ("Verkstadsbänk 155 cm", "Hålplank, låda och två plan"),
}

RADER = {
    "3afe7275": [("Mått per bock", "Per bock"), "Hopfällt", "Höjdlägen",
                 "Bärförmåga", "Vikt"],
    "17e683e0": [("Mått per bock", "Per bock"), "Hopfällt", "Höjdlägen",
                 "Bärförmåga", "Vikt"],
    "ed44170a": [("Mått per bock", "Per bock"), "Hopfällt", "Höjdlägen",
                 "Bärförmåga", "Vikt"],
    "4a8e7f21": [("Mått utfällt", "Utfällt"),
                 ("Avstånd mellan rullarna", "Mellan rullarna"),
                 "Rulle", "Bärförmåga", "Vikt"],
    "941867cb": ["Mått", "Arbetsyta", "Hålplank", "Krokar", "Vikt"],
    "9e9c78b9": ["Mått", "Bänkskiva", "Hålplank", "Låda", "Vikt"],
}

FILER = {
    "3afe7275": "b379ce_9af9cc003d9a47f985145e4a1ac69e3c~mv2.jpg",
    "17e683e0": "b379ce_d0c147b24a0f4231ac1d3fd25e0c19c0~mv2.jpg",
    "ed44170a": "b379ce_c02fb6f6ab7d4f29bffa4e92a25b68c9~mv2.jpg",
    "4a8e7f21": "b379ce_1c4b8fc8c9dc4b37951ab720bf4e62ca~mv2.jpg",
    "941867cb": "b379ce_5ced180bece4474e94cd69646e8f6e57~mv2.jpg",
    "9e9c78b9": "b379ce_23abc7cba8744678baa6926a11169a41~mv2.jpg",
}

if __name__ == "__main__":
    KR.kor(HAR, T, KORT, RADER, FILER,
           forbjudet=GR.FORBJUDET + GR.TONGRINDAR)
