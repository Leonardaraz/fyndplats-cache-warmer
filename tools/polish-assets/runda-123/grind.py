# -*- coding: utf-8 -*-
"""Runda 123 textgrind — körs på FILEN, före varje API-anrop.

Maskineriet delas med runda 115–122 via `grindar.py`. Det som är NYTT här:

  1. ☠️ **LASTGRINDEN ÄR NEGATIV FÖR EN, inte för alla.** Åtta av nio har ett
     lasttal som stämmer mot BÅDE spec-blocket och leverantörens måttritning,
     och fyra av dem ger dessutom en per-plan-siffra som multiplicerar ihop
     sig exakt. `db2f05f9` är undantaget: 227 kg på familjens enda plastvagn
     med två plan, 51 % över stålvagnar som väger lika mycket. Se STEG2-5.md
     punkt 8. Talet skrivs inte.
  2. ☠️ **FÄRGGRINDEN AVGÖRS AV BILDEN, och facit ligger åt OLIKA HÅLL.**
     `2bf00891` har `Schwarz+Rot` i specen och NOLL röda pixlar på varan;
     `7be028f5` har bara `Schwarz` i namnet och röda stolpar på bilden. En
     regel av formen "specen vinner" hade haft fel i ett av fallen.
  3. ☠️ **MATERIALGRINDEN.** `4e0a06c0` har två olika stålsorter i två källor
     (kallvalsat mot legerat) — sidan skriver `stål` utan bestämning, och
     grinden fäller om någon av kvalificeringarna smyger in. `12cb8a2c` har
     motsatt fel: svenska spec-blocket säger BARA plast om en vagn som tre
     andra källor beskriver som pulverlackerat stål. Grinden kräver att
     stålet står där.
  4. ☠️ **HOPFÄLLNINGSGRINDEN på `2bf00891`.** Leverantören anger 114 cm som
     ett HÖJDMÅTT på en vagn som utfälld är 84 cm hög. Ritningen visar att
     den ligger plant och står på högkant — 114 är en längd. Sidan skriver
     bara tjockleken 18,5 cm, och grinden fäller på 114.
  5. **TILLBEHÖRSGRINDEN gäller ALLA NIO.** Varenda livsstilsbild visar en
     vagn full av verktyg, flaskor och maskiner som inte ingår. Bilden är
     vår, alltså är vilseledningen vår (runda 122:s regel).
  6. **BRUKSGRINDEN är positiv.** Steg 2 kräver två besked på varje sida: lås
     bromsarna innan du lastar, och lägg det tyngsta längst ner. En hög smal
     vagn på hjul tippar annars.
"""
import re
import sys

sys.path.insert(0, "..")

import grindar as G          # noqa: E402
import texter as T           # noqa: E402

# Leveransomfattning per produkt, ur `Lieferumfang`.
INGAR = {
    "887d388d": ["verktygsvagn", "monteringsanvisning"],
    "7be028f5": ["verktygsvagn", "manual"],
    "46a5eeda": ["verktygsvagn", "hålskiva", "krok", "mellanvägg", "manual"],
    "c8105590": ["verkstadsvagn", "anvisning"],
    "df9475dc": ["verktygsvagn", "manual"],
    "4e0a06c0": ["verkstadsvagn", "manual"],
    "db2f05f9": ["verktygsvagn", "manual"],
    "2bf00891": ["verktygsvagn", "monteringsanvisning"],
    "12cb8a2c": ["verkstadsvagn", "monteringsanvisning"],
}

# ☠️ Färgfacit ur BILDERNA. Röd-pixelsökning över alla fem bilderna per
#    produkt; scenens rekvisita (orange stege, röd borrmaskin) räknas inte.
FARG = {
    "887d388d": {"svart", "röd"},
    "7be028f5": {"svart", "röd"},
    "46a5eeda": {"svart", "röd"},
    "c8105590": {"svart"},
    "df9475dc": {"svart"},
    "4e0a06c0": {"svart"},
    "db2f05f9": {"svart"},
    "2bf00891": {"svart"},
    "12cb8a2c": {"svart"},
}

