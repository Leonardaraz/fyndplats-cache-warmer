# -*- coding: utf-8 -*-
"""Runda 131 — tre hundtrappor för bil (färgsyskon) och fyra möbelramper.

☠️ TRAPPA OCH RAMP ÄR OLIKA VAROR FÖR OLIKA HUNDAR, och rundan innehåller
   båda. En ramp rekommenderas vid ledbesvär just för att den slipper
   stegen. Att sälja en trappa som ramp skickar fel vara till den kund som
   behöver skillnaden mest — därför står produkttypen i varje namn, varje
   titel och varje slug, och därför säger biltrapporna rakt ut att en ramp
   finns som alternativ.

☠️ MAXLASTEN STÅR I NAMNET PÅ ALLA SJU. Den spänner 15–50 kg på varor som
   ser likadana ut på ett kontaktark, och den avgör om kunden kan använda
   varan alls. Runbokens regel 15: en bärighet är ett säkerhetspåstående.

☠️ BILTRAPPAN TAR 25 KG — OCH LEVERANTÖRENS EGEN GRAFIK SÄGER EMOT SIG
   SJÄLV. Bild 3 bär både "GEEIGNET FÜR MITTELGROSSE & GROSSE HUNDE" och
   "Maximales Gewicht < 25 kg", och illustrerar med raser som normalt väger
   20–38 kg. Sidan skriver 25 kg, beskriver aldrig varan som "för stora
   hundar", och länkar till de publicerade ramperna som bär 60 och 90 kg.
   Bilden är dessutom borttagen (Steg 4).

☠️ `935cd17b` ANGER TVÅ MAXLASTER för samma konstruktion: `Belastbarkeit:
   75 kg` och `Empfohlenes Gewicht: Nicht mehr als 40 kg`, i SAMMA block.
   Den konservativa gäller (runda 66:s regel) och 75 nämns inte alls.

⚠️ MONTERING STÅR INTE I NÅGON AV DE SJU KÄLLORNA. Ingen sida påstår
   därför något om den. Det som står är vad `Lieferumfang` listar.

⚠️ TRÄSLAGET: `Kiefernholz` (furu) på tre av fyra ramper är entydigt och
   skrivs ut. `15e4c7a7` säger `Mehrschichtenplatte, Tannenholz` — lamellträ
   och gran — och båda skrivs, eftersom de beskriver olika delar.
"""

NAMN = {
    "2166c50f": "Hundtrappa till bil 154 cm, grå – tio steg och fyra halklister, max 25 kg",
    "9a513e9a": "Hundtrappa till bil 154 cm, brun – tio steg och fyra halklister, max 25 kg",
    "c2be0f30": "Hundtrappa till bil 154 cm, svart – tio steg och fyra halklister, max 25 kg",
    "ed1ea8dc": "Hundramp till soffa 47,5 cm – fyra höjder, fälls till 5 cm, max 15 kg",
    "15e4c7a7": "Hundramp 90 cm med halklister – fast lutning, 45 cm hög, max 40 kg",
    "935cd17b": "Hundramp till hög säng 61 cm – fyra lägen i furu, max 40 kg",
    "1b64abde": "Hundramp med plattform 125 cm – 35,5 cm hög, max 50 kg",
}

SLUG = {
    "2166c50f": "hundtrappa-bil-154-gra",
    "9a513e9a": "hundtrappa-bil-154-brun",
    "c2be0f30": "hundtrappa-bil-154-svart",
    "ed1ea8dc": "hundramp-soffa-47-cm",
    "15e4c7a7": "hundramp-45-cm-40-kg",
    "935cd17b": "hundramp-sang-61-cm",
    "1b64abde": "hundramp-med-plattform-50-kg",
}

# ☠️ RÄKNADE ur husregeln (lib/import/sku.ts via grindar.sku_bas), aldrig
#    skrivna för hand. FYRA av de sju utkasten bar redan en DELAD SKU:
#    `2166c50f` + `9a513e9a` delade `FP-hunderampe-auto-klappbar`, och
#    `935cd17b` + `1b64abde` delade `FP-haustierrampe-mit`.
#
#    Det uppenbara sluggförslaget återinförde krocken: `hundtrappa-bil-154-
#    cm-gra` är 25 tecken, PRODUCT_PART_MAX är 24, och kapningen tar bort
#    FÄRGEN — alla tre syskonen hade blivit `FP-hundtrappa-bil-154-cm`.
#    Lösningen är runbokens: behåll den SÄRSKILJANDE svansen, kapa mitten.
#    "cm" ströks ur sluggen och då ryms färgen på alla tre.
#
#    Verifierat mot HELA katalogen 2026-09-11: 5 649 produkter, 57 sidor,
#    noll av de sju SKU:erna och noll av de sju sluggarna redan tagna.
SKU = {
    "2166c50f": "FP-hundtrappa-bil-154-gra",
    "9a513e9a": "FP-hundtrappa-bil-154-brun",
    "c2be0f30": "FP-hundtrappa-bil-154-svart",
    "ed1ea8dc": "FP-hundramp-soffa-47-cm",
    "15e4c7a7": "FP-hundramp-45-cm-40-kg",
    "935cd17b": "FP-hundramp-sang-61-cm",
    "1b64abde": "FP-hundramp-plattform-50-kg",
}

