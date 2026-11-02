### ☠️ Prissynken skrev aldrig ett enda pris till Wix (2026-08-29)

Hittad under den FÖRSTA poleringen, inte av ett larm: bäddsoffan `efaa0c7b` hade
`grossSek: 3529` i mappningen och **4 539 kr i Wix**. Produkten stod på
`revision: 1` — aldrig rörd sedan importen — medan nattens körning rapporterade
"2 priser uppdaterade" och hade skrivit mappningen 06:24.

Orsaken är en förväxling av två helt olika nycklar som båda heter `sku`:

```ts
.map((m) => ({ m, sku: (m.supplierProductId ?? "").slice("aosom:".length) }))  // "DDD-DDDLDDLL"
setStock: async (wixProductId, _sku, antal) => { … }        // IGNORERAR den → fungerade
setPrice: async (wixProductId, sku, …) => updateV3VariantPrices(…, [{ sku }])  // fel nyckel
```

Loopens `sku` är **feedens artikelnummer**. Wix-variantens SKU är
`FP-schlafsofa-2er-sofa-mit`. De kan aldrig matcha, så `updateV3VariantPrices`
hittade ingen variant — och den **kastar inte** i det läget, den hoppar över
PATCH:en och returnerar `{updated: 0, missing}`. Anroparen slängde returvärdet.
Synken räknade därför upp `prisUppdaterade` och skrev mappningen med det nya
priset medan kunden fortsatte se det gamla.

Tre saker gjorde felet osynligt, och alla tre är lagade:

1. **Returvärdet lästes inte.** `setPrice` kastar nu när `updated === 0`, så en
   omatchad skrivning blir `misslyckade` i stället för `prisUppdaterade` — och
   mappningen skrivs inte, så böckerna slutar glida från butiken.
2. **`setStock` maskerade felet.** Den tog samma argument och ignorerade det.
   Lagret fungerade, alltså såg synken frisk ut.
3. ☠️ **Testfixturen satte `variants[0].sku = sku`** — samma sträng i båda
   rollerna. Inget test kunde se skillnad på rätt och fel nyckel. Fixturen ger nu
   `FP-<sku>` + `wixVariantId`, och ett regressionstest låser att prisskrivningen
   får WIX-variantens identitet. Verifierat genom att återinföra buggen: testet
   fäller, och bara det.

⚠️ **Följden för befintlig data:** varje Aosom-produkt vars kostnad ändrats sedan
importen har rätt `landedCostSek` i mappningen och fel pris i Wix. Auktionens
golvbud och lönsamhetsöversikten läser mappningen, butiken läser Wix — de har
alltså varit oense.

☠️ **Och driften läkte INTE av sig själv** — förrän jämförelsen lades om
2026-09-02. Skrivningen biter sedan 2026-08-29, men det räckte inte, och skälet
var samma förväxling en gång till: synken jämförde det nyräknade priset mot
**mappningens** `grossSek`, inte mot Wix.

```ts
const gammalt = variant.grossSek;          // mappningen, inte butiken
…
} else if (pris !== gammalt) { nyttPris = pris; }
```

Den trasiga skrivningen hann uppdatera mappningen. Nästa körning räknade därför
fram samma tal som redan stod där, såg ingen skillnad, och hoppade över
produkten — för alltid. Uppmätt 2026-08-29 efter skrivfixen: bäddsoffan
`efaa0c7b` stod kvar på **4 539 kr i Wix, `revision: 1`** (orörd sedan importen)
med `grossSek: 3529` i mappningen, och körningen 12:20 samma dag rörde den inte.

✅ **Lagat 2026-09-02.** `jamforelsePris` gör butiken till facit: priserna läses i
bulk före loopen och jämförelsen går mot Wix. Driften läker därmed av sig själv,
och de tjugo raderna nedan rättas på köpet — ingen engångsavstämning behövs.

Tre egenskaper i den fixen som inte ska tas bort:

1. ☠️ **Okänt butikspris skriver INGET pris** (`"saknas"` / `"flera"`). En
   produkt som inte kom med i prislistan, eller vars varianter har olika pris,
   har inget entydigt facit — och att då falla tillbaka på mappningen hade
   återinfört exakt buggen för just de rader där den är svårast att upptäcka.
   De räknas i `utanWixPris` i stället för att gissas. Lagret berörs inte:
   det uppslaget går på produkt-id.
2. ☠️ **Taket (`MAX_PRISANDRING_PCT`) räknas mot butikens pris.** Räknat mot
   mappningen hade en rad som redan drivit isär sett ut som en liten ändring och
   sluppit förbi spärren — spärren ska mäta hoppet kunden faktiskt utsätts för.
3. **`MIN_WIX_PRODUKTER = 500` spärrar**, av samma skäl som `MIN_FEED_RADER`:
   en halvläst prislista ser ut som "alla priser har ändrats", och en körning som
   tror det skriver om hela katalogen.

   ☠️ **Men den FÄLLER INTE körningen, till skillnad från `MIN_FEED_RADER`** —
   och skillnaden är vad felet kostar. En trasig feed nollar lagersaldon över
   hela katalogen; där är avbrott enda säkra svaret. En oläsbar prislista kan
   ingenting förstöra (`jamforelsePris` svarar `"saknas"`, och då skrivs inget
   pris). Att ändå avbryta hade stoppat LAGERSYNKEN i sex timmar för ett fel i
   prisdelen — och att sälja något vi inte har är ett kundfel, medan ett orättat
   pris på ett osynligt utkast inte är det. Lagret synkas alltså vidare, men
   körningen får inte se frisk ut: felet bärs i `prislistaFel` → svaret,
   loggraden, audit-raden, och fäller workflow-jobbet.
4. **Bulkläsningen har backoff.** 54 sidor i följd ligger mitt i det spann där
   media-städningen mätte upp att Wix svarar 429 (~40–50 sidor i rad). Utan
   återförsök vore hela prissynken en tärningskastning varje körning. Stegen är
   `importMediaByUrl`:s (1/3/8 s) plus 60 ms mellan sidor — den billigaste
   medicinen mot en strypning som utlöses av tempo är att inte springa.

Verifierat genom att återinföra `const gammalt = variant.grossSek` — tre tester
faller, och bara de tre.
