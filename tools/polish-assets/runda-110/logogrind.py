#!/usr/bin/env python3
"""Steg 4, logotypgrinden: klipp ut den ÖVRE remsan ur varje bild och lägg dem
sida vid sida.

☠️ Runda 64 mätte upp `HOMCOM by Aosom` INBRÄNT uppe till vänster på ett
Aosom-utkast. En grep över källkoden svarar grönt medan kundens öga läser
leverantörens namn. Det är en BILDMÄTNING, inte en textmätning — och den
enda vägen att göra den mekanisk är att titta på alla trettio hörnen samtidigt.

Remsan är HELA bredden, inte bara vänsterhörnet: en logotyp uppe till HÖGER
läcker exakt lika mycket, och att bara titta där förra fyndet låg är att leta
under lyktstolpen.
"""
from PIL import Image, ImageDraw
import glob, os

ANDEL = 0.20        # övre femtedelen
BREDD = 880
KOLUMNER = 2

filer = sorted(glob.glob("rawbilder/*.jpg"))
remsor = []
for f in filer:
    im = Image.open(f).convert("RGB")
    b, h = im.size
    remsa = im.crop((0, 0, b, int(h * ANDEL)))
    ny_h = int(remsa.height * BREDD / remsa.width)
    remsor.append((os.path.basename(f)[:-4], remsa.resize((BREDD, ny_h), Image.LANCZOS)))

rad_h = remsor[0][1].height + 18
rader = (len(remsor) + KOLUMNER - 1) // KOLUMNER
ark = Image.new("RGB", (BREDD * KOLUMNER, rad_h * rader), "white")
rita = ImageDraw.Draw(ark)
for i, (namn, remsa) in enumerate(remsor):
    x = (i % KOLUMNER) * BREDD
    y = (i // KOLUMNER) * rad_h
    rita.text((x + 4, y + 4), namn, fill="black")
    ark.paste(remsa, (x, y + 18))

ark.save("logogrind.jpg", quality=88)
print(f"{len(remsor)} remsor -> logogrind.jpg  {ark.size[0]}x{ark.size[1]}")
