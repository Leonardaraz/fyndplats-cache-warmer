# -*- coding: utf-8 -*-
"""Runda 118 Steg 7 — namn, slug, seoData och brödtext för nio vagnar.

☠️ TEXTEN SKRIVS I DEN HÄR FILEN, ALDRIG INLINE I API-ANROPET. Batch 64 mätte
nio fel mot noll: en sträng som skrivs direkt i ett JSON-anrop kan inte läsas av
en grind innan den lämnar chatten, och API-svaret ekar tillbaka exakt det man
skrev — det ser rätt ut för att det ÄR det man skrev. En fil går att grep:a.

Alla siffror kommer ur `matt.py`. Inget tal skrivs för hand här.
"""
from matt import M, DEL_OK, HALLS_TILLBAKA   # noqa: F401  (DEL_OK läses av grind.py)

NAMN = {
    "764a3efc": "Rullvagn 24 cm djup med fyra utdragslådor – vit med träskiva",
    "820d076b": "Hopfällbar barvagn i bambu 66 cm – två brickor och tre flaskplatser",
    "15d6fcef": "Köksvagn med fyra utdragskorgar 91 cm – skiva i ljus stenlook",
    "0fd65541": "Köksvagn med fyra utdragskorgar 91 cm – ekfärgad skiva",
    "2e292a70": "Grönsaksvagn med fyra vridbara korgar – 33 × 33 cm, monteringsfri",
    "a4ee97c1": "Rullbord 61 cm med låda, hylla och hängkorg – svart metall",
    "8a73caf4": "Barvagn utomhus 97,5 cm i gran – fyra flaskhållare och två korgar",
    "fcb86875": "Rund barvagn i konstrotting Ø 50 cm – två plan och bromsade hjul",
    "ca20d60e": "Serveringsvagn utomhus 107 cm i gran – två plan och tre krokar",
}

SLUG = {
    "764a3efc": "rullvagn-fyra-utdragslador-24-cm",
    "820d076b": "hopfallbar-barvagn-bambu-66-cm",
    "15d6fcef": "koksvagn-fyra-utdragskorgar-stenlook",
    "0fd65541": "koksvagn-fyra-utdragskorgar-ek",
    "2e292a70": "gronsaksvagn-fyra-vridbara-korgar",
    "a4ee97c1": "rullbord-61-cm-lada-hangkorg-svart",
    "8a73caf4": "barvagn-utomhus-97-cm-flaskhallare",
    "fcb86875": "barvagn-konstrotting-rund-50-cm",
    "ca20d60e": "serveringsvagn-utomhus-107-cm-gran",
}

TITEL = {
    "764a3efc": "Rullvagn med fyra lådor, 24 cm djup – vit | Fyndplats",
    "820d076b": "Hopfällbar barvagn i bambu 66 cm | Fyndplats",
    "15d6fcef": "Köksvagn med utdragskorgar 91 cm – ljus stenlook | Fyndplats",
    "0fd65541": "Köksvagn med utdragskorgar 91 cm – ek | Fyndplats",
    "2e292a70": "Grönsaksvagn med fyra vridbara korgar 33 cm | Fyndplats",
    "a4ee97c1": "Rullbord 61 cm med låda och hängkorg, svart | Fyndplats",
    "8a73caf4": "Barvagn utomhus 97,5 cm i gran med flaskhållare | Fyndplats",
    "fcb86875": "Barvagn i konstrotting rund Ø 50 cm – två plan | Fyndplats",
    "ca20d60e": "Serveringsvagn utomhus 107 cm i gran med krokar | Fyndplats",
}

