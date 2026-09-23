# -*- coding: utf-8 -*-
"""Runda 125: tio rullande verktygsvagnar och verktygsskåp i sex konstruktioner.

☠️ FLIKRUBRIKERNA ÄR EN ALLOWLIST PÅ FYRA STRÄNGAR i butikens `splitFlikar`.
   Rubriken måste heta `Användning och skötsel` ORDAGRANT, och korslänkarna
   måste ligga FÖRE `<h2>Tekniska specifikationer</h2>`.

☠️ `aff28a71` ÄR INTE MED. Två av dess bilder är byte-identiska (0,00) med
   publicerade `8723db20` — samma fysiska vara. Se STEG1-5.md.

☠️ SPEC-BLOCKETS `Mått` ÄR FEL PÅ TRE RADER. `35b4fba0` bär `5 Schubladen`,
   `bc698424` och `f4fabca6` bär `7 Schubladen` i måttfältet. Rätt yttermått
   står bara i brödtexten och på måttritningen: 69 × 33 × 75 cm.

☠️ `5745c3cb` ANGES SOM `Kunststoff` I SPEC-BLOCKET. Brödtexten säger
   "Robuster Stahlkörper" och den tyska specen `Stahl, Kunststoff`. Stommen
   är STÅL. Skriv aldrig plast som huvudmaterial här.

☠️ SÄG HUR DET LÅSES, inte bara ATT det låses (uppgift #459). Sex av tio har
   cylinderlås med två nycklar i leveransen. `5910cd6f` har cylinderlås men
   listar INTE nycklar i leveransen — lova därför inga.

☠️ `5447468e` ÄR SVART. Hjältebilden renderar lådfronterna ljusgrå; fyra av
   fem bilder visar samma skåp som entydigt svart. Färg avgörs på flera
   bilder, aldrig på hjälten.

🔒 Inget avsändarland. Inga priser, inga prisjämförelser. Inga påhittade tal.
   Mot kunden är VI leverantören — ingen mening får peka på någon annan.
"""

NAMN = {
    "6c9d7288": "Verktygsvagn 82 cm med tre plan och låda – blå med hålremsa",
    "3659a7eb": "Verktygsvagn 102 cm med avtagbar överkista och låsbart skåp",
    "bdd01b5f": "Verkstadsvagn med utdragbar arbetsyta 70–130 cm och två lådor",
    "5745c3cb": "Verktygslådor 3 delar i stål – stapelbart set på hjul med draghandtag",
    "35b4fba0": "Verktygsvagn 69 cm med fem lådor och nyckellås – röd, tål 150 kg",
    "bc698424": "Verktygsvagn 69 cm med sju lådor och nyckellås – mattsvart",
    "f4fabca6": "Verktygsvagn 69 cm med sju lådor och nyckellås – röd",
    "1b534b0e": "Verktygsskåp 82,5 cm med fem lådor på hjul – blått, nyckellås",
    "5447468e": "Verktygsskåp 82,5 cm med fem lådor på hjul – svart, nyckellås",
    "5910cd6f": "Rött verktygsskåp 131 cm i tre delar – sex lådor och två skåp",
}

SLUG = {
    "6c9d7288": "verktygsvagn-bla-3-plan",
    "3659a7eb": "verktygsvagn-overkista",
    "bdd01b5f": "verkstadsvagn-utdragbar",
    "5745c3cb": "verktygslada-set-3-delar",
    "35b4fba0": "verktygsvagn-rod-5-lador",
    "bc698424": "verktygsvagn-svart-7-lador",
    "f4fabca6": "verktygsvagn-rod-7-lador",
    "1b534b0e": "verktygsskap-bla-82-cm",
    "5447468e": "verktygsskap-svart-82-cm",
    "5910cd6f": "verktygsskap-131-cm-rod",
}

SKU = {
    "6c9d7288": "FP-verktygsvagn-bla-3-plan",
    "3659a7eb": "FP-verktygsvagn-overkista",
    "bdd01b5f": "FP-verkstadsvagn-utdragbar",
    "5745c3cb": "FP-verktygslada-set-3-delar",
    "35b4fba0": "FP-verktygsvagn-rod-5-lador",
    "bc698424": "FP-verktygsvagn-svart-7",
    "f4fabca6": "FP-verktygsvagn-rod-7-lador",
    "1b534b0e": "FP-verktygsskap-bla-82-cm",
    "5447468e": "FP-verktygsskap-svart-82-cm",
    "5910cd6f": "FP-verktygsskap-131-cm-rod",
}

TITEL = {
    "6c9d7288": "Verktygsvagn 82 cm blå – tre plan, låda och hålremsa | Fyndplats",
    "3659a7eb": "Verktygsvagn 102 cm med överkista och låsbart skåp | Fyndplats",
    "bdd01b5f": "Verkstadsvagn med utdragbar arbetsyta 130 cm | Fyndplats",
    "5745c3cb": "Verktygslådor 3 delar på hjul – stapelbart stålset | Fyndplats",
    "35b4fba0": "Verktygsvagn röd 69 cm – fem lådor och nyckellås | Fyndplats",
    "bc698424": "Verktygsvagn svart 69 cm – sju lådor och nyckellås | Fyndplats",
    "f4fabca6": "Verktygsvagn röd 69 cm – sju lådor och nyckellås | Fyndplats",
    "1b534b0e": "Verktygsskåp blått 82,5 cm – fem lådor på hjul | Fyndplats",
    "5447468e": "Verktygsskåp svart 82,5 cm – fem lådor på hjul | Fyndplats",
    "5910cd6f": "Rött verktygsskåp 131 cm – tre delar, sex lådor | Fyndplats",
}

