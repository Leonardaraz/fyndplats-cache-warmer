# -*- coding: utf-8 -*-
"""Runda 128 Steg 9 — alt-texter och de fyra bilder som plockas bort.

☠️ TRE AV NIO SIDOR TAPPAR BILDER. Alla fyra bär TYSK text inbränd i pixlarna
   (Steg 4, se `STEG1-5.md`):

     `1654dd75` pos 4  *ZENTRALVERRIEGELUNG — Einmal abschließen, um alle
                        Schubladen während Ihrer Abwesenheit zu sichern*
     `f2495eee` pos 4  *Autowerkstatt · Garage · Lagerhaus · Werkstätten*
     `1db06f83` pos 4  *Kugelgelagerte Schienen / EVA-Schutzeinlagen*
     `1db06f83` pos 5  *Garage · Autowerkstatt · Lagerhalle · Werkstätten*

   Innehållet följer med till TEXTEN där det är belagt: centrallåset står i
   `1654dd75`:s punktlista, och kullagrade skenor + EVA-mattor i `f2495eee`:s.

⚠️ `d9965552` HAR BARA TRE BILDER FRÅN START, och det är inte ett importfel —
   den blå vagnen har en egen fotoserie i en annan studio. Därför är STARTANTAL
   en karta och inte konstanten fem, som i runda 127.

☠️ ALT-TEXTEN ÄR KUNDTEXT och grindas som sådan (uppgift #381). Samma
   förbudslista som brödtexten, plus: högst 125 tecken, måste namnge
   produkten, och ingen får vara identisk med någon annan i rundan.

⚠️ LIVSSTILSBILDERNA ÄR FULLA AV TILLBEHÖR SOM INTE INGÅR — verktyg i lådorna
   (`1654dd75` pos 5, `f2495eee` pos 5, `fc6fdd63` pos 4 och 5), rengörings-
   flaskor på skivan (`1654dd75` pos 2), färgburkar (`b920d526` pos 2,
   `d9965552` pos 2), skruvdragare på hålplattan (`1db06f83` pos 2) och
   konserver i skåpet (`81c123fa` pos 5). Att BESKRIVA dem är ärligt; att
   antyda att de FÖLJER MED är ett leveranslöfte. Lieferumfang är kontraktet
   (uppgift #468) — egen grind, inte en tyst vana.

⚠️ `b920d526` pos 1 och 5 samt `d9965552` pos 1 visar SEXTON lådor utdragna
   samtidigt. Ingen av sidorna påstår att vagnen står stadigt så — samma
   avvägning som fällde lådspärren i runda 127. Beskriv innehållet, aldrig
   "alla lådor öppna samtidigt".

☠️ `81c123fa`:S FÄRG ÄR INTE AVGJORD. Leverantörens spec-block och tyska titel
   säger båda "Schwarz", men mätt på studiobilden ligger dörrarna på RGB 66–79
   medan `beeada22`, som är svart i samma batch och samma bildkonvention,
   ligger på 6/7/5 — en tiopotens. Matt svart under platt ljus och antracit
   förklarar båda mätningen, så ingen av dem är bevisad. Färgordet står därför
   varken i namn, titel eller meta för den produkten, och får inte smygas in
   via en alt-text. Egen grind. (Jämför uppgift #472.)

⚠️ `bc2e7191` pos 1, 3 och 5 bär en liten LOGOTYP på topphyllans plåt. Den
   sitter FYSISKT på varan — Leonards regel är att den lämnas — men den får
   inte skrivas ut i kundtext. Täcks av husmärkeslistan i den delade grinden.
"""
import re
import sys

sys.path.insert(0, "..")

import grindar as G          # noqa: E402
import grind as GR           # noqa: E402
import texter as T           # noqa: E402

# (produkt, position) som plockas bort — alla fyra bär tysk text i pixlarna.
BORT = {("1654dd75", 4), ("f2495eee", 4), ("1db06f83", 4), ("1db06f83", 5)}

# ☠️ Inte konstanten fem: d9965552 har tre bilder från start, med flit.
STARTANTAL = {"bc2e7191": 5, "beeada22": 5, "1654dd75": 5, "f2495eee": 5,
              "1db06f83": 5, "b920d526": 5, "d9965552": 3, "fc6fdd63": 5,
              "81c123fa": 5}

