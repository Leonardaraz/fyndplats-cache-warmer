# -*- coding: utf-8 -*-
"""Runda 77 — fem ritstolar och ett hjärtryggspar i två kulörer.

☠️ Batch 64 mätte skillnaden: fem produkter skrivna inline i API-anropet gav
NIO fel som nådde Wix, tre skrivna via fil gav noll. Texten skrivs därför HÄR.

☠️ RITNINGEN ÄR FACIT, INTE BOKSTÄVERNA. Samma sak som runda 76 mätte upp:
   `Gesamtmaße: 59L x 65B` mot `Gesamtmaße: 59B x 65T` i två utkast av samma
   modelltyp — leverantören byter betydelse på L/B/T mellan produkter. Alla
   tal nedan är lästa ur måttritningen (bild 3), `ark-ritningar.jpg`.

☠️ TVÅ MÅTT UTELÄMNAS MED FLIT:
   * `d739872f`:s ryggstöd. Källan säger `59L x 49B`, ritningen visar 60 cm
     tvärs över ryggen. Vilket tal som är bredden går inte att avgöra.
   * VIKTEN på alla sju. Källan anger den för noll av dem — bara
     belastningskapaciteten, som är något annat.

☠️ `ergonomisk` FÅR INTE FÖREKOMMA. Fyra av sju heter `Ergonomischer
   Bürostuhl` på tyska, men ingen bär någon certifiering. Ordet är ett
   påstående vi inte kan belägga, och linten fäller på det.

⚠️ Den publicerade `ritstol-fotring-natrygg-55-76-cm` äger sökordet `ritstol`.
   De fem nya korslänkar därför BÅDE till varandra och till den — sitthöjden
   är det som skiljer dem åt, och den står i varje länktext.
"""

BAS = "https://www.fyndplats.se/produkt/"
PUBLICERAD_RITSTOL = ("ritstol-fotring-natrygg-55-76-cm", "sitthöjd 55–76 cm")


def lank(slug, text):
    return '<a href="%s%s">%s</a>' % (BAS, slug, text)


def och(delar):
    if len(delar) == 1:
        return delar[0]
    return ", ".join(delar[:-1]) + " och " + delar[-1]


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


# ☠️ MAXLAST FÅR EGEN RUBRIK — ett positivt villkor, aldrig en varningsruta.
MAXLAST = ("Bär 120 kg", [
    "Stolen är provad för 120 kg. Talet gäller en person som sitter, inte att "
    "stå på sitsen — en stol med gaslyft är inte en trappstege, och sitsen "
    "vrider sig under en fot på ett sätt den inte gör under en kropp.",
    "Efterdra skruvarna efter någon månads användning. Det är den enskilt "
    "vanligaste orsaken till att en stol börjar glappa, och det tar en minut.",
])


# ================================================== G · RITSTOLARNA (5) ===
# Gemensamt: nätrygg, gaslyft, femarmad fot på hjul, fotring, 120 kg,
# nätväv 100 % polyester. Det som SKILJER står i varje modells egen tabell.
def g_spec(matt, sits, sitthojd, rygg, armstod, fotring, extra, material):
    r = ["Mått (B × D × H): %s" % matt,
         "Sits (B × D): %s" % sits,
         "Sitthöjd: %s" % sitthojd]
    if rygg:
        r.append("Ryggstöd (B × H): %s" % rygg)
    r.append("Armstöd: %s" % armstod)
    if fotring:
        r.append("Fotring: %s" % fotring)
    r += extra
    r += ["Maxlast: 120 kg",
          "Rygg och sits: %s" % material,
          "Höjdreglering: gaslyft",
          "Fot: femarmad, på hjul",
          "Färg: svart",
          "Montering: krävs",
          "Ingår: ritstol och bruksanvisning"]
    return r


