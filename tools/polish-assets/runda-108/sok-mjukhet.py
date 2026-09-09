# -*- coding: utf-8 -*-
"""Runda 108 — mäter NEDSAMPLING som alternativ till att krympa varan.

☠️ `sok-fyllnad.py` gav ett svar som är rätt och oanvändbart: två av sex kort
   ryms under 215 kB först vid fyllnad 0,35, och då är skärmen en tredjedel av
   panelens bredd med vitt runt om. Kortet blir kvitterbart men fult, och en
   rubrik som säger "Sex paneler" ska gå att RÄKNA.

   Fyllnaden är fel knapp här. Bytena kommer av vävens högfrekventa mönster,
   inte av hur stor varan är — att rita den mindre tar bort mönstret genom att
   ta bort varan. Nedsampling tar bort MÖNSTRET och behåller varan.

⚠️ Runda 104 mätte oskärpa (r=1,3) till ~9 % mindre fil på nät och avfärdade
   den. Nedsampling är inte samma sak: en gaussisk oskärpa lämnar pixelrutnätet
   kvar och därmed en del av högfrekvensen, medan en nedskalning tar bort den
   innan den kan kodas. Mätt här i stället för antaget.
"""
import importlib.util, os, sys
from PIL import Image

BAS = "/home/user/fyndplats-cache-warmer/tools/polish-assets"
sys.path.insert(0, BAS); sys.path.insert(0, BAS + "/runda-108")
import kortbygge                                                   # noqa
import cardkit as ck                                               # noqa
import texter as T                                                 # noqa
import kort as K                                                   # noqa

_s = importlib.util.spec_from_file_location("pf", BAS + "/runda-108/bygg-panelfoton.py")
PF = importlib.util.module_from_spec(_s); _s.loader.exec_module(PF)

HAR = BAS + "/runda-108"
NYCKLAR = list(T.PRODUKTER)
FAKTORER = [1.0, 1.5, 2.0, 2.5, 3.0]
FYLL = float(os.environ.get("FYLL", "0.85"))


def mjuka(kort, faktor):
    """Panelfoto där VARAN är lika stor men mönstret lågpassat."""
    sokvag, _, _ = PF.panel(kort, FYLL)
    if faktor == 1.0:
        return sokvag
    im = Image.open(sokvag)
    liten = im.resize((max(1, int(im.width / faktor)), max(1, int(im.height / faktor))),
                      Image.LANCZOS)
    ut = liten.resize(im.size, Image.LANCZOS)
    v = os.path.join(HAR, "panelfoton", "%s-m%.1f.jpg" % (kort, faktor))
    ut.save(v, "JPEG", quality=94)
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
    for f in FAKTORER:
        kvar = [k for k in NYCKLAR if k not in basta]
        if not kvar:
            break
        storlek = matt({k: mjuka(k, basta.get(k) or f) for k in NYCKLAR})
        for k in kvar:
            if storlek[k] <= kortbygge.TAK_BYTE:
                basta[k] = f
        print("nedsampling %.1f×  ->  %s" % (f, "  ".join(
            "%s %6d%s" % (k, storlek[k], "" if k in basta else " ✗") for k in kvar)))
    print("\nvid fyllnad %.2f:  MJUKHET = %s" % (FYLL, basta))
    if len(basta) < len(NYCKLAR):
        print("KLARADE INTE:", [k for k in NYCKLAR if k not in basta])
