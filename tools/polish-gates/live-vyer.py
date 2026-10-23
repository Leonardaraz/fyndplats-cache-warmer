#!/usr/bin/env python3
# live-vyer.py <live-katalog> <glob> <ut-prefix> [T=120]: en rad per färgvy med alla bilder, ett ark per elva rader.
# Syftet är att se en bild på fel färg i en vy (omgång 2: två gräddvita stolsfoton visades under Grå, för att butiken knyter ett
# olänkat foto till huvudbildens färg). Kör ocr-live.py först, så ligger bilderna i cachen.
import os, sys, json, glob
sys.path.append("/root/.local/lib/python3.11/site-packages")
from PIL import Image, ImageDraw, ImageFont
SP = os.environ.get("FARG_SKRATCH", "/tmp/fargbilder")
live, gl, utp = sys.argv[1:4]
T = int(sys.argv[4]) if len(sys.argv) > 4 else 120
font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 14)
sfont = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 11)
rader = []  # (etikett, [filer])
for f in sorted(glob.glob(os.path.join(live, gl))):
    sida8 = os.path.basename(f).split("_")[-1][:8]
    d = json.load(open(f))
    for k in d["kombos"]:
        rader.append((f"{sida8} {k['val'].split('=')[-1]}", k["ids"]))
MAXH = 1700
RH = T + 22
per = MAXH // RH
bredd = 8 * (T + 4) + 150
n = 0
for i in range(0, len(rader), per):
    n += 1
    del_ = rader[i:i + per]
    im = Image.new("RGB", (bredd, len(del_) * RH + 4), "white")
    d = ImageDraw.Draw(im)
    for r, (et, ids) in enumerate(del_):
        y = r * RH
        d.text((4, y + 4), et, fill="black", font=font)
        d.text((4, y + 24), f"{len(ids)} bilder", fill=(120, 0, 0), font=sfont)
        for c, fid in enumerate(ids[:8]):
            p = os.path.join(SP, "wxc", fid.replace("~", "_"))  # cachen som ocr-live.py och farg-ark.py fyller
            try:
                t = Image.open(p).convert("RGB")
            except Exception:
                continue
            t.thumbnail((T, T))
            im.paste(t, (150 + c * (T + 4), y + 2))
            d.text((152 + c * (T + 4), y + T + 3), fid[7:13], fill=(90, 90, 90), font=sfont)
        d.line((0, y + RH - 1, bredd, y + RH - 1), fill=(200, 200, 200))
    nm = f"{utp}_{n:02d}.jpg"
    im.save(nm, quality=85)
    print(nm, len(del_), "rader")
