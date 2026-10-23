#!/usr/bin/env python3
"""katalogkontroll-tva-axlar-bilder.py <slugs.txt> [--hamta] [--katalog DIR]: vad kunden ser under varje kombination på sidor med två val (2026-10-23).

Skriver ingenting. <slugs.txt> har en rad per sida: "<åtta första tecknen i Wix-id> <slug>". Listan tas med katalogkontroll-tva-axlar-slugs.js (ExecuteWixAPI).
--hamta hämtar sidorna från butiken (curl, sex åt gången) till DIR (standard ./sidor), annars läses redan hämtade DIR/<id8>.html.

Varför: Leonard 2026-10-23, efter soptunnan: "har vi fler produkter som har samma fel". katalogkontroll-tva-lankade-optioner.js ser bara sidor med länkade bilder på BÅDA
optionerna (9 av 49). Soptunnans andra fel, att måttbilden för en annan storlek visas under valet, syns inte där: det uppstår också när färgen bär alla bilder, för
butikens vy är unionen av bilder som ägs av färgens eller storlekens val plus de olänkade, och en måttbild som ägs av färgen visas under varje storlek.

Metoden läser butikens EGEN sidodata, samma som kunden får (Next.js-flödet i HTML:en, med \\" som "):
  images          galleriets bilder i ordning
  imageOwners     bild → ETT val (det första som länkar den). En bild utan ägare visas under varje val
  imageAlts       bildens alt-text
  variantAxes     optionerna och valens etiketter
  variantTable    varje variant: val, pris, lager och BUTIKENS uträkning av variantens bild (färgvalets första länkade bild, lib/variant-price.ts)
Vy för en kombination = bilder utan ägare + bilder vars ägare är ett av de valda valen, i galleriets ordning. Modellen är mätt mot webbläsaren (live-galleri.mjs) på
soptunnan, förvaringskistan, skrivbordet 3b868848 och matstationen 1d4eb6b1: samma bilder, samma ordning.
Med butiksändringen "en bild per kombination" (revisionen 2026-10-23, butik-kopplingar.patch) bär sidan också `imageKopplingar`: bild → en lista per option
som kopplar den, med valens etiketter. Då räknas vyn som butiken gör det: en bild syns när den i VARJE option som kopplar den är kopplad till det valda
valet, och syns ingen kopplad bild visas hela galleriet. Saknar sidan fältet gäller den gamla regeln ovan.

Tre träffar, alla bygger på alt-texten (ett tips, bilden avgör):
  SPEC   en måttbild eller specifikation vars alt-text nämner ett annat vals tal (alla tal i etiketten står i alt-texten) än det valda
  FOTO   samma sak för en bild som inte är en måttbild
  FÄRG   alt-texten nämner en annan färg än den valda (sammansatta färger som "Svart och Röd" räknas som samma färg om något av orden står i alt-texten)
Och en fjärde, som inte bygger på alt-texten:
  VARUKORG  färgen äger bilder men variantens bild i SIDANS data ägs av något annat än färgen. Byggd efter soptunnans fel (Silver fick en svart tunna).
            ☠️ Sidans `variantTable[].image` är butikens uträkning, inte Wix variantbild (`variantsInfo.variants[].media`, den som varukorg, kassa och order läser). En id-skrivning av
            optionerna nollställer Wix bild till huvudbilden utan att den här raden ser det (2026-10-23, 16 sidor). Mät Wix med variantbild-farg.js i torrläge.
Etiketter på två tecken eller färre (S, M, L) räknas inte. Kompilationer som nämner flera färger ("Fyra av färgerna staplade") ger FÄRG-träffar och är avsiktliga.
"""
import json
import os
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
DEC = json.JSONDecoder()
TAL = re.compile(r"\d+(?:[.,]\d+)?")


def las(s, nyckel, start=0):
    i = s.find('"' + nyckel + '":', start)
    if i < 0:
        return None
    j = i + len(nyckel) + 3
    while s[j] in " \n":
        j += 1
    try:
        return DEC.raw_decode(s[j:])[0]
    except ValueError:
        return None


