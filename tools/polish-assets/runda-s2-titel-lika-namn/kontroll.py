"""Kontrollsumma, samma som i Wix-anropen: h = (h*31 + UTF-16-enhet) mod 1e9+7
över JSON.stringify(seoData). Bevisar att säkerhetskopian är exakt vad Wix
hade -- en avskrift genom chatten kan annars smyga in ett fel."""
import json, sys, glob

def summa(s):
    h = 0
    b = s.encode("utf-16-le")
    for i in range(0, len(b), 2):
        h = (h * 31 + (b[i] | (b[i + 1] << 8))) % 1000000007
    return h

def js(o):
    return json.dumps(o, ensure_ascii=False, separators=(",", ":"))

if __name__ == "__main__":
    fel = 0
    n = 0
    for f in sorted(glob.glob("fore/del*.json")):
        for r in json.load(open(f)):
            n += 1
            if summa(js(r["s"])) != r["h"]:
                fel += 1
                print("AVVIKER", f, r["id"])
    print(n, "poster,", fel, "avvikelser")
    sys.exit(1 if fel else 0)
