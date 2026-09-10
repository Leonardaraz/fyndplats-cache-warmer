# -*- coding: utf-8 -*-
"""Runda 124 textgrind — körs på FILEN, före varje API-anrop.

Maskineriet delas med runda 115–123 via `grindar.py`. Det som är NYTT här:

  1. ☠️ **LÅSGRINDEN, och den är rundans farligaste.** Tyskans "abschließbar"
     står på sex av elva sidor och betyder INTE samma sak på alla sex. Grupp
     A (`aafbf543`, `5541fbb0`, `0283be34`, `8a6922ce`) har två spännlås med
     hänglåsögla och INGEN cylinder — bilden visar öglan, och leveransen är
     låda plus anvisning. Grupp C (`94925af2`, `aae03048`) har äkta
     cylinderlås och två nycklar i kartongen. Grinden kräver rätt besked på
     rätt grupp och FÖRBJUDER det andra.
  2. ☠️ **LÅDANTALSGRINDEN är negativ MOT LEVERANTÖRENS EGET NAMN.**
     `370918a9` heter så att man tror fyra och har två; `94925af2` och
     `aae03048` heter "3 Schubladen" och har sex. Grinden fäller på det
     FELAKTIGA talet, inte bara på ett saknat rätt.
  3. ☠️ **ROSTGRINDEN.** `7b544155`:s källtext påstår både "rostet nicht" och
     "rostbeständig" i samma stycke. Ingen av de elva är rostfri. Ordet får
     inte förekomma, och den som nämner rost måste kvalificera det.
  4. ☠️ **FÄRGGRINDEN HAR TVÅ NIVÅER.** Sidorna jämför sig med sina
     färgsyskon i klartext ("Vad skiljer den från den helröda?"), så en grind
     som förbjuder varje främmande färgord hade fällt sju korrekta sidor. Den
     släpper därför igenom SYSKONETS färg i brödtexten — men kräver att
     NAMN, TITEL och META bär exakt produktens egen färg och ingen annans.
     Det är den riktningen som säljer fel vara.
  5. **TILLBEHÖRSGRINDEN gäller alla elva.** Varje livsstilsbild visar
     verktyg som inte ingår. Grupp B:s minilådor och plastinsats DÄREMOT
     ingår, och grinden kräver att de nämns.
"""
import re
import sys

sys.path.insert(0, "..")

import grindar as G          # noqa: E402
import texter as T           # noqa: E402

GRUPP_A = {"aafbf543", "5541fbb0", "0283be34", "8a6922ce"}   # hänglåsögla
GRUPP_B = {"370918a9", "b9cca4a6", "f50b75d8"}               # plast + minilådor
GRUPP_C = {"94925af2", "aae03048"}                           # cylinderlås

# Leveransomfattning per produkt, ur `Lieferumfang`.
INGAR = {
    "7b544155": ["verktygslåda", "anvisning"],
    "22bedfb0": ["verktygslåda", "anvisning"],
    "370918a9": ["verktygslåda", "anvisning", "plastinsats", "minilåda"],
    "aafbf543": ["verktygslåda", "anvisning"],
    "5541fbb0": ["verktygslåda", "anvisning"],
    "0283be34": ["verktygslåda", "anvisning"],
    "8a6922ce": ["verktygslåda", "anvisning"],
    "b9cca4a6": ["verktygslåda", "anvisning", "plastinsats", "minilåda"],
    "94925af2": ["verktygslåda", "nyckel", "nycklar"],
    "aae03048": ["verktygslåda", "nyckel", "nycklar"],
    "f50b75d8": ["verktygslåda", "anvisning", "plastinsats", "minilåda"],
}

# ☠️ Färgfacit ur BILDERNA, inte ur spec-blocket. `22bedfb0` anges som
#    `Farbe: Rot` och har SVARTA lådfronter; `aae03048` anges som `Schwarz`
#    och är helsvart trots att Steg 1 gissade svart och silver.
FARG = {
    "7b544155": {"röd"},
    "22bedfb0": {"röd", "svart", "silverfärgad"},
    "370918a9": {"svart", "orange"},
    "aafbf543": {"svart", "röd"},
    "5541fbb0": {"röd"},
    "0283be34": {"svart", "röd"},
    "8a6922ce": {"röd"},
    "b9cca4a6": {"svart", "gul"},
    "94925af2": {"svart", "röd"},
    "aae03048": {"svart"},
    "f50b75d8": {"svart", "orange"},
}

# Färger sidan får nämna i BRÖDTEXTEN när den jämför sig med sitt syskon.
SYSKONFARG = {
    "5541fbb0": {"svart"},
    "8a6922ce": {"svart"},
    "aae03048": {"röd"},
    "b9cca4a6": {"orange"},
    "f50b75d8": {"gul"},
    "0283be34": {"röd"},
    "aafbf543": {"röd"},
    "94925af2": {"svart"},
}

