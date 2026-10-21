#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""@@P@@."""
import sys, json
SP = '/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad/@@P@@'
sys.path.insert(0, SP)
from @@P@@lib import skriv_enhet, ROT, RUNDA
import v1_@@P@@

KAT = {e['huvud']: e['kategori'] for e in json.load(open(f'{SP}/enheter_@@P@@.json', encoding='utf-8'))}
U = v1_@@P@@.bygg(KAT)

if __name__ == '__main__':
    ok = True
    vilka = sys.argv[1:] or list(U)
    for k in vilka:
        ok = skriv_enhet(k, U[k], kor=True) and ok
    sys.exit(0 if ok else 1)
