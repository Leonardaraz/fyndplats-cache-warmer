# -*- coding: utf-8 -*-
"""Runda 143 — brödtexten per produkt.

Husstilen: spec-blocket är `<ul>`, aldrig `<table>`. De tre flikrubrikerna är
obligatoriska och ORDAGRANNA. Allt som ska ligga i BRÖDTEXTEN står FÖRE första
flikrubriken — korslänken sist av dem.

☠️ RUNDANS EGNA FÖRBUD, utöver den delade modulen:

 1. **Maxlasten är SÄCKENS vikt.** Sex produkter bär ett kilotal som är lätt
    att läsa som en användarvikt (#548). Ordet "säck" ska stå i samma mening
    som talet, varje gång.
 2. **Ingen CE-märkning.** Sportredskap omfattas inte av något direktiv som
    ger CE, och att sätta märket utan direktiv är i sig en överträdelse.
 3. **Ingen fyllning ingår.** Sand och vatten köps själv, på varenda fyllbar
    fot i rundan.
 4. **Ingen ålder.** Produkterna är inga leksaker och EN 71 gäller dem inte.
 5. **Husmärket i TEXTEN.** HOMCOM och SPORTNOW står tryckta på sju av varorna
    och det rör vi inte i bilden (Leonards regel). Ordet får aldrig nå namn,
    titel, meta, slug, sökord, SKU eller alt-text.
 6. **Artikelnumret.** `1409d762` bär det i sin egen tyska brödtext (#470).
"""

def R(etikett, varde):
    return "<li><p>%s: %s</p></li>" % (etikett, varde)


def F(fraga, svar):
    # TVA stycken. Wix strippar <br>, sa fraga och svar i ETT stycke klistras
    # ihop utan radbrytning (uppmatt 2026-08-21).
    return "<p><strong>%s</strong></p><p>%s</p>" % (fraga, svar)


def H(rubrik, *stycken):
    return "<h2>%s</h2>" % rubrik + "".join("<p>%s</p>" % s for s in stycken)


def bygg(intro, avsnitt, korslank, spec, skotsel, faq):
    ut = ["<p>%s</p>" % intro]
    for rubrik, stycken in avsnitt:
        ut.append(H(rubrik, *stycken))
    if korslank:
        ut.append(H(korslank[0], korslank[1]))
    ut.append("<h2>Tekniska specifikationer</h2><ul>%s</ul>" % "".join(spec))
    ut.append(H("Användning och skötsel", *skotsel))
    ut.append("<h2>Vanliga frågor</h2>" + "".join(F(q, s) for q, s in faq))
    return "".join(ut)


BAS = "https://www.fyndplats.se/produkt/"


def lank(slug, text):
    return '<a href="%s%s">%s</a>' % (BAS, slug, text)


# ── delade formuleringar ────────────────────────────────────────────────────
# ☠️ EN sträng per regel. Två kopior av samma mening glider isär (#547).
# ⚠️ SUBJEKTET MÅSTE VARA NEUTRALT. Meningen delas av tre olika former:
#    sex fristående SÄCKAR, en boxDOCKA och ETT ställ. "när stället står på
#    plats" är riktigt bara på den sista — på de sju andra kallar den varan
#    för något den inte är. En delad sträng ärver sitt subjekt till alla som
#    använder den, och den som skrev den hade bara ett av tre fall i huvudet.
FYLLNING_INGAR_EJ = ("Sanden eller vattnet köper du själv — foten levereras "
                     "tom, och den fylls först när den står på sin plats.")

SUGPROPP_GOLV = ("Sugpropparna biter mot ett slätt, rent och tätt golv: "
                 "klinker, lackad parkett eller plastmatta. På heltäckningsmatta, "
                 "obehandlat trä eller strukturerad vinyl fäster de inte, och då "
                 "är det fyllningen i foten som håller stället stilla.")

MONTERING = "Montering krävs, och anvisningen ligger i kartongen."

SKOTSEL_STAL = ("Torka av stålröret med en fuktig trasa och torka efter. Kontrollera "
                "att skruvförbanden sitter åt efter de första träningspassen och sedan "
                "med jämna mellanrum — ett förband som lossnar gör stället ostadigt "
                "långt innan det syns.")

SKOTSEL_SACK = ("Ytan torkas av med en fuktig trasa och lite milt rengöringsmedel. "
                "Använd inte lösningsmedel: de torkar ut ytskiktet och gör det sprött.")

HTML = {}

# ═══════════════════════════════════════════════════ A — ställ UTAN säck ═══
# ☠️ Tre av fem bilder visar en boxsäck som INTE ingår. Meningen står i
# INGRESSEN, inte i en fotnot.
HTML["f8d974b3"] = bygg(
    intro=(
        "Ett hopfällbart ställ att hänga din egen boxsäck i. Ramen är 170 cm lång "
        "och 90 cm bred, och kroken sitter mellan 162 och 205 cm över golvet i tio "
        "lägen. <strong>Boxsäcken ingår inte</strong> — bilderna visar stället i "
        "bruk med en säck du köper separat, och viktskivorna följer inte heller med."
    ),
    avsnitt=[
        ("Tio höjdlägen och en hopfälld bredd på 43 cm", [
            "Överdelen flyttas i tio steg, så kroken kan ställas efter den som ska "
            "träna i stället för tvärtom. Vill du bara ha stället undan mellan "
            "passen fälls det ihop till 182 × 43 × 25 cm och går att ställa på "
            "högkant i ett förråd.",
            MONTERING,
        ]),
        ("Trekantsfot med tre viktstänger", [
            "Foten är trekantig och har tre stänger på Ø2,5 × 12 cm där du träder "
            "på viktskivor, 25 kg per stäng. Det är den tyngden som håller emot när "
            "säcken svänger — ju mer vikt, desto mindre vandrar stället.",
            "Stället bär en <strong>säck på upp till 60 kg</strong>. Talet gäller "
            "säckens vikt, inte den som slår på den.",
        ]),
    ],
    korslank=("Vill du ha säcken på köpet?", (
        "Det här stället säljs utan säck. Behöver du båda delarna i samma köp finns "
        + lank("boxsacksstall-185-231-cm-med-sack",
               "ett ställ där en säck i segelduk ingår") + " och "
        + lank("boxsacksstall-220-cm-20-kg-sack",
               "ett med färdigfylld 20-kilossäck") + "."
    )),
    spec=[
        R("Mått", "170 × 90 cm, 182–225 cm högt"),
        R("Hopfällt", "182 × 43 × 25 cm"),
        R("Krokhöjd", "162–205 cm i tio lägen"),
        R("Bär säck på", "60 kg"),
        R("Viktstänger", "tre, Ø2,5 × 12 cm, 25 kg per stäng"),
        R("Material", "stål"),
        R("Färg", "svart"),
        R("Vikt", "17 kg"),
        R("Ingår", "ställ och anvisning — boxsäck och viktskivor ingår inte"),
    ],
    skotsel=[SKOTSEL_STAL],
    faq=[
        ("Ingår boxsäcken?",
         "Nej. Du får stället och anvisningen. Säcken och viktskivorna köper du "
         "separat, och det gäller även den säck som syns på bilderna."),
        ("Hur tung säck klarar det?",
         "60 kg. Det är säckens vikt stället är byggt för att bära."),
        ("Går det att ställa undan?",
         "Ja. Hopfällt mäter det 182 × 43 × 25 cm."),
        ("Behöver jag borra i taket?",
         "Nej, stället är fristående och står på sin egen trekantsfot."),
    ],
)

