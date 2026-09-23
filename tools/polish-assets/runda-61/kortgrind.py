# -*- coding: utf-8 -*-
"""☠️ Ett kortvärde ska CITERA den rad spec-tabellen faktiskt har. Grinden läser
kortets specrader ur kort.py och kräver att varje värde står ordagrant i den
skrivna beskrivningen. (Rubriken mot fotot går INTE att grinda mekaniskt — den
läses av ögon på kortarket.)"""
import sys, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from texter import P
import importlib.util
spec = importlib.util.spec_from_file_location("k", "kort.py")

# läs SPEC-tabellen utan att rendera om korten
src = open("kort.py", encoding="utf-8").read()
blk = src.split("SPEC = [", 1)[1].split("\n]\n", 1)[0]
SPEC = eval("[" + blk + "]")

fel = []
for n, foto, kicker, rubrik, rader in SPEC:
    h = P[n]["html"]
    for k, v in rader:
        if v not in h:
            fel.append("%s: kortvärdet %r (%s) står inte i spec-tabellen" % (n, v, k))
    if not foto.endswith("_%s.jpg" % n):
        fel.append("%s: kortets foto %r hör till en annan produkt" % (n, foto))
    for ord_ in ("HOMCOM", "Outsunny", "PawHut", "Aosom", "Vinsetto"):
        if ord_.lower() in (kicker + rubrik).lower():
            fel.append("%s: husmärke i kortets text" % n)

if len(SPEC) != len(P):
    fel.append("antalet spec-kort (%d) matchar inte antalet produkter (%d)" % (len(SPEC), len(P)))

for f in fel:
    print("FEL:", f)
print()
print("Kortgrind: alla %d spec-kort citerar tabellen." % len(SPEC) if not fel
      else "GRIND FÄLLER: %d fel" % len(fel))
raise SystemExit(1 if fel else 0)
