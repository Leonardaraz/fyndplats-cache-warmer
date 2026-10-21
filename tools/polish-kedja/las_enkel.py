#!/usr/bin/env python3
"""las_enkel.py <id8>...: läser mappningsraden (polish-mapping.yml, läget las) för varje id8 och skriver np/ds/supplier/saldo/synk. Fullt id ur t15/data/<id8>.json."""
import json, sys, re, threading, concurrent.futures as cf
SP='/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad'
sys.path.insert(0, SP+'/familj')
import kor_lankar
src=open(SP+'/n100/ghw.py',encoding='utf-8').read().split('\ndef main():')[0]
ns={'__name__':'ghw_lib'}
exec(compile(src,'ghw_lib','exec'),ns)
ANSI=re.compile(r'\x1b\[[0-9;]*m')
def f(text,namn):
    r=re.search(r'"%s":\s*(null|true|false|"[^"]*"|-?\d+(?:\.\d+)?)'%namn,text)
    return r.group(1) if r else None
def ett(k):
    try:
        full=json.load(open(f'{SP}/t15/data/{k}.json',encoding='utf-8'))['fullid']
    except Exception:
        full=json.load(open(f'{SP}/sweep/full_ids_1016.json'))[k]
    rad={'id8':k,'fel':'okänt'}
    for forsok in range(3):
        try:
            r=ns['dispatch_and_wait']('polish-mapping.yml',{'mode':'las','wix_product_id':full},ref='claude/seo-polering-runbook-review-uq6fwl',timeout=600)
            if not r.get('ok'):
                rad={'id8':k,'fel':'körning '+str(r.get('conclusion') or r.get('why'))}; continue
            text=ANSI.sub('',kor_lankar.logg(r['id']))
            wid=f(text,'wixProductId')
            if wid is None or wid.strip('"')!=full:
                rad={'id8':k,'fel':'förväxlad körning'}; continue
            rad={'id8':k,'np':f(text,'needsAiPolish'),'ds':f(text,'draftStatus'),'sup':f(text,'supplier'),'qty':f(text,'aosomSyncedQty'),'syn':f(text,'aosomSyncedAt')}
            break
        except Exception as e:
            rad={'id8':k,'fel':str(e)[:150]}
    return rad
with cf.ThreadPoolExecutor(max_workers=4) as ex:
    for rad in ex.map(ett, sys.argv[1:]):
        print(json.dumps(rad,ensure_ascii=False),flush=True)
