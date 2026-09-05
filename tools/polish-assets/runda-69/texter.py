# -*- coding: utf-8 -*-
"""Runda 69 — nio fåtöljer i tre syskonpar och en trio. Texten skrivs HÄR.

☠️ Batch 64 mätte skillnaden: fem produkter skrivna inline gav NIO fel som nådde
Wix, tre skrivna via fil gav noll. En sträng i ett JSON-anrop kan ingen grind
läsa innan den lämnar chatten, och API-svaret ekar tillbaka exakt det man skrev.

☠️ RUNDANS STÖRSTA FYND: källan kallar `37e5dfcf` "Schwarz", och den är MELLAN-
MÖRKGRÅ. Beviset är rundans egen andra "Schwarz": `a9c0fc05` har median 44 i
klädseln, `37e5dfcf` har 93 — mer än dubbelt så ljust, på samma mätning i samma
runda. Materialregeln räddar inte ordet heller: blankt konstläder speglar ljus,
men då är det TOPPARNA som ljusnar, inte medianen. Den skrivs `mörkgrå`.

Fyra färgnamn är omskrivna mot fotot (alla mätta i `farg.py`, se LAGE.md):

  · 37e5dfcf "Schwarz" → mörkgrå   (median 93 mot rundans äkta svarta 44)
  · dd5553fa "Grau"    → ljusgrå   (L 63 %, H 44 — en varm ljus neutral)
  · 4c1f5303 "Grau"    → ljusgrå   (L 73 %, S 1 % — ljust och neutralt)
  · a9c0fc05 "Schwarz" → svart     (median 44 på MATT tyg — den är svart)

Sju saker är MEDVETET utelämnade:

  1. "Air-Leder" (J:s spec-kolumn). Brödtexten säger `Kunstleder, Holz`. Båda
     betyder konstläder; ett handelsnamn säger kunden ingenting.
  2. Monteringstiden "8 min" (N). Det är en marknadsföringsuppskattning, inte
     ett mått, och en felaktig sådan blir ett kundklagomål.
  3. 360° om L och N. Källan anger vridfot bara för J och K.
  4. Väggavstånd om N. Källan ger 80 cm bara för L — N har ingen sådan uppgift.
  5. Fjäderkärna om J och K. Bara L och N har `Taschenfederkern`.
  6. Fotpall om J, L och N. Bara K har en lös pall i `Lieferumfang`; J, L och N
     har ett INBYGGT fotstöd som fälls ut ur stolen.
  7. ☠️ Leverantörens artikelnummer. `75e5fa26`:s tyska brödtext bär det
     ordagrant (`Referenz: …`) — det är exakt den läcka husreglerna förbjuder,
     och den försvinner först när hela beskrivningen skrivs om.

⚠️ K:s två syskon har OLIKA FOT — den bruna står på ett ljust träkryss, den
ljusgrå på en svart fot. Källan nämner det inte; kontaktarket visar det. Foten
skrivs därför per produkt, ur bilden.
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
    "Tyget är mikrofiber i 100 % polyester, vävt för att likna läder på håll. "
    "Ytan är matt och mjuk i stället för blank, den andas bättre än en slät "
    "konstläderyta, och den tål nötning väl eftersom fibern är syntetisk."
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


# ============================================================== familj J ===
# Konstläderfåtölj, rygg till 145°, 360° vridbar TRÄFOT, inbyggt fotstöd.
# Ingen lös fotpall — Lieferumfang är bara stolen. 120 kg.
J_SLUG = {"37e5dfcf": "konstladerfatolj-morkgra-145-grader",
          "dd5553fa": "konstladerfatolj-ljusgra-145-grader"}
J_FARG = {"37e5dfcf": "mörkgrå", "dd5553fa": "ljusgrå"}
J_VIKT = {"37e5dfcf": "21,5 kg", "dd5553fa": "21,5 kg"}


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
        "Vikt: %s" % J_VIKT[k],
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
            "liggande utan att flytta på fåtöljen. Utfälld är den 151 cm "
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
             "120 kg. Stommen är trä och fåtöljen väger %s." % J_VIKT[kort]),
            ("Finns den i fler färger?",
             "Ja, samma modell finns i %s." % syskon),
            ("Finns det en modell med lös fotpall?",
             "Ja, %s har en fristående fotpall och fäller ryggen till 135°."
             % lank(kS, "%s TV-fåtölj" % kF)),
        ],
    }


# ============================================================== familj K ===
# TV-fåtölj med LÖS fotpall, rygg till 135°, 360° vridbar. Mikrofiber i
# läderlook — INTE läder. ⚠️ Foten skiljer sig mellan syskonen (trä / svart).
K_SLUG = {"fd16efbc": "tv-fatolj-brun-med-fotpall",
          "4c1f5303": "tv-fatolj-ljusgra-med-fotpall"}
K_FARG = {"fd16efbc": "brun", "4c1f5303": "ljusgrå"}
K_FOT = {"fd16efbc": "ljus träfot", "4c1f5303": "svart fot"}
K_VIKT = {"fd16efbc": "24 kg", "4c1f5303": "24,4 kg"}
K_PAKET = {"fd16efbc": "84 × 64,5 × 45 cm", "4c1f5303": "86 × 68 × 46 cm"}


def k_spec(k):
    return [
        "Mått upprätt (B × D × H): 78 × 82,5 × 109 cm",
        "Mått tillbakalutad (B × D × H): 80 × 102 × 99,5 cm",
        "Sits (B × D × H): 52 × 52 × 45,5 cm",
        "Fotpall (B × D × H): 47 × 43 × 37 cm",
        "Ryggstödets höjd: 63,5 cm",
        "Stoppning: 11 cm",
        "Ryggvinkel: upp till 135°, ställs med vred",
        "Vridfot: 360°",
        "Maxlast: 120 kg",
        "Klädsel: mikrofiber, 100 % polyester",
        "Stomme: poppel och formskum",
        "Färg: %s klädsel på %s" % (K_FARG[k], K_FOT[k]),
        "Vikt: %s" % K_VIKT[k],
        "Paketmått: %s" % K_PAKET[k],
        "Ingår: fåtölj, fotpall och monteringsanvisning",
        "Montering: krävs",
    ]


def k_produkt(kort, pris, syskon, jS, jF):
    f = K_FARG[kort]
    return {
        "kort": kort, "pris": pris, "slug": K_SLUG[kort],
        "name": "TV-fåtölj med fotpall, 360° vridfot och rygg till 135° – %s" % f,
        "title": "TV-fåtölj med fotpall och vridfot, %s | Fyndplats" % f,
        "meta": ("TV-fåtölj i %s mikrofiber med lös fotpall. Ryggen ställs med "
                 "vred till 135° och foten snurrar 360°. Bär 120 kg." % f),
        "sokord": "tv-fåtölj med fotpall",
        "ingress": (
            "<p>En hög TV-fåtölj i %s mikrofiber med en lös fotpall som du "
            "ställer där du vill ha den. Ryggen ställs med ett vred på sidan "
            "och går till 135°, och foten snurrar 360° så att du kan vända dig "
            "mot rummet utan att resa dig. Stolen är 109 cm hög med 11 cm "
            "stoppning.</p>" % f),
        "eg": [
            "Lös fotpall, 47 × 43 cm och 37 cm hög",
            "Ryggen ställs med vred, upp till 135°",
            "Foten snurrar 360°",
            "109 cm hög med 63,5 cm högt ryggstöd",
            "11 cm stoppning i sits och rygg",
            "Mikrofiber med matt yta i läderlook",
            "Står på %s" % K_FOT[kort],
            "Bär 120 kg",
            "Levereras omonterad",
        ],
        "spec": k_spec(kort),
        "villkor": ("Klädseln liknar läder men är tyg", [
            "Ytan är vävd mikrofiber i läderlook. Det är "
            "alltså inte skinn och inte heller konstläder, utan ett tyg: det "
            "är matt i stället för blankt, det andas bättre, och det dammsugs "
            "och torkas av i stället för att behandlas med läderkräm.",
        ]),
        "skotsel": [MIKROFIBER, SKOTSEL_TYG, MONTERING_SKRUV],
        "faq": [
            ("Hur långt bakåt går ryggen?",
             "Till 135°, och den ställs med ett vred på sidan. Tillbakalutad "
             "är fåtöljen 102 cm djup mot 82,5 cm upprätt."),
            ("Ingår fotpallen?",
             "Ja, den är lös och ingår i leveransen. Den mäter 47 × 43 cm och "
             "är 37 cm hög."),
            ("Snurrar den hela varvet?",
             "Ja, foten går 360° runt. Fotpallen har en egen fot och står kvar "
             "där du satt den."),
            ("Är klädseln läder?",
             "Nej, det är mikrofibertyg vävt för att likna läder. Ytan är matt "
             "och mjuk, inte blank."),
            ("Hur mycket bär den?",
             "120 kg. Fåtöljen väger %s och stommen är poppel." % K_VIKT[kort]),
            ("Finns den i fler färger?",
             "Ja, samma modell finns i %s." % syskon),
            ("Finns det en modell utan lös pall?",
             "Ja, %s har fotstödet inbyggt i stolen och fäller ryggen till 145°."
             % lank(jS, "%s fåtölj i konstläder" % jF)),
        ],
    }


# ============================================================== familj L ===
# Biofåtölj: rygg till 160°, INBYGGT utfällbart fotstöd, fickfjädrar, 120 kg,
# kroppslängd upp till 185 cm, 80 cm bakom stolen. 64 cm bred — den smala.
L_SLUG = {"7702de01": "biofatolj-graddvit-160-grader",
          "e818cf7e": "biofatolj-gra-160-grader"}
L_FARG = {"7702de01": "gräddvit", "e818cf7e": "grå"}


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
        "Fritt bakom stolen: 80 cm",
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


# ============================================================== familj N ===
# Vilfåtölj: rygg till 155°, INBYGGT utfällbart fotstöd, fickfjädrar, 150 kg,
# kroppslängd upp till 195 cm. 67 cm bred — den bredare av de två linnelook-
# modellerna. Källan ger INGET väggavstånd för den här.
N_SLUG = {"afab8a41": "vilfatolj-beige-155-grader",
          "a9c0fc05": "vilfatolj-svart-155-grader",
          "75e5fa26": "vilfatolj-gra-155-grader"}
N_FARG = {"afab8a41": "beige", "a9c0fc05": "svart", "75e5fa26": "grå"}


def n_spec(k):
    return [
        "Mått upprätt (B × D × H): 67 × 87 × 98 cm",
        "Mått tillbakalutad (B × D × H): 65 × 158 × 76 cm",
        "Sits (B × D × H): 52 × 50 × 45 cm",
        "Ryggstöd (B × D): 64 × 52 cm",
        "Stoppning: 18 cm i sitsen, 21 cm i ryggen",
        "Armstöd: 14 cm över sitsen",
        "Ryggvinkel: upp till 155°",
        "Maxlast: 150 kg",
        "Passar kroppslängd: upp till 195 cm",
        "Sits: fjäderkärna med fickfjädrar",
        "Klädsel: linnelook, 100 % polyester",
        "Stomme: MDF och formskum",
        "Färg: %s" % N_FARG[k],
        "Vikt: 26 kg",
        "Paketmått: 76 × 67 × 55 cm",
        "Montering: krävs",
    ]


def n_produkt(kort, pris, syskon, lS, lF):
    f = N_FARG[kort]
    return {
        "kort": kort, "pris": pris, "slug": N_SLUG[kort],
        "name": "Vilfåtölj med fjäderkärna, rygg till 155°, bär 150 kg – %s" % f,
        "title": "Vilfåtölj 155°, fjäderkärna, 150 kg, %s | Fyndplats" % f,
        "meta": ("Vilfåtölj i %s linnelook med fjäderkärna i sitsen. Ryggen "
                 "fälls till 155° och fotstödet fälls ut. Bär 150 kg och "
                 "passar kroppslängd upp till 195 cm." % f),
        "sokord": "vilfåtölj fjäderkärna",
        "ingress": (
            "<p>En vilfåtölj i %s linnelook med 18 cm stoppning över en "
            "fjäderkärna, byggd för att bära 150 kg och passa kroppslängder "
            "upp till 195 cm. Ryggen lutas bakåt med kroppsvikten till 155° "
            "och fotstödet fälls ut ur framkanten — utfälld är hon 158 cm "
            "djup.</p>" % f),
        "eg": [
            "Ryggen fälls till 155° med kroppsvikten",
            "Fotstödet är inbyggt och fälls ut ur framkanten",
            "Fjäderkärna med fickfjädrar i sitsen",
            "18 cm stoppning i sitsen och 21 cm i ryggen",
            "52 cm bred sits på 45 cm höjd",
            "Armstöden ligger 14 cm över sitsen",
            "Bär 150 kg",
            "Passar kroppslängd upp till 195 cm",
            "Levereras omonterad",
        ],
        "spec": n_spec(kort),
        "villkor": ("Byggd för 150 kg och 195 cm", [
            "Den här modellen är den kraftigare av husets två fåtöljer i "
            "linnelook: 67 cm bred, 150 kg i maxlast och avsedd för "
            "kroppslängder upp till 195 cm. Sitsen är 52 cm bred och har 18 cm "
            "stoppning över fjäderkärnan. Är du kortare än så och har ont om "
            "plats finns en smalare modell — se frågan längst ner.",
        ]),
        "skotsel": [LINNELOOK, FJADERKARNA, SKOTSEL_TYG, MONTERING_RYGG],
        "faq": [
            ("Hur långt bakåt går ryggen?",
             "Till 155°. Du trycker bakåt med kroppsvikten — det finns ingen "
             "spak. Utfälld är fåtöljen 158 cm djup och 76 cm hög."),
            ("Hur mycket bär den?",
             "150 kg. Fåtöljen väger själv 26 kg och stommen är MDF."),
            ("Hur lång får man vara?",
             "Upp till 195 cm. Ryggstödet är 64 cm brett och sitsen 52 cm."),
            ("Ingår det en fotpall?",
             "Nej. Fotstödet är inbyggt och fälls ut ur framkanten när du "
             "lutar ryggen bakåt."),
            ("Vad är fjäderkärna?",
             "Enskilda spiralfjädrar i fickor under skummet. De håller formen "
             "längre än ett rent skumblock och sviktar inte i mitten."),
            ("Finns den i fler färger?",
             "Ja, samma modell finns i %s." % syskon),
            ("Finns det en smalare modell?",
             "Ja, %s är 64 cm bred i stället för 67 och fäller ryggen till "
             "160°, men bär 120 kg." % lank(lS, "%s biofåtölj" % lF)),
        ],
    }


PRODUKTER = [
    j_produkt("37e5dfcf", 3919, lank(J_SLUG["dd5553fa"], "ljusgrå"),
              K_SLUG["fd16efbc"], "brun"),
    j_produkt("dd5553fa", 3439, lank(J_SLUG["37e5dfcf"], "mörkgrå"),
              K_SLUG["4c1f5303"], "ljusgrå"),
    k_produkt("fd16efbc", 3399, lank(K_SLUG["4c1f5303"], "ljusgrå"),
              J_SLUG["37e5dfcf"], "mörkgrå"),
    k_produkt("4c1f5303", 3099, lank(K_SLUG["fd16efbc"], "brun"),
              J_SLUG["dd5553fa"], "ljusgrå"),
    l_produkt("7702de01", 2099, lank(L_SLUG["e818cf7e"], "grå"),
              N_SLUG["afab8a41"], "beige"),
    l_produkt("e818cf7e", 1999, lank(L_SLUG["7702de01"], "gräddvit"),
              N_SLUG["75e5fa26"], "grå"),
    n_produkt("afab8a41", 3099, lank(N_SLUG["a9c0fc05"], "svart") + " och "
              + lank(N_SLUG["75e5fa26"], "grå"),
              L_SLUG["7702de01"], "gräddvit"),
    n_produkt("a9c0fc05", 2939, lank(N_SLUG["afab8a41"], "beige") + " och "
              + lank(N_SLUG["75e5fa26"], "grå"),
              L_SLUG["e818cf7e"], "grå"),
    n_produkt("75e5fa26", 2859, lank(N_SLUG["afab8a41"], "beige") + " och "
              + lank(N_SLUG["a9c0fc05"], "svart"),
              L_SLUG["7702de01"], "gräddvit"),
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
