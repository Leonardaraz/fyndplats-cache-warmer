# -*- coding: utf-8 -*-
"""Runda 119 — ETT ställe där rundans tal bor.

☠️ ALLA TAL KOMMER UR LEVERANTÖRENS `Technische Daten`, inte ur titeln och
   inte ur den svenska spec-raden importen skrev. Den svenska raden är i tre
   fall FEL, och det syns bara om man läser båda:

   | id | tyskan + måttritningen | svenska spec-raden |
   |---|---|---|
   | `6cf7cfcf` | 87 cm hög | **84 cm** |
   | `36526a8d` | 86,5 cm hög | **84,5 cm** |
   | `5d1696db` | 84 L × 36 B | **36 T × 84 B** (axlarna kastade om) |

   Måttritningen (bild 3) avgör i alla tre — den är ritad av tillverkaren och
   bär samma tal som `Technische Daten`.

⚠️ `HARLEDDA` är tal som får stå i texten utan att komma ur en produktrad:
   årtal, antal i uppräkningar och liknande. Talgrinden i `grind.py` fäller
   varje annat tal, så ett påhittat mått kan inte nå kunden.
"""

# ── Grupper ────────────────────────────────────────────────────────────────
VAGN = ["ad390a36", "dac7a904", "c86ff1a6", "5d1696db", "6cf7cfcf", "36526a8d"]
KOKSO = ["9e5e788c", "d8bbbdde", "e0fed2c9"]
ALLA = VAGN + KOKSO

# ☠️ 36526a8d är den ENDA som tål att stå ute, och den enda i rostfritt.
UTOMHUS = {"36526a8d"}
# ☠️ Bara köksöarna har en skiva som fälls ut. En vagn som påstår det ljuger.
UTFALLBAR = set(KOKSO)
# Soft close finns på tre, inte på alla.
SOFTCLOSE = {"c86ff1a6", "9e5e788c", "e0fed2c9"}
# Fem hjul, inte fyra.
FEM_HJUL = {"9e5e788c", "e0fed2c9"}

