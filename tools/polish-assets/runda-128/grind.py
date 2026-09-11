# -*- coding: utf-8 -*-
"""Runda 128 textgrind — körs på FILEN, före varje API-anrop.

Maskineriet delas med runda 115–127 via `grindar.py`. Det som är NYTT här:

  1. ☠️ **MATERIALGRINDEN, negativ åt BÅDA håll.** Två spec-block ljuger om
     materialklassen: `1654dd75`s säger `Kunststoff` om en stålvagn och
     `f2495eee`s säger `Edelstahl` om hela vagnen när bara BÄNKSKIVAN är
     rostfri. Grinden kräver därför att `f2495eee` säger rostfritt om just
     skivan OCH aldrig om vagnen, och att ingen av de nio kallas plast.
  2. ☠️ **VÄGGFÖRANKRINGSGRINDEN.** `beeada22` får förankras enligt källan;
     `81c123fa` — 180 cm hög och 210 kg — nämns INTE med väggförankring
     någonstans i källan. Att låna syskonets förankring till det höga skåpet
     vore ett säkerhetspåstående utan täckning.
  3. ☠️ **LÅDANTALET är negativt över hela rundan.** Sex av nio har lådor:
     3, 5, 7, 14, 16 och 16. Vagnarna är nästan omöjliga att skilja åt på
     bild, och lådantalet är den kvalificerare som hindrar dem från att
     kannibalisera varandra — och de publicerade syskonen.
  4. ☠️ **HÖJDGRINDEN är positiv på BÅDA talen för de tvådelade.**
     `fc6fdd63`s spec-block anger bara underskåpets 75 cm; hela vagnen är
     109. Sidan måste bära båda, annars köper kunden en 109-centimetersvagn
     som en 75-centimetersvagn.
  5. ☠️ **LEVERANSLÖFTET.** `81c123fa`s källa lovar fri leverans till
     trottoarkant. Grinden `G.leveransloften` plus LEVERANSLAND-mönstret
     fäller varje spår av det.
  6. **INNERBREDDSGRINDEN.** Två av källans skåp anger innerbredd lika med
     ytterbredd, vilket är omöjligt. Ingen sida skriver ut en innerbredd.
"""
import re
import sys

sys.path.insert(0, "..")

import grindar as G          # noqa: E402
import texter as T           # noqa: E402

RAKNEORD = {1: "en", 2: "två", 3: "tre", 4: "fyra", 5: "fem", 6: "sex",
            7: "sju", 8: "åtta", 9: "nio", 10: "tio", 14: "fjorton",
            16: "sexton"}

# Lådantal. `bc2e7191` och `beeada22` har HYLLPLAN och står utanför.
LADOR = {"1db06f83": 3, "f2495eee": 5, "1654dd75": 7,
         "fc6fdd63": 14, "b920d526": 16, "d9965552": 16}
HYLLPLAN = {"bc2e7191": 3, "beeada22": 2}

# Yttermått (bredd, höjd). Höjden är negativ över hela rundan — till skillnad
# från runda 127 delar ingen av de nio bredd med en annan, så gruppering
# behövs inte.
MATT = {
    "bc2e7191": ("71", "70"), "beeada22": ("75", "110"),
    "1654dd75": ("96", "75"), "f2495eee": ("65,5", "76"),
    "1db06f83": ("69", "133"), "b920d526": ("61,5", "113"),
    "d9965552": ("61,5", "113"), "fc6fdd63": ("76", "109"),
    "81c123fa": ("75", "180"),
}
# ☠️ De tvådelade bär TVÅ höjder: hela vagnen och underskåpet var för sig.
EXTRA_HOJD = {"fc6fdd63": "75", "b920d526": "76", "d9965552": "76",
              "1654dd75": "64"}

# Total maxlast. None = källan anger inget entydigt totaltal.
LAST_TOT = {"bc2e7191": "50", "beeada22": "50", "1654dd75": "120",
            "f2495eee": "80", "1db06f83": "80", "b920d526": None,
            "d9965552": None, "fc6fdd63": None, "81c123fa": "210"}

# ☠️ Färgen krävs i namn/titel/meta BARA där den är kvalificeraren: det
#    röd/blå-paret, och skåpet vars syskon är vitt (uppgift #482).
FARGKRAV = {"b920d526", "d9965552", "beeada22"}

