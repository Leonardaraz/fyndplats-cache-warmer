# -*- coding: utf-8 -*-
"""Runda 138 — all kundtext, byggd i FIL och grindad före skrivning.

☠️ TEXTEN SKRIVS ALDRIG INLINE I ETT API-ANROP. Uppmätt 2026-09-04: fem
   produkter skrivna inline gav NIO fel som nådde Wix; tre skrivna via fil
   och grind gav noll. En sträng i ett JSON-anrop kan inte grepas innan den
   lämnar chatten, och PATCH-svaret ekar tillbaka exakt det man skrev.

☠️ SPEC-TABELLEN BYGGS UR TYSKANS `Technische Daten`, aldrig ur importens
   svenska rad. Den säger `Material: Polyester` på fem av sju där källan
   säger annat, och `Färg: Gelb` på `505a0dde` — oöversatt OCH en av tre.

☠️ `Artikelnummer` är ALDRIG en etikett här.
"""
import os as _os
import sys as _sys

_sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), ".."))
_sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
import grindar as _G                                             # noqa: E402
import matt as _M                                                # noqa: E402

BAS = "https://www.fyndplats.se"
SLUG = dict(_M.SLUG)
SKU = {pid: "FP-" + _G.sku_bas(slug) for pid, slug in SLUG.items()}

NAMN = {
    "1366a476": "Klösträd 200 cm i beige – två hålor, hängmatta och 20 kg bärförmåga",
    "839a2ef5": "Klösträd 230–275 cm i grönt – kaktusform med katthus och hängmatta",
    "68bc6c0c": "Klösträd 225–255 cm i vitt och grått – fyra plan och två hängmattor",
    "e5b31270": "Klösträd 225–255 cm i grått – rund bas, katthus och sammetsklädsel",
    "fecadb3e": "Klösträd 240–260 cm i träfärg – katthus med stege och jutelindad stam",
    "505a0dde": "Klöspelare 220–260 cm i gult och ljusblått – två liggytor och sisalstam",
    "7bdc47b8": "Klösträd 240–260 cm i ljusgrått – två sovhålor och två hängmattor",
}

TITEL = {
    "1366a476": "Klösträd 200 cm beige – två hålor och hängmatta | Fyndplats",
    "839a2ef5": "Klösträd 230–275 cm i grönt – kaktusform | Fyndplats",
    "68bc6c0c": "Klösträd 225–255 cm vitt och grått – fyra plan | Fyndplats",
    "e5b31270": "Klösträd 225–255 cm grått – rund bas och sammet | Fyndplats",
    "fecadb3e": "Klösträd 240–260 cm träfärg – katthus och stege | Fyndplats",
    "505a0dde": "Klöspelare 220–260 cm – sisalstam mot taket | Fyndplats",
    "7bdc47b8": "Klösträd 240–260 cm ljusgrått – två sovhålor | Fyndplats",
}

META = {
    "1366a476": "Klösträd 200 cm i beige och cremevitt med två hålor, hängmatta och "
                "sju plan. Bär 20 kg, för katter under 6 kg. Tippskyddslina ingår.",
    "839a2ef5": "Grönt klösträd i kaktusform, ställbart 230–275 cm mellan golv och tak. "
                "Katthus, hängmatta och sisalstam. Tar 55 × 34 cm i golvyta.",
    "68bc6c0c": "Klösträd i vitt och grått, ställbart 225–255 cm mot taket. Fyra plan, "
                "två hängmattor och stolpar lindade med mjukt bomullsrep.",
    "e5b31270": "Grått klösträd i sammet med rund bas på Ø60 cm, ställbart 225–255 cm. "
                "Katthus, hängmatta och tre plan på en bomullslindad stam.",
    "fecadb3e": "Klösträd i träfärg och beige, ställbart 240–260 cm. Katthus med stege, "
                "hängmatta och jutelindad stam. Tar bara 40 × 40 cm i golvyta.",
    "505a0dde": "Klöspelare ställbar 220–260 cm mellan golv och tak. En sisallindad stam, "
                "två liggytor och halkskydd. Tar 47 × 34 cm i golvyta.",
    "7bdc47b8": "Ljusgrått klösträd ställbart 240–260 cm mot taket. Två sovhålor, två "
                "hängmattor och två bollar. Bär omkring 10 kg.",
}

SOKORD = {
    "1366a476": "klösträd 200 cm",
    "839a2ef5": "klösträd kaktus",
    "68bc6c0c": "klösträd golv till tak",
    "e5b31270": "klösträd rund bas",
    "fecadb3e": "klösträd med katthus",
    "505a0dde": "klöspelare golv till tak",
    "7bdc47b8": "klösträd ljusgrått",
}

