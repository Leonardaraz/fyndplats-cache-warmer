#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""nyaord.py <rundakatalog> : ord i rundans html som inte förekommit i någon tidigare runda (misstänkta stavfel/påhitt)."""
import re, sys, glob, os, collections
ROT = '/home/user/fyndplats-cache-warmer/tools/polish-assets'
mal = os.path.abspath(sys.argv[1])
def ord_i(t):
    t = re.sub(r'<[^>]+>', ' ', t)
    return re.findall(r"[a-zåäöéüß]{3,}", t.lower())
vok = collections.Counter()
for p in glob.glob(f'{ROT}/runda-*/*.html') + glob.glob(f'{ROT}/runda-*/skriv/*/*.html'):
    if os.path.dirname(p) == mal or os.path.dirname(os.path.dirname(p)) == mal or p.startswith(mal + '/'):
        continue
    try:
        for w in set(ord_i(open(p, encoding='utf-8').read())):
            vok[w] += 1
    except Exception:
        pass
ny = collections.OrderedDict()
for p in sorted(glob.glob(f'{mal}/*.html')):
    for w in ord_i(open(p, encoding='utf-8').read()):
        if w not in vok:
            ny.setdefault(w, set()).add(os.path.basename(p)[:8])
print(len(vok), 'ord i tidigare rundor;', len(ny), 'nya ord i', mal)
for w, k in ny.items():
    print(f'  {w}  {",".join(sorted(k))}')
