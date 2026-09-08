# -*- coding: utf-8 -*-
"""Runda 100 — sex trädgårdsbord. All text, alla tal, en enda sanning.

☠️ INGEN SIDA SÄGER NÅGOT OM LEVERANS. Fyra av de sex tyska texterna slutar med
   "WICHTIG: Wir liefern Ihnen den Artikel kostenfrei bis Bordsteinkante". Fri
   leverans till trottoarkanten är ett villkor som gäller MOT OSS, inte vårt mot
   kunden — och ett leveranssätt i brödtexten är ett avtalsvillkor, inte en
   produktegenskap. Stryks utan ersättning. Samma klass som "leverantören anger":
   sant i en annan mun, ett löfte i vår.

☠️ TVÅ SIDOR PUBLICERAR INGET SITTPLATSANTAL. `e71acc53` säger både "für 6
   Personen" och "für vier Personen" i SAMMA stycke; `4249df4d` säger ingenting
   alls om antal. Att välja en av två siffror som motsäger varandra vore att
   gissa åt kunden. Båda skriver skivans mått i stället och låter kunden räkna.
   De övriga fyra är entydiga: f806eebf sex, 29c688dc upp till sex, 74d3c11c
   fyra→sex, c71418ca sex→åtta.

☠️ MAXLASTEN ÄR PER BORD OCH FÅR ALDRIG ÄRVAS. 50 / 50 / 80 / 50 / 70 / 70 kg
   på sex bord i samma runda. Grinden i lint.py låser dem en och en.

☠️ FÖTTERNA SKRIVS BARA DÄR UNDERLAGET SÄGER DET. Fem av sex nämner justerbara
   eller halkfria fötter; `e71acc53` nämner INGENTING om fötterna. STEG4-5.md
   skrev först "alla sex" på en fot som syntes på ett SYSKONS närbild — det är
   precis den sortens ärvda påstående som runbokens färgtvillingregel förbjuder.
   Rättat här: e71acc53 säger inget om fötter.

☠️ ANVISNINGEN LIKASÅ. Fem har "1 x Handbuch/Anleitung/Bedienungsanleitung" i
   Lieferumfang. `4249df4d` har det INTE — den listar bara bordet och
   glasskivan. Den sidan skriver "montering krävs" utan att lova en anvisning.

☠️ `c71418ca`:s SPEC-RAD LOVAR ETT BORD SOM ALLTID ÄR 220 cm. Feedens kolumn
   säger "220L x 90B x 73H"; den tyska brödtexten säger "160/220L". Och
   måttritningen räddar inte raden — den visar bara det UTDRAGNA läget, alltså
   upprepar den felet i stället för att avgöra det. Sidan skriver 160/220.
   Jämför de två andra utdragbara, där ritningen visar BÅDA lägena och därför
   ÄR facit (80/160 respektive 81/162).

☠️ `4249df4d` HAR TVÅ VIKTER OCH TVÅ MATERIALLISTOR. 26 kg i brödtexten mot
   30 kg i spec-raden → vi publicerar 30, för en underskattad vikt är det
   dyrare felet för den som ska bära bordet. Material: spec-raden säger bara
   "Metall", brödtexten "Metall, Sicherheitsglas, Polyrattan" — och bilden
   visar alla tre. Vi skriver det bilden visar.

⚠️ STOLARNA INGÅR INTE, och ingen av de sex tyska texterna säger det medan
   varenda miljöbild visar bordet dukat med stolar. Varje sida säger det i
   klartext, både som egenskap och som fråga.

☠️ `4249df4d`:s HYLLA ÄR 85 × 60 cm, INTE 85 × 50. Den tyska texten säger
   "Maße der Ablageplatte: 85L x 50B cm"; måttritningen `4249df4d-3` säger
   85 och 60. Runbokens regel gäller: MÅTTRITNINGEN är facit när två mått
   motsäger varandra — och här väger den extra tungt, för ritningen ligger i
   galleriet. En text som sagt 50 hade motsagt en bild kunden kan läsa.

⚠️ TRÄUTSEENDE ÄR INTE TRÄ. `f806eebf` är WPC (trämjöl + plast) och `29c688dc`
   är plast med tryckt ådring. Ingendera får kallas trä — samma regel som MDF
   aldrig är "massivt trä" (#259).
"""

BAS = "https://www.fyndplats.se/produkt/"

PRODUKTER = ["e71acc53", "f806eebf", "4249df4d",
             "29c688dc", "74d3c11c", "c71418ca"]

# F = fast längd    U = utdragbart
GRUPP = {"e71acc53": "F", "f806eebf": "F", "4249df4d": "F",
         "29c688dc": "U", "74d3c11c": "U", "c71418ca": "U"}

# Maxlast i kg — per bord, aldrig ärvd
MAXLAST = {"e71acc53": 50, "f806eebf": 50, "4249df4d": 80,
           "29c688dc": 50, "74d3c11c": 70, "c71418ca": 70}

