# -*- coding: utf-8 -*-
"""Runda 124: elva bärbara verktygslådor i fyra konstruktioner.

☠️ FLIKRUBRIKERNA ÄR EN ALLOWLIST PÅ FYRA STRÄNGAR i butikens `splitFlikar`.
   Rubriken måste heta `Användning och skötsel` ORDAGRANT, och korslänkarna
   måste ligga FÖRE `<h2>Tekniska specifikationer</h2>`.

☠️ GRUPP A LÅSES MED HÄNGLÅS, INTE MED NYCKEL. Tyskans ord för "låsbar" är
   två spännlås med ögla; det finns ingen cylinder och ingen nyckel i
   leveransen. Bara grupp C (`94925af2`, `aae03048`) har äkta nyckellås med
   två nycklar. Se STEG2-5.md punkt F3. Skriv aldrig "låsbar" utan att säga
   HUR.

☠️ `370918a9` HAR TVÅ LÅDOR. Steg 1 skrev fyra. Brödtext, höjd och bild säger
   två. `94925af2`/`aae03048` HETER "3 Schubladen" och har SEX.

☠️ `22bedfb0` ANGES SOM `Farbe: Rot` MEN HAR SVARTA LÅDFRONTER. Facit är
   bilden, i tre lägen.

☠️ `7b544155` PÅSTÅR BÅDE "rostar inte" OCH "rostbeständig". Pulverlackerat
   SPCC-stål är rosthärdigt så länge lacken är hel. Ordet "rostfri" får
   inte förekomma.

🔒 Inget avsändarland. Inga priser. Inga påhittade tal.
"""

NAMN = {
    "7b544155": "Verktygslåda 56 cm som fälls upp i fem fack – röd, tål 25 kg",
    "22bedfb0": "Verktygslåda 45 cm med tre lådor och övre fack – röd med svarta fronter",
    "370918a9": "Verktygslåda 49,7 cm med två lådor och minilådor – svart och orange",
    "aafbf543": "Verktygslåda 51 cm med tre lådor och hänglåsöglor – svart och röd",
    "5541fbb0": "Verktygslåda 51 cm med tre lådor och hänglåsöglor – helröd",
    "0283be34": "Verktygslåda 51 cm med fyra lådor och hänglåsöglor – svart och röd",
    "8a6922ce": "Verktygslåda 51 cm med fyra lådor och hänglåsöglor – helröd",
    "b9cca4a6": "Verktygslåda 49,7 cm med fyra lådor och minilådor – svart och gul",
    "94925af2": "Verktygslåda 60 cm med sex lådor och nyckellås – röd och svart",
    "aae03048": "Verktygslåda 60 cm med sex lådor och nyckellås – helsvart",
    "f50b75d8": "Verktygslåda 49,7 cm med fyra lådor och minilådor – svart och orange",
}

SLUG = {
    "7b544155": "verktygslada-56-cm-uppfallbar-fem-fack",
    "22bedfb0": "verktygslada-45-cm-tre-ladar-ovre-fack",
    "370918a9": "verktygslada-49-cm-tva-ladar-minilador",
    "aafbf543": "verktygslada-51-cm-tre-ladar-svart-rod",
    "5541fbb0": "verktygslada-51-cm-tre-ladar-helrod",
    "0283be34": "verktygslada-51-cm-fyra-ladar-svart-rod",
    "8a6922ce": "verktygslada-51-cm-fyra-ladar-helrod",
    "b9cca4a6": "verktygslada-49-cm-fyra-ladar-gul",
    "94925af2": "verktygslada-60-cm-sex-ladar-rod",
    "aae03048": "verktygslada-60-cm-sex-ladar-svart",
    "f50b75d8": "verktygslada-49-cm-fyra-ladar-orange",
}

SKU = {
    "7b544155": "FP-verktygslada-uppfallbar",
    "22bedfb0": "FP-verktygslada-45-cm-tre",
    "370918a9": "FP-verktygslada-49-cm-tva",
    "aafbf543": "FP-verktygslada-51-tre-svart",
    "5541fbb0": "FP-verktygslada-51-tre-rod",
    "0283be34": "FP-verktygslada-51-fyra-svart",
    "8a6922ce": "FP-verktygslada-51-fyra-rod",
    "b9cca4a6": "FP-verktygslada-49-fyra-gul",
    "94925af2": "FP-verktygslada-60-sex-rod",
    "aae03048": "FP-verktygslada-60-sex-svart",
    "f50b75d8": "FP-verktygslada-49-fyra-orange",
}

TITEL = {
    "7b544155": "Uppfällbar verktygslåda 56 cm – fem fack i tre plan | Fyndplats",
    "22bedfb0": "Verktygslåda 45 cm – tre lådor på kullager och övre fack | Fyndplats",
    "370918a9": "Verktygslåda 49,7 cm – två lådor, minilådor och insats | Fyndplats",
    "aafbf543": "Verktygslåda 51 cm svart och röd – tre lådor, hänglåsöglor | Fyndplats",
    "5541fbb0": "Verktygslåda 51 cm helröd – tre lådor och hänglåsöglor | Fyndplats",
    "0283be34": "Verktygslåda 51 cm svart och röd – fyra lådor, 18 kg | Fyndplats",
    "8a6922ce": "Verktygslåda 51 cm helröd – fyra lådor och övre fack | Fyndplats",
    "b9cca4a6": "Verktygslåda 49,7 cm gul – fyra lådor och två minilådor | Fyndplats",
    "94925af2": "Verktygslåda 60 cm röd – sex lådor, nyckellås och 50 kg | Fyndplats",
    "aae03048": "Verktygslåda 60 cm helsvart – sex lådor och nyckellås | Fyndplats",
    "f50b75d8": "Verktygslåda 49,7 cm orange – fyra lådor och minilådor | Fyndplats",
}

