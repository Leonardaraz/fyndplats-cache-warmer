#!/usr/bin/env python3
"""Bygger rundans HÖGPASSARK — samma bilder som kontaktarket, filtrerade så att
en halvgenomskinlig vattenstämpel syns som tydliga konturer.

☠️ KONTAKTARKET SER INTE EN VIT VATTENSTÄMPEL PÅ EN LJUS VÄGG. Uppmätt i runda
N53 på skrivbordet `db1f6697`: bild 2 och 5 bär "HOMCOM by Aosom" uppe till
höger, vitt på vita persienner och en ljus vägg. I kontaktarket var märket en
aning ljusare än väggen och syntes bara för att arket råkade granskas extra
noga. I högpassarket står det i klartext på båda bilderna, och de andra tre
bilderna av samma produkt är rena. Det är husmärket OCH leverantören i samma
logotyp — exakt det runda 64 strök för att det leder till hela deras katalog.

Filtret drar av en kraftigt suddad kopia av bilden och förstärker det som är
LJUSARE än omgivningen. Släta ytor blir svarta, och det som ligger ovanpå en
slät yta — text, logotyper, vattenstämplar — blir vita konturer. Produktens
egna kanter lyser också; det är väggar, golv och himmel man letar på.

⚠️ Arket ersätter inte kontaktarket, det kompletterar det. Tysk text inbränd i
en måttbild syns i båda, men om en bild är tydlig, skarp eller vilseledande
ser man bara i det vanliga arket.

⚠️ Två produkter per ark räcker: arket är 1880 px brett och läses nedskalat
till ungefär 1400 px, och vattenstämpeln i N53 var lika läsbar där. Ett ark per
produkt dubblar antalet bildläsningar utan att visa mer.

ANVÄNDNING (i samma katalog som bygg-ark.py kördes i, efter den):
  python3 <väg>/polish-gates/bygg-ghost.py            # alla produkter
  python3 <väg>/polish-gates/bygg-ghost.py k1 k2 ...  # bara dessa
  bilder.tsv   "kort  position  wix-fil-id"
  orig/<kort>-<pos>.jpg   (från bygg-ark.py)
  -> ghost/<kort>.jpg     ett ark per produkt
  -> ghost/par<N>.jpg     två produkter per ark, i bilder.tsv:s ordning
"""
import collections, os, sys
from PIL import Image, ImageChops, ImageDraw, ImageFilter

CELL = 600        # samma cell som kontaktarket
MARGINAL = 20
TEXTHOJD = 32
KOLUMNER = 3
SUDD = 18         # radie på den suddade kopian; mätt på N53:s vattenstämpel
FORSTARKNING = 9  # svaga konturer ska synas, inte bara skarpa


def hogpass(fn):
    im = Image.open(fn).convert("L")
    im.thumbnail((1200, 1200))
    sudd = im.filter(ImageFilter.GaussianBlur(SUDD))
    hp = ImageChops.subtract(im, sudd, scale=1.0, offset=0)
    hp = hp.point(lambda v: min(255, v * FORSTARKNING))
    return hp.resize((CELL, CELL * hp.size[1] // hp.size[0]))


def ark(kort, positioner):
    celler = [(p, hogpass("orig/%s-%d.jpg" % (kort, p))) for p in positioner]
    rader = (len(celler) + KOLUMNER - 1) // KOLUMNER
    hmax = max(c.size[1] for _, c in celler)
    ut = Image.new("L", (MARGINAL + KOLUMNER * (CELL + MARGINAL),
                         MARGINAL + rader * (hmax + TEXTHOJD + MARGINAL)), 0)
    d = ImageDraw.Draw(ut)
    for i, (p, c) in enumerate(celler):
        x = MARGINAL + (i % KOLUMNER) * (CELL + MARGINAL)
        y = MARGINAL + (i // KOLUMNER) * (hmax + TEXTHOJD + MARGINAL)
        ut.paste(c, (x, y))
        d.text((x + 4, y + hmax + 8), "%s position %d" % (kort, p), fill=255)
    return ut


def main():
    per = collections.OrderedDict()
    for rad in open("bilder.tsv", encoding="utf-8"):
        if rad.strip():
            k, pos, _ = rad.rstrip("\n").split("\t")
            per.setdefault(k, []).append(int(pos))
    valda = sys.argv[1:] or list(per)
    saknas = [k for k in valda if k not in per]
    if saknas:
        sys.exit("okänt kort: " + ", ".join(saknas))
    os.makedirs("ghost", exist_ok=True)
    blad = []
    for k in valda:
        b = ark(k, per[k])
        b.save("ghost/%s.jpg" % k, quality=88)
        blad.append(b)
        print("%s  %d bilder  ghost/%s.jpg" % (k, len(per[k]), k))
    for i in range(0, len(blad), 2):
        par = blad[i:i + 2]
        ut = Image.new("L", (max(b.size[0] for b in par), sum(b.size[1] for b in par)), 0)
        y = 0
        for b in par:
            ut.paste(b, (0, y))
            y += b.size[1]
        namn = "ghost/par%d.jpg" % (i // 2 + 1)
        ut.save(namn, quality=85)
        print("%s  %s" % (namn, " + ".join(valda[i:i + 2])))


if __name__ == "__main__":
    main()
