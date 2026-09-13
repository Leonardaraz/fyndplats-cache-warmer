# -*- coding: utf-8 -*-
"""Runda 141 — all kundtext, byggd i FIL och grindad före skrivning.

☠️ TEXTEN SKRIVS ALDRIG INLINE I ETT API-ANROP (batch 64: fem inline gav nio
   fel som nådde Wix, tre via fil gav noll).

☠️ MAXLAST ÄR `Maximales Benutzergewicht`, ALDRIG totalkapaciteten. Sex av
   sju bänkar anger BÅDA, och den större siffran står i marknadsföringen:

       8de3c3ef · b4961e6f · 8a0e05f4   300 kg totalt, 120 kg användare
       a4bbe667                         300 kg bänk,   150 kg användare
       83b2cf8b                         200 kg sits,   100 kg användare
       7b818c3b                         150 kg bänk,   INGEN användarvikt

   En kund som läser "tål 300 kg" drar slutsatsen att hen får väga 300 kg.
   Det gör hen inte. Totalen får nämnas — men bara etiketterad som vad den
   är, och aldrig ensam. `7b818c3b` får ingen maxlast alls i spec-listan;
   den frågan besvaras i FAQ:n med exakt det som faktiskt anges.

☠️ `18b94738` ÄR INTE MASSIVT TRÄ. Källan säger `Massivholz` och `Buche`,
   tre eniga rader — och zoomen på skivkanten visar staplade fanerskikt.
   Skriv skiktlimmad träskiva. Inte bok, inte massivt. (STEG4.md 2.)

☠️ `8de3c3ef` ÄR INTE GRÖN. Av bildens 1 432 mättade pixlar är noll gröna:
   91 % blå, 9 % turkos, resten av varan svart. (STEG4.md 3.)

☠️ VIKTER OCH SKIVSTÄNGER INGÅR INTE på 83b2cf8b och a4bbe667, och hantlar
   inte på 18b94738 — trots att bilderna visar dem. Det står i brödtexten,
   inte bara i en specrad. Lieferumfang är kontraktet (#468).

☠️ INGEN CERTIFIERING. EN 957 finns som standard för träningsutrustning men
   ingenting i underlaget säger att bänkarna är provade mot den. Ett
   standardnamn utan belägg är exakt den ogrundade certifiering som fälldes
   i runda 54 (#252).

☠️ `Artikelnummer` är ALDRIG en etikett här.
☠️ INGET AVSÄNDARLAND. EU-lager-ribbonen är enda sanktionerade stället.
☠️ `Vikt` i spec-blocket är FRAKTVIKTEN (#488) — aldrig etiketterad "Vikt".
"""
import os as _os
import sys as _sys

_sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), ".."))
_sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
import grindar as _G                                             # noqa: E402
import matt as _M                                                # noqa: E402

BAS = "https://www.fyndplats.se"

# Den publicerade RÖDA systern till b4961e6f. Samma modell, samma mått,
# ordagrant samma materialsträng — bara färgen skiljer (STEG1-DUBBLETT.md).
PUB_ROD = "hopfallbar-traningsbank-justerbart-ryggstod-rod"

SLUG = {
    "8de3c3ef": "traningsbank-115-cm-benstrackare",
    "7b818c3b": "traningsbank-med-stallning-98-122-cm",
    "8a0e05f4": "traningsbank-146-cm-tre-lutningar",
    "b4961e6f": "hopfallbar-traningsbank-justerbart-ryggstod-svart",
    "83b2cf8b": "traningsbank-skivstangsstall-benstrackare",
    "a4bbe667": "traningsbank-skivstangsstall-brostpress-vit",
    "18b94738": "traningsbank-i-tra-med-hantelfack",
}

NAMN = {
    "8de3c3ef": "Träningsbänk 115 cm med bensträckare och 7 ryggvinklar",
    "7b818c3b": "Träningsbänk med ställning 98–122 cm, hopfällbar",
    "8a0e05f4": "Träningsbänk 146 cm med tre lutningar och bukträning",
    "b4961e6f": "Hopfällbar träningsbänk med justerbart ryggstöd, svart",
    "83b2cf8b": "Träningsbänk med skivstångsställ, bensträckare och bicepspulpet",
    "a4bbe667": "Träningsbänk med skivstångsställ, bröstpress och benpress, vit",
    "18b94738": "Träningsbänk i trä med hantelfack och 6 ryggvinklar",
}

