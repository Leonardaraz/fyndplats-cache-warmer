#!/usr/bin/env python3
"""bygg-harma-agare.py <galleri.json> <slugs.txt> <live-katalog> <ut-katalog> <id8>[,<id8>…] [--sjalvprov]: ägarplan för äldre foton på Härma-sidorna (2026-10-28).

Skriver ingenting i Wix. Läser butikens egen sidodata (<live-katalog>/<id8>.html, hämtad med katalogkontroll-tva-axlar-bilder.py --hamta eller curl) och
`aosom-galleri-per-kombination.json` (runda-bilder-soptunna-exakt: per sida de äldre fotona och vilka kombinationer Aosom visar dem under, plus feedens första
foto per kombination) och skriver `agare-<id8>.json` i <ut-katalog>, i formen bygg-agare.py tar: [{id, slug, agare, tomt, ordning}].

Varför: Härma-rundan (2026-10-24) la 356 nya foton på sina exakta kombinationer, men de äldre fotona behöll sina gamla länkar (hela färgen eller hela storleken,
ofta "pinnade" för att inte ändra någon vy). Därför visar 12 av de 30 sidorna under minst en kombination ett foto som Aosom visar för en annan (soptunnan
c841717c var den första, rättad 2026-10-27). Aosoms galleri per artikel är facit för ett fotos ägare, inte alt-texten och inte ögat.

Regler (samma som soptunnans rättning):
  1. Ett äldre foto som Aosom visar under en REKTANGEL av kombinationer (färger × storlekar, räknat mot de kombinationer sidan har) får exakt den rektangeln som ägare.
     En axel som täcker alla sidans kombinationer utelämnas. Täcker båda är fotot gemensamt ("-").
  2. Ett äldre foto vars kombinationer INTE bildar en rektangel, och varje foto utan uppgift från Aosom, behåller sina nuvarande länkar. Det listas i rapporten.
  3. Ett nytt foto (Härma-rundan) behåller sina nuvarande länkar. De var redan exakta.
  4. `ordning` lägger feedens första foto för varje kombination först i färgens lista, i storleksordningen som sidans huvudbild börjar med. Butikens första bild för
     en kombination är det första fotot i färgens lista som passar kombinationen och är kopplat i flest optioner (lib/variant-price.ts), och Wix variantbild
     (varukorg, kassa, order) är färgens första foto. Utan `ordning` blir första bilden det som råkar komma först i listan.
  5. Ingen vy får hamna under fyra bilder utan att det står i rapporten. Rapporten säger det, och planen ändras då inte av sig själv: det är ett beslut.
  6. ☠️ Wix tar högst 15 länkade bilder per val (mätt 2026-10-24, lärdom 217: 16 och fler ger `400 … optionSettings.choicesSettings is invalid`). Ett foto med en
     ägarlista räknas mot VARJE val i listan, så ett foto för en kombination kostar en länk i färgen och en i storleken. Rapporten räknar länkar per val och märker de
     som går över 15, och bygg-agare.py vägrar bygga en plan över 15. Släpp i så fall ett foto till bara färgen (eller bara storleken) eller ta bort det ur listan.

☠️ Planen är ett förslag. Kör bygg-agare.py med --torr, läs `kombinationer` (butikens vy, första bild och Wix variantbild per kombination) och titta på bilderna
innan något skrivs. Skrivningen går utanför Aosoms synkfönster (xx:12–xx:29 UTC vid 00, 03, 06, 09, 12, 15, 18 och 21), och variantbild-farg.js följer efter varje skrivning.
"""
import importlib.util
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
MAX_LANKAR_PER_VAL = 15  # Wix: högst 15 länkade bilder per val (mätt 2026-10-24, lärdom 217). Galleriets tak är ett annat tal (50, lib/wix/limits.ts).


def ladda_kk():
    sp = importlib.util.spec_from_file_location("kk", os.path.join(HERE, "katalogkontroll-tva-axlar-bilder.py"))
    kk = importlib.util.module_from_spec(sp)
    sp.loader.exec_module(kk)
    return kk


def norm(s):
    return str(s).strip().lower()


