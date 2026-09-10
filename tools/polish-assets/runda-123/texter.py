# -*- coding: utf-8 -*-
"""Runda 123: nio öppna verktygsvagnar med hyllplan.

☠️ FLIKRUBRIKERNA ÄR EN ALLOWLIST PÅ FYRA STRÄNGAR i butikens `splitFlikar`.
   Rubriken måste heta `Användning och skötsel` ORDAGRANT, och korslänkarna
   måste ligga FÖRE `<h2>Tekniska specifikationer</h2>`.

☠️ `db2f05f9`:S MAXLAST STÅR INTE PÅ SIDAN. 227 kg är familjens högsta tal och
   sitter på dess enda plastvagn med två plan — 51 % över stålvagnar som väger
   lika mycket. Se STEG2-5.md punkt 8. Skriv inte in det.

☠️ FÄRGEN AVGÖRS AV BILDEN, inte av spec-blocket. `2bf00891` har NOLL rött på
   varan trots `Schwarz+Rot` i specen; `7be028f5` HAR röda stolpar trots att
   namnet bara säger svart. Facit ligger åt olika håll i samma familj.

🔒 Inget avsändarland. Inga priser. Inga påhittade tal.
"""

NAMN = {
    "887d388d": "Verktygsvagn 83 cm med tre hyllplan och verktygshål – svart och röd",
    "7be028f5": "Verktygsvagn 81 cm med tre släta hyllplan – svart och röd",
    "46a5eeda": "Smal verktygsvagn 56,5 cm med hålskivor och tio krokar",
    "c8105590": "Verkstadsvagn i metall 70,5 cm med tre plan och sidohållare",
    "df9475dc": "Verktygsvagn i stål 83 cm med tre plan och höga kanter",
    "4e0a06c0": "Verkstadsvagn i stål med två djupa plan – 84,5 cm på fyra hjul",
    "db2f05f9": "Verktygsvagn 102,6 cm med två plan och verktygsplatta",
    "2bf00891": "Hopfällbar verktygsvagn med tre plan – fälls till 18,5 cm",
    "12cb8a2c": "Verkstadsvagn i stål med låsbar låda, tre plan och hålskivor",
}

SLUG = {
    "887d388d": "verktygsvagn-83-cm-tre-plan-verktygshal",
    "7be028f5": "verktygsvagn-81-cm-tre-slata-plan",
    "46a5eeda": "verktygsvagn-smal-56-cm-tio-krokar",
    "c8105590": "verkstadsvagn-metall-70-cm-tre-plan",
    "df9475dc": "verktygsvagn-stal-83-cm-hoga-kanter",
    "4e0a06c0": "verkstadsvagn-stal-tva-djupa-plan",
    "db2f05f9": "verktygsvagn-102-cm-verktygsplatta",
    "2bf00891": "verktygsvagn-hopfallbar-18-cm",
    "12cb8a2c": "verkstadsvagn-stal-lasbar-lada",
}

SKU = {
    "887d388d": "FP-verktygsvagn-83-cm-verktygshal",
    "7be028f5": "FP-verktygsvagn-81-cm-slata-plan",
    "46a5eeda": "FP-verktygsvagn-smal-tio-krokar",
    "c8105590": "FP-verkstadsvagn-metall-tre-plan",
    "df9475dc": "FP-verktygsvagn-stal-hoga-kanter",
    "4e0a06c0": "FP-verkstadsvagn-stal-tva-plan",
    "db2f05f9": "FP-verktygsvagn-102-cm-platta",
    "2bf00891": "FP-verktygsvagn-hopfallbar",
    "12cb8a2c": "FP-verkstadsvagn-lasbar-lada",
}

TITEL = {
    "887d388d": "Verktygsvagn 83 cm, tre plan med verktygshål | Fyndplats",
    "7be028f5": "Verktygsvagn 81 cm med tre släta hyllplan | Fyndplats",
    "46a5eeda": "Smal verktygsvagn 56,5 cm med tio krokar | Fyndplats",
    "c8105590": "Verkstadsvagn i metall 70,5 cm, tre plan | Fyndplats",
    "df9475dc": "Verktygsvagn i stål 83 cm med tre plan | Fyndplats",
    "4e0a06c0": "Verkstadsvagn i stål med två djupa plan | Fyndplats",
    "db2f05f9": "Verktygsvagn 102,6 cm med verktygsplatta | Fyndplats",
    "2bf00891": "Hopfällbar verktygsvagn, tre plan | Fyndplats",
    "12cb8a2c": "Verkstadsvagn i stål med låsbar låda | Fyndplats",
}

