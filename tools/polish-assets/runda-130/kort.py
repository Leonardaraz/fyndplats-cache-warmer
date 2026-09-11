# -*- coding: utf-8 -*-
"""Runda 130 Steg 9 — sex Fyndplats-kort.

☠️ RUBRIKEN BESKRIVER FOTOT, INTE SPEC-TABELLEN. Rubrikerna nedan är skrivna
   mot bild 1 på kontaktarken:
     65e3c24f  TRE flätade skärmar på tre höjder + rund hylla, svart stativ
     4e23a904  EN skärm hängande i änden av en BÅGE, kvadratisk fot
     66a26135  låg PELARE av VRIDEN flätning kring en vit innerskärm
     5ffb91a2  trumformad skärm av STÅENDE SPJÄLOR på smalt stativ
     ef0c374b  TVÅ korgformade lyktor i olika storlek, svarta lock
     a8cf27cd  AVSMALNANDE brun lykta av lindad lina, bred fot

☠️ KORTEN ERSÄTTER LEVERANTÖRENS TYSKA PANELER. Fyra bilder i rundan bär tysk
   text, och två av dem påstår dessutom `widersteht ALLEN
   Witterungseinflüssen` — motsatsen till IP44. De plockas bort; det kunden
   behövde veta står i stället på kortet och i spec-tabellen.
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
    "65e3c24f": ("Tre skärmar – 144 cm", "Tre skärmar och en rund hylla"),
    "4e23a904": ("Bågform – 178 cm", "En skärm hängande i en båge"),
    "66a26135": ("Pelare – 77 cm", "Vriden flätning kring vit skärm"),
    "5ffb91a2": ("Skuggmönster – 130 cm", "Skärm av stående spjälor"),
    "ef0c374b": ("2-pack – 45 och 35 cm", "Två lyktor i olika storlek"),
    "a8cf27cd": ("Brun lykta – 61 cm", "Avsmalnande, lindad lina"),
}

# Fem rader per kort, hämtade UR spec-tabellen — aldrig omskrivna. En post är
# `"Etikett"` eller `("spec-etikett", "kortets kortare etikett")`.
RADER = {
    "65e3c24f": ["Mått", "Skärmar", "Hylla", "Ljusstyrka", "Lystid"],
    "4e23a904": ["Mått", "Fot", "Ljusstyrka", "Lystid", "Kapslingsklass"],
    "66a26135": ["Mått", "Lysdioder", "Ljusstyrka", "Lystid", "Montering"],
    "5ffb91a2": ["Mått", "Ljusstyrka", "Lystid", "Livslängd", "Kapslingsklass"],
    "ef0c374b": [("Mått, större lyktan", "Större lyktan"),
                 ("Mått, mindre lyktan", "Mindre lyktan"),
                 "Lysdioder", "Färgtemperatur", "Lystid"],
    "a8cf27cd": ["Mått", "Effekt", "Laddtid", "Lystid", "Ljusfärg"],
}

# Bild 1 per produkt — samma fil som ligger först i `bilder.txt`.
FILER = {
    "65e3c24f": "b379ce_e94799d4dcb640e0ae9cf33587acc837~mv2.jpg",
    "4e23a904": "b379ce_47e2c2b09da045eab49810f7aa8691b5~mv2.jpg",
    "66a26135": "b379ce_f5b71a6c24cb4615afc6f3be0f471360~mv2.jpg",
    "5ffb91a2": "b379ce_fb77112b444f4868a49b1a48dc29fd85~mv2.jpg",
    "ef0c374b": "b379ce_2b3fc3c74e5942db84a5219c49e7c6d2~mv2.jpg",
    "a8cf27cd": "b379ce_5933ac7edaf04c609c3bd74a53692301~mv2.jpg",
}

if __name__ == "__main__":
    # ⚠️ ef0c374b:s foto är en KORGFLÄTNING — hundratals små hål som kostar
    #    mer i JPEG än något annat motiv i rundan. 253 kB vid q=85, taket är
    #    215. Runbokens regel: komprimera ALDRIG kortet vidare under q=80 —
    #    mjuka i stället upp FOTOT, aldrig texten.
    KR.kor(HAR, T, KORT, RADER, FILER, forbjudet=GR.FORBJUDET,
           mjuka={"ef0c374b": 1.6})