def g_skotsel(dammsug):
    return [
        "Nätväven dammsugs med möbelmunstycke. Fläckar tas med en fuktig "
        "trasa och lite diskmedel — låt torka innan du sätter dig, annars "
        "sätter sig fukten i skummet under.",
        dammsug,
        "Hjulen samlar hår och damm i navet. Vänd stolen upp och ned ett par "
        "gånger om året och dra ut det som fastnat, så rullar den lätt igen.",
    ]


G_FAQ_BAS = [
    ("Går den att använda vid ett vanligt skrivbord?",
     "Den går ner till sin lägsta sitthöjd och fungerar då som en hög "
     "kontorsstol, men den är byggd för höga bord och ståbord — det är där "
     "fotringen kommer till sin rätt. Vid ett bord i vanlig skrivbordshöjd "
     "sitter du bättre i en vanlig kontorsstol."),
    ("Behöver jag fotringen?",
     "Ja, när sitsen är uppe. Fötterna når inte golvet på de högre lägena, "
     "och utan något att vila dem på hänger benen i luften och trycker mot "
     "sitskanten. Ringen flyttas i höjd så att du får knäna i ungefär rät "
     "vinkel."),
    ("Kan jag montera den själv?",
     "Ja. Stolen kommer isärtagen med bruksanvisning och de verktyg som "
     "behövs. Det är en vanlig stolmontering: fot, gaslyft, sits, rygg."),
]


def g_produkt(kort, pris, slug, namn, titel, meta, ingress, eg, specrader,
              faq_extra, skotsel_rad, syskon):
    return {
        "kort": kort, "pris": pris, "slug": slug, "name": namn,
        "title": titel, "meta": meta,
        "ingress": ingress + "".join(
            "<p>%s</p>" % s for s in ([
                "Andra ritstolar hos oss: " + och([lank(s, t) for s, t in syskon]) + "."
            ])),
        "eg": eg, "spec": specrader, "villkor": MAXLAST,
        "skotsel": g_skotsel(skotsel_rad), "faq": G_FAQ_BAS + faq_extra,
    }


# --- G1  d739872f · 1 399 kr · uppfällbara armstöd, 108–132 cm -------------
G1 = g_produkt(
    "d739872f", 1399, "ritstol-uppfallbara-armstod",
    "Ritstol med uppfällbara armstöd – 53–78 cm sitthöjd och fotring",
    "Ritstol med uppfällbara armstöd 53–78 cm | Fyndplats",
    "Ritstol med armstöd som fälls upp ur vägen. Sitthöjd 53–78 cm, "
    "fotring i krom, nätrygg och 120 kg maxlast. Fri frakt över 499 kr.",
    "<p>En <strong>ritstol</strong> med armstöd som går att fälla upp när de "
    "är i vägen. Sitshöjden ställs mellan 53 och 78 cm, så stolen räcker "
    "både till ett ståbord och till en hög arbetsbänk.</p>"
    "<p>Armstöden ligger 26,5 cm över sitsen när de är nere. Fällda uppåt "
    "kommer du intill bordsskivan utan att armstöden tar emot — det är "
    "skillnaden mot en fast modell när du arbetar lutad över ett underlag.</p>"
    "<p>Ryggen är av nätväv som släpper igenom luft, och stolen står på en "
    "femarmad fot med hjul och en fotring i krom.</p>",
    ["Armstöd som fälls upp ur vägen, 26,5 cm över sitsen",
     "Sitthöjd 53–78 cm med gaslyft",
     "Fotring i krom att vila fötterna på",
     "Nätrygg som släpper igenom luft",
     "Bär 120 kg"],
    g_spec("60 × 60 × 108–132 cm", "48 × 50 cm", "53–78 cm", None,
           "uppfällbara, 26,5 cm över sitsen", "i krom, höjdreglerbar",
           ["Armstödens yta (B × L): 7,5 × 24 cm"],
           "nätväv, 100 % polyester, över skum"),
    [("Hur mycket plats tar den?",
      "60 cm i bredd och 60 cm i djup, och foten är rund så den behöver inte "
      "mer utrymme åt något håll. Höjden varierar mellan 108 och 132 cm "
      "beroende på hur högt du ställer sitsen.")],
    "Fäll upp armstöden när du dammtorkar — då kommer du åt sitskanten, som "
    "är den yta som blir smutsigast.",
    [("ritstol-med-svankstod", "modellen med svankstöd"),
     ("ritstol-sitthojd-87-cm", "den högsta, sitthöjd upp till 87 cm"),
     PUBLICERAD_RITSTOL])

