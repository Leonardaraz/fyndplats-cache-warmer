# -*- coding: utf-8 -*-
"""Runda 118 textgrind — körs på FILEN, före varje API-anrop.

Ordningen är mätt, inte vald: batch 64 skrev fem produkter inline och tre via
fil + grind. De fem gav NIO fel som nådde Wix, de tre gav noll.

Maskineriet delas med runda 115–117 via `grindar.py`. Det som är NYTT här är
fyra grindar mot rundans egna risker, och alla fyra vaktar samma sak: att en
egenskap som gäller EN produkt inte får krypa in i en annans text. Nio vagnar
som liknar varandra är precis den situation där det händer.
"""
import copy
import re
import sys

sys.path.insert(0, "..")

import grindar as G          # noqa: E402
import matt as M             # noqa: E402
import texter as T           # noqa: E402

# Leveransomfattning: allt som ingår i kartongen. Tyskans `Lieferumfang` säger
# för samtliga nio "1 x vagn + 1 x anvisning" — inget tillbehör, ingen bricka
# utöver de som sitter fast, ingen kruka och inget glas.
INGAR = ["vagn", "bruksanvisning", "monteringsanvisning"]

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
    (re.compile(r"\b(küchenwagen|servierwagen|barwagen|rollwagen|schublade|schrank|"
                r"regal|tablett|weiß|schwarz|eiche|bambus|gelb)\b", re.I), "TYSKT ORD"),
]

TONGRINDAR = [
    (re.compile(r"\b(marknadens|världens|bäst[ae]|överlägsen|oslagbar|"
                r"perfekt|revolutioner\w*)\b", re.I), "OGRUNDAD SUPERLATIV"),
    (re.compile(r"\b(mät|väg|kontrollera)\s+(din|ditt|dina)\b", re.I),
     "BER KUNDEN MÄTA"),
    (re.compile(r"\b(certifierad|ce-märkt|godkänd\s+enligt)\b", re.I),
     "OGRUNDAD CERTIFIERING"),
]

NEGERANDE_GRINDAR = [
    # ☠️ Ett mönster som SJÄLVT bär en negation måste sökas direkt. `loftestraff`
    #    ursäktar en träff som är negerad i sin egen mening, så ett mönster som
    #    `\bvi vet inte\b` blir alltid urskuldat och kan ALDRIG fyra. Mätt i
    #    runda 117; regeln bor kvar här för att den inte får glömmas bort.
    (re.compile(r"\b(vi\s+vet\s+inte|uppges\s+inte|anges\s+inte|"
                r"inga\s+uppgifter|framgår\s+inte)\b", re.I),
     "SKRIVER ATT VI INTE VET"),
]

# ── Rundans fyra egna grindar ──────────────────────────────────────────────
# Var och en är en EGENSKAP som bara vissa av de nio har. Nio vagnar i samma
# text-mall är exakt den situation där en egenskap kryper från en produkt till
# en annan — runda 114 lät en skötseltext be ett skåp UTAN frysfack att frosta
# av frysfacket, och ingen grind såg det.
ENSKILDA = [
    (re.compile(r"\b(hopfällbar\w*|fälls?\s+ihop|viks?\s+ihop|hopfälld\w*|"
                r"vikas?\s+ihop)\b", re.I),
     {"820d076b"}, "HOPFÄLLNING"),
    (re.compile(r"\b(färdigmonterad|ingen\s+montering|behöver\s+inte\s+monteras|"
                r"monteringsfri\w*)\b", re.I),
     {"2e292a70"}, "MONTERINGSFRI"),
    (re.compile(r"\b(utomhus|uteplats\w*|altan\w*|trädgård\w*|regn\w*|väder\w*|"
                r"ute\b|marken)\b", re.I),
     {"8a73caf4", "fcb86875", "ca20d60e", "820d076b"}, "UTOMHUSBRUK"),
    (re.compile(r"\b(vridbar\w*|vrids?|svänger|roter\w*)\b", re.I),
     {"2e292a70"}, "VRIDBARA KORGAR"),
]

