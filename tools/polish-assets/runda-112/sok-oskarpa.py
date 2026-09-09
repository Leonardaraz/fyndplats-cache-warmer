# -*- coding: utf-8 -*-
"""Runda 112 — mäter oskärpan per kort.

☠️ RADIEN MÄTS, DEN ÄRVS INTE. Rundan har fem konstruktioner OCH en hjälte som
är ett fotografi av ett vardagsrum i stället för en studiobild — och ett
fotografi komprimerar inte alls som en render mot vit botten. Åtta av nio
sprängde taket vid r=0; livsstilsbilden med 103 kB.
"""
import importlib.util, os, shutil, sys
from PIL import Image

BAS = "/home/user/fyndplats-cache-warmer/tools/polish-assets"
sys.path.insert(0, BAS); sys.path.insert(0, BAS + "/runda-112")
import kortbygge, cardkit as ck                                    # noqa
import kort as K                                                   # noqa
import matt                                                        # noqa

_s = importlib.util.spec_from_file_location("pf", BAS + "/runda-112/bygg-panelfoton.py")
PF = importlib.util.module_from_spec(_s); _s.loader.exec_module(PF)

HAR = BAS + "/runda-112"
NYCKLAR = list(matt.RUNDAN)
RADIER = [0.0, 0.5, 1.0, 1.5, 2.0, 3.0, 4.0, 5.0, 6.0, 8.0]


def foto(kort, radie):
    """☠️ MÄTNINGEN MÅSTE GÅ GENOM BYGGETS EGEN VÄG, inte genom en kopia av den.

    Ett första utkast här sparade panelfotot (q=94) och la sedan oskärpan på
    den FÄRDIGKOMPRIMERADE filen — alltså en JPEG-vända mer än bygget gör.
    Skillnaden är liten och exakt fel riktning: den mjukar bort detalj som
    bygget behåller, så mätningen underskattade. Uppmätt på rundans två
    trängsta kort: `422ab1bd` 214 864 byte i mätningen mot 215 125 i bygget,
    `a8c82049` 214 879 mot 215 101 — båda UNDER taket i mätningen och ÖVER det
    i bygget. Tvillingar glider isär; nu sätts radien i bygg-modulen och
    `panel()` anropas, så det finns bara en väg.
    """
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
