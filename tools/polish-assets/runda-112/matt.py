# -*- coding: utf-8 -*-
"""Runda 112 — projektordukar. Nio utkast, FEM konstruktioner, noll publicerade.

☠️ FAMILJEN VALDES PÅ EN MÄTNING, inte på storlek. Katalogens största orörda
   block är barnfordonen (~100 utkast) — men de har 96 PUBLICERADE syskon, och
   det som ligger kvar sitter rakt ovanpå dem: tre 6V-elmotorcyklar mot tre
   publicerade, en 24V-gokart mot en publicerad 24V-gokart, tre trampgokarter
   mot tre publicerade. Projektordukarna har **noll** publicerade sidor.

☠️ OCH DET FÖRSTA KROCKSVEPET LJÖG. Det matchade TYSKA ord mot SVENSKA slugs
   och rapporterade tio träffar; samma svep med svenska ord gav **96**. Ett
   svep som läser fel fält svarar inte fel — det svarar TOMT, och ett tomt
   svar från rätt API mot rätt katalog ser i koden likadant ut som ett friskt.
   Kontrollmätningen är därför inbyggd: svepet MÅSTE hitta en sida vi vet
   finns (`elgokart-barn-vit`), annars betyder "noll krockar" ingenting.

☠️ DUBBLETTGRINDEN MELLAN UTKASTEN: tre produkter påstår 84 tum 4:3 kring
   171 × 130 cm och ser i varje id-baserad kontroll ut som samma vara.

     id                     duk        hölje              vikt   paket
     ddca577d          171 × 128   181 × 8 × 138          7,5   192 × 14 × 14
     0370673c/fe11166f 171 × 131   180 cm, max 2,03 m     7,8   193 × 19 × 11
     623b6504/77e4a558 171 × 130   191 cm                 7,4   199 × 13 × 14

   Alla fyra talen skiljer på alla tre, och konstruktionen likaså (manuell
   väggduk · golvstativ · motoriserad). Tre produkter, inte en.
"""

WIX = {
    "1b87909f": "1b87909f-5e53-4ec8-8218-27ecaae9f5b4",
    "422ab1bd": "422ab1bd-fb44-4856-8c7e-e4562ae8f97e",
    "a8c82049": "a8c82049-04b2-47a8-87a0-35174c553654",
    "ddca577d": "ddca577d-d0c0-4112-87d8-31fa9a2530a1",
    "77d2b35c": "77d2b35c-46d2-45e5-8ef4-a5504a2d6ad5",
    "0370673c": "0370673c-1d60-492c-b88c-83fc2ac1a85e",
    "fe11166f": "fe11166f-b0a6-471e-a39c-65a259eba09b",
    "623b6504": "623b6504-c197-46a3-86e6-539ba411cf9a",
    "77e4a558": "77e4a558-8007-4a0e-8d6b-3306126f41b2",
}

# Konstruktion, inte storlek. Fem grupper på nio produkter.
GRUPPER = {
    "1b87909f": "A",   # stativduk på golv, 16:9, portabel
    "422ab1bd": "B", "a8c82049": "B",   # motoriserad kassett, 1:1
    "ddca577d": "C", "77d2b35c": "C",   # manuell rullduk med autolås
    "0370673c": "D", "fe11166f": "D",   # golvstativ som dras UPP, 4:3
    "623b6504": "E", "77e4a558": "E",   # motoriserad kassett, 4:3
}
KONSTRUKTION = {
    "A": "stativduk", "B": "motoriserad", "C": "manuell",
    "D": "golvstativ", "E": "motoriserad",
}

