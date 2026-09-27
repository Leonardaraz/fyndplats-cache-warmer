# -*- coding: utf-8 -*-
"""Runda 133 Steg 14 — live-grinden.

☠️ INGEN LOGIK HÄR. `liverunda.py` äger hämtningen, ISR-uthärdningen,
   självtesterna och rapporten; `grind.granska(pid, html, live=True)` äger
   rundans regler. Runda 125–129 bar var sin KOPIA av det här och de hade
   mätbart drivit isär — 129 tappade dessutom rundans eget självtest
   (uppgift #491). Den här filen är därför en DATAFIL.

⚠️ KÖRS EFTER STEG 10, aldrig före (uppgift #443). Kategorierna skapar en NY
   grannkanal: butikens rekommendationsrad fylls ur samma kategorilöv, och en
   live-grind körd före dem ser inte de grannord som sidan sedan bär.
"""
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import liverunda as LR                                           # noqa: E402
import grind as GR                                               # noqa: E402
import texter as T                                               # noqa: E402

# Alla tio publicerades 2026-09-12 — ingen hölls tillbaka på slutsålt lager
# (lagret lästes vid Steg 8b: inStock på alla tio).
PUBLICERADE = ["b6bf627f", "a33447f9", "e7a9abb7", "f2e06b7a", "bd0d7f9e",
               "d9310184", "efa9c03e", "e43b623c", "d85ade1b", "ec29ad45"]

if __name__ == "__main__":
    pids = sys.argv[1:] or PUBLICERADE
    sys.exit(1 if LR.kor(GR, T, pids) else 0)
