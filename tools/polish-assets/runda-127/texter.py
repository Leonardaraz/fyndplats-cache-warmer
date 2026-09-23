# -*- coding: utf-8 -*-
"""Runda 127: åtta kontorsförvaringar — sju rullhurtsar och en kubhylla.

☠️ FLIKRUBRIKERNA ÄR EN ALLOWLIST PÅ FYRA STRÄNGAR i butikens `splitFlikar`.
   Rubriken måste heta `Användning och skötsel` ORDAGRANT, och korslänkarna
   måste ligga FÖRE `<h2>Tekniska specifikationer</h2>`.

☠️ SEX NÄSTAN IDENTISKA TRELÅDORS-HURTSAR GÅR LIVE SAMTIDIGT — fem här plus
   publicerade `hurts-hjul-tre-lasbara-lador`. Varje sida bär därför en SANN
   kvalificerare i NAMN, SLUG och TITEL: färgen, greppet, bredden eller
   lådantalet. Utan den kannibaliserar de varandra.

☠️ `9ba9af92` ÄR FÄRGSYSKON till den publicerade svarta sidan. Samma fem tal
   på decimalen, samma femte hjul som tippskydd, samma pulverlackerade
   kallvalsade stål. Korslänken går åt båda håll och sägs rakt ut.

☠️ `709f7aac` HETER "Druckerablage" HOS LEVERANTÖREN OCH TÅL 3 kg PER FACK.
   En bordsskrivare väger 5–10 kg. Sidan säljer den som kubhylla, aldrig som
   skrivarhylla, och skriver ut båda lasttalen.

☠️ LÅDSPÄRREN ("bara en låda åt gången") SKRIVS INTE UT. Den påstås bara av
   en engelsk overlay på en bild; ingen av de två M2-texterna nämner den.
   Det femte hjulet skrivs ut — det står i brödtexten.

☠️ `521aec3c`s LASTTAL GÅR INTE IHOP (40 kg totalt, 5 kg per låda, två lådor,
   ingen toppskiverad). Sidan skriver bara talet per låda.

⚠️ `9b8c7308` bär två vikter i källan, 19,5 och 22 kg. Sidan säger den HÖGRE.

⚠️ `66866eb7`s axelbeteckningar motsäger sig själva — lådans "B" är bredare än
   skåpets "L". Måttritningen avgör: 37 cm är fronten, 43,5 cm är djupet.

🔒 Inget avsändarland. Inga priser, inga prisjämförelser. Inga påhittade tal.
   Mot kunden är VI leverantören — ingen mening får peka på någon annan.
"""

NAMN = {
    "709f7aac": "Kubhylla på hjul 111 cm – tre öppna fack åt olika håll, vit",
    "4d5b3bb5": "Smal hurts 37 cm med tre lådor – svart stål, låsbar med pennfack",
    "66866eb7": "Smal hurts 37 cm med två lådor – svart stål, 67,5 cm hög",
    "521aec3c": "Hurts med mellanvägg och centrallås – vit, två djupa lådor",
    "9ba9af92": "Vit hurts med tre låsbara lådor – 60 cm med tippskyddshjul",
    "3273d2ee": "Vit hurts med greppfri front – tre lådor, bara hjulen monteras",
    "9b8c7308": "Vit hurts med infällt handtag – tre låsbara lådor, rundade hörn",
    "21a12739": "Svart hurts med infällt handtag – tre låsbara lådor på hjul",
}

SLUG = {
    "709f7aac": "kubhylla-pa-hjul-tre-fack",
    "4d5b3bb5": "smal-hurts-37-cm-tre-lador",
    "66866eb7": "smal-hurts-tva-lador-67-cm",
    "521aec3c": "hurts-mellanvagg-centrallas",
    "9ba9af92": "hurts-vit-tre-lador-60-cm",
    "3273d2ee": "hurts-vit-greppfri-front",
    "9b8c7308": "hurts-vit-infallt-handtag",
    "21a12739": "hurts-svart-infallt-handtag",
}

