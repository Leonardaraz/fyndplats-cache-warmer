# -*- coding: utf-8 -*-
"""Runda 136 — Faktakorten. EN DATAFIL: reglerna bor i `kortrunda.py`.

☠️ RUBRIKEN MÅSTE BÄRAS AV FOTOT, inte av spec-tabellen. Runbokens mätning:
   sju av sextiofem kort i runda 60–61 föll för att rubriken tog ett TAL ur
   tabellen i stället för ett INTRYCK ur bilden. Varje rubrik nedan är vald
   mot BILD 1 med ögon, och talen står i RADERNA där de hör hemma.

⚠️ KICKERN BÄR HÖJDEN, för det är det som skiljer de åtta åt på en
   kategorisida: 79 · 79 · 98 · 100 · 101 · 104 · 139 · 160 cm. De två på
   79 cm skiljs av konstruktionen i stället (flätad vass mot bred liggyta),
   och `kortrunda.kontroll` fäller två kort som delar kicker.

☠️ KICKERN BÄR OCKSÅ PRODUKTTYPEN DÄR DEN AVVIKER. Två av de åtta är INTE
   klösträd — `860b6eb9` är en klöstunna och `4a5acc7d` ett klöstorn — och
   kortet är det första kunden ser på en kategorisida.

☠️ INGEN LASTRAD PÅ TVÅ AV KORTEN. `4a5acc7d` anger varken maxlast eller
   kattvikt i källan och `860b6eb9` anger bara kattvikt. Kortet får inte
   fylla en ruta som brödtexten med flit lämnar tom.
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
    # Bild 1: en sluten fyrkantig stomme med tre hålor ovanpå varandra.
    "4a5acc7d": ("Klöstorn, 100 cm", "Tre slutna rum ovanpå varandra"),
    # Bild 1: tunnan står på en bred fot, med hoppsteg längs sidan.
    "860b6eb9": ("Klöstunna, 101 cm", "Hoppsteg längs sidan upp till bädden"),
    # Bild 1: två kojor sitter på var sin höjd i tornet.
    "05136778": ("Två kojor, 160 cm", "Kojor på var sin höjd"),
    # Bild 1: bladen sitter högst upp, över klösskivan och kojan.
    "105c685a": ("Bladkrona, 139 cm", "Bladen sitter högst upp"),
    # Bild 1: kojan är flätad, bädden ovanför är mjuk plysch.
    "7f8e495b": ("Flätad vass, 79 cm", "Flätad koja, mjuk bädd ovanför"),
    # Bild 1: liggytan hänger ut brett över den runda kojan.
    "ae1c848f": ("Bred liggyta, 79 cm", "Liggytan hänger ut över kojan"),
    # Bild 1: rampen lutar ned mot golvet, bädden ligger högst upp.
    "f8528666": ("Flätad koja, 98 cm", "Ramp upp, flätad bädd överst"),
    # Bild 1: tunneln hänger fritt mellan två stammar.
    "63a586da": ("Liggtunnel, 104 cm", "Tunneln hänger mellan stammarna"),
}

# Fem rader per kort, alla HÄRLEDDA ur `texter.SPEC` — kortet skriver aldrig
# ett eget värde.
# ☠️ KORTETIKETTENS FÖRSTA ORD MÅSTE FINNAS I SPEC-ETIKETTEN — `kortbygge.varde`
#    kräver det, och det är den kopplingen som hindrar att en rad får grannens
#    värde.
RADER = {
    "4a5acc7d": ["Mått", "Sockel", "Håla", "Våning invändigt", "Bädd"],
    "860b6eb9": ["Mått", "Tunna", "Håla", "Bädd", "Passar katt"],
    "05136778": ["Mått", "Övre koja", "Nedre koja", "Bädd", "Bärförmåga"],
    "105c685a": ["Mått", "Koja", "Ingång", "Klösskiva", "Bärförmåga"],
    "7f8e495b": ["Mått", "Koja", "Öppning", "Övre bädd", "Bärförmåga"],
    "ae1c848f": ["Mått", "Liggyta", "Koja", "Ingång", "Bärförmåga"],
    "f8528666": ["Mått", "Koja", "Bädd", "Klösramp", "Bärförmåga"],
    "63a586da": ["Mått", "Liggtunnel", "Topplatta", "Sidoplattform",
                 "Bärförmåga"],
}

# ☠️ Bild 1 per produkt HÄRLEDS ur `bilder.GALLERI`, aldrig avskriven.
FILER = {pid: B.GALLERI[pid][0] for pid in KORT}

# ☠️ TAKET ÄR 215 kB VID q >= 85, och klarar kortet inte det ska FOTOT mjukas
#    — aldrig kortet. `f8528666`:s hjältebild är en flätad korgkoja där varje
#    strå är en egen kant, alltså exakt den sorts motiv en JPEG inte komprimerar
#    bort: 221 540 byte, 6 540 över taket. En svag gaussisk oskärpa på FOTOT tar
#    bort högfrekvensen utan att röra typsnitt eller siffror.
MJUKA = {"f8528666": 1.1}

if __name__ == "__main__":
    KR.kor(HAR, T, KORT, RADER, FILER,
           forbjudet=GR.FORBJUDET + GR.SVENSKAN + GR.ENDAST_KALLTEXT,
           mjuka=MJUKA)
