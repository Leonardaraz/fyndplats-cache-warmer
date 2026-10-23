#!/usr/bin/env python3
"""planer.py: bygger galleriplanerna (plan_<id8>.json) ur kortfiler.json, kortalt.tsv och produkt-id:n.

Kör från rundans katalog:  python3 -P planer.py
kortfiler.json  kort -> Wix fil-id (uppladdade 2026-10-23 03:43 UTC och md5-parade mot de lokala korten)
kortalt.tsv     kort -> alt-text (grindad av gate-kort.py)
Planen för en sida har alla dess kort i den ordning de står i kort.tsv. Alt-texterna skrivs aldrig av för hand.
"""
import json, os

FULLT_ID = {
    "91f5c078": "91f5c078-39ac-4be8-8a04-327e48d28dea",
    "44d4907b": "44d4907b-e19b-43a1-b054-222f647588e3",
    "c3d1fa41": "c3d1fa41-199a-4431-b65c-139bbce8aebf",
}
filer = json.load(open("kortfiler.json", encoding="utf-8"))
alt = dict(r.rstrip("\n").split("\t", 1) for r in open("kortalt.tsv", encoding="utf-8") if r.strip() and not r.startswith("#"))
kort = [r.split("\t")[0] for r in open("kort.tsv", encoding="utf-8") if r.strip() and not r.startswith("#")]
per_sida = {}
for k in kort:
    per_sida.setdefault(k[:8], []).append(k)
for id8, korten in per_sida.items():
    plan = {"id": FULLT_ID[id8], "filer": [{"fil": filer[k], "alt": alt[k]} for k in korten]}
    with open(f"plan_{id8}.json", "w", encoding="utf-8") as f:
        json.dump(plan, f, ensure_ascii=False, indent=1)
    print(f"plan_{id8}.json: {len(korten)} filer")
