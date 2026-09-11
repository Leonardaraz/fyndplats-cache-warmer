# -*- coding: utf-8 -*-
"""Runda 132 — kundtexterna. En datafil; byggandet bor i bygg().

☠️ Skriv ALDRIG ut leverantörens namn, artikelnummer eller avsändarland.
☠️ Rör ALDRIG priset.
☠️ Mot kunden är VI leverantören — skriv aldrig "leverantören anger".
"""
import matt as M

NAMN = {
    "8f6147b5": "Husdjurstrappa 3 steg med sisalstolpar – 34 cm, max 50 kg",
    "4c25eb86": "Husdjurstrappa 4 steg med sisalstolpar – 59 cm, max 50 kg",
    "762cc411": "Kattrappa 3 steg i gräddvit bouclé – 34 cm, max 10 kg",
    "f384c51d": "Hundtrappa 4 steg i ljus trälook – 54,2 cm, max 30 kg",
    "3ff2bc32": "Hundtrappa 4 steg i mörkbrunt trä – 54,2 cm, max 30 kg",
    "03715963": "Hopfällbar hundtrappa med förvaring – 3 steg, gräddvit",
    "c38f929e": "Hopfällbar hundtrappa med förvaring – 3 steg, mörkblå",
    "96d2803c": "Hopfällbar husdjurstrappa 2 steg i grått konstläder",
    "11436227": "Hopfällbar husdjurstrappa 2 steg i mörkt konstläder",
    "71e8e879": "Husdjurstrappa i skum med avtagbart steg – 39 cm, max 15 kg",
}

SLUG = {
    "8f6147b5": "husdjurstrappa-3-steg-sisal",
    "4c25eb86": "husdjurstrappa-4-steg-sisal",
    "762cc411": "kattrappa-3-steg-boucle",
    "f384c51d": "hundtrappa-ljus-tralook-4-steg",
    "3ff2bc32": "hundtrappa-morkbrun-4-steg",
    "03715963": "hundtrappa-gradvit-forvaring",
    "c38f929e": "hundtrappa-morkbla-forvaring",
    "96d2803c": "husdjurstrappa-gra-2-steg",
    "11436227": "husdjurstrappa-mork-2-steg",
    "71e8e879": "husdjurstrappa-skum-avtagbart-steg",
}

# ☠️ SKU:n SKRIVS ALDRIG FÖR HAND — den HÄRLEDS ur sluggen med samma regel
#    som importen (lib/import/sku.ts → grindar.sku_bas). Runda 132 skrev först
#    tio för hand: NIO av tio skilde sig från härledningen, och två PAR krockade
#    efter kapningen vid 24 tecken. Sluggarna ovan är valda så att det som
#    skiljer syskonen åt ryms INNAN kapningen. Verifierat mot hela katalogen
#    2026-09-11: 57 sidor, 5 649 produkter, noll slug- och noll SKU-krockar.
import sys as _sys, os as _os
_sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), ".."))
import grindar as _G

SKU = {pid: "FP-" + _G.sku_bas(slug) for pid, slug in SLUG.items()}

TITEL = {
    "8f6147b5": "Husdjurstrappa 3 steg med sisalstolpar – 34 cm | Fyndplats",
    "4c25eb86": "Husdjurstrappa 4 steg med sisalstolpar – 59 cm | Fyndplats",
    "762cc411": "Kattrappa 3 steg i gräddvit bouclé – 34 cm | Fyndplats",
    "f384c51d": "Hundtrappa 4 steg i ljus trälook | Fyndplats",
    "3ff2bc32": "Hundtrappa 4 steg i mörkbrunt trä | Fyndplats",
    "03715963": "Hopfällbar hundtrappa med förvaring – gräddvit | Fyndplats",
    "c38f929e": "Hopfällbar hundtrappa med förvaring – mörkblå | Fyndplats",
    "96d2803c": "Hopfällbar husdjurstrappa 2 steg i grått | Fyndplats",
    "11436227": "Hopfällbar husdjurstrappa 2 steg i mörkt | Fyndplats",
    "71e8e879": "Husdjurstrappa i skum med avtagbart steg | Fyndplats",
}

