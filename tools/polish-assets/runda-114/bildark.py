# -*- coding: utf-8 -*-
"""Runda 114 Steg 4 — kontaktark över ALLA 45 bilder.

☠️ FRÅGAN STÄLLS OM HELA BILDEN, INTE OM EN BILDTYP. Runda 112 letade tysk
   text i MÅTTRITNINGEN och missade en sjunde bild som bar den; runda 113
   hittade en EU-energietikett med leverantörens artikelnummer inbränt. Tre
   frågor per bild, i den här ordningen:

     1. Finns TEXT i pixlarna — tyska, engelska, vilket språk som helst?
     2. Finns en LOGOTYP eller ett ARTIKELNUMMER som inte sitter fysiskt på varan?
     3. Visar bilden en ANNAN produkt än sidans (färg, modell, tillbehör)?

☠️ Bilddata bor i `matt.py`. En kopia här hade varit den tvilling huset
   förlorat tid på fyra gånger (SHIP_AXIS_RE, EU_TULL_CODES, mapWithConcurrency,
   backend-väljaren).
"""
import io
import sys
import urllib.request

from PIL import Image, ImageDraw

import matt

BAS = "https://static.wixstatic.com/media/%s/v1/fill/w_520,h_520,al_c,q_88/f.jpg"
R, MARG = 520, 150


def ark(nycklar, filnamn):
    bild = Image.new("RGB", (MARG + R * 5, R * len(nycklar)), "white")
    rit = ImageDraw.Draw(bild)
    for i, k in enumerate(nycklar):
        rit.text((10, i * R + R // 2), "%s\n%s" % (k, matt.KONSTRUKTION[matt.GRUPPER[k]]),
                 fill="black")
        for j, f in enumerate(matt.BILDER[k]):
            req = urllib.request.Request(BAS % f, headers={"User-Agent": "Mozilla/5.0"})
            b = Image.open(io.BytesIO(urllib.request.urlopen(req, timeout=90).read()))
            bild.paste(b.convert("RGB").resize((R, R)), (MARG + j * R, i * R))
            rit.text((MARG + j * R + 6, i * R + 6), "%d" % (j + 1), fill="red")
        rit.line([(0, i * R), (bild.width, i * R)], fill="black", width=3)
    bild.save(filnamn, quality=86)
    print(filnamn, bild.size)


if __name__ == "__main__":
    matt.kontroll()
    ark(["397b845e", "b3e3aac8", "b815de72", "e6d2e70b", "ef0fa603"], "bildark-stora.jpg")
    ark(["412c9f43", "d754d015", "758f0a80", "d5cc9efa"], "bildark-sma.jpg")
