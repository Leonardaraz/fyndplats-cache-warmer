# Runda 147 — Steg 7–13: text, SKU, kategori, publicering

## ☠️ Landminan reconfirmerad en FJÄRDE gång — hanterad rätt igen

Samma mekanism som runda 144, 145 och 146 dokumenterar: en RÅ
`variantsInfo`-PATCH (Steg 8:s SKU-byte) publicerar produkten, trots att
`visible` aldrig fanns med i anropet. Verifierat oberoende (ny `GET`,
inte PATCH-svarets eko) på alla tolv denna runda: samtliga gick till
`visible:true` på produktnivå omedelbart efter SKU-skrivningen
(`visibleAfter:true` i alla tolv PATCH-kvitton).

Regeln följdes igen: Steg 10 (kategori) kördes OMEDELBART efter Steg 8,
med noll medveten fördröjning. Skadan blev återigen bara ORDNINGEN — ett
kort fönster med rätt text men fel/ingen kategori, aldrig felaktig eller
ofärdig text till kund. Fjärde raka rundan där regeln håller.

## Steg 7 — text, slug, seoData (alla tolv)

Skrivet via `plainDescription` (samma skrivbara HTML-fält som runda
144–146). Texterna skrevs till `texter-utkast.md` och grep-verifierades
mot kända felmönster (leverantörsnamn, Aosom-artikelnummer, glas,
tidigare stavfel, tyska kvarlevor, "leverantören anger", SKU-kollisioner)
INNAN någon skrivning. Ett genuint fynd gjordes i grepgrinden: det tyska
ordet **"Stufe"** hade lämnats okänsligt i fem av tolv utkastade
Vindtålighet-rader — fixat med en global `replace_all` ("Stufe 4" →
"nivå 4") innan texten nådde Wix. Efterföljande grep gav noll träffar på
"Stufe" och fem träffar på "nivå 4".

`seoData`-formen (`tags`-array med title/og:title/description/og:description/
og:type, plus `settings.keywords`) bekräftades genom `SearchWixAPISpec`
och en live-GET på ett av produkternas befintliga tyska seoData, i
stället för att gissas.

| pid | ny slug | ny SKU | pris |
|---|---|---|--:|
| `75b88995` | polytunnelvaxthus-forzinkat-stal-600x300x197-cm | FP-polytunnel-600x300 | 3 019 |
| `b8496223` | polytunnelvaxthus-forzinkat-stal-300x200x197-cm | FP-polytunnel-300x200 | 1 699 |
| `ad667726` | bagtunnelvaxthus-fyra-rulldorrar-gront-360x90x90-cm | FP-bagtunnel-gron | 829 |
| `3e60d4ee` | bagtunnelvaxthus-fyra-rulldorrar-transparent-360x90x90-cm | FP-bagtunnel-transparent | 819 |
| `e0b85bb6` | minivaxthus-tra-uppfallbart-tak-gratt-100x65x40-cm | FP-minivaxthus-gratt | 969 |
| `83a5fc0e` | minivaxthus-tra-uppfallbart-tak-brunt-100x65x40-cm | FP-minivaxthus-brunt | 969 |
| `cc2add44` | foliehus-rullbar-dorr-natfonster-gront-200x75x188-cm | FP-foliehus-rullbar-dorr | 879 |
| `11d486a3` | minivaxthus-tva-odlingsytor-185x94x150-cm | FP-minivaxthus-185x94 | 849 |
| `eac7fdca` | premiumvaxthus-takfonster-svart-192x192x204-cm | FP-premiumvaxthus-svart | 3 699 |
| `0667fc10` | tomatvaxthus-fyra-fonster-245x200x198-cm | FP-tomatvaxthus-245 | 1 179 |
| `87485b8a` | drivbank-tra-polykarbonat-gra-90x46x40-cm | FP-drivbank-tra-gra | 899 |
| `1a46d2af` | vaxthus-takfonster-skjutdorr-gront-190x252x201-cm | FP-vaxthus-tak-gront | 4 999 |

Alla tolv PATCH-svar gav `ok:true` med stigande `revision` och rätt
`slug`.

## Steg 8 — SKU, byggd med kodens egen algoritm

`lib/import/sku.ts`s algoritm applicerades för hand. Tre SKU:er
differentierades medvetet från redan publicerade syskon för att undvika
kollision:

- `cc2add44` → `FP-foliehus-rullbar-dorr` (mot runda 146:s
  `FP-foliehus-natfonster` på `be595bfd` — samma konstruktionsfamilj,
  behövde ett annat framträdande ord)
- `87485b8a` → `FP-drivbank-tra-gra` (mot runda 146:s
  `FP-drivbank-tra-orange` på `6e60b45a` — bytte färgordet, samma mönster)
