# -*- coding: utf-8 -*-
"""Runda 136 — kundtexterna. En datafil; byggandet bor i bygg().

☠️ SKRIV TEXTEN I EN FIL FÖRST. En sträng som skrivs direkt i ett JSON-anrop
   kan inte läsas av en grind innan den lämnar chatten, och API-svaret ekar
   tillbaka exakt det man skrev. Uppmätt 9 fel mot 0 (2026-09-04).

☠️ Skriv ALDRIG ut leverantörens namn, artikelnummer eller avsändarland.
☠️ Rör ALDRIG priset.
☠️ Mot kunden är VI leverantören — skriv aldrig "leverantören anger".
☠️ INGEN VARUVIKT. Spec-blockets `Vikt` är fraktvikten (#488).

☠️ INGEN TIPPSKYDDSUTFÄSTELSE PÅ NÅGON AV DE ÅTTA. Två av dem lovar en rem
   respektive ett "inbyggt" tippskydd i PROSAN, men ingen leveranslista
   nämner något sådant. Lieferumfang är kontraktet (#468, #423).

☠️ TVÅ SIDOR FÅR INGEN LASTSIFFRA ALLS. `4a5acc7d` anger varken maxlast
   eller kattvikt; `860b6eb9` anger kattvikt men INGEN totallast, samtidigt
   som prosan marknadsför den för tre katter. Ett härlett tal är ett
   påhittat tal.

☠️ PRODUKTTYPEN ÄR TRE OLIKA ORD I DEN HÄR RUNDAN, och de får inte glida:
   `860b6eb9` är en KLÖSTUNNA (källan säger `Katzentonnen-Größe`,
   `Kratztonne`, `1 x Katzenfass` — `Gesamtabmessungen` är sockeln),
   `4a5acc7d` är ett KLÖSTORN (sluten fyrkantig stomme, 41 × 41, samma form
   som publicerade `klostorn-81-cm-fyrkantigt`), och de sex andra är
   KLÖSTRÄD. Leverantörens namn kallar de två första "Katzenturm" — och
   leverantörens produktnamn är ingen källa (#462).

⚠️ `ae1c848f`:s materialrad säger "30 % Nitril", vilket är ett GUMMI och
   ingen textilfiber. Skrivs som polyesterblandning.
⚠️ `ae1c848f`:s "Katzenhöhle 17,5 × 17 cm" är husets INGÅNG, inte ett andra
   utrymme — 17,5 × 17 cm rymmer ingen katt.
⚠️ `7f8e495b`:s `Schilfrohr` är VASS, inte kaveldun och inte rotting.
"""
import os as _os
import sys as _sys

_sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), ".."))
import grindar as _G                                             # noqa: E402

NAMN = {
    "4a5acc7d": "Klöstorn 100 cm med tre hålor – bädd på toppen och hängande bollar",
    "860b6eb9": "Klöstunna 101 cm med tre hålor – sisalstam och hoppsteg upp till bädden",
    "05136778": "Klösträd 160 cm med två kojor, bädd på toppen och sisalstolpar",
    "105c685a": "Klösträd 139 cm med bladkrona – grön koja, klösskiva och lekbollar",
    "7f8e495b": "Klösträd 79 cm i vass och sisal – korgkoja med bädd på toppen",
    "ae1c848f": "Klösträd 79 cm med rund koja – bred liggyta och jutestammar",
    "f8528666": "Klösträd 98 cm med flätad koja – korgbädd, klösramp och liggyta",
    "63a586da": "Klösträd 104 cm med liggtunnel – kantad topplatta och sisalstammar",
}

# ☠️ SLUGGEN VÄLJS SÅ ATT DET SOM SKILJER PRODUKTERNA ÅT RYMS FÖRE KAPNINGEN.
#    `grindar.sku_bas` fogar ihop tokens till HÖGST 24 tecken och bryter på
#    hel ordgräns (#473, #483, #489). Alla åtta sluggar nedan ger en HEL SKU
#    — inget token faller bort. Rundan har dessutom ett eget höjdpar (två
#    klösträd på 79 cm), så höjden ensam räcker inte som skiljetecken.
SLUG = {
    "4a5acc7d": "klostorn-100-cm-halor",
    "860b6eb9": "klostunna-101-cm-steg",
    "05136778": "klostrad-160-cm-kojor",
    "105c685a": "klostrad-139-cm-blad",
    "7f8e495b": "klostrad-79-cm-korgkoja",
    "ae1c848f": "klostrad-79-cm-rund-koja",
    "f8528666": "klostrad-98-cm-korgbadd",
    "63a586da": "klostrad-104-cm-tunnel",
}

SKU = {pid: "FP-" + _G.sku_bas(slug) for pid, slug in SLUG.items()}

TITEL = {
    "4a5acc7d": "Klöstorn 100 cm med tre hålor | Fyndplats",
    "860b6eb9": "Klöstunna 101 cm med tre hålor | Fyndplats",
    "05136778": "Klösträd 160 cm med två kojor och hängmatta | Fyndplats",
    "105c685a": "Klösträd 139 cm med bladkrona | Fyndplats",
    "7f8e495b": "Klösträd 79 cm i flätad vass med korgkoja | Fyndplats",
    "ae1c848f": "Klösträd 79 cm med rund koja och bred liggyta | Fyndplats",
    "f8528666": "Klösträd 98 cm med flätad koja och korgbädd | Fyndplats",
    "63a586da": "Klösträd 104 cm med liggtunnel | Fyndplats",
}

