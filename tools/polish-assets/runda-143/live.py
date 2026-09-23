# -*- coding: utf-8 -*-
"""Steg 14 — live-grinden för runda 143.

Reglerna bor i `grind.granska(pid, html, live=True)`, ordningen i
`liverunda.kor`. Den här filen är BARA rundans val av kontrollsida.

☠️ KONTROLLSIDAN valdes MEKANISKT. Villkoret är att sluggen INTE får vara ett
   länkmål i rundans egen html — en kontrollsida rundan länkar till
   subtraherar bort rundans EGEN korslänk, och då blir grinden blind för just
   den kanalen (#437).

   Uppmätt över rundans sjutton brödtexter: **samtliga femton länkmål är
   rundans EGNA slugs.** Korslänkarna går inåt — de tre färgsyskonen till
   varandra, och de säcklösa ställen till dem där säcken ingår. Ingen sida ur
   runda 142 är alltså länkmål, och hela grannfamiljen är valbar.

   `smart-boxningsdyna` behålls från runda 142: samma familj, publicerad,
   orörd av den här rundan, och redan bevisad som mätinstrument. Att byta
   kontrollsida utan skäl vore att byta instrument mitt i en mätserie.

⚠️ Kontrollsidan får aldrig skrivas på före svepet (#542) — den är
   mätinstrumentet, inte ett mätobjekt. Runda 143 har inte rört den.
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
