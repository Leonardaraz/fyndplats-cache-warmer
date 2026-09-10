# -*- coding: utf-8 -*-
"""Runda 125 textgrind — körs på FILEN, före varje API-anrop.

Maskineriet delas med runda 115–124 via `grindar.py`. Det som är NYTT här:

  1. ☠️ **LÅDANTALSGRINDEN är negativ mot PAKETMÅTTET, inte mot namnet.**
     Runda 124:s variant fällde på leverantörens felräknade produktnamn.
     Här är felkällan en annan: `35b4fba0`, `bc698424` och `f4fabca6` bär
     ALLA `Paketmått 66,5 × 38,5 × 73` och `Produktmaße 69 × 33 × 75` — samma
     kartong och samma stomme för 5 respektive 7 lådor. Grinden kräver rätt
     tal och FÖRBJUDER de andra tre talen i familjen.
  2. ☠️ **LÅSGRINDEN har tre besked, inte två.** Sex sidor har cylinderlås
     MED två nycklar i leveransen. `5910cd6f` har cylinderlås men listar
     INGA nycklar — den får därför inte lova några. `6c9d7288` och
     `5745c3cb` har inget lås alls och får inte antyda något.
  3. ☠️ **MATERIALGRINDEN.** `5745c3cb`s spec-block säger `Kunststoff`;
     brödtexten och den tyska specen säger stål. Grinden kräver att stål
     står som stomme och förbjuder plast som huvudmaterial.
  4. ☠️ **FÄRGGRINDEN HAR TVÅ NIVÅER**, som runda 124: syskonets färg får
     nämnas i brödtexten, men NAMN, TITEL och META måste bära produktens
     egen färg och ingen annans. Fyra färgpar gör riktningen skarp.
  5. **UTDRAGSGRINDEN, bara `bdd01b5f`.** Arbetsytan går 70 → 130 cm. Båda
     talen måste stå, och sidan måste varna för tyngdpunkten — en utdragen
     yta som lastas i ytterkant tippar vagnen.
"""
import re
import sys

sys.path.insert(0, "..")

import grindar as G          # noqa: E402
import texter as T           # noqa: E402

# Lås: cylinderlås med två nycklar i leveransen.
NYCKLAR = {"3659a7eb", "35b4fba0", "bc698424", "f4fabca6",
           "1b534b0e", "5447468e"}
# ☠️ Lås men INGA nycklar i LIEFERUMFANG — får inte lova några. `bdd01b5f`
#    hamnade här EFTER att grinden fällt den: brödtexten säger "mit zwei
#    Schlüsseln", leveranslistan säger bara vagn och anvisning. Runbookens
#    regel: `Lieferumfang` är kontraktet, brödtexten är marknadsföring.
LAS_UTAN_NYCKEL = {"5910cd6f", "bdd01b5f"}
# Inget lås alls.
UTAN_LAS = {"6c9d7288", "5745c3cb"}

LADOR = {"6c9d7288": 1, "3659a7eb": 5, "bdd01b5f": 2, "5745c3cb": 2,
         "35b4fba0": 5, "bc698424": 7, "f4fabca6": 7, "1b534b0e": 5,
         "5447468e": 5, "5910cd6f": 6}

RAKNEORD = {1: "en", 2: "två", 3: "tre", 4: "fyra", 5: "fem",
            6: "sex", 7: "sju", 8: "åtta"}

LAST = {"6c9d7288": "60", "3659a7eb": "130", "bdd01b5f": "80", "5745c3cb": "45",
        "35b4fba0": "150", "bc698424": "150", "f4fabca6": "150",
        "1b534b0e": "20", "5447468e": "20", "5910cd6f": "100"}

