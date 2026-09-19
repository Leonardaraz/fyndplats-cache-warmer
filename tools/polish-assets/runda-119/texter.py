# -*- coding: utf-8 -*-
"""Runda 119 Steg 7 — namn, slug, seoData och brödtext för nio produkter.

☠️ TEXTEN SKRIVS I DEN HÄR FILEN, ALDRIG INLINE I API-ANROPET. Batch 64 mätte
nio fel mot noll: en sträng som skrivs direkt i ett JSON-anrop kan inte läsas av
en grind innan den lämnar chatten, och API-svaret ekar tillbaka exakt det man
skrev — det ser rätt ut för att det ÄR det man skrev. En fil går att grep:a.

Alla siffror kommer ur `matt.py`. Inget tal skrivs för hand här.

☠️ RUNDANS EGEN RISK ÄR SÖKORDSKROCKEN, inte dubbletter. Elva köksvagnar och
två köksöar ligger redan publicerade i samma prisspann. Varje namn måste därför
bära det som SKILJER modellen — arbetsytans längd, vinstället, bambun,
furuskivan, rostfriheten — och inte bara "köksvagn på hjul", som redan är taget
elva gånger.
"""
from matt import M, DEL_OK   # noqa: F401  (DEL_OK läses av grind.py)

NAMN = {
    "ad390a36": "Köksvagn 53 cm med två lådor och öppna fack – vit med träskiva",
    "dac7a904": "Köksvagn med 101 cm arbetsyta – låda, två hyllplan och handdukshängare",
    "c86ff1a6": "Köksvagn 83 cm med vinställ för sex flaskor – skiva i gummiträ",
    "5d1696db": "Köksvagn i bambu 84 cm med rottingdörr – glasyta, två lådor och skåp",
    "6cf7cfcf": "Köksvagn i lantstil 67 cm med furuskiva – tre lådor och två spjälhyllor",
    "36526a8d": "Grillvagn utomhus 86 cm med rostfri skiva – skåp och sex krokar",
    "9e5e788c": "Köksö 115 cm med utfällbar skiva – två skåp, kryddhyllor och fem hjul",
    "d8bbbdde": "Köksö 120 cm med klaffskiva – stort skåp, sidohyllor och bromsade hjul",
    "e0fed2c9": "Köksö 129 cm med utdragsbrickor – 120 cm skiva, dörrfack och fem hjul",
}

SLUG = {
    "ad390a36": "koksvagn-53-cm-tva-lador-oppna-fack",
    "dac7a904": "koksvagn-101-cm-arbetsyta-hyllplan",
    "c86ff1a6": "koksvagn-83-cm-vinstall-sex-flaskor",
    "5d1696db": "koksvagn-bambu-84-cm-rottingdorr",
    "6cf7cfcf": "koksvagn-lantstil-furuskiva-tre-lador",
    "36526a8d": "grillvagn-utomhus-86-cm-rostfri-skiva",
    "9e5e788c": "kokso-115-cm-utfallbar-skiva-kryddhyllor",
    "d8bbbdde": "kokso-120-cm-klaffskiva-stort-skap",
    "e0fed2c9": "kokso-129-cm-utdragsbrickor-dorrfack",
}

TITEL = {
    "ad390a36": "Köksvagn 53 cm – två lådor och öppna fack | Fyndplats",
    "dac7a904": "Köksvagn med 101 cm arbetsyta och hyllplan | Fyndplats",
    "c86ff1a6": "Köksvagn 83 cm med vinställ i gummiträ | Fyndplats",
    "5d1696db": "Köksvagn i bambu 84 cm med rottingdörr | Fyndplats",
    "6cf7cfcf": "Köksvagn i lantstil med furuskiva 67 cm | Fyndplats",
    "36526a8d": "Grillvagn utomhus 86 cm i rostfritt | Fyndplats",
    "9e5e788c": "Köksö 115 cm med utfällbar skiva | Fyndplats",
    "d8bbbdde": "Köksö 120 cm med klaffskiva och skåp | Fyndplats",
    "e0fed2c9": "Köksö 129 cm med utdragsbrickor | Fyndplats",
}

