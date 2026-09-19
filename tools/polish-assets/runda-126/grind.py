# -*- coding: utf-8 -*-
"""Runda 126 textgrind — körs på FILEN, före varje API-anrop.

Maskineriet delas med runda 115–125 via `grindar.py`. Det som är NYTT här:

  1. ☠️ **PARLASTGRINDEN.** Fyra av sex är TVÅPACK, och två av dem har två
     olika lasttal: `17e683e0` bär 250 kg per bock och 500 kg för paret,
     `ed44170a` 580 respektive 1 160 kg. Leverantörens namn på den senare
     säger `bis 1160 kg` utan att säga att det är parets summa — säljs det
     talet som "per bock" blir marginalen ett säkerhetsproblem. Grinden
     kräver att BÅDA talen står OCH att paret-talet står intill ordet
     "paret"/"båda"/"tillsammans".
  2. ☠️ **HÖJDLÄGESGRINDEN, negativ mot familjens andra tal.** Fyra, sex och
     sju lägen på tre bockar som ser likadana ut i en lista. Samma form som
     runda 125:s lådantalsgrind, inklusive decimalskyddet.
  3. ☠️ **HOPFÄLLNINGSGRINDEN.** Fem av sex viks ihop; `9e9c78b9` gör det
     INTE. En sida som antyder att den fasta bänken viks är ett löfte
     kunden upptäcker vid uppackning.
  4. ☠️ **ROSTGRINDEN ÄR POSITIV på `9e9c78b9`.** Källan påstår att
     pulverlackerat stål är rostbeständigt. Sidan måste säga att lacken
     skyddar SÅ LÄNGE DEN ÄR HEL — inte bara undvika ordet rostfri.
  5. ☠️ **KAPSÅGSNOTEN.** `4a8e7f21`s enda verkliga säkerhetsnot står i
     leverantörens text: dra ut den nedre rullbasen ~4 cm innan hopfällning.
     Den måste stå på sidan.
  6. **FÄRGGRINDEN har två nivåer**, som runda 124 och 125, och går via
     `G.fargformer` — `röd\\w*` matchar inte `rött`.
"""
import re
import sys

sys.path.insert(0, "..")

import grindar as G          # noqa: E402
import texter as T           # noqa: E402

# Tvåpack — sidan måste säga att man får TVÅ.
PAR = {"3afe7275", "17e683e0", "ed44170a"}
# Tvåpack med SKILDA lasttal per bock och för paret.
PARLAST = {"17e683e0": ("250", "500"), "ed44170a": ("580", "1 160")}
# Enstyckslast (inget partal).
ENKELLAST = {"3afe7275": "200", "4a8e7f21": "150", "941867cb": "120",
             "9e9c78b9": "240"}

LAGEN = {"3afe7275": 6, "17e683e0": 4, "ed44170a": 7}
RAKNEORD = {1: "en", 2: "två", 3: "tre", 4: "fyra", 5: "fem",
            6: "sex", 7: "sju", 8: "åtta"}

# ☠️ VIKS IHOP — och den som INTE gör det.
HOPFALLBAR = {"3afe7275", "17e683e0", "ed44170a", "4a8e7f21", "941867cb"}
FAST = {"9e9c78b9"}

# Montering: krävs / krävs inte. Positiv åt båda hållen.
UTAN_MONTERING = {"17e683e0", "ed44170a"}
MED_MONTERING = {"4a8e7f21", "941867cb", "9e9c78b9"}
# `3afe7275` säger ingenting om montering i källan — grinden kräver inget.

# ☠️ HUVUDFÄRGEN kräver sluggen — och BARA den får krävas i namn/titel/meta.
FARG = {"3afe7275": set(), "17e683e0": {"orange"}, "ed44170a": {"röd"},
        "4a8e7f21": set(), "941867cb": set(), "9e9c78b9": set()}
# Produktens ÖVRIGA egna färger — tillåtna överallt, krävs ingenstans.
DELFARG = {"3afe7275": {"svart"}, "17e683e0": {"svart"}, "ed44170a": {"svart"},
           "4a8e7f21": {"svart", "silverfärgad"}, "941867cb": {"svart"},
           "9e9c78b9": {"svart"}}
