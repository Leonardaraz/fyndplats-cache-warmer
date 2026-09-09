# -*- coding: utf-8 -*-
"""Runda 114 Steg 4 — förstoringar av det som INTE går att läsa på ett kontaktark.

☠️ RUNBOOKENS REGEL: en färg skrivs aldrig ur kontaktkartan, bara ur en ZOOM,
   och en ritning läses av i förstoring. Tre frågor står öppna efter arket:

   1. `d754d015` bild 2 — enheten ser GRÖN ut på en sida som säljs som VIT.
   2. `412c9f43` bild 3 — vad står i de två temperaturbadgarna, exakt?
   3. `e6d2e70b` — bild 4 påstår "Schloss & Schlüssel". Syns ett lås någonstans?
"""
import io
import urllib.request

from PIL import Image

BAS = "https://static.wixstatic.com/media/%s/v1/fill/w_1600,h_1600,al_c,q_92/f.jpg"
import matt


def hamta(k, n):
    req = urllib.request.Request(BAS % matt.BILDER[k][n - 1],
                                 headers={"User-Agent": "Mozilla/5.0"})
    return Image.open(io.BytesIO(urllib.request.urlopen(req, timeout=90).read())).convert("RGB")


def klipp(im, x0, y0, x1, y1, bredd=1100):
    b = im.crop((int(x0 * im.width), int(y0 * im.height),
                 int(x1 * im.width), int(y1 * im.height)))
    return b.resize((bredd, int(bredd * b.height / b.width)), Image.LANCZOS)


if __name__ == "__main__":
    rader = [
        ("d754d015 bild 2 — färgen", klipp(hamta("d754d015", 2), 0.14, 0.20, 0.52, 0.62)),
        ("412c9f43 bild 3 — badgarna", klipp(hamta("412c9f43", 3), 0.02, 0.00, 0.98, 0.17)),
        ("758f0a80 bild 3 — badgarna", klipp(hamta("758f0a80", 3), 0.02, 0.00, 0.98, 0.17)),
    ]
    h = sum(b.height + 40 for _, b in rader)
    ark = Image.new("RGB", (1100, h), "white")
    from PIL import ImageDraw
    rit = ImageDraw.Draw(ark)
    y = 0
    for etikett, b in rader:
        rit.text((8, y + 12), etikett, fill="black")
        ark.paste(b, (0, y + 40)); y += b.height + 40
    ark.save("zoom-farg-och-badge.jpg", quality=92)
    print("zoom-farg-och-badge.jpg", ark.size)

    lås = [("e6d2e70b bild 1 — dörrfront", klipp(hamta("e6d2e70b", 1), 0.20, 0.15, 0.85, 0.60)),
           ("e6d2e70b bild 5 — detalj", klipp(hamta("e6d2e70b", 5), 0.05, 0.05, 0.95, 0.75))]
    h = sum(b.height + 40 for _, b in lås)
    ark2 = Image.new("RGB", (1100, h), "white")
    rit = ImageDraw.Draw(ark2)
    y = 0
    for etikett, b in lås:
        rit.text((8, y + 12), etikett, fill="black")
        ark2.paste(b, (0, y + 40)); y += b.height + 40
    ark2.save("zoom-las.jpg", quality=92)
    print("zoom-las.jpg", ark2.size)
