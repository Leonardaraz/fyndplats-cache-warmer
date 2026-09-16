#!/usr/bin/env python3
"""Bygger FACIT- och IDS-blocken till aterlas.js UR RUNDANS FILER.

☠️ HASHARNA SKRIVS INTE AV. Runda H3 matte upp asymmetrin ordagrant: tre
produkter vars SEO-varden lastes ur filen med ett skript drev isar pa NOLL,
fem som skrevs av for hand drev isar pa FEM av FEM. En avskrift AR
mekanismen. Samma regel galler har: 16 hexatecken per rad ar precis det en
manniska skriver av fel, och ett feltypat facit ser ut som ett misslyckat
skrivfall.

Skriver INTE nagon fil — utdata ar tankt att klistras in i anropet, sa den
gar genom chatten en gang och bara en.

ANVANDNING (fran rundans katalog):
    python3 ../../polish-gates/hasha.py      # facit ur filerna forst
    python3 ../../polish-gates/aterlas.py
"""
import io, os, sys

if not os.path.exists("vantat-hash.tsv"):
    sys.exit("vantat-hash.tsv saknas — kor hasha.py forst")
if not os.path.exists("ids.tsv"):
    sys.exit("ids.tsv saknas")

facit = {}
for rad in io.open("vantat-hash.tsv", encoding="utf-8"):
    d = rad.rstrip("\n").split("\t")
    if len(d) == 3:
        facit[d[0]] = (d[1], int(d[2]))

ids = {}
for rad in io.open("ids.tsv", encoding="utf-8"):
    d = rad.rstrip("\n").split("\t")
    if len(d) >= 2:
        ids[d[0]] = d[1]

# ☠️ EN RAD UTAN FACIT AR INGEN RAD SOM STAMMER. Den far inte tigas ihjal och
# inte heller gissas — samma hallning som `utanWixPris` i prissynken.
utan = [k for k in ids if k not in facit]
if utan:
    sys.exit("AVBRYT: dessa produkter har id men inget facit: " + ", ".join(sorted(utan)))

print("  const FACIT = {")
for k in sorted(facit):
    if k in ids:
        print('    "%s": ["%s", %d],' % (k, facit[k][0], facit[k][1]))
print("  };")
print("  const IDS = {")
for k in sorted(ids):
    print('    "%s": "%s",' % (k, ids[k]))
print("  };")
print()
print("// %d produkter — klistra in ovan i aterlas.js, i funktionens borjan" % len(ids), file=sys.stderr)
