# -*- coding: utf-8 -*-
"""Runda 142 — brödtexten per produkt.

Husstilen (mätt på 1 154 publicerade sidor): spec-blocket är `<ul>`, inte
`<table>`. Alla tre flikrubrikerna är obligatoriska och ORDAGRANNA.

⚠️ Allt som ska ligga i BRÖDTEXTEN står FÖRE första flikrubriken —
korslänken sist av dem.
"""


def R(etikett, varde):
    return "<li><p>%s: %s</p></li>" % (etikett, varde)


def F(fraga, svar):
    # TVA stycken. Wix strippar <br>, sa frage-och-svar i ETT stycke klistras
    # ihop utan radbrytning (uppmatt 2026-08-21).
    return "<p><strong>%s</strong></p><p>%s</p>" % (fraga, svar)


def H(rubrik, *stycken):
    return "<h2>%s</h2>" % rubrik + "".join("<p>%s</p>" % s for s in stycken)


def bygg(intro, avsnitt, korslank, spec, skotsel, faq):
    """Sätter ihop sidan i den ordning `splitFlikar` kräver."""
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


# Delade stycken. ORDAGRANT delade med flit: fyllningen och sugpropparna är
# samma sak på varje modell som har dem, och en omskrivning per sida är elva
# chanser att införa ett fel.
FYLLNING_INGAR_EJ = ("Fyllningen köper du själv — foten levereras tom, och "
                     "det är den som gör att stället står kvar när du slår.")
SUGPROPP_GOLV = ("Sugpropparna biter mot ett slätt och rent golv: parkett, "
                 "laminat, klinker eller ett gummigolv i ett träningsrum. På "
                 "heltäckningsmatta finns inget att suga fast i, och då är det "
                 "vikten i foten som håller emot.")


HTML = {}

# ---------------------------------------------------------------- punchingboll
HTML["56cca82a"] = bygg(
    "En punchingboll som står på golvet och tränar hastighet, timing och "
    "andhämtning utan att något skruvas i vägg eller tak. Stången låses i fyra "
    "fasta höjder mellan 125 och 145 centimeter, och den fjädrande infästningen "
    "skickar tillbaka bollen direkt efter varje träff.",
    [
        ("Fyra fasta höjder, inte ett glapp",
         ["Stången låses i 125, 131, 138 eller 145 centimeter. Fasta lägen i "
          "stället för en glidande klämma betyder att höjden står kvar där du "
          "satte den även efter en lång omgång — och att två personer i olika "
          "längd kan byta på några sekunder."]),
        ("Foten fylls med vatten eller sand",
         ["Foten är 43 centimeter i diameter och 12 centimeter hög. Den rymmer "
          "15 kilo vatten eller 20 kilo sand. Sand ger mer tyngd på samma "
          "volym och står stadigare mot hårda träffar; vatten är enklare att "
          "fylla och tömma om bollen ska flyttas mellan rum. " +
          FYLLNING_INGAR_EJ]),
        ("Handskar och pump ligger i kartongen",
         ["Ett par boxhandskar och en luftpump följer med, så bollen går att "
          "blåsa upp och använda samma kväll. Bollen mäter 24 × 30 centimeter."]),
        ("Färgen går inte att välja",
         ["Den här modellen skickas i rött, svart eller rött och svart, och "
          "vilken av dem som kommer går inte att styra vid beställning. Mått, "
          "funktion och innehåll är desamma i alla tre."]),
    ],
    ("Vill du ha mer tyngd i foten?",
     "Samma höjdspann, 125 till 145 centimeter, finns som " +
     lank("punchingboll-viktsack-125-145-cm",
          "punchingboll med en viktsäck på 15 kilo") +
     " runt foten utöver fyllningen."),
    [
        R("Höjd", "125/131/138/145 cm"),
        R("Fot", "Ø43 × 12 cm"),
        R("Boll", "Ø24 × 30 cm"),
        R("Fotens fyllning", "15 kg vatten eller 20 kg sand"),
        R("Material", "konstläder, stål och plast"),
        R("Vikt", "3 kg"),
        R("Fraktvikt", "3,5 kg"),
        R("Paketmått", "43 × 13 × 50 cm"),
        R("Ingår", "punchingbollen med ställ, ett par boxhandskar, en luftpump "
                   "och monteringsanvisning"),
        R("Montering", "krävs"),
    ],
    ["Fyll foten innan du slår första slaget. En tom fot vandrar på golvet och "
     "kan välta.",
     "Torka av bollen med en lätt fuktad trasa efter passet. Konstläder tål "
     "svett, men torkar salt in i sömmarna nöts ytan snabbare.",
     "Kontrollera fjädern och skruvförbanden i stången med några veckors "
     "mellanrum. Upprepade slag lossar förband över tid.",
     "Ska bollen stå oanvänd en längre tid — töm foten på vatten. Stillastående "
     "vatten i en sluten plastfot blir unket.",
     "Släpp ut lite luft ur bollen inför längre förvaring. En hårt uppblåst "
     "boll i ett varmt utrymme tänjer på sömmarna."],
    [
        ("Vilka höjder går den att ställas i?",
         "Fyra fasta lägen: 125, 131, 138 och 145 centimeter."),
        ("Vad fyller jag foten med?",
         "15 kilo vatten eller 20 kilo sand. " + FYLLNING_INGAR_EJ),
        ("Behöver jag borra i väggen?",
         "Nej. Bollen står fritt på golvet och hela stabiliteten kommer från "
         "den fyllda foten."),
        ("Vilken färg får jag?",
         "Rött, svart eller rött och svart — vilken som skickas går inte att "
         "välja. Mått och innehåll är desamma."),
        ("Vad ingår?",
         "Punchingbollen med ställ, ett par boxhandskar, en luftpump och "
         "monteringsanvisning."),
        ("Hur mycket väger den utan fyllning?",
         "3 kilo. Fraktvikten med emballage är 3,5 kilo."),
        ("Går den att flytta mellan rum?",
         "Ja. Töm foten först — fylld med vatten väger den runt 18 kilo, och "
         "det är inget man bär i en stång."),
        ("Fungerar den på heltäckningsmatta?",
         "Ja. Foten håller sig på plats med sin egen tyngd och har ingen "
         "sugpropp som behöver ett slätt underlag."),
    ],
)