# ☠️ HUVUDFÄRGEN kräver sluggen — och BARA den får krävas i namn/titel/meta.
#    Fyra av tio har ingen färg i sluggen (`verktygsvagn-overkista`,
#    `verkstadsvagn-utdragbar`, `verktygslada-set-3-delar`, och de är
#    tvåfärgade utan färgsyskon). Ett krav på färg i namnet hade fällt dem
#    trots att de är korrekta — grinden ska mäta det sluggen LOVAR.
FARG = {"6c9d7288": {"blå"}, "3659a7eb": set(), "bdd01b5f": set(),
        "5745c3cb": set(), "35b4fba0": {"röd"}, "bc698424": {"svart"},
        "f4fabca6": {"röd"}, "1b534b0e": {"blå"}, "5447468e": {"svart"},
        "5910cd6f": {"röd"}}
# Produktens ÖVRIGA egna färger — tillåtna överallt, krävs ingenstans.
DELFARG = {"6c9d7288": {"svart"}, "3659a7eb": {"svart", "röd"},
           "bdd01b5f": {"svart"}, "5745c3cb": {"röd", "svart"},
           "5910cd6f": set(), "35b4fba0": set(), "bc698424": set(),
           "f4fabca6": set(), "1b534b0e": set(), "5447468e": set()}
# Syskonets färg — får nämnas i brödtexten, aldrig i namn/titel/meta.
SYSKONFARG = {"35b4fba0": {"svart", "blå"}, "bc698424": {"röd"},
              "f4fabca6": {"svart"}, "1b534b0e": {"svart"},
              "5447468e": {"blå"}, "6c9d7288": {"röd"},
              "3659a7eb": set(), "5910cd6f": set(), "bdd01b5f": set(),
              "5745c3cb": set()}

FORBJUDET = [
    (re.compile(r"\b(homcom|outsunny|pawhut|aiyaplay|vinsetto|aosom|dewalt|"
                r"bosch|makita|skil)\b", re.I), "HUSMÄRKE ELLER TREDJEPARTSMÄRKE"),
    (G.ARTNR, "ARTIKELNUMMER"),
    (re.compile(r"\b(tyskland|kina|polen|spanien|eu-lager|skickas\s+från|"
                r"fraktas\s+från)\b", re.I), "LEVERANSLAND"),
    (re.compile(r"\bleverantör\w*\b|\btillverkar(en|ens)\b", re.I),
     "ATTRIBUTION — mot kunden är VI leverantören"),
    (G.JARGONG, "INTERN JARGONG"),
    (re.compile(r"<br\s*/?>", re.I), "WIX STRIPPAR <br>"),
    (re.compile(r'href="(?!https://www\.fyndplats\.se/)', re.I),
     "RELATIV LÄNK — Wix skriver om den till https:/ med ETT snedstreck"),
    (re.compile(r"\b(werkzeug\w*|werkstatt\w*|schublade\w*|belastbarkeit|"
                r"farbe|gewicht|kunststoff|stahl|lieferumfang|montage|"
                r"abmessungen|griff|schwarz|kugellager|rollen|räder|"
                r"abschließbar|staufach|schlüssel|lochwand|tablett)\b",
                re.I), "TYSKT ORD"),
    (re.compile(r"\b\d+\s*(lbs?|inch|inches|ft|gal)\b", re.I), "ENGELSK ENHET"),
    # ☠️ Ingen av de tio är rostfri. Alla är lackerat eller pulverlackerat stål.
    (re.compile(r"\brostfri\w*|\brostfritt\b|\brostar\s+(inte|aldrig)\b|"
                r"\brostsäker\w*", re.I), "ROSTFRI LÖGN"),
    (re.compile(r"\d\s*[x×]\s*\d.*?\bx\b\s*\d"), "x SOM GÅNGERTECKEN"),
    (re.compile(r"(?<!\d)\d+\.\d+(?!\d)"), "DECIMALPUNKT"),
    (re.compile(r"\b\d+(?:,\d+)?\s*,\s*\d+(?:,\d+)?\s+och\s+\d+(?:,\d+)?\s*(cm|kg|liter)\b"),
     "KOMMALISTA MED ENHETEN SIST"),
]