def rektangel(S, kombinationer, farger, storlekar):
    """Det minsta ägarvalet vars effekt (färger × storlekar bland sidans kombinationer) är exakt S, eller None.

    S och kombinationer är mängder av (färg, storlek). Svar: (färger eller None, storlekar eller None), där None betyder att axeln utelämnas
    (alla). (None, None) är ett gemensamt foto."""
    C = {c for c, _ in S}
    Z = {z for _, z in S}

    def effekt(cs, zs):
        return {(c, z) for (c, z) in kombinationer if (cs is None or c in cs) and (zs is None or z in zs)}

    for cs, zs in ((None, None), (C, None), (None, Z), (C, Z)):
        if effekt(cs, zs) == set(S):
            return (None if cs is None or cs == set(farger) else cs), (None if zs is None or zs == set(storlekar) else zs)
    return None


def agare_namn(rekt, farg_namn, storlek_namn, full=None):
    """Planens värde för en rektangel: '-' (gemensam), ett namn eller en lista namn. Namnen i listan ligger i sidans val-ordning.

    `full` = (färger, storlekar) ger båda dimensionerna explicit även när en av dem täcker alla: ett foto som länkas i båda optionerna räknas som två
    kopplingar i butikens uträkning av första bild (lib/variant-price.ts), ett foto som länkas i en option som en. Feedens första foto för en kombination
    ska kunna bli kombinationens första bild, och då ska det ha två."""
    cs, zs = full if full else rekt
    namn = [n for n in farg_namn if cs and n in cs] + [n for n in storlek_namn if zs and n in zs]
    if not namn:
        return "-"
    return namn[0] if len(namn) == 1 else namn


def lankar_per_val(agare):
    """Antal foton som planen länkar per val. Ett foto med en ägarlista räknas mot varje val i listan; '-' (gemensamt) räknas mot inget."""
    antal = {}
    for v in agare.values():
        if v == "-":
            continue
        for n in ([v] if isinstance(v, str) else v):
            antal[n] = antal.get(n, 0) + 1
    return antal


def flata_kopplingar(kopp):
    """imageKopplingar-posten (en lista per option) som planens ägarvärde, eller '-' utan koppling."""
    if not kopp:
        return "-"
    namn = []
    for grupp in kopp:
        for n in grupp:
            if n not in namn:
                namn.append(n)
    return namn[0] if len(namn) == 1 else namn