# Sittplatser: None = publiceras inte (motsägande eller obefintligt underlag)
SITTPLATSER = {"e71acc53": None, "f806eebf": "sex", "4249df4d": None,
               "29c688dc": "upp till sex", "74d3c11c": "fyra, sex utdraget",
               "c71418ca": "sex, åtta utdraget"}

# Bara där leverantörsunderlaget faktiskt säger något om fötterna
FOTTER = {"e71acc53": None, "f806eebf": "justerbara", "4249df4d": "halkfria",
          "29c688dc": "halkfria", "74d3c11c": "justerbara",
          "c71418ca": "justerbara"}

# Anvisning i Lieferumfang — 4249df4d listar ingen
ANVISNING = {"e71acc53": True, "f806eebf": True, "4249df4d": False,
             "29c688dc": True, "74d3c11c": True, "c71418ca": True}

SLUGG = {
    "e71acc53": "tradgardsbord-145-cm-lamellskiva-aluminium",
    "f806eebf": "tradgardsbord-140-cm-wpc-teakton",
    "4249df4d": "tradgardsbord-150-cm-glasskiva-med-hylla",
    "29c688dc": "utdragbart-tradgardsbord-160-cm-traimitation",
    "74d3c11c": "utdragbart-tradgardsbord-162-cm-lamellskiva",
    "c71418ca": "utdragbart-tradgardsbord-220-cm-fjarilsmekanism",
}

SOKORD = {
    "e71acc53": "trädgårdsbord aluminium 145 cm",
    "f806eebf": "trädgårdsbord wpc",
    "4249df4d": "trädgårdsbord glasskiva med hylla",
    "29c688dc": "utdragbart trädgårdsbord 160 cm",
    "74d3c11c": "utdragbart trädgårdsbord lamellskiva",
    "c71418ca": "utdragbart trädgårdsbord 220 cm",
}

# ☠️ Skrivs för hand. Husets SKU-regel kapar sluggen vid 24 tecken, och de tre
#    utdragbara sluggarna är identiska långt bortom det (#272).
SKU = {
    "e71acc53": "FP-tradgardsbord-145-lamell",
    "f806eebf": "FP-tradgardsbord-140-wpc",
    "4249df4d": "FP-tradgardsbord-150-glas",
    "29c688dc": "FP-tradgardsbord-160-utdrag",
    "74d3c11c": "FP-tradgardsbord-162-utdrag",
    "c71418ca": "FP-tradgardsbord-220-utdrag",
}

NAMN = {
    "e71acc53": "Trädgårdsbord 145 × 90 cm i aluminium – lamellskiva och pulverlackerad ram",
    "f806eebf": "Trädgårdsbord 140 × 80 cm i WPC – teakton på pulverlackerad metallram",
    "4249df4d": "Trädgårdsbord 150 × 85 cm i säkerhetsglas – hylla under skivan",
    "29c688dc": "Utdragbart trädgårdsbord 80/160 cm – skiva i träimitation på aluminium",
    "74d3c11c": "Utdragbart trädgårdsbord 81/162 cm i aluminium – lamellskiva",
    "c71418ca": "Utdragbart trädgårdsbord 160/220 cm i aluminium – fjärilsmekanism",
}

INGRESS = {
    "e71acc53": ("Ett trädgårdsbord i aluminium på 145 × 90 cm, med en skiva "
                 "byggd av lameller i stället för en hel yta. Springorna mellan "
                 "lamellerna släpper igenom regnvatten, så bordet inte blir "
                 "stående med en pöl mitt på efter en skur. Ramen är "
                 "pulverlackerad i mörkgrått och hela bordet väger 22 kg."),
    "f806eebf": ("Ett trädgårdsbord på 140 × 80 cm med skiva i WPC – "
                 "träkomposit som ser ut som teak men sköts som plast. Ytan är "
                 "slät och fläcktålig, så grillfett och rödvin torkas av i "
                 "stället för att sugas in. Ramen är pulverlackerad metall och "
                 "fötterna går att justera, vilket är det som håller bordet "
                 "stilla på en ojämn altan."),
    "4249df4d": ("Ett trädgårdsbord med skiva i säkerhetsglas och en hylla på "
                 "85 × 60 cm mitt under den. Hyllan tar det som annars ligger "
                 "på bordet – tidningen, brickan, tändaren till grillen – och "
                 "lämnar skivan fri att duka. Ram och hylla är klädda i "
                 "polyrotting i brunt, benen är pulverlackerad metall, och "
                 "skivan tål 80 kg."),
    "29c688dc": ("Ett utdragbart trädgårdsbord som går från 80 till 160 cm. "
                 "Hopskjutet är det ett litet fyrkantigt bord som får plats på "
                 "en balkong; utdraget tar det upp till sex personer. Skivan är "
                 "plast med tryckt träådring i beige, ramen aluminium, och "
                 "fötterna är halkfria så att bordet varken glider eller repar "
                 "underlaget."),
    "74d3c11c": ("Ett utdragbart trädgårdsbord i aluminium som går från 81 till "
                 "162 cm. Fyra personer i vardagslag, sex när det kommer "
                 "gäster. Skivan är byggd av lameller med springor emellan, så "
                 "regnvatten rinner igenom i stället för att bli stående, och "
                 "fötterna går att justera var för sig på ett ojämnt underlag."),
    "c71418ca": ("Ett stort utdragbart trädgårdsbord i aluminium som går från "
                 "160 till 220 cm. Iläggsskivan ligger vikt inne i bordet och "
                 "fälls ut med en fjärilsmekanism – du behöver alltså inte "
                 "hämta någon lös skiva ur förrådet. Sex personer i vardagslag, "
                 "åtta utdraget, och skivan tål 70 kg."),
}

