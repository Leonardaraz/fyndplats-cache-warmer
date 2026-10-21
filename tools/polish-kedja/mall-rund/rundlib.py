#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Skriver en enhets filer (@@P@@) ur en kompakt beskrivning. Inget skrivs av hand i Wix; allt hamnar i skriv/<id8>/ i rundans katalog."""
import os, re, subprocess, sys

ROT = '/home/user/fyndplats-cache-warmer/tools/polish-assets'
GATES = '/home/user/fyndplats-cache-warmer/tools/polish-gates'
RUNDA = '@@RUNDA@@'


def tabort(mapp, fn):
    p = os.path.join(mapp, fn)
    if os.path.exists(p):
        os.remove(p)


def fet(etikett, text):
    return f'<li><p><span style="font-weight: 700">{etikett}:</span> {text}</p></li>'


def html_enhet(u):
    """u: dict med ingress, avsnitt [(rubrik, text)], egenskaper [str], spec [(etikett, text)], skotsel, faq [(fraga, svar)], sakerhet [str]"""
    d = []
    d.append(f"<p>{u['ingress']}</p>\n")
    for rubrik, text in u['avsnitt']:
        d.append(f"<h2>{rubrik}</h2>\n<p>{text}</p>\n")
    d.append("<h2>Egenskaper</h2>\n<ul>\n" + "\n".join(f"<li><p>{e}</p></li>" for e in u['egenskaper']) + "\n</ul>\n")
    d.append("<h2>Tekniska specifikationer</h2>\n<ul>\n" + "\n".join(fet(a, b) for a, b in u['spec']) + "\n</ul>\n")
    d.append(f"<h2>Användning och skötsel</h2>\n<p>{u['skotsel']}</p>\n")
    faq = "\n".join(f'<p><span style="font-weight: 700">{q}</span></p>\n<p>{a}</p>' for q, a in u['faq'])
    d.append(f"<h2>Vanliga frågor</h2>\n{faq}\n")
    if u.get('sakerhet'):
        d.append("<h2>Produktsäkerhet</h2><ul>" + "".join(f"<li>{s}</li>" for s in u['sakerhet']) + "</ul>")
    return "\n".join(d).rstrip('\n') + "\n"


