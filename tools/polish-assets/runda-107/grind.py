# -*- coding: utf-8 -*-
"""Runda 107 — grinden som körs FÖRE någon text når Wix.

Runda 64 mätte skillnaden: 9 fel inline mot 0 via fil + grep-grind. Grinden tar
noll sekunder; en felstavning som når kunden syns bara vid en återläsning, för
PATCH-svaret ekar tillbaka exakt det man skickade.

☠️ KANINREGELN ÄR EN ANNAN ÄN RUNDA 106:S, och det är med flit.
   Där fick ordet "kanin" bara stå i den rättsliga upplysningen, punkt. Här
   säljs stall som HETER Hasenstall, och en kund som söker på kaninstall landar
   på sidan. Att då tiga om frågan hjälper ingen. Regeln är därför:

       "kanin" får stå i upplysningen, och i en FAQ vars svar börjar med "Nej".
       Ingen annanstans.

   Det är en STRUKTURELL regel, inte en fras-uppräkning — runda 106:s första
   försök räknade upp fraser och missade sin egen testmutation.
"""
import os, re, sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import grindar as G                                     # noqa: E402
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import texter as T                                      # noqa: E402
import matt                                             # noqa: E402

L80_REF = {"2019", "15", "80"}
# L80:s egna tal: ytkraven, kortaste sidorna, höjderna och viktklassen
# 2–3,5 kg ur bilaga 1:3. Råttans 30 cm och marsvinets 40 cm ur 1:4.
NORM = {"0,30", "0,15", "40", "25", "50", "60", "30", "2", "3,5",
        "0,5"}   # 0,5 m² = L80:s ytkrav för en dvärgkanin

# Talen varje modell FÅR bära, härledda ur leverantörens spec-block i matt.py.
P_TAL = {"230", "53", "93,5", "70", "41", "32", "60", "48", "30", "26", "61",
         "14,8", "0,86", "32,2", "32,7", "94", "74,5", "17,5", "97", "76,5", "4"}
Q_TAL = {"141", "60", "86", "69", "54,5", "40", "62", "44", "29", "33", "14",
         "63", "49", "0,75", "16", "90", "73", "22,5", "4",
         "0,38"}   # dvärgkaninens restyta, l80-grinden
R_TAL = {"156", "58", "68", "80", "50", "56", "72", "26,5", "41,5", "20", "38",
         "25", "6,5", "8", "63", "15", "67,5", "48", "0,76", "16", "88", "24",
         "1,56", "4",
         "0,40"}   # dvärgkaninens restyta, l80-grinden
S_TAL = {"123,5", "62,6", "92,5", "53", "61", "58", "54", "54,5", "32", "63", "29",
         "22,4", "21,5", "22", "25,5", "50", "0,61", "16", "98", "62", "20", "3",
         "0,32"}   # dvärgkaninens restyta, l80-grinden
TAL = {**{k: P_TAL for k in T.P_FARGER}, "2253c509": Q_TAL,
       **{k: R_TAL for k in T.R_FARGER}, **{k: S_TAL for k in T.S_FARGER}}
for _k in TAL:
    TAL[_k] = TAL[_k] | L80_REF | NORM

# ☠️ G.TYSKA är byggd ur möbelfamiljerna. Orden nedan är de som FAKTISKT står i
#    den här familjens källtext — och inget av dem har en svensk tvilling, till
#    skillnad från runda 55:s Metall/Glas/Magnet.
TYSKA_HAR = [
    "hasenstall", "kaninchenstall", "kaninchenkäfig", "kaninchenkafig",
    "zwergkaninchen", "kleintierstall", "kleintierkäfig", "kleintierkafig",
    "freigehege", "bodenwanne", "meerschweinchen", "laufbox", "auslaufbox",
    # ☠️ "auslauf" saknades och "auslaufbox" täcker den inte — grinden matchar
    #    på PREFIX, så det längre ordet fångar aldrig det kortare. Familjens
    #    vanligaste tyska ord, hittat av alt-grindens självtest.
    "auslauf",
    "haupthaus", "hauptgehäuse", "tannenholz", "asphaltdach", "bitumendach",
    "abmessungen", "lieferumfang", "geeignet", "montage", "winterfest",
    "herausnehmbare", "aufklappbar", "futtertrog", "rampengröße", "gehege",
]

