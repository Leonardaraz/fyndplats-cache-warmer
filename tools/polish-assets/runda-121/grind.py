# -*- coding: utf-8 -*-
"""Runda 121 textgrind — körs på FILEN, före varje API-anrop.

Maskineriet delas med runda 115–120 via `grindar.py`. Det som är NYTT här:

  1. ☠️ **MOPPGRINDEN ÄR POSITIV.** Fem av åtta källtexter skriker
     *"HINWEIS: Der Mopp ist NICHT enthalten"* i versaler. Det är precis vad
     en kund antar ingår i en mopphink, så varje sida MÅSTE säga det — en
     grind som bara förbjuder ett felaktigt påstående hade svarat grönt på en
     sida som tiger.
  2. ☠️ **TILLBEHÖRSGRINDEN.** Två livsstilsbilder visar saker som inte
     ingår: en gul mopphink bredvid `9aa46e31` och en varningsskylt bredvid
     `e526fd01`. Bilden är vår, alltså är vilseledningen vår.
  3. ☠️ **LASTGRINDEN ÄR NEGATIV FÖR TVÅ PRODUKTER.** `da0f30b2` och
     `d8ebb279` anges tåla 15 kg totalt — men hinken rymmer 25 liter, och
     25 liter vatten väger 25 kg. Talet får därför inte skrivas alls. Grinden
     FÄLLER om det dyker upp, i stället för att lita på att ingen skriver det.
  4. **ROSTFRITT ÄR FÖRBJUDET.** Materialet är plast och metall på samtliga
     åtta. Runda 57 publicerade en rostfri lögn; den ska inte upprepas.
"""
import re
import sys

sys.path.insert(0, "..")

import grindar as G          # noqa: E402
import texter as T           # noqa: E402

# Leveransomfattning per produkt, ur `Lieferumfang`.
INGAR = {
    "45bac2cb": ["mopphink", "press", "korg", "bruksanvisning"],
    "731c8bfc": ["mopphink", "press", "korg", "bruksanvisning"],
    "74ea10dc": ["mopphink", "press", "korg", "bruksanvisning"],
    "e526fd01": ["rullhink", "press", "innerhink", "bruksanvisning"],
    "da0f30b2": ["moppvagn", "press", "korg", "hylla", "monteringsanvisning"],
    "d8ebb279": ["moppvagn", "press", "korg", "hylla", "monteringsanvisning"],
    "9aa46e31": ["städvagn", "sopsäck", "monteringsanvisning"],
    "75fcdcfb": ["städvagn", "sopsäck", "mopphink", "press", "varningsskylt",
                 "monteringsanvisning"],
}

# Färgfacit ur BILDERNA, inte ur leverantörens rad — fyra av åtta rader var
# ofullständiga (se STEG4.md).
FARG = {
    "45bac2cb": {"gul", "grå"},
    "731c8bfc": {"blå", "grå"},
    "74ea10dc": {"blå", "orange", "svart"},
    "e526fd01": {"orange", "svart"},
    "da0f30b2": {"gul", "grå"},
    "d8ebb279": {"blå", "grå"},
    "9aa46e31": {"svart", "orange"},
    "75fcdcfb": {"svart", "blå", "gul"},
}

# ☠️ Produkter som INTE får bära ett totalt lasttal. Se docstring punkt 3.
UTAN_TOTALLAST = {"da0f30b2", "d8ebb279"}

# ☠️ Produkter vars livsstilsbild visar ett tillbehör som inte ingår.
MASTE_NEKA_TILLBEHOR = {
    "9aa46e31": r"hinken på livsstilsbilden|mopphinken på bilden",
    "e526fd01": r"skylten hör inte till|varningsskylten på bilden",
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

    # ☠️ Moppgrinden är POSITIV.
    if not re.search(r"utan mopp|moppen ingår inte|Moppen ingår inte", txt, re.I):
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
        for m in re.finditer(r"\b(tål|maxlast|totalt)\b[^.!?]{0,40}\b\d+\s*kg", txt, re.I):
            mening = G.mening_kring(txt, m.start()).lower()
            if "korg" not in mening:
                fel.append(f"TOTALLAST FÖRBJUDEN här: …{mening}…")

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
]

# ☠️ De två lagningarna ovan går inte att pröva med mönster ensamma — de sitter
#    i granska(), inte i FORBJUDET. Fallen nedan kör hela grinden.
GRANSKNINGSFALL = [
    ("korslänkens färgord fäller INTE färgsyskonet", "45bac2cb", "FÄRGORD"),
    ("korgens 5 kg fäller INTE lastgrinden", "da0f30b2", "TOTALLAST"),
    ("moppgrinden är positiv på städvagnen", "9aa46e31", "MOPPGRINDEN"),
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