# ☠️ Lådantal ur BRÖDTEXT + BILD, inte ur leverantörens produktnamn.
LADOR = {"7b544155": None, "22bedfb0": 3, "370918a9": 2, "aafbf543": 3,
         "5541fbb0": 3, "0283be34": 4, "8a6922ce": 4, "b9cca4a6": 4,
         "94925af2": 6, "aae03048": 6, "f50b75d8": 4}

RAKNEORD = {2: "två", 3: "tre", 4: "fyra", 5: "fem", 6: "sex"}

# Totallast ur brödtexten, verifierad mot måttritningen där en sådan finns.
LAST = {"7b544155": "25", "22bedfb0": "20", "370918a9": "30", "aafbf543": "16",
        "5541fbb0": "16", "0283be34": "18", "8a6922ce": "18", "b9cca4a6": "30",
        "94925af2": "50", "aae03048": "50", "f50b75d8": "30"}

FORBJUDET = [
    (re.compile(r"\b(homcom|outsunny|pawhut|aiyaplay|vinsetto|aosom)\b", re.I),
     "HUSMÄRKE"),
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
                r"abmessungen|griff|schwarz|kugellager|verschluss|"
                r"verschlüsse|abschließbar|staufach|schlüssel|aufklappbar)\b",
                re.I), "TYSKT ORD"),
    (re.compile(r"\b\d+\s*(lbs?|inch|inches|ft|gal)\b", re.I), "ENGELSK ENHET"),
    # ☠️ Ingen av de elva är rostfri. Alla är pulverlackerat stål eller plast.
    (re.compile(r"\brostfri\w*|\brostfritt\b|\brostar\s+(inte|aldrig)\b|"
                r"\brostsäker\w*", re.I), "ROSTFRI LÖGN"),
    # Sifferstilen.
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
    # ☠️ Rundans egen: "stöldsäker" är ett löfte ingen av dem kan hålla.
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
    return G.synlig_meningstext(T.bygg(pid))


def _talen(txt):
    return set(re.findall(r"\d+(?:,\d+)?", txt))