TITEL = {
    "8de3c3ef": "Träningsbänk 115 cm med bensträckare | 7 vinklar | Fyndplats",
    "7b818c3b": "Träningsbänk med ställning 98–122 cm | hopfällbar | Fyndplats",
    "8a0e05f4": "Träningsbänk 146 cm | tre lutningar och bukträning | Fyndplats",
    "b4961e6f": "Hopfällbar träningsbänk svart | justerbart ryggstöd | Fyndplats",
    "83b2cf8b": "Träningsbänk med skivstångsställ och bensträckare | Fyndplats",
    "a4bbe667": "Träningsbänk med skivstångsställ, vit | bröstpress | Fyndplats",
    "18b94738": "Träningsbänk i trä med hantelfack | 6 vinklar | Fyndplats",
}

META = {
    "8de3c3ef": ("Kompakt träningsbänk 115 cm med bensträckare och ryggstöd i "
                 "sju vinklar. Stålrörsstomme, fälls ihop till 32,5 cm bredd. "
                 "Max användarvikt 120 kg."),
    "7b818c3b": ("Plan träningsbänk med separat ställning i åtta höjder, "
                 "98–122 cm. Fälls ihop efter passet. Bänkdyna 110 × 26 cm."),
    "8a0e05f4": ("Träningsbänk 146 cm med ryggstöd i tre lägen, lårvalsar i "
                 "sju höjder och fotpedal i fyra. Max användarvikt 120 kg."),
    "b4961e6f": ("Hopfällbar träningsbänk i svart med ryggstöd i tre lägen och "
                 "svängbara armar i fyra. Tre motståndsnivåer, 120 kg."),
    "83b2cf8b": ("Träningsbänk med skivstångsställ, bensträckare och "
                 "bicepspulpet. 175 × 139 cm. Vikter och skivstång ingår inte."),
    "a4bbe667": ("Vit träningsbänk med skivstångsställ, bröstpress, benpress "
                 "och armstöd. 180 × 134 cm, max användarvikt 150 kg."),
    "18b94738": ("Träningsbänk i skiktlimmad träskiva med öppet hantelfack och "
                 "ryggstöd i sex vinklar. 110 × 35 cm, maxlast 120 kg."),
}

SOKORD = {
    "8de3c3ef": ["träningsbänk med bensträckare", "hopfällbar träningsbänk",
                 "justerbar träningsbänk 115 cm"],
    "7b818c3b": ["träningsbänk med ställning", "skivstångsställ hopfällbart",
                 "plan träningsbänk"],
    "8a0e05f4": ["träningsbänk med lutning", "sit up bänk", "bukbänk justerbar"],
    "b4961e6f": ["hopfällbar träningsbänk svart", "träningsbänk med butterfly",
                 "träningsbänk motståndsband"],
    "83b2cf8b": ["träningsbänk med skivstångsställ", "bänkpress hemma",
                 "träningsbänk med bensträckare"],
    "a4bbe667": ["träningsbänk vit", "träningsbänk med skivstångsställ",
                 "multibänk bröstpress"],
    "18b94738": ["träningsbänk i trä", "hantelbänk med förvaring",
                 "justerbar träningsbänk trä"],
}