HTML["ce8813ce"] = bygg(
    "En svart punchingboll för hemmet som ställs mellan 133 och 151 centimeter. "
    "Foten tar 33 kilo sand, och en sugpropp i botten håller emot de träffar "
    "som annars flyttar stället i sidled.",
    [
        ("33 kilo sand i foten",
         ["Foten mäter 43 centimeter i diameter och 13,5 centimeter på höjden "
          "och rymmer 16,5 kilo vatten, 33 kilo sand eller 25 kilo av båda "
          "blandat. Sand väger dubbelt så mycket som vatten på samma volym, "
          "och det är den skillnaden som märks vid tunga kombinationer. "
          + FYLLNING_INGAR_EJ]),
        ("Sugproppen tar sidorörelsen",
         ["Under foten sitter en sugpropp som greppar mot släta golv. Den "
          "hindrar inte att bollen studsar — den hindrar att hela stället "
          "kryper i sidled när du jobbar runt det. " + SUGPROPP_GOLV]),
        ("Fjädrande stång, liten boll",
         ["Bollen mäter 18 × 26 centimeter och sitter på en fjäder. En mindre "
          "boll rör sig snabbare och kräver tajtare träffar än en stor — det är "
          "reaktionsträning snarare än kraftträning."]),
    ],
    ("Behöver du ett högre läge?",
     "Se " +
     lank("punchingboll-136-154-cm-fyra-lagen",
          "punchingbollen med fyra fasta lägen mellan 136 och 154 centimeter") +
     ", som står på en bredare fot: 48 centimeter i diameter."),
    [
        R("Höjd", "133–151 cm"),
        R("Fot", "Ø43 × 13,5 cm"),
        R("Boll", "Ø18 × 26 cm"),
        R("Fotens fyllning", "16,5 kg vatten, 33 kg sand eller 25 kg blandat"),
        R("Fäste mot golvet", "sugpropp i botten"),
        R("Färg", "svart"),
        R("Material", "plast, konstläder och metall"),
        R("Fraktvikt", "3,6 kg"),
        R("Paketmått", "45 × 14 × 55 cm"),
        R("Ingår", "punchingbollen med ställ, ett par boxhandskar, en luftpump "
                   "och monteringsanvisning"),
        R("Montering", "krävs"),
    ],
    ["Fyll foten först, ställ sedan höjden. En tom fot ger ett missvisande "
     "intryck av hur stadig bollen är.",
     "Tryck ner stället på golvet så att sugproppen får fäste innan passet "
     "börjar. Damm under proppen halverar greppet.",
     "Torka av konstlädret med en lätt fuktad trasa efter träningen och låt det "
     "lufttorka. Använd inget lösningsmedel — det gör ytan matt och spröd.",
     "Dra åt fjäderns förband några gånger per säsong. Slag arbetar loss "
     "skruvar långsamt och tyst.",
     "Töm vattenfoten inför längre uppehåll och låt den stå öppen tills den "
     "är torr invändigt."],
    [
        ("Hur högt går den att ställa?",
         "Mellan 133 och 151 centimeter."),
        ("Hur mycket rymmer foten?",
         "16,5 kilo vatten, 33 kilo sand eller 25 kilo av båda blandat. " +
         FYLLNING_INGAR_EJ),
        ("Vad gör sugproppen?",
         "Den greppar mot golvet och hindrar att stället kryper i sidled. "
         "Den kräver ett slätt och rent underlag."),
        ("Hur stor är bollen?",
         "18 × 26 centimeter — en mindre boll som rör sig snabbt och tränar "
         "reaktion mer än kraft."),
        ("Vad ingår?",
         "Punchingbollen med ställ, ett par boxhandskar, en luftpump och "
         "monteringsanvisning."),
        ("Behöver jag verktyg?",
         "Montering krävs och anvisningen följer med. Stället skruvas ihop för "
         "hand i de flesta steg."),
        ("Fungerar den på heltäckningsmatta?",
         "Bollen står, men sugproppen får inget fäste. Fyll foten med sand i "
         "stället för vatten för att kompensera."),
        ("Går den att fälla ihop?",
         "Stången går att ta isär för förvaring. Foten är i ett stycke och "
         "töms i stället."),
    ],
)


