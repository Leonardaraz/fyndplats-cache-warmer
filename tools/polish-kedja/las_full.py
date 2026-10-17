import json, sys, re, subprocess
SP='/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad'
sys.path.insert(0, SP+'/n100'); sys.path.insert(0, SP+'/familj')
import kor_lankar
full=json.load(open(SP+'/sweep/full_ids_1016.json'))
for k in sys.argv[1:]:
    fid=full.get(k) or k
    p=subprocess.run([sys.executable, SP+'/kor_wf.py','polish-mapping.yml','claude/seo-polering-runbook-review-uq6fwl','mode=las','wix_product_id='+fid],capture_output=True,text=True)
    rad=[x for x in p.stdout.strip().split('\n') if x.strip()][-1]
    r=json.loads(rad)
    text=kor_lankar.logg(r['id'])
    ut=[]; on=False
    for l in text.split('\n'):
        l2=re.sub(r'^\S+Z ','',l)
        if '\x1b[' in l2: continue
        if '=== Mappningsraden' in l2: on=True; continue
        if on and l2.startswith('==='): break
        if on: ut.append(l2)
    print('=====',k,r.get('conclusion')); print('\n'.join(ut)[:3000])