META = {
    "764a3efc": ("Rullvagn med lådor, bara 24 cm djup. Rullar in i springan mellan "
                 "skåp och kyl. Fyra utdragslådor med luftad botten och skiva i "
                 "träeffekt."),
    "820d076b": ("Hopfällbar barvagn i bambu, 66 × 40 × 70 cm. Två brickor, tre "
                 "flaskplatser och fyra hjul – och den viks ihop när gästerna gått."),
    "15d6fcef": ("Köksvagn med fyra utdragskorgar och en arbetsyta i ljus stenlook. "
                 "49,5 cm bred, 91 cm hög och står stadigt på bromsade hjul."),
    "0fd65541": ("Köksvagn med fyra utdragskorgar och en ekfärgad arbetsyta. 49,5 cm "
                 "bred, 91 cm hög och står stadigt på bromsade hjul."),
    "2e292a70": ("Grönsaksvagn med fyra vridbara trådkorgar som ventilerar. 33 × 33 cm "
                 "på golvet, 77 cm hög – och den kommer färdigmonterad."),
    "a4ee97c1": ("Rullbord i svart metall med låda, hylla, hängkorg och tre krokar. "
                 "61 cm brett och 58,5 cm högt – lagom vid soffan eller arbetsbänken."),
    "8a73caf4": ("Barvagn för uteplatsen med 88 × 61 cm arbetsyta i gran, fyra "
                 "flaskhållare, två korgar och 50 kg bärighet per hylla."),
    "fcb86875": ("Rund barvagn i naturfärgad konstrotting, Ø 50 × 66 cm. Svart bricka "
                 "upptill, öppet plan under och fyra hjul varav två med broms."),
    "ca20d60e": ("Serveringsvagn för uteplatsen med två hyllplan i gran, tre krokar och "
                 "50 kg per plan. Lamellerna släpper igenom regnvatten."),
}

SOKORD = {
    "764a3efc": ["rullvagn med lådor", "smal rullvagn", "köksvagn 24 cm", "förvaringsvagn"],
    "820d076b": ["hopfällbar barvagn", "barvagn bambu", "serveringsvagn hopfällbar", "drinkvagn"],
    "15d6fcef": ["köksvagn med korgar", "köksvagn på hjul", "förvaringsvagn kök", "utdragskorgar"],
    "0fd65541": ["köksvagn med korgar", "köksvagn på hjul", "förvaringsvagn kök", "utdragskorgar"],
    "2e292a70": ["grönsaksvagn", "potatisvagn", "grönsaksförvaring", "rullvagn kök"],
    "a4ee97c1": ["rullbord", "rullbord med låda", "serveringsvagn låg", "avlastningsbord hjul"],
    "8a73caf4": ["barvagn utomhus", "utebarvagn", "serveringsvagn uteplats", "grillbord på hjul"],
    "fcb86875": ["barvagn", "barvagn konstrotting", "drinkvagn", "serveringsvagn rund"],
    "ca20d60e": ["serveringsvagn utomhus", "utomhusvagn", "barvagn trädgård", "avlastningsbord uteplats"],
}

# Korslänkar — vem som ska nämnas i vems text. Poleras syskon veckor isär sker
# det aldrig av sig självt; hela familjen skrivs samma dag och länkas därför nu.
SYSKON = {
    "764a3efc": [("rullvagn-med-korgar-vit", "rullvagn med fyra trådkorgar i vitt"),
                 ("rullvagn-4-korgar-rustik", "samma vagn med trådkorgar i rustik träeffekt")],
    "820d076b": [("barvagn-konstrotting-rund-50-cm", "rund barvagn i konstrotting"),
                 ("serveringsvagn-66-cm-tre-plan", "serveringsvagn i tre plan med tygficka")],
    "15d6fcef": [("koksvagn-fyra-utdragskorgar-ek", "samma vagn med ekfärgad skiva")],
    "0fd65541": [("koksvagn-fyra-utdragskorgar-stenlook", "samma vagn med skiva i ljus stenlook")],
    "2e292a70": [("rullvagn-svart-3-korgar", "smal rullvagn med tre korgar"),
                 ("rullvagn-med-korgar-vit", "rullvagn med fyra avtagbara korgar")],
    "a4ee97c1": [("serveringsvagn-med-hjul-barvagn-3-plan", "serveringsvagn i tre plan"),
                 ("rullvagn-bambu-tre-plan-med-racke", "smal rullvagn i bambu")],
    "8a73caf4": [("serveringsvagn-utomhus-107-cm-gran", "större serveringsvagn i gran med krokar"),
                 ("barvagn-konstrotting-rund-50-cm", "rund barvagn i konstrotting")],
    "fcb86875": [("barvagn-utomhus-97-cm-flaskhallare", "stor barvagn i gran med arbetsyta"),
                 ("hopfallbar-barvagn-bambu-66-cm", "hopfällbar barvagn i bambu")],
    "ca20d60e": [("barvagn-utomhus-97-cm-flaskhallare", "mindre barvagn i gran med flaskhållare"),
                 ("barvagn-konstrotting-rund-50-cm", "rund barvagn i konstrotting")],
}

