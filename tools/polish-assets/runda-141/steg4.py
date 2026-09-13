# -*- coding: utf-8 -*-
"""Runda 141 Steg 4 — bildgranskningens MÄTNINGAR, samlade och repeterbara.

Arken sjalva ar ignorerade i git (5,5 MB harlett ur `bilder.json`, samma skal
som `*/rawbilder/` och `*/zoom-*.jpg`): DOMEN star i STEG4.md, bilderna ar
mellanled for ogat. Men mätningarna bakom domen far inte vara mellanled —
darfor ligger de har och inte i en chattrad.

    python3 steg4.py hamta     # laddar ner de 25 bilderna
    python3 steg4.py ark       # ett kontaktark per produkt
    python3 steg4.py horn      # ALLA 25 ovre vanstra horn i ETT ark
    python3 steg4.py farg      # akromatisk/kulort andel per hjaltebild
    python3 steg4.py nyans     # nyanshistogram over de mattade pixlarna
    python3 steg4.py zoom      # de tva zoomar som bar bevis (STEG4.md 2 och 5)

☠️ `horn` ar den som hittade runda 141:s farligaste fynd. Runda 64 lärde att
   leverantorens logotyp kan ligga INBRAND i bildens ovre vanstra horn; att
   granska det per bild ar 25 bildlasningar, att lagga alla horn i ett ark ar
   EN. En vattenstampel ar stor och hogkontrast och overlever nedskalningen.
"""
import colorsys, json, os, sys, urllib.request
from PIL import Image, ImageDraw

HAR = os.path.dirname(os.path.abspath(__file__))
POS = [1, 2, 3, 8, 9]                 # feedens positioner bakom listans platser
UT = os.path.join(HAR, "steg4")
RA = os.path.join(UT, "rå")


def _bilder():
    with open(os.path.join(HAR, "bilder.json"), encoding="utf-8") as f:
        d = json.load(f)
    return {k: v for k, v in d.items() if k != "_regel"}


def _sokvag(pid, pos):
    return os.path.join(RA, "%s-%d.jpg" % (pid, pos))


def hamta():
    os.makedirs(RA, exist_ok=True)
    n = 0
    for pid, filer in _bilder().items():
        for i, f in enumerate(filer):
            mal = _sokvag(pid, POS[i])
            if os.path.exists(mal):
                continue
            urllib.request.urlretrieve(
                "https://static.wixstatic.com/media/%s/v1/fit/w_1000,h_1000,q_85/bild.jpg" % f,
                mal)
            n += 1
    print("hamtade %d nya bilder till %s" % (n, RA))


