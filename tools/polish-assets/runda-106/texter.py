# -*- coding: utf-8 -*-
"""Runda 106 — sex låga smådjurshagar i fyra modeller.

☠️ TEXTEN SKRIVS I FIL FÖRST. Runda 64 mätte 9 fel mot 0: en sträng som går
   rakt in i ett API-anrop kan inte grepas innan den lämnar chatten, och
   PATCH-svaret ekar tillbaka exakt det man skrev.

Varje tal kommer ur leverantörens egna mått (lästa i Wix 2026-09-08, se
`matt.py`) eller ur SJVFS 2019:15 bilaga 1:3 och 1:4, kontrollerade ordagrant
mot författningstexten. Inget tal är härlett ur en bild.

☠️ INGEN AV DE SEX FÅR SÄLJAS SOM KANINBOSTAD. L80-grinden ger noll av
   katalogens 39 trästall en godkänd yta för en kanin på 2–3,5 kg, och för de
   två kvadratiska hagarna är dvärgkaninen EJ AVGÖRBAR eftersom enda höjdmåttet
   är ytterhöjden. Texten säljer dem därför som det de är — marsvinshagar — och
   skriver ut normen. Det är en LAGLIG UPPLYSNING enligt Steg 2, samma slag som
   hundburarnas L102-stycke, inte ett varningsblock.
"""

BAS = "https://www.fyndplats.se/produkt/"

L = lambda slug, text: f'<a href="{BAS}{slug}">{text}</a>'
P = lambda t: f"<p>{t}</p>"
H = lambda t: f"<h2>{t}</h2>"
LI = lambda t: f"<li>{t}</li>"
UL = lambda rader: "<ul>" + "".join(LI(f"<strong>{a}:</strong> {b}") for a, b in rader) + "</ul>"
F = lambda q, s: f"<p><strong>{q}</strong></p><p>{s}</p>"


def l80(yta, antal, hojd_txt):
    """Det positiva villkoret: vad ytan räcker till, med normen utskriven.

    `yta` är den GODKÄNDA ytan ur `l80-grind.py`, inte bottenytan — för
    b54e7a23 skiljer de sig (1,06 mot 0,72), eftersom husets 38,5 cm är under
    marsvinets kortaste sida.
    """
    return (
        H("Så många marsvin räcker ytan till")
        + P(
            f"Golvytan som räknas är {yta} m². Jordbruksverkets föreskrifter för "
            f"sällskapsdjur (SJVFS 2019:15, L80) kräver 0,30 m² för ett ensamt "
            f"marsvin och 0,15 m² per djur när flera hålls tillsammans, med "
            f"kortaste sidan minst 40 cm och höjden minst 25 cm. Hagen räcker "
            f"alltså till {antal} marsvin. {hojd_txt}"
        )
        + P(
            "Marsvin ska hållas i par eller grupp — de är flockdjur, och ett "
            "ensamt marsvin far illa. Räkna därför på minst två."
        )
    )


KANINRADEN = P(
    "Hagen säljs inte som kaninbostad. L80 kräver 0,7 m² golvyta, 60 cm "
    "kortaste sida och 60 cm höjd för en kanin på 2–3,5 kg, och den höjden "
    "finns inte i en låg markhage. Som dagtidshage vid sidan av en bostad som "
    "uppfyller måtten är den däremot en riktig gräsyta att beta av."
)

SKOTSEL_MARK = P(
    "Ställ hagen på gräs eller jord, inte på asfalt eller trall — hela poängen "
    "med en botten som är öppen är att djuren kommer åt marken. Flytta den ett "
    "par meter varannan dag så hinner gräset återhämta sig och underlaget hålls "
    "torrt. Gnagare får enligt L80 inte hållas på nätgolv, men just det "
    "förbudet gäller inte betesburar med direkt kontakt med marken."
)

