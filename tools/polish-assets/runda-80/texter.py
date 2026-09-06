# -*- coding: utf-8 -*-
"""Runda 80 — fyra snurrfåtöljer på fast fot och fyra kontorsstolar på hjul.

☠️ Batch 64 mätte skillnaden: fem produkter skrivna inline i API-anropet gav
NIO fel som nådde Wix, tre skrivna via fil gav noll. Texten skrivs därför HÄR.

☠️ `b9ab45db` HETER `Arbeitshocker Drehhocker` HOS KÄLLAN och är en
   SNURRFÅTÖLJ med armstöd på en rund kromad fot, helt utan hjul. Runda 79
   flaggade den på måtten; bilden avgjorde. Produkttypen läses ur BILDEN när
   källans namn och källans mått säger olika saker.

☠️ VIKTEN UTELÄMNAS PÅ TRION. Källan anger 10,4 kg (tysk text på `b9ab45db`),
   10,7 kg (dess svenska rad) och 12,9 kg (de två syskonen) för vad bilderna
   visar är samma stol. Tre tal, ingen skiljedomare — då anges inget.

⚠️ SITTHÖJDEN ÄR 45–57 CM PÅ ALLA TRE. `b9ab45db` säger 44,5–57; syskonen
   säger 45–57. Två källor mot en, och den avvikande är samma rad som bär fel
   produktnamn.

☠️ INGEN AV DE FYRA SNURRFÅTÖLJERNA HAR HJUL. De står på en rund fot. Ordet
   `hjul` får inte förekomma i deras text — linten fäller.

☠️ `ergonomisk` FÅR INTE FÖREKOMMA. Källan kallar tre av åtta ergonomiska utan
   att bära någon certifiering.

☠️ FYRA HÄLSOPÅSTÅENDEN STRUKNA: att stolen "lindert Druckpunkte", "mindert
   Ermüdungserscheinungen", "hilft Arbeitsspannungen abzubauen" och att
   ryggstödet ger "umfassende Unterstützung für Ihren gesamten Rücken". Kvar
   står formen och måtten.

⚠️ `7046314f` säljs av källan som barnrumsmöbel ("Blickfang in jedem Kinder-
   und Jugendzimmer") men bär ingen barnstolsnorm. Vi säljer den som stol, inte
   som barnmöbel, och nämner ingen ålder.
"""

BAS = "https://www.fyndplats.se/produkt/"

# Publicerade sidor vi länkar till. Talen är LÄSTA på dem, inte gissade.
PUBL_SNURRSTOL = ("snurrstol-gra-fast-fot", "67 × 68 cm")
PUBL_HJARTRYGG = "skrivbordsstol-rosa-hjartrygg"
PUBL_RECLINER = ("reclinerfatolj-svart-med-fotpall", "150 kg")
PUBL_BOUCLE = "kontorsstol-benvit-boucle"


def lank(slug, text):
    return '<a href="%s%s">%s</a>' % (BAS, slug, text)


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


def maxlast(kg, extra=None, ordet="Stolen"):
    st = ["%s är provad för %d kg. Talet gäller EN person som sitter, inte att "
          "stå på sitsen — en stol med gaslyft är ingen trappstege." % (ordet, kg)]
    if extra:
        st.append(extra)
    st.append("Efterdra skruvarna efter någon månads användning. Det är den "
              "enskilt vanligaste orsaken till att en stol börjar glappa, och "
              "det tar en minut.")
    return ("Bär %d kg" % kg, st)


GASLYFT_FAQ = ("Hur ställer jag in höjden?",
               "Med spaken under sitsen. Lyft den medan du står upp så går "
               "stolen upp, tryck den medan du sitter så går den ner. "
               "Gaslyften stannar där du släpper.")
MONTERING_FAQ = ("Behöver den monteras?",
                 "Ja. Sits, rygg, gaslyft och fot sätts ihop med den insexnyckel "
                 "som ligger i kartongen. Bruksanvisning ingår.")