# ☠️ SKU = "FP-" + så många HELA slug-token som ryms i 24 tecken.
#    Krocken uppstår i den KAPADE strängen, inte i sluggen (uppgift #473).
SKU = {
    "709f7aac": "FP-kubhylla-pa-hjul-tre",
    "4d5b3bb5": "FP-smal-hurts-37-cm-tre",
    "66866eb7": "FP-smal-hurts-tva-lador",
    "521aec3c": "FP-hurts-mellanvagg",
    "9ba9af92": "FP-hurts-vit-tre-lador",
    "3273d2ee": "FP-hurts-vit-greppfri",
    "9b8c7308": "FP-hurts-vit-infallt",
    "21a12739": "FP-hurts-svart-infallt",
}

TITEL = {
    "709f7aac": "Kubhylla på hjul 111 cm – tre öppna fack, vit | Fyndplats",
    "4d5b3bb5": "Smal hurts 37 cm, tre lådor – svart låsbar | Fyndplats",
    "66866eb7": "Smal hurts 37 cm med två lådor – svart | Fyndplats",
    "521aec3c": "Hurts med mellanvägg och centrallås – vit | Fyndplats",
    "9ba9af92": "Vit hurts 60 cm – tre låsbara lådor, tippskydd | Fyndplats",
    "3273d2ee": "Vit hurts med greppfri front – tre lådor | Fyndplats",
    "9b8c7308": "Vit hurts med infällt handtag – tre lådor | Fyndplats",
    "21a12739": "Svart hurts med infällt handtag – tre lådor | Fyndplats",
}

META = {
    "709f7aac": "Smal kubhylla på hjul, 33,5 × 33,5 × 111 cm. Tre öppna fack "
                "vända åt olika håll. Tål 3 kg per fack och 9 kg totalt.",
    "4d5b3bb5": "Smal hurts i svart stål, 37 × 43,5 × 60 cm. Tre låsbara lådor, "
                "pennfack och fyra hjul. Toppskivan tål 15 kg.",
    "66866eb7": "Smal hurts i svart stål, 37 × 43,5 × 67,5 cm. Två låsbara "
                "lådor på fyra hjul. Toppskivan tål 15 kg.",
    "521aec3c": "Vit hurts 39 × 48 × 67 cm med två djupa lådor, mellanvägg och "
                "ett lås som stänger båda. Två nycklar ingår.",
    "9ba9af92": "Vit hurts 39 × 48 × 60 cm med tre låsbara lådor, hängmappsskena "
                "och ett femte hjul som tippskydd. Två nycklar ingår.",
    "3273d2ee": "Vit hurts 39 × 48 × 59 cm med greppfri front och tre låsbara "
                "lådor. Bara hjulen behöver monteras.",
    "9b8c7308": "Vit hurts 39 × 48 × 59 cm med infällt handtag i varje front och "
                "tre låsbara lådor. Två nycklar ingår.",
    "21a12739": "Svart hurts 39 × 48 × 59 cm med infällt handtag, tre låsbara "
                "lådor och ett femte hjul som tippskydd.",
}

SOKORD = {
    "709f7aac": ["kubhylla", "hylla på hjul", "smal förvaring", "kontorshylla"],
    "4d5b3bb5": ["smal hurts", "hurts svart", "hurts med lådor", "kontorshurts"],
    "66866eb7": ["smal hurts", "hurts två lådor", "hurts svart", "arkivhurts"],
    "521aec3c": ["hurts", "hurts med lås", "kontorshurts", "arkivhurts"],
    "9ba9af92": ["hurts vit", "hurts på hjul", "hängmappshurts", "kontorshurts"],
    "3273d2ee": ["hurts vit", "greppfri hurts", "hurts på hjul", "kontorshurts"],
    "9b8c7308": ["hurts vit", "hurts med handtag", "hurts på hjul", "kontorshurts"],
    "21a12739": ["hurts svart", "hurts med handtag", "hurts på hjul", "kontorshurts"],
}