def granska(pid):
    html = T.bygg(pid)
    txt = _text(pid)
    fel = []

    for monster, etikett in FORBJUDET + TONGRINDAR:
        for m in monster.finditer(txt):
            fel.append(f"{etikett}: …{G.mening_kring(txt, m.start())}…")

    # ☠️ INTE `G.flikfel` här — den letar efter <summary> och är byggd för
    #    den RENDERADE sidan. Mot källkoden fäller den alla elva korrekta
    #    sidor. Källgrinden kontrollerar <h2>-ordningen, som runda 123.
    rubriker = re.findall(r"<h2>(.*?)</h2>", html)
    if "Användning och skötsel" not in rubriker:
        fel.append(f"FLIKRUBRIKEN saknas eller stavas fel — {rubriker}")
    if "Tekniska specifikationer" in rubriker and "Passar inte den här?" in rubriker:
        if rubriker.index("Passar inte den här?") > rubriker.index("Tekniska specifikationer"):
            fel.append("KORSLÄNKARNA ligger EFTER spec-fliken — de hamnar inne i den")

    # ☠️ ANKARSPLITTEN LIGGER FÖRE LÅS- OCH LÅDANTALSGRINDEN, med flit:
    #    båda talar om EGENSKAPER, och en korslänk beskriver syskonets.
    egna_rader, _ = G.dela_pa_ankare(html)
    egna = G.synlig_meningstext(" ".join(egna_rader))

    # ☠️ LÅSGRINDEN. Tre besked, ett per grupp, och de utesluter varandra.
    if pid in GRUPP_A:
        if not re.search(r"hänglås", egna, re.I):
            fel.append("LÅSGRINDEN: spännlåsens ögla tar ett HÄNGLÅS — "
                       "sidan säger inte hur den låses")
        if not re.search(r"hänglås[^.!?]{0,40}(ingår\s+inte|följer\s+inte)"
                         r"|(ingår\s+inte|följer\s+inte)[^.!?]{0,40}hänglås"
                         r"|hänglås\s+och\s+nyckel\s+ingår\s+inte", egna, re.I):
            fel.append("LÅSGRINDEN: sidan säger inte att hänglåset INTE ingår")
        if re.search(r"\bnyckel(n|ar|arna)?\s+(ingår|följer|medföljer)"
                     r"(?!\s+(inte|ej))"
                     r"|\bnyckellås|\bcylinderlås", egna, re.I):
            fel.append("LÅSGRINDEN: gruppen har varken cylinder eller nyckel")
    elif pid in GRUPP_C:
        if not re.search(r"\bcylinderlås\b", egna, re.I):
            fel.append("LÅSGRINDEN: sidan nämner inte cylinderlåset")
        if not re.search(r"två\s+nycklar[^.!?]{0,30}(ingår|följer|medföljer)"
                         r"|(ingår|följer|medföljer)[^.!?]{0,30}två\s+nycklar",
                         egna, re.I):
            fel.append("LÅSGRINDEN: sidan säger inte att två nycklar ingår")
        if re.search(r"hänglås", egna, re.I):
            fel.append("LÅSGRINDEN: den här har cylinderlås, inte hänglåsögla")
    else:
        for m in re.finditer(r"hänglås|nyckellås|cylinderlås|låsbar", egna, re.I):
            fel.append(f"LÅSGRINDEN: modellen har inget lås — "
                       f"…{G.mening_kring(egna, m.start())}…")

    # ☠️ LÅDANTALSGRINDEN, negativ mot leverantörens felaktiga produktnamn.
    n = LADOR[pid]
    if n is not None:
        ratt = RAKNEORD[n]
        if not re.search(rf"\b({ratt}|{n})\b[^.!?]{{0,30}}\blåd", egna, re.I):
            fel.append(f"LÅDANTALET {n} står inte på sidan")
        for fel_n, fel_ord in RAKNEORD.items():
            if fel_n == n:
                continue
            for m in re.finditer(rf"\b({fel_ord}|{fel_n})\s+(utdrags|stål|)?låd",
                                 egna, re.I):
                fel.append(f"FEL LÅDANTAL {fel_n} (rätt är {n}) — "
                           f"…{G.mening_kring(egna, m.start())}…")

    # Lastgrinden är POSITIV på alla elva: talet är verifierat mot källan.
    if not re.search(rf"\btål\b[^.!?]{{0,60}}\b{LAST[pid]}\s*(kg|kilo)", txt, re.I):
        fel.append(f"LASTGRINDEN: sidan säger inte att den tål {LAST[pid]} kg")

    # ☠️ Rostgrinden är positiv där rost NÄMNS: den måste kvalificeras.
    for m in re.finditer(r"\brost\w*", txt, re.I):
        mening = G.mening_kring(txt, m.start())
        if not re.search(r"lack|pulverlack|så\s+länge|hel\b|repa", mening, re.I):
            fel.append(f"ROSTGRINDEN: okvalificerat rostpåstående — …{mening}…")

    # ☠️ Tillbehörsgrinden, alla elva.
    if not re.search(r"verktyg\w*[^?!.]{0,60}bilder\w*\s*\?\s*Nej\b"
                     r"|verktyg\w*[^.!?]{0,90}(ingår\s+(inte|ej)|"
                     r"medföljer\s+inte|köper\s+du\s+separat|säljs\s+separat)",
                     txt, re.I):
        fel.append("TILLBEHÖRSGRINDEN: livsstilsbilden visar verktyg som inte "
                   "ingår, och sidan säger det inte")

    # Grupp B:s minilådor och insats INGÅR — det ska stå.
    if pid in GRUPP_B:
        if not re.search(r"minilåd\w*[^.!?]{0,60}\bingår\b"
                         r"|\bingår\b[^.!?]{0,60}minilåd", txt, re.I):
            fel.append("TILLBEHÖRSGRINDEN: minilådorna INGÅR och sidan "
                       "säger det inte")
        if not re.search(r"uttagbar\w*\s+plastinsats|plastinsats", txt, re.I):
            fel.append("TILLBEHÖRSGRINDEN: den uttagbara insatsen nämns inte")

    # ☠️ Färggrinden, nivå 1: brödtexten får nämna syskonets färg.
    tillatna = FARG[pid] | SYSKONFARG.get(pid, set())
    for ord_ in G.FARGORD:
        if re.search(rf"\b{ord_}\w*\b", egna, re.I) and ord_ not in tillatna:
            fel.append(f"FÄRGORD {ord_!r} — uppmätt på bilden är {sorted(FARG[pid])}")

    # ☠️ Färggrinden, nivå 2: namn, titel och meta bär BARA egen färg.
    for falt, varde in (("namn", T.NAMN[pid]), ("titel", T.TITEL[pid]),
                        ("meta", T.META[pid])):
        for ord_ in G.FARGORD:
            if re.search(rf"\b{ord_}\w*\b", varde, re.I) and ord_ not in FARG[pid]:
                fel.append(f"FÄRGORD {ord_!r} i {falt} — säljer fel färg "
                           f"(uppmätt: {sorted(FARG[pid])})")

    fel += G.leveransloften(txt, INGAR[pid], pid)
    fel += G.homoglyfer(txt)
    fel += G.granska_namn(T.NAMN[pid])

    # Talen i meta, titel och namn måste finnas i brödtexten.
    for falt, varde in (("meta", T.META[pid]), ("titel", T.TITEL[pid]),
                        ("namn", T.NAMN[pid])):
        for tal in _talen(varde) - _talen(txt):
            fel.append(f"OSPÅRAT TAL {tal!r} i {falt} — står inte i brödtexten")

    if len(T.NAMN[pid]) > 80:
        fel.append(f"NAMNET är {len(T.NAMN[pid])} tecken (max 80)")
    if len(T.TITEL[pid]) > 70:
        fel.append(f"TITELN är {len(T.TITEL[pid])} tecken (max 70)")
    if len(T.META[pid]) > 155:
        fel.append(f"METAN är {len(T.META[pid])} tecken (max 155)")
    return fel