META = {
    "887d388d": "Verktygsvagn 83 × 43 × 97 cm i plast med tre hyllplan, gjutna verktygshål och sidohandtag. Fyra hjul, två med broms. Tål 91 kg.",
    "7be028f5": "Verktygsvagn 81 × 43 × 96 cm i plast med tre släta hyllplan och 35 cm fritt emellan. Fyra hjul, två med broms. Tål 68 kg.",
    "46a5eeda": "Smal verktygsvagn 56,5 × 47,5 × 89 cm med tre plan, hålskivor på sidan och tio krokar. Nio verktygshål. Tål 91 kg.",
    "c8105590": "Verkstadsvagn 70,5 × 35 × 82,5 cm i pulverlackerad metall med tre plan, rundade hörn och sidohållare. Tål 120 kg, 40 kg per plan.",
    "df9475dc": "Verktygsvagn i stål 83 × 35,3 × 76 cm med tre plan och 7 cm höga kanter. Fyra hjul, två med broms. Tål 150 kg, 50 kg per plan.",
    "4e0a06c0": "Verkstadsvagn i stål 84,5 × 38 × 84 cm med två djupa plan och 57,3 cm fritt emellan. Tål 150 kg totalt och 75 kg per plan.",
    "db2f05f9": "Verktygsvagn 102,6 × 43,5 × 84,5 cm i plast med två plan, facktrennare och en verktygsplatta på 42,5 × 21,5 cm.",
    "2bf00891": "Hopfällbar verktygsvagn 64 × 37 × 84 cm med tre plan i plast och ram i stål. Fälls till 18,5 cm tjocklek. Tål 68 kg.",
    "12cb8a2c": "Verkstadsvagn i stål 78 × 35 × 73 cm med låsbar låda, tre plan och hålskivor. Fyra gjutna hjul. Tål 90 kg, 30 kg per plan.",
}

SOKORD = {
    "887d388d": ["verktygsvagn tre hyllplan", "verktygsvagn plast", "verkstadsvagn hjul", "verktygsvagn"],
    "7be028f5": ["verktygsvagn tre hyllplan", "verktygsvagn plast", "avlastningsvagn verkstad", "verktygsvagn"],
    "46a5eeda": ["smal verktygsvagn", "verktygsvagn med krokar", "verktygsvagn hålskiva", "verktygsvagn"],
    "c8105590": ["verkstadsvagn metall", "verktygsvagn tre plan", "servicevagn verkstad", "verkstadsvagn"],
    "df9475dc": ["verktygsvagn stål", "verktygsvagn tre plan", "verkstadsvagn stål", "verktygsvagn"],
    "4e0a06c0": ["verkstadsvagn stål", "verktygsvagn två plan", "verkstadsvagn djupa plan", "verkstadsvagn"],
    "db2f05f9": ["verktygsvagn två plan", "stor verktygsvagn", "verkstadsvagn bred", "verktygsvagn"],
    "2bf00891": ["hopfällbar verktygsvagn", "vikbar verkstadsvagn", "verktygsvagn som fälls ihop", "verktygsvagn"],
    "12cb8a2c": ["verkstadsvagn låsbar låda", "verktygsvagn med lås", "verkstadsvagn stål", "verkstadsvagn"],
}

INTRO = {
    "887d388d": "Tre hyllplan, gjutna hål för skruvmejslar och sprayflaskor, och fyra hjul som tar vagnen dit arbetet är. Den här verktygsvagnen håller ihop det du håller på med i stället för att sprida ut det över golvet.",
    "7be028f5": "Tre släta hyllplan med 35 cm fritt emellan — plats för verktygslådor, burkar och maskiner som inte får plats någon annanstans. Sidohandtaget gör den lätt att rulla, och två av fyra hjul har broms.",
    "46a5eeda": "En verktygsvagn för smala utrymmen: 56,5 cm bred, men med tre plan, hålskivor på sidan och tio krokar. Det du använder oftast hänger framme i stället för att ligga i botten på en låda.",
    "c8105590": "En verkstadsvagn i pulverlackerad metall med tre rejäla plan och rundade hörn. Sidohållarna tar det som inte ska ligga plant, och det ergonomiska handtaget gör den lätt att skjuta även fullastad.",
    "df9475dc": "Tre plan i stål med 7 cm höga kanter runt om — det som ligger på hyllan stannar där även när du rullar över en tröskel. En verktygsvagn för den som lastar tungt och kör mycket.",
    "4e0a06c0": "Två djupa plan med 57,3 cm fritt emellan: höjden som gör att en batteridriven maskin i sin väska får plats stående. Stålkonstruktion, fyra hjul och ett sidohandtag att skjuta i.",
    "db2f05f9": "Familjens bredaste vagn — 102,6 cm mellan hjulen och två plan på 76 × 41 cm. Ovanpå sitter en verktygsplatta med fack, så småskruv och bits inte hamnar i samma hög som allt annat.",
    "2bf00891": "Tre plan när du arbetar, 18,5 cm tjock när du inte gör det. Den här verktygsvagnen fälls ihop och ställs undan bakom dörren, mot väggen eller i bagageutrymmet — och fälls ut igen på några sekunder.",
    "12cb8a2c": "Tre öppna plan för det du använder dagligen, hålskivor på sidorna för det som ska hänga framme, och en låsbar låda för det som inte ska försvinna. En verkstadsvagn i pulverlackerat stål.",
}

