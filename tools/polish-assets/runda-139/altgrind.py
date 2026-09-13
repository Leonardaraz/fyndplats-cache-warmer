# -*- coding: utf-8 -*-
"""Grind för alt-texterna. Kör RUNDANS EGEN förbjudna-ord-lista mot dem.

☠️ ALT-TEXTEN PASSERAR INGEN AV STEG-GRINDARNA — den finns inte i `texter.py`.
   Runbokens regel: kör rundans lista mot alt-texterna INNAN du skriver dem,
   med SAMMA mönster, inte en omskriven variant.

⚠️ `grindar.LANDORD` bär FÄRDIGKOMPILERADE mönster medan `grind.FORBJUDET` bär
   strängar. `re.search(kompilerat, s, re.I)` kastar ValueError — en grind som
   inte hanterar båda formerna DÖR i stället för att fälla, och ett dött
   självtest ser i en logg ut precis som ett tyst.
"""
import json
import re
import sys
from collections import Counter

sys.path[:0] = ['.', '..']
import grindar as G          # noqa: E402
import grind as GR           # noqa: E402
import alttexter as A        # noqa: E402


def traff(monster, text):
    """Ett mönster som kan vara sträng ELLER kompilerat."""
    if hasattr(monster, "search"):
        return monster.search(text)
    return re.search(monster, text, re.I)


def kor():
    galleri = json.load(open('galleri.json'))
    fel = []
    for pid, lista in A.ALT.items():
        vantat = len(galleri[pid]) + 1          # leverantörsbilder + ETT kort
        if len(lista) != vantat:
            fel.append("%s: %d alt-texter, galleriet + kortet är %d" % (pid, len(lista), vantat))
        if not lista[2].startswith("Faktakort: "):
            fel.append("%s: plats 3 är inte kortet (%r)" % (pid, lista[2][:40]))
        for i, t in enumerate(lista):
            if i != 2 and t.startswith("Faktakort"):
                fel.append("%s alt %d: börjar med Faktakort men är inte kortet" % (pid, i + 1))
            if "Fyndplats-kort" in t:
                fel.append("%s alt %d: säger 'Fyndplats-kort' — ska vara 'Faktakort'" % (pid, i + 1))
            if len(t) > 160:
                fel.append("%s alt %d: %d tecken (tak 160)" % (pid, i + 1, len(t)))

        allt = " ".join(lista)
        for m, varfor in GR.FORBJUDET:
            if traff(m, allt):
                fel.append("%s: FORBJUDET %r — %s" % (pid, m, varfor))
        if G.ARTNR.search(allt):
            fel.append("%s: ARTIKELNUMMER i alt-texten" % pid)
        if G.TREKONSONANT.search(allt):
            fel.append("%s: trekonsonant i alt-texten" % pid)
        for h in G.HUSMARKEN:
            if re.search(r"\b%s\b" % re.escape(h), allt, re.I):
                fel.append("%s: husmärket %r i alt-texten" % (pid, h))
        for m in G.LANDORD:
            if traff(m, allt):
                fel.append("%s: LANDORD %r i alt-texten" % (pid, m))
        for m in G.LAGERFRAS:
            if traff(m, allt):
                fel.append("%s: LAGERFRAS %r i alt-texten" % (pid, m))
        # ⚠️ Beskriv VARAN, inte stajlingen: djuret och människan i leverantörens
        #    miljöbild är inte produktinformation (runbokens regel efter runda 106).
        for i, t in enumerate(lista):
            for ord_ in (r"\bkatt\b", r"\bkatten\b", r"\bkatter\b", r"\bkattunge",
                         r"\bbarn", r"\bkvinna", r"\bperson", r"\bpojke", r"\bflicka"):
                if re.search(ord_, t, re.I):
                    fel.append("%s alt %d: stajling — %r" % (pid, i + 1, ord_))

    alla = [t for l in A.ALT.values() for t in l]
    for t, n in Counter(alla).items():
        if n > 1:
            fel.append("upprepad alt-text (%d ggr): %r" % (n, t[:60]))
    return alla, fel


if __name__ == "__main__":
    # Självtest: grinden ska fälla på det den finns för.
    prov = [
        ("Faktakort saknas", {"1467588a": ["a", "b", "c"]}, "plats 3"),
        ("kattord", {"1467588a": ["En katt i en säng", "b", "Faktakort: x", "d", "e", "f"]}, "stajling"),
    ]
    spar = A.ALT
    sjalv = 0
    for namn, data, vantat in prov:
        A.ALT = data
        try:
            _, f = kor()
        except Exception as e:
            f = ["grinden KASTADE: %s" % e]
        if any(vantat in x for x in f):
            sjalv += 1
        else:
            print("  ✗ självtest %r fällde inte på %r — fick %s" % (namn, vantat, f[:2]))
    A.ALT = spar
    print("självtest %d/%d ok" % (sjalv, len(prov)))

    alla, fel = kor()
    print("alt-texter: %d st över %d produkter" % (len(alla), len(A.ALT)))
    for f in fel:
        print("  ✗", f)
    print("GRIND:", "0 fel" if not fel else "%d FEL" % len(fel))
    sys.exit(1 if fel else 0)