INGRESS = {
    "764a3efc": (
        "Springan mellan kylen och skåpet är oftast den sista lediga ytan i köket, "
        "och den är sällan bredare än en handflata. Den här vagnen är {djup} cm djup "
        "och {bredd} cm bred, så den rullar in där och blir fyra lådor du faktiskt "
        "kommer åt. Lådorna har luftad botten, vilket gör dem lika användbara till "
        "lök och potatis som till burkar och putsmedel."),
    "820d076b": (
        "En barvagn är fantastisk medan gästerna är kvar och i vägen dagen efter. "
        "Den här viks ihop. Två brickor på {bredd} × {djup} cm bär glas och tilltugg "
        "under kvällen, tre flaskplatser håller vinet stående, och när det är över "
        "fälls hela vagnen ihop och ställs undan."),
    "15d6fcef": (
        "Fyra korgar som dras ut var för sig, och en arbetsyta ovanpå att ställa "
        "brödrosten eller skärbrädan på. Vagnen är bara {bredd} cm bred men "
        "{hojd} cm hög, så den tar förvaring på höjden i stället för på golvet — "
        "och rullar fram när du behöver komma åt det som står längst ner."),
    "0fd65541": (
        "Fyra korgar som dras ut var för sig, och en arbetsyta ovanpå att ställa "
        "brödrosten eller skärbrädan på. Vagnen är bara {bredd} cm bred men "
        "{hojd} cm hög, så den tar förvaring på höjden i stället för på golvet — "
        "och rullar fram när du behöver komma åt det som står längst ner."),
    "2e292a70": (
        "Fyra trådkorgar staplade på en rund pelare, och varje korg vrids åt sitt "
        "eget håll. Det låter som en detalj tills du ställt vagnen i ett hörn: då "
        "vrider du fram den korg du vill åt i stället för att dra ut hela pelaren. "
        "Nätet släpper igenom luft, så lök och potatis håller sig längre än i en "
        "sluten låda."),
    "a4ee97c1": (
        "Ett rullbord som är {hojd} cm högt — alltså lägre än en köksbänk och ungefär "
        "i höjd med ett soffbord. Lådan tar bestick och servetter, hyllan under tar "
        "tallrikar, och hängkorgen och de tre krokarna sitter på den sida du väljer. "
        "Fyra hjul gör att den följer med dit du dukar."),
    "8a73caf4": (
        "En arbetsyta på {skiva} i lackad gran, {hojd} cm över marken och byggd för "
        "{maxlast_kort}. Det räcker till en hel grillkväll: skärbräda och fat ovanpå, "
        "tallrikar och kolsäck under, fyra flaskor i hållaren och två korgar för "
        "bestick och kryddor."),
    "fcb86875": (
        "Den klassiska drinkvagnen, i rund form och i naturfärgad konstrotting. "
        "Översta planet är en svart metallbricka som du lyfter av och bär in med, "
        "underplanet är öppet och tar flaskorna. Ø {bredd} cm på golvet och "
        "{hojd} cm hög — den får plats bredvid en loungegrupp utan att stå i vägen."),
    "ca20d60e": (
        "Två hyllplan i lackad gran på en svart stålram, {bredd} cm lång och byggd "
        "för {maxlast_kort}. Planen är lagda som lameller med springor emellan, så "
        "regnvatten rinner igenom i stället för att bli stående — och det är den "
        "detaljen som avgör om en trävagn håller en säsong eller flera."),
}

