#!/usr/bin/env python3
# farg-dupkoll.py <kand.tsv> <verdikt.tsv> <livekatalog> <prefix>
# Jämför varje vald bild (V eller N) med färgens nuvarande bilder och med de andra valda i samma färg (färgmedveten dHash,
# avstånd högst 12). Körs EFTER granskningen och före tillagg.json (omgång 3: tre autostrukna bilder som hävdats efter att orden
# lästs var pixelidentiska med bilder som redan låg i färgens vy, eftersom `farg-ark.py` bara dubblettkontrollerar rader som kommer
# med på arken). Ett fynd är en förgranskning: avståndet 0 betyder samma foto, och `live-dubbletter.py` mäter pixelskillnaden.
#
#   kand.tsv     sida8, val8, färg, pos, fil-id, nuvarande, ocr, ord (skrivs av farg-kandidater.py)
#   verdikt.tsv  sida8, val8, pos, verdikt (V, N eller S), skäl, alt-text
#   livekatalog  en fil <prefix>_<id8>.json per sida, skriven av live-bilder.mjs (eller live-farg-vy.mjs för sidor med två axlar)
import os, re, sys, json, subprocess, collections
sys.path.append("/root/.local/lib/python3.11/site-packages")
from PIL import Image

kand_tsv, verd_tsv, livedir, prefix = sys.argv[1:5]
SP = os.environ.get("FARG_SKRATCH", "/tmp/fargbilder")
CACHE = os.path.join(SP, "wxc")
os.makedirs(CACHE, exist_ok=True)


def hamta(fid):
    f = os.path.join(CACHE, fid.replace("~", "_"))
    if not os.path.exists(f) or os.path.getsize(f) < 500:
        subprocess.run(["curl", "-sS", "--max-time", "60", "-o", f, f"https://static.wixstatic.com/media/{fid}"])
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


def av(a, b):
    return sum(bin(x ^ y).count("1") for x, y in zip(a, b))


kand = {(r[0], r[1], r[3]): r for r in (l.rstrip("\n").split("\t") for l in open(kand_tsv, encoding="utf-8"))
        if r[0] != "sida8"}
val = [l.rstrip("\n").split("\t") for l in open(verd_tsv, encoding="utf-8")][1:]
valda = collections.defaultdict(list)
for r in val:
    if r[3] in ("V", "N"):
        k = kand[(r[0], r[1], r[2])]
        valda[(r[0], r[1])].append((r[2], k[4], k[2]))


def live_ids(sida8, farg):
    p = os.path.join(livedir, f"{prefix}_{sida8}.json")
    d = json.load(open(p))
    ids = []
    for kombo in d["kombos"]:
        delar = [x.split("=")[-1].strip().lower() for x in re.split(r"\s×\s", kombo["val"])]
        if farg.strip().lower() in delar:
            ids += [i for i in kombo["ids"] if i not in ids]
    return ids


fynd = 0
for (s8, v8), lista in valda.items():
    farg = lista[0][2]
    nu = [(i, dhash(hamta(i))) for i in live_ids(s8, farg)]
    ch = [(p, fid, dhash(hamta(fid))) for p, fid, _ in lista]
    for p, fid, h in ch:
        if h is None:
            continue
        for i, hh in nu:
            if hh is not None and av(h, hh) <= 12:
                print(f"DUBBLETT mot nuvarande: {s8} {farg} p{p} ~ {i[:22]} avstånd {av(h, hh)}")
                fynd += 1
    for a in range(len(ch)):
        for b in range(a + 1, len(ch)):
            if ch[a][2] and ch[b][2] and av(ch[a][2], ch[b][2]) <= 12:
                print(f"DUBBLETT inbördes: {s8} {farg} p{ch[a][0]} ~ p{ch[b][0]} avstånd {av(ch[a][2], ch[b][2])}")
                fynd += 1
# ☠️ En kontroll som inte kan fälla räknas ändå som gjord: det ska finnas valda bilder att jämföra.
print("fynd", fynd, "på", sum(len(v) for v in valda.values()), "valda bilder")
sys.exit(0 if valda else 1)