META = {
    "8f6147b5": ("Trappa i tre steg, 34 cm hög, med sisallindade stolpar som "
                 "tål klorna och mjuk plysch på varje steg. Bär upp till 50 kg "
                 "och står stadigt på egen bottenplatta."),
    "4c25eb86": ("En trappa på fyra steg upp till 59 cm, med sisallindade stolpar och mjuk plysch på varje steg. Bär upp till 50 kg och når en säng eller fönsterbräda."),
    "762cc411": ("Låg trappa i tre steg, 34 cm hög, klädd i gräddvit bouclé "
                 "på både steg och stolpar. Gjord för katter och riktigt små "
                 "hundar upp till 10 kg."),
    "f384c51d": ("En trappa på fyra steg upp till 54,2 cm i ljus trälook. Stegdynorna sitter fast med kardborre och går att ta av och tvätta. Bär upp till 30 kg."),
    "3ff2bc32": ("En trappa på fyra steg upp till 54,2 cm i mörkbrunt trä. Stegdynorna sitter fast med kardborre och går att ta av och tvätta. Bär upp till 30 kg."),
    "03715963": ("En trappa på tre steg upp till 48 cm som viks ihop när den inte används. Under stegen finns plats för koppel, leksaker och skålar. Gräddvitt tyg."),
    "c38f929e": ("En trappa på tre steg upp till 48 cm som viks ihop när den inte används. Under stegen finns plats för koppel, leksaker och skålar. Mörkblått tyg."),
    "96d2803c": ("Två steg upp till 20 cm i avtorkbart grått konstläder. "
                 "Vecklas ut till en 67 cm lång bädd när trappan inte behövs, "
                 "och väger under ett kilo."),
    "11436227": ("Två steg upp till 20 cm i avtorkbart mörkt konstläder. "
                 "Vecklas ut till en 67 cm lång bädd när trappan inte behövs, "
                 "och väger under ett kilo."),
    "71e8e879": ("Lätt trappa i skum med mjukt plyschöverdrag, 39 cm hög och med plats för upp till 15 kg. Lyft av översta steget så blir den en tvåstegstrappa på 26 cm."),
}

SOKORD = {
    "8f6147b5": ["husdjurstrappa", "hundtrappa 3 steg", "kattrappa sisal",
                 "trappa till soffan", "djurtrappa"],
    "4c25eb86": ["husdjurstrappa 4 steg", "hundtrappa säng", "kattrappa sisal",
                 "hög djurtrappa", "trappa till sängen"],
    "762cc411": ["kattrappa", "trappa för katt", "låg husdjurstrappa",
                 "kattrappa soffa", "djurtrappa liten"],
    "f384c51d": ["hundtrappa", "hundtrappa säng", "husdjurstrappa trä",
                 "hundtrappa 4 steg", "djurtrappa"],
    "3ff2bc32": ["hundtrappa", "hundtrappa mörkbrun", "husdjurstrappa trä",
                 "hundtrappa 4 steg", "djurtrappa"],
    "03715963": ["hopfällbar hundtrappa", "hundtrappa förvaring",
                 "husdjurstrappa vikbar", "hundtrappa soffa", "djurtrappa"],
    "c38f929e": ["hopfällbar hundtrappa", "hundtrappa förvaring",
                 "husdjurstrappa vikbar", "hundtrappa soffa", "djurtrappa"],
    "96d2803c": ["hopfällbar husdjurstrappa", "hundtrappa konstläder",
                 "kattrappa 2 steg", "hundtrappa säng", "djurtrappa"],
    "11436227": ["hopfällbar husdjurstrappa", "hundtrappa konstläder",
                 "kattrappa 2 steg", "hundtrappa säng", "djurtrappa"],
    "71e8e879": ["husdjurstrappa skum", "lätt hundtrappa", "kattrappa mjuk",
                 "hundtrappa soffa", "djurtrappa"],
}


