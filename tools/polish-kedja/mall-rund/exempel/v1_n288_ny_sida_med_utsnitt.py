# -*- coding: utf-8 -*-
"""N288: en grå hundvagn med tre hjul som egen sida, ur nattens utkast 2026-10-21 (1f360dec).
Den är INTE en färg på den röda hundvagnen 594d5f4b: bilderna visar tre svarta plasthjul med mönstrad yta mot den rödas ekerhjul, och källan anger 57,5 cm bredd mot 54,5 cm.
Positioner som stryks: 3 (kortet bär en logotyp, ersatt av ett utsnitt som bild 6) och 4 (tysk text i bilden). Utsnittet är Wix beskärnings-adress x_785,y_190,w_1055,h_1592
ur position 3, md5-parat mot adressens svar. Feedens positioner 4–7 är tyska säljgrafiker; position 10 är en närbild av samma fog som position 5 och tas inte med."""

SP = '/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad'

UTSNITT = 'b379ce_f553e96f2422476db0cce2ddcc914e16~mv2.jpg'   # utsnitt ur position 3


def bygg(KAT):
    U = {}

    # ============ 1f360dec: grå hundvagn med tre hjul ============
    k = '1f360dec'
    U[k] = dict(
        namn='Hundvagn i grått med korg och justerbar sufflett – för hundar under 10 kg',
        slug='hundvagn-gra-korg-justerbar-sufflett',
        sku='FP-hundvagn-gra-tre-hjul',
        kategori=KAT[k],
        seo_titel='Hundvagn i grått med korg och sufflett',
        seo_meta='Grå hundvagn med tre hjul, framhjul som går att låsa, sufflett i tre lägen och korg under kabinen. Hopfälld 98 × 57 × 44 cm. För hundar under 10 kg.',
        ingress='En grå hundvagn med tre stora hjul för små hundar med en kroppslängd under 41 cm och en vikt under 10 kg. Framhjulet går att låsa, suffletten kan ställas i tre lägen och under kabinen sitter en korg. Vagnen viks ihop till 98 × 57 × 44 cm.',
        avsnitt=[
            ('Tre stora hjul och ett framhjul som går att låsa',
             'Vagnen har stora hjul som klarar fler typer av underlag. Framhjulet går att låsa: med låst framhjul passar vagnen för jogging, och med olåst framhjul för promenader.'),
            ('Sufflett i tre lägen',
             'Suffletten går att ställa i tre lägen och har ett nätfönster, som ger bra luftcirkulation och bättre sikt för hunden.'),
            ('Två säkerhetskoppel och en korg under kabinen',
             'Inuti sitter två säkerhetskoppel som håller hunden på plats. Under kabinen finns en korg på 32 × 30 × 16 cm för hundens saker och dina egna.'),
            ('Hopfällbar',
             'Vagnen går att fälla ihop till 98 × 57 × 44 cm, vilket gör den lätt att förvara och ta med.'),
            ('Vilka hundar passar',
             'Kabinen är 66 × 35 × 52 cm och gjord för små hundar och miniatyrhundar med en kroppslängd under 41 cm och en vikt under 10 kg. Vagnens egen bärkraft är 25 kg, men den siffran gäller vagnen och inte hunden.'),
            ('Stål och oxfordväv',
             'Ramen är av stål och kabinen av 600D oxfordväv i grått och svart.'),
        ],
        egenskaper=[
            'Tre stora hjul och ett framhjul som går att låsa',
            'Sufflett i tre lägen med nätfönster',
            'Två säkerhetskoppel inuti',
            'Korg under kabinen på 32 × 30 × 16 cm',
            'Mugghållare vid handtaget',
            'Viks ihop till 98 × 57 × 44 cm',
            'För hundar med en kroppslängd under 41 cm och en vikt under 10 kg',
            'Stålram och 600D oxfordväv i grått och svart',
        ],
        spec=[
            ('Yttermått', '109,5 × 57,5 × 106,5 cm'),
            ('Hopfälld', '98 × 57 × 44 cm'),
            ('Kabin', '66 × 35 × 52 cm'),
            ('Förvaringskorg', '32 × 30 × 16 cm'),
            ('Passar hund', 'kroppslängd under 41 cm och vikt under 10 kg'),
            ('Vagnens bärkraft', '25 kg'),
            ('Hjul', 'tre, med låsbart framhjul'),
            ('Sufflett', 'tre lägen, med nätfönster'),
            ('Säkerhetskoppel', 'två, invändiga'),
            ('Material', 'stål och 600D oxfordväv'),
            ('Färg', 'grå och svart'),
            ('Fraktvikt', '10,8 kg'),
            ('Paketmått', '87 × 46 × 33 cm'),
            ('Ingår', 'Hundvagn och bruksanvisning'),
        ],
        skotsel='Lås framhjulet innan du ökar farten. Torka av ramen och kabinens tyg med en fuktig trasa och låt vagnen torka innan du viker ihop den. Borsta ur kabinen från hår och smuts.',
        faq=[
            ('Hur stor hund passar i vagnen?', 'Hundar med en kroppslängd under 41 cm och en vikt under 10 kg. Kabinen är 66 × 35 × 52 cm.'),
            ('Vad betyder 25 kg?', 'Det är vagnens bärkraft. Hunden ska väga under 10 kg.'),
            ('Går framhjulet att låsa?', 'Ja. Med låst framhjul passar vagnen för jogging och med olåst framhjul för promenader.'),
            ('Hur liten blir vagnen hopfälld?', '98 × 57 × 44 cm.'),
            ('Har den en korg?', 'Ja, en korg på 32 × 30 × 16 cm under kabinen.'),
            ('Går suffletten att ställa?', 'Ja, i tre lägen, och den har ett nätfönster.'),
            ('Hur mycket väger vagnen i frakten?', 'Fraktvikten är 10,8 kg.'),
            ('Vad är den gjord av?', 'Stålram och 600D oxfordväv i grått och svart.'),
        ],
        sakerhet=['Hunden ska ha en kroppslängd under 41 cm och väga under 10 kg.'],
        alt={
            '1': 'Grå hundvagn med tre svarta hjul, mugghållare vid handtaget och sufflett med nätfönster, mot vit bakgrund',
            '2': 'Ett par går på en gångväg i en höstpark med den grå hundvagnen, där en liten vit hund sitter i kabinen',
            '5': 'Närbild på vagnens svarta ram med en rund fog med en nallebjörn i relief, och sufflettens tyg och dragkedja ovanför',
            '6': 'Måttbild: vagnen är 109,5 cm lång, 57,5 cm bred och 106,5 cm hög, och kabinen 66 × 35 × 52 cm, med en kvinna som kör den på en gångväg',
        },
        bort={'3': 'kortet bär en logotyp i bilden (ersatt av utsnittet som bild 6)', '4': 'tysk text i bilden'},
        extra_bilder=[('6', UTSNITT)],
        foto_tal=[],
        rad_tal=[],
        undantag=[],
    )
    return U
