# -*- coding: utf-8 -*-
"""Runda 83, Steg 4 — kontaktark över alla bilder, en rad per produkt.

⚠️ Steg 4 ligger FÖRE Steg 5 med flit: leverantörens spec-flik anger FEL
   MATERIAL på fyra av rundans åtta produkter, och bilden är den enda oberoende källan.
"""
import os, sys, subprocess
from PIL import Image

HAR = os.path.dirname(os.path.abspath(__file__))
VILL = ["a353ea02","5078bedf","a9555a7d","754a4749",
        "251f0429","ed7a86fd","2cfd373a","d7eca2ba"]
KOL, RUTA, RUB = 5, 300, 18

def ark(namn, rader):
    W = KOL * RUTA
    H = len(rader) * (RUTA + RUB)
    duk = Image.new("RGB", (W, H), "white")
    from PIL import ImageDraw
    d = ImageDraw.Draw(duk)
    for r, k in enumerate(rader):
        y = r * (RUTA + RUB)
        d.text((4, y + 3), k, fill="black")
        for c in range(KOL):
            f = os.path.join(HAR, "rawbilder", "%s-%d.jpg" % (k, c + 1))
            if not os.path.exists(f):
                continue
            im = Image.open(f).convert("RGB")
            im.thumbnail((RUTA, RUTA))
            duk.paste(im, (c * RUTA + (RUTA - im.width) // 2,
                           y + RUB + (RUTA - im.height) // 2))
    duk.save(os.path.join(HAR, namn), quality=88)
    print(namn, duk.size)

ark("ark-b1.jpg", VILL[:4])
ark("ark-b2.jpg", VILL[4:])
