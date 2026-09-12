# -*- coding: utf-8 -*-
"""Runda 137 — all kundtext, byggd i FIL och grindad före skrivning.

☠️ TEXTEN SKRIVS ALDRIG INLINE I ETT API-ANROP. Uppmätt 2026-09-04: fem
   produkter skrivna inline gav NIO fel som nådde Wix; tre skrivna via fil
   och grind gav noll. Skälet är mekaniskt — en sträng i ett JSON-anrop kan
   inte grepas innan den lämnar chatten, och PATCH-svaret ekar tillbaka
   exakt det man skrev, så det ser rätt ut för att det ÄR det man skrev.

☠️ SPEC-TABELLEN BYGGS UR TYSKANS `Technische Daten`, aldrig ur importens
   svenska rad. Den säger `Polyester` på sju av åtta där källan säger annat,
   och `Sparticles, Sisal, Plush, Felt` på f5f71f5d — engelska i en svensk
   tabell, plus ett ord som inte finns. Se STEG2-5.md.

☠️ `Artikelnummer` är ALDRIG en etikett här. Numret hör hemma på
   mappningsradens `supplierProductId` och ingen annanstans.
"""
import os as _os
import sys as _sys

_sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), ".."))
_sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
import grindar as _G                                             # noqa: E402
import matt as _M                                                # noqa: E402

SLUG = dict(_M.SLUG)
SKU = {pid: "FP-" + _G.sku_bas(slug) for pid, slug in SLUG.items()}

NAMN = {
    "c7bd00b9": "Takspänt klösträd 230–250 cm i ek och cremevitt – hängmatta och två plan",
    "a73a1a1c": "Takspänt klösträd 230–250 cm i grått och cremevitt – hängmatta och två plan",
    "f5f71f5d": "Klösträd 90 cm i cremevitt – koja, hängmatta och bädd med kattöron",
    "dd3b541b": "Klösträd 90 cm i grått – koja, hängmatta och bädd med kattöron",
    "f489937f": "Klöspelare 91 cm i mörkgrått – grov sisalstam och bädd med kant",
    "5616c567": "Klöspelare 91 cm i ljusbrunt – grov sisalstam och bädd med kant",
    "1ae60dbc": "Kattrappa 66 cm i beige – fyra steg, koja under trappan och lekboll",
    "819bf51c": "Kattrappa 66 cm i ljusgrått – fyra steg, koja under trappan och lekboll",
}

TITEL = {
    "c7bd00b9": "Takspänt klösträd 230–250 cm i ek | Fyndplats",
    "a73a1a1c": "Takspänt klösträd 230–250 cm i grått | Fyndplats",
    "f5f71f5d": "Klösträd 90 cm med koja, cremevitt | Fyndplats",
    "dd3b541b": "Klösträd 90 cm med koja, grått | Fyndplats",
    "f489937f": "Klöspelare 91 cm i mörkgrått | Fyndplats",
    "5616c567": "Klöspelare 91 cm i ljusbrunt | Fyndplats",
    "1ae60dbc": "Kattrappa 66 cm med koja, beige | Fyndplats",
    "819bf51c": "Kattrappa 66 cm med koja, ljusgrå | Fyndplats",
}

META = {
    "c7bd00b9": "Takspänt klösträd som ställs mellan golv och tak, 230–250 cm. "
                "Sisalstam Ø8,5 cm, hängmatta Ø30 cm och två plan på Ø34 cm. Tippskydd ingår.",
    "a73a1a1c": "Takspänt klösträd i grått och cremevitt, 230–250 cm. Sisalstam "
                "Ø8,5 cm, hängmatta Ø30 cm och två plan på Ø34 cm. Tippskydd ingår.",
    "f5f71f5d": "Klösträd 90 cm med sluten koja 30 × 30 × 28 cm, hängmatta 35 × 35 cm "
                "och toppbädd med uppvikt kant. Sockel 48 × 48 cm.",
    "dd3b541b": "Klösträd 90 cm i grått med sluten koja 30 × 30 × 28 cm, hängmatta "
                "35 × 35 cm och toppbädd med uppvikt kant. Sockel 48 × 48 cm.",
    "f489937f": "Klöspelare 91 cm med grov sisalstam på Ø16,5 cm, rundat mellanplan "
                "Ø35,5 cm och toppbädd med kant. Bär 10 kg.",
    "5616c567": "Klöspelare 91 cm i ljusbrunt med sisalstam Ø16,5 cm, mellanplan "
                "Ø35,5 cm och toppbädd med kant. Bär 10 kg.",
    "1ae60dbc": "Kattrappa 66 cm med fyra steg på 18, 33, 50 och 66 cm och en sluten "
                "koja under trappan. Kan byggas med tre steg i stället.",
    "819bf51c": "Kattrappa 66 cm i ljusgrått med fyra steg på 18, 33, 50 och 66 cm "
                "och en sluten koja under trappan. Kan byggas med tre steg.",
}