INTRO = {
    "709f7aac":
        "En smal pelare på hjul som tar 33,5 centimeter i fyrkant och ändå ger "
        "tre fack i tre höjder. Facken är öppna och vända åt olika håll, så du "
        "kommer åt dem från båda sidor av hyllan – det är vad som gör den "
        "användbar mitt i ett rum och inte bara mot en vägg.",
    "4d5b3bb5":
        "Trettiosju centimeter bred är precis vad som ryms mellan ett "
        "skrivbordsben och en vägg. Den här hurtsen är byggd för den luckan: "
        "smal fram, djup inåt, och med tre lådor som alla låses med samma "
        "nyckel.",
    "66866eb7":
        "Två djupa lådor i stället för en grund och två djupa, och sju "
        "centimeter högre stomme. Det låter som en detalj men märks när du ska få ner en hög pärmar i "
        "samma låda i stället för att dela upp dem.",
    "521aec3c":
        "Två lika djupa lådor, en mellanvägg som håller ordning inuti och ett "
        "enda lås som stänger båda. Den är gjord för den som vill kunna gå "
        "hem utan att sortera undan först.",
    "9ba9af92":
        "En vit hurts i pulverlackerat kallvalsat stål med två grunda lådor "
        "överst och en djup arkivlåda underst. Under arkivlådan sitter ett "
        "femte hjul som håller emot när den dras ut full.",
    "3273d2ee":
        "Fronterna är helt släta – inga handtag alls. Du greppar underkanten "
        "och drar, och hurtsen blir en vit låda utan detaljer som drar blicken. "
        "Ur kartongen är det bara hjulen som ska skruvas fast.",
    "9b8c7308":
        "Varje front har ett avlångt handtag infällt i plåten i stället för "
        "utanpåliggande grepp. Hörnen är rundade och kanten svart, så hurtsen "
        "ser mjukare ut än en vanlig plåtlåda gör.",
    "21a12739":
        "Samma mjuka form som den vita systern, men i svart: rundade hörn och "
        "ett avlångt handtag infällt i varje front. Under arkivlådan sitter "
        "ett femte hjul som håller emot när den dras ut.",
}

RUBRIK = {
    "709f7aac": "Tre fack, två håll",
    "4d5b3bb5": "Smal fram, djup inåt",
    "66866eb7": "Två lådor, mer höjd",
    "521aec3c": "Ett lås, två lådor",
    "9ba9af92": "Femte hjulet är poängen",
    "3273d2ee": "Greppfri front",
    "9b8c7308": "Infällt handtag i varje front",
    "21a12739": "Svart med infällt handtag",
}