HTML["d307632a"] = bygg(
    intro=(
        "Ett ställ som tar två redskap samtidigt: en boxsäck på ena sidan och en "
        "speedball på den andra. Ramen är 160 × 145 cm och går från 175 till 220 cm "
        "i höjd. <strong>Boxsäcken ingår inte</strong> — speedballen gör det."
    ),
    avsnitt=[
        ("Speedball på 25 × 25 cm ingår", [
            "Speedballen hänger i en gummilina mellan överdelen och foten och studsar "
            "tillbaka i samma sekund du träffar den. Den tränar takt och precision, "
            "medan säcksidan tränar tyngd — och båda sitter på samma ram.",
            MONTERING,
        ]),
        ("Sex strävor tar upp studsen", [
            "Ramen har sex förstärkningssträvor, och det är de som gör att stället "
            "står stilla när säcken pendlar. Kroken sitter mellan 165 och 210 cm "
            "över golvet.",
            "Stället bär en <strong>säck på upp till 60 kg</strong>. Talet gäller "
            "säckens vikt, inte användarens.",
        ]),
    ],
    korslank=("Behöver du säcken också?", (
        "Speedballen ingår, men inte boxsäcken. Vill du ha ett ställ där säcken "
        "följer med finns " + lank("boxsacksstall-221-cm-sack-och-boll",
                                   "ett med både säck och punchingboll i samma ram")
        + ", och " + lank("boxsacksstall-182-225-cm-hopfallbart",
                          "ett hopfällbart ställ") + " om du vill kunna ställa undan det."
    )),
    spec=[
        R("Mått", "160 × 145 cm, 175–220 cm högt"),
        R("Krokhöjd", "165–210 cm"),
        R("Speedball", "25 × 25 cm, ingår"),
        R("Förstärkningssträvor", "sex"),
        R("Bär säck på", "60 kg"),
        R("Material", "stål"),
        R("Färg", "svart"),
        R("Vikt", "25 kg"),
        R("Ingår", "ställ, speedball och anvisning — boxsäck ingår inte"),
    ],
    skotsel=[SKOTSEL_STAL],
    faq=[
        ("Ingår boxsäcken?",
         "Nej. Speedballen och stället ingår; säcken köper du separat."),
        ("Hur högt sitter kroken?",
         "Mellan 165 och 210 cm över golvet."),
        ("Hur tung säck klarar det?",
         "60 kg — det är säckens vikt, inte din."),
        ("Kan man använda bara speedballen?",
         "Ja. Speedballen sitter på sin egen sida av ramen och fungerar utan att "
         "en säck hänger på den andra."),
    ],
)

# ═══════════════════════════════════════════════════ B — ställ MED säck ═══
HTML["49d6d56f"] = bygg(
    intro=(
        "Ett rött boxsäcksställ där säcken följer med. Ramen är 175 × 91 cm med "
        "trekantsfot, och överdelen går att flytta från 185 upp till 231 cm. "
        "Säcken är av segelduk, Ø29 × 97 cm, och <strong>levereras ofylld</strong> "
        "— du fyller den själv innan första passet."
    ),
    avsnitt=[
        ("Sjutton lägen på den övre stången", [
            "Den övre stången har sjutton hack, och huvudstången sitter i sin tur i "
            "två lägen: 175–220 cm eller 185–231 cm. Tillsammans betyder det att "
            "kroken går att ställa i små steg över ett stort spann, i stället för att "
            "välja mellan två grova höjder.",
            MONTERING,
        ]),
        ("Trekantsfot och tre viktstänger", [
            "Foten är trekantig och bär tre stänger på Ø2,5 × 15 cm för viktskivor. "
            "Skivorna håller stället på plats när säcken svänger — utan dem vandrar "
            "det på ett halt golv.",
            "Stället bär en <strong>säck på upp till 25 kg</strong>. Talet gäller "
            "säckens vikt, och det är också ungefär vad segelduksäcken väger när den "
            "är fylld.",
        ]),
    ],
    korslank=("Två andra ställ med säck", (
        "Behöver du bära tyngre finns "
        + lank("boxsacksstall-220-cm-20-kg-sack",
               "ett ställ med färdigfylld 20-kilossäck som bär 120 kg") + " och "
        + lank("boxsacksstall-221-cm-sack-och-boll",
               "ett med både säck och punchingboll") + "."
    )),
    spec=[
        R("Mått", "175 × 91 cm, 185–231 cm högt"),
        R("Andra höjdläget", "175–220 cm"),
        R("Lägen på övre stången", "sjutton"),
        R("Säck", "Ø29 × 97 cm i segelduk, levereras ofylld"),
        R("Bär säck på", "25 kg"),
        R("Viktstänger", "tre, Ø2,5 × 15 cm"),
        R("Material", "stål och segelduk"),
        R("Färg", "röd"),
        R("Vikt", "22 kg"),
        R("Ingår", "ställ, säck och anvisning"),
    ],
    skotsel=[
        SKOTSEL_STAL,
        "Segelduk tål att borstas av torr. Blir den fuktig ska den torka helt innan "
        "den hängs tillbaka, annars kan fyllningen klumpa sig.",
    ],
    faq=[
        ("Är säcken fylld när den kommer?",
         "Nej. Säcken är av segelduk och levereras tom — du fyller den själv."),
        ("Hur högt går stället?",
         "Till 231 cm i det högsta läget. Huvudstången har två lägen och den övre "
         "stången sjutton hack."),
        ("Hur tung säck klarar det?",
         "25 kg, och det är säckens vikt talet gäller."),
        ("Vad väger stället?",
         "22 kg utan säck och viktskivor."),
    ],
)

