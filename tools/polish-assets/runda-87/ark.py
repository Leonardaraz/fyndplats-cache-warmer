# -*- coding: utf-8 -*-
"""Runda 87, Steg 4 — kontaktark över alla bilder, en rad per produkt.

⚠️ Rundan har TVÅ färgsyskonpar (72051417/a165b178 och 5f6592ad/20c0942e)
   där skillnaden ENBART är dukens färg. Bilden är den enda källan som
   avgör vilken som är ljusgrå och vilken som är mörkgrå — och runda 86
   visade att tre av sju importerade färgrader var fel.

⚠️ Och två produkter delar tyskt NAMN utan att vara samma vara
   (8bdba748 245x120, 6a419d8b 300x300). Kontaktarket är det snabbaste
   sättet att se att formerna verkligen skiljer sig.
"""
import os
from PIL import Image, ImageDraw

HAR = os.path.dirname(os.path.abspath(__file__))
VILL = ["72051417", "a165b178", "5f6592ad", "20c0942e",
        "8bdba748", "0f5e3fea", "6a419d8b", "95a9d7cc"]
KOL, RUTA, RUB = 5, 300, 18


def ark(namn, rader):
    W = KOL * RUTA
    H = len(rader) * (RUTA + RUB)
    duk = Image.new("RGB", (W, H), "white")
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


ark("kontaktark-b1.jpg", VILL[:4])
ark("kontaktark-b2.jpg", VILL[4:])
