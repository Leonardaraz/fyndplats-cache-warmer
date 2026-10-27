#!/usr/bin/env python3
"""vyer.py: räknar butikens bilder per kombination (färg × storlek) för varje sida med och utan korten som tas bort, ur specarna agare_<id8>.json.
Regeln är butikens (lib/variant-bilder.ts synligaBilderForKombination): en bild syns när den, i VARJE option som kopplar den, är kopplad till det valda valet; en bild utan ägare syns överallt."""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
VAR = {
 "c841717c": [("Svart","45 liter"),("Svart","60 liter"),("Silver","60 liter"),("Silver","45 liter")],
 "91f5c078": [("Mörkgrön","205 cm"),("Ljusgrå","205 cm"),("Svart","205 cm"),("Mörkgrå","205 cm"),("Ljusgrå","177 cm"),("Mörkgrå","177 cm"),("Mörkgrön","177 cm")],
 "38f70f83": [("Grön","200 cm"),("Vit","200 cm"),("Grön","300 cm"),("Vit","300 cm")],
 "92fc308c": [("Svart","50 liter"),("Svart","42 liter"),("Svart","30 liter"),("Silver","42 liter"),("Silver","50 liter"),("Silver","30 liter")],
 "1d4eb6b1": [("Vit","58,4 × 30,5 cm"),("Grå","58,4 × 30,5 cm"),("Espresso","58,4 × 30,5 cm"),("Vit","44 × 24 cm"),("Grå","44 × 24 cm"),("Espresso","44 × 24 cm")],
 "4d9ba658": [("Grå","60 × 40 cm"),("Vit","45 × 40 cm"),("Vit","60 × 40 cm"),("Brun","60 × 40 cm"),("Brun","45 × 40 cm"),("Grå","45 × 40 cm")],
 "c3d1fa41": [("Brun och svart","75 × 51 × 18 cm"),("Ljusgrå och svart","75 × 51 × 18 cm"),("Brun och svart","107 × 61 × 20 cm")],
 "44d4907b": [("Rosa","Ø244 cm"),("Flerfärgad","Ø244 cm"),("Rosa","Ø305 cm"),("Rosa","Ø366 cm")],
 "75a38b7b": [("Grön","120 cm"),("Vit","120 cm"),("Grön","150 cm")],
 "c438d4ba": [("Svart","50 × 70 cm"),("Svart","60 × 90 cm"),("Svart","50 × 110 cm"),("Guld","50 × 70 cm"),("Guld","60 × 90 cm"),("Guld","50 × 110 cm")],
 "934297b1": [("Ljusgrå","106 × 76 cm"),("Blå","106 × 76 cm"),("Blå","76 × 61 cm"),("Ljusgrå","61 × 46 cm")],
 "01ac2f63": [("Mörkblå","122 × 92 cm"),("Brun","92 × 76 cm"),("Grå","92 × 76 cm"),("Mörkblå","92 × 76 cm"),("Mörkblå","76 × 61 cm"),("Brun","61 × 46 cm")],
 "4a2ab58e": [("Mörkgrå","150 cm"),("Mörkgrå","213 cm"),("Grön","213 cm")],
 "5466fe81": [("Vit","300 × 397 cm"),("Grön","300 × 397 cm"),("Grön","300 × 597 cm")],
 "79ab08fe": [("Rustik brun och svart","109 cm"),("Rustik brun och svart","136 cm"),("Vit","109 cm"),("Vit","136 cm")],
 "3b868848": [("Natur och vit","63 cm"),("Natur och vit","80 cm"),("Vit","80 cm"),("Svart","63 cm"),("Vit","63 cm")],
 "7d1fb82b": [("Ljusgrön","40 cm"),("Olivgrön","40 cm"),("Ljusgrön","50 cm")],
}
def antal(agare, farg_namn, stor_namn, valt):
    n = 0
    for h, a in agare.items():
        if a == "-":
            n += 1; continue
        namn = [a] if isinstance(a, str) else a
        ok = True
        for grupp in (farg_namn, stor_namn):
            i = [x for x in namn if x in grupp]
            if i and not any(x in valt for x in i):
                ok = False
        n += 1 if ok else 0
    return n
bort = {}
for rad in open(os.path.join(HERE, "bort.tsv"), encoding="utf-8"):
    if rad.startswith("#") or not rad.strip(): continue
    p = rad.rstrip("\n").split("\t"); bort.setdefault(p[0], set()).add(p[1])
tot_under = 0
for id8, kombos in VAR.items():
    spec = json.load(open(os.path.join(HERE, "agare_%s.json" % id8), encoding="utf-8"))[0]["agare"]
    farg = {k[0] for k in kombos}; stor = {k[1] for k in kombos}
    # alla namn som förekommer i specen (även val utan variant)
    alla = set()
    for a in spec.values():
        if a != "-": alla.update([a] if isinstance(a, str) else a)
    farg = {n for n in alla if n not in stor and n not in {k[1] for k in kombos}} | farg
    stor = {n for n in alla if n not in farg} | stor
    utan = {h: a for h, a in spec.items() if h not in bort.get(id8, set())}
    # spec utan originalen = före (med korten): tas ur orig.tsv
    rader = []
    for f, s in kombos:
        med = antal(spec, farg, stor, {f, s}); ut = antal(utan, farg, stor, {f, s})
        rader.append((f, s, med, ut))
    under = [r for r in rader if r[3] < 4]
    tot_under += len(under)
    print(id8, "min utan kort:", min(r[3] for r in rader), "| kombinationer:", ", ".join("%s×%s %d→%d" % (f, s, m, u) for f, s, m, u in rader))
print("kombinationer under fyra bilder utan korten:", tot_under)
