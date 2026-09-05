# -*- coding: utf-8 -*-
"""Runda 69 — mäter klädselns färg ur PIXLARNA, inte ur feedens Farbe-kolumn.

☠️ Runda 66:s dyraste fynd var att källan kallade en MELLANGRÅ fåtölj "Schwarz".
   Ett ord i en kolumn är inte en mätning. Den här filen läser produktbilden,
   maskar bort vit bakgrund och skugga, och rapporterar den BÄST BELYSTA delen
   av klädseln — det är den kunden ser, inte medianen som skuggan drar ner.
"""
import colorsys, json, os
from PIL import Image

HAR = os.path.dirname(os.path.abspath(__file__))
ORDNING = ["37e5dfcf","dd5553fa","fd16efbc","4c1f5303","7702de01",
           "e818cf7e","afab8a41","a9c0fc05","75e5fa26"]
KALLA = {"37e5dfcf":"Schwarz","dd5553fa":"Grau","fd16efbc":"Braun",
         "4c1f5303":"Grau","7702de01":"Cremeweiss","e818cf7e":"Grau",
         "afab8a41":"Beige","a9c0fc05":"Schwarz","75e5fa26":"Grau"}


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
    ark = Image.new("RGB", (CELL*2 + PAD*3, (CELL + PAD) * 9 + PAD), "white")
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
