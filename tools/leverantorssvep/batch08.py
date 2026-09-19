# -*- coding: utf-8 -*-
"""Batch 8 i leverantörssvepet — tält, verktyg, kläder, byggsatser, barnmöbler.

Svansen är nu ren singelsvans: 151 förekomster på lika många formuleringar.
Flera av dem är ÄRLIGHETSMENINGAR om att leverantörens uppgifter går isär.
De ska INTE strykas — motsägelsen är information för kunden. De skrivs om så
att motsägelsen står kvar men aktören försvinner.
"""

PAR = [
    # ── Barnmöbler, medicinskåp, bänk, grindar ────────────────────────────
    ("barnfåtölj",
     "Tillverkaren godkänner den från 18 månader och rekommenderar åldrarna "
     "1,5–3 år.",
     "Den är godkänd från 18 månader och rekommenderas för åldrarna 1,5–3 år."),
    ("medicinskåp", "Tillverkaren anger maxlasten till 5 kg totalt.",
     "Maxlasten är 5 kg totalt."),
    ("bänk", "Tillverkaren anger 200 kg som maxlast för bänken sammanlagt.",
     "Maxlasten för bänken är 200 kg sammanlagt."),
    ("grind",
     "Ska grinden sitta i en trappa anger tillverkaren att den måste skruvas "
     "fast med expanderskruv.",
     "Ska grinden sitta i en trappa måste den skruvas fast med expanderskruv."),
    ("grind",
     "Ska grinden sitta i en trappa skruvas den fast — där tillåter "
     "tillverkaren inte klämmontering.",
     "Ska grinden sitta i en trappa skruvas den fast — klämmontering är inte "
     "tillåten där."),
    ("grind",
     "Skruv och plugg ingår som alternativ, och i trappa kräver tillverkaren "
     "skruvinfästning.",
     "Skruv och plugg ingår som alternativ, och i trappa krävs "
     "skruvinfästning."),
    ("sminkbord", "Tillverkaren räknar med ungefär 50 minuter.",
     "Räkna med ungefär 50 minuter."),
    ("sminkbord", "tillverkaren räknar med ungefär 50 minuter",
     "räkna med ungefär 50 minuter"),
    ("montering",
     "Läs anvisningen eller se tillverkarens monteringsvideo innan du börjar.",
     "Läs anvisningen eller se monteringsvideon innan du börjar."),
    ("hylla", "Tillverkaren anger 28,5 cm fritt mellan planen.",
     "Det är 28,5 cm fritt mellan planen."),

    # ── Textil och tvätt ──────────────────────────────────────────────────
    ("textil", "Tillverkaren avråder från både maskintvätt och centrifugering.",
     "Den tål varken maskintvätt eller centrifugering."),
    ("textil", "Tillverkaren avråder från maskintvätt och centrifugering.",
     "Den tål inte maskintvätt eller centrifugering."),
    ("tält", "Tillverkaren anger inget vattentäthetsmått.",
     "Det finns inget angivet vattentäthetsmått."),

    # ── Tält och sovsäckar ────────────────────────────────────────────────
    ("sovsäck",
     "Alla tre värdena här — 4,6, 5,8 och 6,5 — ligger i det spannet, och "
     "tillverkaren anger dem som användbara ner till −20 °C.",
     "Alla tre värdena här — 4,6, 5,8 och 6,5 — ligger i det spannet och är "
     "användbara ner till −20 °C."),
    ("tält", "(tillverkarens khaki – beige med grön ton)",
     "(khaki – beige med grön ton)"),
    ("tält",
     "Sandfärgen är tillverkarens khaki och drar åt beige med en grön ton.",
     "Sandfärgen heter khaki och drar åt beige med en grön ton."),
    ("sovsäck",
     "Leverantörens variantkort anger 5–8 °C och tillverkaren komfort ned "
     "till 5 °C.",
     "Variantuppgiften är 5–8 °C, med komfort ned till 5 °C."),
    ("sovsäck",
     "Det är storlek L, den större av tillverkarens två, och den rymmer en "
     "vuxen på knappt två meter med marginal för att vända sig.",
     "Det är storlek L, den större av de två, och den rymmer en vuxen på "
     "knappt två meter med marginal för att vända sig."),
    ("sovsäck",
     "Ytterduken är grå — tillverkarens namn på färgen är Starry sky gray — "
     "och fodret gult.",
     "Ytterduken är grå — färgen heter Starry sky gray — och fodret gult."),
    ("sovsäck", "885 gram enligt leverantörens variantkort.",
     "885 gram enligt variantuppgiften."),
    ("sovsäck", "Tillverkaren anger 0,9 kg, alltså samma siffra avrundad.",
     "Den andra uppgiften är 0,9 kg, alltså samma siffra avrundad."),
    ("tält",
     "Det räcker för ihållande regn under tre säsonger — det här är inget "
     "vintertält, och tillverkaren anger det inte heller som ett.",
     "Det räcker för ihållande regn under tre säsonger — det här är inget "
     "vintertält, och det säljs inte heller som ett."),
    ("ryggsäck",
     "Tillverkaren anger cirka 11 kg för 40-litersmodellen och cirka 14 kg "
     "för 60-litersmodellen, i båda vävarna.",
     "Vikten är cirka 11 kg för 40-litersmodellen och cirka 14 kg för "
     "60-litersmodellen, i båda vävarna."),
    ("tält",
     "Leverantörens egen sida uppger 1,76 kg på ett ställe och 1,9 kg på ett "
     "annat för samma tält — vi anger tillverkarens packade vikt, som är den "
     "högsta av siffrorna.",
     "Uppgifterna går isär: 1,76 kg på ett ställe och 1,9 kg på ett annat för "
     "samma tält — vi anger den packade vikten, som är den högsta av "
     "siffrorna."),
    ("tält",
     "Tillverkaren anger att det går vid ultralätt vandring, men 95 cm är "
     "smalt för två liggunderlag bredvid varandra.",
     "Det går vid ultralätt vandring, men 95 cm är smalt för två liggunderlag "
     "bredvid varandra."),
    ("sovsäck",
     "Tillverkaren anger tre siffror per säck: komfort, gräns och extrem.",
     "Det finns tre siffror per säck: komfort, gräns och extrem."),
    ("sovsäck",
     'Leverantören kallar fyllningen "cotton" i sin text; tillverkaren anger '
     "syntetisk fiber, och det är den uppgiften vi går på.",
     'Fyllningen kallas "cotton" på ett ställe och syntetisk fiber på ett '
     "annat; det är den senare uppgiften vi går på."),
    ("tält",
     "Tillverkaren anger på ett ställe PU 2000 mm för UL:s ytterduk — vi "
     "anger den lägre siffran från den detaljerade specifikationen.",
     "På ett ställe står PU 2000 mm för UL:s ytterduk — vi anger den lägre "
     "siffran från den detaljerade specifikationen."),
    ("tält",
     "Den ursprungliga Mongar i 210T och 20D är på väg ut hos tillverkaren "
     "och fylls inte på när lagret tar slut — efterföljaren heter "
     "Mongar BASE.",
     "Den ursprungliga Mongar i 210T och 20D är på väg ut och fylls inte på "
     "när lagret tar slut — efterföljaren heter Mongar BASE."),
    ("tält",
     "Det påverkar inte tältet du får, men tillverkaren säljer inte "
     "reservdelar separat till någon av modellerna.",
     "Det påverkar inte tältet du får, men reservdelar säljs inte separat "
     "till någon av modellerna."),

    # ── Verktyg ───────────────────────────────────────────────────────────
    ("tvätt",
     "Leverantören anger 20–60 minuter, vilket stämmer i underkanten — sextio "
     "minuter kräver att du spolar sparsamt.",
     "Den angivna tiden är 20–60 minuter, vilket stämmer i underkanten — "
     "sextio minuter kräver att du spolar sparsamt."),
    ("tvätt", "leverantörens egen specifikation anger 21 volt",
     "den detaljerade specifikationen anger 21 volt"),
    ("tvätt", "Leverantören anger 30 bar och 4 liter i minuten.",
     "Angivelsen är 30 bar och 4 liter i minuten."),
    ("tvätt", "leverantörens 30 bar och 4 l/min går inte ihop",
     "30 bar och 4 l/min går inte ihop"),
    ("tvätt",
     "Leverantören anger 30 bar, men den siffran går inte ihop med det "
     "angivna flödet och motoreffekten.",
     "Angivelsen är 30 bar, men den siffran går inte ihop med det angivna "
     "flödet och motoreffekten."),
    ("torkställ",
     "Leverantören skriver i sin text att stället går att montera både med "
     "och utan borrning — men deras egna monteringsbilder visar bara den "
     "skruvade infästningen",
     "Produkttexten säger att stället går att montera både med och utan "
     "borrning — men monteringsbilderna visar bara den skruvade infästningen"),
    ("torkställ",
     "Leverantörens text nämner montering utan borrning, men deras "
     "monteringsbilder visar bara 8 mm expansionsbultar, och 13 kilo blöt "
     "tvätt hör inte hemma på tejp.",
     "Produkttexten nämner montering utan borrning, men monteringsbilderna "
     "visar bara 8 mm expansionsbultar, och 13 kilo blöt tvätt hör inte hemma "
     "på tejp."),
    ("torkställ",
     "Leverantören anger ingen vikt för själva stället, bara maxlasten på "
     "13 kilo.",
     "Det finns ingen viktuppgift för själva stället, bara maxlasten på "
     "13 kilo."),
    ("okänd", "Ja, leverantören lyfter fram det som en användning.",
     "Ja, det är en av användningarna."),
    ("cykelgarage",
     "Antalet cyklar är hämtat ur leverantörens bild för varje storlek.",
     "Antalet cyklar är hämtat ur produktbilden för varje storlek."),
    ("okänd", "Tillverkaren anger en kvadratmeter på cirka fyra minuter.",
     "En kvadratmeter tar cirka fyra minuter."),

    # ── Byggsatser ────────────────────────────────────────────────────────
    ("byggsats",
     "Det är ett slagskepp med kanontorn — inte ett hangarfartyg, vilket "
     "leverantörens engelska text felaktigt uppgav.",
     "Det är ett slagskepp med kanontorn — inte ett hangarfartyg, vilket den "
     "engelska originaltexten felaktigt uppgav."),
    ("byggsats",
     "Leverantörens rubrik i vår katalog sa först KV-3, men förpackningen och "
     "tillverkarens spec-ritning anger KV-2, och det är också vad tornformen "
     "visar.",
     "Rubriken i vår katalog sa först KV-3, men förpackningen och "
     "spec-ritningen anger KV-2, och det är också vad tornformen visar."),
    ("byggsats", "Från 14 år enligt tillverkarens spec-ritning.",
     "Från 14 år enligt spec-ritningen."),
    ("byggsats",
     'Leverantörens rubrik avrundar till "2000+", men delförteckningen anger '
     "2 260.",
     'Rubriken avrundar till "2000+", men delförteckningen anger 2 260.'),
    ("byggsats", "Funktionen står på tillverkarens egen förpackning.",
     "Funktionen står på förpackningen."),
    ("byggsats",
     "Antal och typ står inte i leverantörens uppgifter, så räkna med att "
     "kolla lådans märkning när du packat upp.",
     "Antal och typ är inte angivna, så räkna med att kolla lådans märkning "
     "när du packat upp."),

    # ── Kläder och färgnamn ───────────────────────────────────────────────
    ("kläder",
     "namnet Vinteröron kommer från leverantörens färgkod och betyder "
     "ingenting.",
     "namnet Vinteröron kommer från en färgkod och betyder ingenting."),
    ("kläder", "Vinteröron är bara leverantörens färgkod.",
     "Vinteröron är bara en färgkod."),
    ("kläder",
     "Namnet kommer från leverantörens färgkod, och bilden på varje färg "
     "visar setet som det ser ut.",
     "Namnet kommer från en färgkod, och bilden på varje färg visar setet som "
     "det ser ut."),
    ("kläder", "Namnet är leverantörens färgkod och säger inte vad färgen är.",
     "Namnet är en färgkod och säger inte vad färgen är."),
    ("kläder",
     'Leverantörens egen produktbild bär texten "Runs large, size down" — '
     "plagget är alltså stort i storleken, och de rekommenderar själva att "
     "man går ner ett steg.",
     'Produktbilden bär texten "Runs large, size down" — plagget är alltså '
     "stort i storleken, och rekommendationen är att gå ner ett steg."),
    ("kläder",
     "Leverantören skriver själv på produktbilden att modellen är stor i "
     "storleken.",
     "Produktbilden anger att modellen är stor i storleken."),
    ("kläder",
     "Färgnamnen kommer från tillverkaren, och fyra av dem beskriver inte "
     "tyget",
     "Färgnamnen är kodnamn, och fyra av dem beskriver inte tyget"),
    ("kläder",
     "Färgnamnen kommer från tillverkaren och några av dem stämmer dåligt med "
     "tyget.",
     "Färgnamnen är kodnamn och några av dem stämmer dåligt med tyget."),
]
