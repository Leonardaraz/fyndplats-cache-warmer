#!/usr/bin/env python3
"""kolla-agare.py <spec.json> <slug> [--sida <fil.html>]: jämför butikens EGEN sidodata med planen som bygg-agare.py skrev till Wix.

  python3 -I tools/polish-gates/kolla-agare.py spec.json sidans-slug

spec.json är samma fil som bygg-agare.py fick: [{"id": "<fullt produkt-id>", "agare": {"<hex6>": "<valets namn>" | ["<val>", "<val>"] | "-"}, "tomt": []}].
En lista är en bild som hör till en kombination (färg OCH storlek). Den kontrolleras mot sidans `imageKopplingar`, som bara finns när butiksändringen
"en bild per kombination" är ute (revisionen 2026-10-23); saknas fältet räknas varje lista som en avvikelse.
Skriptet hämtar https://www.fyndplats.se/produkt/<slug> (curl, vanlig webbläsarrubrik) och läser ur sidan `imageOwners`, `variantAxes` och
`variantTable`. Skriver ingenting, och sidan bär inget artikelnummer. Tre kontroller, och varje avvikelse räknas:

  1. varje galleribild har den ägare planen säger (`-` = ingen ägare, alltså gemensam),
  2. butikens vy per kombination (olänkade bilder plus bilderna som ägs av de valda valen, `katalogkontroll-tva-axlar-bilder.py` → `vy`) är den
     vy planen ger, i galleriets ordning,
  3. katalogkontrollens tips (SPEC, FOTO, FÄRG, VARUKORG) skrivs ut. De bygger på alt-texter och är ett tips, bilden avgör.

☠️ Butikens cache fylls på var femte minut efter en ändring (cron `uppdatera-andrade`), ibland senare. Skriptet skriver `age` på sidan: ett högt
tal (över tiden sedan skrivningen) betyder att du läser den gamla sidan, och avvikelserna är då inte ett fel i skrivningen. Vänta och kör om.
☠️ "varukorgens bild" i utskriften är BUTIKENS egen uträkning ur färgvalets första länkade bild (`lib/variant-price.ts`, den som leder galleriet), inte Wix variantbild
(varukorg, kassa, order). De är två olika saker: en id-skrivning av optionerna nollställer Wix variantbild till huvudbilden medan butikens uträkning står kvar. Läs Wix
sida med `variantbild-farg.js` i torrläge (bygg-variantbild-farg.py --torr): `ratt` ska vara lika med `varianter` för varje sida.
--sida läser en redan hämtad sida i stället för att hämta. Exit 0 = allt stämmer, 1 = avvikelser, 2 = sidan gick inte att läsa."""
import importlib.util
import json
import os
import re
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
_s = importlib.util.spec_from_file_location("kk", os.path.join(HERE, "katalogkontroll-tva-axlar-bilder.py"))
kk = importlib.util.module_from_spec(_s)
_s.loader.exec_module(kk)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(args) < 2 and "--sida" not in sys.argv:
        sys.exit(__doc__)
    spec = json.load(open(args[0], encoding="utf-8"))[0]
    id8 = spec["id"][:8]
    plan = spec["agare"]
    with tempfile.TemporaryDirectory() as kat:
        if "--sida" in sys.argv:
            fil = sys.argv[sys.argv.index("--sida") + 1]
            open(os.path.join(kat, id8 + ".html"), "wb").write(open(fil, "rb").read())
            print("sida läst ur", os.path.basename(fil))
        else:
            slug = args[1]
            hdr = os.path.join(kat, "hdr.txt")
            ut = subprocess.run(["curl", "-sS", "-m", "60", "-A", kk.UA, "-D", hdr, "-o", os.path.join(kat, id8 + ".html"), "-w", "%{http_code}",
                                 "https://www.fyndplats.se/produkt/" + slug], capture_output=True, text=True)
            h = open(hdr, encoding="utf-8", errors="replace").read() if os.path.exists(hdr) else ""
            age = re.search(r"(?im)^age:\s*(\d+)", h)
            cache = re.search(r"(?im)^x-vercel-cache:\s*(\S+)", h)
            print("HTTP %s | age %s s | cache %s" % (ut.stdout.strip(), age.group(1) if age else "?", cache.group(1) if cache else "?"))
        d = kk.sidodata(kat, id8)
    if d is None:
        print("kunde inte läsa sidans data")
        sys.exit(2)
    fel = 0
    kopp = d.get("imageKopplingar")
    print("sidan bär imageKopplingar (butiksändringen är ute)" if kopp is not None else "sidan saknar imageKopplingar (den gamla butiken: en ägare per bild)")
    for n, f in enumerate(d["gal"], 1):
        hex6 = f[7:13]
        if hex6 not in plan:
            fel += 1
            print("☠️ #%d %s: bilden finns i galleriet men inte i planen" % (n, hex6))
            continue
        v = plan[hex6]
        if kopp is not None:
            vantat = sorted([] if v == "-" else [[x.lower()] for x in (v if isinstance(v, list) else [v])])
            nu = sorted(sorted(e.lower() for e in grupp) for grupp in (kopp.get(f) or []))
            if vantat != nu:
                fel += 1
                print("☠️ #%d %s: kopplingar nu %s, planen säger %s" % (n, hex6, nu, vantat))
            continue
        if isinstance(v, list):
            fel += 1
            print("☠️ #%d %s: planen ger bilden ägare i flera optioner %s, och sidan saknar imageKopplingar" % (n, hex6, v))
            continue
        vantat = None if v == "-" else v
        nu = d["imageOwners"].get(f)
        if (vantat or "").lower() != (nu or "").lower():
            fel += 1
            print("☠️ #%d %s: ägare nu %r, planen säger %r" % (n, hex6, nu, vantat))
    galhex = {f[7:13] for f in d["gal"]}
    for hex6 in plan:
        if hex6 not in galhex:
            fel += 1
            print("☠️ planen nämner %s men bilden finns inte i galleriet" % hex6)
    # ☠️ En sida med EN option (skumklossarna d70e483e, 2026-10-23) har inget `variantAxes` och ingen `variantTable` i sin data (de står som "$undefined"):
    # butiken väljer då färg ur en annan struktur. Ägarna per bild går att kontrollera, men vyn per val inte. Den mäts med live-galleri.mjs.
    if not isinstance(d["variantTable"], list) or not isinstance(d["variantAxes"], list):
        print("sidan har EN option: ingen variantTable i sidans data, så bara ägarna per bild kontrolleras (vyn per val: node tools/polish-gates/live-galleri.mjs <slug>)")
        print("ALLT STÄMMER MOT PLANEN (bara ägarna)" if fel == 0 else "AVVIKELSER: %d" % fel)
        sys.exit(0 if fel == 0 else 1)
    for v in d["variantTable"]:
        valda = {x.lower() for x in v["choices"].values()}

        def syns(a):
            if a == "-":
                return True
            return all(x.lower() in valda for x in (a if isinstance(a, list) else [a or ""]))

        vantad = [n for n, f in enumerate(d["gal"], 1) if f[7:13] in plan and syns(plan[f[7:13]])]
        nu = kk.vy(d, v["choices"])
        bild = kk.fil(v.get("image", ""))
        pos = d["gal"].index(bild) + 1 if bild in d["gal"] else None
        ok = "OK " if vantad == nu else "☠️ "
        if vantad != nu:
            fel += 1
        print("%s%-34s vy %2d bilder %s | varukorgens bild #%s" % (ok, " × ".join(v["choices"].values()), len(nu), ",".join(map(str, nu)), pos))
        if vantad != nu:
            print("     planen väntar", ",".join(map(str, vantad)))
    sax, fax, spec_, foto, farg = kk.kontrollera(d)
    print("katalogkontrollens tips: SPEC", sorted(spec_), "FOTO", sorted(foto), "FÄRG", sorted(farg), "VARUKORG", len(kk.varukorg(d)))
    print("ALLT STÄMMER MOT PLANEN" if fel == 0 else "AVVIKELSER: %d" % fel)
    sys.exit(0 if fel == 0 else 1)


main()
