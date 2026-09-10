# -*- coding: utf-8 -*-
"""Runda 120 textgrind — körs på FILEN, före varje API-anrop.

Ordningen är mätt, inte vald: batch 64 skrev fem produkter inline och tre via
fil + grind. De fem gav NIO fel som nådde Wix, de tre gav noll.

Maskineriet delas med runda 115–119 via `grindar.py`. Det som är NYTT här:

  1. ☠️ **UTOMHUSGRINDEN HAR NOLL ÄGARE.** Leverantören säljer `3b38e191` som
     *"Geeignet für den Außen- oder Innenbereich"* — på ett set med skiva i
     MDF. MDF sväller av fukt. Ingen av de åtta får alltså säga utomhus, och
     grinden är skriven med `FAR_SAGA_UTOMHUS = set()` i stället för att bara
     utelämnas: en grind som finns men aldrig ägs är läsbar, en som saknas är
     osynlig.
  2. ☠️ **HJULGRINDEN ÄR NEGATIV.** Inget av de åtta seten har hjul. Familjen
     före den här (köksvagnar, runda 117–119) hade det på varenda produkt, och
     en mening som glider över är exakt den sortens fel som inte syns när man
     läser en text i taget.
  3. **RYGGSTÖDET.** Två av åtta har det. Det är rundans motsvarighet till
     runda 119:s femte hjul — en egenskap kunden märker vid uppackning.
"""
import re
import sys
import unicodedata

sys.path.insert(0, "..")

import grindar as G          # noqa: E402
import matt as M             # noqa: E402
import texter as T           # noqa: E402

# Leveransomfattning. Leverantörens `Lieferumfang` säger för samtliga åtta
# "bord + pallar/stolar + anvisning" — inga dynor utöver de fastsydda, inga
# glas, ingen bricka, ingen belysning.
INGAR = ["bord", "pall", "stol", "bruksanvisning", "monteringsanvisning",
         "monteringsverktyg", "dyna"]

FORBJUDET = [
    (re.compile(r"\b(homcom|outsunny|pawhut|aiyaplay|vinsetto|aosom)\b", re.I),
     "HUSMÄRKE"),
    (G.ARTNR, "ARTIKELNUMMER"),
    (re.compile(r"\b(tyskland|kina|polen|spanien|eu-lager|skickas\s+från)\b", re.I),
     "LEVERANSLAND"),
    (re.compile(r"\bleverantör\w*\b", re.I), "ATTRIBUTION — mot kunden är VI leverantören"),
    # ☠️ MÖNSTRET VAR `\brundan?\b` OCH FÄLLDE TVÅ KORREKTA SIDOR — "runda
    #    pallar" är vanlig svenska. Definitionen bor sedan dess i `grindar.py`
    #    med mätningen som köpte den: den breda formen var trasig i runda
    #    117–119 utan att någon märkte det, för ingen produkt var rund.
    (G.JARGONG, "INTERN JARGONG"),
    (re.compile(r"<br\s*/?>", re.I), "WIX STRIPPAR <br>"),
    (re.compile(r'href="(?!https://www\.fyndplats\.se/)', re.I),
     "RELATIV LÄNK — Wix skriver om den till https:/ med ETT snedstreck"),
    (re.compile(r"\b(bartisch|barhocker|barstuhl|tresen\w*|stehtisch|hocker|"
                r"sitzhöhe|belastbarkeit|spanplatte|holzwerkstoff|schwarz|weiß|"
                r"eiche|stahl|lieferumfang|montage)\b", re.I), "TYSKT ORD"),
    # ☠️ Måttritningen på c3bda64a bar `374 lbs`. Enheten hör inte hemma i en
    #    svensk text heller — och den är en av få engelska rester som ser ut
    #    som ett mått i stället för som ett ord.
    (re.compile(r"\b\d+\s*(lbs?|inch|inches|ft)\b", re.I), "ENGELSK ENHET"),
]

