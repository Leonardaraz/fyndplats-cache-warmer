#!/usr/bin/env python3
"""rec_langd.py <rundkatalog>: kontrollerar längden på varje översatt omdöme i `recensioner.json` mot källans längd i `recensioner-kalla.json`,
före torrkörningen.

Skrivflödet vägrar ett översatt omdöme som är kortare än 0,4 gånger källans längd (spärren *för-kort*), och en vägrad torrkörning kostar en
push och en körning (runda vevor-455: *gen-1yi7g9e* var 39 tecken mot källans 194, för att kundtjänsten, märket och andra köp hade strukits).
Då ska omdömet få en längre mening som säger vad kunden faktiskt sa om varan, aldrig fyllnad: kan inget mer sägas om varan döljs omdömet.

Skriver en rad per översatt omdöme (kvot, källans och översättningens längd) och slutar med kod 1 om någon kvot är under 0,45 (marginal mot spärren),
och med kod 2 om ett omdöme som ska beslutas saknar beslut eller ett beslut saknar omdöme. Kör med python3.
"""
import json
import os
import sys

MIN = 0.45  # spärren är 0,4; en marginal för att räkningen kan skilja något mellan Python och TypeScript

rd = sys.argv[1]
kalla = json.load(open(os.path.join(rd, "recensioner-kalla.json"), encoding="utf-8"))
rec = json.load(open(os.path.join(rd, "recensioner.json"), encoding="utf-8"))
kod = 0
for k, v in kalla.items():
    att = {r["id"]: r for r in v.get("attBesluta", [])}
    b = rec.get(k, {"oversatt": {}, "dolj": {}})
    beslut = set(b.get("oversatt", {})) | set(b.get("dolj", {}))
    for rid in sorted(set(att) - beslut):
        print(k, rid, "SAKNAR BESLUT")
        kod = max(kod, 2)
    for rid in sorted(beslut - set(att)):
        print(k, rid, "BESLUT UTAN OMDÖME")
        kod = max(kod, 2)
    for rid, t in b.get("oversatt", {}).items():
        if rid not in att:
            continue
        n = len(att[rid]["text"])
        q = len(t) / n if n else 0
        flagga = ""
        if q < MIN:
            flagga = "  <-- FÖR KORT"
            kod = max(kod, 1)
        print(k, rid, "källa", n, "översättning", len(t), "kvot", round(q, 2), flagga)
sys.exit(kod)
