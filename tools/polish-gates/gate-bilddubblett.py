#!/usr/bin/env python3
"""gate-bilddubblett.py: samma bild från samma vinkel två gånger på en sida (Leonard 2026-11-01).

Leverantörerna lägger ofta samma helbild två gånger i galleriet, med olika skala, en annan beskärning eller en
hängetikett på den ena (runda-vevor-2: olivträdets position 3 och 4 var samma foto). Runbooken stryker "samma scen
från samma vinkel som en annan bild i galleriet", men ögat missar det på ett kontaktark. Den här grinden mäter det.

Läser rundans `bilder.tsv` (kort ⇥ position ⇥ Wix-fil-id) och `bilder-bort.tsv`, hämtar varje kvarvarande bild från
wixstatic till `orig/fid-<fil-id>.jpg` (gitignorerad cache) och jämför alla par inom varje produkt: varan beskärs till
sin ruta (allt som inte är vitt), skalas till 96 × 96 gråskala och medelavvikelsen räknas.

  under 0,02  = samma foto (fynd)
  0,02–0,04   = misstänkt, ses med ögonen innan du går vidare (skrivs ut, fäller inte)

Mätt på runda-vevor-2: de sex äkta dubbletterna låg på 0,003–0,009 och en sjunde på 0,018; närmaste par som visade en
annan vinkel låg på 0,027. Siffran mäter formen på varan, inte vinkeln, så en bild på en växt som vridits lite kan
ligga nära gränsen. Ser du med ögonen att vinkeln skiljer kvitterar du paret i `bilddubblett-ok.txt`
(`kort pos1 pos2 skäl`, ett par per rad). Ett par där ena bilden är en miljöbild (inte vit bakgrund) jämförs inte.

☠️ Stryk den ena bilden i `bilder-bort.tsv`, aldrig den som blir huvudbild. Blir sidan under fem bilder av strykningen
gäller runbookens *Minst fem bilder*: hämta fler, beskär, eller flagga i `FLAGGADE.md`. En dubblett fyller inte upp till fem.

Kör från rundans katalog:  python3 ../../polish-gates/gate-bilddubblett.py
Slutkod 1 vid fynd.
"""
import itertools
import os
import subprocess
import sys

try:
    import numpy as np
    from PIL import Image
except ImportError:
    print("gate-bilddubblett.py kräver numpy och Pillow (pip install --break-system-packages numpy pillow)")
    sys.exit(2)

SAMMA = 0.02
MISSTANKT = 0.04


def las_tsv(fn):
    if not os.path.exists(fn):
        return []
    with open(fn, encoding="utf-8") as f:
        return [r.rstrip("\n").split("\t") for r in f if r.strip() and not r.startswith("#")]


def hamta(fid):
    mal = f"orig/fid-{fid}.jpg"
    if os.path.exists(mal) and os.path.getsize(mal) > 1000:
        return mal
    os.makedirs("orig", exist_ok=True)
    r = subprocess.run(["curl", "-sS", "--max-time", "60", "-o", mal, "https://static.wixstatic.com/media/" + fid],
                       capture_output=True, text=True)
    if r.returncode != 0 or not os.path.exists(mal) or os.path.getsize(mal) < 1000:
        print(f"KAN INTE HÄMTA {fid}: {r.stderr.strip()[:120]}")
        sys.exit(2)
    return mal


def drag(fn):
    """Bildens varudrag som 96 × 96 gråskala, eller None för en miljöbild (inte vit bakgrund)."""
    im = Image.open(fn).convert("RGB")
    a = np.asarray(im).astype(float)
    ej_vit = a.min(axis=2) < 235
    andel = ej_vit.mean()
    if andel < 0.02 or andel > 0.6:
        return None
    ys, xs = np.where(ej_vit)
    im = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    return np.asarray(im.convert("L").resize((96, 96))).astype(float) / 255


def main():
    bort = {(r[0], r[1]) for r in las_tsv("bilder-bort.tsv") if len(r) >= 2}
    ok = set()
    if os.path.exists("bilddubblett-ok.txt"):
        for rad in open("bilddubblett-ok.txt", encoding="utf-8"):
            d = rad.split()
            if len(d) >= 4 and not rad.startswith("#"):
                ok.add((d[0], frozenset((d[1], d[2]))))
    per = {}
    for r in las_tsv("bilder.tsv"):
        if len(r) >= 3 and (r[0], r[1]) not in bort:
            per.setdefault(r[0], []).append((r[1], r[2]))
    fynd, misstankta = [], []
    for kort, bilder in per.items():
        drag_per = {}
        for pos, fid in bilder:
            drag_per[pos] = drag(hamta(fid))
        for a, b in itertools.combinations([p for p, _ in bilder], 2):
            if drag_per[a] is None or drag_per[b] is None:
                continue
            if (kort, frozenset((a, b))) in ok:
                continue
            d = float(np.abs(drag_per[a] - drag_per[b]).mean())
            if d < SAMMA:
                fynd.append((kort, a, b, d))
            elif d < MISSTANKT:
                misstankta.append((kort, a, b, d))
    for kort, a, b, d in misstankta:
        print(f"  misstänkt {kort}: position {a} och {b} liknar varandra ({d:.3f}), se med ögonen")
    for kort, a, b, d in fynd:
        print(f"  FYND {kort}: position {a} och {b} är samma bild från samma vinkel ({d:.3f}). "
              f"Stryk en i bilder-bort.tsv, eller kvittera paret i bilddubblett-ok.txt om vinkeln skiljer")
    antal = sum(len(v) for v in per.values())
    print(f"GRIND: {len(fynd)} fynd, {len(misstankta)} misstänkta i {len(per)} produkter ({antal} bilder)")
    sys.exit(1 if fynd else 0)


main()