HTML["6f603856"] = bygg(
    intro=(
        "Ett kraftigt boxsäcksställ i Q195-stål med en <strong>färdig 20-kilossäck "
        "och ett gummirep</strong> i paketet. Ramen mäter 123 × 141 × 220 cm och "
        "bär en säck på upp till 120 kg."
    ),
    avsnitt=[
        ("Kedjan roterar 360 grader", [
            "Säcken hänger i en kedja som snurrar fritt hela varvet. Den vrider inte "
            "upp sig under en kombination, så du slipper stanna och reda ut den mellan "
            "serierna.",
            "Gummirepet fästs mellan säckens undersida och foten. Det bromsar pendlingen "
            "och håller säcken kvar i slagläget i stället för att låta den svinga iväg.",
        ]),
        ("U-formad fot med tre hantelskivehållare", [
            "Foten är U-formad och har tre hållare för hantelskivor. Skivorna köper du "
            "själv och lägger på så många som behövs — ju tyngre fot, desto stillare ram.",
            "Stället bär en <strong>säck på upp till 120 kg</strong>. Talet gäller "
            "säckens vikt, inte den som slår på den. Säcken som ingår väger 20 kg och "
            "är Ø30 × 90 cm.",
            MONTERING,
        ]),
    ],
    korslank=("Lättare alternativ", (
        "Behöver du inte 120 kg bärighet finns "
        + lank("boxsacksstall-185-231-cm-med-sack",
               "ett ställ med segelduksäck som går till 231 cm") + " och "
        + lank("boxsacksstall-182-225-cm-hopfallbart",
               "ett hopfällbart ställ utan säck") + "."
    )),
    spec=[
        R("Mått", "123 × 141 × 220 cm"),
        R("Säck", "Ø30 × 90 cm, 20 kg, ingår"),
        R("Bär säck på", "120 kg"),
        R("Hantelskivehållare", "tre"),
        R("Kedja", "roterar 360°"),
        R("Material", "Q195-stål, PVC, EPE och PU-fiber"),
        R("Färg", "svart"),
        R("Vikt", "46,9 kg"),
        R("Ingår", "ställ, säck, gummirep och anvisning"),
    ],
    skotsel=[
        SKOTSEL_STAL,
        SKOTSEL_SACK,
    ],
    faq=[
        ("Ingår säcken?",
         "Ja. En säck på 20 kg och Ø30 × 90 cm följer med, liksom gummirepet."),
        ("Hur tung säck kan jag hänga i stället?",
         "Upp till 120 kg. Talet gäller säckens vikt."),
        ("Vad gör gummirepet?",
         "Det spänns mellan säckens undersida och foten och bromsar pendlingen, "
         "så säcken stannar i slagläget."),
        ("Behöver jag köpa vikter?",
         "Inte för att komma igång. Foten har tre hållare för hantelskivor om du "
         "vill göra stället tyngre; skivorna ingår inte."),
    ],
)

# ☠️ Bollens höjdlägen får INTE skrivas: ingressen säger fyra, punktlistan fem.
# Ritningen ger SPANNET 167–187 cm, och det är det som publiceras.
HTML["c00988e3"] = bygg(
    intro=(
        "Ett ställ som bär både en boxsäck och en punchingboll i samma ram. Säcken "
        "på 20 kg och bollen <strong>ingår båda</strong>, liksom pumpen. Ramen mäter "
        "115 × 157 × 221 cm och bär en säck på upp till 100 kg."
    ),
    avsnitt=[
        ("Två redskap, en ram", [
            "Säcken hänger på ena sidan och punchingbollen sitter under en skiva på "
            "Ø60 cm på den andra. Du kan alltså växla mellan tyngd och takt utan att "
            "flytta något — och utan att ha två ställ i rummet.",
            "Bollen sitter mellan 167 och 187 cm över golvet och flyttas i steg.",
        ]),
        ("Massiv stålram och skum i båda redskapen", [
            "Ramen är av stålrör och står fritt på golvet. Både säcken och bollen är "
            "fyllda med skum, som tar upp stöten i handleden i stället för att skicka "
            "tillbaka den.",
            "Stället bär en <strong>säck på upp till 100 kg</strong>. Talet gäller "
            "säckens vikt, inte användarens. Säcken som ingår är Ø26 × 86 cm och "
            "väger 20 kg.",
            MONTERING,
        ]),
    ],
    korslank=("Om du bara vill ha säcken", (
        "Behöver du inte punchingbollen finns "
        + lank("boxsacksstall-220-cm-20-kg-sack",
               "ett ställ med 20-kilossäck som bär 120 kg") + ", och "
        + lank("boxsacksstall-175-220-cm-speedball",
               "ett ställ med speedball") + " om du vill ha bollen men hänga din egen säck."
    )),
    spec=[
        R("Mått", "115 × 157 × 221 cm"),
        R("Säck", "Ø26 × 86 cm, 20 kg, ingår"),
        R("Punchingboll", "skiva Ø60 × 1,5 cm, 167–187 cm över golvet"),
        R("Bär säck på", "100 kg"),
        R("Material", "stålrör, PVC och MDF"),
        R("Färg", "svart"),
        R("Vikt", "49 kg"),
        R("Ingår", "ställ, säck, punchingboll, pump och anvisning"),
    ],
    skotsel=[
        SKOTSEL_STAL,
        SKOTSEL_SACK,
        "Punchingbollen tappar luft över tid. Pumpen ingår, så fyll på när studsen "
        "känns slö i stället för att slå hårdare.",
    ],
    faq=[
        ("Ingår både säcken och bollen?",
         "Ja, och pumpen. Säcken väger 20 kg och bollen sitter under en skiva på Ø60 cm."),
        ("Hur högt sitter punchingbollen?",
         "Mellan 167 och 187 cm över golvet, och den flyttas i steg."),
        ("Hur tung säck klarar ramen?",
         "100 kg. Talet gäller säckens vikt."),
        ("Hur mycket plats tar det?",
         "115 × 157 cm i golvyta och 221 cm i höjd."),
    ],
)

