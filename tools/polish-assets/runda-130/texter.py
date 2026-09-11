# -*- coding: utf-8 -*-
"""Runda 130 — sex solcellslampor i konstrotting.

☠️ IP44 ÄR STÄNKSKYDD, ALDRIG "VATTENTÄT". `5ffb91a2`:s tyska text säger
   ordagrant *"Wasserdicht gemäß IP44, widersteht Regen, Schnee, Frost und
   Hagel"*. Enligt IEC 60529 betyder den andra fyran skydd mot vattenstänk
   från alla håll — inte nedsänkning, inte strålar. Samma fynd som runda 129.

☠️ 15 LUMEN ÄR STÄMNINGSLJUS OCH SÄLJS SOM DET. Leverantörens ingresser
   säger "Erhellen Sie Ihren Garten" och "sorgt für helle Außenbeleuchtung".
   Femton lumen lyser inte upp någon trädgård. Varje sida skriver ut talet
   och vad det räcker till — ingen sida lovar gångbelysning.

☠️ MATERIALET ÄR PE-ROTTING, ALLTSÅ KONSTROTTING — inte rotting. Fem av sex
   tyska spec-block säger `PE-Rattan`; `ef0c374b`:s SVENSKA spec-rad säger
   bara `Rattan`, vilket hade blivit ett påstående om naturmaterial. Huset
   skiljer redan på orden i katalogen (`Loungeset i rotting` mot
   `Trädgårdsstolar i konstrotting`), så skillnaden är inte akademisk.

☠️ `ef0c374b`:S SPEC-RAD SÄGER 45 METER OCH BESKRIVER BARA EN AV TVÅ LAMPOR.
   `Mått: 45m x 45m x 45m`. Måttritningen (bild 3) visar Ø45 × 45 cm och
   Ø35 × 35 cm — två lampor, i centimeter. Rättat i både text och spec.

☠️ `ef0c374b` SÄLJS SOM "dekorativa sidobord" i den tyska texten
   (*"Stilvolle dekorative Beistelltische am Tag"*). Ingen maxlast anges
   någonstans, och toppen ÄR solcellen: ställer man något på den laddar
   lampan inte. Sidan säger det rakt ut i stället för att upprepa påhittet.

⚠️ `a8cf27cd` SAKNAR IP-KLASS, LUMENVÄRDE OCH CE-UPPGIFT i källan. Den är
   den enda i rundan utan angiven kapslingsklass — alltså får sidan inte
   påstå något om väderskydd, och lumenvärdet från syskonen får inte lånas
   in. Effekten (0,8 W) står däremot i källan och skrivs ut.

⚠️ FÄRGEN: den svenska spec-raden tappar halva värdet på fem av sex.
   Tyskan säger `Schwarz+Gelb` / `Schwarz+Grau` / `Sand+Schwarz` medan
   spec-raden bara bär andra ledet. "Gelb" är dessutom leverantörens ord
   för den ljusa naturtonen i flätningen — bilderna visar inget gult.
   Sidorna beskriver det bilden visar.

⚠️ MONTERING SKILJER, och `Lieferumfang` är kontraktet: `65e3c24f` och
   `4e23a904` kräver montering, `66a26135` och `ef0c374b` uttryckligen inte,
   `a8cf27cd` säger "einfach zu montieren" och `5ffb91a2` säger ingenting
   alls — då står det ingenting om montering på den sidan.
"""

NAMN = {
    "65e3c24f": "Solcellslampa 144 cm i konstrotting – tre skärmar och avlastningshylla",
    "4e23a904": "Solcellslampa i bågform 178 cm – hängande skärm i konstrotting",
    "66a26135": "Solcellslampa 77 cm – pelare i konstrotting med 25 lysdioder",
    "5ffb91a2": "Solcellslampa 130 cm – skärm i konstrotting som kastar skuggmönster",
    "ef0c374b": "Solcellslyktor 2-pack i konstrotting – 45 och 35 cm, ljus nedåt",
    "a8cf27cd": "Solcellslykta 61 cm i brun konstrotting – 0,8 W och strömbrytare",
}

SLUG = {
    "65e3c24f": "solcellslampa-144-cm-tre-skarmar-konstrotting",
    "4e23a904": "solcellslampa-bage-178-cm-konstrotting",
    "66a26135": "solcellslampa-pelare-77-cm-konstrotting",
    "5ffb91a2": "solcellslampa-130-cm-konstrotting",
    "ef0c374b": "solcellslyktor-2-pack-45-och-35-cm-konstrotting",
    "a8cf27cd": "solcellslykta-61-cm-brun-konstrotting",
}

