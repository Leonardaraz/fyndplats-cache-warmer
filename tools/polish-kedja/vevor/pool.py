#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""pool.py <pool-svar.txt> [<pool-svar-2.txt> ...] [--max N]: bygger kandidatlistan ur ett pool.js-svar (filen verktyget sparade).
Skriver pool.tsv i arbetskatalogen (id8, saldo, granskning, fullt id, titel) utan de id8 som redan finns i någon rundas ids.tsv eller i
FLAGGADE-VEVOR.md, och skriver ut det som är kvar efter en grov titelsållning (elektrisk utrustning, medicin, vapen). Familjer och
tvillingar avgörs sedan per kandidat (sökning på varuordet i registret och bland publicerade adresser), inte här."""
import json, os, re, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from parse_ut import las

REPO = '/home/user/fyndplats-cache-warmer'
filer = [a for a in sys.argv[1:] if not a.startswith('--') and not a.isdigit()]
rader, d = [], {}
for fil in filer:
    d = las(fil)
    rader += [r.split('|', 4) for r in d['rader']]
klara = set()
for rot in ('tools/polish-assets',):
    for kat in os.listdir(f'{REPO}/{rot}'):
        p = f'{REPO}/{rot}/{kat}/ids.tsv'
        if os.path.exists(p):
            for l in open(p, encoding='utf-8'):
                if re.match(r'[0-9a-f]{8}\t', l):
                    klara.add(l[:8])
ft = open(f'{REPO}/tools/polish-gates/FLAGGADE-VEVOR.md', encoding='utf-8').read()
klara |= set(re.findall(r'(?<![0-9a-f])[0-9a-f]{8}(?![0-9a-f])', ft))
ELEKTRISK = re.compile(r'\b(\d+\s?(v|volt|w|watt|kw|ah|mah)\b|batteri|laddare|motor|pump|led\b|värme|värmare|kyl|digital|elektrisk|elektriska|el-|trådlös|wifi|bluetooth|svets|kompressor|generator|dimma|rök|ånga|ugn|spis|fritös|mikro|mixer|blender|kvarn|slip|såg|borr|fräs|laser|kamera|display|termostat|vågen?|skylt|neon)', re.I)
MEDICIN = re.compile(r'(massage|rullstol|rollator|sjuk|vård|medicin|terapi|steril|tand|hörsel|blodtryck|gåstol|toalettstol|duschstol|hjälpmedel|vapen|pistol|gevär|alkohol|destill|bryggeri|jäs)', re.I)
ut = []
for k8, saldo, bg, fullid, titel in rader:
    if k8 in klara:
        continue
    ut.append((k8, int(saldo), bg, fullid, titel))
with open('pool.tsv', 'w', encoding='utf-8') as f:
    for r in ut:
        f.write('\t'.join(map(str, r)) + '\n')
kvar = [r for r in ut if not ELEKTRISK.search(r[4]) and not MEDICIN.search(r[4])]
print(f'{len(rader)} rader i svaret, {len(rader) - len(ut)} redan hanterade, {len(ut)} kvar, {len(kvar)} efter titelsållning (n i registret: {d.get("n")})')
mx = int(sys.argv[sys.argv.index('--max') + 1]) if '--max' in sys.argv else 0
if mx:
    for r in kvar[:mx]:
        print(f'{r[0]} {r[1]:>3} {r[2] if r[2] != "0" else " "} {r[4][:78]}')