TONGRINDAR = [
    (re.compile(r"\b(marknadens|världens|bäst[ae]|överlägsen|oslagbar|"
                r"perfekt|revolutioner\w*)\b", re.I), "OGRUNDAD SUPERLATIV"),
    (re.compile(r"\b(mät|väg|kontrollera)\s+(din|ditt|dina)\b", re.I),
     "BER KUNDEN MÄTA"),
    (re.compile(r"\b(certifierad|ce-märkt|godkänd\s+enligt)\b", re.I),
     "OGRUNDAD CERTIFIERING"),
    (re.compile(r"\bhärdat?\s+glas\b", re.I), "OGRUNDAD HÄRDNING"),
    # Ärvd från runda 119 Steg 12: ett påstående om VÅRT EGET SORTIMENT blir
    # osant av nästa import, utan att någon rör sidan.
    # ☠️ ÄNDELSEN, INTE UPPRÄKNINGEN. Första formen listade sex superlativ
    #    och missade "smalaste … i sortimentet" — live-självtestet i runda 120
    #    fällde grinden, inte sidan. Svenskans superlativ slutar på -ast(e)
    #    eller -st(a); de oregelbundna står kvar som egna alternativ.
    (re.compile(r"\b(\w+ast[ae]?|störst\w*|minst\w*|flest\w*|enda|bäst\w*|sämst\w*)\b"
                r"[^.!?]{0,40}\b(i\s+)?(sortimentet|katalogen|butiken|hos\s+oss)\b",
                re.I), "PÅSTÅENDE OM VÅRT EGET SORTIMENT"),
    (re.compile(r"\b(den|det)\s+enda\s+med\b", re.I),
     "PÅSTÅENDE OM VÅRT EGET SORTIMENT"),
]

NEGERANDE_GRINDAR = [
    (re.compile(r"\b(vi\s+vet\s+inte|uppges\s+inte|anges\s+inte|"
                r"inga\s+uppgifter|framgår\s+inte)\b", re.I),
     "SKRIVER ATT VI INTE VET"),
]

# ── Rundans egna grindar ───────────────────────────────────────────────────
# ☠️ `FAR_SAGA_UTOMHUS` är TOM MED FLIT, och det är rundans viktigaste rad.
FAR_SAGA_UTOMHUS = set()

ENSKILDA = [
    (re.compile(r"\b(utomhus|uteplats\w*|altan\w*|trädgård\w*|balkong\w*|"
                r"regn\w*|väderbeständ\w*|ute\b)\b", re.I),
     FAR_SAGA_UTOMHUS, "UTOMHUSBRUK"),
    (re.compile(r"\b(ryggstöd|rygg\b|hög\s+rygg)\b", re.I),
     set(M.MED_RYGG), "RYGGSTÖD"),
    (re.compile(r"\b(hylla|hyllan|hyllor|hyllplan\w*|förvaring\w*)\b", re.I),
     set(M.MED_FORVARING), "FÖRVARING"),
    (re.compile(r"\b(stoppad\w*|dyna|dynan|skumplast|\bpu\b|klädsel)\b", re.I),
     {"51c43e67"}, "STOPPAD SITS"),
    (re.compile(r"\bmarmor\w*\b", re.I), {"f4ed1264"}, "MARMOROPTIK"),
    (re.compile(r"\bfotstöd\w*\b", re.I), {"c3bda64a"}, "FOTSTÖD"),
]

# ☠️ ANTALET SITTPLATSER. Sex set har två, två har fyra. Fel antal är ett
#    påstående kunden märker vid uppackning — samma klass som runda 119:s
#    femte hjul, och lika lätt att låta glida mellan åtta nästan lika texter.
FYRA_SITS = re.compile(r"\bfyra\s+(pallar|stolar|sittplatser|personer)\b", re.I)
TVA_SITS = re.compile(r"\btvå\s+(pallar|stolar|sittplatser|personer)\b", re.I)

# ☠️ HJULGRINDEN ÄR NEGATIV: inget av de åtta seten har hjul.
HJUL = re.compile(r"\bhjul\w*|länkhjul|bromsad\w*\b", re.I)

# ☠️ INGEN av de åtta får säga massivt trä. Leverantörens materialrad säger
#    `Spanplatte` eller `MDF` på varenda en — träet är ett TRYCK, inte en
#    planka.
MASSIVT = re.compile(r"\bmassiv\w*\b", re.I)
FAR_SAGA_MASSIVT = set()

