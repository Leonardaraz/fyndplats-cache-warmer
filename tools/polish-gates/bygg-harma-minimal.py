#!/usr/bin/env python3
"""bygg-harma-minimal.py <galleri.json> <slugs.txt> <live-katalog> <ut-katalog> <id8>[,<id8>…] [--sjalvprov]: MINIMAL ägarplan för Härma-sidorna (2026-10-28).

Skriver ingenting i Wix. Samma indata som bygg-harma-agare.py (butikens sidodata per sida och aosom-galleri-per-kombination.json) och samma utdata:
`agare-<id8>.json` i <ut-katalog>, i formen bygg-agare.py tar. Skillnaden: den här ändrar BARA de foton som butiken visar under en kombination som Aosom inte visar
dem under, och lämnar varje annat foto med sina nuvarande länkar.

Varför en andra byggare: bygg-harma-agare.py ger varje äldre foto den exakta rektangeln, och det ger fler länkar än Wix tar på en sida där varje storlek redan ligger på
taket (15 länkade bilder per val, lärdom 217), och det flyttar första bilden för kombinationer vars packshot inte är feedens. De elva sidorna som låg utanför den
första rundan (`harma-aldre-bilder.tsv`, `forsta_bilden_fel` = 0) har rätt första bild redan, och felen är små. Mätt 2026-10-28 på alla elva: ett till sju foton per sida
visas under en kombination Aosom inte visar dem under (ett på 0136e7d9, 4a2ab58e, 6d35a04f och c3d1fa41, sju på projektduken 926ec7a2), och inget saknas i en vy där
Aosom visar det.

Regler:
  1. Ett foto räknas som FEL när butikens vy för någon kombination innehåller det men Aosoms uppsättning för fotot (`gamla_foton`) inte gör det. Ett foto utan uppgift från
     Aosom (de nya från Härma-rundan) och ett foto som redan visas exakt rörs inte.
  2. Ett fel foto får det billigaste uttryck (färre länkar) vars effekt över sidans kombinationer är exakt Aosoms uppsättning (`rektangel` och `agare_namn` i
     bygg-harma-agare.py, samma som för den fulla byggaren). Bildar uppsättningen ingen rektangel rörs fotot inte och listas.
  3. Planen har `ordning` tom. ☠️ En ändring från en länk till två gör fotot starkare i butikens uträkning av första bild (den med flest kopplade optioner vinner, lika
     antal ger den tidigaste i färgens lista), så ett ändrat foto kan gå före kombinationens nuvarande första bild, och därmed byta varukorgens bild. Kör därför ALLTID
     `bygg-agare.py --torr` och jämför `forsta` och `varukorg` per kombination med tabellen den här byggaren skriver (före-läget ur butikens data). Byter en första bild: lägg
     `ordning` i planen (kombinationens nuvarande första foto först i färgens lista) eller en andra länk på det fotot, och kör torren igen. Det gällde två av sju sidor 2026-10-28
     (projektduken `926ec7a2` och hundbädden `01ac2f63`).
  4. Länkarna per val skrivs före → efter. ☠️ Över 15 går inte att skriva: sidan får då stå kvar med sina felplacerade foton, eller så tas något bort. Det är ett beslut för
     en människa, och byggaren väljer aldrig bilder. Fyra av de elva sidorna (1d4eb6b1, 4d9ba658, 543b9076, aafbf543) låg på 15 i båda storlekarna och lämnades.
"""
import importlib.util
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))


def ladda(namn, fil):
    sp = importlib.util.spec_from_file_location(namn, os.path.join(HERE, fil))
    m = importlib.util.module_from_spec(sp)
    sp.loader.exec_module(m)
    return m


kk = ladda("kk", "katalogkontroll-tva-axlar-bilder.py")
bha = ladda("bha", "bygg-harma-agare.py")


def hex6(fil):
    return fil.split("_")[1][:6]


