# -*- coding: utf-8 -*-
"""Runda 76 — åtta kontorsstolar i tre modeller.

☠️ Batch 64 mätte skillnaden: fem produkter skrivna inline i API-anropet gav
NIO fel som nådde Wix, tre skrivna via fil gav noll. Texten skrivs därför HÄR.

☠️ BOKSTÄVERNA L/B/T I KÄLLAN GÅR INTE ATT LITA PÅ — RITNINGEN ÄR FACIT.
   Uppmätt på alla tre modellerna i den här rundan:

       Gesamtabmessungen: 74L x 65B   →  ritningen: 74 = BREDD, 65 = djup
       Gesamtabmessungen: 55L x 48B   →  ritningen: 55 = BREDD, 48 = djup
       Gesamtabmessungen: 56L x 61B   →  ritningen: 56 = BREDD, 61 = djup

   `L` betyder alltså BREDD i `Gesamtabmessungen`. Men i SAMMA spec-block
   skriver leverantören `Sitzgröße: 53B x 52T` för modell D — där betyder `B`
   bredd — och `Sitzgröße: 45L x 40B` för modell E, där `L` betyder bredd
   igen. Samma dokument, samma produkt, tre olika betydelser av samma
   bokstav.

   ⚠️ Hade bokstäverna följts rakt av hade grupp D fått 65 cm bredd och 74 cm
   djup på sin sida — en stol som är smalare än sin egen sits (53 cm) plus
   armstöd. Talen är därför lästa ur MÅTTRITNINGEN, bild 3 på varje produkt,
   och bara ur den.

☠️ KÄLLANS FÄRGORD TAR FEL PÅ KULÖREN, inte bara på nyansen. `farg.py` mäter
ur pixlarna:

    utkast     källans ord   uppmätt                   skrivs
    143f9b2d   Grün          H 184°, S 19 %, L 71 %    TURKOS     ☠️ fel familj
    4fa0ae0a   Dunkelgrau    L 45 %, S  5 %            GRÅ        ☠️ ett steg
    4293c5ce   Grau          L 69 %, S  1 %            LJUSGRÅ    ☠️ ett steg
    10235819   Hellgrau      L 65 %, S  6 %            ljusgrå     ✓
    6e05f8b7   Rosa          H   4°, S 37 %, L 76 %    rosa        ✓
    a5454821   Rosa          H   2°, S 46 %, L 75 %    rosa        ✓
    0f7021fb   Grau          L 60 %, S  2 %            grå         ✓
    ce10bfe8   Cremeweiß     H  57°, S 29 %, L 88 %    gräddvit    ✓

  ☠️ `143f9b2d` heter Grün och stolen är TURKOS. H 184° ligger mitt i cyan;
     grönt börjar först runt 90°. Runda 75 fångade fel i LJUSHET — det här är
     första gången källan tar fel på KULÖREN, och en kund som söker grönt får
     annars blått hem.

☠️ TVÅ SAKER SOM KÄLLAN GER OCH SOM MEDVETET INTE SKRIVS:

  1. RYGGSTÖDETS MÅTT PÅ MODELL E. Leverantören anger `44L x 52B cm` på en
     stol som är 48 cm bred. En rygg kan inte vara 52 cm bred på ett 48 cm
     brett chassi. Måttet utelämnas — samma regel som runda 75:s modell C.
  2. Ordet `ergonomisch`, som står i tre av modellnamnen. Det är inget mått
     och ingen norm. Formen får beskrivas; effekten får inte utlovas.

☠️ INGEN AV DE ÅTTA SÄLJS SOM ARBETSSTOL. Ingen är provad mot EN 1335, och
   ordet antyder godkänd för heltidsarbete. Inga hälsopåståenden alls.
"""
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))

BAS = "https://www.fyndplats.se/produkt/"


def lank(slug, text):
    return '<a href="%s%s">%s</a>' % (BAS, slug, text)


def och(delar):
    if len(delar) == 1:
        return delar[0]
    return ", ".join(delar[:-1]) + " och " + delar[-1]


# ------------------------------------------------------------- byggblock ---
def egenskaper(rader):
    return ("<p><strong>Egenskaper</strong></p><ul>"
            + "".join("<li>%s</li>" % r for r in rader) + "</ul>")


def rubrikblock(rubrik, stycken):
    return "<h2>%s</h2>" % rubrik + "".join("<p>%s</p>" % s for s in stycken)