META = {
    "4a5acc7d": ("Klöstorn 100 cm i grått med tre hålor på 18 × 18 cm, en "
                 "bädd överst och en boll i varje håla. Sockel 41 × 41 cm."),
    "860b6eb9": ("Klöstunna 101 cm på bred fot, med tre hålor, hoppsteg "
                 "längs en sisalstam och bädd överst. Katter upp till 6 kg."),
    "05136778": ("Klösträd 160 cm med två kojor, hängmatta, stege och en "
                 "rund bädd överst. Sockel 48 × 48 cm och bär 15 kg."),
    "105c685a": ("Klösträd 139 cm i grönt med bladkrona, koja på Ø30 cm, "
                 "rund klösskiva och hängande bollar. Bär 10 kg."),
    "7f8e495b": ("Lågt klösträd 79 cm med koja av flätad vass, rund bädd "
                 "överst och mellanplan. Sockel 60 × 40 cm och bär 10 kg."),
    "ae1c848f": ("Lågt klösträd 79 cm med rund koja, liggyta på 60 × 40 cm "
                 "och jutelindade stammar. Bär 15 kg, katter upp till 8 kg."),
    "f8528666": ("Klösträd 98 cm med flätad koja, korgbädd överst, klösramp "
                 "och rund liggyta. Bär 20 kg totalt och 10 kg per plan."),
    "63a586da": ("Klösträd 104 cm med liggtunnel på Ø32 cm, topplatta "
                 "51 × 33 cm med uppvikt kant och en sidoplattform."),
}

SOKORD = {
    "4a5acc7d": "klöstorn 100 cm",
    "860b6eb9": "klöstunna 101 cm",
    "05136778": "klösträd 160 cm",
    "105c685a": "klösträd med bladkrona",
    "7f8e495b": "klösträd i vass",
    "ae1c848f": "lågt klösträd med koja",
    "f8528666": "klösträd med flätad koja",
    "63a586da": "klösträd med tunnel",
}

INTRO = {
    "4a5acc7d": (
        "Ett klöstorn på 100 cm som är byggt som ett hus i tre våningar i "
        "stället för som ett träd. Stommen är sluten runt om och klädd i "
        "grå mattextil, och på tre av sidorna sitter en håla på 18 × 18 cm "
        "med vit plyschkant och en boll som dinglar i öppningen. Varje "
        "våning är 39,5 × 39,5 cm och 29 cm hög — alltså ett riktigt rum, "
        "inte en nisch. Överst ligger en bädd med uppvikt kant."),
    "860b6eb9": (
        "En klöstunna på 101 cm som står på en bred fot i stället för på en "
        "smal sockel. Tunnan är Ø36 cm och har tre hålor på 17 × 16 cm, "
        "var och en med vit plyschkant och en boll i öppningen. Invändigt "
        "är utrymmet Ø35 cm och 29 cm högt, och överst ligger en bädd på "
        "Ø35 cm med 6 cm djup liggyta. Längs sidan går en sisalstam med "
        "hoppsteg, så katten tar sig upp till toppen i två kliv."),
    "05136778": (
        "Ett klösträd på 160 cm för hushåll där katten gärna byter plats. "
        "Två kojor sitter på var sin höjd — den nedre 30 × 30 cm, den övre "
        "45 × 30 cm, båda 29 cm höga — och överst ligger en bädd på Ø30 cm. "
        "En hängmatta på Ø30 cm sitter på sidan och en stege på 43 × 18 cm "
        "leder upp från golvet. Sockeln mäter 48 × 48 cm."),
    "105c685a": (
        "Ett klösträd på 139 cm som ser ut som en planta och beter sig som "
        "en klösmöbel. Högst upp sitter en krona av blad, under den en rund "
        "klösskiva på Ø30 cm, och i mitten en grön koja på Ø30 cm med en "
        "ingång på 19 × 22 cm. Stammarna är Ø7 cm och lindade i jute, och "
        "en stege på 40 × 15 cm klädd i sisal går upp längs framsidan."),
    "7f8e495b": (
        "Ett lågt klösträd på 79 cm där kojan är flätad av vass i stället "
        "för klädd i tyg. Huset är Ø40 cm och 30 cm högt med en rund "
        "öppning på Ø20 cm, och inuti ligger en dyna på Ø32 cm. Ovanför "
        "sitter en bädd på Ø34 cm på en sisallindad stam, och mellan dem "
        "en plattform på 40 × 24 cm. Sockeln mäter 60 × 40 cm."),
    "ae1c848f": (
        "Ett lågt klösträd på 79 cm med ovanligt gott om liggyta. Den övre "
        "plattformen är 60 × 40 cm — bredare än de flesta i den här höjden "
        "— med en 9,5 cm hög kant runt om och 58,5 × 37 cm fri yta "
        "invändigt. Under den sitter en rund koja på Ø36 cm och 24 cm höjd "
        "med en ingång på 17,5 × 17 cm. Stammarna är Ø9,1 cm och lindade "
        "i jute."),
    "f8528666": (
        "Ett klösträd på 98 cm där både kojan och bädden är flätade. Huset "
        "är 46 × 33,5 cm och 24,5 cm högt med en fyrkantig ingång på "
        "20 × 20 cm och ett runt hål i taket, så katten kan gå in "
        "antingen underifrån eller uppifrån. Överst sitter en flätad bädd "
        "på 34 × 34 cm, och en klösramp på 30 × 20 cm lutar upp från "
        "golvet. Sockeln mäter 60 × 40 cm."),
    "63a586da": (
        "Ett klösträd på 104 cm som är byggt kring en liggtunnel i stället "
        "för kring en koja. Tunnen är Ø32 cm och 40 cm lång, med Ø29 cm "
        "fritt invändigt och en pompong som hänger i öppningen. Ovanför "
        "ligger en topplatta på 51 × 33 cm med en 7 cm hög kant hela vägen "
        "runt, och bredvid en lägre plattform på 31 × 29 cm. Sockeln är "
        "60 × 40 cm."),
}

RUBRIK = {p: "Det här får du" for p in NAMN}

