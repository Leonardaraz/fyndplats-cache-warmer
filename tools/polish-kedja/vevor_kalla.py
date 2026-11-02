#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""vevor_kalla.py <rundkatalog> <data.json> [<punkter.json>]: gör rundans kallor.json till en VEVOR-källa.

Körs efter mkrunda.py (som bygger skriv/<id8>/kallor.json ur utkastets text) och före enheter_<p>.py.
Lägger två block i varje skriv/<id8>/kallor.json, mekaniskt ur data.json:

  === vevor-källa: Vikt i specifikationen är varans egen ===
      Raden gatelib.fraktvikt_fel letar efter. Utan den tog grinden specifikationens `Vikt` för Aosoms viktrad
      med förpackning och fällde varje VEVOR-sida (runda-vevor-1, 2026-11-01).
  === källa: utkastets namn ===
      Utkastets namn. Namnet bär ofta effekten (`2000W`) som specifikationen har som `Hög` eller saknar, och
      siffergrinden läser bara kallor.json. Namnet är importens egen text, inte något jag har skrivit.

  === källa: punkter på VEVOR:s sida ===   (bara med tredje argumentet)
      VEVOR:s punktlista (`punkter` i avläsningen). Den når inte utkastets beskrivning i rått läge, men den bär fakta som beskrivningen
      saknar (rekommenderad akvariestorlek, automatisk avstängning, vad som ingår). Utan blocket fäller siffergrinden varje tal ur den.
      Filen är `{id8: {"punkter": [...]}}`; spara bara punkterna, aldrig avläsningens `spec` (den bär modellnumret).

Rader med en modellnummeretikett tas bort ur källan (Artikelmodellnummer, Artikellägenummer, Modell, Modellnummer, Produktmodell,
Artikelnummer): importen tar bort de flesta, men `Artikellägenummer` (runda-vevor-3, 2026-11-01) slank igenom, och repot är publikt.

Anropet är idempotent: ett block som redan finns läggs inte dit igen. Bildernas alt-text (leverantörens fulla titel) tas
INTE med: den är maskinöversatt och bär anspråk som specifikationen inte har (WiFi, IP55 som saknas i tabellen).
Ingenting i filen är artikelnummer: importen tar bort dem, och `leak.py` kontrollerar det före commit."""
import json
import re
import sys

MODELLRAD = re.compile(r'^\s*(artikel[a-zåäö]*nummer|artikelmodell[a-zåäö]*|modell|modellnummer|produktmodell)\s*:', re.I)

rot, data = sys.argv[1], sys.argv[2]
punkter = json.load(open(sys.argv[3], encoding='utf-8')) if len(sys.argv) > 3 else {}
D = json.load(open(data, encoding='utf-8'))
for k, v in D.items():
    p = f'{rot}/skriv/{k}/kallor.json'
    d = json.load(open(p, encoding='utf-8'))
    t = '\n'.join(r for r in d[k].split('\n') if not MODELLRAD.match(re.sub(r'<[^>]+>', '', r)))
    if '=== vevor-källa' not in t:
        t = t.rstrip('\n') + '\n=== vevor-källa: Vikt i specifikationen är varans egen ===\n'
    if '=== källa: utkastets namn ===' not in t:
        t = t.rstrip('\n') + '\n=== källa: utkastets namn ===\n' + v['name'] + '\n'
    if k in punkter and '=== källa: punkter på VEVOR:s sida ===' not in t:
        t = t.rstrip('\n') + '\n=== källa: punkter på VEVOR:s sida ===\n' + '\n'.join(punkter[k]['punkter']) + '\n'
    d[k] = t
    json.dump(d, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(k, len(t))
