#!/usr/bin/env python3
"""RÅ kontrollsumma av rundans källfiler — facit för TRANSKRIBERINGSSPÄRREN.

Skiljer sig från `hasha.py` och är inte utbytbar mot den:

  hasha.py   NORMALISERAD text, FNV-1a  -> vantat-hash.tsv -> ÅTERLÄSNINGEN
             (jämför FILEN mot det Wix LAGRADE, alltså efter Wix egen
             normalisering)

  raahash.py RÅ text, h*31             -> raa-hash.tsv    -> SKRIVNINGEN
             (jämför FILEN mot den sträng som ligger i API-ANROPETS kropp,
             i SAMMA anrop som skriver — #256/#148)

☠️ RÄKNAS PÅ STRÄNGEN SOM DEN SKICKAS, INTE PÅ FILEN. Runda M4 avbröts på ETT
tecken av 3 515: facit räknades på filen, men en template-literal som slutar
med `</p>` bär ingen avslutande radbrytning. Det är samma byte som
`wixnorm.py` punkt 5 dokumenterar på LÄSNINGENS sida — den gällde åt båda
hållen hela tiden, och bara den ena halvan var nedskriven. Därav `rstrip("\\n")`.

⚠️ Avvikelsen är just därför den farligaste sorten: en byte ser ut som en
struntsak och går inte att skilja från ett äkta transkriberingsfel på ett
tecken. Spärren gjorde rätt som fällde — det som saknades var ett facit som
mätte samma sträng.

☠️ ARITMETIKEN ÄR VALD FÖR ATT GÅ ATT SPEGLA I JS. `h*31` håller sig under
2^53; FNV-1a:s `h*16777619` spränger float64 i sandlådans JS. Samma funktion
står i `kvitto.py`. Byt den inte utan att mäta båda sidorna.

ANVÄNDNING (från rundans katalog):  python3 ../../polish-gates/raahash.py
"""
import glob, io, os

def summa(s):
    h = 0
    for c in s:
        h = (h * 31 + (ord(c) & 0xFFFF)) % 1000000007
    return h

rader = []
for f in sorted(glob.glob("*.html")):
    # rstrip("\n"): strängen SOM DEN SKICKAS, inte filen. Se docstringen.
    t = io.open(f, encoding="utf-8").read().rstrip("\n")
    rader.append(f"{os.path.basename(f)[:-5]}\t{summa(t)}\t{len(t)}")
io.open("raa-hash.tsv", "w", encoding="utf-8").write("\n".join(rader) + "\n")
print("\n".join(rader))
