# -*- coding: utf-8 -*-
"""Runda 67 — åtta fåtöljer i fyra syskonpar. Texten skrivs HÄR, inte inline.

☠️ Batch 64 mätte skillnaden: fem produkter skrivna inline gav NIO fel som nådde
Wix, tre skrivna via fil gav noll. En sträng i ett JSON-anrop kan ingen grind
läsa innan den lämnar chatten, och API-svaret ekar tillbaka exakt det man skrev.

Alla siffror kommer ur källans Technische Daten eller ur måttritningen (bild 3).
Sex saker är MEDVETET utelämnade eller omtolkade — skälen står i LAGE.md:

  1. "Hellgrau" om ceae31c1 — fotot mäter L 43 % på ett MATT tyg, alltså en
     vanlig mellangrå. Skrivs `grå`, aldrig `ljusgrå`.
  2. "Cremeweiß" om 1b39b14e — samma chenille mäter L 73 % mot syskonens
     L 85–94 % i konstläder. Skrivs `beige`.
  3. Källans hälsopåstående om C ("löser spänningar efter en stressig dag") —
     ett medicinskt löfte om en fåtölj.
  4. E:s ryggmått `66B x 68T x 15T` — TVÅ mått bär bokstaven T. Vilket som är
     djup och vilket som är tjocklek går inte att veta, så bara bredden (66 cm)
     publiceras.
  5. E:s tillbakalutade BREDD och fotpallens axelnamn — källan kastar om L och
     B mellan sina egna rader. Måttritningen är entydig och får avgöra; där den
     inte räcker skrivs talen utan axelnamn.
  6. E:s 360° — källan skriver bara "i alla riktningar", aldrig en gradsiffra.

⚠️ HÄRLETT, inte citerat: att alla fyra modellerna kräver montering. Källan
   säger det rakt ut för C, D och E men är TYST om B. B:s paket är 82 × 65 ×
   57 cm och fåtöljen 86 × 83 × 107 cm — en 107 cm hög stol ryms inte i en
   57 cm hög kartong. Samma sorts härledning som runda 66:s väggavstånd.
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
FJADERKARNA = (
    "Sitsen har fjäderkärna, alltså enskilda spiralfjädrar i fickor under "
    "skummet. De ger ett fjädrande motstånd som håller formen längre än ett "
    "rent skumblock, och de fördelar tyngden i stället för att sjunka ihop "
    "där du sitter mest."
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
    delar = [p["ingress"], egenskaper(p["eg"]), spec(p["spec"]),
             rubrikblock(p["villkor"][0], p["villkor"][1]),
             skotsel(p["skotsel"]), faq(p["faq"])]
    return "".join(delar)


# ============================================================== familj B ===
# Reclinerfåtölj med LÖS fotpall. 130°, fjäderkärna, 150 kg, 40 cm vägg.
B_SLUG = {"04feb176": "reclinerfatolj-svart-med-fotpall",
          "6a4e92c4": "reclinerfatolj-graddvit-med-fotpall"}
B_FARG = {"04feb176": "svart", "6a4e92c4": "gräddvit"}


def b_spec(k):
    return [
        "Mått upprätt (B × D × H): 86 × 83 × 107 cm",
        "Mått tillbakalutad (B × D × H): 86 × 110 × 95 cm",
        "Sits (B × D × H): 53 × 53 × 45 cm",
        "Ryggstöd (B × H): 64 × 69 cm",
        "Stoppning: 11 cm i sits och rygg",
        "Armstödshöjd över sitsen: 14 cm",
        "Fotpall (B × D × H): 49 × 44 × 41 cm",
        "Ryggvinkel: upp till 130°, steglös",
        "Minsta avstånd till vägg: 40 cm",
        "Maxlast: 150 kg",
        "Klädsel: konstläder",
        "Stomme: metallram, skum och böjd träfot",
        "Färg: %s klädsel på mörkbrun fot" % B_FARG[k],
        "Vikt: 24 kg",
        "Paketmått: 82 × 65 × 57 cm",
        "Montering: krävs",
    ]


def b_produkt(kort, pris, syskon, e_slug, e_farg, c_slug, c_farg):
    f = B_FARG[kort]
    return {
        "kort": kort, "pris": pris, "slug": B_SLUG[kort],
        "name": "Reclinerfåtölj med fotpall i konstläder, 130° och 360° – %s" % f,
        "title": "Reclinerfåtölj med fotpall, %s | Fyndplats" % f,
        "meta": ("Reclinerfåtölj i %s konstläder med lös fotpall, fjäderkärna "
                 "i sitsen och 360° snurrfot. Ryggen fälls steglöst till 130°. "
                 "Bär 150 kg." % f),
        "sokord": "reclinerfåtölj fotpall",
        "ingress": (
            "<p>En reclinerfåtölj med lös fotpall, klädd i %s konstläder på en "
            "mörkbrun fot i böjt trä. Ryggen fälls steglöst bakåt till 130°, "
            "sitsen vilar på fjäderkärna och hela fåtöljen snurrar 360°. Att "
            "fotpallen är fristående gör den flyttbar: dra fram den när du vill "
            "lägga upp benen och skjut undan den när du inte gör det.</p>" % f),
        "eg": [
            "Ryggen fälls steglöst bakåt till 130°",
            "Snurrar 360° på foten",
            "Fjäderkärna i sitsen under stoppningen",
            "11 cm stoppning i både sits och rygg",
            "Armstöden ligger 14 cm över sitsen",
            "Fristående fotpall, 49 × 44 cm och 41 cm hög",
            "Halkfria tassar under foten skyddar golvet",
            "Bär 150 kg",
            "Levereras omonterad",
        ],
        "spec": b_spec(kort),
        "villkor": ("Ställ den 40 cm från väggen", [
            "Fåtöljen fäller ryggen bakåt utan skenor i golvet, så den behöver "
            "utrymme rakt bakom sig. Upprätt är den 83 cm djup; med ryggen helt "
            "tillbakalutad mäter den 110 cm, och den behöver 40 cm mellan "
            "ryggens överkant och väggen. Med den marginalen går ryggen hela "
            "vägen ner utan att ta i.",
        ]),
        "skotsel": [KONSTLADER, FJADERKARNA, SKOTSEL_KONSTLADER, MONTERING_SKRUV],
        "faq": [
            ("Är klädseln äkta läder?",
             "Nej, det är konstläder — en plastbelagd väv. Den ser ut som läder "
             "och torkas av som läder, men den andas inte på samma sätt."),
            ("Hur mycket plats behöver den bakom sig?",
             "Minst 40 cm. Fåtöljen är 83 cm djup upprätt och 110 cm när ryggen "
             "ligger helt ner."),
            ("Sitter fotpallen ihop med fåtöljen?",
             "Nej, den är fristående och går att flytta dit du vill ha den. "
             "Den mäter 49 × 44 cm och är 41 cm hög."),
            ("Snurrar den hela varvet?",
             "Ja, foten går 360° runt, och fotpallen står kvar där du satt den."),
            ("Finns den i fler färger?",
             "Ja, samma modell finns i %s." % syskon),
            ("Finns det en modell som bär mer?",
             "Ja, %s fäller ryggen till 145° och bär 160 kg, men dess fotpall "
             "är gjord för 20 kg."
             % lank(e_slug, "%s relaxfåtölj med fotpall" % e_farg)),
            ("Finns det en med fotstödet inbyggt?",
             "Ja, %s har fotstödet i stommen i stället för som lös pall, och "
             "gungar dessutom." % lank(c_slug, "%s tv-fåtölj" % c_farg)),
        ],
    }


# ============================================================== familj C ===
# Tv-fåtölj i chenille, INBYGGT fotstöd, gungar, 145°, 150 kg, 30 cm vägg.
C_SLUG = {"ceae31c1": "tv-fatolj-gra-med-inbyggt-fotstod",
          "1b39b14e": "tv-fatolj-beige-med-inbyggt-fotstod"}
C_FARG = {"ceae31c1": "grå", "1b39b14e": "beige"}


def c_spec(k):
    return [
        "Mått upprätt (B × D × H): 95 × 94 × 104 cm",
        "Mått tillbakalutad (B × D × H): 95 × 162 × 83 cm",
        "Sits (B × D × H): 52 × 56 × 51 cm",
        "Ryggstöd (B × H): 90 × 62 cm",
        "Stoppning: 20 cm i sitsen, 22 cm i ryggen",
        "Armstöd (B × D × H): 20 × 66 × 58 cm",
        "Sidofickor (B × H): 35 × 28 cm, två stycken",
        "Ryggvinkel: upp till 145°",
        "Minsta avstånd till vägg: 30 cm",
        "Maxlast: 150 kg",
        "Passar kroppslängd: upp till 190 cm",
        "Klädsel: chenille, 100 % polyester",
        "Stomme: metall och lamellträ, sits med fjäderkärna och skum",
        "Färg: %s" % C_FARG[k],
        "Vikt: 44,3 kg",
        "Paketmått: 86 × 66 × 48 cm",
        "Montering: krävs, delarna trycks ihop",
    ]


def c_produkt(kort, pris, syskon, b_slug, b_farg):
    f = C_FARG[kort]
    return {
        "kort": kort, "pris": pris, "slug": C_SLUG[kort],
        "name": "Tv-fåtölj i chenille med inbyggt fotstöd och gungning – %s" % f,
        "title": "Tv-fåtölj i chenille med fotstöd, %s | Fyndplats" % f,
        "meta": ("Tv-fåtölj i %s chenille som gungar och snurrar. Spaken på "
                 "sidan fäller ryggen till 145° och kör ut fotstödet. Två "
                 "sidofickor, 360° snurr. Bär 150 kg." % f),
        "sokord": "tv-fåtölj chenille",
        "ingress": (
            "<p>En bred tv-fåtölj i %s chenille med fotstödet inbyggt i "
            "stommen — här behövs ingen lös pall. Ett drag i spaken på sidan "
            "fäller ryggen bakåt till 145° och kör samtidigt ut fotstödet. I "
            "upprätt läge gungar fåtöljen mjukt fram och tillbaka och snurrar "
            "360° på sin fot.</p>" % f),
        "eg": [
            "Spaken på sidan fäller ryggen till 145° och kör ut fotstödet i "
            "samma drag",
            "Gungar mjukt fram och tillbaka och snurrar 360°",
            "52 cm bred sits och 62 cm hög rygg",
            "20 cm breda armstöd att vila hela underarmen på",
            "Två sidofickor, 35 × 28 cm, för fjärrkontroll och surfplatta",
            "Fjäderkärna och högelastiskt skum i sitsen",
            "20 cm stoppning i sitsen och 22 cm i ryggen",
            "Bär 150 kg och passar kroppslängd upp till 190 cm",
            "Delarna trycks ihop vid monteringen",
        ],
        "spec": c_spec(kort),
        "villkor": ("Så mycket plats den tar", [
            "Upprätt är fåtöljen 94 cm djup. Med ryggen nere och fotstödet ute "
            "mäter den 162 cm från fotstödets spets till ryggens överkant, "
            "alltså 68 cm mer än när den står rak. Bakom sig behöver den 30 cm. "
            "Räkna med båda måtten när du väljer plats — fotstödet går ut "
            "framåt samtidigt som ryggen går ner bakåt.",
        ]),
        "skotsel": [CHENILLE, FJADERKARNA, SKOTSEL_TYG,
                    "Fåtöljen kommer i delar som trycks ihop. Kontrollera att "
                    "varje infästning gått hela vägen in innan du sätter dig "
                    "första gången."],
        "faq": [
            ("Behöver jag en separat fotpall?",
             "Nej. Fotstödet sitter i stommen och åker ut när du drar i spaken "
             "på sidan, samtidigt som ryggen fälls."),
            ("Gungar den och snurrar den?",
             "Ja, båda. Foten gungar mjukt fram och tillbaka och vrider sig "
             "360° runt."),
            ("Vad väger den?",
             "44,3 kg. Det är tyngre än det ser ut, och den bärs lättast av "
             "två personer."),
            ("Vem passar den för?",
             "Sitsdjupet och ryggens höjd är gjorda för kroppslängd upp till "
             "190 cm, och fåtöljen bär 150 kg."),
            ("Vad får plats i sidofickorna?",
             "Fickorna är 35 cm breda och 28 cm djupa, en på vardera sidan — "
             "gjorda för fjärrkontroller, en surfplatta eller en tidning."),
            ("Finns den i fler färger?",
             "Ja, samma modell finns i %s." % syskon),
            ("Finns det en med lös fotpall i stället?",
             "Ja, %s har en fristående fotpall som går att flytta undan."
             % lank(b_slug, "%s reclinerfåtölj" % b_farg)),
        ],
    }


# ============================================================== familj D ===
# Vilfåtölj med fotpall som har FÖRVARING. 145°, 120 kg stol / 100 kg pall.
D_SLUG = {"7f437bac": "vilfatolj-morkgra-med-fotpall",
          "87262869": "vilfatolj-graddvit-med-fotpall"}
D_FARG = {"7f437bac": "mörkgrå", "87262869": "gräddvit"}


def d_spec(k):
    return [
        "Mått sittande (B × D × H): 80 × 86 × 99 cm",
        "Mått tillbakalutad (B × D × H): 80 × 107 × 96 cm",
        "Sits (B × D): 50 × 52 cm",
        "Sitthöjd: 47 cm",
        "Ryggstöd (B × H): 50 × 71 cm",
        "Fotpall (B × D × H): 47 × 42 × 45 cm",
        "Förvaringsfack i fotpallen (B × D × H): 40 × 34 × 6 cm",
        "Ryggvinkel: upp till 145°",
        "Maxlast: 120 kg för fåtöljen, 100 kg för fotpallen",
        "Klädsel: konstläder",
        "Stomme: trä och skum",
        "Färg: %s klädsel på ljusbrun fot" % D_FARG[k],
        "Vikt: 24 kg",
        "Paketmått: 81 × 61 × 47 cm",
        "Montering: krävs",
    ]


def d_produkt(kort, pris, syskon, b_slug, b_farg):
    f = D_FARG[kort]
    return {
        "kort": kort, "pris": pris, "slug": D_SLUG[kort],
        "name": "Vilfåtölj med fotpall och dolt förvaringsfack, 145° – %s" % f,
        "title": "Vilfåtölj med fotpall och förvaring, %s | Fyndplats" % f,
        "meta": ("Vilfåtölj i %s konstläder med ryggen fällbar till 145° och "
                 "360° snurrfot. Fotpallen har ett dolt fack på 40 × 34 cm "
                 "under sitsen. Bär 120 kg." % f),
        "sokord": "vilfåtölj fotpall",
        "ingress": (
            "<p>En vilfåtölj i %s konstläder på en ljusbrun träfot, med en "
            "fotpall som samtidigt är förvaring: under pallens sittdyna finns "
            "ett fack på 40 × 34 cm där fjärrkontroller, tidningar och ett par "
            "böcker får plats. Ryggen fälls bakåt till 145° och fåtöljen "
            "snurrar 360°.</p>" % f),
        "eg": [
            "Ryggen fälls bakåt till 145°",
            "Snurrar 360° på foten",
            "Fotpallen har ett dolt fack under sittdynan, 40 × 34 cm",
            "Mjukt stoppad sits, rygg och armstöd",
            "Knappdekor i ryggen",
            "Stomme i trä",
            "Fåtöljen bär 120 kg och fotpallen 100 kg",
            "Levereras omonterad",
        ],
        "spec": d_spec(kort),
        "villkor": ("Vad som får plats i fotpallen", [
            "Facket under fotpallens sittdyna mäter 40 × 34 cm och är 6 cm "
            "djupt. Höjden är det som avgör: fjärrkontroller, tidningar, ett "
            "par böcker och laddsladdar ligger bra, medan en filt eller en "
            "kudde inte får plats. Locket är hela sittdynan, så du kommer åt "
            "ytan på en gång i stället för genom en lucka.",
        ]),
        "skotsel": [KONSTLADER, SKOTSEL_KONSTLADER, MONTERING_SKRUV],
        "faq": [
            ("Är klädseln äkta läder?",
             "Nej, det är konstläder — en plastbelagd väv som torkas av med en "
             "fuktad trasa."),
            ("Går det att sitta på fotpallen?",
             "Ja. Fotpallen är märkt för 100 kg och fåtöljen för 120 kg, så "
             "pallen fungerar som extra sittplats."),
            ("Hur djupt är förvaringsfacket?",
             "6 cm, med en yta på 40 × 34 cm. Det är gjort för det platta — "
             "fjärrkontroller, tidningar och böcker."),
            ("Hur mycket djupare blir den när ryggen fälls?",
             "Från 86 cm till 107 cm, alltså 21 cm mer. Höjden sjunker "
             "samtidigt från 99 cm till 96 cm."),
            ("Finns den i fler färger?",
             "Ja, samma modell finns i %s." % syskon),
            ("Finns det en modell som bär mer?",
             "Ja, %s bär 150 kg och har fjäderkärna i sitsen."
             % lank(b_slug, "%s reclinerfåtölj med fotpall" % b_farg)),
        ],
    }


# ============================================================== familj E ===
# ☠️ Relaxfåtölj: 160 kg i stolen men BARA 20 kg i fotpallen.
E_SLUG = {"9794b6df": "relaxfatolj-svart-med-fotpall",
          "9946e1eb": "relaxfatolj-graddvit-med-fotpall"}
E_FARG = {"9794b6df": "svart", "9946e1eb": "gräddvit"}


def e_spec(k):
    return [
        "Mått upprätt (B × D × H): 79 × 80 × 100 cm",
        "Mått tillbakalutad: 122 cm från framkant till bakkant, 85 cm hög",
        "Sits (B × D): 50 × 52 cm",
        "Sitthöjd: 45 cm",
        "Ryggstöd, bredd: 66 cm",
        "Fotpall: 48 × 42 cm, 42,5 cm hög",
        "Ryggvinkel: upp till 145°",
        "Maxlast: 160 kg för fåtöljen, 20 kg för fotpallen",
        "Klädsel: konstläder",
        "Stomme: stål och trä, fot i böjträ",
        "Färg: %s klädsel på mörkbrun fot" % E_FARG[k],
        "Vikt: 24 kg",
        "Paketmått: 81 × 64 × 58 cm",
        "Montering: krävs",
    ]


def e_produkt(kort, pris, syskon, d_slug, d_farg):
    f = E_FARG[kort]
    return {
        "kort": kort, "pris": pris, "slug": E_SLUG[kort],
        "name": "Relaxfåtölj med fotpall i konstläder, bär 160 kg – %s" % f,
        "title": "Relaxfåtölj med fotpall, 160 kg, %s | Fyndplats" % f,
        "meta": ("Relaxfåtölj i %s konstläder med stålram och fot i böjträ. "
                 "Ryggen fälls manuellt till 145° och fåtöljen bär 160 kg. "
                 "Fotpallen är gjord för 20 kg." % f),
        "sokord": "relaxfåtölj konstläder",
        "ingress": (
            "<p>En relaxfåtölj i %s konstläder med stålram under klädseln och "
            "en mörkbrun fot i böjträ. Ryggen fälls manuellt bakåt till 145° "
            "och fåtöljen snurrar runt på sin fot. Stolen bär 160 kg — mer än "
            "de flesta fåtöljer i den här storleken — medan fotpallen som "
            "följer med är ett fotstöd på 20 kg.</p>" % f),
        "eg": [
            "Ryggen fälls manuellt bakåt till 145°",
            "Snurrar runt på sin fot",
            "Stålram under klädseln",
            "Fot i böjträ",
            "Mjukt stoppad sits och rygg i konstläder",
            "Fåtöljen bär 160 kg",
            "Fotpallen är gjord för 20 kg — ett fotstöd, inte en sittplats",
            "Levereras omonterad",
        ],
        "spec": e_spec(kort),
        "villkor": ("Fotpallen är gjord för fötter", [
            "Fåtöljen bär 160 kg, men fotpallen är märkt för 20 kg. Skillnaden "
            "är åtta gånger, och den är inte en marginal: pallen har en lätt "
            "ram och är gjord för att bära ben, inte en person. Använd den till "
            "att lägga upp fötterna, och låt barn och gäster sätta sig i "
            "fåtöljen i stället.",
        ]),
        "skotsel": [KONSTLADER, SKOTSEL_KONSTLADER, MONTERING_SKRUV],
        "faq": [
            ("Hur mycket bär fåtöljen?",
             "160 kg. Ramen är i stål och foten i böjträ."),
            ("Kan man sitta på fotpallen?",
             "Nej. Pallen är märkt för 20 kg och är ett fotstöd. Behöver du en "
             "pall som också går att sitta på, se frågan längre ner."),
            ("Är klädseln äkta läder?",
             "Nej, det är konstläder — en plastbelagd väv som torkas av med en "
             "fuktad trasa."),
            ("Hur mycket djupare blir den när ryggen fälls?",
             "Upprätt är den 80 cm djup. Tillbakalutad mäter den 122 cm från "
             "framkant till bakkant, och höjden sjunker från 100 cm till 85 cm."),
            ("Finns den i fler färger?",
             "Ja, samma modell finns i %s." % syskon),
            ("Finns det en fotpall som går att sitta på?",
             "Ja, %s har en fotpall märkt för 100 kg, med ett förvaringsfack "
             "under sittdynan." % lank(d_slug, "%s vilfåtölj" % d_farg)),
        ],
    }


# ------------------------------------------------------------ produkter ---
PRODUKTER = [
    b_produkt("04feb176", 4299, lank(B_SLUG["6a4e92c4"], "gräddvit"),
              E_SLUG["9794b6df"], "svart", C_SLUG["ceae31c1"], "grå"),
    b_produkt("6a4e92c4", 3729, lank(B_SLUG["04feb176"], "svart"),
              E_SLUG["9946e1eb"], "gräddvit", C_SLUG["1b39b14e"], "beige"),
    c_produkt("ceae31c1", 4719, lank(C_SLUG["1b39b14e"], "beige"),
              B_SLUG["04feb176"], "svart"),
    c_produkt("1b39b14e", 4699, lank(C_SLUG["ceae31c1"], "grå"),
              B_SLUG["6a4e92c4"], "gräddvit"),
    d_produkt("7f437bac", 2449, lank(D_SLUG["87262869"], "gräddvit"),
              B_SLUG["04feb176"], "svart"),
    d_produkt("87262869", 2299, lank(D_SLUG["7f437bac"], "mörkgrå"),
              B_SLUG["6a4e92c4"], "gräddvit"),
    e_produkt("9794b6df", 4259, lank(E_SLUG["9946e1eb"], "gräddvit"),
              D_SLUG["7f437bac"], "mörkgrå"),
    e_produkt("9946e1eb", 3859, lank(E_SLUG["9794b6df"], "svart"),
              D_SLUG["87262869"], "gräddvit"),
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
        print("%s  namn %2d  titel %2d  meta %3d  sku %-26s html %4d  synlig %4d"
              % (p["kort"], len(p["name"]), len(p["title"]), len(p["meta"]),
                 sku, len(h), len(synlig)))
