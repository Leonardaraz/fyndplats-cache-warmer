# -*- coding: utf-8 -*-
"""Runda 121: åtta städvagnar och mopphinkar.

☠️ FLIKRUBRIKERNA ÄR EN ALLOWLIST PÅ FYRA STRÄNGAR i butikens `splitFlikar`
   (`components/productview.tsx` → `FLIK_TITLE_PATTERNS`). Rubriken måste heta
   `Användning och skötsel` ORDAGRANT, och korslänkarna måste ligga FÖRE
   `<h2>Tekniska specifikationer</h2>` — allt efter en flikrubrik hamnar inne i
   den fliken. Runda 118–120 betalade 26 publicerade sidor för den regeln.

🔒 Inget avsändarland. Inga priser. Inga påhittade tal — varje siffra kommer ur
   spec-blocket, måttritningen eller en bild.
"""

NAMN = {
    "45bac2cb": "Mopphink på hjul 26 liter med press – gul, två korgar",
    "731c8bfc": "Mopphink på hjul 26 liter med press – blå, två korgar",
    "74ea10dc": "Mopphink med två hinkar 78 cm – rent och smutsigt vatten åtskilt",
    "e526fd01": "Mopphink 36 liter med press – rullhink med innerhink på 12 liter",
    "da0f30b2": "Moppvagn 25 liter med korg och hylla – gul",
    "d8ebb279": "Moppvagn 25 liter med korg och hylla – blå",
    "9aa46e31": "Städvagn 121 cm med tre hyllplan och sopsäck",
    "75fcdcfb": "Städvagn 122 cm med mopphink, sopsäck och varningsskylt",
}

SLUG = {
    "45bac2cb": "mopphink-hjul-26-liter-press-gul",
    "731c8bfc": "mopphink-hjul-26-liter-press-bla",
    "74ea10dc": "mopphink-tva-hinkar-78-cm",
    "e526fd01": "mopphink-36-liter-press-innerhink",
    "da0f30b2": "moppvagn-25-liter-korg-hylla-gul",
    "d8ebb279": "moppvagn-25-liter-korg-hylla-bla",
    "9aa46e31": "stadvagn-121-cm-tre-hyllplan-sopsack",
    "75fcdcfb": "stadvagn-122-cm-mopphink-sopsack",
}

TITEL = {
    "45bac2cb": "Mopphink på hjul 26 liter med press, gul | Fyndplats",
    "731c8bfc": "Mopphink på hjul 26 liter med press, blå | Fyndplats",
    "74ea10dc": "Mopphink med två hinkar 78 cm | Fyndplats",
    "e526fd01": "Mopphink 36 liter med press och innerhink | Fyndplats",
    "da0f30b2": "Moppvagn 25 liter med korg och hylla, gul | Fyndplats",
    "d8ebb279": "Moppvagn 25 liter med korg och hylla, blå | Fyndplats",
    "9aa46e31": "Städvagn 121 cm med tre hyllplan och sopsäck | Fyndplats",
    "75fcdcfb": "Städvagn 122 cm med mopphink och sopsäck | Fyndplats",
}

META = {
    "45bac2cb": "Mopphink 73 × 45 × 95 cm med 26 liters hink, avtagbar press och två trådkorgar. Fyra spårfria hjul. Tål 40 kg.",
    "731c8bfc": "Mopphink 73 × 45 × 95 cm med 26 liters hink, avtagbar press och två trådkorgar. Fyra spårfria hjul. Tål 40 kg.",
    "74ea10dc": "Mopphink 78 × 45 × 95 cm med två hinkar som håller rent och smutsigt vatten åtskilt. Avtagbar sidopress. Tål 40 kg.",
    "e526fd01": "Rullhink 54 × 41,5 × 91,5 cm med 36 liters hink, innerhink på 12 liter och avtagbar press. Fyra hjul. Tål 50 kg.",
    "da0f30b2": "Moppvagn 72 × 49,5 × 95 cm med 25 liters hink, press, avtagbar korg och plasthylla. Fyra hjul. Korgen tål 5 kg.",
    "d8ebb279": "Moppvagn 72 × 49,5 × 95 cm med 25 liters hink, press, avtagbar korg och plasthylla. Fyra hjul. Korgen tål 5 kg.",
    "9aa46e31": "Städvagn 121 × 50,5 × 100 cm med tre hyllplan, sopsäck med lock och clipsfäste för moppar. Tål 10 kg.",
    "75fcdcfb": "Städvagn 122 × 46,5 × 101 cm med mopphink, press, 70 liters sopsäck och varningsskylt. Tål 70 kg.",
}

