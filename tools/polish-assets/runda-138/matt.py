# -*- coding: utf-8 -*-
"""Runda 138 — facit. Varje tal här är LÄST ur leverantörens `Technische
Daten` eller ur måttritningen; inget är härlett och inget är avrundat.

☠️ LÄS HELA BLADET INNAN DU SÄGER ATT ETT FÄLT SAKNAS. `1366a476`:s
   `Maximale Belastung` och `Gewicht des Haustiers` är de två SISTA raderna i
   dess tekniska data, och en läsning kapad vid 1 700 tecken rapporterade dem
   som tomma. En avhuggen läsning ser ut precis som ett saknat värde.

☠️ SISAL ÄR INTE FAMILJENS GEMENSAMMA MATERIAL. Tre av sju har det inte:
   `68bc6c0c` och `e5b31270` är lindade med BOMULLSREP, `fecadb3e` med JUTE.
   Ordet stämmer på fyra av sju, vilket är precis vad som gör det farligt.

☠️ `Artikelnummer` är ALDRIG en spec-etikett. Numret bor på mappningsradens
   `supplierProductId` och ingen annanstans.
"""

WIX = {
    "1366a476": "1366a476-4cdd-4638-bc14-e0ab3e6cbc3b",
    "839a2ef5": "839a2ef5-e367-48a1-8436-bd269745cb4c",
    "68bc6c0c": "68bc6c0c-f459-4735-8633-53154b0ae590",
    "e5b31270": "e5b31270-76f3-4631-b27e-19f641c9bd01",
    "fecadb3e": "fecadb3e-dc6a-4fb0-9ebb-d547b5288ec8",
    "505a0dde": "505a0dde-cf9c-4f4d-bc7b-ea73a1a37f5c",
    "7bdc47b8": "7bdc47b8-b33a-40b6-ba1d-e82be7ab6e12",
}

# ☠️ SLUGGARNA ÄR VALDA MOT DEN KAPADE SKU-BASEN, inte mot sluggen.
#    Två första förslag krockade, och båda var osynliga i sluggen:
#
#      `klostrad-200-cm-tva-hallor-hangmatta` → FP-klostrad-200-cm-tva
#          krockar med publicerade `klostrad-200-cm-tva-grottor`
#      `klostrad-takspant-240-260-cm-ljusgra` → FP-klostrad-takspant-240
#          krockar med publicerade `klostrad-takspant-240-260-cm`
#          — alltså med sitt EGET färgsyskon
#
#    Uppgift #473, ordagrant: krocken syns inte i sluggen, den uppstår i den
#    KAPADE strängen. Mätt mot alla 5 688 sluggar med husets egen `sku_bas`.
SLUG = {
    "1366a476": "klostrad-200-cm-beige-halor",
    "839a2ef5": "klostrad-230-275-cm-gront-katthus",
    "68bc6c0c": "klostrad-225-255-cm-fyra-plan-bomullsrep",
    "e5b31270": "klostrad-225-255-cm-rund-bas-sammet",
    "fecadb3e": "klostrad-240-260-cm-trafarg-katthus",
    "505a0dde": "klospelare-220-260-cm-tva-liggytor",
    "7bdc47b8": "klostrad-ljusgratt-240-260-cm",
}

# (huvudord, ord som betyder en ANNAN produkttyp och aldrig får stå i namnet)
TYP = {
    "1366a476": ("klösträd", ["klöstunna", "klöspelare", "kattrappa", "hundtrappa"]),
    "839a2ef5": ("klösträd", ["klöstunna", "klöspelare", "kattrappa", "hundtrappa"]),
    "68bc6c0c": ("klösträd", ["klöstunna", "klöspelare", "kattrappa", "hundtrappa"]),
    "e5b31270": ("klösträd", ["klöstunna", "klöspelare", "kattrappa", "hundtrappa"]),
    "fecadb3e": ("klösträd", ["klöstunna", "klöspelare", "kattrappa", "hundtrappa"]),
    # ☠️ KLÖSPELARE, inte klösträd. `505a0dde` har EN stam och två liggytor —
    #    ingen koja, ingen hylla, inget plan att gå runt på. Runda 137 satte
    #    samma gräns mot `f489937f`/`5616c567`.
    "505a0dde": ("klöspelare", ["klöstunna", "klösträd", "kattrappa", "hundtrappa"]),
    "7bdc47b8": ("klösträd", ["klöstunna", "klöspelare", "kattrappa", "hundtrappa"]),
}

# Färgen som FAKTISKT syns på bild 1 och 5 — inte den tyska spec-raden.
FARG = {
    "1366a476": "beige och cremevitt",
    "839a2ef5": "grönt",
    "68bc6c0c": "vitt och mörkgrått",
    "e5b31270": "grått",
    "fecadb3e": "träfärgat och beige",
    # ☠️ Leverantörens svenska rad säger `Färg: Gelb` — oöversatt OCH bara en
    #    av tre. Varan är gul stam, vita liggytor och LJUSBLÅ fotmatta.
    "505a0dde": "gult, vitt och ljusblått",
    "7bdc47b8": "ljusgrått",
}

