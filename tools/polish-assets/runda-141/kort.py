# -*- coding: utf-8 -*-
"""Runda 141 — rundans DATA för spec-korten. Reglerna bor i `kortrunda.py`.

⚠️ RUBRIKEN MÅSTE BÄRAS AV BILD 1, och det avgörs med ögon, inte av kod.
   Varje rubrik nedan är vald mot den hjältebild kortet faktiskt bygger på,
   och kontrollerad mot kontaktarket efteråt.

☠️ Ingen rubrik nämner VIKTER eller SKIVSTÄNG. Tre av bänkarna visar dem på
   bild utan att de ingår (STEG4.md 4); en kortrubrik har lika lite plats för
   brasklappen som en alt-text.
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import grind as GR                                               # noqa: E402
import kortrunda as KR                                           # noqa: E402
import texter as T                                               # noqa: E402

# pid -> (kicker, rubrik)
KORT = {
    # Bild 1: ryggstödet står uppfällt över en låg sits, och rullparet sitter
    # längst fram på en egen böjd arm — det är det man ser först.
    "8de3c3ef": ("Träningsbänk 115 cm, svart och blå",
                 "Vadderat rullpar längst fram"),
    # Bild 1: två fristående delar med luft emellan. Ingen annan bänk i
    # rundan är delad i två.
    "7b818c3b": ("Träningsbänk med ställning",
                 "Bänk och ställ står fritt från varandra"),
    # Bild 1: två lårkuddar upptill OCH ett rullpar nedtill — bänken har
    # låsning i båda ändar, vilket ingen annan i rundan har.
    "8a0e05f4": ("Träningsbänk 146 cm, tre lutningar",
                 "Lårkuddar upptill och rullpar nedtill"),
    # Bild 1: armarna står rakt ut åt sidorna med handtag i ändarna.
    "b4961e6f": ("Hopfällbar träningsbänk, svart",
                 "Armarna svänger ut åt sidorna"),
    # Bild 1: den urskurna pulpeten står framför sitsen, stället bakom och
    # rullarna vid foten — tre stationer i samma bild.
    "83b2cf8b": ("Träningsbänk 175 cm med ställ",
                 "Pulpet framtill, ställ bakom, rullar vid foten"),
    # Bild 1: ramen är vit och varenda dyna svart. Rundans enda vita bänk.
    "a4bbe667": ("Träningsbänk 180 cm, vit ram",
                 "Vit stålram med svarta dynor"),
    # Bild 1: stommen är en låda i ljust trä med ett öppet fack under sitsen.
    # ☠️ Facket, inte "korgen" — namnet säger Aufbewahrungskorb och ingen
    #    korg syns på någon bild (STEG4.md 4).
    "18b94738": ("Träningsbänk i trä",
                 "Öppet fack i trästommen"),
}

# Fem rader per kort, alla HÄRLEDDA ur `texter.SPEC`.
# ☠️ KORTETIKETTENS FÖRSTA ORD MÅSTE FINNAS I SPEC-ETIKETTEN (`kortbygge.varde`).
RADER = {
    "8de3c3ef": ["Mått", "Hopfälld", "Sittdyna", "Ryggstöd",
                 ("Maxlast (användare)", "Maxlast användare")],
    "7b818c3b": ["Mått", "Hopfällt", "Bänkdyna",
                 ("Ställets höjd", "Ställets höjd"),
                 ("Bänkens kapacitet", "Bänkens kapacitet")],
    "8a0e05f4": ["Mått", "Ryggdyna", "Bukdyna", "Ryggstöd",
                 ("Maxlast (användare)", "Maxlast användare")],
    "b4961e6f": ["Mått", ("Bredd med armarna utfällda", "Bredd utfälld"),
                 "Sits", "Armar",
                 ("Maxlast (användare)", "Maxlast användare")],
    "83b2cf8b": ["Mått", "Ryggdyna", "Bicepspulpet", "Ryggstöd",
                 ("Maxlast (användare)", "Maxlast användare")],
    "a4bbe667": ["Mått", "Ryggdyna", "Armstödsdyna",
                 ("Skivstångsställ", "Skivstångsställ"),
                 ("Maxlast (användare)", "Maxlast användare")],
    # ☠️ 18b94738 har EN odelad maxlast, inte två gränser. Etiketten heter
    #    därför `Maxlast` och ingenting annat — se grind.KRAVS.
    "18b94738": ["Mått", "Sits", "Ryggdyna", "Fack", "Maxlast"],
}

# ☠️ Bild 1 per produkt HÄRLEDS ur `bilder.json`, aldrig avskriven.
GALLERI = json.load(open(os.path.join(HAR, "bilder.json"), encoding="utf-8"))
FILER = {pid: GALLERI[pid][0] for pid in KORT}

MJUKA = {}

if __name__ == "__main__":
    KR.kor(HAR, T, KORT, RADER, FILER, forbjudet=GR.FORBJUDET, mjuka=MJUKA)
