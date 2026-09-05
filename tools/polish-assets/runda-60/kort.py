# -*- coding: utf-8 -*-
"""Runda 60 — spec-kort, plus ett extra kort till de tre produkter vars
resterande bilder alla bär tysk text inbränd (1121b59a, 106eafc5, 6edbe425).
Utan det extra kortet hade de sidorna haft tre bilder mot syskonens sex.

☠️ fit=True (contain) för produktfoton: fit_pane/cover beskär en kvadratisk
källa till panelens proportion och tar bort 45 % av höjden — runda 58 fällde
tre rubriker på just det."""
import sys, os
sys.path.insert(0, "/home/user/fyndplats-cache-warmer/scripts")
import cardkit as ck

IMG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "img")
def bild(n): return os.path.abspath(os.path.join(IMG, n))

SPEC = [
 ("4ac902ed", "01_4ac902ed.jpg", "Miniugn med varmluftsfritös", "30 liter, sex lägen", [
   ("Volym", "30 liter"), ("Effekt", "1600 W"), ("Temperatur", "90–230 °C"),
   ("Innermått", "34,5 × 31,8 × 25,6 cm"), ("Falsar", "fyra")]),
 ("0ceeb412", "06_0ceeb412.jpg", "Torkapparat", "Fem plan, 35–70 °C", [
   ("Plan", "fem"), ("Planens mått", "Ø32 × 3,5 cm"), ("Temperatur", "35–70 °C"),
   ("Effekt", "245 W"), ("Maxlast", "5 kg")]),
 ("d8c2dec6", "11_d8c2dec6.jpg", "Vattenkokare 1,7 liter", "Grå med koppardetaljer", [
   ("Volym", "1,7 liter"), ("Effekt", "2200 W"), ("En kopp", "50 sekunder"),
   ("Mått med bas", "24,2 × 19,5 × 23,4 cm"), ("Vikt", "1,3 kg")]),
 ("1121b59a", "16_1121b59a.jpg", "Frukostset i svart", "Kokare och brödrost", [
   ("Kokarens volym", "1,7 liter"), ("En kopp", "42 sekunder"),
   ("Rostlägen", "sju"), ("Brödrostens effekt", "920–1080 W"),
   ("Tillsammans", "3280 W")]),
 ("b330de9c", "21_b330de9c.jpg", "Frukostset med bikakemönster", "Svart och koppar", [
   ("Kokarens volym", "1,7 liter"), ("Kokarens effekt", "1850–2200 W"),
   ("Rostlägen", "sju"), ("Brödrostens effekt", "780–930 W"),
   ("Tillsammans", "3130 W")]),
 ("106eafc5", "26_106eafc5.jpg", "Snabbkokande frukostset", "1,7 liter på 3 min 15 s", [
   ("Kokarens volym", "1,7 liter"), ("Koktid full kanna", "3 minuter 15 sekunder"),
   ("Rostlägen", "sju"), ("Brödrostens effekt", "750–900 W"),
   ("Tillsammans", "3100 W")]),
 ("70b6bfe2", "31_70b6bfe2.jpg", "Frukostset med temperaturval", "Sex temperaturer", [
   ("Temperaturer", "55/60/80/85/90/100 °C"), ("Varmhållning", "upp till tre timmar"),
   ("Kokarens volym", "1,7 liter"), ("Rostlägen", "sex"),
   ("Tillsammans", "3130 W")]),
 ("6edbe425", "36_6edbe425.jpg", "Brödrost för fyra skivor", "Med vattenkokare 1,7 liter", [
   ("Rostfack", "fyra"), ("Rostlägen", "sju"),
   ("Brödrostens effekt", "1560–1860 W"), ("Kokarens volym", "1,7 liter"),
   ("Tillsammans", "4060 W")]),
]

# ☠️ De tre vars övriga bilder alla bär tysk text får ett kort till, så att
#    sidan inte står med tre bilder mot syskonens sex.
FOTO = [
 ("1121b59a", "17_1121b59a.jpg", "Frukostset i svart", "Två skivor åt gången",
  "Brödrosten tar två skivor, har sju rostlägen och lyfter dem högt när de är klara."),
 ("106eafc5", "27_106eafc5.jpg", "Snabbkokande frukostset", "Kokare och brödrost i par",
  "Kannan tar 1,7 liter och full kanna kokar på 3 minuter och 15 sekunder."),
 ("6edbe425", "37_6edbe425.jpg", "Fyra skivor samtidigt", "Hela bordet på en gång",
  "Fyra fack i två rader betyder att ingen behöver vänta på nästa omgång."),
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