# --- G2  795c5ee2 · 1 199 kr · utan armstöd, 93–113 cm ---------------------
G2 = g_produkt(
    "795c5ee2", 1199, "ritstol-utan-armstod",
    "Ritstol utan armstöd – 50–70 cm sitthöjd och fotring Ø45 cm",
    "Ritstol utan armstöd – sitthöjd 50–70 cm | Fyndplats",
    "Ritstol utan armstöd som går ända in under bordsskivan. Sitthöjd "
    "50–70 cm, fotring Ø45 cm, nätrygg, 120 kg. Fri frakt över 499 kr.",
    "<p>En <strong>ritstol utan armstöd</strong>, för den som vill komma "
    "ända in under bordsskivan. Utan armstöd tar stolen mindre plats och går "
    "att skjuta in helt när du reser dig.</p>"
    "<p>Sitsen ställs mellan 50 och 70 cm — rundans lägsta spann, alltså den "
    "modell som passar bäst till ett bord som bara är lite för högt för en "
    "vanlig kontorsstol.</p>"
    "<p>Fotringen är 45 cm i diameter och flyttas mellan 17 och 34,5 cm över "
    "golvet. Ryggen är liten och nätad, 41 cm bred, och stöttar korsryggen "
    "utan att ta emot när du vrider dig.</p>",
    ["Inga armstöd — går ända in under bordsskivan",
     "Sitthöjd 50–70 cm med gaslyft",
     "Fotring Ø45 cm, ställbar 17–34,5 cm över golvet",
     "Liten nätrygg, 41 cm bred",
     "Bär 120 kg"],
    g_spec("59 × 61 × 93–113 cm", "46 × 44 cm", "50–70 cm", "41 × 39 cm",
           "inga", "Ø45 cm, 17–34,5 cm över golvet", [],
           "nätväv, 100 % polyester, över skum"),
    [("Går armstöd att sätta på i efterhand?",
      "Nej, stolen är byggd utan fästen för armstöd. Vill du ha armstöd är "
      "det en annan modell — se länkarna ovan.")],
    "Utan armstöd är sitskanten fri hela vägen runt, så en trasa räcker "
    "varvet om.",
    [("ritstol-95-115-cm", "samma storlek men med armstöd"),
     ("ritstol-uppfallbara-armstod", "modellen med uppfällbara armstöd"),
     PUBLICERAD_RITSTOL])


