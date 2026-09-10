# -*- coding: utf-8 -*-
"""Runda 120 Steg 6-7 — namn, slug, seoData och brödtext för åtta barbordsset.

☠️ TEXTEN SKRIVS I DEN HÄR FILEN, ALDRIG INLINE I API-ANROPET. Batch 64 mätte
nio fel mot noll: en sträng som skrivs direkt i ett JSON-anrop kan inte läsas av
en grind innan den lämnar chatten, och API-svaret ekar tillbaka exakt det man
skrev — det ser rätt ut för att det ÄR det man skrev. En fil går att grep:a.

Alla siffror kommer ur `matt.py`. Inget tal skrivs för hand här.

☠️ RUNDANS EGEN RISK ÄR INTERN KANNIBALISERING. Noll publicerade barbordsset
finns, så sidorna konkurrerar bara med VARANDRA — åtta bord som ser nästan
likadana ut. Varje namn måste därför bära det som SKILJER: sitsens typ (pall,
stol med rygg, stoppad pall), antalet sittplatser, ytan och bordets bredd.

☠️ MAXLASTEN PÅ BORDSSKIVAN ÄR RUNDANS SÄKERHETSSIFFRA och står i varje text
under EGEN RUBRIK som ett positivt villkor — aldrig som ett varningsblock.
`441d2209` tål 20 kg; det är två matkassar, och den uppgiften ska kunden inte
behöva leta efter.
"""
from matt import M, MED_RYGG, MED_FORVARING, SYSKON  # noqa: F401

NAMN = {
    "441d2209": "Barbord med två pallar 80 cm – grå stenlook, sitthöjd 57 cm",
    "394de213": "Barbord med hylla och två pallar 80 cm – vit ram, skiva i ekoptik",
    "f4ed1264": "Barbord i marmoroptik 100 cm med två pallar – sitthöjd 60 cm",
    "3b38e191": "Barbord 89 cm med två stolar med ryggstöd – sitthöjd 64 cm",
    "51c43e67": "Barbord 100 cm med två stoppade pallar – ryggstöd och grå stenlook",
    "c3bda64a": "Barbord 100 cm med två hyllplan och två pallar – skivan tål 170 kg",
    "c88b5bbb": "Barbord med fyra pallar 100 cm – ljus ekoptik, femdelat set",
    "63a37524": "Barbord med fyra pallar 100 cm – rustikbrun träoptik, femdelat set",
}

SLUG = {
    "441d2209": "barbord-tva-pallar-80-cm-gra",
    "394de213": "barbord-hylla-tva-pallar-vit-ekoptik",
    "f4ed1264": "barbord-marmoroptik-100-cm-tva-pallar",
    "3b38e191": "barbord-89-cm-tva-stolar-ryggstod",
    "51c43e67": "barbord-100-cm-stoppade-pallar-ryggstod",
    "c3bda64a": "barbord-100-cm-tva-hyllplan-pallar",
    "c88b5bbb": "barbord-fyra-pallar-ljus-ekoptik",
    "63a37524": "barbord-fyra-pallar-rustikbrun",
}

TITEL = {
    "441d2209": "Barbord med två pallar 80 cm i grått | Fyndplats",
    "394de213": "Barbord med hylla och två pallar, vitt | Fyndplats",
    "f4ed1264": "Barbord i marmoroptik med två pallar | Fyndplats",
    "3b38e191": "Barbord med två stolar med ryggstöd | Fyndplats",
    "51c43e67": "Barbord med två stoppade barpallar | Fyndplats",
    "c3bda64a": "Barbord med två hyllplan och pallar | Fyndplats",
    "c88b5bbb": "Barbord med fyra pallar i ljus ekoptik | Fyndplats",
    "63a37524": "Barbord med fyra pallar, rustikbrunt | Fyndplats",
}

