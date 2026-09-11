# -*- coding: utf-8 -*-
"""Runda 129 — nio solcellsdrivna lyktstolpar och trädgårdslyktor.

☠️ IP44 ÄR STÄNKSKYDD, ALDRIG "VATTENTÄT". Leverantören skriver `Wasserdicht`
   på flera av de nio och anger samtidigt IP44. Enligt IEC 60529 betyder den
   andra fyran skydd mot vattenstänk från alla riktningar — inte nedsänkning
   och inte kraftiga strålar. Grinden fäller ordet.

☠️ SVENSK VINTER ÄR EN HÅRD GRÄNS OCH STÅR PÅ VARJE SIDA. Specarna lovar
   6–8 timmar på 5–8 timmars laddning; det förutsätter sol. Samma form som
   gasolgrillarnas 50 mbar i runda 44: ett villkor som avgör om varan går att
   använda skrivs som en POSITIV rubrik, inte som en varningslista.

☠️ LJUSSTYRKAN ÄR DEKORATIV och får inte säljas som förmåga. 40–200 lm mot en
   40 W-glödlampas ~450. "Lyser upp gången" är kategorins klyscha — samma
   klass som foderstationernas hälsopåstående i runda 97. Sidorna beskriver
   MEKANIKEN: hur många huvuden, hur många lumen, när den tänds.

☠️ TRE PRODUKTER SAKNAR LUMENVÄRDE I KÄLLAN och får då inget. `a6727ca5`
   bär "30/60 Lumen" bara i leverantörens egen titel, utan förklaring —
   ett tal som inte går att avgöra är ett tal som utelämnas.

⚠️ `6747b6c0`: titeln säger 30 lm, `Technische Daten` säger 40. Två källor,
   två tal. Sidan skriver det LÄGRE — samma regel som runda 57:s motsägande
   breddmått: ange det tal som skyddar kunden.
"""

NAMN = {
    "14aa1777": "Solcellslampor 2-pack – lyktstolpar 180 cm med två ljuslägen och jordspett",
    "1f14ab66": "Solcellslampa 195 cm – lyktstolpe med planteringskruka och två ljuslägen",
    "c9ab8531": "Solcellslampa 182 cm – lyktstolpe med två klotarmaturer och planteringsfot",
    "4ef7c2b4": "Solcellslampa 185 cm – lyktstolpe med tre lyktor och planteringskruka",
    "ec8ab782": "Solcellslampa 189 cm – lyktstolpe med tre glaskupor och tre ljuslägen",
    "db933c3c": "Solcellslampa med dimbar LED – tre lyktor på rostfri mast, 182,5 cm",
    "a6727ca5": "Solcellslampa 177 cm – trädgårdslykta med sex lysdioder och jordspett",
    "9938574b": "Solcellslyktor 2-pack – 129 cm med jordspett och kallvitt ljus",
    "6747b6c0": "Solcellslampa 160 cm – trädgårdslykta i rostfritt med sockel och jordspett",
}

SLUG = {
    "14aa1777": "solcellslampa-180-cm-2-pack",
    "1f14ab66": "solcellslampa-195-cm-planteringskruka",
    "c9ab8531": "solcellslampa-182-cm-tva-klot",
    "4ef7c2b4": "solcellslampa-185-cm-tre-lyktor",
    "ec8ab782": "solcellslampa-189-cm-tre-glaskupor",
    "db933c3c": "solcellslampa-dimbar-tre-lyktor-rostfri",
    "a6727ca5": "solcellslampa-177-cm-tradgardslykta",
    "9938574b": "solcellslykta-129-cm-2-pack",
    "6747b6c0": "solcellslampa-160-cm-rostfri",
}

# ☠️ RÄKNADE ur husregeln (lib/import/sku.ts via grindar.sku_bas), aldrig
#    skrivna för hand. Fyra av utkasten delar redan `FP-solar-laterne` —
#    importen kapar produktdelen vid 24 tecken på hel ordgräns, och de tyska
#    sluggarna är identiska ända dit. Grinden nedan räknar om dem.
SKU = {
    "14aa1777": "FP-solcellslampa-180-cm-2",
    "1f14ab66": "FP-solcellslampa-195-cm",
    "c9ab8531": "FP-solcellslampa-182-cm-tva",
    "4ef7c2b4": "FP-solcellslampa-185-cm-tre",
    "ec8ab782": "FP-solcellslampa-189-cm-tre",
    "db933c3c": "FP-solcellslampa-dimbar-tre",
    "a6727ca5": "FP-solcellslampa-177-cm",
    "9938574b": "FP-solcellslykta-129-cm-2",
    "6747b6c0": "FP-solcellslampa-160-cm",
}

TITEL = {
    "14aa1777": "Solcellslampor 2-pack, lyktstolpe 180 cm | Fyndplats",
    "1f14ab66": "Solcellslampa 195 cm med planteringskruka | Fyndplats",
    "c9ab8531": "Solcellslampa 182 cm, två klotarmaturer | Fyndplats",
    "4ef7c2b4": "Solcellslampa 185 cm med tre lyktor | Fyndplats",
    "ec8ab782": "Solcellslampa 189 cm, tre glaskupor | Fyndplats",
    "db933c3c": "Solcellslampa med dimbar LED, tre lyktor | Fyndplats",
    "a6727ca5": "Solcellslampa 177 cm, trädgårdslykta | Fyndplats",
    "9938574b": "Solcellslyktor 2-pack, 129 cm | Fyndplats",
    "6747b6c0": "Solcellslampa 160 cm i rostfritt stål | Fyndplats",
}

