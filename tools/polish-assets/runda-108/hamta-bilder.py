# -*- coding: utf-8 -*-
"""Runda 108 Steg 4 — hämtar galleriet och bygger kontaktarket.

Två frågor bara bilderna kan avgöra:
  1. Är färgen i spec-blocket den färg man SER? Familjen har fyra färgnamn
     (vit, natur, brun, svart) på samma konstruktion, och runda 90 lärde att
     en sida kan sälja en färg den inte kan skicka.
  2. Bär någon bild tysk text eller leverantörens logotyp i pixlarna
     (runda 64, runda 89)?
"""
import os, sys, urllib.request
from PIL import Image, ImageDraw

HAR = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HAR, "rawbilder")

GALLERIER = {
 "5f14c112": ["b379ce_ed0c425c1f8e42e5b92e70a788f47cd1~mv2.jpg",
              "b379ce_956ea5900fc44a89ab0c7f8d33ffbfc4~mv2.jpg",
              "b379ce_c718c4ad2fe74fb69b0fa7e17867fcf6~mv2.jpg",
              "b379ce_b6c531cb47414c87ac27a5069219a8f1~mv2.jpg",
              "b379ce_d684fbaae51a4c87ae2d10af79dd0e17~mv2.jpg"],
 "957b042d": ["b379ce_1bf9893e03734d539c11c91c8c3ede09~mv2.jpg",
              "b379ce_6cba5d28d32f4d68a7b320063040fe98~mv2.jpg",
              "b379ce_2e238c2a67c9490b8d2d028d66e251aa~mv2.jpg",
              "b379ce_c85435af985c43dfae736580e4293864~mv2.jpg",
              "b379ce_7e94536d9e394a38885537616a1a5a2a~mv2.jpg"],
 "6649471e": ["b379ce_bbc5ae327f9b4c9fb22d7e252055e284~mv2.jpg",
              "b379ce_88f1f5ee37bf45b992865dddc34b9e0a~mv2.jpg",
              "b379ce_cd0e9a8a9ee04ce9be60fe859ee46143~mv2.jpg",
              "b379ce_6de72a7023a541218e8403fc14bceeaf~mv2.jpg",
              "b379ce_a1048c6960d74899af56b387c6daa632~mv2.jpg"],
 "854371fe": ["b379ce_a16f5348e0c641e495819b8e55727a8f~mv2.jpg",
              "b379ce_bd2a1beea252442c888448fd9a3f4d30~mv2.jpg",
              "b379ce_d7068590cdbb44a28b25e1677dc9126e~mv2.jpg",
              "b379ce_0e2b50f0a9d748b995f616e914d3402b~mv2.jpg",
              "b379ce_3a276ccb63dd41c881481d7e7038f7b7~mv2.jpg"],
 "da1a8a75": ["b379ce_bac32097f6704f72b851d75ce56c1f40~mv2.jpg",
              "b379ce_3fb99a4664d441acb4c5f5f8a210d4ac~mv2.jpg",
              "b379ce_f0db8309417849b095a7a802f8606b4b~mv2.jpg",
              "b379ce_8f98ff5c8f3447a7a8a982705c3a5e3d~mv2.jpg",
              "b379ce_71b09efb75e54eba9926991a37226d81~mv2.jpg"],
 "64c0809d": ["b379ce_db4841b764444acd8396e3da9d07fee2~mv2.jpg",
              "b379ce_638917130ae346d6aca0880337d14123~mv2.jpg",
              "b379ce_513da206c2954ef0b64195c14525a5ca~mv2.jpg",
              "b379ce_40632ce893274dfdb463f736f28d606c~mv2.jpg",
              "b379ce_e8b8b9a9b2af4fc4b369ca549ae89e04~mv2.jpg"],
 # Den PUBLICERADE syskonsidan — med i arket för att kunna se om utkastens
 # foton är samma bilder (dubblettbeviset är måtten, men ögat är billigt).
 "PUBL-d4118d39": ["b379ce_aa22bc2e3c634ce38f875a636186c24c~mv2.jpg",
                   "b379ce_bf2fd58e75b147db9ebefc950f7332e3~mv2.jpg",
                   "b379ce_bde2987e2baa437b9234493e82e73a32~mv2.jpg",
                   "b379ce_61f377d96ef34cdfa3e9864ff1e773f4~mv2.jpg"],
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
            # ☠️ `al_c` är obligatoriskt i transformen — utan den svarar Wix 400.
            # ☠️ Och UA:n är det också: samma adress ger 200 via curl och
            #    **400 via urllib**, som skickar `Python-urllib/3.11`. Felet
            #    ser ut som en trasig bildlänk och är en avvisad klient.
            req = urllib.request.Request(
                BAS + f + "/v1/fit/w_1100,h_1100,al_c,q_85/f.jpg",
                headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=60) as r, open(mal, "wb") as ut:
                ut.write(r.read())
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