_ENSAM = "Bordet levereras ensamt – stolarna på bilderna ingår inte"

EGENSKAPER = {
    "e71acc53": [
        "Skiva och ram i aluminium, pulverlackerat i mörkgrått",
        "Lamellskiva – regnvattnet rinner ner mellan lamellerna i stället för att bli stående",
        "Bordet mäter 145 × 90 × 74 cm och väger 22 kg",
        "Maxlast 50 kg på skivan",
        "Levereras omonterat med bruksanvisning",
        _ENSAM,
    ],
    "f806eebf": [
        "Skiva i WPC med teakton – slät, fläcktålig yta som torkas av",
        "Ram i pulverlackerad metall, rostskyddad för att stå ute",
        "Bordet mäter 140 × 80 × 75 cm och tar sex kuvert",
        "71 cm fri höjd mellan golvet och skivans undersida",
        "Justerbara fötter för ojämnt underlag",
        "Maxlast 50 kg på skivan",
        "Levereras omonterat med bruksanvisning",
        _ENSAM,
    ],
    "4249df4d": [
        "Skiva i säkerhetsglas, 145 × 80 cm och 5 mm tjock",
        "Hylla under skivan på 85 × 60 cm för det som inte ska ligga på bordet",
        "Ram och hylla klädda i polyrotting, ben i pulverlackerad metall",
        "Bordet mäter 150 × 85 × 74 cm och väger 30 kg",
        "Maxlast 80 kg på skivan",
        "Halkfria fötter",
        "Montering krävs",
        _ENSAM,
    ],
    "29c688dc": [
        "Dras ut från 80 till 160 cm – 80 cm djupt och 75 cm högt i båda lägena",
        "Upp till sex personer utdraget",
        "Skiva i plast med tryckt träådring, ram i aluminium",
        "Halkfria fötter som håller bordet stilla och skyddar underlaget",
        "Maxlast 50 kg på skivan",
        "Väger 24,3 kg",
        "Levereras omonterat med anvisning",
        _ENSAM,
    ],
    "74d3c11c": [
        "Dras ut från 81 till 162 cm – 80 cm djupt och 75 cm högt i båda lägena",
        "Fyra personer hopskjutet, sex utdraget",
        "Lamellskiva i aluminium – regnvattnet rinner ner mellan lamellerna",
        "Pulverlackerad aluminiumram, rostar inte",
        "Justerbara fötter för ojämnt underlag",
        "Maxlast 70 kg på skivan",
        "Väger 23,5 kg",
        "Levereras omonterat med bruksanvisning",
        _ENSAM,
    ],
    "c71418ca": [
        "Dras ut från 160 till 220 cm – 90 cm djupt och 73 cm högt i båda lägena",
        "Sex personer hopskjutet, åtta utdraget",
        "Fjärilsmekanism: iläggsskivan ligger vikt i bordet och fälls ut på plats",
        "Lamellskiva i aluminium, 2,5 cm tjock – torkar snabbt efter regn",
        "Pulverlackerad aluminiumram i grått",
        "Justerbara fötter för ojämnt underlag",
        "Maxlast 70 kg på skivan",
        "Väger 29 kg",
        "Levereras omonterat med bruksanvisning",
        _ENSAM,
    ],
}