META = {
    "6c9d7288": "Blå verktygsvagn 82 cm med tre plan, utdragbar låda och hålremsa "
                "för skruvmejslar. Tål 30 kg per plan och 60 kg totalt.",
    "3659a7eb": "Verktygsvagn 102 cm i två delar: avtagbar överkista med fyra lådor "
                "och ett rullskåp med låsbar dörr. Två nycklar ingår.",
    "bdd01b5f": "Verkstadsvagn vars arbetsyta drar ut från 70 till 130 cm. Två lådor "
                "med centrallås, övre fack och undre bricka. Tål 80 kg.",
    "5745c3cb": "Tre stapelbara verktygslådor i stål som låser i varandra. Teleskop"
                "handtag och stora hjul i bottenlådan. Tål 45 kg totalt.",
    "35b4fba0": "Röd verktygsvagn 69 cm med fem lika djupa lådor på kullagerskenor. "
                "Nyckellås, oljeupptagande mattor och 150 kg bärighet.",
    "bc698424": "Mattsvart verktygsvagn 69 cm med sju lådor: två grunda och fem djupa. "
                "Nyckellås, oljeupptagande mattor och 150 kg bärighet.",
    "f4fabca6": "Röd verktygsvagn 69 cm med sju lådor: två grunda och fem djupa. "
                "Nyckellås, oljeupptagande mattor och 150 kg bärighet.",
    "1b534b0e": "Blått verktygsskåp 82,5 cm med tre grunda och två djupa lådor på "
                "kullagerskenor. EVA-matta i varje låda, två nycklar ingår.",
    "5447468e": "Svart verktygsskåp 82,5 cm med tre grunda och två djupa lådor på "
                "kullagerskenor. EVA-matta i varje låda, två nycklar ingår.",
    "5910cd6f": "Rött verktygsskåp 131 cm i tre delar som går att dela: överkista med "
                "fyra lådor, mellankista och rullskåp med två lådor. Tål 100 kg.",
}

SOKORD = {
    "6c9d7288": ["blå verktygsvagn", "verktygsvagn tre plan", "verkstadsvagn på hjul",
                 "verktygsvagn med låda"],
    "3659a7eb": ["verktygsvagn med överkista", "verktygsskåp på hjul",
                 "låsbar verktygsvagn", "verktygsvagn två delar"],
    "bdd01b5f": ["verkstadsvagn med arbetsyta", "rullbord verkstad",
                 "verktygsvagn utdragbar", "mobilt arbetsbord"],
    "5745c3cb": ["verktygslåda på hjul", "verktygslådor set", "stapelbara verktygslådor",
                 "verktygslåda med draghandtag"],
    "35b4fba0": ["röd verktygsvagn", "verktygsvagn fem lådor", "verktygsvagn med lås",
                 "verkstadsvagn 150 kg"],
    "bc698424": ["svart verktygsvagn", "verktygsvagn sju lådor", "verktygsvagn med lås",
                 "verkstadsvagn 150 kg"],
    "f4fabca6": ["röd verktygsvagn", "verktygsvagn sju lådor", "verktygsvagn med lås",
                 "verkstadsvagn 150 kg"],
    "1b534b0e": ["blått verktygsskåp", "verktygsskåp på hjul", "verktygsskåp fem lådor",
                 "låsbart verktygsskåp"],
    "5447468e": ["svart verktygsskåp", "verktygsskåp på hjul", "verktygsskåp fem lådor",
                 "låsbart verktygsskåp"],
    "5910cd6f": ["verktygsskåp på hjul", "verktygsskåp tre delar", "högt verktygsskåp",
                 "verktygsskåp med skåp"],
}

