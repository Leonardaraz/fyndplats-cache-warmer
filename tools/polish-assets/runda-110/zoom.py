#!/usr/bin/env python3
"""Steg 4, färg- och materialgrinden: 2×-zoom på varje FÄRGAD DEL.

☠️ Runbookens regel efter runda 89/90/91: en färg om en DEL av varan (ram,
väv, beslag, fot) skrivs ALDRIG ur kontaktarket — bara ur en beskärning i
minst 2× förstoring av just den delen. Tre rundor i rad skrev fel färg om en
detalj som var tjugo pixlar bred i miniatyren.

Delarna i en vikskärm är fyra: RAMEN, VÄVEN, BESLAGEN och FÖTTERNA. Var och
en får sin egen uppmätta lista innan texten skrivs.
"""
from PIL import Image, ImageDraw

# (fil, mittpunkt x, mittpunkt y, sida, etikett)
SNITT = [
    ("a999f2b1-5", 550, 520, 420, "a999f2b1 VÄV+skruv"),
    ("a999f2b1-4", 550, 620, 460, "a999f2b1 RAM+beslag"),
    ("c35f9d4f-1", 480, 520, 420, "c35f9d4f VÄV"),
    ("c35f9d4f-1", 550, 880, 420, "c35f9d4f FOT"),
    ("d72bde5e-5", 620, 550, 420, "d72bde5e VÄV"),
    ("d72bde5e-4", 520, 500, 460, "d72bde5e RAM"),
    ("316f9945-4", 700, 550, 420, "316f9945 VÄV"),
    ("316f9945-5", 600, 480, 460, "316f9945 RAM+beslag"),
    ("f8fd1b62-4", 550, 550, 420, "f8fd1b62 VÄV"),
    ("f8fd1b62-5", 550, 550, 460, "f8fd1b62 RAM+fot"),
    ("309076e2-4", 550, 550, 420, "309076e2 VÄV"),
    ("309076e2-5", 550, 550, 460, "309076e2 RAM+fot"),
]

RUTA = 620          # utskriven storlek → minst 1,3–1,5× av snittet, ofta 2×+
KOL = 3

bitar = []
for namn, cx, cy, sida, etikett in SNITT:
    im = Image.open(f"rawbilder/{namn}.jpg").convert("RGB")
    h = sida // 2
    x0, y0 = max(0, cx - h), max(0, cy - h)
    x1, y1 = min(im.width, cx + h), min(im.height, cy + h)
    bit = im.crop((x0, y0, x1, y1)).resize((RUTA, RUTA), Image.LANCZOS)
    bitar.append((f"{etikett}  ({RUTA/(x1-x0):.1f}x)", bit))

rader = (len(bitar) + KOL - 1) // KOL
ark = Image.new("RGB", (RUTA * KOL, (RUTA + 20) * rader), "white")
rita = ImageDraw.Draw(ark)
for i, (etikett, bit) in enumerate(bitar):
    x, y = (i % KOL) * RUTA, (i // KOL) * (RUTA + 20)
    rita.text((x + 4, y + 5), etikett, fill="black")
    ark.paste(bit, (x, y + 20))
ark.save("zoom.jpg", quality=90)
print(f"{len(bitar)} snitt -> zoom.jpg  {ark.size[0]}x{ark.size[1]}")
