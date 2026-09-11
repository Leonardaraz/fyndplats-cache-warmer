# -*- coding: utf-8 -*-
"""Runda 126: sex verkstadsprodukter — det man arbetar PÅ, inte det man rullar.

☠️ FLIKRUBRIKERNA ÄR EN ALLOWLIST PÅ FYRA STRÄNGAR i butikens `splitFlikar`.
   Rubriken måste heta `Användning och skötsel` ORDAGRANT, och korslänkarna
   måste ligga FÖRE `<h2>Tekniska specifikationer</h2>`.

☠️ `349b7403` ÄR INTE MED. Tre av dess bilder är byte-identiska (0,00) med
   publicerade `cef0d96a`, och fyra tal stämmer på decimalen. Se STEG1-5.md.

☠️ FÄRGEN KOMMER FRÅN BILDEN, INTE FRÅN NÅGON TEXT. Rundan bevisade att BÅDA
   textfälten ljuger, åt olika håll: `4a8e7f21` står som blatt-rott-vitt i
   spec-blocket men är svart och silver; `17e683e0` står som `Schwarz` i den
   tyska specen men är orange och svart. Skriv det bilderna visar.

☠️ `17e683e0`s tyska `Technische Daten` bär leverantörens ARTIKELNUMMER mitt i
   raden. Det får aldrig nå sidan, spec-tabellen eller det här repot.

☠️ `9e9c78b9` PÅSTÅR ATT PULVERLACKERAT STÅL ÄR ROSTBESTÄNDIGT. Lacken skyddar
   tills den skadas. Kvalificera alltid, som i runda 124 och 125.

☠️ `ed44170a`s NAMN SÄGER 1 160 kg — det är PARETS summa, inte en bocks.
   Säg båda talen och vilket som är vilket (uppgift #462).

⚠️ `3afe7275` har TVÅ vikter i källan, 8 och 8,8 kg. Sidan säger det HÖGRE,
   så ingen blir överraskad vid lyft.

🔒 Inget avsändarland. Inga priser, inga prisjämförelser. Inga påhittade tal.
   Mot kunden är VI leverantören — ingen mening får peka på någon annan.
"""

NAMN = {
    "3afe7275": "Stödbockar 2-pack i metall – teleskop 80–130 cm, tål 200 kg per bock",
    "17e683e0": "Sågbockar 2-pack orange – fyra höjdlägen 71–85,5 cm, 250 kg per bock",
    "ed44170a": "Arbetsbockar 2-pack röda – sju höjdlägen och 580 kg per bock",
    "4a8e7f21": "Kapsågstativ med två rullstöd – hopfällbart, 123,5–245 cm",
    "941867cb": "Verkstadsbänk på hjul med hålplank – viks ihop till 9 cm bredd",
    "9e9c78b9": "Verkstadsbänk 155 cm med hålplank, låda och två hyllplan",
}

SLUG = {
    "3afe7275": "stodbockar-2-pack-80-130-cm",
    "17e683e0": "sagbockar-2-pack-orange-250-kg",
    "ed44170a": "arbetsbockar-2-pack-roda-580-kg",
    "4a8e7f21": "kapsagstativ-rullstod-245-cm",
    "941867cb": "verkstadsbank-pa-hjul-hopfallbar",
    "9e9c78b9": "verkstadsbank-155-cm-med-lada",
}

# ☠️ SKU:n är `FP-` + så många HELA slug-tokens som ryms i 24 tecken, och
#    KROCKEN UPPSTÅR I DEN KAPADE STRÄNGEN, inte i sluggen (uppgift #473).
#    `sagbockar-…` och ett andra `sagbockar-…` hade båda kapats till
#    `FP-sagbockar-2-pack`; därför heter den ena `arbetsbockar`.
SKU = {
    "3afe7275": "FP-stodbockar-2-pack-80",
    "17e683e0": "FP-sagbockar-2-pack",
    "ed44170a": "FP-arbetsbockar-2-pack",
    "4a8e7f21": "FP-kapsagstativ-rullstod",
    "941867cb": "FP-verkstadsbank-pa-hjul",
    "9e9c78b9": "FP-verkstadsbank-155-cm",
}

