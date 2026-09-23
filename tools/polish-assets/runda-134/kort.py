# -*- coding: utf-8 -*-
"""Runda 134 — spec-korten. EN DATAFIL: reglerna bor i `kortrunda.py`.

☠️ RUBRIKEN MÅSTE BÄRAS AV FOTOT, inte av spec-tabellen. Runbokens mätning:
   sju av sextiofem kort i runda 60–61 föll för att rubriken tog ett TAL ur
   tabellen i stället för ett INTRYCK ur bilden ("18,5 cm hopfälld" på en vagn
   fotad utfälld). Varje rubrik nedan är vald mot bild 1 med ögon, kontrollerad
   på kontaktarket, och talen står i RADERNA där de hör hemma.

☠️ `668e0e0c` FÅR INTE HETA "tunna" — varken i kicker eller rubrik. Måtten är
   45 × 45, alltså en fyrkantig låda; leverantörens "Kratztonne" påstår en
   geometri som ritningen motsäger. Kortets rubrik namnger därför formen
   uttryckligen, och `matt.TYP` fäller ordet i grinden.
"""
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import kortrunda as KR                                           # noqa: E402
import bilder as B                                               # noqa: E402
import grind as GR                                               # noqa: E402
import texter as T                                               # noqa: E402

# Kickern bär MATERIALET + HÖJDEN, för det är det som skiljer de sex åt på
# en kategorisida. `kortrunda.kontroll` fäller två kort som delar kicker.
KORT = {
    "f6857ca0": ("Sjögräs, 43 cm", "Öppen framsida i en vagga av furu"),
    "09336fdf": ("Vattenhyacint, 50 cm", "Flätad tunna med rund dyna på toppen"),
    "d0b80807": ("Sisal, 61 cm", "Hopplattform bredvid den övre kojan"),
    "f4e6159e": ("Beige, 90 cm", "Topplatå över en koja med två ingångar"),
    # ☠️ "Fyrkantig" är inte pynt — det är rundans fynd, och det enda som
    #    skiljer den här sidan från de fem andra vid en snabb blick.
    "668e0e0c": ("Mörkgrå, 81 cm", "Fyrkantig med sisalpanel längs sidan"),
    # ⚠️ "högre än", inte "över": bädden står på en EGEN stolpe bredvid tunnan,
    #    inte ovanpå den. Fotot visar höjdskillnaden; "över" hade lovat en
    #    placering rakt ovanför som bilden motsäger.
    "38022bcb": ("Grå sisal, 109 cm", "Bädd på stolpe högre än klöstunnan"),
}

# Fem rader per kort, alla HÄRLEDDA ur `texter.SPEC` — kortet skriver aldrig
# ett eget värde. Den korta formen ("spec-etikett", "kort-etikett") används
# där tabellens etikett är för lång för kortets smala kolumn.
RADER = {
    "f6857ca0": ["Mått", "Öppning", "Dyna", "Material",
                 ("Rekommenderad kattvikt", "Kattvikt")],
    "09336fdf": ["Mått", "Antal hålor", "Håla", "Dyna",
                 ("Rekommenderad kattvikt", "Kattvikt")],
    "d0b80807": ["Mått", "Antal kojor", "Dörröppning", "Plattform",
                 ("Rekommenderad kattvikt", "Kattvikt")],
    "f4e6159e": ["Mått", "Antal kojor", "Topplatå", "Maxlast",
                 ("Rekommenderad kattvikt", "Kattvikt")],
    "668e0e0c": ["Mått", "Antal kojor", "Dörröppning", "Sisalpanel",
                 ("Rekommenderad kattvikt", "Kattvikt")],
    "38022bcb": ["Mått", "Antal hålor", "Håla", ("Bädd överst", "Bädd"),
                 ("Rekommenderad kattvikt", "Kattvikt")],
}

# ☠️ TVÅ AV SEX SPRÄNGDE 215 kB-TAKET vid q=85, och det är FLÄTVERKET som gör
#    det: en tätt flätad vattenhyacint- eller sisalyta är högfrekvent brus,
#    precis det jpeg inte packar. Regeln i `kortbygge` är att FOTOT mjukas upp,
#    aldrig kortet — kvaliteten får inte gå under 85. Talen är satta efter hur
#    mycket varje kort låg över:  d0b80807 +14 419   09336fdf +32 897
MJUKA = {
    "d0b80807": 1.3,
    "09336fdf": 1.9,
}

# ☠️ Bild 1 per produkt HÄRLEDS ur `bilder.GALLERI`, aldrig avskriven.
FILER = {pid: B.GALLERI[pid][0] for pid in KORT}

if __name__ == "__main__":
    KR.kor(HAR, T, KORT, RADER, FILER, forbjudet=GR.FORBJUDET + GR.ENDAST_KALLTEXT,
           mjuka=MJUKA)
