#!/usr/bin/env python3
"""Extra kontroll av alt.tsv utöver gate-alt.py (alt-rundan 2026-11-20, 889 bilder på 153 sidor).

ANVÄNDNING (från rundans eller arbetsgruppens katalog):  python3 ../../polish-gates/kontroll-alt-extra.py
Läser bilder.tsv och alt.tsv. Fäller på: saknad rad, för kort (under 28) eller för lång (över 200) text, samma text
två gånger på en sida eller på flera sidor, början på Måttbild/Måttskiss/Måttritning (flyttar bilden i galleriet, se
kontroll-galleriordning.py), "bild N"-mönster, inledningar som "Bild på" eller "Foto av", slutpunkt, dubbla blanksteg,
engelska ord och rader för bilder som inte finns. gate-alt.py kontrollerar ord, siffror och märken; den här kontrollerar
formen. En BEFINTLIG rad som fäller här går inte att rätta utan att ändra en text som redan är publicerad: bedöm den.
"""
import collections, io, os, re, sys

MIN, MAX = 28, 200
fel = []

# Strukna positioner (bilder-bort.tsv) ska inte ha någon alt-rad.
struken = set()
if os.path.exists("bilder-bort.tsv"):
    for r in io.open("bilder-bort.tsv", encoding="utf-8"):
        if r.strip():
            struken.add(tuple(r.split("\t")[:2]))

bilder = collections.OrderedDict()
for r in io.open("bilder.tsv", encoding="utf-8"):
    if r.strip():
        k, n, f = r.rstrip("\n").split("\t")
        if (k, n) not in struken:
            bilder[(k, n)] = f

alt = {}
for nr, r in enumerate(io.open("alt.tsv", encoding="utf-8"), 1):
    if not r.strip():
        continue
    d = r.rstrip("\n").split("\t")
    if len(d) != 3:
        fel.append(f"alt.tsv:{nr}: {len(d)} kolumner, väntade 3")
        continue
    k, n, a = d
    if (k, n) in struken:
        fel.append(f"alt.tsv:{nr}: {k} bild {n} är struken i bilder-bort.tsv men har en alt-rad")
    elif (k, n) not in bilder:
        fel.append(f"alt.tsv:{nr}: {k} bild {n} finns inte i bilder.tsv")
    if (k, n) in alt:
        fel.append(f"alt.tsv:{nr}: {k} bild {n} står två gånger")
    alt[(k, n)] = a

for kn in bilder:
    if kn not in alt:
        fel.append(f"SAKNAS: {kn[0]} bild {kn[1]} har ingen alt-text")

ENG = re.compile(r"\b(the|with|and|image|photo|picture|of the|front|side view|white background)\b", re.I)
START = re.compile(r"^\s*(M[åa]ttbild|M[åa]ttskiss|M[åa]ttritning)\b", re.I)
INLED = re.compile(r"^\s*(bild(en)?\s+(på|av|visar)|foto(t)?\s+(på|av)|fotografi|en bild)\b", re.I)
BILDN = re.compile(r"(–|-|,|\()\s*bild\s*\d+\b|\bbild\s+\d+\b", re.I)

per = collections.defaultdict(set)
alla = collections.Counter()
for (k, n), a in alt.items():
    l = a.lower().strip()
    if len(a.strip()) < MIN:
        fel.append(f"{k} bild {n}: för kort ({len(a.strip())} tecken)")
    if len(a.strip()) > MAX:
        fel.append(f"{k} bild {n}: för lång ({len(a.strip())} tecken, högst {MAX})")
    if a != a.strip() or "  " in a or "\t" in a or "\n" in a:
        fel.append(f"{k} bild {n}: blanksteg i ändarna eller dubbla blanksteg")
    if START.search(a):
        fel.append(f"{k} bild {n}: börjar på Måttbild/Måttskiss/Måttritning (flyttar bilden i galleriet): skriv om")
    if INLED.search(a):
        fel.append(f"{k} bild {n}: börjar med 'bild på', 'foto av' eller liknande")
    if BILDN.search(a):
        fel.append(f"{k} bild {n}: innehåller 'bild N'")
    if a.rstrip().endswith("."):
        fel.append(f"{k} bild {n}: slutar med punkt")
    if ENG.search(a):
        fel.append(f"{k} bild {n}: engelskt ord: {ENG.search(a).group(0)!r}")
    if l in per[k]:
        fel.append(f"{k} bild {n}: samma alt-text som en annan bild på sidan")
    per[k].add(l)
    alla[l] += 1

for l, n in alla.items():
    if n > 1:
        kort = sorted({k for (k, nn), a in alt.items() if a.lower().strip() == l})
        if len(kort) > 1:
            fel.append(f"samma alt-text på {len(kort)} olika sidor ({', '.join(kort[:4])}): {l[:70]!r}")

print(f"KONTROLL {'REN' if not fel else 'FÄLLER'}: {len({k for k, _ in bilder})} sidor, {len(bilder)} bilder, {len(alt)} alt-texter, {len(fel)} fynd")
for f in fel[:60]:
    print("  " + f)
if len(fel) > 60:
    print(f"  … och {len(fel) - 60} till")
sys.exit(1 if fel else 0)