TITEL = {
    "2166c50f": "Hundtrappa till bil 154 cm, grå – max 25 kg | Fyndplats",
    "9a513e9a": "Hundtrappa till bil 154 cm, brun – max 25 kg | Fyndplats",
    "c2be0f30": "Hundtrappa till bil 154 cm, svart – max 25 kg | Fyndplats",
    "ed1ea8dc": "Hundramp till soffa, fyra höjder, max 15 kg | Fyndplats",
    "15e4c7a7": "Hundramp 90 cm, fast lutning, max 40 kg | Fyndplats",
    "935cd17b": "Hundramp till hög säng, 61 cm, max 40 kg | Fyndplats",
    "1b64abde": "Hundramp med plattform, 35,5 cm hög | Fyndplats",
}

META = {
    "2166c50f": "Hopfällbar hundtrappa till bilen, 154 cm med tio steg och fyra "
                "halklister. Fälls till 79 cm och når 82 cm i höjd. Bär 25 kg. Grå.",
    "9a513e9a": "Hopfällbar hundtrappa till bilen, 154 cm med tio steg och fyra "
                "halklister. Fälls till 79 cm och når 82 cm i höjd. Bär 25 kg. Brun.",
    "c2be0f30": "Hopfällbar hundtrappa till bilen, 154 cm med tio steg och fyra "
                "halklister. Fälls till 79 cm och når 82 cm i höjd. Bär 25 kg. Svart.",
    "ed1ea8dc": "Hopfällbar hundramp i furu med matta över hela gångytan. Fyra "
                "lägen mellan 24 och 47,5 cm. Fälls till 5 cm tjocklek. Bär 15 kg.",
    "15e4c7a7": "Hundramp i lamellträ och gran med tvärgående halklister var "
                "tionde centimeter. 90 cm lång, 45 cm hög, fast lutning. Bär 40 kg.",
    "935cd17b": "Hundramp i furu som ställs i fyra lägen mellan 26 och 61 cm — "
                "för höga sängar. Fälls till 7 cm tjocklek. Bär upp till 40 kg.",
    "1b64abde": "Hundramp med en plan plattform på 29,5 × 30 cm högst upp. "
                "Ramplutningen är 89 cm lång och 40 cm bred. 35,5 cm hög, bär 50 kg.",
}

SOKORD = {
    "2166c50f": ["hundtrappa bil", "hopfällbar hundtrappa",
                 "hundtrappa till bil grå", "hundtrappa bagagelucka"],
    "9a513e9a": ["hundtrappa bil", "hopfällbar hundtrappa",
                 "hundtrappa till bil brun", "hundtrappa bagagelucka"],
    "c2be0f30": ["hundtrappa bil", "hopfällbar hundtrappa",
                 "hundtrappa till bil svart", "hundtrappa bagagelucka"],
    "ed1ea8dc": ["hundramp", "hundramp soffa", "hopfällbar hundramp",
                 "hundramp i trä"],
    "15e4c7a7": ["hundramp", "hundramp med halklister", "husdjursramp",
                 "hundramp 40 kg"],
    "935cd17b": ["hundramp", "hundramp säng", "höjdjusterbar hundramp",
                 "hundramp i furu"],
    "1b64abde": ["hundramp", "hundramp med plattform", "hundramp säng",
                 "husdjursramp"],
}

INTRO = {
    "2166c50f":
        "En hopfällbar trappa som ställs mot bakluckan så hunden kan gå in i "
        "bilen på egna ben. Tio steg med plana trampytor, fyra gula "
        "halklister och en plattform högst upp som vilar mot lastkanten. "
        "Utfälld är den 154 centimeter lång och 40 centimeter bred; hopfälld "
        "blir den 79 centimeter. Den här är grå.",
    "9a513e9a":
        "En hopfällbar trappa som ställs mot bakluckan så hunden kan gå in i "
        "bilen på egna ben. Tio steg med plana trampytor, fyra gula "
        "halklister och en plattform högst upp som vilar mot lastkanten. "
        "Utfälld är den 154 centimeter lång och 40 centimeter bred; hopfälld "
        "blir den 79 centimeter. Den här är brun.",
    "c2be0f30":
        "En hopfällbar trappa som ställs mot bakluckan så hunden kan gå in i "
        "bilen på egna ben. Tio steg med plana trampytor, fyra gula "
        "halklister och en plattform högst upp som vilar mot lastkanten. "
        "Utfälld är den 154 centimeter lång och 40 centimeter bred; hopfälld "
        "blir den 79 centimeter. Den här är svart.",
    "ed1ea8dc":
        "En ramp i furu med en svart matta över hela gångytan. Stödbenet "
        "hakas i fyra lägen, så ramptoppen hamnar på 24/32,5/40/47,5 cm och "
        "lutningen blir 15/22/28/35°. Fälld ihop är den 5 centimeter tjock "
        "och 80 centimeter lång, alltså tunn nog att ställa bakom en soffa "
        "mellan gångerna.",
    "15e4c7a7":
        "En ramp med fast lutning och en grå matta som löper sammanhängande "
        "hela vägen upp. Tvärgående trälister ligger med tio centimeters "
        "mellanrum och ger tassarna något att ta spjärn mot i uppförsbacken. "
        "Sidan är en hel skiva i stället för ett stödben, så lutningen är "
        "given: 90 centimeter i längd och 45 centimeter i höjd.",
    "935cd17b":
        "En ramp för höga möbler. Stödbenet ger fyra lägen: 26/39/50/61 cm, "
        "alltså tillräckligt för en säng med hög "
        "bäddhöjd eller en soffa med tjocka dynor. Gångytan är 40 centimeter "
        "bred och klädd i mörk textil; sidostyckena är i furu och lämnade i "
        "träfärg.",
    "1b64abde":
        "En ramp med en plan plattform högst upp i stället för en spetsig "
        "kant. Plattformen mäter 29,5 × 30 centimeter, så hunden kan stanna "
        "där och vända innan den går ner. Själva lutningen är 89 centimeter "
        "lång och 40 centimeter bred, hela möbeln 125 centimeter, och "
        "högsta punkten ligger på 35,5 centimeter.",
}

