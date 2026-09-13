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
}