SOKORD_EXTRA = {
    "1366a476": ["klösträd för två katter", "klösträd med håla"],
    "839a2ef5": ["kaktusklösträd", "klösträd mot taket"],
    "68bc6c0c": ["klösträd bomullsrep", "klösträd fyra plan"],
    "e5b31270": ["klösträd sammet", "takspänt klösträd"],
    "fecadb3e": ["klösträd jute", "smalt klösträd"],
    "505a0dde": ["klöspelare 260 cm", "klöspelare med liggyta"],
    "7bdc47b8": ["takspänt klösträd", "klösträd två hålor"],
}

INTRO = {
    "1366a476": "Ett klösträd på 200 cm som står fritt på golvet och inte behöver "
                "spännas mot taket. Basen är 59 × 59 cm, stammarna 7 cm grova, och "
                "en tippskyddslina följer med för att fästa trädet i väggen. Två "
                "slutna hålor, en hängmatta på Ø40 cm och sju ytor att ligga på.",
    "839a2ef5": "Ett klösträd format som en kaktus, i grönt, som ställs mellan 230 och "
                "275 cm och spänns mot taket. Under kaktusarmarna finns ett katthus på "
                "35 × 35 cm, en hängmatta på Ø30 cm och två plan att kliva mellan. "
                "Fotplattan tar 55 × 34 cm av golvet.",
    "68bc6c0c": "Ett smalt klösträd i vitt och grått som ställs mellan 225 och 255 cm "
                "och spänns mot taket. Fyra plan i olika storlek sitter förskjutna "
                "längs två stolpar, och två hängmattor med olika form ger katten två "
                "sätt att ligga. Stolparna är lindade med bomullsrep.",
    "e5b31270": "Ett klösträd i grå sammet med rund fotplatta på Ø60 cm, ställbart "
                "mellan 225 och 255 cm mot taket. Ett runt katthus, en hängmatta och "
                "tre plan sitter på en stam som smalnar av uppåt — från 7,7 cm nertill "
                "till 3,5 cm överst.",
    "fecadb3e": "Ett klösträd i träfärg och beige som ställs mellan 240 och 260 cm och "
                "spänns mot taket. Katthuset på 34 × 34 × 34 cm har en rund öppning på "
                "Ø20 cm och nås via en stege, och överst sitter ett runt plan på Ø34 cm. "
                "Hela möbeln tar bara 40 × 40 cm av golvet.",
    "505a0dde": "En klöspelare som ställs mellan 220 och 260 cm och spänns mot taket. "
                "Stammen är 9,1 cm grov och lindad med sisal hela vägen upp, och två "
                "liggytor på 40 × 20 cm sitter på var sin höjd. Fotplattan mäter "
                "47 × 34 cm.",
    "7bdc47b8": "Ett ljusgrått klösträd som ställs mellan 240 och 260 cm och spänns "
                "mellan golv och tak. Två sovhålor på 45 × 35 cm, två hängmattor och "
                "två bollar fördelade på flera våningar. Golvytan är 60 × 45 cm och "
                "trädet bär omkring 10 kg.",
}

RUBRIK = {
    "1366a476": "Det här får du",
    "839a2ef5": "Det här får du",
    "68bc6c0c": "Det här får du",
    "e5b31270": "Det här får du",
    "fecadb3e": "Det här får du",
    "505a0dde": "Det här får du",
    "7bdc47b8": "Det här får du",
}

