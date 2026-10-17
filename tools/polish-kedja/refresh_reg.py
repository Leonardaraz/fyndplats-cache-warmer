#!/usr/bin/env python3
"""refresh_reg.py <id8>...: skriver om registerposterna i n100/data.json ur färska t15/data/<id8>.json (samma form som tidigare poster)."""
import json, sys, shutil, os
SP='/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad'
p=f'{SP}/n100/data.json'
shutil.copyfile(p, p+'.bak-refresh')
reg=json.load(open(p,encoding='utf-8'))
for k in sys.argv[1:]:
    t=json.load(open(f'{SP}/t15/data/{k}.json',encoding='utf-8'))
    vs=t['variants']
    reg[k]=dict(
        fullid=t['fullid'], name=t['name'], slug=t['slug'], visible=t['visible'], revision=str(t.get('revision','')),
        html=t['html'], text=t['html'],
        items=[i['id'] for i in t['items']],
        variants=[f"{v['sku']}/{v['id']}/{v['pris']}/{str(v['vis']).lower()}" for v in vs],
        lager=sum((v.get('lager') or 0) for v in vs),
        alts_full=[i.get('alt','') for i in t['items']],
    )
    print(k,'uppdaterad:',reg[k]['name'][:50],reg[k]['lager'],len(reg[k]['items']),'bilder')
json.dump(reg,open(p,'w',encoding='utf-8'),ensure_ascii=False)
