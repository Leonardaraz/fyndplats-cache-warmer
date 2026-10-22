#!/usr/bin/env python3
# live-dubbletter.py <live-katalog> <glob>: samma foto två gånger i EN färgvy (omgång 3: `b2ccab13` Rosa och `eb02039b` Röd och Blå).
# Två filer med olika id kan vara samma foto uppladdat två gånger (skillnad på 68–80 byte, pixlarna lika), och på en miniatyr ser
# två skott av samma scen olika ut. Kontrollen är därför ett tal, inte ett öga: dHash per färgkanal väljer ut par (avstånd högst 10)
# och medelskillnaden i pixlar mellan de två filerna avgör (under 0,5 = samma foto). Ett par med skillnaden 0,0 tas bort med
# bilder-bort.yml (den senare bilden i vyn). Ren läsning; bilderna ligger i cachen som ocr-live.py och farg-ark.py fyller.
import os, sys, json, glob, subprocess
sys.path.append("/root/.local/lib/python3.11/site-packages")
from PIL import Image, ImageChops, ImageStat

SP = os.environ.get("FARG_SKRATCH", "/tmp/fargbilder")
CACHE = os.path.join(SP, "wxc")
os.makedirs(CACHE, exist_ok=True)
live, gl = sys.argv[1:3]


def hamta(fid):
    f = os.path.join(CACHE, fid.replace("~", "_"))
    if not os.path.exists(f) or os.path.getsize(f) < 500:
        r = subprocess.run(["curl", "-sS", "--max-time", "60", "-o", f, "-w", "%{http_code}",
                            f"https://static.wixstatic.com/media/{fid}"], capture_output=True, text=True)
        if r.stdout.strip() != "200":
            return None
    return f


def dhash(f):
    try:
        im = Image.open(f).convert("RGB").resize((9, 8), Image.LANCZOS)
    except Exception:
        return None
    ut = []
    for kanal in im.split():
        px = list(kanal.tobytes())
        bits = 0
        for y in range(8):
            for x in range(8):
                bits = (bits << 1) | (1 if px[y * 9 + x] > px[y * 9 + x + 1] else 0)
        ut.append(bits)
    return tuple(ut)


def avstand(a, b):
    return sum(bin(x ^ y).count("1") for x, y in zip(a, b))


def skillnad(fa, fb):
    a, b = Image.open(fa).convert("RGB"), Image.open(fb).convert("RGB")
    if a.size != b.size:
        b = b.resize(a.size)
    st = ImageStat.Stat(ImageChops.difference(a, b))
    return round(sum(st.mean) / 3, 3)


hash_ = {}


def h(fid):
    if fid not in hash_:
        f = hamta(fid)
        hash_[fid] = dhash(f) if f else None
    return hash_[fid]


par = 0
sidor = 0
for f in sorted(glob.glob(os.path.join(live, gl))):
    sida8 = os.path.basename(f).split("_")[-1][:8]
    sidor += 1
    for k in json.load(open(f))["kombos"]:
        ids = k["ids"]
        for a in range(len(ids)):
            for b in range(a + 1, len(ids)):
                ha, hb = h(ids[a]), h(ids[b])
                if not ha or not hb or avstand(ha, hb) > 10:
                    continue
                d = skillnad(hamta(ids[a]), hamta(ids[b]))
                par += 1
                print(sida8, k["val"].split("=")[-1], f"plats {a + 1} och {b + 1}", f"avstånd {avstand(ha, hb)}",
                      f"pixelskillnad {d}", "SAMMA FOTO" if d < 0.5 else "likt men olika", ids[b])
# ☠️ En kontroll som inte kan fälla räknas ändå som gjord: sidor ska vara över noll.
print(f"{sidor} sidor, {par} par")
sys.exit(0 if sidor else 1)
