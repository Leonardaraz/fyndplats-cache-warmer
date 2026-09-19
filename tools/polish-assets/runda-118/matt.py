# -*- coding: utf-8 -*-
"""Runda 118 — ENDA sanningskällan för siffror, färger och funktioner.

Runda 117 mätte upp varför den här filen finns: ett spec-VÄRDE som återanvänds
i tre roller (spec-rad, punktlista, FAQ-svar) blir grammatiskt fel i minst två
av dem, och ingen grind kan se det. Varje fält här har därför EN roll, och
`kontroll()` fäller på det som gick fel förra gången.

Källor, i den ordning de får väga:
  1. `Technische Daten` och `Lieferumfang` i leverantörens tyska text
  2. produktbilderna (måttritningen på plats 3, detaljfoton 4 och 5)
  3. `Beschreibung`-blocket — marknadsföring, misstros när det motsäger 1,
     men är det ENDA stället där en FUNKTION kan stå (820d076b:s hopfällning)

Priserna står här bara som facit mot prisgrinden. De rörs ALDRIG.
"""

# ---------------------------------------------------------------- grupper
# Ingen grupp delar yttermått med en annan, och ingen med en publicerad sida.
A = ["15d6fcef", "0fd65541"]      # färgsyskon: identiska på varje tal
ENSAMMA = ["764a3efc", "820d076b", "2e292a70", "a4ee97c1",
           "8a73caf4", "fcb86875", "ca20d60e"]
ALLA = ENSAMMA[:1] + [ENSAMMA[1]] + A + ENSAMMA[2:]

PRIS = {"764a3efc": 1, "820d076b": 1, "15d6fcef": 1, "0fd65541": 1,
        "2e292a70": 1, "a4ee97c1": 1, "8a73caf4": 1, "fcb86875": 1,
        "ca20d60e": 1}   # bara en nyckellista; talen läses ur Wix, inte härifrån

# ☠️ SLUTSÅLD hos Aosom sedan 2026-08-30 (saldo 0, elva dygn utan feedrad).
# Poleras färdigt men PUBLICERAS INTE — sidan skulle sälja noll.
HALLS_TILLBAKA = {"ca20d60e"}

