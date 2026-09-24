#!/usr/bin/env python3
"""Mekanisk live-koll av en runda: JSON-LD (namn, pris, InStock, brödsmula),
<title> och metabeskrivning mot seo.tsv, och varje alt-text ur alt.tsv.

Kompletterar livegrind.py (orddiff, homoglyfer, sid- och alt-svep) med det
livegrind inte tittar på: att sidan går att köpa (InStock), att brödsmulan
ligger i en av rundans kategorier, och att varje alt-text ur alt.tsv faktiskt
står på sidan. Låg i en sessions scratchpad under N36–N56 och flyttades hit
2026-09-24, när live-kontrollen blev rundans enda katalogsvep.

ANVÄNDNING (från rundans katalog, efter hamta-live.sh):
  python3 ../../polish-gates/livekoll.py [pris]
Med [pris] kontrolleras också att varje sida visar exakt det priset.
Skriver ingenting; exit 1 om någon sida faller."""
import re, html, json, sys

def tsv(fn, n):
    out = {}
    for l in open(fn, encoding='utf-8'):
        l = l.rstrip('\n')
        if not l.strip():
            continue
        p = l.split('\t')
        out.setdefault(p[0], []).append(p[1:n])
    return out

namn = {k: v[0][0] for k, v in tsv('namn.tsv', 2).items()}
seo = {k: v[0] for k, v in tsv('seo.tsv', 3).items()}
alt = tsv('alt.tsv', 3)
kat = {k: [x.strip() for x in v[0][0].split('+')] for k, v in tsv('kategori.tsv', 2).items()}
ids = [l.split()[0] for l in open('slugs.txt', encoding='utf-8') if l.strip()]
PRIS = sys.argv[1] if len(sys.argv) > 1 else None

fel = 0
altTot = altOk = 0
for k in ids:
    s = open(f'live/{k}.html', encoding='utf-8').read()
    prod = crumb = None
    for blk in re.findall(r'<script type="application/ld\+json">(.*?)</script>', s, re.S):
        try:
            o = json.loads(blk)
        except Exception:
            continue
        for x in (o if isinstance(o, list) else [o]):
            if x.get('@type') == 'Product':
                prod = x
            if x.get('@type') == 'BreadcrumbList':
                crumb = x
    rad = []
    if not prod:
        rad.append('INGEN Product-JSON-LD'); 
    else:
        if prod.get('name') != namn[k]:
            rad.append(f"namn skiljer: {prod.get('name')!r}")
        offers = prod.get('offers') or {}
        if isinstance(offers, list):
            offers = offers[0] if offers else {}
        av = str(offers.get('availability', ''))
        pr = str(offers.get('price', ''))
        if not av.endswith('InStock'):
            rad.append(f'availability {av!r}')
        if PRIS and pr not in (PRIS, PRIS + '.00', PRIS + '.0'):
            rad.append(f'pris {pr!r}')
    t = re.search(r'<title>(.*?)</title>', s, re.S)
    d = re.search(r'<meta name="description" content="(.*?)"', s)
    tt = html.unescape(t.group(1)) if t else None
    dd = html.unescape(d.group(1)) if d else None
    if tt != seo[k][0]:
        rad.append(f'title skiljer: {tt!r}')
    if dd != seo[k][1]:
        rad.append(f'meta skiljer: {dd!r}')
    livealts = set(html.unescape(a) for a in re.findall(r'alt="([^"]*)"', s))
    for pos, a in alt.get(k, []):
        altTot += 1
        if a in livealts:
            altOk += 1
        else:
            rad.append(f'alt {pos} saknas: {a!r}')
    steg = [e.get('name') for e in (crumb or {}).get('itemListElement', [])]
    if not crumb or len(steg) < 3 or steg[1] not in kat[k]:
        rad.append(f'brödsmula {steg!r} (väntat en av {kat[k]!r})')
    if rad:
        fel += 1
    print(f"{k}  {'OK ' if not rad else 'FEL'}  brödsmula={steg[1] if len(steg) > 1 else None!r}  pris={pr if prod else None}  " + ('; '.join(rad)))
print(f'SAMMANFATTNING: {len(ids) - fel} av {len(ids)} OK, alt-texter {altOk} av {altTot}')
sys.exit(1 if fel else 0)
