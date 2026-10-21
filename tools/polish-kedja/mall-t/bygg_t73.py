#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""T73: det vita valet i 63 cm lades på skrivbordet 3b868848 (givare 5ae05b43). Värdens text rättas med riktade ersättningar
(den sa att vitt bara finns i 80 cm). Bygger rundans rotfiler och kör hasha.py + bygg-skrivplan.py."""
import io, json, os, re, shutil, subprocess, sys

ROT = '/home/user/fyndplats-cache-warmer/tools/polish-assets'
GATES = '/home/user/fyndplats-cache-warmer/tools/polish-gates'
T72 = f'{ROT}/runda-t72-svart-skrivbord-pa-hjul'
RUNDA = 'runda-t73-vitt-63-pa-skrivbordet'
MAPP = f'{ROT}/{RUNDA}'
K = '3b868848'

ITEMS = [
 ("b379ce_2fdf43be6e9e47e380d1ab56a3480c7b~mv2.jpg", "Fällbart skrivbord på 63 cm med skiva i naturträton och vit stomme på hjul"),
 ("b379ce_25d1ac697e814ac5be4ad9ce75f3e3f8~mv2.jpg", "Skrivbordet utfällt framför en soffa med böcker i hyllan under skivan"),
 ("b379ce_23bead37a8294dfe8eaf4c07ab184c21~mv2.jpg", "Skrivbordet med en laptop, inrullat över soffkanten"),
 ("b379ce_70ef681d801b4f93abafe8380745a131~mv2.jpg", "Måttbild för 63 cm: 63 × 50 × 75 cm utfällt och 21 cm djupt hopfällt"),
 ("b379ce_5d5ed5c50a174119b009b69b8cb1ec93~mv2.jpg", "Fällbart skrivbord på hjul med hylla och sidoficka i storleken 80 cm"),
 ("b379ce_fd2b409b220f408d8510e96d1117da7d~mv2.jpg", "Fällbart skrivbord på hjul med hylla och sidoficka i storleken 80 cm, bild två"),
 ("b379ce_d538d60c51d449fd9beadcc4c97c6b87~mv2.jpg", "Fällbart skrivbord på hjul med hylla och sidoficka i färgen vit och storleken 80 cm"),
 ("b379ce_9135713a071440aa86d9876f02b24bde~mv2.jpg", "Fällbart skrivbord på hjul med hylla och sidoficka i färgen vit, bild två"),
 ("b379ce_0bea4443185743c683a651dffe16d9e5~mv2.jpg", "Fällbart skrivbord på hjul med hylla och sidoficka i färgen vit, bild tre"),
 ("b379ce_dabe86c7460e4fd188a6ea4bd28493e1~mv2.jpg", "Fällbart skrivbord på hjul med hylla och sidoficka i färgen vit, bild fyra"),
 ("b379ce_3f1a0d48096949818f60b7943e518807~mv2.jpg", "Fällbart skrivbord på hjul med hylla och sidoficka i färgen vit, bild fem"),
 ("b379ce_576019a0dd3a49ee846762683edcff36~mv2.jpg", "Bordet inrullat vid en säng med böcker och tidningar i hyllan"),
 ("b379ce_68437f0649204bfab06d76de4e1bc5c1~mv2.jpg", "Svart fällbart skrivbord med svart stomme, en hylla under skivan och en ficka på sidan, på hjul, på vit bakgrund"),
 ("b379ce_878eb2ef18c3488883f4c5406938a72a~mv2.jpg", "Det svarta skrivbordet utfällt vid ett fönster med en laptop på skivan och böcker i hyllan, bredvid en vit stol"),
 ("b379ce_40e70c3a1cc8457c97c32f0c13bee19d~mv2.jpg", "Det svarta skrivbordet hopfällt som sidobord vid en säng, med en laptop och en kopp på skivan och böcker i hyllan"),
]

def ersatt(h, par):
    for gammal, ny in par:
        n = h.count(gammal)
        assert n == 1, (gammal[:90], n)
        h = h.replace(gammal, ny)
    return h

os.makedirs(MAPP, exist_ok=True)
w = lambda fn, t: io.open(f'{MAPP}/{fn}', 'w', encoding='utf-8').write(t)
for fn in ('namn.tsv', 'slugs.txt', 'seo.tsv', 'kategori.tsv', 'ids.tsv', 'axelfacit.json', 'foto-tal.txt', 'grind-undantag.txt'):
    shutil.copyfile(f'{T72}/{fn}', f'{MAPP}/{fn}')
w('sku.tsv', ''); w('variant.tsv', '')
w('sammanslagna.tsv', f'{K}\t5\n')
w('lager.tsv', f'{K}\t579\n')
w('bilder.tsv', ''.join(f'{K}\t{i}\t{fid}\n' for i, (fid, _) in enumerate(ITEMS, 1)))
w('alt.tsv', ''.join(f'{K}\t{i}\t{alt}\n' for i, (_, alt) in enumerate(ITEMS, 1)))

live = io.open(f'{T72}/{K}.html', encoding='utf-8').read()
ny = ersatt(live.rstrip('\n'), [
    ('Det finns 63 cm eller 80 cm brett med skiva i naturträton och vit stomme, 80 cm brett också helt i vitt, och 63 cm brett helt i svart.</p>',
     'Det finns 63 cm eller 80 cm brett med skiva i naturträton och vit stomme, 63 cm eller 80 cm brett helt i vitt, och 63 cm brett helt i svart.</p>'),
    ('<li><p>Natur och vit, vit eller svart (vit i 80 cm, svart i 63 cm)</p></li>',
     '<li><p>Natur och vit, vit eller svart (svart i 63 cm)</p></li>'),
    ('<p>Nej, det vita finns i 80 cm.</p>',
     '<p>Ja, helt vitt finns både i 63 cm och i 80 cm. Mått, hjul och bärförmåga är desamma som för natur och vit i samma bredd.</p>'),
])
w(f'{K}.html', ny)

# källor: givarens (vita) tyska text, den svarta givarens (från T72) och sidans tidigare verifierade text
k72 = json.load(io.open(f'{T72}/kallor.json', encoding='utf-8'))[K]
svart = re.split(r'(?m)^(?==== källa: )', k72)
svart = [x for x in svart if x.strip() and x.startswith('=== källa: syskon')]
assert len(svart) == 1
donor = io.open(f'{os.path.dirname(os.path.abspath(__file__))}/donor_5ae05b43.html', encoding='utf-8').read().strip()
dblock = f'=== källa: syskon 5ae05b43 (Vit, 63 cm), hela texten ===\n{donor}\n'
hblock = f'=== källa: sidans tidigare, verifierade text (svenska) {K} (Natur och vit, Vit, Svart) ===\n{live.rstrip(chr(10))}\n'
s = dblock + (svart[0] if svart[0].endswith('\n') else svart[0] + '\n') + hblock
io.open(f'{MAPP}/kallor.json', 'w', encoding='utf-8').write(json.dumps({K: s.rstrip('\n')}, ensure_ascii=False, indent=1))

if '--bygg' in sys.argv:
    for cmd in (['python3', f'{GATES}/hasha.py'], ['python3', f'{GATES}/bygg-skrivplan.py']):
        r = subprocess.run(cmd, cwd=MAPP, capture_output=True, text=True)
        print('$', os.path.basename(cmd[1]), 'rc', r.returncode)
        print((r.stdout + r.stderr)[-5000:])
        if r.returncode != 0:
            sys.exit(1)