# ☠️ HJULANTALET. Två av de nio har TVÅ hjul och ett handtag — de rullas som en
#    skottkärra. Sju har fyra hjul varav två med broms. Att skriva "fyra hjul"
#    på en tvåhjuling är ett påstående kunden märker vid uppackning, och det är
#    precis den sortens fel som glider mellan nio nästan lika texter.
TVA_HJUL = {"8a73caf4", "ca20d60e"}
FYRA_HJUL = re.compile(r"\bfyra\s+hjul\b|\bfyra\s+svängbara\b", re.I)
BROMS = re.compile(r"\bbroms\w*\b", re.I)

MASSIVT = re.compile(r"\bmassiv\w*\b", re.I)
# Bara `ca20d60e` har `Massivholz` i leverantörsdatan. `8a73caf4` säger bara
# `Tannenholz`; resten är MDF, spånskiva, bambu, stål eller plast.
FAR_SAGA_MASSIVT = {"ca20d60e"}

STAVFEL = ["dögn", "engangs", "ihopsatt", "för hard", "hopfälbar", "utdragskorg ",
           "handuk", "melamin belagd", "rotting flätad", "konstroting", "brömsade",
           "hopfälbara", "arbetsyt ", "utdragslåd ", "grönsakvagn"]


def _tal(txt):
    return re.findall(r"\d+(?:,\d+)?", txt)


