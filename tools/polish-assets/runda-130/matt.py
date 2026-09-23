# -*- coding: utf-8 -*-
"""Runda 130 — sex solcellslampor i rotting/rottingoptik.

Allt här är LÄST ur Wix 2026-09-11 (Steg 3), inte skrivet ur minnet.
Tre grupper, INTE en familj:

  A  PE-rotting pa stativ, 15 lm / 2500 K   65e3c24f 4e23a904 66a26135 5ffb91a2
  B  2-pack bordslampor, 3500 K             ef0c374b
  C  Rottingoptik-lykta, 0,8 W, ingen IP    a8cf27cd
"""

GRUPP = {
    "65e3c24f": "A", "4e23a904": "A", "66a26135": "A", "5ffb91a2": "A",
    "ef0c374b": "B", "a8cf27cd": "C",
}

# variant-id, SKU som IMPORTEN satte, pris (ror aldrig priset)
VARIANT = {
    "65e3c24f": ("dad590ab-51bd-4ee2-8140-45bfc721dbb8", "FP-solar-stehlampe-rattan", "969"),
    "4e23a904": ("d96c462c-f819-4986-b14a-fb41c7567e63", "FP-solar-stehlampe-rattan", "739"),
    "66a26135": ("4b8f2206-c146-491e-a755-a3f3fff2a580", "FP-solar-stehlampe-rattan", "929"),
    "5ffb91a2": ("663de04b-4c20-415a-affc-b34b181509e9", "FP-rattan-au-enleuchte", "899"),
    "ef0c374b": ("6cc55dfb-b450-409b-9039-0e51520dc6b8", "FP-solar-stehlampe-2er-set", "1399"),
    "a8cf27cd": ("d2ea071d-37f8-4872-82f3-2e20944186be", "FP-gartenleuchte-au-enlampe", "659"),
}

# ☠️ TRE utkast delar SKU:n FP-solar-stehlampe-rattan. Arvt fran importen
#    (24-teckenkapningen, uppgift #272) — inte skapat har.

# Leverantorens egna tal, ordagrant ur Technische Daten + spec-tabellen.
# "spec_*" ar den SVENSKA spec-tabellen importen byggde; "de_*" ar tyskan.
MATT = {
    "65e3c24f": dict(
        matt="Ø37 x 144H cm", fot="Ø28 x 2,5H cm", panel="Ø8 x 2,8T cm",
        lumen="15 lm", kelvin="2500 K", ladd="5 timmar", lys="8 timmar",
        watt="0,06 W per lampa", batteri="AA Ni-MH 600 mAh 1,2 V",
        ip="IP44", cert="CE DOC", vikt="7 kg", paket="38 × 38 × 26 cm",
        de_farg="Schwarz+Gelb", spec_farg="Gelb",
        de_material="Stahl, PE Rattan", spec_material="Stahl",
        montering="Montage erforderlich",
        lieferumfang=["1 x Rattanlampe", "1 x Bedienungsanleitung"],
        sarskilt="tre lyktor + mellanhylla, rund stalbas, tre ror",
    ),
    "4e23a904": dict(
        matt="44L x 32B x 178H cm", fot="28B x 28T cm", panel="Ø8 x 2,8T cm",
        lumen="15 lm", kelvin="2500 K", ladd="5 timmar", lys="8 timmar",
        watt="0,06 W per enhet", batteri="AA Ni-MH 600 mAh 1,2 V",
        ip="IP44", cert="CE", vikt="4,3 kg", paket="42 × 38 × 22 cm",
        de_farg="Schwarz+Gelb", spec_farg="Gelb",
        de_material="Stahl, PE-Rattan", spec_material="PE-Rattan",
        montering="Montage erforderlich",
        lieferumfang=["1 x Rattanlampe", "4 x Erdspiess", "1 x Bedienungsanleitung"],
        sarskilt="bagform, bred kvadratisk fot, fyra jordankare, pulverlackad ram",
    ),
    "66a26135": dict(
        matt="22L x 22B x 77H cm", fot="22B x 22T cm", panel="12B x 12T cm",
        lumen="15 lm", kelvin="2500 K", ladd="5 timmar", lys="8 timmar",
        watt="0,06 W per LED", batteri="AA Ni-MH 1200 mAh 1,2 V",
        solmodul="4,5 V / 150 mA", leds="25",
        ip="IP44", cert="CE", vikt="3,3 kg", paket="22 × 22 × 82 cm",
        de_farg="Schwarz+Grau", spec_farg="Grau",
        de_material="Stahl, PE-Rattan", spec_material="PE-Rattan",
        montering="Keine Montage erforderlich",
        lieferumfang=["1 x Rattanlampe", "1 x Bedienungsanleitung"],
        sarskilt="lag pelare, 25 varmvita LED, ingen montering",
    ),
    "5ffb91a2": dict(
        matt="Ø34 x 130H cm", fot="Ø28 cm", panel="Ø12 cm",
        lumen="15 lm", kelvin=None, ladd="5 timmar", lys="8 timmar",
        watt="0,06 W per enhet", batteri=None, livslangd="20 000 timmar",
        ip="IP44", cert=None, vikt="5 kg", paket="37,5 × 37,5 × 33 cm",
        de_farg="Gelb", spec_farg="Gelb", alt_farg="Schwarz/Gelb",
        de_material="Stahl, PE-Rattan", spec_material="Legierter Stahl",
        montering=None,
        lieferumfang=["1 x Rattan-Leuchte", "1 x Handbuch"],
        sarskilt="skarmen kastar skuggmonster; ENDA i rundan med angiven livslangd",
    ),
    "ef0c374b": dict(
        matt_stor="Ø45 x 45H cm", matt_liten="Ø35 x 35H cm", panel="Ø12 cm",
        lumen="15 lm", kelvin="3500 K", ladd="5 timmar", lys="8 timmar",
        watt="1,5 W totalt", batteri="AA Ni-MH 1200 mAh 1,2 V", leds="25",
        ip="IP44", cert=None, vikt="8 kg", paket="47 × 47 × 51 cm",
        de_farg="Sand+Schwarz", spec_farg="Sand",
        de_material="PE Rattan, Stahl", spec_material="Rattan",
        montering="Keine Montage erforderlich",
        lieferumfang=["2 x Rattanlampe", "1 x Bedienungsanleitung"],
        sarskilt="TVA lampor i olika storlek; ljuset riktas nedat",
    ),
    "a8cf27cd": dict(
        matt="Ø21,5 x 61H cm", topp="Ø15 cm", panel="8,5L x 8,5B cm",
        lumen=None, kelvin=None, ladd="6 timmar", lys="8 timmar",
        watt="0,8 W", batteri=None,
        ip=None, cert=None, vikt="1,5 kg", paket="22,7 × 22,5 × 64,3 cm",
        de_farg="Braun", spec_farg="Braun",
        de_material="PE, Stahl, Kunststoff", spec_material="Kunststoff/Legierter Stahl",
        montering="Einfach zu montieren",
        lieferumfang=["1 x Rattan-Standleuchte", "1 x Anleitung"],
        sarskilt="avtrappad cylinderskarm, stor fot, lagesomkopplare maste sta pa",
    ),
}

