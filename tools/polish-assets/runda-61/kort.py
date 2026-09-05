# -*- coding: utf-8 -*-
"""Runda 61 — spec-kort till alla sju, plus ett extra foto-kort till de två
vars övriga bilder alla bär utländsk text inbränd (f523b18d och 83d2db1a).
Utan det extra kortet hade de sidorna stått med tre bilder mot syskonens sex.

☠️ fit=True (contain) för produktfoton: fit_pane/cover beskär en kvadratisk
källa till panelens proportion och tar bort 45 % av höjden.
☠️ Varje kortVÄRDE citerar spec-tabellen ordagrant. Runda 60: ett kort som
skrev '3 min 15 s' där tabellen sa '3 minuter 15 sekunder' blev en andra
sanning som ingen grind jämför framåt."""
import sys, os
sys.path.insert(0, "/home/user/fyndplats-cache-warmer/scripts")
import cardkit as ck

IMG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "img")
def bild(n): return os.path.abspath(os.path.join(IMG, n))

SPEC = [
 ("f523b18d", "01_f523b18d.jpg", "Frukostset i grått", "Fyra skivor i taget", [
   ("Kokarens volym", "1,7 liter"), ("Rostfack", "fyra"), ("Rostlägen", "sju"),
   ("Brödrostens effekt", "1560–1860 W"), ("Tillsammans", "4060 W")]),
 ("83d2db1a", "06_83d2db1a.jpg", "Frukostset i gräddvitt", "Med termometer på sidan", [
   ("Kokarens volym", "1,7 liter"), ("Kokarens effekt", "1850–2200 W"),
   ("Rostlägen", "sju"), ("Brödrostens effekt", "780–930 W"),
   ("Tillsammans", "3130 W")]),
 ("e7f69e8a", "11_e7f69e8a.jpg", "Frukostset med termometer", "Svart med krom", [
   ("Kokarens volym", "1,7 liter"), ("Kokarens effekt", "1850–2200 W"),
   ("Rostlägen", "sju"), ("Vikt", "2,98 kg tillsammans"),
   ("Tillsammans", "3130 W")]),
 ("375bb3c8", "16_375bb3c8.jpg", "Frukostset med LED-display", "Välj temperatur", [
   ("Temperaturval", "40–100 °C"), ("Varmhållning", "upp till 3 timmar"),
   ("Kokarens volym", "1,7 liter"), ("Rostlägen", "sex"),
   ("Tillsammans", "3100 W")]),
 ("7805b8bc", "21_7805b8bc.jpg", "Frukostset med varmhållning", "Minns inställningen", [
   ("Varmhållning", "upp till 3 timmar"), ("Minnesfunktion", "300 sekunder"),
   ("Kokarens volym", "1,7 liter"), ("Rostlägen", "sex"),
   ("Tillsammans", "3100 W")]),
 ("2f2c1c88", "26_2f2c1c88.jpg", "Frukostset i rostfritt", "Fyra fack, två reglage", [
   ("Rostfack", "fyra"), ("Rostlägen", "sju per fackpar"),
   ("Kokarens volym", "1,7 liter"), ("Vikt", "4,4 kg tillsammans"),
   ("Tillsammans", "4060 W")]),
 ("0ab3483a", "31_0ab3483a.jpg", "Rosa frukostset", "Bikakemönster i reliefen", [
   ("Kokarens volym", "1,7 liter"), ("Kokarens effekt", "1850–2200 W"),
   ("Rostlägen", "sju"), ("Brödrostens effekt", "780–930 W"),
   ("Tillsammans", "3130 W")]),
]

# ☠️ De två vars övriga bilder alla bär utländsk text får ett kort till.
FOTO = [
 ("f523b18d", "02_f523b18d.jpg", "Frukostset i grått", "Fyra fack i två rader",
  "Fyra separata fack betyder att ingen behöver vänta på nästa omgång."),
 ("83d2db1a", "07_83d2db1a.jpg", "Frukostset i gräddvitt", "Breda fack",
  "Facken är 3,5 cm breda och centrerar skivan av sig själva."),
]

namn = []
for n, foto, kicker, rubrik, rader in SPEC:
    ck.card_spec(n + "_spec", bild(foto), kicker, rubrik, rader, fit=True)
    namn.append(n + "_spec")
for n, foto, kicker, rubrik, bildtext in FOTO:
    ck.card_photo(n + "_foto", bild(foto), kicker, rubrik, bildtext, fit=True)
    namn.append(n + "_foto")

ck.render(namn)
print("renderade:", len(namn))