HTML["93073695"] = bygg(
    "Den här punchingbollen har en viktsäck på 15 kilo som spänns runt foten "
    "utöver fyllningen. Det är den enskilt billigaste vägen till ett ställ som "
    "inte rör sig, och säcken går att lyfta av och använda för sig.",
    [
        ("Viktsäcken är 15 kilo ovanpå fyllningen",
         ["Runt foten sitter en röd säck med bärhandtag som rymmer 15 kilo. "
          "Den läggs ovanpå den fyllda foten, inte i stället för den, och "
          "sänker tyngdpunkten ytterligare. Säcken levereras tom och fylls med "
          "sand."]),
        ("Foten under säcken",
         ["Själva foten är 43 centimeter i diameter och 12 centimeter hög och "
          "rymmer 12 kilo vatten eller 20 kilo sand. Fylld fot plus fylld "
          "viktsäck ger 35 kilo på golvet. " + FYLLNING_INGAR_EJ]),
        ("Fyra höjder och en fjäder som ger tillbaka",
         ["Stången låses i fyra lägen mellan 125 och 145 centimeter. Bollen "
          "mäter 20 × 28 centimeter och sitter på ett fjädersystem som för "
          "tillbaka den till utgångsläget snabbare än en enkel gummiinfästning "
          "— det är vad som håller rytmen igång i en kombination."]),
        ("Handskar och pump ingår",
         ["Ett par boxhandskar och en luftpump följer med. Bollen är röd och "
          "svart."]),
    ],
    ("Räcker fyllningen i foten?",
     "Behöver du inte den extra säcken finns samma höjdspann som " +
     lank("punchingboll-125-145-cm-handskar",
          "punchingboll med enbart fyllbar fot") +
     ", med samma handskar och pump i kartongen."),
    [
        R("Höjd", "125/132/139/145 cm"),
        R("Fot", "Ø43 × 12 cm"),
        R("Boll", "Ø20 × 28 cm"),
        R("Fotens fyllning", "12 kg vatten eller 20 kg sand"),
        R("Viktsäck", "15 kg, fylls med sand"),
        R("Färg", "röd och svart"),
        R("Material", "polyuretan, stål, HDPE och PVC"),
        R("Fraktvikt", "4,2 kg"),
        R("Paketmått", "43 × 15 × 51 cm"),
        R("Ingår", "punchingbollen med ställ, en viktsäck på 15 kg, ett par "
                   "boxhandskar, en luftpump och monteringsanvisning"),
        R("Montering", "krävs"),
    ],
    ["Fyll foten först och lägg viktsäcken över den efteråt — den går inte att "
     "flytta när den är full.",
     "Sanden till viktsäcken köper du själv. Torr lekplatssand från en "
     "byggvaruhandel är det som packar sig tätast.",
     "Torka av konstlädret efter passet och låt bollen lufttorka innan den "
     "ställs undan.",
     "Kontrollera fjädern och bandet runt viktsäcken någon gång per säsong. Ett "
     "band som glappar låter säcken glida ur läge vid tunga träffar.",
     "Töm vattenfoten inför längre uppehåll. Viktsäcken kan stå fylld — sand "
     "möglar inte."],
    [
        ("Ingår sanden till viktsäcken?",
         "Nej. Säcken levereras tom och rymmer 15 kilo sand som du fyller "
         "själv."),
        ("Hur tungt står det på golvet?",
         "Foten rymmer 12 kilo vatten eller 20 kilo sand, och viktsäcken 15 "
         "kilo till. Fullt fylld med sand blir det 35 kilo."),
        ("Vilka höjder finns?",
         "Fyra fasta lägen mellan 125 och 145 centimeter."),
        ("Hur stor är bollen?",
         "20 × 28 centimeter."),
        ("Vad ingår?",
         "Punchingbollen med ställ, en viktsäck på 15 kilo, ett par "
         "boxhandskar, en luftpump och monteringsanvisning."),
        ("Går viktsäcken att använda till något annat?",
         "Ja, den har bärhandtag och går att lyfta av och använda fristående."),
        ("Behöver jag borra?",
         "Nej. Stället står fritt på golvet."),
        ("Fungerar den på matta?",
         "Ja. Stabiliteten kommer från tyngden i foten och säcken, inte från "
         "något grepp mot underlaget."),
    ],
)

HTML["4fe5959f"] = bygg(
    "En punchingboll med fyra fasta höjder mellan 136 och 154 centimeter och en "
    "bredare fot än de mindre modellerna: 48 centimeter i diameter och 23 "
    "centimeter hög. Bredden är det som avgör hur mycket stället rör sig när "
    "träffarna kommer snett.",
    [
        ("Fyra lägen: 136, 142, 148 och 154 centimeter",
         ["Höjden ställs i fyra steg om sex centimeter. Fasta lägen håller "
          "höjden på plats genom hela passet, och skillnaden mellan högsta och "
          "lägsta läget är 18 centimeter — tillräckligt för att samma ställ "
          "ska fungera för två personer i olika längd."]),
        ("En 48 centimeter bred fot",
         ["Foten är 48 centimeter i diameter och 23 centimeter hög. Ju bredare "
          "fotavtryck, desto längre hävarm mot att stället tippar. Foten fylls "
          "med vatten eller sand och har sugproppar i botten. " +
          SUGPROPP_GOLV]),
        ("Bollen och handskarna",
         ["Bollen mäter 18 × 18 × 24 centimeter. Ett par boxhandskar följer "
          "med; någon luftpump ingår inte i den här modellen."]),
    ],
    ("Vill du ha ett högre läge?",
     lank("punchingboll-147-165-cm-fyllbar-fot",
          "Punchingbollen som ställs mellan 147 och 165 centimeter") +
     " har samma fotbredd men ett glidande höjdläge i stället för fyra steg."),
    [
        R("Höjd", "136/142/148/154 cm"),
        R("Fot", "Ø48 × 23 cm"),
        R("Boll", "18 × 18 × 24 cm"),
        R("Fotens fyllning", "vatten eller sand"),
        R("Fäste mot golvet", "sugproppar i botten"),
        R("Färg", "svart och röd"),
        R("Material", "stål, plast och konstläder"),
        R("Fraktvikt", "5 kg"),
        R("Paketmått", "48 × 24 × 50 cm"),
        R("Ingår", "punchingbollen med ställ och ett par boxhandskar"),
        R("Montering", "krävs"),
    ],
    ["Fyll foten innan första passet. " + FYLLNING_INGAR_EJ,
     "Torka rent under foten innan du ställer den. Sugproppar mot ett dammigt "
     "golv greppar sämre än mot ett rent.",
     "Torka av bollen med en lätt fuktad trasa efter träningen och låt den "
     "lufttorka.",
     "Kontrollera höjdlåset och fjädern med några veckors mellanrum.",
     "Töm foten på vatten inför längre uppehåll och låt den torka öppen."],
    [
        ("Vilka höjder går den att ställas i?",
         "Fyra fasta lägen: 136, 142, 148 och 154 centimeter."),
        ("Vad fyller jag foten med?",
         "Vatten eller sand. Foten är 48 centimeter i diameter och 23 "
         "centimeter hög, och sand ger mer tyngd än vatten på samma volym. "
         + FYLLNING_INGAR_EJ),
        ("Ingår en luftpump?",
         "Nej. Den här modellen levereras med punchingbollen och ett par "
         "boxhandskar."),
        ("Behöver golvet vara slätt?",
         "För sugpropparna, ja. " + SUGPROPP_GOLV),
        ("Hur stor är bollen?",
         "18 × 18 × 24 centimeter."),
        ("Behöver jag borra?",
         "Nej. Stället står fritt."),
        ("Vad väger den?",
         "Fraktvikten med emballage är 5 kilo. Tyngden i bruk kommer från "
         "fyllningen."),
        ("Går den att ta isär?",
         "Ja. Stången delas för förvaring och foten töms."),
    ],
)

