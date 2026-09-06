# -*- coding: utf-8 -*-
"""Runda 77, Steg 4 — MÄTER kulören i stället för att tro på källans ord.

Runda 76 mätte fyra av åtta färgord fel i källan (en turkos stol kallades
`Grün`). Här gäller det hjärtryggsparet, där källan säger `Weiß` och `Rosa` —
och skillnaden vit/gräddvit avgör både namn, slug och SKU.

Beskurna rutor sparas i `beskuret/` så att valet går att granska i efterhand.
"""
import colorsys, json, os
from PIL import Image

RUTOR = {"H": (.32, .44, .68, .60)}          # sitsen på hjältebilden
BILDER = json.load(open("bilder.json"))
os.makedirs("beskuret", exist_ok=True)
ut = {}
for k, v in BILDER.items():
    if v["grupp"] not in RUTOR:
        continue
    im = Image.open("rawbilder/%s-1.jpg" % k).convert("RGB")
    w, h = im.size
    x0, y0, x1, y1 = RUTOR[v["grupp"]]
    ruta = im.crop((int(w*x0), int(h*y0), int(w*x1), int(h*y1)))
    ruta.save("beskuret/%s.jpg" % k, quality=90)
    px = list(ruta.resize((60, 60)).getdata())
    r = sum(p[0] for p in px)/len(px); g = sum(p[1] for p in px)/len(px); b = sum(p[2] for p in px)/len(px)
    H, L, S = colorsys.rgb_to_hls(r/255, g/255, b/255)
    ut[k] = {"rgb": [round(r), round(g), round(b)], "H": round(H*360, 1),
             "L": round(L*100, 1), "S": round(S*100, 1), "kalla": v["kallfarg"]}
    # Tvågrensskalan: mättnad under 15 % är neutral (läs L), över är kulört (läs H)
    gren = "neutral" if ut[k]["S"] < 15 else "kulort"
    ut[k]["gren"] = gren
    print("%s  kalla=%-9s rgb=%s  H=%5.1f  L=%4.1f  S=%4.1f  -> %s"
          % (k, v["kallfarg"], ut[k]["rgb"], ut[k]["H"], ut[k]["L"], ut[k]["S"], gren))
json.dump(ut, open("farg.json", "w"), ensure_ascii=False, indent=1)