INTRO = {
    "8de3c3ef":
        "En smal träningsbänk som tar 115 × 32,5 cm i golvet och ställs undan "
        "stående när passet är slut. Ryggstödet låses i sju vinklar, från "
        "nedåtlutat till nästan upprätt, och framtill sitter ett vadderat "
        "rullpar för bensträckningar och sit-ups. Stommen är av lackade "
        "stålrör och dynan har en kärna av skiktlimmad träskiva under skummet.",
    "7b818c3b":
        "Två delar som arbetar ihop: en plan bänk med 110 cm lång dyna och ett "
        "fristående ställ vars klykor ställs i åtta höjder mellan 98 och "
        "122 cm. Stället tar en stång på 25 mm och har viktpinnar nere vid "
        "fötterna. Bänkdynan lutar inte — den är plan och fast — och båda "
        "delarna fälls ihop var för sig mellan passen.",
    "8a0e05f4":
        "En bänk som lutar nedåt i stället för uppåt. Ryggstödet ställs plant, "
        "22,5 grader ned eller 45 grader ned för magövningar och nedåtlutad "
        "press. Lårkudden flyttas i sju höjder och fotpedalen i fyra, så att "
        "låsningen sitter rätt oavsett benlängd. Hela bänken väger 13,7 kg och "
        "lyfts undan utan hjälp.",
    "b4961e6f":
        "En hopfällbar träningsbänk som gör ett hörn av vardagsrummet till en "
        "styrkestation och sedan försvinner igen. Ryggstödet ställs i tre "
        "lägen – plant, lutande och nedåtlutat – och armarna svänger ut i fyra "
        "positioner för bröstöppningar och motståndsband. Stålramen tål 300 kg "
        "totalt och står på halkfria fötter. Bänken finns också i en röd version.",
    "83b2cf8b":
        "En hel träningsplats i ett: bänk med ryggstöd i tre lägen, "
        "skivstångsställ med klykor på båda sidor, bicepspulpet framtill och "
        "bensträckare med vadderade rullar vid foten. Ytan bänken tar är "
        "175 × 139 cm och totalhöjden är 127 cm. Vikter och "
        "skivstång ingår inte — bilderna visar hur bänken används.",
    "a4bbe667":
        "Bänken står i en vit stålram med skivstångsställ i sex höjder mellan "
        "107,5 och 130 cm. Ryggstödet lutar i tre lägen, armstödet för "
        "bicepscurl ställs i fyra höjder och framtill sitter en bensträckare. "
        "Max användarvikt är 150 kg och skivstångsstället tar 150 kg. "
        "Viktskivor och skivstång ingår inte.",
    "18b94738":
        "En bänk som får stå framme. Stommen är en låda i ljus, skiktlimmad "
        "träskiva med urtagna handtag i gavlarna och ett öppet fack där "
        "hantlarna vilar i formade urtag. Ryggstödet fälls upp i sex vinklar, "
        "från plant till upprätt, och när det ligger ned ser bänken ut som en "
        "möbel. Två motståndsband ingår.",
}

RUBRIK = {
    "8de3c3ef": "Egenskaper",
    "7b818c3b": "Bänken och stället",
    "8a0e05f4": "Egenskaper",
    "b4961e6f": "Egenskaper",
    "83b2cf8b": "Stationerna på bänken",
    "a4bbe667": "Stationerna på bänken",
    "18b94738": "Egenskaper",
}

PUNKTER = {
    "8de3c3ef": [
        "Ryggstöd i sju vinklar, från nedåtlutat till nästan upprätt.",
        "Vadderat rullpar framtill för bensträckningar och sit-ups.",
        "Stomme av lackade stålrör.",
        "Dyna med kärna av skiktlimmad träskiva, EPE-skum och klädsel i "
        "PVC-konstläder.",
        "Sittdyna 36 × 27 cm, ryggdyna 67 × 27 cm.",
        "Fälls ihop till 32,5 × 22 × 75 cm och ställs undan stående.",
        "Max användarvikt 120 kg. Bänkens totala kapacitet är 300 kg.",
    ],
    "7b818c3b": [
        "Plan bänkdyna, 110 × 26 cm, 43 cm över golvet.",
        "Fristående ställ med klykor i åtta höjder, 98–122 cm.",
        "Passar stänger med 25 mm diameter.",
        "Viktpinnar nere vid ställets fötter, 30 kg per plats.",
        "Bänk och ställ fälls ihop var för sig; hopfällt mäter enheten "
        "73 × 55 × 134 cm.",
        "Stålram med dyna i konstläder.",
    ],
    "8a0e05f4": [
        "Ryggstöd i tre lägen: plant, 22,5 grader ned och 45 grader ned.",
        "Lårkudde i sju höjder och fotpedal i fyra.",
        "Ryggdyna 98 × 32 cm, 5 cm tjock. Bukdyna 30 × 16 cm, 7,5 cm tjock.",
        "Stomme av stål; dynor i PVC-konstläder över skum och EVA.",
        "Vikt 13,7 kg — lyfts undan utan hjälp.",
        "Max användarvikt 120 kg. Bänkens totala kapacitet är 300 kg.",
    ],
    "b4961e6f": [
        "Ryggstöd i tre lägen: plant, lutande och nedåtlutat.",
        "Justerbara armar i fyra lägen med fästen för motståndsband.",
        "Tre motståndsnivåer.",
        "Sits i fyra lager – PVC-konstläder, skum, TPE och kärna av "
        "skiktlimmad träskiva.",
        "Stålram med halkfria fötter.",
        "Fälls ihop för förvaring mellan passen.",
        "Två motståndsband ingår.",
        "Max användarvikt 120 kg. Bänkens totala kapacitet är 300 kg.",
    ],
    "83b2cf8b": [
        "Ryggstöd i tre lägen, låst med stift i tre hål.",
        "Skivstångsställ med klykor på båda sidor.",
        "Bicepspulpet 49 × 27 cm, 74–86 cm över golvet.",
        "Bensträckare med vadderade rullar.",
        "Viktpelare 25 cm lång, 2,5 cm i diameter.",
        "Sitsdynan tål 200 kg. Max användarvikt är 100 kg.",
        "Vikter och skivstång ingår inte.",
    ],
    "a4bbe667": [
        "Skivstångsställ i sex höjder, 107,5–130 cm, 60 cm mellan klykorna.",
        "Ryggstöd i tre lutningslägen.",
        "Armstöd för bicepscurl i fyra höjder, 46–61 cm över golvet.",
        "Bensträckare framtill, för upp till 25 kg.",
        "Bicepsstången tar upp till 25 kg.",
        "Vit stålram med dynor i svart konstläder.",
        "Max användarvikt 150 kg. Skivstångsstället tar 150 kg och bänken "
        "300 kg totalt.",
        "Viktskivor och skivstång ingår inte.",
    ],
    "18b94738": [
        "Ryggstöd i sex vinklar: 90, 110, 125, 145, 165 och 180 grader.",
        "Öppet fack 27 × 27 cm med formade urtag för hantlar.",
        "Sits 33 × 33 cm, ryggdyna 67 × 33 cm i svart konstläder.",
        "Stomme i skiktlimmad träskiva med urtagna handtag i gavlarna.",
        "Höjden går från 43 cm med ryggstödet nedfällt till 107 cm upprätt.",
        "Två motståndsband ingår.",
        "Maxlast 120 kg.",
    ],
}