INTRO = {
    "6c9d7288": "Tre öppna plan i stål, en utdragbar låda och en hålremsa där "
                "skruvmejslarna står sorterade efter storlek. Vagnen är 82 centimeter "
                "bred, väger 14,5 kilo och rullar dit arbetet är på fyra hjul, varav "
                "två med broms.",
    "3659a7eb": "Överkistan lyfts av och bärs in i huset; rullskåpet står kvar i "
                "garaget. Fyra lådor sitter i kistan och en i skåpet, dörren går att "
                "låsa och krokarna på insidan tar hand om det som inte får plats i en "
                "låda. Hela enheten är 102 centimeter hög.",
    "bdd01b5f": "Arbetsytan drar ut från 70 till 130 centimeter, så vagnen blir dubbelt "
                "så lång när delarna ska ligga framme. Under locket ett fack på nästan "
                "sjuttio centimeter, därunder två lådor med centrallås, och längst ner "
                "en bricka med 34 centimeters fri höjd.",
    "5745c3cb": "Tre kistor som låser i varandra och lika gärna används var för sig. "
                "Överst en organiser med uttagbar insats, i mitten två lådor på "
                "kullager, underst en djup kista med fällbart lock, teleskophandtag och "
                "stora hjul. Hela stapeln är 72 centimeter hög.",
    "35b4fba0": "Fem lådor, alla lika djupa, alla på kullagerskenor och alla klädda med "
                "en matta som suger upp olja. Bänkskivan är 61,6 centimeter bred, låset "
                "stänger kistan och vagnen bär 150 kilo fördelat på lådorna.",
    "bc698424": "Sju lådor i mattsvart stål: två grunda överst för det som annars "
                "försvinner, fem djupa under för nycklar och maskiner. Alla går på "
                "kullagerskenor med oljeupptagande matta i botten, och vagnen bär "
                "150 kilo totalt.",
    "f4fabca6": "Sju lådor i rött stål: två grunda överst för det som annars försvinner, "
                "fem djupa under för nycklar och maskiner. Alla går på kullagerskenor "
                "med oljeupptagande matta i botten, och vagnen bär 150 kilo totalt.",
    "1b534b0e": "Tre grunda lådor för nycklar och bits, två djupa för maskiner och "
                "slangar. Skåpet är 82,5 centimeter högt utan handtaget, varje låda är "
                "klädd med EVA-matta som tar hand om olja, och hela skåpet låses med "
                "nyckel.",
    "5447468e": "Tre grunda lådor för nycklar och bits, två djupa för maskiner och "
                "slangar. Skåpet är 82,5 centimeter högt utan handtaget, varje låda är "
                "klädd med EVA-matta som tar hand om olja, och hela skåpet låses med "
                "nyckel.",
    "5910cd6f": "Ett skåp på 131 centimeter som är tre saker samtidigt: en bärbar "
                "överkista med fyra lådor, en mellankista och ett rullskåp med två lådor "
                "och en låsbar dörr. Delarna lyfts isär när jobbet flyttar och staplas "
                "igen när det är klart.",
}

RUBRIK = {
    "6c9d7288": "Tre plan, en låda och plats för mejslarna",
    "3659a7eb": "Överkistan går att bära, skåpet står kvar",
    "bdd01b5f": "Arbetsytan blir dubbelt så lång",
    "5745c3cb": "Tre kistor som blir en – eller tvärtom",
    "35b4fba0": "Fem lika lådor bakom ett nyckellås",
    "bc698424": "Sju lådor i två djup, mattsvart",
    "f4fabca6": "Sju lådor i två djup, rött",
    "1b534b0e": "Fem lådor på kullager, blått",
    "5447468e": "Fem lådor på kullager, svart",
    "5910cd6f": "Tre delar, sex lådor och två skåp",
}

