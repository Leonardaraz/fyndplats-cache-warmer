import json, sys, re, subprocess
SP='/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad'
sys.path.insert(0, SP+'/n100'); sys.path.insert(0, SP+'/familj')
import kor_lankar
full=json.load(open(SP+'/sweep/full_ids_1016.json'))
for k in sys.argv[1:]:
    fid=full.get(k) or k
    p=subprocess.run([sys.executable, SP+'/kor_wf.py','polish-mapping.yml','claude/seo-polering-runbook-review-uq6fwl','mode=las','wix_product_id='+fid],capture_output=True,text=True)
    rad=[x for x in p.stdout.strip().split('\n') if x.strip()][-1]
    try: r=json.loads(rad)
    except Exception: print(k,'FEL',p.stdout[-300:],p.stderr[-300:]); continue
    text=kor_lankar.logg(r['id']) if r.get('id') else ''
    keep=[l for l in text.split('\n') if re.search(r'needsAiPolish|draftStatus|supplier"|reviewedAt|variants\b|"name"|slug',l)]
    print('=====',k,r.get('conclusion'))
    for l in keep[:14]: print('  ',re.sub(r'^\S+Z ','',l)[:200])
