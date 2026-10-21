#!/usr/bin/env python3
"""kolla308.py <slugfil>: varje rad "gammal-slug<TAB>förväntat mål (valfritt)" → HTTP-kod och Location (butikens cache kan svara 200 i timmar)."""
import subprocess, sys, concurrent.futures as cf
rows = [l.rstrip('\n').split('\t') for l in open(sys.argv[1], encoding='utf-8') if l.strip()]
def ett(r):
    s = r[0]
    p = subprocess.run(['curl', '-sS', '-o', '/dev/null', '--max-time', '40', '-w', '%{http_code} %{redirect_url}', f'https://www.fyndplats.se/produkt/{s}'], capture_output=True, text=True)
    kod, _, loc = p.stdout.partition(' ')
    return s, kod, loc.replace('https://www.fyndplats.se', ''), (r[1] if len(r) > 1 else '')
with cf.ThreadPoolExecutor(6) as ex:
    res = list(ex.map(ett, rows))
n308 = 0
for s, kod, loc, forv in res:
    ok = kod in ('308', '301') and (not forv or loc.startswith(forv))
    n308 += 1 if ok else 0
    print(('OK  ' if ok else 'INTE'), kod, s[:60], '->', loc[:90])
print(f'{n308} av {len(res)} svarar omdirigering till förväntat mål')