# ═══════════════════════════════════════════════ C — fristående säck ═══
HTML["7eeb7497"] = bygg(
    intro=(
        "En fristående boxningssäck på 165 cm med sex numrerade träffytor — vita "
        "siffror på röd botten, placerade där en kombination faktiskt landar. "
        "Säcken är Ø30 × 95 cm och står på en fot du fyller med sand eller vatten."
    ),
    avsnitt=[
        ("Sifferytorna gör passet till en övning", [
            "De sex fälten är numrerade ett till sex. Ropa en följd — tre, ett, fyra "
            "— och du tränar reaktion och precision i stället för att bara slå på "
            "en jämn yta. Det fungerar lika bra ensam med en app som med en partner "
            "som ropar.",
        ]),
        ("Foten håller säcken upprätt", [
            "Foten är rund och fylls med sand eller vatten. Sand ger mer tyngd på "
            "samma volym och är att föredra om du sparkar på säcken.",
            FYLLNING_INGAR_EJ,
        ]),
    ],
    korslank=("Andra fristående säckar", (
        "Vill du ha en högre säck finns "
        + lank("boxningssack-170-cm-sugproppar", "en på 170 cm med tolv sugproppar")
        + " och " + lank("boxningssack-180-cm-tre-fjadrar",
                         "en på 180 cm med tre stötdämpande fjädrar") + "."
    )),
    spec=[
        R("Mått", "Ø50 × 165 cm"),
        R("Säck", "Ø30 × 95 cm"),
        R("Träffytor", "sex numrerade, vita siffror på röd botten"),
        R("Material", "HDPE, PVC och EPE"),
        R("Färg", "svart"),
        R("Vikt", "22 kg"),
        R("Ingår", "säck — sand och vatten ingår inte"),
    ],
    skotsel=[SKOTSEL_SACK],
    faq=[
        ("Vad är siffrorna till?",
         "De sex fälten är numrerade ett till sex, så du kan träna bestämda "
         "kombinationer i stället för att slå fritt."),
        ("Ingår fyllningen?",
         "Nej. Foten levereras tom och fylls med sand eller vatten som du köper själv."),
        ("Sand eller vatten?",
         "Sand ger mer tyngd på samma volym och står stadigare. Vatten är lättare "
         "att fylla på och tömma."),
        ("Hur hög är den?",
         "165 cm totalt, och själva säcken är 95 cm hög."),
    ],
)

# ☠️ Materialet tas ur tyskans Technische Daten. Spec-raden sager sammet, skum
# och gummitra — en MOBELSPEC, kopierad fran en annan produkt (#366).
HTML["1409d762"] = bygg(
    intro=(
        "En fristående boxningssäck på 170 cm med <strong>tolv sugproppar</strong> "
        "under foten och en kraftig fjäder i botten. Säcken är Ø28 × 110 cm och "
        "klädd i mjuk PU över en stålkärna."
    ),
    avsnitt=[
        ("Tolv sugproppar och en fjäder", [
            "Fjädern i botten ger säcken en snabb återgång: den kommer tillbaka i "
            "slagläget i stället för att luta undan. Det gör att du kan hålla takten "
            "uppe i en kombination.",
            SUGPROPP_GOLV,
        ]),
        ("Stor slagyta och tät sömnad", [
            "Säcken är 110 cm hög, vilket ger en yta som räcker för både kroppsslag "
            "och höga sparkar. Ytan är sydd med tät söm över ett skikt av PU, och "
            "stommen är stål.",
            "Foten är Ø48 × 30 cm och fylls med sand eller vatten. " + FYLLNING_INGAR_EJ,
            MONTERING,
        ]),
    ],
    korslank=("Två närliggande höjder", (
        "Behöver du en lägre säck finns "
        + lank("boxningssack-165-cm-traffytor", "en på 165 cm med numrerade träffytor")
        + ", och " + lank("boxningssack-175-cm-slagdyna",
                          "en på 175 cm med höj- och sänkbar slagdyna")
        + " om du vill träna mot en mindre yta."
    )),
    spec=[
        R("Mått", "Ø50 × 170 cm"),
        R("Säck", "Ø28 × 110 cm"),
        R("Fot", "Ø48 × 30 cm"),
        R("Sugproppar", "tolv"),
        R("Material", "stål, PU och HDPE"),
        R("Färg", "svart"),
        R("Vikt", "20,8 kg"),
        R("Ingår", "säck och anvisning — sand och vatten ingår inte"),
    ],
    skotsel=[
        SKOTSEL_SACK,
        "Sugpropparna håller bäst på ett dammfritt golv. Torka av både golvet och "
        "propparna innan du sätter säcken på plats.",
    ],
    faq=[
        ("Vilka golv fungerar sugpropparna på?",
         "De biter mot slätt, rent och tätt golv som klinker, lackad parkett "
         "eller plastmatta. På matta eller obehandlat trä är det fyllningen i foten "
         "som håller säcken stilla."),
        ("Ingår sanden?",
         "Nej. Foten levereras tom."),
        ("Hur stor är slagytan?",
         "Säcken är Ø28 cm och 110 cm hög."),
        ("Vad gör fjädern?",
         "Den ger säcken en snabb återgång, så den kommer tillbaka i slagläget i "
         "stället för att luta undan."),
    ],
)

