# -*- coding: utf-8 -*-
"""Runda 122 textgrind — körs på FILEN, före varje API-anrop.

Maskineriet delas med runda 115–121 via `grindar.py`. Det som är NYTT här:

  1. ☠️ **LASTGRINDEN ÄR NEGATIV FÖR ALLA FYRA**, inte för två som i runda
     121. Leverantören anger 15 respektive 25 kg totalt — men hinkarna rymmer
     36 till 48 liter, och lika många kilo vatten. Talet är obrukbart på
     varenda modell och får inte skrivas. Se STEG2-5.md.
  2. ☠️ **VIKTGRINDEN på `832f9eec`.** Feedens kolumn säger 21,7 kg, den tyska
     texten "ca. 20 kg" — och SAMMA kolumn har redan bevisats fel om måtten
     (100 × 70 mot bildens 93 × 80). Vikten utelämnas, och grinden fäller om
     den smyger tillbaka.
  3. ☠️ **VOLYMGRINDEN på `6490e360`.** Leverantören anger hinkarnas MÅTT men
     ingen volym. En liter-siffra där vore ett påhittat tal, uträknat ur
     innermått på en hink som smalnar av. Grinden fäller på `liter` för just
     den produkten.
  4. **Moppgrinden är positiv**, ärvd från runda 121: `Lieferumfang` nämner
     ingen mopp på någon av de fyra, och `0cbffcd9`:s livsstilsbild visar en
     i bruk. En grind som bara förbjuder ett felaktigt påstående hade svarat
     grönt på en sida som tiger.
"""
import re
import sys

sys.path.insert(0, "..")

import grindar as G          # noqa: E402
import texter as T           # noqa: E402

# Leveransomfattning per produkt, ur `Lieferumfang`.
INGAR = {
    "6490e360": ["moppvagn", "hink", "press", "monteringsanvisning"],
    "0cbffcd9": ["städvagn", "hink", "press", "sopsäck", "monteringsanvisning"],
    "740fa6d0": ["städvagn", "hink", "press", "sopsäck", "monteringsanvisning"],
    "832f9eec": ["städvagn", "hink", "press", "sopsäck"],
}

# Färgfacit ur BILDERNA, inte ur leverantörens rad — fyra av åtta rader var
# ofullständiga (se STEG4.md).
FARG = {
    "6490e360": {"blå", "röd", "grå"},
    "0cbffcd9": {"grå", "blå", "orange"},
    "740fa6d0": {"svart", "blå", "orange"},
    "832f9eec": {"vit", "grå", "blå", "orange"},
}

# ☠️ ALLA FYRA. Se docstring punkt 1 — ingen av dem har ett brukbart lasttal.
UTAN_TOTALLAST = {"6490e360", "0cbffcd9", "740fa6d0", "832f9eec"}

# ☠️ `832f9eec`:s vikt är oavgjord mellan två källor, och den ena har redan
#    bevisats fel om måtten. Ingen viktrad på den sidan.
UTAN_VIKT = {"832f9eec"}

# ☠️ `6490e360`:s hinkar har MÅTT men ingen volym i leverantörens data. En
#    litersiffra vore uträknad ur innermått på en hink som smalnar av — alltså
#    ett påhittat tal.
UTAN_VOLYM = {"6490e360"}

