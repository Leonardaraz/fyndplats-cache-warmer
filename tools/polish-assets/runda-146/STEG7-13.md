# Runda 146 — Steg 7–13: text, SKU, kategori, publicering

## ☠️ Landminan reconfirmerad en TREDJE gång — hanterad rätt igen

Samma mekanism som runda 144 och 145 dokumenterar: en RÅ `variantsInfo`-PATCH
(Steg 8:s SKU-byte) publicerar produkten, trots att `visible` aldrig fanns med
i anropet. Verifierat oberoende (ny `GET`, inte PATCH-svarets eko) på alla tio
denna runda: samtliga gick till `visible:true` på produktnivå omedelbart efter
SKU-skrivningen.

Regeln följdes igen: Steg 10 (kategori) kördes OMEDELBART efter Steg 8, med
noll medveten fördröjning. Skadan blev återigen bara ORDNINGEN — ett kort
fönster med rätt text men fel/ingen kategori, aldrig felaktig eller ofärdig
text till kund. Tredje raka rundan där regeln håller.

## Steg 7 — text, slug, seoData (alla tio)

Skrivet via `plainDescription` (samma skrivbara HTML-fält som runda 144/145).
Texterna skrevs till `texter-utkast.md` och grep-verifierades mot kända
felmönster (leverantörsnamn, Aosom-artikelnummer, glas, tidigare stavfel,
tyska kvarlevor, "leverantören anger", SKU-kollisioner) INNAN någon skrivning
— alla kontroller gav noll träffar.

| pid | ny slug | ny SKU | pris |
|---|---|---|--:|
| be595bfd | foliehus-natfonster-rullbar-dorr-200x75x188-cm | FP-foliehus-natfonster | 959 |
| d99cc578 | foliehus-hyllor-gront-198x275x191-cm | FP-foliehus-hyllor-gron | 1 649 |
| 5556a448 | polytunnelvaxthus-forzinkat-stal-195x295x195-cm | FP-polytunnel-forzinkad | 1 469 |
| eadb1015 | vaggvaxthus-ograsduk-200x80x157-cm | FP-vaggvaxthus-200cm | 849 |
| ed4fd2a9 | portabelt-vaxthus-gront-180x180x200-cm | FP-portabelt-vaxthus-gron | 959 |
| 2b5c2a89 | foliehus-fonster-dorr-stal-300x100x200-cm | FP-foliehus-fonster-dorr | 1 339 |
| 94ee540a | minivaxthus-hyllor-uv-bestandigt-143x74x190-cm | FP-minivaxthus-hyllor | 859 |
| 6e60b45a | drivbank-tra-polykarbonat-orange-90x46x40-cm | FP-drivbank-tra-orange | 879 |
| f837b05d | tomatvaxthus-natfonster-200x100x215-cm | FP-tomatvaxthus-natfonster | 859 |
| b5ba12b8 | premiumvaxthus-takfonster-skjutdorr-190x252x201-cm | FP-vaxthus-takfonster | 6 029 |

Alla tio PATCH-svar gav `ok:true` med stigande `revision` och rätt `slug`/
`urlPath`.

## Steg 8 — SKU, byggd med kodens egen algoritm

`lib/import/sku.ts`s algoritm applicerades för hand. Två SKU:er
differentierades medvetet från redan publicerade färgsyskon för att undvika
kollision: `d99cc578` → `FP-foliehus-hyllor-gron` (mot runda 145:s
`FP-foliehus-hyllor-rullbar` på `0fc3c252`) och `ed4fd2a9` →
`FP-portabelt-vaxthus-gron` (mot runda 145:s `FP-portabelt-minivaxthus` på
`601ae5f5`). Ingen kollision inom batchen och ingen mot rundorna 144/145.

Varje variants FULLSTÄNDIGA tillstånd (`price`, `inventoryStatus`, `choices`,
`visible`, `media` där det fanns) lästes och ekades tillbaka oförändrat i
samma anrop som satte den nya SKU:n — `variantsInfo`-PATCH ersätter hela
variantobjektet, samma regel som runda 144/145.

Alla tio PATCH-svar bekräftade rätt SKU och `hasMedia:true`.

## Steg 10 — kategori (parent + leaf), samma par som runda 144/145

Återanvänt utan ny uppslagning:

- **Trädgård & Utemöbler** (`653ab052-6952-4ce7-842d-ad691cd8206d`, förälder)
- **Växthus & Odling** (`8bcfeb20-1100-437a-9ad3-6c03919126b2`, löv)

Skrivet med `POST /categories/v1/bulk/categories/add-item`. Alla tio gav
`totalSuccesses:2, totalFailures:0`. Verifierat med `list-categories-for-items`
(kräver `treeReference` i kroppen på både skriv- och läsanropet — glömdes
först på läsanropet den här rundan, gav `"treeReference must not be empty"`,
fixat genom att lägga till samma objekt som skrivanropet använder): alla tio
bär nu förälder + All Products + löv.

## Steg 12 — läs-som-kund