SOKORD = {
    "c7bd00b9": "takspänt klösträd",
    "a73a1a1c": "takspänt klösträd grått",
    "f5f71f5d": "klösträd med koja",
    "dd3b541b": "klösträd 90 cm grått",
    "f489937f": "klöspelare med bädd",
    "5616c567": "klöspelare ljusbrun",
    "1ae60dbc": "kattrappa",
    "819bf51c": "kattrappa grå",
}

INTRO = {
    "c7bd00b9": (
        "Ett klösträd som spänns fast mellan golv och tak i stället för att stå "
        "på en bred sockel. Stammen är lindad med sisal hela vägen upp och mäter "
        "Ø8,5 cm, sockeln är 40 × 40 cm, och höjden ställs in mellan 230 och "
        "250 cm efter rummets takhöjd. På stammen sitter två runda plan på "
        "Ø34 cm och en hängmatta på Ø30 cm som är 12 cm djup. Träpanelerna är "
        "i ekton, klädseln cremevit."),
    "a73a1a1c": (
        "Ett takspänt klösträd med grå plan mot en cremevit stam. "
        "Sisalstammen är Ø8,5 cm och spänns mellan golv och tak, "
        "sockeln mäter 40 × 40 cm och höjden ställs in mellan 230 och 250 cm. "
        "Två runda plan på Ø34 cm och en hängmatta på Ø30 cm, 12 cm djup, "
        "sitter på stammen."),
    "f5f71f5d": (
        "Ett klösträd på 90 cm där de tre nivåerna gör olika saker. Längst ner "
        "står en sluten koja på 30 × 30 × 28 cm med en rund ingång på Ø18 cm. "
        "Mitt på hänger en hängmatta i tyg, 35 × 35 cm, mellan stolparna. "
        "Överst ligger en bädd på 48 × 28 cm med 8 cm uppvikt kant och två "
        "utskurna kattöron. Sockeln är 48 × 48 cm och klädseln cremevit."),
    "dd3b541b": (
        "Ett klösträd på 90 cm i grå klädsel. Den slutna kojan längst ner "
        "mäter 30 × 30 × 28 cm och har en rund ingång på Ø18 cm. Hängmattan i "
        "mitten är 35 × 35 cm, och toppbädden 48 × 28 cm med 8 cm uppvikt kant "
        "och två utskurna kattöron. Sockeln är 48 × 48 cm."),
    "f489937f": (
        "En klöspelare byggd kring en grov stam på Ø16,5 cm. Grovleken gör att "
        "katten kan klösa med hela tassen i stället för bara klorna, utan att "
        "stammen ger efter. Höjden är 91 cm, sockeln 45 × 45 cm, "
        "och på vägen upp sitter ett runt mellanplan på Ø35,5 cm. Överst ligger "
        "en bädd på 45 × 36 cm med 8 cm kant och en lös kudde. Mörkgrått "
        "bouclétyg med ljusgrå kudde."),
    "5616c567": (
        "En klöspelare i ljusbrunt med gräddvit kudde. Stammen är Ø16,5 cm "
        "och lindad med sisal, höjden 91 cm och sockeln 45 × 45 cm. Ett runt "
        "mellanplan på Ø35,5 cm sitter halvvägs upp, och överst ligger en bädd "
        "på 45 × 36 cm med 8 cm kant och en lös kudde."),
    "1ae60dbc": (
        "En trappa som låter katten ta sig upp i soffan eller sängen utan att "
        "hoppa. Stegen ligger på 18, 33, 50 och 66 cm över golvet — alltså fyra "
        "jämna steg i stället för ett språng. De två nedersta och översta "
        "stegen är 40 × 15 cm, de två i mitten 40 × 30 cm. Under trappan sitter "
        "en sluten koja på 38 × 27 × 30 cm invändigt med en ingång på Ø16 cm, "
        "och på sidan hänger en lekboll på Ø4 cm. Beige klädsel."),
    "819bf51c": (
        "En kattrappa med ljusgrå steg och mörkgrå stammar. Stegen ligger på "
        "18, 33, 50 och 66 cm över golvet, de yttre är 40 × 15 cm och de två i "
        "mitten 40 × 30 cm. Kojan under trappan mäter 38 × 27 × 30 cm invändigt "
        "och har en ingång på Ø16 cm. En lekboll på Ø4 cm hänger på sidan."),
}

RUBRIK = {p: "Det här får du" for p in NAMN}