ROSTFRI_SKIVA = {"f2495eee"}          # bara BÄNKSKIVAN är rostfri
VAGGFORANKRING = {"beeada22"}         # källan säger uttryckligen att det går
CENTRALLAS = {"1654dd75", "f2495eee"}
TVADELAD = {"b920d526", "d9965552", "fc6fdd63"}

FARG = {"bc2e7191": {"svart"}, "beeada22": {"svart"}, "1654dd75": {"svart"},
        "f2495eee": {"svart"}, "1db06f83": {"svart"}, "b920d526": {"röd"},
        "d9965552": {"blå"}, "fc6fdd63": {"röd"}, "81c123fa": {"svart"}}
# Delfärger som finns på varan men inte är dess färg.
DELFARG = {"f2495eee": {"silver"}, "fc6fdd63": {"svart"}}
# Syskonets färg får nämnas i BRÖDTEXTEN (aldrig i namn/titel/meta).
SYSKONFARG = {"b920d526": {"blå"}, "d9965552": {"röd"},
              "1654dd75": {"röd"}, "1db06f83": {"röd"},
              "f2495eee": {"svart"}}

FORBJUDET = [
    (re.compile(r"\b(homcom|outsunny|pawhut|aiyaplay|vinsetto|aosom|ikea|"
                r"bisley|steelcase|biltema|jula)\b", re.I),
     "HUSMÄRKE ELLER TREDJEPARTSMÄRKE"),
    (G.ARTNR, "ARTIKELNUMMER"),
    (re.compile(r"\b(tyskland|kina|polen|spanien|eu-lager|skickas\s+från|"
                r"fraktas\s+från|trottoarkant|fri\s+leverans|fraktfri\w*)\b",
                re.I), "LEVERANSLAND ELLER LEVERANSLÖFTE"),
    (re.compile(r"\bleverantör\w*\b|\btillverkar(en|ens)\b", re.I),
     "ATTRIBUTION — mot kunden är VI leverantören"),
    (G.JARGONG, "INTERN JARGONG"),
    (re.compile(r"<br\s*/?>", re.I), "WIX STRIPPAR <br>"),
    (re.compile(r'href="(?!https://www\.fyndplats\.se/)', re.I),
     "RELATIV LÄNK — Wix skriver om den till https:/ med ETT snedstreck"),
    (re.compile(r"\b(werkzeug\w*|werkstatt\w*|schrank\w*|schublade\w*|"
                r"belastbarkeit|farbe|gewicht|kunststoff|edelstahl|stahl|"
                r"lieferumfang|montage|abmessungen|griff|schwarz|weiss|"
                r"rollen|räder|lochplatte|lochwand|zentralverriegelung|"
                r"schweiss\w*|aktenschrank\w*|gesamtmaße|regalboden)\b", re.I),
     "TYSKT ORD"),
    (re.compile(r"\b(tool\s*(box|cart|cabinet)|drawer|trolley|workbench)\b",
                re.I), "ENGELSKT ORD"),
    (re.compile(r"\b\d+\s*(lbs?|inch|inches|ft|gal)\b", re.I), "ENGELSK ENHET"),
    # ☠️ INNERBREDD — källan anger den lika med ytterbredden på två skåp.
    (re.compile(r"\binnerbredd\w*|\bbredd\s+invändigt|\binvändig\s+bredd",
                re.I), "INNERBREDD — källans tal är omöjligt"),
    # ☠️ Ingen av de nio är barnsäker, och inget lås är ett barnskydd.
    (re.compile(r"\bbarnsäk\w*|\bbarnskydd\w*|\bsäker\s+för\s+barn\b", re.I),
     "BARNSÄKERHET — inget av låsen är ett barnskydd"),
    # ☠️ Lacken skyddar så länge den är hel. Ingen av de nio rostar aldrig.
    (re.compile(r"\brostar?\s+(inte|aldrig)\b|\brostsäker\w*"
                r"|\brostbeständ\w*", re.I), "ROSTLÖFTE UTAN TÄCKNING"),
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
    # ☠️ En vagn med utdragen full låda har tyngdpunkten utanför hjulbasen.
    (re.compile(r"\b(?:(?:aldrig|inte)\s+(?:tippar|välter|glider|rullar)"
                r"|(?:tippar|välter|glider)\s+(?:aldrig|inte)"
                r"|kan\s+inte\s+välta|alltid\s+stadig\w*)\b", re.I),
     "SÄKERHETSLÖFTE UTAN TÄCKNING"),
    # ☠️ Gasflaskor är trycksatta. Sidan beskriver kedjorna, inget mer.
    (re.compile(r"\bgasflask\w*[^.!?]{0,40}\b(säker|trygg|riskfri|ofarlig)\w*"
                r"|\b(säker|trygg|riskfri|ofarlig)\w*[^.!?]{0,40}\bgasflask",
                re.I), "SÄKERHETSPÅSTÅENDE OM GASFLASKA"),
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
    """Matchar talet som SIFFRA eller RÄKNEORD — aldrig ur ett decimaltal."""
    return rf"(?:\b{RAKNEORD[x]}\b|(?<![\d,]){x}(?![\d,]))"


def _matt(x):
    """Ett mått med decimalkomma, skyddat mot att matcha inuti ett annat tal."""
    return rf"(?<![\d,]){re.escape(x)}(?![\d,])"


def granska(pid):
    html = T.bygg(pid)
    txt = _text(pid)
    fel = []

    for monster, etikett in FORBJUDET + TONGRINDAR:
        for m in monster.finditer(txt):
            fel.append(f"{etikett}: …{G.mening_kring(txt, m.start())}…")

    rubriker = re.findall(r"<h2>(.*?)</h2>", html)
    if "Användning och skötsel" not in rubriker:
        fel.append("SKÖTSELRUBRIKEN heter inte 'Användning och skötsel'")
    # ☠️ `G.flikfel` läser <summary> och hör hemma i LIVE-grinden — den
    #    finns inte i källans HTML och fäller varenda korrekt sida här.

    egna, _ = G.egna_meningar(html, T.SLUG[pid], T.NAMN[pid])

    # ☠️ LÅDANTALET, positivt på rätt och negativt på alla andra i rundan.
    if pid in LADOR:
        n = LADOR[pid]
        if not (re.search(rf"{_tal(n)}[^.!?]{{0,30}}\blåd", egna, re.I)
                or re.search(rf"\blådor\b[^.!?]{{0,15}}{_tal(n)}", egna, re.I)):
            fel.append(f"LÅDANTALET {n} står inte på sidan")
        DEL_EFTER = (r"(?:grunda|djupa|små|stora|breda|låsbara|mellan)\w*\s+"
                     r"|(?:i\s+)?(?:överkistan|underskåpet)\b")
        SYSKONORD = r"\b(?:systern?|syster\w*|modellen|varianten|serien|vagnen)\b"
        for fel_n in sorted(set(LADOR.values())):
            if fel_n == n:
                continue
            for m in re.finditer(rf"{_tal(fel_n)}\s+({DEL_EFTER})?låd",
                                 egna, re.I):
                if m.group(1):
                    continue
                a = max(egna.rfind(".", 0, m.start()),
                        egna.rfind(":", 0, m.start()),
                        egna.rfind("?", 0, m.start()))
                if re.search(SYSKONORD, egna[a + 1:m.start()], re.I):
                    continue
                fel.append(f"FEL LÅDANTAL {fel_n} (rätt är {n}) — "
                           f"…{G.mening_kring(egna, m.start())}…")
    if pid in HYLLPLAN:
        n = HYLLPLAN[pid]
        if not re.search(rf"{_tal(n)}[^.!?]{{0,30}}\bhyllplan", egna, re.I):
            fel.append(f"HYLLPLANSANTALET {n} står inte på sidan")

    # ☠️ MÅTTEN — bredd och höjd positivt, främmande höjd negativt.
    bredd, hojd = MATT[pid]
    if not re.search(_matt(hojd), egna):
        fel.append(f"HÖJDEN {hojd} cm står inte på sidan")
    if not re.search(_matt(bredd), egna):
        fel.append(f"BREDDEN {bredd} cm står inte på sidan")
    if pid in EXTRA_HOJD and not re.search(_matt(EXTRA_HOJD[pid]), egna):
        fel.append(f"DELHÖJDEN {EXTRA_HOJD[pid]} cm står inte på sidan — "
                   f"källans spec-block anger BARA den, och kunden måste se "
                   f"både den och {hojd}")

    # Total maxlast.
    tot = LAST_TOT[pid]
    if tot:
        if not re.search(rf"{_matt(tot)}\s*(kg|kilo)", egna, re.I):
            fel.append(f"LASTGRINDEN: totallasten {tot} kg står inte på sidan")
    else:
        # ☠️ Kräver ett LASTVERB. "41,7 kilo sammanlagt" är vikten.
        for m in re.finditer(r"\b(tål|bär|last\w*|belast\w*)\b[^.!?]{0,40}"
                             r"\b(totalt|sammanlagt)\b[^.!?]{0,25}\d+\s*(kg|kilo)"
                             r"|\b(tål|bär|last\w*|belast\w*)\b[^.!?]{0,40}"
                             r"\d+\s*(kg|kilo)[^.!?]{0,25}\b(totalt|sammanlagt)\b",
                             egna, re.I):
            fel.append(f"TOTALLASTGRINDEN: källan anger inget entydigt "
                       f"totaltal — …{G.mening_kring(egna, m.start())}…")

    # ☠️ MATERIALGRINDEN, båda hållen.
    for m in re.finditer(r"\bplast\w*", egna, re.I):
        fel.append(f"MATERIALGRIND: källans spec-block säger plast om en "
                   f"stålprodukt — …{G.mening_kring(egna, m.start())}…")
    for m in re.finditer(r"\brostfri\w*|\brostfritt\b", egna, re.I):
        mening = (G.mening_kring(egna, m.start()) + " "
                  + G.nasta_mening(egna, m.start()))
        if pid in ROSTFRI_SKIVA and re.search(r"bänkskiv|skivan|skiva", mening,
                                              re.I):
            continue
        fel.append(f"ROSTFRI LÖGN: bara bänkskivan på {sorted(ROSTFRI_SKIVA)} "
                   f"är rostfri — …{mening}…")
    if pid in ROSTFRI_SKIVA and not re.search(
            r"bänkskiv\w*[^.!?]{0,40}rostfri|rostfri\w*[^.!?]{0,40}bänkskiv"
            r"|rostfritt\s+stål", egna, re.I):
        fel.append("ROSTFRIGRINDEN: sidan måste säga att det är BÄNKSKIVAN "
                   "som är rostfri")

    # ☠️ VÄGGFÖRANKRINGEN.
    for m in re.finditer(r"väggförankr\w*|skruva\w*\s+fast\s+i\s+väggen"
                         r"|fästa?\s+i\s+väggen|väggmonter\w*", egna, re.I):
        if pid not in VAGGFORANKRING:
            fel.append(f"VÄGGFÖRANKRING: källan nämner ingen för den här "
                       f"modellen — …{G.mening_kring(egna, m.start())}…")

    # Låsgrinden: centrallås respektive separata lås.
    if pid in CENTRALLAS and not re.search(r"centrallås|ett\s+lås\s+stänger",
                                           egna, re.I):
        fel.append("LÅSGRINDEN: modellen har centrallås och sidan säger det inte")
    if pid in TVADELAD and not re.search(
            r"var\s+för\s+sig|per\s+del|separat\w*|båda\s+delarna", egna, re.I):
        fel.append("TVÅDELSGRINDEN: modellen är tvådelad och sidan säger inte "
                   "att delarna kan användas var för sig")

    # ☠️ FÄRGGRINDEN, två nivåer, via `G.fargformer`.
    egen = FARG[pid]
    syskon = SYSKONFARG.get(pid, set())
    kort = f"{T.NAMN[pid]} {T.TITEL[pid]} {T.META[pid]}"
    if pid in FARGKRAV:
        for f in egen:
            if not re.search(G.fargformer(f), kort, re.I):
                fel.append(f"FÄRGGRINDEN: egen färg {f!r} saknas i "
                           f"namn/titel/meta")
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
            if re.search(r"kantlist|skena|krom|förzink|silverton", mening, re.I):
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
    ("artikelnummer", "Modellen heter 845-030CG.", True),
    ("leveransland", "Skickas från Tyskland inom en vecka.", True),
    ("trottoarkant", "Vi levererar fritt till trottoarkant.", True),
    ("fri leverans", "Fri leverans till din dörr.", True),
    ("attribution", "Leverantören anger 120 kg.", True),
    ("tyskt ord", "Ein Werkzeugwagen mit Lochwand.", True),
    ("tyskt ord kunststoff", "Materialet är Kunststoff.", True),
    ("engelskt ord", "En toolbox på hjul.", True),
    ("rostlöfte", "Stålet rostar aldrig.", True),
    ("rostbeständig", "Ytan är rostbeständig.", True),
    ("innerbredd", "Innerbredden är 75 centimeter.", True),
    ("barnsäkert", "Låset är barnsäkert.", True),
    ("decimalpunkt", "Lådan är 27.5 cm djup.", True),
    ("x som gångertecken", "Måtten är 61,5 x 33 x 113 cm.", True),
    ("superlativ", "Marknadens bästa verktygsvagn.", True),
    ("certifiering", "Vagnen är CE-märkt enligt norm.", True),
    ("säkerhetslöfte", "En vagn som aldrig tippar.", True),
    ("säkerhetslöfte omvänt", "Den välter aldrig ens med lådan ute.", True),
    ("gasflaskelöfte", "Gasflaskan står helt säker i vagnen.", True),
    ("relativ länk", '<a href="/produkt/vagn">Syskonet</a>', True),
    ("engelsk enhet", "Bär upp till 260 lbs.", True),
    ("jargong", "Som vi skrev i runda 127.", True),

    ("ren mening", "Sju lådor som alla låses med samma nyckel.", False),
    ("rostfri bänkskiva", "Bänkskivan är i rostfritt stål.", False),
    ("mått med multiplikationstecken", "Måtten är 61,5 × 33 × 113 cm.", False),
    ("pulverlack", "Pulverlackerat stål med hel yta.", False),
    ("kedjor", "Två säkerhetskedjor på 108 centimeter.", False),
]

