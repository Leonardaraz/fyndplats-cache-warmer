# -*- coding: utf-8 -*-
"""Runda 138 Steg 14 — LIVE-grind. EN DATAFIL: all logik bor i `liverunda.py`.

☠️ RUNDANS EGEN GRIND MÅSTE FÖLJA MED. Runda 129 tappade sitt självtest genom
   att kopiera en tidigare rundas fil; grinden drev isär i fem rundor innan
   det upptäcktes. `liverunda.kor` tar därför rundans `grind`-modul som
   argument och kör dess självtest före sidorna.

⚠️ KÖRS EFTER KATEGORIERNA, aldrig före (uppgift #443). Steg 10 skapar en NY
   grannkanal — butiken renderar rekommendationsrader ur samma kategori — och
   en live-grind körd före kategorierna granskar en sida som ännu inte har
   den kanalen. Rundans kategori skrevs i commit 6ac3298, före den här filen.

⚠️ KONTROLLSIDAN ÄR BYTT. `liverunda.KONTROLL` pekar på
   `klostrad-200-cm-sex-nivaer`, som rundan inte rört — men rundans egna
   sidor ligger nu i samma kategori, så butikens rekommendationsrad på
   kontrollsidan kan numera nämna dem. Det är ofarligt åt det här hållet:
   subtraktionen tar bara bort det som fyrar på BÅDA, och en granne som
   nämns på kontrollsidan nämns också på våra. Kontrollsidan lämnas därför
   orörd — att byta den vore att byta facit mitt i en mätning.
"""
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import liverunda as LR                                           # noqa: E402
import grind as GR                                               # noqa: E402
import texter as T                                               # noqa: E402

PUBLICERADE = ["1366a476", "839a2ef5", "68bc6c0c", "e5b31270",
               "fecadb3e", "505a0dde", "7bdc47b8"]

if __name__ == "__main__":
    pids = sys.argv[1:] or PUBLICERADE
    sys.exit(1 if LR.kor(GR, T, pids) else 0)