def granska(pid):
    fel = []
    namn, slug, titel, meta, sokord, html = T.bygg(pid)
    syn = G.synlig_meningstext(html)
    d = M.M[pid]

    # ☠️ SIDANS EGNA PÅSTÅENDEN ÄR INTE HELA SIDANS TEXT. En korshänvisning
    #    bär GRANNENS egenskaper — "Hopfällbar barvagn i bambu" är sant om
    #    820d076b och står i fcb86875:s text som en länk. Kördes grinden på
    #    hela texten fällde den fcb86875 för en hopfällning den inte påstår
    #    sig ha. Uppmätt av grindens eget självtest, och det är EXAKT samma
    #    familj som uppgift #398 (live-grindens materialkontroll läste hela
    #    sidan och tog grannens ord för vårt).
    #
    #    Produktegna grindar körs därför på `egna`; länkmeningarna prövas för
    #    sig, mot MÅLETS facit.
    egna_rader, kors = G.dela_pa_ankare(html)
    egna = " ".join(egna_rader)

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

    # 2. Huvudordet måste stå i BÅDE namn, titel och slug — annars flaggar Wix
    #    SEO-assistenten det rött, och sidan rankar på ingenting.
    huvud = sokord[0].split()[0].lower()
    hslug = (huvud.replace("ä", "a").replace("å", "a").replace("ö", "o"))
    if huvud not in namn.lower():
        fel.append(f"HUVUDORDET {huvud!r} saknas i namnet")
    if huvud not in titel.lower():
        fel.append(f"HUVUDORDET {huvud!r} saknas i titeln")
    if hslug not in slug:
        fel.append(f"HUVUDORDET {hslug!r} saknas i sluggen")

    # 3. Förbjudet och ton
    for monster, etikett in FORBJUDET:
        m = monster.search(html)
        if m:
            fel.append(f"{etikett}: {m.group(0)!r}")
    for monster, etikett in TONGRINDAR:
        m = G.loftestraff(monster, syn)
        if m:
            fel.append(f"{etikett}: …{G.mening_kring(syn, m.start()).strip()[:110]}…")
    for monster, etikett in NEGERANDE_GRINDAR:
        m = monster.search(syn)
        if m:
            fel.append(f"{etikett}: …{G.mening_kring(syn, m.start()).strip()[:110]}…")

    # 4. Egenskaper som bara vissa produkter har — på sidans EGNA meningar
    for monster, agare, etikett in ENSKILDA:
        m = monster.search(egna)
        if m and pid not in agare:
            fel.append(f"{etikett} på en produkt som inte har det: "
                       f"…{G.mening_kring(egna, m.start()).strip()[:110]}…")
    # …och länkmeningarna mot MÅLETS facit, så en korshänvisning inte kan
    # beskriva grannen fel heller.
    for mal, mening in kors:
        malpids = {p for p in M.ALLA if T.SLUG[p] in mal}
        for monster, agare, etikett in ENSKILDA:
            if monster.search(mening) and malpids and not (malpids & agare):
                fel.append(f"KORSLÄNK påstår {etikett} om {sorted(malpids)}: "
                           f"…{mening.strip()[:110]}…")

    # 5. Hjulantalet
    if pid in TVA_HJUL:
        if FYRA_HJUL.search(egna):
            fel.append("FYRA HJUL på en vagn med TVÅ hjul och ett handtag")
        if BROMS.search(egna):
            fel.append("BROMS på en vagn som inte har någon")
    else:
        if not BROMS.search(egna):
            fel.append("BROMSEN nämns inte — två av fyra hjul har broms")

    # 6. Materialet
    m = MASSIVT.search(egna)
    if m and pid not in FAR_SAGA_MASSIVT:
        fel.append(f"MASSIVT TRÄ: …{G.mening_kring(egna, m.start()).strip()[:110]}… "
                   f"— materialet är {d['material']}")

    # 7. ☠️ Färgade DELAR. Runda 89–91 skrev fel färg tre rundor i rad, varje
    #    gång om en ny detalj. Kravet är LIKHET per fras, inte delmängd: varje
    #    färgord som står omedelbart före en vaktad del måste finnas i listan.
    for del_, tillatna in M.DEL_OK[pid].items():
        for m in re.finditer(rf"(\w+)\s+{del_}\w*", egna, re.I):
            ordet = m.group(1).lower()
            if ordet in G.FARGORD and ordet not in [t.lower() for t in tillatna]:
                fel.append(f"FÄRG PÅ {del_.upper()}: {ordet!r} — uppmätt är "
                           f"{'/'.join(tillatna)}")

    # 8. Leveranslöften
    fel += G.leveransloften(egna, INGAR, pid)

    # 9. Svensk sifferstil
    if re.search(r"\d+\.\d", syn):
        fel.append("DECIMALPUNKT i stället för komma")
    if re.search(r"\d+\s*x\s*\d+", syn):
        fel.append("'x' som multiplikationstecken i stället för '×'")

    # 10. Talgrinden: varje tal måste gå att spåra till matt.py
    kallor = " ".join(str(v) for v in d.values()) + " " + " ".join(M.HARLEDDA)
    tillatna = set(_tal(kallor))
    for t in _tal(egna):
        if t not in tillatna:
            fel.append(f"OSPÅRAT TAL {t!r} — står inte i matt.py['{pid}']")

    # 11c. ☠️ DUBBLERAD ENHET. `matt.py['fcb86875']['skiva']` är "Ø 45 cm" och
    #      mallen skrev "Ø {skiva}" — resultatet blev "Ø Ø 45 cm" på fem ställen.
    #      Datan äger enheten; mallen får inte lägga på en till.
    m = re.search(r"(Ø|cm|kg|×)\s+\1\b", syn)
    if m:
        fel.append(f"DUBBLERAD ENHET: {m.group(0)!r} — datan bär den redan")

    # 11a. ☠️ ETT SPÅRBART TAL KAN VARA FEL TAL. Ingressen på 820d076b sa
    #      "Två brickor på 66 × 40 cm" — det är VAGNENS fotavtryck, inte
    #      brickans (54 × 33). Båda talen står i matt.py, så talgrinden i
    #      punkt 10 släppte igenom det utan en invändning. Grinden här nedan
    #      säger vad talgrinden inte kan: en DEL får inte bära vagnens egna
    #      yttermått.
    fotavtryck = rf"{re.escape(d['bredd'])}\s*×\s*{re.escape(d['djup'])}"
    delord = (r"brick\w*|skiv\w*|korg\w*|hyll\w*|plan\w*|låd\w*|"
              r"arbetsyt\w*|yta|ytan")
    m = re.search(rf"\b({delord})\s+(?:på|om)\s+{fotavtryck}", egna, re.I)
    if m:
        fel.append(f"DELEN BÄR VAGNENS YTTERMÅTT: …{m.group(0)}… — "
                   f"{d['bredd']} × {d['djup']} är hela vagnen")

    # 11. FAQ-formen: fråga och svar som TVÅ <p>
    if re.search(r"<strong>[^<]*\?</strong>(?!</p>)", html):
        fel.append("FAQ-FRÅGA sitter ihop med svaret — skriv två <p>")

    # 11d. ☠️ KORTETS RUBRIK ÄR OGRANSKAD om den bor i kort.py. Runda 90 och
    #      91 skrev fel färg två rundor i rad, och båda gångerna satt felet
    #      just där. Rubriken lintas som ett eget litet dokument.
    kicker, rubrik = T.KORT[pid]
    korttext = f"{kicker}. {rubrik}."
    for monster, etikett in FORBJUDET + TONGRINDAR:
        m = monster.search(korttext)
        if m:
            fel.append(f"KORTET, {etikett}: {m.group(0)!r}")
    for monster, agare, etikett in ENSKILDA:
        if monster.search(korttext) and pid not in agare:
            fel.append(f"KORTET, {etikett} på en produkt som inte har det: {korttext!r}")
    for t_ in _tal(korttext):
        if t_ not in tillatna:
            fel.append(f"KORTET, OSPÅRAT TAL {t_!r}")
    if pid in TVA_HJUL and FYRA_HJUL.search(korttext):
        fel.append("KORTET påstår fyra hjul på en tvåhjuling")

    # 12. Stavfel
    for ord_ in STAVFEL:
        if ord_ in syn.lower():
            fel.append(f"STAVFEL {ord_!r}")

    # 13. Korslänkarna ska peka på rundans egna slugs ELLER på en publicerad sida
    for adress, _ in G.ANKARE.findall(html):
        mal = adress.rsplit("/", 1)[-1]
        if mal not in T.SLUG.values() and mal not in PUBLICERADE:
            fel.append(f"KORSLÄNK till okänd slug: {mal!r}")
        if mal == T.SLUG[pid]:
            fel.append("KORSLÄNK till SIG SJÄLV")

    return fel