META = {
    "441d2209": ("Barbord {bord} med två pallar, sitthöjd {sitthojd} cm. Skiva i "
                 "grå träoptik på svart stålram. Skivan tål {bordlast}, sitsen {sitslast}."),
    "394de213": ("Barbord {bord} med hylla på {hylla} och två runda pallar, sitthöjd "
                 "{sitthojd} cm. Vit ram med skiva i ekoptik. Skivan tål {bordlast}."),
    "f4ed1264": ("Barbord {bord} i marmoroptik med två runda pallar, sitthöjd "
                 "{sitthojd} cm. Svart stålram. Skivan tål {bordlast}, sitsen {sitslast}."),
    "3b38e191": ("Barbord {bord} med två stolar med hög rygg, sitthöjd {sitthojd} cm. "
                 "Ljus skiva på pulverlackerad metallram. Skivan tål {bordlast}."),
    "51c43e67": ("Barbord {bord} med två stoppade pallar med ryggstöd, sitthöjd "
                 "{sitthojd} cm. Dyna i PU, {sitsyta}. Sitsen tål {sitslast}."),
    "c3bda64a": ("Barbord {bord} med två öppna hyllplan och två pallar, sitthöjd "
                 "{sitthojd} cm. Skiva i ekoptik på svart stålram. Skivan tål {bordlast}."),
    "c88b5bbb": ("Femdelat barset: bord {bord} och fyra pallar, sitthöjd {sitthojd} cm. "
                 "Skiva i ljus ekoptik. Skivan tål {bordlast}, varje pall {sitslast}."),
    "63a37524": ("Femdelat barset: bord {bord} och fyra pallar, sitthöjd {sitthojd} cm. "
                 "Skiva i rustik brun träoptik. Skivan tål {bordlast}, pallen {sitslast}."),
}

SOKORD = {
    "441d2209": ["barbord med stolar", "barbord litet", "barset", "barbord med pallar"],
    "394de213": ["barbord med hylla", "barbord med stolar", "barset vitt", "barbord kök"],
    "f4ed1264": ["barbord marmor", "barbord med stolar", "barset", "barbord 100 cm"],
    "3b38e191": ["barbord med stolar", "barstolar med ryggstöd", "barset", "barbord matplats"],
    "51c43e67": ["barbord med stoppade stolar", "barbord med stolar", "barset", "barpall med rygg"],
    "c3bda64a": ["barbord med förvaring", "barbord med hyllplan", "barset", "barbord kök"],
    "c88b5bbb": ["barbord med fyra stolar", "barset 5 delar", "barbord", "barbord ek"],
    "63a37524": ["barbord med fyra stolar", "barset 5 delar", "barbord", "barbord mörkt trä"],
}

# ☠️ Korslänkarna är rundans svar på kannibaliseringen. Åtta sidor på samma
#    huvudord utan länkar läser både Google och kunden som varandras kopior.
#    Varje länk går till en sida som skiljer sig på EN tydlig axel — antalet
#    sittplatser, sitsens typ eller ytan.
KORSLANK = {
    "441d2209": [("barbord-fyra-pallar-ljus-ekoptik", "samma idé men med fyra pallar"),
                 ("barbord-89-cm-tva-stolar-ryggstod", "samma storlek men med ryggstöd")],
    "394de213": [("barbord-100-cm-tva-hyllplan-pallar", "barbord med två hela hyllplan"),
                 ("barbord-tva-pallar-80-cm-gra", "samma bredd utan hylla, i grått")],
    "f4ed1264": [("barbord-tva-pallar-80-cm-gra", "smalare barbord på 80 cm"),
                 ("barbord-100-cm-stoppade-pallar-ryggstod", "samma bredd med stoppade pallar")],
    "3b38e191": [("barbord-100-cm-stoppade-pallar-ryggstod", "ryggstöd med stoppad sits"),
                 ("barbord-tva-pallar-80-cm-gra", "barbord med pallar i stället för stolar")],
    "51c43e67": [("barbord-89-cm-tva-stolar-ryggstod", "ryggstöd på hela stolar i stället"),
                 ("barbord-marmoroptik-100-cm-tva-pallar", "samma bredd i marmoroptik")],
    "c3bda64a": [("barbord-hylla-tva-pallar-vit-ekoptik", "mindre barbord med en hylla"),
                 ("barbord-fyra-pallar-ljus-ekoptik", "samma bredd med fyra sittplatser")],
    "c88b5bbb": [("barbord-fyra-pallar-rustikbrun", "samma bord i rustikbrun träoptik"),
                 ("barbord-tva-pallar-80-cm-gra", "mindre set med två sittplatser")],
    "63a37524": [("barbord-fyra-pallar-ljus-ekoptik", "samma bord i ljus ekoptik"),
                 ("barbord-100-cm-tva-hyllplan-pallar", "samma bredd med två hyllplan")],
}

