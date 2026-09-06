# -*- coding: utf-8 -*-
"""Runda 71 — mäter klädselns färg ur PIXLARNA, inte ur feedens Farbe-kolumn.

☠️ Runda 66:s dyraste fynd var att källan kallade en MELLANGRÅ fåtölj "Schwarz",
   och runda 69 mätte upp att två produkter som BÅDA hette "Schwarz" låg 49
   luminanssteg isär. Ett ord i en kolumn är inte en mätning.

☠️ RUNDANS METODFYND: PÅ ETT BLANKT MATERIAL LJUGER MEDIANEN. Runda 69 skrev
   att blankt konstläder ljusnar i TOPPARNA, inte i medianen — det stämde där,
   men inte här. `1a1d04f7` har en välvd, helblank nackkudde som fyller nästan
   hela mätrutan, och då lyfts MEDIANEN med tjugo steg. Mätt mot fem redan
   publicerade sidor, där domen är känd:

     produkt                mörkaste decil   median   publicerad som
     84e3794d (matt väv)          12 %        15 %   svart
     a9c0fc05 (matt väv)          10 %        18 %   svart
     566c7702 (matt väv)          19 %        23 %   svart
     1a1d04f7 (BLANKT läder)      15 %        30 %   ← medianen säger mörkgrå
     37e5dfcf (blankt läder)      26 %        37 %   mörkgrå
     d2409a95 (matt väv)          25 %        37 %   mörkgrå
     89273d39 (matt väv)          24 %        36 %   ← båda säger mörkgrå

   De tre publicerade svarta ligger på 10–19 % i mörkaste decilen, de två
   mörkgrå på 25–26 %. `1a1d04f7` landar på 15 % — inne i det svarta bandet —
   men på 30 % i medianen, mitt emellan. VECKEN mäter materialet, den belysta
   ytan mäter lampan. På matt väv är de två överens; bara på blankt går de isär.
   Kontrollerat med ögon i `jamfor-svart.jpg`: den är svart.

⚠️ Rundans andra fråga: Lederoptik-kvartetten har BÅDE en "Beige" och en
   "Cremeweiß" som syskon. De två orden ligger nära varandra och sitter på
   sidor kunden jämför sida vid sida — mätningen avgör om de verkligen är
   olika, och hur de ska skrivas. Samma fråga som runda 70:s grå/mörkgrå.
"""
import colorsys, json, os
from PIL import Image

HAR = os.path.dirname(os.path.abspath(__file__))
ORDNING = ["d760fffc","79eaab59","4b2a7407","1a1d04f7",
           "99492092","79690bf4","89273d39","9c1889f1"]
KALLA = {"d760fffc":"Beige","79eaab59":"Grau","4b2a7407":"Cremeweiss",
         "1a1d04f7":"Schwarz","99492092":"Cremeweiss","79690bf4":"Hellgrau",
         "89273d39":"Dunkelgrau","9c1889f1":"Cremeweiss+Dunkelrot"}


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
    # ☠️ MÖRKASTE DECILEN — 10–20:e percentilen, alltså vecken och skuggsidan.
    #    På ett BLANKT material mäter medianen studioljuset, inte färgen: hela
    #    den välvda nackkudden fångar ljus och lyfter medianen med tjugo steg.
    #    Vecken gör det inte. Se modulens docstring för mätningen bakom.
    mork = snitt(lum[int(len(lum)*.10): int(len(lum)*.20)] or lum)
    hh, ll, ss = colorsys.rgb_to_hls(*[c/255 for c in ljus])
    mh, ml, ms = colorsys.rgb_to_hls(*[c/255 for c in median])
    mh, ml2, ms = colorsys.rgb_to_hls(*[c/255 for c in mork])
    return {"mork": mork, "morkL": round(ml2*100), "median": median, "ljus": ljus,
            "H": round(hh*360), "L": round(ll*100), "S": round(ss*100),
            "medL": round(ml*100), "medH": round(mh*360), "medS": round(ms*100),
            "n": len(kladsel)}


if __name__ == "__main__":
    res = {}
    for k in ORDNING:
        m = matt(k)
        res[k] = m
        print("%-9s kalla=%-14s mörkast=%-16s L %3d %%   median=%-16s L %3d %%   "
              "ljus L %3d %%  H %3d  S %3d %%"
              % (k, KALLA[k], str(m["mork"]), m["morkL"], str(m["median"]),
                 m["medL"], m["L"], m["H"], m["S"]))
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