META = {
    "ad390a36": ("Smal köksvagn på 53 × 37 × 89 cm med två utdragslådor och två "
                 "öppna fack. Fyra länkhjul, två med broms. Tål 30 kg."),
    "dac7a904": ("Köksvagn med arbetsyta på 101,5 × 51 cm, en bred låda och två "
                 "hyllplan. Handdukshängare på sidan, fyra hjul. Tål 50 kg."),
    "c86ff1a6": ("Köksvagn 83 × 40 × 83 cm med skiva i gummiträ, vinställ för sex "
                 "flaskor, skåp med soft close och sidohyllor. Tål 37 kg."),
    "5d1696db": ("Köksvagn i lackerad bambu, 84 × 36 × 85 cm, med handflätad "
                 "rottingdörr, infälld glasyta, två lådor och skåp. Tål 50 kg."),
    "6cf7cfcf": ("Köksvagn i lantstil med skiva i furu, 67 × 37 × 87 cm. Tre lådor, "
                 "avtagbar bricka och två spjälhyllor. Tål 40 kg."),
    "36526a8d": ("Grillvagn för uteplatsen, 86 × 50 × 86,5 cm, med skiva i rostfritt "
                 "stål, stängt skåp och sex krokar. Pulverlackerad metall."),
    "9e5e788c": ("Köksö på hjul, 115 × 70 × 89 cm, med utfällbar skiva, två skåp, "
                 "två lådor och tre kryddhyllor. Fem hjul. Tål 105 kg."),
    "d8bbbdde": ("Köksö 120 × 68 × 85 cm med klaffskiva, en bred låda och ett stort "
                 "skåp med hyllplan i tre lägen. Fyra hjul. Tål 100 kg."),
    "e0fed2c9": ("Köksö 129 × 65 × 91 cm med skiva som fälls ut till 120 × 65 cm, "
                 "två lådor, fyra dörrfack och utdragsbrickor. Tål 112 kg."),
}

SOKORD = {
    "ad390a36": ["köksvagn", "smal köksvagn", "köksvagn med lådor", "rullvagn kök"],
    "dac7a904": ["köksvagn med arbetsyta", "köksvagn", "arbetsbänk på hjul", "serveringsvagn kök"],
    "c86ff1a6": ["köksvagn med vinställ", "köksvagn", "vinvagn", "köksvagn gummiträ"],
    "5d1696db": ["köksvagn bambu", "köksvagn", "bambuvagn kök", "köksvagn rotting"],
    "6cf7cfcf": ["köksvagn lantstil", "köksvagn med lådor", "köksvagn furu", "serveringsvagn lantstil"],
    "36526a8d": ["grillvagn", "grillvagn utomhus", "utekök på hjul", "grillbord rostfritt"],
    "9e5e788c": ["köksö på hjul", "köksö", "köksö med utfällbar skiva", "rullbar köksö"],
    "d8bbbdde": ["köksö på hjul", "köksö med klaffskiva", "köksö", "köksvagn stor"],
    "e0fed2c9": ["köksö på hjul", "stor köksö", "köksö med utdragsbrickor", "köksö 129 cm"],
}

# ☠️ Korslänkarna är rundans svar på sökordskrocken. Elva köksvagnar ligger
#    redan ute; utan länkar läser Google (och kunden) dem som varandras kopior.
#    Varje länk går till en sida som skiljer sig på EN tydlig axel.
SYSKON = {
    "ad390a36": [("rullvagn-fyra-utdragslador-24-cm", "smalare rullvagn på 24 cm djup"),
                 ("koksvagn-83-cm-vinstall-sex-flaskor", "bredare köksvagn med vinställ")],
    "dac7a904": [("koksvagn-109-cm-gummitraskiva-vit", "köksvagn 109 cm med skiva i gummiträ"),
                 ("kokso-120-cm-klaffskiva-stort-skap", "köksö med klaffskiva och stort skåp")],
    "c86ff1a6": [("koksvagn-bambu-84-cm-rottingdorr", "köksvagn i bambu med rottingdörr"),
                 ("koksskap-med-vinstall-atta-flaskor", "köksskåp med vinställ för åtta flaskor")],
    "5d1696db": [("koksvagn-83-cm-vinstall-sex-flaskor", "köksvagn med vinställ och skiva i gummiträ"),
                 ("rullvagn-bambu-3-hyllplan", "smal rullvagn i bambu med tre hyllplan")],
    "6cf7cfcf": [("koksvagn-med-lador-avtagbar-bricka-vit-67x37x85-5-cm",
                  "köksvagn med tre lådor och skiva i gummiträ"),
                 ("koksvagn-53-cm-tva-lador-oppna-fack", "smalare köksvagn på 53 cm")],
    "36526a8d": [("barvagn-utomhus-97-cm-flaskhallare", "barvagn för uteplatsen i gran"),
                 ("serveringsvagn-utomhus-107-cm-gran", "serveringsvagn utomhus med krokar")],
    "9e5e788c": [("kokso-129-cm-utdragsbrickor-dorrfack", "större köksö med utdragsbrickor"),
                 ("kokso-pa-hjul-glasdorrar-fallbar-bankskiva", "köksö med glasdörrar och vinställ")],
    "d8bbbdde": [("kokso-115-cm-utfallbar-skiva-kryddhyllor", "köksö med kryddhyllor och fem hjul"),
                 ("koksvagn-101-cm-arbetsyta-hyllplan", "köksvagn med lång arbetsyta")],
    "e0fed2c9": [("kokso-pa-hjul-fallbar-bankskiva-kryddhyllor", "köksö med tre skåp och kryddhyllor"),
                 ("kokso-115-cm-utfallbar-skiva-kryddhyllor", "mindre köksö på 115 cm")],
}

