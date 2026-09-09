# -*- coding: utf-8 -*-
"""Runda 110 — grinden som körs FÖRE någon text når Wix.

Runda 64 mätte skillnaden: 9 fel inline mot 0 via fil + grind. Grinden tar noll
sekunder; en felstavning som når kunden syns bara vid en återläsning, för
PATCH-svaret ekar tillbaka exakt det man skickade.

Rundan ärver runda 108:s tre löftesgrindar oförändrade — de gäller varje
fristående vikskärm, oavsett vad väven är gjord av:

  1. **Ingen barriär.** Den står genom att vinklas och är inte förankrad.
  2. **Ingen mörkläggning.** Väven är öppen; fotona visar ljus rakt igenom.
  3. **Inte utomhus.** Obehandlat trä och bambu utan UV-skydd.

☠️ OCH TRE EGNA, alla ur Steg 5 i den här rundan:

  4. **MATERIALORDET ÄR OLIKA PER GRUPP.** Importens svenska spec-block tog
     FÖRSTA materialet ur leverantörens lista och tappade resten: grupp A står
     som `Material: Kiefernholz` fastän leverantören skriver `Polypropylen,
     Kiefernholz` och hela den SYNLIGA ytan är plast. Grinden kräver därför
     `polypropen` på A, `bambu` + `tall` på B och `bambu` på C — så importfelet
     inte kan överleva in i den polerade texten.

  5. **GRUPP A:s VÄV FÅR INTE KALLAS NATURMATERIAL.** Grind 4 räcker inte:
     en text kan nämna polypropen i spec-tabellen och ändå skriva "väven är
     rotting" i brödtexten. Mönstret letar efter LÖFTET (`väven är <material>`)
     och inte efter orden, precis som BARRIÄR — sidans egen mening "Banden är
     plast, inte papper eller natursnöre" ska släppas igenom.

  6. **LJUD- OCH LJUSDÄMPNING FÅR INTE UPPREPAS.** Tre av sex bär ordagrant
     "störendes Licht oder Hintergrundgeräusche zu minimieren" i den tyska
     texten. En öppen spjälväv dämpar inget ljud, och ljusdelen täcks redan av
     mörkläggningsgrinden. Steg 5, punkt 5: ett påstående utan mätvärde bakom
     sig upprepas aldrig.

⚠️ Och en KORSPRODUKTGRIND som fångade ett verkligt fel i den här rundan:
   ingen meta och ingen seo-titel får delas av två sidor. A-parets två metas
   var byte-identiska tills färgen lades in — två publicerade sidor med samma
   meta description är dubblettinnehåll mot Google.
"""
import os, re, sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import grindar as G                                     # noqa: E402
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import texter as T                                      # noqa: E402
import matt                                             # noqa: E402


def talfacit(nyckel):
    """Varje tal sidan FÅR bära, härlett ur matt.py — aldrig handskrivet."""
    pan, bredd, djup, hojd, hopf, fot, vikt, paketmatt = matt.RUNDAN[nyckel][:8]
    ut = {str(pan), str(bredd), djup, str(hojd), hopf,
          str(matt.PANELBREDD[matt.GRUPPER[nyckel]])}
    if fot:
        ut.add(fot)
    ut |= set(re.findall(r"\d+(?:,\d+)?", vikt))
    ut |= set(re.findall(r"\d+(?:,\d+)?", paketmatt))
    return ut


TAL = {k: talfacit(k) for k in matt.RUNDAN}
SLUG_TILL_NYCKEL = {T.slug_av(k): k for k in matt.RUNDAN}

# ☠️ Runda 108:s LIVE-sidor har inget facit i den här mappen. Talen är deras
#    uppmätta, och de behövs bara i grupp A:s korshänvisning ("160 × 170 cm").
#    En tyst vidgning hade betytt att varje tal passerar i just den mening där
#    ingen kan kontrollera det — därför står de här, uppräknade.
EXTERN_TAL = {
    "rumsavdelare-160-vit":  {"160", "170", "1,6", "40", "4", "6,4", "6", "6,5", "9"},
    "rumsavdelare-160-brun": {"160", "170", "1,6", "40", "4", "6,4", "6", "6,5", "9"},
}

# Familjens egen tyska ordlista, utökad med den här rundans källtext.
# `Holz`, `Metall` och `Bambus` står INTE här: svenska ord med annan betydelse
# respektive nästan samma stavning. Runda 55 lärde att ett svenskt ord i listan
# fäller varenda korrekt sida.
TYSKA_HAR = [
    "raumtrenner", "raumteiler", "paravent", "trennwand", "sichtschutz",
    "kiefernholz", "polypropylen", "webmuster", "geflechtmuster",
    "metallscharnier", "faltbar", "gefaltete", "gesamtabmessungen",
    "einzelpaneel", "fußhöhe", "abmessungen", "lieferumfang", "montage",
    "wohnzimmer", "freistehend", "geschwungene", "haltbarkeit", "privatsphäre",
    "waschschwarz", "bräune", "naturholz", "baumwollfaden", "paneele",
    "wandschirm", "faltbildschirm", "stellwand", "hintergrundgeräusche",
]