RUBRIK = {
    "887d388d": "Tre plan med gjutna verktygshål",
    "7be028f5": "Tre släta plan och 35 cm fritt emellan",
    "46a5eeda": "Smal på golvet, stor på väggen",
    "c8105590": "Metallram, rundade hörn, tre plan",
    "df9475dc": "Höga kanter runt varje plan",
    "4e0a06c0": "Två plan med höjd för maskinväskor",
    "db2f05f9": "Bredast i familjen, med verktygsplatta",
    "2bf00891": "Fälls ihop till 18,5 cm",
    "12cb8a2c": "Låsbar låda och hålskivor",
}

PUNKTER = {
    "887d388d": [
        "Tre hyllplan på 67,5 × 42,5 cm med 30 cm fritt emellan.",
        "Gjutna hål och urtag i mellan- och bottenplanet håller skruvmejslar, tänger och sprayflaskor stående.",
        "Sidohandtag med 83,5 cm mellan greppen — du skjuter med båda händerna.",
        "Fyra hjul, två av dem med broms.",
        "Chassi i plast som inte rostar och tål fukt och olja.",
        "Tål 91 kg totalt för hela vagnen.",
        "Måtten är 83 × 43 × 97 cm och vagnen väger 8 kg.",
    ],
    "7be028f5": [
        "Tre släta hyllplan på 64,5 × 42 cm — inga urtag, hela ytan är användbar.",
        "35 cm fritt mellan planen, och 13,5 cm upp från golvet till det nedersta.",
        "Sidohandtag med 81 cm mellan greppen.",
        "Fyra hjul, två av dem med broms.",
        "Chassi i plast som inte rostar och tål fukt och olja.",
        "Tål 68 kg totalt för hela vagnen.",
        "Måtten är 81 × 43 × 96 cm och vagnen väger 8 kg.",
    ],
    "46a5eeda": [
        "Bara 56,5 cm bred — går in där en full verkstadsvagn inte kommer fram.",
        "Tre plan på 48 × 27 cm med 30 cm fritt emellan.",
        "Hålskivor på sidan och tio krokar för det du använder oftast.",
        "Nio gjutna verktygshål i planen håller handverktyg stående.",
        "Två mellanväggar följer med och kan sättas in i planen eller lämnas ute.",
        "Fyra hjul, två av dem med broms.",
        "Tål 91 kg totalt för hela vagnen.",
        "Måtten är 56,5 × 47,5 × 89 cm och vagnen väger 11 kg.",
    ],
    "c8105590": [
        "Ram i metall med pulverlackerad yta som står emot rost och nötning.",
        "Tre plan på 64,5 × 35,5 cm med 28 cm fritt emellan.",
        "Rundade, stötdämpande hörn — mindre risk att slå i knogarna eller skada dörrfoder.",
        "Sidohållare för det som inte ska ligga plant.",
        "Ergonomiskt handtag på 34,5 cm att skjuta och dra i.",
        "Fyra länkhjul, två av dem med broms.",
        "Tål 120 kg totalt och 40 kg per plan.",
        "Måtten är 70,5 × 35 × 82,5 cm och vagnen väger 9,8 kg.",
    ],
    "df9475dc": [
        "Tre plan i stål med 7 cm höga kanter runt om, så inget rullar av.",
        "Planen mäter 68,7 × 33,7 cm, 69,5 × 34,5 cm och 70 × 35 cm nerifrån räknat.",
        "30 cm fritt mellan planen.",
        "Sidohandtag att skjuta i.",
        "Fyra hjul, två av dem med broms.",
        "Tål 150 kg totalt och 50 kg per plan.",
        "Måtten är 83 × 35,3 × 76 cm och vagnen väger 10,8 kg.",
    ],
    "4e0a06c0": [
        "Två djupa plan på 74,5 × 38,5 cm och 74 × 38 cm, båda med 9 cm höga kanter.",
        "57,3 cm fritt mellan planen — en maskinväska får plats stående.",
        "Stålkonstruktion genom hela vagnen.",
        "Sidohandtag att skjuta i.",
        "Fyra länkhjul, två av dem med broms.",
        "Tål 150 kg totalt och 75 kg per plan.",
        "Måtten är 84,5 × 38 × 84 cm och vagnen väger 10,8 kg.",
    ],
    "db2f05f9": [
        "Två plan på 76 × 41 cm med 57 cm fritt emellan.",
        "Verktygsplatta på 42,5 × 21,5 cm ovanpå, med fack för bits, hylsor och småskruv.",
        "Facktrennare i planen delar upp ytan så inget glider ihop.",
        "Sidohandtag med 42,5 cm mellan greppen.",
        "Fyra hjul, två av dem med broms.",
        "Chassi i plast som inte rostar och tål fukt och olja.",
        "Måtten är 102,6 × 43,5 × 84,5 cm och vagnen väger 16 kg.",
    ],
    "2bf00891": [
        "Fälls ihop till 18,5 cm tjocklek och ställs undan platt mot en vägg.",
        "Tre plan på 54,5 × 33,5 cm med 30 cm fritt emellan när vagnen är utfälld.",
        "Ram i stål med hyllplan i tjock plast.",
        "Sidohandtag med 56 cm mellan greppen.",
        "Fyra hjul som svänger 360 grader, två av dem med broms.",
        "Tål 68 kg totalt för hela vagnen.",
        "Utfälld mäter vagnen 64 × 37 × 84 cm och den väger 8,5 kg.",
    ],
    "12cb8a2c": [
        "Låsbar låda med nyckel för det som inte ska ligga framme.",
        "Tre öppna plan på 65,7 × 34 cm med 5 cm höga kanter.",
        "Hålskivor på båda sidorna för krokar och hängande verktyg.",
        "Ram i stål med pulverlackerad yta som står emot rost och nötning.",
        "Fyra gjutna industrihjul, två av dem med broms.",
        "Tål 90 kg totalt och 30 kg per plan.",
        "Måtten är 78 × 35 × 73 cm och vagnen väger 17 kg.",
    ],
}