PUNKTER = {
    "6c9d7288": [
        "Tre öppna plan på 70 × 35 cm vardera, med 6 cm höga kanter som håller kvar det som ligger",
        "En utdragbar låda på 61 × 30 × 6,5 cm för det som ska ligga undan",
        "Hålremsa och perforerade sidor att hänga mejslar och nycklar i",
        "Tål 30 kg per plan och 60 kg totalt",
        "Fyra hjul, två av dem med broms, och ett handtag på kortsidan",
        "82 × 35 × 76 cm, väger 14,5 kg — verktygen på bilderna ingår inte",
    ],
    "3659a7eb": [
        "Fem lådor totalt: fyra i den avtagbara överkistan och en bred i rullskåpet",
        "Överkistan mäter 45 × 24 × 33 cm, har eget handtag och lyfts av hela",
        "Fyra lådor i kistan på 38 × 20 × 4 cm, plus ett fack under locket på 45 × 23 × 5 cm",
        "En bred låda i rullskåpet på 45 × 25 × 7,5 cm",
        "Nyckellås i skåpdörren, som har hålplåt och krokar på insidan — två nycklar ingår",
        "Två spärrar låser kistans fyra lådor och själva kistan",
        "Bär 50 kg i överkistan och 130 kg i rullskåpet, 10 kg per låda",
        "Fyra hjul, två med broms, plus en liten avlastningsskål på sidan",
        "60 × 28 × 102 cm totalt, väger 21,3 kg — verktygen på bilderna ingår inte",
    ],
    "bdd01b5f": [
        "Arbetsytan skjuts ut från 70 till 130 cm och ger en dubbelt så lång yta att lägga delar på",
        "Fack under locket på 69,5 × 37 × 9 cm för det som ska följa med vagnen",
        "Två lådor på 58 × 32 × 5,5 cm, båda stängda av samma centrallås",
        "Undre bricka på 69,5 × 37,5 × 5,5 cm med 34 cm fri höjd över sig",
        "Kullagerskenor och EVA-inlägg i lådorna, som tar hand om olja och håller verktygen på plats",
        "Tål 80 kg totalt: 10 kg per låda och 20 kg på brickan",
        "Fyra hjul, två låsbara, och ett draghandtag på kortsidan",
        "77,5–130 × 38 × 80 cm, väger 28 kg — verktygen på bilderna ingår inte",
    ],
    "5745c3cb": [
        "Tre kistor som griper i varandra och står stadigt staplade, eller används var för sig",
        "Överst en organiser med uttagbar insats på 45 × 20 × 4,5 cm",
        "I mitten två lådor på kullager, 39 × 21,5 × 6 cm vardera",
        "Underst en djup kista med fällbart lock, teleskophandtag och stora hjul",
        "Teleskophandtaget går från 63,5 till 100 cm, och varje kista har ett eget bärhandtag",
        "Stålstomme med repfast lackering och stållås på varje kista",
        "Tål 45 kg totalt och 15 kg per kista",
        "52 × 32 × 72 cm staplat, väger 17,2 kg — verktygen på bilderna ingår inte",
    ],
    "35b4fba0": [
        "Fem lådor, alla 51 × 29 × 10 cm, alla på kullagerskenor",
        "Matta i varje låda och på varje hylla som suger upp olja och håller verktygen still",
        "Bänkskiva på 61,6 × 33 cm ovanpå",
        "Cylinderlås som stänger kistan — två nycklar ingår",
        "Tål 15 kg per låda och 150 kg totalt",
        "Fyra hjul, två med broms, och ett handtag på kortsidan",
        "69 × 33 × 75 cm, väger 24,9 kg — verktygen på bilderna ingår inte",
    ],
    "bc698424": [
        "Sju lådor: två grunda på 51 × 29 × 4 cm och fem djupa på 51 × 29 × 8,5 cm",
        "Alla lådor går på kullagerskenor med oljeupptagande matta i botten",
        "Bänkskiva på 61,6 × 33 cm med halkskyddande yta",
        "Cylinderlås som stänger kistan — två nycklar ingår",
        "Tål 15 kg per låda och 150 kg totalt",
        "Fyra hjul, två med broms, och ett handtag på kortsidan",
        "69 × 33 × 75 cm, väger 25,7 kg — verktygen på bilderna ingår inte",
    ],
    "f4fabca6": [
        "Sju lådor: två grunda på 51 × 29 × 4 cm och fem djupa på 51 × 29 × 8,5 cm",
        "Alla lådor går på kullagerskenor med oljeupptagande matta i botten",
        "Bänkskiva på 61,6 × 33 cm med halkskyddande yta",
        "Cylinderlås som stänger kistan — två nycklar ingår",
        "Tål 15 kg per låda och 150 kg totalt",
        "Fyra hjul, två med broms, och ett handtag på kortsidan",
        "69 × 33 × 75 cm, väger 25,7 kg — verktygen på bilderna ingår inte",
    ],
    "1b534b0e": [
        "Fem lådor: tre grunda på 51 × 27,5 × 8,5 cm och två djupa på 51 × 27,5 × 17 cm",
        "EVA-matta i varje låda som suger upp olja och håller innehållet på plats",
        "Arbetsyta på 68 × 33 cm mätt med handtaget",
        "Cylinderlås som stänger skåpet — två nycklar ingår",
        "Tål 10 kg per grund låda och 20 kg per djup",
        "Fyra hjul och ett handtag på kortsidan",
        "61,5 × 33 × 82,5 cm utan handtaget, väger 25,7 kg — verktygen på bilderna ingår inte",
    ],
    "5447468e": [
        "Fem lådor: tre grunda på 51 × 27,5 × 8,5 cm och två djupa på 51 × 27,5 × 17 cm",
        "EVA-matta i varje låda som suger upp olja och håller innehållet på plats",
        "Arbetsyta på 68 × 33 cm mätt med handtaget",
        "Cylinderlås som stänger skåpet — två nycklar ingår",
        "Tål 10 kg per grund låda och 20 kg per djup",
        "Fyra hjul och ett handtag på kortsidan",
        "61,5 × 33 × 82,5 cm utan handtaget, väger 25,7 kg — verktygen på bilderna ingår inte",
    ],
    "5910cd6f": [
        "Tre delar som lyfts isär: överkista, mellankista och rullskåp",
        "Överkistan mäter 51 × 25 × 34,5 cm och har fyra lådor plus ett fack under locket på 50,5 × 25 × 4,5 cm",
        "Rullskåpet mäter 60,5 × 33 × 76 cm med handtag och hjul, och har två lådor",
        "Skåpdörren har hålplåt på insidan att hänga verktyg i, och en hylla som går att flytta",
        "Kullagerskenor med EVA-inlägg i lådorna, och cylinderlås i både överkistan och skåpdörren",
        "Tål 100 kg totalt: 5 kg per grund låda, 10 kg per djup, 30 kg i skåpet och 20 kg på bänkskivan",
        "Fyra hjul som går att låsa, och ett draghandtag på sidan",
        "60,5 × 33,5 × 131 cm staplat, väger 27 kg — verktygen på bilderna ingår inte",
    ],
}