TALMONSTER = re.compile(r"\d+(?:,\d+)?")
MJUKT_BINDESTRECK = "­"
FAQ_IHOP = re.compile(r'<p><strong>[^<]*\?</strong></p>(?!<p>)')
H2_ORENT = re.compile(r"<h2>\s*<")
RELATIV_LANK = re.compile(r'href="(?!https://www\.fyndplats\.se/)')
KOMMALISTA = re.compile(r"\d+(?:,\d+)?, \d+(?:,\d+)? (och|eller) \d+\s*(cm|mm|m|kg|°|m²)")
PUNKTDECIMAL = re.compile(r"\b\d+\.\d+\b")
XKRYSS = re.compile(r"\d\s*[x*]\s*\d")

# ── Ärvda löftesgrindar (runda 108) ──────────────────────────────────────────
BARRIAR = re.compile(
    r"(stänger?\s+(inne|ute)\s+(barn|djur|husdjur)"
    r"|håller?\s+(barn|djur|husdjur)\s+(borta|inne|ute)"
    r"|fungerar\s+som\s+(en\s+)?(barriär|grind|skydd)"
    r"|barnsäker|djursäker)", re.I)
MORKLAGG_ORD = re.compile(r"(mörklägg\w*|ogenomskinlig\w*|helt\s+tät\w*)", re.I)
MORKLAGG_FRAS = re.compile(
    r"(blockerar\s+(ljus|solljus)"
    r"|släpper\s+inte\s+igenom\s+(något\s+)?ljus)", re.I)
NEKANDE_EFTER = {"inte", "aldrig"}
NEKANDE_FORE = {"dålig", "dåligt", "dåliga", "ingen", "inget", "inga", "utan",
                "inte", "aldrig"}
SATSGRANS = re.compile(r"[.!?:;]")
NEKFONSTER = 3

# ☠️ RUNDA 108:s VAKT MÄTTE BARA GRANNORDET, och gav falsklarm på den här
#    rundans grupp B: "Den räcker inte för att mörklägga" — nekandet står tre
#    ord bort, inte intill. Att i stället söka i HELA meningen är precis det
#    runda 108 avvisade med mätning: "Väven mörklägger rummet helt och tappar
#    inte formen" bär ett 'inte' längre bort och hade sluppit förbi.
#
#    Fönstret är därför BUNDET åt två håll: högst tre ord bakåt, och aldrig
#    över en satsgräns. Ett 'inte' i föregående mening negerar ingenting.
#    Båda riktningarna har ett eget självtestfall, så uppmjukningen inte kan
#    glida vidare till en meningsvid vakt vid nästa rätta.


def _nekat_fore(txt, start):
    """Står ett nekande inom NEKFONSTER ord bakåt, i SAMMA sats?"""
    granser = [m.end() for m in SATSGRANS.finditer(txt[:start])]
    sats = txt[granser[-1]:start] if granser else txt[:start]
    ord_ = re.findall(r"[\wåäöÅÄÖ]+", sats)[-NEKFONSTER:]
    return any(o.lower() in NEKANDE_FORE for o in ord_)


def morklaggningslofte(txt):
    """Första ONEKADE mörkläggningspåståendet, eller None."""
    for m in MORKLAGG_FRAS.finditer(txt):
        return m
    for m in MORKLAGG_ORD.finditer(txt):
        efter = re.findall(r"[\wåäöÅÄÖ]+", txt[m.end():m.end() + 40])
        if _nekat_fore(txt, m.start()):
            continue
        if efter and efter[0].lower() in NEKANDE_EFTER:
            continue
        return m
    return None


UTOMHUSLOFTE = re.compile(
    r"(väderbeständig\w*|tål\s+(regn|väder|sol)|för\s+utomhusbruk"
    r"|kan\s+stå\s+ute\b|utomhusskärm)", re.I)

# ── Rundans egna ─────────────────────────────────────────────────────────────
MATERIALORD = {"A": ["polypropen"], "B": ["bambu", "tall"], "C": ["bambu"]}

# ☠️ Grupp A:s väv ÄR plast. Mönstret fäller ett PÅSTÅENDE om vad den är
#    gjord av, inte ordet — "Banden är plast, inte papper eller natursnöre"
#    ska släppas igenom, för materialordet står inte efter är/av/i.
NATURVAV_A = re.compile(
    r"\b(väven|banden|flätningen|panelen|panelerna)\s+(är|av|i)\s+"
    r"(papper|papperssnöre|natursnöre|rotting|sjögräs|bambu|vass|jute|hampa)", re.I)