RUBRIK = {
    "2166c50f": "Tio steg, inte en lutande yta",
    "9a513e9a": "Tio steg, inte en lutande yta",
    "c2be0f30": "Tio steg, inte en lutande yta",
    "ed1ea8dc": "Fyra lägen, och mattan täcker hela ytan",
    "15e4c7a7": "Listerna sitter tio centimeter isär",
    "935cd17b": "26 till 61 centimeter i fyra steg",
    "1b64abde": "Plattformen är det som skiljer den från en vanlig ramp",
}

PUNKTER = {
    "2166c50f": [
        "Tio steg med plana trampytor, 34,5 × 8 centimeter var",
        "Fyra halklister i gummi, 22,8 × 5 centimeter",
        "Fälls på mitten till 79 × 40 × 13 centimeter",
        "Når som högst 82 centimeter — mät din lastkant först",
        "Bär upp till 25 kilo",
    ],
    "9a513e9a": [
        "Tio steg med plana trampytor, 34,5 × 8 centimeter var",
        "Fyra halklister i gummi, 22,8 × 5 centimeter",
        "Fälls på mitten till 79 × 40 × 13 centimeter",
        "Når som högst 82 centimeter — mät din lastkant först",
        "Bär upp till 25 kilo",
    ],
    "c2be0f30": [
        "Tio steg med plana trampytor, 34,5 × 8 centimeter var",
        "Fyra halklister i gummi, 22,8 × 5 centimeter",
        "Fälls på mitten till 79 × 40 × 13 centimeter",
        "Når som högst 82 centimeter — mät din lastkant först",
        "Bär upp till 25 kilo",
    ],
    "ed1ea8dc": [
        "Fyra höjder: 24/32,5/40/47,5 centimeter",
        "Fyra lutningar: 15/22/28/35 grader",
        "Matta över hela gångytan, 35 centimeter bred",
        "Fälls till 5 centimeters tjocklek",
        "Bär upp till 15 kilo",
    ],
    "15e4c7a7": [
        "Fast lutning: 90 centimeter lång, 45 centimeter hög",
        "Tvärgående halklister med 10 centimeters mellanrum",
        "Gångyta 40 centimeter bred, klädd i grå textil",
        "Hel sidoskiva i stället för stödben",
        "Bär upp till 40 kilo",
    ],
    "935cd17b": [
        "Fyra höjder: 26/39/50/61 centimeter",
        "Gångyta 40 centimeter bred i mörk textil",
        "Sidostycken i furu, lämnade i träfärg",
        "Fälls till 7 centimeters tjocklek, 100 centimeter lång",
        "Bär upp till 40 kilo",
    ],
    "1b64abde": [
        "Plattform högst upp: 29,5 × 30 centimeter",
        "Ramplutning 89 centimeter lång och 40 centimeter bred",
        "Totalt 125 centimeter lång, 35,5 centimeter hög",
        "Ram i furu, vitlackad, med grå gångyta",
        "Bär upp till 50 kilo",
    ],
}

LAST_RUBRIK = {
    "2166c50f": "25 kilo är gränsen, och det är inte mycket hund",
    "9a513e9a": "25 kilo är gränsen, och det är inte mycket hund",
    "c2be0f30": "25 kilo är gränsen, och det är inte mycket hund",
    "ed1ea8dc": "15 kilo — för katt, valp och små hundar",
    "15e4c7a7": "40 kilo, och ingen inställning att glömma",
    "935cd17b": "40 kilo på alla fyra höjder",
    "1b64abde": "50 kilo, och en plattform att stanna på",
}