HUVUDORD = {"bc2e7191": "svetsvagn", "beeada22": "plåtskåp",
            "1654dd75": "verktygsvagn", "f2495eee": "verktygsvagn",
            "1db06f83": "verktygsskåp", "b920d526": "verktygsvagn",
            "d9965552": "verktygsvagn", "fc6fdd63": "verktygsvagn",
            "81c123fa": "verktygsskåp"}

ALT = {
    "bc2e7191": {
        1: "Svart svetsvagn med tre hyllplan, kedjor på sidan och fyra hjul, "
           "sedd snett framifrån",
        2: "Svetsvagnen står i en verkstad med en svets på översta planet och "
           "en väska på bottenplanet",
        3: "Måttritning på svetsvagnen: 71 centimeter bred, 39 djup och "
           "70 hög",
        4: "Närbild på svetsvagnens sida med två kedjor hängda i "
           "nyckelhålsfästen",
        5: "Närbild på svetsvagnens nedre del med bottenplan, snedställd "
           "stag och två länkhjul",
    },
    "beeada22": {
        1: "Svart plåtskåp med två dörrar, ventilationsspringor i plåten och "
           "koniska ben, sett rakt framifrån",
        2: "Plåtskåpet står mot en grå vägg med en golvlampa bredvid och en "
           "tavla och vas ovanpå",
        3: "Måttritning på plåtskåpet: 75 centimeter brett, 33 djupt och "
           "110 högt",
        4: "Närbild på plåtskåpets två avlånga handtag där dörrarna möts",
        5: "Närbild på ett av plåtskåpets koniska ben med justerbar fot "
           "underst",
    },
    "1654dd75": {
        1: "Svart verktygsvagn med sju lådor och ett öppet sidoregal i två "
           "plan, sedd snett framifrån",
        2: "Verktygsvagnen står i en verkstad med flaskor på skivan och "
           "burkar i sidoregalets fack",
        3: "Måttritning på verktygsvagnen: 96 centimeter bred, 33,5 djup, "
           "75 hög och 120 kilo maxlast",
        5: "Verktygsvagnen med översta lådan utdragen så att lådans "
           "indelning syns",
    },
    "f2495eee": {
        1: "Verktygsvagn med rostfri bänkskiva, fem lådor och fyra hjul, "
           "sedd snett framifrån",
        2: "Verktygsvagnen står vid en betongvägg i en verkstad med "
           "handverktyg utlagda på bänkskivan",
        3: "Måttritning på verktygsvagnen: 65,5 centimeter bred, 34,5 djup "
           "och 76 hög",
        5: "Verktygsvagnen med två lådor utdragna så att lådornas djup och "
           "bottenmattor syns",
    },
    "1db06f83": {
        1: "Svart verktygsskåp på hjul med hålplatta överst, tre lådor och "
           "en skåpdel, visat från tre håll",
        2: "Verktygsskåpet står i en verkstad med hålplattan hängd full av "
           "handverktyg och skåpdörrarna öppna",
        3: "Måttritning på verktygsskåpet: 69 centimeter brett, 33 djupt, "
           "133 högt och 80 kilo maxlast",
    },
    "b920d526": {
        1: "Röd verktygsvagn i två delar med lådorna utdragna och "
           "överkistans lock uppfällt",
        2: "Den röda verktygsvagnen står i ett rum med stege och färgburkar, "
           "med alla lådor stängda",
        3: "Måttritning på den röda verktygsvagnen: 61,5 centimeter bred, "
           "33 djup och 113 hög, 10 och 20 kilo per låda",
        4: "Den röda verktygsvagnens två delar isärtagna: underskåpet på "
           "hjul och överkistan för sig",
        5: "Den röda verktygsvagnen sedd rakt framifrån med lådorna utdragna "
           "i trappform",
    },
    "d9965552": {
        1: "Blå verktygsvagn i två delar med lådorna utdragna och "
           "överkistans lock uppfällt",
        2: "Den blå verktygsvagnen står på ett trägolv med en stege och en "
           "målarhink bredvid",
        3: "Måttritning på den blå verktygsvagnen: 61,5 centimeter bred, "
           "33 djup och 113 hög",
    },
    "fc6fdd63": {
        1: "Verktygsvagn i svart och rött med fjorton lådor, sidohylla och "
           "hålvägg på gaveln",
        2: "Verktygsvagnen står i en verkstad framför en hylla, med locket "
           "nedfällt och lådorna stängda",
        3: "Måttritning på verktygsvagnen: 76 centimeter bred, 33 djup och "
           "109 hög ihopsatt",
        4: "Verktygsvagnen med locket uppfällt och fem lådor utdragna så att "
           "innehållet syns",
        5: "Närbild på verktygsvagnens överkista med uppfällt lock, gasfjäder "
           "och bärhandtag på gaveln",
    },
    "81c123fa": {
        1: "Högt verktygsskåp med två dörrar upptill, en låda i midjehöjd och "
           "två dörrar nedtill",
        2: "Verktygsskåpet står i en verkstad med underskåpets dörrar öppna "
           "och hinkar och en låda inuti",
        3: "Måttritning på verktygsskåpet: 75 centimeter brett, 40 djupt, "
           "180 högt och 210 kilo maxlast",
        4: "Verktygsskåpet står i ett arbetsrum bredvid ett skrivbord med "
           "lampa och kontorsstol",
        5: "Verktygsskåpet står i ett kök med underskåpets dörrar öppna och "
           "burkar på hyllplanen",
    },
}

