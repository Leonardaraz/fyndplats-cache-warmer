# -*- coding: utf-8 -*-
"""Runda 136 — FACIT. Varje tal som får stå i kundtexten, och bara de.

Källa: leverantörens `Technische Daten`, läst i sin helhet (Steg 3).

☠️ `Vikt` ur det svenska spec-blocket är FRAKTVIKTEN (uppgift #488) och står
   därför INTE här. `ae1c848f` visar varför: 12,8 kg i viktfältet mot
   `Maximale Gewichtskapazität: 15 kg` i tyskan — två helt olika saker som
   båda ser ut som "vikt".

☠️ TVÅ RUTOR ÄR MEDVETET TOMMA, och de får inte fyllas.
   `4a5acc7d` anger varken maxlast eller kattvikt någonstans i källan.
   `860b6eb9` anger kattvikt men INGEN totallast, samtidigt som prosan
   marknadsför den för tre katter. Ett härlett tal är ett påhittat tal
   (Steg 2-grinden, fynd 2 och 3).

☠️ `860b6eb9` ÄR EN KLÖSTUNNA. Leverantörens namn säger "Katzenturm", men
   källan säger `Katzentonnen-Größe: Ø36 x 101H`, `Kratztonne` och
   `1 x Katzenfass`. `Gesamtabmessungen` är SOCKELN, inte tunnan.
   Uppgift #462: leverantörens produktnamn är ingen källa.

☠️ `4a5acc7d` BÄR ETT SYSKONS SPEC-RAD — "die oberste Liegefläche … der
   Katzentonne" — fast varje eget mått är fyrkantigt (41 × 41, 39,5 × 39,5,
   18 × 18). Ordet "tunna" får inte följa med in i svenskan. Klass #366.

☠️ SJÄLVTESTET BEVISAR ATT KODEN FÖLJER FACIT, ALDRIG ATT FACIT ÄR SANT
   (uppgift #505).
"""