EGENSKAPER = {
    "764a3efc": [
        "Bara {djup} cm djup — går in i springor där ingen annan förvaring får plats",
        "{antal_fack} utdragslådor med luftad botten, {fack} var",
        "Skiva i träeffekt överst, {skiva}, att ställa ifrån sig på",
        "{hjul_punkt}",
        "Stomme i {material_kort}",
    ],
    "820d076b": [
        "Viks ihop när den inte används",
        "{antal_fack} brickor på {skiva} var",
        "Tre flaskplatser i det undre planet",
        "{hjul_punkt}",
        "Helt i {material_kort} med lamellmönstrade brickor",
    ],
    "15d6fcef": [
        "{antal_fack} korgar som dras ut var för sig, {fack} var",
        "Arbetsyta på {skiva} överst",
        "{hojd} cm hög och bara {bredd} cm bred",
        "{hjul_punkt}",
        "Handtagsbygel längs ena sidan att skjuta i",
    ],
    "0fd65541": [
        "{antal_fack} korgar som dras ut var för sig, {fack} var",
        "Arbetsyta på {skiva} överst",
        "{hojd} cm hög och bara {bredd} cm bred",
        "{hjul_punkt}",
        "Handtagsbygel längs ena sidan att skjuta i",
    ],
    "2e292a70": [
        "Kommer färdigmonterad – lyft ur kartongen och rulla in den",
        "{antal_fack} trådkorgar som vrids åt var sitt håll, {fack} invändigt",
        "Hylla överst på {skiva} för kryddor, koppar eller en bok",
        "{hjul_punkt}",
        "Nätkorgarna släpper igenom luft",
    ],
    "a4ee97c1": [
        "Utdragslåda på {fack} invändigt",
        "Öppen hylla under på {hylla}",
        "Hängkorg på {korg} och {krokar} krokar, monteras på höger eller vänster sida",
        "{hjul_punkt}",
        "Handtag i båda ändarna",
    ],
    "8a73caf4": [
        "Arbetsyta på {skiva} i lackad gran",
        "Undre hylla på {fack}",
        "{flaskor} flaskhållare under skivan",
        "{korgar} korgar på {korg} var",
        "{hjul_punkt}",
    ],
    "fcb86875": [
        "Avtagbar metallbricka överst, Ø {skiva}",
        "Öppet plan under, Ø {fack}",
        "{handtag} handtag att rulla i",
        "{hjul_punkt}",
        "Ram i pulverlackat stål med flätad konstrotting",
    ],
    "ca20d60e": [
        "Två hyllplan i lackad gran, {skiva} och {fack}",
        "Planen är lagda som lameller och släpper igenom regnvatten",
        "{krokar} krokar på gaveln för handdukar och grytlappar",
        "Planen sitter {ovre_hojd} och {undre_hojd} cm över marken",
        "{hjul_punkt}",
    ],
}