# --- G3  3033003c · 1 649 kr · svankstöd, bredaste sitsen -----------------
G3 = g_produkt(
    "3033003c", 1649, "ritstol-med-svankstod",
    "Ritstol med svankstöd – 53 cm bred sits och uppfällbara armstöd",
    "Ritstol med svankstöd och 53 cm sits | Fyndplats",
    "Ritstol med separat svankstöd på 40 × 37 cm och rundans bredaste sits, "
    "53 cm. Sitthöjd 52–72 cm, fotring Ø45 cm. Fri frakt över 499 kr.",
    "<p>En <strong>ritstol med svankstöd</strong> — en egen dyna på 40 × 37 cm "
    "i svanken, utöver den 67 cm höga nätryggen. Det är den som gör skillnad "
    "när du sitter länge och gärna glider framåt på sitsen.</p>"
    "<p>Sitsen är 53 cm bred, rundans bredaste, och ställs mellan 52 och "
    "72 cm. Armstöden fälls upp när du vill komma närmare bordet och ligger "
    "20 cm över sitsen när de är nere.</p>"
    "<p>Fotringen är 45 cm i diameter och flyttas mellan 20 och 37 cm över "
    "golvet, så den följer med när du höjer sitsen.</p>",
    ["Separat svankstöd, 40 × 37 cm",
     "Rundans bredaste sits, 53 cm",
     "Uppfällbara armstöd, 20 cm över sitsen",
     "Sitthöjd 52–72 cm, fotring Ø45 cm",
     "Bär 120 kg"],
    g_spec("59 × 65 × 102–122 cm", "53 × 50 cm", "52–72 cm", "53 × 67 cm",
           "uppfällbara, 20 cm över sitsen", "Ø45 cm, 20–37 cm över golvet",
           ["Svankstöd (B × H): 37 × 40 cm",
            "Armstödens yta (B × L): 6 × 35 cm"],
           "nätväv, 100 % polyester, över skum"),
    [("Går svankstödet att flytta?",
      "Det sitter på ryggens nedre del och följer ryggen. Sitthöjden och "
      "fotringen ställer du i stället så att svanken hamnar rätt mot dynan.")],
    "Svankdynan har en egen söm mot ryggen där damm samlas — kör "
    "möbelmunstycket längs den när du dammsuger sitsen.",
    [("ritstol-uppfallbara-armstod", "modellen med uppfällbara armstöd"),
     ("ritstol-utan-armstod", "modellen utan armstöd"),
     PUBLICERAD_RITSTOL])

# --- G4  83fd57c9 · 1 199 kr · lägsta totalhöjden, 95–115 cm --------------
G4 = g_produkt(
    "83fd57c9", 1199, "ritstol-95-115-cm",
    "Ritstol 95–115 cm med armstöd – sitthöjd 52–72 cm och fotring",
    "Ritstol 95–115 cm med armstöd | Fyndplats",
    "Ritstol som är 95–115 cm hög med armstöd 19 cm över sitsen. Sitthöjd "
    "52–72 cm, fotring Ø45 cm, nätrygg, 120 kg. Fri frakt över 499 kr.",
    "<p>En <strong>ritstol</strong> med fasta armstöd och rundans lägsta "
    "totalhöjd: 95 cm nere och 115 cm uppe. Den tar mindre visuell plats i "
    "ett rum än de högre modellerna och syns inte över en rumsavdelare.</p>"
    "<p>Armstöden ligger 19 cm över sitsen och är 29 cm långa — tillräckligt "
    "för att vila underarmarna på utan att gå emot en bordsskiva på normal "
    "höjd.</p>"
    "<p>Sitsen ställs mellan 52 och 72 cm, och fotringen på 45 cm i diameter "
    "flyttas mellan 20 och 37 cm över golvet.</p>",
    ["Lägsta totalhöjden i rundan, 95–115 cm",
     "Fasta armstöd, 19 cm över sitsen",
     "Sitthöjd 52–72 cm med gaslyft",
     "Fotring Ø45 cm, ställbar 20–37 cm",
     "Bär 120 kg"],
    g_spec("59 × 59 × 95–115 cm", "48 × 45 cm", "52–72 cm", "45 × 45 cm",
           "fasta, 19 cm över sitsen", "Ø45 cm, 20–37 cm över golvet",
           ["Armstödens yta (B × L): 7 × 29 cm"],
           "nätväv, 100 % polyester, över skum"),
    [("Är armstöden i vägen vid ett lågt bord?",
      "De ligger 19 cm över sitsen. Vid ett bord där du ställer sitsen lågt "
      "kan de ta emot skivan — behöver du komma helt intill finns modellen "
      "utan armstöd och den med uppfällbara.")],
    "Armstöden sitter fast och går inte att ta av, så torka runt fästena där "
    "de möter sitsramen.",
    [("ritstol-utan-armstod", "samma storlek utan armstöd"),
     ("ritstol-uppfallbara-armstod", "modellen med uppfällbara armstöd"),
     PUBLICERAD_RITSTOL])