def bygg(id8, galleri, slug, d):
    ax = d["variantAxes"]
    farg_ax = next((a for a in ax if re.search(r"färg|color|kulör", a["name"], re.I)), None)
    stor_ax = next((a for a in ax if a is not farg_ax), None)
    if farg_ax is None or stor_ax is None or len(ax) != 2:
        sys.exit("%s: sidan har inte exakt en färgoption och en annan option (%s)" % (id8, [a["name"] for a in ax]))
    farg_namn = [c["label"] for c in farg_ax["choices"]]
    stor_namn = [c["label"] for c in stor_ax["choices"]]
    # Etiketter hos Aosom-underlaget mot sidans etiketter (skiftlägesokänsligt).
    farg_av = {norm(n): n for n in farg_namn}
    stor_av = {norm(n): n for n in stor_namn}
    kombo = set()
    for v in d["variantTable"]:
        kombo.add((v["choices"][farg_ax["name"]], v["choices"][stor_ax["name"]]))
    g = galleri[id8]
    fax_foerst = g["axlar"][0]  # underlaget har paren som [färg, storlek] eller [storlek, färg]: se axlar
    forsta_foton = set(g["pos1"].values())
    agare, behaller, rekt_lista = {}, [], {}
    hex6_gal = {}
    for f in d["gal"]:
        hex6_gal.setdefault(f.split("_")[1][:6], []).append(f)
    for h, fl in hex6_gal.items():
        if len(fl) != 1:
            sys.exit("%s: hex6 %s ger %d träffar i galleriet" % (id8, h, len(fl)))
    for f in d["gal"]:
        h = f.split("_")[1][:6]
        nuvarande = flata_kopplingar((d["imageKopplingar"] or {}).get(f))
        gamla = g["gamla_foton"].get(h)
        if gamla is None:
            agare[h] = nuvarande
            continue
        S = set()
        for a, b in gamla:
            c, z = (a, b) if re.search(r"färg|color|kulör", fax_foerst, re.I) else (b, a)
            if norm(c) not in farg_av or norm(z) not in stor_av:
                sys.exit("%s: Aosom-underlagets etikett %r/%r finns inte på sidan" % (id8, c, z))
            S.add((farg_av[norm(c)], stor_av[norm(z)]))
        rekt = rektangel(S, kombo, farg_namn, stor_namn)
        if rekt is None:
            agare[h] = nuvarande
            behaller.append((h, sorted(S)))
            continue
        full = ({c for c, _ in S}, {z for _, z in S}) if h in forsta_foton else None
        agare[h] = agare_namn(rekt, farg_namn, stor_namn, full)
        rekt_lista[h] = rekt
    # ordning: feedens första foto per kombination först i färgens lista, i storleksordningen som huvudbilden börjar med.
    pos1 = {}
    for nyckel, h in g["pos1"].items():
        a, b = nyckel.split("|")
        c, z = (a, b) if re.search(r"färg|color|kulör", fax_foerst, re.I) else (b, a)
        pos1[(farg_av[norm(c)], stor_av[norm(z)])] = h
    forsta_h = d["gal"][0].split("_")[1][:6]
    forsta_kombo = next((k for k, h in pos1.items() if h == forsta_h), None)
    stor_ordning = list(stor_namn)
    if forsta_kombo:
        stor_ordning.remove(forsta_kombo[1])
        stor_ordning.insert(0, forsta_kombo[1])
    # Färgens nuvarande första foto (variantAxes[färg].choices[].image) är Wix variantbild för färgens alla storlekar (varukorg, kassa, order). Är det feedens
    # första foto för någon av färgens kombinationer får det stå kvar först, så att varukorgens bild inte ändras av en omlänkning.
    nuvarande_forsta = {c["label"]: (c.get("image") or "") for c in farg_ax["choices"]}
    ordning = {}
    for fnamn in farg_namn:
        lista = [pos1[(fnamn, z)] for z in stor_ordning if (fnamn, z) in pos1 and (fnamn, z) in kombo]
        kvar = re.search(r"/media/b379ce_([0-9a-f]{6})", nuvarande_forsta.get(fnamn, ""))
        if kvar and kvar.group(1) in lista:
            lista = [kvar.group(1)] + [h for h in lista if h != kvar.group(1)]
        if lista:
            ordning[fnamn] = lista
    pid = re.search(r'"productId":"(%s[0-9a-f-]{28})"' % re.escape(id8), open(os.path.join(sys.argv[3], id8 + ".html"), encoding="utf-8").read().replace('\\"', '"'))
    if not pid:
        sys.exit("%s: hittar inte produktens fulla id i sidan" % id8)
    plan = {"id": pid.group(1), "slug": slug, "agare": agare, "tomt": [], "ordning": ordning}
    # Rapport: vy per kombination enligt planen (butikens regel med kopplingar), i galleriets ordning.
    def passar(h, c, z):
        v = agare[h]
        if v == "-":
            return True
        namn = [v] if isinstance(v, str) else v
        cs = [n for n in namn if n in farg_namn]
        zs = [n for n in namn if n in stor_namn]
        return (not cs or c in cs) and (not zs or z in zs)
    vyer = {}
    for (c, z) in sorted(kombo):
        vyer[(c, z)] = [h for h in (f.split("_")[1][:6] for f in d["gal"]) if passar(h, c, z)]
    return plan, vyer, behaller, pos1, farg_namn, stor_namn


