# -*- coding: utf-8 -*-
"""Runda 127 textgrind — körs på FILEN, före varje API-anrop.

Maskineriet delas med runda 115–126 via `grindar.py`. Det som är NYTT här:

  1. ☠️ **SKRIVARGRINDEN.** `709f7aac` heter `Druckerablage` hos leverantören
     och tål 3 kg per fack. En bordsskrivare väger 5–10 kg. Grinden är
     DUBBEL: sidan får inte kalla den skrivarhylla, OCH den måste säga rakt
     ut att den inte bär en skrivare. Ett utelämnande räcker inte — kunden
     läser leverantörens namn hos konkurrenten och tror att det gäller här.
  2. ☠️ **SPÄRRGRINDEN, negativ på ALLA åtta.** En engelsk bildoverlay
     påstår att bara en låda kan öppnas åt gången. Ingen av de två
     M2-texterna nämner det, och bilden som skulle motsäga det visade sig
     vara en render. Ett overifierat säkerhetspåstående får inte nå sidan.
  3. ☠️ **TIPPSKYDDS- OCH BROMSGRINDEN.** Tre av åtta har ett femte hjul
     under arkivlådan; EN av dem har dessutom broms på två hjul. De andra
     fem har ingetdera. Att låna ett tippskydd från syskonet är samma klass
     av fel som runda 126:s parlast.
  4. ☠️ **HÖJDGRINDEN, negativ inom BREDDGRUPPEN.** Fem hurtsar delar
     39 × 48 cm och skiljer sig bara på höjden: 59, 60 och 67. Grinden är
     inte negativ mot hela familjen — `4d5b3bb5` är också 60 cm men 37 cm
     bred, alltså en annan produkt. Att gruppera på bredden är vad som gör
     grinden både skarp och falsklarmsfri.
  5. ☠️ **TOTALLASTGRINDEN ÄR NEGATIV på `521aec3c`.** Källans totaltal
     (40 kg) går inte ihop med 5 kg per låda och två lådor, och det finns
     ingen toppskiverad att förklara skillnaden med. Sidan får inte skriva
     ut ett totaltal alls.
  6. **GREPPGRINDEN** skiljer de tre vita hurtsarna åt: greppfri front,
     infällt handtag eller läppgrepp. Det är den kvalificerare som hindrar
     dem från att kannibalisera varandra.
"""
import re
import sys

sys.path.insert(0, "..")

import grindar as G          # noqa: E402
import texter as T           # noqa: E402

RAKNEORD = {1: "en", 2: "två", 3: "tre", 4: "fyra", 5: "fem",
            6: "sex", 7: "sju", 8: "åtta", 9: "nio", 10: "tio"}

# Lådantal — `709f7aac` har FACK, inte lådor, och står utanför.
LADOR = {"4d5b3bb5": 3, "66866eb7": 2, "521aec3c": 2,
         "9ba9af92": 3, "3273d2ee": 3, "9b8c7308": 3, "21a12739": 3}
FACK = {"709f7aac": 3}

# ☠️ Höjden gatas inom BREDDGRUPPEN, inte över hela familjen.
BREDDGRUPP = {
    "9ba9af92": ("39", "60"), "3273d2ee": ("39", "59"),
    "9b8c7308": ("39", "59"), "21a12739": ("39", "59"),
    "521aec3c": ("39", "67"),
    "4d5b3bb5": ("37", "60"), "66866eb7": ("37", "67,5"),
    "709f7aac": ("33,5", "111"),
}

# Last: (per enhet, totalt eller None). None = sidan får INTE skriva ett totaltal.
LAST_PER = {"709f7aac": "3", "4d5b3bb5": "5", "66866eb7": "5",
            "521aec3c": "5", "9ba9af92": "15", "3273d2ee": "15",
            "9b8c7308": "15", "21a12739": "15"}
LAST_TOT = {"709f7aac": "9", "4d5b3bb5": "30", "66866eb7": "30",
            "521aec3c": None, "9ba9af92": "50", "3273d2ee": "50",
            "9b8c7308": "50", "21a12739": "50"}

TIPPSKYDD = {"9ba9af92", "3273d2ee", "21a12739"}
BROMS = {"9ba9af92"}
ENDAST_HJUL = {"3273d2ee"}
GREPPFRI = {"3273d2ee"}
INFALLT = {"9b8c7308", "21a12739"}

FARG = {"709f7aac": {"vit"}, "4d5b3bb5": {"svart"}, "66866eb7": {"svart"},
        "521aec3c": {"vit"}, "9ba9af92": {"vit"}, "3273d2ee": {"vit"},
        "9b8c7308": {"vit"}, "21a12739": {"svart"}}
