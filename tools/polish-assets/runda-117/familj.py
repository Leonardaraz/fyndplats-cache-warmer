# -*- coding: utf-8 -*-
"""Runda 117 Steg 1 — köksvagnsfamiljen: 19 utkast, 10 PUBLICERADE.

Familjen ringades in på BÅDA språken (uppgift #421):
`küchenwagen|servierwagen|kücheninsel|mehrzweckwagen|rollwagen` OCH
`köksvagn|serveringsvagn|rullvagn|barvagn|köksö|rullbord`.

☠️ GRINDEN JÄMFÖR HELA BILDUPPSÄTTNINGAR, inte huvudbild mot huvudbild.
   Det är runda 116:s lärdom (uppgift #427): en hjälte-mot-hjälte-mätning gav
   6,18 på ett par som över hela uppsättningen ligger på 0,00, eftersom de två
   sidorna delar en byte-identisk bild — men inte på plats 1.

☠️ GRÅSKALA MÄTER LJUSHET, INTE FORM — OCH DET FÄLLDE FÖRSTA SJÄLVTESTET.
   Ett första utkast av den här filen använde färgsyskon som POSITIV kontroll:
   "två varianter av samma möbel måste ligga nära varandra". Uppmätt:

       främlingar (6cf7cfcf ~ 4ab392f7)      18,37
       färgsyskon (4ab392f7 ~ 0af14e23)      68,32   ← VIT mot SVART

   Färgsyskonen ligger alltså nästan FYRA GÅNGER längre isär än två helt olika
   köksvagnar. Det är inte brus och inte ett fel i mätningen — det är vad måttet
   ÄR. En vit och en svart möbel skiljer sig maximalt i ljushet även när de är
   exakt samma konstruktion, medan två olika möbler i samma ljusa träton ligger
   nära. Runda 116 såg det aldrig, för hundvagnarnas syskon var samma render
   omfärgad i detaljer; här är hela ytan färgen.

   ☠️ GRINDEN FÅR DÄRFÖR BARA PÅSTÅ EN SAK: att två sidor delar en BILDFIL.
   Den kan aldrig svara "samma produkt" eller "olika produkt" — ett högt tal
   betyder ingenting alls. Den positiva kontrollen är numera att en produkt mot
   SIG SJÄLV ger 0,00, vilket är precis det påstående TROSKEL vilar på.
   Formfrågan avgörs av ögat och av måtten, aldrig av det här talet.

☠️ MISSTANKEN SOM UTLÖSTE DEN HÄR MÄTNINGEN kom ur TEXTEN, inte ur bilderna:
   utkastet `6cf7cfcf` anger 67 × 37 cm, tre lådor, avtagbar bricka och två
   öppna hyllplan — och den publicerade `cc1eb1d9` heter ordagrant "Köksvagn
   med 3 lådor och avtagbar bricka – vit med träskiva 67x37x85,5 cm".
   Måtten och funktionerna är desamma. Pixlarna får avgöra.

⚠️ HÖJDEN MOTSÄGER SIG SJÄLV I LEVERANTÖRENS EGEN TEXT: det tyska blocket
   säger 87H cm, det svenska spec-blocket i samma beskrivning säger 84H cm.
   Ingen av dem får skrivas som fakta utan att bilden eller en andra källa
   stödjer den. Se STEG2-5.md.
"""
import itertools
import json
import os

import numpy as np
from PIL import Image

HAR = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HAR, "rawbilder")

TROSKEL = 1.0    # under detta: samma bildfil — ett påstående om BYTES
OGONTAK = 8      # så många närmaste par går ALLTID till ögat

UTKAST = ["63235957", "37fb1ce1", "4d044b44", "41d31478",
          "e16c1515", "d4db4bbc", "6cf7cfcf", "4ab392f7", "0af14e23"]
PUBLICERADE = ["cc1eb1d9"]

_cache = {}


def gra(sti):
    if sti not in _cache:
        with Image.open(sti) as im:
            _cache[sti] = np.asarray(
                im.convert("L").resize((320, 320), Image.LANCZOS), dtype=np.float32)
    return _cache[sti]


def bilder(pid):
    return sorted(os.path.join(RAW, f)
                  for f in os.listdir(RAW) if f.startswith(pid + "-"))


def avstand(a, b):
    """Lägsta skillnad mellan NÅGON bild på a och NÅGON bild på b."""
    return min(float(np.abs(gra(x) - gra(y)).mean())
               for x in bilder(a) for y in bilder(b))


def kontroll():
    """Grinden bevisar sig själv innan den bedömer något.

    NEGATIV: två utkast ur olika modellgrupper ska ligga TYDLIGT isär.
    POSITIV: en produkt mot SIG SJÄLV ska ge exakt 0,00 — det är hela det
             påstående TROSKEL vilar på, och det enda måttet kan bära.
             (Ett tidigare utkast använde färgsyskon här och föll; se
             modulens huvudkommentar.)
    """
    fel = []
    neg = avstand("6cf7cfcf", "4ab392f7")
    if neg < 5.0:
        fel.append(f"negativ kontroll för nära: {neg:.2f}")
    pos = avstand("4ab392f7", "4ab392f7")
    if pos != 0.0:
        fel.append(f"identisk bild gav {pos:.4f}, inte 0 — måttet bottnar inte")
    return fel, neg, pos


def main():
    fel, neg, pos = kontroll()
    print(f"kontroll  främlingar {neg:.2f}   samma bild {pos:.2f}")
    for f in fel:
        print("  ☠️ SJÄLVTESTET FALLER:", f)
    if fel:
        raise SystemExit(1)

    par = []
    for u in UTKAST:
        for p in PUBLICERADE:
            par.append((avstand(u, p), u, p, "mot PUBLICERAD"))
    for a, b in itertools.combinations(UTKAST, 2):
        par.append((avstand(a, b), a, b, "utkast mot utkast"))
    par.sort()

    print(f"\n{len(par)} par mätta. De {OGONTAK} närmaste går till ögat "
          f"oavsett avstånd:\n")
    for d, a, b, sort in par[:OGONTAK]:
        flagga = " ☠️ SAMMA BILDFIL" if d < TROSKEL else ""
        print(f"  {d:6.2f}  {a} ~ {b}  ({sort}){flagga}")

    nara = [x for x in par if x[0] < TROSKEL]
    print(f"\n{len(nara)} par under tröskeln {TROSKEL}")
    for d, a, b, sort in nara:
        print(f"  ☠️ {d:.2f}  {a} ~ {b}  ({sort})")


if __name__ == "__main__":
    main()