FACIT = {
    # ── KLÖSTUNNA på bred sockel — INTE ett klösträd ──────────────────────
    "860b6eb9": dict(
        matt="50 × 36 × 101 cm", hojd=101,
        bas="50 × 36 cm",
        tunna="Ø36 cm, 101 cm hög",
        badd_inre="Ø35 cm, 6 cm djup",
        plan_inre="Ø35 cm, 29 cm hög",
        oppning="17 × 16 cm",
        hoppyta="35 × 24 cm",
        stam="Ø7 cm utvändigt, Ø4,5 cm invändigt",
        sisalrep="4 mm",
        material="spånskiva, mattextil, plysch och sisal",
        farg="grått och vitt mot gräddvit sisal",
        montering="krävs",
        kattvikt="upp till 6 kg",
        maxlast=None,                # ☠️ anges INTE av leverantören
        antal_katter=None,           # ☠️ prosan säger tre, utan att belägga last
        tal={50, 36, 101, 35, 6, 29, 17, 16, 24, 7, 4.5, 4},
    ),

    # ── KLÖSTRÄD ──────────────────────────────────────────────────────────
    # ☠️ Varken maxlast eller kattvikt finns i källan. Båda rutorna tomma.
    "4a5acc7d": dict(
        matt="41 × 41 × 100 cm", hojd=100,
        bas="41 × 41 cm",
        inre_skikt="39,5 × 39,5 cm, 29 cm högt",
        oppning="18 × 18 cm",
        badd="39,5 × 39,5 cm, 4 cm hög",
        bollar="tre hängande",
        material="spånskiva, mattextil och plysch (polyester)",
        farg="grått mot vitt",
        montering="krävs",
        kattvikt=None, maxlast=None, antal_katter=None,
        tal={41, 100, 39.5, 29, 18, 4, 3},
    ),
    "05136778": dict(
        matt="48 × 48 × 160 cm", hojd=160,
        bas="48 × 48 cm",
        badd="Ø30 cm, 10 cm hög",
        hala_nedre="30 × 30 cm, 29 cm hög",
        hala_ovre="45 × 30 cm, 29 cm hög",
        hangmatta="Ø30 cm",
        stege="43 × 18 cm",
        material="spånskiva, plysch (polyester) och sisal",
        farg="ljusgrå plysch mot gräddvitt",
        montering="krävs",
        kattvikt="under 5 kg", maxlast=15, antal_katter="1–3",
        tal={48, 160, 30, 10, 29, 45, 43, 18, 15, 5},
    ),
    "105c685a": dict(
        matt="48 × 44 × 139 cm", hojd=139,
        bas="48 × 44 cm",
        hala="Ø30 cm, 27,5 cm hög",
        oppning="19 × 22 cm",
        plattform="24 × 44 cm och 48 × 30 cm",
        stam="Ø7 cm",
        blad="30 × 14 cm och 24 × 12 cm",
        stege="40 × 15 cm",
        klosmatta="Ø30 cm",
        material="spånskiva, jute, sisal och polyester",
        farg="grönt mot brunt",
        montering="krävs",
        kattvikt="upp till 5 kg", maxlast=10, antal_katter="1–2",
        tal={48, 44, 139, 30, 27.5, 19, 22, 24, 7, 14, 12, 40, 15, 10, 5},
    ),
    # ☠️ `Schilfrohr` är VASS (Phragmites), inte kaveldun och inte rotting.
    "7f8e495b": dict(
        matt="60 × 40 × 79 cm", hojd=79,
        bas="60 × 40 cm",
        badd_ovre="Ø34 cm, 10 cm hög — Ø33 cm invändigt, 9 cm djup",
        badd_undre="Ø35 cm, 9 cm hög — Ø25 cm invändigt, 8 cm djup",
        katthus="Ø40 cm, 30 cm högt",
        oppning="Ø20 cm",
        dyna="Ø32 cm",
        plattform="40 × 24 cm",
        stam="Ø7 cm",
        material="spånskiva, flätad vass, sisal, plast och polyester",
        farg="gräddvit",
        montering="krävs",
        kattvikt="upp till 5 kg", maxlast=10, antal_katter="1–2",
        tal={60, 40, 79, 34, 10, 33, 9, 35, 25, 8, 30, 20, 32, 24, 7},
    ),
    # ⚠️ Källans "Katzenhöhle: 17,5L x 17H" är husets INGÅNG, inte ett andra
    #    utrymme — 17,5 × 17 cm rymmer ingen katt (Steg 2-grinden, fynd 7).
    # ⚠️ Materialraden säger "30% Nitril", vilket är ett gummi och inte en
    #    textilfiber. Skrivs som polyesterblandning (fynd 6).
    "ae1c848f": dict(
        matt="70 × 49 × 79 cm", hojd=79,
        bas="70 × 49 cm",
        katthus="Ø36 cm, 24 cm högt",
        oppning="17,5 × 17 cm",
        badd="60 × 40 cm, 9,5 cm hög",
        badd_inre="58,5 × 37 cm, 8 cm djup",
        stam="Ø9,1 cm",
        material="spånskiva, jute, linne och polyesterblandning",
        farg="brunt mot vitt",
        montering="krävs",
        kattvikt="upp till 8 kg", maxlast=15, antal_katter=None,
        tal={70, 49, 79, 36, 24, 17.5, 17, 60, 40, 9.5, 58.5, 37, 8, 9.1, 15},
    ),
    "f8528666": dict(
        matt="60 × 40 × 98 cm", hojd=98,
        bas="60 × 40 cm",
        hala="46 × 33,5 cm, 24,5 cm hög",
        oppning="20 × 20 cm",
        badd="34 × 34 cm, 12 cm hög",
        plattform="30 × 20 cm",
        rund_plattform="Ø30 cm",
        ramp="30 × 20 cm",
        material="spånskiva, sisalrep, vattenhyacint och plysch (polyester)",
        farg="brunt mot beige",
        montering="krävs",
        kattvikt="under 6 kg", maxlast=20, maxlast_plan=10, antal_katter=None,
        tal={60, 40, 98, 46, 33.5, 24.5, 20, 34, 12, 30, 10, 6},
    ),
    "63a586da": dict(
        matt="60 × 40 × 104 cm", hojd=104,
        bas="60 × 40 cm",
        badd="51 × 33 cm, 7 cm hög",
        badd_inre="47 × 29 cm, 5 cm djup",
        plattform="31 × 29 cm",
        tunnel="Ø32 cm, 40 cm lång — Ø29 cm invändigt",
        stam="Ø7,1 cm",
        material="spånskiva, sisal, plysch och linneimitation i polyester",
        farg="grått och beige mot gräddvitt",
        montering="krävs",
        kattvikt="under 5 kg", maxlast=5, antal_katter="en",
        tal={60, 40, 104, 51, 33, 7, 47, 29, 5, 31, 32, 7.1},
    ),
}

WIX = {
    "4a5acc7d": "4a5acc7d-a746-45e3-8917-42747aab2cc8",
    "860b6eb9": "860b6eb9-1d25-4a73-8130-09fc52fb8c78",
    "05136778": "05136778-592b-4926-832e-480c0ed586a9",
    "105c685a": "105c685a-358c-47ab-aab1-7903fbdf517b",
    "7f8e495b": "7f8e495b-5812-4aa9-8255-dfe8d00fa9ec",
    "ae1c848f": "ae1c848f-2718-4b73-ada3-4a475c83e487",
    "f8528666": "f8528666-fdd9-4a54-9d21-46ac5d997e5e",
    "63a586da": "63a586da-7aa8-4208-94aa-6e711dab17d7",
}

# (rätt produkttyp, den som INTE får förekomma)
TYP = {
    "860b6eb9": ("klöstunna", "klösträd"),    # ☠️ tvärtom mot de sju andra
    "4a5acc7d": ("klösträd", "klöstunna"),
    "05136778": ("klösträd", "klöstunna"),
    "105c685a": ("klösträd", "klöstunna"),
    "7f8e495b": ("klösträd", "klöstunna"),
    "ae1c848f": ("klösträd", "klöstunna"),
    "f8528666": ("klösträd", "klöstunna"),
    "63a586da": ("klösträd", "klöstunna"),
}

# Priset RÖRS ALDRIG — det står här bara som facit för Steg 4:s prisgrind.
PRIS = {"4a5acc7d": 969, "860b6eb9": 1059, "05136778": 969, "105c685a": 829}
