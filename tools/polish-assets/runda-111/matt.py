# -*- coding: utf-8 -*-
"""Runda 111 — uppmätta fakta om sju rumsavdelare i SEX konstruktioner.

☠️ RUNDA 110:S STEG 1 SA ATT GRUPP D SAKNAR MÅTT. Det var halvsant och därför
   farligt: det SVENSKA spec-blocket säger `Mått: 4-teilig` — panelantalet har
   hamnat i måttfältet — men den TYSKA brödtexten bär fullständiga mått på
   alla tre. Underlaget fanns hela tiden, i fältet bredvid.

☠️ OCH DET ÄR INTE EN FAMILJ. Sju produkter delar produkttyp och ingenting
   annat: två shoji-skärmar i tallram med tyg, en med palmbladstryck, ett
   handflätat pappersrep med bågformad topp, en vit vävskärm MED TVÅ HYLLOR,
   och två tygskärmar på metallstomme varav en på tolv hjul. Sex texter, inte
   en delad. Runda 110:s misstag var att ett delat FAQ-svar var sant på fyra
   sidor av sex; här hade ett delat block varit fel på fem av sju.

Fälten: (paneler, panelbredd, breddUtfalld, djup, hojd, hopfalldBredd,
         hopfalldDjup, vikt, paketmatt, pris, wixId, wixVariantId, artnr,
         lager)
Djupet är PANELENS tjocklek för de fem vikskärmarna och FOTENS djup för de två
på metallstomme — två olika storheter i samma kolumn vore just den förväxling
huset förlorat en månad på (`sku` mot `sku`). Därför skiljer FOTDJUP dem åt.
"""

GRUPPER = {
    "e858810e": "D1", "f641d190": "D1",     # shoji: tallram + vitt tyg
    "1c1eb875": "D2",                        # tallram + vliestyg, palmbladstryck
    "23d20823": "E1",                        # handflätat pappersrep, bågformad topp
    "db70e38c": "E2",                        # flätad pappersfiber + tall/bambu, 2 hyllor
    "79b349f7": "F1",                        # stål + polyester, 12 hjul
    "99040238": "F2",                        # metall + polyester, 3 paneler
}

# Grupper där kolumnen "djup" är FOTENS djup, inte panelens tjocklek.
FOTDJUP = {"F1", "F2"}

RUNDAN = {
    #            pan  pbredd  bredd  djup  höjd  hopfälld     vikt  paket           pris
    "e858810e": (4,   40,     160,   1.7,  170,  (40, 6.8),   7.5,  (180, 46, 11),  1419),
    "f641d190": (3,   40,     120,   1.7,  170,  (40, 5.1),   6.0,  (180, 46,  9),  1159),
    "1c1eb875": (4,   40,     160,   1.8,  170,  (40, 7.2),   8.0,  (180, 46, 11),  1319),
    "23d20823": (3,   40,     120,   1.8,  170,  (40, 5.4),   4.3,  (174, 44,  7),  1299),
    "db70e38c": (4,   45,     181,   1.6,  180,  (45, 8.0),   8.5,  (182, 47, 11),  1119),
    "79b349f7": (5,   50,     252,  40.0,  170,  (50, 40.0), 13.7,  ( 91, 14.5, 14.5), 1019),
    "99040238": (3,   84,     253,  50.0,  182,  None,        6.8,  ( 94, 13, 11),   829),
}

WIX = {
    "e858810e": "e858810e-a67a-4c77-b0ac-a86886c9c3b7",
    "f641d190": "f641d190-9b25-4d12-9709-608438f49cf8",
    "1c1eb875": "1c1eb875-b699-41fd-9415-4384ee879e8f",
    "23d20823": "23d20823-0f56-42e2-8395-ab8f23d5701d",
    "db70e38c": "db70e38c-23f6-4a95-8197-17f217c3a7d6",
    "79b349f7": "79b349f7-8b39-4c77-8c17-ba8efc2fefb6",
    "99040238": "99040238-a522-40ef-b90d-94ea036316c8",
}

# ☠️ MATERIALET ÄR MÄTT PÅ BILDEN OCH I DEN TYSKA BRÖDTEXTEN, inte hämtat ur
#    det svenska spec-blocket. D1:s spec-block säger bara `Kiefernholz`; den
#    tyska texten säger `Kiefernholz und Stoff`, och zoomen visar ett vitt,
#    halvgenomskinligt tygark bakom trägallret. Exakt samma lucka som runda
#    110 mätte på grupp A, där väven var POLYPROPEN och blocket bara sa trä.
# ⚠️ FURU, INTE TALL, i hela rundan. Samma träslag, två ord — och båda stod
#    på samma sida: spec-tabellen sa `tallram` medan brödtexten sa `furu`.
#    Möbelordet är furu, så det får gälla överallt.
MATERIAL = {
    "e858810e": "fururam med vit tygfyllning",
    "f641d190": "fururam med vit tygfyllning",
    "1c1eb875": "fururam med tryckt fiberduk",
    "23d20823": "flätat pappersrep på fururam",
    "db70e38c": "flätad pappersfiber på ram av furu och bambu",
    "79b349f7": "polyesterduk på stålstomme",
    "99040238": "polyesterduk på pulverlackerad metallstomme",
}

FARG = {
    "e858810e": "naturträ och vitt",
    "f641d190": "naturträ och vitt",
    "1c1eb875": "naturträ och grönt",
    "23d20823": "natur",
    "db70e38c": "vit",
    "79b349f7": "mörkgrå",
    "99040238": "svart",
}