SPEC = {
    "6c9d7288": [
        ("Mått", "82 × 35 × 76 cm (bredd × djup × höjd)"),
        ("Hyllplan", "3 st, 70 × 35 × 6 cm"),
        ("Låda", "61 × 30 × 6,5 cm"),
        ("Bärförmåga", "30 kg per plan, 60 kg totalt"),
        ("Material", "Stål"),
        ("Färg", "Blå med svart låda"),
        ("Hjul", "Fyra, två med broms"),
        ("Handtag", "På kortsidan"),
        ("Vikt", "14,5 kg"),
        ("Ingår", "Verktygsvagn och anvisning"),
    ],
    "3659a7eb": [
        ("Mått totalt", "60 × 28 × 102 cm (bredd × djup × höjd)"),
        ("Överkista", "45 × 24 × 33 cm, avtagbar"),
        ("Rullskåp", "60 × 28 × 72 cm"),
        ("Antal lådor", "5"),
        ("Lådor i överkistan", "4 st, 38 × 20 × 4 cm"),
        ("Låda i rullskåpet", "45 × 25 × 7,5 cm"),
        ("Fack under locket", "45 × 23 × 5 cm"),
        ("Skåpets innermått", "52 × 28 × 45 cm"),
        ("Bärförmåga", "50 kg överkistan, 130 kg rullskåpet, 10 kg per låda, 30 kg i skåpet"),
        ("Material", "Stål"),
        ("Färg", "Svart med röda fronter"),
        ("Lås", "Nyckellås i skåpdörren och två spärrar över lådorna, två nycklar ingår"),
        ("Hjul", "Fyra, två med broms"),
        ("Vikt", "21,3 kg"),
        ("Montering", "Krävs"),
        ("Ingår", "Överkista, rullskåp, två nycklar och bruksanvisning"),
    ],
    "bdd01b5f": [
        ("Mått", "77,5–130 × 38 × 80 cm (bredd × djup × höjd)"),
        ("Arbetsytan hopskjuten", "70 cm"),
        ("Arbetsytan utdragen", "130 cm"),
        ("Fack under locket", "69,5 × 37 × 9 cm"),
        ("Antal lådor", "2"),
        ("Lådmått", "58 × 32 × 5,5 cm"),
        ("Undre bricka", "69,5 × 37,5 × 5,5 cm, 34 cm fri höjd"),
        ("Bärförmåga", "80 kg totalt, 10 kg per låda, 20 kg på brickan"),
        ("Material", "Stål, EVA och plast"),
        ("Färg", "Svart"),
        ("Lås", "Centrallås över båda lådorna"),
        ("Hjul", "Fyra, två låsbara"),
        ("Markfrigång", "13 cm"),
        ("Vikt", "28 kg"),
        ("Montering", "Krävs"),
        ("Ingår", "Verkstadsvagn och bruksanvisning"),
    ],
    "5745c3cb": [
        ("Mått staplat", "52 × 32 × 72 cm (bredd × djup × höjd)"),
        ("Antal delar", "3 kistor"),
        ("Kisthöjder", "23 cm, 18 cm och 34 cm — alla 50 × 23,5 cm i botten"),
        ("Uttagbar insats", "45 × 20 × 4,5 cm"),
        ("Antal lådor", "2, vardera 39 × 21,5 × 6 cm"),
        ("Teleskophandtag", "63,5–100 cm"),
        ("Bärförmåga", "45 kg totalt, 15 kg per kista"),
        ("Material", "Stål med plastdetaljer"),
        ("Färg", "Röd och svart"),
        ("Vikt", "17,2 kg"),
        ("Ingår", "Tre verktygslådor och bruksanvisning"),
    ],
    "35b4fba0": [
        ("Mått", "69 × 33 × 75 cm (bredd × djup × höjd)"),
        ("Bänkskiva", "61,6 × 33 cm"),
        ("Antal lådor", "5"),
        ("Lådmått", "51 × 29 × 10 cm"),
        ("Bärförmåga", "15 kg per låda, 150 kg totalt"),
        ("Material", "Stål"),
        ("Färg", "Röd"),
        ("Lådinredning", "Oljeupptagande matta i lådor och på hyllor"),
        ("Lås", "Cylinderlås, två nycklar ingår"),
        ("Hjul", "Fyra, två med broms"),
        ("Handtag", "På kortsidan"),
        ("Vikt", "24,9 kg"),
        ("Ingår", "Verktygsvagn, två nycklar och bruksanvisning"),
    ],
    "bc698424": [
        ("Mått", "69 × 33 × 75 cm (bredd × djup × höjd)"),
        ("Bänkskiva", "61,6 × 33 cm"),
        ("Antal lådor", "7"),
        ("Grunda lådor", "2 st, 51 × 29 × 4 cm"),
        ("Djupa lådor", "5 st, 51 × 29 × 8,5 cm"),
        ("Bärförmåga", "15 kg per låda, 150 kg totalt"),
        ("Material", "Stål"),
        ("Färg", "Mattsvart"),
        ("Lådinredning", "Oljeupptagande matta i lådor och på hyllor"),
        ("Lås", "Cylinderlås, två nycklar ingår"),
        ("Hjul", "Fyra, två med broms"),
        ("Handtag", "På kortsidan"),
        ("Vikt", "25,7 kg"),
        ("Ingår", "Verktygsvagn, två nycklar och bruksanvisning"),
    ],
    "f4fabca6": [
        ("Mått", "69 × 33 × 75 cm (bredd × djup × höjd)"),
        ("Bänkskiva", "61,6 × 33 cm"),
        ("Antal lådor", "7"),
        ("Grunda lådor", "2 st, 51 × 29 × 4 cm"),
        ("Djupa lådor", "5 st, 51 × 29 × 8,5 cm"),
        ("Bärförmåga", "15 kg per låda, 150 kg totalt"),
        ("Material", "Stål"),
        ("Färg", "Röd"),
        ("Lådinredning", "Oljeupptagande matta i lådor och på hyllor"),
        ("Lås", "Cylinderlås, två nycklar ingår"),
        ("Hjul", "Fyra, två med broms"),
        ("Handtag", "På kortsidan"),
        ("Vikt", "25,7 kg"),
        ("Ingår", "Verktygsvagn, två nycklar och bruksanvisning"),
    ],
    "1b534b0e": [
        ("Mått", "61,5 × 33 × 82,5 cm utan handtaget (bredd × djup × höjd)"),
        ("Arbetsyta", "68 × 33 cm mätt med handtaget"),
        ("Antal lådor", "5"),
        ("Grunda lådor", "3 st, 51 × 27,5 × 8,5 cm"),
        ("Djupa lådor", "2 st, 51 × 27,5 × 17 cm"),
        ("Bärförmåga", "10 kg per grund låda, 20 kg per djup"),
        ("Material", "Stål"),
        ("Färg", "Blå"),
        ("Lådinredning", "EVA-matta i varje låda"),
        ("Lås", "Cylinderlås, två nycklar ingår"),
        ("Hjul", "Fyra"),
        ("Handtag", "På kortsidan"),
        ("Vikt", "25,7 kg"),
        ("Montering", "Krävs"),
        ("Ingår", "Verktygsskåp, två nycklar och bruksanvisning"),
    ],
    "5447468e": [
        ("Mått", "61,5 × 33 × 82,5 cm utan handtaget (bredd × djup × höjd)"),
        ("Arbetsyta", "68 × 33 cm mätt med handtaget"),
        ("Antal lådor", "5"),
        ("Grunda lådor", "3 st, 51 × 27,5 × 8,5 cm"),
        ("Djupa lådor", "2 st, 51 × 27,5 × 17 cm"),
        ("Bärförmåga", "10 kg per grund låda, 20 kg per djup"),
        ("Material", "Stål"),
        ("Färg", "Svart"),
        ("Lådinredning", "EVA-matta i varje låda"),
        ("Lås", "Cylinderlås, två nycklar ingår"),
        ("Hjul", "Fyra"),
        ("Handtag", "På kortsidan"),
        ("Vikt", "25,7 kg"),
        ("Montering", "Krävs"),
        ("Ingår", "Verktygsskåp, två nycklar och bruksanvisning"),
    ],
    "5910cd6f": [
        ("Mått staplat", "60,5 × 33,5 × 131 cm (bredd × djup × höjd)"),
        ("Överkista", "51 × 25 × 34,5 cm, avtagbar"),
        ("Fack under locket", "50,5 × 25 × 4,5 cm"),
        ("Mellankistans innermått", "51 × 23,5 × 21 cm"),
        ("Rullskåp", "60,5 × 33 × 76 cm med handtag och hjul, 53 × 33 × 66 cm utan"),
        ("Antal lådor", "6"),
        ("Grunda lådor", "42 × 22 × 3,5 cm invändigt"),
        ("Djupa lådor", "42 × 22 × 7,5 cm invändigt"),
        ("Bärförmåga", "100 kg totalt, 5 kg per grund låda, 10 kg per djup, 30 kg i skåpet, 20 kg på bänkskivan"),
        ("Material", "Pulverlackerat stål"),
        ("Färg", "Röd"),
        ("Lådinredning", "Kullagerskenor med EVA-inlägg"),
        ("Lås", "Cylinderlås i överkistan och i skåpdörren"),
        ("Hjul", "Fyra, låsbara"),
        ("Vikt", "27 kg"),
        ("Ingår", "Verktygsskåp och bruksanvisning"),
    ],
}