# ☠️ RÄKNADE ur husregeln (lib/import/sku.ts), aldrig skrivna för hand.
#    TRE av utkasten bar redan `FP-solar-stehlampe-rattan` — importen kapar
#    produktdelen vid 24 tecken på hel ordgräns. Första sluggförslaget lade
#    talet EFTER "konstrotting" och gav TVÅ sidor `FP-solcellslampa-rotting`;
#    talet flyttades före, och då blir alla sex unika. Verifierat mot hela
#    katalogen (6 588 varianter, 5 421 unika SKU) — noll av de sex är tagna.
SKU = {
    "65e3c24f": "FP-solcellslampa-144-cm-tre",
    "4e23a904": "FP-solcellslampa-bage-178",
    "66a26135": "FP-solcellslampa-pelare-77",
    "5ffb91a2": "FP-solcellslampa-130-cm",
    "ef0c374b": "FP-solcellslyktor-2-pack-45",
    "a8cf27cd": "FP-solcellslykta-61-cm-brun",
}

TITEL = {
    "65e3c24f": "Solcellslampa 144 cm, tre skärmar och hylla | Fyndplats",
    "4e23a904": "Solcellslampa i bågform 178 cm | Fyndplats",
    "66a26135": "Solcellslampa 77 cm, pelare med 25 lysdioder | Fyndplats",
    "5ffb91a2": "Solcellslampa 130 cm i konstrotting | Fyndplats",
    "ef0c374b": "Solcellslyktor 2-pack, 45 och 35 cm | Fyndplats",
    "a8cf27cd": "Solcellslykta 61 cm i brun konstrotting | Fyndplats",
}

META = {
    "65e3c24f": "Solcellsdriven trädgårdslampa 144 cm med tre skärmar i "
                "konstrotting och en rund hylla mitt på stativet. 15 lumen, IP44.",
    "4e23a904": "Solcellsdriven trädgårdslampa i bågform, 178 cm hög med "
                "hängande skärm i konstrotting. Fyra jordankare ingår. IP44.",
    "66a26135": "Solcellsdriven pelarlampa 77 cm i konstrotting med 25 "
                "lysdioder. Ställs på marken, ingen montering. 15 lumen, IP44.",
    "5ffb91a2": "Solcellsdriven trädgårdslampa 130 cm med skärm i konstrotting "
                "som kastar skuggmönster. Lysdiodens livslängd 20 000 timmar.",
    "ef0c374b": "Två solcellsdrivna lyktor i konstrotting, Ø45 och Ø35 cm. "
                "25 lysdioder riktade nedåt, 3500 K. Ingen montering. IP44.",
    "a8cf27cd": "Solcellsdriven trädgårdslykta 61 cm i brun konstrotting kring "
                "en stålram. 0,8 watt, egen strömbrytare, sex timmars laddning.",
}

SOKORD = {
    "65e3c24f": ["solcellslampa", "solcellslampa konstrotting",
                 "trädgårdsbelysning solcell", "solcellslampa med hylla"],
    "4e23a904": ["solcellslampa", "bågformad solcellslampa",
                 "solcellslampa konstrotting", "utomhusbelysning solcell"],
    "66a26135": ["solcellslampa", "pelarlampa solcell",
                 "solcellslampa konstrotting", "trädgårdsbelysning solcell"],
    "5ffb91a2": ["solcellslampa", "solcellslampa konstrotting",
                 "solcellslampa 130 cm", "trädgårdsbelysning solcell"],
    "ef0c374b": ["solcellslykta", "solcellslyktor 2-pack",
                 "solcellslykta konstrotting", "utomhusbelysning solcell"],
    "a8cf27cd": ["solcellslykta", "solcellslykta brun",
                 "solcellslykta konstrotting", "trädgårdsbelysning solcell"],
}

INTRO = {
    "65e3c24f":
        "Tre flätade skärmar sitter på var sin höjd kring ett svart stativ, "
        "och mellan dem finns en rund hylla att ställa en kruka eller en "
        "lykta på. Lampan tänds av sig själv när det mörknar och slocknar i "
        "gryningen. Stativet är 144 centimeter högt och står på en rund "
        "stålplatta som mäter 28 centimeter tvärs över.",
    "4e23a904":
        "En båge som reser sig 178 centimeter och böjer sig ut över marken, "
        "med en flätad skärm hängande i änden. Foten är en kvadratisk "
        "stålplatta på 28 × 28 centimeter, och fyra jordankare följer med för "
        "att hålla den på plats när det blåser. Skärmen sitter ungefär 32 "
        "centimeter in från fotens kant, så ljuset faller vid sidan om "
        "stativet i stället för rakt ovanför det.",
    "66a26135":
        "En pelare på 77 centimeter som ställs direkt på marken — ingen "
        "montering, inget jordspett, ingenting att skruva. Flätningen löper i "
        "en vriden spiral runt en vit innerskärm, så ljuset silar ut genom "
        "springorna i stället för att lysa rakt ut. Inuti sitter 25 lysdioder "
        "med varmt ljus på 2500 kelvin.",
    "5ffb91a2":
        "En skärm av stående spjälor på ett smalt svart stativ, 130 "
        "centimeter högt. Spjälorna står tätt och gör att ljuset kastar "
        "randiga skuggor på marken och på väggen bakom. Foten är rund och "
        "mäter 28 centimeter tvärs över, och solcellen ligger som ett lock "
        "över skärmen.",
    "ef0c374b":
        "Två lyktor i samma flätning men olika storlek: den större mäter 45 "
        "centimeter tvärs över och är 45 centimeter hög, den mindre 35 "
        "centimeter i båda riktningarna. Båda har ett svart lock som också är "
        "solcellen, och lysdioderna sitter under locket och riktar ljuset "
        "nedåt genom flätningen. Ingen montering behövs — de ställs där du "
        "vill ha dem.",
    "a8cf27cd":
        "En avsmalnande lykta på 61 centimeter, byggd av brun plastlina som "
        "lindats tätt runt en pulverlackad stålram. Den är 21,5 centimeter "
        "tvärs över vid foten och 15 centimeter i toppen, där solcellen "
        "ligger. Lysdioden drar 0,8 watt och lyser i åtta timmar på full "
        "laddning.",
}