# Delfärger som finns på varan men inte är dess färg.
DELFARG = {"9b8c7308": {"svart"}}
# Syskonets färg får nämnas i BRÖDTEXTEN (aldrig i namn/titel/meta).
SYSKONFARG = {"9b8c7308": {"svart"}, "21a12739": {"vit"}, "9ba9af92": {"svart"}}

FORBJUDET = [
    (re.compile(r"\b(homcom|outsunny|pawhut|aiyaplay|vinsetto|aosom|ikea|"
                r"bisley|steelcase)\b", re.I),
     "HUSMÄRKE ELLER TREDJEPARTSMÄRKE"),
    (G.ARTNR, "ARTIKELNUMMER"),
    (re.compile(r"\b(tyskland|kina|polen|spanien|eu-lager|skickas\s+från|"
                r"fraktas\s+från|trottoarkant)\b", re.I), "LEVERANSLAND"),
    (re.compile(r"\bleverantör\w*\b|\btillverkar(en|ens)\b", re.I),
     "ATTRIBUTION — mot kunden är VI leverantören"),
    (G.JARGONG, "INTERN JARGONG"),
    (re.compile(r"<br\s*/?>", re.I), "WIX STRIPPAR <br>"),
    (re.compile(r'href="(?!https://www\.fyndplats\.se/)', re.I),
     "RELATIV LÄNK — Wix skriver om den till https:/ med ETT snedstreck"),
    (re.compile(r"\b(aktenschrank\w*|rollcontainer\w*|schublade\w*|"
                r"belastbarkeit|farbe|gewicht|kunststoff|stahl|lieferumfang|"
                r"montage|abmessungen|griff|schwarz|weiss|rollen|räder|"
                r"hängeregistratur|stiftfach|kippschutz|bremse|"
                r"druckerablage|regalboden|schreibtisch\w*)\b", re.I),
     "TYSKT ORD"),
    (re.compile(r"\b(safety\s+design|drawer|cabinet|pedestal)\b", re.I),
     "ENGELSKT ORD"),
    (re.compile(r"\b\d+\s*(lbs?|inch|inches|ft|gal)\b", re.I), "ENGELSK ENHET"),
    # ☠️ Ingen av de åtta är rostfri. Lackerat eller pulverlackerat stål.
    (re.compile(r"\brostfri\w*|\brostfritt\b|\brostar\s+(inte|aldrig)\b|"
                r"\brostsäker\w*|\brostbeständ\w*", re.I), "ROSTFRI LÖGN"),
    # ☠️ SPÄRRGRINDEN — overifierat säkerhetspåstående från en bildoverlay.
    (re.compile(r"\b(en|1|bara\s+en|endast\s+en)\s+låda\s+(åt\s+gången|i\s+taget)"
                r"[^.!?]{0,30}\b(kan|går|möjlig\w*|öppna\w*)\b"
                r"|\b(kan|går)\s+bara\s+öppna[^.!?]{0,20}\ben\s+låda\b"
                r"|\bspärr\w*\s+[^.!?]{0,20}\blåd", re.I),
     "LÅDSPÄRR — overifierat påstående ur en bildoverlay"),
    (re.compile(r"\bskrivarhyll\w*|\bskrivarbord\w*|\bskrivarställ\w*", re.I),
     "SKRIVARE — produkten tål 3 kg per fack"),
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
    # ☠️ En hurts med utdragen arkivlåda har tyngdpunkten utanför hjulbasen.
    (re.compile(r"\b(?:(?:aldrig|inte)\s+(?:tippar|välter|glider|rullar)"
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
        fel.append(f"FLIKRUBRIKEN saknas eller stavas fel — {rubriker}")
    if "Tekniska specifikationer" in rubriker and "Passar inte den här?" in rubriker:
        if rubriker.index("Passar inte den här?") > rubriker.index("Tekniska specifikationer"):
            fel.append("KORSLÄNKARNA ligger EFTER spec-fliken — de hamnar inne i den")

    # ☠️ ANKARSPLITTEN LIGGER FÖRE EGENSKAPSGRINDARNA: en korslänk beskriver
    #    SYSKONETS egenskaper, inte den här produktens.
    egna_rader, _ = G.dela_pa_ankare(html)
    egna = G.synlig_meningstext(" ".join(egna_rader))

    # ☠️ SKRIVARGRINDEN — dubbel. Förbudet ligger i FORBJUDET; här kravet.
    if pid == "709f7aac":
        if not re.search(r"skrivare", egna, re.I):
            fel.append("SKRIVARGRINDEN: sidan måste säga rakt ut att den inte "
                       "bär en skrivare")
        if not re.search(r"skrivare[^.!?]{0,120}\b(väger|5|10)\b"
                         r"|\bNej\b[^.!?]{0,120}skrivare"
                         r"|skrivare[^.!?]{0,60}\bNej\b", egna, re.I):
            fel.append("SKRIVARGRINDEN: skrivaren nämns men utan ett NEJ och "
                       "utan talen som förklarar varför")

    # Lådantal respektive fackantal, negativt mot familjens andra tal.
    if pid in LADOR:
        n = LADOR[pid]
        if not (re.search(rf"{_tal(n)}[^.!?]{{0,30}}\blåd", egna, re.I)
                or re.search(rf"\blådor\b[^.!?]{{0,15}}{_tal(n)}", egna, re.I)):
            fel.append(f"LÅDANTALET {n} står inte på sidan")
        # ☠️ DELMÄNGDER ÄR INTE FEL ANTAL. "Två grunda lådor och en arkivlåda"
        #    ÄR tre lådor, beskrivna var för sig. Kvalificeraren framför ordet
        #    `låd` är alltså undantaget, inte en del av träffen — runda 125
        #    lärde samma sak på lådskåpen.
        DEL_EFTER = r"(?:grunda|djupa|små|stora|breda|låsbara|lika\s+djupa)\s+"
        # ...och en mening om SYSKONET beskriver inte den här produkten.
        SYSKONORD = r"\b(?:systern?|syster\w*|modellen|varianten|serien)\b"
        for fel_n in sorted(set(LADOR.values())):
            if fel_n == n:
                continue
            for m in re.finditer(rf"{_tal(fel_n)}\s+({DEL_EFTER})?låd", egna, re.I):
                if m.group(1):
                    continue
                a = max(egna.rfind(".", 0, m.start()), egna.rfind(":", 0, m.start()),
                        egna.rfind("?", 0, m.start()))
                if re.search(SYSKONORD, egna[a + 1:m.start()], re.I):
                    continue
                fel.append(f"FEL LÅDANTAL {fel_n} (rätt är {n}) — "
                           f"…{G.mening_kring(egna, m.start())}…")
    if pid in FACK:
        n = FACK[pid]
        if not re.search(rf"{_tal(n)}[^.!?]{{0,30}}\b(öppna\s+)?(kub)?fack", egna, re.I):
            fel.append(f"FACKANTALET {n} står inte på sidan")

    # ☠️ HÖJDGRINDEN inom breddgruppen.
    bredd, hojd = BREDDGRUPP[pid]
    if not re.search(_matt(hojd), egna):
        fel.append(f"HÖJDEN {hojd} cm står inte på sidan")
    if not re.search(_matt(bredd), egna):
        fel.append(f"BREDDEN {bredd} cm står inte på sidan")
    for annat, (b, h) in BREDDGRUPP.items():
        if annat == pid or b != bredd or h == hojd:
            continue
        for m in re.finditer(rf"{_matt(h)}\s*(cm|centimeter)", egna, re.I):
            fel.append(f"FRÄMMANDE HÖJD {h} cm ur samma breddgrupp "
                       f"(rätt är {hojd}) — …{G.mening_kring(egna, m.start())}…")

    # Lasttalen.
    per = LAST_PER[pid]
    if not re.search(rf"{_matt(per)}\s*(kg|kilo)", egna, re.I):
        fel.append(f"LASTGRINDEN: {per} kg per enhet står inte på sidan")
    tot = LAST_TOT[pid]
    if tot:
        if not re.search(rf"{_matt(tot)}\s*(kg|kilo)", egna, re.I):
            fel.append(f"LASTGRINDEN: totallasten {tot} kg står inte på sidan")
    else:
        # ☠️ 521aec3c: källans totaltal går inte ihop. Inget totaltal alls.
        for m in re.finditer(r"\b(totalt|sammanlagt|hela\s+hurtsen)\b", egna, re.I):
            fel.append(f"TOTALLASTGRINDEN: källans totaltal går inte ihop — "
                       f"…{G.mening_kring(egna, m.start())}…")

    # ☠️ TIPPSKYDD och BROMS — bara de som har dem får nämna dem.
    for m in re.finditer(r"tippskydd\w*|femte\s+hjul\w*", egna, re.I):
        if pid not in TIPPSKYDD:
            fel.append(f"TIPPSKYDDSGRINDEN: modellen har inget femte hjul — "
                       f"…{G.mening_kring(egna, m.start())}…")
    if pid in TIPPSKYDD and not re.search(r"tippskydd\w*|femte\s+hjul\w*"
                                          r"|hjul\s+under\s+arkivlådan", egna, re.I):
        fel.append("TIPPSKYDDSGRINDEN: modellen HAR ett femte hjul och sidan "
                   "säger det inte")
    for m in re.finditer(r"\bbroms\w*", egna, re.I):
        if pid not in BROMS:
            fel.append(f"BROMSGRINDEN: modellen har inga bromsar i källan — "
                       f"…{G.mening_kring(egna, m.start())}…")

    # Monteringsgrinden, positiv åt båda hållen.
    if pid in ENDAST_HJUL:
        if not re.search(r"bara\s+hjulen|endast\s+hjulen|hjulen\s+som\s+ska", egna, re.I):
            fel.append("MONTERINGSGRINDEN: bara hjulen ska monteras och sidan "
                       "säger det inte")
    elif not re.search(r"\bmonter\w*", egna, re.I):
        fel.append("MONTERINGSGRINDEN: modellen kräver montering och sidan "
                   "säger det inte")

    # Greppgrinden — kvalificeraren som skiljer de vita hurtsarna åt.
    if pid in GREPPFRI and not re.search(r"greppfri\w*|utan\s+handtag|släta\s+fronter",
                                         egna, re.I):
        fel.append("GREPPGRINDEN: den här har greppfri front och sidan säger "
                   "det inte")
    if pid in INFALLT and not re.search(r"infällt?\s+handtag|handtag\s+infällt",
                                        egna, re.I):
        fel.append("GREPPGRINDEN: den här har infällt handtag och sidan säger "
                   "det inte")

    # Rostgrinden: nämns rost måste det kvalificeras.
    for m in re.finditer(r"\brost\w*", egna, re.I):
        mening = G.mening_kring(egna, m.start()) + " " + G.nasta_mening(egna, m.start())
        if not re.search(r"lack|pulverlack|förzink|så\s+länge|hel\b|jack|bättra",
                         mening, re.I):
            fel.append(f"ROSTGRINDEN: okvalificerat rostpåstående — …{mening}…")

    # ☠️ FÄRGGRINDEN, två nivåer, via `G.fargformer`.
    egen = FARG[pid]
    syskon = SYSKONFARG.get(pid, set())
    kort = f"{T.NAMN[pid]} {T.TITEL[pid]} {T.META[pid]}"
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
            if re.search(r"kantlist|skena|krom|förzink", mening, re.I):
                continue
            fel.append(f"FÄRGORD {f!r} som varken är egen eller syskonets "
                       f"— …{mening}…")

    fel += [f"HOMOGLYF {c} ({n}) — …{s}…" for c, n, s in G.homoglyfer(txt)]
    fel += [f"NAMNGRIND: {p}" for p in G.granska_namn(T.NAMN[pid])]
    fel += [f"LEVERANSLÖFTE: {p}" for p in G.leveransloften(
        txt, [v for e, v in T.SPEC[pid] if e == "Ingår"], nyckel=pid)]
    return fel


SJALVTEST = [
    ("husmärke", "Hurtsen är en HOMCOM-modell.", True),
    ("artikelnummer", "Modellen heter 845-030CG.", True),
    ("leveransland", "Skickas från Tyskland inom en vecka.", True),
    ("trottoarkant", "Vi levererar fritt till trottoarkant.", True),
    ("attribution", "Leverantören anger 50 kg.", True),
    ("tyskt ord", "Ein Rollcontainer mit drei Schubladen.", True),
    ("engelskt ord", "SAFETY DESIGN på fronten.", True),
    ("rostfri", "Stålet är rostfritt och rostar aldrig.", True),
    ("rostbeständig", "Pulverlackerade lådor är rostbeständiga.", True),
    ("decimalpunkt", "Lådan är 43.2 cm djup.", True),
    ("x som gångertecken", "Måtten är 39 x 48 x 60 cm.", True),
    ("superlativ", "Marknadens bästa hurts.", True),
    ("certifiering", "Hurtsen är CE-märkt enligt norm.", True),
    ("säkerhetslöfte", "En hurts som aldrig tippar.", True),
    ("säkerhetslöfte omvänt", "Den tippar aldrig ens med lådan ute.", True),
    ("relativ länk", '<a href="/produkt/hurts">Syskonet</a>', True),
    ("engelsk enhet", "Bär upp till 110 lbs.", True),
    ("jargong", "Som vi skrev i runda 126.", True),
    ("lådspärr", "Bara en låda åt gången går att öppna.", True),
    ("lådspärr omskriven", "Du kan bara öppna en låda i taget.", True),
    ("skrivarhylla", "En stabil skrivarhylla på hjul.", True),

    ("ren mening", "Tre lådor som alla låses med samma nyckel.", False),
    ("mått", "Hurtsen mäter 39 × 48 × 60 cm och väger 21 kg.", False),
    ("kvalificerad rost", "Lacken skyddar stålet så länge den är hel.", False),
    ("kvalificerad rost 2", "Ett djupt jack kan börja rosta, så bättra på det.", False),
    ("last", "Tål 15 kilo per låda och 50 kilo sammanlagt.", False),
    ("tippskydd", "Ett femte hjul under arkivlådan håller emot.", False),
    ("broms", "Fyra länkhjul varav två med broms.", False),
    ("greppfri", "Släta fronter utan handtag – du drar under kanten.", False),
    ("infällt handtag", "Ett avlångt handtag infällt i varje front.", False),
    ("montering", "Bara hjulen ska skruvas fast.", False),
    ("färg", "Vit plåt med svart kantlist.", False),
    ("skrivare nekas", "Kan jag ställa en skrivare på den? Nej, den tål 3 kilo "
                       "per fack medan en skrivare väger 5 till 10.", False),
]

# Sidor som INTE får fälla en viss grind — grinden får inte skrika på rätt sida.
GRANSKNINGSFALL = [
    ("tre lådor godkänns", "9ba9af92", "LÅDANTAL"),
    ("två lådor godkänns", "66866eb7", "LÅDANTAL"),
    ("två lådor godkänns 2", "521aec3c", "LÅDANTAL"),
    ("tre fack godkänns", "709f7aac", "FACKANTALET"),
    ("höjden 60 godkänns", "9ba9af92", "HÖJD"),
    ("höjden 59 godkänns", "3273d2ee", "HÖJD"),
    ("höjden 67 godkänns", "521aec3c", "HÖJD"),
    ("höjden 67,5 godkänns", "66866eb7", "HÖJD"),
    ("höjden 60 i annan breddgrupp godkänns", "4d5b3bb5", "HÖJD"),
    ("lasten godkänns", "9ba9af92", "LASTGRINDEN"),
    ("totallasten utelämnas korrekt", "521aec3c", "TOTALLASTGRINDEN"),
    ("tippskyddet godkänns", "3273d2ee", "TIPPSKYDDSGRINDEN"),
    ("utan tippskydd fälls inte", "9b8c7308", "TIPPSKYDDSGRINDEN"),
    ("bromsen godkänns", "9ba9af92", "BROMSGRINDEN"),
    ("utan broms fälls inte", "21a12739", "BROMSGRINDEN"),
    ("greppfri godkänns", "3273d2ee", "GREPPGRINDEN"),
    ("infällt handtag godkänns", "9b8c7308", "GREPPGRINDEN"),
    ("bara hjulen godkänns", "3273d2ee", "MONTERINGSGRINDEN"),
    ("montering krävs godkänns", "4d5b3bb5", "MONTERINGSGRINDEN"),
    ("skrivarnekandet godkänns", "709f7aac", "SKRIVARGRINDEN"),
    ("syskonets färg får nämnas i brödtexten", "21a12739", "FÄRGORD 'vit'"),
    ("svart kantlist fälls inte", "9b8c7308", "FÄRGORD 'svart'"),
]

BOJNINGSFALL = [
    ("vit matchar vitt", "vit", "Vitt stativ", True),
    ("vit matchar vita", "vit", "De vita lådorna", True),
    ("vit matchar INTE svart", "svart", "Vita hurtsar", False),
    ("svart matchar svarta", "svart", "De svarta fronterna", True),
    ("nyckel matchar nycklar", None, "två nycklar ingår", True),
]


def sjalvtest():
    fel = []
    monster = FORBJUDET + TONGRINDAR
    for namn, text, ska_falla in SJALVTEST:
        traff = any(m.search(text) for m, _ in monster)
        if traff != ska_falla:
            fel.append(f"SJÄLVTEST {namn!r}: fick {traff}, väntade {ska_falla}")

    for namn, ord_, text, ska in BOJNINGSFALL:
        if ord_ is None:
            traff = bool(re.search(G.fargformer("vit"), text, re.I)) is False
            traff = bool(re.search(r"nyck(el|lar)\w*", text, re.I))
        else:
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
