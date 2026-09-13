# -*- coding: utf-8 -*-
"""Grind för alt-texterna. Kör RUNDANS EGEN förbjudna-ord-lista mot dem.

☠️ ALT-TEXTEN PASSERAR INGEN AV STEG-GRINDARNA — den finns inte i `texter.py`.
   Runbokens regel: kör rundans lista mot alt-texterna INNAN du skriver dem,
   med SAMMA mönster, inte en omskriven variant.

⚠️ `grindar.LANDORD` bär FÄRDIGKOMPILERADE mönster medan `grind.FORBJUDET` kan
   bära strängar. `re.search(kompilerat, s, re.I)` KASTAR ValueError — en grind
   som inte hanterar båda formerna DÖR i stället för att fälla, och ett dött
   självtest ser i en logg ut precis som ett tyst.

☠️ BENFÄRGSGRINDEN ÄR RUNDANS EGEN. Fyra produkter har svarta ben. Säger deras
   alt-text "björk", "furu" eller "ljust trä" om BENEN är felet återinfört i
   exakt den kanal som inte hade någon grind.
"""
import json
import os
import re
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path[:0] = [HAR, os.path.join(HAR, "..")]
import grindar as G          # noqa: E402
import grind as GR           # noqa: E402
import alttexter as A        # noqa: E402

# Bilden visar svarta ben (`benzoom.jpg`, uppmätt 2026-09-13).
SVARTBENTA = {"2ba6baf0", "9ee2fa6e", "c11948ac", "07ac9918"}
# Ett ljusträ-ord som står NÄRA ordet "ben" är ett benpåstående.
LJUSBEN = re.compile(
    r"(björk|furu|ljust trä|naturträ)\w*[^.]{0,30}\bben|"
    r"\bben\w*[^.]{0,30}(björk|furu|ljust trä|naturträ)", re.I)


def traff(monster, text):
    """Ett mönster som kan vara sträng ELLER kompilerat."""
    if hasattr(monster, "search"):
        return monster.search(text)
    return re.search(monster, text, re.I)


def kor():
    galleri = json.load(open(os.path.join(HAR, "bilder.json"), encoding="utf-8"))
    # Borttagna leverantörsbilder per produkt (Steg 4).
    BORT = {"07ac9918": 2}
    fel = []
    for pid, lista in A.ALT.items():
        vantat = len(galleri[pid]) - BORT.get(pid, 0) + 1   # kvar + ETT kort
        if len(lista) != vantat:
            fel.append("%s: %d alt-texter, galleriet + kortet är %d"
                       % (pid, len(lista), vantat))
        if not lista[2].startswith("Faktakort: "):
            fel.append("%s: plats 3 är inte kortet (%r)" % (pid, lista[2][:40]))
        if not lista[-1].startswith("Måttritning"):
            fel.append("%s: sista bilden är inte måttritningen (%r)"
                       % (pid, lista[-1][:40]))
        for i, t in enumerate(lista):
            if i != 2 and t.startswith("Faktakort"):
                fel.append("%s alt %d: börjar med Faktakort men är inte kortet"
                           % (pid, i + 1))
            if "Fyndplats-kort" in t:
                fel.append("%s alt %d: säger 'Fyndplats-kort' — ska vara 'Faktakort'"
                           % (pid, i + 1))
            if len(t) > 160:
                fel.append("%s alt %d: %d tecken (tak 160)" % (pid, i + 1, len(t)))

        allt = " ".join(lista)
        for m in GR.FORBJUDET:
            monster, varfor = m if isinstance(m, tuple) else (m, getattr(m, "pattern", m))
            if traff(monster, allt):
                fel.append("%s: FORBJUDET %r — %s" % (pid, monster, varfor))
        if G.ARTNR.search(allt):
            fel.append("%s: ARTIKELNUMMER i alt-texten" % pid)
        if G.TREKONSONANT.search(allt):
            fel.append("%s: trekonsonant i alt-texten" % pid)
        for c, n, s in G.homoglyfer(allt):
            fel.append("%s: HOMOGLYF %s (%s) — …%s…" % (pid, c, n, s))
        if pid in SVARTBENTA:
            m = LJUSBEN.search(allt)
            if m:
                fel.append("%s: alt-texten säger LJUST TRÄ om benen — bilden "
                           "visar svarta: …%s…" % (pid, m.group(0)))
    return fel


SJALVTEST = [
    ("Hundsoffa med runda ben i ljus björk", "2ba6baf0", True,
     "ljusträ om benen på en svartbent produkt ska FÄLLA"),
    ("Hundsoffa med svarta ben under ljusgrå sammet", "2ba6baf0", False,
     "svarta ben ska passera"),
    ("Hundsoffa med runda ben i ljus björk", "5b8162d1", False,
     "ljusträ om benen på en LJUSBENT produkt ska passera"),
    ("Stommen är av massiv björk. Benen är svarta.", "9ee2fa6e", False,
     "ett björkomnämnande i en ANNAN mening än benen ska passera"),
]


def sjalvtest():
    fel = []
    for text, pid, ska_falla, varfor in SJALVTEST:
        foll = bool(LJUSBEN.search(text)) and pid in SVARTBENTA
        if foll != ska_falla:
            fel.append("SJÄLVTEST: %r (%s) gav %s, väntade %s — %s"
                       % (text, pid, foll, ska_falla, varfor))
    return fel


if __name__ == "__main__":
    st = sjalvtest()
    for f in st:
        print("☠️", f)
    print("självtest %d/%d ok" % (len(SJALVTEST) - len(st), len(SJALVTEST)))
    fel = kor()
    for f in fel:
        print("☠️", f)
    n = sum(len(v) for v in A.ALT.values())
    print("%d alt-texter på %d produkter, %d fel"
          % (n, len(A.ALT), len(fel) + len(st)))
    sys.exit(1 if (fel or st) else 0)