PUNKTER = {
    "1366a476": [
        "Höjd 200 cm på en bas som mäter 59 × 59 cm",
        "Två slutna hålor: 35 × 40 cm och 40 × 40 cm, båda 29 cm höga",
        "Hängmatta på Ø40 cm",
        "Övre liggyta 59 × 33 cm, mellersta Ø39 cm",
        "Plattform på 53 × 53 cm och en språngyta på 39 × 30 cm",
        "Stammar på Ø7 cm, lindade med sisal",
        "Bär 20 kg och är gjord för katter under 6 kg",
        "Tippskyddslina ingår för att fästa trädet i väggen",
    ],
    "839a2ef5": [
        "Ställs mellan 230 och 275 cm och spänns mot taket",
        "Fotplatta på 55 × 34 cm",
        "Katthus på 35 × 35 cm, 30 cm högt, med öppning på 18 × 23 cm",
        "Hängmatta på Ø30 cm, 15 cm djup",
        "Två plan: 40 cm och 30 cm långa, båda 24 cm djupa",
        "Stam lindad med sisal och en hängande lekboll",
        "Bär 10 kg och är gjord för en till två katter upp till 5 kg",
    ],
    "68bc6c0c": [
        "Ställs mellan 225 och 255 cm och spänns mot taket",
        "Fotplatta på 60 × 44 cm",
        "Fyra plan: två runda på Ø48 cm, ett runt på Ø30 cm och ett på 48 × 24 cm",
        "Två hängmattor med olika form: en rund på Ø30 cm och en av tyg på 42 × 18 cm",
        "Stolpar på Ø8,4 cm, lindade med bomullsrep",
        "Bär 10 kg och är gjord för en till två katter under 5 kg",
    ],
    "e5b31270": [
        "Ställs mellan 225 och 255 cm och spänns mot taket",
        "Rund fotplatta på Ø60 cm",
        "Katthus på Ø30 cm, 28 cm högt, med öppning på 18 × 20 cm",
        "Hängmatta på Ø30 cm, 12 cm djup",
        "Tre plan: Ø28 cm, 56 × 30 cm och 38 × 24 cm",
        "Stammen smalnar av uppåt: Ø7,7 cm, Ø6,5 cm och Ø3,5 cm",
        "Klädd i sammet, stammarna lindade med bomullsrep",
        "Gjord för en till två katter upp till 5 kg",
    ],
    "fecadb3e": [
        "Ställs mellan 240 och 260 cm och spänns mot taket",
        "Bottenplatta på 40 × 40 cm",
        "Katthus på 34 × 34 × 34 cm med rund öppning på Ø20 cm",
        "Stege upp till huset, 39 × 18 cm",
        "Andra planet 34 × 40 cm, översta planet Ø34 cm",
        "Hängmatta på Ø30 cm, 13 cm djup",
        "Tvättbar kudde på 30 × 30 cm",
        "Stam på Ø8,5 cm, lindad med jute",
        "Gjord för katter upp till 5 kg",
    ],
    "505a0dde": [
        "Ställs mellan 220 och 260 cm och spänns mot taket",
        "Fotplatta på 47 × 34 cm",
        "Två liggytor på 40 × 20 cm, på var sin höjd",
        "Stam på Ø9,1 cm, lindad med sisal hela vägen upp",
        "Hängande lekboll",
        "Halkskydd ingår",
        "Gjord för katter under 5 kg",
    ],
    "7bdc47b8": [
        "Ställs mellan 240 och 260 cm och spänns mellan golv och tak",
        "Fotplatta på 60 × 45 cm",
        "Två sovhålor på 45 × 35 cm, 25 cm höga, med öppning på 18 × 18 cm",
        "Två hängmattor och två bollar",
        "Stammar lindade omväxlande med sisal och plysch",
        "Bär omkring 10 kg och är gjord för katter upp till 5 kg",
    ],
}

KATT_RUBRIK = {
    "1366a476": "Vilken katt den passar",
    "839a2ef5": "Vilken katt den passar",
    "68bc6c0c": "Vilken katt den passar",
    "e5b31270": "Vilken katt den passar",
    "fecadb3e": "Vilken katt den passar",
    "505a0dde": "Vilken katt den passar",
    "7bdc47b8": "Vilken katt den passar",
}

KATT = {
    "1366a476": "Gjord för katter under 6 kg, och den enda i den här höjdklassen som "
                "bär 20 kg. Två hålor på var sin höjd gör att två katter kan dra sig "
                "undan var för sig, och eftersom trädet står fritt på en bas på "
                "59 × 59 cm behöver du ingen takhöjd att passa in i. Fäst "
                "tippskyddslinan i väggen innan katten får klättra.",
    "839a2ef5": "Gjord för en till två katter upp till 5 kg. Kaktusformen är tilltalande "
                "för ögat, men det är fotplattan på 55 × 34 cm som avgör: möbeln tar "
                "mindre golvyta än ett soffbord och ger ändå katten över två meter att "
                "röra sig i. Mät takhöjden först — den måste ligga mellan 230 och 275 cm.",
    "68bc6c0c": "Gjord för en till två katter under 5 kg. De fyra planen sitter "
                "förskjutna på två stolpar, så katten kan gå upp i etapper i stället "
                "för att hoppa hela vägen. Två hängmattor med olika form ger två sätt "
                "att ligga: den runda sluter om katten, tygmattan är plattare.",
    "e5b31270": "Gjord för en till två katter upp till 5 kg. Den runda fotplattan på "
                "Ø60 cm har ingen hörnkant att stöta i, och passar därför i ett rum "
                "där möbeln står fritt i stället för mot en vägg. Katthuset är runt och "
                "slutet, och sammeten gör ytorna mjukare än plysch.",
    "fecadb3e": "Gjord för katter upp till 5 kg. Bottenplattan är bara 40 × 40 cm, "
                "vilket är den minsta golvytan i den här höjdklassen — möbeln kan stå "
                "i en smal passage eller mellan två möbler. Stegen upp till huset gör "
                "att en katt som hoppar kort ändå når hela vägen.",
    "505a0dde": "Gjord för katter under 5 kg. Det här är en pelare, inte ett träd: en "
                "grov stam med två liggytor och ingenting att gå runt på. Katten som "
                "klöser mycket men sover någon annanstans får det den behöver utan att "
                "en hel möbel tar plats i rummet.",
    "7bdc47b8": "Gjord för katter upp till 5 kg och bär omkring 10 kg. Två sovhålor på "
                "var sin höjd och två hängmattor gör att två katter kan ligga samtidigt "
                "utan att dela plats. Mät takhöjden först — trädet ställs mellan 240 "
                "och 260 cm och spänns fast däremellan.",
}

