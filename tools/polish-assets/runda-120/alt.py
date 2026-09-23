# -*- coding: utf-8 -*-
"""Runda 120 Steg 9 — alt-texterna och galleriordningen, GRINDADE.

☠️ ALT-TEXTEN PASSERAR INGEN AV RUNDANS ÖVRIGA GRINDAR. `grind.py` läser
   `texter.py`; alt-texterna finns inte i den filen och skrivs rakt in i Wix
   media. Varje regel textgrinden vaktar är alltså oskyddad här — och det är
   det sämsta stället att ha ett hål, för alt-texten är vad Google och
   skärmläsaren läser.

   Runda 106 mätte fallet: sex sidor vars brödtext sa att hagen inte säljs som
   kaninbostad, och FEM av dem hade "kaniner" i en alt-text.

   Filen kör SAMMA listor, inte omskrivna varianter: `grind.FORBJUDET`,
   `TONGRINDAR`, `NEGERANDE_GRINDAR`, `ENSKILDA`, `STAVFEL`, `MASSIVT`,
   homoglyfsvitlistan och talgrinden mot `matt.py`.

⚠️ BESKRIV VARAN, INTE STAJLINGEN. Leverantörens miljöbild är iscensatt. Det
   som står PÅ skivan är rekvisita — det får nämnas som scen, aldrig bli ett
   påstående om vad som ingår.

GALLERIORDNINGEN: 1 hjältebild · 2 verklighetsbild · 3 EGET KORT · därefter
   detaljfoton · SIST måttritningen. Leverantörens bild 3 ÄR måttritningen och
   ligger i rå-importen på plats 3 — den ska alltså FLYTTAS sist (uppgift
   #371: på alla sju runda 104-sidor låg den kvar).
"""
import re
import sys

sys.path.insert(0, "..")
import grindar as G          # noqa: E402
import grind                 # noqa: E402
import matt as M             # noqa: E402
import texter as T           # noqa: E402

# ── Galleriordningen per produkt ───────────────────────────────────────────
# "K" = vårt eget spec-kort. Siffrorna är leverantörens bildnummer 1–5.
#
# ☠️ `441d2209` SAKNAR BILD 4 MED FLIT. Den visar TVÅ bord och TRE pallar mot
#    setets ett bord och två — leverantörens marknadsföring av en större
#    uppställning. Se Steg 4.
ORDNING = {
    "441d2209": [1, 2, "K", 5, 3],
    "394de213": [1, 2, "K", 4, 5, 3],
    "f4ed1264": [1, 2, "K", 4, 5, 3],
    "3b38e191": [1, 2, "K", 4, 5, 3],
    "51c43e67": [1, 2, "K", 4, 5, 3],
    "c3bda64a": [1, 2, "K", 4, 5, 3],
    "c88b5bbb": [1, 2, "K", 4, 5, 3],
    "63a37524": [1, 2, "K", 4, 5, 3],
}