TITEL = {
    "3afe7275": "Stödbockar 2-pack – teleskop 80–130 cm, 200 kg | Fyndplats",
    "17e683e0": "Sågbockar 2-pack orange – 71–85,5 cm, 250 kg | Fyndplats",
    "ed44170a": "Arbetsbockar 2-pack röda – sju lägen, 580 kg | Fyndplats",
    "4a8e7f21": "Kapsågstativ med rullstöd – 123,5–245 cm | Fyndplats",
    "941867cb": "Verkstadsbänk på hjul med hålplank – viks till 9 cm | Fyndplats",
    "9e9c78b9": "Verkstadsbänk 155 cm med hålplank och låda | Fyndplats",
}

META = {
    "3afe7275": "Två stödbockar med teleskopben som går från 80 till 130 centimeter i "
                "sex lägen. Tål 200 kilo per bock och viks platt till 15 centimeter.",
    "17e683e0": "Två orange sågbockar med fyra höjdlägen mellan 71 och 85,5 centimeter. "
                "Krokar för reglar, halkfria fötter och 250 kilo per bock.",
    "ed44170a": "Två röda arbetsbockar med sju höjdlägen 64–81 centimeter, EVA-klädd "
                "ovansida och sidokrokar för reglar. 580 kilo per bock.",
    "4a8e7f21": "Hopfällbart stativ för kap- och geringssåg med två rullstöd som dras "
                "ut från 123,5 till 245 centimeter. Två hjul och handtag.",
    "941867cb": "Verkstadsbänk 115 centimeter med hålplank och 30 krokar. Viks ihop "
                "till 9 centimeters bredd och rullar undan på två hjul.",
    "9e9c78b9": "Verkstadsbänk 80 × 40,5 × 155 centimeter med hålplank, låda, övre "
                "hylla och två hyllplan. Bänkskivan sitter på 91,5 centimeter.",
}

SOKORD = {
    "3afe7275": ["stödbockar", "höjdjusterbar stödbock", "arbetsbockar 2-pack",
                 "hopfällbar stödbock"],
    "17e683e0": ["sågbockar", "sågbockar 2-pack", "höjdjusterbar sågbock",
                 "hopfällbar sågbock"],
    "ed44170a": ["arbetsbockar", "arbetsbock 2-pack", "kraftig sågbock",
                 "höjdjusterbar arbetsbock"],
    "4a8e7f21": ["kapsågstativ", "stativ till kapsåg", "geringssågstativ",
                 "sågbord med rullstöd"],
    "941867cb": ["verkstadsbänk på hjul", "hopfällbar verkstadsbänk",
                 "arbetsbänk med hålplank", "mobil arbetsbänk"],
    "9e9c78b9": ["verkstadsbänk", "arbetsbänk med hålplank", "verkstadsbänk med låda",
                 "arbetsbänk garage"],
}

INTRO = {
    "3afe7275": "Två bockar med teleskopben som låses med sprint i sex lägen mellan 80 "
                "och 130 centimeter. Den övre balken är 53 centimeter lång och fast, så "
                "bocken bär lika mycket oavsett vilket läge du valt. Hopfälld blir varje "
                "bock 15 centimeter bred och står mot väggen.",
    "17e683e0": "Två orange sågbockar som viks ut på ett par sekunder och låses i fyra "
                "höjder mellan 71 och 85,5 centimeter. Ovansidan är 82,5 centimeter lång "
                "med urtag som håller kvar en regel, och hopfällda blir de 10,5 "
                "centimeter tjocka.",
    "ed44170a": "Två röda arbetsbockar byggda för det tunga: 580 kilo per bock, sju "
                "höjdlägen mellan 64 och 81 centimeter och en ovansida klädd med EVA som "
                "tar emot virket. Under balken sitter stödstänger där du lägger "
                "reglar medan du arbetar.",
    "4a8e7f21": "Ett stativ som tar hand om kap- och geringssågen och det långa virket "
                "samtidigt. Snabbfästena låser sågen på plats, och de två rullstöden "
                "skjuts ut så att avståndet mellan dem går från 101,5 till 235 "
                "centimeter. Hopfällt rullar det på två hjul.",
    "941867cb": "En verkstadsbänk som viker ihop sig till 9 centimeters bredd och rullar "
                "in i en hörna. Hålplanket är 105 centimeter brett och kommer med 30 "
                "krokar; arbetsytan är 115 × 60 centimeter i melaminbelagd skiva som "
                "tål repor och torkas av med en trasa.",
    "9e9c78b9": "En fast verkstadsbänk på 80 × 40,5 × 155 centimeter där allt har sin "
                "plats: hålplank med krokar högst upp, en hylla ovanför skivan, en låda "
                "under den och två hyllplan under. Bänkskivan sitter på 91,5 centimeter, "
                "alltså i höjd för att stå och arbeta.",
}