LAST = {
    "2166c50f":
        "Trappan är byggd för 25 kilo. Det är en gräns som är lätt att "
        "passera: många vanliga sällskapshundar väger mer, och då är den här "
        "trappan fel vara. Väg hunden innan du beställer, och läs stycket "
        "nedan om du behöver något som bär tyngre.",
    "9a513e9a":
        "Trappan är byggd för 25 kilo. Det är en gräns som är lätt att "
        "passera: många vanliga sällskapshundar väger mer, och då är den här "
        "trappan fel vara. Väg hunden innan du beställer, och läs stycket "
        "nedan om du behöver något som bär tyngre.",
    "c2be0f30":
        "Trappan är byggd för 25 kilo. Det är en gräns som är lätt att "
        "passera: många vanliga sällskapshundar väger mer, och då är den här "
        "trappan fel vara. Väg hunden innan du beställer, och läs stycket "
        "nedan om du behöver något som bär tyngre.",
    "ed1ea8dc":
        "Rampen bär 15 kilo. Den är alltså byggd för katt, valp, "
        "dvärgraser och små sällskapshundar — inte för en vuxen hund i "
        "mellanstorlek. Behöver du mer bärighet i samma form finns två "
        "kraftigare ramper längre ner på sidan.",
    "15e4c7a7":
        "Rampen bär 40 kilo och har ingen inställning som kan hamna fel. "
        "Lutningen är byggd in i sidoskivan: 45 centimeters höjd över 90 "
        "centimeters längd, varken mer eller mindre. Det gör den enklare att "
        "ställa fram och svårare att använda fel.",
    "935cd17b":
        "Rampen bär 40 kilo, och talet gäller i alla fyra lägen — det ändras "
        "inte när du höjer den. Ju högre läge, desto brantare blir förstås "
        "lutningen, så välj det lägsta som räcker till möbeln.",
    "1b64abde":
        "Rampen bär 50 kilo. Tillsammans med plattformen betyder det att "
        "en stor hund kan stå still högst upp i stället för att balansera "
        "i en lutning. Det är plattformen som gör skillnaden.",
}

BRUK_RUBRIK = {
    "2166c50f": "Fälls till 79 centimeter och läggs i bagaget",
    "9a513e9a": "Fälls till 79 centimeter och läggs i bagaget",
    "c2be0f30": "Fälls till 79 centimeter och läggs i bagaget",
    "ed1ea8dc": "Fem centimeter tjock när den inte används",
    "15e4c7a7": "Plywoodsidan bär, mattan greppar",
    "935cd17b": "Sju centimeter tjock i garderoben",
    "1b64abde": "Står fritt, utan att luta mot något",
}

BRUK = {
    "2166c50f":
        "Hopfälld på mitten blir trappan 79 centimeter lång, 40 centimeter bred "
        "och 13 centimeter tjock — ett paket som får plats stående längs "
        "bagagerummets sida. Plattformen högst upp är den ände som ska vila "
        "mot lastkanten; foten ställs på marken. Kartongen innehåller "
        "trappan och en bruksanvisning.",
    "9a513e9a":
        "Hopfälld på mitten blir trappan 79 centimeter lång, 40 centimeter bred "
        "och 13 centimeter tjock — ett paket som får plats stående längs "
        "bagagerummets sida. Plattformen högst upp är den ände som ska vila "
        "mot lastkanten; foten ställs på marken. Kartongen innehåller "
        "trappan och en bruksanvisning.",
    "c2be0f30":
        "Hopfälld på mitten blir trappan 79 centimeter lång, 40 centimeter bred "
        "och 13 centimeter tjock — ett paket som får plats stående längs "
        "bagagerummets sida. Plattformen högst upp är den ände som ska vila "
        "mot lastkanten; foten ställs på marken. Kartongen innehåller "
        "trappan och en bruksanvisning.",
    "ed1ea8dc":
        "Stödbenet fälls in under rampen och hela plattan blir 5 centimeter "
        "tjock och 80 centimeter lång. Det måttet avgör var den kan "
        "förvaras: bakom en soffa, under en säng eller stående i en "
        "garderob. Kartongen innehåller rampen och en anvisning.",
    "15e4c7a7":
        "Sidoskivan är lamellträ, ramen gran och gångytan klädd i polyester. "
        "Eftersom lutningen är fast finns inget att ställa in och inget "
        "gångjärn att sköta — rampen bärs fram, ställs mot möbeln och står "
        "still. Kartongen innehåller rampen och en handbok.",
    "935cd17b":
        "Hopfälld ligger rampen platt: 100 centimeter lång, 40 centimeter "
        "bred och 7 centimeter tjock. Sidostyckena är furu och gångytan "
        "polyester. Kartongen innehåller rampen och en anvisning.",
    "1b64abde":
        "Rampen har egna ben och behöver inte luta mot en möbel — den ställs "
        "intill sängen eller soffan och står på sina fyra fötter. Ramen är "
        "furu, gångytan polyester. Kartongen innehåller rampen och en "
        "anvisning.",
}

