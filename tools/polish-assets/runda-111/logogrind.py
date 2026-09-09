# -*- coding: utf-8 -*-
"""Runda 111 Steg 4 — leverantörens logotyp ligger i PIXLARNA, inte i HTML:en.

Runda 64 mätte upp `HOMCOM by Aosom` inbränt uppe till vänster på en
Aosom-bild. En grep över källkoden svarar grönt medan kundens öga läser
leverantörens namn. Arket nedan visar ENBART det övre vänstra hörnet av alla
35 bilder, uppförstorat, så hörnet faktiskt går att läsa.
"""
import os
from PIL import Image, ImageDraw
import importlib.util

HAR = os.path.dirname(os.path.abspath(__file__))
_s = importlib.util.spec_from_file_location("hb", os.path.join(HAR, "hamta-bilder.py"))
HB = importlib.util.module_from_spec(_s); _s.loader.exec_module(HB)

HORN = 0.34          # andel av bilden, uppe till vänster
BREDD = 360


def bygg(ut="logogrind.jpg"):
    rutor = []
    for kort, filer in HB.GALLERIER.items():
        for i in range(1, len(filer) + 1):
            im = Image.open(os.path.join(HB.RAW, "%s-%d.jpg" % (kort, i))).convert("RGB")
            w, h = im.size
            bit = im.crop((0, 0, int(w * HORN), int(h * HORN))).resize(
                (BREDD, int(BREDD * h / w)), Image.LANCZOS)
            rutor.append(("%s-%d" % (kort, i), bit))
    kol = 5
    rad = (len(rutor) + kol - 1) // kol
    rh = rutor[0][1].size[1] + 20
    ark = Image.new("RGB", (kol * BREDD, rad * rh), "white")
    d = ImageDraw.Draw(ark)
    for n, (namn, bit) in enumerate(rutor):
        x, y = (n % kol) * BREDD, (n // kol) * rh
        ark.paste(bit, (x, y + 20))
        d.text((x + 4, y + 5), namn, fill="black")
    ark.save(ut, "JPEG", quality=90)
    return ut


if __name__ == "__main__":
    print(bygg())