HTML["136a4671"] = bygg(
    "En punchingboll där höjden ställs steglöst mellan 147 och 165 centimeter — "
    "ett spann som passar den som står upprätt och slår rakt fram snarare än "
    "nedåt. Foten är 48 centimeter bred, rymmer upp till 25 kilo sand och har "
    "sugproppar i botten.",
    [
        ("147 till 165 centimeter, steglöst",
         ["Stången glider och låses med ett vred, så höjden går att finjustera "
          "mot din egen axelhöjd i stället för att hamna mellan två fasta "
          "lägen. Hela spannet är 18 centimeter."]),
        ("Foten tar 25 kilo sand",
         ["Foten mäter 48 centimeter i diameter och 23 centimeter på höjden och "
          "rymmer 15 kilo vatten, 25 kilo sand eller 20 kilo av båda blandat. "
          + FYLLNING_INGAR_EJ]),
        ("Sugproppar under foten",
         [SUGPROPP_GOLV]),
        ("Bollen är vit, röd och blå",
         ["Bollen är 25 centimeter i diameter och har tre fält: vitt, rött och "
          "blått. Den sitter på en metallfjäder som för tillbaka den efter "
          "varje träff."]),
    ],
    ("Vill du ha ett lägre spann?",
     lank("punchingboll-136-154-cm-fyra-lagen",
          "Punchingbollen med fyra fasta lägen mellan 136 och 154 centimeter") +
     " har samma fotbredd, och där följer ett par boxhandskar med."),
    [
        R("Höjd", "147–165 cm"),
        R("Fot", "Ø48 × 23 cm"),
        R("Boll", "Ø25 cm"),
        R("Fotens fyllning", "15 kg vatten, 25 kg sand eller 20 kg blandat"),
        R("Fäste mot golvet", "sugproppar i botten"),
        R("Färg", "bollen är vit, röd och blå; ställ och fot är svarta"),
        R("Material", "konstläder, plast och stål"),
        R("Fraktvikt", "7 kg"),
        R("Paketmått", "48 × 25 × 60 cm"),
        R("Ingår", "punchingbollen med ställ och monteringsanvisning"),
        R("Montering", "krävs"),
    ],
    ["Fyll foten innan du ställer höjden — det är enklare att lyfta en tom fot "
     "på plats än en full.",
     "Sopa eller torka golvet där foten ska stå. Sugproppar greppar mot en ren "
     "yta, inte mot damm.",
     "Dra åt höjdvredet ordentligt. Ett vred som bara är handfast glider ner "
     "några centimeter under passet.",
     "Torka av bollen efter träningen och låt den lufttorka innan den ställs "
     "undan.",
     "Töm vattenfoten inför längre uppehåll och låt den stå öppen tills den är "
     "torr."],
    [
        ("Vilket höjdspann har den?",
         "147 till 165 centimeter, steglöst inom spannet."),
        ("Hur mycket rymmer foten?",
         "15 kilo vatten, 25 kilo sand eller 20 kilo av båda blandat. " +
         FYLLNING_INGAR_EJ),
        ("Vilken färg har bollen?",
         "Den har tre fält: vitt, rött och blått. Ställ och fot är svarta."),
        ("Ingår handskar eller pump?",
         "Nej. Kartongen innehåller punchingbollen med ställ och "
         "monteringsanvisning."),
        ("Fungerar den på matta?",
         "Bollen står, men sugpropparna får inget fäste. Fyll foten med sand "
         "för att kompensera."),
        ("Hur stor är bollen?",
         "25 centimeter i diameter."),
        ("Behöver jag borra?",
         "Nej. Stället står fritt på golvet."),
        ("Går höjden att ändra under passet?",
         "Ja. Vredet lossas och dras åt för hand, och stången glider fritt "
         "inom hela spannet."),
    ],
)