# ---------------------------------------------------------------- mått
M = {
    "764a3efc": dict(
        bredd="39,5", djup="24", hojd="82",
        matt="39,5 × 24 × 82 cm",
        skiva="36,5 × 24 cm",
        fack="39,5 × 19,5 × 6,5 cm",
        antal_fack="fyra",
        maxlast="10 kg totalt, 2 kg per låda och 2 kg på skivan",
        maxlast_kort="10 kg totalt",
        vikt="4,6 kg",
        material="pulverlackad metall, plast och melaminbelagd spånskiva",
        material_kort="pulverlackad metall",
        farg="vit med skiva i ljus träeffekt",
        farg_kort="vit",
        hjul="fyra, varav två med broms",
        hjul_punkt="Fyra hjul, varav två med broms",
        hjul_svar="Två av de fyra hjulen har broms.",
        montering="krävs",
    ),
    "820d076b": dict(
        bredd="66", djup="40", hojd="70",
        matt="66 × 40 × 70 cm",
        skiva="54 × 33 cm",
        fack="54 × 33 cm",
        antal_fack="två",
        maxlast="12 kg totalt, 4 kg per bricka och 4 kg i flaskstället",
        maxlast_kort="12 kg totalt",
        vikt="5 kg",
        material="bambu",
        material_kort="bambu",
        farg="naturfärgad bambu",
        farg_kort="natur",
        hjul="fyra, varav två med broms",
        hjul_punkt="Fyra hjul, varav två med broms",
        hjul_svar="Två av de fyra hjulen har broms.",
        montering="krävs",
        flaskor="tre",
        undre_hojd="36,5",
        golvfrigang="14",
    ),
    "15d6fcef": dict(
        bredd="49,5", djup="31", hojd="91",
        matt="49,5 × 31 × 91 cm",
        skiva="43 × 31 cm",
        fack="34 × 30 × 10 cm",
        antal_fack="fyra",
        maxlast="22 kg totalt, 10 kg på skivan och 3 kg per korg",
        maxlast_kort="22 kg totalt",
        vikt="8,8 kg",
        material="pulverlackat stål och MDF",
        material_kort="pulverlackat stål",
        farg="svart stomme med skiva i ljus stenlook",
        farg_kort="ljusgrå",
        hjul="fyra, varav två med broms",
        hjul_punkt="Fyra hjul, varav två med broms",
        hjul_svar="Två av de fyra hjulen har broms.",
        montering="krävs",
        golvfrigang="8",
    ),
    "0fd65541": dict(
        bredd="49,5", djup="31", hojd="91",
        matt="49,5 × 31 × 91 cm",
        skiva="43 × 31 cm",
        fack="34 × 30 × 10 cm",
        antal_fack="fyra",
        maxlast="22 kg totalt, 10 kg på skivan och 3 kg per korg",
        maxlast_kort="22 kg totalt",
        vikt="8,8 kg",
        material="pulverlackat stål och MDF",
        material_kort="pulverlackat stål",
        farg="svart stomme med skiva i ekfärgad träeffekt",
        farg_kort="ek",
        hjul="fyra, varav två med broms",
        hjul_punkt="Fyra hjul, varav två med broms",
        hjul_svar="Två av de fyra hjulen har broms.",
        montering="krävs",
        golvfrigang="8",
    ),
    "2e292a70": dict(
        bredd="33", djup="33", hojd="77",
        matt="33 × 33 × 77 cm",
        skiva="29,7 × 29,7 cm",
        fack="28,8 × 28,3 × 14 cm",
        antal_fack="fyra",
        maxlast="13 kg totalt, 5 kg på översta hyllan och 2 kg per korg",
        maxlast_kort="13 kg totalt",
        vikt="6 kg",
        material="stål och plast",
        material_kort="stål",
        farg="svart",
        farg_kort="svart",
        hjul="fyra, varav två med broms",
        hjul_punkt="Fyra hjul, varav två med broms",
        hjul_svar="Två av de fyra hjulen har broms.",
        montering="behövs inte",
    ),
    "a4ee97c1": dict(
        bredd="61", djup="32,6", hojd="58,5",
        matt="61 × 32,6 × 58,5 cm",
        skiva="48 × 29,5 cm",
        fack="47 × 29 × 9 cm",
        antal_fack="en",
        maxlast="10,6 kg totalt, 3 kg per plan, 1 kg i korgen och 0,2 kg per krok",
        maxlast_kort="10,6 kg totalt",
        vikt="6,5 kg",
        material="stål och plast",
        material_kort="stål",
        farg="svart",
        farg_kort="svart",
        hjul="fyra, varav två med broms",
        hjul_punkt="Fyra hjul, varav två med broms",
        hjul_svar="Två av de fyra hjulen har broms.",
        montering="krävs",
        hylla="48 × 32,6 × 25 cm",
        korg="23 × 5,3 × 9,5 cm",
        krokar="tre",
    ),
    "8a73caf4": dict(
        bredd="97,5", djup="65", hojd="81",
        matt="97,5 × 65 × 81 cm",
        skiva="88 × 61 cm",
        fack="88 × 59 cm",
        antal_fack="två",
        maxlast="50 kg per hylla",
        maxlast_kort="50 kg per hylla",
        vikt="15 kg",
        material="lackad gran och stål",
        material_kort="lackad gran",
        farg="ljus gran med svart stomme och svart underhylla",
        farg_kort="natur och svart",
        hjul="två",
        hjul_punkt="Två hjul i ena änden och ett handtag i den andra",
        hjul_svar="Den har två hjul i ena änden och ett handtag i den andra, så den rullas som en skottkärra.",
        montering="krävs",
        korg="20 × 12,5 × 8 cm",
        korgar="två",
        flaskor="fyra",
    ),
    "fcb86875": dict(
        bredd="50", djup="50", hojd="66",
        matt="Ø 50 × 66 cm",
        skiva="Ø 45 cm",
        fack="Ø 50 cm",
        antal_fack="två",
        maxlast="30 kg totalt",
        maxlast_kort="30 kg totalt",
        vikt="6 kg",
        material="pulverlackat stål och konstrotting i PE",
        material_kort="konstrotting i PE",
        farg="ljus, naturfärgad konstrotting med svart stomme och svart bricka",
        farg_kort="natur och svart",
        hjul="fyra, varav två med broms",
        hjul_punkt="Fyra hjul, varav två med broms",
        hjul_svar="Två av de fyra hjulen har broms.",
        montering="krävs",
        ovre_kant="8",
        undre_kant="11",
        handtag="två",
    ),
    "ca20d60e": dict(
        bredd="107", djup="65", hojd="80",
        matt="107 × 65 × 80 cm",
        skiva="97 × 65 cm",
        fack="97 × 58,5 cm",
        antal_fack="två",
        maxlast="50 kg per plan",
        maxlast_kort="50 kg per plan",
        vikt="16,5 kg",
        material="lackad gran och stål",
        material_kort="lackad gran",
        farg="ljus gran med svart stomme",
        farg_kort="natur och svart",
        hjul="två",
        hjul_punkt="Två hjul i ena änden och ett handtag i den andra",
        hjul_svar="Den har två hjul i ena änden och ett handtag i den andra, så den rullas som en skottkärra.",
        montering="krävs",
        krokar="tre",
        ovre_hojd="80",
        undre_hojd="17",
    ),
}

