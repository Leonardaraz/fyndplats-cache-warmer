#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""N258: vändbar utomhusmatta med bladmönster i mörkgrått och vitt (egen sida)."""
import sys, json
SP = '/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad/n258'
sys.path.insert(0, SP)
from n258lib import skriv_enhet
import v1

KAT = {e['huvud']: e['kategori'] for e in json.load(open(f'{SP}/enheter_n258.json', encoding='utf-8'))}

U = {}
for m in (v1,):
    nya = m.bygg(KAT)
    assert not (set(U) & set(nya)), set(U) & set(nya)
    U.update(nya)

if __name__ == '__main__':
    ok = True
    vilka = sys.argv[1:] or list(U)
    for k in vilka:
        ok = skriv_enhet(k, U[k], kor=True) and ok
    sys.exit(0 if ok else 1)
