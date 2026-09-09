# -*- coding: utf-8 -*-
"""Runda 114 — mäter oskärpan per kort.

☠️ RADIEN MÄTS, DEN ÄRVS INTE. Rundan har fem konstruktioner och nio
hjältebilder med helt olika komprimeringsegenskaper: en slät vit plåtdörr, en
khakifärgad plastbox med grov yta, ett svart skåp och fyra små blanka
plastkylar. Bara en av nio sprängde taket vid r=0 — men vilken går inte att
gissa.

☠️ MÄTNINGEN GÅR GENOM BYGGETS EGEN VÄG. Ett utkast som lägger oskärpan på
den redan komprimerade panelfilen gör en JPEG-vända för mycket och
UNDERSKATTAR — runda 112 mätte två kort under taket som sedan hamnade över.
Radien sätts därför i bygg-modulen och `panel()` anropas.
"""
import importlib.util
import os
import shutil
import sys

from PIL import Image

BAS = "/home/user/fyndplats-cache-warmer/tools/polish-assets"
sys.path.insert(0, BAS)
sys.path.insert(0, BAS + "/runda-114")
import kortbygge, cardkit as ck                                    # noqa: E402
import kort as K                                                   # noqa: E402
import matt                                                        # noqa: E402

_s = importlib.util.spec_from_file_location("pf", BAS + "/runda-114/bygg-panelfoton.py")
PF = importlib.util.module_from_spec(_s)
_s.loader.exec_module(PF)

HAR = BAS + "/runda-114"
NYCKLAR = list(matt.WIX)
RADIER = [0.0, 0.5, 1.0, 1.5, 2.0, 3.0, 4.0, 5.0, 6.0, 8.0]


def foto(kort, radie):
    PF.MJUKA[kort] = radie
    sokvag, _, _ = PF.panel(kort)
    if radie == 0.0:
        return sokvag
    v = os.path.join(HAR, "panelfoton", "%s-r%.1f.jpg" % (kort, radie))
    shutil.copy2(sokvag, v)
    return v


def matning(foton):
    namn = []
    for k in NYCKLAR:
        spec = K.specrader(k)
        rr = [(e, kortbygge.varde(spec[i], e)) for e, i in K.RADER[k]]
        ck.card_spec(k + "_spec", foton[k], K.KICKER[k], K.RUBRIK[k], rr, fit=True)
        namn.append(k + "_spec")
    ck.render(namn)
    os.makedirs("jpg", exist_ok=True)
    ut = {}
    for k, n in zip(NYCKLAR, namn):
        im = Image.open("cards/%s.png" % n).convert("RGB").resize((1600, 1600), Image.LANCZOS)
        im.save("jpg/%s.jpg" % n, "JPEG", quality=85, optimize=True, subsampling=0)
        ut[k] = os.path.getsize("jpg/%s.jpg" % n)
    return ut


if __name__ == "__main__":
    basta = {}
    for r in RADIER:
        kvar = [k for k in NYCKLAR if k not in basta]
        if not kvar:
            break
        storlek = matning({k: foto(k, basta.get(k, r)) for k in NYCKLAR})
        for k in kvar:
            if storlek[k] <= kortbygge.TAK_BYTE:
                basta[k] = r
        print("radie %.1f  ->  %s" % (r, "  ".join(
            "%s %6d%s" % (k, storlek[k], "" if k in basta else " ✗") for k in kvar)))
    print("\nMJUKA = %s" % {k: v for k, v in basta.items() if v})
    if len(basta) < len(NYCKLAR):
        print("KLARADE INTE:", [k for k in NYCKLAR if k not in basta])