BRUK_RUBRIK = {
    "1366a476": "Att tänka på",
    "839a2ef5": "Att tänka på",
    "68bc6c0c": "Att tänka på",
    "e5b31270": "Att tänka på",
    "fecadb3e": "Att tänka på",
    "505a0dde": "Att tänka på",
    "7bdc47b8": "Att tänka på",
}

BRUK = {
    "1366a476": "Trädet står på egna ben och spänns inte mot taket. Skruva fast "
                "tippskyddslinan i väggen — den ingår, och 200 cm är hög nog för att "
                "en katt som tar sats högst upp ska kunna få möbeln i rörelse. På ett "
                "halt golv lägger du en matta under basen på 59 × 59 cm.",
    "839a2ef5": "Mät takhöjden innan du beställer: spännstången når 230 till 275 cm, "
                "och utanför det spannet går möbeln inte att montera. Efterspänn "
                "stången efter första veckan och sedan då och då — tak och golv rör "
                "sig med luftfuktigheten.",
    "68bc6c0c": "Mät takhöjden först; spännet klarar 225 till 255 cm. Bomullsrepet är "
                "mjukt mot tassarna men slits snabbare än hårdare klösytor, så räkna med "
                "att repet blir luddigt innan stolpen är genomklöst. Klipp av lösa "
                "trådar i stället för att dra i dem.",
    "e5b31270": "Mät takhöjden först; spännet klarar 225 till 255 cm. Ställ möbeln "
                "intill en vägg. Sammet fäller ludd "
                "lättare än plysch — dammsug på låg effekt eller ta en klädrulle.",
    "fecadb3e": "Mät takhöjden först; spännstången når 240 till 260 cm. Ställ trädet "
                "så att stegen är fri — hamnar den tätt mot en vägg blir den svår "
                "för katten att använda. Efterspänn stången några veckor efter "
                "monteringen och sedan då och då.",
    "505a0dde": "Mät takhöjden först; spännet klarar 220 till 260 cm. Halkskyddet ska "
                "sitta mellan fotplattan och golvet — utan det kan pelaren glida när "
                "katten tar sats mot stammen.",
    "7bdc47b8": "Mät takhöjden först; trädet ställs mellan 240 och 260 cm. Efterspänn "
                "stången några veckor efter monteringen och sedan då och då. Skaka "
                "inte i stammen för att kontrollera — tryck i stället på översta "
                "planet och känn efter att ingenting ger med sig.",
}

KORS_INGRESS = {p: "Passar inte den här?" for p in NAMN}
KORS_TEXT = {p: "Fler klösmöbler hos oss:" for p in NAMN}

# ☠️ INGA TAL I LÄNKTEXTERNA. Ett tal som tillhör GRANNEN hamnar annars i vår
#    egen sida och måste zonindelas bort av talgrinden. Runda 137 gjorde det
#    med zonindelning; att helt låta bli är billigare och lika informativt.
# ☠️ Och länken går ÅT BÅDA HÅLL inom ett färgpar (uppgift #480). `7bdc47b8`
#    är färgsyskon till en PUBLICERAD sida — den behöver en rad tillbaka.
KORSLANK = {
    "1366a476": [("klostrad-230-275-cm-gront-katthus", "takspänt klösträd med katthus i grönt"),
                 ("klostrad-ljusgratt-240-260-cm", "takspänt klösträd i ljusgrått"),
                 ("klostrad-takspant-240-260-cm", "takspänt klösträd i mörkgrått")],
    "839a2ef5": [("klostrad-200-cm-beige-halor", "fristående klösträd i beige med två hålor"),
                 ("klostrad-240-260-cm-trafarg-katthus", "takspänt klösträd med katthus i träfärg"),
                 ("klostrad-fem-plan-230-260-cm-gra", "takspänt klösträd i fem plan")],
    "68bc6c0c": [("klostrad-225-255-cm-rund-bas-sammet", "takspänt klösträd med rund bas i sammet"),
                 ("klostrad-ljusgratt-240-260-cm", "takspänt klösträd i ljusgrått"),
                 ("klostrad-200-cm-beige-halor", "fristående klösträd i beige med två hålor")],
    "e5b31270": [("klostrad-225-255-cm-fyra-plan-bomullsrep", "takspänt klösträd i fyra plan"),
                 ("klostrad-230-275-cm-gront-katthus", "takspänt klösträd med katthus i grönt"),
                 ("klospelare-220-260-cm-tva-liggytor", "takspänd klöspelare med två liggytor")],
    "fecadb3e": [("klostrad-230-275-cm-gront-katthus", "takspänt klösträd med katthus i grönt"),
                 ("klostrad-225-255-cm-rund-bas-sammet", "takspänt klösträd med rund bas i sammet"),
                 ("klostrad-takspant-240-260-cm", "takspänt klösträd i mörkgrått")],
    "505a0dde": [("klostrad-225-255-cm-fyra-plan-bomullsrep", "takspänt klösträd i fyra plan"),
                 ("klostrad-200-cm-beige-halor", "fristående klösträd i beige med två hålor"),
                 ("klostrad-240-260-cm-trafarg-katthus", "takspänt klösträd med katthus i träfärg")],
    "7bdc47b8": [("klostrad-takspant-240-260-cm", "samma modell i mörkgrått"),
                 ("klostrad-225-255-cm-fyra-plan-bomullsrep", "takspänt klösträd i fyra plan"),
                 ("klostrad-230-275-cm-gront-katthus", "takspänt klösträd med katthus i grönt")],
}