RUBRIK = {
    "65e3c24f": "Hyllan sitter fast mitt på stativet",
    "4e23a904": "Bågen når 32 centimeter ut från foten",
    "66a26135": "77 centimeter som inte ska skruvas ihop",
    "5ffb91a2": "Spjälorna är det som gör skuggmönstret",
    "ef0c374b": "Två lyktor, 45 och 35 centimeter",
    "a8cf27cd": "0,8 watt i en enda lysdiod",
}

PUNKTER = {
    "65e3c24f": [
        "Tre skärmar i konstrotting, fördelade på tre höjder längs stativet.",
        "Rund avlastningshylla mellan skärmarna — den är fastsatt och går inte att flytta.",
        "Rund stålbas, 28 centimeter tvärs över och 2,5 centimeter hög.",
        "Solcellen ligger i toppen och mäter 8 centimeter tvärs över.",
        "Svart stativ med skärmar i ljus naturton.",
        "Kräver montering. I kartongen ligger lampan och en anvisning.",
    ],
    "4e23a904": [
        "Bågformat stativ, 178 centimeter högt och 44 centimeter djupt.",
        "En skärm i konstrotting hänger i bågens ände.",
        "Kvadratisk stålfot, 28 × 28 centimeter, med fyra jordankare i kartongen.",
        "Pulverlackad ram och UV-tålig konstrotting.",
        "Svart stativ med skärm i ljus naturton.",
        "Kräver montering. I kartongen ligger lampan, fyra jordankare och en anvisning.",
    ],
    "66a26135": [
        "Pelare på 22 × 22 × 77 centimeter som ställs direkt på marken.",
        "25 lysdioder med varmt ljus, 2500 kelvin.",
        "Vriden spiralflätning kring en vit innerskärm.",
        "Solcellen ligger i toppen och mäter 12 × 12 centimeter.",
        "Solcellsmodulen anges till 4,5 volt och 150 milliampere.",
        "Svart och grått. Ingen montering behövs.",
    ],
    "5ffb91a2": [
        "Stativ på 130 centimeter med rund fot, 28 centimeter tvärs över.",
        "Skärm av stående spjälor, 34 centimeter tvärs över.",
        "Solcellen ligger som ett lock över skärmen, 12 centimeter tvärs över.",
        "Lysdiodens livslängd anges till 20 000 timmar.",
        "Svart stativ med skärm i ljus naturton.",
    ],
    "ef0c374b": [
        "Två lyktor: Ø45 × 45 centimeter och Ø35 × 35 centimeter.",
        "25 lysdioder med varmt ljus, 3500 kelvin, riktade nedåt.",
        "Svarta lock som också bär solcellen, 12 centimeter tvärs över.",
        "Flätning i sandton kring en pulverlackad stålstomme.",
        "Ingen montering behövs.",
    ],
    "a8cf27cd": [
        "Avsmalnande lykta, 21,5 centimeter tvärs över vid foten och 15 i toppen.",
        "61 centimeter hög, brun plastlina lindad kring en pulverlackad stålram.",
        "Lysdioden drar 0,8 watt och lyser med varmt, gulaktigt ljus.",
        "Solcellen mäter 8,5 × 8,5 centimeter och ligger i toppen.",
        "Egen strömbrytare märkt ON och OFF på solcellens undersida.",
        "Bred fot som håller lyktan stabil.",
    ],
}

SOL_RUBRIK = {
    "65e3c24f": "15 lumen fördelat på tre skärmar",
    "4e23a904": "15 lumen från 178 centimeters höjd",
    "66a26135": "25 lysdioder som tillsammans ger 15 lumen",
    "5ffb91a2": "15 lumen genom stående spjälor",
    "ef0c374b": "15 lumen riktat nedåt ur två lyktor",
    "a8cf27cd": "Åtta timmars lystid på sex timmars laddning",
}