# Publicerade slugs som rundans texter får länka till. Mätt i katalogsvepet.
PUBLICERADE = {
    "rullvagn-med-korgar-vit", "rullvagn-4-korgar-rustik", "rullvagn-svart-3-korgar",
    "rullvagn-bambu-3-hyllplan", "rullvagn-bambu-tre-plan-med-racke",
    "serveringsvagn-66-cm-tre-plan", "serveringsvagn-med-hjul-barvagn-3-plan",
}


# ── Självtest ──────────────────────────────────────────────────────────────
FALL = [
    ("hopfällning på fel produkt", "15d6fcef",
     lambda: T.EGENSKAPER["15d6fcef"].insert(0, "Viks ihop när den inte används"),
     "HOPFÄLLNING"),
    ("monteringsfri på fel produkt", "764a3efc",
     lambda: T.EGENSKAPER["764a3efc"].insert(0, "Kommer färdigmonterad"),
     "MONTERINGSFRI"),
    ("utomhusbruk på en innevagn", "a4ee97c1",
     lambda: T.FAQ["a4ee97c1"].append(("Kan den stå ute?", "Ja, den tål regn.")),
     "UTOMHUSBRUK"),
    ("vridbara korgar på fel produkt", "0fd65541",
     lambda: T.EGENSKAPER["0fd65541"].insert(0, "Korgarna vrids åt var sitt håll"),
     "VRIDBARA KORGAR"),
    ("fyra hjul på en tvåhjuling", "8a73caf4",
     lambda: T.EGENSKAPER["8a73caf4"].insert(0, "Fyra hjul under vagnen"),
     "FYRA HJUL"),
    ("broms på en vagn utan broms", "ca20d60e",
     lambda: T.FAQ["ca20d60e"].append(("Låser den?", "Ja, hjulen har broms.")),
     "BROMS på en vagn"),
    ("massivt trä på MDF", "15d6fcef",
     lambda: T.EGENSKAPER["15d6fcef"].insert(0, "Skiva i massivt ekträ"),
     "MASSIVT TRÄ"),
    ("fel färg på en vaktad del", "fcb86875",
     lambda: T.EGENSKAPER["fcb86875"].insert(0, "Grå rotting runt planen"),
     "FÄRG PÅ ROTTING"),
    ("husmärke", "2e292a70",
     lambda: T.EGENSKAPER["2e292a70"].insert(0, "Tillverkad av HOMCOM"), "HUSMÄRKE"),
    ("artikelnummer", "2e292a70",
     lambda: T.SPEC["2e292a70"].append(("Modellreferens", "844-657V90MX")),
     "ARTIKELNUMMER"),
    ("leveransland", "a4ee97c1",
     lambda: T.EGENSKAPER["a4ee97c1"].insert(0, "Skickas från Polen"), "LEVERANSLAND"),
    ("attribution", "a4ee97c1",
     lambda: T.EGENSKAPER["a4ee97c1"].insert(0, "Leverantören anger 10 kg"),
     "ATTRIBUTION"),
    ("leveranslöfte om tillbehör", "820d076b",
     lambda: T.FAQ["820d076b"].append(("Ingår glas?", "Fyra glas ingår i leveransen.")),
     "LEVERANSLÖFTE"),
    ("ospårat tal", "764a3efc",
     lambda: T.EGENSKAPER["764a3efc"].insert(0, "Tål 999 kg"), "OSPÅRAT TAL"),
    ("decimalpunkt", "764a3efc",
     lambda: T.EGENSKAPER["764a3efc"].insert(0, "Skivan är 36.5 cm bred"),
     "DECIMALPUNKT"),
    ("x som multiplikation", "764a3efc",
     lambda: T.EGENSKAPER["764a3efc"].insert(0, "Måtten är 39,5 x 24 cm"),
     "'x' som multiplikation"),
    ("relativ länk", "2e292a70",
     lambda: T.EGENSKAPER["2e292a70"].insert(0, '<a href="/produkt/x">se den</a>'),
     "RELATIV LÄNK"),
    ("br-tagg", "2e292a70",
     lambda: T.EGENSKAPER["2e292a70"].insert(0, "Rad ett<br>rad två"), "STRIPPAR <br>"),
    ("tyskt ord", "0fd65541",
     lambda: T.EGENSKAPER["0fd65541"].insert(0, "Schublade med skenor"), "TYSKT ORD"),
    ("superlativ", "0fd65541",
     lambda: T.EGENSKAPER["0fd65541"].insert(0, "Marknadens bästa köksvagn"),
     "SUPERLATIV"),
    ("ber kunden mäta", "15d6fcef",
     lambda: T.FAQ["15d6fcef"].append(("Passar den?", "Mät ditt kök först.")),
     "BER KUNDEN MÄTA"),
    ("skriver att vi inte vet", "15d6fcef",
     lambda: T.FAQ["15d6fcef"].append(("Vilket trä?", "Vi vet inte vilken sort.")),
     "SKRIVER ATT VI INTE VET"),
    ("certifiering", "8a73caf4",
     lambda: T.EGENSKAPER["8a73caf4"].insert(0, "CE-märkt konstruktion"),
     "CERTIFIERING"),
    ("intern jargong", "8a73caf4",
     lambda: T.EGENSKAPER["8a73caf4"].insert(0, "Vald i rundan för uteplatser"),
     "JARGONG"),
    ("stavfel", "fcb86875",
     lambda: T.EGENSKAPER["fcb86875"].insert(0, "Ett engangsjobb att montera"),
     "STAVFEL"),
    ("korslänk till sig själv", "fcb86875",
     lambda: T.SYSKON["fcb86875"].append(
         ("barvagn-konstrotting-rund-50-cm", "den här vagnen")),
     "SIG SJÄLV"),
    ("okänd korslänk", "fcb86875",
     lambda: T.SYSKON["fcb86875"].append(("finns-inte-alls", "här")), "okänd slug"),
    ("fel i KORTRUBRIKEN", "15d6fcef",
     lambda: T.KORT.__setitem__("15d6fcef", ("KÖKSVAGN", "Viks ihop efter kvällen")),
     "KORTET, HOPFÄLLNING"),
    ("ospårat tal i KORTRUBRIKEN", "fcb86875",
     lambda: T.KORT.__setitem__("fcb86875", ("BARVAGN", "Tål 999 kg")),
     "KORTET, OSPÅRAT TAL"),
    ("dubblerad enhet", "fcb86875",
     lambda: T.EGENSKAPER["fcb86875"].insert(0, "Bricka på Ø Ø 45 cm"),
     "DUBBLERAD ENHET"),
    ("delen bär vagnens yttermått", "820d076b",
     lambda: T.EGENSKAPER["820d076b"].insert(0, "Två brickor på 66 × 40 cm"),
     "DELEN BÄR VAGNENS YTTERMÅTT"),
    # Falsklarmsprov — dessa MÅSTE gå fria.
    ("negationen räddar superlativen", "2e292a70",
     lambda: T.FAQ["2e292a70"].append(
         ("Är den bäst?", "Vi påstår inte att den är bäst.")), None),
    ("hopfällning på ÄGAREN går fri", "820d076b",
     lambda: T.EGENSKAPER["820d076b"].insert(0, "Fälls ihop på några sekunder"), None),
    ("utomhusbruk på en utevagn går fri", "ca20d60e",
     lambda: T.EGENSKAPER["ca20d60e"].insert(0, "Byggd för uteplatsen"), None),
    ("uppmätt färg på vaktad del går fri", "fcb86875",
     lambda: T.EGENSKAPER["fcb86875"].insert(0, "Naturfärgad rotting runt planen"),
     None),
]