M = {
    "ad390a36": dict(
        bredd="53", djup="37", hojd="89", matt="53 × 37 × 89 cm",
        skiva="53 × 37 cm", skivtjocklek="1,5 cm",
        lador="2", lada_ovre="29 × 32,4 × 20 cm", lada_nedre="29 × 32,4 × 24,5 cm",
        fack="48 × 36 × 26,5 cm", antal_fack="två öppna fack",
        maxlast="30 kg totalt, 5 kg per hylla och 3 kg per låda",
        maxlast_kort="30 kg", hylllast="5", ladlast="3",
        vikt="16,5 kg", material="spånskiva och stål", material_kort="spånskiva",
        yta="melamin i träoptik",
        farg="vit", farg_kort="vit", farg_lang="vit med skiva i träoptik",
        hjul="fyra 50 mm länkhjul, två med broms", hjul_punkt="Fyra 50 mm länkhjul, två av dem bromsade",
        hjul_svar="Vagnen rullar på fyra 50 mm länkhjul och två av dem har broms.",
        montering="Vagnen levereras omonterad med monteringsanvisning.",
        paket="91,8 × 44,5 × 18,5 cm"),

    "dac7a904": dict(
        bredd="108,8", djup="51", hojd="92,5", matt="108,8 × 51 × 92,5 cm",
        skiva="101,5 × 51 cm", skivtjocklek="1,5 cm",
        lador="1", lada_ovre="83,7 × 33,7 × 8,8 cm", lada_nedre="83,7 × 33,7 × 8,8 cm",
        fack="88,5 × 40,7 × 26 cm", antal_fack="två öppna hyllplan",
        fack_nedre="88,5 × 40,7 × 30 cm",
        handduk="33 × 12 × 8 cm", golvfri="12,6 cm",
        maxlast="50 kg totalt, 20 kg på skivan och 10 kg per låda eller hylla",
        maxlast_kort="50 kg", hylllast="10", ladlast="10",
        vikt="26 kg", material="MDF, spånskiva och furu", material_kort="MDF och furu",
        yta="vattenavvisande melaminyta",
        farg="vit", farg_kort="vit", farg_lang="vit med skiva i naturträ",
        hjul="fyra hjul", hjul_punkt="Fyra lättrullade hjul",
        hjul_svar="Vagnen rullar på fyra hjul.",
        montering="Vagnen levereras omonterad med monteringsanvisning.",
        paket="117,4 × 59 × 14,5 cm"),

    "c86ff1a6": dict(
        bredd="83", djup="40", hojd="83", matt="83 × 40 × 83 cm",
        skiva="76 × 40 cm", skivtjocklek="",
        lador="0", skap="43 × 36,5 × 33,5 cm",
        fack="43 × 38 × 33 cm", antal_fack="ett öppet mittfack",
        sidohylla="35,5 × 12 cm", vinfack="12 × 36,5 × 11 cm", flaskor="sex",
        maxlast="37 kg totalt, 15 kg på skivan, 5 kg i skåpet och 3 kg per vinfack",
        maxlast_kort="37 kg", hylllast="5", ladlast="3",
        vikt="29,7 kg", material="spånskiva, gummiträ och stål", material_kort="gummiträ och spånskiva",
        yta="skiva i gummiträ",
        farg="ekfärgad", farg_kort="ek", farg_lang="vit med skiva i ekfärgat gummiträ",
        hjul="fyra hjul", hjul_punkt="Fyra hjul",
        hjul_svar="Vagnen rullar på fyra hjul.",
        montering="Vagnen levereras omonterad med monteringsanvisning.",
        paket="92 × 49,5 × 21,5 cm"),

    "5d1696db": dict(
        bredd="84", djup="36", hojd="85", matt="84 × 36 × 85 cm",
        skiva="76 × 36 cm", glasskiva="69,7 × 29,7 cm", skivtjocklek="",
        lador="2", lada_ovre="31 × 28 × 9 cm", lada_nedre="31 × 28 × 9 cm",
        fack="35 × 33 × 28 cm", antal_fack="två öppna hyllplan",
        skap="34 × 32 × 57 cm", handduk="32 × 10 cm",
        maxlast="50 kg totalt, 20 kg på skivan, 10 kg i skåpet och 5 kg per plan eller låda",
        maxlast_kort="50 kg", hylllast="5", ladlast="5",
        vikt="19,6 kg", material="lackerad bambu", material_kort="bambu",
        yta="bambuskiva med infälld glasyta",
        farg="naturfärgad", farg_kort="natur", farg_lang="naturfärgad bambu",
        hjul="fyra hjul, två med broms", hjul_punkt="Fyra hjul, två av dem bromsade",
        hjul_svar="Vagnen rullar på fyra hjul och två av dem har broms.",
        montering="Vagnen levereras omonterad med monteringsanvisning.",
        paket="85,5 × 41,7 × 20,2 cm"),

    "6cf7cfcf": dict(
        bredd="67", djup="37", hojd="87", matt="67 × 37 × 87 cm",
        skiva="67 × 37 cm", skivtjocklek="1,5 cm",
        lador="3", lada_ovre="26 × 28,7 × 18,4 cm", lada_nedre="26 × 28,7 × 18,4 cm",
        bricka="30 × 28,5 × 4,5 cm",
        fack="30 × 29,5 cm", antal_fack="två spjälhyllor",
        maxlast="40 kg totalt, 10 kg på skivan och 5 kg per hylla eller låda",
        maxlast_kort="40 kg", hylllast="5", ladlast="5",
        vikt="20 kg", material="MDF och furu", material_kort="MDF och furu",
        yta="skiva i furu",
        farg="vit", farg_kort="vit", farg_lang="vit med skiva i furu",
        hjul="fyra hjul, två med broms", hjul_punkt="Fyra hjul, två av dem bromsade",
        hjul_svar="Vagnen rullar på fyra hjul och två av dem har broms.",
        montering="Vagnen levereras omonterad med monteringsanvisning.",
        paket="95 × 46 × 23 cm"),

    "36526a8d": dict(
        bredd="86", djup="50", hojd="86,5", matt="86 × 50 × 86,5 cm",
        skiva="70 × 46,5 cm", skivtjocklek="",
        lador="0", skap="69,9 × 43 × 73 cm", krokar="sex",
        fack="69,9 × 43 × 73 cm", antal_fack="ett stängt skåp",
        maxlast="15 kg på skivan och 10 kg inuti skåpet",
        maxlast_kort="15 kg på skivan", hylllast="10", ladlast="10",
        vikt="16,8 kg", material="pulverlackerad metall och rostfritt stål",
        material_kort="metall och rostfritt", yta="skiva i rostfritt stål",
        farg="svart", farg_kort="svart", farg_lang="svart med skiva i rostfritt stål",
        hjul="fyra hjul, två med broms", hjul_punkt="Fyra hjul, två av dem bromsade",
        hjul_svar="Vagnen rullar på fyra hjul och två av dem har broms.",
        montering="Vagnen levereras omonterad med monteringsanvisning.",
        paket="79 × 52 × 19 cm"),

    "9e5e788c": dict(
        bredd="115", djup="70", hojd="89", matt="115 × 70 × 89 cm",
        skiva="96 × 70 cm", skiva_ned="96 × 40 cm", skivtjocklek="",
        lador="2", lada_ovre="85,1 × 28,7 × 10 cm", lada_nedre="24,1 × 28,7 × 10 cm",
        fack="29 × 36 × 18,8 cm", antal_fack="två öppna fack",
        skap="29 × 36 × 58 cm", kryddhylla="30,8 × 12 cm", kryddplan="tre",
        handduk="34,2 × 10 × 8 cm",
        maxlast="105 kg totalt, 30 kg på skivan, 10 kg i den stora lådan och 5 kg per hylla",
        maxlast_kort="105 kg", hylllast="5", ladlast="10",
        vikt="48,7 kg", material="MDF", material_kort="MDF",
        yta="melaminyta i träoptik",
        farg="vit", farg_kort="vit", farg_lang="vit med skiva i naturträ",
        hjul="fem hjul, två med broms", hjul_punkt="Fem hjul, två av dem bromsade",
        hjul_svar="Köksön rullar på fem hjul och två av dem har broms.",
        montering="Köksön levereras omonterad med monteringsanvisning.",
        paket="118 × 51 × 18 cm"),

    "d8bbbdde": dict(
        bredd="120", djup="68", hojd="85", matt="120 × 68 × 85 cm",
        skiva="90 × 39 cm", skiva_klaff="90 × 29 cm", matt_ned="120 × 39 × 85 cm",
        skivtjocklek="",
        lador="1", lada_ovre="81 × 28,5 × 8,5 cm", lada_nedre="81 × 28,5 × 8,5 cm",
        fack="86 × 36 × 60,5 cm", antal_fack="ett stängt skåp",
        skap="86 × 36 × 60,5 cm", hjuldiameter="3,5 cm",
        maxlast="100 kg totalt, 40 kg på bänkskivan och 5 kg per hylla eller låda",
        maxlast_kort="100 kg", hylllast="5", ladlast="5",
        vikt="41,6 kg", material="spånskiva", material_kort="spånskiva",
        yta="slät melaminyta",
        farg="vit", farg_kort="vit", farg_lang="vit med skiva i naturträ",
        hjul="fyra hjul, två med broms", hjul_punkt="Fyra hjul, två av dem bromsade",
        hjul_svar="Köksön rullar på fyra hjul och två av dem har broms.",
        montering="Köksön levereras omonterad med monteringsanvisning.",
        paket="103 × 51 × 16 cm"),

    "e0fed2c9": dict(
        bredd="129", djup="65", hojd="91", matt="129 × 65 × 91 cm",
        skiva="120 × 65 cm", skiva_ned="120 × 40 cm", skivtjocklek="18 mm",
        lador="2", lada_ovre="36,1 × 28,7 × 8 cm", lada_nedre="36,1 × 28,7 × 8 cm",
        fack="83,2 × 20 cm", antal_fack="fyra dörrfack",
        dorrfack="35,5 × 10 cm", skap="83,2 × 20 cm",
        bricka="23,8 × 28,8 cm", handduk="30,5 × 11 × 9 cm",
        maxlast="112 kg totalt, 30 kg på skivan, 15 kg på klaffen och 10 kg per låda",
        maxlast_kort="112 kg", hylllast="10", ladlast="10",
        vikt="57,8 kg", material="MDF", material_kort="MDF",
        yta="18 mm skiva med melaminyta",
        farg="vit", farg_kort="vit", farg_lang="vit med skiva i naturträ",
        hjul="fem hjul, två med broms", hjul_punkt="Fem hjul, två av dem bromsade",
        hjul_svar="Köksön rullar på fem hjul och två av dem har broms.",
        montering="Köksön levereras omonterad med monteringsanvisning.",
        paket="133 × 51,5 × 18,5 cm"),
}