# ☠️ HÖJDJUSTERING. Barstolar är ofta höj- och sänkbara; ingen av de åtta är
#    det, och det är den första frågan en barbordsköpare ställer.
# ☠️ `höj- och sänkbar` bär BÅDE bindestreck och "och". Ett mönster med
#    `\s*(och|-)?\s*` släpper bara ETT av dem igenom och kunde därför aldrig
#    fyra på den vanligaste svenska formen. Självtestet fångade det.
HOJDJUST = re.compile(r"\b(höj\w*[\s-]*(och[\s-]*)?sänkbar\w*|justerbar\s+höjd|"
                      r"gaslift|höjdjuster\w*)\b", re.I)

STAVFEL = ["dögn", "engangs", "ihopsatt", "för hard", "hopfälbar", "barbor ",
           "sitthöj ", "ryggsöd", "ryggstöt", "melamin belagd", "stoppad sist",
           "fotstö ", "hyllpan", "träopik", "ekopik", "pallr ", "stolr "]

# ☠️ HOMOGLYFER, DELORD och färgkontrollen bor i `grindar.py`. De låg som
#    LOKALA KOPIOR i runda 119 och i det här filens första utkast — och en
#    lokal kopia är exakt den form husets vanligaste bugg tar. Namnen behålls
#    här som alias så att `alt.py` och självtesten kan nå dem via `grind.`.
TILLATNA_TECKEN = G.TILLATNA_TECKEN
homoglyfer = G.homoglyfer
DELORD = G.DELORD
fargfel = G.fargfel


def _tal(txt):
    return re.findall(r"\d+(?:,\d+)?", txt)


def _tillatna_farger(pid):
    """Färgord som PRODUKTENS EGEN data belägger."""
    d = M.M[pid]
    kalla = " ".join(str(d.get(k) or "") for k in
                     ("farg", "farg_lang", "yta", "material")).lower()
    return {f for f in G.FARGORD if f in kalla}