SPEC = {
    "e71acc53": [
        ("Mått", "145 × 90 × 74 cm"),
        ("Skiva", "aluminiumlameller"),
        ("Ram", "pulverlackerad aluminium"),
        ("Färg", "mörkgrå"),
        ("Maxlast", "50 kg"),
        ("Vikt", "22 kg"),
        ("Paketmått", "152 × 38 × 15 cm"),
        ("Montering", "krävs, bruksanvisning ingår"),
    ],
    "f806eebf": [
        ("Mått", "140 × 80 × 75 cm"),
        ("Fri höjd under skivan", "71 cm"),
        ("Skiva", "WPC, träkomposit"),
        ("Ram", "pulverlackerad metall"),
        ("Färg", "teakton"),
        ("Sittplatser", "sex"),
        ("Fötter", "justerbara"),
        ("Maxlast", "50 kg"),
        ("Vikt", "23,5 kg"),
        ("Paketmått", "105 × 10 × 83 cm"),
        ("Montering", "krävs, bruksanvisning ingår"),
    ],
    "4249df4d": [
        ("Mått", "150 × 85 × 74 cm"),
        ("Glasskiva", "145 × 80 cm, 5 mm säkerhetsglas"),
        ("Hylla under skivan", "85 × 60 cm"),
        ("Ram", "pulverlackerad metall klädd i polyrotting"),
        ("Färg", "brun och svart"),
        ("Fötter", "halkfria"),
        ("Maxlast", "80 kg"),
        ("Vikt", "30 kg"),
        ("Paketmått", "154 × 16 × 88 cm"),
        ("Montering", "krävs"),
    ],
    "29c688dc": [
        ("Mått hopskjutet", "80 × 80 × 75 cm"),
        ("Mått utdraget", "160 × 80 × 75 cm"),
        ("Skiva", "plast med tryckt träådring"),
        ("Ram", "aluminium"),
        ("Färg", "beige och grå"),
        ("Sittplatser", "upp till sex utdraget"),
        ("Fötter", "halkfria"),
        ("Maxlast", "50 kg"),
        ("Vikt", "24,3 kg"),
        ("Paketmått", "94 × 18 × 93 cm"),
        ("Montering", "krävs, anvisning ingår"),
    ],
    "74d3c11c": [
        ("Mått hopskjutet", "81 × 80 × 75 cm"),
        ("Mått utdraget", "162 × 80 × 75 cm"),
        ("Skiva", "aluminiumlameller"),
        ("Ram", "pulverlackerad aluminium"),
        ("Färg", "grå"),
        ("Sittplatser", "fyra hopskjutet, sex utdraget"),
        ("Fötter", "justerbara"),
        ("Maxlast", "70 kg"),
        ("Vikt", "23,5 kg"),
        ("Paketmått", "95 × 17 × 95 cm"),
        ("Montering", "krävs, bruksanvisning ingår"),
    ],
    "c71418ca": [
        ("Mått hopskjutet", "160 × 90 × 73 cm"),
        ("Mått utdraget", "220 × 90 × 73 cm"),
        ("Skiva", "aluminiumlameller, 2,5 cm tjocklek"),
        ("Utdragning", "fjärilsmekanism med invikt iläggsskiva"),
        ("Ram", "pulverlackerad aluminium"),
        ("Färg", "grå"),
        ("Sittplatser", "sex hopskjutet, åtta utdraget"),
        ("Fötter", "justerbara"),
        ("Maxlast", "70 kg"),
        ("Vikt", "29 kg"),
        ("Paketmått", "172 × 15 × 97 cm"),
        ("Montering", "krävs, bruksanvisning ingår"),
    ],
}

RUBRIK2 = {
    "e71acc53": "Skivan, måtten och vad bordet tål",
    "f806eebf": "Skivan, höjden och fötterna",
    "4249df4d": "Glasskivan och hyllan under den",
    "29c688dc": "Så dras bordet ut",
    "74d3c11c": "Så dras bordet ut",
    "c71418ca": "Så fälls iläggsskivan ut",
}


# ------------------------------------------------------- brödtext, del två