TALMONSTER = re.compile(r"\d+(?:,\d+)?")
MJUKT_BINDESTRECK = "­"
FAQ_IHOP = re.compile(r'<p><strong>[^<]*\?</strong></p>(?!<p>)')
H2_ORENT = re.compile(r"<h2>\s*<")
RELATIV_LANK = re.compile(r'href="(?!https://www\.fyndplats\.se/)')
KOMMALISTA = re.compile(r"\d+(?:,\d+)?, \d+(?:,\d+)? (och|eller) \d+\s*(cm|mm|m|kg|°|m²)")
PUNKTDECIMAL = re.compile(r"\b\d+\.\d+\b")
XKRYSS = re.compile(r"\d\s*[x*]\s*\d")
KANINORD = re.compile(r"kanin", re.I)
# Den obligatoriska frasen, som ETT literal — grinden och självtestet
# kan därför inte glida isär på ordföljden.
KRAVD_RAD = "säljs inte som kaninbostad"
# En FAQ vars svar börjar med "Nej" — den enda plats utöver upplysningen där
# ordet "kanin" får stå.
NEJ_FAQ = re.compile(r"<p><strong>[^<]*\?</strong></p><p>Nej\.[^<]*</p>")


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
        if re.search(rf"\b{re.escape(ord_)}", lag):
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
        fel.append(f"kommalista av tal: {KOMMALISTA.search(allt).group(0)}")
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

    # ── Rundans egen regel: kaninordet ───────────────────────────────────────
    if "SJVFS" not in html:
        fel.append("saknar den rättsliga upplysningen (SJVFS 2019:15)")
    # ☠️ Meddelandet CITERAR den obligatoriska frasen, så att självtestets
    #    förväntan och grindens villkor är samma literal. Ett första utkast
    #    skrev om den i löptext ("…om att stallet inte säljs som…") och
    #    självtestet föll på ordföljden, inte på grinden. Runbookens regel:
    #    läs MEDDELANDET, inte bara utfallet.
    if KRAVD_RAD not in html:
        fel.append(f"saknar den obligatoriska raden: {KRAVD_RAD!r}")
    kvar = NEJ_FAQ.sub("", html)                     # nej-svaren får nämna kanin
    for rad in re.findall(rf"<p>[^<]*{KRAVD_RAD}[^<]*</p>", kvar):
        kvar = kvar.replace(rad, "")                 # upplysningen likaså
    m = KANINORD.search(G.synlig_meningstext(kvar))
    if m:
        i = max(0, m.start() - 70)
        fel.append("KANINLÖFTE — 'kanin' utanför upplysningen och nej-svaren: "
                   f"…{G.synlig_meningstext(kvar)[i:m.end() + 70]}…")

    # ── Zonindelad talgrind ──────────────────────────────────────────────────
    egna, kors = G.dela_pa_ankare(html)
    tillatna = TAL[nyckel]
    for mening in egna + [m2 for _mal, m2 in kors]:
        for tal in TALMONSTER.findall(mening):
            if tal not in tillatna:
                fel.append(f"ohärlett tal {tal!r} i: {mening[:90]}")
    for falt, text in (("namn", namn), ("titel", titel), ("meta", meta)):
        for tal in TALMONSTER.findall(text):
            if tal not in tillatna:
                fel.append(f"ohärlett tal {tal!r} i {falt}")

    # ── SKU:n avgörs av SLUGGEN ──────────────────────────────────────────────
    bas = G.sku_bas(d["slug"])
    d["sku"] = "FP-" + bas
    kvar_token = [t for t in d["slug"].split("-") if t not in G.FOGEORD]
    if bas.split("-") != kvar_token:
        tappade = [t for t in kvar_token if t not in bas.split("-")]
        fel.append(f"SKU tappar {tappade} — korta sluggen: FP-{bas}")
    return fel


