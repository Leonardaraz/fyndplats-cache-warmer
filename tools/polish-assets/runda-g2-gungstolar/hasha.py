#!/usr/bin/env python3
"""Normaliserad hash av rundans filer — facit för återläsningen.

⚠️ WIX NORMALISERAR TEXTEN PÅ TVÅ SÄTT, båda uppmätta i runda G1:
  1. blanksteg MELLAN blockelement strippas
  2. target="_self" läggs till på varje <a href>
En rå strängjämförelse ger därför "8 av 8 skiljer" på en felfri skrivning.
"""
import re, hashlib, glob, os

def norm(s):
    s = s.replace(' target="_self"', "")
    s = re.sub(r">\s+<", "><", s)
    return s.strip()

for f in sorted(glob.glob("*.html")):
    h = hashlib.sha256(norm(open(f, encoding="utf-8").read()).encode()).hexdigest()[:16]
    print(f"{os.path.basename(f)[:-5]}\t{h}")