# ☠️ KORSLÄNKARNA. Färgsyskonen länkar åt BÅDA håll (uppgift #480), och
#    biltrapporna länkar till de publicerade RAMPERNA — det är exakt den
#    kund vars hund väger mer än 25 kg som behöver veta att de finns.
KORSLANK = {
    "2166c50f": [
        ("hundtrappa-bil-154-brun", "Samma trappa i brunt"),
        ("hundtrappa-bil-154-svart", "Samma trappa i svart"),
        ("hundramp-bil-155-cm", "Hundramp för bil 155 cm"),
        ("hopfallbar-hundramp-bil-158-cm", "Hopfällbar hundramp till bil 158 cm"),
    ],
    "9a513e9a": [
        ("hundtrappa-bil-154-gra", "Samma trappa i grått"),
        ("hundtrappa-bil-154-svart", "Samma trappa i svart"),
        ("hundramp-bil-155-cm", "Hundramp för bil 155 cm"),
        ("hopfallbar-hundramp-bil-158-cm", "Hopfällbar hundramp till bil 158 cm"),
    ],
    "c2be0f30": [
        ("hundtrappa-bil-154-gra", "Samma trappa i grått"),
        ("hundtrappa-bil-154-brun", "Samma trappa i brunt"),
        ("hundramp-bil-155-cm", "Hundramp för bil 155 cm"),
        ("hopfallbar-hundramp-bil-158-cm", "Hopfällbar hundramp till bil 158 cm"),
    ],
    "ed1ea8dc": [
        ("hundramp-45-cm-40-kg", "Hundramp 90 cm med fast lutning"),
        ("hundramp-sang-61-cm", "Hundramp till hög säng 61 cm"),
        ("hundramp-med-plattform-50-kg", "Hundramp med plattform"),
    ],
    "15e4c7a7": [
        ("hundramp-soffa-47-cm", "Hundramp till soffa 47,5 cm"),
        ("hundramp-sang-61-cm", "Hundramp till hög säng 61 cm"),
        ("hundramp-med-plattform-50-kg", "Hundramp med plattform"),
    ],
    "935cd17b": [
        ("hundramp-soffa-47-cm", "Hundramp till soffa 47,5 cm"),
        ("hundramp-45-cm-40-kg", "Hundramp 90 cm med fast lutning"),
        ("hundramp-med-plattform-50-kg", "Hundramp med plattform"),
    ],
    "1b64abde": [
        ("hundramp-soffa-47-cm", "Hundramp till soffa 47,5 cm"),
        ("hundramp-45-cm-40-kg", "Hundramp 90 cm med fast lutning"),
        ("hundramp-sang-61-cm", "Hundramp till hög säng 61 cm"),
    ],
}

# Inledande mening i "Passar inte den här?"-blocket. Den bär INGA tal —
# talen ligger i länkmeningarna, där grinden prövar dem mot MÅLETS spec.
KORS_INGRESS = {
    "2166c50f": "Väger hunden mer, eller behöver den en lutande yta i "
                "stället för steg?",
    "9a513e9a": "Väger hunden mer, eller behöver den en lutande yta i "
                "stället för steg?",
    "c2be0f30": "Väger hunden mer, eller behöver den en lutande yta i "
                "stället för steg?",
    "ed1ea8dc": "Behöver du en högre ramp, eller en som bär tyngre?",
    "15e4c7a7": "Behöver du kunna ställa in höjden?",
    "935cd17b": "Behöver du en lägre ramp, eller en som står fritt?",
    "1b64abde": "Behöver du en ramp som viks ihop tunnare?",
}

# Meningen som följer varje länk. Talen här hör till MÅLET.
KORS_TEXT = {
    "hundtrappa-bil-154-gra": "",
    "hundtrappa-bil-154-brun": "",
    "hundtrappa-bil-154-svart": "",
    "hundramp-bil-155-cm":
        " är en ramp med konstgräs som bär 90 kilo och kräver montering",
    "hopfallbar-hundramp-bil-158-cm":
        " bär 60 kilo, är avsedd för hundar upp till 40 kilo och kräver "
        "ingen montering",
    "hundramp-soffa-47-cm":
        " ställs i fyra lägen upp till 47,5 centimeter och bär 15 kilo",
    "hundramp-45-cm-40-kg":
        " är 45 centimeter hög och bär 40 kilo",
    "hundramp-sang-61-cm":
        " går upp till 61 centimeter och bär 40 kilo",
    "hundramp-med-plattform-50-kg":
        " har en plattform högst upp och bär 50 kilo",
}