def sjalvtest():
    """En grind som aldrig fällt något har inte bevisat att den biter."""
    bas = T.PRODUKTER["2253c509"]
    prov = [
        ("tyskt ord", {"html": bas["html"].replace("löpgård", "Freigehege", 1)}, "tyskt ord"),
        ("husmärke", {"meta": bas["meta"] + " PawHut."}, "husmärke"),
        ("land", {"meta": bas["meta"] + " Skickas från Tyskland."}, "lagerland"),
        ("attribution", {"html": bas["html"].replace(
            "Taket är klätt", "Leverantören anger att taket är klätt")},
         "leverantörsattribution"),
        ("ohärlett tal", {"html": bas["html"].replace("0,75 m²", "0,95 m²")}, "ohärlett tal"),
        ("punktdecimal", {"html": bas["html"].replace("54,5", "54.5", 1)}, "punktdecimal"),
        ("mjukt bindestreck", {"html": bas["html"].replace("smådjursstall", "smådjurs­stall", 1)},
         "mjukt bindestreck"),
        ("för långt namn", {"namn": "S" * 81}, "taket är 80"),
        ("titel = namn", {"titel": bas["namn"], "namn": bas["namn"]}, "identisk med namn"),
        ("relativ länk", {"html": bas["html"] + '<p><a href="/produkt/x">x</a></p>'}, "relativ länk"),
        ("gångertecken", {"html": bas["html"].replace("141 × 60", "141 x 60", 1)}, "gångertecken"),
        # ☠️ Kaninlöftet: ett POSITIVT påstående utanför upplysningen och nej-svaren.
        ("kaninlöfte i brödtext",
         {"html": bas["html"].replace("<h2>Så många marsvin",
                                      "<p>Stallet passar även kanin.</p><h2>Så många marsvin")},
         "KANINLÖFTE"),
        # ☠️ …och ett i ett FAQ-svar som INTE börjar med Nej — den varianten är
        #    hela skälet till att regeln är strukturell och inte en fras-lista.
        ("kaninlöfte i ja-svar",
         {"html": bas["html"].replace(
             "<p><strong>Vad väger det?</strong></p><p>16 kg.",
             "<p><strong>Passar det kanin?</strong></p><p>Ja, en kanin trivs bra.</p>"
             "<p><strong>Vad väger det?</strong></p><p>16 kg.")},
         "KANINLÖFTE"),
        ("upplysningen borta",
         {"html": bas["html"].replace("Stallet säljs inte som kaninbostad.", "")},
         "säljs inte som kaninbostad"),
    ]
    misslyckade = []
    for etikett, mutation, vantat in prov:
        d = dict(bas); d.update(mutation)
        traff = granska("2253c509", d)
        if not any(vantat in f for f in traff):
            misslyckade.append(f"{etikett}: grinden såg INGENTING (väntade {vantat!r})")
    ren = granska("2253c509", dict(bas))
    if ren:
        misslyckade.append(f"orörd text fälldes: {ren}")
    return misslyckade, len(prov)


if __name__ == "__main__":
    brister, n = sjalvtest()
    if brister:
        print("SJÄLVTESTET FALLER — grinden bevisar ingenting:")
        for b in brister:
            print("  ✗", b)
        sys.exit(2)
    print(f"självtest: {n} mutationer fångade, orörd text släpps igenom\n")

    total, sedda = 0, {}
    for nyckel, d in T.PRODUKTER.items():
        fel = granska(nyckel, d)
        total += len(fel)
        print(f"{'OK ' if not fel else 'FEL'} {nyckel}  {d['sku']:<30} "
              f"{len(d['html']):>5} tecken  {d['slug']}")
        for f in fel:
            print("      ✗", f)
        if d["sku"] in sedda:
            total += 1
            print(f"      ✗ SKU-krock med {sedda[d['sku']]}: {d['sku']}")
        sedda[d["sku"]] = nyckel
    print(f"\n{len(T.PRODUKTER)} produkter, {len(sedda)} unika SKU:er, {total} fel")
    sys.exit(1 if total else 0)