RUBRIK = {
    "3afe7275": "Sex lägen, en sprint och en fast balk",
    "17e683e0": "Fyra höjder och urtag som håller regeln",
    "ed44170a": "Sju lägen, EVA på ovansidan och krokar på sidan",
    "4a8e7f21": "Sågen låses fast, virket får stöd",
    "941867cb": "Nio centimeter bred när den inte används",
    "9e9c78b9": "Fyra förvaringsplan och ett hålplank",
}

PUNKTER = {
    "3afe7275": [
        "Teleskopben i sex lägen mellan 80 och 130 centimeter, låsta med sprint och "
        "säkrad med kedja så att sprinten inte tappas bort",
        "Den övre balken är 53 centimeter och sitter fast — bocken tål 200 kilo i "
        "alla sex lägen",
        "Viks platt till 68 × 15 × 80 centimeter och står mot väggen eller ligger i "
        "bagageluckan",
        "Svart lackerad stomme med teleskopdelen i förzinkad plåt",
        "Levereras som ett par, alltså två bockar",
        "Cirka 8,8 kilo per bock",
    ],
    "17e683e0": [
        "Fyra höjdlägen mellan 71 och 85,5 centimeter, så att paret kan ställas i "
        "våg även på ett golv som lutar",
        "250 kilo per bock, 500 kilo när du använder båda två",
        "Urtaget på ovansidan tar en regel i 2x4-format, så du kan bygga en längre "
        "arbetsyta av två bockar och en planka",
        "Ovansidan är 82,5 × 6,6 centimeter och hela bocken 93 centimeter lång",
        "Halkfria fotplattor håller bocken stilla på betong och trägolv",
        "Hopfälld blir varje bock 14 centimeter bred och 10,5 centimeter tjock",
        "Kräver ingen montering — vik ut och lås höjden",
    ],
    "ed44170a": [
        "580 kilo per bock, alltså 1 160 kilo när du använder båda två",
        "Sju höjdlägen mellan 64 och 81 centimeter",
        "Ovansidan är klädd med EVA-skum som ger friktion mot virket",
        "Sidokrokarna tar en regel i 2x6-format",
        "Stödstänger nertill där du lägger virke medan du arbetar",
        "Halkfria fötter som står stadigt även på ett ojämnt underlag",
        "Hopfälld blir varje bock 90 × 7 × 14 centimeter",
        "Kräver ingen montering",
    ],
    "4a8e7f21": [
        "Snabbfästena låser sågen på plats och lyfter av den lika snabbt",
        "Två rullstöd som skjuts ut: avståndet mellan dem går från 101,5 till 235 "
        "centimeter, och hela stativet från 123,5 till 245 centimeter",
        "Rullarnas höjd ställs var för sig, så att långt virke ligger i våg genom "
        "hela snittet",
        "Höjden ställs med en spak; arbetshöjden är 96 centimeter",
        "Ett av benen går att justera separat när golvet lutar",
        "Två hjul och ett handtag — stativet rullas som en säckkärra när det är "
        "hopfällt",
        "Stomme i legerat stål — stativet tål 150 kilo",
        "Kräver montering",
    ],
    "941867cb": [
        "Viks ihop till 9 centimeters bredd — hela bänken får plats mellan ett skåp "
        "och en vägg",
        "Hålplanket är 105 × 60 centimeter och 30 krokar följer med",
        "Arbetsytan är 115 × 60 centimeter i 1,8 centimeter tjock melaminbelagd skiva "
        "som tål repor och torkas ren",
        "Stålram med två ben och två hjul: du lyfter ena änden och rullar",
        "Tål 120 kilo totalt, varav 100 kilo på skivan och 20 kilo på hålplanket",
        "Fungerar lika bra som bakbord eller hobbybänk som i garaget",
        "Kräver montering",
    ],
    "9e9c78b9": [
        "Hålplank högst upp med krokar som följer med",
        "Övre hylla på 80 × 28 centimeter ovanför bänkskivan",
        "Låda under skivan med innermåttet 71 × 30,5 × 5 centimeter, på skenor som "
        "löper mjukt",
        "Två hyllplan under bänken, på 45,5 och 5 centimeters höjd",
        "Bänkskivan är 80 × 40 centimeter och sitter på 91,5 centimeter",
        "Tål 240 kilo totalt: 100 kilo på skivan, 50 kilo per hyllplan, 20 kilo på "
        "den övre hyllan och 20 kilo på hålplanket",
        "Halkfria fötter håller bänken stilla när du filar eller borrar",
        "Kräver montering",
    ],
}