SOKORD = {
    "45bac2cb": ["mopphink på hjul", "mopphink med press", "mopphink 26 liter", "städvagn"],
    "731c8bfc": ["mopphink på hjul", "mopphink med press", "mopphink 26 liter", "städvagn"],
    "74ea10dc": ["mopphink med två hinkar", "mopphink på hjul", "dubbelhink städning", "städvagn"],
    "e526fd01": ["mopphink 36 liter", "rullhink med press", "mopphink på hjul", "städvagn"],
    "da0f30b2": ["moppvagn", "mopphink med korg", "moppvagn 25 liter", "städvagn"],
    "d8ebb279": ["moppvagn", "mopphink med korg", "moppvagn 25 liter", "städvagn"],
    "9aa46e31": ["städvagn", "städvagn med sopsäck", "städvagn tre hyllplan", "moppvagn"],
    "75fcdcfb": ["städvagn", "städvagn med mopphink", "professionell städvagn", "moppvagn"],
}

INTRO = {
    "45bac2cb": "Den här mopphinken gör en sak riktigt bra: den håller ihop hela momentet på fyra hjul. Hinken rymmer 26 liter och pressen lyfts av när den ska sköljas. Två trådkorgar tar med sig sprayflaskan och trasorna, så du slipper gå tillbaka efter dem.",
    "731c8bfc": "Den här mopphinken gör en sak riktigt bra: den håller ihop hela momentet på fyra hjul. Hinken rymmer 26 liter och pressen lyfts av när den ska sköljas. Två trådkorgar tar med sig sprayflaskan och trasorna, så du slipper gå tillbaka efter dem.",
    "74ea10dc": "Två hinkar i stället för en. Den ena bär rent vatten, den andra tar emot det smutsiga när du pressar ur moppen — och det är hela poängen: golvet blir renare för att du inte sköljer moppen i det du nyss torkade upp. Ovanpå sitter en liten korg för det du behöver ha nära.",
    "e526fd01": "Det här är mopphinken för dig som vill ha så få delar som möjligt. Ingen ram, ingen hylla — bara en 36 liters hink med press, på fyra hjul. Innerhinken på 12 liter håller rent och smutsigt vatten åtskilt, och pressen lyfts av när den ska sköljas.",
    "da0f30b2": "Den här moppvagnen är byggd för dig som bär för mycket. Hinken rymmer 25 liter och har en press, korgen tar sprayflaskorna och plasthyllan under tar det som annars hamnar på golvet. Allt rullar på fyra hjul, och de delar som blir smutsiga lyfts av och sköljs.",
    "d8ebb279": "Den här moppvagnen är byggd för dig som bär för mycket. Hinken rymmer 25 liter och har en press, korgen tar sprayflaskorna och plasthyllan under tar det som annars hamnar på golvet. Allt rullar på fyra hjul, och de delar som blir smutsiga lyfts av och sköljs.",
    "9aa46e31": "Den här städvagnen är 121 cm lång och har tre hyllplan plus en sopsäck med lock. Clipsen längs kanten håller moppskaft, trasor och skyltar på plats medan du rullar. Hjulen är spårfria och skjuthandtaget halkfritt, så vagnen går tyst genom en korridor.",
    "75fcdcfb": "Det här är hela städmomentet i en vagn: tre hyllplan, en 70 liters sopsäck med lock, en mopphink med press och en varningsskylt som hänger på framsidan när den inte används. Vagnen tål 70 kg totalt, så du kan lasta den full utan att räkna.",
}

