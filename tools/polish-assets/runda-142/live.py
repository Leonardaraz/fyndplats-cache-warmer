# -*- coding: utf-8 -*-
"""Steg 14 — live-grinden för runda 142.

Reglerna bor i `grind.granska(pid, html, live=True)`, ordningen i
`liverunda.kor`. Den här filen är BARA rundans val av kontrollsida.

☠️ KONTROLLSIDAN valdes MEKANISKT, inte av minnet. De tre publicerade
   boxningssidorna kördes mot två villkor: är sluggen ett LÄNKMÅL i rundans
   egen html, och är den en av rundans egna? Två av tre föll på det första —
   `95f6280b` länkar till 156-cm-säcken och `f0430bc5` till 160–230-sidan.
   En kontrollsida som rundan länkar till subtraherar bort rundans EGEN
   korslänk, och då blir grinden blind för just den kanalen (#437).

   Kvar står `smart-boxningsdyna`: samma familj, publicerad, orörd och inget
   länkmål. Familjen spelar roll — det är den som avgör vilken
   rekommendationsrad och vilka bloggrubriker butiken renderar.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import grind as GR          # noqa: E402
import liverunda as LR      # noqa: E402
import texter as T          # noqa: E402

KONTROLL = "smart-boxningsdyna"

if __name__ == "__main__":
    raise SystemExit(1 if LR.kor(GR, T, kontroll=KONTROLL) else 0)
