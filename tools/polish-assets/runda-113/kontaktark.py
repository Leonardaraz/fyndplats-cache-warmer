# -*- coding: utf-8 -*-
"""Kontaktark: de fem 35 L-minifrysarna mot den PUBLICERADE minifrysen.

Måttgrinden ger 3/3 på alla fem — samma kabinett. Frågan pixelgrinden inte kan
svara på är om 161 W-raderna är en ANNAN modell eller samma vara listad två
gånger. Det avgörs på bilden, inte på talen.
"""
import io, urllib.request
from PIL import Image, ImageDraw

BAS = "https://static.wixstatic.com/media/%s/v1/fill/w_320,h_320,al_c,q_80/f.jpg"

RADER = [
    ("d4e79563  PUBLICERAD  vit 45 W", ["b379ce_ee87e66c613a4826b9d06ccf6f5dcea9~mv2.jpg",
                                        "b379ce_792e98a402d747729f75f76a8e065aee~mv2.jpg",
                                        "b379ce_6f54ba3ca9654056a0da1f1956b7422f~mv2.jpg"]),
    ("da0e9379  utkast  vit 45 W", ["b379ce_e79aac26569047079c41c464e4cb86b5~mv2.jpg",
                                    "b379ce_b754e17851e443158f1b1f0cf2ccafe4~mv2.jpg",
                                    "b379ce_2ef52a215a1d488a885dff48534b0921~mv2.jpg"]),
    ("8cfe5171  utkast  vit 161 W", ["b379ce_16f9c2ffe18c431b893c1059567ed0e5~mv2.jpg",
                                     "b379ce_1de48f85b68e4c34a4858adb98348588~mv2.jpg",
                                     "b379ce_ca2fa703560d4c4bbba301e22c5114d0~mv2.jpg"]),
    ("a33ece7a  utkast  gra 161 W", ["b379ce_7b8b67da9138416dab17206945d4a580~mv2.jpg",
                                     "b379ce_7d989a27cbd24ddbbd900e4552b18b9d~mv2.jpg",
                                     "b379ce_321627a9394b43e28a38a709380b7f09~mv2.jpg"]),
    ("9a33e15f  utkast  silver 45 W", ["b379ce_a3b5e96f90a84516a6222e7ab5652276~mv2.jpg",
                                       "b379ce_bdca47c9a6104e2a8c7e3727084ff41b~mv2.jpg",
                                       "b379ce_25a477f9de234b78bed87668898c4d7a~mv2.jpg"]),
    ("b2c76518  utkast  svart 45 W", ["b379ce_388edd9604864bcba20715861e9238f9~mv2.jpg",
                                      "b379ce_0e5c796a260d4121b93487b082cc9226~mv2.jpg",
                                      "b379ce_3c8d3dd08c524e77af16b2520e53d2ff~mv2.jpg"]),
]

R, MARG = 320, 230
ark = Image.new("RGB", (MARG + R * 3, R * len(RADER)), "white")
rit = ImageDraw.Draw(ark)
for i, (namn, filer) in enumerate(RADER):
    rit.text((12, i * R + 150), namn, fill="black")
    for j, f in enumerate(filer):
        req = urllib.request.Request(BAS % f, headers={"User-Agent": "Mozilla/5.0"})
        b = Image.open(io.BytesIO(urllib.request.urlopen(req, timeout=90).read())).convert("RGB")
        ark.paste(b.resize((R, R)), (MARG + j * R, i * R))
    rit.line([(0, i * R), (ark.width, i * R)], fill="black", width=2)
ark.save("kontaktark-35l.jpg", quality=88)
print("kontaktark-35l.jpg", ark.size)