# ☠️ Ljuddämpning: leverantören lovar det, vi upprepar det inte.
LJUDLOFTE = re.compile(
    r"(dämpar\s+(ljud|buller|oljud)|ljudd(ämpande|ämpning)|bullerd\w+"
    r"|minskar\s+(ljud|buller|oljud)|stänger\s+ute\s+(ljud|buller))", re.I)


def granska(nyckel, d):
    fel = []
    html, namn, titel, meta = d["html"], d["namn"], d["titel"], d["meta"]
    g = matt.GRUPPER[nyckel]
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

    # ── Löftesgrindarna ──────────────────────────────────────────────────────
    kollar = [("BARRIÄRLÖFTE", BARRIAR.search),
              ("MÖRKLÄGGNINGSLÖFTE", morklaggningslofte),
              ("UTOMHUSLÖFTE", UTOMHUSLOFTE.search),
              ("LJUDLÖFTE", LJUDLOFTE.search)]
    if g == "A":
        kollar.append(("NATURVÄV PÅ PLASTVÄV", NATURVAV_A.search))
    for etikett, sok in kollar:
        m = sok(txt)
        if m:
            i = max(0, m.start() - 70)
            fel.append(f"{etikett}: …{txt[i:m.end() + 70]}…")
    for ord_ in MATERIALORD[g]:
        if ord_ not in txt.lower():
            fel.append(f"materialet nämner inte {ord_!r} — importfelet lever kvar")

    # ── Zonindelad talgrind ──────────────────────────────────────────────────
    egna, kors = G.dela_pa_ankare(html)
    tillatna = TAL[nyckel]
    zoner = [(tillatna, m) for m in egna]
    for mal, mening in kors:
        vidgad = set(tillatna)
        for slug in mal:
            if slug in SLUG_TILL_NYCKEL:
                vidgad |= TAL[SLUG_TILL_NYCKEL[slug]]
            elif slug in EXTERN_TAL:
                vidgad |= EXTERN_TAL[slug]
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
    """Grinden ska fälla exakt de löften rundan finns för att inte ge.

    ☠️ MUTERA GENOM ATT LÄGGA TILL, inte byta ut. Ett utbyte tar bort ett
    uppmätt värde och då fäller en ANNAN grind först — runda 107:s lärdom:
    läs meddelandet, inte bara utfallet.
    """
    prov = [
        ("barriärlöfte",  "<p>Skärmen stänger inne barn på ett säkert sätt.</p>", "BARRIÄRLÖFTE"),
        ("barnsäker",     "<p>Konstruktionen är barnsäker rakt igenom.</p>", "BARRIÄRLÖFTE"),
        ("mörkläggning",  "<p>Väven mörklägger rummet helt.</p>", "MÖRKLÄGGNINGSLÖFTE"),
        ("ogenomskinlig", "<p>Panelen är ogenomskinlig.</p>", "MÖRKLÄGGNINGSLÖFTE"),
        ("utomhuslöfte",  "<p>Skärmen är väderbeständig året om.</p>", "UTOMHUSLÖFTE"),
        ("ljudlöfte",     "<p>Skärmen dämpar ljud från rummet bredvid.</p>", "LJUDLÖFTE"),
        ("ljuddämpande",  "<p>En ljuddämpande vikskärm för kontoret.</p>", "LJUDLÖFTE"),
        ("naturväv på A", "<p>Väven är rotting och åldras vackert.</p>", "NATURVÄV"),
        ("husmärke",      "<p>En rumsavdelare från Outsunny.</p>", "husmärke"),
        ("artikelnummer", "<p>Rumsavdelare 845-030CG i väv.</p>", "artikelnummer"),
        ("ohärlett tal",  "<p>Skärmen är 999 cm bred.</p>", "ohärlett tal"),
        ("tyskt ord",     "<p>En Sichtschutz för vardagsrummet.</p>", "tyskt ord"),
        ("punktdecimal",  "<p>Panelen är 1.6 cm djup.</p>", "punktdecimal"),
    ]
    nyckel = "a999f2b1"                      # grupp A — bär alla grindar
    original = T.PRODUKTER[nyckel]["html"]
    ok = True
    for namn, tillagg, vantat in prov:
        T.PRODUKTER[nyckel]["html"] = original + tillagg
        traff = [f for f in granska(nyckel, T.PRODUKTER[nyckel]) if vantat in f]
        T.PRODUKTER[nyckel]["html"] = original
        print("  %-16s %s" % (namn, "fälls ✓" if traff else "SLÄPPS IGENOM ✗"))
        ok = ok and bool(traff)

    # ── Och de som INTE får fällas ───────────────────────────────────────────
    # ☠️ Ett falsklarm är lika illa som ett missat fel: båda slutar med att
    #    mottagaren slutar läsa. Sidornas EGNA nekande meningar prövas därför
    #    lika hårt som löftena — de är rundans faktiska text, inte påhitt.
    ren = True
    for kontroll_nyckel, etikett, vantat in (
            ("a999f2b1", "nekad barriär", "BARRIÄR"),
            ("a999f2b1", "nekad mörkläggning", "MÖRKLÄGGNING"),
            ("a999f2b1", "nekat utomhus", "UTOMHUS"),
            ("a999f2b1", "plast, inte papper", "NATURVÄV"),
            ("d72bde5e", "grupp B ren", "LÖFTE"),
            ("309076e2", "grupp C ren", "LÖFTE")):
        traff = [f for f in granska(kontroll_nyckel, T.PRODUKTER[kontroll_nyckel])
                 if vantat in f]
        print("  %-20s %s" % (etikett, "släpps ✓" if not traff
                              else "FALSKLARM ✗ " + traff[0][:70]))
        ren = ren and not traff

    # Ett ONEKAT löfte längre bort i samma mening får inte slippa förbi bara
    # för att meningen råkar bära ett "inte".
    T.PRODUKTER[nyckel]["html"] = original + (
        "<p>Väven mörklägger rummet helt och tappar inte formen.</p>")
    fjarran = [f for f in granska(nyckel, T.PRODUKTER[nyckel]) if "MÖRKLÄGGNING" in f]
    T.PRODUKTER[nyckel]["html"] = original
    print("  %-20s %s" % ("löfte + fjärran inte", "fälls ✓" if fjarran else "SLÄPPS IGENOM ✗"))

    # ☠️ Nekandefönstret prövas åt BÅDA hållen, annars glider det.
    T.PRODUKTER[nyckel]["html"] = original + (
        "<p>Den är inte tunn. Väven mörklägger rummet helt.</p>")
    over = [f for f in granska(nyckel, T.PRODUKTER[nyckel]) if "MÖRKLÄGGNING" in f]
    T.PRODUKTER[nyckel]["html"] = original
    print("  %-20s %s" % ("inte i FÖRRA satsen", "fälls ✓" if over else "SLÄPPS IGENOM ✗"))

    T.PRODUKTER[nyckel]["html"] = original + (
        "<p>Tätheten räcker inte för att mörklägga rummet.</p>")
    nara = [f for f in granska(nyckel, T.PRODUKTER[nyckel]) if "MÖRKLÄGGNING" in f]
    T.PRODUKTER[nyckel]["html"] = original
    print("  %-20s %s" % ("inte tre ord bort", "släpps ✓" if not nara
                          else "FALSKLARM ✗ " + nara[0][:60]))
    return ok and ren and bool(fjarran) and bool(over) and not nara