META = {
    "7b544155": "Verktygslåda i stål som fälls upp till fem fack i tre plan. 56 cm stängd, 69 cm uppfälld, tål 25 kg och väger 4,2 kg. Bärhandtag med mjukt grepp.",
    "22bedfb0": "Kompakt verktygslåda 45 cm med tre lådor på kullagerskenor, övre fack och oljeabsorberande mattor. Röd stomme med svarta fronter, tål 20 kg.",
    "370918a9": "Verktygslåda 49,7 cm med två stållådor, stort övre fack, uttagbar plastinsats och två minilådor. Tål 30 kg och väger 8 kg.",
    "aafbf543": "Verktygslåda i kallvalsat stål med tre lådor och övre fack. Två spännlås med ögla för hänglås. 51 cm bred, tål 16 kg totalt.",
    "5541fbb0": "Helröd verktygslåda i kallvalsat stål med tre lådor och övre fack. Två spännlås med hänglåsögla. 51 cm bred, tål 16 kg totalt.",
    "0283be34": "Verktygslåda i kallvalsat stål med fyra lådor och övre fack. Två spännlås med ögla för hänglås. 51 cm bred, tål 18 kg totalt.",
    "8a6922ce": "Helröd verktygslåda i kallvalsat stål med fyra lådor och övre fack. Två spännlås med hänglåsögla. 51 cm bred, tål 18 kg totalt.",
    "b9cca4a6": "Verktygslåda 49,7 cm med fyra stållådor, övre fack, uttagbar insats och två minilådor. Gula fronter, tål 30 kg och väger 10,8 kg.",
    "94925af2": "Verktygslåda 60 cm med sex lådor på kullager, nyckellås och två nycklar. Gasfjädrat lock, sidohandtag och 50 kg total bärförmåga.",
    "aae03048": "Helsvart verktygslåda 60 cm med sex lådor, nyckellås och två nycklar. Gasfjädrat lock, sidohandtag och 50 kg total bärförmåga.",
    "f50b75d8": "Verktygslåda 49,7 cm med fyra stållådor, övre fack, uttagbar insats och två minilådor. Orange fronter, tål 30 kg och väger 12 kg.",
}

SOKORD = {
    "7b544155": ["uppfällbar verktygslåda", "verktygslåda stål", "verktygslåda fem fack", "bärbar verktygslåda"],
    "22bedfb0": ["verktygslåda med lådor", "liten verktygslåda", "verktygslåda 45 cm", "verktygslåda stål"],
    "370918a9": ["verktygslåda med lådor", "verktygslåda plast och stål", "verktygslåda minilådor", "bärbar verktygslåda"],
    "aafbf543": ["verktygslåda tre lådor", "verktygslåda med hänglås", "verktygslåda stål", "verktygslåda svart röd"],
    "5541fbb0": ["röd verktygslåda", "verktygslåda tre lådor", "verktygslåda med hänglås", "verktygslåda stål"],
    "0283be34": ["verktygslåda fyra lådor", "verktygslåda med hänglås", "verktygslåda stål", "verktygslåda svart röd"],
    "8a6922ce": ["röd verktygslåda", "verktygslåda fyra lådor", "verktygslåda med hänglås", "verktygslåda stål"],
    "b9cca4a6": ["verktygslåda fyra lådor", "gul verktygslåda", "verktygslåda minilådor", "bärbar verktygslåda"],
    "94925af2": ["verktygslåda med lås", "verktygslåda sex lådor", "verktygslåda 60 cm", "låsbar verktygslåda"],
    "aae03048": ["svart verktygslåda", "verktygslåda med lås", "verktygslåda sex lådor", "låsbar verktygslåda"],
    "f50b75d8": ["verktygslåda fyra lådor", "orange verktygslåda", "verktygslåda minilådor", "bärbar verktygslåda"],
}