Kategoriverifieringen fungerade dubbelt igen: bekräftade både att Steg 10
landade och att sidorna är fullständiga (namn, slug, SKU, kategori, pris,
`visible:true`, `variantVisible:true`) innan rundan stängs.

## Steg 13 — publicering

Skedde de facto redan i Steg 8 (landminan ovan), bekräftat oberoende genom en
fristående `GET` på alla tio. Ingen ytterligare publiceringsåtgärd gjordes
eller behövdes.

## Mappningen stämplad (Steg 8:s andra halva)

Full UUID användes för alla tio från start (regeln från runda 145, task
#580). Samtliga tio `stampla`-körningar gick igenom rent på första försöket:

| pid | wixProductId | job | conclusion | mappningens kvittorad |
|---|---|---:|---|---|
| be595bfd | be595bfd-afc4-4929-bd9d-8ed575294271 | 105640460999 | success | `OK: be595bfd-… uppdaterad — needsAiPolish, draftStatus, variantSkus` |
| d99cc578 | d99cc578-edfc-41da-829b-db886df6e508 | 105640472481 | success | samma form |
| 5556a448 | 5556a448-00b5-4566-983b-4f41aed116d7 | 105640483375 | success | samma form |
| eadb1015 | eadb1015-5084-4a4d-a743-cc04780a29e3 | 105640499312 | success | samma form |
| ed4fd2a9 | ed4fd2a9-bba9-469a-a116-7c5fff7c9b22 | 105640511601 | success | samma form |
| 2b5c2a89 | 2b5c2a89-bc91-4e05-aafa-eb558c5e7559 | 105640526228 | success | samma form |
| 94ee540a | 94ee540a-843b-438b-b83d-9350345d999b | 105640536662 | success | samma form |
| 6e60b45a | 6e60b45a-a303-47f3-ae1d-6e9c9ac5f394 | 105640560086 | success | samma form |
| f837b05d | f837b05d-99cc-4c72-9c0d-5b5bd63a0a9a | 105640568294 | success | samma form |
| b5ba12b8 | b5ba12b8-7b0f-416e-8077-15785ec32f85 | 105640578011 | success | samma form |

`needs_ai_polish: false`, `draft_status: published`,
`variant_skus: {"<wixVariantId>":"<ny SKU>"}` — alla tio: `conclusion: success`,
bekräftade via `get_job_logs`, inte bara den köade 204:an.

## Två genuina källdefekter hittade och lösta INNAN något skrevs

Dokumenterade i detalj i `STEG3-5.md`, sammanfattat här för spårbarhet:

- **`6e60b45a`**: brödtexten sa "grau gestrichenem Holz", strukturerad data sa
  "Farbe: Orange". Fem bilder granskade, alla visar orange — facit är orange,
  brödtextens "grau" är leverantörens copy-paste-fel och togs inte med.
- **`b5ba12b8`**: brödtexten lovade "4 Pflöcke … im Lieferumfang enthalten",
  men den strukturerade Lieferumfang-listan visar bara växthus + anvisning,
  noll pluggar. Samma familj som runda 144:s markpluggsfynd (task #468). Den
  svenska texten nämner markförankring som rekommendation, lovar inte pluggar.

## Två troliga färgsyskon till redan publicerade runda 145-sidor

- `d99cc578` (grön) ↔ runda 145:s `0fc3c252` (vit) — samma bas [artikelnr].
- `ed4fd2a9` (grön) ↔ runda 145:s `601ae5f5` (vit) — samma bas [artikelnr].

Korslänk läggs till på båda sidor i varje par, enligt regeln i task #480
("korslänken ska gå åt båda håll").

## ✅ Runda 146 LIVE — tio växthus i åtta-nio konstruktioner, 10 av 10 gröna

| pid | namn | pris | konstruktion |
|---|---|--:|---|
| be595bfd | Foliehus med nätfönster och rullbar dörr | 959 | nätfönster, rullbar dörr, stål+PE |
| d99cc578 | Foliehus med hyllor, grönt | 1 649 | hyllförsett foliehus, förzinkat stål (grön syskon) |
| 5556a448 | Polytunnelväxthus i förzinkat stål | 1 469 | genomgångsbar polytunnel, 40 clips |
| eadb1015 | Väggväxthus med ogräsduk | 849 | väggmonterat, tillgängligt, ogräsduk |
| ed4fd2a9 | Portabelt växthus, grönt | 959 | portabelt, stålram (grön syskon) |
| 2b5c2a89 | Foliehus med fönster och dörr i stål | 1 339 | 4 fönster, dubbel rullport |
| 94ee540a | Miniväxthus med hyllor, UV-beständigt | 859 | genomgångsbart mini, trestegs växtställ |
| 6e60b45a | Drivbänk i trä och polykarbonat, orange | 879 | liten drivbänk, färgkontradiktion löst |
| f837b05d | Tomatväxthus med nätfönster | 859 | fristående lean-to, väggrekommenderat |
| b5ba12b8 | Premiumväxthus med takfönster och skjutdörr | 6 029 | premium alu/PC, Lieferumfang-kontradiktion löst |

De resterande ~55 kärnväxthusen tas i kommande rundor.
