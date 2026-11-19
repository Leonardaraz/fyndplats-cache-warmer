#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""bygg_runda.py <rundkatalog> <spec.json> <arbetskatalog>: skriver rundans filer för en VEVOR-runda med enkla sidor (en variant, en artikel).

Texterna (`<id8>.html`) skriver du för hand i rundkatalogen. Det här skriptet bygger resten ur en kompakt spec och ur utkastens data
(`<arbetskatalog>/cand/<id8>/data.json` och `ut.json`, som `ingest.py` skrev):

  ids.tsv lager.tsv variant.tsv bilder.tsv kategori.tsv sku.tsv namn.tsv seo.tsv slugs.txt alt.tsv bilder-bort.tsv foto-tal.txt
  grind-undantag.txt bilddubblett-ok.txt kallor.json

Spec (JSON):
  {"produkter": [{"id8": "a66c15b4", "namn": "...", "slug": "...", "sku": "FP-...", "seo": ["Titel | Fyndplats", "Meta"],
                  "kategori": "Förälder + Löv", "alt": {"1": "...", "2": "..."}, "bort": {"3": "skäl"},
                  "foto_tal": [["90", "skäl"]], "matt": ["Image, dimensions: ...", "Image, functions: ..."],
                  "status": "utkast, publiceras", "sammanslagen": 3}],   # sammanslagen: sidan har så många varianter (inga rader i sku.tsv och variant.tsv)
   "grind_undantag": [["bygg-axelfacit.py", "skäl"]],
   "bilddubblett_ok": ["kort1:pos1 kort2:pos2 skäl"]}

`alt` har en rad för varje position som sitter kvar, och `bort` en för varje struken position (gate-alt.py fäller en struken position med alt-text och en
kvarsittande position utan). `matt` är siffror och etiketter lästa ur VEVOR:s måttbild och funktionsbilder, på engelska som i bilden: de
läggs som ett eget källblock i kallor.json, eftersom bilderna inte ligger i galleriet. Rader med modellnumrets etikett nekas.

