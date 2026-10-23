# -*- coding: utf-8 -*-
"""T90: färgval på en publicerad Aosom-sida som saknar optioner.
  d70e483e skumklossar i sju delar med båge, gul och grå (88 i lager): + marinblå och grön (givare 4b96899f, dolt utkast, 132 i flödet)
Värdens text är sidans verifierade text med riktade ersättningar: namnet tappar färgen (slugen står kvar, ingen omdirigering behövs), ingressen,
spec-raden och en ny fråga om färger. Båge, halvmåne, block, ramper och matta är desamma i båda färgerna.
Givarens bilder är dess egna rena bilder utan måttbilden (position 3 i galleriet): måttbilden anger bågen som 55 cm bred, värdens 45 cm, och
sidans text säger bara att bågen är 36 cm hög. Värdens måttbild ligger kvar. Givaren tas med i galleriets ordning 1, 2, 4 och 5."""
import json
import re

SP = '/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad'

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

UND = ('bygg-axelfacit.py', 'texten är sidans tidigare, verifierade svenska text och ändras bara med riktade ersättningar för färgvalet; måtten står kvar oförändrade, och sidan har ingen tysk källtext med totalmåttrad att bygga ett facit ur')


def bygg(KAT=None):
    U = {}

    # ============ d70e483e: skumklossar 7 delar med båge, gul och grå + marinblå och grön ============
    k = 'd70e483e'
    L = live(k)
    assert len(L['items']) == 5 and len(L['variants']) == 1 and not L['options'] and L['visible'] is True
    U[k] = dict(
        namn='Skumklossar 7 delar med båge – tvättbar sammet, halkfri undersida',
        slug=L['slug'],
        sku=L['variants'][0]['sku'],
        kategori=KAT[k] if KAT else 'Barn & Familj + Baby & Småbarn + Leksaker & Spel',
        seo_titel='Skumklossar 7 delar med båge i sammet',
        seo_meta='Sju skumklossar i tvättbar sammet med båge, ramper och matta. Finns i gult och grått eller marinblått och grönt. Halkfri undersida, EN 71.',
        html_raw=ersatt(L['html'], [
            ('<p>Sju skumklossar med sammetsklädsel i gult, grått och gräddvitt för barn mellan ett halvår och 3 år. I setet finns',
             '<p>Sju skumklossar med sammetsklädsel i gult och grått eller i marinblått och grönt, båda med gräddvita block, för barn mellan ett halvår och 3 år. I setet finns'),
            (f'<li><p>{F}Färg:</span> Gul, grå och gräddvit</p></li>',
             f'<li><p>{F}Färg:</span> Gul, grå och gräddvit eller marinblå, grön och gräddvit</p></li>'),
            (f'<p>En båge, en halvmåne, två block med urtag, två ramper och en matta som viks i tre delar.</p><p>{F}Hur mycket bär klossarna?</span></p>',
             f'<p>En båge, en halvmåne, två block med urtag, två ramper och en matta som viks i tre delar.</p><p>{F}Vilka färger finns?</span></p><p>Gult och grått med gräddvita block, eller marinblått och grönt med gräddvita block. Delarna är desamma i båda färgerna.</p><p>{F}Hur mycket bär klossarna?</span></p>'),
        ]),
        alt=live_alt(k),
        bort={},
        extra_bilder=[],
        foto_tal=[],
        undantag=[UND],
        givare_alt={
            '4b96899f': {
                '1': 'Sju skumklossar i marinblått, grönt och gräddvitt byggda till en bana med båge, och fyra andra sätt att bygga dem',
                '2': 'Två småbarn leker vid bågen av marinblå och gröna skumklossar i ett barnrum',
                '3': 'Närbild på den marinblå bågen mellan två gräddvita block',
                '4': 'Närbild på den gröna och den marinblå rampen och den marinblå mattan',
            },
        },
        givare_foto_tal={},
        givare_extra={},
        tas_med={'4b96899f': '1,2,4,5'},
    )
    return U
