# -*- coding: utf-8 -*-
"""Runda 135 — Faktakorten. EN DATAFIL: reglerna bor i `kortrunda.py`.

☠️ RUBRIKEN MÅSTE BÄRAS AV FOTOT, inte av spec-tabellen. Runbokens mätning:
   sju av sextiofem kort i runda 60–61 föll för att rubriken tog ett TAL ur
   tabellen i stället för ett INTRYCK ur bilden ("18,5 cm hopfälld" på en
   vagn fotad utfälld). Varje rubrik nedan är vald mot BILD 1 med ögon, och
   talen står i RADERNA där de hör hemma.

⚠️ KICKERN BÄR HÖJDEN, för det är det som skiljer de åtta åt på en
   kategorisida: 61,5 · 86 · 87 · 87 · 98 · 98 · 100 · 132 cm. De två på
   87 cm skiljs av konstruktionen i stället (bollbana mot bädd), och
   `kortrunda.kontroll` fäller två kort som delar kicker.
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
    # Bild 1: sisalen går obruten från sockeln upp till topplattan.
    "0696efce": ("Sisal, 87 cm", "Sisal hela vägen upp till topplattan"),
    # Bild 1: en rund bädd vilar överst på en enda grov stam.
    "7564dcfb": ("Bädd på toppen, 87 cm", "Rund bädd överst på en tjock stam"),
    # Bild 1: två stolpar bär var sin mjuk yta, på olika höjd.
    "5d64f423": ("Trä och jute, 61,5 cm", "Två mjuka ytor på var sin stolpe"),
    # Bild 1: kloten är staplade på stammen, rakt under bädden.
    "82efeeaf": ("Klösklot, 86 cm", "Fyra klot staplade under bädden"),
    # Bild 1: fårets kropp ÄR tunneln — formen är konstruktionen.
    "bdc7e768": ("Fårdesign, 98 cm", "Kroppen är en liggtunnel"),
    # Bild 1: hydda nederst, bädd ovanför, bladen högst upp.
    "e2c8b0f3": ("Bladkrona, 98 cm", "Hydda nederst och bädd ovanför"),
    # Bild 1: den flätade kupolen sitter upplyft högst upp på två stammar.
    "cc5da788": ("Flätad kupol, 100 cm", "Kupolhyddan sitter högst upp"),
    # Bild 1: fyra plan, och huset ligger mitt i staplingen.
    "741c5723": ("Borstpelare, 132 cm", "Fyra plan med huset i mitten"),
}

# Fem rader per kort, alla HÄRLEDDA ur `texter.SPEC` — kortet skriver aldrig
# ett eget värde. Den korta formen ("spec-etikett", "kort-etikett") används
# där tabellens etikett är för lång för kortets smala kolumn.
# ☠️ KORTETIKETTENS FÖRSTA ORD MÅSTE FINNAS I SPEC-ETIKETTEN — `kortbygge.varde`
#    kräver det, och det är den kopplingen som hindrar att en rad får grannens
#    värde. Runda 134 kortade "Rekommenderad kattvikt" till "Kattvikt" och det
#    höll; den här rundans etikett heter "Kattens vikt", där samma kortform
#    INTE finns. Den skrivs därför ut i sin helhet.
#
# ☠️ Den självklara kortformen "Vikt" hade passerat grinden OCH varit farlig:
#    på ett kort läses "Vikt" som VARANS vikt, och den är okänd för alla åtta
#    (spec-blockets tal är fraktvikten). Rundans egen FORBJUDET-lista fäller
#    just det påståendet i brödtexten — kortet ska inte få smyga in det.
RADER = {
    "0696efce": ["Mått", "Sockel", "Topplatta", "Bollbana", "Maxlast"],
    "7564dcfb": ["Mått", "Sockel", "Bädd", "Stam",
                 "Kattens vikt"],
    "5d64f423": ["Mått", "Sockel", "Bädd", "Hoppyta",
                 "Kattens vikt"],
    "82efeeaf": ["Mått", "Bädd", "Mellanplatå", "Klösklot", "Maxlast"],
    "bdc7e768": ["Mått", "Liggtunnel", "Öppning", "Klösstolpar",
                 "Kattens vikt"],
    "e2c8b0f3": ["Mått", "Hydda", "Ingång", "Bädd",
                 "Kattens vikt"],
    "cc5da788": ["Mått", "Kupolhydda", "Öppning", "Mellanplatå",
                 "Kattens vikt"],
    "741c5723": ["Mått", "Bädd", "Hus", "Klösmatta", "Borstpelare"],
}

# ☠️ Bild 1 per produkt HÄRLEDS ur `bilder.GALLERI`, aldrig avskriven.
FILER = {pid: B.GALLERI[pid][0] for pid in KORT}

if __name__ == "__main__":
    KR.kor(HAR, T, KORT, RADER,
           FILER, forbjudet=GR.FORBJUDET + GR.SVENSKAN + GR.ENDAST_KALLTEXT)