TYG_SKOTSEL = ("Tyget dammsugs med möbelmunstycke och fläckar tas med ljummet "
               "vatten och lite diskmedel på en urvriden trasa. Låt ytan torka "
               "innan du sätter dig igen — fuktigt tyg drar åt sig smuts.")
KONSTLADER_SKOTSEL = ("Konstlädret torkas av med en fuktig trasa och lite "
                      "diskmedel. Undvik lösningsmedel och sprit — de torkar ut "
                      "ytan och gör den spröd med tiden.")


# Trion delar allt utom kulören. Specen byggs EN gång och färgas per stol, så
# två syskon inte kan glida isär på ett mått.
def trio_spec(farg):
    return [
        "Mått (B × D × H): 60 × 60 × 79–91 cm",
        "Sits (B × D): 47 × 46 cm",
        "Sitthöjd: 45–57 cm",
        "Ryggstöd (B × H): 46 × 35,5 cm",
        "Armstödshöjd från golv: 65–77 cm",
        "Vridning: 360°",
        "Maxlast: 136 kg",
        "Klädsel: linnelookat polyester",
        "Stomme: stål med skumstoppning",
        "Höjdreglering: gaslyft",
        "Fot: rund, kromad — inga hjul",
        "Färg: %s" % farg,
        "Montering: krävs",
        "Ingår: snurrfåtölj och bruksanvisning",
    ]


def trio_eg(farg):
    return [
        "U-formad rygg som möter både rygg och skuldror",
        "Stoppade armstöd och en lös ryggkudde ingår",
        "Sitthöjd 45–57 cm med gaslyft",
        "Rund kromad fot — står stilla, rullar inte",
        "Snurrar 360°",
        "Bär 136 kg",
    ]


TRIO_SKOTSEL = [
    TYG_SKOTSEL,
    "Ryggkudden är lös och går att lyfta ur när du dammsuger. Vänd den då och "
    "då så slits båda sidorna lika.",
    "Foten är kromad och tål vatten och diskmedel, men inte skurmedel — repor i "
    "kromet syns direkt och går inte att polera bort.",
]

TRIO_VILLKOR_EXTRA = (
    "Foten är rund och tar mindre golvyta än ett femarmat kryss, men den har "
    "också kortare hävarm mot att tippa. Res dig rakt upp i stället för att "
    "skjuta ifrån åt sidan, så står stolen stadigt.")