SOL = {
    "65e3c24f":
        "Fem timmar i sol ger åtta timmars lystid. Ljuset är dekorativt: "
        "femton lumen visar tydligt var lampan står och lyfter fram "
        "flätningen, men det lyser inte upp gången omkring sig. Varje skärm "
        "drar 0,06 watt. I november och december räcker det svenska "
        "dagsljuset sällan till en full laddning, så räkna med kortare "
        "kvällar den delen av året.",
    "4e23a904":
        "Fem timmar i sol ger åtta timmars lystid. Femton lumen är "
        "stämningsljus — skärmen syns tydligt i mörkret, men lyser inte upp "
        "marken under sig. Lysdioden drar 0,06 watt. I november och december "
        "räcker det svenska dagsljuset sällan till en full laddning, så "
        "räkna med kortare kvällar den delen av året.",
    "66a26135":
        "Fem timmar i sol ger åtta timmars lystid. De 25 lysdioderna ger "
        "tillsammans femton lumen och drar 0,06 watt styck — det är ett "
        "stämningsljus som markerar var pelaren står, inte belysning att "
        "hitta nyckelhålet med. I november och december räcker det svenska "
        "dagsljuset sällan till en full laddning, så räkna med kortare "
        "kvällar den delen av året.",
    "5ffb91a2":
        "Fem timmar i sol ger åtta timmars lystid. Femton lumen är "
        "stämningsljus: det som syns är skärmen och skuggmönstret den "
        "kastar, inte marken runt omkring. Lysdioden drar 0,06 watt. I "
        "november och december räcker det svenska dagsljuset sällan till en "
        "full laddning, så räkna med kortare kvällar den delen av året.",
    "ef0c374b":
        "Fem timmar i sol ger åtta timmars lystid. Lyktorna ger femton lumen "
        "och drar tillsammans 1,5 watt, och eftersom lysdioderna sitter "
        "under locket faller ljuset nedåt genom flätningen. Det är "
        "stämningsljus, inte belysning att läsa vid. I november och december "
        "räcker det svenska dagsljuset sällan till en full laddning, så "
        "räkna med kortare kvällar den delen av året.",
    "a8cf27cd":
        "Sex timmar i sol ger åtta timmars lystid. Lysdioden drar 0,8 watt. "
        "Något lumenvärde är inte angivet för den här modellen, så vi "
        "skriver inget — watt säger hur mycket ström lyktan drar, inte "
        "hur mycket ljus den ger. I "
        "november och december räcker det svenska dagsljuset sällan till en "
        "full laddning, så räkna med kortare kvällar den delen av året.",
}

VADER_RUBRIK = {
    "65e3c24f": "IP44 — stänkskydd, inte vattentäthet",
    "4e23a904": "IP44 — stänkskydd, inte vattentäthet",
    "66a26135": "IP44 — stänkskydd, inte vattentäthet",
    "5ffb91a2": "IP44 — stänkskydd, inte vattentäthet",
    "ef0c374b": "IP44 — stänkskydd, inte vattentäthet",
    "a8cf27cd": "Vad som står om väderskydd — och vad som inte gör det",
}

VADER = {
    "65e3c24f":
        "Lampan är klassad IP44. Den fyran betyder skydd mot vattenstänk från "
        "alla håll, alltså regn och snöglopp. Den betyder inte vattentät: "
        "lampan får inte stå i en pöl, inte spolas med slang och inte tvättas "
        "med högtryck.",
    "4e23a904":
        "Lampan är klassad IP44 — skydd mot vattenstänk från alla håll, "
        "alltså regn och snöglopp. Det är inte samma sak som vattentät. "
        "Lampan får inte stå i en pöl, spolas med slang eller tvättas med "
        "högtryck.",
    "66a26135":
        "Pelaren är klassad IP44 — skydd mot vattenstänk från alla håll, "
        "alltså regn och snöglopp. Det är inte vattentäthet. Ställ den inte "
        "där vatten blir stående, och spola den aldrig med slang.",
    "5ffb91a2":
        "Lampan är klassad IP44. Den andra fyran betyder skydd mot "
        "vattenstänk från alla håll — regn och snöglopp. Den betyder inte "
        "vattentät, hur ofta ordet än används om solcellslampor: lampan får "
        "inte stå i vatten, inte spolas med slang och inte högtryckstvättas.",
    "ef0c374b":
        "Lyktorna är klassade IP44 — skydd mot vattenstänk från alla håll, "
        "alltså regn och snöglopp. Det är inte vattentäthet. Ställ dem inte "
        "där vatten blir stående på marken, och spola dem aldrig med slang.",
    "a8cf27cd":
        "Här finns inget att tolka: någon kapslingsklass är inte angiven för "
        "den här lyktan. Vi skriver därför inget om hur mycket regn den tål. "
        "Ställ den under tak eller ta in den när vädret slår om, så håller "
        "du dig på säkra sidan. Elektroniken är densamma som i vilken "
        "solcellslampa som helst: det är fukt inifrån som tar den, inte ett "
        "regnskur.",
}

