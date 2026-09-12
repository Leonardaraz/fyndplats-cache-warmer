# -*- coding: utf-8 -*-
"""Runda 137 — Faktakorten. EN DATAFIL: reglerna bor i `kortrunda.py`.

☠️ RUBRIKEN MÅSTE BÄRAS AV FOTOT, inte av spec-tabellen. Runbokens mätning:
   sju av sextiofem kort i runda 60–61 föll för att rubriken tog ett TAL ur
   tabellen i stället för ett INTRYCK ur bilden. Varje rubrik nedan är vald
   mot BILD 1 med ögon, och talen står i RADERNA där de hör hemma.

☠️ KICKERN BÄR FÄRGEN, och det är inte kosmetik. Rundan är FYRA MODELLER I TVÅ
   FÄRGER VAR, alltså fyra par som delar varje mått, varje last och varje
   konstruktion. Det enda som skiljer syskonen på en kategorisida är färgen —
   och `kortrunda.kontroll` fäller två kort som delar kicker, just för att det
   fallet är konkret här.

⚠️ RUBRIKEN ÄR DÄREMOT DENSAMMA INOM ETT PAR, med flit. Den beskriver vad man
   SER i bild 1, och syskonen är samma möbel i en annan färg — en påhittad
   skillnad i rubriken hade varit en liten lögn på en sida vi själva skrivit.
   `kontroll` tillåter det: den fäller bara kort där kicker, rubrik OCH alla
   fem raderna är identiska.

☠️ INGEN LASTRAD PÅ SEX AV ÅTTA. Bara klöspelarna anger `Bärförmåga` i
   källan. De sex andra bär `Rekommenderad kattvikt` eller `Takspänne` på den
   platsen — kortet får inte fylla en ruta som källan lämnar tom.
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

KORT = {
    # Bild 1: stolpen går golv-till-tak, hängmattan sitter ensam mitt på den
    # med sittpinnarna fördelade över och under.
    "c7bd00b9": ("Takspänt klösträd, ek", "Hängmatta mitt på stolpen"),
    "a73a1a1c": ("Takspänt klösträd, grått", "Hängmatta mitt på stolpen"),
    # Bild 1: kojan sitter nederst, bädden med uppvikta öron ligger överst.
    "f5f71f5d": ("Klösträd 90 cm, cremevitt", "Koja nedtill, bädd överst"),
    "dd3b541b": ("Klösträd 90 cm, grått", "Koja nedtill, bädd överst"),
    # Bild 1: en enda grov stam bär både mellanplanet och bädden.
    "f489937f": ("Klöspelare 91 cm, mörkgrå", "En grov stam bär hela pelaren"),
    "5616c567": ("Klöspelare 91 cm, ljusbrun", "En grov stam bär hela pelaren"),
    # Bild 1: kojan är inbyggd i själva trappan, under andra steget.
    "1ae60dbc": ("Kattrappa 66 cm, beige", "Kojan är inbyggd i trappan"),
    "819bf51c": ("Kattrappa 66 cm, ljusgrå", "Kojan är inbyggd i trappan"),
}

# Fem rader per kort, alla HÄRLEDDA ur `texter.SPEC` — kortet skriver aldrig
# ett eget värde.
# ☠️ KORTETIKETTENS FÖRSTA ORD MÅSTE FINNAS I SPEC-ETIKETTEN — `kortbygge.varde`
#    kräver det, och det är den kopplingen som hindrar att en rad får grannens
#    värde.
RADER = {
    "c7bd00b9": ["Mått", "Höjdinställning", "Hängmatta", "Plan", "Takspänne"],
    "a73a1a1c": ["Mått", "Höjdinställning", "Hängmatta", "Plan", "Takspänne"],
    "f5f71f5d": ["Mått", "Koja", "Hängmatta", "Toppbädd",
                 ("Rekommenderad kattvikt", "Rekommenderad vikt")],
    "dd3b541b": ["Mått", "Koja", "Hängmatta", "Toppbädd",
                 ("Rekommenderad kattvikt", "Rekommenderad vikt")],
    "f489937f": ["Mått", "Klösstam", "Mellanplan", "Toppbädd", "Bärförmåga"],
    "5616c567": ["Mått", "Klösstam", "Mellanplan", "Toppbädd", "Bärförmåga"],
    "1ae60dbc": ["Mått", "Antal steg", ("Steghöjd från golv", "Steghöjd"),
                 "Koja", ("Rekommenderad kattvikt", "Rekommenderad vikt")],
    "819bf51c": ["Mått", "Antal steg", ("Steghöjd från golv", "Steghöjd"),
                 "Koja", ("Rekommenderad kattvikt", "Rekommenderad vikt")],
}

# ☠️ Bild 1 per produkt HÄRLEDS ur `bilder.GALLERI`, aldrig avskriven.
FILER = {pid: B.GALLERI[pid][0] for pid in KORT}

MJUKA = {}

if __name__ == "__main__":
    KR.kor(HAR, T, KORT, RADER, FILER, forbjudet=GR.FORBJUDET, mjuka=MJUKA)
