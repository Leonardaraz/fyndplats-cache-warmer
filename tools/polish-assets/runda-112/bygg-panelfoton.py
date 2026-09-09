# -*- coding: utf-8 -*-
"""Runda 112 — förbehandlar de nio hjältebilderna till panelens 1,83.

Metoden är runda 108–111:s: rita vid varans GEOMETRISKA maxstorlek och klara
byte-taket med OSKÄRPA, inte med krympning. Radien MÄTS med `sok-oskarpa.py`,
den ärvs aldrig — en slät vit duk och ett fotografi av ett vardagsrum
komprimerar inte alls lika.

☠️ 77e4a558 HAR INGEN STUDIOBILD KVAR. Dess bild 1 bar `1080`, `4K`, `8K`,
   `AHD`, `HD` och `4:3` inbränt i den projicerade bilden (Steg 4), och en
   beskärning som klipper ett emblem itu är sämre än emblemet — bilden ströks.
   Kvar som hjälte är LIVSSTILSBILDEN, och den har ingen vit botten att
   hitta en bbox i:

     `bbox()` med tolerans 246 hade returnerat HELA bilden, och `panel()`
     hade fyllt ut en kvadrat med vita stolpar i sidled. Ett fotografi med
     vita bårder ser ut som ett fel, inte som en bild.

   Den beskärs därför till panelens 1,83 i stället — en beskärning av ett
   FOTOGRAFI, inte av varan. Bandet är mätt så att hela duken ryms:
   duken ligger på y≈183–1100 i originalets 2000 px, bandet är y=140→1233.
"""
import os
from PIL import Image, ImageFilter

RATIO = 1.83
FYLL = 1.0
# ☠️ MÄTT med `sok-oskarpa.py`, inte gissat och inte ärvt. Åtta av nio behövde
#    oskärpa — tvärtemot runda 111, där fyra av sju klarade taket vid r=0.
#    Skälet är att motivet här ÄR högfrekvent: varje duk bär en projicerad
#    fotobild, alltså exakt det som inte komprimerar.
#
#      r=0,0  fe11166f                       ← 129 562 byte, tom vit duk
#      r=1,0  1b87909f  77d2b35c  0370673c
#      r=1,5  623b6504
#      r=3,0  ddca577d
#      r=3,5  422ab1bd  a8c82049      ← se noten om mätvägen
#      r=5,0  77e4a558                       ← 211 958 byte, livsstilsfoto
#
#    Ytterligheterna är samma mätning läst åt två håll: fe11166f:s hjältebild
#    är en HELT TOM vit duk (129 kB vid r=0, långt under taket), och
#    77e4a558:s är ett fotografi av ett vardagsrum med människor, mönstrad
#    matta och en stadion (318 kB vid r=0, 48 % över). Skillnaden är motivet,
#    inte kortet — och det är därför radien mäts per produkt.
#
#    ☠️ 422ab1bd och a8c82049 STOD PÅ 3,0 EFTER FÖRSTA MÄTNINGEN och byggde
#       ändå 215 125 respektive 215 101 byte — 125 och 101 byte ÖVER taket.
#       Skälet var mätvägen, inte motivet: sökskriptet la oskärpan på det redan
#       sparade panelfotot (q=94), alltså en JPEG-vända mer än bygget gör, och
#       underskattade därför. `sok-oskarpa.foto()` går genom `panel()` nu, och
#       de två står på 3,5 — verifierat i BYGGET, som är facit.
MJUKA = {"1b87909f": 1.0, "77d2b35c": 1.0, "0370673c": 1.0, "623b6504": 1.5,
         "422ab1bd": 3.5, "a8c82049": 3.5, "ddca577d": 3.0, "77e4a558": 5.0}
# Livsstilsbilder utan vit botten: (bild, y0) — bandets höjd är bredd/1,83.
BAND = {"77e4a558": (2, 140)}
HAR = os.path.dirname(os.path.abspath(__file__))


def bbox(im, tolerans=246):
    g = im.convert("L").point(lambda v: 0 if v > tolerans else 255)
    b = g.getbbox()
    if not b:
        raise SystemExit("hittar ingen produkt i bilden")
    return b


def panel(kort, fyll=FYLL):
    if kort in BAND:
        nr, y0 = BAND[kort]
        im = Image.open(os.path.join(HAR, "rawbilder", "%s-%d.jpg" % (kort, nr)))
        im = im.convert("RGB")
        h = int(im.width / RATIO)
        if y0 + h > im.height:
            raise SystemExit("%s: bandet ryms inte i bilden" % kort)
        duk = im.crop((0, y0, im.width, y0 + h))
    else:
        im = Image.open(os.path.join(HAR, "rawbilder", "%s-1.jpg" % kort)).convert("RGB")
        x0, y0, x1, y1 = bbox(im)
        vara = im.crop((x0, y0, x1, y1))
        bredd = int(vara.width / fyll)
        hojd = int(bredd / RATIO)
        if hojd < vara.height:
            hojd = vara.height + 2
            bredd = int(hojd * RATIO)
        duk = Image.new("RGB", (bredd, hojd), "white")
        duk.paste(vara, ((bredd - vara.width) // 2, (hojd - vara.height) // 2))
    os.makedirs(os.path.join(HAR, "panelfoton"), exist_ok=True)
    ut = os.path.join(HAR, "panelfoton", "%s.jpg" % kort)
    r = MJUKA.get(kort, 0.0)
    if r:
        duk = duk.filter(ImageFilter.GaussianBlur(r))
    duk.save(ut, "JPEG", quality=94)
    return ut, duk.width, duk.height


if __name__ == "__main__":
    import matt
    for k in matt.RUNDAN:
        p, b, h = panel(k)
        print("%s  %d×%d  %.2f  r=%.1f%s"
              % (k, b, h, b / h, MJUKA.get(k, 0.0),
                 "  ← livsstilsband" if k in BAND else ""))
