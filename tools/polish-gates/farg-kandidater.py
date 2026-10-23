#!/usr/bin/env python3
# farg-kandidater.py <loggfil> <utkatalog> [auto-gräns textyta %, standard 2.5]
# Läser KAND- och FARG-raderna ur en aosom-fargtillagg-körning (läge kandidater), hämtar bilderna parallellt, kör OCR med textyta
# (ocr-yta.py) och skriver <ut>/kand.tsv:
#   sida8 val8 farg pos fil nuvarande ocr ord auto area maxh
# `auto` = ja när status är TEXT och textytan är minst gränsen: säljgrafik, stryks utan granskning (kalibrerat på omgång 1:
# 113 av 152 strukna fångades och 2 av 40 godkända förlorades vid 2,5 %).
import os, re, subprocess, sys, collections
from concurrent.futures import ThreadPoolExecutor
logg, ut = sys.argv[1], sys.argv[2]
GRANS = float(sys.argv[3]) if len(sys.argv) > 3 else 2.5
os.makedirs(ut, exist_ok=True)
SP = os.environ.get("FARG_SKRATCH", "/tmp/fargbilder")  # cache och OCR-miljö ligger här, utanför repot
CACHE = os.path.join(SP, "wxc")
os.makedirs(CACHE, exist_ok=True)
farg = {}; kand = []; hinder = []
for rad in open(logg, encoding="utf-8", errors="replace"):
    rad = re.sub(r"^\d{4}-\d\d-\d\dT[\d:.]+Z ", "", rad.rstrip("\n"))
    rad = re.sub(r"\x1b\[[0-9;]*m", "", rad)
    m = re.match(r"^FARG (\S+) (.*?) nuvarande (\S+) finns (\S*) hamta (\S*)(.*)$", rad)
    if m:
        sid, _, val = m.group(1).partition(":")
        farg[(sid, val)] = dict(namn=m.group(2), nuvarande=m.group(3), finns=m.group(4), hamta=m.group(5), extra=m.group(6).strip())
        continue
    m = re.match(r"^KAND (\S+) pos (\d+) (\S+) (\S+)$", rad)
    if m:
        sid, _, val = m.group(1).partition(":")
        kand.append((sid, val, int(m.group(2)), m.group(3)))
        continue
    m = re.match(r"^HINDER (\S+) (.*)$", rad)
    if m: hinder.append((m.group(1), m.group(2)))
print(f"FARG {len(farg)} · KAND {len(kand)} · HINDER {len(hinder)}")
for h in hinder: print("  HINDER", h[0][:8], h[1][:120])

def hamta(fid):
    f = os.path.join(CACHE, fid.replace("~", "_"))
    if not os.path.exists(f) or os.path.getsize(f) < 500:
        r = subprocess.run(["curl", "-sS", "--max-time", "60", "-o", f, "-w", "%{http_code}", f"https://static.wixstatic.com/media/{fid}"], capture_output=True, text=True)
        if r.stdout.strip() != "200":
            print("FEL", fid, r.stdout.strip()); return None
    return f
with ThreadPoolExecutor(8) as ex:
    filer = list(ex.map(lambda k: hamta(k[3]), kand))
ocrpy = os.environ.get("OCR_PYTHON", os.path.join(SP, "ocrenv", "bin", "python"))
lokala = [f for f in filer if f]
status = {}
for i in range(0, len(lokala), 40):
    r = subprocess.run([ocrpy, os.path.join(os.path.dirname(os.path.abspath(__file__)), "ocr-yta.py")] + lokala[i:i + 40], capture_output=True, text=True)
    for rad in r.stdout.splitlines():
        d = rad.split("\t")
        if len(d) >= 5: status[d[0]] = d
    if r.returncode != 0: print("OCR-fel:", r.stderr[-300:])
n_auto = 0
with open(os.path.join(ut, "kand.tsv"), "w") as k:
    k.write("sida8\tval8\tfarg\tpos\tfil\tnuvarande\tocr\tord\tauto\tarea\tmaxh\n")
    for (sid, val, pos, fil), f in sorted(zip(kand, filer), key=lambda x: (x[0][0], x[0][1], x[0][2])):
        fi = farg.get((sid, val), {})
        key = os.path.basename(f)[:40] if f else ""
        d = status.get(key, [key, "?", "0", "0", "0", ""])
        area = float(d[3]); auto = "ja" if d[1] == "TEXT" and area >= GRANS else ""
        n_auto += 1 if auto else 0
        k.write(f"{sid[:8]}\t{val[:8]}\t{fi.get('namn','?')}\t{pos}\t{fil}\t{fi.get('nuvarande','-')}\t{d[1]}\t{d[5][:100]}\t{auto}\t{d[3]}\t{d[4]}\n")
print(f"auto-strukna (textyta ≥ {GRANS} %): {n_auto} av {len(kand)}")
per = collections.defaultdict(list)
for (sid, val, pos, fil), f in zip(kand, filer):
    key = os.path.basename(f)[:40] if f else ""
    d = status.get(key, [key, "?", "0", "0", "0", ""])
    per[(sid, val)].append((pos, d[1] + ("*" if d[1] == "TEXT" and float(d[3]) >= GRANS else "")))
for (sid, val), lst in sorted(per.items()):
    fi = farg.get((sid, val), {})
    print(sid[:8], val[:8], (fi.get("namn", "?"))[:16].ljust(16), "nu", fi.get("nuvarande", "-"), "→", " ".join(f"p{p}:{s}" for p, s in sorted(lst)))
