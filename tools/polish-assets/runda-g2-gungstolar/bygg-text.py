#!/usr/bin/env python3
"""Bygger textnyttolasten ur FILERNA — aldrig ur minnet.

Filen är källan; en diff mot den lagrade texten är det enda som bevisar att
källan kom fram. Anropet transkriberas, och det är i transkriberingen felen
uppstår (fontagen-weight, 2026-09-06).
"""
import sys, json
rader = [l.rstrip("\n").split("\t") for l in open("namn.tsv", encoding="utf-8") if l.strip()]
halva = int(sys.argv[1]) if len(sys.argv) > 1 else 0
ut = []
for kort, fullt, pris, namn, sku in rader[halva * 4:(halva + 1) * 4]:
    ut.append([fullt, namn, open(f"{kort}.html", encoding="utf-8").read().strip()])
print(json.dumps(ut, ensure_ascii=False))