HTML["2730de6f"] = bygg(
    "Den här punchingbollen ställs var som helst mellan 145 och 180 "
    "centimeter — 35 centimeter att välja inom. Det är skillnaden mellan en "
    "boll i brösthöjd och en i ansiktshöjd på en vuxen som står upprätt.",
    [
        ("35 centimeter att välja på",
         ["Stången glider och låses med ett vred var som helst mellan 145 och "
          "180 centimeter. Ett så brett spann betyder att samma ställ fungerar "
          "både för den som vill träna kroppsträffar lågt och den som vill "
          "jobba mot huvudhöjd."]),
        ("Foten tar 25 kilo sand",
         ["Foten mäter 48 centimeter i diameter och 23 centimeter på höjden och "
          "rymmer 15 kilo vatten, 25 kilo sand eller 20 kilo av båda blandat. "
          "Ju högre stången står, desto viktigare blir tyngden längst ner — en "
          "boll på 180 centimeter har längre hävarm än en på 145. " +
          FYLLNING_INGAR_EJ]),
        ("Sugproppar och en fjädrande stång",
         [SUGPROPP_GOLV,
          "Stången är 2,5 centimeter i diameter och bollen 25 centimeter. "
          "Fjädern för tillbaka bollen till utgångsläget efter varje träff."]),
    ],
    ("Vill du träna reaktion också?",
     lank("punchingboll-reflexstang-160-205-cm",
          "Punchingbollen med roterande reflexstång") +
     " har en arm som svänger runt på 95 till 140 centimeters höjd utöver "
     "bollen, och en djupare fot på 32 centimeter."),
    [
        R("Höjd", "145–180 cm"),
        R("Fot", "Ø48 × 23 cm"),
        R("Boll", "Ø25 cm"),
        R("Stång", "Ø2,5 cm"),
        R("Fotens fyllning", "15 kg vatten, 25 kg sand eller 20 kg blandat"),
        R("Fäste mot golvet", "sugproppar i botten"),
        R("Färg", "svart"),
        R("Material", "stål, konstläder och plast"),
        R("Fraktvikt", "7 kg"),
        R("Paketmått", "50 × 26 × 58 cm"),
        R("Ingår", "punchingbollen med ställ och monteringsanvisning"),
        R("Montering", "krävs"),
    ],
    ["Fyll foten före första passet och ställ höjden efteråt.",
     "Kör den högsta inställningen bara med sandfylld fot. Vatten väger 15 kilo "
     "mot sandens 25, och på 180 centimeter märks skillnaden i varje träff.",
     "Torka golvet under foten innan du ställer den. Sugproppar greppar mot en "
     "ren yta.",
     "Torka av konstlädret efter träningen och låt det lufttorka.",
     "Dra åt höjdvredet och fjäderns förband några gånger per säsong."],
    [
        ("Hur högt går den?",
         "Upp till 180 centimeter. Lägsta läget är 145."),
        ("Hur mycket rymmer foten?",
         "15 kilo vatten, 25 kilo sand eller 20 kilo av båda blandat. " +
         FYLLNING_INGAR_EJ),
        ("Ingår handskar eller pump?",
         "Nej. Kartongen innehåller punchingbollen med ställ och "
         "monteringsanvisning."),
        ("Hur stor är bollen?",
         "25 centimeter i diameter."),
        ("Behöver jag borra?",
         "Nej. Stället står fritt på golvet."),
        ("Fungerar den på matta?",
         "Bollen står, men sugpropparna får inget fäste. Sandfyllning "
         "kompenserar."),
        ("Vad väger den?",
         "Fraktvikten med emballage är 7 kilo. Tyngden i bruk kommer från "
         "fyllningen."),
        ("Går höjden att ändra snabbt?",
         "Ja. Vredet lossas för hand och stången glider fritt inom hela "
         "spannet."),
    ],
)