ANVAND_RUBRIK = {
    "8de3c3ef": "Plats och förvaring",
    "7b818c3b": "Plats och förvaring",
    "8a0e05f4": "Vad du tränar på den",
    "b4961e6f": "Plats och förvaring",
    "83b2cf8b": "Vad som behövs utöver bänken",
    "a4bbe667": "Vad som behövs utöver bänken",
    "18b94738": "Bänken som möbel",
}

ANVAND = {
    "8de3c3ef":
        "Uppfälld står bänken på 115 × 32,5 cm, ungefär ytan av en smal "
        "bokhylla lagd på golvet. Hopfälld reser den sig till 75 cm och tar "
        "22 cm på djupet, vilket räcker för att få plats bakom en dörr eller i "
        "en garderob. Räkna med en fri yta runt om när du tränar med hantlar — "
        "armarna behöver mer utrymme än bänken.",
    "7b818c3b":
        "De två delarna står fritt från varandra, så avståndet mellan dem "
        "sätter du själv efter stångens längd. Hopfällda mäter de tillsammans "
        "73 × 55 × 134 cm och kan ställas stående mot en vägg. Golvet bör vara "
        "plant: ett ställ som står snett flyttar lasten till en klyka.",
    "8a0e05f4":
        "De tre ryggstödslägena avgör vilken övning bänken gör. Plant läge "
        "fungerar för press och rodd med hantlar, 22,5 grader nedåt för sneda "
        "magövningar och 45 grader nedåt för raka sit-ups och nedåtlutad "
        "press. Lårkudden låser fötterna i sju höjder, vilket är det som gör "
        "att magövningarna går att genomföra utan hjälp.",
    "b4961e6f":
        "Bänken fälls ihop mellan passen och ställs undan mot en vägg. "
        "Armarna svänger ut åt sidorna när de används, så håll fri yta runt "
        "bänken under passet. Golvet bör vara plant — de halkfria fötterna "
        "håller bänken på plats, men bara på ett jämnt underlag.",
    "83b2cf8b":
        "Bänken levereras utan vikter och utan skivstång. Stället tar en "
        "vanlig skivstång, och viktpelaren vid bensträckaren är 2,5 cm i "
        "diameter — det måttet avgör vilka viktskivor som passar. Kontrollera "
        "hålet i skivorna du redan har innan du beställer nya. Bilderna visar "
        "bänken i användning med vikter som köps separat.",
    "a4bbe667":
        "Viktskivor och skivstång ingår inte. Skivstångsstället tar 150 kg och "
        "bänken 300 kg totalt, men din egen vikt får vara högst 150 kg — "
        "mellanskillnaden är utrymmet för stången. Bensträckaren och "
        "bicepsstången är byggda för 25 kg vardera, alltså lättare laster än "
        "stället.",
    "18b94738":
        "Med ryggstödet nedfällt är bänken 43 cm hög och 110 cm lång, alltså "
        "ungefär måtten på en sängbänk. Den ljusa träskivan och de svarta "
        "dynorna gör att den tål att stå framme i ett vardagsrum mellan "
        "passen, och hantlarna ligger synliga i facket i stället för i en "
        "låda. Ställ den inte i fuktiga utrymmen — skiktlimmad träskiva "
        "sväller om den blir blöt.",
}