SKOTSEL = {
    "6c9d7288": "Planen är öppna och kanterna 6 centimeter höga — de håller kvar det som "
                "ligger, men de stoppar inte en tung nyckel som glider vid en snabb start. "
                "Lås bromsarna innan du drar ut lådan och lägg det tyngsta längst ner, så "
                "står vagnen stadigt. Torka av lacken med fuktig trasa och torka torrt; "
                "stående olja angriper plåten på sikt.",
    "3659a7eb": "Lyft av överkistan i sina egna handtag, inte i lådorna, och stäng de två "
                "spärrarna innan du lyfter — en olåst kista öppnar sig i luften. Lås "
                "skåpdörren när vagnen står obevakad och förvara reservnyckeln någon "
                "annanstans. Torka rent hålplåten på dörrens insida då och då, så sitter "
                "krokarna kvar där du satte dem.",
    "bdd01b5f": "Dra ut arbetsytan först när vagnen står stilla och bromsarna är låsta — "
                "utdragen flyttar sig tyngdpunkten långt utanför hjulen. Belasta den "
                "utdragna halvan lättare än den fasta. Vrid om centrallåset innan vagnen "
                "flyttas, så följer båda lådorna med stängda. Torka av lacken med fuktig "
                "trasa och håll skenorna fria från spån.",
    "5745c3cb": "Kontrollera att kistorna gripit i varandra innan du drar i handtaget — en "
                "stapel som inte låst i botten skiljs åt när hjulen tar i en tröskel. Lägg "
                "den tyngsta kistan underst. Teleskophandtaget dras ut i två steg och ska "
                "skjutas in helt innan stapeln ställs undan. Torka stålytorna torra efter "
                "arbete i fukt.",
    "35b4fba0": "Vrid om låset innan vagnen rullas — det stänger kistan, och en olåst låda "
                "som åker ut under färd river med sig det som står i vägen. Lägg det "
                "tyngsta i de nedersta lådorna och dra aldrig ut mer än en full låda i "
                "taget; även en vagn måttsatt för 150 kilo blir ostadig när tyngden hamnar "
                "framför hjulen. Mattorna lyfts ur och sköljs av.",
    "bc698424": "Vrid om låset innan vagnen rullas — det stänger kistan, och en olåst låda "
                "som åker ut under färd river med sig det som står i vägen. De två grunda "
                "lådorna är fyra centimeter djupa och tar bits och mätdon; det tunga hör "
                "hemma längre ner. Dra aldrig ut mer än en full låda i taget. Matt svart "
                "lack visar fingeravtryck tydligare än ljusare färger — torka med fuktig "
                "trasa och torka torrt.",
    "f4fabca6": "Vrid om låset innan vagnen rullas — det stänger kistan, och en olåst låda "
                "som åker ut under färd river med sig det som står i vägen. De två grunda "
                "lådorna är fyra centimeter djupa och tar bits och mätdon; det tunga hör "
                "hemma längre ner. Dra aldrig ut mer än en full låda i taget. Torka av "
                "lacken med fuktig trasa och torka torrt.",
    "1b534b0e": "Skåpet levereras omonterat. Skruva ihop stommen på ett plant golv och "
                "sätt hjulen sist, så står det stadigt medan du drar åt. Kontrollera att "
                "alla fyra hjul når golvet innan du fyller lådorna. Lägg det tyngsta i de "
                "två djupa lådorna längst ner och lås med nyckeln innan skåpet flyttas. "
                "EVA-mattorna lyfts ur och torkas av.",
    "5447468e": "Skåpet levereras omonterat. Skruva ihop stommen på ett plant golv och "
                "sätt hjulen sist, så står det stadigt medan du drar åt. Kontrollera att "
                "alla fyra hjul når golvet innan du fyller lådorna. Lägg det tyngsta i de "
                "två djupa lådorna längst ner och lås med nyckeln innan skåpet flyttas. "
                "EVA-mattorna lyfts ur och torkas av.",
    "5910cd6f": "Lyft aldrig hela stapeln i ett stycke — dela den i sina tre delar först, "
                "och lyft varje kista i sitt eget handtag. Stapla i storleksordning med "
                "rullskåpet underst, och lås hjulen innan du drar ut en låda. Skåpets "
                "hylla flyttas när innehållet ändrar höjd. Torka av lacken med fuktig "
                "trasa och håll hålplåten på dörren ren, så sitter krokarna stadigt.",
}