META = {
    "14aa1777": "Två solcellsdrivna lyktstolpar, 180 cm höga med jordspett och "
                "skruvar. Två ljuslägen, 200 och 100 lumen. IP44.",
    "1f14ab66": "Solcellsdriven lyktstolpe 195 cm med planteringskruka i foten. "
                "Två ljuslägen, 200 och 100 lumen, manuell strömbrytare.",
    "c9ab8531": "Solcellsdriven lyktstolpe 182 cm med två klotarmaturer på "
                "böjda armar och planteringsfot. 60 lumen. Justerbar höjd.",
    "4ef7c2b4": "Solcellsdriven lyktstolpe med tre lyktor och planteringskruka. "
                "Masten byggs i sektioner till 185 cm. 90 lumen, 6000 K.",
    "ec8ab782": "Solcellsdriven lyktstolpe 189 cm med tre glaskupor, "
                "planteringsfot och strömbrytare i tre lägen. Batterier ingår.",
    "db933c3c": "Solcellsdriven lyktstolpe 182,5 cm med tre lyktor. "
                "LED-modulen är avtagbar och dimbar. 120 lumen, 6000 K.",
    "a6727ca5": "Solcellsdriven trädgårdslykta 177 cm med sexkantig lykta, sex "
                "lysdioder och jordspett. Litiumbatteri ingår. IP44.",
    "9938574b": "Två solcellsdrivna trädgårdslyktor, 129 cm höga med jordspett. "
                "Kallvitt ljus 6000 K, sex timmars lystid. IP44.",
    "6747b6c0": "Solcellsdriven trädgårdslykta 160 cm med mast i rostfritt "
                "stål. Fyra solceller i taket, sockel eller jordspett. IP44.",
}

SOKORD = {
    "14aa1777": ["solcellslampa", "lyktstolpe solcell", "solcellsbelysning trädgård",
                 "solcellslampor 2-pack"],
    "1f14ab66": ["solcellslampa", "lyktstolpe solcell", "solcellslampa med kruka",
                 "utomhusbelysning solcell"],
    "c9ab8531": ["solcellslampa", "lyktstolpe två lampor", "solcellsbelysning trädgård",
                 "klotlampa utomhus"],
    "4ef7c2b4": ["solcellslampa", "lyktstolpe tre lampor", "solcellslampa med kruka",
                 "trädgårdsbelysning solcell"],
    "ec8ab782": ["solcellslampa", "lyktstolpe tre lampor", "solcellslampa 189 cm",
                 "utomhusbelysning solcell"],
    "db933c3c": ["solcellslampa", "dimbar solcellslampa", "lyktstolpe rostfritt",
                 "trädgårdsbelysning solcell"],
    "a6727ca5": ["solcellslampa", "trädgårdslykta solcell", "solcellslampa jordspett",
                 "utomhusbelysning solcell"],
    "9938574b": ["solcellslykta", "solcellslampor 2-pack", "trädgårdsbelysning solcell",
                 "solcellslampa jordspett"],
    "6747b6c0": ["solcellslampa", "trädgårdslykta rostfritt", "solcellslampa 160 cm",
                 "utomhusbelysning solcell"],
}

INTRO = {
    "14aa1777":
        "Två lyktstolpar som tänds av sig själva när det mörknar och slocknar "
        "i gryningen. Masten byggs ihop av fyra sektioner, så du väljer om "
        "stolpen ska gå upp till 150 centimeter eller stå i full höjd på 180. "
        "Ljuset har två lägen — 200 lumen när du vill se var du sätter foten, "
        "100 när det bara ska vara stämning.",
    "1f14ab66":
        "En lyktstolpe på 195 centimeter med en planteringskruka som fot. "
        "Krukan är både det som håller stolpen på plats och det som gör den "
        "till något att titta på: fyll den med jord och plantera i den. "
        "Lyktan har två lägen, 200 och 100 lumen, och du väljer mellan "
        "automatik från skymning till gryning och en manuell strömbrytare.",
    "c9ab8531":
        "Två klotarmaturer på böjda armar, 60 lumen varmvitt, på en stolpe "
        "vars höjd du ställer själv upp till 182 centimeter. Foten är en "
        "planteringslåda som ger tyngd underifrån. Lampan tänds automatiskt "
        "i skymningen, och en strömbrytare låter dig stänga av den de kvällar "
        "du inte vill ha den tänd.",
    "4ef7c2b4":
        "Tre lyktor på böjda armar över en planteringskruka. Masten sätts "
        "ihop av sektioner, så samma lampa kan stå lägre eller gå hela vägen "
        "upp till 185 centimeter. Ljuset är kallvitt, 6000 kelvin och 90 "
        "lumen totalt, och tänds av en sensor när ljuset utomhus går under "
        "tre lux.",
    "ec8ab782":
        "Tre klara glaskupor på böjda armar, 189 centimeter upp, med en "
        "planteringslåda som fot. Utöver automatiken finns en strömbrytare "
        "med tre lägen: högt, lågt och av. De sex laddningsbara batterierna "
        "ingår, och de går att byta den dag de slutar hålla laddningen.",
    "db933c3c":
        "Tre lyktor på en mast i rostfritt stål, och den detaljen som skiljer "
        "den från resten: LED-modulen går att lyfta ur, och under kåpan "
        "sitter ett vred som dimmar ljuset. Varje lykta har fyra solceller i "
        "taket. Sockeln är avtagbar, så lampan kan stå på plattan eller "
        "spetsas ned i gräset.",
    "a6727ca5":
        "En sexkantig lykta på en smal mast, 177 centimeter hög, med "
        "solcellen inbyggd i lyktans tak. Sex lysdioder tänds när ljuset "
        "utomhus går under tre lux, och när batteriet börjar ta slut växlar "
        "lampan själv ned till ett svagare sparläge i stället för att slockna "
        "tvärt. Litiumbatteriet ingår och går att byta.",
    "9938574b":
        "Två lyktor med jordspett, 129 centimeter höga, med kallvitt ljus på "
        "6000 kelvin. De tänds automatiskt när det blir mörkt och lyser i "
        "sex timmar på full laddning. Spetsen trycks ned i gräset eller "
        "rabatten — inga verktyg, ingen kabel och inget uttag.",
    "6747b6c0":
        "En trädgårdslykta med mast i rostfritt stål, 160 centimeter hög. "
        "I taket sitter fyra solceller, och lyktan tänds av en skymningssensor. "
        "Den kan stå på den medföljande sockeln på en platta eller spetsas ned "
        "i marken med jordspettet — samma lampa, två sätt att ställa den.",
}