# nyckel -> (tum, format, dukB, dukH, vikt, paket(L,B,H), pris)
#
# ☠️ `dukB × dukH` är BILDYTAN, inte ytterhöljet. Importens svenska spec-block
#    blandar de två: fyra rader bär dukmåttet och `ddca577d` bär yttermåttet
#    (181 × 8 × 138). En kund som jämför två av våra sidor jämför då olika
#    saker. Poleringen skriver BÅDA, med etiketter som säger vilket är vilket.
RUNDAN = {
    "1b87909f": (120, "16:9", 263, 148, 4.0,  (86, 15, 13),   899),
    "422ab1bd": (92,  "1:1",  165, 165, 8.5,  (198, 14, 14), 1269),
    "a8c82049": (85,  "1:1",  152, 152, 8.0,  (187, 15, 13), 1279),
    "ddca577d": (84,  "4:3",  171, 128, 7.5,  (192, 14, 14), 1079),
    "77d2b35c": (99,  "1:1",  178, 178, 8.0,  (199, 14.5, 13.5), 1159),
    "0370673c": (84,  "4:3",  171, 131, 7.8,  (193, 19, 11), 1099),
    "fe11166f": (84,  "4:3",  171, 131, 7.8,  (193, 19, 11), 1069),
    "623b6504": (84,  "4:3",  171, 130, 7.4,  (199, 13, 14), 1139),
    "77e4a558": (84,  "4:3",  171, 130, 7.4,  (199, 13, 14), 1359),
}

# Yttermått. Formen skiljer per konstruktion, så fältet är en TEXT och inte
# en tupel — ett golvstativ har ingen "djup"-siffra på samma sätt som en
# kassett, och att tvinga in dem i samma form hade krävt en påhittad siffra.
YTTRE = {
    "1b87909f": "309 × 62 × 217 cm uppställd",
    "422ab1bd": "189,5 × 8 × 189,5 cm, kassett 189,5 × 8 × 10 cm",
    "a8c82049": "176,5 × 8 × 176,5 cm, kassett 176,5 × 8 × 10 cm",
    "ddca577d": "181 × 8 × 138 cm, kassett 181 × 8 × 10 cm",
    "77d2b35c": "189 × 7 × 182 cm",
    "0370673c": "hölje 180 cm, upp till 2,03 m totalhöjd",
    "fe11166f": "hölje 180 cm, upp till 2,03 m totalhöjd",
    "623b6504": "hölje 191 cm",
    "77e4a558": "hölje 191 cm",
}

# ☠️ SYNLIG BILDYTA — MÄTT PÅ LEVERANTÖRENS EGEN RITNING, inte på spec-blocket.
#
#    Tumtalet räknas på DUKEN, och duken är större än bilden. Ritningen (bild 3
#    i varje galleri) skriver ut den synliga ytan, och den är mindre:
#
#      id          spec-duk    ritningens bildyta   tum på duken   tum på bilden
#      422ab1bd    165 × 165        162 × 162            91,9           90,2
#      a8c82049    152 × 152        149 × 149            84,6           82,9
#      ddca577d    171 × 128        165 × 124            84,1           81,3
#      77d2b35c    178 × 178        172 × 172            99,1           95,8
#      0370673c    171 × 131        165 × 125            84,8           81,5
#      623b6504    171 × 130        171 × 130            84,6           84,6   ← samma
#      1b87909f    263 × 148        263 × 148           118,8          118,8   ← samma
#
#    Mellanskillnaden är den svarta maskeringskanten. Det är BRANSCHKUTYM att
#    räkna tummen på duken — men en kund som mäter sin vägg mäter bilden, och
#    två av nio produkter råkar dessutom ha samma tal i båda kolumnerna. Sidan
#    skriver därför BÅDA, med etiketter som säger vilket som är vilket:
#
#        Dukstorlek:      171 × 128 cm (84 tum)
#        Synlig bildyta:  165 × 124 cm
#
#    Att bara skriva det ena är inte fel — men det är att välja vilket tal
#    kunden får jämföra med, och då ska det vara det som gäller väggen.
BILDYTA = {
    "1b87909f": (263, 148),
    "422ab1bd": (162, 162), "a8c82049": (149, 149),
    "ddca577d": (165, 124), "77d2b35c": (172, 172),
    "0370673c": (165, 125), "fe11166f": (165, 125),
    "623b6504": (171, 130), "77e4a558": (171, 130),
}

# ☠️ `1b87909f` HETER 100 TUM OCH ÄR 120. Tre oberoende källor säger 120:
#    brödtexten (tre gånger), geometrin (263 × 148 → 118,8 tum) och
#    leverantörens egen måttritning, som skriver ut `120"` i klartext
#    tillsammans med 309 cm ram, 217 cm höjd och 62 cm stativdjup.
#    Namnet är den enda avvikande rösten. Det rättas i Steg 7.
NAMNFEL = {"1b87909f": ("100 tum i namnet", 120)}