# ☠️ FÄRGADE DELAR, per uppmätt zoom. Runda 89-91 skrev fel färg tre rundor i
# rad för att de lästes ur en 320-pixels miniatyr. Varje lista här är UPPMÄTT
# i minst 2x förstoring, och grinden fäller om texten sätter ett annat färgord
# framför den delen.
DEL_OK = {
    "764a3efc": {"låda": ["vit", "vita"], "skiva": ["ljus", "träeffekt"],
                 "handtag": ["mässingsfärgad", "mässingsfärgade"]},
    "820d076b": {"ram": ["natur", "naturfärgad", "bambu"]},
    "15d6fcef": {"korg": ["svart", "svarta"], "skiva": ["ljus", "stenlook", "grå"],
                 "ram": ["svart", "svarta"]},
    "0fd65541": {"korg": ["svart", "svarta"], "skiva": ["ekfärgad", "ek", "träeffekt"],
                 "ram": ["svart", "svarta"]},
    "2e292a70": {"korg": ["svart", "svarta"], "ram": ["svart", "svarta"]},
    "a4ee97c1": {"ram": ["svart", "svarta"], "låda": ["svart", "svarta"]},
    "8a73caf4": {"ram": ["svart", "svarta"], "skiva": ["ljus", "gran", "naturfärgad"],
                 "korg": ["svart", "svarta"]},
    "fcb86875": {"ram": ["svart", "svarta"], "bricka": ["svart", "svarta"],
                 "rotting": ["ljus", "naturfärgad", "natur"]},
    "ca20d60e": {"ram": ["svart", "svarta"], "skiva": ["ljus", "gran", "naturfärgad"],
                 "krok": ["svart", "svarta"]},
}