# ☠️ Bara EN. Se docstring punkt 1.
UTAN_TOTALLAST = {"db2f05f9"}

# ☠️ `4e0a06c0`: två källor, två olika stålsorter. Sidan skriver `stål` naket.
UTAN_STALSORT = {"4e0a06c0"}

# ☠️ `12cb8a2c`: svenska spec-blocket tappar stålet. Sidan MÅSTE nämna det.
MASTE_NAMNA_STAL = {"12cb8a2c"}

# ☠️ `2bf00891`: 114 cm är en längd, inte en höjd. Talet skrivs inte alls.
FORBJUDET_TAL = {"2bf00891": ["114"]}

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
    (re.compile(r"\b(werkzeug\w*|werkstatt\w*|rollwagen|etagenwagen|"
                r"montagewagen|servicewagen|regal\w*|ablage\w*|schublade\w*|"
                r"belastbarkeit|farbe|gewicht|kunststoff|stahl|lieferumfang|"
                r"montage|abmessungen|haken|lochplatte\w*|griff|räder|rader|"
                r"bremsen|schwarz|rot|ebenen|stufig\w*|klappbar)\b", re.I),
     "TYSKT ORD"),
    (re.compile(r"\b\d+\s*(lbs?|inch|inches|ft|gal)\b", re.I), "ENGELSK ENHET"),
    # ☠️ Ingen av de nio är rostfri. Fyra är plast, fem är lackerat stål.
    (re.compile(r"\brostfri\w*|\brostfritt\b", re.I), "ROSTFRI LÖGN"),
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
]


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

    # ☠️ Flikordningen. Butikens splitFlikar är en allowlist på fyra strängar.
    rubriker = re.findall(r"<h2>(.*?)</h2>", html)
    if "Användning och skötsel" not in rubriker:
        fel.append(f"FLIKRUBRIKEN saknas eller stavas fel — {rubriker}")
    if "Tekniska specifikationer" in rubriker and "Passar inte den här?" in rubriker:
        if rubriker.index("Passar inte den här?") > rubriker.index("Tekniska specifikationer"):
            fel.append("KORSLÄNKARNA ligger EFTER spec-fliken — de hamnar inne i den")

    # ☠️ Lastgrinden, negativ för `db2f05f9`. HELA MENINGEN läses, så
    #    produktens EGEN vikt ("väger 16 kg") inte fälls som ett lastbesked.
    if pid in UTAN_TOTALLAST:
        for m in re.finditer(r"\b(tål|maxlast|maxbelastning|belastning)\b"
                             r"[^.!?]{0,40}\b\d+(?:,\d+)?\s*kg", txt, re.I):
            mening = G.mening_kring(txt, m.start()).lower()
            if "väger" not in mening and "vikt" not in mening:
                fel.append(f"TOTALLAST FÖRBJUDEN här: …{mening}…")
        if "227" in txt:
            fel.append("DET OBEKRÄFTADE TALET 227 står på sidan")

    # ☠️ Lastgrinden är POSITIV för de åtta andra: ett lasttal som ÄR verifierat
    #    mot tre källor ska stå där. En grind som bara förbjuder svarar grönt på
    #    en sida som tiger.
    else:
        if not re.search(r"\btål\b[^.!?]{0,60}\b\d+(?:,\d+)?\s*kg", txt, re.I):
            fel.append("LASTGRINDEN: sidan säger inte hur mycket vagnen tål")

    # ☠️ Stålsortsgrinden.
    if pid in UTAN_STALSORT:
        for m in re.finditer(r"\b(kallvalsa\w*|legera\w*)\b", txt, re.I):
            fel.append(f"STÅLSORT som källorna är OENIGA om: "
                       f"…{G.mening_kring(txt, m.start())}…")
    if pid in MASTE_NAMNA_STAL and not re.search(r"\bstål\b", txt, re.I):
        fel.append("STÅLGRINDEN: spec-blocket säger bara plast, men tre andra "
                   "källor säger stål — sidan måste nämna stålet")

    # ☠️ Hopfällningsgrinden.
    for tal in FORBJUDET_TAL.get(pid, []):
        for m in re.finditer(rf"(?<!\d){tal}(?!\d)", txt):
            fel.append(f"FÖRBJUDET TAL {tal!r} — "
                       f"…{G.mening_kring(txt, m.start())}…")

    # ☠️ Tillbehörsgrinden, alla nio. Livsstilsbilderna visar verktyg som
    #    inte ingår.
    # ☠️ Beskedet levereras som ett FRÅGA–SVAR-PAR: frågan nämner verktygen och
    #    bilderna, svaret börjar med "Nej". Ett mönster som kräver båda i SAMMA
    #    mening fällde alla nio korrekta sidor i första körningen — inklusive
    #    de tre som redan hade FAQ:n. Samma familj som uppgift #415, men åt det
    #    ofarliga hållet: grinden skrek på en sida som gjorde rätt. Den läser
    #    därför över ETT meningsslut.
    if not re.search(r"verktyg\w*[^?!.]{0,60}bilder\w*\s*\?\s*Nej\b"
                     r"|verktyg\w*[^.!?]{0,90}(ingår\s+(inte|ej)|"
                     r"medföljer\s+inte|köper\s+du\s+separat|säljs\s+separat)",
                     txt, re.I):
        fel.append("TILLBEHÖRSGRINDEN: livsstilsbilden visar verktyg som inte "
                   "ingår, och sidan säger det inte")

    # Bruksgrinden, positiv på alla nio (Steg 2).
    if not re.search(r"lås\w*[^.!?]{0,80}\b(broms|hjul)", txt, re.I):
        fel.append("BRUKSGRINDEN: sidan säger inte att hjulen ska låsas")
    if not re.search(r"tyngsta[^.!?]{0,60}(nedersta|längst\s+ner)", txt, re.I):
        fel.append("BRUKSGRINDEN: sidan säger inte att det tyngsta hör hemma "
                   "längst ner")

    # ☠️ Färggrinden läser SIDANS EGNA meningar, inte korslänkarna.
    egna_rader, _ = G.dela_pa_ankare(html)
    egna = G.synlig_meningstext(" ".join(egna_rader))
    for ord_ in G.FARGORD:
        if re.search(rf"\b{ord_}\w*\b", egna, re.I) and ord_ not in FARG[pid]:
            fel.append(f"FÄRGORD {ord_!r} — uppmätt på bilden är {sorted(FARG[pid])}")

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
    if len(T.TITEL[pid]) > 60:
        fel.append(f"TITELN är {len(T.TITEL[pid])} tecken (max 60)")
    if len(T.META[pid]) > 155:
        fel.append(f"METAN är {len(T.META[pid])} tecken (max 155)")

    huvud = T.SOKORD[pid][0]
    for del_ in huvud.split():
        if len(del_) > 2 and del_.lower() not in (T.NAMN[pid] + T.TITEL[pid]).lower():
            fel.append(f"HUVUDORDETS del {del_!r} saknas i namn/titel")
    return fel


