# -*- coding: utf-8 -*-
"""Runda 134 Steg 4 — kontaktark för de sex kvarvarande klöstunnorna.

Bilderna ligger redan i `runda-133/bytebilder/` från runda 133:s bytegrind, som
täckte alla tjugo produkter i familjen. Samma filer, alltså samma sanning som
dubblettgrinden såg — de hämtas inte igen.

☠️ ARKET AVGÖR INTE PRODUKTTYPEN (uppgift #497). Det ger ögonen något att titta
   på; VAD produkten ÄR avgörs av bild + mått + tyskans egen text tillsammans.
   Just den här rundan har ett skolexempel: `668e0e0c` HETER "Kratztonne" men
   måtten säger 45 × 45 fyrkant. Namnet är ingen källa (uppgift #462).
"""
import os
import sys

from PIL import Image, ImageDraw

HAR = os.path.dirname(os.path.abspath(__file__))
R133 = os.path.join(os.path.dirname(HAR), "runda-133")
sys.path.insert(0, R133)
import bilder as B                                               # noqa: E402

MAPP = os.path.join(R133, "bytebilder")

RUNDAN = ["f6857ca0", "09336fdf", "d0b80807", "f4e6159e", "668e0e0c", "38022bcb"]


def ark(produkter, ut, ruta=420, etikett=28):
    """En rad per produkt, hela galleriet."""
    rader = [(pid, B.GALLERI[pid]) for pid in produkter]
    bredd = ruta * max(len(f) for _, f in rader)
    hojd = sum(ruta + etikett for _ in rader)
    arkbild = Image.new("RGB", (bredd, hojd), "white")
    rit = ImageDraw.Draw(arkbild)
    y = 0
    for pid, filer in rader:
        rit.text((6, y + 8), pid, fill="black")
        for i, f in enumerate(filer):
            rit.text((i * ruta + 90, y + 8), "bild %d" % (i + 1), fill="black")
            bild = Image.open(os.path.join(MAPP, f.replace("~", "_")))
            arkbild.paste(bild.convert("RGB").resize((ruta, ruta), Image.LANCZOS),
                          (i * ruta, y + etikett))
            rit.rectangle([i * ruta, y + etikett,
                           i * ruta + ruta - 1, y + etikett + ruta - 1],
                          outline="black")
        y += ruta + etikett
    vag = os.path.join(HAR, ut)
    arkbild.save(vag, quality=88)
    return vag, arkbild.size


if __name__ == "__main__":
    print(*ark(RUNDAN[:3], "kontaktark-1.jpg"))
    print(*ark(RUNDAN[3:], "kontaktark-2.jpg"))