def byggartest():
    """☠️ EN NORMALISERING GÖR SIN EGEN GRIND OMÖJLIG ATT UTLÖSA.

    Flera punkter börjar med `{antal_fack}`, som är gement i matt.py eftersom
    samma fält också används mitt i meningar — så listorna renderades med liten
    bokstav. Den självklara lagningen var en grind i `granska`: fäll på
    `<li>` följt av gemen.

    Den grinden är omöjlig att pröva. `bygg()` versaliserar första tecknet, så
    ingen mutation av EGENSKAPER kan någonsin producera en gemen punkt — och
    en grind som inte går att utlösa är exakt det runda 117 mätte upp om
    `vi vet inte`: den ser riktig ut i källkoden och tiger för alltid.

    Rätt form är därför att pröva NORMALISERINGEN i stället för utfallet: mata
    in en gemen punkt och kräv att bygg() versaliserade den.
    """
    spar = copy.deepcopy(T.EGENSKAPER)
    T.EGENSKAPER["2e292a70"].insert(0, "gemen punkt som ska versaliseras")
    try:
        html = T.bygg("2e292a70")[5]
    finally:
        T.EGENSKAPER.clear(); T.EGENSKAPER.update(spar)
    fel = []
    if "<li>Gemen punkt" not in html:
        fel.append("bygg() versaliserade INTE punktlistans första tecken")
    if re.search(r"<li>(?!<strong>)[a-zåäö]", html):
        fel.append("bygg() lämnade en gemen punkt kvar")

    # Samma kontrakt för FAQ-SVAREN. Två svar började med ett gement räkneord
    # ur matt.py innan normaliseringen fanns.
    spar = copy.deepcopy(T.FAQ)
    T.FAQ["2e292a70"].append(("Prov?", "gement svar som ska versaliseras"))
    try:
        html2 = T.bygg("2e292a70")[5]
    finally:
        T.FAQ.clear(); T.FAQ.update(spar)
    if "<p>Gement svar" not in html2:
        fel.append("bygg() versaliserade INTE FAQ-svarets första tecken")
    return fel


def sjalvtest():
    fel = byggartest()
    for namn, pid, skada, vantat in FALL:
        spar = (copy.deepcopy(T.EGENSKAPER), copy.deepcopy(T.FAQ),
                copy.deepcopy(T.SPEC), copy.deepcopy(T.SYSKON),
                copy.deepcopy(T.KORT))
        skada()
        try:
            traffar = granska(pid)
        finally:
            T.EGENSKAPER, T.FAQ, T.SPEC, T.SYSKON, T.KORT = spar
        if vantat and not any(vantat in f for f in traffar):
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
    for pid in M.ALLA:
        f = granska(pid)
        tot += len(f)
        print(("FEL " if f else "OK  ") + f"{pid}  {T.SLUG[pid]}")
        for x in f:
            print("      ✗", x)
    print(f"\n{len(M.ALLA)} produkter, {tot} fel i texterna, {len(st)} fel i självtestet")
    sys.exit(1 if (tot or st) else 0)
