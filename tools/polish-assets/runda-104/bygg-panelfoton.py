# -*- coding: utf-8 -*-
"""Runda 104 — förbehandlar hjältebilden till kortets panel.

Panelen är 1,83 och kortet ritar den med `object-fit: contain`. Ett KVADRATISKT
foto krymper därför till ~55 % av panelbredden, och produkten i det till ~45 %.
Bilarna är HÖGRE än panelen, så en beskärning till 1,83 hade kapat dem — runda
93:s regel gäller: fyll ut med vitt i sidled, beskär aldrig varan.

☠️ FYLLNADEN ÄR MÄTT, INTE VALD. Första försöket lade produkten på 63–77 % av
   panelbredden och sprängde `kortbygge`:s 215 kB-tak på SEX av sju kort. Tre
   åtgärder provades i runbookens ordning:

     omskalning till exakt renderstorlek   243 268 -> 243 268 byte   (ingenting)
     gaussisk oskärpa r=1,3                243 268 -> 222 327 byte   (fortfarande över)
     mindre produkt i panelen              se tabellen nedan

   Oskärpan biter alltså knappt: bytena sitter inte i däckmönstret utan i hur
   STOR bilen ritas. Uppmätt på det värsta kortet (turkosa Kawasakin):

     fyllnad 66 %   224 586 byte   ÖVER
     fyllnad 58 %   213 299 byte   OK (q=86)
     fyllnad 50 %   210 037 byte   OK (q=88)

   0,56 vald med marginal. Det är fortfarande större än ett obeskuret kvadratiskt
   foto (~45 %), och kortet behåller sina sex spec-rader och kvalitetsgolvet.

⚠️ Höjden takas på 94 % av panelen så bilen inte tangerar kanten.
"""
import os
from PIL import Image

BREDD, HOJD = 2832, 1548          # panelens enhets-pixlar vid scale=2
FYLL = 0.56                       # produktens andel av panelbredden

# ⚠️ Per-produkt-undantag, alltid MÄTT. Fyrhjulingens kort landade på
#    215 851 byte vid 0,56 — 851 byte över taket, alltså 0,4 %. Den har mer
#    högfrekvent yta än de andra (fyra grovmönstrade däck i skarp studioljus),
#    så den behöver ritas något mindre. Sänk aldrig kvaliteten i stället.
FYLL_UNDANTAG = {"quad_orange": 0.52}
TROSK = 246                       # ljusare än så räknas som studiovit


def panel(kalla, ut, fyll=None):
    im = Image.open(kalla).convert("RGB")
    mask = im.convert("L").point(lambda v: 255 if v < TROSK else 0)
    bb = mask.getbbox()
    if bb is None:
        raise SystemExit("hittar ingen produkt i %s — är bakgrunden vit?" % kalla)
    prod = im.crop(bb)
    pw, ph = prod.size
    if pw * ph < 0.02 * im.width * im.height:
        raise SystemExit("bbox misstänkt liten i %s: %r" % (kalla, bb))
    s = min((fyll or FYLL) * BREDD / pw, 0.94 * HOJD / ph)
    prod = prod.resize((int(pw * s), int(ph * s)), Image.LANCZOS)
    duk = Image.new("RGB", (BREDD, HOJD), (255, 255, 255))
    duk.paste(prod, ((BREDD - prod.width) // 2, (HOJD - prod.height) // 2))
    duk.save(ut, "JPEG", quality=95, subsampling=0)
    return prod.width / BREDD, prod.height / HOJD


# Hjältebilden = galleriplats 1 på VARJE produkt, hämtad direkt ur butiken.
# Verifierad md5-identisk mot produktens `media.itemsInfo.items[0]` innan något
# kort byggdes — en kontroll som fanns för att `hamta_hjaltar.sh` mycket väl
# kunde ha hämtat fel syskons bild, och det syns inte på ett kontaktark när
# sju bilar är samma modell i sju färger.
HJALTAR = {
    # rundans tre sista sidor (Aprilia-motorcyklarna och fyrhjulingen)
    "aprilia_vit":   "b379ce_eec323f5c404430da960e5adb0cb5614~mv2.jpg",
    "aprilia_svart": "b379ce_b6227b2846c74788916819a21e4f6f02~mv2.jpg",
    "quad_orange":   "b379ce_7e83f4d3b47f43138b00025a0da6e58b~mv2.jpg",
    "utv_rosa":    "b379ce_cef3727b9930468094fb962f0ccf9fc0~mv2.jpg",
    "utv_orange":  "b379ce_3a79a0e44d204e81a0553cb768f40473~mv2.jpg",
    "utv_bla":     "b379ce_604bb4bae7594edba6609c08da669230~mv2.jpg",
    "maserati":    "b379ce_9c961603f73942009b26c22cf2437293~mv2.jpg",
    "kawa_vit":    "b379ce_e6879709a03a47c1bf09f42602db5ed1~mv2.jpg",
    "kawa_beige":  "b379ce_281602b66da3442b937837441a91591f~mv2.jpg",
    "kawa_turkos": "b379ce_cce413cc9b814af1b69bbe245fc75f2d~mv2.jpg",
}


def hamta(namn, mid):
    """Laddar ner till rawbilder/ (ignorerad) om filen inte redan finns."""
    import urllib.request
    os.makedirs("rawbilder", exist_ok=True)
    ut = "rawbilder/%s.jpg" % namn
    if not os.path.exists(ut):
        req = urllib.request.Request(
            "https://static.wixstatic.com/media/" + mid,
            headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=60) as r, open(ut, "wb") as f:
            f.write(r.read())
    return ut


if __name__ == "__main__":
    os.makedirs("panelfoton", exist_ok=True)
    for namn, mid in HJALTAR.items():
        b, h = panel(hamta(namn, mid), "panelfoton/%s.jpg" % namn,
                     FYLL_UNDANTAG.get(namn))
        print("  %-12s bredd %.0f %%  höjd %.0f %%" % (namn, b * 100, h * 100))
