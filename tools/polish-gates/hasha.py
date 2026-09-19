#!/usr/bin/env python3
"""Normaliserad hash av rundans källfiler — facit för återläsningen.

Skrivs till vantat-hash.tsv. Samma FNV-1a går att räkna i sandlådans JS, så
den lagrade texten kan jämföras mot filen utan att gå genom chatten.

ANVÄNDNING (från rundans katalog):  python3 ../../polish-gates/hasha.py
"""
import sys, os, glob, io
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gatelib import normalisera, fnv

rader = []
for f in sorted(glob.glob("*.html")):
    t = normalisera(io.open(f, encoding="utf-8").read())
    rader.append(f"{os.path.basename(f)[:-5]}\t{fnv(t)}\t{len(t)}")
io.open("vantat-hash.tsv", "w", encoding="utf-8").write("\n".join(rader) + "\n")
print("\n".join(rader))
