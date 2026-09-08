# -*- coding: utf-8 -*-
"""Steg 14 för rundans tre sista sidor.

Hämtar via `grindar.hamta_isr` — två gånger, den första är väckningen.
Kontrollmätningen (hjältebildens id MÅSTE hittas) ligger kvar: ett svep utan
en känd träff i sig är inget svep.
"""
import re
import sys

sys.path.insert(0, "/home/user/fyndplats-cache-warmer/tools/polish-assets")
import grindar as g                                                # noqa: E402

BAS = "https://www.fyndplats.se/produkt/"

SIDOR = {
 "aprilia-elmotorcykel-barn-12v-vit": {
   "hjalte": "eec323f5c404430da960e5adb0cb5614",
   "kort":   "2b757f3ea1144806af85f3f0c91147de",
   "maste":  ["106,5 × 56 × 80 cm", "35 cm lång, 14 cm bred", "48 cm över marken",
              "Ø 33,5 cm i plast", "3–8 år", "30 kg", "6 km/h", "Vit och svart",
              "avsedd för lek på privat mark", "aprilia-elmotorcykel-barn-12v-svart-gul"],
   "far_ej": ["Gelb", "Weiß", "gul kaross", "Aosom", "HOMCOM", "Tyskland", "370-"],
 },
 "aprilia-elmotorcykel-barn-12v-svart-gul": {
   "hjalte": "b6227b2846c74788916819a21e4f6f02",
   "kort":   "6c8138903da64a12a4bac07e839efd3e",
   "maste":  ["106,5 × 56 × 80 cm", "35 cm lång, 14 cm bred", "48 cm över marken",
              "Ø 33,5 cm i plast", "3–8 år", "30 kg", "6 km/h", "Svart och gul",
              "avsedd för lek på privat mark", "aprilia-elmotorcykel-barn-12v-vit"],
   "far_ej": ["Gelb", "Weiß", "Aosom", "HOMCOM", "Tyskland", "370-"],
 },
 "elfyrhjuling-barn-12v-back-mp3-orange": {
   "hjalte": "7e83f4d3b47f43138b00025a0da6e58b",
   "kort":   "86f3eafa8b044c4e987d8d7b145a6f5e",
   "maste":  ["100 × 65 × 73 cm", "37 cm lång, 17 cm bred", "Ø 36 cm, 15 cm breda",
              "3–5 år", "30 kg", "3–8 km/h", "Orange och svart",
              "avsedd för lek på privat mark", "Framåt och back"],
   # ☠️ De två tyska textkorten ska INTE finnas kvar i galleriet.
   # ⚠️ `3122e6c3` stod här i första versionen och fällde en KORREKT sida:
   #    det är verklighetsbilden på plats 2, alltså en bild som SKA ligga
   #    kvar. De borttagna tyska korten är `86286b0c` och `cd2f25c6`, och de
   #    prövas i BORTPLOCKADE nedan. En grind som fäller rätt sida lär
   #    mottagaren att sluta läsa — samma fel som den fångar.
   "far_ej": ["FEDERUNGSSYSTEM", "GEEIGNET", "Ziegel", "Asphalt", "Aosom",
              "HOMCOM", "Tyskland", "370-"],
 },
}

# id på de tyska korten som plockades bort ur fyrhjulingens galleri
BORTPLOCKADE = ["b379ce_86286b0cc4d242dd8cd8ad44aea80d47", "b379ce_cd2f25c6861a4022a0d009b079561e45"]

if __name__ == "__main__":
    fel = 0
    for slug, k in SIDOR.items():
        html, headers = g.hamta_isr(BAS + slug, paus=10)
        rader = []
        if k["hjalte"] not in html:
            print("  ☠️ %-40s KONTROLLMÄTNINGEN FÖLL — hjältebilden hittas inte" % slug)
            fel += 1
            continue
        if k["kort"] not in html:
            rader.append("eget kort saknas i galleriet")
        for m in k["maste"]:
            if m not in html:
                rader.append("saknas: " + m)
        for f in k["far_ej"]:
            if f in html:
                rader.append("☠️ finns men får inte: " + f)
        if "fyrhjuling" in slug:
            for b in BORTPLOCKADE:
                if b in html:
                    rader.append("☠️ borttagen tysk bild ligger kvar: " + b[-12:])
        fel += len(rader)
        print("  %-40s %-5s %6d B  %s"
              % (slug, headers.get("x-vercel-cache", "?"), len(html),
                 "✅ ren" if not rader else "☠️ %d fynd" % len(rader)))
        for r in rader:
            print("        " + r)
    print()
    print("✅ tre av tre sidor rena" if not fel else "☠️ %d fynd totalt" % fel)
    raise SystemExit(1 if fel else 0)
