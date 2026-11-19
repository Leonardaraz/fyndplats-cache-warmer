#!/usr/bin/env python3
"""gate-bildspegel.py: lister som letar efter samma foto spegelvänt, förstorat eller utan tillbehör på en sida (runda-vevor-294, 2026-11-15).

`gate-bilddubblett.py` beskär varan till sin ruta, skalar den till 96 × 96 gråskala och mäter medelavvikelsen. Den ser därför
inte (1) en SPEGELVÄND kopia, (2) en FÖRSTORAD kopia där bara en del av varan syns, eller (3) samma bild utan de tillbehör som
ligger bredvid varan. Hörnskyddens position 11 var position 9 spegelvänd och 1,8 gånger förstorad, och degdelarens position 12
var position 9 utan bricka och verktyg. Dubblettgrinden sa 0 fynd för båda, och de syntes bara när bilderna lades bredvid
varandra.

Den här listaren tar varje par bilder på en sida, gör en kantbild av båda (gråskala, Gauss-suddning och gradientens belopp, så
att en svart vara på vit botten inte väger mest), tar ett mittutsnitt av den ena bilden (15 till 85 % av sidorna), skalar
utsnittet ner med faktorerna 1,0 till 2,8 och söker efter det i den andra bilden med normaliserad korskorrelation, rak och
spegelvänd, åt båda hållen. Högsta värdet skrivs ut när det är 0,85 eller mer.

☠️ Den FÄLLER INTE, och det är med flit. Mätt på runda-vevor-294 låg de två äkta dubbletterna på 0,90 till 0,94, men två
olika vyer av samma svarta, avsmalnande planteringskruka (en snett från hörnet och en rakt framifrån) låg på 0,93, eftersom en
symmetrisk silhuett ger hög korrelation hur man än vrider den. Ingen gräns skiljer de två grupperna åt. Varje rad som skrivs
ut ska därför ses med ögonen: lägg de två bilderna bredvid varandra, spegla den ena och jämför ytans detaljer (rader, skuggor,
tillbehör). Är det samma foto stryker du den ena i `bilder-bort.tsv` (aldrig den som blir huvudbild). Blir sidan under fem
bilder gäller runbookens *Minst fem bilder*: hämta fler, eller flagga i `FLAGGADE-VEVOR.md`. En dubblett fyller inte upp till
fem.

Kör från rundans katalog:  python3 ../../polish-gates/gate-bildspegel.py
Slutkod 0 alltid (2 om numpy eller Pillow saknas). Kräver numpy och Pillow.
"""
import itertools
import os
import subprocess
import sys

try:
    import numpy as np
    from PIL import Image, ImageFilter
except ImportError:
    print("gate-bildspegel.py kräver numpy och Pillow (pip install --break-system-packages numpy pillow)")
    sys.exit(2)

LISTA = 0.85
N = 256
SKALOR = [1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.5, 2.8]


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


def kantbild(fn):
    """Bildens kanter som N × N: gråskala, Gauss-suddning (radie 1) och gradientens belopp."""
    im = Image.open(fn).convert("L").resize((N, N), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1))
    g0, g1 = np.gradient(np.asarray(im, dtype=float))
    return np.hypot(g0, g1)


def korskorrelation(bild, mall):
    """Normaliserad korskorrelation av mallen mot varje läge i bilden (bara lägen där mallen ryms helt)."""
    H, W = bild.shape
    h, w = mall.shape
    t = mall - mall.mean()
    form = (H + h - 1, W + w - 1)
    full = np.fft.irfft2(np.fft.rfft2(bild, s=form) * np.fft.rfft2(t[::-1, ::-1], s=form), s=form)
    tell = full[h - 1:H, w - 1:W]
    ii = np.pad(np.cumsum(np.cumsum(bild, 0), 1), ((1, 0), (1, 0)))
    ii2 = np.pad(np.cumsum(np.cumsum(bild ** 2, 0), 1), ((1, 0), (1, 0)))

    def fonster(a):
        return a[h:, w:] - a[:-h, w:] - a[h:, :-w] + a[:-h, :-w]

    s1, s2 = fonster(ii), fonster(ii2)
    var = np.maximum(s2 - s1 ** 2 / (h * w), 1e-9)
    nam = np.sqrt(var * (t ** 2).sum())
    return tell / np.maximum(nam, 1e-9)


def mittutsnitt(k):
    a, b = int(N * 0.15), int(N * 0.85)
    return k[a:b, a:b]


def likhet(ka, kb):
    """Högsta korrelationen mellan ett nedskalat mittutsnitt av ena bilden och den andra, rak och spegelvänd, åt båda hållen.
    Returnerar (värde, spegelvänd, förstoring)."""
    bast = (-1.0, False, 1.0)
    for spegel in (False, True):
        for x, y in ((ka, kb), (kb, ka)):
            bild = x[:, ::-1] if spegel else x
            ut = mittutsnitt(y)
            for s in SKALOR:
                storlek = int(round(ut.shape[0] / s))
                if storlek < 40:
                    break
                mall = np.asarray(Image.fromarray(ut).resize((storlek, storlek), Image.LANCZOS), dtype=float)
                v = float(korskorrelation(bild, mall).max())
                if v > bast[0]:
                    bast = (v, spegel, s)
    return bast


def main():
    bort = {(r[0], r[1]) for r in las_tsv("bilder-bort.tsv") if len(r) >= 2}
    per = {}
    for r in las_tsv("bilder.tsv"):
        if len(r) >= 3 and (r[0], r[1]) not in bort:
            per.setdefault(r[0], []).append((r[1], r[2]))
    rader = []
    for kort, bilder in per.items():
        kant = {pos: kantbild(hamta(fid)) for pos, fid in bilder}
        for a, b in itertools.combinations([p for p, _ in bilder], 2):
            v, spegel, s = likhet(kant[a], kant[b])
            if v >= LISTA:
                rader.append((v, kort, a, b, spegel, s))
    for v, kort, a, b, spegel, s in sorted(rader, reverse=True):
        print(f"  SE MED ÖGONEN {kort}: position {a} och {b} liknar varandra ({v:.3f}, "
              f"{'spegelvänt' if spegel else 'rakt'}, förstoring {s}). Lägg dem bredvid varandra, spegla den ena och jämför ytan. "
              f"Samma foto: stryk den ena i bilder-bort.tsv")
    antal = sum(len(v) for v in per.values())
    print(f"SPEGELLISTA: {len(rader)} par att se med ögonen i {len(per)} produkter ({antal} bilder). Fäller inte.")
    sys.exit(0)


if __name__ == "__main__":
    main()