RUBRIK = {
    "14aa1777": "Två stolpar, fyra sektioner och två ljuslägen",
    "1f14ab66": "Lyktstolpe och planteringskruka i ett",
    "c9ab8531": "Två klot på böjda armar över en planteringsfot",
    "4ef7c2b4": "Tre lyktor, sektionsbyggd mast och plats för blommor",
    "ec8ab782": "Tre glaskupor och en strömbrytare i tre lägen",
    "db933c3c": "Dimbar LED som går att lyfta ur",
    "a6727ca5": "Sexkantig lykta med sparläge",
    "9938574b": "Två lyktor på spett, kallvitt ljus",
    "6747b6c0": "Rostfri mast, fyra solceller och två sätt att stå",
}

PUNKTER = {
    "14aa1777": [
        "Två kompletta lyktstolpar i paketet",
        "Masten byggs av fyra sektioner — upp till 150 cm utan lamphuvud, 180 cm totalt",
        "Två ljuslägen: 200 lumen högt och 100 lumen lågt",
        "Varmt ljus på 2600 kelvin",
        "Tänds i skymningen och slocknar i gryningen",
        "Jordspett och skruvar ingår, så stolpen kan stå i gräs eller på hårt underlag",
        "Stänkskyddad enligt IP44",
        "Kräver montering",
    ],
    "1f14ab66": [
        "Planteringskruka i foten, 41,5 × 41,5 cm",
        "Lamphuvudet mäter 23,5 × 23,5 × 30 cm",
        "Två ljuslägen: 200 lumen högt och 100 lumen lågt",
        "Automatik från skymning till gryning, eller manuell strömbrytare",
        "Laddar på åtta timmar och lyser i sex",
        "Stänkskyddad enligt IP44",
        "Kräver montering",
    ],
    "c9ab8531": [
        "Två klotarmaturer på böjda armar",
        "60 lumen varmvitt",
        "Höjden går att ställa, upp till 182 cm",
        "Planteringslåda som fot ger tyngd underifrån",
        "Automatik från skymning till gryning, eller manuell strömbrytare",
        "Solpanelen är 6 × 3,5 cm och drar 1,08 watt; lampan 0,4 watt",
        "Stänkskyddad enligt IP44",
        "Kräver montering",
    ],
    "4ef7c2b4": [
        "Tre lyktor på böjda armar",
        "90 lumen kallvitt, 6000 kelvin",
        "Masten byggs av sektioner, upp till 185 cm",
        "Planteringskrukan är 37 cm bred och 31 cm hög",
        "Sensorn tänder lampan när ljuset utomhus går under tre lux",
        "Manuell strömbrytare för de kvällar den ska vara släckt",
        "Laddar på sex timmar och lyser i åtta",
        "Stänkskyddad enligt IP44",
        "Kräver montering",
    ],
    "ec8ab782": [
        "Tre glaskupor på böjda armar",
        "Strömbrytare i tre lägen: högt, lågt och av",
        "Tänds automatiskt när ljuset utomhus går under tre lux",
        "Sex laddningsbara AA-batterier på 3,2 volt ingår och går att byta",
        "Planteringslådan mäter 41,5 × 41,5 × 33 cm",
        "Lyser i sex timmar på full laddning",
        "Stänkskyddad enligt IP44",
        "Kräver montering",
    ],
    "db933c3c": [
        "Tre lyktor, var och en med fyra solceller i taket",
        "LED-modulen är avtagbar",
        "Vred under kåpan dimmar ljuset",
        "120 lumen kallvitt, 6000 kelvin",
        "Mast i rostfritt stål 201 med avtagbar sockel i plast",
        "Tänds automatiskt när ljuset utomhus går under tre lux",
        "Jordpålar och skruvar ingår",
        "Stänkskyddad enligt IP44",
        "Kräver montering",
    ],
    "a6727ca5": [
        "Sexkantig lykta med solcellen i taket",
        "Sex lysdioder, färgtemperatur 3500 kelvin",
        "Tänds automatiskt när ljuset utomhus går under tre lux",
        "Växlar själv ned till ett svagare sparläge när batteriet tar slut",
        "Litiumbatteri på 3,7 volt ingår och går att byta",
        "Jordspett ingår",
        "Lyser i sex timmar på full laddning",
        "Stänkskyddad enligt IP44",
        "Kräver montering",
    ],
    "9938574b": [
        "Två kompletta lyktor i paketet",
        "Kallvitt ljus, 6000 kelvin",
        "Tänds automatiskt när ljuset utomhus går under tre lux",
        "Ett litiumbatteri per lykta ingår och går att byta",
        "Två jordspett ingår",
        "Lyser i sex timmar på full laddning",
        "Stänkskyddad enligt IP44",
        "Kräver montering",
    ],
    "6747b6c0": [
        "Mast i rostfritt stål",
        "Fyra solceller i lyktans tak",
        "30 lumen",
        "Skymningssensor tänder lampan när det blir mörkt",
        "Sockel och jordspett ingår — välj det som passar underlaget",
        "Batteri på 3,2 volt",
        "Lyser i sex timmar på full laddning",
        "Stänkskyddad enligt IP44",
        "Kräver montering",
    ],
}

# ☠️ SVENSK VINTER ÄR EN HÅRD GRÄNS SOM ÄR EN DEL AV KÖPET. Varje spec lovar
#    sin lystid på en full laddning, och en full laddning kräver sol. Det står
#    som en POSITIV rubrik med egna tal, inte som en varningslista — samma form
#    som gasolgrillarnas svenska anslutning i runda 44.
#
#    Talen per produkt kommer ur `Technische Daten`. Den generella delen kommer
#    ur handelns egen rådgivning för solcellsbelysning: batterierna ska in
#    inomhus vintertid, och en välplacerad lampa med fungerande batterier lyser
#    upp till fem–sex timmar.
SOL_RUBRIK = "Så mycket sol behöver den"

