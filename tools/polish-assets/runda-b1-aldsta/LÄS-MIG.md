# Runda B1 — de åtta äldsta utkasten

Första rundan från den ÄLDSTA änden av poleringskön, parallellt med SEO 2
som tar de nyaste. Av de 18 äldsta opolerade utkasten publicerades åtta och
tio hölls, alla med en rad i `FLAGGADE.md`. Tre av källorna är engelska
(AliExpress-importer från Aosoms spanska butik) och fem tyska.

| id | produkt | SKU | pris | saldo |
|---|---|---|---:|---:|
| 91d7dfd9 | Barnskrivbord med hylla och låda – vit och trädekor, 80 cm, för 3–8 år | FP-barnskrivbord-hylla-lada | 1 499 kr | 100 |
| 9ec91f90 | Barnbokhylla med tre tygfack och två förvaringslådor – vit, lejonmotiv, 76 cm | FP-barnbokhylla-tygfack-lador | 979 kr | 100 |
| c68c2ca0 | Sminkbord för barn med tredelad spegel och pall – vit, 85 cm, för 3–6 år | FP-sminkbord-barn-tredelad | 899 kr | 100 |
| f1f2504c | Piklerset i trä med klättertriangel, båge och vändbar ramp – för 18–48 månader | FP-piklerset-tra-bage-ramp | 1 579 kr | 148 |
| f85512b3 | Odlingslåda med spaljé och tak i brun gran – 183 cm hög, för trädgården | FP-odlingslada-spalje-tak | 1 219 kr | 24 |
| cf638cc0 | Motorcykelgarage i svart Oxfordtyg – 345 × 135 × 191 cm, infällbar front | FP-motorcykelgarage-345 | 2 199 kr | 197 |
| 75768a6c | Entrétak i glas 200 × 90 cm – 12 mm härdat säkerhetsglas, rostfria dragstag | FP-entretak-glas-200-90 | 5 499 kr | 163 |
| 788a6e39 | Barnfåtölj med fotstöd i ljusblå linnelook – ställbart ryggstöd, för 3–5 år | FP-barnfatolj-fotstod-ljusbla | 1 299 kr | 69 |

**Inget pris är rört.**

## Bilder före text

Kontaktarken lästes före texten. 14 bilder ströks (`bilder-bort.tsv`), och
35 står kvar med måttbilden sist:

- elva med spansk text inbränd: fyra på skrivbordet, fyra på bokhyllan
  (en av dem visar dessutom hyllan med rosa tyg, alltså en annan
  färgvariant) och tre på sminkbordet
- en med tysk text på motorcykelgaraget (*VIELSEITIGE LAGERUNG*)
- två dubbletter av bild 1: skrivbordets bild 9 har samma pixlar, och
  entrétakets bild 4 är samma fil byte för byte

Tre förstoringar avgjorde det kontaktarket inte kunde: odlingslådans färg,
barnfåtöljens tyg och motorcykelgaragets front.

## Där källan och bilden inte sa samma sak

- Odlingslådans källa säger *Farbe: Orange*. Förstoringen visar brunbetsad
  gran, obehandlad på insidan, så texten och specen säger brun.
- Entrétakets källa ger två vikter, 66 kg i texten och 57,5 kg i specen.
  Ingen av dem står på sidan.
- Motorcykelgaragets källa säger att det rymmer två motorcyklar. Bilderna
  visar en, och texten säger en motorcykel, cyklar eller trädgårdsredskap.
- Pikler-setets måttlista har en *Sandsack*, men leveransinnehållet nämner
  den inte och ingen bild visar den. Den nämns inte.
- Skrivbordets källa anger testnormen med gemener (*en71-1-2-3*), så
  normgrinden hade fällt ett versalt *EN 71*. Normen nämns inte.
- Tal som räknades på bilderna och inte står som siffra i källan har en
  rad i `foto-tal.txt`: skrivbordets tre fack, bokhyllans tre tygfack och
  två lådor (källan skriver dem med bokstäver på engelska), setets tre
  delar, odlingslådans fyra rutpaneler och entrétakets tre dragstag.

## Två grindar som inte såg engelska källor

- `bygg-axelfacit.py` avbröt på alla tre engelska källor, eftersom den
  bara kände tyska etiketter. Den läser nu `total measurements: 80x50x100
  cm (lxwxh)` och, när totalraden saknas, första raden med ett
  bestämningsord (sminkbordet före pallen). Engelskans *w* är djupet, så
  bokstäverna läggs positionellt. Alla 72 rundor med `kallor.json`
  regenererar byte-identiskt.
