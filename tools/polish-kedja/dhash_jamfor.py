#!/usr/bin/env python3
"""dhash_jamfor.py <rundkatalog> <kat_rader.json>: jämför rundans bilder mot publicerade sidors första bilder (dHash på Wix-miniatyrer)."""
import json, os, subprocess, sys, hashlib, concurrent.futures as cf
from PIL import Image
SP = '/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad'
CACHE = SP + '/n260/thumb'; os.makedirs(CACHE, exist_ok=True)
R = sys.argv[1]
rows = [r.split('|') for r in json.load(open(sys.argv[2], encoding='utf-8'))]
kand = {r[0]: (r[1], r[2], [m for m in r[3].split(',') if m]) for r in rows}
ny = {}
for l in open(f'{R}/bilder.tsv', encoding='utf-8'):
    p = l.rstrip('\n').split('\t')
    if len(p) >= 3:
        ny.setdefault(p[0], []).append((p[1], p[2].replace('b379ce_', '')))
def hamta(mid):
    fn = f'{CACHE}/{hashlib.md5(mid.encode()).hexdigest()[:14]}.jpg'
    if not (os.path.exists(fn) and os.path.getsize(fn) > 300):
        u = f'https://static.wixstatic.com/media/b379ce_{mid}/v1/fit/w_96,h_96,q_60/x.jpg'
        r = subprocess.run(['curl', '-sS', '-L', '--max-time', '40', u], capture_output=True)
        open(fn, 'wb').write(r.stdout)
    try:
        im = Image.open(fn).convert('L').resize((9, 8), Image.LANCZOS)
    except Exception:
        return None
    px = list(im.getdata())
    bits = 0
    for y in range(8):
        for x in range(8):
            bits = (bits << 1) | (1 if px[y * 9 + x] > px[y * 9 + x + 1] else 0)
    return bits
alla = {}
mal = set()
for k, lst in ny.items():
    for et, m in lst: mal.add(m)
for k, (c, n, lst) in kand.items():
    for m in lst: mal.add(m)
mal = sorted(mal)
print(len(mal), 'miniatyrer', flush=True)
with cf.ThreadPoolExecutor(10) as ex:
    for m, h in zip(mal, ex.map(hamta, mal)):
        alla[m] = h
def ham(a, b): return bin(a ^ b).count('1')
for k, lst in ny.items():
    traffar = {}
    for et, m in lst:
        h = alla.get(m)
        if h is None: continue
        for kid, (c, n, ml) in kand.items():
            if kid == k: continue
            for pos, m2 in enumerate(ml, 1):
                h2 = alla.get(m2)
                if h2 is None: continue
                d = ham(h, h2)
                if d <= 8:
                    traffar.setdefault(kid, []).append((et, pos, d))
    print('==', k, 'nya bilder', len(lst))
    for kid, t in sorted(traffar.items(), key=lambda kv: -len(kv[1])):
        print('   ', kid, kand[kid][0], kand[kid][1], t)