# ☠️ VÄRDENA KOMMER UR TYSKANS `Technische Daten`. Importens svenska rad säger
#    `Material: Polyester` på fem av sju och `Färg: Gelb` på `505a0dde`.
# ⚠️ `Vikt` är FRAKTVIKTEN (uppgift #488). Etiketten står ändå så, enligt husets
#    konvention i hela katalogen — att döpa om den på sju sidor vore avvikelsen.
# ☠️ INGEN etikett heter `Artikelnummer`, `Modellreferens` eller `Referens`.
SPEC = {
    "1366a476": [
        ("Mått", "59 × 59 × 200 cm (B × D × H)"),
        ("Sockel", "59 × 59 cm"),
        ("Övre liggyta", "59 × 33 × 8 cm"),
        ("Mellanliggyta", "Ø39 × 8 cm"),
        ("Plattform", "53 × 53 cm"),
        ("Hoppyta", "39 × 30 cm"),
        ("Nedre håla", "35 × 40 × 29 cm"),
        ("Mellersta hålan", "40 × 40 × 29 cm"),
        ("Hängmatta", "Ø40 cm"),
        ("Klösstam", "Ø7 cm, lindad med sisal"),
        ("Bärförmåga", "20 kg"),
        ("Rekommenderad kattvikt", "Under 6 kg"),
        ("Tippskydd", "Lina ingår"),
        ("Stomme", "Spånskiva"),
        ("Klädsel", "Plysch"),
        ("Montering", "Krävs"),
        ("Färg", "Beige och cremevit"),
        ("Vikt", "24,6 kg"),
        ("Paketmått", "61 × 28 × 61 cm"),
    ],
    "839a2ef5": [
        ("Mått", "55 × 34 × 230–275 cm (L × B × H)"),
        ("Bottenplatta", "55 × 34 cm"),
        ("Katthus", "35 × 35 × 30 cm"),
        ("Husets öppning", "18 × 23 cm"),
        ("Hängmatta", "Ø30 × 15 cm"),
        ("Plattformar", "40 × 24 cm och 30 × 24 cm"),
        ("Klösstammar", "Lindade med sisal"),
        ("Bärförmåga", "10 kg"),
        ("Rekommenderad kattvikt", "Upp till 5 kg"),
        ("Takspänne", "Ingår"),
        ("Stomme", "Spånskiva"),
        ("Klädsel", "Polyester med skumstoppning"),
        ("Montering", "Krävs"),
        ("Färg", "Grönt"),
        ("Vikt", "11,9 kg"),
        ("Paketmått", "57 × 24 × 36 cm"),
    ],
    "68bc6c0c": [
        ("Mått", "60 × 44 × 225–255 cm (L × B × H)"),
        ("Bas", "60 × 44 cm"),
        ("Runda plan", "Ø30 cm"),
        ("Andra och fjärde planet", "Ø48 cm"),
        ("Tredje planet", "48 × 24 cm"),
        # ⚠️ TVÅ hängmattor, inte en. Leverantören skriver dem på EN rad, och
        #    den raden läses lätt som ett enda föremål (matt.OAVGJORT).
        ("Rund hängmatta", "Ø30 × 8 cm"),
        ("Hängmatta i tyg", "42 × 18 × 13 cm"),
        ("Klösstammar", "Ø8,4 cm, lindade med bomullsrep"),
        ("Bärförmåga", "10 kg"),
        ("Rekommenderad kattvikt", "Under 5 kg"),
        ("Takspänne", "Ingår"),
        ("Stomme", "Spånskiva"),
        ("Klädsel", "Polyester"),
        ("Montering", "Krävs"),
        ("Färg", "Vitt och mörkgrått"),
        ("Vikt", "17,5 kg"),
        ("Paketmått", "61 × 56,5 × 21 cm"),
    ],
    "e5b31270": [
        ("Mått", "Ø60 × 225–255 cm"),
        ("Bas", "Ø60 cm"),
        ("Katthus", "Ø30 × 28 cm"),
        ("Husets öppning", "18 × 20 cm"),
        ("Hängmatta", "Ø30 × 12 cm"),
        ("Plan", "Ø28 cm, 56 × 30 cm och 38 × 24 cm"),
        ("Klösstammar", "Ø7,7, Ø6,5 och Ø3,5 cm, lindade med bomullsrep"),
        ("Rekommenderad kattvikt", "Upp till 5 kg"),
        ("Takspänne", "Ingår"),
        ("Stomme", "Spånskiva"),
        ("Klädsel", "Sammet"),
        ("Montering", "Krävs"),
        ("Färg", "Grått"),
        ("Vikt", "13,7 kg"),
        ("Paketmått", "61 × 16 × 61 cm"),
    ],
    "fecadb3e": [
        ("Mått", "40 × 40 × 240–260 cm (L × B × H)"),
        ("Bottenplatta", "40 × 40 cm"),
        ("Andra planet", "34 × 40 cm"),
        ("Katthus", "34 × 34 × 34 cm, öppning Ø20 cm"),
        ("Kudde", "30 × 30 × 3 cm"),
        ("Stege", "39 × 18 cm"),
        ("Översta planet", "Ø34 cm"),
        ("Hängmatta", "Ø30 × 13 cm"),
        ("Klösstam", "Ø8,5 cm, lindad med jute"),
        ("Rekommenderad kattvikt", "Upp till 5 kg"),
        ("Takspänne", "Ingår"),
        ("Stomme", "Spånskiva"),
        ("Klädsel", "Plysch"),
        ("Montering", "Krävs"),
        ("Färg", "Träfärgad och beige"),
        ("Vikt", "15 kg"),
        ("Paketmått", "50,5 × 50,5 × 26 cm"),
    ],
    "505a0dde": [
        ("Mått", "47 × 34 × 220–260 cm (L × B × H)"),
        ("Bas", "47 × 34 cm"),
        ("Liggytor", "40 × 20 cm"),
        ("Klösstam", "Ø9,1 cm, lindad med sisal"),
        ("Rekommenderad kattvikt", "Under 5 kg"),
        ("Takspänne", "Ingår"),
        ("Stomme", "Spånskiva"),
        ("Klädsel", "Polyester"),
        ("Montering", "Krävs"),
        ("Färg", "Gul, vit och ljusblå"),
        ("Vikt", "6,8 kg"),
        ("Paketmått", "41 × 16 × 53,5 cm"),
    ],
    "7bdc47b8": [
        ("Mått", "60 × 45 × 240–260 cm (L × B × H)"),
        ("Katthåla", "45 × 35 × 25 cm"),
        ("Hålans öppning", "18 × 18 cm"),
        ("Klösstammar", "Lindade med sisal"),
        ("Bärförmåga", "10 kg"),
        ("Rekommenderad kattvikt", "Upp till 5 kg"),
        ("Takspänne", "Ingår"),
        ("Stomme", "Spånskiva"),
        ("Klädsel", "Plysch"),
        ("Montering", "Krävs"),
        ("Färg", "Ljusgrå"),
        ("Vikt", "19,8 kg"),
        ("Paketmått", "62 × 47 × 33 cm"),
    ],
}