SOL = {
    "14aa1777":
        "Sex timmars laddning ger åtta timmars ljus. Det är vad panelen klarar "
        "en sommardag med sol på taket. Ställ stolparna där solen når dem mitt "
        "på dagen, inte under en tät häck — panelen sitter i lyktans tak och "
        "det är den ytan som avgör hur länge kvällen räcker. Från november "
        "till februari är dagarna korta och ofta mulna, och då blir lystiden "
        "kortare oavsett lampa. Vill du ha ljuset kvar året om: ta in "
        "batterierna över de kallaste månaderna, så tappar de inte kapacitet.",
    "1f14ab66":
        "Åtta timmars laddning ger sex timmars ljus, och panelen på 16,5 × 15 "
        "centimeter sitter i lyktans tak. Ställ stolpen så att taket ser himlen "
        "mitt på dagen. Under vinterhalvåret är dagarna för korta för en full "
        "laddning, och då räcker kvällen inte hela sex timmar — det gäller "
        "solcellsbelysning i allmänhet, inte just den här. Ta in batteriet "
        "över de kallaste månaderna, så håller det längre.",
    "c9ab8531":
        "Åtta timmars laddning ger sex timmars ljus. Panelen är liten, 6 × 3,5 "
        "centimeter, så placeringen betyder mer här än på en lampa med stort "
        "tak: välj en plats där solen faller rakt på den mitt på dagen. Under "
        "vintern blir laddningen kortare och ljuset därefter. Strömbrytaren är "
        "användbar just då — stänger du av lampan de kvällar du inte behöver "
        "den sparar du laddningen till nästa.",
    "4ef7c2b4":
        "Sex timmars laddning ger åtta timmars ljus. Panelen på 4,5 volt sitter "
        "i toppen, så stolpen vill stå fritt och inte i skugga från ett tak "
        "eller en häck. Vinterhalvåret ger kortare laddning och kortare ljus — "
        "räkna med det, och använd den manuella strömbrytaren för att spara "
        "laddningen till de kvällar du vill ha lampan tänd.",
    "ec8ab782":
        "Lampan lyser i sex timmar på full laddning, och laddningen sker genom "
        "panelerna i kupornas tak. Ställ stolpen fritt, inte under en gren. "
        "Det låga läget drar mindre och räcker längre — det är den knappen som "
        "gör vinterkvällarna användbara. Batterierna är laddningsbara "
        "AA-batterier och går att ta in och ladda inomhus när solen inte gör "
        "jobbet.",
    "db933c3c":
        "Sex timmars lystid på full laddning, fördelat på tre lyktor med fyra "
        "solceller var. Dimmervredet är det som sträcker ut kvällen: skruvar du "
        "ned ljuset drar lampan mindre och lyser längre. Ställ lyktorna där "
        "solen når taken mitt på dagen. Under vinterhalvåret blir laddningen "
        "kortare, och då är den avtagbara LED-modulen praktisk — den kan tas "
        "in och laddas inomhus.",
    "a6727ca5":
        "Sex timmars ljus på full laddning, med solcellen i lyktans tak. "
        "Sparläget är byggt för precis det läge en svensk höst ger: när "
        "batteriet börjar ta slut växlar lampan ned till ett svagare sken i "
        "stället för att slockna. Ställ lyktan där solen når taket mitt på "
        "dagen, och ta in litiumbatteriet över de kallaste månaderna.",
    "9938574b":
        "Sex timmars ljus på full laddning per lykta. Två lyktor betyder att "
        "du kan ställa dem på olika platser — en i full sol och en i halvskugga "
        "— och se vilken plats som ger mest ljus på kvällen innan du bestämmer "
        "var de ska stå. Under vinterhalvåret blir laddningen kortare; "
        "batterierna går att ta ur och ladda inomhus.",
    "6747b6c0":
        "Sex timmars ljus på full laddning från fyra solceller i taket. Lyktan "
        "kan stå på sockeln på en platta eller spetsas ned i gräset, och det "
        "valet är också ett ljusval: flytta den dit solen faktiskt faller mitt "
        "på dagen. Vinterhalvåret ger kortare laddning, och batteriet håller "
        "bättre om det får övervintra inomhus.",
}

# ☠️ KORSLÄNKEN SKA NAMNGE SKILLNADEN, inte bara peka. Och den ligger FÖRE
#    första flikrubriken — allt efter en flikrubrik hamnar i den fliken.
KORSLANK = {
    "14aa1777": [("9938574b", "Vill du ha två lyktor men lägre? Se vårt 2-pack på 129 centimeter"),
                 ("1f14ab66", "Samma lyktform men med planteringskruka i foten finns på 195 centimeter")],
    "1f14ab66": [("14aa1777", "Samma lyktform utan kruka, två stycken med jordspett, finns på 180 centimeter"),
                 ("4ef7c2b4", "Vill du ha tre lyktor över krukan i stället för en? Se modellen på 185 centimeter")],
    "c9ab8531": [("4ef7c2b4", "Tre lyktor i stället för två klot finns på 185 centimeter"),
                 ("ec8ab782", "Tre glaskupor och strömbrytare i tre lägen finns på 189 centimeter")],
    "4ef7c2b4": [("ec8ab782", "Tre glaskupor i stället för lyktor, med strömbrytare i tre lägen, finns på 189 centimeter"),
                 ("db933c3c", "Tre lyktor utan kruka, med dimbar och avtagbar LED, finns på rostfri mast")],
    "ec8ab782": [("4ef7c2b4", "Tre lyktor i stället för glaskupor finns på 185 centimeter"),
                 ("c9ab8531", "Två klotarmaturer och samma planteringsfot finns på 182 centimeter")],
    "db933c3c": [("4ef7c2b4", "Tre lyktor med planteringskruka i foten finns på 185 centimeter"),
                 ("ec8ab782", "Tre glaskupor med strömbrytare i tre lägen finns på 189 centimeter")],
    "a6727ca5": [("6747b6c0", "Samma lyktform på rostfri mast, 160 centimeter, finns här"),
                 ("9938574b", "Två lyktor i ett paket, 129 centimeter höga, finns här")],
    "9938574b": [("a6727ca5", "En ensam lykta på 177 centimeter med sparläge finns här"),
                 ("14aa1777", "Två lyktstolpar på 180 centimeter med två ljuslägen finns här")],
    "6747b6c0": [("a6727ca5", "Samma lyktform i plast på 177 centimeter finns här"),
                 ("9938574b", "Två lyktor i ett paket, 129 centimeter höga, finns här")],
}