PUNKTER = {
    "709f7aac": [
        "Tre öppna kubfack på 33,5 × 33,5 × 33,5 centimeter, vända åt olika "
        "håll så att du kommer åt dem från två sidor",
        "33,5 centimeter i fyrkant och 111 centimeter hög – står i en "
        "bokhyllelucka, bredvid sängen eller vid skrivbordskanten",
        "Fyra hjul under botten, så den går att rulla fram vid städning",
        "Tål 3 kilo per fack och 9 kilo sammanlagt – tänk pärmar, papper och "
        "småsaker, inte apparater",
        "Vit yta på träskiva, lätt att torka av",
    ],
    "4d5b3bb5": [
        "Tre lådor: två grunda på 7 centimeter och en arkivlåda på 24",
        "37 centimeter bred och 43,5 djup – smal framifrån, djup inåt",
        "Ett nyckellås stänger alla tre lådorna samtidigt",
        "Löstagbart pennfack på 32,3 × 10,7 centimeter i den översta lådan",
        "Toppskivan tål 15 kilo, varje låda 5 kilo, hela hurtsen 30",
        "Fyra hjul i svart stål",
    ],
    "66866eb7": [
        "Två lådor i stället för tre, och en stomme som är 67,5 centimeter hög",
        "37 centimeter bred och 43,5 djup – samma smala mått som den lägre "
        "systern i serien",
        "Låda invändigt 30,5 centimeter bred och 40,5 djup",
        "Ett nyckellås stänger båda lådorna samtidigt",
        "Toppskivan tål 15 kilo, varje låda 5 kilo, hela hurtsen 30",
        "Fyra hjul under svart stål",
    ],
    "521aec3c": [
        "Två lika djupa lådor på 24 centimeter invändigt – ingen grund "
        "pennlåda, utan två som rymmer lika mycket",
        "Mellanvägg i lådan så att pärmarna står upp i stället för att glida",
        "Ett lås stänger båda lådorna samtidigt, och två nycklar följer med",
        "39 centimeter bred, 48 djup och 67 hög",
        "Varje låda tål 5 kilo",
        "Fyra hjul under vitlackerat stål",
    ],
    "9ba9af92": [
        "Två grunda lådor på 7 centimeter och en arkivlåda på 24, alla "
        "32,6 × 43,2 centimeter invändigt",
        "Skena för hängmappar i A4 i den djupa lådan",
        "Fyra länkhjul varav två med broms, plus ett femte hjul under "
        "arkivlådan som håller emot när den är utdragen",
        "Alla tre lådorna låses med samma lås, och två nycklar följer med",
        "Justerbart pennfack ingår",
        "Tål 15 kilo per låda och 50 kilo sammanlagt",
        "Pulverlackerat kallvalsat stål, 39 × 48 × 60 centimeter",
    ],
    "3273d2ee": [
        "Släta fronter utan handtag – du greppar under kanten och drar",
        "Två grunda lådor på 7 centimeter och en arkivlåda på 23,8, alla "
        "32,6 × 43,2 centimeter invändigt",
        "Skena för hängmappar i den djupa lådan",
        "Fyra länkhjul plus ett hjul under arkivlådan som håller emot",
        "Ett lås stänger alla tre lådorna, och två nycklar följer med",
        "Bara hjulen ska monteras – resten kommer hopsatt",
        "Tål 15 kilo per låda och 50 kilo sammanlagt",
    ],
    "9b8c7308": [
        "Avlångt handtag infällt i varje front, inget som sticker ut",
        "Rundade hörn och svart kantlist mot den vita plåten",
        "Två grunda lådor på 7 centimeter och en arkivlåda på 23,8, alla "
        "32,6 × 43,2 centimeter invändigt",
        "Skena för hängmappar i A4, Letter och legal i den djupa lådan",
        "Ett lås stänger alla tre lådorna, och två nycklar följer med",
        "Justerbart pennfack ingår",
        "Tål 15 kilo per låda och 50 kilo sammanlagt",
    ],
    "21a12739": [
        "Avlångt handtag infällt i varje front, i samma svarta ton som plåten",
        "Två grunda lådor på 7 centimeter och en arkivlåda på 23,8, alla "
        "32,6 × 43,2 centimeter invändigt",
        "Skena för hängmappar i A4 och A5 i den djupa lådan",
        "Fyra länkhjul plus ett hjul under arkivlådan som håller emot när den "
        "dras ut",
        "Ett lås stänger alla tre lådorna, och två nycklar följer med",
        "Justerbart stiftfack ingår",
        "Kallvalsat stål, 39 × 48 × 59 centimeter",
    ],
}