SPEC = {
    "2166c50f": [
        ("Typ", "Hopfällbar hundtrappa för bil"),
        ("Material", "Plast, halklister i TPR-gummi"),
        ("Färg", "Grå"),
        ("Mått utfälld", "154 × 40 × 7,5 cm (L × B × H)"),
        ("Mått hopfälld", "79 × 40 × 13 cm (L × B × H)"),
        ("Antal steg", "10"),
        ("Stegmått", "34,5 × 8 cm"),
        ("Halklister", "4 st, 22,8 × 5 cm"),
        ("Största lasthöjd", "82 cm"),
        ("Max belastning", "25 kg"),
        ("Ingår", "1 × hundtrappa, 1 × bruksanvisning"),
    ],
    "9a513e9a": [
        ("Typ", "Hopfällbar hundtrappa för bil"),
        ("Material", "Plast, halklister i TPR-gummi"),
        ("Färg", "Brun"),
        ("Mått utfälld", "154 × 40 × 7,5 cm (L × B × H)"),
        ("Mått hopfälld", "79 × 40 × 13 cm (L × B × H)"),
        ("Antal steg", "10"),
        ("Stegmått", "34,5 × 8 cm"),
        ("Halklister", "4 st, 22,8 × 5 cm"),
        ("Största lasthöjd", "82 cm"),
        ("Max belastning", "25 kg"),
        ("Ingår", "1 × hundtrappa, 1 × bruksanvisning"),
    ],
    "c2be0f30": [
        ("Typ", "Hopfällbar hundtrappa för bil"),
        ("Material", "Plast, halklister i TPR-gummi"),
        ("Färg", "Svart"),
        ("Mått utfälld", "154 × 40 × 7,5 cm (L × B × H)"),
        ("Mått hopfälld", "79 × 40 × 13 cm (L × B × H)"),
        ("Antal steg", "10"),
        ("Stegmått", "34,5 × 8 cm"),
        ("Halklister", "4 st, 22,8 × 5 cm"),
        ("Största lasthöjd", "82 cm"),
        ("Max belastning", "25 kg"),
        ("Ingår", "1 × hundtrappa, 1 × bruksanvisning"),
    ],
    "ed1ea8dc": [
        ("Typ", "Hopfällbar hundramp med fyra höjdlägen"),
        ("Material", "Furu, matta"),
        ("Färg", "Naturträ och svart"),
        ("Mått utfälld", "83,5 × 35 × 47,5 cm (L × B × H)"),
        ("Mått hopfälld", "80 × 35 × 5 cm (L × B × H)"),
        ("Höjdlägen", "24/32,5/40/47,5 cm"),
        ("Lutning", "15/22/28/35°"),
        ("Max belastning", "15 kg"),
        ("Ingår", "1 × hundramp, 1 × anvisning"),
    ],
    "15e4c7a7": [
        ("Typ", "Hundramp med fast lutning"),
        ("Material", "Lamellträ, gran, polyester"),
        ("Färg", "Natur och grå"),
        ("Mått", "90 × 40 × 45 cm (L × B × H)"),
        ("Avstånd mellan halklister", "10 cm"),
        ("Max belastning", "40 kg"),
        ("Ingår", "1 × hundramp, 1 × handbok"),
    ],
    "935cd17b": [
        ("Typ", "Hopfällbar hundramp med fyra höjdlägen"),
        ("Material", "Furu, polyester"),
        ("Färg", "Svart och naturträ"),
        ("Mått uppställd", "90 × 40 × 61 cm (L × B × H)"),
        ("Mått hopfälld", "100 × 40 × 7 cm (L × B × H)"),
        ("Höjdlägen", "26/39/50/61 cm"),
        ("Max belastning", "40 kg"),
        ("Ingår", "1 × hundramp, 1 × anvisning"),
    ],
    "1b64abde": [
        ("Typ", "Hundramp med plattform"),
        ("Material", "Furu, polyester"),
        ("Färg", "Vit och grå"),
        ("Mått", "125 × 40 × 35,5 cm (L × B × H)"),
        ("Ramplutning", "89 × 40 cm (L × B)"),
        ("Plattform", "29,5 × 30 cm (L × B)"),
        ("Max belastning", "50 kg"),
        ("Ingår", "1 × hundramp, 1 × anvisning"),
    ],
}

SKOTSEL = {
    "2166c50f":
        "Ställ foten på fast och plant underlag och låt plattformen vila mot "
        "lastkanten, inte mot stötfångaren. Kontrollera att trappan ligger "
        "an innan hunden går upp. Plasten torkas av med fuktig trasa; "
        "vägsalt och grus som följt med hem sköljs bort, eftersom grus som "
        "ligger kvar på trampytorna gör dem hala i stället för greppiga. "
        "Halklisterna sitter i fyra av de tio stegen och ska hållas rena av "
        "samma skäl. Fäll ihop trappan innan du lägger in den i bagaget, så "
        "belastas inte gångjärnet i sidled.",
    "9a513e9a":
        "Ställ foten på fast och plant underlag och låt plattformen vila mot "
        "lastkanten, inte mot stötfångaren. Kontrollera att trappan ligger "
        "an innan hunden går upp. Plasten torkas av med fuktig trasa; "
        "vägsalt och grus som följt med hem sköljs bort, eftersom grus som "
        "ligger kvar på trampytorna gör dem hala i stället för greppiga. "
        "Halklisterna sitter i fyra av de tio stegen och ska hållas rena av "
        "samma skäl. Fäll ihop trappan innan du lägger in den i bagaget, så "
        "belastas inte gångjärnet i sidled.",
    "c2be0f30":
        "Ställ foten på fast och plant underlag och låt plattformen vila mot "
        "lastkanten, inte mot stötfångaren. Kontrollera att trappan ligger "
        "an innan hunden går upp. Plasten torkas av med fuktig trasa; "
        "vägsalt och grus som följt med hem sköljs bort, eftersom grus som "
        "ligger kvar på trampytorna gör dem hala i stället för greppiga. "
        "Halklisterna sitter i fyra av de tio stegen och ska hållas rena av "
        "samma skäl. Fäll ihop trappan innan du lägger in den i bagaget, så "
        "belastas inte gångjärnet i sidled.",
    "ed1ea8dc":
        "Haka stödbenet i det lägsta läge som når upp till möbeln — 24 "
        "centimeter räcker till en låg soffa och ger den flackaste "
        "lutningen. Kontrollera att benet sitter i sitt spår innan hunden "
        "går upp. Mattan dammsugs eller borstas; blir den blöt ska rampen "
        "torka utfälld, inte hopfälld, så att fukten inte blir kvar mot "
        "furun. Trä som står mot en kall yttervägg drar åt sig fukt — ställ "
        "den hellre inne i rummet.",
    "15e4c7a7":
        "Ställ rampen med den höga änden mot möbeln och kontrollera att den "
        "ligger an i hela bredden innan hunden går upp. Textilen borstas "
        "eller dammsugs i listernas riktning, så att skräp inte packas in "
        "mot trälisterna. Torka av lamellträsidan med lätt fuktad trasa och "
        "aldrig med rinnande vatten — lamellträ suger i kanterna. Skruvarna "
        "som håller listerna kan behöva efterdras när rampen använts en tid.",
    "935cd17b":
        "Välj det lägsta av de fyra lägena som når upp till sängen: ju lägre "
        "läge, desto flackare lutning och desto lättare för en hund som är "
        "stel i bakbenen. Kontrollera stödbenets läge varje gång rampen "
        "ställs fram. Textilen borstas ren; furun torkas av med lätt fuktad "
        "trasa. Fäll ihop rampen när den inte används, så står den inte och "
        "belastar stödbenet i onödan.",
    "1b64abde":
        "Ställ rampen så att plattformen ligger i jämnhöjd med sängkanten "
        "eller strax under — hunden ska kunna kliva över, inte upp. "
        "Eftersom rampen står på egna ben behöver den inte luta mot möbeln, "
        "men den ska stå på plant golv så att alla fyra fötterna bär. "
        "Textilen borstas ren, den vitlackade furun torkas av med fuktig "
        "trasa. Kontrollera fötternas skruvar då och då.",
}

