#!/usr/bin/env python3
"""Normaliserad hash av rundans källfiler — facit för återläsningen.

Skrivs till vantat-hash.tsv. Samma FNV-1a går att räkna i sandlådans JS, så
den lagrade texten kan jämföras mot filen utan att gå genom chatten.

☠️ NORMALISERINGEN KOMMER UR `wixnorm`, INTE UR `gatelib`. Uppmätt i runda N2:
facit låg 63–105 tecken UNDER den lagrade texten på alla åtta produkterna, och
avvikelsen var exakt 7 × antalet `<li>`. `gatelib.normalisera` kände bara två
av Wix fem åtgärder — den missade `<strong>`-bytet, `<li><p>`-inslaget och den
avslutande radbrytningen.

Ingen skrivning var fel. Det var FACIT som var det, och riktningen är den
farliga: en korrekt skrivning rapporteras som SKILJER, och den som sett det
nog många gånger slutar titta efter vilket det var. Tredje gången huset hittar
samma tvilling (`SHIP_AXIS_RE`, `EU_TULL_CODES`) — och den här gången var det
grinden som glidit, inte koden den grindar.

ANVÄNDNING (från rundans katalog):  python3 ../../polish-gates/hasha.py
"""
import sys, os, glob, io
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gatelib import fnv
from wixnorm import normalisera

rader = []
for f in sorted(glob.glob("*.html")):
    t = normalisera(io.open(f, encoding="utf-8").read())
    rader.append(f"{os.path.basename(f)[:-5]}\t{fnv(t)}\t{len(t)}")
io.open("vantat-hash.tsv", "w", encoding="utf-8").write("\n".join(rader) + "\n")
print("\n".join(rader))
