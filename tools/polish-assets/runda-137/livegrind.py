# -*- coding: utf-8 -*-
"""Runda 137 Steg 14 — LIVE-grind. EN DATAFIL: all logik bor i `liverunda.py`.

☠️ RUNDANS EGEN GRIND MÅSTE FÖLJA MED. Runda 129 tappade sitt självtest genom
   att kopiera en tidigare rundas fil; grinden drev isär i fem rundor innan
   det upptäcktes. `liverunda.kor` tar därför rundans `grind`-modul som
   argument och kör dess självtest före sidorna.

⚠️ KÖRS EFTER KATEGORIERNA, aldrig före (uppgift #443). Steg 10 skapar en NY
   grannkanal — butiken renderar rekommendationsrader ur samma kategori — och
   en live-grind körd före kategorierna granskar en sida som ännu inte har
   den kanalen. Rundans kategori skrevs innan den här filen kördes.
"""
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import liverunda as LR                                           # noqa: E402
import grind as GR                                               # noqa: E402
import texter as T                                               # noqa: E402

PUBLICERADE = ["c7bd00b9", "a73a1a1c", "f5f71f5d", "dd3b541b",
               "f489937f", "5616c567", "1ae60dbc", "819bf51c"]

if __name__ == "__main__":
    pids = sys.argv[1:] or PUBLICERADE
    sys.exit(1 if LR.kor(GR, T, pids) else 0)