_TAK_PUNKTER = [
    "Spänns mellan golv och tak — ingen bred sockel tar golvyta",
    "Höjden ställs in mellan 230 och 250 cm efter rummets takhöjd",
    "Sisallindad stam på Ø8,5 cm i full höjd att klösa på",
    "Två runda plan på Ø34 cm och en hängmatta på Ø30 cm, 12 cm djup",
    "Kudde på 32,5 × 20 cm till det övre planet",
    "Tippskydd och takspänne ingår",
    "Sockel 40 × 40 cm — tar mindre plats än ett fristående klösträd",
    "Monteras ihop hemma; skruvar och nyckel följer med",
]
_NITTIO_PUNKTER = [
    "Tre nivåer med olika funktion: koja, hängmatta och bädd",
    "Sluten koja på 30 × 30 × 28 cm med rund ingång på Ø18 cm",
    "Hängmatta i tyg, 35 × 35 cm, spänd mellan stolparna",
    "Toppbädd på 48 × 28 cm med 8 cm uppvikt kant och två kattöron",
    "Mellanplan i full sockelbredd, 48 × 48 cm",
    "Sisallindade stolpar på Ø5,5 cm",
    "Hängande lekboll på Ø4 cm i ett 10 cm snöre",
    "Sockel 48 × 48 cm, total höjd 90 cm",
]
_PELARE_PUNKTER = [
    "Grov sisalstam på Ø16,5 cm — klös med hela tassen",
    "Toppbädd på 45 × 36 cm med 8 cm kant runt om",
    "Lös kudde som går att ta av och skaka ur",
    "Runt mellanplan på Ø35,5 cm halvvägs upp",
    "Bär 10 kg fördelat på konstruktionen",
    "Sockel 45 × 45 cm i full bredd för stabilitet",
    "Total höjd 91 cm — når soffryggen utan att dominera rummet",
    "Monteras ihop hemma",
]
_TRAPP_PUNKTER = [
    "Fyra steg på 18, 33, 50 och 66 cm över golvet",
    "Går att bygga med tre steg i stället, då slutar trappan på 50 cm",
    "Yttre stegen 40 × 15 cm, de två i mitten 40 × 30 cm",
    "Sluten koja under trappan, 38 × 27 × 30 cm invändigt",
    "Rund ingång till kojan på Ø16 cm",
    "Klösstammar på Ø6,7 cm, och Ø2,5 cm vid kojan",
    "Hängande lekboll på Ø4 cm",
    "Sockelmått 60 × 40 cm, total höjd 66 cm",
]
PUNKTER = {
    "c7bd00b9": _TAK_PUNKTER, "a73a1a1c": _TAK_PUNKTER,
    "f5f71f5d": _NITTIO_PUNKTER, "dd3b541b": _NITTIO_PUNKTER,
    "f489937f": _PELARE_PUNKTER, "5616c567": _PELARE_PUNKTER,
    "1ae60dbc": _TRAPP_PUNKTER, "819bf51c": _TRAPP_PUNKTER,
}

KATT_RUBRIK = {p: "Vilken katt den passar" for p in NAMN}

KATT = {
    "c7bd00b9": (
        "Byggd för katter upp till 5 kg. Planen är Ø34 cm, alltså precis lagom "
        "för en katt som lägger sig ihoprullad — inte för två som vill ligga "
        "bredvid varandra. Den passar katten som klättrar hellre än ligger: "
        "hela stammen på 230 till 250 cm är klösbar yta, och den lodräta "
        "sträckan är det som gör möbeln till vad den är. En katt som mest vill "
        "sova brett trivs bättre på något med större liggytor."),
    "a73a1a1c": (
        "Byggd för katter upp till 5 kg. Planen på Ø34 cm rymmer en ihoprullad "
        "katt åt gången, och den långa stammen mellan 230 och 250 cm är det "
        "möbeln handlar om — klättring och klösning på höjden. Har du en katt "
        "som hellre breder ut sig än klättrar är en lägre modell med breda "
        "liggytor ett bättre val."),
    "f5f71f5d": (
        "Byggd för katter upp till 4 kg. Kojan är 30 × 30 cm invändigt och "
        "ingången Ø18 cm, så en storvuxen katt får det trångt — måttet passar "
        "en normalstor eller mindre katt. De tre nivåerna gör den bra för en "
        "katt som växlar mellan att gömma sig, hänga och ligga högt: kojan är "
        "mörk och sluten, hängmattan gungar, och bädden överst har fri utsikt."),
    "dd3b541b": (
        "Byggd för katter upp till 4 kg. Ingången på Ø18 cm och kojans "
        "30 × 30 cm sätter gränsen — en storvuxen katt får det trångt därinne. "
        "Möbeln passar katten som vill kunna välja: en mörk och sluten plats "
        "längst ner, en gungande hängmatta i mitten och en öppen bädd överst."),
    "f489937f": (
        "Rekommenderad för katter upp till 5 kg, och konstruktionen bär 10 kg. "
        "Den här är först och främst en klöspelare — den grova stammen på "
        "Ø16,5 cm är poängen, inte höjden. Har du en katt som klöser på "
        "soffhörn och dörrkarmar är det den sortens grovlek som lockar över "
        "vanan. Bädden överst på 45 × 36 cm är rymlig nog att sova i, men "
        "möbeln ersätter inte ett klösträd med flera nivåer."),
    "5616c567": (
        "Rekommenderad för katter upp till 5 kg, och konstruktionen bär 10 kg. "
        "Tyngdpunkten ligger på klösandet: stammen är Ø16,5 cm, alltså grov nog "
        "att katten får fäste med hela tassen. Bädden på 45 × 36 cm med kant "
        "runt om fungerar som sovplats, men den som söker flera nivåer att "
        "klättra mellan ska välja ett klösträd i stället."),
    "1ae60dbc": (
        "Rekommenderad för katter upp till 5 kg. Trappan finns för katten som "
        "har svårt att hoppa — en äldre katt, en katt som är opererad, eller en "
        "kortbent ras. Steghöjden på 18, 33, 50 och 66 cm ger fyra korta kliv i "
        "stället för ett språng. Ställ den mot soffan eller sängkanten, och "
        "mät höjden dit först: översta steget ligger på 66 cm, så en högre säng "
        "kräver fortfarande ett litet hopp."),
    "819bf51c": (
        "Rekommenderad för katter upp till 5 kg. Den är gjord för katten som "
        "inte längre hoppar obehindrat — hög ålder, ett opererat ben eller en "
        "kortbent ras. Fyra steg på 18, 33, 50 och 66 cm delar upp höjden i "
        "korta kliv. Mät soffans eller sängens höjd innan du beställer: "
        "trappan slutar på 66 cm."),
}