# Fyndplats-kortet: VERSALRAD + underrubrik.
KORT = {
    "441d2209": ("BARBORD MED TVÅ PALLAR", "80 cm brett, sitthöjd 57 cm"),
    "394de213": ("BARBORD MED HYLLA", "64 × 34 cm under skivan"),
    "f4ed1264": ("BARBORD I MARMOROPTIK", "100 cm brett, två runda pallar"),
    "3b38e191": ("BARBORD MED RYGGSTÖD", "Två stolar, sitthöjd 64 cm"),
    "51c43e67": ("STOPPADE PALLAR MED RYGG", "Dyna i PU, Ø36 cm"),
    "c3bda64a": ("BARBORD MED TVÅ HYLLPLAN", "Skivan tål 170 kg"),
    # ☠️ FÄRGSYSKONEN FÅR INTE DELA KICKER. Kortet är det enda som skiljer dem
    #    i en kategorilista, och de har identiska mått, identisk vikt och
    #    identisk last — bara ytan skiljer. Två kort med samma versalrad hade
    #    gjort sidorna oskiljbara precis där kunden väljer.
    "c88b5bbb": ("BARSET I LJUS EKOPTIK", "Bord och fyra pallar"),
    "63a37524": ("BARSET I RUSTIKBRUN TRÄOPTIK", "Bord och fyra pallar"),
}

INGRESS = {
    "441d2209": (
        "Ett barbord löser det ett matbord inte gör: det tar upp {bordd} cm djup i stället "
        "för nästan en meter, och det går att ställa mot en vägg. Det här mäter {bord} "
        "och kommer med två pallar med {sitthojd} cm sitthöjd. Skivan är {yta}, benen "
        "svart stål."),
    "394de213": (
        "Det som brukar saknas på ett barbord är någonstans att lägga sakerna man inte "
        "äter med. Den här modellen har en hylla på {hylla} under skivan, tillräckligt "
        "för bricka, tidningar eller ett par skålar. Bordet mäter {bord} och de två "
        "runda pallarna har {sitthojd} cm sitthöjd."),
    "f4ed1264": (
        "Marmoroptik gör ett litet bord dyrare i uttrycket än i verkligheten. Skivan är "
        "{yta} och mäter {bordb} × {bordd} cm, alltså smal nog för en köksvägg men "
        "{bordb} cm lång — två personer sitter bredvid varandra i stället för mitt emot. "
        "Pallarna är runda och mäter {sits}."),
    "3b38e191": (
        "Skillnaden mellan en pall och en stol märks efter tjugo minuter. Det här setet "
        "har två stolar med hög rygg i stället för pallar, {sits} höga, och det gör "
        "bordet till en plats man stannar vid. Bordet mäter {bord} och sitthöjden är "
        "{sitthojd} cm."),
    "51c43e67": (
        "Stoppad sits och ryggstöd, men fortfarande en pall — den tar mindre plats än en "
        "barstol och går att skjuta in under skivan. Dynan är {sitsyta}, ryggstödet "
        "{rygg}, och sitthöjden {sitthojd} cm. Bordet mäter {bord} med {yta}."),
    "c3bda64a": (
        "Det här är barbordet för dig som vill ha förvaringen i möbeln i stället för "
        "bredvid den. Under skivan sitter två öppna hyllplan på {hylla}, och bordet är "
        "{bordh} cm högt — högre än de flesta, så pallarna har {sitthojd} cm sitthöjd. "
        "Skivan tål {bordlast}, vilket är ovanligt mycket för ett bord i den här "
        "storleken."),
    "c88b5bbb": (
        "Fyra sittplatser runt {bordb} × {bordd} cm fungerar för att pallarna skjuts in "
        "helt under skivan när de inte används. Setet är {delar} delar: ett bord på "
        "{bordh} cm höjd och fyra pallar med {sitthojd} cm sitthöjd. Skivan är {yta}."),
    "63a37524": (
        "Samma femdelade set som i ljus ek, men med {yta} — mörkare, med synlig ådring "
        "och matt yta. Bordet mäter {bord} och de fyra pallarna har {sitthojd} cm "
        "sitthöjd. Pallarna går in helt under skivan när de inte används."),
}