# A:s ram är 309 × 62 × 217 cm uppställd; ramöppningen är 275 × 159 cm och
# bildytan 263 × 148. Tre olika tal för tre olika saker, alla på ritningen.
RAMOPPNING = {"1b87909f": (275, 159)}

FARG = {
    "1b87909f": "vit duk, svart ram",
    "422ab1bd": "vit", "a8c82049": "vit",
    "ddca577d": "svart", "77d2b35c": "svart",
    "0370673c": "svart", "fe11166f": "vit",
    "623b6504": "svart", "77e4a558": "vit",
}

MATERIAL = {
    "1b87909f": ["polyester", "aluminium"],
    "422ab1bd": ["plast", "metall"], "a8c82049": ["plast", "metall"],
    "ddca577d": ["plast", "metall"], "77d2b35c": ["plast", "metall"],
    "0370673c": ["väv", "metall"],  "fe11166f": ["väv", "metall"],
    # ☠️ E-gruppens TYSKA text säger `Netzstoff` — nätväv — medan importens
    #    svenska spec-block bara säger `Kunststoff/Metall`. Spec-blocket tappade
    #    dukens material. Samma klass som runda 110/111, där väven var polypropen
    #    och spec-blocket bara sa trä.
    "623b6504": ["nätväv", "metall"], "77e4a558": ["nätväv", "metall"],
}

# Svart maskeringskant runt bilden, cm. Saknas på golvstativen (ej angiven).
SVARTKANT = {"1b87909f": 5, "422ab1bd": 3, "a8c82049": 3,
             "ddca577d": 3, "77d2b35c": 3, "623b6504": 3, "77e4a558": 3}

# Nätansluten drift. ☠️ Bara B och E — de är 230 V-apparater, inte tyg.
NAT = {"422ab1bd": (230, 50, 25, 15), "a8c82049": (230, 50, 25, 15),
       "623b6504": (230, 50, 25, 15), "77e4a558": (230, 50, 25, 15)}

UNIKT = {
    "1b87909f": "dubbelt aluminiumstativ, 8 markankare och 2 stormlinor ingår",
    "422ab1bd": "kabel 2,1 m, fjärrkontroll med 23A-batteri ingår",
    "a8c82049": "kabel 2,1 m, fjärrkontroll med 23A-batteri ingår",
    "ddca577d": "autolås i valfri höjd",
    "77d2b35c": "autolås i valfri höjd",
    "0370673c": "dras upp ur golvhöljet, ingen montering",
    "fe11166f": "dras upp ur golvhöljet, ingen montering",
    "623b6504": "fjärrkontroll på upp till 30 meter",
    "77e4a558": "fjärrkontroll på upp till 30 meter",
}


def diagonal_tum(b, h):
    """Bilddiagonalen i tum, räknad ur duken. 1 tum = 2,54 cm."""
    return ((b ** 2 + h ** 2) ** 0.5) / 2.54


