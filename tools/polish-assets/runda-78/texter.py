# -*- coding: utf-8 -*-
"""Runda 78 — åtta rullpallar och arbetspallar, åtta olika vinklar.

☠️ Batch 64 mätte skillnaden: fem produkter skrivna inline i API-anropet gav
NIO fel som nådde Wix, tre skrivna via fil gav noll. Texten skrivs därför HÄR.

☠️ RITNINGEN ÄR FACIT. Två av åtta anger SITSENS mått i fältet för produktens
   totalmått (`239e68b8` 39 mot fotkryssets 44; `28532aab` Ø35,5 mot 48,5).
   Alla mått nedan är lästa ur måttritningen, inte ur den tyska spec-listan.

☠️ `ergonomisk` FÅR INTE FÖREKOMMA. Tre av åtta heter `Ergonomischer …` på
   tyska utan att bära någon certifiering. Linten fäller på `ergonomisk\\w*`.

☠️ INGEN AV DE ÅTTA SÄLJS SOM KONTORSSTOL. Sex saknar ryggstöd helt eller har
   bara ett litet stödplan; en rullpall är inte en arbetsstol för heldagsarbete.
   Linten fäller på `kontorsstol`, `arbetsstol` och `heldag`.

☠️ TVÅ HÄLSOPÅSTÅENDEN STRUKNA ur `f18dfc3b`: *"fördert eine gesunde
   Körperhaltung und verbessert Konzentration"* och *"unterstützt eine
   natürliche, gerade Ausrichtung der Wirbelsäule"*. Kvar står mekaniken —
   sitsen vippar 5°, pallen saknar rygg — och vad det gör med kroppen får
   kunden avgöra.

☠️ VIKTEN UTELÄMNAS på sju av åtta. Källan anger två olika tal för samma pall
   (`d348bf64`: 5,4 kg netto i tysk text, 6,5 kg i den svenska raden). Bara
   `87de04ad` har ett entydigt `Nettogewicht: 6 kg`, och bara den bär vikten.

⚠️ `sku_bas` stryker fogeordet `utan`, så `salongspall-utan-rygg-…` hade blivit
   `FP-salongspall-rygg-9-cm` — en SKU som säger raka motsatsen till varan.
   Fogeordet är behållet med flit, samma avvikelse som runda 77 gjorde på
   ritstolen utan armstöd.
"""

BAS = "https://www.fyndplats.se/produkt/"
# Publicerad sida som äger sökordet `arbetsstol`. Sitthöjden är LÄST på den
# sidan (`Sitthöjd: 51–67 cm`), inte gissad — därav EXTERN_TAL i linten.
PUBL_ARBETSSTOL = ("arbetsstol-hjul-51-67-cm-avtagbar-rygg", "sitthöjd 51–67 cm")

# ☠️ TVÅ PUBLICERADE PALLSIDOR SOM RUNDANS EGET SVEP MISSADE. Regexen var
#    `(stol|sessel|stuhl|hocker|chair)` och matchar inte `pall`, så butikens
#    egna pallsidor var osynliga för krockgrinden. Båda äger ett sökord den
#    här rundan också använder, och saknade därför korslänk:
#
#    * `arbetspall-med-hjul` — 48–63 cm, sits ø35,5, bas ø48,5, 120 kg.
#      SAMMA fyra tal som 2-packet; skillnaden är slät mot rutstickad sits
#      och enstyck mot par.
#    * `verkstadspall-med-verktygsbricka-37-cm` — 38 × 35 × 37 cm, sits
#      36 × 19, 100 kg. Inga gemensamma tal, men samma sökord.
#
#    Regeln: sveptermen ska vara produkttypens SVENSKA ord, inte källans
#    tyska. Familjen hette `Rollhocker` och blev `rullpall`.
PUBL_ARBETSPALL = "arbetspall-med-hjul"
PUBL_VERKSTADSPALL = ("verkstadspall-med-verktygsbricka-37-cm", "37 cm sitthöjd")


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


