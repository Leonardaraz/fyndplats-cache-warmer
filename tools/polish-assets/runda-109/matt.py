# -*- coding: utf-8 -*-
"""Runda 109 — familjens två SISTA sexpanelsfärger: vit och svart.

Runda 108 polerade sex av familjens nitton utkast och lämnade de två som var
BEVISADE dubbletter av den publicerade `d4118d39`. Leonard avgjorde
2026-09-09 att den sidan ska pensioneras och de två färgerna få var sin egen
Aosom-sida — då blir sexpanelsraden komplett i fyra färger och den publicerade
sidans "vit eller svart" försvinner. Det är hans regel 2026-09-03 tillämpad på
ett 1:2-fall: en AE-sida buntar två artiklar som leverantören säljer var för
sig, och ommappningsverktyget vägrar en flervariantssida.

☠️ TALEN HÄRLEDS INTE. Läsningen 2026-09-09 gav samma spec-block som runda
   108, samma två importfel, och artikelnumren `830-814V01WT` / `830-814V01BK`
   — samma bas 830-814 och samma V01 som familjens övriga sexpanelsrader.
"""

# paneler -> (utfälld bredd, hopfälld djup, vikt, gångjärn)
MODELL = {4: (160, 6.4, "6 kg", 9), 6: (240, 12.5, "7,9 kg", 15), 8: (320, 16.0, None, 21)}
PANELMATT = (40, 1.6, 170)
FOTHOJD = "6,5 cm"

#            (paneler, färg, slug-färg, pris, vikt, paketmått, wixProductId, wixVariantId, artnr)
RUNDAN = {
 "ffb5239f": (6, "vit",   "vit",   1329, "7,9 kg", "173 × 43 × 15 cm",
              "ffb5239f-3cfd-49c8-ae10-5f8b9993c6f6",
              "45f65bf5-3de5-4115-aa96-80cd94ad5b36", "830-814V01WT"),
 "7bd4f691": (6, "svart", "svart", 1239, "7,9 kg", "173 × 43 × 15 cm",
              "7bd4f691-ad6d-4ae2-9fa4-656caa3933e8",
              "588c99cb-6055-42c2-b2cf-ace463a6d14a", "830-814V01BK"),
}

# Runda 108:s sex, redan LIVE. De är med här för att syskonlistan ska bli
# fullständig — fyra av dem får nya korslänkar när de två nya tillkommer.
LIVE = {
 "5f14c112": (4, "vit",         "vit",   1069, "6 kg",    "173 × 43 × 9 cm",
              "5f14c112-8c5e-44bf-9c71-321bbc7010c4", None, "830-814V00WT"),
 "957b042d": (4, "brun",        "brun",  1139, "6 kg",    "173 × 43 × 9 cm",
              "957b042d-7896-4892-9f05-30ab5a32d95a", None, "830-814V00BN"),
 "6649471e": (6, "naturfärgad", "natur", 1329, "7,9 kg",  "173 × 43 × 15 cm",
              "6649471e-604e-497e-8ff1-e5833b8d0068", None, "830-814V01ND"),
 "854371fe": (6, "brun",        "brun",  1179, "7,9 kg",  "173 × 43 × 15 cm",
              "854371fe-f4d6-4700-be9a-ff54060e7374", None, "830-814V01BN"),
 "da1a8a75": (8, "vit",         "vit",   1499, "9,65 kg", "173 × 43 × 18,5 cm",
              "da1a8a75-6efe-4709-98e3-148ac6ceb2a5", None, "830-814V02WT"),
 "64c0809d": (8, "naturfärgad", "natur", 1429, "9,6 kg",  "173 × 43 × 18,5 cm",
              "64c0809d-002e-4e83-aa4a-a2941fe68392", None, "830-814V02ND"),
}
ALLA = dict(LIVE, **RUNDAN)

# Sidan som pensioneras när de två nya ligger live. TVÅ varianter (Färg:
# Vit/Svart), båda 1 529 kr, AE-import (supplierProductId 1005008518824783).
PENSIONERAS = ("d4118d39-9c2b-4152-8512-f45daa582768", "hopfallbar-rumsavdelare")


def kontroll():
    """Hänger raderna ihop? Om inte gäller spec-blocket, inte formeln."""
    fel = []
    for nyckel, rad in ALLA.items():
        pan, _f, _fs, _p, vikt, _pm, _id, _vid, artnr = rad
        bredd, hopfalld, modellvikt, _gj = MODELL[pan]
        if bredd != PANELMATT[0] * pan:
            fel.append(f"{nyckel}: bredd {bredd} != 40 × {pan}")
        if modellvikt and vikt != modellvikt:
            fel.append(f"{nyckel}: vikt {vikt} != modellens {modellvikt}")
        # Artikelnumrets V0N kodar panelantalet: V00=4, V01=6, V02=8.
        vantad = {4: "V00", 6: "V01", 8: "V02"}[pan]
        if vantad not in artnr:
            fel.append(f"{nyckel}: artnr {artnr} bär inte {vantad} för {pan} paneler")
    return fel


if __name__ == "__main__":
    f = kontroll()
    print("kontroll:", "OK" if not f else f)
    for k, r in sorted(ALLA.items(), key=lambda x: (x[1][0], x[1][2])):
        ny = " NY" if k in RUNDAN else ""
        print(f"  {k} {r[0]} paneler {r[2]:6} {r[3]:>5} kr  {r[8]}{ny}")