TONGRINDAR = [
    (re.compile(r"\b(marknadens|världens|bäst[ae]|överlägsen|oslagbar|"
                r"perfekt|revolutioner\w*|störst[ae])\b", re.I),
     "OGRUNDAD SUPERLATIV"),
    (re.compile(r"\b(\w+ast[ae]?|störst\w*|minst\w*|flest\w*|enda|bäst\w*|sämst\w*)\b"
                r"[^.!?]{0,40}\b(i\s+)?(sortimentet|katalogen|butiken|hos\s+oss)\b",
                re.I), "PÅSTÅENDE OM VÅRT EGET SORTIMENT"),
    (re.compile(r"\b(certifierad|ce-märkt|godkänd\s+enligt|testad\s+enligt)\b", re.I),
     "OGRUNDAD CERTIFIERING"),
    (re.compile(r"\b(mät|väg|kontrollera)\s+(din|ditt|dina)\b", re.I),
     "BER KUNDEN MÄTA"),
    (re.compile(r"\b(livstid\w*\s+garanti|håller\s+för\s+alltid|"
                r"går\s+aldrig\s+sönder|obegränsad)\b", re.I),
     "HÅLLBARHETSLÖFTE UTAN TÄCKNING"),
    (re.compile(r"\b(stöldsäker\w*|inbrottssäker\w*|går\s+inte\s+att\s+bryta"
                r"|omöjlig\w*\s+att\s+öppna)\b", re.I),
     "SÄKERHETSLÖFTE UTAN TÄCKNING"),
]

TILLATNA_KALLTECKEN = set(
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "åäöÅÄÖéÉüÜ0123456789 \t\n\r"
    "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~×–—…°²³·§"
    "☠️\U0001f512⚠✅")


def kallkodssvep():
    """Fäller på varje tecken i texter.py som inte hör hemma i svensk text."""
    import unicodedata
    kod = open("texter.py", encoding="utf-8").read()
    fel = []
    for i, ch in enumerate(kod):
        if ch in TILLATNA_KALLTECKEN:
            continue
        fel.append(f"FRÄMMANDE TECKEN {hex(ord(ch))} "
                   f"{unicodedata.name(ch, '?')} — "
                   f"…{kod[max(0, i - 30):i + 20]}…".replace("\n", " "))
    return fel


def _text(pid):
    """All kundtext: namn, titel, meta, sökord OCH brödtext (uppgift #441)."""
    return G.synlig_meningstext(
        T.bygg(pid) + f"<p>{T.NAMN[pid]}</p><p>{T.TITEL[pid]}</p>"
        f"<p>{T.META[pid]}</p><p>{' '.join(T.SOKORD[pid])}</p>")


