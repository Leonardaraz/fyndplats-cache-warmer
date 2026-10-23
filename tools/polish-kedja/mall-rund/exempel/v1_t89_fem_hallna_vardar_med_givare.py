# -*- coding: utf-8 -*-
"""T89: färgval på fem publicerade Aosom-sidor som hållits av bildtaket (PR #749 mergad 2026-10-21, taket är 50).
  718fb6d0 runt matbord Ø120 cm, korsben: + vit med vita ben (givare 49a3bbfb, publicerad sida med 301 till värden)
  5a6ea7f3 relaxfåtölj med massage och fotpall: + ljusgrå i konstläder (givare 74074760, publicerad sida med 301)
  eb1e475e bäddfåtölj med armstöd i gummiträ: + grön (givare c671cd37, publicerad sida med 301)
  85f1694f klaffbord 120 × 80 cm på hjul: + svart (givare 51335ed1, dolt utkast)
  571e37bf cykelkärra för hund med 20-tumshjul: + grå och svart (givare 3f2af40f, dolt utkast)
Värdarnas text är sidans verifierade text med riktade ersättningar: färglistan i ingressen, i spec-raden och i frågan om färger.
Givarnas bilder är deras egna rena bilder. Cykelkärrans givare har tysk säljgrafik på position 3 och 8 (gallerinummer 3 och 4), så den får feedens position 10
(en ren sidobild på vit botten) i stället."""
import json
import re

SP = '/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad'