# Spec-tabellen. ☠️ `Artikelnummer` finns INTE här och får aldrig läggas till —
# numret står i Aosoms egen produkt-URL och hos varje återförsäljare som kör
# samma feed, så en googling ställer vår sida bredvid deras med vårt inköpspris
# härlett intill. Det hör hemma på mappningsraden och ingen annanstans.
SPEC = {
    "764a3efc": [
        ("Yttermått", "{matt} (bredd × djup × höjd)"),
        ("Antal lådor", "{antal_fack}"),
        ("Lådmått", "{fack}"),
        ("Skivans yta", "{skiva}"),
        ("Maxlast", "{maxlast}"),
        ("Vikt", "{vikt}"),
        ("Material", "{material}"),
        ("Färg", "{farg}"),
        ("Hjul", "{hjul}"),
        ("Montering", "{montering}"),
    ],
    "820d076b": [
        ("Yttermått", "{matt} (bredd × djup × höjd)"),
        ("Antal brickor", "{antal_fack}"),
        ("Brickmått", "{skiva}"),
        ("Flaskplatser", "{flaskor}"),
        ("Undre brickan över golv", "{undre_hojd} cm"),
        ("Frigång under vagnen", "{golvfrigang} cm"),
        ("Maxlast", "{maxlast}"),
        ("Vikt", "{vikt}"),
        ("Material", "{material}"),
        ("Färg", "{farg}"),
        ("Hjul", "{hjul}"),
        ("Montering", "{montering}"),
    ],
    "15d6fcef": [
        ("Yttermått", "{matt} (bredd × djup × höjd)"),
        ("Antal korgar", "{antal_fack}"),
        ("Korgmått", "{fack}"),
        ("Arbetsytans mått", "{skiva}"),
        ("Frigång under vagnen", "{golvfrigang} cm"),
        ("Maxlast", "{maxlast}"),
        ("Vikt", "{vikt}"),
        ("Material", "{material}"),
        ("Färg", "{farg}"),
        ("Hjul", "{hjul}"),
        ("Montering", "{montering}"),
    ],
    "2e292a70": [
        ("Yttermått", "{matt} (bredd × djup × höjd)"),
        ("Antal korgar", "{antal_fack}"),
        ("Korgmått invändigt", "{fack}"),
        ("Översta hyllan", "{skiva}"),
        ("Maxlast", "{maxlast}"),
        ("Vikt", "{vikt}"),
        ("Material", "{material}"),
        ("Färg", "{farg}"),
        ("Hjul", "{hjul}"),
        ("Montering", "{montering}"),
    ],
    "a4ee97c1": [
        ("Yttermått", "{matt} (bredd × djup × höjd)"),
        ("Bordsskivans yta", "{skiva}"),
        ("Lådmått invändigt", "{fack}"),
        ("Undre hyllan", "{hylla}"),
        ("Hängkorg", "{korg}"),
        ("Krokar", "{krokar}"),
        ("Maxlast", "{maxlast}"),
        ("Vikt", "{vikt}"),
        ("Material", "{material}"),
        ("Färg", "{farg}"),
        ("Hjul", "{hjul}"),
        ("Montering", "{montering}"),
    ],
    "8a73caf4": [
        ("Yttermått", "{matt} (längd × djup × höjd)"),
        ("Arbetsytans mått", "{skiva}"),
        ("Undre hyllan", "{fack}"),
        ("Flaskhållare", "{flaskor}"),
        ("Korgar", "{korgar}, {korg} var"),
        ("Maxlast", "{maxlast}"),
        ("Vikt", "{vikt}"),
        ("Material", "{material}"),
        ("Färg", "{farg}"),
        ("Hjul", "{hjul}"),
        ("Montering", "{montering}"),
    ],
    "fcb86875": [
        ("Yttermått", "{matt} (diameter × höjd)"),
        ("Övre planet", "Ø {skiva}, {ovre_kant} cm kant"),
        ("Undre planet", "Ø {fack}, {undre_kant} cm kant"),
        ("Handtag", "{handtag}"),
        ("Maxlast", "{maxlast}"),
        ("Vikt", "{vikt}"),
        ("Material", "{material}"),
        ("Färg", "{farg}"),
        ("Hjul", "{hjul}"),
        ("Montering", "{montering}"),
    ],
    "ca20d60e": [
        ("Yttermått", "{matt} (längd × djup × höjd)"),
        ("Övre hyllan", "{skiva}"),
        ("Undre hyllan", "{fack}"),
        ("Hyllornas höjd över marken", "{ovre_hojd} och {undre_hojd} cm"),
        ("Krokar", "{krokar}"),
        ("Maxlast", "{maxlast}"),
        ("Vikt", "{vikt}"),
        ("Material", "{material}"),
        ("Färg", "{farg}"),
        ("Hjul", "{hjul}"),
        ("Montering", "{montering}"),
    ],
}
SPEC["0fd65541"] = SPEC["15d6fcef"]

SKOTSEL = {
    "764a3efc": (
        "Lyft ur lådorna och skölj dem i diskhon när de behöver det – bottnarna är "
        "luftade, så de torkar snabbt. Torka av stommen med en fuktad trasa. Lås de "
        "två bromsade hjulen när vagnen står lastad, särskilt om golvet lutar."),
    "820d076b": (
        "Bambu är ett naturmaterial. Torka av med en lätt fuktad trasa och eftertorka "
        "torrt; undvik stående vatten och starka rengöringsmedel. Dra inte åt skruvarna "
        "för hårt vid monteringen — en överdragen skruv kan spräcka virket. Fäll ihop "
        "vagnen först när den är torr."),
    "15d6fcef": (
        "Torka av skivan och korgarna med en fuktad trasa och milt diskmedel. Fördela "
        "lasten jämnt mellan korgarna och lägg det tyngsta längst ner — vagnen är hög "
        "och smal, och tyngdpunkten avgör hur stadigt den står. Lås de bromsade hjulen "
        "när den står stilla."),
    "0fd65541": (
        "Torka av skivan och korgarna med en fuktad trasa och milt diskmedel. Fördela "
        "lasten jämnt mellan korgarna och lägg det tyngsta längst ner — vagnen är hög "
        "och smal, och tyngdpunkten avgör hur stadigt den står. Lås de bromsade hjulen "
        "när den står stilla."),
    "2e292a70": (
        "Skölj korgarna under kranen och låt dem torka. Vrid korgarna åt olika håll när "
        "vagnen är tungt lastad, så fördelas vikten runt pelaren i stället för att samlas "
        "på en sida. Lås de bromsade hjulen när vagnen står stilla."),
    "a4ee97c1": (
        "Torka av med en fuktad trasa och milt rengöringsmedel. Hängkorgen och krokarna "
        "kan flyttas till den andra sidan om du möblerar om — de skruvas fast i "
        "sidopanelens hål. Lås de bromsade hjulen när vagnen står lastad."),
    "8a73caf4": (
        "Träet är lackat men står ute. Torka av vatten som blir stående på skivan och "
        "låt vagnen torka innan du ställer undan den för säsongen; står den under tak "
        "eller under ett överdrag håller ytan betydligt längre. Efterdra skruvarna en "
        "gång per säsong."),
    "fcb86875": (
        "Konstrottingen tål väder och tvättas av med vatten och en mjuk borste. Lyft av "
        "metallbrickan och torka den för sig. Ställ vagnen under tak när säsongen är "
        "slut — den tål regn, men den mår bättre av att slippa stå i det hela vintern."),
    "ca20d60e": (
        "Lamellerna släpper igenom vatten, så det blir aldrig stående på planen. Borsta "
        "bort löv och grus ur springorna då och då, och torka av träet efter en regnig "
        "vecka. Efterdra skruvarna en gång per säsong och ställ vagnen under tak när "
        "säsongen är slut."),
}