Källblocken i kallor.json följer ordningen i runda vevor-317: utkastets hela text (utan modellrader), vevor-raden om vikt, utkastets namn, VEVOR:s punkter
och måttbilden. Inget artikelnummer skrivs: bildadresserna, `supplierProductId` och avläsningens spec läses aldrig härifrån.
Kör efteråt, från rundkatalogen: `python3 ../../polish-gates/hasha.py` och `python3 ../../polish-gates/bygg-skrivplan.py`.
Kör med python3."""
import json
import os
import re
import sys

MODELLRAD = re.compile(r'^\s*(artikel[a-zåäö]*nummer|artikelmodell[a-zåäö]*|modell|modellnummer|produktmodell)\s*:', re.I)
MODELL = re.compile(r'model\s*(number|no\b)|modell|artikel|item\s*no', re.I)
RUB_MATT = '=== källa: VEVOR:s måttbild och funktionsbilder (siffror och etiketter lästa ur bilderna, som inte ligger i galleriet) ==='


def rad(*delar):
    return '\t'.join(str(d) for d in delar) + '\n'


def main():
    rot, spec, arb = sys.argv[1], sys.argv[2], sys.argv[3]
    S = json.load(open(spec, encoding='utf-8'))
    ut = {n: [] for n in ('ids.tsv', 'lager.tsv', 'variant.tsv', 'bilder.tsv', 'kategori.tsv', 'sku.tsv', 'namn.tsv', 'seo.tsv', 'alt.tsv', 'bilder-bort.tsv', 'sammanslagna.tsv')}
    slugs, foto, kallor = [], [], {}
    for p in S['produkter']:
        k = p['id8']
        d = json.load(open(f'{arb}/cand/{k}/data.json', encoding='utf-8'))
        u = json.load(open(f'{arb}/cand/{k}/ut.json', encoding='utf-8'))
        v = d['variants'][0]
        sam = p.get('sammanslagen')   # en sammanslagen sida: antal varianter; ingen rad i sku.tsv och variant.tsv
        if sam:
            assert len(d['variants']) == int(sam), (k, 'antalet varianter stämmer inte med spec.sammanslagen', len(d['variants']))
        else:
            assert len(d['variants']) == 1, (k, 'fler än en variant')
        assert len(p['namn']) <= 80, (k, 'namnet över 80 tecken', len(p['namn']))
        assert len(p['seo'][0]) <= 60, (k, 'SEO-titeln över 60 tecken', len(p['seo'][0]))
        assert len(p['seo'][1]) <= 155, (k, 'metan över 155 tecken', len(p['seo'][1]))
        assert sam or (len(p['sku']) <= 40 and re.fullmatch(r'FP-[a-z0-9-]+', p['sku'])), (k, 'SKU', p.get('sku'))
        assert os.path.exists(f'{rot}/{k}.html'), (k, 'texten saknas')
        n = len(d['items'])
        assert set(p['alt']) | set(p.get('bort', {})) == {str(i) for i in range(1, n + 1)}, (k, 'alt och bort täcker inte alla positioner')
        assert not (set(p['alt']) & set(p.get('bort', {}))), (k, 'en position både behålls och stryks')
        status = p.get('status', 'utkast, publiceras')
        ut['ids.tsv'] += [rad(k, d['fullid'], f"{v['pris']} kr {d['name'][:60]} ({status})")]
        ut['lager.tsv'] += [rad(k, d['lager'])]
        if sam:
            ut['sammanslagna.tsv'] += [rad(k, sam)]
        else:
            ut['variant.tsv'] += [rad(k, v['id'])]
        for i, m in enumerate(d['items'], 1):
            ut['bilder.tsv'] += [rad(k, i, m['id'])]
        ut['kategori.tsv'] += [rad(k, p['kategori'])]
        if not sam:
            ut['sku.tsv'] += [rad(k, p['sku'])]
        ut['namn.tsv'] += [rad(k, p['namn'])]
        ut['seo.tsv'] += [rad(k, p['seo'][0], p['seo'][1])]
        slugs.append(f"{k} {p['slug']}\n")
        for pos in sorted(p['alt'], key=int):
            ut['alt.tsv'] += [rad(k, pos, p['alt'][pos])]
        for pos in sorted(p.get('bort', {}), key=int):
            ut['bilder-bort.tsv'] += [rad(k, pos, p['bort'][pos])]
        for tal, skal in p.get('foto_tal', []):
            foto.append(f'{k} {tal} {skal}\n')
        # kallor.json
        t = '\n'.join(r for r in d['html'].split('\n') if not MODELLRAD.match(re.sub(r'<[^>]+>', '', r)))
        t = re.sub(r'(?<=\d)x(?=\d)', ' x ', t)   # 96,5x6,5 blir 96,5 x 6,5: leak.py läser annars 5x6 som en artikelnummerform
        t = re.sub(r'\b(\d{3})-(\d{3})\b', r'\1 till \2', t)   # 240-100 N (gasdämparens kraft) blir 240 till 100 N: leak.py läser annars intervallet som en artikelnummerform
        txt = f'=== källa: sidans utkast {k}, hela texten ===\n' + t.rstrip('\n') + '\n'
        txt += '=== vevor-källa: Vikt i specifikationen är varans egen ===\n'
        txt += '=== källa: utkastets namn ===\n' + d['name'] + '\n'
        pk = [x for x in (u.get('punkter') or []) if not MODELL.search(x)]
        if pk:
            txt += '=== källa: punkter på VEVOR:s sida ===\n' + '\n'.join(pk) + '\n'
        matt = p.get('matt', [])
        for i, r in enumerate(matt, 1):
            if MODELL.search(r) or r.startswith('=== '):
                sys.exit(f'{k}: måttrad {i} bär modellnumrets etikett eller börjar på === och nekas')
        if matt:
            txt += RUB_MATT + '\n' + '\n'.join(matt) + '\n'
        # Ett tillbehörs modellkod i källtexten (till exempel drivmotorns XZ-12B) fäller leak.py (MODELL) i kallor.json, och en spärr man måste komma ihåg glöms bort
        txt = re.sub(r'\b[A-Z]{1,4}-\d{1,4}[A-Z]?\b', '[modellkod]', txt)
        kallor[k] = txt
    for fil, rader in ut.items():
        if fil == 'sammanslagna.tsv' and not rader:
            continue   # en runda utan sammanslagen sida får ingen sådan fil
        open(f'{rot}/{fil}', 'w', encoding='utf-8').write(''.join(rader))
    open(f'{rot}/slugs.txt', 'w', encoding='utf-8').write(''.join(slugs))
    open(f'{rot}/foto-tal.txt', 'w', encoding='utf-8').write(
        '# Form: <kort> <tal> <vad som lästes av eller räknades>\n'
        '# Tal som är AVLÄSTA ELLER RÄKNADE PÅ PRODUKTFOTOT, inte skrivna i källtexten.\n' + ''.join(foto))
    open(f'{rot}/grind-undantag.txt', 'w', encoding='utf-8').write(
        '# <skript> <skäl> — se bygg-skrivplan.py\n' + ''.join(f'{s} {r}\n' for s, r in S.get('grind_undantag', [])))
    open(f'{rot}/bilddubblett-ok.txt', 'w', encoding='utf-8').write(''.join(f'{r}\n' for r in S.get('bilddubblett_ok', [])))
    json.dump(kallor, open(f'{rot}/kallor.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('skrev', len(S['produkter']), 'produkter till', rot)


if __name__ == '__main__':
    main()