PUNKTER = {
    "45bac2cb": [
        "Hink på 26 liter med avtagbar press",
        "Två trådkorgar — en hög vid handtaget, en låg vid basen",
        "Fäste för moppskaftet",
        "Fyra spårfria hjul som inte lämnar märken",
        "Gul hink på grå stålram",
        "Tål 40 kg",
    ],
    "731c8bfc": [
        "Hink på 26 liter med avtagbar press",
        "Två trådkorgar — en hög vid handtaget, en låg vid basen",
        "Fäste för moppskaftet",
        "Fyra spårfria hjul som inte lämnar märken",
        "Blå hink på grå stålram",
        "Tål 40 kg",
    ],
    "74ea10dc": [
        "Två hinkar sida vid sida — rent och smutsigt vatten åtskilt",
        "Avtagbar sidopress som trycker ur moppen",
        "Liten korg ovanpå för flaskor och trasor",
        "Fäste för moppskaftet",
        "Fyra spårfria hjul på svart chassi",
        "Tål 40 kg",
    ],
    "e526fd01": [
        "Hink på 36 liter med avtagbar press",
        "Innerhink på 12 liter som håller vattnet åtskilt",
        "Fäste för moppskaftet",
        "Fyra hjul med 7,5 cm diameter",
        "Orange hink med svart press",
        "Tål 50 kg",
    ],
    "da0f30b2": [
        "Hink på 25 liter, 37,5 × 35 × 31,5 cm invändigt",
        "Press som lyfts av och sköljs",
        "Avtagbar korg på 42,6 × 18 × 22,2 cm",
        "Plasthylla vid basen, 37 × 18 × 14,7 cm",
        "Fyra hjul och ett handtag att skjuta med",
        "Gul hink på grå ram, korgen tål 5 kg",
    ],
    "d8ebb279": [
        "Hink på 25 liter, 37,5 × 35 × 31,5 cm invändigt",
        "Press som lyfts av och sköljs",
        "Avtagbar korg på 42,6 × 18 × 22,2 cm",
        "Plasthylla vid basen, 37 × 18 × 14,7 cm",
        "Fyra hjul och ett handtag att skjuta med",
        "Blå hink på grå ram, korgen tål 5 kg",
    ],
    "9aa46e31": [
        "Tre hyllplan, det nedersta 76 × 46 cm",
        "Sopsäck i PVC med lock, öppning 39 × 30 cm",
        "Clipsfäste för moppskaft, trasor och skyltar",
        "Tysta hjul som inte lämnar märken",
        "Halkfritt skjuthandtag",
        "Svart stomme med orange säck, tål 10 kg",
    ],
    "75fcdcfb": [
        "Mopphink med press ingår, 61 × 38 × 94 cm",
        "Sopsäck på 70 liter med lock, öppning 38 × 31 cm",
        "Tre hyllplan, det nedersta 76 × 46 cm",
        "Varningsskylt som hängs på framsidan",
        "Två fasta och två svängbara hjul",
        "Tål 70 kg totalt — 40 kg på nedre hyllan",
    ],
}

