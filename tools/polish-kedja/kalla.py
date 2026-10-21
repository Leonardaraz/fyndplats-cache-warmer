#!/usr/bin/env python3
"""kalla.py <id8>...: skriver ut tyska källtexten (utan taggar) + varianter/val/lager."""
import json, re, sys, html
SP='/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad'
for k in sys.argv[1:]:
    d=json.load(open(f'{SP}/t15/data/{k}.json',encoding='utf-8'))
    t=re.sub(r'</(p|li|h[1-6]|tr|div)>','\n',d['html']); t=re.sub(r'<[^>]+>','',t); t=html.unescape(t); t=re.sub(r'\n\s*\n+','\n',t)
    print('=====',k,d['name'])
    print('slug:',d['slug'],'| vis:',d['visible'],'| bilder:',len(d['items']),'| var:',[(v['sku'],v['pris'],v.get('lager'),v['ch']) for v in d['variants']],'| val:',d['options'])
    print(t.strip()[:3800])