def minimal_plan(d, g, id8):
    """Ren funktion över butikens sidodata `d` och Aosom-underlaget `g` för sidan.

    Svar: (agare, andrade, felfoton, ej_rektangel, farg_namn, stor_namn) där agare är HELA planen (hex6 → ägare), andrade listan (hex6, nu, ny) och felfoton mängden foton
    som visas under en fel kombination.
    """
    ax = d["variantAxes"]
    farg_ax = next((a for a in ax if re.search(r"färg|color|kulör", a["name"], re.I)), None)
    stor_ax = next((a for a in ax if a is not farg_ax), None)
    if farg_ax is None or stor_ax is None or len(ax) != 2:
        raise SystemExit("%s: sidan har inte exakt en färgoption och en annan option (%s)" % (id8, [a["name"] for a in ax]))
    norm = bha.norm
    farg_namn = [c["label"] for c in farg_ax["choices"]]
    stor_namn = [c["label"] for c in stor_ax["choices"]]
    farg_av = {norm(n): n for n in farg_namn}
    stor_av = {norm(n): n for n in stor_namn}
    kombo = {(v["choices"][farg_ax["name"]], v["choices"][stor_ax["name"]]) for v in d["variantTable"]}
    fax = g["axlar"][0]
    # Aosoms uppsättning per äldre foto: mängden (färg, storlek) där Aosom visar fotot.
    uppsattning = {}
    for h, par in g["gamla_foton"].items():
        s = set()
        for a, b in par:
            c, z = (a, b) if re.search(r"färg|color|kulör", fax, re.I) else (b, a)
            if norm(c) not in farg_av or norm(z) not in stor_av:
                raise SystemExit("%s: Aosom-underlagets etikett %r/%r finns inte på sidan" % (id8, c, z))
            s.add((farg_av[norm(c)], stor_av[norm(z)]))
        uppsattning[h] = s
    gal = d["gal"]
    hexar = [hex6(f) for f in gal]
    if len(set(hexar)) != len(hexar):
        raise SystemExit("%s: två foton delar de sex första tecknen i fil-id" % id8)
    agare = {}
    for f in gal:
        agare[hex6(f)] = bha.flata_kopplingar((d["imageKopplingar"] or {}).get(f))
    # Fel foto: butikens vy för någon kombination innehåller det, Aosoms uppsättning gör det inte.
    felfoton = set()
    for (c, z) in kombo:
        for pos in kk.vy(d, {farg_ax["name"]: c, stor_ax["name"]: z}):
            h = hexar[pos - 1]
            if h in uppsattning and (c, z) not in uppsattning[h]:
                felfoton.add(h)
    andrade, ej_rektangel = [], []
    for h in sorted(felfoton):
        rekt = bha.rektangel(uppsattning[h], kombo, farg_namn, stor_namn)
        if rekt is None:
            ej_rektangel.append(h)
            continue
        ny = bha.agare_namn(rekt, farg_namn, stor_namn)
        andrade.append((h, agare[h], ny))
        agare[h] = ny
    return agare, andrade, felfoton, ej_rektangel, farg_namn, stor_namn


def fore_tabell(d):
    """Före-läget per kombination ur butikens data: antal foton, kombinationens första bild (variantTable.image) och färgens första foto (variantens bild i varukorgen)."""
    ut = []
    ax = d["variantAxes"]
    farg_ax = next((a for a in ax if re.search(r"färg|color|kulör", a["name"], re.I)), None)
    farg_forsta = {}
    for c in (farg_ax or {"choices": []})["choices"]:
        m = re.search(r"/media/b379ce_([0-9a-f]{6})", c.get("image") or "")
        farg_forsta[c["label"]] = m.group(1) if m else None
    for v in d["variantTable"]:
        m = re.search(r"/media/b379ce_([0-9a-f]{6})", v.get("image") or "")
        antal = len(kk.vy(d, v["choices"]))
        namn = " × ".join(v["choices"][a["name"]] for a in ax)
        ut.append((namn, antal, m.group(1) if m else None, farg_forsta.get(v["choices"].get(farg_ax["name"])) if farg_ax else None))
    return ut


def sjalvprov():
    # Två färger × två storlekar. Fotona: a (Vit, båda storlekar, Aosom: bara S) = fel, b (Grå, S, exakt), c (Vit, L, exakt, redan två länkar), d (gemensam, Aosom: Vit i båda).
    def fil(h):
        return "b379ce_%s%s~mv2.jpg" % (h, "0" * 26)

    gal = [fil(h) for h in ("aaaaaa", "bbbbbb", "cccccc", "dddddd")]
    d = {
        "variantAxes": [
            {"name": "Färg", "choices": [{"label": "Vit", "image": ""}, {"label": "Grå", "image": ""}]},
            {"name": "Storlek", "choices": [{"label": "S", "image": ""}, {"label": "L", "image": ""}]},
        ],
        "variantTable": [
            {"choices": {"Färg": "Vit", "Storlek": "S"}, "image": ""},
            {"choices": {"Färg": "Vit", "Storlek": "L"}, "image": ""},
            {"choices": {"Färg": "Grå", "Storlek": "S"}, "image": ""},
        ],
        "gal": gal,
        "images": ["https://static.wixstatic.com/media/" + f for f in gal],
        "imageOwners": {},
        "imageAlts": {},
        "imageKopplingar": {gal[0]: [["Vit"]], gal[1]: [["Grå"]], gal[2]: [["Vit"], ["L"]]},
    }
    g = {
        "axlar": ["Färg", "Storlek"],
        "gamla_foton": {"aaaaaa": [["Vit", "S"]], "bbbbbb": [["Grå", "S"]], "cccccc": [["Vit", "L"]], "dddddd": [["Vit", "S"], ["Vit", "L"]]},
        "pos1": {},
    }
    agare, andrade, felfoton, ej, farg, stor = minimal_plan(d, g, "test0000")
    assert felfoton == {"aaaaaa", "dddddd"}, felfoton
    assert ej == [], ej
    # a: effekten (Vit, S) bland sidans tre kombinationer. Storleken S ensam ger också Grå × S, alltså krävs båda: ["Vit", "S"].
    assert agare["aaaaaa"] == ["Vit", "S"], agare["aaaaaa"]
    # d: Vit i båda storlekar. Färgen Vit ensam ger exakt (Vit, S) och (Vit, L), så ett enda val räcker.
    assert agare["dddddd"] == "Vit", agare["dddddd"]
    # Orörda foton behåller sin nuvarande ägare.
    assert agare["bbbbbb"] == "Grå" and agare["cccccc"] == ["Vit", "L"], agare
    assert [h for h, _, _ in andrade] == ["aaaaaa", "dddddd"]
    # Ett foto som redan är exakt rörs inte, och en sida utan fel ger en tom lista.
    d["imageKopplingar"] = {gal[0]: [["Vit"], ["S"]], gal[1]: [["Grå"]], gal[2]: [["Vit"], ["L"]], gal[3]: [["Vit"]]}
    _, andrade2, fel2, _, _, _ = minimal_plan(d, g, "test0000")
    assert andrade2 == [] and fel2 == set(), (andrade2, fel2)
    print("självprov: ok")


