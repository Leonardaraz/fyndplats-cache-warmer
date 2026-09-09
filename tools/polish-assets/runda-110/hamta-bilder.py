# -*- coding: utf-8 -*-
"""Runda 110 Steg 4 — sex vikskärmar i trä och bambu, tre konstruktioner.

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
 # A — vävt mönster på tallram, 180 × 1,7 × 180
 "a999f2b1": ["b379ce_6ed81cc0c2ca479e98e38e202c10ea3e~mv2.jpg",
              "b379ce_0e1ee56e042f42098764fd029a280854~mv2.jpg",
              "b379ce_b9983f9cbd1c47d1ab16fcdff990a152~mv2.jpg",
              "b379ce_8bf5f8db51a54d10bf6a9b7095ef0c99~mv2.jpg",
              "b379ce_cca9bbcfe5d040bdbfbbbdac390669ac~mv2.jpg"],
 "c35f9d4f": ["b379ce_514d90fe161946079e2109e522004e8f~mv2.jpg",
              "b379ce_0022f05465b74d0d93be049c3e2ee004~mv2.jpg",
              "b379ce_4bcb9c3fc7fb43e8be1508f62d69942f~mv2.jpg",
              "b379ce_5da3371be4af4f879acce76c6e813a42~mv2.jpg",
              "b379ce_4979101d9ecd460fab983999b8aa2abd~mv2.jpg"],
 # B — bambu, 180 × 180
 "d72bde5e": ["b379ce_23c3191e28f94ef6bb17bc1ca317d505~mv2.jpg",
              "b379ce_fb0ec6bddc1f4d23912a86685b80c532~mv2.jpg",
              "b379ce_877704b9e1ce46ad9bc073bc10194733~mv2.jpg",
              "b379ce_53e4cd15e2fa47ec919cc720fef053d1~mv2.jpg",
              "b379ce_e0f9034e0f70414ba28f3d249931bef7~mv2.jpg"],
 "316f9945": ["b379ce_f2c703e769f04cd2a44c3977d0a95667~mv2.jpg",
              "b379ce_23a0fc134fc7469696e4456376c5cb5f~mv2.jpg",
              "b379ce_e0eb09c658da4f4c9b6f107d431a239f~mv2.jpg",
              "b379ce_c5b733102f8f4bab9684d6dc5770658c~mv2.jpg",
              "b379ce_7df8a20eaec0498d8b200dea77197e55~mv2.jpg"],
 # C — bambu, 170 hög
 "f8fd1b62": ["b379ce_d4671000cee142da9ff635e06cfd1dd8~mv2.jpg",
              "b379ce_afd2211fabad4065bcd36acce59af7f6~mv2.jpg",
              "b379ce_eeabac1b621445f9a915a9d149131750~mv2.jpg",
              "b379ce_a18789d03749406da5c25b276fec9ca7~mv2.jpg",
              "b379ce_cc8560eddf5f45588cd23e7a78400b80~mv2.jpg"],
 "309076e2": ["b379ce_30aafb1c105b44929f07bf1eeeeacf85~mv2.jpg",
              "b379ce_47d4d3669e204fef96c806442d85d62a~mv2.jpg",
              "b379ce_6da4dc1fa11641bd8602b6625609ce9b~mv2.jpg",
              "b379ce_addc56021acf4edeba55484be76f27b0~mv2.jpg",
              "b379ce_4523cd0c86e64650b2c7da8229ba2b04~mv2.jpg"],
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
