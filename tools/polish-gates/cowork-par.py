#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# cowork-par.py (2026-10-24): färgens FÖRSTA nuvarande bild bredvid varje kandidat, 520 px, bara läsning av lokala filer.
#
#   cowork-par.py <ut-katalog> <live-katalog> <rader.json> <rad> <k> [<k> ...]
#
# <ut-katalog>    den som cowork-granska.py skrev: svar/<rad>/<NN>.img är kandidaterna, galleri/<id8>/<hex6>.jpg är sidans egna bilder
#                 (hämtade ur Wix, hex6 = de sex första tecknen efter `b379ce_`)
# <live-katalog>  har live_<id8>.json per sida (live-bilder.mjs): färgens vy, alltså vilka filer butiken visar för färgen
# <rader.json>    uppdragsfilens rader (id8, farg, nr)
#
# Skriver <ut-katalog>/par/par_<rad>.jpg, ett par per kandidat under varandra.
#
# Varför (omgång 4, rad 160–256, 2026-10-24): `dHash` är gråskala och avståndsgränsen 12 släpper igenom två slags kopior som INTE är nya bilder
# för en färg: en spegelvänd kopia av färgens första bild, och en omskuren kopia av den. På Aosoms plats 11 och 12 var det den vanligaste
# "nya" bilden: 41 av 104 strukna kandidater på plats 11 och uppåt (18 spegelvända, 23 omskurna). `cowork-jfr.py` lägger kandidaten bredvid
# hela vyn i 330 px; här ser man spegling och beskärning på färgens första bild i full storlek. Samma ark visade också ett renderat skjul i
# fel färg (beige på en Antracit-sida) som varken OCR, avståndet eller sifferkontrollen hade sett (CLAUDE.md, *Cowork-rundan*, omgång 4).
# En tvåaxlig sida utan färgvy i live-filen (kombos tom) faller tillbaka på sidans första bild som finns hämtad.
# Kräver PIL (använd venven med OCR om systempythons saknar den).
import json
import os
import sys

from PIL import Image, ImageDraw

if len(sys.argv) < 6:
    sys.exit("användning: cowork-par.py <ut-katalog> <live-katalog> <rader.json> <rad> <k> [<k> ...]")
ut, live, radfil, nr = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4])
ks = [int(x) for x in sys.argv[5:]]
rader = {x["nr"]: x for x in json.load(open(radfil, encoding="utf-8"))}
r = rader[nr]
S = 520


def las(p):
    im = Image.open(p).convert("RGB")
    im.thumbnail((S, S))
    return im


farg = r["farg"].split(" · ")[0].strip().lower()
filer = []
lf = os.path.join(live, "live_%s.json" % r["id8"])
if os.path.exists(lf):
    j = json.load(open(lf, encoding="utf-8"))
    vy = next((k for k in j["kombos"] if k["val"].split("=", 1)[-1].strip().lower() == farg), None)
    if vy is None and j["kombos"]:
        vy = j["kombos"][0]
    if vy:
        filer = [i.replace("b379ce_", "")[:6] for i in vy["ids"]]
nu0 = None
for h in filer:
    p = os.path.join(ut, "galleri", r["id8"], h + ".jpg")
    if os.path.exists(p):
        nu0 = las(p)
        break
if nu0 is None:
    gd = os.path.join(ut, "galleri", r["id8"])
    for f in sorted(os.listdir(gd)) if os.path.isdir(gd) else []:
        nu0 = las(os.path.join(gd, f))
        break
tiles = []
for k in ks:
    c = las(os.path.join(ut, "svar", str(nr), "%02d.img" % k))
    ark = Image.new("RGB", (2 * S + 12, S + 20), "white")
    ImageDraw.Draw(ark).text((4, 3), "rad %d: färgens första bild (nu) | kandidat k%d" % (nr, k), fill="black")
    if nu0:
        ark.paste(nu0, (0, 20))
    ark.paste(c, (S + 12, 20))
    tiles.append(ark)
ut_fil = os.path.join(ut, "par", "par_%d.jpg" % nr)
os.makedirs(os.path.dirname(ut_fil), exist_ok=True)
H = sum(t.height for t in tiles)
out = Image.new("RGB", (tiles[0].width, H), "white")
y = 0
for t in tiles:
    out.paste(t, (0, y))
    y += t.height
out.save(ut_fil, quality=85)
print(ut_fil, out.size)