# ☠️ SÄG INTE HUR TRÄET ÄR BEHANDLAT. Ett första utkast påstod tre olika
#    saker i samma batch — "naturlackad" i modell A:s ingress, "obehandlad gran"
#    i den här texten och "behandlat för utomhusbruk" i modell D:s FAQ. Ingen av
#    dem går att belägga: leverantören anger bara träslaget. Att gråna och att
#    behöva oljas gäller gran utomhus oavsett, och det är det som står här.
SKOTSEL_TRA = P(
    "Gran som står ute grånar med tiden. Vill du behålla tonen stryker du hagen "
    "en gång om året med en djurvänlig träolja — utomhus, och torrt innan djuren "
    "släpps in. Skruvförband kan behöva efterdras efter första säsongen, för trä "
    "rör sig när det torkar."
)

# ☠️ Den här texten handlade först om KANINER — uppvärmt dricksvatten under
#    noll grader, som är L80:s 8 kap. 26 §. Grindens kaninregel fällde den, och
#    hade rätt: en sida som säger att hagen inte är en kaninbostad ska inte
#    lämna kaninråd. De två paragrafer som gäller djuren hagen FAKTISKT är för
#    är dessutom skarpare — särskilt 9 §, som gör en markhage till en
#    sommarplats snarare än ett vinterhem.
VINTER = P(
    "Gnagare får enligt L80 inte hållas vid temperaturer under noll grader, och "
    "de ska alltid kunna nå en plats där de har det lagom varmt. Samma "
    "föreskrift kräver att utomhusburar vintertid står upphöjda från marken — "
    "en hage som står direkt på gräset är alltså en plats för vår, sommar och "
    "höst, och djuren behöver ett annat hem under den kalla delen av året."
)


# ---------------------------------------------------------------- modell A ---
# 181 × 100 × 48 cm, BOTTENLÖS, två lock 45 × 100 cm, gran + galvat nät, 11 kg,
# paket 105 × 49 × 24 cm. Godkänd yta 1,81 m².
A_FARGER = {
    "a4c0595f": ("natur", "naturfärgad", "smadjurshage-181-natur", 1499),
    "7eebd0eb": ("grå", "grå", "smadjurshage-181-gra", 1339),
}


