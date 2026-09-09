# -*- coding: utf-8 -*-
"""Runda 108 — grinden som körs FÖRE någon text når Wix.

Runda 64 mätte skillnaden: 9 fel inline mot 0 via fil + grind. Grinden tar noll
sekunder; en felstavning som når kunden syns bara vid en återläsning, för
PATCH-svaret ekar tillbaka exakt det man skickade.

☠️ RUNDANS EGNA REGLER — två löften som INTE går att hålla, och som därför
   aldrig får skrivas:

   1. **Den är ingen barriär.** En fristående vikskärm står genom att vinklas
      och är inte förankrad i något. Ord som lovar att den stänger inne eller
      håller emot ska fällas — även när meningen i övrigt är sann.
   2. **Den mörklägger inte.** Väven är öppen; foton visar ljus rakt igenom.
      "Mörklägger", "ogenomskinlig" och "blockerar ljus" är påståenden om en
      annan produkt.

   Båda kommer ur Steg 2, och båda är formulerade som EGENSKAPER i texten —
   inte som en varningslista (Leonards regel 2026-08-14).

☠️ OCH MATERIALET MÅSTE NÄMNA POLYPROPEN. Importens svenska spec-block skriver
   bara `Kiefernholz`, alltså ramen. Väven är det kunden ser och köper. Grinden
   kräver ordet, så importfelet inte kan överleva in i den polerade texten.
"""
import os, re, sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import grindar as G                                     # noqa: E402
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import texter as T                                      # noqa: E402
import matt                                             # noqa: E402

# Talen varje storlek FÅR bära, ur leverantörens spec-block i matt.py.
GEMENSAM = {"40", "1,6", "170", "6,5", "3", "43", "173"}
STORLEKSTAL = {
    4: {"160", "9", "6,4", "6", "4"},
    6: {"240", "15", "12,5", "7,9", "6"},
    8: {"320", "21", "16", "9,6", "9,65", "8", "18,5"},
}
TAL = {k: GEMENSAM | STORLEKSTAL[v[0]] for k, v in T.PRODUKTER_IN.items()}
SLUG_TILL_NYCKEL = {T.slug_av(v[0], v[2]): k for k, v in T.PRODUKTER_IN.items()}

# ☠️ Familjens EGEN tyska ordlista. `Holz` och `Metall` står INTE här: de är
#    svenska ord med annan betydelse respektive stavas likadant, och runda 55
#    lärde att ett svenskt ord i listan fäller varenda korrekt sida.
TYSKA_HAR = [
    "raumtrenner", "raumteiler", "paravent", "trennwand", "sichtschutz",
    "kiefernholz", "polypropylen-gewebe", "webmuster", "metallscharnier",
    "faltbar", "gefaltete", "gesamtabmessungen", "einzelpaneel", "fußhöhe",
    "abmessungen", "lieferumfang", "montage", "wohnzimmer", "freistehend",
    "geschwungene", "haltbarkeit", "privatsphäre",
]

TALMONSTER = re.compile(r"\d+(?:,\d+)?")
MJUKT_BINDESTRECK = "­"
FAQ_IHOP = re.compile(r'<p><strong>[^<]*\?</strong></p>(?!<p>)')
H2_ORENT = re.compile(r"<h2>\s*<")
RELATIV_LANK = re.compile(r'href="(?!https://www\.fyndplats\.se/)')
KOMMALISTA = re.compile(r"\d+(?:,\d+)?, \d+(?:,\d+)? (och|eller) \d+\s*(cm|mm|m|kg|°|m²)")
PUNKTDECIMAL = re.compile(r"\b\d+\.\d+\b")
XKRYSS = re.compile(r"\d\s*[x*]\s*\d")

# ── Rundans två löftesgrindar ────────────────────────────────────────────────
# ☠️ Mönstren letar efter LÖFTET, inte efter ett enskilt ord. "barriär" står i
#    texten som en NEKANDE mening ("är en avskärmning, inte en barriär"), och
#    en ordlista hade fällt den. Därför krävs ett påstående-verb intill.
BARRIAR = re.compile(
    r"(stänger?\s+(inne|ute)\s+(barn|djur|husdjur)"
    r"|håller?\s+(barn|djur|husdjur)\s+(borta|inne|ute)"
    r"|fungerar\s+som\s+(en\s+)?(barriär|grind|skydd)"
    r"|barnsäker|djursäker)", re.I)