def ark(cell=660, kol=3):
    """Ett ark per produkt. Rutan ar 660 px med flit: stort nog att LASA
    inbrand text. Ett gemensamt ark for flera produkter sparar en bildlasning
    och gor texten olaslig — och en granskning som inte kan lasa texten ar
    ingen granskning."""
    for pid, filer in _bilder().items():
        rutor = []
        for i in range(len(filer)):
            im = Image.open(_sokvag(pid, POS[i])).convert("RGB")
            im.thumbnail((cell, cell))
            rutor.append((POS[i], im))
        rad = (len(rutor) + kol - 1) // kol
        a = Image.new("RGB", (kol * cell, rad * (cell + 26)), "white")
        d = ImageDraw.Draw(a)
        for n, (p, im) in enumerate(rutor):
            x, y = (n % kol) * cell, (n // kol) * (cell + 26)
            d.text((x + 6, y + 6), "pos %d" % p, fill="red")
            a.paste(im, (x + (cell - im.width) // 2, y + 26))
        a.save(os.path.join(UT, "ark-%s.jpg" % pid), quality=84)
        print("ark-%s.jpg  %dx%d" % (pid, a.width, a.height))


def horn(cell=360, kol=5):
    filer = sorted(os.path.join(RA, f) for f in os.listdir(RA) if f.endswith(".jpg"))
    rad = (len(filer) + kol - 1) // kol
    a = Image.new("RGB", (kol * cell, rad * (cell + 22)), "white")
    d = ImageDraw.Draw(a)
    for n, f in enumerate(filer):
        im = Image.open(f).convert("RGB")
        kv = im.crop((0, 0, im.width // 2, im.height // 2))
        kv.thumbnail((cell, cell))
        x, y = (n % kol) * cell, (n // kol) * (cell + 22)
        d.text((x + 4, y + 5), os.path.basename(f)[:-4], fill="red")
        a.paste(kv, (x, y + 22))
    a.save(os.path.join(UT, "horn-alla.jpg"), quality=86)
    print("horn-alla.jpg  %d horn  %dx%d" % (len(filer), a.width, a.height))


def _produktpixlar(fil):
    """En pixel raknas som PRODUKT nar den ar morkare an 235 i minst en kanal
    ELLER tydligt kulort — allt annat ar den vita studiobakgrunden."""
    im = Image.open(fil).convert("RGB")
    im.thumbnail((420, 420))
    px = list(im.get_flattened_data())
    prod = [(r, g, b) for r, g, b in px
            if max(r, g, b) < 235 or (max(r, g, b) - min(r, g, b)) > 28]
    return px, prod


def farg(*filer):
    """Ger en SIFFRA att stalla mot leverantorens `Farbe:`-kolumn. Det var den
    har som visade att `8de3c3ef`s `Grün` ar fel — inte ogat."""
    for f in filer or _hjaltar():
        px, prod = _produktpixlar(f)
        if not prod:
            print("%-24s INGA produktpixlar" % os.path.basename(f)); continue
        akro = [p for p in prod if (max(p) - min(p)) <= 22]
        kul = [p for p in prod if (max(p) - min(p)) > 22]
        medel = lambda L: tuple(round(sum(p[i] for p in L) / len(L), 1)
                                for i in range(3)) if L else None
        print("%-24s produkt %4.1f%%  medel %-18s  akro %5.1f%%  kulort %4.1f%% %s"
              % (os.path.basename(f), 100 * len(prod) / len(px), medel(prod),
                 100 * len(akro) / len(prod), 100 * len(kul) / len(prod), medel(kul)))


HINKAR = [("rod", 345, 15), ("orange", 15, 45), ("gul", 45, 70),
          ("gron", 70, 165), ("cyan/turkos", 165, 195),
          ("bla", 195, 255), ("lila", 255, 290), ("magenta", 290, 345)]


def nyans(*filer):
    """Fordelar de MATTADE produktpixlarna pa nyans, sa att ett fargnamn kan
    valjas pa en siffra i stallet for pa ogonmatt. `8de3c3ef`: 1 432 mattade
    pixlar, 91 % bla och 9 % turkos — och NOLL grona."""
    for f in filer or _hjaltar():
        im = Image.open(f).convert("RGB"); im.thumbnail((420, 420))
        rakn = {n: 0 for n, _, _ in HINKAR}; tot = 0
        for r, g, b in im.get_flattened_data():
            mx, mn = max(r, g, b), min(r, g, b)
            if (mx >= 235 and mx - mn <= 28) or mx - mn <= 28 or mx < 45:
                continue
            h = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)[0] * 360
            tot += 1
            for namn, lo, hi in HINKAR:
                if (lo < hi and lo <= h < hi) or (lo > hi and (h >= lo or h < hi)):
                    rakn[namn] += 1; break
        if not tot:
            print("%-24s inga mattade pixlar" % os.path.basename(f)); continue
        topp = "  ".join("%s %.0f%%" % (n, 100 * c / tot)
                         for n, c in sorted(rakn.items(), key=lambda kv: -kv[1]) if c)
        print("%-24s mattade=%d  %s" % (os.path.basename(f), tot, topp))


def _hjaltar():
    return [_sokvag(p, 1) for p in sorted(_bilder())]


ZOOMAR = [
    # (fil, (vanster, topp, hoger, botten) som andel, skala, namn)
    # STEG4.md 2: massivt tra eller plywood avgors pa KANTEN.
    ("18b94738", 1, (0.00, 0.36, 0.20, 0.72), 3, "18b94738-gavel"),
    ("18b94738", 8, (0.00, 0.55, 0.55, 1.00), 2, "18b94738-kant"),
    # STEG4.md 5: tva tal som matt.py bar fel.
    ("7b818c3b", 3, (0.30, 0.20, 1.00, 0.72), 2, "matt-7b818c3b"),
    ("83b2cf8b", 3, (0.15, 0.18, 0.95, 0.60), 2, "matt-83b2cf8b"),
]


def zoom():
    for pid, pos, box, skala, namn in ZOOMAR:
        im = Image.open(_sokvag(pid, pos)).convert("RGB")
        l, t, r, b = (int(box[0] * im.width), int(box[1] * im.height),
                      int(box[2] * im.width), int(box[3] * im.height))
        c = im.crop((l, t, r, b))
        c = c.resize((c.width * skala, c.height * skala), Image.LANCZOS)
        c.save(os.path.join(UT, "zoom-%s.jpg" % namn), quality=92)
        print("zoom-%s.jpg  %dx%d" % (namn, c.width, c.height))


if __name__ == "__main__":
    lage = sys.argv[1] if len(sys.argv) > 1 else "hamta"
    {"hamta": hamta, "ark": ark, "horn": horn,
     "farg": farg, "nyans": nyans, "zoom": zoom}[lage](*sys.argv[2:])