PUNKTER = {
    "4a5acc7d": [
        "Tre hålor på 18 × 18 cm, en per våning, med vit plyschkant",
        "Varje våning 39,5 × 39,5 cm och 29 cm hög invändigt",
        "Bädd på 39,5 × 39,5 cm överst, 4 cm hög med uppvikt kant",
        "Tre bollar som dinglar i öppningarna",
        "Sluten stomme i spånskiva klädd i grå mattextil",
        "Sockel 41 × 41 cm, total höjd 100 cm",
        "Monteras med bifogad anvisning",
    ],
    "860b6eb9": [
        "Tunna på Ø36 cm med tre hålor på 17 × 16 cm",
        "Ø35 cm och 29 cm högt invändigt",
        "Bädd på Ø35 cm överst med 6 cm djup liggyta",
        "Hoppsteg på 35 × 24 cm längs sisalstammen",
        "Stam Ø7 cm utvändigt med 4 mm sisalrep",
        "Bred fot på 50 × 36 cm, total höjd 101 cm",
        "Passar katter upp till 6 kg",
    ],
    "05136778": [
        "Nedre koja på 30 × 30 cm, 29 cm hög",
        "Övre koja på 45 × 30 cm, 29 cm hög",
        "Bädd på Ø30 cm överst, 10 cm hög",
        "Hängmatta på Ø30 cm på sidan",
        "Stege på 43 × 18 cm klädd i plysch",
        "Sockel 48 × 48 cm, total höjd 160 cm",
        "Bär 15 kg, passar 1–3 katter under 5 kg",
    ],
    "105c685a": [
        "Grön koja på Ø30 cm, 27,5 cm hög, med ingång på 19 × 22 cm",
        "Rund klösskiva på Ø30 cm i sisal",
        "Bladkrona högst upp, bladen 30 × 14 cm och 24 × 12 cm",
        "Plattformar på 24 × 44 cm och 48 × 30 cm",
        "Stege på 40 × 15 cm och stammar på Ø7 cm lindade i jute",
        "Sockel 48 × 44 cm, total höjd 139 cm",
        "Bär 10 kg, passar 1–2 katter upp till 5 kg",
    ],
    "7f8e495b": [
        "Koja av flätad vass, Ø40 cm och 30 cm hög, öppning Ø20 cm",
        "Dyna på Ø32 cm inne i kojan",
        "Bädd på Ø34 cm överst, Ø33 cm och 9 cm djup invändigt",
        "Kantad bädd på Ø35 cm i kojans tak, Ø25 cm invändigt",
        "Plattform på 40 × 24 cm mellan planen",
        "Stammar på Ø7 cm lindade i sisal, sockel 60 × 40 cm",
        "Total höjd 79 cm, bär 10 kg, passar 1–2 katter upp till 5 kg",
    ],
    "ae1c848f": [
        "Liggyta på 60 × 40 cm med 9,5 cm hög kant, 58,5 × 37 cm invändigt",
        "Rund koja på Ø36 cm, 24 cm hög",
        "Ingång på 17,5 × 17 cm med plyschkant",
        "Stammar på Ø9,1 cm lindade i jute",
        "Sockel 70 × 49 cm, total höjd 79 cm",
        "Bär 15 kg, passar katter upp till 8 kg",
        "Monteras med bifogad anvisning",
    ],
    "f8528666": [
        "Flätad koja på 46 × 33,5 cm, 24,5 cm hög, ingång 20 × 20 cm",
        "Runt hål i kojans tak som andra väg in",
        "Flätad bädd på 34 × 34 cm överst, 12 cm hög",
        "Klösramp på 30 × 20 cm som lutar upp från golvet",
        "Rund liggyta på Ø30 cm och plattform på 30 × 20 cm",
        "Sockel 60 × 40 cm, total höjd 98 cm",
        "Bär 20 kg totalt och 10 kg per plan, katter under 6 kg",
    ],
    "63a586da": [
        "Liggtunnel på Ø32 cm, 40 cm lång, Ø29 cm invändigt",
        "Topplatta på 51 × 33 cm med 7 cm hög kant, 47 × 29 cm invändigt",
        "Sidoplattform på 31 × 29 cm",
        "Pompong i snöre som hänger i tunnelns öppning",
        "Stammar på Ø7,1 cm klädda i sisal",
        "Sockel 60 × 40 cm, total höjd 104 cm",
        "Bär 5 kg, byggt för en katt",
    ],
}

KATT_RUBRIK = {p: "Vilken katt den passar" for p in NAMN}