# Tal som får stå i texten utan att komma ur en produktrad ovan.
HARLEDDA = ["1", "2", "3", "4", "5", "6", "100", "45", "60", "30", "24"]

# ☠️ FÄRGADE DELAR. Runda 89–91 skrev fel färg tre rundor i rad. Listan säger
#    vilket färgord som får stå omedelbart före varje vaktad del.
DEL_OK = {
    "ad390a36": {"skiva": ["träoptik"], "ram": ["vit"], "låda": ["vit"]},
    "dac7a904": {"skiva": ["naturträ"], "ram": ["vit"], "låda": ["vit"]},
    "c86ff1a6": {"skiva": ["ekfärgad"], "ram": ["vit"], "stomme": ["vit"]},
    "5d1696db": {"skiva": ["bambu"], "ram": ["naturfärgad"], "dörr": ["naturfärgad"]},
    "6cf7cfcf": {"skiva": ["furu"], "ram": ["vit"], "låda": ["vit"]},
    "36526a8d": {"skiva": ["rostfri"], "ram": ["svart"], "stomme": ["svart"]},
    "9e5e788c": {"skiva": ["naturträ"], "ram": ["vit"], "låda": ["vit"]},
    "d8bbbdde": {"skiva": ["naturträ"], "ram": ["vit"], "låda": ["vit"]},
    "e0fed2c9": {"skiva": ["naturträ"], "ram": ["vit"], "låda": ["vit"]},
}


