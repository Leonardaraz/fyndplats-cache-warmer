# -*- coding: utf-8 -*-
"""Runda 117 textgrind — körs på FILEN, före varje API-anrop.

Ordningen är mätt, inte vald: batch 64 skrev fem produkter inline och tre via
fil + grind. De fem gav NIO fel som nådde Wix, de tre gav noll.

Grinden delar sitt maskineri med runda 115 och 116 via `grindar.py`. Det är
med flit — husets vanligaste bugg är att tvillingar glider isär, och den här
sessionen har redan sett det två gånger (`SHIP_AXIS_RE`, `LEVERANS` utan
ordgränser).
"""
import re
import sys

sys.path.insert(0, "..")

import grindar as G          # noqa: E402
import matt as M             # noqa: E402
import texter as T           # noqa: E402

INGAR = ["köksvagn", "monteringsanvisning"]

# ── Förbjudet i kundtext ───────────────────────────────────────────────────
FORBJUDET = [
    (re.compile(r"\b(homcom|outsunny|pawhut|aiyaplay|vinsetto|aosom)\b", re.I),
     "HUSMÄRKE"),
    (G.ARTNR, "ARTIKELNUMMER"),
    (re.compile(r"\b(tyskland|kina|polen|spanien|eu-lager|skickas\s+från)\b", re.I),
     "LEVERANSLAND"),
    (re.compile(r"\bleverantör\w*\b", re.I), "ATTRIBUTION — mot kunden är VI leverantören"),
    (re.compile(r"\brundan?\b", re.I), "INTERN JARGONG"),
    (re.compile(r"<br\s*/?>", re.I), "WIX STRIPPAR <br>"),
    (re.compile(r'href="(?!https://www\.fyndplats\.se/)', re.I),
     "RELATIV LÄNK — Wix skriver om den till https:/ med ETT snedstreck"),
    (re.compile(r"\b(küchenwagen|servierwagen|kücheninsel|schublade|schrank|"
                r"regal|weiß|schwarz|eiche)\b", re.I), "TYSKT ORD"),
]

# ── Tonfel ─────────────────────────────────────────────────────────────────
TONGRINDAR = [
    (re.compile(r"\b(marknadens|världens|bäst[ae]|överlägsen|oslagbar|"
                r"perfekt|revolutioner\w*)\b", re.I), "OGRUNDAD SUPERLATIV"),
    (re.compile(r"\b(mät|väg|kontrollera)\s+(din|ditt|dina)\b", re.I),
     "BER KUNDEN MÄTA"),
    (re.compile(r"\b(certifierad|ce-märkt|godkänd\s+enligt)\b", re.I),
     "OGRUNDAD CERTIFIERING"),
]

# ☠️ MATERIALGRIND. Ek och naturträ är DEKOR på grupp A, B och D — deras
#    `Materialien`-rad säger `Spanplatte, MDF, Stahl` respektive `MDF`. Bara
#    grupp C har `Gummiholz`, alltså massivt trä. Runda 56 lät MDF passera som
#    massivt trä (uppgift #259); grinden finns för att det inte ska upprepas.
MASSIVT = re.compile(r"\bmassiv\w*\b", re.I)

# ☠️ ETT MÖNSTER SOM SJÄLVT BÄR EN NEGATION MÅSTE SÖKAS DIREKT.
#
# `loftestraff` ursäktar en träff som är negerad i sin egen mening. Det är
# hela dess syfte, och det som gör superlativgrinden användbar: "vi påstår
# inte att den är bäst" ska gå fri. Men mekanismen läser inte VEM som negerar.
# Ett mönster som `\bvi vet inte\b` bär sin egen negation, blir därför alltid
# "urskuldat", och kan ALDRIG fyra.
#
# Uppmätt här, av grindens eget självtest: fallet "Vi vet inte vilken sort."
# gav noll träffar genom `loftestraff` och träffar direkt. Grinden fanns, såg
# riktig ut i källkoden, och var omöjlig att utlösa. Samma familj som husets
# vanligaste regel — ett fel ingen kan se är värre än ett som skriker — men
# värre på ett sätt: här var det GRINDEN som var tyst, inte felet.
NEGERANDE_GRINDAR = [
    (re.compile(r"\b(vi\s+vet\s+inte|uppges\s+inte|anges\s+inte|"
                r"inga\s+uppgifter|framgår\s+inte)\b", re.I),
     "SKRIVER ATT VI INTE VET"),
]

# Kända felstavningar. ☠️ Rätta per ORD, inte per förekomst — `dögnsvarv`
# hittades tre gånger i tre rundor för att varje fynd lagades där det syntes.
STAVFEL = ["dögn", "engangs", "ihopsatt", "för hard", "hopfällbart skiva",
           "utfällbart skiva", "kryddhyla", "handuk", "melamin belagd"]


