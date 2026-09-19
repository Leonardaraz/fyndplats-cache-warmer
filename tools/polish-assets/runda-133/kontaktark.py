# -*- coding: utf-8 -*-
"""Steg 4 — kontaktarket. ⚠️ ERSÄTTER INTE ÖGONEN, det ger dem något att titta på.

☠️ KONTAKTARKET AVGÖR INTE PRODUKTTYPEN (uppgift #497). Det visar vad bilden
   innehåller; VAD PRODUKTEN ÄR avgörs av bild + mått + tyskans egen text
   tillsammans. Runda 131 döpte en halkmatta till ramp på ett kontaktark.

Bilderna ligger redan nerladdade i `bytebilder/` från `bytegrind.py` — de
hämtas inte igen. Samma filer, alltså samma sanning som dubblettgrinden såg.
"""
import os
import sys

from PIL import Image, ImageDraw

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HAR)
import bilder as B                                               # noqa: E402

MAPP = os.path.join(HAR, "bytebilder")


def ark(produkter, ut, ruta=300, etikett=26, kolumner=5, bild_nr=None):
    """En rad per produkt (hela galleriet) om bild_nr är None, annars en ruta var."""
    if bild_nr is None:
        rader = []
        for pid in produkter:
            rader.append((pid, B.GALLERI[pid]))
        hojd = sum((ruta + etikett) for _ in rader)
        bredd = ruta * max(len(f) for _, f in rader)
    else:
        rader = [(pid, [B.GALLERI[pid][bild_nr - 1]]) for pid in produkter]
        n = len(rader)
        kol = kolumner
        rad_antal = (n + kol - 1) // kol
        bredd, hojd = ruta * kol, (ruta + etikett) * rad_antal

    arkbild = Image.new("RGB", (bredd, hojd), "white")
    rit = ImageDraw.Draw(arkbild)

    if bild_nr is None:
        y = 0
        for pid, filer in rader:
            märke = pid + ("  [PUBLICERAD]" if pid in B.PUBLICERADE else "")
            rit.text((6, y + 7), märke, fill="black")
            for i, f in enumerate(filer):
                bild = Image.open(os.path.join(MAPP, f.replace("~", "_")))
                arkbild.paste(bild.convert("RGB").resize((ruta, ruta), Image.LANCZOS),
                              (i * ruta, y + etikett))
                rit.rectangle([i * ruta, y + etikett,
                               i * ruta + ruta - 1, y + etikett + ruta - 1],
                              outline="black")
            y += ruta + etikett
    else:
        for i, (pid, filer) in enumerate(rader):
            x, y = (i % kolumner) * ruta, (i // kolumner) * (ruta + etikett)
            märke = pid + ("  [PUBL]" if pid in B.PUBLICERADE else "")
            rit.text((x + 6, y + 7), märke, fill="black")
            bild = Image.open(os.path.join(MAPP, filer[0].replace("~", "_")))
            arkbild.paste(bild.convert("RGB").resize((ruta, ruta), Image.LANCZOS),
                          (x, y + etikett))
            rit.rectangle([x, y, x + ruta - 1, y + etikett + ruta - 1], outline="black")

    vag = os.path.join(HAR, ut)
    arkbild.save(vag, quality=88)
    return vag, arkbild.size


if __name__ == "__main__":
    ordning = B.UTKAST + B.PUBLICERADE
    print(*ark(ordning, "kontaktark-hjaltar.jpg", bild_nr=1, ruta=300, kolumner=5))