ALT = {
    "441d2209": {
        1: "Barbord i grå träoptik med svart stålram och två fyrkantiga pallar "
           "i samma yta, inskjutna under skivan. Fristående mot vit bakgrund.",
        2: "Barbordet står längs en köksvägg med de två pallarna framför sig. "
           "Skivan är dukad med frukost och en kanna.",
        "K": "Faktakort: barbord 80 × 50 × 87 cm med två pallar, sitthöjd 57 cm, "
             "i grå träoptik med svart stålram.",
        5: "Barbordet används som skrivbord i ett hörn, med en bärbar dator på "
           "skivan och en av pallarna vid sidan.",
        3: "Måttritning av barbordet: 80 cm brett, 50 cm djupt och 87 cm högt. "
           "Pallen mäter 40 × 30 cm och har 57 cm sitthöjd.",
    },
    "394de213": {
        1: "Barbord med vit metallram och skiva i ekoptik, med en öppen hylla "
           "under skivan och två runda pallar i samma vita ram.",
        2: "Barbordet vid ett köksfönster med de två runda pallarna framför och "
           "koppar uppställda på skivan.",
        "K": "Faktakort: barbord 80 × 50 × 90 cm med hylla på 64 × 34 cm och två "
             "runda pallar, sitthöjd 60 cm.",
        4: "Närbild på bordsskivans hörn i ljus ekoptik, med den vita ramens "
           "kant synlig under kanten.",
        5: "Närbild på ett av de vita runda benen, fotograferat mot ett grått "
           "underlag.",
        3: "Måttritning av barbordet: 80 cm brett, 50 cm djupt och 90 cm högt, "
           "med hyllan på 64 × 34 cm. Den runda pallen är 60 cm hög.",
    },
    "f4ed1264": {
        1: "Barbord med skiva i vit marmoroptik på svart stålram, med två runda "
           "pallar som har svarta sitsar.",
        2: "Barbordet i ett kök med en skål frukt på skivan och de två runda "
           "pallarna framför sig.",
        "K": "Faktakort: barbord 100 × 40 × 90 cm i vit marmoroptik med två runda "
             "pallar, sitthöjd 60 cm.",
        4: "Barbordet i ett rum med mörka väggpaneler, med de två pallarna "
           "inskjutna och en vas på skivan.",
        5: "Närbild på den vita marmoroptiken vid skivans kant, med en kopp och "
           "ett fat ovanpå.",
        3: "Måttritning av barbordet: 100 cm brett, 40 cm djupt och 90 cm högt. "
           "Pallen mäter 41 × 41 cm vid golvet och är 60 cm hög.",
    },
    "3b38e191": {
        1: "Barbord med ljus skiva på svart metallram, med två höga stolar som "
           "har ryggstöd i samma ljusa yta.",
        2: "Barbordet dukat för två i ett kök, med de två stolarna framför och "
           "tallrikar uppställda på skivan.",
        "K": "Faktakort: barbord 89 × 45 × 87 cm med två stolar med hög rygg, "
             "sitthöjd 64 cm.",
        4: "Närbild på stolens sittyta där den ljusa skivan möter det svarta "
           "metallröret.",
        5: "Närbild på bordsskivans hörn med vinkelbeslaget mellan skivan och "
           "benet.",
        3: "Måttritning av barbordet: 89 cm brett, 45 cm djupt och 87 cm högt. "
           "Stolen är 39 × 43 cm, 95 cm hög och har 64 cm sitthöjd.",
    },
    "51c43e67": {
        1: "Barbord i grå träoptik på svart ram, med två pallar som har stoppad "
           "sits och ryggstöd i samma grå yta.",
        2: "Barbordet dukat i ett kök med glas och en flaska på skivan, och de "
           "två stoppade pallarna framför.",
        "K": "Faktakort: barbord 100 × 40 × 90,5 cm med två stoppade pallar med "
             "ryggstöd, sitthöjd 60 cm.",
        4: "Barbordet i ett vardagsrum med de två pallarna framför sig och en "
           "kopp uppställd på skivan.",
        5: "Barbordet placerat mot en soffa, dukat med bakverk, med de två "
           "pallarna med ryggstöd framför.",
        3: "Måttritning av barbordet: 100 cm brett, 40 cm djupt och 90,5 cm "
           "högt. Ryggstödet är 35,5 cm brett och sitsen sitter på 60 cm höjd.",
    },
    "c3bda64a": {
        1: "Barbord med svart stomme och ljus skiva, med två öppna hyllplan "
           "under skivan och två pallar i samma ljusa yta.",
        2: "Barbordet i ett kök med de två pallarna framför, bröd och frukt på "
           "skivan och glas uppställda i hyllan.",
        "K": "Faktakort: barbord 100 × 60 × 95 cm med två hyllplan och två "
             "pallar, sitthöjd 68 cm.",
        4: "Barbordet i ett vardagsrum med en av pallarna utdragen och burkar "
           "uppställda på skivan.",
        5: "Närbild på det övre hyllplanet med vinglas och förvaringsburkar "
           "uppställda.",
        3: "Måttritning av barbordet: 100 cm brett, 60 cm djupt och 95 cm högt, "
           "med hyllfack på 33,5 och 39,5 cm höjd. Pallen är 32 × 32 cm.",
    },
    "c88b5bbb": {
        1: "Barbord i ljus ekoptik på svart stålram med fyra fyrkantiga pallar "
           "i samma yta, två på varje långsida.",
        2: "Barbordet i ett kök vid ett fönster, med de fyra pallarna runt om "
           "och en fruktskål mitt på skivan.",
        "K": "Faktakort: femdelat barset i ljus ekoptik, bord 100 × 60 × 88 cm "
             "och fyra pallar med 57 cm sitthöjd.",
        4: "Närbild på en justerbar fot under bordsbenet, fotograferad mot en "
           "mattkant.",
        5: "Närbild på bulten där korsstaget möter benet under bordsskivan.",
        3: "Måttritning av barbordet: 100 cm brett, 60 cm djupt och 88 cm högt. "
           "Den fyrkantiga pallen är 32 × 32 cm med 57 cm sitthöjd.",
    },
    "63a37524": {
        1: "Barbord i rustik brun träoptik på svart stålram, med fyra "
           "fyrkantiga pallar i samma mörka yta.",
        2: "Barbordet i ett kök med de fyra pallarna runt om, tallrikar och "
           "glas uppdukade på skivan.",
        "K": "Faktakort: femdelat barset i rustik brun träoptik, bord "
             "100 × 60 × 88 cm och fyra pallar med 57 cm sitthöjd.",
        4: "Barbordet placerat mot en soffa i ett vardagsrum, med de fyra "
           "pallarna runt om och en flaska på skivan.",
        5: "Barbordet under en hängande lampa, med de fyra pallarna inskjutna "
           "under skivan.",
        3: "Måttritning av det mörka barbordet: 100 cm brett, 60 cm djupt och "
           "88 cm högt. Pallen mäter 32 × 32 cm och har 57 cm sitthöjd.",
    },
}


