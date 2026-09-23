# -*- coding: utf-8 -*-
"""Runda 112 Steg 4 — nio projektordukar i fem konstruktioner.

Bilderna ska svara på fyra frågor, och tre av dem är MÄTNINGAR som avgör
vad texten får säga:

  1. ☠️ ÄR `1b87909f` 100 ELLER 120 TUM? Namnet säger 100, brödtexten säger
     120 tre gånger, och geometrin (263 × 148 cm) säger 118,8 — alltså 120.
     Bilden är tredje rösten.
  2. ☠️ VIKS `1b87909f` ELLER RULLAS DEN? Duken är 263 cm bred och paketet
     86 cm. Går den inte att vika är ett av talen fel.
  3. ☠️ ÄR GRUPP D ETT GOLVSTATIV SOM DRAS UPP? Texten säger `Metallstruktur
     mit verstellbarer Höhe`, `Länge des Metallgehäuses 180 cm` och
     `Maximale Höhe 2,03 m`. Det kan lika gärna vara en väggduk vars
     monteringshöjd är valfri — och de två är olika produkter för kunden.
  4. Bär någon bild tysk text eller leverantörens logotyp i pixlarna?
"""
import os, urllib.request
from PIL import Image, ImageDraw

HAR = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HAR, "rawbilder")

GALLERIER = {
 # A — stativduk, 16:9, portabel
 "1b87909f": ["b379ce_63d5bb13abaa468eaf387c325a4a3a6e~mv2.jpg",
              "b379ce_254d0075388741198a858a400f86862b~mv2.jpg",
              "b379ce_a8070bf1b65e4494ace0c4606dc918d7~mv2.jpg",
              "b379ce_bae5ec658f63478282a5edbb5774219e~mv2.jpg",
              "b379ce_09621a0243154794a7fbdb8a6cdc1331~mv2.jpg"],
 # B — motoriserad kassett, 1:1
 "422ab1bd": ["b379ce_e8664fef306142a3a735330d24e9aeb7~mv2.jpg",
              "b379ce_80263a7edc0342ffa7e4ed7b35f894db~mv2.jpg",
              "b379ce_dd0d9fda9ff84194a36169e7771ff022~mv2.jpg",
              "b379ce_46ee670413d3479c988598ce759a7168~mv2.jpg",
              "b379ce_10286c6cd73a49f0b94d21a99e8f8c45~mv2.jpg"],
 "a8c82049": ["b379ce_c91c9790829f4d498e6ad9fabcd4c849~mv2.jpg",
              "b379ce_3442c02a8c43445ead84d896c7155a17~mv2.jpg",
              "b379ce_bdf84f1e84d24f578358816046e21f14~mv2.jpg",
              "b379ce_c05094f82310440c82ffec1ee326d239~mv2.jpg",
              "b379ce_9507dc5bfb6241f3a3dfaa8f5f415dbc~mv2.jpg"],
 # C — manuell rullduk med autolås
 "ddca577d": ["b379ce_022c67b758874df890d233a7e197d4cd~mv2.jpg",
              "b379ce_7b786c024f5a41e1830b678b3865293d~mv2.jpg",
              "b379ce_8222dda6205744388dd41bfeca38c419~mv2.jpg",
              "b379ce_8e6b7358a3fd45b8b594f1755d40f317~mv2.jpg",
              "b379ce_1286ae60f1334f7aad000f233f47f2a0~mv2.jpg"],
 "77d2b35c": ["b379ce_915a2b65ec174d8ebe6db2538be0e994~mv2.jpg",
              "b379ce_0b51f00d15804b60854a5fdc0b11f8ac~mv2.jpg",
              "b379ce_26f714a277c34fa89e2d21e0ad9692f7~mv2.jpg",
              "b379ce_cbb45fa0378449e686f4621442851036~mv2.jpg",
              "b379ce_28e9420f3e2c4e9ea1bc1c04315be9f9~mv2.jpg"],
 # D — golvstativ, 4:3 (färgpar)
 "0370673c": ["b379ce_3e393edb6c4b44bbab303a13d25c76f2~mv2.jpg",
              "b379ce_e7127e1f08554af1a3283abdf07facae~mv2.jpg",
              "b379ce_18f26b5ddebb484d9fd58b794da9d600~mv2.jpg",
              "b379ce_c64c3b4758cb4928a1d5abb2a286046b~mv2.jpg",
              "b379ce_0b9599fef1b041d6bc28380b3d3a0adc~mv2.jpg"],
 "fe11166f": ["b379ce_949ab881556c45aaa057c52b27634b2a~mv2.jpg",
              "b379ce_e940125506e44d89ab3ddf55294dee9a~mv2.jpg",
              "b379ce_ecfc17202861441286753a24a1582f34~mv2.jpg",
              "b379ce_558ddf8346be45a3910226bb84134065~mv2.jpg",
              "b379ce_81400c70cb934e8aaefb3d3e60b2fb93~mv2.jpg"],
 # E — motoriserad kassett, 4:3 (färgpar)
 "623b6504": ["b379ce_0f05819ed3d74d3eb001aa20c49ddae0~mv2.jpg",
              "b379ce_bcd630942b134a3f8b5918ee6a6607d9~mv2.jpg",
              "b379ce_6ff3e7e73fef459cb2b5ffc1225e74b4~mv2.jpg",
              "b379ce_90710fdd70824ed2896ba739f61cd3e0~mv2.jpg",
              "b379ce_4f107a50366b4354956c81acff995d88~mv2.jpg"],
 "77e4a558": ["b379ce_184a271c679f4abca31f68be5e828ae8~mv2.jpg",
              "b379ce_c3cc0f442b6949e3997d7ead35af6357~mv2.jpg",
              "b379ce_bc7f42a6b38745f0873d709d8aeedddd~mv2.jpg",
              "b379ce_32ebdf5e3f9949be908a7637904bd577~mv2.jpg",
              "b379ce_1fc3a2dd14504ea98467d71eeadae5d8~mv2.jpg"],
}