def kontroll():
    """Fäller på det som gick fel i tidigare rundor."""
    fel = []
    for pid, d in M.items():
        # 1. Varje produkt måste ha de fält texten och kortet läser.
        for f in ("matt", "vikt", "material", "farg", "maxlast", "maxlast_kort",
                  "hjul", "montering", "bredd", "djup", "hojd", "skiva"):
            if not d.get(f):
                fel.append(f"{pid}: fältet {f!r} saknas eller är tomt")
        # 2. `matt` måste vara byggd av bredd/djup/höjd — annars kan de glida isär.
        vantat = f"{d['bredd']} × {d['djup']} × {d['hojd']} cm"
        if d["matt"] != vantat:
            fel.append(f"{pid}: matt är {d['matt']!r}, väntade {vantat!r}")
        # 3. ☠️ Svensk sifferstil. En decimalPUNKT eller ett 'x' i stället för
        #    '×' nådde kunden i runda 88 och krävde ett katalogsvep att städa.
        for f, v in d.items():
            if not isinstance(v, str):
                continue
            if any(ch.isdigit() for ch in v):
                import re as _re
                if _re.search(r"\d\.\d", v):
                    fel.append(f"{pid}.{f}: DECIMALPUNKT i {v!r}")
                if _re.search(r"\d\s*x\s*\d", v):
                    fel.append(f"{pid}.{f}: 'x' i stället för '×' i {v!r}")
        # 4. ☠️ `maxlast_kort` klistras in MITT I EN MENING. En uppräkning
        #    spräcker satsen (runda 117). Regeln får INTE vara "inget komma":
        #    `16,5 kg` är ett DECIMALKOMMA. Blanksteget efter kommat skiljer.
        if ", " in d["maxlast_kort"]:
            fel.append(f"{pid}: maxlast_kort bär en UPPRÄKNING ({d['maxlast_kort']!r})")
        # 5. Färgen måste finnas i DEL_OK, annars är färggrinden blind.
        if pid not in DEL_OK:
            fel.append(f"{pid}: saknas i DEL_OK — färggrinden är avstängd för den")
    # 6. Gruppmedlemskap måste vara delmängder av ALLA.
    for namn, grupp in (("UTOMHUS", UTOMHUS), ("UTFALLBAR", UTFALLBAR),
                        ("SOFTCLOSE", SOFTCLOSE), ("FEM_HJUL", FEM_HJUL)):
        okand = grupp - set(ALLA)
        if okand:
            fel.append(f"{namn} pekar på okända id: {sorted(okand)}")
    # 7. ☠️ Fem hjul MÅSTE stå i `hjul`-fältet på just de produkterna.
    for pid in FEM_HJUL:
        if "fem" not in M[pid]["hjul"]:
            fel.append(f"{pid} står i FEM_HJUL men hjul-fältet säger {M[pid]['hjul']!r}")
    for pid in set(ALLA) - FEM_HJUL:
        if "fem" in M[pid]["hjul"]:
            fel.append(f"{pid} säger fem hjul men står inte i FEM_HJUL")
    # 8. En utfällbar skiva kräver ett andra skivmått.
    for pid in UTFALLBAR:
        if not (M[pid].get("skiva_ned") or M[pid].get("skiva_klaff")):
            fel.append(f"{pid} står i UTFALLBAR men saknar mått på den fällda skivan")
    return fel


if __name__ == "__main__":
    f = kontroll()
    print(f"matt.py: {len(ALLA)} produkter, {len(f)} fel")
    for x in f:
        print("  ☠️", x)