def modell_a(nyckel):
    farg, adj, slug, _pris = A_FARGER[nyckel]
    syskon = [(f, s) for k, (f, a, s, p) in A_FARGER.items() if k != nyckel]
    kors = P(f"Samma hage finns också i {L(syskon[0][1], syskon[0][0])}.")
    return dict(
        namn=f"Smådjurshage 181 × 100 cm utan botten – två lock, {farg}",
        slug=slug,
        titel=f"Smådjurshage 181 cm utan botten, {farg} | Fyndplats",
        meta=("Smådjurshage 181 × 100 cm utan botten — ställs på gräset så marsvinen "
              "betar själva. 1,81 m², två lock som öppnas helt och nät runt om."),
        sokord=[("smådjurshage", True), ("marsvinshage utomhus", False),
                ("betesbur smådjur", False), ("hage utan botten", False)],
        html=(
            P(f"En {adj} <strong>smådjurshage</strong> på 181 × 100 cm som ställs "
              "direkt på gräsmattan. Hagen har ingen botten, så marsvinen går på "
              "riktig mark och betar själva — och när fläcken är avbetad lyfter du "
              "hagen till nästa. Sidorna är klädda med galvaniserat nät hela vägen runt.")
            + H("Två lock som öppnas helt")
            + P("Ovansidan är delad i två luckor på 45 × 100 cm vardera. Båda fälls "
                "upp, så du kommer åt hela ytan när du ska lyfta in djur, fylla på "
                "vatten eller plocka bort foderrester. Med båda locken uppfällda är "
                "hela hagen öppen uppifrån, vilket gör den lätt att spola av.")
            + H("Elva kilo — en person lyfter den")
            + P("Hagen väger 11 kg och har ingen botten som håller emot, så en "
                "person kan lyfta den till nästa fläck. Det är den egenskapen som "
                "gör att en betesbur faktiskt blir flyttad så ofta som gräset "
                "behöver.")
            + l80("1,81", "tolv",
                  "Höjden 48 cm är hagens yttermått; den fria höjden inuti är "
                  "något lägre, men med god marginal till kravets 25 cm.")
            + KANINRADEN
            + kors
            + H("Tekniska specifikationer")
            + UL([
                ("Yttermått", "181 × 100 × 48 cm (L × B × H)"),
                ("Golvyta", "1,81 m²"),
                ("Botten", "ingen — hagen står direkt på marken"),
                ("Lock", "2 st, 45 × 100 cm, fälls upp"),
                ("Material", "gran och galvaniserat nät"),
                ("Färg", farg),
                ("Vikt", "11 kg"),
                ("Paketmått", "105 × 49 × 24 cm"),
                ("Montering", "krävs"),
                ("Lämplig för", "marsvin och andra små gnagare"),
            ])
            + H("Användning och skötsel")
            + SKOTSEL_MARK
            + SKOTSEL_TRA
            + P("Hagen är en dagtidshage, inte ett nattskydd. Djuren ska ha en "
                "stängd, torr och dragfri sovplats att gå till, och de ska inte "
                "lämnas i hagen utan tillsyn i regn eller stark sol — de kan inte "
                "gå därifrån själva.")
            + VINTER
            + H("Vanliga frågor")
            + F("Går det att sätta ihop två hagar?",
                "Ja. Hagarna är raka på alla sidor, så två kan ställas kant i kant "
                "för dubbel yta. De kopplas inte ihop mekaniskt, så du behöver "
                "ändå en öppning mellan dem om djuren ska kunna gå fritt.")
            + F("Kommer djuren ut under kanten?",
                "Ramen ligger an mot marken hela vägen runt. På mycket ojämnt "
                "underlag kan det bli en glipa i en svacka — ställ hagen på en "
                "plan yta, eller lägg en bräda under den låga sidan.")
            + F("Skyddar den mot rovdjur?",
                "Nätet och locken håller undan fåglar och katter så länge locken "
                "är stängda och hakade. En hage utan botten är däremot inget "
                "skydd mot grävande djur, så låt inte djuren vara i den på natten.")
            + F("Kan den stå ute året om?",
                "Hagen tål väder, men träet håller längre om den får stå torrt "
                "över vintern. Djuren ska då ha ett annat hem: L80 kräver att "
                "utomhusburar vintertid står upphöjda från marken, och den här "
                "står på den.")
            + F("Hur många marsvin får plats?",
                "Enligt L80 räcker 1,81 m² till tolv marsvin i grupp. I praktiken "
                "är två till fyra ett rimligt sällskap i den här storleken, med "
                "gott om plats att springa ifrån varandra.")
            + F("Behöver den monteras?",
                "Ja, hagen levereras platt och skruvas ihop. Skruvar och "
                "monteringsanvisning ingår.")
            + F("Går den att flytta med djuren i?",
                "Nej. Lyft ut djuren först — hagen har ingen botten, så de skulle "
                "ramla ur eller klämmas mot ramen.")
        ),
    )


# ---------------------------------------------------------------- modell B ---
# 125,5 × 100 × 49 cm; hus 88 × 38,5 × 37, löpgård 92 × 78 × 44,5;
# husdörr 18 × 26,5; lucka 27 × 37; hagdörr 92 × 39; bottenbricka 121,5 × 92;
# 15,7 kg; paket 109 × 57 × 21,5. Bitumentak som fälls upp.
# Godkänd yta för marsvin: 0,72 m² (huset är 38,5 cm djupt, kravet 40).
B_FARGER = {
    "b54e7a23": ("grå med grönt tak", "grå", "smadjurshage-125-gra", 1649),
    "1f7ebf33": ("natur med grönt tak", "natur", "smadjurshage-125-natur", 1659),
}


