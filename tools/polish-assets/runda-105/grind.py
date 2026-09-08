# -*- coding: utf-8 -*-
"""Runda 105 — grinden som körs FÖRE någon text når Wix.

Runda 64 mätte skillnaden: 9 fel inline mot 0 via fil + grep-grind. Grinden tar
noll sekunder; en felstavning som når kunden syns bara vid en återläsning, för
PATCH-svaret ekar tillbaka exakt det man skickade.

Kör: python3 tools/polish-assets/runda-105/grind.py
"""
import os, re, sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import grindar as G                                     # noqa: E402
sys.path.insert(0, os.path.dirname(__file__))
import texter as T                                      # noqa: E402

# ── Talen varje modell FÅR bära. Härledda ur leverantörens egna mått (lästa i
#    Wix 2026-09-08) plus SJVFS 2019:15 bilaga 1:7. Inget tal är hämtat ur en bild.
L80_REF = {"2019", "15", "80"}                          # normens egen beteckning
A_TAL = {"91", "60,5", "32", "0,48", "29", "56", "57", "28", "21", "20",
         "8,9", "99", "65,5", "8,5", "0,3", "25", "15", "0,5"}
C_TAL = {"104", "53", "82", "0,46", "36", "49", "33", "58", "18", "94",
         "100", "20", "3", "12,5", "108", "16,5", "0,3", "25", "15", "0,5"}
F_TAL = {"120", "50", "40", "116", "46", "0,53", "31", "41,5", "20", "15",
         "70", "13", "129", "57", "15,5", "0,5", "30", "1,1"}
G_TAL = {"81", "48", "31,5", "0,33", "30", "44", "44,5", "28", "16", "22,5",
         "46,5", "43,5", "32", "25", "4,5", "26", "9,5", "89", "55", "19",
         "0,3", "15", "0,5"}
TAL = {**{k: A_TAL for k in T.A_FARGER}, **{k: C_TAL for k in T.C_FARGER},
       "1f6de209": F_TAL, "609bec0f": G_TAL}
for _k in TAL:
    TAL[_k] = TAL[_k] | L80_REF

# ☠️ G.TYSKA är byggd ur möbelfamiljerna och innehåller inte ETT ord ur den här
#    källtexten. En delad ordlista som inte täcker familjen är en grind som är
#    grön av fel skäl — samma fälla som runda 104:s egna grind utan 80-taket.
TYSKA_HAR = [
    "schildkröte", "schildkroten", "gehege", "kleintier", "käfig", "kafig",
    "haupthaus", "haupthäuser", "reptilienbox", "tannenholz", "fichtenholz",
    "kunststoff", "lampenhalter", "deckel", "zwei", "sonnenbereich",
    "laufkäfig", "laufkafig", "maschendraht", "acrylfenster", "bodenlos",
    "abmessungen", "farbe", "gewicht", "montage", "lieferumfang", "geeignet",
]

TALMONSTER = re.compile(r"\d+(?:,\d+)?")
MJUKT_BINDESTRECK = "­"
FAQ_IHOP = re.compile(r'<span style="font-weight: 700">[^<]*\?</span>(?!</p>)')
H2_ORENT = re.compile(r"<h2>\s*<")
RELATIV_LANK = re.compile(r'href="(?!https://www\.fyndplats\.se/)')
KOMMALISTA = re.compile(r"\d+\s*,\s*\d+\s+och\s+\d+\s*(cm|mm|m|kg|°)")
PUNKTDECIMAL = re.compile(r"\b\d+\.\d+\b")
XKRYSS = re.compile(r"\d\s*[x*]\s*\d")                  # ska vara × med mellanslag


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

    # ── SKU:n avgörs av SLUGGEN, och avgjordes alltså redan i Steg 1.
    #    ☠️ buildSku bryter på hel-ordsgräns vid 24 tecken och tappar hela sista
    #       token TYST. I runda 62 blev tre färgsyskon till två SKU:er på det.
    #       Kravet här är hårdare än "svansen måste överleva": INGET token får
    #       falla bort. Då kan frågan "var det tokenet det skiljande?" aldrig
    #       ställas fel, och sluggen kortas i stället — gratis på ett utkast.
    bas = G.sku_bas(d["slug"])
    d["sku"] = "FP-" + bas
    kvar = [t for t in d["slug"].split("-") if t not in G.FOGEORD]
    if bas.split("-") != kvar:
        tappade = [t for t in kvar if t not in bas.split("-")]
        fel.append(f"SKU tappar {tappade} — korta sluggen: FP-{bas}")
    return fel


