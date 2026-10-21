# -*- coding: utf-8 -*-
"""T78: färg- och storleksval på tre publicerade sidor, ur dolda utkast med egen Aosom-artikel.
  8ad49cfe agilityset i fyra delar, vita stolpar med orange slang: + svart slang (givare 7b1f5287)
  6d35a04f hinderset med koner, sex hinder i blått: + tre hinder i orange (givare d02269aa), alltså färg OCH storlek
  93d1f14d hopfällbar hundtrappa, gräddvit: + brun (givare 01397d97), ommappad från AliExpress till Aosom samma dag
Värdarnas text är sidans verifierade text med riktade ersättningar. Namnen byts där de bar färgen eller antalet hinder (301 från den gamla adressen för hindersetet).
Hundvagnen 594d5f4b (röd) och det grå utkastet 1f360dec är INTE färgsyskon: bilderna visar olika hjul (ekerhjul mot hjul i plast) och olika bredd (54,5 mot 57,5 cm).
Givarnas bilder är deras egna rena bilder utan måttbilden (värden har en). Agility: feedens positioner 1, 2, 4 och 5. Koner: 1, 2, 5 och position 10 (4 är tysk text, 3 är måttbilden).
Trappan: 1, 2, 4 och 5."""
import json
import re

SP = '/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad'

F10_KONER = 'b379ce_b510da57dd9345bca4a50bd46a21cfeb~mv2.jpg'   # d02269aa feedposition 10


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
        assert n == 1, (old[:90], n)
        h = h.replace(old, new)
    return h


F = '<span style="font-weight: 700">'