BOJNINGSFALL = [
    ("röd matchar rött", "röd", "Det röda skåpet", True),
    ("röd matchar INTE blå", "röd", "Den blå vagnen", False),
    ("blå matchar blått", "blå", "Blått stål", True),
    ("svart matchar svarta", "svart", "De svarta lådorna", True),
    ("vit matchar INTE svart", "vit", "Svarta fronter", False),
]

# Fall där grinden INTE får fälla rundans egna, korrekta texter.
GRANSKNINGSFALL = [
    ("överkistans lådor är en delmängd", "b920d526", "FEL LÅDANTAL"),
    ("underskåpets lådor är en delmängd", "fc6fdd63", "FEL LÅDANTAL"),
    ("syskonets lådantal i korslänken", "fc6fdd63", "FEL LÅDANTAL"),
    ("rostfri bänkskiva är tillåten", "f2495eee", "ROSTFRI LÖGN"),
    ("väggförankring tillåten på skåpet", "beeada22", "VÄGGFÖRANKRING"),
    ("tvådelad höjd", "fc6fdd63", "DELHÖJDEN"),
    ("inget totaltal på de tvådelade", "b920d526", "TOTALLASTGRINDEN"),
    # ☠️ Kedjorna beskrivs av vad de GÖR, inte med ordet "säkerhets-".
    #    Grinden ska inte fälla den beskrivningen, men ska fälla ett löfte.
    ("kedjorna beskrivs utan löfte", "bc2e7191", "GASFLASKA"),
]