# ☠️ SKÖTSELN UPPREPAR INTE BRUK. `BRUK` äger monteringen och efterspänningen;
#    det här stycket äger rengöringen. Två stycken som säger samma sak ser för
#    kunden ut som att sidan är utfylld med upprepning.
SKOTSEL = {
    "1366a476": (
        "Plyschen borstas med en gummiborste eller en fuktad hand — båda drar med "
        "sig hår som en dammsugare lämnar kvar. Sisalen på stammen dammsugs med "
        "möbelmunstycket; har ett varv börjat lossna trycker du tillbaka det och "
        "sätter en droppe trälim under änden innan det rullar upp sig. Hålorna når "
        "du inifrån med ett smalt fogmunstycke — det är där hår samlas mest."),
    "839a2ef5": (
        "Borsta plyschen med en gummiborste; håret släpper lättare än med en "
        "dammsugare. Inne i katthuset samlas hår längs botten, och ett smalt "
        "fogmunstycke når in genom öppningen. Hängmattans tyg torkas av med en "
        "fuktig trasa och ska torka helt innan katten lägger sig i den igen. "
        "Sisalen dammsugs med möbelmunstycket."),
    "68bc6c0c": (
        "Plyschen borstas med en gummiborste eller en fuktad hand. Bomullsrepet "
        "blir luddigt långt innan stolpen är genomklöst — det är normalt slitage "
        "och inget fel. Den runda hängmattan och tygmattan lyfts ur var för sig "
        "och skakas ute; båda samlar mer hår än planen gör, eftersom katten ligger "
        "still i dem."),
    "e5b31270": (
        "Sammet fäller ludd lättare än plysch. Dammsug på låg effekt eller ta en "
        "klädrulle, och dra med luggen i stället för mot den. Bomullsrepet på "
        "stammarna dammsugs med möbelmunstycket. Katthuset nås inifrån genom "
        "öppningen med ett smalt fogmunstycke."),
    "fecadb3e": (
        "Juten fäller mer fiber än andra klösytor de första veckorna — sopa upp "
        "under stammen den tiden, sedan avtar det av sig självt. Plyschen borstas "
        "med en gummiborste eller en fuktad hand. Kudden ligger löst i huset och "
        "lyfts ur för att skakas eller vädras."),
    "505a0dde": (
        "Polyestern på liggytorna borstas med en gummiborste. Sisalen på stammen "
        "dammsugs med möbelmunstycket, och ett varv som börjat lossna trycks "
        "tillbaka och limmas i änden med en droppe trälim. Fotplattans undersida "
        "torkas av när du flyttar pelaren — damm under plattan gör att den glider "
        "lättare på ett hårt golv."),
    "7bdc47b8": (
        "Plyschen borstas med en gummiborste eller en fuktad hand. Inne i hålan "
        "samlas hår längs botten; ett smalt fogmunstycke når in genom öppningen. "
        "Sisalen dammsugs med möbelmunstycket, och lösa varv trycks tillbaka och "
        "limmas i änden innan de rullar upp sig."),
}