SPEC = {
    "887d388d": [
        ("Material", "plast"),
        ("Färg", "svart och röd"),
        ("Totalmått", "83 × 43 × 97 cm (L × B × H)"),
        ("Hyllplan", "67,5 × 42,5 cm, tre stycken"),
        ("Fritt utrymme mellan planen", "30 cm"),
        ("Avstånd mellan handtagen", "83,5 cm"),
        ("Maxlast", "91 kg totalt för hela vagnen"),
        ("Hjul", "fyra stycken, två av dem med broms"),
        ("Vikt", "8 kg"),
        ("Montering", "krävs"),
    ],
    "7be028f5": [
        ("Material", "plast"),
        ("Färg", "svart och röd"),
        ("Totalmått", "81 × 43 × 96 cm (L × B × H)"),
        ("Hyllplan", "64,5 × 42 cm, tre stycken"),
        ("Fritt utrymme mellan planen", "35 cm"),
        ("Höjd från golv till nedersta planet", "13,5 cm"),
        ("Avstånd mellan handtagen", "81 cm"),
        ("Maxlast", "68 kg totalt för hela vagnen"),
        ("Hjul", "fyra stycken, två av dem med broms"),
        ("Vikt", "8 kg"),
        ("Montering", "krävs"),
    ],
    "46a5eeda": [
        ("Material", "plast"),
        ("Färg", "svart och röd"),
        ("Totalmått", "56,5 × 47,5 × 89 cm (L × B × H)"),
        ("Hyllplan", "48 × 27 cm, tre stycken"),
        ("Fritt utrymme mellan planen", "30 cm"),
        ("Maxlast", "91 kg totalt för hela vagnen"),
        ("Hjul", "fyra stycken, två av dem med broms"),
        ("Ingår", "vagn, hålskivor, tio krokar och två mellanväggar"),
        ("Vikt", "11 kg"),
        ("Montering", "krävs"),
    ],
    "c8105590": [
        ("Material", "metall med pulverlackerad yta, detaljer i plast"),
        ("Färg", "svart"),
        ("Totalmått", "70,5 × 35 × 82,5 cm (L × B × H)"),
        ("Plan", "64,5 × 35,5 cm, tre stycken"),
        ("Fritt utrymme mellan planen", "28 cm"),
        ("Handtag", "34,5 cm"),
        ("Maxlast", "120 kg totalt och 40 kg per plan"),
        ("Hjul", "fyra länkhjul, två av dem med broms"),
        ("Vikt", "9,8 kg"),
        ("Montering", "krävs"),
    ],
    "df9475dc": [
        ("Material", "stål"),
        ("Färg", "svart"),
        ("Totalmått", "83 × 35,3 × 76 cm (L × B × H)"),
        ("Nedersta planet", "70 × 35 cm, 7 cm höga kanter"),
        ("Mellersta planet", "69,5 × 34,5 cm, 7 cm höga kanter"),
        ("Översta planet", "68,7 × 33,7 cm, 7 cm höga kanter"),
        ("Fritt utrymme mellan planen", "30 cm"),
        ("Maxlast", "150 kg totalt och 50 kg per plan"),
        ("Hjul", "fyra stycken, två av dem med broms"),
        ("Vikt", "10,8 kg"),
        ("Montering", "krävs"),
    ],
    "4e0a06c0": [
        ("Material", "stål"),
        ("Färg", "svart"),
        ("Totalmått", "84,5 × 38 × 84 cm (L × B × H)"),
        ("Översta planet", "74,5 × 38,5 cm, 9 cm höga kanter"),
        ("Nedersta planet", "74 × 38 cm, 9 cm höga kanter"),
        ("Fritt utrymme mellan planen", "57,3 cm"),
        ("Maxlast", "150 kg totalt och 75 kg per plan"),
        ("Hjul", "fyra länkhjul, två av dem med broms"),
        ("Vikt", "10,8 kg"),
        ("Montering", "krävs"),
    ],
    "db2f05f9": [
        ("Material", "plast"),
        ("Färg", "svart"),
        ("Totalmått", "102,6 × 43,5 × 84,5 cm (L × B × H)"),
        ("Plan", "76 × 41 cm, två stycken"),
        ("Verktygsplatta", "42,5 × 21,5 cm"),
        ("Fritt utrymme mellan planen", "57 cm"),
        ("Avstånd mellan handtagen", "42,5 cm"),
        ("Hjul", "fyra stycken, två av dem med broms"),
        ("Vikt", "16 kg"),
        ("Montering", "krävs"),
    ],
    "2bf00891": [
        ("Material", "stål och plast"),
        ("Färg", "svart"),
        ("Totalmått utfälld", "64 × 37 × 84 cm (L × B × H)"),
        ("Tjocklek hopfälld", "18,5 cm"),
        ("Hyllplan", "54,5 × 33,5 cm, tre stycken"),
        ("Fritt utrymme mellan planen", "30 cm"),
        ("Avstånd mellan handtagen", "56 cm"),
        ("Maxlast", "68 kg totalt för hela vagnen"),
        ("Hjul", "fyra stycken som svänger 360 grader, två av dem med broms"),
        ("Vikt", "8,5 kg"),
        ("Montering", "krävs"),
    ],
    "12cb8a2c": [
        ("Material", "stål med pulverlackerad yta, detaljer i plast"),
        ("Färg", "svart"),
        ("Totalmått", "78 × 35 × 73 cm (L × B × H)"),
        ("Plan", "65,7 × 34 cm, tre stycken med 5 cm höga kanter"),
        ("Låda", "en, låsbar med nyckel"),
        ("Maxlast", "90 kg totalt och 30 kg per plan"),
        ("Hjul", "fyra gjutna industrihjul, två av dem med broms"),
        ("Vikt", "17 kg"),
        ("Montering", "krävs"),
    ],
}

