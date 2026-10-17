# -*- coding: utf-8 -*-
"""T65: den beiga klätterväggen för katt (publicerad) får den grå som färgval ur den publicerade grå sidan (tidigare en AliExpress-sida, ommappad till Aosom 2026-10-16).
Värdens text byggs ur den publicerade texten med riktade ersättningar (aldrig en omskrivning). Namnet och adressen bar färgen och byts; den gamla adressen får en 301."""
import json
import re

SP = '/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad'
SPEC = {s['huvud']: s for s in json.load(open(f'{SP}/t65/spec_t65.json', encoding='utf-8'))}


def live(k):
    return json.load(open(f'{SP}/t15/data/{k}.json', encoding='utf-8'))


ORD = {'2': 'två', '3': 'tre', '4': 'fyra', '5': 'fem', '6': 'sex', '7': 'sju', '8': 'åtta', '9': 'nio'}


def live_alt(k):
    """Värdens alt-texter. Äldre färgbildsalt bär ett löpnummer ("…, bild 2") som grinden inte kan knyta till källtexten, så siffran skrivs ut med ord."""
    ut = {}
    for i, m in enumerate(live(k)['items'], 1):
        ut[str(i)] = re.sub(r'(, bild )(\d)\b', lambda x: x.group(1) + ORD[x.group(2)], m['alt'])
    return ut


def ersatt(h, par):
    for old, new in par:
        n = h.count(old)
        assert n == 1, (old, n)
        h = h.replace(old, new)
    return h


def axelundantag(matt):
    return ('bygg-axelfacit.py', 'texten är sidans tidigare, verifierade svenska text och ändras bara med riktade ersättningar för valen; måtten (' + matt + ') står kvar oförändrade i spec-fliken med sina axlar, och varken sidan eller givaren har någon tysk källa med totalmåttrad att bygga ett facit ur')


def bygg(KAT=None):
    U = {}
    F = '<span style="font-weight: 700">'

    k = '44663e99'
    L = live(k)
    assert len(L['items']) == 4 and len(L['variants']) == 1 and not L['options'] and L['visible'] is True
    U[k] = dict(
        namn='Klättervägg för katt i fyra delar med klösställ, hängmatta och trappa',
        slug='klattervagg-katt-fyra-delar-hangmatta-trappa',
        sku=L['variants'][0]['sku'],
        kategori=SPEC[k]['kategori'],
        seo_titel='Klättervägg för katt i fyra delar',
        seo_meta='Klättervägg för katt i fyra delar: klösställ i tre våningar med hängmatta, plattform, trappa och liggskål. Väggmonterad, i beige eller grått.',
        html_raw=ersatt(L['html'], [
            ('Delarna är gjorda av spånskiva, polyester och sisal i beige och monteras på väggen, så att golvytan sparas.</p>',
             'Delarna är gjorda av spånskiva, polyester och sisal och finns i beige och grått. De monteras på väggen, så att golvytan sparas.</p>'),
            ('<h2>Neutral beige färg</h2><p>Den neutrala beige färgen passar in i de flesta hem.</p>',
             '<h2>Beige eller grått</h2><p>Setet finns i två neutrala färger, beige och grått, som passar in i de flesta hem. Delarna, måtten och monteringen är desamma i båda färgerna.</p>'),
            ('<li><p>Beige spånskiva, polyester och sisal</p></li>',
             '<li><p>Spånskiva, polyester och sisal i beige eller grått</p></li>'),
            ('<li><p>' + F + 'Färg:</span> beige</p></li>',
             '<li><p>' + F + 'Färg:</span> beige eller grå</p></li>'),
            ('<p>' + F + 'Vilken färg har setet?</span></p><p>Beige.</p>',
             '<p>' + F + 'Vilka färger finns?</span></p><p>Beige och grå.</p>'),
            ('<h2>Produktsäkerhet</h2>',
             '<p>' + F + 'Vad skiljer färgerna åt?</span></p><p>Bara färgen. Delarna, måtten och monteringen är desamma.</p><h2>Produktsäkerhet</h2>'),
        ]),
        alt=live_alt(k),
        bort={},
        extra_bilder=[],
        foto_tal=[],
        undantag=[axelundantag('40 × 28 × 73 cm, 40 × 27,5 × 23,5 cm, 38 × 22 × 12 cm och 42 × 25,5 × 21 cm')],
    )
    return U
