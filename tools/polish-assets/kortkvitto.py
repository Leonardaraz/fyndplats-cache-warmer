# -*- coding: utf-8 -*-
"""Kvitterar en kortuppladdning — FÖRE media-PATCHen, aldrig efter.

☠️ `UploadImageToWixSite` svarar `success: true` även när uppladdningen sedan
   MISSLYCKAS. Svaret bär `operationStatus: "PENDING"` — Wix har tagit emot
   uppdraget, inte utfört det. Patchar man in ett fileId som hamnat i FAILED
   svarar V3 200 och utelämnar item:et TYST.

☠️ Och svaret bär inget filnamn. Kopplingen pid → fileId vilar därför på
   ORDNINGEN i `imageUrls`, vilket är precis det antagande huset brände sig på
   när bulk-lagerskrivningen byggdes om (räddningen där var att svaret bar
   radens id). Här finns inget id att lita på, så attributionen bevisas i
   stället på INNEHÅLLET: Wix lagrar originalet oförändrat, alltså måste md5
   stämma mot den lokala filen.

Kör: python3 kortkvitto.py <rundmapp> <pid>=<fileId> ...
"""
import hashlib
import os
import subprocess
import sys
import urllib.request

FILL = "https://static.wixstatic.com/media/%s/v1/fill/w_400,h_400,al_c,q_80/f.jpg"
ORIGINAL = "https://static.wixstatic.com/media/%s"


def md5(b):
    return hashlib.md5(b).hexdigest()


def kvittera(har, par, mall="%s_spec.jpg"):
    lokala = {p: md5(open(os.path.join(har, "kort", mall % p), "rb").read())
              for p in par}
    bak = {v: k for k, v in lokala.items()}
    ok, fel = {}, []
    for pid, fil in par.items():
        kod = subprocess.run(
            ["curl", "-sS", "-o", "/dev/null", "-w", "%{http_code}", FILL % fil],
            capture_output=True, text=True).stdout
        try:
            r = urllib.request.urlopen(urllib.request.Request(
                ORIGINAL % fil, headers={"User-Agent": "Mozilla/5.0"}),
                timeout=120).read()
            traff = bak.get(md5(r), "—")
        except Exception as e:                                    # noqa: BLE001
            traff, r = f"FEL {e}", b""
        rad = f"{pid}  fill={kod}  {len(r):>7} byte  md5→{traff}"
        if kod != "200" or traff != pid:
            fel.append(pid)
            rad += "   ✗"
        else:
            ok[pid] = fil
        print(rad)
    return ok, fel


if __name__ == "__main__":
    har = os.path.abspath(sys.argv[1])
    par = dict(a.split("=", 1) for a in sys.argv[2:])
    ok, fel = kvittera(har, par)
    print(f"\n{len(ok)} av {len(par)} READY och attribuerade på innehåll")
    sys.exit(1 if fel else 0)