# Två bruksbesked går igen på alla nio, för de gäller varje vagn på hjul:
# lås bromsarna innan du lastar, och lägg tyngst längst ner.
SKOTSEL = {
    "887d388d": "Ställ vagnen på plant golv och lås de två bromsade hjulen innan du lastar. Lägg det tyngsta på det nedersta planet — då står vagnen stadigare och rullar lättare. Använd de gjutna hålen till det som ska stå upp: skruvmejslar, tänger, sprayflaskor. Plasten rostar inte och tål både fukt och spilld olja; torka av med en fuktig trasa och milt rengöringsmedel, och undvik lösningsmedel som kan matta ytan.",
    "7be028f5": "Ställ vagnen på plant golv och lås de två bromsade hjulen innan du lastar. Lägg det tyngsta på det nedersta planet — då står vagnen stadigare och rullar lättare. De släta planen är lätta att torka av: en fuktig trasa och milt rengöringsmedel räcker. Plasten rostar inte och tål fukt och spilld olja, men undvik lösningsmedel som kan matta ytan.",
    "46a5eeda": "Ställ vagnen på plant golv och lås de två bromsade hjulen innan du lastar. Vagnen är smal, så håll tyngdpunkten låg: det tyngsta hör hemma på det nedersta planet, och krokarna är till för det lätta. Häng de verktyg du använder oftast på hålskivorna, så slipper du leta. Mellanväggarna sätts in eller lämnas ute beroende på vad du förvarar. Torka av med en fuktig trasa och milt rengöringsmedel.",
    "c8105590": "Ställ vagnen på plant golv och lås de två bromsade hjulen innan du lastar. Håll dig under 40 kg per plan och lägg det tyngsta längst ner. Den pulverlackerade ytan står emot rost och nötning, men ett djupt jack ner till metallen bör bättras så att fukt inte kommer åt. Torka av med en fuktig trasa och milt rengöringsmedel; undvik stålull och slipande medel som repar lacken.",
    "df9475dc": "Ställ vagnen på plant golv och lås de två bromsade hjulen innan du lastar. Håll dig under 50 kg per plan och lägg det tyngsta längst ner. De höga kanterna håller kvar det som ligger på hyllan, men lasta inte högre än kanten om du ska rulla över trösklar. Torka av med en fuktig trasa och milt rengöringsmedel, och torka bort spilld olja innan den hinner ligga kvar.",
    "4e0a06c0": "Ställ vagnen på plant golv och lås de två bromsade hjulen innan du lastar. Håll dig under 75 kg per plan och lägg det tyngsta längst ner. Höjden mellan planen är 57,3 cm, så en maskinväska får plats stående i stället för liggande. Torka av med en fuktig trasa och milt rengöringsmedel, och torka bort spilld olja innan den hinner ligga kvar.",
    "db2f05f9": "Ställ vagnen på plant golv och lås de två bromsade hjulen innan du lastar. Lägg det tyngsta på det nedersta planet — vagnen är bred, och en låg tyngdpunkt gör den lättare att styra genom en dörr. Verktygsplattan är till för det små: bits, hylsor, skruv. Plasten rostar inte och tål fukt och spilld olja; torka av med en fuktig trasa och milt rengöringsmedel.",
    "2bf00891": "Fäll ut vagnen på plant golv och kontrollera att låsningen gått i botten innan du lastar. Lås sedan de två bromsade hjulen. Lägg det tyngsta på det nedersta planet. Töm alla plan innan du fäller ihop den, och håll händerna borta från leden när den viks. Hopfälld är vagnen 18,5 cm tjock och ställs platt mot en vägg. Torka av med en fuktig trasa och milt rengöringsmedel.",
    "12cb8a2c": "Ställ vagnen på plant golv och lås de två bromsade hjulen innan du lastar. Håll dig under 30 kg per plan och lägg det tyngsta längst ner. Lådan låses med nyckel — förvara reservnyckeln någon annanstans än i vagnen. Den pulverlackerade ytan står emot rost och nötning; torka av med en fuktig trasa och milt rengöringsmedel, och undvik stålull och slipande medel som repar lacken.",
}

