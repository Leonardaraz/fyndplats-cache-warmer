# Naturehike Opalus — en AliExpress-import polerad på Leonards begäran

Leonard importerade tältet 2026-09-28 och bad om en polering enligt runbooken.
Det är en AliExpress-import med engelsk källtext. Runbooken täcker annars bara
Aosom-utkast, men arbetsgången, grindarna och skrivworkflowen är desamma.

| id | produkt | SKU | huvudsökord | pris | saldo |
|---|---|---|---|---:|---:|
| `5cc6a174` | Naturehike Opalus tunneltält för 3 personer – förtält med två dörrar | `FP-tunneltalt-opalus-3-personer` | Naturehike Opalus, tunneltält 3 personer (inget mätvärde, Semrush-enheterna slut) | 3 199 kr | 16 |

Kategorier: Sport & Fritid och Friluftsliv & Resa (trädet har inget tältlöv), som
de andra Naturehike-tälten. Inget produktsäkerhetsavsnitt, eftersom produkten kommer från AliExpress
(Leonard 2026-09-27).

## Det som överraskade

- **Varianten var dold.** Produkten skapades 02:37 UTC och ändrades 02:49 (revision 4).
  Efter det bar den enda varianten `visible: false`, medan alla andra utkast bär
  `true`. Skrivworkflowen återställer inte flaggan: SKU-steget tar varianten som den
  står, och återläsningen hade fällt på `variantSynlig` först när sidan redan låg ute.
  Då hade sidan varit publicerad men oköpbar. Före skrivningen lagades flaggan med
  samma rundtur som CLAUDE.md beskriver för de 31 sidorna: en färsk GET, bara
  `visible` ändrad på varianten, och produktens `visible: false` medskickad. Revision
  4 → 5, och pris, SKU, lager och variant-id var oförändrade.
- **Priset skiljer mellan Wix och mappningen.** Wix säger 3 199 kr och mappningsraden
  `grossSek` 3 399 kr. Sökindexet visade 3 399 en stund efter importen, så priset har
  troligen ändrats i Wix efteråt utan att mappningen följde med. Priset rördes inte.
- **Huvudbilden är bearbetad (Leonards val 2026-09-28).** Alla bilder som visar hela
  tältet bar något som runbooken stryker: loggan i hörnet och en tidning med läsbart
  namn under packpåsen på studiofotot, och engelsk text på de andra. Snöfotot hade
  blivit huvudbild, och i kvadratbeskärningen syns mest granar. Leonard valde en
  rensad studiobild. Tältet togs ut som en egen komponent på ren vit botten, och
  loggan och packpåsen, som ligger fristående, föll bort. Tältets pixlar är
  kontrollerat oförändrade. Därefter kördes `hero_white` (1600 × 1600). Filen ligger i
  rundan som `huvudbild-5cc6a174.jpg`, och uppladdningen är md5-kontrollerad mot den.
- **Listningen blandar tre storlekar.** Bilderna har måttritningar för två, tre och
  fyra personer, och ett spec-kort gäller modellen för fyra (40D, 3,8 kg). Siffrorna
  på sidan är tremanstältets: ritningen *Triple* (420 × 210 cm, höjd 120 cm,
  innertält 165–190 cm brett och 110 cm högt) och bild 7 (2,7 kg utan tillbehör,
  55 × 17,5 × 17,5 cm packat). Packlistan visar markskyddet *Mat For Opalus 3*.
- **Två källor om vattenpelaren.** Texten säger >3000 mm för både duk och golv, bild 7
  säger 4000 mm. Sidan säger *minst 3 000 mm*, vilket stämmer med båda.
- **3,1 kg och 52 × 18 × 18 cm används inte.** De står bara i AliExpress AI-sammanfattning
  och ser ut som paketets vikt och mått. Tillverkarens egen bild säger 2,7 kg utan
  tillbehör och 55 × 17,5 × 17,5 cm packat.
- **"Fyrsäsongstält" står inte på sidan.** Listningen påstår det, men tillverkarens
  egen bild med råd (bild 16) säger att storm, skyfall och snöstorm kan skada tältet.
  Råden på den bilden står i skötseltexten: plan plats i lä, bort från eld, vädra mot
  kondens och torka före förvaring.

## Bilderna

Fem av sexton: den rensade studiobilden, snöfotot och tre bilder med detaljer.
Elva strukna (se `bilder-bort.tsv`): engelsk text (nio), ritningar för tältets
andra storlekar och modellen för fyra personer, samt ett cykelmärke som går att läsa
på rekvisitan (bild 12). Naturehike-loggan som är tryckt på själva duken står kvar.

## Grindar och läsning

Alla grindar rena. `bygg-axelfacit.py` är kvitterad i `grind-undantag.txt`,
eftersom den engelska källan saknar tysk måttrad. Talen som bara står i bilderna
är kvitterade i `foto-tal.txt`. Sidan lästes som kund, och en upprepning om att
tältet måste spännas ut ströks ur skötseltexten.

## Skrivningen och livekontrollen

Workflowen kördes tre gånger mot grenen: en torrkörning och två skarpa körningar.
Efter den första skarpa körningen hittades en mening som sa mer än källan. Den
påstod att allt packas i påsen på 55 × 17,5 × 17,5 cm, men måttet gäller det packade
tältet och markskyddet har en egen påse. Meningen rättades, och texten skrevs om i en
andra körning. Båda körningarna gav 1 av 1 helt verifierad och 1 stämplad, utan
stämpelfel.

Sidan hämtades efter butikens cachefönster med HTTP 200 och `age: 130`. Orddiffen
mot källfilen gav 0, livegrinden gav inga avvikelser, och livekollen gav OK: köpbar,
3 199 kr, brödsmula genom Sport & Fritid och 5 av 5 alt-texter på sidan. Sidan lästes
som kund i Chromium. Avsnitten ligger före flikarna, och ingen
produktsäkerhetsflik visas, vilket stämmer för en AliExpress-vara.

## Nästa session bör veta

- Skrivworkflowen återställer inte en dold variant, och torrkörningen säger `ok` ändå
  (`variantSynligFore` syns bara i svaret). Kontrollera `variantsInfo.variants[].visible`
  före `skriv` på en importerad produkt som ändrats efter importen.
- Mappningsradens `grossSek` (3 399) följer inte Wix (3 199). Priset rördes inte.