def granska(pid):
    html = T.bygg(pid)
    txt = _text(pid)
    fel = []

    for monster, etikett in FORBJUDET + TONGRINDAR:
        for m in monster.finditer(txt):
            fel.append(f"{etikett}: …{G.mening_kring(txt, m.start())}…")

    # Källgrinden kontrollerar <h2>-ordningen — `G.flikfel` är byggd för den
    # RENDERADE sidan och fäller varje korrekt källtext.
    rubriker = re.findall(r"<h2>(.*?)</h2>", html)
    if "Användning och skötsel" not in rubriker:
        fel.append(f"FLIKRUBRIKEN saknas eller stavas fel — {rubriker}")
    if "Tekniska specifikationer" in rubriker and "Passar inte den här?" in rubriker:
        if rubriker.index("Passar inte den här?") > rubriker.index("Tekniska specifikationer"):
            fel.append("KORSLÄNKARNA ligger EFTER spec-fliken — de hamnar inne i den")

    # ☠️ ANKARSPLITTEN LIGGER FÖRE LÅS-, LÅD- OCH FÄRGGRINDEN, med flit:
    #    alla tre talar om EGENSKAPER, och en korslänk beskriver syskonets.
    egna_rader, _ = G.dela_pa_ankare(html)
    egna = G.synlig_meningstext(" ".join(egna_rader))

    # ☠️ LÅSGRINDEN, tre besked som utesluter varandra.
    if pid in NYCKLAR:
        if not re.search(r"\b(cylinderlås|centrallås|nyckellås)\b", egna, re.I):
            fel.append("LÅSGRINDEN: sidan säger inte HUR den låses")
        if not re.search(r"två\s+nycklar[^.!?]{0,30}(ingår|följer|medföljer)"
                         r"|(ingår|följer|medföljer)[^.!?]{0,30}två\s+nycklar",
                         egna, re.I):
            fel.append("LÅSGRINDEN: sidan säger inte att två nycklar ingår")
        if re.search(r"hänglås", egna, re.I):
            fel.append("LÅSGRINDEN: den här har cylinderlås, inte hänglåsögla")
    elif pid in LAS_UTAN_NYCKEL:
        if not re.search(r"\b(cylinderlås|centrallås|nyckellås)\b", egna, re.I):
            fel.append("LÅSGRINDEN: sidan säger inte HUR den låses")
        if re.search(r"\bnyck(el|lar)\w*\s*[^.!?]{0,30}\b(ingår|följer|medföljer)"
                     r"(?!\s+(inte|ej))", egna, re.I):
            fel.append("LÅSGRINDEN: leveransen listar INGA nycklar — lova inga")
    else:
        for m in re.finditer(r"hänglås|nyckellås|cylinderlås|centrallås|låsbar",
                             egna, re.I):
            fel.append(f"LÅSGRINDEN: modellen har inget lås — "
                       f"…{G.mening_kring(egna, m.start())}…")

    # ☠️ LÅDANTALSGRINDEN. Positiv på rätt tal, negativ på familjens andra.
    n = LADOR[pid]
    ratt = RAKNEORD[n]
    # ☠️ SIFFRAN FÅR INTE PLOCKAS UR ETT DECIMALTAL. `\b7\b` matchar sjuan i
    #    "25,7 kg" — kommatecknet är en ordgräns — så antalsgrinden godkände
    #    en muterad sida som sa "fem lådor" om en sjulådig vagn. Uppmätt i
    #    runda 125:s mutationstest, och det var mutationen som hittade det.
    def tal(x):
        return rf"(?:\b{RAKNEORD[x]}\b|(?<![\d,]){x}(?![\d,]))"

    # Talet får stå på båda sidor om substantivet: spec-raden heter
    # "Antal lådor: 5", brödtexten "fem lådor".
    if not (re.search(rf"{tal(n)}[^.!?]{{0,30}}\blåd", egna, re.I)
            or re.search(rf"\blådor\b[^.!?]{{0,12}}{tal(n)}", egna, re.I)):
        fel.append(f"LÅDANTALET {n} står inte på sidan")

    # ☠️ UNDANTAGET MÄTS VID TRÄFFEN, INTE I MENINGEN. En mening som råkar
    #    innehålla ordet "djupa" gjorde HELA meningen fri — och den muterade
    #    raden "Fem lådor: två grunda … och fem djupa …" slapp därför förbi
    #    med fel TOTAL. Kvalificeraren måste sitta på själva talet:
    #    "två grunda lådor" är en delmängd, "fem lådor:" är en total.
    DEL_EFTER = r"(?:grunda|djupa|små|stora|breda)\s+"
    #    ⚠️ DELNAMNET STÅR OFTA I MENINGENS BÖRJAN, inte intill talet:
    #    "Rullskåpet mäter 60,5 × 33 × 76 cm med handtag och hjul, och har två
    #    lådor" har fyrtio tecken emellan. Prefixet mäts därför till MENINGENS
    #    början — men bara framåt: en total ("Fem lådor: två grunda …") har
    #    inget delnamn före sig och fälls fortfarande.
    DELNAMN = (r"\b(?:överkist\w*|rullskåp\w*|mellankist\w*|mittkist\w*|"
               r"kistan|kistans|skåpet|skåpets|underdel\w*|per|varje|"
               r"drar?\s+ut|dra\s+ut|öppna\w*)\b")
    for fel_n in sorted(set(LADOR.values())):
        if fel_n == n:
            continue
        for m in re.finditer(rf"{tal(fel_n)}\s+({DEL_EFTER})?låd", egna, re.I):
            if m.group(1):                       # "två grunda lådor" = delmängd
                continue
            a = max(egna.rfind(".", 0, m.start()), egna.rfind(":", 0, m.start()),
                    egna.rfind("?", 0, m.start()))
            if re.search(DELNAMN, egna[a + 1:m.start()], re.I):
                continue
            mening = G.mening_kring(egna, m.start())
            fel.append(f"FEL LÅDANTAL {fel_n} (rätt är {n}) — …{mening}…")

    # Lastgrinden är POSITIV: talet är verifierat mot källan.
    if not re.search(rf"\b(tål|bär)\b[^.!?]{{0,80}}\b{LAST[pid]}\s*(kg|kilo)",
                     txt, re.I):
        fel.append(f"LASTGRINDEN: sidan säger inte att den tål {LAST[pid]} kg")

    # ☠️ Rostgrinden: nämns rost måste det kvalificeras.
    for m in re.finditer(r"\brost\w*", txt, re.I):
        mening = G.mening_kring(txt, m.start())
        if not re.search(r"lack|pulverlack|så\s+länge|hel\b|repa|angriper",
                         mening, re.I):
            fel.append(f"ROSTGRINDEN: okvalificerat rostpåstående — …{mening}…")

    # ☠️ MATERIALGRINDEN — `5745c3cb`s spec-block säger plast, stommen är stål.
    if pid == "5745c3cb":
        if not re.search(r"\bstål\w*\b", egna, re.I):
            fel.append("MATERIALGRINDEN: stommen är STÅL och sidan säger det inte")
        for m in re.finditer(r"\bplast\w*\b", egna, re.I):
            mening = G.mening_kring(egna, m.start())
            if not re.search(r"stål[^.!?]{0,40}plast|plastdetalj", mening, re.I):
                fel.append(f"MATERIALGRINDEN: plast utan stålet bredvid — …{mening}…")

    # ☠️ UTDRAGSGRINDEN, bara bdd01b5f.
    if pid == "bdd01b5f":
        for tal in ("70", "130"):
            if not re.search(rf"\b{tal}\s*(cm|centimeter)", egna, re.I):
                fel.append(f"UTDRAGSGRINDEN: måttet {tal} cm saknas")
        if not re.search(r"tyngdpunkt|utanför\s+hjulen|lasta\w*\s+lättare|"
                         r"belasta\w*\s+.{0,20}lättare", egna, re.I):
            fel.append("UTDRAGSGRINDEN: sidan varnar inte för tyngdpunkten "
                       "när arbetsytan är utdragen")

    # Tillbehörsgrinden: livsstilsbilderna visar verktyg som inte ingår.
    if not re.search(r"verktyg\w*[^?!.]{0,60}bilder\w*\s*\?\s*Nej\b"
                     r"|verktyg\w*[^.!?]{0,90}(ingår\s+(inte|ej)|"
                     r"medföljer\s+inte|köper\s+du\s+separat|säljs\s+separat)",
                     txt, re.I):
        fel.append("TILLBEHÖRSGRINDEN: livsstilsbilden visar verktyg som inte "
                   "ingår, och sidan säger det inte")

    # ☠️ FÄRGGRINDEN, två nivåer.
    egen = FARG[pid]
    syskon = SYSKONFARG.get(pid, set())
    kort = f"{T.NAMN[pid]} {T.TITEL[pid]} {T.META[pid]}"
    # ☠️ MÖNSTRET KOMMER FRÅN `G.fargformer`, inte från en egen `\w*`.
    #    `röd\w*` matchar inte `rött`, och den sidan heter "Rött verktygsskåp".
    for f in egen:
        if not re.search(G.fargformer(f), kort, re.I):
            fel.append(f"FÄRGGRINDEN: egen färg {f!r} saknas i namn/titel/meta")
    for f in G.FARGORD:
        if f in egen or f in DELFARG.get(pid, set()):
            continue
        for m in re.finditer(G.fargformer(f), kort, re.I):
            fel.append(f"FÄRGGRINDEN: FRÄMMANDE FÄRG {f!r} i namn/titel/meta "
                       f"— …{G.mening_kring(kort, m.start())}…")
        if f in syskon:
            continue
        for m in re.finditer(G.fargformer(f), egna, re.I):
            mening = G.mening_kring(egna, m.start())
            # silverfärgad/förkromad detalj är inte produktens färg
            if re.search(r"slist|skena|handtag|nyckel|krom", mening, re.I):
                continue
            fel.append(f"FÄRGORD {f!r} som varken är egen eller syskonets "
                       f"— …{mening}…")

    fel += [f"HOMOGLYF {c} ({n}) — …{s}…" for c, n, s in G.homoglyfer(txt)]
    fel += [f"NAMNGRIND: {p}" for p in G.granska_namn(T.NAMN[pid])]
    fel += [f"LEVERANSLÖFTE: {p}" for p in G.leveransloften(
        txt, [v for e, v in T.SPEC[pid] if e == "Ingår"], nyckel=pid)]
    return fel


