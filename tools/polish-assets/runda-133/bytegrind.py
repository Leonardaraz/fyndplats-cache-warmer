# -*- coding: utf-8 -*-
"""Steg 1:s dubblettgrind — på BYTES, aldrig på fil-id (uppgift #499).

☠️ SKÄLET, MÄTT I RUNDA 132. Mediajämförelsen mellan utkastet `a6412efa`
   och publicerade `543b9076` svarade `delade_filer: 0` — ett FALSKT NEGATIVT.
   Bilderna var byte-identiska (md5 `2530de1b…`, 488 136 byte); bara fil-id:na
   skilde, eftersom Wix OMIMPORTERAR varje bild till en ny fil. En jämförelse
   på fil-id kan därför ALDRIG hitta den dubblett som uppstår när samma vara
   importerats två gånger — vilket är precis den dubblett som finns.

⚠️ ORIGINALET hämtas, ingen transform. En transform är deterministisk och
   skulle fungera för IDENTISKA källor, men den kan också göra två OLIKA
   källor lika (samma foto i två upplösningar) — alltså ett falskt positivt
   i den riktning som kostar mest: en ommappning som inte skulle gjorts.
"""
import hashlib
import os
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HAR)
import bilder as B                                               # noqa: E402

BAS = "https://static.wixstatic.com/media/%s"
MAPP = os.path.join(HAR, "bytebilder")


def hamta(fil):
    vag = os.path.join(MAPP, fil.replace("~", "_"))
    if not os.path.exists(vag) or os.path.getsize(vag) == 0:
        r = urllib.request.Request(BAS % fil,
                                   headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(r, timeout=120) as s:
            open(vag, "wb").write(s.read())
    b = open(vag, "rb").read()
    return fil, hashlib.md5(b).hexdigest(), len(b)


def kor():
    os.makedirs(MAPP, exist_ok=True)
    alla = []
    for pid, filer in B.GALLERI.items():
        for i, f in enumerate(filer, 1):
            alla.append((pid, i, f))

    with ThreadPoolExecutor(max_workers=8) as pool:
        utfall = list(pool.map(lambda t: hamta(t[2]), alla))
    fakta = {f: (m, n) for f, m, n in utfall}

    # md5 → [(pid, position)]
    per_md5 = {}
    for pid, i, f in alla:
        md5 = fakta[f][0]
        per_md5.setdefault(md5, []).append((pid, i))

    print("bilder: %d  unika md5: %d  (%d delade)"
          % (len(alla), len(per_md5), len(alla) - len(per_md5)))
    print()

    # Produktpar som delar minst en byte-identisk bild.
    par = {}
    for md5, poster in per_md5.items():
        pids = sorted({p for p, _ in poster})
        if len(pids) < 2:
            continue
        for a in range(len(pids)):
            for b in range(a + 1, len(pids)):
                nyckel = (pids[a], pids[b])
                par.setdefault(nyckel, []).append((md5, poster))

    if not par:
        print("NOLL byte-identiska bilder mellan två produkter.")
        return 0

    for (a, b), traffar in sorted(par.items(), key=lambda x: -len(x[1])):
        etikett = lambda p: p + ("*" if p in B.PUBLICERADE else "")
        print("%-10s %-10s  %d delade bilder av %d/%d"
              % (etikett(a), etikett(b), len(traffar),
                 len(B.GALLERI[a]), len(B.GALLERI[b])))
        for md5, poster in traffar:
            var = ", ".join("%s#%d" % (p, i) for p, i in poster if p in (a, b))
            storlek = [n for f, (m, n) in fakta.items() if m == md5][0]
            print("     %s  %7d byte   %s" % (md5[:12], storlek, var))
    print()
    print("* = PUBLICERAD sida")
    return len(par)


if __name__ == "__main__":
    kor()