# ☠️ MÖRKLÄGGNINGEN DELAS I TVÅ MÖNSTER, och det är inte kosmetik.
#    Sidans egen H2 heter "Skymmer insyn, mörklägger inte" och brödtexten
#    säger "ett dåligt mörkläggningsdraperi". Ett rent ordmönster fällde båda
#    — samma falsklarm som runda 56:s `re·gelb·undet`, och samma medicin som
#    BARRIÄR redan har: leta efter LÖFTET, inte efter ordet.
#
#    Uppdelningen är däremot INTE utbytbar mot "hoppa över allt som står nära
#    ett 'inte'". Arm två bär `släpper inte igenom ljus` — själva löftet
#    innehåller alltså ordet, och en gemensam nekandevakt hade avväpnat
#    grinden med sitt eget undantag. Bara ORDformerna får nekas; FRASerna
#    fälls ovillkorligt.
MORKLAGG_ORD = re.compile(r"(mörklägg\w*|ogenomskinlig\w*|helt\s+tät\w*)", re.I)
MORKLAGG_FRAS = re.compile(
    r"(blockerar\s+(ljus|solljus)"
    r"|släpper\s+inte\s+igenom\s+(något\s+)?ljus)", re.I)
# ☠️ Nekandet mäts på GRANNORDET, inte på meningen. "Väven mörklägger rummet
#    helt och släpper inte in damm" bär ett 'inte' längre bort i samma mening
#    och hade sluppit förbi en meningsvid vakt — löftet står kvar.
NEKANDE_EFTER = {"inte", "aldrig"}
NEKANDE_FORE = {"dålig", "dåligt", "dåliga", "ingen", "inget", "inga", "utan"}


def morklaggningslofte(txt):
    """Första ONEKADE mörkläggningspåståendet, eller None."""
    for m in MORKLAGG_FRAS.finditer(txt):
        return m
    for m in MORKLAGG_ORD.finditer(txt):
        fore = re.findall(r"[\wåäöÅÄÖ]+", txt[:m.start()])
        efter = re.findall(r"[\wåäöÅÄÖ]+", txt[m.end():m.end() + 40])
        if fore and fore[-1].lower() in NEKANDE_FORE:
            continue
        if efter and efter[0].lower() in NEKANDE_EFTER:
            continue
        return m
    return None
# ☠️ Utomhus: familjen är obehandlad tall och väv utan UV-skydd. Texten SÄGER
#    "inomhus" och "i regn inte", så grinden får inte fälla på ordet självt.
UTOMHUSLOFTE = re.compile(
    r"(väderbeständig\w*|tål\s+(regn|väder|sol)|för\s+utomhusbruk"
    r"|kan\s+stå\s+ute\b|utomhusskärm)", re.I)