INTRO = {
    "7b544155": "En verktygslåda som öppnar sig själv. Handtaget lyfter upp två par facken åt sidorna, och det som låg gömt under locket ligger plötsligt framme i tre plan. Stängd är den 56 centimeter bred och väger 4,2 kilo — uppfälld mäter den 69 centimeter tvärs över bänken.",
    "22bedfb0": "Den lilla lådan för den som tröttnat på att gräva. Tre utdragslådor på kullagerskenor tar skruvmejslar, tänger och smådelar var för sig, och locket öppnar ett fyrtiofyra centimeter brett fack ovanpå. 45 centimeter bred och 6,5 kilo tom — den följer med ut till bilen utan att bli ett projekt.",
    "370918a9": "Ett plasthölje som tål att ställas ner hårt, och två stållådor som glider ut på kullager. Under locket ligger ett fack på fyrtiosex centimeter med en uttagbar plastinsats, och i locket sitter två små sorteringslådor för skruv och plugg. Lådan är 28,9 centimeter hög och väger 8 kilo.",
    "aafbf543": "Tre utdragslådor och ett fack under locket, i ett hölje av kallvalsat stål som inte ger sig när lådan sätts ner i grus. Fronterna är röda mot en svart kropp, och två förkromade spännlås håller ihop hela stapeln när du bär. 51 centimeter bred och 10,5 kilo tom.",
    "5541fbb0": "Samma stålkropp och samma tre lådor, men helröd rakt igenom — kropp, lock och fronter. Två förkromade spännlås låser lock och lådor i ett grepp, och handtaget sitter mitt över tyngdpunkten. 51 centimeter bred, 32 centimeter hög och 10,5 kilo tom.",
    "0283be34": "Fyra lådor i stället för tre, och 7,5 centimeter högre kropp för att rymma dem. Kallvalsat stål, svart kropp med röda fronter och kullagerskenor som drar ut hela vägen. Två spännlås håller lock och lådor stängda under bärningen. 12,8 kilo tom.",
    "8a6922ce": "Fyra lådor, ett fack under locket och en helröd kropp i kallvalsat stål. Skenorna är kullagrade och går ut hela vägen, så den bakre delen av lådan är lika åtkomlig som den främre. 51 centimeter bred, 39,5 centimeter hög och 12,8 kilo tom.",
    "b9cca4a6": "Fyra gula stållådor i ett svart plasthölje, med ett fack på fyrtiosex centimeter under locket och två uttagbara minilådor i locket. Höljet tål att sättas ner på betong, lådorna glider på kullager, och hela lådan bär 30 kilo. 10,8 kilo tom.",
    "94925af2": "Sex lådor bakom ett riktigt lås. Tre små överst för hylsor och bits, tre genomgående under för det längre, och ett fack på nästan sextio centimeter under det gasfjädrade locket. Kroppen är svart stålplåt med röda fronter, och två nycklar följer med. 14,9 kilo tom.",
    "aae03048": "Samma sex lådor och samma nyckellås, men helsvart rakt igenom. Locket lyfts av två gasfjädrar och står kvar öppet, sidohandtagen fälls in mot kroppen, och alla sex lådorna går på kullagerskenor. 60 centimeter bred och 14,9 kilo tom.",
    "f50b75d8": "Fyra orange stållådor i ett svart plasthölje som klarar en verkstadsgolvbehandling. Under locket ett fack på fyrtiosex centimeter med uttagbar insats, och i locket två minilådor för skruv. Bär 30 kilo och väger 12 kilo tom.",
}

RUBRIK = {
    "7b544155": "Fem fack som fälls ut i tre plan",
    "22bedfb0": "Tre lådor och ett fack i 45 centimeters bredd",
    "370918a9": "Två lådor, ett fack och två minilådor",
    "aafbf543": "Tre lådor i kallvalsat stål",
    "5541fbb0": "Tre lådor i helröd stålkropp",
    "0283be34": "Fyra lådor i kallvalsat stål",
    "8a6922ce": "Fyra lådor i helröd stålkropp",
    "b9cca4a6": "Fyra lådor, ett fack och två minilådor",
    "94925af2": "Sex lådor bakom nyckellås",
    "aae03048": "Sex lådor bakom nyckellås, helsvart",
    "f50b75d8": "Fyra lådor, ett fack och två minilådor",
}