HTML["0deb6901"] = bygg(
    intro=(
        "En fristående boxningssäck på 175 cm med en <strong>slagdyna som flyttas "
        "mellan 65 och 175 cm</strong>. Sätt den i huvudhöjd eller i kroppshöjd och "
        "träna det slaget för sig, mot en yta som är mindre än säcken själv."
    ),
    avsnitt=[
        ("Slagdynan är det som skiljer den från en vanlig säck", [
            "Dynan sitter på ett fäste som går att höja och sänka utan verktyg över "
            "hela spannet 65–175 cm. Låg dyna tränar kroppsslag, hög dyna tränar "
            "huvudhöjd — och du byter mellan dem mitt i passet.",
            "Handlindor ingår.",
        ]),
        ("Foten tar 50 kg och sitter på sugproppar", [
            "Foten är Ø58 × 38 cm och fylls med vatten, sand eller båda: 30 kg med "
            "vatten, 45 kg med sand och 50 kg med en blandning. Sugpropparna under "
            "foten håller den kvar på ett slätt golv.",
            FYLLNING_INGAR_EJ,
            MONTERING,
        ]),
    ],
    korslank=("Om du hellre vill ha hela säcken", (
        "Utan slagdyna finns "
        + lank("boxningssack-170-cm-sugproppar", "en säck på 170 cm med tolv sugproppar")
        + " och " + lank("boxningssack-180-cm-20-sugproppar",
                         "en på 180 cm med tjugo") + "."
    )),
    spec=[
        R("Mått", "57 × 57 × 175 cm"),
        R("Säck", "Ø32 × 120 cm"),
        R("Slagdyna", "65–175 cm över golvet"),
        R("Fot", "Ø58 × 38 cm"),
        R("Foten rymmer", "30 kg vatten, 45 kg sand eller 50 kg blandat"),
        R("Material", "plast och stål"),
        R("Färg", "svart"),
        R("Vikt", "25,6 kg"),
        R("Ingår", "säck, handlindor och anvisning — sand och vatten ingår inte"),
    ],
    skotsel=[SKOTSEL_SACK],
    faq=[
        ("Hur flyttar man slagdynan?",
         "Den sitter på ett fäste som höjs och sänks över hela spannet 65–175 cm."),
        ("Hur tung blir foten?",
         "30 kg med vatten, 45 kg med sand och 50 kg med en blandning av båda."),
        ("Ingår fyllningen?",
         "Nej, den köper du själv. Handlindorna ingår däremot."),
        ("Kan man använda säcken utan dynan?",
         "Ja. Dynan sitter på sitt eget fäste och säcken fungerar som en vanlig "
         "fristående säck utan den."),
    ],
)

# ☠️ Fargen: spec-raden sager bara svart, Technische Daten Schwarz+Rot. BILDEN
# avgor en SYNLIG egenskap — bild 1, 3 och 5 visar svart kropp med rott parti.
HTML["74602345"] = bygg(
    intro=(
        "En fristående boxningssäck på 180 cm i svart och rött, med "
        "<strong>tre stötdämpande fjädrar</strong> där stången möter foten. "
        "Fjädrarna tar upp skakningen så att slaget känns som ett slag och inte "
        "som en studs genom hela stället."
    ),
    avsnitt=[
        ("Tre fjädrar i stället för en", [
            "Säcken på 170 cm intill har en fjäder i botten. Den här har tre. Det gör "
            "återgången jämnare och dämpar den vibration som annars går upp genom "
            "säcken efter en hård träff.",
            "Säcken bär ett kinesiskt skrifttecken för kampsport, tryckt på framsidan.",
        ]),
        ("Tio sugproppar och en fot på 60 kg", [
            "Foten är Ø60 × 40 cm och har tio sugproppar på Ø8 cm under sig. Fylld "
            "med sand tar den 60 kg, med vatten 50 kg.",
            SUGPROPP_GOLV,
            FYLLNING_INGAR_EJ,
        ]),
    ],
    korslank=("Den andra 180-centimetern", (
        "Vi har en till säck på 180 cm: "
        + lank("boxningssack-180-cm-20-sugproppar",
               "den har tjugo sugproppar och en fot som tar 120 kg sand")
        + ", alltså dubbelt så mycket tyngd. Den här är lättare att flytta."
    )),
    spec=[
        R("Mått", "Ø60 × 180 cm"),
        R("Säck", "Ø25 × 110 cm"),
        R("Fot", "Ø60 × 40 cm"),
        R("Foten rymmer", "50 kg vatten eller 60 kg sand"),
        R("Sugproppar", "tio, Ø8 cm"),
        R("Fjädrar", "tre"),
        R("Material", "PU, EPE och HDPE"),
        R("Färg", "svart och rött"),
        R("Vikt", "24 kg"),
        R("Ingår", "säck och tio sugproppar — sand och vatten ingår inte"),
    ],
    skotsel=[SKOTSEL_SACK],
    faq=[
        ("Vad gör de tre fjädrarna?",
         "De dämpar vibrationen efter en träff och ger en jämnare återgång än en "
         "enda fjäder."),
        ("Hur tung blir foten?",
         "60 kg med sand eller 50 kg med vatten."),
        ("Ingår sanden?",
         "Nej. Foten levereras tom."),
        ("Vad är tecknet på säcken?",
         "Ett kinesiskt skrifttecken för kampsport, tryckt på framsidan."),
    ],
)

