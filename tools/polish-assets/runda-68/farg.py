# -*- coding: utf-8 -*-
"""Runda 68 — mäter klädselns färg ur PIXLARNA, inte ur feedens Farbe-kolumn.

☠️ Runda 66:s dyraste fynd var att källan kallade en MELLANGRÅ fåtölj "Schwarz".
   Ett ord i en kolumn är inte en mätning. Den här filen läser produktbilden,
   maskar bort vit bakgrund och skugga, och rapporterar den BÄST BELYSTA delen
   av klädseln — det är den kunden ser, inte medianen som skuggan drar ner.
"""
import colorsys, json, os
from PIL import Image

HAR = os.path.dirname(os.path.abspath(__file__))
ORDNING = ["8ca7b3c3","79797c9a","9a2f6417","dfb7fcbe",
           "fbba0de8","99e2d675","07d52f21","ed930c42"]
KALLA = {"8ca7b3c3":"Cremeweiss","79797c9a":"Blau","9a2f6417":"Dunkelgrau",
         "dfb7fcbe":"Beige","fbba0de8":"Cremeweiss","99e2d675":"Schwarz",
         "07d52f21":"Black","ed930c42":"Braun"}


def matt(kort):
    im = Image.open(os.path.join(HAR, "rawbilder", "%s-1.jpg" % kort)).convert("RGB")
    w, h = im.size
    # Ryggen ligger i övre mitten på alla åtta produktbilder (kontaktarket visar det).
    ruta = im.crop((int(w * .25), int(h * .12), int(w * .75), int(h * .48)))
    px = list(ruta.getdata())
    # Bakgrunden är vit, skuggan nästan svart. Båda ljuger om klädseln.
    kladsel = [p for p in px if not (p[0] > 232 and p[1] > 232 and p[2] > 232)
               and max(p) > 18]
    if not kladsel:
        return None
    lum = sorted(kladsel, key=lambda p: 0.299*p[0] + 0.587*p[1] + 0.114*p[2])
    def snitt(bit):
        n = len(bit)
        return tuple(round(sum(p[i] for p in bit) / n) for i in range(3))
    median = snitt(lum[len(lum)//2 - 300: len(lum)//2 + 300] or lum)
    # BÄST BELYST: 80–90:e percentilen. Toppen är reflexer, inte färg.
    ljus = snitt(lum[int(len(lum)*.80): int(len(lum)*.90)] or lum)
    hh, ll, ss = colorsys.rgb_to_hls(*[c/255 for c in ljus])
    return {"median": median, "ljus": ljus,
            "H": round(hh*360), "L": round(ll*100), "S": round(ss*100),
            "n": len(kladsel)}


if __name__ == "__main__":
    res, rutor = {}, []
    for k in ORDNING:
        m = matt(k)
        res[k] = m
        rutor.append((k, m))
        print("%-9s kalla=%-11s ljus=%-16s H %3d  L %3d %%  S %3d %%"
              % (k, KALLA[k], str(m["ljus"]), m["H"], m["L"], m["S"]))
    # Swatch-ark: originalruta + uppmätt färg, så ögat kan döma mätningen.
    CELL, PAD = 220, 8
    ark = Image.new("RGB", (CELL*2 + PAD*3, (CELL + PAD) * 8 + PAD), "white")
    for i, k in enumerate(ORDNING):
        im = Image.open(os.path.join(HAR, "rawbilder", "%s-1.jpg" % k)).convert("RGB")
        w, h = im.size
        bit = im.crop((int(w*.25), int(h*.12), int(w*.75), int(h*.48))).resize((CELL, CELL))
        y = PAD + i * (CELL + PAD)
        ark.paste(bit, (PAD, y))
        ark.paste(Image.new("RGB", (CELL, CELL), res[k]["ljus"]), (PAD*2 + CELL, y))
    ark.save(os.path.join(HAR, "farg.png"))
    json.dump(res, open(os.path.join(HAR, "farg.json"), "w"), indent=1)
    print("\nfarg.png + farg.json skrivna")
