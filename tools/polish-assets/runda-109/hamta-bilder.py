# -*- coding: utf-8 -*-
"""Runda 109 Steg 4 — galleriet för de två sexpanelsfärgerna vit och svart.

Rundan lägger till de två färger som saknades i familjen. Kontaktarket bär
dem tillsammans med den PUBLICERADE d4118d39, vars sida de ersätter — dess
bild 1 är svart och bild 2 är vit, alltså exakt de två varor som nu får var
sin egen sida.

Två frågor bara bilderna kan avgöra (samma två som runda 108):
  1. Är färgen i spec-blocket den färg man SER?
  2. Bär någon bild tysk text eller leverantörens logotyp i pixlarna?
"""
import os, urllib.request
from PIL import Image, ImageDraw

HAR = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HAR, "rawbilder")

GALLERIER = {
 "ffb5239f": ["b379ce_f4f8fa1cef834ac6a41559bdae708f80~mv2.jpg",
              "b379ce_0bce4494140d4816b5e9e770c3ba601d~mv2.jpg",
              "b379ce_fd3b2c7e365a4a57b95e32a45880b9e7~mv2.jpg",
              "b379ce_9ffa5049c6c8465bba32947d8a4e3b3b~mv2.jpg",
              "b379ce_1b90837fea5347b290ce7a49a758fc72~mv2.jpg"],
 "7bd4f691": ["b379ce_8985b8b2094d4346b69bd8be3e6c00af~mv2.jpg",
              "b379ce_eb28232eb6874cb9888d776240fe4343~mv2.jpg",
              "b379ce_c646a0724c104e68ba947e579a696cda~mv2.jpg",
              "b379ce_563819e00e34496886d3991361bc6e06~mv2.jpg",
              "b379ce_72379767c7974d6c90fa24d853297c98~mv2.jpg"],
 # Den sida de två ersätter. Bild 1 svart, bild 2 vit, bild 3 miljö, 4 ritning.
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
            # ☠️ `al_c` är obligatoriskt i transformen, och UA:n likaså —
            #    samma adress ger 200 via curl och 400 via urllib.
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
