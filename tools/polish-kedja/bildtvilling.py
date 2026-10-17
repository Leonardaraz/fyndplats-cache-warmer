#!/usr/bin/env python3
"""tvilling.py <utkast id8> <slug>...: dHash-jämförelse mellan utkastets bilder och bilderna på publicerade sidor (hämtade ur live-HTML)."""
import json, os, re, subprocess, sys, hashlib, concurrent.futures as cf
from PIL import Image
SP = '/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad'
CACHE = SP + '/n262r/thumb'; os.makedirs(CACHE, exist_ok=True)
k = sys.argv[1]
d = json.load(open(f'{SP}/t15/data/{k}.json', encoding='utf-8'))
mine = [i['id'] for i in d['items']]
def hamta_url(u, fn):
    if not (os.path.exists(fn) and os.path.getsize(fn) > 300):
        r = subprocess.run(['curl', '-sS', '-L', '--max-time', '40', u], capture_output=True)
        open(fn, 'wb').write(r.stdout)
def dh(mid):
    fn = f'{CACHE}/{hashlib.md5(mid.encode()).hexdigest()[:14]}.jpg'
    hamta_url(f'https://static.wixstatic.com/media/{mid}/v1/fit/w_96,h_96,q_60/x.jpg', fn)
    try:
        im = Image.open(fn).convert('L').resize((9, 8), Image.LANCZOS)
    except Exception:
        return None
    px = list(im.getdata()); bits = 0
    for y in range(8):
        for x in range(8):
            bits = (bits << 1) | (1 if px[y * 9 + x] > px[y * 9 + x + 1] else 0)
    return bits
def ham(a, b): return bin(a ^ b).count('1')
mh = {m: dh(m) for m in mine}
for slug in sys.argv[2:]:
    h = subprocess.run(['curl', '-sS', '-L', '--max-time', '40', f'https://www.fyndplats.se/produkt/{slug}'], capture_output=True).stdout.decode('utf-8', 'replace')
    ids = []
    for m in re.finditer(r'static\.wixstatic\.com/media/([A-Za-z0-9_~.\-]+?\.(?:jpg|jpeg|png|webp))', h):
        if m.group(1) not in ids: ids.append(m.group(1))
    ids = [i for i in ids if i.startswith('b379ce_')]
    with cf.ThreadPoolExecutor(8) as ex:
        hs = dict(zip(ids, ex.map(dh, ids)))
    tr = []
    for m, a in mh.items():
        if a is None: continue
        for i, b in hs.items():
            if b is None: continue
            dd = ham(a, b)
            if dd <= 10: tr.append((mine.index(m) + 1, i[:18], dd))
    exakt = [m for m in mine if m in ids]
    print(f'{slug}: {len(ids)} bilder på sidan; samma fil-id: {len(exakt)}; likhet (dHash ≤10): {tr[:8]}')
