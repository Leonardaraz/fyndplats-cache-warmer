# -*- coding: utf-8 -*-
"""Runda 115 Steg 4 — ladda hem alla fem bilderna per produkt och bygg ark.

☠️ FRÅGAN SKA STÄLLAS RÄTT. Runda 112 missade en sjunde tysk bild för att den
   granskades med frågan "är den snygg?" i stället för "står det ord i
   pixlarna?". Arken byggs därför per PRODUKT med positionsnummer utskrivna,
   och granskas med en fråga i taget:
     1. står det TEXT i bilden (tyska, engelska, vad som helst)?
     2. bär den ett VARUMÄRKE som inte är licensierat i leverantörstexten?
     3. visar den en ANNAN färg/variant än huvudbilden?
"""
import os
import sys
import urllib.request

from PIL import Image, ImageDraw

HAR = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HAR, "rawbilder")
BAS = "https://static.wixstatic.com/media/%s/v1/fill/w_600,h_600,al_c,q_88/f.jpg"

BILDER = {
 "cc6b56f9": ["b379ce_d2b79ebbe08541d49beddcafbbf7c971~mv2.jpg","b379ce_e9f2a5e26dd84bb9b4bc1f140299bb2d~mv2.jpg","b379ce_b3477afc86ac40fba3129b5b6130b745~mv2.jpg","b379ce_2664ad9dd3a047e087eac6cdf8e9dea3~mv2.jpg","b379ce_80e057e2b477417fbb1ae17a8dc19ad5~mv2.jpg"],
 "fb142c5c": ["b379ce_280eb3b9ac3649de99ad8725bb7a3b70~mv2.jpg","b379ce_d06de63ea3574ee5b0948c230b786850~mv2.jpg","b379ce_668022b31eda4ea988606b8ec7c5abf6~mv2.jpg","b379ce_52af6e2859444cabac8425f625e63304~mv2.jpg","b379ce_2b9a77aa63f24c37850c0430e29f1ebc~mv2.jpg"],
 "738ca991": ["b379ce_db30262e57684cd6ba77d5cab3846092~mv2.jpg","b379ce_82d42cb4ff9f4827a5db88c864bdf13c~mv2.jpg","b379ce_461e8b3a7e0540ce9e982f5fd1f1348f~mv2.jpg","b379ce_072a32d696bb441c955ddfb0219e2151~mv2.jpg","b379ce_d987ed454cca45c6bd04c92abc308cdf~mv2.jpg"],
 "0c05c1a0": ["b379ce_569047a821a647878e05b9932880ab2d~mv2.jpg","b379ce_43276cc8eb774b09a0f6df0199765446~mv2.jpg","b379ce_4854f654dfbe4f3e80c40e608612c901~mv2.jpg","b379ce_d04ccf5523784293a8310945a0695ffc~mv2.jpg","b379ce_a48a222f7aa5470ca91877b80ae18069~mv2.jpg"],
 "23ba27a5": ["b379ce_fae3ffcd204d41eaa1cb06ad5ff8639c~mv2.jpg","b379ce_82094fa7592446038a37c50fd4507d32~mv2.jpg","b379ce_a12e2e381a93450db4c30b163d7078e5~mv2.jpg","b379ce_563f85d8eb92492aabfd4d44a25aa3f4~mv2.jpg","b379ce_32ca2ebbcbb94550a820909f980822b3~mv2.jpg"],
 "39d85f18": ["b379ce_1f1b9ddf591f4af1837865559b25d9d0~mv2.jpg","b379ce_796434703cf34dbaa47dc67f2e708e87~mv2.jpg","b379ce_bbc0055c04734380976955d47cab24b4~mv2.jpg","b379ce_e642624b94ac4bbc93de5e9ecabdde0e~mv2.jpg","b379ce_16af58132cd545b096feeb0e09637094~mv2.jpg"],
 "389ac5ac": ["b379ce_b6b2bc281da5493ca08ad960a5e8973a~mv2.jpg","b379ce_3b7ed3aba38a49d5894c62b8b66cfd9c~mv2.jpg","b379ce_567dd4e89d39485bb4a2b7759bb65234~mv2.jpg","b379ce_f64c5182d49942c389197be1581a36cd~mv2.jpg","b379ce_76e12edc7f404b5280bed12cb858c9a0~mv2.jpg"],
}


def hamta(fid):
    os.makedirs(RAW, exist_ok=True)
    f = os.path.join(RAW, fid.split("_")[1].split("~")[0] + ".jpg")
    if not os.path.exists(f):
        with urllib.request.urlopen(BAS % fid, timeout=90) as r:
            open(f, "wb").write(r.read())
    return f


def ark(nyckel):
    C = 380
    im = Image.new("RGB", (5 * C + 10, C + 34), "white")
    d = ImageDraw.Draw(im)
    for i, fid in enumerate(BILDER[nyckel]):
        im.paste(Image.open(hamta(fid)).convert("RGB").resize((C - 8, C - 8)),
                 (5 + i * C, 26))
        d.text((9 + i * C, 6), f"{nyckel}  bild {i + 1}", fill="black")
    ut = os.path.join(HAR, f"bildark-{nyckel}.jpg")
    im.save(ut, quality=90)
    return ut


if __name__ == "__main__":
    for k in (sys.argv[1:] or BILDER):
        print(ark(k))