# ☠️ VARJE TAL I EN FAQ MÅSTE STÅ I `matt.TAL`. Det är samma facit som
#    brödtexten grindas mot — en FAQ är inte en friare zon.
FAQ = {
    "1366a476": [
        ("Måste den fästas i taket?",
         "Nej. Det här är den enda modellen i serien som står fritt på sin sockel "
         "på 59 × 59 cm. I stället ingår en lina som fästs i väggen och håller "
         "emot om katten landar snett. Montera den — sockeln ensam stoppar inte "
         "en katt som tar sats från sidan."),
        ("Hur många hålor har den?",
         "Två. Den nedre mäter 35 × 40 cm och den mellersta 40 × 40 cm, båda 29 cm "
         "höga. Det räcker för en hoprullad katt i var och en."),
        ("Vad betyder bärförmågan på 20 kg?",
         "Det är vad konstruktionen håller, inte hur stor katt den är byggd för. "
         "De två talen mäter olika saker: möbeln bär 20 kg, och den rekommenderade "
         "kattvikten är under 6 kg."),
        ("Vad är ytan katten klöser på?",
         "Sisal, lindad runt en stam på Ø7 cm. Sisal är den styvaste av de vanliga "
         "klösytorna och håller längst, men är också hårdast mot tassarna."),
    ],
    "839a2ef5": [
        ("Passar den i mitt rum?",
         "Möbeln ställs in mellan 230 och 275 cm. Mät från golv till tak där du "
         "tänkt ha den — är takhöjden över 275 cm når spännet inte fram, och under "
         "230 cm går möbeln inte att korta ner."),
        ("Ryms min katt i katthuset?",
         "Huset mäter 35 × 35 cm invändigt och är 30 cm högt, med en öppning på "
         "18 × 23 cm. Det räcker för en normalstor katt. En storvuxen katt kliver "
         "in med besvär och väljer troligen hängmattan i stället."),
        ("Hur mycket tål den?",
         "Bärförmågan är 10 kg och den rekommenderade kattvikten upp till 5 kg. "
         "Talen mäter olika saker — det första är vad möbeln håller, det andra "
         "vilken katt den är byggd för."),
        ("Behöver den stå mot en vägg?",
         "Nej, den bärs av spännet mellan golv och tak. En sida mot en vägg är "
         "ändå bra om katten hoppar upp med fart, eftersom tyngden då hamnar "
         "närmare stammen."),
    ],
    "68bc6c0c": [
        ("Hur många plan har den?",
         "Fyra. De runda planen mäter Ø30 cm, det andra och fjärde Ø48 cm och det "
         "tredje 48 × 24 cm. Två katter kan ligga på var sitt plan samtidigt."),
        ("Är det verkligen två hängmattor?",
         "Ja, och de är olika. Den ena är rund, Ø30 cm och 8 cm djup. Den andra är "
         "av tyg och mäter 42 × 18 cm med 13 cm djup."),
        ("Vad är stolparna klädda med?",
         "Bomullsrep, lindat runt stammar på Ø8,4 cm. Repet är mjukare mot "
         "tassarna än styvare klösytor, men luddar också snabbare — det är "
         "slitage, inte ett fel."),
        ("Passar den i mitt rum?",
         "Den ställs in mellan 225 och 255 cm. Mät takhöjden först; utanför det "
         "spannet går möbeln varken att spänna fast eller korta ner."),
    ],
    "e5b31270": [
        ("Varför är basen rund?",
         "Basen mäter Ø60 cm och har ingen kant att slå i. Den tar mindre plats i "
         "ett hörn än en fyrkantig platta med samma yta, och går att skjuta nära "
         "en vägg åt vilket håll som helst."),
        ("Hur stort är katthuset?",
         "Ø30 cm och 28 cm högt, med en öppning på 18 × 20 cm. Det rymmer en "
         "hoprullad katt, och är slutet runt om — vilket är poängen, katten drar "
         "sig undan dit."),
        ("Vad är stammarna klädda med?",
         "Bomullsrep. De tre stammarna mäter Ø7,7, Ø6,5 och Ø3,5 cm, så katten får "
         "olika grovlek att klösa på."),
        ("Hur sköts sammeten?",
         "Dammsug på låg effekt eller ta en klädrulle, med luggen i stället för "
         "mot den. Sammet fäller mer ludd än plysch den första tiden."),
    ],
    "fecadb3e": [
        ("Vad är klösytan gjord av?",
         "Jute, lindad runt en stam på Ø8,5 cm. Jute är grövre än de flesta "
         "klösytor och river snabbare in i klorna, men fäller också mer fiber de "
         "första veckorna."),
        ("Hur kommer katten upp?",
         "Via en stege på 39 × 18 cm till andra planet, och därifrån vidare till "
         "katthuset och det översta planet på Ø34 cm. Stegen gör den lättare för "
         "en äldre katt än ett rakt hopp."),
        ("Ingår kudden?",
         "Ja. Den mäter 30 × 30 cm och är 3 cm tjock, och ligger löst så att den "
         "går att lyfta ur och skaka."),
        ("Passar den i mitt rum?",
         "Den ställs in mellan 240 och 260 cm. Mät takhöjden först — spannet är "
         "smalare än på flera av de andra modellerna."),
    ],
    "505a0dde": [
        ("Är det ett klösträd?",
         "Nej, en klöspelare. Den har en stam och två liggytor på 40 × 20 cm — "
         "ingen koja, inget plan att gå runt på. Vill du ha flera nivåer att "
         "klättra mellan passar ett klösträd bättre."),
        ("Hur mycket väger den?",
         "6,8 kg. Det är den lättaste modellen i serien, vilket gör den enkel att "
         "flytta — men också beroende av att spännet mot taket är ordentligt "
         "åtdraget."),
        ("Passar den i mitt rum?",
         "Den ställs in mellan 220 och 260 cm, det bredaste spannet i serien. Mät "
         "takhöjden först."),
        ("Vad är stammen klädd med?",
         "Sisal, lindad runt en stam på Ø9,1 cm. Det är den grövsta stammen i "
         "serien, så katten får fäste med hela tassen i stället för bara klorna."),
    ],
    "7bdc47b8": [
        ("Hur stor är hålan?",
         "45 × 35 cm invändigt och 25 cm hög, med en öppning på 18 × 18 cm. Det "
         "är den rymligaste hålan i serien och räcker för en storvuxen katt."),
        ("Hur mycket tål den?",
         "Bärförmågan är 10 kg och den rekommenderade kattvikten upp till 5 kg. "
         "Det första talet är vad konstruktionen håller, det andra vilken katt "
         "den är byggd för."),
        ("Passar den i mitt rum?",
         "Den ställs in mellan 240 och 260 cm. Mät från golv till tak innan du "
         "beställer — utanför spannet går den varken att spänna fast eller korta."),
        ("Finns den i en annan färg?",
         "Ja. Samma modell finns i mörkgrått, länkad längre upp på sidan. "
         "Konstruktionen är densamma; det är bara plyschen som skiljer."),
    ],
}