# ☠️ Korslänkarna ligger FÖRE `Tekniska specifikationer` i `bygg()`. Butikens
#    flikdelare är en allowlist: allt EFTER en rubrikträff hamnar i den fliken.
KORSLANK = {
    "8de3c3ef": [(SLUG["8a0e05f4"], "en längre bänk med tre lutningslägen"),
                 (SLUG["7b818c3b"], "en bänk med eget skivstångsställ")],
    "7b818c3b": [(SLUG["83b2cf8b"], "en bänk där stället sitter ihop med bänken"),
                 (SLUG["8de3c3ef"], "en smalare bänk utan ställ")],
    "8a0e05f4": [(SLUG["8de3c3ef"], "en smalare bänk som fälls ihop"),
                 (SLUG["b4961e6f"], "en hopfällbar bänk med svängbara armar")],
    "b4961e6f": [(PUB_ROD, "samma bänk i rött"),
                 (SLUG["8a0e05f4"], "en bänk med tre nedåtlutande lägen")],
    "83b2cf8b": [(SLUG["a4bbe667"], "en större bänk med bröstpress och benpress"),
                 (SLUG["7b818c3b"], "ett fristående ställ med plan bänk")],
    "a4bbe667": [(SLUG["83b2cf8b"], "en mindre bänk med bicepspulpet"),
                 (SLUG["18b94738"], "en bänk i trä med hantelfack")],
    "18b94738": [(SLUG["8de3c3ef"], "en hopfällbar bänk i stål"),
                 (SLUG["a4bbe667"], "en bänk med skivstångsställ")],
}

KORS_INGRESS = {p: "Andra bänkar i samma serie" for p in SLUG}
KORS_INGRESS["b4961e6f"] = "Modellen finns i två färger"

KORS_TEXT = {
    "8de3c3ef": "Behöver du mer utrymme eller ett ställ för skivstång, se",
    "7b818c3b": "Vill du ha stället inbyggt eller en mindre bänk, se",
    "8a0e05f4": "Ska bänken ta mindre plats eller ha svängbara armar, se",
    "b4961e6f": "Bänken finns också i rött, och en närliggande modell är",
    "83b2cf8b": "Jämför gärna med",
    "a4bbe667": "Jämför gärna med",
    "18b94738": "Vill du ha en bänk i stål i stället, se",
}


