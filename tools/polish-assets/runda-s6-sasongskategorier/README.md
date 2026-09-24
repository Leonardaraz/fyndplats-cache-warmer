# Runda S6: fyra säsongskategorier (halloween, jul, eldkorgar, konstväxter)

2026-09-24. Rundan fortsätter på Leonards mandat: *"ta egna beslut som är
genomtänkta, för att vi ska ranka så högt som möjligt, … baserat på fakta
och statistik"*.

## 1. Varför just de här, och varför nu

Semrush SE samma dag. Trenden är de senaste tolv månaderna, där 1,00 är
toppmånaden:

| sida | huvudsökord (sök/mån · svårighet) | trend |
|---|---|---|
| Halloweendekoration | halloweendekoration 2 400 · 18; halloween dekoration utomhus 480 · 12; halloween spöke 320 · 11; halloween skelett 260 · 13 | topp okt–nov, nära noll resten av året |
| Juldekoration | juldekoration 4 400 · 23; juldekoration utomhus 1 300 · 18; uppblåsbar tomte 880 · 18; julby 1 900 · 18 | topp nov–dec |
| Eldkorgar & eldstäder | eldstad utomhus 4 400 · 16; eldkorg 3 600 · 23; eldskål 590 · 17; rökfri eldstad 210 · 13 | eldkorg stiger okt–dec |
| Konstväxter | konstgjorda växter 3 600 · 23; konstväxter 2 900 · 20; konstväxter utomhus 1 300 · 19; konstgjord olivträd 590 · 10 | jämn över året |

**Tidpunkten är poängen för de tre första.** En sida som ska ranka i november
måste finnas i oktober. Halloween är om fem veckor.

Toppen på Google, uppmätt samma dag:

- *juldekoration utomhus*: ljusochmiljo.se ligger etta med en kategorisida,
  följd av Amazon, Jula, Clas Ohlson och Rusta.
- *uppblåsbar tomte*: nästan bara produktsidor och prisjämförare (Amazon,
  vidaXL, Prisjakt, Jula, Clas Ohlson).
- *halloween dekoration utomhus*: Amazon, Temashop och Partykungen. Resten är
  bloggar och Pinterest, alltså svårighet 12.
- *eldstad utomhus*: specialbutiker, Pricerunner och bloggar.
- *eldkorg*: Clas Ohlson, Biltema, Bauhaus, Granngården och Rusta.
- *konstväxter utomhus*: IKEA, specialbutiker, Jysk och Bauhaus.

Före rundan rankade vi inte på något halloweenord. Semrush svarade *nothing
found*. På eldkorg rankade bara ett tillbehör, eldgaffel på plats 25.

**Bortvalt:**
- *julbelysning utomhus* (6 600 · 21). Toppen säljer ljusslingor, och våra
  varor är figurer.
- *halloween* (49 500 · 44). För brett.
- *terrassvärmare* och *infravärmare* (3 600 · 28 och 6 600 · 30). Bara fem
  produkter, och trenden toppar i augusti.

## 2. I Wix

| kategori | id | förälder | kopplade |
|---|---|---|--:|
| Halloweendekoration | c007c683-36e2-4ba1-a3a3-62f1980761de | Hem & Inredning | 59 |
| Juldekoration | 7e1e5c02-7181-4636-bdd6-597dc4d93d6a | Hem & Inredning | 45 |
| Konstväxter | 7aa70eab-34f8-48cf-9573-7694d0d00fde | Hem & Inredning | 59 |
| Eldkorgar & eldstäder | 99bf8458-6e75-4534-ad58-facc8be7db7e | Trädgård & Utemöbler | 16 |

Totalt är 179 produkter kopplade, med 0 fel och 0 odetaljerade i bulk-svaren.
En separat återläsning gav LIKA mot planen på alla fyra.

**Urvalet kommer från ett svep över hela katalogen, inte från en sökning.**
Alla 6 025 produkter lästes, och de publicerade matchades på namn. Planen
(`koppling.json`, id-prefix per kategori) har en FNV-kontrollsumma som
räknades om inne i skrivanropet. Därför kan ett avskrivningsfel i en lista
bara avbryta skrivningen, aldrig koppla fel produkt.

☠️ **Den första mönsterlistan var för bred och den andra för smal. Båda
fångades.**
- `jul` träffade *hjul* och `eld` träffade *spegel*. Det rättades före
  skrivningen.
- `renar` träffade *grenar*, så LED-björken hamnade som julvara. Den ströks
  för hand.