if __name__ == "__main__":
    print("=== självtest ===")
    if not sjalvtest():
        raise SystemExit("grinden fångar inte allt den ska")
    print("\n=== grind ===")
    fel_totalt, skus, metas, titlar = 0, {}, {}, {}
    for k in sorted(T.PRODUKTER, key=lambda x: (matt.GRUPPER[x], -matt.RUNDAN[x][1])):
        d = T.PRODUKTER[k]
        fel = granska(k, d)
        fel_totalt += len(fel)
        skus.setdefault(d["sku"], []).append(k)
        metas.setdefault(d["meta"], []).append(k)
        titlar.setdefault(d["titel"], []).append(k)
        print("%s %s %-9s %-28s %5d tecken  %s"
              % ("OK " if not fel else "FEL", matt.GRUPPER[k], k, d["sku"],
                 len(d["html"]), d["slug"]))
        for f in fel:
            print("      ✗", f)

    # ☠️ Korsproduktgrindar. Två sidor med samma meta är dubblettinnehåll mot
    #    Google, och en delad SKU är importens kända krock (uppgift #272) som
    #    Steg 8 ska lösa — båda är osynliga i en per-sida-grind.
    krockar = 0
    for etikett, karta in (("SKU-KROCK", skus), ("META-KROCK", metas),
                           ("TITEL-KROCK", titlar)):
        dubbel = {s: v for s, v in karta.items() if len(v) > 1}
        if dubbel:
            krockar += len(dubbel)
            print(f"\n☠️ {etikett}:", dubbel)

    print("\n%d produkter, %d unika SKU:er, %d fel"
          % (len(T.PRODUKTER), len(skus), fel_totalt + krockar))
    raise SystemExit(1 if fel_totalt or krockar else 0)
