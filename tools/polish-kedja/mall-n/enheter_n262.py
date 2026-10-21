#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""N262: två egna sidor (skyddsöverdrag för hollywoodgunga, paviljongtak 3 × 3 m i kaffebrunt)."""
import sys, json
SP = '/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad/n262r'
sys.path.insert(0, SP)
from n262lib import skriv_enhet, ROT, RUNDA
import v1

KAT = {e['huvud']: e['kategori'] for e in json.load(open(f'{SP}/enheter_n262.json', encoding='utf-8'))}

U = {}
for m in (v1,):
    nya = m.bygg(KAT)
    assert not (set(U) & set(nya)), set(U) & set(nya)
    U.update(nya)


def lagg_in_klipp(id8):
    """Byter fil-id för de positioner som beskurits (utsnitten ligger i Media Manager). Samma etikett, ny fil."""
    bp = f'{ROT}/{RUNDA}/skriv/{id8}/bilder.tsv'
    rader = [r for r in open(bp, encoding='utf-8').read().splitlines() if r.strip()]
    ut = []
    for r in rader:
        k, pos, fil = r.split('\t')
        if k == id8 and pos in v1.KLIPP.get(id8, {}):
            fil = v1.KLIPP[id8][pos]
        ut.append(f'{k}\t{pos}\t{fil}')
    open(bp, 'w', encoding='utf-8').write('\n'.join(ut) + '\n')


if __name__ == '__main__':
    ok = True
    vilka = sys.argv[1:] or list(U)
    for k in vilka:
        lagg_in_klipp(k)
        ok = skriv_enhet(k, U[k], kor=True) and ok
    sys.exit(0 if ok else 1)
