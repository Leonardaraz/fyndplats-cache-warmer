#!/usr/bin/env python3
"""Lägger KORTET sist i bildlistan och räknar facit för mediaskrivningen.

Tar vid där `bygg-media.py` slutar:

  bygg-media.py         bilder.tsv + alt.tsv      -> nyttolast-media.json
  bygg-medieskrivning.py  + kort-filer.tsv
                          + kortalt.tsv           -> medieskrivning.json
                                                     media-hash.tsv

☠️ KORTET LIGGER SIST, OCH DET ÄR INTE EN SMAKSAK. Position 1 blir huvudbild
och delningsbild i sökresultat och kategorilistor — ett kort som hamnar först
gör en tillverkad grafik till produktens ansikte. Samma skäl som håller
måttskissen sist i `bygg-media.py`.

☠️ KORTETS FIL-ID MÅSTE VARA BEVISAT, INTE ANTAGET. `kort-filer.tsv` byggs ur
md5-jämförelsen mot den hemhämtade filen, aldrig ur uppladdningens ordning:
`UploadImageToWixSite` svarar med en lista id utan att säga vilket id som kom
från vilken adress. Samma attribution-på-ordning som huset redan vägrat lita
på i lagersynken.

☠️ FACIT RÄKNAS PÅ `id + "|" + altText`, RADER SAMMANFOGADE MED `\\n`, och
används av ALT-TEXTGRINDEN i samma anrop som mediaskrivningen. Alt-texter är
lika transkriberade som brödtexten — runda J2 publicerade åtta produkter med
fyrtio tyska alt-texter och varje API-svar sa framgång. Samma aritmetik som
`raahash.py`, av samma skäl: den går att spegla i sandlådans JS.

⚠️ HELA `itemsInfo.items` ERSÄTTS av skrivningen. Det som inte står i listan
finns inte kvar på produkten — därav att antalet mäts ur `bilder.tsv` i
`bygg-media.py` och aldrig antas till fem.

ANVÄNDNING (från rundans katalog):
  python3 ../../polish-gates/bygg-media.py
  python3 ../../polish-gates/bygg-medieskrivning.py
"""
import collections, io, json, sys

def summa(s):
    # h*31 haller sig under 2^53 — samma exakta aritmetik i JS och Python.
    h = 0
    for c in s:
        h = (h * 31 + (ord(c) & 0xFFFF)) % 1000000007
    return h

media = json.load(io.open("nyttolast-media.json", encoding="utf-8"),
                  object_pairs_hook=collections.OrderedDict)

kortfil, kortalt, fel = {}, {}, []
for r in io.open("kort-filer.tsv", encoding="utf-8"):
    if r.strip():
        kort, sort, f = r.rstrip("\n").split("\t")
        if sort == "kort":
            kortfil[kort] = f
for r in io.open("kortalt.tsv", encoding="utf-8"):
    if r.strip():
        kort, alt = r.rstrip("\n").split("\t", 1)
        kortalt[kort] = alt

for kort in media:
    if kort not in kortfil:
        fel.append(f"{kort}: saknar rad i kort-filer.tsv (obevisat fil-id?)")
    if not kortalt.get(kort, "").strip():
        fel.append(f"{kort}: saknar alt-text i kortalt.tsv")
    if kort in kortfil and not kortfil[kort].startswith("b379ce_"):
        fel.append(f"{kort}: misstänkt kort-fil-id {kortfil[kort]!r}")
    if kort in kortfil and kortfil[kort] in {p["id"] for p in media[kort]}:
        fel.append(f"{kort}: kortet ligger redan i bildlistan")

if fel:
    print("BYGGET FALLER:\n" + "\n".join("  " + f for f in fel))
    sys.exit(1)

ut, rader = collections.OrderedDict(), []
for kort, poster in media.items():
    ut[kort] = list(poster) + [{"id": kortfil[kort], "altText": kortalt[kort]}]
    s = "\n".join(p["id"] + "|" + p["altText"] for p in ut[kort])
    rader.append(f"{kort}\t{summa(s)}\t{len(s)}")

json.dump(ut, io.open("medieskrivning.json", "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
io.open("media-hash.tsv", "w", encoding="utf-8").write("\n".join(rader) + "\n")
for kort, poster in ut.items():
    print(f"{kort}  {len(poster)} poster (kortet sist: {poster[-1]['id'][:20]}…)")
print("\n" + "\n".join(rader))