SPEC = {
    "45bac2cb": [
        ("Yttermått", "73 × 45 × 95 cm (längd × bredd × höjd)"),
        ("Hinkens volym", "26 liter"),
        ("Pressens mått", "26,5 × 20,5 × 56,5 cm"),
        ("Korgens mått", "30 × 16 × 25,5 cm"),
        ("Maxlast", "40 kg"),
        ("Vikt", "10,3 kg"),
        ("Material", "plast och metall"),
        ("Färg", "gul hink på grå stålram"),
        ("Hjul", "fyra spårfria hjul"),
        ("Montering", "Mopphinken levereras färdigmonterad."),
        ("Paketmått", "56 × 39 × 40 cm"),
    ],
    "731c8bfc": [
        ("Yttermått", "73 × 45 × 95 cm (längd × bredd × höjd)"),
        ("Hinkens volym", "26 liter"),
        ("Pressens mått", "26,5 × 20,5 × 56,5 cm"),
        ("Korgens mått", "30 × 16 × 25,5 cm"),
        ("Maxlast", "40 kg"),
        ("Vikt", "10,3 kg"),
        ("Material", "plast och metall"),
        ("Färg", "blå hink på grå stålram"),
        ("Hjul", "fyra spårfria hjul"),
        ("Montering", "Mopphinken levereras färdigmonterad."),
        ("Paketmått", "56 × 39 × 40 cm"),
    ],
    "74ea10dc": [
        ("Yttermått", "78 × 45 × 95 cm (längd × bredd × höjd)"),
        ("Volym", "26 liter"),
        ("Pressens mått", "25 × 25 × 57 cm"),
        ("Maxlast", "40 kg"),
        ("Vikt", "12,5 kg"),
        ("Material", "plast och metall"),
        ("Färg", "blå och orange hink på svart chassi"),
        ("Hjul", "fyra spårfria hjul"),
        ("Montering", "Mopphinken levereras färdigmonterad."),
        ("Paketmått", "74 × 45 × 47 cm"),
    ],
    "e526fd01": [
        ("Yttermått", "54 × 41,5 × 91,5 cm (längd × bredd × höjd)"),
        ("Hinkens volym", "36 liter"),
        ("Innerhinkens volym", "12 liter"),
        ("Pressens mått", "25 × 25 × 57 cm"),
        ("Hjuldiameter", "7,5 cm"),
        ("Maxlast", "50 kg"),
        ("Vikt", "7,9 kg"),
        ("Material", "plast och metall"),
        ("Färg", "orange med svart press"),
        ("Montering", "Rullhinken levereras färdigmonterad."),
        ("Paketmått", "54 × 39,5 × 39 cm"),
    ],
    "da0f30b2": [
        ("Yttermått", "72 × 49,5 × 95 cm (längd × bredd × höjd)"),
        ("Hinkens volym", "25 liter"),
        ("Hinkens mått", "37,5 × 35 × 31,5 cm"),
        ("Pressens mått", "26,5 × 20,5 × 56,5 cm"),
        ("Korgens mått", "42,6 × 18 × 22,2 cm"),
        ("Hyllans mått", "37 × 18 × 14,7 cm"),
        ("Korgens maxlast", "5 kg"),
        ("Vikt", "9,5 kg"),
        ("Material", "plast och metall"),
        ("Färg", "gul hink på grå ram"),
        ("Montering", "Moppvagnen levereras omonterad med monteringsanvisning."),
        ("Paketmått", "56 × 45 × 39 cm"),
    ],
    "d8ebb279": [
        ("Yttermått", "72 × 49,5 × 95 cm (längd × bredd × höjd)"),
        ("Hinkens volym", "25 liter"),
        ("Hinkens mått", "37,5 × 35 × 31,5 cm"),
        ("Pressens mått", "26,5 × 20,5 × 56,5 cm"),
        ("Korgens mått", "42,6 × 18 × 22,2 cm"),
        ("Hyllans mått", "37 × 18 × 14,7 cm"),
        ("Korgens maxlast", "5 kg"),
        ("Vikt", "9,5 kg"),
        ("Material", "plast och metall"),
        ("Färg", "blå hink på grå ram"),
        ("Montering", "Moppvagnen levereras omonterad med monteringsanvisning."),
        ("Paketmått", "56 × 45 × 39 cm"),
    ],
    "9aa46e31": [
        ("Yttermått", "121 × 50,5 × 100 cm (längd × bredd × höjd)"),
        ("Övre hyllan", "37 × 32 × 8 cm"),
        ("Mellersta hyllan", "37 × 32 × 3,5 cm"),
        ("Nedre hyllan", "76 × 46 × 3,5 cm"),
        ("Sopsäckens öppning", "39 × 30 cm"),
        ("Maxlast", "10 kg totalt"),
        ("Vikt", "14,4 kg"),
        ("Material", "plast"),
        ("Färg", "svart stomme med orange säck"),
        ("Montering", "Städvagnen levereras omonterad med monteringsanvisning."),
        ("Paketmått", "88 × 25 × 55 cm"),
    ],
    "75fcdcfb": [
        ("Yttermått", "122 × 46,5 × 101 cm (längd × bredd × höjd)"),
        ("Mopphinkens mått", "61 × 38 × 94 cm"),
        ("Övre hyllan", "37 × 32,5 × 8 cm"),
        ("Mellersta hyllan", "37 × 32 × 4 cm"),
        ("Nedre hyllan", "76 × 46 × 4 cm"),
        ("Sopsäckens volym", "70 liter, öppning 38 × 31 cm"),
        ("Maxlast", "70 kg totalt, 40 kg på nedre hyllan och 10 kg på varje övrig del"),
        ("Vikt", "22,4 kg"),
        ("Material", "plast, PVC, HDPE, metall, förzinkat stål och oxfordväv"),
        ("Färg", "svart stomme med blå hink och säck"),
        ("Montering", "Städvagnen levereras omonterad med monteringsanvisning."),
        ("Paketmått", "89 × 40 × 55 cm"),
    ],
}