# ☠️ `Artikelnummer` FÅR ALDRIG STÅ HÄR, och inte heller `Modellreferens`,
#    `Artikelnr` eller `Referens`. Numret hör hemma på mappningens
#    `supplierProductId` och ingen annanstans — det står i leverantörens egen
#    produkt-URL, och en återförsäljare publicerar samma sträng som `sku` och
#    `mpn`, så en googling ställer vår sida bredvid deras.
#
# ☠️ `Vikt` SKRIVS BARA DÄR VARANS EGNA TAL ÄR KÄNT. Feedkolumnen heter
#    "Weight (incl. Package)" och importen skriver den som `Vikt` — på de fyra
#    där tyskan också ger `Nettogewicht` skiljer de 1,27–1,47 gånger.
#    Där bara feedtalet finns heter raden `Vikt med emballage`.
SPEC = {
    "14aa1777": [
        ("Mått", "23,5 × 23,5 × 180 cm (bredd × djup × höjd) per stolpe"),
        ("Antal", "Två stolpar"),
        ("Höjd", "Masten byggs av fyra sektioner, upp till 150 cm utan lamphuvud"),
        ("Ljusstyrka", "200 lm i högt läge, 100 lm i lågt"),
        ("Färgtemperatur", "2600 K"),
        ("Solpanel", "16,5 × 15 cm"),
        ("Laddtid", "6 timmar"),
        ("Lystid", "8 timmar på full laddning"),
        ("Kapslingsklass", "IP44 – stänkskyddad"),
        ("Material", "ABS-plast och rostfritt stål"),
        ("Färg", "Svart"),
        ("Vikt med emballage", "5,4 kg"),
        ("Paketmått", "48,5 × 25 × 44 cm"),
        ("Ingår", "Två lyktstolpar, jordspett, skruvar och monteringsanvisning"),
        ("Montering", "Krävs"),
    ],
    "1f14ab66": [
        ("Mått", "41,5 × 41,5 × 195 cm (bredd × djup × höjd)"),
        ("Lamphuvud", "23,5 × 23,5 × 30 cm"),
        ("Ljusstyrka", "200 lm i högt läge, 100 lm i lågt"),
        ("Tändning", "Automatik från skymning till gryning, eller manuell strömbrytare"),
        ("Solpanel", "16,5 × 15 cm"),
        ("Laddtid", "8 timmar"),
        ("Lystid", "6 timmar på full laddning"),
        ("Kapslingsklass", "IP44 – stänkskyddad"),
        ("Material", "Plast"),
        ("Färg", "Svart"),
        ("Vikt med emballage", "6,5 kg"),
        ("Paketmått", "44 × 44 × 36 cm"),
        ("Ingår", "En lyktstolpe och en bruksanvisning"),
        ("Montering", "Krävs"),
    ],
    "c9ab8531": [
        ("Mått", "53,5 × 30 × 182 cm (bredd × djup × höjd)"),
        ("Lamphuvuden", "Två klotarmaturer på böjda armar"),
        ("Ljusstyrka", "60 lm"),
        ("Höjd", "Justerbar"),
        ("Effekt", "0,4 W lampa, 1,08 W solpanel"),
        ("Solpanel", "6 × 3,5 cm"),
        ("Laddtid", "8 timmar"),
        ("Lystid", "6 timmar på full laddning"),
        ("Kapslingsklass", "IP44 – stänkskyddad"),
        ("Material", "ABS-plast och rostfritt stål"),
        ("Färg", "Svart"),
        ("Vikt med emballage", "3,6 kg"),
        ("Paketmått", "37 × 32,5 × 33,5 cm"),
        ("Ingår", "En lyktstolpe med två huvuden och en anvisning"),
        ("Montering", "Krävs"),
    ],
    "4ef7c2b4": [
        ("Mått", "47–52 × 47–52 × 185 cm (bredd × djup × höjd)"),
        ("Lamphuvuden", "Tre lyktor på böjda armar"),
        ("Ljusstyrka", "90 lm"),
        ("Färgtemperatur", "6000 K"),
        ("Effekt", "0,4 W"),
        ("Solpanel", "4,5 V, 1,62 W"),
        ("Planteringskruka", "37 cm bred, 31 cm hög"),
        ("Laddtid", "6 timmar"),
        ("Lystid", "8 timmar på full laddning"),
        ("Kapslingsklass", "IP44 – stänkskyddad"),
        ("Material", "ABS-plast, rostfritt stål 201 och PET"),
        ("Färg", "Svart och transparent"),
        ("Vikt med emballage", "4,7 kg"),
        ("Paketmått", "38,5 × 38,5 × 33,5 cm"),
        ("Ingår", "En lyktstolpe och en bruksanvisning"),
        ("Montering", "Krävs"),
    ],
    "ec8ab782": [
        ("Mått", "60 × 55 × 189 cm (bredd × djup × höjd)"),
        ("Lamphuvuden", "Tre klara glaskupor på böjda armar"),
        ("Lägen", "Högt, lågt och av"),
        ("Tändning", "Automatiskt när ljuset utomhus går under 3 lux"),
        ("Lystid", "6 timmar på full laddning"),
        ("Batterier", "Sex laddningsbara AA, 3,2 V / 400 mA – ingår"),
        ("Planteringsfot", "41,5 × 41,5 × 33 cm"),
        ("Kapslingsklass", "IP44 – stänkskyddad"),
        ("Material", "Plast, ABS och rostfritt stål"),
        ("Färg", "Svart"),
        ("Vikt", "5,6 kg"),
        ("Vikt med emballage", "6,4 kg"),
        ("Ingår", "En solcellslampa och en monteringsanvisning"),
        ("Montering", "Krävs"),
    ],
    "db933c3c": [
        ("Mått", "51,5 × 47 × 182,5 cm (bredd × djup × höjd)"),
        ("Lamphuvuden", "Tre lyktor, fyra solceller i varje tak"),
        ("Ljusstyrka", "120 lm"),
        ("Färgtemperatur", "6000 K"),
        ("Dimning", "Vred under kåpan"),
        ("LED-modul", "Avtagbar"),
        ("Tändning", "Automatiskt när ljuset utomhus går under 3 lux"),
        ("Lystid", "6 timmar på full laddning"),
        ("Kapslingsklass", "IP44 – stänkskyddad"),
        ("Material", "Rostfritt stål 201 och plast"),
        ("Färg", "Svart"),
        ("Fot", "Avtagbar sockel"),
        ("Vikt med emballage", "2,5 kg"),
        ("Paketmått", "42 × 40 × 21 cm"),
        ("Ingår", "En solcellslykta, jordpålar, skruvar och anvisning"),
        ("Montering", "Krävs"),
    ],
    "a6727ca5": [
        ("Mått", "Ø 26,5 × 177 cm (diameter × höjd)"),
        ("Lysdioder", "Sex"),
        ("Färgtemperatur", "3500 K"),
        ("Tändning", "Automatiskt när ljuset utomhus går under 3 lux"),
        ("Sparläge", "Växlar själv ned till svagare ljus vid låg batterinivå"),
        ("Lystid", "6 timmar på full laddning"),
        ("Batteri", "Ett litiumbatteri, 3,7 V / 800 mA – ingår"),
        ("Kapslingsklass", "IP44 – stänkskyddad"),
        ("Material", "ABS-plast"),
        ("Färg", "Svart"),
        ("Vikt", "1,5 kg"),
        ("Vikt med emballage", "2,2 kg"),
        ("Paketmått", "24,5 × 23 × 40 cm"),
        ("Ingår", "En solcellslampa, ett litiumbatteri, ett jordspett och en monteringsanvisning"),
        ("Montering", "Krävs"),
    ],
    "9938574b": [
        ("Mått", "Ø 18,5 × 129 cm (diameter × höjd) per lykta"),
        ("Antal", "Två lyktor"),
        ("Färgtemperatur", "6000 K"),
        ("Tändning", "Automatiskt när ljuset utomhus går under 3 lux"),
        ("Lystid", "6 timmar på full laddning"),
        ("Batteri", "Ett litiumbatteri per lykta, 3,2 V / 400 mA – ingår"),
        ("Kapslingsklass", "IP44 – stänkskyddad"),
        ("Material", "ABS-plast"),
        ("Färg", "Svart"),
        ("Vikt", "1,56 kg totalt"),
        ("Vikt med emballage", "2,2 kg"),
        ("Paketmått", "36 × 32 × 18 cm"),
        ("Ingår", "Två solcellslampor, två litiumbatterier, två jordspett och en monteringsanvisning"),
        ("Montering", "Krävs"),
    ],
    "6747b6c0": [
        ("Mått", "18 × 18 × 160 cm (bredd × djup × höjd)"),
        ("Solceller", "Fyra i lyktans tak"),
        ("Ljusstyrka", "30 lm"),
        ("Tändning", "Skymningssensor"),
        ("Lystid", "6 timmar på full laddning"),
        ("Batteri", "Ett, 3,2 V / 600 mA"),
        ("Uppställning", "Sockel eller jordspett"),
        ("Kapslingsklass", "IP44 – stänkskyddad"),
        ("Material", "Rostfritt stål och plast"),
        ("Färg", "Svart"),
        ("Vikt", "1,1 kg"),
        ("Vikt med emballage", "1,4 kg"),
        ("Paketmått", "45 × 22,5 × 19,5 cm"),
        ("Ingår", "En trädgårdslykta, en bruksanvisning och monteringstillbehör"),
        ("Montering", "Krävs"),
    ],
}