# ☠️ Produkter vars livsstilsbild visar ett tillbehör som inte ingår.
#    `0cbffcd9`:s bild 2 visar en person som moppar med en mopp vi inte säljer
#    till vagnen. Bilden är vår, alltså är vilseledningen vår.
MASTE_NEKA_TILLBEHOR = {
    "0cbffcd9": r"mopp\w*[^.!?]{0,90}(köper du separat|ingår inte)",
}

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
    (re.compile(r"\b(reinigungs\w*|putz\w*|wisch\w*|eimer|moppwagen|karre|"
                r"belastbarkeit|farbe|gewicht|kunststoff|lieferumfang|"
                r"montage|abmessungen|auspresser|wringer|deckel|"
                r"müllsack|mullsack|schwarz|gelb|blau|weiß)\b", re.I),
     "TYSKT ORD"),
    (re.compile(r"\b\d+\s*(lbs?|inch|inches|ft|gal)\b", re.I), "ENGELSK ENHET"),
    # ☠️ Materialet är plast och metall på samtliga åtta.
    (re.compile(r"\brostfri\w*|\brostfritt\b", re.I), "ROSTFRI LÖGN"),
    # Sifferstilen: `x` som gångertecken, punkt som decimaltecken, och en
    # kommalista av tal med enheten sist.
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
    (re.compile(r"\b(certifierad|ce-märkt|godkänd\s+enligt|haccp|"
                r"livsmedelsgodkänd)\b", re.I), "OGRUNDAD CERTIFIERING"),
    (re.compile(r"\b(mät|väg|kontrollera)\s+(din|ditt|dina)\b", re.I),
     "BER KUNDEN MÄTA"),
    (re.compile(r"\b(desinficer\w*|steriliser\w*|dödar\s+bakterier|"
                r"99[,.]9\s*%)\b", re.I), "HYGIENPÅSTÅENDE UTAN TÄCKNING"),
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

    # ☠️ Flikordningen. Butikens splitFlikar är en allowlist på fyra strängar
    #    och lägger allt EFTER en flikrubrik inne i den fliken.
    rubriker = re.findall(r"<h2>(.*?)</h2>", html)
    if "Användning och skötsel" not in rubriker:
        fel.append(f"FLIKRUBRIKEN saknas eller stavas fel — {rubriker}")
    if "Tekniska specifikationer" in rubriker and "Passar inte den här?" in rubriker:
        if rubriker.index("Passar inte den här?") > rubriker.index("Tekniska specifikationer"):
            fel.append("KORSLÄNKARNA ligger EFTER spec-fliken — de hamnar inne i den")

    # ☠️ Moppgrinden är POSITIV — och den letar efter BESKEDET, inte efter en
    #    ordagrann fras. Runda 122:s första körning fällde alla fyra korrekta
    #    texter för att mönstret krävde exakt "moppen ingår inte" medan sidorna
    #    sade "Moppen och moppskaftet köper du separat". Ett besked som når
    #    kunden lika väl fälldes alltså som om det saknades. Kravet är nu: en
    #    mening som nämner moppen OCH nekar den — negation eller "separat".
    if not re.search(r"mopp\w*[^.!?]{0,90}(ingår\s+(inte|ej)|medföljer\s+inte|"
                     r"köper\s+du\s+separat|säljs\s+separat)", txt, re.I):
        fel.append("MOPPGRINDEN: sidan säger inte att moppen inte ingår")

    # ☠️ Tillbehörsgrinden.
    if pid in MASTE_NEKA_TILLBEHOR:
        if not re.search(MASTE_NEKA_TILLBEHOR[pid], txt, re.I):
            fel.append("TILLBEHÖRSGRINDEN: livsstilsbilden visar något som "
                       "inte ingår, och sidan säger det inte")

    # ☠️ Lastgrinden är negativ för två produkter.
    if pid in UTAN_TOTALLAST:
        # ☠️ HELA MENINGEN, inte matchningens 40-teckenfönster. Första utkastet
        #    läste bara fönstret, och "Korgens maxlast: 5 kg" började då efter
        #    ordet "Korgens" — undantaget kunde alltså aldrig träffa det ord
        #    det var skrivet för. Tre falsklarm på två produkter.
        # ☠️ HELA MENINGEN, inte matchningens fönster (runda 121:s lagning).
        #    Undantaget här är produktens EGEN vikt — "väger 9,7 kg" är ett
        #    fraktbesked, inte ett lastbesked, och ska inte fällas.
        for m in re.finditer(r"\b(tål|maxlast|maxbelastning|totalt|belastning)\b"
                             r"[^.!?]{0,40}\b\d+(?:,\d+)?\s*kg", txt, re.I):
            mening = G.mening_kring(txt, m.start()).lower()
            if "väger" not in mening and "vikt" not in mening:
                fel.append(f"TOTALLAST FÖRBJUDEN här: …{mening}…")

    # ☠️ Viktgrinden. Två källor, den ena redan bevisat fel om måtten.
    if pid in UTAN_VIKT:
        for m in re.finditer(r"\b(väger|vikt)\b[^.!?]{0,30}\b\d", txt, re.I):
            fel.append(f"VIKT FÖRBJUDEN här: …{G.mening_kring(txt, m.start())}…")

    # ☠️ Volymgrinden. Leverantören anger mått, aldrig liter, på den här hinken.
    if pid in UTAN_VOLYM:
        for m in re.finditer(r"\b\d+(?:,\d+)?\s*liter\b", txt, re.I):
            fel.append(f"PÅHITTAD VOLYM: …{G.mening_kring(txt, m.start())}…")

    # ☠️ Färggrinden läser SIDANS EGNA meningar, inte korslänkarna. Ankartexten
    #    "Samma mopphink i blått" NAMNGER grannens färg — det är hela dess
    #    uppgift — och en grind som läser hela texten fäller varje korrekt
    #    färgsyskonpar. Nionde gången samma familj: uppgift #398, #433, #437.
    egna_rader, _ = G.dela_pa_ankare(html)
    egna = G.synlig_meningstext(" ".join(egna_rader))
    for ord_ in G.FARGORD:
        if re.search(rf"\b{ord_}\w*\b", egna, re.I) and ord_ not in FARG[pid]:
            fel.append(f"FÄRGORD {ord_!r} — uppmätt på bilden är {sorted(FARG[pid])}")

    # Leveranslöften och homoglyfer ärvs från grindar.py.
    fel += G.leveransloften(txt, INGAR[pid], pid)
    fel += G.homoglyfer(txt)
    fel += G.granska_namn(T.NAMN[pid])

    # Talen i meta och titel måste finnas i brödtexten.
    for falt, varde in (("meta", T.META[pid]), ("titel", T.TITEL[pid]),
                        ("namn", T.NAMN[pid])):
        for tal in _talen(varde) - _talen(txt):
            fel.append(f"OSPÅRAT TAL {tal!r} i {falt} — står inte i brödtexten")

    # Fältlängder.
    if len(T.NAMN[pid]) > 80:
        fel.append(f"NAMNET är {len(T.NAMN[pid])} tecken (max 80)")
    if len(T.TITEL[pid]) > 60:
        fel.append(f"TITELN är {len(T.TITEL[pid])} tecken (max 60)")
    if len(T.META[pid]) > 155:
        fel.append(f"METAN är {len(T.META[pid])} tecken (max 155)")

    # Sökorden måste stå i namn + titel + slug (Wix SEO-assistenten).
    huvud = T.SOKORD[pid][0]
    for del_ in huvud.split():
        if len(del_) > 2 and del_.lower() not in (T.NAMN[pid] + T.TITEL[pid]).lower():
            fel.append(f"HUVUDORDETS del {del_!r} saknas i namn/titel")
    return fel


