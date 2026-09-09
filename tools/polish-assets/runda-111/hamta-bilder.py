# -*- coding: utf-8 -*-
"""Runda 111 Steg 4 — sju rumsavdelare i SEX konstruktioner.

Rundan är familjens svans, och den är inte en familj i vanlig mening: sju
produkter som delar produkttyp men inte konstruktion. Bilderna ska därför
svara på tre frågor, inte två:

  1. Är färgen i spec-blocket den färg man SER?
  2. Bär någon bild tysk text eller leverantörens logotyp i pixlarna?
  3. ☠️ VAD ÄR PANELEN GJORD AV? Grupp D:s spec-block säger bara
     `Kiefernholz` medan den tyska brödtexten säger `Kiefernholz und Stoff`.
     Exakt samma lucka som runda 110 mätte upp på grupp A, där väven var
     POLYPROPEN och spec-blocket bara sa trä.

⚠️ `79b349f7` har tre bilder med `width: 0, height: 0` i mediasvaret. Det är
   metadata, inte innehåll — men det ska KONTROLLERAS, inte antas: en fil med
   noll storlek kan också vara en trasig uppladdning.
"""
import os, urllib.request
from PIL import Image, ImageDraw

HAR = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HAR, "rawbilder")

GALLERIER = {
 # D1 — tall + tyg, gitterdesign. Samma modell i två storlekar.
 "e858810e": ["b379ce_32ebb9d7981945da93690c8df826f75a~mv2.jpg",
              "b379ce_d89765d9508c4bb9a695f76ba55d7e22~mv2.jpg",
              "b379ce_7f43470a5bcd4c45998bcafa3669cd7d~mv2.jpg",
              "b379ce_783b72ad30e74941ac2478aceadcaa49~mv2.jpg",
              "b379ce_0241f69e16854840bfade89d0e3a2d58~mv2.jpg"],
 "f641d190": ["b379ce_25ff8613add64a6a9f13dfa97878f8e6~mv2.jpg",
              "b379ce_5af69890d9ad4ee390559b123dd639ad~mv2.jpg",
              "b379ce_b911df052149489f85a062960e87a90f~mv2.jpg",
              "b379ce_4fa1e70a4ea545e9a5491543bce70251~mv2.jpg",
              "b379ce_35bd8f3624fa42129bf808283a6c1cbb~mv2.jpg"],
 # D2 — vliestyg + tall, palmbladstryck
 "1c1eb875": ["b379ce_5bedf0c792554422b4315bfcb3ff2259~mv2.jpg",
              "b379ce_c0927d46a14c4383b4f1b3a2c5b45f0e~mv2.jpg",
              "b379ce_cbc787ab0cfb4e0898425c0833e3aa31~mv2.jpg",
              "b379ce_23078ce2d61841958519629eb25f0782~mv2.jpg",
              "b379ce_39a5fb0613304a45bfe97c263e49d30b~mv2.jpg"],
 # E1 — handflätat pappersrep på tall, bågformad topp
 "23d20823": ["b379ce_1332b2989c604e049544a9d132d60c39~mv2.jpg",
              "b379ce_123a5efb74044405b0c5394a24a6d274~mv2.jpg",
              "b379ce_42cb386dce394a8eac9b9a46b0b48c44~mv2.jpg",
              "b379ce_89435ab7043d4b98a15974dccfddd3a5~mv2.jpg",
              "b379ce_8cc8d5bb7c1d4291a6d29cc7f255a53e~mv2.jpg"],
 # E2 — tall/bambu/pappersfiber MED TVÅ HYLLOR
 "db70e38c": ["b379ce_87810c65bc424c8c86d206115b286293~mv2.jpg",
              "b379ce_1627883110084363af885d55f9dfa969~mv2.jpg",
              "b379ce_b2063f2b0372499c8dd5220a9297d478~mv2.jpg",
              "b379ce_58939544881b4354adbde14b81c1bdfd~mv2.jpg",
              "b379ce_cd7fc74ab7544c5fba4b6c3498db108d~mv2.jpg"],
 # F1 — stål + polyester, 12 hjul, klipsbara paneler
 "79b349f7": ["b379ce_bce3f6a0d6d04a01aa9ed74012f72bdf~mv2.jpg",
              "b379ce_5d68b2c0b757402aabff0af44d3d1351~mv2.jpg",
              "b379ce_fda2290eae3b4d3ebf10d82761c0d1a0~mv2.jpg",
              "b379ce_9a19a665f3aa4077871aac79d7a5ce00~mv2.jpg",
              "b379ce_fd15a6776d71419d81309e6033a3459c~mv2.jpg"],
 # F2 — metall + polyester, 3 paneler
 "99040238": ["b379ce_4008ecc5d1e44be092b3469f68ddab26~mv2.jpg",
              "b379ce_70159eeaef124d9e9d86e2b44ebb4be9~mv2.jpg",
              "b379ce_19f3c73c465b45d0a5305196533ae6dd~mv2.jpg",
              "b379ce_b3d527c1ece54f61ae3aef0a4343c235~mv2.jpg",
              "b379ce_d259a212bf0c483eb0234ae5d2b6296d~mv2.jpg"],
}
BAS = "https://static.wixstatic.com/media/"
RUTA = 420


def hamta():
    os.makedirs(RAW, exist_ok=True)
    for kort, filer in GALLERIER.items():
        for i, f in enumerate(filer, 1):
            mal = os.path.join(RAW, "%s-%d.jpg" % (kort, i))
            if os.path.exists(mal) and os.path.getsize(mal) > 5000:
                continue
            urllib.request.urlretrieve(BAS + f, mal)


def kontaktark(ut="kontaktark.jpg"):
    rader = list(GALLERIER)
    kol = max(len(v) for v in GALLERIER.values())
    ark = Image.new("RGB", (kol * RUTA, len(rader) * (RUTA + 26)), "white")
    d = ImageDraw.Draw(ark)
    for r, kort in enumerate(rader):
        y = r * (RUTA + 26)
        d.text((6, y + 6), kort, fill="black")
        for c in range(len(GALLERIER[kort])):
            p = os.path.join(RAW, "%s-%d.jpg" % (kort, c + 1))
            im = Image.open(p).convert("RGB")
            im.thumbnail((RUTA, RUTA), Image.LANCZOS)
            ark.paste(im, (c * RUTA, y + 26))
            d.text((c * RUTA + 6, y + 30), "%d" % (c + 1), fill="red")
    ark.save(ut, "JPEG", quality=88)
    return ut


if __name__ == "__main__":
    hamta()
    # ☠️ KONTROLLMÄTNING: en trasig hämtning ser ut som en tom bild, inte som
    #    ett fel. Storlek OCH pixelmått läses innan arket byggs.
    for kort, filer in GALLERIER.items():
        for i in range(1, len(filer) + 1):
            p = os.path.join(RAW, "%s-%d.jpg" % (kort, i))
            b = os.path.getsize(p)
            w, h = Image.open(p).size
            flagga = "  ✗ MISSTÄNKT" if (b < 20000 or w < 400) else ""
            print("%s-%d  %7d byte  %d×%d%s" % (kort, i, b, w, h, flagga))
    print("\n" + kontaktark())