INTRO = {
    "8f6147b5": ("En trappa på tre steg som tar husdjuret upp till 34 cm — "
                 "lagom till en soffa eller en låg säng. Stolparna är lindade "
                 "med sisalrep, så katten kan vässa klorna på vägen i stället "
                 "för på möbeln, och varje steg är klätt i mjuk ljusgrå "
                 "plysch. Hela trappan står på en egen bottenplatta."),
    "4c25eb86": ("Fyra steg som tar husdjuret hela vägen upp till 59 cm — "
                 "högt nog för en vanlig säng eller en fönsterbräda. "
                 "Stolparna är lindade med sisalrep som tål klorna, och "
                 "stegen är klädda i mörkgrå plysch. Bottenplattan håller "
                 "trappan på plats när djuret springer uppför."),
    "762cc411": ("En låg trappa på tre steg, 34 cm hög, klädd i gräddvit "
                 "bouclé över hela konstruktionen — både steg och stolpar. "
                 "Den är gjord för katter och riktigt små hundar: 45 cm lång "
                 "och 35 cm bred, så den tar liten plats intill soffan."),
    "f384c51d": ("Fyra steg i ljus trälook som tar husdjuret upp till 54,2 cm. "
                 "Varje steg har en gräddvit dyna som sitter fast med "
                 "kardborre — lyft av den när den behöver tvättas, tryck "
                 "tillbaka den när den är torr. Trappan är 40 cm bred och "
                 "59 cm djup, och bär upp till 30 kg."),
    "3ff2bc32": ("Fyra steg i mörkbrunt trä som tar husdjuret upp till 54,2 cm. "
                 "Varje steg har en brun dyna som sitter fast med kardborre — "
                 "lyft av den när den behöver tvättas, tryck tillbaka den när "
                 "den är torr. Trappan är 40 cm bred och 59 cm djup, och bär "
                 "upp till 30 kg."),
    "03715963": ("Tre steg upp till 48 cm, och när de inte behövs viks hela "
                 "trappan ihop. Insidan är ihålig, så under stegen får koppel, "
                 "leksaker och skålar plats. Utsidan är gräddvitt tyg med "
                 "mockakänsla och stegen har mjuka vita dynor."),
    "c38f929e": ("Tre steg upp till 48 cm, och när de inte behövs viks hela "
                 "trappan ihop. Insidan är ihålig, så under stegen får koppel, "
                 "leksaker och skålar plats. Utsidan är mörkblått tyg med "
                 "mockakänsla och stegen har mjuka bruna dynor."),
    "96d2803c": ("Två steg upp till 20 cm i grått konstläder som går att torka "
                 "av med en fuktig trasa. Vik ut den så blir samma trappa en "
                 "67 cm lång, 10 cm tjock bädd — två möbler i en. Den väger "
                 "under ett kilo och går att flytta med en hand."),
    "11436227": ("Två steg upp till 20 cm i mörkt konstläder som går att torka "
                 "av med en fuktig trasa. Vik ut den så blir samma trappa en "
                 "67 cm lång, 10 cm tjock bädd — två möbler i en. Den väger "
                 "under ett kilo och går att flytta med en hand."),
    "71e8e879": ("En trappa helt i skum med mjukt plyschöverdrag: 54 cm lång, "
                 "40 cm bred och 39 cm hög. Översta steget ligger löst och går "
                 "att lyfta av, och då står en tvåstegstrappa på 26 cm kvar. "
                 "Gräddvita steg mot bruna sidor."),
}

RUBRIK = {p: "Det här får du" for p in NAMN}

PUNKTER = {
    "8f6147b5": [
        "Tre steg upp till 34 cm, med 10 cm mellan varje steg",
        "Stolpar lindade med sisalrep som tål klorna",
        "Mjuk ljusgrå plysch på varje steg och på bottenplattan",
        "46 cm lång och 35,5 cm bred",
        "Bär upp till 50 kg",
    ],
    "4c25eb86": [
        "Fyra steg: 15 / 29,5 / 45 / 59,5 cm",
        "Stolpar lindade med sisalrep som tål klorna",
        "Stegyta 40,5 × 15 cm, klädd i mörkgrå plysch",
        "60 cm lång och 40,5 cm bred på bottenplattan",
        "Bär upp till 50 kg",
    ],
    "762cc411": [
        "Tre steg upp till 34 cm",
        "Gräddvit bouclé över både steg och stolpar",
        "45 cm lång och 35 cm bred — tar liten plats",
        "Bär upp till 10 kg, alltså katt eller mycket liten hund",
        "Bottenplatta som håller trappan stadigt",
    ],
    "f384c51d": [
        "Fyra steg: 14,3 / 27,6 / 40,9 / 54,2 cm",
        "Stegyta 40 × 17 cm med gräddvit dyna",
        "Dynorna fästs med kardborre och går att ta av och tvätta",
        "Stomme i MDF med ljus trälook, 40 cm bred och 59 cm djup",
        "Bär upp till 30 kg",
    ],
    "3ff2bc32": [
        "Fyra steg: 14,3 / 27,6 / 40,9 / 54,2 cm",
        "Stegyta 40 × 17 cm med brun dyna",
        "Dynorna fästs med kardborre och går att ta av och tvätta",
        "Stomme i MDF i mörkbrunt, 40 cm bred och 59 cm djup",
        "Bär upp till 30 kg",
    ],
    "03715963": [
        "Tre steg: 16 / 32 / 48 cm",
        "Viks ihop helt när trappan inte används",
        "Ihåligt utrymme under stegen för husdjurets saker",
        "Stegyta 40 × 18 cm, 40 cm bred och 54 cm djup",
        "Väger 4,2 kg och går att bära i en hand",
    ],
    "c38f929e": [
        "Tre steg: 16 / 32 / 48 cm",
        "Viks ihop helt när trappan inte används",
        "Ihåligt utrymme under stegen för husdjurets saker",
        "Stegyta 40 × 18 cm, 40 cm bred och 54 cm djup",
        "Väger 4,2 kg och går att bära i en hand",
    ],
    "96d2803c": [
        "Två steg upp till 20 cm",
        "Vecklas ut till en 67 × 39 cm stor bädd, 10 cm tjock",
        "Grått konstläder som torkas av med fuktig trasa",
        "Tjock skumstoppning under hela ytan",
        "Väger 0,81 kg",
    ],
    "11436227": [
        "Två steg upp till 20 cm",
        "Vecklas ut till en 67 × 39 cm stor bädd, 10 cm tjock",
        "Mörkt konstläder som torkas av med fuktig trasa",
        "Tjock skumstoppning under hela ytan",
        "Väger 0,81 kg",
    ],
    "71e8e879": [
        "Tre steg upp till 39 cm — andra steget ligger på 26 cm",
        "Översta steget lyfts av och trappan blir tvåstegs",
        "Helt i skum med mjukt plyschöverdrag",
        "54 cm lång och 40 cm bred",
        "Bär upp till 15 kg",
    ],
}