KATT = {
    "4a5acc7d": (
        "Den här är för katten som hellre gömmer sig än sitter på utsikt. "
        "Tre slutna rum ovanpå varandra ger tre olika platser att dra sig "
        "undan till, och eftersom varje våning är 29 cm hög kan en vuxen "
        "katt sitta upprätt inne i den. Hålorna på 18 × 18 cm är breda nog "
        "för en normalstor katt men smala nog att kännas skyddade. Vill du "
        "ha utsikt i stället för gömställe är ett öppet klösträd med "
        "plattformar ett bättre val."),
    # ☠️ INGET KATTANTAL. Prosan marknadsför tunnan för tre katter utan att
    #    ange någon totallast; den enda siffra källan belägger är kattens
    #    vikt. Ett första utkast av det här stycket skrev "två katter kan
    #    använda tunnan samtidigt" — samma påstående i mindre format, och
    #    lika obelagt.
    "860b6eb9": (
        "Passar katter upp till 6 kg. Tunnan är Ø35 cm invändigt och 29 cm "
        "hög, alltså tillräckligt för att en vuxen katt ska kunna rulla "
        "ihop sig helt. Hålorna sitter på var sin höjd runt tunnan i "
        "stället för på rad, så katten kan gå in och ut åt olika håll. "
        "Hoppstegen längs sisalstammen gör toppen nåbar i två kliv i "
        "stället för ett långt språng — bra för äldre katter som inte "
        "längre hoppar högt."),
    "05136778": (
        "Byggd för 1–3 katter under 5 kg, och bärförmågan är 15 kg. Det är "
        "de två kojorna på var sin höjd som gör den till en flerkattsmöbel: "
        "två katter kan ligga inne samtidigt utan att dela utrymme, och den "
        "som hellre ligger öppet tar hängmattan eller bädden överst. Stegen "
        "på 43 × 18 cm ger en väg upp som inte kräver ett hopp från golvet."),
    "105c685a": (
        "Passar 1–2 katter upp till 5 kg och bär 10 kg. Kojan är Ø30 cm och "
        "27,5 cm hög invändigt, vilket räcker för en normalstor katt som "
        "ligger ihoprullad men inte för två samtidigt. Klösskivan sitter "
        "lodrätt i den höjd där en katt som reser sig på bakbenen kommer åt "
        "den, och bladen högst upp tål att katten petar på dem."),
    "7f8e495b": (
        "Passar 1–2 katter upp till 5 kg och bär 10 kg. Höjden på 79 cm gör "
        "den lätt att nå för en katt som blivit stel i hopparna, och de tre "
        "nivåerna ligger tätt så att varje steg blir kort. Vassen i kojan "
        "är styvare och svalare än plysch — en del katter föredrar den på "
        "sommaren, och den som hellre ligger mjukt har dynan på Ø32 cm "
        "inuti och bädden ovanpå."),
    "ae1c848f": (
        "Bär 15 kg och passar katter upp till 8 kg, alltså även storvuxna "
        "raser. Liggytan på 60 × 40 cm är det som skiljer den från de "
        "flesta klösträd i den här höjden: det är plats nog för en stor "
        "katt att sträcka ut sig helt, och kanten på 9,5 cm går runt hela "
        "ytan så att katten kan luta huvudet mot något. Kojan under är "
        "Ø36 cm och 24 cm hög."),
    "f8528666": (
        "Bär 20 kg totalt och 10 kg per plan, och passar katter under 6 kg. "
        "Två ingångar till samma koja gör den ovanligt lätt att acceptera "
        "för en katt som är försiktig med slutna utrymmen — den kan gå ut "
        "genom taket om den blir störd vid dörren. Rampen på 30 × 20 cm är "
        "både väg upp och klösyta, så katten vässar klorna på vägen förbi."),
    "63a586da": (
        "Byggd för en katt: bärförmågan är 5 kg och tunneln är Ø29 cm "
        "invändigt, alltså rätt mått för en normalstor katt som ligger "
        "ihoprullad. Topplattan på 51 × 33 cm är rymlig i förhållande till "
        "möbelns storlek och har en 7 cm hög kant runt om. Har du två "
        "katter är ett klösträd med högre bärförmåga och flera plan ett "
        "bättre val."),
}

BRUK_RUBRIK = {p: "Att tänka på" for p in NAMN}

BRUK = {
    "4a5acc7d": (
        "Stommen är sluten på alla fyra sidor, så tornet står stadigt av "
        "egen tyngd och behöver ingen vägg bakom sig. Ställ det ändå med "
        "en sida mot en vägg om katten brukar ta sats: ett torn på "
        "41 × 41 cm sockel har en smal fotavtryck i förhållande till sina "
        "100 cm. Hålorna ligger på olika sidor, så vänd den sida du vill "
        "att katten ska använda utåt i rummet."),
    "860b6eb9": (
        "Foten är 50 × 36 cm, alltså bredare än tunnan på Ø36 cm — det är "
        "den som håller möbeln upprätt när katten hoppar upp på "
        "hoppstegen. Ställ den med foten helt på golvet och inte halvt på "
        "en matta, så att hela ytan bär. Sisalstammen har 4 mm rep, som "
        "är den grovlek katter får bäst grepp om."),
    "05136778": (
        "Med 160 cm höjd och 48 × 48 cm sockel är det här den smalaste "
        "höga modellen vi har, och den vill stå intill en vägg. Ställ den "
        "i ett hörn om du kan: två väggar tar upp sidokrafter när katten "
        "landar i den övre kojan. Montera nerifrån och upp och dra åt alla "
        "skruvar helt innan katten släpps på — en ledad hög möbel svajar "
        "mer för varje gång den används."),
    "105c685a": (
        "Bladen högst upp sitter på en böjlig stam och är gjorda för att "
        "svaja. Ge dem fritt utrymme uppåt så att de inte tar i en hylla "
        "eller en lampa. Stegen på 40 × 15 cm sitter på framsidan, så "
        "vänd den mot rummet och inte in mot väggen."),
    "7f8e495b": (
        "Vassen är ett naturmaterial och torkar ut i torr luft. Ställ "
        "kojan en bit från ett element så att flätningen inte blir spröd "
        "under vintern. Med 79 cm höjd och 60 × 40 cm sockel står den "
        "stadigt fritt i rummet, men ställ den inte på en tjock matta — "
        "då lutar den åt det håll sockeln sjunker."),
    "ae1c848f": (
        "Sockeln är 70 × 49 cm, vilket är stort i förhållande till höjden "
        "på 79 cm — den står alltså stadigt fritt i rummet. Den breda "
        "liggytan hänger ut över en av stammarna, så ställ den sidan mot "
        "rummet och inte in i en trång passage där någon kan gå emot den. "
        "Jutelindningen nöts och blir luddig med tiden, vilket är normalt "
        "och inte ett tecken på att stammen är på väg av."),
    "f8528666": (
        "Rampen lutar upp från golvet och tar plats framför möbeln — räkna "
        "med fritt utrymme framför sockeln på 60 × 40 cm. Flätningen i "
        "koja och bädd är naturmaterial och kan lossa i en tråd om katten "
        "får klösa direkt i den; rampen finns för att ge klorna ett bättre "
        "ställe, så placera den så att katten passerar den på vägen upp."),
    "63a586da": (
        "Tunneln hänger fritt mellan stammarna och rör sig något när "
        "katten går in. Det är meningen, men det betyder också att möbeln "
        "ska stå på plant golv — på en lutande yta pendlar tunneln åt ett "
        "håll. Pompongen sitter i ett snöre och går att knyta upp om "
        "katten hellre är ifred i tunneln."),
}

KORS_INGRESS = {p: "Passar inte den här?" for p in NAMN}
KORS_TEXT = {p: "Fler klösmöbler hos oss:" for p in NAMN}

