# -*- coding: utf-8 -*-
"""N314: tre klösträd med två färger vardera, ur nattens utkast 2026-10-25.
  1bc3a45e klösträd 184 cm i ljusgrått + beige (givare ad550636), båda dolda utkast: värden blir en egen publicerad sida
  56cb4143 klöstunna 75 cm i beige + grått (givare b369bc9b), båda dolda utkast: värden blir en egen publicerad sida
  90573e36 takspänt klösträd 220–240 cm i grönt och rosa (publicerad) + mörkgrått (givare 66cee9e2), ny text och ny adress
Värdarna F1 och F2 skrivs som nya sidor med text för båda färgerna, och givarna får sina bilder och alt-texter före sammanslagningen.
Sammanslagningen kräver en publicerad värd (hindret behall_ej_publicerad vid förkontrollen), så den körs efter värdskrivningen.
Måttbilden (position 3) på båda klöstunnorna bär tysk text (Geeignet für 1-2 Katzen, bis zu 6 kg) och lämnas utanför; den kunde inte beskäras utan att
katten och måttlinjerna kapades. Givarna tar feedens position 1, 2, 4 och 5 och position 10 (positionen finns i feeden för alla tre).
T96: värdens text är sidans verifierade text med riktade ersättningar. Namnet och adressen bar färgen (grönt och rosa) och byts, med omdirigering."""
import json
import re

SP = '/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad'

F10 = json.load(open(f'{SP}/n309_f10/f10.json', encoding='utf-8'))


def live(k):
    return json.load(open(f'{SP}/t15/data/{k}.json', encoding='utf-8'))


def live_alt(k):
    return {str(i): m['alt'] for i, m in enumerate(live(k)['items'], 1)}


def ersatt(h, par):
    for old, new in par:
        n = h.count(old)
        assert n == 1, (old[:90], n)
        h = h.replace(old, new)
    return h


F = '<span style="font-weight: 700">'


