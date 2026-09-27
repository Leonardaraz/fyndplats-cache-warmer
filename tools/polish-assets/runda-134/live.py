# -*- coding: utf-8 -*-
"""Runda 134 Steg 14 — live-grinden.

☠️ INGEN LOGIK HÄR. `liverunda.py` äger hämtningen, ISR-uthärdningen,
   självtesterna och rapporten; `grind.granska(pid, html, live=True)` äger
   rundans regler. Runda 125–129 bar var sin KOPIA av det här och de hade
   mätbart drivit isär — 129 tappade dessutom rundans eget självtest
   (uppgift #491). Den här filen är därför en DATAFIL.

⚠️ KÖRS EFTER STEG 10, aldrig före (uppgift #443). Kategorierna skapar en NY
   grannkanal: butikens rekommendationsrad fylls ur samma kategorilöv, och en
   live-grind körd före dem ser inte de grannord som sidan sedan bär.
   Kategorierna skrevs och kvitterades (12 av 12 ALREADY_EXISTS) före den här.
"""
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import liverunda as LR                                           # noqa: E402
import grind as GR                                               # noqa: E402
import texter as T                                               # noqa: E402

# Alla sex publicerades 2026-09-12 — ingen hölls tillbaka på slutsålt lager
# (saldot lästes i publiceringsanropet: 7, 11, 79, 197, 11 och 124).
PUBLICERADE = ["f6857ca0", "09336fdf", "d0b80807",
               "f4e6159e", "668e0e0c", "38022bcb"]

if __name__ == "__main__":
    pids = sys.argv[1:] or PUBLICERADE
    sys.exit(1 if LR.kor(GR, T, pids) else 0)
