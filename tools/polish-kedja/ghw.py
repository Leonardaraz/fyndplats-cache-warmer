#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Startar och väntar ut GitHub Actions-workflows för poleringen, stegvis och i ordning.

Användning:
  ghw.py write  <runda> <plan_sha256> <läge>[,<läge>...]      (polish-write.yml: torr, skriv, verifiera, stampla)
  ghw.py bilder <runda> <plan_sha256> <läge>[,<läge>...]      (polish-bilder.yml: torr, skriv, verifiera)
  ghw.py merge  <fil.json> [--byt-direkt]                      (aosom-sammanslagning.yml: plan sedan byt, per rad)
      fil.json: lista av {behall, utkast, farg_utkast?, storlek_utkast?, farg_behall?, storlek_behall?, omdirigera?, sku?, bilder?}
  ghw.py run <workflow.yml> <json-med-inputs>                  (valfri workflow, en körning)

Skriver en rad per steg. Avbryter vid första misslyckade steg (utom merge, som går vidare till nästa rad).
polish-write och polish-bilder delar concurrency-grupp, så stegen startas ett i taget.
"""
import json, subprocess, sys, time, datetime, concurrent.futures, threading

REPO = 'Leonardaraz/fyndplats-cache-warmer'
import os
REF = os.environ.get('GHW_REF', 'claude/seo-polering-runbook-review-uq6fwl')


def gh(args, body=None, method=None):
    cmd = ['gh', 'api'] + (['-X', method] if method else []) + args
    # ☠️ Ett tillfälligt 5xx från GitHub (504 mitt i väntan, 2026-10-14) fällde hela ghw-körningen medan workflow-körningen
    # levde vidare. Läsningar försöks därför om; en POST (dispatch) försöks aldrig om, för den kan ha gått igenom.
    forsok = 1 if method == 'POST' else 6
    for n in range(forsok):
        if body is not None:
            r = subprocess.run(cmd + ['--input', '-'], input=json.dumps(body), capture_output=True, text=True)
        else:
            r = subprocess.run(cmd, capture_output=True, text=True)
        if r.returncode == 0:
            break
        fel = (r.stderr or r.stdout)
        if n + 1 < forsok and any(k in fel for k in ('HTTP 502', 'HTTP 503', 'HTTP 504', 'timed out', 'Gateway', 'respond to your request in time', 'connection reset')):
            time.sleep(5 * (n + 1))
            continue
        raise RuntimeError(fel[:600])
    t = r.stdout.strip()
    return json.loads(t) if t else {}


def runs_for(wf):
    d = gh([f'repos/{REPO}/actions/workflows/{wf}/runs?event=workflow_dispatch&per_page=10'])
    return d.get('workflow_runs', [])


_LAS = threading.Lock()


def dispatch_and_wait(wf, inputs, ref=REF, timeout=1500, label=''):
    # ☠️ Starten och identifieringen av den nya körningen är EN kritisk sektion. Utan låset
    # tog tre trådar som startade varsin körning samma sekund alla den nyaste körningen, och
    # raden i en körning som FALLIT rapporterades som OK (N140, 834c9648: plan och byt föll
    # på namnet, summeringen sa ok). Ett svar utan fel är inget kvitto: läs sidan i Wix.
    with _LAS:
        before = {r['id'] for r in runs_for(wf)}
        t0 = time.time()
        gh([f'repos/{REPO}/actions/workflows/{wf}/dispatches'], {'ref': ref, 'inputs': inputs}, method='POST')
        run = None
        for _ in range(60):
            time.sleep(3)
            for r in runs_for(wf):
                if r['id'] not in before:
                    run = r
                    break
            if run:
                break
    if not run:
        return {'ok': False, 'why': 'hittade ingen ny körning', 'url': ''}
    rid = run['id']
    klara = 0
    while time.time() - t0 < timeout:
        r = gh([f'repos/{REPO}/actions/runs/{rid}'])
        # ☠️ GitHub lämnar ibland körningens status på in_progress i flera minuter (uppmätt 2026-10-14: sju till åtta minuter,
        # två gånger på en timme) fast jobbets alla steg är klara. Då räknas körningen som klar när varje jobb har slutat,
        # två avläsningar i följd, och utfallet läses ur jobben.
        if r.get('status') != 'completed':
            try:
                jobs = gh([f'repos/{REPO}/actions/runs/{rid}/jobs']).get('jobs', [])
                if jobs and all(j.get('status') == 'completed' for j in jobs):
                    klara += 1
                else:
                    klara = 0
                if klara >= 2:
                    r = dict(r)
                    r['status'] = 'completed'
                    r['conclusion'] = 'success' if all(j.get('conclusion') == 'success' for j in jobs) else 'failure'
            except Exception:
                klara = 0
        if r.get('status') == 'completed':
            ok = r.get('conclusion') == 'success'
            res = {'ok': ok, 'conclusion': r.get('conclusion'), 'url': r.get('html_url'), 'id': rid,
                   'sek': int(time.time() - t0)}
            if not ok:
                try:
                    jobs = gh([f'repos/{REPO}/actions/runs/{rid}/jobs'])
                    fails = []
                    for j in jobs.get('jobs', []):
                        for s in j.get('steps', []):
                            if s.get('conclusion') == 'failure':
                                fails.append(f"{j.get('name')} / {s.get('name')}")
                    res['felsteg'] = fails
                    res['job_id'] = [j.get('id') for j in jobs.get('jobs', [])]
                except Exception as e:
                    res['felsteg'] = [str(e)[:200]]
            return res
        time.sleep(8)
    return {'ok': False, 'why': 'timeout', 'url': run.get('html_url'), 'id': rid}


def rad(msg):
    print(datetime.datetime.utcnow().strftime('%H:%M:%S'), msg, flush=True)


def cmd_write(wf, runda, sha, lagen):
    for lage in lagen.split(','):
        rad(f'{wf} {runda} {lage} ...')
        r = dispatch_and_wait(wf, {'runda': runda, 'plan_sha256': sha, 'lage': lage})
        rad(f'  -> {"OK" if r["ok"] else "FEL"} {lage} {r.get("sek", "")}s {r.get("url", "")} {r.get("felsteg", r.get("why", ""))}')
        if not r['ok']:
            sys.exit(2)


def merge_inputs(m, mode):
    i = {'mode': mode, 'behall': m['behall'], 'utkast': m['utkast'],
         'farg_utkast': m.get('farg_utkast', ''), 'storlek_utkast': m.get('storlek_utkast', ''),
         'farg_behall': m.get('farg_behall', ''), 'storlek_behall': m.get('storlek_behall', ''),
         'omdirigera': m.get('omdirigera', 'nej'), 'sku': m.get('sku', ''), 'bilder': m.get('bilder', '')}
    return i


def cmd_merge(fil, direkt):
    rader = json.load(open(fil, encoding='utf-8'))
    # rader med samma behall körs i följd; olika behall parallellt
    per = {}
    for m in rader:
        per.setdefault(m['behall'], []).append(m)

    def kor(rs):
        ut = []
        for m in rs:
            nm = f"{m['behall'][:8]}<-{m['utkast'][:8]}"
            try:
                if not direkt:
                    p = dispatch_and_wait('aosom-sammanslagning.yml', merge_inputs(m, 'plan'), timeout=600)
                    rad(f'  plan {nm}: {"OK" if p["ok"] else "FEL"} {p.get("url", "")} {p.get("felsteg", p.get("why", ""))}')
                    if not p['ok']:
                        ut.append((nm, 'plan-fel', p))
                        continue
                b = dispatch_and_wait('aosom-sammanslagning.yml', merge_inputs(m, 'byt'), timeout=900)
                rad(f'  byt  {nm}: {"OK" if b["ok"] else "FEL"} {b.get("url", "")} {b.get("felsteg", b.get("why", ""))}')
                ut.append((nm, 'ok' if b['ok'] else 'byt-fel', b))
            except Exception as e:
                rad(f'  {nm}: UNDANTAG {str(e)[:300]}')
                ut.append((nm, 'undantag', {}))
        return ut

    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as ex:
        res = list(ex.map(kor, per.values()))
    flat = [x for r in res for x in r]
    rad('SAMMANFATTNING: ' + ', '.join(f'{n}={s}' for n, s, _ in flat))
    if any(s != 'ok' for _, s, _ in flat):
        sys.exit(2)


def main():
    a = sys.argv[1:]
    if not a:
        print(__doc__)
        sys.exit(1)
    if a[0] == 'write':
        cmd_write('polish-write.yml', a[1], a[2], a[3])
    elif a[0] == 'bilder':
        cmd_write('polish-bilder.yml', a[1], a[2], a[3])
    elif a[0] == 'merge':
        cmd_merge(a[1], '--byt-direkt' in a)
    elif a[0] == 'run':
        r = dispatch_and_wait(a[1], json.loads(a[2]))
        rad(json.dumps(r, ensure_ascii=False))
        sys.exit(0 if r['ok'] else 2)
    else:
        print(__doc__)
        sys.exit(1)


main()