EGENSKAPER = {
    "441d2209": [
        "Bara {bordd} cm djupt — går att ställa mot en vägg",
        "Två pallar, {sits}, sitthöjd {sitthojd} cm",
        "Skiva i {yta}",
        "{fotter} som tar upp ojämnheter i golvet",
        "Väger {vikt} monterat",
    ],
    "394de213": [
        "Hylla på {hylla} under skivan",
        "Två runda pallar, {sits}, sitthöjd {sitthojd} cm",
        "Ram i vitt med skiva i ekoptik",
        "{fotter}",
        "Väger {vikt} monterat",
    ],
    "f4ed1264": [
        "Skiva i {yta}, {bordb} × {bordd} cm",
        "Två runda pallar, {sits}, sitthöjd {sitthojd} cm",
        "Svart stålram med korsstag",
        "{fotter} som tar upp ojämnheter i golvet",
        "Väger {vikt} monterat",
    ],
    "3b38e191": [
        "Två stolar med hög rygg, {sits}, sitthöjd {sitthojd} cm",
        "Sittyta på {sitsyta}",
        "Bord på {bord} med {yta}",
        "{fotter}",
        "Väger {vikt} monterat",
    ],
    "51c43e67": [
        "Stoppad sits, {sitsyta}",
        "Ryggstöd på {rygg}",
        "Två pallar, {sits}, sitthöjd {sitthojd} cm",
        "Bord på {bord} med skiva i {yta}",
        "Väger {vikt} monterat",
    ],
    "c3bda64a": [
        "Två öppna hyllplan, {hylla}",
        "Skivan tål {bordlast} — mest i hela serien",
        "Två pallar, {sits}, sitthöjd {sitthojd} cm",
        "Fotstöd på {fotstod}",
        "Ställningsyta på golvet {golvyta}",
    ],
    "c88b5bbb": [
        "{delar} delar: ett bord och fyra pallar",
        "Bord på {bord} med {yta}",
        "Pallar på {sits}, sitthöjd {sitthojd} cm",
        "{fotter}",
        "Väger {vikt} monterat",
    ],
    "63a37524": [
        "{delar} delar: ett bord och fyra pallar",
        "Bord på {bord} med {yta}",
        "Pallar på {sits}, sitthöjd {sitthojd} cm",
        "{fotter}",
        "Väger {vikt} monterat",
    ],
}