# Fyndplats-kortet: VERSALRAD + underrubrik.
KORT = {
    "ad390a36": ("SMAL KÖKSVAGN, 53 CM", "Två lådor och två öppna fack"),
    "dac7a904": ("KÖKSVAGN MED LÅNG ARBETSYTA", "101,5 cm att arbeta på"),
    "c86ff1a6": ("KÖKSVAGN MED VINSTÄLL", "Sex flaskor liggande"),
    "5d1696db": ("KÖKSVAGN I BAMBU", "Handflätad rottingdörr"),
    "6cf7cfcf": ("KÖKSVAGN I LANTSTIL", "Furuskiva och avtagbar bricka"),
    "36526a8d": ("GRILLVAGN FÖR UTEPLATSEN", "Skiva i rostfritt stål"),
    "9e5e788c": ("KÖKSÖ MED UTFÄLLBAR SKIVA", "96 × 40 blir 96 × 70 cm"),
    "d8bbbdde": ("KÖKSÖ MED KLAFFSKIVA", "Stort skåp med hylla i tre lägen"),
    "e0fed2c9": ("KÖKSÖ MED UTDRAGSBRICKOR", "Skivan fälls ut till 120 × 65 cm"),
}

INGRESS = {
    "ad390a36": (
        "Ett kök har sällan för lite skåp — det har för lite golvyta att ställa dem på. "
        "Den här vagnen är {bredd} cm bred och {djup} cm djup, alltså smalare än de "
        "flesta diskmaskiner, och rymmer ändå två utdragslådor och {antal_fack}. Rulla "
        "fram den när du lagar mat och skjut in den mot väggen när du är klar."),
    "dac7a904": (
        "Det som tar slut först i ett litet kök är arbetsytan. Den här vagnen lägger till "
        "{skiva} att skära, kavla och ställa fram på — mer än en normal bänkmodul — och "
        "under den ligger {antal_fack} för skålar, kastruller och torrvaror. En låda på "
        "{lada_ovre} tar besticken, och handdukshängaren sitter på kortsidan."),
    "c86ff1a6": (
        "En vagn som ska fungera både i vardagen och när det är folk hemma behöver två "
        "saker: en yta som tål att arbetas på och en plats att ställa flaskorna. Skivan "
        "är {yta} på {skiva}, vinstället tar {flaskor} flaskor liggande, och skåpet "
        "stängs mjukt i stället för att slå igen."),
    "5d1696db": (
        "Bambu och rotting gör en köksvagn till en möbel man inte behöver gömma. Den här "
        "har en stomme i {material}, mäter {matt}, och dörren är handflätad rotting. "
        "Överst ligger en infälld glasyta som tål blöta glas, och under finns två lådor, "
        "{antal_fack} och ett stängt skåp."),
    "6cf7cfcf": (
        "Lantkökets vagn har spjälade hyllor och en skiva i ljust trä, och den här "
        "har båda. Skivan är {yta}, {skiva}, och under den ligger tre lådor med "
        "infällda grepp. Överst i det öppna facket sitter en bricka som lyfts av och "
        "bärs in till bordet."),
    "36526a8d": (
        "Grillen har sällan någon yta bredvid sig. Den här vagnen ger dig {skiva} i "
        "rostfritt stål att ställa fat, marinader och verktyg på, och ett stängt skåp "
        "under där kolet och tändvätskan får plats. Stommen är {material}, byggd för "
        "att stå ute."),
    "9e5e788c": (
        "En köksö behöver vara stor när du lagar mat och liten när du inte gör det. Den "
        "här har en skiva som fälls ut från {skiva_ned} till {skiva}, alltså nästan "
        "dubbelt så djup. Runt om finns två skåp med hyllplan i tre lägen, två lådor, "
        "{antal_fack} och {kryddplan} kryddhyllor på gaveln."),
    "d8bbbdde": (
        "Det här är köksön för dig som vill ha ett enda stort skåp i stället för många små. "
        "Skåpet mäter {skap} invändigt med ett hyllplan som flyttas i tre lägen, så en "
        "matberedare får plats stående. Skivan är {skiva} och klaffen lägger till "
        "{skiva_klaff} när du behöver den."),
    "e0fed2c9": (
        "Med {bredd} cm i bredd är det här köksön för dig som lagar mat mitt i rummet. "
        "Skivan går från {skiva_ned} till {skiva} när klaffen fälls upp, och bärs av en "
        "{skivtjocklek} tjock stomme som tål {maxlast_kort}. Innanför dörrarna sitter "
        "{antal_fack} för burkar och flaskor, och tre brickor dras ut som lådor."),
}

