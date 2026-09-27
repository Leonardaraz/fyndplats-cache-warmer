# -*- coding: utf-8 -*-
"""Runda 136 Steg 14 — live-grinden.

☠️ INGEN LOGIK HÄR. `liverunda.py` äger hämtningen, ISR-uthärdningen,
   självtesterna och rapporten; `grind.granska(pid, html, live=True)` äger
   rundans regler. Runda 125–129 bar var sin KOPIA av det här och de hade
   mätbart drivit isär — 129 tappade dessutom rundans eget självtest
   (uppgift #491). Den här filen är därför en DATAFIL.

⚠️ KÖRS EFTER STEG 10, aldrig före (uppgift #443). Kategorierna skapar en NY
   grannkanal: butikens rekommendationsrad fylls ur samma kategorilöv, och en
   live-grind körd före dem ser inte de grannord som sidan sedan bär.
   Kategorierna skrevs i den här rundan i ett EGET anrop (16 av 16 lyckade
   per rad, båda löven: Husdjur + Lek & Tillbehör för husdjur) och
   kvitterades i en separat läsning innan publiceringen.
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
# Saldot lästes i mappningens `las` samma dag: 147, 140, 35, 92, 39, 86, 48
# och 5. ⚠️ `63a586da` står på FEM och är alltså den enda som kan ta slut
# innan nästa synk hinner skriva; sidan ligger kvar om den gör det (Aosoms
# egen guide: en försvunnen rad är ett lagerbesked, inte en utgången vara).
PUBLICERADE = ["4a5acc7d", "860b6eb9", "05136778", "105c685a",
               "7f8e495b", "ae1c848f", "f8528666", "63a586da"]

if __name__ == "__main__":
    pids = sys.argv[1:] or PUBLICERADE
    sys.exit(1 if LR.kor(GR, T, pids) else 0)