FAQ = {
    "887d388d": [
        ("Hur mycket tål verktygsvagnen?", "91 kg totalt för hela vagnen. Fördela vikten mellan planen och lägg det tyngsta längst ner."),
        ("Vad är hålen i hyllplanen till för?", "De håller handverktyg och flaskor stående i stället för liggande — skruvmejslar, tänger, sprayflaskor och liknande."),
        ("Går hjulen att låsa?", "Ja, två av de fyra hjulen har broms så att vagnen står stilla där du parkerar den."),
        ("Ingår verktygen som syns på bilderna?", "Nej. De visar bara hur vagnen kan användas. I leveransen ingår vagnen och en monteringsanvisning."),
        ("Behöver vagnen monteras?", "Ja, den levereras omonterad och sätts ihop av de medföljande delarna."),
    ],
    "7be028f5": [
        ("Hur mycket tål verktygsvagnen?", "68 kg totalt för hela vagnen. Fördela vikten mellan planen och lägg det tyngsta längst ner."),
        ("Hur högt är det mellan hyllplanen?", "35 cm, vilket rymmer de flesta verktygslådor, burkar och mindre maskiner."),
        ("Går hjulen att låsa?", "Ja, två av de fyra hjulen har broms så att vagnen står stilla där du parkerar den."),
        ("Ingår verktygen som syns på bilderna?", "Nej. De visar bara hur vagnen kan användas. I leveransen ingår vagnen och en manual."),
        ("Behöver vagnen monteras?", "Ja, den levereras omonterad och sätts ihop av de medföljande delarna."),
    ],
    "46a5eeda": [
        ("Hur mycket tål verktygsvagnen?", "91 kg totalt för hela vagnen. Vagnen är smal, så håll tyngdpunkten låg och lägg det tyngsta på det nedersta planet."),
        ("Hur många krokar följer med?", "Tio, och de hängs på hålskivorna som sitter på sidan."),
        ("Måste mellanväggarna sitta i?", "Nej, de två mellanväggarna är valfria. Sätt in dem när du vill dela upp ett plan och lämna ute dem när du behöver hela ytan."),
        ("Går hjulen att låsa?", "Ja, två av de fyra hjulen har broms så att vagnen står stilla där du parkerar den."),
        ("Ingår verktygen som syns på bilderna?", "Nej. De visar bara hur vagnen kan användas. I leveransen ingår vagnen, hålskivorna, tio krokar och två mellanväggar."),
    ],
    "c8105590": [
        ("Hur mycket tål verkstadsvagnen?", "120 kg totalt och 40 kg per plan. Lägg det tyngsta längst ner."),
        ("Vad är sidohållarna till för?", "De tar det som inte ska ligga plant på ett plan — längre verktyg, rullar och liknande."),
        ("Rostar vagnen i ett fuktigt garage?", "Ytan är pulverlackerad och står emot rost och nötning. Bättra ett djupt jack som gått ner till metallen, så kommer fukten inte åt."),
        ("Går hjulen att låsa?", "Ja, två av de fyra länkhjulen har broms så att vagnen står stilla där du parkerar den."),
        ("Behöver vagnen monteras?", "Ja, den levereras omonterad och sätts ihop av de medföljande delarna."),
        ("Ingår verktygen som syns på bilderna?", "Nej. De visar bara hur vagnen kan användas. I leveransen ingår vagnen och en anvisning."),
    ],
    "df9475dc": [
        ("Hur mycket tål verktygsvagnen?", "150 kg totalt och 50 kg per plan. Lägg det tyngsta längst ner."),
        ("Hur höga är kanterna?", "7 cm runt varje plan, så det som ligger på hyllan stannar där även när du rullar."),
        ("Är planen olika stora?", "Ja. Nedersta planet mäter 70 × 35 cm, det mellersta 69,5 × 34,5 cm och det översta 68,7 × 33,7 cm."),
        ("Går hjulen att låsa?", "Ja, två av de fyra hjulen har broms så att vagnen står stilla där du parkerar den."),
        ("Behöver vagnen monteras?", "Ja, den levereras omonterad och sätts ihop av de medföljande delarna."),
        ("Ingår verktygen som syns på bilderna?", "Nej. De visar bara hur vagnen kan användas. I leveransen ingår vagnen och en manual."),
    ],
    "4e0a06c0": [
        ("Hur mycket tål verkstadsvagnen?", "150 kg totalt och 75 kg per plan. Lägg det tyngsta längst ner."),
        ("Hur högt är det mellan planen?", "57,3 cm. Det är höjden som gör att en maskinväska får plats stående i stället för liggande."),
        ("Hur djupa är planen?", "Kanterna är 9 cm höga runt om, så det du lägger på planet ligger kvar när du rullar."),
        ("Går hjulen att låsa?", "Ja, två av de fyra länkhjulen har broms så att vagnen står stilla där du parkerar den."),
        ("Behöver vagnen monteras?", "Ja, den levereras omonterad och sätts ihop av de medföljande delarna."),
        ("Ingår verktygen som syns på bilderna?", "Nej. De visar bara hur vagnen kan användas. I leveransen ingår vagnen och en manual."),
    ],
    "db2f05f9": [
        ("Hur stor är vagnen?", "102,6 × 43,5 × 84,5 cm, med två plan på 76 × 41 cm. Mät dörröppningen om den ska rullas mellan rum."),
        ("Vad är verktygsplattan till för?", "Den mäter 42,5 × 21,5 cm och har fack för det små — bits, hylsor och skruv som annars försvinner bland det stora."),
        ("Hur högt är det mellan planen?", "57 cm, vilket rymmer maskiner och dunkar stående."),
        ("Går hjulen att låsa?", "Ja, två av de fyra hjulen har broms så att vagnen står stilla där du parkerar den."),
        ("Behöver vagnen monteras?", "Ja, den levereras omonterad och sätts ihop av de medföljande delarna."),
        ("Ingår verktygen som syns på bilderna?", "Nej. De visar bara hur vagnen kan användas. I leveransen ingår vagnen och en manual."),
    ],
    "2bf00891": [
        ("Hur tunn blir vagnen hopfälld?", "18,5 cm. Den ställs platt mot en vägg, bakom en dörr eller i ett bagageutrymme."),
        ("Hur mycket tål verktygsvagnen?", "68 kg totalt för hela vagnen. Lägg det tyngsta på det nedersta planet."),
        ("Måste vagnen tömmas innan den fälls ihop?", "Ja. Töm alla tre planen först, och håll händerna borta från leden när vagnen viks."),
        ("Går hjulen att låsa?", "Ja, två av de fyra hjulen har broms. Alla fyra svänger 360 grader."),
        ("Behöver vagnen monteras?", "Ja, den levereras omonterad och sätts ihop av de medföljande delarna."),
        ("Ingår verktygen som syns på bilderna?", "Nej. De visar bara hur vagnen kan användas. I leveransen ingår vagnen och en monteringsanvisning."),
    ],
    "12cb8a2c": [
        ("Hur mycket tål verkstadsvagnen?", "90 kg totalt och 30 kg per plan. Lägg det tyngsta längst ner."),
        ("Är lådan låsbar?", "Ja, den låses med nyckel. Förvara reservnyckeln någon annanstans än i vagnen."),
        ("Vad sitter på sidorna?", "Hålskivor på båda sidorna, där du hänger krokar och verktyg du vill ha framme."),
        ("Går hjulen att låsa?", "Ja, två av de fyra gjutna industrihjulen har broms så att vagnen står stilla där du parkerar den."),
        ("Behöver vagnen monteras?", "Ja, den levereras omonterad och sätts ihop av de medföljande delarna."),
        ("Ingår verktygen som syns på bilderna?", "Nej. De visar bara hur vagnen kan användas. I leveransen ingår vagnen och en monteringsanvisning."),
    ],
}

