# -*- coding: utf-8 -*-
"""Runda 66 — åtta reclinerfåtöljer. Texten skrivs HÄR, inte inline i anropet.

☠️ Batch 64 mätte skillnaden: fem produkter skrivna inline gav NIO fel som nådde
Wix, tre skrivna via fil gav noll. En sträng i ett JSON-anrop kan ingen grind
läsa innan den lämnar chatten, och API-svaret ekar tillbaka exakt det man skrev.

Alla siffror kommer ur leverantörens Technische Daten. Sju saker är MEDVETET
utelämnade, och skälen står i LAGE.md:

  1. Ordet "svart" om 74f261ea — fotot mäter L 45 %, alltså mellangrå.
  2. Ordet "brun" om 824301a4 — mätt L 44 % vid 4 % mättnad, en dämpad gråbrun.
  3. Ordet "grå" om da6d086a — den svenska spec-raden säger grå, pixlarna beige.
  4. Sömnstörningar och amning som säljargument på trion — hälsopåstående.
  5. Egenvikten på trion (50 kg) och da6d086a (50,4 kg) — bara importradens
     ord, ingen andra källa, och högt för en tygfåtölj.
  6. Ordet "läder" — allt i rundan är konstläder eller tyg.
  7. Väggavstånd på trion och da6d086a — källan anger inget. Djupet de behöver
     står ändå, HÄRLETT ur de två mått källan faktiskt ger.

⚠️ Färgordet `stålgrå` valdes framför `skiffergrå` eftersom det är kortare och
   ger en egen SKU. Båda beskriver mätningen lika väl (RGB 110,113,121, kall
   ton, L 45 %); valet står mellan två korrekta ord, inte mellan rätt och fel.
   Ett oriktigt färgord hade aldrig fått väljas för att passa en SKU.
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
    "Tyget är linnelook i 100 % polyester: en väv med linnets matta, lite "
    "oregelbundna yta, men syntetisk. Den är tåligare mot slitage än äkta linne "
    "och skrynklar inte, och den nopprar sig mindre än en kort lugg gör."
)
SAMMETSLOOK = (
    "Tyget är sammetslook i 100 % polyester — en kort, tät lugg som ger djup i "
    "färgen och en mjuk känsla mot huden. Det är inte äkta sammet, och det är "
    "en fördel i vardagen: syntetluggen tål nötning och går att torka av."
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
    "Dammsug med möbelmunstycke med jämna mellanrum och ta fläckar med en lätt "
    "fuktad trasa och milt rengöringsmedel. Låt torka innan du sätter dig igen, "
    "och undvik direkt solljus — syntettyger bleks av UV."
)
# ☠️ Leverantörens säkerhetsanvisning står som egen punkt på två av tre syskon
#    och bara som en parentes inuti en annan punkt på det tredje. Den gäller
#    alla tre, och den ska stå ORDAGRANT likadant på alla tre: en omskrivning
#    per sida är tre chanser att införa ett fel. Samma regel som hundburarnas
#    rättsliga upplysning.
GUNGSPARR = "Gungfunktionen används sittande, inte med ryggen fälld till liggläge."


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


# ------------------------------------------------------------ kluster A ---
# Fyra färgsyskon. Identiska utom klädselfärg och träsockelns ton.
A_SLUG = {"e11ad5cc": "reclinerfatolj-graddvit-konstlader",
          "74f261ea": "reclinerfatolj-stalgra-konstlader",
          "824301a4": "reclinerfatolj-grabrun-konstlader",
          "12e50842": "reclinerfatolj-morkgra-konstlader"}
A_FARG = {"e11ad5cc": "gräddvit", "74f261ea": "stålgrå",
          "824301a4": "gråbrun", "12e50842": "mörkgrå"}
A_SOCKEL = {"e11ad5cc": "ljust orangebrun", "74f261ea": "ljust orangebrun",
            "824301a4": "rödbrun", "12e50842": "ljust orangebrun"}


def a_spec(k):
    return [
        "Mått upprätt (B × D × H): 78 × 88 × 103 cm",
        "Mått helt tillbakalutad: 78 × 151 × 93 cm",
        "Sits (B × D × H): 56 × 56 × 45 cm, 13 cm tjock",
        "Ryggstöd (B × D × H): 58 × 15 × 70 cm",
        "Armstöd (B × D × H): 54 × 15 × 13 cm",
        "Fotstöd (B × D × H): 63 × 63 × 5 cm",
        "Ryggvinkel: upp till 135°",
        "Minsta avstånd till vägg: 50 cm",
        "Maxlast: 150 kg",
        "Klädsel: konstläder",
        "Stomme: pulverlackerat stål och plywood, sockel i trä",
        "Färg: %s klädsel på %s sockel" % (A_FARG[k], A_SOCKEL[k]),
        "Vikt: 22 kg",
        "Paketmått: 83 × 64 × 57 cm",
        "Montering: krävs",
    ]


def a_produkt(kort, pris, ingress, syskon):
    f = A_FARG[kort]
    return {
        "kort": kort, "pris": pris, "slug": A_SLUG[kort],
        "name": "Reclinerfåtölj i konstläder med snurrfot och fotstöd – %s" % f,
        "title": "Reclinerfåtölj i konstläder, %s | Fyndplats" % f,
        "meta": ("Reclinerfåtölj i %s konstläder med ryggen fällbar till 135°, "
                 "utfällbart fotstöd och 360° snurrfot. Bär 150 kg. "
                 "Behöver 50 cm bakom sig." % f),
        "sokord": "reclinerfåtölj konstläder",
        "ingress": ingress,
        "eg": [
            "Ryggen fälls steglöst bakåt till 135° och fotstödet följer med ut",
            "Sockeln snurrar 360°, så du når soffbordet utan att resa dig",
            "Sits 56 cm bred med 13 cm tjock stoppning",
            "Höga armstöd i samma stoppning som sitsen",
            "Halkfria tassar under sockeln skyddar golvet",
            "Bär 150 kg",
            "Levereras omonterad",
        ],
        "spec": a_spec(kort),
        "villkor": ("Ställ den 50 cm från väggen", [
            "Fåtöljen fäller ryggen bakåt utan skenor i golvet, så den behöver "
            "utrymme rakt bakom sig. Från upprätt läge växer den från 88 cm "
            "djup till 151 cm när ryggen ligger helt ner, och den behöver "
            "50 cm mellan ryggens överkant och väggen. Med den halvmetern "
            "går ryggen hela vägen ner utan att ta i.",
        ]),
        "skotsel": [KONSTLADER, SKOTSEL_KONSTLADER,
                    "Fåtöljen kommer i delar och skruvas ihop hemma. Sockeln "
                    "monteras först och sitsen sätts ovanpå; dra åt alla "
                    "skruvar innan du sätter dig första gången."],
        "faq": [
            ("Är klädseln äkta läder?",
             "Nej, det är konstläder — en plastbelagd väv. Den ser ut som "
             "läder och torkas av som läder, men den andas inte på samma sätt."),
            ("Hur mycket plats behöver den bakom sig?",
             "Minst 50 cm. Fåtöljen är 88 cm djup upprätt och 151 cm när "
             "ryggen ligger helt ner."),
            ("Snurrar den hela varvet?",
             "Ja, sockeln går 360° runt. Ryggen och fotstödet följer med."),
            ("Vad väger den?",
             "22 kg. Den går att flytta av en person, men den är otymplig "
             "att bära i trappor ensam."),
            ("Finns den i fler färger?",
             "Ja, samma modell finns i %s." % syskon),
        ],
    }


def a_syskontext(kort):
    andra = [k for k in A_SLUG if k != kort]
    delar = [lank(A_SLUG[k], A_FARG[k]) for k in andra]
    return ", ".join(delar[:-1]) + " och " + delar[-1]


# -------------------------------------------------------------- trion ---
T_SLUG = {"77a79db3": "gungande-tv-fatolj-beige",
          "c1f860c1": "gungande-tv-fatolj-gra",
          "5b16fea8": "gungande-tv-fatolj-morkbla"}
T_FARG = {"77a79db3": "beige", "c1f860c1": "grå", "5b16fea8": "mörkblå"}


def t_spec(k):
    return [
        "Mått upprätt (B × D × H): 88 × 96 × 108 cm",
        "Mått tillbakalutad: 88 × 165 × 85 cm",
        "Sits (B × D): 48 × 56 cm",
        "Sitthöjd: 50 cm",
        "Ryggstöd (B × H): 68 × 83 cm",
        "Stoppning: 12 cm i sitsen, 23 cm i ryggen",
        "Ryggvinkel: upp till 135°, låses med spänne",
        "Mugghållare: två, en i vardera armstöd",
        "Maxlast: 150 kg",
        "Passar kroppslängd: upp till 185 cm",
        "Klädsel: linnelook, 100 % polyester",
        "Stomme: stål, sits med fjäderkärna och skum",
        "Färg: %s" % T_FARG[k],
        "Montering: cirka tio minuter, inga verktyg behövs",
    ]


def t_produkt(kort, pris, ingress, syskon):
    f = T_FARG[kort]
    return {
        "kort": kort, "pris": pris, "slug": T_SLUG[kort],
        "name": "Gungande tv-fåtölj med två mugghållare och fotstöd – %s" % f,
        "title": "Gungande tv-fåtölj med mugghållare, %s | Fyndplats" % f,
        "meta": ("Tv-fåtölj i %s linnelook som snurrar och gungar. Ryggen låses "
                 "till 135° med spänne, fotstödet fälls ut med foten. Två "
                 "mugghållare. Bär 150 kg." % f),
        "sokord": "tv-fåtölj mugghållare",
        "ingress": ingress,
        "eg": [
            "Ryggen fälls till 135° och låses i läge med ett spänne",
            "Fotstödet fälls ut med ett tryck av foten, utan spak",
            "Snurrar runt och gungar mjukt fram och tillbaka",
            "En mugghållare i vardera armstöd",
            "23 cm stoppning i ryggen och 12 cm i sitsen",
            "Fjäderkärna under sittdynan",
            "Bär 150 kg och passar kroppslängd upp till 185 cm",
            "Klar på cirka tio minuter, inga verktyg behövs",
        ],
        "spec": t_spec(kort),
        "villkor": ("Så mycket plats den tar", [
            "Upprätt är fåtöljen 96 cm djup. Med ryggen fälld och fotstödet "
            "ute mäter den 165 cm från framkant till bakkant, alltså 69 cm "
            "mer än när den står rak. Räkna med det utrymmet framför och "
            "bakom när du väljer plats. %s" % GUNGSPARR,
        ]),
        "skotsel": [LINNELOOK, FJADERKARNA, SKOTSEL_TYG],
        "faq": [
            ("Hur fälls ryggen?",
             "Med ett spänne på sidan. Du lutar dig bakåt till det läge du "
             "vill ha och låser spännet där — ryggen går till 135°."),
            ("Behöver jag verktyg för att montera den?",
             "Nej. Delarna klickar och skruvas ihop för hand på cirka tio "
             "minuter."),
            ("Kan man gunga med ryggen nerfälld?",
             GUNGSPARR + " Ryggen och gungningen är två lägen, inte ett."),
            ("Hur stora mugghållare är det?",
             "En infälld hållare i vardera armstöd, avsedda för en vanlig "
             "mugg eller ett glas."),
            ("Finns den i fler färger?",
             "Ja, samma modell finns i %s." % syskon),
        ],
    }


def t_syskontext(kort):
    andra = [k for k in T_SLUG if k != kort]
    delar = [lank(T_SLUG[k], T_FARG[k]) for k in andra]
    return " och ".join(delar)


# ------------------------------------------------------------- enskild ---
DA = {
    "kort": "da6d086a", "pris": 4219, "slug": "reclinerfatolj-beige-sammet",
    "name": "Reclinerfåtölj i sammetslook med 360° snurr och gungning – beige",
    "title": "Reclinerfåtölj i sammetslook, beige | Fyndplats",
    "meta": ("Bred reclinerfåtölj i beige sammetslook med 57 cm sits, "
             "fjäderkärna och fotstöd. Snurrar 360° och gungar. Ryggen fälls "
             "till 135°. Bär 120 kg."),
    "sokord": "reclinerfåtölj sammetslook",
    "ingress": (
        "<p>En bred fåtölj med rundade former och en sits på 57 cm — mer "
        "sittyta än en vanlig reclinerfåtölj, så du kan dra upp benen utan "
        "att sitta i kläm. Ryggen fälls bakåt till 135° och fotstödet dras "
        "ut, och hela stolen snurrar och gungar på sin sockel.</p>"),
    "eg": [
        "57 cm bred sits med fjäderkärna under skummet",
        "Ryggen fälls manuellt till 135° och fotstödet dras ut",
        "Snurrar 360° och gungar mjukt",
        "Bred svängd rygg och generösa armstöd sluter om sitsen",
        "Armstöden sitter 15 cm över sitsen",
        "Bär 120 kg och passar kroppslängd 155–185 cm",
        "Levereras omonterad",
    ],
    "spec": [
        "Mått upprätt (B × D × H): 93 × 75 × 100 cm",
        "Mått fullt tillbakalutad (L × B × H): 160 × 93 × 75 cm",
        "Sits (B × D): 57 × 54 cm",
        "Sitthöjd: 49,5 cm",
        "Ryggstöd (B × L): 91 × 64 cm",
        "Armstöd (L × B): 64 × 18 cm, 15 cm över sitsen",
        "Ryggvinkel: upp till 135°",
        "Maxlast: 120 kg",
        "Passar kroppslängd: 155–185 cm",
        "Klädsel: sammetslook, 100 % polyester",
        "Stomme: plywood och metall, sits med fjäderkärna och skum",
        "Färg: beige",
        "Montering: krävs",
    ],
    "villkor": ("Så mycket plats den tar", [
        "Upprätt är fåtöljen 75 cm djup. Fullt tillbakalutad mäter den 160 cm "
        "från fotstödets spets till ryggens överkant, alltså 85 cm mer än när "
        "den står rak. Räkna med det utrymmet när du väljer plats.",
    ]),
    "skotsel": [SAMMETSLOOK, FJADERKARNA, SKOTSEL_TYG,
                "Fåtöljen kommer i delar och skruvas ihop hemma. Dra åt alla "
                "skruvar innan du sätter dig första gången."],
    "faq": [
        ("Är det äkta sammet?",
         "Nej, det är sammetslook i 100 % polyester. Luggen är kort och tät "
         "som sammet, men tåligare mot nötning."),
        ("Hur bred är sitsen?",
         "57 cm mellan armstöden, vilket är bredare än en vanlig "
         "reclinerfåtölj."),
        ("Snurrar och gungar den samtidigt?",
         "Ja, sockeln gör båda: den vrider hela varvet och gungar mjukt fram "
         "och tillbaka."),
        ("Vem passar den för?",
         "Sitsens djup och ryggens höjd är gjorda för kroppslängd 155–185 cm, "
         "och fåtöljen bär 120 kg."),
    ],
}


# ------------------------------------------------------------ produkter ---
PRODUKTER = [
    a_produkt("e11ad5cc", 4319,
              "<p>En reclinerfåtölj i gräddvitt konstläder på en snurrande "
              "träsockel. Ryggen fälls bakåt till 135° och fotstödet följer "
              "med ut ur ramen, så hela stolen blir en lång vilstol utan att "
              "du behöver flytta på den. Det ljusa konstlädret torkas av med "
              "en fuktad trasa.</p>", a_syskontext("e11ad5cc")),
    a_produkt("74f261ea", 4299,
              "<p>En reclinerfåtölj i stålgrått konstläder på en snurrande "
              "träsockel. Den gråa klädseln har en kall ton som går ihop med "
              "både ljusa och mörka möbler. Ryggen fälls bakåt till 135° och "
              "fotstödet följer med ut ur ramen.</p>", a_syskontext("74f261ea")),
    a_produkt("824301a4", 3899,
              "<p>En reclinerfåtölj i gråbrunt konstläder på en rödbrun "
              "snurrsockel — den varmaste av de fyra färgerna i serien. Ryggen "
              "fälls bakåt till 135° och fotstödet följer med ut ur ramen, så "
              "hela stolen blir en vilstol.</p>", a_syskontext("824301a4")),
    a_produkt("12e50842", 3869,
              "<p>En reclinerfåtölj i mörkgrått konstläder på en snurrande "
              "träsockel. Den mörkaste av de fyra färgerna i serien, och den "
              "som syns minst i ett rum med mycket annat. Ryggen fälls bakåt "
              "till 135° och fotstödet följer med ut ur ramen.</p>",
              a_syskontext("12e50842")),
    t_produkt("77a79db3", 5079,
              "<p>En djupt stoppad tv-fåtölj i beige linnelook, med 23 cm "
              "stoppning i ryggen och en mugghållare i vardera armstöd. Den "
              "snurrar, den gungar, och ryggen låses med ett spänne var du "
              "vill ha den — upp till 135°. Fotstödet fälls ut med ett tryck "
              "av foten.</p>", t_syskontext("77a79db3")),
    t_produkt("c1f860c1", 4999,
              "<p>En djupt stoppad tv-fåtölj i grå linnelook, med 23 cm "
              "stoppning i ryggen och en mugghållare i vardera armstöd. Den "
              "snurrar, den gungar, och ryggen låses med ett spänne var du "
              "vill ha den — upp till 135°. Fotstödet fälls ut med ett tryck "
              "av foten.</p>", t_syskontext("c1f860c1")),
    t_produkt("5b16fea8", 4699,
              "<p>En djupt stoppad tv-fåtölj i mörkblå linnelook, med 23 cm "
              "stoppning i ryggen och en mugghållare i vardera armstöd. Den "
              "snurrar, den gungar, och ryggen låses med ett spänne var du "
              "vill ha den — upp till 135°. Fotstödet fälls ut med ett tryck "
              "av foten.</p>", t_syskontext("5b16fea8")),
    DA,
]


def bygg(p):
    delar = [p["ingress"], egenskaper(p["eg"]), spec(p["spec"]),
             rubrikblock(p["villkor"][0], p["villkor"][1]),
             skotsel(p["skotsel"]), faq(p["faq"])]
    return "".join(delar)


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