SJALVTEST = [
    ("husmärke fälls", "Vagnen från HOMCOM rullar bra.", True),
    ("tyskt ord fälls", "Werkzeugwagen med tre Ebenen.", True),
    ("tyskt materialord fälls", "Ramen är av Stahl.", True),
    ("rostfri lögn fälls", "Ramen är i rostfritt stål.", True),
    ("leveransland fälls", "Vagnen skickas från Tyskland.", True),
    ("attribution fälls", "Leverantören anger 150 kg.", True),
    ("decimalpunkt fälls", "Planet är 35.5 cm brett.", True),
    ("engelsk enhet fälls", "Hjulen är 3 inches.", True),
    ("superlativ fälls", "Marknadens bästa verktygsvagn.", True),
    ("sortimentspåstående fälls", "Den stabilaste vagnen i sortimentet.", True),
    ("sortimentspåstående, oregelbunden form", "Den bästa vagnen hos oss.", True),
    ("certifiering fälls", "Vagnen är testad enligt en europeisk norm.", True),
    ("ber kunden mäta fälls", "Mät din dörröppning först.", True),
    ("hållbarhetslöfte fälls", "Ramen håller för alltid.", True),
    # ☠️ Fjorton negativa fall. En grind som bara fäller lär mottagaren att
    #    sluta läsa (uppgift #397, #434).
    ("stål utan sort går fritt", "Ramen är av stål.", False),
    ("pulverlackerad går fritt", "Ytan är pulverlackerad.", False),
    ("plast går fritt", "Chassit är i plast.", False),
    ("normal måttrad går fritt", "Vagnen mäter 83 × 43 × 97 cm.", False),
    ("decimalkomma går fritt", "Planet är 35,5 cm brett.", False),
    ("svart som färg går fritt", "Ramen är svart.", False),
    ("röd som färg går fritt", "Stolparna är röda.", False),
    ("kilogram utan superlativ går fritt", "Vagnen tål 150 kg.", False),
    ("rundade hörn går fritt", "Hörnen är rundade och stötdämpande.", False),
    ("broms går fritt", "Två av fyra hjul har broms.", False),
    ("hålskiva går fritt", "Hålskivorna sitter på sidan.", False),
    ("montering går fritt", "Vagnen levereras omonterad.", False),
    ("verktygshål går fritt", "De gjutna hålen håller verktygen stående.", False),
    ("hopfällbar går fritt", "Vagnen fälls ihop till 18,5 cm tjocklek.", False),
]

