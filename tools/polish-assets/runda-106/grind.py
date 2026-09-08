# -*- coding: utf-8 -*-
"""Runda 106 — grinden som körs FÖRE någon text når Wix.

Runda 64 mätte skillnaden: 9 fel inline mot 0 via fil + grep-grind. Grinden tar
noll sekunder; en felstavning som når kunden syns bara vid en återläsning, för
PATCH-svaret ekar tillbaka exakt det man skickade.

Kör: python3 tools/polish-assets/runda-106/grind.py
"""
import os, re, sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import grindar as G                                     # noqa: E402
sys.path.insert(0, os.path.dirname(__file__))
import texter as T                                      # noqa: E402

# ── Talen varje modell FÅR bära. Ur leverantörens egna mått (lästa i Wix
#    2026-09-08, se matt.py) plus SJVFS 2019:15 bilaga 1:3 och 1:4. Inget tal
#    är hämtat ur en bild.
L80_REF = {"2019", "15", "80"}                          # normens beteckning
KANIN_TAL = {"0,7", "60", "2", "3,5"}                   # KANINRADEN
MARSVIN_TAL = {"0,30", "0,15", "40", "25"}              # bilaga 1:4, marsvin

A_TAL = {"181", "100", "48", "1,81", "45", "11", "105", "49", "24", "12"}
B_TAL = {"125,5", "100", "49", "92", "78", "44,5", "0,72", "1,06", "88",
         "38,5", "37", "18", "26,5", "27", "39", "121,5", "15,7", "109",
         "57", "21,5", "1,5", "4"}
C_TAL = {"123", "120", "52", "1,48", "42,5", "47", "16", "22", "41", "34",
         "16,6", "127,5", "54", "18,5", "9"}
D_TAL = {"110", "105", "50", "13,5", "1,16", "48", "43,5", "42", "1,2",
         "12,5", "117", "57", "18", "7"}

TAL = {"a4c0595f": A_TAL, "7eebd0eb": A_TAL,
       "b54e7a23": B_TAL, "1f7ebf33": B_TAL,
       "edc81021": C_TAL, "117691b5": D_TAL}
for _k in TAL:
    TAL[_k] = TAL[_k] | L80_REF | KANIN_TAL | MARSVIN_TAL

# ☠️ G.TYSKA är byggd ur möbelfamiljerna. Den innehåller inte ETT ord ur den
#    här källtexten — en delad ordlista som inte täcker familjen är en grind som
#    är grön av fel skäl. Orden nedan är hämtade ur utkastens egna spec-block.
TYSKA_HAR = [
    "kleintier", "kleintierstall", "hasenstall", "kaninchenstall", "käfig",
    "kafig", "kaninchen", "zwergkaninchen", "meerschweinchen", "freigehege",
    "freilaufgehege", "laufbox", "auslaufbox", "haupthaus", "hauptgehäuse",
    "tannenholz", "kiefernholz", "bodenwanne", "gesamtmaße", "abmessungen",
    "farbe", "gewicht", "montage", "lieferumfang", "geeignet", "aufklappbar",
    "wetterbeständig", "winterfest", "bitumendach", "asphaltdach", "rampe",
    "tablett", "drahttür", "holztür", "stall", "gehege", "nagerstall",
]

TALMONSTER = re.compile(r"\d+(?:,\d+)?")
MJUKT_BINDESTRECK = "­"
FAQ_IHOP = re.compile(r'<span style="font-weight: 700">[^<]*\?</span>(?!</p>)')
H2_ORENT = re.compile(r"<h2>\s*<")
RELATIV_LANK = re.compile(r'href="(?!https://www\.fyndplats\.se/)')
KOMMALISTA = re.compile(r"\d+\s*,\s*\d+\s+och\s+\d+\s*(cm|mm|m|kg|°)")
PUNKTDECIMAL = re.compile(r"\b\d+\.\d+\b")
XKRYSS = re.compile(r"\d\s*[x*]\s*\d")                  # ska vara × med mellanslag

# ☠️ RUNDANS EGEN GRIND: ingen av sidorna får sälja produkten som kaninbostad.
#    L80-grinden ger noll av 39 en godkänd yta för en kanin på 2–3,5 kg. En
#    formulering som "plats för två kaniner" hade varit ett rättsligt fel som
#    inget av husets andra kontroller ser — de letar efter tyska ord och
#    ohärledda tal, inte efter ett påstående som är grammatiskt oklanderligt.
#    Regeln är hård och enkel i stället för listbaserad: ordet "kanin" får bara
#    förekomma i den sanktionerade upplysningen. Ett första utkast letade efter
#    fraser ("plats för", "räcker till") och missade sin egen provmutation
#    "räcker enligt L80 till tre kaniner" — mellanleden gjorde frasen osynlig.
#    En grind mot påståenden ska inte försöka räkna upp hur de kan formuleras.
KANINORD = re.compile(r"kanin", re.I)