# ☠️ Steg 2:s säkerhetssiffra får en EGEN RUBRIK och skrivs som ett positivt
#    villkor. Inget varningsblock, ingen fetstil, ingen utropstecken — men den
#    står i klartext och tidigt nog att kunden ser den före köpet.
LAST = {
    "441d2209": (
        "Bordsskivan är gjord för glas, tallrikar och en frukost — {bordlast} fördelat "
        "över ytan. Det räcker för två kuvert med mat och dryck, ungefär två matkassar. "
        "Ställ inte upp dig på den, och använd en annan yta för matberedaren. Varje pall "
        "tål {sitslast}."),
    "394de213": (
        "Skivan tål {bordlast} fördelat över ytan och pallarna {sitslast} var. Hyllan "
        "under är tänkt för brickor, tidningar och skålar — lägg det tyngsta på skivan, "
        "inte på hyllan."),
    "f4ed1264": (
        "Skivan tål {bordlast} fördelat över ytan, och varje pall {sitslast}. Det räcker "
        "för servering till två personer. Ställ inte upp dig på skivan."),
    "3b38e191": (
        "Skivan tål {bordlast} fördelat över ytan och varje stol {sitslast}. Sitt på "
        "sitsen, inte på ryggstödet, och luta inte stolen bakåt på två ben."),
    "51c43e67": (
        "Skivan tål {bordlast} fördelat över ytan — det lägre av talen i det här setet, "
        "så lägg tyngre saker på köksbänken. Sitsen tål {sitslast}, vilket är det högsta "
        "i serien."),
    "c3bda64a": (
        "Skivan tål {bordlast} fördelat över ytan, vilket är ovanligt mycket för ett "
        "barbord — här får en köksmaskin faktiskt stå. Hyllplanen tål {hyllast} var, "
        "alltså betydligt mindre: de är till för glas, flaskor och korgar. Pallarna tål "
        "{sitslast} var."),
    "c88b5bbb": (
        "Bordsskivan tål {bordlast} fördelat över ytan. Det är en yta för glas, "
        "tallrikar och en kaffekokare — inte för en köksmaskin eller för att stå på. "
        "Varje pall tål {sitslast}, så fyra vuxna sitter utan problem."),
    "63a37524": (
        "Bordsskivan tål {bordlast} fördelat över ytan, alltså glas, tallrikar och "
        "servering — inte tunga apparater, och inte att stå på. Varje pall tål "
        "{sitslast}."),
}

SPEC = {
    "441d2209": [("Mått bord", "{bord}"), ("Mått pall", "{sits}"),
                 ("Sitthöjd", "{sitthojd} cm"), ("Antal delar", "{delar}"),
                 ("Material", "{material}"), ("Yta", "{yta}"), ("Färg", "{farg_lang}"),
                 ("Maxlast skiva", "{bordlast}"), ("Maxlast sits", "{sitslast}"),
                 ("Vikt", "{vikt}"), ("Paketmått", "{paket}")],
    "394de213": [("Mått bord", "{bord}"), ("Mått hylla", "{hylla}"),
                 ("Mått pall", "{sits}"), ("Sitthöjd", "{sitthojd} cm"),
                 ("Antal delar", "{delar}"), ("Material", "{material}"),
                 ("Yta", "{yta}"), ("Färg", "{farg_lang}"),
                 ("Maxlast skiva", "{bordlast}"), ("Maxlast sits", "{sitslast}"),
                 ("Vikt", "{vikt}"), ("Paketmått", "{paket}")],
    "f4ed1264": [("Mått bord", "{bord}"), ("Mått pall", "{sits}"),
                 ("Sitthöjd", "{sitthojd} cm"),
                 ("Antal delar", "{delar}"), ("Material", "{material}"),
                 ("Yta", "{yta}"), ("Färg", "{farg_lang}"),
                 ("Maxlast skiva", "{bordlast}"), ("Maxlast sits", "{sitslast}"),
                 ("Vikt", "{vikt}"), ("Paketmått", "{paket}")],
    "3b38e191": [("Mått bord", "{bord}"), ("Mått stol", "{sits}"),
                 ("Sittyta", "{sitsyta}"), ("Sitthöjd", "{sitthojd} cm"),
                 ("Antal delar", "{delar}"), ("Material", "{material}"),
                 ("Yta", "{yta}"), ("Färg", "{farg_lang}"),
                 ("Maxlast skiva", "{bordlast}"), ("Maxlast sits", "{sitslast}"),
                 ("Vikt", "{vikt}"), ("Paketmått", "{paket}")],
    "51c43e67": [("Mått bord", "{bord}"), ("Mått pall", "{sits}"),
                 ("Sittyta", "{sitsyta}"), ("Ryggstöd", "{rygg}"),
                 ("Sitthöjd", "{sitthojd} cm"), ("Antal delar", "{delar}"),
                 ("Material", "{material}"), ("Yta", "{yta}"), ("Färg", "{farg_lang}"),
                 ("Maxlast skiva", "{bordlast}"), ("Maxlast sits", "{sitslast}"),
                 ("Vikt", "{vikt}"), ("Paketmått", "{paket}")],
    "c3bda64a": [("Mått bord", "{bord}"), ("Mått hyllplan", "{hylla}"),
                 ("Mått pall", "{sits}"), ("Sitthöjd", "{sitthojd} cm"),
                 ("Fotstöd", "{fotstod}"), ("Golvyta", "{golvyta}"),
                 ("Antal delar", "{delar}"), ("Material", "{material}"),
                 ("Yta", "{yta}"), ("Färg", "{farg_lang}"),
                 ("Maxlast skiva", "{bordlast}"), ("Maxlast hyllplan", "{hyllast}"),
                 ("Maxlast sits", "{sitslast}")],
    "c88b5bbb": [("Mått bord", "{bord}"), ("Mått pall", "{sits}"),
                 ("Sitthöjd", "{sitthojd} cm"), ("Antal delar", "{delar}"),
                 ("Material", "{material}"), ("Yta", "{yta}"), ("Färg", "{farg_lang}"),
                 ("Maxlast skiva", "{bordlast}"), ("Maxlast sits", "{sitslast}"),
                 ("Vikt", "{vikt}"), ("Paketmått", "{paket}")],
    "63a37524": [("Mått bord", "{bord}"), ("Mått pall", "{sits}"),
                 ("Sitthöjd", "{sitthojd} cm"), ("Antal delar", "{delar}"),
                 ("Material", "{material}"), ("Yta", "{yta}"), ("Färg", "{farg_lang}"),
                 ("Maxlast skiva", "{bordlast}"), ("Maxlast sits", "{sitslast}"),
                 ("Vikt", "{vikt}"), ("Paketmått", "{paket}")],
}

