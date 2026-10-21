#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""bygg_givare_t72.py: bygger rundkatalogen för givarnas svenska alt-texter (runda-t72-givare-alt) ur värdarnas givare_alt/tas_med,
och kör bygg-bildplan.py där. Givarens galleri blir de valda bilderna i vald ordning (etikett 1..n); sammanslagningens `bilder` är då 1..n."""
import json, os, subprocess, sys
SP = '/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad/t72'
sys.path.insert(0, SP)
import v1_t72
from t72lib import ROT, RUNDA, GATES
NAMN = os.environ.get('GIVARRUNDA', 'runda-t72-givare-alt')
mal = f'{ROT}/{NAMN}'
os.makedirs(mal, exist_ok=True)
U = v1_t72.bygg({})
ids, bilder, alt, kallor, merge = [], [], [], {}, []
for host, u in U.items():
    for donor, pos in (u.get('tas_med') or {}).items():
        g = f'{ROT}/{RUNDA}/skriv/{host}/givare'
        rader = [r.split('\t') for r in open(f'{g}/bilder.tsv', encoding='utf-8').read().splitlines() if r.strip()]
        fil = {r[1]: r[2] for r in rader if r[0] == donor}
        irad = [r for r in open(f'{g}/ids.tsv', encoding='utf-8').read().splitlines() if r.startswith(donor + '\t')][0].split('\t')
        ids.append(f"{donor}\t{irad[1]}\t(utkast, givare till {host})")
        valda = pos.split(',')
        for n, p in enumerate(valda, 1):
            bilder.append(f"{donor}\t{n}\t{fil[p]}")
            alt.append(f"{donor}\t{n}\t{u['givare_alt'][donor][str(n)]}")
        assert set(u['givare_alt'][donor]) == {str(i) for i in range(1, len(valda) + 1)}, (donor, u['givare_alt'][donor].keys(), valda)
        kallor.update(json.load(open(f'{g}/kallor.json', encoding='utf-8')))
        merge.append(dict(host=host, donor=donor, bilder=','.join(str(i) for i in range(1, len(valda) + 1)), kallpositioner=valda))
w = lambda fn, t: open(f'{mal}/{fn}', 'w', encoding='utf-8').write(t)
w('ids.tsv', '\n'.join(ids) + '\n')
w('bilder.tsv', '\n'.join(bilder) + '\n')
w('alt.tsv', '\n'.join(alt) + '\n')
w('foto-tal.txt', "# Tal som är AVLÄSTA ELLER RÄKNADE PÅ PRODUKTFOTOT, inte skrivna i den tyska källtexten.\n# Form: <kort> <tal> <vad som lästes av eller räknades>\n")
json.dump(kallor, open(f'{mal}/kallor.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(merge, open(f'{mal}/merge.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
r = subprocess.run([sys.executable, f'{GATES}/bygg-bildplan.py'], cwd=mal, capture_output=True, text=True)
print((r.stdout + r.stderr)[-3000:])
sys.exit(r.returncode)
