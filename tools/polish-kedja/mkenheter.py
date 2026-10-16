#!/usr/bin/env python3
"""mkenheter.py <ut.json> <spec.json>: spec = [{"huvud","syskon":[[id8,värde],...],"axel","huvudvarde","kategori","noter"}]; fyller saldo/pris/publicerad ur t15/data/<id8>.json."""
import json, sys
SP = '/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad'
spec = json.load(open(sys.argv[2], encoding='utf-8'))
ut = []
for s in spec:
    ids = [s['huvud']] + [a for a, _ in s.get('syskon', [])]
    saldo, pris = {}, {}
    for k in ids:
        p = json.load(open(f'{SP}/t15/data/{k}.json', encoding='utf-8'))
        v = p['variants'][0]
        saldo[k] = v.get('lager') or 0
        pris[k] = int(float(v['pris']))
        assert not p['visible'] or s.get('publicerad'), (k, 'synlig')
    ut.append(dict(huvud=s['huvud'], syskon=[dict(id8=a, varde=b) for a, b in s.get('syskon', [])], axel=s.get('axel', 'Färg'),
                   huvudvarde=s.get('huvudvarde', ''), kategori=s['kategori'], noter=s.get('noter', ''), saldo=saldo, pris=pris, publicerad=bool(s.get('publicerad', False))))
json.dump(ut, open(sys.argv[1], 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(ut), 'enheter;', 'saldo 0 i:', [k for u in ut for k, v in u['saldo'].items() if not v])