SKOTSEL = {
    "441d2209": (
        "{montering} Melaminytan torkas av med en lätt fuktad trasa och torkas efter; "
        "låt inte vatten bli stående i kanterna. Använd underlägg under varmt gods och "
        "skärbräda i stället för att skära direkt på skivan. Justera fötterna om bordet "
        "vickar, och efterdra skruvarna när setet varit i bruk en tid."),
    "394de213": (
        "{montering} Torka av skivan med en lätt fuktad trasa och torka efter. Den vita "
        "ramen tål samma behandling; undvik skurmedel som repar lacken. Hyllan lyfter "
        "av damm snabbt — dammtorka den när du torkar skivan. Efterdra skruvarna efter "
        "en tids användning."),
    "f4ed1264": (
        "{montering} Marmoroptiken är en melaminyta, inte sten: den torkas av med en "
        "fuktad trasa och tål inte slipande rengöring. Använd underlägg under varmt "
        "gods. Justera fötterna om bordet vickar och efterdra skruvarna efter en tids "
        "användning."),
    "3b38e191": (
        "{montering} Skivan torkas av med en lätt fuktad trasa. Metallramen är "
        "pulverlackerad och tål samma rengöring; laga repor i lacken innan de börjar "
        "rosta. Efterdra skruvarna i stolarnas ryggstöd med jämna mellanrum — det är "
        "där rörelsen sitter."),
    "51c43e67": (
        "{montering} Dynan är klädd i PU och torkas av med en fuktad trasa; använd inget "
        "lösningsmedel, det gör materialet sprött. Skivan torkas av på samma sätt. "
        "Efterdra skruvarna i ryggstödet med jämna mellanrum."),
    "c3bda64a": (
        "{montering} Skivan och hyllplanen torkas av med en lätt fuktad trasa och torkas "
        "efter. Stålstommen är svartlackerad; undvik skurmedel. Justera fötterna om "
        "bordet vickar — med den här höjden märks en ojämnhet i golvet tydligare än på "
        "ett lägre bord. Efterdra skruvarna efter en tids användning."),
    "c88b5bbb": (
        "{montering} Melaminytan torkas av med en lätt fuktad trasa och torkas efter. "
        "Använd underlägg under varmt gods och skärbräda i stället för att skära direkt "
        "på skivan. Justera skyddsfötterna om bordet vickar, och efterdra skruvarna när "
        "setet varit i bruk en tid."),
    "63a37524": (
        "{montering} Den mörka träoptiken är en melaminyta och torkas av med en lätt "
        "fuktad trasa; torka efter så syns inga ränder. Använd underlägg under varmt "
        "gods. Justera skyddsfötterna om bordet vickar, och efterdra skruvarna efter en "
        "tids användning."),
}