FORBJUDET = [m for m, _ in GR.FORBJUDET] + [m for m, _ in GR.TONGRINDAR]
ETIKETT = ({m: e for m, e in GR.FORBJUDET}
           | {m: e for m, e in GR.TONGRINDAR})

# ☠️ Livsstilsbilderna är fulla av tillbehör som INTE ingår. Att beskriva dem
#    är ärligt; att antyda att de följer med är ett leveranslöfte.
INGAR = re.compile(r"\bing[åa]r\b|\bf[öo]ljer\s+med\b|\bmedf[öo]ljer\b"
                   r"|\bmed\s+medf|\binkluderat?\b|\bingående\b", re.I)

# ☠️ Sexton lådor utdragna samtidigt är en STAGED bild, inget stabilitetslöfte.
#    ⚠️ Första utkastet fällde "med alla lådor STÄNGDA" — en fullkomligt säker
#       mening. Grinden gäller att lådorna står UTE, inte att de räknas upp:
#       "alla/samtliga/sexton" måste följas av ett öppet-ord inom samma mening.
#       Båda riktningarna är låsta i FARGSJALVTEST:s motsvarighet nedan.
_UTE = r"(?:utdrag\w*|ute\b|öppn\w*|uppdrag\w*|framdrag\w*)"
SAMTIDIGT = re.compile(
    r"\b(?:alla|samtliga|sexton|16)\s+(?:sexton\s+|16\s+)?lådor\w*"
    r"[^.]{0,40}?" + _UTE + r"|"
    r"\blådor\w*[^.]{0,40}?\bsamtidigt\b|"
    r"\bsamtidigt\b[^.]{0,40}?\blådor\w*", re.I)

# ☠️ 81c123fa:s färg är inte avgjord — inget färgord får smygas in via alten.
OAVGJORD_FARG = {"81c123fa"}
FARGORD = re.compile(r"\b(svart\w*|grå\w*|antracit\w*|grafit\w*)\b", re.I)


