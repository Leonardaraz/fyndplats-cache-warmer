#!/usr/bin/env python3
"""bygg.py: bygger planerna för rundan "originalens måttbilder tillbaka" (2026-10-24) ur orig.tsv, bort.tsv, bas-gammal-form.json och revisionsrundans agare-<id8>.json.

Leonard 2026-10-24: "Jag vill inte ha fyndplats kort egentligen, varje produkt har ju sin egen orginal specifikation bild, varje en ska va kopplad till rätt variant."
Måttbilderna som togs bort ur gallerierna 2026-10-23 (och ersattes av Fyndplats-kort) läggs alltså tillbaka, var och en länkad till sin färg OCH storlek, och korten tas bort.

Ut, en fil per sida:
  plan_<id8>.json    galleri-tillagg.js: {"id", "filer": [{"fil", "alt"}]}  (bygg-galleritillagg.py)
  agare_<id8>.json   bygg-agare.py: [{"id", "slug", "agare": {hex6: ägare}, ...}]   HELA galleriet inklusive korten (som ännu ligger kvar) och originalen
  bort_<id8>.txt     filerna bilder-bort.yml tar bort (korten), kommaseparerade
Kör bygg-agare.py först när originalen ligger i galleriet (torrkörningen jämför planen med galleriet) och bilder-bort.yml sist.

☠️ Den första bilden i en kombination är den som är kopplad i FLEST optioner (butikens lib/variant-price.ts, `antal > basta`, i kandidatordning). En måttbild som
länkas till färg OCH storlek skulle därför bli kombinationens första bild om färgens huvudbild bara är kopplad till färgen. Basfilerna för de äldre sidorna
(bas-gammal-form.json) har därför färgens första bild kopplad också till storlekarna, så att den vinner på ordningen.
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
REV = os.path.join(HERE, "..", "tva-axlar-revision-2026-10-23")

orig = {}
for rad in open(os.path.join(HERE, "orig.tsv"), encoding="utf-8"):
    if rad.startswith("#") or not rad.strip():
        continue
    id8, h, fil, ag, alt = rad.rstrip("\n").split("\t")
    orig.setdefault(id8, []).append({"hex6": h, "fil": fil, "agare": json.loads(ag), "alt": alt})
bort = {}
for rad in open(os.path.join(HERE, "bort.tsv"), encoding="utf-8"):
    if rad.startswith("#") or not rad.strip():
        continue
    id8, h, fil, kort = rad.rstrip("\n").split("\t")
    bort.setdefault(id8, []).append({"hex6": h, "fil": fil})
gammal = json.load(open(os.path.join(HERE, "bas-gammal-form.json"), encoding="utf-8"))
# ändra.json: ägare som ersätter basplanens (korten som ligger kvar som reserv syns bara för färgerna utan eget original)
andra = json.load(open(os.path.join(HERE, "ändra.json"), encoding="utf-8"))

ut = {}
for id8, lista in orig.items():
    if id8 in gammal:
        bas = {"id": gammal[id8]["id"], "slug": gammal[id8]["slug"], "agare": dict(gammal[id8]["agare"]), "tomt": []}
    else:
        p = json.load(open(os.path.join(REV, "agare-%s.json" % id8), encoding="utf-8"))[0]
        bas = dict(p)
        bas["agare"] = dict(p["agare"])
    for o in lista:
        if o["hex6"] in bas["agare"]:
            sys.exit("%s: %s finns redan i basplanen" % (id8, o["hex6"]))
        bas["agare"][o["hex6"]] = o["agare"]
    for h, ag in andra.get(id8, {}).items():
        if h not in bas["agare"]:
            sys.exit("%s: %s i ändra.json finns inte i basplanen" % (id8, h))
        bas["agare"][h] = ag
    for k in bort.get(id8, []):
        if k["hex6"] not in bas["agare"]:
            sys.exit("%s: kortet %s finns inte i basplanen" % (id8, k["hex6"]))
    json.dump([bas], open(os.path.join(HERE, "agare_%s.json" % id8), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump({"id": bas["id"], "filer": [{"fil": o["fil"], "alt": o["alt"]} for o in lista]},
              open(os.path.join(HERE, "plan_%s.json" % id8), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    open(os.path.join(HERE, "bort_%s.txt" % id8), "w", encoding="utf-8").write(",".join(k["fil"] for k in bort.get(id8, [])) + "\n")
    ut[id8] = (len(lista), len(bort.get(id8, [])), len(bas["agare"]))
for id8, (n, b, t) in sorted(ut.items()):
    print(id8, "original", n, "kort bort", b, "galleri efter tillägg", t)