def fil(u):
    m = re.search(r"/media/([^/\"?]+)", u or "")
    return m.group(1) if m else (u or "")


def sidodata(katalog, id8):
    s = open(os.path.join(katalog, id8 + ".html"), encoding="utf-8").read().replace('\\"', '"')
    p = s.find('"productId":"' + id8)
    if p < 0:
        return None
    d = {k: las(s, k, p) for k in ("images", "imageOwners", "imageAlts", "variantAxes", "variantTable", "imageKopplingar")}
    if d["images"] is None or d["variantAxes"] is None or d["variantTable"] is None:
        return None
    if not isinstance(d["imageKopplingar"], dict):
        d["imageKopplingar"] = None
    d["imageOwners"] = d["imageOwners"] or {}
    d["imageAlts"] = d["imageAlts"] or {}
    d["gal"] = [fil(u) for u in d["images"]]
    return d


def passar(d, f, valda):
    """Butikens regel med kopplingar (synligaBilderForKombination): i varje option som kopplar bilden ska ett av dess val vara valt."""
    g = d["imageKopplingar"].get(f)
    return not g or all(any(e in valda for e in grupp) for grupp in g)


def vy(d, val):
    valda = set(val.values())
    if d.get("imageKopplingar") is not None:
        k = d["imageKopplingar"]
        if not any(k.get(f) and passar(d, f, valda) for f in d["gal"]):
            return list(range(1, len(d["gal"]) + 1))
        return [n + 1 for n, f in enumerate(d["gal"]) if passar(d, f, valda)]
    return [n + 1 for n, f in enumerate(d["gal"]) if f not in d["imageOwners"] or d["imageOwners"][f] in valda]


def tal(s):
    return {t.replace(",", ".") for t in TAL.findall(s or "")}


def namnda(alt, etiketter):
    a = alt.lower()
    at = tal(alt)
    ut = []
    for e in etiketter:
        et = tal(e)
        if et:
            if et <= at:
                ut.append(e)
        elif len(e) > 2 and e.lower() in a:
            ut.append(e)
    return ut


def ord_i(e):
    return [w.lower() for w in re.split(r"[^\wåäöÅÄÖ]+", e) if len(w) > 2 and w.lower() != "och"]


def samma_farg(valda, alt):
    a = alt.lower()
    return any(w in a for w in ord_i(valda))


def kontrollera(d):
    etik = {a["name"]: [c["label"] for c in a["choices"]] for a in d["variantAxes"]}
    # färgaxeln = den som heter Färg, övriga (Storlek, Längd, Typ ...) är storleksaxlar
    fax = [a for a in etik if a.lower().startswith("färg")]
    sax = [a for a in etik if a not in fax]
    spec, foto, farg = {}, {}, {}
    for v in d["variantTable"]:
        val = v["choices"]
        for n in vy(d, val):
            f = d["gal"][n - 1]
            alt = d["imageAlts"].get(f, "")
            ar_matt = bool(re.search(r"\bmått|specifikation", alt.lower()))
            for a in sax:
                nam = namnda(alt, etik[a])
                if nam and val.get(a) not in nam:
                    (spec if ar_matt else foto).setdefault(n, [set(), set()])
                    (spec if ar_matt else foto)[n][0].update(nam)
                    (spec if ar_matt else foto)[n][1].add(val.get(a))
            for a in fax:
                nam = namnda(alt, etik[a])
                if nam and val.get(a) not in nam and not samma_farg(val.get(a), alt):
                    farg.setdefault(n, [set(), set()])
                    farg[n][0].update(nam)
                    farg[n][1].add(val.get(a))
    return sax, fax, spec, foto, farg