SPEC = {
    "709f7aac": [
        ("Mått", "33,5 × 33,5 × 111 cm (bredd × djup × höjd)"),
        ("Fack", "Tre öppna, 33,5 × 33,5 × 33,5 cm vardera"),
        ("Maxlast", "3 kg per fack, 9 kg totalt"),
        ("Material", "Träskiva med vit yta"),
        ("Färg", "Vit"),
        ("Hjul", "Fyra"),
        ("Vikt", "13,5 kg"),
        ("Paketmått", "51 × 40 × 19,5 cm"),
        ("Ingår", "Kubhylla och monteringsanvisning"),
        ("Montering", "Krävs"),
    ],
    "4d5b3bb5": [
        ("Mått", "37 × 43,5 × 60 cm (bredd × djup × höjd)"),
        ("Lådor", "Tre – två grunda och en arkivlåda"),
        ("Låda invändigt", "30,5 × 40,5 × 7 cm (grund), 30,5 × 40,5 × 24 cm (arkiv)"),
        ("Pennfack", "32,3 × 10,7 × 2,2 cm, löstagbart"),
        ("Lås", "Ett nyckellås för alla tre lådorna"),
        ("Maxlast", "15 kg toppskiva, 5 kg per låda, 30 kg totalt"),
        ("Material", "Stål"),
        ("Färg", "Svart"),
        ("Hjul", "Fyra"),
        ("Vikt", "19 kg"),
        ("Paketmått", "65 × 51 × 45 cm"),
        ("Ingår", "Hurts och manual"),
        ("Montering", "Krävs"),
    ],
    "66866eb7": [
        ("Mått", "37 × 43,5 × 67,5 cm (bredd × djup × höjd)"),
        ("Lådor", "Två"),
        ("Låda invändigt", "30,5 × 40,5 × 24 cm"),
        ("Lås", "Ett nyckellås för båda lådorna"),
        ("Maxlast", "15 kg toppskiva, 5 kg per låda, 30 kg totalt"),
        ("Material", "Stål"),
        ("Färg", "Svart"),
        ("Hjul", "Fyra"),
        ("Vikt", "20 kg"),
        ("Paketmått", "72 × 51,5 × 45 cm"),
        ("Ingår", "Hurts och manual"),
        ("Montering", "Krävs"),
    ],
    "521aec3c": [
        ("Mått", "39 × 48 × 67 cm (bredd × djup × höjd)"),
        ("Lådor", "Två, lika djupa"),
        ("Låda invändigt", "32 × 44,5 × 24 cm"),
        ("Mellanvägg", "Ja, i lådan"),
        ("Lås", "Ett lås för båda lådorna, två nycklar ingår"),
        ("Maxlast", "5 kg per låda"),
        ("Material", "Stål"),
        ("Färg", "Vit"),
        ("Hjul", "Fyra"),
        ("Vikt", "22,3 kg"),
        ("Paketmått", "47 × 56 × 71,5 cm"),
        ("Ingår", "Hurts, två nycklar och manual"),
        ("Montering", "Krävs"),
    ],
    "9ba9af92": [
        ("Mått", "39 × 48 × 60 cm (bredd × djup × höjd)"),
        ("Lådor", "Tre – två grunda och en arkivlåda"),
        ("Låda invändigt", "32,6 × 43,2 × 7 cm (grund), 32,6 × 43,2 × 24 cm (arkiv)"),
        ("Hängmappar", "Skena för A4 i arkivlådan"),
        ("Lås", "Ett lås för alla tre lådorna, två nycklar ingår"),
        ("Maxlast", "15 kg per låda, 50 kg totalt"),
        ("Material", "Pulverlackerat kallvalsat stål"),
        ("Färg", "Vit"),
        ("Hjul", "Fyra länkhjul, två med broms, plus ett tippskyddshjul"),
        ("Vikt", "21 kg"),
        ("Paketmått", "47 × 56 × 64 cm"),
        ("Ingår", "Hurts, pennfack, två nycklar och manual"),
        ("Montering", "Krävs"),
    ],
    "3273d2ee": [
        ("Mått", "39 × 48 × 59 cm (bredd × djup × höjd)"),
        ("Lådor", "Tre – två grunda och en arkivlåda"),
        ("Låda invändigt", "32,6 × 43,2 × 7 cm (grund), 32,6 × 43,2 × 23,8 cm (arkiv)"),
        ("Lådfront", "13 cm hög (grund), 29 cm hög (arkiv), 38 cm bred"),
        ("Grepp", "Greppfri front, du drar under kanten"),
        ("Hängmappar", "Skena i arkivlådan"),
        ("Lås", "Ett lås för alla tre lådorna, två nycklar ingår"),
        ("Maxlast", "15 kg per låda, 50 kg totalt"),
        ("Material", "Stål"),
        ("Färg", "Vit"),
        ("Hjul", "Fyra länkhjul plus ett tippskyddshjul"),
        ("Vikt", "22 kg"),
        ("Paketmått", "47 × 56 × 64 cm"),
        ("Ingår", "Hurts, stiftfack, två nycklar och manual"),
        ("Montering", "Endast hjulen"),
    ],
    "9b8c7308": [
        ("Mått", "39 × 48 × 59 cm (bredd × djup × höjd)"),
        ("Lådor", "Tre – två grunda och en arkivlåda"),
        ("Låda invändigt", "32,6 × 43,2 × 7 cm (grund), 32,6 × 43,2 × 23,8 cm (arkiv)"),
        ("Grepp", "Avlångt handtag infällt i varje front"),
        ("Hängmappar", "Skena för A4, Letter och legal i arkivlådan"),
        ("Lås", "Ett lås för alla tre lådorna, två nycklar ingår"),
        ("Maxlast", "15 kg per låda, 50 kg totalt"),
        ("Material", "Stål"),
        ("Färg", "Vit med svart kantlist"),
        ("Hjul", "Fyra"),
        ("Vikt", "22 kg"),
        ("Paketmått", "47 × 56 × 64 cm"),
        ("Ingår", "Hurts, pennfack, två nycklar och manual"),
        ("Montering", "Krävs"),
    ],
    "21a12739": [
        ("Mått", "39 × 48 × 59 cm (bredd × djup × höjd)"),
        ("Lådor", "Tre – två grunda och en arkivlåda"),
        ("Låda invändigt", "32,6 × 43,2 × 7 cm (grund), 32,6 × 43,2 × 23,8 cm (arkiv)"),
        ("Grepp", "Avlångt handtag infällt i varje front"),
        ("Hängmappar", "Skena för A4 och A5 i arkivlådan"),
        ("Lås", "Ett lås för alla tre lådorna, två nycklar ingår"),
        ("Maxlast", "15 kg per låda, 50 kg totalt"),
        ("Material", "Kallvalsat stål"),
        ("Färg", "Svart"),
        ("Hjul", "Fyra länkhjul plus ett tippskyddshjul"),
        ("Vikt", "22 kg"),
        ("Paketmått", "47 × 56 × 64 cm"),
        ("Ingår", "Hurts, stiftfack, två nycklar och manual"),
        ("Montering", "Krävs"),
    ],
}

