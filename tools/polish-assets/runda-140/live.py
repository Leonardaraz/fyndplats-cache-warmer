# -*- coding: utf-8 -*-
"""Runda 140 Steg 14 — live-grind.

Filen ar med flit en HAMTARE, inte en kopia av reglerna. Ordningen bor i
`liverunda.kor`, reglerna i `grind.granska(pid, html, live=True)`, tvatten
i `grindar.butikstvatt`. Runda 127:s 219 egna rader var husets vanligaste
bugg: en tvilling som glider isar.

☠️ KONTROLLSIDAN ar `hundsoffa-stor-hund-upphojd` (64f5d64b) — den ENDA
   publicerade hundsoffan av samma typ, och en sida vars TEXT rundan aldrig
   rort. Utan den rapporteras butikens eget chrome (EU-lager-ribbonen,
   JSON-LD, footern, blogglanken) som rundans fel: runda 90:s forsta svep
   fallde 7 av 7 KORREKTA sidor pa tre strangar som alla fanns ordagrant pa
   en sida rundan aldrig rort.

   ⚠️ Rundan la till kategorilovet pa kontrollsidan i Steg 10. Det andrar
   inte dess TEXT, sa den duger fortfarande som kontroll — och den renderar
   numera samma kategori-chrome som rundans sidor, vilket gor den battre.

   ⚠️ EFTER att grinden kort gron la rundan ocksa till ett korslankblock pa
   kontrollsidan (#480 — grupp A:s tre farger lankade dit utan att fa nagot
   tillbaka). Ordningen ar med flit: SVEPET graderades mot en sida vars text
   rundan inte rort. Att blocket inte forstor kontrollen ar MATT, inte
   antaget — samma monster kordes over den gamla och den nya beskrivningen
   och subtraktionsmangden ar oforandrad (1 fynd, MATERIALLOGN, bada
   gangerna). Varje ord i blocket hade dessutom redan passerat rundans fulla
   grind pa de tretton sidorna; det ar `bygg-kors-64f5d64b.py`s starkaste
   villkor.

☠️ `c11948ac` AR INTE MED. Den ar OUT_OF_STOCK och darfor medvetet inte
   publicerad. En opublicerad sida svarar 404, och en 404 raknas som FEL
   (aldrig som ren) — att ta med den hade gett ett rott svep for ett beslut
   som var riktigt.
"""
import sys

sys.path.insert(0, "..")
import liverunda, grind, texter                                   # noqa: E402

KONTROLL = "hundsoffa-stor-hund-upphojd"

# Publicerade i Steg 13 — alla utom c11948ac (slutsald, hallen tillbaka).
PIDS = [p for p in texter.SLUG if p != "c11948ac"]

if __name__ == "__main__":
    print("runda 140: %d publicerade sidor, kontroll %s\n" % (len(PIDS), KONTROLL))
    sys.exit(1 if liverunda.kor(grind, texter, pids=PIDS, kontroll=KONTROLL) else 0)