F10_KARRA = 'b379ce_b8e200cce42d46759f2eae895120c942~mv2.jpg'   # 3f2af40f feedposition 10

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

    # ============ 718fb6d0: runt matbord Ø120 cm, + vit med vita ben ============
    k = '718fb6d0'
    L = live(k)
    assert len(L['items']) == 21 and len(L['variants']) == 4 and len(L['options']) == 1 and L['visible'] is True
    U[k] = dict(
        namn=L['name'],
        slug=L['slug'],
        sku=L['variants'][0]['sku'],
        sammanslagen='4',
        kategori=KAT[k] if KAT else 'Hem & Inredning + Möbler + Matbord & stolar',
        seo_titel='Runt matbord 120 cm med korsben i stål',
        seo_meta='Runt matbord Ø120 × 75 cm för fyra personer. Korsade ben i pulverlackerat stål, reptålig skiva i träkänsla och ställbara fötter. Finns i flera färger.',
        html_raw=ersatt(L['html'], [
            ('Skivan finns i ek, svart, rustikt brunt och mörkbrunt, alltid med svarta ben.',
             'Skivan finns i ek, svart, rustikt brunt, mörkbrunt och vitt. Den vita har vita ben, och de andra har svarta ben.'),
            ('Ek, svart, rustik brun eller mörkbrun skiva, svarta ben',
             'Ek, svart, rustik brun, mörkbrun eller vit skiva, vita ben på den vita och svarta ben på de andra'),
            ('Skivan finns i ek, svart, rustikt brunt och mörkbrunt, alla med svarta korsade ben.',
             'Skivan finns i ek, svart, rustikt brunt, mörkbrunt och vitt. Den vita har vita korsade ben, och de andra har svarta korsade ben.'),
        ]),
        alt=live_alt(k),
        bort={},
        extra_bilder=[],
        foto_tal=[],
        undantag=[UND],
        givare_alt={
            '49a3bbfb': {
                '1': 'Runt matbord med vit skiva och vita korsade ben av stål, på vit bakgrund',
                '2': 'Det vita runda bordet i ett kök, med två stolar i trä och beige tyg, en blomvas och en bricka med frukost',
                '3': 'Det vita runda bordet dukat med fyra trästolar i ett ljust rum med glasdörrar mot en trädgård',
                '4': 'Det vita runda bordet med två grå stolar med svarta ben i ett ljust rum med en grön växt',
                '5': 'Måttbild: det vita bordet är 120 cm i diameter och 75 cm högt och bär 40 kg',
            },
        },
        givare_foto_tal={},
        givare_extra={},
        tas_med={'49a3bbfb': '1,2,3,4,5'},
    )

    # ============ 5a6ea7f3: relaxfåtölj med massage, + ljusgrå konstläder ============
    k = '5a6ea7f3'
    L = live(k)
    assert len(L['items']) == 15 and len(L['variants']) == 3 and len(L['options']) == 1 and L['visible'] is True
    U[k] = dict(
        namn=L['name'],
        slug=L['slug'],
        sku=L['variants'][0]['sku'],
        sammanslagen='3',
        kategori=KAT[k] if KAT else 'Hem & Inredning + Möbler + Fåtöljer + Massagestolar + Massage & Återhämtning + Skönhet & Hälsa',
        seo_titel='Relaxfåtölj med massage och fotpall',
        seo_meta='Relaxfåtölj med massage och fotpall: tio vibrationspunkter, tio lägen och tio styrkor. Ryggen lutar till 145° och fåtöljen bär 150 kg.',
        html_raw=ersatt(L['html'], [
            ('Fåtöljen finns i svart eller krämvitt konstläder och i grått tyg i sammetslook.',
             'Fåtöljen finns i svart, krämvitt eller ljusgrått konstläder och i grått tyg i sammetslook.'),
            ('Klädsel:</span> konstläder, eller tyg i sammetslook på den grå',
             'Klädsel:</span> konstläder på svart, krämvit och ljusgrå, tyg i sammetslook på grå'),
            ('Färg:</span> svart, krämvit eller grå',
             'Färg:</span> svart, krämvit, ljusgrå eller grå'),
            ('dammsug den grå klädseln med möbelmunstycke',
             'dammsug den grå klädseln i sammetslook med möbelmunstycke'),
            ('Svart och krämvitt konstläder, och grått tyg i sammetslook.',
             'Svart, krämvitt och ljusgrått konstläder, och grått tyg i sammetslook.'),
        ]),
        alt=live_alt(k),
        bort={},
        extra_bilder=[],
        foto_tal=[],
        undantag=[UND],
        givare_alt={
            '74074760': {
                '1': 'Ljusgrå massagefåtölj i konstläder med fotpall och rund svart fot, på vit bakgrund',
                '2': 'En kvinna läser i den ljusgrå massagefåtöljen med fötterna på fotpallen, i ett ljust rum med en hatthylla',
                '3': 'Närbild på två händer som trycker mot det ljusgrå konstlädret',
                '4': 'Närbild på en hand vid armstödets söm i ljusgrått konstläder',
                '5': 'Måttbild: fåtöljen är 76 × 80 × 102 cm med sits 53 × 52,5 cm, och fotpallen är 47 × 44 × 40 cm',
            },
        },
        givare_foto_tal={},
        givare_extra={},
        tas_med={'74074760': '1,2,3,4,5'},
    )

    # ============ eb1e475e: bäddfåtölj med armstöd i gummiträ, + grön ============
    k = 'eb1e475e'
    L = live(k)
    assert len(L['items']) == 30 and len(L['variants']) == 6 and len(L['options']) == 1 and L['visible'] is True
    U[k] = dict(
        namn=L['name'],
        slug=L['slug'],
        sku=L['variants'][0]['sku'],
        sammanslagen='6',
        kategori=KAT[k] if KAT else 'Hem & Inredning + Möbler + Fåtöljer + Bäddfåtöljer',
        seo_titel='Bäddfåtölj med armstöd i gummiträ',
        seo_meta='Bäddfåtölj med stålstomme, armstöd i gummiträ och rygg i fem lägen till plant. Liggyta 185 × 60 cm, bär 120 kg. Finns i flera färger.',
        html_raw=ersatt(L['html'], [
            ('Den finns i gräddvitt, taupe, mörkgrått, beige, svart och blått.',
             'Den finns i gräddvitt, taupe, mörkgrått, beige, svart, blått och grönt.'),
            ('Färg:</span> Gräddvit, taupe, mörkgrå, beige, svart eller blå',
             'Färg:</span> Gräddvit, taupe, mörkgrå, beige, svart, blå eller grön'),
            ('Gräddvit, taupe, mörkgrå, beige, svart och blå.',
             'Gräddvit, taupe, mörkgrå, beige, svart, blå och grön.'),
        ]),
        alt=live_alt(k),
        bort={},
        extra_bilder=[],
        foto_tal=[],
        undantag=[UND],
        givare_alt={
            'c671cd37': {
                '1': 'Grön bäddfåtölj i sammetslook med kudde och armstöd i trä på en svart stålram, på vit bakgrund',
                '2': 'Den gröna bäddfåtöljen i ett rum med en stor växt, tapet med mönster och parkettgolv',
                '3': 'Den gröna fåtöljen utfälld som en bädd med kudde på en flätad matta, bredvid en bokhög',
                '4': 'Närbild på det gröna sammetsliknande tyget på sitsen och ett av fåtöljens svarta ben',
                '5': 'Måttbild: fåtöljen är 63 × 73 × 81 cm med sits 56 × 57 cm och sitthöjd 37 cm, och som bädd 183 × 60 cm',
            },
        },
        givare_foto_tal={},
        givare_extra={},
        tas_med={'c671cd37': '1,2,3,4,5'},
    )

    # ============ 85f1694f: klaffbord 120 × 80 cm på hjul, + svart ============
    k = '85f1694f'
    L = live(k)
    assert len(L['items']) == 25 and len(L['variants']) == 5 and len(L['options']) == 1 and L['visible'] is True
    U[k] = dict(
        namn=L['name'],
        slug=L['slug'],
        sku=L['variants'][0]['sku'],
        sammanslagen='5',
        kategori=KAT[k] if KAT else 'Hem & Inredning + Möbler + Matbord & stolar',
        seo_titel='Klaffbord 120 × 80 cm på hjul för sex personer',
        seo_meta='Klaffbord som fälls ihop till 26 cm och ut till 120 × 80 cm för upp till sex personer. Sex hjul med broms, bär 50 kg. Finns i flera färger.',
        html_raw=ersatt(L['html'], [
            ('finns i grå betonglook, rustikt brunt, vitt och ek med svart eller vitt stativ.',
             'finns i grå betonglook, rustikt brunt, vitt, svart och ek med svart eller vitt stativ.'),
            ('Färg:</span> Grå betonglook, rustik brun, vit, ek med svart stativ eller ek med vitt stativ',
             'Färg:</span> Grå betonglook, rustik brun, vit, svart, ek med svart stativ eller ek med vitt stativ'),
            ('Grå betonglook, rustik brun, vit, ek med svart stativ och ek med vitt stativ.',
             'Grå betonglook, rustik brun, vit, svart, ek med svart stativ och ek med vitt stativ.'),
        ]),
        alt=live_alt(k),
        bort={},
        extra_bilder=[],
        foto_tal=[],
        undantag=[UND],
        givare_alt={
            '51335ed1': {
                '1': 'Svart klaffbord med skiva i träkänsla och svart stativ på hjul, utfällt och sett snett uppifrån på vit bakgrund',
                '2': 'Det svarta klaffbordet utfällt och dukat med tallrikar och en blomvas i ett kök, med stolar i trä runt bordet',
                '3': 'Måttbild: det svarta bordet med en klaff uppe, hopfällt till 26 cm och utfällt till 120 × 80 cm, 73 cm högt, och det bär 50 kg',
                '4': 'Det svarta klaffbordet som arbetsplats med en bärbar dator, en lampa och böcker, bredvid en svart kontorsstol',
                '5': 'Det svarta klaffbordet hopfällt intill en ljus soffa, med en bordslampa och en kopp på skivan',
            },
        },
        givare_foto_tal={},
        givare_extra={},
        tas_med={'51335ed1': '1,2,3,4,5'},
    )

    # ============ 571e37bf: cykelkärra för hund, + grå och svart ============
    k = '571e37bf'
    L = live(k)
    assert len(L['items']) == 19 and len(L['variants']) == 5 and len(L['options']) == 1 and L['visible'] is True
    U[k] = dict(
        namn=L['name'],
        slug=L['slug'],
        sku=L['variants'][0]['sku'],
        sammanslagen='5',
        kategori=KAT[k] if KAT else 'Husdjur + Selar, Koppel & Transport',
        seo_titel='Cykelkärra för hund med 20-tumshjul',
        seo_meta='Cykelkärra för hund med 20-tums lufthjul, universalkoppling och ingång fram och bak. Bär 20 kg. Finns i sex färgställningar.',
        html_raw=ersatt(L['html'], [
            ('<td><p>röd och svart, grå och blå, svart och vit, blå och svart eller grå och turkos</p></td>',
             '<td><p>röd och svart, grå och blå, svart och vit, blå och svart, grå och turkos eller grå och svart</p></td>'),
            ('<p>Röd och svart, grå och blå, svart och vit, blå och svart eller grå och turkos. Måtten, hjulen, kopplingen och lådan är lika.</p>',
             '<p>Röd och svart, grå och blå, svart och vit, blå och svart, grå och turkos eller grå och svart. Måtten, hjulen, kopplingen och lådan är lika.</p>'),
        ]),
        alt=live_alt(k),
        bort={},
        extra_bilder=[],
        foto_tal=[],
        undantag=[UND],
        givare_alt={
            '3f2af40f': {
                '1': 'Grå och svart cykelkärra för hund med röd flagga och två stora ekerhjul, sedd snett framifrån på vit bakgrund',
                '2': 'En corgi tittar ut ur den grå och svarta cykelkärran, som står bakom en cykel på en gångväg framför blommande buskar',
                '3': 'Närbild på kärrans dragkedja och svarta nät mot det grå tyget',
                '4': 'Grå och svart cykelkärra för hund med röd flagga och dragstång, sedd från sidan på vit bakgrund',
            },
        },
        givare_foto_tal={},
        givare_extra={'3f2af40f': [('6', F10_KARRA)]},
        tas_med={'3f2af40f': '1,2,5,6'},
    )
    return U