def skriv_enhet(id8, u, kor=True):
    mapp = f'{ROT}/{RUNDA}/skriv/{id8}'
    assert os.path.isdir(mapp), mapp
    assert len(u['namn']) <= 80, (id8, len(u['namn']), u['namn'])
    seo_t = u['seo_titel'] + ' | Fyndplats'
    assert len(seo_t) <= 60, (id8, len(seo_t), seo_t)
    assert len(u['seo_meta']) <= 155, (id8, len(u['seo_meta']))
    if not u.get('sammanslagen'):
        assert len(u['sku']) <= 40 and re.fullmatch(r'FP-[a-z0-9-]+', u['sku']), u['sku']
    assert re.fullmatch(r'[a-z0-9-]+', u['slug']), u['slug']
    w = lambda fn, t: open(f'{mapp}/{fn}', 'w', encoding='utf-8').write(t)
    w(f'{id8}.html', u['html_raw'] if u.get('html_raw') else html_enhet(u))
    w('namn.tsv', f"{id8}\t{u['namn']}\n")
    w('slugs.txt', f"{id8} {u['slug']}\n")
    w('seo.tsv', f"{id8}\t{seo_t}\t{u['seo_meta']}\n")
    if u.get('sammanslagen'):
        w('sku.tsv', ''); w('variant.tsv', '')   # tomma filer: gate-sku och bygg-skrivplan avbryter om de saknas helt
        w('sammanslagna.tsv', f"{id8}\t{u['sammanslagen']}\n")
    else:
        w('sku.tsv', f"{id8}\t{u['sku']}\n")
    w('kategori.tsv', f"{id8}\t{u['kategori']}\n")
    w('alt.tsv', "".join(f"{id8}\t{p}\t{t}\n" for p, t in sorted(u['alt'].items(), key=lambda x: int(x[0]))))
    bort = u.get('bort') or {}
    if bort:
        w('bilder-bort.tsv', "".join(f"{id8}\t{p}\t{s}\n" for p, s in sorted(bort.items(), key=lambda x: int(x[0]))))
    else:
        tabort(mapp, 'bilder-bort.tsv')
    extra = u.get('extra_bilder') or []
    if extra:
        bp = f'{mapp}/bilder.tsv'
        rader = [r for r in open(bp, encoding='utf-8').read().splitlines() if r.strip()]
        finns = {r.split('\t')[1] for r in rader}
        for etikett, fil in extra:
            if str(etikett) not in finns:
                rader.append(f'{id8}\t{etikett}\t{fil}')
        open(bp, 'w', encoding='utf-8').write('\n'.join(rader) + '\n')
    byt = u.get('byt_filer') or {}   # {etikett: ny fil}: ett beskuret utsnitt ersätter bilden på samma etikett
    if byt:
        bp = f'{mapp}/bilder.tsv'
        rader = [r.split('\t') for r in open(bp, encoding='utf-8').read().splitlines() if r.strip()]
        for r in rader:
            if r[1] in byt:
                r[2] = byt[r[1]]
        open(bp, 'w', encoding='utf-8').write('\n'.join('\t'.join(r) for r in rader) + '\n')
    foto = u.get('foto_tal') or []
    w('foto-tal.txt', "# Tal som är AVLÄSTA ELLER RÄKNADE PÅ PRODUKTFOTOT, inte skrivna i den tyska källtexten.\n# Form: <kort> <tal> <vad som lästes av eller räknades>\n" + "".join(f"{id8} {t} {s}\n" for t, s in foto))
    rad = u.get('rad_tal') or []
    if rad:
        w('rad-tal.txt', "".join(f"{t}\n" for t in rad))
    und = u.get('undantag') or []
    w('grind-undantag.txt', "# <skript> <skäl> — se bygg-skrivplan.py\n" + "".join(f"{s} {t}\n" for s, t in und))
    gal = u.get('givare_alt') or {}
    if gal:
        os.makedirs(f'{mapp}/givare', exist_ok=True)
        with open(f'{mapp}/givare/alt.tsv', 'w', encoding='utf-8') as f:
            for did, d in gal.items():
                for pos, txt in sorted(d.items(), key=lambda x: int(x[0])):
                    f.write(f"{did}\t{pos}\t{txt}\n")
    gex = u.get('givare_extra') or {}   # {givar-id8: [(etikett, fil), ...]}: extra bilder (t.ex. feedposition 10) i givarens bilder.tsv
    if gex:
        gp = f'{mapp}/givare/bilder.tsv'
        rader = [r for r in open(gp, encoding='utf-8').read().splitlines() if r.strip()]
        for did, lst in gex.items():
            finns = {r.split('\t')[1] for r in rader if r.split('\t')[0] == did}
            for etikett, fil in lst:
                if str(etikett) not in finns:
                    rader.append(f'{did}\t{etikett}\t{fil}')
        open(gp, 'w', encoding='utf-8').write('\n'.join(rader) + '\n')
    tas = u.get('tas_med') or {}
    if tas:
        os.makedirs(f'{mapp}/givare', exist_ok=True)
        with open(f'{mapp}/givare/tas-med.txt', 'w', encoding='utf-8') as f:
            for did, pos in tas.items():
                f.write(f"{did} {pos}\n")
    if kor:
        for cmd in (['python3', f'{GATES}/hasha.py'], ['python3', f'{GATES}/bygg-skrivplan.py']):
            r = subprocess.run(cmd, cwd=mapp, capture_output=True, text=True)
            ut = (r.stdout + r.stderr)
            print(f'######## {id8} $', os.path.basename(cmd[1]), 'rc', r.returncode)
            print(ut[-2600:])
            if r.returncode != 0:
                return False
    return True