SKOTSEL = {
    "45bac2cb": "Skölj ur hinken efter varje pass och låt den torka upp och ner. Pressen lyfts av och sköljs för sig — det är där smutsen samlas. Torka av stålramen med en fuktad trasa så att den inte står blöt. Håll dig inom 40 kg och kör inte över trösklar med hinken full, för vattnet väger tungt när det svallar.",
    "731c8bfc": "Skölj ur hinken efter varje pass och låt den torka upp och ner. Pressen lyfts av och sköljs för sig — det är där smutsen samlas. Torka av stålramen med en fuktad trasa så att den inte står blöt. Håll dig inom 40 kg och kör inte över trösklar med hinken full, för vattnet väger tungt när det svallar.",
    "74ea10dc": "Töm båda hinkarna efter varje pass och skölj dem var för sig. Sidopressen lyfts av och sköljs separat. Torka av chassit med en fuktad trasa och låt hinkarna torka upp och ner. Håll dig inom 40 kg, och skjut vagnen framför dig i stället för att dra den när båda hinkarna är fulla.",
    "e526fd01": "Töm hinken och innerhinken var för sig och skölj dem efter varje pass. Pressen lyfts av och sköljs separat. Låt hinken torka upp och ner så att inget vatten blir stående. Håll dig inom 50 kg och rulla lugnt över trösklar — hjulen är 7,5 cm och tar inte höga kanter.",
    "da0f30b2": "Lyft av korgen och pressen och skölj dem för sig; båda är gjorda för att tas loss. Töm hinken efter varje pass och låt den torka upp och ner. Torka av ramen med en fuktad trasa. Lasta högst 5 kg i korgen och skjut vagnen framför dig när hinken är full.",
    "d8ebb279": "Lyft av korgen och pressen och skölj dem för sig; båda är gjorda för att tas loss. Töm hinken efter varje pass och låt den torka upp och ner. Torka av ramen med en fuktad trasa. Lasta högst 5 kg i korgen och skjut vagnen framför dig när hinken är full.",
    "9aa46e31": "Töm sopsäcken och skölj den vid behov — PVC tål vatten och torkar snabbt. Torka av hyllplanen med en fuktad trasa och ett milt rengöringsmedel. Håll dig inom 10 kg totalt och fördela vikten på de tre planen i stället för att lasta allt på det nedersta. Kontrollera clipsen då och då så att de sitter fast.",
    "75fcdcfb": "Töm sopsäcken och skölj den; den är vattentät och tål att spolas. Mopphinken och pressen lyfts av vagnen och sköljs för sig. Torka av hyllplanen med en fuktad trasa. Håll dig inom 70 kg totalt, 40 kg på nedre hyllan och 10 kg på varje övrig del, och häng varningsskylten på framsidan när du inte använder den.",
}