SKOTSEL = {
    "709f7aac":
        "Torka av med en lätt fuktad trasa och torka efter – ytan sitter på "
        "träskiva och mår inte bra av att stå blöt. Håll dig under 3 kilo per "
        "fack; hyllplanen är dimensionerade för papper och pärmar, inte för "
        "apparater. Dra hellre än lyfter när du flyttar den, och kontrollera "
        "skruvarna i hörnbeslagen första gången du rullat den en bit.",
    "4d5b3bb5":
        "Torka av plåten med en fuktad trasa och milt rengöringsmedel. Lacken "
        "skyddar stålet så länge den är hel – får den ett djupt jack kan kanten "
        "börja rosta, så bättra på den med lackstift. Lasta den tyngsta pärmen "
        "i arkivlådan längst ner, inte i den översta; ju lägre tyngdpunkt desto "
        "stadigare står hurtsen när lådan är utdragen.",
    "66866eb7":
        "Torka av plåten med en fuktad trasa och milt rengöringsmedel, och "
        "bättra på ett djupt jack i lacken med lackstift innan kanten hinner "
        "rosta. Den här stommen är den högre i serien, så håll "
        "tyngsta innehållet i den nedre lådan och dra bara ut en låda i taget "
        "när hurtsen står fritt på golvet.",
    "521aec3c":
        "Torka av med en fuktad trasa och milt rengöringsmedel. Lacken skyddar "
        "stålet så länge den är hel; bättra på jack med lackstift. Båda lådorna "
        "är lika djupa, så fördela vikten mellan dem i stället för att fylla "
        "den övre – och dra ut en i taget när hurtsen står fritt.",
    "9ba9af92":
        "Torka av med en fuktad trasa och milt rengöringsmedel. Pulverlacken "
        "skyddar stålet så länge den är hel, så bättra på ett djupt jack med "
        "lackstift. Lås de två hjul som har broms när du drar ut "
        "arkivlådan full – det femte hjulet håller emot, men en låst broms gör "
        "att hurtsen står still medan du letar.",
    "3273d2ee":
        "Torka av med en fuktad trasa och milt rengöringsmedel; lacken skyddar "
        "stålet så länge den är hel. Greppet sitter under fronten, så torka "
        "kanten då och då – det är där fingrarna tar. Skruva fast hjulen enligt "
        "anvisningen och dra åt dem igen efter någon vecka, när hurtsen fått "
        "sätta sig.",
    "9b8c7308":
        "Torka av med en fuktad trasa och milt rengöringsmedel. Lacken skyddar "
        "stålet så länge den är hel, så bättra på jack med lackstift. Det "
        "infällda handtaget samlar damm i botten av fördjupningen – en torr "
        "trasa räcker. Lasta tyngst längst ner och dra ut en låda i taget när "
        "hurtsen står fritt.",
    "21a12739":
        "Torka av med en fuktad trasa och milt rengöringsmedel. Svart lack "
        "visar damm och fingeravtryck tydligare än vit, så en mikrofibertrasa "
        "gör mest nytta här. Lacken skyddar stålet så länge den är hel; bättra "
        "på jack med lackstift. Dra ut en låda i taget när hurtsen står fritt.",
}