def granska(nyckel, d):
    fel = []
    html, namn, titel, meta = d["html"], d["namn"], d["titel"], d["meta"]
    txt = G.synlig_meningstext(html)
    allt = " ".join([namn, titel, meta, txt])

    fel += G.granska_namn(namn)
    if len(titel) > 60:
        fel.append(f"seo-titel {len(titel)} tecken (max 60)")
    if len(meta) > 155:
        fel.append(f"meta {len(meta)} tecken (max 155)")
    if titel.strip() == namn.strip():
        fel.append("titel identisk med namn — storefronten renderar då mallen i stället")

    lag = allt.lower()
    for ord_ in list(G.TYSKA) + TYSKA_HAR:
        if re.search(rf"\b{re.escape(ord_)}\b", lag):
            fel.append(f"tyskt ord: {ord_}")
    for m in G.HUSMARKEN:
        if m in lag:
            fel.append(f"husmärke: {m}")
    for o in G.LANDORD:
        if re.search(rf"\b{re.escape(o)}\b", lag):
            fel.append(f"lagerland utskrivet: {o}")
    for f in G.LAGERFRAS:
        if f in lag:
            fel.append(f"lagerfras: {f}")
    for a in G.ATTRIBUTION:
        if re.search(rf"\b{re.escape(a)}\b", lag):
            fel.append(f"leverantörsattribution: {a}")
    if G.ARTNR.search(allt):
        fel.append(f"artikelnummer: {G.ARTNR.search(allt).group(0)}")
    if MJUKT_BINDESTRECK in allt:
        fel.append("mjukt bindestreck (U+00AD) i texten")
    if FAQ_IHOP.search(html):
        fel.append("FAQ-fråga sitter ihop med svaret — skriv två <p>")
    if H2_ORENT.search(html):
        fel.append("<h2> innehåller markup — flikdelningen faller")
    if RELATIV_LANK.search(html):
        fel.append("relativ länk — Wix gör https:/produkt/… av den")
    if KOMMALISTA.search(allt):
        fel.append("kommalista av tal med enheten sist — använd snedstreck")
    if PUNKTDECIMAL.search(allt):
        fel.append(f"punktdecimal: {PUNKTDECIMAL.search(allt).group(0)}")
    if XKRYSS.search(allt):
        fel.append(f"gångertecken ska vara × : {XKRYSS.search(allt).group(0)}")

    # ── rundans egen: inget kaninlöfte, och normen måste stå utskriven
    utan_upplysning = allt.replace(G.synlig_meningstext(T.KANINRADEN), "")
    m = KANINORD.search(utan_upplysning)
    if m:
        i = max(0, m.start() - 45)
        fel.append("KANINLÖFTE — 'kanin' utanför den rättsliga upplysningen: "
                   f"{utan_upplysning[i:m.end() + 45]!r}")
    if "SJVFS" not in html:
        fel.append("saknar den rättsliga upplysningen (SJVFS 2019:15)")
    if "säljs inte som kaninbostad" not in html:
        fel.append("saknar raden om att hagen inte säljs som kaninbostad")

    for rubrik in ("Tekniska specifikationer", "Användning och skötsel", "Vanliga frågor"):
        if f"<h2>{rubrik}</h2>" not in html:
            fel.append(f"saknar <h2>{rubrik}</h2>")
    antal_fragor = html.count("<p><strong>")
    if antal_fragor < 6:
        fel.append(f"bara {antal_fragor} FAQ-frågor (sikta på 6–8)")

    # ── Zonindelad talgrind: ett LÄNKAT tal får bara stå i länkens eget stycke.
    egna, kors = G.dela_pa_ankare(html)
    tillatna = TAL[nyckel]
    for mening in egna + [m for _mal, m in kors]:
        for tal in TALMONSTER.findall(mening):
            if tal not in tillatna:
                fel.append(f"ohärlett tal {tal!r} i: {mening[:90]}")
    for falt, text in (("namn", namn), ("titel", titel), ("meta", meta)):
        for tal in TALMONSTER.findall(text):
            if tal not in tillatna:
                fel.append(f"ohärlett tal {tal!r} i {falt}")

    # ── SKU:n avgörs av SLUGGEN. buildSku bryter på hel-ordsgräns vid 24 tecken
    #    och tappar hela sista token TYST; kravet här är att INGET token faller.
    bas = G.sku_bas(d["slug"])
    d["sku"] = "FP-" + bas
    kvar = [t for t in d["slug"].split("-") if t not in G.FOGEORD]
    if bas.split("-") != kvar:
        tappade = [t for t in kvar if t not in bas.split("-")]
        fel.append(f"SKU tappar {tappade} — korta sluggen: FP-{bas}")
    return fel