def bygg(KAT=None):
    U = {}

    # ============ 8ad49cfe: agilityset i fyra delar, vit stomme + orange eller svart slang ============
    k = '8ad49cfe'
    L = live(k)
    assert len(L['items']) == 5 and len(L['variants']) == 1 and not L['options'] and L['visible'] is True
    U[k] = dict(
        namn='Agilityset i fyra delar för hund – 99 cm höga bågar med bärväska',
        slug='agilityset-i-fyra-delar',
        sku=L['variants'][0]['sku'],
        kategori=KAT[k] if KAT else 'Husdjur + Lek & Tillbehör för husdjur',
        seo_titel='Agilityset för hund i fyra delar',
        seo_meta='Agilityset för hund med fyra bågar, 99 cm höga, fyra markpinnar och bärväska. Slangen finns i orange eller svart. Snabbt att ställa upp.',
        html_raw=ersatt(L['html'], [
            ('<p>Fyra agilitybågar för hund, vita med orange bågar, som du ställer upp',
             '<p>Fyra agilitybågar för hund med vita stolpar och en slang i orange eller svart, som du ställer upp'),
            ('Bågarna sätts ihop av vita stolpar och fötter och en orange slang, och fyra markpinnar',
             'Bågarna sätts ihop av vita stolpar och fötter och en slang i orange eller svart, och fyra markpinnar'),
            ('<li><p>Fyra bågar i vitt och orange</p></li>',
             '<li><p>Fyra bågar med vita stolpar och slang i orange eller svart</p></li>'),
            (f'<li><p>{F}Färg:</span> Vitt och orange</p></li>',
             f'<li><p>{F}Färg:</span> vitt med orange eller svart slang</p></li>'),
            (f'<p>99 cm.</p><p>{F}Står bågarna stadigt?</span></p>',
             f'<p>99 cm.</p><p>{F}Vilka färger finns?</span></p><p>Stolparna är vita och slangen finns i orange eller svart. Måtten och innehållet är desamma.</p><p>{F}Står bågarna stadigt?</span></p>'),
        ]),
        alt=live_alt(k),
        bort={},
        extra_bilder=[],
        foto_tal=[],
        undantag=[],
        givare_alt={
            '7b1f5287': {
                '1': 'Fyra agilitybågar med svart slang på vita fötter och en blå bärväska, på vit bakgrund',
                '2': 'En liten hund springer genom en av de svarta agilitybågarna på en gräsmatta framför ett parasoll och en utemöbelgrupp',
                '3': 'Närbild på ett vitt rör i gräset med en markpinne över foten',
                '4': 'Närbild på kopplingen mellan den vita stolpen och fotens rör',
            },
        },
        givare_foto_tal={},
        givare_extra={},
        tas_med={'7b1f5287': '1,2,4,5'},
    )

    # ============ 6d35a04f: hinderset med koner, sex hinder blått + tre hinder orange ============
    k = '6d35a04f'
    L = live(k)
    assert len(L['items']) == 7 and len(L['variants']) == 1 and not L['options'] and L['visible'] is True
    alt = live_alt(k)
    del alt['3']   # bild 3 är pixel för pixel samma foto som bild 2 (uppmätt: medelskillnad 0,0)
    alt['2'] = 'Blå koner och gula stänger uppställda som hinder på en gräsmatta framför ett pergola, med en flicka, en man och två hundar'
    U[k] = dict(
        namn='Hinderset med koner för hund – låga hinder i tre höjder',
        slug='hinderset-med-koner-hund',
        sku='FP-hinderset-koner-hund-6-hinder',
        kategori=KAT[k] if KAT else 'Husdjur + Lek & Tillbehör för husdjur',
        seo_titel='Hinderset med koner för hund',
        seo_meta='Hinderset med koner och gula stänger för hundträning. Ribban på 6, 13,5 eller 20,5 cm. Sex hinder i blått eller tre hinder i orange, med väska.',
        html_raw=ersatt(L['html'], [
            ('<p>Ett hinderset för hundträning med blå koner och gula stänger, som byggs ihop till sex låga hinder. Det tränar',
             '<p>Ett hinderset för hundträning med koner och gula stänger, som byggs ihop till låga hinder. Det finns med sex hinder och blå koner eller med tre hinder och orange koner. Det tränar'),
            ('<h2>Sex hinder i en väska</h2>',
             '<h2>Hinder som ryms i en väska</h2>'),
            ('<li><p>Tolv koner och tolv stänger till sex hinder</p></li>',
             '<li><p>Sex hinder av tolv koner och tolv stänger, eller tre hinder av sex koner och sex stänger</p></li>'),
            ('<li><p>Väger 3 kg</p></li>',
             '<li><p>Väger 3 kg med sex hinder och 2 kg med tre hinder</p></li>'),
            (f'<li><p>{F}Stänger:</span> 12 st, 40 cm långa, Ø25 mm</p></li>',
             f'<li><p>{F}Stänger:</span> 12 st (sex hinder) eller 6 st (tre hinder), 40 cm långa, Ø25 mm</p></li>'),
            (f'<li><p>{F}Färg:</span> Blå och gul</p></li>',
             f'<li><p>{F}Färg:</span> blå eller orange koner, gula stänger</p></li>'),
            (f'<li><p>{F}Vikt:</span> 3 kg</p></li>',
             f'<li><p>{F}Vikt:</span> 3 kg (sex hinder) eller 2 kg (tre hinder)</p></li>'),
            (f'<li><p>{F}I förpackningen:</span> 12 koner, 12 stänger, 6 kopplingar, väska och bruksanvisning</p></li>',
             f'<li><p>{F}I förpackningen:</span> 12 koner, 12 stänger, 6 kopplingar, väska och bruksanvisning (sex hinder) eller 6 koner, 6 stänger, 3 kopplingar, väska och bruksanvisning (tre hinder)</p></li>'),
            (f'<p>Sex hinder, av tolv koner och tolv stänger.</p>',
             f'<p>Sex hinder av tolv koner och tolv stänger, eller tre hinder av sex koner och sex stänger. Du väljer storlek på sidan.</p><p>{F}Vilka färger finns?</span></p><p>Konerna är blå i setet med sex hinder och orange i setet med tre hinder. Stängerna är gula i båda.</p>'),
        ]),
        alt=alt,
        bort={'3': 'samma foto som bild 2 (pixelidentiskt)'},
        extra_bilder=[],
        foto_tal=[],
        undantag=[],
        givare_alt={
            'd02269aa': {
                '1': 'Tre hinder av orange koner och gula stänger, på vit bakgrund',
                '2': 'En flicka, en man och tre hundar på en gräsmatta där en liten hund hoppar över en gul stång mellan orange koner',
                '3': 'En pojke och en liten hund vid två hinder av orange koner och gula stänger på en altan',
                '4': 'En kvinna och en familj tränar hundar som hoppar över låga hinder av orange koner och gula stänger på en gräsmatta',
            },
        },
        givare_foto_tal={},
        givare_extra={'d02269aa': [('6', F10_KONER)]},
        tas_med={'d02269aa': '1,2,5,6'},
    )

    # ============ 93d1f14d: hopfällbar hundtrappa, gräddvit + brun ============
    k = '93d1f14d'
    L = live(k)
    assert len(L['items']) == 6 and len(L['variants']) == 1 and not L['options'] and L['visible'] is True
    U[k] = dict(
        namn=L['name'],
        slug=L['slug'],
        sku='FP-hundtrappa-3-steg-graddvit',
        kategori=KAT[k] if KAT else 'Husdjur + Lek & Tillbehör för husdjur',
        seo_titel='Hopfällbar hundtrappa med 3 steg',
        seo_meta='Hopfällbar hundtrappa med tre halkskyddade steg, 36,5 cm hög och 11,3 cm hopvikt. Gräddvit eller brun, för små hundar upp till 10 kg.',
        html_raw=ersatt(L['html'], [
            ('ingen montering, inga skruvar.</p>',
             'ingen montering, inga skruvar. Trappan finns i gräddvitt och brunt.</p>'),
            ('Till en hög säng behöver du en högre trappa — se köpavsnittet.</p>',
             'Till en hög säng behöver du en högre trappa.</p>'),
            ('Hur mycket plats tar den undanvikt?',
             'Hur mycket plats tar den hopvikt?'),
            ('<li><p>Gräddvitt och svart</p></li>',
             '<li><p>Gräddvitt eller brunt, med svart</p></li>'),
            ('<li><p>Färg: Gräddvitt och svart</p></li>',
             '<li><p>Färg: gräddvitt eller brunt, med svart</p></li>'),
            ('<p>Nej, den kommer färdig ur kartongen. Stegen har halkskyddad EVA-yta och upphöjda sidokanter.</p>',
             f'<p>Nej, den kommer färdig ur kartongen. Stegen har halkskyddad EVA-yta och upphöjda sidokanter.</p><p>{F}Vilka färger finns?</span></p><p>Gräddvitt och brunt, båda med svarta halkskyddade steg. Måtten och stegen är desamma.</p>'),
        ]),
        alt=live_alt(k),
        bort={},
        extra_bilder=[],
        foto_tal=[],
        undantag=[],
        givare_alt={
            '01397d97': {
                '1': 'Brun hopfällbar hundtrappa i tre steg med svarta halkskyddade steg, mot vit bakgrund',
                '2': 'En liten hund med en boll i munnen går upp för den bruna hundtrappan till en soffa där en kvinna sitter',
                '3': 'Den bruna hundtrappan vid en vit soffa på en mönstrad matta i ett vardagsrum',
                '4': 'En liten ljus hund går upp för den bruna hundtrappan till en säng med vita sängkläder',
            },
        },
        givare_foto_tal={},
        givare_extra={},
        tas_med={'01397d97': '1,2,4,5'},
    )
    return U
