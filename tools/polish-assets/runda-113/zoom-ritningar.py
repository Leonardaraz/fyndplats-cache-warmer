# -*- coding: utf-8 -*-
"""De tre vinkylarnas bild 3 bär TYSK RUBRIK men också de enda måttpilarna.

Frågan Steg 4 ska svara på är om måttdelen går att beskära fri från texten —
samma sak som runda 112 gjorde med sin packlista. Går det inte ska bilden bort
och måtten bäras av vårt eget kort i stället.
"""
import io, urllib.request
from PIL import Image, ImageDraw

BAS = "https://static.wixstatic.com/media/%s/v1/fill/w_1200,h_1200,al_c,q_92/f.jpg"
FALL = [("47a91a17", "b379ce_dbb3d6421eec4e019458bffea697290f~mv2.jpg"),
        ("15d30e23", "b379ce_a459fb6bf6714c0a9a29917a0d3b6b3b~mv2.jpg"),
        ("fdbfcea0", "b379ce_75c96b552dc248ed8f0b16d4d0d3a9fe~mv2.jpg")]
B = 660
ark = Image.new("RGB", (B * 3, B + 26), "white")
rit = ImageDraw.Draw(ark)
for i, (k, fil) in enumerate(FALL):
    req = urllib.request.Request(BAS % fil, headers={"User-Agent": "Mozilla/5.0"})
    b = Image.open(io.BytesIO(urllib.request.urlopen(req, timeout=90).read())).convert("RGB")
    ark.paste(b.resize((B, B)), (i * B, 26))
    rit.text((i * B + 8, 8), k + "  bild 3", fill="black")
    # rutnät var tiondel, så en beskärning kan anges i procent
    for f in range(1, 10):
        p = i * B + int(B * f / 10)
        rit.line([(p, 26), (p, 26 + B)], fill=(255, 0, 0), width=1)
        rit.line([(i * B, 26 + int(B * f / 10)), (i * B + B, 26 + int(B * f / 10))],
                 fill=(0, 160, 255), width=1)
ark.save("zoom-ritningar.jpg", quality=92)
print("zoom-ritningar.jpg", ark.size)
