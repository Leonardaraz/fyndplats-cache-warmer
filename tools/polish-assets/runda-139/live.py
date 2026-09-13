# -*- coding: utf-8 -*-
"""Runda 139 Steg 14 — live-grind.

Filen ar med flit en HAMTARE, inte en kopia av reglerna. Ordningen bor i
`liverunda.kor`, reglerna i `grind.granska(pid, html, live=True)`, tvatten
i `grindar.butikstvatt`. Runda 127:s 219 egna rader var husets vanligaste
bugg: en tvilling som glider isar.

Kontrollsidan ar `liverunda.KONTROLL` = klostrad-200-cm-sex-nivaer, alltsa
en PUBLICERAD sida i samma familj OCH samma produkttyp (klostrad) som rundan
aldrig rort. Det ar ett krav, inte en detalj: butiken renderar bloggranken
"Klostrad & kattrad" bara pa klostrad-sidor, sa en kontroll ur fel undergrupp
mater inte det chrome som faller oss.
"""
import sys
sys.path.insert(0, "..")
import liverunda, grind, texter

if __name__ == "__main__":
    sys.exit(1 if liverunda.kor(grind, texter) else 0)