def granska(pid):
    fel = []
    namn, slug, titel, meta, sokord, html = T.bygg(pid)
    syn = G.synlig_meningstext(html)
    d = M.M[pid]

    # ☠️ En korshänvisning bär GRANNENS egenskaper. Produktegna grindar körs
    #    på `egna`, länkmeningarna prövas mot MÅLETS facit.
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

    # 2. Huvudordet i namn, titel och slug
    huvud = sokord[0].split()[0].lower()
    hslug = huvud.replace("ä", "a").replace("å", "a").replace("ö", "o")
    if huvud not in namn.lower():
        fel.append(f"HUVUDORDET {huvud!r} saknas i namnet")
    if huvud not in titel.lower():
        fel.append(f"HUVUDORDET {huvud!r} saknas i titeln")
    if hslug not in slug:
        fel.append(f"HUVUDORDET {hslug!r} saknas i sluggen")

    # 3. Homoglyfer i allt som når kunden.
    for falt, text in (("namn", namn), ("titel", titel), ("meta", meta),
                       ("brödtext", syn), ("sökord", " ".join(sokord))):
        for ch, kodnamn, sammanhang in homoglyfer(text):
            fel.append(f"FRÄMMANDE TECKEN i {falt}: {ch!r} ({kodnamn}) "
                       f"— …{sammanhang.strip()}…")

    # 4. Förbjudet och ton
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

    # 5. Egenskaper som bara vissa har — på sidans EGNA meningar
    for monster, agare, etikett in ENSKILDA:
        m = monster.search(egna)
        if m and pid not in agare:
            fel.append(f"{etikett} på en produkt som inte har det: "
                       f"…{G.mening_kring(egna, m.start()).strip()[:110]}…")
    for mal, mening in kors:
        malpids = {p for p in M.ALLA if T.SLUG[p] in mal}
        for monster, agare, etikett in ENSKILDA:
            # ☠️ NEGATIONEN GÄLLER ÄVEN I EN LÄNKMENING. "samma bredd UTAN
            #    hylla" nämner hyllan för att förneka den, och en `search`
            #    läser det som ett påstående — grinden fällde två korrekta
            #    sidor. Samma familj som runda 114:s falska godkännande, fast
            #    åt andra hållet: där ursäktade en negation ett löfte, här
            #    fällde en negation ett korrekt nekande.
            if (G.loftestraff(monster, mening) and malpids
                    and not (malpids & agare)):
                fel.append(f"KORSLÄNK påstår {etikett} om {sorted(malpids)}: "
                           f"…{mening.strip()[:110]}…")

    # 6. Antalet sittplatser
    if d["sittplatser"] == 4:
        if TVA_SITS.search(egna):
            fel.append("TVÅ SITTPLATSER på ett set med fyra")
    else:
        if FYRA_SITS.search(egna):
            fel.append("FYRA SITTPLATSER på ett set med två")

    # 6b. Hjul — ingen har några.
    m = HJUL.search(egna)
    if m:
        fel.append(f"HJUL på ett set som saknar hjul: "
                   f"…{G.mening_kring(egna, m.start()).strip()[:110]}…")

    # 6c. Höjdjustering — ingen har det.
    m = HOJDJUST.search(egna)
    if m:
        fel.append(f"HÖJDJUSTERING på en fast höjd: "
                   f"…{G.mening_kring(egna, m.start()).strip()[:110]}…")

    # 7. Materialet
    m = MASSIVT.search(egna)
    if m and pid not in FAR_SAGA_MASSIVT:
        fel.append(f"MASSIVT TRÄ: …{G.mening_kring(egna, m.start()).strip()[:110]}… "
                   f"— materialet är {d['material']}")

    # 8. ☠️ FÄRGEN. Runda 89–91 skrev fel färg tre rundor i rad, och färgsyskonen
    #    här gör risken större: `c88b5bbb` är LJUS och `63a37524` MÖRK, med i
    #    övrigt identisk text. Ett färgord som produktens egen data inte belägger
    #    fälls.
    fel += fargfel(egna, _tillatna_farger(pid), d["farg_lang"])

    # 9. Leveranslöften
    fel += G.leveransloften(egna, INGAR, pid)

    # 10. Svensk sifferstil
    if re.search(r"\d+\.\d", syn):
        fel.append("DECIMALPUNKT i stället för komma")
    if re.search(r"\d+\s*x\s*\d+", syn):
        fel.append("'x' som multiplikationstecken i stället för '×'")

    # 11. Talgrinden på ALLA fyra kundsynliga fälten, inte bara brödtexten
    #     (runda 119, uppgift #441).
    kallor = " ".join(str(v) for v in d.values()) + " " + " ".join(M.HARLEDDA)
    tillatna = set(_tal(kallor)) | set(M.RUBRIKTAL.get(pid, {}))
    # Det HÄRLEDDA benutrymmet räknas i texter.py ur två mätta tal och är
    # därför spårbart — men det står inte ordagrant i raden, så det läggs till.
    tillatna.add(str(int(round(d["bordh"] - d["sitthojd"]))))
    for falt, text in (("brödtexten", egna), ("namnet", namn), ("titeln", titel),
                       ("metan", meta), ("sluggen", slug.replace("-", " "))):
        for t in _tal(text):
            if t not in tillatna:
                fel.append(f"OSPÅRAT TAL {t!r} i {falt} — står inte i "
                           f"matt.py['{pid}']")

    # 12. Dubblerad enhet och dubblerat ord (runda 118)
    m = re.search(r"(Ø|cm|kg|mm|×)\s+\1\b", syn)
    if m:
        fel.append(f"DUBBLERAD ENHET: {m.group(0)!r} — datan bär den redan")
    m = re.search(r"\b(\w{4,})\b(?:\s+(?:i|på|med|av|och|som|den|det)\b)+\s+\1\b",
                  syn, re.I)
    if m:
        fel.append(f"DUBBLERAT ORD: {m.group(0)!r} — fältet bär redan ordet mallen "
                   f"lägger till")

    # 13. ☠️ EN DEL FÅR INTE BÄRA HELA MÖBELNS YTTERMÅTT (runda 118). Här är
    #     risken konkret: hyllan på c3bda64a är 94,5 × 29 och bordet 100 × 60.
    fotavtryck = rf"{d['bordb']}\s*×\s*{d['bordd']}"
    delord = r"hyll\w*|sits\w*|dyna\w*|ryggstöd\w*|fotstöd\w*|pall\w*|stol\w*"
    m = re.search(rf"\b({delord})\s+(?:på|om|är|mäter)\s+{fotavtryck}", egna, re.I)
    if m:
        fel.append(f"DELEN BÄR MÖBELNS YTTERMÅTT: …{m.group(0)}… — "
                   f"{d['bordb']} × {d['bordd']} är hela bordet")

    # 14. FAQ-formen: fråga och svar som TVÅ <p>
    if re.search(r"<strong>[^<]*\?</strong>(?!</p>)", html):
        fel.append("FAQ-FRÅGA sitter ihop med svaret — skriv två <p>")

    # 15. Kortets rubrik är ogranskad om den bor i texter.py utan grind.
    kicker, rubrik = T.KORT[pid]
    korttext = f"{kicker}. {rubrik}."
    for monster, etikett in FORBJUDET + TONGRINDAR:
        m = monster.search(korttext)
        if m:
            fel.append(f"KORTET, {etikett}: {m.group(0)!r}")
    for monster, agare, etikett in ENSKILDA:
        if monster.search(korttext) and pid not in agare:
            fel.append(f"KORTET, {etikett} på en produkt som inte har det: {korttext!r}")
    for ch, kodnamn, _ in homoglyfer(korttext):
        fel.append(f"KORTET, FRÄMMANDE TECKEN {ch!r} ({kodnamn})")
    for t_ in _tal(korttext):
        if t_ not in tillatna:
            fel.append(f"KORTET, OSPÅRAT TAL {t_!r}")

    # 16. Stavfel
    for ord_ in STAVFEL:
        if ord_ in syn.lower():
            fel.append(f"STAVFEL {ord_!r}")

    # 17. Korslänkarnas mål måste finnas — en död länk är värre än ingen.
    kanda = set(T.SLUG.values())
    for s, _text in T.KORSLANK.get(pid, []):
        if s == slug:
            fel.append(f"KORSLÄNK till SIG SJÄLV: {s!r}")
        if s not in kanda:
            fel.append(f"KORSLÄNK till OKÄND SLUG: {s!r}")

    # 18. ☠️ SÄKERHETSSIFFRAN MÅSTE STÅ I TEXTEN. Steg 2 säger att bordslasten
    #     ska skrivas som ett positivt villkor med egen rubrik. En grind som
    #     bara vaktar mot FEL siffra hade tigit om siffran saknades helt.
    if "Så mycket tål bordet" not in html:
        fel.append("SÄKERHETSRUBRIKEN saknas — Steg 2 kräver egen rubrik")
    if d["bordlast"] not in egna:
        fel.append(f"BORDSLASTEN {d['bordlast']!r} står inte i brödtexten")
    if d["sitslast"] not in egna:
        fel.append(f"SITSLASTEN {d['sitslast']!r} står inte i brödtexten")
    return fel