LAST_RUBRIK = {p: "Så mycket bär den" for p in NAMN}

LAST = {
    "8f6147b5": ("Trappan bär upp till 50 kg, så storleken på djuret är "
                 "sällan det som avgör här — det är höjden. 34 cm räcker upp "
                 "till en soffsits eller en låg säng, men inte till en hög "
                 "säng. Mät från golvet till den kant djuret ska nå innan du "
                 "väljer."),
    "4c25eb86": ("Trappan bär upp till 50 kg och når 59 cm, vilket är den "
                 "höjd en normalhög säng brukar ligga på. Mät från golvet upp "
                 "till kanten: hamnar du över 59 cm blir sista klivet upp för "
                 "brant, och då är en lägre möbel ett bättre mål."),
    "762cc411": ("Max 10 kg är den siffra som styr allt här. Den räcker för "
                 "katter och för hundar i chihuahua- eller dvärgspetsstorlek, "
                 "men inte för en tax eller en fransk bulldogg. Väger djuret "
                 "mer behöver du en kraftigare trappa."),
    "f384c51d": ("Trappan bär upp till 30 kg, alltså även en mellanstor hund. "
                 "54,2 cm är hög nog för de flesta sängar. Ställ trappan mot en "
                 "vägg eller mot sängkanten så att den inte kan glida bakåt "
                 "när djuret tar sats på understa steget."),
    "3ff2bc32": ("Trappan bär upp till 30 kg, alltså även en mellanstor hund. "
                 "54,2 cm är hög nog för de flesta sängar. Ställ trappan mot en "
                 "vägg eller mot sängkanten så att den inte kan glida bakåt "
                 "när djuret tar sats på understa steget."),
    "03715963": ("För den här trappan anges ingen maxvikt, och då ska vi inte "
                 "gissa fram en. Konstruktionen är en vikbar tygstomme över "
                 "MDF-skivor, alltså byggd för mindre djur snarare än för en "
                 "tung hund. Väger ditt djur mer än något tiotal kilo är en "
                 "trappa med angiven bärighet ett tryggare val."),
    "c38f929e": ("För den här trappan anges ingen maxvikt, och då ska vi inte "
                 "gissa fram en. Konstruktionen är en vikbar tygstomme över "
                 "MDF-skivor, alltså byggd för mindre djur snarare än för en "
                 "tung hund. Väger ditt djur mer än något tiotal kilo är en "
                 "trappa med angiven bärighet ett tryggare val."),
    "96d2803c": ("Den här är gjord för riktigt små hundar och för katter — "
                 "upp till ungefär 7 kg, alltså storlekar som foxterrier, "
                 "welsh corgi och cockerspaniel. Någon maxlast i kilo anges "
                 "inte, så gå efter den siffran i stället."),
    "11436227": ("Den här är gjord för riktigt små hundar och för katter — "
                 "upp till ungefär 7 kg, alltså storlekar som foxterrier, "
                 "welsh corgi och cockerspaniel. Någon maxlast i kilo anges "
                 "inte, så gå efter den siffran i stället."),
    "71e8e879": ("Trappan bär upp till 15 kg. Skum väger nästan ingenting, "
                 "vilket är hela poängen — den går att flytta med en hand och "
                 "kan inte skada golvet. Baksidan är att den behöver stå mot "
                 "något: ställ den tätt intill soffan eller sängen."),
}

BRUK_RUBRIK = {p: "Att tänka på" for p in NAMN}

