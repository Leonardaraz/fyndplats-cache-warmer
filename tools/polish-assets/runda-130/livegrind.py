# -*- coding: utf-8 -*-
"""Runda 130 Steg 14 — grindar de sex PUBLICERADE sidorna, inte utkasten.

Filen är en DATAFIL: reglerna bor i `grind.granska(pid, html, live=True)` och
ordningen i `liverunda.kor`. Runda 125–129 bar var sin kopia av den ordningen
(187, 220, 219, 106 och 59 rader), och kopiorna hann driva isär — 129 tappade
rundans egen grindsjälvtest utan att någon såg det. Tionde kopian blev därför
en delad modul i stället.

☠️ RUNDANS GRIND SJÄLVTESTAS I `mutation.py`, inte i en `sjalvtest()`-funktion:
   17 mutationer som var och en både bevisar att de landade OCH namnger vilken
   grind som måste fälla. Kör den separat — `liverunda` skriver ut att den
   saknas i stället för att tiga om det.
"""
import sys

sys.path.insert(0, "..")
sys.path.insert(0, ".")

import grind as GR                                                  # noqa: E402
import liverunda as LR                                              # noqa: E402
import texter as T                                                  # noqa: E402

if __name__ == "__main__":
    sys.exit(1 if LR.kor(GR, T, sys.argv[1:] or None) else 0)