def sjalvtest():
    """En grind som aldrig fällt något har inte bevisat att den biter."""
    bas = T.PRODUKTER["117691b5"]
    prov = [
        ("tyskt ord", {"html": bas["html"].replace("Två vägar in", "Kleintier in")}, "tyskt ord"),
        ("husmärke", {"meta": bas["meta"] + " PawHut."}, "husmärke"),
        ("land", {"meta": bas["meta"] + " Skickas från Tyskland."}, "lagerland"),
        ("attribution", {"html": bas["html"].replace(
            "Stavavståndet är 1,2", "Leverantören anger att stavavståndet är 1,2")},
         "leverantörsattribution"),
        ("ohärlett tal", {"html": bas["html"].replace("1,16 m²", "1,96 m²")}, "ohärlett tal"),
        ("punktdecimal", {"html": bas["html"].replace("12,5 kg", "12.5 kg")}, "punktdecimal"),
        ("mjukt bindestreck", {"html": bas["html"].replace("smådjurshage", "smådjurs­hage", 1)},
         "mjukt bindestreck"),
        ("för långt namn", {"namn": "S" * 81}, "taket är 80"),
        ("titel = namn", {"titel": bas["namn"], "namn": bas["namn"]}, "identisk med namn"),
        ("relativ länk", {"html": bas["html"] + '<p><a href="/produkt/x">x</a></p>'}, "relativ länk"),
        ("orent h2", {"html": bas["html"].replace(
            "<h2>Vanliga frågor</h2>", '<h2><span style="font-weight: 700">Vanliga frågor</span></h2>')},
         "saknar <h2>Vanliga frågor</h2>"),
        ("gångertecken", {"html": bas["html"].replace("110 × 105", "110 x 105")}, "gångertecken"),
        # ── rundans egna tre
        ("kaninlöfte", {"html": bas["html"].replace(
            "räcker enligt L80 till sju marsvin", "räcker enligt L80 till tre kaniner")},
         "KANINLÖFTE"),
        ("normen struken", {"html": bas["html"].replace("SJVFS 2019:15, L80", "reglerna")},
         "saknar den rättsliga upplysningen"),
        ("kaninraden struken", {"html": bas["html"].replace(
            "Hagen säljs inte som kaninbostad.", "Hagen är rymlig.")},
         "saknar raden om att hagen inte säljs som kaninbostad"),
    ]
    misslyckade = []
    for etikett, mutation, vantat in prov:
        d = dict(bas); d.update(mutation)
        if not any(vantat in f for f in granska("117691b5", d)):
            misslyckade.append(f"{etikett}: grinden såg INGENTING (väntade {vantat!r})")
    ren = granska("117691b5", dict(bas))
    if ren:
        misslyckade.append(f"orörd text fälldes: {ren}")
    return misslyckade, len(prov)


if __name__ == "__main__":
    brister, antal_prov = sjalvtest()
    if brister:
        print("SJÄLVTESTET FALLER — grinden bevisar ingenting:")
        for b in brister:
            print("  ✗", b)
        sys.exit(2)
    print(f"självtest: {antal_prov} mutationer fångade, orörd text släpps igenom\n")

    total = 0
    sedda = {}
    for nyckel, d in T.PRODUKTER.items():
        fel = granska(nyckel, d)
        total += len(fel)
        status = "OK " if not fel else "FEL"
        print(f"{status} {nyckel}  {d['sku']:<30} {len(d['html']):>5} tecken  {d['slug']}")
        for f in fel:
            print("      ✗", f)
        if d["sku"] in sedda:
            total += 1
            print(f"      ✗ SKU-krock med {sedda[d['sku']]}: {d['sku']}")
        sedda[d["sku"]] = nyckel
    print(f"\n{len(T.PRODUKTER)} produkter, {len(sedda)} unika SKU:er, {total} fel")
    sys.exit(1 if total else 0)