BRUK_RUBRIK = {p: "Att tänka på" for p in NAMN}

BRUK = {
    "c7bd00b9": (
        "Takspännet behöver ett fast underlag i taket, alltså inte ett "
        "undertak av gipsskivor utan infästning. Mät takhöjden innan du "
        "beställer: möbeln ställs in mellan 230 och 250 cm och passar inte i "
        "ett rum som är högre än så. Spänn åt tills stammen står helt still "
        "när du trycker på den i sidled — en stam som ger efter blir inte "
        "tryggare av att katten vänjer sig vid den. Tippskyddet i "
        "leveransen ska monteras även när spännet sitter."),
    "a73a1a1c": (
        "Taket måste tåla ett spänne, så ett nedpendlat undertak utan "
        "infästning fungerar inte. Kontrollmät takhöjden först — möbeln täcker "
        "230 till 250 cm och inget däröver. Dra åt spännet tills stammen inte "
        "rör sig när du trycker till i sidled, och montera tippskyddet också, "
        "inte i stället."),
    "f5f71f5d": (
        "Möbeln står av egen tyngd på sin sockel på 48 × 48 cm och behöver "
        "ingen vägg bakom sig. Ställ den ändå med en sida mot en vägg om katten "
        "brukar ta sats — hängmattan sitter mitt emellan stolparna, och det är "
        "där tyngden hamnar när katten landar. Dra åt alla skruvar helt innan "
        "katten släpps på; en ledad möbel svajar mer med tiden, inte mindre."),
    "dd3b541b": (
        "Sockeln på 48 × 48 cm bär möbeln utan väggstöd, men en sida mot en "
        "vägg är ändå att föredra om katten hoppar upp i hängmattan med fart. "
        "Skruvarna ska dras helt vid monteringen och kontrolleras efter någon "
        "månad — de flesta klösmöbler lossnar i fogarna, inte i materialet."),
    "f489937f": (
        "Sockeln är 45 × 45 cm och bär möbeln fritt på golvet. Ställ den där "
        "katten redan klöser i dag i stället för på en plats du själv väljer — "
        "en klöspelare fungerar bara om den står i vägen för den gamla vanan. "
        "Står den på en matta lyfter du bort mattan under sockeln så att hela "
        "ytan vilar mot golvet."),
    "5616c567": (
        "Sockeln på 45 × 45 cm gör att pelaren står stadigt utan väggstöd. "
        "Placera den intill det soffhörn eller den dörrkarm katten redan "
        "använder; flyttas den dit du helst vill ha den blir den lätt "
        "förbisedd. Låt sockeln vila direkt mot golvet och inte på en tjock "
        "matta."),
    "1ae60dbc": (
        "Trappan ska stå stadigt mot det den leder upp till — skjut den ända "
        "in mot soffan eller sängkanten så att översta steget ligger i nivå med "
        "kanten. Ett glapp gör att katten hoppar sista biten, och då fyller "
        "trappan inte sin uppgift. Sockeln mäter 60 × 40 cm; på ett halt golv "
        "lägger du en matta under. Vill du ha den lägre monterar du den med tre "
        "steg i stället, och då slutar den på 50 cm."),
    "819bf51c": (
        "Skjut in trappan helt mot soffan eller sängen så att översta steget "
        "på 66 cm möter kanten. Blir det ett glapp hoppar katten den sista "
        "biten, vilket är precis det trappan finns för att slippa. På ett halt "
        "golv lägger du en matta under sockeln på 60 × 40 cm. Ska den nå en "
        "lägre möbel bygger du den med tre steg, och då slutar den på 50 cm."),
}

