# -*- coding: utf-8 -*-
"""Runda 71 — åtta fåtöljer: en kvartett och fyra enstaka modeller.

☠️ Batch 64 mätte skillnaden: fem produkter skrivna inline gav NIO fel som
nådde Wix, tre skrivna via fil gav noll. Texten skrivs därför HÄR.

☠️ RUNDANS STÖRSTA FYND — #289 ÄR LÖST AV MÄTNINGEN, INTE AV EN FRÅGA.
Lederoptik-kvartetten bar två olika maxlaster: tre säger 150 kg, en säger
120 kg. De fyra är BEVISAT samma konstruktion — brödtexten är ordagrant
identisk och varje mått är detsamma, ned till ryggstödets 15 mm tjocklek,
sitsens 12 cm, vikten 22 kg och paketets 82 × 68 × 40. En färg kan inte
ändra vad en stålram bär.

Tre skäl pekar åt samma håll, och alla tre är mätta:

  1. ENDA bilden i hela kvartetten som bär en lastsiffra i pixlarna är
     `79eaab59`:s måttritning, och den säger **120 kg**. De tre som påstår
     150 kg i texten har INGEN lastikon alls (`kolla-last.jpg`).
  2. Husets regel för en källa som motsäger sig själv: det SVAGARE påståendet
     gäller. Samma regel som runda 70:s sammet.
  3. Riktningen. Att skriva 120 på en stol som bär 150 kostar ett sålt
     exemplar. Att skriva 150 på en stol som bär 120 kan skada någon.

**Alla fyra skrivs 120 kg.**

☠️ RUNDANS METODFYND: på ett BLANKT material mäter medianen studioljuset, inte
färgen. `1a1d04f7` har en välvd helblank nackkudde som fyller mätrutan och
lyfter medianen till 30 % — mörkgrå-territorium. Mörkaste decilen säger 15 %,
mitt i det svarta bandet där tre publicerade svarta sidor ligger. Vecken mäter
materialet, den belysta ytan mäter lampan. Hela mätningen står i `farg.py`.

Färgnamnen mot fotot:

  · d760fffc "Beige"       → beige     (mörkast L 63 %, R−B 74 — varm sand)
  · 79eaab59 "Grau"        → grå       (mörkast L 32 %, S 5 %)
  · 4b2a7407 "Cremeweiß"   → gräddvit  (mörkast L 75 %, tio steg ljusare än beige)
  · 1a1d04f7 "Schwarz"     → svart     (mörkast L 15 % — se metodfyndet)
  · 99492092 "Cremeweiß"   → gräddvit  (mörkast L 72 %, nästan neutral)
  · 79690bf4 "Hellgrau"    → ljusgrå   (mörkast L 53 %, S 2 %)
  · 89273d39 "Dunkelgrau"  → mörkgrå   (mörkast L 24 %, matt väv)
  · 9c1889f1 "Cremeweiß+Dunkelrot" → gräddvit klädsel på MÖRKRÖD TRÄFOT
    (fotot visar att det andra ordet är underredet, inte klädseln)

Sju saker är MEDVETET utelämnade:

  1. "5-Minuten-Montage" (S). En marknadsföringsuppskattning, inte ett mått —
     samma skäl som runda 69:s "8 min". Att TVÅ personer rekommenderas är
     däremot ett verkligt villkor och står kvar.
  2. Märkesnamnet i T:s ingress. Källan säger ordagrant "Relaxsessel von ."
     — namnet är redan struket och lämnade en punkt efter sig.
  3. 360° om S, T, U och V. Källan ger vridfot bara för kvartetten.
  4. Fjäderkärna om alla utom S. Bara S har `Taschenfedern`.
  5. Lös fotpall om R, S och T. Bara U och V har en i `Lieferumfang`.
  6. Väggavstånd om S och T. Källan ger 80 cm för R och 50 cm för U och V.
  7. ☠️ "wasserdicht" om V:s konstläder. Källan påstår att ytan är VATTENTÄT.
     Det är ett starkare ord än vad ett PU-skikt på en möbel förtjänar, och
     ordet betyder för en svensk kund att stolen tål att bli blöt. Texten
     säger i stället att ytan tål spill och torkas av — vilket är vad
     påståendet faktiskt bär.
"""