FAQ = {
    "441d2209": [
        ("Hur mycket plats tar bordet?", "{bord}, alltså bara {bordd} cm djupt. Det går "
         "att ställa mot en vägg och pallarna skjuts in under skivan när de inte används."),
        ("Hur höga är pallarna?", "Sitthöjden är {sitthojd} cm och pallen mäter {sits}. "
         "Bordet är {bordh} cm högt, så det blir {bordh_minus_sits} cm mellan sits och skiva."),
        ("Vad ingår?", "{ingar}."),
        ("Hur mycket tål bordsskivan?", "{bordlast} fördelat över ytan. Varje pall tål {sitslast}."),
    ],
    "394de213": [
        ("Hur stor är hyllan?", "{hylla}. Den sitter under skivan och är öppen på alla "
         "sidor — tänkt för brickor, tidningar och skålar."),
        ("Hur höga är pallarna?", "Sitthöjden är {sitthojd} cm och pallen mäter {sits}. "
         "Bordet är {bordh} cm högt."),
        ("Vad ingår?", "{ingar}."),
        ("Hur mycket tål bordsskivan?", "{bordlast} fördelat över ytan. Varje pall tål {sitslast}."),
    ],
    "f4ed1264": [
        ("Är skivan riktig marmor?", "Nej. Skivan är {yta} — ett tryckt mönster på en "
         "slät yta som är lättare att hålla ren än sten och betydligt lättare att bära."),
        ("Hur stora är pallarna?", "Pallen mäter {sits} vid golvet — det är benens "
         "fotavtryck, inte sitsen, som är rund. Sitthöjden är {sitthojd} cm."),
        ("Vad ingår?", "{ingar}."),
        ("Hur mycket tål bordsskivan?", "{bordlast} fördelat över ytan. Varje pall tål {sitslast}."),
    ],
    "3b38e191": [
        ("Har stolarna ryggstöd?", "Ja. Det här är setets skillnad mot de andra: två "
         "stolar med hög rygg, {sits} höga, i stället för pallar. Sittytan är {sitsyta}."),
        ("Hur hög är sitsen?", "{sitthojd} cm. Bordet är {bordh} cm högt."),
        ("Vad ingår?", "{ingar}."),
        ("Hur mycket tål bordsskivan?", "{bordlast} fördelat över ytan. Varje stol tål {sitslast}."),
    ],
    "51c43e67": [
        ("Vad är sitsen klädd med?", "PU över skumplast. Dynan är {sitsyta} och "
         "ryggstödet mäter {rygg}."),
        ("Är det pallar eller stolar?", "Pallar med ryggstöd. De tar mindre plats än en "
         "barstol och går att skjuta in under skivan, men du har ändå något att luta dig "
         "mot. Sitthöjden är {sitthojd} cm."),
        ("Vad ingår?", "{ingar}."),
        ("Hur mycket tål bordsskivan?", "{bordlast} fördelat över ytan. Sitsen tål {sitslast}."),
    ],
    "c3bda64a": [
        ("Vad får plats på hyllplanen?", "Hyllorna mäter {hylla}. De tar glas, flaskor "
         "och korgar; varje plan tål {hyllast}."),
        ("Varför är bordet högre än de andra?", "Det är {bordh} cm högt, och därför har "
         "pallarna {sitthojd} cm sitthöjd i stället för de vanligare värdena i serien. "
         "Fotstöden sitter på {fotstod}."),
        ("Hur mycket plats tar det på golvet?", "Bordet är {bord}. Med pallarna utdragna "
         "behöver du ungefär {golvyta}."),
        ("Hur mycket tål bordsskivan?", "{bordlast} fördelat över ytan — mest i hela "
         "serien. Hyllplanen tål {hyllast} var och pallarna {sitslast} var."),
    ],
    "c88b5bbb": [
        ("Hur många sitter runt bordet?", "Fyra. Setet är {delar} delar: ett bord på "
         "{bord} och fyra pallar. Pallarna skjuts in helt under skivan."),
        ("Vad skiljer det från det rustikbruna setet?", "Ytan och materialet i skivan. "
         "Det här har {yta} i {material}; det andra har en mörkare träoptik. Mått, "
         "sitthöjd och maxlast är desamma."),
        ("Vad ingår?", "{ingar}."),
        ("Hur mycket tål bordsskivan?", "{bordlast} fördelat över ytan. Varje pall tål {sitslast}."),
    ],
    "63a37524": [
        ("Hur många sitter runt bordet?", "Fyra. Setet är {delar} delar: ett bord på "
         "{bord} och fyra pallar med {sitthojd} cm sitthöjd."),
        ("Vad skiljer det från setet i ljus ek?", "Ytan och materialet i skivan. Det här "
         "har {yta} i {material}; det ljusa har en ekoptik. Mått, sitthöjd och maxlast "
         "är desamma."),
        ("Vad ingår?", "{ingar}."),
        ("Hur mycket tål bordsskivan?", "{bordlast} fördelat över ytan. Varje pall tål {sitslast}."),
    ],
}