SPEC = {
    "3afe7275": [
        ("Mått per bock", "68 × 56 × 80–130 cm (längd × bredd × höjd)"),
        ("Hopfällt", "68 × 15 × 80 cm"),
        ("Övre balk", "53 cm, fast"),
        ("Höjdlägen", "6 st mellan 80 och 130 cm"),
        ("Bärförmåga", "200 kg per bock"),
        ("Material", "Metall"),
        ("Färg", "Svart med teleskopdel i förzinkad plåt"),
        ("Låsning", "Sprint med säkringskedja"),
        ("Vikt", "Cirka 8,8 kg per bock"),
        ("Ingår", "Två stödbockar"),
    ],
    "17e683e0": [
        ("Mått per bock", "93 × 50 × 71–85,5 cm (längd × bredd × höjd)"),
        ("Hopfällt", "93 × 14 × 10,5 cm"),
        ("Ovansida", "82,5 × 6,6 cm"),
        ("Höjdlägen", "4 st mellan 71 och 85,5 cm"),
        ("Bärförmåga", "250 kg per bock, 500 kg för paret"),
        ("Urtag", "Passar regel i 2x4-format"),
        ("Material", "Metall och plast"),
        ("Färg", "Orange med svarta ben"),
        ("Vikt", "10 kg för paret"),
        ("Montering", "Krävs inte"),
        ("Ingår", "Två sågbockar och bruksanvisning"),
    ],
    "ed44170a": [
        ("Mått per bock", "116 × 64 × 64–81 cm (längd × bredd × höjd)"),
        ("Hopfällt", "90 × 7 × 14 cm"),
        ("Ovansida", "90 × 7 cm, klädd med EVA"),
        ("Höjdlägen", "7 st mellan 64 och 81 cm"),
        ("Bärförmåga", "580 kg per bock, 1 160 kg för paret"),
        ("Sidokrokar", "Passar regel i 2x6-format"),
        ("Material", "Metall, EVA och plast"),
        ("Färg", "Röd med svarta ben"),
        ("Vikt", "19,1 kg för paret"),
        ("Montering", "Krävs inte"),
        ("Ingår", "Två arbetsbockar och bruksanvisning"),
    ],
    "4a8e7f21": [
        ("Mått utfällt", "123,5–245 × 73 × 96 cm (längd × bredd × höjd)"),
        ("Hopfällt", "44 × 34,5 × 123,5 cm"),
        ("Avstånd mellan rullarna", "101,5–235 cm"),
        ("Rulle", "Ø 4,5 × 26,5 cm"),
        ("Fäste för sågen", "Spår på 16 cm och 14 cm"),
        ("Arbetsavstånd för sågen", "5,5–36 cm"),
        ("Bärförmåga", "150 kg"),
        ("Material", "Legerat stål"),
        ("Färg", "Svart med silverfärgade skenor"),
        ("Hjul", "Två, med handtag"),
        ("Vikt", "18,1 kg"),
        ("Montering", "Krävs"),
        ("Ingår", "Sågstativ och bruksanvisning"),
    ],
    "941867cb": [
        ("Mått", "115 × 62 × 143,5 cm (bredd × djup × höjd)"),
        ("Hopfällt", "115 × 9 × 143,5 cm"),
        ("Arbetsyta", "115 × 60 cm, 1,8 cm tjock"),
        ("Hålplank", "105 × 60 × 2 cm"),
        ("Krokar", "30 st, ingår"),
        ("Bärförmåga", "120 kg totalt, 100 kg på skivan, 20 kg på hålplanket"),
        ("Material", "Stålram med melaminbelagd skiva"),
        ("Färg", "Svart"),
        ("Hjul", "Två"),
        ("Vikt", "22,4 kg"),
        ("Montering", "Krävs"),
        ("Ingår", "Verkstadsbänk och handbok"),
    ],
    "9e9c78b9": [
        ("Mått", "80 × 40,5 × 155 cm (bredd × djup × höjd)"),
        ("Bänkskiva", "80 × 40 cm, på 91,5 cm höjd"),
        ("Hålplank", "79 × 60 cm"),
        ("Övre hylla", "80 × 28 × 3 cm"),
        ("Låda", "71 × 30,5 × 5 cm invändigt"),
        ("Hyllplan", "2 st, 80 × 40 cm, på 45,5 cm och 5 cm höjd"),
        ("Bärförmåga", "240 kg totalt, 100 kg på skivan, 50 kg per hyllplan, "
                       "20 kg på övre hyllan, 20 kg på hålplanket"),
        ("Material", "Pulverlackerat stål med skiva och hyllplan i MDF"),
        ("Färg", "Svart stomme med hyllplan i omålad MDF"),
        ("Krokar", "Ingår"),
        ("Vikt", "26 kg"),
        ("Montering", "Krävs"),
        ("Ingår", "Verkstadsbänk, krokar och handbok"),
    ],
}