EGENSKAPER = {
    "ad390a36": [
        "Bara {bredd} cm bred — får plats där ett skåp inte gör det",
        "Två utdragslådor med 3/4-utdrag, {lada_ovre} och {lada_nedre} invändigt",
        "{antal_fack} på {fack}",
        "Skiva i {yta}, {skiva}",
        "{hjul_punkt}",
        "Tål {maxlast_kort} totalt",
    ],
    "dac7a904": [
        "Arbetsyta på {skiva} — längre än en normal bänkmodul",
        "En bred låda, {lada_ovre} invändigt",
        "{antal_fack} med spjälor, det övre {fack}",
        "Handdukshängare på kortsidan, {handduk}",
        "{hjul_punkt}",
        "Tål {maxlast_kort} totalt, {hylllast} kg per hylla",
    ],
    "c86ff1a6": [
        "Vinställ för {flaskor} flaskor liggande, varje fack {vinfack}",
        "Skåp med soft close-gångjärn, {skap} invändigt",
        "{antal_fack} på {fack}",
        "Sidohyllor med kant, {sidohylla}",
        "Skiva i {yta}, {skiva}",
        "{hjul_punkt}",
    ],
    "5d1696db": [
        "Handflätad rottingdörr framför det stängda skåpet",
        "Infälld glasyta överst, {glasskiva}",
        "Två lådor på {lada_ovre} invändigt",
        "{antal_fack} på {fack} och ett skåp på {skap}",
        "{hjul_punkt}",
        "Stomme i {material}",
    ],
    "6cf7cfcf": [
        "Tre lådor med infällda grepp, {lada_ovre} invändigt",
        "Avtagbar bricka överst, {bricka}",
        "{antal_fack} som släpper igenom luft, {fack}",
        "Skiva i {yta}, {skiva}",
        "{hjul_punkt}",
        "Tål {maxlast_kort} totalt",
    ],
    "36526a8d": [
        "Skiva i {yta}, {skiva} — tål värme och går att torka av",
        "Stängt skåp med två dörrar, {skap} invändigt",
        "{krokar} S-krokar på sidan för redskap",
        "Handtagen fungerar också som handdukshängare",
        "{hjul_punkt}",
        "Stomme i {material}",
    ],
    "9e5e788c": [
        "Skivan fälls ut från {skiva_ned} till {skiva}",
        "Två skåp med hyllplan i tre lägen, {skap} invändigt",
        "Två lådor, {lada_ovre} och {lada_nedre} invändigt",
        "{kryddplan} kryddhyllor på gaveln, {kryddhylla}",
        "{hjul_punkt}",
        "Tål {maxlast_kort} totalt",
    ],
    "d8bbbdde": [
        "Klaffskiva som lägger till {skiva_klaff} till huvudytan på {skiva}",
        "Stort skåp med hyllplan i tre lägen, {skap} invändigt",
        "En bred låda, {lada_ovre} invändigt",
        "Sidohyllor med trärail och handdukshängare",
        "{hjul_punkt}",
        "Tål {maxlast_kort} totalt",
    ],
    "e0fed2c9": [
        "Skivan går från {skiva_ned} till {skiva} när klaffen fälls upp",
        "Tre utdragsbrickor på {bricka} som dras ut som lådor",
        "{antal_fack} på insidan av dörrarna, {dorrfack} var",
        "Två lådor, {lada_ovre} invändigt",
        "{hjul_punkt}",
        "Tål {maxlast_kort} totalt",
    ],
}