PUNKTER = {
    "7b544155": [
        "Fem fack fördelade på tre plan — handtaget fäller ut de fyra övre åt sidorna",
        "56 × 20 × 41 cm stängd, 69 × 53 × 23,5 cm uppfälld",
        "De två stora facken mäter 52,5 × 20 × 10 cm, de mindre 52,5 × 9,8 × 5 cm",
        "Pulverlackerat stål (SPCC) som står emot repor och rost så länge lacken är hel",
        "Bärhandtag med mjukt EVA-grepp över tyngdpunkten",
        "Tål 25 kg och väger 4,2 kg tom — ingen montering behövs",
        "Verktygen på bilderna ingår inte",
    ],
    "22bedfb0": [
        "Tre utdragslådor på kullagerskenor, var och en 38,5 × 20 × 4,5 cm",
        "Övre facket under locket mäter 44 × 23 × 5 cm",
        "Röd stomme med svarta lådfronter och silverfärgade greppslister",
        "Två spännlås i stål håller lock och lådor stängda under bärningen",
        "Mattor av EVA i botten suger upp olja och håller verktygen på plats",
        "45 × 24 × 27 cm, tål 20 kg och väger 6,5 kg tom",
        "Verktygen på bilderna ingår inte",
    ],
    "370918a9": [
        "Två stållådor på kullagerskenor, var och en 39 × 21,5 × 5 cm",
        "Stort fack under locket: 46 × 22 × 9 cm, med uttagbar plastinsats på 47 × 20 × 4 cm",
        "Två uttagbara minilådor på 14 × 11,5 × 3 cm sitter i locket — de ingår",
        "Hölje i slagtåligt plast med stållådor och repfast pulverlackering",
        "49,7 × 25,3 × 28,9 cm, tål 30 kg totalt och 10 kg per låda",
        "Väger 8 kg tom, lättare än en helmetallkonstruktion i samma storlek",
        "Verktygen på bilderna ingår inte",
    ],
    "aafbf543": [
        "Tre utdragslådor på kullagerskenor, var och en 45 × 19,5 × 5,5 cm",
        "Övre facket under locket mäter 50 × 22 × 6 cm",
        "Två förkromade spännlås med ögla för hänglås låser lock och lådor i ett grepp",
        "Hänglås och nyckel ingår inte — öglan tar en vanlig bygel",
        "Kropp i kallvalsat stål, svart, med röda lådfronter",
        "51 × 22 × 32 cm, tål 16 kg totalt: 2 kg per låda och 10 kg i övre facket",
        "Väger 10,5 kg tom och kräver ingen montering",
    ],
    "5541fbb0": [
        "Tre utdragslådor på kullagerskenor, var och en 45 × 19,5 × 5,5 cm",
        "Övre facket under locket mäter 50 × 22 × 6 cm",
        "Två förkromade spännlås med ögla för hänglås låser lock och lådor i ett grepp",
        "Hänglås och nyckel ingår inte — öglan tar en vanlig bygel",
        "Helröd kropp i kallvalsat stål, samma färg på lock och fronter",
        "51 × 22 × 32 cm, tål 16 kg totalt: 2 kg per låda och 10 kg i övre facket",
        "Väger 10,5 kg tom och kräver ingen montering",
    ],
    "0283be34": [
        "Fyra utdragslådor på kullagerskenor, var och en 45 × 19,5 × 5,5 cm",
        "Övre facket under locket mäter 50 × 22 × 6 cm",
        "Två förkromade spännlås med ögla för hänglås låser lock och lådor i ett grepp",
        "Hänglås och nyckel ingår inte — öglan tar en vanlig bygel",
        "Kropp i kallvalsat stål, svart, med röda lådfronter",
        "51 × 22 × 39,5 cm, tål 18 kg totalt: 2 kg per låda och 10 kg i övre facket",
        "Väger 12,8 kg tom och kräver ingen montering",
    ],
    "8a6922ce": [
        "Fyra utdragslådor på kullagerskenor, var och en 45 × 19,5 × 5,5 cm",
        "Övre facket under locket mäter 50 × 22 × 6 cm",
        "Två förkromade spännlås med ögla för hänglås låser lock och lådor i ett grepp",
        "Hänglås och nyckel ingår inte — öglan tar en vanlig bygel",
        "Helröd kropp i kallvalsat stål, samma färg på lock och fronter",
        "51 × 22 × 39,5 cm, tål 18 kg totalt: 2 kg per låda och 10 kg i övre facket",
        "Väger 12,8 kg tom och kräver ingen montering",
    ],
    "b9cca4a6": [
        "Fyra stållådor på kullagerskenor, var och en 39 × 21,5 × 5 cm",
        "Stort fack under locket: 46 × 22 × 9 cm, med uttagbar plastinsats på 47 × 20 × 4 cm",
        "Två uttagbara minilådor på 14 × 11,5 × 3 cm sitter i locket — de ingår",
        "Hölje i slagtåligt plast med gula stållådor och repfast pulverlackering",
        "49,7 × 25,3 × 40,7 cm, tål 30 kg totalt och 10 kg per låda",
        "Väger 10,8 kg tom, lättare än en helmetallkonstruktion i samma storlek",
        "Verktygen på bilderna ingår inte",
    ],
    "94925af2": [
        "Sex lådor: tre små överst på 15 × 22 × 3 cm och tre genomgående på 50,5 × 22 cm",
        "De två grunda genomgående lådorna är 3 cm djupa, den nedersta 7,5 cm",
        "Övre facket under locket mäter 59,5 × 25,5 × 6 cm",
        "Cylinderlås som stänger både lock och samtliga lådor — två nycklar ingår",
        "Locket lyfts av två gasfjädrar och står kvar öppet medan du arbetar",
        "Mattor av EVA i varje låda suger upp olja och skyddar lacken",
        "60 × 26 × 34 cm, tål 50 kg totalt: 15 kg per bred låda och 5 kg per liten",
        "Infällbara sidohandtag, väger 14,9 kg tom — verktygen på bilderna ingår inte",
    ],
    "aae03048": [
        "Sex lådor: tre små överst på 15 × 22 × 3 cm och tre genomgående på 50,5 × 22 cm",
        "De två grunda genomgående lådorna är 3 cm djupa, den nedersta 7,5 cm",
        "Övre facket under locket mäter 59,5 × 25,5 × 6 cm",
        "Cylinderlås som stänger både lock och samtliga lådor — två nycklar ingår",
        "Locket lyfts av två gasfjädrar och står kvar öppet medan du arbetar",
        "Helsvart pulverlackerad stålkropp, samma ton på lock, fronter och sidor",
        "60 × 26 × 34 cm, tål 50 kg totalt: 15 kg per bred låda och 5 kg per liten",
        "Infällbara sidohandtag, väger 14,9 kg tom — verktygen på bilderna ingår inte",
    ],
    "f50b75d8": [
        "Fyra stållådor på kullagerskenor, var och en 39 × 21,5 × 5 cm",
        "Stort fack under locket: 46 × 22 × 9 cm, med uttagbar plastinsats på 47 × 20 × 4 cm",
        "Två uttagbara minilådor på 14 × 11,5 × 3 cm sitter i locket — de ingår",
        "Hölje i slagtåligt plast med orange stållådor och repfast pulverlackering",
        "49,7 × 25,3 × 40,7 cm, tål 30 kg totalt och 10 kg per låda",
        "Väger 12 kg tom, lättare än en helmetallkonstruktion i samma storlek",
        "Verktygen på bilderna ingår inte",
    ],
}

