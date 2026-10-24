#!/usr/bin/env python3
"""efter.py: kontrollerar alla sidor i rundan mot butikens sidodata EFTER att de gamla måttbilderna tagits bort.

  python3 -I efter.py            (från rundans katalog)

agare_<id8>.json är specen som skrevs INNAN de gamla färgspecifika måttbilderna togs bort, så den nämner bilder som inte finns längre, och
kolla-agare.py svarar då `planen nämner … men bilden finns inte i galleriet` (en falsk avvikelse: Wix är rätt, specen är gammal).
Skriptet tar bort bilderna i bort.json ur varje spec (till en tillfällig katalog), kör kolla-agare.py per sida mot butikens egen
sidodata och skriver en rad per sida och en summa. Exit 0 = varje sida stämmer med planen.

bort.json: sida (de åtta första tecknen i Wix-id:t) → de borttagna bilderna som de sex första tecknen i fil-id:t efter `b379ce_`, som specarna.
slugs.txt: <id8>-<kort> <butikens adress efter /produkt/>.

☠️ Butikens cache fylls på var femte minut efter en ändring. Skriptet skriver `age` per sida: ett tal över tiden sedan sista skrivningen betyder
att du läser den gamla sidan, och en avvikelse är då inte ett fel i skrivningen."""
import json
import os
import re
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
KOLLA = os.path.join(HERE, "..", "..", "polish-gates", "kolla-agare.py")


def main():
    bort = json.load(open(os.path.join(HERE, "bort.json"), encoding="utf-8"))
    slugs = {}
    for rad in open(os.path.join(HERE, "slugs.txt"), encoding="utf-8"):
        if rad.strip():
            k, s = rad.split()
            slugs[k.split("-")[0]] = s
    tmp = tempfile.TemporaryDirectory()
    ut = tmp.name
    antal = ok_kombos = 0
    fel = []
    for id8, slug in slugs.items():
        spec = json.load(open(os.path.join(HERE, f"agare_{id8}.json"), encoding="utf-8"))
        borta = set(bort.get(id8, []))
        spec[0]["agare"] = {h: o for h, o in spec[0]["agare"].items() if h not in borta}
        fil = os.path.join(ut, f"agare_{id8}.json")
        json.dump(spec, open(fil, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        p = subprocess.run([sys.executable, "-I", KOLLA, fil, slug], capture_output=True, text=True, timeout=180)
        text = p.stdout + p.stderr
        rader = text.splitlines()
        oks = [l for l in rader if l.startswith("OK ")]
        vyer = [int(m.group(1)) for l in oks for m in [re.search(r"vy\s+(\d+) bilder", l)] if m]
        age = re.search(r"age (\d+) s", text)
        tips = next((l for l in rader if l.startswith("katalogkontrollens tips")), "")
        antal += 1
        ok_kombos += len(oks)
        if p.returncode != 0:
            fel.append(id8)
        print(f"{id8} exit={p.returncode} kombinationer={len(oks)} minsta vy={min(vyer) if vyer else '?'} "
              f"age={age.group(1) if age else '?'} s | {tips.replace('katalogkontrollens tips: ', '')}")
        if p.returncode != 0:
            print("\n".join("   " + l for l in rader[:25]))
    print(f"SUMMA {antal} sidor, {ok_kombos} kombinationer, {len(fel)} sidor med avvikelse {fel if fel else ''}")
    sys.exit(1 if fel else 0)


if __name__ == "__main__":
    main()