SPEC = {
    "8de3c3ef": [
        ("Mått", "115 × 32,5 × 43 cm (L × B × H)"),
        ("Hopfälld", "32,5 × 22 × 75 cm"),
        ("Sittdyna", "36 × 27 cm"),
        ("Ryggdyna", "67 × 27 cm"),
        ("Ryggstöd", "7 vinklar"),
        ("Maxlast (användare)", "120 kg"),
        ("Total kapacitet", "300 kg"),
        ("Material", "stålrör, skiktlimmad träskiva, EPE-skum och "
                     "PVC-konstläder"),
        ("Färg", "svart med blå detaljer"),
        ("Paketmått", "80 × 37 × 29 cm"),
        ("Fraktvikt", "10 kg"),
        ("Ingår", "bänk och bruksanvisning"),
        ("Montering", "krävs"),
    ],
    "7b818c3b": [
        ("Mått", "140 × 73 cm, ställets höjd 98–122 cm"),
        ("Hopfällt", "73 × 55 × 134 cm"),
        ("Bänkdyna", "110 × 26 cm, 43 cm över golvet"),
        ("Ställets höjd", "8 lägen mellan 98 och 122 cm"),
        ("Stångdiameter", "25 mm"),
        ("Bänkens kapacitet", "150 kg"),
        ("Ställets kapacitet", "100 kg"),
        ("Per viktplats", "30 kg"),
        ("Material", "stål och konstläder"),
        ("Färg", "svart och grå"),
        ("Paketmått", "113 × 36 × 12 cm"),
        ("Fraktvikt", "21 kg"),
        ("Ingår", "bänk med ställ och bruksanvisning"),
        ("Montering", "krävs"),
    ],
    "8a0e05f4": [
        ("Mått", "146 × 64 × 73,5–85 cm (L × B × H)"),
        ("Ryggdyna", "98 × 32 cm, 5 cm tjock"),
        ("Bukdyna", "30 × 16 cm, 7,5 cm tjock"),
        ("Ryggstöd", "3 lägen: plant, 22,5 grader ned och 45 grader ned"),
        ("Lårkudde", "7 höjder"),
        ("Fotpedal", "4 lägen"),
        ("Maxlast (användare)", "120 kg"),
        ("Total kapacitet", "300 kg"),
        ("Material", "stål, PVC-konstläder och EVA"),
        ("Färg", "svart med röda detaljer"),
        ("Vikt", "13,7 kg"),
        ("Paketmått", "111,5 × 35,5 × 23 cm"),
        ("Fraktvikt", "16,7 kg"),
        ("Ingår", "bänk och monteringsanvisning"),
        ("Montering", "krävs"),
    ],
    "b4961e6f": [
        ("Mått med armarna utfällda", "135 × 130 × 107 cm"),
        ("Sits", "32 × 29 × 42,5 cm"),
        ("Ryggstöd", "3 lägen"),
        ("Armar", "4 lägen, 3 motståndsnivåer"),
        ("Maxlast (användare)", "120 kg"),
        ("Total kapacitet", "300 kg"),
        ("Material", "stål, skiktlimmad träskiva, TPE, skum och "
                     "PVC-konstläder"),
        ("Färg", "svart"),
        ("Paketmått", "115 × 24 × 35,5 cm"),
        ("Fraktvikt", "16,7 kg"),
        ("Ingår", "bänk, två motståndsband och bruksanvisning"),
        ("Montering", "krävs"),
    ],
    "83b2cf8b": [
        ("Mått", "175 × 139 × 127 cm (L × B × H)"),
        ("Ryggdyna", "74 × 26,4 cm"),
        ("Sits", "30 × 26,4 cm"),
        ("Bicepspulpet", "49 × 27 cm, 74–86 cm över golvet"),
        ("Ryggstöd", "3 lägen"),
        ("Viktpelare", "25 cm lång, 2,5 cm i diameter, tar 100 kg"),
        ("Maxlast (användare)", "100 kg"),
        ("Sitsdynans kapacitet", "200 kg"),
        ("Material", "stål och plast"),
        ("Färg", "svart och rött"),
        ("Paketmått", "105 × 42 × 24 cm"),
        ("Fraktvikt", "26 kg"),
        ("Ingår", "bänk och bruksanvisning — vikter och skivstång ingår inte"),
        ("Montering", "krävs"),
    ],
    "a4bbe667": [
        ("Mått", "180 × 134 × 113–136 cm (L × B × H)"),
        ("Sits", "32 × 30 cm"),
        ("Ryggdyna", "76 × 25 cm"),
        ("Armstödsdyna", "24 × 40 cm"),
        ("Armstöd", "45 × 30 cm, 46–61 cm över golvet"),
        ("Skivstångsställ", "6 höjder mellan 107,5 och 130 cm, 60 cm brett"),
        ("Ryggstöd", "3 lutningslägen"),
        ("Maxlast (användare)", "150 kg"),
        ("Skivstångsställets kapacitet", "150 kg"),
        ("Bänkens totala kapacitet", "300 kg"),
        ("Bensträckare", "25 kg"),
        ("Bicepsstång", "25 kg"),
        ("Material", "stål och konstläder"),
        ("Färg", "vit ram med svarta dynor"),
        ("Paketmått", "115 × 50 × 19 cm"),
        ("Fraktvikt", "28 kg"),
        ("Ingår", "bänk och bruksanvisning — viktskivor och skivstång "
                  "ingår inte"),
        ("Montering", "krävs"),
    ],
    "18b94738": [
        ("Mått", "110 × 35 × 43–107 cm (L × B × H)"),
        ("Sits", "33 × 33 cm"),
        ("Ryggdyna", "67 × 33 cm"),
        ("Ryggstöd", "6 vinklar: 90, 110, 125, 145, 165 och 180 grader"),
        ("Fack", "27 × 27 cm, fri höjd 25 cm"),
        ("Maxlast", "120 kg"),
        ("Material", "skiktlimmad träskiva och konstläder"),
        ("Färg", "naturträ med svarta dynor"),
        ("Paketmått", "115 × 43 × 39 cm"),
        ("Fraktvikt", "24 kg"),
        ("Ingår", "bänk, två motståndsband och handbok"),
        ("Montering", "krävs"),
    ],
}

_STIFT = ("Kontrollera att låsstiften har snäppt i innan du lastar bänken — "
          "ett halvt insatt stift ger efter under vikt. ")
_SVETT = ("Torka av dynan efter passet; svett bryter ner konstläder över tid "
          "även när ytan tål det. ")