# ☠️ ETT LÄNKAT TAL FÅR BARA STÅ I LÄNKENS EGET STYCKE. Talen i länktexterna
#    nedan tillhör SYSKONEN, inte den här produkten — talgrinden zonindelar
#    därför per stycke och tillåter dem bara där `<a href` faktiskt står.
KORSLANK = {
    "4a5acc7d": [("klostorn-81-cm-fyrkantigt", "Klöstorn 81 cm, fyrkantigt"),
                 ("klostunna-96-cm-gra", "Klöstunna 96 cm i grått"),
                 ("klostrad-90-cm-dubbelhala", "Klösträd 90 cm med dubbel koja")],
    "860b6eb9": [("klostunna-100-cm-tva-grottor-gra", "Klöstunna 100 cm med två grottor"),
                 ("klostunna-96-cm-gra", "Klöstunna 96 cm i grått"),
                 ("klostorn-81-cm-fyrkantigt", "Klöstorn 81 cm, fyrkantigt")],
    "05136778": [("klostrad-140-cm", "Klösträd 140 cm med flera plattformar"),
                 ("klostrad-170-cm-med-tva-kojor", "Klösträd 170 cm med två kojor"),
                 ("klostrad-152-cm-bred-bas", "Klösträd 152 cm med bred bas")],
    "105c685a": [("klostrad-98-cm-bladkrona", "Klösträd 98 cm med bladkrona"),
                 ("klostrad-140-cm", "Klösträd 140 cm med flera plattformar"),
                 ("klostrad-114-cm-med-koja", "Klösträd 114 cm med koja")],
    "7f8e495b": [("klostrad-100-cm-flatad-kupol", "Klösträd 100 cm med flätad kupolhydda"),
                 ("klostrad-rotting-95-cm", "Klösträd i rotting 95 cm"),
                 ("klostrad-lagt-tra-och-jute", "Klösträd 61,5 cm i trä och jute")],
    "ae1c848f": [("klostrad-lagt-tra-och-jute", "Klösträd 61,5 cm i trä och jute"),
                 ("klostrad-53-cm-tradstamsform", "Klösträd 53 cm i trädstamsform"),
                 ("klostrad-90-cm-dubbelhala", "Klösträd 90 cm med dubbel koja")],
    "f8528666": [("klostrad-100-cm-flatad-kupol", "Klösträd 100 cm med flätad kupolhydda"),
                 ("klostrad-150-cm-tva-flatade-kojor", "Klösträd 150 cm med två flätade kojor"),
                 ("klostrad-rotting-174-cm-flatad-koja", "Klösträd i rotting 174 cm")],
    "63a586da": [("klostrad-med-koja", "Klösträd 104 cm med koja och hängmatta"),
                 ("klostrad-98-cm-fardesign-tunnel", "Klösträd 98 cm i fårdesign med tunnel"),
                 ("klostrad-114-cm-med-koja", "Klösträd 114 cm med koja")],
}

SPEC = {
    "4a5acc7d": [
        ("Mått", "41 × 41 × 100 cm"),
        ("Sockel", "41 × 41 cm"),
        ("Våning invändigt", "39,5 × 39,5 cm, 29 cm hög"),
        ("Håla", "18 × 18 cm, tre stycken"),
        ("Bädd", "39,5 × 39,5 cm, 4 cm hög"),
        ("Leksak", "tre bollar i snöre"),
        ("Material", "spånskiva, mattextil och plysch (polyester)"),
        ("Färg", "grått mot vitt"),
        ("Montering", "krävs"),
    ],
    "860b6eb9": [
        ("Mått", "50 × 36 × 101 cm"),
        ("Fot", "50 × 36 cm"),
        ("Tunna", "Ø36 cm, 101 cm hög"),
        ("Invändigt", "Ø35 cm, 29 cm högt"),
        ("Håla", "17 × 16 cm, tre stycken"),
        ("Bädd", "Ø35 cm, 6 cm djup"),
        ("Hoppsteg", "35 × 24 cm"),
        ("Stam", "Ø7 cm utvändigt, Ø4,5 cm invändigt"),
        ("Sisalrep", "4 mm"),
        ("Material", "spånskiva, mattextil, plysch och sisal"),
        ("Färg", "grått och vitt mot gräddvit sisal"),
        ("Passar katt", "upp till 6 kg"),
        ("Montering", "krävs"),
    ],
    "05136778": [
        ("Mått", "48 × 48 × 160 cm"),
        ("Sockel", "48 × 48 cm"),
        ("Nedre koja", "30 × 30 cm, 29 cm hög"),
        ("Övre koja", "45 × 30 cm, 29 cm hög"),
        ("Bädd", "Ø30 cm, 10 cm hög"),
        ("Hängmatta", "Ø30 cm"),
        ("Stege", "43 × 18 cm"),
        ("Material", "spånskiva, plysch (polyester) och sisal"),
        ("Färg", "ljusgrå plysch mot gräddvitt"),
        ("Bärförmåga", "15 kg"),
        ("Passar katt", "under 5 kg, 1–3 katter"),
        ("Montering", "krävs"),
    ],
    "105c685a": [
        ("Mått", "48 × 44 × 139 cm"),
        ("Sockel", "48 × 44 cm"),
        ("Koja", "Ø30 cm, 27,5 cm hög"),
        ("Ingång", "19 × 22 cm"),
        ("Plattformar", "24 × 44 cm och 48 × 30 cm"),
        ("Klösskiva", "Ø30 cm"),
        ("Blad", "30 × 14 cm och 24 × 12 cm"),
        ("Stege", "40 × 15 cm"),
        ("Stam", "Ø7 cm"),
        ("Material", "spånskiva, jute, sisal och polyester"),
        ("Färg", "grönt mot brunt"),
        ("Bärförmåga", "10 kg"),
        ("Passar katt", "upp till 5 kg, 1–2 katter"),
        ("Montering", "krävs"),
    ],
    "7f8e495b": [
        ("Mått", "60 × 40 × 79 cm"),
        ("Sockel", "60 × 40 cm"),
        ("Koja", "Ø40 cm, 30 cm hög"),
        ("Öppning", "Ø20 cm"),
        ("Dyna", "Ø32 cm"),
        ("Övre bädd", "Ø34 cm, 10 cm hög — Ø33 cm invändigt, 9 cm djup"),
        ("Kantad bädd", "Ø35 cm, 9 cm hög — Ø25 cm invändigt, 8 cm djup"),
        ("Plattform", "40 × 24 cm"),
        ("Stam", "Ø7 cm"),
        ("Material", "spånskiva, flätad vass, sisal, plast och polyester"),
        ("Färg", "gräddvit"),
        ("Bärförmåga", "10 kg"),
        ("Passar katt", "upp till 5 kg, 1–2 katter"),
        ("Montering", "krävs"),
    ],
    "ae1c848f": [
        ("Mått", "70 × 49 × 79 cm"),
        ("Sockel", "70 × 49 cm"),
        ("Liggyta", "60 × 40 cm, 9,5 cm hög kant"),
        ("Liggyta invändigt", "58,5 × 37 cm, 8 cm djup"),
        ("Koja", "Ø36 cm, 24 cm hög"),
        ("Ingång", "17,5 × 17 cm"),
        ("Stam", "Ø9,1 cm"),
        ("Material", "spånskiva, jute, linne och polyesterblandning"),
        ("Färg", "brunt mot vitt"),
        ("Bärförmåga", "15 kg"),
        ("Passar katt", "upp till 8 kg"),
        ("Montering", "krävs"),
    ],
    "f8528666": [
        ("Mått", "60 × 40 × 98 cm"),
        ("Sockel", "60 × 40 cm"),
        ("Koja", "46 × 33,5 cm, 24,5 cm hög"),
        ("Ingång", "20 × 20 cm"),
        ("Bädd", "34 × 34 cm, 12 cm hög"),
        ("Klösramp", "30 × 20 cm"),
        ("Rund liggyta", "Ø30 cm"),
        ("Plattform", "30 × 20 cm"),
        ("Material", "spånskiva, sisalrep, vattenhyacint och plysch (polyester)"),
        ("Färg", "brunt mot beige"),
        ("Bärförmåga", "20 kg totalt, 10 kg per plan"),
        ("Passar katt", "under 6 kg"),
        ("Montering", "krävs"),
    ],
    "63a586da": [
        ("Mått", "60 × 40 × 104 cm"),
        ("Sockel", "60 × 40 cm"),
        ("Liggtunnel", "Ø32 cm, 40 cm lång — Ø29 cm invändigt"),
        ("Topplatta", "51 × 33 cm, 7 cm hög kant"),
        ("Topplatta invändigt", "47 × 29 cm, 5 cm djup"),
        ("Sidoplattform", "31 × 29 cm"),
        ("Stam", "Ø7,1 cm"),
        ("Material", "spånskiva, sisal, plysch och linneimitation i polyester"),
        ("Färg", "grått och beige mot gräddvitt"),
        ("Bärförmåga", "5 kg"),
        ("Passar katt", "under 5 kg, en katt"),
        ("Montering", "krävs"),
    ],
}