SPEC = {
    "7b544155": [("Mått stängd", "56 × 20 × 41 cm"), ("Mått uppfälld", "69 × 53 × 23,5 cm"),
                 ("Antal fack", "5 i tre plan"), ("Stora facken", "52,5 × 20 × 10 cm"),
                 ("Små facken", "52,5 × 9,8 × 5 cm"), ("Material", "Pulverlackerat stål (SPCC)"),
                 ("Färg", "Röd"), ("Bärförmåga", "25 kg"), ("Vikt", "4,2 kg"),
                 ("Montering", "Krävs inte")],
    "22bedfb0": [("Mått", "45 × 24 × 27 cm"), ("Antal lådor", "3 plus ett övre fack"),
                 ("Lådmått", "38,5 × 20 × 4,5 cm"), ("Övre facket", "44 × 23 × 5 cm"),
                 ("Material", "Pulverlackerat stål"), ("Färg", "Röd stomme med svarta lådfronter"),
                 ("Lådskenor", "Kullager"), ("Låsning", "Två spännlås i stål"),
                 ("Bärförmåga", "20 kg"), ("Vikt", "6,5 kg"), ("Montering", "Krävs inte")],
    "370918a9": [("Mått", "49,7 × 25,3 × 28,9 cm"), ("Antal lådor", "2 plus ett övre fack"),
                 ("Lådmått", "39 × 21,5 × 5 cm"), ("Övre facket", "46 × 22 × 9 cm"),
                 ("Uttagbar insats", "47 × 20 × 4 cm"), ("Minilådor", "2 st, 14 × 11,5 × 3 cm"),
                 ("Material", "Stål och plast"), ("Färg", "Svart med orange lådor"),
                 ("Bärförmåga", "30 kg totalt, 10 kg per låda"), ("Vikt", "8 kg"),
                 ("Montering", "Krävs inte")],
    "aafbf543": [("Mått", "51 × 22 × 32 cm"), ("Antal lådor", "3 plus ett övre fack"),
                 ("Lådmått", "45 × 19,5 × 5,5 cm"), ("Övre facket", "50 × 22 × 6 cm"),
                 ("Material", "Kallvalsat stål"), ("Färg", "Svart med röda lådfronter"),
                 ("Lådskenor", "Kullager"), ("Låsning", "Två spännlås med ögla för hänglås"),
                 ("Hänglås", "Ingår inte"),
                 ("Bärförmåga", "16 kg totalt, 2 kg per låda, 10 kg i övre facket"),
                 ("Vikt", "10,5 kg"), ("Montering", "Krävs inte")],
    "5541fbb0": [("Mått", "51 × 22 × 32 cm"), ("Antal lådor", "3 plus ett övre fack"),
                 ("Lådmått", "45 × 19,5 × 5,5 cm"), ("Övre facket", "50 × 22 × 6 cm"),
                 ("Material", "Kallvalsat stål"), ("Färg", "Röd"),
                 ("Lådskenor", "Kullager"), ("Låsning", "Två spännlås med ögla för hänglås"),
                 ("Hänglås", "Ingår inte"),
                 ("Bärförmåga", "16 kg totalt, 2 kg per låda, 10 kg i övre facket"),
                 ("Vikt", "10,5 kg"), ("Montering", "Krävs inte")],
    "0283be34": [("Mått", "51 × 22 × 39,5 cm"), ("Antal lådor", "4 plus ett övre fack"),
                 ("Lådmått", "45 × 19,5 × 5,5 cm"), ("Övre facket", "50 × 22 × 6 cm"),
                 ("Material", "Kallvalsat stål"), ("Färg", "Svart med röda lådfronter"),
                 ("Lådskenor", "Kullager"), ("Låsning", "Två spännlås med ögla för hänglås"),
                 ("Hänglås", "Ingår inte"),
                 ("Bärförmåga", "18 kg totalt, 2 kg per låda, 10 kg i övre facket"),
                 ("Vikt", "12,8 kg"), ("Montering", "Krävs inte")],
    "8a6922ce": [("Mått", "51 × 22 × 39,5 cm"), ("Antal lådor", "4 plus ett övre fack"),
                 ("Lådmått", "45 × 19,5 × 5,5 cm"), ("Övre facket", "50 × 22 × 6 cm"),
                 ("Material", "Kallvalsat stål"), ("Färg", "Röd"),
                 ("Lådskenor", "Kullager"), ("Låsning", "Två spännlås med ögla för hänglås"),
                 ("Hänglås", "Ingår inte"),
                 ("Bärförmåga", "18 kg totalt, 2 kg per låda, 10 kg i övre facket"),
                 ("Vikt", "12,8 kg"), ("Montering", "Krävs inte")],
    "b9cca4a6": [("Mått", "49,7 × 25,3 × 40,7 cm"), ("Antal lådor", "4 plus ett övre fack"),
                 ("Lådmått", "39 × 21,5 × 5 cm"), ("Övre facket", "46 × 22 × 9 cm"),
                 ("Uttagbar insats", "47 × 20 × 4 cm"), ("Minilådor", "2 st, 14 × 11,5 × 3 cm"),
                 ("Material", "Stål och plast"), ("Färg", "Svart med gula lådor"),
                 ("Bärförmåga", "30 kg totalt, 10 kg per låda"), ("Vikt", "10,8 kg"),
                 ("Montering", "Krävs inte")],
    "94925af2": [("Mått", "60 × 26 × 34 cm"), ("Antal lådor", "6 plus ett övre fack"),
                 ("Små lådor", "3 st, 15 × 22 × 3 cm"),
                 ("Genomgående lådor", "2 st 50,5 × 22 × 3 cm och 1 st 50,5 × 22 × 7,5 cm"),
                 ("Övre facket", "59,5 × 25,5 × 6 cm"), ("Material", "Pulverlackerat stål"),
                 ("Färg", "Svart med röda lådfronter"), ("Lådskenor", "Kullager"),
                 ("Låsning", "Cylinderlås, två nycklar ingår"), ("Lock", "Två gasfjädrar"),
                 ("Bärförmåga", "50 kg totalt, 15 kg per bred låda, 5 kg per liten"),
                 ("Vikt", "14,9 kg"), ("Montering", "Krävs inte")],
    "aae03048": [("Mått", "60 × 26 × 34 cm"), ("Antal lådor", "6 plus ett övre fack"),
                 ("Små lådor", "3 st, 15 × 22 × 3 cm"),
                 ("Genomgående lådor", "2 st 50,5 × 22 × 3 cm och 1 st 50,5 × 22 × 7,5 cm"),
                 ("Övre facket", "59,5 × 25,5 × 6 cm"), ("Material", "Pulverlackerat stål"),
                 ("Färg", "Svart"), ("Lådskenor", "Kullager"),
                 ("Låsning", "Cylinderlås, två nycklar ingår"), ("Lock", "Två gasfjädrar"),
                 ("Bärförmåga", "50 kg totalt, 15 kg per bred låda, 5 kg per liten"),
                 ("Vikt", "14,9 kg"), ("Montering", "Krävs inte")],
    "f50b75d8": [("Mått", "49,7 × 25,3 × 40,7 cm"), ("Antal lådor", "4 plus ett övre fack"),
                 ("Lådmått", "39 × 21,5 × 5 cm"), ("Övre facket", "46 × 22 × 9 cm"),
                 ("Uttagbar insats", "47 × 20 × 4 cm"), ("Minilådor", "2 st, 14 × 11,5 × 3 cm"),
                 ("Material", "Stål och plast"), ("Färg", "Svart med orange lådor"),
                 ("Bärförmåga", "30 kg totalt, 10 kg per låda"), ("Vikt", "12 kg"),
                 ("Montering", "Krävs inte")],
}