# Korslänkarna pekar på det som SKILJER, inte på huvudordet — femton
# publicerade sidor delar redan ordet verktygsvagn.
PUBLICERAD = {
    "5b27721d": "verktygsvagn-3-hyllplan-halskiva",
    "8723db20": "verktygsvagn-med-hjul-verkstadsvagn",
    "f9de10ab": "verktygsvagn-svart-5-lador",
}

KORSLANK = {
    "887d388d": [("7be028f5", "Samma vagn med släta hyllplan utan urtag"),
                 ("46a5eeda", "Smalare vagn med hålskivor och krokar")],
    "7be028f5": [("887d388d", "Samma vagn med gjutna verktygshål i planen"),
                 ("db2f05f9", "Bredare vagn med två plan och verktygsplatta")],
    "46a5eeda": [("5b27721d", "Bredare vagn med hålskivor, krokar och hink"),
                 ("887d388d", "Vagn med tre plan och gjutna verktygshål")],
    "c8105590": [("df9475dc", "Bredare vagn i stål med högre kanter"),
                 ("12cb8a2c", "Vagn i stål med låsbar låda")],
    "df9475dc": [("4e0a06c0", "Samma bredd men två djupa plan i stället för tre"),
                 ("c8105590", "Smalare vagn i metall med rundade hörn")],
    "4e0a06c0": [("df9475dc", "Samma bredd men tre plan i stället för två"),
                 ("12cb8a2c", "Vagn i stål med låsbar låda och hålskivor")],
    "db2f05f9": [("887d388d", "Smalare vagn med tre plan och verktygshål"),
                 ("2bf00891", "Vagn som fälls ihop och ställs undan")],
    "2bf00891": [("7be028f5", "Fast vagn med tre släta plan"),
                 ("46a5eeda", "Smal fast vagn med hålskivor och krokar")],
    "12cb8a2c": [("f9de10ab", "Vagn med fem lådor i stället för öppna plan"),
                 ("4e0a06c0", "Öppen vagn i stål med två djupa plan")],
}


