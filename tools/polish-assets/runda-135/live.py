# -*- coding: utf-8 -*-
"""Runda 135 Steg 14 — live-grinden.

☠️ INGEN LOGIK HÄR. `liverunda.py` äger hämtningen, ISR-uthärdningen,
   självtesterna och rapporten; `grind.granska(pid, html, live=True)` äger
   rundans regler. Runda 125–129 bar var sin KOPIA av det här och de hade
   mätbart drivit isär — 129 tappade dessutom rundans eget självtest
   (uppgift #491). Den här filen är därför en DATAFIL.

⚠️ KÖRS EFTER STEG 10, aldrig före (uppgift #443). Kategorierna skapar en NY
   grannkanal: butikens rekommendationsrad fylls ur samma kategorilöv, och en
   live-grind körd före dem ser inte de grannord som sidan sedan bär.
   Kategorierna skrevs (16 av 16 lyckade, varje kategori namngiven per rad)
   och kvitterades i ett EGET anrop före den här.
"""
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import liverunda as LR                                           # noqa: E402
import grind as GR                                               # noqa: E402
import texter as T                                               # noqa: E402

# Alla åtta publicerades 2026-09-12 — ingen hölls tillbaka på slutsålt lager.
# Saldot lästes i mappningens `las`: 17, 26, 56, 77, 179, 197, 38 och 73.
PUBLICERADE = ["0696efce", "7564dcfb", "5d64f423", "82efeeaf",
               "bdc7e768", "e2c8b0f3", "cc5da788", "741c5723"]

if __name__ == "__main__":
    pids = sys.argv[1:] or PUBLICERADE
    sys.exit(1 if LR.kor(GR, T, pids) else 0)