- `1a46d2af` → `FP-vaxthus-tak-gront` (mot runda 146:s
  `FP-vaxthus-takfonster` på `b5ba12b8` — nära nog att kräva en
  medveten ordomkastning för att bli en distinkt sträng)

Ingen kollision inom batchen och ingen mot rundorna 144–146.

Varje variants FULLSTÄNDIGA tillstånd (`price`, `inventoryStatus`,
`choices`, `visible`, `media` där det fanns) lästes om direkt före
skrivningen (revisionerna hade redan stigit efter Steg 7) och ekades
tillbaka oförändrat i samma anrop som satte den nya SKU:n —
`variantsInfo`-PATCH ersätter hela variantobjektet, samma regel som
runda 144–146.

Alla tolv PATCH-svar bekräftade rätt SKU.

## Steg 10 — kategori (parent + leaf), samma par som runda 144–146

Återanvänt utan ny uppslagning:

- **Trädgård & Utemöbler** (`653ab052-6952-4ce7-842d-ad691cd8206d`, förälder)
- **Växthus & Odling** (`8bcfeb20-1100-437a-9ad3-6c03919126b2`, löv)

Skrivet med `POST /categories/v1/bulk/categories/add-item`. Alla tolv gav
`totalSuccesses:2, totalFailures:0`. Verifierat med
`list-categories-for-items` (`treeReference` i kroppen på både
skriv- och läsanropet): alla tolv bär förälder + löv.

## Steg 12 — läs-som-kund

En samlad `list-categories-for-items` + fresh product-GET för alla tolv
bekräftade samtidigt: `visible:true`, `variantVisible:true`, rätt
namn/slug/SKU/pris, och båda kategorierna — innan rundan stängs.

| pid | namn | pris | visible | SKU rätt | kategori (förälder+löv) |
|---|---|--:|---|---|---|
| `75b88995` | Polytunnelväxthus i förzinkat stål, 600x300x197 cm | 3 019 | ✅ | ✅ | ✅ |
| `b8496223` | Polytunnelväxthus i förzinkat stål, 300x200x197 cm | 1 699 | ✅ | ✅ | ✅ |
| `ad667726` | Bågtunnelväxthus med fyra rulldörrar, grönt, 360x90x90 cm | 829 | ✅ | ✅ | ✅ |
| `3e60d4ee` | Bågtunnelväxthus med fyra rulldörrar, transparent, 360x90x90 cm | 819 | ✅ | ✅ | ✅ |
| `e0b85bb6` | Miniväxthus i trä med uppfällbart tak, grått, 100x65x40 cm | 969 | ✅ | ✅ | ✅ |
| `83a5fc0e` | Miniväxthus i trä med uppfällbart tak, brunt, 100x65x40 cm | 969 | ✅ | ✅ | ✅ |
| `cc2add44` | Foliehus med rullbar dörr och nätfönster, grönt, 200x75x188 cm | 879 | ✅ | ✅ | ✅ |
| `11d486a3` | Miniväxthus med två odlingsytor, 185x94x150 cm | 849 | ✅ | ✅ | ✅ |
| `eac7fdca` | Premiumväxthus med takfönster, svart, 192x192x204 cm | 3 699 | ✅ | ✅ | ✅ |
| `0667fc10` | Tomatväxthus med fyra fönster, 245x200x198 cm | 1 179 | ✅ | ✅ | ✅ |
| `87485b8a` | Drivbänk i trä och polykarbonat, grå, 90x46x40 cm | 899 | ✅ | ✅ | ✅ |
| `1a46d2af` | Växthus med takfönster och skjutdörr, grönt, 190x252x201 cm | 4 999 | ✅ | ✅ | ✅ |

## Steg 13 — publicering

Skedde de facto redan i Steg 8 (landminan ovan), bekräftat oberoende
genom Steg 12:s fristående `GET` på alla tolv. Ingen ytterligare
publiceringsåtgärd gjordes eller behövdes.

## Mappningen stämplad (Steg 8:s andra halva)