BRUK = {
    "8f6147b5": ("Ställ trappan så att understa steget står fritt och djuret "
                 "kan ta sats rakt framifrån. Sisalrepet är avsett att klösas "
                 "på och kommer att fransa sig med tiden — det är slitage, "
                 "inte ett fel."),
    "4c25eb86": ("Med 59 cm blir trappan hög nog att vippa om djuret hoppar "
                 "snett på översta steget. Ställ den mot sängkanten eller mot "
                 "en vägg. Sisalrepet är avsett att klösas på och fransar sig "
                 "med tiden — det är slitage, inte ett fel."),
    "762cc411": ("Bouclén är mjuk under tassarna men fastnar i klor som är "
                 "för långa. Klipp klorna som vanligt, så håller ytan längre. "
                 "Stolparna är klädda i samma bouclé som stegen — det här är en trappa, ingen klöspelare."),
    "f384c51d": ("Trappan levereras i delar och skruvas ihop. Dra åt alla "
                 "skruvar innan djuret får gå på den, och efterdra efter "
                 "någon månad — trä sätter sig. Stegdynorna sitter med "
                 "kardborre och ska sitta helt platt innan trappan används."),
    "3ff2bc32": ("Trappan levereras i delar och skruvas ihop. Dra åt alla "
                 "skruvar innan djuret får gå på den, och efterdra efter "
                 "någon månad — trä sätter sig. Stegdynorna sitter med "
                 "kardborre och ska sitta helt platt innan trappan används."),
    "03715963": ("Trappan sätts ihop av vikbara tygmoduler med tryckknappar. "
                 "Kontrollera att alla knappar är stängda innan djuret går "
                 "upp — en öppen knapp gör steget mjukt på fel sätt. "
                 "Förvaringen är avsedd för lätta saker, inte för tyngd."),
    "c38f929e": ("Trappan sätts ihop av vikbara tygmoduler med tryckknappar. "
                 "Kontrollera att alla knappar är stängda innan djuret går "
                 "upp — en öppen knapp gör steget mjukt på fel sätt. "
                 "Förvaringen är avsedd för lätta saker, inte för tyngd."),
    "96d2803c": ("Konstläder blir halt om det är blött. Torka av med fuktig "
                 "trasa och låt ytan torka innan djuret använder trappan "
                 "igen. Överdraget går att ta av när det behöver tvättas."),
    "11436227": ("Konstläder blir halt om det är blött. Torka av med fuktig "
                 "trasa och låt ytan torka innan djuret använder trappan "
                 "igen. Överdraget går att ta av när det behöver tvättas."),
    "71e8e879": ("Översta steget är inte fastsatt i resten av trappan. Det "
                 "gör att du kan lyfta av det och få en lägre trappa — men "
                 "det betyder också att steget måste stödja mot soffan eller "
                 "sängen för att ligga still. Står trappan fritt mitt på "
                 "golvet ska översta steget vara avlyft."),
}

SKOTSEL = {
    "8f6147b5": ("Dammsug plyschen som du dammsuger en matta. Fläckar tas "
                 "med lite ljummet vatten och en trasa, utan blötläggning. "
                 "Sisalrepet ska inte blötas alls — borsta det torrt."),
    "4c25eb86": ("Dammsug plyschen som du dammsuger en matta. Fläckar tas "
                 "med lite ljummet vatten och en trasa, utan blötläggning. "
                 "Sisalrepet ska inte blötas alls — borsta det torrt."),
    "762cc411": ("Dammsug bouclén regelbundet; den fångar päls effektivt. "
                 "Fläckar tas med ljummet vatten och en trasa. Låt torka helt "
                 "innan djuret använder trappan igen."),
    "f384c51d": ("Stegdynorna lossas från kardborren och tvättas för sig. "
                 "Trästommen torkas av med en fuktig trasa — låt inte vatten "
                 "bli stående på skivkanterna."),
    "3ff2bc32": ("Stegdynorna lossas från kardborren och tvättas för sig. "
                 "Trästommen torkas av med en fuktig trasa — låt inte vatten "
                 "bli stående på skivkanterna."),
    "03715963": ("Torka tygytan med en fuktig trasa och låt den lufttorka. "
                 "Vik inte ihop trappan medan tyget är fuktigt — insidan "
                 "torkar långsamt när modulerna ligger mot varandra."),
    "c38f929e": ("Torka tygytan med en fuktig trasa och låt den lufttorka. "
                 "Vik inte ihop trappan medan tyget är fuktigt — insidan "
                 "torkar långsamt när modulerna ligger mot varandra."),
    "96d2803c": ("Konstläder sköts enklast med en fuktig trasa. Undvik "
                 "lösningsmedel och starka rengöringsmedel, som torkar ut "
                 "ytan och gör den spröd."),
    "11436227": ("Konstläder sköts enklast med en fuktig trasa. Undvik "
                 "lösningsmedel och starka rengöringsmedel, som torkar ut "
                 "ytan och gör den spröd."),
    "71e8e879": ("Dammsug plyschen regelbundet. Fläckar tas med ljummet "
                 "vatten och en trasa — skummet under ska inte blötas, för "
                 "det tar lång tid att torka igenom."),
}


# Korslänkar. Varje sida pekar på 2–3 andra i familjen, och SYSKONPAR
# pekar ALLTID på varandra (uppgift #480: en enkelriktad korslänk är ett
# halvt syskonpar). Grannarna är publicerade sidor, lästa ur Wix.
KORS_INGRESS = {p: "Passar inte den här?" for p in NAMN}

