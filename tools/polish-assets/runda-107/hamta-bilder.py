# -*- coding: utf-8 -*-
"""Runda 107 Steg 4 — hämtar hela galleriet och bygger kontaktarket.

☠️ Kontaktarket är det enda som kan avgöra rundans två öppna frågor:
   1. Har modell S (525e6acf / 079f2901) botten eller inte? Syskonens tyska
      texter säger emot varandra: 'bodenlosem Design' mot 'Herausnehmbare
      Bodenwanne'. En text som motsäger sin tvilling avgör ingenting.
   2. Bär någon bild leverantörens logotyp inbränd i pixlarna (runda 64)?
"""
import os, sys, urllib.request
from PIL import Image, ImageDraw

HAR = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HAR, "rawbilder")

GALLERIER = {
 "a75fcfde": ["b379ce_1b867da6a11d4e04ac056efa32b6b0f5~mv2.jpg",
              "b379ce_99a87ecc9a864e7f916616d118c18891~mv2.jpg",
              "b379ce_16be73dd6790435c811f65bb61e8021e~mv2.jpg",
              "b379ce_c17cb61e69044235be76c2e013996db7~mv2.jpg",
              "b379ce_1c2268a469774981899e453fcdaee80b~mv2.jpg"],
 "c0770388": ["b379ce_7f5946605e41450eb41952f5809e4c52~mv2.jpg",
              "b379ce_596e138557954e608a3d727d0e857fa1~mv2.jpg",
              "b379ce_a86c4051b63045e6981a62c0942554c2~mv2.jpg",
              "b379ce_e5546c112e1e419eab3e742f4fbafb13~mv2.jpg",
              "b379ce_9f3053a33130406ea406ddd139fe60fd~mv2.jpg"],
 "2253c509": ["b379ce_b5e8dc83d2074a15a3c45bc2a3771487~mv2.jpg",
              "b379ce_1b55748f1f764f828fd86b83bb590077~mv2.jpg",
              "b379ce_750bac15a3e54d64b372810b0d7efc35~mv2.jpg",
              "b379ce_138f921681b1419c88dba149e35aed90~mv2.jpg",
              "b379ce_8931a575b7094265990eadaa9067b81a~mv2.jpg"],
 "2435c4d1": ["b379ce_7a6674f3556c4a7aba5f492ea0b0ca44~mv2.jpg",
              "b379ce_ce9918106b59403d8117a3b595374266~mv2.jpg",
              "b379ce_4445eb6096eb4fe882651dffbccc0dd7~mv2.jpg",
              "b379ce_bd217737e96147c196fb88b2ce893379~mv2.jpg",
              "b379ce_111ec74c163a45b696d8b8298224f787~mv2.jpg"],
 "dcdf889d": ["b379ce_e66395daf3c045b3b03c2f869631797a~mv2.jpg",
              "b379ce_df4336b781cd48e7bb1747dcca665d4a~mv2.jpg",
              "b379ce_524f7872e46847cca283df01fd025b1a~mv2.jpg",
              "b379ce_b8a75f12584d4e3996fc42b910b8eee7~mv2.jpg",
              "b379ce_2b2375f3539645ad843d7053b25bd583~mv2.jpg"],
 "525e6acf": ["b379ce_5cc58255e205479393a8da254a478093~mv2.jpg",
              "b379ce_2e8bb8ce4c61422392cf24fee4e66d9a~mv2.jpg",
              "b379ce_7b924888fcac450cb3623489e1130b5a~mv2.jpg",
              "b379ce_59a0e65764664cfdbf350e8fd218a4d8~mv2.jpg",
              "b379ce_b3b513955e9e4fe9b78a7ef0d082043a~mv2.jpg"],
 "079f2901": ["b379ce_ca5cd594d93b4e209b09522a0455d0a0~mv2.jpg",
              "b379ce_e7829924665442198e13d62316adc407~mv2.jpg",
              "b379ce_295b16f0124b4d5686ef1109954c9afa~mv2.jpg",
              "b379ce_7eb39acd41df4fe795eff8b6b41f80c2~mv2.jpg",
              "b379ce_5242af48bb074ce3a6bedae2177325c4~mv2.jpg"],
}
BAS = "https://static.wixstatic.com/media/"
RUTA = 420


def hamta():
    os.makedirs(RAW, exist_ok=True)
    for kort, filer in GALLERIER.items():
        for i, f in enumerate(filer, 1):
            mal = os.path.join(RAW, "%s-%d.jpg" % (kort, i))
            if os.path.exists(mal):
                continue
            url = BAS + f + "/v1/fit/w_1100,h_1100,al_c,q_85/f.jpg"
            urllib.request.urlretrieve(url, mal)
    return sum(len(v) for v in GALLERIER.values())


def kontaktark():
    kort = list(GALLERIER)
    rader, kolumner = len(kort), max(len(v) for v in GALLERIER.values())
    ark = Image.new("RGB", (kolumner * RUTA, rader * (RUTA + 26)), "white")
    rit = ImageDraw.Draw(ark)
    for r, k in enumerate(kort):
        y = r * (RUTA + 26)
        rit.text((4, y + 6), k, fill="black")
        for c in range(len(GALLERIER[k])):
            im = Image.open(os.path.join(RAW, "%s-%d.jpg" % (k, c + 1))).convert("RGB")
            im.thumbnail((RUTA, RUTA))
            ark.paste(im, (c * RUTA + (RUTA - im.width) // 2, y + 26))
            rit.text((c * RUTA + 4, y + 8), "  %d" % (c + 1), fill="#888")
    sokvag = os.path.join(HAR, "kontaktark.jpg")
    ark.save(sokvag, "JPEG", quality=82)
    return sokvag, ark.size


if __name__ == "__main__":
    n = hamta()
    s, storlek = kontaktark()
    print("%d bilder hämtade -> %s  %d×%d" % (n, s, storlek[0], storlek[1]))
