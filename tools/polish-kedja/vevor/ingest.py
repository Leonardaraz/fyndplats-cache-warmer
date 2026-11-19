#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""ingest.py <arbetskatalog> <svar1.txt> [<svar2.txt> ...]: läser hamta_vevor.js-svar (filer som verktyget sparat) och bygger
<arbetskatalog>/cand/<id8>/ med data.json (utkastet), ut.json (VEVOR-avläsningen utan modellrader), d1..d6.jpg (utkastets bilder),
v01..v12.jpg (VEVOR:s bilder i avläsningens ordning) och två kontaktark: sheet_d_<id8>.jpg (utkastets sex) och sheet_v_<id8>.jpg (tolv).

☠️ Avläsningens bildadresser bär artikelnumret. De ligger bara i ut.json i arbetskatalogen (scratchpaden), aldrig i repot, och bilderna
sparas under egna namn. Modellrader (Modell, Artikel…, Produktmodell) tas bort ur spec. Kör med /usr/bin/python3 (PIL)."""
import concurrent.futures as cf, json, os, re, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from parse_ut import las
from PIL import Image, ImageDraw, ImageFont

ROT = sys.argv[1]
MODELL = re.compile(r'model|artikel|item\s*no|produktnummer', re.I)


def hamta(url, fil):
    if os.path.exists(fil) and os.path.getsize(fil) > 2000:
        return True
    for n in range(3):
        r = subprocess.run(['curl', '-sS', '-L', '--max-time', '45', '-A', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36', '-o', fil, url], capture_output=True, text=True)
        if r.returncode == 0 and os.path.exists(fil) and os.path.getsize(fil) > 2000:
            try:
                Image.open(fil).verify()
                return True
            except Exception:
                pass
    return False


def ark(filer, ut, kol, cell=400):
    rader = (len(filer) + kol - 1) // kol
    S = Image.new('RGB', (kol * cell, rader * cell), 'white')
    dr = ImageDraw.Draw(S)
    try:
        f = ImageFont.load_default(size=34)
    except TypeError:
        f = ImageFont.load_default()
    for i, (nr, fil) in enumerate(filer):
        x, y = (i % kol) * cell, (i // kol) * cell
        try:
            im = Image.open(fil).convert('RGB')
            im.thumbnail((cell - 6, cell - 6))
            S.paste(im, (x + 3 + (cell - 6 - im.width) // 2, y + 3 + (cell - 6 - im.height) // 2))
        except Exception:
            dr.text((x + 20, y + 20), 'saknas', fill='red', font=f)
        dr.rectangle([x, y, x + 62, y + 42], fill='black')
        dr.text((x + 6, y + 2), str(nr), fill='yellow', font=f)
        dr.rectangle([x, y, x + cell - 1, y + cell - 1], outline='#999999')
    S.save(ut, quality=88)


jobb = []
poster = []
for fil in sys.argv[2:]:
    d = las(fil)
    for x in d['data']:
        k = x['fullid'][:8]
        u = d['ut'].get(k, {})
        mapp = f'{ROT}/cand/{k}'
        os.makedirs(mapp, exist_ok=True)
        u['spec'] = [r for r in u.get('spec', []) if not MODELL.search(str(r[0]))]
        json.dump(x, open(f'{mapp}/data.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        json.dump(u, open(f'{mapp}/ut.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        for i, it in enumerate(x['items'], 1):
            jobb.append((f'https://static.wixstatic.com/media/{it["id"]}', f'{mapp}/d{i}.jpg'))
        for i, b in enumerate(u.get('bilder', []), 1):
            jobb.append((b['url'], f'{mapp}/v{i:02d}.jpg'))
        poster.append((k, mapp, len(x['items']), len(u.get('bilder', []))))
with cf.ThreadPoolExecutor(6) as ex:
    res = list(ex.map(lambda a: hamta(*a), jobb))
print(f'{sum(res)} av {len(res)} bilder hämtade')
for k, mapp, nd, nv in poster:
    ark([(i, f'{mapp}/d{i}.jpg') for i in range(1, nd + 1)], f'{mapp}/sheet_d_{k}.jpg', 3)
    ark([(i, f'{mapp}/v{i:02d}.jpg') for i in range(1, nv + 1)], f'{mapp}/sheet_v_{k}.jpg', 4, 330)
    saknas = [n for n in range(1, nv + 1) if not os.path.exists(f'{mapp}/v{n:02d}.jpg')] + [f'd{n}' for n in range(1, nd + 1) if not os.path.exists(f'{mapp}/d{n}.jpg')]
    print(k, 'utkastbilder', nd, 'VEVOR-bilder', nv, 'saknas', saknas)
