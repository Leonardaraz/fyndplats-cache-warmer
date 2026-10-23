#!/usr/bin/env python3
# krop-forslag.py <boxar.txt> <lista.json> <ut-katalog> [min-andel 0.5]
#
# Föreslår kvadratiska utsnitt ur feedbilder som ströks för text, så att en färgvy på tre bilder eller färre kan få en bild till.
# Indata: `ocr-boxar.py <lista.json>` (textrutornas kanter per bild) och samma lista [[sida8, val8, pos, fil], …].
# För varje bild letas den största kvadrat vars sida är minst `min-andel` av bildens kortsida och som inte rör någon textruta
# (20 pixlars marginal). Upp till tre olika förslag per bild (de får överlappa högst hälften). Ett utsnitt väljs INTE av skriptet:
# det skriver kontaktark (<ut>/ark_NN.jpg, originalet med utsnittet inramat bredvid utsnittet) och <ut>/forslag.json, och en människa
# tittar på varje utsnitt.
#
# ☠️ En bild vars text innehåller ett förbehåll (Hinweis, Nur, ohne, only, nicht enthalten, Zubehör …) tas inte med: utsnittet hade
#    klippt bort förbehållet och lämnat en bild som lovar mer än sidan säljer (ersättningsduken med tunnelväxthus utan stomme).
# ☠️ Butikens galleri visar varje bild som en kvadrat ur mitten, så utsnittet är kvadratiskt och ska rymma hela varan.
import json, os, re, sys, collections
sys.path.append("/root/.local/lib/python3.11/site-packages")
from PIL import Image, ImageDraw, ImageFont

boxar_f, lista_f, ut = sys.argv[1:4]
MINANDEL = float(sys.argv[4]) if len(sys.argv) > 4 else 0.5
SP = os.environ.get("FARG_SKRATCH", "/tmp/fargbilder")
CACHE = os.path.join(SP, "wxc")
os.makedirs(ut, exist_ok=True)
MARGINAL = 20
STEG = 25
FORBEHALL = re.compile(r"hinweis|nur\b|ohne|only|nicht\s+enthalten|zubeh|exkl|not\s+included|nicht\s+im|achtung|vorsicht|warn|nota|note\s*:", re.I)

lista = json.load(open(lista_f))
per = collections.OrderedDict()
cur = None
for rad in open(boxar_f, encoding="utf-8", errors="replace"):
    rad = rad.rstrip("\n")
    if not rad.strip():
        continue
    if not rad.startswith("    "):
        d = rad.split()
        if len(d) >= 4:
            cur = (d[0], d[1], int(d[2]))
            per[cur] = []
        continue
    m = re.match(r"^\s+(\d+) (\d+) (\d+) (\d+) ([\d.]+) ?(.*)$", rad)
    if m and cur is not None:
        x0, y0, x1, y1 = (int(m.group(i)) for i in range(1, 5))
        per[cur].append((x0, y0, x1, y1, m.group(6)))

font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 15)


def kvadrater(W, H, boxar):
    kort = min(W, H)
    smin = int(kort * MINANDEL)
    stor = []
    for s in range(kort, smin - 1, -STEG):
        for y in range(0, H - s + 1, STEG):
            for x in range(0, W - s + 1, STEG):
                ok = True
                for (a, b, c, d, _) in boxar:
                    if x < c + MARGINAL and x + s > a - MARGINAL and y < d + MARGINAL and y + s > b - MARGINAL:
                        ok = False
                        break
                if ok:
                    stor.append((s, x, y))
        if stor:
            break
    return stor


def valj(stor, W, H):
    # störst först; bland lika stora den som ligger närmast bildens mitt; högst tre som överlappar högst hälften
    if not stor:
        return []
    s0 = stor[0][0]
    cand = sorted(stor, key=lambda t: (-t[0], abs(t[1] + t[0] / 2 - W / 2) + abs(t[2] + t[0] / 2 - H / 2)))
    valda = []
    for s, x, y in cand:
        if all(not (min(x + s, x2 + s2) - max(x, x2) > s * 0.5 and min(y + s, y2 + s2) - max(y, y2) > s * 0.5) for s2, x2, y2 in valda):
            valda.append((s, x, y))
        if len(valda) == 3:
            break
    return valda


forslag = []
hoppade = collections.Counter()
for s8, v8, pos, fil in lista:
    key = (s8, v8, pos)
    boxar = per.get(key)
    if boxar is None:
        hoppade["ingen OCR"] += 1
        continue
    text = " ".join(t for *_, t in boxar)
    if FORBEHALL.search(text):
        hoppade["förbehåll i texten"] += 1
        continue
    f = os.path.join(CACHE, fil.replace("~", "_"))
    if not os.path.exists(f):
        hoppade["filen saknas"] += 1
        continue
    im = Image.open(f)
    W, H = im.size
    stor = kvadrater(W, H, boxar)
    for s, x, y in valj(stor, W, H):
        forslag.append(dict(sida8=s8, val8=v8, pos=pos, fil=fil, x=x, y=y, w=s, h=s, W=W, H=H, text=text[:80]))
    if not stor:
        hoppade["ingen kvadrat"] += 1

print(len(lista), "bilder,", len(forslag), "förslag,", dict(hoppade))
json.dump(forslag, open(os.path.join(ut, "forslag.json"), "w"), ensure_ascii=False, indent=1)

# kontaktark: original (med ram) + utsnitt, tre förslag per rad
PER_ARK = 8
CEL = 300
def ark(rader, n):
    Wb = CEL * 2 + 30
    img = Image.new("RGB", (Wb * 2, (CEL + 26) * ((len(rader) + 1) // 2)), "white")
    dr = ImageDraw.Draw(img)
    for i, r in enumerate(rader):
        im = Image.open(os.path.join(CACHE, r["fil"].replace("~", "_"))).convert("RGB")
        sk = CEL / max(im.size)
        o = im.resize((int(im.size[0] * sk), int(im.size[1] * sk)))
        d2 = ImageDraw.Draw(o)
        d2.rectangle((r["x"] * sk, r["y"] * sk, (r["x"] + r["w"]) * sk, (r["y"] + r["h"]) * sk), outline="red", width=3)
        c = im.crop((r["x"], r["y"], r["x"] + r["w"], r["y"] + r["h"])).resize((CEL, CEL))
        cx = (i % 2) * Wb
        cy = (i // 2) * (CEL + 26)
        dr.text((cx + 2, cy), f"{r['sida8']} {r['val8']} p{r['pos']} {r['w']}px ({r['x']},{r['y']})", fill="black", font=font)
        img.paste(o, (cx, cy + 22))
        img.paste(c, (cx + CEL + 10, cy + 22))
    p = os.path.join(ut, f"ark_{n:02d}.jpg")
    img.save(p, quality=88)
    return p
for k in range(0, len(forslag), PER_ARK):
    print(ark(forslag[k:k + PER_ARK], k // PER_ARK + 1))
