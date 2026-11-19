#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""rec_live.py <rundkatalog>: kontrollerar att rundans översatta omdömen syns på de levande sidorna och att de dolda inte gör det.

Läser `live/<kort>.html` (hamta-live.sh), `recensioner.json` (besluten) och `recensioner-kalla.json` (originaltexterna). För varje översatt omdöme letas
de första 30 tecknen av den svenska texten upp i sidan (rå HTML, HTML-avkodad och JSON-avkodad), och för varje dolt omdöme letas de första 30 tecknen av
originaltexten upp: de ska inte finnas. Skriver bara kort-id, recensions-id och utfall, aldrig texterna (loggen kan vara publik).
Exit 1 om ett översatt omdöme saknas eller ett dolt syns."""
import html
import json
import os
import re
import sys

rot = sys.argv[1]
B = json.load(open(os.path.join(rot, 'recensioner.json'), encoding='utf-8'))
K = json.load(open(os.path.join(rot, 'recensioner-kalla.json'), encoding='utf-8'))


def varianter(t):
    ut = [t, html.unescape(t)]
    try:
        ut.append(json.loads('"' + t.replace('"', '\\"') + '"'))
    except Exception:
        pass
    ut.append(re.sub(r'\\u([0-9a-fA-F]{4})', lambda m: chr(int(m.group(1), 16)), t))
    return [re.sub(r'\s+', ' ', v) for v in ut]


def finns(sida, text):
    nyckel = re.sub(r'\s+', ' ', text.strip())[:30]
    return any(nyckel in v for v in varianter(sida))


bra = fel = 0
for kort, b in sorted(B.items()):
    fil = os.path.join(rot, 'live', f'{kort}.html')
    if not os.path.exists(fil):
        print(kort, 'ingen live-sida hämtad')
        fel += 1
        continue
    sida = open(fil, encoding='utf-8', errors='replace').read()
    orig = {r['id']: r['text'] for v in K.get(kort, {}).values() if isinstance(v, list) for r in v if isinstance(r, dict) and 'id' in r}
    for rid, text in b.get('oversatt', {}).items():
        ok = finns(sida, text)
        bra += ok
        fel += not ok
        print(kort, rid, 'översatt:', 'SYNS' if ok else 'SAKNAS')
    for rid in b.get('dolj', {}):
        syns = rid in orig and finns(sida, orig[rid])
        bra += not syns
        fel += syns
        print(kort, rid, 'dolt:', 'SYNS (fel)' if syns else 'syns inte')
print('RESULTAT:', bra, 'rätt,', fel, 'fel')
sys.exit(1 if fel else 0)
