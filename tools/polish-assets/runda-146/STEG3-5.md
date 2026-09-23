# Runda 146 — Steg 3–5: källäsning, prisgrind och bildgranskning

## Steg 3 — alla tio lästa (revision, variant, kategori, prisgrind)

| pid | wixProductId | revision | variant-SKU (rå) | pris |
|---|---|--:|---|--:|
| `be595bfd` | be595bfd-afc4-4929-bd9d-8ed575294271 | 2 | FP-gewachshaus-mit | 959 |
| `d99cc578` | d99cc578-edfc-41da-829b-db886df6e508 | 2 | FP-gewachshaus-ca-2-7-x-2-x | 1 649 |
| `5556a448` | 5556a448-00b5-4566-983b-4f41aed116d7 | 2 | FP-polytunnel-gewachshaus | 1 469 |
| `eadb1015` | eadb1015-5084-4a4d-a743-cc04780a29e3 | 1 | FP-wandmontiertes | 849 |
| `ed4fd2a9` | ed4fd2a9-bba9-469a-a116-7c5fff7c9b22 | 2 | FP-gewachshaus-tragbares | 959 |
| `2b5c2a89` | 2b5c2a89-bc91-4e05-aafa-eb558c5e7559 | 2 | FP-gewachshaus-mit-fernster | 1 339 |
| `94ee540a` | 94ee540a-843b-438b-b83d-9350345d999b | 1 | FP-gewachshaus-mit-regalen | 859 |
| `6e60b45a` | 6e60b45a-a303-47f3-ae1d-6e9c9ac5f394 | 1 | FP-fruhbeet-holz-und | 879 |
| `f837b05d` | f837b05d-99cc-4c72-9c0d-5b5bd63a0a9a | 1 | FP-foliengewachshaus | 859 |
| `b5ba12b8` | b5ba12b8-7b0f-416e-8077-15785ec32f85 | 1 | FP-gewachshaus-treibhaus | 6 029 |

Alla tio: `visible:false`, en variant, `variantVisible:true`. Prisgrinden gav
`stämmer:true` på samtliga (se STEG1-2.md för fullständig tabell med
`landedCostSek`/frakt). `b5ba12b8` visade `aosomSyncedQty: 27` — lagret är
tillbaka sedan runda 145.

## ☠️ Färgpåstående motsäger strukturerad data — bildbevisat

`6e60b45a`s brödtext säger **"grau gestrichenem Holz"** (grå-målat trä), men
den strukturerade `Technische Daten`-raden säger **"Farbe: Orange"**. Fem
bilder granskade (produktrender, livsstilsfoto mot tegelvägg, måttritning,
och två detaljfoton av gångjärn/list) — samtliga visar entydigt **orange**
lackerat trä, ingen grå nyans någonstans. Måttritningen bekräftar dessutom
att det är rätt bildserie (90×46×40 cm matchar `Gesamtmaße`). Facit är
alltså **orange**; brödtextens "grau" är leverantörens copy-paste-fel och
upprepas inte i den svenska texten.

## ☠️ Lieferumfang motsäger brödtexten — `b5ba12b8`

Brödtexten lovar uttryckligen: *"4 Pflöcke für eine feste Verankerung im
Boden sind im Lieferumfang enthalten"* (4 pluggar för markförankring ingår).
Den strukturerade `Lieferumfang`-listan säger bara **"1 x Gewächshaus, 1 x
Anleitung"** — noll pluggar. Samma familj av fel som runda 144:s
markpluggs-fynd (`Lieferumfang är kontraktet — två sidor lovade nycklar som
leveranslistan inte listar`). Den svenska texten nämner därför
markförankring som en REKOMMENDATION (i linje med källans egen
säkerhetsnotis om vindskyddad placering), men lovar INTE att pluggar följer
med.

## Steg 5 — sjutton källkontroller, tre särdrag värda att bära in i Steg 7

