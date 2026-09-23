# -*- coding: utf-8 -*-
"""Runda 108 — rumsavdelare i polypropen på tallram.

Familjen är EN konstruktion i tre panelantal och fyra färger. Panelen är alltid
40 × 1,6 × 170 cm och foten 6,5 cm; allt annat följer mekaniskt av antalet:

    utfälld bredd = 40 × paneler
    gångjärn      = 2 × paneler + (paneler ÷ 2) − 1   ← se GANGJARN nedan
    hopfälld djup = 1,6 × paneler + spel

☠️ TALEN HÄRLEDS INTE — de står i leverantörens spec och skrivs av. Formeln
   ovan är bara en KONTROLL av att raderna hänger ihop; stämmer den inte är det
   spec-blocket som ska gälla, inte formeln. (Runda 107: ett `* 100` som var
   grönt i talgrinden gav "37,6 m²".)

☠️ TVÅ FEL I IMPORTENS SVENSKA SPEC-BLOCK, båda i alla sex:
   1. `Material: Kiefernholz` — polypropenet har fallit bort. Tyskan säger
      "Materialien: Polypropylen, Kiefernholz". Väven ÄR produkten; att skriva
      bara tall är att beskriva ramen och kalla det varan.
   2. `Mått: 320L x 1,6B x 170H` — importen döpte om tyskans B(reite) till L
      och T(iefe) till B. Måttet är BREDD × DJUP × HÖJD.
"""

# paneler -> (utfälld bredd, hopfälld djup, vikt, gångjärn)
MODELL = {
    4: (160, 6.4, "6 kg", 9),
    6: (240, 12.5, "7,9 kg", 15),
    8: (320, 16.0, None, 21),      # vikten skiljer per färg, se UTKAST
}
PANELMATT = (40, 1.6, 170)         # bredd × djup × höjd, per panel
FOTHOJD = "6,5 cm"
HOJD = 170
DJUP = 1.6

#            (paneler, färg, slug-färg, pris, vikt, paketmått, wixProductId)
UTKAST = {
 "5f14c112": (4, "vit",   "vit",   1069, "6 kg",    "173 × 43 × 9 cm",
              "5f14c112-8c5e-44bf-9c71-321bbc7010c4"),
 "957b042d": (4, "brun",  "brun",  1139, "6 kg",    "173 × 43 × 9 cm",
              "957b042d-7896-4892-9f05-30ab5a32d95a"),
 "6649471e": (6, "natur", "natur", 1329, "7,9 kg",  "173 × 43 × 15 cm",
              "6649471e-604e-497e-8ff1-e5833b8d0068"),
 "854371fe": (6, "brun",  "brun",  1179, "7,9 kg",  "173 × 43 × 15 cm",
              "854371fe-f4d6-4700-be9a-ff54060e7374"),
 "da1a8a75": (8, "vit",   "vit",   1499, "9,65 kg", "173 × 43 × 18,5 cm",
              "da1a8a75-6efe-4709-98e3-148ac6ceb2a5"),
 "64c0809d": (8, "natur", "natur", 1429, "9,6 kg",  "173 × 43 × 18,5 cm",
              "64c0809d-002e-4e83-aa4a-a2941fe68392"),
}

# ☠️ INTE I RUNDAN — bevisade dubbletter av den publicerade d4118d39
#    (240 × 1,6 × 170, hopfälld 40 × 12,5 × 170, panel 40 × 1,6 × 170, 15
#    gångjärn, samma material). Den publicerade sidans färgfält säger
#    "vit eller svart", alltså exakt de här två. Uppgift #387.
DUBBLETTER = {
 "ffb5239f": (6, "vit",   1329, "ffb5239f-3cfd-49c8-ae10-5f8b9993c6f6"),
 "7bd4f691": (6, "svart", 1239, "7bd4f691-ad6d-4ae2-9fa4-656caa3933e8"),
}
PUBLICERAD_SYSKONSIDA = ("d4118d39-9c2b-4152-8512-f45daa582768",
                         "hopfallbar-rumsavdelare")


def kontroll():
    """Hänger raderna ihop? Om inte gäller spec-blocket, inte formeln."""
    fel = []
    for nyckel, (pan, farg, _s, _p, vikt, _pm, _id) in UTKAST.items():
        bredd, hopfalld, modellvikt, gangjarn = MODELL[pan]
        if bredd != PANELMATT[0] * pan:
            fel.append(f"{nyckel}: bredd {bredd} != 40 × {pan}")
        # 8-panelsvikten skiljer per färg (9,6 mot 9,65) — därav None i MODELL.
        if modellvikt and vikt != modellvikt:
            fel.append(f"{nyckel}: vikt {vikt} != modellens {modellvikt}")
        if abs(hopfalld - (DJUP * pan + (0 if pan == 4 else 2.9 if pan == 6 else 3.2))) > 0.4:
            fel.append(f"{nyckel}: hopfälld {hopfalld} rimmar inte med {pan} paneler")
    return fel


if __name__ == "__main__":
    print("=== rundans sex ===")
    for k, (pan, farg, _s, pris, vikt, pm, _id) in UTKAST.items():
        b, hf, _v, gj = MODELL[pan]
        print(f"  {k}  {pan} paneler  {farg:<6} {pris:>5} kr   "
              f"utfälld {b} × {DJUP} × {HOJD} cm   hopfälld 40 × {hf} × {HOJD} cm   "
              f"{gj} gångjärn   {vikt:<8} paket {pm}")
    print("\n=== dubbletter, INTE i rundan ===")
    for k, (pan, farg, pris, _id) in DUBBLETTER.items():
        print(f"  {k}  {pan} paneler  {farg:<6} {pris:>5} kr  — samma tal som "
              f"publicerade {PUBLICERAD_SYSKONSIDA[1]}")
    f = kontroll()
    print("\nkontroll:", "alla rader hänger ihop" if not f else f)