KORSLANK = {
    "65e3c24f": [("5ffb91a2", "samma flätning i en enda skärm, 130 centimeter"),
                 ("4ef7c2b4", "tre lyktor på mast, 185 centimeter och 90 lumen")],
    "4e23a904": [("65e3c24f", "tre skärmar på ett rakt stativ med hylla"),
                 ("a6727ca5", "trädgårdslykta 177 centimeter med jordspett")],
    "66a26135": [("ef0c374b", "två fristående lyktor, 45 och 35 centimeter"),
                 ("5ffb91a2", "samma serie på ett stativ, 130 centimeter")],
    "5ffb91a2": [("65e3c24f", "tre skärmar och en hylla, 144 centimeter"),
                 ("66a26135", "en pelare på 77 centimeter utan montering")],
    "ef0c374b": [("a8cf27cd", "en enda lykta, 61 centimeter och 0,8 watt"),
                 ("9938574b", "två lyktor på jordspett, 129 centimeter")],
    "a8cf27cd": [("ef0c374b", "två flätade lyktor, 45 och 35 centimeter"),
                 ("6747b6c0", "trädgårdslykta 160 centimeter i rostfritt stål")],
}

SPEC = {
    "65e3c24f": [
        ("Mått", "Ø37 × 144 cm (bredd × höjd)"),
        ("Skärmar", "Tre, i konstrotting"),
        ("Hylla", "Rund, fastsatt mellan skärmarna"),
        ("Fot", "Ø28 × 2,5 cm, rund stålplatta"),
        ("Ljusstyrka", "15 lm"),
        ("Färgtemperatur", "2500 K"),
        ("Effekt", "0,06 W per skärm"),
        ("Solcell", "Ø8 × 2,8 cm"),
        ("Laddtid", "5 timmar i sol"),
        ("Lystid", "8 timmar på full laddning"),
        ("Batteri", "AA, Ni-MH, 600 mAh, 1,2 V"),
        ("Kapslingsklass", "IP44 – stänkskyddad"),
        ("Material", "Stål och konstrotting (PE)"),
        ("Färg", "Svart stativ, skärmar i ljus naturton"),
        ("Vikt med emballage", "7 kg"),
        ("Paketmått", "38 × 38 × 26 cm"),
        ("Ingår", "Lampa och anvisning"),
        ("Montering", "Krävs"),
    ],
    "4e23a904": [
        ("Mått", "44 × 32 × 178 cm (djup × bredd × höjd)"),
        ("Fot", "28 × 28 cm, kvadratisk stålplatta"),
        ("Ljusstyrka", "15 lm"),
        ("Färgtemperatur", "2500 K"),
        ("Effekt", "0,06 W"),
        ("Solcell", "Ø8 × 2,8 cm"),
        ("Laddtid", "5 timmar i sol"),
        ("Lystid", "8 timmar på full laddning"),
        ("Batteri", "AA, Ni-MH, 600 mAh, 1,2 V"),
        ("Kapslingsklass", "IP44 – stänkskyddad"),
        ("Material", "Pulverlackat stål och konstrotting (PE)"),
        ("Färg", "Svart stativ, skärm i ljus naturton"),
        ("Vikt med emballage", "4,3 kg"),
        ("Paketmått", "42 × 38 × 22 cm"),
        ("Ingår", "Lampa, fyra jordankare och anvisning"),
        ("Montering", "Krävs"),
    ],
    "66a26135": [
        ("Mått", "22 × 22 × 77 cm (bredd × djup × höjd)"),
        ("Fot", "22 × 22 cm"),
        ("Lysdioder", "25 stycken"),
        ("Ljusstyrka", "15 lm"),
        ("Färgtemperatur", "2500 K, varmvitt"),
        ("Effekt", "0,06 W per lysdiod"),
        ("Solcell", "12 × 12 cm, 4,5 V och 150 mA"),
        ("Laddtid", "5 timmar i sol"),
        ("Lystid", "8 timmar på full laddning"),
        ("Batteri", "AA, Ni-MH, 1200 mAh, 1,2 V"),
        ("Kapslingsklass", "IP44 – stänkskyddad"),
        ("Material", "Stål och konstrotting (PE)"),
        ("Färg", "Svart och grått"),
        ("Vikt med emballage", "3,3 kg"),
        ("Paketmått", "22 × 22 × 82 cm"),
        ("Ingår", "Lampa och anvisning"),
        ("Montering", "Behövs inte"),
    ],
    "5ffb91a2": [
        ("Mått", "Ø34 × 130 cm (bredd × höjd)"),
        ("Fot", "Ø28 cm"),
        ("Ljusstyrka", "15 lm"),
        ("Effekt", "0,06 W"),
        ("Solcell", "Ø12 cm"),
        ("Laddtid", "5 timmar i sol"),
        ("Lystid", "8 timmar på full laddning"),
        ("Livslängd", "20 000 timmar för lysdioden"),
        ("Kapslingsklass", "IP44 – stänkskyddad"),
        ("Material", "Stål och konstrotting (PE)"),
        ("Färg", "Svart stativ, skärm i ljus naturton"),
        ("Vikt med emballage", "5 kg"),
        ("Paketmått", "37,5 × 37,5 × 33 cm"),
        ("Ingår", "Lampa och handbok"),
    ],
    "ef0c374b": [
        ("Mått, större lyktan", "Ø45 × 45 cm"),
        ("Mått, mindre lyktan", "Ø35 × 35 cm"),
        ("Antal", "Två lyktor"),
        ("Lysdioder", "25 stycken, riktade nedåt"),
        ("Ljusstyrka", "15 lm"),
        ("Färgtemperatur", "3500 K"),
        ("Effekt", "1,5 W totalt"),
        ("Solcell", "Ø12 cm"),
        ("Laddtid", "5 timmar i sol"),
        ("Lystid", "8 timmar på full laddning"),
        ("Batteri", "AA, Ni-MH, 1200 mAh, 1,2 V"),
        ("Kapslingsklass", "IP44 – stänkskyddad"),
        ("Material", "Konstrotting (PE) och stål"),
        ("Färg", "Sandfärgad flätning, svarta lock"),
        ("Vikt med emballage", "8 kg"),
        ("Paketmått", "47 × 47 × 51 cm"),
        ("Ingår", "Två lyktor och anvisning"),
        ("Montering", "Behövs inte"),
    ],
    "a8cf27cd": [
        ("Mått", "Ø21,5 × 61 cm (bredd × höjd)"),
        ("Toppens diameter", "15 cm"),
        ("Effekt", "0,8 W"),
        ("Ljusfärg", "Varmt, gulaktigt"),
        ("Solcell", "8,5 × 8,5 cm"),
        ("Laddtid", "6 timmar i sol"),
        ("Lystid", "8 timmar på full laddning"),
        ("Strömbrytare", "ON och OFF på solcellens undersida"),
        ("Material", "Stål, PE och plast"),
        ("Färg", "Brun"),
        ("Vikt med emballage", "1,5 kg"),
        ("Paketmått", "22,7 × 22,5 × 64,3 cm"),
        ("Ingår", "Lykta och anvisning"),
        ("Montering", "Enkel"),
    ],
}