BAS = "https://www.fyndplats.se/produkt/"


def lank(slug, text):
    return '<a href="%s%s">%s</a>' % (BAS, slug, text)


# --------------------------------------------------------- delade block ---
KONSTLADER = (
    "Klädseln är konstläder — en plastbelagd väv, inte skinn. Den torkas av med "
    "en fuktad trasa och tål spill bättre än ett tyg, men den andas inte på "
    "samma sätt och mår bäst av att stå undan direkt värme och starkt solljus."
)
LINNELOOK = (
    "Tyget är linnelook: en väv med linnets matta, lite oregelbundna yta, men "
    "helt syntetisk i 100 % polyester. Den skrynklar inte som äkta linne och "
    "tål nötning bättre, och den torkas av i stället för att behöva tvättas."
)
SAMMETSLOOK = (
    "Klädseln är sammetslook i 100 % polyester — en väv med sammetens mjuka "
    "yta och lyster, men helt syntetisk. Den tål mer slitage än sammet av "
    "naturfiber, och den dammsugs i stället för att tvättas."
)
FJADERKARNA = (
    "Sitsen har fjäderkärna, alltså enskilda spiralfjädrar i fickor under "
    "skummet. De ger ett fjädrande motstånd som håller formen längre än ett "
    "rent skumblock, och de fördelar tyngden i stället för att svikta i mitten."
)
SKOTSEL_KONSTLADER = (
    "Torka av med en väl urvriden trasa och lite milt diskmedel, och torrtorka "
    "efteråt. Använd inga lösningsmedel, sprit eller slipande medel — de "
    "torkar ut ytskiktet så att det spricker. Håll fåtöljen minst en halvmeter "
    "från element och kaminer."
)
SKOTSEL_TYG = (
    "Dammsug klädseln med möbelmunstycke och ta fläckar med en väl urvriden "
    "trasa och lite milt diskmedel. Gnugga inte — ytan blir då blank på fläcken. "
    "Låt tyget torka av sig självt, utan värme."
)
MONTERING_SKRUV = (
    "Fåtöljen kommer i delar och skruvas ihop hemma. Foten monteras först och "
    "sitsen sätts ovanpå; dra åt alla skruvar innan du sätter dig första "
    "gången, och efterdra dem efter någon månads användning."
)
MONTERING_RYGG = (
    "Fåtöljen kommer i delar och skruvas ihop hemma. Ryggen fästs i sitsen med "
    "de förmonterade beslagen; dra åt alla skruvar innan du sätter dig första "
    "gången, och efterdra dem efter någon månads användning."
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


def skotsel(stycken):
    return rubrikblock("Användning och skötsel", stycken)


def faq(rader):
    # ☠️ Wix STRIPPAR <br>. Fråga och svar måste vara TVÅ <p>.
    ut = ["<h2>Vanliga frågor</h2>"]
    for f, s in rader:
        ut.append("<p><strong>%s</strong></p><p>%s</p>" % (f, s))
    return "".join(ut)


def bygg(p):
    return "".join([p["ingress"], egenskaper(p["eg"]), spec(p["spec"]),
                    rubrikblock(p["villkor"][0], p["villkor"][1]),
                    skotsel(p["skotsel"]), faq(p["faq"])])


def och(delar):
    if len(delar) == 1:
        return delar[0]
    return ", ".join(delar[:-1]) + " och " + delar[-1]


# ============================================================== familj R ===
# Konstläderfåtölj på blankt galvaniserat runt underrede. Rygg till 130°,
# sitsen snurrar 360°, fotstödet är INBYGGT. ☠️ 120 kg på alla fyra — se
# modulens docstring.
# ☠️ Källan säger "78L x 80B" på tre av fyra och "78B x 80T" på den fjärde.
#    Samma bokstav på två olika axlar är ingen mätning. Golvytan skrivs därför
#    UTAN axelbokstäver, precis som runda 70:s familj P.
R_SLUG = {"d760fffc": "vridfatolj-beige-130-grader",
          "79eaab59": "vridfatolj-gra-130-grader",
          "4b2a7407": "vridfatolj-graddvit-130-grader",
          "1a1d04f7": "vridfatolj-svart-130-grader"}
R_FARG = {"d760fffc": "beige", "79eaab59": "grå",
          "4b2a7407": "gräddvit", "1a1d04f7": "svart"}
J_PUBLICERAD = {"beige": "konstladerfatolj-beige-145-grader",
                "ljusgra": "konstladerfatolj-ljusgra-145-grader",
                "morkgra": "konstladerfatolj-morkgra-145-grader"}


def r_spec(k):
    return [
        "Golvyta: 80 × 78 cm",
        "Höjd upprätt: 109 cm",
        "Djup tillbakalutad: 134 cm",
        "Höjd tillbakalutad: 100 cm",
        "Sits (B × D): 48 × 53 cm",
        "Sitthöjd: 45 cm",
        "Sitsens tjocklek: 12 cm",
        "Ryggstöd: 64 × 82 cm",
        "Ryggstödets tjocklek: 15 cm",
        "Ryggvinkel: upp till 130°",
        "Vridfot: 360°",
        "Maxlast: 120 kg",
        "Väggavstånd bakom stolen: 80 cm",
        "Klädsel: konstläder",
        "Stomme: stål och lamellskiva",
        "Färg: %s klädsel på blankt underrede" % R_FARG[k],
        "Vikt: 22 kg",
        "Paketmått: 82 × 68 × 40 cm",
        "Montering: krävs",
    ]


def r_produkt(kort, pris, syskon, jS, jF):
    f = R_FARG[kort]
    return {
        "kort": kort, "pris": pris, "slug": R_SLUG[kort],
        "name": "Fåtölj i konstläder med 360° vridfot, rygg till 130° – %s" % f,
        "title": "Fåtölj i konstläder 130°, vridfot, %s | Fyndplats" % f,
        "meta": ("Fåtölj i %s konstläder på blankt runt underrede. Ryggen fälls "
                 "till 130° och fotstödet fälls ut ur stolen. Snurrar 360°. "
                 "Bär 120 kg." % f),
        "sokord": "fåtölj konstläder vridbar",
        "ingress": (
            "<p>En fåtölj i %s konstläder på ett blankt runt underrede som "
            "sitsen snurrar hela varvet på. Ryggen fälls bakåt till 130° och "
            "fotstödet fälls ut ur framkanten, så du går från upprätt sittande "
            "till nästan liggande utan att flytta på stolen. Utfälld mäter den "
            "134 cm i djup.</p>" % f),
        "eg": [
            "Ryggen fälls bakåt till 130°",
            "Fotstödet är inbyggt och fälls ut ur framkanten",
            "Sitsen snurrar 360°",
            "Blankt galvaniserat underrede i ett stycke",
            "48 cm bred sits på 45 cm höjd, 12 cm tjock",
            "Hög rygg, 82 cm, med 15 cm stoppning",
            "Bär 120 kg",
            "Levereras omonterad",
        ],
        "spec": r_spec(kort),
        "villkor": ("Räkna med 80 cm fritt bakom stolen", [
            "Ryggen fälls bakåt, så fåtöljen behöver utrymme mot väggen: 80 cm "
            "fritt bakom stolen är vad som krävs för att den ska gå hela vägen "
            "till 130°. Utfälld mäter den 134 cm i djup, mot golvytans "
            "80 × 78 cm när den står upprätt. Sitsen snurrar dessutom, så "
            "utrymmet behövs runt om — inte bara åt ett håll.",
        ]),
        "skotsel": [KONSTLADER, SKOTSEL_KONSTLADER, MONTERING_SKRUV],
        "faq": [
            ("Hur långt bakåt går ryggen?",
             "Till 130°. Utfälld mäter fåtöljen 134 cm i djup och 100 cm i "
             "höjd, mot 109 cm när den står upprätt."),
            ("Ingår det en fotpall?",
             "Nej. Fotstödet är inbyggt och fälls ut ur stolens framkant när "
             "ryggen lutas bakåt."),
            ("Snurrar den hela varvet?",
             "Ja, sitsen går 360° runt på det blanka underredet."),
            ("Är klädseln skinn?",
             "Nej, det är konstläder — en plastbelagd väv. Den torkas av med "
             "en fuktad trasa."),
            ("Hur mycket bär den?",
             "120 kg. Stommen är stål och lamellskiva, och fåtöljen väger "
             "22 kg."),
            ("Finns den i fler färger?",
             "Ja, samma modell finns i %s." % syskon),
            ("Finns det en modell som fäller ryggen längre?",
             "Ja, %s går till 145° och står på en böjd träfot."
             % lank(jS, "%s fåtölj i konstläder" % jF)),
        ],
    }


# ============================================================== familj S ===
# 73 cm bred linnelooksfåtölj med FJÄDERKÄRNA, rygg till 145° med kroppsvikten,
# inbyggt fotstöd, 120 kg, kroppslängd upp till 185 cm.
S_SLUG = {"99492092": "fjaderfatolj-graddvit-145-grader"}
S_FARG = {"99492092": "gräddvit"}


def s_spec(k):
    return [
        "Mått upprätt (B × D × H): 73 × 86 × 100 cm",
        "Mått tillbakalutad (B × D × H): 73 × 158 × 74 cm",
        "Sits (B × D × H): 51 × 56 × 46 cm",
        "Ryggstöd: 52 × 60 cm",
        "Ryggstödets tjocklek: 25 cm",
        "Armstöd: 11 cm över sitsen",
        "Ryggvinkel: upp till 145°",
        "Maxlast: 120 kg",
        "Passar kroppslängd: upp till 185 cm",
        "Sits: fjäderkärna med fickfjädrar",
        "Klädsel: linnelook, 100 % polyester",
        "Stomme: stål och lamellträ",
        "Färg: %s" % S_FARG[k],
        "Vikt: 27,5 kg",
        "Paketmått: 77 × 73 × 55 cm",
        "Montering: krävs, två personer rekommenderas",
    ]


def s_produkt(kort, pris, tS, tF):
    f = S_FARG[kort]
    return {
        "kort": kort, "pris": pris, "slug": S_SLUG[kort],
        "name": "Fåtölj med fjäderkärna, rygg till 145°, 73 cm bred – %s" % f,
        "title": "Fåtölj med fjäderkärna 145°, %s | Fyndplats" % f,
        "meta": ("Fåtölj i %s linnelook med fjäderkärna i sitsen och 25 cm "
                 "tjock rygg. Ryggen fälls till 145° med kroppsvikten och "
                 "fotstödet följer med. Bär 120 kg." % f),
        "sokord": "fåtölj fjäderkärna",
        "ingress": (
            "<p>En fåtölj i %s linnelook med fjäderkärna under sitsen och ett "
            "25 cm tjockt ryggstöd. Du lutar dig bakåt med kroppsvikten och "
            "ryggen följer med till 145° samtidigt som fotstödet fälls ut; för "
            "att låsa det igen trycker du ned det med benen. Utfälld mäter "
            "fåtöljen 158 cm i djup.</p>" % f),
        "eg": [
            "Ryggen fälls till 145° med kroppsvikten",
            "Fotstödet är inbyggt och låses genom att tryckas ned med benen",
            "Fjäderkärna med fickfjädrar i sitsen",
            "25 cm tjockt ryggstöd",
            "51 cm bred sits på 46 cm höjd",
            "Armstöden ligger 11 cm över sitsen",
            "Passar kroppslängd upp till 185 cm",
            "Bär 120 kg",
            "Levereras omonterad",
        ],
        "spec": s_spec(kort),
        "villkor": ("Montera den till två", [
            "Fåtöljen är 27,5 kg och har ryggen som ett eget stycke. Att sätta "
            "ihop den ensam går, men ryggen ska hållas på plats medan beslagen "
            "dras — det är enklare och säkrare med en person till. Räkna med "
            "att lyfta kartongen till två oavsett: den mäter 77 × 73 × 55 cm.",
        ]),
        "skotsel": [LINNELOOK, FJADERKARNA, SKOTSEL_TYG, MONTERING_RYGG],
        "faq": [
            ("Hur långt bakåt går ryggen?",
             "Till 145°. Du lutar dig bakåt med kroppsvikten — det finns ingen "
             "spak. Utfälld är fåtöljen 158 cm djup och 74 cm hög."),
            ("Hur fäller jag in fotstödet igen?",
             "Du trycker ned det med benen tills det låser."),
            ("Vad är fjäderkärna?",
             "Enskilda spiralfjädrar i fickor under skummet. De håller formen "
             "längre än ett rent skumblock och sviktar inte i mitten."),
            ("Hur lång får man vara?",
             "Upp till 185 cm. Maxlasten är 120 kg."),
            ("Ingår det en fotpall?",
             "Nej. Fotstödet är inbyggt och fälls ut när du lutar ryggen."),
            ("Hur mycket plats behöver den?",
             "73 cm i bredd och 86 cm i djup upprätt. Tillbakalutad blir "
             "djupet 158 cm."),
            ("Finns det en smalare modell?",
             "Ja, %s är 69 cm bred i stället för 73 och fäller ryggen till "
             "135°." % lank(tS, "%s fåtölj" % tF)),
        ],
    }


# ============================================================== familj T ===
# Den smala: 69 cm bred, rygg till 135° genom tryck mot ryggen, inbyggt
# fotstöd som följer med upp. 120 kg. Inget väggavstånd angivet i källan.
T_SLUG = {"79690bf4": "smalfatolj-ljusgra-135-grader"}
T_FARG = {"79690bf4": "ljusgrå"}


def t_spec(k):
    return [
        "Mått upprätt (B × D × H): 69 × 88 × 101 cm",
        "Mått tillbakalutad (B × D × H): 69 × 156,5 × 74 cm",
        "Sits (B × D × H): 49 × 50 × 44 cm",
        "Armstöd (B × D): 9,5 × 74,5 cm",
        "Armstödets höjd över sitsen: 10,5 cm",
        "Ryggvinkel: upp till 135°",
        "Maxlast: 120 kg",
        "Klädsel: linnelook, 100 % polyester",
        "Stomme: stål",
        "Färg: %s" % T_FARG[k],
        "Vikt: 26 kg",
        "Paketmått: 76 × 69 × 52 cm",
        "Montering: krävs",
    ]


def t_produkt(kort, pris, sS, sF):
    f = T_FARG[kort]
    return {
        "kort": kort, "pris": pris, "slug": T_SLUG[kort],
        "name": "Smal fåtölj 69 cm med fotstöd, rygg till 135° – %s" % f,
        "title": "Smal fåtölj 69 cm, 135° rygg, %s | Fyndplats" % f,
        "meta": ("Smal fåtölj i %s linnelook, bara 69 cm bred. Ett tryck mot "
                 "ryggen fäller den till 135° och lyfter fotstödet. "
                 "Bär 120 kg." % f),
        "sokord": "fåtölj smal",
        "ingress": (
            "<p>En fåtölj i %s linnelook som bara tar 69 cm i bredd och därför "
            "får plats där en vanlig fåtölj inte gör det. Ett tryck mot ryggen "
            "fäller den till 135° och lyfter samtidigt fotstödet ur framkanten. "
            "Stommen är stål och armstöden är stoppade hela vägen, 74,5 cm "
            "långa.</p>" % f),
        "eg": [
            "Bara 69 cm bred",
            "Ryggen fälls till 135° med ett tryck mot ryggstödet",
            "Fotstödet är inbyggt och följer med upp",
            "Stoppade armstöd, 74,5 cm långa",
            "49 cm bred sits på 44 cm höjd",
            "Armstöden ligger 10,5 cm över sitsen",
            "Stålstomme",
            "Bär 120 kg",
            "Levereras omonterad",
        ],
        "spec": t_spec(kort),
        "villkor": ("Smal på bredden, lång när den fälls", [
            "Fåtöljen är byggd för att stå där bredden är knapp: 69 cm är "
            "smalare än de flesta. Djupet är däremot det vanliga, och "
            "tillbakalutad sträcker den ut sig till 156,5 cm — mot 88 cm "
            "upprätt. Mät framför stolen, inte bara bredvid den.",
        ]),
        "skotsel": [LINNELOOK, SKOTSEL_TYG, MONTERING_RYGG],
        "faq": [
            ("Hur långt bakåt går ryggen?",
             "Till 135°. Du trycker bakåt mot ryggstödet — det finns ingen "
             "spak. Utfälld är fåtöljen 156,5 cm djup och 74 cm hög."),
            ("Hur mycket plats behöver den?",
             "69 cm i bredd och 88 cm i djup upprätt. Tillbakalutad blir "
             "djupet 156,5 cm."),
            ("Ingår det en fotpall?",
             "Nej. Fotstödet är inbyggt och lyfts när ryggen fälls."),
            ("Hur mycket bär den?",
             "120 kg. Stommen är stål och fåtöljen väger 26 kg."),
            ("Går den att sitta upprätt i?",
             "Ja. Ryggen fälls bara när du trycker mot den, så den står "
             "upprätt tills du lutar dig bakåt."),
            ("Finns det en bredare modell med fjäderkärna?",
             "Ja, %s är 73 cm bred, har fjäderkärna i sitsen och fäller "
             "ryggen till 145°." % lank(sS, "%s fåtölj" % sF)),
        ],
    }


# ============================================================== familj U ===
# Sammetslook + LÖS fotpall, träram med metallben, rygg till 130° låsbar i
# valfritt läge, 150 kg. Väggavstånd 50 cm.
U_SLUG = {"89273d39": "sammetsfatolj-morkgra-med-fotpall"}
U_FARG = {"89273d39": "mörkgrå"}


def u_spec(k):
    return [
        "Golvyta: 85 × 78 cm",
        "Höjd upprätt: 106 cm",
        "Djup tillbakalutad: 114 cm",
        "Höjd tillbakalutad: 92,5 cm",
        "Sits (B × D): 53 × 50 cm",
        "Sitthöjd: 48 cm",
        "Sitsens tjocklek: 15 cm",
        "Ryggstöd: 80 × 59 cm",
        "Ryggstödets tjocklek: 16 cm",
        "Armstöd: 49 × 17 cm",
        "Armstödets höjd över sitsen: 16 cm",
        "Fotpall (L × B × H): 48 × 40 × 37 cm",
        "Ryggvinkel: upp till 130°",
        "Rygglås: valfritt läge",
        "Maxlast: 150 kg",
        "Väggavstånd bakom stolen: 50 cm",
        "Klädsel: sammetslook, 100 % polyester",
        "Stomme: trä med metallben",
        "Färg: %s" % U_FARG[k],
        "Vikt: 21 kg",
        "Paketmått: 82 × 64 × 52 cm",
        "Ingår: fåtölj, fotpall och bruksanvisning",
        "Montering: krävs",
    ]


def u_produkt(kort, pris, vS, vF):
    f = U_FARG[kort]
    return {
        "kort": kort, "pris": pris, "slug": U_SLUG[kort],
        "name": "Fåtölj med lös fotpall i sammetslook, rygg till 130° – %s" % f,
        "title": "Fåtölj med fotpall i sammetslook, %s | Fyndplats" % f,
        "meta": ("Fåtölj i %s sammetslook med lös fotpall. Ryggen fälls till "
                 "130° och låses i valfritt läge. Träram med metallben. "
                 "Bär 150 kg." % f),
        "sokord": "fåtölj med fotpall",
        "ingress": (
            "<p>En fåtölj i %s sammetslook med en lös fotpall som du ställer "
            "där du vill ha den. Ryggen fälls bakåt till 130° och låses i "
            "vilket läge du stannar i. Stommen är trä och stolen står på "
            "metallben med halkskydd. Sitsen är 53 cm bred med 15 cm "
            "stoppning.</p>" % f),
        "eg": [
            "Lös fotpall, 48 × 40 cm och 37 cm hög",
            "Ryggen fälls till 130° och låses i valfritt läge",
            "53 cm bred sits på 48 cm höjd, 15 cm tjock",
            "Högt ryggstöd, 80 cm, med 16 cm stoppning",
            "Armstöden ligger 16 cm över sitsen",
            "Träram med metallben och halkskydd",
            "Bär 150 kg",
            "Levereras omonterad",
        ],
        "spec": u_spec(kort),
        "villkor": ("Räkna med 50 cm fritt bakom stolen", [
            "Ryggen fälls bakåt och behöver utrymme: 50 cm fritt bakom stolen "
            "är vad som krävs för att den ska gå hela vägen till 130°. "
            "Tillbakalutad mäter fåtöljen 114 cm i djup, mot golvytans "
            "85 × 78 cm upprätt. Fotpallen står fritt och kan flyttas undan "
            "när den inte används.",
        ]),
        "skotsel": [SAMMETSLOOK, SKOTSEL_TYG, MONTERING_RYGG],
        "faq": [
            ("Hur långt bakåt går ryggen?",
             "Till 130°, och den låses i vilket läge du stannar i. "
             "Tillbakalutad är fåtöljen 114 cm djup och 92,5 cm hög."),
            ("Ingår fotpallen?",
             "Ja, den är lös och ingår i leveransen. Den mäter 48 × 40 cm och "
             "är 37 cm hög."),
            ("Är klädseln sammet?",
             "Nej, det är sammetslook i 100 % polyester — en väv med "
             "sammetens yta men helt syntetisk."),
            ("Hur mycket bär den?",
             "150 kg. Stommen är trä med metallben och fåtöljen väger 21 kg."),
            ("Hur mycket plats behöver den?",
             "85 × 78 cm i golvyta upprätt, plus 50 cm fritt bakom stolen."),
            ("Finns det en modell i konstläder som gungar?",
             "Ja, %s har konstläderklädsel, gungar mjukt och fäller ryggen "
             "till 135°." % lank(vS, "%s fåtölj" % vF)),
        ],
    }


# ============================================================== familj V ===
# Konstläder + LÖS fotpall på MÖRKRÖD TRÄFOT. Rygg till 135° med vred på
# sidan, och stolen GUNGAR. 150 kg. Väggavstånd 50 cm.
V_SLUG = {"9c1889f1": "gungfatolj-graddvit-135-grader"}
V_FARG = {"9c1889f1": "gräddvit"}


def v_spec(k):
    return [
        "Golvyta: 84 × 84 cm",
        "Höjd upprätt: 104 cm",
        "Djup tillbakalutad: 107 cm",
        "Höjd tillbakalutad: 95 cm",
        "Sits (B × D): 51 × 51 cm",
        "Sitthöjd: 44 cm",
        "Sitsens tjocklek: 15 cm",
        "Ryggstöd: 80 × 56 cm",
        "Ryggstödets tjocklek: 12 cm",
        "Armstöd: 48 × 15 cm",
        "Armstödets höjd över sitsen: 18 cm",
        "Fotpall (B × D × H): 42 × 47 × 39 cm",
        "Ryggvinkel: upp till 135°",
        "Rygglås: vred på sidan",
        "Maxlast: 150 kg",
        "Väggavstånd bakom stolen: 50 cm",
        "Klädsel: konstläder",
        "Stomme: trä",
        "Färg: %s klädsel på mörkröd träfot" % V_FARG[k],
        "Vikt: 22 kg",
        "Paketmått: 83 × 65 × 44 cm",
        "Ingår: fåtölj, fotpall och bruksanvisning",
        "Montering: krävs",
    ]


def v_produkt(kort, pris, uS, uF):
    f = V_FARG[kort]
    return {
        "kort": kort, "pris": pris, "slug": V_SLUG[kort],
        "name": "Gungande fåtölj med fotpall, rygg till 135° – %s" % f,
        "title": "Gungande fåtölj med fotpall, %s | Fyndplats" % f,
        "meta": ("Gungande fåtölj i %s konstläder med lös fotpall och mörkröd "
                 "träfot. Ryggen ställs med ett vred på sidan, upp till 135°. "
                 "Bär 150 kg." % f),
        "sokord": "gungande fåtölj",
        "ingress": (
            "<p>En fåtölj i %s konstläder som gungar mjukt fram och tillbaka, "
            "med en lös fotpall och ett underrede i mörkrött trä. Ryggen "
            "ställs med ett vred på sidan och går till 135°. Sitsen är 51 cm "
            "bred med 15 cm stoppning, och armstöden ligger 18 cm över "
            "den.</p>" % f),
        "eg": [
            "Gungar mjukt fram och tillbaka",
            "Lös fotpall, 42 × 47 cm och 39 cm hög",
            "Ryggen ställs med vred på sidan, upp till 135°",
            "Underrede i mörkrött trä med halkskydd",
            "51 cm bred sits på 44 cm höjd, 15 cm tjock",
            "Armstöden ligger 18 cm över sitsen",
            "Bär 150 kg",
            "Levereras omonterad",
        ],
        "spec": v_spec(kort),
        "villkor": ("Den gungar — räkna med 50 cm fritt bakom", [
            "Fåtöljen gungar mjukt fram och tillbaka, så den behöver plats "
            "bakåt även när ryggen står upprätt. Räkna med "
            "50 cm fritt bakom stolen; tillbakalutad mäter den 107 cm i djup "
            "mot golvytans 84 × 84 cm. Fotpallen gungar inte utan står stilla "
            "där du ställer den.",
        ]),
        "skotsel": [KONSTLADER, SKOTSEL_KONSTLADER, MONTERING_SKRUV],
        "faq": [
            ("Gungar den?",
             "Ja, stolen rör sig mjukt fram och tillbaka. Fotpallen står "
             "stilla."),
            ("Hur långt bakåt går ryggen?",
             "Till 135°, och vinkeln fixeras med ett vred på sidan. "
             "Tillbakalutad är fåtöljen 107 cm djup och 95 cm hög."),
            ("Ingår fotpallen?",
             "Ja, den är lös och ingår i leveransen. Den mäter 42 × 47 cm och "
             "är 39 cm hög."),
            ("Är klädseln skinn?",
             "Nej, det är konstläder. Ytan tål spill och torkas av med en "
             "fuktad trasa."),
            ("Hur mycket bär den?",
             "150 kg. Stommen är trä och fåtöljen väger 22 kg."),
            ("Vad är underredet gjort av?",
             "Trä i en mörkröd ton — fyra armar i kryss, med halkskydd "
             "under varje arm."),
            ("Finns det en modell i tyg med fotpall?",
             "Ja, %s har sammetslook och fäller ryggen till 130°."
             % lank(uS, "%s fåtölj med fotpall" % uF)),
        ],
    }


PRODUKTER = [
    r_produkt("d760fffc", 2359,
              och([lank(R_SLUG["79eaab59"], "grå"),
                   lank(R_SLUG["4b2a7407"], "gräddvit"),
                   lank(R_SLUG["1a1d04f7"], "svart")]),
              J_PUBLICERAD["beige"], "beige"),
    r_produkt("79eaab59", 3239,
              och([lank(R_SLUG["d760fffc"], "beige"),
                   lank(R_SLUG["4b2a7407"], "gräddvit"),
                   lank(R_SLUG["1a1d04f7"], "svart")]),
              J_PUBLICERAD["ljusgra"], "ljusgrå"),
    r_produkt("4b2a7407", 2899,
              och([lank(R_SLUG["d760fffc"], "beige"),
                   lank(R_SLUG["79eaab59"], "grå"),
                   lank(R_SLUG["1a1d04f7"], "svart")]),
              J_PUBLICERAD["beige"], "beige"),
    r_produkt("1a1d04f7", 2949,
              och([lank(R_SLUG["d760fffc"], "beige"),
                   lank(R_SLUG["79eaab59"], "grå"),
                   lank(R_SLUG["4b2a7407"], "gräddvit")]),
              J_PUBLICERAD["morkgra"], "mörkgrå"),
    s_produkt("99492092", 2859, T_SLUG["79690bf4"], "ljusgrå"),
    t_produkt("79690bf4", 2729, S_SLUG["99492092"], "gräddvit"),
    u_produkt("89273d39", 2999, V_SLUG["9c1889f1"], "gräddvit"),
    v_produkt("9c1889f1", 3039, U_SLUG["89273d39"], "mörkgrå"),
]


if __name__ == "__main__":
    import os
    import re
    import sys
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from grindar import sku_bas
    for p in PRODUKTER:
        h = bygg(p)
        synlig = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h)).strip()
        sku = "FP-" + sku_bas(p["slug"])
        print("%s  namn %2d  titel %2d  meta %3d  sku %-28s html %4d  synlig %4d"
              % (p["kort"], len(p["name"]), len(p["title"]), len(p["meta"]),
                 sku, len(h), len(synlig)))
