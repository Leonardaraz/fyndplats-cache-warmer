# -*- coding: utf-8 -*-
"""Runda 87 — grinden mot alt-texterna, och mutationstestet som bevisar den.

☠️ MÖNSTREN DELAS MED lint.py, de kopieras inte. Runda 86 mätte upp att
   `m²` fanns i lint men saknades i alt-grinden, och en muterad "0,43 m²
   golvyta" i en alt-text slapp rakt igenom. En tvilling glider isär.

☠️ UNIKHETEN ÄR RUNDANS EGEN GRIND. Två färgsyskonpar delar bild 3, 4 och 5
   som SAMMA SCEN omfärgad. Blir alt-texterna identiska får två av VÅRA egna
   URL:er samma bildbeskrivningar — den interna dubbletten Google straffar,
   skapad av oss själva.
"""
import json
import os
import re
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)

import lint                                                          # noqa: E402
import media                                                         # noqa: E402
import texter                                                        # noqa: E402
from grindar import (TYSKA, HUSMARKEN, LANDORD, ATTRIBUTION, ARTNR,   # noqa: E402
                     LAGERFRAS)

SPEC = {p["kort"]: p["spec"] for p in texter.PRODUKTER}
FEL = []


def kor(plan):
    del FEL[:]
    sedda = {}
    for rad in plan:
        k = rad["kort"]
        poster = rad["poster"]
        if len(poster) != 6:
            FEL.append("%s: %d bilder, väntade 6" % (k, len(poster)))
        # ☠️ Kortet på plats 3, ritningen sist.
        if not poster[2].get("kort"):
            FEL.append("%s: eget kort ligger inte på plats 3" % k)
        if not re.search(r"[Mm]åttritning", poster[-1]["altText"]):
            FEL.append("%s: sista bilden är inte måttritningen" % k)
        # Färgordet måste stämma.
        farg = lint.FARG[k]
        for i, post in enumerate(poster, 1):
            a = post["altText"]
            for o in TYSKA + lint.TYSKA_BANK + HUSMARKEN + ATTRIBUTION:
                if re.search(r"\b%s" % re.escape(o), a, re.I):
                    FEL.append("%s bild %d: förbjudet ord %r" % (k, i, o))
            for o in LANDORD:
                if re.search(r"\b%s\b" % re.escape(o), a, re.I):
                    FEL.append("%s bild %d: landsnamn %r" % (k, i, o))
            for f in LAGERFRAS:
                if re.search(re.escape(f), a, re.I):
                    FEL.append("%s bild %d: lagerfras %r" % (k, i, f))
            if ARTNR.search(a):
                FEL.append("%s bild %d: artikelnummer" % (k, i))
            if lint.VINTER_RE.search(a):
                FEL.append("%s bild %d: vinterlöfte" % (k, i))
            if re.search(r"\brundan\b|\butkast\b|\bpublicerad\w*", a, re.I):
                FEL.append("%s bild %d: intern jargong" % (k, i))
            # ☠️ Samma talgrind som linten — inte en kopia.
            tillatna = lint.tal_i(" ".join(SPEC[k]))
            for t in sorted(lint.tal_i(a) - tillatna):
                FEL.append("%s bild %d: tal som inte står i specen: %s" % (k, i, t))
            annan = "mörkgrå" if farg == "ljusgrå" else "ljusgrå"
            if re.search(r"\b%s" % annan, a, re.I):
                FEL.append("%s bild %d: fel färgord %r — den här är %s"
                           % (k, i, annan, farg))
            if not (40 <= len(a) <= 120):
                FEL.append("%s bild %d: alt-texten är %d tecken (40-120)"
                           % (k, i, len(a)))
            if a in sedda:
                FEL.append("%s bild %d: alt-texten är IDENTISK med %s"
                           % (k, i, sedda[a]))
            sedda[a] = "%s bild %d" % (k, i)
    return FEL


MUTATIONER = [
    ("72051417", 0, "Ljusgrått garagetält 120 × 179 cm med sadeltak och öppen front",
     "Mörkgrått garagetält 120 × 179 cm med sadeltak och öppen front", "fel färgord"),
    ("5f6592ad", 1, "Mörkgrått garagetält på altan med cykel, arbetsbänk och krukor",
     "Mörkgrått garagetält på altan, 0,43 m² golvyta, med cykel och krukor",
     "tal som inte står i specen"),
    ("8bdba748", 3, "Cykelgarage fyllt med staplad ved upp till taket",
     "Cykelgarage fyllt med staplad ved — vinterklart hela året",
     "vinterlöfte"),
    ("6a419d8b", 1, "Garagetält med hyllställ och röd åkgräsklippare inne vid vitt hus",
     "Gartenschuppen med hyllställ och röd åkgräsklippare inne vid vitt hus",
     "förbjudet ord"),
    ("95a9d7cc", 4, "Ljusgrått förrådstält sett från sidan med plattgång framför",
     "Ljusgrått förrådstält sett från sidan", "40-120"),
    # ☠️ Den viktigaste: två av VÅRA egna sidor med samma alt-text.
    ("20c0942e", 3, "Ljusgrått garagetält med en motorcykel inställd på gräsmattan",
     "Mörkgrått garagetält med en motorcykel inställd på gräsmattan",
     "IDENTISK"),
]


def mutationer():
    fangade, missade = 0, []
    for k, idx, sok, ers, vantat in MUTATIONER:
        p = json.loads(json.dumps(media.plan()))
        for rad in p:
            if rad["kort"] != k:
                continue
            traff = [q for q in rad["poster"] if q["altText"] == sok]
            assert traff, "%s: hittade inte %r" % (k, sok)
            traff[0]["altText"] = ers
        kor(p)
        if [f for f in FEL if f.startswith(k) and vantat.lower() in f.lower()]:
            fangade += 1
        else:
            missade.append("%s/%d → väntade %r, fick: %s" % (k, idx, vantat, FEL or "INGET"))
    return fangade, missade


if __name__ == "__main__":
    kor(media.plan())
    print("orörd plan: %d fel" % len(FEL))
    for f in FEL:
        print("  FEL:", f)
    ok = not FEL
    f, m = mutationer()
    print("mutationer: %d/%d fångade" % (f, len(MUTATIONER)))
    for x in m:
        print("  MISSAD:", x)
    raise SystemExit(0 if (ok and not m) else 1)
