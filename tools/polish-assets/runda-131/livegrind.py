# -*- coding: utf-8 -*-
"""Runda 131 Steg 14 — live-grinden.

☠️ INGEN LOGIK HÄR. `liverunda.py` äger hämtningen, ISR-uthärdningen,
   självtesterna och rapporten; `grind.granska(pid, html, live=True)` äger
   rundans regler. Runda 125–129 bar var sin KOPIA av det här och de hade
   mätbart drivit isär (187/220/219/106/59 rader) — 129 tappade dessutom
   rundans eget självtest.
"""
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import liverunda as LR                                           # noqa: E402
import grind as GR                                               # noqa: E402
import texter as T                                               # noqa: E402

# ⚠️ `15e4c7a7` publicerades INTE — slutsåld vid Steg 13. Den ligger kvar
#    som utkast och har ingen live-sida att grinda.
PUBLICERADE = ["2166c50f", "9a513e9a", "c2be0f30",
               "ed1ea8dc", "935cd17b", "1b64abde"]

if __name__ == "__main__":
    pids = sys.argv[1:] or PUBLICERADE
    sys.exit(1 if LR.kor(GR, T, pids) else 0)