FAQ = {
    "6c9d7288": [
        ("Ingår verktygen som syns på bilderna?",
         "Nej. Du får vagnen och en anvisning. Verktygen på bilderna är där för att visa "
         "hur planen och hålremsan kan användas."),
        ("Hur mycket tål den?",
         "30 kilo per plan och 60 kilo totalt. Totalvikten är det tak som gäller när alla "
         "tre planen är fyllda."),
        ("Har den några lådor?",
         "En, på 61 × 30 × 6,5 centimeter. Resten är tre öppna plan med 6 centimeter höga "
         "kanter."),
        ("Går den att bromsa?",
         "Ja, två av de fyra hjulen har broms."),
    ],
    "3659a7eb": [
        ("Går delarna att använda var för sig?",
         "Ja. Överkistan har egna handtag och lyfts av hel; rullskåpet fungerar lika bra "
         "utan den ovanpå."),
        ("Hur många lådor har den?",
         "Fem: fyra i överkistan och en bred i rullskåpet. Utöver dem finns ett fack under "
         "kistans lock och ett skåpsutrymme bakom dörren."),
        ("Går den att låsa?",
         "Skåpdörren har nyckellås och två nycklar ingår. Kistans fyra lådor hålls "
         "stängda av två spärrar."),
        ("Vad tål rullskåpet?",
         "130 kilo, och överkistan 50 kilo. Varje enskild låda tar 10 kilo."),
    ],
    "bdd01b5f": [
        ("Hur mycket längre blir arbetsytan?",
         "Från 70 till 130 centimeter — nästan dubbelt. Vagnens stomme är 77,5 centimeter "
         "bred hopskjuten."),
        ("Ingår verktygen som syns på bilderna?",
         "Nej. Du får vagnen och en bruksanvisning."),
        ("Låses båda lådorna samtidigt?",
         "Ja, ett centrallås stänger dem båda i ett grepp."),
        ("Hur mycket tål den?",
         "80 kilo totalt: 10 kilo i varje låda och 20 kilo på den undre brickan."),
    ],
    "5745c3cb": [
        ("Går kistorna att använda var för sig?",
         "Ja. Varje kista har ett eget handtag och fungerar självständigt. De griper i "
         "varandra när du vill ha dem som en enhet."),
        ("Vilket material är den i?",
         "Stål med plastdetaljer. Ytan är lackerad och tål repor från verktyg."),
        ("Hur mycket tål setet?",
         "45 kilo totalt och 15 kilo per kista."),
        ("Hur många lådor finns det?",
         "Två, i mittkistan, på 39 × 21,5 × 6 centimeter vardera. Överkistan har en "
         "uttagbar insats och bottenkistan ett fällbart lock."),
    ],
    "35b4fba0": [
        ("Ingår verktygen som syns på bilderna?",
         "Nej. Du får vagnen, två nycklar och en bruksanvisning."),
        ("Hur många lådor har den?",
         "Fem, alla lika djupa: 51 × 29 × 10 centimeter."),
        ("Går den att låsa?",
         "Ja, med cylinderlås. Två nycklar ingår."),
        ("Vad skiljer den från de andra färgerna?",
         "Bara färgen. Mått, lådor, lås och bärighet är desamma."),
    ],
    "bc698424": [
        ("Ingår verktygen som syns på bilderna?",
         "Nej. Du får vagnen, två nycklar och en bruksanvisning."),
        ("Hur många lådor har den?",
         "Sju: två grunda på fyra centimeter överst och fem djupa på 8,5 centimeter under."),
        ("Går den att låsa?",
         "Ja, med cylinderlås. Två nycklar ingår."),
        ("Vad skiljer den från den röda?",
         "Bara färgen. Den här är mattsvart; mått, lådantal, lås och bärighet är identiska."),
    ],
    "f4fabca6": [
        ("Ingår verktygen som syns på bilderna?",
         "Nej. Du får vagnen, två nycklar och en bruksanvisning."),
        ("Hur många lådor har den?",
         "Sju: två grunda på fyra centimeter överst och fem djupa på 8,5 centimeter under."),
        ("Går den att låsa?",
         "Ja, med cylinderlås. Två nycklar ingår."),
        ("Vad skiljer den från den svarta?",
         "Bara färgen. Den här är röd; mått, lådantal, lås och bärighet är identiska."),
    ],
    "1b534b0e": [
        ("Hur många lådor har den?",
         "Fem: tre grunda på 8,5 centimeter och två djupa på 17 centimeter."),
        ("Krävs montering?",
         "Ja. Skåpet levereras omonterat med bruksanvisning."),
        ("Går den att låsa?",
         "Ja, med cylinderlås. Två nycklar ingår."),
        ("Hur mycket tål lådorna?",
         "10 kilo i en grund låda och 20 kilo i en djup."),
    ],
    "5447468e": [
        ("Hur många lådor har den?",
         "Fem: tre grunda på 8,5 centimeter och två djupa på 17 centimeter."),
        ("Krävs montering?",
         "Ja. Skåpet levereras omonterat med bruksanvisning."),
        ("Går den att låsa?",
         "Ja, med cylinderlås. Två nycklar ingår."),
        ("Vad skiljer den från den blå?",
         "Bara färgen. Mått, lådantal, lås och bärighet är identiska."),
    ],
    "5910cd6f": [
        ("Går delarna att använda var för sig?",
         "Ja, det är hela poängen. Överkistan, mellankistan och rullskåpet lyfts isär och "
         "fungerar var för sig."),
        ("Hur många lådor finns det?",
         "Sex: fyra i överkistan och två i rullskåpet. Utöver dem finns ett fack under "
         "locket och ett skåpsutrymme med flyttbar hylla."),
        ("Går den att låsa?",
         "Överkistan och skåpdörren har varsitt cylinderlås. Leveransen består av skåpet "
         "och en bruksanvisning."),
        ("Hur mycket tål den?",
         "100 kilo totalt: 5 kilo i en grund låda, 10 i en djup, 30 kilo i skåpet och "
         "20 kilo på bänkskivan."),
    ],
}