SJALVTEST = [
    ("husmärke", "Vagnen är en HOMCOM-modell.", True),
    ("tredjepartsmärke", "Passar DeWalt-maskiner.", True),
    ("artikelnummer", "Modellen heter 845-030CG.", True),
    ("leveransland", "Skickas från Tyskland inom en vecka.", True),
    ("attribution", "Leverantören anger 150 kg.", True),
    ("tyskt ord", "Fyra Schubladen på kullagerskenor.", True),
    ("rostfri", "Stålet är rostfritt och rostar aldrig.", True),
    ("decimalpunkt", "Lådan är 8.5 cm djup.", True),
    ("x som gångertecken", "Måtten är 69 x 33 x 75 cm.", True),
    ("superlativ", "Marknadens bästa verktygsvagn.", True),
    ("certifiering", "Vagnen är CE-märkt enligt norm.", True),
    ("stöldsäker", "Ett stöldsäkert lås som inte går att bryta.", True),
    ("relativ länk", '<a href="/produkt/verktygsvagn">Syskonet</a>', True),
    ("engelsk enhet", "Bär upp till 330 lbs.", True),
    ("jargong", "Som vi skrev i runda 124.", True),

    ("ren mening", "Fem lådor på kullagerskenor och en bänkskiva ovanpå.", False),
    ("mått", "Vagnen mäter 69 × 33 × 75 cm och väger 24,9 kg.", False),
    ("kvalificerad rost", "Stående olja angriper plåten på sikt.", False),
    ("cylinderlås", "Ett cylinderlås stänger kistan och två nycklar ingår.", False),
    ("centrallås", "Ett centrallås stänger båda lådorna, två nycklar ingår.", False),
    ("last", "Vagnen tål 150 kg totalt och 15 kg per låda.", False),
    ("färg", "Blå stomme med svart låda och silverfärgade slister.", False),
    ("verktyg ingår inte", "Verktygen på bilderna ingår inte.", False),
    ("material", "Stålstomme med plastdetaljer och repfast lackering.", False),
    ("utdrag", "Arbetsytan drar ut från 70 till 130 centimeter.", False),
    ("skötsel", "Torka av lacken med fuktig trasa och torka torrt.", False),
    ("kullager", "Skenorna är kullagrade och drar ut hela lådan.", False),
    ("hjul", "Fyra hjul, två av dem med broms.", False),
    ("vikt", "Skåpet väger 25,7 kg och levereras omonterat.", False),
]

