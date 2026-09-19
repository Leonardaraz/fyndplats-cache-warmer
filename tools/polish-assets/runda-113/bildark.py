# -*- coding: utf-8 -*-
"""Runda 113 Steg 4 — kontaktark över ALLA fyrtio bilder.

☠️ RUNDA 112 GRANSKADE MED FEL FRÅGA. Steg 4 letade efter tysk text i
   MÅTTRITNINGEN och missade en sjunde bild som bar den. Frågan här är därför
   ställd om HELA bilden och alla fyra hörnen, inte om en bildtyp:

     1. Finns TEXT i pixlarna? (tyska, engelska, svenska — vilket språk som helst)
     2. Finns en LOGOTYP som INTE sitter fysiskt på varan?
     3. Är bilden en annan produkt än sidans?
"""
import io, sys, urllib.request
from PIL import Image, ImageDraw

BAS = "https://static.wixstatic.com/media/%s/v1/fill/w_520,h_520,al_c,q_88/f.jpg"

BILDER = {
    "8cfe5171": ["b379ce_16f9c2ffe18c431b893c1059567ed0e5~mv2.jpg",
                 "b379ce_1de48f85b68e4c34a4858adb98348588~mv2.jpg",
                 "b379ce_ca2fa703560d4c4bbba301e22c5114d0~mv2.jpg",
                 "b379ce_b088b374a1c14c4391738e67cfa5dbf1~mv2.jpg",
                 "b379ce_130340f67e874ceebe942051e536717a~mv2.jpg"],
    "a33ece7a": ["b379ce_7b8b67da9138416dab17206945d4a580~mv2.jpg",
                 "b379ce_7d989a27cbd24ddbbd900e4552b18b9d~mv2.jpg",
                 "b379ce_321627a9394b43e28a38a709380b7f09~mv2.jpg",
                 "b379ce_f45a46e0d3cd433f85f510246683278c~mv2.jpg",
                 "b379ce_d0ec104030a547ef8d7879ffff36e66d~mv2.jpg"],
    "9a33e15f": ["b379ce_a3b5e96f90a84516a6222e7ab5652276~mv2.jpg",
                 "b379ce_bdca47c9a6104e2a8c7e3727084ff41b~mv2.jpg",
                 "b379ce_25a477f9de234b78bed87668898c4d7a~mv2.jpg",
                 "b379ce_aeedbefa52b14534afadd6514db31cee~mv2.jpg",
                 "b379ce_86d2cac364b04a8397c1c3a90cb2e31f~mv2.jpg"],
    "b2c76518": ["b379ce_388edd9604864bcba20715861e9238f9~mv2.jpg",
                 "b379ce_0e5c796a260d4121b93487b082cc9226~mv2.jpg",
                 "b379ce_3c8d3dd08c524e77af16b2520e53d2ff~mv2.jpg",
                 "b379ce_b6bcbc411c58427d8b9949fce14a5360~mv2.jpg",
                 "b379ce_023e8f2102a74a72b68c9b1272a30eb2~mv2.jpg"],
    "47a91a17": ["b379ce_efb17f9160bd4bd38f22c0b8346631d7~mv2.jpg",
                 "b379ce_4bcc3940a6ce4b8c949fc04bc3ad0572~mv2.jpg",
                 "b379ce_dbb3d6421eec4e019458bffea697290f~mv2.jpg",
                 "b379ce_1c561991689c493fad791e6ae7c45409~mv2.jpg",
                 "b379ce_4f9bc168d6bf46af9b639841a236bf55~mv2.jpg"],
    "15d30e23": ["b379ce_a7b88b85b2344a95bebbbe9d45963cd4~mv2.jpg",
                 "b379ce_bbf8a17a7ddc4e6196a19b04cbf6e396~mv2.jpg",
                 "b379ce_a459fb6bf6714c0a9a29917a0d3b6b3b~mv2.jpg",
                 "b379ce_fcbe0bbea3ca4aa482c3ca0ee61cecfe~mv2.jpg",
                 "b379ce_c8937976492a46c38202bd847f29c297~mv2.jpg"],
    "480849a7": ["b379ce_0f4418fa1eac4183a2045d2dcbede6ab~mv2.jpg",
                 "b379ce_491d83883da94397b37baaab7d04b33a~mv2.jpg",
                 "b379ce_5446e90d7f2d42a18ae938ea40b9870c~mv2.jpg",
                 "b379ce_19d237d4f3a8456097529b5174fbfbd1~mv2.jpg",
                 "b379ce_033b615b5c964793a53b81a9e784a479~mv2.jpg"],
    "fdbfcea0": ["b379ce_6831aeab76244a43aef3c20cfcb6a8d6~mv2.jpg",
                 "b379ce_90d610723a244c2ea9deab87f3f0f3aa~mv2.jpg",
                 "b379ce_75c96b552dc248ed8f0b16d4d0d3a9fe~mv2.jpg",
                 "b379ce_ac0649d79aa046cd9bd345b8ac0af266~mv2.jpg",
                 "b379ce_1cd22588a070471399c22efa48bf390d~mv2.jpg"],
}

R, MARG = 520, 140


def ark(nycklar, filnamn):
    bild = Image.new("RGB", (MARG + R * 5, R * len(nycklar)), "white")
    rit = ImageDraw.Draw(bild)
    for i, k in enumerate(nycklar):
        rit.text((10, i * R + R // 2), k, fill="black")
        for j, f in enumerate(BILDER[k]):
            req = urllib.request.Request(BAS % f, headers={"User-Agent": "Mozilla/5.0"})
            b = Image.open(io.BytesIO(urllib.request.urlopen(req, timeout=90).read())).convert("RGB")
            bild.paste(b.resize((R, R)), (MARG + j * R, i * R))
            rit.text((MARG + j * R + 6, i * R + 6), "%d" % (j + 1), fill="red")
        rit.line([(0, i * R), (bild.width, i * R)], fill="black", width=3)
    bild.save(filnamn, quality=86)
    print(filnamn, bild.size)


if __name__ == "__main__":
    ark(["8cfe5171", "a33ece7a", "9a33e15f", "b2c76518"], "bildark-frysar.jpg")
    ark(["47a91a17", "15d30e23", "480849a7", "fdbfcea0"], "bildark-vinkylar.jpg")