SKOTSEL = {
    "3afe7275": "Kontrollera att sprinten sitter hela vägen igenom båda hålen innan du "
                "lastar — det är den som bär, inte friktionen i teleskopet. Ställ båda "
                "bockarna i samma läge när de ska bära samma planka, annars hamnar hela "
                "lasten på den högre. Torka av lacken med fuktig trasa och torka torrt; "
                "står det vatten i teleskopröret fryser det fast på vintern.",
    "17e683e0": "Lås båda bockarna i samma av de fyra höjderna innan du lägger upp något, "
                "och lägg regeln i urtaget i stället för ovanpå kanten — då kan den inte "
                "rulla av. Vik ut bockarna helt tills benen tar emot; en halvt utfälld "
                "bock står på tre punkter i stället för fyra. Borsta bort sågspån ur "
                "gångjärnen då och då, annars går de trögt att fälla.",
    "ed44170a": "580 kilo gäller per bock och förutsätter att lasten ligger mitt på "
                "balken. Hänger en planka långt utanför bocken lyfter den andra änden, "
                "och då spelar bärförmågan ingen roll. EVA-skummet på ovansidan torkas "
                "av med fuktig trasa — lösningsmedel löser upp det. Fäll ihop bockarna "
                "torra, så att sprintarna inte kärvar nästa gång.",
    "4a8e7f21": "Dra ut den nedre rullbasen cirka 4 centimeter innan du fäller ihop "
                "stativet, annars kan den falla ner när du viker det. Kontrollera att "
                "båda snabbfästena är låsta innan du startar sågen, och ställ rullarna "
                "något LÄGRE än sågbordet, inte högre — ligger virket på rullarna i "
                "stället för på bordet blir snittet snett. Torka av skenorna och håll "
                "dem fria från spån, så löper rullarna lätt.",
    "941867cb": "Skivan är melaminbelagd och tål repor, men den är inte en skärmatta: "
                "lägg något emellan när du skär med kniv. Fäll ihop bänken tom — 30 "
                "krokar med verktyg på svänger med när planket viks. Rulla den på de två "
                "hjulen genom att lyfta i den motsatta änden, aldrig genom att dra i "
                "hålplanket. Torka av med fuktig trasa och torka torrt.",
    "9e9c78b9": "Stålet är pulverlackerat, och lacken skyddar så länge den är hel — får "
                "den ett djupt jack ner till plåten kan rost börja där, så bättra på med "
                "en droppe lackfärg. Lägg det tyngsta på det nedre hyllplanet, inte på "
                "den övre hyllan; bänken står stadigast med tyngdpunkten lågt. "
                "Hyllplanen i MDF ska torkas av torra — står vatten på en skärkant "
                "sväller skivan.",
}