SKOTSEL = {
    "65e3c24f":
        "Torka av solcellen i toppen med en fuktad trasa några gånger per "
        "säsong. Ytan är liten, och damm, pollen eller ett löv över den är "
        "det vanligaste skälet till att en solcellslampa plötsligt lyser "
        "kortare. Spola aldrig lampan med slang — IP44 är skydd mot stänk, "
        "inte mot strålar. Flätningen borstas ren med en torr borste; blöt "
        "inte ned den i onödan. Dra åt skruvarna i stativet om det börjar "
        "kännas glappt efter en blåsig period, och ta in lampan inomhus de "
        "kallaste månaderna — kyla drar ner kapaciteten i ett Ni-MH-batteri, "
        "och i november och december laddar den ändå knappt.",
    "4e23a904":
        "Torka av solcellen i toppen några gånger per säsong; ett löv över "
        "den kortar kvällens ljus mer än man tror. Kontrollera att de fyra "
        "jordankarna sitter kvar efter höststormarna — bågen är hög och "
        "fångar vind, och foten ensam räcker inte alltid på mjuk mark. Spola "
        "aldrig lampan med slang. Flätningen borstas ren torr. Ta in lampan "
        "inomhus de kallaste månaderna: kyla drar ner kapaciteten i ett "
        "Ni-MH-batteri, och i november och december laddar den ändå knappt.",
    "66a26135":
        "Torka av solcellen i toppen några gånger per säsong. Den vita "
        "innerskärmen samlar damm mellan spiralerna — blås eller borsta ur "
        "den i stället för att spola, IP44 är skydd mot stänk och inte mot "
        "strålar. Pelaren står fritt på marken, så flytta in den om du väntar "
        "hård vind; den väger 3,3 kilo och är ingenting som står emot en "
        "storm. Ta in den inomhus de kallaste månaderna, så behåller "
        "batteriet sin kapacitet.",
    "5ffb91a2":
        "Torka av solcellen som ligger som lock över skärmen några gånger "
        "per säsong — den är vågrät, så löv och pollen blir liggande just "
        "där. Borsta spjälorna torra i stället för att spola dem; IP44 är "
        "skydd mot stänk, inte mot strålar. Kontrollera att foten står stadigt "
        "på plant underlag, stativet är smalt och 130 centimeter högt. Ta in "
        "lampan inomhus de kallaste månaderna.",
    "ef0c374b":
        "Locket ÄR solcellen, så det är där städningen ska ske: torka av det "
        "med en fuktad trasa några gånger per säsong och lägg ingenting "
        "ovanpå. Flätningen borstas torr. Spola aldrig lyktorna med slang. "
        "Lyktorna står fritt och väger tillsammans åtta kilo med emballage, "
        "men var för sig är de lätta nog att välta i hård vind — ta in dem "
        "när det blåser upp. Ta in dem också de kallaste månaderna, så "
        "behåller batterierna sin kapacitet.",
    "a8cf27cd":
        "Torka av solcellen i toppen några gånger per säsong. Strömbrytaren "
        "sitter på solcellens undersida och måste stå på ON för att "
        "automatiken ska fungera — står den på OFF laddar lyktan fortfarande, "
        "men tänds inte. Lindningen borstas ren torr; spola inte lyktan. "
        "Eftersom ingen kapslingsklass är angiven är den enklaste regeln att "
        "ställa lyktan under tak och ta in den när vädret slår om. Ta in den "
        "inomhus de kallaste månaderna.",
}