_SPEC_BAS = [
    ("Yttermått", "{matt} (bredd × djup × höjd)"),
    ("Skivans yta", "{skiva}"),
    ("Maxlast", "{maxlast}"),
    ("Vikt", "{vikt}"),
    ("Material", "{material}"),
    ("Färg", "{farg}"),
    ("Hjul", "{hjul}"),
    ("Montering", "{montering}"),
    ("Paketmått", "{paket}"),
]

SPEC = {
    "ad390a36": [("Yttermått", "{matt} (bredd × djup × höjd)"),
                 ("Antal lådor", "{lador} st"),
                 ("Lådmått invändigt", "{lada_ovre} (övre), {lada_nedre} (nedre)"),
                 ("Öppet fack", "{fack}")] + _SPEC_BAS[1:],
    "dac7a904": [("Yttermått", "{matt} (bredd × djup × höjd)"),
                 ("Arbetsyta", "{skiva}"),
                 ("Låda invändigt", "{lada_ovre}"),
                 ("Öppna hyllplan", "{fack} (övre), {fack_nedre} (nedre)"),
                 ("Handdukshängare", "{handduk}"),
                 ("Fri höjd under nedre planet", "{golvfri}")] + _SPEC_BAS[2:],
    "c86ff1a6": [("Yttermått", "{matt} (bredd × djup × höjd)"),
                 ("Skivans yta", "{skiva}"),
                 ("Skåp invändigt", "{skap}"),
                 ("Öppet mittfack", "{fack}"),
                 ("Vinfack", "{vinfack} per flaska, {flaskor} platser"),
                 ("Sidohyllor", "{sidohylla}")] + _SPEC_BAS[2:],
    "5d1696db": [("Yttermått", "{matt} (bredd × djup × höjd)"),
                 ("Skivans yta", "{skiva}"),
                 ("Glasyta", "{glasskiva}"),
                 ("Lådor invändigt", "{lada_ovre}, {lador} st"),
                 ("Öppet fack", "{fack}"),
                 ("Skåp invändigt", "{skap}")] + _SPEC_BAS[2:],
    "6cf7cfcf": [("Yttermått", "{matt} (bredd × djup × höjd)"),
                 ("Skivans yta", "{skiva}"),
                 ("Lådor invändigt", "{lada_ovre}, {lador} st"),
                 ("Avtagbar bricka", "{bricka}"),
                 ("Spjälhyllor", "{fack}")] + _SPEC_BAS[2:],
    "36526a8d": [("Yttermått", "{matt} (bredd × djup × höjd)"),
                 ("Skivans yta", "{skiva}"),
                 ("Skåp invändigt", "{skap}"),
                 ("Krokar", "{krokar} S-krokar")] + _SPEC_BAS[2:],
    "9e5e788c": [("Yttermått", "{matt} (bredd × djup × höjd)"),
                 ("Skivans yta", "{skiva_ned} nedfälld, {skiva} uppfälld"),
                 ("Lådor invändigt", "{lada_ovre} (stor), {lada_nedre} (liten)"),
                 ("Skåp invändigt", "{skap}"),
                 ("Öppna fack", "{fack}"),
                 ("Kryddhyllor", "{kryddhylla}, {kryddplan} plan"),
                 ("Handdukshängare", "{handduk}")] + _SPEC_BAS[2:],
    "d8bbbdde": [("Yttermått", "{matt} (bredd × djup × höjd)"),
                 ("Mått med klaffen nedfälld", "{matt_ned}"),
                 ("Bänkskiva", "{skiva} plus klaff på {skiva_klaff}"),
                 ("Låda invändigt", "{lada_ovre}"),
                 ("Skåp invändigt", "{skap}"),
                 ("Hjuldiameter", "{hjuldiameter}")] + _SPEC_BAS[2:],
    "e0fed2c9": [("Yttermått", "{matt} (bredd × djup × höjd)"),
                 ("Skivans yta", "{skiva_ned} nedfälld, {skiva} uppfälld"),
                 ("Skivans tjocklek", "{skivtjocklek}"),
                 ("Lådor invändigt", "{lada_ovre}, {lador} st"),
                 ("Dörrfack", "{dorrfack}, {antal_fack}"),
                 ("Utdragsbrickor", "{bricka}"),
                 ("Handdukshängare", "{handduk}")] + _SPEC_BAS[2:],
}