# ── Självtest ──────────────────────────────────────────────────────────────
def byggartest():
    """Prövar NORMALISERINGEN, inte utfallet (runda 118)."""
    fel = []
    for pid in M.ALLA:
        _, _, _, _, _, html = T.bygg(pid)
        for m in re.finditer(r"<li>(.)", html):
            if m.group(1).isalpha() and not m.group(1).isupper():
                fel.append(f"{pid}: punkt börjar med gemen {m.group(1)!r}")
        for m in re.finditer(r"</strong></p><p>(.)", html):
            if m.group(1).isalpha() and not m.group(1).isupper():
                fel.append(f"{pid}: FAQ-svar börjar med gemen {m.group(1)!r}")
    return fel


FALL = [
    ("husmärke", "441d2209", lambda h: h + "<p>Tillverkad av HOMCOM.</p>", "HUSMÄRKE"),
    ("leveransland", "441d2209", lambda h: h + "<p>Skickas från Tyskland.</p>", "LEVERANSLAND"),
    ("attribution", "441d2209", lambda h: h + "<p>Leverantören anger 20 kg.</p>", "ATTRIBUTION"),
    ("tyskt ord", "441d2209", lambda h: h + "<p>Ett Bartisch.</p>", "TYSKT ORD"),
    ("engelsk enhet", "441d2209", lambda h: h + "<p>Skivan tål 374 lbs.</p>", "ENGELSK ENHET"),
    ("superlativ", "441d2209", lambda h: h + "<p>Marknadens bästa barbord.</p>", "SUPERLATIV"),
    ("härdat glas", "441d2209", lambda h: h + "<p>Skivan är i härdat glas.</p>", "HÄRDNING"),
    ("störst i sortimentet", "c3bda64a",
     lambda h: h + "<p>Det största barbordet i sortimentet.</p>", "VÅRT EGET SORTIMENT"),
    ("den enda med", "c3bda64a",
     lambda h: h + "<p>Den enda med två hyllplan.</p>", "VÅRT EGET SORTIMENT"),
    ("massivt trä", "441d2209", lambda h: h + "<p>Skivan är massiv ek.</p>", "MASSIVT TRÄ"),
    # ☠️ Fallet som köpte den tomma ägarmängden: leverantören SÄGER utomhus.
    ("utomhus på MDF-setet", "3b38e191",
     lambda h: h + "<p>Setet passar även utomhus.</p>", "UTOMHUSBRUK"),
    ("utomhus på ett annat set", "441d2209",
     lambda h: h + "<p>Bordet tål att stå på balkongen.</p>", "UTOMHUSBRUK"),
    ("ryggstöd på fel produkt", "441d2209",
     lambda h: h + "<p>Pallarna har ryggstöd.</p>", "RYGGSTÖD"),
    ("förvaring på fel produkt", "441d2209",
     lambda h: h + "<p>Under skivan sitter en hylla.</p>", "FÖRVARING"),
    ("stoppad sits på fel produkt", "441d2209",
     lambda h: h + "<p>Sitsen är stoppad med skumplast.</p>", "STOPPAD SITS"),
    ("marmor på fel produkt", "441d2209",
     lambda h: h + "<p>Skivan är i marmoroptik.</p>", "MARMOROPTIK"),
    ("fotstöd på fel produkt", "441d2209",
     lambda h: h + "<p>Pallen har fotstöd.</p>", "FOTSTÖD"),
    ("fyra sittplatser på tvåset", "441d2209",
     lambda h: h + "<p>Fyra pallar ingår.</p>", "FYRA SITTPLATSER"),
    ("två sittplatser på fyraset", "c88b5bbb",
     lambda h: h + "<p>Två pallar ingår.</p>", "TVÅ SITTPLATSER"),
    ("hjul på ett set utan hjul", "441d2209",
     lambda h: h + "<p>Bordet står på fyra hjul.</p>", "HJUL"),
    ("höjdjustering", "441d2209",
     lambda h: h + "<p>Pallarna är höj- och sänkbara.</p>", "HÖJDJUSTERING"),
    ("fel färg, del efter färg", "441d2209",
     lambda h: h + "<p>En röd skiva på svart ram.</p>", "FÄRGORD"),
    ("fel färg, färg efter del", "441d2209",
     lambda h: h + "<p>Skivan är röd.</p>", "FÄRGORD"),
    ("ospårat tal", "441d2209", lambda h: h + "<p>Den väger 77 kg.</p>", "OSPÅRAT TAL"),
    ("decimalpunkt", "441d2209", lambda h: h + "<p>Skivan är 1.5 cm tjock.</p>",
     "DECIMALPUNKT"),
    ("x i stället för ×", "441d2209", lambda h: h + "<p>Måttet är 80 x 50.</p>", "'x' som"),
    ("dubblerad enhet", "441d2209", lambda h: h + "<p>Bordet är 80 cm cm brett.</p>",
     "DUBBLERAD ENHET"),
    ("dubblerat ord", "441d2209", lambda h: h + "<p>Skiva i skiva i ek.</p>",
     "DUBBLERAT ORD"),
    ("delen bär yttermåttet", "c3bda64a",
     lambda h: h + "<p>Hyllan mäter 100 × 60 cm.</p>", "DELEN BÄR"),
    ("leveranslöfte", "441d2209", lambda h: h + "<p>Fyra glas ingår i leveransen.</p>",
     "LEVERANSLÖFTE"),
    ("stavfel", "441d2209", lambda h: h + "<p>Ett engangsjobb.</p>", "STAVFEL"),
    ("intern jargong", "441d2209", lambda h: h + "<p>Den här rundan.</p>", "JARGONG"),
    ("relativ länk", "441d2209", lambda h: h + '<a href="/produkt/x">X</a>', "RELATIV LÄNK"),
    ("br-tagg", "441d2209", lambda h: h + "<p>En rad<br>en till.</p>", "WIX STRIPPAR"),
    ("kyrilliskt a", "441d2209", lambda h: h + "<p>Bordet är brа.</p>",
     "FRÄMMANDE TECKEN"),
    ("grekiskt o", "441d2209", lambda h: h + "<p>Bordet är stοrt.</p>",
     "FRÄMMANDE TECKEN"),
    ("skriver att vi inte vet", "441d2209",
     lambda h: h + "<p>Vikten anges inte.</p>", "SKRIVER ATT VI INTE VET"),
    # ☠️ Korslänken får inte ljuga om GRANNEN heller.
    ("korslänk ljuger om grannen", "441d2209",
     lambda h: h + '<p><a href="https://www.fyndplats.se/produkt/'
     'barbord-fyra-pallar-ljus-ekoptik">Barbord med ryggstöd</a>.</p>',
     "KORSLÄNK påstår RYGGSTÖD"),
]

