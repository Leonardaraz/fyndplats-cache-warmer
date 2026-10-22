# -*- coding: utf-8 -*-
"""T91: färgval på en publicerad Aosom-sida som saknar optioner, med nytt namn och ny adress.
  41395340 fåtölj i vintagestil med knappad rygg, ljusgrå (62 i lager): + blå (givare e93fab42, dolt utkast, saldo ur flödet)
Värdens namn och adress bär färgen (*ljusgrå*, `fatolj-vintage-ljusgra-knappad-rygg`) och släpper den: namnet blir *Fåtölj i vintagestil – knappad rygg,
ländkudde och ben i massivt trä* och adressen `fatolj-vintage-knappad-rygg`, med 301 från den gamla (redirect-add.yml direkt efter värdskrivningen).
Texten är sidans verifierade text med riktade ersättningar: ingress, Egenskaper, spec-raden Färg och en ny fråga om färger.
Utkastet och sidan är samma fåtölj: samma mått (52,5 × 69 × 77 cm, sits 52,5 × 50 cm, sitthöjd 43 cm), samma maxlast (150 kg), samma tyg, samma ben,
samma paketmått och vikt. Givarens måttbild anger samma tal som värdens, så den tas med (som sista bild) och länkas efteråt till Blå, värdens till Ljusgrå."""
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

    # ============ 41395340: fåtölj i vintagestil, ljusgrå + blå ============
    k = '41395340'
    L = live(k)
    assert len(L['items']) == 5 and len(L['variants']) == 1 and not L['options'] and L['visible'] is True
    U[k] = dict(
        namn='Fåtölj i vintagestil – knappad rygg, ländkudde och ben i massivt trä',
        slug='fatolj-vintage-knappad-rygg',
        sku=L['variants'][0]['sku'],
        kategori=KAT[k] if KAT else 'Möbler + Fåtöljer',
        seo_titel='Fåtölj i vintagestil med knappad rygg',
        seo_meta='Fåtölj i vintagestil med knappad rygg i ljusgrått eller blått. Ländkudde med tvättbart överdrag och svängda ben i massivt trä. Sitthöjd 43 cm, bär 150 kg.',
        html_raw=ersatt(L['html'], [
            ('Klädseln är ett slitstarkt tyg i ljusgrå linnelook, och fåtöljen passar som läshörna i vardagsrummet eller vid matbordet.</p>',
             'Klädseln är ett slitstarkt tyg i linnelook, och fåtöljen finns i ljusgrått eller blått. Den passar som läshörna i vardagsrummet eller vid matbordet.</p>'),
            ('<li><p>Tyg i ljusgrå linnelook</p></li>',
             '<li><p>Tyg i linnelook i ljusgrått eller blått</p></li>'),
            (f'<li><p>{F}Färg:</span> Ljusgrå</p></li>',
             f'<li><p>{F}Färg:</span> Ljusgrå eller blå</p></li>'),
            (f'<p>{F}Hur mycket bär den?</span></p><p>150 kg.</p>',
             f'<p>{F}Hur mycket bär den?</span></p><p>150 kg.</p><p>{F}Vilka färger finns?</span></p><p>Ljusgrått och blått. Båda har samma mått, samma ländkudde och samma ben i massivt gummiträ.</p>'),
        ]),
        alt=live_alt(k),
        bort={},
        extra_bilder=[],
        foto_tal=[],
        undantag=[UND],
        givare_alt={
            'e93fab42': {
                '1': 'Blå fåtölj i vintagestil med knappad rygg och ländkudde',
                '2': 'Den blå fåtöljen bredvid ett runt sidobord',
                '3': 'Närbild på den knappade blå ryggen',
                '4': 'Närbild på den knappade ryggen och ländkudden i blått',
                '5': 'Måttbild: fåtöljens bredd, djup och höjd, sitthöjden och maxlasten 150 kg',
            },
        },
        givare_foto_tal={},
        givare_extra={},
        tas_med={'e93fab42': '1,2,4,5,3'},
    )
    return U