_SKRUV = ("Dra åt skruvarna i ramen efter de första passen och sedan med "
          "några månaders mellanrum.")

SKOTSEL = {
    "8de3c3ef": _STIFT + _SVETT + "Fäll ihop bänken först när ryggstödet "
        "ligger plant, annars tar rullarna i stommen. " + _SKRUV,
    "7b818c3b": "Kontrollera att båda klykorna står på samma hål innan du "
        "lägger upp stången — ett halvt hål i skillnad lutar stången åt ena "
        "hållet. " + _SVETT + _SKRUV,
    "8a0e05f4": _STIFT + "Ställ in lårkudden så att den ligger an mot låren "
        "och inte mot knäskålarna innan du börjar med magövningar. " + _SVETT
        + _SKRUV,
    "b4961e6f": _STIFT + _SVETT + "Kontrollera motståndsbanden före varje pass "
        "och byt ut dem så fort gummit har sprickor. " + _SKRUV,
    "83b2cf8b": _STIFT + "Lås alltid viktskivorna med låskragar innan du "
        "lyfter — en skiva som glider åt ena hållet vrider stången. " + _SVETT
        + _SKRUV,
    "a4bbe667": _STIFT + "Lägg upp stången på samma hålnummer på båda sidor, "
        "och lås viktskivorna med låskragar. " + _SVETT + _SKRUV,
    "18b94738": "Torka av träytan med en fuktig trasa och torka efter — "
        "skiktlimmad träskiva sväller om vatten blir stående. " + _SVETT
        + "Lyft hantlarna i och ur facket i stället för att släppa ner dem; "
        "en tappad hantel märker träet. " + _SKRUV,
}


FAQ = {
    "8de3c3ef": [
        ("Hur mycket tål bänken?",
         "Maximal användarvikt är 120 kg. Bänkens totala kapacitet är 300 kg, "
         "och mellanskillnaden är utrymmet för hantlar och stång. Det är alltså "
         "120 kg som gäller för dig som tränar."),
        ("Hur stor är den hopfälld?",
         "32,5 × 22 × 75 cm. Hopfälld står bänken upp och tar ungefär lika stor "
         "golvyta som en pall."),
        ("Vad används rullarna framtill till?",
         "De låser fötterna vid sit-ups och fungerar som stöd vid "
         "bensträckningar."),
        ("Vilken färg är bänken?",
         "Svart med blå detaljer."),
    ],
    "7b818c3b": [
        ("Går ryggstödet att luta?",
         "Nej. Bänkdynan är plan och fast. De åtta lägena hör till ställets "
         "höjd, inte till ryggstödet."),
        ("Hur mycket tål bänken?",
         "Bänkens angivna kapacitet är 150 kg, ställets 100 kg och varje "
         "viktplats nere vid foten 30 kg. Någon separat maxvikt för användaren "
         "anges inte, så räkna din egen vikt plus vikterna inom bänkens 150 kg."),
        ("Vilken stång passar i klykorna?",
         "Klykorna är gjorda för stänger med 25 mm diameter."),
        ("Hur stor är den hopfälld?",
         "Bänken och stället mäter tillsammans 73 × 55 × 134 cm hopfällda och "
         "kan ställas stående mot en vägg."),
    ],
    "8a0e05f4": [
        ("Hur mycket tål bänken?",
         "Maximal användarvikt är 120 kg. Bänkens totala kapacitet är 300 kg, "
         "och mellanskillnaden är utrymmet för hantlar."),
        ("Vilka lägen har ryggstödet?",
         "Tre: plant, 22,5 grader nedåt och 45 grader nedåt. Bänken lutar alltså "
         "nedåt och inte uppåt — den är byggd för magövningar och nedåtlutad "
         "press."),
        ("Vad väger bänken?",
         "13,7 kg. Fraktvikten på 16,7 kg räknar in emballaget."),
        ("Vilken färg är bänken?",
         "Svart med röda detaljer."),
    ],
    "b4961e6f": [
        ("Hur mycket tål bänken?",
         "300 kg totalt, och maximal användarvikt är 120 kg. Mellanskillnaden "
         "är utrymmet för hantlar och stång."),
        ("Vilka lägen har ryggstödet?",
         "Tre: plant, lutande och nedåtlutat. Vinkeln avgör vilken del av "
         "bröstet övningen träffar."),
        ("Hur stor är den hopfälld?",
         "Hopfällda mått anges inte. Utfälld med armarna ute mäter bänken "
         "135 × 130 × 107 cm."),
        ("Ingår hantlar eller skivstång?",
         "Nej. Två motståndsband ingår, men vikterna på produktbilderna köps "
         "separat."),
        ("Finns bänken i fler färger?",
         "Ja, den finns även i rött. Länken står högre upp på sidan."),
    ],
    "83b2cf8b": [
        ("Hur mycket tål bänken?",
         "Maximal användarvikt är 100 kg. Sitsdynans angivna kapacitet är "
         "200 kg och viktpelaren tar 100 kg, men det är användarvikten som "
         "sätter gränsen för dig som tränar."),
        ("Ingår vikter eller skivstång?",
         "Nej. Bänken levereras med ställ, bicepspulpet och bensträckare, men "
         "utan viktskivor och utan stång. Bilderna visar bänken i användning "
         "med vikter som köps separat."),
        ("Vilka viktskivor passar bensträckaren?",
         "Viktpelaren är 2,5 cm i diameter. Mät hålet i de skivor du redan har "
         "innan du köper till."),
        ("Vad är bicepspulpeten?",
         "Den lutande dynan framtill som armarna vilar på vid bicepscurl. Den "
         "mäter 49 × 27 cm och sitter 74–86 cm över golvet."),
    ],
    "a4bbe667": [
        ("Hur mycket tål bänken?",
         "Maximal användarvikt är 150 kg. Skivstångsstället tar 150 kg och "
         "bänken 300 kg totalt; mellanskillnaden är utrymmet för stång och "
         "skivor."),
        ("Ingår viktskivor eller skivstång?",
         "Nej. Leveransen är bänk och bruksanvisning. Vikterna på "
         "produktbilderna köps separat."),
        ("Hur högt går skivstångsstället?",
         "Sex lägen mellan 107,5 och 130 cm. Avståndet mellan klykorna är "
         "60 cm."),
        ("Hur mycket tål bensträckaren?",
         "25 kg, och bicepsstången likaså. Båda är byggda för lättare laster "
         "än stället."),
    ],
    "18b94738": [
        ("Hur mycket tål bänken?",
         "Maxlast är 120 kg. Till skillnad från bänkarna med två angivna "
         "gränser finns här bara en enda siffra, så räkna din egen vikt plus "
         "hantlarna du håller inom de 120 kilona."),
        ("Vad är stommen gjord av?",
         "Skiktlimmad träskiva — flera tunna träskikt limmade i kors. Kanten "
         "syns på närbilderna. Dynorna är klädda i svart konstläder."),
        ("Vad rymmer facket?",
         "Facket är 27 × 27 cm med 25 cm fri höjd och har formade urtag där "
         "hantlarna vilar. Hantlar ingår inte."),
        ("Går ryggstödet att fälla helt plant?",
         "Ja. 180 grader är plant läge, och då är bänken 43 cm hög."),
    ],
}


