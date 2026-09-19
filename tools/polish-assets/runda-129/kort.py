# -*- coding: utf-8 -*-
"""Runda 129 Steg 11 — nio Fyndplats-kort.

☠️ RUBRIKEN BESKRIVER FOTOT, INTE SPEC-TABELLEN. Runda 128 fick skriva om
   SJU av sextiofem rubriker på kontaktarket, alla med samma fel: rubriken tog
   ett tal ur specen medan fotot visade något annat — "18,5 cm hopfälld" på en
   vagn fotad UTFÄLLD, "fem fack i tre plan" på en låda fotad STÄNGD.
   Talen hör hemma i RADERNA; rubriken säger det läsaren ser i samma ögonkast.

   Rubrikerna nedan är skrivna mot bild 1 på varje kontaktark:
     14aa1777  två lampor sida vid sida på vit botten
     1f14ab66  en lampa med fyrkantig planteringslåda som fot
     c9ab8531  två KLOTformade kupor på böjda armar
     4ef7c2b4  tre LYKTOR på böjda armar över en låda
     ec8ab782  tre KLARA GLASKUPOR under platta tak, över en låda
     db933c3c  tre lyktor på slät mast med UTSVÄNGD trumpetfot — ingen låda
     a6727ca5  EN lykta med RUNDAD, bullig kupa
     9938574b  två lyktor med spira i toppen
     6747b6c0  en KANTIG lykta med raka fasetter

☠️ INGA TVÅ KORT FÅR BLI IDENTISKA, och ingen kicker får delas. `kontroll()`
   fäller FÖRE bygget — ett kort som är fel har redan laddats upp när bygget
   är klart.
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
    "14aa1777": ("2-pack – 180 cm", "Två stolpar i paketet"),
    "1f14ab66": ("Med kruka – 195 cm", "Lyktan står i en blomlåda"),
    "c9ab8531": ("Två klot – 182 cm", "Två klot på böjda armar"),
    "4ef7c2b4": ("Tre lyktor – 185 cm", "Tre lyktor över blomlådan"),
    "ec8ab782": ("Tre kupor – 189 cm", "Tre glaskupor över blomlådan"),
    "db933c3c": ("Dimbar – 182,5 cm", "Tre lyktor på utsvängd fot"),
    "a6727ca5": ("Sex lysdioder – 177 cm", "Rundad lykta på smal mast"),
    "9938574b": ("2-pack – 129 cm", "Två lyktor med spira"),
    "6747b6c0": ("Rostfritt – 160 cm", "Kantig lykta på slank mast"),
}

# Fem rader per kort, hämtade UR spec-tabellen — aldrig omskrivna. En post är
# `"Etikett"` eller `("spec-etikett", "kortets kortare etikett")`.
RADER = {
    "14aa1777": ["Mått", "Antal", "Ljusstyrka", "Lystid", "Kapslingsklass"],
    "1f14ab66": ["Mått", "Ljusstyrka", "Laddtid", "Lystid", "Kapslingsklass"],
    "c9ab8531": ["Mått", "Lamphuvuden", "Ljusstyrka", "Lystid", "Kapslingsklass"],
    "4ef7c2b4": ["Mått", "Lamphuvuden", "Ljusstyrka", "Färgtemperatur", "Lystid"],
    "ec8ab782": ["Mått", "Lamphuvuden", "Lägen", "Lystid", "Kapslingsklass"],
    "db933c3c": ["Mått", "Lamphuvuden", "Ljusstyrka", "Dimning", "Lystid"],
    "a6727ca5": ["Mått", "Lysdioder", "Färgtemperatur", "Sparläge", "Lystid"],
    "9938574b": ["Mått", "Antal", "Färgtemperatur", "Lystid", "Kapslingsklass"],
    "6747b6c0": ["Mått", "Solceller", "Ljusstyrka", "Uppställning", "Lystid"],
}

# Bild 1 per produkt — samma fil som ligger först i `bilder.txt`.
FILER = {
    "14aa1777": "b379ce_731bc2446dab485e8d2ae1e54c7485ea~mv2.jpg",
    "1f14ab66": "b379ce_8b463b3d7546421fa28226f9f3128a50~mv2.jpg",
    "c9ab8531": "b379ce_e30f6073cfa34f588015061fd0eea99b~mv2.jpg",
    "4ef7c2b4": "b379ce_59d44811dc9344b997f15ee1b2057f39~mv2.jpg",
    "ec8ab782": "b379ce_f69953e90cbb468484472d03fca7a343~mv2.jpg",
    "db933c3c": "b379ce_0c504b31bbce4aa39aaec44db0d9d3e7~mv2.jpg",
    "a6727ca5": "b379ce_168815ccd7154dfea8ab618ef0ad7b22~mv2.jpg",
    "9938574b": "b379ce_1a838d74838f41cdb266d7cd96c746bf~mv2.jpg",
    "6747b6c0": "b379ce_1fcc56f67ca146c2be7526685603d6ab~mv2.jpg",
}

if __name__ == "__main__":
    KR.kor(HAR, T, KORT, RADER, FILER, forbjudet=GR.FORBJUDET)