SKOTSEL = {
    "ad390a36": (
        "Torka av skivan med en lätt fuktad trasa och torka efter med en torr – låt inte "
        "vatten bli stående på ytan. Skär inte direkt på skivan utan använd en skärbräda. "
        "Lås de två bromsade hjulen när vagnen står lastad, särskilt om golvet lutar. "
        "Fördela tyngden jämnt och håll dig inom {maxlast}. Dra åt skruvarna igen efter "
        "en tids användning om vagnen börjar kännas glapp."),
    "dac7a904": (
        "Melaminytan är vattenavvisande och räcker att torka av med en fuktad trasa. "
        "Använd skärbräda i stället för att skära direkt på skivan. Spjälhyllorna släpper "
        "igenom luft, så de går att skölja av och torkar snabbt. Håll dig inom {maxlast}, "
        "och lasta det tyngsta på det nedre planet. Efterdra skruvarna när vagnen varit "
        "i bruk en tid."),
    "c86ff1a6": (
        "Gummiträskivan mår bäst av en lätt fuktad trasa och en torr efter – låt inte "
        "vatten stå kvar i fogarna. Olja in skivan när den känns torr om du vill behålla "
        "tonen. Soft close-gångjärnen ska inte tvingas igen med handen; låt dem gå själva. "
        "Håll dig inom {maxlast}. Efterdra skruvarna efter en tids användning."),
    "5d1696db": (
        "Bambun är lackerad och torkas av med en lätt fuktad trasa. Låt inte vatten bli "
        "stående, och ställ inte vagnen i direkt fukt. Rottingdörren dammas av med en "
        "torr borste eller dammsugarens möbelmunstycke. Glasytan tål blöta glas men inte "
        "slag – ställ inte tunga kastruller på den. Håll dig inom {maxlast}."),
    "6cf7cfcf": (
        "Furuskivan torkas av med en lätt fuktad trasa och torkas efter. Använd skärbräda. "
        "Brickan lyfts av och sköljs i diskhon när den behöver det. Spjälorna släpper "
        "igenom luft, vilket gör hyllorna lämpliga för bland annat frukt och rotfrukter. "
        "Håll dig inom {maxlast}, och lås de två bromsade hjulen när vagnen står lastad."),
    "36526a8d": (
        "Den rostfria skivan torkas av med diskmedel och vatten; torka i fiberriktningen "
        "så syns inga ränder. Ställ inte glödande kol direkt på skivan. Ta in vagnen eller "
        "täck den när säsongen är slut – pulverlacken tål väder, men stående vatten i "
        "skarvarna gör ingen metallmöbel gott. Håll dig inom {maxlast}."),
    "9e5e788c": (
        "Melaminytan räcker att torka av med en fuktad trasa; använd skärbräda i stället "
        "för att skära direkt på skivan. Fäll ut klaffen med båda händerna och kontrollera "
        "att stödet fällt ut innan du lastar den. Hyllplanen flyttas i tre lägen med "
        "hyllbärarna. Håll dig inom {maxlast}, och lås de två bromsade hjulen när du "
        "arbetar på skivan."),
    "d8bbbdde": (
        "Torka av melaminytan med en lätt fuktad trasa och torka efter. Fäll ut klaffen "
        "med båda händerna och lasta den först när stödet är på plats. Hyllplanet inne i "
        "skåpet flyttas i tre lägen. Håll dig inom {maxlast}, och lås de två bromsade "
        "hjulen när köksön står lastad."),
    "e0fed2c9": (
        "Skivan torkas av med en lätt fuktad trasa; använd skärbräda. Fäll ut klaffen "
        "med båda händerna och kontrollera stödet innan du lastar den. Utdragsbrickorna "
        "lyfts ur och sköljs vid behov. Soft close-gångjärnen ska inte tryckas igen för "
        "hand. Håll dig inom {maxlast}, och lås de två bromsade hjulen när du arbetar."),
}

