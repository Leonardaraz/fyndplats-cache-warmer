# -*- coding: utf-8 -*-
"""Runda 134 — FACIT. Varje tal som får stå i kundtexten, och bara de.

Källa: leverantörens `Technische Daten` + måttritningen, lästa i full
upplösning (Steg 4). ☠️ `Vikt` ur spec-tabellen är FRAKTVIKTEN (uppgift #488)
och står därför INTE här — varans egen vikt är okänd för alla sex.

☠️ SJÄLVTESTET BEVISAR ATT KODEN FÖLJER FACIT, ALDRIG ATT FACIT ÄR SANT
   (uppgift #505). Runda 133 låste ett FEL öppningsantal och var grönt hela
   rundan. Talen här är därför avlästa ur ritningen, inte ur produktnamnet.
"""

FACIT = {
    "f6857ca0": dict(
        matt="41 × 38 × 43 cm", hojd=43,
        inre="Ø35 cm, 40 cm djupt", dyna="37 × 27 cm",
        oppningar=1, oppning="hela framsidan, Ø35 cm",
        material="furu, sjögräsrep och flanellmjuk polyester",
        farg="khakifärgat sjögräs mot gräddvit plysch, vagga i furu",
        montering="krävs", kattvikt="under 5 kg", maxlast=None,
        tal={41, 38, 43, 35, 40, 37, 27, 5},
    ),
    "09336fdf": dict(
        matt="Ø40 × 50 cm", hojd=50,
        inre="22 cm per plan", dyna="Ø38 cm, 6 cm tjock",
        oppningar=2, oppning="Ø18 cm", plan=2,
        material="stål, vattenhyacint och sammetslen polyester",
        farg="ljus naturton",
        montering="ingen", kattvikt="under 3,5 kg", maxlast=None,
        tal={40, 50, 2, 18, 22, 38, 6, 3.5},
    ),
    "d0b80807": dict(
        matt="60 × 60 × 61 cm", hojd=61,
        inre="Ø35 cm", plattform="30 × 18 cm", bas="Ø59 cm",
        oppningar=2, oppning="17,5 × 19,5 cm",
        material="spånskiva, plysch och sisal",
        farg="beige plysch mot gråbrun sisal",
        montering="krävs", kattvikt="under 5 kg", maxlast=None,
        tal={60, 61, 2, 17.5, 19.5, 35, 30, 18, 59, 5},
    ),
    "f4e6159e": dict(
        matt="55 × 39 × 90 cm", hojd=90,
        inre="Ø33 × 22,5 cm per plan", topplata="Ø34 cm",
        plattform="30 × 21 cm", klosmatta="31 × 21 cm", stam="Ø6 cm",
        oppningar=2, oppning="Ø14 cm", plan=4,
        material="spånskiva, papper, bomullsvadd, plysch och sisal",
        farg="beige",
        montering="krävs", kattvikt="en eller två katter under 5 kg",
        maxlast=10,
        tal={55, 39, 90, 4, 2, 14, 33, 22.5, 34, 30, 21, 31, 6, 10, 5},
    ),
    # ☠️ FYRKANTIG. Leverantören kallar den "Kratztonne"; måtten säger 45 × 45.
    "668e0e0c": dict(
        matt="45 × 45 × 81 cm", hojd=81, form="fyrkantig",
        inre="42 × 42 × 33 cm per plan", topp="42 × 42 cm",
        hal_i_toppen="Ø17 cm", sisalpanel="37 × 68,5 cm",
        oppningar=2, oppning="22 × 26 cm övre, 22 × 29 cm nedre", plan=2,
        material="spånskiva, kortlugg plysch och sisal",
        farg="mörkgrå plysch med sisal i naturton",
        montering="krävs", kattvikt="under 6 kg", maxlast=None,
        tal={45, 81, 2, 42, 33, 22, 26, 29, 17, 37, 68.5, 6},
    ),
    "38022bcb": dict(
        matt="60 × 44,5 × 109 cm", hojd=109,
        tunna="Ø39 × 80 cm", inre="Ø37 × 21 cm",
        badd="Ø40 cm, Ø28 cm invändigt", plattform="38 × 25 cm",
        stam="Ø8,2 cm", sockel="60 × 44,5 cm",
        oppningar=3, oppning="Ø16,5 cm", plan=3,
        material="spånskiva, plysch och sisal",
        farg="gräddvit plysch mot grå sisal",
        montering="krävs", kattvikt="under 5 kg", maxlast=None,
        tal={60, 44.5, 109, 39, 80, 3, 16.5, 37, 21, 40, 28, 38, 25, 8.2, 5},
    ),
}

# Produkttypens huvudord — vad sidan MÅSTE kalla varan, och vad den inte får.
TYP = {
    "f6857ca0": ("kattbädd", None),
    "09336fdf": ("klöstunna", None),
    "d0b80807": ("klöstunna", None),
    "f4e6159e": ("klösträd", None),
    # ☠️ Ordet "tunna" är FÖRBJUDET här: varan är en låda (45 × 45 fyrkant).
    "668e0e0c": ("klöstorn", "tunna"),
    "38022bcb": ("klösträd", None),
}
