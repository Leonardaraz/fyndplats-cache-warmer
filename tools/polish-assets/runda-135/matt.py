# -*- coding: utf-8 -*-
"""Runda 135 — FACIT. Varje tal som får stå i kundtexten, och bara de.

Källa: leverantörens `Technische Daten` + måttritningen, läst i full
upplösning (Steg 4). ☠️ `Vikt` ur det svenska spec-blocket är FRAKTVIKTEN
(uppgift #488) och står därför INTE här — varans egen vikt är okänd för alla
åtta. `bdc7e768` visar varför: 5,4 kg i viktfältet mot `Maximale Belastung:
5 kg` i den tyska texten, två helt olika saker som båda ser ut som "vikt".

☠️ SJÄLVTESTET BEVISAR ATT KODEN FÖLJER FACIT, ALDRIG ATT FACIT ÄR SANT
   (uppgift #505). Talen här är avlästa ur RITNINGEN, inte ur produktnamnet —
   och i den här rundan motsäger namnet måtten på tre av åtta.
"""

FACIT = {
    # ── KLÖSPELARE: en stam på en sockel, inte ett klösträd ────────────────
    # ☠️ Namnet säger "39,5" och det är SOCKELNS BREDD. Höjden är 87 cm.
    "0696efce": dict(
        matt="39,5 × 39,5 × 87 cm", hojd=87,
        bas="39,5 × 39,5 cm", topplatta="20 × 20 cm, 1,5 cm tjock",
        stam="14,5 × 14,5 cm i tvärsnitt, 40 cm per sektion",
        bollbana="40 × 40 cm nedre, 30 × 30 cm övre",
        boll="Ø2,5 cm",
        material="MDF och sisal",
        farg="ljus ek mot gräddvit sisal",
        montering="krävs", kattvikt=None, maxlast=10,
        tal={39.5, 87, 20, 1.5, 14.5, 40, 30, 2.5, 10},
    ),
    "7564dcfb": dict(
        matt="45 × 45 × 87 cm", hojd=87,
        bas="45 × 45 cm", badd="Ø41 cm, 12 cm hög",
        badd_inre="Ø35 cm, 10 cm djup", stam="Ø14 cm",
        material="spånskiva, sisal och långluggad polyester",
        farg="brungrå melerad plysch mot gräddvit sisal",
        montering="krävs", kattvikt="upp till 6 kg", maxlast=6,
        tal={45, 87, 41, 12, 35, 10, 14, 6},
    ),

    # ── KLÖSTRÄD ──────────────────────────────────────────────────────────
    # ☠️ De två plyschskivorna är TVÅ PLATTFORMAR, inte en bädd med ett
    #    innermått. Spec-raden skriver "(Innen)" efter den andra, men
    #    måttritningen ritar dem var för sig, på var sin stolpe — och
    #    `Sprungplattform: Ø30 cm` bekräftar den lägre som en egen yta.
    #    Ritningen är källan (Steg 4), inte spec-radens parentes.
    "5d64f423": dict(
        matt="50 × 47 × 61,5 cm", hojd=61.5,
        bas="50 × 47 cm", badd="Ø40 cm, 8 cm hög",
        plattform="Ø30 cm, 7 cm hög",
        stam="Ø6,5 cm — 49 cm hög respektive 30 cm",
        lindning="25 cm jute på den långa stammen, 15 cm på den korta",
        material="spånskiva, trästolpar, jute och polyester",
        farg="gräddvit plysch mot ljust trä och naturfärgad jute",
        montering="krävs", kattvikt="upp till 5 kg", maxlast=5,
        tal={50, 47, 61.5, 40, 8, 30, 7, 6.5, 49, 25, 15, 5},
    ),
    "82efeeaf": dict(
        matt="56 × 54 × 86 cm", hojd=86,
        bas="56 × 54 cm", badd="54 × 36 cm, 8 cm hög",
        badd_inre="45 × 32 cm, 6 cm djup", plattform="40 × 37 cm",
        stam="Ø7 cm", klosklot="Ø11 cm",
        material="spånskiva, jute och polyester",
        farg="ljusbrun plysch mot naturfärgad jute",
        montering="krävs", kattvikt="upp till 7 kg", maxlast=7,
        tal={56, 54, 86, 36, 8, 45, 32, 6, 40, 37, 7, 11},
    ),
    "bdc7e768": dict(
        matt="48 × 34 × 98 cm", hojd=98,
        bas="48 × 34 cm", tunnel="Ø26 cm, 40 cm lång",
        oppning="17 × 15 cm", stam="Ø6,6 cm",
        svans="Ø2 cm, 31 cm lång",
        material="spånskiva, jute, plast och polyester",
        farg="ljusbrun och gräddvit plysch med svart huvud",
        montering="krävs", kattvikt="under 5 kg", maxlast=5,
        tal={48, 34, 98, 26, 40, 17, 15, 6.6, 2, 31, 5},
    ),
    "e2c8b0f3": dict(
        matt="44 × 30 × 98 cm", hojd=98,
        hydda="30 × 30 cm, 28,5 cm hög", oppning="19 × 21 cm",
        badd="40 × 30 cm, 7 cm hög", badd_inre="25 × 22 cm, 6 cm djup",
        stam="Ø5,8 cm",
        blad="30 × 14 cm de stora, 24 × 12 cm de små",
        material="spånskiva, jute och teddysammet",
        farg="grön teddysammet mot beige bädd och jutestammar",
        montering="krävs", kattvikt="upp till 5 kg", maxlast=None,
        tal={44, 30, 98, 28.5, 19, 21, 40, 7, 25, 22, 6, 5.8, 14, 24, 12, 5},
    ),
    "cc5da788": dict(
        matt="48 × 40 × 100 cm", hojd=100,
        bas="48 × 40 cm", hydda="Ø40 cm, 38 cm hög",
        oppning="32 × 32 cm", plattform="40 × 24 cm", stam="Ø5,5 cm",
        material="MDF, sisal, flätat kaveldun och plysch",
        farg="beige",
        montering="krävs", kattvikt="under 5 kg", maxlast=None,
        tal={48, 40, 100, 38, 32, 24, 5.5, 5},
    ),
    # ⚠️ Plattformslistan i spec-blocket anger `55,5 × 44 cm` på en produkt
    #    som är 55 cm bred — 0,5 cm för mycket, alltså en motsägelse. De tre
    #    plattformsmåtten står därför INTE i facit; ritningens övriga tal gör.
    "741c5723": dict(
        matt="55 × 44 × 132 cm", hojd=132,
        bas="55 × 44 cm", badd="50 × 32 cm, 7 cm hög",
        badd_inre="40 × 26 cm, 6 cm djup",
        hus="33,5 × 30 cm, 30 cm högt", oppning="16 × 19 cm",
        klosmatta="16 × 43 cm", borstpelare="Ø10 cm, 25 cm hög",
        stam="Ø7 cm",
        material="spånskiva, sisal och polyester",
        farg="ljusgrå plysch mot gräddvita sisalstammar och mörkgrått filthus",
        montering="krävs", kattvikt="två katter på upp till 6 kg vardera",
        maxlast=None,
        tal={55, 44, 132, 50, 32, 7, 40, 26, 6, 33.5, 30, 16, 19, 10, 25, 43},
    ),
}