FAQ = {
    "45bac2cb": [
        ("Ingår moppen?", "Nej, mopphinken levereras utan mopp. Fästet på ramen passar ett vanligt moppskaft."),
        ("Hur mycket rymmer hinken?", "26 liter. Pressen mäter 26,5 × 20,5 × 56,5 cm och lyfts av när den ska sköljas."),
        ("Vad får plats i korgarna?", "Två korgar följer med: en hög vid handtaget och en låg vid basen. Den uppmätta korgen är 30 × 16 × 25,5 cm och tar sprayflaskor och trasor."),
        ("Lämnar hjulen märken på golvet?", "Nej, de fyra hjulen är spårfria."),
    ],
    "731c8bfc": [
        ("Ingår moppen?", "Nej, mopphinken levereras utan mopp. Fästet på ramen passar ett vanligt moppskaft."),
        ("Hur mycket rymmer hinken?", "26 liter. Pressen mäter 26,5 × 20,5 × 56,5 cm och lyfts av när den ska sköljas."),
        ("Vad får plats i korgarna?", "Två korgar följer med: en hög vid handtaget och en låg vid basen. Den uppmätta korgen är 30 × 16 × 25,5 cm och tar sprayflaskor och trasor."),
        ("Lämnar hjulen märken på golvet?", "Nej, de fyra hjulen är spårfria."),
    ],
    "74ea10dc": [
        ("Varför två hinkar?", "Den ena bär rent vatten och den andra tar emot det smutsiga när du pressar ur moppen. Golvet blir renare för att moppen aldrig sköljs i det du nyss torkade upp."),
        ("Ingår moppen?", "Nej, mopphinken levereras utan mopp. Chassit har ett fäste för moppskaftet."),
        ("Hur stor är vagnen?", "78 × 45 × 95 cm. Volymen är 26 liter och pressen mäter 25 × 25 × 57 cm."),
        ("Går pressen att ta av?", "Ja, sidopressen lyfts av och sköljs för sig."),
    ],
    "e526fd01": [
        ("Vad är innerhinken till?", "Den rymmer 12 liter och håller rent och smutsigt vatten åtskilt inne i den stora hinken på 36 liter."),
        ("Ingår moppen?", "Nej, rullhinken levereras utan mopp. Den har ett fäste för moppskaftet."),
        ("Ingår varningsskylten på bilden?", "Nej. Rullhinken levereras med press och bruksanvisning; skylten hör inte till."),
        ("Hur stor är den?", "54 × 41,5 × 91,5 cm, och den väger 7,9 kg tom. Hjulen är 7,5 cm i diameter."),
    ],
    "da0f30b2": [
        ("Ingår moppen?", "Nej, moppvagnen levereras utan mopp."),
        ("Hur mycket rymmer hinken?", "25 liter, och invändigt mäter den 37,5 × 35 × 31,5 cm."),
        ("Vad får plats i korgen?", "Korgen är 42,6 × 18 × 22,2 cm och tål 5 kg. Under den sitter en plasthylla på 37 × 18 × 14,7 cm."),
        ("Behöver den monteras?", "Ja, moppvagnen levereras omonterad med monteringsanvisning."),
    ],
    "d8ebb279": [
        ("Ingår moppen?", "Nej, moppvagnen levereras utan mopp."),
        ("Hur mycket rymmer hinken?", "25 liter, och invändigt mäter den 37,5 × 35 × 31,5 cm."),
        ("Vad får plats i korgen?", "Korgen är 42,6 × 18 × 22,2 cm och tål 5 kg. Under den sitter en plasthylla på 37 × 18 × 14,7 cm."),
        ("Behöver den monteras?", "Ja, moppvagnen levereras omonterad med monteringsanvisning."),
    ],
    "9aa46e31": [
        ("Ingår mopphinken på bilden?", "Nej. Städvagnen levereras med sopsäck och monteringsanvisning; hinken på livsstilsbilden hör inte till. Vagnen levereras utan mopp."),
        ("Hur stora är hyllplanen?", "Det nedersta är 76 × 46 cm, de två övre 37 × 32 cm. Djupet är 8 cm på det översta och 3,5 cm på de andra två."),
        ("Hur mycket tål vagnen?", "10 kg totalt. Fördela vikten på de tre planen i stället för att lasta allt på det nedersta."),
        ("Vad är clipsen till?", "De håller moppskaft, trasor och varningsskyltar på plats medan du rullar."),
    ],
    "75fcdcfb": [
        ("Ingår mopphinken?", "Ja. Mopphinken med press följer med, tillsammans med sopsäcken och varningsskylten. Moppen ingår inte."),
        ("Vilket språk står på varningsskylten?", "Skylten är engelskspråkig och säger ”Wet Floor”. Symbolen med den halkande figuren är den internationella."),
        ("Hur mycket tål vagnen?", "70 kg totalt: 40 kg på nedre hyllan och 10 kg på varje övrig del."),
        ("Hur stor är sopsäcken?", "70 liter, med en öppning på 38 × 31 cm och ett lock som håller lukten inne."),
    ],
}

