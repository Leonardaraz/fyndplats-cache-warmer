# -*- coding: utf-8 -*-
"""Runda 112 — zooma in måttritningarna (bild 3 i varje galleri).

☠️ KONTAKTARKET ANTYDDE ATT SPEC-BLOCKET OCH RITNINGEN SÄGER OLIKA SAKER om
   hur stor duken är. Skillnaden ser ut att vara YTTERMÅTT mot SYNLIG BILDYTA,
   och den avgör vilket tumtal kunden faktiskt köper. Det går inte att avgöra
   på en 260-pixels miniatyr — ritningarna läses i full upplösning.
"""
import os, sys
from PIL import Image

HAR = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HAR, "rawbilder")


def ark(namn, nycklar, bild=3, kol=2, bredd=900):
    rutor = []
    for k in nycklar:
        im = Image.open(os.path.join(RAW, f"{k}-{bild}.jpg")).convert("RGB")
        im.thumbnail((bredd, bredd), Image.LANCZOS)
        rutor.append((k, im))
    rad = (len(rutor) + kol - 1) // kol
    b = max(i.width for _, i in rutor)
    h = max(i.height for _, i in rutor)
    out = Image.new("RGB", (kol * b, rad * (h + 18)), "white")
    from PIL import ImageDraw
    d = ImageDraw.Draw(out)
    for n, (k, im) in enumerate(rutor):
        x, y = (n % kol) * b, (n // kol) * (h + 18)
        out.paste(im, (x, y + 18))
        d.text((x + 4, y + 4), k, fill="black")
    out.save(os.path.join(HAR, f"zoom-{namn}.jpg"), "JPEG", quality=92)
    print(f"zoom-{namn}.jpg  {out.size}")


if __name__ == "__main__":
    vad = sys.argv[1] if len(sys.argv) > 1 else "ritningar"
    if vad == "ritningar":
        ark("ritningar-1", ["422ab1bd", "a8c82049"], kol=2, bredd=900)
        ark("ritningar-2", ["ddca577d", "77d2b35c"], kol=2, bredd=900)
        ark("ritningar-3", ["0370673c", "623b6504"], kol=2, bredd=900)
        ark("ritningar-4", ["1b87909f", "fe11166f"], kol=2, bredd=900)
