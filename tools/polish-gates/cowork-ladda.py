#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# cowork-ladda.py (2026-10-22): från granskade bilder ur Cowork-svaret till Wix, i tre steg. Skriver ingenting i Wix själv.
#
#   urls <picks.json> --svar <svarfil> --ut <katalog>
#       Skriver <ut>/ladda/urls.json (en post per vald bild: nr, k, url) och skriver ut adresserna i omgångar om högst 25, färdiga att
#       klistra in i UploadImageToWixSite (imageUrls, alla i ETT anrop, siteId e6d27e90-4749-4720-9afe-0bbe91c1b3d3).
#   para <ids.txt> --ut <katalog>
#       ids.txt: Wix fil-id från uppladdningens svar, ett per rad i den ordning svaret kom. ☠️ Svaret ekar ingen käll-adress, så ordningen är
#       ingen bevisning: varje fil hämtas från Wix CDN och paras med sin lokala kandidat på md5. Skriver <ut>/ladda/par.json. Ett par som
#       saknas eller en md5 utan träff stoppar (exit 1).
#   kod <picks.json> --rader <rader.json> [--rader ...] --ut <katalog> [--per-korning 12]
#       Bygger ExecuteWixAPI-koden ur tools/polish-gates/skriv-fargbilder.js, en fil per körning (<ut>/ladda/skriv_<n>.js), med planen ifylld.
#       Koden är hela skriptet: den klistras in som `code` i ExecuteWixAPI (hasMutations true). Sidorna körs fyra i taget.
#
#   picks.json: { "<rad-nr>": [ { "k": <plats i svarets bilder, 1 = första>, "alt": "<svensk alt-text, 5–200 tecken>" }, ... ] }
#   Valet och optionen kommer ur raden (rader.json): färgrader → option Färg och färgens namn, storleksrader → option Storlek (eller raden
#   `opt`) och storlekens namn. Flera rader på samma sida samlas i EN plan (en skrivning per sida, annars krockar revisionerna).
#
# ☠️ Aldrig en bild utan granskning: picks.json är det en människa (eller jag, med ögonen) valt efter cowork-granska.py. Alt-texten beskriver
# bilden, nämner inget leverantörs- eller husmärke och ingen adress (samma spärr som skriv-fargbilder.js: FORBJUDET).
import hashlib, json, os, re, subprocess, sys, time

FORBJUDET = re.compile(r'https?:|www\.|\.(?:com|se|de)\b|homcom|outsunny|pawhut|aiyaplay|vinsetto|kleankin|zonekiz|sportnow|durhand|aosom|aliexpress|alibaba|vevor|succebuy|giantex|costway', re.I)
HERE = os.path.dirname(os.path.abspath(__file__))


def flaggor(a):
    ut = dict(pos=[], rader=[], ut=None, svar=None, per=12)
    i = 0
    while i < len(a):
        if a[i] == '--rader':
            ut['rader'].append(a[i + 1]); i += 2
        elif a[i] == '--ut':
            ut['ut'] = a[i + 1]; i += 2
        elif a[i] == '--svar':
            ut['svar'] = a[i + 1]; i += 2
        elif a[i] == '--per-korning':
            ut['per'] = int(a[i + 1]); i += 2
        else:
            ut['pos'].append(a[i]); i += 1
    return ut


def hitta_block(text):
    dec = json.JSONDecoder()
    ut, i = [], 0
    while True:
        j = text.find('[', i)
        if j < 0:
            break
        try:
            obj, end = dec.raw_decode(text, j)
        except ValueError:
            i = j + 1
            continue
        if isinstance(obj, list) and obj and all(isinstance(x, dict) and 'nr' in x for x in obj):
            ut.extend(obj)
            i = end
        else:
            i = j + 1
    return ut


def mal(r):
    if 'farg' in r:
        return 'Färg', re.sub(r' \(variant \d+\)$', '', r['farg'].split(' · ')[0]).strip()
    return r.get('opt', 'Storlek'), re.sub(r' \(variant \d+\)$', '', r['val']).strip()


def kolla_picks(picks):
    for nr, lista in picks.items():
        ks = [x['k'] for x in lista]
        if len(set(ks)) != len(ks):
            sys.exit('rad %s: samma k två gånger' % nr)
        for x in lista:
            alt = str(x.get('alt', '')).strip()
            if not 5 <= len(alt) <= 200 or FORBJUDET.search(alt):
                sys.exit('rad %s k%s: alt-texten duger inte (5–200 tecken, inga märken eller adresser): %s' % (nr, x['k'], alt[:40]))