SKOTSEL = {
    "14aa1777":
        "Torka av solpanelen i lyktans tak med en fuktad trasa några gånger "
        "per säsong. Damm, pollen och löv på panelen är det vanligaste skälet "
        "till att en solcellslampa plötsligt lyser kortare — ytan är liten och "
        "varje procent skugga syns på kvällen. Spola inte lampan med slang: "
        "IP44 betyder skydd mot stänk, inte mot vattenstrålar. Kontrollera att "
        "jordspetten sitter kvar efter en blåsig period, och dra åt skruvarna "
        "i sektionsskarvarna om stolpen börjar kännas glapp. Ta in batterierna "
        "inomhus de kallaste vintermånaderna, så behåller de sin kapacitet.",
    "1f14ab66":
        "Torka av solpanelen i lyktans tak några gånger per säsong — damm och "
        "löv på panelen kortar kvällens ljus mer än man tror. Fyll krukan med "
        "jord innan du planterar; det är tyngden i foten som håller stolpen "
        "upprätt. Spola inte lampan med slang: IP44 betyder skydd mot stänk, "
        "inte mot vattenstrålar. Vattna växterna i krukan utan att spruta "
        "uppåt mot lyktan. Ta in batteriet inomhus de kallaste "
        "vintermånaderna.",
    "c9ab8531":
        "Panelen är bara 6 × 3,5 centimeter, så håll den ren — här syns varje "
        "dammlager direkt på lystiden. Torka av den och klotkuporna med en "
        "fuktad trasa; kuporna samlar pollen och gör ljuset gråare med tiden. "
        "Spola inte lampan med slang: IP44 betyder skydd mot stänk, inte mot "
        "vattenstrålar. Fyll planteringsfoten med jord så att stolpen står "
        "stadigt, och ta in batteriet inomhus de kallaste vintermånaderna.",
    "4ef7c2b4":
        "Torka av solpanelen i toppen några gånger per säsong. Kontrollera "
        "sektionsskarvarna efter blåst — en mast som byggs av delar sätter sig "
        "med tiden och vill dras åt. Fyll planteringskrukan med jord, den är "
        "37 centimeter bred och det är den som ger stolpen tyngd. Spola inte "
        "lampan med slang: IP44 betyder skydd mot stänk, inte mot "
        "vattenstrålar. Ta in batteriet inomhus de kallaste vintermånaderna.",
    "ec8ab782":
        "Torka av panelerna i kupornas tak några gånger per säsong. "
        "Batterierna är vanliga laddningsbara AA-batterier: går lystiden ned "
        "efter ett par säsonger är det dem du byter, inte lampan. Fyll "
        "planteringslådan med jord så att stolpen står stadigt. Spola inte "
        "lampan med slang: IP44 betyder skydd mot stänk, inte mot "
        "vattenstrålar. Ta in batterierna inomhus de kallaste "
        "vintermånaderna.",
    "db933c3c":
        "Torka av de fyra solcellerna i varje lyktas tak några gånger per "
        "säsong. LED-modulen lyfts ur för rengöring och för vinterförvaring "
        "inomhus — kupan innanför samlar damm och blir grå med tiden. Spola "
        "inte lampan med slang: IP44 betyder skydd mot stänk, inte mot "
        "vattenstrålar. Torka av den rostfria masten med en fuktad trasa; "
        "rostfritt stål håller sig snyggare om saltrester sköljs av efter "
        "vintern.",
    "a6727ca5":
        "Torka av solcellen i lyktans tak några gånger per säsong — den "
        "sitter ovanpå och samlar både damm och löv. Rengör lyktans sidor med "
        "en fuktad trasa så att ljuset kommer ut. Spola inte lampan med slang: "
        "IP44 betyder skydd mot stänk, inte mot vattenstrålar. Litiumbatteriet "
        "går att byta när det inte längre håller kvällen ut, och det mår bäst "
        "av att övervintra inomhus.",
    "9938574b":
        "Torka av solcellen i varje lyktas tak några gånger per säsong. "
        "Kontrollera att jordspetten sitter kvar efter en blåsig period — de "
        "lossnar lättare i blöt jord än i torr. Spola inte lyktorna med slang: "
        "IP44 betyder skydd mot stänk, inte mot vattenstrålar. Batterierna går "
        "att byta, och de håller längre om de får övervintra inomhus.",
    "6747b6c0":
        "Torka av de fyra solcellerna i taket några gånger per säsong. Den "
        "rostfria masten tål väder men blir snyggare av att torkas av på "
        "våren, när vintersalt och smuts sitter kvar. Spola inte lyktan med "
        "slang: IP44 betyder skydd mot stänk, inte mot vattenstrålar. Står "
        "lyktan på sockeln under vintern: kontrollera att den inte står i en "
        "vattenpöl när snön smälter. Batteriet mår bäst av att övervintra "
        "inomhus.",
}

