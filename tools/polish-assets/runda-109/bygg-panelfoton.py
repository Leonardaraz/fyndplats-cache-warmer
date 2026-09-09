# -*- coding: utf-8 -*-
"""Runda 109 — förbehandlar de två nya färgernas hjältebilder till 1,83.

Samma metod som runda 108, som mätte fram den: rita vid varans GEOMETRISKA
maxstorlek och klara byte-taket med OSKÄRPA, inte med krympning. Radien mäts
per kort med `sok-oskarpa.py` — den ärvs INTE från syskonet, för det är vävens
mönster som kostar byte och svart väv mot ljust trä har annan struktur än vit
väv mot ljust trä.

Skärmarna går från nästan kvadratiska (4 paneler, 0,68 efter beskärning) till
bredare än panelen (8 paneler, 1,44). ☠️ Runda 93:s regel gäller: fyll ut med
vitt i sidled, kapa ALDRIG varan — bågen på ovankanten är produktens signatur
och det första en beskärning hade tagit.

Varje kort ritas därför vid sin GEOMETRISKA MAXSTORLEK (`FYLL = 1.0`, höjden
styr), och byte-taket klaras med oskärpa i stället för med krympning.

☠️ TRE MÄTNINGAR, OCH DEN SOM VANN VAR DEN HUSET HADE AVSKRIVIT.
   Vävens mönster är det som kostar byte, inte varans storlek.

   | knapp | bäst utfall på värsta kortet (64c0809d, 397 197 byte) |
   |---|---|
   | krympa varan (`sok-fyllnad.py`)   | 213 440 vid 42 % av 79 % möjliga |
   | nedsampla fotot (`sok-mjukhet.py`)| 269 710 vid 4× — **räckte inte** |
   | **oskärpa (`sok-oskarpa.py`)**    | **197 470 vid r=3 och FULL storlek** |

   ⚠️ Runbookens rad "oskärpa är fel medicin på nät — runda 104 mätte r=1,3 till
   ~9 %" är sann om RADIEN och falsk om METODEN. Uppmätt här: r=1 ger 14–23 %,
   r=2 ger 27–41 %, r=3 ger 43–50 %. Kurvan är brant just förbi r=1, alltså
   precis efter där runda 104 slutade mäta.

⚠️ Och en fälla värd att inte gå i igen: när varan är HÖGRE än panelen biter
   fyllnaden inte alls. `957b042d` gav byte för byte identiskt utfall vid 0,85
   och 0,60 — höjden styrde båda. `sok-fyllnad.py`:s tal ser ut som en skala
   och är det inte.
"""
import os
from PIL import Image, ImageFilter

RATIO = 1.83
# ☠️ MÄTT med `sok-fyllnad.py`, inte gissat: den största fyllnad som ryms under
#    215 kB vid q >= 85. Vid 0,90 sprängde ALLA SJU taket, med +9 000 till
#    +113 000 byte. Nät i studioljus komprimeras inte.
# ⚠️ Modell S (525e6acf/079f2901) är HÖGRE än panelen, så fyllnaden biter först
#    under 0,80 — talen 0,90 och 0,80 gav identisk filstorlek.
FYLL = 1.0          # alla kort ritas vid varans maxstorlek
FYLL_UNDANTAG = {}
# ☠️ MÄTT med `sok-oskarpa.py` vid maxfyllnad, inte gissat. Den minsta radie
#    som håller kortet under 215 kB vid q >= 85. Noll = behövs inte.
# ☠️ MÄTT med `sok-oskarpa.py` vid maxfyllnad, inte ärvt från runda 108.
#    Utfallet vid varans maxstorlek:
#      r=0  ffb5239f 238 078   7bd4f691 275 070   — båda över taket
#      r=1  ffb5239f 215 924   7bd4f691 230 138   — vita missar med 924 byte
#      r=2  ffb5239f 186 107   7bd4f691 192 061   — båda under
#    Att vita ligger 924 byte över vid r=1 är just varför radien mäts och inte
#    avrundas: "nästan" är över taket.
MJUKA = {"ffb5239f": 2.0, "7bd4f691": 2.0}
HAR = os.path.dirname(os.path.abspath(__file__))


def bbox(im, tolerans=246):
    """Produktens låda: allt som inte är nära-vit botten."""
    g = im.convert("L").point(lambda v: 0 if v > tolerans else 255)
    b = g.getbbox()
    if not b:
        raise SystemExit("hittar ingen produkt i bilden")
    return b


def panel(kort, fyll=None):
    fyll = fyll or FYLL_UNDANTAG.get(kort, FYLL)
    im = Image.open(os.path.join(HAR, "rawbilder", "%s-1.jpg" % kort)).convert("RGB")
    x0, y0, x1, y1 = bbox(im)
    vara = im.crop((x0, y0, x1, y1))
    bredd = int(vara.width / fyll)
    hojd = int(bredd / RATIO)
    if hojd < vara.height:                      # varan är högre än panelen
        hojd = vara.height + 2                  # ...då styr HÖJDEN, aldrig beskär
        bredd = int(hojd * RATIO)
    # ☠️ Oskärpan läggs på VARAN, inte på den färdiga panelen. Läggs den efter
    #    inklistringen suddas kanten mot det vita fältet till en grå gloria.
    r = MJUKA.get(kort, 0.0)
    if r:
        vara = vara.filter(ImageFilter.GaussianBlur(r))
    ut = Image.new("RGB", (bredd, hojd), "white")
    ut.paste(vara, ((bredd - vara.width) // 2, (hojd - vara.height) // 2))
    sokvag = os.path.join(HAR, "panelfoton", "%s.jpg" % kort)
    os.makedirs(os.path.dirname(sokvag), exist_ok=True)
    ut.save(sokvag, "JPEG", quality=94)
    return sokvag, ut.size, vara.width / bredd


if __name__ == "__main__":
    import sys
    sys.path.insert(0, HAR)
    import matt
    for k in matt.RUNDAN:
        s, storlek, andel = panel(k)
        print("%-10s %-12s fyllnad %.0f %%" % (k, "%d×%d" % storlek, andel * 100))
