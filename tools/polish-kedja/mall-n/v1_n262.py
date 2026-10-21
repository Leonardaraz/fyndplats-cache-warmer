# -*- coding: utf-8 -*-
"""N262: två egna sidor utan samma vara som någon publicerad sida: skyddsöverdraget för en hel hollywoodgunga (skilt från det publicerade sitsöverdraget på 185 × 76 × 81 cm) och paviljongtaket 3 × 3 m i kaffebrunt med två nivåer (skilt från de publicerade takduken på 180 g/m² och 2,5 kg)."""

FILER = {}

# Utsnitten som ligger i Media Manager (Wix egen beskärning av originalfilen, uppladdad och md5-parad mot adressens svar)
KLIPP = {
    'ea766927': {'2': 'b379ce_128ff7e64b2c459381891926af4fc914~mv2.jpg',
                 '4': 'b379ce_3749a41827d34c6d972242192c0c1cf8~mv2.jpg',
                 '5': 'b379ce_cd4e6ddde92447e19011c157f28c97c4~mv2.jpg'},
    '719ed522': {'2': 'b379ce_c08f690f19b54b72b6e708647a72658d~mv2.jpg',
                 '3': 'b379ce_583c890d81a94b2bad0b848b0f4c83e8~mv2.jpg',
                 '4': 'b379ce_d3d213a9231e4a26ad773a7bc46a77f4~mv2.jpg',
                 '5': 'b379ce_ce074e48658b46659355571637b1d1f1~mv2.jpg'},
}


