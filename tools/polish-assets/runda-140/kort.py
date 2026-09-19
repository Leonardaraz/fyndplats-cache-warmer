# -*- coding: utf-8 -*-
"""Runda 140 — Faktakorten. EN DATAFIL: reglerna bor i `kortrunda.py`.

☠️ RUBRIKEN MÅSTE BÄRAS AV FOTOT, inte av spec-tabellen. Varje rubrik nedan är
   vald mot BILD 1 i ett kontaktark (`ark9-1.jpg`, `ark9-2.jpg`) och beskriver
   något man ser i samma ögonkast som man läser den.

☠️ BENFÄRGEN ÄR RUNDANS EGET FYND, och den sitter i tre av rubrikerna. Fyra av
   fjorton hjältebilder visar SVARTA ben (`benzoom.jpg`): `2ba6baf0`,
   `9ee2fa6e`, `c11948ac` och `07ac9918`. Leverantörens material säger björk på
   de tre första — det är sant om TRÄSLAGET och falskt om vad kunden ser, och
   texten är rättad därefter. Kortet får inte gå tillbaka till "björkben".

⚠️ FYRA FÄRGPAR. `kortrunda.kontroll` fäller på delad kicker, så färgen ligger
   i kickern. Rubriken får däremot delas inom ett par — modellen ÄR densamma,
   och en påhittad skillnad hade varit ett fel, inte en nyans.
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import kortrunda as KR                                           # noqa: E402
import grind as GR                                               # noqa: E402
import texter as T                                               # noqa: E402

KORT = {
    # Grupp A — platt bädd, rullad kant runt tre sidor, ljusa koniska ben.
    # Bild 1: kanten är ETT svep i samma stoppning hela vägen, utan skarv.
    "01fcdf1d": ("Hundsoffa 98 cm, ljusgrå", "Rullad kant runt tre sidor"),
    "bb3cd4ed": ("Hundsoffa 98 cm, grön", "Rullad kant runt tre sidor"),
    "881540a6": ("Hundsoffa 98 cm, blå", "Rullad kant runt tre sidor"),
    # Grupp B — liten soffa, rutstickad väv, fyrkantiga armstöd, ljusa ben.
    # Bild 1: rutstickningen syns över hela ryggen och sitsen.
    "5b8162d1": ("Hundsoffa 64 cm, ljusgrå", "Rutstickad väv på hela soffan"),
    "1835c144": ("Hundsoffa 64 cm, petrolblå", "Rutstickad väv på hela soffan"),
    # Grupp C — snäckformad rygg i sex bågar, SVARTA ben.
    # Bild 1: bågarna räknas direkt, och benen är de enda mörka i familjen.
    "9ee2fa6e": ("Hundsoffa 98,5 cm, grön", "Ryggen går i mjuka bågar"),
    "c11948ac": ("Hundsoffa 98,5 cm, mörkgrå", "Ryggen går i mjuka bågar"),
    # Bild 1: kantstödet är quiltat och den ovala insatsen ligger nedsänkt i
    # det — bädden är en skål, inte en plan yta.
    "c9ccf5a3": ("Hundbädd 90 cm med kantstöd", "Nedsänkt oval liggyta"),
    # Bild 1: benen är påfallande höga och vinklade utåt, och soffan är lång
    # och låg — den ser ut som en möbel, inte som en korg.
    "4c5d4687": ("Hundsoffa 102 cm i sammet", "Höga ben som lutar utåt"),
    # Bild 1: kantstödet går runt tre sidor och framkanten är helt öppen, så
    # hunden kliver rakt in.
    "68f8cae9": ("Hundbädd 96 cm, petrolblå", "Öppen framkant, kant runt tre sidor"),
    # Bild 1: ryggen är knappstickad i krämvit plysch och sluter sig runt hela
    # sitsen — den lilla hunden ligger i en kupa.
    "ee19a8c8": ("Husdjurssoffa 70 cm, krämvit", "Knappstickad rygg runt hela sitsen"),
    # Bild 1: benen är svarta cylindrar under ljusgrå sammet — rundans fynd.
    "2ba6baf0": ("Hundsoffa 82 cm i sammet", "Svarta ben under ljusgrå sammet"),
    # ☠️ FÖRSTA RUBRIKEN SA "Ryggen löper hela varvet runt" OCH VAR FEL.
    #    Zoomen (`rubrikzoom.jpg`) visar ingången som en tydlig lodrät
    #    skarv till vänster — ryggen SLUTAR där. Brödtexten sa redan
    #    "hela vägen runt utom vid ingången", så kortet hade motsagt
    #    sidan i samma ögonkast. Ingen textgrind kan fånga det: båda
    #    formuleringarna är härledda och inget ord är förbjudet. Det är
    #    BILDEN som avgör, och den granskas med ögon.
    "22c7de56": ("Rund husdjurssoffa 65 cm", "Rygg runt allt utom ingången"),
    # Bild 1: underredet är en sluten låda ända ner till benen — varenda
    # syskon i rundan är öppet därunder. Det är förvaringen man ser.
    "07ac9918": ("Husdjurssoffa 76 cm med förvaring", "Sluten låda under sitsen"),
}

# Fem rader per kort, alla HÄRLEDDA ur `texter.SPEC` — kortet skriver aldrig
# ett eget värde.
# ☠️ KORTETIKETTENS FÖRSTA ORD MÅSTE FINNAS I SPEC-ETIKETTEN (`kortbygge.varde`).
RADER = {
    "01fcdf1d": ["Mått", "Sittyta", "Dyna", ("Rygg och armstöd", "Rygg"),
                 ("Rekommenderad hund", "Rekommenderad hund")],
    "bb3cd4ed": ["Mått", "Sittyta", "Dyna", ("Rygg och armstöd", "Rygg"),
                 ("Rekommenderad hund", "Rekommenderad hund")],
    "881540a6": ["Mått", "Sittyta", "Dyna", ("Rygg och armstöd", "Rygg"),
                 ("Rekommenderad hund", "Rekommenderad hund")],
    "5b8162d1": ["Mått", "Sittyta", ("Ryggens höjd över sittytan", "Ryggens höjd"),
                 "Benhöjd", ("Rekommenderad hund", "Rekommenderad hund")],
    "1835c144": ["Mått", "Sittyta", ("Ryggens höjd över sittytan", "Ryggens höjd"),
                 "Benhöjd", ("Rekommenderad hund", "Rekommenderad hund")],
    "9ee2fa6e": ["Mått", "Sittyta", "Dyna",
                 ("Ryggens höjd över sittytan", "Ryggens höjd"), "Bärförmåga"],
    "c11948ac": ["Mått", "Sittyta", "Dyna",
                 ("Ryggens höjd över sittytan", "Ryggens höjd"), "Bärförmåga"],
    "c9ccf5a3": ["Mått", "Sittyta", "Kantstöd", "Överdrag",
                 ("Rekommenderad hund", "Rekommenderad hund")],
    "4c5d4687": ["Mått", "Sittyta", "Dyna", "Benhöjd",
                 ("Rekommenderad hund", "Rekommenderad hund")],
    "68f8cae9": ["Mått", "Sittyta", "Kantstöd", "Överdrag",
                 ("Rekommenderad hund", "Rekommenderad hund")],
    "ee19a8c8": ["Mått", "Sittyta", "Dyna", "Rygg", "Bärförmåga"],
    "2ba6baf0": ["Mått", "Sittyta", "Dyna", "Benhöjd",
                 ("Rekommenderad hund", "Rekommenderad hund")],
    "22c7de56": ["Mått", "Sittyta", "Dyna", "Benhöjd", "Bärförmåga"],
    # Förvaringsfacket ÄR produkten — måttet på det hör hemma på kortet.
    "07ac9918": ["Mått", "Sittyta", "Förvaringsfack", "Dyna", "Bärförmåga"],
}

# ☠️ Bild 1 per produkt HÄRLEDS ur `bilder.json`, aldrig avskriven.
GALLERI = json.load(open(os.path.join(HAR, "bilder.json"), encoding="utf-8"))
FILER = {pid: GALLERI[pid][0] for pid in KORT}

MJUKA = {
    # ☠️ 215 778 byte vid q=85 — 778 över taket. Regeln är att FOTOT mjukas
    #    upp, aldrig kortet: den krämvita boucléväven är precis den täta,
    #    högfrekventa textur som inte går att komprimera bort. Nyckeln är
    #    PRODUKT-ID, inte kortnamnet (`mjuka_upp(k, ...)` anropas med `k`) —
    #    fel nyckel är en TYST no-op, samma utfall som runda 130:s döda kod.
    "ee19a8c8": 1.2,
}

if __name__ == "__main__":
    KR.kor(HAR, T, KORT, RADER, FILER, forbjudet=GR.FORBJUDET, mjuka=MJUKA)