# Syskonets färg — får nämnas i brödtexten, aldrig i namn/titel/meta.
SYSKONFARG = {"3afe7275": set(), "17e683e0": {"röd"}, "ed44170a": {"orange"},
              "4a8e7f21": set(), "941867cb": set(), "9e9c78b9": set()}

FORBJUDET = [
    (re.compile(r"\b(homcom|outsunny|pawhut|aiyaplay|vinsetto|aosom|dewalt|"
                r"bosch|makita|skil|ridgid|stanley)\b", re.I),
     "HUSMÄRKE ELLER TREDJEPARTSMÄRKE"),
    (G.ARTNR, "ARTIKELNUMMER"),
    (re.compile(r"\b(tyskland|kina|polen|spanien|eu-lager|skickas\s+från|"
                r"fraktas\s+från)\b", re.I), "LEVERANSLAND"),
    (re.compile(r"\bleverantör\w*\b|\btillverkar(en|ens)\b", re.I),
     "ATTRIBUTION — mot kunden är VI leverantören"),
    (G.JARGONG, "INTERN JARGONG"),
    (re.compile(r"<br\s*/?>", re.I), "WIX STRIPPAR <br>"),
    (re.compile(r'href="(?!https://www\.fyndplats\.se/)', re.I),
     "RELATIV LÄNK — Wix skriver om den till https:/ med ETT snedstreck"),
    (re.compile(r"\b(werkbank\w*|werkstatt\w*|sägebock\w*|arbeitsbock\w*|"
                r"belastbarkeit|farbe|gewicht|kunststoff|stahl|lieferumfang|"
                r"montage|abmessungen|griff|schwarz|klappbar|rollen|räder|"
                r"lochwand|verstellbar|holz|gehrungssäge|kappsäge)\b",
                re.I), "TYSKT ORD"),
    (re.compile(r"\b\d+\s*(lbs?|inch|inches|ft|gal)\b", re.I), "ENGELSK ENHET"),
    # ☠️ Ingen av de sex är rostfri. Lackerat, pulverlackerat eller förzinkat.
    (re.compile(r"\brostfri\w*|\brostfritt\b|\brostar\s+(inte|aldrig)\b|"
                r"\brostsäker\w*|\brostbeständ\w*", re.I), "ROSTFRI LÖGN"),
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
    (re.compile(r"\b(livstid\w*\s+garanti|håller\s+för\s+alltid|"
                r"går\s+aldrig\s+sönder|obegränsad)\b", re.I),
     "HÅLLBARHETSLÖFTE UTAN TÄCKNING"),
    # ☠️ En bock som "aldrig tippar" eller "alltid står stadigt" är ett
    #    säkerhetslöfte på en produkt som bär hundratals kilo.
    (re.compile(r"\b(?:(?:aldrig|inte)\s+(?:tippar|välter|glider)"
                r"|(?:tippar|välter|glider)\s+(?:aldrig|inte)"
                r"|kan\s+inte\s+välta|alltid\s+stadig\w*)\b", re.I),
     "SÄKERHETSLÖFTE UTAN TÄCKNING"),
]

