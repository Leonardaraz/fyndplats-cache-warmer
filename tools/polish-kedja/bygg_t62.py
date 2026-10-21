#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""T62: bildplan som bara byter tyska alt-texter på sammanslagna bilder mot svenska. Skriver rundans filer (ids/bilder/alt/kallor-tal)."""
import json, os, re, sys
SP = '/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad'
ROT = '/home/user/fyndplats-cache-warmer/tools/polish-assets/runda-t62-alt-pa-sammanslagna-bilder'
os.makedirs(ROT, exist_ok=True)
D = json.load(open(f'{SP}/t60/alt13.json', encoding='utf-8'))
ORD = {1: 'ett', 2: 'två', 3: 'tre', 4: 'fyra', 5: 'fem', 6: 'sex', 7: 'sju', 8: 'åtta', 9: 'nio', 10: 'tio', 11: 'elva', 12: 'tolv', 13: 'tretton',
       14: 'fjorton', 15: 'femton', 16: 'sexton', 17: 'sjutton', 18: 'arton', 19: 'nitton', 20: 'tjugo'}
GER = re.compile(r'(?<![^\W\d_])(und|mit|für|der|die|das|dem|nicht|auch|oder|aus|zum|zur|von|bis|ohne|wetterbeständig|klappbar|trolley\w*|sicherheits\w*|aufbewahrung\w*|rollen|ebenen|werkzeug\w*|schaukel\w*)(?![^\W\d_])', re.I)


def tyskt(a):
    rest = re.sub(r'^\S+\s*', '', a)
    caps = [w for w in re.findall(r'(?<=[\s,])[A-ZÄÖÅ][a-zäöåüß]{3,}', rest) if w not in ('Måttbild', 'Närbild', 'Detaljer', 'Måttskiss', 'Specifikation')]
    return bool(GER.search(a)) or len(caps) >= 2 or bool(re.search(r'[ßü]|\d\s*cm\s*x\s*\d', a))


def ord_bild(a):
    return re.sub(r'(, bild )(\d{1,2})\b', lambda m: m.group(1) + ORD[int(m.group(2))], a)


ids, bilder, alt, tal = [], [], [], {}
andrade = {}
# ☠️ Bildplanen tar högst 15 bilder (lib/polish/bildplan.ts) och ersätter hela galleriet. En sida med fler bilder
# (sammanslagna sidor har 17–29) går inte att skriva med verktyget utan att bilder faller bort, så de hålls.
BILDTAK = 15
HALLNA = {k: len(v['it']) for k, v in D.items() if len(v['it']) > BILDTAK}
json.dump(HALLNA, open(f'{SP}/t62/hallna.json', 'w'), ensure_ascii=False, indent=1)
for k, v in D.items():
    if k in HALLNA:
        continue
    namn = v['n']
    ids.append(f"{k}\t{v['full']}\t{namn}")
    pos2val = {}
    for o in v['val']:
        assert o['o'] == 'Färg', (k, o['o'])
        for c in o['c']:
            for n, p in enumerate(c['pos'], 1):
                assert p not in pos2val, (k, p)
                pos2val[p] = (c['n'], n)
    tallista = set(v['tal'])
    for p, (fil, a) in enumerate(v['it'], 1):
        lbl = f'{p:02d}'
        bilder.append(f'{k}\t{lbl}\t{fil}')
        if tyskt(a):
            assert p in pos2val, (k, p, a)
            farg, n = pos2val[p]
            ny = f'{namn} i färgen {farg.lower()}' + ('' if n == 1 else f', bild {ORD[n]}')
            andrade.setdefault(k, []).append((p, a[:60], ny))
        else:
            ny = ord_bild(a)
        alt.append(f'{k}\t{lbl}\t{ny}')
        tallista |= {x.replace('.', ',') for x in re.findall(r'\d+(?:[.,]\d+)?', ny)}
    tal[k] = sorted(tallista, key=lambda s: (len(s), s))
open(f'{ROT}/ids.tsv', 'w', encoding='utf-8').write('\n'.join(ids) + '\n')
open(f'{ROT}/bilder.tsv', 'w', encoding='utf-8').write('\n'.join(bilder) + '\n')
open(f'{ROT}/alt.tsv', 'w', encoding='utf-8').write('\n'.join(alt) + '\n')
json.dump(tal, open(f'{ROT}/kallor-tal.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
tot = sum(len(x) for x in andrade.values())
print(len(D) - len(HALLNA), 'sidor,', tot, 'alt-texter byts;', len(HALLNA), 'hålls (över 15 bilder):', HALLNA)
for k, l in andrade.items():
    print(k, [(p, ny[-40:]) for p, _, ny in l][:3], '...' if len(l) > 3 else '')
