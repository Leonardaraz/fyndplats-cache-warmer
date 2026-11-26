#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""syskon_twin.py <arbetskatalog> <syskonfil> <id8,id8,...> <bilddir>: tvillingkontrollen mot syskonlistan från `syskon_foton.js`.
Laddar ned syskonens bilder (Wix media-id, `curl`) till <bilddir> (scratchpad, aldrig repot), jämför dem med kandidaternas
`<arbetskatalog>/cand/<id8>/d1..d6.jpg` (dHash 16 x 16, rakt och spegelvänt) och skriver de fem närmaste syskonen per kandidat som
(steg av 256, id8, P|D|titel). Högst 5 steg är samma foto: kandidaten väljs bort eller frågan går till Leonard. Kör med /usr/bin/python3 (PIL)."""
import json, os, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, ImageOps
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from parse_ut import las
ARB = sys.argv[1]; FIL = sys.argv[2]; NY = sys.argv[3].split(","); UT = sys.argv[4]
d = las(FIL)
rader = [r for r in d["ut"] if r.get("b")]
print("syskon:", len(rader), " publicerade:", sum(1 for r in rader if r["t"].startswith("P|")))
def dh(im):
    g = im.convert('L').resize((17, 16), Image.LANCZOS); p = list(g.getdata())
    return [1 if p[y*17+x] > p[y*17+x+1] else 0 for y in range(16) for x in range(16)]
av = lambda a, b: sum(x != y for x, y in zip(a, b))
cand = {}
for k in NY:
    L = []
    for i in range(1, 7):
        im = Image.open(f"{ARB}/cand/{k}/d{i}.jpg"); L.append((dh(im), dh(ImageOps.mirror(im))))
    cand[k] = L
os.makedirs(UT, exist_ok=True)
def hent(a):
    r, n, fid = a
    f = f"{UT}/{r['i']}_{n}.jpg"
    if not os.path.exists(f) or os.path.getsize(f) < 2000:
        subprocess.run(['curl', '-sS', '-L', '--max-time', '40', '-o', f, f'https://static.wixstatic.com/media/{fid}'], capture_output=True)
    try:
        return r, n, dh(Image.open(f))
    except Exception:
        return r, n, None
jobs = [(r, n, fid) for r in rader for n, fid in enumerate(r["b"], 1)]
with ThreadPoolExecutor(8) as ex:
    res = list(ex.map(hent, jobs))
best = {}
for r, n, h in res:
    if h is None: continue
    for k, L in cand.items():
        m = min(min(av(c[0], h), av(c[1], h)) for c in L)
        key = (k, r["i"], r["t"][:48])
        best[key] = min(best.get(key, 999), m)
for k in NY:
    xs = sorted([(v, i, t) for (kk, i, t), v in best.items() if kk == k])[:5]
    print(k, [(v, i, t) for v, i, t in xs])
