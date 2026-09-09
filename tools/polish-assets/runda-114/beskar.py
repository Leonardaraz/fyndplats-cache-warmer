# -*- coding: utf-8 -*-
"""Runda 114 Steg 9 — beskär bort skräpbanden ur två måttritningar.

☠️ OCH FYLL TILLBAKA TILL KVADRAT. PDP:n hämtar bilderna med `fill/…,al_c`,
   alltså CENTRERAD beskärning till kvadrat. En bild som blivit liggande efter
   beskärningen får därför sidorna bortkapade — och det är precis där
   måttetiketterna sitter. Runda 103 tappade sina måttritningar på det.
"""
import os

from PIL import Image

import bildplan
import matt

HAR = os.path.dirname(os.path.abspath(__file__))


def beskar(k):
    pos, (x0, y0, x1, y1), skal = bildplan.BESKARNING[k]
    im = Image.open(os.path.join(HAR, "rawbilder", "%s-%d.jpg" % (k, pos))).convert("RGB")
    b = im.crop((int(x0 * im.width), int(y0 * im.height),
                 int(x1 * im.width), int(y1 * im.height)))
    sida = max(b.width, b.height)
    duk = Image.new("RGB", (sida, sida), _bakgrund(b))
    duk.paste(b, ((sida - b.width) // 2, (sida - b.height) // 2))
    os.makedirs(os.path.join(HAR, "beskurna"), exist_ok=True)
    ut = os.path.join(HAR, "beskurna", "%s-%d.jpg" % (k, pos))
    duk.save(ut, "JPEG", quality=94, subsampling=0)
    return ut, b.size, duk.size, skal


def _bakgrund(b):
    """Fyllnadsfärgen tas ur bildens EGNA hörn, inte satt till vit.

    ⚠️ Båda ritningarna står på en rosa toning, inte på vitt. En vit ram runt
       en rosa bild ser ut som ett renderingsfel — samma klass som runda 113:s
       249-gråa botten som blev en ruta mitt på kortet.
    """
    px = [b.getpixel(p) for p in ((2, 2), (b.width - 3, 2),
                                  (2, b.height - 3), (b.width - 3, b.height - 3))]
    return tuple(sum(v[i] for v in px) // len(px) for i in range(3))


if __name__ == "__main__":
    for k in bildplan.BESKARNING:
        ut, fore, efter, skal = beskar(k)
        print("%s  %s → %s (kvadrat)  — %s" % (k, fore, efter, skal))