FAQ = {
    "14aa1777": [
        ("Hur mycket ljus ger 200 lumen?",
         "Ungefär hälften av en 40-wattslampas 450 lumen, riktat nedåt. Det "
         "räcker för att se var trappsteget slutar och för att markera en "
         "gång — men det är stämningsljus, inte arbetsbelysning."),
        ("Går höjden att ändra?",
         "Ja. Masten byggs av fyra sektioner, så du kan bygga den upp till "
         "150 centimeter utan lamphuvudet. Med huvudet på blir hela stolpen "
         "180 centimeter."),
        ("Vad betyder IP44?",
         "Skydd mot fasta föremål större än en millimeter och mot vattenstänk "
         "från alla håll. Regn och snö är alltså inget problem. Nedsänkning i "
         "vatten och kraftiga vattenstrålar är det."),
        ("Kan de stå på en stenplatta?",
         "Ja. Både jordspett och skruvar ingår, så du väljer mellan att "
         "trycka ned spettet i gräset och att skruva fast foten i plattan."),
        ("Ingår batterier?",
         "Ja, lamporna är kompletta och laddar sig själva via panelen i "
         "lyktans tak."),
    ],
    "1f14ab66": [
        ("Måste jag plantera i krukan?",
         "Nej, men fyll den med jord. Tyngden i foten är det som håller "
         "stolpen upprätt, och krukan är 41,5 × 41,5 centimeter."),
        ("Kan jag släcka lampan när jag vill?",
         "Ja. Utöver automatiken från skymning till gryning finns en manuell "
         "strömbrytare."),
        ("Hur länge lyser den?",
         "Sex timmar på full laddning, och full laddning tar åtta timmar i "
         "sol. Under vinterhalvåret räcker dagsljuset sällan till en hel "
         "laddning, och då blir kvällen kortare."),
        ("Vad betyder IP44?",
         "Skydd mot fasta föremål större än en millimeter och mot vattenstänk "
         "från alla håll. Lampan tål regn och snö, men ska inte spolas med "
         "slang eller stå under vatten."),
    ],
    "c9ab8531": [
        ("Hur mycket ljus ger 60 lumen?",
         "Ungefär en åttondel av en 40-wattslampa, fördelat på två klot. Det "
         "är ett markeringsljus som visar var gången går, inte belysning att "
         "läsa vid."),
        ("Hur högt går stolpen?",
         "Upp till 182 centimeter, och höjden går att ställa."),
        ("Vad är foten till för?",
         "Det är en planteringslåda. Fyller du den med jord får stolpen tyngd "
         "underifrån, och du kan plantera i den."),
        ("Kan jag stänga av den?",
         "Ja, det finns en strömbrytare utöver automatiken. Stänger du av "
         "lampan en kväll sparas laddningen till nästa."),
    ],
    "4ef7c2b4": [
        ("Vad betyder kallvitt ljus?",
         "6000 kelvin är ett vitt, något blåaktigt sken — samma ton som en "
         "molnig dag. Varmvitt ligger runt 2700 kelvin och är gulare."),
        ("Hur hög blir stolpen?",
         "Upp till 185 centimeter. Masten byggs av sektioner, så du kan välja "
         "en lägre höjd genom att utelämna delar."),
        ("Hur stor är planteringskrukan?",
         "37 centimeter bred och 31 centimeter hög. Fyll den med jord — det "
         "är tyngden som håller stolpen stadig."),
        ("Vad betyder IP44?",
         "Skydd mot fasta föremål större än en millimeter och mot vattenstänk "
         "från alla håll. Lampan klarar regn och snö, men inte nedsänkning "
         "eller en vattenstråle."),
    ],
    "ec8ab782": [
        ("Vad gör strömbrytaren?",
         "Den har tre lägen: högt, lågt och av. Lågt läge drar mindre och "
         "räcker längre — det är den inställningen som gör mörka kvällar "
         "användbara."),
        ("Går batterierna att byta?",
         "Ja. Det är sex laddningsbara AA-batterier på 3,2 volt, och de "
         "ingår. När de inte längre håller kvällen ut byter du dem, inte "
         "lampan."),
        ("Hur stor är foten?",
         "Planteringslådan mäter 41,5 × 41,5 × 33 centimeter. Fyll den med "
         "jord så står stolpen stadigt."),
        ("Hur mycket väger lampan?",
         "Själva lampan väger 5,6 kilo. Paketet med emballage väger 6,4."),
    ],
    "db933c3c": [
        ("Vad betyder att LED-modulen är avtagbar?",
         "Ljuskällan lyfts ur lyktan. Det gör den lätt att rengöra, och den "
         "kan tas in och laddas inomhus när solen inte räcker till."),
        ("Hur dimmar man ljuset?",
         "Med ett vred på undersidan av kåpan. Svagare ljus drar mindre och "
         "sträcker ut kvällen."),
        ("Kan den stå på en platta?",
         "Ja. Sockeln är avtagbar, så lampan kan antingen stå på sockeln på "
         "en platta eller spetsas ned i marken med de medföljande jordpålarna."),
        ("Hur mycket ljus ger 120 lumen?",
         "Ungefär en fjärdedel av en 40-wattslampa, fördelat på tre lyktor. "
         "Det markerar en gång eller en uteplats; det lyser inte upp en "
         "tomt."),
    ],
    "a6727ca5": [
        ("Vad händer när batteriet börjar ta slut?",
         "Lampan växlar själv ned till ett svagare sken i stället för att "
         "slockna tvärt. Kvällen blir alltså mörkare mot slutet i stället för "
         "att ta slut."),
        ("Går batteriet att byta?",
         "Ja. Det är ett litiumbatteri på 3,7 volt och det ingår."),
        ("Hur står lampan?",
         "På ett jordspett som trycks ned i gräset eller rabatten. Spettet "
         "ingår."),
        ("Vad betyder IP44?",
         "Skydd mot fasta föremål större än en millimeter och mot vattenstänk "
         "från alla håll. Lyktan tål regn och snö, men ska inte spolas med "
         "slang."),
    ],
    "9938574b": [
        ("Hur många lyktor får jag?",
         "Två kompletta lyktor, med varsitt batteri och varsitt jordspett."),
        ("Vad betyder kallvitt ljus?",
         "6000 kelvin är ett vitt, något blåaktigt sken. Varmvitt ligger runt "
         "2700 kelvin och är gulare och mjukare."),
        ("Hur sätts de i marken?",
         "Med jordspettet, som trycks ned i gräset eller rabatten. Inga "
         "verktyg och ingen kabel."),
        ("Hur länge lyser de?",
         "Sex timmar på full laddning. Under vinterhalvåret räcker dagsljuset "
         "sällan till en full laddning, och då blir kvällen kortare."),
    ],
    "6747b6c0": [
        ("Kan lyktan stå på en platta?",
         "Ja. Både sockel och jordspett ingår, så du väljer det som passar "
         "underlaget."),
        ("Varför rostfritt stål i masten?",
         "Det tål väder utan att rosta. Torka av masten på våren så håller "
         "den sig snygg — vintersalt och smuts sätter sig annars kvar."),
        ("Hur mycket ljus ger 30 lumen?",
         "Ungefär en femtondel av en 40-wattslampa. Det är ett markeringsljus "
         "som visar var något står, inte belysning att gå efter i mörker."),
        ("Hur många solceller sitter i taket?",
         "Fyra. De laddar batteriet under dagen, och skymningssensorn tänder "
         "lampan när det blir mörkt."),
    ],
}


