#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Sätter ihop @@P@@.
och kör sedan hasha.py + bygg-skrivplan.py i rotens katalog (samma kedja som per enhet)."""
import json, os, shutil, subprocess, sys

ROT = '/home/user/fyndplats-cache-warmer/tools/polish-assets/@@RUNDA@@'
GATES = '/home/user/fyndplats-cache-warmer/tools/polish-gates'
SP = os.path.dirname(os.path.abspath(__file__))

enheter = json.load(open(f'{SP}/enheter_@@P@@.json', encoding='utf-8'))
ids = [e['huvud'] for e in enheter]
assert len(ids) == len(set(ids)) and len(ids) <= 20, ids

TEXTFILER = ['namn.tsv', 'slugs.txt', 'seo.tsv', 'sku.tsv', 'kategori.tsv', 'alt.tsv', 'bilder-bort.tsv',
             'foto-tal.txt', 'grind-undantag.txt', 'ids.tsv', 'lager.tsv', 'variant.tsv', 'bilder.tsv', 'rad-tal.txt', 'sammanslagna.tsv']

for fn in TEXTFILER:
    delar = []
    for i in ids:
        p = f'{ROT}/skriv/{i}/{fn}'
        if os.path.exists(p):
            t = open(p, encoding='utf-8').read()
            if t and not t.endswith('\n'):
                t += '\n'
            delar.append(t)
    mal = f'{ROT}/{fn}'
    if delar:
        open(mal, 'w', encoding='utf-8').write(''.join(delar))
    elif os.path.exists(mal):
        os.remove(mal)

# kallor.json: sammanslagen, en post per kort
kallor = {}
for i in ids:
    k = json.load(open(f'{ROT}/skriv/{i}/kallor.json', encoding='utf-8'))
    assert list(k) == [i], (i, list(k))
    kallor.update(k)
json.dump(kallor, open(f'{ROT}/kallor.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

for i in ids:
    shutil.copyfile(f'{ROT}/skriv/{i}/{i}.html', f'{ROT}/{i}.html')

print('rotfiler skrivna för', len(ids), 'enheter')
if '--bygg' in sys.argv:
    for cmd in (['python3', f'{GATES}/hasha.py'], ['python3', f'{GATES}/bygg-skrivplan.py']):
        r = subprocess.run(cmd, cwd=ROT, capture_output=True, text=True)
        print('$', os.path.basename(cmd[1]), 'rc', r.returncode)
        print((r.stdout + r.stderr)[-6000:])
        if r.returncode != 0:
            sys.exit(1)