- `gate-axel.py` letade efter *cm bred*, och neutrum *brett* innehåller
  inte *bred*. Ett "50 cm brett" om det 50 cm djupa skrivbordet hade gått
  igenom. Breddat till *bred/brett*; 65 texter i tidigare rundor säger
  *cm brett*, och ingen av dem gav ett nytt fynd.

Åtta nya test i `lib/polish/axelfacit.test.ts`, verifierade genom att
återinföra buggarna en i taget.

## Grindar

Alla rena: `gate.py` (0 fynd, 0 varningar), `gate-alt.py` (35 alt-texter),
`gate-seo.py`, `gate-sku.py` (längsta SKU 29 av 40 tecken),
`gate-lager.py` (lägsta saldo 24), `gate-axel.py` (0 axelfel),
`gate-superlativ.py` och `gate-lankar.py`. Formsvepet för artikelnummer
gav 0 träffar i 14 filer, och hela `lib/polish` gick grönt (132 test,
läcktestet inräknat).

## Wix, i den ordning det skrevs

Workflowen "Polering — skriv en runda till Wix" mot grenen, plan
`b330063b…`:

| steg | utfall |
|---|---|
| torr (körning 36279777682) | text, media och SKU 8 av 8 lästa, kategorier 17 av 17 rader planerade |
| text, namn, slug, SEO och synlighet | 8 av 8 skrivna (körning 36279823086) |
| media | 8 av 8 skrivna, 35 bilder |
| kategorier | 17 av 17 rader kopplade |
| SKU, sist och ensam | 8 av 8 skrivna |
| separat återläsning efter 90 s | 8 av 8 helt verifierade |
| stämpel | 8 av 8 stämplade, 0 stämpelfel |

Pushen med planen byggde en förhandsversion i Vercel
(`dpl_CNYFhAAd6vWhjhCKNiV6cy5TAJ8C`, READY på 67 s), eftersom de nya
testen ligger i `lib/`. Butiksprojektet avbröt som vanligt.

## Live

`hamta-live.sh 130`: alla 8 gav HTTP 200. Sju sidor hade `age` 139–169 s
vid den skarpa hämtningen, och odlingslådan `f85512b3` 488 s, alltså
renderingen från den första träffen 23:36:55 UTC. Den sista skrivningen
(SKU-steget) gjordes 23:34:21, så alla åtta renderingar gjordes efter
skrivningarna.

`livegrind.py`: orddiff 0 på alla 8. `livekoll.py`: 8 av 8 OK med
brödsmula i rundans kategori, och 35 av 35 alt-texter står på sidorna. En
separat kontroll av JSON-LD gav `InStock` och samma pris som i `ids.tsv`
på alla åtta.

## Skrivbordet fanns två gånger

Skärmningen inför nästa runda hittade utkastet `ec93f9f2`, ett tyskt
feed-utkast med exakt skrivbordets mått: 80 × 50 × 100 cm, lådan
72 × 33,8 × 6,2 cm invändigt och belastningen 50/30/10 kg. Tre av dess fem
bilder har samma pixlar som skrivbordets bild 2, 3 och 8 (medelavvikelse
0,2 av 255). Det är alltså samma vara två gånger: en gång som
AliExpress-listning från Aosoms spanska butik, en gång ur Aosoms feed.

Enligt Leonards regel från 2026-09-03 behölls den polerade sidan
`91d7dfd9`, som mappades om till Aosom med workflowen "Dubbletter — mappa
om en produkt till Aosom", och utkastet `ec93f9f2` pensionerades
(`rejected`). Artikelnumret lästes ur utkastets mappning och står inte i
någon logg. Planen (körning 36280155567) passerade alla hinder, bytet (körning
36280185370) läste tillbaka raden och svarade `ommappad till Aosom`, och
kundpriset rördes inte: 1 499 kr.

⚠️ Aosom-synken räknar om priset ur kostnaden var sjätte timme, så sidan
följer husets prisregel från nästa synk. Feed-utkastet stod på 1 399 kr.
Vill Leonard behålla 1 499 kr finns prislåset.

## Kategorier

De fyra barnmöblerna står under Barn & Familj och Barnmöbler, pikler-setet
under Barn & Familj, Leksaker & Spel och Baby & Småbarn, och de tre
utomhusvarorna under Trädgård & Utemöbler med Odlingslådor, Garagetält
respektive Skärmtak & entrétak.

## Inga egna kort

Leonards regel från 2026-08-26 säger ett eget kort per produkt, men
rundorna N40–N56 har inga, och den här rundan följer samma praxis.