KORSLANK = {
    "8f6147b5": [("husdjurstrappa-4-steg-sisal", "fyra steg upp till 59 cm"),
                 ("kattrappa-3-steg-boucle", "samma höjd utan sisal"),
                 ("hopfallbar-hundtrappa-3-steg", "en som viks ihop")],
    "4c25eb86": [("husdjurstrappa-3-steg-sisal", "tre steg upp till 34 cm"),
                 ("hundtrappa-ljus-tralook-4-steg", "fyra steg i trä"),
                 ("vikbar-husdjurstrappa-4-steg", "fyra steg som viks ihop")],
    "762cc411": [("husdjurstrappa-3-steg-sisal", "samma höjd med sisalstolpar"),
                 ("husdjurstrappa-gra-2-steg", "en lägre i konstläder"),
                 ("hundtrappa-sma-hundar-katter-4-steg", "fyra steg för små djur")],
    "f384c51d": [("hundtrappa-morkbrun-4-steg", "samma trappa i mörkbrunt"),
                 ("hundtrappa-gradvit-forvaring", "en som viks ihop"),
                 ("vikbar-husdjurstrappa-4-steg", "fyra steg som viks ihop")],
    "3ff2bc32": [("hundtrappa-ljus-tralook-4-steg", "samma trappa i ljus trälook"),
                 ("hundtrappa-morkbla-forvaring", "en som viks ihop"),
                 ("hundtrappa-med-forvaring", "tre steg med förvaring")],
    "03715963": [("hundtrappa-morkbla-forvaring", "samma trappa i mörkblått"),
                 ("hundtrappa-ljus-tralook-4-steg", "fyra steg i trä"),
                 ("hundtrappa-med-forvaring", "en annan med förvaring")],
    "c38f929e": [("hundtrappa-gradvit-forvaring", "samma trappa i gräddvitt"),
                 ("hundtrappa-morkbrun-4-steg", "fyra steg i trä"),
                 ("hundtrappa-med-forvaring", "en annan med förvaring")],
    "96d2803c": [("husdjurstrappa-mork-2-steg", "samma trappa i mörkt"),
                 ("husdjurstrappa-skum-avtagbart-steg", "tre steg i skum"),
                 ("kattrappa-3-steg-boucle", "tre steg i bouclé")],
    "11436227": [("husdjurstrappa-gra-2-steg", "samma trappa i grått"),
                 ("husdjurstrappa-skum-avtagbart-steg", "tre steg i skum"),
                 ("kattrappa-3-steg-boucle", "tre steg i bouclé")],
    "71e8e879": [("husdjurstrappa-gra-2-steg", "två steg i konstläder"),
                 ("hopfallbar-hundtrappa-3-steg", "tre steg som viks ihop"),
                 ("husdjurstrappa-3-steg-sisal", "tre steg med sisalstolpar")],
}

KORS_TEXT = {p: "Fler trappor i samma familj:" for p in NAMN}