# Härledda tal — allt som INTE står ordagrant i leverantörsdatan och därför
# måste kunna spåras till en uträkning eller en bild.
HARLEDDA = {
    "8a73caf4 och ca20d60e har hjul bara i ena änden":
        "uppmätt i bild 1 på båda: två hjul, två fasta ben, handtag i andra änden",
    "820d076b är hopfällbar":
        "Beschreibung ordagrant: 'Zusammenfaltbar, wenn nicht in Gebrauch'; "
        "paketet är 9,2 cm tjockt",
    "2e292a70:s korgar vrids":
        "titeln säger 'drehbar' och bild 2 visar korgarna vridna åt olika håll",
    "fcb86875 är naturfärgad, inte gul":
        "leverantören anger 'Gelb' men bild 1, 2 och 5 visar ljus, halmfärgad "
        "PE-rotting; färgnamnet är leverantörens, inte kundens",
    "764a3efc:s lådbottnar är perforerade":
        "Beschreibung: 'Hohle Schubladenböden ermöglichen Luftzirkulation'",
}


def kontroll():
    """Fäller på precis det som gick fel i runda 117, plus rundans egna risker."""
    fel = []
    for pid in ALLA:
        if pid not in M:
            fel.append(f"{pid}: saknas i M")
            continue
        d = M[pid]
        # 1. Färgen måste finnas i båda formerna, och den korta får inte vara
        #    den långa med ett bortklippt ord.
        if not d.get("farg") or not d.get("farg_kort"):
            fel.append(f"{pid}: färg saknas")
        # 2. En HÖJD som innehåller × är ett mått som hamnat i fel fält.
        if "×" in d["hojd"]:
            fel.append(f"{pid}: hojd bär ett helt mått ({d['hojd']})")
        # 3. ☠️ Runda 117: `hjul` användes i tre roller. Punkten måste börja
        #    med versal och svaret måste sluta med punkt — annars är de inte
        #    skrivna som de fält de är.
        if not d["hjul_punkt"][:1].isupper():
            fel.append(f"{pid}: hjul_punkt börjar inte med versal")
        if not d["hjul_svar"].endswith("."):
            fel.append(f"{pid}: hjul_svar saknar avslutande punkt")
        if d["hjul"][:1].isupper():
            fel.append(f"{pid}: hjul (spec-värde) ska vara gemen")
        # 4. maxlast_kort får inte bära en UPPRÄKNING — den klistras in mitt i
        #    en mening och en lista spräcker satsen (runda 117).
        #    ☠️ Regeln får INTE vara "inget komma": `10,6 kg` är ett DECIMALKOMMA
        #    och grinden fällde på det första gången den kördes. Det som skiljer
        #    en uppräkning från ett decimaltal är blanksteget efter kommat.
        if ", " in d["maxlast_kort"]:
            fel.append(f"{pid}: maxlast_kort bär en uppräkning ({d['maxlast_kort']})")
        # 5. Varje färgad del måste ha en uppmätt lista.
        if pid not in DEL_OK:
            fel.append(f"{pid}: saknar DEL_OK")

    # 6. Två grupper får aldrig dela yttermått — då är de dubbletter, inte
    #    syskon, och rundan bygger in kannibalism.
    sedda = {}
    for pid in ALLA:
        nyckel = (M[pid]["bredd"], M[pid]["djup"], M[pid]["hojd"])
        if nyckel in sedda and not (pid in A and sedda[nyckel] in A):
            fel.append(f"{pid} delar yttermått med {sedda[nyckel]} utan att vara färgsyskon")
        sedda[nyckel] = pid

    # 7. Färgsyskonen MÅSTE dela varje tal utom färgen — annars är de inte syskon.
    a, b = A
    for f in ("matt", "skiva", "fack", "maxlast", "vikt", "material"):
        if M[a][f] != M[b][f]:
            fel.append(f"färgsyskonen skiljer på {f}: {M[a][f]} mot {M[b][f]}")
    if M[a]["farg"] == M[b]["farg"]:
        fel.append("färgsyskonen har SAMMA färg — då är de dubbletter")
    return fel


if __name__ == "__main__":
    f = kontroll()
    print(f"matt-kontroll: {len(ALLA)} produkter, {len(f)} fel")
    for x in f:
        print("  ✗", x)
