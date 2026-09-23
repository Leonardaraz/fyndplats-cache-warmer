# -*- coding: utf-8 -*-
"""Steg 14 för runda 143 — samma körning som `live.py`, men sidorna SPARAS.

☠️ REGLERNA OCH ORDNINGEN ÄR INTE KOPIERADE HIT. Den här filen anropar
   `liverunda.kor` oförändrad; det enda som läggs till är att `hamta_isr`
   TEE:ar sidans html till `steg14-html/<pid>.html` på vägen förbi. En egen
   loop hade blivit husets vanligaste bugg — en tvilling som glider isär
   (`SHIP_AXIS_RE`, `EU_TULL_CODES`, live-grinden i fem rundor).

Skälet att spara: en ISR-hämtning kostar två anrop och tjugo sekunders paus
per sida. 445 fel går inte att kategorisera ur en `tail`, och att hämta om
hela svepet för varje ny fråga är både långsamt och — värre — en NY mätning
av en sida som kan ha hunnit ändras. Facit ska vara samma bytes hela vägen.

⚠️ Katalogen heter `live/` för att husets `.gitignore` REDAN har en rad för
   den (`*/live/`, "hämtade LIVE-sidor från Steg 14"). Ett eget namn hade
   krävt en egen ignore-rad — alltså en tvilling till en regel som redan
   fanns, och den sortens tvilling är vad halva runbooken handlar om.
"""
import io
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)
import grind as GR          # noqa: E402
import grindar as G         # noqa: E402
import liverunda as LR      # noqa: E402
import texter as T          # noqa: E402
import live as L            # noqa: E402

UT = os.path.join(HAR, "live")

_slug2pid = {s: p for p, s in T.SLUG.items()}
_akta = G.hamta_isr


def _tee(url, *a, **kw):
    html, huvuden = _akta(url, *a, **kw)
    namn = _slug2pid.get(url.rstrip("/").rsplit("/", 1)[-1],
                         "kontroll-" + url.rstrip("/").rsplit("/", 1)[-1])
    io.open(os.path.join(UT, "%s.html" % namn), "w",
            encoding="utf-8").write(html)
    return html, huvuden


if __name__ == "__main__":
    os.makedirs(UT, exist_ok=True)
    G.hamta_isr = _tee
    LR.G.hamta_isr = _tee
    raise SystemExit(1 if LR.kor(GR, T, kontroll=L.KONTROLL) else 0)
