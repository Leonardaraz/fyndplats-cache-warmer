# -*- coding: utf-8 -*-
"""Mäter den STÖRSTA fyllnad som ryms under 215 kB vid q >= 85, per kort.

☠️ Talen i `bygg-panelfoton.FYLL_UNDANTAG` ska vara MÄTTA, inte gissade — och
   alla kort mäts i samma svep, för att dö på det första kostar ett varv per
   kort (runda 63:s lärdom, inbakad i `kortbygge.bygg`).

⚠️ Oskärpa är fel medicin på nät: runda 104 mätte r=1,3 till ~9 % mindre fil,
   och nätet behöver 30–50 %. Att rita varan mindre tar bort nätrutorna i
   stället för att sudda dem.
"""
import os, sys
from PIL import Image

BAS = "/home/user/fyndplats-cache-warmer/tools/polish-assets"
sys.path.insert(0, BAS); sys.path.insert(0, BAS + "/runda-107")
import kortbygge                                                  # noqa
import texter as T                                                 # noqa
import kort as K                                                   # noqa
importlib = __import__("importlib")
PF = importlib.import_module("bygg-panelfoton".replace("-", "_")) if False else None

import importlib.util
_s = importlib.util.spec_from_file_location("panelfoton", BAS + "/runda-107/bygg-panelfoton.py")
PF = importlib.util.module_from_spec(_s); _s.loader.exec_module(PF)

import cardkit as ck                                                # noqa

HAR = BAS + "/runda-107"
NYCKLAR = list(T.PRODUKTER)
STEG = [0.90, 0.80, 0.70, 0.60, 0.50, 0.42, 0.35]


def matt(fyll_per_kort):
    foton = {}
    for k in NYCKLAR:
        foton[k], _, _ = PF.panel(k, fyll_per_kort[k])
    kortdata = {k: (K.KICKER, K.RUBRIK[k], K.RADER[k]) for k in NYCKLAR}
    namn = []
    for k in NYCKLAR:
        kicker, rubrik, rader = kortdata[k]
        spec = K.specrader(k)
        rr = [(e, kortbygge.varde(spec[i], e)) for e, i in rader]
        ck.card_spec(k + "_spec", foton[k], kicker, rubrik, rr, fit=True)
        namn.append(k + "_spec")
    ck.render(namn)
    ut = {}
    os.makedirs("jpg", exist_ok=True)
    for k, n in zip(NYCKLAR, namn):
        im = Image.open("cards/%s.png" % n).convert("RGB").resize((1600, 1600), Image.LANCZOS)
        im.save("jpg/%s.jpg" % n, "JPEG", quality=85, optimize=True, subsampling=0)
        ut[k] = os.path.getsize("jpg/%s.jpg" % n)
    return ut


if __name__ == "__main__":
    basta = {}
    for f in STEG:
        kvar = [k for k in NYCKLAR if k not in basta]
        if not kvar:
            break
        storlek = matt({k: (basta.get(k) or f) for k in NYCKLAR})
        for k in kvar:
            if storlek[k] <= kortbygge.TAK_BYTE:
                basta[k] = f
        print("fyllnad %.2f  ->  %s" % (f, "  ".join(
            "%s %6d%s" % (k, storlek[k], "" if k in basta else " ✗") for k in kvar)))
    print("\nFYLL_UNDANTAG = %s" % basta)
    if len(basta) < len(NYCKLAR):
        print("KLARADE INTE:", [k for k in NYCKLAR if k not in basta])