def _tal(txt):
    """Alla tal i texten, som strängar med svensk decimalkomma."""
    return re.findall(r"\d+(?:,\d+)?", txt)


def granska(pid):
    fel = []
    namn, titel, meta = T.NAMN[pid], T.TITEL[pid], T.META[pid]
    slug, html = T.SLUG[pid], T.bygg(pid)
    g = M.GRUPP[pid]
    syn = G.synlig_meningstext(html)

    # 1. Längder och identitet
    if len(namn) > 80:
        fel.append(f"NAMNET är {len(namn)} tecken (max 80)")
    if len(titel) > 60:
        fel.append(f"TITELN är {len(titel)} tecken (max 60)")
    if len(meta) > 155:
        fel.append(f"METAN är {len(meta)} tecken (max 155)")
    if titel.strip() == namn.strip():
        fel.append("TITEL = NAMN → butiken renderar mallen '{name} | Fyndplats'")
    if not re.fullmatch(r"[a-z0-9-]+", slug):
        fel.append(f"SLUGGEN är inte ren ASCII-gemener: {slug!r}")

    # 2. Förbjudet och ton — på HELA html:en (länkar och attribut också)
    for monster, etikett in FORBJUDET:
        m = monster.search(html)
        if m:
            fel.append(f"{etikett}: {m.group(0)!r}")
    for monster, etikett in TONGRINDAR:
        m = G.loftestraff(monster, syn)
        if m:
            fel.append(f"{etikett}: …{G.mening_kring(syn, m.start()).strip()[:110]}…")
    # Utan negationsursäkt — se kommentaren vid NEGERANDE_GRINDAR.
    for monster, etikett in NEGERANDE_GRINDAR:
        m = monster.search(syn)
        if m:
            fel.append(f"{etikett}: …{G.mening_kring(syn, m.start()).strip()[:110]}…")

    # 3. Materialgrinden
    m = MASSIVT.search(syn)
    if m and g != "C":
        fel.append(f"MASSIVT TRÄ PÅ GRUPP {g}: {G.mening_kring(syn, m.start()).strip()[:110]!r} "
                   f"— materialet är {M.MATT[g]['material']}")

    # 4. Leveranslöften
    fel += G.leveransloften(syn, INGAR, pid)

    # 5. Svensk sifferstil
    if re.search(r"\d+\.\d", syn):
        fel.append("DECIMALPUNKT i stället för komma")
    if re.search(r"\d+\s*x\s*\d+", syn):
        fel.append("'x' som multiplikationstecken i stället för '×'")
    if re.search(r"\d+,\s+\d+\s+och\s+\d+\s*(cm|kg|mm)", syn):
        fel.append("KOMMALISTA av tal med enheten sist — använd snedstreck")

    # 6. Talgrinden: varje tal måste gå att spåra till matt.py
    kallor = " ".join(str(v) for v in M.MATT[g].values())
    kallor += " " + M.FARG[pid] + " " + " ".join(M.HARLEDDA[g])
    tillatna = set(_tal(kallor))
    for t in _tal(syn):
        if t not in tillatna:
            fel.append(f"OSPÅRAT TAL {t!r} — står inte i matt.py['{g}'] "
                       f"och är inte härlett")

    # 7. FAQ-formen: fråga och svar som TVÅ <p>, aldrig ihop
    if re.search(r"<strong>[^<]*\?</strong>(?!</p>)", html):
        fel.append("FAQ-FRÅGA sitter ihop med svaret — skriv två <p>")

    # 8. Stavfel
    for ord_ in STAVFEL:
        if ord_ in syn.lower():
            fel.append(f"STAVFEL {ord_!r}")

    # 9. Korslänkarna ska peka på rundans egna slugs
    for adress, _ in G.ANKARE.findall(html):
        maladress = adress.rsplit("/", 1)[-1]
        if maladress not in T.SLUG.values():
            fel.append(f"KORSLÄNK till okänd slug: {maladress!r}")

    return fel


