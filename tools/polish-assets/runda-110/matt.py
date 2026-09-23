# -*- coding: utf-8 -*-
"""Runda 110 — sex vikskärmar i TRE konstruktioner, alla mätta 2026-09-09.

☠️ TALEN ÄR LÄSTA, INTE HÄRLEDDA. Källorna är tre och de rangordnas som
runbooken säger: leverantörens `Technische Daten` i produktens tyska
brödtext, MÅTTRITNINGEN på bildplats 3, och en 1,3–1,5× zoom på varje
FÄRGAD DEL. Där de sagt olika har ritningen och zoomen fått avgöra.

☠️ TRE FEL I STEG 1:s TABELL, alla hittade av bilderna och den tyska texten:

  1. `c35f9d4f` stod som "brun". Den tyska raden säger `Farbe: Waschschwarz`
     medan den SVENSKA spec-raden i samma produkt säger `Färg: Bräune`.
     Två färger i samma produkt, båda leverantörens. Zoomen (4,1×) visar en
     mörkt GRÅBRUN väv. Bilden vinner — runbookens Steg 5, punkt 1.
  2. `316f9945` stod som "brun". Ramen är SVARTMÅLAD och det är det första
     kunden ser; väven är svart med gräddvita band och kopparbruna trådar.
     Leverantören skriver själv `Braun+Schwarz`.
  3. `316f9945` stod som självmotsägande på djupet (spec 1,9 cm, ritning
     7,6 och 5,5). Ingen motsägelse finns: 4 × 1,9 = 7,6 är det HOPFÄLLDA
     djupet och 5,5 cm är `Höhe der Füße`, alltså fothöjden. Rättat.

☠️ OCH DET STÖRSTA FYNDET: GRUPP A:s VÄV ÄR PLAST, INTE TRÄ.
   Leverantörens egen text, ordagrant: "Die Polypropylenkonstruktion sorgt
   für maximale Privatsphäre und ist stabiler als herkömmliche Papierfasern",
   "Rahmen aus Kiefernholz und Polypropylengeflecht", `Materialien:
   Polypropylen, Kiefernholz`. Det SVENSKA spec-blocket som importen byggde
   säger bara `Material: Kiefernholz` — det tog första materialet och tappade
   det som utgör hela den synliga ytan.

   ✅ Kontrollerat mot de åtta LIVE-sidorna i runda 108/109 (samma
   konstruktion, modellbas 830-814): de säger redan "polypropenväv på
   tallram" i namn, brödtext och spec. Ingen publicerad sida beskriver
   plasten som trä. Grupp A ärver därför deras ordval oförändrat.
"""

#  A = polypropenväv på tallram, BÅGFORMAD överkant   (bas 830-816V01)
#  B = bambuväv på tallram, rak överkant              (830-700V00ND, 830-311)
#  C = helt i bambu, rak överkant                     (bas 830-716)
GRUPPER = {"a999f2b1": "A", "c35f9d4f": "A",
           "d72bde5e": "B", "316f9945": "B",
           "f8fd1b62": "C", "309076e2": "C"}

#            paneler, bredd, djup, höjd, hopfällt djup, fothöjd, vikt,
#            paketmått, pris, wixProductId, wixVariantId, artnr, lager
RUNDAN = {
 "a999f2b1": (4, 180, "1,7", 180, "6,8", "6,5", "6,9 kg", "182 × 47 × 12 cm", 1199,
              "a999f2b1-2f1c-4942-9584-c73b2c206c14",
              "6043f648-1a42-42ab-b51f-6c37f3245e9d", "830-816V01WT", 11),
 "c35f9d4f": (4, 180, "1,7", 180, "6,8", "6,5", "7,25 kg", "182 × 47 × 12 cm", 1099,
              "c35f9d4f-5cb8-4f70-98d9-ae633d18941a",
              "e22ae19d-1f37-45d7-bb1b-ae74b438dd26", "830-816V01DR", 52),
 "d72bde5e": (4, 180, "1,7", 180, "6", None, "7,4 kg", "182 × 46 × 10,5 cm", 1179,
              "d72bde5e-0f44-4431-b8de-4ab8461d5710",
              "be13eeaf-aef1-44eb-964b-58e4c1a85d4e", "830-700V00ND", 42),
 "316f9945": (4, 180, "1,9", 180, "7,6", "5,5", "6 kg", "182 × 47 × 10 cm", 1179,
              "316f9945-54b5-4c39-94ff-16cb172ffe60",
              "11f53061-770b-4730-9762-7575a307c09a", "830-311", 52),
 "f8fd1b62": (4, 160, "1,8", 170, "8", "5", "7,6 kg", "173 × 42,5 × 10 cm", 1339,
              "f8fd1b62-9610-45dd-85f1-cbe0bed94387",
              "52c26059-7027-4bdd-8b04-bdc3d51d59aa", "830-716V01ND", 54),
 "309076e2": (3, 120, "1,8", 170, "6", "5", "5,4 kg", "173 × 42,5 × 8 cm", 1299,
              "309076e2-fdb5-418c-836b-0ac679f7fb7b",
              "9875f4df-d4f7-45b5-b320-466e7bf2f5a1", "830-716V00ND", 15),
}