# ☠️ Länkar till PUBLICERADE sidor bär deras verkliga slug, inte rundans.
PUBLICERAD = {
    "8723db20": "verktygsvagn-med-hjul-verkstadsvagn",
    "887d388d": "verktygsvagn-83-cm-tre-plan-verktygshal",
    "12cb8a2c": "verkstadsvagn-stal-lasbar-lada",
    "65b07b7a": "verktygsvagn-med-lador-verktygsskap-pa-hjul-3-i-1",
    "f9de10ab": "verktygsvagn-svart-5-lador",
    "50a64a95": "verkstadsvagn-bla-5-lador",
    "3d71da2b": "verktygsskap-med-overskap",
    "94925af2": "verktygslada-60-cm-sex-ladar-rod",
}

KORSLANK = {
    "6c9d7288": [("8723db20", "Samma vagn i rött"),
                 ("887d388d", "Liknande vagn med högre kanter kring planen")],
    "3659a7eb": [("5910cd6f", "Högre modell i tre delar med sex lådor"),
                 ("65b07b7a", "Bredare variant med två dörrar och hålplansställ")],
    "bdd01b5f": [("6c9d7288", "Öppen vagn med tre plan i stället för lådor"),
                 ("12cb8a2c", "Verkstadsvagn med låsbar låda och tre plan")],
    "5745c3cb": [("3659a7eb", "Rullande skåp med avtagbar överkista"),
                 ("94925af2", "Verktygslåda med sex lådor att bära")],
    "35b4fba0": [("f9de10ab", "Samma vagn i svart"),
                 ("50a64a95", "Samma vagn i blått")],
    "bc698424": [("f4fabca6", "Samma vagn i rött"),
                 ("35b4fba0", "Röd vagn med fem lika djupa lådor")],
    "f4fabca6": [("bc698424", "Samma vagn i mattsvart"),
                 ("35b4fba0", "Röd vagn med fem lika djupa lådor")],
    "1b534b0e": [("5447468e", "Samma skåp i svart"),
                 ("50a64a95", "Blå vagn med fem lika djupa lådor")],
    "5447468e": [("1b534b0e", "Samma skåp i blått"),
                 ("f9de10ab", "Svart vagn med fem lika djupa lådor")],
    "5910cd6f": [("3659a7eb", "Lägre modell i två delar med fem lådor"),
                 ("3d71da2b", "Verktygsskåp med avtagbart överskåp och sex lådor")],
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
