#!/usr/bin/env python3
# las_ids.py <utfil.json> <id8|fullid>...: läser mappningsraderna (polish-mapping.yml, läget las) parallellt, verifierar wixProductId
# i varje logg och sparar {id8: {...}} med mappningsfält och prisgrindens utfall. Artikelnummer skrivs aldrig ut (läget las har dem inte).
import json, sys, re, threading, concurrent.futures as cf
SP='/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad'
sys.path.insert(0, SP+'/familj')
import kor_lankar
src=open(SP+'/n100/ghw.py',encoding='utf-8').read().split('\ndef main():')[0]
ns={'__name__':'ghw_lib'}
exec(compile(src,'ghw_lib','exec'),ns)
full=json.load(open(SP+'/sweep/full_ids_1016.json'))
ut=sys.argv[1]
ids=[(a if len(a)==36 else full[a]) for a in sys.argv[2:]]
ANSI=re.compile(r'\x1b\[[0-9;]*m')
res={}
lock=threading.Lock()
def ett(fid):
    rad={'fel':'okänt'}
    for forsok in range(3):
        try:
            r=ns['dispatch_and_wait']('polish-mapping.yml',{'mode':'las','wix_product_id':fid},ref='claude/seo-polering-runbook-review-uq6fwl',timeout=600)
            text=ANSI.sub('',kor_lankar.logg(r['id'])) if r.get('id') else ''
            text='\n'.join(re.sub(r'^\S+Z ','',l) for l in text.split('\n'))
            m=re.search(r'"wixProductId":\s*"([^"]+)"',text)
            if not m or m.group(1)!=fid:
                rad={'fel':'förväxlad körning '+str(m.group(1)[:8] if m else None)}; continue
            i=text.rfind('=== Mappningsraden')
            sek=text[i:] if i>=0 else text
            # klipp bort workflowens städrader
            sek=sek.split('Post job cleanup')[0]
            rad={'conclusion':r.get('conclusion'),'text':sek[:4000]}
            break
        except Exception as e:
            rad={'fel':str(e)[:150]}
    with lock:
        res[fid[:8]]=rad
with cf.ThreadPoolExecutor(max_workers=5) as ex:
    list(ex.map(ett,ids))
json.dump(res,open(ut,'w'),ensure_ascii=False,indent=1)
print('klart',len(res))
