# -*- coding: utf-8 -*-
import sys, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from texter import P

# ☠️ Hade en EGEN kopia av normaliseringen med fyra av fem regler. Den saknade
# den avslutande radbrytningen och låg alltså en byte fel i varje runda vars
# fil slutar med radbrytning — alltså alla. En enda definition, i wixnorm.
from wixnorm import normalisera

def fnv(s):
    # h*31 halls under 2^53 — samma exakta aritmetik i JS och Python.
    # FNV-1a gick INTE att spegla: h*16777619 spranger float64 i JS.
    h = 0
    for c in s:
        h = (h * 31 + (ord(c) & 0xFFFF)) % 1000000007
    return str(h)

LAGRAT = {
 "08230ec1": (4486, "166505716"), "82fec275": (3777, "218077467"),
 "b4fad293": (3519, "222395476"), "7167f9ac": (3538, "311354984"),
 "2b7853e9": (3269, "783471214"), "edf78ba9": (3590, "597341335"),
 "4fdd8d3c": (3107, "568873891"), "fdefa04b": (3275, "753105508"),
}
fel = 0
for k, d in P.items():
    n = normalisera(d["html"])
    lg, lh = LAGRAT[k]
    ok = (len(n) == lg and fnv(n) == lh)
    if not ok: fel += 1
    print(f"  {'✓' if ok else '✗'} {k}  källa {len(d['html']):5d} → normaliserad {len(n):5d} (lagrat {lg}) "
          f"hash {fnv(n)} (lagrat {lh})")
print(f"\n{len(P)} produkter · {fel} avvikelser")
sys.exit(1 if fel else 0)