# Publicerade syskon ur runda 129 (samma familj: solcellsbelysning for tradgard).
# Korslank ska ga at BADA hallen (uppgift #480).
#
# ☠️ DE HAR SLUGGARNA SKREVS FORST UR MINNET och atta av nio var FEL
#    ("solcellslampa-185-cm" mot verkliga "solcellslampa-185-cm-tre-lyktor").
#    Textgrinden fangade det bara indirekt — pa att korslankens TAL inte gick
#    att harleda — och utan den hade sex sidor gatt live med doda lankar.
#    Listan HARLEDS darfor ur runda 129:s egen texter.py i stallet for att
#    kopieras, och _VERIFIERAT nedan ar vad Wix faktiskt svarade 2026-09-11.
#    Samma regel som SHIP_AXIS_RE och EU_TULL_CODES: tvillingar glider isar.
_VERIFIERAT = {
    "14aa1777": "solcellslampa-180-cm-2-pack",
    "1f14ab66": "solcellslampa-195-cm-planteringskruka",
    "c9ab8531": "solcellslampa-182-cm-tva-klot",
    "4ef7c2b4": "solcellslampa-185-cm-tre-lyktor",
    "ec8ab782": "solcellslampa-189-cm-tre-glaskupor",
    "db933c3c": "solcellslampa-dimbar-tre-lyktor-rostfri",
    "a6727ca5": "solcellslampa-177-cm-tradgardslykta",
    "9938574b": "solcellslykta-129-cm-2-pack",
    "6747b6c0": "solcellslampa-160-cm-rostfri",
}


def _las_runda_129():
    import importlib.util
    import os
    import sys
    p = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                     "..", "runda-129", "texter.py")
    spec = importlib.util.spec_from_file_location("_t129", p)
    mod = importlib.util.module_from_spec(spec)
    sys.modules["_t129"] = mod
    spec.loader.exec_module(mod)
    return dict(mod.SLUG)


SYSKON_129 = _las_runda_129()
_avvikande = {k: (v, SYSKON_129.get(k)) for k, v in _VERIFIERAT.items()
              if SYSKON_129.get(k) != v}
assert not _avvikande, "runda 129:s slugs skiljer sig fran Wix: %r" % _avvikande

PARKERAD = {"137403f6": "Solpanel 100 W 18 V, barbar laddare — INTE belysning"}