# ── Produkttyp: huvudord + det ord som INTE får stå i texten ──────────────
# ☠️ Två par delar höjd inom rundan (87 och 98 cm), så höjden ensam duger
#    inte som kvalificerare — konstruktionen måste in i namn, slug och titel.
TYP = {
    "0696efce": ("klöspelare", "klösträd"),
    "7564dcfb": ("klöspelare", "klösträd"),
    "5d64f423": ("klösträd", "klöspelare"),
    "82efeeaf": ("klösträd", "klöspelare"),
    "bdc7e768": ("klösträd", "klöstunna"),
    "e2c8b0f3": ("klösträd", "klöstunna"),
    "cc5da788": ("klösträd", "klöstunna"),
    "741c5723": ("klösträd", "klöstunna"),
}

WIX = {
    "0696efce": "0696efce-c659-42c4-b2d4-5a45220e1e81",
    "bdc7e768": "bdc7e768-e8bc-4e95-ae22-234d9dbf3e9b",
    "5d64f423": "5d64f423-2af5-4f93-9003-81f84daee2d6",
    "82efeeaf": "82efeeaf-9f47-4ca1-b637-1d8d379a02fe",
    "7564dcfb": "7564dcfb-8982-4eba-ad91-4b4fb8cf212b",
    "e2c8b0f3": "e2c8b0f3-e532-46b5-b56c-315288b5c48d",
    "cc5da788": "cc5da788-4931-4751-96d2-825e3d834356",
    "741c5723": "741c5723-e512-472c-8a40-6434678c5633",
}
