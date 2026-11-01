#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""vevor_kalla.py <rundkatalog> <data.json>: gör rundans kallor.json till en VEVOR-källa.

Körs efter mkrunda.py (som bygger skriv/<id8>/kallor.json ur utkastets text) och före enheter_<p>.py.
Lägger två block i varje skriv/<id8>/kallor.json, mekaniskt ur data.json:

  === vevor-källa: Vikt i specifikationen är varans egen ===
      Raden gatelib.fraktvikt_fel letar efter. Utan den tog grinden specifikationens `Vikt` för Aosoms viktrad
      med förpackning och fällde varje VEVOR-sida (runda-vevor-1, 2026-11-01).
  === källa: utkastets namn ===
      Utkastets namn. Namnet bär ofta effekten (`2000W`) som specifikationen har som `Hög` eller saknar, och
      siffergrinden läser bara kallor.json. Namnet är importens egen text, inte något jag har skrivit.

Anropet är idempotent: ett block som redan finns läggs inte dit igen. Bildernas alt-text (leverantörens fulla titel) tas
INTE med: den är maskinöversatt och bär anspråk som specifikationen inte har (WiFi, IP55 som saknas i tabellen).
Ingenting i filen är artikelnummer: importen tar bort dem, och `leak.py` kontrollerar det före commit."""
import json
import sys

rot, data = sys.argv[1], sys.argv[2]
D = json.load(open(data, encoding='utf-8'))
for k, v in D.items():
    p = f'{rot}/skriv/{k}/kallor.json'
    d = json.load(open(p, encoding='utf-8'))
    t = d[k]
    if '=== vevor-källa' not in t:
        t = t.rstrip('\n') + '\n=== vevor-källa: Vikt i specifikationen är varans egen ===\n'
    if '=== källa: utkastets namn ===' not in t:
        t = t.rstrip('\n') + '\n=== källa: utkastets namn ===\n' + v['name'] + '\n'
    d[k] = t
    json.dump(d, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(k, len(t))
