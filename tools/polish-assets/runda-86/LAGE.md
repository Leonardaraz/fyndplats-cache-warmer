# Runda 86 — sju trädgårdsskåp, Steg 1–12 klara. Publiceringen HÅLLS.

| id8 | slug | pris | mått B × D × H | SKU |
|---|---|--:|---|---|
| `c9a24404` | `tradgardsskap-tra-115-cm-naturtra` | 1 809 | 75 × 56 × 115 | `FP-tradgardsskap-115-natur` |
| `bb112e08` | `tradgardsskap-tra-115-cm-gratt` | 1 839 | 75 × 56 × 115 | `FP-tradgardsskap-115-gra` |
| `1e11480e` | `tradgardsskap-77-cm-fonster-hornhyllor` | 2 499 | 77 × 54,2 × 179 | `FP-tradgardsskap-77-fonster` |
| `d6666869` | `tradgardsskap-191-cm-sadeltak-tva-dorrar` | 2 549 | 79 × 49 × 191,5 | `FP-tradgardsskap-191-sadeltak` |
| `43e312b7` | `tradgardsskap-gratt-182-cm-fallbart-bord` | 2 899 | 78 × 52,5 × 182 | `FP-tradgardsskap-182-bord` |
| `364bc564` | `tradgardsskap-160-cm-lamelldorrar` | 2 999 | 87 × 46,5 × 160 | `FP-tradgardsskap-160-lamell` |
| `8b00022f` | `tradgardsskap-139-cm-brett-dubbeldorr` | 4 569 | 139 × 75 × 160 | `FP-tradgardsskap-139-dubbel` |

Priserna är orörda.

## ☠️ Varför sidorna INTE publicerades

GitHub-åtkomsten föll bort mitt i sessionen: både MCP-verktygen och REST-API:t
svarar **403 `GitHub access is not enabled for this session`**. Workflowen
**"Polering — läs och stämpla mappningsraden"** går därför inte att starta
härifrån, och `CRON_SECRET` är märkt Sensitive i Vercel — rutten är oanropbar
utan den.

Klart-kriteriet kräver `needsAiPolish: false` och `draftStatus: "published"`
på mappningsraden. Publicerar man utan det ligger sidan live OCH kvar i
`/admin/queue` med poleringsbadgen — och nästa som tömmer kön skriver om en
sida som redan är klar. Det är precis den halvfärdiga sortens tillstånd huset
har skrivit ned regler mot, och ett osynligt utkast kostar ingenting medan det
väntar.

`git push` fungerar oförändrat — bara REST-API:t är stängt.

### ✅ Prissynken är INTE i fara — kontrollerat i koden, inte antaget

Wix-SKU:n är omskriven medan mappningen fortfarande bär den råa
(`FP-gartenschrank-holz` och liknande). Det ser ut som 2026-08-29:s
prisskrivningsbugg, men är det inte: `updateV3VariantPrices`
(`lib/wix/v3-products.ts:479`) matchar på **`wixVariantId` FÖRST** och faller
tillbaka på `sku` bara när id saknas — och `setPrice` i `lib/aosom/sync.ts`
skickar med `variant.wixVariantId` när mappningen har ett. Alla 4 445
Aosom-mappningar bär ett. Prissynken adresserar alltså varianten på id, inte
på SKU-strängen, och den gamla SKU:n i mappningen bryter ingenting.

## Vad som återstår — två workflow-körningar

**1. Stämpla mappningsraden**, sju körningar av
`polish-mapping.yml`, läge `stampla`, `needs_ai_polish: false`,
`draft_status: published`:

| `wix_product_id` | `variant_skus` |
|---|---|
| `c9a24404-517d-4b0c-a0de-843d7efe54e8` | `{"66e1cc52-e290-41fb-a484-27e53d23f5f3":"FP-tradgardsskap-115-natur"}` |
| `bb112e08-f7cd-41c1-a9cc-a74d3d108364` | `{"6c26edfc-dfc5-4e7d-bd7d-f229bac93737":"FP-tradgardsskap-115-gra"}` |
| `1e11480e-c817-4940-848d-6f2e2aa13621` | `{"2b962dac-303e-4ec0-9e5a-ece8ad265c13":"FP-tradgardsskap-77-fonster"}` |
| `d6666869-34ef-4e89-bd03-6e05c6a5c733` | `{"9600802d-b66d-482e-b908-8f6626058449":"FP-tradgardsskap-191-sadeltak"}` |
| `43e312b7-4a18-4b05-aec0-1dafcedaafb5` | `{"43d5af88-c744-4439-9edd-fdf2e6178400":"FP-tradgardsskap-182-bord"}` |
| `364bc564-1ff7-40c2-9c53-e35fb5f48a6f` | `{"bbf76ec5-7cff-42c3-8710-5197f578a877":"FP-tradgardsskap-160-lamell"}` |
| `8b00022f-c84b-4643-8c06-b811c20383d7` | `{"7c583892-12d1-4e0a-aa1e-2cd0507e2047":"FP-tradgardsskap-139-dubbel"}` |

**2. Publicera** — en PATCH per produkt med `visible: true` på BÅDE produkten
och `variantsInfo.variants[].visible`. Facit att grinda mot står i
`facit.json`; kör grinden inne i anropet som vanligt.

## Klart-kriteriet — grönt på alla sju

Läst tillbaka ur Wix efter alla skrivningar, `brister: []` på var och en:
facit stämmer på **både längd och hash**, alla tre flikrubrikerna finns
ordagrant, ingen tysk text i beskrivningen, ingen kommalista av tal, inget
bygglovspåstående, varje bild har `image.url`, alla alt-texter unika, kortet
på plats 3, SKU skriven, och alla sju `visible: false`.

`seoData.settings.keywords` bar leverantörens tyska rubrik på alla sju
(`geräteschuppen mit regalböden wetterbeständig`, `gartenschrank gartenhaus
gerätehaus geräteschuppen` …). Rättat till det svenska fokusordet — fältet
överlever annars hela poleringen, eftersom Steg 7 skriver `seoData.tags` men
aldrig `settings`.

Kategorier: **14 av 14 lyckade** — Trädgård & Utemöbler (förälder) +
Trädgårdsskötsel & Bevattning (löv).

## Rundans fem fynd

Se `STEG1.md` för mätningarna. Kort:

1. ☠️ **Maxlasten spänner en faktor åtta** — 6 / 20 / 40 kg, plus tre olika
   tal på `43e312b7` (5 / 30 / 10). `d6666869` anger inget alls och får
   därför ingen; avsaknaden står som en vanlig fråga, aldrig som rubrik.
2. ☠️ **Förankringen ingår i bara två av sju.** Grinden fäller åt båda håll.
3. ☠️ **Tre importerade färgrader var fel** — och bara bilden avslöjar det.
4. ☠️ **`Vikt` i den maskinsatta fliken är PAKETVIKT.** Syns bara på
   `1e11480e`, som har båda talen (23 mot 28,7 kg). Raden heter nu
   `Vikt med emballage` på alla sju — en mekanisk rättelse som gäller varje
   framtida Aosom-runda.
5. ☠️ **`364bc564` säger två saker om sina hyllor.** Leverantörens egen bild
   säger "zwei eingebaute Regale bieten drei getrennte Ablageflächen", texten
   säger "3 Regalböden", och hyllhöjderna räknas upp som tre fack. Två
   hyllplan plus botten ger tre fack — det är det som går att räkna.

## Två grindhål som mättes upp och stängdes

- **Nekningsfiltret var för grovt.** En punktlista har inga meningsslut, så
  ETT "ingår inte" i en punkt slog ut hela listan ur granskningen: en muterad
  punkt "Stomme i pulverlackerad metall" slapp rakt igenom materialgrinden.
  Blockslut räknas nu som meningsslut.
- **`m²` saknades som enhet, och `/` saknades i kedjemönstret.** En golvyta
  var osynlig för talgrinden, och en spec-rad skriven i husets EGEN sifferstil
  (`42 / 39,5 / 61 cm`) fälldes som ett främmande tal. Båda rättade i lint.py
  OCH i media.py, som hade samma hål.

Lint: **0 fel i 7 produkter.** Mutationstest: **18/18**. Alt-grinden:
**11/11**.

## Kvar ur familjen

60 utkast fanns; sju är polerade. `be2591c7` deferrades med flit (delar
yttermått på millimetern med `364bc564`). Resten är gå-in-bodar i metall och
plast, tältförråd och en handfull tvillingar — nästa runda ur samma familj
har gott om material.
