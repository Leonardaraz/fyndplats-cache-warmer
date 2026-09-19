# -*- coding: utf-8 -*-
"""Runda 129 — nio solcellsdrivna lyktstolpar och trädgårdslyktor.

☠️ VARENDA SIFFRA PÅ SIDAN BOR HÄR, och ingen annanstans. Texten formaterar
   dem; spec-tabellen och faktakortet läser samma fält. Två skrivningar av
   samma tal driver isär — det är husets vanligaste bugg.

☠️ KÄLLAN ÄR LEVERANTÖRENS `Technische Daten` + `Lieferumfang`, läst ur
   utkastets egen `plainDescription`. Ett tal som bara står i INGRESSEN är
   marknadsföring och kan gälla ett syskon (runbookens minibackofen-fall).

⚠️ `None` betyder OVERIFIERAT och får aldrig nå en text. Grinden fäller på
   strängen "None" just för att `format()` renderar den som en uppgift.

FAMILJEN: 15 solcellslampor i utkast, NOLL publicerade konkurrenter i
katalogen (mätt 2026-09-11 över 5 649 produkter — de sju "träffarna" på
svenska solord är en snögubbe med lykta, en halloweenhäxa, två
planteringsbord, en planteringsvagn, en fågelmatare och en väderstation).
Runda 129 tar de NIO på mast; de sex rottinglamporna är runda 130.
"""

# ── Gemensamt för hela familjen ────────────────────────────────────────────
# Alla nio är IP44. ☠️ IP44 är STÄNKSKYDD, inte "vattentät" — leverantören
# skriver "Wasserdicht" på flera av dem och det är fel att översätta rakt av.
IP = "IP44"

# ☠️ VIKTEN ÄR TVÅ TAL, OCH IMPORTEN SKRIVER DEN GROVA UNDER FEL ETIKETT.
#    Aosoms feedkolumn heter `Weight (incl. Package)` (CLAUDE.md), och
#    `buildSpecifications` skriver den som `Vikt`. Uppmätt på de fyra av nio
#    där tyskan OCKSÅ ger `Nettogewicht`:
#
#      a6727ca5  1,5 kg netto   mot  2,2 kg i spec-tabellen
#      9938574b  1,56 kg netto  mot  2,2 kg
#      6747b6c0  1,1 kg netto   mot  1,4 kg
#      ec8ab782  5,6 kg netto   mot  6,4 kg
#
#    Kvoten är 1,27-1,47, alltså emballage. `vikt` är varans egen och
#    skrivs som `Vikt`; `bruttovikt` är kollit och skrivs som
#    `Vikt med emballage`. Ingen sida får bära det grova talet som varans.