# ☠️ HANDSKARNA NAMNS INTE. Beschreibung lovar dem, Lieferumfang listar dem
# inte — och leveranslistan ar kontraktet (#468).
HTML["702c7795"] = bygg(
    intro=(
        "En hög fristående säck: 180 cm, "
        "<strong>tjugo sugproppar</strong> under foten och plats för 120 kg sand. "
        "Kärnan är Q195-stål och slagytan är Ø32 × 115 cm."
    ),
    avsnitt=[
        ("Tjugo sugproppar och 120 kg i foten", [
            "Foten mäter 60 × 60 × 40 cm och tar 120 kg sand eller 70 kg vatten. "
            "Det är mer än dubbelt mot en vanlig fristående säck, och det är det som "
            "gör att den står still även när du sparkar.",
            SUGPROPP_GOLV,
            FYLLNING_INGAR_EJ,
        ]),
        ("Gummiring som dämpar ljudet", [
            "En gummibuffert sitter där stången möter foten. Den tar upp stöten och "
            "dämpar ljudet — det som gör skillnad i en lägenhet är inte slaget utan "
            "dunsen som går ner i golvet.",
            "Kärnan är ett rör av Q195-stål, och mantelns flera skikt håller formen "
            "i stället för att bukta.",
        ]),
    ],
    korslank=("Den lättare 180-centimetern", (
        "Vill du ha samma höjd men en säck som är lättare att flytta finns "
        + lank("boxningssack-180-cm-tre-fjadrar",
               "en på 180 cm med tre stötdämpande fjädrar och tio sugproppar") + "."
    )),
    spec=[
        R("Mått", "60 × 60 × 180 cm"),
        R("Säck", "Ø32 × 115 cm"),
        R("Fot", "60 × 60 × 40 cm"),
        R("Foten rymmer", "70 kg vatten eller 120 kg sand"),
        R("Sugproppar", "tjugo"),
        R("Material", "Q195-stål, EPE, PU och PVC"),
        R("Färg", "svart"),
        R("Vikt", "32,9 kg"),
        R("Ingår", "säck och anvisning — sand och vatten ingår inte"),
    ],
    skotsel=[SKOTSEL_SACK],
    faq=[
        ("Hur mycket väger den fylld?",
         "Foten tar 120 kg sand eller 70 kg vatten, utöver säckens egna 32,9 kg."),
        ("Fungerar sugpropparna på matta?",
         "Nej. De behöver ett slätt, rent och tätt golv. På matta är det fyllningen "
         "i foten som gör jobbet."),
        ("Dämpar den ljudet?",
         "En gummibuffert sitter mellan stången och foten och tar upp stöten, vilket "
         "dämpar dunsen ner i golvet."),
        ("Ingår sanden?",
         "Nej. Foten levereras tom."),
    ],
)

HTML["c5c228ab"] = bygg(
    intro=(
        "En fristående boxningssäck klädd i <strong>konstläder</strong>, brun upptill "
        "och svart nedtill. Höjden ställs mellan 158 och 186 cm, och slagytan är "
        "Ø36 × 80 cm — en bred slagyta för en fristående säck."
    ),
    avsnitt=[
        ("Bred slagyta i konstläder", [
            "Ytan är Ø36 cm, alltså bredare än de Ø25–32 cm som säckarna intill mäter. "
            "Det ger mer marginal på en träff som inte sitter mitt i, och konstlädret "
            "känns torrare mot handsken än en PU-yta.",
            "Kopplingsstången mellan säck och fot är 26 cm och det är den som ger "
            "höjdjusteringen.",
        ]),
        ("Låg tyngdpunkt", [
            "Foten är Ø55 × 60 cm — hög och smal snarare än bred och platt. Hela "
            "säcken väger 15,6 kg tom, alltså lätt nog att bära undan mellan "
            "passen innan foten fylls.",
            FYLLNING_INGAR_EJ,
        ]),
    ],
    korslank=("Om du vill ha en formad kropp i stället", (
        "Den här är en rak säck. Vill du träna mot en kropp med armar och markerade "
        "träffytor finns " + lank("boxdocka-178-207-cm-traffytor",
                                  "en boxdocka på 178–207 cm") + "."
    )),
    spec=[
        R("Mått", "58 × 58 cm, 158–186 cm högt"),
        R("Slagyta", "Ø36 × 80 cm"),
        R("Fot", "Ø55 × 60 cm"),
        R("Kopplingsstång", "26 cm"),
        R("Material", "konstläder och plast"),
        R("Färg", "brun och svart"),
        R("Vikt", "15,6 kg"),
        R("Ingår", "säck — sand och vatten ingår inte"),
    ],
    skotsel=[
        "Konstläder torkas av med en fuktig trasa och torkas efter. Undvik "
        "lösningsmedel och starka rengöringsmedel — de torkar ut ytan och gör den "
        "spröd.",
    ],
    faq=[
        ("Hur bred är slagytan?",
         "Ø36 cm och 80 cm hög. Säckarna intill mäter Ø25–32 cm."),
        ("Går höjden att ställa?",
         "Ja, mellan 158 och 186 cm."),
        ("Vad väger den?",
         "15,6 kg tom. Foten fylls sedan med sand eller vatten som du köper själv."),
        ("Är det äkta läder?",
         "Nej, konstläder."),
    ],
)