# ☠️ Grindarna i granska() går inte att pröva med mönster ensamma.
GRANSKNINGSFALL = [
    ("korslänkens ord fäller INTE färgsyskonet", "887d388d", "FÄRGORD"),
    ("egenvikten 16 kg fäller INTE lastgrinden", "db2f05f9", "TOTALLAST"),
    ("den positiva lastgrinden är uppfylld på de åtta", "df9475dc", "LASTGRINDEN"),
    ("stålsortsgrinden fäller INTE en sida som skriver stål naket",
     "4e0a06c0", "STÅLSORT"),
    ("stålgrinden är uppfylld på 12cb8a2c", "12cb8a2c", "STÅLGRINDEN"),
    ("114 står inte på den hopfällbara", "2bf00891", "FÖRBJUDET TAL"),
    ("tillbehörsgrinden är uppfylld på alla nio", "c8105590", "TILLBEHÖRSGRINDEN"),
    ("bruksgrinden är uppfylld på alla nio", "12cb8a2c", "BRUKSGRINDEN"),
]


# ☠️ KÄLLKODSSVEPET: en homoglyf letas i HELA FILEN, inte per sida.
#    `G.homoglyfer` läser en sida i taget och hittade mycket riktigt ett
#    kyrilliskt `а` i `887d388d`:s skötseltext — men bara för att det råkade
#    ligga där. Regeln från runda 122 är "rätta per ORD, inte per förekomst":
#    hittar du ett tecken ska du söka det i HELA batchen innan du skriver
#    något. Den här grinden gör det mekaniskt, en gång, över filen.
TILLATNA_KALLTECKEN = set(
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "åäöÅÄÖéÉüÜ0123456789 \t\n\r"
    "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~×–—…°²³·§"
    "\u2620\ufe0f\U0001f512\u26a0\u2705")


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


def sjalvtest():
    fel = []
    for namn, txt, ska_falla in SJALVTEST:
        traff = any(m.search(txt) for m, _ in FORBJUDET + TONGRINDAR)
        if traff != ska_falla:
            fel.append(f"SJÄLVTEST {namn!r}: fick {traff}, väntade {ska_falla}")
    for namn, pid, etikett in GRANSKNINGSFALL:
        if any(f.startswith(etikett) or etikett in f for f in granska(pid)):
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
