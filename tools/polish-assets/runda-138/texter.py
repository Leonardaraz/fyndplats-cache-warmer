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
    "1366a476": "Ett klösträd på 200 cm som står fritt på golvet i stället för att "
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
                "mjukare mot tassarna än sisal men slits också snabbare, så räkna med "
                "att repet blir luddigt innan stolpen är genomklöst. Klipp av lösa "
                "trådar i stället för att dra i dem.",
    "e5b31270": "Mät takhöjden först; spännet klarar 225 till 255 cm. Leverantören "
                "rekommenderar att möbeln ställs intill en vägg. Sammet fäller ludd "
                "lättare än plysch — dammsug på låg effekt eller ta en klädrulle.",
    "fecadb3e": "Mät takhöjden först; spännstången når 240 till 260 cm. Jute är grövre "
                "och styvare än sisal och river snabbare in i klorna, men fäller också "
                "mer fiber de första veckorna. Sopa upp under stammen den första tiden.",
    "505a0dde": "Mät takhöjden först; spännet klarar 220 till 260 cm. Halkskyddet ska "
                "sitta mellan fotplattan och golvet — utan det kan pelaren glida när "
                "katten tar sats mot stammen.",
    "7bdc47b8": "Mät takhöjden först; trädet ställs mellan 240 och 260 cm. Efterspänn "
                "stången några veckor efter monteringen och sedan då och då. Skaka "
                "inte i stammen för att kontrollera — tryck i stället på översta "
                "planet och känn efter att ingenting ger med sig.",
}
