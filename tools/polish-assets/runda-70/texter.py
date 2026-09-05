# -*- coding: utf-8 -*-
"""Runda 70 — åtta fåtöljer i fyra familjer. Texten skrivs HÄR, inte inline.

☠️ Batch 64 mätte skillnaden: fem produkter skrivna inline gav NIO fel som
nådde Wix, tre skrivna via fil gav noll. En sträng i ett JSON-anrop kan ingen
grind läsa innan den lämnar chatten, och API-svaret ekar tillbaka exakt det man
skrev — det ser rätt ut för att det ÄR det man skrev.

☠️ RUNDANS STÖRSTA FYND: familj J var en KVARTETT, inte ett par. `73112149`
och `5c0e83d1` har exakt runda 69:s J-mått (78 × 87 × 100, 21,5 kg, paket
79 × 64 × 52, 145°, 360°, 120 kg, Kunstleder + Holz) och ORDAGRANT identisk
tysk brödtext. Runda 69 tog två av fyra för att grupperingen gjordes på NAMN,
och namnen skiljer sig. `84e3794d` är på samma sätt familj L:s tredje syskon.
Måtten grupperar, namnet gör det inte.

☠️ Källan kallar BÅDE `73112149` och `021a268e` "Cremeweiß". De ligger fjorton
   luminanssteg isär (median L 77 % mot 91 %) och 34 steg isär i värme
   (R−B = 48 mot 14). Den ena är ett sandbeige konstläder, den andra ett
   brutet vitt. Hade ordet följt med hade två produkter i SAMMA runda burit
   samma färgord och sett tydligt olika ut. Mätt i `farg.py`, kontrollerat med
   ögon i `jamfor-farg.jpg`.

Färgnamnen mot fotot (alla mätta, se LAGE.md):

  · 73112149 "Cremeweiß"  → beige     (median 221/203/173, R−B 48 — varm sand)
  · 5c0e83d1 "Braun"      → brun      (median 132/99/89 — som runda 69:s brun)
  · 84e3794d "Schwarz"    → svart     (median 39 — mörkare än runda 69:s svart)
  · 021a268e "Cremeweiß"  → gräddvit  (median 240/238/226 — nästan neutral)
  · 266c5e75 "Grau"       → grå       (median 137, S 0 %)
  · d2409a95 "Dunkelgrau" → mörkgrå   (median 97 — 17 L-steg under syskonet)
  · 9bd6d1d4 "Grau"       → grå       (median 136/141/145)
  · 566c7702 "Schwarz"    → svart     (median 60, ljus 69 — vid runda 69:s 60)

☠️ FAMILJ P FÅR INGEN GRADTALSSIFFRA. Källan anger "Flexible Neigungs- und
   Drehfunktion" och INGEN vinkel, ingenstans — varken i brödtexten, i
   spec-listan eller i måttritningen. Samma spärr som runda 68:s familj F.
   Av samma skäl får P inte heller bära "360°": stolen snurrar, men talet
   finns inte i källan.

☠️ FAMILJ P:S TRE SYSKON SKILJER SIG PÅ TVÅ PUNKTER, och båda skrivs per
   produkt: klädseln (`021a268e` mikrofibertyg, de två andra sammetslook) och
   foten (`266c5e75` står på en BLANK förkromad fot, de andra på matt svart).
   Kortets gemensamma rubrik får därför handla om VARKEN klädsel eller fot —
   den handlar om den lösa fotpallen, som alla tre har. Samma lärdom som runda
   69:s familj K och runda 68:s familj I.

☠️ SAMMET SKRIVS ALDRIG NAKET. Källan säger två olika saker om samma tyg:
   spec-kolumnen "Samt(100% Polyester)" och brödtexten "Stoffbezug in
   Samtoptik" — alltså ETT tyg som ser ut som sammet. När källan motsäger sig
   själv gäller det svagare påståendet. Husets egen formulering finns sedan
   runda 64 (`FP-sammetsfatolj-fotpall-33`): "sammetslook (100 % polyester)".

Sex saker är MEDVETET utelämnade:

  1. "Air-Leder" (J:s spec-kolumn). Brödtexten säger `Kunstleder, Holz`.
     Ett handelsnamn säger kunden ingenting; båda betyder konstläder.
  2. Fjäderkärna om J, P och Q. Bara L har `Taschenfederkern`.
  3. Väggavstånd om J och P. Källan ger 80 cm bara för L och Q.
  4. 360° om P. Se spärren ovan.
  5. Lös fotpall om J, L och Q. Bara P har en i `Lieferumfang`; de tre andra
     har fotstödet INBYGGT och utfällbart ur stolen.
  6. Bredd- och djupaxeln på P. Källan säger "69L x 71B" upprätt och
     "69L x 93B" tillbakalutad — samma bokstav på två olika axlar, alltså en
     motsägelse. Måttritningen bevisar bara golvytan (71 × 69) och det
     tillbakalutade djupet (93). Golvytan skrivs därför UTAN axelbokstäver.
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
MIKROFIBER = (
    "Tyget är mikrofiber i 100 % polyester: en tätvävd yta av mycket tunna "
    "fibrer, slät under handen och tålig mot nötning. Den andas bättre än en "
    "plastbelagd yta och torkas av i stället för att behandlas med kräm."
)
SAMMETSLOOK = (
    "Klädseln är sammetslook i 100 % polyester — en väv med sammetens mjuka "
    "yta och lyster, men helt syntetisk. Den tål mer slitage än sammet av "
    "naturfiber, och den dammsugs i stället för att tvättas."
)
LINNELOOK = (
    "Tyget är linnelook: en väv med linnets matta, lite oregelbundna yta, men "
    "helt syntetisk i 100 % polyester. Den skrynklar inte som äkta linne och "
    "tål nötning bättre, och den torkas av i stället för att behöva tvättas."
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
    """'a, b och c' — syskonlistan växer när en familj blir komplett."""
    if len(delar) == 1:
        return delar[0]
    return ", ".join(delar[:-1]) + " och " + delar[-1]


# ============================================================== familj J ===
# Konstläderfåtölj, rygg till 145°, 360° vridbar TRÄFOT, inbyggt fotstöd.
# Ingen lös fotpall — Lieferumfang är bara stolen. 120 kg. Fyra färger; två
# publicerades i runda 69, de två här stänger kvartetten.
J_SLUG = {"73112149": "konstladerfatolj-beige-145-grader",
          "5c0e83d1": "konstladerfatolj-brun-145-grader"}
J_FARG = {"73112149": "beige", "5c0e83d1": "brun"}
J_PUBLICERAD = {"morkgra": "konstladerfatolj-morkgra-145-grader",
                "ljusgra": "konstladerfatolj-ljusgra-145-grader"}


def j_spec(k):
    return [
        "Mått upprätt (B × D × H): 78 × 87 × 100 cm",
        "Mått tillbakalutad (B × D × H): 78 × 151 × 89 cm",
        "Sits (B × D): 52 × 52 cm",
        "Sitthöjd: 45 cm",
        "Ryggstöd (B × H): 60 × 69 cm",
        "Ryggvinkel: upp till 145°",
        "Vridfot: 360°",
        "Maxlast: 120 kg",
        "Klädsel: konstläder",
        "Stomme: trä",
        "Färg: %s klädsel på träfot" % J_FARG[k],
        "Vikt: 21,5 kg",
        "Paketmått: 79 × 64 × 52 cm",
        "Montering: krävs",
    ]


def j_produkt(kort, pris, syskon, kS, kF):
    f = J_FARG[kort]
    return {
        "kort": kort, "pris": pris, "slug": J_SLUG[kort],
        "name": "Fåtölj i konstläder med 360° vridfot, rygg till 145° – %s" % f,
        "title": "Fåtölj i konstläder 145°, vridfot, %s | Fyndplats" % f,
        "meta": ("Fåtölj i %s konstläder på träfot. Ryggen fälls till 145° och "
                 "fotstödet fälls ut ur stolen. Snurrar 360°. Bär 120 kg." % f),
        "sokord": "fåtölj konstläder vridbar",
        "ingress": (
            "<p>En fåtölj i %s konstläder på en böjd träfot som snurrar hela "
            "varvet. Ryggen fälls bakåt till 145° och fotstödet fälls ut ur "
            "stolens framkant, så du går från upprätt sittande till nästan "
            "liggande utan att flytta på fåtöljen. Utfälld mäter den 151 cm i "
            "djup.</p>" % f),
        "eg": [
            "Ryggen fälls bakåt till 145°",
            "Fotstödet är inbyggt och fälls ut ur stolens framkant",
            "Foten snurrar 360°",
            "Böjd träfot och träklädda armstödsfronter",
            "52 cm bred sits på 45 cm höjd",
            "Hög rygg, 69 cm, med breda armstöd",
            "Bär 120 kg",
            "Levereras omonterad",
        ],
        "spec": j_spec(kort),
        "villkor": ("Fotstödet sitter i stolen — ingen lös pall ingår", [
            "Den här fåtöljen har fotstödet inbyggt: det ligger dolt i "
            "framkanten och fälls ut när du lutar ryggen bakåt. Det följer "
            "alltså ingen lös fotpall med i kartongen, och du behöver inte "
            "heller någon golvyta framför stolen när den står upprätt. "
            "Vill du ha en fåtölj med lös pall, se frågan längst ner.",
        ]),
        "skotsel": [KONSTLADER, SKOTSEL_KONSTLADER, MONTERING_SKRUV],
        "faq": [
            ("Hur långt bakåt går ryggen?",
             "Till 145°. Utfälld mäter fåtöljen 151 cm i djup och 89 cm i "
             "höjd, mot 87 respektive 100 cm när den står upprätt."),
            ("Ingår det en fotpall?",
             "Nej. Fotstödet är inbyggt och fälls ut ur stolens framkant när "
             "ryggen lutas bakåt."),
            ("Snurrar den hela varvet?",
             "Ja, träfoten går 360° runt."),
            ("Är klädseln skinn?",
             "Nej, det är konstläder — en plastbelagd väv. Den torkas av med "
             "en fuktad trasa."),
            ("Hur mycket bär den?",
             "120 kg. Stommen är trä och fåtöljen väger 21,5 kg."),
            ("Finns den i fler färger?",
             "Ja, samma modell finns i %s." % syskon),
            ("Finns det en modell med lös fotpall?",
             "Ja, %s har en fristående fotpall och fäller ryggen till 135°."
             % lank(kS, "%s TV-fåtölj" % kF)),
        ],
    }


# ============================================================== familj L ===
# Biofåtölj: rygg till 160°, INBYGGT utfällbart fotstöd, fickfjädrar, 120 kg,
# kroppslängd upp till 185 cm, 80 cm bakom stolen. 64 cm bred — den smala.
# Tredje färgen; gräddvit och grå publicerades i runda 69.
L_SLUG = {"84e3794d": "biofatolj-svart-160-grader"}
L_FARG = {"84e3794d": "svart"}
L_PUBLICERAD = {"graddvit": "biofatolj-graddvit-160-grader",
                "gra": "biofatolj-gra-160-grader"}


def l_spec(k):
    return [
        "Mått upprätt (B × D × H): 64 × 86 × 102 cm",
        "Mått tillbakalutad (B × D × H): 64 × 161 × 77 cm",
        "Sits (B × D × H): 50 × 49 × 42 cm",
        "Ryggstöd (B × H): 50 × 72 cm",
        "Stoppning: 15 cm i sitsen, 25 cm i ryggen",
        "Armstöd: 16 cm över sitsen",
        "Ryggvinkel: upp till 160°",
        "Maxlast: 120 kg",
        "Passar kroppslängd: upp till 185 cm",
        "Väggavstånd bakom stolen: 80 cm",
        "Sits: fjäderkärna med fickfjädrar",
        "Klädsel: linnelook, 100 % polyester",
        "Stomme: lamellträ och formskum",
        "Färg: %s" % L_FARG[k],
        "Vikt: 24 kg",
        "Paketmått: 52 × 73 × 52 cm",
        "Montering: krävs",
    ]


def l_produkt(kort, pris, syskon, nS, nF):
    f = L_FARG[kort]
    return {
        "kort": kort, "pris": pris, "slug": L_SLUG[kort],
        "name": "Biofåtölj 64 cm bred med fjäderkärna, rygg till 160° – %s" % f,
        "title": "Smal biofåtölj 64 cm, 160° rygg, %s | Fyndplats" % f,
        "meta": ("Smal biofåtölj i %s linnelook, 64 cm bred. Ryggen fälls till "
                 "160° med kroppsvikten och fotstödet fälls ut. Fjäderkärna i "
                 "sitsen. Bär 120 kg." % f),
        "sokord": "biofåtölj smal",
        "ingress": (
            "<p>En smal biofåtölj i %s linnelook som bara tar 64 cm i bredd, "
            "med fjäderkärna i sitsen och ett fotstöd som fälls ut ur "
            "framkanten. Ryggen lutas genom att du trycker bakåt med "
            "kroppsvikten, hela vägen till 160°. Räkna med 80 cm fritt bakom "
            "stolen när du ställer den.</p>" % f),
        "eg": [
            "Bara 64 cm bred — får plats där en vanlig fåtölj inte gör det",
            "Ryggen fälls till 160° med kroppsvikten",
            "Fotstödet är inbyggt och fälls ut ur framkanten",
            "Fjäderkärna med fickfjädrar i sitsen",
            "15 cm stoppning i sitsen och 25 cm i ryggen",
            "Armstöden ligger 16 cm över sitsen",
            "Passar kroppslängd upp till 185 cm",
            "Bär 120 kg",
            "Levereras omonterad",
        ],
        "spec": l_spec(kort),
        "villkor": ("Räkna med 80 cm fritt bakom stolen", [
            "Ryggen fälls bakåt, så fåtöljen behöver utrymme mot väggen: 80 cm "
            "fritt bakom stolen är vad som krävs för att kunna gå hela vägen "
            "till 160°. Utfälld mäter den 161 cm i djup mot 86 cm upprätt. "
            "Står den tätt mot väggen går ryggen bara en bit på väg.",
        ]),
        "skotsel": [LINNELOOK, FJADERKARNA, SKOTSEL_TYG, MONTERING_RYGG],
        "faq": [
            ("Hur långt bakåt går ryggen?",
             "Till 160°. Du trycker bakåt med kroppsvikten — det finns ingen "
             "spak. Utfälld är fåtöljen 161 cm djup och 77 cm hög."),
            ("Hur mycket plats behöver den?",
             "64 cm i bredd och 86 cm i djup upprätt, plus 80 cm fritt bakom "
             "stolen för att ryggen ska gå hela vägen ner."),
            ("Ingår det en fotpall?",
             "Nej. Fotstödet är inbyggt och fälls ut ur framkanten när du "
             "lutar ryggen bakåt."),
            ("Vad är fjäderkärna?",
             "Enskilda spiralfjädrar i fickor under skummet. De håller formen "
             "längre än ett rent skumblock och sviktar inte i mitten."),
            ("Hur lång får man vara?",
             "Upp till 185 cm. Maxlasten är 120 kg."),
            ("Finns den i fler färger?",
             "Ja, samma modell finns i %s." % syskon),
            ("Finns det en bredare modell som bär mer?",
             "Ja, %s är 67 cm bred, bär 150 kg och passar kroppslängd upp "
             "till 195 cm." % lank(nS, "%s vilfåtölj" % nF)),
        ],
    }


# ============================================================== familj P ===
# Fåtölj + LÖS fotpall, båda på rund stålfot Ø55 cm. Snurrar och lutas, men
# källan ger INGEN vinkel och INGET varvtal — se spärren i modulens docstring.
# 150 kg i stolen, 50 kg i pallen. Klädsel OCH fot skiljer syskonen åt.
P_SLUG = {"021a268e": "snurrfatolj-graddvit-stalfot",
          "266c5e75": "snurrfatolj-gra-stalfot",
          "d2409a95": "snurrfatolj-morkgra-stalfot"}
P_FARG = {"021a268e": "gräddvit", "266c5e75": "grå", "d2409a95": "mörkgrå"}
P_FOT = {"021a268e": "matt svart stålfot", "266c5e75": "blank förkromad stålfot",
         "d2409a95": "matt svart stålfot"}
P_KLADSEL = {"021a268e": "mikrofibertyg, 100 % polyester",
             "266c5e75": "sammetslook, 100 % polyester",
             "d2409a95": "sammetslook, 100 % polyester"}
P_TYG = {"021a268e": "mikrofibertyg", "266c5e75": "sammetslook",
         "d2409a95": "sammetslook"}
P_VIKT = {"021a268e": "22 kg", "266c5e75": "20 kg", "d2409a95": "20 kg"}


def p_spec(k):
    return [
        "Golvyta fåtölj: 71 × 69 cm",
        "Höjd fåtölj: 104 cm",
        "Djup tillbakalutad: 93 cm",
        "Höjd tillbakalutad: 97 cm",
        "Sits (B × D): 47 × 47 cm",
        "Sitthöjd: 45 cm",
        "Ryggstöd (B × H): 48 × 64 cm",
        "Armstöd (L × B × H): 30 × 12 × 15 cm",
        "Fotpall: 42 × 43 cm",
        "Fotpallens höjd: 35–40 cm",
        "Stålfotens diameter: 55 cm",
        "Maxlast fåtölj: 150 kg",
        "Maxlast fotpall: 50 kg",
        "Klädsel: %s" % P_KLADSEL[k],
        "Stomme: stål",
        "Färg: %s klädsel på %s" % (P_FARG[k], P_FOT[k]),
        "Vikt: %s" % P_VIKT[k],
        "Paketmått: 77 × 56 × 39 cm",
        "Ingår: fåtölj, fotpall och bruksanvisning",
        "Montering: krävs",
    ]


def p_produkt(kort, pris, syskon, qS, qF):
    f, fot = P_FARG[kort], P_FOT[kort]
    return {
        "kort": kort, "pris": pris, "slug": P_SLUG[kort],
        "name": "Fåtölj med lös fotpall på rund stålfot, bär 150 kg – %s" % f,
        "title": "Fåtölj med fotpall på stålfot, %s | Fyndplats" % f,
        "meta": ("Fåtölj och lös fotpall i %s %s, båda på rund stålfot. Sitsen "
                 "snurrar och ryggen fälls bakåt. Bär 150 kg." % (f, P_TYG[kort])),
        "sokord": "fåtölj med fotpall",
        "ingress": (
            "<p>En fåtölj i %s %s med en lös fotpall som du ställer där du "
            "vill ha den. Båda står på en rund stålfot av samma slag, och "
            "stolens sits vrids ovanpå sin fot. Stolen tar 71 × 69 cm i golvyta "
            "och är "
            "104 cm hög; med ryggen fälld bakåt blir den 93 cm djup och 97 cm "
            "hög.</p>" % (f, P_TYG[kort])),
        "eg": [
            "Lös fotpall, 42 × 43 cm och 35–40 cm hög",
            "Ryggen fälls bakåt och fotpallen flyttas fritt",
            "Sitsen snurrar på stålfoten",
            "Rund stålfot, 55 cm i diameter",
            "47 cm bred sits på 45 cm höjd",
            "Hög rygg, 64 cm, med stoppade armstöd",
            "Står på %s" % fot,
            "Bär 150 kg — fotpallen 50 kg",
            "Levereras omonterad",
        ],
        "spec": p_spec(kort),
        "villkor": ("Stolen snurrar — räkna med 93 cm när ryggen är fälld", [
            "Fåtöljen står stilla på sin runda fot men sitsen vrids ovanpå "
            "den, så stolen kan peka åt vilket håll du vill. Med ryggen fälld "
            "bakåt mäter den 93 cm från framkant till bakkant, alltså drygt två "
            "decimeter mer än golvytans 71 × 69 cm. Det utrymmet behövs runt "
            "om foten, inte bara åt "
            "ett håll — tänk på det innan du ställer den i ett hörn.",
        ]),
        "skotsel": [MIKROFIBER if kort == "021a268e" else SAMMETSLOOK,
                    SKOTSEL_TYG, MONTERING_SKRUV],
        "faq": [
            ("Hur mycket plats behöver den?",
             "71 × 69 cm i golvyta upprätt. Med ryggen fälld bakåt blir "
             "djupet 93 cm, och eftersom sitsen snurrar kan det djupet hamna "
             "åt vilket håll som helst."),
            ("Ingår fotpallen?",
             "Ja, den är lös och ingår i leveransen. Den mäter 42 × 43 cm och "
             "är 35–40 cm hög."),
            ("Snurrar fåtöljen?",
             "Ja, sitsen vrids ovanpå den runda stålfoten. Foten själv står "
             "stilla på golvet."),
            ("Hur mycket bär den?",
             "150 kg. Fotpallen är märkt för 50 kg och är gjord för fötter, "
             "inte för att sitta på. Fåtöljen väger %s." % P_VIKT[kort]),
            ("Vad är klädseln gjord av?",
             "%s Stommen och foten är stål."
             % ("Mikrofibertyg i 100 % polyester — en tätvävd, slät yta."
                if kort == "021a268e" else
                "Sammetslook i 100 % polyester, alltså en väv med sammetens "
                "yta men helt syntetisk.")),
            ("Finns den i fler färger?",
             "Ja, samma modell finns i %s." % syskon),
            ("Finns det en modell utan lös pall?",
             "Ja, %s har fotstödet inbyggt i stolen och en vridbar träfot."
             % lank(qS, "%s fåtölj på träfot" % qF)),
        ],
    }


# ============================================================== familj Q ===
# Fåtölj på 360° vridbar TRÄFOT i eukalyptus, rygg till 135° med steglöst lås,
# INBYGGT snabbfällt fotstöd, 140 kg, 80 cm bakom stolen. Böjda träarmstöd.
Q_SLUG = {"9bd6d1d4": "trafotsfatolj-gra-135-grader",
          "566c7702": "trafotsfatolj-svart-135-grader"}
Q_FARG = {"9bd6d1d4": "grå", "566c7702": "svart"}


def q_spec(k):
    return [
        "Mått upprätt (B × D × H): 68 × 86 × 100 cm",
        "Mått tillbakalutad (B × D × H): 68 × 146 × 88 cm",
        "Sits (B × D): 50 × 52 cm",
        "Sitthöjd: 44–47 cm",
        "Sitsens tjocklek: 10 cm",
        "Ryggstöd (B × H): 51 × 65 cm",
        "Ryggkuddens tjocklek: 8 cm",
        "Armstöd (L × B × H): 49 × 8 × 20 cm",
        "Ryggvinkel: upp till 135°",
        "Rygglås: steglöst",
        "Vridfot: 360°",
        "Maxlast: 140 kg",
        "Väggavstånd bakom stolen: 80 cm",
        "Klädsel: linnelook, 100 % polyester",
        "Stomme: eukalyptusträ, lamellskiva och formskum",
        "Färg: %s klädsel på träfot" % Q_FARG[k],
        "Vikt: 21 kg",
        "Paketmått: 83 × 65 × 57 cm",
        "Montering: krävs",
    ]


def q_produkt(kort, pris, syskon, pS, pF):
    f = Q_FARG[kort]
    return {
        "kort": kort, "pris": pris, "slug": Q_SLUG[kort],
        "name": "Fåtölj på 360° vridbar träfot med rygg till 135° – %s" % f,
        "title": "Fåtölj på vridbar träfot 135°, %s | Fyndplats" % f,
        "meta": ("Fåtölj i %s linnelook på vridbar träfot i eukalyptus. Ryggen "
                 "låses steglöst till 135° och fotstödet fälls ut ur stolen. "
                 "Bär 140 kg." % f),
        "sokord": "fåtölj vridbar träfot",
        "ingress": (
            "<p>En fåtölj i %s linnelook på en rund träfot i eukalyptus som "
            "snurrar hela varvet, med böjda träarmstöd i samma ton. Ryggen "
            "låses steglöst i vilket läge du vill, ända till 135°, och "
            "fotstödet fälls snabbt ut ur stolens framkant. Tillbakalutad "
            "mäter den 146 cm i djup.</p>" % f),
        "eg": [
            "Ryggen låses steglöst, upp till 135°",
            "Fotstödet är inbyggt och fälls ut ur framkanten",
            "Träfoten snurrar 360°",
            "Böjda armstöd i eukalyptusträ",
            "50 cm bred sits med 10 cm tjock stoppning",
            "8 cm tjock ryggkudde",
            "Fotkåpor under foten skyddar golvet",
            "Bär 140 kg",
            "Levereras omonterad",
        ],
        "spec": q_spec(kort),
        "villkor": ("Vridfoten står stilla — men ryggen behöver 80 cm bakåt", [
            "Foten snurrar 360° på plats, så du kan vända stolen mot rummet "
            "utan att flytta den. Ryggen behöver däremot utrymme: räkna med "
            "80 cm fritt bakom stolen för att den ska gå hela vägen till 135°. "
            "Tillbakalutad mäter fåtöljen 146 cm i djup mot 86 cm upprätt.",
        ]),
        "skotsel": [LINNELOOK, SKOTSEL_TYG, MONTERING_SKRUV],
        "faq": [
            ("Hur långt bakåt går ryggen?",
             "Till 135°, och den låses steglöst — du kan alltså stanna var du "
             "vill på vägen. Tillbakalutad är fåtöljen 146 cm djup och 88 cm "
             "hög, mot 86 respektive 100 cm upprätt."),
            ("Snurrar den hela varvet?",
             "Ja, träfoten går 360° runt."),
            ("Ingår det en fotpall?",
             "Nej. Fotstödet är inbyggt och fälls ut ur stolens framkant."),
            ("Vad är träet?",
             "Eukalyptus. Foten och de böjda armstöden är av samma trä, och "
             "stommen i övrigt är lamellskiva och formskum."),
            ("Hur mycket bär den?",
             "140 kg. Fåtöljen väger själv 21 kg."),
            ("Finns den i fler färger?",
             "Ja, samma modell finns i %s." % syskon),
            ("Finns det en modell med lös fotpall?",
             "Ja, %s har en fristående fotpall och står på en rund stålfot."
             % lank(pS, "%s fåtölj med fotpall" % pF)),
        ],
    }


PRODUKTER = [
    j_produkt("73112149", 3639,
              och([lank(J_SLUG["5c0e83d1"], "brun"),
                   lank(J_PUBLICERAD["ljusgra"], "ljusgrå"),
                   lank(J_PUBLICERAD["morkgra"], "mörkgrå")]),
              "tv-fatolj-ljusgra-med-fotpall", "ljusgrå"),
    j_produkt("5c0e83d1", 3359,
              och([lank(J_SLUG["73112149"], "beige"),
                   lank(J_PUBLICERAD["ljusgra"], "ljusgrå"),
                   lank(J_PUBLICERAD["morkgra"], "mörkgrå")]),
              "tv-fatolj-brun-med-fotpall", "brun"),
    l_produkt("84e3794d", 2129,
              och([lank(L_PUBLICERAD["graddvit"], "gräddvit"),
                   lank(L_PUBLICERAD["gra"], "grå")]),
              "vilfatolj-svart-155-grader", "svart"),
    p_produkt("021a268e", 2299,
              och([lank(P_SLUG["266c5e75"], "grå"),
                   lank(P_SLUG["d2409a95"], "mörkgrå")]),
              Q_SLUG["9bd6d1d4"], "grå"),
    p_produkt("266c5e75", 2199,
              och([lank(P_SLUG["021a268e"], "gräddvit"),
                   lank(P_SLUG["d2409a95"], "mörkgrå")]),
              Q_SLUG["9bd6d1d4"], "grå"),
    p_produkt("d2409a95", 2099,
              och([lank(P_SLUG["021a268e"], "gräddvit"),
                   lank(P_SLUG["266c5e75"], "grå")]),
              Q_SLUG["566c7702"], "svart"),
    q_produkt("9bd6d1d4", 3569, lank(Q_SLUG["566c7702"], "svart"),
              P_SLUG["266c5e75"], "grå"),
    q_produkt("566c7702", 3939, lank(Q_SLUG["9bd6d1d4"], "grå"),
              P_SLUG["d2409a95"], "mörkgrå"),
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
        print("%s  namn %2d  titel %2d  meta %3d  sku %-27s html %4d  synlig %4d"
              % (p["kort"], len(p["name"]), len(p["title"]), len(p["meta"]),
                 sku, len(h), len(synlig)))
