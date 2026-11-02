#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Kör leverantorslankar.yml för en lista Wix-produkt-id och dekrypterar svaret lokalt.

Användning: kor_lankar.py <idfil> <utfil.json>
  idfil: Wix-produkt-id (med bindestreck), åtskilda av mellanslag, högst 1 000.
  utfil.json: dekrypterat svar {lankar, utanMappning, utanProdukt, ogiltiga} — INNEHÅLLER ARTIKELNUMMER.

☠️ Artikelnummer skrivs aldrig ut här, och utfilen ligger bara i scratchpad (aldrig i repot).
Loggen i GitHub är publik: där finns bara chiffertexten, som bara den privata nyckeln här kan öppna.
"""
import base64, json, os, re, subprocess, sys, tempfile, time

REPO = 'Leonardaraz/fyndplats-cache-warmer'
HERE = os.path.dirname(os.path.abspath(__file__))
WF = 'leverantorslankar.yml'
REF = 'main'


def gh(args, body=None, method=None, raw=False):
    cmd = ['gh', 'api'] + (['-X', method] if method else []) + args
    r = subprocess.run(cmd + (['--input', '-'] if body is not None else []),
                       input=json.dumps(body) if body is not None else None, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout)[:500])
    if raw:
        return r.stdout
    t = r.stdout.strip()
    return json.loads(t) if t else {}


def kor(ids_text):
    kuvert = open(f'{HERE}/publik.b64').read().strip()
    before = {r['id'] for r in gh([f'repos/{REPO}/actions/workflows/{WF}/runs?event=workflow_dispatch&per_page=10']).get('workflow_runs', [])}
    gh([f'repos/{REPO}/actions/workflows/{WF}/dispatches'], {'ref': REF, 'inputs': {'kuvert': kuvert, 'produkter': ids_text}}, method='POST')
    run = None
    for _ in range(60):
        time.sleep(3)
        for r in gh([f'repos/{REPO}/actions/workflows/{WF}/runs?event=workflow_dispatch&per_page=10']).get('workflow_runs', []):
            if r['id'] not in before:
                run = r
                break
        if run:
            break
    if not run:
        raise RuntimeError('hittade ingen ny körning')
    rid = run['id']
    t0 = time.time()
    while time.time() - t0 < 900:
        r = gh([f'repos/{REPO}/actions/runs/{rid}'])
        if r.get('status') == 'completed':
            if r.get('conclusion') != 'success':
                raise RuntimeError(f"körningen {rid} slutade {r.get('conclusion')} ({r.get('html_url')})")
            return rid
        time.sleep(8)
    raise RuntimeError('timeout')


def logg(rid):
    jobs = gh([f'repos/{REPO}/actions/runs/{rid}/jobs']).get('jobs', [])
    jid = jobs[0]['id']
    # gh api vägrar omdirigeringen till blob-värden: curl via proxyn ger 302 -> signerad adress, som hämtas utan inloggning.
    h = subprocess.run(['curl', '-sS', '-o', '/dev/null', '-D', '-', f'https://api.github.com/repos/{REPO}/actions/jobs/{jid}/logs'],
                       capture_output=True, text=True).stdout
    m = re.search(r'^location:\s*(\S+)', h, re.M | re.I)
    if m:
        r = subprocess.run(['curl', '-sS', m.group(1)], capture_output=True, text=True)
    elif re.search(r'^HTTP/\S+ 200 OK', h, re.M):
        # 2026-11-01: proxyn svarar direkt med loggen (200) i stället för en 302 till blob-värden.
        r = subprocess.run(['curl', '-sS', f'https://api.github.com/repos/{REPO}/actions/jobs/{jid}/logs'], capture_output=True, text=True)
    else:
        raise RuntimeError('loggen gav ingen omdirigering')
    if r.returncode != 0 or not r.stdout:
        raise RuntimeError('loggnedladdningen föll')
    return r.stdout


TS = re.compile(r'^\S+Z ')


def kuvert_ur_logg(text):
    rader = [TS.sub('', r.rstrip('\r')) for r in text.split('\n')]
    losen = next((r.split('losen:', 1)[1].strip() for r in rader if r.startswith('losen:')), None)
    if losen is None or 'data-borjan' not in rader or 'data-slut' not in rader:
        raise RuntimeError('hittade inget kuvert i loggen')
    a, b = rader.index('data-borjan'), rader.index('data-slut')
    return losen, ''.join(x.strip() for x in rader[a + 1:b])


def dekryptera(text, utfil):
    losen, data = kuvert_ur_logg(text)
    with tempfile.TemporaryDirectory() as d:
        open(f'{d}/losen.enc', 'wb').write(base64.b64decode(losen))
        open(f'{d}/data.enc', 'wb').write(base64.b64decode(data))
        r = subprocess.run(['openssl', 'pkeyutl', '-decrypt', '-inkey', f'{HERE}/privat.pem', '-pkeyopt', 'rsa_padding_mode:oaep',
                            '-pkeyopt', 'rsa_oaep_md:sha256', '-in', f'{d}/losen.enc', '-out', f'{d}/losen.txt'], capture_output=True)
        if r.returncode != 0:
            raise RuntimeError('RSA-dekrypteringen föll')
        r = subprocess.run(['openssl', 'enc', '-d', '-aes-256-cbc', '-pbkdf2', '-salt', '-pass', f'file:{d}/losen.txt',
                            '-in', f'{d}/data.enc', '-out', f'{d}/ut.json'], capture_output=True)
        if r.returncode != 0:
            raise RuntimeError('AES-dekrypteringen föll')
        open(utfil, 'wb').write(open(f'{d}/ut.json', 'rb').read())
    os.chmod(utfil, 0o600)


if __name__ == '__main__':
    ids = open(sys.argv[1]).read().strip()
    rid = kor(ids)
    print('körning klar:', rid, flush=True)
    text = logg(rid)
    dekryptera(text, sys.argv[2])
    j = json.load(open(sys.argv[2]))
    print({k: (len(v) if isinstance(v, (list, dict)) else v) for k, v in j.items()})