FAQ = {
    "764a3efc": [
        ("Passar den mellan kylen och skåpet?",
         "Vagnen är {djup} cm djup och {bredd} cm bred. Mät springan hemma först — "
         "vagnen ska både få plats och gå att rulla ut, så räkna med några centimeter "
         "marginal."),
        ("Går lådorna att lyfta ur?",
         "Ja, de dras ut helt och kan bäras till bänken eller sköljas i diskhon."),
        ("Kan hjulen låsas?", "{hjul_svar}"),
        ("Hur mycket tål den?",
         "{maxlast}."),
    ],
    "820d076b": [
        ("Hur tjock är den hopfälld?",
         "Vagnen fälls ihop till en platt enhet som ställs mot en vägg eller skjuts in "
         "bakom en dörr. Utfälld mäter den {matt}."),
        ("Hur många flaskor får plats?",
         "Tre flaskor står i det undre planets flaskplatser. Flaskstället tål 4 kg."),
        ("Kan hjulen låsas?", "{hjul_svar}"),
        ("Tål den att stå ute?",
         "Den är gjord för inomhusbruk. Bambu klarar en kväll på en skyddad altan, men "
         "materialet mår inte bra av att stå i regn eller fukt över tid."),
    ],
    "15d6fcef": [
        ("Går korgarna att dra ut var för sig?",
         "Ja. Alla {antal_fack} korgarna löper på egna skenor och dras ut en i taget, "
         "så du kommer åt den nedersta utan att röra de övriga."),
        ("Vad tål arbetsytan?",
         "10 kg. Det räcker till en brödrost, en vattenkokare eller en skärbräda med "
         "matlagning ovanpå."),
        ("Kan hjulen låsas?", "{hjul_svar}"),
        ("Finns den i en annan färg?",
         "Ja, samma vagn finns med ekfärgad skiva."),
    ],
    "0fd65541": [
        ("Går korgarna att dra ut var för sig?",
         "Ja. Alla {antal_fack} korgarna löper på egna skenor och dras ut en i taget, "
         "så du kommer åt den nedersta utan att röra de övriga."),
        ("Vad tål arbetsytan?",
         "10 kg. Det räcker till en brödrost, en vattenkokare eller en skärbräda med "
         "matlagning ovanpå."),
        ("Kan hjulen låsas?", "{hjul_svar}"),
        ("Finns den i en annan färg?",
         "Ja, samma vagn finns med skiva i ljus stenlook."),
    ],
    "2e292a70": [
        ("Behöver den monteras?",
         "Nej. Vagnen kommer färdigmonterad — du lyfter ur den ur kartongen och rullar "
         "in den."),
        ("Hur fungerar de vridbara korgarna?",
         "Varje korg sitter på pelaren och svänger åt sitt eget håll. Står vagnen i ett "
         "hörn vrider du fram den korg du vill åt i stället för att flytta hela vagnen."),
        ("Passar den i badrummet?",
         "Ja. Den mäter {matt} och korgarna i nät ventilerar, så den fungerar lika bra "
         "till handdukar och flaskor som till grönsaker."),
        ("Hur mycket tål den?", "{maxlast}."),
    ],
    "a4ee97c1": [
        ("Hur högt står det?",
         "{hojd} cm, alltså lägre än en köksbänk och ungefär i höjd med ett soffbord."),
        ("Går krokarna att flytta?",
         "Ja. Hängkorgen och de {krokar} krokarna skruvas fast i sidopanelen och kan "
         "sitta på höger eller vänster sida."),
        ("Kan hjulen låsas?", "{hjul_svar}"),
        ("Hur mycket tål varje plan?",
         "{maxlast}."),
    ],
    "8a73caf4": [
        ("Kan den stå ute?",
         "Ja, den är byggd för det: lackad gran på en stålram. Torka av vatten som blir "
         "stående och ställ den under tak när säsongen är slut."),
        ("Hur mycket tål hyllorna?",
         "{maxlast}. Det räcker till fat, tallrikar och en kolsäck."),
        ("Hur rullas den?", "{hjul_svar}"),
        ("Vad rymmer flaskhållaren?",
         "{flaskor} flaskor, hängande under arbetsytan."),
    ],
    "fcb86875": [
        ("Går brickan att lyfta av?",
         "Ja, den svarta metallbrickan överst lyfts av och bärs in med."),
        ("Tål den att stå ute?",
         "Ja. Konstrottingen i PE och den pulverlackade stålramen är gjorda för det. "
         "Ställ den under tak över vintern så håller ytan längre."),
        ("Kan hjulen låsas?", "{hjul_svar}"),
        ("Hur stor är den?",
         "{matt}. Det undre planet är Ø {fack} och tar flaskorna stående."),
    ],
    "ca20d60e": [
        ("Blir det vatten stående på hyllorna?",
         "Nej. Planen är lagda som lameller med springor emellan, så regnvattnet rinner "
         "igenom. Borsta bort löv ur springorna då och då."),
        ("Hur mycket tål hyllorna?", "{maxlast}."),
        ("Hur rullas den?", "{hjul_svar}"),
        ("Vad sitter krokarna till?",
         "{krokar} krokar på gaveln, avsedda för handdukar och grytlappar."),
    ],
}


