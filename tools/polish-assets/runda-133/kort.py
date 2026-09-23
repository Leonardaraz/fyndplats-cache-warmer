# -*- coding: utf-8 -*-
"""Runda 133 — spec-korten. EN DATAFIL: reglerna bor i `kortrunda.py`.

☠️ Rundan skriver bara KORT (kicker + rubrik) och RADER (vilka spec-etiketter
   kortet visar). Härledningen av värdena, måttradskravet, dubblettspärren,
   takgränsen på 215 kB och kopian till den SPÅRADE `kort/`-mappen ligger i
   den delade modulen — runda 104–106 ärvde en mall UTAN copy-raden och laddade
   upp sex kort från adresser som svarade 404.

⚠️ RUBRIKEN MÅSTE BÄRAS AV FOTOT. Den är vald mot bild 1 med ögon, inte av kod,
   och kontrolleras på kontaktarket efteråt. Rundans egen fälla: grupp C är tre
   tunnor som bara skiljs åt av KANTFÄRGEN, så varje rubrik namnger just kanten.
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

# ☠️ KICKERN MÅSTE VARA UNIK — `kortrunda.kontroll` fäller annars. Tre av de tio
#    är "70 cm med tre hålor" och två är "96 cm med tre hålor"; kickern bär
#    därför färgen, som är det enda som skiljer dem åt.
KORT = {
    "b6bf627f": ("Sjögräs, 49 cm", "Flätat sjögräs under, sisal över"),
    "a33447f9": ("Sjögräs, 79 cm", "Tre hålor i flätat sjögräs och sisal"),
    "e7a9abb7": ("Mörkgrå, 74 cm", "Tre ingångar mot ljus sisalpanel"),
    # ☠️ RUBRIKEN FÅR INTE SÄGA "tre" HÄR, fast facit är tre: hjälten visar
    #    bara två av dem (den mittersta ligger på baksidan i just den
    #    vridningen). Kortet är ett BILDLÖFTE — det som står ska synas i
    #    samma ögonkast. Talet står i RADEN, som är rätt plats för det.
    "f2e06b7a": ("Beige, 74 cm", "Gräddvit plyschpanel mot beige sisal"),
    "bd0d7f9e": ("Grå kant, 70 cm", "Tre runda hålor med grå kanter"),
    "d9310184": ("Ljusbrun, 70 cm", "Gräddvita kanter mot ljusbrun sisal"),
    "efa9c03e": ("Mörkgrå kant, 70 cm", "Mörkgrå kanter, topp och sockel"),
    "e43b623c": ("Ljusgrå, 60 cm", "Låg tunna med två runda hålor"),
    "d85ade1b": ("Cremevit, 96 cm", "Kattformade hålor och bädd på toppen"),
    "ec29ad45": ("Grå, 96 cm", "Grå tunna med bädd på toppen"),
}

# Fem rader per kort, alla HÄRLEDDA ur `texter.SPEC` — kortet skriver aldrig
# ett eget värde. Den korta formen ("spec-etikett", "kort-etikett") används där
# tabellens etikett är för lång för kortets smala kolumn.
# ⚠️ d85ade1b och ec29ad45 får OLIKA femte rad med flit: med samma fem
#    etiketter hade de fått IDENTISKA kort (allt utom färgen är lika), och
#    `kortrunda.kontroll` fäller två identiska kort.
RADER = {
    "b6bf627f": ["Mått", "Antal hålor", "Ingång", "Material", "Maxlast"],
    "a33447f9": ["Mått", "Antal hålor", "Ingång", "Material", "Maxlast"],
    "e7a9abb7": ["Mått", "Antal ingångar", "Ingång", "Material",
                 ("Rekommenderad kattvikt", "Kattvikt")],
    "f2e06b7a": ["Mått", "Antal ingångar", "Ingång", "Liggyta överst",
                 ("Rekommenderad kattvikt", "Kattvikt")],
    "bd0d7f9e": ["Mått", "Antal hålor", "Ingång", "Färg",
                 ("Rekommenderad kattvikt", "Kattvikt")],
    "d9310184": ["Mått", "Antal hålor", "Ingång", "Färg",
                 ("Rekommenderad kattvikt", "Kattvikt")],
    "efa9c03e": ["Mått", "Antal hålor", "Ingång", "Färg",
                 ("Rekommenderad kattvikt", "Kattvikt")],
    "e43b623c": ["Mått", "Antal hålor", "Ingång", "Nedre rummet", "Maxlast"],
    "d85ade1b": ["Mått", "Antal hålor", "Ingång", ("Bädd överst", "Bädd"),
                 "Maxlast"],
    "ec29ad45": ["Mått", "Antal hålor", "Ingång", "Färg", "Maxlast"],
}

# ☠️ SEX AV TIO SPRÄNGDE 215 kB-TAKET vid q=85, och det är SISALEN som gör det:
#    en tätt lindad sisalyta är högfrekvent brus, precis det jpeg inte packar.
#    Regeln i `kortbygge` är att FOTOT mjukas upp, aldrig kortet — kvaliteten
#    får inte under 85. Talen är satta efter hur mycket varje kort låg över:
#      e7a9abb7 +1 480   d9310184 +4 636   b6bf627f +10 971
#      e43b623c +11 891  bd0d7f9e +14 122  efa9c03e +23 050
MJUKA = {
    "e7a9abb7": 0.5,
    "d9310184": 0.8,
    "b6bf627f": 1.1,
    "e43b623c": 1.2,
    "bd0d7f9e": 1.3,
    "efa9c03e": 1.6,
}

# ☠️ Bild 1 per produkt HÄRLEDS ur `bilder.GALLERI`, aldrig avskriven.
FILER = {pid: B.GALLERI[pid][0] for pid in KORT}

if __name__ == "__main__":
    KR.kor(HAR, T, KORT, RADER, FILER, forbjudet=GR.FORBJUDET, mjuka=MJUKA)