def modell_b(nyckel):
    farg, kort, slug, _pris = B_FARGER[nyckel]
    syskon = [(f, s) for k, (f, ko, s, p) in B_FARGER.items() if k != nyckel]
    kors = P(f"Samma modell finns också i {L(syskon[0][1], syskon[0][0])}.")
    return dict(
        namn=f"Smådjurshage 125,5 cm med hus och uppfällbart tak, {kort}",
        slug=slug,
        titel=f"Smådjurshage 125,5 cm med hus, {kort} | Fyndplats",
        meta=("Smådjurshage 125,5 × 100 cm med slutet hus och löpgård på marken. "
              "0,72 m² godkänd yta, uppfällbart bitumentak och uttagbar bottenbricka."),
        sokord=[("smådjurshage", True), ("marsvinshus utomhus", False),
                ("smådjurshage med hus", False), ("marsvinshage", False)],
        html=(
            P("En låg <strong>smådjurshage</strong> i två delar: ett slutet hus i "
              f"ena änden och en öppen löpgård i den andra, {farg}. Djuren går "
              "mellan delarna genom en öppning i mellanväggen och kan själva välja "
              "mellan skugga och gräs.")
            + H("Taket fälls upp över hela huset")
            + P("Husets bitumentak sitter på gångjärn och fälls upp i sin helhet. "
                "Du kommer alltså åt sovdelen uppifrån i stället för genom en liten "
                "lucka, vilket är skillnaden mellan att byta strö på en minut och "
                "att böja sig in genom en öppning på 18 × 26,5 cm.")
            + H("Bottenbrickan dras ut för rengöring")
            + P("Under huset ligger en uttagbar bricka på 121,5 × 92 cm som samlar "
                "strö och spill. Den dras ut från sidan, töms och skjuts tillbaka — "
                "utan att hagen behöver flyttas eller djuren lyftas ut.")
            + l80("0,72", "fyra",
                  "Det är löpgårdens yta som räknas: den mäter 92 × 78 cm och är "
                  "44,5 cm hög. Huset på 88 × 38,5 cm är 1,5 cm under normens "
                  "kortaste sida på 40 cm och räknas därför som skyddad sovdel, "
                  "inte som golvyta.")
            + KANINRADEN
            + kors
            + H("Tekniska specifikationer")
            + UL([
                ("Yttermått", "125,5 × 100 × 49 cm (L × B × H)"),
                ("Löpgård", "92 × 78 × 44,5 cm — 0,72 m²"),
                ("Hus", "88 × 38,5 × 37 cm"),
                ("Öppning till huset", "18 × 26,5 cm"),
                ("Lucka", "27 × 37 cm"),
                ("Dörr till löpgården", "92 × 39 cm"),
                ("Bottenbricka", "121,5 × 92 cm, uttagbar"),
                ("Tak", "bitumenväv, fälls upp"),
                ("Material", "gran och galvaniserat nät"),
                ("Färg", farg),
                ("Vikt", "15,7 kg"),
                ("Paketmått", "109 × 57 × 21,5 cm"),
                ("Montering", "krävs"),
                ("Lämplig för", "marsvin och andra små gnagare"),
            ])
            + H("Användning och skötsel")
            + SKOTSEL_MARK
            + P("Fyll sovdelen med hö eller kutterspån i ett lager djurens fötter "
                "sjunker ner i, och byt det när det luktar eller är fuktigt. "
                "Bottenbrickan går att skölja av med vatten; låt den torka innan "
                "den skjuts tillbaka.")
            + SKOTSEL_TRA
            + VINTER
            + H("Vanliga frågor")
            + F("Har hagen botten?",
                "Löpgården är öppen mot marken så djuren kommer åt gräset. Under "
                "huset ligger den uttagbara brickan, som håller strö och spill på "
                "plats.")
            + F("Går taket att låsa?",
                "Taket hålls nere av sin egen tyngd och en hasp. Det är gjort för "
                "att öppnas ofta, inte för att låsas — hagen ska inte lämnas "
                "obevakad utomhus över natten.")
            + F("Hur många marsvin får plats?",
                "Löpgårdens 0,72 m² räcker enligt L80 till fyra marsvin i grupp. "
                "Två är ett bra par i den här storleken och får då gott om plats.")
            + F("Kan man ställa den på balkong eller trall?",
                "Ja, men då tappar djuren gräset under sig. Lägg i så fall ett "
                "lager strö eller en matta i löpgården så de inte går direkt på "
                "hårt underlag.")
            + F("Vad väger den?",
                "15,7 kg. Den går att flytta av en person på plan mark, men lyft "
                "ut djuren först.")
            + F("Behöver den monteras?",
                "Ja. Hagen levereras platt i ett paket på 109 × 57 × 21,5 cm och "
                "skruvas ihop med de skruvar som ingår.")
            + F("Passar den för hamster eller råtta?",
                "Ytan räcker med god marginal, men hagen är byggd för marsvin. "
                "L80 kräver att gnagare alltid kan nå en plats där de har det "
                "lagom varmt, och vuxna guldhamstrar får dessutom inte hållas "
                "tillsammans — en utomhushage för flera djur är alltså fel hem "
                "för dem.")
        ),
    )