FAQ = {
    "3afe7275": [
        ("Hur många bockar får jag?",
         "Två. Priset gäller paret."),
        ("Hur mycket tål de?",
         "200 kilo per bock. Talet gäller i alla sex höjdlägen, eftersom den övre balken "
         "sitter fast och inte är en del av teleskopet."),
        ("Hur låses höjden?",
         "Med en sprint genom två hål. Sprinten sitter i en kedja så att den hänger kvar "
         "på bocken när du drar ut den."),
        ("Går de att ha i bilen?",
         "Ja. Hopfälld är varje bock 68 × 15 × 80 centimeter och väger cirka 8,8 kilo."),
    ],
    "17e683e0": [
        ("Hur många bockar ingår?",
         "Två, plus en bruksanvisning. Priset gäller paret."),
        ("Ingår sågen och virket på bilderna?",
         "Nej. Du får två sågbockar och en anvisning. Sågen och virket på bilderna är "
         "där för att visa hur bockarna används."),
        ("Vad betyder urtaget på ovansidan?",
         "Det tar en regel i 2x4-format. Lägger du en regel i urtaget på båda bockarna "
         "får du en längre arbetsyta som inte kan rulla av."),
        ("Hur mycket tål de?",
         "250 kilo per bock och 500 kilo när du använder båda två."),
    ],
    "ed44170a": [
        ("Är 1 160 kilo per bock eller för båda?",
         "För båda. Varje bock tål 580 kilo, och paret alltså 1 160 kilo tillsammans."),
        ("Hur många höjder går de att ställa i?",
         "Sju, mellan 64 och 81 centimeter."),
        ("Vad är ovansidan klädd med?",
         "EVA-skum. Det ger friktion mot virket, så att det ligger stadigare när du sågar."),
        ("Vad är stödstängerna nertill till för?",
         "Att lägga virke på medan du arbetar. De är ett avlastningsplan, inte en andra "
         "arbetsyta."),
    ],
    "4a8e7f21": [
        ("Passar min kapsåg?",
         "Fästet har två spår, ett på 16 och ett på 14 centimeter, och arbetsavståndet "
         "går att ställa mellan 5,5 och 36 centimeter. Mät hålbilden i sågens fot mot "
         "de talen innan du beställer."),
        ("Ingår sågen?",
         "Nej. Du får stativet och en bruksanvisning."),
        ("Hur långt virke klarar det?",
         "Rullstöden går att dra isär till 235 centimeters avstånd, och hela stativet "
         "blir 245 centimeter långt."),
        ("Går det att flytta ihopfällt?",
         "Ja. Det har två hjul och ett handtag och rullas som en säckkärra."),
    ],
    "941867cb": [
        ("Hur smal blir den hopfälld?",
         "Nio centimeter. Höjden och bredden är oförändrade: 115 centimeter bred och "
         "143,5 centimeter hög."),
        ("Ingår krokarna till hålplanket?",
         "Ja, 30 stycken."),
        ("Hur mycket tål den?",
         "120 kilo totalt. Av det får 100 kilo ligga på arbetsytan och 20 kilo hänga "
         "på hålplanket."),
        ("Rullar den på fyra hjul?",
         "Nej, på två. Andra sidan står på ben, så bänken står still av sig själv — "
         "du lyfter benänden och rullar."),
    ],
    "9e9c78b9": [
        ("Går den att fälla ihop?",
         "Nej. Den här är en fast bänk som monteras en gång och står kvar."),
        ("Hur högt sitter bänkskivan?",
         "På 91,5 centimeter, alltså i höjd för att stå och arbeta."),
        ("Ingår krokarna till hålplanket?",
         "Ja."),
        ("Rostar den?",
         "Stålet är pulverlackerat, och lacken håller vatten borta så länge den är hel. "
         "Ett djupt jack ner till plåten kan börja rosta, så bättra på det."),
    ],
}

PUBLICERAD = {
    "1a8c63b2": "arbetsbock-hopfallbar-2-pack",
    "e1584981": "sagbockar-2-pack-hopfallbara-stal",
    "b583fe11": "hopfallbar-arbetsbank",
    "443c8878": "vaggstall-for-elverktyg",
    "cef0d96a": "arbetsplattform-hopfallbar-aluminium",
}

KORSLANK = {
    "3afe7275": [("1a8c63b2", "Bockar med fast höjd på 80 centimeter"),
                 ("17e683e0", "Sågbockar med urtag som håller kvar regeln")],
    "17e683e0": [("e1584981", "Lättare sågbockar med fast höjd"),
                 ("ed44170a", "Kraftigare bockar som tål mer än dubbelt så mycket")],
    "ed44170a": [("17e683e0", "Lättare sågbockar för mindre laster"),
                 ("3afe7275", "Stödbockar som går ända upp till 130 centimeter")],
    "4a8e7f21": [("ed44170a", "Bockar som tar det långa virket i stället"),
                 ("9e9c78b9", "Fast verkstadsbänk att ställa sågen på")],
    "941867cb": [("9e9c78b9", "Fast bänk med låda och två hyllplan"),
                 ("b583fe11", "Mindre hopfällbar arbetsbänk")],
    "9e9c78b9": [("941867cb", "Hopfällbar bänk på hjul som viks till 9 centimeter"),
                 ("443c8878", "Väggställ som håller elverktygen i stället")],
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
              f"namn {len(v['namn']):3d}  sku {len(v['sku']):2d}")
