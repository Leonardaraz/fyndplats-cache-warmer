#!/usr/bin/env python3
"""visa_aterlas.py <fil> [--alt] : läser ExecuteWixAPI-svaret fram till ,"pad" och skriver en kompakt sammanfattning."""
import json, sys, re
fil = sys.argv[1]
visa_alt = '--alt' in sys.argv
s = open(fil, encoding='utf-8').read()
i = s.find(',"pad"')
if i < 0:
    i = s.find(', "pad"')
assert i > 0, 'ingen pad-markör i filen (avkortad före?)'
# svaret kan vara omslutet av tecken före första '{'
a = s.find('{')
txt = s[a:i] + '}'
d = json.loads(txt)
print(d.get('SAMMANFATTNING'), '| allaSkiljer:', d.get('allaSkiljer'))
for r in d['rader']:
    print('=' * 70)
    print(r['kort'], 'LIKA' if r['LIKA'] else 'SKILJER', r['tecken'], 'vs', r['vantatTecken'], '| rev', r['revision'], '| visible', r['visible'])
    print('  namn:', r['name'])
    print('  slug:', r['slug'])
    seo = r.get('seo') or {}
    for t in (seo.get('tags') or []):
        if t.get('type') == 'title':
            print('  title:', t.get('children'))
        if t.get('type') == 'meta':
            pr = t.get('props') or {}
            print('  meta:', pr.get('name'), '|', (pr.get('content') or '')[:170])
    print('  ntags:', len(seo.get('tags') or []))
    print('  kat:', r['cats'])
    for o in r['options']:
        print('  option', o['n'], o['c'])
    print('  bilder:', len(r['items']))
    if visa_alt:
        for k, m in enumerate(r['items'], 1):
            print('   ', k, m['id'][:14], '|', m['alt'][:110])
    print('  varianter:', len(r['variants']))
    for v in r['variants']:
        print('   ', v['sku'], '| vis', v['vis'], '|', v['ch'], '|', v['pris'], '| lager', v.get('lager'))

if d.get('givare'):
    print('=' * 70)
    print('GIVARE:', ', '.join(f"{g['k']}:{'SYNLIG' if g['visible'] else 'dold'}" for g in d['givare']))