HTML["2a13cbbe"] = bygg(
    "En punchingboll med en roterande reflexstång utöver bollen: en vadderad arm "
    "som svänger runt pelaren på 95 till 140 centimeters höjd och som du måste "
    "ducka för eller blockera. Det gör passet till fotarbete och reaktion, inte "
    "bara slag.",
    [
        ("Reflexstången svänger på 95 till 140 centimeter",
         ["Armen är 5,5 centimeter tjock och 50 centimeter lång och sitter på "
          "ett eget fäste som går att höja och sänka oberoende av bollen. På 95 "
          "centimeter kommer den i midjehöjd och tränar undanmanövrar i "
          "benarbetet; på 140 kommer den i axelhöjd och tränar blockeringar."]),
        ("12 sugproppar och en djup fot",
         ["Foten är 48 centimeter i diameter och 32 centimeter hög. Djupet är "
          "det som rymmer fyllningen utan att foten behöver bli bredare, och i "
          "botten sitter 12 sugproppar. " + SUGPROPP_GOLV]),
        ("Höjden ställs mellan 160 och 205 centimeter",
         ["Pelaren ger 45 centimeters spann. Utfällt tar stället 76 centimeter "
          "i djupled, vilket är armens svängrum och det mått du behöver mäta "
          "mot när du väljer plats i rummet. " + FYLLNING_INGAR_EJ]),
        ("Luftpump och skruvsats ingår",
         ["I kartongen ligger en luftpump och en skruvsats utöver bollen och "
          "armen. Boxhandskar ingår inte i den här modellen."]),
    ],
    ("Vill du ha en säck i stället för en boll?",
     lank("boxningssack-rod-155-205-cm-reflexstang",
          "Boxningssäcken med roterande arm") +
     " har samma idé men en 60 centimeter lång säck att slå på, och en fot som "
     "rymmer 35 kilo sand."),
    [
        R("Höjd", "160–205 cm"),
        R("Mått utfällt", "76 × 48 cm (djup × bredd)"),
        R("Fot", "Ø48 × 32 cm"),
        R("Reflexstång", "Ø5,5 × 50 cm"),
        R("Reflexstångens höjd", "95–140 cm"),
        R("Fotens fyllning", "15 kg vatten, 25 kg sand eller båda blandat"),
        R("Fäste mot golvet", "12 sugproppar"),
        R("Färg", "svart"),
        R("Material", "stål, konstläder, plast och EVA"),
        R("Fraktvikt", "10 kg"),
        R("Paketmått", "53 × 48 × 43 cm"),
        R("Ingår", "punchingbollen med ställ och reflexstång, en luftpump, en "
                   "skruvsats och monteringsanvisning"),
        R("Montering", "krävs"),
    ],
    ["Mät 76 centimeter i djupled innan du väljer plats. Armen svänger runt, "
     "och den behöver samma utrymme oavsett var du står.",
     "Fyll foten före första passet. En 205 centimeter hög pelare med tom fot "
     "tippar vid första riktiga träffen.",
     "Torka golvet där foten ska stå så att alla tolv sugproppar får kontakt.",
     "Torka av konstlädret och EVA-vadderingen med en lätt fuktad trasa efter "
     "passet.",
     "Kontrollera armens fäste med några veckors mellanrum. Det är den del som "
     "får mest sidobelastning."],
    [
        ("Vad gör reflexstången?",
         "Den svänger runt pelaren och tvingar dig att ducka eller blockera "
         "mellan slagen. Höjden ställs mellan 95 och 140 centimeter."),
        ("Hur mycket plats behöver den?",
         "76 centimeter i djupled och 48 i bredd, plus ditt eget svängrum "
         "runtom."),
        ("Hur högt går pelaren?",
         "Mellan 160 och 205 centimeter."),
        ("Vad fyller jag foten med?",
         "15 kilo vatten, 25 kilo sand eller båda blandat. " +
         FYLLNING_INGAR_EJ),
        ("Ingår boxhandskar?",
         "Nej. Kartongen innehåller bollen med ställ och reflexstång, en "
         "luftpump, en skruvsats och monteringsanvisning."),
        ("Behöver golvet vara slätt?",
         "För de tolv sugpropparna, ja. " + SUGPROPP_GOLV),
        ("Behöver jag borra?",
         "Nej. Stället står fritt på golvet."),
        ("Går armen att ta bort?",
         "Armen sitter på ett eget fäste på pelaren och skruvas fast vid "
         "montering."),
    ],
)

HTML["95f6280b"] = bygg(
    "En fristående boxningssäck som är klar att slå på direkt: kärnan är redan "
    "fylld, foten hålls på plats av tio sugproppar och ingenting skruvas i tak "
    "eller vägg. Säcken är 135 centimeter hög och tar 38 centimeter i golvyta.",
    [
        ("Ingen fyllning, ingen borrning",
         ["Till skillnad från de flesta fristående säckar behöver den här "
          "varken vatten eller sand. Kärnan är förfylld med EPE-skum och "
          "polyuretanfiber från fabrik, och foten greppar golvet med tio "
          "sugproppar. Det som ligger i kartongen är det som ska stå på golvet "
          "en kvart senare."]),
        ("Tio sugproppar och gummidämpning",
         ["Foten är 38 centimeter bred och bara 3 centimeter hög, så säcken tar "
          "minimalt med golvyta. Inbyggd gummidämpning mellan säck och fot "
          "tar upp vibrationer och dämpar ljudet — det är den detaljen som gör "
          "skillnad i en lägenhet. " + SUGPROPP_GOLV]),
        ("Slagytan är 103 centimeter lång",
         ["Själva säcken mäter 24 centimeter i diameter och 103 centimeter på "
          "höjden. Det ger en sammanhängande slagyta från midjehöjd och uppåt, "
          "alltså utrymme för både raka slag och sparkar mot samma säck."]),
    ],
    ("Behöver du en högre säck?",
     lank("fristaende-boxningssack-156-cm",
          "Den fristående boxningssäcken på 156 centimeter") +
     " har en fyrkantig fot med tolv sugproppar och en slagyta på 120 "
     "centimeter."),
    [
        R("Höjd", "135 cm"),
        R("Säck", "Ø24 × 103 cm"),
        R("Fot", "Ø38 × 3 cm"),
        R("Fyllning", "förfylld med EPE-skum och polyuretanfiber"),
        R("Fäste mot golvet", "10 sugproppar"),
        R("Dämpning", "inbyggd gummidämpning i foten"),
        R("Färg", "röd och svart"),
        R("Material", "stål och EPE-skum med plastyta"),
        R("Fraktvikt", "15 kg"),
        R("Paketmått", "120 × 35 × 27 cm"),
        R("Ingår", "den fristående boxningssäcken och monteringsanvisning"),
        R("Montering", "krävs"),
    ],
    ["Torka golvet där foten ska stå. Tio sugproppar mot en dammig yta greppar "
     "sämre än tio mot en ren.",
     "Tryck ner foten ordentligt innan passet så att alla proppar får kontakt. "
     "Säcken tål sparkar, men bara om botten sitter.",
     "Torka av plastytan med en lätt fuktad trasa efter träningen. Svett som "
     "torkar in gör ytan kletig.",
     "Kontrollera förbandet mellan säck och fot någon gång per säsong.",
     "Ställ säcken svalt och torrt vid längre uppehåll. Den förfyllda kärnan "
     "tål inte att pressas ihop under något tungt."],
    [
        ("Behöver jag fylla den med sand eller vatten?",
         "Nej. Kärnan är förfylld från fabrik och foten hålls på plats av tio "
         "sugproppar."),
        ("Hur hög är den?",
         "135 centimeter totalt, varav 103 centimeter är slagyta."),
        ("Behöver jag borra i tak eller vägg?",
         "Nej. Säcken står fritt på golvet."),
        ("Hur mycket golvyta tar den?",
         "38 centimeter i diameter."),
        ("Fungerar den i en lägenhet?",
         "Foten har inbyggd gummidämpning som tar upp vibrationer och dämpar "
         "ljudet mot golvet."),
        ("Går den att använda för sparkar?",
         "Slagytan är 103 centimeter lång och sitter sammanhängande från "
         "midjehöjd och uppåt."),
        ("Fungerar den på heltäckningsmatta?",
         "Sugpropparna får inget fäste i en matta. " + SUGPROPP_GOLV),
        ("Vad väger den?",
         "Fraktvikten med emballage är 15 kilo."),
    ],
)