def kontroll():
    """☠️ MEKANISK GRIND PÅ MÄTNINGEN SJÄLV.

    Den viktigaste raden är diagonalen: `1b87909f` HETER `100 Zoll` medan
    brödtexten säger 120 tum tre gånger. Geometrin avgör — 263 × 148 cm ger
    118,8 tum, alltså 120. Namnet är fel, inte texten.
    """
    fel = []
    for k, v in RUNDAN.items():
        tum, form, b, h, vikt, paket, pris = v
        # 1. Diagonalen måste stämma med det påstådda tumtalet (±3 %).
        d = diagonal_tum(b, h)
        if abs(d - tum) / tum > 0.03:
            fel.append(f"{k}: duken {b}×{h} ger {d:.1f} tum, inte {tum}")
        # 2. Formatet måste stämma med kvoten (±3 %).
        tal, nam = form.split(":")
        kvot = float(tal) / float(nam)
        if abs((b / h) - kvot) / kvot > 0.03:
            fel.append(f"{k}: {b}×{h} är {b / h:.2f}, inte {form}")
        # 3. Duken måste rymmas i paketet på längden — MEN BARA om den RULLAS.
        #
        # ☠️ GRINDEN FÄLLDE `1b87909f` PÅ SIN EGEN PREMISS. En rullduk måste ha
        #    ett paket minst lika långt som duken är bred; A:s duk är 263 cm och
        #    paketet 86 cm, alltså omöjligt — om den rullas. Den gör den inte:
        #    leverantörens text säger `knitterfreie Polyesteroberfläche`,
        #    `waschbarer Stoff` och `zusammenklappbare Stativbeine`. Det är en
        #    VIKBAR tygduk med hopfällbara stativben, och då är 86 cm rimligt.
        #
        #    Undantaget är alltså inte ett hål i grinden utan en annan geometri,
        #    och det ska BEVISAS på bilderna i Steg 4 — inte antas här. Fram till
        #    dess är `VIKBAR` en hypotes med en mätning emot sig.
        if KONSTRUKTION[GRUPPER[k]] != "stativduk" and max(b, h) > paket[0] + 12:
            fel.append(f"{k}: rullduk {max(b, h)} cm ryms inte i paket {paket[0]} cm")
        if KONSTRUKTION[GRUPPER[k]] == "stativduk" and max(b, h) <= paket[0] + 12:
            fel.append(f"{k}: stativduk men paketet {paket[0]} cm rymmer en RULLE — "
                       f"kontrollera om den ändå är en rullduk")
        # 4. Nätdrift bara där konstruktionen är motoriserad.
        motor = KONSTRUKTION[GRUPPER[k]] == "motoriserad"
        if motor != (k in NAT):
            fel.append(f"{k}: motoriserad={motor} men nätdrift={k in NAT}")
    # 5. Bildytan får ALDRIG vara större än duken, och tumtalet ska ligga
    #    mellan de två diagonalerna (eller på dem). Fångar en förväxling av
    #    de två talen — vilket är exakt det spec-blocket redan gjort en gång.
    for k, (bb, bh) in BILDYTA.items():
        db, dh = RUNDAN[k][2], RUNDAN[k][3]
        if bb > db or bh > dh:
            fel.append(f"{k}: bildyta {bb}×{bh} större än duken {db}×{dh}")
        # ⚠️ TOLERANSEN ÄR 3 %, INTE NOLL. Tillverkaren avrundar till ett
        #    marknadsför-tumtal: 118,8 säljs som 120 och 84,6 som 84. En grind
        #    utan tolerans fäller alltså varje korrekt rad i familjen — den
        #    mäter tillverkarens avrundning, inte ett fel. Samma tolerans som
        #    regel 1, så de två inte kan glida isär.
        d_duk, d_bild = diagonal_tum(db, dh), diagonal_tum(bb, bh)
        if not (d_bild * 0.97 <= RUNDAN[k][0] <= d_duk * 1.03):
            fel.append(f"{k}: {RUNDAN[k][0]} tum ligger utanför "
                       f"{d_bild * 0.97:.1f}–{d_duk * 1.03:.1f}")

    # 6. Färgpar måste dela ALLA mått — annars är de inte färgsyskon.
    for a, b_ in (("0370673c", "fe11166f"), ("623b6504", "77e4a558")):
        if RUNDAN[a][:6] != RUNDAN[b_][:6]:
            fel.append(f"{a}/{b_}: påstådda färgsyskon men måtten skiljer")
        if FARG[a] == FARG[b_]:
            fel.append(f"{a}/{b_}: färgsyskon med SAMMA färg")
    return fel


if __name__ == "__main__":
    for k in RUNDAN:
        tum, form, b, h, vikt, paket, pris = RUNDAN[k]
        print(f"{k}  {GRUPPER[k]} {KONSTRUKTION[GRUPPER[k]]:<12} "
              f"{tum:>3} tum {form:<4} duk {b}×{h}  "
              f"diagonal {diagonal_tum(b, h):5.1f} tum  {vikt} kg  {pris} kr  {FARG[k]}")
    f = kontroll()
    print(f"\nkontroll: {len(f)} fel")
    for x in f:
        print("  ✗", x)
