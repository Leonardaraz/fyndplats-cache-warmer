#!/usr/bin/env python3
"""Steg 9-underlag: MILJÖBILDERNA i läsbar storlek.

☠️ Runda 109:s dyraste fel: alt-texten "ett bord med en ljus pläd över kanten"
skrevs om ett rumsfoto där tyget i själva verket är en BORDSDUK och skärmen
orörd. Felet syntes först när bilden lästes i FULL STORLEK; i kontaktarkets
miniatyr såg tyget ut att ligga över kanten.

Regeln: kontaktarket säger vilken TYP av bild det är, inte vad som finns i
den. Varje alt-text om ett rumsfoto skrivs ur det här arket.
"""
from PIL import Image, ImageDraw

MILJO = ["a999f2b1-2", "c35f9d4f-2", "c35f9d4f-4", "c35f9d4f-5",
         "d72bde5e-2", "316f9945-2", "f8fd1b62-2", "309076e2-2"]
RUTA, KOL = 640, 4

rader = (len(MILJO) + KOL - 1) // KOL
ark = Image.new("RGB", (RUTA * KOL, (RUTA + 20) * rader), "white")
rita = ImageDraw.Draw(ark)
for i, namn in enumerate(MILJO):
    im = Image.open(f"rawbilder/{namn}.jpg").convert("RGB").resize((RUTA, RUTA), Image.LANCZOS)
    x, y = (i % KOL) * RUTA, (i // KOL) * (RUTA + 20)
    rita.text((x + 4, y + 5), namn, fill="black")
    ark.paste(im, (x, y + 20))
ark.save("miljoark.jpg", quality=92)
print("miljoark.jpg", ark.size)