def urls(F):
    picks = json.load(open(F['pos'][0], encoding='utf-8'))
    kolla_picks(picks)
    svar = {p['nr']: p for p in hitta_block(open(F['svar'], encoding='utf-8').read())}
    lista = []
    for nr, valda in sorted(picks.items(), key=lambda kv: int(kv[0])):
        b = svar[int(nr)]['bilder']
        for x in sorted(valda, key=lambda x: x['k']):
            if not 1 <= x['k'] <= len(b):
                sys.exit('rad %s: k%s finns inte (svaret har %d bilder)' % (nr, x['k'], len(b)))
            lista.append(dict(nr=int(nr), k=x['k'], url=b[x['k'] - 1]))
    d = F['ut'] + '/ladda'
    os.makedirs(d, exist_ok=True)
    json.dump(lista, open(d + '/urls.json', 'w'))
    print('%d bilder att ladda upp (%d rader)' % (len(lista), len(picks)))
    for i in range(0, len(lista), 25):
        print('\n# omgång %d (%d adresser), i den här ordningen:' % (i // 25 + 1, len(lista[i:i + 25])))
        print(json.dumps([x['url'] for x in lista[i:i + 25]]))


def para(F):
    ids = [l.strip() for l in open(F['pos'][0]) if l.strip()]
    d = F['ut'] + '/ladda'
    lista = json.load(open(d + '/urls.json'))
    lokala = {}
    for x in lista:
        f = '%s/svar/%d/%02d.img' % (F['ut'], x['nr'], x['k'])
        lokala[hashlib.md5(open(f, 'rb').read()).hexdigest()] = (x['nr'], x['k'])
    par, saknas, ejmatch = {}, [], []
    os.makedirs(d + '/wix', exist_ok=True)
    for fid in ids:
        f = '%s/wix/%s.jpg' % (d, fid[7:13])
        ok = False
        for _ in range(24):
            c = subprocess.run(['curl', '-sS', '--max-time', '40', '-o', f, '-w', '%{http_code}', 'https://static.wixstatic.com/media/' + fid], capture_output=True, text=True)
            if c.stdout.strip() == '200' and os.path.getsize(f) > 2000:
                ok = True
                break
            time.sleep(2.5)
        if not ok:
            saknas.append(fid[7:13]); continue
        m = lokala.get(hashlib.md5(open(f, 'rb').read()).hexdigest())
        if m:
            par['%d:%d' % m] = fid
        else:
            ejmatch.append(fid[7:13])
    json.dump(par, open(d + '/par.json', 'w'))
    print('%d av %d filer paras med sin kandidat på md5; ej hämtade %s; utan md5-träff %s' % (len(par), len(lista), saknas or '-', ejmatch or '-'))
    if len(par) != len(lista) or saknas or ejmatch:
        sys.exit(1)


def kod(F):
    picks = json.load(open(F['pos'][0], encoding='utf-8'))
    kolla_picks(picks)
    rader = {}
    for fil in F['rader']:
        for r in json.load(open(fil, encoding='utf-8')):
            rader[r['nr']] = r
    par = json.load(open(F['ut'] + '/ladda/par.json'))
    sidor = {}
    for nr, valda in sorted(picks.items(), key=lambda kv: int(kv[0])):
        r = rader[int(nr)]
        axel, val = mal(r)
        s = sidor.setdefault(r['pid'], dict(id=r['pid'], axel=axel, tillagg=[]))
        if s['axel'] != axel:
            sys.exit('sidan %s har rader på två axlar (%s och %s): kör dem var för sig' % (r['id8'], s['axel'], axel))
        for x in sorted(valda, key=lambda x: x['k']):
            fid = par.get('%s:%d' % (nr, x['k']))
            if not fid:
                sys.exit('rad %s k%d saknar uppladdad fil (kör para först)' % (nr, x['k']))
            s['tillagg'].append(dict(fil=fid, alt=x['alt'].strip(), val=val))
    mall = open(HERE + '/skriv-fargbilder.js', encoding='utf-8').read()
    gammal = 'const PLANER = [{ id: "", tillagg: [] }];'
    if gammal not in mall:
        sys.exit('skriv-fargbilder.js saknar planraden: ' + gammal)
    sidlista = list(sidor.values())
    d = F['ut'] + '/ladda'
    os.makedirs(d, exist_ok=True)
    n = 0
    for i in range(0, len(sidlista), F['per']):
        grupp = sidlista[i:i + F['per']]
        rader_js = ['const PLANER = [']
        for s in grupp:
            rader_js.append('    { id: %s, axel: %s, tillagg: [' % (json.dumps(s['id']), json.dumps(s['axel'], ensure_ascii=False)))
            for t in s['tillagg']:
                rader_js.append('      { fil: %s, alt: %s, val: %s },' % (json.dumps(t['fil']), json.dumps(t['alt'], ensure_ascii=False), json.dumps(t['val'], ensure_ascii=False)))
            rader_js.append('    ] },')
        rader_js.append('  ];')
        n += 1
        fil = '%s/skriv_%d.js' % (d, n)
        open(fil, 'w', encoding='utf-8').write(mall.replace(gammal, '\n'.join(rader_js), 1))
        print('%s: %d sidor, %d bilder' % (fil, len(grupp), sum(len(s['tillagg']) for s in grupp)))
    ids = ','.join(s['id'] for s in sidlista)
    print('\nvariantbild.yml efteråt (lage skarp), ids:\n' + ids)


if __name__ == '__main__':
    if len(sys.argv) < 3 or sys.argv[1] not in ('urls', 'para', 'kod'):
        print(__doc__ or 'användning: cowork-ladda.py urls|para|kod ...'); sys.exit(2)
    F = flaggor(sys.argv[2:])
    if not F['ut'] or not F['pos']:
        print('--ut och en positionsfil krävs'); sys.exit(2)
    {'urls': urls, 'para': para, 'kod': kod}[sys.argv[1]](F)