KORS_INGRESS = {p: "Passar inte den här?" for p in NAMN}
KORS_TEXT = {p: "Fler klösmöbler hos oss:" for p in NAMN}

# ☠️ ETT LÄNKAT TAL FÅR BARA STÅ I LÄNKENS EGET STYCKE. Talen nedan tillhör
#    SYSKONEN, inte den här produkten — talgrinden zonindelar per stycke.
# ☠️ Och korslänken går ÅT BÅDA HÅLL inom paret (uppgift #480).
KORSLANK = {
    "c7bd00b9": [("klostrad-takspant-gratt", "samma modell i grått"),
                 ("klostrad-takspant-240-260-cm", "takspänt klösträd 240–260 cm med två hålor"),
                 ("klostrad-fem-plan-230-260-cm-gra", "klösträd i fem plan 230–260 cm")],
    "a73a1a1c": [("klostrad-takspant-ek", "samma modell i ek"),
                 ("klostrad-takspant-240-260-cm", "takspänt klösträd 240–260 cm med två hålor"),
                 ("klostrad-fem-plan-230-260-cm-gra", "klösträd i fem plan 230–260 cm")],
    "f5f71f5d": [("klostrad-90-cm-gratt", "samma modell i grått"),
                 ("klostrad-90-cm-dubbelhala", "klösträd 90 cm med dubbel koja"),
                 ("klostrad-98-cm-korgbadd", "klösträd 98 cm med flätad koja")],
    "dd3b541b": [("klostrad-90-cm-cremevit", "samma modell i cremevitt"),
                 ("klostrad-90-cm-dubbelhala", "klösträd 90 cm med dubbel koja"),
                 ("klostrad-98-cm-korgbadd", "klösträd 98 cm med flätad koja")],
    "f489937f": [("klospelare-91-ljusbrun", "samma modell i ljusbrunt"),
                 ("klospelare-87-cm-med-badd", "klöspelare 87 cm med bädd på toppen"),
                 ("klospelare-81-cm-sisal", "klöspelare 81 cm med lekboll")],
    "5616c567": [("klospelare-91-morkgra", "samma modell i mörkgrått"),
                 ("klospelare-87-cm-med-badd", "klöspelare 87 cm med bädd på toppen"),
                 ("klospelare-81-cm-sisal", "klöspelare 81 cm med lekboll")],
    "1ae60dbc": [("kattrappa-66-cm-ljusgra", "samma modell i ljusgrått"),
                 ("litet-klostrad-46-cm-klosbrada-liggplats", "litet klösträd 46 cm med liggplats"),
                 ("klostrad-53-cm-tradstamsform", "klösträd 53 cm i trädstamsform")],
    "819bf51c": [("kattrappa-66-cm-beige", "samma modell i beige"),
                 ("litet-klostrad-46-cm-klosbrada-liggplats", "litet klösträd 46 cm med liggplats"),
                 ("klostrad-53-cm-tradstamsform", "klösträd 53 cm i trädstamsform")],
}