def sjalvprov():
    kombo = {(c, z) for c in ("Svart", "Silver") for z in ("30", "42", "50")}
    F, Z = ["Svart", "Silver"], ["30", "42", "50"]
    assert rektangel({("Svart", "50")}, kombo, F, Z) == ({"Svart"}, {"50"})
    assert rektangel({("Svart", z) for z in Z}, kombo, F, Z) == ({"Svart"}, None)
    assert rektangel({(c, "42") for c in F}, kombo, F, Z) == (None, {"42"})
    assert rektangel(kombo, kombo, F, Z) == (None, None)
    assert rektangel({("Svart", "30"), ("Silver", "50")}, kombo, F, Z) is None, "en diagonal är ingen rektangel"
    assert rektangel({("Svart", "30"), ("Svart", "42"), ("Silver", "30")}, kombo, F, Z) is None, "ett L är ingen rektangel"
    assert rektangel({("Svart", "30"), ("Svart", "42"), ("Silver", "30"), ("Silver", "42")}, kombo, F, Z) == (None, {"30", "42"})
    # En kombination som sidan inte har ingår inte i rektangeln: Silver finns bara i 30 och 42.
    delvis = {("Svart", "30"), ("Svart", "42"), ("Svart", "50"), ("Silver", "30"), ("Silver", "42")}
    assert rektangel({("Svart", "30"), ("Silver", "30")}, delvis, F, Z) == (None, {"30"})
    assert rektangel({("Svart", "50")}, delvis, F, Z) == (None, {"50"}), "50 finns bara i Svart: samma som alla Svart i 50"
    assert agare_namn((None, None), F, Z) == "-"
    assert agare_namn(({"Svart"}, {"50"}), F, Z) == ["Svart", "50"]
    assert agare_namn(({"Svart"}, None), F, Z) == "Svart"
    assert agare_namn((None, {"30", "42"}), F, Z) == ["30", "42"]
    assert agare_namn((None, {"50"}), F, Z, ({"Svart"}, {"50"})) == ["Svart", "50"], "feedens första foto får explicita ägare i båda optionerna"
    assert agare_namn(({"Svart"}, None), F, Z, ({"Svart"}, {"30", "42", "50"})) == ["Svart", "30", "42", "50"]
    assert lankar_per_val({"a": "-", "b": "Svart", "c": ["Svart", "50"], "d": ["50", "Silver"]}) == {"Svart": 2, "50": 2, "Silver": 1}
    assert flata_kopplingar(None) == "-"
    assert flata_kopplingar([["Svart"]]) == "Svart"
    assert flata_kopplingar([["50 liter"], ["Svart"]]) == ["50 liter", "Svart"]
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
    kat, ut = sys.argv[3], sys.argv[4]
    os.makedirs(ut, exist_ok=True)
    kk = ladda_kk()
    for id8 in sys.argv[5].split(","):
        d = kk.sidodata(kat, id8)
        if d is None:
            sys.exit("%s: sidan saknar data (hämtades den?)" % id8)
        if d["imageKopplingar"] is None:
            sys.exit("%s: sidans data saknar imageKopplingar (butiksändringen är inte ute)" % id8)
        plan, vyer, behaller, pos1, farg_namn, stor_namn = bygg(id8, galleri, slugs[id8], d)
        fil = os.path.join(ut, "agare-%s.json" % id8)
        json.dump([plan], open(fil, "w", encoding="utf-8"), ensure_ascii=False)
        print("%s  %s  → %s" % (id8, plan["slug"], fil))
        n_andrade = 0
        for f in d["gal"]:
            h = f.split("_")[1][:6]
            nu = (d["imageKopplingar"] or {}).get(f)
            ny = plan["agare"][h]
            if flata_kopplingar(nu) != ny:
                n_andrade += 1
        print("  %d av %d foton får ny ägare; %d behåller sina länkar för att Aosoms kombinationer inte bildar en rektangel" % (n_andrade, len(d["gal"]), len(behaller)))
        for h, S in behaller:
            print("    behålls %s: Aosom visar den under %s" % (h, "; ".join("%s × %s" % k for k in S)))
        for (c, z), v in sorted(vyer.items()):
            forsta = pos1.get((c, z))
            tecken = ""
            if len(v) < 4:
                tecken += "  ☠️ UNDER FYRA BILDER"
            if forsta and forsta not in v:
                tecken += "  ☠️ feedens första foto ingår inte i vyn"
            print("  %-10s × %-10s %2d foton, feedens första %s%s" % (c, z, len(v), forsta, tecken))
        print("  ordning:", json.dumps(plan["ordning"], ensure_ascii=False))
        antal = lankar_per_val(plan["agare"])
        print("  länkade foton per val:", ", ".join("%s %d" % (n, antal.get(n, 0)) for n in farg_namn + stor_namn))
        for n in farg_namn + stor_namn:
            if antal.get(n, 0) > MAX_LANKAR_PER_VAL:
                print("  ☠️ ÖVER %d LÄNKAR: %s har %d (Wix tar högst %d länkade bilder per val, skrivningen får 400)" % (MAX_LANKAR_PER_VAL, n, antal[n], MAX_LANKAR_PER_VAL))


if __name__ == "__main__":
    main()