SKOTSEL = {
    "7b544155": "Fäll alltid ihop lådan innan du lyfter den — konstruktionen är gjord för att bära i hopfällt läge, och de utfällda facken är inte till för att lyftas i. Torka av lacken med en fuktig trasa och torka efter; lämnas olja eller fukt kvar på en repa kommer rosten in under lacken där den inte syns. Ett par droppar tunn olja i lederna en gång om året håller utfällningen mjuk.",
    "22bedfb0": "Mattorna i botten går att lyfta ur och torka av när de blivit oljiga — det är hela poängen med dem, och en matta som får ligga mättad slutar suga upp något alls. Dra ut lådorna helt ett par gånger om året och borsta bort spån ur skenorna. Torka av stålet med en fuktig trasa och torka efter.",
    "370918a9": "Plasthöljet tål vatten och tvål, men lådorna är stål: torka av dem torra efter en blöt dag i garaget. Insatsen i övre facket lyfter du rakt upp när den ska tömmas, och minilådorna i locket går att ta med sig separat till arbetsstället. Dra ut lådorna helt och borsta rent skenorna när de börjar kärva.",
    "aafbf543": "Fäll ner båda spännlåsen innan du lyfter — de håller inte bara locket utan hela lådstapeln, och en olåst låda kan glida ut när kroppen lutar. Torka av den svarta lacken med en fuktig trasa; den är pulverlackerad och tål tvål, men repor som får stå med fukt i sig drar in rost under ytan. Borsta rent kullagerskenorna när de börjar knastra.",
    "5541fbb0": "Spännlåsen ska ner innan lådan lyfts. De låser lock och lådor i samma rörelse, och det är just det som gör att inget glider ut när du bär den i handtaget. Den röda lacken är pulverlackerad och tvättas med fuktig trasa och mild tvål — undvik lösningsmedel, som matt lacken. Skenorna borstas rena från spån ett par gånger om året.",
    "0283be34": "Med fyra lådor blir stapeln högre och tyngdpunkten känsligare: fäll ner spännlåsen och lyft rakt, inte i vinkel. Torka av lacken med fuktig trasa och torka efter — särskilt runt kanterna, där plåten är böjd och fukt gärna blir stående. Dra ut lådorna helt när du rengör skenorna, annars kommer du inte åt den bakre halvan.",
    "8a6922ce": "Fyra lådor gör kroppen högre än den ser ut, så lyft rakt uppåt med båda spännlåsen nedfällda. Den röda pulverlacken tvättas med mild tvål och fuktig trasa; låt den inte torka med oljefläckar kvar, eftersom olja äter sig in i ytan över tid. Borsta skenorna rena och dra ut varje låda helt minst en gång per säsong.",
    "b9cca4a6": "Höljet är plast och tål att spolas av, men lådorna innanför är stål och ska torkas torra. Ta ur insatsen i övre facket när du tömmer den — det är enklare än att vända hela lådan. Minilådorna sitter löst i locket och är lätta att glömma kvar på bänken, så räkna dem innan du stänger.",
    "94925af2": "Lås alltid lådan innan den flyttas: cylindern håller både locket och alla sex lådorna, och utan lås kan en tung låda glida ut när du lyfter i sidohandtagen. Lägg den ena nyckeln på en annan plats än lådan. Mattorna i lådorna lyfts ur och torkas av när de blivit oljiga, och gasfjädrarna ska hållas rena från damm så att locket fortsätter stå kvar öppet.",
    "aae03048": "Vrid om låset innan lådan lyfts — det stänger locket och samtliga sex lådor i ett grepp, och en olåst låda i sidohandtagen är en låda som öppnar sig. Förvara reservnyckeln någon annanstans. Torka av den svarta lacken med fuktig trasa; matt svart visar fingeravtryck och oljefläckar tydligare än ljusare färger. Håll gasfjädrarna dammfria.",
    "f50b75d8": "Plasthöljet klarar spolning, men de orange lådorna är stål och ska torkas torra efteråt. Insatsen i övre facket lyfts rakt upp vid tömning, och de två minilådorna i locket tar du med dig separat när du bara ska ha med skruv. Borsta rent skenorna när lådorna börjar gå trögt.",
}

