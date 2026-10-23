#!/usr/bin/env python3
# ocr-live.py <live-katalog> <glob> <ut.tsv>
# OCR-kör ALLA unika bilder i färgvyerna på sidorna i en runda (live-JSON från live-bilder.mjs), bara läsning.
# Skriver sida8, färger, fil, status, antal ord, textyta %, högsta teckenhöjd % och orden. Syftet är att hitta tysk eller
# engelsk text som redan ligger ute på en publicerad sida (omgång 2: ett tyskt informationskort och en tysk anmärkning på två
# av 26 sidor), inte bara i kandidaterna. En bild med bara ett märke på varan eller knappar på en apparat är inget fel.
import os, sys, json, glob, subprocess
from concurrent.futures import ThreadPoolExecutor
SP = os.environ.get("FARG_SKRATCH", "/tmp/fargbilder")
CACHE = os.path.join(SP, "wxc")
os.makedirs(CACHE, exist_ok=True)
livedir, gl, ut = sys.argv[1:4]
ids = {}
for f in sorted(glob.glob(os.path.join(livedir, gl))):
    sida8 = os.path.basename(f).split("_")[-1][:8]
    d = json.load(open(f))
    for k in d.get("kombos", []):
        for i in k["ids"]:
            ids.setdefault(i, set()).add((sida8, k["val"].split("=")[-1]))
def hamta(fid):
    f = os.path.join(CACHE, fid.replace("~", "_"))
    if not os.path.exists(f) or os.path.getsize(f) < 500:
        r = subprocess.run(["curl", "-sS", "--max-time", "60", "-o", f, "-w", "%{http_code}", f"https://static.wixstatic.com/media/{fid}"], capture_output=True, text=True)
        if r.stdout.strip() != "200":
            return None
    return f
with ThreadPoolExecutor(8) as ex:
    lokal = {i: f for i, f in zip(ids, ex.map(hamta, ids)) if f}
print("bilder", len(ids), "hämtade", len(lokal), flush=True)
ocrpy = os.environ.get("OCR_PYTHON", os.path.join(SP, "ocrenv", "bin", "python"))
script = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ocr-yta.py")
res = {}
lst = list(lokal.items())
for n in range(0, len(lst), 40):
    r = subprocess.run([ocrpy, script] + [f for _, f in lst[n:n + 40]], capture_output=True, text=True)
    for rad in r.stdout.splitlines():
        d = rad.split("\t")
        if len(d) >= 5:
            res[d[0]] = d[1:]
    print("klar", min(n + 40, len(lst)), "av", len(lst), flush=True)
with open(ut, "w", encoding="utf-8") as o:
    o.write("sida8\tfarger\tfil\tstatus\tord\tarea\tmaxh\ttext\n")
    for i, f in lokal.items():
        d = res.get(os.path.basename(f)[:40], ["?", "", "", "", ""])
        o.write(f"{','.join(sorted({s for s, _ in ids[i]}))}\t{','.join(sorted({v for _, v in ids[i]}))}\t{i}\t{d[0]}\t{d[1]}\t{d[2]}\t{d[3]}\t{(d[4] if len(d) > 4 else '')[:160]}\n")
print("KLAR")
