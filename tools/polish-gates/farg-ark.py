#!/usr/bin/env python3
# farg-ark.py <kand.tsv> <livekatalog> <prefix> <utkatalog> [T] [kol]
# Kontaktark per sida för en omgång Aosom-färgbilder. Varje färg får en referensrad med färgens NUVARANDE bilder (ur
# butikens live-vy, live-bilder.mjs) och sedan kandidaterna (feedens positioner, uppladdade av läget kandidater).
# En kandidat som är en nära dubblett (dHash) av en av färgens nuvarande bilder tas inte med på arken utan listas
# i dubbletter.tsv, med vilken bild den liknar. Det är en förgranskning: ögonen avgör.
import os, re, sys, json, subprocess, collections
sys.path.append("/root/.local/lib/python3.11/site-packages")
from PIL import Image, ImageDraw, ImageFont

kand_tsv, livedir, prefix, ut = sys.argv[1:5]
T = int(sys.argv[5]) if len(sys.argv) > 5 else 300
KOL = int(sys.argv[6]) if len(sys.argv) > 6 else 4
TN = 128  # nuvarande-bilder
SP = os.environ.get("FARG_SKRATCH", "/tmp/fargbilder")
CACHE = os.path.join(SP, "wxc")
os.makedirs(ut, exist_ok=True)
font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
fontb = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 17)
sfont = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 12)


def hamta(fid):
    f = os.path.join(CACHE, fid.replace("~", "_"))
    if not os.path.exists(f) or os.path.getsize(f) < 500:
        r = subprocess.run(["curl", "-sS", "--max-time", "60", "-o", f, "-w", "%{http_code}",
                            f"https://static.wixstatic.com/media/{fid}"], capture_output=True, text=True)
        if r.stdout.strip() != "200":
            print("FEL", fid, r.stdout.strip())
            return None
    return f


def dhash(f):
    # Färgmedveten: en dHash per RGB-kanal. En gul och en blå kärra i samma bildkomposition får samma
    # gråskale-hash men olika kanal-hashar.
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


# kandidater
rader = [l.rstrip("\n").split("\t") for l in open(kand_tsv, encoding="utf-8")][1:]
kand = collections.OrderedDict()  # (sida8, val8) -> dict(farg, lista)
for r in rader:
    sida8, val8, farg, pos, fil, nuv, ocr, ord_, auto, area, maxh = (r + [""] * 11)[:11]
    k = kand.setdefault((sida8, val8), dict(farg=farg, nuv=nuv, lista=[]))
    k["lista"].append(dict(pos=int(pos), fil=fil, ocr=ocr, ord=ord_, auto=auto, area=area))

sidor = collections.OrderedDict()
for (s, v), k in kand.items():
    sidor.setdefault(s, []).append((v, k))


def nuvarande(sida8, farg):
    p = os.path.join(livedir, f"{prefix}_{sida8}.json")
    if not os.path.exists(p):
        return None
    d = json.load(open(p))
    ids = []
    for kombo in d.get("kombos", []):
        delar = [x.split("=")[-1].strip().lower() for x in re.split(r"\s×\s", kombo["val"])]
        if farg.strip().lower() in delar:
            for i in kombo["ids"]:
                if i not in ids:
                    ids.append(i)
    sida_unika = d.get("unika", [])
    return ids, sida_unika


