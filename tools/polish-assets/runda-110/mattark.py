#!/usr/bin/env python3
"""Steg 5-underlag: alla sex måttritningar på ETT uppslag, plus beslagszoom.

☠️ Måttritningen är den enda källan som kan MOTSÄGA spec-blocket, och det gör
den här: 316f9945 har `1,9 cm` i specen men bär två andra tal i ritningen.
"""
from PIL import Image, ImageDraw

IDN = ["a999f2b1", "c35f9d4f", "d72bde5e", "316f9945", "f8fd1b62", "309076e2"]
RUTA, KOL = 720, 3

ark = Image.new("RGB", (RUTA * KOL, (RUTA + 20) * 2), "white")
rita = ImageDraw.Draw(ark)
for i, nyckel in enumerate(IDN):
    im = Image.open(f"rawbilder/{nyckel}-3.jpg").convert("RGB").resize((RUTA, RUTA), Image.LANCZOS)
    x, y = (i % KOL) * RUTA, (i // KOL) * (RUTA + 20)
    rita.text((x + 4, y + 5), f"{nyckel} — måttritning (plats 3)", fill="black")
    ark.paste(im, (x, y + 20))
ark.save("mattark.jpg", quality=92)
print("mattark.jpg", ark.size)

# Beslagen: bara där ett gångjärn faktiskt syns, och i hård förstoring.
BESLAG = [
    ("c35f9d4f-1", 545, 505, 150, "c35f9d4f gångjärn"),
    ("a999f2b1-4", 553, 640, 150, "a999f2b1 gångjärn"),
    ("d72bde5e-1", 500, 420, 200, "d72bde5e gångjärn?"),
    ("f8fd1b62-1", 555, 430, 200, "f8fd1b62 gångjärn?"),
]
bitar = []
for namn, cx, cy, sida, etikett in BESLAG:
    im = Image.open(f"rawbilder/{namn}.jpg").convert("RGB")
    h = sida // 2
    bit = im.crop((cx - h, cy - h, cx + h, cy + h)).resize((620, 620), Image.LANCZOS)
    bitar.append((f"{etikett}  ({620/sida:.1f}x)", bit))

ark2 = Image.new("RGB", (620 * 4, 640), "white")
r2 = ImageDraw.Draw(ark2)
for i, (etikett, bit) in enumerate(bitar):
    r2.text((i * 620 + 4, 5), etikett, fill="black")
    ark2.paste(bit, (i * 620, 20))
ark2.save("beslag.jpg", quality=92)
print("beslag.jpg", ark2.size)