# ☠️ Böjningsfallen provas mot MÖNSTREN, inte mot FORBJUDET — de två
#    blindfläckarna låg i `grindar`, och ett självtest som bara läser den
#    här filens listor hade aldrig sett dem.
BOJNINGSFALL = [
    ("röd matchar rött", "röd", "Rött verktygsskåp 131 cm", True),
    ("röd matchar röda", "röd", "De röda lådfronterna", True),
    ("röd matchar INTE grönt", "grön", "Rött verktygsskåp", False),
    ("blå matchar blått", "blå", "Ett blått skåp", True),
    ("svart matchar svarta", "svart", "De svarta fronterna", True),
    ("vit matchar vitt", "vit", "Ett vitt skåp", True),
    ("nyckel matchar nycklar", None, "två nycklar och bruksanvisning", True),
    ("cykel matchar cyklar", None, "fyra cyklar", True),
]

# Sidor som INTE får fälla en viss grind — grinden får inte skrika på rätt sida.
GRANSKNINGSFALL = [
    ("nyckelbeskedet räknas som giltigt", "35b4fba0", "LÅSGRINDEN"),
    ("centrallåset räknas som cylinderlås-besked", "bdd01b5f", "LÅSGRINDEN"),
    ("lås utan nycklar får vara tyst om nycklar", "5910cd6f", "LÅSGRINDEN"),
    ("modell utan lås får vara tyst", "6c9d7288", "LÅSGRINDEN"),
    ("fem lådor godkänns", "35b4fba0", "FEL LÅDANTAL"),
    ("sju lådor godkänns", "bc698424", "FEL LÅDANTAL"),
    ("delmängder fälls inte", "1b534b0e", "FEL LÅDANTAL"),
    ("sex lådor godkänns", "5910cd6f", "FEL LÅDANTAL"),
    ("syskonets färg får nämnas i brödtexten", "35b4fba0", "FÄRGORD 'svart'"),
    ("blå är en giltig egen färg", "1b534b0e", "FÄRGGRINDEN"),
    ("stål med plastdetaljer godkänns", "5745c3cb", "MATERIALGRINDEN"),
    ("utdragsvarningen räknas", "bdd01b5f", "UTDRAGSGRINDEN"),
]


