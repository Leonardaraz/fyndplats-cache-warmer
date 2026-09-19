# -*- coding: utf-8 -*-
"""Runda 139 — facit, med TRE källor per fält (#447).

  TYSK    leverantörens egen `Technische Daten` (raw/*.txt)
  SVENSK  importens svenska spec-rad (samma fil, sista raden)
  RITNING bild 3 — den ortografiska ritningen, läst i Steg 4

☠️ Regel 7: stämmer inte TYSK och SVENSK om ett fält är fältet `None` tills
   det gått att läsa om — aldrig det tal som råkade skrivas sist.
☠️ Regel 9: står etiketten mot RITNINGEN, mät ritningen. Men BARA geometri —
   en lastsiffra i en ritning är text som råkat ritas.
☠️ `Artikelnummer` är ALDRIG en spec-etikett.
"""

WIX = {
    "1467588a": "1467588a-3a19-40fa-bea7-5b7c57265d47",
    "27b607dc": "27b607dc-0d9d-4f7f-9a89-701a88f6038f",
    "3a96740e": "3a96740e-4eb0-405c-8019-c9588a072e0f",
    "3addfbf8": "3addfbf8-c473-4655-a9c4-9ab9b0be7b59",
    "4faf9f4c": "4faf9f4c-36df-49eb-950b-5c18c3a37f8d",
    "8d074911": "8d074911-217e-473f-885e-3aefde26a1dd",
    "90573e36": "90573e36-520b-46a5-87de-3f8e805a7ae8",
    "a4d8feca": "a4d8feca-2bd2-4414-89a1-d2cad766cac5",
    "b04b5375": "b04b5375-8262-4c9e-9137-551e9dff58b7",
    "b813d037": "b813d037-82d9-4f5e-b24f-ae7bd8d57a1f",
}

# ☠️ SLUGGARNA ÄR VALDA MOT DEN KAPADE SKU-BASEN (#473), inte mot sluggen.
#    Första förslaget för `8d074911` var `vaggklostrad-4-delar-moln-och-hala`
#    → `FP-vaggklostrad-4-delar`, alltså EXAKT samma bas som publicerade
#    `vaggklostrad-4-delar-plattformar-stege`. Osynligt i sluggen; skapat av
#    kapningen. Mätt mot alla 5 695 sluggar: noll krockar efter bytet.
SLUG = {
    "1467588a": "klostrad-92-cm-hangande-boll",
    "27b607dc": "klospelare-80-cm-ek-och-cremevit",
    "3a96740e": "klostrad-153-cm-hala-och-hangmatta",
    "3addfbf8": "klostrad-76-cm-badd-och-klosbrada",
    "4faf9f4c": "klostrad-113-cm-hala-badd-ramp",
    "8d074911": "vaggklostrad-moln-hala-och-stege",
    "90573e36": "klostrad-220-240-cm-gront-och-rosa",
    "a4d8feca": "klostunna-60-cm-brun",
    "b04b5375": "vaggklostrad-73-cm-tre-klivsteg",
    "b813d037": "klostrad-104-cm-fyra-plan-grat",
}

# Yttermått (L × B × H i cm) ur de tre källorna. `None` = fältet finns inte.
MATT = {
    "1467588a": {"TYSK": "48 × 48 × 92",      "SVENSK": "48 × 48 × 92",      "RITNING": "48 × 48 × 92"},
    "27b607dc": {"TYSK": "38 × 38 × 80",      "SVENSK": "38 × 38 × 80",      "RITNING": "38 × 38 × 80"},
    "3a96740e": {"TYSK": "65 × 50 × 153",     "SVENSK": "65 × 50 × 153",     "RITNING": "65 × 50 × 153"},
    "3addfbf8": {"TYSK": "60 × 30 × 76",      "SVENSK": "60 × 30 × 76",      "RITNING": "60 × 30 × 76"},
    "4faf9f4c": {"TYSK": "60 × 40 × 113",     "SVENSK": "60 × 40 × 113",     "RITNING": "60 × 40 × 113"},
    "8d074911": {"TYSK": "50 × 40 × 84",      "SVENSK": "50 × 40 × 84",      "RITNING": "50 × 40 × 84"},
    "90573e36": {"TYSK": "30 × 25 × 220–240", "SVENSK": "30 × 25 × 220–240", "RITNING": "30 × 25 × 220–240"},
    "a4d8feca": {"TYSK": "Ø35 × 60",          "SVENSK": "35 × 35 × 60",      "RITNING": "Ø35 × 60"},
    "b04b5375": {"TYSK": "40 × 28 × 73",      "SVENSK": "40 × 28 × 73",      "RITNING": "40 × 28 × 73"},
    "b813d037": {"TYSK": "48 × 48 × 104",     "SVENSK": "48 × 48 × 104",     "RITNING": "48 × 48 × 104"},
}