def spec(rader):
    return ("<h2>Tekniska specifikationer</h2><ul>"
            + "".join("<li>%s</li>" % r for r in rader) + "</ul>")


def faq(rader):
    # ☠️ Wix STRIPPAR <br>. Fråga och svar måste vara TVÅ <p>.
    ut = ["<h2>Vanliga frågor</h2>"]
    for f, s in rader:
        ut.append("<p><strong>%s</strong></p><p>%s</p>" % (f, s))
    return "".join(ut)


def bygg(p):
    return "".join([p["ingress"], egenskaper(p["eg"]), spec(p["spec"]),
                    rubrikblock(p["villkor"][0], p["villkor"][1]),
                    rubrikblock("Användning och skötsel", p["skotsel"]),
                    faq(p["faq"])])


# ☠️ MAXLAST FÅR EGEN RUBRIK — ett positivt villkor, aldrig en varningsruta
#    och aldrig bara en rad i speclistan. Runbokens Steg 2.
MAXLAST = ("Bär 120 kg", [
    "Stolen är provad för 120 kg. Talet gäller en person som sitter, inte att "
    "stå på sitsen — en stol med gaslyft är inte en pall, och sitsen vrider "
    "sig under en fot på ett sätt den inte gör under en kropp.",
    "Efterdra skruvarna efter någon månads användning. Det är den enskilt "
    "vanligaste orsaken till att en stol börjar glappa, och det tar en minut.",
])


# ============================================ D · CHEFSSTOL MED FOTSTÖD ===
# 74 bred × 65 djup × 120–128 hög · liggläge 74 × 148 × 93–101
# sits 53 × 52, sitthöjd 46–54 · rygg 60 bred × 80 hög · armstöd 19 cm över
# sitsen · fotstöd 36 × 20 · 23 kg · 120 kg · mikrofibertyg
D_SPEC = [
    "Mått (B × D × H): 74 × 65 × 120–128 cm",
    "Mått med ryggen nedfälld (B × D × H): 74 × 148 × 93–101 cm",
    "Sits (B × D): 53 × 52 cm",
    "Sitthöjd: 46–54 cm",
    "Ryggstöd (B × H): 60 × 80 cm",
    "Armstöd: 19 cm över sitsen",
    "Fotstöd (B × D): 36 × 20 cm",
    "Maxlast: 120 kg",
    "Klädsel: mikrofibertyg",
    "Stomme: metall, med skumstoppning",
    "Fot: femarmad, på hjul",
    "Färg: %s",
    "Vikt: 23 kg",
    "Paketmått: 86 × 38 × 65 cm",
    "Montering: krävs",
    "Ingår: kontorsstol och bruksanvisning",
]


