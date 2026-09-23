# -*- coding: utf-8 -*-
"""Steg 14 — live-grinden för runda 141.

Reglerna bor i `grind.granska(pid, html, live=True)`, ordningen i
`liverunda.kor`. Den här filen är BARA rundans val av kontrollsida.

☠️ KONTROLLSIDAN är en publicerad TRÄNINGSBÄNK som rundan varken rört eller
   länkar till — mätt, inte antaget: `sissy-squat-bank-3-i-1` finns inte
   bland rundans åtta länkmål och är inte någon av rundans sju sluggar.
   Den ska vara samma FAMILJ, för det är familjen som avgör vilken
   rekommendationsrad och vilka bloggrubriker butiken renderar; en
   kontrollsida ur en annan familj hade subtraherat fel chrome.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import grind as GR          # noqa: E402
import liverunda as LR      # noqa: E402
import texter as T          # noqa: E402

KONTROLL = "sissy-squat-bank-3-i-1"

if __name__ == "__main__":
    raise SystemExit(1 if LR.kor(GR, T, kontroll=KONTROLL) else 0)
