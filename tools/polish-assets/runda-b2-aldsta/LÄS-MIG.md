# Runda B2 — åtta barnmöbler ur den äldsta änden

Andra rundan från den ÄLDSTA änden av poleringskön, parallellt med SEO 2
som tar de nyaste. Alla åtta är tyska feed-utkast importerade 2026-08-27,
och alla hör till Barnmöbler: fyra bokhyllor, två bord med stolar, ett
skrivbord och ett sminkbord.

| id | produkt | SKU | pris | saldo |
|---|---|---|---:|---:|
| 73409286 | Hörnhylla för barnrummet med nio fack och tre tyglådor – grå, 94 cm hög | FP-hornhylla-barnrum-tyglador | 959 kr | 51 |
| 91cd635b | Barnbokhylla med skåp i rosa och vitt – två hyllor, två dörrar, 100 cm hög | FP-barnbokhylla-rosa-skap | 969 kr | 91 |
| 1259355d | Barnbokhylla i husform med sju fack – vit, 80 cm bred, för 3–8 år | FP-barnbokhylla-husform-sju | 899 kr | 120 |
| 5c176543 | Barnbokhylla med stor låda – grå, tre bokfack och två öppna fack, 90 cm | FP-barnbokhylla-lada-gra | 1 199 kr | 166 |
| bdb8bbe2 | Barnbord och fyra stolar i trä – runt bord 60 cm, sitsar i pastellfärger, 3–8 år | FP-barnbord-fyra-stolar-runt | 1 459 kr | 146 |
| ed1094fc | Barnbord med två stolar i grått och vitt – furu, 56 × 52 cm, för 3–8 år | FP-barnbord-tva-stolar-gra | 919 kr | 133 |
| e9e896b4 | Skrivbord för skolbarn med hylla och två lådor – ljusgrönt och furu, 90 cm | FP-skrivbord-skolbarn-gron | 1 299 kr | 105 |
| 3df185a4 | Sminkbord för barn i rosa med pall – avtagbar spegel, blir skrivbord, 3–6 år | FP-sminkbord-barn-rosa-spegel | 869 kr | 197 |

**Inget pris är rört.**

## Bilder före text

Kontaktarken lästes före texten. Tre bilder ströks (`bilder-bort.tsv`), och
37 står kvar med måttbilden sist. Alla tre har tysk text inbränd: den rosa
bokhyllans rumsbild (*Klassenzimmer*, *Spielzimmer* …), skrivbordets
*MULTIFUNKTIONALE VERWENDUNG* och den grå bokhyllans femte bild, där
övningshäftena i facken har tyska titlar.

En förstoring avgjorde skrivbordets färg: ljust grönt, där källan bara
säger *Grün*, med ben i naturfärgad furu.

## Där källan behövde läsas med bilden

- Skrivbordets källa ger skivan som 90 × 37 cm, medan hela bordet är 52 cm
  djupt. Hyllan ovanpå är 13 cm djup, så 37 cm är ytan framför hyllan.
  Texten kallar den arbetsyta och säger inte att skivan är 37 cm djup.
- Det runda barnbordets källa listar fem färger. Bilderna visar en vit skiva
  och fyra sitsar i olika pastellfärger, och texten nämner inga
  sitsfärger.
- Sminkbordets källa säger ingenting om montering, och texten nämner den
  inte heller.
- Tal som räknades på bilderna och inte står som siffra i källan har en
  rad i `foto-tal.txt`: hörnhyllans nio fack och två baksidor, husbokhyllans
  fyra öppna hyllor, den grå bokhyllans tre bokfack (källan skriver
  *Dreistöckiges*) och skrivbordets två små fack.

## Grindar

Alla rena: `gate.py` (0 fynd, 0 varningar), `gate-alt.py` (37 alt-texter),
`gate-seo.py`, `gate-sku.py` (längsta SKU 29 av 40 tecken),
`gate-lager.py` (lägsta saldo 51), `gate-axel.py` (0 axelfel),
`gate-superlativ.py` och `gate-lankar.py`. Formsvepet för artikelnummer
gav 0 träffar i 14 filer, och hela `lib/polish` gick grönt (132 test,
läcktestet inräknat).

Tre av produkterna (de två borden och sminkbordet) har sina mått under
*Tischgröße* eller *Tischmaße*, som axelgrinden inte känner. Deras
måttangivelser är kontrollerade för hand mot källan.

## Wix, i den ordning det skrevs

Workflowen "Polering — skriv en runda till Wix" mot grenen, plan
`6b97b5c4…`:

| steg | utfall |
|---|---|
| torr (körning 36281362558) | text, media och SKU 8 av 8 lästa, kategorier 16 av 16 rader planerade |
| text, namn, slug, SEO och synlighet | 8 av 8 skrivna (körning 36281408541) |
| media | 8 av 8 skrivna, 37 bilder |
| kategorier | 16 av 16 rader kopplade |
| SKU, sist och ensam | 8 av 8 skrivna |
| separat återläsning efter 90 s | 8 av 8 helt verifierade |
| stämpel | 8 av 8 stämplade, 0 stämpelfel |

Pushen med planen rörde bara `tools/`, och Vercel hoppade över bygget i
båda projekten (`CANCELED`).

## Live

`hamta-live.sh 130`: alla 8 gav HTTP 200. Sju sidor hade `age` 140 s vid
den skarpa hämtningen och den rosa bokhyllan `91cd635b` 462 s, alltså en
rendering gjord omkring 00:09 UTC. Den sista skrivningen (SKU-steget)
gjordes 00:05:41, så alla åtta renderingar gjordes efter skrivningarna.

`livegrind.py`: orddiff 0 på alla 8. `livekoll.py`: 8 av 8 OK med
brödsmula i rundans kategori, och 37 av 37 alt-texter står på sidorna. En
separat kontroll av JSON-LD gav `InStock` och samma pris som i `ids.tsv`
på alla åtta.

## Två dubbletter till, ommappade enligt regeln

Skärmningen bildjämförde de par som delade måtttrippel med en publicerad
sida. Två var samma vara:

- **Gunghästen.** Feed-utkastet `063cbb9e` är samma häst som publicerade
  `16bdf5d8`: huvudbilden har samma pixlar (medelavvikelse 0,0 av 255),
  och båda anger 85 × 28 × 60 cm och 60 kg. `16bdf5d8` mappades om till
  Aosom (körning 36281510549, verifierad vid återläsning), och
  `063cbb9e` är pensionerad. Kundpriset rördes inte: 1 499 kr.
- **Rutschkanan.** Feed-utkastet `0f276512` är samma turkosgula kana som
  publicerade `7d914d36`: två bilder har samma pixlar (0,1 och 0,2), och
  båda anger 70 × 177 × 92 cm. `7d914d36` mappades om till Aosom (körning
  36281808191, verifierad vid återläsning), och `0f276512` är
  pensionerad. Kundpriset rördes inte: 1 579 kr.

Båda sidorna var AliExpress-rader, och artikelnumret lästes ur utkastets
mappning utan att stå i någon logg.

⚠️ Aosom-synken räknar om priset ur kostnaden var sjätte timme, så sidorna
följer husets prisregel från nästa synk. Feed-utkasten stod på 1 169 kr
(gunghästen) och 1 119 kr (rutschkanan) mot 1 499 kr och 1 579 kr i
butiken. Vill Leonard behålla dagens priser finns prislåset.

## Färgsyskon som väntar

Resten av paren är samma modell i en annan färg, bekräftat med ögat på
bilderna. De väntar till en senare runda, som B1:s barnfåtölj, och har
varsin rad i `FLAGGADE.md`:

- rutschkanan `9f605da4` i grått och vitt (syskon till `7d914d36`)
- bänkhyllan `acfcc8a3` i ekfärg (syskon till grå `d3b26d84`)
- förvaringstornet `c61fdbb4` i rosa (syskon till blå `0136e7d9`). Dess
  femte bild bär husmärket inbränt och ska strykas när den poleras.
- husbokhyllan `889ca93f` i grönt (syskon till rosa `76430e8e`)
- hörnhyllan `2fb66ffd` i vitt med färgade lådor (syskon till `73409286`
  ovan)
- bokhyllan med låda i mintgrönt `15db30cb`, rosa `8718ba8d` och vitt
  `a173de00` (syskon till `5c176543` ovan)
- klätterställningen `2780d68b` i trä (syskon till rosa `d48f0b07`, saldo 9)

Två utkast som delar mått, 60 × 60 × 44 cm, är INTE syskon:
`65d84215` är ett fyrkantigt bord med tavelskiva och björnstolar, och
`565d0075` ett runt vitt bord med förvaring och molnstolar. Båda står kvar
som kandidater. Klätterbågen `9b6aea55` och utkastet `069b34de`, som
skärmningen också parade ihop, har ingen gemensam bild (minsta avvikelse
28 av 255) och är olika produkter.

## Kategorier

Alla åtta under Barn & Familj och Barnmöbler, samma kategori som S11:s
barnbord, sminkbord och barnbokhyllor.

## Inga egna kort

Samma praxis som B1 och N40–N56.