autof = open(os.path.join(ut, "auto.tsv"), "w")
autof.write("sida8\tval8\tfarg\tpos\tfil\ttextyta\tord\n")
dub = open(os.path.join(ut, "dubbletter.tsv"), "w")
dub.write("sida8\tval8\tfarg\tpos\tfil\tliknar\tavstand\tnotering\n")
block = []  # (sida8, header, nuvarande[(id, fil)], kandidater[(etikett, fil, text)])
for sida8, farger in sidor.items():
    for v, k in farger:
        n = nuvarande(sida8, k["farg"])
        if n is None:
            ids, unika = [], []
        else:
            ids, unika = n
        nu = [(i, hamta(i)) for i in ids]
        nuh = [(i, dhash(f)) for i, f in nu if f]
        sh = [(i, dhash(hamta(i))) for i in unika if i not in ids]
        kl = []
        for c in sorted(k["lista"], key=lambda c: c["pos"]):
            if c.get("auto") == "ja":
                autof.write(f"{sida8}\t{v[:8]}\t{k['farg']}\t{c['pos']}\t{c['fil']}\t{c['area']}\t{c['ord'][:80]}\n")
                continue
            f = hamta(c["fil"])
            if not f:
                continue
            h = dhash(f)
            liknar = None
            if h is not None:
                for i, hh in nuh:
                    if hh is not None and avstand(h, hh) <= 12:
                        liknar = ("nu", i, avstand(h, hh))
                        break
                if liknar is None:
                    for i, hh in sh:
                        if hh is not None and avstand(h, hh) <= 12:
                            liknar = ("sidan", i, avstand(h, hh))
                            break
            if liknar and liknar[0] == "sidan":
                dub.write(f"{sida8}\t{v[:8]}\t{k['farg']}\t{c['pos']}\t{c['fil']}\t{liknar[0]}:{liknar[1][:20]}\t{liknar[2]}\tFLAGGAD\n")
                txt = (c["ord"] or "")[:26]
                kl.append((f"p{c['pos']} {c['ocr']} ~sidan{liknar[2]}", c["fil"], txt))
                continue
            if liknar:
                dub.write(f"{sida8}\t{v[:8]}\t{k['farg']}\t{c['pos']}\t{c['fil']}\t{liknar[0]}:{liknar[1][:20]}\t{liknar[2]}\n")
                continue
            txt = (c["ord"] or "")[:30] + (" " + str(c.get("area", "")) + "%" if c.get("area") not in ("", None, "0.00") else "")
            kl.append((f"p{c['pos']} {c['ocr']}", c["fil"], txt))
        hdr = f"{sida8}  {k['farg']}   nu {k['nuv']}  ({len(ids)} i live-vyn)   kand {len(k['lista'])}  efter dubblettfilter {len(kl)}"
        block.append((sida8, v, hdr, [(i, f) for i, f in nu if f], kl))
dub.close()
autof.close()

# ark: fyll på med färgblock tills höjden ~1700
MAXH = 1750
BREDD = KOL * T


def blockhojd(b):
    n = len(b[4])
    rr = (n + KOL - 1) // KOL
    return 26 + (TN + 16 if b[3] else 0) + rr * (T + 34) + 10


ark_nr = 0
aktuell, hojd = [], 0
ark_lista = []


def spara():
    global ark_nr, aktuell, hojd
    if not aktuell:
        return
    ark_nr += 1
    im = Image.new("RGB", (BREDD, hojd + 4), "white")
    d = ImageDraw.Draw(im)
    y = 0
    for sida8, v, hdr, nu, kl in aktuell:
        d.rectangle((0, y, BREDD, y + 22), fill=(225, 232, 245))
        d.text((6, y + 2), hdr, fill="black", font=fontb)
        y += 26
        if nu:
            for n, (i, f) in enumerate(nu[:BREDD // (TN + 4)]):
                try:
                    t = Image.open(f).convert("RGB")
                except Exception:
                    continue
                w, h = t.size
                t.thumbnail((TN, TN))
                im.paste(t, (4 + n * (TN + 4), y + 14))
                d.text((6 + n * (TN + 4), y), f"nu{n + 1} {w}x{h}", fill=(120, 0, 0), font=sfont)
            y += TN + 16
        for n, (et, fid, txt) in enumerate(kl):
            x, yy = (n % KOL) * T, y + (n // KOL) * (T + 34)
            d.text((x + 4, yy), et, fill="black", font=font)
            f = hamta(fid)
            if not f:
                continue
            t = Image.open(f).convert("RGB")
            w, h = t.size
            t.thumbnail((T - 6, T - 6))
            im.paste(t, (x + 3 + (T - 6 - t.size[0]) // 2, yy + 20 + (T - 6 - t.size[1]) // 2))
            d.text((x + 4, yy + 20 + T - 4), f"{w}x{h} {txt}", fill=(90, 90, 90), font=sfont)
        y += ((len(kl) + KOL - 1) // KOL) * (T + 34) + 10
    nm = os.path.join(ut, f"ark_{ark_nr:02d}.jpg")
    im.save(nm, quality=84)
    ark_lista.append((nm, [(b[0], b[2][:60]) for b in aktuell]))
    aktuell, hojd = [], 0


for b in block:
    if not b[4] and not b[3]:
        continue
    bh = blockhojd(b)
    if aktuell and hojd + bh > MAXH:
        spara()
    aktuell.append(b)
    hojd += bh
spara()
for nm, bl in ark_lista:
    print(nm, "|", "; ".join(h for _, h in bl))
print("dubbletter:", sum(1 for _ in open(os.path.join(ut, "dubbletter.tsv"))) - 1)