def _slug(m):
    return SLUG.get(m, m)


def bygg(pid):
    ut = [f"<p>{INTRO[pid]}</p>"]
    ut.append(f"<h2>{RUBRIK[pid]}</h2><ul>")
    ut += [f"<li>{p}</li>" for p in PUNKTER[pid]]
    ut.append("</ul>")

    # ☠️ SOLAVSNITTET OCH KORSLÄNKARNA LIGGER FÖRE FÖRSTA FLIKRUBRIKEN.
    #    `splitFlikar` i butiken lägger ALLT efter en matchande rubrik i den
    #    fliken, ända till nästa match — runda 120 fick skötseltexten och
    #    korslänkarna inne i spec-tabellen på åtta sidor.
    ut.append(f"<h2>{SOL_RUBRIK}</h2>")
    ut.append(f"<p>{SOL[pid]}</p>")

    lankar = " ".join(
        f'<a href="https://www.fyndplats.se/produkt/{_slug(m)}">{t}</a>.'
        for m, t in KORSLANK[pid])
    ut.append("<h2>Passar inte den här?</h2>")
    ut.append(f"<p>{lankar}</p>")

    ut.append("<h2>Tekniska specifikationer</h2><ul>")
    ut += [f"<li><strong>{e}:</strong> {v}</li>" for e, v in SPEC[pid]]
    ut.append("</ul>")

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