# --- G5  f1f861ea · 1 519 kr · högsta sitthöjden, 65,5–87 cm --------------
G5 = g_produkt(
    "f1f861ea", 1519, "ritstol-sitthojd-87-cm",
    "Ritstol med sitthöjd upp till 87 cm – för höga bänkar och ståbord",
    "Ritstol med sitthöjd upp till 87 cm | Fyndplats",
    "Ritstol med sitthöjd 65,5–87 cm, rundans högsta. För höga arbetsbänkar "
    "och ståbord. Armstöd, fotring, nätrygg, 120 kg. Fri frakt över 499 kr.",
    "<p>En <strong>ritstol</strong> med sitthöjd 65,5–87 cm — rundans högsta, "
    "och den enda som börjar där de andra slutar. Den är gjord för höga "
    "arbetsbänkar och ståbord, inte för ett vanligt skrivbord.</p>"
    "<p>Fotringen flyttas mellan 18 och 46 cm över golvet, alltså nästan tre "
    "decimeter, så att fötterna har något att vila mot även på det högsta "
    "läget.</p>"
    "<p>Armstöden ligger 19 cm över sitsen, ryggen är 44,5 cm bred nätväv, "
    "och stolen står på en femarmad fot med hjul.</p>",
    ["Rundans högsta sitthöjd, 65,5–87 cm",
     "Fotring med stort spann, 18–46 cm över golvet",
     "Armstöd 19 cm över sitsen",
     "Nätrygg 44,5 cm bred",
     "Bär 120 kg"],
    g_spec("60 × 56 × 110–132 cm", "48 × 49 cm", "65,5–87 cm",
           "44,5 × 45,5 cm", "fasta, 19 cm över sitsen",
           "18–46 cm över golvet", [],
           "nätväv, 100 % polyester, över skum"),
    [("Går den ner till vanlig skrivbordshöjd?",
      "Nej. Lägsta sitthöjden är 65,5 cm, vilket är för högt för ett vanligt "
      "skrivbord. Ska stolen användas där är det någon av de lägre "
      "modellerna som gäller.")],
    "Gaslyftets pelare är längre än på de lägre modellerna — torka av den när "
    "sitsen är nere, så att damm inte följer med upp i hylsan.",
    [("ritstol-med-svankstod", "modellen med svankstöd"),
     ("ritstol-95-115-cm", "den lägsta, 95–115 cm"),
     PUBLICERAD_RITSTOL])


# ======================================= H · HJÄRTRYGG, TVÅ KULÖRER (2) ===
# 45 × 56 × 78–88 · sits 46 × 39 · sitthöjd 44–54 · rygg 45 × 38 · 120 kg
# teddytyg 100 % polyester · inga armstöd · femarmad fot på hjul
# ☠️ Det här är INGEN ritstol — 78–88 cm total höjd och sitthöjd 44–54.
#    Den korslänkas bara till sitt eget färgsyskon.
H_SPEC = [
    "Mått (B × D × H): 45 × 56 × 78–88 cm",
    "Sits (B × D): 46 × 39 cm",
    "Sitthöjd: 44–54 cm",
    "Ryggstöd (B × H): 45 × 38 cm",
    "Armstöd: inga",
    "Maxlast: 120 kg",
    "Klädsel: teddytyg, 100 % polyester, över skum",
    "Höjdreglering: gaslyft",
    "Fot: femarmad, på hjul",
    "Färg: %s",
    "Montering: krävs",
    "Ingår: skrivbordsstol och bruksanvisning",
]

