# -*- coding: utf-8 -*-
"""T54: ljusträdet med körsbärsblommor (publicerat, 150 cm med 160 LED) får en storlek till, 180 cm med 200 LED, ur det dolda utkastet.
Värdens text byggs ur den publicerade texten med riktade ersättningar (aldrig en omskrivning). Namnet och adressen bar storleken (150 cm), så de byts
(namnet_bar_storlek), med 301 från den gamla adressen."""
import json

SP = '/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad'


def live(k):
    return json.load(open(f'{SP}/t15/data/{k}.json', encoding='utf-8'))


def live_alt(k):
    return {str(i): m['alt'] for i, m in enumerate(live(k)['items'], 1)}


def live_seo(k):
    s = live(k)['seo']
    t = [x for x in s['tags'] if x['type'] == 'title'][0]['children']
    m = [x for x in s['tags'] if x['type'] == 'meta'][0]['props']['content']
    assert t.endswith(' | Fyndplats'), t
    return t[:-len(' | Fyndplats')], m


def ersatt(h, par):
    for old, new in par:
        n = h.count(old)
        assert n == 1, (old, n)
        h = h.replace(old, new)
    return h


def bygg(KAT=None):
    U = {}
    F = '<span style="font-weight: 700">'

    k = '4f40817c'
    L = live(k)
    st, sm = live_seo(k)
    assert len(L['items']) == 5 and len(L['variants']) == 1 and not L['options'] and L['visible'] is True
    U[k] = dict(
        namn='Ljusträd med svart stam och körsbärsblommor – varmvitt eller flerfärgat ljus',
        slug='ljustrad-korsbarsblommor-varmvitt-flerfargat-ljus',
        sku=L['variants'][0]['sku'],
        kategori='Hem & Inredning + Belysning + Juldekoration',
        seo_titel='Ljusträd med körsbärsblommor',
        seo_meta='Ljusträd med svart stam och genomskinliga körsbärsblommor i 150 och 180 cm. 11 lägen i varmvitt eller flerfärgat, timer och fjärrkontroll.',
        html_raw=ersatt(L['html'], [
            ('<p>Ett ljusträd med svart stam och 160 LED-ljus i genomskinliga körsbärsblommor, som lyser upp ett mörkt hörn och blir en extra juldekoration i december. Det är 150 cm högt och växlar mellan varmvitt och flerfärgat ljus.</p>',
             '<p>Ett ljusträd med svart stam och LED-ljus i genomskinliga körsbärsblommor, som lyser upp ett mörkt hörn och blir en extra juldekoration i december. '
             'Det finns i två höjder, 150 cm med 160 LED och 180 cm med 200 LED, och växlar mellan varmvitt och flerfärgat ljus.</p>'),
            ('Det monteras utan verktyg, är 150 cm högt och 55 cm brett och väger 3,5 kg.</p>',
             'Det monteras utan verktyg. Trädet på 150 cm är 55 cm brett och trädet på 180 cm är 60 cm brett.</p>'),
            ('<li><p>Ljusträd, 150 cm högt</p></li>', '<li><p>Ljusträd i två höjder, 150 och 180 cm</p></li>'),
            ('<li><p>160 LED i genomskinliga körsbärsblommor</p></li>', '<li><p>160 LED (150 cm) eller 200 LED (180 cm) i genomskinliga körsbärsblommor</p></li>'),
            (F + 'Mått:</span> 55 × 55 × 150 cm</p>', F + 'Mått:</span> 55 × 55 × 150 cm eller 60 × 60 × 180 cm</p>'),
            (F + 'LED-ljus:</span> 160, varmvita och flerfärgade</p>', F + 'LED-ljus:</span> 160 (150 cm) eller 200 (180 cm), varmvita och flerfärgade</p>'),
            (F + 'Adapter, ut:</span> 31 V, 0,11 A, 1,6 W</p>', F + 'Adapter, ut:</span> 31 V, 0,11 A, 1,6 W (150 cm), 3,6 W (180 cm)</p>'),
            (F + 'Vikt:</span> 3,5 kg</p>', F + 'Fraktvikt:</span> 3,5 kg (150 cm), 4 kg (180 cm)</p>'),
            ('<p>Med knappen på adaptern eller med fjärrkontrollen, som också ställer in ljusstyrkan.</p>',
             '<p>Med knappen på adaptern eller med fjärrkontrollen, som också ställer in ljusstyrkan.</p><p>' + F + 'Vilka storlekar finns?</span></p>'
             '<p>Två: 150 cm med 160 LED och 180 cm med 200 LED.</p>'),
        ]),
        alt=live_alt(k),
        bort={},
        extra_bilder=[],
        foto_tal=[],
        undantag=[],
        givare_alt={'e0593c23': {
            '3': 'Måttbild: ljusträdet på 180 cm är 180 cm högt och 60 cm brett',
            '4': 'Det högre ljusträdet i flerfärgat ljus på en innergård i skymning, med en bänk, ett runt bord och blommor',
            '5': 'Det högre ljusträdet lyser varmvitt på en snöig innergård bredvid två julgranar och julklappar',
        }},
        tas_med={'e0593c23': '3,4,5'},
    )
    return U