def bygg(KAT=None):
    U = {}

    # ============ 1bc3a45e: klösträd 184 cm, ljusgrått + beige ============
    k = '1bc3a45e'
    U[k] = dict(
        namn='Klösträd 184 cm med fem nivåer, två grottor, hängmatta och tre sisalstolpar',
        slug='klostrad-184-cm-fem-nivaer-grottor-hangmatta',
        sku='FP-klostrad-184-cm-ljusgra',
        kategori=KAT[k] if KAT else 'Husdjur + Klösträd',
        seo_titel='Klösträd 184 cm med två grottor',
        seo_meta='Klösträd 184 cm med fem nivåer, två grottor, hängmatta, tre sisalstolpar och tippskyddsband. Finns i ljusgrått och beige. Tål 6 kg per katt.',
        ingress='Ett klösträd på 184 cm med fem nivåer för katter som vill klättra, gömma sig och vila högt upp. Trädet har två grottor, tre vadderade bäddar, en hängmatta, tre sisalstolpar och en klösbräda, och det finns i ljusgrått och beige. Stammarna är 8,7 cm tjocka och ett tippskyddsband följer med.',
        avsnitt=[
            ('Fem nivåer och två grottor',
             'Klösträdet är 184 cm högt med fem nivåer, som ger katten ett eget revir på höjden. Tre vadderade bäddar och två grottor ger separata platser att vila på. Hängmattan är Ø35 cm och ger ett mjukt, svävande viloställe.'),
            ('Stabilt med tippskyddsband',
             'Stammarna är 8,7 cm tjocka, och ett tippskyddsband följer med för stabilare klättring. Klösträdet är 59 cm brett och 49 cm djupt.'),
            ('Tre sisalstolpar och en klösbräda',
             'Tre sisalstolpar och en klösbräda hjälper katten att klösa på rätt ställe i stället för på möblerna.'),
            ('Mjuk plysch med lång lugg',
             'Plyschen på 220 g/m² och vaddering av PP-bomull ger mjuka liggytor. Bädden är 35 × 35 × 8 cm, den nedre grottan 49 × 35 × 31,5 cm och den övre grottan 35 × 30 × 30 cm.'),
            ('Två färger',
             'Klösträdet finns i ljusgrått och beige. Mått, innehåll och uppbyggnad är desamma.'),
            ('Montering',
             'Klösträdet monteras av delar, och i en planerad montering tar det cirka 50 minuter. En leksaksboll, ett tippskyddsband och en bruksanvisning ingår.'),
        ],
        egenskaper=[
            'Klösträd på 184 cm med fem nivåer',
            'Två grottor och tre vadderade bäddar',
            'Hängmatta på Ø35 cm',
            'Tre sisalstolpar och en klösbräda',
            'Stammar på 8,7 cm och tippskyddsband',
            'Plysch på 220 g/m² och vaddering av PP-bomull',
            'Tål 6 kg per katt',
            'Finns i ljusgrått och beige',
        ],
        spec=[
            ('Mått (bredd × djup × höjd)', '59 × 49 × 184 cm'),
            ('Bädd', '35 × 35 × 8 cm'),
            ('Nedre grotta', '49 × 35 × 31,5 cm'),
            ('Övre grotta', '35 × 30 × 30 cm'),
            ('Plattformar på andra och tredje nivån', '59 × 49 cm'),
            ('Liten hoppplattform', '30 × 30 cm'),
            ('Stam', 'Ø8,7 cm'),
            ('Ramp', '46,5 × 16,5 cm'),
            ('Hängmatta', 'Ø35 cm'),
            ('Färg', 'ljusgrå eller beige'),
            ('Material', 'spånskiva, plysch på 220 g/m², PP-bomull, pappersrör och sisal'),
            ('Max belastning', '6 kg per katt'),
            ('Fraktvikt', '22,65 kg'),
            ('Paketmått', '62,5 × 52,5 × 36 cm'),
            ('Ingår', '1 klösträd, 1 leksaksboll, 1 tippskyddsband och 1 bruksanvisning'),
            ('Montering', 'krävs, cirka 50 minuter'),
        ],
        skotsel='Dammsug plyschen och sisalen försiktigt. Kontrollera då och då att alla skruvar sitter fast och att tippskyddsbandet är spänt.',
        faq=[
            ('Hur stort är klösträdet?', 'Det är 184 cm högt, 59 cm brett och 49 cm djupt.'),
            ('Hur många nivåer och grottor har det?', 'Fem nivåer med två grottor, tre vadderade bäddar och en hängmatta.'),
            ('Hur mycket tål det?', 'Klösträdet tål 6 kg per katt.'),
            ('Vilka färger finns?', 'Ljusgrått och beige. Mått och innehåll är desamma.'),
            ('Hur lång tid tar monteringen?', 'I en planerad montering tar den cirka 50 minuter, och en bruksanvisning följer med.'),
        ],
        sakerhet=['Maxbelastning: 6 kg per katt.', 'Tippskyddsband ingår.'],
        alt={
            '1': 'Ljusgrått klösträd med fem nivåer, två grottor, en hängmatta, tre sisalstolpar och en ramp, på vit bakgrund',
            '2': 'Klösträdet i ett vardagsrum med en grå katt överst, en orange katt på nivån under och en kalikåkatt som klättrar vid grottan, framför en soffa och en växt',
            '3': 'Måttbild: klösträdet är 184 cm högt, 59 cm brett och 49 cm djupt, med en kvinna som håller en katt bredvid',
            '4': 'Klösträdet i ett ljust vardagsrum med en katt överst, en kalikåkatt vid en grotta och en katt som ligger i den nedre grottan',
            '5': 'Klösträdet i ett hörn av ett vardagsrum med en grå och vit katt överst, en kalikåkatt på nivån under och en orange och vit katt i den nedre grottan',
            '10': 'Klösträdet i ett vardagsrum med en katt överst, en katt i en grotta och en grå katt i hängmattan, framför en soffa och ett fönster',
        },
        bort={},
        extra_bilder=[('10', F10['1bc3a45e'])],
        foto_tal=[],
        rad_tal=[],
        undantag=[],
        givare_alt={
            'ad550636': {
                '1': 'Beige klösträd med fem nivåer, två grottor, en hängmatta, tre sisalstolpar och en ramp, på vit bakgrund',
                '2': 'Klösträdet i ett vardagsrum med en grå katt överst, en orange katt på nivån under och en kalikåkatt som klättrar vid grottan, framför en soffa och en växt',
                '3': 'Klösträdet i ett ljust vardagsrum med en katt överst, en kalikåkatt vid en grotta och en katt som ligger i den nedre grottan',
                '4': 'Klösträdet i ett hörn av ett vardagsrum med en grå och vit katt överst, en kalikåkatt på nivån under och en orange och vit katt i den nedre grottan',
                '5': 'Klösträdet i ett vardagsrum med en katt överst, en katt i en grotta och en grå katt i hängmattan, framför en soffa och ett fönster',
            },
        },
        givare_foto_tal={},
        givare_extra={'ad550636': [('6', F10['ad550636'])]},
        tas_med={'ad550636': '1,2,4,5,6'},
    )

    # ============ 56cb4143: klöstunna 75 cm, beige + grå ============
    k = '56cb4143'
    U[k] = dict(
        namn='Klöstunna 75 cm med tre grottor och en bädd överst – förmonterad, Ø35 cm',
        slug='klostunna-75-cm-tre-grottor-badd-overst',
        sku='FP-klostunna-75-cm-beige',
        kategori=KAT[k] if KAT else 'Husdjur + Klösträd',
        seo_titel='Klöstunna 75 cm med tre grottor',
        seo_meta='Klöstunna Ø35 × 75 cm med tre grottor och en bädd överst, sisal runt om och plysch. Finns i beige och grått. Förmonterad, för 1–2 katter upp till 6 kg.',
        ingress='En klöstunna på 75 cm med tre grottor och en bädd överst, för katter som vill klösa, klättra, gömma sig och vila i samma möbel. Tunnan är rund med sisal runt om, plysch på 220 g/m² och tre mjuka kuddar. Den är förmonterad, avsedd för 1–2 katter upp till 6 kg och finns i beige och grått.',
        avsnitt=[
            ('Fyra nivåer med tre grottor',
             'Tunnan har fyra nivåer: tre innernivåer med varsin ingång och en bädd överst. Det ger katten en spännande väg att klättra, gömma sig, vila och se sig omkring från en upphöjd plats. Ingångarna är 21 cm breda och 17, 20 och 16 cm höga.'),
            ('Sisal runt om för att klösa',
             'Sisalmattan på 1 400 g/m² sitter runt hela tunnan och uppmuntrar katten att klösa, vilket hjälper till att skona möblerna.'),
            ('Mjuk plysch och tre kuddar',
             'Plysch med lång lugg på 220 g/m² och PP-bomull ger mjuk komfort i det slutna utrymmet. De tre mjuka kuddarna är Ø33 × 2 cm och gör det skönt att ta en tupplur. Den övre bädden är Ø35 × 7 cm och innernivåerna Ø34 × 20 cm.'),
            ('Lätt att hålla ren',
             'Den övre bädden går att maskintvätta, och kuddarna går att handtvätta.'),
            ('Förmonterad',
             'Klöstunnan är förmonterad och avsedd för 1–2 katter upp till 6 kg, så du slipper montera den. En bruksanvisning ingår.'),
            ('Två färger',
             'Klöstunnan finns i beige och grått. Mått och innehåll är desamma.'),
        ],
        egenskaper=[
            'Klöstunna på 75 cm med tre grottor och en bädd överst',
            'Fyra nivåer: tre innernivåer och en övre bädd',
            'Sisalmatta på 1 400 g/m² runt hela tunnan',
            'Plysch på 220 g/m² och PP-bomull',
            'Tre mjuka kuddar på Ø33 × 2 cm',
            'Övre bädd som går att maskintvätta och kuddar som går att handtvätta',
            'Förmonterad, för 1–2 katter upp till 6 kg',
            'Finns i beige och grått',
        ],
        spec=[
            ('Mått (bredd × djup × höjd)', '35 × 35 × 75 cm'),
            ('Innernivåer', 'Ø34 × 20 cm (var och en)'),
            ('Övre bädd', 'Ø35 × 7 cm'),
            ('Kudde', 'Ø33 × 2 cm'),
            ('Ingångar', '21 × 17 cm, 21 × 20 cm och 21 × 16 cm'),
            ('Färg', 'beige eller grå'),
            ('Material', 'spånskiva, plysch, sisal och PP-bomull'),
            ('Lämplig för', '1–2 katter upp till 6 kg'),
            ('Fraktvikt', '8,15 kg'),
            ('Paketmått', '38 × 37 × 73,5 cm'),
            ('Ingår', '1 klöstunna och 1 bruksanvisning'),
            ('Montering', 'förmonterad'),
        ],
        skotsel='Maskintvätta den övre bädden vid behov och handtvätta kuddarna. Dammsug sisalen och plyschen försiktigt.',
        faq=[
            ('Hur stor är klöstunnan?', 'Den är 35 cm bred, 35 cm djup och 75 cm hög.'),
            ('Hur många grottor har den?', 'Tre innernivåer med varsin ingång och en bädd överst.'),
            ('Behöver den monteras?', 'Nej, klöstunnan är förmonterad.'),
            ('Vilka katter passar den för?', 'Den är avsedd för 1–2 katter upp till 6 kg.'),
            ('Går den att tvätta?', 'Ja, den övre bädden går att maskintvätta och kuddarna går att handtvätta.'),
            ('Vilka färger finns?', 'Beige och grått. Mått och innehåll är desamma.'),
        ],
        sakerhet=['Rekommenderad kattvikt: upp till 6 kg, 1–2 katter.'],
        alt={
            '1': 'Beige klöstunna med en rund bädd i plysch överst och tre öppningar med mjuka kuddar, sisal runt om, på vit bakgrund',
            '2': 'Klöstunnan vid en säng i ett sovrum, med en orange katt som ligger i bädden överst och en vit och brun katt som står bredvid',
            '4': 'En kvinna som leker med en fjäderleksak vid klöstunnan bredvid en soffa, med en katt som ligger i bädden överst och en som tittar ut ur en öppning',
            '5': 'En kvinna som leker med en katt som sträcker sig ut ur en öppning på klöstunnan, med en annan katt i bädden överst, vid en soffa och ett fönster',
            '10': 'Klöstunnan vid en soffa med en orange katt i bädden överst och en grå och vit katt i en öppning',
        },
        bort={'3': 'tysk text i bilden (Geeignet für 1-2 Katzen, bis zu 6 kg)'},
        extra_bilder=[('10', F10['56cb4143'])],
        foto_tal=[],
        rad_tal=[],
        undantag=[],
        givare_alt={
            'b369bc9b': {
                '1': 'Grå klöstunna med en rund bädd i grå plysch överst och tre öppningar med mjuka kuddar, sisal runt om, på vit bakgrund',
                '2': 'Klöstunnan vid en säng i ett sovrum, med en orange katt som ligger i bädden överst och en vit och brun katt som står bredvid',
                '3': 'En kvinna som leker med en fjäderleksak vid klöstunnan bredvid en soffa, med en katt som ligger i bädden överst och en som tittar ut ur en öppning',
                '4': 'En kvinna som leker med en katt som sträcker sig ut ur en öppning på klöstunnan, med en annan katt i bädden överst, vid en soffa och ett fönster',
                '5': 'Klöstunnan vid en soffa med en orange katt i bädden överst och en grå och vit katt i en öppning',
            },
        },
        givare_foto_tal={},
        givare_extra={'b369bc9b': [('6', F10['b369bc9b'])]},
        tas_med={'b369bc9b': '1,2,4,5,6'},
    )

    # ============ 90573e36: takspänt klösträd 220–240 cm, grönt och rosa + mörkgrått ============
    k = '90573e36'
    L = live(k)
    assert len(L['items']) == 5 and len(L['variants']) == 1 and not L['options'] and L['visible'] is True
    U[k] = dict(
        namn='Klösträd 220–240 cm som spänns mellan golv och tak – med håla och hängmatta',
        slug='klostrad-220-240-cm-golv-till-tak',
        sku=L['variants'][0]['sku'],
        kategori=KAT[k] if KAT else 'Husdjur + Klösträd',
        seo_titel='Klösträd 220–240 cm golv till tak',
        seo_meta='Klösträd som spänns mellan golv och tak, ställbart 220–240 cm. Håla, hängmatta, ramp och tippskyddsrem. Tar 30 × 25 cm golvyta. För katter upp till 5 kg.',
        html_raw=ersatt(L['html'], [
            ('Fotplattan tar bara 30 × 25 cm av golvet.</p><h2>Det här får du</h2>',
             'Fotplattan tar bara 30 × 25 cm av golvet. Klösträdet finns i grönt och rosa eller i mörkgrått.</p><h2>Det här får du</h2>'),
            ('<li><p>Klädd i teddyfleece</p></li>',
             '<li><p>Klädd i teddyfleece</p></li><li><p>Finns i grönt och rosa eller i mörkgrått</p></li>'),
            ('<h2>Passar inte den här?</h2><p>Fler klösmöbler hos oss: <a href="https://www.fyndplats.se/produkt/klostrad-takspant-220-265-cm" target="_self">takspänt klösträd 220–265 cm</a>, <a href="https://www.fyndplats.se/produkt/klospelare-220-260-cm-tva-liggytor" target="_self">takspänd klöspelare med två liggytor</a>, <a href="https://www.fyndplats.se/produkt/klostrad-230-275-cm-gront-katthus" target="_self">grönt takspänt klösträd med katthus</a>.</p>', ''),
            (f'<li><p>{F}Färg:</span> grönt och rosa</p></li>',
             f'<li><p>{F}Färg:</span> grönt och rosa eller mörkgrått</p></li>'),
            (f'<p>{F}Hur mycket golvyta tar den?</span></p><p>30 × 25 cm.</p>',
             f'<p>{F}Hur mycket golvyta tar den?</span></p><p>30 × 25 cm.</p><p>{F}Vilka färger finns?</span></p><p>Grönt och rosa eller mörkgrått. Mått och innehåll är desamma.</p>'),
        ]),
        alt=live_alt(k),
        bort={},
        extra_bilder=[],
        foto_tal=[],
        undantag=[],
        givare_alt={
            '66cee9e2': {
                '1': 'Mörkgrått takspänt klösträd med hängmatta, två plan och en stängd håla med en ramp nedtill, på vit bakgrund',
                '2': 'Klösträdet i ett sovrum med mintgröna väggar, med en orange katt i hängmattan, en på planet under och en i hålan',
                '3': 'Måttbild i ett vitt rum: klösträdet är 220–240 cm högt, hålan är Ø33 × 31 cm och golvplattan är 30 × 25 cm',
                '4': 'Klösträdet mellan golv och tak i ett vardagsrum, med en katt som hoppar mellan planen, en katt vid hängmattan och en kvinna i soffan',
            },
        },
        givare_foto_tal={},
        givare_extra={'66cee9e2': [('6', F10['66cee9e2'])]},
        tas_med={'66cee9e2': '1,2,3,6'},
    )

    return U