PRODUKTER = [
    # ==================================== S · SNURRFÅTÖLJER, FAST FOT (4) ===
    {
        "kort": "b9ab45db", "pris": 1449,
        "slug": "snurrfatolj-ljusgra-linnelook-fast-fot",
        "name": "Snurrfåtölj ljusgrå i linnelook – fast fot, sitthöjd 45–57 cm",
        "title": "Snurrfåtölj ljusgrå med fast fot | Fyndplats",
        "meta": "Ljusgrå snurrfåtölj i linnelookat tyg med U-formad rygg och lös "
                "ryggkudde. Sitthöjd 45–57 cm, rund kromad fot utan hjul, "
                "snurrar 360°, bär 136 kg.",
        "ingress":
            "<p>En <strong>snurrfåtölj</strong> som varken är en kontorsstol eller "
            "en vanlig fåtölj. Ryggen är U-formad och möter både korsryggen och "
            "skuldrorna, armstöden är stoppade, och en lös ryggkudde följer med — "
            "men höjden ställs med gaslyft och sitsen snurrar hela varvet.</p>"
            "<p>Foten är rund och kromad. Det finns <em>inga hjul</em>: stolen står "
            "där du ställer den och snurrar på stället. Det gör den lika hemma vid "
            "ett skrivbord som i ett vardagsrumshörn.</p>"
            "<p>Samma fåtölj finns i "
            + lank("snurrfatolj-morkgra-linnelook-fast-fot", "mörkgrått")
            + " och " + lank("snurrfatolj-svart-linnelook-fast-fot", "svart")
            + ".</p>",
        "eg": trio_eg("ljusgrå"),
        "spec": trio_spec("ljusgrå"),
        "villkor": maxlast(136, TRIO_VILLKOR_EXTRA),
        "skotsel": TRIO_SKOTSEL,
        "faq": [
            GASLYFT_FAQ,
            ("Har den hjul?",
             "Nej. Foten är en rund kromad platta och stolen står stilla. Vill du "
             "kunna rulla mellan skrivbord och hylla är det en annan modell."),
            ("Vad skiljer den från de andra två?",
             "Bara kulören. Mått, sitthöjd, ryggstöd och maxlast är identiska på "
             + lank("snurrfatolj-morkgra-linnelook-fast-fot", "den mörkgrå")
             + " och " + lank("snurrfatolj-svart-linnelook-fast-fot", "den svarta")
             + "."),
            MONTERING_FAQ,
        ],
    },
    {
        "kort": "0fe80797", "pris": 1419,
        "slug": "snurrfatolj-morkgra-linnelook-fast-fot",
        "name": "Snurrfåtölj mörkgrå i linnelook – fast fot, sitthöjd 45–57 cm",
        "title": "Snurrfåtölj mörkgrå med fast fot | Fyndplats",
        "meta": "Mörkgrå snurrfåtölj i linnelookat tyg med U-formad rygg och lös "
                "ryggkudde. Sitthöjd 45–57 cm, rund kromad fot utan hjul, "
                "snurrar 360°, bär 136 kg.",
        "ingress":
            "<p>Den mörkgrå <strong>snurrfåtöljen</strong> — samma stol som den "
            "ljusgrå, i en kulör som tål mer innan den ser sliten ut. Den U-formade "
            "ryggen möter både korsryggen och skuldrorna, och den lösa ryggkudden "
            "går att flytta dit du vill ha stödet.</p>"
            "<p>Foten är rund och kromad, utan hjul. Stolen snurrar 360° på stället "
            "i stället för att rulla iväg, och den lämnar inga spår efter sig på "
            "ett trägolv.</p>"
            "<p>Samma fåtölj finns i "
            + lank("snurrfatolj-ljusgra-linnelook-fast-fot", "ljusgrått")
            + " och " + lank("snurrfatolj-svart-linnelook-fast-fot", "svart")
            + ".</p>",
        "eg": trio_eg("mörkgrå"),
        "spec": trio_spec("mörkgrå"),
        "villkor": maxlast(136, TRIO_VILLKOR_EXTRA),
        "skotsel": TRIO_SKOTSEL,
        "faq": [
            GASLYFT_FAQ,
            ("Har den hjul?",
             "Nej. Foten är en rund kromad platta och stolen står stilla. Den "
             "snurrar 360° på stället."),
            ("Är den mörkare än den ljusgrå?",
             "Ja, tydligt. Båda är gråa, men den här går åt det mörkare hållet — "
             "jämför gärna bilderna på "
             + lank("snurrfatolj-ljusgra-linnelook-fast-fot", "den ljusgrå") + "."),
            MONTERING_FAQ,
        ],
    },
    {
        "kort": "57ae1ddf", "pris": 1459,
        "slug": "snurrfatolj-svart-linnelook-fast-fot",
        "name": "Snurrfåtölj svart i linnelook – fast fot, sitthöjd 45–57 cm",
        "title": "Snurrfåtölj svart med fast fot | Fyndplats",
        "meta": "Svart snurrfåtölj i linnelookat tyg med U-formad rygg och lös "
                "ryggkudde. Sitthöjd 45–57 cm, rund kromad fot utan hjul, "
                "snurrar 360°, bär 136 kg.",
        "ingress":
            "<p>Den svarta <strong>snurrfåtöljen</strong> i seriens tre kulörer. "
            "Samma U-formade rygg, samma stoppade armstöd och samma lösa "
            "ryggkudde — i den kulör som är minst känslig för fläckar och som "
            "passar in i ett rum där resten redan är mörkt.</p>"
            "<p>Foten är rund och kromad, utan hjul, och den kromade ytan är det "
            "enda som lyser mot det svarta tyget. Stolen snurrar 360° men står "
            "kvar där du ställt den.</p>"
            "<p>Samma fåtölj finns i "
            + lank("snurrfatolj-ljusgra-linnelook-fast-fot", "ljusgrått")
            + " och " + lank("snurrfatolj-morkgra-linnelook-fast-fot", "mörkgrått")
            + ".</p>",
        "eg": trio_eg("svart"),
        "spec": trio_spec("svart"),
        "villkor": maxlast(136, TRIO_VILLKOR_EXTRA),
        "skotsel": TRIO_SKOTSEL,
        "faq": [
            GASLYFT_FAQ,
            ("Har den hjul?",
             "Nej. Foten är en rund kromad platta och stolen står stilla. Den "
             "snurrar 360° på stället."),
            ("Bär den mer än en vanlig kontorsstol?",
             "136 kg är mer än vad som är vanligt. Behöver du ännu mer marginal "
             "finns " + lank("kontorsstol-big-and-tall-150-kg",
                    "kontorsstolen på hjul som bär 150 kg") + "."),
            MONTERING_FAQ,
        ],
    },
    {
        "kort": "558eb67a", "pris": 2579,
        "slug": "reclinerfatolj-fotpall-svart-rund-fot",
        "name": "Reclinerfåtölj med fotpall – svart konstläder, rygg till 130°",
        "title": "Reclinerfåtölj med fotpall, svart | Fyndplats",
        "meta": "Reclinerfåtölj i svart konstläder med matchande fotpall. Ryggen "
                "fälls till 130°, sitsen snurrar 360° och stoppningen är 10 cm. "
                "Bär 150 kg, fotpallen 50 kg.",
        "ingress":
            "<p>En <strong>reclinerfåtölj</strong> med tillhörande fotpall, båda i "
            "svart konstläder på runda svarta fötter. Ryggen fälls bakåt till 130° "
            "och sitsen snurrar 360°, så du kommer åt att luta dig tillbaka utan "
            "att flytta stolen.</p>"
            "<p>Stoppningen är 10 cm i både sits och rygg, och armstöden är breda. "
            "Upprätt tar fåtöljen 70 × 79 cm; tillbakalutad växer djupet till "
            "105 cm — mät bakom stolen innan du bestämmer plats.</p>"
            "<p>Vi har också "
            + lank(PUBL_RECLINER[0],
                   "en reclinerfåtölj med fotpall på träfötter som bär "
                   + PUBL_RECLINER[1])
            + ".</p>",
        "eg": [
            "Två delar: fåtölj och matchande fotpall",
            "Ryggen fälls bakåt till 130°",
            "Sitsen snurrar 360°",
            "10 cm stoppning i både sits och rygg",
            "Höga armstöd, 47 × 12 cm",
            "Bär 150 kg, fotpallen 50 kg",
        ],
        "spec": [
            "Mått upprätt (B × D × H): 70 × 79 × 105 cm",
            "Mått tillbakalutad (B × D × H): 70 × 105 × 95 cm",
            "Fotpall (B × D × H): 42 × 35 × 45 cm",
            "Sits (B × D × H): 48 × 50 × 46 cm",
            "Sitsens tjocklek: 10 cm",
            "Ryggstöd (B × H): 54 × 69 cm",
            "Ryggens tjocklek: 10 cm",
            "Armstöd (L × B): 47 × 12 cm",
            "Armstödshöjd från sitsen: 16 cm",
            "Ryggens lutning: upp till 130°",
            "Vridning: 360°",
            "Maxlast: 150 kg (fåtölj), 50 kg (fotpall)",
            "Klädsel: konstläder",
            "Fot: rund — inga hjul",
            "Färg: svart",
            "Montering: krävs",
            "Ingår: reclinerfåtölj, fotpall och bruksanvisning",
        ],
        "villkor": maxlast(150,
            "Fotpallen bär 50 kg och är gjord för ben, inte för att sitta på. "
            "Den har ingen rygg och tippar om någon sätter sig på kanten.",
            ordet="Fåtöljen"),
        "skotsel": [
            KONSTLADER_SKOTSEL,
            "Fäll tillbaka ryggen helt innan du flyttar fåtöljen. Lyft i stommen, "
            "aldrig i ryggstödet — det är fjädrat och tar inte hela stolens vikt.",
            "Fotpallen väger lite och glider lätt på hårt golv. Filttassar under "
            "foten håller den still och skyddar golvet samtidigt.",
        ],
        "faq": [
            ("Ingår fotpallen i priset?",
             "Ja. Fåtölj och fotpall ligger i samma leverans och priset gäller "
             "båda."),
            ("Hur mycket plats behöver den bakåt?",
             "Djupet växer från 79 cm upprätt till 105 cm tillbakalutad. Räkna "
             "med 105 cm från väggen om ryggen ska kunna fällas helt."),
            ("Går ryggen att låsa i ett mellanläge?",
             "Ryggen fälls till 130° och hålls av din egen tyngd mot ryggstödet. "
             "Det finns ingen spärr som låser ett bestämt mellanläge."),
            MONTERING_FAQ,
        ],
    },
    # ====================================== K · KONTORSSTOLAR PÅ HJUL (4) ===
    {
        "kort": "7046314f", "pris": 1199,
        "slug": "skrivbordsstol-rosa-hel-hjartrygg",
        "name": "Skrivbordsstol rosa med hel hjärtrygg – sitthöjd 43–53 cm",
        "title": "Skrivbordsstol rosa med hjärtrygg | Fyndplats",
        "meta": "Rosa skrivbordsstol med hel hjärtformad rygg i linnelookat tyg. "
                "Sitthöjd 43–53 cm, rund stoppad sits, vit femarmad fot med "
                "hjul, snurrar 360°, bär 120 kg.",
        "ingress":
            "<p>En <strong>skrivbordsstol</strong> med ryggen formad som ett helt "
            "hjärta i platt linnelookat tyg. Sitsen är rund och mjukt stoppad, "
            "kanterna är avrundade, och foten är vit med fem hjul.</p>"
            "<p>Sitthöjden går 43–53 cm, alltså lägre än en vanlig kontorsstol. "
            "Det passar ett lägre bord — mät bordshöjden innan du beställer.</p>"
            "<p>Vi har också "
            + lank(PUBL_HJARTRYGG,
                   "en rosa skrivbordsstol med urholkad hjärtrygg i bouclétyg")
            + ", som är en annan modell med en annan sits.</p>",
        "eg": [
            "Hel hjärtformad rygg, 35 cm hög över sitsen",
            "Rund mjukt stoppad sits 42 × 40 cm",
            "Sitthöjd 43–53 cm med gaslyft",
            "Vit femarmad fot med fem hjul",
            "Avrundade kanter",
            "Bär 120 kg",
        ],
        "spec": [
            "Mått (B × D × H): 42 × 50 × 79–89 cm",
            "Sits (B × D): 42 × 40 cm",
            "Sitthöjd: 43–53 cm",
            "Ryggstödets höjd över sitsen: 35 cm",
            "Vridning: 360°",
            "Maxlast: 120 kg",
            "Vikt: 9,5 kg",
            "Klädsel: linnelookat tyg",
            "Stomme: stål och nylon",
            "Höjdreglering: gaslyft",
            "Fot: femarmad, vit, med hjul",
            "Färg: rosa",
            "Montering: krävs",
            "Ingår: skrivbordsstol och bruksanvisning",
        ],
        "villkor": maxlast(120,
            "Ryggen är formad som ett hjärta och är smalast där den möter sitsen. "
            "Den är ett stöd att luta sig mot, inte ett att hänga bakåt över."),
        "skotsel": [
            TYG_SKOTSEL,
            "Ljust rosa tar färg av mörka jeans. Torka av avfärgning tidigt — den "
            "sitter hårdare ju längre den får ligga kvar.",
            "Hjulen samlar hår och damm i navet. Vänd stolen upp och ned ett par "
            "gånger om året och dra ut det som fastnat.",
        ],
        "faq": [
            GASLYFT_FAQ,
            ("Passar den ett vanligt skrivbord?",
             "Sitthöjden är 43–53 cm, alltså lägre än de flesta kontorsstolar går "
             "ner. Mät från golvet upp till bordets underkant innan du beställer — "
             "vid ett högt bord blir det långt att nå upp."),
            ("Vad skiljer den från den andra rosa hjärtstolen?",
             "Ryggen och tyget. Den här har en HEL hjärtrygg i platt linnelookat "
             "tyg; " + lank(PUBL_HJARTRYGG, "den andra") + " har en urholkad "
             "hjärtrygg i bouclé och en tuftad sits."),
            MONTERING_FAQ,
        ],
    },
    {
        "kort": "2cae1147", "pris": 1349,
        "slug": "kontorsstol-graddvit-boucle-vippfunktion",
        "name": "Kontorsstol gräddvit i bouclé – vippfunktion och 10 cm stoppning",
        "title": "Kontorsstol gräddvit i bouclé | Fyndplats",
        "meta": "Gräddvit kontorsstol i bouclétyg med vippfunktion och 10 cm "
                "stoppning i sits och rygg. Sitthöjd 49–59 cm, svart femarmad "
                "fot med fem hjul, bär 120 kg.",
        "ingress":
            "<p>En <strong>kontorsstol</strong> i gräddvitt bouclétyg — den lite "
            "lurviga väven som ger stolen ett möbelutseende i stället för ett "
            "kontorsutseende. Stoppningen är 10 cm i både sits och rygg.</p>"
            "<p>Stolen har vippfunktion: hela sitsen och ryggen lutar bakåt som en "
            "enhet när du skjuter ifrån, och fjädrar tillbaka. Foten är svart, "
            "femarmad och har fem hjul.</p>"
            "<p>Vi har också "
            + lank(PUBL_BOUCLE, "en högre bouclékontorsstol med nackstöd")
            + " för den som vill ha stöd hela vägen upp.</p>",
        "eg": [
            "Bouclétyg — lurvig väv med möbelkänsla",
            "10 cm stoppning i både sits och rygg",
            "Vippfunktion: sits och rygg lutar bakåt som en enhet",
            "Sitthöjd 49–59 cm med gaslyft",
            "Svart femarmad fot med fem hjul",
            "Bär 120 kg",
        ],
        "spec": [
            "Mått (B × D × H): 61,5 × 65 × 91–101 cm",
            "Sits (B × D): 50 × 49,5 cm",
            "Sitthöjd: 49–59 cm",
            "Ryggstöd (B × H): 48 × 42 cm",
            "Sitsens och ryggens tjocklek: 10 cm",
            "Armstödshöjd från sitsen: 18,5 cm",
            "Vippfunktion: ja",
            "Vridning: 360°",
            "Maxlast: 120 kg",
            "Klädsel: bouclétyg, 100 % polyester",
            "Stomme: stål och plywood",
            "Höjdreglering: gaslyft",
            "Fot: femarmad, svart, med fem hjul",
            "Färg: gräddvit",
            "Montering: krävs",
            "Ingår: kontorsstol och bruksanvisning",
        ],
        "villkor": maxlast(120,
            "Vippfunktionen släpper ryggen bakåt. Sitt kvar med fötterna i golvet "
            "när du vippar — trycker du ifrån med fötterna i luften vilar hela "
            "din tyngd på fotkryssets bakre ben."),
        "skotsel": [
            "Bouclé har en öppen, lurvig väv som fångar damm och hår. Dammsug med "
            "möbelmunstycke och lågt sug; ett borstmunstycke drar upp öglor.",
            "Fläckar tas med ljummet vatten och lite diskmedel på en urvriden "
            "trasa, alltid genom att klappa och aldrig gnida — gnidning filtar "
            "ihop väven och lämnar en blank fläck.",
            "Hjulen samlar hår och damm i navet. Vänd stolen upp och ned ett par "
            "gånger om året och dra ut det som fastnat.",
        ],
        "faq": [
            GASLYFT_FAQ,
            ("Vad gör vippfunktionen?",
             "Sitsen och ryggen lutar bakåt tillsammans när du skjuter ifrån, och "
             "fjädrar tillbaka när du sätter dig fram igen. Det är inte samma sak "
             "som ett ryggstöd som fälls för sig."),
            ("Tål bouclé slitage?",
             "Väven är öglig och tål vardagsbruk, men den fastnar i kardborre, "
             "klor och nitar. Ett ludd som dragits ut ska klippas av, aldrig dras "
             "— dras det spricker öglan vidare."),
            MONTERING_FAQ,
        ],
    },
    {
        "kort": "5302daf2", "pris": 1849,
        "slug": "kontorsstol-big-and-tall-150-kg",
        "name": "Kontorsstol big and tall – 56 cm bred sits, 69 cm rygg, bär 150 kg",
        "title": "Kontorsstol 150 kg med bred sits | Fyndplats",
        "meta": "Kontorsstol i antracitgrått PU-läder med 56 cm bred sits och "
                "69 cm hög rygg. Fickfjädrad sittdyna, gungmekanik, kromat "
                "femarmat kryss med hjul, bär 150 kg.",
        "ingress":
            "<p>En <strong>kontorsstol</strong> byggd bredare och högre än normalt: "
            "sitsen är 56 cm bred, ryggen 69 cm hög, och stolen bär 150 kg. "
            "Sittdynan är fickfjädrad, alltså med spiralfjädrar i påsar som i en "
            "madrass, och 13 cm tjock.</p>"
            "<p>Ryggens stoppning är 16 cm och stolen har gungmekanik — den lutar "
            "bakåt och fjädrar tillbaka. Klädseln är antracitgrått PU-läder med "
            "rutstickad mittpanel.</p>"
            "<p>Behöver du inte den extra bredden finns "
            + lank("kontorsstol-svart-linne-dubbelstoppad",
                   "kontorsstolen i svart linne med dubbel stoppning")
            + " i stället.</p>",
        "eg": [
            "56 cm bred sits och 69 cm hög rygg",
            "Fickfjädrad sittdyna, 13 cm tjock",
            "16 cm stoppning i ryggen",
            "Gungmekanik — ryggen lutar bakåt och fjädrar tillbaka",
            "Kromat femarmat kryss med hjul",
            "Bär 150 kg",
        ],
        "spec": [
            "Mått (B × D × H): 68 × 71 × 115–123 cm",
            "Sits (B × D): 56 × 50 cm",
            "Sitthöjd: 49–57 cm",
            "Sitsens tjocklek: 13 cm",
            "Ryggstöd (B × H): 64 × 69 cm",
            "Ryggens tjocklek: 16 cm",
            "Armstödshöjd från golv: 75 cm",
            "Vridning: 360°",
            "Maxlast: 150 kg",
            "Vikt: 20 kg",
            "Klädsel: PU-läder",
            "Stomme: metall, fickfjädrad sittdyna",
            "Höjdreglering: gaslyft",
            "Fot: femarmat kromat kryss med hjul",
            "Färg: antracitgrå",
            "Montering: krävs",
            "Ingår: kontorsstol och bruksanvisning",
        ],
        "villkor": maxlast(150,
            "150 kg är seriens högsta tal och det är gaslyften och metallbasen som "
            "bär det. Byt inte ut gaslyften mot en billigare reservdel — det är "
            "den delen lasttalet vilar på."),
        "skotsel": [
            KONSTLADER_SKOTSEL,
            "Den rutstickade mittpanelen har sömmar som samlar damm. En mjuk "
            "borste längs sömmarna en gång i månaden räcker.",
            "Hjulen samlar hår och damm i navet. Vänd stolen upp och ned ett par "
            "gånger om året och dra ut det som fastnat.",
        ],
        "faq": [
            GASLYFT_FAQ,
            ("Hur bred är sitsen?",
             "56 cm. Det är den siffran stolen finns för — tillsammans med "
             "ryggens 69 cm och de 150 kg den bär."),
            ("Vad betyder fickfjädrad sittdyna?",
             "Spiralfjädrar sitter i var sin tygficka inne i dynan, som i en "
             "madrass. De ger efter var för sig i stället för att hela dynan sjunker "
             "ihop, och de behåller formen längre än ren skumstoppning."),
            MONTERING_FAQ,
        ],
    },
    {
        "kort": "bd554433", "pris": 1279,
        "slug": "kontorsstol-svart-linne-dubbelstoppad",
        "name": "Kontorsstol svart i linnelook – dubbel stoppning, sitthöjd 50–60 cm",
        "title": "Kontorsstol svart med dubbel stoppning | Fyndplats",
        "meta": "Svart kontorsstol i linnelookat tyg med 12 cm dubbellagrad "
                "stoppning i sits och rygg. Sitthöjd 50–60 cm, tysta hjul, "
                "femarmat kryss, bär 120 kg.",
        "ingress":
            "<p>En <strong>kontorsstol</strong> i svart linnelookat tyg där sits och "
            "rygg är stoppade i två lager, tillsammans 12 cm. Det syns på formen: "
            "rutorna i stoppningen är djupa i stället för platta.</p>"
            "<p>Sitthöjden går 50–60 cm, alltså ett brett spann att ställa in mot "
            "ditt eget bord. Hjulen är av den tystgående sorten och foten är "
            "svart och femarmad.</p>"
            "<p>Behöver du en bredare sits och högre maxlast finns "
            + lank("kontorsstol-big-and-tall-150-kg",
                   "kontorsstolen med 56 cm sits som bär 150 kg")
            + ".</p>",
        "eg": [
            "Dubbellagrad stoppning, 12 cm i sits och rygg",
            "Sitthöjd 50–60 cm med gaslyft",
            "Ryggstöd 50 × 55 cm",
            "Tystgående hjul på femarmat kryss",
            "Luftgenomsläppligt tyg i linnelook",
            "Bär 120 kg",
        ],
        "spec": [
            "Mått (B × D × H): 63 × 70 × 102–112 cm",
            "Sits (B × D): 50 × 48 cm",
            "Sitthöjd: 50–60 cm",
            "Sitsens tjocklek: 12 cm",
            "Ryggstöd (B × H × D): 50 × 55 × 12 cm",
            "Armstöd (L × B): 35 × 6 cm",
            "Armstödshöjd från golv: 65–75 cm",
            "Vridning: 360°",
            "Maxlast: 120 kg",
            "Klädsel: linnelookat polyester",
            "Stomme: stål, plywood och plast",
            "Höjdreglering: gaslyft",
            "Fot: femarmad med tystgående hjul",
            "Färg: svart",
            "Montering: krävs",
            "Ingår: kontorsstol och bruksanvisning",
        ],
        "villkor": maxlast(120,
            "Armstöden är smala, 35 × 6 cm, och sitter fast i sitsen. Använd dem "
            "inte som handtag när du drar fram stolen — dra i sitsen i stället."),
        "skotsel": [
            TYG_SKOTSEL,
            "Svart tyg visar damm och ludd tydligare än ljust. En klädrulle tar "
            "det mesta mellan dammsugningarna.",
            "Hjulen samlar hår och damm i navet. Vänd stolen upp och ned ett par "
            "gånger om året och dra ut det som fastnat.",
        ],
        "faq": [
            GASLYFT_FAQ,
            ("Vad menas med dubbel stoppning?",
             "Sits och rygg har två lager stoppning i stället för ett, tillsammans "
             "12 cm. Det ger en fastare sits än ett enda tjockt skumlager."),
            ("Hur vet jag om sitthöjden räcker?",
             "Mät från golvet upp till bordets underkant och dra av det utrymme "
             "du vill ha för låren. Hamnar talet inom 50–60 cm går stolen att "
             "ställa in mot ditt bord."),
            MONTERING_FAQ,
        ],
    },
]