_STYCKEN2 = {
    "e71acc53": [
        ("Skivan är 145 × 90 cm. Det är måttet som avgör hur många som får "
         "plats, och det beror lika mycket på stolarna som på bordet: räkna "
         "med runt 60 cm bordskant per kuvert på långsidorna och mät mot din "
         "egen sits. Vi anger ingen sittplatssiffra på den här modellen – "
         "underlaget säger emot sig självt, och ett mått du kan hålla ett "
         "måttband mot är mer värt än en siffra som inte går att lita på."),
        ("Lamellerna sitter med springor emellan. Regn rinner ner mellan dem i "
         "stället för att samlas i en pöl, och skivan torkar ur även "
         "underifrån. Baksidan av samma konstruktion är att småsaker kan "
         "glida ner i en springa, så en bricka eller en duk är bra att ha "
         "till kaffet."),
        ("Skivan tål 50 kg. Det räcker för dukning, mat och en tyngre bricka, "
         "men bordet är ingen arbetsbänk: sitt inte på det och ställ inte en "
         "tung stenkruka mitt på skivan. Aluminium rostar inte, så bordet kan "
         "stå ute året runt – men lätt är också lätt, och 22 kg flyttar sig "
         "lättare i blåst än ett bord i massivt trä. Ställ det i lä eller väg "
         "ner skivan när det stormar."),
    ],
    "f806eebf": [
        ("Skivan är 140 × 80 cm och tar sex kuvert, tre på var långsida. "
         "Höjden är 75 cm, och det är 71 cm ner till golvet under skivan – "
         "det är det måttet som avgör om en stol med armstöd går in under "
         "bordet eller stannar utanför. Mät stolen över armstödets överkant "
         "innan du bestämmer dig."),
        ("WPC är trämjöl blandat med plast. Ytan är sluten, alltså suger den "
         "inte åt sig vin, ketchup eller grillfett så som en obehandlad "
         "träskiva gör, och den ska varken oljas eller lasyras. Teaktonen är "
         "en tryckt ådring och inte massivt trä – det är materialets styrka "
         "och samtidigt det du ska veta om det."),
        ("De justerbara fötterna gör mest skillnad i praktiken. En altan eller "
         "en stenläggning är sällan i våg, och ett bord som vippar på tre av "
         "fyra ben blir irriterande på en minut. Skruva ut den fot som hänger "
         "tills bordet står stilla. Skivan tål 50 kg jämnt fördelat."),
    ],
    "4249df4d": [
        ("Glasskivan är 145 × 80 cm och 5 mm tjock, och bordet mäter 150 × 85 "
         "cm ytterst. Under skivan sitter en hylla på 85 × 60 cm. Den är inte "
         "stor nog för en andra dukning men precis lagom för det som brukar "
         "ligga och skräpa på ett uteplatsbord: tidningen, brickan, "
         "solglasögonen och tändaren till grillen."),
        ("Säkerhetsglas är härdat glas. Det tål mer än vanligt fönsterglas, "
         "och skulle det ändå gå sönder faller det i trubbiga korn i stället "
         "för i vassa skärvor. Skivan är genomskinlig, så hyllan under syns "
         "rakt igenom – vill du att bordet ska se rent ut lägger du det som "
         "ligger där i en korg."),
        ("Bordet tål 80 kg på skivan, mer än de flesta trädgårdsbord i den här "
         "storleken, och det märks i vikten: 30 kg står kvar i blåst men är "
         "också ett tvåmansjobb att bära. Fötterna är halkfria och skyddar "
         "underlaget. Vi anger inget sittplatsantal – underlaget säger "
         "ingenting om det, och skivans 145 × 80 cm är talet du mäter mot."),
    ],
    "29c688dc": [
        ("Bordet är 80 × 80 cm hopskjutet och 160 × 80 cm utdraget. Djupet och "
         "höjden ändras inte, bara längden, så bordet växer åt ett håll och du "
         "behöver planera utrymme bara i den riktningen."),
        ("Hopskjutet är det ett fyrkantigt bord för två till fyra, alltså ett "
         "mått som fungerar på en balkong eller i ett hörn av altanen. "
         "Utdraget tar det upp till sex. Det är hela poängen med ett "
         "utdragbart bord: du betalar plats bara de dagar du behöver den."),
        ("Skivan är plast med tryckt träådring. Den ska varken oljas eller "
         "lasyras och tar inte upp fläckar som en obehandlad träskiva gör, "
         "men den tål heller inte lika mycket punktbelastning: 50 kg jämnt "
         "fördelat är gränsen. Ramen är aluminium och rostar inte."),
    ],
    "74d3c11c": [
        ("Bordet mäter 81 × 80 cm hopskjutet och 162 × 80 cm utdraget. Djupet "
         "och höjden är desamma i båda lägena – det är bara längden som "
         "ändras, så bordet växer åt ett håll."),
        ("Fyra får plats hopskjutet och sex utdraget. 81 cm är ett mått som "
         "fungerar i ett hörn eller på en större balkong, och 162 cm är ett "
         "fullstort matbord. Bordet väger 23,5 kg, alltså lätt nog att bära "
         "ut och in en gång per säsong utan hjälp."),
        ("Skivan är byggd av aluminiumlameller med springor emellan. Regn "
         "rinner ner mellan dem i stället för att samlas i en pöl, och skivan "
         "torkar ur underifrån. Baksidan är att småsaker kan glida ner i en "
         "springa – en bricka eller en duk löser det till kaffet. Skivan tål "
         "70 kg jämnt fördelat."),
    ],
    "c71418ca": [
        ("Bordet är 160 × 90 cm hopskjutet och 220 × 90 cm utdraget. Redan i "
         "det korta läget är det ett fullstort matbord för sex; de sextio "
         "extra centimetrarna är till för de gånger ni blir åtta. Djupet 90 cm "
         "och höjden 73 cm är desamma i båda lägena."),
        ("Fjärilsmekanismen är skillnaden mot ett bord med lös iläggsskiva. "
         "Skivan ligger vikt på mitten inne i bordet: du drar isär halvorna, "
         "fäller upp den och viker ut den som en bok. Ingen lös skiva att "
         "förvara i förrådet, och ingenting som kan komma bort mellan två "
         "säsonger."),
        ("Skivan är 2,5 cm tjock och byggd av aluminiumlameller. Springorna "
         "gör att regn rinner igenom och att ytan torkar snabbt när solen "
         "kommer tillbaka. Bordet tål 70 kg jämnt fördelat och väger 29 kg – "
         "tungt nog att stå still i blåst, och ett tvåmansjobb att bära."),
    ],
}


def stycken2(pid):
    return _STYCKEN2[pid]