# ═══════════════════════════════════════════════════════ D — boxdocka ═══
HTML["9119599f"] = bygg(
    intro=(
        "En boxdocka med <strong>formad kropp och färgmarkerade träffytor</strong> — "
        "inte en rak säck. Kroppen är 46 cm bred och 90 cm hög, och hela dockan går "
        "från 178 till 207 cm i höjd."
    ),
    avsnitt=[
        ("Träffytorna sitter där de hör hemma", [
            "De ljusa fälten är utlagda efter en kropp: käke, kroppsöppning och "
            "revben. Att sikta mot ett markerat fält är något annat än att slå mot "
            "en jämn cylinder — du tränar var slaget ska landa, inte bara att det "
            "landar.",
            "Materialet är elastiskt och tar upp stöten, så träningen blir "
            "skonsammare mot handleder och knogar än mot en hård yta.",
        ]),
        ("Fot på 55 kg och höjd efter användaren", [
            "Foten är Ø53 × 60 cm och tar 40 kg vatten, 50 kg sand eller 55 kg av "
            "båda. Höjden ställs mellan 178 och 207 cm, så samma docka fungerar för "
            "flera i hushållet.",
            FYLLNING_INGAR_EJ,
            MONTERING,
        ]),
    ],
    korslank=("Om en rak säck räcker", (
        "Behöver du inte den formade kroppen finns "
        + lank("boxningssack-158-186-cm-konstlader",
               "en fristående säck i konstläder med Ø36 cm slagyta") + " och "
        + lank("boxningssack-180-cm-20-sugproppar",
               "en tung säck på 180 cm") + "."
    )),
    spec=[
        R("Mått", "55 × 55 cm, 178–207 cm högt"),
        R("Kropp", "46 cm bred, 90 cm hög"),
        R("Fot", "Ø53 × 60 cm"),
        R("Foten rymmer", "40 kg vatten, 50 kg sand eller 55 kg blandat"),
        R("Material", "HDPE, PVC och PU"),
        R("Färg", "svart, grått och blått"),
        R("Vikt", "22,3 kg"),
        R("Ingår", "docka och anvisning — sand och vatten ingår inte"),
    ],
    skotsel=[SKOTSEL_SACK],
    faq=[
        ("Vad är skillnaden mot en boxsäck?",
         "Dockan har en formad kropp med markerade träffytor, så du kan träna var "
         "slaget ska landa. En säck är en jämn cylinder."),
        ("Hur högt går den?",
         "Mellan 178 och 207 cm, så den ställs efter den som tränar."),
        ("Hur tung blir foten?",
         "40 kg med vatten, 50 kg med sand och 55 kg med en blandning."),
        ("Ingår fyllningen?",
         "Nej. Foten levereras tom."),
    ],
)

# ═══════════════════════════════════ E — boxställ med speedball ═══
# Tre fargsyskon delar allt utom fargen — och 438295ae bar dessutom husmarket
# pa kroppen samt en ritning som saeger 45 cm dar texten saeger 50. Boxstangens
# langd skrivs darfor INTE pa den raden.
def _speedballstall(farg, farg_i_text, syskon):
    lankar = " och ".join(lank(s, t) for s, t in syskon)
    return dict(
        intro=(
            "Ett %s boxställ med <strong>två speedballs och en kickdyna</strong> på "
            "samma stång. Höjden går från 140 till 205 cm, och foten är bara "
            "34 × 34 cm — det tar mindre golvyta än en pall."
            % farg_i_text
        ),
        avsnitt=[
            ("Tre redskap i ett", [
                "Den övre speedballen tränar takt och handögonkoordination. Den undre "
                "sitter i midjehöjd för korta krokar. Kickdynan på Ø15 × 53 cm är den "
                "du sparkar mot. Alla tre sitter på samma stång, och du växlar mellan "
                "dem utan att flytta något.",
                "Kickdynan sitter mellan 53 och 115 cm över golvet. Överst "
                "sitter dessutom en boxstång att slå raka slag mot.",
            ]),
            ("Fjäderfot som går tillbaka", [
                "Foten är 34 × 34 cm och står på fjädrar. Stället viker undan vid en "
                "träff och kommer tillbaka i upprätt läge — det är den rörelsen som "
                "gör att du kan hålla en serie igång.",
                "Luftpump ingår. Både speedballarna och kickdynan är uppblåsbara, och "
                "studsen beror på trycket i dem.",
            ]),
        ],
        korslank=("Samma ställ i andra färger", (
            "Det här stället finns också som " + lankar + "."
        )),
        spec=[
            R("Mått", "107 × 36 cm, 140–205 cm högt"),
            R("Fot", "34 × 34 cm"),
            R("Kickdyna", "Ø15 × 53 cm, 53–115 cm över golvet"),
            R("Speedballs", "två, Ø15 × 17 cm"),
            R("Boxstång", "ingår"),
            R("Material", "stål och konstläder"),
            R("Färg", farg),
            R("Vikt", "13,5 kg"),
            R("Ingår", "ställ, luftpump och anvisning"),
        ],
        skotsel=[
            SKOTSEL_STAL,
            "Bollarna och dynan tappar luft över tid. Pumpen ingår — fyll på när "
            "studsen känns slö i stället för att slå hårdare.",
        ],
        faq=[
            ("Vad är de två bollarna till?",
             "Den övre tränar takt och handögonkoordination, den undre sitter i "
             "midjehöjd för korta krokar."),
            ("Hur mycket plats tar det?",
             "Foten är 34 × 34 cm. Stället är 107 cm brett räknat med utslagna delar "
             "och 140–205 cm högt."),
            ("Måste man fylla foten?",
             "Nej. Foten står på fjädrar och behöver ingen fyllning — stället väger "
             "13,5 kg."),
            ("Ingår pumpen?",
             "Ja. Både bollarna och kickdynan är uppblåsbara."),
        ],
    )


HTML["86f2cb63"] = bygg(**_speedballstall(
    "rött, vitt och svart", "rött",
    [("boxstall-blatt-140-205-cm", "blått"),
     ("boxstall-svart-140-205-cm", "svart")]))

HTML["57986794"] = bygg(**_speedballstall(
    "blå", "blått",
    [("boxstall-rott-140-205-cm", "rött"),
     ("boxstall-svart-140-205-cm", "svart")]))

HTML["438295ae"] = bygg(**_speedballstall(
    "svart", "svart",
    [("boxstall-rott-140-205-cm", "rött"),
     ("boxstall-blatt-140-205-cm", "blått")]))