KORSLANK = {
    "45bac2cb": [("731c8bfc", "Samma mopphink i blått"),
                 ("74ea10dc", "Mopphink med två hinkar")],
    "731c8bfc": [("45bac2cb", "Samma mopphink i gult"),
                 ("74ea10dc", "Mopphink med två hinkar")],
    "74ea10dc": [("45bac2cb", "Enklare mopphink med två korgar"),
                 ("75fcdcfb", "Städvagn med mopphink och sopsäck")],
    "e526fd01": [("45bac2cb", "Mopphink med korgar och moppfäste"),
                 ("74ea10dc", "Mopphink med två hinkar")],
    "da0f30b2": [("d8ebb279", "Samma moppvagn i blått"),
                 ("9aa46e31", "Städvagn med tre hyllplan")],
    "d8ebb279": [("da0f30b2", "Samma moppvagn i gult"),
                 ("9aa46e31", "Städvagn med tre hyllplan")],
    "9aa46e31": [("75fcdcfb", "Städvagn där mopphinken ingår"),
                 ("da0f30b2", "Moppvagn med hink och korg")],
    "75fcdcfb": [("9aa46e31", "Lättare städvagn utan mopphink"),
                 ("74ea10dc", "Mopphink med två hinkar")],
}

RUBRIK = {
    "45bac2cb": "Det här är mopphinken",
    "731c8bfc": "Det här är mopphinken",
    "74ea10dc": "Det här är mopphinken",
    "e526fd01": "Det här är rullhinken",
    "da0f30b2": "Det här är moppvagnen",
    "d8ebb279": "Det här är moppvagnen",
    "9aa46e31": "Det här är städvagnen",
    "75fcdcfb": "Det här är städvagnen",
}


def bygg(pid):
    ut = [f"<p>{INTRO[pid]}</p>"]
    ut.append(f"<h2>{RUBRIK[pid]}</h2><ul>")
    ut += [f"<li>{p}</li>" for p in PUNKTER[pid]]
    ut.append("</ul>")

    # ☠️ KORSLÄNKARNA LIGGER FÖRE FÖRSTA FLIKRUBRIKEN, med flit. Butikens
    #    splitFlikar lägger allt EFTER en flikrubrik inne i den fliken.
    lankar = " ".join(
        f'<a href="https://www.fyndplats.se/produkt/{SLUG[m]}">{t}</a>.'
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
                  "meta": META[pid], "sokord": SOKORD[pid], "html": html,
                  "ord": len(t.split()), "synliga_tecken": len(t),
                  "ordsumma": sum(ord(c) for c in t)}
    json.dump(d, open("skrivning.json", "w"), ensure_ascii=False, indent=1)
    for pid, v in d.items():
        print(f"{pid}  {v['ord']:4d} ord  {v['synliga_tecken']:5d} tecken  "
              f"titel {len(v['titel']):3d}  meta {len(v['meta']):3d}  "
              f"namn {len(v['namn']):3d}")
