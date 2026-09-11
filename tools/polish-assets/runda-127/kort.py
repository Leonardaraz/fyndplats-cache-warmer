# -*- coding: utf-8 -*-
"""Runda 127 Steg 11 — åtta Fyndplats-kort, byggda i efterhand.

☠️ FEM HURTSAR PÅ 59–67 CM som alla är "tre låsbara lådor på hjul". Rubriken
   måste peka på det ENDA som skiljer dem, annars är kortet meningslöst just
   där det behövs mest — i en kategorilista med syskonen bredvid:

   | kort | höjd | särart |
   |---|---|---|
   | 521aec3c | 67 cm | TVÅ djupa lådor, inte tre |
   | 9ba9af92 | 60 cm | tippskyddshjul |
   | 3273d2ee | 59 cm | greppfri front — inget handtag alls |
   | 9b8c7308 | 59 cm | infällt handtag, vit med svart kantlist |
   | 21a12739 | 59 cm | infällt handtag, helsvart |

☠️ TVÅ RUBRIKER ÄNDRADE PÅ KONTAKTARKET, båda för att de pekade på något
   fotot inte visar:

   - 4d5b3bb5 stod "Smal med löstagbart pennfack". Pennfacket är en INVÄNDIG
     tråg-insats; det som syns i bilden är en pennkopp som stylisten ställt
     ovanpå. Rubriken hade alltså pekat på rekvisita. Facket står kvar i
     raden `Pennfack`, där det hör hemma.
   - 9ba9af92 stod "Tre lådor och tippskyddshjul". Tippskyddshjulet är ett
     litet femte hjul som inte går att urskilja i hjältebilden. Det står kvar
     i raden `Hjul`.

   Samma rättelse som runda 123, 124, 125 och 126 — femte rundan i rad där
   kontaktarket fångar ett bildlöfte som ingen textgrind kan se.
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
    "709f7aac": ("Kubhylla 111 cm på hjul", "Tre fack åt olika håll"),
    "4d5b3bb5": ("Hurts 37 cm, tre lådor", "Två grunda och en arkivlåda"),
    "66866eb7": ("Hurts 37 cm, två lådor", "Smal och 67,5 cm hög"),
    "521aec3c": ("Hurts 67 cm, vit", "Två djupa lådor"),
    "9ba9af92": ("Hurts 60 cm, vit", "Tre lådor på fyra länkhjul"),
    "3273d2ee": ("Hurts 59 cm, greppfri", "Front utan handtag"),
    "9b8c7308": ("Hurts 59 cm, vit med svart list", "Infällt handtag i varje front"),
    "21a12739": ("Hurts 59 cm, svart", "Infällt handtag i varje front"),
}

RADER = {
    "709f7aac": ["Mått", "Fack", "Maxlast", "Hjul", "Vikt"],
    "4d5b3bb5": ["Mått", "Lådor", "Pennfack", "Maxlast", "Vikt"],
    "66866eb7": ["Mått", "Lådor", ("Låda invändigt", "Låda"), "Maxlast", "Vikt"],
    "521aec3c": ["Mått", "Lådor", ("Låda invändigt", "Låda"), "Maxlast", "Vikt"],
    "9ba9af92": ["Mått", "Lådor", "Hjul", "Maxlast", "Vikt"],
    "3273d2ee": ["Mått", "Lådor", "Grepp", "Maxlast", "Vikt"],
    "9b8c7308": ["Mått", "Lådor", "Grepp", "Maxlast", "Vikt"],
    "21a12739": ["Mått", "Lådor", "Grepp", "Maxlast", "Vikt"],
}

FILER = {
    "709f7aac": "b379ce_c24a54ecd9394d7d9d5a1db1ea7f5008~mv2.jpg",
    "4d5b3bb5": "b379ce_68c529eb2f8a4d2a919217a5d52728eb~mv2.jpg",
    "66866eb7": "b379ce_b291959a90fc42858e23ccea021704eb~mv2.jpg",
    "521aec3c": "b379ce_e37e354bcf62410bbbeff81eda2db2a5~mv2.jpg",
    "9ba9af92": "b379ce_70cb24ff98a641e1bef6e157e660d03e~mv2.jpg",
    "3273d2ee": "b379ce_741240f0c9ac47d2bc169c5d8bedda0b~mv2.jpg",
    "9b8c7308": "b379ce_4d82d3e693f9474d9b83b54067a429d8~mv2.jpg",
    "21a12739": "b379ce_d4fa11120d7e45ca894f8a94e035c3f1~mv2.jpg",
}

if __name__ == "__main__":
    KR.kor(HAR, T, KORT, RADER, FILER,
           forbjudet=GR.FORBJUDET + GR.TONGRINDAR)