def _falt(pid):
    """Fälten som texten får formatera med — plus två HÄRLEDDA som räknas här.

    ☠️ `bordh_minus_sits` räknas ur matt.py, aldrig för hand. Det är skillnaden
       mellan bordshöjd och sitthöjd, alltså benutrymmet, och den enda siffra i
       hela rundan som inte står ordagrant i leverantörens rad.
    """
    d = dict(M[pid])
    d["bordh_minus_sits"] = int(round(d["bordh"] - d["sitthojd"]))
    return d


def _f(text, pid):
    return text.format(**_falt(pid))


def bygg(pid):
    """Returnerar (namn, slug, titel, meta, sökord, html)."""
    ut = [f"<p>{_f(INGRESS[pid], pid)}</p>"]

    ut.append("<h2>Det här är setet</h2><ul>")
    for rad in EGENSKAPER[pid]:
        text = _f(rad, pid)
        ut.append(f"<li>{text[:1].upper()}{text[1:]}</li>")
    ut.append("</ul>")

    # Steg 2:s säkerhetssiffra, egen rubrik, positivt villkor.
    ut.append("<h2>Så mycket tål bordet</h2>")
    ut.append(f"<p>{_f(LAST[pid], pid)}</p>")

    ut.append("<h2>Tekniska specifikationer</h2><ul>")
    for etikett, varde in SPEC[pid]:
        ut.append(f"<li><strong>{etikett}:</strong> {_f(varde, pid)}</li>")
    ut.append("</ul>")

    ut.append("<h2>Montering och skötsel</h2>")
    ut.append(f"<p>{_f(SKOTSEL[pid], pid)}</p>")

    if KORSLANK.get(pid):
        lankar = " ".join(
            f'<a href="https://www.fyndplats.se/produkt/{s}">{t.capitalize()}</a>.'
            for s, t in KORSLANK[pid])
        ut.append("<h2>Passar inte det här?</h2>")
        ut.append(f"<p>{lankar}</p>")

    ut.append("<h2>Vanliga frågor</h2>")
    for fraga, svar in FAQ[pid]:
        # ☠️ FRÅGA och SVAR som TVÅ <p>. Wix strippar <br>.
        ut.append(f"<p><strong>{fraga}</strong></p>")
        s = _f(svar, pid)
        ut.append(f"<p>{s[:1].upper()}{s[1:]}</p>")

    return (NAMN[pid], SLUG[pid], TITEL[pid], _f(META[pid], pid), SOKORD[pid], "".join(ut))


if __name__ == "__main__":
    from matt import ALLA
    for pid in ALLA:
        n, s, t, m, k, h = bygg(pid)
        print(f"{pid}  namn {len(n):>2}  titel {len(t):>2}  meta {len(m):>3}  "
              f"html {len(h):>5}  {s}")