# ☠️ VÄRDENA KOMMER UR TYSKANS `Technische Daten`. Importens svenska rad
#    säger `Polyester` på sju av åtta och är inte en källa.
# ⚠️ `Lammwolle` i källan mot `Polyester` i den svenska raden — två kanaler,
#    två olika fibrer. Ingen av dem skrivs ut; `bouclé` beskriver väven och
#    är sant oavsett vilken av dem som stämmer.
_TAK_SPEC = [
    ("Mått", "40 × 40 × 230–250 cm (B × D × H)"),
    ("Sockel", "40 × 40 cm"),
    ("Höjdinställning", "230–250 cm, mot taket"),
    ("Plan", "2 st, Ø34 cm"),
    ("Hängmatta", "Ø30 cm, 12 cm djup"),
    ("Kudde", "32,5 × 20 cm"),
    ("Klösstam", "Ø8,5 cm, lindad med sisal"),
    ("Tippskydd", "Ingår"),
    ("Takspänne", "Ingår"),
    ("Rekommenderad kattvikt", "Upp till 5 kg"),
    ("Stomme", "Spånskiva"),
    ("Klädsel", "Polyesterplysch"),
    ("Montering", "Krävs, skruvar och nyckel medföljer"),
]
_NITTIO_SPEC = [
    ("Mått", "48 × 48 × 90 cm (B × D × H)"),
    ("Sockel", "48 × 48 cm"),
    ("Koja", "30 × 30 × 28 cm, ingång Ø18 cm"),
    ("Mellanplan", "48 × 48 cm"),
    ("Hängmatta", "35 × 35 cm"),
    ("Toppbädd", "48 × 28 cm, 8 cm kant"),
    ("Klösstolpar", "Ø5,5 cm, lindade med sisal"),
    ("Lekboll", "Ø4 cm i 10 cm snöre"),
    ("Rekommenderad kattvikt", "Upp till 4 kg"),
    ("Stomme", "Spånskiva"),
    ("Klädsel", "Plysch och filt"),
    ("Montering", "Krävs"),
]
_PELARE_SPEC = [
    ("Mått", "45 × 45 × 91 cm (B × D × H)"),
    ("Sockel", "45 × 45 cm"),
    ("Klösstam", "Ø16,5 cm, lindad med sisal"),
    ("Mellanplan", "Ø35,5 cm"),
    ("Toppbädd", "45 × 36 cm, 8 cm kant"),
    ("Bärförmåga", "10 kg"),
    ("Rekommenderad kattvikt", "Upp till 5 kg"),
    ("Stomme", "Spånskiva, klass E1"),
    ("Klädsel", "Bouclétyg, lös kudde"),
    ("Montering", "Krävs"),
]
_TRAPP_SPEC = [
    ("Mått", "60 × 40 × 66 cm (B × D × H)"),
    ("Antal steg", "4, eller 3 om det översta utelämnas"),
    ("Steghöjd från golv", "18, 33, 50 och 66 cm"),
    ("Steg 1 och 4", "40 × 15 cm"),
    ("Steg 2 och 3", "40 × 30 cm"),
    ("Koja", "38 × 27 × 30 cm invändigt, ingång Ø16 cm"),
    ("Klösstammar", "Ø6,7 cm, samt Ø2,5 cm vid kojan"),
    ("Lekboll", "Ø4 cm"),
    ("Rekommenderad kattvikt", "Upp till 5 kg"),
    ("Stomme", "Spånskiva"),
    ("Klädsel", "Plysch och filt"),
    ("Montering", "Krävs"),
]


def _med_farg(bas, farg):
    return bas + [("Färg", farg)]


SPEC = {
    "c7bd00b9": _med_farg(_TAK_SPEC, "Ek och cremevit"),
    "a73a1a1c": _med_farg(_TAK_SPEC, "Grå och cremevit"),
    "f5f71f5d": _med_farg(_NITTIO_SPEC, "Cremevit"),
    "dd3b541b": _med_farg(_NITTIO_SPEC, "Grå"),
    "f489937f": _med_farg(_PELARE_SPEC, "Mörkgrå med ljusgrå kudde"),
    "5616c567": _med_farg(_PELARE_SPEC, "Ljusbrun med gräddvit kudde"),
    "1ae60dbc": _med_farg(_TRAPP_SPEC, "Beige"),
    "819bf51c": _med_farg(_TRAPP_SPEC, "Ljusgrå med mörkgrå stammar"),
}

SKOTSEL = {
    "c7bd00b9": (
        "Damm och kattlo borstas av plyschen med en gummiborste eller en fuktig "
        "hand — båda drar med sig hår som en dammsugare inte kommer åt. Sisalen "
        "på stammen dammsugs med möbelmunstycket; är ett varv på väg att lossna "
        "trycker du tillbaka det och sätter en droppe trälim under änden innan "
        "det rullar upp sig. Kontrollera takspännets åtdragning varje gång du "
        "dammsuger runt möbeln, och efter varje gång den flyttats."),
    "a73a1a1c": (
        "Borsta plyschen med en gummiborste eller en fuktad hand; det tar hår "
        "som dammsugaren lämnar kvar. Sisalstammen dammsugs med "
        "möbelmunstycket, och en lindning som börjat lossna trycks tillbaka och "
        "limmas i änden med en droppe trälim. Efterdra takspännet med jämna "
        "mellanrum — det är den infästning hela möbeln vilar på."),
    "f5f71f5d": (
        "Plyschen borstas med en gummiborste; håret släpper lättare än med en "
        "dammsugare. Inne i kojan samlas hår längs botten — ett smalt "
        "fogmunstycke når in genom ingången på Ø18 cm. Hängmattans tyg går att "
        "torka av med en fuktig trasa och ska sedan torka helt innan katten "
        "lägger sig i den igen. Kontrollera stolparnas skruvar efter någon "
        "månads användning."),
    "dd3b541b": (
        "Borsta plyschen med en gummiborste och dammsug sisalstolparna med "
        "möbelmunstycket. Kojans botten nås med ett smalt fogmunstycke genom "
        "ingången på Ø18 cm. Hängmattan torkas av med fuktig trasa och får "
        "torka helt innan den används igen. Efterdra skruvarna efter ungefär en "
        "månad — det är i fogarna en klösmöbel blir lös, inte i materialet."),
    "f489937f": (
        "Kudden lyfts av och skakas ur; den ligger löst i bädden och behöver "
        "inte knäppas loss. Bouclétyget borstas med en gummiborste, som får med "
        "sig hår ur den krusiga ytan bättre än en dammsugare. Sisalstammen på "
        "Ø16,5 cm är den del som slits, och lösa fibrer klipps av med sax "
        "i stället för att dras — ett ryck tar med sig hela varvet."),
    "5616c567": (
        "Ta av kudden och skaka ur den. Bouclétyget borstas med gummiborste, "
        "som drar ur hår ur den krusiga väven. Sisalen på stammen fransar sig "
        "med tiden — klipp av lösa fibrer med sax, dra dem aldrig, eftersom ett "
        "ryck följer varvet hela vägen runt. Dammsug sockeln undertill när du "
        "flyttar pelaren."),
    "1ae60dbc": (
        "Stegen borstas av med en gummiborste. Inne i kojan samlas hår längs "
        "botten — ett smalt fogmunstycke når in genom ingången på Ø16 cm. "
        "Klösstammarna dammsugs med möbelmunstycket. Efterdra skruvarna i "
        "stegen med jämna mellanrum: en trappa tar last vid varje kliv, till "
        "skillnad från en möbel katten bara ligger på."),
    "819bf51c": (
        "Borsta stegen med en gummiborste och dammsug stammarna med "
        "möbelmunstycket. Kojans botten nås med ett smalt fogmunstycke genom "
        "ingången på Ø16 cm. Skruvarna i stegen ska efterdras med jämna "
        "mellanrum — trappan belastas vid varje kliv, vilket sliter mer på "
        "fogarna än en möbel katten bara vilar på."),
}