# Klösytans material. Tre av sju är INTE sisal.
KLOSYTA = {
    "1366a476": "sisal",
    "839a2ef5": "sisal",
    "68bc6c0c": "bomullsrep",
    "e5b31270": "bomullsrep",
    "fecadb3e": "jute",
    "505a0dde": "sisal",
    "7bdc47b8": "sisal",
}

# Alla tal som får stå i texten. Talgrinden fäller allt utanför listan.
# ☠️ 180 står INTE med: det är måttritningens människosiluett, en skalfigur,
#    inte ett produktmått. Runda 137 mätte exakt samma fälla.
TAL = {
    "1366a476": {59, 200, 33, 8, 39, 35, 40, 29, 53, 30, 7, 20, 6, 24.6, 61, 28, 2, 3},
    "839a2ef5": {55, 34, 230, 275, 35, 30, 18, 23, 15, 40, 24, 10, 5, 11.9, 57, 36, 1, 2},
    "68bc6c0c": {60, 44, 225, 255, 30, 48, 24, 8.4, 8, 42, 18, 13, 10, 5, 17.5, 61, 56.5, 21, 1, 2},
    "e5b31270": {60, 225, 255, 30, 28, 18, 20, 12, 56, 38, 24, 7.7, 6.5, 3.5, 5, 13.7, 61, 16, 1, 2},
    "fecadb3e": {40, 240, 260, 34, 20, 30, 3, 39, 18, 13, 8.5, 5, 15, 50.5, 26, 2},
    "505a0dde": {47, 34, 220, 260, 40, 20, 9.1, 5, 6.8, 41, 16, 53.5, 52.5, 2},
    "7bdc47b8": {60, 45, 240, 260, 45, 35, 25, 18, 10, 5, 19.8, 62, 47, 33, 30, 22, 2},
}

# Maxlast (Belastbarkeit) — None betyder att källan INTE anger något tak.
MAXLAST = {
    "1366a476": 20, "839a2ef5": 10, "68bc6c0c": 10,
    "e5b31270": None, "fecadb3e": None, "505a0dde": None, "7bdc47b8": 10,
}

# Rekommenderad kattvikt, ordagrant ur källan.
KATTVIKT = {
    "1366a476": "under 6 kg",
    "839a2ef5": "upp till 5 kg",
    "68bc6c0c": "under 5 kg",
    "e5b31270": "upp till 5 kg",
    "fecadb3e": "upp till 5 kg",
    "505a0dde": "under 5 kg",
    "7bdc47b8": "upp till 5 kg",
}

# Spänns mot taket? `1366a476` gör det INTE — den har en tippskyddslina.
TAKSPANT = {
    "1366a476": False, "839a2ef5": True, "68bc6c0c": True,
    "e5b31270": True, "fecadb3e": True, "505a0dde": True, "7bdc47b8": True,
}

# `7bdc47b8` är FÄRGSYSKON till en PUBLICERAD sida, inte till ett utkast i
# rundan. Korslänken ska gå åt BÅDA håll (uppgift #480) — den publicerade
# mörkgrå sidan får en egen rad i Steg 7.
SYSKON = {
    "7bdc47b8": ("klostrad-takspant-240-260-cm",
                 "39ec9d58",
                 "Takspänt klösträd 240–260 cm i mörkgrått"),
}

# ☠️ Påståenden som är BEVISAT fel eller ogrundade i källan — se STEG2-5.md.
# ☠️ Påståenden som är BEVISAT fel eller ogrundade i källan — se STEG2-5.md.
#
# ⚠️ EN NYCKEL PER PRODUKT. Första utkastet hade `1366a476` TVÅ gånger:
#    Python behåller den sista tyst, så den första raden fanns inte. Utfallet
#    blev rätt av en slump (den sista var den fullständiga) — men en dubblerad
#    nyckel i en literal är en grind som kan försvinna utan att något klagar.
FORBJUDNA_PASTAENDEN = {
    # Bild 4 säger `50%IGE VERBESSERUNG DER STABILITÄT`. Femtio procent mot
    # VAD? Ingen jämförelsepunkt finns någonstans i källan. Och den här är
    # den enda som INTE spänns mot taket.
    "1366a476": [r"50\s*%", r"\bstabilare\b", r"\bextra\s+stabil",
                 r"mot\s+taket", r"\btakspänn", r"\bspännstång", r"\bteleskop"],
    # Tre som INTE är sisal. Ordet får inte smyga in från grannarnas text.
    "68bc6c0c": [r"\bsisal"],
    "e5b31270": [r"\bsisal"],
    "fecadb3e": [r"\bsisal"],
}