MATERIALORD = "polypropen"


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
        fel.append("titel identisk med namn — storefronten renderar då mallen")

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

    # ── Rundans egna regler ──────────────────────────────────────────────────
    for etikett, sok in (("BARRIÄRLÖFTE", BARRIAR.search),
                         ("MÖRKLÄGGNINGSLÖFTE", morklaggningslofte),
                         ("UTOMHUSLÖFTE", UTOMHUSLOFTE.search)):
        m = sok(txt)
        if m:
            i = max(0, m.start() - 70)
            fel.append(f"{etikett}: …{txt[i:m.end() + 70]}…")
    if MATERIALORD not in txt.lower():
        fel.append(f"materialet nämner inte {MATERIALORD!r} — importfelet lever kvar")

    # ── Zonindelad talgrind ──────────────────────────────────────────────────
    # ☠️ EN KORSHÄNVISNING PRÖVAS MOT MÅLETS FACIT, inte bara mot sidans eget.
    #    `dela_pa_ankare` skriver det rakt ut i sin egen docstring — "anroparen
    #    får pröva mot unionen av deras facit" — och den här grinden gjorde det
    #    inte. Meningen "samma vit i 320 cm" på 160-sidan bär då ett tal som är
    #    korrekt om SYSKONET och ohärlett om sidan, och 320 är just det tal som
    #    gör länken meningsfull. Att i stället stryka talet ur länktexten hade
    #    lagat grinden genom att göra texten sämre.
    #
    #    ☠️ Ett OKÄNT mål vidgar ingenting. Facit saknas då, och en tyst
    #    vidgning hade betytt att varje tal passerar i just den mening där
    #    ingen kan kontrollera det.
    egna, kors = G.dela_pa_ankare(html)
    tillatna = TAL[nyckel]
    zoner = [(tillatna, m) for m in egna]
    for mal, mening in kors:
        vidgad = set(tillatna)
        for slug in mal:
            if slug in SLUG_TILL_NYCKEL:
                vidgad |= TAL[SLUG_TILL_NYCKEL[slug]]
            else:
                fel.append(f"korshänvisning till okänd slug {slug!r} — inget facit att pröva mot")
        zoner.append((vidgad, mening))
    for facit, mening in zoner:
        for tal in TALMONSTER.findall(mening):
            if tal not in facit:
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
    """Grinden ska fälla exakt de löften rundan finns för att inte ge."""
    prov = [
        ("barriärlöfte", "<p>Skärmen stänger inne barn på ett säkert sätt.</p>", "BARRIÄRLÖFTE"),
        ("barnsäker", "<p>Konstruktionen är barnsäker rakt igenom.</p>", "BARRIÄRLÖFTE"),
        ("mörkläggning", "<p>Väven mörklägger rummet helt.</p>", "MÖRKLÄGGNINGSLÖFTE"),
        ("ogenomskinlig", "<p>Panelen är ogenomskinlig.</p>", "MÖRKLÄGGNINGSLÖFTE"),
        ("utomhuslöfte", "<p>Skärmen är väderbeständig året om.</p>", "UTOMHUSLÖFTE"),
        ("husmärke", "<p>En rumsavdelare från Outsunny.</p>", "husmärke"),
        ("artikelnummer", "<p>Rumsavdelare 845-030CG i väv.</p>", "artikelnummer"),
        ("ohärlett tal", "<p>Skärmen är 999 cm bred.</p>", "ohärlett tal"),
        ("tyskt ord", "<p>En Sichtschutz för vardagsrummet.</p>", "tyskt ord"),
        ("punktdecimal", "<p>Panelen är 1.6 cm djup.</p>", "punktdecimal"),
    ]
    nyckel = "5f14c112"
    original = T.PRODUKTER[nyckel]["html"]
    ok = True
    for namn, tillagg, vantat in prov:
        # ☠️ MUTERA GENOM ATT LÄGGA TILL, inte byta ut. Ett utbyte tar bort ett
        #    uppmätt värde och då fäller en ANNAN grind först — runda 107:s
        #    lärdom: läs meddelandet, inte bara utfallet.
        T.PRODUKTER[nyckel]["html"] = original + tillagg
        traff = [f for f in granska(nyckel, T.PRODUKTER[nyckel]) if vantat in f]
        T.PRODUKTER[nyckel]["html"] = original
        print("  %-16s %s" % (namn, "fälls ✓" if traff else "SLÄPPS IGENOM ✗"))
        ok = ok and bool(traff)
    # ── Och de som INTE får fällas ───────────────────────────────────────────
    # ☠️ Ett falsklarm är lika illa som ett missat fel: båda slutar med att
    #    mottagaren slutar läsa. Sidans EGNA nekande meningar prövas därför
    #    lika hårt som löftena — de är rundans faktiska text, inte påhitt.
    T.PRODUKTER[nyckel]["html"] = original
    falskt = [f for f in granska(nyckel, T.PRODUKTER[nyckel])]
    ren = True
    for etikett, vantat in (("nekad barriär", "BARRIÄR"),
                            ("nekad mörkläggning", "MÖRKLÄGGNING"),
                            ("nekat utomhus", "UTOMHUS")):
        traff = [f for f in falskt if vantat in f]
        print("  %-18s %s" % (etikett, "släpps ✓" if not traff else "FALSKLARM ✗ " + traff[0][:70]))
        ren = ren and not traff
    # Och en till åt andra hållet: ett ONEKAT löfte längre bort i samma mening
    # får inte slippa förbi bara för att meningen råkar bära ett "inte".
    T.PRODUKTER[nyckel]["html"] = original + (
        "<p>Väven mörklägger rummet helt och tappar inte formen.</p>")
    traff = [f for f in granska(nyckel, T.PRODUKTER[nyckel]) if "MÖRKLÄGGNING" in f]
    T.PRODUKTER[nyckel]["html"] = original
    print("  %-18s %s" % ("löfte + fjärran inte", "fälls ✓" if traff else "SLÄPPS IGENOM ✗"))
    return ok and ren and bool(traff)


if __name__ == "__main__":
    print("=== självtest ===")
    if not sjalvtest():
        raise SystemExit("grinden fångar inte allt den ska")
    print("\n=== grind ===")
    fel_totalt, skus = 0, {}
    for k, d in T.PRODUKTER.items():
        fel = granska(k, d)
        fel_totalt += len(fel)
        skus.setdefault(d["sku"], []).append(k)
        print("%s  %-9s %-30s %5d tecken  %s"
              % ("OK " if not fel else "FEL", k, d["sku"], len(d["html"]), d["slug"]))
        for f in fel:
            print("      ✗", f)
    krock = {s: v for s, v in skus.items() if len(v) > 1}
    if krock:
        print("\n☠️ SKU-KROCK:", krock)
    print("\n%d produkter, %d unika SKU:er, %d fel"
          % (len(T.PRODUKTER), len(skus), fel_totalt + len(krock)))
    raise SystemExit(1 if fel_totalt or krock else 0)
