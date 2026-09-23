# -*- coding: utf-8 -*-
"""Runda 111 — mäter oskärpan per kort.

☠️ RADIEN MÄTS, DEN ÄRVS INTE. Sex konstruktioner komprimerar helt olika: en
slät grå polyesterduk kostar nästan ingenting i byte, en handflätad väv
kostar mycket. Fyra av sju kort klarar taket utan någon oskärpa alls.
"""
import importlib.util, os, sys
from PIL import Image, ImageFilter

BAS = "/home/user/fyndplats-cache-warmer/tools/polish-assets"
sys.path.insert(0, BAS); sys.path.insert(0, BAS + "/runda-111")
import kortbygge, cardkit as ck                                    # noqa
import kort as K                                                   # noqa
import matt                                                        # noqa

_s = importlib.util.spec_from_file_location("pf", BAS + "/runda-111/bygg-panelfoton.py")
PF = importlib.util.module_from_spec(_s); _s.loader.exec_module(PF)

HAR = BAS + "/runda-111"
NYCKLAR = list(matt.RUNDAN)
RADIER = [0.0, 0.5, 1.0, 1.5, 2.0, 3.0, 4.0]


def foto(kort, radie):
    sokvag, _, _ = PF.panel(kort, 1.0)
    if radie == 0.0:
        return sokvag
    v = os.path.join(HAR, "panelfoton", "%s-r%.1f.jpg" % (kort, radie))
    Image.open(sokvag).filter(ImageFilter.GaussianBlur(radie)).save(v, "JPEG", quality=94)
    return v


def matning(foton):
    namn = []
    for k in NYCKLAR:
        spec = K.specrader(k)
        rr = [(e, kortbygge.varde(spec[i], e)) for e, i in K.RADER[k]]
        ck.card_spec(k + "_spec", foton[k], K.KICKER, K.RUBRIK[k], rr, fit=True)
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