def granska():
    """Kör rundans EGNA grindar mot alt-texterna. Samma listor, inte kopior."""
    fel = []
    sedda = {}
    for pid in M.ALLA:
        d = M.M[pid]
        if set(ALT[pid]) != set(ORDNING[pid]):
            fel.append(f"{pid}: ALT och ORDNING täcker olika bilder — "
                       f"{sorted(map(str, ALT[pid]))} mot "
                       f"{sorted(map(str, ORDNING[pid]))}")
        kallor = " ".join(str(v) for v in d.values()) + " " + " ".join(M.HARLEDDA)
        tillatna_tal = set(grind._tal(kallor))
        tillatna_farger = grind._tillatna_farger(pid)

        for nyckel, txt in ALT[pid].items():
            märk = f"{pid} bild {nyckel}"

            for rx, namn in grind.FORBJUDET + grind.TONGRINDAR:
                m = G.loftestraff(rx, txt)
                if m:
                    fel.append(f"{märk}: {namn} — {m.group(0)!r}")
            for rx, namn in grind.NEGERANDE_GRINDAR:
                m = rx.search(txt)
                if m:
                    fel.append(f"{märk}: {namn} — {m.group(0)!r}")

            for rx, tillatna, namn in grind.ENSKILDA:
                m = rx.search(txt)
                if m and pid not in tillatna:
                    fel.append(f"{märk}: {namn} — {m.group(0)!r} gäller inte "
                               f"den här produkten")

            if grind.MASSIVT.search(txt) and pid not in grind.FAR_SAGA_MASSIVT:
                fel.append(f"{märk}: MASSIVT TRÄ — materialet är {d['material']}")
            if grind.HJUL.search(txt):
                fel.append(f"{märk}: HJUL på ett set som saknar hjul")
            if grind.HOJDJUST.search(txt):
                fel.append(f"{märk}: HÖJDJUSTERING på en fast höjd")
            if d["sittplatser"] == 4 and grind.TVA_SITS.search(txt):
                fel.append(f"{märk}: TVÅ SITTPLATSER på ett set med fyra")
            if d["sittplatser"] != 4 and grind.FYRA_SITS.search(txt):
                fel.append(f"{märk}: FYRA SITTPLATSER på ett set med två")
            for s in grind.STAVFEL:
                if s in txt.lower():
                    fel.append(f"{märk}: STAVFEL {s!r}")

            for ch, namn, sam in grind.homoglyfer(txt):
                fel.append(f"{märk}: HOMOGLYF {ch!r} ({namn}) …{sam}…")

            # ☠️ Samma helare som textgrinden, aldrig en kopia: `fargfel`
            #    tittar på färg som sitter på en DEL av möbeln. "vit bakgrund"
            #    beskriver fotostudion, inte varan.
            for f_ in grind.fargfel(txt, tillatna_farger, d["farg_lang"]):
                fel.append(f"{märk}: {f_}")

            if re.search(r"\d+\.\d", txt):
                fel.append(f"{märk}: DECIMALPUNKT i stället för komma")
            if re.search(r"\d+\s*x\s*\d+", txt):
                fel.append(f"{märk}: 'x' i stället för '×'")
            for t in grind._tal(txt):
                if t not in tillatna_tal:
                    fel.append(f"{märk}: OSPÅRAT TAL {t!r} — står inte i "
                               f"matt.py['{pid}']")

            for f_ in G.leveransloften(txt, grind.INGAR, pid):
                fel.append(f"{märk}: {f_}")

            # ⚠️ Kortets alt beskriver FAKTA, inte kortet. "Fyndplats-kort: …"
            #    lägger vårt eget varumärke i ett fält som ska beskriva
            #    innehåll (runda 61).
            if nyckel == "K" and not txt.startswith("Faktakort: "):
                fel.append(f"{märk}: KORTETS ALT ska börja med 'Faktakort: '")
            if nyckel != "K" and txt.startswith("Faktakort"):
                fel.append(f"{märk}: bara kortet får heta Faktakort")

            # ☠️ Inte samma mall × 5, och aldrig samma text på två bilder —
            #    inte heller mellan två av rundans åtta produkter. Färgsyskonen
            #    gör risken konkret: `c88b5bbb` och `63a37524` skiljer sig bara
            #    på ytan.
            nyckelform = re.sub(r"[\d,]+", "#", txt.lower())
            if nyckelform in sedda:
                fel.append(f"{märk}: SAMMA ALT-TEXT som {sedda[nyckelform]}")
            sedda[nyckelform] = märk

            if not 60 <= len(txt) <= 300:
                fel.append(f"{märk}: LÄNGD {len(txt)} tecken (60–300)")

        # Galleriordningen: hjälten först, kortet på plats 3, ritningen SIST
        o = ORDNING[pid]
        if o[0] != 1:
            fel.append(f"{pid}: plats 1 är {o[0]!r}, ska vara hjältebilden")
        if o[2] != "K":
            fel.append(f"{pid}: kortet ligger på plats {o.index('K') + 1}, "
                       f"ska ligga på plats 3")
        if o[-1] != 3:
            fel.append(f"{pid}: måttritningen ligger på plats "
                       f"{o.index(3) + 1} av {len(o)}, ska ligga SIST")
        # ☠️ Den bortplockade bilden får inte smyga tillbaka.
        if pid == "441d2209" and 4 in o:
            fel.append("441d2209: bild 4 är BORTPLOCKAD (visar två bord och "
                       "tre pallar mot setets ett och två)")
    return fel