FAQ = {
    "ad390a36": [
        ("Hur bred är vagnen?",
         "{bredd} cm bred och {djup} cm djup, {hojd} cm hög. Den är alltså smalare än en "
         "vanlig diskmaskin och får plats mellan bänken och kylen i de flesta kök."),
        ("Hur mycket rymmer lådorna?",
         "Den övre lådan mäter {lada_ovre} invändigt och den nedre {lada_nedre}. Båda har "
         "3/4-utdrag, så du kommer åt det som ligger längst in."),
        ("Går den att låsa fast?",
         "{hjul_svar}"),
        ("Hur mycket tål den?",
         "{maxlast}."),
    ],
    "dac7a904": [
        ("Hur stor är arbetsytan?",
         "Skivan mäter {skiva}. Det är längre än en normal bänkmodul, och tillräckligt "
         "för att kavla ut en deg bredvid en skärbräda."),
        ("Vad får plats på hyllorna?",
         "Det övre planet är {fack} och det nedre {fack_nedre}. Båda är spjälade, så luft "
         "cirkulerar – lämpligt för bland annat rotfrukter och kastruller."),
        ("Går vagnen att rulla in under en bänk?",
         "Nej. Den är {hojd} cm hög och byggd för att stå fritt eller mot en vägg, "
         "inte för att skjutas in under en bänkskiva."),
        ("Hur mycket tål den?",
         "{maxlast}."),
    ],
    "c86ff1a6": [
        ("Hur många flaskor rymmer vinstället?",
         "{flaskor} flaskor liggande. Varje fack mäter {vinfack}, vilket rymmer en "
         "vinflaska av vanlig storlek."),
        ("Vad är skivan gjord av?",
         "Skivan är {yta} och mäter {skiva}. Stommen är {material_kort} — träet sitter "
         "i arbetsytan, inte i hela möbeln."),
        ("Vad betyder soft close?",
         "Gångjärnen bromsar dörren de sista centimetrarna så att den inte slår igen. "
         "Tryck inte igen den för hand – låt gångjärnet göra jobbet."),
        ("Hur mycket tål den?",
         "{maxlast}."),
    ],
    "5d1696db": [
        ("Är hela vagnen i bambu?",
         "Ja, stommen är {material}. Dörren är handflätad rotting och överst ligger en "
         "infälld glasyta på {glasskiva}."),
        ("Vad tål glasytan?",
         "Ställ alltid ett underlägg under varmt gods. Undvik slag och punktlast på "
         "ytan — glaset är en avlastningsyta, inte en arbetsbänk."),
        ("Vad får plats i skåpet?",
         "Skåpet mäter {skap} invändigt. Det är högt nog för de flesta apparater som "
         "annars står framme på bänken."),
        ("Hur mycket tål den?",
         "{maxlast}."),
    ],
    "6cf7cfcf": [
        ("Vad skiljer den från de andra köksvagnarna med lådor?",
         "Skivan är {yta} och hyllorna är spjälade i stället för hela. Vagnen mäter "
         "{matt} och tål {maxlast_kort} totalt."),
        ("Går brickan att ta av?",
         "Ja. Brickan mäter {bricka} och lyfts av för att bäras in till bordet."),
        ("Vad passar spjälhyllorna till?",
         "Spjälorna släpper igenom luft, vilket gör hyllorna lämpliga för bland annat "
         "frukt, lök och rotfrukter. Varje hylla mäter {fack}."),
        ("Hur mycket tål den?",
         "{maxlast}."),
    ],
    "36526a8d": [
        ("Tål den att stå ute?",
         "Ja. Stommen är {material} och skivan är rostfri. Täck den eller ta in den när "
         "säsongen är slut, så håller lacken längre."),
        ("Hur mycket tål skivan?",
         "{maxlast}. Det är en avlastnings- och serveringsyta, inte en arbetsbänk för "
         "tunga apparater."),
        ("Vad får plats i skåpet?",
         "Skåpet mäter {skap} invändigt – tillräckligt för kolsäck, tändvätska och "
         "grillredskap bakom stängda dörrar."),
        ("Vad sitter krokarna till?",
         "{krokar} S-krokar hänger på sidan för tänger, grillvantar och handdukar. "
         "Handtagen fungerar också som handdukshängare."),
    ],
    "9e5e788c": [
        ("Hur mycket större blir skivan när klaffen är uppe?",
         "Skivan går från {skiva_ned} nedfälld till {skiva} uppfälld. Djupet blir alltså "
         "nästan dubbelt så stort."),
        ("Hur många hjul har den?",
         "{hjul_svar}"),
        ("Går hyllplanen att flytta?",
         "Ja, hyllplanen i båda skåpen sitter i tre lägen. Skåpen mäter {skap} invändigt."),
        ("Hur mycket tål köksön?",
         "{maxlast}."),
    ],
    "d8bbbdde": [
        ("Hur stort är skåpet?",
         "{skap} invändigt, med ett hyllplan som flyttas i tre lägen. En matberedare får "
         "plats stående."),
        ("Hur stor är köksön med klaffen nere?",
         "{matt_ned}. Uppfälld mäter den {matt}."),
        ("Går den att låsa fast?",
         "{hjul_svar}"),
        ("Hur mycket tål köksön?",
         "{maxlast}."),
    ],
    "e0fed2c9": [
        ("Hur stor blir arbetsytan?",
         "Skivan går från {skiva_ned} nedfälld till {skiva} uppfälld. Den är "
         "{skivtjocklek} tjock."),
        ("Vad är utdragsbrickorna till?",
         "Tre brickor på {bricka} dras ut som lådor på sidan – tänkta för det som ska "
         "vara lätt att komma åt, som snacks och kryddburkar."),
        ("Vad får plats i dörrfacken?",
         "{antal_fack} på insidan av dörrarna, {dorrfack} var. De tar burkar och flaskor "
         "som annars ligger löst i skåpet."),
        ("Hur mycket tål köksön?",
         "{maxlast}."),
    ],
}


