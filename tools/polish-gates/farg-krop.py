#!/usr/bin/env python3
# farg-krop.py lokala <krop.json> <utkatalog>     lokala utsnitt + OCR 1× och 1,5× (ska vara REN eller SIFFROR)
# farg-krop.py url    <krop.json> <utkatalog>     Wix crop-adresser, hämtade med md5 → <ut>/krop_urls.json, adresserna skrivs ut
# farg-krop.py para   <ut>/krop_urls.json <ny-id> [<ny-id> …]   parar de uppladdade filerna mot adresserna på md5
#
# krop.json: [[sida8, val8, pos, fil, x, y, w, h], …] med x, y, w, h i originalets pixlar (oftast 2000 × 2000).
# Arbetsgång (omgång 2, sju utsnitt):
#   1. ocr-boxar.py <lista.json> ger textrutornas kanter, och utsnittet väljs så att varan ryms och texten hamnar utanför.
#   2. lokala: titta på utsnitten och kontrollera att OCR säger REN.
#   3. url: skriver adresserna. Ladda upp dem i ETT UploadImageToWixSite-anrop (imageUrls).
#   4. para: hämtar varje uppladdad fil och jämför md5 mot adressens svar, för uppladdningens svar säger inte vilket id som hör
#      till vilken adress. Allt ska para (7 av 7).
# Butikens galleri visar varje bild som en kvadrat ur mitten, så utsnittet ska vara kvadratiskt och rymma hela varan.
import hashlib, json, os, subprocess, sys, time
sys.path.append("/root/.local/lib/python3.11/site-packages")
from PIL import Image
SP = os.environ.get("FARG_SKRATCH", "/tmp/fargbilder")
CACHE = os.path.join(SP, "wxc")
HERE = os.path.dirname(os.path.abspath(__file__))
OCRPY = os.environ.get("OCR_PYTHON", os.path.join(SP, "ocrenv", "bin", "python"))
kommando = sys.argv[1]

def namn(s, v, p):
    return f"utsnitt-{s}-{v}-p{p}"

if kommando == "lokala":
    lista = json.load(open(sys.argv[2])); ut = sys.argv[3]
    os.makedirs(ut, exist_ok=True)
    filer = []
    for s, v, p, fil, x, y, w, h in lista:
        im = Image.open(os.path.join(CACHE, fil.replace("~", "_"))).convert("RGB")
        c = im.crop((x, y, x + w, y + h))
        f = os.path.join(ut, f"{s}_{v}_p{p}.jpg")
        c.save(f, quality=95)
        g = f.replace(".jpg", "_15x.jpg")
        c.resize((c.size[0] * 3 // 2, c.size[1] * 3 // 2), Image.LANCZOS).save(g, quality=95)
        filer += [f, g]
        print(f"{s} {v} p{p}: {w}×{h}" + ("" if w == h else "  ☠️ inte kvadratiskt"))
    r = subprocess.run([OCRPY, os.path.join(HERE, "ocr-forgranska.py")] + filer, capture_output=True, text=True)
    print(r.stdout.strip() or r.stderr[-300:])
elif kommando == "url":
    lista = json.load(open(sys.argv[2])); ut = sys.argv[3]
    os.makedirs(os.path.join(ut, "url"), exist_ok=True)
    poster = []
    for s, v, p, fil, x, y, w, h in lista:
        n = namn(s, v, p)
        url = f"https://static.wixstatic.com/media/{fil}/v1/crop/x_{x},y_{y},w_{w},h_{h},q_95/{n}.jpg"
        f = os.path.join(ut, "url", n + ".jpg")
        r = subprocess.run(["curl", "-sS", "--max-time", "90", "-o", f, "-w", "%{http_code} %{size_download}", url], capture_output=True, text=True)
        md5 = hashlib.md5(open(f, "rb").read()).hexdigest() if os.path.exists(f) else ""
        poster.append(dict(sida8=s, val8=v, pos=p, fil=fil, x=x, y=y, w=w, h=h, url=url, namn=n, md5=md5, status=r.stdout.strip()))
        print(n, r.stdout.strip(), md5)
    json.dump(poster, open(os.path.join(ut, "krop_urls.json"), "w"), indent=1, ensure_ascii=False)
    print("\nimageUrls till UploadImageToWixSite (i den här ordningen):")
    for q in poster:
        print(q["url"])
elif kommando == "para":
    poster = json.load(open(sys.argv[2]))
    ny = sys.argv[3:]
    md5ny = {}
    for i in ny:
        f = os.path.join(os.path.dirname(os.path.abspath(sys.argv[2])), "ny_" + i.replace("~", "_"))
        for _ in range(8):
            r = subprocess.run(["curl", "-sS", "--max-time", "90", "-o", f, "-w", "%{http_code}", f"https://static.wixstatic.com/media/{i}"], capture_output=True, text=True)
            if r.stdout.strip() == "200" and os.path.getsize(f) > 1000:
                break
            time.sleep(3)
        md5ny[i] = hashlib.md5(open(f, "rb").read()).hexdigest()
    tillbaka = {v: k for k, v in md5ny.items()}
    ok = 0
    for q in poster:
        q["ny_id"] = tillbaka.get(q["md5"], "")
        ok += 1 if q["ny_id"] else 0
        print(q["namn"], q["md5"][:8], "→", q["ny_id"] or "SAKNAS")
    json.dump(poster, open(sys.argv[2], "w"), indent=1, ensure_ascii=False)
    print(f"{ok} av {len(poster)} parade")
    print("\nsida\tval\tpos\tkalla_fil\tutsnitt_xywh\tny_fil\tmd5")
    for q in poster:
        print(f"{q['sida8']}\t{q['val8']}\t{q['pos']}\t{q['fil']}\t{q['x']},{q['y']},{q['w']},{q['h']}\t{q['ny_id']}\t{q['md5']}")
    sys.exit(0 if ok == len(poster) else 1)
else:
    sys.exit(__doc__)
