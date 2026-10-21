#!/usr/bin/env python3
# Jämför vad butiken visar live mot det som skrevs (2026-10-21).
#
#   kolla-live-farg.py <plan.json> <live-katalog>
#
# plan.json har formen i tools/polish-assets/farger-fler-bilder-2026-10-21/aosom-givare-1.json
# ({ "sidor": [ { "id": "<wix-id>", "bilder": [ { "val": "<färg>", "fil": "<Wix fil-id>" } ] } ] }).
# live-katalogen har en fil live2_<id8>.json per sida, skriven av
# `node tools/polish-gates/live-bilder.mjs <slug> <katalog>/live2_<id8>.json`
# (Playwright klickar varje färg i väljaren och skriver galleriets fil-id i ordning).
#
# En bild med "struken": "<skäl>" i planen ska INTE synas i någon färgs vy (den togs bort efteråt med bilder-bort.yml,
# t.ex. för att talen i den sa emot sidans text) och räknas inte som tillagd.
#
# För varje färg kontrolleras två saker: varje tillagd fil syns i färgens egen vy (annars väntar
# butikens cache, som fylls på var femte minut, eller så är länken fel), och ingen syns i en
# ANNAN färgs vy (en bild på fel färg). Svaret ger också varje färgs antal bilder.
# Slutar med ALLT OK eller AVVIKELSER FINNS (exit 1).
import json
import os
import sys

plan = json.load(open(sys.argv[1]))
kat = sys.argv[2]
alla_ok = True
for sida in plan["sidor"]:
    id8 = sida["id"][:8]
    per_farg = {}
    struken = [b["fil"][7:15] for b in sida["bilder"] if b.get("struken")]
    for b in sida["bilder"]:
        if b.get("struken"):
            continue
        per_farg.setdefault(b["val"], []).append(b["fil"][7:15])
    f = os.path.join(kat, f"live2_{id8}.json")
    if not os.path.exists(f):
        print(id8, "SAKNAS")
        alla_ok = False
        continue
    d = json.load(open(f))
    vyer = {k["val"].split("=", 1)[-1]: [i[7:15] for i in k["ids"]] for k in d["kombos"]}
    rad = []
    kvar = [a for a, vv in vyer.items() if any(x in vv for x in struken)]
    if kvar:
        rad.append(f"STRUKNA BILDER SYNS FORTFARANDE i {kvar}")
        alla_ok = False
    for farg, filer in per_farg.items():
        v = vyer.get(farg)
        if v is None:
            rad.append(f"{farg}: FÄRGEN SAKNAS I VÄLJAREN")
            alla_ok = False
            continue
        saknas = [x for x in filer if x not in v]
        andras = [a for a, vv in vyer.items() if a != farg and any(x in vv for x in filer)]
        ok = not saknas and not andras
        alla_ok = alla_ok and ok
        rad.append(
            f"{farg}: vy {len(v)} {'OK' if ok else 'FEL'}"
            + (f" saknas {saknas}" if saknas else "")
            + (f" syns även i {andras}" if andras else "")
        )
    print(id8, "|", "; ".join(rad), "| alla:", ", ".join(f"{a}={len(vv)}" for a, vv in vyer.items()))
print("ALLT OK" if alla_ok else "AVVIKELSER FINNS")
sys.exit(0 if alla_ok else 1)