# Panelbredden ur MÅTTRITNINGEN (plats 3), inte ur spec-blocket: A och B har
# 45 cm, C har 40 cm. Ritningen är ortografisk och därför pålitlig på geometri.
PANELBREDD = {"A": 45, "B": 45, "C": 40}

# ☠️ Uppmätt i 1,3–1,5× zoom, en lista per FÄRGAD DEL. Runbookens regel efter
# runda 89/90/91: en färg om en DEL av varan skrivs aldrig ur kontaktarket.
FARG_OK = {
 "a999f2b1": {"ram": ["vit", "vitmålad"],       "vav": ["vit", "gräddvit"]},
 "c35f9d4f": {"ram": ["gråbrun", "mörkt gråbrun"], "vav": ["gråbrun", "mörkt gråbrun"]},
 "d72bde5e": {"ram": ["ljust", "obehandlat", "naturfärgad"],
              "vav": ["gräddvit", "grå", "naturfärgad"]},
 "316f9945": {"ram": ["svart", "svartmålad"],
              "vav": ["svart", "gräddvit", "kopparbrun", "brun"]},
 "f8fd1b62": {"ram": ["naturfärgad", "varmt"],  "vav": ["naturfärgad", "varmt"]},
 "309076e2": {"ram": ["naturfärgad", "varmt"],  "vav": ["naturfärgad", "varmt"]},
}

# Leverantörens materiallistor, ordagrant ur `Technische Daten`.
MATERIAL_KALLA = {
 "a999f2b1": "Polypropylen, Kiefernholz",
 "c35f9d4f": "Polypropylen, Kiefernholz",
 "d72bde5e": "Kiefernholz, Bambus, Baumwollfaden",
 "316f9945": "Bambus, Kiefernholz",
 "f8fd1b62": "Bambus, Metall",
 "309076e2": "Bambus, Metall",
}

# Påståenden som leverantören gör och som INTE får upprepas (Steg 5, punkt 5).
EJ_UPPREPA = {
 "d72bde5e": ["störendes Licht oder Hintergrundgeräusche zu minimieren"],
 "f8fd1b62": ["störendes Licht oder Hintergrundgeräusche zu minimieren"],
 "309076e2": ["störendes Licht oder Hintergrundgeräusche zu minimieren"],
}


def kontroll():
    """Hänger talen ihop? Om inte gäller ritningen, inte formeln."""
    fel = []
    for nyckel, rad in RUNDAN.items():
        pan, bredd, djup, hojd, hopf, _fot, _v, _pm, _pris, _id, _vid, artnr, _lager = rad
        g = GRUPPER[nyckel]
        if bredd != PANELBREDD[g] * pan:
            fel.append(f"{nyckel}: bredd {bredd} != {PANELBREDD[g]} × {pan}")
        # Hopfällt djup ska vara panelantalet gånger paneltjockleken.
        vantat = round(pan * float(djup.replace(",", ".")), 2)
        fick = float(hopf.replace(",", "."))
        if abs(vantat - fick) > 1.0:
            fel.append(f"{nyckel}: hopfällt {hopf} mot {pan} × {djup} = {vantat}")
        # Grupp C:s artikelnummer kodar panelantalet: V00 = 3, V01 = 4.
        if g == "C":
            vantad = {3: "V00", 4: "V01"}[pan]
            if vantad not in artnr:
                fel.append(f"{nyckel}: artnr {artnr} bär inte {vantad} för {pan} paneler")
    # Grupp A är färgsyskon: samma bas, olika suffix.
    a = [RUNDAN[k][11] for k in RUNDAN if GRUPPER[k] == "A"]
    if len({x[:-2] for x in a}) != 1:
        fel.append(f"grupp A delar inte artikelnummerbas: {a}")
    return fel


if __name__ == "__main__":
    f = kontroll()
    print("kontroll:", "OK" if not f else f)
    for k, r in sorted(RUNDAN.items(), key=lambda x: (GRUPPER[x[0]], -x[1][1])):
        print(f"  {GRUPPER[k]}  {k}  {r[0]} paneler  {r[1]}×{r[2]}×{r[3]} cm  "
              f"{r[8]:>5} kr  {r[11]:<13} lager {r[12]:>3}")