# ☠️ MAXLASTEN FÅR EGEN RUBRIK — ett positivt villkor, aldrig en varningsruta.
def maxlast(kg, extra=None):
    st = ["Pallen är provad för %d kg. Talet gäller EN person som sitter, inte "
          "att stå på sitsen — en pall med gaslyft är ingen trappstege, och en "
          "sits som vrider sig under en fot gör det inte under en kropp." % kg]
    if extra:
        st.append(extra)
    st.append("Efterdra skruvarna efter någon månads användning. Det är den "
              "enskilt vanligaste orsaken till att en pall börjar glappa, och "
              "det tar en minut.")
    return ("Bär %d kg" % kg, st)


HJUL_SKOTSEL = ("Hjulen samlar hår och damm i navet. Vänd pallen upp och ned "
                "ett par gånger om året och dra ut det som fastnat, så rullar "
                "den lätt igen.")
KONSTLADER_SKOTSEL = ("Konstlädret torkas av med en fuktig trasa och lite "
                      "diskmedel. Undvik lösningsmedel och sprit — de torkar ut "
                      "ytan och gör den spröd med tiden.")
GASLYFT_FAQ = ("Hur ställer jag in höjden?",
               "Med spaken under sitsen. Lyft den medan du står upp så går "
               "pallen upp, tryck den medan du sitter så går den ner. "
               "Gaslyften stannar där du släpper.")
MONTERING_FAQ = ("Behöver den monteras?",
                 "Ja, men det är få delar och går på några minuter: fotkryss, "
                 "gaslyft och sits sätts ihop, och hjulen trycks i. "
                 "Bruksanvisning ingår.")