SKOTSEL = {
    "e71acc53": [
        ("Torka av skivan med en fuktig trasa och lite diskmedel. Aluminium "
         "tål vatten och behöver varken olja eller lasyr – det är hela "
         "poängen med materialet."),
        ("Springorna mellan lamellerna är det enda som samlar smuts. Dra "
         "igenom dem med en borste eller spola av bordet någon gång per "
         "säsong, så torkar de ur av sig själva."),
        ("Bordet levereras omonterat med bruksanvisning. Dra åt skruvarna igen "
         "efter första säsongen – ett bord som står ute rör sig med "
         "temperaturen, och ett glapp börjar alltid som en lös skruv."),
    ],
    "f806eebf": [
        ("Torka av skivan med fuktig trasa och diskmedel. WPC ska varken oljas "
         "eller lackas, och en slipsvamp gör mer skada än nytta på den tryckta "
         "ytan."),
        ("Ramen är pulverlackerad. Får den ett djupt jack ner till metallen är "
         "det där rosten börjar – bättra med en droppe lackstift i stället för "
         "att låta det stå."),
        ("Bordet levereras omonterat med bruksanvisning. Dra åt skruvarna en "
         "gång per säsong och kontrollera att fötterna fortfarande står som du "
         "ställde dem."),
    ],
    "4249df4d": [
        ("Glaset torkas av med fönsterputs eller vatten och lite diskmedel. En "
         "mikrofiberduk räcker för att få bort pollen och damm utan att lämna "
         "ränder."),
        ("Polyrotting sköts med en mjuk borste och ljummet vatten. Låt den "
         "lufttorka efteråt, och undvik högtryckstvätt – strålen lossar "
         "flätningen där den är hårdast spänd."),
        ("Bordet monteras hemma. Lägg glasskivan på plats sist, när ramen står "
         "stadigt, och lyft den tillsammans med någon – 5 mm glas i det formatet är "
         "otympligt även när det inte är tungt."),
    ],
    "29c688dc": [
        ("Torka av skivan med en fuktig trasa och diskmedel. Plastytan behöver "
         "ingen behandling alls: ingen olja, ingen lasyr, ingen slipning."),
        ("Håll skenorna som skivhalvorna glider på rena. Sand och grus i "
         "skenan är det enda som får ett utdragbart bord att kärva, och de "
         "borstas bort på några sekunder innan du skjuter ihop bordet."),
        ("Bordet levereras omonterat med anvisning. Kontrollera skruvarna i "
         "ramen en gång per säsong – ett bord som dras ut och skjuts ihop rör "
         "sig mer än ett med fast längd."),
    ],
    "74d3c11c": [
        ("Torka av lamellerna med fuktig trasa och lite diskmedel. Aluminium "
         "behöver varken olja eller lasyr."),
        ("Håll skenorna som skivhalvorna glider på rena. Sand och löv i skenan "
         "är det enda som får bordet att kärva när det ska dras isär, och en "
         "pensel räcker för att få bort dem."),
        ("Bordet levereras omonterat med bruksanvisning. Dra åt skruvarna en "
         "gång per säsong och kontrollera att fötterna står som du ställde "
         "dem."),
    ],
    "c71418ca": [
        ("Torka av lamellerna med fuktig trasa och lite diskmedel. Aluminium "
         "behöver varken olja eller lasyr."),
        ("Håll skarven och mekanismen på mitten rena. Sand och löv i skenan är "
         "det enda som får bordet att kärva när det ska dras isär, och en "
         "pensel räcker för att få bort dem."),
        ("Bordet levereras omonterat med bruksanvisning. Prova att fälla ut "
         "och in iläggsskivan direkt efter monteringen – då märker du på en "
         "gång om något sitter snett."),
    ],
}