def sjalvtest():
    """En grind som aldrig fällt något har inte bevisat att den biter."""
    bas = T.PRODUKTER["609bec0f"]
    prov = [
        ("tyskt ord", {"html": bas["html"].replace("Två rum", "Zwei rum")}, "tyskt ord"),
        ("husmärke", {"meta": bas["meta"] + " PawHut."}, "husmärke"),
        ("land", {"meta": bas["meta"] + " Skickas från Tyskland."}, "lagerland"),
        ("attribution", {"html": bas["html"].replace(
            "Trät är vattenfast lackat", "Leverantören anger att trät är lackat")},
         "leverantörsattribution"),
        ("ohärlett tal", {"html": bas["html"].replace("0,33 m²", "0,73 m²")}, "ohärlett tal"),
        ("punktdecimal", {"html": bas["html"].replace("9,5 kg", "9.5 kg")}, "punktdecimal"),
        ("mjukt bindestreck", {"html": bas["html"].replace("sköldpaddshus", "sköldpadds­hus", 1)},
         "mjukt bindestreck"),
        ("för långt namn", {"namn": "S" * 81}, "taket är 80"),
        ("titel = namn", {"titel": bas["namn"], "namn": bas["namn"]}, "identisk med namn"),
        ("relativ länk", {"html": bas["html"] + '<p><a href="/produkt/x">x</a></p>'}, "relativ länk"),
        ("orent h2", {"html": bas["html"].replace(
            "<h2>Vanliga frågor</h2>", '<h2><span style="font-weight: 700">Vanliga frågor</span></h2>')},
         "saknar <h2>Vanliga frågor</h2>"),
        ("gångertecken", {"html": bas["html"].replace("81 × 48", "81 x 48")}, "gångertecken"),
    ]
    misslyckade = []
    for etikett, mutation, vantat in prov:
        d = dict(bas); d.update(mutation)
        if not any(vantat in f for f in granska("609bec0f", d)):
            misslyckade.append(f"{etikett}: grinden såg INGENTING (väntade {vantat!r})")
    ren = granska("609bec0f", dict(bas))
    if ren:
        misslyckade.append(f"orörd text fälldes: {ren}")
    return misslyckade


if __name__ == "__main__":
    brister = sjalvtest()
    if brister:
        print("SJÄLVTESTET FALLER — grinden bevisar ingenting:")
        for b in brister:
            print("  ✗", b)
        sys.exit(2)
    print(f"självtest: {12} mutationer fångade, orörd text släpps igenom\n")

    total = 0
    sedda = {}
    for nyckel, d in T.PRODUKTER.items():
        fel = granska(nyckel, d)
        total += len(fel)
        status = "OK " if not fel else "FEL"
        print(f"{status} {nyckel}  {d['sku']:<28} {len(d['html']):>5} tecken  {d['slug']}")
        for f in fel:
            print("      ✗", f)
        if d["sku"] in sedda:
            total += 1
            print(f"      ✗ SKU-krock med {sedda[d['sku']]}: {d['sku']}")
        sedda[d["sku"]] = nyckel
    print(f"\n{len(T.PRODUKTER)} produkter, {len(sedda)} unika SKU:er, {total} fel")
    sys.exit(1 if total else 0)
