#!/usr/bin/env python3
"""ark_tvilling.py <utkast id8> <ut.jpg> <slug>...: kontaktark med utkastets bilder överst och första bilderna på varje publicerad sida under."""
import json, os, re, subprocess, sys, hashlib, concurrent.futures as cf
from PIL import Image, ImageDraw, ImageFont
SP = '/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad'
CACHE = SP + '/n262r/thumb'; os.makedirs(CACHE, exist_ok=True)
S = 170; N = 6
k = sys.argv[1]; ut = sys.argv[2]; slugs = sys.argv[3:]
d = json.load(open(f'{SP}/t15/data/{k}.json', encoding='utf-8'))
def hamta(mid):
    fn = f'{CACHE}/s_{hashlib.md5(mid.encode()).hexdigest()[:14]}.jpg'
    if not (os.path.exists(fn) and os.path.getsize(fn) > 300):
        r = subprocess.run(['curl', '-sS', '-L', '--max-time', '40', f'https://static.wixstatic.com/media/{mid}/v1/fit/w_{S},h_{S},q_70/x.jpg'], capture_output=True)
        open(fn, 'wb').write(r.stdout)
    try: return Image.open(fn).convert('RGB')
    except Exception: return Image.new('RGB', (S, S), (200, 200, 200))
rows = [(f'UTKAST {k} {d["name"][:50]}', [i['id'] for i in d['items']][:N])]
for s in slugs:
    h = subprocess.run(['curl', '-sS', '-L', '--max-time', '40', f'https://www.fyndplats.se/produkt/{s}'], capture_output=True).stdout.decode('utf-8', 'replace')
    ids = []
    for m in re.finditer(r'static\.wixstatic\.com/media/([A-Za-z0-9_~.\-]+?\.(?:jpg|jpeg|png|webp))', h):
        if m.group(1) not in ids and m.group(1).startswith('b379ce_'): ids.append(m.group(1))
    rows.append((f'PUBL {s}', ids[:N]))
mids = sorted({m for _, l in rows for m in l})
with cf.ThreadPoolExecutor(10) as ex:
    imgs = dict(zip(mids, ex.map(hamta, mids)))
font = ImageFont.load_default()
im = Image.new('RGB', (N * S + 4, len(rows) * (S + 16)), (255, 255, 255)); dr = ImageDraw.Draw(im)
for i, (lab, l) in enumerate(rows):
    y = i * (S + 16)
    dr.text((2, y + 2), lab, fill=(0, 0, 0), font=font)
    for t, m in enumerate(l): im.paste(imgs[m], (t * S, y + 14))
im.save(ut, quality=82)
print(ut, im.size)