def bygg(KAT):
    U = {}

    # ============ ea766927: skyddsöverdrag för hollywoodgunga ============
    U['ea766927'] = dict(
        namn='Skyddsöverdrag för hollywoodgunga i svart oxfordtyg – 220 × 125 × 172 cm',
        slug='skyddsoverdrag-hollywoodgunga-svart-220-125-172-cm',
        sku='FP-skyddsoverdrag-hollywoodgunga-svart',
        kategori=KAT['ea766927'],
        seo_titel='Skyddsöverdrag för hollywoodgunga, svart',
        seo_meta='Svart skyddsöverdrag i oxfordtyg med PU-beläggning för en hel hollywoodgunga. 220 × 125 × 172 cm, med dragkedja och snöre. Vattentätt och lätt att rengöra.',
        ingress=('Ett svart skyddsöverdrag som täcker en hel hollywoodgunga och mäter 220 × 125 × 172 cm. '
                 'Det är gjort av oxfordtyg i 100 % polyester med PU-beläggning och skyddar gungan mot UV-strålning, vind, regn och fågelspillning.'),
        avsnitt=[
            ('Täcker hela gungan',
             'Överdraget är 220 cm brett, 125 cm djupt och 172 cm högt och passar en hollywoodgunga som mäter 210 × 120 × 170 cm. '
             'Mät gungan innan du beställer, så att överdraget passar.'),
            ('Skydd mot sol, vind och regn',
             'Överdraget skyddar gungan mot UV-strålning, vind, regn, fågelspillning och damm, så att den inte bleks och håller sig fin längre.'),
            ('Oxfordtyg med PU-beläggning',
             'Överdraget är gjort av slitstarkt oxfordtyg i 100 % polyester med PU-beläggning. '
             'Tyget är rivfast, vattentätt och smutsavvisande, och tätt sydda sömmar hindrar vatten och smuts från att tränga in.'),
            ('Dragkedja och snöre',
             'Med dragkedjan går överdraget snabbt att ta på och av, och ett snöre håller det på plats så att det inte blåser bort i vind.'),
            ('Lätt att rengöra',
             'Tyget är lätt att rengöra och sköta.'),
            ('Det här ingår',
             'I paketet ingår ett överdrag. Gungan ingår inte.'),
        ],
        egenskaper=[
            'Täcker en hel hollywoodgunga på 210 × 120 × 170 cm',
            'Skyddar mot UV-strålning, vind, regn och fågelspillning',
            'Oxfordtyg i 100 % polyester med PU-beläggning',
            'Rivfast, vattentätt och smutsavvisande',
            'Tätt sydda sömmar mot vatten och smuts',
            'Dragkedja som gör det lätt att ta på och av',
            'Snöre som håller överdraget på plats',
            'Lätt att rengöra',
        ],
        spec=[
            ('Mått', '220 × 125 × 172 cm (L × B × H)'),
            ('Passar gungor på', '210 × 120 × 170 cm (L × B × H)'),
            ('Färg', 'Svart'),
            ('Material', 'Oxfordtyg i 100 % polyester med PU-beläggning'),
            ('Fastsättning', 'Dragkedja och snöre'),
            ('Fraktvikt', '1,5 kg'),
            ('Paketmått', '33 × 27 × 7 cm'),
            ('Ingår', '1 överdrag'),
            ('Ingår inte', 'Gunga'),
        ],
        skotsel=('Torka av överdraget med en fuktig trasa och låt det torka helt innan du viker ihop det. '
                 'Förvara det torrt när du inte använder det.'),
        faq=[
            ('Vilken gunga passar överdraget till?', 'Överdraget passar en hollywoodgunga som mäter 210 × 120 × 170 cm. Själva överdraget mäter 220 × 125 × 172 cm.'),
            ('Hur mäter jag min gunga?', 'Mät gungans längd, bredd och höjd och jämför med 210 × 120 × 170 cm innan du beställer.'),
            ('Är överdraget vattentätt?', 'Ja, det är gjort av oxfordtyg med PU-beläggning och har tätt sydda sömmar som hindrar vatten och smuts från att tränga in.'),
            ('Hur sitter överdraget fast?', 'Med ett snöre. Dragkedjan gör att du lätt tar på och av det.'),
            ('Ingår gungan?', 'Nej, bara överdraget ingår.'),
            ('Vad skiljer det från ett överdrag till bara sitsen?', 'Det här täcker hela gungan och mäter 220 × 125 × 172 cm. Ett sitsöverdrag täcker bara sitsen.'),
        ],
        sakerhet=[],
        alt={
            '1': 'Svart skyddsöverdrag som täcker en hollywoodgunga, med framsidan uppvikt så att gungans konturer syns, mot vit bakgrund',
            '2': 'Det svarta överdraget över en hollywoodgunga på en terrass med blommor, ett vitt staket och ett hus i bakgrunden',
            '4': 'Det svarta överdraget med en öppnad flik på framsidan över en gunga på en uteplats med krukväxter och ett litet bord med en mugg',
            '5': 'Det svarta överdraget över en gunga på en trätrall med en hängande kruka med blommor',
            '10': 'Det svarta överdraget över en gunga framför ett grått hus med blommande buskar',
        },
        bort={'3': 'tysk text under fotot'},
        extra_bilder=[('10', 'b379ce_32381ff2ccca4a8881581ff452435a60~mv2.jpg')],
        undantag=[],
        foto_tal=[],
    )

    # ============ 719ed522: paviljongtak 3 × 3 m i kaffebrunt ============
    U['719ed522'] = dict(
        namn='Paviljongtak 3 × 3 m i kaffebrun Oxford 600D med två nivåer – utan stomme',
        slug='paviljongtak-3-x-3-m-oxford-600d-tva-nivaer-kaffebrun',
        sku='FP-paviljongtak-3-x-3-m-oxford-kaffe',
        kategori=KAT['719ed522'],
        seo_titel='Paviljongtak 3 × 3 m i Oxford 600D, kaffebrunt',
        seo_meta='Kaffebrunt paviljongtak i Oxford 600D med UPF 30+ till paviljonger på 3 × 3 m. Två nivåer, avrinningshål, kardborreband och hörnfickor. Stommen ingår inte.',
        ingress=('Ett kaffebrunt reservtak i Oxford 600D till paviljonger på 3 × 3 m, med två nivåer för god luftcirkulation. '
                 'Duken har UPF 30+ och fästs med kardborreband och hörnfickor. Det är bara taket som ingår, inte stommen.'),
        avsnitt=[
            ('Passar paviljonger på 3 × 3 m',
             'Taket passar bara paviljonger på 3 × 3 m, och duken mäter 300 × 300 cm. Mät paviljongens stomme innan du beställer, så att taket passar.'),
            ('Två nivåer för luftcirkulation',
             'Taket är byggt i två nivåer, vilket ger god luftcirkulation och stabilitet i vind. Det lilla övre taket är 88 × 88 cm.'),
            ('Oxford 600D med beläggning och UPF 30+',
             'Duken är av tjockt och robust Oxfordtyg 600D i 100 % polyester med beläggning. Den ger UPF 30+ skydd mot solen.'),
            ('Avrinningshål för regnvatten',
             'Taket har avrinningshål för regn, så att vattnet inte blir stående på duken.'),
            ('Kardborreband och hörnfickor',
             'Kardborreband och hörnfickor gör det enkelt att sätta upp taket och ta ned det igen. Två personer kan sätta upp det på cirka 5 minuter.'),
            ('Bara taket ingår',
             'Det är bara det övre taket som ingår, inte stommen. I paketet finns taket och en bruksanvisning.'),
        ],
        egenskaper=[
            'Passar paviljonger på 3 × 3 m',
            'Duk på 300 × 300 cm i två nivåer',
            'Oxfordtyg 600D i 100 % polyester med beläggning',
            'UPF 30+ skydd mot solen',
            'God luftcirkulation och stabilitet i vind',
            'Avrinningshål för regnvatten',
            'Kardborreband och hörnfickor',
            'Två personer sätter upp det på cirka 5 minuter',
            'Kaffebrunt, bara taket ingår',
        ],
        spec=[
            ('Mått', '300 × 300 cm (L × B)'),
            ('Lilla taket', '88 × 88 cm'),
            ('Snedställd kant', '174 cm'),
            ('Kanthöjd', '18 cm'),
            ('Passar', 'Paviljonger på 3 × 3 m'),
            ('Färg', 'Kaffebrun'),
            ('Material', '600D Oxfordtyg i 100 % polyester med beläggning'),
            ('Solskydd', 'UPF 30+'),
            ('Infästning', 'Kardborreband och hörnfickor'),
            ('Fraktvikt', '5,6 kg'),
            ('Paketmått', '44,5 × 35 × 12 cm'),
            ('Ingår', 'Takduk och bruksanvisning'),
            ('Ingår inte', 'Stomme'),
        ],
        skotsel=('Torka av duken med en fuktig trasa och låt den torka helt innan du viker ihop den. '
                 'Ta ned taket vid storm och förvara det torrt när du inte använder det.'),
        faq=[
            ('Vilka paviljonger passar taket?', 'Paviljonger på 3 × 3 m. Duken är 300 × 300 cm, så mät stommen före köpet.'),
            ('Ingår stommen?', 'Nej, bara taket och en bruksanvisning ingår.'),
            ('Hur sätts taket fast?', 'Med kardborreband och hörnfickor.'),
            ('Hur lång tid tar det att sätta upp taket?', 'Två personer kan sätta upp taket på cirka 5 minuter.'),
            ('Skyddar taket mot sol?', 'Ja, den belagda Oxforddukan har UPF 30+ skydd.'),
            ('Hur rinner regnvattnet av?', 'Taket har avrinningshål, så att vattnet inte blir stående.'),
            ('Vilken färg har taket?', 'Taket är kaffebrunt.'),
        ],
        sakerhet=[],
        alt={
            '1': 'Kaffebrunt paviljongtak med ett litet övre tak, sett snett ovanifrån mot vit bakgrund',
            '2': 'Det kaffebruna taket på en paviljong med svart metallstomme över en loungegrupp på en trätrall, med växter och ett hus bakom',
            '3': 'Måttbild: paviljongtakets mått är 3 m, det lilla övre taket 0,88 m, den snedställda kanten 1,74 m och kanthöjden 0,18 m',
            '4': 'Det kaffebruna taket på en paviljong över en soffa, två pallar och ett soffbord på en stenlagd terrass bredvid ett hus',
            '5': 'Det kaffebruna taket på en paviljong vid en pool med en loungegrupp och blommor i en stor kruka',
            '10': 'Det kaffebruna taket på en paviljong över ett matbord med stolar på en trätrall framför ett vitt hus',
        },
        bort={},
        extra_bilder=[('10', 'b379ce_44ad7232323c4170898cc32203c02a24~mv2.jpg')],
        undantag=[],
        foto_tal=[
            ('88', 'lilla takets mått, 0,88 m, läst på måttbilden'),
            ('0,88', 'lilla takets mått läst på måttbilden'),
            ('174', 'den snedställda kanten, 1,74 m, läst på måttbilden'),
            ('1,74', 'den snedställda kanten läst på måttbilden'),
            ('18', 'kanthöjden, 0,18 m, läst på måttbilden'),
            ('0,18', 'kanthöjden läst på måttbilden'),
        ],
    )
    return U
