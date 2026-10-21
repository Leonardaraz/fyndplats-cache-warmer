#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""mkrunda.py <prefix> <rundnamn> <spec.json> [--utan-ark]

Skapar arbetskatalogen $SP/<prefix>/ för en runda (ny sida eller sida med syskon) ur en kompakt spec:
  {"enheter": [{"huvud": id8, "syskon": [{"id8": ..., "varde": ...}], "axel": "Färg"|"Storlek", "huvudvarde": "...",
                "kategori": "A + B", "noter": "...", "publicerad": bool}]}
Saldo och pris läses ur t15/data. Skriver data.json (registerposter), enheter_<prefix>.json, <prefix>lib.py, enheter_<prefix>.py,
samla_<prefix>.py och bygg_givare_<prefix>.py ur mallarna i mall/, och kör sedan bygg_enhet.py (kontaktark och originalbilder).
Kör med /usr/bin/python3 (PIL)."""
import json, os, shutil, subprocess, sys

SP = '/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad'
prefix, runda, spec = sys.argv[1], sys.argv[2], sys.argv[3]
utan_ark = '--utan-ark' in sys.argv
mapp = f'{SP}/{prefix}'
os.makedirs(mapp, exist_ok=True)
S = json.load(open(spec, encoding='utf-8'))

reg = {}
enh = []
for e in S['enheter']:
    ids = [e['huvud']] + [s['id8'] for s in e.get('syskon', [])]
    saldo, pris = {}, {}
    for k in ids:
        t = json.load(open(f'{SP}/t15/data/{k}.json', encoding='utf-8'))
        vs = t['variants']
        reg[k] = dict(
            fullid=t['fullid'], name=t['name'], slug=t['slug'], visible=t['visible'], revision=str(t.get('revision', '')),
            html=t['html'], text=t['html'],
            items=[i['id'] for i in t['items']],
            variants=[f"{v['sku']}/{v['id']}/{v['pris']}/{str(v['vis']).lower()}" for v in vs],
            lager=sum((v.get('lager') or 0) for v in vs),
            alts_full=[i.get('alt', '') for i in t['items']],
        )
        saldo[k] = reg[k]['lager']
        pris[k] = int(float(vs[0]['pris'])) if vs and vs[0].get('pris') is not None else None
    enh.append(dict(huvud=e['huvud'], syskon=e.get('syskon', []), axel=e.get('axel', 'Färg'), huvudvarde=e.get('huvudvarde', ''),
                    kategori=e['kategori'], noter=e.get('noter', ''), saldo=saldo, pris=pris, publicerad=bool(e.get('publicerad', False))))
json.dump(reg, open(f'{mapp}/data.json', 'w', encoding='utf-8'), ensure_ascii=False)
json.dump(enh, open(f'{mapp}/enheter_{prefix}.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
shutil.copyfile(f'{SP}/n283/bygg_enhet.py', f'{mapp}/bygg_enhet.py')

giv = runda.replace('runda-', 'runda-', 1) + '-givare-alt'
if len(giv) > 60:
    giv = f'runda-{prefix}-givare-alt'
for mall, ut in (('rundlib.py', f'{prefix}lib.py'), ('enheter_P.py', f'enheter_{prefix}.py'), ('samla_P.py', f'samla_{prefix}.py'), ('bygg_givare_P.py', f'bygg_givare_{prefix}.py')):
    t = open(f'{SP}/mall/{mall}', encoding='utf-8').read()
    t = t.replace('@@P@@', prefix).replace('@@RUNDA@@', runda).replace('@@GIVARRUNDA@@', giv)
    open(f'{mapp}/{ut}', 'w', encoding='utf-8').write(t)
print('katalog', mapp, '| runda', runda, '| givarrunda', giv, '| enheter', len(enh))
assert len(runda) <= 60, ('rundnamnet över 60 tecken', len(runda))
cmd = [sys.executable, f'{mapp}/bygg_enhet.py', runda, f'{mapp}/enheter_{prefix}.json'] + (['--utan-ark'] if utan_ark else [])
r = subprocess.run(cmd, capture_output=True, text=True)
print((r.stdout + r.stderr)[-3500:])
sys.exit(r.returncode)
