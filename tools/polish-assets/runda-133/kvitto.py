# -*- coding: utf-8 -*-
"""Steg 7:s kvitto — byte-exakt, mot FACIT och inte mot min egen avskrift.

☠️ UPPGIFT #485: runda 128 jämförde Wix mot sin EGEN felskrivning och fick
   grönt på en felaktig text. Facit här är `facit.json`, som byggdes ur
   `texter.py` INNAN något skrevs. Skulle jag ha klistrat fel i API-anropet
   faller jämförelsen — det är hela poängen.

⚠️ Wix NORMALISERAR html:en vid sparandet (`wixnorm.py`). Den förväntade
   strängen är alltså normalisera(bygg(pid)), aldrig bygg(pid) rakt av.

FNV-1a över kodpunkterna, för att samma tal ska gå att räkna i JS inne i
Wix-sandlådan utan crypto — då behöver de 34 000 tecknen aldrig resa hem.
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HAR)
sys.path.insert(0, os.path.join(HAR, "..", "..", "polish-gates"))
import texter as T                                               # noqa: E402
from wixnorm import normalisera                                  # noqa: E402


def fnv1a(s):
    h = 0x811C9DC5
    for ch in s:
        h ^= ord(ch) & 0xFFFF
        h = (h * 0x01000193) & 0xFFFFFFFF
    return h


def vantat():
    ut = {}
    for pid in T.NAMN:
        norm = normalisera(T.bygg(pid))
        ut[pid] = {"langd": len(norm), "fnv": fnv1a(norm)}
    return ut


if __name__ == "__main__":
    v = vantat()
    json.dump(v, open(os.path.join(HAR, "kvitto-vantat.json"), "w"), indent=1)
    for pid, d in v.items():
        print("%-10s %5d tecken  fnv %10d" % (pid, d["langd"], d["fnv"]))