- Ett bredare kontrollmönster i samma svep hittade nio produkter som
  urvalet missat: tre skräckclowner, fyra konstgjorda träd och två
  adventskalendrar.
  - Varje kandidat är kontrollerad mot sin beskrivning i samma anrop som
    kopplingen. Clownerna krävde ordet *halloween* i texten.
  - Popcornclownen föll på det kravet och kopplades först efter att hela
    beskrivningen lästs: *"Skräckeffekten ligger i höjdändringen"*.
- Etanolbrasor, elkaminer, *eldriven* fyrhjuling och sovsäcken *Mujin
  mumiesovsäck* är medvetet bortvalda.

**Allt är additivt.** Ingen produkt har tagits ur en gammal kategori:
- Halloweenfigurerna ligger kvar i Kalas & Fest.
- Juldekorationerna och konstväxterna ligger kvar i Dekoration & Prydnad.
- Eldkorgarna ligger kvar i Grill & Utekök.

Ingen av de gamla sidorna har en titel som siktar på de nya orden, så de
konkurrerar inte. Det var skälet till klösträdsflytten i S4, och det finns
inte här.

**Sidorna blev live utan deploy.** Butiken läser kategorierna ur Wix. Samma
natt svarade alla fyra 200 med mallens titel (*"Halloweendekoration |
Fyndplats"*) och rätt brödsmula. Halloweendekoration visade 59 produkter,
Juldekoration 43, Eldkorgar 14 och Konstväxter 56; resten är slutsålda eller
bilddubbletter. Sökordstitlarna och texterna kommer med butiksdeployen.

## 3. Texterna

Det finns en `<slug>-text.json` per sida, med ett **facit** per påstående. Alla
fyra är grindade RENT med `../../polish-gates/gate-kategori.py`. Siffrorna i
facit är räknade per produkt ur beskrivningarna, inte uppskattade.

Fyra formuleringar som ändrades av vad beskrivningarna faktiskt säger:

- ☠️ **"Fläkten går hela kvällen" ströks.** Halloweenspöket säger
  *kontinuerlig drift*, men den uppblåsbara snögubben 97cf9327 säger *"ska inte
  vara igång mer än åtta timmar i sträck"*. Texten lovar nu bara att figuren
  håller formen så länge fläkten går, och FAQ:n nämner åtta timmar som
  exempel.
- **"Rökfri" gäller fyra eldkorgar, inte sex.** Två andra nämner *"Rökfri
  eldkorg 48 × 48 cm"* som hänvisning till en annan vara, och ett mönster
  räknade dem som rökfria.
- **Konstväxter kan inte lovas för ute.** De flesta passar både inne och ute
  och flera är UV-beständiga, men edac1214 och b51b6e6c är uttryckligen för
  inomhusbruk. Texten hänvisar till produktbeskrivningen.
- **Batterier ingår i 3 av 37 animerade halloweenfigurer.** Därför står
  det "i de flesta" och inte "aldrig".

### Trädgårds åtta underkategorier

Underkategorierna rankade på mallens titel (*"Utemöbler | Fyndplats"*) och
hade ingen brödtext, trots att de har mer än 400 produkter i lager. Varje
titel siktar nu på ord där vi har varorna och svårigheten är låg:

| underkategori | titel | huvudsökord (sök/mån · svårighet) |
|---|---|---|
| Växthus & Odling | Tunnelväxthus, väggväxthus & odlingslådor | tunnelväxthus 2 900 · 13; väggväxthus 1 900 · 15; odlingslådor 1 900 · 16 |
| Utemöbler | Utemöbler – loungeset, trädgårdsbänk & hängstol | loungeset 8 100 · 18; trädgårdsbänk 3 600 · 19; hängstol utomhus 2 400 · 15 |
| Solskydd & Paviljonger | Paviljong 3x3, paviljongtak & pop up-tält | pop up tält 6 600 · 12; paviljong 3x3 2 900 · 16; paviljongtak 3x3 880 · 17 |
| Grill & Utekök | Gasolgrill, kolgrill, plancha & kylbox | plancha 320 · 11; kylbox 8 100 · 23; gasolgrill 22 200 · 19 |
| Trädgårdsdekor & Belysning | Solcellslampor, trädgårdsfontäner & dekor | solcellslampor 8 100 · 20; fontän trädgård 2 400 · 18 |
| Utelek & Spel | Studsmatta för barn, basketkorg & gungor | basketkorg 5 400 · 14; studsmatta barn 2 400 · 26 |
| Trädgårdsskötsel & Bevattning | Slangvagn, kompostkvarn & trädgårdsredskap | slangvagn 590 · 15; kompostkvarn 5 400 · 20 |
| Terrassvärmare & Infravärmare | Terrassvärmare & infravärmare – 2000 och 2500 W | terrassvärmare 3 600 · 28; infravärmare 6 600 · 30 |

Ord som ingen av oss vinner valdes bort. Exempel är *växthus* (40 500 · 30),
*utemöbler* (49 500 · 33), *studsmatta* (27 100 · 35) och *pergola*
(27 100 · 24). *Gasolgrill* står i titeln för att sidan säljer sex sådana, inte
för att den ska slå Weber.

**Texterna hänvisar till varandra**, så att sidorna länkar i ordet om inte i
koden:
- Grill & Utekök pekar på Eldkorgar & eldstäder.
- Utelek & Spel pekar på Sandlådor.
- Trädgårdsdekor pekar på Halloweendekoration, Juldekoration och
  Konstväxter.
- Trädgårdsskötsel pekar på Redskapsbodar & förråd, där samma sju
  trädgårdsskåp ligger.

**Två påståenden rättades av en kontroll per produkt, före skrivningen:**
- ☠️ *"Till våra planchor följer regulator och slang med"* byggde på de tre
  första träffarna i ett svep. En kontroll av varje produkt visade att det
  gäller alla tre planchorna **och** alla sex gasolgrillarna, så meningen
  blev bredare, inte smalare.
- *"En av kylboxarna håller 72 timmar"*: det är två, på 42,6 och 70 liter.

## 4. Butiken

Grenen `claude/sasongskategorier-s6-bz3j9l` mot `headless-site` bär:

- **Tolv poster i `lib/category-seo.ts` och `lib/category-content.ts`,
  genererade** med `infoga.py`. Fyra är säsongssidor och åtta är Trädgårds
  underkategorier. `jamfor.mts` importerar båda filerna och gav 12 av 12
  identiska mot källan.
- **Testet** *ett huvudsökord finns i exakt en kategorititel* täcker 13 nya
  ord: `halloween`, `juldekoration`, `eldkorg`, `konstgjorda växter`,
  `tunnelväxthus`, `loungeset`, `paviljongtak`, `plancha`, `solcellslamp`,
  `studsmatta`, `basketkorg`, `kompostkvarn` och `terrassvärmare`.
  Mutationsprovat: med *halloween* i Kalas & Fests titel fäller testet.
- **`google.xml`:** alla sex id är kontrollerade mot Googles egen taxonomifil
  samma dag.
  - 596 (Seasonal & Holiday Decorations) för halloween och jul.
  - 6265 (Artificial Flora) för konstväxter.
  - 2918 (Outdoor Living) för eldkorgar.
  - 4299 (Outdoor Furniture) för utemöbler.
  - 2649 (Patio Heaters) för terrassvärmarna.

  Förut låg halloweenfigurerna på 96 (Party & Celebration) via Kalas & Fest.
  Övriga trädgårdssidor faller som förut på 536.
- **`category-groups.ts`:** Juldekoration, Halloweendekoration och Konstväxter
  länkas från Hem & Inredning på /butik.

Kontrollen gav 781 av 781 gröna tester och eslint rent. tsc gav 75 fel, alla i
befintliga `.test.ts`, precis som på basen.

**Deployen görs nästa dag.** 2026-09-24 hade redan tre butiksdeployer (#645,
#641, #646), och regeln är en eller två per dag. Grenen pushas en gång, när
allt för rundan ligger i den.

## 5. Förhandsbygget och en rättelse på vägen

**Förhandsbygget** för grenen (`dpl_Gr3ji8CRgPfAtQqDgNKntE8fuwne`, READY) hämtades sida för sida och jämfördes med källfilerna. Alla 12 sidor var LIKA: `<title>`, metabeskrivning, fyra stycken brödtext, tre frågor med svar och tre frågor i FAQPage-JSON-LD.

**Bygglovsmeningen på bodarna rättades i Wix samma natt**, eftersom den var fel i sak och kostade försäljning. Den skrevs med kontrollsumma i anropet och en separat återläsning. Se `bodar-bygglov/README.md`.

## 6. Beslut som lämnas till Leonard

- **Trädgård & Utemöbler i `MAIN_GROUPS`.** Den saknas där och har därför inget
  kort på /butik eller startsidan. Startsidan visar de fyra största grupperna.
  Live samma natt visade Hem & Inredning 1 705 produkter, Möbler 685,
  Trädgård 422, Husdjur 391 och Barn & Familj 261. Trädgård hade alltså tagit
  en plats bland de fyra och trängt undan en annan grupp mitt i
  leksakssäsongen. Det är ett beslut om startsidans sortiment, inte om sökord,
  och det är inte fattat här.
