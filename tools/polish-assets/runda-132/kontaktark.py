# -*- coding: utf-8 -*-
"""Steg 9-underlag: hämtar galleriet och bygger två kontaktark (5 produkter × 5 bilder).

⚠️ EGEN MAPP `rawbilder/`, och de hämtas i 760 px — det räcker för att avgöra
   MOTIV och ordning. Kortbygget hämtar sina egna hjältebilder i 1600 px till
   `kortfoto/`; de två får aldrig dela mapp (kortrunda.py:s egen varning).
"""
import os, sys, urllib.request
from PIL import Image, ImageDraw

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HAR)
import bilder as B                                               # noqa: E402
import texter as T                                               # noqa: E402

URL = "https://static.wixstatic.com/media/%s/v1/fill/w_760,h_760,al_c,q_85/f.jpg"
ORD = ["8f6147b5", "4c25eb86", "762cc411", "f384c51d", "3ff2bc32",
       "03715963", "c38f929e", "96d2803c", "11436227", "71e8e879"]


def hamta():
    mapp = os.path.join(HAR, "rawbilder")
    os.makedirs(mapp, exist_ok=True)
    for pid in ORD:
        for i, fil in enumerate(B.GALLERI[pid], 1):
            vag = os.path.join(mapp, f"{pid}-{i}.jpg")
            if os.path.exists(vag):
                continue
            r = urllib.request.Request(URL % fil,
                                       headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(r, timeout=120) as s:
                open(vag, "wb").write(s.read())
    return mapp


def ark(mapp, produkter, ut, ruta=420, etikett=26):
    bredd = ruta * 5
    hojd = (ruta + etikett) * len(produkter)
    a = Image.new("RGB", (bredd, hojd), "white")
    rit = ImageDraw.Draw(a)
    for r, pid in enumerate(produkter):
        y = r * (ruta + etikett)
        rit.text((6, y + 7), f"{pid}  {T.SLUG[pid]}", fill="black")
        for c in range(5):
            b = Image.open(os.path.join(mapp, f"{pid}-{c+1}.jpg")).convert("RGB")
            a.paste(b.resize((ruta, ruta), Image.LANCZOS), (c * ruta, y + etikett))
            rit.rectangle([c * ruta, y + etikett, c * ruta + ruta - 1,
                           y + etikett + ruta - 1], outline="black")
            rit.text((c * ruta + 6, y + etikett + 6), str(c + 1), fill="red")
    vag = os.path.join(HAR, ut)
    a.save(vag, quality=88)
    return vag, a.size


if __name__ == "__main__":
    m = hamta()
    for namn, del_ in (("kontaktark-1.jpg", ORD[:5]), ("kontaktark-2.jpg", ORD[5:])):
        v, mat = ark(m, del_, namn)
        print(v, mat)