- **Fyra olika vindtal-format i samma batch — citeras var för sig.**
  `be595bfd`/`5556a448`/`2b5c2a89`/`94ee540a`/`f837b05d` ger bara en
  `Stufe`-siffra (4, 5, 3-4, ingen, 4) utan omräkningstal — citeras utan
  påhittat km/h-tal. `ed4fd2a9` ger `Stufe 4 (Windgeschwindigkeit unter 28
  km/h)` — citeras med talet. `eadb1015` ger **`Stufe 4 (17,5 mph)`** — enda
  produkten i batchen med mph i stället för km/h; skrivs som källan anger
  det (`17,5 mph`) utan att räkna om till km/h på egen hand. `b5ba12b8` ger
  **`12 m/s`** utan `Stufe`-beteckning alls — ett tekniskt mätvärde för
  premiumkonstruktionen, inte samma skala som de billigare produkternas
  marknadsföringsnivå. `d99cc578` ger ingen sifferbeteckning alls, bara
  "Gewölbtes Dach verteilt die Windkraft effektiv".
- **`ed4fd2a9` är sannolikt grönt FÄRGSYSKON till runda 145:s publicerade
  `601ae5f5`.** Samma bas-artikelnummer `[artikelnr]` (WT i runda 145, GN
  här), samma namn ("Gewächshaus, Tragbares Pflanzenhaus mit Stahlrahmen"),
  samma vikt (9,4 kg) och samma mått (180×180×200 cm). Mekanisk
  syskonregel från runda 61 ("artikelnumrets BAS är modellen, suffixet är
  färgen") gäller. Texten nämner den vita systervarianten; en korslänk
  läggs till på båda sidor efter publicering (samma regel som task #480).
- **Två konstruktioner som båda placeras "nära en vägg" är INTE samma
  produkt.** `eadb1015` är bokstavligen väggmonterat (`Wandmontage-Set`,
  ogräsduk, två dörrar, lutar mot väggen som en del av konstruktionen) —
  storlekssyskon till runda 145:s `2da078c9` (samma djup/höjd 80×157,
  kortare längd 200 mot 300 cm). `f837b05d` är ett fristående
  "Anlehngewächshaus" som bara REKOMMENDERAS stå nära en vägg för
  vindskydd, utan monteringssats eller ogräsduk. Texterna får inte
  sammanblanda dessa två — olika Lieferumfang, olika konstruktion.

Färgfältets "+X"-trunkering (samma mönster som runda 144/145) syns på tre
produkter: `be595bfd` (Weiß+Dunkelgrün → "Weiß"), `5556a448`
(Transparent+Silber → "Transparent"), `b5ba12b8` (Grau+Transparent →
"Grau"). Prosan använder den fylligare formen.

`2b5c2a89` bär två äkta skötselnotiser (inte superlativ) — ingen syraaktig
växtskyddsmedel mot PE-höljet, och förstärkning inför dåligt väder — dessa
tas med i "Användning och skötsel".

Ingen av de tio nämner glas eller härdat glas; ingen anger en snölastsiffra.
Steg 2:s regler håller oförändrat på alla tio.

## Steg 4 — 14 bilder granskade (5 av `6e60b45a` + position 3 på övriga nio)

Samma metod som tidigare rundor: kontroll mot leverantörslogotyp och mot
färg-/materialpåståenden som inte håller vid zoom.

**Ingen logotyp hittad på någon av de fjorton granskade bilderna** — en ren
svep, till skillnad från runda 145:s Outsunny-fynd.

Tre bekräftelser utöver färgfyndet ovan:

- **`b5ba12b8`s material bekräftat visuellt**: mörkgrå aluminiumram med
  transparenta polykarbonatskivor, konsekvent med "Aluminiumlegierung,
  Polycarbonat" — ingen glasyta synlig någonstans.
- **`ed4fd2a9`s gröna färg bekräftad**: grön PE-duk på stålram, matchar
  "Grün" bokstavligt.
- **`5556a448`s transparenta duk bekräftad**: genomskinlig folie med
  silverfärgad kantlist, matchar "Transparent+Silber".

Inget av de tio faller på bildgranskningen. Alla går vidare till Steg 7 med
ovanstående precisionspunkter som facit.
