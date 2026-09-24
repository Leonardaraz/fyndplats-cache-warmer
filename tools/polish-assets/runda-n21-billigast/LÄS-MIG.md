# Runda N21 — sex produkter, 1 349 kr

Sex Aosom-utkast polerade och publicerade, nästa steg uppåt från N20:s
1 229–1 339 kr-spann. Till skillnad från N20 delar alla sex EXAKT samma pris —
tillbaka till samma platå-mönster som N15–N19.

| id | produkt | SKU | pris |
|---|---|---|---:|
| 69458759 | Matbord i kautschukträ, 70 x 70 cm | FP-matbord-kautschuktra-70 | 1 349 kr |
| 67cc5f53 | Höjdjusterbar skrivbordsstol i konstläder, vit | FP-skrivbordsstol-vit | 1 349 kr |
| 4275e300 | Kontorsfåtölj i sammetslook med vibrationsmassage och USB, grön | FP-kontorsfatolj-sammet-gron | 1 349 kr |
| ffdb99fa | S-formad solsäng i konstrotting med dyna | FP-solsang-s-formad-rotting | 1 349 kr |
| 4bdb33d4 | Gödselspridare 75 L för gräsmatta och trädgård | FP-godselspridare-75l | 1 349 kr |
| a2f4a42b | Odlingslåda i metall, oval, 160 x 80 x 80 cm | FP-odlingslada-oval-160cm | 1 349 kr |

Alla sex: `needsAiPolish: false`, `draftStatus: "published"` — stämplat via
`/api/admin/mapping`, och varje stämpling verifierad två gånger: en gång genom
API-svarets `.ändrat`-fält (`needsAiPolish, draftStatus, variantSkus`), en
gång till genom en helt separat `las`-körning mot mappningsraden. Prisgrinden
(`1,20 × landedCostSek`, charm99) `stämmer: true` på alla sex, ingen slutsåld,
ingen låst. `aosomFreightShare` 0,301–0,411 — ingen över 0,5-tröskeln.

## Screeningen och den befintliga bakloggen fångade fyra uteslutningar

En fristående agent screenade nästa batch kandidater ovanför N20:s 1 339
kr-tak. Fyra föll bort innan något skrevs:

- **`429aa82d`** — redan flaggad i bakloggen (uppgift #201, olöst) som
  möjligt svart syskon till publicerade `1d020ddd`. Screeningsagenten hade
  ingen sikt in i den här sessionens ackumulerade uppgiftslista och märkte
  raden "ren"; korskollen mot bakloggen fångade den innan den kunde bli
  kandidat igen. Ingen ny åtgärd — uppgift #201 väntar fortfarande på
  Leonards beslut.
- **`2038f2aa`** — PawHut-tagg synlig plus möjligt färgsyskon till
  publicerade `b158b089` (uppgift #314, ny, väntar på Leonard).
- **`4664e423`** — PawHut-namnplåt på katt-löphjulet (uppgift #315, ny,
  väntar på Leonard).
- **`58ec496c`** — stor, centrerad Outsunny-logga på campingtältet, troligen
  obotlig genom polering (uppgift #316, ny, väntar på Leonard).

De sex som återstod screenades rena på dubblett, husmärke och mått, och blev
den här rundans batch.

## Två egna fel fångade och rättade före skrivning

- **`67cc5f53` (skrivbordsstol)**: ett tidigt utkast påstod "De fyra
  hjulen" om stolens hjulbas. Källan ger inget antal, och kontorsstolar av
  den här typen är typiskt 5-stjärniga underreden — påståendet var en egen
  fabrikation, inte något källan sa. `gate.py`:s ordtalsvarning flaggade
  "fyra" som ospelat tal, vilket ledde till en kontroll av påståendet i
  sak (inte bara stavningen). Skrivet om till att bara beskriva
  hjulens material utan att ange ett antal.
- **Alla sex**: FAQ-sektionerna skrevs först som
  `<p><span>Fråga?</span><br>Svar.</p>` (en `<p>` med `<br>` mellan fråga
  och svar). `gate.py` fällde på obalanserade `<br>`-taggar (3 öppna, 0
  stängda) på alla sex filer. Husets etablerade mönster (verifierat mot
  N20:s publicerade `00a83f2f.html`) är två SEPARATA `<p>`-taggar för fråga
  och svar. Alla arton fråga/svar-par (tre per produkt × sex produkter)
  skrevs om till det mönstret; `gate.py` gick sedan rent.

## Ett bildpositionsundantag: `a2f4a42b`

`bygg-media.py` sorterar alltid en bild märkt källposition "3" sist,
eftersom position 3 nästan alltid är måttritningen. På `a2f4a42b`
(odlingslådan) satt den RIKTIGA måttritningen på källposition 4, inte 3.
Positionsetiketterna i `bilder.tsv` för just den produkten är därför
medvetet omkastade (sann position 3 → etikett 4, sann position 4 → etikett
3) för att tvinga rätt bild sist utan att röra det delade generatorskriptet.
`gate-alt.py` kontrollerar inte etiketternas semantik, bara form och
dubblett, så omkastningen är riskfri. Verifierat i det skarpa mediasvaret:
ordningen blev `1 2 4 5 3`, med måttritningen sist.

## Källpåståenden rättade eller förtydligade mot fotot

- **`a2f4a42b` (odlingslåda)**: den tyska titeln kallar produkten
  "Pflanzkübel" (planteringskruka), men källans EGEN brödtext beskriver en
  ÖPPEN botten byggd för dränering — motsatsen till en sluten kruka. Skriven
  som en odlingslåda med öppen botten, i linje med vad beskrivningen
  faktiskt påstår, inte med den missvisande titeln.
- **`ffdb99fa` (solsäng)**: färgspecen i den strukturerade kolumnen gav bara
  ett enda ord, men den fullständiga tyska källtexten nämner tre färger
  (Cremeweiß/Natur/Schwarz). Skrivet som "Krämvit, natur och svart" i
  stället för att förenkla till en färg.
- **`4275e300` och `a2f4a42b`**: båda bar samma `[BRAND NAME]`-artefakt som
  N20 stötte på — en trasig "von" utan efterföljande ord. Skrivna om till
  hela, korrekta meningar utan någon "från"-referens.
- **Artikelnummer strukna, aldrig transkriberade**: inget av de sex
  källorna fick sitt Aosom-artikelnummer skrivet in i brödtext, SEO-fält
  eller alt-text.

## En ny mätning: `VARIANT_OPTION_CHOICE_NAMES` utelämnar `price` ur variantobjektet

Steg 4 (variant-SKU) försökte först rundtrippa variantobjektet från
`GET .../products/{id}?fields=VARIANT_OPTION_CHOICE_NAMES` — samma
fields-parameter husets egen dokumentation redan pekar ut som källan för
`options`/`linkedMedia`/`altText`-strukturen. Alla sex PATCH:ar föll på
`price must not be empty`.

Uppmätt genom att jämföra samma produkts variant mellan de två anropen:
`VARIANT_OPTION_CHOICE_NAMES` ger `variantKeys: [id, visible, sku, choices]`
— **utan** `price`, `media` eller `inventoryStatus`. Den FULLA, ofiltrerade
`GET /stores/v3/products/{id}` (ingen `fields`-parameter) ger
`[id, visible, sku, choices, price, media, inventoryStatus]`. Skrivningen
byggde alltså (utan att märka det) ett ofullständigt variantobjekt av
precis det skäl husets regel varnar för — bara med en smal projektion i
stället för en handbyggd struktur som orsak.

Lagat genom att rundtrippa från den FULLA, ofiltrerade GET:en i stället, och
kopiera hela variantobjektet (`Object.assign({}, v, {sku: nySku})`) innan
skrivning. Samtliga sex produkter har `optionsCount: 0` (en Aosom-rad är en
artikel med en variant), så `options` behövdes varken i kroppen eller
fältmasken den här gången.

## Gate-genomgång

| Gate | Resultat |
|---|---|
| `gate.py` (siffergrind mot `kallor.json`) | 0 fynd, 0 varningar (efter `<br>`-fix och hjulantal-fix) |
| `gate-axel.py` | 0 axelfel (fyra källkonflikter tyska/svenska spec-flikens bokstäver — TYSKAN GÄLLER, ärvt från importen) |
| `gate-alt.py` | 0 fynd, 27 alt-texter (5+5+3+4+5+5) |
| `gate-seo.py` | 0 fynd i 6 rader |
| `gate-lager.py` | 0 fynd, 6 saldon, lägsta 12 |
| `gate-sku.py` | 0 fynd i 6 rader (längsta 28 av 40 tecken) |
| `gate-superlativ.py` | 0 fynd, 0 kvitterade |
| Steg 1 (text/namn/slug/visible/SEO) transkriberingsspärr | 0 avvikelser, 6 av 6 skrivna |
| Steg 1 separat återläsning (`hasha.py`/`aterlas.js`) | 6 av 6 LIKA |
| Steg 2 (media) transkriberingsspärr | 0 avvikelser, 6 av 6 skrivna |
| Steg 3 (kategori) | 10/10 kopplingar bekräftade individuellt i bulk-svaret |
| Steg 4 (variant-SKU, round-trip från FULL GET, sist och ensam) | 6 av 6, `visible` oförändrat på produkt OCH variant |
| Mappningsstämpling + oberoende `las`-verifiering | 6 av 6, båda leden bevisade, prisgrind `stämmer: true` på alla |
| `hamta-live.sh` (ISR-medveten, varm träff + skarpt svep) | 6/6 HTTP 200, age 67 s vid det skarpa svepet |
| `livegrind.py` (orddiff, homoglyf, sid/alt/SEO-svep, flikar+kategori+köpbarhet+korslänk) | **0 avvikelser i den PUBLICERADE texten — 6/6 REN** |

## Kategorier

Tre produkter fick bara toppkategorin, av samma skäl som husets dokumenterade
undantag för sittmöbler ("trädet har ingen möbel-löv-kategori, och
toppkategorin räcker då") — här utvidgat till matbordet, som inte heller har
någon matchande löv:

| id | kategori(er) |
|---|---|
| 69458759 (matbord) | Hem & Inredning (ingen löv — samma undantag som sittmöbler) |
| 67cc5f53 (skrivbordsstol) | Hem & Inredning (ingen löv — sittmöbel) |
| 4275e300 (kontorsfåtölj) | Hem & Inredning (ingen löv — sittmöbel) |
| ffdb99fa (solsäng) | Trädgård & Utemöbler → Utemöbler |
| 4bdb33d4 (gödselspridare) | Trädgård & Utemöbler → Trädgårdsskötsel & Bevattning |
| a2f4a42b (odlingslåda) | Trädgård & Utemöbler → Växthus & Odling |

## Kort: medvetet uppskjutet, inte glömt

Samma kostnadsavvägning som N15–N20: ett kort kräver att bilder relä:as som
base64 genom modellens kontext. `bygg-medieskrivning.py` skrev bildlistan
exakt som `bygg-media.py` lämnade den, utan tredje post.

## Sammanfattning

Alla sex produkter är publicerade, stämplade och live-verifierade — noll
avvikelser i den skarpt hämtade, ISR-färska sidan för var och en. Rundan
räknas som klar utom faktakorten, som är en medveten uppskjutning av samma
skäl som N15–N20.