def sjalvtest():
    fel = []
    monster = FORBJUDET + TONGRINDAR
    for namn, text, ska_falla in SJALVTEST:
        traff = any(m.search(text) for m, _ in monster)
        if traff != ska_falla:
            fel.append(f"SJÄLVTEST {namn!r}: fick {traff}, väntade {ska_falla}")

    for namn, ord_, text, ska in BOJNINGSFALL:
        traff = bool(re.search(G.fargformer(ord_), text, re.I))
        if traff != ska:
            fel.append(f"BÖJNING {namn!r}: fick {traff}, väntade {ska}")

    alla = {pid: granska(pid) for pid in T.NAMN}
    for namn, pid, etikett in GRANSKNINGSFALL:
        traff = [f for f in alla[pid] if etikett in f]
        if traff:
            fel.append(f"GRANSKNING {namn!r}: {traff[0]}")
    return fel, len(SJALVTEST) + len(BOJNINGSFALL) + len(GRANSKNINGSFALL)


if __name__ == "__main__":
    sjalvfel, antal = sjalvtest()
    print(f"grind.sjalvtest(): {antal} fall, {len(sjalvfel)} fel")
    for f in sjalvfel:
        print("  ☠️", f)
    gfel, gantal = G._sjalvtest()
    print(f"grindar._sjalvtest(): {gantal} fall, {len(gfel)} fel")
    for f in gfel + G.tvillingsvep() + kallkodssvep():
        print("  ☠️ GRIND:", f)

    totalt = len(sjalvfel) + len(gfel)
    for pid in T.NAMN:
        f = granska(pid)
        totalt += len(f)
        print(f"{'FEL ' if f else 'OK  '}{pid}  {T.SLUG[pid]}")
        for x in f:
            print("      ☠️", x)
    print(f"\n{len(T.NAMN)} sidor, {totalt} fel totalt")
    sys.exit(1 if totalt else 0)
