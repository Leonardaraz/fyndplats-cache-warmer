# -*- coding: utf-8 -*-
"""Runda 76 — mäter klädselns färg ur PIXLARNA i stället för att tro på källan.

Tvåstegsskalan är runda 74:s och 75:s, oförändrad:

    S < 15 %   → NEUTRAL. Läs L (ljushet) mot husets skala.
    S >= 15 %  → KROMATISK. Läs H (kulör). L kvalificerar bara.

☠️ RUNDANS EGET SKÄL ATT MÄTA är grövre än förra rundans. Runda 75 hittade
   nyansfel — "Dunkelgrau" som var ljusgrå. Här står ett utkast som `Grün`
   och stolen är LJUSBLÅ. Det är inte en nyans bredvid, det är fel
   färgfamilj, och den sortens fel går inte att nyansera sig ur: en kund som
   söker grönt får blått hem.

⚠️ Beskärningen är olika per modell, för stolarna är byggda olika:
     D  hög stoppad rygg, kromfot   → ryggens övre del
     E  nätrygg + dyna              → SITSDYNAN (nätet är genomskinligt och
                                      drar in bakgrundens ljushet)
     F  låg kar-formad kropp        → kroppens mitt
"""
import colorsys, json, os
from PIL import Image

HAR = os.path.dirname(os.path.abspath(__file__))
BILDER = json.load(open(os.path.join(HAR, "bilder.json"), encoding="utf-8"))

RUTOR = {"D": (.28, .10, .72, .40),
         "E": (.30, .44, .70, .60),
         "F": (.30, .15, .70, .45)}


def matt(sokvag, ruta):
    im = Image.open(sokvag).convert("RGB")
    w, h = im.size
    bit = im.crop((int(w*ruta[0]), int(h*ruta[1]), int(w*ruta[2]), int(h*ruta[3])))
    px = [p for p in bit.getdata()
          if not (p[0] > 240 and p[1] > 240 and p[2] > 240) and max(p) > 18]
    if not px:
        return None
    lum = sorted(px, key=lambda p: 0.299*p[0] + 0.587*p[1] + 0.114*p[2])
    mitt = lum[len(lum)//2 - 500: len(lum)//2 + 500] or lum
    n = len(mitt)
    r, g, b = (sum(p[i] for p in mitt) / n for i in range(3))
    hh, ll, ss = colorsys.rgb_to_hls(r/255, g/255, b/255)
    return {"rgb": (round(r), round(g), round(b)),
            "H": round(hh*360), "L": round(ll*100), "S": round(ss*100)}


def kulor(H):
    """Grov kulörfamilj — bara för att fånga FEL FAMILJ, inte för att namnge."""
    if H < 16 or H >= 345: return "röd"
    if H < 45:  return "orange/brun"
    if H < 70:  return "gul"
    if H < 160: return "grön"
    if H < 200: return "turkos"
    if H < 260: return "blå"
    if H < 290: return "lila"
    return "rosa/magenta"


if __name__ == "__main__":
    os.makedirs(os.path.join(HAR, "beskuret"), exist_ok=True)
    ut = {}
    print("%-9s %-5s %-12s %-16s %-5s %-4s %-4s %s"
          % ("id8", "grupp", "källan", "rgb", "H", "L%", "S%", "kulörfamilj"))
    for k, v in BILDER.items():
        g = v["grupp"]
        ruta = RUTOR[g]
        bild = os.path.join(HAR, "rawbilder", "%s-1.jpg" % k)
        # spara beskärningen så att rutan går att GRANSKA, inte bara lita på
        im = Image.open(bild).convert("RGB")
        w, h = im.size
        im.crop((int(w*ruta[0]), int(h*ruta[1]), int(w*ruta[2]), int(h*ruta[3]))) \
          .save(os.path.join(HAR, "beskuret", "%s.jpg" % k), quality=90)
        m = matt(bild, ruta)
        ut[k] = dict(m, grupp=g, kalla=v["kalla"],
                     neutral=m["S"] < 15, familj=kulor(m["H"]))
        print("%-9s %-5s %-12s %-16s %-5s %-4s %-4s %s"
              % (k, g, v["kalla"], str(m["rgb"]), m["H"], m["L"], m["S"],
                 "(neutral)" if m["S"] < 15 else kulor(m["H"])))
    json.dump(ut, open(os.path.join(HAR, "farg.json"), "w"),
              ensure_ascii=False, indent=1)