SJALVTEST = [
    ("Barbordet skickas från Tyskland till dig.", "441d2209", "LEVERANSLAND"),
    ("Marknadens bästa barbord i grått.", "441d2209", "SUPERLATIV"),
    ("Barbordet står bra på uteplatsen.", "441d2209", "UTOMHUSBRUK"),
    ("Barbordet passar även utomhus.", "3b38e191", "UTOMHUSBRUK"),
    ("Pallarna har ryggstöd i grå träoptik.", "441d2209", "RYGGSTÖD"),
    ("Under skivan sitter en öppen hylla.", "441d2209", "FÖRVARING"),
    ("Sitsen är stoppad med skumplast.", "441d2209", "STOPPAD SITS"),
    ("Skivan är i vit marmoroptik.", "441d2209", "MARMOROPTIK"),
    ("Pallen har ett fotstöd nedtill.", "441d2209", "FOTSTÖD"),
    ("Barbordet är byggt i massivt trä rakt igenom.", "441d2209", "MASSIVT"),
    ("Barbordet rullar på fyra hjul i köket.", "441d2209", "HJUL"),
    ("Pallarna är höj- och sänkbara.", "441d2209", "HÖJDJUSTERING"),
    ("Fyra pallar står runt barbordet i grått.", "441d2209", "FYRA SITTPLATSER"),
    ("Två pallar står vid det ljusa barbordet.", "c88b5bbb", "TVÅ SITTPLATSER"),
    ("Barbordet med en röd skiva mot vit bakgrund.", "441d2209", "FÄRGORD"),
    ("Barbordet där skivan är röd, mot vit bakgrund.", "441d2209", "FÄRGORD"),
    ("Barbordet är 77 cm brett mot vit bakgrund.", "441d2209", "OSPÅRAT TAL"),
    ("Barbordet är 1.5 cm tjockt mot vit bakgrund.", "441d2209", "DECIMALPUNKT"),
    ("Barbordet mäter 80 x 50 cm mot vit bakgrund.", "441d2209", "'x' i stället"),
    ("Fyra glas ingår i leveransen av barbordet.", "441d2209", "LEVERANSLÖFTE"),
    ("Ett engangsjobb att montera barbordet i grått.", "441d2209", "STAVFEL"),
    ("Barbordet i den här rundan mot vit bakgrund.", "441d2209", "JARGONG"),
    ("Barbordet är brа mot vit bakgrund i köket.", "441d2209", "HOMOGLYF"),
    ("Ett Bartisch mot vit bakgrund i köket hemma.", "441d2209", "TYSKT ORD"),
    ("Barbordet tål 374 lbs enligt skylten på bilden.", "441d2209", "ENGELSK ENHET"),
    ("Vikten anges inte på bilden av barbordet i grått.", "441d2209",
     "SKRIVER ATT VI INTE VET"),
]