SPEC = {
    "8f6147b5": [("Antal steg", "3"), ("Höjd", "34 cm"),
                 ("Steghöjd", "10 cm"), ("Mått", "46 × 35,5 × 34 cm"),
                 ("Material", "spånskiva, plysch och sisalrep"),
                 ("Färg", "ljusgrå"), ("Maxlast", "50 kg")],
    "4c25eb86": [("Antal steg", "4"), ("Höjd", "59 cm"),
                 ("Steghöjder", "15 / 29,5 / 45 / 59,5 cm"),
                 ("Stegyta", "40,5 × 15 cm"),
                 ("Mått", "60 × 40,5 × 59 cm"),
                 ("Material", "spånskiva, plysch och sisalrep"),
                 ("Färg", "mörkgrå"), ("Maxlast", "50 kg")],
    "762cc411": [("Antal steg", "3"), ("Höjd", "34 cm"),
                 ("Mått", "45 × 35 × 34 cm"),
                 ("Material", "spånskiva och bouclé"),
                 ("Färg", "gräddvit"), ("Maxlast", "10 kg")],
    "f384c51d": [("Antal steg", "4"), ("Höjd", "54,2 cm"),
                 ("Steghöjder", "14,3 / 27,6 / 40,9 / 54,2 cm"),
                 ("Stegyta", "40 × 17 cm"),
                 ("Mått", "40 × 59 × 54,2 cm"),
                 ("Material", "MDF med kortplysch"),
                 ("Färg", "ljus trälook med gräddvita stegdynor"),
                 ("Maxlast", "30 kg"), ("Montering", "krävs")],
    "3ff2bc32": [("Antal steg", "4"), ("Höjd", "54,2 cm"),
                 ("Steghöjder", "14,3 / 27,6 / 40,9 / 54,2 cm"),
                 ("Stegyta", "40 × 17 cm"),
                 ("Mått", "40 × 59 × 54,2 cm"),
                 ("Material", "MDF med kortplysch"),
                 ("Färg", "mörkbrun med bruna stegdynor"),
                 ("Maxlast", "30 kg"), ("Montering", "krävs")],
    "03715963": [("Antal steg", "3"), ("Höjd", "48 cm"),
                 ("Steghöjder", "16 / 32 / 48 cm"),
                 ("Stegyta", "40 × 18 cm"),
                 ("Mått", "40 × 54 × 48 cm"),
                 ("Material", "MDF klass P2 med mockaimitation och fleece"),
                 ("Färg", "gräddvit med vita stegdynor"),
                 ("Vikt", "4,2 kg"), ("Montering", "krävs")],
    "c38f929e": [("Antal steg", "3"), ("Höjd", "48 cm"),
                 ("Steghöjder", "16 / 32 / 48 cm"),
                 ("Stegyta", "40 × 18 cm"),
                 ("Mått", "40 × 54 × 48 cm"),
                 ("Material", "MDF klass P2 med mockaimitation och fleece"),
                 ("Färg", "mörkblå med bruna stegdynor"),
                 ("Vikt", "4,2 kg"), ("Montering", "krävs")],
    "96d2803c": [("Antal steg", "2"), ("Höjd", "20 cm"),
                 ("Mått som trappa", "45 × 39 × 20 cm"),
                 ("Mått utfälld", "67 × 39 × 10 cm"),
                 ("Material", "konstläder med skumstoppning"),
                 ("Färg", "grå"), ("Vikt", "0,81 kg")],
    "11436227": [("Antal steg", "2"), ("Höjd", "20 cm"),
                 ("Mått som trappa", "45 × 39 × 20 cm"),
                 ("Mått utfälld", "67 × 39 × 10 cm"),
                 ("Material", "konstläder med skumstoppning"),
                 ("Färg", "mörkgrå"), ("Vikt", "0,81 kg")],
    "71e8e879": [("Antal steg", "3, varav översta är avtagbart"),
                 ("Höjd", "39 cm"), ("Höjd utan översta steget", "26 cm"),
                 ("Mått", "54 × 40 × 39 cm"),
                 ("Material", "skum med plyschöverdrag"),
                 ("Färg", "gräddvita steg med bruna sidor"),
                 ("Maxlast", "15 kg")],
}

_FAQ_GEMENSAM = [
    ("Behöver djuret läras att gå i trappan?",
     "Oftast ja, och det går fort. Ställ trappan där djuret brukar hoppa, "
     "lägg en godsak på understa steget och flytta den uppåt steg för steg "
     "under några dagar. Lyft aldrig upp djuret och sätt det på ett högt "
     "steg — det lär den bara att trappan är något som händer med den."),
]