def main():
    if "--sjalvprov" in sys.argv[1:]:
        sjalvprov()
        return
    if len(sys.argv) < 6:
        sys.exit(__doc__)
    galleri = json.load(open(sys.argv[1], encoding="utf-8"))
    slugs = {}
    for rad in open(sys.argv[2], encoding="utf-8"):
        delar = rad.split()
        if len(delar) >= 2:
            slugs[delar[0]] = delar[1]
    katalog, ut = sys.argv[3], sys.argv[4]
    os.makedirs(ut, exist_ok=True)
    for id8 in sys.argv[5].split(","):
        d = kk.sidodata(katalog, id8)
        if d is None:
            sys.exit("%s: sidan saknar data (hämtades den?)" % id8)
        if d["imageKopplingar"] is None:
            sys.exit("%s: sidans data saknar imageKopplingar (butiksändringen är inte ute)" % id8)
        agare, andrade, felfoton, ej_rektangel, farg_namn, stor_namn = minimal_plan(d, galleri[id8], id8)
        html = open(os.path.join(katalog, id8 + ".html"), encoding="utf-8").read().replace('\\"', '"')
        pid = re.search(r'"productId":"(%s[0-9a-f-]{28})"' % re.escape(id8), html)
        if not pid:
            sys.exit("%s: hittar inte produktens fulla id i sidan" % id8)
        plan = {"id": pid.group(1), "slug": slugs[id8], "agare": agare, "tomt": [], "ordning": {}}
        fil = os.path.join(ut, "agare-%s.json" % id8)
        json.dump([plan], open(fil, "w", encoding="utf-8"), ensure_ascii=False)
        print("%s  %s  %d av %d foton ändras (%d visas fel)  → %s" % (id8, slugs[id8], len(andrade), len(d["gal"]), len(felfoton), fil))
        for h, nu, ny in andrade:
            print("    %s  %s  →  %s" % (h, json.dumps(nu, ensure_ascii=False), json.dumps(ny, ensure_ascii=False)))
        for h in ej_rektangel:
            print("    ☠️ %s: Aosoms kombinationer bildar ingen rektangel, planen rör inte fotot" % h)
        antal_nu = bha.lankar_per_val({hex6(f): bha.flata_kopplingar((d["imageKopplingar"] or {}).get(f)) for f in d["gal"]})
        antal_ny = bha.lankar_per_val(agare)
        print("    länkar per val nu → efter: " + ", ".join("%s %d→%d" % (n, antal_nu.get(n, 0), antal_ny.get(n, 0)) for n in farg_namn + stor_namn))
        for n in farg_namn + stor_namn:
            if antal_ny.get(n, 0) > bha.MAX_LANKAR_PER_VAL:
                print("    ☠️ ÖVER %d LÄNKAR: %s %d (Wix tar högst %d länkade bilder per val, planen går inte att skriva)" % (bha.MAX_LANKAR_PER_VAL, n, antal_ny[n], bha.MAX_LANKAR_PER_VAL))
        print("    före, per kombination: antal foton, kombinationens första bild, färgens första foto (varukorgen):")
        for namn, antal, forsta, farg_forsta in fore_tabell(d):
            print("      %-40s %2d foton, första %s, varukorg %s" % (namn, antal, forsta, farg_forsta))
        print("    ☠️ Kör bygg-agare.py --torr och jämför `forsta` och `varukorg` med raderna ovan innan något skrivs.")


if __name__ == "__main__":
    main()
