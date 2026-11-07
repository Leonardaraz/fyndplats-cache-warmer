#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Dispatchar en workflow och läser utfallet ur JOBBETS LOGG, inte ur körningens status.
GitHubs status-API fastnade på 'queued' i över en kvart 2026-11-04 fast jobben var klara (loggen finns).
Användning: ghd.py <workflow.yml> '<json-inputs>' [timeout_s]"""
import json, subprocess, sys, time, os, datetime

REPO = 'Leonardaraz/fyndplats-cache-warmer'
REF = os.environ.get('GHW_REF', 'claude/seo-polering-runbook-review-uq6fwl')


def gh(args, body=None, method=None, check=True):
    cmd = ['gh', 'api'] + (['-X', method] if method else []) + args
    for n in range(5):
        r = subprocess.run(cmd + (['--input', '-'] if body is not None else []),
                           input=json.dumps(body) if body is not None else None,
                           capture_output=True, text=True)
        if r.returncode == 0:
            return r.stdout
        fel = r.stderr + r.stdout
        if method == 'POST' or not any(k in fel for k in ('502', '503', '504', 'timed out', 'Gateway', 'reset')):
            if check:
                raise RuntimeError(fel[:500])
            return ''
        time.sleep(4 * (n + 1))
    return ''


def rad(m):
    print(datetime.datetime.utcnow().strftime('%H:%M:%S'), m, flush=True)


wf, inputs = sys.argv[1], json.loads(sys.argv[2])
timeout = int(sys.argv[3]) if len(sys.argv) > 3 else 1500


def ids():
    return [r['id'] for r in json.loads(gh([f'repos/{REPO}/actions/workflows/{wf}/runs?per_page=10']))['workflow_runs']]


before = set(ids())
gh([f'repos/{REPO}/actions/workflows/{wf}/dispatches'], {'ref': REF, 'inputs': inputs}, method='POST')
t0 = time.time()
new = None
while time.time() - t0 < 90 and not new:
    time.sleep(4)
    nu = [i for i in ids() if i not in before]
    if nu:
        new = max(nu)
if not new:
    rad('hittade ingen ny körning')
    sys.exit(3)
rad(f'körning {new}')
jid = None
while time.time() - t0 < 120 and not jid:
    js = json.loads(gh([f'repos/{REPO}/actions/runs/{new}/jobs'])).get('jobs', [])
    if js:
        jid = js[0]['id']
    else:
        time.sleep(4)
rad(f'jobb {jid}')
log = ''
SLUT = ('Post job cleanup', 'Complete job')
while time.time() - t0 < timeout:
    time.sleep(12)
    log = gh([f'repos/{REPO}/actions/jobs/{jid}/logs'], check=False)
    if any(s in log for s in SLUT):
        break
if not any(s in log for s in SLUT):
    rad('TIMEOUT: loggen visar inget slut')
    sys.exit(4)
tail = [l[29:] if len(l) > 29 and l[:4] == '2026' else l for l in log.splitlines()]
SKIP = ('git ', 'extraheader', 'submodule', 'Node.js', 'orphan', 'safe.directory', 'core.sshCommand', 'includeIf')
bra = [l for l in tail if l.strip() and not any(k in l for k in SKIP)]
print('\n'.join(bra[-45:]))
fel = [l for l in tail if '##[error]' in l or 'Process completed with exit code' in l]
rad('FEL: ' + ' | '.join(fel[:3]) if fel else 'KLAR utan felrad')
sys.exit(2 if fel else 0)
