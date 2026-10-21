#!/usr/bin/env python3
"""kor_logg.py <workflow.yml> <ref> <utfil> [nyckel=värde ...]: kör en workflow, väntar ut den och sparar jobbloggen (utan tidsstämplar) i <utfil>."""
import json, os, re, subprocess, sys
SP='/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad'
sys.path.insert(0, SP+'/familj')
import kor_lankar
wf, ref, ut = sys.argv[1:4]
p = subprocess.run([sys.executable, SP+'/kor_wf.py', wf, ref] + sys.argv[4:], capture_output=True, text=True)
try:
    r = json.loads(p.stdout.strip().splitlines()[-1])
except Exception:
    print('fel:', p.stdout[-400:], p.stderr[-400:]); sys.exit(1)
print({k: r.get(k) for k in ('ok', 'conclusion', 'id', 'url', 'sek', 'why')}, flush=True)
if not r.get('id'):
    sys.exit(1)
t = kor_lankar.logg(r['id'])
ANSI = re.compile(r'\x1b\[[0-9;]*m'); TS = re.compile(r'^\S+Z ')
t = '\n'.join(TS.sub('', ANSI.sub('', l.rstrip('\r'))) for l in t.split('\n'))
open(ut, 'w', encoding='utf-8').write(t)
print('logg sparad', len(t), 'tecken ->', ut)