def _slug(m):
    return SLUG.get(m) or PUBLICERAD[m]


def bygg(pid):
    ut = [f"<p>{INTRO[pid]}</p>"]
    ut.append(f"<h2>{RUBRIK[pid]}</h2><ul>")
    ut += [f"<li>{p}</li>" for p in PUNKTER[pid]]
    ut.append("</ul>")

    # ☠️ KORSLÄNKARNA LIGGER FÖRE FÖRSTA FLIKRUBRIKEN, med flit.
    lankar = " ".join(
        f'<a href="https://www.fyndplats.se/produkt/{_slug(m)}">{t}</a>.'
        for m, t in KORSLANK[pid])
    ut.append("<h2>Passar inte den här?</h2>")
    ut.append(f"<p>{lankar}</p>")

    ut.append("<h2>Tekniska specifikationer</h2><ul>")
    ut += [f"<li><strong>{e}:</strong> {v}</li>" for e, v in SPEC[pid]]
    ut.append("</ul>")

    # ☠️ RUBRIKEN MÅSTE HETA "Användning och skötsel" — ORDAGRANT.
    ut.append("<h2>Användning och skötsel</h2>")
    ut.append(f"<p>{SKOTSEL[pid]}</p>")

    ut.append("<h2>Vanliga frågor</h2>")
    for f, s in FAQ[pid]:
        ut.append(f"<p><strong>{f}</strong></p><p>{s}</p>")
    return "".join(ut)


if __name__ == "__main__":
    import json
    import re

    def _text(html):
        return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html)).strip()

    d = {}
    for pid in NAMN:
        html = bygg(pid)
        t = _text(html)
        d[pid] = {"namn": NAMN[pid], "slug": SLUG[pid], "titel": TITEL[pid],
                  "meta": META[pid], "sokord": SOKORD[pid], "sku": SKU[pid],
                  "html": html, "ord": len(t.split()),
                  "synliga_tecken": len(t), "ordsumma": sum(ord(c) for c in t)}
    json.dump(d, open("skrivning.json", "w"), ensure_ascii=False, indent=1)
    for pid, v in d.items():
        print(f"{pid}  {v['ord']:4d} ord  {v['synliga_tecken']:5d} tecken  "
              f"titel {len(v['titel']):3d}  meta {len(v['meta']):3d}  "
              f"namn {len(v['namn']):3d}")
