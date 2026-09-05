# -*- coding: utf-8 -*-
"""Runda 68 — åtta fåtöljer i fyra syskonpar. Texten skrivs HÄR, inte inline.

☠️ Batch 64 mätte skillnaden: fem produkter skrivna inline gav NIO fel som nådde
Wix, tre skrivna via fil gav noll. En sträng i ett JSON-anrop kan ingen grind
läsa innan den lämnar chatten, och API-svaret ekar tillbaka exakt det man skrev.

☠️ RUNDANS STÖRSTA FYND: familj F LUTAR INTE. Källan ger den ingen ryggvinkel
alls — den är en loungefåtölj med lös, lutad fotpall och en 360° stålbas. De
tre andra familjerna i rundan ÄR reclinerfåtöljer, och det är precis därför
felet vore lätt att göra. Texten kallar den `loungefåtölj`, aldrig recliner,
och grinden fäller om ett gradtal dyker upp på den.

Fyra färgnamn är omskrivna mot fotot (alla mätta i `farg.py`, se LAGE.md):

  · 8ca7b3c3 "Cremeweiß" → ljusgrå   (209,208,206 — R=G=B, alltså neutral)
  · 9a2f6417 "Dunkelgrau" → grå      (L 59 % på MATT tyg, alltså mellangrå)
  · dfb7fcbe "Beige" → ljusbeige     (L 90 %, en blek varm neutral)
  · ed930c42 "Braun" → gråbrun       (H 20 vid S 4 % — en mörk taupe, ingen brun)

Fem saker är MEDVETET utelämnade:

  1. "Bomull" om F:s rygg. Källan skriver `Baumwollrückenlehne` men dess EGEN
     materialrad säger `Chenille (100% Polyester), Stahl, Schaumstoff`.
  2. "Bomull" och "linne" om G. Källan skriver `Baumwoll-Leinen-Gewebe` och
     sedan `(60% Polyurethan, 40% Polyester)` — alltså helsyntet.
  3. Skillnaden `Kunstleder` / `PVC` mellan I:s två syskon. Samma konstruktion,
     samma mått, samma brödtext; PVC-belagd väv ÄR konstläder. Båda skrivs
     `konstläder`. (Vikt och paketmått skiljer sig och skrivs per produkt —
     runda 59:s regel: de talen BEVISAR inte två produkter.)
  4. 360° om G och H. Källan anger det bara för F och I.
  5. Fjäderkärna om F, H och I. Bara G har den (`Taschenfederkern` + S-fjäder).
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
CHENILLE = (
    "Tyget är chenille i 100 % polyester — en väv med korta, mjuka luggtrådar "
    "som ger ytan djup i färgen och en varm känsla mot huden. Det är en "
    "syntetlugg, alltså tåligare mot nötning än ett naturmaterial, och den "
    "andas bättre än en slät konstläderyta."
)
LINNELOOK = (
    "Tyget är linnelook: en väv med linnets matta, lite oregelbundna yta, men "
    "helt syntetisk (60 % polyuretan och 40 % polyester). Den skrynklar inte "
    "som äkta linne och tål nötning bättre, och den torkas av i stället för att "
    "behöva tvättas."
)
FJADERKARNA = (
    "Sitsen har fjäderkärna, alltså enskilda spiralfjädrar i fickor under "
    "skummet, plus S-formade fjädrar tvärs över ramen. Tillsammans ger de ett "
    "fjädrande motstånd som håller formen längre än ett rent skumblock."
)
SKOTSEL_KONSTLADER = (
    "Torka av med en väl urvriden trasa och lite milt diskmedel, och torrtorka "
    "efteråt. Använd inga lösningsmedel, sprit eller slipande medel — de "
    "torkar ut ytskiktet så att det spricker. Håll fåtöljen minst en halvmeter "
    "från element och kaminer."
)
SKOTSEL_TYG = (
    "Dammsug klädseln med möbelmunstycke och ta fläckar med en väl urvriden "
    "trasa och lite milt diskmedel. Gnugga inte — luggen lägger sig då åt fel "
    "håll och ytan blir blank. Låt tyget torka av sig självt, utan värme."
)
MONTERING_SKRUV = (
    "Fåtöljen kommer i delar och skruvas ihop hemma. Foten monteras först och "
    "sitsen sätts ovanpå; dra åt alla skruvar innan du sätter dig första "
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


# ============================================================== familj F ===
# ☠️ LUTAR INTE. Loungefåtölj med lös, lutad fotpall och 360° stålbas. 120 kg.
F_SLUG = {"8ca7b3c3": "loungefatolj-ljusgra-med-fotpall",
          "79797c9a": "loungefatolj-bla-med-fotpall"}
F_FARG = {"8ca7b3c3": "ljusgrå", "79797c9a": "blå"}


def f_spec(k):
    return [
        "Mått fåtölj (B × D × H): 78 × 93 × 100 cm",
        "Fotpall (B × D × H): 50 × 44 × 41–45 cm",
        "Sits (B × D × H): 41 × 53 × 48 cm",
        "Ryggstöd (B × H): 68 × 63 cm",
        "Stoppning: 13 cm i sitsen, 26 cm i ryggen",
        "Armstöd (L × B × H): 61 × 20 × 9 cm",
        "Maxlast: 120 kg",
        "Klädsel: chenille, 100 % polyester",
        "Stomme: stål med halkfria tassar",
        "Färg: %s klädsel på svart stålfot" % F_FARG[k],
        "Vikt: 23,5 kg",
        "Paketmått: 80 × 66 × 57 cm",
        "Montering: krävs",
    ]


def f_produkt(kort, pris, syskon, hS, hF):
    f = F_FARG[kort]
    return {
        "kort": kort, "pris": pris, "slug": F_SLUG[kort],
        "name": "Loungefåtölj med fotpall i chenille, 360° snurrfot – %s" % f,
        "title": "Loungefåtölj med fotpall i chenille, %s | Fyndplats" % f,
        "meta": ("Loungefåtölj i %s chenille med 78 cm bred sits och lös, lutad "
                 "fotpall som går att höja från 41 till 45 cm. Snurrar 360°. "
                 "Bär 120 kg." % f),
        "sokord": "loungefåtölj chenille",
        "ingress": (
            "<p>En bred loungefåtölj i %s chenille på en svart stålfot, med en "
            "lös fotpall som lutar in mot stolen. Fåtöljen är 78 cm bred, så "
            "det finns plats att dra upp benen och sitta i skräddarställning, "
            "och foten snurrar 360° så att du kan vända dig mot rummet utan "
            "att resa dig.</p>" % f),
        "eg": [
            "78 cm bred fåtölj med gott om plats att dra upp benen",
            "Lös fotpall som lutar in mot stolen",
            "Fotpallens höjd går att ställa mellan 41 och 45 cm",
            "Snurrar 360° på stålfoten",
            "26 cm stoppning i ryggen och 13 cm i sitsen",
            "Svängd rygg och breda, inbyggda armstöd",
            "Halkfria tassar under foten skyddar golvet",
            "Bär 120 kg",
            "Levereras omonterad",
        ],
        "spec": f_spec(kort),
        "villkor": ("Ryggen är fast — det är fotpallen som ställs", [
            "Den här fåtöljen har ingen fällbar rygg. Ryggen står i ett läge, "
            "och vilan kommer i stället från den lösa fotpallen: den lutar in "
            "mot stolen och går att ställa mellan 41 och 45 cm i höjd, så du "
            "kan lägga benen i den vinkel som känns bäst. Vill du ha en rygg "
            "som går att fälla, se frågan längst ner.",
        ]),
        "skotsel": [CHENILLE, SKOTSEL_TYG, MONTERING_SKRUV],
        "faq": [
            ("Går ryggen att fälla bakåt?",
             "Nej. Ryggen är fast, och det är fotpallen som ställs — mellan "
             "41 och 45 cm i höjd."),
            ("Hur bred är sittytan?",
             "Fåtöljen är 78 cm bred på utsidan och sitsen 41 cm mellan "
             "armstöden, med 53 cm djup. Armstöden är inbyggda i sidorna."),
            ("Snurrar den hela varvet?",
             "Ja, stålfoten går 360° runt. Fotpallen har en egen fot och står "
             "kvar där du satt den."),
            ("Hur mycket bär den?",
             "120 kg. Stommen är stål och foten har halkfria tassar."),
            ("Finns den i fler färger?",
             "Ja, samma modell finns i %s." % syskon),
            ("Finns det en modell med fällbar rygg?",
             "Ja, %s fäller ryggen till 135°, gungar och har en lös fotpall."
             % lank(hS, "%s gungfåtölj" % hF)),
        ],
    }


# ============================================================== familj G ===
# Reclinerfåtölj 160°, INBYGGT fotstöd (ingen lös pall), fjäderkärna, 150 kg.
G_SLUG = {"9a2f6417": "lasfatolj-gra-160-grader",
          "dfb7fcbe": "lasfatolj-ljusbeige-160-grader"}
G_FARG = {"9a2f6417": "grå", "dfb7fcbe": "ljusbeige"}


def g_spec(k):
    return [
        "Mått upprätt (B × D × H): 80 × 94 × 101 cm",
        "Mått tillbakalutad (B × D × H): 80 × 167 × 74 cm",
        "Sits (B × D): 48 × 55 cm",
        "Sitthöjd: 48 cm",
        "Ryggstöd (B × H): 67 × 63 cm",
        "Stoppning: 12 cm i sitsen, 24 cm i ryggen",
        "Ryggvinkel: upp till 160°, låses med spänne",
        "Maxlast: 150 kg",
        "Passar kroppslängd: upp till 185 cm",
        "Klädsel: linnelook, 60 % polyuretan och 40 % polyester",
        "Stomme: metall, sits med fjäderkärna och S-fjädrar",
        "Färg: %s" % G_FARG[k],
        "Vikt: 43 kg",
        "Paketmått: 76 × 57 × 51 cm",
        "Montering: cirka 15 minuter, inga verktyg behövs",
    ]


def g_produkt(kort, pris, syskon, hS, hF):
    f = G_FARG[kort]
    return {
        "kort": kort, "pris": pris, "slug": G_SLUG[kort],
        "name": "Läsfåtölj med inbyggt fotstöd, ryggen fälls till 160° – %s" % f,
        "title": "Läsfåtölj 160° med inbyggt fotstöd, %s | Fyndplats" % f,
        "meta": ("Läsfåtölj i %s linnelook med hög rygg som fälls till 160° och "
                 "fotstöd inbyggt i stommen. Fjäderkärna i sitsen. Bär 150 kg." % f),
        "sokord": "läsfåtölj fotstöd",
        "ingress": (
            "<p>En läsfåtölj i %s linnelook med hög rygg och utsvängda sidor "
            "som sluter om huvudet. Ryggen fälls bakåt ända till 160° med ett "
            "spänne på sidan, och fotstödet sitter i stommen — du fäller ut "
            "det med hälarna, utan lös pall att flytta undan.</p>" % f),
        "eg": [
            "Ryggen fälls bakåt till 160° och låses med ett spänne på sidan",
            "Fotstödet sitter i stommen och fälls ut med hälarna",
            "Fjäderkärna och S-fjädrar under sittdynan",
            "24 cm stoppning i ryggen och 12 cm i sitsen",
            "Hög rygg med utsvängda sidor",
            "Bär 150 kg och passar kroppslängd upp till 185 cm",
            "Klar på cirka 15 minuter, inga verktyg behövs",
        ],
        "spec": g_spec(kort),
        "villkor": ("Så mycket plats den tar", [
            "Upprätt är fåtöljen 94 cm djup. Med ryggen nere och fotstödet ute "
            "mäter den 167 cm från fotstödets spets till ryggens överkant, "
            "alltså 73 cm mer än när den står rak, och höjden sjunker från "
            "101 cm till 74 cm. Räkna med det utrymmet framför och bakom när du "
            "väljer plats.",
        ]),
        "skotsel": [LINNELOOK, FJADERKARNA, SKOTSEL_TYG,
                    "Fåtöljen kommer i delar som klickar och skruvas ihop för "
                    "hand på cirka en kvart. Inga verktyg behövs."],
        "faq": [
            ("Ingår det en fotpall?",
             "Nej, och den behövs inte: fotstödet sitter i stommen och fälls ut "
             "när du trycker med hälarna."),
            ("Hur långt går ryggen ner?",
             "Till 160°, alltså nästan plant. Läget låses med ett spänne på "
             "sidan, så du kan stanna var du vill på vägen."),
            ("Är tyget linne?",
             "Nej, det är linnelook i 60 % polyuretan och 40 % polyester. Ytan "
             "är matt och lite oregelbunden som linne, men den skrynklar inte."),
            ("Vad väger den?",
             "43 kg. Det är tyngre än det ser ut, och den bärs lättast av två "
             "personer."),
            ("Behöver jag verktyg?",
             "Nej. Delarna sätts ihop för hand på cirka 15 minuter."),
            ("Finns den i fler färger?",
             "Ja, samma modell finns i %s." % syskon),
            ("Finns det en med lös fotpall?",
             "Ja, %s har en fristående fotpall och gungar dessutom."
             % lank(hS, "%s gungfåtölj" % hF)),
        ],
    }


# ============================================================== familj H ===
# Reclinerfåtölj 135° + lös fotpall, GUNGAR, konstläder, träram, 50 cm vägg.
H_SLUG = {"fbba0de8": "gungfatolj-graddvit-med-fotpall",
          "99e2d675": "gungfatolj-svart-med-fotpall"}
H_FARG = {"fbba0de8": "gräddvit", "99e2d675": "svart"}


def h_spec(k):
    return [
        "Mått upprätt (B × D × H): 71 × 84 × 102 cm",
        "Mått tillbakalutad (B × D × H): 75 × 111 × 85 cm",
        "Fotpall (B × D × H): 48 × 40 × 41 cm",
        "Sits (B × D × H): 55 × 50 × 48 cm",
        "Sitsens tjocklek: 13 cm",
        "Ryggstöd (B × D × H): 81 × 61 × 17 cm",
        "Armstöd (B × D × H): 49 × 15 × 18 cm",
        "Ryggvinkel: upp till 135°",
        "Minsta avstånd till vägg: 50 cm",
        "Maxlast: 150 kg",
        "Klädsel: konstläder",
        "Stomme: trä och skum, halkfria fötter",
        "Färg: %s klädsel på ljusbrun träfot" % H_FARG[k],
        "Vikt: 22 kg",
        "Paketmått: 88 × 60 × 43 cm",
        "Montering: krävs",
    ]


def h_produkt(kort, pris, syskon, korsS, korsT, korsRad):
    f = H_FARG[kort]
    return {
        "kort": kort, "pris": pris, "slug": H_SLUG[kort],
        "name": "Gungfåtölj med fotpall i konstläder, 135° – %s" % f,
        "title": "Gungfåtölj med fotpall, 135°, %s | Fyndplats" % f,
        "meta": ("Gungfåtölj i %s konstläder med lös fotpall och hög rygg. "
                 "Ryggen fälls till 135° och stolen gungar mjukt. Bär 150 kg. "
                 "Behöver 50 cm bakom sig." % f),
        "sokord": "gungfåtölj fotpall",
        "ingress": (
            "<p>En gungfåtölj i %s konstläder på en ljusbrun träfot, med lös "
            "fotpall. Ryggen fälls bakåt till 135° och stolen gungar mjukt "
            "fram och tillbaka — de två går att använda var för sig. Ryggen är "
            "hög och armstöden breda, med 13 cm tjock sits under.</p>" % f),
        "eg": [
            "Ryggen fälls bakåt till 135°",
            "Gungar mjukt fram och tillbaka",
            "Lös fotpall, 48 × 40 cm och 41 cm hög",
            "Hög rygg och breda armstöd med tjock stoppning",
            "55 cm bred sits, 13 cm tjock",
            "Ram i trä med halkfria fötter",
            "Bär 150 kg",
            "Levereras omonterad",
        ],
        "spec": h_spec(kort),
        "villkor": ("Ställ den 50 cm från väggen", [
            "Fåtöljen fäller ryggen bakåt utan skenor i golvet, så den behöver "
            "utrymme rakt bakom sig. Upprätt är den 84 cm djup; helt "
            "tillbakalutad mäter den 111 cm och blir samtidigt 4 cm bredare, "
            "från 71 till 75 cm. Räkna med 50 cm mellan ryggens överkant och "
            "väggen, så går ryggen hela vägen ner utan att ta i.",
        ]),
        "skotsel": [KONSTLADER, SKOTSEL_KONSTLADER, MONTERING_SKRUV],
        "faq": [
            ("Är klädseln äkta läder?",
             "Nej, det är konstläder — en plastbelagd väv som torkas av med en "
             "fuktad trasa."),
            ("Hur mycket plats behöver den bakom sig?",
             "Minst 50 cm. Fåtöljen är 84 cm djup upprätt och 111 cm när "
             "ryggen ligger helt ner."),
            ("Gungar den även med ryggen nerfälld?",
             "Gungfunktionen och ryggfällningen är två saker som fungerar var "
             "för sig — du behöver inte välja, men du styr dem separat."),
            ("Sitter fotpallen ihop med fåtöljen?",
             "Nej, den är fristående. Den mäter 48 × 40 cm och är 41 cm hög."),
            ("Finns den i fler färger?",
             "Ja, samma modell finns i %s." % syskon),
            ("Finns det en som snurrar också?", korsRad % lank(korsS, korsT)),
        ],
    }


# ============================================================== familj I ===
# Reclinerfåtölj 130° + lös fotpall, 360°, konstläder, böjträ. ☠️ 80 cm vägg.
I_SLUG = {"07d52f21": "biofatolj-svart-med-fotpall",
          "ed930c42": "biofatolj-grabrun-med-fotpall"}
I_FARG = {"07d52f21": "svart", "ed930c42": "gråbrun"}
I_FOT = {"07d52f21": "ljusbrun", "ed930c42": "mörkbrun"}
I_VIKT = {"07d52f21": "26 kg", "ed930c42": "23,5 kg"}
I_PAKET = {"07d52f21": "84 × 64 × 48 cm", "ed930c42": "82,5 × 64 × 57 cm"}


def i_spec(k):
    return [
        "Mått upprätt (B × D × H): 76 × 85 × 104 cm",
        "Mått tillbakalutad (B × D × H): 76 × 117 × 89 cm",
        "Fotpall (B × D × H): 48 × 43 × 38 cm",
        "Sits (B × D × H): 56 × 53 × 45 cm",
        "Sitsens tjocklek: 13 cm",
        "Ryggstöd (B × D × H): 82 × 64 × 14 cm",
        "Armstöd (B × D × H): 52 × 13 × 11 cm",
        "Ryggvinkel: upp till 130°",
        "Minsta avstånd till vägg: 80 cm",
        "Maxlast: 150 kg",
        "Klädsel: konstläder",
        "Stomme: böjt trä och skum, skyddande fotplattor",
        "Färg: %s klädsel på %s fot i böjträ" % (I_FARG[k], I_FOT[k]),
        "Vikt: %s" % I_VIKT[k],
        "Paketmått: %s" % I_PAKET[k],
        "Montering: krävs",
    ]


def i_produkt(kort, pris, syskon, hS, hF):
    f = I_FARG[kort]
    return {
        "kort": kort, "pris": pris, "slug": I_SLUG[kort],
        "name": "Biofåtölj med fotpall i konstläder, 130° och 360° – %s" % f,
        "title": "Biofåtölj med fotpall, 130° och 360°, %s | Fyndplats" % f,
        "meta": ("Biofåtölj i %s konstläder med lös fotpall, 56 cm bred sits "
                 "och 360° snurrfot i böjträ. Ryggen fälls till 130°. Bär "
                 "150 kg. Behöver 80 cm bakom sig." % f),
        "sokord": "biofåtölj fotpall",
        "ingress": (
            "<p>En biofåtölj i %s konstläder på en %s fot i böjträ, med lös "
            "fotpall. Sitsen är 56 cm bred — rundans bredaste — ryggen fälls "
            "bakåt till 130° och hela stolen snurrar 360° på foten. Den behöver "
            "gott om plats bakom sig; hur mycket står längre ner.</p>"
            % (f, I_FOT[kort])),
        "eg": [
            "Ryggen fälls bakåt till 130°",
            "Snurrar 360° på foten",
            "56 cm bred sits, 13 cm tjock",
            "Lös fotpall, 48 × 43 cm och 38 cm hög",
            "Hög rygg och utsvängda armstöd med tjock stoppning",
            "Fot i böjträ med skyddande fotplattor",
            "Bär 150 kg",
            "Levereras omonterad",
        ],
        "spec": i_spec(kort),
        "villkor": ("Ställ den 80 cm från väggen", [
            "Den här fåtöljen behöver mer plats bakom sig än de flesta: 80 cm "
            "mellan ryggens överkant och väggen. Upprätt är den 85 cm djup och "
            "helt tillbakalutad 117 cm, och ryggen svänger ut ovanför det "
            "måttet när den går ner. Mät innan du bestämmer plats — en fåtölj "
            "som står för nära väggen går bara att fälla halvvägs.",
        ]),
        "skotsel": [KONSTLADER, SKOTSEL_KONSTLADER, MONTERING_SKRUV],
        "faq": [
            ("Är klädseln äkta läder?",
             "Nej, det är konstläder — en plastbelagd väv som torkas av med en "
             "fuktad trasa."),
            ("Hur mycket plats behöver den bakom sig?",
             "80 cm. Det är mer än de flesta fåtöljer kräver, och det beror på "
             "att ryggen svänger ut bakåt när den fälls."),
            ("Hur bred är sitsen?",
             "56 cm mellan armstöden, med 53 cm djup och 13 cm tjock stoppning."),
            ("Snurrar den hela varvet?",
             "Ja, foten går 360° runt. Fotpallen har en egen fot och står kvar "
             "där du satt den."),
            ("Finns den i fler färger?",
             "Ja, samma modell finns i %s." % syskon),
            ("Finns det en som behöver mindre plats bakom sig?",
             "Ja, %s klarar sig med 50 cm och gungar dessutom."
             % lank(hS, "%s gungfåtölj" % hF)),
        ],
    }


# ------------------------------------------------------------ produkter ---
PRODUKTER = [
    f_produkt("8ca7b3c3", 3229, lank(F_SLUG["79797c9a"], "blå"),
              H_SLUG["fbba0de8"], "gräddvit"),
    f_produkt("79797c9a", 3279, lank(F_SLUG["8ca7b3c3"], "ljusgrå"),
              H_SLUG["99e2d675"], "svart"),
    g_produkt("9a2f6417", 4139, lank(G_SLUG["dfb7fcbe"], "ljusbeige"),
              H_SLUG["99e2d675"], "svart"),
    g_produkt("dfb7fcbe", 3999, lank(G_SLUG["9a2f6417"], "grå"),
              H_SLUG["fbba0de8"], "gräddvit"),
    h_produkt("fbba0de8", 2449, lank(H_SLUG["99e2d675"], "svart"),
              I_SLUG["ed930c42"], "gråbrun biofåtölj",
              "Ja, %s fäller ryggen till 130° och snurrar 360°, men den "
              "behöver 80 cm bakom sig."),
    h_produkt("99e2d675", 2549, lank(H_SLUG["fbba0de8"], "gräddvit"),
              I_SLUG["07d52f21"], "svart biofåtölj",
              "Ja, %s fäller ryggen till 130° och snurrar 360°, men den "
              "behöver 80 cm bakom sig."),
    i_produkt("07d52f21", 3119, lank(I_SLUG["ed930c42"], "gråbrun"),
              H_SLUG["99e2d675"], "svart"),
    i_produkt("ed930c42", 3499, lank(I_SLUG["07d52f21"], "svart"),
              H_SLUG["fbba0de8"], "gräddvit"),
]


if __name__ == "__main__":
    import re
    import sys
    sys.path.insert(0, __file__.rsplit("/", 2)[0])
    from grindar import sku_bas
    for p in PRODUKTER:
        h = bygg(p)
        synlig = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h)).strip()
        sku = "FP-" + sku_bas(p["slug"])
        print("%s  namn %2d  titel %2d  meta %3d  sku %-27s html %4d  synlig %4d"
              % (p["kort"], len(p["name"]), len(p["title"]), len(p["meta"]),
                 sku, len(h), len(synlig)))
