#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""jfr_aterlas.py <rundkatalog> <svarfil>: jämför återläsningen (ExecuteWixAPI-svaret från `bygg_aterlas.py`) med rundans filer.

Svarsfilen är det verktyget sparade (svaret fram till `,"pad"`). Per produkt prövas:
  texten LIKA (FNV-hash och teckenantal mot facit), namn mot namn.tsv, adress mot slugs.txt, SEO-titel och meta mot seo.tsv,
  synlighet, bildordning och alt-texter mot nyttolast-media.json, en variant med sku.tsv:s SKU, synlig och med utkastets pris
  (ids.tsv), och kategorierna: planens (kategori.tsv) plus All Products. En kategori som inte är planens skrivs som EXTRA
  (importens länk, som kategori-bort tar bort) och räknas som fel först med --strikt.
Skriver bara kort-id, utfall och antal. Exit 1 om något annat än extra kategorier avviker."""
import io
import json
import os
import re
import sys

rot, fil = sys.argv[1], sys.argv[2]
strikt = '--strikt' in sys.argv


def tsv(namn):
    ut = {}
    for rad in io.open(os.path.join(rot, namn), encoding='utf-8'):
        d = rad.rstrip('\n').split('\t')
        if len(d) >= 2 and re.match(r'^[0-9a-f]{8}$', d[0]):
            ut[d[0]] = d[1:]
    return ut


s = io.open(fil, encoding='utf-8').read()
i = s.find(',"pad"')
if i < 0:
    i = s.find(', "pad"')
assert i > 0, 'ingen pad-markör i filen (avkortad före?)'
D = json.loads(s[s.find('{'):i] + '}')
namn, seo, sku, kat, ids = tsv('namn.tsv'), tsv('seo.tsv'), tsv('sku.tsv'), tsv('kategori.tsv'), tsv('ids.tsv')
slugs = {l.split()[0]: l.split()[1] for l in io.open(os.path.join(rot, 'slugs.txt'), encoding='utf-8') if l.strip()}
media = json.load(io.open(os.path.join(rot, 'nyttolast-media.json'), encoding='utf-8'))
print(D.get('SAMMANFATTNING'), '| allaSkiljer:', D.get('allaSkiljer'))
fel_totalt = 0
for r in D['rader']:
    k = r['kort']
    fel, extra = [], []
    if not r['LIKA']:
        fel.append(f"texten skiljer ({r['tecken']} mot {r['vantatTecken']} tecken)")
    if r['name'] != namn[k][0]:
        fel.append('namnet skiljer')
    if r['slug'] != slugs[k]:
        fel.append(f"adressen skiljer ({r['slug']})")
    tags = (r.get('seo') or {}).get('tags') or []
    titel = next((t.get('children') for t in tags if t.get('type') == 'title'), None)
    meta = next(((t.get('props') or {}).get('content') for t in tags if t.get('type') == 'meta' and (t.get('props') or {}).get('name') == 'description'), None)
    if titel != seo[k][0]:
        fel.append('SEO-titeln skiljer')
    if meta != seo[k][1]:
        fel.append('SEO-metan skiljer')
    if not r['visible']:
        fel.append('sidan är inte synlig')
    plan = media[k]
    if [m['id'] for m in r['items']] != [m['id'] for m in plan]:
        fel.append(f"bildordningen skiljer ({len(r['items'])} mot {len(plan)} bilder)")
    elif [m['alt'] for m in r['items']] != [m['altText'] for m in plan]:
        fel.append('alt-texterna skiljer')
    vs = r['variants']
    pris = re.match(r'^(\d+)', ids[k][1]).group(1)
    if len(vs) != 1:
        fel.append(f'{len(vs)} varianter')
    else:
        if vs[0]['sku'] != sku[k][0]:
            fel.append(f"SKU:n skiljer ({vs[0]['sku']})")
        if not vs[0]['vis']:
            fel.append('varianten är inte synlig')
        if str(vs[0]['pris']) != pris:
            fel.append(f"priset skiljer ({vs[0]['pris']} mot {pris})")
    vanta = set(n.strip() for n in kat[k][0].split(' + ')) | {'All Products'}
    har = set(r['cats'])
    if vanta - har:
        fel.append('kategorier saknas: ' + ', '.join(sorted(vanta - har)))
    extra = sorted(har - vanta)
    if extra and strikt:
        fel.append('extra kategorier: ' + ', '.join(extra))
    fel_totalt += len(fel)
    print(k, 'OK' if not fel else 'FEL', '| bilder', len(r['items']), '| rev', r['revision'], '| pris', vs[0]['pris'] if vs else None,
          '| extra kategorier: ' + ', '.join(extra) if extra else '', '|', '; '.join(fel))
print('FEL TOTALT:', fel_totalt)
sys.exit(1 if fel_totalt else 0)