SKOTSEL = {
    "4a5acc7d": (
        "Mattextilen på stommen är den yta katten kommer att klösa i, och "
        "den blir luddig där tassarna går mest — vanligtvis runt den "
        "nedersta hålan. Borsta luddet nedåt med en styv klädborste i "
        "stället för att klippa det, så håller väven ihop längre. "
        "Plyschkanterna runt öppningarna dammsugs med möbelmunstycket. "
        "Bädden överst går att torka av med en fuktig trasa; lämna den att "
        "torka helt innan katten lägger sig där igen. Kontrollera "
        "skruvarna mellan våningarna ett par gånger om året — ett torn som "
        "börjat glappa svajar mer för varje hopp."),
    "860b6eb9": (
        "Sisalrepet på stammen nöts ojämnt: överst där katten sträcker sig "
        "högst går det snabbast. Är en varvlindning på väg att lossa, tryck "
        "tillbaka den och sätt en droppe trälim under änden innan den "
        "rullar upp sig helt. Bädden på Ø35 cm dammsugs och torkas av med "
        "fuktig trasa. Inne i tunnan samlas hår längs botten — en smal "
        "fogmunstycke når ned genom den övre öppningen. Kontrollera att "
        "foten sitter fast mot tunnan varje gång du flyttar möbeln."),
    "05136778": (
        "Med 160 cm höjd är den övre kojan det som utsätts för mest kraft "
        "när katten landar. Dra åt skruvarna där först, och gör det "
        "regelbundet — en hög möbel visar sitt glapp genom att svaja i "
        "toppen långt innan något syns nere vid sockeln. Plyschen "
        "dammsugs; hängmattan går att lyfta av och skaka ur. Sisalen på "
        "stolparna vänds inte, men en stolpe som blivit slät på ena sidan "
        "går att vrida ett kvarts varv om möbeln monteras isär."),
    "105c685a": (
        "Klösskivan på Ø30 cm är sisal och nöts jämnt över hela ytan — det "
        "är vad den är till för. Bladen är av tyg på ståltråd och går att "
        "böja tillbaka i form om de blivit skeva; torka av dem med en "
        "fuktig trasa och låt dem torka utsträckta. Jutelindningen på "
        "stammarna blir luddig med tiden, vilket inte påverkar hållfast"
        "heten. Kojan vänds upp och ned och skakas ur när hår samlats i "
        "botten."),
    "7f8e495b": (
        "Flätad vass dammsugs med det mjuka borstmunstycket och tål inte "
        "blötläggning — torka av med en lätt fuktad trasa och torka efter "
        "med en torr. Lossnar en stickande ände, klipp av den i nivå med "
        "flätningen i stället för att dra i den. Dynan på Ø32 cm och "
        "bädden överst dammsugs eller skakas ur. Kontrollera att stammen "
        "mellan sockeln och bädden sitter åt; en sisallindad stam som "
        "vridit sig går att dra åt underifrån."),
    "ae1c848f": (
        "Den breda liggytan på 60 × 40 cm är också den yta som samlar mest "
        "hår. Dammsug den med möbelmunstycket och gå längs kanten, där "
        "plyschen möter kantlisten. Jutelindningen på stammarna är avsedd "
        "att klösas och blir luddig; borsta luddet nedåt i stället för att "
        "klippa det. Kojan på Ø36 cm går att torka ur invändigt med en "
        "fuktig trasa genom ingången. Dra åt de två stammarna mot sockeln "
        "efter första månadens användning."),
    "f8528666": (
        "Vattenhyacinten i koja och bädd dammsugs med mjukt munstycke och "
        "torkas av med lätt fuktad trasa — aldrig blöt. Lossnar en tråd, "
        "klipp den i nivå med flätningen. Klösrampen är sisal och nöts "
        "jämnt; den är möbelns klösyta och ska se använd ut. Plyschen på "
        "plattformarna dammsugs. Kontrollera skruvarna där rampen möter "
        "sockeln — det är den punkt som tar mest kraft när katten springer "
        "uppför."),
    "63a586da": (
        "Tunneln är klädd invändigt och samlar hår längs botten; den "
        "enklaste vägen är ett smalt fogmunstycke rakt igenom. Utsidan är "
        "en linneimitation som dammsugs med möbelmunstycke och torkas av "
        "med fuktig trasa. Topplattans kant på 7 cm gör att damm samlas i "
        "hörnen — gå runt kanten först och ta ytan sedan. Kontrollera "
        "tunnelns infästning i stammarna ett par gånger om året; den bär "
        "hela kattens vikt i ett upphängt läge."),
}