# ☠️ FÄRGEN. `b813d037` säger Grau i tyskan och Hellgrau i den svenska raden.
#    RITNINGEN och produktfotot visar mellangrå plysch → tyskan har rätt.
FARG = {
    "1467588a": "mörkgrått och krämvitt",
    "27b607dc": "ekfärgat och krämvitt",
    "3a96740e": "krämvitt och kaffebrunt",
    "3addfbf8": "ljusgrått",
    "4faf9f4c": "ljusgrått",
    "8d074911": "beige och grått",
    "90573e36": "grönt och rosa",
    "a4d8feca": "naturbrunt med krämvit kant",
    "b04b5375": "beige och krämvitt",
    "b813d037": "grått",
}

# Stomme + ytskikt ur TYSKAN. ☠️ Den svenska spec-raden säger `Polyester` på
# fem av tio där källan listar tre material — den är en KAPNING, inte ett facit.
MATERIAL = {
    "1467588a": "spånskiva, sisal och lammullsimitat",
    "27b607dc": "spånskiva och sisal",
    "3a96740e": "spånskiva, plysch och sisal",
    "3addfbf8": "spånskiva, plysch och sisal",
    "4faf9f4c": "spånskiva, plysch och sisal",
    "8d074911": "spånskiva, plysch och sisal",
    "90573e36": "spånskiva, teddyfleece och sisal",
    "a4d8feca": "spånskiva, plysch, PP-bomull och sisal",
    "b04b5375": "spånskiva, plysch och sisal",
    "b813d037": "spånskiva, sisal och plysch",
}

# ☠️ BATCHENS VIKTIGASTE KUNDFAKTA. En svensk huskatt väger 4–5 kg; en norsk
#    skogkatt 6–9. Gränsen syns inte på bilden och MÅSTE stå i brödtexten.
KATTVIKT = {
    "1467588a": "5 kg",
    "27b607dc": "5 kg",
    "3a96740e": "4,5 kg",
    "3addfbf8": "5 kg",
    "4faf9f4c": "5 kg",
    "8d074911": "5 kg",
    "90573e36": "5 kg",
    "a4d8feca": None,           # ingen kattviktsgräns angiven; bärighet 10 kg
    "b04b5375": "5 kg",
    "b813d037": "4,5 kg",
}

BARIGHET = {
    "1467588a": None,
    "27b607dc": None,
    "3a96740e": None,
    "3addfbf8": None,
    "4faf9f4c": "15 kg totalt, 10 kg på bädd och hylla, 8 kg i hängmattan",
    "8d074911": None,
    "90573e36": None,
    "a4d8feca": "10 kg",
    "b04b5375": None,
    "b813d037": "30 kg totalt",
}

# Varans vikt ur TYSKAN där den finns. ☠️ Spec-radens `Vikt` är FRAKTVIKTEN
#    (#488) — `3a96740e` har 14 kg i tyskan och 15 i spec-raden. Där bara
#    spec-raden finns skrivs INGEN vikt alls hellre än ett tal som är fel.
VIKT = {
    "1467588a": None, "27b607dc": None, "3a96740e": "14 kg", "3addfbf8": None,
    "4faf9f4c": None, "8d074911": None, "90573e36": None, "a4d8feca": None,
    "b04b5375": None, "b813d037": None,
}

MONTERING = {
    "1467588a": "krävs", "27b607dc": "krävs", "3a96740e": "krävs",
    "3addfbf8": "krävs", "4faf9f4c": "krävs",
    "8d074911": "krävs, väggmonteras",
    "90573e36": "krävs, spänns mellan golv och tak",
    "a4d8feca": "ingen montering",
    "b04b5375": "krävs, väggmonteras",
    "b813d037": "krävs",
}

