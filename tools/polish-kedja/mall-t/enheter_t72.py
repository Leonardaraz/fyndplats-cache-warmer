#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""T72: färgval på en publicerad sida. Skriver varje värds filer och kör hasha.py + bygg-skrivplan.py per värd."""
import sys, json
SP = '/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad/t72'
sys.path.insert(0, SP)
from t72lib import skriv_enhet, ROT, RUNDA
import v1_t72

KAT = {e['huvud']: e['kategori'] for e in json.load(open(f'{SP}/enheter_t72.json', encoding='utf-8'))}
U = v1_t72.bygg(KAT)

def omordna_kallor(k):
    """Givarens tyska källa först, värdens text sist: importens viktrad (fraktvikten) ska hittas i givarens källa, inte i värdens egna spec-rad."""
    import re
    p = f'{ROT}/{RUNDA}/skriv/{k}/kallor.json'
    d = json.load(open(p, encoding='utf-8'))
    t = d[k]
    delar = re.split(r'(?m)^(?==== källa: )', t)
    delar = [x for x in delar if x.strip()]
    host = [x for x in delar if 'sidans tidigare' in x.split('\n', 1)[0] or 'sidans utkast' in x.split('\n', 1)[0]]
    ovriga = [x for x in delar if x not in host]
    ny = ''.join(x if x.endswith('\n') else x + '\n' for x in ovriga + host)
    d[k] = ny.rstrip('\n')
    json.dump(d, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    ok = True
    vilka = sys.argv[1:] or list(U)
    for k in vilka:
        omordna_kallor(k)
        ok = skriv_enhet(k, U[k], kor=True) and ok
    sys.exit(0 if ok else 1)