FAQ = {
    "65e3c24f": [
        ("Hur mycket lyser 15 lumen?",
         "Tillräckligt för att lampan ska synas och flätningen ska lysa upp, "
         "inte tillräckligt för att belysa en gång. Räkna med den som "
         "dekoration, inte som belysning."),
        ("Går det att ställa något på hyllan?",
         "Hyllan är gjord för att ställa en kruka eller en lykta på. Någon "
         "maxlast anges inte, så håll det lätt — och ställ ingenting på "
         "lampans topp, där sitter solcellen."),
        ("Tål den regn?",
         "Ja, den är klassad IP44 och tål stänk från alla håll. Den är "
         "däremot inte vattentät och får varken stå i vatten eller spolas."),
        ("Måste jag skruva ihop den?",
         "Ja. Lampan kommer i delar och en anvisning ligger i kartongen."),
        ("Kan jag byta batteriet?",
         "Batteriet är av vanlig AA-typ, Ni-MH på 600 mAh och 1,2 volt. Hur "
         "luckan öppnas står i anvisningen som följer med."),
    ],
    "4e23a904": [
        ("Behöver jag jordankarna?",
         "På gräs och mjuk mark: ja. Bågen är 178 centimeter hög och fångar "
         "vind, och den kvadratiska foten ensam räcker inte alltid. På "
         "stenläggning eller trädäck står den på foten."),
        ("Hur långt ut hänger skärmen?",
         "Skärmen sitter 32 centimeter in räknat från fotens kant, och hela "
         "lampan tar 44 centimeter i djup."),
        ("Tål den regn?",
         "Ja, den är klassad IP44 och tål stänk från alla håll. Vattentät är "
         "den inte — den får varken stå i vatten eller spolas."),
        ("Vad ingår i kartongen?",
         "Lampan, fyra jordankare och en anvisning. Montering krävs."),
        ("Hur starkt lyser den?",
         "15 lumen, alltså stämningsljus. Skärmen syns tydligt i mörkret men "
         "lyser inte upp marken under sig."),
    ],
    "66a26135": [
        ("Behöver den monteras?",
         "Nej. Den ställs direkt på marken som den är."),
        ("Står den stadigt?",
         "Foten är 22 × 22 centimeter och hela pelaren väger drygt tre kilo, "
         "så den står stilla i vanlig vind. I hård vind ska den flyttas in "
         "eller ställas i lä."),
        ("Vad ger 25 lysdioder för ljus?",
         "Tillsammans 15 lumen, med varm ton på 2500 kelvin. Det är "
         "stämningsljus — många dioder betyder här att ljuset fördelas jämnt "
         "genom flätningen, inte att det blir starkt."),
        ("Tål den regn?",
         "Ja, den är klassad IP44 och tål stänk från alla håll. Vattentät är "
         "den inte, så ställ den inte där vatten blir stående."),
        ("Kan den stå inomhus?",
         "Ja, men då laddar den inte. Solcellen behöver dagsljus, och ett "
         "fönster släpper igenom långt mindre än fri himmel."),
    ],
    "5ffb91a2": [
        ("Vad menas med skuggmönster?",
         "Spjälorna i skärmen står tätt, så ljuset släpps ut i ränder. På "
         "marken och på en vägg bakom syns de som randiga skuggor."),
        ("Är den vattentät?",
         "Nej. Den är klassad IP44, vilket är skydd mot stänk från alla håll "
         "— regn och snöglopp. Den får inte stå i vatten och inte spolas."),
        ("Hur länge håller lysdioden?",
         "Livslängden anges till 20 000 timmar. Vid åtta timmars lystid varje "
         "kväll är det över sex år."),
        ("Vilket batteri sitter i?",
         "Batteritypen är inte angiven för den här modellen, så vi skriver "
         "inget om den. Anvisningen som följer med säger vad som gäller."),
        ("Behöver den monteras?",
         "Något monteringskrav anges inte för den här modellen. Kartongen "
         "innehåller lampan och en handbok."),
    ],
    "ef0c374b": [
        ("Går det att ställa något på lyktorna?",
         "Nej. Locket är solcellen, och lägger du något ovanpå slutar lyktan "
         "ladda. Någon maxlast anges inte heller — de är lyktor, inte bord."),
        ("Hur stora är de?",
         "Den större mäter 45 centimeter tvärs över och 45 centimeter i "
         "höjd. Den mindre mäter 35 centimeter i båda riktningarna."),
        ("Åt vilket håll lyser de?",
         "Nedåt. Lysdioderna sitter under locket, så ljuset faller ut genom "
         "flätningens nederdel och ner mot marken."),
        ("Tål de regn?",
         "Ja, de är klassade IP44 och tål stänk från alla håll. Vattentäta "
         "är de inte, så ställ dem inte där vatten blir stående."),
        ("Måste jag montera något?",
         "Nej. Båda lyktorna är färdiga när du packar upp dem."),
    ],
    "a8cf27cd": [
        ("Varför står det ingen IP-klass?",
         "För att ingen är angiven för den här modellen. Vi skriver inte ut "
         "en siffra vi inte har. Det säkraste är att ställa lyktan under tak "
         "och ta in den när vädret slår om."),
        ("Vad är strömbrytaren till?",
         "Den sitter på solcellens undersida och är märkt ON och OFF. Står "
         "den på ON tänds lyktan av sig själv när det mörknar. Står den på "
         "OFF laddar den fortfarande, men tänds inte."),
        ("Hur starkt lyser den?",
         "Lysdioden drar 0,8 watt. Något lumenvärde är inte angivet för den "
         "här modellen, så vi anger inget — watt säger hur mycket ström "
         "lyktan drar, inte hur mycket ljus den ger."),
        ("Är flätningen av naturmaterial?",
         "Nej. Det är brun plastlina lindad runt en pulverlackad stålram, "
         "alltså konstrotting. Den ruttnar inte och behöver inte oljas."),
        ("Hur lång tid tar laddningen?",
         "Sex timmar i sol. Lystiden är åtta timmar på full laddning."),
    ],
}


