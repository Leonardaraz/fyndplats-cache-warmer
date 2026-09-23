# -*- coding: utf-8 -*-
"""Runda 74 — sex manchesterfåtöljer med fotpall och två björkvilstolar.

☠️ Batch 64 mätte skillnaden: fem produkter skrivna inline i API-anropet gav
NIO fel som nådde Wix, tre skrivna via fil gav noll. Texten skrivs därför HÄR.

☠️ RUNDANS FÖRSTA FYND — ALLA ÅTTA ÄR FÄRGSYSKON TILL PUBLICERADE SIDOR.
De sex manchesterfåtöljerna delar sju tal med `manchesterfatolj-med-fotpall-beige`
(stol, pall, dyna, båda lasterna, ben, tyg) och de två björkvilstolarna delar
sju mått PLUS vikt och paketmått med `vilstol-bjork-femstegs-fotstod`. De
publicerade sidornas svenska text är därför mall, och deras färgord är LÅSTA.

☠️ RUNDANS ANDRA FYND — KÄLLAN HAR KASTAT OM TVÅ FÄRGER, OCH GER TRE ORD FÖR
EN TREDJE. `farg.py` mäter ur pixlarna och kalibrerar mot publicerade sidor
där det svenska ordet redan är satt:

    utkast     källans ord          uppmätt                 skrivs
    e1c41327   Blau                 H 201°, S 47 %          PETROLBLÅ  ☠️ cyan
    58fb3025   Grau                 L  68 %, S  3 %         LJUSGRÅ    ☠️
    66adcdff   Gelb                 H  44°, S 83 %          gul         ✓
    4a9c33d2   Hellbraun / Khaki    L  67 %, S 19 %, H 28°  GRÅBEIGE   ☠️
    791e7292   Orange               H  41°                  SENAPSGUL  ☠️
    bc220489   Braun                H  27°, S 54 %          ORANGE     ☠️
    84082d41   Braun                L  40 %, S 12 %         GRÅBRUN    ☠️
    7e00970f   Grau                 L  43 %, S  0 %         grå         ✓

  ☠️ De två i mitten är OMKASTADE: den som heter "Orange" är senapsgul och den
     som heter "Braun" är tydligt orange. Skrivna på källans ord hade den äkta
     gula stått bredvid en "orange" som ser likadan ut.
  ☠️ Och `4a9c33d2` bär TVÅ ord i sin EGEN text — `Farbe: Hellbraun` i den
     tyska specen, `Färg: Khaki` i den svenska svansen. Mätningen ger en
     tredje: L 67 %, S 19 %, H 28°. Nyansen är densamma som beige-syskonets
     (H 29°) men tio steg mörkare och fjorton steg mattare — hade den skrivits
     som beige krockade den med sidan den länkar till.

☠️ RUNDANS TREDJE FYND — FÄRGENS PLATS I SLUGGEN AVGÖR OM SKU:n KROCKAR.
`manchesterfatolj-…-petrolbla` hade gett alla sex `FP-manchesterfatolj-fotpall`,
för `sku_bas` kapar vid 24 tecken och färgen ligger i svansen — exakt
hundvagnsfällan i runbooken. Med färgen SOM ANDRA ORD blir de sex distinkta.

⚠️ TVÅ TAL SOM KÄLLAN GER OCH SOM MEDVETET INTE SKRIVS:

  1. `Größe der Rückenlehne: 70L x 72B x 62H cm` på manchesterfåtöljen. En
     rygg som är 72 cm bred på en stol som är 80 cm bred går ihop, men 70 × 72
     × 62 med stolens egna 72 × 80 × 101 gör axlarna omöjliga att para ihop.
     Runbokens regel: etikettera inte ett mått vars axlar inte går att avgöra.
  2. "Esszimmerstuhl" i björkvilstolens brödtext — källan kallar den
     MATSTOL mitt i en text om ett fotstöd i fem lägen. Samma klipp-och-
     klistra-rest som runda 73:s "Massagestuhl". Skrivs aldrig som matstol.
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


# --------------------------------------------------------- delade block ---
MANCHESTER = (
    "Klädseln är manchester i 100 % polyester — ett räfflat tyg i sammetens "
    "familj, men med tydliga ribbor som ger ytan struktur i stället för glans. "
    "Ränderna gör att damm och små fläckar syns sämre än på ett slätt tyg."
)
SKOTSEL_MANCHESTER = (
    "Dammsug med möbelmunstycke i ribbornas riktning och ta fläckar med en väl "
    "urvriden trasa och lite milt diskmedel. Gnugga inte mot ribborna — de "
    "reser sig och ytan blir blank på fläcken. Låt tyget torka av sig självt."
)
BOKBEN = (
    "Benen är massiv bok och stommen har en inbyggd stålram. Under varje ben "
    "sitter ett justerbart golvskydd, så stolen går att räta upp på ett golv "
    "som lutar och inte repar parketten när den flyttas."
)
MONTERING_BEN = (
    "Fåtöljen kommer i delar och skruvas ihop hemma: benen skruvas fast i "
    "sitsen och pallen har egna ben. Dra åt alla skruvar innan du sätter dig "
    "första gången, och efterdra dem efter någon månads användning."
)
BJORKRAM = (
    "Ramen är böjd björk i 60 × 22 mm profil. Träet är limmat i tunna skikt och "
    "böjt i form, vilket ger både bärighet och en viss fjädring — stolen känns "
    "levande att sitta i utan att någon mekanism är inblandad."
)
SKOTSEL_BJORK = (
    "Dynan dras av och tvättas separat. Låt den lufttorka och lägg tillbaka den "
    "först när den är helt torr — fukt som ligger kvar mot träramen ger märken. "
    "Torka ramen med lätt fuktad trasa och torrtorka efter."
)
MONTERING_RAM = (
    "Vilstolen kommer i delar och skruvas ihop hemma: ramens två sidor fästs i "
    "tvärbalkarna och dynan träs på. Dra åt alla skruvar innan du sätter dig "
    "första gången, och efterdra dem efter någon månads användning."
)


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


# ================================================== MANCHESTERFAMILJEN ====
# Sex färgsyskon till den publicerade `manchesterfatolj-med-fotpall-beige`.
# Alla sju delar mått, laster, ben och tyg — bara färgen skiljer.
CORD = [
    # (kort, pris, färgord, slug, bestämd form i löptext)
    ("e1c41327", 2499, "petrolblå", "fatolj-petrolbla-manchester-fotpall", "petrolblå"),
    ("58fb3025", 2329, "ljusgrå",   "fatolj-ljusgra-manchester-fotpall",   "ljusgrå"),
    ("66adcdff", 2319, "gul",       "fatolj-gul-manchester-fotpall",       "gul"),
    ("4a9c33d2", 2269, "gråbeige",  "fatolj-grabeige-manchester-fotpall",  "gråbeige"),
    ("791e7292", 2199, "senapsgul", "fatolj-senapsgul-manchester-fotpall", "senapsgul"),
    ("bc220489", 2059, "orange",    "fatolj-orange-manchester-fotpall",    "orange"),
]
CORD_SLUG = {k: s for k, _, _, s, _ in CORD}
CORD_FARG = {k: f for k, _, f, _, _ in CORD}
# ☠️ Den publicerade sidan är familjens sjunde färg. Den MÅSTE stå i varje
#    syskonlista — annars är listan ofullständig i samma stund den går live,
#    och det är precis bristen uppgift #295 beskriver.
PUBLICERAD_BEIGE = ("manchesterfatolj-med-fotpall-beige", "beige")


def cord_syskon(mig):
    delar = [lank(s, f) for k, _, f, s, _ in CORD if k != mig]
    delar.append(lank(*PUBLICERAD_BEIGE))
    return och(delar)


def cord_produkt(kort, pris, farg, slug, form):
    stor = farg[0].upper() + farg[1:]
    return {
        "kort": kort, "pris": pris, "slug": slug,
        "name": "Manchesterfåtölj med fotpall i %s – vingrygg 101 cm, 150 kg" % farg,
        "title": "Manchesterfåtölj %s med fotpall | Fyndplats" % farg,
        "meta": ("Manchesterfåtölj i %s med lös fotpall, 80 × 72 × 101 cm. "
                 "Vingrygg, 11 cm sitsdyna och ben i massiv bok. Fåtöljen bär "
                 "150 kg, pallen 80 kg." % farg),
        "sokord": "manchesterfåtölj fotpall",
        "ingress": (
            "<p>En manchesterfåtölj i %s med matchande fotpall, båda på ben av "
            "massiv bok. Ryggen går upp i 101 cm och böjer sig framåt i sidorna, "
            "sitsdynan är 11 cm tjock och pallen står löst — den kan dras fram, "
            "skjutas undan eller användas som extra sittplats. Fåtöljen bär "
            "150 kg.</p>" % form),
        "eg": [
            "Lös fotpall ingår, 65 × 43 × 38 cm",
            "Vingrygg som går upp i 101 cm",
            "11 cm tjock sitsdyna",
            "Klädsel i manchester, 100 % polyester",
            "Ben i massiv bok med inbyggd stålram",
            "Justerbara golvskydd under benen",
            "46 cm bred sits på 45 cm höjd",
            "Bär 150 kg — fotpallen 80 kg",
            "Levereras omonterad",
        ],
        "spec": [
            "Mått (L × B × H): 72 × 80 × 101 cm",
            "Sittyta (B × D): 46 × 53 cm",
            "Sitthöjd: 45 cm",
            "Sitsdynans tjocklek: 11 cm",
            "Fotpall (B × D × H): 65 × 43 × 38 cm",
            "Maxlast: 150 kg för fåtöljen, 80 kg för fotpallen",
            "Klädsel: manchester, 100 % polyester",
            "Stomme: massiv bok och stål, med skumstoppning",
            "Färg: %s" % farg,
            "Vikt: 19,7 kg",
            "Paketmått: 74 × 40 × 72 cm",
            "Montering: krävs",
            "Ingår: fåtölj, fotpall och bruksanvisning",
        ],
        "villkor": ("Pallen är lös — och bär 80 kg", [
            "Fotpallen mäter 65 × 43 × 38 cm och är en möbel i sig, inte ett "
            "fotstöd som fälls ut ur sitsen. Den står där du ställer den: "
            "framför fåtöljen på kvällen, vid sidan om när golvytan behövs. Med "
            "80 kg bärighet duger den dessutom som stol när det kommer folk.",
            "Fåtöljen själv bär 150 kg. De två talen är olika med flit — pallen "
            "har fyra smalare ben och en tunnare ram, så den är gjord för fötter "
            "och tillfälligt sittande, inte för att ersätta en stol.",
        ]),
        "skotsel": [MANCHESTER, BOKBEN, SKOTSEL_MANCHESTER, MONTERING_BEN],
        "faq": [
            ("Ingår fotpallen?",
             "Ja. Den mäter 65 × 43 × 38 cm och står löst, alltså går den att "
             "flytta undan helt."),
            ("Hur mycket bär den?",
             "150 kg fåtöljen och 80 kg fotpallen."),
            ("Hur hög är ryggen?",
             "101 cm över golvet, med vingform i sidorna som ger huvudet något "
             "att luta sig emot."),
            ("Hur högt sitter man?",
             "45 cm över golvet. Sittytan är 46 × 53 cm och dynan är 11 cm tjock."),
            ("Vad är manchester för tyg?",
             "Ett räfflat tyg i sammetens familj, här i 100 % polyester. "
             "Ribborna ger struktur i stället för glans och döljer damm bättre "
             "än ett slätt tyg."),
            ("Vad är benen gjorda av?",
             "Massiv bok, med justerbara golvskydd under varje ben."),
            ("Finns den i fler färger?",
             "Ja, samma modell finns i %s." % cord_syskon(kort)),
        ],
    }


# ==================================================== BJÖRKVILSTOLARNA ====
# Två färgsyskon till den publicerade `vilstol-bjork-femstegs-fotstod` (svart).
BJORK = [("84082d41", 1299, "gråbrun", "vilstol-bjork-grabrun-fotstod"),
         ("7e00970f", 1259, "grå",     "vilstol-bjork-gra-fotstod")]
PUBLICERAD_SVART = ("vilstol-bjork-femstegs-fotstod", "svart")


def bjork_syskon(mig):
    delar = [lank(s, f) for k, _, f, s in BJORK if k != mig]
    delar.append(lank(*PUBLICERAD_SVART))
    return och(delar)


def bjork_produkt(kort, pris, farg, slug):
    return {
        "kort": kort, "pris": pris, "slug": slug,
        "name": "Vilstol i böjd björk med %s dyna och fotstöd i fem lägen" % farg,
        "title": "Vilstol björk %s, fem lägen | Fyndplats" % farg,
        "meta": ("Vilstol med ram i böjd björk och %s dyna, 66,5 × 94 × 100 cm. "
                 "Fotstödet ställs i fem lägen och dynan tvättas. Väger "
                 "10,3 kg, bär 120 kg." % farg),
        "sokord": "vilstol björk",
        "ingress": (
            "<p>En vilstol med ram i böjd björk och %s dyna. Fotstödet ställs i "
            "fem lägen, dynan dras av och tvättas, och hela stolen väger "
            "10,3 kg — lätt nog att flytta med en hand mellan vardagsrummet och "
            "sovrummet. Ramprofilen är 60 × 22 mm.</p>" % farg),
        "eg": [
            "Fotstödet ställs i fem lägen",
            "Avtagbar och tvättbar dyna",
            "Ram i böjd björk, profil 60 × 22 mm",
            "Armstöd för stöd när du reser dig",
            "Högdensitetsskum i dynan",
            "Väger 10,3 kg — går att flytta med en hand",
            "Bär 120 kg",
            "Levereras omonterad",
        ],
        "spec": [
            "Mått (L × B × H): 66,5 × 94 × 100 cm",
            "Ryggstöd (L × B × H): 75 × 55 × 71 cm",
            "Ryggstödets höjd: 71 cm",
            "Sits (L × B × H): 55,5 × 51,5 × 40 cm",
            "Fotdel (L × B): 55,5 × 33 cm",
            "Ramprofil: 60 × 22 mm björk",
            "Maxlast: 120 kg",
            "Klädsel: 100 % polyester",
            "Stomme: björk och skum",
            "Färg: %s dyna på ljus träram" % farg,
            "Vikt: 10,3 kg",
            "Paketmått: 81 × 60 × 23 cm",
            "Montering: krävs",
            "Ingår: vilstol med dyna och monteringsanvisning",
        ],
        "villkor": ("Fem lägen på fotstödet, inte en steglös mekanism", [
            "Fotdelen hakas i fem fasta lägen och mäter 55,5 × 33 cm. Det är "
            "hack, inte en steglös spak: du väljer ett av fem lägen och det "
            "står kvar där. Ryggen är fast i 71 cm höjd och följer inte med.",
            "Stolen tar 66,5 × 94 cm i golvyta. Det mesta av det är djup — "
            "ramen sträcker sig framåt under fotdelen — så mät framför stolen "
            "snarare än bredvid den.",
        ]),
        "skotsel": [BJORKRAM, SKOTSEL_BJORK, MONTERING_RAM],
        "faq": [
            ("Hur många lägen har fotstödet?",
             "Fem. De är fasta hack, inte en steglös inställning."),
            ("Går dynan att tvätta?",
             "Ja, den dras av och tvättas separat. Låt den lufttorka helt innan "
             "den läggs tillbaka."),
            ("Hur mycket bär den?",
             "120 kg. Ramen är böjd björk i 60 × 22 mm profil."),
            ("Hur tung är stolen?",
             "10,3 kg — lätt nog att flytta med en hand."),
            ("Hur mycket plats behöver den?",
             "66,5 × 94 cm i golvyta och 100 cm i höjd. Det mesta är djup, så "
             "mät framför stolen."),
            ("Går ryggen att fälla?",
             "Nej. Ryggen är fast i 71 cm höjd; det är fotstödet som ställs."),
            ("Finns den i fler färger?",
             "Ja, samma modell finns i %s." % bjork_syskon(kort)),
        ],
    }


# ------------------------------------------------------------- batchen ---
PRODUKTER = ([cord_produkt(*rad) for rad in CORD]
             + [bjork_produkt(*rad) for rad in BJORK])