# ☠️ FÄLTFALL — självtestet måste kunna skada namn/slug/titel/meta, annars
#    bevisar det ingenting om grinderna som vaktar dem (uppgift #441).
#    Index: 0 namn, 1 slug, 2 titel, 3 meta.
FALTFALL = [
    ("ospårat tal i namnet", "441d2209", 0,
     lambda v: v.replace("80 cm", "82 cm"), "OSPÅRAT TAL '82' i namnet"),
    ("ospårat tal i titeln", "441d2209", 2,
     lambda v: v.replace("80 cm", "82 cm"), "OSPÅRAT TAL '82' i titeln"),
    ("ospårat tal i metan", "441d2209", 3,
     lambda v: v.replace("20 kg", "82 kg"), "OSPÅRAT TAL '82' i metan"),
    ("ospårat tal i sluggen", "441d2209", 1,
     lambda v: v.replace("80-cm", "82-cm"), "OSPÅRAT TAL '82' i sluggen"),
    ("för långt namn", "441d2209", 0, lambda v: v + " " + "x" * 40, "NAMNET är"),
    ("för lång titel", "441d2209", 2, lambda v: v + " " + "x" * 40, "TITELN är"),
    ("slug med versal", "441d2209", 1, lambda v: v.upper(), "SLUGGEN är inte ren"),
    ("huvudordet faller ur namnet", "441d2209", 0,
     lambda v: v.replace("Barbord", "Ståbord"), "HUVUDORDET"),
    ("orört namn släpps igenom", "441d2209", 0, lambda v: v, None),
]


