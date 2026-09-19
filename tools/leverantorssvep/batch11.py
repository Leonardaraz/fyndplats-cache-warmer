# -*- coding: utf-8 -*-
"""Batch 11 — de två sista, och de var en parentes.

☠️ `(enligt tillverkaren)` föll mellan BÅDA de mekaniska passen: Fas A krävde
   `[.,;: ]` efter frasen, Fas A2 krävde `<`. Här står en HÖGERPARENTES, och
   ingen av dem täckte den. En lookahead som räknar upp avslutningstecken
   missar det tecken den inte tänkte på — därför tas de sista med exakta par.
"""

PAR = [
    ("3a5060ec", " (enligt tillverkaren)", ""),
    ("36b0b67a", " enligt tillverkaren)", ")"),
]