FAQ = {
    "4a5acc7d": [
        ("Hur stora är hålorna?",
         "18 × 18 cm, och det är samma mått på alla tre. Varje våning är "
         "39,5 × 39,5 cm och 29 cm hög invändigt."),
        ("Kan en katt sitta upprätt inne i den?",
         "Ja. Takhöjden är 29 cm per våning, vilket räcker för en "
         "normalstor katt att sitta upp."),
        ("Hur många hålor finns det?",
         "Tre, en per våning. Var och en har en boll som dinglar i "
         "öppningen."),
        ("Vad står den på?",
         "En sockel på 41 × 41 cm som är lika bred som stommen. Total höjd "
         "är 100 cm."),
        ("Är den klädd i klösbart material?",
         "Ja, hela stommen är klädd i mattextil som katten kan klösa i. "
         "Plyschen sitter bara runt öppningarna och på bädden."),
        ("Behöver den monteras?",
         "Ja. Anvisning följer med, och våningarna skruvas ihop nerifrån "
         "och upp."),
        ("Går den att ställa fritt i rummet?",
         "Ja, men alla tre hålor ligger inte åt samma håll — vänd den sida "
         "du vill att katten ska använda utåt."),
    ],
    "860b6eb9": [
        ("Hur stor är tunnan invändigt?",
         "Ø35 cm och 29 cm hög. Själva tunnan mäter Ø36 cm utvändigt."),
        ("Hur många ingångar finns det?",
         "Tre hålor på 17 × 16 cm, placerade på var sin höjd runt tunnan."),
        ("Vad är hoppstegen till för?",
         "De sitter längs sisalstammen och delar upp vägen till toppen i "
         "två kliv. Steget mäter 35 × 24 cm."),
        ("Hur tjock är sisalstammen?",
         "Ø7 cm utvändigt, med en kärna på Ø4,5 cm. Repet är 4 mm grovt."),
        ("Vilken katt passar den?",
         "Katter upp till 6 kg."),
        ("Hur stor är bädden på toppen?",
         "Ø35 cm med 6 cm djup liggyta och uppvikt kant runt om."),
        ("Står den stadigt?",
         "Foten är 50 × 36 cm, alltså bredare än tunnan, och tar upp "
         "kraften när katten hoppar upp på stegen."),
        ("Behöver den monteras?",
         "Ja, med bifogad anvisning."),
    ],
    "05136778": [
        ("Hur många katter passar den?",
         "1–3 katter under 5 kg. Bärförmågan är 15 kg."),
        ("Hur stora är kojorna?",
         "Den nedre är 30 × 30 cm och den övre 45 × 30 cm. Båda är 29 cm "
         "höga invändigt."),
        ("Finns det en hängmatta?",
         "Ja, en på Ø30 cm som sitter på sidan."),
        ("Hur kommer katten upp?",
         "Via en stege på 43 × 18 cm från golvet, och sedan mellan planen."),
        ("Hur mycket golvyta tar den?",
         "Sockeln är 48 × 48 cm. Total höjd är 160 cm."),
        ("Vad är bädden överst gjord av?",
         "Plysch, Ø30 cm och 10 cm hög med uppvikt kant."),
        ("Måste den stå mot en vägg?",
         "Den står stadigt fritt, men 160 cm på en sockel av 48 × 48 cm "
         "vinner på att ha en vägg eller ett hörn bakom sig."),
        ("Behöver den monteras?",
         "Ja. Montera nerifrån och upp och dra åt alla skruvar helt."),
    ],
    "105c685a": [
        ("Hur hög är den?",
         "139 cm, på en sockel som mäter 48 × 44 cm."),
        ("Hur stor är kojan?",
         "Ø30 cm och 27,5 cm hög, med en ingång på 19 × 22 cm."),
        ("Vad är klösskivan?",
         "En rund sisalskiva på Ø30 cm som sitter lodrätt, i den höjd "
         "katten når när den reser sig på bakbenen."),
        ("Är bladen av tyg?",
         "Ja, tyg på böjlig stomme. De två storlekarna är 30 × 14 cm och "
         "24 × 12 cm."),
        ("Hur många katter passar den?",
         "1–2 katter upp till 5 kg. Bärförmågan är 10 kg."),
        ("Vad är stammarna klädda i?",
         "Jute, och de är Ø7 cm grova."),
        ("Finns det en väg upp för en äldre katt?",
         "Stegen på 40 × 15 cm går upp längs framsidan och är klädd i "
         "sisal."),
        ("Behöver den monteras?",
         "Ja, med bifogad anvisning."),
    ],
    "7f8e495b": [
        ("Vad är kojan gjord av?",
         "Flätad vass. Den är Ø40 cm och 30 cm hög, med en rund öppning på "
         "Ø20 cm."),
        ("Ligger det något i kojan?",
         "Ja, en dyna på Ø32 cm."),
        ("Hur många liggplatser finns det?",
         "Tre: bädden överst på Ø34 cm, den kantade bädden på Ø35 cm i "
         "kojans tak, och kojan själv."),
        ("Hur hög är den?",
         "79 cm, på en sockel som mäter 60 × 40 cm."),
        ("Hur mycket bär den?",
         "10 kg, och den passar 1–2 katter upp till 5 kg."),
        ("Tål vassen fukt?",
         "Torka av med lätt fuktad trasa och torka efter. Den ska inte "
         "blötläggas."),
        ("Vad är stammarna klädda i?",
         "Sisal, och de är Ø7 cm grova."),
        ("Behöver den monteras?",
         "Ja, med bifogad anvisning."),
    ],
    "ae1c848f": [
        ("Hur stor är liggytan?",
         "60 × 40 cm med en 9,5 cm hög kant, alltså 58,5 × 37 cm fri yta "
         "invändigt och 8 cm djup."),
        ("Hur stor är kojan?",
         "Ø36 cm och 24 cm hög."),
        ("Hur stor är ingången?",
         "17,5 × 17 cm. Det är husets enda öppning."),
        ("Vilken katt passar den?",
         "Katter upp till 8 kg. Bärförmågan är 15 kg."),
        ("Hur hög är den?",
         "79 cm, på en sockel som mäter 70 × 49 cm."),
        ("Vad är stammarna klädda i?",
         "Jute, och de är Ø9,1 cm grova — alltså ovanligt tjocka för den "
         "här höjden."),
        ("Står den stadigt utan vägg bakom?",
         "Ja. Sockeln på 70 × 49 cm är bred i förhållande till höjden."),
        ("Behöver den monteras?",
         "Ja, med bifogad anvisning."),
    ],
    "f8528666": [
        ("Hur stor är kojan?",
         "46 × 33,5 cm och 24,5 cm hög, med en ingång på 20 × 20 cm."),
        ("Går det att komma in uppifrån?",
         "Ja, det finns ett runt hål i kojans tak som fungerar som andra "
         "väg in och ut."),
        ("Vad är bädden gjord av?",
         "Flätad vattenhyacint med mjuk insida. Den mäter 34 × 34 cm och "
         "är 12 cm hög."),
        ("Hur mycket bär den?",
         "20 kg totalt och 10 kg per plan. Den passar katter under 6 kg."),
        ("Vad är rampen till för?",
         "Den är både väg upp från golvet och klösyta, 30 × 20 cm i sisal."),
        ("Hur hög är den?",
         "98 cm, på en sockel som mäter 60 × 40 cm."),
        ("Hur mycket plats behöver den framför sig?",
         "Rampen lutar ut från sockeln, så räkna med fritt golv framför "
         "möbeln."),
        ("Behöver den monteras?",
         "Ja, med bifogad anvisning."),
    ],
    "63a586da": [
        ("Hur stor är tunneln?",
         "Ø32 cm utvändigt och 40 cm lång, med Ø29 cm fritt invändigt."),
        ("Hur stor är topplattan?",
         "51 × 33 cm med en 7 cm hög kant, alltså 47 × 29 cm fri yta och "
         "5 cm djup."),
        ("Finns det fler liggplatser?",
         "Ja, en sidoplattform på 31 × 29 cm en bit under topplattan."),
        ("Hur mycket bär den?",
         "5 kg. Den är byggd för en katt."),
        ("Hur hög är den?",
         "104 cm, på en sockel som mäter 60 × 40 cm."),
        ("Hänger tunneln fritt?",
         "Ja, mellan två stammar, och den rör sig något när katten går in."),
        ("Går pompongen att ta bort?",
         "Den sitter i ett snöre och går att knyta upp."),
        ("Behöver den monteras?",
         "Ja, med bifogad anvisning."),
    ],
}