def _f(text, pid):
    return text.format(**M[pid])


def bygg(pid):
    """Returnerar (namn, slug, titel, meta, sökord, html)."""
    ut = [f"<p>{_f(INGRESS[pid], pid)}</p>"]

    rubrik = "Det här är köksön" if pid in M and pid in (
        "9e5e788c", "d8bbbdde", "e0fed2c9") else "Det här är vagnen"
    ut.append(f"<h2>{rubrik}</h2><ul>")
    for rad in EGENSKAPER[pid]:
        # ☠️ Versal först. Flera punkter börjar med `{antal_fack}` eller
        #    `{krokar}`, som är gemena i matt.py eftersom samma fält också
        #    används mitt i meningar. Runda 118 mätte upp det på rendrad utdata.
        text = _f(rad, pid)
        ut.append(f"<li>{text[:1].upper()}{text[1:]}</li>")
    ut.append("</ul>")

    # ☠️ KORSLÄNKARNA LIGGER FÖRE FÖRSTA FLIKRUBRIKEN, med flit.
    #    Butikens `splitFlikar` (butiksrepot, `components/productview.tsx`)
    #    lägger ALLT före första matchande <h2> i brödtexten och allt
    #    därefter i flikar. Ett block mellan två flikrubriker hamnar alltså
    #    INUTI den föregående fliken — här låg både skötseltexten och
    #    korslänkarna inne i spec-tabellen. Uppmätt live 2026-09-10 i
    #    runda 120 och rättat här i samma svep.
    if SYSKON.get(pid):
        lankar = " ".join(
            f'<a href="https://www.fyndplats.se/produkt/{s}">{t.capitalize()}</a>.'
            for s, t in SYSKON[pid])
        ut.append("<h2>Passar inte den här?</h2>")
        ut.append(f"<p>{lankar}</p>")

    ut.append("<h2>Tekniska specifikationer</h2><ul>")
    for etikett, varde in SPEC[pid]:
        ut.append(f"<li><strong>{etikett}:</strong> {_f(varde, pid)}</li>")
    ut.append("</ul>")

    # ☠️ RUBRIKEN MÅSTE HETA "Användning och skötsel" — ORDAGRANT.
    #    `FLIK_TITLE_PATTERNS` känner exakt fyra strängar, och
    #    "Montering och skötsel" är ingen av dem. Sidan såg hel ut: ordet
    #    stod där, som <h2>, mitt i spec-fliken.
    ut.append("<h2>Användning och skötsel</h2>")
    ut.append(f"<p>{_f(SKOTSEL[pid], pid)}</p>")

    ut.append("<h2>Vanliga frågor</h2>")
    for fraga, svar in FAQ[pid]:
        # ☠️ FRÅGA och SVAR som TVÅ <p>. Wix strippar <br>.
        ut.append(f"<p><strong>{fraga}</strong></p>")
        s = _f(svar, pid)
        ut.append(f"<p>{s[:1].upper()}{s[1:]}</p>")

    return (NAMN[pid], SLUG[pid], TITEL[pid], META[pid], SOKORD[pid], "".join(ut))


if __name__ == "__main__":
    from matt import ALLA
    for pid in ALLA:
        n, s, t, m, k, h = bygg(pid)
        print(f"{pid}  namn {len(n):>2}  titel {len(t):>2}  meta {len(m):>3}  "
              f"html {len(h):>5}  {s}")
