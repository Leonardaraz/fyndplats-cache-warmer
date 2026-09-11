# -*- coding: utf-8 -*-
"""Runda 131 Steg 9 — sju Fyndplats-kort.

☠️ RUBRIKEN BESKRIVER FOTOT, INTE SPEC-TABELLEN. Skrivna mot bild 1:
     2166c50f  GRÅ planka med tio avsatser och FYRA gula tvärlister
     9a513e9a  samma form i BRUNT
     c2be0f30  samma form i SVART, märket ingjutet i toppplattans plast
     ed1ea8dc  fururam med SVART matta, stödben infällt under rampen
     15e4c7a7  HEL sidoskiva i lamellträ, grå matta med TVÄRLISTER
     935cd17b  furusidor, MÖRK gångyta, stödben utfällt bakåt
     1b64abde  VIT ram med PLAN PLATTFORM högst upp, grå gångyta

☠️ KORTEN ERSÄTTER LEVERANTÖRENS TYSKA PANELER. Elva bilder plockades bort i
   Steg 4 — tysk rasgrafik, tyska instruktioner och en varumärkesbanner. Det
   kunden behövde veta står i stället på kortet och i spec-tabellen.

☠️ MAXLASTEN STÅR PÅ VARJE KORT. Den spänner 15–50 kg på varor som ser
   likadana ut, och kortet är det sista stället kunden möter den innan köp.
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
    "2166c50f": ("Tio steg, grå – 154 cm", "Fyra gula halklister på tio steg"),
    "9a513e9a": ("Tio steg, brun – 154 cm", "Samma trappa i brunt"),
    "c2be0f30": ("Tio steg, svart – 154 cm", "Samma trappa i svart"),
    "ed1ea8dc": ("Fyra höjder – upp till 47,5 cm", "Fururam med matta över hela ytan"),
    "15e4c7a7": ("Fast lutning – 45 cm", "Halklister var tionde centimeter"),
    "935cd17b": ("Fyra lägen – upp till 61 cm", "Furusidor och mörk gångyta"),
    "1b64abde": ("Plattform högst upp – 35,5 cm", "Vit ram med plan yta att stanna på"),
}

# Fem rader per kort, hämtade UR spec-tabellen — aldrig omskrivna. En post är
# `"Etikett"` eller `("spec-etikett", "kortets kortare etikett")`.
RADER = {
    "2166c50f": [("Mått utfälld", "Utfälld"), ("Mått hopfälld", "Hopfälld"),
                 ("Antal steg", "Steg"), ("Största lasthöjd", "Lasthöjd"),
                 ("Max belastning", "Max last")],
    "9a513e9a": [("Mått utfälld", "Utfälld"), ("Mått hopfälld", "Hopfälld"),
                 ("Antal steg", "Steg"), ("Största lasthöjd", "Lasthöjd"),
                 ("Max belastning", "Max last")],
    "c2be0f30": [("Mått utfälld", "Utfälld"), ("Mått hopfälld", "Hopfälld"),
                 ("Antal steg", "Steg"), ("Halklister", "Halklister"),
                 ("Max belastning", "Max last")],
    "ed1ea8dc": [("Mått utfälld", "Utfälld"), ("Mått hopfälld", "Hopfälld"),
                 "Höjdlägen", "Lutning", ("Max belastning", "Max last")],
    "15e4c7a7": ["Mått", "Material", "Färg",
                 ("Avstånd mellan halklister", "Avstånd lister"),
                 ("Max belastning", "Max last")],
    "935cd17b": [("Mått uppställd", "Uppställd"), ("Mått hopfälld", "Hopfälld"),
                 "Höjdlägen", "Material", ("Max belastning", "Max last")],
    "1b64abde": ["Mått", "Ramplutning", "Plattform", "Material",
                 ("Max belastning", "Max last")],
}

# Bild 1 per produkt — samma fil som ligger först i `bilder.txt`.
FILER = {
    "2166c50f": "b379ce_0b91589777c146d1a22958b3fe9bc6b5~mv2.jpg",
    "9a513e9a": "b379ce_18f19d7116b34a16b28f882ef34cd9d4~mv2.jpg",
    "c2be0f30": "b379ce_833d00503446429381a94fae95b6efff~mv2.jpg",
    "ed1ea8dc": "b379ce_73ece62389444f1e8c87278eb767b41d~mv2.jpg",
    "15e4c7a7": "b379ce_40f903ea25024e1eb2089aa558cc7992~mv2.jpg",
    "935cd17b": "b379ce_427b4d2a2da342b997ef4b20240b9a8e~mv2.jpg",
    "1b64abde": "b379ce_0abe5fcc618540a6a8344041f7d62e38~mv2.jpg",
}

if __name__ == "__main__":
    KR.kor(HAR, T, KORT, RADER, FILER, forbjudet=GR.FORBJUDET)
