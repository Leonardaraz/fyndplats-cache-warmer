#!/usr/bin/env python3
"""hornark.py <rundakatalog> <utfil-prefix>: klipper nedre vänstra och nedre högra hörnet ur varje originalbild och lägger dem i ark (AI-vattenstämplar, logotyper)."""
import sys, glob, os
from PIL import Image, ImageDraw
rd = sys.argv[1]; pre = sys.argv[2]
fs = sorted(glob.glob(f'{rd}/orig/*.jpg') + glob.glob(f'{rd}/orig/*.png') + glob.glob(f'{rd}/orig/*.jpeg') + glob.glob(f'{rd}/orig/*.webp'))
bw, bh = 560, 120
celler = []
for f in fs:
    im = Image.open(f).convert('RGB'); w, h = im.size
    r = im.crop((int(w * 0.62), int(h * 0.90), w, h)).resize((bw, int(bw * (h * 0.10) / (w * 0.38))))
    l = im.crop((0, int(h * 0.90), int(w * 0.38), h)).resize((bw, int(bw * (h * 0.10) / (w * 0.38))))
    cell = Image.new('RGB', (bw * 2 + 10, r.size[1] + 18), (245, 245, 245))
    cell.paste(l, (0, 18)); cell.paste(r, (bw + 10, 18))
    ImageDraw.Draw(cell).text((4, 3), os.path.basename(f), fill=(0, 0, 0))
    celler.append(cell)
per = 14
for i in range(0, len(celler), per):
    grp = celler[i:i + per]
    H = sum(c.size[1] + 4 for c in grp)
    ark = Image.new('RGB', (grp[0].size[0], H), (255, 255, 255))
    y = 0
    for c in grp:
        ark.paste(c, (0, y)); y += c.size[1] + 4
    ark.save(f'{pre}-{i // per + 1}.jpg', quality=85)
    print(f'{pre}-{i // per + 1}.jpg', len(grp), 'bilder', ark.size)