FAQ = {
    "7b544155": [
        ("Ingår verktygen som syns på bilderna?", "Nej. Leveransen är lådan och en anvisning — verktygen på bilderna visar bara hur facken kan användas."),
        ("Hur mycket plats tar den uppfälld?", "69 centimeter i bredd och 53 centimeter i djup. Stängd är den 56 × 20 cm, så den kräver betydligt mer bänkyta öppen än stängd."),
        ("Tål den fukt i ett ouppvärmt garage?", "Stålet är pulverlackerat, och lacken håller fukten borta så länge den är hel. En djup repa som får stå våt kan börja rosta underifrån, så torka av lådan efter en blöt dag."),
        ("Behöver den monteras?", "Nej. Den kommer färdig och fälls ut med handtaget direkt ur kartongen."),
    ],
    "22bedfb0": [
        ("Ingår verktygen som syns på bilderna?", "Nej. Du får lådan och en anvisning. Verktygen och smådelarna på bilderna är bara till för att visa skalan."),
        ("Vilken färg har lådorna egentligen?", "Stommen är röd och lådfronterna svarta, med silverfärgade greppslister. Färgnamnet beskriver bara stommen — fronterna syns tydligt på bilderna."),
        ("Går lådorna att dra ut helt?", "Ja. Skenorna är kullagrade och går ut hela vägen, så du kommer åt även den bakre delen av varje låda."),
        ("Hur mycket tål den?", "20 kilo totalt. Den väger 6,5 kilo tom, så fullastad landar den kring 26 kilo."),
    ],
    "370918a9": [
        ("Ingår verktygen som syns på bilderna?", "Nej. Med lådan följer en anvisning, den uttagbara plastinsatsen och de två minilådorna — inget mer."),
        ("Hur många lådor har den?", "Två utdragslådor, plus det stora facket under locket. Den högre modellen i samma serie har fyra."),
        ("Vad är minilådorna till för?", "Skruv, plugg, muttrar och annat smått. De sitter i locket, går att ta ur och ta med sig, och mäter 14 × 11,5 × 3 cm styck."),
        ("Tål höljet att ställas ner hårt?", "Plasten är slagtålig och tar smällar bättre än tunn plåt. Lådorna innanför är stål och glider på kullagerskenor."),
    ],
    "aafbf543": [
        ("Ingår verktygen som syns på bilderna?", "Nej. Du får lådan och en anvisning. Verktygen och sorteringsasken på bilderna följer inte med."),
        ("Går den att låsa?", "Med hänglås, ja. De två spännlåsen har varsin ögla som tar en vanlig bygel. Det finns ingen cylinder och ingen nyckel i leveransen."),
        ("Hur mycket tål en enskild låda?", "2 kilo. Övre facket tål 10 kilo och hela lådan 16 kilo. Två kilo är mindre än en full hylsnyckelsats, så fördela tyngre saker i facket i stället."),
        ("Vad skiljer den från den helröda?", "Bara färgen. Måtten, lådorna, låsningen och bärförmågan är identiska — den här har svart kropp med röda fronter."),
    ],
    "5541fbb0": [
        ("Ingår verktygen som syns på bilderna?", "Nej. Leveransen är lådan och en anvisning; verktygen på bilderna visar bara hur lådorna kan fyllas."),
        ("Går den att låsa?", "Med hänglås. De två spännlåsen har varsin ögla för en bygel, men det följer varken cylinder eller nyckel med lådan."),
        ("Hur mycket tål en enskild låda?", "2 kilo per låda, 10 kilo i övre facket och 16 kilo totalt. Lägg det tyngsta i facket under locket, inte i lådorna."),
        ("Vad skiljer den från den svarta och röda?", "Enbart färgen. Den här är röd rakt igenom — kropp, lock och fronter — medan syskonet har svart kropp."),
    ],
    "0283be34": [
        ("Ingår verktygen som syns på bilderna?", "Nej. Du får lådan och en anvisning. Verktygen och den genomskinliga sorteringsasken på bilderna ingår inte."),
        ("Går den att låsa?", "Med hänglås. Varje spännlås har en ögla för en bygel. Cylinder och nyckel ingår inte."),
        ("Hur mycket tål en enskild låda?", "2 kilo. Övre facket tål 10 kilo och hela lådan 18 kilo. Fyra lådor med två kilo i varje är inte mycket, så det tunga hör hemma i facket."),
        ("Vad skiljer den från trelådorsmodellen?", "En låda till och 7,5 centimeter högre kropp. Bredd, djup, låsning och lådmått är desamma."),
    ],
    "8a6922ce": [
        ("Ingår verktygen som syns på bilderna?", "Nej. Med lådan följer en anvisning. Verktygen på bilderna är där för att visa skalan."),
        ("Går den att låsa?", "Med hänglås. De två spännlåsen har varsin ögla, men lådan levereras utan cylinder och utan nyckel."),
        ("Hur mycket tål en enskild låda?", "2 kilo per låda, 10 kilo i övre facket, 18 kilo totalt. Två kilo är snabbt fyllt — planera för att det tunga ligger i facket."),
        ("Vad skiljer den från den svarta och röda?", "Bara färgen. Den här är helröd; syskonet har svart kropp med röda fronter. Mått och funktion är identiska."),
    ],
    "b9cca4a6": [
        ("Ingår verktygen som syns på bilderna?", "Nej. Lådan levereras med anvisning, uttagbar plastinsats och två minilådor — verktygen på bilderna ingår inte."),
        ("Hur mycket tål den?", "30 kilo totalt och 10 kilo i varje enskild låda. Totalvikten är det tak som gäller när alla lådor är fyllda."),
        ("Vad är skillnaden mot den orange?", "Färgen på lådfronterna. Mått, lådantal, bärförmåga och tillbehör är desamma; den här väger 10,8 kilo mot den orangas 12."),
        ("Går lådorna att dra ut helt?", "Ja. Skenorna är kullagrade och drar ut hela lådan, så du når det som ligger längst in."),
    ],
    "94925af2": [
        ("Ingår verktygen som syns på bilderna?", "Nej. Leveransen är lådan och två nycklar. Verktygen, hylsorna och tejpen på bilderna följer inte med."),
        ("Hur många lådor har den?", "Sex. Tre små bredvid varandra överst och tre genomgående under, plus facket under locket."),
        ("Går den att låsa på riktigt?", "Ja. Ett cylinderlås i fronten stänger både locket och samtliga sex lådor, och två nycklar följer med."),
        ("Hur mycket tål den?", "50 kilo totalt. En bred låda tål 15 kilo och en liten 5 kilo, men totalvikten är taket när allt är fyllt."),
    ],
    "aae03048": [
        ("Ingår verktygen som syns på bilderna?", "Nej. Du får lådan och två nycklar. Verktygen på bilderna är där för att visa hur lådorna kan användas."),
        ("Hur många lådor har den?", "Sex: tre små överst sida vid sida och tre genomgående under, utöver facket under locket."),
        ("Går den att låsa på riktigt?", "Ja, med cylinderlås som stänger lock och alla sex lådorna samtidigt. Två nycklar ingår."),
        ("Vad skiljer den från den röda?", "Bara färgen. Den här är helsvart, syskonet har röda lådfronter. Mått, lås, lådor och bärförmåga är identiska."),
    ],
    "f50b75d8": [
        ("Ingår verktygen som syns på bilderna?", "Nej. Med lådan följer anvisning, uttagbar plastinsats och två minilådor. Verktygen på bilderna ingår inte."),
        ("Hur mycket tål den?", "30 kilo totalt och 10 kilo per låda. När alla fyra är fyllda är totalvikten det tak som gäller."),
        ("Vad är skillnaden mot den gula?", "Färgen på lådfronterna. Mått, lådantal och bärförmåga är desamma; den här väger 12 kilo mot den gulas 10,8."),
        ("Finns den i en lägre modell?", "Ja. Den lägre modellen i serien är 28,9 centimeter hög i stället för 40,7 och har hälften så många lådor."),
    ],
}