_FAQ = {
    "e71acc53": [
        ("Hur många får plats runt bordet?",
         "Skivan är 145 × 90 cm, och vi anger ingen sittplatssiffra: "
         "underlaget säger emot sig självt på den här modellen. Räkna med "
         "runt 60 cm bordskant per kuvert och mät mot dina egna stolar."),
        ("Kan bordet stå ute hela året?",
         "Materialet tål det – aluminium rostar inte och skivan släpper "
         "igenom regn. Ett lätt bord flyttar sig däremot lättare i blåst än "
         "ett tungt, så ställ det i lä eller väg ner skivan när det blåser "
         "hårt."),
        ("Hur mycket tål skivan?",
         "50 kg jämnt fördelat. Det räcker till dukning och mat, men bordet "
         "är inte gjort att sitta eller stå på."),
        ("Ingår stolarna?",
         "Nej. Bordet levereras ensamt; stolarna på bilderna är med för att "
         "visa skalan."),
        ("Kommer bordet monterat?",
         "Nej, det monteras hemma. Bruksanvisning ingår."),
    ],
    "f806eebf": [
        ("Hur många får plats?",
         "Sex, tre på var långsida av en skiva som är 140 × 80 cm."),
        ("Går en stol med armstöd in under bordet?",
         "Det är 71 cm fritt mellan golvet och skivans undersida. Mät stolen "
         "över armstödets överkant och jämför – de flesta trädgårdsstolar med "
         "armstöd ligger under det måttet, men inte alla."),
        ("Är skivan i trä?",
         "Nej. Den är WPC, alltså träkomposit: trämjöl blandat med plast, med "
         "en tryckt ådring i teakton. Den ska inte oljas."),
        ("Hur mycket tål skivan?",
         "50 kg jämnt fördelat."),
        ("Ingår stolarna?",
         "Nej, bordet levereras ensamt."),
        ("Kommer bordet monterat?",
         "Nej, det monteras hemma. Bruksanvisning ingår."),
    ],
    "4249df4d": [
        ("Hur stor är hyllan under skivan?",
         "85 × 60 cm. Den sitter mitt under glasskivan och är tänkt för "
         "tidningar, brickor och småsaker – inte för en andra dukning."),
        ("Är glaset härdat?",
         "Ja, skivan är säkerhetsglas och 5 mm tjock. Går den mot förmodan "
         "sönder faller den i trubbiga korn i stället för i vassa skärvor."),
        ("Hur många får plats runt bordet?",
         "Vi anger ingen sittplatssiffra: underlaget säger ingenting om det. "
         "Glasskivan är 145 × 80 cm, så räkna med runt 60 cm bordskant per "
         "kuvert och mät mot dina egna stolar."),
        ("Hur mycket tål bordet?",
         "80 kg på skivan, jämnt fördelat."),
        ("Ingår stolarna?",
         "Nej, bordet levereras ensamt."),
        ("Kommer bordet monterat?",
         "Nej. Det monteras hemma, och glasskivan läggs på plats sist."),
    ],
    "29c688dc": [
        ("Hur mycket längre blir bordet utdraget?",
         "80 cm. Det går från 80 × 80 cm till 160 × 80 cm; djupet och höjden "
         "är desamma i båda lägena."),
        ("Hur många får plats?",
         "Upp till sex utdraget. Hopskjutet är det ett fyrkantigt bord för två "
         "till fyra."),
        ("Är skivan i trä?",
         "Nej. Den är plast med tryckt träådring och ska varken oljas eller "
         "lasyras."),
        ("Hur mycket tål skivan?",
         "50 kg jämnt fördelat."),
        ("Ingår stolarna?",
         "Nej, bordet levereras ensamt."),
        ("Kommer bordet monterat?",
         "Nej, det monteras hemma. Anvisning ingår."),
    ],
    "74d3c11c": [
        ("Hur mycket längre blir bordet utdraget?",
         "81 cm. Det går från 81 × 80 cm till 162 × 80 cm; djupet och höjden "
         "är desamma i båda lägena."),
        ("Hur många får plats?",
         "Fyra hopskjutet och sex utdraget."),
        ("Rostar bordet?",
         "Nej. Både ram och skiva är aluminium, som inte rostar, och ramen är "
         "dessutom pulverlackerad."),
        ("Hur mycket tål skivan?",
         "70 kg jämnt fördelat."),
        ("Ingår stolarna?",
         "Nej, bordet levereras ensamt."),
        ("Kommer bordet monterat?",
         "Nej, det monteras hemma. Bruksanvisning ingår."),
    ],
    "c71418ca": [
        ("Hur mycket längre blir bordet utdraget?",
         "60 cm. Det går från 160 × 90 cm till 220 × 90 cm; djupet och höjden "
         "är desamma i båda lägena."),
        ("Var förvaras iläggsskivan?",
         "Inne i bordet. Den ligger vikt på mitten och fälls ut med en "
         "fjärilsmekanism, så det finns ingen lös skiva att lägga undan."),
        ("Hur många får plats?",
         "Sex hopskjutet och åtta utdraget."),
        ("Hur mycket tål skivan?",
         "70 kg jämnt fördelat."),
        ("Ingår stolarna?",
         "Nej, bordet levereras ensamt."),
        ("Kommer bordet monterat?",
         "Nej, det monteras hemma. Bruksanvisning ingår."),
    ],
}


def faq(pid):
    return _FAQ[pid]


# ------------------------------------------------------------------- bygget

def bygg(pid):
    d = ["<p>%s</p>" % INGRESS[pid]]
    d.append("<p><strong>Egenskaper</strong></p><ul>")
    d += ["<li>%s</li>" % e for e in EGENSKAPER[pid]]
    d.append("</ul>")
    d.append("<h2>Tekniska specifikationer</h2><ul>")
    d += ["<li><strong>%s:</strong> %s</li>" % (k, v) for k, v in SPEC[pid]]
    d.append("</ul>")
    d.append("<h2>%s</h2>" % RUBRIK2[pid])
    d += ["<p>%s</p>" % s for s in stycken2(pid)]
    d.append("<h2>Användning och skötsel</h2>")
    d += ["<p>%s</p>" % s for s in SKOTSEL[pid]]
    d.append("<h2>Vanliga frågor</h2>")
    for f, s in faq(pid):
        d.append("<p><strong>%s</strong></p><p>%s</p>" % (f, s))
    d.append("<h2>Fler bord för uteplatsen</h2><ul>")
    for annan in SYSKON[pid]:
        d.append('<li><a href="%s%s">%s</a></li>' % (BAS, annan[0], annan[1]))
    d.append("</ul>")
    return "".join(d)


