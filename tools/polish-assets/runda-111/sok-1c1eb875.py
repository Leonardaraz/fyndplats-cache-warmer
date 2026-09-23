# -*- coding: utf-8 -*-
"""Runda 111 — `1c1eb875` klarar inte byte-taket med oskärpa. Vad biter?

☠️ OSKÄRPA ÄR FEL VERKTYG FÖR ETT TRYCK. Runda 108 mätte att oskärpa slår
   krympning på en VÄV, och den slutsatsen har hållit i tre rundor. Palmbladen
   är inte en väv: kostnaden ligger i stora högkontrastytor med skarpa
   konturer, och en gaussisk oskärpa mjukar konturen utan att ta bort ytan.
   Vid r=4,0 ligger kortet fortfarande 5 631 byte över taket.

   Två andra spakar mäts därför här, båda avvisade av runda 108 FÖR EN VÄV:
   krympa varan i panelen, och kombinera krympning med oskärpa.
"""
import importlib.util, os, sys
from PIL import Image, ImageFilter

BAS = "/home/user/fyndplats-cache-warmer/tools/polish-assets"
sys.path.insert(0, BAS); sys.path.insert(0, BAS + "/runda-111")
import kortbygge, cardkit as ck                                    # noqa
import kort as K                                                   # noqa

_s = importlib.util.spec_from_file_location("pf", BAS + "/runda-111/bygg-panelfoton.py")
PF = importlib.util.module_from_spec(_s); _s.loader.exec_module(PF)

HAR = BAS + "/runda-111"
K_ = "1c1eb875"


def storlek(fyll, radie):
    sokvag, _, _ = PF.panel(K_, fyll)
    if radie:
        v = os.path.join(HAR, "panelfoton", "%s-prov.jpg" % K_)
        Image.open(sokvag).filter(ImageFilter.GaussianBlur(radie)).save(v, "JPEG", quality=94)
        sokvag = v
    spec = K.specrader(K_)
    rr = [(e, kortbygge.varde(spec[i], e)) for e, i in K.RADER[K_]]
    ck.card_spec(K_ + "_spec", sokvag, K.KICKER, K.RUBRIK[K_], rr, fit=True)
    ck.render([K_ + "_spec"])
    os.makedirs("jpg", exist_ok=True)
    im = Image.open("cards/%s_spec.png" % K_).convert("RGB").resize((1600, 1600), Image.LANCZOS)
    im.save("jpg/%s_spec.jpg" % K_, "JPEG", quality=85, optimize=True, subsampling=0)
    return os.path.getsize("jpg/%s_spec.jpg" % K_)


if __name__ == "__main__":
    for fyll, radie in [(1.0, 5.0), (1.0, 6.0), (0.9, 2.0), (0.9, 3.0),
                        (0.85, 2.0), (0.8, 1.5), (0.8, 2.0)]:
        b = storlek(fyll, radie)
        print("fyll %.2f  r=%.1f  ->  %6d byte  %s"
              % (fyll, radie, b, "OK" if b <= kortbygge.TAK_BYTE else "✗"))