FAQ = {
    "709f7aac": [
        ("Kan jag ställa en skrivare på den?",
         "Nej. Varje fack tål 3 kilo och hela hyllan 9, medan en vanlig "
         "bordsskrivare väger 5 till 10. Hyllan är gjord för pärmar, papper "
         "och småsaker."),
        ("Går facken att vända åt samma håll?",
         "Nej, riktningen är given av hur stommen är byggd. Det är också "
         "poängen: du kommer åt hyllan från två sidor."),
        ("Har den lås eller luckor?",
         "Nej, alla tre facken är öppna."),
    ],
    "4d5b3bb5": [
        ("Ryms hängmappar i den djupa lådan?",
         "Lådan är 24 centimeter djup invändigt och 40,5 centimeter lång, så "
         "mappar och pärmar får plats stående. Någon skena för hängmappar "
         "följer däremot inte med."),
        ("Passar den under ett skrivbord?",
         "Den är 60 centimeter hög och 37 bred. Mät fri höjd under din skiva "
         "innan du beställer – skrivbord varierar."),
        ("Låses lådorna var för sig?",
         "Nej, ett nyckellås stänger alla tre samtidigt."),
    ],
    "66866eb7": [
        ("Varför bara två lådor?",
         "Båda lådorna blir djupare, så en hög pärmar får plats i en och samma "
         "låda i stället för att delas upp."),
        ("Hur hög är den?",
         "67,5 centimeter, alltså sju och en halv centimeter högre än den "
         "lägre systern i serien."),
        ("Kan jag ställa en skärm ovanpå?",
         "Toppskivan tål 15 kilo, så en vanlig skärm på fot går bra. Rulla "
         "hurtsen försiktigt när något står ovanpå."),
    ],
    "521aec3c": [
        ("Vad gör mellanväggen?",
         "Den delar lådan på längden så att pärmar och mappar står upp i "
         "stället för att glida ner när du drar ut lådan."),
        ("Låses lådorna var för sig?",
         "Nej, ett lås stänger båda samtidigt. Två nycklar följer med."),
        ("Är den ena lådan grundare?",
         "Nej, båda är 24 centimeter djupa invändigt."),
    ],
    "9ba9af92": [
        ("Vad gör det femte hjulet?",
         "Det sitter under arkivlådan och tar emot när du drar ut den full. En "
         "djup låda flyttar tyngdpunkten framåt, och hjulet möter den."),
        ("Ryms hängmappar?",
         "Ja, arkivlådan har en skena för hängmappar i A4."),
        ("Finns den i svart?",
         "Ja, samma hurts finns i svart utförande – länken står under "
         "beskrivningen."),
    ],
    "3273d2ee": [
        ("Hur öppnar man en låda utan handtag?",
         "Du greppar under fronten och drar. Fronten skjuter ut en bit över "
         "lådan under, och det är den kanten du tar i."),
        ("Hur mycket ska monteras?",
         "Bara hjulen. Stomme och lådor kommer hopsatta."),
        ("Låses lådorna var för sig?",
         "Nej, ett lås stänger alla tre samtidigt. Två nycklar följer med."),
    ],
    "9b8c7308": [
        ("Vad är skillnaden mot den greppfria modellen?",
         "Den här har ett avlångt handtag infällt i varje front och rundade "
         "hörn med svart kantlist. Den greppfria har helt släta fronter."),
        ("Vilka mappformat ryms?",
         "Arkivlådan har skena för hängmappar i A4, Letter och legal."),
        ("Finns den i svart?",
         "Ja, samma modell finns i svart – länken står under beskrivningen."),
    ],
    "21a12739": [
        ("Finns den i vitt?",
         "Ja, samma modell finns i vitt utförande – länken står under "
         "beskrivningen."),
        ("Vad gör hjulet under arkivlådan?",
         "Det tar emot när lådan dras ut full och tyngdpunkten flyttas framåt."),
        ("Låses lådorna var för sig?",
         "Nej, ett lås stänger alla tre samtidigt. Två nycklar följer med."),
    ],
}