FAQ = {
    "2166c50f": [
        ("Hur hög bil passar den till?",
         "Trappan når som högst 82 centimeter. Mät från marken till "
         "bagagerummets lastkant på din bil och jämför med det talet."),
        ("Är det en trappa eller en ramp?",
         "En trappa. Den har tio steg med plana trampytor och sättsteg "
         "emellan, inte en sammanhängande lutning. Behöver hunden en jämn "
         "yta att gå på finns ramper längre ner på sidan."),
        ("Hur stort är varje steg?",
         "34,5 centimeter brett och 8 centimeter djupt."),
        ("Vad är de gula listerna?",
         "Halklister i TPR-gummi, 22,8 × 5 centimeter. Det sitter fyra "
         "stycken, fördelade över trappans tio steg."),
        ("Hur mycket plats tar den hopfälld?",
         "79 × 40 × 13 centimeter. Den viks på mitten och kan ställas på "
         "högkant längs bagagerummets sida."),
        ("Hur tung hund klarar den?",
         "25 kilo. Väger hunden mer ska du välja en annan modell — det "
         "finns länkar till två kraftigare på den här sidan."),
        ("Vad ingår i kartongen?",
         "Trappan och en bruksanvisning."),
        ("Går den att använda till soffan också?",
         "Den är byggd för bilen och är 154 centimeter lång utfälld, "
         "vilket är mycket golv att ta i anspråk inomhus. För soffa och "
         "säng finns kortare ramper i sortimentet."),
    ],
    "9a513e9a": [
        ("Hur hög bil passar den till?",
         "Trappan når som högst 82 centimeter. Mät från marken till "
         "bagagerummets lastkant på din bil och jämför med det talet."),
        ("Är det en trappa eller en ramp?",
         "En trappa. Den har tio steg med plana trampytor och sättsteg "
         "emellan, inte en sammanhängande lutning. Behöver hunden en jämn "
         "yta att gå på finns ramper längre ner på sidan."),
        ("Hur stort är varje steg?",
         "34,5 centimeter brett och 8 centimeter djupt."),
        ("Vad är de gula listerna?",
         "Halklister i TPR-gummi, 22,8 × 5 centimeter. Det sitter fyra "
         "stycken, fördelade över trappans tio steg."),
        ("Hur mycket plats tar den hopfälld?",
         "79 × 40 × 13 centimeter. Den viks på mitten och kan ställas på "
         "högkant längs bagagerummets sida."),
        ("Hur tung hund klarar den?",
         "25 kilo. Väger hunden mer ska du välja en annan modell — det "
         "finns länkar till två kraftigare på den här sidan."),
        ("Vad ingår i kartongen?",
         "Trappan och en bruksanvisning."),
        ("Finns den i andra färger?",
         "Ja, samma trappa finns i grått och i svart. Båda är länkade "
         "längre ner på sidan."),
    ],
    "c2be0f30": [
        ("Hur hög bil passar den till?",
         "Trappan når som högst 82 centimeter. Mät från marken till "
         "bagagerummets lastkant på din bil och jämför med det talet."),
        ("Är det en trappa eller en ramp?",
         "En trappa. Den har tio steg med plana trampytor och sättsteg "
         "emellan, inte en sammanhängande lutning. Behöver hunden en jämn "
         "yta att gå på finns ramper längre ner på sidan."),
        ("Hur stort är varje steg?",
         "34,5 centimeter brett och 8 centimeter djupt."),
        ("Vad är de gula listerna?",
         "Halklister i TPR-gummi, 22,8 × 5 centimeter. Det sitter fyra "
         "stycken, fördelade över trappans tio steg."),
        ("Hur mycket plats tar den hopfälld?",
         "79 × 40 × 13 centimeter. Den viks på mitten och kan ställas på "
         "högkant längs bagagerummets sida."),
        ("Hur tung hund klarar den?",
         "25 kilo. Väger hunden mer ska du välja en annan modell — det "
         "finns länkar till två kraftigare på den här sidan."),
        ("Vad ingår i kartongen?",
         "Trappan och en bruksanvisning."),
        ("Finns den i andra färger?",
         "Ja, samma trappa finns i grått och i brunt. Båda är länkade "
         "längre ner på sidan."),
    ],
    "ed1ea8dc": [
        ("Vilka höjder går den att ställa i?",
         "Fyra lägen: 24/32,5/40/47,5 centimeter. Lutningen följer med och "
         "blir 15/22/28/35 grader."),
        ("Hur tjock är den hopfälld?",
         "5 centimeter, och 80 centimeter lång. Den går alltså att ställa "
         "bakom en soffa eller skjuta in under en säng."),
        ("Hur bred är gångytan?",
         "35 centimeter, och mattan täcker hela ytan."),
        ("Hur mycket bär den?",
         "15 kilo. Den passar alltså katt, valp, dvärgraser och små "
         "sällskapshundar."),
        ("Vilket trä är det?",
         "Furu. Sidorna är lämnade i träfärg och gångytan är svart."),
        ("Måste den luta mot något?",
         "Ja. Den höga änden vilar mot soffan eller sängen och stödbenet "
         "bär upp den underifrån."),
        ("Vad ingår i kartongen?",
         "Rampen och en anvisning."),
    ],
    "15e4c7a7": [
        ("Går höjden att ändra?",
         "Nej. Lutningen är byggd in i sidoskivan: 45 centimeter i höjd "
         "över 90 centimeter i längd. Behöver du ställa in höjden finns "
         "två justerbara ramper längre ner på sidan."),
        ("Vad är listerna på gångytan?",
         "Tvärgående trälister med 10 centimeters mellanrum. De ger "
         "tassarna något att ta spjärn mot; mattan under dem är "
         "sammanhängande, så det är en ramp och inte en trappa."),
        ("Hur mycket bär den?",
         "40 kilo."),
        ("Hur bred är gångytan?",
         "40 centimeter, klädd i grå textil."),
        ("Vilket material är den gjord av?",
         "Sidoskivan är lamellträ, ramen gran och gångytan polyester."),
        ("Går den att fälla ihop?",
         "Nej. Sidan är en hel skiva, så rampen är ett stycke och tar 90 "
         "centimeter i golv även när den inte används."),
        ("Vad ingår i kartongen?",
         "Rampen och en handbok."),
    ],
    "935cd17b": [
        ("Hur högt når den?",
         "61 centimeter i det översta läget. De tre lägre lägena är "
         "26/39/50 cm."),
        ("Ändras bärigheten när jag höjer den?",
         "Nej. 40 kilo gäller i alla fyra lägen. Det som ändras är "
         "lutningen, som blir brantare ju högre du ställer rampen."),
        ("Hur bred är gångytan?",
         "40 centimeter, klädd i mörk textil."),
        ("Hur mycket plats tar den hopfälld?",
         "100 × 40 × 7 centimeter. Den ligger platt och kan ställas på "
         "högkant i en garderob."),
        ("Vilket trä är det?",
         "Furu, lämnad i träfärg på sidostyckena."),
        ("Passar den till en kontinentalsäng?",
         "Mät bäddhöjden från golvet. Når den inte över 61 centimeter "
         "räcker rampen; är sängen högre gör den inte det."),
        ("Vad ingår i kartongen?",
         "Rampen och en anvisning."),
    ],
    "1b64abde": [
        ("Vad är plattformen bra för?",
         "Den är en plan yta på 29,5 × 30 centimeter högst upp, så hunden "
         "kan stanna och vända i stället för att behöva kliva direkt från "
         "en lutning upp i sängen."),
        ("Hur hög är rampen?",
         "35,5 centimeter till plattformens ovansida."),
        ("Hur mycket bär den?",
         "50 kilo."),
        ("Måste den luta mot möbeln?",
         "Nej. Den har egna ben och står fritt intill sängen eller soffan."),
        ("Hur mycket golv tar den?",
         "125 centimeter i längd och 40 centimeter i bredd."),
        ("Hur lång är själva lutningen?",
         "89 centimeter, och den är 40 centimeter bred."),
        ("Vilket material är den gjord av?",
         "Ram i furu, vitlackad, med gångyta i grå polyester."),
        ("Vad ingår i kartongen?",
         "Rampen och en anvisning."),
    ],
}