FAQ = {
    "8f6147b5": [
        ("Kan katten klösa på stolparna?",
         "Ja, det är vad sisalrepet sitter där för. Repet fransar sig med "
         "tiden precis som på en klöspelare."),
        ("Räcker 34 cm upp till sängen?",
         "Till en soffsits eller en låg säng, ja. En vanlig säng ligger "
         "högre — mät från golvet till kanten innan du bestämmer dig."),
    ] + _FAQ_GEMENSAM,
    "4c25eb86": [
        ("Är 59 cm tillräckligt för en säng?",
         "För en normalhög säng brukar det räcka. Mät från golvet upp till "
         "madrasskanten: ligger den över 59 cm blir sista klivet för brant."),
        ("Kan katten klösa på stolparna?",
         "Ja, sisalrepet sitter där för det. Det fransar sig med tiden precis "
         "som på en klöspelare."),
    ] + _FAQ_GEMENSAM,
    "762cc411": [
        ("Passar den en tax eller en fransk bulldogg?",
         "Nej. Trappan bär 10 kg, och båda de raserna väger mer. Den är gjord "
         "för katter och för hundar i chihuahuastorlek."),
        ("Finns det något att klösa på?",
         "Nej, hela trappan är klädd i bouclé — både steg och stolpar. Den är byggd för att gå i, inte för att vässa klorna på."),
    ] + _FAQ_GEMENSAM,
    "f384c51d": [
        ("Går stegdynorna att tvätta?",
         "Ja. De sitter fast med kardborre, så de lossas utan verktyg och "
         "trycks tillbaka när de torkat."),
        ("Måste den monteras?",
         "Ja, trappan kommer i delar och skruvas ihop. Efterdra skruvarna "
         "efter någon månad — trä sätter sig."),
    ] + _FAQ_GEMENSAM,
    "3ff2bc32": [
        ("Går stegdynorna att tvätta?",
         "Ja. De sitter fast med kardborre, så de lossas utan verktyg och "
         "trycks tillbaka när de torkat."),
        ("Måste den monteras?",
         "Ja, trappan kommer i delar och skruvas ihop. Efterdra skruvarna "
         "efter någon månad — trä sätter sig."),
    ] + _FAQ_GEMENSAM,
    "03715963": [
        ("Hur mycket får plats under stegen?",
         "Utrymmet är ihåligt hela vägen och rymmer koppel, leksaker och "
         "skålar. Det är gjort för lätta saker, inte för tyngd."),
        ("Hur mycket bär trappan?",
         "Någon maxvikt anges inte för den här modellen, och vi vill inte "
         "gissa fram en. Konstruktionen är en vikbar tygstomme över "
         "MDF-skivor — för en tung hund är en trappa med angiven bärighet "
         "ett tryggare val."),
    ] + _FAQ_GEMENSAM,
    "c38f929e": [
        ("Hur mycket får plats under stegen?",
         "Utrymmet är ihåligt hela vägen och rymmer koppel, leksaker och "
         "skålar. Det är gjort för lätta saker, inte för tyngd."),
        ("Hur mycket bär trappan?",
         "Någon maxvikt anges inte för den här modellen, och vi vill inte "
         "gissa fram en. Konstruktionen är en vikbar tygstomme över "
         "MDF-skivor — för en tung hund är en trappa med angiven bärighet "
         "ett tryggare val."),
    ] + _FAQ_GEMENSAM,
    "96d2803c": [
        ("Vad menas med att den blir en bädd?",
         "De två stegen är två kuddar som fälls ut bredvid varandra. Utfälld "
         "blir den 67 × 39 cm och 10 cm tjock — en liggplats i stället för "
         "en trappa."),
        ("Hur stort djur klarar den?",
         "Den är gjord för katter och riktigt små hundar upp till ungefär "
         "7 kg. Någon maxlast i kilo anges inte, så gå efter den siffran."),
    ] + _FAQ_GEMENSAM,
    "11436227": [
        ("Vad menas med att den blir en bädd?",
         "De två stegen är två kuddar som fälls ut bredvid varandra. Utfälld "
         "blir den 67 × 39 cm och 10 cm tjock — en liggplats i stället för "
         "en trappa."),
        ("Hur stort djur klarar den?",
         "Den är gjord för katter och riktigt små hundar upp till ungefär "
         "7 kg. Någon maxlast i kilo anges inte, så gå efter den siffran."),
    ] + _FAQ_GEMENSAM,
    "71e8e879": [
        ("Varför sitter översta steget löst?",
         "För att du ska kunna lyfta av det och få en lägre trappa på 26 cm. "
         "Baksidan är att steget måste stödja mot soffan eller sängen för att "
         "ligga still — står trappan fritt på golvet ska översta steget vara "
         "avlyft."),
        ("Glider den på parkett?",
         "Skum är lätt, så trappan kan skjutas undan när djuret tar sats. "
         "Ställ den tätt intill möbeln, eller lägg en matta under."),
    ] + _FAQ_GEMENSAM,
}


BAS = "https://www.fyndplats.se"


def _p(t):
    return "<p>" + t + "</p>"


def bygg(pid):
    """Bygger plainDescription. Ordningen speglar runda 131 exakt."""
    d = []
    d.append(_p(INTRO[pid]))

    d.append("<h2>" + RUBRIK[pid] + "</h2>")
    d.append("<ul>" + "".join("<li>" + x + "</li>" for x in PUNKTER[pid]) + "</ul>")

    d.append("<h2>" + LAST_RUBRIK[pid] + "</h2>")
    d.append(_p(LAST[pid]))

    d.append("<h2>" + BRUK_RUBRIK[pid] + "</h2>")
    d.append(_p(BRUK[pid]))

    d.append("<h2>" + KORS_INGRESS[pid] + "</h2>")
    # ☠️ ABSOLUT URL, ALDRIG ROTRELATIV. Uppmätt i runda 132: en href som
    #    börjar på "/produkt/" skrivs om av Wix till "https:/produkt/..." —
    #    med ETT snedstreck, alltså en adress vars värdnamn blir "produkt".
    #    Felet syns inte i PATCH-svaret och kostade exakt +6 tecken per länk.
    #    Runda 131 använde den absoluta formen och klarade sig; ingen grind
    #    höll fast vid den, så runda 132 gick rakt i fällan.
    lankar = ", ".join(
        '<a href="{}/produkt/{}">{}</a>'.format(BAS, s, t)
        for s, t in KORSLANK[pid]
    )
    d.append(_p(KORS_TEXT[pid] + " " + lankar + "."))

    d.append("<h2>Tekniska specifikationer</h2>")
    d.append("<ul>" + "".join(
        "<li><strong>{}:</strong> {}</li>".format(e, v) for e, v in SPEC[pid]
    ) + "</ul>")

    d.append("<h2>Användning och skötsel</h2>")
    d.append(_p(SKOTSEL[pid]))

    d.append("<h2>Vanliga frågor</h2>")
    for f, s in FAQ[pid]:
        d.append("<p><strong>" + f + "</strong></p>")
        d.append(_p(s))

    return "".join(d)