SJALVTEST = [
    ("husmärke fälls", "Vagnen från HOMCOM rullar bra.", True),
    ("tyskt ord fälls", "Eimer med press ingår.", True),
    ("rostfri lögn fälls", "Hinken är i rostfritt stål.", True),
    ("leveransland fälls", "Vagnen skickas från Tyskland.", True),
    ("attribution fälls", "Leverantören anger 40 kg.", True),
    ("decimalpunkt fälls", "Hinken rymmer 26.5 liter.", True),
    ("engelsk enhet fälls", "Hjulen är 3 inches.", True),
    ("superlativ fälls", "Marknadens bästa mopphink.", True),
    ("sortimentspåstående fälls", "Den smidigaste städvagnen i sortimentet.",
     True),
    ("sortimentspåstående, oregelbunden form", "Den bästa vagnen hos oss.",
     True),
    ("HACCP fälls", "Vagnen är livsmedelsgodkänd.", True),
    ("hygienpåstående fälls", "Pressen dödar bakterier.", True),
    ("ber kunden mäta fälls", "Mät din dörröppning först.", True),
    # ☠️ Sju negativa fall. En grind som bara fäller är en grind som lärt
    #    mottagaren att sluta läsa (uppgift #397, #434).
    ("rund som ADJEKTIV går fritt", "Hinken har en rund botten.", False),
    ("perfekt inne i ett annat ord går fritt", "Ytan är perforerad.", False),
    ("normal måttrad går fritt", "Vagnen mäter 73 × 45 × 95 cm.", False),
    ("decimalkomma går fritt", "Hinken rymmer 26,5 liter.", False),
    ("grå som färg går fritt", "Ramen är grå.", False),
    ("presskorg går fritt", "Pressen lyfts av och sköljs.", False),
    ("kilogram utan superlativ går fritt", "Vagnen tål 40 kg.", False),
    ("orange som färg går fritt", "Hinken är orange.", False),
    ("polyesterväv går fritt", "Säcken är av polyesterväv.", False),
]

# ☠️ De två lagningarna ovan går inte att pröva med mönster ensamma — de sitter
#    i granska(), inte i FORBJUDET. Fallen nedan kör hela grinden.
GRANSKNINGSFALL = [
    ("korslänkens färgord fäller INTE färgsyskonet", "0cbffcd9", "FÄRGORD"),
    ("egenvikten 9,7 kg fäller INTE lastgrinden", "6490e360", "TOTALLAST"),
    ("moppgrinden är positiv på alla fyra", "832f9eec", "MOPPGRINDEN"),
    ("18-litershinken fäller INTE volymgrinden på fel produkt", "0cbffcd9",
     "PÅHITTAD VOLYM"),
    ("de tre med känd vikt fälls INTE av viktgrinden", "740fa6d0",
     "VIKT FÖRBJUDEN"),
]


def sjalvtest():
    fel = []
    for namn, txt, ska_falla in SJALVTEST:
        traff = any(m.search(txt) for m, _ in FORBJUDET + TONGRINDAR)
        if traff != ska_falla:
            fel.append(f"{namn}: fick {'träff' if traff else 'ingen träff'}, "
                       f"väntade {'träff' if ska_falla else 'ingen träff'}")
    for namn, pid, etikett in GRANSKNINGSFALL:
        if any(f.startswith(etikett) for f in granska(pid)):
            fel.append(f"{namn}: {etikett} fyrar på {pid}, och ska inte")
    return fel


if __name__ == "__main__":
    st = sjalvtest()
    print(f"självtest: {len(SJALVTEST) + len(GRANSKNINGSFALL)} fall, {len(st)} fel")
    for f in st:
        print("  ☠️", f)
    tv = G.tvillingsvep(".")
    for f in tv:
        print("  ☠️ TVILLING:", f)
    totalt = len(st) + len(tv)
    for pid in T.NAMN:
        fel = granska(pid)
        totalt += len(fel)
        print(f"{'FEL ' if fel else 'OK  '}{pid}  {T.NAMN[pid][:52]}")
        for f in fel:
            print("      ☠️", f)
    print(f"\n{len(T.NAMN)} produkter, {totalt} fel")
    sys.exit(1 if totalt else 0)
