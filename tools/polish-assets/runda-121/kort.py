# -*- coding: utf-8 -*-
"""Runda 121 Steg 11 — åtta Fyndplats-kort, byggda i efterhand.

☠️ RUNDAN SKEPPADE UTAN KORT. Klart-kriteriet kräver minst ett eget kort per
   polerad produkt (Leonards regel 2026-08-26), och runda 121-128 missade det
   åtta rundor i rad — ~62 publicerade sidor. Leonard hittade det, ingen grind.
   Grinden finns nu i `grindar.kortfel`, och den här filen är reparationen.

⚠️ TVÅ FÄRGPAR GÖR DUBBLETTRISKEN KONKRET. 45bac2cb/731c8bfc och
   da0f30b2/d8ebb279 delar varenda siffra — mått, volym, last, vikt. Bara
   färgen skiljer, så kickern MÅSTE bära den. `kontroll()` fäller identiska
   kort och delade kickers före bygget.

Reglerna bor i `kortrunda`, inte här. Runda 120:s kort.py bar sin egen
`kontroll` och runda 128 ärvde en kopia; sju rundor till hade blivit sju
kopior av samma tvilling.
"""
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import grind as GR                                               # noqa: E402
import kortrunda as KR                                           # noqa: E402
import texter as T                                               # noqa: E402

# (kicker, rubrik) — rubriken måste bäras av FOTOT, kontrollerat på arket.
KORT = {
    "45bac2cb": ("Mopphink 26 liter, gul", "Press och två korgar"),
    "731c8bfc": ("Mopphink 26 liter, blå", "Press och två korgar"),
    "74ea10dc": ("Mopphink 78 cm", "Rent och smutsigt åtskilt"),
    "e526fd01": ("Rullhink 36 liter", "Innerhink på 12 liter"),
    "da0f30b2": ("Moppvagn 25 liter, gul", "Korg och hylla på ramen"),
    "d8ebb279": ("Moppvagn 25 liter, blå", "Korg och hylla på ramen"),
    "9aa46e31": ("Städvagn 121 cm", "Tre hyllplan och sopsäck"),
    "75fcdcfb": ("Städvagn 122 cm", "Mopphink och 70-literssäck"),
}

# ☠️ Etiketten skrivs EXAKT som i spec-tabellen — `specrad` kastar annars.
#    Kortet får aldrig bära en andra sanning om ett tal sidan redan visar.
RADER = {
    "45bac2cb": ["Yttermått", "Hinkens volym", "Korgens mått", "Maxlast", "Vikt"],
    "731c8bfc": ["Yttermått", "Hinkens volym", "Korgens mått", "Maxlast", "Vikt"],
    "74ea10dc": ["Yttermått", "Volym", "Pressens mått", "Maxlast", "Vikt"],
    "e526fd01": ["Yttermått", "Hinkens volym", "Innerhinkens volym", "Maxlast", "Vikt"],
    "da0f30b2": ["Yttermått", "Hinkens volym", "Korgens mått", "Hyllans mått", "Vikt"],
    "d8ebb279": ["Yttermått", "Hinkens volym", "Korgens mått", "Hyllans mått", "Vikt"],
    "9aa46e31": ["Yttermått", "Nedre hyllan", "Sopsäckens öppning", "Maxlast", "Vikt"],
    "75fcdcfb": ["Yttermått", "Mopphinkens mått", "Sopsäckens volym", "Maxlast", "Vikt"],
}

# Hjältebildens Wix-fil per produkt, läst ur butiken — aldrig gissad.
FILER = {
    "45bac2cb": "b379ce_f2c96770de22405485b271434c692301~mv2.jpg",
    "731c8bfc": "b379ce_4db417712ee547cd9b597c58bae415e0~mv2.jpg",
    "74ea10dc": "b379ce_4eedd29f72a54e1dad418520a76451c9~mv2.jpg",
    "e526fd01": "b379ce_a9510d0bbc81487a941b57d62b076940~mv2.jpg",
    "da0f30b2": "b379ce_71f6f28bacb94e5cabb3d4efdbe16d8c~mv2.jpg",
    "d8ebb279": "b379ce_398355a2416e4a638ae5528b95060b5a~mv2.jpg",
    "9aa46e31": "b379ce_6196d82d0d524fd5b58eb440d8c0205e~mv2.jpg",
    "75fcdcfb": "b379ce_f637e2fb65de41bc806eb98cd229fa7b~mv2.jpg",
}

if __name__ == "__main__":
    KR.kor(HAR, T, KORT, RADER, FILER,
           forbjudet=GR.FORBJUDET + GR.TONGRINDAR)
