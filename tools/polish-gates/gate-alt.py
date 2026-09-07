#!/usr/bin/env python3
"""Filgrind för alt-texterna (`alt.tsv`).

☠️ VARFÖR DEN FINNS. gate.py läser bara *.html, så alt.tsv gick genom hela
kedjan ogrindad — och en dansk stavning ("rundt bord") nådde Wix. Den fångades
bara av tur. Samma blinda fläck som ett sidsvep har: strippar man taggar ser
man inte in i alt="".

☠️ VÄNTAT ANTAL MÄTS, det antas inte. Först var det hårdkodat till fem; sedan
till "fem minus bilder-bort.tsv" — och båda utgick från att varje produkt HAR
fem bilder. Runda J1:s båglampa har fyra i Wix, och grinden fällde en helt
korrekt alt-fil för det. Facit är `bilder.tsv`, som listar produktens
FAKTISKA bilder; `bilder-bort.tsv` drar ifrån dem vi medvetet strukit. Saknas
bilder.tsv faller grinden tillbaka på fem, som förr.

ANVÄNDNING (från rundans katalog):  python3 ../../polish-gates/gate-alt.py
  alt.tsv          "kort  position  alt-text"
  kallor-tal.json  facit per produkt
  bilder-bort.tsv  VALFRI: "kort  position  skäl" för varje borttagen bild
"""
import re, sys, os, json, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gatelib import GRINDAR, tal, las_facit

# ☠️ BÅDA FACIT-FORMATEN, via gatelib. Fram till 2026-09-07 läste den bara
# `kallor-tal.json` och KRASCHADE med FileNotFoundError på en runda som bär
# hela källtexten i `kallor.json`. En grind som kraschar körs förbi, precis
# som en grind som inte kan fälla — och alt-texterna är den blinda fläck som
# ett sidsvep aldrig ser in i.
kallor, _facitfil = las_facit()
if kallor is None:
    print("AVBRYT: varken kallor-tal.json eller kallor.json finns — "
          "siffergrinden kan inte köras och alt.tsv får inte passera ogrindad")
    sys.exit(1)
rader = [l.rstrip("\n").split("\t") for l in open("alt.tsv", encoding="utf-8") if l.strip()]

bort = collections.Counter()
if os.path.exists("bilder-bort.tsv"):
    for rad in open("bilder-bort.tsv", encoding="utf-8"):
        if rad.strip():
            bort[rad.split("\t")[0]] += 1

# Produktens FAKTISKA bildantal, mätt ur bilder.tsv i stället för antaget till fem.
har = collections.Counter()
if os.path.exists("bilder.tsv"):
    for rad in open("bilder.tsv", encoding="utf-8"):
        if rad.strip():
            har[rad.split("\t")[0]] += 1

fynd = 0
per = collections.Counter()
sedda = collections.defaultdict(set)
for nr, r in enumerate(rader, 1):
    if len(r) != 3:
        print(f"alt.tsv:{nr}  FORM: {len(r)} kolumner, väntade 3"); fynd += 1; continue
    kort, pos, alt = r
    per[kort] += 1
    if pos in sedda[kort]:
        print(f"alt.tsv:{nr}  DUBBEL POSITION: {kort} position {pos} två gånger"); fynd += 1
    sedda[kort].add(pos)
    for namn, m in GRINDAR:
        for t in re.findall(m, alt):
            t = t if isinstance(t, str) else t[0]
            print(f"alt.tsv:{nr}  {namn}: {t!r}  ({kort})"); fynd += 1
    for t in tal(alt) - set(kallor.get(kort, [])):
        print(f"alt.tsv:{nr}  SIFFRA UTAN KÄLLA: {t}  ({kort})"); fynd += 1

for kort, n in sorted(per.items()):
    vantat = (har[kort] or 5) - bort[kort]
    if n != vantat:
        print(f"ANTAL: {kort} har {n} alt-texter, väntade {vantat}"); fynd += 1

print(f"GRIND {'REN' if not fynd else 'FÄLLER'}: {len(per)} produkter, {len(rader)} alt-texter, {fynd} fynd")
sys.exit(1 if fynd else 0)
