# -*- coding: utf-8 -*-
"""Runda 141 — matt och fakta per utkast, transkriberat ur Wix (Steg 3).

☠️ `Vikt` i spec-blocket ar FRAKTVIKTEN, inte varans (#488). Den lagras som
   `fraktvikt` har och far ALDRIG skrivas som "Vikt" i kundtexten.

☠️ Tva kallor per tal: leverantorens tyska `Technische Daten` OCH spec-blocket
   som importen byggde ur feedens kolumner. De kan saga emot varandra (#1481 i
   runbooken). Star de olika bevaras BADA har, och matritningen avgor.
"""

M = {
    "18b94738": dict(
        namn_de="Hantelbank mit Hantelablage, 1 Aufbewahrungskorb, in 6 Positionen",
        pris=2329, bilder=5, sku_fore="FP-hantelbank-mit",
        tot=(110, 35, "43-107"),          # L x B x H, hojden justerbar
        sits=(33, 33), rygg=(67, 33),
        vinklar=[90, 110, 125, 145, 165, 180],
        fack=(27, 27), hyllhojd=25,
        maxlast_kg=120,                   # star TVA ganger i tyskan, konsekvent
        farg_de="Natur", farg_spec="Naturholz",
        material_de="Buche, Kunstleder",
        pastar_massivholz=True,           # ⚠️ Steg 5: Buche ar tratyp, inte bevis
        fraktvikt=24, paket=(115, 43, 39),
        ingar=["1 x Kurzhantelbank", "2 x Widerstandsband", "1 x Handbuch"],
        lager="IN_STOCK",
    ),
    "a4bbe667": dict(
        namn_de="Hantelbank mit Hantelablage, Brustpresse, Beinpresse, Armauflage für",
        pris=2099, bilder=5, sku_fore="FP-hantelbank-mit",   # ☠️ KROCK med 18b94738
        tot=(180, 134, "113-136"),        # tyskan; spec-blocket tappade undre hojden
        tot_spec=(180, 134, 136),
        sits=(32, 30), rygg=(76, 25),
        lutningslagen=3, hantelablage_lagen=6, armauflage_lagen=4,
        hyllhojd=(107.5, 130), hyllbredd=60,
        armstod=(45, 30, "46-61"),
        # ☠️ FEM olika kapaciteter i leverantorens egen lista. "300 kg" ar
        #    BANKENS statiska kapacitet — INTE anvandarvikt. Max anvandarvikt
        #    ar 150 kg. Skrivs 300 kg som lastsiffra ar det en sakerhetslogn.
        kap_benstrackare_kg=25, kap_bicepsstang_kg=25,
        kap_skivstangsstall_kg=150, maxlast_anvandare_kg=150, kap_bank_kg=300,
        farg_de="Schwarz+Weiß", farg_spec="Schwarz, Weiß",
        material_de="Stahl, Kunstleder", material_spec="Legierter Stahl/Kunstleder",
        fraktvikt=28, paket=(115, 50, 19),
        ingar=["1 x Hantelbank", "1 x Anleitung"],
        skivor_ingar=False,               # "Hantelscheiben nicht im Lieferumfang"
        lager="IN_STOCK",
    ),
    "8de3c3ef": dict(
        namn_de="Hantelbank verstellbar Trainingsbank mit Beinstrecker 7-Fach",
        pris=999, bilder=5, sku_fore="FP-hantelbank-verstellbar",
        tot=(115, 32.5, 43), hopfalld=(32.5, 22, 75),
        sits=(36, 27), rygg=(67, 27), lagen=7,
        # ☠️ SAMMA fälla som a4bbe667: 300 kg ar TOTALEN, 120 kg ar anvandaren.
        kap_total_kg=300, maxlast_anvandare_kg=120,
        farg_de="Grün",                   # ⚠️ Steg 4: matas i ZOOM, inte pa kontaktark
        # ☠️ MATERIALLOGN: brodtexten OCH punktlistan sager "Stahlrahmen …
        #    belastbar bis 300 kg". Leverantorens EGNA Technische Daten sager
        #    Sperrholz/EPE/PVC, och spec-blocket sager Holz/PVC. TVA tekniska
        #    kallor mot EN marknadsrad — och 10 kg fraktvikt talar for tra.
        material_de="Sperrholz, EPE-Schaumstoff, PVC",
        material_spec="Holz/Polyvinylchlorid",
        pastar_stalram=True,              # ⚠️ far INTE skrivas till kund
        fraktvikt=10, paket=(80, 37, 29),
        ingar=["1 x Verstellbare Hantelbank", "1 x Bedienungsanleitung"],
        # ⚠️ "Beinstrecker" star i NAMNET men i varken Lieferumfang eller
        #    Technische Daten. #468: Lieferumfang ar kontraktet — bilden avgor.
        beinstrecker_obekraftad=True,
        lager="IN_STOCK",
    ),
    "b4961e6f": dict(
        namn_de="Hantelbank klappbar Trainingsbank mit Beinstrecker 3-Fach",
        pris=1479, bilder=None, sku_fore="FP-hantelbank-klappbar",  # ☠️ KROCK med 562e42fc
        tot=(135, 130, 107), sits=(32, 29, 42.5),
        ryggpositioner=3, motstandsstufen=3, butterfly_lagen=4,
        kap_total_kg=300, maxlast_anvandare_kg=120,   # ✅ korrekt markt i tyskan
        farg_de="Schwarz", farg_spec="Schwarz",
        material_de="Sperrholz, TPE, Schaumstoff, PVC-Kunstleder, Stahl",
        material_spec="Metall",            # ☠️ spec TAPPAR plywooden
        fraktvikt=16.7, paket=(115, 24, 35.5),
        ingar=["1 x Verstellbare Hantelbank", "2 x Widerstandsband",
               "1 x Bedienungsanleitung"],
        lager="IN_STOCK",
    ),
    "7b818c3b": dict(
        namn_de="Hantelbank, 8 Positionen, klappbar, Stahlbasis, gepolstert",
        pris=1379, bilder=None, sku_fore="FP-hantelbank-8-positionen",
        tot=(140, 73, "98-122"), hopfalld=(73, 55, 134),
        rygg=(100, 26, 43), stangdiameter_mm=25,
        # ⚠️ "8 Positionen" ar HANTELHYLLANS lagen, inte ryggstodets.
        hantelablage_lagen=8,
        # ☠️ INGEN max anvandarvikt alls. 150 kg ar BANKEN.
        kap_bank_kg=150, kap_hantelablage_kg=100, kap_per_viktplats_kg=30,
        maxlast_anvandare_kg=None,
        farg_de="Schwarz+Grau", farg_spec="Schwarz, Grau",
        material_de="Stahl, Kunstleder", material_spec="Kunstleder, Stahl",
        fraktvikt=21, paket=(113, 36, 12),
        ingar=["1 x Hantelbank", "1 x Anleitung"],
        lager="IN_STOCK",
    ),
    "8a0e05f4": dict(
        namn_de="Hantelbank Fitnessbank Schrägbank Multifunktion Bauchtrainer",
        pris=1429, bilder=None, sku_fore="FP-hantelbank-fitnessbank",
        tot=(64, 146, "73,5-85"),          # B x T x H i tyskans egen ordning
        bukdyna=(30, 16, 7.5), ryggdyna=(98, 32, 5),
        vinklar=[0, -22.5, -45], fotpedal_lagen=4, larkudde_lagen=7,
        kap_total_kg=300, maxlast_anvandare_kg=120,
        # ☠️ BEVIS for #488, matt INOM samma produkt: tyskan sager Gewicht
        #    13,7 kg, spec-blocket sager Vikt 16,7 kg. Skillnaden ar emballaget.
        varans_vikt=13.7, fraktvikt=16.7,
        farg_de="Schwarz+Rot", farg_spec="Schwarz, Rot",
        material_de="Stahl, PVC, EVA",
        material_spec="Legierter Stahl/Polyvinylchlorid/Ethylenvinylacetat",
        paket=(111.5, 35.5, 23),
        ingar=["1 x Hantelbank", "1 x Montageanleitung"],
        marknadsrad_ovkvalificerad_300=True,
        lager="IN_STOCK",
    ),
    "562e42fc": dict(
        namn_de="Hantelbank, Klappbar Trainingsbank mit 7-fach verstellbarer",
        pris=1239, bilder=None, sku_fore="FP-hantelbank-klappbar",  # ☠️ KROCK med b4961e6f
        tot=(160, 54, 106), hopfalld=(54, 42, 150),
        sitsdyna=(30.5, 30, 4), ryggdyna=(75, 30, 4),
        vinklar=[100, 115, 125, 135, 150, 165, -10],
        armbagsdyna=(29.5, 14, 4), armbagsstod_cm=(78, 82),
        kap_total_kg=300, maxlast_anvandare_kg=120,   # ✅ korrekt markt overallt
        farg_de="Schwarz+Blau", farg_spec="Blau",
        material_de="Stahl, ABS, EVA", material_spec="Stahlrohr, ABS, EVA",
        fraktvikt=13, paket=(131, 33, 21.5),
        ingar=["1 x Hantelbank", "1 x Bedienungsanleitung"],
        tillbehor_de="Seil und Feder",     # rep + fjader
        lager="IN_STOCK",
    ),
    "83b2cf8b": dict(
        namn_de="Hantelbank ohne Gewichte, verstellbare Fitnessbank für zahlreiche",
        pris=1959, bilder=None, sku_fore="FP-hantelbank-ohne-gewichte",
        tot=(175, 139, 127),
        rygg=(74, 26, 4), sits=(30, 26, 4), armbagsdyna=(49, 27, "74-86"),
        viktpelare=(25, 2.5), traningspositioner=3, rygg_hal=3,
        kap_sitsdyna_kg=200, maxlast_anvandare_kg=100,   # LAGST i batchen
        kap_viktset_kg=100,
        farg_de="Schwarz+Rot", farg_spec="Schwarz",
        material_de="Stahl, Kunststoff",
        material_spec="Kunststoff",        # ☠️ spec TAPPAR STALET helt
        fraktvikt=26, paket=(105, 42, 24),
        ingar=["1 x Hantelbank", "1 x Gebrauchsanleitung"],
        skivor_ingar=False,                # "Gewichte und Langhantel NICHT enthalten"
        har_squat_rack=True, har_beinstrecker=True, har_butterfly=True,
        lager="IN_STOCK",
    ),
}
