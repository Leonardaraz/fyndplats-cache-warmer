# -*- coding: utf-8 -*-
"""Runda 74 — mäter klädselns färg ur PIXLARNA och kalibrerar mot HUSETS skala.

Metoden är runda 73:s och den gäller oförändrat: en ABSOLUT mätning räcker
inte, den ska jämföras mot PUBLICERADE SIDOR DÄR DET SVENSKA ORDET ÄR LÅST.

☠️ MEN RUNDA 73:s SKALA RÄCKER INTE HÄR, och det är rundans metodfynd.
   Alla tio referenser är NEUTRALER — grå, gråbrun, brun, ljusgrå, beige — och
   skalan är byggd på LJUSHET (L) med mättnad (S) som tiebreak. Sex av rundans
   åtta är KULÖRTA: blå, gul, orange. På en kulört yta är L nästan
   informationsfri (en mörk gul och en ljus gul är båda gula) och det som
   avgör ordet är NYANSEN (H).

   Skalan får därför två grenar, och grenvalet görs på S:

     S <  15 %  → NEUTRAL. Läs L mot husets publicerade skala (runda 73).
     S >= 15 %  → KULÖRT.  Läs H; L avgör bara ljus/mörk-kvalificeraren.

☠️ OCH KÄLLAN HAR KASTAT OM TVÅ AV DEM. Ögat på kontaktarket ser det direkt:
   `791e7292` heter "Orange" och är SENAPSGUL; `bc220489` heter "Braun" och är
   tydligt ORANGE. Skrivs de på källans ord blir gul-familjen två produkter
   som båda heter något annat än vad de är — och `66adcdff` (äkta gul) hamnar
   bredvid en "Orange" som ser likadan ut. Mätningen avgör, inte ordet.

⚠️ Sex av åtta är färgsyskon till `manchesterfatolj-med-fotpall-beige`, vars
   ord BEIGE är låst (L 77 %, S 33 %). Ingen av de sex får skrivas som beige.
"""
import colorsys, json, os
from PIL import Image

HAR = os.path.dirname(os.path.abspath(__file__))
ORDNING = ["e1c41327", "58fb3025", "66adcdff", "4a9c33d2", "791e7292",
           "bc220489", "84082d41", "7e00970f"]
KALLA = {"e1c41327": "Blau", "58fb3025": "Grau", "66adcdff": "Gelb",
         "4a9c33d2": "Hellbraun", "791e7292": "Orange", "bc220489": "Braun",
         "84082d41": "Braun", "7e00970f": "Grau"}

# ☠️ De två björkvilstolarna har en PLAN dyna i mitten av bilden, inte en
#    välvd rygg uppe till vänster. Samma ruta hade mätt träramen och väggen.
DYNA_MITT = {"84082d41", "7e00970f"}

REFERENS = {
    "grå  golvfatolj": "ref/golvfatolj-gra.jpg",
    "grå  vridfatolj": "ref/vridfatolj-gra.jpg",
    "grå  trafotsfatolj": "ref/trafotsfatolj-gra.jpg",
    "gråbrun  reclinerfatolj": "ref/reclinerfatolj-GRABRUN.jpg",
    "brun  konstladerfatolj": "ref/konstladerfatolj-BRUN.jpg",
    "brun  tv-fatolj": "ref/tv-fatolj-BRUN.jpg",
    "ljusgrå  fatolj-trafot": "ref/fatolj-LJUSGRA-trafot.jpg",
    "ljusgrå  smalfatolj": "ref/smalfatolj-LJUSGRA.jpg",
    "ljusgrå  tv-fatolj": "ref/tv-fatolj-LJUSGRA.jpg",
    # ☠️ Rundans två SYSKON — deras ord är facit och får inte återanvändas.
    "beige  manchesterfatolj  ← SYSKON": "ref/manchesterfatolj-BEIGE.jpg",
    "svart  vilstol-bjork  ← SYSKON": "ref/vilstol-bjork-SVART.jpg",
}


def matt(sokvag, mitt=False):
    im = Image.open(sokvag).convert("RGB")
    w, h = im.size
    ruta = (im.crop((int(w * .22), int(h * .30), int(w * .70), int(h * .62)))
            if mitt else
            im.crop((int(w * .20), int(h * .18), int(w * .62), int(h * .52))))
    px = list(ruta.getdata())
    # Vit studiobakgrund bort, och nästan-svart (skuggor) bort.
    kladsel = [p for p in px if not (p[0] > 232 and p[1] > 232 and p[2] > 232)
               and max(p) > 18]
    if not kladsel:
        return None
    lum = sorted(kladsel, key=lambda p: 0.299*p[0] + 0.587*p[1] + 0.114*p[2])
    def snitt(bit):
        n = len(bit)
        return tuple(round(sum(p[i] for p in bit) / n) for i in range(3))
    median = snitt(lum[len(lum)//2 - 400: len(lum)//2 + 400] or lum)
    mh, ml, ms = colorsys.rgb_to_hls(*[c/255 for c in median])
    return {"median": median, "H": round(mh*360), "L": round(ml*100),
            "S": round(ms*100), "n": len(kladsel)}


def gren(m):
    """Vilken gren av skalan gäller — och vad säger den?"""
    if m["S"] < 15:
        return "NEUTRAL (läs L mot husets skala)"
    h = m["H"]
    if h < 18 or h >= 345:  return "KULÖRT  röd"
    if h < 40:              return "KULÖRT  orange"
    if h < 70:              return "KULÖRT  gul"
    if h < 160:             return "KULÖRT  grön"
    if h < 200:             return "KULÖRT  cyan/petrol"
    if h < 260:             return "KULÖRT  blå"
    return "KULÖRT  lila/rosa"


if __name__ == "__main__":
    print("HUSETS SKALA — publicerade sidor med låst svenskt färgord")
    ref = []
    for namn, p in REFERENS.items():
        m = matt(os.path.join(HAR, p))
        ref.append((m["L"], namn, m))
    for L, namn, m in sorted(ref):
        print("   %-34s L %3d %%  S %3d %%  H %3d°" % (namn, m["L"], m["S"], m["H"]))

    print("\nRUNDANS ÅTTA")
    res = {}
    for k in ORDNING:
        m = matt(os.path.join(HAR, "rawbilder", "%s_1.jpg" % k), k in DYNA_MITT)
        res[k] = m
        print("   %-9s kalla=%-10s RGB %-16s L %3d %%  S %3d %%  H %3d°   %s"
              % (k, KALLA[k], str(m["median"]), m["L"], m["S"], m["H"], gren(m)))
    json.dump(res, open(os.path.join(HAR, "farg.json"), "w"), indent=1)
    print("\nfarg.json skriven")