def _sack_med_arm(farg, syskon_slug, syskon_text):
    """c8f6b93f och a8daef42 är SAMMA modell i två färger.

    ☠️ Den delade texten är delad med FLIT. Måtten, fyllningen och det som
    ingår är identiska; att skriva om dem två gånger är två chanser att
    införa ett fel. Det som skiljer sidorna åt är färgen och korslänken.
    """
    return bygg(
        "En %s boxningssäck med tre träningsytor på samma pelare: säcken, en "
        "roterande arm och en boll högst upp. Höjden ställs mellan 155 och 205 "
        "centimeter och foten rymmer 35 kilo sand." % farg,
        [
            ("Tre ytor i stället för en",
             ["Säcken är 25 centimeter i diameter och 60 centimeter lång och "
              "sitter mitt på pelaren. Ovanför den sitter en boll på 18 × 24 "
              "centimeter, och ut från pelaren går en roterande arm på 6 × 60 "
              "centimeter. Det betyder att ett pass kan växla mellan kraft mot "
              "säcken, snabbhet mot bollen och undanmanövrar mot armen utan att "
              "du byter redskap."]),
            ("35 kilo sand i foten",
             ["Foten är 48 centimeter i diameter och 31 centimeter hög och "
              "rymmer 30 kilo vatten, 35 kilo sand eller 40 kilo av båda "
              "blandat. Blandningen är tyngst: sanden packar sig i botten och "
              "vattnet fyller mellanrummen. " + FYLLNING_INGAR_EJ]),
            ("155 till 205 centimeter",
             ["Pelaren ger 50 centimeters spann, och utfällt tar stället 88 "
              "centimeter i djupled — armens svängrum, och det mått du mäter "
              "mot när du väljer plats."]),
            ("Pump och innerhandskar ingår",
             ["I kartongen ligger en luftpump till bollen och ett par "
              "innerhandskar. Konstlädret är samma yta på alla tre "
              "träningsytorna."]),
        ],
        ("Vill du ha den i en annan färg?",
         "Exakt samma modell finns som " + lank(syskon_slug, syskon_text) +
         ". Mått, fyllning och innehåll är identiska — det är bara färgen som "
         "skiljer."),
        [
            R("Höjd", "155–205 cm"),
            R("Mått utfällt", "88 × 48 cm (djup × bredd)"),
            R("Säck", "Ø25 × 60 cm"),
            R("Boll", "Ø18 × 24 cm"),
            R("Roterande arm", "Ø6 × 60 cm"),
            R("Fot", "Ø48 × 31 cm"),
            R("Fotens fyllning", "30 kg vatten, 35 kg sand eller 40 kg blandat"),
            R("Färg", farg),
            R("Material", "konstläder, EPE-skum och HDPE"),
            R("Fraktvikt", "16 kg"),
            R("Paketmått", "88 × 49 × 32 cm"),
            R("Ingår", "säcken med ställ, roterande arm och boll, en luftpump "
                       "och ett par innerhandskar"),
            R("Montering", "krävs"),
        ],
        ["Mät 88 centimeter i djupled innan du bestämmer plats. Armen svänger "
         "runt hela pelaren.",
         "Fyll foten först. Med 40 kilo blandning i botten står pelaren kvar "
         "även vid tunga sparkar mot säcken.",
         "Torka av konstlädret på säck, boll och arm med en lätt fuktad trasa "
         "efter passet, och låt ytorna lufttorka.",
         "Dra åt armens fäste och höjdvredet några gånger per säsong. Armen är "
         "den del som får mest sidobelastning.",
         "Töm vattenfoten inför längre uppehåll. Sand kan stå kvar."],
        [
            ("Vad består den av?",
             "En säck på 25 × 60 centimeter, en boll på 18 × 24 centimeter "
             "ovanför och en roterande arm på 6 × 60 centimeter ut från "
             "pelaren."),
            ("Hur högt går den?",
             "Mellan 155 och 205 centimeter."),
            ("Hur mycket rymmer foten?",
             "30 kilo vatten, 35 kilo sand eller 40 kilo av båda blandat. " +
             FYLLNING_INGAR_EJ),
            ("Hur mycket plats behöver den?",
             "88 centimeter i djupled och 48 i bredd, plus eget svängrum "
             "runtom."),
            ("Vad ingår?",
             "Säcken med ställ, roterande arm och boll, en luftpump och ett par "
             "innerhandskar."),
            ("Behöver jag borra?",
             "Nej. Stället står fritt på golvet."),
            ("Vilken färg har den?",
             "Den här sidan säljer %s. Samma modell finns i en annan färg." % farg),
            ("Vad väger den?",
             "Fraktvikten med emballage är 16 kilo. Tyngden i bruk kommer från "
             "fyllningen."),
        ],
    )


