# -*- coding: utf-8 -*-
"""Grindar ALT-TEXTERNA — samma lista som brödtexten, inte en omskriven.

☠️ Runbokens regel efter runda 106: alt-texten är kundtext och passerar ingen
   av stegens grindar av sig själv, för den bor i Wix media och aldrig i
   `texter.py`. Sex sidor vars brödtext sa "säljs inte som kaninbostad" var
   gröna medan FEM av dem hade "kaniner" i en alt-text.

Den här filen kör rundans EGNA `FORBJUDET` plus den delade modulens
kategoriska regler över exakt de strängar som skickas till Wix — och över
ordningen, så en kastad bild inte kan smyga tillbaka.
"""
import os
import re
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import grindar as G                                              # noqa: E402
import grind as GR                                               # noqa: E402
import bilder as BI                                              # noqa: E402
import galleri as GA                                             # noqa: E402
import texter as T                                               # noqa: E402

import brodtext as B                                              # noqa: E402

_INGAR = re.compile(r"<li><p>Ing[\u00e5a]r: (.*?)</p></li>")


def _ingar(pid):
    """Sidans egen leveransomfattning, LÄST ur den HTML kunden får.

    ☠️ Ingen tvilling: skrivs listan av för hand här kan den glida från
       spec-tabellen, och då prövar grinden alt-texten mot fel facit.
    """
    m = _INGAR.search(B.HTML[pid])
    if not m:
        raise KeyError("%s saknar Ingår-rad i spec-tabellen" % pid)
    return [d.strip() for d in re.split(r"[,\u2014]| och ", m.group(1)) if d.strip()]


# Bilder STEG4.md dömde ut. De får inte finnas i ORDNING — en kastad bild som
# smyger tillbaka är samma klass av fel som en tyst ignorerad fältskrivning.
KASTAS = {"d307632a": [3], "1409d762": [5], "c00988e3": [4], "87ec8a16": [5]}


def granska():
    fel = []
    for pid in T.BATCH:
        ordning, alt = BI.ORDNING[pid], BI.ALT[pid]
        antal = len(GA.G[pid])

        # --- ordningen -------------------------------------------------
        if ordning[:3] != [1, 2, "K"]:
            fel.append("%s ORDNING: hjälte, verklighet, kort måste ligga först — %r"
                       % (pid, ordning[:3]))
        if 3 in ordning and ordning[-1] != 3:
            fel.append("%s ORDNING: måttritningen ligger inte sist — %r" % (pid, ordning))
        for p in KASTAS.get(pid, []):
            if p in ordning:
                fel.append("%s ORDNING: bild %d är utdömd men ligger kvar" % (pid, p))
        for p in ordning:
            if p != "K" and not 1 <= p <= antal:
                fel.append("%s ORDNING: position %r finns inte (%d bilder)" % (pid, p, antal))
        if len(set(ordning)) != len(ordning):
            fel.append("%s ORDNING: samma bild två gånger" % pid)
        vantat = {p for p in range(1, antal + 1)} - set(KASTAS.get(pid, []))
        if vantat - set(ordning):
            fel.append("%s ORDNING: bild %s tappades utan beslut"
                       % (pid, sorted(vantat - set(ordning))))

        # --- alt-texterna ----------------------------------------------
        if set(alt) != set(ordning):
            fel.append("%s ALT: texter och ordning går isär — %s"
                       % (pid, sorted(set(alt) ^ set(ordning))))
        for p in ordning:
            t = alt.get(p, "")
            if not t:
                fel.append("%s bild %r: TOM alt-text" % (pid, p))
                continue
            märk = "%s bild %r" % (pid, p)
            if len(t) > 200:
                fel.append("%s: alt-texten är %d tecken (tak 200)" % (märk, len(t)))
            if not t[0].isupper():
                fel.append("%s: alt-texten börjar inte med versal" % märk)
            if not t.rstrip().endswith("."):
                fel.append("%s: alt-texten saknar punkt" % märk)
            if p == "K" and not t.startswith("Faktakort: "):
                fel.append("%s: kortets alt-text måste börja med 'Faktakort: '" % märk)
            if p != "K" and t.startswith("Faktakort"):
                fel.append("%s: bara kortet får heta Faktakort" % märk)

            # Delade, kategoriska grindar — samma kod som brödtexten.
            for träff in G.ARTNR.finditer(t):
                fel.append("%s: ARTIKELNUMMER %r" % (märk, träff.group(0)))
            # ⚠️ De tre nedan är ORDLISTOR i den delade modulen, inte
            #    mönster — en `.finditer` på dem kastar. Kontrollerat, inte
            #    antaget: `type(G.HUSMARKEN)` är `list`.
            lag = t.lower()
            for etikett, lista in (("HUSMÄRKE", G.HUSMARKEN),
                                   ("LANDORD", G.LANDORD),
                                   ("LAGERFRAS", G.LAGERFRAS)):
                for ord_ in lista:
                    if ord_ in lag:
                        fel.append("%s: %s %r" % (märk, etikett, ord_))
            for träff in G.SORTIMENTSSUPERLATIV.finditer(t):
                fel.append("%s: SORTIMENTSSUPERLATIV %r" % (märk, träff.group(0)))
            for träff in G.MARKNADSPASTAENDE.finditer(t):
                fel.append("%s: MARKNADSPÅSTÅENDE %r" % (märk, träff.group(0)))
            for träff in G.TREKONSONANT.finditer(t):
                fel.append("%s: TREKONSONANT %r" % (märk, träff.group(0)))
            for tecken in G.homoglyfer(t):
                fel.append("%s: HOMOGLYF %r" % (märk, tecken))
            # ⚠️ `leveransloften` vill ha produktens LEVERANSOMFATTNING som
            #    andra argument — den fäller när ett tillbehör sägs ingå utan
            #    att stå i listan. Den läses ur sidans egen `Ingår`-rad, så
            #    alt-texten och brödtexten prövas mot samma facit.
            for fras in G.leveransloften(t, _ingar(pid), pid):
                fel.append("%s: %s" % (märk, fras))

            # Rundans EGEN lista, ordagrant — ingen omskriven variant.
            for etikett, mönster in GR.FORBJUDET:
                m = re.search(mönster, t, re.I)
                if m:
                    fel.append("%s: %s %r" % (märk, etikett, m.group(0)))
    return fel