Full UUID användes för alla tolv från start (regeln från runda 145,
task #580). Samtliga tolv `stampla`-körningar gick igenom rent på
första försöket, och alla tolv jobbloggar lästes (inte bara den köade
204:an):

| pid | wixProductId | job | conclusion | mappningens kvittorad |
|---|---|---:|---|---|
| `75b88995` | 75b88995-e3e5-4914-9fcf-a3acdc34be42 | 35372006677 | success | `OK: 75b88995-… uppdaterad — needsAiPolish, draftStatus, variantSkus` |
| `b8496223` | b8496223-4b9e-43d0-91b0-3a425da67f39 | 35372014658 | success | samma form |
| `ad667726` | ad667726-de28-4500-8911-0d1d45bc601b | 35372017902 | success | samma form |
| `3e60d4ee` | 3e60d4ee-c960-4eff-9237-0994f21c6833 | 35372020776 | success | samma form |
| `e0b85bb6` | e0b85bb6-5cfd-43a6-a583-284e2d587d12 | 35372024600 | success | samma form |
| `83a5fc0e` | 83a5fc0e-39ae-4aa8-b45e-211294c88385 | 35372027511 | success | samma form |
| `cc2add44` | cc2add44-d144-4d2f-9c04-9325fd9378d0 | 35372031010 | success | samma form |
| `11d486a3` | 11d486a3-5a81-45ef-89dc-284538475b12 | 35372034699 | success | samma form |
| `eac7fdca` | eac7fdca-756a-495f-a056-4ffc26a6ce17 | 35372037473 | success | samma form |
| `0667fc10` | 0667fc10-0304-43a2-9e75-694ccdfa77ef | 35372041641 | success | samma form |
| `87485b8a` | 87485b8a-742f-416a-97ba-d368b55e295b | 35372045364 | success | samma form |
| `1a46d2af` | 1a46d2af-2d48-4150-a001-07f607b2e723 | 35372048735 | success | samma form |

`needs_ai_polish: false`, `draft_status: published`,
`variant_skus: {"<wixVariantId>":"<ny SKU>"}` — alla tolv:
`conclusion: success`, bekräftade via `get_job_logs`, inte bara den
köade 204:an.

## Tre genuina syskonrelationer till redan publicerade runda 146-sidor

Utredda i detalj i `STEG3-5.md`, sammanfattat här för spårbarhet:

- `cc2add44` (grönt) ↔ runda 146:s `be595bfd` (vitt) — bas `84H-565V00`.
- `87485b8a` (grått) ↔ runda 146:s `6e60b45a` (orange) — bas `845-379V01`,
  inget färgkontradiktionsfynd (till skillnad från `6e60b45a` självt).
- `1a46d2af` (grönt/transparent) ↔ runda 146:s `b5ba12b8`
  (grått/transparent) — bas `845-059`, ärver samma
  Lieferumfang-kontradiktion (löst identiskt: markförankring som
  rekommendation, inga pluggar utlovade).

Korslänk läggs till på båda sidor i alla tre paren, enligt regeln i
task #480 ("korslänken ska gå åt båda håll"). Det ger nu **fem** väntande
korslänkpar totalt (task #585:s två från runda 145↔146, plus dessa tre
från runda 147↔146) — lämpliga att göra i en samlad korslänkningsrunda.

## ✅ Runda 147 LIVE — tolv växthus i nio-tio konstruktioner, 12 av 12 gröna

| pid | namn | pris | konstruktion |
|---|---|--:|---|
| `75b88995` | Polytunnelväxthus i förzinkat stål, 600x300x197 cm | 3 019 | stor polytunnel, förzinkat stål |
| `b8496223` | Polytunnelväxthus i förzinkat stål, 300x200x197 cm | 1 699 | samma konstruktion, mindre |
| `ad667726` | Bågtunnelväxthus med fyra rulldörrar, grönt | 829 | lågt bågtunnelväxthus (grön syskon) |
| `3e60d4ee` | Bågtunnelväxthus med fyra rulldörrar, transparent | 819 | lågt bågtunnelväxthus (transparent syskon) |
| `e0b85bb6` | Miniväxthus i trä med uppfällbart tak, grått | 969 | litet trädrivhus (grå syskon) |
| `83a5fc0e` | Miniväxthus i trä med uppfällbart tak, brunt | 969 | litet trädrivhus (brun syskon) |
| `cc2add44` | Foliehus med rullbar dörr och nätfönster, grönt | 879 | foliehus, färgsyskon till `be595bfd` |
| `11d486a3` | Miniväxthus med två odlingsytor | 849 | genomgångsbart tunnelväxthus |
| `eac7fdca` | Premiumväxthus med takfönster, svart | 3 699 | premium polykarbonat/alu |
| `0667fc10` | Tomatväxthus med fyra fönster | 1 179 | foliehus med bågtak |
| `87485b8a` | Drivbänk i trä och polykarbonat, grå | 899 | liten drivbänk, färgsyskon till `6e60b45a` |
| `1a46d2af` | Växthus med takfönster och skjutdörr, grönt | 4 999 | premium alu/PC, färgsyskon till `b5ba12b8` |

De resterande ~44 kärnväxthusen tas i kommande rundor.