def namn(pid):
    return NAMN[pid]


SEO_TITEL = {
    "e71acc53": "Trädgårdsbord 145 × 90 cm i aluminium med lamellskiva",
    "f806eebf": "Trädgårdsbord 140 cm i WPC – teakton på metallram",
    "4249df4d": "Trädgårdsbord 150 cm i säkerhetsglas med hylla",
    "29c688dc": "Utdragbart trädgårdsbord 80/160 cm i träimitation",
    "74d3c11c": "Utdragbart trädgårdsbord 81/162 cm i aluminium",
    "c71418ca": "Utdragbart trädgårdsbord 160/220 cm i aluminium",
}

SEO_BESKRIVNING = {
    "e71acc53": ("Trädgårdsbord 145 × 90 × 74 cm i aluminium med lamellskiva "
                 "som släpper igenom regn. Pulverlackerad mörkgrå ram, maxlast "
                 "50 kg, vikt 22 kg."),
    "f806eebf": ("Trädgårdsbord 140 × 80 × 75 cm med WPC-skiva i teakton på "
                 "pulverlackerad metallram. Sex kuvert, 71 cm fri höjd, "
                 "justerbara fötter, 50 kg."),
    "4249df4d": ("Trädgårdsbord 150 × 85 × 74 cm med skiva i säkerhetsglas och "
                 "hylla på 85 × 60 cm under. Ram i polyrotting, maxlast 80 kg, "
                 "vikt 30 kg."),
    "29c688dc": ("Utdragbart trädgårdsbord som går från 80 till 160 cm på 80 cm "
                 "djup. Skiva i plast med träådring, aluminiumram, halkfria "
                 "fötter, 50 kg."),
    "74d3c11c": ("Utdragbart trädgårdsbord i aluminium, 81 till 162 cm på 80 cm "
                 "djup. Lamellskiva som dränerar regn, justerbara fötter, "
                 "maxlast 70 kg."),
    "c71418ca": ("Utdragbart trädgårdsbord 160 till 220 cm på 90 cm djup. "
                 "Fjärilsmekanism med invikt iläggsskiva, lamellskiva 2,5 cm, "
                 "maxlast 70 kg."),
}

# ---------------------------------------------------------------- syskonen
# ☠️ Korslänkarna byggs MEKANISKT ur SLUGG + KORTNAMN, aldrig för hand.
#    Runda 97 mätte att transkriptionshashen är BLIND för länkar: en href
#    som pekar fel ger identisk hash före och efter.

KORTNAMN = {
    "e71acc53": "Trädgårdsbord 145 × 90 cm, lamellskiva i aluminium",
    "f806eebf": "Trädgårdsbord 140 × 80 cm i WPC med teakton",
    "4249df4d": "Trädgårdsbord 150 × 85 cm i säkerhetsglas med hylla",
    "29c688dc": "Utdragbart trädgårdsbord 80/160 cm i träimitation",
    "74d3c11c": "Utdragbart trädgårdsbord 81/162 cm med lamellskiva",
    "c71418ca": "Utdragbart trädgårdsbord 160/220 cm med fjärilsmekanism",
}

# Publicerade bord i samma kategorilöv. ☠️ `tradgardsbord-aluminium-utomhus-8-personer`
# står som OUT_OF_STOCK och länkas därför inte — en korslänk till en sida kunden
# inte kan köpa är en återvändsgränd.
_PUB_FAST = [
    ("tradgardsbord-komposit-140-cm", "Trädgårdsbord 140 × 90 cm med kompositskiva"),
    ("tradgardsbord-aluminium", "Trädgårdsbord 150 × 90 cm i aluminium med glasskiva"),
    ("tradgardsbord-glas-parasollhal", "Runt trädgårdsbord Ø80 cm i glas med parasollhål"),
]
_PUB_UTDRAG = [
    ("utdragbart-tradgardsbord-80-160-cm", "Utdragbart trädgårdsbord 80–160 cm med glasskiva"),
    ("utdragbart-tradgardsbord-240-cm", "Utdragbart trädgårdsbord 180–240 cm i aluminium"),
    ("tradgardsbord-komposit-140-cm", "Trädgårdsbord 140 × 90 cm med kompositskiva"),
]

PUBLICERADE = {pid: (_PUB_FAST if GRUPP[pid] == "F" else _PUB_UTDRAG)
               for pid in PRODUKTER}

SYSKON = {
    pid: [(SLUGG[a], KORTNAMN[a]) for a in PRODUKTER if a != pid]
         + PUBLICERADE[pid]
    for pid in PRODUKTER
}


def beskrivning(pid):
    return bygg(pid)


def seo_titel(pid):
    return SEO_TITEL[pid]


def seo_beskrivning(pid):
    return SEO_BESKRIVNING[pid]
