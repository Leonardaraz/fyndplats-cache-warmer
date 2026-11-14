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

☠️ ANTALET MÄTS UR `bilder.tsv`, det antas inte till fem. Först var det
hårdkodat, sedan "fem minus bilder-bort.tsv" — båda utgår från att varje
produkt HAR fem bilder. Runda J1:s båglampa har fyra i Wix, och bygget föll
på en helt korrekt alt-fil. Facit är bilder.tsv, som listar produktens
FAKTISKA bilder; bilder-bort.tsv drar ifrån dem vi medvetet strukit.

⚠️ Exakt samma antagande satt i gate-alt.py och rättades i samma veva. Att
två filer råkade dela ett fel är just varför den här bor i polish-gates och
inte i rundans katalog.

☠️ EN STÄDRUNDA FLYTTAR INGA BILDER (2026-11-14). Regeln "måttbilden sist"
gäller när en runda bygger galleriet. På en publicerad sida med färgval kan
måttbilden med flit ligga bland sin färgs bilder: hundgrinden dab49bb1 har den
som tredje av de grå, före de vita. En städrunda som bara rättar texten hade
ändå flyttat den sist, bland de vita, eftersom mediasteget alltid skickar hela
listan. `behall-bildordning.tsv` ("kort  skäl", skälet minst tio tecken) håller
produktens bilder i positionsordning, alltså i den ordning `bilder.tsv` och
`alt.tsv` hämtades ur Wix. Utan filen bygger allt som förut.

ANVÄNDNING (från rundans katalog):  python3 ../../polish-gates/bygg-media.py
  bilder.tsv       "kort  position  wix-fil-id"
  alt.tsv          "kort  position  alt-text"  (position = KÄLLposition)
  bilder-bort.tsv  VALFRI: "kort  position  skäl"
  behall-bildordning.tsv  VALFRI: "kort  skäl" — ordningen följer positionen
  -> nyttolast-media.json
"""
import json, os, re, sys, collections

fil = {}
for r in open("bilder.tsv", encoding="utf-8"):
    if not r.strip():
        continue
    kort, pos, f = r.rstrip("\n").split("\t")
    fil[(kort, pos)] = f

bort = collections.Counter()
# ☠️ STRUKNA POSITIONER, inte bara antalet (2026-09-27). Bygget räknade bara
# hur många bilder varje produkt fick stryka. En alt-rad för en struken
# position gick då igenom så länge antalet stämde: strök man bild 2 men
# skrev alt för 1–4 i stället för 1, 3, 4 och 5 publicerades den strukna
# bilden och en ren föll bort, utan ett enda fel.
struken = set()
if os.path.exists("bilder-bort.tsv"):
    for r in open("bilder-bort.tsv", encoding="utf-8"):
        if r.strip():
            bort[r.split("\t")[0]] += 1
            struken.add(tuple(r.split("\t")[:2]))

vis = collections.OrderedDict()
fel = []
behall = {}
if os.path.exists("behall-bildordning.tsv"):
    for nr, r in enumerate(open("behall-bildordning.tsv", encoding="utf-8"), 1):
        if not r.strip() or r.startswith("#"):
            continue
        delar = r.rstrip("\n").split("\t", 1)
        if len(delar) != 2 or len(delar[1].strip()) < 10:
            fel.append(f"behall-bildordning.tsv:{nr}  ska vara kort ⇥ skäl (minst tio tecken)")
            continue
        behall[delar[0].strip()] = delar[1].strip()
for nr, r in enumerate(open("alt.tsv", encoding="utf-8"), 1):
    if not r.strip():
        continue
    kort, pos, alt = r.rstrip("\n").split("\t")
    if (kort, pos) not in fil:
        fel.append(f"alt.tsv:{nr}  {kort} saknar fil-id för källposition {pos}")
        continue
    if (kort, pos) in struken:
        fel.append(f"alt.tsv:{nr}  {kort} position {pos} är struken i bilder-bort.tsv")
    # ☠️ G1:s kontroller, återinförda. En tom alt-text skriver över en befintlig
    # med ingenting — hela itemsInfo.items ERSÄTTS av skrivningen, så det som
    # inte står i listan finns inte kvar.
    if not alt.strip():
        fel.append(f"alt.tsv:{nr}  {kort} position {pos}: tom alt-text")
    if not fil[(kort, pos)].startswith("b379ce_"):
        fel.append(f"alt.tsv:{nr}  {kort} position {pos}: misstänkt fil-id {fil[(kort, pos)]!r}")
    vis.setdefault(kort, []).append((pos, fil[(kort, pos)], alt))

har = collections.Counter()
for r in open("bilder.tsv", encoding="utf-8"):
    if r.strip():
        har[r.split("\t")[0]] += 1

for kort in behall:
    if kort not in vis:
        fel.append(f"behall-bildordning.tsv: {kort} har inga rader i alt.tsv")

for kort, rader in vis.items():
    vantat = (har[kort] or 5) - bort[kort]
    if len(rader) != vantat:
        fel.append(f"ANTAL: {kort} har {len(rader)} bilder, väntade {vantat}")
    if len({f for _, f, _ in rader}) != len(rader):
        fel.append(f"DUBBLETT: {kort} har samma bild två gånger")

if fel:
    print("BYGGET FALLER:\n" + "\n".join("  " + f for f in fel))
    sys.exit(1)

def ar_mattbild(alt):
    return re.match(r"\s*(Måttbild|Måttskiss|Måttritning)\b", alt, re.I) is not None


ut = collections.OrderedDict()
for kort, rader in vis.items():
    # ☠️ MÅTTBILDEN SIST — avgjord på alt-texten, inte på position 3 (2026-10-21). Regeln "källposition 3 sist" stämmer
    # bara när måttbilden råkar ligga på position 3. I T78 låg den på 5 (agilityvärden) och 4 (hindersetet), så en
    # närbild på ett rör hamnade sist och måttbilden mitt i galleriet. Finns ingen alt-text som börjar på Måttbild/
    # Måttskiss/Måttritning gäller den gamla regeln (position 3), så äldre rundor bygger som förut.
    if kort in behall:
        rader.sort(key=lambda t: int(t[0]))   # den publicerade ordningen, se behall-bildordning.tsv
    else:
        har_matt = any(ar_mattbild(a) for _, _, a in rader)
        rader.sort(key=lambda t: ((ar_mattbild(t[2]) if har_matt else t[0] == "3"), int(t[0])))   # måttbilden sist
    ut[kort] = [{"id": f, "altText": a} for _, f, a in rader]

json.dump(ut, open("nyttolast-media.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for k, v in ut.items():
    print(f"{k}  {len(v)} bilder  ordning {' '.join(p for p, _, _ in vis[k])}"
          + ("  (behållen, behall-bildordning.tsv)" if k in behall else ""))