def sjalvtest():
    fel = []
    for namn, farg, txt, ska in BOJNINGSFALL:
        if farg is None:
            ordet = "nyckel" if "nyck" in txt else "cykel"
            traff = bool(re.search(G._bojningar(ordet), txt, re.I))
        else:
            traff = bool(re.search(G.fargformer(farg), txt, re.I))
        if traff != ska:
            fel.append(f"BÖJNINGSFALL {namn!r}: fick {traff}, väntade {ska}")
    for namn, txt, ska_falla in SJALVTEST:
        traff = any(m.search(txt) for m, _ in FORBJUDET + TONGRINDAR)
        if traff != ska_falla:
            fel.append(f"SJÄLVTEST {namn!r}: fick {traff}, väntade {ska_falla}")
    for namn, pid, etikett in GRANSKNINGSFALL:
        if any(etikett in f for f in granska(pid)):
            fel.append(f"GRANSKNINGSFALL {namn!r}: {etikett} fyrade på {pid}")
    return fel


if __name__ == "__main__":
    st = sjalvtest() + kallkodssvep()
    print(f"grind.sjalvtest(): "
          f"{len(SJALVTEST) + len(GRANSKNINGSFALL) + len(BOJNINGSFALL)} fall, "
          f"{len(st)} fel")
    for f in st:
        print("  ", f)
    tot = 0
    for pid in T.NAMN:
        f = granska(pid)
        tot += len(f)
        print(f"{'OK ' if not f else 'FEL'} {pid}  {T.SLUG[pid]}")
        for rad in f:
            print("     ", rad)
    print(f"\n{len(T.NAMN)} sidor, {tot} fel")