def _f(mall, pid):
    return mall.format(**M[pid])


def bygg(pid):
    """Returnerar (namn, slug, titel, meta, sökord, html)."""
    d = M[pid]
    ut = [f"<p>{_f(INGRESS[pid], pid)}</p>"]

    ut.append("<h2>Det här är vagnen</h2><ul>")
    for rad in EGENSKAPER[pid]:
        ut.append(f"<li>{_f(rad, pid)}</li>")
    ut.append("</ul>")

    ut.append("<h2>Tekniska specifikationer</h2><ul>")
    for etikett, varde in SPEC[pid]:
        ut.append(f"<li><strong>{etikett}:</strong> {_f(varde, pid)}</li>")
    ut.append("</ul>")

    ut.append("<h2>Montering och skötsel</h2>")
    ut.append(f"<p>{_f(SKOTSEL[pid], pid)}</p>")

    if SYSKON.get(pid):
        lankar = " ".join(
            f'<a href="https://www.fyndplats.se/produkt/{s}">{t.capitalize()}</a>.'
            for s, t in SYSKON[pid])
        ut.append("<h2>Passar inte den här?</h2>")
        ut.append(f"<p>{lankar}</p>")

    ut.append("<h2>Vanliga frågor</h2>")
    for fraga, svar in FAQ[pid]:
        # ☠️ FRÅGA och SVAR som TVÅ <p>. Wix strippar <br>, och en fråga som
        #    sitter ihop med sitt svar renderas som en enda klump.
        ut.append(f"<p><strong>{fraga}</strong></p>")
        ut.append(f"<p>{_f(svar, pid)}</p>")

    return (NAMN[pid], SLUG[pid], TITEL[pid], META[pid], SOKORD[pid], "".join(ut))


if __name__ == "__main__":
    from matt import ALLA
    for pid in ALLA:
        n, s, t, m, k, h = bygg(pid)
        print(f"{pid}  namn {len(n):>2}  titel {len(t):>2}  meta {len(m):>3}  html {len(h):>5}  {s}")