BAS = "https://static.wixstatic.com/media/"


def hamta():
    os.makedirs(RAW, exist_ok=True)
    n, matt = 0, []
    for k, filer in GALLERIER.items():
        for i, f in enumerate(filer, 1):
            ut = os.path.join(RAW, f"{k}-{i}.jpg")
            if not os.path.exists(ut):
                urllib.request.urlretrieve(BAS + f, ut)
                n += 1
            # ☠️ KONTROLLMÄTNING: en fil med noll storlek är en trasig hämtning,
            #    inte en tom bild. Storlek och pixelmått läses, inte antas.
            im = Image.open(ut)
            matt.append((f"{k}-{i}", os.path.getsize(ut), im.size))
    print(f"hämtade {n} nya, {len(matt)} filer totalt")
    dåliga = [m for m in matt if m[1] < 5000 or min(m[2]) < 200]
    print(f"misstänkta filer: {len(dåliga)}")
    for d in dåliga:
        print("   ✗", d)
    return matt


def kontaktark():
    """Alla 45 bilder i ett ark, en rad per produkt."""
    RUT, MARG = 260, 26
    kol = max(len(v) for v in GALLERIER.values())
    rad = len(GALLERIER)
    ark = Image.new("RGB", (kol * RUT + MARG * 2 + 120, rad * (RUT + 22) + MARG * 2), "white")
    d = ImageDraw.Draw(ark)
    for r, (k, filer) in enumerate(GALLERIER.items()):
        y = MARG + r * (RUT + 22)
        d.text((6, y + RUT // 2), k, fill="black")
        for c in range(len(filer)):
            im = Image.open(os.path.join(RAW, f"{k}-{c + 1}.jpg")).convert("RGB")
            im.thumbnail((RUT, RUT), Image.LANCZOS)
            ark.paste(im, (120 + MARG + c * RUT + (RUT - im.width) // 2, y))
            d.text((120 + MARG + c * RUT + 4, y + RUT + 4), f"{c + 1}", fill="black")
    ark.save(os.path.join(HAR, "kontaktark.jpg"), "JPEG", quality=88)
    print("kontaktark.jpg skrivet")


if __name__ == "__main__":
    hamta()
    kontaktark()
