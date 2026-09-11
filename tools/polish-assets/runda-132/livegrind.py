# -*- coding: utf-8 -*-
"""Runda 132 Steg 14 — live-grinden.

☠️ INGEN LOGIK HÄR. `liverunda.py` äger hämtningen, ISR-uthärdningen,
   självtesterna och rapporten; `grind.granska(pid, html, live=True)` äger
   rundans regler. Runda 125–129 bar var sin KOPIA av det här och de hade
   mätbart drivit isär — 129 tappade dessutom rundans eget självtest
   (uppgift #491). Den här filen är därför en DATAFIL.
"""
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import liverunda as LR                                           # noqa: E402
import grind as GR                                               # noqa: E402
import texter as T                                               # noqa: E402

# Alla tio publicerades 2026-09-11 — ingen hölls tillbaka på slutsålt lager.
PUBLICERADE = ["8f6147b5", "4c25eb86", "762cc411", "f384c51d", "3ff2bc32",
               "03715963", "c38f929e", "96d2803c", "11436227", "71e8e879"]

if __name__ == "__main__":
    pids = sys.argv[1:] or PUBLICERADE
    sys.exit(1 if LR.kor(GR, T, pids) else 0)