KORSLANK = {
    "7b544155": [("22bedfb0", "Låda i samma storleksklass med tre utdragslådor i stället för fack"),
                 ("370918a9", "Låda med utdragslådor, uttagbar insats och två minilådor")],
    "22bedfb0": [("aafbf543", "Bredare låda i stål med tre lådor och hänglåsöglor"),
                 ("7b544155", "Uppfällbar låda med fem fack i stället för lådor")],
    "370918a9": [("f50b75d8", "Samma serie med fyra lådor och 40,7 centimeters höjd"),
                 ("b9cca4a6", "Samma fyra lådor med gula fronter")],
    "aafbf543": [("5541fbb0", "Samma låda helröd i stället för svart och röd"),
                 ("0283be34", "Samma bredd med fyra lådor i stället för tre")],
    "5541fbb0": [("aafbf543", "Samma låda med svart kropp och röda fronter"),
                 ("8a6922ce", "Samma helröda utförande med fyra lådor")],
    "0283be34": [("8a6922ce", "Samma låda helröd i stället för svart och röd"),
                 ("aafbf543", "Samma bredd med tre lådor och lägre kropp")],
    "8a6922ce": [("0283be34", "Samma låda med svart kropp och röda fronter"),
                 ("5541fbb0", "Samma helröda utförande med tre lådor")],
    "b9cca4a6": [("f50b75d8", "Samma låda med orange fronter"),
                 ("370918a9", "Samma serie med två lådor och lägre kropp")],
    "94925af2": [("aae03048", "Samma låda helsvart i stället för röd och svart"),
                 ("0283be34", "Smalare låda med fyra lådor och hänglåsöglor")],
    "aae03048": [("94925af2", "Samma låda med röda lådfronter"),
                 ("8a6922ce", "Smalare helröd låda med fyra lådor")],
    "f50b75d8": [("b9cca4a6", "Samma låda med gula fronter"),
                 ("370918a9", "Samma serie med två lådor och lägre kropp")],
}


def _slug(m):
    return SLUG[m]


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
