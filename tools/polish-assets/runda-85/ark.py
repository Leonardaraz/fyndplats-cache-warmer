# -*- coding: utf-8 -*-
"""Runda 85, Steg 4 — kontaktark över alla bilder, en rad per produkt.

⚠️ Rundan har TRE olika stommaterial bland sex syskon (410 rostfritt ×4,
   pulverlackerad plåt ×1, ABS ×1). Bilden är den oberoende källan: en
   pulverlackerad vit yta och en borstad stålyta ser inte likadana ut, och
   det är exakt den skillnaden brödtexten påstår.
"""
import os, sys, subprocess
from PIL import Image

HAR = os.path.dirname(os.path.abspath(__file__))
VILL = ["17fb1869","b10b80ee","10c47f8e",
        "213be879","a00882ed","ec672f4d"]
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

ark("kontaktark-b1.jpg", VILL[:3])
ark("kontaktark-b2.jpg", VILL[3:])