def granska():
    fel = []
    sedda = {}
    for pid, rader in ALT.items():
        for n, txt in sorted(rader.items()):
            if (pid, n) in BORT:
                fel.append(f"{pid} pos {n}: bilden ska BORT men har alt-text")
            for m in FORBJUDET:
                if m.search(txt):
                    fel.append(f"{pid} pos {n} "
                               f"{ETIKETT.get(m, 'FÖRBJUDET')}: {txt}")
            if INGAR.search(txt):
                fel.append(f"{pid} pos {n} LEVERANSLÖFTE — tillbehören i "
                           f"livsstilsbilden ingår inte: {txt}")
            if SAMTIDIGT.search(txt):
                fel.append(f"{pid} pos {n} LÅDSPÄRR — bilden bevisar inte att "
                           f"alla lådor kan stå ute samtidigt: {txt}")
            if pid in OAVGJORD_FARG and FARGORD.search(txt):
                fel.append(f"{pid} pos {n} FÄRG EJ AVGJORD — spec säger svart, "
                           f"mätningen säger antracit: {txt}")
            if len(txt) > 125:
                fel.append(f"{pid} pos {n}: {len(txt)} tecken, max 125")
            if HUVUDORD[pid] not in txt.lower():
                fel.append(f"{pid} pos {n}: namnger inte produkten "
                           f"({HUVUDORD[pid]!r} saknas) — {txt}")
            if txt in sedda:
                fel.append(f"{pid} pos {n}: IDENTISK med {sedda[txt]} — {txt}")
            sedda[txt] = f"{pid} pos {n}"
            fel += [f"{pid} pos {n} HOMOGLYF {c} ({b})"
                    for c, b, _ in G.homoglyfer(txt)]
        kvar = STARTANTAL[pid] - sum(1 for (p, _) in BORT if p == pid)
        if len(rader) != kvar:
            fel.append(f"{pid}: {len(rader)} alt-texter, väntade {kvar}")
    for pid in T.NAMN:
        if pid not in ALT:
            fel.append(f"{pid}: saknas helt i ALT")
    for pid in ALT:
        if pid not in T.NAMN:
            fel.append(f"{pid}: finns i ALT men inte i rundan")
    return fel


# Grindarnas egna grindar: texter som MÅSTE fällas.
SJALVTEST = [
    ("Verktygsvagnen med de verktyg som ingår i leveransen", "LEVERANSLÖFTE"),
    ("Verktygsvagn där handverktygen följer med", "LEVERANSLÖFTE"),
    ("Den röda verktygsvagnen med alla sexton lådor utdragna", "LÅDSPÄRR"),
    ("Verktygsvagnen med samtliga lådor ute samtidigt", "LÅDSPÄRR"),
    ("Verktygsvagn där alla lådor är öppna", "LÅDSPÄRR"),
]
# ⚠️ Och åt andra hållet: dessa är SÄKRA och får inte fällas. Den första är
#    den mening grindens första utkast felaktigt fällde.
LADOR_SLAPPER = [
    "Den röda verktygsvagnen står i ett rum med alla lådor stängda",
    "Verktygsvagnen med översta lådan utdragen",
    "Måttritning med 10 och 20 kilo per låda",
]
FARGSJALVTEST = [
    ("Svart verktygsskåp på 180 centimeter", True),
    ("Antracitfärgat verktygsskåp på 180 centimeter", True),
    ("Högt verktygsskåp med tre låszoner", False),
]


def _sjalvtest():
    fel = []
    for txt, vad in SJALVTEST:
        traff = ((bool(INGAR.search(txt)) and vad == "LEVERANSLÖFTE")
                 or (bool(SAMTIDIGT.search(txt)) and vad == "LÅDSPÄRR"))
        if not traff:
            fel.append(f"SJÄLVTEST: {vad!r} fällde INTE {txt!r}")
    for txt in LADOR_SLAPPER:
        if SAMTIDIGT.search(txt):
            fel.append(f"SJÄLVTEST: LÅDSPÄRR fällde den SÄKRA {txt!r}")
    for txt, ska in FARGSJALVTEST:
        if bool(FARGORD.search(txt)) != ska:
            fel.append(f"SJÄLVTEST FÄRG: {txt!r} gav {not ska}, väntade {ska}")
    return fel


if __name__ == "__main__":
    f = _sjalvtest() + granska()
    n = sum(len(r) for r in ALT.values())
    antal_sjalvtest = (len(SJALVTEST) + len(FARGSJALVTEST)
                       + len(LADOR_SLAPPER))
    print(f"galleri.granska(): {n} alt-texter, {len(BORT)} borttagna bilder, "
          f"{antal_sjalvtest} självtest, {len(f)} fel")
    for rad in f:
        print("  ☠️", rad)
    sys.exit(1 if f else 0)
