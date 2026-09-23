# -*- coding: utf-8 -*-
"""Zoom på dörrmitten: bär 161 W-frysarna ett NYCKELLÅS?

Låset står inte i den tyska texten med ett ord. Det syns bara i bilden, och
bilden är ett giltigt underlag — men bara om man faktiskt tittar. En "silvrig
detalj mitt på dörren" kan lika gärna vara ett handtag.
"""
import io, urllib.request
from PIL import Image, ImageDraw

BAS = "https://static.wixstatic.com/media/%s/v1/fill/w_1200,h_1200,al_c,q_90/f.jpg"
RADER = [
    ("8cfe5171 vit 161 W", "b379ce_16f9c2ffe18c431b893c1059567ed0e5~mv2.jpg", (0.32, 0.55, 0.68, 0.85)),
    ("a33ece7a gra 161 W", "b379ce_7b8b67da9138416dab17206945d4a580~mv2.jpg", (0.32, 0.55, 0.68, 0.85)),
    ("b2c76518 svart 45 W", "b379ce_388edd9604864bcba20715861e9238f9~mv2.jpg", (0.32, 0.20, 0.68, 0.50)),
    ("d4e79563 PUBLICERAD", "b379ce_ee87e66c613a4826b9d06ccf6f5dcea9~mv2.jpg", (0.32, 0.10, 0.68, 0.40)),
]
B = 560
ark = Image.new("RGB", (B * len(RADER), B + 26), "white")
rit = ImageDraw.Draw(ark)
for i, (namn, fil, (x0, y0, x1, y1)) in enumerate(RADER):
    req = urllib.request.Request(BAS % fil, headers={"User-Agent": "Mozilla/5.0"})
    b = Image.open(io.BytesIO(urllib.request.urlopen(req, timeout=90).read())).convert("RGB")
    w, h = b.size
    ark.paste(b.crop((int(x0 * w), int(y0 * h), int(x1 * w), int(y1 * h))).resize((B, B)), (i * B, 26))
    rit.text((i * B + 8, 8), namn, fill="black")
ark.save("zoom-las.jpg", quality=92)
print("zoom-las.jpg", ark.size)
