# -*- coding: utf-8 -*-
"""Runda 119 Steg 9 — alt-texterna och galleriordningen, GRINDADE.

☠️ ALT-TEXTEN PASSERAR INGEN AV RUNDANS ÖVRIGA GRINDAR. `grind.py` läser
   `texter.py`; alt-texterna finns inte i den filen och skrivs rakt in i Wix
   media. Runbookens Steg 9 säger det ordagrant: varje regel textgrinden vaktar
   är oskyddad i alt-texten — och det är det SÄMSTA stället att ha ett hål, för
   alt-texten är vad Google och skärmläsaren läser.

   Runda 106 mätte fallet: sex sidor vars brödtext sa att hagen inte säljs som
   kaninbostad, och FEM av dem hade "kaniner" i en alt-text. Grinden var grön
   på alla sex — den letade en nivå över där felet låg.

   Den här filen stänger hålet genom att köra SAMMA listor, inte omskrivna
   varianter: `grind.FORBJUDET`, `TONGRINDAR`, `NEGERANDE_GRINDAR`, `ENSKILDA`,
   `STAVFEL`, `MASSIVT`, homoglyfsvitlistan och talgrinden mot `matt.py`.

⚠️ BESKRIV VARAN, INTE STAJLINGEN. Leverantörens miljöbild är iscensatt.
   Det som står PÅ skivan i bild 2 är rekvisita, inte produktinformation —
   det får nämnas som scen, men aldrig bli ett påstående om vad som ingår.

GALLERIORDNINGEN (runbookens Steg 9):
   1 hjältebild · 2 verklighetsbild · 3 EGET KORT · därefter detaljfoton ·
   SIST måttritningen. Leverantörens bild 3 ÄR måttritningen och ligger i
   rå-importen på plats 3 — den ska alltså flyttas sist, inte ligga kvar.
   (Uppgift #371: på alla sju runda 104-sidor låg ritningen kvar på plats 3.)
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
# Bild 3 är måttritningen på alla nio och ligger därför SIST.
ORDNING = {
    "ad390a36": [1, 2, "K", 4, 5, 3],
    "dac7a904": [1, 2, "K", 3],
    "c86ff1a6": [1, 2, "K", 5, 3],
    "5d1696db": [1, 2, "K", 3],
    "6cf7cfcf": [1, 2, "K", 4, 5, 3],
    "36526a8d": [1, 2, "K", 4, 5, 3],
    "9e5e788c": [1, 2, "K", 5, 3],
    "d8bbbdde": [1, 2, "K", 3],
    "e0fed2c9": [1, 2, "K", 3],
}

# ── Alt-texterna ───────────────────────────────────────────────────────────
ALT = {
    "ad390a36": {
        1: "Smal köksvagn i vitt med skiva i träoptik, fotograferad snett "
           "framifrån mot vit botten. Två lådor till höger, två öppna fack "
           "till vänster och en öppen hylla under skivan.",
        2: "Köksvagnen står intill en köksbänk i ett ljust kök och används "
           "som extra arbetsyta. De öppna facken nedtill rymmer burkar och "
           "tallrikar.",
        "K": "Faktakort: köksvagn 53 × 37 × 89 cm med två lådor och två öppna "
             "fack. Maxlast 30 kg, vikt 16,5 kg.",
        4: "Köksvagnen som avlastningsyta vid ett sminkbord, med förvaring i "
           "de öppna facken och sminkflaskor på skivan i träoptik.",
        5: "Samma köksvagn i en garderob, där skivan bär väska och hattar och "
           "de öppna facken hopvikta textilier.",
        3: "Måttritning över köksvagnen: 53 cm bred, 37 cm djup och 89 cm hög, "
           "med lådornas och de öppna fackens innermått utsatta.",
    },
    "dac7a904": {
        1: "Bred köksvagn i vitt med lång skiva i naturträ, sedd snett "
           "framifrån mot vit botten. En genomgående låda, spjälhylla på "
           "mitten, hel bottenhylla och handdukshängare på gaveln.",
        2: "Köksvagnen står fritt på golvet i ett ljust kök och används som "
           "arbetsbänk. Grönsaker ligger på mittenhyllan och burkar och "
           "tallrikar står på bottenhyllan.",
        "K": "Faktakort: köksvagn med 101,5 × 51 cm arbetsyta, en låda och två "
             "öppna hyllplan. Maxlast 50 kg, vikt 26 kg.",
        3: "Måttritning över köksvagnen: 108,8 cm bred, 51 cm djup och 92,5 cm "
           "hög, med lådans och hyllplanens innermått utsatta.",
    },
    "c86ff1a6": {
        1: "Köksvagn i vitt med ekfärgad skiva och inbyggt vinställ, "
           "fotograferad rakt framifrån mot vit botten. Sex liggande vinfack "
           "på ena gaveln, öppna hyllfack på den andra och ett skåp med dörr.",
        2: "Köksvagnen står bredvid en köksbänk och används som arbetsyta, med "
           "en korg i det öppna mittfacket och burkar i sidohyllorna.",
        "K": "Faktakort: köksvagn 83 × 40 × 83 cm med vinställ för sex flaskor "
             "och 76 × 40 cm arbetsyta. Maxlast 37 kg, vikt 29,7 kg.",
        5: "Närbild på köksvagnens gavel: handdukshängaren i metall med en "
           "handduk över, den ekfärgade skivan ovanför och två liggande "
           "vinflaskor i vinstället.",
        3: "Måttritning över köksvagnen: 83 cm bred, 40 cm djup och 83 cm hög, "
           "med skåpets, mittfackets och vinfackens innermått utsatta.",
    },
    "5d1696db": {
        1: "Köksvagn i naturfärgad bambu med infälld glasyta i skivan, sedd "
           "snett framifrån mot vit botten. Två lådor överst, ett skåp med "
           "handflätad rottingdörr och en öppen hylla på sidan.",
        2: "Köksvagnen står mot en vägg i ett ljust rum och används som "
           "kaffehörna. Flaskor och burkar står i de öppna hyllfacken och en "
           "handduk hänger på gaveln.",
        "K": "Faktakort: köksvagn i bambu 84 × 36 × 85 cm med glasyta och "
             "handflätad rottingdörr. Maxlast 50 kg, vikt 19,6 kg.",
        3: "Måttritning över köksvagnen i bambu: 84 cm bred, 36 cm djup och "
           "85 cm hög, med skåpets och hyllans innermått utsatta.",
    },
    "6cf7cfcf": {
        1: "Köksvagn i vitt med furuskiva och pärlspontfronter, fotograferad "
           "snett framifrån mot vit botten. Tre lådor på ena sidan, två "
           "spjälhyllor och en uttagbar bricka på den andra.",
        2: "Köksvagnen står mitt i ett vitt kök och används som fristående "
           "arbetsyta, med köksredskap på furuskivan och tallrikar på den "
           "nedre spjälhyllan.",
        "K": "Faktakort: köksvagn i lantstil 67 × 37 × 87 cm med tre lådor och "
             "två spjälhyllor. Maxlast 40 kg, vikt 20 kg.",
        4: "Närbild på köksvagnens uttagbara bricka, med två glasburkar med "
           "torrvaror ovanpå och spjälhyllan synlig under.",
        5: "Närbild på en av köksvagnens tre lådor utdragen, med "
           "livsmedelsförpackningar stående upp i lådan.",
        3: "Måttritning över köksvagnen: 67 cm bred, 37 cm djup och 87 cm hög, "
           "med brickans och spjälhyllornas innermått utsatta.",
    },
    "36526a8d": {
        1: "Grillvagn i svart med skiva i rostfritt stål, sedd snett framifrån "
           "mot vit botten. Två skåpdörrar med långa metallhandtag och sex "
           "krokar på gaveln.",
        2: "Grillvagnen med båda skåpdörrarna öppna och tallrikar på "
           "hyllplanet inuti, med en handduk hängande på en av krokarna.",
        "K": "Faktakort: grillvagn 86 × 50 × 86,5 cm med 70 × 46,5 cm skiva i "
             "rostfritt stål. Maxlast 15 kg på skivan, vikt 16,8 kg.",
        4: "Närbild på grillvagnens rostfria skiva utomhus vid en pool, med en "
           "fruktkorg och en glasburk på skivan och krokarna i förgrunden.",
        5: "Grillvagnen på ett trädäck med den ena dörren öppen, två "
           "vinflaskor och en tallrikstapel på hyllplanet inuti skåpet.",
        3: "Måttritning över grillvagnen: 86 cm bred, 50 cm djup och 86,5 cm "
           "hög, med skåpets innermått utsatta.",
    },
    "9e5e788c": {
        1: "Köksö i vitt med skiva i naturträ och den utfällbara delen "
           "uppfälld, sedd snett framifrån mot vit botten. Två skåp, öppna "
           "mittfack, tre kryddhyllplan på gaveln och handdukshängare.",
        2: "Köksön står fritt i ett ljust kök och används som arbetsyta, med "
           "tallrikar staplade i det öppna mittfacket och en handduk på "
           "hängaren.",
        "K": "Faktakort: köksö 115 × 70 × 89 cm där skivan går från 96 × 40 cm "
             "till 96 × 70 cm uppfälld. Maxlast 105 kg, vikt 48,7 kg.",
        5: "Köksön placerad intill en mörkblå köksbänk, med köksmaskiner på "
           "skivan i naturträ och skålar och tallrikar i de öppna facken.",
        3: "Måttritning över köksön: 115 cm bred med skivan uppfälld, 70 cm "
           "djup och 89 cm hög, med lådornas och skåpens innermått utsatta.",
    },
    "d8bbbdde": {
        1: "Köksö i vitt med skiva i naturträ och nedfälld klaff, sedd snett "
           "framifrån mot vit botten. En bred låda över ett stort skåp med två "
           "dörrar, sidohyllor på gaveln och handdukshängare.",
        2: "Köksön med skåpsdörrarna öppna i ett ljust kök: skålar staplade på "
           "hyllplanet inuti, burkar under och kryddburkar i sidohyllorna.",
        "K": "Faktakort: köksö 120 × 68 × 85 cm med 90 × 39 cm bänkskiva och "
             "skåp på 86 × 36 × 60,5 cm. Maxlast 100 kg, vikt 41,6 kg.",
        3: "Måttritning över köksön: 120 cm bred, 68 cm djup och 85 cm hög, "
           "med skåpets och lådans innermått utsatta.",
    },
    "e0fed2c9": {
        1: "Stor köksö i vitt med skiva i naturträ och klaffen uppfälld, sedd "
           "snett framifrån mot vit botten. Två lådor, ett skåp med hyllor på "
           "dörrens insida och utdragsbrickor på gaveln.",
        2: "Köksön i ett ljust kök med den uppfällda skivan använd som "
           "frukostbar, med två barstolar inskjutna under skivan.",
        "K": "Faktakort: köksö med utdragsbrickor, 129 × 65 × 91 cm. Skivan "
             "mäter 120 × 40 cm nedfälld och 120 × 65 cm uppfälld. "
             "Maxlast 112 kg, vikt 57,8 kg.",
        3: "Måttritning över köksön: 129 cm bred med skivan uppfälld, 65 cm "
           "djup och 91 cm hög, med lådornas, dörrfackens och brickornas "
           "innermått utsatta.",
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
        for nyckel, txt in ALT[pid].items():
            märk = f"{pid} bild {nyckel}"

            # 1. Husets förbjudna ord, tongrindar och negationer
            for rx, namn in grind.FORBJUDET + grind.TONGRINDAR:
                m = G.loftestraff(rx, txt)
                if m:
                    fel.append(f"{märk}: {namn} — {m.group(0)!r}")
            for rx, namn in grind.NEGERANDE_GRINDAR:
                m = rx.search(txt)
                if m:
                    fel.append(f"{märk}: {namn} — {m.group(0)!r}")

            # 2. Rundans fyra egna grindar (utomhus, klaff, soft close, bambu)
            for rx, tillatna, namn in grind.ENSKILDA:
                m = rx.search(txt)
                if m and pid not in tillatna:
                    fel.append(f"{märk}: {namn} — {m.group(0)!r} gäller inte "
                               f"den här produkten")

            # 3. Massivt trä, hjulantal, stavfel
            if grind.MASSIVT.search(txt) and pid not in grind.FAR_SAGA_MASSIVT:
                fel.append(f"{märk}: MASSIVT TRÄ — materialet är {d['material']}")
            if pid in M.FEM_HJUL and grind.FYRA_HJUL.search(txt):
                fel.append(f"{märk}: FYRA HJUL på en produkt med FEM")
            if pid not in M.FEM_HJUL and grind.FEM_HJUL_RE.search(txt):
                fel.append(f"{märk}: FEM HJUL på en produkt med FYRA")
            for s in grind.STAVFEL:
                if s in txt.lower():
                    fel.append(f"{märk}: STAVFEL {s!r}")

            # 4. ☠️ Homoglyfer — vitlista, inte svartlista
            for ch, namn, sam in grind.homoglyfer(txt):
                fel.append(f"{märk}: HOMOGLYF {ch!r} ({namn}) …{sam}…")

            # 5. Färgade delar
            for del_, tillatna in M.DEL_OK[pid].items():
                for m in re.finditer(rf"(\w+)\s+{del_}\w*", txt, re.I):
                    o = m.group(1).lower()
                    if o in G.FARGORD and o not in [t.lower() for t in tillatna]:
                        fel.append(f"{märk}: FÄRG PÅ {del_.upper()}: {o!r} — "
                                   f"uppmätt är {'/'.join(tillatna)}")

            # 6. Sifferstil och talgrind
            if re.search(r"\d+\.\d", txt):
                fel.append(f"{märk}: DECIMALPUNKT i stället för komma")
            if re.search(r"\d+\s*x\s*\d+", txt):
                fel.append(f"{märk}: 'x' i stället för '×'")
            kallor = " ".join(str(v) for v in d.values()) + " " + " ".join(M.HARLEDDA)
            tillatna_tal = set(grind._tal(kallor))
            for t in grind._tal(txt):
                if t not in tillatna_tal:
                    fel.append(f"{märk}: OSPÅRAT TAL {t!r} — står inte i "
                               f"matt.py['{pid}']")

            # 7. Leveranslöften (fabricerad leveranstid nådde fyra fält i r115)
            for f_ in G.leveransloften(txt, grind.INGAR, pid):
                fel.append(f"{märk}: {f_}")

            # 8. ⚠️ Kortets alt måste börja med `Faktakort: ` och beskriva
            #    FAKTA, inte kortet. "Fyndplats-kort: …" lägger vårt eget
            #    varumärke i ett fält som ska beskriva innehåll (runda 61).
            if nyckel == "K" and not txt.startswith("Faktakort: "):
                fel.append(f"{märk}: KORTETS ALT ska börja med 'Faktakort: '")
            if nyckel != "K" and txt.startswith("Faktakort"):
                fel.append(f"{märk}: bara kortet får heta Faktakort")

            # 9. ☠️ Inte samma mall × 5 — och aldrig samma text på två bilder,
            #    inte heller mellan två av rundans nio produkter.
            nyckelform = re.sub(r"[\d,]+", "#", txt.lower())
            if nyckelform in sedda:
                fel.append(f"{märk}: SAMMA ALT-TEXT som {sedda[nyckelform]}")
            sedda[nyckelform] = märk

            # 10. Längd — Wix tar emot mer, men en alt-text som inte går att
            #     lyssna igenom i ett andetag är ingen alt-text.
            if not 60 <= len(txt) <= 300:
                fel.append(f"{märk}: LÄNGD {len(txt)} tecken (60–300)")

        # 11. Galleriordningen: ritningen SIST, kortet på plats 3, aldrig 1
        o = ORDNING[pid]
        if o[0] != 1:
            fel.append(f"{pid}: plats 1 är {o[0]!r}, ska vara hjältebilden")
        if o[2] != "K":
            fel.append(f"{pid}: kortet ligger på plats {o.index('K') + 1}, "
                       f"ska ligga på plats 3")
        if o[-1] != 3:
            fel.append(f"{pid}: måttritningen ligger på plats "
                       f"{o.index(3) + 1} av {len(o)}, ska ligga SIST")
    return fel


SJALVTEST = [
    ("Köksvagnen skickas från Tyskland till dig.", "ad390a36", "LEVERANSLAND"),
    ("Marknadens bästa köksvagn i vitt.", "ad390a36", "SUPERLATIV"),
    ("Köksvagnen har en skiva i härdat glas.", "5d1696db", "HÄRDNING"),
    ("Grillvagnen står bra på uteplatsen.", "ad390a36", "UTOMHUSBRUK"),
    ("Skivan fälls ut till dubbel yta.", "ad390a36", "UTFÄLLBAR"),
    ("Vagnen har en dörr i rotting.", "ad390a36", "BAMBU/ROTTING"),
    ("Köksvagnen är byggd i massivt trä rakt igenom.", "ad390a36", "MASSIVT"),
    ("Köksön rullar på fyra hjul i köket.", "9e5e788c", "FYRA PÅ FEM"),
    ("Vagnen rullar på fem hjul över golvet.", "ad390a36", "FEM PÅ FYRA"),
    ("Köksvagnen är 62 cm bred och står mot väggen.", "ad390a36", "OSPÅRAT TAL"),
    ("Köksvagnen är 53.5 cm bred i kanten.", "ad390a36", "DECIMALPUNKT"),
    ("Köksvagnen mäter 53 x 37 cm på skivan.", "ad390a36", "x SOM TECKEN"),
    ("Vagnen levereras av leverantören till dörren.", "ad390a36", "ATTRIBUTION"),
    ("Köksvagn med svart skiva mot vit botten i studio.", "ad390a36", "FÄRG"),
    ("Rundans köksvagn står i ett kök med vita luckor.", "ad390a36", "JARGONG"),
    ("Vagnen har en Schublade och står i köket.", "ad390a36", "TYSKT ORD"),
    ("Höjden på vagnen anges inte av tillverkaren alls.", "ad390a36", "VET INTE"),
    ("Vagnen levereras inom 3 dagar till din dörr.", "ad390a36", "LEVERANSLÖFTE"),
    ("Köksvagnen står i köket med dögnsvarv på skivan.", "ad390a36", "STAVFEL"),
    ("Köksvagnen är hopfälbar och står i köket bredvid.", "ad390a36", "STAVFEL 2"),
]


def sjalvtest():
    """Varje fall MÅSTE fällas — annars är grinden ovan en attrapp."""
    fel = []
    riktig = ALT
    for txt, pid, vad in SJALVTEST:
        globals()["ALT"] = {p: dict(riktig[p]) for p in riktig}
        ALT[pid][1] = txt
        ORDNING_kopia = ORDNING[pid]
        if 1 not in ORDNING_kopia:
            fel.append(f"självtestet kan inte skriva bild 1 på {pid}")
            continue
        träffar = [f for f in granska() if f.startswith(f"{pid} bild 1")]
        if not träffar:
            fel.append(f"SLÄPPTE IGENOM ({vad}): {txt!r}")
    globals()["ALT"] = riktig
    return fel


if __name__ == "__main__":
    st = sjalvtest()
    print(f"Självtest: {len(SJALVTEST)} fall, {len(st)} släppte igenom")
    for f in st:
        print("  ✗", f)
    print()
    fel = granska()
    print(f"Alt-grinden: {sum(len(v) for v in ALT.values())} alt-texter, "
          f"{len(fel)} fel")
    for f in fel:
        print("  ✗", f)
    if not fel and not st:
        print("\nGalleriordning:")
        for pid in M.ALLA:
            print(f"  {pid}: " + " → ".join(
                "KORT" if x == "K" else f"bild {x}" for x in ORDNING[pid]))
