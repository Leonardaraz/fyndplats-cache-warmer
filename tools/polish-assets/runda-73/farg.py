# -*- coding: utf-8 -*-
"""Runda 73 — mäter klädselns färg ur PIXLARNA och kalibrerar mot HUSETS skala.

☠️ RUNDANS METODSTEG: en absolut mätning räcker inte, den ska JÄMFÖRAS MOT
   PUBLICERADE SIDOR DÄR DET SVENSKA ORDET REDAN ÄR SATT. Runda 66 mätte att
   källan kallade en mellangrå fåtölj "Schwarz"; runda 69 att två "Schwarz"
   låg 49 luminanssteg isär. Båda visade att ORDET ljuger. Det som saknades
   var facit för vad HUSET menar med sina ord — och det finns i katalogen.

   Referensraderna nedan är publicerade sidor vars svenska färgord är låst:

     publicerad sida                 L      S     ordet
     golvfatolj-gra                 35 %    2 %   grå
     reclinerfatolj-grabrun         40 %    5 %   gråbrun
     vridfatolj-gra                 45 %    5 %   grå
     konstladerfatolj-brun          45 %   18 %   brun
     tv-fatolj-brun                 46 %   22 %   brun
     trafotsfatolj-gra              55 %    4 %   grå
     fatolj-ljusgra-trafot          58 %    6 %   ljusgrå
     smalfatolj-ljusgra             62 %    2 %   ljusgrå
     tv-fatolj-ljusgra              63 %    0 %   ljusgrå
     manchesterfatolj-beige         77 %   33 %   beige

   Två band framgår: BRUN kräver mättnad (S ≥ 18 %); under den är det GRÅBRUN
   även när källan säger "Braun". Och LJUSGRÅ börjar vid L ≈ 58 %.

☠️ TRE AV RUNDANS ÅTTA ÄR FÄRGSYSKON TILL PUBLICERADE SIDOR, och källans
   färgord är FEL PÅ ALLA TRE — varje gång åt det håll som hade krockat med
   syskonets ord:

     utkast      källan        uppmätt              skrivs
     b72f093d    Hellbraun     L 39 %, S  7 %       gråbrun   (syskon: beige finns)
     b1e98da4    Grau          L 67 %, S  5 %       ljusgrå   (syskon: svart)
     b67fdc2b    Braun         L 40 %, S  6 %       gråbrun   (syskon: gräddvit, mörkgrå)

⚠️ På BLANKT konstläder mäts både medianen och mörkaste decilen (runda 72):
   ljuset drar upp medianen på en välvd yta, vecken drar ned decilen.
"""
import colorsys, json, os
from PIL import Image

HAR = os.path.dirname(os.path.abspath(__file__))
ORDNING = ["969d9ec9","b72f093d","54cf1f44","acb1f904",
           "e57125fb","b1e98da4","b67fdc2b","7eee41b6"]
KALLA = {"969d9ec9":"Hellgrau","b72f093d":"Hellbraun","54cf1f44":"Hellgrau",
         "acb1f904":"Cremeweiß","e57125fb":"Dunkelbraun+Schwarz","b1e98da4":"Grau",
         "b67fdc2b":"Braun","7eee41b6":"Grau"}
# Blankt konstläder — läs BÅDA måtten, inte bara medianen.
BLANK = {"acb1f904", "b1e98da4", "b67fdc2b"}
REFERENS = {
    "grå  golvfatolj-gra": "ref/golvfatolj-gra.jpg",
    "grå  vridfatolj-gra": "ref/vridfatolj-gra.jpg",
    "grå  trafotsfatolj-gra": "ref/trafotsfatolj-gra.jpg",
    "gråbrun  reclinerfatolj": "ref/reclinerfatolj-GRABRUN.jpg",
    "brun  konstladerfatolj": "ref/konstladerfatolj-BRUN.jpg",
    "brun  tv-fatolj": "ref/tv-fatolj-BRUN.jpg",
    "ljusgrå  fatolj-trafot": "ref/fatolj-LJUSGRA-trafot.jpg",
    "ljusgrå  smalfatolj": "ref/smalfatolj-LJUSGRA.jpg",
    "ljusgrå  tv-fatolj": "ref/tv-fatolj-LJUSGRA.jpg",
    "beige  manchesterfatolj": "ref/manchesterfatolj-BEIGE.jpg",
}


def matt(sokvag):
    im = Image.open(sokvag).convert("RGB")
    w, h = im.size
    # Ryggen fyller övre vänstra tredjedelen på alla åtta hjältebilder.
    ruta = im.crop((int(w * .20), int(h * .18), int(w * .62), int(h * .52)))
    px = list(ruta.getdata())
    kladsel = [p for p in px if not (p[0] > 232 and p[1] > 232 and p[2] > 232)
               and max(p) > 18]
    if not kladsel:
        return None
    lum = sorted(kladsel, key=lambda p: 0.299*p[0] + 0.587*p[1] + 0.114*p[2])
    def snitt(bit):
        n = len(bit)
        return tuple(round(sum(p[i] for p in bit) / n) for i in range(3))
    median = snitt(lum[len(lum)//2 - 400: len(lum)//2 + 400] or lum)
    mork = snitt(lum[int(len(lum)*.10): int(len(lum)*.20)] or lum)
    mh, ml, ms = colorsys.rgb_to_hls(*[c/255 for c in median])
    _, ml2, _ = colorsys.rgb_to_hls(*[c/255 for c in mork])
    return {"median": median, "H": round(mh*360), "L": round(ml*100),
            "S": round(ms*100), "morkL": round(ml2*100), "n": len(kladsel)}


if __name__ == "__main__":
    print("HUSETS SKALA — publicerade sidor med låst svenskt färgord")
    ref = []
    for namn, p in REFERENS.items():
        m = matt(os.path.join(HAR, p))
        ref.append((m["L"], namn, m))
    for L, namn, m in sorted(ref):
        print("   %-26s L %3d %%  S %3d %%  H %3d°" % (namn, m["L"], m["S"], m["H"]))
    print("\nRUNDANS ÅTTA")
    res = {}
    for k in ORDNING:
        m = matt(os.path.join(HAR, "rawbilder", "%s_1.jpg" % k))
        res[k] = m
        blank = "  blank: mörkaste decil L %3d %%" % m["morkL"] if k in BLANK else ""
        print("   %-9s kalla=%-20s RGB %-16s L %3d %%  S %3d %%  H %3d°%s"
              % (k, KALLA[k], str(m["median"]), m["L"], m["S"], m["H"], blank))
    json.dump(res, open(os.path.join(HAR, "farg.json"), "w"), indent=1)
    print("\nfarg.json skriven")