SOKORDSLISTA = {
    "1366a476": ["klösträd utan takfäste", "fristående klösträd", "klösträd beige",
                 "klösträd med två hålor", "klösträd med hängmatta"],
    "839a2ef5": ["takspänt klösträd", "klösträd till taket", "grönt klösträd",
                 "klösträd med katthus", "kaktusklösträd"],
    "68bc6c0c": ["takspänt klösträd", "klösträd fyra plan", "klösträd två hängmattor",
                 "klösträd bomullsrep", "klösträd vitt och grått"],
    "e5b31270": ["klösträd rund bas", "takspänt klösträd", "klösträd i sammet",
                 "grått klösträd", "klösträd med katthus"],
    "fecadb3e": ["takspänt klösträd", "klösträd med stege", "klösträd jute",
                 "klösträd i träfärg", "klösträd med katthus"],
    "505a0dde": ["klöspelare till taket", "takspänd klöspelare", "grov klöspelare",
                 "klöspelare med liggyta", "klöspelare sisal"],
    "7bdc47b8": ["takspänt klösträd", "klösträd ljusgrått", "klösträd med stor håla",
                 "klösträd till taket", "klösträd plysch"],
}


def _p(t):
    return "<p>" + t + "</p>"


def bygg(pid):
    """Bygger plainDescription. Samma blockordning som runda 135–137.

    ☠️ ORDNINGEN ÄR INTE FRI. Butikens flikdelare är en allowlist på fyra
       strängar (`grindar.FLIKAR_SOM_KRAVS`); allt EFTER en träff hamnar i den
       fliken. Korslänkarna måste därför ligga FÖRE `Tekniska specifikationer`.
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