def faltsjalvtest():
    fel = []
    import texter
    original = texter.bygg
    for namn, pid, idx, skada, vantat in FALTFALL:
        def trasig(p, _i=idx, _s=skada, _o=original):
            rad = list(_o(p))
            rad[_i] = _s(rad[_i])
            return tuple(rad)
        texter.bygg = trasig
        try:
            ut = granska(pid)
        finally:
            texter.bygg = original
        traff = any(vantat in x for x in ut) if vantat else False
        if vantat and not traff:
            fel.append(f"{namn}: grinden SÅG DET INTE (fick {ut[:2]})")
        if vantat is None and ut:
            fel.append(f"{namn}: grinden FÄLLDE ett korrekt fall ({ut[:2]})")
    return fel


def sjalvtest():
    fel = []
    import texter
    original = texter.bygg
    for namn, pid, skada, vantat in FALL:
        def trasig(p, _s=skada, _o=original):
            n, sl, t, m, k, h = _o(p)
            return (n, sl, t, m, k, _s(h))
        texter.bygg = trasig
        try:
            ut = granska(pid)
        finally:
            texter.bygg = original
        if not any(vantat in x for x in ut):
            fel.append(f"{namn}: grinden SÅG DET INTE (fick {ut[:2]})")
    return fel


if __name__ == "__main__":
    tot = 0
    for pid in M.ALLA:
        f = granska(pid)
        tot += len(f)
        print(("FEL " if f else "OK  ") + pid + "  " + T.SLUG[pid])
        for x in f:
            print("      ✗", x)
    bt = byggartest()
    st = sjalvtest()
    ft = faltsjalvtest()
    print(f"\nbyggartest: {len(bt)} fel")
    for x in bt:
        print("  ☠️", x)
    print(f"självtest: {len(FALL)} fall, {len(st)} fel")
    for x in st:
        print("  ☠️", x)
    print(f"fältsjälvtest: {len(FALTFALL)} fall, {len(ft)} fel")
    for x in ft:
        print("  ☠️", x)
    print(f"\n{len(M.ALLA)} produkter, {tot} fel")
    sys.exit(1 if (tot or st or bt or ft) else 0)