def d_produkt(kort, pris, farg, slug, syskon):
    andra = [lank(s, f) for s, f in syskon]
    return {
        "kort": kort, "pris": pris, "slug": slug, "farg": farg,
        "sokord": "chefsstol med fotstöd",
        "name": "Chefsstol %s med fotstöd – fälls till 148 cm" % farg,
        "title": "Chefsstol %s med fotstöd och nackstöd | Fyndplats" % farg,
        "meta": ("Chefsstol i %s mikrofibertyg med utdragbart fotstöd och rygg "
                 "som fälls till 148 cm. 74 × 65 cm, sitthöjd 46–54 cm. "
                 "Bär 120 kg." % farg),
        "ingress": (
            "<p>En chefsstol i %s mikrofibertyg med hög stoppad rygg, "
            "inbyggt nackparti och ett fotstöd som dras ut under sitsen. "
            "Upprätt är den 74 cm bred och 65 cm djup; med ryggen nedfälld "
            "sträcker den sig till 148 cm och blir en plats att vila i mitt på "
            "dagen. Ryggen mäter 80 cm och stolen bär 120 kg.</p>" % farg),
        "eg": [
            "Ryggen fälls bakåt — 148 cm djup i nedfällt läge",
            "Utdragbart fotstöd, 36 × 20 cm",
            "80 cm hög rygg med inbyggt nackparti",
            "53 cm bred sits på 52 cm djup",
            "Sitthöjd 46–54 cm via gaslyft",
            "Armstöd 19 cm över sitsen",
            "Klädsel i mikrofibertyg",
            "Femarmad fot på hjul, 360 graders vridning",
            "Bär 120 kg",
            "Levereras omonterad",
        ],
        "spec": [r % farg if "%s" in r else r for r in D_SPEC],
        "villkor": MAXLAST,
        "skotsel": [
            "Mikrofibertyg är tätt vävt och släpper därför inte in smuts lika "
            "djupt som en grövre väv. Dammsug med möbelmunstycke när du ändå "
            "dammsuger rummet, så håller ytan sig jämn.",
            "Ta fläckar med en väl urvriden trasa och lite milt diskmedel. "
            "Arbeta utifrån och in så att kanten inte blir en ring, och låt "
            "tyget torka av sig självt — inte med värme.",
            "Stolen kommer i delar: foten skruvas ihop, hjulen trycks i, "
            "gaslyften träs på plats och ryggen skruvas fast i sitsen. Dra åt "
            "allt innan du sätter dig första gången.",
        ],
        "faq": [
            ("Hur långt bak går ryggen?",
             "Så långt att stolen mäter 148 cm från fram till bak. Höjden "
             "sjunker då till 93–101 cm."),
            ("Hur högt sitter man?",
             "46–54 cm över golvet. Höjden ställs med gaslyften under sitsen."),
            ("Var sitter fotstödet?",
             "Under sitsen. Det dras ut framåt när du vill ha det och skjuts "
             "tillbaka under när du inte vill."),
            ("Hur mycket bär den?", "120 kg."),
            ("Hur stor plats tar den?",
             "74 × 65 cm i golvyta upprätt. Räkna med 148 cm djup om du tänker "
             "fälla ryggen helt."),
            ("Hur hög är ryggen?",
             "80 cm, med nackpartiet inräknat."),
            ("Finns den i fler färger?",
             "Ja, samma modell finns i %s." % och(andra)),
        ],
    }


# ==================================== E · SKRIVBORDSSTOL MED NÄTRYGG =====
# 55 bred × 48 djup × 82,5–94,5 hög · sits 45 × 40, sitthöjd 44–56
# armstöd 11 cm över sitsen · 8,5 kg · 120 kg · max användarlängd 170 cm
# ☠️ RYGGSTÖDETS MÅTT UTELÄMNAS — källan säger 52 cm brett på 48 cm chassi.
E_SPEC = [
    "Mått (B × D × H): 55 × 48 × 82,5–94,5 cm",
    "Sits (B × D): 45 × 40 cm",
    "Sitthöjd: 44–56 cm",
    "Armstöd: 11 cm över sitsen",
    "Maxlast: 120 kg",
    "Rekommenderad längd på den som sitter: upp till 170 cm",
    "Rygg: nätväv",
    "Sits: stoppad, klädd i väv",
    "Fot: femarmad plastfot med fem hjul",
    "Färg: %s",
    "Vikt: 8,5 kg",
    "Paketmått: 52 × 50 × 23 cm",
    "Montering: krävs",
    "Ingår: skrivbordsstol och bruksanvisning",
]


