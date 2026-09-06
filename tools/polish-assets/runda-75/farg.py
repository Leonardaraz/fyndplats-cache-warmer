# -*- coding: utf-8 -*-
"""Runda 75 — mäter klädselns färg ur PIXLARNA och kalibrerar mot HUSETS skala.

Metoden är runda 73:s referensskala plus runda 74:s TVÅ GRENAR. Kort:

  S < 15 %  → NEUTRAL. Läs L mot husets publicerade sidor (referensraderna).
  S >= 15 % → KROMATISK. Läs H. L kvalificerar bara (ljus/mörk).

Runda 74 mätte varför: på en mättad yta är L nästan informationslöst — en gul
och en orange fåtölj kan ligga på samma luminans — och runda 73:s skala var
byggd enbart av neutraler.

☠️ RUNDANS EGET SKÄL ATT MÄTA: fyra av sju källfärgord ser fel ut redan på
   kontaktarket. `75f6c433` heter "Hellgrau" men ser gräddvit ut, `7ab2f8aa`
   heter "Dunkelgrau" men ser mellangrå ut, och `60c803f0` heter "Braun" men
   ser ljust kamelfärgad ut. Ordet ljuger, precis som i runda 66, 69, 73 och 74.

⚠️ Beskärningen är ANNAN än fåtöljrundornas. En kontorsstol har ryggen högt upp
   och ett smalt chassi; rutan tar därför ryggens övre halva och undviker
   nackkudden (som ofta är ljusare) och kromfoten (som är nästan vit).
"""
import colorsys, json, os
from PIL import Image

HAR = os.path.dirname(os.path.abspath(__file__))
ORDNING = ["75f6c433", "7ab2f8aa", "60c803f0", "cc81673d",
           "0945e4dd", "348ee535", "4d83eca6"]
KALLA = {"75f6c433": "Hellgrau", "7ab2f8aa": "Dunkelgrau", "60c803f0": "Braun",
         "cc81673d": "Cremeweiß", "0945e4dd": "Braun",
         "348ee535": "Grau", "4d83eca6": "Cremeweiß"}

# Husets skala — publicerade sidor vars svenska färgord är låst (runda 73).
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
    "beige  manchesterfatolj": "ref/manchesterfatolj-BEIGE.jpg",
}
# Ryggens övre halva, utan nackkudde och utan kromfot.
RUTA = (.26, .30, .74, .58)
REF_RUTA = (.20, .18, .62, .52)      # fåtöljreferensernas egen ruta (runda 73)


def matt(sokvag, ruta):
    im = Image.open(sokvag).convert("RGB")
    w, h = im.size
    bit = im.crop((int(w*ruta[0]), int(h*ruta[1]), int(w*ruta[2]), int(h*ruta[3])))
    px = [p for p in bit.getdata()
          if not (p[0] > 238 and p[1] > 238 and p[2] > 238) and max(p) > 18]
    if not px:
        return None
    lum = sorted(px, key=lambda p: 0.299*p[0] + 0.587*p[1] + 0.114*p[2])
    mitt = lum[len(lum)//2 - 400: len(lum)//2 + 400] or lum
    n = len(mitt)
    rgb = tuple(round(sum(p[i] for p in mitt) / n) for i in range(3))
    hh, ll, ss = colorsys.rgb_to_hls(*[c/255 for c in rgb])
    return {"rgb": rgb, "H": round(hh*360), "L": round(ll*100),
            "S": round(ss*100), "n": len(px)}


def gren(m):
    """Vilken gren skalan ska läsas i. Runda 74:s regel."""
    return "neutral" if m["S"] < 15 else "kromatisk"


if __name__ == "__main__":
    print("HUSETS SKALA — publicerade sidor med låst svenskt färgord")
    ref = []
    for namn, p in REFERENS.items():
        m = matt(os.path.join(HAR, p), REF_RUTA)
        ref.append((m["L"], namn, m))
    for L, namn, m in sorted(ref):
        print("   %-24s L %3d %%  S %3d %%  H %3d°" % (namn, m["L"], m["S"], m["H"]))

    print("\nRUNDANS SJU")
    res = {}
    for k in ORDNING:
        m = matt(os.path.join(HAR, "rawbilder", "%s_1.jpg" % k), RUTA)
        res[k] = m | {"gren": gren(m), "kalla": KALLA[k]}
        print("   %-9s kalla=%-11s RGB %-16s L %3d %%  S %3d %%  H %3d°   → %s"
              % (k, KALLA[k], str(m["rgb"]), m["L"], m["S"], m["H"], gren(m)))
    json.dump(res, open(os.path.join(HAR, "farg.json"), "w"), indent=1)
    print("\nfarg.json skriven")