# ☠️ KORSLÄNKARNA: nyckeln är antingen ett pid i SLUG eller en PUBLICERAD slug.
KORSLANK = {
    "709f7aac": [("4d5b3bb5", "Behöver du lådor som går att låsa? Se den smala hurtsen med tre lådor"),
                 ("3273d2ee", "Vill du ha en bredare med arkivlåda? Se den vita hurtsen med greppfri front")],
    "4d5b3bb5": [("66866eb7", "Vill du hellre ha två djupa lådor? Se samma smala hurts med två"),
                 ("3273d2ee", "Behöver du plats för hängmappar? Se den vita hurtsen med greppfri front")],
    "66866eb7": [("4d5b3bb5", "Vill du ha ett pennfack och tre lådor? Se samma smala hurts med tre"),
                 ("521aec3c", "Behöver du mellanvägg i lådan? Se den vita hurtsen med centrallås")],
    "521aec3c": [("66866eb7", "Vill du ha en smalare? Se den svarta hurtsen på 37 centimeter"),
                 ("9ba9af92", "Behöver du en grund pennlåda också? Se den vita hurtsen med tre lådor")],
    "9ba9af92": [("hurts-hjul-tre-lasbara-lador", "Samma hurts i svart utförande"),
                 ("3273d2ee", "Vill du ha släta fronter utan handtag? Se den greppfria modellen")],
    "3273d2ee": [("9b8c7308", "Vill du ha ett handtag att ta i? Se den vita hurtsen med infällt handtag"),
                 ("9ba9af92", "Behöver du broms på hjulen? Se den vita hurtsen på 60 centimeter")],
    "9b8c7308": [("21a12739", "Samma modell i svart utförande"),
                 ("3273d2ee", "Vill du ha helt släta fronter? Se den greppfria modellen")],
    "21a12739": [("9b8c7308", "Samma modell i vitt utförande"),
                 ("9ba9af92", "Vill du ha bromsar på hjulen? Se den vita hurtsen på 60 centimeter")],
}

PUBLICERAD = {"hurts-hjul-tre-lasbara-lador"}


def _slug(m):
    return SLUG.get(m, m)


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
              f"namn {len(v['namn']):3d}  sku {len(v['sku']):2d}")
