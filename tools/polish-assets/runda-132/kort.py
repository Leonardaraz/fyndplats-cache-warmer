# -*- coding: utf-8 -*-
"""Runda 132 Steg 9 — tio Fyndplats-kort.

☠️ RUBRIKEN BESKRIVER FOTOT, INTE SPEC-TABELLEN. Skrivna mot bild 1, läst i
   kontaktark-1.jpg och kontaktark-2.jpg:

     8f6147b5  tre LJUSGRÅ plyschsteg på gräddvita SISALSTOLPAR
     4c25eb86  fyra MÖRKGRÅ plyschsteg på samma sisalstolpar
     762cc411  tre GRÄDDVITA bouclésteg — stolparna är klädda i samma bouclé
     f384c51d  fyra steg, LJUS TRÄLOOK-stomme med gräddvita dynor
     3ff2bc32  samma form i MÖRKBRUNT med bruna dynor
     03715963  tre steg, GRÄDDVIT tygstomme med vita ludna dynor
     c38f929e  samma form i MÖRKBLÅTT med bruna dynor
     96d2803c  två GRÅ konstläderkuddar i trappform
     11436227  samma två kuddar i MÖRKT konstläder
     71e8e879  tre skumsteg, GRÄDDVITA gångytor mot BRUNA sidor

☠️ FÄRGRADEN BÄR FÄRGSYSKONEN ISÄR. Fyra av tio är par som delar varenda
   mått (f384c51d/3ff2bc32, 03715963/c38f929e, 96d2803c/11436227). Utan
   `Färg` på kortet hade paren fått IDENTISKA rader — kortrunda.kontroll
   fäller bara på identisk (kicker, rubrik, rader), så tvillingen hade
   passerat grinden och ändå inte hjälpt någon att skilja sidorna åt.

☠️ c38f929e:s BLÅ SYNS INTE I HJÄLTEBILDEN — bara i närbilden. Uppmätt på
   mörka pixlar (max < 110), b minus r per bild:

     bild 1 (hjälte)  -3,2   → läser NEUTRALT SVART
     bild 2 (miljö)   -6,6   → varmt svart
     bild 4 (närbild) +12,8  → tydligt marinblått
     bild 5 (insidan)  +6,7

   Färgen är alltså ÄKTA — men rubriken sitter över hjältebilden, och den
   bär den inte. Rubriken säger därför "mörk tygstomme"; `mörkblå` står kvar
   i kickern, i spec-raden och i produktnamnet, där den är MÄTT och inte
   ett bildlöfte. Samma regel som fällde sju kort i runda 121-128:
   rubriken ska säga det läsaren ser i samma ögonkast.

☠️ INGEN MAXLAST DÄR KÄLLAN INTE ANGER NÅGON. Fyra produkter saknar
   maxlast (de tre tygtrapporna och de två kuddarna); deras kort tar `Vikt`
   i stället. Ett kort är det sista stället kunden möter talet före köp —
   ett framräknat tal där hade varit värre än inget.
"""
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import bilder as B                                               # noqa: E402
import grind as GR                                               # noqa: E402
import kortrunda as KR                                           # noqa: E402
import texter as T                                               # noqa: E402

KORT = {
    "8f6147b5": ("Tre steg, ljusgrå – 34 cm", "Sisallindade stolpar under varje steg"),
    "4c25eb86": ("Fyra steg, mörkgrå – 59 cm", "Fyra plyschsteg på sisalstolpar"),
    "762cc411": ("Tre steg, gräddvit – 34 cm", "Bouclé över både steg och stolpar"),
    "f384c51d": ("Fyra steg i ljus trälook", "Gräddvita dynor på ljus stomme"),
    "3ff2bc32": ("Fyra steg i mörkbrunt", "Bruna dynor på mörkbrun stomme"),
    "03715963": ("Tre steg, gräddvit – 48 cm", "Vita dynor på gräddvit tygstomme"),
    "c38f929e": ("Tre steg, mörkblå – 48 cm", "Bruna dynor på mörk tygstomme"),
    "96d2803c": ("Två steg, grå – 20 cm", "Två kuddar i grått konstläder"),
    "11436227": ("Två steg, mörkgrå – 20 cm", "Två kuddar i mörkt konstläder"),
    "71e8e879": ("Tre steg i skum – 39 cm", "Gräddvita gångytor mot bruna sidor"),
}

# Fem rader per kort, hämtade UR spec-tabellen — aldrig omskrivna. En post är
# `"Etikett"` eller `("spec-etikett", "kortets kortare etikett")`.
RADER = {
    "8f6147b5": [("Antal steg", "Steg"), "Höjd", "Mått", "Material",
                 ("Maxlast", "Max last")],
    "4c25eb86": [("Antal steg", "Steg"), "Höjd", "Mått", "Stegyta",
                 ("Maxlast", "Max last")],
    "762cc411": [("Antal steg", "Steg"), "Höjd", "Mått", "Material",
                 ("Maxlast", "Max last")],
    "f384c51d": [("Antal steg", "Steg"), "Höjd", "Mått", "Färg",
                 ("Maxlast", "Max last")],
    "3ff2bc32": [("Antal steg", "Steg"), "Höjd", "Mått", "Färg",
                 ("Maxlast", "Max last")],
    "03715963": [("Antal steg", "Steg"), "Höjd", "Mått", "Färg", "Vikt"],
    "c38f929e": [("Antal steg", "Steg"), "Höjd", "Mått", "Färg", "Vikt"],
    "96d2803c": [("Antal steg", "Steg"), ("Mått som trappa", "Som trappa"),
                 ("Mått utfälld", "Utfälld"), "Färg", "Vikt"],
    "11436227": [("Antal steg", "Steg"), ("Mått som trappa", "Som trappa"),
                 ("Mått utfälld", "Utfälld"), "Färg", "Vikt"],
    "71e8e879": [("Antal steg", "Steg"), "Höjd",
                 ("Höjd utan översta steget", "Utan översta"), "Mått",
                 ("Maxlast", "Max last")],
}

# Bild 1 per produkt — HÄRLEDD ur `bilder.GALLERI`, aldrig avskriven.
FILER = {pid: B.GALLERI[pid][0] for pid in KORT}

if __name__ == "__main__":
    KR.kor(HAR, T, KORT, RADER, FILER, forbjudet=GR.FORBJUDET)
