import json, sys, re
SP='/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad'
sys.path.insert(0, SP+'/familj')
import kor_lankar
src=open(SP+'/n100/ghw.py',encoding='utf-8').read().split('\ndef main():')[0]
ns={'__name__':'ghw_lib'}
exec(compile(src,'ghw_lib','exec'),ns)
ids=sys.argv[2]; pos=sys.argv[1]
r=ns['dispatch_and_wait']('aosom-bildkandidater.yml',{'wix_ids':ids,'positioner':pos,'skarp':'true'},ref='claude/seo-polering-runbook-review-uq6fwl',timeout=900)
print(json.dumps({k:r.get(k) for k in ('ok','conclusion','id','url')}))
ANSI=re.compile(r'\x1b\[[0-9;]*m')
t=ANSI.sub('',kor_lankar.logg(r['id']))
for l in t.splitlines():
    l=re.sub(r'^\S+Z\s','',l)
    if 'KANDIDAT' in l or 'feed ' in l or 'HINDER' in l or 'uppladd' in l.lower() or 'fel' in l.lower():
        print(l[:300])