_TAK_FAQ = [
    ("Passar den i mitt rum?",
     "Möbeln ställs in mellan 230 och 250 cm. Mät från golv till tak där du "
     "tänkt ställa den — är takhöjden högre än 250 cm når spännet inte fram, "
     "och är den lägre än 230 cm går möbeln inte att korta ner."),
    ("Håller den i ett undertak?",
     "Nej, inte utan infästning. Takspännet trycker uppåt mot taket, och en "
     "lös gipsskiva i ett nedpendlat undertak tar inte den kraften. Behöver du "
     "en möbel som står fritt på golvet finns lägre klösträd med bred sockel."),
    ("Ingår tippskyddet?",
     "Ja. Både takspännet och tippskyddet följer med, och båda ska monteras — "
     "spännet håller stammen lodrät, tippskyddet fångar sidokrafter när katten "
     "landar."),
    ("Hur många katter rymmer den?",
     "Planen är Ø34 cm och rymmer en ihoprullad katt åt gången. Med två katter "
     "i hushållet fungerar möbeln som klättervägg för båda, men bara den ena i "
     "taget får plats att ligga på ett plan."),
]
_NITTIO_FAQ = [
    ("Är utrymmet längst ner öppet eller slutet?",
     "Slutet. Kojan har väggar på alla sidor och tak, och nås genom en rund "
     "ingång på Ø18 cm. Det gör den mörk inuti, vilket är poängen — katten "
     "drar sig undan dit."),
    ("Ryms min katt i kojan?",
     "Kojan mäter 30 × 30 cm invändigt och är 28 cm hög, med en ingång på "
     "Ø18 cm. Det räcker för en normalstor eller mindre katt. En storvuxen "
     "katt får kliva in med besvär och väljer troligen bädden överst i stället."),
    ("Behöver den stå mot en vägg?",
     "Nej. Sockeln är 48 × 48 cm och bär möbeln fritt. En sida mot en vägg är "
     "ändå bra om katten hoppar upp i hängmattan med fart, eftersom tyngden då "
     "hamnar mitt emellan stolparna."),
    ("Går klädseln att tvätta?",
     "Hängmattans tyg torkas av med fuktig trasa och får torka helt. Plyschen "
     "på övriga ytor är fast monterad och borstas i stället — en gummiborste "
     "tar hår bättre än en dammsugare."),
]
_PELARE_FAQ = [
    ("Varför är stammen så grov?",
     "Stammen mäter Ø16,5 cm. Grovleken gör att katten får fäste med hela "
     "tassen i stället för bara klorna, vilket är närmare hur en katt klöser "
     "på en trädstam."),
    ("Hur mycket tål den?",
     "Konstruktionen bär 10 kg, och den rekommenderade kattvikten är upp till "
     "5 kg. De två talen mäter olika saker: 10 kg är vad möbeln håller, 5 kg "
     "är den katt den är byggd för."),
    ("Räcker den som enda klösmöbel?",
     "Den räcker för klösandet, men den har bara en nivå att ligga på. En katt "
     "som gärna klättrar mellan höjder trivs bättre med ett klösträd som har "
     "flera plan."),
    ("Går kudden att ta bort?",
     "Ja, den ligger löst i bädden och lyfts ur för att skakas eller vädras. "
     "Bädden har 8 cm kant runt om, så kudden ligger kvar även när katten "
     "rör sig i den."),
]
_TRAPP_FAQ = [
    ("Hur hög blir trappan?",
     "Översta steget ligger 66 cm över golvet. Mät höjden på soffan eller "
     "sängen först — är kanten högre än så får katten fortfarande ta ett "
     "sista kliv."),
    ("Går den att göra lägre?",
     "Ja. Trappan kan monteras med tre steg i stället för fyra, och slutar då "
     "på 50 cm. Steghöjderna blir 18, 33 och 50 cm."),
    ("Vad är utrymmet under trappan?",
     "En sluten koja på 38 × 27 cm invändigt och 30 cm hög, med en rund ingång "
     "på Ø16 cm. Den fungerar som en gömd sovplats under stegen."),
    ("Står den stadigt när katten går på den?",
     "Sockeln mäter 60 × 40 cm och tar upp tyngden. Skjut in trappan ända mot "
     "soffan eller sängen så att översta steget möter kanten, och lägg en matta "
     "under om golvet är halt."),
]
FAQ = {
    "c7bd00b9": _TAK_FAQ, "a73a1a1c": _TAK_FAQ,
    "f5f71f5d": _NITTIO_FAQ, "dd3b541b": _NITTIO_FAQ,
    "f489937f": _PELARE_FAQ, "5616c567": _PELARE_FAQ,
    "1ae60dbc": _TRAPP_FAQ, "819bf51c": _TRAPP_FAQ,
}