def e_produkt(kort, pris, farg, slug, syskon):
    andra = [lank(s, f) for s, f in syskon]
    return {
        "kort": kort, "pris": pris, "slug": slug, "farg": farg,
        "sokord": "skrivbordsstol nätrygg",
        "name": "Skrivbordsstol %s med nätrygg – 55 cm bred, väger 8,5 kg" % farg,
        "title": "Skrivbordsstol %s med nätrygg, 55 cm bred | Fyndplats" % farg,
        "meta": ("Kompakt skrivbordsstol i %s med nätrygg och stoppad sits. "
                 "55 × 48 cm, sitthöjd 44–56 cm, väger 8,5 kg. Rekommenderas "
                 "upp till 170 cm längd." % farg),
        "ingress": (
            "<p>En liten skrivbordsstol i %s med rygg i nätväv och en stoppad "
            "sits. Hela stolen är 55 cm bred och 48 cm djup och väger 8,5 kg — "
            "den får plats i ett hörn och går att lyfta med en hand. "
            "Den är gjord för den som är upp till 170 cm lång — är du "
            "längre sitter du bättre i en större modell.</p>" % farg),
        "eg": [
            "Rygg i nätväv som släpper igenom luft",
            "55 cm bred och 48 cm djup — får plats i ett hörn",
            "Väger 8,5 kg och går att bära med en hand",
            "Sitthöjd 44–56 cm via gaslyft",
            "45 cm bred sits på 40 cm djup",
            "Armstöd 11 cm över sitsen",
            "Femarmad fot med fem hjul, 360 graders vridning",
            "Rekommenderas upp till 170 cm längd",
            "Bär 120 kg",
            "Levereras omonterad",
        ],
        "spec": [r % farg if "%s" in r else r for r in E_SPEC],
        "villkor": ("Storleken bestämmer vem den passar", [
            "Stolen är gjord för den som är upp till 170 cm lång. Det är "
            "ingen säkerhetsgräns utan en fråga om "
            "proportioner: sitsen är 40 cm djup och ryggen slutar lågt, så en "
            "längre person får stöd på fel ställe.",
            "Maxlasten är 120 kg och gäller en person som sitter. Efterdra "
            "skruvarna efter någon månad — det är den vanligaste orsaken till "
            "att en stol börjar glappa, och det tar en minut.",
        ]),
        "skotsel": [
            "Nätryggen dammsugs med möbelmunstycke på låg effekt. Väven är "
            "spänd i en ram, så tryck inte in munstycket — dra det över ytan.",
            "Sitsen tar fläckar med en väl urvriden trasa och lite milt "
            "diskmedel. Arbeta utifrån och in så att kanten inte blir en ring, "
            "och låt tyget torka av sig självt.",
            "Stolen kommer i delar: foten skruvas ihop, hjulen trycks i, "
            "gaslyften träs på plats och ryggen skruvas fast i sitsen. Dra åt "
            "allt innan du sätter dig första gången.",
        ],
        "faq": [
            ("Hur stor är den?",
             "55 cm bred och 48 cm djup, 82,5–94,5 cm hög beroende på hur "
             "gaslyften står."),
            ("Vem passar den?",
             "Den är gjord för den som är upp till 170 cm lång. Sitsen är "
             "40 cm djup och ryggen slutar lågt."),
            ("Hur högt sitter man?",
             "44–56 cm över golvet. Höjden ställs med gaslyften under sitsen."),
            ("Har den armstöd?",
             "Ja, fasta armstöd 11 cm över sitsen."),
            ("Vad väger den?",
             "8,5 kg. Den går att flytta mellan rum utan att bära i två steg."),
            ("Hur mycket bär den?", "120 kg."),
            ("Finns den i fler färger?",
             "Ja, samma modell finns i %s." % och(andra)),
        ],
    }


# ========================================= F · SMINKSTOL I TEDDYTYG ======
# 56 bred × 61 djup × 76–86 hög · sits 45 × 47, sitthöjd 46–56
# armstöd 17 cm över sitsen · rygg 51 bred × 37 hög · 9,5 kg · 120 kg
F_SPEC = [
    "Mått (B × D × H): 56 × 61 × 76–86 cm",
    "Sits (B × D): 45 × 47 cm",
    "Sitthöjd: 46–56 cm",
    "Ryggstöd (B × H): 51 × 37 cm",
    "Armstöd: 17 cm över sitsen",
    "Maxlast: 120 kg",
    "Klädsel: teddytyg, 100 % polyester",
    "Stomme: skumstoppning, med konstläder på undersidan",
    "Fot: femarmad kromad fot med hjul",
    "Färg: %s",
    "Vikt: 9,5 kg",
    "Paketmått: 72 × 40 × 56 cm",
    "Montering: krävs",
    "Ingår: sminkstol och bruksanvisning",
]