def bygg(pid):
    ut = ["<p>%s</p>" % INTRO[pid]]

    ut.append("<h2>%s</h2><ul>" % RUBRIK[pid])
    ut += ["<li>%s</li>" % p for p in PUNKTER[pid]]
    ut.append("</ul>")

    ut.append("<h2>%s</h2>" % LAST_RUBRIK[pid])
    ut.append("<p>%s</p>" % LAST[pid])

    ut.append("<h2>%s</h2>" % BRUK_RUBRIK[pid])
    ut.append("<p>%s</p>" % BRUK[pid])

    # ☠️ KORSLÄNKARNA LIGGER FÖRE FÖRSTA FLIKRUBRIKEN. `splitFlikar` lägger
    #    allt efter en matchande rubrik i den fliken.
    # ☠️ ABSOLUT ADRESS. `href="/produkt/x"` blir `https:/produkt/x` i Wix.
    bitar = []
    for mal, text in KORSLANK[pid]:
        bitar.append('<a href="https://www.fyndplats.se/produkt/%s">%s</a>%s.'
                     % (mal, text, KORS_TEXT[mal]))
    ut.append("<h2>Passar inte den här?</h2>")
    ut.append("<p>%s %s</p>" % (KORS_INGRESS[pid], " ".join(bitar)))

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
        print("%s  %4d ord  %5d tecken  titel %3d  meta %3d  namn %3d  sku %2d  faq %d"
              % (pid, v["ord"], v["synliga_tecken"], len(v["titel"]),
                 len(v["meta"]), len(v["namn"]), len(v["sku"]), len(FAQ[pid])))
