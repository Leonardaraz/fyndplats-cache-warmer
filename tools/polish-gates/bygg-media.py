#!/usr/bin/env python3
"""Bygger bildnyttolasten ur SAMMA källor som grinden läser (bilder.tsv + alt.tsv).

☠️ DEN BOR HÄR, INTE I RUNDANS KATALOG — och det var inte en förutsedd regel
utan ett FYND. När `gate-kopior.test.ts` breddades 2026-09-07 föll TRE kopior
ut i TRE versioner, precis som de nitton grindkopiorna gjorde:

  runda G1   egen grind (tom alt, dubblettbild, misstänkt fil-id) + revisioner
  runda G2   grinden nedbantad till bara `assert`, revisionerna borta
  runda I1   läser bilder.tsv, sorterar måttskissen sist — men utan G1:s grind

Ingen av dem hade allt. Den här filen är UNIONEN: G1:s kontroller tillbaka,
I1:s sortering och bilder.tsv kvar. Samma regel som för ordlistan i gatelib —
lägg till, byt aldrig ut.

VISNINGSORDNING: måttskissen (källposition 3) läggs SIST. Livsstilsbilderna
säljer; ritningen svarar på en fråga kunden ställer efteråt. ☠️ Position 1 blir
huvudbild och delningsbild, så en runda som tappar sorteringen får måttskissen
som produktens ansikte i sökresultat och kategorilistor — och ser ändå ut att
fungera. Det är just den sortens tysta skillnad som gör en tvilling farlig.

ANTALET är INTE hårdkodat till fem. `bilder-bort.tsv` (samma fil som
gate-alt.py läser) säger hur många som medvetet tagits bort per produkt; en
runda som strök en bild med tysk text i pixlarna ska inte fällas för det.

ANVÄNDNING (från rundans katalog):  python3 ../../polish-gates/bygg-media.py
  bilder.tsv       "kort  position  wix-fil-id"
  alt.tsv          "kort  position  alt-text"  (position = KÄLLposition)
  bilder-bort.tsv  VALFRI: "kort  position  skäl"
  -> nyttolast-media.json
"""
import json, os, sys, collections

fil = {}
for r in open("bilder.tsv", encoding="utf-8"):
    if not r.strip():
        continue
    kort, pos, f = r.rstrip("\n").split("\t")
    fil[(kort, pos)] = f

bort = collections.Counter()
if os.path.exists("bilder-bort.tsv"):
    for r in open("bilder-bort.tsv", encoding="utf-8"):
        if r.strip():
            bort[r.split("\t")[0]] += 1

vis = collections.OrderedDict()
fel = []
for nr, r in enumerate(open("alt.tsv", encoding="utf-8"), 1):
    if not r.strip():
        continue
    kort, pos, alt = r.rstrip("\n").split("\t")
    if (kort, pos) not in fil:
        fel.append(f"alt.tsv:{nr}  {kort} saknar fil-id för källposition {pos}")
        continue
    # ☠️ G1:s kontroller, återinförda. En tom alt-text skriver över en befintlig
    # med ingenting — hela itemsInfo.items ERSÄTTS av skrivningen, så det som
    # inte står i listan finns inte kvar.
    if not alt.strip():
        fel.append(f"alt.tsv:{nr}  {kort} position {pos}: tom alt-text")
    if not fil[(kort, pos)].startswith("b379ce_"):
        fel.append(f"alt.tsv:{nr}  {kort} position {pos}: misstänkt fil-id {fil[(kort, pos)]!r}")
    vis.setdefault(kort, []).append((pos, fil[(kort, pos)], alt))

for kort, rader in vis.items():
    vantat = 5 - bort[kort]
    if len(rader) != vantat:
        fel.append(f"ANTAL: {kort} har {len(rader)} bilder, väntade {vantat}")
    if len({f for _, f, _ in rader}) != len(rader):
        fel.append(f"DUBBLETT: {kort} har samma bild två gånger")

if fel:
    print("BYGGET FALLER:\n" + "\n".join("  " + f for f in fel))
    sys.exit(1)

ut = collections.OrderedDict()
for kort, rader in vis.items():
    rader.sort(key=lambda t: (t[0] == "3", int(t[0])))   # måttskissen sist
    ut[kort] = [{"id": f, "altText": a} for _, f, a in rader]

json.dump(ut, open("nyttolast-media.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for k, v in ut.items():
    print(f"{k}  {len(v)} bilder  ordning {' '.join(p for p, _, _ in vis[k])}")
