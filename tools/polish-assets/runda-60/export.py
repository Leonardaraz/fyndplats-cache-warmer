# -*- coding: utf-8 -*-
"""Export till tools/polish-assets/<id8>/. 1600 × 1600 JPEG, tak 215 kB.
☠️ KVALITETSGOLV q >= 80: ett kort som inte ryms ska FÄLLA så man byter
källbild, inte komprimeras sönder."""
from PIL import Image
import os, io as _io

TAK, GOLV = 215 * 1024, 80
UT = "/home/user/fyndplats-cache-warmer/tools/polish-assets"
KORT = [(n[:8], n[:-4], n[9:-4]) for n in sorted(os.listdir("cards")) if n.endswith(".png")]

fel = []
for id8, namn, sort in KORT:
    im = Image.open("cards/%s.png" % namn).convert("RGB")
    if im.size != (1600, 1600):
        im = im.resize((1600, 1600), Image.LANCZOS)
    d = os.path.join(UT, id8); os.makedirs(d, exist_ok=True)
    p = os.path.join(d, "%s.jpg" % sort)
    valt = None
    for q in range(95, GOLV - 1, -1):
        b = _io.BytesIO(); im.save(b, "JPEG", quality=q, optimize=True, subsampling=0)
        if b.tell() <= TAK:
            valt = (q, b.getvalue()); break
    if not valt:
        fel.append("%s/%s: ryms inte vid q>=%d — byt källbild" % (id8, sort, GOLV)); continue
    open(p, "wb").write(valt[1])
    print("%-10s %-6s q=%-3d %6.1f kB" % (id8, sort, valt[0], len(valt[1]) / 1024))

if fel:
    for f in fel: print("FEL:", f)
    raise SystemExit(1)
print("\nExport: %d kort inom 215 kB med q >= %d." % (len(KORT), GOLV))
