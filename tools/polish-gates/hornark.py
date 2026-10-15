#!/usr/bin/env python3
"""Bygger rundans HÖRNARK: de fyra hörnen ur varje originalbild, högpassfiltrerade.

Varför: leverantörens bilder bär ibland ett husmärke, en logotyp eller en
vattenstämpel i ett hörn, och kontaktarket ser det inte när märket är vitt på en
ljus vägg eller liten och genomskinlig. Två fynd som motiverar arket:

  * N53, skrivbordet `db1f6697`: "HOMCOM by Aosom" uppe till höger, vitt på vita
    persienner. Husmärket och leverantören i samma logotyp.
  * N172, fåtöljen `c169f30a`: vattenstämpeln 豆包AI生成 ("AI-genererad") nere till
    höger på en livsstilsbild. Den syntes inte i kontaktarket och hittades bara
    för att hörnet klipptes ut och förstorades.

`bygg-ghost.py` gör samma filter på HELA bilden, två produkter per ark. Det här
arket klipper bara hörnen, så att en runda på 55 bilder ryms på fyra ark i stället
för tjugosju. Det ersätter inte `bygg-ghost.py` när en bild ser misstänkt ut, och
det ersätter inte kontaktarket. Det kompletterar dem.

Filtret drar av en kraftigt suddad kopia av bilden och förstärker det som är
ljusare än omgivningen. Släta ytor blir svarta och text, logotyper och
vattenstämplar blir vita konturer. Produktens egna kanter lyser också, så det är
väggar, golv och himmel man letar på.

ANVÄNDNING (i rundans katalog, efter att `orig/` byggts av bygg_enhet/bygg-ark):
  python3 <väg>/polish-gates/hornark.py                 # alla bilder i orig/
  python3 <väg>/polish-gates/hornark.py <rundakatalog>  # en annan katalog
  python3 <väg>/polish-gates/hornark.py <rundakatalog> 240 24   # mindre hörn, 24 bilder per ark
  -> ghost/horn-1.jpg, ghost/horn-2.jpg ...    (14 bilder per ark som standard, fyra hörn per rad:
     uppe vänster, uppe höger, nere vänster, nere höger)

`ghost/` är gitignorerat. Arken är ett mellanled för ögat och går att bygga om ur orig/.
"""
import glob
import os
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFilter

SUDD = 18            # samma radie som bygg-ghost.py (mätt på N53:s vattenstämpel)
FORSTARKNING = 9     # samma förstärkning: svaga konturer ska synas
BREDD_PCT = 0.38     # hörnets bredd av bilden
HOJD_PCT = 0.16      # hörnets höjd av bilden
CELLBREDD = 300      # ett hörn ritas så här brett
RADER_PER_ARK = 14
MELLAN = 6


def hogpass(im):
    g = im.convert("L")
    g.thumbnail((1200, 1200))
    sudd = g.filter(ImageFilter.GaussianBlur(SUDD))
    hp = ImageChops.subtract(g, sudd, scale=1.0, offset=0)
    return hp.point(lambda v: min(255, v * FORSTARKNING))


def hornen(fn):
    hp = hogpass(Image.open(fn))
    w, h = hp.size
    bw, bh = int(w * BREDD_PCT), int(h * HOJD_PCT)
    rutor = [(0, 0), (w - bw, 0), (0, h - bh), (w - bw, h - bh)]
    ut = []
    for x, y in rutor:
        c = hp.crop((x, y, x + bw, y + bh))
        ut.append(c.resize((CELLBREDD, max(1, CELLBREDD * c.size[1] // c.size[0]))))
    return ut


def main():
    global CELLBREDD, RADER_PER_ARK
    rd = sys.argv[1] if len(sys.argv) > 1 else "."
    if len(sys.argv) > 2:
        CELLBREDD = int(sys.argv[2])
    if len(sys.argv) > 3:
        RADER_PER_ARK = int(sys.argv[3])
    filer = sorted(
        f for f in glob.glob(os.path.join(rd, "orig", "*"))
        if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))
    )
    if not filer:
        sys.exit("inga bilder i %s/orig/" % rd)
    os.makedirs(os.path.join(rd, "ghost"), exist_ok=True)
    rader = []
    for f in filer:
        cs = hornen(f)
        hog = max(c.size[1] for c in cs)
        rad = Image.new("L", (4 * CELLBREDD + 3 * MELLAN, hog + 14), 40)
        for i, c in enumerate(cs):
            rad.paste(c, (i * (CELLBREDD + MELLAN), 14))
        ImageDraw.Draw(rad).text((3, 1), os.path.basename(f), fill=255)
        rader.append(rad)
    antal = 0
    for i in range(0, len(rader), RADER_PER_ARK):
        grp = rader[i:i + RADER_PER_ARK]
        hojd = sum(r.size[1] + MELLAN for r in grp)
        ark = Image.new("L", (grp[0].size[0], hojd), 0)
        y = 0
        for r in grp:
            ark.paste(r, (0, y))
            y += r.size[1] + MELLAN
        ut = os.path.join(rd, "ghost", "horn-%d.jpg" % (i // RADER_PER_ARK + 1))
        ark.save(ut, quality=88)
        antal += 1
        print(ut, len(grp), "bilder", ark.size)
    print(len(rader), "bilder på", antal, "ark")


if __name__ == "__main__":
    main()
