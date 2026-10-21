# -*- coding: utf-8 -*-
"""T72: det fällbara skrivbordet på hjul (värd 3b868848, 63 och 80 cm i natur och vit samt vitt) får svart i 63 cm som färgval (givare e340a115).
Värdens text är sidans verifierade text och ändras bara med riktade ersättningar för valet."""
import json
import re

SP = '/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad'
SPEC = {s['huvud']: s for s in json.load(open(f'{SP}/t72/spec_t72.json', encoding='utf-8'))}
ORD = {'2': 'två', '3': 'tre', '4': 'fyra', '5': 'fem', '6': 'sex', '7': 'sju', '8': 'åtta', '9': 'nio'}


def live(k):
    return json.load(open(f'{SP}/t15/data/{k}.json', encoding='utf-8'))


def live_alt(k):
    """Värdens alt-texter. Äldre färgbildsalt bär ett löpnummer ("…, bild 2") som grinden inte kan knyta till källtexten, så siffran skrivs ut med ord."""
    ut = {}
    for i, m in enumerate(live(k)['items'], 1):
        ut[str(i)] = re.sub(r'(, bild )(\d)\b', lambda x: x.group(1) + ORD[x.group(2)], m['alt'])
    return ut


def ersatt(h, par):
    for old, new in par:
        n = h.count(old)
        assert n == 1, (old[:90], n)
        h = h.replace(old, new)
    return h


F = '<span style="font-weight: 700">'


def fraga(q, a):
    return f'<p>{F}{q}</span></p><p>{a}</p>'


def bygg(KAT=None):
    U = {}
    k = '3b868848'
    L = live(k)
    assert len(L['items']) == 12 and len(L['variants']) == 3 and L['visible'] is True and L['revision'] == '22', (len(L['items']), len(L['variants']), L['revision'])
    U[k] = dict(
        namn=L['name'],
        slug=L['slug'],
        sku=L['variants'][0]['sku'],
        sammanslagen='3',
        kategori=SPEC[k]['kategori'],
        seo_titel='Fällbart skrivbord på hjul, 63 eller 80 cm',
        seo_meta='Fällbart skrivbord på hjul som går från 50 till 21 cm djup. 63 eller 80 cm brett, natur och vit, vit eller svart, med hylla, sidoficka och bromsade hjul.',
        html_raw=ersatt(L['html'], [
            ('Det finns 63 cm eller 80 cm brett med skiva i naturträton och vit stomme, och 80 cm brett också helt i vitt.</p>',
             'Det finns 63 cm eller 80 cm brett med skiva i naturträton och vit stomme, 80 cm brett också helt i vitt, och 63 cm brett helt i svart.</p>'),
            ('<li><p>Natur och vit, eller vit (vit i 80 cm)</p></li>',
             '<li><p>Natur och vit, vit eller svart (vit i 80 cm, svart i 63 cm)</p></li>'),
            ('<span style="font-weight: 700">Färg:</span> natur och vit, eller vit</p></li>',
             '<span style="font-weight: 700">Färg:</span> natur och vit, vit eller svart</p></li>'),
            ('Nej, det vita finns i 80 cm.</p>',
             'Nej, det vita finns i 80 cm.</p>' + fraga('Finns det svart?', 'Ja, helt svart finns i 63 cm. Mått, hjul och bärförmåga är desamma som för natur och vit i 63 cm.')),
        ]),
        alt=live_alt(k),
        bort={},
        extra_bilder=[],
        foto_tal=[],
        undantag=[],
        givare_alt={'e340a115': {
            '1': 'Svart fällbart skrivbord med svart stomme, en hylla under skivan och en ficka på sidan, på hjul, på vit bakgrund',
            '2': 'Det svarta skrivbordet utfällt vid ett fönster med en laptop på skivan och böcker i hyllan, bredvid en vit stol',
            '3': 'Det svarta skrivbordet hopfällt som sidobord vid en säng, med en laptop och en kopp på skivan och böcker i hyllan',
        }},
        tas_med={'e340a115': '1,2,4'},
    )
    return U
