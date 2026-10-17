#!/usr/bin/env python3
# ark_ids.py <ut.jpg> <bredd> <etikett:bildid,bildid,...> [<etikett:...> ...]: kontaktark ur Wix-bild-id, en rad per argument
import os, subprocess, sys, hashlib, concurrent.futures as cf
from PIL import Image, ImageDraw
SP = '/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad'
UT = SP + '/t60/ark/orig'; os.makedirs(UT, exist_ok=True)
fn_out = sys.argv[1]; W = int(sys.argv[2])
rader = []
for a in sys.argv[3:]:
    et, ids = a.split(':', 1)
    rader.append((et, [x for x in ids.split(',') if x]))
def hamta(iid):
    h = hashlib.md5((iid + str(W)).encode()).hexdigest()[:12]
    fn = f'{UT}/w{W}-{h}.jpg'
    if not (os.path.exists(fn) and os.path.getsize(fn) > 500):
        u = f'https://static.wixstatic.com/media/{iid}/v1/fit/w_{W},h_{W},q_85/x.jpg'
        r = subprocess.run(['curl', '-sS', '-L', '--max-time', '40', u], capture_output=True)
        open(fn, 'wb').write(r.stdout)
    try:
        return Image.open(fn).convert('RGB')
    except Exception:
        return None
cols = max(len(r[1]) for r in rader)
H = W + 26
ark = Image.new('RGB', (10 + cols * (W + 10), 10 + len(rader) * H), (244, 244, 244))
dr = ImageDraw.Draw(ark)
with cf.ThreadPoolExecutor(8) as ex:
    for ri, (et, ids) in enumerate(rader):
        ims = list(ex.map(hamta, ids))
        for ci, im in enumerate(ims):
            x = 10 + ci * (W + 10); y = 10 + ri * H + 20
            if im is not None:
                ark.paste(im, (x + (W - im.size[0]) // 2, y + (W - im.size[1]) // 2))
            dr.text((x, y - 16), f'{et} #{ci+1}', fill=(0, 0, 0))
ark.save(fn_out, quality=85)
print(fn_out, ark.size)