HTML["c8f6b93f"] = _sack_med_arm(
    "röd och svart", "boxningssack-svart-155-205-cm-reflexstang",
    "den helsvarta versionen")
HTML["a8daef42"] = _sack_med_arm(
    "svart", "boxningssack-rod-155-205-cm-reflexstang",
    "den röd- och svartrandiga versionen")

HTML["f0430bc5"] = bygg(
    "En boxningsstation där fyra saker sitter på samma pelare: en säck, två "
    "bollar och en reflexstång. Höjden ställs mellan 160 och 230 centimeter, "
    "och den övre bollens centrum följer med från 90 till 158 centimeter.",
    [
        ("Fyra ytor på en pelare",
         ["Längst ner sitter den vadderade säcken på 15 × 53 centimeter. Rakt "
          "upp från den sitter en boll på 14 × 16 centimeter på en fjäder. Ut "
          "åt sidan går en reflexstång på 8 × 50 centimeter, och en böjd arm "
          "med en andra boll når 35 centimeter ut från pelaren. Fyra "
          "träffytor på fyra höjder, utan att du flyttar dig."]),
        ("Bollens höjd följer med",
         ["När pelaren ställs mellan 160 och 230 centimeter flyttar sig den "
          "övre bollens centrum mellan 90 och 158 centimeter. Det är det mått "
          "som avgör om stationen passar dig: ställ bollen i din egen "
          "hakhöjd, så hamnar allt det andra rätt av sig självt."]),
        ("45 kilo sand i foten",
         ["Foten mäter 50 centimeter i diameter och 27 centimeter på höjden och "
          "rymmer 30 kilo vatten, 45 kilo sand eller 40 kilo av båda blandat. "
          "Det behövs: en pelare på 230 centimeter har lång hävarm. "
          + FYLLNING_INGAR_EJ,
          "Fyll foten FÖRE monteringen. Full väger den betydligt mer än den gör "
          "med pelaren påskruvad."]),
    ],
    ("Vill du ha den i rött?",
     "Samma station finns som " +
     lank("fristaende-boxningssack-160-230-cm", "en röd version") +
     " med identiska mått och samma fyllningskapacitet."),
    [
        R("Höjd", "160–230 cm"),
        R("Mått utfällt", "88 × 50 cm (bredd × djup)"),
        R("Säck", "Ø15 × 53 cm"),
        R("Övre boll", "Ø14 × 16 cm"),
        R("Övre bollens höjd", "90–158 cm över golvet"),
        R("Reflexstång", "Ø8 × 50 cm"),
        R("Sidoarmens räckvidd", "35 cm ut från pelaren"),
        R("Fot", "Ø50 × 27 cm"),
        R("Fotens fyllning", "30 kg vatten, 45 kg sand eller 40 kg blandat"),
        R("Färg", "svart"),
        R("Material", "stål, polyuretan och HDPE"),
        R("Fraktvikt", "13,3 kg"),
        R("Paketmått", "49 × 49 × 98 cm"),
        R("Ingår", "boxningsstationen och monteringsanvisning"),
        R("Montering", "krävs"),
    ],
    ["Fyll foten innan du skruvar på pelaren. Det är enda tillfället då foten "
     "går att flytta utan besvär.",
     "Ställ bollens centrum i din egen hakhöjd och låt resten följa med. Det är "
     "snabbare än att pröva sig fram till en pelarhöjd.",
     "Mät 88 centimeter i bredd och 50 i djup innan du väljer plats, och räkna "
     "med svängrum för reflexstången utöver det.",
     "Torka av polyuretanytorna med en lätt fuktad trasa efter passet och låt "
     "dem lufttorka.",
     "Dra åt reflexstångens och sidoarmens fästen några gånger per säsong — de "
     "två delarna får mest sidobelastning.",
     "Töm vattenfoten inför längre uppehåll och låt den stå öppen tills den är "
     "torr invändigt."],
    [
        ("Vad ingår i stationen?",
         "En säck på 15 × 53 centimeter, en boll på 14 × 16 centimeter, en "
         "reflexstång på 8 × 50 centimeter och en andra boll på en arm som når "
         "35 centimeter ut."),
        ("Hur högt går pelaren?",
         "Mellan 160 och 230 centimeter. Den övre bollens centrum följer med "
         "från 90 till 158 centimeter."),
        ("Hur mycket rymmer foten?",
         "30 kilo vatten, 45 kilo sand eller 40 kilo av båda blandat. " +
         FYLLNING_INGAR_EJ),
        ("Hur mycket plats behöver den?",
         "88 centimeter i bredd och 50 i djup, plus svängrum för reflexstången "
         "och armen."),
        ("Behöver jag borra?",
         "Nej. Stationen står fritt på golvet."),
        ("Går det att ställa in bollen efter min längd?",
         "Ja. Ställ bollens centrum i hakhöjd — hela spannet är 90 till 158 "
         "centimeter över golvet."),
        ("När ska foten fyllas?",
         "Före monteringen. Full är den tung att flytta med pelaren "
         "påskruvad."),
        ("Vad väger den?",
         "Fraktvikten med emballage är 13,3 kilo. Tyngden i bruk kommer från "
         "fyllningen."),
    ],
)