# Delmått som får skrivas ut. ☠️ `1467588a`:s klösmatta står INTE här:
#    spec-blocket säger 42 × 16, ritningen märker 37 och 11 på mattan.
#    Regel 7 → fältet är None och skrivs inte alls.
DELAR = {
    "1467588a": {"bädd": "Ø41 × 7 cm", "stam": "Ø13,5 cm", "övre plan": "38 × 38 cm"},
    "27b607dc": {"topplatta": "17,5 × 17,5 cm", "stam": "14,5 × 14,5 × 76 cm"},
    "3a96740e": {"håla": "30 × 25 cm", "stam": "Ø7,1 cm"},
    "3addfbf8": {"bädd": "Ø34 cm", "andra planet": "45 × 30 cm med Ø15,5 cm hål",
                 "klösbräda": "43 × 30 cm", "stolpe": "Ø5,5 cm"},
    "4faf9f4c": {"håla": "40 × 30 × 27 cm med 19 × 19 cm öppning",
                 "toppbädd": "Ø31,5 × 7 cm", "hängmatta": "Ø30 × 5 cm",
                 "plan": "Ø30 cm", "ramp": "38 × 17 cm", "stam": "Ø6,7 cm"},
    "8d074911": {"kattbädd": "40 × 30 × 8 cm", "klösbräda": "40 × 30 × 18 cm",
                 "klösstolpe": "84 cm hög med topplan 50 × 40 cm och två plan 30 × 30 cm",
                 "håla": "30 × 30 cm med 16 cm öppning", "mjuk brygga": "61 × 30 cm"},
    "90573e36": {"håla": "Ø33 × 31 cm med 20 × 22 cm öppning",
                 "hoppyta": "Ø30 cm", "stolpe": "Ø7 cm", "ramp": "39 × 15 cm"},
    "a4d8feca": {"nedre rum": "Ø33 × 27 cm", "övre rum": "Ø33 × 24 cm",
                 "öppning": "Ø17 cm"},
    "b04b5375": {"klösstam": "Ø20 × 32 cm", "hängmatta": "Ø30 × 5 cm"},
    "b813d037": {"hus": "Ø30 × 25 cm", "andra våningen": "Ø30 cm",
                 "toppbädd": "Ø32 × 7 cm", "bas": "Ø48 cm"},
}

# (huvudord, ord som betyder en ANNAN produkttyp och aldrig får stå i namnet)
TYP = {
    "1467588a": ("klösträd", ["klöstunna", "väggmonterad", "takspänd"]),
    "27b607dc": ("klöspelare", ["klöstunna", "väggmonterad", "takspänd"]),
    "3a96740e": ("klösträd", ["klöstunna", "väggmonterad", "takspänd"]),
    "3addfbf8": ("klösträd", ["klöstunna", "väggmonterad", "takspänd"]),
    "4faf9f4c": ("klösträd", ["klöstunna", "väggmonterad", "takspänd", "kattlåda"]),
    "8d074911": ("väggklösträd", ["klöstunna", "takspänd", "golvstående"]),
    "90573e36": ("klösträd", ["klöstunna", "väggmonterad"]),
    "a4d8feca": ("klöstunna", ["väggmonterad", "takspänd"]),
    "b04b5375": ("väggklösträd", ["klöstunna", "takspänd", "golvstående"]),
    "b813d037": ("klösträd", ["klöstunna", "väggmonterad", "takspänd"]),
}


def _regel7():
    """TYSK mot SVENSK på yttermåttet. Avvikelse → fältet får inte skrivas."""
    fel = []
    for p, k in MATT.items():
        t, s = k["TYSK"], k["SVENSK"]
        # Ø-notation mot L×B: samma tal, annan skrivning — inte en avvikelse.
        norm = lambda x: sorted(re_tal(x))
        if norm(t) != norm(s):
            fel.append((p, t, s))
    return fel


def _regel8():
    """Yttermåttet måste stämma med RITNINGEN (regel 8)."""
    fel = []
    for p, k in MATT.items():
        if sorted(re_tal(k["TYSK"])) != sorted(re_tal(k["RITNING"])):
            fel.append((p, k["TYSK"], k["RITNING"]))
    return fel


import re as _re


def re_tal(s):
    return [x.replace(",", ".") for x in _re.findall(r"\d+(?:,\d+)?", s or "")]


if __name__ == "__main__":
    import sys
    fel = []
    for p in WIX:
        for d in (SLUG, MATT, FARG, MATERIAL, KATTVIKT, BARIGHET, VIKT, MONTERING, DELAR, TYP):
            if p not in d:
                fel.append(f"{p} saknas i en tabell")
    # ⚠️ a4d8feca: TYSK "Ø35 × 60" mot SVENSK "35 × 35 × 60" — samma kropp,
    #    annan notation. Talen 35/60 mot 35/35/60 skiljer sig i ANTAL, och
    #    regel 7 ska inte fälla på det. Undantaget är explicit, inte tyst.
    r7 = [f for f in _regel7() if f[0] != "a4d8feca"]
    r8 = _regel8()
    for p, t, s in r7:
        fel.append(f"REGEL 7 {p}: TYSK {t} != SVENSK {s}")
    for p, t, r in r8:
        fel.append(f"REGEL 8 {p}: TYSK {t} != RITNING {r}")
    if fel:
        print("\n".join("  " + f for f in fel))
        sys.exit(1)
    print(f"matt.py: {len(WIX)} produkter, regel 7 och 8 gröna "
          f"(a4d8feca undantaget explicit: Ø-notation mot L×B)")