SOKORDSLISTA = {
    "4a5acc7d": ["klöstorn 100 cm", "klöstorn med hålor", "kattorn med gömställe",
                 "klösmöbel tre våningar", "fyrkantigt klöstorn"],
    "860b6eb9": ["klöstunna 101 cm", "klöstunna med hoppsteg", "klöstunna tre hålor",
                 "kattunna på fot", "klösmöbel i tunnform"],
    "05136778": ["klösträd 160 cm", "klösträd två kojor", "högt klösträd",
                 "klösträd med hängmatta", "klösträd flera katter"],
    "105c685a": ["klösträd med bladkrona", "klösträd 139 cm", "grönt klösträd",
                 "klösträd med klösskiva", "klösträd som växt"],
    "7f8e495b": ["klösträd i vass", "lågt klösträd 79 cm", "klösträd med korgkoja",
                 "klösträd naturmaterial", "klösmöbel flätad koja"],
    "ae1c848f": ["lågt klösträd med koja", "klösträd 79 cm", "klösträd bred liggyta",
                 "klösträd stor katt", "klösträd med jutestammar"],
    "f8528666": ["klösträd med flätad koja", "klösträd 98 cm", "klösträd korgbädd",
                 "klösträd vattenhyacint", "klösträd med klösramp"],
    "63a586da": ["klösträd med tunnel", "klösträd 104 cm", "klösträd liggtunnel",
                 "klösmöbel med tunnel", "klösträd en katt"],
}

BAS = "https://www.fyndplats.se"


def _p(t):
    return "<p>" + t + "</p>"


def bygg(pid):
    """Bygger plainDescription. Ordningen speglar runda 135 exakt.

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
