#!/usr/bin/env python3
"""planer.py: bygger galleriplanerna (plan_<id8>.json) ur kortfiler.json, kortalt.tsv och produkt-id:n.

Kör från rundans katalog:  python3 -P planer.py
kortfiler.json  kort -> Wix fil-id (uppladdade 2026-10-23 05:1x UTC och md5-parade mot de lokala korten)
kortalt.tsv     kort -> alt-text (grindad av gate-kort.py)
Planen för en sida har alla dess kort i den ordning de står i kort.tsv. Alt-texterna skrivs aldrig av för hand.
"""
import json, os

FULLT_ID = {
    "1d4eb6b1": "1d4eb6b1-2f8f-451d-b9ce-64aa4c34107d",
    "01ac2f63": "01ac2f63-9230-448a-811b-efd02f71a172",
    "38f70f83": "38f70f83-a58a-4569-843f-9c88e17a7e96",
    "3b868848": "3b868848-b46b-4618-84fa-22971bf0d486",
    "44d4907b": "44d4907b-e19b-43a1-b054-222f647588e3",
    "4a2ab58e": "4a2ab58e-1425-4421-b653-0db0e19cc681",
    "4d9ba658": "4d9ba658-4d60-44b0-af6b-2e29b4968f9f",
    "5466fe81": "5466fe81-fb5a-449b-8973-a79629e730fc",
    "75a38b7b": "75a38b7b-e6ba-43d5-806b-b378067f148a",
    "79ab08fe": "79ab08fe-e8d8-48c7-824f-fe32a3acf960",
    "7d1fb82b": "7d1fb82b-f895-453f-b153-b666b565a2bd",
    "92fc308c": "92fc308c-23e2-401f-8315-010a186c5e9c",
    "934297b1": "934297b1-51c5-48d6-b570-8b1ab4dae1dd",
    "c3d1fa41": "c3d1fa41-199a-4431-b65c-139bbce8aebf",
    "c438d4ba": "c438d4ba-0b43-44b5-95aa-c9fd0c13e2ff",
    "b129d5ae": "b129d5ae-059c-4708-b066-fb9bfde406a2",
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