def _sjalvtest():
    """Fäller grinden på det den finns för? Verifierat genom att mata in felen."""
    prov = [
        ("Boxsäcksstället 838-172BG i svart stål.", "ARTIKELNUMMER"),
        ("Boxningssäcken från HOMCOM sedd framifrån.", "HUSMÄRKE"),
        ("Säcken hoppplattform mot golvet.", "TREKONSONANT"),
        ("Den största säcken i hela sortimentet.", "SORTIMENTSSUPERLATIV"),
        ("De flesta fristående säckar står så här.", "MARKNADSPÅSTÅENDE"),
    ]
    brister = []
    for text, vantat in prov:
        traffar = []
        for namn, regex in (("ARTIKELNUMMER", G.ARTNR),
                            ("SORTIMENTSSUPERLATIV", G.SORTIMENTSSUPERLATIV),
                            ("MARKNADSPÅSTÅENDE", G.MARKNADSPASTAENDE)):
            if regex.search(text):
                traffar.append(namn)
        if G.TREKONSONANT.finditer(text):
            if any(True for _ in G.TREKONSONANT.finditer(text)):
                traffar.append("TREKONSONANT")
        if any(o in text.lower() for o in G.HUSMARKEN):
            traffar.append("HUSMÄRKE")
        if vantat not in traffar:
            brister.append("%r fälldes inte som %s (gav %s)" % (text, vantat, traffar))
    return brister


if __name__ == "__main__":
    brister = _sjalvtest()
    if brister:
        print("☠️ SJÄLVTESTET FALLER — grinden kan inte lita på:")
        for b in brister:
            print("   ", b)
        raise SystemExit(2)
    print("självtest: %d fall, 0 fel" % 5)
    fel = granska()
    if fel:
        print("ALTGRIND: %d FEL" % len(fel))
        for f in fel:
            print("  ", f)
        raise SystemExit(1)
    n = sum(len(v) for v in BI.ORDNING.values())
    print("ALTGRIND: GRÖN — %d produkter, %d bilder, %d alt-texter"
          % (len(BI.ORDNING), n, n))