def f_produkt(kort, pris, farg, slug, syskon):
    andra = [lank(s, f) for s, f in syskon]
    return {
        "kort": kort, "pris": pris, "slug": slug, "farg": farg,
        "sokord": "sminkstol med hjul",
        "name": "Sminkstol %s i teddytyg – vippfunktion och kromad fot" % farg,
        "title": "Sminkstol %s i teddytyg med hjul | Fyndplats" % farg,
        "meta": ("Sminkstol i %s teddytyg med vippfunktion, kromad femarmad "
                 "fot och hjul. 56 × 61 cm, sitthöjd 46–56 cm. "
                 "Bär 120 kg." % farg),
        "ingress": (
            "<p>En låg snurrstol i %s teddytyg, formad som ett kar med "
            "armstöden inbyggda i ryggen. Den är 56 cm bred och 61 cm djup och "
            "går upp i 76–86 cm — alltså betydligt lägre än en kontorsstol, "
            "vilket är hela poängen framför ett sminkbord där spegeln sitter "
            "lågt. Sitsen är 45 cm bred och stolen bär 120 kg.</p>" % farg),
        "eg": [
            "Kar-formad rygg med armstöden inbyggda",
            "Vippfunktion — sitsen gungar mjukt bakåt",
            "Låg bygghöjd, 76–86 cm total",
            "Sitthöjd 46–56 cm via gaslyft",
            "45 cm bred sits på 47 cm djup",
            "Armstöd 17 cm över sitsen",
            "Klädsel i teddytyg, 100 % polyester",
            "Kromad femarmad fot med hjul, 360 graders vridning",
            "Bär 120 kg",
            "Levereras omonterad",
        ],
        "spec": [r % farg if "%s" in r else r for r in F_SPEC],
        "villkor": MAXLAST,
        "skotsel": [
            "Teddytyg är en lugg som lägger sig åt det håll den senast "
            "borstades. Dammsug med möbelmunstycke på låg effekt och borsta "
            "upp luggen efteråt med handen, så ser sitsen jämn ut igen.",
            "Ta fläckar med en väl urvriden trasa och lite milt diskmedel. "
            "Arbeta utifrån och in så att kanten inte blir en ring, och låt "
            "tyget torka av sig självt — värme får luggen att filta sig.",
            "Stolen kommer i delar: foten skruvas ihop, hjulen trycks i och "
            "gaslyften träs på plats innan sitsen sätts på. Dra åt allt innan "
            "du sätter dig första gången.",
        ],
        "faq": [
            ("Hur hög är den?",
             "76–86 cm i totalhöjd, med sitsen på 46–56 cm. Den är lägre än en "
             "vanlig kontorsstol."),
            ("Går den att använda vid ett skrivbord?",
             "Ja. Sitthöjden 46–56 cm räcker till de flesta skrivbord. Ryggen "
             "är 37 cm hög, så den ger stöd åt korsryggen men inte åt skuldror "
             "och nacke."),
            ("Vad är vippfunktionen?",
             "Sitsen får gunga en bit bakåt i stället för att stå spikrakt. "
             "Spaken under sitsen ställer den."),
            ("Har den hjul?",
             "Ja, på en kromad femarmad fot. Stolen vrider sig också 360 grader."),
            ("Hur mycket bär den?", "120 kg."),
            ("Vad är teddytyg?",
             "En kort, krusig lugg i 100 % polyester som liknar fårskinn på "
             "känsla. Den går att torka av, till skillnad från äkta ull."),
            ("Finns den i fler färger?",
             "Ja, samma modell finns i %s." % och(andra)),
        ],
    }


# ------------------------------------------------------------ rundan ------
D = [("10235819", 2039, "ljusgrå", "chefsstol-ljusgra-fotstod"),
     ("4fa0ae0a", 2039, "grå",     "chefsstol-gra-fotstod")]
E = [("143f9b2d", 899, "turkos",  "skrivbordsstol-turkos-natrygg"),
     ("6e05f8b7", 899, "rosa",    "skrivbordsstol-rosa-natrygg"),
     ("4293c5ce", 919, "ljusgrå", "skrivbordsstol-ljusgra-natrygg")]
F = [("a5454821", 1269, "rosa",     "sminkstol-rosa-teddytyg"),
     ("0f7021fb", 1279, "grå",      "sminkstol-gra-teddytyg"),
     ("ce10bfe8", 1269, "gräddvit", "sminkstol-graddvit-teddytyg")]


def _syskon(grupp, kort):
    return [(s, f) for k, _, f, s in grupp if k != kort]


PRODUKTER = (
    [d_produkt(k, p, f, s, _syskon(D, k)) for k, p, f, s in D]
    + [e_produkt(k, p, f, s, _syskon(E, k)) for k, p, f, s in E]
    + [f_produkt(k, p, f, s, _syskon(F, k)) for k, p, f, s in F]
)

if __name__ == "__main__":
    import re
    for p in PRODUKTER:
        h = bygg(p)
        synlig = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h)).strip()
        print("%-9s %-32s %5d kr  html %5d  synlig %5d  namn %2d  titel %2d  meta %3d"
              % (p["kort"], p["slug"], p["pris"], len(h), len(synlig),
                 len(p["name"]), len(p["title"]), len(p["meta"])))