OAVGJORT = """
⚠️ Vikten i spec-tabellen är FRAKTVIKTEN (uppgift #488), inte varans egen.
   Den skrivs som `Vikt` enligt husets konvention i hela katalogen; att ändra
   etiketten på sju sidor vore en avvikelse från 2 000 andra.

⚠️ `68bc6c0c` har TVÅ hängmattor med olika form — en rund på Ø30 × 8 och en
   av tyg på 42 × 18 × 13. Leverantören skriver dem på EN rad, och den raden
   är lätt att läsa som ett enda föremål.
"""

# ☠️ SÖKORD SOM INTE STÅR I SIDANS TEXT — och som därför måste DEKLARERAS.
#
# Ett sökord är KUNDENS formulering, inte ett citat ur sidan: den som söker
# skriver "fristående klösträd" medan sidan säger "står fritt på golvet".
# Förekomstgrinden i `grind._sokordsgrind` kan alltså inte bara kräva att
# ordet finns i texten — men den får inte heller släppa allt, för då fångar
# den inte ett PÅHITTAT ord.
#
# Lösningen är att undantaget ska SYNAS. Varje ord här är en medveten
# bedömning att det är ett äkta svenskt sökord. Runda 138:s eget stavfel
# `trähärg` hade fått stå här för att slippa igenom — och det hade inte
# gjort det.
SOKORD_KUNDORD = {
    "takfäste",        # den som INTE vill spänna mot taket söker så
    "fristående",      # sidans ord är "står fritt på golvet"
    "kaktusklösträd",  # sammansättningen; sidan säger "format som en kaktus"
}


# ☠️ SERIEPÅSTÅENDEN — UNDANTAGET MÅSTE UTFÖRA SIN EGEN MÄTNING.
#
# `grind.FORBJUDET` tar uttryckligen bort `i serien` ur SORTIMENTSSUPERLATIV,
# med motiveringen att en jämförelse inom serien är "en mätbar jämförelse
# mellan sju kända tal". Motiveringen var riktig och mätningen gjordes aldrig.
# Fyra av fem sådana påståenden i rundan höll inte:
#
#   FALSKT      `505a0dde` "det bredaste spannet i serien"  40 cm mot 839a2ef5:s 45
#   FALSKT      `7bdc47b8` "den rymligaste hålan i serien"  39 375 cm³ mot 46 400
#   FALSKT      `fecadb3e` "den minsta golvytan i höjdklassen" 1 600 cm² mot 1 598
#   OMÄTBART    `505a0dde` "den grövsta stammen i serien"   två syskon anger ingen Ø
#   SANT        `505a0dde` "den lättaste modellen i serien" 6,8 kg mot näst 11,9
#
# Varje kvarvarande påstående DEKLARERAS här med det mått det vilar på, och
# `grind._seriegrind` räknar om det ur `texter.SPEC` vid varje körning. Ett
# odeklarerat seriepåstående fälls; ett deklarerat som inte längre stämmer
# fälls med talen utskrivna.
# ☠️ VÄRDET BÄR ETT FRAGMENT, och det är inte kosmetik. Nyckeln var först bara
#    (produkt, superlativord), och då LICENSIERADE ett deklarerat påstående
#    varje ANNAT påstående med samma ord på samma produkt. Mutationstestat:
#    `1366a476`:s sanna "den enda modellen i serien som står fritt" släppte
#    igenom det falska "den enda i den här höjdklassen som bär 20 kg" — grinden
#    mätte takspännet och svarade grönt om en mening som handlade om bärförmåga.
#
#    Fragmentet måste finnas i MENINGEN. Ett nytt påstående med samma ord
#    saknar det och fälls som ODEKLARERAT, vilket är rätt svar: det är inte
#    mätt än.
SERIEPASTAENDEN = {
    # (produkt, ordet): (måttets namn, "min" | "max" | "enda", fragment i meningen)
    ("505a0dde", "lättaste"): ("vikt", "min", "enkel att flytta"),
    # ☠️ `den enda … i serien` ÄR OCKSÅ ETT SERIEPÅSTÅENDE, i en annan
    #    grammatisk form. Rundan hade två, och bara det ena höll:
    #
    #      SANT       "den enda modellen i serien som står fritt på sin sockel"
    #                 — de sex andra bär `Takspänne: Ingår`, den här gör inte det.
    #      STRUKET    "den enda i den här höjdklassen som bär 20 kg"
    #                 — `1366a476` är 200 cm och ensam om den höjden, alltså en
    #                 klass med EN medlem. Påståendet är tomt, och läsaren
    #                 jämför ändå med de takspända, där tre inte anger någon
    #                 bärförmåga alls.
    ("1366a476", "enda"): ("takspanne", "enda", "står fritt"),
}