def sjalvtest():
    """Varje fall MÅSTE fällas — annars vaktar grinden ingenting."""
    fel = []
    original = ALT["441d2209"].copy(), ALT["c88b5bbb"].copy(), ALT["3b38e191"].copy()
    for txt, pid, vantat in SJALVTEST:
        spar = ALT[pid][1]
        ALT[pid][1] = txt
        try:
            ut = granska()
        finally:
            ALT[pid][1] = spar
        if not any(vantat in x for x in ut):
            fel.append(f"{vantat}: grinden SÅG DET INTE i {txt!r} (fick {ut[:2]})")
    ALT["441d2209"], ALT["c88b5bbb"], ALT["3b38e191"] = original
    return fel


ORDNINGSFALL = [
    ("ritningen ligger kvar på plats 3", "441d2209", [1, 2, 3, "K", 5],
     "måttritningen ligger på plats"),
    ("kortet ligger först", "441d2209", ["K", 1, 2, 5, 3], "plats 1 är"),
    ("kortet ligger på plats 4", "441d2209", [1, 2, 5, "K", 3],
     "kortet ligger på plats"),
    ("bild 4 smyger tillbaka", "441d2209", [1, 2, "K", 4, 5, 3],
     "bild 4 är BORTPLOCKAD"),
]


def ordningstest():
    fel = []
    spar = ORDNING["441d2209"]
    for namn, pid, ny, vantat in ORDNINGSFALL:
        ORDNING[pid] = ny
        try:
            ut = granska()
        finally:
            ORDNING[pid] = spar
        if not any(vantat in x for x in ut):
            fel.append(f"{namn}: grinden SÅG DET INTE (fick {ut[:2]})")
    return fel


if __name__ == "__main__":
    f = granska()
    antal = sum(len(v) for v in ALT.values())
    print(f"alt.granska(): {antal} alt-texter, {len(f)} fel")
    for x in f:
        print("  ✗", x)
    st = sjalvtest()
    print(f"självtest: {len(SJALVTEST)} fall, {len(st)} fel")
    for x in st:
        print("  ☠️", x)
    ot = ordningstest()
    print(f"ordningstest: {len(ORDNINGSFALL)} fall, {len(ot)} fel")
    for x in ot:
        print("  ☠️", x)
    sys.exit(1 if (f or st or ot) else 0)