H_FAQ = [
    ("Är den en ritstol?",
     "Nej. Sitthöjden är 44–54 cm, alltså vanlig skrivbordshöjd. En ritstol "
     "börjar där den här slutar och har fotring — det är en annan sorts stol "
     "för höga bänkar."),
    ("Passar den ett sminkbord?",
     "Ja. Ryggen är 38 cm hög och når inte upp i vägen för en spegel, och "
     "stolen är 45 cm bred, så den skjuts in under de flesta sminkbord."),
    ("Hur gör jag rent teddytyget?",
     "Dammsug med möbelmunstycke. Fläckar tas med ljummet vatten och lite "
     "diskmedel på en trasa som är urvriden — tyget är luddigt och binder "
     "vatten, så för blött gör att det klumpar sig när det torkar."),
    ("Kan jag montera den själv?",
     "Ja. Stolen kommer isärtagen med bruksanvisning: fot, gaslyft, sits och "
     "rygg. Det är fyra delar och en insexnyckel."),
]


def h_produkt(kort, pris, slug, farg, syskon_slug, syskon_farg):
    stor = farg[0].upper() + farg[1:]
    return {
        "kort": kort, "pris": pris, "slug": slug,
        "name": "Skrivbordsstol %s med hjärtformad rygg – 44–54 cm sitthöjd" % farg,
        "title": "Skrivbordsstol %s med hjärtformad rygg | Fyndplats" % farg,
        "meta": "Skrivbordsstol i %s teddytyg med hjärtformad rygg. Sitthöjd "
                "44–54 cm, 45 cm bred, bär 120 kg. Fri frakt över 499 kr." % farg,
        "ingress":
            "<p>En <strong>skrivbordsstol</strong> i %s teddytyg med "
            "<strong>hjärtformad rygg</strong> — ryggstödet är utskuret i "
            "mitten, så formen syns rakt igenom.</p>"
            "<p>Stolen är 45 cm bred och 56 cm djup, vilket är smalt för en "
            "skrivbordsstol. Den saknar armstöd och går därför ända in under "
            "en bordsskiva när du reser dig.</p>"
            "<p>Sitshöjden ställs mellan 44 och 54 cm med gaslyft, och foten "
            "är femarmad med hjul. Klädseln är teddytyg med kort, krusig "
            "lugg.</p>"
            "<p>Finns också i %s: %s.</p>"
            % (farg, syskon_farg, lank(syskon_slug,
                                       "samma stol i %s" % syskon_farg)),
        "eg": ["Hjärtformad rygg med utskuren mitt",
               "%s teddytyg med kort, krusig lugg" % stor,
               "Bara 45 cm bred, utan armstöd",
               "Sitthöjd 44–54 cm med gaslyft",
               "Bär 120 kg"],
        "spec": [r % farg if "%s" in r else r for r in H_SPEC],
        "villkor": MAXLAST,
        "skotsel": [
            "Dammsug teddytyget med möbelmunstycke. Luggen är kort och krusig "
            "och släpper damm lätt, men den binder hår — en klädrulle tar "
            "resten.",
            "Ljusa kulörer visar avfärgning från mörka jeans. Torka av sitsen "
            "med en fuktig trasa när det händer, i stället för att gnugga "
            "torrt, som drar in färgen i luggen.",
            "Hjulen samlar hår i navet. Vänd stolen upp och ned ett par gånger "
            "om året och dra ut det som fastnat.",
        ],
        "faq": H_FAQ,
    }


H1 = h_produkt("df0d351f", 959, "skrivbordsstol-vit-hjartrygg", "vit",
               "skrivbordsstol-rosa-hjartrygg", "rosa")
H2 = h_produkt("cc0ec7ba", 1099, "skrivbordsstol-rosa-hjartrygg", "rosa",
               "skrivbordsstol-vit-hjartrygg", "vit")

PRODUKTER = [G1, G2, G3, G4, G5, H1, H2]

if __name__ == "__main__":
    import re
    for p in PRODUKTER:
        synlig = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", bygg(p))).strip()
        print("%-9s %-30s %5d kr  namn %3d  titel %2d  meta %3d  text %4d"
              % (p["kort"], p["slug"], p["pris"], len(p["name"]),
                 len(p["title"]), len(p["meta"]), len(synlig)))
