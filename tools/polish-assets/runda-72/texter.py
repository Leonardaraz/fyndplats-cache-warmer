# -*- coding: utf-8 -*-
"""Runda 72 — tre golvfåtöljer, fyra reclinerfåtöljer med fotpall, en liten.

☠️ Batch 64 mätte skillnaden: fem produkter skrivna inline gav NIO fel som
nådde Wix, tre skrivna via fil gav noll. Texten skrivs därför HÄR.

☠️ RUNDANS STÖRSTA FYND — TVÅ MODELLER DELAR VARJE YTTERMÅTT, OCH BARA
ARTIKELNUMRET SKILJER DEM. Måttgruppering är regeln sedan runda 70 (familj J
såg ut som ett par och var en kvartett). Den regeln hade slagit ihop två
olika produkter här:

    839-423V00LG  golvfatolj-360-grader-fem-lagen   62 × 70 × 95, 11 kg  PUBLICERAD
    83B-380V00BG  golvfatolj-vridfot-beige          62 × 70 × 95, 11 kg  PUBLICERAD
    839-423V00GY  64856235 grå                      62 × 70 × 95, 11 kg  ← runda 72
    839-423V00BU  35872574 petrolblå                62 × 70 × 95, 11 kg  ← runda 72
    839-423V00BG  4f6bef7d beige                    62 × 70 × 95, 11 kg  ← runda 72

Måtten är identiska ned till kilot. Paketet skiljer en centimeter (66 × 61 × 27
mot 66 × 62 × 28) och klädseln är sammetsimitation på den ena serien — men den
som grupperar på yttermått får fem produkter i en familj där det finns två.

**Regeln: MÅTTEN hittar familjen, ARTIKELNUMRETS BAS avgör den.** Runda 61
mätte upp att basen är modellen och suffixet färgen; runda 72 mäter upp att
måtten kan ljuga åt andra hållet. Kör båda.

☠️ RUNDANS ANDRA FYND — TRION ÄR GOLVFÅTÖLJER, INTE FÅTÖLJER. Titeln säger
`Relaxsessel Lesesessel, drehbar`; `Lieferumfang` säger `1 x Bodensofa`. Enligt
runbokens egen regel är Lieferumfang kontraktet och titeln marknadsföring — och
fotona avgör: skålen sitter direkt på golvet, sitthöjden är 37 cm. Hade de
skrivits som "fåtölj" hade kunden väntat sig en stol att resa sig ur.

☠️ RUNDANS TREDJE FYND — DET PUBLICERADE SYSKONET BESKRIVER BASEN FEL.
`golvfatolj-360-grader-fem-lagen` säger på två ställen "en låg, rund stålbas".
Uppmätt på fem foton över tre färger (`kolla-bas.jpg`): basen är en TYGKLÄDD,
FYRSIDIG sockel som smalnar av mot golvet, med sömmar i hörnen. Varken rund
eller synligt stål. Stål finns i stommen enligt källan, men det syns inte.
De tre nya sidorna beskriver sockeln som den ser ut; den publicerade behöver
en rättelse (uppgift #298).

**Metodregeln som följde: ett publicerat syskon är en REFERENS, inte ett
facit.** Verifiera dess påståenden mot bilderna precis som källans egna — annars
sprids ett fel till varje ny färg som ärver texten.

⚠️ TVÅ FAKTA SOM TRION ÄRVER FRÅN DET PUBLICERADE SYSKONET, med spårbarhet:
`360°` och `fem ryggvinklar (tre bakåt, två framåt)`. Utkastens egen tyska
brödtext ger bara `Maximaler Neigungswinkel: 120°` och ordet `drehbar` i
titeln. Syskonet bär samma artikelnummerbas (839-423), alltså samma modell, och
fotona visar en helvridbar sockel. Alternativet — att skriva "flera lägen" på
tre sidor och "fem lägen" på den fjärde — hade gjort fyra syskonsidor oense om
samma stol.

Färgen mätt ur PIXLARNA, inte ur feedens Farbe-kolumn (`farg.py`):

  · 64856235 "Grau"          → grå        (mörkast 30 %, median 35 %, S 2 %)
  · 35872574 "Blau"          → PETROLBLÅ  (H 193°, S 41 % — cyan, inte blått)
  · 4f6bef7d "Beige"         → beige      (mörkast 62 %, H 34, S 37 %)
  · f192540f "Schwarz"       → svart      (mörkast 13 % — blankt läder)
  · 78cb09ba "Grau"          → grå        (mörkast 20 %, median 41 %, S 3 %)
  · 8f6636e4 "Grau"          → LJUSGRÅ    (mörkast 40 %, median 59 %)
  · b8001a1b "Schwarz"       → svart      (mörkast 12 %)
  · dbbe7253 "Beige+Schwarz" → beige klädsel på SVARTA träben

⚠️ `35872574` är rundans färgfynd. Källan säger "Blau"; mätningen säger H 193°,
alltså cyan/turkos, med 41 % mättnad. Att skriva "blå" hade sålt en petrolgrön
stol som blå. Ordet "blå" finns kvar i "petrolblå", så sökordet överlever.

⚠️ `78cb09ba` är gränsfallet där mörkaste decilen ensam hade svarat fel: 20 %
ligger vid svartbandets övertak, men medianen säger 41 % och ögat säger en
varm mellangrå (`jamfor-gra.jpg`). På BLANKT läder drar djupa veck ned decilen
lika mycket som studioljuset drar upp medianen — läs båda, inte en.

Fem saker är MEDVETET utelämnade:

  1. "Einfache und schnelle Montage" (8f6636e4). Marknadsföring utan mått,
     samma skäl som runda 71:s "5-Minuten-Montage".
  2. Märkesnamnet. Källan säger ordagrant "Sessel von ." på fyra av åtta —
     namnet är redan struket och lämnade en punkt efter sig.
  3. Ryggvinkel för trion utöver 120°. Källan ger ett tal, inte en trappa.
  4. "Wippfunktion" om alla utom 78cb09ba. Bara den har den i källan.
  5. Fotpall om trion och dbbe7253. Ingen av dem har en i `Lieferumfang`.
"""
import sys, os
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
SAMMETSLOOK = (
    "Klädseln är sammetslook: en mikrofiberväv med sammetens mjuka yta och "
    "lyster, men helt syntetisk i 100 % polyester. Den tål mer slitage än "
    "sammet av naturfiber och dammsugs i stället för att tvättas."
)
# ☠️ Skötselblocket sa "mikrofiber" medan specen sa "linnelook"/"sammetslook".
#    Två namn på samma tyg läser som två olika tyger på samma sida.
VAVTEXT = {"linnelook": LINNELOOK, "sammetslook": SAMMETSLOOK}
LINNE = (
    "Klädseln är linne, alltså naturfiber. Den andas och känns sval att sitta "
    "på, men den skrynklar lättare än en syntetväv och tål inte blötläggning."
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
MONTERING_BEN = (
    "Stolen kommer i delar och skruvas ihop hemma. Benen skruvas fast i "
    "sitsramen; dra åt alla skruvar innan du sätter dig första gången, och "
    "efterdra dem efter någon månads användning."
)
MONTERING_RYGG = (
    "Fåtöljen kommer i delar och skruvas ihop hemma. Ryggen fästs i sitsen med "
    "de förmonterade beslagen; dra åt alla skruvar innan du sätter dig första "
    "gången, och efterdra dem efter någon månads användning."
)
GOLV_SKOTSEL = (
    "Fäll ryggen med båda händerna på ramen, inte genom att dra i klädseln. "
    "Mekanismen är stål och tål greppet; tyget gör det inte i längden."
)
GOLV_MONTERING = (
    "Stolen kommer i delar och skruvas ihop hemma. Kontrollera sockelns skruvar "
    "efter första månaden — en vridbar sockel arbetar långsamt loss dem. Lyft "
    "stolen när den ska flyttas; sockeln är gjord för att vridas mot golvet, "
    "inte dras över det."
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


def och(delar):
    if len(delar) == 1:
        return delar[0]
    return ", ".join(delar[:-1]) + " och " + delar[-1]


# ============================================================== familj W ===
# GOLVFÅTÖLJ, artikelnummerbas 839-423. Skålen sitter direkt på golvet på en
# tygklädd, fyrsidig sockel som vrider 360°. Rygg i fem lägen, flatast 120°.
# ☠️ Lieferumfang säger "Bodensofa" — det är en golvfåtölj, inte en fåtölj.
# ☠️ Sockeln är INTE rund och stålet syns INTE (kolla-bas.jpg, uppgift #298).
W_SLUG = {"64856235": "golvfatolj-gra-fem-lagen",
          "35872574": "golvfatolj-petrolbla-fem-lagen",
          "4f6bef7d": "golvfatolj-beige-fem-lagen"}
W_FARG = {"64856235": "grå", "35872574": "petrolblå", "4f6bef7d": "beige"}
# Klädseln skiljer inom familjen: två linnelook, en sammetslook. Titeln och
# fotot säger samma sak på varje enskild produkt.
W_VAV = {"64856235": "linnelook", "35872574": "sammetslook", "4f6bef7d": "linnelook"}
W_PUBLICERAD = "golvfatolj-360-grader-fem-lagen"


def w_spec(k):
    return [
        "Mått (B × D × H): 62 × 70 × 95 cm",
        "Sittyta: 62 × 48 cm",
        "Sitthöjd: 37 cm",
        "Sitsens tjocklek: 15 cm",
        "Ryggvinklar: fem lägen — tre bakåt, två framåt",
        "Flataste vinkel: 120°",
        "Rotation: 360°",
        "Maxlast: 120 kg",
        "Klädsel: %s, 100 %% polyester" % W_VAV[k],
        "Stomme: stål med skumstoppning",
        "Sockel: tygklädd, fyrsidig",
        "Färg: %s" % W_FARG[k],
        "Vikt: 11 kg",
        "Paketmått: 66 × 61 × 27 cm",
        "Montering: krävs",
        "Ingår: golvfåtölj och monteringsanvisning",
    ]


def w_produkt(kort, pris, syskon):
    f, v = W_FARG[kort], W_VAV[kort]
    return {
        "kort": kort, "pris": pris, "slug": W_SLUG[kort],
        "name": "Golvfåtölj med 360° vridsockel och fem ryggvinklar – %s" % f,
        "title": "Golvfåtölj %s, 360° vridsockel | Fyndplats" % f,
        "meta": ("Golvfåtölj i %s %s, 62 × 70 × 95 cm. Sitthöjd 37 cm, 15 cm "
                 "tjock sits och rygg i fem lägen, flatast 120°. Sockeln vrider "
                 "360°. Bär 120 kg." % (f, v)),
        "sokord": "golvfåtölj vridbar",
        "ingress": (
            "<p>En golvfåtölj i %s %s: den stoppade skålen sitter direkt på "
            "golvet på en tygklädd sockel som vrider ett helt varv. Ryggen "
            "fälls i fem lägen och sitthöjden är 37 cm, alltså en bit under en "
            "vanlig stol. Hela stolen väger 11 kg.</p>" % (f, v)),
        "eg": [
            "Sitter direkt på golvet — sitthöjd 37 cm",
            "Sockeln vrider 360°",
            "Ryggen har fem lägen: tre bakåt, två framåt",
            "Flataste läget är 120°",
            "15 cm tjock sits på 62 × 48 cm, stickad i rutor",
            "Väger 11 kg och går att bära in ensam",
            "Bär 120 kg",
            "Levereras omonterad",
        ],
        "spec": w_spec(kort),
        "villkor": ("Sockeln är tygklädd, inte en synlig fot", [
            "Stolen står på en fyrsidig sockel som smalnar av mot golvet och är "
            "klädd i samma tyg som sitsen. Stålet och vridlagret ligger inne i "
            "den, så det du ser är tyg hela vägen ned. Sockelns undersida "
            "vilar mot golvet över hela ytan — den vrids mot underlaget och "
            "ska inte dras över det.",
            "Eftersom stolen inte har ben går den att ställa på en matta utan "
            "att sjunka ned i luggen, och paketet är bara 27 cm tjockt om den "
            "ska undan mellan gångerna.",
        ]),
        "skotsel": [VAVTEXT[v], GOLV_SKOTSEL, SKOTSEL_TYG, GOLV_MONTERING],
        "faq": [
            ("Hur högt sitter man?",
             "37 cm över golvet. Sittytan är 62 × 48 cm och sitsen är 15 cm "
             "tjock."),
            ("Hur många ryggvinklar finns det?",
             "Fem: tre bakåt och två framåt. Det flataste läget är 120°."),
            ("Vrider den ett helt varv?",
             "Ja, 360° på sockeln."),
            ("Har den ben?",
             "Nej. Skålen sitter på en tygklädd fyrsidig sockel som står direkt "
             "mot golvet."),
            ("Hur mycket bär den?",
             "120 kg. Stommen är stål med skumstoppning och stolen väger 11 kg."),
            ("Går den att ställa undan?",
             "Ja. Den väger 11 kg och paketet är 27 cm tjockt."),
            ("Finns den i fler färger?",
             "Ja, samma modell finns i %s." % syskon),
        ],
    }


# ============================================================== familj X ===
# Konstläderfåtölj 75 cm bred med LÖS fotpall, pulverlackerad stålram, 360°
# vridbar, rygg till 135°. ☠️ 120 kg i sitsen men bara 60 kg i fotpallen —
# den skillnaden måste stå utskriven, den är den största i hela rundan.
def x_produkt():
    return {
        "kort": "f192540f", "pris": 2359, "slug": "stalfatolj-svart-med-fotpall",
        "name": "Fåtölj i svart konstläder med lös fotpall, 75 cm bred",
        "title": "Fåtölj 75 cm med fotpall, svart | Fyndplats",
        "meta": ("Smal fåtölj i svart konstläder, 75 cm bred, med lös fotpall "
                 "och pulverlackerad stålram. Ryggen fälls till 135° och sitsen "
                 "vrider 360°. Bär 120 kg."),
        "sokord": "fåtölj fotpall svart",
        "ingress": (
            "<p>En fåtölj i svart konstläder som bara tar 75 cm i bredd, med en "
            "lös fotpall och en pulverlackerad stålram i kryss. Ryggen fälls "
            "bakåt till 135° med ett grepp på sidan och sitsen vrider 360°. "
            "Tillbakalutad mäter fåtöljen 105 cm i djup.</p>"),
        "eg": [
            "Bara 75 cm bred",
            "Lös fotpall, 45 × 45 cm och 43 cm hög",
            "Ryggen fälls till 135° med ett grepp på sidan",
            "Sitsen vrider 360°",
            "Pulverlackerad stålram",
            "52 cm bred sits på 45 cm höjd, 10 cm stoppning",
            "Bär 120 kg — fotpallen 60 kg",
            "Levereras omonterad",
        ],
        "spec": [
            "Mått upprätt (B × D × H): 75 × 84 × 101 cm",
            "Mått tillbakalutad (B × D × H): 75 × 105 × 95 cm",
            "Sits (B × D × H): 52 × 48 × 45 cm",
            "Sitsens stoppning: 10 cm",
            "Ryggstöd: 73 × 63 cm, 13 cm tjockt",
            "Fotpall (B × D × H): 45 × 45 × 43 cm",
            "Ryggvinkel: upp till 135°",
            "Vridfot: 360°",
            "Maxlast: 120 kg för fåtöljen, 60 kg för fotpallen",
            "Väggavstånd bakom stolen: 60 cm",
            "Klädsel: konstläder",
            "Stomme: pulverlackerat stål och lamellskiva",
            "Färg: svart",
            "Vikt: 22 kg",
            "Paketmått: 78 × 64,5 × 45 cm",
            "Montering: krävs",
            "Ingår: fåtölj, fotpall och anvisning",
        ],
        "villkor": ("Fotpallen bär 60 kg, inte 120", [
            "Fåtöljen är gjord för 120 kg, men fotpallen för 60. Den är alltså "
            "till för fötterna och inte en extra sittplats — det är den halva "
            "lasten som avgör, inte stolens.",
            "Ryggen fälls dessutom bakåt, så räkna med 60 cm fritt bakom "
            "stolen för att den ska gå hela vägen till 135°. Tillbakalutad "
            "mäter den 105 cm i djup mot 84 cm upprätt.",
        ]),
        "skotsel": [KONSTLADER, SKOTSEL_KONSTLADER, MONTERING_SKRUV],
        "faq": [
            ("Hur långt bakåt går ryggen?",
             "Till 135°, ställt med ett grepp på sidan. Tillbakalutad är "
             "fåtöljen 105 cm djup och 95 cm hög, mot 101 cm upprätt."),
            ("Får man sitta på fotpallen?",
             "Nej. Fotpallen är gjord för 60 kg och är avsedd för fötterna. "
             "Själva fåtöljen bär 120 kg."),
            ("Hur mycket plats behöver den?",
             "75 cm i bredd och 84 cm i djup upprätt, plus 60 cm fritt bakom "
             "stolen."),
            ("Snurrar den?",
             "Ja, sitsen går 360° runt på stålkrysset."),
            ("Är klädseln skinn?",
             "Nej, det är konstläder — en plastbelagd väv. Den torkas av med "
             "en fuktad trasa."),
            ("Hur tjock är sitsen?",
             "10 cm. Sittytan är 52 × 48 cm och ligger 45 cm över golvet."),
            ("Finns det en modell som bär mer?",
             "Ja, %s bär 150 kg och har vippfunktion."
             % lank("fatolj-gra-fotpall-vippfunktion", "grå fåtölj med fotpall")),
        ],
    }


# ============================================================== familj Y ===
# Konstläderfåtölj 81 cm med lös fotpall, RUND stålfot på båda delarna,
# VIPPFUNKTION och rygg till 132°. 150 kg, ingen delad last i källan.
def y_produkt():
    return {
        "kort": "78cb09ba", "pris": 3179, "slug": "fatolj-gra-fotpall-vippfunktion",
        "name": "Fåtölj i grått konstläder med fotpall och vippfunktion",
        "title": "Fåtölj med fotpall och vippfunktion, grå | Fyndplats",
        "meta": ("Fåtölj i grått konstläder med lös fotpall, rund stålfot och "
                 "vippfunktion. Ryggen fälls till 132° och sitsen är 56 cm bred "
                 "med 15 cm stoppning. Bär 150 kg."),
        "sokord": "fåtölj fotpall vippfunktion",
        "ingress": (
            "<p>En fåtölj i grått konstläder med en lös fotpall, båda på en rund "
            "stålfot. Utöver att ryggen fälls till 132° vippar hela stolen mjukt "
            "i sitt fäste, så du kan gunga lätt utan att luta ryggen alls. "
            "Sitsen är 56 cm bred med 15 cm stoppning.</p>"),
        "eg": [
            "Vippfunktion — stolen gungar mjukt i fästet",
            "Ryggen fälls till 132°",
            "Lös fotpall, 50 × 44 cm och 44 cm hög",
            "Rund stålfot under både fåtölj och fotpall",
            "56 cm bred sits på 47 cm höjd, 15 cm tjock",
            "Högt ryggstöd, 83 cm, med 20 cm stoppning",
            "Halkskyddade fötter",
            "Bär 150 kg",
            "Levereras omonterad",
        ],
        "spec": [
            "Mått upprätt (B × D × H): 81 × 95 × 107 cm",
            "Mått tillbakalutad (B × D × H): 81 × 105 × 100 cm",
            "Sits (B × D × H): 56 × 50 × 47 cm",
            "Sitsens tjocklek: 15 cm",
            "Ryggstöd: 83 × 66 cm, 20 cm tjockt",
            "Armstöd (B × D × H): 52 × 17 × 17 cm",
            "Fotpall (B × D × H): 50 × 44 × 44 cm",
            "Ryggvinkel: upp till 132°",
            "Vippfunktion: ja",
            "Maxlast: 150 kg",
            "Väggavstånd bakom stolen: 50 cm",
            "Klädsel: konstläder",
            "Stomme: lamellskiva och skum på rund stålfot",
            "Färg: grå",
            "Vikt: 25 kg",
            "Paketmått: 84 × 66 × 38 cm",
            "Montering: krävs",
            "Ingår: fåtölj, fotpall och bruksanvisning",
        ],
        "villkor": ("Vippfunktion och ryggfällning är två olika saker", [
            "Stolen gör två rörelser som är lätta att blanda ihop. Vippfunktionen "
            "låter hela stolen gunga mjukt i sitt fäste medan ryggen står kvar "
            "i sin vinkel — den är alltid på. Ryggfällningen är den separata "
            "inställningen som tar ryggen bakåt till 132°.",
            "Räkna med 50 cm fritt bakom stolen för att ryggen ska gå hela "
            "vägen. Tillbakalutad mäter fåtöljen 105 cm i djup mot 95 cm "
            "upprätt.",
        ]),
        "skotsel": [KONSTLADER, SKOTSEL_KONSTLADER, MONTERING_SKRUV],
        "faq": [
            ("Vad är skillnaden mellan vippfunktion och ryggfällning?",
             "Vippfunktionen får hela stolen att gunga mjukt i fästet och är "
             "alltid på. Ryggfällningen tar ryggen bakåt till 132° och ställs "
             "separat."),
            ("Ingår fotpallen?",
             "Ja, den är lös och ingår. Den mäter 50 × 44 cm och är 44 cm hög."),
            ("Hur mycket bär den?",
             "150 kg. Stommen är lamellskiva och skum på en rund stålfot, och "
             "fåtöljen väger 25 kg."),
            ("Hur mycket plats behöver den?",
             "81 cm i bredd och 95 cm i djup upprätt, plus 50 cm fritt bakom "
             "stolen."),
            ("Är klädseln skinn?",
             "Nej, det är konstläder — en plastbelagd väv. Den torkas av med "
             "en fuktad trasa."),
            ("Repar foten golvet?",
             "Fötterna är halkskyddade. Lyft ändå stolen när den ska flyttas i "
             "stället för att dra den."),
            ("Finns det en modell med träfot?",
             "Ja, %s står på massiv träfot och fäller ryggen till 135°."
             % lank("fatolj-ljusgra-fotpall-trafot", "ljusgrå fåtölj med fotpall")),
        ],
    }


# ============================================================== familj Z ===
# Konstläderfåtölj 85 cm med fotpall på MASSIV TRÄFOT, 360° vridbar, rygg till
# 135°. ☠️ Fotstödet är HÖJDJUSTERBART, 36 eller 40 cm — källan skriver
#    "36/40H" och det är två lägen, inte ett spann.
def z_produkt():
    return {
        "kort": "8f6636e4", "pris": 3599, "slug": "fatolj-ljusgra-fotpall-trafot",
        "name": "Fåtölj i ljusgrått konstläder med fotpall på träfot",
        "title": "Fåtölj med fotpall på träfot, ljusgrå | Fyndplats",
        "meta": ("Fåtölj i ljusgrått konstläder med fotpall, båda på massiv "
                 "träfot. Ryggen fälls till 135°, sitsen vrider 360° och "
                 "fotpallen har två höjder. Bär 130 kg."),
        "sokord": "fåtölj fotpall träfot",
        "ingress": (
            "<p>En fåtölj i ljusgrått konstläder med en matchande fotpall, båda "
            "på en fot av massivt trä. Ryggen fälls bakåt till 135° och sitsen "
            "vrider 360°. Fotpallen har två höjder — 36 eller 40 cm — så den "
            "går att ställa i nivå med sitsen eller lite under.</p>"),
        "eg": [
            "Fotpall med två höjder: 36 eller 40 cm",
            "Ryggen fälls till 135°",
            "Sitsen vrider 360°",
            "Fot av massivt trä under både fåtölj och fotpall",
            "52 cm bred sits på 41,5 cm höjd, 11 cm tjock",
            "Ryggstöd 82 cm brett med 12 cm stoppning",
            "Bär 130 kg — fotpallen 80 kg",
            "Levereras omonterad",
        ],
        "spec": [
            "Mått upprätt (B × D × H): 85 × 82 × 106 cm",
            "Mått tillbakalutad (B × D × H): 85 × 106 × 94 cm",
            "Sits (B × D × H): 52 × 51 × 41,5 cm",
            "Sitsens tjocklek: 11 cm",
            "Ryggstöd (B × D): 82 × 60 cm, 12 cm tjockt",
            "Fotpall (B × D): 50 × 47 cm",
            "Fotpallens höjd: 36 eller 40 cm",
            "Ryggvinkel: upp till 135°",
            "Vridfot: 360°",
            "Maxlast: 130 kg för fåtöljen, 80 kg för fotpallen",
            "Klädsel: konstläder",
            "Stomme: stål och skum på fot av massivt trä",
            "Färg: ljusgrå",
            "Vikt: 25 kg",
            "Paketmått: 84 × 67 × 58 cm",
            "Montering: krävs",
            "Ingår: fåtölj, fotpall och monteringsanvisning",
        ],
        "villkor": ("Fotpallen har två höjder, inte ett spann", [
            "Fotpallen ställs i 36 eller 40 cm — två fasta lägen, inte en "
            "steglös skruv. Sitsen ligger på 41,5 cm, så det högre läget "
            "hamnar strax under sitthöjd och det lägre en bit ned.",
            "Fotpallen bär 80 kg mot fåtöljens 130. Den är alltså till för "
            "fötterna och inte en extra sittplats.",
        ]),
        "skotsel": [KONSTLADER, SKOTSEL_KONSTLADER, MONTERING_SKRUV],
        "faq": [
            ("Hur långt bakåt går ryggen?",
             "Till 135°. Upprätt är fåtöljen 82 cm djup och 106 cm hög; "
             "tillbakalutad blir den 106 cm djup och 94 cm hög."),
            ("Går fotpallen att höja?",
             "Ja, den ställs i 36 eller 40 cm. Två fasta lägen."),
            ("Får man sitta på fotpallen?",
             "Nej. Fotpallen är gjord för 80 kg och avsedd för fötterna. "
             "Fåtöljen bär 130 kg."),
            ("Vad är foten gjord av?",
             "Massivt trä, under både fåtöljen och fotpallen."),
            ("Snurrar den?",
             "Ja, sitsen går 360° runt på träfoten."),
            ("Är klädseln skinn?",
             "Nej, det är konstläder — en plastbelagd väv. Den torkas av med "
             "en fuktad trasa."),
            ("Finns det en modell som bär mer?",
             "Ja, %s bär 150 kg och har justerbart nackstöd."
             % lank("fatolj-svart-fotpall-nackstod", "svart fåtölj med fotpall")),
        ],
    }


# ============================================================== familj Å ===
# Konstläderfåtölj 80 cm med fotpall, träram + blankt stålkryss, 360° vridbar,
# rygg till 135°. ☠️ NACKSTÖDET ÄR JUSTERBART 10 cm — enda produkten i rundan
#    med den funktionen, och den ligger bara i Beschreibung, inte i måtten.
# ☠️ Bild 4 är BORTTAGEN: fyra tyska etiketter inbrända i pixlarna
#    ("Gepolsterte Armlehne", "Robuster Stahlrahmen", "Schützendes Fußpolster",
#    "Passender Hocker"). Se media.py.
def aa_produkt():
    return {
        "kort": "b8001a1b", "pris": 4159, "slug": "fatolj-svart-fotpall-nackstod",
        "name": "Fåtölj i svart konstläder med fotpall och justerbart nackstöd",
        "title": "Fåtölj med fotpall, justerbart nackstöd | Fyndplats",
        "meta": ("Fåtölj i svart konstläder med lös fotpall och träram. "
                 "Nackstödet ställs 10 cm, ryggen fälls till 135° och sitsen "
                 "vrider 360°. Bär 150 kg."),
        "sokord": "fåtölj fotpall nackstöd",
        "ingress": (
            "<p>En fåtölj i svart konstläder med en lös fotpall, träram i "
            "sidorna och ett blankt stålkryss under. Nackstödet går att skjuta "
            "10 cm upp eller ned så att det hamnar rätt oavsett kroppslängd, "
            "ryggen fälls till 135° med ett grepp och sitsen vrider 360°.</p>"),
        "eg": [
            "Nackstödet ställs 10 cm upp eller ned",
            "Ryggen fälls till 135° med ett grepp",
            "Lös fotpall, 47 × 47 cm och 43 cm hög",
            "Sitsen vrider 360°",
            "Träram i sidorna på ett blankt stålkryss",
            "53 cm bred sits på 47 cm höjd, 15 cm tjock",
            "Bär 150 kg — fotpallen 80 kg",
            "Levereras omonterad",
        ],
        "spec": [
            "Mått upprätt (B × D × H): 80 × 84 × 108 cm",
            "Mått tillbakalutad (B × D × H): 80 × 118 × 85 cm",
            "Sits (B × D × H): 53 × 49 × 47 cm",
            "Sitsens tjocklek: 15 cm",
            "Ryggstöd (B × D): 70 × 62 cm, 17 cm tjockt",
            "Ryggstödets höjd: 60 cm",
            "Nackstödets justering: 10 cm",
            "Fotpall (B × D × H): 47 × 47 × 43 cm",
            "Ryggvinkel: upp till 135°",
            "Vridfot: 360°",
            "Maxlast: 150 kg för fåtöljen, 80 kg för fotpallen",
            "Klädsel: konstläder",
            "Stomme: trä och pulverlackerat stål",
            "Färg: svart",
            "Vikt: 31,6 kg",
            "Paketmått: 84 × 45 × 68 cm",
            "Montering: krävs",
            "Ingår: fåtölj, fotpall och anvisning",
        ],
        "villkor": ("Den fälls långt bakåt — 118 cm i djup", [
            "Tillbakalutad sträcker sig fåtöljen till 118 cm i djup, mot 84 cm "
            "upprätt. Det är 34 cm mer golv än stolen tar när den står rak "
            "— mät framför "
            "stolen, inte bara bredvid.",
            "Nackstödet ställs separat, 10 cm upp eller ned, så att det går "
            "att flytta dit huvudet faktiskt hamnar. Det är den justeringen "
            "som gör stolen användbar för olika kroppslängder.",
        ]),
        "skotsel": [KONSTLADER, SKOTSEL_KONSTLADER, MONTERING_SKRUV],
        "faq": [
            ("Går nackstödet att ställa?",
             "Ja, 10 cm upp eller ned."),
            ("Hur långt bakåt går ryggen?",
             "Till 135°. Tillbakalutad är fåtöljen 118 cm djup och 85 cm hög, "
             "mot 108 cm upprätt."),
            ("Får man sitta på fotpallen?",
             "Nej. Fotpallen är gjord för 80 kg och avsedd för fötterna. "
             "Fåtöljen bär 150 kg."),
            ("Snurrar den?",
             "Ja, sitsen går 360° runt på stålkrysset."),
            ("Vad är sidorna gjorda av?",
             "Trä, med ett blankt stålkryss under stolen."),
            ("Är klädseln skinn?",
             "Nej, det är konstläder — en plastbelagd väv. Den torkas av med "
             "en fuktad trasa."),
            ("Finns det en smalare modell?",
             "Ja, %s är 75 cm bred i stället för 80."
             % lank("stalfatolj-svart-med-fotpall", "svart fåtölj 75 cm med fotpall")),
        ],
    }


# ============================================================== familj Ä ===
# Liten vintagefåtölj i LINNE (naturfiber, inte linnelook) med knappad,
# svängd rygg och svarta svarvade ben i gummiträ. 67 × 67 × 78, 11 kg, 150 kg.
# Ingen fotpall, ingen ryggfällning, ingen vridfot — enda stolen i rundan
# som bara är en stol.
def ae_produkt():
    return {
        "kort": "dbbe7253", "pris": 1359, "slug": "liten-fatolj-67-cm-knappad-rygg",
        "name": "Liten fåtölj 67 cm i linne med knappad rygg och svarvade ben",
        "title": "Liten fåtölj 67 cm, knappad rygg | Fyndplats",
        "meta": ("Liten fåtölj 67 × 67 × 78 cm i beige linne med knappad, svängd "
                 "rygg och svarta svarvade ben i gummiträ. Justerbara fötter. "
                 "Väger 11 kg och bär 150 kg."),
        "sokord": "liten fåtölj linne",
        "ingress": (
            "<p>En liten fåtölj som tar 67 × 67 cm i golvyta — en stol att ställa "
            "i ett hörn, vid ett skrivbord eller som extraplats i vardagsrummet. "
            "Ryggen är svängd och knappad i tyget, och de svarvade benen är "
            "svartmålat gummiträ. Klädseln är linne, alltså naturfiber.</p>"),
        "eg": [
            "Liten golvyta: 67 × 67 cm",
            "Svängd rygg med knappad stoppning",
            "Svarvade ben i gummiträ, svartmålade",
            "Justerbara fötter för ojämnt golv",
            "Sittyta 60 × 48 cm på 41 cm höjd",
            "Klädsel i linne — naturfiber som andas",
            "Väger 11 kg",
            "Bär 150 kg",
            "Levereras omonterad",
        ],
        "spec": [
            "Mått (B × D × H): 67 × 67 × 78 cm",
            "Sittyta (B × D): 60 × 48 cm",
            "Sitthöjd: 41 cm",
            "Maxlast: 150 kg",
            "Klädsel: linne",
            "Stomme: gummiträ med skumstoppning",
            "Ben: svarvat gummiträ, justerbara fötter",
            "Färg: beige klädsel på svarta ben",
            "Vikt: 11 kg",
            "Paketmått: 67 × 38 × 54 cm",
            "Montering: krävs",
            "Ingår: fåtölj och bruksanvisning",
        ],
        "villkor": ("En stol, inte en reclinerfåtölj", [
            "Ryggen sitter fast i sin vinkel. Stolen fälls inte bakåt, vrider "
            "inte och har ingen fotpall — den är gjord för att sitta upprätt i, "
            "vid ett bord eller i ett hörn. Det är också därför den bara tar "
            "67 × 67 cm och väger 11 kg.",
            "Fötterna går att skruva i höjd var för sig, så stolen står stadigt "
            "även på ett golv som lutar eller på en tröskelkant.",
        ]),
        "skotsel": [LINNE, SKOTSEL_TYG, MONTERING_BEN],
        "faq": [
            ("Går ryggen att fälla?",
             "Nej. Ryggen sitter fast i sin vinkel — det här är en vanlig stol, "
             "inte en reclinerfåtölj."),
            ("Ingår det en fotpall?",
             "Nej, bara fåtöljen och bruksanvisningen."),
            ("Vad är klädseln?",
             "Linne, alltså naturfiber. Den andas och känns sval att sitta på."),
            ("Vad är benen gjorda av?",
             "Svarvat gummiträ, målat svart. Fötterna går att justera i höjd."),
            ("Hur mycket bär den?",
             "150 kg. Stommen är gummiträ och stolen väger 11 kg."),
            ("Hur stor är sittytan?",
             "60 × 48 cm, 41 cm över golvet."),
            ("Finns det en fåtölj att luta sig bakåt i?",
             "Ja, %s fäller ryggen till 135° och har en lös fotpall."
             % lank("stalfatolj-svart-med-fotpall", "svart fåtölj 75 cm med fotpall")),
        ],
    }


# ------------------------------------------------------------- batchen ---
def w_syskon(kort):
    andra = [k for k in ("64856235", "35872574", "4f6bef7d") if k != kort]
    delar = [lank(W_SLUG[k], W_FARG[k]) for k in andra]
    delar.append(lank(W_PUBLICERAD, "ljusgrå"))
    return och(delar)


PRODUKTER = [
    w_produkt("64856235", 1299, w_syskon("64856235")),
    w_produkt("35872574", 1249, w_syskon("35872574")),
    w_produkt("4f6bef7d", 1299, w_syskon("4f6bef7d")),
    x_produkt(),
    y_produkt(),
    z_produkt(),
    aa_produkt(),
    ae_produkt(),
]