SJALVTEST = [
    ("husmärke", "En låda från HOMCOM med tre lådor.", True),
    ("artikelnummer", "Modellreferens: 845-030CG står i specen.", True),
    ("land", "Lådan skickas från Tyskland inom två dagar.", True),
    ("attribution", "Leverantören anger 30 kilo som maxlast.", True),
    ("tyskt ord", "Lådan har tre Schubladen och ett Staufach.", True),
    ("rostfri", "Stålet är rostfritt och tål väta.", True),
    ("rostar inte", "En lackerad låda som rostar inte i garaget.", True),
    ("engelsk enhet", "Lådan tål 60 lbs fullastad.", True),
    ("decimalpunkt", "Lådan är 49.7 cm bred.", True),
    ("x som gångertecken", "Måtten är 49 x 25 x 40 cm.", True),
    ("superlativ", "Marknadens bästa verktygslåda.", True),
    ("eget sortiment", "Den rymligaste lådan i sortimentet.", True),
    ("certifiering", "Lådan är CE-märkt enligt gällande norm.", True),
    ("stöldsäker", "Ett stöldsäkert lås som inte går att bryta.", True),
    ("relativ länk", '<a href="/produkt/verktygslada">Syskonet</a>', True),

    ("ren mening", "Tre lådor på kullagerskenor och ett fack under locket.", False),
    ("mått", "Lådan mäter 51 × 22 × 32 cm och väger 10,5 kg.", False),
    ("kvalificerad rost", "Lacken skyddar mot rost så länge den är hel.", False),
    ("hänglås", "Spännlåsen har en ögla för hänglås. Hänglås ingår inte.", False),
    ("nyckel", "Ett cylinderlås med två nycklar som ingår.", False),
    ("last", "Lådan tål 30 kg totalt och 10 kg per låda.", False),
    ("färg", "Svart kropp med röda lådfronter och silverfärgade slister.", False),
    ("orange", "Fyra orange stållådor i ett svart hölje.", False),
    ("verktyg ingår inte", "Verktygen på bilderna ingår inte.", False),
    ("minilådor", "Två minilådor sitter i locket — de ingår.", False),
    ("skötsel", "Torka av lacken med en fuktig trasa och torka efter.", False),
    ("kullager", "Skenorna är kullagrade och drar ut hela lådan.", False),
    ("gasfjäder", "Locket lyfts av två gasfjädrar och står kvar öppet.", False),
    ("vikt", "Den väger 14,9 kg tom och kräver ingen montering.", False),
]

# Sidor som INTE får fälla en viss grind — grinden får inte skrika på rätt sida.
GRANSKNINGSFALL = [
    ("hänglåsbeskedet räknas som giltigt", "aafbf543", "LÅSGRINDEN"),
    ("nyckelbeskedet räknas som giltigt", "94925af2", "LÅSGRINDEN"),
    ("modell utan lås får vara tyst", "370918a9", "LÅSGRINDEN"),
    ("två lådor godkänns", "370918a9", "FEL LÅDANTAL"),
    ("sex lådor godkänns", "aae03048", "FEL LÅDANTAL"),
    ("syskonets färg får nämnas i brödtexten", "5541fbb0", "FÄRGORD 'svart'"),
    ("orange är en giltig egen färg", "f50b75d8", "FÄRGORD 'orange'"),
    ("kvalificerad rost fälls inte", "7b544155", "ROSTGRINDEN"),
    ("minilådorna räknas som nämnda", "b9cca4a6", "TILLBEHÖRSGRINDEN: minilådorna"),
]


def sjalvtest():
    fel = []
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
    print(f"grind.sjalvtest(): {len(SJALVTEST) + len(GRANSKNINGSFALL)} fall, "
          f"{len(st)} fel")
    for f in st:
        print("  ", f)
    print(G._sjalvtest() if hasattr(G, "_sjalvtest") else "")
    tot = 0
    for pid in T.NAMN:
        f = granska(pid)
        tot += len(f)
        print(f"{'OK ' if not f else 'FEL'} {pid}  {T.SLUG[pid]}")
        for rad in f:
            print("     ", rad)
    print(f"\n{len(T.NAMN)} sidor, {tot} fel")