SOKORDSLISTA = {
    "c7bd00b9": ["takspänt klösträd", "klösträd till taket", "klösträd 250 cm",
                 "smalt klösträd", "klösträd med hängmatta"],
    "a73a1a1c": ["takspänt klösträd grått", "grått klösträd till taket",
                 "klösträd 250 cm", "smalt klösträd", "klösträd med hängmatta"],
    "f5f71f5d": ["klösträd med koja", "klösträd 90 cm", "klösträd med hängmatta",
                 "cremevitt klösträd", "klösträd tre nivåer"],
    "dd3b541b": ["klösträd grått 90 cm", "grått klösträd med koja",
                 "klösträd med hängmatta", "klösträd tre nivåer", "klösträd med bädd"],
    "f489937f": ["klöspelare med bädd", "grov klöspelare", "klöspelare 91 cm",
                 "klösstam sisal", "klöspelare mörkgrå"],
    "5616c567": ["klöspelare ljusbrun", "grov klöspelare", "klöspelare 91 cm",
                 "klösstam sisal", "klöspelare med bädd"],
    "1ae60dbc": ["kattrappa", "trappa för katt", "kattrappa till säng",
                 "kattrappa med koja", "trappa äldre katt"],
    "819bf51c": ["kattrappa grå", "trappa för katt", "kattrappa till soffa",
                 "kattrappa med koja", "trappa äldre katt"],
}

BAS = "https://www.fyndplats.se"


def _p(t):
    return "<p>" + t + "</p>"


def bygg(pid):
    """Bygger plainDescription. Ordningen speglar runda 135 och 136 exakt.

    ☠️ BLOCKORDNINGEN ÄR INTE FRI. Butikens flikdelare är en allowlist på
       fyra strängar (`grindar.FLIKAR_SOM_KRAVS`); allt efter en träff hamnar
       i den fliken. Korslänkarna måste därför ligga FÖRE
       `Tekniska specifikationer`.
    """
    d = []
    d.append(_p(INTRO[pid]))

    d.append("<h2>" + RUBRIK[pid] + "</h2>")
    d.append("<ul>" + "".join("<li>" + x + "</li>" for x in PUNKTER[pid]) + "</ul>")

    d.append("<h2>" + KATT_RUBRIK[pid] + "</h2>")
    d.append(_p(KATT[pid]))

    d.append("<h2>" + BRUK_RUBRIK[pid] + "</h2>")
    d.append(_p(BRUK[pid]))

    d.append("<h2>" + KORS_INGRESS[pid] + "</h2>")
    # ☠️ ABSOLUT URL, ALDRIG ROTRELATIV: en href som börjar på "/produkt/"
    #    skrivs om av Wix till "https:/produkt/…" — ETT snedstreck, alltså
    #    värden "produkt", alltså död länk.
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


if __name__ == "__main__":
    for pid in NAMN:
        h = bygg(pid)
        print("%s  namn=%d titel=%d meta=%d  html=%d  sku=%s"
              % (pid, len(NAMN[pid]), len(TITEL[pid]), len(META[pid]),
                 len(h), SKU[pid]))