def _slug(pid):
    from matt import SYSKON_129
    return SLUG.get(pid) or SYSKON_129[pid]


def bygg(pid):
    ut = ["<p>%s</p>" % INTRO[pid]]
    ut.append("<h2>%s</h2><ul>" % RUBRIK[pid])
    ut += ["<li>%s</li>" % p for p in PUNKTER[pid]]
    ut.append("</ul>")

    ut.append("<h2>%s</h2>" % SOL_RUBRIK[pid])
    ut.append("<p>%s</p>" % SOL[pid])

    ut.append("<h2>%s</h2>" % VADER_RUBRIK[pid])
    ut.append("<p>%s</p>" % VADER[pid])

    # ☠️ KORSLÄNKARNA LIGGER FÖRE FÖRSTA FLIKRUBRIKEN. `splitFlikar` lägger
    #    allt efter en matchande rubrik i den fliken — runda 120 fick
    #    korslänkarna inne i spec-tabellen på åtta sidor.
    lankar = " ".join(
        '<a href="https://www.fyndplats.se/produkt/%s">%s</a>.' % (_slug(m), t)
        for m, t in KORSLANK[pid])
    ut.append("<h2>Passar inte den här?</h2>")
    ut.append("<p>%s</p>" % lankar)

    ut.append("<h2>Tekniska specifikationer</h2><ul>")
    ut += ["<li><strong>%s:</strong> %s</li>" % (e, v) for e, v in SPEC[pid]]
    ut.append("</ul>")

    ut.append("<h2>Användning och skötsel</h2>")
    ut.append("<p>%s</p>" % SKOTSEL[pid])

    ut.append("<h2>Vanliga frågor</h2>")
    for f, s in FAQ[pid]:
        ut.append("<p><strong>%s</strong></p><p>%s</p>" % (f, s))
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
        print("%s  %4d ord  %5d tecken  titel %3d  meta %3d  namn %3d  sku %2d"
              % (pid, v["ord"], v["synliga_tecken"], len(v["titel"]),
                 len(v["meta"]), len(v["namn"]), len(v["sku"])))