# ---------------------------------------------------------------- modell C ---
# 123 × 120 × 52 cm; hus 42,5 × 42,5 × 47 INNE i fotavtrycket; husöppning
# 16 × 22; hagdörr 41 × 34; gran + metall; 16,6 kg; paket 127,5 × 54 × 18,5.
# Godkänd yta 1,48 m² (52 cm är YTTERhöjd).
def modell_c():
    return dict(
        namn="Smådjurshage 123 × 120 cm med hus och uppfällbart tak",
        slug="smadjurshage-123-cm-hus",
        titel="Smådjurshage 123 × 120 cm med hus | Fyndplats",
        meta=("Kvadratisk smådjurshage 123 × 120 cm med slutet hus inuti. 1,48 m² "
              "på marken, uppfällbart tak och nät runt om. Gran och metall."),
        sokord=[("smådjurshage", True), ("marsvinshage med hus", False),
                ("smådjurshage kvadratisk", False), ("utomhushage marsvin", False)],
        html=(
            P("En nästan kvadratisk <strong>smådjurshage</strong> på 123 × 120 cm "
              "med ett slutet hus i ena hörnet. Huset står inne i hagen, så djuren "
              "rör sig fritt mellan skydd och öppen yta utan att någon lucka "
              "behöver öppnas.")
            + H("120 cm i båda riktningarna")
            + P("Hagen är nästan lika djup som den är bred, vilket ger plats att "
                "svänga av och att gömma sig bakom huset i stället för att bara "
                "springa fram och tillbaka. Golvytan är 1,48 m².")
            + H("Taket fälls upp över hela hagen")
            + P("Ovansidan öppnas uppåt så att du kommer åt hela ytan ovanifrån. "
                "Det gör den dagliga skötseln till en enkel rörelse: fyll på hö, "
                "byt vatten och plocka bort rester utan att krypa in genom "
                "hagdörren på 41 × 34 cm.")
            + H("Huset är 42,5 × 42,5 cm med öppning på 16 × 22 cm")
            + P("Sovdelen är ett slutet hus med väggar, golv och tak. Öppningen "
                "mäter 16 × 22 cm — tillräckligt för ett marsvin att gå in genom, "
                "och liten i förhållande till väggarna runt om.")
            + l80("1,48", "nio",
                  "Höjden 52 cm är hagens yttermått, alltså mätt över virket. Den "
                  "fria höjden inuti är lägre och anges inte, men marginalen till "
                  "kravets 25 cm är stor.")
            + KANINRADEN
            + H("Tekniska specifikationer")
            + UL([
                ("Yttermått", "123 × 120 × 52 cm (L × B × H)"),
                ("Golvyta", "1,48 m²"),
                ("Hus", "42,5 × 42,5 × 47 cm, står inne i hagen"),
                ("Öppning till huset", "16 × 22 cm"),
                ("Dörr till hagen", "41 × 34 cm"),
                ("Tak", "fälls upp"),
                ("Material", "gran och metall"),
                ("Färg", "natur"),
                ("Vikt", "16,6 kg"),
                ("Paketmått", "127,5 × 54 × 18,5 cm"),
                ("Montering", "krävs"),
                ("Lämplig för", "marsvin och andra små gnagare"),
            ])
            + H("Användning och skötsel")
            + SKOTSEL_MARK
            + P("Lägg hö eller kutterspån i huset och byt när det blir fuktigt. "
                "Resten av hagen sköter gräset själv så länge du flyttar den innan "
                "fläcken är nedtrampad.")
            + SKOTSEL_TRA
            + VINTER
            + H("Vanliga frågor")
            + F("Har hagen botten?",
                "Nej, den står direkt på marken så djuren kommer åt gräset. Huset "
                "har golv och håller sovplatsen torr.")
            + F("Hur många marsvin får plats?",
                "1,48 m² räcker enligt L80 till nio marsvin i grupp. Två till fyra "
                "är ett rimligt sällskap i den här storleken.")
            + F("Går huset att flytta inom hagen?",
                "Huset är en del av konstruktionen och sitter fast där det är "
                "monterat. Hela hagen flyttas i stället som en enhet.")
            + F("Vad väger den?",
                "16,6 kg. En person kan flytta den på plan mark, men lyft ut "
                "djuren först.")
            + F("Kan den stå på trall eller sten?",
                "Ja, men lägg då i strö eller en matta så djuren inte går på hårt "
                "underlag. Poängen med den öppna bottnen är annars borta.")
            + F("Behöver den monteras?",
                "Ja. Den levereras platt i ett paket på 127,5 × 54 × 18,5 cm och "
                "skruvas ihop med de skruvar som ingår.")
            + F("Är nätet tillräckligt tätt?",
                "Metallnätet håller undan katter och fåglar med taket stängt. "
                "Mot grävande djur skyddar ingen hage utan botten, så låt inte "
                "djuren vara ute på natten.")
        ),
    )