def _p(t):
    return "<p>" + t + "</p>"


def bygg(pid):
    """Bygger plainDescription.

    ☠️ ORDNINGEN ÄR INTE FRI. Butikens flikdelare är en allowlist; allt EFTER
       en träff hamnar i den fliken. Korslänkarna måste ligga FÖRE
       `Tekniska specifikationer`.
    """
    d = [_p(INTRO[pid])]

    d.append("<h2>" + RUBRIK[pid] + "</h2>")
    d.append("<ul>" + "".join("<li>" + x + "</li>" for x in PUNKTER[pid]) + "</ul>")

    d.append("<h2>" + ANVAND_RUBRIK[pid] + "</h2>")
    d.append(_p(ANVAND[pid]))

    d.append("<h2>" + KORS_INGRESS[pid] + "</h2>")
    # ☠️ ABSOLUT URL, ALDRIG ROTRELATIV: "/produkt/…" skrivs om av Wix till
    #    "https:/produkt/…" — ETT snedstreck, alltså död länk.
    lankar = ", ".join('<a href="{}/produkt/{}">{}</a>'.format(BAS, s, t)
                       for s, t in KORSLANK[pid])
    d.append(_p(KORS_TEXT[pid] + " " + lankar + "."))

    d.append("<h2>Tekniska specifikationer</h2>")
    d.append("<ul>" + "".join("<li><strong>{}:</strong> {}</li>".format(e, v)
                              for e, v in SPEC[pid]) + "</ul>")

    d.append("<h2>Användning och skötsel</h2>")
    d.append(_p(SKOTSEL[pid]))

    d.append("<h2>Vanliga frågor</h2>")
    for f, s in FAQ[pid]:
        d.append("<p><strong>" + f + "</strong></p>")
        d.append(_p(s))

    return "".join(d)