PRODUKTER = [
    # ============================================ V · VERKSTADSPALLEN (1) ===
    {
        "kort": "5646a8ff", "pris": 849,
        "slug": "verkstadspall-med-lador-135-kg",
        "name": "Verkstadspall med lådor och verktygsfack – bär 135 kg",
        "title": "Verkstadspall med lådor 135 kg | Fyndplats",
        "meta": "Verkstadspall på hjul med två öppna verktygsfack och en låda under "
                "sitsen. Fast sitthöjd 35 cm, bär 135 kg, två av de fyra "
                "gummihjulen har broms.",
        "ingress":
            "<p>En <strong>verkstadspall</strong> att rulla runt bilen eller "
            "arbetsbänken på, med verktygen i själva pallen. Under den "
            "stoppade sitsen sitter två öppna fack och en låda, så skiftnyckeln "
            "följer med när du flyttar dig i stället för att ligga kvar tre "
            "meter bort.</p>"
            "<p>Sitthöjden är fast på 35 cm. Det är låg höjd med flit — pallen "
            "är gjord för arbete nere vid golvet, inte vid ett bord. Behöver du "
            "en höjdbar pall att sitta vid en bänk med finns "
            + lank("arbetspall-rygg-och-fotring", "arbetspallen med rygg och fotring")
            + " i stället.</p>"
            "<p>Vi säljer också en mindre verkstadspall: "
            + lank(PUBL_VERKSTADSPALL[0],
                   "verkstadspallen med verktygsbricka och " + PUBL_VERKSTADSPALL[1])
            + " tar mindre plats och har en öppen bricka i stället för fack "
            "och låda.</p>",
        "eg": [
            "Två öppna verktygsfack och en låda under sitsen",
            "Fyra gummihjul, varav två med broms",
            "Stoppad sits 44 × 25 cm med 3 cm dyna",
            "Fast sitthöjd 35 cm — byggd för arbete vid golvet",
            "Bär 135 kg",
        ],
        "spec": [
            "Mått (L × B × H): 64,5 × 33 × 35 cm",
            "Sits (L × B): 44 × 25 cm",
            "Dynans tjocklek: 3 cm",
            "Verktygsfack (L × B × H): 26 × 25 × 5 cm",
            "Låda (L × B × H): 21 × 22,5 × 12,5 cm",
            "Hjul: 10 cm, fyra stycken varav två med broms",
            "Maxlast: 135 kg",
            "Material: plast och stål, stoppad sits",
            "Färg: grå sits, röda fack",
            "Montering: krävs",
            "Ingår: verkstadspall och bruksanvisning",
        ],
        "villkor": maxlast(135,
            "Bromsa de två låsbara hjulen innan du kliver på eller reser dig. "
            "En pall som rullar iväg i det ögonblicket är den vanligaste "
            "olyckan med en rullande sits."),
        "skotsel": [
            "Facken lyfts ur och sköljs. Olja och fett går bort med diskmedel "
            "och varmt vatten; låt dem torka innan verktygen läggs tillbaka, "
            "annars sätter sig fukten under dem.",
            "Sitsen torkas av med en fuktig trasa. Har den fått olja på sig "
            "tas den bort direkt — det som får sitta kvar drar in i tyget.",
            HJUL_SKOTSEL,
        ],
        "faq": [
            ("Går höjden att ändra?",
             "Nej, sitshöjden är fast på 35 cm. Pallen är byggd låg med flit: "
             "den ska ta dig ner till hjulhus, sockelskåp och det som ligger "
             "vid golvet."),
            ("Hur mycket rymmer facken?",
             "Två öppna fack på 26 × 25 × 5 cm och en låda på "
             "21 × 22,5 × 12,5 cm. Facken tar hylsor, nycklar och skruv; lådan "
             "tar det du inte vill se rulla iväg."),
            ("Rullar den på grus och betong?",
             "Hjulen är 10 cm och av gummi, alltså gjorda för hårt golv som "
             "betong, klinker och plåt. På grus och gräs rullar de inte."),
            MONTERING_FAQ,
        ],
    },
    # ============================================== P · PENDELPALLEN (1) ===
    {
        "kort": "f18dfc3b", "pris": 999,
        "slug": "pendelpall-vippande-sits",
        "name": "Pendelpall med vippande sits – 56,5–71,5 cm, för ståbord",
        "title": "Pendelpall med vippande sits 56,5–71,5 cm | Fyndplats",
        "meta": "Pendelpall med sits som vippar upp till 5° åt alla håll och inget "
                "ryggstöd att luta sig mot. Höjd 56,5–71,5 cm, nätklädd sits "
                "och halkfri rund fot utan hjul.",
        "ingress":
            "<p>En <strong>pendelpall</strong> vars sits inte står stilla. Den "
            "vippar upp till 5° åt alla håll, så du flyttar dig i stället för "
            "att sitta still — och eftersom pallen saknar ryggstöd finns det "
            "inget att luta sig mot.</p>"
            "<p>Höjden går från 56,5 till 71,5 cm, alltså upp i ståbordshöjd. "
            "Vill du ha en pall som står stilla och har något att luta ryggen "
            "mot finns " + lank("rullpall-svart-rygg-43-55-cm", "rullpallen med rygg")
            + " i stället.</p>",
        "eg": [
            "Sitsen vippar upp till 5° åt alla håll",
            "Höjd 56,5–71,5 cm — går upp i ståbordshöjd",
            "Nätklädd sits 41 × 35 cm med 4,5 cm stoppning",
            "Rund halkfri fot Ø 38,5 cm — inga hjul",
            "Verktygsfri montering",
        ],
        "spec": [
            "Mått (B × D × H): 42,5 × 35,5 × 56,5–71,5 cm",
            "Sits (B × D): 41 × 35 cm",
            "Stoppningens tjocklek: 4,5 cm",
            "Fotens diameter: 38,5 cm",
            "Vippfunktion: upp till 5° åt alla håll",
            "Maxlast: 120 kg",
            "Sitsens klädsel: nätväv, 100 % polyester",
            "Höjdreglering: gaslyft med knapp på var sida",
            "Färg: vitt stativ, mörkgrå sits",
            "Montering: krävs, men utan verktyg",
            "Ingår: pendelpall och bruksanvisning",
        ],
        "villkor": maxlast(120,
            "Foten är halkfri och saknar hjul med flit. En pall som både vippar "
            "och rullar är svår att resa sig ur; den här står kvar där du "
            "ställer den."),
        "skotsel": [
            "Nätväven dammsugs med möbelmunstycke. Fläckar tas med en fuktig "
            "trasa och lite diskmedel — låt torka innan du sätter dig, annars "
            "sätter sig fukten i skummet under.",
            "Torka av foten då och då. Damm under en halkfri fot gör precis det "
            "gummit finns för att förhindra.",
            "Vipplagret behöver ingenting. Låter det, kontrollera att pelaren "
            "sitter fast i foten innan du letar efter något annat.",
        ],
        "faq": [
            ("Vad är poängen med att sitsen vippar?",
             "Den låter dig skifta ställning utan att resa dig, och den kräver "
             "att du håller balansen själv eftersom det inte finns något "
             "ryggstöd. Vad det gör för dig får du avgöra — vi lovar inget om "
             "hälsa, bara att sitsen rör sig 5° åt alla håll."),
            ("Passar den till ett ståbord?",
             "Ja, i sitt övre läge på 71,5 cm. Vid ett lägre bord vevar du ner "
             "den mot 56,5 cm — mät bordet först, så vet du var i intervallet "
             "du hamnar."),
            ("Går den att rulla?",
             "Nej. Foten är en rund halkfri platta på 38,5 cm utan hjul, och "
             "det är avsiktligt: en vippande sits på hjul är svår att komma "
             "upp ur."),
            ("Behöver den monteras?",
             "Ja, men utan verktyg. Pelare, fot och sits trycks och skruvas "
             "ihop för hand. Bruksanvisning ingår."),
        ],
    },
    # ============================================= S · SALONGSPALLEN (1) ===
    {
        "kort": "239e68b8", "pris": 729,
        "slug": "salongspall-utan-rygg-9-cm-skum",
        "name": "Salongspall utan rygg – 9 cm formgjutet skum, 52–67,5 cm",
        "title": "Salongspall utan rygg 52–67,5 cm | Fyndplats",
        "meta": "Salongspall utan rygg med 9 cm formgjutet skum i sitsen. Höjd "
                "52–67,5 cm med gaslyft, kromat femarmat kryss på 44 cm och "
                "fem hjul.",
        "ingress":
            "<p>En <strong>salongspall</strong> med tjock sits: 9 cm formgjutet "
            "skum. Skummet är gjutet i form, alltså inte en platt skiva — det "
            "sjunker ihop under dig och tar tillbaka formen när du reser "
            "dig.</p>"
            "<p>Ingen rygg, inga armstöd — pallen ska gå att komma in till "
            "kunden med från alla håll och rulla undan lika snabbt. Behöver du "
            "något att luta ryggen mot finns "
            + lank("arbetspall-rygg-och-fotring", "arbetspallen med rygg och fotring")
            + ", och ska du köpa flera på en gång finns "
            + lank("rullpallar-2-pack-48-63-cm", "rullpallarna i 2-pack") + ".</p>",
        "eg": [
            "9 cm formgjutet skum i sitsen",
            "Höjd 52–67,5 cm med gaslyft",
            "Sits 39 × 34,5 cm, klädd i avtorkbar PU",
            "Kromat femarmat kryss, 44 cm brett, med fem hjul",
            "Vrider 360°",
        ],
        "spec": [
            "Mått (fotkryss × höjd): 44 cm × 52–67,5 cm",
            "Sits (B × D): 39 × 34,5 cm",
            "Skummets tjocklek: 9 cm",
            "Sitthöjd: 52–67,5 cm",
            "Vridning: 360°",
            "Maxlast: 120 kg",
            "Klädsel: PU, 65 % polyuretan och 35 % polyester",
            "Stativ: kromat stål",
            "Höjdreglering: gaslyft",
            "Fot: femarmad, på hjul",
            "Färg: svart",
            "Montering: krävs",
            "Ingår: salongspall och bruksanvisning",
        ],
        "villkor": maxlast(120),
        "skotsel": [
            KONSTLADER_SKOTSEL,
            "Det kromade krysset torkas av med en torr trasa. Hårspray och "
            "färgrester är lättast att ta bort samma dag; får de sitta kvar "
            "matteras kromet där de legat.",
            HJUL_SKOTSEL,
        ],
        "faq": [
            ("Hur mycket märks 9 cm skum?",
             "Det är ungefär dubbelt mot en vanlig salongspall, och det syns i "
             "hur länge du kan sitta. Sitsen är formgjuten, alltså inte platt "
             "— den sjunker ihop under dig och behåller formen."),
            ("Hur brett är fotkrysset?",
             "44 cm över hjulen. Det är talet du ska mäta mot när du planerar "
             "utrymmet, inte sitsens 39 cm."),
            GASLYFT_FAQ,
            MONTERING_FAQ,
        ],
    },
    # ============================================== F · ARBETSPALLEN (1) ===
    {
        "kort": "15ff0d64", "pris": 799,
        "slug": "arbetspall-rygg-och-fotring",
        "name": "Arbetspall med rygg och fotring – sitthöjd 49–65 cm",
        "title": "Arbetspall med rygg och fotring 49–65 cm | Fyndplats",
        "meta": "Arbetspall i konstläder med litet ryggstöd i svanken och fotring "
                "runt pelaren. Sitthöjd 49–65 cm med gaslyft, fem hjul och "
                "120 kg maxlast.",
        "ingress":
            "<p>En <strong>arbetspall</strong> med två saker de flesta pallar "
            "saknar: ett litet ryggstöd i svanken och en fotring att vila "
            "fötterna på när sitsen står högt. Det är den kombinationen som gör "
            "att du kan sitta kvar en hel förmiddag.</p>"
            "<p>Sitthöjden går 49–65 cm. Vill du ha ännu högre sits finns "
            + lank("rullpall-svart-rygg-43-55-cm", "rullpallen med rygg")
            + ", och vår publicerade "
            + lank(PUBL_ARBETSSTOL[0], "arbetsstol med avtagbar rygg och " + PUBL_ARBETSSTOL[1])
            + " går ännu högre.</p>",
        "eg": [
            "Litet ryggstöd 35 × 10 cm som stöttar svanken",
            "Fotring runt pelaren att vila fötterna på",
            "Sitthöjd 49–65 cm med gaslyft",
            "Vattenavvisande konstläder som torkas av",
            "Fem hjul och 360° vridning",
        ],
        "spec": [
            "Mått (B × D × H): 43 × 43 × 59–75 cm",
            "Sits (B × D): 37 × 33 cm",
            "Dynans tjocklek: 5 cm",
            "Sitthöjd: 49–65 cm",
            "Ryggstöd (B × H): 35 × 10 cm",
            "Fotring: ja, runt pelaren",
            "Vridning: 360°",
            "Maxlast: 120 kg",
            "Klädsel: konstläder, vattenavvisande",
            "Höjdreglering: gaslyft",
            "Fot: femarmad, på hjul",
            "Färg: svart",
            "Montering: krävs",
            "Ingår: arbetspall och bruksanvisning",
        ],
        "villkor": maxlast(120,
            "Fotringen är till för fötterna, inte för att kliva på. Står du på "
            "den lyfter pallens ena sida och kryssets motsatta arm går i "
            "golvet."),
        "skotsel": [
            KONSTLADER_SKOTSEL,
            "Fotringen får repor av skosulor och det går inte att undvika. "
            "Torka av den när du torkar sitsen så syns de mindre.",
            HJUL_SKOTSEL,
        ],
        "faq": [
            ("Hur mycket rygg är 35 × 10 cm?",
             "Det är en stödplatta i svanken, inte ett ryggstöd att luta hela "
             "ryggen mot. Den gör skillnad när du sitter framåtlutad och "
             "arbetar; den ersätter inte en stol med hel rygg."),
            ("När behöver jag fotringen?",
             "När du vevat upp sitsen så högt att fötterna inte når golvet. "
             "Utan den hänger benen, och då blir det tungt i låren efter en "
             "stund."),
            GASLYFT_FAQ,
            MONTERING_FAQ,
        ],
    },
    # =================================== H · HÖGA PALLEN, TVÅ KULÖRER (2) ===
    {
        "kort": "d348bf64", "pris": 799,
        "slug": "rullpall-svart-rygg-43-55-cm",
        "name": "Rullpall svart med rygg – sitthöjd 43–55 cm, bär 136 kg",
        "title": "Rullpall svart med rygg 43–55 cm | Fyndplats",
        "meta": "Rullpall i svart konstläder med ryggstöd på en böjd stam som "
                "fjädrar. Sitthöjd 43–55 cm med gaslyft, rund sits Ø 35 cm "
                "och 136 kg maxlast.",
        "ingress":
            "<p>En <strong>rullpall</strong> med rygg — och ryggen sitter på en "
            "böjd stam bakom sitsen, inte fast i den. Det gör att den ger efter "
            "när du lutar dig bakåt och att den inte är i vägen när du vrider "
            "dig åt sidan.</p>"
            "<p>Sitsen är rund, Ø 35 cm, och går 43–55 cm. Samma pall finns i "
            + lank("rullpall-beige-rygg-43-55-cm", "beige") + ". Vill du ha en "
            "rygg som omsluter sidorna finns "
            + lank("rullpall-ringrygg-bred-fot", "rullpallen med ringrygg") + ".</p>",
        "eg": [
            "Ryggstöd 32 × 23 cm på böjd stam som fjädrar",
            "Sitthöjd 43–55 cm med gaslyft",
            "Rund sits Ø 35 cm i konstläder",
            "Femarmad fot i nylon med fem hjul, vrider 360°",
            "Bär 136 kg",
        ],
        "spec": [
            "Total höjd: 72–84 cm",
            "Sitthöjd: 43–55 cm",
            "Sitsens diameter: 35 cm",
            "Ryggstöd (B × H): 32 × 23 cm",
            "Vridning: 360°",
            "Maxlast: 136 kg",
            "Klädsel: konstläder",
            "Höjdreglering: gaslyft",
            "Fot: femarmad nylon, på hjul",
            "Färg: svart",
            "Montering: krävs",
            "Ingår: rullpall och bruksanvisning",
        ],
        "villkor": maxlast(136),
        "skotsel": [
            KONSTLADER_SKOTSEL,
            "Ryggstödets stam är den del som tar mest kraft. Kontrollera att "
            "den sitter fast när du efterdrar resten, så slipper du glappet "
            "innan det uppstår.",
            HJUL_SKOTSEL,
        ],
        "faq": [
            ("Hur mycket ryggstöd är det?",
             "32 cm brett och 23 cm högt, alltså ett stöd mot ryggslutet och "
             "inte mot hela ryggen. Det sitter på en böjd stam som fjädrar när "
             "du lutar dig bakåt."),
            ("Vad är skillnaden mot den beiga?",
             "Bara färgen. Samma sits, samma ryggstöd, samma höjd och samma "
             "maxlast — det är en och samma pall i två kulörer."),
            GASLYFT_FAQ,
            MONTERING_FAQ,
        ],
    },
    {
        "kort": "fa078e03", "pris": 819,
        "slug": "rullpall-beige-rygg-43-55-cm",
        "name": "Rullpall beige med rygg – sitthöjd 43–55 cm, bär 136 kg",
        "title": "Rullpall beige med rygg 43–55 cm | Fyndplats",
        "meta": "Rullpall i beige konstläder med ryggstöd på en böjd stam som "
                "fjädrar. Sitthöjd 43–55 cm med gaslyft, fot Ø 48 cm och "
                "136 kg maxlast.",
        "ingress":
            "<p>En <strong>rullpall</strong> i beige, med ryggstödet på en böjd "
            "stam bakom sitsen. Den ger efter när du lutar dig bakåt och står "
            "ur vägen när du vrider dig åt sidan.</p>"
            "<p>Sitsen är rund, Ø 35 cm, och går 43–55 cm; foten mäter 48 cm "
            "över hjulen. Samma pall finns i "
            + lank("rullpall-svart-rygg-43-55-cm", "svart") + ". Behöver du en "
            "pall utan rygg som du kommer intill från alla håll finns "
            + lank("salongspall-utan-rygg-9-cm-skum", "salongspallen utan rygg") + ".</p>",
        "eg": [
            "Ryggstöd 32 × 23 cm på böjd stam som fjädrar",
            "Sitthöjd 43–55 cm med gaslyft",
            "Rund sits Ø 35 cm i beige konstläder",
            "Femarmad fot Ø 48 cm i nylon, vrider 360°",
            "Bär 136 kg",
        ],
        "spec": [
            "Total höjd: 72–84 cm",
            "Sitthöjd: 43–55 cm",
            "Sitsens diameter: 35 cm",
            "Fotens diameter: 48 cm",
            "Ryggstöd (B × H): 32 × 23 cm",
            "Vridning: 360°",
            "Maxlast: 136 kg",
            "Klädsel: konstläder",
            "Höjdreglering: gaslyft",
            "Fot: femarmad nylon, på hjul",
            "Färg: beige",
            "Montering: krävs",
            "Ingår: rullpall och bruksanvisning",
        ],
        "villkor": maxlast(136),
        "skotsel": [
            "Beige konstläder visar smuts tydligare än svart. Torka av sitsen "
            "med en fuktig trasa och lite diskmedel med jämna mellanrum — det "
            "som torkar in blir kvar, medan det som torkas bort samma dag "
            "försvinner helt.",
            "Undvik lösningsmedel och sprit. De torkar ut ytan och gör den "
            "spröd, och på en ljus klädsel syns sprickorna direkt.",
            HJUL_SKOTSEL,
        ],
        "faq": [
            ("Hur ljus är beigen?",
             "Den är en varm sandton, ljusare än brun och mörkare än gräddvit. "
             "Färgen är mätt i produktbilden, inte hämtad ur en färgtabell — "
             "det är beige, inte ljusbrun."),
            ("Vad är skillnaden mot den svarta?",
             "Bara färgen. Samma sits, samma ryggstöd, samma höjd och samma "
             "maxlast — det är en och samma pall i två kulörer."),
            GASLYFT_FAQ,
            MONTERING_FAQ,
        ],
    },
    # ============================================ B · RINGRYGGSPALLEN (1) ===
    {
        "kort": "87de04ad", "pris": 949,
        "slug": "rullpall-ringrygg-bred-fot",
        "name": "Rullpall med ringrygg – 50 × 54 cm fot, sitthöjd 45–57 cm",
        "title": "Rullpall med ringrygg 45–57 cm | Fyndplats",
        "meta": "Rullpall med ringformat ryggstöd som böjer sig runt ryggen och "
                "sidorna. Sitthöjd 45–57 cm, brett kromat kryss på "
                "50 × 54 cm och 136 kg maxlast.",
        "ingress":
            "<p>En <strong>rullpall</strong> vars ryggstöd inte är en platta "
            "bakom ryggen utan en ring som böjer sig runt sidorna. Du får stöd "
            "även när du sitter vriden — och det är just då en vanlig rullpall "
            "inte ger något stöd alls.</p>"
            "<p>Fotkrysset är brett, 50 × 54 cm, vilket gör pallen stadigare än "
            "de smalare i sortimentet. Vill du ha en smalare fot som kommer "
            "närmare bordet finns "
            + lank("rullpall-svart-rygg-43-55-cm", "rullpallen med rygg på böjd stam")
            + ".</p>",
        "eg": [
            "Ringformat ryggstöd som omsluter ryggen och sidorna",
            "Sitthöjd 45–57 cm med gaslyft",
            "Brett kromat kryss 50 × 54 cm — stadigt underlag",
            "Klädd i svart konstläder med synlig söm",
            "Bär 136 kg, väger 6 kg",
        ],
        "spec": [
            "Mått (B × D × H): 50 × 54 × 66–78 cm",
            "Sitthöjd: 45–57 cm",
            "Ryggstöd: ringformat, omsluter ryggen och sidorna",
            "Maxlast: 136 kg",
            "Vikt: 6 kg",
            "Klädsel: konstläder",
            "Stativ: kromat stål",
            "Höjdreglering: gaslyft",
            "Fot: femarmad, på hjul",
            "Färg: svart",
            "Montering: krävs",
            "Ingår: rullpall och bruksanvisning",
        ],
        "villkor": maxlast(136),
        "skotsel": [
            KONSTLADER_SKOTSEL,
            "Ringen har en söm längs insidan där damm samlas. Dra en fuktig "
            "trasa längs den när du torkar sitsen, så syns den inte.",
            HJUL_SKOTSEL,
        ],
        "faq": [
            ("Vad gör en ringrygg bättre än ett vanligt ryggstöd?",
             "Den följer med runt sidorna, så du har något att luta dig mot "
             "även när du sitter vriden. En platt rygg bakom dig ger stöd bara "
             "i ett läge."),
            ("Tar den mycket plats?",
             "Fotkrysset mäter 50 × 54 cm, alltså bredare än en vanlig "
             "rullpall. Det är priset för stadgan — mät innan du köper om den "
             "ska stå i en trång arbetsyta."),
            GASLYFT_FAQ,
            MONTERING_FAQ,
        ],
    },
    # ================================================ T · TVÅPACKET (1) ===
    {
        "kort": "28532aab", "pris": 1029,
        "slug": "rullpallar-2-pack-48-63-cm",
        "name": "Rullpallar 2-pack – sitthöjd 48–63 cm, rutstickad sits",
        "title": "Rullpallar 2-pack 48–63 cm | Fyndplats",
        "meta": "Två rullpallar med rutstickad sits Ø 35,5 cm i konstläder. "
                "Sitthöjd 48–63 cm med gaslyft, kromat femarmat kryss på "
                "48,5 cm och 120 kg per pall.",
        "ingress":
            "<p><strong>Två rullpallar</strong> i samma köp, med rutstickad "
            "sits och kromat femarmat kryss. Det är upplägget för den som "
            "behöver en pall åt sig och en åt kunden, eller två likadana till "
            "ett arbetsbord.</p>"
            "<p>Sitsen är rund, Ø 35,5 cm, och går 48–63 cm. Behöver du bara en "
            "pall — och gärna en med tjockare sits — finns "
            + lank("salongspall-utan-rygg-9-cm-skum", "salongspallen med 9 cm skum")
            + " som enstyck.</p>"
            "<p>Samma pall finns också som enstyck med slät sits: "
            + lank(PUBL_ARBETSPALL, "arbetspallen med hjul")
            + ", i vit eller svart.</p>",
        "eg": [
            "Två pallar ingår",
            "Rutstickad sits Ø 35,5 cm i konstläder",
            "Sitthöjd 48–63 cm med gaslyft",
            "Kromat femarmat kryss, 48,5 cm brett, med fem hjul",
            "Bär 120 kg per pall",
        ],
        "spec": [
            "Antal: 2 pallar",
            "Mått per pall (fotkryss × höjd): 48,5 cm × 48–63 cm",
            "Sitsens diameter: 35,5 cm",
            "Sitthöjd: 48–63 cm",
            "Maxlast: 120 kg per pall",
            "Klädsel: konstläder, rutstickad",
            "Stativ: kromat stål",
            "Höjdreglering: gaslyft",
            "Fot: femarmad, på hjul",
            "Färg: svart",
            "Montering: krävs",
            "Ingår: två rullpallar och bruksanvisning",
        ],
        "villkor": maxlast(120,
            "Talet gäller PER PALL, inte för de två tillsammans. Varje pall bär "
            "sina 120 kg, och en person i taget på var och en."),
        "skotsel": [
            KONSTLADER_SKOTSEL,
            "Rutstickningen har sömmar där damm och hår samlas. Dra en fuktig "
            "trasa längs dem, annars syns mönstret mörkare än det är.",
            HJUL_SKOTSEL,
        ],
        "faq": [
            ("Är båda pallarna likadana?",
             "Ja, två identiska pallar med samma sits, samma höjdintervall och "
             "samma maxlast."),
            ("Hur brett är fotkrysset?",
             "48,5 cm över hjulen. Det är talet att mäta mot när du planerar "
             "utrymmet, inte sitsens 35,5 cm."),
            GASLYFT_FAQ,
            ("Behöver de monteras?",
             "Ja, båda två. Fotkryss, gaslyft och sits sätts ihop och hjulen "
             "trycks i — några minuter per pall. Bruksanvisning ingår."),
        ],
    },
]

if __name__ == "__main__":
    for p in PRODUKTER:
        h = bygg(p)
        print("%-9s %-32s %4d tecken html, titel %d" %
              (p["kort"], p["slug"], len(h), len(p["title"])))