# ---------------------------------------------------------------- modell D ---
# 110 × 105 × 50 cm, hopfällbar till 110 × 13,5 × 50; sidodörr 43,5 × 42;
# topplucka 110 × 48; gran + stål; stavavstånd 1,2 × 1,2 cm; 12,5 kg;
# paket 117 × 57 × 18. Godkänd yta 1,16 m² (50 cm är YTTERhöjd).
def modell_d():
    return dict(
        namn="Hopfällbar smådjurshage 110 × 105 cm med uppfällbart tak",
        slug="hopfallbar-hage-110-cm",
        titel="Hopfällbar smådjurshage 110 × 105 cm | Fyndplats",
        meta=("Hopfällbar smådjurshage 110 × 105 cm som viks till 13,5 cm tjocklek. "
              "1,16 m² på marken, topplucka, sidodörr och nät med 1,2 cm maska."),
        sokord=[("hopfällbar smådjurshage", True), ("marsvinshage utomhus", False),
                ("smådjurshage vikbar", False), ("utomhushage gnagare", False)],
        html=(
            P("En <strong>hopfällbar smådjurshage</strong> på 110 × 105 cm som viks "
              "ihop till 13,5 cm tjocklek när den inte används. Den ställs direkt "
              "på gräset, har nät på alla sidor och väger 12,5 kg.")
            + H("Viks till 13,5 cm och ställs undan")
            + P("Hopfälld mäter hagen 110 × 13,5 × 50 cm — den går in bakom en dörr, "
                "i ett förråd eller i en bagagelucka. Det är skillnaden mot en fast "
                "hage av samma yta: den här behöver ingen plats när säsongen är "
                "slut, och den följer med till sommarstället.")
            + H("Två vägar in — topplucka och sidodörr")
            + P("Ovansidan har en lucka på 110 × 48 cm och sidan en dörr på "
                "43,5 × 42 cm. Toppluckan använder du för den dagliga skötseln; "
                "sidodörren står öppen mot en annan hage eller mot en bur när "
                "djuren ska gå in och ut själva.")
            + H("Nätet har 1,2 cm maska")
            + P("Stavavståndet är 1,2 × 1,2 cm. Det är tätt nog att hålla kvar även "
                "unga marsvin och tillräckligt öppet för att hagen ska vara luftig "
                "och lätt att se igenom.")
            + l80("1,16", "sju",
                  "Höjden 50 cm är yttermåttet över virket; den fria höjden inuti "
                  "är lägre men långt över kravets 25 cm.")
            + KANINRADEN
            + H("Tekniska specifikationer")
            + UL([
                ("Yttermått", "110 × 105 × 50 cm (L × B × H)"),
                ("Hopfälld", "110 × 13,5 × 50 cm"),
                ("Golvyta", "1,16 m²"),
                ("Topplucka", "110 × 48 cm"),
                ("Sidodörr", "43,5 × 42 cm"),
                ("Maska i nätet", "1,2 × 1,2 cm"),
                ("Material", "gran och stål"),
                ("Färg", "grå"),
                ("Vikt", "12,5 kg"),
                ("Paketmått", "117 × 57 × 18 cm"),
                ("Montering", "krävs"),
                ("Lämplig för", "marsvin och andra små gnagare"),
            ])
            + H("Användning och skötsel")
            + SKOTSEL_MARK
            + P("Fäll ihop hagen torr. Fukt som stängs in mellan sidorna ger "
                "mögelfläckar på träet under vintern; låt den stå upprätt i luften "
                "ett dygn innan den viks och ställs undan.")
            + SKOTSEL_TRA
            + VINTER
            + H("Vanliga frågor")
            + F("Hur snabbt fälls den ihop?",
                "Sidorna är gångjärnade och viks in mot varandra utan verktyg. "
                "Lyft ut djuren först.")
            + F("Har den botten?",
                "Nej. Hagen står direkt på marken så djuren kommer åt gräset, och "
                "det är det som gör den till en betesbur.")
            + F("Hur många marsvin får plats?",
                "1,16 m² räcker enligt L80 till sju marsvin i grupp. Två till fyra "
                "är ett rimligt sällskap här.")
            + F("Kan den kopplas mot en bur?",
                "Sidodörren på 43,5 × 42 cm är stor nog att ställa mot en buröppning "
                "så djuren går ut själva. Det finns ingen mekanisk koppling, så "
                "ställ delarna tätt och håll uppsikt.")
            + F("Håller nätet undan katter?",
                "Nätet och toppluckan gör hagen stängd så länge luckan är nere. "
                "Mot grävande djur hjälper ingen hage utan botten — låt inte djuren "
                "vara ute på natten.")
            + F("Behöver den monteras?",
                "Ja, första gången. Sedan är den hopfällbar och behöver inte "
                "skruvas isär igen.")
            + F("Tål den regn?",
                "Ramen är av gran och nätet av stål, och hagen är byggd för att stå "
                "ute. Djuren behöver ändå en torr och skuggad plats att gå till — "
                "hagen har inget tak som skyddar mot väder.")
        ),
    )


PRODUKTER = {
    "a4c0595f": modell_a("a4c0595f"),
    "7eebd0eb": modell_a("7eebd0eb"),
    "b54e7a23": modell_b("b54e7a23"),
    "1f7ebf33": modell_b("1f7ebf33"),
    "edc81021": modell_c(),
    "117691b5": modell_d(),
}
