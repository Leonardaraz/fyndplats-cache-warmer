#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generell byggare för arbetskataloger per enhet (ny sida eller sida med syskon).

Användning: bygg_enhet.py <rundnamn> <enheter.json> [--utan-ark]
  enheter.json: lista av {huvud, syskon:[{id8, varde}], axel, kategori, noter, saldo:{id8:n}, pris:{id8:n}, publicerad:bool}
  data.json (samma katalog) har källdata per id8.
Skriver tools/polish-assets/<rundnamn>/skriv/<huvud>/ och kontaktark/orig för alla bilder, och skriver ut
bildlikheter (dHash) mellan olika produkter i rundan som tips om syskon.
"""
import json, os, re, subprocess, sys, itertools
SP = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(SP, 'data.json')))
ROT = '/home/user/fyndplats-cache-warmer/tools/polish-assets'
runda_namn = sys.argv[1]
ENH = json.load(open(sys.argv[2]))
UTAN_ARK = '--utan-ark' in sys.argv
RUNDA = f'{ROT}/{runda_namn}'
SKRIV = f'{RUNDA}/skriv'
os.makedirs(SKRIV, exist_ok=True)

def skriv(p, t):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w', encoding='utf-8').write(t)

ENHET_I_SLUTET = re.compile(r'^\d{1,3}-\d{1,3}(cm|mm|m|kg|g|l|w|v|kw|min|zoll|inch|st|stück|x)$', re.I)
def rensa(t):
    """Tar bort Aosoms artikelnummer ur källtexten innan den skrivs till repot (publikt): hela rader som bär ett."""
    ut = []
    # ☠️ Texten kan ligga på EN rad (N155, 2fbe1715): då föll hela källan bort tillsammans med artikelnumret. Bryt därför efter varje block först.
    t = re.sub(r'(</li>|</p>|</h[1-6]>|</ul>)', r'\1\n', t)
    for rad in t.split('\n'):
        if re.search(r'artikel(nummer|bezeichnung|etikett|nr)\s*:', rad, re.I):
            continue
        # Modellnummer i löptext ('wie dem Pavilion 01-0867'): byt ut talet, behåll raden (resten kan bära mått som gaterna läser)
        if re.search(r'pavil|modell|model|artikel|\bart\.|\bnr\.', rad, re.I):
            rad = re.sub(r'\b\d{2}-\d{4}\b', '[nr]', rad)
        bar = False
        for pat in [r'\b\d{2}[A-Z]-\d{3}(?!\d)[A-Z0-9]*\b', r'\b[A-Z]\d{2}-\d{3}(?!\d)[A-Z0-9]*\b', r'\b\d{3}-\d{3}(?!\d)[A-Z0-9]{2,}\b']:
            for m in re.finditer(pat, rad, re.I):
                if not ENHET_I_SLUTET.match(m.group(0)):
                    bar = True
        if bar:
            continue
        ut.append(rad)
    return '\n'.join(ut)

def klar_text(t, k):
    for pat in [r'\b\d{2}[A-Z]-\d{3}(?!\d)[A-Z0-9]*\b', r'\b[A-Z]\d{2}-\d{3}(?!\d)[A-Z0-9]*\b', r'\b\d{3}-\d{3}(?!\d)[A-Z0-9]{2,}\b']:
        for m in re.finditer(pat, t, re.I):
            assert ENHET_I_SLUTET.match(m.group(0)), (k, pat, m.group(0))

alla = []
for e in ENH:
    h = e['huvud']
    if e.get('ref'):
        assert h in D, f'saknar data för {h}'
        alla += [f"{h}\t{i}\t{fid}" for i, fid in enumerate(D[h]['items'], 1)]
        continue
    medl = [h] + [s['id8'] for s in e.get('syskon', [])]
    for k in medl:
        assert k in D, f'saknar data för {k}'
        alla += [f"{k}\t{i}\t{fid}" for i, fid in enumerate(D[k]['items'], 1)]
skriv(f'{RUNDA}/bilder.tsv', "\n".join(alla) + "\n")

for e in ENH:
    if e.get('ref'):
        continue
    h = e['huvud']; mapp = f'{SKRIV}/{h}'; d = D[h]
    syskon = e.get('syskon', [])
    medl = [h] + [s['id8'] for s in syskon]
    varden = {h: e.get('huvudvarde', '')}
    varden.update({s['id8']: s['varde'] for s in syskon})
    saldo = e.get('saldo', {}); pris = e.get('pris', {})
    publ = e.get('publicerad', False)
    status = 'publicerad' if publ else 'utkast, publiceras'
    skriv(f'{mapp}/ids.tsv', f"{h}\t{d['fullid']}\t{pris.get(h, 0)} kr {d['name'][:60]} ({status})\n")
    skriv(f'{mapp}/lager.tsv', f"{h}\t{saldo.get(h, 0)}\n")
    skriv(f'{mapp}/variant.tsv', f"{h}\t{d['variants'][0].split('/')[1]}\n")
    skriv(f'{mapp}/bilder.tsv', "".join(f"{h}\t{i}\t{fid}\n" for i, fid in enumerate(d['items'], 1)))
    delar = []
    for k in medl:
        rubrik = ('sidans utkast' if k == h and not publ else 'sidans tidigare, verifierade text (svenska)' if k == h else 'syskon')
        v = f" ({varden[k]})" if varden.get(k) else ''
        delar += [f"=== källa: {rubrik} {k}{v}, hela texten ===", rensa(D[k]['text'])]
    text = "\n".join(delar)
    klar_text(text, h)
    skriv(f'{mapp}/kallor.json', json.dumps({h: text}, ensure_ascii=False, indent=1))
    if syskon:
        gi, gb, gk = [], [], {}
        for s in syskon:
            k = s['id8']; dk = D[k]
            gi.append(f"{k}\t{dk['fullid']}\t{pris.get(k, 0)} kr {dk['name'][:60]} (utkast, givare)")
            gb += [f"{k}\t{i}\t{fid}" for i, fid in enumerate(dk['items'], 1)]
            gk[k] = text
        skriv(f'{mapp}/givare/ids.tsv', "\n".join(gi) + "\n")
        skriv(f'{mapp}/givare/bilder.tsv', "\n".join(gb) + "\n")
        skriv(f'{mapp}/givare/kallor.json', json.dumps(gk, ensure_ascii=False, indent=1))
    spec = dict(huvud=h, publicerad=publ, syskon=[s['id8'] for s in syskon], axel=e.get('axel'), varden=varden,
                saldo={k: saldo.get(k, 0) for k in medl}, pris={k: pris.get(k, 0) for k in medl},
                kategori_forslag=e.get('kategori', ''), anteckningar=e.get('noter', ''),
                nuvarande_namn=D[h]['name'], nuvarande_slug=D[h].get('slug', ''), nuvarande_alt=D[h].get('alts_full', []),
                bildsokvagar={k: {'ark': f'{RUNDA}/ark/{k}.jpg', 'orig': [f'{RUNDA}/orig/{k}-{i}.jpg' for i in range(1, len(D[k]['items']) + 1)]} for k in medl},
                kallfil=f'{mapp}/kallor.json', arbetskatalog=mapp)
    skriv(f'{mapp}/familj.json', json.dumps(spec, ensure_ascii=False, indent=1))
    print(h, medl)

if not UTAN_ARK:
    r = subprocess.run([sys.executable, '/home/user/fyndplats-cache-warmer/tools/polish-gates/bygg-ark.py'], cwd=RUNDA, capture_output=True, text=True)
    print(r.stdout[-600:], r.stderr[-300:])

# bildlikhet mellan olika produkter (dHash 9x8 på gråskala)
try:
    from PIL import Image
    def dhash(p):
        im = Image.open(p).convert('L').resize((9, 8), Image.LANCZOS)
        px = list(im.getdata())
        bits = 0
        for y in range(8):
            for x in range(8):
                bits = (bits << 1) | (1 if px[y*9+x] > px[y*9+x+1] else 0)
        return bits
    H = {}
    for e in ENH:
        for k in [e['huvud']] + ([] if e.get('ref') else [s['id8'] for s in e.get('syskon', [])]):
            for i in range(1, len(D[k]['items']) + 1):
                p = f'{RUNDA}/orig/{k}-{i}.jpg'
                if os.path.exists(p):
                    try: H[(k, i)] = dhash(p)
                    except Exception: pass
    par = {}
    for (a, ia), ha in H.items():
        for (b, ib), hb in H.items():
            if a >= b: continue
            dist = bin(ha ^ hb).count('1')
            if dist <= 6:
                par.setdefault((a, b), []).append((dist, ia, ib))
    if par:
        print('BILDLIKHETER (dHash-avstånd ≤ 6 av 64, olika produkter):')
        for (a, b), v in sorted(par.items(), key=lambda x: -len(x[1])):
            print(f'  {a} ~ {b}: {len(v)} bilder, bäst {min(v)}')
except ImportError:
    pass