# ── Självtest ──────────────────────────────────────────────────────────────
FALL = [
    ("massivt trä på fel grupp", "63235957",
     lambda: T.EGENSKAPER["A"].insert(0, "Skiva i massivt ekträ"), "MASSIVT TRÄ"),
    ("leveranslöfte om bestickinsats", "63235957",
     lambda: T.FAQ["A"].append(("Ingår något mer?", "En bestickinsats ingår i lådan.")),
     "LEVERANSLÖFTE"),
    ("husmärke", "e16c1515",
     lambda: T.EGENSKAPER["B"].insert(0, "Tillverkad av HOMCOM"), "HUSMÄRKE"),
    ("artikelnummer", "e16c1515",
     lambda: T.SPEC["B"].append(("Modellreferens", "839-835V01CG")), "ARTIKELNUMMER"),
    ("leveransland", "4ab392f7",
     lambda: T.EGENSKAPER["C"].insert(0, "Skickas från Tyskland"), "LEVERANSLAND"),
    ("attribution", "4ab392f7",
     lambda: T.EGENSKAPER["C"].insert(0, "Leverantören anger 40 kg"), "ATTRIBUTION"),
    ("ospårat tal", "41d31478",
     lambda: T.EGENSKAPER["D"].insert(0, "Tål 999 kg"), "OSPÅRAT TAL"),
    ("decimalpunkt", "41d31478",
     lambda: T.EGENSKAPER["D"].insert(0, "Skivan är 86.5 cm hög"), "DECIMALPUNKT"),
    ("x som multiplikation", "41d31478",
     lambda: T.EGENSKAPER["D"].insert(0, "Måtten är 82 x 38 cm"), "'x' som multiplikation"),
    ("relativ länk", "63235957",
     lambda: T.EGENSKAPER["A"].insert(0, '<a href="/produkt/x">se den</a>'), "RELATIV LÄNK"),
    ("br-tagg", "63235957",
     lambda: T.EGENSKAPER["A"].insert(0, "Rad ett<br>rad två"), "STRIPPAR <br>"),
    ("tyskt ord", "e16c1515",
     lambda: T.EGENSKAPER["B"].insert(0, "Schublade med skenor"), "TYSKT ORD"),
    ("superlativ", "e16c1515",
     lambda: T.EGENSKAPER["B"].insert(0, "Marknadens bästa köksvagn"), "SUPERLATIV"),
    ("ber kunden mäta", "4ab392f7",
     lambda: T.FAQ["C"].append(("Passar den?", "Mät ditt kök först.")), "BER KUNDEN MÄTA"),
    ("skriver att vi inte vet", "4ab392f7",
     lambda: T.FAQ["C"].append(("Vilket trä?", "Vi vet inte vilken sort.")),
     "SKRIVER ATT VI INTE VET"),
    ("certifiering", "41d31478",
     lambda: T.EGENSKAPER["D"].insert(0, "CE-märkt konstruktion"), "CERTIFIERING"),
    ("intern jargong", "41d31478",
     lambda: T.EGENSKAPER["D"].insert(0, "Vald i rundan för smala kök"), "JARGONG"),
    ("stavfel", "63235957",
     lambda: T.EGENSKAPER["A"].insert(0, "Ett engangsjobb att montera"), "STAVFEL"),
    ("okänd korslänk", "63235957",
     lambda: T.EGENSKAPER["A"].insert(
         0, '<a href="https://www.fyndplats.se/produkt/finns-inte">här</a>'),
     "okänd slug"),
    ("negationen räddar superlativen", "e16c1515",
     lambda: T.FAQ["B"].append(("Är den bäst?", "Vi påstår inte att den är bäst.")),
     None),
    ("negationsgrinden ger inget falsklarm på vanlig text", "d4db4bbc",
     lambda: T.FAQ["B"].append(("Behöver den monteras?", "Ja, den levereras omonterad.")),
     None),
    ("skärbräda utan löftesverb går fri", "e16c1515",
     lambda: T.EGENSKAPER["B"].insert(0, "Facket är gjort för skärbrädor"), None),
]


def sjalvtest():
    import copy
    fel = []
    for namn, pid, skada, vantat in FALL:
        spar = (copy.deepcopy(T.EGENSKAPER), copy.deepcopy(T.FAQ),
                copy.deepcopy(T.SPEC))
        skada()
        try:
            traffar = granska(pid)
        finally:
            T.EGENSKAPER, T.FAQ, T.SPEC = spar
        träff = any(vantat in f for f in traffar) if vantat else True
        if vantat and not träff:
            fel.append(f"{namn}: grinden såg det INTE ({traffar or 'inga fel'})")
        if vantat is None and traffar:
            fel.append(f"{namn}: FALSKLARM — {traffar}")
    return fel


if __name__ == "__main__":
    st = sjalvtest()
    print(f"självtest: {len(FALL)} fall, {len(st)} fel")
    for f in st:
        print("  ☠️", f)
    tot = 0
    for pid in M.GRUPP:
        f = granska(pid)
        tot += len(f)
        print(("FEL " if f else "OK  ") + f"{pid}  {T.SLUG[pid]}")
        for x in f:
            print("      ✗", x)
    print(f"\n{len(M.GRUPP)} produkter, {tot} fel i texterna, {len(st)} fel i självtestet")
    sys.exit(1 if (tot or st) else 0)