# Montering: leverantörens egen uppgift, och den skiljer sig ÅT INOM rundan.
MONTERING = {
    "e858810e": False, "f641d190": False, "1c1eb875": False,
    "23d20823": False, "db70e38c": False,
    "79b349f7": True,  "99040238": True,
}

# Egenskaper bara EN produkt har. Ett delat block hade ljugit om de andra sex.
UNIKT = {
    "db70e38c": "tva hyllplan 170 x 20 cm, max 5 kg per hylla, benhojd 5,5 cm",
    "79b349f7": "12 hjul pa sex stolpar, paneler kan laggas till eller tas bort",
    "23d20823": "bagformad topp, star pa ben",
    "1c1eb875": "palmbladstryck i gront",
}


def kontroll():
    """Mekaniska samband som MÅSTE hålla. Fäller på siffror, inte på intryck."""
    fel = []
    for k, v in RUNDAN.items():
        pan, pbredd, bredd, djup, hojd, hopf, vikt, paket, pris = v
        g = GRUPPER[k]

        # 1. Panelbredd × antal ska ge totalbredden — utom där leverantören
        #    uttryckligen lägger till stommens egen bredd.
        summa = pan * pbredd
        if summa != bredd:
            diff = bredd - summa
            if not (1 <= diff <= 2):
                fel.append("%s: %d paneler x %d = %d men bredden anges %d"
                           % (k, pan, pbredd, summa, bredd))

        # 2. Hopfälld bredd = EN panel, för alla vikskärmar.
        if hopf and hopf[0] != pbredd:
            fel.append("%s: hopfalld bredd %s men panelen ar %d" % (k, hopf[0], pbredd))

        # 3. Hopfälld tjocklek ≈ paneler × djup, för vikskärmarna.
        #    ⚠️ db70e38c bär TVÅ HYLLPLAN, och hyllorna följer med in i vecket:
        #    4 × 1,6 = 6,4 cm rent panelgods mot 8,0 cm uppmätt hopfällt. De
        #    1,6 cm som skiljer ÄR hyllbeslagen. Grinden får därför veta att en
        #    skärm med hyllor viker sig tjockare — men bara den, och bara så
        #    mycket som en hylla faktiskt tar.
        if hopf and g not in FOTDJUP:
            vantat = pan * djup
            tak = 2.5 if "hyll" in UNIKT.get(k, "") else 1.0
            if abs(hopf[1] - vantat) > tak:
                fel.append("%s: hopfalld tjocklek %.1f men %d x %.1f = %.1f"
                           % (k, hopf[1], pan, djup, vantat))

        # 4. ☠️ PAKETLÄNGDEN SKILJER PRODUKTKLASSERNA ÅT, och det är inte en
        #    detalj. En FÄRDIGMONTERAD vikskärm måste ligga i en kartong minst
        #    lika lång som den är hög — 170 cm skärm, 174–182 cm kartong. En
        #    skärm som KRÄVER MONTERING kommer i delar: 79b349f7 är 170 cm hög
        #    och packas i 91 cm, 99040238 är 182 cm och packas i 94 cm, alltså
        #    stolpar i halvor. Bilderna bekräftar det — båda har en synlig
        #    skarvhylsa mitt på stolpen.
        #
        #    Grinden prövar därför BÅDA riktningarna. Ett paket som är för kort
        #    på en färdigmonterad skärm är ett fel; ett paket som är för LÅNGT
        #    på en monteringsskärm är också ett fel, för då stämmer inte
        #    "monteras" med det leverantören faktiskt skickar.
        if MONTERING[k]:
            if paket[0] > hojd - 20:
                fel.append("%s: uppges kraeva montering men paketet ar %s cm mot %d hojd "
                           "— da kommer den knappast i delar" % (k, paket[0], hojd))
        elif paket[0] < hojd - 10:
            fel.append("%s: levereras fardigmonterad men paketet ar bara %s cm "
                       "mot %d hojd" % (k, paket[0], hojd))

        # 5. Fotdjup hör bara till F-grupperna, panelt­jocklek bara till resten.
        if g in FOTDJUP and djup < 10:
            fel.append("%s: %s ska ha FOTDJUP, inte paneltjocklek %.1f" % (k, g, djup))
        if g not in FOTDJUP and djup > 5:
            fel.append("%s: %s ska ha paneltjocklek, inte %.1f" % (k, g, djup))

    # 6. D1 är SAMMA modell i två storlekar: allt utom panelantal ska matcha.
    a, b = RUNDAN["e858810e"], RUNDAN["f641d190"]
    for i, namn in ((1, "panelbredd"), (3, "djup"), (4, "hojd")):
        if a[i] != b[i]:
            fel.append("D1 delar modell men %s skiljer: %s mot %s" % (namn, a[i], b[i]))

    # 7. Varje produkt ska ha ett material och en färg — inga tomma fält.
    for k in RUNDAN:
        if not MATERIAL.get(k) or not FARG.get(k):
            fel.append("%s: saknar material eller farg" % k)
    return fel


if __name__ == "__main__":
    fel = kontroll()
    for f in fel:
        print("✗", f)
    print("%d produkter, %d konstruktioner, %d fel"
          % (len(RUNDAN), len(set(GRUPPER.values())), len(fel)))