M = {
    # ═══ Lyktstolpar med planteringsfot (ABS + rostfritt) ═══
    "14aa1777": dict(
        art="2-pack lyktstolpar",
        matt="23,5 × 23,5 × 180 cm",
        hojd=180, justerbar="upp till 150 cm utan lamphuvud, fyra sektioner",
        lampor=2,          # två STOLPAR i paketet, ett huvud var
        huvuden=1,
        lumen="200 lm högt läge, 100 lm lågt",
        kelvin=2600,
        laddtid="6 timmar", lystid="8 timmar",
        material="ABS-plast och rostfritt stål",
        farg="svart",
        vikt=None, bruttovikt="5,4 kg",
        paket="48,5 × 25 × 44 cm",
        solpanel="16,5 × 15 cm",
        ingar="två lyktstolpar, jordspett, skruvar och monteringsanvisning",
        montering=True,
        kruka=False,
        pris=1299,
    ),
    "1f14ab66": dict(
        art="lyktstolpe med planteringskruka",
        matt="41,5 × 41,5 × 195 cm",
        hojd=195, justerbar=None,
        lampor=1,
        huvuden=1,
        lumen="200 lm högt läge, 100 lm lågt",
        kelvin=None,
        laddtid="8 timmar", lystid="6 timmar",
        material="plast",
        farg="svart",
        vikt=None, bruttovikt="6,5 kg",
        paket="44 × 44 × 36 cm",
        solpanel="16,5 × 15 cm",
        lamphuvud="23,5 × 23,5 × 30 cm",
        ingar="en lyktstolpe och en bruksanvisning",
        montering=True,
        kruka=True,
        pris=1219,
    ),
    "c9ab8531": dict(
        art="lyktstolpe med två lamphuvuden",
        matt="53,5 × 30 × 182 cm",
        hojd=182, justerbar="ja, höjden går att ställa",
        lampor=1,
        huvuden=2,
        lumen="60 lm",
        kelvin=None,
        laddtid="8 timmar", lystid="6 timmar",
        material="ABS-plast och rostfritt stål",
        farg="svart",
        vikt=None, bruttovikt="3,6 kg",
        paket="37 × 32,5 × 33,5 cm",
        solpanel="6 × 3,5 cm",
        effekt="1,08 W solpanel, 0,4 W lampa",
        ingar="en lyktstolpe med två huvuden och en anvisning",
        montering=True,
        kruka=True,
        pris=1199,
    ),
    "4ef7c2b4": dict(
        art="lyktstolpe med tre lamphuvuden",
        matt="47–52 × 47–52 × 185 cm",
        hojd=185, justerbar="upp till 185 cm",
        lampor=1,
        huvuden=3,
        lumen="90 lm",
        kelvin=6000,
        laddtid="6 timmar", lystid="8 timmar",
        material="ABS-plast, rostfritt stål 201 och PET",
        farg="svart och transparent",
        vikt=None, bruttovikt="4,7 kg",
        paket="38,5 × 38,5 × 33,5 cm",
        solpanel="4,5 V, 1,62 W",
        effekt="0,4 W",
        ingar="en lyktstolpe och en bruksanvisning",
        montering=True,
        kruka=True,
        pris=1299,
    ),
    "ec8ab782": dict(
        art="lyktstolpe med tre skärmar",
        matt="60 × 55 × 189 cm",
        hojd=189, justerbar=None,
        lampor=1,
        huvuden=3,
        lumen=None,
        kelvin=None,
        laddtid=None, lystid="6 timmar",
        material="plast, ABS och rostfritt stål",
        farg="svart",
        vikt="5,6 kg", bruttovikt="6,4 kg",
        paket=None,
        solpanel=None,
        fot="41,5 × 41,5 × 33 cm",
        batteri="sex laddningsbara AA-batterier, 3,2 V / 400 mA",
        lagen="högt, lågt och av",
        ingar="en solcellslampa och en monteringsanvisning",
        montering=True,
        kruka=True,
        pris=1459,
    ),
    "db933c3c": dict(
        art="lyktstolpe med tre lampor",
        matt="51,5 × 47 × 182,5 cm",
        hojd=182.5, justerbar=None,
        lampor=1,
        huvuden=3,
        lumen="120 lm",
        kelvin=6000,
        laddtid=None, lystid="6 timmar",
        material="rostfritt stål 201 och plast",
        farg="svart",
        vikt=None, bruttovikt="2,5 kg",
        paket="42 × 40 × 21 cm",
        solpanel="fyra a-Si-paneler per lampa",
        dimbar=True,
        ingar="en solcellslykta och en anvisning",
        montering=True,
        kruka=False,
        pris=1079,
    ),

    # ═══ Enkla lyktor på spett eller sockel ═══
    "a6727ca5": dict(
        art="trädgårdslykta med flameffekt",
        matt="Ø 26,5 × 177 cm",
        hojd=177, justerbar=None,
        lampor=1,
        huvuden=1,
        lumen=None,
        kelvin=3500,
        laddtid=None, lystid="6 timmar",
        material="ABS-plast",
        farg="svart",
        vikt="1,5 kg", bruttovikt="2,2 kg",
        paket="24,5 × 23 × 40 cm",
        solpanel=None,
        leds=6,
        batteri="ett litiumbatteri, 3,7 V / 800 mA",
        ingar="en solcellslampa, ett litiumbatteri, ett jordspett och en monteringsanvisning",
        montering=True,
        kruka=False,
        pris=799,
    ),
    "9938574b": dict(
        art="2-pack trädgårdslyktor",
        matt="Ø 18,5 × 129 cm",
        hojd=129, justerbar=None,
        lampor=2,
        huvuden=1,
        lumen=None,
        kelvin=6000,
        laddtid=None, lystid="6 timmar",
        material="ABS-plast",
        farg="svart",
        vikt="1,56 kg", bruttovikt="2,2 kg",
        paket="36 × 32 × 18 cm",
        solpanel=None,
        batteri="ett litiumbatteri per lampa, 3,2 V / 400 mA",
        ingar="två solcellslampor, två litiumbatterier, två jordspett och en monteringsanvisning",
        montering=True,
        kruka=False,
        pris=769,
    ),
    "6747b6c0": dict(
        art="trädgårdslykta i rostfritt stål",
        matt="18 × 18 × 160 cm",
        hojd=160, justerbar=None,
        lampor=1,
        huvuden=1,
        lumen="40 lm",
        kelvin=None,
        laddtid=None, lystid="6 timmar",
        material="rostfritt stål och plast",
        farg="svart",
        vikt="1,1 kg", bruttovikt="1,4 kg",
        paket="45 × 22,5 × 19,5 cm",
        solpanel="fyra solceller",
        batteri="ett batteri, 3,2 V / 600 mA",
        ingar="en trädgårdslykta, en bruksanvisning och monteringstillbehör",
        montering=True,
        kruka=False,
        pris=699,
    ),
}

ALLA = list(M)

# ☠️ RUNDANS SEX PARKERADE — rottinglamporna, runda 130. De står här så att
#    nästa runda slipper mäta om familjen, och så att Steg 1:s syskonfråga
#    går att besvara utan ett nytt katalogsvep.
PARKERADE = {
    "65e3c24f": "Rottinglampa Ø37 × 144 cm, tre lampor och hylla, 969 kr",
    "4e23a904": "Rottinglampa i bågform 44 × 32 × 178 cm, 739 kr",
    "66a26135": "Rottinglampa 22 × 22 × 77 cm, 25 LED, 929 kr",
    "5ffb91a2": "Rottinglampa Ø34 × 130 cm, 899 kr",
    "ef0c374b": "2-pack rottinglampor Ø45 och Ø35 cm, 1 399 kr",
    "a8cf27cd": "Rottinglykta Ø21,5 × 61 cm, brun, 659 kr",
}

# ☠️ ANNAN PRODUKTTYP — inte en lampa. Ligger kvar i kön.
UTANFOR = {
    "137403f6": "Solpanel 100 W 18 V, bärbar med USB — laddare, inte belysning",
}
