# -*- coding: utf-8 -*-
"""Runda 75 — sju kontorsstolar i tre modeller.

☠️ Batch 64 mätte skillnaden: fem produkter skrivna inline i API-anropet gav
NIO fel som nådde Wix, tre skrivna via fil gav noll. Texten skrivs därför HÄR.

☠️ RUNDANS STEG 2-GRIND STYR VARJE MENING. Två saker ur `STEG1.md`:

  1. INGEN av stolarna får säljas som ARBETSSTOL för en arbetsplats.
     Leverantören namnger ingen standard — varken EN 1335 eller någon annan.
     Texten säger vad stolen ÄR och vad den kan ställas i, aldrig att den
     uppfyller ett arbetsmiljökrav. (Uppgift #123.)
  2. HÄLSOPÅSTÅENDENA STRYKS, ALLA. Ordagrant i källan: *"die ausziehbare
     Fußstütze die Durchblutung fördert"*, *"stützt Ihre Wirbelsäule optimal"*,
     och en inramning där arbetsdagen *"oft mit verspanntem Nacken und
     Rückenschmerzen enden"*. Det är medicinska påståenden om en möbel utan ett
     enda underlag. `ergonomiskt formad` får stå som FORMBESKRIVNING, bunden
     till ett mätbart drag, aldrig som utlovad effekt.

☠️ KÄLLANS FÄRGORD LJUGER PÅ TRE AV SJU — ett med TVÅ steg. `farg.py` mäter ur
pixlarna och kalibrerar mot publicerade sidor där ordet redan är låst:

    utkast     källans ord   uppmätt                  skrivs
    75f6c433   Hellgrau      L 80 %, S 14 %, H 43°    BENVIT     ☠️
    7ab2f8aa   Dunkelgrau    L 58 %, S  3 %           LJUSGRÅ    ☠️ två steg
    60c803f0   Braun         L 60 %, S 29 %, H 29°    LJUSBRUN   ☠️
    cc81673d   Cremeweiß     L 80 %, S 22 %, H 35°    gräddvit    ✓
    0945e4dd   Braun         L 39 %, S 17 %, H 24°    brun        ✓
    348ee535   Grau          L 39 %, S  5 %           grå         ✓
    4d83eca6   Cremeweiß     L 85 %, S 13 %, H 36°    BENVIT     ~

  ⚠️ `7ab2f8aa` heter "Dunkelgrau" och mäter L 58 % — husets publicerade
     LJUSGRÅ-band börjar vid 58. Ordet är alltså inte bara fel, det pekar åt
     motsatt håll.
  ☠️ `75f6c433` och `cc81673d` ligger BÅDA på L 80 och hade båda blivit
     "gräddvit" på ögonmått. Mätningen skiljer dem: S 14 mot S 22. Den mattare
     skrivs BENVIT, den varmare GRÄDDVIT — och därmed krockar inte heller
     deras SKU:er, som annars hade delat `FP-kontorsstol-graddvit`.

☠️ TRE TAL SOM KÄLLAN GER OCH SOM MEDVETET INTE SKRIVS:

  1. RYGGSTÖDETS BREDD i modell C. `348ee535` säger 65 cm och `4d83eca6`
     säger 50 cm — samma modell, allt annat identiskt. Ett av talen är fel och
     det går inte att avgöra vilket, så måttet utelämnas på BÅDA sidorna.
  2. `Material` i den importerade svenska raden. Samma modell i grupp A står
     som "Polyester" på ett utkast och "Metall" på två. Tyskan säger bouclé +
     skum + plywood + galvaniserad metall för alla tre; den svenska raden är
     inte en källa.
  3. Ordet "Zertifiziert". Det förekommer utan norm och är därför ingen
     certifiering — samma regel som barngrindarna i runbokens Steg 2.
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


# ☠️ MAXLAST FÅR EGEN RUBRIK. Runbokens Steg 2: en säkerhetsrelevant gräns
#    skrivs som ett POSITIVT VILLKOR med egen rubrik, aldrig som ett
#    varningsblock och aldrig bara som en rad i speclistan.
MAXLAST = ("Bär 120 kg", [
    "Stolen är provad för 120 kg. Talet gäller en person som sitter, inte att "
    "stå på sitsen — en kontorsstol med gaslyft är inte en pall, och sitsen "
    "vrider sig under en fot på ett sätt den inte gör under en kropp.",
    "Efterdra skruvarna efter någon månads användning. Det är den enskilt "
    "vanligaste orsaken till att en stol börjar glappa, och det tar en minut.",
])


# ================================================ A · BOUCLÉ MED NACKSTÖD ==
# 65 × 75 × 115–123 cm · sits 48 × 51, höjd 47,5–55,5 · rygg 73,5–80 × 51
# nackstöd justerbart 6,5 cm · 13 cm sits, 12,5 cm rygg · 22,6 kg · 120 kg
A_SPEC = [
    "Mått (B × D × H): 65 × 75 × 115–123 cm",
    "Sits (B × D): 48 × 51 cm",
    "Sitthöjd: 47,5–55,5 cm",
    "Ryggstöd (H × B): 73,5–80 × 51 cm",
    "Stoppningens tjocklek: 13 cm i sitsen, 12,5 cm i ryggen",
    "Nackstödet flyttas: 6,5 cm",
    "Maxlast: 120 kg",
    "Klädsel: bouclé, 100 % polyester",
    "Stomme: plywood och galvaniserad metall, med skumstoppning",
    "Hjul: fem PU-hjul",
    "Färg: %s",
    "Vikt: 22,6 kg",
    "Paketmått: 88 × 35 × 59 cm",
    "Montering: krävs",
    "Ingår: kontorsstol och bruksanvisning",
]


def a_produkt(kort, pris, farg, slug, syskon):
    andra = [lank(s, f) for s, f in syskon]
    return {
        "kort": kort, "pris": pris, "slug": slug, "farg": farg,
        "sokord": "kontorsstol bouclé",
        "name": "Kontorsstol i bouclé, %s – nackstöd och 120 kg maxlast" % farg,
        "title": "Kontorsstol bouclé %s med nackstöd | Fyndplats" % farg,
        "meta": ("Kontorsstol i %s bouclé med justerbart nackstöd, 65 × 75 cm "
                 "och sitthöjd 47,5–55,5 cm. Fem PU-hjul, 360° vridbar. "
                 "Bär 120 kg." % farg),
        "ingress": (
            "<p>En kontorsstol klädd i %s bouclé — den nopprade väven som ger "
            "ytan en tydlig struktur i stället för glans. Ryggen går upp i "
            "115–123 cm beroende på hur gaslyften står, och nackstödet överst "
            "kan flyttas 6,5 cm så att det hamnar där just din nacke slutar. "
            "Sitsen har 13 cm stoppning och stolen bär 120 kg.</p>" % farg),
        "eg": [
            "Justerbart nackstöd — flyttas 6,5 cm i höjd",
            "13 cm stoppning i sitsen, 12,5 cm i ryggen",
            "Sitthöjd 47,5–55,5 cm via gaslyft",
            "Klädsel i bouclé, 100 % polyester",
            "Fem PU-hjul och 360 graders vridning",
            "48 cm bred sits på 51 cm djup",
            "Bär 120 kg",
            "Levereras omonterad",
        ],
        "spec": [r % farg if "%s" in r else r for r in A_SPEC],
        "villkor": MAXLAST,
        "skotsel": [
            "Bouclé är en väv med små öglor som står upp ur ytan. Den tål att "
            "dammsugas med möbelmunstycke och ska inte borstas hårt — öglorna "
            "kan dras ut ur väven och lämna en luddig fläck.",
            "Ta fläckar med en väl urvriden trasa och lite milt diskmedel, och "
            "arbeta utifrån och in så att kanten inte blir en ring. Låt tyget "
            "torka av sig självt.",
            "Stolen kommer i delar: foten skruvas ihop, hjulen trycks i, "
            "gaslyften träs på plats och sitsen skruvas fast i ryggen. Dra åt "
            "allt innan du sätter dig första gången.",
        ],
        "faq": [
            ("Hur högt sitter man?",
             "47,5–55,5 cm över golvet. Höjden ställs med gaslyften under sitsen."),
            ("Går nackstödet att justera?",
             "Ja, det flyttas 6,5 cm i höjd så att det möter nacken och inte bakhuvudet."),
            ("Hur mycket bär den?", "120 kg."),
            ("Hur stor plats tar den?",
             "65 × 75 cm i golvyta. Räkna med utrymme bakom för att kunna skjuta ut den."),
            ("Vad är bouclé för tyg?",
             "En väv med små öglor som ger ytan struktur. Här i 100 % polyester, "
             "vilket gör den lättare att torka av än ull."),
            ("Har den hjul?",
             "Ja, fem PU-hjul. Stolen vrider sig också 360 grader."),
            ("Finns den i fler färger?",
             "Ja, samma modell finns i %s." % och(andra)),
        ],
    }


# ================================== B · SNÖFLANELL MED UTDRAGBART FOTSTÖD ==
# 80 × 80 × 106–114 · liggläge 80 × 152 × 90–98 · sits 55 × 50, höjd 52–60
# sits 15 cm · rygg 65 × 64 × 12,5 · armstöd 43 × 15, 21 cm · fotstöd 34 × 21 × 5
B_SPEC = [
    "Mått (B × D × H): 80 × 80 × 106–114 cm",
    "Mått nedfälld (B × D × H): 80 × 152 × 90–98 cm",
    "Sits (B × D): 55 × 50 cm",
    "Sitthöjd: 52–60 cm",
    "Sitsens tjocklek: 15 cm",
    "Ryggstöd (H × B): 65 × 64 cm, tjocklek 12,5 cm",
    "Armstöd (L × B): 43 × 15 cm, 21 cm över sitsen",
    "Fotstöd (L × B × H): 34 × 21 × 5 cm",
    "Maxlast: 120 kg",
    "Klädsel: snöflanell, 100 % polyester",
    "Stomme: stål och lamellträ, med skumstoppning",
    "Hjul: fem PU-hjul, Ø 5 cm",
    "Färg: %s",
    "Vikt: 19,5 kg",
    "Paketmått: 72 × 45 × 63 cm",
    "Montering: krävs",
    "Ingår: kontorsstol och bruksanvisning",
]


def b_produkt(kort, pris, farg, slug, syskon):
    andra = [lank(s, f) for s, f in syskon]
    return {
        "kort": kort, "pris": pris, "slug": slug, "farg": farg,
        "sokord": "kontorsstol med fotstöd",
        "name": "Kontorsstol med fotstöd, %s – rygg i tre lägen, 152 cm nedfälld" % farg,
        "title": "Kontorsstol %s med fotstöd, tre lägen | Fyndplats" % farg,
        "meta": ("Kontorsstol i %s snöflanell med utdragbart fotstöd och rygg i "
                 "tre lägen. 80 × 80 cm upprätt, 152 cm djup nedfälld. "
                 "Bär 120 kg." % farg),
        "ingress": (
            "<p>En kontorsstol i %s snöflanell där ryggen låses i tre lägen och "
            "fotstödet dras ut ur sitsens framkant. Upprätt tar den 80 × 80 cm "
            "i golvyta; helt nedfälld sträcker den sig till 152 cm och blir en "
            "plats att luta sig tillbaka i. Sitsen är 15 cm tjock och stolen "
            "bär 120 kg.</p>" % farg),
        "eg": [
            "Ryggen låses i tre lägen",
            "Utdragbart fotstöd, 34 × 21 cm",
            "152 cm djup helt nedfälld",
            "15 cm tjock sits, 55 cm bred",
            "Sitthöjd 52–60 cm via gaslyft",
            "Klädsel i snöflanell, 100 % polyester",
            "Fem PU-hjul Ø 5 cm och 360 graders vridning",
            "Bär 120 kg",
            "Levereras omonterad",
        ],
        "spec": [r % farg if "%s" in r else r for r in B_SPEC],
        "villkor": MAXLAST,
        "skotsel": [
            "Snöflanell är en tät, mjuk väv i 100 % polyester. Den samlar damm "
            "i ytan snarare än i djupet, så en dammsugning med möbelmunstycke "
            "räcker långt.",
            "Ta fläckar med en väl urvriden trasa och lite milt diskmedel. "
            "Arbeta utifrån och in mot fläcken så att kanten inte blir en ring, "
            "och låt tyget torka av sig självt.",
            "Fotstödet dras ut och skjuts in för hand. Låt det gå in helt innan "
            "du flyttar stolen — skenan tar emot om stödet står halvvägs ute.",
            "Stolen kommer i delar: foten skruvas ihop, hjulen trycks i, "
            "gaslyften träs på plats och ryggen skruvas fast i sitsen. Dra åt "
            "allt innan du sätter dig första gången.",
        ],
        "faq": [
            ("Hur många lägen har ryggen?",
             "Tre. De är fasta lägen, inte en steglös inställning."),
            ("Hur långt fäller den ned?",
             "Till 152 cm djup, mätt från framkant till bakkant, och 90–98 cm hög."),
            ("Ingår fotstödet?",
             "Ja, det sitter i sitsens framkant och dras ut för hand. Det mäter 34 × 21 cm."),
            ("Hur högt sitter man?",
             "52–60 cm över golvet. Sitsen är 55 × 50 cm och 15 cm tjock."),
            ("Hur mycket bär den?", "120 kg."),
            ("Hur stor plats behöver den?",
             "80 × 80 cm upprätt. Räkna med 152 cm djup om den ska kunna fällas ned helt."),
            ("Finns den i fler färger?",
             "Ja, samma modell finns i %s." % och(andra)),
        ],
    }


# ======================================= C · VIPPFUNKTION PÅ FAST FYRFOT ==
# 67 × 68 × 103–113 · sits 48 × 46 × 46–54 · armstöd 18 cm · 15,5 kg
# ☠️ INGA HJUL — fyrstjärnig FAST fot. Ryggstödets bredd utelämnas (65 mot 50).
C_SPEC = [
    "Mått (B × D × H): 67 × 68 × 103–113 cm",
    "Sits (B × D): 48 × 46 cm",
    "Sitthöjd: 46–54 cm",
    "Armstöd: 18 cm över sitsen",
    "Maxlast: 120 kg",
    "Klädsel: 100 % polyester",
    "Stomme: metall, med skumstoppning",
    "Fot: fyrstjärnig fast fot, utan hjul",
    "Färg: %s",
    "Vikt: 15,5 kg",
    "Paketmått: 71 × 63 × 49 cm",
    "Montering: krävs",
    "Ingår: snurrstol och bruksanvisning",
]


def c_produkt(kort, pris, farg, slug, syskon):
    andra = [lank(s, f) for s, f in syskon]
    return {
        "kort": kort, "pris": pris, "slug": slug, "farg": farg,
        "sokord": "snurrstol utan hjul",
        "name": "Snurrstol %s med fast fyrfot – vippfunktion, utan hjul" % farg,
        "title": "Snurrstol %s utan hjul, vippfunktion | Fyndplats" % farg,
        "meta": ("Snurrstol i %s med fyrstjärnig fast fot utan hjul. Vippfunktion, "
                 "sitthöjd 46–54 cm och 67 × 68 cm i golvyta. Bär 120 kg." % farg),
        "ingress": (
            "<p>En snurrstol i %s på en fyrstjärnig fot <strong>utan hjul</strong>. "
            "Sitsen vrider sig 360 grader och vippar bakåt mot en fjäder, men "
            "stolen står kvar där du ställer den — den rullar inte i väg när du "
            "reser dig. Sitthöjden ställs 46–54 cm och stolen bär 120 kg.</p>" % farg),
        "eg": [
            "Fyrstjärnig fast fot — inga hjul",
            "Vippfunktion mot fjäder",
            "360 graders vridning",
            "Sitthöjd 46–54 cm via gaslyft",
            "48 cm bred sits på 46 cm djup",
            "Armstöd 18 cm över sitsen",
            "Klädsel i 100 % polyester",
            "Bär 120 kg",
            "Levereras omonterad",
        ],
        "spec": [r % farg if "%s" in r else r for r in C_SPEC],
        "villkor": MAXLAST,
        "skotsel": [
            "Klädseln är 100 % polyester och tål att dammsugas med "
            "möbelmunstycke. Ta fläckar med en väl urvriden trasa och lite milt "
            "diskmedel, utifrån och in, och låt tyget torka av sig självt.",
            "Foten är fast och har inga hjul. Lyft stolen när den ska flyttas i "
            "stället för att dra den — fotens spetsar kan repa ett mjukt golv.",
            "Stolen kommer i delar: foten skruvas ihop, gaslyften träs på plats "
            "och sitsen skruvas fast i ryggen. Dra åt allt innan du sätter dig "
            "första gången.",
        ],
        "faq": [
            ("Har den hjul?",
             "Nej. Foten är fyrstjärnig och fast, så stolen står kvar där du "
             "ställer den. Sitsen vrider sig ändå 360 grader."),
            ("Vad gör vippfunktionen?",
             "Ryggen och sitsen lutar bakåt mot en fjäder när du lutar dig, och "
             "går tillbaka när du reser dig."),
            ("Hur högt sitter man?",
             "46–54 cm över golvet. Höjden ställs med gaslyften under sitsen."),
            ("Hur mycket bär den?", "120 kg."),
            ("Hur stor plats tar den?", "67 × 68 cm i golvyta."),
            ("Hur tung är den?",
             "15,5 kg — lätt nog att lyfta undan när golvet ska torkas."),
            ("Finns den i fler färger?",
             "Ja, samma modell finns i %s." % och(andra)),
        ],
    }


# ------------------------------------------------------------ produkterna ---
A = [("75f6c433", 2379, "benvit",   "kontorsstol-benvit-boucle"),
     ("7ab2f8aa", 2029, "ljusgrå",  "kontorsstol-ljusgra-boucle"),
     ("60c803f0", 1999, "ljusbrun", "kontorsstol-ljusbrun-boucle")]
B = [("cc81673d", 2239, "gräddvit", "kontorsstol-graddvit-fotstod"),
     ("0945e4dd", 2449, "brun",     "kontorsstol-brun-fotstod")]
C = [("348ee535", 2099, "grå",      "snurrstol-gra-fast-fot"),
     ("4d83eca6", 2099, "benvit",   "snurrstol-benvit-fast-fot")]

# ☠️ Grupp B är färgsyskon till den PUBLICERADE `kontorsstol-fotstod-sammet`
#    (mörkgrå). Den sidan länkas från båda och är låst — den poleras inte om.
PUBLICERAD_B = ("kontorsstol-fotstod-sammet", "mörkgrå")


def _syskon(lista, kort, extra=()):
    return [(s, f) for k, _, f, s in lista if k != kort] + list(extra)


PRODUKTER = (
    [a_produkt(k, p, f, s, _syskon(A, k)) for k, p, f, s in A]
    + [b_produkt(k, p, f, s, _syskon(B, k, [PUBLICERAD_B])) for k, p, f, s in B]
    + [c_produkt(k, p, f, s, _syskon(C, k)) for k, p, f, s in C]
)

if __name__ == "__main__":
    for p in PRODUKTER:
        h = bygg(p)
        print("%-9s %-30s %5d kr  %4d tecken  meta %d"
              % (p["kort"], p["slug"], p["pris"], len(h), len(p["meta"])))
