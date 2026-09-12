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