HTML["87ec8a16"] = bygg(
    intro=(
        "Ett boxställ med <strong>reflexstång, slagdyna och speedball</strong> på "
        "samma stolpe. Höjden går från 163 till 205 cm och foten fylls med sand "
        "eller vatten i stället för att stå på fjädrar."
    ),
    avsnitt=[
        ("Tre redskap som tränar olika saker", [
            "Reflexstången på Ø6 × 45 cm svänger runt när du missar — det är den som "
            "tränar dig att ducka. Slagdynan på Ø18 cm är målet för raka slag, och "
            "speedballen på Ø15 × 17 cm sätter takten.",
            "Handlindor och luftpump ingår.",
        ]),
        ("Fot som fylls i tre steg", [
            "Foten tar 30 kg vatten, 35 kg sand eller 40 kg av båda blandat. Ju mer "
            "tyngd, desto mindre rör sig stolpen när reflexstången svänger.",
            FYLLNING_INGAR_EJ,
        ]),
    ],
    korslank=("Ställ med två speedballs i stället", (
        "Vill du ha två bollar och en kickdyna i stället för reflexstång finns samma "
        "ställtyp i " + lank("boxstall-rott-140-205-cm", "rött") + ", "
        + lank("boxstall-blatt-140-205-cm", "blått") + " och "
        + lank("boxstall-svart-140-205-cm", "svart") + "."
    )),
    spec=[
        R("Mått", "80,5 × 48 cm, 163–205 cm högt"),
        R("Reflexstång", "Ø6 × 45 cm"),
        R("Slagdyna", "Ø18 × 7 cm"),
        R("Speedball", "Ø15 × 17 cm"),
        R("Foten rymmer", "30 kg vatten, 35 kg sand eller 40 kg blandat"),
        R("Material", "stål, HDPE och konstläder"),
        R("Färg", "svart, rött och blått"),
        R("Vikt", "12,5 kg"),
        R("Ingår", "ställ, luftpump, handlindor och anvisning — sand och vatten "
                   "ingår inte"),
    ],
    skotsel=[
        SKOTSEL_STAL,
        "Bollen och dynan tappar luft över tid. Pumpen ingår.",
    ],
    faq=[
        ("Vad gör reflexstången?",
         "Den svänger runt stolpen när du missar, så du måste ducka eller parera. "
         "Det tränar reaktion snarare än slagstyrka."),
        ("Måste foten fyllas?",
         "Ja. Den tar 30 kg vatten, 35 kg sand eller 40 kg blandat, och fyllningen "
         "är det som håller stolpen stilla."),
        ("Ingår handlindor?",
         "Ja, tillsammans med luftpumpen."),
        ("Hur mycket plats tar det?",
         "80,5 × 48 cm i golvyta och 163–205 cm i höjd."),
    ],
)

# ═══════════════════════════════════════════════════════ F — väggfäste ═══
# ☠️ Steg 2: leverantorens uppraekning betong/tegel/massivt tra ar en VARNING.
# Bild 2, 4 och 5 visar fastet pa en SLAT vagg — texten maste motsaga bilden.
# Och saecken syns pa samma tre bilder utan att inga.
HTML["b6c4c619"] = bygg(
    intro=(
        "Ett väggfäste som håller din boxsäck 80 cm ut från väggen, i nio olika "
        "vinklar. <strong>Boxsäcken ingår inte</strong> — bilderna visar fästet i "
        "bruk med en säck du köper separat. Fästet bär en säck på upp till 100 kg."
    ),
    avsnitt=[
        ("Nio vinklar, inte en fast arm", [
            "Armen låses i nio lägen. Står säcken i vägen mellan passen viker du in "
            "den mot väggen; ska du gå runt den svänger du ut den. Det är skillnaden "
            "mot ett fast fäste, som bara har ett läge.",
            "Skruvar, vridkrok och karbinhake ingår, så säcken går att haka på och av.",
        ]),
        ("Underlaget avgör, inte fästet", [
            "Fästet är byggt för <strong>betong, tegel eller massivt trä</strong>. En "
            "vanlig svensk innervägg är gips på reglar, och en gipsskiva håller inte "
            "en säck som får en spark — den släpper, med hela vikten i fritt fall.",
            "Ska fästet sitta på en regelvägg måste skruvarna gå i reglarna, inte i "
            "skivan. Fästet är 80 cm brett och kan alltså nå två reglar på "
            "standardavstånd, men det kräver att du mäter först. Är du osäker på "
            "väggen: fråga någon som kan bedöma den innan du borrar.",
            "Fästet bär en <strong>säck på upp till 100 kg</strong>. Talet gäller "
            "säckens vikt, inte den som slår på den — och det förutsätter att "
            "infästningen håller.",
        ]),
    ],
    korslank=("Ingen vägg som duger?", (
        "Kan väggen inte bära finns fristående alternativ som inte kräver någon "
        "infästning alls: " + lank("boxsacksstall-182-225-cm-hopfallbart",
                                   "ett hopfällbart golvställ") + " eller "
        + lank("boxningssack-180-cm-20-sugproppar",
               "en fristående säck med fyllbar fot") + "."
    )),
    spec=[
        R("Mått", "80 × 17 × 48 cm"),
        R("Stödstång", "80 × 5 × 5 cm"),
        R("Vinklar", "nio"),
        R("Bär säck på", "100 kg"),
        R("Underlag", "betong, tegel eller massivt trä"),
        R("Material", "stål"),
        R("Färg", "svart"),
        R("Vikt", "7 kg"),
        R("Ingår", "fäste, skruvar, vridkrok, karbinhake och anvisning — "
                   "boxsäck ingår inte"),
    ],
    skotsel=[
        "Kontrollera infästningen efter de första passen och sedan med jämna "
        "mellanrum. En skruv som börjat ge sig syns som ett litet glapp långt innan "
        "den släpper.",
        "Torka av stålet med en fuktig trasa och torka efter.",
    ],
    faq=[
        ("Vilka väggar fungerar?",
         "Betong, tegel eller massivt trä. På en gipsvägg måste skruvarna gå i "
         "reglarna — gipsskivan ensam håller inte en säck som får en spark."),
        ("Ingår boxsäcken?",
         "Nej. Du får fästet, skruvar, vridkrok, karbinhake och anvisning."),
        ("Hur tung säck klarar det?",
         "100 kg, förutsatt att infästningen i väggen håller. Talet gäller säckens "
         "vikt."),
        ("Hur långt ut från väggen sitter säcken?",
         "80 cm, och armen låses i nio vinklar."),
    ],
)
