# -*- coding: utf-8 -*-
"""Steg 4:s kontaktark — delat av alla rundor, aldrig kopierat.

☠️ SAMMA TVILLINGPROBLEM SOM LIVE-GRINDEN, upptäckt i runda 131. Runda 129
   och 130 bar var sin `kontaktark.py` som skiljer sig i EN lista (`grupper`)
   och i inget annat. Nio rundor till hade blivit nio kopior av en fil vars
   ENDA regel — rutstorleken — är den som gör arket användbart.

☠️ ETT ENDA 9x5-ARK GÖR VARJE BILD OLÄSLIG. Runbookens regel efter runda 104:
   arket duger för att se VAD en bild föreställer och om den bär tysk text;
   en SIFFRA måste läsas i förstoring (`zooma`). Rutan är därför 460 px, inte
   300, och arken delas i grupper om tre produkter.

⚠️ ARKET ERSÄTTER INTE ÖGONEN — det ger dem något att titta på.
"""
import os

from PIL import Image, ImageDraw

RUTA, MARG, TEXT = 460, 8, 26


def las_bilder(har, fil="bilder.txt"):
    """`bilder.txt` -> {pid: [filnamn i rawbilder/, ...]} i galleriordning."""
    par = [r.split() for r in open(os.path.join(har, fil), encoding="utf-8")
           if r.strip()]
    filer, raknare = {}, {}
    for pid, _ in par:
        raknare[pid] = raknare.get(pid, 0) + 1
        filer.setdefault(pid, []).append("%s-%02d.jpg" % (pid, raknare[pid]))
    return filer


def ark(har, grupper, filer=None, per_rad=5):
    """Ett ark per grupp. Returnerar [(väg, storlek)]."""
    filer = filer or las_bilder(har)
    ut = []
    for nr, grupp in enumerate(grupper, 1):
        b = (RUTA + MARG) * per_rad + MARG
        h = (RUTA + MARG + TEXT) * len(grupp) + MARG
        blad = Image.new("RGB", (b, h), "white")
        d = ImageDraw.Draw(blad)
        for rad, pid in enumerate(grupp):
            y = MARG + rad * (RUTA + MARG + TEXT)
            for kol, namn in enumerate(filer[pid]):
                x = MARG + kol * (RUTA + MARG)
                im = Image.open(os.path.join(har, "rawbilder", namn)).convert("RGB")
                im.thumbnail((RUTA, RUTA), Image.LANCZOS)
                blad.paste(im, (x + (RUTA - im.width) // 2,
                                y + (RUTA - im.height) // 2))
                d.text((x + 4, y + RUTA + 4), "%s  bild %d" % (pid, kol + 1),
                       fill="black")
        vag = os.path.join(har, "kontaktark-%d.jpg" % nr)
        blad.save(vag, quality=88)
        ut.append((vag, blad.size))
        print("%s  %dx%d  %d byte" % (os.path.basename(vag), blad.width,
                                      blad.height, os.path.getsize(vag)))
    return ut


def zooma(har, pid, nr, ruta=None, namn=None):
    """☠️ EN SIFFRA ELLER EN FÄRG LÄSES ALDRIG PÅ KONTAKTARKET.

    Runbookens regel (2026-09-08): ritningen ska läsas i FÖRSTORING, och en
    färg skrivs aldrig ur kontaktkartan — bara ur en zoom. `ruta` är
    (v, o, h, n) i andelar 0-1 av bilden; utan den sparas hela bilden i full
    upplösning.
    """
    kalla = os.path.join(har, "rawbilder", "%s-%02d.jpg" % (pid, nr))
    im = Image.open(kalla).convert("RGB")
    if ruta:
        v, o, h, n = ruta
        im = im.crop((int(v * im.width), int(o * im.height),
                      int(h * im.width), int(n * im.height)))
    vag = os.path.join(har, namn or ("zoom-%s-%02d.jpg" % (pid, nr)))
    im.save(vag, quality=95)
    print("%s  %dx%d" % (os.path.basename(vag), im.width, im.height))
    return vag
