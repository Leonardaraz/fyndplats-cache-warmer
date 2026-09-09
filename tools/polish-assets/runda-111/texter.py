# -*- coding: utf-8 -*-
"""Runda 111 — sju rumsavdelare i SEX konstruktioner.

☠️ DET FINNS INGET DELAT BRÖDTEXTBLOCK I DEN HÄR RUNDAN, och det är ett
   beslut, inte slarv. Runda 110:s dyraste redaktionella fel var ett DELAT
   FAQ-svar som var sant på fyra sidor av sex ("Träet är obehandlat" på en
   helbambuprodukt). Här hade ett delat block varit fel på fem av sju: fyra
   viker sig, två står på fötter och rullar; fem levereras färdiga, två
   monteras; en har hyllor och en har tolv hjul.

   Det som ÄR gemensamt — att en fristående skärm skymmer insyn utan att vara
   en barriär — står i EN funktion som varje sida anropar med sina egna tal.

☠️ TRE LÖFTEN SOM ALDRIG FÅR SKRIVAS, ärvda från runda 108/110:
   barriär · mörkläggning · utomhus. Rundan lägger till två egna:
   · ☠️ VÄDER. `79b349f7`:s tyska ingress kallar den "wetterfester Outdoor
     Paravent" medan dess EGEN spectabell säger ordagrant "Nur für den
     Innenbereich geeignet". Marknadsföringen och specen säger emot varandra
     i samma text; specen gäller.
   · ☠️ BROMS. Tolv hjul syns på bilden. Att de skulle gå att LÅSA står
     ingenstans och syns inte i zoomen — alltså skrivs det inte.
   Och rundan ärver LJUDLÖFTET: `99040238`:s tyska text lovar att skärmen
   "reduziert störendes Licht und Lärm". En tygskärm dämpar inte buller.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import matt                                                   # noqa: E402

BAS = "https://www.fyndplats.se/produkt/"

L = lambda slug, text: f'<a href="{BAS}{slug}">{text}</a>'
P = lambda t: f"<p>{t}</p>"
H = lambda t: f"<h2>{t}</h2>"
LI = lambda t: f"<li>{t}</li>"
UL = lambda rader: "<ul>" + "".join(LI(f"<strong>{a}:</strong> {b}") for a, b in rader) + "</ul>"
F = lambda q, s: f"<p><strong>{q}</strong></p><p>{s}</p>"

ORD = {3: "tre", 4: "fyra", 5: "fem"}


def tal(x):
    """Svenskt decimalkomma. 1.7 → '1,7', 40.0 → '40'."""
    if float(x) == int(x):
        return str(int(x))
    return ("%.1f" % x).replace(".", ",")


def matt_str(nyckel):
    v = matt.RUNDAN[nyckel]
    return f"{v[2]} × {tal(v[3])} × {v[4]} cm"


def foga(delar):
    if len(delar) <= 1:
        return "".join(delar)
    return ", ".join(delar[:-1]) + " och " + delar[-1]


# ── Identitet ────────────────────────────────────────────────────────────────
# ☠️ SLUGGEN FÅR INTE HETA EFTER BREDD + FÄRG I DEN HÄR RUNDAN. Familjen har
#    FEM publicerade eller planerade sidor på exakt 160 × 170 cm — runda 109:s
#    polypropenväv i vitt och brunt, runda 110:s helbambu, och rundans två
#    tallram-med-tyg. Bredden räcker alltså inte som särskiljare, och färgen
#    inte heller: tre av dem är "natur". MATERIALET är det som skiljer.
SLUG = {
    "e858810e": "rumsavdelare-160-furu-tyg",
    "f641d190": "rumsavdelare-120-furu-tyg",
    # ☠️ MATERIALORDET FÖRE BREDDEN PÅ DE HÄR TVÅ, och det är SKU:n som
    #    kräver det. SKU:n byggs ur sluggen och kapas vid 24 tecken på
    #    ordgräns, så `rumsavdelare-160-palmblad` (25) kapas till
    #    `FP-rumsavdelare-160` — exakt det ord som skiljer sidan från
    #    katalogens fyra andra 160-centimeters rumsavdelare försvinner.
    #    Uppmätt i katalogen: `FP-rumsavdelare-160-bambu`, `-160-brun` och
    #    `-160-vit` finns redan. Ett bart `FP-rumsavdelare-160` krockar inte
    #    idag men identifierar ingenting, och nästa 160-produkt med en lång
    #    slug får samma SKU. Omkastningen räddar ordet:
    #    `rumsavdelare-palmblad-160` → `FP-rumsavdelare-palmblad`.
    "1c1eb875": "rumsavdelare-palmblad-160",
    "23d20823": "rumsavdelare-pappersrep-120",
    "db70e38c": "rumsavdelare-med-hyllor",
    "79b349f7": "rumsavdelare-pa-hjul-252",
    "99040238": "rumsavdelare-253-svart",
}

NAMN = {
    "e858810e": "Rumsavdelare 160 × 170 cm – 4 paneler med fururam och vit tygfyllning",
    "f641d190": "Rumsavdelare 120 × 170 cm – 3 paneler med fururam och vit tygfyllning",
    "1c1eb875": "Rumsavdelare 160 × 170 cm – 4 paneler med grönt palmbladsmönster",
    "23d20823": "Rumsavdelare 120 × 170 cm – 3 bågformade paneler i flätat pappersrep",
    "db70e38c": "Rumsavdelare 181 × 180 cm – 4 vita paneler med två hyllplan",
    "79b349f7": "Rumsavdelare på hjul 252 × 170 cm – 5 paneler i mörkgrå polyester",
    "99040238": "Rumsavdelare 253 × 182 cm – 3 paneler i svart polyester",
}

# ☠️ TITELN FÅR ALDRIG VARA IDENTISK MED NAMNET. Är de lika behandlar
#    storefronten titeln som osatt och renderar mallen `{name} | Fyndplats` —
#    alltså namnet plus tolv tecken, och en titel du räknat till 52 blir 64
#    live. Runbookens mätning på sju granar 2026-08-30.
TITEL = {
    "e858810e": "Rumsavdelare 160 cm i furu med vit tygfyllning",
    "f641d190": "Rumsavdelare 120 cm i furu med vit tygfyllning",
    "1c1eb875": "Rumsavdelare 160 cm med palmbladsmönster",
    "23d20823": "Rumsavdelare 120 cm i flätat pappersrep",
    "db70e38c": "Rumsavdelare med två hyllplan, 181 cm bred",
    "79b349f7": "Rumsavdelare på hjul, 252 cm bred – 5 paneler",
    "99040238": "Rumsavdelare 253 cm i svart polyester",
}

# Materialfras för löptext och meta. Kortare och mer läsbar än spec-raden.
PROSA = {
    "e858810e": "furu med vit tygfyllning",
    "f641d190": "furu med vit tygfyllning",
    "1c1eb875": "furu med grönt palmbladsmönster",
    "23d20823": "handflätat pappersrep på fururam",
    "db70e38c": "vit flätad pappersfiber på ram av furu och bambu",
    "79b349f7": "mörkgrå polyester på stålstomme",
    "99040238": "svart polyester på metallstomme",
}

# ☠️ SYSKONLÄNKARNA ÄR HANDSKRIVNA, för rundan har ingen grupperingsregel som
#    ger dem. Grinden kräver därför att varje slug antingen tillhör rundan
#    själv eller står i PUBLICERADE — en lista som lästes ur katalogsvepet,
#    inte ur minnet. En trasig länk på en publicerad sida är en 404 vi själva
#    skrivit.
PUBLICERADE = {
    "rumsavdelare-vikbar-6-paneler": "vår vikskärm i vitt pappersrep med sex paneler",
}
SYSKON = {
    "e858810e": [("f641d190", "samma skärm med tre paneler, 120 cm"),
                 ("1c1eb875", "samma format med palmbladsmönster")],
    "f641d190": [("e858810e", "samma skärm med fyra paneler, 160 cm")],
    "1c1eb875": [("e858810e", "samma format utan mönster, i vitt")],
    "23d20823": [("f641d190", "samma bredd med fururam och vit tygfyllning")],
    "db70e38c": [("rumsavdelare-vikbar-6-paneler",
                  "vår vikskärm i vitt pappersrep med sex paneler")],
    "79b349f7": [("99040238", "samma slags tygskärm med tre paneler, utan hjul")],
    "99040238": [("79b349f7", "samma slags tygskärm med fem paneler, på hjul")],
}


def lankrad(nyckel):
    delar = []
    for mal, etikett in SYSKON[nyckel]:
        slug = SLUG.get(mal, mal)
        delar.append(L(slug, etikett))
    return P("Finns också som " + foga(delar) + ".")


# ── Det enda som verkligen är gemensamt ──────────────────────────────────────
def avskarmning():
    """☠️ EN AVSKÄRMNING, INTE EN BARRIÄR — den enda meningen alla sju delar,
    och den enda de FÅR dela. Formuleringen är runda 108:s och har passerat
    barriärgrinden på fjorton publicerade sidor."""
    return P("Den är en avskärmning, inte en barriär: den skymmer insyn och "
             "delar av en yta, men den ska inte användas för att stänga inne "
             "barn eller djur.")


# ── D1 · shoji-stil: fururam med vit tygfyllning ─────────────────────────────
# ☠️ TYGET SAKNAS I DET SVENSKA SPEC-BLOCKET. Importen skrev `Material:
#    Kiefernholz` medan den tyska brödtexten säger "Rahmen aus Kiefernholz und
#    Stoff". Zoomen avgör: bakom trägallret sitter ett vitt, halvgenomskinligt
#    tygark. Exakt samma lucka som runda 110 mätte på grupp A, där väven var
#    POLYPROPEN och blocket bara sa trä. Spec-blocket är alltså inte facit —
#    det är en av tre källor, och den minst kompletta.
D1_MATERIAL = (
    H("Trägaller med tyg bakom")
    + P("Varje panel är en ram av furu med ett rutmönstrat galler av smala "
        "trälister, och bakom gallret sitter ett vitt tygark. Tyget är "
        "halvgenomskinligt: det bryter blicken men släpper igenom dagsljus, så "
        "att den avskärmade sidan inte blir mörk. Träet är ljust och obehandlat "
        "och får med tiden en varmare ton.")
)
D1_SKOTSEL = (
    H("Användning och skötsel")
    + P("Torka trälisterna med en torr eller lätt fuktad trasa. Tyget dammsuger "
        "du på lägsta effekt med möbelmunstycke — gnugga inte, och blöt inte "
        "ner det. Skärmen är gjord för torra inomhusmiljöer; fukt får både "
        "furun och tyget att svälla. Fäll ihop den och ställ den på högkant när "
        "den inte används.")
)

# ── D2 · fururam med tryckt fiberduk ─────────────────────────────────────────
D2_MATERIAL = (
    H("Palmblad tryckta på fiberduk")
    + P("Panelerna har samma fururam och samma rutgaller som våra enfärgade "
        "skärmar, men fyllningen är en fiberduk med tryckta palm- och "
        "monsterablad i två gröna toner mot vitt. Trycket sitter på duken, inte "
        "på träet, och mönstret är detsamma på båda sidor av varje panel. Duken "
        "släpper igenom ljus, så bladen lyser upp i motljus.")
)
D2_SKOTSEL = (
    H("Användning och skötsel")
    + P("Damma trälisterna torrt. Duken tål en lätt avtorkning med torr trasa — "
        "skura inte och använd inga lösningsmedel, trycket sitter i ytan. Håll "
        "skärmen borta från fukt och direkt solljus dygnet runt, så håller de "
        "gröna tonerna längre. Hopfälld står den smalt bakom en dörr.")
)

# ── E1 · handflätat pappersrep, bågformad topp ───────────────────────────────
E1_MATERIAL = (
    H("Handflätat pappersrep med bågformad topp")
    + P("Panelerna är flätade för hand av pappersrep runt en ram av furu, och "
        "varje panel slutar i en mjuk båge upptill i stället för en rak kant. "
        "Flätningen är gles nog att dagsljus silar igenom i ett rutmönster mot "
        "golvet, och tät nog att bryta blicken. Färgen är naturbeige rakt av, "
        "utan betsning. Skärmen står på egna ben.")
)
E1_SKOTSEL = (
    H("Användning och skötsel")
    + P("Damma med torr trasa eller dammsug flätningen på lägsta effekt. "
        "Pappersrep tål inte väta — torka aldrig av den med en blöt trasa och "
        "ställ den inte i badrum eller tvättstuga. Bär den i ramen, inte i "
        "flätningen. Med 4,3 kg är den rundans lättaste skärm och går att "
        "flytta med en hand.")
)

# ── E2 · flätad pappersfiber med två hyllplan ────────────────────────────────
# ☠️ HYLLASTEN ÄR EN SÄKERHETSUPPGIFT, inte en detalj. Leverantören anger
#    5 kg per hylla, och den siffran ska stå BÅDE i brödtexten och i
#    spec-tabellen. En hylla på en fristående vikskärm är dessutom en
#    tippningsrisk om den lastas ojämnt — därför står "fördela vikten".
E2_MATERIAL = (
    H("Flätade band med två hyllplan")
    + P("Panelerna är flätade av breda, strågula pappersfiberband över "
        "vågräta spjälor i furu och bambu, i en väv som ger skärmen ett "
        "mönster av små rutor. Två hyllplan löper vågrätt över panelerna, "
        "170 cm breda och 20 cm djupa. Hyllplanen är delade vid gångjärnen och "
        "följer skärmens vinkling, så de sitter kvar oavsett hur du ställer "
        "den.")
    + P("Varje hylla tar högst 5 kg. Det räcker för ljusstakar, små krukor, "
        "en klocka eller några böcker — fördela vikten över hela hyllan och "
        "lasta inte ena änden tung.")
)
E2_SKOTSEL = (
    H("Användning och skötsel")
    + P("Damma banden och hyllplanen med torr trasa. Flätad pappersfiber tål "
        "inte fukt, så håll skärmen i torra rum och torka aldrig av den blöt. "
        "Töm hyllplanen innan du fäller ihop skärmen eller flyttar den. Fötterna "
        "är 5,5 cm höga och lyfter panelerna från golvet.")
)

# ── F1 · polyester på stålstomme, 12 hjul ────────────────────────────────────
# ☠️ VÄDERPÅSTÅENDET ÄR STRUKET MED FLIT. Leverantörens ingress kallar den
#    "wetterfester Outdoor Paravent"; dess egen spectabell säger "Nur für den
#    Innenbereich geeignet. Nicht für den Außenbereich bei windigen,
#    regnerischen oder verschneiten Bedingungen". Två påståenden i samma text,
#    och det är specen som gäller. Duken är angiven som stänkskyddad — det är
#    en egenskap hos tyget, inte ett löfte om att skärmen tål väder.
F1_MATERIAL = (
    H("Duk på stålstomme, fem paneler")
    + P("Fem paneler i mörkgrå polyester spänns mellan sex stolpar av stål. "
        "Duken väger 160 g/m² och är tät — du ser inte igenom den. Panelerna "
        "sitter fast med clips, så du kan ta bort en panel för att korta "
        "skärmen eller sätta tillbaka den när du vill ha hela bredden.")
    + P("Skärmen är gjord för inomhusbruk. Leverantören anger uttryckligen att "
        "den inte ska stå ute i blåst, regn eller snö.")
)
F1_SKOTSEL = (
    H("Användning och skötsel")
    + P("Torka duken med en fuktig trasa och låt den lufttorka innan du fäller "
        "ihop skärmen. Stolparna torkas torrt. Skärmen rullar lätt på sina tolv "
        "hjul — ställ den där den får stå i fred, och skjut den i en stolpe och "
        "inte i duken när du flyttar den. Den levereras i delar och skruvas ihop "
        "efter medföljande anvisning.")
)

# ── F2 · polyester på pulverlackerad metallstomme ────────────────────────────
# ☠️ LJUDPÅSTÅENDET ÄR STRUKET. Leverantörens tyska ingress säger att skärmen
#    "reduziert störendes Licht und Lärm". En tygduk på metallstolpar dämpar
#    inget buller som en kund märker, och löftet är exakt den sort huset har en
#    grind mot sedan runda 110.
F2_MATERIAL = (
    H("Tät svart duk på metallstomme")
    + P("Tre paneler i svart polyester sitter på en stomme av pulverlackerad "
        "metall. Duken är tätt vävd och svart rakt igenom, så du ser inte "
        "igenom skärmen ens i motljus. Gångjärnen går åt båda hållen, vilket "
        "gör att panelerna kan vinklas fram och tillbaka och skärmen ställas i "
        "en sicksack eller en böj.")
)
F2_SKOTSEL = (
    H("Användning och skötsel")
    + P("Torka duken med fuktig trasa och stommen torrt. Låt duken torka innan "
        "skärmen ställs undan. Med 6,8 kg är den lätt att flytta trots bredden "
        "— lyft i stolparna. Den levereras i delar och skruvas ihop efter "
        "medföljande anvisning.")
)

MATERIALBLOCK = {"e858810e": D1_MATERIAL, "f641d190": D1_MATERIAL,
                 "1c1eb875": D2_MATERIAL, "23d20823": E1_MATERIAL,
                 "db70e38c": E2_MATERIAL, "79b349f7": F1_MATERIAL,
                 "99040238": F2_MATERIAL}
SKOTSEL = {"e858810e": D1_SKOTSEL, "f641d190": D1_SKOTSEL,
           "1c1eb875": D2_SKOTSEL, "23d20823": E1_SKOTSEL,
           "db70e38c": E2_SKOTSEL, "79b349f7": F1_SKOTSEL,
           "99040238": F2_SKOTSEL}

# Hur den står upp — och det är TVÅ olika svar i rundan.
VIKANDE = {"e858810e", "f641d190", "1c1eb875", "23d20823", "db70e38c"}


def stadigt(nyckel):
    if nyckel in VIKANDE:
        return (H("Den står genom att vinklas")
                + P("En vikskärm bär sig själv på formen, inte på tyngden. "
                    "Vecklas panelerna ut i en mjuk sicksack står den stadigt på "
                    "egen hand; dras de ut spikrakt har den ingenting att stödja "
                    "sig mot. Det finns ingen väggförankring, och därför hör den "
                    "hemma där den får stå ifred — utmed en vägg, runt ett hörn "
                    "av rummet, bakom en soffa."))
    return (H("Den står på egna fötter")
            + P("Varje stolpe har en egen bågformad fot, så skärmen står rakt "
                "upp utan att behöva vinklas mot något. Fötterna sticker ut åt "
                "sidan och tar plats på golvet — räkna med det djupet när du "
                "väljer var den ska stå."))


# ── FAQ ──────────────────────────────────────────────────────────────────────
FAQ_MATERIAL = {
    "e858810e": ("Vad är panelerna gjorda av?",
                 "Ramen och gallret är furu, och bakom gallret sitter ett vitt "
                 "tygark. Träet är obehandlat."),
    "f641d190": ("Vad är panelerna gjorda av?",
                 "Ramen och gallret är furu, och bakom gallret sitter ett vitt "
                 "tygark. Träet är obehandlat."),
    "1c1eb875": ("Vad är panelerna gjorda av?",
                 "Ramen och gallret är furu. Fyllningen är en fiberduk med "
                 "tryckta palmblad — trycket sitter på duken, inte på träet."),
    "23d20823": ("Vad är panelerna gjorda av?",
                 "Flätat pappersrep runt en ram av furu. Ingen betsning — "
                 "färgen är materialets egen."),
    "db70e38c": ("Vad är panelerna gjorda av?",
                 "Flätade band av pappersfiber över spjälor av furu och bambu. "
                 "Hyllplanen är av samma material som panelerna."),
    "79b349f7": ("Vad är panelerna gjorda av?",
                 "Polyesterduk på 160 g/m² spänd på en stomme av stål."),
    "99040238": ("Vad är panelerna gjorda av?",
                 "Svart polyesterduk på en stomme av pulverlackerad metall."),
}

FAQ_GENOMSYN = {
    "e858810e": "Tyget bakom gallret är halvgenomskinligt. Det bryter blicken "
                "rakt framifrån men släpper igenom dagsljus, och i motljus anas "
                "konturer. Den skymmer insyn, den mörklägger inte.",
    "f641d190": "Tyget bakom gallret är halvgenomskinligt. Det bryter blicken "
                "rakt framifrån men släpper igenom dagsljus, och i motljus anas "
                "konturer. Den skymmer insyn, den mörklägger inte.",
    "1c1eb875": "Duken är halvgenomskinlig, så bladmönstret lyser upp i motljus "
                "och konturer anas bakom. Den skymmer insyn, den mörklägger inte.",
    "23d20823": "Flätningen är gles, så dagsljus silar igenom i ett rutmönster. "
                "Den skymmer insyn på nära håll men mörklägger ingenting.",
    "db70e38c": "Väven har små öppningar mellan banden och släpper igenom både "
                "ljus och luft. Den skymmer insyn, den mörklägger inte.",
    "79b349f7": "Nej, duken är tät. Den skymmer alltså mer än en flätad skärm — "
                "men den mörklägger inte ett rum, för ljus tar sig runt skärmens "
                "kanter.",
    "99040238": "Nej, den svarta duken är tät rakt igenom. Den mörklägger ändå "
                "inte ett rum: ljus tar sig runt kanterna och över överkanten.",
}

FAQ_UTE = {
    "e858810e": "Nej. Furu och tyg hör hemma torrt och inomhus.",
    "f641d190": "Nej. Furu och tyg hör hemma torrt och inomhus.",
    "1c1eb875": "Nej. Furu och tryckt fiberduk hör hemma torrt och inomhus, och "
                "starkt solljus bleker trycket.",
    "23d20823": "Nej. Pappersrep tål varken regn eller fukt.",
    "db70e38c": "Nej. Flätad pappersfiber tål varken regn eller fukt.",
    "79b349f7": "Nej. Leverantören anger uttryckligen att skärmen bara är "
                "avsedd för inomhusbruk och inte ska stå ute i blåst, regn "
                "eller snö.",
    "99040238": "Nej, den är gjord för inomhusbruk.",
}


def bygg(nyckel):
    pan, pbredd, bredd, djup, hojd, hopf, vikt, paket, pris = matt.RUNDAN[nyckel]
    panelord = ORD[pan]
    monteras = matt.MONTERING[nyckel]
    fot_djup = matt.GRUPPER[nyckel] in matt.FOTDJUP
    m = matt_str(nyckel)
    paketstr = " × ".join(tal(x) for x in paket) + " cm"

    djupetikett = "Fotdjup" if fot_djup else "Panelens tjocklek"
    spec = [("Mått utfälld", f"{bredd} × {tal(djup)} × {hojd} cm (B × D × H)")]
    if hopf:
        spec.append(("Mått hopfälld", f"{tal(hopf[0])} × {tal(hopf[1])} × {hojd} cm"))
    spec += [("Panel", f"{pbredd} × {hojd} cm"),
             ("Antal paneler", str(pan)),
             (djupetikett, f"{tal(djup)} cm")]
    if nyckel == "db70e38c":
        spec += [("Hyllplan", "2 st, 170 × 20 cm"),
                 ("Max last per hylla", "5 kg"),
                 ("Fothöjd", "5,5 cm")]
    if nyckel == "79b349f7":
        spec.append(("Hjul", "12 st"))
    spec += [("Material", matt.MATERIAL[nyckel]),
             ("Färg", matt.FARG[nyckel]),
             ("Vikt", f"{tal(vikt)} kg"),
             ("Paketmått", paketstr),
             ("Montering", "krävs – skruvas ihop" if monteras
                           else "ingen — levereras färdig"),
             ("Användning", "inomhus")]

    if monteras:
        levererans = ("Den levereras i delar och skruvas ihop — stolparna kommer "
                      f"i sektioner, vilket är varför hela skärmen ryms i ett "
                      f"paket på {paketstr}.")
    else:
        levererans = ("Den kommer färdigmonterad — vik ut den och ställ den där "
                      "du vill ha den.")

    faq = [
        ("Står den stadigt?",
         "Ja, så länge panelerna vinklas. Rakt utfälld har den inget stöd i "
         "sidled — så är en vikskärm byggd. Ställ den i en mjuk sicksack, gärna "
         "med en av ändarna mot en vägg."
         if nyckel in VIKANDE else
         "Ja. Varje stolpe står på en egen fot, så skärmen behöver inte vinklas "
         "för att stå upp. Vinkla den ändå gärna något — då tar den mindre "
         "plats på längden och står stadigare mot en knuff."),
        ("Går det att se igenom den?", FAQ_GENOMSYN[nyckel]),
        FAQ_MATERIAL[nyckel],
        ("Behöver den monteras?",
         "Ja. Den kommer i delar med anvisning och skruvas ihop."
         if monteras else
         "Nej. Den kommer färdig — du viker ut den och ställer den på plats."),
        ("Kan den stå utomhus?", FAQ_UTE[nyckel]),
        ("Vad väger den?",
         f"{tal(vikt)} kg. " + ("En person bär den utan problem — lyft i ramen "
          "och inte i fyllningen." if nyckel in VIKANDE else
          "Lyft i stolparna, inte i duken.")),
    ]
    if hopf:
        # ☠️ "EN SMAL PACKE BAKOM EN DÖRR" ÄR SANT FÖR FYRA AV FEM. `79b349f7`
        #    fälls ihop till 50 × 40 × 170 cm — panelerna staplas, men de 40 cm
        #    breda fötterna sitter kvar. Ett delat svar hade lovat en kund att
        #    en fyrtio centimeter djup ställning ryms bakom en dörr. Exakt
        #    runda 110:s klass: ett block som är sant på de flesta sidor.
        if nyckel in VIKANDE:
            svar = (f"{tal(hopf[0])} × {tal(hopf[1])} × {hojd} cm — en smal "
                    "packe som ryms bakom en dörr eller i en garderob.")
        else:
            svar = (f"{tal(hopf[0])} × {tal(hopf[1])} × {hojd} cm. Panelerna "
                    "staplas på varandra, men fötterna sitter kvar och håller "
                    f"djupet på {tal(hopf[1])} cm — den blir smal, inte platt.")
        faq.insert(4, ("Hur mycket plats tar den hopfälld?", svar))
    if nyckel == "db70e38c":
        faq.insert(3, ("Hur mycket tål hyllplanen?",
                       "5 kg per hylla enligt leverantören. Fördela vikten över "
                       "hela hyllan i stället för att lasta ena änden tung."))
    if nyckel == "79b349f7":
        faq.insert(3, ("Går det att göra skärmen smalare?",
                       "Ja. Panelerna sitter fast med clips, så du kan ta bort "
                       "en eller flera paneler och sätta tillbaka dem senare."))

    return dict(
        namn=NAMN[nyckel],
        slug=SLUG[nyckel],
        titel=TITEL[nyckel],
        meta=(f"Rumsavdelare {m} med {panelord} paneler i {PROSA[nyckel]}. "
              + ("Monteras med medföljande anvisning." if monteras
                 else "Levereras färdig — vik ut och ställ på plats.")),
        sokord=[("rumsavdelare", True),
                (f"rumsavdelare {pan} paneler", False),
                ("skärmvägg", False),
                (SOKORD4[nyckel], False)],
        html=(
            P(f"En <strong>rumsavdelare</strong> med {panelord} paneler som mäter "
              f"{m} utfälld. Varje panel är {pbredd} cm bred och {hojd} cm hög, i "
              f"{PROSA[nyckel]}. {levererans}")
            + H("Så mycket den delar av")
            + P(f"Utfälld i rak linje täcker de {panelord} panelerna {bredd} cm. I "
                "praktiken ställer man den i vinkel, och då blir den kortare men "
                "stadigare: en böj över en bit av rummet räcker för att skilja en "
                "arbetsplats från en soffa eller dölja en säng i ett enrumsboende.")
            + stadigt(nyckel)
            + avskarmning()
            + MATERIALBLOCK[nyckel]
            + lankrad(nyckel)
            + H("Tekniska specifikationer") + UL(spec)
            + SKOTSEL[nyckel]
            + H("Vanliga frågor")
            + "".join(F(q, s) for q, s in faq)
        ),
    )


SOKORD4 = {
    "e858810e": "vikskärm i trä",
    "f641d190": "vikskärm i trä",
    "1c1eb875": "rumsavdelare med mönster",
    "23d20823": "rumsavdelare i flätat material",
    "db70e38c": "rumsavdelare med hylla",
    "79b349f7": "rumsavdelare på hjul",
    "99040238": "svart rumsavdelare",
}

PRODUKTER = {k: bygg(k) for k in matt.RUNDAN}

if __name__ == "__main__":
    for k in matt.RUNDAN:
        d = PRODUKTER[k]
        print(f"=== {matt.GRUPPER[k]} {k}")
        print(f"  namn  {len(d['namn']):>3}  {d['namn']}")
        print(f"  slug   {len(d['slug']):>2}  {d['slug']}")
        print(f"  titel {len(d['titel']):>3}  {d['titel']}")
        print(f"  meta  {len(d['meta']):>3}  {d['meta']}")
        print(f"  html  {len(d['html']):>5} tecken")