def varukorg(d):
    """Varianter där färgen äger bilder men variantens bild (varukorg, kassa, order) ägs av något annat än färgen.
    Med kopplingar: variantens bild ska synas i kombinationen och vara kopplad till färgen, om färgen har kopplade bilder."""
    fax = [a["name"] for a in d["variantAxes"] if a["name"].lower().startswith("färg")]
    if d.get("imageKopplingar") is not None:
        k = d["imageKopplingar"]
        kopplade = {e for g in k.values() for grupp in g for e in grupp}
        ut = []
        for v in d["variantTable"]:
            f = fil(v.get("image", ""))
            valda = set(v["choices"].values())
            for a in fax:
                lab = v["choices"].get(a)
                if lab in kopplade and (not passar(d, f, valda) or not any(lab in grupp for grupp in (k.get(f) or []))):
                    ut.append((v["choices"], " / ".join(",".join(grupp) for grupp in (k.get(f) or [])) or None))
        return ut
    agare = set(d["imageOwners"].values())
    ut = []
    for v in d["variantTable"]:
        co = d["imageOwners"].get(fil(v.get("image", "")))
        for a in fax:
            lab = v["choices"].get(a)
            if lab in agare and co != lab:
                ut.append((v["choices"], co))
    return ut


def hamta(rader, katalog):
    os.makedirs(katalog, exist_ok=True)

    def en(r):
        id8, slug = r
        ut = subprocess.run(
            ["curl", "-sS", "-m", "60", "-A", UA, "-o", os.path.join(katalog, id8 + ".html"), "-w", "%{http_code}", "https://www.fyndplats.se/produkt/" + slug],
            capture_output=True, text=True,
        )
        return id8, ut.stdout.strip()

    with ThreadPoolExecutor(6) as ex:
        for id8, kod in ex.map(en, rader):
            if kod != "200":
                print("HÄMTNING FÖRE", id8, kod, file=sys.stderr)


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    rader = [l.split() for l in open(sys.argv[1], encoding="utf-8") if l.strip()]
    katalog = "sidor"
    if "--katalog" in sys.argv:
        katalog = sys.argv[sys.argv.index("--katalog") + 1]
    if "--hamta" in sys.argv:
        hamta(rader, katalog)
    summa = {"sidor": 0, "spec": 0, "foto": 0, "farg": 0, "vagn": 0, "fel": 0}
    for id8, slug in rader:
        d = sidodata(katalog, id8)
        summa["sidor"] += 1
        if d is None:
            summa["fel"] += 1
            print(id8, "FEL: sidans data gick inte att läsa")
            continue
        sax, fax, spec, foto, farg = kontrollera(d)
        vagn = varukorg(d)
        summa["vagn"] += bool(vagn)
        summa["spec"] += bool(spec)
        summa["foto"] += bool(foto and not spec)
        summa["farg"] += bool(farg)
        if not (spec or foto or farg or vagn):
            continue
        print(f"{id8} {slug[:46]:46s} storlek={','.join(sax) or '-':10s} spec={len(spec):2d} foton={len(foto):2d} färg={len(farg):2d} varukorg-fel={len(vagn)}")
        for etikett, grupp in (("SPEC", spec), ("FOTO", foto), ("FÄRG", farg)):
            for n, (nam, under) in sorted(grupp.items()):
                f = d["gal"][n - 1]
                print(f"    {etikett} b{n} [{d['imageOwners'].get(f, 'olänkad')}] «{d['imageAlts'].get(f, '')[:70]}» nämner {sorted(nam)}, visas under {sorted(under)}")
        for val, co in vagn:
            print(f"    VARUKORG {val}: variantens bild ägs av {co or 'ingen'}, färgen äger andra bilder")
    print(f"SUMMA {summa['sidor']} sidor: {summa['spec']} med minst en måttbild för fel val, {summa['foto']} bara med foton för fel val, {summa['farg']} med färgträff (tips), "
          f"{summa['vagn']} med fel varukorgsbild där färgen bär bilderna, {summa['fel']} som inte gick att läsa")


if __name__ == "__main__":
    main()
