# -*- coding: utf-8 -*-
"""Runda 73 — sju reclinerfåtöljer och en bäddfåtölj.

☠️ Batch 64 mätte skillnaden: fem produkter skrivna inline gav NIO fel som
nådde Wix, tre skrivna via fil gav noll. Texten skrivs därför HÄR.

☠️ RUNDANS STÖRSTA FYND — KÄLLANS FÄRGORD ÄR FEL PÅ FEM AV ÅTTA, OCH VARJE
FEL GÅR ÅT DET HÅLL SOM HADE KROCKAT MED ETT PUBLICERAT SYSKONS ORD.

Runda 66 mätte att källan kallade en mellangrå fåtölj "Schwarz"; runda 69 att
två "Schwarz" låg 49 luminanssteg isär. Båda visade att ordet ljuger. Det som
saknades var facit för vad HUSET menar med sina egna ord — och det finns i
katalogen. `farg.py` kalibrerar därför mot publicerade sidor där det svenska
ordet redan är låst:

    grå       35–55 %      gråbrun   40 % vid S 5 %
    brun      45–46 % vid S 18–22 %   ljusgrå   58–63 %      beige   77 %

    utkast     källan                uppmätt              skrivs
    969d9ec9   Hellgrau              L 65 %, S  5 %       ljusgrå   ✓
    b72f093d   Hellbraun             L 39 %, S  7 %       GRÅBRUN   ☠️
    54cf1f44   Hellgrau              L 50 %, S  4 %       GRÅ       ☠️
    acb1f904   Cremeweiß             L 81 %, S 32 %       gräddvit  ✓
    e57125fb   Dunkelbraun+Schwarz   L 44 %, S 26 %       BRUN      ☠️
    b1e98da4   Grau                  L 67 %, S  5 %       LJUSGRÅ   ☠️
    b67fdc2b   Braun                 L 40 %, S  6 %       GRÅBRUN   ☠️
    7eee41b6   Grau                  L 50 %, S  2 %       grå       ✓

"Hellbraun" skrivet som beige hade krockat med `gungande-tv-fatolj-beige`;
"Braun" skrivet som brun hade legat i det band huset redan använder för en
mättare nyans (`konstladerfatolj-brun-145-grader`, S 18 %).

☠️ RUNDANS ANDRA FYND — MÅTTEN HITTADE TRE FAMILJER, ARTIKELNUMRET AVGJORDE
DEM. Tre av åtta är dimensionella tvillingar till publicerade sidor. Alla tre
visade sig vara äkta FÄRGSYSKON, bevisat på basen (runda 72:s regel):

    839-974V00LR  b72f093d gråbrun    ← V00DB mörkblå + grå + beige
    833-359       b67fdc2b gråbrun    ← V00CW gräddvit · V00CG mörkgrå · BK svart
    833-360       b1e98da4 ljusgrå    ← BK svart

☠️ Och numren visar det måtten dolde: `833-359` och `833-360` är GRANNAR men
OLIKA MODELLER — 80 × 86 × 99 / 24 kg / träkryss / pall med förvaring mot
78 × 67 × 98 / 18 kg / rund metallfot / slät pall. Angränsande artikelnummer
är inget släktskapsbevis; bara samma bas är det.

☠️ RUNDANS TREDJE FYND — TRE PÅSTÅENDEN I KÄLLAN SOM INTE HÅLLER:

  1. `b1e98da4` kallas "Massagestuhl" mitt i en mening om ryggens vred.
     Produkten har ingen massagefunktion: ingen motor, inga vibrationspunkter,
     inget elnät, och namnet säger det inte heller. Ordet är en klipp-och-
     klistra-rest ur en annan produkts text. Funktionen den beskriver — att
     ryggen låses med ett vred — är verklig och står på det publicerade
     syskonet. Skrivs som vredet, aldrig som massage.
  2. `54cf1f44`s spec-tabell bär `90L` som upprätt bredd. Nittio är den
     LIGGANDE bredden i den tyska texten; måttritningen säger 87 upprätt och
     visar ingen 90 alls. Måttritningen är facit (runbokens regel).
  3. `acb1f904`s spec säger `96-106H` som vore det ett spann. Måttritningen
     visar 106 cm på den upprätta figuren och 96 cm på den tillbakalutade —
     två TILLSTÅND, inte ett intervall.

☠️ RUNDANS FJÄRDE FYND — `7eee41b6`s KÄLLA SÄGER TRE OLIKA TYGER. Ingressen
säger "Leinen-Bezug", punktlistan "weichem Wildlederimitat" (mockaimitation)
och specen "Leinen (100% Polyester)". Fotona (`kolla-matt.jpg`, närbild 4 och
5) visar en matt, plan väv med synlig struktur — ingen lugg, ingen sammetslyster.
Det är en linnelook-väv. Mockaimitationen är struken; det mätbara (100 %
polyester) och det synliga (matt väv) står kvar.

⚠️ TVÅ FAKTA SOM BARA MÅTTRITNINGEN BÄR, och som därför är rundans egna:
`b1e98da4` mäter 112 cm i djup och 84 cm i höjd tillbakalutad — den tyska
texten ger inget liggmått alls. Det är precis det tal en kund behöver för att
veta om stolen får plats.

Fem saker är MEDVETET utelämnade:

  1. "Montage in nur 10 Minuten, ohne Werkzeuge" (`b72f093d`). Samma klass som
     runda 71:s "5-Minuten-Montage": marknadsföring utan mått.
  2. "ideal für Personen mit Schlafstörungen oder stillende Mütter"
     (`b72f093d`). Ett hälsopåstående utan grund.
  3. `177 cm` på `e57125fb`s måttritning. Ritningen bär både 163 och 177 på
     den tillbakalutade figuren och säger inte vilket som är vad; den tyska
     texten ger 163. Ett tal utan känd betydelse skrivs inte.
  4. Märkesnamnet. Källan säger ordagrant "Relaxsessel von ." på `b67fdc2b` —
     namnet är redan struket och lämnade en punkt efter sig.
  5. "Puppenwatte"/"Puppenbaumwolle" som materialnamn. Det är fiberfyllning;
     ordagrant översatt ("dockbomull") betyder det ingenting på svenska.
"""
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))

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
    "Klädseln är linnelook: en mikrofiberväv med linnets matta, lite "
    "oregelbundna yta, men helt syntetisk i 100 % polyester. Den skrynklar "
    "inte som äkta linne och tål nötning bättre."
)
TAT_VAV = (
    "Klädseln är en tät möbelväv på 310 g/m² i 100 % polyester. Vikten är det "
    "som gör skillnaden mot ett tunnare tyg: fler trådar per centimeter ger en "
    "yta som klor och dagligt slitage tar sämre grepp om."
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
    "Fåtöljen kommer i delar och skruvas ihop hemma. Ryggen fästs i sitsen med "
    "de förmonterade beslagen; dra åt alla skruvar innan du sätter dig första "
    "gången, och efterdra dem efter någon månads användning."
)
MONTERING_FOT = (
    "Fåtöljen kommer i delar och skruvas ihop hemma. Foten monteras först och "
    "sitsen sätts ovanpå; dra åt alla skruvar innan du sätter dig första "
    "gången, och efterdra dem efter någon månads användning."
)
FALL_MED_RAMEN = (
    "Fäll ryggen med båda händerna på ramen, inte genom att dra i klädseln. "
    "Mekanismen är stål och tål greppet; tyget gör det inte i längden."
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


def och(delar):
    if len(delar) == 1:
        return delar[0]
    return ", ".join(delar[:-1]) + " och " + delar[-1]


# ================================================================== A ======
# 969d9ec9 — tät väv 310 g/m², gungar OCH vrider, 135°, 120 kg, 155–185 cm.
def a_produkt():
    return {
        "kort": "969d9ec9", "pris": 4969,
        "slug": "fatolj-tat-vav-ljusgra-135-grader",
        "name": "Fåtölj i ljusgrå möbelväv 310 g/m² som gungar och vrider",
        "title": "Fåtölj ljusgrå, tät väv, 135° | Fyndplats",
        "meta": ("Fåtölj i ljusgrå möbelväv på 310 g/m², 88 × 91 × 102 cm. "
                 "Ryggen fälls till 135° med fotstödet, sitsen vrider 360° och "
                 "stolen gungar. Sitthöjd 49 cm. Bär 120 kg."),
        "sokord": "fåtölj tät väv",
        "ingress": (
            "<p>En fåtölj i ljusgrå möbelväv på 310 g/m² — en tät kvalitet som "
            "tål mer nötning än ett tunt möbeltyg. Ryggen fälls till 135° och "
            "tar fotstödet med sig, sitsen vrider 360° och hela stolen gungar "
            "mjukt. Sitsen är 56,5 cm bred med 10 cm stoppning.</p>"),
        "eg": [
            "Tät möbelväv, 310 g/m²",
            "Ryggen fälls till 135° med fotstödet",
            "Sitsen vrider 360°",
            "Stolen gungar mjukt",
            "56,5 cm bred sits på 49 cm höjd, 10 cm stoppning",
            "19 cm tjock rygg med fjäderpaket och fiberfyllning",
            "Passar kroppslängd 155–185 cm",
            "Bär 120 kg",
            "Levereras omonterad",
        ],
        "spec": [
            "Mått upprätt (B × D × H): 88 × 91 × 102 cm",
            "Mått tillbakalutad (B × D × H): 88 × 163 × 80 cm",
            "Sittyta (B × D): 56,5 × 56 cm",
            "Sitthöjd: 49 cm",
            "Sitsens stoppning: 10 cm",
            "Ryggstöd (B × H): 73 × 66 cm, 19 cm tjockt",
            "Armstödets höjd över sitsen: 18 cm",
            "Ryggvinkel: upp till 135°",
            "Rotation: 360°",
            "Maxlast: 120 kg",
            "Passar kroppslängd: 155–185 cm",
            "Klädsel: möbelväv 310 g/m², 100 % polyester",
            "Stomme: lamellskiva och metall, fjäderpaket och skum",
            "Färg: ljusgrå",
            "Vikt: 45 kg",
            "Paketmått: 80 × 78 × 50 cm",
            "Montering: krävs",
            "Ingår: fåtölj och bruksanvisning",
        ],
        "villkor": ("Gungningen och vridningen är två skilda rörelser", [
            "Stolen gungar mjukt i sitt fäste, och sitsen vrider dessutom ett "
            "helt varv på foten. De två fungerar oberoende av varandra och av "
            "ryggens läge — du kan alltså snurra utan att gunga och gunga utan "
            "att luta ryggen.",
            "Ryggen är den tredje rörelsen. Den fälls till 135° och tar "
            "fotstödet med sig i samma drag, och då sträcker sig stolen till "
            "163 cm i djup mot 91 cm upprätt. Räkna med den skillnaden framför "
            "stolen, inte bara bredvid.",
        ]),
        "skotsel": [TAT_VAV, FALL_MED_RAMEN, SKOTSEL_TYG, MONTERING_FOT],
        "faq": [
            ("Hur långt bakåt går ryggen?",
             "Till 135°. Tillbakalutad är fåtöljen 163 cm djup och 80 cm hög, "
             "mot 91 cm djup och 102 cm hög upprätt."),
            ("Gungar den och snurrar den?",
             "Båda. Stolen gungar i fästet och sitsen vrider 360° på foten."),
            ("Vad betyder 310 g/m²?",
             "Det är vävens vikt per kvadratmeter. En tät väv har fler trådar "
             "per centimeter och tar därför mindre skada av klor och nötning "
             "än ett tunnare möbeltyg."),
            ("Hur högt sitter man?",
             "49 cm över golvet. Sittytan är 56,5 × 56 cm och sitsen har 10 cm "
             "stoppning."),
            ("Vem passar den?",
             "Kroppslängd 155–185 cm, och upp till 120 kg."),
            ("Hur tung är den?",
             "45 kg. Räkna med två personer när den ska bäras in."),
            ("Finns det en modell som bär mer?",
             "Ja, %s bär 150 kg och har två mugghållare."
             % lank("tv-fatolj-grabrun-gungande",
                    "gråbrun tv-fåtölj som gungar")),
        ],
    }


# ================================================================== B ======
# b72f093d — artikelnummerbas 839-974. Färgsyskon till tre publicerade sidor.
# ☠️ Källan varnar uttryckligen: gungfunktionen ska inte användas i liggläge.
def b_produkt():
    syskon = och([lank("gungande-tv-fatolj-morkbla", "mörkblå"),
                  lank("gungande-tv-fatolj-gra", "grå"),
                  lank("gungande-tv-fatolj-beige", "beige")])
    return {
        "kort": "b72f093d", "pris": 4479,
        "slug": "tv-fatolj-grabrun-gungande",
        "name": "Gungande tv-fåtölj med två mugghållare och fotstöd – gråbrun",
        "title": "Gungande tv-fåtölj gråbrun, 150 kg | Fyndplats",
        "meta": ("Gungande tv-fåtölj i gråbrun linnelook, 88 × 96 × 108 cm. "
                 "Ryggen fälls till 135°, sitsen vrider och stolen gungar. "
                 "Två mugghållare och 23 cm rygg. Bär 150 kg."),
        "sokord": "gungande tv-fåtölj",
        "ingress": (
            "<p>En tv-fåtölj i gråbrun linnelook som både gungar och vrider, "
            "med en mugghållare i vardera armstödet. Ryggen fälls till 135° med "
            "ett spänne på sidan och fotstödet fälls in igen med foten. Ryggen "
            "är 23 cm tjock och stolen bär 150 kg.</p>"),
        "eg": [
            "Gungar och vrider",
            "Ryggen fälls till 135° med ett spänne",
            "Fotstödet fälls in med foten",
            "En mugghållare i vardera armstödet",
            "48 cm bred sits på 50 cm höjd, 12 cm stoppning",
            "23 cm tjock rygg med fjäderkärna",
            "Stålram",
            "Bär 150 kg",
            "Levereras omonterad",
        ],
        "spec": [
            "Mått upprätt (B × D × H): 88 × 96 × 108 cm",
            "Mått tillbakalutad (B × D × H): 88 × 165 × 85 cm",
            "Sittyta (B × D): 48 × 56 cm",
            "Sitthöjd: 50 cm",
            "Sitsens stoppning: 12 cm",
            "Ryggstöd (B × H): 68 × 83 cm, 23 cm tjockt",
            "Ryggvinkel: upp till 135°",
            "Maxlast: 150 kg",
            "Passar kroppslängd: upp till 185 cm",
            "Klädsel: linnelook, 100 % polyester",
            "Stomme: stål, sits med fjäderkärna och skum",
            "Färg: gråbrun",
            "Vikt: 50 kg",
            "Paketmått: 76 × 67 × 49 cm",
            "Montering: krävs",
            "Ingår: fåtölj och bruksanvisning",
        ],
        "villkor": ("Gunga i sittande läge, inte i liggande", [
            "Bruksanvisningen är uttrycklig på den punkten: gungfunktionen ska "
            "inte användas när ryggen är fälld bakåt. Med ryggen nere ligger tyngden "
            "längre bak i stolen, och gungrörelsen är inte gjord för den "
            "lastfördelningen. Fäll upp ryggen först, gunga sedan.",
            "Räkna dessutom med djupet. Tillbakalutad mäter stolen 165 cm mot "
            "96 cm upprätt — nästan sjuttio centimeter mer golv framför sig.",
        ]),
        "skotsel": [LINNELOOK, FALL_MED_RAMEN, SKOTSEL_TYG, MONTERING_SKRUV],
        "faq": [
            ("Hur långt bakåt går ryggen?",
             "Till 135°, ställt med ett spänne på sidan. Tillbakalutad är "
             "fåtöljen 165 cm djup och 85 cm hög, mot 108 cm upprätt."),
            ("Får man gunga med ryggen fälld?",
             "Nej. Gungfunktionen är gjord för sittande läge; fäll upp ryggen "
             "först."),
            ("Hur många mugghållare finns det?",
             "Två, en i vardera armstödet."),
            ("Hur mycket bär den?",
             "150 kg, och den passar kroppslängd upp till 185 cm."),
            ("Hur tjock är ryggen?",
             "23 cm, med fjäderkärna. Sitsen har 12 cm stoppning."),
            ("Hur fälls fotstödet in?",
             "Med foten — du trycker ned det utan att böja dig fram."),
            ("Finns den i fler färger?",
             "Ja, samma modell finns i %s." % syskon),
        ],
    }


# ================================================================== C ======
# 54cf1f44 — ☠️ spec-tabellens 90 är LIGGANDE bredd. Ritningen säger 87.
def c_produkt():
    return {
        "kort": "54cf1f44", "pris": 3919,
        "slug": "reclinerfatolj-gra-150-kg",
        "name": "Reclinerfåtölj i grå linnelook med utfällbart fotstöd, 150 kg",
        "title": "Reclinerfåtölj grå, bär 150 kg | Fyndplats",
        "meta": ("Reclinerfåtölj i grå linnelook, 87 × 96 × 98 cm. Ryggen "
                 "ställs med handtaget på sidan och fotdelen fälls ut. "
                 "Stålstomme och 150 kg maxlast. Sitthöjd 50 cm."),
        "sokord": "reclinerfåtölj grå",
        "ingress": (
            "<p>En reclinerfåtölj i grå linnelook med stålstomme. Ryggen ställs "
            "med handtaget på sidan och fotdelen fälls ut i samma rörelse; "
            "utfälld sträcker sig stolen till 163 cm i djup. Sitsen ligger på "
            "50 cm höjd och stolen bär 150 kg.</p>"),
        "eg": [
            "Ryggen ställs med handtaget på sidan",
            "Fotdelen fälls ut med ryggen",
            "51 cm bred sits på 50 cm höjd",
            "Stomme av stål",
            "Bär 150 kg",
            "87 cm bred — smalare än de flesta reclinerfåtöljer",
            "Levereras omonterad",
        ],
        "spec": [
            "Mått upprätt (B × D × H): 87 × 96 × 98 cm",
            "Mått utfälld: 163 cm djup, 78 cm hög",
            "Sittyta (B × D): 51 × 54 cm",
            "Sitthöjd: 50 cm",
            "Ryggstöd (B × H): 86 × 46 cm, 23 cm tjockt",
            "Armstöd (B × D): 16 × 75 cm",
            "Maxlast: 150 kg",
            "Klädsel: linnelook, 100 % polyester",
            "Stomme: stål",
            "Färg: grå",
            "Vikt: 44,5 kg",
            "Paketmått: 77 × 59 × 48 cm",
            "Montering: krävs",
            "Ingår: fåtölj och bruksanvisning",
        ],
        "villkor": ("Bredden är 87 cm — mät djupet, inte bredden", [
            "Stolen tar 87 cm i bredd och 96 cm i djup när den står upprätt. "
            "Det är utfällningen som kostar plats: 163 cm i djup, alltså 67 cm "
            "mer golv framför stolen. Höjden går samtidigt ned från 98 till "
            "78 cm.",
            "Handtaget sitter på höger sida i sitsens framkant. Du drar i det "
            "och lutar dig bakåt; fotdelen följer med ut i samma rörelse och "
            "det finns inget separat läge för bara fötterna.",
        ]),
        "skotsel": [LINNELOOK, FALL_MED_RAMEN, SKOTSEL_TYG, MONTERING_SKRUV],
        "faq": [
            ("Hur mycket plats behöver den?",
             "87 cm i bredd och 96 cm i djup upprätt. Utfälld blir djupet "
             "163 cm."),
            ("Hur ställs ryggen?",
             "Med handtaget i sitsens framkant. Fotdelen fälls ut i samma "
             "rörelse."),
            ("Hur mycket bär den?",
             "150 kg. Stommen är stål och fåtöljen väger 44,5 kg."),
            ("Hur högt sitter man?",
             "50 cm över golvet. Sittytan är 51 × 54 cm."),
            ("Vad är klädseln?",
             "Linnelook i 100 % polyester — en mikrofiberväv med linnets matta "
             "yta."),
            ("Snurrar den?",
             "Nej. Den här modellen står stilla; ryggen och fotdelen är de "
             "rörliga delarna."),
            ("Finns det en modell som snurrar?",
             "Ja, %s vrider 360° och har mugghållare och sidoficka."
             % lank("tv-fatolj-sidoficka-graddvit",
                    "gräddvit tv-fåtölj med sidoficka")),
        ],
    }


# ================================================================== D ======
# acb1f904 — ☠️ "96-106H" i specen är två TILLSTÅND. Ritningen: 106 upprätt,
#            96 tillbakalutad. Och maxlasten är 100 kg — batchens lägsta.
def d_produkt():
    return {
        "kort": "acb1f904", "pris": 3919,
        "slug": "tv-fatolj-sidoficka-graddvit",
        "name": "Tv-fåtölj i gräddvitt konstläder med mugghållare och sidoficka",
        "title": "Tv-fåtölj gräddvit, sidoficka | Fyndplats",
        "meta": ("Tv-fåtölj i gräddvitt konstläder, 86 × 87 × 106 cm. Ryggen "
                 "fälls till 135°, fotstödet höjs separat och sitsen vrider "
                 "360°. Mugghållare, sidoficka. Bär 100 kg."),
        "sokord": "tv-fåtölj sidoficka",
        "ingress": (
            "<p>En tv-fåtölj i gräddvitt konstläder med mugghållare i armstödet "
            "och en sidoficka för fjärrkontroll och tidningar. Ryggen fälls till "
            "135°, fotstödet höjs separat från ryggen och sitsen vrider 360°. "
            "Hela stolen väger 22,5 kg.</p>"),
        "eg": [
            "Sidoficka och mugghållare i armstödet",
            "Ryggen fälls till 135°",
            "Fotstödet höjs separat från ryggen",
            "Sitsen vrider 360°",
            "47 cm bred sits på 48 cm höjd, 11 cm stoppning",
            "Väger 22,5 kg",
            "Bär 100 kg",
            "Levereras omonterad",
        ],
        "spec": [
            "Mått upprätt (B × D × H): 86 × 87 × 106 cm",
            "Mått tillbakalutad: 140 cm djup, 96 cm hög",
            "Sittyta (B × D): 47 × 54 cm",
            "Sitthöjd: 48 cm",
            "Sitsens tjocklek: 11 cm",
            "Ryggstöd (B × H): 64 × 78 cm, 13 cm tjockt",
            "Armstödets bredd: 17 cm",
            "Ryggvinkel: upp till 135°",
            "Rotation: 360°",
            "Maxlast: 100 kg",
            "Klädsel: konstläder",
            "Stomme: metall med skumstoppning",
            "Färg: gräddvit",
            "Vikt: 22,5 kg",
            "Paketmått: 78,5 × 66,5 × 57 cm",
            "Montering: krävs",
            "Ingår: fåtölj och bruksanvisning",
        ],
        "villkor": ("Maxlasten är 100 kg — läs den innan du väljer", [
            "Hundra kilo är lägre än på de flesta reclinerfåtöljer, och det är "
            "den siffra som avgör om stolen passar. Är gränsen för snäv bär "
            "%s 120 kg och %s 150 kg."
            % (lank("fatolj-tat-vav-ljusgra-135-grader",
                    "den ljusgrå fåtöljen i tät väv"),
               lank("reclinerfatolj-gra-150-kg", "den grå reclinerfåtöljen")),
            "Fotstödet höjs för sig, oberoende av ryggen. Du kan alltså lägga "
            "upp fötterna med ryggen kvar i upprätt läge — praktiskt vid ett "
            "skrivbord eller framför en tv. Tillbakalutad mäter stolen 140 cm "
            "i djup mot 87 cm upprätt.",
        ]),
        "skotsel": [KONSTLADER, SKOTSEL_KONSTLADER, MONTERING_FOT],
        "faq": [
            ("Hur mycket bär den?",
             "100 kg. Det är lägre än de flesta reclinerfåtöljer, så läs den "
             "siffran innan du väljer."),
            ("Höjs fotstödet separat?",
             "Ja. Fotstödet och ryggen ställs var för sig."),
            ("Snurrar den?",
             "Ja, sitsen vrider 360°."),
            ("Vad rymmer sidofickan?",
             "Fjärrkontroller, tidningar och liknande. Det finns dessutom en "
             "mugghållare i armstödet."),
            ("Hur mycket plats behöver den?",
             "86 cm i bredd och 87 cm i djup upprätt. Tillbakalutad blir djupet "
             "140 cm."),
            ("Är klädseln skinn?",
             "Nej, det är konstläder — en plastbelagd väv. Den torkas av med en "
             "fuktad trasa."),
            ("Finns det en modell som bär mer?",
             "Ja, %s bär 150 kg."
             % lank("reclinerfatolj-gra-150-kg", "grå reclinerfåtölj")),
        ],
    }


# ================================================================== E ======
# e57125fb — väggnära: 15 cm räcker för att fälla ut den helt.
def e_produkt():
    return {
        "kort": "e57125fb", "pris": 4149,
        "slug": "vaggnara-fatolj-brun-150-grader",
        "name": "Väggnära fåtölj i brun linnelook, 150° och 15 cm från väggen",
        "title": "Väggnära fåtölj brun, 150° | Fyndplats",
        "meta": ("Väggnära fåtölj i brun linnelook, 85 × 93 × 105 cm. Ryggen "
                 "fälls till 150° med bara 15 cm fritt bakom stolen. "
                 "Synkat fotstöd och 22 cm rygg. Bär 120 kg."),
        "sokord": "väggnära fåtölj",
        "ingress": (
            "<p>En fåtölj i brun linnelook som fälls ut framåt i stället för "
            "bakåt: det räcker med 15 cm fritt bakom stolen för att ta ryggen "
            "hela vägen till 150°. Fotstödet följer ryggen synkroniserat, och "
            "ryggkudden är 22 cm tjock.</p>"),
        "eg": [
            "Bara 15 cm fritt bakom stolen behövs",
            "Ryggen fälls till 150° med ett dragband",
            "Fotstödet följer ryggen synkroniserat",
            "22 cm tjock rygg med fiberfyllning",
            "50 cm bred sits på 50 cm höjd",
            "Fjäderkärna under sitsen",
            "Metallstomme",
            "Bär 120 kg",
            "Levereras omonterad",
        ],
        "spec": [
            "Mått upprätt (B × D × H): 85 × 93 × 105 cm",
            "Mått tillbakalutad (B × D × H): 85 × 163 × 83 cm",
            "Sittyta (B × D): 50 × 53 cm",
            "Sitthöjd: 50 cm",
            "Ryggstöd (B × H): 77 × 58 cm, 22 cm tjockt",
            "Armstöd: 57 cm långt, 14 cm över sitsen",
            "Ryggvinkel: upp till 150°",
            "Väggavstånd: 15 cm",
            "Maxlast: 120 kg",
            "Klädsel: linnelook, 100 % polyester",
            "Stomme: metall, fjäderkärna och skum",
            "Färg: brun",
            "Vikt: 41,5 kg",
            "Paketmått: 76 × 66 × 48 cm",
            "Montering: krävs",
            "Ingår: fåtölj och bruksanvisning",
        ],
        "villkor": ("Femton centimeter bakom, men 163 framför", [
            "Väggnära betyder att stolen glider framåt när ryggen går ned, i "
            "stället för att ryggen svänger bakåt. Det är därför 15 cm räcker "
            "mellan ryggen och väggen — jämför med 50 eller 60 cm på en vanlig "
            "reclinerfåtölj.",
            "Platsen tas i stället framåt. Utfälld sträcker sig stolen till "
            "163 cm i djup mot 93 cm upprätt, och höjden går ned från 105 till "
            "83 cm. Mät framför stolen, inte bakom.",
        ]),
        "skotsel": [LINNELOOK, FALL_MED_RAMEN, SKOTSEL_TYG, MONTERING_SKRUV],
        "faq": [
            ("Hur nära väggen kan den stå?",
             "15 cm. Stolen glider framåt när ryggen fälls, i stället för att "
             "svänga bakåt."),
            ("Hur långt bakåt går ryggen?",
             "Till 150°. Tillbakalutad är fåtöljen 163 cm djup och 83 cm hög, "
             "mot 105 cm upprätt."),
            ("Går fotstödet att ställa för sig?",
             "Nej. Fotstödet är synkroniserat med ryggen och följer den."),
            ("Hur tjock är ryggen?",
             "22 cm, med fiberfyllning över skummet."),
            ("Hur mycket bär den?",
             "120 kg. Stommen är metall och fåtöljen väger 41,5 kg."),
            ("Vad är klädseln?",
             "Linnelook i 100 % polyester — en luftig mikrofiberväv."),
            ("Finns det en modell som går längre bak?",
             "150° är den flataste vinkeln i den här omgången. %s bär i "
             "gengäld 150 kg."
             % lank("reclinerfatolj-gra-150-kg", "Grå reclinerfåtölj")),
        ],
    }


# ================================================================== F ======
# b1e98da4 — artikelnummerbas 833-360. Färgsyskon till den publicerade svarta.
# ☠️ Källan säger "Massagestuhl" i en mening om vredet. Ingen massagefunktion.
# ⚠️ 112 × 84 cm tillbakalutad står BARA på måttritningen.
def f_produkt():
    return {
        "kort": "b1e98da4", "pris": 2079,
        "slug": "snurrfatolj-ljusgra-med-fotpall",
        "name": "Snurrfåtölj i ljusgrått konstläder med fotpall – ryggen låses med vred",
        "title": "Snurrfåtölj ljusgrå med fotpall | Fyndplats",
        "meta": ("Snurrfåtölj i ljusgrått konstläder med fotpall, "
                 "78 × 67 × 98 cm. Ryggen fälls och låses med ett vred, "
                 "sitsen vrider 360° på rund fot. Väger 18 kg, bär 120 kg."),
        "sokord": "snurrfåtölj med fotpall",
        "ingress": (
            "<p>En snurrfåtölj i ljusgrått konstläder med matchande fotpall, "
            "båda på en rund fot. Ryggen fälls bakåt och låses i läget med ett "
            "vred, så den stannar där du ställer den. Hela fåtöljen tar bara "
            "78 × 67 cm i golvyta och väger 18 kg.</p>"),
        "eg": [
            "Ryggen låses i sitt läge med ett vred",
            "Sitsen vrider 360°",
            "Fotpall ingår, 43 × 38 cm",
            "Liten golvyta: 78 × 67 cm",
            "52 cm bred sits på 48 cm höjd",
            "Rund fot, Ø 60 cm",
            "Väger 18 kg",
            "Bär 120 kg — fotpallen 100 kg",
            "Levereras omonterad",
        ],
        "spec": [
            "Mått upprätt (B × D × H): 78 × 67 × 98 cm",
            "Mått tillbakalutad: 112 cm djup, 84 cm hög",
            "Sittyta (B × D): 52 × 52 cm",
            "Sitthöjd: 48 cm",
            "Fotens diameter: Ø 60 cm",
            "Fotpall (B × D × H): 43 × 38 × 41,5 cm",
            "Rotation: 360°",
            "Maxlast: 120 kg för fåtöljen, 100 kg för fotpallen",
            "Klädsel: konstläder",
            "Stomme: stål och trä med skumstoppning",
            "Färg: ljusgrå",
            "Vikt: 18 kg",
            "Paketmått: 77 × 66 × 42,5 cm",
            "Montering: krävs",
            "Ingår: fåtölj och fotpall",
        ],
        "villkor": ("Vredet låser ryggen — den fjädrar inte tillbaka", [
            "Ryggen sitter inte i fasta hack. Du lutar den dit du vill ha den "
            "och drar åt vredet, och då står den kvar i exakt det läget. Vill "
            "du kunna vagga fram och tillbaka lossar du vredet i stället.",
            "Foten är rund och 60 cm i diameter, alltså bredare än stolens "
            "sittdel. Det är den som ger stabiliteten när ryggen är fälld — "
            "tillbakalutad mäter stolen 112 cm i djup mot 67 cm upprätt.",
        ]),
        "skotsel": [KONSTLADER, SKOTSEL_KONSTLADER, MONTERING_FOT],
        "faq": [
            ("Hur ställs ryggen?",
             "Du lutar den och låser läget med ett vred. Ryggen stannar där du "
             "ställer den."),
            ("Ingår fotpallen?",
             "Ja. Den mäter 43 × 38 cm och är 41,5 cm hög."),
            ("Snurrar den?",
             "Ja, sitsen vrider 360° på den runda foten."),
            ("Hur mycket plats behöver den?",
             "78 × 67 cm upprätt. Tillbakalutad blir djupet 112 cm."),
            ("Hur mycket bär den?",
             "120 kg fåtöljen och 100 kg fotpallen."),
            ("Är klädseln skinn?",
             "Nej, det är konstläder — en plastbelagd väv. Den torkas av med en "
             "fuktad trasa."),
            ("Finns den i fler färger?",
             "Ja, samma modell finns i %s."
             % lank("konstladerfatolj-med-fotpall-svart", "svart")),
        ],
    }


# ================================================================== G ======
# b67fdc2b — artikelnummerbas 833-359. Färgsyskon till tre publicerade sidor.
def g_produkt():
    syskon = och([lank("vilfatolj-graddvit-med-fotpall", "gräddvit"),
                  lank("vilfatolj-morkgra-med-fotpall", "mörkgrå"),
                  lank("tv-fatolj-forvaringspall-145", "svart")])
    return {
        "kort": "b67fdc2b", "pris": 2579,
        "slug": "vilfatolj-grabrun-med-fotpall",
        "name": "Vilfåtölj med fotpall och dolt förvaringsfack, 145° – gråbrun",
        "title": "Vilfåtölj gråbrun med fotpall, 145° | Fyndplats",
        "meta": ("Vilfåtölj i gråbrunt konstläder med fotpall och dolt "
                 "förvaringsfack, 80 × 86 × 99 cm. Ryggen fälls till 145° och "
                 "sitsen vrider 360° på en träfot. Bär 120 kg."),
        "sokord": "vilfåtölj med fotpall",
        "ingress": (
            "<p>En vilfåtölj i gråbrunt konstläder med knappad rygg, på en "
            "kryssfot av trä. Fotpallen ingår och har ett dolt fack under "
            "sitsen på 40 × 34 cm. Ryggen fälls till 145° och sitsen vrider "
            "360°.</p>"),
        "eg": [
            "Fotpall med dolt förvaringsfack, 40 × 34 × 6 cm",
            "Ryggen fälls till 145°",
            "Sitsen vrider 360°",
            "Kryssfot av trä under både fåtölj och fotpall",
            "Knappad rygg",
            "50 cm bred sits på 47 cm höjd",
            "Bär 120 kg — fotpallen 100 kg",
            "Levereras omonterad",
        ],
        "spec": [
            "Mått i sittläge (B × D × H): 80 × 86 × 99 cm",
            "Mått i liggläge (B × D × H): 80 × 107 × 96 cm",
            "Sittyta (B × D): 50 × 52 cm",
            "Sitthöjd: 47 cm",
            "Ryggstöd (B × H): 50 × 71 cm",
            "Fotpall (B × D × H): 47 × 42 × 45 cm",
            "Förvaringsfack (B × D × H): 40 × 34 × 6 cm",
            "Ryggvinkel: upp till 145°",
            "Rotation: 360°",
            "Maxlast: 120 kg för fåtöljen, 100 kg för fotpallen",
            "Klädsel: konstläder",
            "Stomme: trä med skumstoppning",
            "Färg: gråbrun",
            "Vikt: 24 kg",
            "Paketmått: 81 × 61 × 47 cm",
            "Montering: krävs",
            "Ingår: fåtölj, fotpall och monteringsanvisning",
        ],
        "villkor": ("Facket sitter i fotpallen, inte i fåtöljen", [
            "Fotpallens sits lyfts av och under den ligger ett fack på "
            "40 × 34 cm med 6 cm djup. Det rymmer fjärrkontroller, glasögon "
            "och en tidning — inte filtar. Sex centimeter är höjden att räkna "
            "med.",
            "Fotpallen bär 100 kg mot fåtöljens 120. Den är alltså till för "
            "fötterna och inte en extra sittplats, och locket är dessutom "
            "avtagbart snarare än gångjärnsfäst.",
        ]),
        "skotsel": [KONSTLADER, SKOTSEL_KONSTLADER, MONTERING_FOT],
        "faq": [
            ("Hur långt bakåt går ryggen?",
             "Till 145°. I liggläge är fåtöljen 107 cm djup och 96 cm hög, mot "
             "86 cm djup och 99 cm hög i sittläge."),
            ("Vad rymmer förvaringsfacket?",
             "Facket är 40 × 34 cm och 6 cm djupt, och sitter under fotpallens "
             "sits."),
            ("Får man sitta på fotpallen?",
             "Nej. Fotpallen är gjord för 100 kg och avsedd för fötterna. "
             "Fåtöljen bär 120 kg."),
            ("Snurrar den?",
             "Ja, sitsen vrider 360° på träkorset."),
            ("Vad är foten gjord av?",
             "Trä, under både fåtöljen och fotpallen."),
            ("Är klädseln skinn?",
             "Nej, det är konstläder — en plastbelagd väv. Den torkas av med en "
             "fuktad trasa."),
            ("Finns den i fler färger?",
             "Ja, samma modell finns i %s." % syskon),
        ],
    }


# ================================================================== H ======
# 7eee41b6 — BÄDDFÅTÖLJ. ☠️ Källan säger tre olika tyger; fotot avgör.
def h_produkt():
    return {
        "kort": "7eee41b6", "pris": 1969,
        "slug": "baddfatolj-65-cm-fem-lagen",
        "name": "Bäddfåtölj 65 cm i grå väv med rygg i fem lägen och bädd på 185,5 cm",
        "title": "Bäddfåtölj 65 cm, fem lägen | Fyndplats",
        "meta": ("Bäddfåtölj i grå väv, 65 × 69 × 80 cm som fåtölj och "
                 "185,5 × 60 cm som bädd. Ryggen har fem lägen, ramen är "
                 "pulverlackerad metall. Bär 120 kg."),
        "sokord": "bäddfåtölj 65 cm",
        "ingress": (
            "<p>En bäddfåtölj i grå väv som tar 65 × 69 cm i golvyta som stol "
            "och blir en bädd på 185,5 × 60 cm när ryggen läggs ned. Ryggen har "
            "fem lägen däremellan, och kuddöverdraget går att ta av och tvätta. "
            "Ramen är pulverlackerad metall.</p>"),
        "eg": [
            "Blir en bädd på 185,5 × 60 cm",
            "Ryggen har fem lägen",
            "Bara 65 cm bred som fåtölj",
            "Avtagbart kuddöverdrag",
            "Prydnadskudde ingår",
            "Pulverlackerad metallram",
            "60 cm bred sits på 37 cm höjd",
            "Väger 19,5 kg",
            "Bär 120 kg",
            "Levereras omonterad",
        ],
        "spec": [
            "Mått som fåtölj (B × D × H): 65 × 69 × 80 cm",
            "Mått som bädd (L × B × H): 185,5 × 60 × 25 cm",
            "Sittyta (B × D): 60 × 60 cm",
            "Sitthöjd: 37 cm",
            "Ryggens lägen: fem",
            "Maxlast: 120 kg",
            "Klädsel: matt väv, 100 % polyester",
            "Stomme: pulverlackerad metall med skumstoppning",
            "Färg: grå",
            "Vikt: 19,5 kg",
            "Paketmått: 125 × 61 × 20 cm",
            "Montering: krävs",
            "Ingår: bäddfåtölj, prydnadskudde och monteringsanvisning",
        ],
        "villkor": ("Bädden är 60 cm bred — en plats, inte två", [
            "Utfälld mäter bädden 185,5 × 60 cm och ligger 25 cm över golvet. "
            "Sextio centimeter är smalare än en vanlig enkelsäng på 90 cm, så "
            "räkna med en gäst och en natt eller två — inte med en permanent "
            "sovplats.",
            "Som stol tar den 65 × 69 cm, alltså mindre golvyta än de flesta "
            "fåtöljer. Sitthöjden är 37 cm, en bit under en vanlig stol, och "
            "sitsen är 60 × 60 cm.",
        ]),
        "skotsel": [
            "Klädseln är en matt väv i 100 % polyester. Kuddöverdraget går att "
            "dra av och tvätta; följ tvättrådet i sömmen.",
            SKOTSEL_TYG,
            "Fäll ryggen med båda händerna på ramen, inte genom att dra i "
            "klädseln. Mekanismen är pulverlackerad metall och tål greppet; "
            "tyget gör det inte i längden.",
            "Bäddfåtöljen kommer i delar och skruvas ihop hemma. Benen skruvas "
            "fast i ramen; dra åt alla skruvar innan du sätter dig första "
            "gången, och efterdra dem efter någon månads användning.",
        ],
        "faq": [
            ("Hur stor blir bädden?",
             "185,5 × 60 cm, och den ligger 25 cm över golvet."),
            ("Hur många lägen har ryggen?",
             "Fem, från upprätt sittläge till helt nedfälld bädd."),
            ("Går överdraget att tvätta?",
             "Kuddöverdraget går att ta av. Följ tvättrådet i sömmen."),
            ("Hur mycket plats tar den som stol?",
             "65 × 69 cm i golvyta och 80 cm i höjd."),
            ("Ingår det en kudde?",
             "Ja, en prydnadskudde ingår."),
            ("Hur mycket bär den?",
             "120 kg. Ramen är pulverlackerad metall och möbeln väger 19,5 kg."),
            ("Passar den som permanent säng?",
             "Nej. Bädden är 60 cm bred mot en enkelsängs 90, så den är gjord "
             "för en gäst några nätter."),
        ],
    }


# ------------------------------------------------------------- batchen ---
PRODUKTER = [
    a_produkt(), b_produkt(), c_produkt(), d_produkt(),
    e_produkt(), f_produkt(), g_produkt(), h_produkt(),
]
