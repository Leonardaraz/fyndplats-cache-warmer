# -*- coding: utf-8 -*-
"""Runda 109 — mäter oskärpan för de två nya färgerna.

Metoden är runda 108:s och står oemotsagd; det som mäts om är RADIEN, för den
beror på vävens mönster och inte på modellen. Runda 108:s tre mätningar (och de
två hypoteser de slog ihjäl) står kvar i den rundans fil.

☠️ TVÅ MÄTNINGAR HAR REDAN SLAGIT IHJÄL VAR SIN HYPOTES, och de står kvar här
   för att ingen ska prova dem igen:

   1. `sok-fyllnad.py` — krympa varan. Fungerar, men fyra av sex kort hamnar
      långt under sin geometriska maxstorlek (64c0809d: 42 % mot 79 % möjliga),
      och kortet blir en liten vara i ett stort vitt fält.
   2. `sok-mjukhet.py` — nedsampla panelfotot. Hypotesen var att ett äkta
      lågpass skulle ta mer än en gaussisk oskärpa. **Fel.** 4× nedsampling gav
      32 % färre byte på det värsta kortet; krympningen gav 41 %. Nedsampling är
      alltså den SVAGARE knappen, tvärtemot vad jag antog.

⚠️ Och en fälla som är runda 107:s, uppmätt igen: när varan är HÖGRE än panelen
   biter fyllnaden inte alls. `957b042d` gav byte för byte identiskt utfall vid
   0,85 och 0,60 — höjden styrde i båda. Talen i `sok-fyllnad` ser ut som en
   skala och är det inte.

   varans maxfyllnad utan beskärning (bredd÷höjd ÷ 1,83):
   5f14c112 37 %   957b042d 47 %   6649471e 60 %
   854371fe 51 %   da1a8a75 70 %   64c0809d 79 %

Här mäts oskärpa vid VARJE korts maxstorlek. Runda 104 mätte r=1,3 till ~9 % på
nät och avfärdade oskärpa; det talet gällde en radie, inte metoden.
"""
import importlib.util, os, sys
from PIL import Image, ImageFilter

BAS = "/home/user/fyndplats-cache-warmer/tools/polish-assets"
sys.path.insert(0, BAS); sys.path.insert(0, BAS + "/runda-109")
import kortbygge                                                   # noqa
import cardkit as ck                                               # noqa
import texter as T                                                 # noqa
import kort as K                                                   # noqa

_s = importlib.util.spec_from_file_location("pf", BAS + "/runda-109/bygg-panelfoton.py")
PF = importlib.util.module_from_spec(_s); _s.loader.exec_module(PF)

HAR = BAS + "/runda-109"
import matt                                                        # noqa
NYCKLAR = list(matt.RUNDAN)
RADIER = [0.0, 1.0, 2.0, 3.0, 4.0, 6.0]


def foto(kort, radie):
    """Panelfoto vid varans MAXSTORLEK (fyll=1,0 → höjden styr), ev. mjukat."""
    sokvag, _, _ = PF.panel(kort, 1.0)
    if radie == 0.0:
        return sokvag
    v = os.path.join(HAR, "panelfoton", "%s-r%.1f.jpg" % (kort, radie))
    Image.open(sokvag).filter(ImageFilter.GaussianBlur(radie)).save(v, "JPEG", quality=94)
    return v


def matt(foton):
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
        storlek = matt({k: foto(k, basta.get(k, r)) for k in NYCKLAR})
        for k in kvar:
            if storlek[k] <= kortbygge.TAK_BYTE:
                basta[k] = r
        print("radie %.1f  ->  %s" % (r, "  ".join(
            "%s %6d%s" % (k, storlek[k], "" if k in basta else " ✗") for k in kvar)))
    print("\nvid MAXFYLLNAD:  MJUKA = %s" % {k: v for k, v in basta.items() if v})
    if len(basta) < len(NYCKLAR):
        print("KLARADE INTE:", [k for k in NYCKLAR if k not in basta])