TILLATNA_KALLTECKEN = set(
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "åäöÅÄÖéÉüÜ0123456789 \t\n\r"
    "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~×–—…°²³·§Ø"
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


def _tal(x):
    """Matchar talet som SIFFRA eller RÄKNEORD — men aldrig ur ett decimaltal.
    ☠️ `\\b7\\b` matchar sjuan i `25,7 kg`; kommatecknet är en ordgräns.
    Uppmätt i runda 125:s mutationstest."""
    return rf"(?:\b{RAKNEORD[x]}\b|(?<![\d,]){x}(?![\d,]))"


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

    # ☠️ ANKARSPLITTEN LIGGER FÖRE EGENSKAPSGRINDARNA, med flit: en korslänk
    #    beskriver SYSKONETS egenskaper, inte den här produktens.
    egna_rader, _ = G.dela_pa_ankare(html)
    egna = G.synlig_meningstext(" ".join(egna_rader))

    # ☠️ TVÅPACKSGRINDEN — sidan måste säga att man får TVÅ.
    if pid in PAR:
        if not re.search(r"\b(två|2)\s+(sågbockar|arbetsbockar|stödbockar|bockar)\b"
                         r"|\bparet\b|\btvåpack\b|\bbåda\s+två\b", egna, re.I):
            fel.append("TVÅPACKSGRINDEN: sidan säger inte att man får två bockar")

    # ☠️ PARLASTGRINDEN — båda talen, och paret-talet intill ordet för paret.
    if pid in PARLAST:
        per, par = PARLAST[pid]
        p_per = per.replace(" ", r"\s?")
        p_par = par.replace(" ", r"\s?")
        if not re.search(rf"(?<![\d,]){p_per}\s*(kg|kilo)[^.!?]{{0,40}}\bper\s+bock"
                         rf"|\bper\s+bock[^.!?]{{0,40}}(?<![\d,]){p_per}\s*(kg|kilo)",
                         egna, re.I):
            fel.append(f"PARLASTGRINDEN: {per} kg PER BOCK står inte utskrivet")
        if not re.search(rf"(?<![\d,]){p_par}\s*(kg|kilo)[^.!?]{{0,60}}"
                         rf"\b(paret|båda|tillsammans)\b"
                         rf"|\b(paret|båda|tillsammans)\b[^.!?]{{0,60}}"
                         rf"(?<![\d,]){p_par}\s*(kg|kilo)", egna, re.I):
            fel.append(f"PARLASTGRINDEN: {par} kg är PARETS summa och sidan "
                       f"säger inte att det är det")
    elif pid in ENKELLAST:
        n = ENKELLAST[pid]
        if not re.search(rf"\b(tål|bär)\b[^.!?]{{0,80}}(?<![\d,]){n}\s*(kg|kilo)",
                         egna, re.I):
            fel.append(f"LASTGRINDEN: sidan säger inte att den tål {n} kg")

    # ☠️ HÖJDLÄGESGRINDEN. Positiv på rätt tal, negativ på familjens andra.
    if pid in LAGEN:
        n = LAGEN[pid]
        if not re.search(rf"{_tal(n)}[^.!?]{{0,30}}\b(höjd)?läge", egna, re.I):
            fel.append(f"HÖJDLÄGESANTALET {n} står inte på sidan")
        for fel_n in sorted(set(LAGEN.values())):
            if fel_n == n:
                continue
            for m in re.finditer(rf"{_tal(fel_n)}\s+(?:höjd)?läge", egna, re.I):
                fel.append(f"FEL ANTAL HÖJDLÄGEN {fel_n} (rätt är {n}) — "
                           f"…{G.mening_kring(egna, m.start())}…")

    # ☠️ HOPFÄLLNINGSGRINDEN — och den som INTE viks.
    if pid in HOPFALLBAR:
        if not re.search(r"\bhopfäll|\bviks?\b|\bvik\s+ihop|\bfäll(er|s)?\s+ihop",
                         egna, re.I):
            fel.append("HOPFÄLLNINGSGRINDEN: modellen viks ihop och sidan säger det inte")
    if pid in FAST:
        for m in re.finditer(r"\bhopfällbar\w*|\bviks?\s+ihop|\bfälls?\s+ihop"
                             r"|\bhopfälld\w*", egna, re.I):
            mening = G.mening_kring(egna, m.start())
            # "Går den att fälla ihop? Nej." är ett korrekt besked, inte ett löfte.
            if re.search(r"\bnej\b|\binte\b|fast\s+bänk", mening, re.I):
                continue
            fel.append(f"HOPFÄLLNINGSGRINDEN: den här viks INTE ihop — …{mening}…")

    # Monteringsgrinden, positiv åt båda hållen.
    if pid in UTAN_MONTERING and not re.search(
            r"monter\w*[^.!?]{0,20}\b(krävs\s+inte|behövs\s+inte|ingen)\b"
            r"|\b(kräver|behöver)\s+ingen\s+monter\w*", egna, re.I):
        fel.append("MONTERINGSGRINDEN: den här kräver ingen montering och sidan "
                   "säger det inte")
    if pid in MED_MONTERING and not re.search(
            r"\b(kräver|behöver)\s+monter\w*|monter\w*\s*:?\s*krävs", egna, re.I):
        fel.append("MONTERINGSGRINDEN: den här kräver montering och sidan säger "
                   "det inte")

    # ☠️ ROSTGRINDEN ÄR POSITIV på 9e9c78b9 — källan påstår rostbeständighet.
    if pid == "9e9c78b9":
        if not re.search(r"lack\w*[^.!?]{0,60}\b(hel|intakt|så\s+länge)\b"
                         r"|\b(hel|intakt|så\s+länge)\b[^.!?]{0,60}lack\w*",
                         egna, re.I):
            fel.append("ROSTGRINDEN: sidan måste säga att lacken skyddar SÅ LÄNGE "
                       "DEN ÄR HEL, inte bara undvika ordet rostfri")
    # Nämns rost någon annanstans måste det kvalificeras.
    for m in re.finditer(r"\brost\w*", egna, re.I):
        mening = G.mening_kring(egna, m.start()) + " " + G.nasta_mening(egna, m.start())
        if not re.search(r"lack|pulverlack|förzink|så\s+länge|hel\b|jack|bättra",
                         mening, re.I):
            fel.append(f"ROSTGRINDEN: okvalificerat rostpåstående — …{mening}…")

    # ☠️ KAPSÅGSNOTEN, bara 4a8e7f21.
    if pid == "4a8e7f21":
        if not re.search(r"\b4\s*(cm|centimeter)[^.!?]{0,60}\b(fäll|vik)"
                         r"|\b(fäll|vik)\w*[^.!?]{0,60}\b4\s*(cm|centimeter)",
                         egna, re.I):
            fel.append("KAPSÅGSNOTEN: varningen om att dra ut rullbasen ~4 cm före "
                       "hopfällning saknas")
        if not re.search(r"ingår\s+(inte|ej)|medföljer\s+inte|\bNej\b", egna, re.I):
            fel.append("TILLBEHÖRSGRINDEN: sågen på bilderna ingår inte och sidan "
                       "säger det inte")

    # Tillbehörsgrinden på sågbockarna: bilderna visar såg och virke.
    if pid in ("17e683e0", "ed44170a"):
        if not re.search(r"(såg\w*|virke|verktyg\w*)[^.!?]{0,90}"
                         r"(ingår\s+(inte|ej)|medföljer\s+inte|säljs\s+separat)"
                         r"|ingår[^.!?]{0,40}\bbilder\w*\s*\?\s*Nej\b", egna, re.I):
            if pid == "17e683e0":
                fel.append("TILLBEHÖRSGRINDEN: bilden visar såg och virke som inte "
                           "ingår, och sidan säger det inte")

    # ☠️ FÄRGGRINDEN, två nivåer.
    egen = FARG[pid]
    syskon = SYSKONFARG.get(pid, set())
    kort = f"{T.NAMN[pid]} {T.TITEL[pid]} {T.META[pid]}"
    # ☠️ MÖNSTRET KOMMER FRÅN `G.fargformer`, inte från en egen `\w*`.
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
            if re.search(r"slist|skena|handtag|krom|förzink", mening, re.I):
                continue
            fel.append(f"FÄRGORD {f!r} som varken är egen eller syskonets "
                       f"— …{mening}…")

    fel += [f"HOMOGLYF {c} ({n}) — …{s}…" for c, n, s in G.homoglyfer(txt)]
    fel += [f"NAMNGRIND: {p}" for p in G.granska_namn(T.NAMN[pid])]
    fel += [f"LEVERANSLÖFTE: {p}" for p in G.leveransloften(
        txt, [v for e, v in T.SPEC[pid] if e == "Ingår"], nyckel=pid)]
    return fel


SJALVTEST = [
    ("husmärke", "Bocken är en HOMCOM-modell.", True),
    ("tredjepartsmärke", "Passar en Makita-kapsåg.", True),
    ("artikelnummer", "Modellen heter 845-030CG.", True),
    ("leveransland", "Skickas från Tyskland inom en vecka.", True),
    ("attribution", "Leverantören anger 580 kg.", True),
    ("tyskt ord", "Zwei klappbare Sägeböcke aus Stahl.", True),
    ("rostfri", "Stålet är rostfritt och rostar aldrig.", True),
    ("rostbeständig", "Pulverlackerade rör är rostbeständiga.", True),
    ("decimalpunkt", "Balken är 82.5 cm lång.", True),
    ("x som gångertecken", "Måtten är 93 x 50 x 71 cm.", True),
    ("superlativ", "Marknadens bästa sågbock.", True),
    ("certifiering", "Bocken är CE-märkt enligt norm.", True),
    ("säkerhetslöfte", "En bock som aldrig tippar.", True),
    ("relativ länk", '<a href="/produkt/sagbockar">Syskonet</a>', True),
    ("engelsk enhet", "Bär upp till 550 lbs.", True),
    ("jargong", "Som vi skrev i runda 125.", True),

    ("ren mening", "Två bockar med teleskopben i sex lägen.", False),
    ("mått", "Bocken mäter 93 × 50 × 71 cm och väger 10 kg.", False),
    ("kvalificerad rost", "Lacken skyddar så länge den är hel.", False),
    ("kvalificerad rost 2", "Ett djupt jack kan börja rosta, så bättra på det.", False),
    ("förzinkat", "Teleskopdelen är i förzinkad plåt.", False),
    ("parlast", "250 kilo per bock och 500 kilo för paret.", False),
    ("höjdlägen", "Sju höjdlägen mellan 64 och 81 centimeter.", False),
    ("hopfällning", "Viks platt till 15 centimeter och står mot väggen.", False),
    ("montering", "Kräver ingen montering — vik ut och lås höjden.", False),
    ("färg", "Orange ovansida med svarta ben.", False),
    ("silver", "Svart med silverfärgade skenor.", False),
    ("tillbehör", "Sågen och virket på bilderna ingår inte.", False),
    ("kapsågsnot", "Dra ut rullbasen 4 centimeter innan du fäller ihop.", False),
]

# ☠️ Böjningsfallen provas mot MÖNSTREN, inte mot FORBJUDET (uppgift #467).
BOJNINGSFALL = [
    ("röd matchar rött", "röd", "Rött stativ", True),
    ("röd matchar röda", "röd", "De röda bockarna", True),
    ("röd matchar INTE grönt", "grön", "Röda arbetsbockar", False),
    ("orange matchar orange", "orange", "Orange ovansida", True),
    ("svart matchar svarta", "svart", "De svarta benen", True),
    ("silverfärgad matchar silverfärgade", "silverfärgad",
     "silverfärgade skenor", True),
    ("nyckel matchar nycklar", None, "två nycklar ingår", True),
]

# Sidor som INTE får fälla en viss grind — grinden får inte skrika på rätt sida.
GRANSKNINGSFALL = [
    ("fyra lägen godkänns", "17e683e0", "HÖJDLÄGES"),
    ("sex lägen godkänns", "3afe7275", "HÖJDLÄGES"),
    ("sju lägen godkänns", "ed44170a", "HÖJDLÄGES"),
    ("parlasten godkänns", "ed44170a", "PARLASTGRINDEN"),
    ("parlasten godkänns 2", "17e683e0", "PARLASTGRINDEN"),
    ("enkellasten godkänns", "3afe7275", "LASTGRINDEN"),
    ("den fasta bänken fälls inte", "9e9c78b9", "HOPFÄLLNINGSGRINDEN"),
    ("den hopfällbara godkänns", "941867cb", "HOPFÄLLNINGSGRINDEN"),
    ("rostgrinden godkänner den kvalificerade texten", "9e9c78b9", "ROSTGRINDEN"),
    ("kapsågsnoten räknas", "4a8e7f21", "KAPSÅGSNOTEN"),
    ("montering krävs godkänns", "4a8e7f21", "MONTERINGSGRINDEN"),
    ("montering krävs inte godkänns", "ed44170a", "MONTERINGSGRINDEN"),
    ("syskonets färg får nämnas i brödtexten", "17e683e0", "FÄRGORD 'röd'"),
    ("silverfärgade skenor fälls inte", "4a8e7f21", "FÄRGORD 'silverfärgad'"),
]


def sjalvtest():
    fel = []
    for namn, farg, txt, ska in BOJNINGSFALL:
        if farg is None:
            traff = bool(re.search(G._bojningar("nyckel"), txt, re.I))
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
