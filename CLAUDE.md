# Fyndplats cache-warmer — projektanvisningar

## Så här jobbar vi: bunta ihop deploys

**En arbetsdag ska bli en eller två deploys, inte fem.** Samla dagens
ändringar på grenen och merga när de hänger ihop — merga inte varje fix för
sig så fort den är grön.

Samma regel står i butiksrepots `CLAUDE.md` (grenen `headless-site`). Den
finns på båda ställena med flit: repot bär två orelaterade historier med var
sin instruktionsfil, och en session som jobbar här läser aldrig den andra.

### Varför — mätt, inte antaget

Vercel-fakturan 2026-09-04, sju dagar in i cykeln, 11,84 av 20 dollars
inkluderad kredit förbrukad:

| Rad | Belopp | Andel |
| :-- | --: | --: |
| **Build CPU Minutes** | **$5,80** | **49 %** |
| Observability Events | $1,88 | 16 % |
| ISR Writes | $1,80 | 15 % |
| Fluid Provisioned Memory | $0,78 | 7 % |
| Fluid Active CPU | $0,51 | 4 % |

Byggen är halva notan. Veckan innehöll en dag med **fem merges** för arbete
som hade rymts i ett eller två byggen.

**Och en deploy kostar två gånger.** Butiken tömmer sin ISR-cache vid varje
deploy, så ~1 580 av 1 622 produktsidor blir kalla; första besökaren på varje
betalar 0,86–1,52 s i stället för 0,15. Timcronen värmer upp dem igen, men
det är ytterligare 1 622 renderingar. Färre deploys är alltså både billigare
OCH snabbare för kunden.

⚠️ **Katalogen är 5 092 produktsidor (2026-10-23), och värmaren hann inte.** Efter
butikens deploy 01:02 UTC värmde `varm-katalogen` 1 824 sidor, nådde sin deadline
och körde inte igen: provet på tolv fasta sidor värmde sig självt. PR #770 på
`headless-site` låter värmningen gå i led tills hela katalogen är varm; regeln
står i butikens `CLAUDE.md`. Butiken deployas på natten, kring kl. 03 svensk tid.

⚠️ **Det gäller butikens egna byggen** (grenen `headless-site`). En merge till `main` i
det här repot bygger bara motorn: `vercel.json` avbryter butiksprojektets bygge, och
butikens cache ligger kvar. Mätt 2026-09-27: butikssidor renderade 15:02 UTC hade
fortfarande sin cache 15:24, efter motorns produktionsbygge 15:08.

### Särskilt för import- och poleringspass

Ett pass som rör dussintals produkter ska bli **EN PR, mergad sällan** — inte
en PR per produkt.

- Öppna en gren för hela passet och lägg alla produkter där.
- Merga när passet är klart, inte efter varje produkt som blivit bra.
  En halvfärdig gren skadar ingen; den ligger bara och väntar.
- Går arbetet över flera dagar: låt grenen leva och merga när den är klar.
- Poleringen är sällan brådskande. Ingen kund väntar på en omskriven
  produkttitel — det är precis den sortens arbete som ska samlas ihop.

### ☠️ En PUSH till grenen bygger också — inte bara en merge (2026-09-05)

Regeln ovan vaktade merges till `main`. Den missade hälften av notan: **Vercel
bygger varje push till varje gren** som en preview. Uppmätt på ett dygns
byggen i projektet `fyndplats-cache-warmer`:

| gren | byggen | typ |
|---|--:|---|
| `claude/…-bz3j9l` | **8** | preview, alla READY |
| `claude/…-uq6fwl` | 4 | preview |
| `main` | 4 | production |

**Tolv av sexton byggen var previews**, och de åtta från poleringsgrenen rörde
uteslutande `docs/` och `tools/polish-assets/` — texter, kort och runbok.
Ingenting som appen bygger eller serverar. Build CPU är 49 % av fakturan, och
tre fjärdedelar av byggvolymen den dagen nådde aldrig en kund.

☠️ **`[skip ci]` FUNGERAR INTE här — provat och mätt.** Den självklara fixen
är Vercels dokumenterade markör i ämnesraden. Commiten `177c55d` bar
`[skip ci]` först i ämnesraden och byggdes ändå:
`dpl_GXiYPfKUfRBTf3J6Xyi7tVf7SjAp`, `state: READY`, `target: null`. Skriv
alltså inte in markören i tron att den hjälper — den ger ett bygge OCH en
felaktig känsla av att vara sparsam.

**Det som återstår och faktiskt biter: PUSHA FÄRRE GÅNGER.** En poleringsrunda
behöver som mest **två** pushar — korten (som måste ligga i grenen innan Wix
hämtar dem från `raw.githubusercontent.com`) och allt annat vid rundans slut.
Runda 60 och 61 kostade åtta byggen; samma arbete ryms i två. Committa fritt
under vägen, pusha sällan.

### ✅ Löst i `vercel.json` — dokumentation utlöser inget bygge (Leonards ja 2026-09-05)

☠️ **Panelens *Ignored Build Step* är en återvändsgränd här.** `vercel.json`s
`ignoreCommand` ÖVERRIDER den, och filen har burit en sedan tidigare. Att
klicka i panelen hade alltså inte gjort någonting alls — och sett ut som att
det gjorde det.

Raden fanns redan och skiljde de två projekten åt; den har nu ett villkor till:

```
[ "$VERCEL_PROJECT_ID" = "prj_CEca…" ] && exit 0;
[ -z "$VERCEL_GIT_PREVIOUS_SHA" ] && exit 1;
git diff --quiet "$VERCEL_GIT_PREVIOUS_SHA" HEAD -- . ':!docs' ':!tools' ':!*.md'
```

Vercels egen dokumentation, ordagrant: *"Exiting with code 0 ignores the build,
while code 1 continues it."*

☠️ **Varje felläge bygger.** Saknas `VERCEL_GIT_PREVIOUS_SHA`, ligger den
utanför den grunda klonen, eller failar git av något annat skäl — alla ger
nollskilt slut. Den enda vägen till "hoppa över" är att git uttryckligen säger
att ingenting utanför `docs/`, `tools/` och markdown ändrades.

Provkört mot repots verkliga historik före ändringen:

| spann | rörde | exit | utfall |
|---|---|--:|---|
| `7210d94~1..7210d94` | bara `CLAUDE.md` | 0 | hoppas över |
| `300f49f~1..300f49f` | `docs/` + `tools/` | 0 | hoppas över |
| `04142e7~1..04142e7` | `lib/`, workflows, `CLAUDE.md` | 1 | **bygger** |
| kod…dokumentation i ETT spann | blandat | 1 | **bygger** |
| SHA utanför klonen | — | 128 | **bygger** |

⚠️ **Jämförelsen går mot `VERCEL_GIT_PREVIOUS_SHA`, inte mot `HEAD^`.** Det är
skillnaden som gör batchade pushar säkra: `HEAD^ HEAD` ser bara den SISTA
commiten, så fem rundor där en bär kodändring och den sista bara rör runboken
hade hoppat över bygget. Mot förra deployade SHA:n täcks hela spannet — mätt
i tabellens fjärde rad.

⚠️ **Utesluter markdown ÖVERALLT**, inte bara i `docs/`. Kontrollerat samma
dag: ingen `.md` importeras av `app/`, `lib/` eller `middleware.ts`, och
byggkommandot är rena `next build`. Börjar någon rendera markdown måste raden
snävas in.

⚠️ Projektet `fyndplats-headless` är kopplat till SAMMA repo och startar också
ett bygge per push, men de avbryts allihop. Kostnaden dubbleras alltså inte —
kontrollmätt samma dag, alla `CANCELED`.

### ✅ Kvitterat i drift — och så här SER ett hoppat bygge ut

Commiten `1e092da` rörde bara `CLAUDE.md` och pushades ensam. Utfallet:

```
dpl_AuG4gebWgTksRNhxJXxYPEJ4o2tC   state: CANCELED   target: null
buildingAt 1788606981214 → ready 1788606990281        (9 sekunder)
errorLink: https://vercel.com/docs/platform/projects#ignored-build-step
```

☠️ **Ett hoppat bygge heter `CANCELED`, inte `SKIPPED`** — och en deployment-rad
skapas ändå. Läser man bara "kom det en deployment?" ser filtret alltså ut att
inte bita. Tre fält skiljer, och det är dem man ska titta på:

| | byggt | hoppat |
|---|---|---|
| `state` | `READY` | **`CANCELED`** |
| `bundler` | `turbopack` | **saknas** |
| `lambdaRuntimeStats` | `{"nodejs":10}` | **saknas** |
| tid `buildingAt`→`ready` | minuter | **9–10 s** |
| `errorLink` | — | **`#ignored-build-step`** |

☠️ **`BUILDING` är INGEN dom — ett hoppat bygge passerar också `buildingAt`.**
Uppmätt på båda utfallen: det hoppade `dpl_FcyV49nTCqAXdp9aSpSAbdjA4Bgs` stod
som `BUILDING` fyra sekunder efter pushen och blev `CANCELED` tio sekunder in.
Den självklara kontrollen — "startade ett bygge?" — svarar alltså JA i båda
fallen. Vänta ut sluttillståndet, och läs det, inte starten.

`errorLink` är det som gör det till ett kvitto i stället för en tolkning: Vercel
namnger själv ignore-steget som orsak.

⚠️ **Undantagen är `docs/`, `tools/` och markdown — INGET annat.** En fil i
ROTEN bygger, hur dokumentationsartad den än är. Uppmätt samma dag: en
poleringspush som utöver `docs/` och `tools/` också rörde **`.gitignore`** gav
`dpl_55GKnt9rztTGCywNaXUgVcR79GS4`, `BUILDING`. Filtret gjorde rätt — men den
som tror sig pusha "bara dokumentation" ska titta efter rotfiler först
(`.gitignore`, `package.json`, konfig). Kolla med
`git diff --name-only <förra deployade SHA> HEAD -- . ':!docs' ':!tools' ':!*.md'`;
är den tom hoppas bygget över — verifierat båda vägarna samma dag: `.gitignore`
i spannet gav `READY` på 41 sekunder, ren markdown gav `CANCELED` på tio.

⚠️ **Följdregel, mätt på vägen dit: pusha inte två gånger inom samma
byggfönster.** Första försöket misslyckades — den rena dokumentationscommiten
`79718d9` byggdes (`dpl_7yFr3c1jKqMJza9DjvvcmjejCt6P`, `READY`). Orsaken var
inte filtret utan gapet: de två pusharna låg **26 sekunder** isär, alltså långt
innan `c0bdbcc`:s bygge hunnit bli `READY`. `VERCEL_GIT_PREVIOUS_SHA` är förra
**lyckade** deployens SHA och pekade därför fortfarande på `7210d94` — och det
spannet innehåller `vercel.json`. Filtret gjorde rätt; mätningen var fel
uppställd. Ligger en poleringspush tätt efter en kodpush bygger den alltså i
onödan.

✅ **Vad det betyder för poleringen: en runda kostar noll byggen.** Allt en
poleringsrunda skriver till grenen ligger i `docs/` och `tools/polish-assets/`.
Batchningsregeln ovan gäller fortfarande MERGES till `main` (de bygger motorn, men
butikens ISR-cache rör de inte, se ovan), men pushar till poleringsgrenen behöver
inte längre sparas ihop.

### ☠️ Filtret FÖRGIFTAR SIG SJÄLVT — och slutade fungera efter sju hoppade byggen (2026-09-05)

Sex pushar i rad gav `state: ERROR` och ett "Preview deployment failed"-mejl var.
Ingen av dem rörde en kodrad. Felet står ordagrant i deployment-svaret:

```
errorStep:    ignoreStep
errorMessage: Command failed with exit code 128
              fatal: bad object 3e072fa96aab30d1f58d748f88eca717f3ef6014
buildingAt → ready: 11 sekunder
```

☠️ **`VERCEL_GIT_PREVIOUS_SHA` är förra LYCKADE deployens SHA — och ett hoppat
bygge är `CANCELED`, alltså inte lyckat.** Pekaren står därför still så länge
filtret biter. Ju bättre filtret fungerar, desto längre bak hamnar referensen,
tills den ligger utanför Vercels **grunda klon** — och då failar `git diff` med
`exit 128` vid varje push, för alltid.

Uppmätt på ett dygns byggen i grenen:

| tid | utfall | antal |
|---|---|--:|
| 10:00–11:42 | `READY` (före/vid filtret) | 7 |
| 11:16–12:31 | **`CANCELED`** — filtret bet | 7 |
| 12:55–13:53 | ☠️ **`ERROR`** — pekaren utanför klonen | 6 |

Raden `[ -z "$VERCEL_GIT_PREVIOUS_SHA" ] && exit 1` fångade bara det TOMMA
fallet. Den täckte inte "satt men oåtkomlig", och det är just det fallet filtrets
egen framgång skapar.

☠️ **Och `ignoreCommand` får vara HÖGST 256 TECKEN.** Första lagningen försökte
fördjupa klonen med `git fetch --deepen=500` och blev 430 tecken. Vercel svarade
`The vercel.json schema validation failed: ignoreCommand should NOT be longer
than 256 characters` — och den deployen blev ERROR den också. Gränsen står inte i
den dokumentation raden hänvisar till; den syns bara i felmeddelandet.

✅ **Den korta lagningen är dessutom den BÄTTRE.** `git cat-file -e` avgör om
SHA:n går att nå; går den inte det blir det `exit 1`, alltså BYGG. Det bygget
lyckas → `READY` → `VERCEL_GIT_PREVIOUS_SHA` flyttas fram till en nåbar commit →
filtret fungerar igen. **Felet läker alltså ut sig självt med ett enda bygge**,
medan `--deepen` bara hade skjutit upp samma problem till nästa 500 commits.

Raden är 213 tecken och `[ -z … ]`-vakten behövs inte längre: `cat-file` på en
tom sträng failar av sig själv. Provkört mot repots verkliga historik:

| fall | gammal | ny |
|---|--:|--:|
| dagens spann, bara `docs/` + `tools/` | 0 | **0** |
| spann med kod | 1 | **1** |
| SHA utanför klonen | **128** | **1** (bygger, läker) |
| tomt `VERCEL_GIT_PREVIOUS_SHA` | 1 | **1** |
| butiksprojektet `prj_CEca…` | 0 | **0** |

⚠️ **Kostnaden var liten, larmet var inte det.** Ett `ERROR` dör i ignore-steget
efter elva sekunder och kör aldrig `next build` — ungefär samma CPU som ett
hoppat bygge. Men det skickar ett mejl varje gång, och ett larm som fyrar på
varje korrekt push lär mottagaren att sluta läsa. Samma regel som mot ett rött
synk-jobb vid varje svep.

☠️ **Och rapporteringen var fel innan den var mätt.** Den här sessionen sa
"noll byggen idag" om femton commits, räknat på att spannet bara rörde `docs/`
och `tools/`. Det var rätt om FILTRETS AVSIKT och fel om UTFALLET. **Räkna
byggen i Vercels deployment-lista, inte i `git diff`** — filtret kan vara ur
funktion utan att spannet ändras.

✅ **Läkningen är mätt, inte utlovad.** Lagningens egen push rör `vercel.json` i
roten och bygger alltså med flit — och det är precis det bygget som ger filtret
en ny nåbar referenspunkt:

```
14:08:51  READY   055653d   ← lagningen; pekaren står här nu
14:04:13  ERROR   765996d     fatal: bad object 3e072fa…
13:23–13:53  ERROR × 4       samma sak, en push var
11:42:23  READY   3e072fa   ← pekaren satt fast här i två och en halv timme
```

Hela förloppet syns i EN tabell om man läser deployment-listan i tidsordning:
sju `READY`, sju `CANCELED`, sex `ERROR`, en `READY`. De sju `CANCELED` är inte
oskyldiga i den kedjan — **de är orsaken**, för varje hoppat bygge lämnade
pekaren still en runda till.

### ✅ Läkningen är inte engångs — den upprepas, och det är meningen (2026-09-05)

Runda 65:s poleringspush byggde: `dpl_Gczypgrm8LLYUxWewH2jd4AcyFhA`, `READY`,
`bundler: turbopack`, `lambdaRuntimeStats {"nodejs":10}`. Den rörde bara
`tools/polish-assets/`.

Det är INTE filtret som slutat fungera. Diffen mättes lokalt mot varenda
tänkbar referenspunkt i spannet — `055653d`, `fad67cd`, `9030055`, `6d49b02`,
`9e62165` — och alla ger **noll** filer utanför `docs/`, `tools/` och markdown.
Kvar står bara `git cat-file`-vakten: pekaren låg utanför den grunda klonen
igen, och då är `exit 1` det RÄTTA svaret.

☠️ **Orsaken är den som avsnittet ovan redan beskriver, och den återkommer med
varje lyckad filtrering.** Ett hoppat bygge är `CANCELED`, alltså inte lyckat,
så `VERCEL_GIT_PREVIOUS_SHA` står still. Efter tio hoppade pushar ligger den tio
commits bak — och Vercels klon är grund. Läkningsbygget flyttar fram pekaren och
allt fungerar igen tills nästa svit hoppade byggen hunnit dra iväg den.

**Räkna alltså med ETT bygge per svit hoppade pushar, inte noll.** Det är
priset för att inte fördjupa klonen (`--deepen` sprängde 256-teckengränsen), och
det är billigt: tio hoppade byggen och ett riktigt slår elva riktiga. Men skriv
inte "noll byggen" om en runda utan att ha läst deployment-listan — filtret kan
göra exakt rätt och ändå bygga.

⚠️ **En gren som startats om efter en merge bygger sin första docs-bara push**
(mätt 2026-10-23). Efter mergen av #762 (squash `048ac5b6`) startades grenen om
från `main` och fick en ny PR (#769). Dess första push (`75f08edc`) rörde bara
`CLAUDE.md`, `FLAGGADE.md` och en kommentar i ett verktyg under `tools/`, och
diffen utanför `docs/`, `tools/` och markdown var tom (0 filer). Ändå blev
motorns preview `dpl_2skPGzaNddFYfD3BKemSAzAgECxG` `READY` efter 67 sekunder
(`buildingAt` 04:34:27, `ready` 04:35:33), medan butiksprojektets bygge av samma
commit blev `CANCELED`. Orsaken är inte mätt. Den förklaring som stämmer med
avsnitten ovan är att grenens förra lyckade bygge låg utanför den grunda klonen
eller saknades, så filtrets `git cat-file`-vakt gav `exit 1`, alltså ett
läkningsbygge. Prövningen var nästa docs-bara push på grenen (`8cf275c1`, bara
`CLAUDE.md`): den hoppades över (`dpl_DdiptoBLEi9W6dtQamFBiSpdobwR`, `CANCELED`
med `errorLink` `#ignored-build-step`), eftersom pekaren stod på `75f08edc`.
Förklaringen håller alltså: den första pushen läkte pekaren och den andra
hoppades över.

### ☠️ En merge gav inget bygge — GitHub skickade ingen push-händelse (2026-09-25)

Butiks-PR #647 mergades 01:29:32 UTC via API:t, och refen `headless-site`
flyttades till merge-commiten. GitHubs händelselogg fick `PullRequestEvent
merged` och en `DeleteEvent` för grenen, men ingen `PushEvent`, och Vercel
skapade ingen deployment i något av de två projekten på elva minuter. Både
GitHub och Vercel rapporterade full drift. #652:s merge en halvtimme tidigare
fick sin push-händelse efter en sekund.

En merge utan bygge ser ut som en lyckad: PR:en är mergad, grenen raderad och
produktionen svarar 200. Den kör bara den gamla koden.

**Kontrollera efter varje merge att merge-commiten fått ett bygge**
(`list_deployments` med `sha`, eller commit-statusen på merge-commiten). Saknas
det efter några minuter: starta det via Vercels API, `create_deployment` med
`gitSource` (org, repo, ref och sha) och `target: production`, mot exakt
merge-commiten. Det är samma bygge som mergen skulle ha gett. Håll sedan utkik
efter en dubblett från en sen webhook, och avbryt den medan den bygger. För
#647 kom ingen.

### Undantaget

En bugg som skadar kunder just nu får sin egen deploy direkt. Det är
kostnaden värd. Allt annat väntar in sina syskon.

## Import-arbetsflöde & AI-kostnad (`AI_ENRICHMENT_ENABLED`)

Import-pipelinen (`lib/import/pipeline.ts → importProduct`) kan köras i två lägen.
Master-switchen är env-variabeln **`AI_ENRICHMENT_ENABLED`** (default `true`).

### Default-läge: RÅ import → polera via chatten (GRATIS)

Sätt `AI_ENRICHMENT_ENABLED=false` i Vercel (production). Då:

- Importen gör **inga dyra Claude-anrop** (ingen SEO-text, FAQ/flik-generering,
  kategorisering eller Sonnet-bildanalys). Undantag: **variantöversättningen** har
  en egen, billig AI-fallback — se nästa avsnitt (kan stängas av för hård $0).
- Produkten skapas ändå komplett i Wix från rå AliExpress-data: **rå titel/
  beskrivning**, svensk **variant-översättning** (statisk tabell + ev. cachad
  Haiku-fallback, via `variant-translations.ts` / `variant-ai-translate.ts`),
  **prissättning** + **lager** (deterministiskt), bilder, EU-lager-ribbon,
  spec-fliken från råa specs.
- Produkten blir **draft** (`visible:false`) och hamnar i **`/admin/queue`** med
  badgen **"✨ Behöver AI-polering"** (filter-chip finns).
- I kön finns knappen **"✨ Be Claude i chatten att polera"** → kopierar
  produkt-info + Wix-ID till urklipp. Klistra in i Cowork-chatten och säg
  *"polera denna"* så skriver Claude SEO/beskrivning/FAQ/kategori gratis i chatten
  istället för via betald API-pipeline.

### Variantöversättning: tabell → cache → Haiku → svenskhets-grind → färg-grind (egen switch `VARIANT_AI_TRANSLATION_ENABLED`)

Variantvärden (t.ex. "Warm White", "100 inch") översätts till svenska FRÅN START
vid import — viktigt, för i Wix V3 speglar `choice.name` den låsta `choice.key`:en,
så värden kan inte döpas om i efterhand. Fem lager (`lib/import/variant-ai-translate.ts`);
färg-grinden (5) körs sedan 2026-08-09 i BÅDA lägena — även hård-$0/sync-läget
(`colorGateFlags` i pipeline-else-grenen), eftersom den är deterministisk och gratis:

1. **Statisk tabell** (`variant-translations.ts`, $0): golden-testad, auktoritativ.
2. **AI-fallback** (Haiku, default PÅ): bara för värden tabellen missar, **ett**
   batchat anrop per produkt, **cachat per värde för alltid** (→ nära $0; samma
   råvärde översätts en gång, någonsin). Routas via `completeJsonRouted` → ärver
   daglig budgetcap + Gemini-fallback + `failOpen` (importen fälls aldrig).
   Eko-asymmetri: rent-ord-ekon misstros (flaggas + självläker); halvöversättningar
   som behåller engelska tokens flaggas.
3. **Olösta värden** (AI av/fail/kvarvarande engelska) → produkten flaggas
   `needsAiPolish` och hamnar i poleringskön i stället för att nå kunden halv-engelsk.
4. **Svenskhets-grinden** (slutsteg, AI-läget): de FAKTISKA skeppningsklara
   värdena/axelnamnen språkverifieras av Haiku ("är detta naturlig svenska?") —
   fångar kategoriskt det heuristiken missar (VERSAL-engelska som "STRIPED",
   exotiska AE-former). Cachat verdikt per slutvärde (30 d TTL, ≈$0), fail-open
   (transient fel cachas ALDRIG som "ok"), flaggade värden → samma poleringskö +
   kö-badge som listar dem ordagrant.
5. **Färg-grinden** (deterministisk, $0, `nonColorValuesOnColorAxis` i
   `color-match.ts`): svenskhets-grinden godkänner varje äkta svenskt ord — även
   när betydelsen är fel. En röd bil skeppades som färgen **"Nät"** (2026-08-08);
   ordet är invändningsfri svenska och passerade. Oöversatt spanska utan engelska
   tokens ("Naranja") blir dessutom aldrig AI-kandidat. Grinden tittar därför på de
   SLUTGILTIGA värdena per axel: på en axel vars värden i majoritet är färger
   (`isColorAxis`) flaggas det som varken är färg eller yta. Konservativ — rör inte
   axlar där AE lagt storlekar under "Color", och släpper språkneutrala mått/koder.

Switchen är **`VARIANT_AI_TRANSLATION_ENABLED`** (default `true`), FRIKOPPLAD från
`AI_ENRICHMENT_ENABLED` — variantöversättningen kör alltså även i rå-läget (billig +
cachad). Sätt `=false` för hård $0 på varianter (svansen lämnas då engelsk + flaggas
för polering). Explicit `flags.translateVariants` vinner över env. Beslutspunkt:
`variantAiTranslationEnabled(flags)`. Golden-testet i `variant-translations.test.ts`
låser kända/fäll-fixade översättningar i CI.

### Bulk-läge: AI-berikning PÅ (kostar Anthropic-credits)

När du vill köra en riktig AI-batch:

1. Sätt `AI_ENRICHMENT_ENABLED=true` i Vercel (eller ta bort variabeln — default är på).
2. Kör batch-/bulk-importen.
3. Sätt tillbaka `AI_ENRICHMENT_ENABLED=false` när batchen är klar.

Alternativt, utan att röra env: anropa pipelinen med `flags.enableAI: true` per
import (t.ex. en admin "kör AI-batch"-knapp). **Explicit `flags.enableAI` vinner
alltid över env-flaggan** — `true` tvingar PÅ trots env=false, `false` tvingar AV
trots env=true. Flaggan är default men inte hård (`aiEnrichmentEnabled()`).

### Var det gatas

`aiEnrichmentEnabled(flags)` i `lib/import/pipeline.ts` är enda beslutspunkten.
När AI är av: `runSeo/runImageAnalysis/runCategory/batched` blir alla `false`,
`importProduct` returnerar `needsAiPolish:true`, och `lib/bulk-import/worker.ts`
tvingar realtidsvägen (ingen Batch API-pre-generering som annars kostar).

## En tom cron-tugga ska vara TYST (2026-09-04)

`bulk-import-worker` går **varje minut, dygnet runt** — 1 440 körningar per
dygn, och nästan alla har ingenting att göra. Varje sådan skrev ändå en
`[bulk-import] trigger=cron path=…`-rad, och tillsammans med `health-check`
(var femte minut) stod de två för **~91 % av all loggvolym**.

Det är inte en kostnadsfråga utan en **läsbarhetsfråga**, och huset har redan
skrivit ned regeln två gånger: en logg som till nio tiondelar är brus är en
logg ingen läser — och då är även det äkta felet borta. Samma argument som mot
att varna vid 48 h på token-förnyelsen, och som mot ett rött synk-jobb vid varje
svep.

`runBulkImportWorker` returnerar nu tyst på en tom kö. Två saker att inte röra:

1. **Kollen ligger FÖRE routingbeslutet.** Båda vägarna (realtid och Batch API)
   läser samma kö ur samma store och gör exakt samma tidiga återvändning på en
   tom lista. Tystnad i bara den ena hade varit en tvilling som glider isär.
2. **Cadensen är oförändrad.** Att glesa ut cronen hade varit den uppenbara
   fixen och den fel: varje tick processar tio köposter, så fem minuter mellan
   ticksen gör ett hundraposters jobb fem gånger långsammare.

⚠️ **HALVERAT, INTE BORTA — och den första versionen av det här avsnittet
påstod fel.** Den skrev att fixen tar bort "en routing-rad i Vercel-loggen".
Det gör den inte: routing-raden är VERCELS egen, en per anrop, och den går
inte att tysta från applikationskod. Uppmätt i drift 2026-09-04, samma cron
före och efter deployen:

```
före  (dpl_8FCXMC…, 11:16–11:18)   GET /api/cron/bulk-import-worker 200
                                   [bulk-import] trigger=cron path=batch …
efter (dpl_3jhXDR…, 11:35–11:40)   GET /api/cron/bulk-import-worker 200
```

En tom tugga kostar alltså **en loggrad i stället för två**. Vår rad är borta;
Vercels står kvar och är 1 440 per dygn oavsett vad koden gör.

Vill man åt den återstående raden finns bara två spakar, och ingen av dem är
kod i det här repot: **glesa ut cronen** (avvisat ovan — det gör bulk-importer
flera gånger långsammare) eller **filtrera i Vercels observability/log drain**,
vilket är en inställning i dashboarden. Samma sak gäller `health-check`.

## Aosom: andra leverantören, samma pipeline (`lib/aosom/`)

Sedan 2026-08-27 finns ett B2B-konto hos Aosom och en produktfeed
(`AOSOM_FEED_URL`, uppdateras 3 ggr/dygn).

☠️ **Feedens adress är en hemlighet och får aldrig hårdkodas.** Den kräver ingen
inloggning: en vanlig GET returnerar hela B2B-prislistan med kolumnen
`Wholesale Price` för 6 057 artiklar. Repot är PUBLIKT, så en inbakad adress är
detsamma som att publicera vad vi betalar för varje vara — för de svenska
återförsäljare vi konkurrerar med om exakt samma artikelnummer. Ett test i
`feed.test.ts` fäller om adressen dyker upp i källan igen.

`resolveAosomFeedUrl()` läser två källor i ordning: `AOSOM_FEED_URL` i miljön
(vinner alltid — för en engångskörning), sedan **Wix-raden `FyndplatsAppConfig`**,
som är det normala hemmet. Saknas båda kastar den.

Wix hellre än miljövariabel av två uppmätta skäl (2026-08-27). En miljövariabel
bakas in i deploymenten: den slår inte igenom förrän projektet byggts om, och en
omdeploy som inte blev av ser exakt likadan ut som en som blev det — det kostade
en runda här. Och märkt "Sensitive" går värdet inte att läsa tillbaka ens för
ägaren, så verifiering kräver att hemligheten först roteras. Wix-raden läses vid
varje anrop och går att läsa. Det spelar roll konkret: adressen **ska roteras**
hos Aosom eftersom den legat i en publik gren, och varje rotation hade annars
krävt variabel plus ombygge igen.

Kollektionen skapas med `scripts/ensure-app-config-collection.mjs`. Läsning och
skrivning i `lib/store/app-config.ts` — den KASTAR vid riktigt läsfel i stället
för att falla tillbaka tyst, till skillnad från `getPricingRules`: prissättningen
har vettiga defaults, en feed-adress har inga, och en Wix-nedgång får inte se ut
som "ingen adress konfigurerad". Sortimentet importeras som **osynliga
utkast** och poleras sedan i chatten — exakt samma arbetsflöde som rå-läget
ovan, bara med en annan leverantör i andra änden.

| | |
|---|---:|
| Rader i feeden | 6 057 |
| Går att frakta till Sverige | **5 566** |
| Bilder bakom dem | **50 018** |
| Där frakten kostar mer än varan | 1 175 (21 %) |

Sista talet i tabellen är arkitekturen: varje bild är ett eget Wix-anrop, så
hela svepet är timmar och en serverless-rutt har 300 sekunder.
`/api/cron/aosom-import` tar därför en tugga i taget, returnerar en **markör**
(`cursor` → `?after=`) och kan startas om hur många gånger som helst —
dubblettspärren på `supplierProductId` gör omkörning till en no-op.

### Vägen in

`feed.ts` (hämta + tolka) → `to-product.ts` (adapter) → `importProduct` →
`import-run.ts` (batch + markör) → `/api/cron/aosom-import`.

Adaptern bygger en `AliExpressProduct` av feed-raden. Poängen är att allt
nedströms redan finns: prissättning, marginalregler, bildhemtagning,
Wix-create, SKU:er, mappningsrad, utkastläge, poleringskö. Typnamnet är arv —
den beskriver "en leverantörsprodukt på väg in" och har inget AE-specifikt i sig.

Läget är **alltid `raw`**: noll Claude-anrop ($0) och `visible:false`
ovillkorligt. Torrkörning är default; utan `?dryRun=false` skrivs ingenting.
Rutten är **schemalagd sedan 2026-08-28** (`40 4 * * *`, 60 produkter per natt).

Den låg medvetet oschemalagd fram till dess, med motiveringen att en cron som
fyller poleringskön snabbare än någon hinner skriva om texterna bara ger en
växande hög tyska utkast. **Leonard överröstade det uttryckligen** ("Om nya
produkter kommer ska de automatiskt importeras så sköter jag poleringen") — det
är hans kö att tömma, och ett osynligt utkast kostar ingenting medan det väntar.
Dubblettspärren gör cronen till en no-op när feeden inte har något nytt: den går
gratis förbi allt som redan har en mappning och importerar bara det som saknas.

### Syskonimporten: en sidas familj, utan artikelnummer (2026-09-30)

Leonards fråga: varför är det orange reservtaket inte importerat? Det var det.
Nattens import tog det 2026-09-29 som ett osynligt utkast (`eabb104a`), och det
som saknades var sammanslagningen. Första svaret gissade att `skipFreightHeavy=1`
hade hoppat över raden, utan att någon sökt bland utkasten. **Sök bland utkasten
innan du förklarar varför en färg saknas.**

Verktyget behövs ändå. Nattens import hoppar över rader där frakten kostar mer än
varan (`skipFreightHeavy=1`), och ett lätt och billigt syskon faller ofta där. Att
hämta just en sådan rad krävde artikelnumret i en workflow-input, alltså i en
publik logg.

`/api/cron/aosom-import?syskonTill=<wix-id>` tar i stället en SIDA. Rutten läser
sidans artiklar, hittar feedens färg- och storlekssyskon med syskonsvepets
`jamfor` (`lib/aosom/syskon-import.ts`) och importerar dem som osynliga utkast,
även de frakttunga, eftersom en människa har valt familjen. Workflowen heter
**"Aosom — importera en sidas färg- och storlekssyskon"** (`plan` · `importera`).
Tre egenskaper som inte ska tas bort:

1. ☠️ **Samma vara som EN av sidans artiklar importeras aldrig**, även när den
   är ett färgsyskon till en annan. En sida i brunt och orange ska inte få en
   brun rad till som "ny färg". Två kandidater som är samma vara blir en, den
   med störst saldo. Ett test fällde den första versionen på just det.
2. ☠️ **Svaret bär aldrig artikelnumret.** Ett syskon beskrivs med feedens
   färg, måtten, saldot, status, wix-id och `nattensImportHoppar`, som svarar
   på frågan "varför är den inte importerad?".
3. **`syskonAnkare: 0` är inte "inga syskon".** Då fanns ingen av sidans
   artiklar i feeden (lågt saldo tas bort tillfälligt), och jobbet fäller.

### Så körs den: GitHub Actions, inte en terminal

Workflowen **"Aosom — importera sortimentet som osynliga utkast"** (`workflow_dispatch`,
tre lägen: `torr` · `rökprov` · `svep`). Samma nyckel-lösa upplägg som
prisreparationen: produktionen har Wix-nycklarna, Actions har `CRON_SECRET`, och
de möts i workflowen. Ingen hemlighet passerar chatten eller en terminal — och
därför går hela jobbet att starta från en telefon.

Det löste ett verkligt problem: `CRON_SECRET` är märkt Sensitive i Vercel och går
inte att läsa tillbaka ens för ägaren, så rutten var i praktiken oanropbar för
den som inte redan hade värdet.

Svepet **sparar markören i grenen efter varje varv** (`tools/aosom/sweep-state.json`),
inte i slutet. Dör jobbet mitt i fortsätter nästa körning där den slutade i
stället för att börja om. Jobbet stannar själv efter fem timmar — under GitHubs
sextimmarstak, med marginal nog att hinna committa markören.

`tools/aosom/sweep.sh` finns kvar för den som hellre kör från en terminal och
har `CRON_SECRET` för handen.

### ☠️ Artikelnumret når aldrig en Actions-logg (2026-09-27)

Granskat lokalt, utan att ett enda nummer skrevs ut: **142 publika loggar** bar
Aosoms artikelnummer — 28 av 35 synkkörningar, alla 29 importkörningar, 42 av
53 feedsökningar och 43 av 57 ommappningar. **29 av feedsökningarna bar
dessutom inköpspriset bredvid numret.** Loggarna är raderade. Kanalerna var
fem, och alla är stängda:

| kanal | var | lagning |
|---|---|---|
| hårdkodade nummer i källan | importens `rökprov` | GitHub skriver ut källan i VARJE körning; `rökprov` tar nu `limit=3` |
| markören i varvsraden, summeringen, markörfilen och commitmeddelandet | import, bildfix | rutterna **förseglar** markören (`lib/aosom/markor.ts`, AES-256-GCM, nyckel ur `CRON_SECRET`) |
| `\(.sku)` i utskrifter | synkens prisvarningar och "exempel-artikelnummer", bildfixens fel | Wix-id i stället — `wixProductId` finns i synkens och bildfixens `errors`/`varningar` |
| inputen i env-blocket | synkens `sku`, importens `after`, ommappningens `sku`, feedsökningens `q` | eget steg **"Maskera"** före det steg som läser den |
| numret, Aosom-länken och priset som standard | feedsökningen | bara i kuvertet; `visa_pris` är borttagen |

Fyra egenskaper som inte ska tas bort:

1. ☠️ **Maskeringen ligger i ett EGET steg.** Ett stegs env-block skrivs ut
   innan dess skript kör, så `::add-mask::` i samma steg kommer för sent.
   Värdet läses ur `$GITHUB_EVENT_PATH`, aldrig via `env:` eller `${{ }}`.
2. ☠️ **En förseglad markör som inte går att öppna är 400**, inte "börja om".
   En handskriven markör i klartext tas fortfarande emot.
3. **`redigera()` i workflowerna är sista skyddet, inte det första.** Fritext
   (felkroppar, produktnamn) har ingen form att lita på.
4. ☠️ **gatelibs `ARTNR` missar två former som finns i drift:** tre siffror–tre
   siffror utan svans, och siffra-bokstav-siffra. Den första går inte att
   skilja från ett intervall på formen, så den stängs av kanalreglerna ovan.

Grinden är `lib/workflows/artikelnummer-i-logg.test.ts` — tvilling till
`kostnad-i-logg.test.ts`. Den fäller på ett nummer i en workflow-källa, en
interpolation av ett artikelfält, en utskriven anrops-URL, en markör i ett
commitmeddelande och en artikel-input utan maskeringssteg. Verifierad genom att
återinföra varje gammalt fel: sju av sju fälls, var och en av exakt en regel.

⚠️ **Lagningen biter först när den ligger på `main`** — `workflow_dispatch`
kör `main` som default (se "En OMERGAD gren skyddar ingenting"). Git-historiken
bär fortfarande de gamla numren; den skrivs inte om utan Leonards uttryckliga ja.

### Fyra saker som inte ska tas bort

1. **`supplier: "aosom"` på mappningen.** Lagersynken, prisbevakningen,
   prisreparationen, fraktkontrollen och recensionshämtningen slår alla upp
   `supplierProductId` mot AliExpress API. Ett Aosom-artikelnummer skickat dit
   är 5 566 omöjliga uppslag per körning som äter `maxApiCalls` och tränger
   undan de produkter som faktiskt behöver synkas. Spärren är
   `isAliExpressMapping` i `lib/store/supplier.ts` — en grep hittar alla
   ställen som bryr sig. Fältet faller tillbaka på `aosom:`-prefixet i id:t, så
   en rad som tappat fältet klassas ändå rätt.

   ☠️ **Spärren är sedan 2026-08-28 en TYP, inte en vana** (`AliExpressProductId`
   i `lib/aliexpress/product-id.ts`). `getProduct`, `getInventory`,
   `queryFreightToCountry` och `debugRawProductGet` tar inte längre en `string`,
   och den enda vägen från en mappningsrad heter `aliExpressIdOf(mapping)` —
   den returnerar `null` för Aosom. Typen är erased vid körning: id:t ÄR
   strängen, så loggning, jämförelser och Map-nycklar är oförändrade.

   Skälet står i mätningen. `/api/aliexpress/sync-all` hade tappat spärren och
   gjorde **4 432 omöjliga uppslag per körning**; rutten NOLLAR dessutom lagret
   vid `offline`, så en felklassad rad kunde tömma en Aosom-produkt. När typen
   infördes föll **två vägar till** ut som kompileringsfel, båda oupptäckta:
   variantreparationen i `/admin/mappings` (en Aosom-rad hade legat kvar i
   `broken` körning efter körning) och två order-åtgärder i `/admin`
   (prisavstämningen och fraktdiagnosen på en kundorder — en kund kan lika gärna
   ha köpt en Aosom-vara).

   Det är hela argumentet: **en spärr man måste komma ihåg glöms bort.** Sju
   vägar, sex rätt, och de tre felen syntes aldrig i något svar. För id som
   kommer från AliExpress själv (en klistrad URL, en sökträff, tilläggets
   skrapade sida) finns `aliExpressIdFromListing` — använd den ALDRIG på
   `mapping.supplierProductId`.
2. **Frakten ligger i inköpspriset, och momsen bruttas på.** Det är hela
   skillnaden mot AliExpress, där EU-lagerpriset är levererat. Aosoms SE-frakt är
   **per kolli** och skalar med vikten (16 € under två kilo, över 100 € över
   fyrtio). Adaptern räknar
   `costUsd = (grossist + SE-frakt) × eurToSek × 1,25 / usdToSek`.

   ☠️ **Uppbruttningen är inte kosmetisk.** `landedCostSek` lagras enligt husets
   konvention INKLUSIVE moms — auktionens golvbud delar med 1,25 innan det
   räknar (`lib/auction/seed.ts#netSupplierCost`), eftersom momsen aldrig är en
   verklig kostnad för ett momsregistrerat företag. Aosoms B2B-fakturor är
   NETTO (omvänd skattskyldighet); sparas beloppet rakt av hamnar ett nettotal i
   ett fält som läses som brutto, golvbudet blir 20 % för lågt och auktionen kan
   sälja UNDER inköp. Samma fälla gäller AliExpress-köp gjorda på Business
   Purpose, som också faktureras netto.

   ✅ **Lagat 2026-08-29.** `computeProfit` momsade av intäkten men drog
   `landedCostSek` rakt av, trots att fältet är lagrat INKLUSIVE moms —
   lönsamhetsöversikten underskattade vinsten med 25 % av inköpet. Bäddsoffan
   `efaa0c7b` rapporterades som **−112 kr och −4 % marginal** där verkligheten
   är **+475 kr och +16,8 %**. `SUPPLIER_VAT_RATE` och `netSupplierCost` bor nu
   i `lib/import/pricing.ts` och `lib/auction/seed.ts` ÄRVER dem, så de två
   vägarna inte kan bli oense igen. Testerna som kodade in felet är omskrivna.
3. **En rad = en produkt.** `Psin` ser ut som en föräldranyckel men grupperar
   *relaterade varor*: de tretton raderna under `24G58OVN9S001` är tretton olika
   valphagar med olika antal paneler och priser från 55 till 119 €. Grupperar
   man på den blir varianter av produkter som inte är utbytbara.
4. **Markören flyttas även vid fel.** Annars fastnar hela svepet på en trasig
   rad: nästa körning börjar om på samma produkt, misslyckas igen, och katalogen
   står stilla. Felet står i svarets `errors` och körs om riktat med `?sku=`.

## Aosom-synken: ett anrop ger hela sanningen (`lib/aosom/sync.ts`)

Lager och pris speglas av `/api/cron/aosom-sync`. Lagret körs `20 */6 * * *`
(`skipPrices=1`, rotation `lager`) och priserna `20 3,9,15,21 * * *` (rotation
`pris`) sedan 2026-10-13 — se *Synken nådde aldrig svansen* nedan.

Den är byggd tvärtemot AliExpress-synken, och skälet är strukturellt. AE måste
ringa DS-API:t **en gång per produkt**, lever under `maxApiCalls` och roterar
därför genom katalogen — ett varv tar ~20 timmar, och därav hela strike-mekaniken.
Aosom är **ett enda HTTP-anrop** som ger alla 6 057 rader med saldo och pris.
Ingen budget, ingen rotation, inga strikes: varje körning ser allt samtidigt.

Det gör problemet mindre men flyttar risken. När en körning kan röra hela
sortimentet är en trasig feed farligare än en trasig produkt — därför ligger
spärrarna mot MASSFEL, inte mot enskilda fel.

### Sex egenskaper som inte ska tas bort

1. ☠️ **`MIN_FEED_RADER` kastar.** Ger feeden färre än 2 000 rader avbryts
   körningen. En halvhämtad CSV får aldrig tolkas som att lagret tagit slut —
   det är skillnaden mot AE, där ett fel bara kan nolla en produkt.
2. ☠️ **En rad som försvinner är INTE utgången.** Aosoms B2B-guide, ordagrant:
   *"Items with low stock may be temporarily removed to avoid overselling."*
   Raden är ett lagerbesked. Rätt svar är att nolla saldot och låta sidan ligga
   kvar; nästa körning där raden är tillbaka återställer saldot av sig själv.
3. **`LAGER_BUFFERT = 0`** sedan 2026-10-06 (Leonard: *"ta bort den där 1 kvar
   bufferten"*); 1 från 2026-10-01, 3 dessförinnan. Har Aosom 1 kvar visar vi 1.
   ⚠️ Accepterad risk: feeden uppdateras tre gånger per dygn, så Aosom kan ha
   sålt sin sista enhet till någon annan innan nästa synk. Då får ordern
   avbokas. ☠️ **Ta aldrig bort `medSaldaAvdragna`**, som drar av det vi sålt
   tills Aosoms flöde visar det (se *En stämpel som ljuger rättas mot
   butiken*). Det är den, inte bufferten, som hindrar att samma enhet säljs två
   gånger.
4. **`limit` tar av SKRIVNINGAR, inte av granskningar.** En redan synkad
   produkt kostar noll Wix-anrop. ☠️ Att cronen därmed skulle konvergera UTAN
   sparad markör höll inte (2026-10-13): Aosoms saldon rör sig hela tiden, så
   huvudet av katalogen blev aldrig klart och svansen nåddes aldrig. De
   schemalagda körningarna sparar sedan dess var de slutade (`?rotation=`).
5. **`MAX_PRISANDRING_PCT = 40`.** Prissynken är tvåvägs och helautomatisk
   (Leonards beslut 2026-08-28: "synka oavsett om det går upp eller ner"), men
   en frakt som råkat bli 0 eller ett grossistpris med fel decimal får inte nå
   kund. Över taket skrivs ingenting och raden hamnar i `varningar`.

   **Ett känt hopp kan godkännas för en körning** (`godkannPrisandring`, sedan
   2026-09-30). Workflowens input `godkann_pris` tar Wix-produkt-id, och för
   dem släpps bara taket: regelpriset, golvet, prislåset och skrivordningen
   gäller som vanligt. Godkännandet sparas ingenstans, så nästa trasiga
   feed-rad på samma produkt stoppas igen. Hoppen står i `godkandaHopp` med
   wix-id och belopp, aldrig artikelnummer. Byggt för gunghästens rosa, som
   taket stoppade vid varje körning (1 199 → 699 kr, Leonards beslut).
6. ☠️ **Facit för priset är BUTIKEN, inte mappningen** (`jamforelsePris`,
   sedan 2026-09-02). Mappningens `grossSek` är vad vi TROR att kunden ser;
   Wix är vad kunden faktiskt ser, och en trasig skrivning får de två att glida
   isär permanent — se avsnittet nedan. Butikens priser läses i bulk FÖRE
   loopen (`listV3ProductPrices`, 100 produkter per anrop) och samma
   massfel-spärr gäller som för feeden: färre än `MIN_WIX_PRODUKTER` (500)
   produkter är ett LÄSFEL och kastar, för en tom prislista hade sett ut som
   "alla priser har ändrats" och skrivit om hela katalogen.

Wix skrivs före mappningen, samma ordning och samma skäl som `price-repair`.
Alla tre kostnadsfälten skrivs — `grossSek`, `costUsd` och `landedCostSek` —
aldrig bara priset.

### ☠️ Lagerskrivningen sprang ihjäl sig mot Wix edge-spärr (2026-09-02)

Hittad genom att KÖRA synken skarpt, inte av ett larm. Torrkörningen kan inte
se det här — den skriver aldrig, så den vet inte vilka skrivningar som skulle
falla.

| försökta lagerskrivningar | fel |
|---:|---:|
| 40 | **0** |
| 1 150 | **521** |
| 2 095 | **1 190** |

Alla fel är `429` med en **HTML-kropp**, alltså Wix EDGE-spärr och inte
API-nivåns JSON-fel — samma tvåa som media-städningen redan mätt upp
(2026-08-28). Skillnaden mot media-städningen är att synken inte hade
NÅGONTING: ingen paus, inget återförsök. Den skrev ett `bulk-update-inventory`
per produkt så fort den kunde, och Wix kapade efter ~600.

Två lagningar, och den andra är den som biter:

1. **Återförsök med backoff** i `bulkUpdateInventoryQuantities` (1/3/8 s, följer
   `Retry-After`). Fångar API-nivåns 429, 5xx och nätverksfel. ☠️ `wixHeaders()`
   ligger UTANFÖR loopen — ett saknat token är inte övergående, och inuti
   try-blocket gjordes det om fyra gånger och rapporterades som "nätverksfel".
   Ett test fångade just det.
2. ☠️ **Pacing (`AOSOM_WRITE_DELAY_MS`, default 120 ms).** Det är den här som
   håller edge-spärren borta, för den går enligt husets egen mätning **inte att
   vänta ut** inom ruttens 300 sekunder. Samma medicin som
   `MEDIA_UPLOAD_DELAY_MS` och `FREIGHT_CALL_DELAY_MS`: den billigaste kuren mot
   en strypning som utlöses av tempo är att inte springa.

☠️ **Och felet var osynligt i audit-raden.** `misslyckade` stod inte i den, och
raden skrevs bara när något LYCKADES — så en körning som inte kunde skriva
någonting alls såg ut exakt som en körning där allt redan stämde. Rutten svarar
dessutom 200. Nionde gången samma lärdom: ett svar utan fel är inget kvitto.

**Verifierat i drift samma dag**, i den ordning som gör talen meningsfulla:

| körning | lager skrivna | priser | fel |
|---|---:|---:|---:|
| skarpt svep FÖRE pacing | 905 | 17 | **1 190** |
| skarpt svep EFTER pacing | 1 110 | 15 | **1** |
| torrkörning direkt efteråt | **1** | **0** | 0 |

Sista raden är kvittot: 4 514 mappningar granskade, och bara den enda produkt
som föll på en övergående 429 vill fortfarande skrivas. **Noll priser** vill
skrivas — mappningen och butiken är i fas över hela katalogen, vilket är exakt
vad `jamforelsePris` byggdes för.

⚠️ **En hypotes som mätningen slog ihjäl.** Innan felen var kända såg det ut som
att cronen svälter svansen: en torrkörning visade 2 095 väntande lagerskrivningar
och 100 % täthet i de sista varven, vilket pekade på att `limit` alltid förbrukas
i början av artikelnummer-ordningen. Så var det inte. Ryggsäcken var de
MISSLYCKADE skrivningarna — en produkt vars skrivning föll ser ut att "vilja
skrivas" vid varje ny granskning. Med skrivningarna lagade konvergerade katalogen
på fyra varv, och punkt 4 ovan står oemotsagd. Mät innan du bygger om.

⚠️ **Massfel fäller svepet, en enstaka miss varnar.** Både golv (10 st) och andel
(2 %) krävs, samma form som `MASSFEL_ANDEL`/`MASSFEL_GOLV` i migreringens
verdikt. Ett rött jobb vid varje svep — och en övergående 429 av tusen
skrivningar är att vänta — lär mottagaren att sluta läsa, och då är även det
äkta larmet borta. Missen är ändå aldrig tyst: grupperad på orsak i loggen, i
audit-raden och i svaret.

### ✅ Skrivningarna är batchade sedan 2026-09-04 — spärren är irrelevant, inte uthärdlig

Raden ovan stod länge som "kvar som strukturellt": `bulkUpdateInventoryQuantities`
är ett BULK-API som tar en array, men synken anropade den med EN produkt i taget.
Loopen går nu i **tuggor om 50 produkter** (`CHUNK_PRODUKTER`): en läsning och
en skrivning per tugga i stället för två anrop per produkt.

| | före | efter |
|---|---:|---:|
| Wix-anrop per svep (~4 500 mappningar) | ~1 800 | **~180** |
| Anrop i det uppmätta 429-fönstret | 2 095 → 1 190 fel | ryms med marginal |

☠️ **Hela ombyggnaden vilar på EN mätning: bulk-svaret bär radens id.** Uppmätt
mot skarpa Wix, båda utfallen:

```
fel:      {"itemMetadata":{"id":"2f3b…","originalIndex":0,"success":false,
           "error":{"code":"INVALID_REVISION","description":"Outdated revision…"}}}
framgång: {"itemMetadata":{"id":"2f3b…","originalIndex":0,"success":true}}
bulkActionMetadata: {totalSuccesses, totalFailures, undetailedFailures}
```

Attributionen behöver alltså inte lita på ORDNINGEN. Det är avgörande, för
*"Wix före mappningen"* är en garanti **per produkt**: hade svaret varit
aggregerat kunde en enda revisionskonflikt i ett anrop med femtio produkter
antingen ha fällt hela tuggan eller bokförts på fel produkt — tyst, samma klass
som `sku`-förväxlingen. Mätrutten är `/api/admin/wix-inventory-probe`
(workflow-lägena `api-matning` och `api-matning-skriv`); den skriver ingenting
utan `?write=1`, och det den då skriver är samma saldo tillbaka.

Uppmätt samtidigt, och därför inte gissat: `$in` på `productId` fungerar (fem id
gav fem poster mot ett för ett enskilt), läsningens sida är **100**, och
`bulk/inventory-items/update` svarar `200` med ett individuellt utfall per rad
på **20, 50 och 100 rader**. 101 är oprövat — därav `BATCH_LAGERRADER = 100`.

#### ☠️ Och sida TVÅ av samma läsning gick aldrig att hämta (2026-09-13)

Raden ovan mäter sidans STORLEK. Ingen mätte vad som händer när den inte
räcker. `queryInventoryItemsByProductIds` skickade `filter` igen tillsammans
med markören, och `inventory-items/query` avvisar det:

```
400 INVALID_CURSOR: "Sort or filter can not be specified together with cursor"
```

Uppmätt i båda riktningarna på skarpa Wix, SAMMA markör:

| sida två skickad med | svar |
|---|---|
| `filter` + markör | **400 INVALID_CURSOR** |
| bara markören | **200**, och fortsatte på RÄTT produkt |

Att sida två fortsatte på rätt produkt är beviset att **markören bär frågan
själv** — filtret ligger inuti den (base64:en innehåller ordagrant
`productId` och id:t). Att skicka det igen är alltså inte bara onödigt, det
är det som fäller anropet.

⚠️ **Felet var i drift, inte teoretiskt.** Halterneck-linnet `7fce5f84` har
29 färger × storlekar, alltså fler än 100 lagerrader. Synken loggade samma
400 på VARJE körning varannan timme — den produktens lager gick aldrig att
läsa, medan rutten svarade 200 och körningen såg frisk ut. Nionde gången
samma familj.

☠️ **Och testsviten var grön hela tiden.** Pagineringstestet kollar att
markören FLYTTAS, inte att kroppen går att skicka — en grind som mäter fel
sak. Det nya testet fäller när buggen återinförs, och bara det.

☠️ **Formen är INTE gemensam för Wix — städa inte "samma fel" överallt.**
`ecom/v1/orders/search` tar emot `filter` + `sort` + markör utan att klaga
(uppmätt samma dag: sida två gav 200 och rätt nästa order). `fetchOrders`
står därför orörd med flit. Två API-familjer, samma kroppsform, olika svar —
precis som `getProductMedia` MÅSTE begära `MEDIA_ITEMS_INFO` medan
produktpriset kommer med oombedt. **Mät per endpoint.**

**Sex egenskaper som inte ska tas bort:**

1. ☠️ **En mappning skrivs bara för rader Wix uttryckligen bekräftat.**
   `tolkaBulkUtfall` har tre konservativa regler, alla åt samma håll: en
   SKICKAD rad Wix inte nämner är inte bevisat skriven; `undetailedFailures`
   gör HELA anropet oadresserbart; saknat id härleds ur `originalIndex` mot det
   vi faktiskt skickade. Hellre en skrivning för mycket nästa körning än en
   mappning som ljuger.
2. ☠️ **En produkt med FLERA lagerrader skrivs bara om ALLA går igenom.**
   Halvskrivet lager är svårare att upptäcka än orört.
3. ☠️ **`limit` är EXAKT — tuggan kapas mot det som återstår**
   (`min(CHUNK, limit - skrivna)`). En tugga med N produkter kan aldrig ge fler
   än N skrivningar. Utan kapningen hade `limit: 1` skrivit hela första tuggan,
   och `limit` finns för att hålla rutten innanför sina 300 sekunder. Ett test
   på markören fångade just det.
4. ☠️ **`utanLagerrader` räknas, och de produkterna stämplas INTE.** Den gamla
   `setStock` svarade `if (poster.length === 0) return;` — inget fel, ingen
   räknare — och loopen bokförde ändå produkten som synkad, för alltid. Nionde
   gången samma klass: ett svar utan fel är inget kvitto.
5. **Torrkörningen LÄSER lagret.** Den ska säga sanningen om vad en skarp
   körning skulle göra, och `utanLagerrader` går inte att veta utan att titta.
   Läsningar ändrar ingenting.
6. **Pacingen ligger kvar** trots att anropen är ~40 i stället för ~2 000. Den
   kostar fem sekunder på ett helt svep, och den är billigare än att mäta upp
   var den nya gränsen går.

**Verifierat i drift 2026-09-04**, i den ordning som gör talen meningsfulla:

| körning | granskade | lager | priser | fel | varv | tid |
|---|---:|---:|---:|---:|---:|---:|
| torrkörning FÖRE | 4 542 | 676 (skulle) | 0 | 0 | 2 | 2:52 |
| skarpt lagersvep | 4 542 | **677** | — | **0** | 2 | 1:41 |
| torrkörning EFTER | 4 542 | **0** | **0** | **0** | **1** | 1:34 |

Sista raden är kvittot: efter ETT skarpt svep vill ingenting skrivas om. Jämför
med samma katalog 2026-09-02, före batchningen:

| | lager skrivna | fel |
|---|---:|---:|
| skarpt svep FÖRE pacing | 905 | **1 190** |
| skarpt svep EFTER pacing | 1 110 | 1 |
| **skarpt svep, batchat** | **677** | **0** |

`utanLagerrader` är **0** — varenda mappning har lagerrader i Wix, alltså finns
ingen föräldralös katalogdel som tyst bokfördes som synkad av den gamla vägen.

⚠️ **En ny mätning, ingen åtgärd: `lagerDrift`.** Läsningen ser numera butikens
FAKTISKA saldo, och räknar hur många produkter där det skiljer sig från det
mappningen tror att den skrev. Det är exakt samma frågeställning som
`jamforelsePris` byggdes för på PRISET — och där kostade förväxlingen en månad
och tjugo rader. Lagret triggas fortfarande på mappningens tal, alltså har det
samma teoretiska hål. Talet är medvetet bara **mätt**: att byta facit vore en
beteendeändring med hela katalogen som blast-radie, samma dag som loopen byggs
om. Mät först, som huset gjorde med priserna.

☠️ **Och mätningen är gjord: `lagerDrift` är 1 av 4 542** (2026-09-04, samma
tal i tre körningar i rad). Lagret har alltså INTE det hål priserna hade — där
var svaret tjugo rader. Att göra butiken till facit även för lagret är därmed
inte akut, och den enda drivande raden rättas av nästa körning som rör den.
Talet står i loggraden och i workflow-summeringen; går det upp är det ett
besked, inte brus. **Det höll i fyra veckor — se nästa avsnitt.**

### ✅ En stämpel som ljuger rättas mot butiken (2026-09-30)

Hundburen `6297606f` gjorde driften akut. Sammanslagningen (B71 i
`tools/polish-gates/FLAGGADE.md`) stämplade 90 cm (`22f4cf42`) med givarens
saldo, alltså flödets tal. Synken 03:20 hade läst mappningarna innan dess, såg
90 cm som en okänd variant och nollade den i butiken 03:24. Sedan sa stämpeln
"redan skrivet" och butiken 0 — och synken skrev bara när FLÖDET skilde sig
från stämpeln. Varianten hade stått som slutsåld tills Aosoms saldo på
artikeln ändrades. `lagerDrift` räknade den hela tiden: 5 av 4 486 i
torrkörningen 19:5x UTC samma dag.

`motButikensSaldo` (`lib/aosom/sync.ts`) jämför butikens saldo, som körningen
redan läste, med stämpeln. Skiljer de sig åt är stämpeln opålitlig, och
flödets saldo planeras för skrivning även när stämpeln redan säger det. Per
variant på en sammanslagen sida, på radens egna poster på en vanlig rad. Allt
annat står kvar: `LAGER_BUFFERT`, exakt `limit` (rättelserna ryms i tuggan),
alla-eller-ingen per produkt, bekräftelsen per rad (`tolkaBulkUtfall`),
massfelsspärrarna och att torrkörningen läser lagret.

Två nya fält, i svaret, loggraden, audit-raden och workflow-summeringen:
`lagerDriftRattade` — produkter där driften lade till minst en lagerrad, alltså
de extra skrivningarna — och `lagerDriftProdukter`, deras Wix-id. `lagerDrift`
räknar som förut driften när körningen kom, och ska vara noll efter en skarp
körning.

Fyra egenskaper som inte ska tas bort:

1. ☠️ **Ett okänt saldo är ingen drift.** En post utan `quantity` gick inte att
   läsa, och då gäller stämpeln — samma hållning som `aterkomnaLagerrader`.
2. ☠️ **Bara radens EGNA poster räknas på en vanlig rad** (`delaPoster`, samma
   uppdelning som skrivningen). Mätningen läste tidigare `poster[0]`, som kan
   vara en okänd färgs post. En okänd variant nollas ändå och är ingen drift.
3. **En rättelse som föll stämplas inte**, som alla andra skrivningar. Nästa
   körning ser driften igen och försöker på nytt.
4. **En rättelse från 0 är en återkomst.** Bevakarna mejlas som vid varje
   annan återkomst (`aterkomnaLagerrader`), och torrkörningen räknar den.

☠️ **En försäljning räknas också som drift — det är en beteendeändring.** Wix
drar av saldot vid köp, så butiken hamnar under stämpeln, och nästa synk
skriver tillbaka flödets tal. Förut låg avdraget kvar tills Aosoms tal för
artikeln ändrades. Nu skrivs det över vid varje körning tills Aosoms flöde
visar vår order. Regeln skiljer inte en försäljning från en nollning, och ett
test låser det (`en försäljning räknas som drift`).

☠️ **Det som hindrar att samma sista enhet säljs igen är `medSaldaAvdragna`**
(sedan 2026-10-01). Varje orderrad som är såld hos oss men som Aosoms flöde
inte visar än dras av från flödets saldo innan planen jämförs med butiken. Fram
till dess var det `LAGER_BUFFERT` på 3 som skyddade, och det räckte inte:
golvlampan `65ca6f6d` hade 4 hos Aosom, butiken visade 1, order 10056 tog den,
och nästa körning skrev 1 igen. Med avdraget blir samma rad 4 − 1 = 3 (med
bufferten på 1, som gällde fram till 2026-10-06, blev den 2).

Fem egenskaper som inte ska tas bort:

1. ☠️ **Två slags orderrader räknas** (`vantarPaFlodet`): tasks med status
   `pending`, och tasks med status `ordered` i tolv timmar efter att de
   markerats beställda (`orderedAt`, som workflowen "Order — beställd eller
   skickad för hand" sätter). Flödet exporteras tre gånger per dygn, så en nyss
   lagd order syns inte där direkt, och bufferten (0 sedan 2026-10-06) skyddar
   inga beställda enheter. Visar flödet redan ordern dras den av två gånger under
   resten av fönstret, och det är åt det säkra hållet. En `ordered`-rad utan
   `orderedAt` räknas inte.
2. ☠️ **Raderna läses för varje tugga, direkt EFTER butikens lager.** Lästes de
   en gång när körningen startade kunde en försäljning mitt i körningen synas i
   butiken men inte i avdraget, och driften hade lagt tillbaka den. Kvar är
   webhookens sekunder mellan köpet och orderraden.
3. ☠️ **Depen är obligatorisk (`lasSaldaOrderrader`), och ett läsfel stoppar
   tuggans lagerskrivningar**, som när lagret inte går att läsa. Produkterna
   som ville skrivas räknas som misslyckade. En körning utan avdraget hade lagt
   tillbaka varje såld enhet.
4. ☠️ **På en sammanslagen sida dras varje orderrad från sin egen färg**, avgjord
   som beställningsfilen avgör den (`aosomArtikelForTask`). En rad som inte går
   att knyta till en färg dras från ALLA färger.
5. **Avdraget räknas och syns:** `saldaAvdragna` och `saldaAvdragnaProdukter`
   (Wix-id) står i svaret, loggraden, audit-raden och workflow-summeringen. Det
   är ett mått, inget fel, och talet sjunker när ordrarna lagts och syns i
   flödet.

⚠️ **Markera Aosom-ordern beställd när den läggs.** En task som står kvar som
`pending` efter att ordern lagts dras av en gång till när flödet visar ordern.
Sidan visar då en enhet för lite tills tasken markerats beställd eller skickad.

**Verifierat i drift 2026-10-01**, i den ordning körningarna gick:

| körning | tid (UTC) | granskade | lager | sålda avdragna | fel |
|---|---|---:|---:|---:|---:|
| torr, gammal kod (buffert 3) | 01:10–01:13 | 4 484 | 0 | — | 0 |
| torr, ny kod | 01:31–01:53 | 4 484 | 4 076 (skulle) | 0 | 0 |
| skarpt lagersvep (`lager`) | 01:56–01:58 | 4 484 | **4 076** | 0 | **0** |
| torr direkt efteråt | 02:03–02:06 | 4 484 | **0** | 0 | 0 |

Sista raden är kvittot: ett skarpt svep, och sedan vill ingenting skrivas om.
Noll okända varianter, noll tvetydiga och noll lagerdrift i alla tre körningarna
med ny kod. 59 produkter gick från slutsåld till köpbar. Inga restock-mejl gick
och inga föll.

Avdraget blev noll för att ingen Aosom-order väntade (bulkorderns plan: 0 rader).
Golvlampan `65ca6f6d` står därför på **3**, inte på de 2 som räknades fram ovan.
Order 10056 hade markerats beställd innan `orderedAt` fanns, och en sådan rad
räknas inte (punkt 1). Hade flödet ännu inte visat den ordern saknade sidan
buffert fram till nästa export. Luckan försvinner av sig själv: varje order som
markeras beställd från och med nu får sin tidsstämpel.

⚠️ **Racet i B71 lagades på mappningssidan samma kväll** — se nästa avsnitt.
Kvar är Wix-sidan: en körning som planerat ur en rad från före en
sammanslagning kan fortfarande nolla den nya varianten som okänd. Mappningen
behåller nu varianten och dess stämpel, så nästa körning ser driften och
rättar saldot. Kör ändå ingen sammanslagning mellan xx:18 och xx:27 vid
synktimmarna (var tredje timme: 00, 03, 06, 09, 12, 15, 18 och 21 UTC).

**Verifierat i drift 2026-09-30**, i den ordning körningarna gick:

| körning | kod | lager | lagerdrift | rättade | fel |
|---|---|---:|---:|---:|---:|
| torr 19:43 | före | 936 (skulle) | 5 | — | 0 |
| skarp 20:43 | ny från varv 2 | **939** | 6 | **5** | **0** |
| torr 20:54 | ny | **0** | **0** | 0 | 0 |

Den skarpa körningen startades av en annan session (ett godkänt prishopp) och
rättade hundburen, `6297606f`, bland de fem. En läsning direkt i Wix efteråt
gav 90 cm (`22f4cf42`) **122**, `IN_STOCK`, skrivet 20:51:22. Varianten hade
stått på 0 sedan 03:24.

☠️ **En torrkörning som går SAMTIDIGT som en skarp mäter ingenting.** En
torrkörning startad 20:44, en minut efter den skarpa, gav 923 "lagerdrift".
Den hade läst mappningarna innan den skarpa körningen hann stämpla dem, men
butiken efter att den hunnit skrivas. Kolla att ingen annan körning av
workflowen pågår innan du startar en mätning.

### ✅ Stämpeln läggs på den färska raden — synken skriver inte över (2026-09-30)

Synken läser alla mappningar när den startar och sparade tillbaka hela raden
som den såg ut då: `{ ...p.m, … }`. En körning tar minuter, och allt som
skrevs på raden under tiden försvann tyst. Spegeln `4117e161` tappade sin
sammanslagning så 03:20 (B71 i `tools/polish-gates/FLAGGADE.md`), och nästa
sammanslagning vägrades (`behall_har_redan_optioner`). Samma väg kunde ta
tillbaka poleringens SKU och status, ångra en ommappning och återskapa en
raderad rad.

Nu läses raden om strax före stämpeln (`lasMappning` →
`getMappingByWixProductId`), och `stampelPaFarskRad` lägger bara synkens egna
fält på den färska raden: `aosomSyncedQty` och `aosomSyncedAt`, och per variant
`aosomSyncedQty`, `grossSek`, `landedCostSek` och `costUsd`. Varianterna
matchas på Wix-id och artikel, aldrig på plats i listan, så en färg som lagts
till under körningen lämnas orörd.

Fyra egenskaper som inte ska tas bort:

1. ☠️ **Hellre ingen stämpel än en som ljuger.** Har raden raderats, bytt
   artikel, bytt form (vanlig ↔ sammanslagen) eller tappat en variant som
   skulle stämplas, skrivs ingenting. Wix är redan skrivet. Nästa körning läser
   den färska raden och stämplar då, eller rättar driften.
2. ☠️ **Det räknas.** `stampelHoppade` står i svaret, loggraden, audit-raden
   och workflow-summeringen, med skälet i `errors`. Talet ska vara noll utanför
   en sammanslagning eller ommappning.
3. **Depen är obligatorisk**, av samma skäl som `listaRecensionsbilder` i
   media-städningen: en valfri dep glöms av nästa anropare.
4. **Torrkörningen läser inte om raden.** Den stämplar ingenting, så det finns
   inget att skydda.

⚠️ `saveMapping` är fortfarande en villkorslös upsert, så ett fönster på några
millisekunder mellan omläsningen och skrivningen finns kvar. Förut var
fönstret hela körningen.

⚠️ **En överhoppad stämpel efter en PRISskrivning läker inte av sig själv.**
Wix har det nya priset, men mappningens `grossSek`, `landedCostSek` och
`costUsd` står kvar på det gamla. Nästa körning jämför mot butiken, ser samma
pris och skriver inget. Det är samma klass som de tjugo drivande raderna, men
bara för en rad som ändrats mitt i en prisskrivning, och priser skrivs bara
03:20 och vid skarpa körningar för hand. En omkörning hjälper inte, av samma
skäl. Står `stampelHoppade` över noll efter en körning med priser, titta på
produkten i `errors`: mappningens pris kan vara det gamla tills kostnaden
ändras nästa gång.

### Så körs den för hand

Schemalagd i Vercel (se avsnittets början), men workflowen **"Aosom — synka lager och
priser"** (`workflow_dispatch`, lägena `torr` · `skarp` · `lager`) kör den på
begäran — samma nyckel-lösa upplägg som importen och prisreparationen.

Den fanns inte fram till 2026-09-02, och det var en verklig lucka: `CRON_SECRET`
är märkt Sensitive i Vercel och går inte att läsa tillbaka ens för ägaren, så
att verifiera en ändring i synken krävde att man väntade på nästa schemalagda
körning och sedan gissade av en 200:a vad den gjort. Rutten loggar dessutom en
summeringsrad sedan samma dag — Vercel visade annars bara `GET … 200`.

Svepet loopar markören som importen gör, men sparar den INTE i grenen. Det
startar från början och går hela katalogen; de schemalagda körningarnas
sparade markör rörs inte (den följer bara `?rotation=` i skarpt läge).
Massfel fäller jobbet (minst 10 misslyckade och 2 % av skrivningarna), en
enstaka miss varnar — se *Massfel fäller svepet* ovan.

### ☠️ Synken nådde aldrig svansen av katalogen (2026-10-13)

Leonards rapport: order 10088, en smal bokhylla (`bd664764`), såldes för
**749 kr**. Inköpet var exakt feedens tal, och husets regel på det ger
**819 kr**. Marginalen blev ungefär hälften av husets 17 %. Priset stod orört
sedan 2026-09-24.

Två fel, och båda var synliga i loggraden:

1. ☠️ **Priskörningen åt upp sin tidsbudget innan den började.** Priserna per
   variant för de sammanslagna sidorna lästes före loopen, ett GET per sida,
   för HELA katalogen. Kommentaren sa "de är få"; den 2026-10-13 var de ~360.
   Nattens priskörning granskade 550 av 4 938 och stannade på tidsbudget, och
   en torrkörning samma kväll granskade **noll**. Läsningen görs nu per tugga
   (`lasVariantPriserFor`), bara för de sidor som granskas. Ett test fäller den
   gamla vägen.
2. ☠️ **Ingen körning nådde svansen.** Utan sparad markör började varje körning
   om från början. Lagerkörningen skrev 400 saldon i de första ~2 500
   artiklarna och stannade på `limit` fyra gånger om dagen (`2378 kvar`), och
   priskörningen nådde aldrig förbi de första 550.

Lagningen:

- **`?rotation=lager|pris`** (`lib/aosom/sync-markor.ts`, tabellen
  `sync_markor`). En schemalagd körning fortsätter efter förra körningens
  markör och sparar sin egen. Går den hela vägen börjar nästa om.
- **Priserna körs fyra gånger per dygn** (03, 09, 15 och 21 UTC), lagret som
  förut fyra, och båda har `limit=1200`. Tidsbudgeten är det som stoppar.

Fem egenskaper som inte ska tas bort:

1. ☠️ **Bara skarpa körningar flyttar markören.** En torrkörning för hand hade
   annars fått nattens körning att hoppa över det torrkörningen tittade på.
2. ☠️ **En körning som stannar innan första tuggan behåller den gamla markören.**
   Att nollställa den hade skickat nästa körning till början igen, alltså
   samma fel som markören lagar.
3. ☠️ **Ett okänt rotationsnamn är 400.** En felstavning i `vercel.json` hade
   annars tyst gett en körning utan markör.
4. **En markör som inte går att läsa stoppar inte synken.** Lagret är det
   brådskande; körningen börjar från början och loggraden säger det.
5. ☠️ **Markören är ett artikelnummer och skrivs aldrig ut.** Loggraden säger
   bara `fortsatte från sparad markör` eller `började från början`.

⚠️ **Läs `stoppade på` och `kvar` i loggraden.** Båda felen stod där varje
körning (`stoppade på tidsbudget, 4346 kvar`) utan att något larmade. En
priskörning som stannar på tidsbudget med noll granskade är ett fel, inte en
lugn natt.

### ☠️ En levande fyndauktion äger priset (2026-10-13)

Sedan priskörningarna går 09:20 och 15:20 UTC ligger två av dem mitt i
auktionstimmarna (07–19 svensk tid). Auktionen sänker priset ett steg i
timmen, och tick-cronen skriver bara när steget byts. Hade synken skrivit
regelpriset över steget hade det stått kvar till nästa steg, och auktionen
återställer sitt eget listpris när dagen är slut.

`lasAuktionsprodukter` läser produkterna med en auktion i status `live` en
gång per körning, och synken rör inte deras pris. Lagret synkas som vanligt.
`iAuktion` och `iAuktionProdukter` (Wix-id) står i svaret, loggraden,
audit-raden och workflow-summeringen.

Fyra egenskaper som inte ska tas bort:

1. ☠️ **En främjad auktion som inte startat räknas också.** Listpriset lästes
   när den främjades, och ett nytt pris före starten hade gjort startpriset
   till ett annat än det kunden såg dagen före.
2. ☠️ **Går auktionerna inte att läsa skrivs inga priser alls i körningen**,
   men lagret synkas. Felet står i `prislistaFel` och fäller workflow-jobbet.
3. **Spärren ligger före uträkningen**, som `prisLast`, så en produkt i
   auktion hamnar aldrig i `varningar`.
4. **Depen är obligatorisk**, av samma skäl som `lasMappning`.

När auktionen är slut skriver nästa priskörning regelpriset.

### `prisLast`: en rad där synken räknar om men INTE skriver (2026-09-05)

Synken tillämpar husets regel (`1,20 × landedCostSek`, charm99) på varje
Aosom-rad var sjätte timme. Det är rätt för sortimentet i stort — men en rad kan
ha ett pris som satts av något annat än kostnaden.

Fallet som byggde låset: kontorsstolen `f13cd415` såldes som AliExpress-vara på
**1 299 kr**. Leonards regel 2026-09-05 (*"alla ska peka om mot Aosom DE oavsett
om de är billigare eller inte"*) mappade om den till sitt Aosom-artikelnummer, och därmed
gäller Aosom-regeln på raden: nästa synk hade skrivit **1 099 kr**. Sänkningen
kom av att vi bytte LEVERANTÖR, inte av att marknaden rört sig — och kunderna
betalar redan 1 299.

Utan låset finns ingen väg dit. Skriver man priset för hand räknar nästa körning
fram regelpriset igen, ser en skillnad mot butiken och skriver tillbaka. Det ser
ut som om ändringen "inte tog".

`prisLast: true` på mappningsraden. Sätts via `/api/admin/prislas` och
workflowen **"Pris — lås eller lås upp ett pris"** (lägen `las` · `las-upp`) —
samma nyckel-lösa upplägg som resten, alltså körbar från en telefon.

Fem egenskaper som inte ska tas bort:

1. ☠️ **Låset rör BARA priset.** Lagret synkas som vanligt. Att sluta spegla
   saldot hade betytt att vi säljer något vi inte har, och det är ett kundfel
   medan ett oförändrat pris inte är det.
2. ☠️ **Grinden ligger FÖRE uträkningen.** En rad vi ändå inte tänker skriva ska
   inte kunna hamna i `varningar` för ett hopp som aldrig skulle blivit av. Ett
   falsklarm som alltid fyrar lär mottagaren att sluta läsa — samma argument som
   mot att varna vid 48 h på token-förnyelsen.
3. ⚠️ **Låsta rader RÄKNAS, de hoppas inte tyst över.** `prisLasta` står i
   loggraden, audit-raden, svaret och workflow-summeringen. Ett låst pris slutar
   följa kostnaden: stiger Aosoms frakt äts marginalen tyst, så ett lås som
   ingen ser är ett lås som glöms bort. Lås upp när skälet är borta.
4. ☠️ **Rutten skapar ALDRIG en rad** (404 på saknad mappning) och **läser
   tillbaka efter skrivningen** (500 om värdet inte sitter). Nionde gången samma
   lärdom: ett svar utan fel är inget kvitto.
5. ☠️ **`last` har ingen default** — ett utelämnat fält avvisas med 400. Samma
   fälla som GitHubs tomma workflow-input, som publicerade utkast i tolv timmar;
   låset finns just för att någon medvetet sagt att priset ska stå still, och
   att tyst tolka tystnad som "lås upp" är fel riktning att fela åt.

☠️ **Vid låsning stäms böckerna av mot butiken.** Mappningens `grossSek` är vad
vi TROR att kunden ser; Wix är vad kunden faktiskt ser. Synken håller normalt de
två i fas — och i exakt den sekund låset sätts slutar den göra det, så en
skillnad som finns då blir PERMANENT. Samma förväxling som `jamforelsePris`
byggdes för, i ett nytt hörn.

Konkret på kontorsstolen: ommappningen till Aosom rör aldrig priset (Leonards
beslut), så mappningen bar kvar AliExpress-tidens **879 kr** medan butiken tog
**1 299**. Med ett lås ovanpå det hade lönsamhetsöversikten
(`lib/analytics/profit.ts`) och marginalbanden för alltid räknat 879 mot en
landad kostnad på 900,21 — alltså rapporterat en vara som säljs **med förlust**
när den ger 30 % marginal. Det är en BOKFÖRINGSRÄTTELSE: kundens pris rörs inte,
och `landedCostSek`/`costUsd` rörs inte heller.

Fyra egenskaper i avstämningen:

- **Bara vid LÅSNING.** Vid upplåsning tar synken över och rättar raden själv.
- ☠️ **Tvetydigt butikspris skriver ingenting.** `tolkaProduktPris` svarar `null`
  när varianterna har olika pris; att då falla tillbaka på mappningen hade varit
  exakt buggen `utanWixPris` finns för att undvika.
- ☠️ **En fallen Wix-läsning stoppar inte låset — men syns.** Låset är den
  brådskande halvan; skälet går ut i svaret, audit-raden och workflow-loggen, så
  en utebliven avstämning aldrig kan se ut som en gjord.
- **Alla varianter rättas.** Priset är entydigt i butiken, alltså gäller det var
  och en.

⚠️ **Poleringens prisgrind känner till låset.** Utan det hade den fällt varje
låst Aosom-rad med *"PRISGRINDEN FALLER — kostnaden har ändrats och priset i Wix
är gammalt"*. Rätt RÅD (rör inte priset), fel SKÄL: priset är inte gammalt, det
är valt — och ett rött jobb på ett medvetet beslut är samma falsklarm som
`regelGäller` byggdes för att ta bort. `prisgrind` bär därför `prisLast`, och
workflowen svarar `LÅST PRIS` och går grön. Resten av poleringen (text, bilder,
SKU) är opåverkad.

Verifierat i drift 2026-09-05, samma dag: torrkörning över hela katalogen gav
`4 548 granskade, 1 prislåsta`, och kontorsstolen finns varken bland de
planerade prisskrivningarna eller bland varningarna.

Tjugotre tester, verifierade genom att återinföra buggarna en i taget: synk-
grinden borta fäller fyra, defaulten tillbaka fäller två, 404-grinden borta
fäller ett, återläsningen borta ett, en gissande avstämning ett, en tyst fallen
Wix-läsning ett och en avstämning vid upplåsning ett — rätt test för rätt bugg.

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

### Auditen: driften är 20 rader, inte 1 611 (2026-08-29)

Raden ovan uppskattade skadan ur ett stickprov på sex. Det höll inte som mått —
hela katalogen är nu jämförd rad för rad, mappningens `grossSek` mot Wix faktiska
pris, och två oberoende mätningar ger samma tal:

| | |
|---|---:|
| Aosom-mappningar | 4 445 |
| Stämmer exakt mot Wix | **4 425** |
| **Drivit isär** | **20** |
| Summan av `prisUppdaterade` i audit-loggens fem körningar | **20** (11+4+1+2+2) |

Att de två talen möts är kvittot: varje drivande rad räknas exakt en gång, för
nästa körning ser mappningens nya tal och hoppar över den.

☠️ **Alla 20 är `visible:false`** — opolerade utkast som svarar 404 och inte ligger
i sitemapen. **Ingen kund har sett ett fel pris**, och auktionen kan inte gå på en
opublicerad produkt. Ingen av de tre där Wix ligger LÄGRE än mappningen säljs under
inköp (tunnast är `ad390a36` på 10,9 % mot husets 17 %). De övriga sjutton är för
DYRA i butiken — det kostar sålda varor, inte pengar.

**Skadan är alltså inte akut. Fällan är publiceringen:** poleringen säger uttryckligen
"rör inte priset", så den som polerar en av de tjugo publicerar det gamla priset utan
att märka något.

**Skrivfixen biter.** Kontrollerat mot skarpa Wix på alla 4 445 mappningar: varenda
en bär både `wixVariantId` och ett Wix-`sku` (`FP-…`), och noll rader bär feedens
artikelnummer i variantens `sku`-fält. Reproducerad matchning på 25 produkter: 25
skulle skriva, noll skulle falla.

⚠️ **Kostnadsargumentet mot att jämföra med Wix var fel**, och det var det som höll
de tjugo kvar. Raden påstod att en sådan jämförelse kostar "ett Wix-anrop per granskad
produkt". Det gör den inte: `POST /stores/v3/products/query` ger **100 produkter med
pris per anrop** — hela katalogen på 5 397 produkter är 54 anrop, ett par sekunder av
ruttens 240. `limit`-resonemanget i punkt 4 föll alltså INTE, och jämförelsen är
byggd sedan 2026-09-02 (`listV3ProductPrices` → `jamforelsePris`). De tjugo rättas
av nästa körning, utan engångsavstämning — en sådan hade dessutom bara skrivit
priset EN gång och lämnat orsaken kvar.

☠️ **Priset per variant kommer med i standardprojektionen — begär inte `fields`.**
Uppmätt mot skarpa V3 2026-09-02: `actualPriceRange.minValue/maxValue` och
`variantSummary.variantCount` ligger i svaret utan att efterfrågas.

☠️ **Och frågan ställs UTAN synlighetsvillkor, med flit.** Alla tjugo är
`visible:false` — en fråga som tyst filtrerat bort utkast hade gett en fix som
aldrig når det den skulle laga. Mätt samma dag: utkastet `3a6988b8` returneras
med `visible:false` och pris ifyllt av en fråga som inte nämner synlighet alls.
V3 lägger alltså inte på något implicit `visible:true`. Lägg inte till ett. Det är motsatsen
till `getProductMedia`, som MÅSTE begära `MEDIA_ITEMS_INFO` för att få sina bilder —
och den asymmetrin är just varför båda är mätta i stället för antagna.

**Regeln, sjunde gången: ett svar utan fel är inget kvitto.** Och de två nya:
**två fält som heter `sku` men betyder olika saker ska inte ha samma typ** — och
**ett stickprov är ingen skadeuppskattning.** Sex rader sa "litet"; hela katalogen
sa "tjugo, och inga av dem syns". Det är skillnaden mellan en oro och ett beslut.

### ☠️ En `variantsInfo`-PATCH PUBLICERAR ett utkast

Uppmätt mot skarpa V3 2026-08-28 på ett osynligt Aosom-utkast: en PATCH med
`fieldMask: ["variantsInfo"]` och **oförändrat pris** tog produkten från
`visible:false` till `visible:true`. Fältmasken skyddar alltså inte synligheten —
Wix behandlar en variantskrivning som en publicering.

Konsekvensen var inte teoretisk. `updateV3VariantPrices` skickade inte med
`visible`, och `price-repair` filtrerar inte på synlighet. Med 2 700+ opolerade
tyska utkast i katalogen hade en enda prisreparation kunnat lägga ut dem på
sajten. Funktionen skickar nu alltid tillbaka `visible` oförändrad; saknas
fältet i svaret utelämnas det hellre än gissas. Fem tester i `v3-prices.test.ts`
låser det.

#### ☠️ VARIANTEN HAR ETT EGET `visible` — och 31 sidor gick inte att köpa (2026-09-06)

Regeln ovan gäller PRODUKTEN. Varje variant i `variantsInfo.variants[]` bär ett
eget `visible`, och en variantsInfo-PATCH som inte bär det nollställer det. Samma
fälla, en nivå ner — och den här riktningen är dyrare, för den syns inte i något
utkast: produkten ligger kvar publicerad.

Uppmätt på hela den publicerade katalogen (2 032 produkter, fyra slices, 100 %
täckning): **31 sidor var publicerade men oköpbara.** Noll delvis dolda.

```
produkt   visible: true            → sidan ligger ute, i sitemapen, indexerad
variant   visible: false           → butiken visar "Slutsåld"
Wix-lager quantity: 197, IN_STOCK  → varan finns
```

Butiken behandlar en produkt utan en enda synlig variant som slutsåld: sidan
renderade *"Varan är tillfälligt slut hos oss"* och JSON-LD `OutOfStock` medan
lagret var fullt. Alla 31 var fåtöljer och madrasser ur poleringsrundor.

⚠️ **Och det är INTE repots kod som tappar fältet — båda skrivarna är
kontrollerade och gör rätt.** `createProduct` sätter `visible: v.visible ?? true`,
och `updateV3VariantPrices` muterar varianterna från sin EGEN GET, så fältet
följer med. Defekten sitter i poleringens SKU-steg, som skrivs **för hand från
chatten**: mappningsradens SKU går via `/api/admin/mapping`, men Wix-variantens
SKU har ingen egen rutt, så den PATCHas med ett handbyggt variantobjekt. Utelämnar
man `visible` där defaultar Wix det till `false`.

☠️ **Regeln för den som skriver `variantsInfo` för hand: bygg aldrig
variantobjektet från grunden.** Läs produkten, ta variantobjektet som det står
och ändra bara fältet du menar — precis som `updateV3VariantPrices` gör. Ett
handbyggt objekt tappar tyst varje fält du inte råkade tänka på, och `visible`
är det dyraste av dem.

☠️ **Och produktens `inventory.availabilityStatus` sa `IN_STOCK` hela tiden.**
Wix egen produktnivå vet ingenting om det här; frågar man den ser katalogen
frisk ut. Det enda som avslöjar det är `variantsInfo.variants[].visible` —
och det fältet finns **inte i sökprojektionen**, så en katalogskanning kräver
en GET per produkt. 2 032 GETs ryms inte i ExecuteWixAPI:s 60 sekunder; kör i
slices om ~500.

⚠️ **Två mätfällor på vägen dit, båda värda att komma ihåg.** Butikens ISR gör
att en enstaka hämtning kan servera en gammal rendering — måttet blev
trovärdigt först när `age` var 11 sekunder och sidan FORTFARANDE sa
`OutOfStock`. Och `brodtext`-svepet strippar taggar, så texten "Slutsåld" syns
även när den ligger i dold markup; det som faktiskt skiljer är JSON-LD:ns
`availability`.

Lagningen är att skriva tillbaka `visible: true` på varianten med produktens
`visible` medskickad explicit. Verifierat per rad: 0 → 1 synlig variant,
produktens synlighet oförändrad, **pris och SKU orörda på alla 31**.

#### ☠️ Och en FLERVARIANTSPRODUKT kräver att `options` följer med (2026-09-13)

`updateV3VariantPrices` har fungerat i månader och föll ändå på 56 av 382
produkter första gången den mötte AE-halvan:

```
428 MISSING_OPTIONS_ON_UPDATE_VARIANTS
"Missing product options. Options must be provided for variants"
```

Alla 56 var flervariantsprodukter — bland dem halterneck-linnet med 29 färger.
De enkelvarianta gick igenom.

☠️ **Skälet att felet aldrig setts är husets genomgående asymmetri, och den
gäller mer kod än den här funktionen.** `updateV3VariantPrices` hade bara två
anropare, Aosom-synken och prisreparationen, och **en Aosom-rad ÄR en artikel
med EN variant**. Funktionen var alltså aldrig prövad på det fall där den inte
fungerar. Samma dag föll `jamforelsePris` på exakt samma sak åt andra hållet:
den avvisar varje produkt med `variantCount > 1`, ett gratis bälte-och-hängslen
för Aosom och fel för AE.

**Regeln: kod som bara mötts av Aosom-halvan bär antaganden ingen sett.**
AE-halvan har färg- och storleksvarianter; Aosom-halvan har det aldrig. Innan
en befintlig funktion släpps på AE-rader: fråga vad den gör med fler än en
variant, och mät det.

☠️ **OCH OPTIONS MÅSTE STÅ I FÄLTMASKEN — min första fix var en no-op.** Den
lade dem i KROPPEN men utelämnade dem ur masken, med motiveringen att Wix
behöver options för att VALIDERA varianterna och att en skrivning kunde tappa
det projektionen råkat utelämna. Mätningen var entydig: exakt samma produkter
föll på exakt samma 428. **En fältmask-PATCH läser bara det som står i masken**
— allt annat i kroppen ignoreras, så Wix såg dem aldrig. Resonemanget var
rimligt och fel, och det som avgjorde var att felen var IDENTISKA, inte färre.

✅ **Och farhågan är mätt bort, inte bortresonerad (2026-09-13).** Round-trippen
prövades på en 75-variantsprodukt genom att skriva tillbaka EXAKT samma priser —
samma medicin som `wix-inventory-probe`: en skrivning vars enda ändring är
ingen ändring.

| | före | efter |
|---|---:|---:|
| revision | 24 | **25** (skrivningen tog) |
| optioner | 2 (Färg, Storlek) | 2 (Färg, Storlek) |
| val med `linkedMedia` | 15 | **15** |
| val med `altText` | 15 | **15** |
| varianter / med SKU / synliga | 75 / 75 / 75 | **75 / 75 / 75** |

Noll avvikelser. Samma produkt mättes en gång till efter en SKARP höjning
(499 → 549): fortfarande noll avvikelser mot samma facit. Strukturen tas
oförändrad ur produktens EGEN GET, som redan går med
`?fields=VARIANT_OPTION_CHOICE_NAMES` — projektionen vars hela syfte är att
bära valens namn. Det är samma round-trip-princip som `visible`, inte ett
handbyggt objekt, och det är skillnaden mot fällan i poleringens SKU-steg.

### ☠️ Variantens bild följer bara valet om valen skickas med NAMN (2026-10-03)

Wix räknar själv fram `variantsInfo.variants[].media` ur valets `linkedMedia`,
och fältet är skrivskyddat. Men Wix räknar bara om det när varianterna skickas
med valen angivna **enbart med namn** (`optionChoiceNames`), som Wix egen
redigerare gör. Motorns skrivningar skickar `variantsInfo` ordagrant ur GET:en,
alltså med `optionChoiceIds`, och då står den gamla bilden kvar. Bilderna
kopplas efter att produkten skapats, när variantbilden redan är huvudbilden, så
den fastnade där. **Varukorgen (Cart v2 `lineItems[].image`), kassan och ordern
visade första färgens bild oavsett vald färg.** 566 publicerade produkter
rättades för hand samma dag, med id, SKU, pris, lager, synlighet, bildordning
och kostnad kontrollerade före och efter.

Receptet bor i `lib/wix/variant-media.ts` (`refreshVariantMedia`):
`PATCH /stores/v3/products-with-inventory/{id}` utan fältmask, med `options`
ordagrant, produktens `visible`, och ALLA varianter med `id`, valen bara med
namn, `price` (med `compareAtPrice`), `sku`, `barcode`, `visible`,
`physicalProperties` och `revenueDetails.cost`. Aldrig `inventoryItem` (då rörs
lagret inte) och aldrig variantens `media` (Wix ignorerar den). Förväntad bild =
första bilden i valets `linkedMedia`; flera optioner med bilder → första bilden
i snittet; inga kopplade bilder → huvudbilden. Efter skrivningen läses produkt
och lager om, och minsta avvikelse stoppar.

- **Den anropas efter varje bildkoppling:** `linkChoiceMedia` (importen),
  färgbilderna (`fargbilder-kor.ts`), miljöbilden (`livsbild.ts`) och
  sammanslagningen. Kollapsen (`remap-kollaps.ts`) kopplar inga bilder och
  lämnar en variant utan val, så den har inget att räkna på.
- **Den dagliga kollen** `/api/cron/variantbild?dryRun=false` (05:35 UTC)
  sveper hela katalogen, utkast med. Först läses alla flervariantsprodukter
  (fyra i taget, inget skrivs), sedan rättas de med fel bild en i taget.
  Leonards ja 2026-10-03: "kör den så det fungerar fullt ut". Ett handanrop
  utan `dryRun=false` bara listar.
- ✅ **Utkast är prövade och rättas också** (2026-10-03, utkastet d4118d39):
  efter skrivningen fortfarande `visible: false`, rätt bild, SKU och pris lika,
  lagret orört (antal och revision). Kontrollen fäller en ändrad synlighet.
  `utkast: false` / `?utkast=0` hoppar dem.
- ☠️ **Skrivningen kräver `fields=MERCHANT_DATA`**, annars saknas kostnaden.
  Motorns nyckel fick 403 på den 2026-09-27 (se sammanslagningen). Då skriver
  rättningen ingenting och säger `nyckeln får inte läsa varukostnaden`. Kollen
  behöver inte fältet.
- Skrivningar med `optionChoiceIds` (prissynken, auktionerna, SKU-steget)
  behåller variantbilden, så de bör inte förstöra en rättning.

### Aosom beställs i klump, inte via API (`lib/aosom/bulk-order.ts`)

☠️ **`place-order.ts` är HELT AliExpress och vägrar numera allt annat.** Den
hämtar produkten ur DS-API:t, matchar varianten mot en AE-SKU och lägger ordern
via `aliexpress.ds.order.create`. En Aosom-mappning bär ett artikelnummer i formen "DDD-DDDLL" i exakt
samma fält, så utan grinden hade artikelnumret skickats rakt in i AE:s API — ett
uppslag som aldrig kan träffa, med ett felmeddelande som pekar åt fel håll.
Grinden är `isAliExpressMapping` i `placeOrderForTask`, och meddelandet pekar på
bulkordern så den som ser felet i `/admin` inte börjar leta i AE-loggarna. En rad
UTAN `supplier`-fält räknas fortfarande som AliExpress — annars hade hela den
befintliga katalogen slutat gå att beställa.

Aosoms egen väg kräver inget API. `/api/admin/aosom-order` bygger filen som
`aosom.de/bulkordering` tar emot: **varje rad är en order** — en kundadress med
upp till tjugo artikelnummer. Utan `?format=csv` svarar rutten med planen, så
man ser vad som kommer med innan något laddas upp.

Gränserna är **Aosoms, inte våra** (guiden, avsnitt 5), och en batch som spränger
någon av dem avvisas först efter uppladdningen — därför delas ordrarna i förväg:

| | |
|---|---:|
| Ordrar per omgång | 100 |
| Artikelnummer per rad | 20 |
| Olika artikelnummer per batch | 200 |
| Enheter per batch | 1 000 |

Två egenskaper som inte ska tas bort:

1. ☠️ **En order delas ALDRIG mellan två batchar.** Raden ÄR ordern, med en
   adress och en betalning. Splittad blir det två leveranser, två fraktavgifter
   och en kund som får halva sin beställning. En order som ensam spränger ett tak
   flaggas som `omojlig` och lämnas till en människa.
2. **En kunds rader slås ihop till EN rad.** Kön är radbaserad
   (`taskId` = `${orderId}:${lineItemId}`), Aosoms fil är orderbaserad. Tre rader
   hade blivit tre leveranser med varsin fraktavgift — och frakten är redan den
   dyraste delen av en Aosom-order.

⚠️ **Adresskolumnernas rubriker är inte verifierade.** Guiden anger bara att
kolumn A är artikelnumren och kolumn B antalen; adressfälten beskrivs som "one
customer address" utan namn. Ladda ner deras formulär en gång och rätta
`CSV_KOLUMNER` — datan i raderna är rätt oavsett.

### Resten av vad guiden säger

- **API-integration erbjuds** "after a few months of successful collaboration".
  Fråga Henrik Leseberg när ni har historik.
- **Hämtning på lager** (`Pick Up` i kassan, Neu Wulmstorf och Schwanewede, egna
  fraktkontakter) — det är draget mot fraktproblemet: bort från 84 € per kolli
  till Sverige. Pallutbyte kostar 30 € i adminavgift utan egna pallar.
- Alla ordrar är **förskottsbetalda**, plock 1–4 arbetsdagar. Kan en vara inte
  levereras kommer besked per mejl och pengarna tillbaka — men då har vi redan
  tagit betalt av kunden.

### Vad spärren INTE ser

Dubblettspärren nyckar på `supplierProductId` och fångar varje omkörning. Den
fångar **inte** de ~586 produkter vi redan säljer som är Aosom-varor inköpta via
AliExpress — de bär ett AE-listnings-id och ser för spärren ut som något helt
annat. Att para ihop dem kräver mått, produkttyp och bildjämförelse (så gjordes
de 33 i leverantörsjämförelsen 2026-08-27); en automatisk gissning skulle slå
ihop varor som inte är samma. De dubbletterna hanteras i poleringen, där en
människa ändå läser varje produkt.

#### ☠️ Men AE-listningen bär Aosoms artikelnummer i klartext (2026-09-06)

Raden ovan säger att hopparningen kräver mått, produkttyp och bildjämförelse.
Det stämmer för BILDEN och måtten — men det finns en exakt nyckel som ingen
letat efter, och den ligger i AliExpress egen produktbeskrivning:

```
● material: pu (60% polyurethane, 40% base fabric), foam, mdf, metal
● total measurements: 41x47x92 cm (wxdxh)
● maximum load: 130 kg
● reference: ‹artikelnumret›          ← Aosoms artikelnummer
```

Uppmätt på `1005012777765014` (`ae_item_base_info_dto.detail`, via
`debugRawProductGet`). Aosom skriver alltså sitt eget artikelnummer i den text
de laddar upp till AliExpress. Går fältet att läsa på fler rader blir
ommappningen ett EXAKT uppslag mot feeden i stället för en bildjämförelse —
och `/api/admin/aosom-remap` tar redan emot paret (wix-id, artikelnummer).

⚠️ **Det är EN mätning, inte en regel än.** Nästa steg är billigt och namnges
här så det inte behöver återupptäckas: `freight-check`-workflowen med
`raw=true` tar ett AE-produkt-id och dumpar hela `ds.product.get`; sök
`reference:` i svaret. Håller mönstret över ett tiotal Aosom-ES-listningar är
det värt en grep-baserad extraktion. Håller det inte, är fältet en
bekvämlighet och inte en nyckel — och en ommappning som gissar är precis vad
`MIN_REMAP_MARGIN_PCT` och de sex hindren finns för att stoppa.

☠️ **Numret får ALDRIG följa med in i produkttexten.** Det är samma sträng
dealproffsen.se publicerar som `sku`/`mpn` — se poleringsavsnittet. Det hör
hemma på `supplierProductId` och ingen annanstans.

⚠️ **Och en träff i beskrivningen är inte en träff i feeden.** Barstolen
finns hos aosom.de som KONSUMENTvara (77,90 € inkl. MwSt) men
har **noll träffar i B2B-feedens 6 067 rader** — varken den färgen eller någon
annan färg av samma modell. Aosoms egen guide säger att artiklar med lågt saldo plockas
bort tillfälligt, så frånvaron är ett lagerbesked lika gärna som ett
sortimentsbesked: sök om senare (`aosom-feed-search`, feeden uppdateras 3
ggr/dygn) innan slutsatsen dras.

#### ☠️ Och en TREDJE klass: Aosoms EGEN feed bär samma vara två gånger (2026-09-12)

Raden ovan namnger EN blind fläck — de ~586 AE-inköpta Aosom-varorna. Det finns
två. Aosoms feed har mer än en artikelrad för samma fysiska produkt, och
dubblettspärren nycklar på `supplierProductId`: två artikelnummer är två nycklar,
alltså importeras båda. Spärren gör precis vad den ska och ser ändå ingenting.

Uppmätt på hörnsoffan `69c5e15c` (publicerad) mot utkastet `34341c4f`:

| | behålls | dubbletten |
|---|---:|---:|
| leverantör | **aosom** | **aosom** |
| pris | 8 499 kr | 8 769 kr |
| fraktandel | 0,424 | 0,49 |
| saldo | 101 | 12 |

Att kostnaderna SKILJER är vad som gör klassen svår: två feedrader med olika
grossistpris och olika viktbaserad SE-frakt ser i varje kostnadsjämförelse ut som
två olika varor. Måtten är identiska (242 cm, 198 cm sittbredd, 400 kg), men
måttjämförelsen är redan uppmätt otillräcklig som ensam grund.

☠️ **Facit är BILDERNA, och de är byte-identiska.** Aosom levererar samma
fotofiler för samma artikel, så en md5 räcker — ingen bildlikhet, ingen gissning:

```
huvudbild    385 707 byte   435459f872fa0158   BÅDA
miljöbild  1 068 103 byte   c527549810410717   BÅDA
```

Två av två delade positioner identiska på bitnivå. Detaljbilderna skiljer (olika
positioner hämtades hem), men konstruktionen är densamma på varje foto.

⚠️ **Har sidan vi behåller saldo räcker pensioneringen** (`draftStatus:
"rejected"`, `needsAiPolish: false`), som för hörnsoffan. Husets regel *"äkta
dubbletter mappas om till Aosom"* antog tyst att sidan vi behåller är en AE-rad.

✅ **Är sidans artikel slut medan utkastets finns i lager byter sidan artikel**
(sedan 2026-09-30, Leonards beslut om soptunnan `300a9113`, vars utkast
`43ea33bd` hade 48 i lager). `aosom-remap` tar då en sida som redan är Aosom,
men bara mot ett opolerat Aosom-utkast som bär artikeln: ange utkastet som
dubblett och lämna `sku` tomt. Sidan behåller adress, text, bilder och
recensioner, och utkastet pensioneras. Sidans gamla artikel sparas i
`importSparr`, annars skapar nattens import samma vara igen. Priset rörs inte
av bytet, men synken räknar om det efter den nya artikelns kostnad. Hindren:
`redan_aosom` (ingen sådan dubblett), `dubbletten_inte_utkast` (dubbletten är
polerad), `samma_artikel` och `importsparr_upptagen`.

⚠️ **Klassens STORLEK är omätt — en rad är inte en mätning.** Den billiga vägen
är namngiven här så den inte behöver återupptäckas: Wix filbeskrivare bär ett
`hash`-fält (`lib/wix/media-audit.ts` räknar redan byte-identiska filer med det),
så en gruppering av Aosom-produkter på huvudbildens hash kräver NOLL
bildnedladdningar. Rapporten som finns svarar på "vad kostar dubbletterna i
lagring", inte på "vilka två produkter är samma vara" — det är en ny gruppering
över samma data, inte ett nytt svep.

### Äkta dubbletter mappas om till Aosom (Leonards regel 2026-09-03)

Hittas en äkta dubblett under poleringen — samma fysiska vara som både en
AE-inköpt sida och en feed-importerad — ska sidan vi BEHÅLLER peka om till
Aosoms artikelnummer, och den andra pensioneras. `lib/aosom/remap.ts` +
`/api/admin/aosom-remap`, workflowen **"Dubbletter — mappa om en produkt till
Aosom"** (lägen `plan` · `byt`).

☠️ **Lämna `sku` TOMT och ange Aosom-utkastet som dubblett (2026-09-24).** Rutten
läser då artikelnumret ur utkastets mappningsrad (`väljRemapSku`). Tidigare var
numret en obligatorisk workflow-input och skrevs ut två gånger i den PUBLIKA
loggen, alltså publicerade varje ommappning kopplingen mellan vår sida och
Aosoms nummer. Olika nummer i anropet och på dubbletten vägras.

Ommappningen skriver `supplier`, `supplierProductId`, `sourceUrl`,
`aosomFreightShare` och variantens `costUsd`/`landedCostSek` — **aldrig priset**.
Det är Leonards beslut, och en ommappning som tyst räknade om kundpriset hade
dessutom gjort planen omöjlig att granska: nu står den nya marginalen i planen
och prisändringen blir ett eget beslut.

Sex hinder, och de ska inte tas bort:

1. ☠️ **`MIN_REMAP_MARGIN_PCT = 5`.** Aosoms SE-frakt är per kolli och viktstyrd
   — median 40 % av inköpet, och på 1 283 rader kostar frakten mer än varan. En
   vara som gick ihop mot AE:s levererade EU-lagerpris kan alltså gå med förlust
   hos Aosom vid oförändrat kundpris. Samma tal som `MIN_FAILOVER_MARGIN_PCT`
   och av samma skäl, men egen konstant: talet är en delad avvägning, inte en
   delad sanning.
2. ☠️ **En flervariantssida vägras.** En Aosom-rad ÄR en artikel; alla varianter
   hade pekat på samma nummer och kunden som väljer den andra färgen får fel
   vara hem. Sådana sidor kräver en SKU per variant — ett annat jobb.

   Undantaget sedan 2026-09-28 är `behall_variant` (Leonard: *"radera
   aliexpress varianter som inte finns och behåll den som finns hos aosom"*).
   Då kollapsas sidan först till den variant som finns hos Aosom
   (`lib/aosom/remap-kollaps.ts`), och ommappningen gäller den ensam. Wix
   skrivs först, med varianten ur produktens egen GET, och läses tillbaka.
   Mappningen skrivs bara om kollapsen tog, och en omkörning ser att Wix redan
   är klar. En sida med obehandlade ordrar vägras (`oppna_ordrar`): en order
   på en borttagen färg hade annars beställts som den behållna. Bilderna och
   texten rörs inte.
3. ☠️ **Ett artikelnummer som redan sitter på en annan produkt vägras** — annars
   skapar ommappningen exakt den dubblett den finns för att ta bort.
4. **Rader som inte går att skicka till Sverige vägras** (`isShippableToSe`).
5. **Torrkörning är default**, och det finns **ingen kör-allt-flagga**. Paret
   (wix-id, artikelnummer) är en människas bedömning; listan ÄR kvitteringen.
6. ☠️ **Raden slås ihop, ersätts inte** — och allt som beskrev den gamla
   AE-listningen nollas (`shipsFromCountries`, `hasEuWarehouse`, `supplierName`,
   fraktbarhetsverdikten, `reviewsCheckedAt`). En rad byggd från grunden tappar
   `draftStatus` och försvinner ur `/admin/queue` helt.

Rutten **läser tillbaka raden efter skrivningen** och svarar 500 om den inte bär
det nya artikelnumret. Åttonde gången huset lär sig samma sak: ett svar utan fel
är inget kvitto.

AE-synkens tillstånd (`listingStatus`, strike-räknarna) bor i synkens eget state
per Wix-produkt och överlever bytet. Det är ofarligt just för att spärren är en
TYP: `supplier: "aosom"` gör `isAliExpressMapping` falsk, AE-synken hoppar över
raden och läser aldrig tillståndet igen. Aosom-synken äger raden från nästa varv.

Dubbletten **raderas inte vid ommappningen** — den får `draftStatus: "rejected"`
och `needsAiPolish: false`. En radering går inte att ångra om matchningen visar
sig vara fel, så utkastet ligger kvar i minst fjorton dygn. Därefter raderas det
med ett eget verktyg, se *Pensionerade utkast raderas efter fjorton dygn*. Det
osynliga utkastet syns inte för någon kund, men dess bilder tar plats i Wix.

### Färgsammanslagning: ett utkast blir en FÄRG på en publicerad sida (2026-09-27)

☠️ **Leonards beslut 2026-09-27: alla färger publiceras.** *"har dom olika priser
får dom ha det … är det samma produkt med olika färger ska den finns som olika
alterantiv på samma produkt sida när man sammanslagit dom."* Ett färgsyskon hålls
alltså aldrig tillbaka i väntan på ett beslut, och `FARGSYSKONEN.md` är borttagen.
Varje färg behåller sitt pris. Hur det görs står i runbookens *Dubblettskärmen*.

Leonards fråga: dubblettskärmen hittar utkast som är samma vara som en
publicerad sida i en annan färg — kan de bli ett andra färgval på sidan, med
kopplad bild? Svaret är ja, men bara för att koden först lärt sig att en sida
kan bära **en Aosom-artikel per variant**. Före det läste varje väg radens
artikel för hela sidan, och en sammanslagning hade gett tre dyra fel: synken
hade skrivit den ena färgens saldo på båda (vi säljer en färg Aosom inte har),
beställningsfilen hade beställt fel färg, och importen hade skapat ett nytt
utkast för den andra färgen.

`lib/aosom/artiklar.ts` (`aosomArtikelbild`) är den enda definitionen, med tre
utfall: `en` (radens artikel, **exakt som förut** — varje befintlig rad),
`flera` (en artikel per variant) och `tvetydig` (olika artiklar men inte
entydigt läsbar — då nollas lagret och ordern hålls). Läsarna:

| väg | vad den gör med en sammanslagen sida |
|---|---|
| synken (`lib/aosom/sync.ts`) | saldo och pris PER VARIANT, facit per variant (`getV3VariantPriser`) |
| beställningsfilen (`aosom-order`) | artikeln väljs på orderradens variant-id, sedan SKU, sedan val |
| importens dubblettspärr | ser varianternas artiklar |
| ommappningen | en artikel som sitter som färg är upptagen |
| bildfixen | hoppar över sidan (`sammanslagnaHoppade`) |
| Google-tilläggsfeeden | en rad per färg; grupp och konkurrensläge bara för radens egen artikel |
| poleringens bildsteg | vägrar en lista som tappar en bild ett färgval pekar på |

Sju egenskaper som inte ska tas bort:

1. ☠️ **Orderradens variant-id är NOLLAN för en produkt utan optioner** —
   uppmätt på skarpa ordrar: `catalogReference.options.variantId =
   "00000000-…"`, inte produktens V3-id. Nollan går aldrig att slå upp mot
   mappningen; en order lagd före sammanslagningen matchas därför på SKU.
   Tasken bär `wixVariantId` sedan 2026-09-27.
2. ☠️ **Okända Wix-varianter NOLLAS i synken** (`okandaVarianter`, fäller
   workflow-jobbet även i torrläge). Det är läget efter en halvgjord
   sammanslagning: Wix fick färgen, mappningen gjorde det inte. Den gamla vägen
   hade sålt den nya färgen på den gamla färgens lager. En produkt med EN
   lagerpost skrivs som förut, vad dess id än är.
3. ☠️ **Beställningsfilen håller hela ordern** när en rad inte går att avgöra —
   en halv order är två leveranser och två fraktavgifter.
4. ☠️ **Konkurrentpriset gäller bara radens EGEN artikel.** Det är hämtat för
   den; den andra färgen får husets regel — exakt vad den hade som eget utkast.
5. ☠️ **Sammanslagningen rör inget pris.** Den nya färgen får utkastets pris
   som det står i butiken.
6. ☠️ **Färgen och dess lager skrivs i SAMMA anrop**
   (`products-with-inventory`), så den nya färgen finns aldrig med ett lager vi
   inte satt. Faller skrivningen rullas bilderna tillbaka.
7. **Utkastet pensioneras** (`pensioneraDubblett`) och raderas tidigast fjorton
   dygn senare, se *Pensionerade utkast raderas efter fjorton dygn*. Artikeln
   släpps från dess rad och bor sedan som färg på sidan vi behåller. Bilden som
   blev färgens ligger kvar, för sidan använder samma fil.
8. ☠️ **Varukostnaden tas ur MAPPNINGEN, aldrig ur Wix.** `revenueDetails`
   kommer bara med `fields=MERCHANT_DATA`, som kräver behörigheten
   `SCOPE.STORES.PRODUCT_READ_ADMIN` — saknas den svarar Wix 403 och redan
   planen faller. Båda varianterna får `landedCostSek` som kostnad, samma tal
   importen skriver, och lagret följer varianten: `inventoryItem` bär bara
   `quantity` (schemat har inget id där).

**Så körs den:** workflowen **"Dubbletter — lägg ett utkast som färg eller
storlek på en publicerad sida"** (`plan` · `byt`), rutten `/api/admin/aosom-sammanslagning`,
logiken i `lib/aosom/sammanslagning.ts`. Torrt som default, en sida per
körning, ingen kör-allt-flagga. Två hinder att känna till innan: **sidans namn
får inte bära sidans färg** (`namnet_bar_farg` — skriv om namnet först, med
oförändrad slug). **Sedan 2026-09-30 följer alla givarens bilder med**, med
färgbildsverktygets regler (se *Färgbilderna* nedan): givarens kort stannar,
en opolerad givares bilder från position 2 sparas som `granskas` i stället för
att skrivas, och det som inte ryms under Wix tak (50) sparas i tabellen. Med
`bilder` följer exakt de valda med. Befintliga val behåller hela sina
`linkedMedia`-listor; före det skrev återkopplingen om varje val till sin
första bild. Faller en körning halvvägs ser nästa att Wix redan är klart
(`wix_klar`) och gör bara resten.

⚠️ **Efter första deployen: kör synken i torrläge och läs `okandaVarianter`.**
Talet ska vara noll. Är det inte det finns Aosom-sidor i Wix med varianter
mappningen inte känner till — och de nollas vid nästa skarpa körning.

#### Sammanslagning v2: storlek, fler val och en publicerad givare (2026-09-27)

Leonards fråga efter första sammanslagningen: går det att göra bättre? Verktyget
klarade bara två färger och bara ett utkast in på en publicerad sida. Nu klarar
samma workflow fyra lägen, ett per körning:

| läge | när | vad som skrivs |
|---|---|---|
| `ny` | sidan saknar optioner | optionen skapas med två val |
| `utoka` | sidan är redan sammanslagen | ett val till, befintliga varianter orörda |
| `wix_klar` | en körning föll efter Wix | bara återläsning, mappning och resten |
| `klar` | artikeln sitter redan på sidan | bara givarens efterarbete |

- **Axlar:** `Färg`, `Storlek` eller båda — se nästa avsnitt.
- **Fler val:** kör workflowen en gång per syskon. Sidans värde (`farg_behall`,
  `storlek_behall`) behövs bara första gången en axel läggs till; sedan står
  sidans val i Wix och i mappningen.
- **Publicerad givare** kräver `omdirigera=ja`. Då kopieras givarens recensioner
  till sidan, en 301 skrivs från givarens adress, och givaren avpubliceras och
  pensioneras.

Sex egenskaper som inte ska tas bort:

1. ☠️ **`utoka` tar optionen och varianterna ur GET:en.** Ett handbyggt objekt
   hade tappat valens kopplade bilder och varianternas id — samma regel som
   `visible` och `options` i prissynken. Ett test fäller om id eller bild tappas.
2. ☠️ **Omdirigeringen skrivs FÖRE avpubliceringen.** Butiken läser
   `FyndplatsRedirects` först på 404-vägen, så en rad som skrivs medan givaren
   ligger ute gör ingenting — och i omvänd ordning svarar adressen 404 i
   mellanrummet. Omdirigeringar som redan pekade PÅ givaren pekas om, så ingen
   kedja uppstår.
3. ☠️ **Recensionerna KOPIERAS, originalen rörs inte.** Dolda rader följer inte
   med, och inte heller en recension sidan redan har (samma id eller samma text
   — Aosom visar ibland samma recension på syskonartiklar).
4. ☠️ **En givare med obehandlade ordrar vägras** (`givaren_har_oppna_ordrar`).
   Beställningsfilen läser artikeln ur givarens mappning, och pensioneringen
   släpper den.
5. ☠️ **Priset rörs inte av sammanslagningen — men synken tar över det.** Det
   nya valet följer husets regel från nästa körning. För ett utkast är det vad
   det hade; för en givare med konkurrentpris eller prislås är det inte, och
   planen varnar.
6. **Omdirigeringslistan läses med ett tak** (`MAX_OMDIRIGERINGAR`), eftersom
   `listRedirects` inte sidar. Når listan taket vägrar verktyget hellre än
   missar en kedja.

⚠️ **Utkast som bara har varandra slås ihop EFTER poleringen, inte före.**
Poleringens skrivsteg (`skrivplan.ts`) skriver SKU:n på en sida med en variant.
Polera därför ett av syskonen, publicera det, och lägg sedan de andra som val med
den här workflowen — samma väg som balansbommen.

#### Givarens 301 landar på givarens färg (2026-10-06)

Leonard 2026-10-06: en gammal färgsida ska landa på sin färg på den
sammanslagna sidan, inte på sidans förval. Steg 5b läser sidan efter
Wix-skrivningen och skriver `/produkt/<sida>?variant=<givarens variant>`;
butiken förväljer varianten ur `?variant=`, samma väg som Shopping-flödets
länkar. Äldre rader som pekade på givaren pekas om till samma mål. Planen
visar adressen utan fråga, eftersom variant-id:t finns först efter
skrivningen, och krockkontrollen jämför sökvägen utan fråga (`malUtanFraga`).

De 325 rader som fanns före ändringen rättas med `POST
/api/admin/omdirigeringar-variant` (workflow `omdirigeringar-variant.yml`,
torrt som default). Givarens artikel på den pensionerade mappningen
(`variants[0].supplierVariantId`) matchas mot sidans mappningsvariant och
dess `wixVariantId`, som måste finnas i Wix. ☠️ Allt som inte går att avgöra
exakt lämnas orört och räknas per skäl: raden pekar redan på rätt sida.
Logiken: `lib/aosom/omdirigering-variant.ts`.

#### En sammanslagen sida får ny text med `varianter` i planen (2026-09-30)

Leonards fråga: varför läggs lyftfåtöljens grå färg inte på? Sidan var redan
sammanslagen och texten räknade upp två färger. En tredje färg kräver ny text,
och skrivworkflowen vägrade allt utom en variant, eftersom SKU-steget skriver en
SKU på alla varianter och återläsningen jämför en. Den enda andra vägen var en
PATCH för hand, och all skrivning går via workflowerna.

En produkt i skrivplanen kan nu bära `varianter` (två eller fler) i stället för
`sku` och `variantId`. Rundan anger den i `sammanslagna.tsv`. Tre egenskaper som
inte ska tas bort:

1. ☠️ **SKU-steget rör inte sidan.** Varje färg bär sin egen SKU från
   sammanslagningen. Steget lägger en SKU på alla varianter, så på en
   sammanslagen sida hade alla färger fått samma SKU. Planen vägrar en sådan
   produkt med sku eller variantId.
2. ☠️ **Återläsningen kräver att alla varianter finns kvar och syns.**
   Antalet ska stämma med planen och varenda variant ska vara `visible`. En
   osynlig variant visar färgen som slutsåld (2026-09-06).
3. **Stämpeln skriver inga variantSkus**, bara `needsAiPolish` och
   `draftStatus`.

Bildsteget var redan byggt för det här: det vägrar en lista som tappar en bild
ett färgval pekar på.

#### Färg och storlek på samma sida (2026-09-27)

Leonards fråga: går det att ha färg och storlek på samma sida på en gång? Ja.
Svepet räknade **12 familjer** som skiljer sig på båda (av 679), och butiken
klarade det redan: väljaren för AliExpress-sidorna (headless-site,
`lib/variant-multi.ts`) har två axlar, dämpar en kombination som saknas och byter
till en som finns. Synken, beställningsfilen och feeden läser per variant. Det
som saknades var verktyget.

**Inputs:** givarens värde på varje axel sidan har eller får (`farg_utkast`,
`storlek_utkast`), och sidans värde bara på en axel den får för första gången
(`farg_behall`, `storlek_behall`). `axel` finns inte längre — rutten svarar 400
på den gamla kroppen, eftersom den bar storleken i `fargUtkast`.

| sidan har | givaren anger | resultat |
|---|---|---|
| inga val | färg + storlek (och sidans båda) | två axlar, två varianter |
| färg | färg + storlek (och sidans storlek) | storleksaxeln läggs till, de gamla varianterna får sidans storlek |
| färg + storlek | färg + storlek | en variant till, nya val bara där värdet är nytt |

Sex egenskaper som inte ska tas bort:

1. ☠️ **Alla kombinationer behöver inte finnas.** Wix tillåter färre varianter
   än kombinationer (dokumenterat), och en kombination Aosom inte säljer ska inte
   finnas på sidan. Planen varnar med antalet som saknas (`saknadeKombinationer`).
2. ☠️ **Givarens värde stavas som sidans.** "grå" på en sida med "Grå" är samma
   val. Utan det hade Wix fått ett andra val med samma namn.
3. ☠️ **Färgen bär bilden.** Butiken tar kombinationens bild från färgaxeln när
   den finns (`lib/variant-price.ts`, Leonards regel 2026-08-08). En ny färg får
   givarens huvudbild. En ny storlek i en färg sidan redan har tar ingen bild som
   standard, för den visar samma vara. En storlekssida som får färg behåller
   storlekarnas bilder, och sidans egen färg får ingen, så de gamla varianterna
   fortsätter visa sin storleks bild.
4. ☠️ **Varje befintlig variant kontrolleras på alla axlar** efter skrivningen.
   Bär en variant fel val skrivs ingen mappning, och synken nollar den nya
   varianten tills en omkörning är klar.
5. **Hinder med två axlar:** `saknar_farg_utkast` och `saknar_storlek_utkast`
   (givaren måste ange sitt värde på varje axel sidan har), `saknar_*_behall`
   (en ny axel utan sidans värde), `*_lika` (en ny axel där sidan och givaren
   har samma värde skiljer ingenting åt) och `kombinationen_finns`.
6. **Standard-SKU:n tar storleken före färgen** (`FP-stol-110-cm-gra`).
   Artikelnummerspärren fäller färgen före ett tresiffrigt mått (tre tecken,
   bindestreck, tre siffror), men inte måttet före färgen. Slutar sidans SKU
   på ett ord med tre tecken kan den ändå fällas (`sku_ogiltig`), och då anges
   SKU:n för hand.

   ☠️ **Och Wix tar högst 40 tecken** (`SKU_MAX` i `lib/import/sku.ts`, uppmätt
   i `gate-sku.py`). Sidans SKU plus givarens värden spränger det lätt. Formen
   släppte igenom 93 tecken, så en för lång SKU föll först i `byt`, på en 400
   från Wix, efter att planen sett ren ut. Sedan 2026-09-27 fäller planen den
   (`sku_for_lang`), och SKU:n anges för hand.

☠️ **En färg utan kopplad bild stoppar mappningen (2026-09-27).** Återläsningen
försöker koppla valens bilder åtta gånger. Tidigare varnade den sedan
"kör om för att koppla", men skrev ändå mappningen och pensionerade givaren. Då
hamnade omkörningen i `klar`, som bara gör givarens efterarbete och svarade
"redan sammanslagen — ingenting att göra" medan färgen fortfarande visade fel
foto. Nu returnerar körningen fel innan mappningen skrivs, och omkörningen ser
`wix_klar` och kopplar igen. Runbookens regel om en bild per färg (#667) byggde
på att omkörningen fungerar, och ett test låser det: bilden faller i första
körningen och kopplas i den andra.

☠️ **Wix stavar ett nytt val som den delade listan, och bildkartan måste tåla
det (2026-09-30).** Ett val som redan finns i butikens delade lista sparas med
listans stavning: sidans "Svart och röd" blev "Svart och Röd". Allt annat i
sammanslagningen jämför skiftlägesokänsligt (`lika`), men bildkartan slogs upp
exakt. Valet hittades aldrig, körningen föll på "1 val saknar kopplad bild
efter 8 försök", och omkörningen föll likadant (B69, B87). Kartan slås nu upp
med `bildFor`/`satt`, och två tester låser det: ett där Wix stavar om sidans
färg, och ett där omkörningen efter en fallen koppling räknar valet en gång.

☠️ **Omdirigeringsrutten frågar per adress och läser aldrig hela katalogen
(2026-09-30).** `findRedirectConflicts` behöver veta om en eller två slugs är
synliga produkter, men läste hela katalogen för att få veta det. Att stryka
`PLAIN_DESCRIPTION` (`4a0dd284`) räckte inte: katalogen är 6 311 produkter på
64 sidor, ~1 s per sida, alltså ~63 s bara för läsningen mot ruttens tak på 60.
`redirect-add.yml` dog med 504 två gånger samma kväll på EN rad, som fick
kontrolleras för hand och skrivas med `force`.

Nu ställs en exakt slug-fråga per berörd adress (`slugArSynligProdukt`), med en
kontrollfråga före (`katalogenHarSynligProdukt`). Kvällens rad tar 0,18–0,25 s
mot Wix i stället för ~63. Uppmätt mot skarpa V3 samma dag, och det är därför
frågan ser ut som den gör:

| fråga | svar |
| :-- | :-- |
| `filter: { slug }`, levande slug | 1 träff, `visible: true`, ~0,1 s |
| samma, ett utkasts slug | 1 träff, `visible: false` |
| samma, borttagen slug | `{"products":[],"pagingMetadata":{"count":0,…}}` |
| samma slug i VERSALER | **0 träffar** — filtret är skiftlägeskänsligt |
| okänt filterfält | 400 *"not declared as filterable"* — ignoreras INTE tyst |
| `$startsWith` på slug | avvisas (fältet är en HashedString) |

Fyra egenskaper som inte ska tas bort:

1. ☠️ **"Ingen träff" ÄR godkännandet, så ett trasigt svar får aldrig se ut
   som ett.** Ett svar utan `products`-lista kastar, och en träff med en ANNAN
   slug kastar (då bet filtret inte). Allt som kastar blir en konflikt på varje
   rad, och rutten skriver ingenting.
2. ☠️ **Kontrollfrågan ersätter tom-katalog-spärren.** Med en fråga per adress
   hade en tom eller felkopplad katalog (fel site-id) godkänt varje källa. Den
   frågar efter EN synlig produkt: katalogens första produkt utan filter är ett
   utkast, så en ofiltrerad fråga hade inte bevisat någonting.
3. **Slugen gemenas före frågan.** Det är förlustfritt bara för att Wix slugs är
   gemena: 0 av 6 311 bar en versal. Börjar Wix spara versaler måste det mätas om.
4. **Begränsad samtidighet** (`SAMTIDIGA_SLUGFRAGOR = 4`), och varje adress
   frågas en gång. En rad kostar tre frågor, femtio rader ett par sekunder.

Allt-eller-inget och `force=1` bor i rutten och är oförändrade; de låses sedan
samma dag av `app/api/admin/redirects/route.test.ts`. Verifierat genom att
återinföra buggarna en i taget (obegränsad fan-out, borttagen kontrollfråga,
saknat `visible` som dött, ingen slug-kontroll, rutten som skriver trots
konflikt): rätt test fäller, och bara det.

⚠️ **Wix delar valen över hela butiken, och `lib/wix/limits.ts` är inaktuell om
det.** Kommentaren där säger att en delad option ("customization") tar högst 100
val och att Storlek låg på ~97. Uppmätt 2026-09-27: `Färg` (TEXT_CHOICES) har
**293** val och `Storlek` **203**, och importerna fungerar. Taket på 100 per
delad option gäller alltså inte i dag. Nya storleksvärden tar ändå en plats var i
den delade listan, så välj korta, återanvändbara etiketter där det går.

### Pensionerade utkast raderas efter fjorton dygn (2026-09-28)

Leonards fråga: ska de pensionerade sidorna finnas kvar, eller raderas ur Wix
tillsammans med bilderna som inte används? De ligger kvar i fjorton dygn och
raderas sedan med ett verktyg. Ingenting raderas för hand, varken produkter eller
filer i Media Manager.

Skälet att radera är lagringen. Den 2026-09-28 bar 327 publicerade Aosom-sidor
524 sammanslagna val, och varje givare ligger kvar som ett dolt utkast med sina
bilder. Så länge produkten finns räknar bildstädningen bilderna som använda.
Skälet att vänta är det som stod här förut: en felaktig matchning ska gå att
backa, och fjorton dygn räcker för att den ska synas.

Workflowen **"Dubbletter — radera pensionerade utkast ur Wix"** (`plan` ·
`stampla` · `radera`) → `/api/admin/pensionerade` → `lib/aosom/pensionerade.ts`.
Torrt som default.

| en produkt raderas bara om | skäl |
|---|---|
| raden är en Aosom-rad med `draftStatus: rejected` och inte redan märkt | pensionerad, inte polerad |
| den pensionerades för minst fjorton dygn sedan (`reviewedAt`) | en felmatchning hinner synas |
| produkten är dold, läst färskt ur Wix precis före raderingen | `rejected` betyder inte dold |
| ingen order bär produktens id eller dess SKU | beställningen läser mappningen |
| ingen köad eller pågående auktion gäller den | |
| ingen omdirigering pekar på dess adress | en 301 till en 404 |
| utkastet bär ingen egen artikel, eller dess artikel säljs på en levande sida | annars försvinner varan ur katalogen, och det kräver `egna=ja` |

Nio egenskaper som inte ska tas bort:

1. ☠️ **Mappningsraden raderas aldrig.** Den märks (`wixRaderad`), artikeln
   flyttas till `importSparr` och `supplierProductId` töms. `importSparr` läses
   bara av Aosom-importens dubblettspärr; utan den hade nattens import skapat
   samma utkast igen. Synken, bildfixen, prisjämförelsen och konkurrentpriset
   hoppar över en rad utan artikel, och Google-tilläggsfeeden hoppar över en
   märkt rad.
2. ☠️ **Filerna raderas av bildstädningen, inte här.** Kör `bildstadning-torr`
   och sedan `bildstadning` efter en radering. En färg som slagits ihop delar fil
   med givaren (samma fil-id i båda gallerierna, uppmätt 2026-09-28), och den
   filen ligger kvar så länge sidan använder den.
3. ☠️ **Filerna kontrolleras före och efter varje radering.** Wix dokumentation
   säger inte vad en produktradering gör med filerna. Ligger en fil som var OK
   före inte kvar efteråt stoppas körningen (`filkontroll`), även när ingen annan
   använder filen, för då håller inte antagandet verktyget vilar på. Produkter
   som inte delar någon fil raderas först, så att mätningen är gjord innan en
   delad fil står på spel. `get-files` utelämnar ett okänt id utan fel (uppmätt
   2026-09-28), så bara filer som var OK före räknas.
4. ☠️ **En radering räknas först när en läsning svarar 404.** En obekräftad
   radering märker inte raden, och tre i följd stoppar körningen.
5. ☠️ **Underlaget vägras om svepet kan ha tappat något** (503). Ett svep som
   inte blev klart, färre än 500 produkter eller fler än fem färre än butikens
   räknare. En produkt som saknas i svepet hade sett raderad ut, och en fil vars
   andra användare saknas hade sett ut att bara tillhöra utkastet.
6. **Utan tidsstämpel raderas ingenting.** Poleringens stämpel satte ingen
   `reviewedAt` före 2026-09-28. Läget `stampla` startar klockan på de raderna
   när det körs, och stämpeln sätter tiden sedan dess.
7. ☠️ **Godkännandet är planens antal.** Första varvet kräver `bekrafta` =
   planens exakta antal. Följande varv skickar det som återstod som tak (`hogst`)
   med första varvets klocka (`per`), så planen får krympa men aldrig växa. `per`
   får bara ligga bakåt i tiden, och `hogst` kräver den.
8. ☠️ **Svaret bär bara wix-id och räknare.** Utkastens namn och adresser är
   Aosoms tyska titlar, och loggen är publik.
9. ☠️ **Ett utkast med egen artikel raderas bara med `egna=ja`.** Sammanslagna
   givare och ommappade dubbletter bär ingen artikel längre, för den bor på
   sidan vi behåller. Ett utkast som fortfarande bär en artikel som ingen levande
   sida säljer är något annat: avvisat i kön, en dubblett med eget
   Aosom-nummer, eller ett färgsyskon som parkerades innan sammanslagningen
   fanns. Raderas det försvinner varan ur katalogen, och spärren hindrar att den
   importeras igen. Planen listar dem (`egnaArtiklarIds`). Granska listan och
   kör sedan med `egna=ja`.

   ☠️ **Listan räknas över ALLA pensionerade** (sedan 2026-09-30), även de som
   är för unga eller stoppas av ett annat hinder. Den räknades först bara bland
   de annars raderbara, och då syntes ett utkast med egen artikel först samma
   dag det kunde raderas. `hinder.egenArtikel` räknar fortfarande bara de rader
   där den egna artikeln är det som stoppar, och `aldstaPensionering` gäller
   också alla pensionerade med tidsstämpel, inte bara de raderbara.

10. ☠️ **Ett ja gäller planen en människa läste, och planen växer med tiden**
    (2026-10-14). Åldern räknas mot nu, så en plan som godkändes kvällen
    2026-10-13 (16 raderbara, klockan 20:09 UTC) hade 207 raderbara nästa
    morgon: 191 pensionerade utkast hade passerat fjorton dygn under natten.
    Workflowens input `per` låser klockan till den tid planen räknades
    (`2026-10-13T20:09:16Z`). Rutten räknar då åldern mot den, ger en mindre
    plan och aldrig en större, och `bekrafta` är planens antal vid den
    klockan. Resten väntar på ett eget ja. `per` får bara ligga bakåt i
    tiden, och workflowen vägrar en tid som inte slutar på `Z`.

**Första körningen 2026-09-28.** Planen gav 580 pensionerade: 11 raderbara, 547
för unga, 20 utan tidsstämpel (de fick den samma dag) och 2 synliga. Svepet tog
under en minut. De 11 raderades med noll obekräftade och noll märkningsfel, och
filkontrollen stoppade ingenting. 55 filer lästes före och efter, och alla låg
kvar. **En produktradering i Wix lämnar filerna i Media Manager**, och det är
mätt, inte antaget. Nio av de elva var bevisade dubbletter. Den tionde,
`66cf81fe`, var den beiga kontorsstolen vars svarta syskon `4871d041` är
publicerat, alltså ett färgsyskon som borde ha blivit ett färgval. Det är fallet
punkt 9 finns för, och spärren lades till samma kväll. För den elfte
(`6e7a50cf`, ett bistroset) står inget skäl i rundornas filer.

⚠️ **Bildstädningen läser `WIX_SITE_ID` när den är satt, raderingen läser
butikens sajt.** Pekar de på olika sajter tar städningen inte de filer
raderingen frigör. Svaret säger det i `sammaSajtSomBildstadningen`; läs fältet
vid första körningen.

⚠️ **Planen säger vad som är raderbart i dag** (`raderbara`) och när nästa blir
det (`nastaRaderbar`). Givarna från de första sammanslagningarna 2026-09-27 blir
raderbara 2026-10-11, men en rad som avvisades i kön före 2026-09-14 kan redan
vara det. Ordningen är `plan`, `stampla` om planen har rader utan tidsstämpel,
`radera` och sist bildstädningen. Kör `stampla` så snart verktyget ligger på
`main`, för de raderna blir raderbara fjorton dygn efter att klockan startats.
Både `stampla` och `radera` stannar på en tidsbudget. Säger `stampla` att rader
är `kvar`, kör planen och `stampla` igen med planens nya antal.

### Färgbilderna: varje färg får alla sina bilder (2026-09-30)

Sammanslagningen tog bara givarens första bild. Givaren pensionerades och ligger
kvar dold med sina ~5 bilder, och en tillagd färg visade en bild i butiken.
Torrkörningen 2026-09-30: 516 sidor med givare för 796 tillagda val. Givarna blir
raderbara från 2026-10-11, så bilderna ska flyttas innan dess.

Workflowen **"Bilder — ge varje färg på en sammanslagen sida alla sina bilder"**
(`plan` · `skriv`) → `/api/admin/fargbilder` → `lib/aosom/fargbilder.ts` (ren
logik) och `lib/aosom/fargbilder-kor.ts` (Wix). Torrt som default. `hogst`
(standard 10, högst 50, räknar bara sidor utan hinder) eller `sidor` (wix-id),
`ta_med_granskade` och `tillat_ur_galleriet`.

- **Givaren hittas via filen.** Valets `linkedMedia[0]` ligger i exakt ett dolt
  utkasts galleri. SKU:n går inte att använda, eftersom den nya variantens SKU är
  sidans plus färgen. Två dolda produkter med samma fil ger hindret `flera_givare`.
  Är träffen inte givarens bild 1 blir det en varning.
- **Butikens ägarregler** (headless-site `lib/variant-bilder.ts`, kopierade
  ordagrant). Länkade bilder först. Kort och måttbilder (`arKort`) är gemensamma.
  En olänkad bild som nämner exakt en färg hör till den, och övriga olänkade foton
  hör till huvudbildens färg. En givares egen fil går före alt-texten. Ett foto
  vars färg saknar länkad bild står kvar orört i galleriet. Efter skrivningen är
  varje färgs bilder länkade.
  ⚠️ **Gemensamma kort och måttbilder visas som andra bild under varje färg, även när
  de föreställer värdens färg** (2026-10-22: hundbäddens blå måttbild under Brun,
  agilityhindrets träbågar under Grå, sminkpallens rosa under Vit). Frågan om de ska
  länkas till sin egen färg står hos Leonard (FLAGGADE, lärdom 147). Tills han svarat
  är gemensamma måttbilder standard, och skumklossarnas `d70e483e` måttbild är länkad
  till sin färg som prov. På fåtöljen `41395340` (T91) fick båda färgerna var sin
  måttbild: givarens angav samma tal som sidans text och togs med som sista bild, och
  värdens länkades till värdens färg (FLAGGADE, lärdom 149).
- **Wix 50 och tabellen.** Galleriet får huvudbilden, de gemensamma korten, andra
  axlars bilder, varje redan länkad bild och sedan en bild i taget till den färg
  som har minst. Resten sparas i Postgres-tabellen `fargbilder` (`overflow`), som
  butiken kan läsa via `GET /api/fargbilder?pid=`. Den skapas vid första
  användningen (`FARGBILD_DDL`). Bildstädningen räknar varje fil-id i tabellen
  som använd.
- ☠️ **Taket är 50, uppmätt 2026-10-21 — dokumentationens 15 stämmer inte.**
  Verktyget byggdes på "About Product Media" (15). En dold testprodukt (raderad
  direkt efteråt) fick 16, 20, 25, 30, 40, 46 och 50 bilder, och varje skrivning
  lästes tillbaka i ett eget anrop. Den 51:a gav `400 MAX_SIZE` (*"has size 51,
  expected 50 or less"*, threshold 50). Dessutom höll 86 publicerade sidor redan
  16–46 bilder. Med 15 som tak vägrade verktygen (`over_tak_redan`,
  `galleriet_fullt`) just de sidor som har flest färger, och överskottet
  parkerades i en tabell som butiken ännu inte läser. Talet bor i
  `WIX_MAX_BILDER_PER_PRODUKT` (`lib/wix/limits.ts`) och läses av färgbilderna,
  miljöbilden, sammanslagningen och planernas validering (`skrivplan.ts`,
  `bildplan.ts`). `lib/aosom/bildtak.test.ts` fäller en modul som hårdkodar ett
  eget tal och låser värdet. ⚠️ **Mätt är en PATCH med fältmask `media`.**
  Skapandet (`products-with-inventory`) och bulk-skrivningarna är inte mätta,
  och importen skapar produkter med färre bilder än så. Höj eller sänk talet bara
  efter en ny mätning, som CHOICES-taket i samma fil — där var dokumentationen
  fel åt det farliga hållet, här åt det försiktiga.
- ☠️ **Butiken läser inte tabellen än.** Ett foto som bara står i tabellen syns
  alltså inte. Därför flyttas sidans egna foton aldrig ur galleriet utan
  `tillat_ur_galleriet=ja` (hindret `ur_galleriet_kraver_butiken`). Givarbilder
  som aldrig legat i galleriet sparas i tabellen ändå, de försvinner inte ur
  något.
- **Opolerad givare** (tyskt namn eller tom alt-text): bilder från position 2
  skrivs inte utan `ta_med_granskade=ja` (Leonard granskar dem själv). De sparas
  som `granskas`, så att städningen inte tar filerna, men butiken får dem inte.
  Ett foto som redan ligger i sidans galleri flaggas aldrig, och en bild som
  skrivits en gång granskas inte igen. ⚠️ `ta_med_granskade` når en redan skriven
  sida bara via `sidor`, för urvalet tar bara sidor med givare kvar att flytta.
- **Alt-text:** en svensk behålls. Annars blir den "<sidans namn> i färgen <färg>",
  med ", bild N" från den andra.
- **Hinder:** `ej_publicerad`, `saknar_fargaxel`, `flera_givare`, `ingen_givare`
  (bara med `sidor`), `oppen_auktion` (bara `live`, eftersom kön har en rad per
  produkt), `givare_publicerad`, `over_tak_redan`, `ur_galleriet_kraver_butiken`
  och `plan_ogiltig`.

☠️ **En länkad bild tappas aldrig, och ingen fil försvinner.** Varje bild ett val
pekar på står kvar i galleriet, och varje färgs nya lista börjar med dess
nuvarande (`kontrolleraPlan`). `skriv` kräver `bekrafta` = planens sha256, räknad
om ur färska läsningar. Stegen:

1. **Tabellen skrivs FÖRST**, obekräftad, och läses tillbaka. Stämmer den inte rörs Wix inte.
   Varje fil planen rör står alltså i tabellen innan Wix ändras, och en
   omkörning läser in tabellens rader.
2. Galleriet skrivs ensamt. Bara olänkade foton kan falla ur det.
3. Länkarna skrivs med options och variantsInfo ur GET:en och `visible`. Om
   försöks bara vid 404 `PRODUCT_MEDIA_NOT_EXIST` eller 409, och bara när det
   enda som avviker är länkarna (högst åtta gånger). Varje annat fel stoppar
   direkt, med felet i svaret.
4. Återläsning: galleriet, alt-texterna, varje vals lista, andra axlar,
   synligheten, och varje variants synlighet, pris, SKU och val. En dold
   variant som blivit synlig stoppar också. Vid första avvikelse stannar
   körningen.
5. Först nu sätts `wix_bekraftad_at` på sidans rader.

☠️ **Rader utan `wix_bekraftad_at` betyder en halvskriven sida.** Tabellen
skrevs i steg 1 men Wix föll därefter. Urvalet räknar bara bekräftade rader som
skrivna, så en halvskriven sida väljs igen av `hogst` även när den inte har
någon givare kvar. Planen räknar dem i `summa.halvskrivna`, och talet ska vara
0 när `kandidaterTotalt` är 0. En ersättning av raderna nollställer
bekräftelsen, och sammanslagningen bekräftar den nya färgens rader först efter
sin egen återläsning.

Ordningen före raderingen: kör `plan` för 10 sidor och titta, sedan `skriv`, och
kör klart alla kandidater (`kandidaterTotalt` ska bli 0) innan
`pensionerade-radera` körs. Det finns ingen spärr i raderingen (Leonards beslut
2026-09-30), men tabellen skyddar filerna mot bildstädningen.

### Bilder bort: också de som ett färgval pekar på (2026-10-14)

Bildplanen och färgbildsverktyget tappar aldrig en bild som ett val pekar på,
eftersom Wix svarar 404 `PRODUCT_MEDIA_NOT_EXIST` när en länkad bild faller ur
galleriet. Det är rätt som regel och lämnade en lucka: cykelkärran `571e37bf`
fick en tysk och en engelsk måttbild med text inbränd i pixlarna när den blå
färgen slogs ihop med sidan. Båda var länkade till Blå, och runbooken förbjuder
att skriva för hand i Wix.

Workflowen **"Bilder — ta bort bilder ur en publicerad sida (också länkade)"**
→ `/api/admin/bilder-bort` → `lib/aosom/bilder-bort.ts`. Torrt som default:
`skarp=ja` kräver `bekrafta` = planens sha, som står i torrkörningens logg.
Fil-id på bilderna läses ur sidans galleri (`GET /stores/v3/products/{id}?fields=MEDIA_ITEMS_INFO`).

Sex egenskaper som inte ska tas bort:

1. ☠️ **Ordningen är omvänd mot färgbildsverktygets.** Valens `linkedMedia`
   skrivs FÖRST utan bilderna (options + variantsInfo ordagrant ur GET:en och
   `visible` med, som i `skrivSida`), galleriet sedan ensamt. Skrivs galleriet
   först svarar Wix 404. Ett test låser det mot en låtsas-Wix som vägrar
   exakt det, och är verifierat genom att hoppa över länksteget: fem tester
   faller.
2. ☠️ **Verktyget väljer aldrig bilder.** Huvudbilden kan inte tas bort, sidan
   får inte hamna under fyra bilder (`MIN_BILDER`, Leonard: "4 är godkänt"),
   och ett val som hade bilder får inte lämnas utan en. Vem som ska ersätta
   en bild är ett beslut för en människa.
3. ☠️ **En körning som föll mellan länkarna och galleriet är ofarlig.** Valen
   pekar på färre bilder och galleriet har alla kvar. En ny plan ser läget
   (valens länkar redan utan bilderna) och gör bara galleriet.
4. ☠️ **Återläsningen jämför allt.** Galleri, alt-texter, varje vals lista,
   synlighet, och varje variants synlighet, pris, SKU och val. Bara galleriet
   och länkarna får vänta på att Wix läsning hinner ikapp; allt annat stoppar.
5. **Variantbilderna följs upp** (`refreshVariantMedia`). Den läser först och
   skriver bara när en variant avviker, och ett val vars första bild är orörd
   ger ingen skrivning.
6. ☠️ **Svaret bär bara wix-id, platser, antal och hinder.** Aldrig alt-texter,
   namn eller sluggar: loggen är publik.

⚠️ Filerna ligger kvar i Media Manager tills bildstädningen tar dem. Så länge
givarens pensionerade utkast finns räknar städningen filen som använd; den
tas först när utkastet raderats (se *Pensionerade utkast raderas efter
fjorton dygn*).

### Färger utan egna bilder på en AliExpress-sida (2026-10-21)

Leonards rapport 2026-10-21: sex sidor hade fortfarande en färg utan egna bilder
(hamsterburen, tältet, tunnelväxthuset, skoskåpet, dieselvärmaren och plåtboden).
Tre av dem hade stått flaggade i runbooken sedan 27 september. Fotot letas upp med
workflowen **"AliExpress — färgbilder per SKU (krypterat)"** (`ae-skubilder.yml`), som
anropar den gamla read-only-rutten `/api/admin/freight-check?raw=1` och svarar
krypterat, som `leverantorslankar.yml`. Den startas av en push som ändrar
`tools/ae-skubilder/kor.json` (`produkter`: högst tio Wix-id, `kuvert`: en publik
RSA-nyckel i base64), och sedan mergen av PR #749 (2026-10-21) också med `workflow_dispatch` från `main`.

Tre egenskaper som inte ska tas bort:

1. ☠️ **Kuvertet är obligatoriskt och loggen bär bara räknare.** Svaret bär
   leverantörens bildadresser, och en bildsökning på dem leder till listningen.
   jq plockar bara ut bilder, egenskapsnamn och -värden, SKU-id, SKU-attribut och
   saldo, aldrig priser, säljare eller fraktuppgifter. Ett fel skrivs som
   statuskod, aldrig som kropp.
2. ☠️ **Hela råsvaret går till en fil och läses bara av jq.** Det passerar aldrig
   en variabel som något kan råka skriva ut, och faller krypteringen faller jobbet
   utan klartext.
3. **Mätt 2026-10-21: bara tältet hade en SKU-bild per färg.** De andra fyra
   listningarna bär färgen som ett egenskapsvärde utan foto, sex galleribilder och
   8–18 beskrivningsbilder, och ingen visar den saknade färgen. Vad man gör med en
   färg utan foto på en publicerad sida står i runbookens avsnitt *Varje färg har
   sin egen bild*: ta bort färgen med bevarat id, inte koppla en annan färgs bild.

### Syskonsvepet: färg, storlek och samma vara i hela sortimentet (2026-09-27)

Leonards fråga: finns det fler färgdubbletter, och storleksdubbletter, alltså
samma artikel i olika storlekar? Poleringen har hittat syskonen ett i taget, med
måttsvep över polerade texter (runda N76). Feeden har svaret
strukturerat: färg, yttermått, material, vikt och paketmått är egna kolumner, och
mappningen säger vilken sida varje rad blev.

Workflowen **"Dubbletter — hitta färg- och storlekssyskon"** →
`/api/admin/aosom-familjer` → `lib/aosom/familjer.ts`. Den skriver ingenting.

| relation | kräver |
|---|---|
| färg | samma mått, paket och vikt, olika färg, samma modellnamn — eller samma klunga, material och kategori |
| samma vara | samma mått, paket och vikt, samma färg, samma modellnamn — eller samma klunga, material och kategori |
| storlek | samma klunga (`Psin`), olika mått, samma färg, material och kategori, samma modellnamn |

"Samma modellnamn" jämförs på feedens tyska namn efter att färgord, siffror,
enheter, storleksord och husmärken skalats bort. Kandidaterna kommer från
`Psin` och från den fysiska signaturen (mått plus paket), som täcker raderna
utan klunga.

Fem egenskaper som inte ska tas bort:

1. ☠️ **`Psin` väljer bara kandidater och avgör ingenting.** Klungan är ingen
   variantgrupp (se `feed.ts`), och en storleksrelation kräver ändå samma
   modellnamn, färg och material. Utan klungan räknas två olika mått inte som
   något alls.
2. ☠️ **Svaret bär aldrig artikelnummer, `Psin`, utkastens tyska namn eller
   kostnader.** Utkastens namn är Aosoms egna titlar, och en sökning på dem leder
   till Aosoms produktsida. Publicerade sidor visar sitt svenska namn, och all
   fritext går genom `redigera`. Ett test serialiserar svaret och letar.
3. **Familjens typ räknas på VÅRA sidors färger och mått**, inte på kanterna. En
   familj kan hålla ihop genom en feedrad vi inte har (`ejHosOss`).
4. ☠️ **Samma massfel-spärrar som synken** (`MIN_FEED_RADER`,
   `MIN_WIX_PRODUKTER`). En halvläst katalog hade fått publicerade sidor att se
   ut som saknade, och svaret hade sett komplett ut.
5. **Listan är ett underlag för en människa.** Varje familj ses med bilderna
   innan något slås ihop. `verktygetIdag` betyder bara att sammanslagningen
   *kan* lägga ett syskon som en ny kombination av färg och storlek på en
   publicerad sida, inte att den ska.

`?par=<id>,<id>` kalibrerar mot par som redan är granskade: svaret säger vad
jämförelsen såg (samma klunga, mått, färg, vikt och namnlikhet) utan att något
nummer skrivs ut.

**Första körningen i produktion (2026-09-27):** 679 familjer över 1 615 sidor
(722 publicerade, 893 utkast). Av dem är 570 färgfamiljer, 87 storleksfamiljer,
12 färg och storlek och 10 samma vara. 225 har en publicerad sida, 243 bara
utkast och 211 flera publicerade. Verktyget klarade minst ett par i 416. Underlag:
6 229 feedrader och 5 223 mappningar. 233 artiklar saknades i feeden, och noll
artiklar satt på två sidor.

☠️ **Kalibreringen mot N76 fann bara ett av åtta granskade par (hopphindren),
och `?par=` visade varför.** Tre skäl, och bara det första går att laga i svepet:

- **Aosom ger färgsyskon olika titlar.** A-hindret i grått och orange och
  agilitybågarna i gult och blått har samma klunga, mått, paket, vikt, material
  och kategori, men namnlikheten är **0 och 0,17**. Därför räcker nu samma klunga
  plus identisk fysik (mått, paket och vikt på båda, material och kategori inte
  olika) för en färg- eller samma-relation, oavsett namn. Utan klunga ligger
  namnkravet kvar. Talen ovan är uppmätta FÖRE lagningen.
- **Fyra av paren har en publicerad sida som är mappad mot AliExpress**
  (klättersetet två gånger, kattlådan och det ena agilitysetet i tre delar).
  Svepet ser bara Aosom-mappningar, och det är den blinda fläcken som står i
  "Vad spärren INTE ser".
- **Det sista paret skiljer sig i feeden:** agilitysetet i tre delar mot utkastet
  har olika klunga, andra mått och 32 % skillnad i vikt. Svepet gör rätt som
  inte slår ihop dem. Paret bör ses om med bilderna.

**Efter lagningen (samma dag, körning 3):** 777 familjer över 1 949 sidor (873
publicerade, 1 076 utkast): 666 färg, 84 storlek, 14 färg och storlek och 13 samma
vara. 277 har en publicerad sida, 254 bara utkast och 246 flera publicerade.
Verktyget klarar minst ett par i 512. Underlaget är detsamma, så skillnaden är
regeln: 96 färgfamiljer till. A-hindret och agilitybågarna står nu som färgfamiljer
med en publicerad sida var, och hopphindren som förut. Regeln är lösare, så varje
ny färgfamilj ses med bilderna innan något slås ihop (punkt 5 ovan).

När ett syskon ska bli ett val står i runbooken (Dubblettskärmen). Verktygets
referens står i **`docs/polish/syskon.md`**: inputs, lägen, arbetsgång, bilder,
hinder och färger som inte kom via verktyget.

### Kan Google se att det är dubbletter? (Leonards fråga 2026-08-27)

Två skilda problem, med olika svar.

**Utkast är osynliga — mätt, inte antaget.** En produkt med `visible:false`
svarar **404** på sin produkt-URL och ligger inte i sitemapen (1 064 `loc` mot
946 synliga produkter). 5 566 tyska utkast kan alltså inte indexeras. Hela
risken ligger i publiceringsögonblicket, inte i importen.

**Vi läcker inga leverantörsspår.** Kontrollmätt på en publicerad sida:
noll träffar på `aliexpress`, `alicdn`, `aosom` eller något husmärke i HTML:en;
alla 230 bilder på `static.wixstatic.com`; JSON-LD:ns `sku` är Wix eget UUID;
inget `mpn`, inget `gtin`. Feedens `EAN`-kolumn är dessutom tom i 100 % av
raderna, så det finns ingen produktidentifierare att joina på. Husmärkena
(HOMCOM, Outsunny, PawHut, Aiyaplay) stryks vid poleringen — bara 6 av 952
produkter bär dem, och alla sex är opolerade utkast.

☠️ **Men den mätningen ser bara HTML:en, och namnet kan ligga i PIXLARNA.**
Uppmätt 2026-09-05 i runda 64: en bild på ett Aosom-utkast bär
**`HOMCOM by Aosom` inbränt uppe till vänster** — husmärket och leverantören i
samma logotyp. En `grep` över källkoden svarar grönt medan kundens öga läser
leverantörens namn, och en logotyp leder till hela deras katalog på samma sätt
som artikelnumret leder till dealproffsens sida.

Stycket ovan är alltså riktigt om HTML:en och ofullständigt om SIDAN. Rundans
Steg 4 granskar sedan dess bildernas övre vänstra hörn; av sexton granskade bar
en logotyp, och den bilden plockades bort. **Hur många av de publicerade
sidorna som bär en är inte mätt** — det är en bildmätning, inte en textmätning,
och den görs i städningen tillsammans med kategoriträdet (Leonards
sekvensering 2026-09-05: polera färdigt först, rätta strukturen sedan).

**Det Google DÄREMOT ser är bilderna.** Att flytta hem dem till wixstatic byter
adress, inte innehåll. Google Images matchar på bildinnehåll, och Aosoms foton
är byte-identiska hos varenda återförsäljare som kör samma feed. Skyddet är
inte hemflytten — det är egna kort och egen text.

**Den farliga dubbletten är intern.** `FyndplatsMappings` har **595 av 1 004
rader** från "byaosom ES (EU) Store" — 59 % av katalogen är redan Aosom-varor,
köpta via AliExpress. Feed-importen kan inte se dem (de bär AE-listnings-id) och
skapar därför en ANDRA sida för samma fysiska produkt. Två egna URL:er med samma
foton är den dubblett Google faktiskt straffar. Fångas i poleringen, inte av
spärren.

### Bilderna: bara position 1, 2, 3, 8 och 9 hämtas hem

**46 % av feedens bilder bär TYSK TEXT INBRÄND i pixlarna** ("HOCHWERTIGES
MATERIAL", "Empfohlenes Alter: 3-8 Jahre"). Den går inte att polera bort och kan
inte visas för en svensk kund. Mätt 2026-08-27 på 30 produkter — tio ur vardera
tredjedel av feeden — och 269 handgranskade bilder:

| pos | rena | vad det är |
|---|---:|---|
| 1 | **30/30** | huvudbild, vit botten |
| 2 | **30/30** | livsstilsbild |
| 3 | 23/30 | måttritning; oftast bara siffror, ibland tysk rubrik |
| 4–6 | 4/90 | tyska funktionsgrafiker |
| 7 | 6/30 | oftast tysk |
| 8 | 24/30 | detaljfoto: material, gångjärn, tyg |
| 9 | 27/29 | detaljfoto |

`RENA_BILDPOSITIONER = [1,2,3,8,9]` i `to-product.ts` räddar **134 av 144 rena
bilder (93 %)** och släpper in 15 tyska (10 % av det som behålls). Att också ta
7 hade gett 97 % rena men 22 % skräp; att kapa vid 3 hade gett bara 58 %.

Mönstret är **oberoende av var i feeden produkten ligger** (49/46/45 % tyska i
början, mitten, slutet) — regeln behöver inte justeras per sortimentsdel.
Tysk text sitter alltså i 3, 8 och 9, men poleringen granskar alla fem: varumärken
på rekvisita sitter i miljöbilden på position 2 (i runda B19 på de flesta), och
position 1 och 2 blir huvudbild och delningsbild. `?bilder=alla` tar hem allt.

Sidoeffekt: importen går från 50 018 till ~27 800 bilder — nästan en halvering
av det som är hela svepets flaskhals.

### De andra positionerna hämtas för granskning (2026-09-30)

Poleringen stryker det som bär tysk text, ett märke eller en logga. Därför stod
222 publicerade sidor med två eller tre bilder den 2026-09-30, 48 av dem med två.
Leonards beslut: sådana sidor ska få fler rena bilder ur leverantörens egen
uppsättning, inte egna kort.

Ingen hade sett position 4–7, och det gick inte att titta. Bildlistan finns bara i
feeden, och Wix minns inte varifrån bilderna kom: filerna på produkterna är Wix
egna kopior, och originalen är bortstädade (uppmätt: `get-files` på kopians
`sourceUrl` svarar med en tom lista).

Workflowen **"Bilder — hämta leverantörens övriga bilder för granskning"** →
`/api/admin/aosom-bildkandidater` → `lib/aosom/bildkandidater.ts` laddar upp de
begärda positionerna (default 4–7) till Media Manager utan att röra produkten.
Svaret ger Wix fil-id och wixstatic-adress per position. En människa tittar på
bilderna, och de rena skrivs med **"Polering — skriv bara bilderna"**
(`bildplan.json` ur `tools/polish-gates/bygg-bildplan.py` →
`/api/admin/polish-bilder` → `lib/polish/bildplan.ts`). Den skriver bara
bildlistan, med skrivplanens eget mediesteg, så en polerad sidas text skickas
aldrig igen.

Fyra egenskaper som inte ska tas bort:

1. ☠️ **Svaret bär aldrig artikelnummer eller leverantörens adresser.** Ett
   uppladdningsfel räknas per position utan felmeddelande, eftersom
   `importMediaByUrl` skriver källadressen i sitt.
2. ☠️ **Filnamnet byggs av Wix-id och position** (`kandidat-<id>-<pos>.jpg`),
   aldrig av källadressen eller titeln.
3. ☠️ **Positionerna tas exakt.** `valjBilder` släpper igenom hela listan när ingen
   önskad position finns. Det är rätt vid en import men fel här.
4. **Torrkörning är default.** Den säger hur många bilder feeden har.

⚠️ **Bilder som ingen väljer städas bort av nattens bildstädning** (03:50 UTC),
eftersom de bär en leverantörsadress i `sourceUrl`. Sedan 2026-10-14 först när
de varit oanvända i tre dygn (karenstiden), så en vald bild måste sitta på sin
produkt inom tre dygn. En omkörning laddar upp på nytt.

☠️ **Utfallet, uppmätt 2026-09-30: position 4–7 är nästan aldrig rena.** Alla 184
bilder på de 46 sidorna med två bilder granskades. 181 var tyska säljgrafiker
med rubrik och bildtexter. Tre var miljöfoton utan grafik, och två av dem bar
läsbar text eller ett riktigt märke på rekvisitan (burkar, flaskor). En enda
bild klarade runbookens regler, soffbordets miljöfoto. Den ligger på sidan sedan
samma dag (`runda-bilder-1-skriv`), läst tillbaka ur Wix och sedd på den
publicerade sidan. Ingen sida kom upp i två nya rena bilder.
Granskningen står per bild i `tools/polish-assets/runda-bilder-1/granskning.tsv`.
Mätningen från 2026-08-27 (4 av 90 rena på position 4–6) stod sig alltså, och
den gäller även de sidor poleringen redan tömt.

⚠️ **Feeden har tio bilder, inte nio.** 45 av 46 artiklar bar tio den 2026-09-30.
Taket i verktyget var nio fram till samma dag och slängde position 10 tyst ur
begäran. Det är sedan dess femton, en marginal över feedens högsta position. Det
är inte Wix tak: en produkt tar 50 bilder (uppmätt 2026-10-21, `lib/wix/limits.ts`).

✅ **Feeden har högst tio bilder per artikel, mätt på hela färgurvalet (2026-10-22).**
Leonards fråga var om det finns rena bilder på position 11–15. Verktyget tar
positionerna 1–15, så åtkomsten var inte gränsen. Torrkörningen av
`aosom-fargtillagg` (`kandidater`, `skarp` av, `positioner=11,12,13,14,15`) över
alla 442 sidor i `aosom-ordning.tsv` fann **0 av 1 160 färger med en bild bortom
position 10** (28 färger saknas i flödet). Kontrollkörningen med positionerna 8–12
på 50 jämnt spridda sidor fann position 10 för 125 av 127 färger och position 11
och 12 för 0, så kollen kan fälla. Feeden har alltså inget på 11–15 att hämta.

☠️ **Men taket ligger i feeden, inte på aosom.de** (Leonard 2026-10-22, skärmbilder av
sidan för fåtöljen `f44642e5`, Ljusgrå: galleriet visar **13 bilder**, och 11/13 och
12/13 syntes). Det som mättes var feedens bildlista, och slutsatsen att Aosom har
högst tio bilder per vara stämde inte. Feedens tio bilder för samma färg laddades upp
och lades bredvid skärmbilderna, och ingen av de två finns bland dem. 12/13 är en
textfri grafik med massagepunkter och värmezon (feedens position 5 är den tyska
versionen med text), och 11/13 är ett foto av fåtöljen i en annan vinkel än feedens
första bild. Båda såg rena ut.

☠️ **Vi kommer inte åt dem härifrån, och de går inte att gissa.** aosom.de svarar 403 på
curl och WebFetch (startsidan, produktsidan och sitemapen), medan bildservern
`img.aosomcdn.com` svarar 200. Filnamnen där är slumpade
(`/100/product/<år>/<månad>/<dag>/<slumpsträng>.jpg`, mätt på en adress), så
extrabilderna går inte att hitta på adressen. Det som saknas är bara listan. Två vägar,
ingen är gjord:

1. Be Aosom om alla bilder (en feed med fler bilder, eller ett bildarkiv). Det ger också
   nya importer fler bilder att välja bland.
2. Läsa bildlistan ur sidorna i en riktig webbläsare, i Leonards Chrome som med
   recensionerna (2026-09-16). Det kräver en session med Claude in Chrome, och
   `annan_kalla` i `lib/aosom/fargtillagg.ts` släpper idag bara igenom en källa som är en
   position i färgens egen artikel, så verktyget måste lära sig ta emot adresser som
   inte står i feeden.

Skriv inte "Aosom har högst tio bilder" som om det gällde sidorna. Det gäller feeden.

✅ **Position 10 är den som lönar sig.** Den granskades samma dag på de 45 sidorna:
24 var rena miljöfoton. 21 ströks, och alla för text på rekvisitan: etiketter på
burkar, påsar och flaskor i kök och badrum, bokryggar, en tavla med ett ord och en
klocka på en datorskärm. Flera av de strukna bar ett riktigt märke.
Textigenkänning i full upplösning och i dubbel förstoring pekade ut var texten satt,
men varje bild bedömdes med ögat. Märken och dekaler som sitter på själva varan fick
stå kvar, som runbooken säger. Granskningen står per bild i
`runda-bilder-1/granskning.tsv`.

De 24 bilderna sitter på sina sidor sedan samma dag (`runda-bilder-1-pos10`). Alla
24 skrevs och lästes tillbaka ur Wix i en separat läsning, och alla 24 publicerade
sidor visar bilden med sin alt-text. Av de 48 sidorna med två bilder har alltså 25
nu tre, men ingen fick två nya. 21 har ingen ren bild kvar i feeden, eftersom alla
deras bilder är granskade. För två gick det inte att hämta bilder: en sammanslagen
sida med flera artiklar (`flera_artiklar`) och en artikel som saknades i feeden.

✅ **Beskärning gav 23 bilder till på 13 av de 22 sidorna (2026-09-30).** Leonard:
*"fler än bara 2 måste ju gå att använda, eller klippa snyggt på nått sätt"*. För de 22
sidor som fortfarande hade två bilder granskades alla tio positioner igen, nu för att se
vad som går att skära fram. Rubriker, bildtexter, ikoner och rekvisita med text skars bort,
och varan skars aldrig i. Runbooken förbjöd beskärning (Leonard 2026-09-27), och
undantaget för sidor med två bilder står nu där. Utsnitten görs med Wix egen crop-adress
och laddas upp som nya filer, så ingen leverantörsbild läggs i det publika repot. Varje fil
är md5-parad mot sitt utsnitt, eftersom uppladdningens svar inte säger vilket id som hör
till vilken adress. Metoden står i `docs/polish/bildmetoder.md` (*Beskärning*),
granskningen per bild i `runda-bilder-1-klipp/granskning.tsv`.

Alla 23 skrevs och lästes tillbaka ur Wix i en separat läsning (`runda-bilder-1-klipp`),
och alla 13 publicerade sidor visar dem med sina alt-texter. Två utsnitt ströks: en klocka
med ett ord som gick att läsa i full storlek, och en importörsetikett med adress som inte
gick att skära bort utan att kapa hjulet den satt vid. Nio sidor fick ingenting. På åtta
står texten på varans egna hyllor, i dess fack eller bakom dess glasdörrar, alltså inne i
det som inte får skäras bort. Den nionde saknas i feeden. För de nio är leverantörens
bilder uttömda.

✅ **En andra genomgång samma dag gav sju bilder till.** Leonard frågade om sidorna med två
eller tre bilder hade fler att ge. Alla tio positioner på de 13 sidorna granskades igen, och
sju utsnitt höll (`runda-bilder-1-klipp2`). Tre visar en utdragen låda där förpackningarna
med text skurits utanför, och de andra är ett köksskåp i sitt kök, ett mikrovågsfack,
insidan av ett badrumsskåp och sparkbilen på ett kalas. Alla sju skrevs och lästes tillbaka
ur Wix i en separat läsning, och alla sju sidorna visar dem live. Nu har fyra av de 22
sidorna kvar två bilder: `138a24b0`, `3a27aabe`, `9dc0f858` och `fbcf5899`. Resten
stoppades av text på varan eller på sakerna i den, och av collagepaneler under 700 px på
kortsidan, som ger en suddig huvudbild. Metoden står i `docs/polish/bildmetoder.md`.

Den första genomgången kallade leverantörens bilder uttömda för nio sidor, men fem av dem
fick bilder i den andra. Mät var texten slutar innan en bild stryks.

✅ **Sidorna med tre bilder granskas i rundor om sju till nio sidor (2026-09-30).** Leonard:
*"dom som har 3 och 2 bilder måste vi lösa … ta dom i omgångar några i taget o gör noggrant"*.
Den färska räkningen gav 48 sidor med två bilder och 172 med tre. Varje runda hämtar alla tio
positioner och granskar dem med samma regler och samma beskärning som ovan. Rundorna 2–7
(kontorsstolar, fåtöljer, soffor, bord, badrumsskåp och trädgård) granskade 52 sidor, och 44 av
dem fick sammanlagt 89 bilder. Alla är skrivna, lästa tillbaka ur Wix och sedda på de publicerade
sidorna. Skälet per bild står i `runda-bilder-N/granskning.tsv`, och fällorna står i
`docs/polish/bildmetoder.md` (*Beskärning*).

☠️ **Butikens galleri visar VARJE bild som en kvadrat ur mitten, inte bara huvudbilden**
(uppmätt 2026-09-30: `.gallery .gmain img` har `aspect-ratio: 1` och `object-fit: cover`, och
adressen är Wix `fill … al_c`). Ett avlångt utsnitt där varan fyller hela höjden visas alltså
kapat. Nio av 76 icke-kvadratiska utsnitt från rundorna 1–6 gör det, bland dem en garderob, ett
TV-stativ och en lyftfåtölj. Listan står i bildmetoderna. De ligger kvar tills Leonard valt
mellan att ta bort dem och att låta galleriet visa hela bilden.

✅ **Text på rekvisitan är okej sedan 2026-09-30.** Leonard, om köksskåpet `fbcf5899`: *"text
som är på produkter på det viset är okej"*. Förpackningar, burkar och böcker med text i en
miljöbild stryks inte längre, även när ett märke går att läsa i full storlek. Tysk säljgrafik,
leverantörens logotyp och fel färg stryks som förut. Bilder som ströks bara av det gamla skälet
får läggas tillbaka, och skälet står per bild i rundornas `bilder-bort.tsv` och
`granskning.tsv`. Regeln står i runbooken under *Behåll*.

### Miljöbilden ska vara andra bilden (2026-10-01)

Leonard: feedens position 2 är (nästan) alltid ett rent miljöfoto, och den ska vara
andra bilden på varje publicerad Aosom-sida. På en sammanslagen sida ska varje färg ha
sin egen artikels miljöbild, länkad till färgen och som andra bild i det butiken visar
för färgen (galleriets ordning, filtrerad som `synligaBilder` i butikens
`lib/variant-bilder.ts`, med valets första bild först).

Workflowen **"Bilder — miljöbilden (feedens position 2) som andra bild på varje
Aosom-sida"** → `/api/admin/aosom-livsbild` → `lib/aosom/livsbild.ts` har fyra lägen:
`rapport` (status per sida eller färg), `kandidater` (laddar upp position 2 för
granskning), `plan` och `skriv`. En flytt (`<wix-id>[:<val-id>]:flytta`) behöver ingen
granskning; en infogning (`<wix-id>[:<val-id>]:<fil-id>`) tar bara en kandidat som en
människa godkänt.

Fyra egenskaper som inte ska tas bort:

1. ☠️ **`saknas` betyder att varje galleribild är spårad** till sin källa
   (`aosomBildFiler`, annars Wix `sourceUrl`). Går någon inte att spåra blir det
   `okand`, så att miljöbilden inte läggs dit två gånger.
2. ☠️ **Huvudbilden och färgens första bild rörs aldrig**, och ingen bild faller ur
   galleriet. En sida där miljöbilden är huvudbild (`ar_huvudbild`) lämnas.
3. ☠️ **Skrivningen går stegvis som färgbilderna** (galleriet ensamt, sedan länkarna
   med options + variantsInfo ordagrant och `visible`, sedan återläsning), kräver
   planens sha och stannar vid första sida som inte läser tillbaka.
4. ☠️ **Svaret bär bara Wix egna id och adresser.** Godkända kandidater måste skrivas
   inom karenstiden, tre dygn efter att bildstädningen (03:50 UTC) först såg dem
   oanvända.

⚠️ **Feedens position 2 är inte alltid ett miljöfoto** (2026-10-19). På
barnnattduksbordet `2c63cfbc` och barnskrivborden `426d88ab` och `2d92a681` är den
ett amatörfoto från lagret med smutsigt golv, och nattduksbordet står upp och ned.
På skrivborden är position 3 samma sorts foto, och position 10 på alla tre.
Leonard: amatörfotona ska bort helt. De är borttagna och ersatta med utsnitt ur
leverantörens collage (`tools/polish-assets/runda-bilder-barn-utsnitt/`), så `plan`
svarar inte längre `har_som_tva` för de tre sidorna. Lägg inte tillbaka position 2.
Fotona är liggande bilder inramade med vita band upptill och nedtill, och det
syns bara på bilden.

Samma dag svepte `tools/polish-gates/lagerfoto-svep.py` hela katalogen efter den
formen: ett foto inramat med vita band, som går kant i kant. Underlaget är butikens
Google-flöde (4 944 sidor, 28 162 bilder) och en miniatyr per bild. Kollen fällde alla
fem kända lagerfoton och ingen av de nio andra bilderna på barnmöblerna. Av 110
inramade bilder i katalogen var tolv lagerfoton, och resten var stående miljöbilder,
renderingar och kort. Se därför varje träff med ögonen.

Andrabilden var ett lagerfoto på fem sidor till: barn-UTV:n `0f94d65c`, wigglebilen
`98672b0d` och gokartarna `39a377f6` (rosa), `08bdee9f` (röd) och `ea640f31` (vit).
Fotot flyttades först sist (`runda-bilder-lagerfoto-sist`). Leonard ville sedan ha
lagerfotona borta och ersatta med proffsiga bilder, som på barnmöblerna. Lägg inte
tillbaka dem, och kör inte livsbildens `flytta` på sidorna.

- UTV:n och wigglebilen fick ett utsnitt ur leverantörens måttbild. Den tyska
  texten, den infällda sitsbilden och pojken ligger utanför, och måtten i bilden är
  samma som sidans (`runda-bilder-lagerfoto-ersatt`).
- Springcykeln `115d3831` hade två lagerfoton (plats 5 och 6). Båda är borta, och
  sidan fick ett utsnitt ur en miljöbild.
- Väggvärmaren `d05fd29f` hade lagerfotot på plats 4 och inga rena leverantörsbilder
  kvar. Den enda miljöbilden med värmaren har tysk text över varans överkant. Fotot
  är ersatt med ett eget spec-kort byggt ur sidans spec-tabell
  (`runda-bilder-vaggvarmare-kort`).
- Den vita Vespa-scootern `69042231` är en sammanslagen sida i tre färger. Fotot var
  länkat till Vit och är borttaget med `bilder-bort.yml`. Bildkandidaterna vägrar en
  sida med flera artiklar (`flera_artiklar`), så ingen ersättning hämtades.
- Gokartarnas artikel saknades i flödet 2026-10-19 till 2026-10-22, och av importens
  filer fanns bara lagerfotona kvar i Wix. Lagerfotona är ersatta med ett eget
  detaljkort per färg (`runda-bilder-gokart-kort`): ratten, sitsen med bältet,
  bakhjulet Ø 28 cm och framhjulet Ø 22 cm, utsnitt ur sidans egen huvudbild.
  Kortet byggs med `bygg-kort.py`, som sedan dess läser `paneler.tsv`. Den vita har
  tre bilder och de andra två fyra. Kör `aosom-bildkandidater` med positionerna 3–10
  när artikeln är tillbaka, för fler riktiga foton.

☠️ **Kollen ser bara inramade foton.** Springcykelns andra foto (6:5) och Vespans
(4:3) var inte inramade. De hittades först när alla 671 bilder i katalogen som inte
är kvadratiska granskades med ögonen.

### Färgval med få bilder: fler bilder per färg (2026-10-21)

Leonard, med en skärmbild av strandparasollen där färgen Grön visade två bilder: *"Det finns
produkter med varianter som har 4 bilder eller mindre, kan du hämta bilderna till de
varianter som har 4 eller mindre och koppla rätt och kolla att rätt bild syns i live sidan
som test så din metod är rätt."*

**Omfattningen, mätt 2026-10-21** med `tools/polish-gates/katalogkontroll-farg-bilder.js`
(`products/search` med `MEDIA_ITEMS_INFO` och butikens ägarregler som i `fargVy`, bara
färgvalen): 534 av 951 publicerade sidor med färgval har minst ett färgval som visar fyra
bilder eller färre, och 1 097 av 2 533 färgval gör det. 442 är Aosom-sidor med en artikel
per färg (240 med två färger, 128 med tre, 57 med fyra och 17 med fem eller fler) och 92 är
AliExpress-sidor (26 där den sämsta färgen visar en bild, 31 två, 25 tre och 10 fyra).
Sidorna, leverantören och minsta antal bilder står i
`tools/polish-assets/farger-fler-bilder-2026-10-21/flaggade.tsv`. Importen tar feedens
position 1, 2, 3, 8 och 9, poleringen stryker det som bär text eller märke, och en färg som
kom in genom en sammanslagning fick bara en del av givarens bilder.

⚠️ **Mätningen är en uppskattning, och butikens regel är inte `fargVy`s.** Uppmätt live
(`tools/polish-gates/live-bilder.mjs`, 69 AliExpress-sidor med en axel): skriptets regel
stämmer exakt på 60, `fargVy` på 47. Skillnaderna: en länkad bild visas bara för det FÖRSTA val
som länkar den, och en olänkad bild utan färgnamn hör till huvudbildens färg bara när varje
färgval är ett enda färgord (Svart, Vit). Heter ett val "Nattsvart M" eller "Base 210T Rosa"
visas bilden för alla färger. `fargVy` och `olankadeAgare` räknar fortfarande den gamla
vägen. På sidor med fler än en axel (hamsterburen `13fe619f` räknas som 0 för Mörkgrå, fast
den visar bilder per storlek) gäller ingen av reglerna, och en första, bredare mätning över
alla val gav 628 sidor. Mät den enskilda sidan live innan du tar den som given.

**Piloten: strandparasollen** `57988115` (AliExpress-sida, två färger). Grön visade två
bilder och Blå fyra. Efter åtgärden visar Grön fem och Blå sju, mätt live per färg med
`node tools/polish-gates/live-galleri.mjs <slug> <galleri-id.json>`, som klickar varje färg i
väljaren och skriver ut galleriet (väljaren på den här sidan är en enda axel utan
`.pdp-axis`-omslag, och skriptet läser nu den formen också). Metoden för en AliExpress-sida,
som inget verktyg gör åt en:

1. **Hitta fotona.** Listningens SKU-bilder, galleri och beskrivningsbilder läses krypterat
   med `ae-skubilder.yml` (push som ändrar `tools/ae-skubilder/kor.json`). Hämta dem lokalt,
   bygg ett kontaktark och titta på varje bild: tysk eller spansk text, märke och en annan
   färg stryks. Leverantörens rena gröna foton räckte inte till fem, så det femte är ett
   specifikationskort med den gröna varan (`scripts/cardkit.py`, `card_spec`).
2. **Importera filerna** till Media Manager (`site-media/v1/files/import`, vänta på `READY`).
   Ett utsnitt görs med Wix egen crop-adress och importeras som en ny fil, aldrig som en
   leverantörsbild i repot.
3. **Skriv galleriet vid fil-id**, och länka sedan färgens bilder med `options` och
   `variantsInfo` ordagrant ur produktens egen GET, `visible` explicit (se *Färger som inte
   kom via verktyget* i `docs/polish/syskon.md`). Kör `variantbild.yml` efteråt.
4. **En bild som visas för alla färger länkas inte.** Närbilden på den röda knappen som fäller
   upp parasollet är densamma i båda färgerna, så den ligger olänkad med en alt-text som
   nämner båda färgerna (butikens `arKort`-regel: en olänkad bild som nämner flera färger är
   gemensam). Lägg aldrig en annan färgs foto på ett val.
5. **Mät live per färg** efter butikens cache (`age` på sidan, `uppdatera-andrade` var femte
   minut), och läs tillbaka id, SKU, pris och synlighet i en separat läsning.

Metoden prövades på sex AliExpress-sidor till (`30169925`, `587c92f3`, `82b05d93`, `39a5c0bf`, `5b21090e`, `53b941a0`, skrivna
med `tools/polish-gates/skriv-fargbilder.js`, högst tre sidor per körning inom ExecuteWixAPI:s 60 sekunder). Alla lästes
tillbaka i Wix och mättes live med exakt de antal planen räknade fram: cykelstället Svart 7 och Vit 4, cykelpumpen Svart 8
och Vit 4, barstolarna Svart 5, liggunderlaget Grön 4, Blå 3 och Grå 2, ballongbågen Vit 3 och hollywoodgungan Blå 4.
☠️ **Utbytet är litet.** En AliExpress-listning har sällan en bild per färg: galleriet visar oftast en färg och
beskrivningsbilderna är spanska eller engelska säljgrafiker, så en färg får ett till fyra foton. Av ungefär 25 granskade
sidor gick tio att förbättra, och kläder med 7–29 färger går inte alls. Fyra sidor (`228aea02`, `314168d1`, `8f21a666`,
`928bb3c4`) är importerade och verifierade men inte skrivna. Spåret pausades 2026-10-21 efter Leonards besked *Fokusera på
aosom produkterna*.

För Aosom-sidorna finns verktyget **"Bilder — fler bilder till en färg på en sammanslagen
Aosom-sida"** (`aosom-fargtillagg.yml`) → `/api/admin/aosom-fargtillagg` →
`lib/aosom/fargtillagg.ts`, med tre lägen: `kandidater` (laddar upp feedens position 3, 8, 9
och 10 för varje färgs artikel, bara de som färgens vy inte redan visar), `plan` och `skriv`.
En människa tittar på varje kandidat (46 procent av feedens bilder bär tysk text, och ett
märke syns inte i någon grind), och de godkända filerna skrivs i `tillagg.json` i rundans
katalog med en svensk alt-text per bild. Verktyget väljer aldrig bilder. PR #749 mergades
2026-10-21 (squash `4f31bf31`, Leonards *Merga*), produktionsbygget var READY efter 85 sekunder och
rutten svarar, så workflowen körs med `workflow_dispatch` från `main`.

**Aosom-sidorna, kartlagda 2026-10-21** (`tools/polish-gates/katalogkontroll-farg-givare.js`, 36 sekunder över 6 125
produkter, bara läsning). De 442 sidorna har **798 färgval på fyra bilder eller färre**. 266 sidor har 4 som sämsta färg,
130 har 3, 36 har 2, 9 har 1 och 1 har 0, så de flesta saknar en eller två bilder. 412 av 442 sidor har inga
gemensamma bilder alls (inga kort eller måttbilder som butiken visar för alla färger). Färgbildsverktyget (`fargbilder.yml`,
`plan`) gav 0 kandidater, men det betyder inte att givarnas bilder sitter på sidorna: det som väntar på granskning
(`granskas`) och det som inte fick plats (`overflow`) ligger i en tabell som bara motorn läser, och planen skriver bara
räknare, inga fil-id. Mätt direkt mot Wix har 298 av de 798 färgvalen en dold givare, men bara **26 färgval en givare med
bilder kvar** (51 bilder). Givarna är alltså i stort sett uttömda. Resten av underlaget finns bara i feeden (position 4–7 och
10, och alla positioner för en färg utan givare), och `aosom-fargtillagg` hämtar dem (PR #749 är mergad).

**Första omgången: givarnas bilder (18 sidor, 35 bilder skrivna, 32 kvar).** De 26 färgvalen granskades på kontaktark och 35 bilder skrevs med
`tools/polish-gates/skriv-fargbilder.js` (samma steg som verktygen: galleriet ensamt vid fil-id, länkarna med `options` och
`variantsInfo` ordagrant ur GET:en, återläsning av galleri, länkar, variant-id, SKU, pris och synlighet). Planen står i
`tools/polish-assets/farger-fler-bilder-2026-10-21/aosom-givare-1.json`. Alla 18 sidor lästes tillbaka utan avvikelser och
mättes live (`tools/polish-gates/kolla-live-farg.py`): varje tillagd bild syns i sin egen färgs vy och i ingen annans, och
antalet unika bilder per sida stämmer med galleriet i Wix. Efteråt rättade `variantbild.yml` varukorgens bild per färg på
alla 24 skrivna sidor (18 Aosom och sex AliExpress, noll avvikelser): kör den efter varje färgbildsskrivning. 24 färgval
fick fler bilder. 12 nådde fem eller fler (mörkbruna hundtrappan `f384c51d` 2 till 6, rosa soffan i
`4f21c7c1` 3 till 5), och 12 står kvar på 2–4: tio eftersom givarens övriga bilder var tyska eller engelska säljgrafiker
(trehjulingen `eeb4a919`, Grå och Rosa: *Security features* och *More details*), och två eftersom en bild som sa emot sidan
togs bort efteråt (blå soffan `f1878c34` 1 till 4 och grå klätterväggen `44663e99` 2 till 3, se nedan). Två givare gav ingenting
(`6334f635`, `a706542f`: *Nur Kissen* och *Hinweis* tryckta mitt i fotona, och beskärningen hade kapat varan). Två
bilder är utsnitt via Wix crop-adress (`834c66fd` Grå och `e76a4098` Ljusgrå), uppladdade som nya filer och verifierade
mot ett lokalt utsnitt (dHash 0).

☠️ **Givarens egna kort flyttas aldrig av `fargbilder`** (*sidans kort gäller alla färger*, `givarensBilder`). På en sida
där värdens kort är länkade till värdens färg är givarens kort det enda kort färgen kan få, och de ligger kvar som
"bilder kvar" i kartläggningen. Jag länkade dem till färgen (de visar färgens egen vara). Ett kort som inte är färgens eget
ska aldrig läggas som val.

**OCR före ögonen** (`tools/polish-gates/ocr-forgranska.py`, RapidOCR i en egen venv, modellerna ligger i paketet). Den hittar
inbränd text (tyska och engelska rubriker, *Nur Kissen*, etiketter) och skiljer bilder med bara siffror från rena foton. Provad
mot 14 bilder jag redan bedömt för hand: alla 14 gav samma utfall. ☠️ **REN är inget bevis.** En logotyp utan bokstäver,
fel färg och en kollage syns inte, och text på varan eller rekvisitan (en affisch, en etikett) står kvar enligt runbooken.
Kör den före kontaktarken så att ögonen går till det som är kvar.

☠️ **Talen i en tillagd måttbild kontrolleras mot sidans text** (`ocr-forgranska.py --tal` skriver talen i bilden, och
`kolla-tal-mot-text.js` jämför dem med `plainDescription` och läser bara). Kontrollen gjordes efter första omgången: på fem av
de 18 sidorna hade en måttbild tal som inte stod i texten, och två av dem sa emot den. Blå soffan `f1878c34` hade fått en bild med
*240 kg* medan sidan säger *Maxbelastning: 100 kg per sits och 10 kg i förvaringen*, och grå klätterväggen `44663e99` hade fått
givarens kort och leverantörens måttritning där trappan är 38 × 20 × 2,8 (kortet) och 38 × 20 med 3,8 cm tjocka rullar
(ritningen), medan sidan säger *38 cm bred, 22 cm djup och 12 cm hög*. De tre bilderna togs bort samma kväll med
`bilder-bort.yml` (planerna var rena, återläsningen stämde, och `variantbild` rättade 3 respektive 1 val; live 21:45 UTC visade
18 respektive 7 unika bilder som galleriet, Blå 4 och Grå 3, och ingen av de borttagna syns i någon färg). De tre andra sidorna
hade bara fler mått än texten och bilderna står kvar: det vita fällbordets inre mått (hylla 75,5 × 14, skiva 75 × 75, bordshöjd 74;
belastningen 40 kg stämmer med sidans *40 kg totalt*), den rosa barnfåtöljens sitthöjd 38 mot sidans 37,5 (avrundat) och
uppresningsfåtöljens mått i upprest läge (128,5 × 83 × 62,5). Ett tal som saknas i texten är ingen motsägelse. En annan
belastning eller ett annat mått på samma del är det, och då tas bilden bort i stället för att texten rättas: texten är
leverantörens uppgifter för värdens artikel, och ett färgsyskons bilder kan höra till en artikel med andra mått. Kör kontrollen
före skrivningen nästa gång. ☠️ Givarens kort dubblerar dessutom värdens egna kort, som redan visas för alla färger.

**Efter merge av PR #749 (2026-10-21):** de ungefär 770 färgval som inte har någon givare med bilder kvar tas i omgångar
om ungefär 20 sidor, sämst färg först (`aosom-ordning.tsv`). Ordningen är `kandidater` med `mal` = sid-id (alla svaga
färger på sidan), OCR och kontaktark, sifferkontroll (`kolla-tal-mot-text.js`), `tillagg.json`, `plan_och_skriv` med
`ref` på grenen som har filen, live och `variantbild`. Wix tar 50 bilder, så ett galleri på 15 är inget hinder längre.

**Feedomgång 1 (2026-10-21, `tools/polish-assets/fargtillagg-1/`):** 20 sidor, 69 färger och 122 bilder
skrevs 22:57–22:59 UTC (116 feedbilder och sex utsnitt), och live-kontrollen blev **ALLT OK**: varje fil syns i sin
egen färgs vy och i ingen annans. Av 75 mätta färgval hade 40 en eller två bilder före och ett har det nu
(Ljusgrå på bänkdynan `a7aa9370`). 25 visar fem eller fler. Räkna med att ungefär 40 procent av kandidaterna blir
bilder: 63 av 75 på feedposition 10, 22 av 59 på 9, 18 av 63 på 3 och 13 av 69 på 8. Verktygen som gjorde jobbet ligger i
`tools/polish-gates/`: `farg-kandidater.py` (hämtar kandidaterna, OCR med textyta och `auto` för säljgrafik över 2,5 %),
`farg-ark.py` (kontaktark per sida med färgens nuvarande bilder som referensrad, dubbletter utsorterade), `farg-tillagg.py`
(`tillagg.json` ur en godkänd-lista), `live-farg-vy.mjs` (färgvyn på en sida med två axlar) och `kolla-live-farg.py`. Fyra
saker att inte missa: **(1)** mät en sida med två axlar med `live-farg-vy.mjs`, för `live-bilder.mjs` hamnar ibland i en annan färgs
vy (hundtrappans Beige); **(2)** måttbilderna jämförs med sidans text före skrivningen, och en feedartikel kan ha andra mått än
värdens (kontorsstolens fyra färger ströks); **(3)** ett utsnitt görs med Wix crop-adress och ska rymma varan i butikens
kvadrat ur mitten; **(4)** `plan_och_skriv` rättar varukorgens bild själv (`variantbilder: N rättade`).

**Feedomgång 2 (2026-10-21, `tools/polish-assets/fargtillagg-2/`):** 25 sidor, 54 färger och 74 bilder skrevs
23:41–23:44 UTC (67 feedbilder och sju utsnitt), och live-kontrollen blev **ALLT OK**. Av 58 mätta färgval hade 156 bilder
före (alla med två till fyra) och 228 efter: 52 fick fler, 18 visar fem eller fler, och två står kvar på två bilder
(Vit på `a706542f` och Mörkgrå på `c519b4fe`, där feeden bara har text i bilderna). Valda per feedposition: 49 av 56
på 10, 12 av 40 på 9, 8 av 38 på 8 och 5 av 45 på 3. Fem saker utöver omgång 1: **(1)** `tools/polish-gates/ocr-live.py` OCR-kör
alla nuvarande bilder i färgvyerna och hittade tysk text på två publicerade sidor (ett informationskort på hundvagnen
`40f46441`, *Nur Pavillondach* på paviljongtaket `e969501f`); **(2)** `live-vyer.py` ritar en rad per färgvy och visade två foton på
gräddvita stolar under Grå på `817e1869`, eftersom butiken knyter ett olänkat foto till huvudbildens färg; **(3)** alla tre sidor
fick bilderna borttagna med `bilder-bort.yml` (torrt först, skarpt med planens sha) före `plan_och_skriv`, eftersom
`aosom-fargtillagg` inte länkar en fil som redan ligger i galleriet (`finns_redan`); **(4)** `farg-krop.py` gör sju utsnitt
från en lista (lokala utsnitt med OCR i 1× och 1,5×, Wix crop-adresser med md5 och parning mot de uppladdade filerna), och
`ocr-boxar.py` ger textrutornas kanter så att utsnittet slutar före texten; **(5)** en måttbild som anger en annan sitthöjd
än sidan (54 mot 50,5 cm), en närbild där leverantörens logotyp är motivet och en projektorduk med *Lorem ipsum* ströks.

**Feedomgång 3 (2026-10-22, `tools/polish-assets/fargtillagg-3/`):** 24 sidor, 80 färger och 129 bilder skrevs
00:30–00:34 UTC (alla feedbilder, inga utsnitt), och live-kontrollen blev **ALLT OK**. Av de 100 färgvyerna på sidorna hade 85
fyra bilder eller färre, och 56 av dem visar fem eller fler efter: 79 vyer fick fler bilder, 18 är oförändrade och tre fick färre
när felbilder togs bort. Valda per feedposition, utan dubbletterna: 77 av 83 på 10, 29 av 37 på 9, 14 av 51 på 3 (alla måttbilder)
och 9 av 50 på 8. Fyra stolsdynor på `39d10fc4` fick ingen bild, eftersom varje kandidat var säljgrafik med tysk text eller en ruta
med *Cushions Only* över bilden. Fem saker utöver omgång 2: **(1)** livemätningen hittade sju bilder som inte skulle visas, på sidor
som ingen tittat på: på hundvagnen `c6928b61` en ram med leverantörens logotyp (*PawHut*) och en tysk säljgrafik (*Vordere Tür*) i både
Mörkgrön och Röd, och med det nya `live-dubbletter.py` tre foton som låg två gånger i samma färgvy (Rosa på `b2ccab13`, Röd och Blå på
`eb02039b`); alla sju togs bort med `bilder-bort.yml` före skrivningen; **(2)** sifferkontrollen fällde en av 15 måttbilder (kontorsstolens
svarta färg: höjd 111–127 cm mot sidans 113–121); **(3)** autostrykningen på textyta tog närbilder av märkesskyltar på bilarnas fronter
(*SIAN*, *e-tron Sportback*, *SLC 300 Final Edition*), och sex autostrukna bilder lästes om: tre hävdes och tre var pixelidentiska med
bilder som redan låg i färgvyn (`farg-dupkoll.py` hittar sådana före skrivningen); **(4)** kandidatläget väljer färger efter antal bilder
*när det körs*, så Mörkgrön och Röd på `c6928b61` (fem bilder, två av dem felbilder) valdes inte och står på tre bilder efter borttagningen;
de tas med i omgång 4; **(5)** butikens cache hade uppdaterats på alla 25 sidor när de mättes sex till sju minuter efter skrivningen.

**Feedomgång 4 (2026-10-22, `tools/polish-assets/fargtillagg-4/`):** 24 sidor, 53 färger och 78 bilder (73 feedbilder och fem utsnitt)
skrevs 01:22–01:25 UTC, och live-kontrollen blev **ALLT OK**. Av de 77 färgvyerna på de 25 sidorna hade 58 fyra bilder eller färre (38 med
tre och 20 med fyra) och efteråt 25 (3 med tre och 22 med fyra). 52 vyer fick fler bilder, 22 är oförändrade och tre fick färre när
felbilder länkades bort. Valda per feedposition, utan dubbletterna: 46 av 53 på 10, 9 av 20 på 9, 11 av 45 på 8 och 7 av 42 på 3
(måttbilder), och fem utsnitt ur måttbilder. Tre vyer står kvar på tre bilder: Grå på hundbädden `01ac2f63` (enda kandidaten var en
bärväska som sidans text inte nämner) och Svart och Blå på studsmattan `39319e6c` (färgerna saknas i flödet, `saknas_i_feeden`).
Sex saker utöver omgång 3: **(1)** två publicerade sidor visade bilder på fel färg trots rätt galleri, och det syntes bara i färgvyerna:
minivästhuset `4a01e8d0` hade tre foton av versionen med vitt överdrag olänkade, och två av alt-texterna nämner en grön list och en grön
stålram, så butiken visade dem under Grön (ett olänkat foto hör till den färg alt-texten nämner), och på skrivbordet `3b868848` var ett foto
av ekskivan länkat till storleken 63 cm och ett till 80 cm, så de visades som andra bild under Svart och Vit. Båda lagades med det nya
`tools/polish-gates/lank-om-bilder.js` (galleriet rörs aldrig, bara valens länkar) och `variantbild.yml`; **(2)** två tyska säljgrafiker
på traktorn `91d28d6f` (Grön och Röd) låg redan ute och togs bort med `bilder-bort.yml` före skrivningen, och de två färgerna fick nya
kandidater (`mal` = `wix-id:val-id`); **(3)** alla sex kandidater på position 10 för fyrhjulingen `2720063f` och Vespan `69042231` var
lagerfoton (amatörfoton på kartong eller en vit golvyta i ett lager) och ströks, och fyra av färgerna fick ett utsnitt ur måttbilden i
stället; **(4)** sifferkontrollen (`kolla-tal-mot-text.js`, tio måttbilder) fällde en: Rosa på gokarten `fdae2809` angav 117 cm mot sidans
121 cm, och sidans text kommer ur en annan färgs artikel; **(5)** utsnitten på terrängbilen `7a8655f0` och Mercedesen `2c72e2b0` kapade bilen
och ströks, och ett julmotiv på studsmattan, en bärväska som texten inte nämner och en bild som var samma fil som position 8 ströks också;
**(6)** `live-farg-vy.mjs` klickade första axeln, som på skrivbordet var Storlek, och väljer nu axeln vars namn börjar på *Färg*.

`lank-om-bilder.js` (ExecuteWixAPI, högst tre sidor per körning, `PLANER = [{ id, axel, tomt, lankar }]`) flyttar länkar mellan val och rör aldrig
galleriet. Varje fil-id ligger redan i galleriet, en bild länkas inte från två val i samma option, ett val som hade länkade bilder töms bara
om det står i `tomt`, `options` och `variantsInfo` tas ordagrant ur GET:en med `visible`, och återläsningen jämför varje vals lista,
galleriets ordning, varianternas id, SKU, synlighet och pris och länkarna i andra optioner. Kör `variantbild.yml` med `ids` efteråt
(`4a01e8d0` och `3b868848`: 2 av 2 rättade, 0 avvikelser).

**Feedomgång 5 (2026-10-22, `tools/polish-assets/fargtillagg-5/`):** 24 sidor, 40 färger och 59 bilder (alla feedbilder, inga utsnitt)
skrevs 02:04–02:07 UTC, och live-kontrollen blev **ALLT OK**. Av de 59 färgvyerna hade 42 fyra bilder eller färre (35 med tre och 7 med
fyra) och efteråt 21 (2 med tre, 19 med fyra, 26 med fem och 12 med sex eller fler). 40 vyer fick fler bilder, 18 är oförändrade och en fick
färre när två dubbletter togs bort. Valda per feedposition, utan dubbletterna: 38 av 38 på 10, 6 av 12 på 9, 6 av 37 på 8 och 9 av 28 på 3
(måttbilder). Landroverns Defender `1c0b4b34` fick ingen bild (Orange saknas i flödet, och de andra kandidaterna var tysk säljgrafik).
Fyra saker utöver omgång 4: **(1)** `~sidan` på kontaktarket betyder att kandidaten liknar en bild i en ANNAN färgs vy, och det kan vara
den färgens eget foto: Grå på `f8efe733` position 8 var Blås foto med turkos stol och ströks efter en jämförelse av stolens färg; **(2)**
`live-dubbletter.py` fann två foton som låg två gånger i Blå på `f8efe733` med pixelskillnad 1,1 och 2,2, alltså omkomprimerade kopior som
gränsen 0,5 inte fångar, och de togs bort med `bilder-bort.yml` före skrivningen (galleri 15 till 13); **(3)** en energietikett som bild
(Svart på `b2c76518`) bär märke och artikelnummer och ströks; **(4)** en måttbild som angav sitsdynan som 63 × 43 cm mot sidans 59,5 × 41
(Blå på `07ac9918`) ströks, och två måttbilder med leverantörens logotyp (*PawHut*, `135d0f48`) ströks.

**Feedomgång 6 (2026-10-22, `tools/polish-assets/fargtillagg-6/`):** 20 sidor, 31 färger och 45 bilder (alla feedbilder, inga utsnitt)
skrevs 02:31–02:34 UTC, och live-kontrollen blev **ALLT OK**. Av de 40 färgvyerna på de 20 sidorna hade 31 fyra bilder eller färre före (24 med
tre och 7 med fyra) och efteråt 14 (alla med fyra). 31 vyer fick fler bilder, 9 är oförändrade och ingen fick färre. Bilderna i vyerna är 146
före och 191 efter. Valda per feedposition, utan dubbletterna: 29 av 29 på 10, 8 av 20 på 9, 5 av 31 på 8 och 3 av 18 på 3 (måttbilder).
Fem av de 25 sidorna fick ingen bild: barnbilen `8ad1e003` (Vit står på tre, och alla kandidater i båda färgerna var tysk säljgrafik),
hundgrinden `6eb13a16` (båda färgerna visar redan fyra, och alla sex kandidater var tysk säljgrafik), förvaringsbänken `592a4bb2` och
agilitysetet `8cf7b1bb` (alla fyra positioner låg redan i galleriet) och barnköket `a57587a8` (Rosa saknas i flödet).
Fyra saker utöver omgång 5: **(1)** sifferkontrollen fällde två av fem måttbilder, och båda gäller en färg vars artikel har andra mått än sidans
text (lärdom 102): kontorsstolen `4871d041` Grå anger höjd 102–119 och bredd 58 cm mot sidans 104,5–121,5 och 60, och väggvärmaren `8475ed8f` Vit
anger 50 × 18,6 × 12,9 cm mot sidans 54 × 18,7 × 12,3. Bilderna ströks, och frågan om en not i texten (som T25) står öppen; **(2)** `~sidan`
på arket gällde två kandidater: Guld på `58f8338d` position 8 var den svarta färgens närbild på ramen (den ligger redan i Svarts vy) och ströks,
och Silver på soptunnan `b10b80ee` position 9 var samma scen som Svarts bild men med silverfärgad tunna (dHash-avstånd 10) och valdes;
**(3)** måttbilden på hamsterburen `92ef25c9` anger två mått i det inre (39 och 34 cm) som texten inte nämner och valdes, eftersom ytterbilden
stämmer (115 × 57 × 55 cm). Den grå burens måttbild är olänkad och syns därför också i Naturträs vy; **(4)** märken som sitter tryckta på varan
(*HOMCOM* på studsmattan och returnätet, *AIYAPLAY* på sparkcykelns stång) och text på rekvisita (affischer, böcker, kaffepåsar) stryks inte, men
leverantörens logotyp över en bild (*PawHut* på hundvagnens måttbilder) gör det.

**Feedomgång 7 (2026-10-22, `tools/polish-assets/fargtillagg-7/`):** 21 sidor, 29 färger och 39 bilder (alla feedbilder, inga utsnitt)
skrevs 02:54–02:57 UTC, och live-kontrollen blev **ALLT OK**. Av de 49 färgvyerna på de 21 sidorna hade 32 fyra bilder eller färre före (18 med
tre och 14 med fyra) och efteråt 16 (3 med tre och 13 med fyra, 25 med fem och 8 med sex eller fler). 29 vyer fick fler bilder, 19 är
oförändrade och en fick färre (Vit på `883db249`, 5 till 3, när två publicerade felbilder togs bort före skrivningen). Bilderna i vyerna är 203
före och 240 efter. Valda per feedposition: 28 av 30 på 10, 5 av 16 på 9, 2 av 29 på 8 och 4 av 14 på 3 (måttbilder). Fyra av de 25 sidorna
fick ingen bild: `74e737ee` (tysk säljgrafik på position 3 och 8, och skjulet på position 9 var beige), `b920d526` (den enda kandidaten var en
omkomprimerad kopia av ett foto som redan låg i Röds vy), `faa2bdb4` (båda färgerna: *Nur Folie* och *Only cover included* över bilden) och
`fdefa04b` (inga kandidater att hämta). Fyra saker utöver omgång 6: **(1)** `kandidater` räknar *uppladdade* filer, inte filer som blivit
READY: två av 122 slutade `FAILED` hos Wix (Svart på `e6d2e70b`, position 8 och 9; `kand.py` visar dem som `?`) medan loggen sa
`missar: 0`. De ströks med skälet "importen misslyckades", och `importMediaByUrl` väntar inte på READY (hjälparen finns i
`lib/wix/bekraftad-bild.ts`, ändringen är inte gjord); **(2)** `live-dubbletter.py` körs på FÖRE-läget också. Efter skrivningen visade den tre
foton som låg två gånger i samma vy på `c5f3914e`, `c841717c` och `d27a28ae`, och alla tre låg där före omgången; **(3)** sifferkontrollen
fällde en av fem måttbilder (Grå på `c131b430`: fotringens höjd 24–41 cm mot sidans 33–43), och två måttbilder med tyska ord (*Tassen,
Familiengröße*, *Schulterhöhe*) ströks; **(4)** en ersättningsduk till ett tunnelväxthus (`d17733fd`, Vit) fick position 10 eftersom sidans text
säger att bara duken ingår och Gröns vy har motsvarande bild, men positionerna 3, 8 och 9 ströks för *Note: Only cover included* och *Nur Abdeckung enthalten*.

**Feedomgång 8 (2026-10-22, `tools/polish-assets/fargtillagg-8/`):** 26 sidor, 48 färger och 60 bilder (alla feedbilder, inga utsnitt)
skrevs 03:37–03:41 UTC (två omgångar, 25 + 1 sida), och live-kontrollen blev **ALLT OK**. Alla 48 skrivna färgvyer fick fler bilder: före hade
47 fyra bilder och en tre, efteråt har 37 fem och 11 sex eller fler, och bilderna i dem är 191 före och 251 efter. Positionerna var 10, 9 och 3:
**46 av 46 på position 10**, 10 av 16 på 9 och 4 av 18 på 3 (måttbilder), utan dubbletterna (42 av 122 kandidater var samma foto som färgens
nuvarande). Sju färger står kvar på fyra bilder: tre saknas i flödet (Vit på `0641bd05`, Grå betong på `5c65d551`, Mörkgrå på `e11ad5cc`), Gul
på `95c2008d` fick fyra i stället för fem när ett tyskt foto togs bort, och Svart och Röd på `a253637c` hade bara tysk eller engelsk säljgrafik
kvar. Tre saker utöver omgång 7: **(1)** `ocr-live.py` över de nuvarande färgvyerna (438 bilder, 8,5 minuter) fann ett tyskt säljfoto som redan
låg ute på en publicerad sida: Gul på `95c2008d` visade *VERSTELLBARE FUSSPOLSTER / Stabiler Stand auf unebenem Boden*. Det togs bort med
`bilder-bort.yml` före skrivningen, och `live-dubbletter.py` på FÖRE-läget fann inga par; **(2)** text på varan eller rekvisitan stryks inte
(*Audi Sport* på bilens front, *CAUTION WET FLOOR* på skurhinkarna, en burk med en butiksetikett i ett renderat kök), men engelska enheter
(*264 lbs (120 kg)*), tyska boktitlar som fyller bilden och en logotyp över fotot (*AIYAPLAY*) gör det; **(3)** sifferkontrollen fällde en av
fem måttbilder: fåtöljen `70d0a9ea` Brun anger fotpallen som 46 × 50 cm mot sidans 47 × 40. Efterarbetet från omgång 6 och 7 är gjort: tre
foton som låg två gånger i samma vy togs bort (`c5f3914e`, `c841717c`, `d27a28ae`, galleri 9 → 8, 15 → 14 och 8 → 7), och den grå
hamsterburens måttbild på `92ef25c9` länkades till Grå med `lank-om-bilder.js` (Grå 4 → 5, Naturträ 6 → 6, 0 avvikelser; `variantbild` rättade 1).

**Feedomgång 9 (2026-10-22, `tools/polish-assets/fargtillagg-9/`):** 25 sidor valdes och 22 skrevs: 34 färger och 48 bilder (alla feedbilder, inga
utsnitt) skrevs 04:09–04:11 UTC i en omgång, och live-kontrollen blev **ALLT OK**. Alla 34 skrivna färgvyer stod på fyra bilder före och fick fler:
21 har nu fem, 12 sex och en sju, alltså 136 bilder före och 184 efter. På de 25 sidorna gick vyerna med fyra bilder eller färre från 40 till 7
(bilderna i alla vyer 344 → 388). Av 91 kandidater (35 på position 10, 30 på 3 och 26 på 9) valdes 48, 18 ströks och 25 var samma foto som färgens
nuvarande. Valda per feedposition, utan dubbletterna: **33 av 35 på position 10**, 4 av 9 på 9 och 11 av 22 på 3 (måttbilder). De 18 strukna: tysk text i en
måttbild (tio, *Empfohlenes Alter*, *Gewichtslimit*), tyska säljgrafiker (*Mehr Details*, tre på `1dfa992a`), leverantörens logotyp (*PawHut* över en
måttbild, *Outsunny* med en engelsk lapp), höstpumpor runt bilen (två på `2f6ff71c`, position 10) och kastruller och stekpannor på en leksaksspis som sidans
text inte nämner. Tre sidor fick ingenting: `0f83c211` (Röd saknas i flödet), `2f31a1d9` (alla positioner låg redan i galleriet) och `2f6ff71c` (allt struket
eller dubbletter), och Brun och vit samt Grön och vit på `1dfa992a` står kvar på fyra. Tre saker utöver omgång 8: **(1)** `ocr-live.py` på FÖRE-läget fann tre tyska säljgrafiker
på två publicerade sidor: två på `0f83c211` Grön (vyn gick från fem till tre) och en på `2f6ff71c` Orange (till tre). `live-dubbletter.py` fann dessutom en
nästan identisk torktumlarbild på `2517c54b` Grå (pixelskillnad 4,6, alltså över gränsen 3 i lärdom 104, och bedömd med ögonen som samma foto, vyn gick till
fem). Fyra bilder på tre av de 25 sidorna (12 procent) togs bort med `bilder-bort.yml` före skrivningen, och en vy kan alltså falla under fyra av just det
skälet; **(2)** en vy som tappar en felbild har ingen ersättning att hämta när feeden saknar färgen eller redan är uttömd, och den står då på sitt nya antal
(`0f83c211` Grön och `2f6ff71c` Orange på tre) tills Leonard beslutar om ett utsnitt; **(3)** position 10 gav 33 av 35 och ligger nu på 174 av 178 över omgång 5–9.

**Feedomgång 10 (2026-10-22, `tools/polish-assets/fargtillagg-10/`):** 25 sidor valdes och 20 skrevs: 35 färger och 35 bilder (alla feedbilder, inga utsnitt, bara
position 10) skrevs 04:46–04:48 UTC i en omgång, och live-kontrollen blev **ALLT OK**. Alla 35 skrivna färgvyer stod på fyra bilder före och visar nu fem. På de 25
sidorna gick vyerna med fyra bilder eller färre från 43 till 9, och bilderna i alla vyer från 346 till 378 (de 35 som skrevs minus tre som togs bort). Av 39 kandidater
valdes 35, 3 ströks (engelsk text över bilden: *Replacement Gazebo Top Cover Only* på paviljongtaket `3f9fda98` och *Cushions Only* på de gräddvita och marinblå dynorna på `485086d2`) och 1 var
samma foto som färgens nuvarande. Fem sidor fick ingenting: `3f9fda98` (allt struket), `5a31b710` och `5f14c112` (Svart respektive Brun saknas i flödet), `75e5fa26` (artikeln
har ingen position 10) och `8aa0bb6c` (enda kandidaten var en dubblett). Tre saker utöver omgång 9: **(1)** `ocr-live.py` och `live-dubbletter.py` på FÖRE-läget fann tre
felbilder på tre av de 25 sidorna, 12 procent igen: en tysk och engelsk säljgrafik med fem textrutor och pilar (*Leinen-Touch-Gewebe*, *Wide Armrest*, *Dicke
Polsterung*, *Side Pocket*, *Stabiler Holzsockel*) på massagefåtöljen `5a31b710` Brun (vyn 5 → 4), och två exakta dubbletter (pixelskillnad 0,0): huvudbilden en gång till som
tredje bild på `75e5fa26` Beige (vyn 4 → 3) och samma miljöbild som andra och sjunde bild på `8aa0bb6c` (vyn 7 → 6). De togs bort med `bilder-bort.yml` före skrivningen
(04:37 UTC torrt och 04:40 UTC skarpt). Text på rekvisitan stryks inte (affischer, böcker, medicinförpackningar med kyrillisk text i ett badrumsskåp, märket på en bilfront), men
textrutor med pilar som lagts över ett foto är säljgrafik; **(2)** `FARG`-raden i `kandidater` säger varför en färg inte får någon kandidat: `finns 10` (positionen ligger redan i
galleriet, `617ce9ff` Mörkgrön), `saknas_i_feeden`, eller tom `hamta` (artikeln har ingen position 10, `75e5fa26` Beige). `okanda_kallor` är bara en varning om att en kandidat kan
vara en dubblett, och den följer med på alla tre färgerna på `485086d2` utan att något hindrade; **(3)** position 10 gav 35 av 38 (utan dubbletten) och ligger nu på 209 av 216 över omgång 5–10.

**Feedomgång 11 (2026-10-22, `tools/polish-assets/fargtillagg-11/`):** 25 sidor valdes och 24 skrevs: 35 färger och 35 bilder (alla feedbilder, bara
position 10) skrevs 05:07–05:10 UTC i en omgång, och live-kontrollen blev **ALLT OK**. Alla 35 skrivna färgvyer stod på fyra bilder före och visar nu fem. På de 25
sidorna gick vyerna med fyra bilder eller färre från 37 till 2, och bilderna i alla vyer från 344 till 379, exakt de 35 som skrevs. Position 10 gav 35 av 35: ingen
kandidat ströks och ingen var en dubblett. En sida fick ingenting, `d348bf64` (artikeln för Svart har ingen position 10), och Grå på `d34f6bab` saknas i flödet (Gråbrun
på samma sida fick sin bild). Två saker utöver omgång 10: **(1)** FÖRE-sveppen (340 unika bilder) fann inga felbilder (omgång 7–10 hade en till tre sidor var). De 87 OCR-träffarna
var märken och dekaler på varan (*Honda*, *Racing / Off-road*, *TT RS Roadster*), böcker, affischer och förpackningar i miljöbilder och leverantörens egna kort. Det enda
paret som `live-dubbletter.py` rapporterade som *likt men olika* (`8df88104` Klassiska färger, plats 1 och 3, avstånd 0, pixelskillnad 0,9) är samma produktfoto med och
utan måttlinjer, och det behölls; **(2)** `live-par.sh` skriver `klart N av 25 sidor`, och de sidor som saknas är de där Node föll medan OCR delade processorerna (två sidor i
både omgång 11 och 12). Mät om dem en och en med `live-bilder.mjs` innan kontrollen körs; **(3)** position 10 gav 35 av 35 och ligger nu på 244 av 251 över omgång 5–11.

**Feedomgång 12 (2026-10-22, `tools/polish-assets/fargtillagg-12/`):** 25 sidor valdes och 24 skrevs: 33 färger och 33 bilder (alla feedbilder, bara
position 10) skrevs 05:24–05:27 UTC i en omgång, och live-kontrollen blev **ALLT OK**. På de 25 sidorna gick vyerna med fyra bilder eller färre från 36 till 6, och
bilderna i alla vyer från 224 till 254 (de 33 som skrevs minus tre som togs bort). Position 10 gav 33 av 33: 21 rena, 1 med bara siffror och 11 med text på varan eller
rekvisitan, och ingen ströks. En sida fick ingenting, `12401205` (positionen låg redan i galleriet, `finns 10`). Tre saker utöver omgång 11: **(1)** `live-dubbletter.py`
på FÖRE-läget fann tre exakta dubbletter (pixelskillnad 0,0 till 0,019) på två sidor: Svart på `087cb4b8` hade samma foto som plats 1 och 3, och Vit och Grön på `0fc3c252`
hade samma foto som plats 2 och 3. De togs bort med `bilder-bort.yml` före skrivningen (gallerierna 9 → 8 och 8 → 6), så de tre färgerna står på fyra bilder efter omgången
i stället för fem. Paret på `fd221e07` Svart (plats 1 och 5, avstånd 6, pixelskillnad 11,6) var *likt men olika*: huvudbilden och en måttbild av samma golvlampa i en annan vinkel, och det behölls; **(2)** `kandidater` köas bakom en pågående skrivning
(samma concurrency-grupp, `polish-write`), så nästa omgångs kandidater går inte att starta medan den förra skrivs; **(3)** position 10 gav 33 av 33 och ligger nu på
277 av 284 över omgång 5–12.

**Feedomgång 13 (2026-10-22, `tools/polish-assets/fargtillagg-13/`):** 25 sidor valdes och 22 skrevs: 27 färger och 27 bilder (alla feedbilder, bara
position 10) skrevs 05:47–05:50 UTC i en omgång, och live-kontrollen blev **ALLT OK** (06:01 UTC, alla 25 sidor mätta). På de 25 sidorna gick vyerna med fyra bilder eller färre
från 33 till 7, och bilderna i alla vyer från 223 till 249 (de 27 som skrevs minus en som togs bort). Position 10 gav 27 av 27: 22 rena, 2 med bara siffror (*VV*) och 3 med
text på varan, och ingen ströks. Tre sidor fick ingenting: `2d65601c` och `3a5060ec` (positionen låg redan i galleriet) och `39a21e71` (Svart och blå saknas i flödet).
Mörkblå på `298492a4` saknas också i flödet (Ljusgrå på samma sida fick sin bild), och Svart på `240d5d8f` hade positionen redan i galleriet. Två saker utöver omgång 12: **(1)** `ocr-live.py` på FÖRE-läget fann en närbild av
leverantörens märke (en HOMCOM-skylt som är hela motivet) som sjunde bild på `3b4594da` Silver. Den togs bort med `bilder-bort.yml` före skrivningen (galleriet 9 → 8), så
färgen står på fyra bilder. Märken som sitter tryckta på varan i ett helbildsfoto stryks inte, men en bild där märket är motivet gör det; **(2)** sidor med två axlar (`233c83cf`, `351d244c`) mäts med
`TVAAX` satt i `live-par.sh`; utan den mätte skriptet fel axel (`351d244c` visade fyra unika bilder) och sidan fick mätas om med `live-farg-vy.mjs`; position 10 gav 27 av 27 och ligger nu på
304 av 311 över omgång 5–13.

**Feedomgång 14 (2026-10-22, `tools/polish-assets/fargtillagg-14/`):** 25 sidor valdes och 24 skrevs: 46 färger och 46 bilder (alla feedbilder, bara
position 10) skrevs 10:49–10:57 UTC i en omgång (run 39765989073, plan sha `d8531f2c…`), och live-kontrollen blev **ALLT OK** (11:02 UTC, de två sista sidorna
mättes om 11:32). På de 24 sidorna gick vyerna med fyra bilder eller färre från 51 av 55 till 8, och bilderna i alla vyer från 220 till 266: 46 vyer fick fler bilder, 9 är
oförändrade och ingen fick färre (efteråt 46 vyer med fem bilder, en med sex, sex med fyra och två med tre). `live-dubbletter.py` fann 0 par. Position 10 gav 46 av 52:
sex ströks (en dubblett av en bild som redan låg i vyn, ett lagerfoto med kartonger, två med leverantörens logotyp över bilden, en närbild på en etikett på en kartong och en tysk
säljgrafik med leverantörens namn). En färg saknas i flödet (`0f83c211`), och `dd979cce` fick ingen bild (båda kandidaterna ströks). Position 10 ligger nu på 350 av 363 över
omgång 5–14. Kvar ur `aosom-ordning.tsv` (442 sidor) utan granskade sidor, givarsidorna och `13fe619f`: 99, varav 20 är valda till omgång 15 (som dessutom tar fem
givarsidor vars färger står kvar på fyra bilder).

**Feedomgång 15 (2026-10-22, `tools/polish-assets/fargtillagg-15/`):** 25 sidor valdes och 23 skrevs: 24 färger och 24 bilder (alla feedbilder, bara
position 10) skrevs 11:46–11:50 UTC i en omgång (run 39773156590, plan sha `b20081e1…`), och live-kontrollen blev **ALLT OK** (11:57 UTC; golvlampan `08b40e95` och
klättersetet `638f2110` mättes om med `live-bilder.mjs`, eftersom färgen väljs med kort och inte med en axel). På de 23 sidorna gick färgvyerna med fyra bilder eller färre från 25 av 51
till 4: 24 vyer fick en bild var och två tappade en felbild. `ocr-live.py` och `live-dubbletter.py` på FÖRE-läget fann två felbilder som togs bort med `bilder-bort.yml` före skrivningen: en
måttbild med engelsk text (*Delivered in 2 cartons Assemble after 2 cartons have arrived*, `526d7fb5` Grå, 5 → 4) och en exakt dubblett (`b8002629` Svart, plats 2 och 5, pixelskillnad 0,0,
5 → 4). Position 10 gav 24 av 26: två ströks (en cykelkärra där ingen röd syns i färgen *Svart och Röd*, `5b3d3c58`, och paviljongtaket `60eaf40e` med engelsk säljtext över bilden, textyta 5,6 %),
och de två sidorna fick ingen bild. Text på rekvisitan (böcker, förpackningar) och märken tryckta på varan (*SPORTnOW* på boxningsstativet, *Mercedes-Benz* på gåbilen) ströks inte. Fyra vyer står
kvar på fyra: Svart på `3f7ef4a1` och `5a31b710` samt de två där en felbild togs bort. Position 10 ligger nu på 374 av 389 över omgång 5–15, och 79 sidor återstår ur `aosom-ordning.tsv`
(tolv av dem har redan använt position 10 eller saknas i flödet och går vidare med position 9, 8 och 3).

**Feedomgång 16 (2026-10-22, `tools/polish-assets/fargtillagg-16/`):** 25 sidor valdes och 22 skrevs: 24 färger och 24 bilder (22 feedbilder på position 10 och två till
för två vyer som tappade en felbild) skrevs 12:31–12:34 UTC i en omgång (run 39778978976, plan sha `e4f72d85…`), och live-kontrollen blev **ALLT OK** (12:41 UTC, alla 25
sidor; tvåaxelsidorna `75a38b7b`, `7bc96b8f` och `7d1fb82b` mättes med `live-farg-vy.mjs`). Färgvyerna med fyra bilder eller färre gick från 25 av 50 till 5, och bilderna i
vyerna från 235 till 256 (24 tillagda, tre felbilder borta). `ocr-live.py` (231 bilder) och `live-dubbletter.py` på FÖRE-läget fann tre felbilder med tysk text på två
publicerade sidor: två säljgrafiker på elskrivbordet `a1f16108` Vit (*Intelligente Steuertafel* och *Sicherheitskonzept*) och en måttbild på radiobilen `81eb4872` Blå med
*Gewichtsgrenze* och *Empfohlenes Alter*. De togs bort med `bilder-bort.yml` 12:30 UTC (torrt först, galleriet 9 → 7 respektive 9 → 8, återläst OK). Eftersom de två vyerna
då hamnade under fem hämtades en extra kandidatomgång för just de färgerna (`mal` = `wix-id:val-id`, positionerna 3, 8, 9 och 10, run 39776511393, fem bilder): Blå och
Vit fick var sin bild på position 10, medan position 3 (samma bild som färgens nuvarande tredje, avstånd 0) och position 8 och 9 (samma tyska säljgrafiker som just tagits
bort) ströks, så Vit står på fyra. I första körningen gav position 10 22 av 24: två ströks (en ersättningsduk till ett tunnelväxthus, `7beb7f2b` Vit, med engelsk ruta
*Note: Only cover included.*, och garagetältet `a165b178` Ljusgrå, vars bild redan låg på sidan med avstånd 0). Text på rekvisitan (bokryggar, förpackningar, en affisch)
och märken tryckta på varan (*SCOOTER* på sparkcykelns styre, *G-Class* på bilens front, *PawHut* på kattstugans etikett, ett *INNOVATE SPORT*-dekal) ströks inte. Ett
par på tvåaxelsidan `7d1fb82b` (Olivgrön, plats 2 och 5, pixelskillnad 10,2) är samma miljö med klot i 40 respektive 50 cm, där den andra är olänkad och visas för alla färger,
alltså *likt men olika*, och behölls. Fem vyer står kvar på fyra: Svart och Blå på `63fd748c` (position 10 låg redan i galleriet), Vit på `7beb7f2b`, Ljusgrå på `a165b178`
och Vit på `a1f16108`.

**Feedomgång 17 (2026-10-22, `tools/polish-assets/fargtillagg-17/`):** 25 sidor valdes och 22 skrevs: 22 färger och 22 bilder (alla feedbilder, bara position 10) skrevs
12:35–12:38 UTC i en omgång (run 39779571835, plan sha `4990c22f…`), och live-kontrollen blev **ALLT OK** (12:46 UTC; tvåaxelsidan `c3d1fa41` mättes med `live-farg-vy.mjs`).
På de 24 enaxliga sidorna gick vyerna med fyra bilder eller färre från 24 av 48 till 2, och bilderna i vyerna från 220 till 242. `kandidater` (run 39777488107, 12:20 UTC)
laddade upp 23 bilder, 0 missar; två färger saknar kandidat eftersom position 10 redan ligger i galleriet (`a37103bf` Svart och `c3d1fa41` Ljusgrå och svart). Position 10
gav 22 av 23: paviljongtaket `d01a6d2b` Beige ströks automatiskt för engelsk text (*Replacement / Gazebo Top Cover Only*, textyta 7,8 %). `ocr-live.py` (226 bilder) och
`live-dubbletter.py` på FÖRE-läget fann inga felbilder och inga par. Ett par flaggades bland kandidaterna: hantelsetet `db6f36b9` (position 10, avstånd 4 mot en bild på
sidan) är samma gymfoto med en beige hantel i stället för den gröna som den andra färgen visar, alltså färgens egen bild, och valdes. Två vyer står kvar på fyra: Svart på
`a37103bf` och Beige på `d01a6d2b`, plus Ljusgrå och svart på tvåaxelsidan.

**Feedomgång 18 (2026-10-22, `tools/polish-assets/fargtillagg-18/`):** de sista 17 av de 42 sidor som aldrig körts. 14 sidor skrevs: 15 färger och 17 bilder (14 feedbilder på position 10
och tre till för två vyer som tappade en felbild) skrevs 12:53–12:56 UTC i en omgång (run 39782098406, plan sha `50d3abf7…`), och live-kontrollen blev **ALLT OK** (13:02 UTC).
På de 17 sidorna gick vyerna med fyra bilder eller färre från 18 av 34 till 4, och bilderna i vyerna från 154 till 169 (17 tillagda, två felbilder borta). `kandidater` (run 39780134084,
12:39 UTC) laddade upp 14 bilder, 0 missar; två färger saknas i flödet (`e999206f` Mörkgrå och `fbd70dae`). `ocr-live.py` (152 bilder) och `live-dubbletter.py` på FÖRE-läget fann två
felbilder som togs bort med `bilder-bort.yml` 12:50 UTC (galleriet 9 → 8 och 10 → 9, återläst OK): en måttbild med engelsk ruta (*Delivered in 2 cartons Assemble after 2 cartons have
arrived*, `e5be35a4` Mörkgrå, samma sort som `526d7fb5` i omgång 15) och en bild som låg två gånger i samma vy (`f9de10ab` Svart och Röd, plats 1 och 3, avstånd 6, pixelskillnad 3,0,
bedömd med ögonen som samma foto). De två vyerna fick en extra kandidatomgång (run 39781688624 och 39781812180): Mörkgrå fick position 10 (position 3 var samma engelska grafik som den som
togs bort, avstånd 3, och ströks) och Svart och Röd position 8 och 9 (närbilder av lådornas skenor och av låset) utöver position 10. Position 10 gav 14 av 14. Ett par på `fbd70dae` (Sand, plats 1 och
5, pixelskillnad 35) är ett belyst foto av lyktan och dess måttritning, alltså *likt men olika*, och behölls. Fyra vyer står kvar på fyra: Natur på `dd08c210` och Vit på `e3340092`
(artikeln har ingen position 10), Orange på `ef20bec9` (position 10 låg redan i galleriet) och Mörkgrå på `e999206f` (saknas i flödet).

**Feedomgång 19 (2026-10-22, `tools/polish-assets/fargtillagg-19/`):** position 3, 8 och 9 för de 42 sidor som bara fått position 10 (omgång 10–18) och position 8 för de tio som fått position 10, 9 och 3
(omgång 8–9), alltså 52 sidor. `kandidater` (run 39784090088, 39784583300 och 39784817119, 13:07–13:13 UTC) laddade upp 100 bilder, 0 missar. 24 valdes (position 3: 6, position 8: 9, position 9: 9) och 76 ströks:
36 var samma foto som en bild färgens vy redan visar, 28 ströks automatiskt för textyta över 2,5 % (tysk säljgrafik) och tolv för hand. Nio av de tolv bär text eller märke: *Gewichtsgrenze* och *Empfohlenes Alter* över
måttbilden (`240d5d8f`, `a6b24d45` och `dd979cce` Rosa och Svart), *Lieferung in 2 Kartons* (`526d7fb5`), *Ersatzabdeckung nur für Pavillon* (`60eaf40e`, position 8 och 9) och leverantörens logotyp *PawHut* över
måttbilden (`2d65601c` Röd och Svart). Tre ströks av sifferkontrollen (`kolla-tal-mot-text.js`): trappans mått 38 × 20 mot sidans 38 × 22 × 12 (`44663e99` Grå), belastningen 220 kg mot sidans 150 kg (`4f21c7c1`
Mörkgrön) och en måttbild som bara gäller den lilla av två storlekar som delar färgvyn (`c3d1fa41`). `ocr-live.py` (592 bilder, 14 minuter) och `live-dubbletter.py` på FÖRE-läget fann inga felbilder och inga par.
Skrivet 13:35–13:38 UTC (run 39788194739, plan sha `b9fe26f8…`): 13 sidor, 13 färger, 24 bilder, alla `ok`, återlästa, med 1–4 rättade variantbilder per sida. **Live 13:45 UTC: ALLT OK**: alla 13 färger visar det
förväntade antalet (vyerna gick från 3–4 bilder till 5–7, 50 → 74 bilder) och ingen bild syns i en annan färgs vy. Resten av de 52 sidorna kunde inte lyftas: position 3, 8 och 9 är de som importen redan tog hem
(`RENA_BILDPOSITIONER`), så en kandidat där är oftast en bild färgen redan visar (36 av 100) eller en som poleringen strukit för tysk text (lärdom 156).

**Feedomgång 20 (2026-10-22, `tools/polish-assets/fargtillagg-20/`):** position 4–7 för de 35 färger på omgång 19:s 52 sidor som stod kvar på fyra bilder eller färre. `kandidater` (run 39786391830 och 39786705928,
13:23–13:27 UTC) laddade upp 134 bilder, 0 missar. 116 (87 %) ströks automatiskt för textyta över 2,5 %, och av de 18 som granskades för hand valdes nio: trädgårdsskåpet `dd08c210` Natur (stängt och öppet i en bild),
båglampan `2f31a1d9` Orange, dynan på gungan `485086d2` Gräddvit och Marinblå, vilfåtöljen `75e5fa26` Beige (tre) och elkaminen `e3340092` Vit (två; *DO NOT COVER* är tryckt på kaminen och ströks inte). De andra nio
ströks för tyska texter eller en collage med tyska etiketter (`12401205`, `e0a73975` ×2, `7beb7f2b`, `d348bf64`), för att de var samma foto som en bild som redan visas (avstånd 2 och 6) eller för att de upprepade en
scen som färgen redan visar (`75e5fa26` och `e3340092`). Position 4–7 gav alltså 9 bilder av 134 (7 %), mot 24 av 100 på position 3, 8 och 9 (omgång 19) och 374 av 389 på position 10 (omgång 5–15).
Skrivet 13:45–13:46 UTC (run 39789637247, filens sha256 `10b43a3f…`, planens sha `e80df14c…`): 5 sidor, 6 färger, 9 bilder, alla `ok`, återlästa, variantbilderna rättade (1–2 per sida). **Live 13:54 UTC: ALLT OK**: alla sex färger visar det förväntade antalet (vyerna gick från 3–4 bilder till 5–6, 23 → 32 bilder) och ingen bild syns i en annan färgs vy.

**Feedomgång 21 (2026-10-22, `tools/polish-assets/fargtillagg-21/`):** position 4–7 för 44 av de 45 sidor där en Aosom-vy visade tre bilder eller färre och position 4–7 aldrig provats (hamsterburen `13fe619f` hoppades över:
två axlar och bilder per storlek). `kandidater` i tre körningar (run 39790563998, 39791110471 och 39791686437, 13:51–14:03 UTC) laddade upp 376 bilder, 0 missar; sex färger saknas i feeden (`1c0b4b34`, `39319e6c` ×2,
`9304f8b8`, `a57587a8`, `d27a28ae`). 336 (89 %) ströks automatiskt för textyta över 2,5 %, och av de 40 som granskades för hand valdes 22: stoldynorna `39d10fc4` i fyra färger (två dynfoton och två tygprov, vars
färg jämfördes med dynornas medelfärg), förvaringsbänken `592a4bb2` Grå (tre), agilitysetet `8cf7b1bb` Orange och gul (tre), elbilen `b1b9afac` Vit (tre bilder mot vit botten; *RS e-tron GT* är tryckt på bilen),
verktygsvagnen `b920d526` Blå och Röd (tre var) och A-hindret `fdefa04b` Grå (tre). De 18 som ströks: tyska eller engelska texter (*Nur Kissen*, *Cushions Only*, *NEIGEFUNKTION*, *RUNDUMANSICHT* och flera), leverantörens
logotyp som motiv (`6575766f` ×2), en bild som redan visas (`a706542f`) och två vagnbilder som liknar färgens första (`b920d526` position 4). `ocr-live.py` (61 bilder på de sex sidorna) och `live-dubbletter.py` på FÖRE-läget
fann inga felbilder och inga par. Skrivet 14:16–14:25 UTC (run 39794286294, plan sha `561a1b62…`, filens sha256 `17ef2846…`): 6 sidor, 10 färger, 22 bilder, alla `ok`, återlästa, variantbilderna rättade (1–4 per sida).
**Live 14:33 UTC: ALLT OK**: alla tio färger visar det förväntade antalet (32 → 54 bilder i vyerna): stoldynorna 3 → 4 i fyra färger, bänken, agilitysetet, A-hindret och verktygsvagnens blå 3 → 6, bilen 4 → 7 och
verktygsvagnens röda 4 → 7. Position 4–7 gav 22 av 376 (6 %), alltså 31 av 510 över omgång 20–21.

**Feedomgång 22 (2026-10-22, `tools/polish-assets/fargtillagg-22/`):** de första utsnitten i färgbildsspåret sedan omgång 4. Underlaget var de 229 bilder ur omgång 21 som ströks automatiskt för textyta på vyer som
visade tre bilder eller färre. `tools/polish-gates/krop-forslag.py` läser textrutorna ur `ocr-boxar.py` och letar den största kvadrat som är minst hälften av bildens kortsida och som ligger 20 pixlar från varje ruta (högst tre
förslag per bild). En bild vars text bär ett förbehåll (*Hinweis*, *Nur*, *ohne*, *only*, *nicht enthalten*, *Zubehör* …) tas inte med, eftersom utsnittet hade klippt bort förbehållet och lämnat en bild som lovar mer än sidan
säljer. Det gav 154 förslag på 153 bilder och 61 färger, som granskades på 20 kontaktark, och **tolv höll (8 %)**: elbilen `211ffd83` (Gul två, Svart en), hundtrappan `2166c50f` Svart, cykelkärran `571e37bf` (Blå och svart,
Grå och turkos), metallskjulet `834c66fd` (Mörkgrå, Ljusgrå, Gråbeige), plastskjulet `a8e5db2d` Mörkgrå och eltraktorn `ec2d9402` (Orange, Grön). Resten ströks för att varan klipps av kvadraten, för infografikens pekare (en
brun prick med streckad linje vid vattenkokarens handtag, `bc2368af` ×3), för grafiken *2200 W* med lågor över kokaren, för en hand med fjärrkontroll (`b1b9afac`) och för kanten av en bildram. Tre rutor justerades före
uppladdningen: skjulens kvadrat flyttades så att hela skjulet ryms, hundtrappans flyttades under de tre små miniatyrernas vita ram och cykelkärrans gjordes större så att hjulen ryms. OCR sa REN på tio av tolv; skjulen gav ord
ur rekvisita i 1,5× (en förpackning, *BOSCH* på ett verktyg) och traktorerna *UUUUUUU* (kylargrillen, inte text). Utsnitten laddades upp i ETT anrop (12 av 12 parade mot adressens md5), och `dHash` mot varje bild på sidorna gav
lägst 56 (gränsen är 12). Skrivet 14:56–14:58 UTC (run 39800088135, plan sha `11a8680f…`, filens sha256 `cbe31146…`): 6 sidor, 11 färger, 12 bilder, alla `ok`, återlästa, 19 variantbilder rättade. Skyddskollen (12 av 12 i
galleriet, i städningens egen tolkning och kvar i Media Manager som `wix-utsnitt`) var grön. **Live 15:07 UTC: ALLT OK**: Gul 3 → 5 och de tio andra färgerna 3 → 4, och `live-dubbletter.py` fann 0 par.

**Alla 442 sidor i `aosom-ordning.tsv` har körts med position 10, omgång 19 tog position 3, 8 och 9, omgång 20–21 position 4–7 och omgång 22 gjorde utsnitt** (se `FLAGGADE.md`, lärdom 154, för hur "körda" räknades). Katalogkontrollen
(`katalogkontroll-farg-antal.js`, 36 sekunder över 6 143 produkter) 2026-10-22 15:08 UTC: **550 av 2 553 färgval visar fyra bilder eller färre** (fördelning 0: 1, 1: 80, 2: 89, 3: 113, 4: 267, 5: 1 560, 6 eller fler: 443),
mot 551 efter omgång 21, 557 efter omgång 20, 576 efter omgång 18 och 1 097 den 21 oktober. På Aosom-sidorna är det 247 vyer på 147 sidor (0: 1, 2: 6, 3: 47, 4: 193; 248 efter omgång 21, 254 på 151 sidor efter omgång 20, 273 på 167
efter omgång 18 och 798 på 442 den 21 oktober), och på AliExpress-sidorna 303 vyer på 96 sidor (oförändrat, spåret är pausat). Nollan är hamsterburen `13fe619f`, som har två axlar och visar bilder per storlek, så mätningen
gäller inte den. **54 av de 247 Aosom-vyerna visar tre bilder eller färre** (`tools/polish-assets/farger-fler-bilder-2026-10-21/svaga-aosom-2026-10-22-1507.txt`). Feedens position 3–10 är därmed provade för dem, och de som är
kvar är tyska säljgrafiker eller saknas i feeden. De 193 vyerna på fyra uppfyller Leonards minimum (*4 är godkänt*) och tas sist. Ett utsnitt lyfter en vy från tre till fyra och inte högre (se `FLAGGADE.md`, lärdom 159–160),
och om fler utsnitt ska göras är det ett beslut för Leonard.

#### Bildstädningen rör inte färgbilderna (kontrollerat 2026-10-22)

Leonards uppdrag 2026-10-22: se till att det som skrivits inte raderas av bildstädningen av misstag. Alla skrivna filer ur omgång 1–14
och givarrundan (`aosom-givare-1.json`, de tre med `struken` borttagna med flit) kontrollerades mot skarpa Wix vid 11:20 UTC: 329 sidor
och 862 filer. Verktyget är `tools/polish-gates/bygg-skyddskoll.py`, som bygger ExecuteWixAPI-kod med inbäddad data och kontrollsumma (den
läser bara). Kör om den efter en skrivning som kan röra gallerier.

| kontroll | utfall |
| :-- | --: |
| filen sitter i produktens galleri | **862 av 862** |
| städningens egen tolkning (`produktensMedianycklar`: huvudbild, galleri, valens länkar) ser den | **862 av 862** |
| Media Manager har filen kvar (`get-files`, state OK, READY) | **862 av 862** |
| Wix CDN serverar den (HEAD mot `static.wixstatic.com/media/<id>`) | **862 av 862 med 200** |
| största galleriet (Wix tar 50) | 34 |

I städningens ögon är 826 av filerna leverantörsfiler och 14 Wix-kopior (de som nattens läge raderar om de blir oanvända), 20 utsnitt (bara
det manuella läget `allt`, tidigast efter 7 dygn, standard 14) och 2 med annan källa. Nattens körning 2026-10-22 03:51 UTC gick igenom alla
läsare (loggraden `varianter: 10851 bilder från 6136 av 6125 produkter`), och de 116 testerna för städningen går igenom.

☠️ **Det som inte skyddas är en fil som inte sitter på någon produkt.** En uppladdad kandidat som ingen skrivit är oanvänd, och städningen
raderar den tidigast tre dygn efter att en körning först såg den oanvänd (karenstiden). Nattens körning är 03:50 UTC: en kandidat som
laddades upp före 03:50 UTC 2026-10-22 kan tidigast raderas 2026-10-25 03:50 UTC, en som laddades upp senare 2026-10-26 03:50 UTC. Godkända
kandidater skrivs därför i samma omgång (det tar några timmar) och de ratade städas bort med flit. En omgångs filer är skyddade först när
de sitter i galleriet, inte när de är uppladdade.

Fem egenskaper som inte ska tas bort:

1. ☠️ **Svaret är publikt.** Det bär bara Wix produkt-id, val-id, färgnamn, Wix egna fil-id
   och wixstatic-adresser, räknare och hinderkoder. Aldrig artikelnummer, feedens adresser
   eller Aosoms produktadress, och ett media-fel följer inte med, för det bär källadressen.
   Filnamnet byggs av wix-id, färgens plats och position, aldrig av källan.
2. ☠️ **En bild tillhör en färg.** En fil vars källa inte är en position hos färgens egen
   artikel blir `annan_kalla`. Ett par som klistrats fel ska inte bli en bild på fel färg.
3. ☠️ **Ingen bild faller ur galleriet och ingen länk tappas.** Huvudbilden och varje färgs
   första bild rörs inte, och de nya bilderna läggs efter färgens sista bild i galleriet och
   sist i valets `linkedMedia`. `kontrolleraLivsplan` fäller en plan som bryter det.
4. ☠️ **Galleriet skrivs vid fil-id, aldrig vid adress.** En wixstatic-adress får Wix att
   importera om bilden till en ny fil (se *Wix importerade om VARJE bild*).
5. ☠️ **Skrivningen kräver planens sha.** Planen räknas om ur färska läsningar i samma
   anrop, och har sidan ändrats sedan någon läste planen skrivs ingenting (409). Sha:n
   täcker filerna och deras alt-texter. Godkända kandidater måste skrivas inom karenstiden,
   tre dygn efter att bildstädningen först såg dem oanvända.

⚠️ **Positionerna är en gissning som kandidaterna prövar.** 3, 8, 9 och 10 är de som oftast
är rena (77, 80, 93 och 53 procent, uppmätt 2026-08-27 och 2026-09-30), men position 4–7 bär
nästan alltid tysk text. En färg som inte får fyra rena bilder ur feeden är en färg
leverantören inte har fler bilder för, och då stannar den på det antalet. Ett utsnitt
(`docs/polish/bildmetoder.md`, *Beskärning*) är den enda genvägen, och bara när utsnittet är
fritt från text och märke.

### Storleksvyer och andra enkla val: mätta först 2026-10-22

Leonards skärmbild 2026-10-22 18:29 UTC: växthusplasten `b729a465` (Aosom) visade **en** bild för storleken 6 × 10 m, fast galleriet har sex.
Färgkontrollerna kunde aldrig se den, eftersom `katalogkontroll-farg-antal.js` bara mäter sidor med en option som heter Färg. **Storlekar och andra
val (modell, volym, antal) var aldrig mätta förrän nu**, och allt ovan om *4 är godkänt* gäller färgvyer.

Butikens regel på en sida med EN option som inte är färg, kontrollerad live på 17 sidor (varje val stämde):

1. En länkad bild visas bara för det FÖRSTA val i optionen som länkar den.
2. En bild som inget val länkar är gemensam och visas för alla val.
3. Äger ett val ingenting och ingen bild är gemensam visar butiken hela galleriet (8 × 10 m på växthusplasten).

Verktyg i `tools/polish-gates/`, båda körs via ExecuteWixAPI:

- `katalogkontroll-val-antal.js` räknar varje val på sidor med ett enda val som inte är färg (36 s för hela katalogen). Svaret säger hur många sidor som
  hoppades över (`utanOption`, `endastFarg`, `flerAxlar`). Sidor med två axlar mäts live per kombination med `live-galleri.mjs`.
- `avlank-delade.js` lagar överlappande länkar: en bild som länkas från två eller fler val i optionen blir olänkad och därmed gemensam. ☠️ Den vägrar
  skriva om någon vy skulle få färre bilder, vägrar en färgoption och en sida med två axlar, rör aldrig galleriet och läser tillbaka länkar,
  varianternas id, SKU, synlighet och pris. Kör `variantbild.yml` (skarp, `ids`) efteråt; den svarade *redan rätt* på de två sidor som rättats.

Utfall 2026-10-22: av 5 092 publicerade sidor har 3 923 ingen option med två val, 910 bara färg, 49 två axlar och **210 ett enda val som inte är färg**.
Av de 210 har **115 sidor ett val på fyra bilder eller färre** (69 Aosom, 46 AliExpress) och **49 sidor ett val på tre eller färre** (98 val, 27 Aosom
och 22 AliExpress). Orsakerna är två. (1) Överlappande länkar, där ett senare val svälts: 17 sidor med svaga val, bara två Aosom (`b729a465` 1, 5, 6 → 6, 6, 6
och `0fda8bfe` 6, 1 → 6, 6, båda rättade samma dag och mätta live). (2) En artikel per storlek som fick få rena bilder kvar efter poleringen (hantelsetet
`cad08bfe`: 5, 5 och 2 av tolv), som behöver fler bilder. På de 37 sidor med två axlar som inte är kläder (186 kombinationer, live) har sju en kombination
på fyra bilder eller färre och ingen på färre än tre.

☠️ **Ett mått som kräver ett visst optionnamn mäter namnet, inte katalogen.** Räkna alltid de sidor ett mått hoppar över.

Öppet hos Leonard (PR #762:s lista *Väntar på Leonard*, mergad 2026-10-23): de 15 AliExpress-sidorna med överlappande länkar. Storlekarna på Aosom-sidor med få bilder (99 val på 67 sidor
efter de två rättade) gick till Leonard som fil 2 i Cowork-uppdraget 2026-10-22 19:25 UTC, se nästa avsnitt. Detaljerna står i `tools/polish-gates/FLAGGADE.md`
(lärdom 163 och 164).

### Cowork-rundan: bilder ur aosom.de:s galleri, plats 11 och uppåt (2026-10-22)

Leonard 2026-10-22 (efter att aosom.de visat 13 bilder där feeden har tio, lärdom 162): Claude Cowork-chatten surfar i hans Chrome och listar varje sidas
galleribilder, och jag laddar ner, granskar, laddar upp och kopplar dem. *"Och sen koppla dom som du gör, går det?"* (18:03 UTC) är beslutet att jag skriver de rena.
Två uppdragsfiler har skickats till honom. ☠️ **Båda bär Aosoms artikelnummer i länkarna** och ligger bara i scratchpad: de går bara till Leonard, aldrig
till repot eller en publik logg. Svaret från chatten (bildadresser på `img.aosomcdn.com`) bär inget artikelnummer.

| fil | rader | innehåll | skickad |
| :-- | :-- | :-- | :-- |
| 1, färger | 1–256 | 151 Aosom-sidor med färgvyer på fyra bilder eller färre: rad 1–54 tre eller färre, sedan 200 på exakt fyra, hamsterburen `13fe619f` sist | 18:21 UTC |
| 2, storlekar | 301–399 | 99 storlekar på 67 Aosom-sidor: 301–330 tre eller färre, 331–399 exakt fyra (svaret heter `val_pa_sidan`) | 19:25 UTC |

Uppdraget byggs ur `katalogkontroll-farg-antal.js` respektive `katalogkontroll-val-antal.js` (vilka vyer som är svaga) och `leverantorslankar.yml` (krypterat, ny
engångsnyckel per körning, `varianter[].val` ger länk per färg eller storlek). Chatten ändrar ingenting: den öppnar länken, läser galleriets räknare och adresser
(den stora versionen) och svarar med JSON, högst femton rader per block.

**Provomgången, rad 1–5 (svar 19:3x UTC).** Rätt färg på 5 av 5, 65 bilder i full storlek (1 600–2 000 px, noll byte-lika), och chatten lade själv bort Aosoms
infobanner och en dubblett. ☠️ **Därför är `antal` 1–2 högre än antalet adresser**, och förklaringen står i `anmarkning`: det är rätt, inget fel. Granskat mot
sidornas egna bilder (färgmedveten dHash, högst 12 = samma foto), OCR och kontaktark:

1. ☠️ **Galleriets första tio bilder är feedens, och de är redan körda.** På alla fem rader låg plats 1 och 2 (på flera också plats 10 eller 11) redan på sidan med
   avstånd 0. De rena nya bilderna ligger på **plats 11 och uppåt**, efter feedens tak.
2. **13 av 65 bilder (20 %) höll, på tre av fem vyer:** hundkärran Svart och Vit (`571e37bf`, 22 bilder) fick åtta rena detaljfoton på plats 15–22, hundkärran Gul
   (`1004b036`) fyra produktfoton på plats 11–14, och bänkdynan Mörkgrå (`a7aa9370`) dynans produktfoto på vit botten (plats 11, som den färgen saknade). Resten på
   de två kärrorna är tyska och engelska säljgrafiker (plats 3–9 och 11–14 på Svart och Vit). Bänkdynorna Ljusgrå och Mörkgrå (`c519b4fe`) gav inget nytt rent:
   de rena bilderna fanns redan, och resten är säljgrafiker eller foton med *Nur Kissen* eller *Cushions Only* över bilden (tre möjliga utsnitt, ingen gjord).
3. Skrivet 19:50–19:52 UTC: Svart och Vit 3 → 11, Gul 3 → 7, Mörkgrå 3 → 4. Återläst utan avvikelser, `variantbild.yml` 3 av 3 rättade, live 19:56 UTC rätt antal
   och de nya bilderna syns bara under sin egen färg.

Så tas ett svar emot, med verktyg i `tools/polish-gates/` (privata data i scratchpad, aldrig repot):

- `cowork-granska.py <svar> --rader <rader.json> --ut <katalog> --hamta --live <dir> --ocr <python>`: formkontroll mot raderna (antal mot adresser, värd, dubbletter,
  färgen sidan sa mot raden), nedladdning från den öppna bildservern (byte, pixlar, miniatyrer, byte-lika), jämförelse mot ALLA bilder på sidan (`live-bilder.mjs` eller
  `live-farg-vy.mjs` ger `<id8>.json`, `live-par.sh` gör många sidor) med NY eller FINNS, OCR (REN, SIFFROR, TEXT) och kontaktark. Den skriver aldrig länkar.
- `cowork-ladda.py urls|para|kod`: `urls` ger adresserna i omgångar om 25 för `UploadImageToWixSite`, `para` hämtar varje uppladdad fil från Wix CDN och paras med sin
  kandidat på md5, `kod` bygger ExecuteWixAPI-koden ur `skriv-fargbilder.js` (en fil per körning) ur `picks.json` (`{ "<rad>": [{ "k": plats, "alt": text }] }`).
- `skriv-fargbilder.js` (uppdaterad): READY-kontroll av varje fil, `axel` för andra optioner än Färg, sidor fyra i taget, och andra optioners länkar jämförs vid återläsning.
- Sedan `variantbild.yml` (skarp, `ids`), live per vy efter butikens cache, och dokumentera.

Fyra egenskaper som inte ska tas bort:

1. ☠️ **Uppladdningens svar ekar ingen käll-adress.** Ordningen är ingen bevisning: `cowork-ladda.py para` stoppar om en fil saknas eller saknar md5-träff.
2. ☠️ **En fil som inte är READY hamnar aldrig i ett galleri.** UploadImageToWixSite svarar PENDING, och `skriv-fargbilder.js` vägrar tills Media Manager säger READY.
3. ☠️ **Bara granskade bilder skrivs.** TEXT (tysk eller engelsk säljgrafik, logotyp som motiv) stryks, text på varan eller rekvisitan stryks inte (runbooken), och ett
   foto vars färg inte är sidans stryks. `picks.json` är det som är valt efter att ha tittat på kontaktarken, aldrig en lista som OCR gett.
4. **En plan per sida.** Flera rader på samma sida samlas i en skrivning, annars krockar revisionerna.

✅ `axel: "Storlek"` i `skriv-fargbilder.js` är provad torrt på tre riktiga sidor (2026-10-22 ca 20:42 UTC, `TORR = "fake"`, påhittade fil-id, ingenting skrivet), men
ännu inte skriven på någon. På en sida med ett enda val som inte är färg gäller butikens regel ovan: en länkad bild visas bara för det första val som länkar den, så en
ny storleksbild länkas till sin storlek och syns bara där, och en olänkad bild (`"gemensam": true` i picks.json) visas för alla storlekar. **Vymodellen stämmer: 151 av 151
val på de 67 sidorna i fil 2** (live-mätt med `live-par.sh` mot `vyerAv` i skriptet; alla 67 har en enda option och alla 151 val har minst en egen länkad bild).

Tre egenskaper som inte ska tas bort:

1. ☠️ **`TORR` (true, eller "fake" för påhittade fil-id) skriver ingenting** och returnerar planen och butikens vy före och efter per val. Kör `cowork-ladda.py kod --torr`
   (hasMutations false) före varje skarp skrivning av storlekar och läs att målet växer och att inget annat val minskar. En gemensam bild lyfter alla storlekar, en länkad bara sin egen.
2. ☠️ **Ett val utan egen länkad bild får inget tillägg** (planen vägrar: *har ingen bild att placera efter*). En första länk hade fått valet att visa bara den bilden och de
   gemensamma i stället för hela galleriet, alltså färre bilder än förut.
3. ⚠️ **Live-mätningens etiketter är butikens, planens är Wix.** Projektorduken `422ab1bd` heter 92 och 85 tum i Wix men visas som 234 och 216 cm i butiken. Skriptet
   matchar valet på Wix namn, och den privata live-filen får döpas om till dem (`cowork-granska.py` matchar etiketten och säger till när den inte hittar valet).

**Omgång 2, rad 6–54 (fyra block, bifogade som filer).** Chatten svarade på 49 rader. Rad 45 och 46 gav *färgen saknas* (färgväljaren på aosom.de hade inte
färgen, så `a57587a8` Rosa och `9304f8b8` Brun står kvar utan tillägg). De andra 47 raderna gav 551 bilder i full storlek, och infobannern var redan bortlagd (`antal` är
1–2 högre än antalet adresser, som förut). Granskat som provomgången (`cowork-granska.py`, OCR, kontaktark och mina egna ögon på varje ark):

| | bilder |
| :-- | --: |
| kandidater på 47 rader | 551 |
| redan i vyn (avstånd högst 12) | 136 |
| lika en bild i en annan färgs vy (samma pose i en annan färg, alltså ny för den här om ögat inte ser en nästan-dubblett i vyn) | 10 (fem valda, fem strukna) |
| nya | 405 |
| **valda och skrivna** | **72** på 44 rader (28 sidor) |

☠️ **Positionen avgör igen.** Plats 11 och 12 gav 50 av 67 kandidater (35 av 42 respektive 15 av 25), medan plats 1–10 bara gav 19 av 470 (13 av dem på plats 2, 3 och 9:
bilder som varken importen eller poleringen lagt på sidan) och plats 13 och uppåt 3 av 14. Allt på plats 4–8 är som förut tyska och engelska säljgrafiker. Tre rader gav
ingenting: `0926604b` Röd (allt rent låg redan i vyn), `91f5c078` Mörkgrå · 205 cm (k1 och k10 fanns, resten bär *Nur Schaukelabdeckung* eller tysk text) och `c131b430` Grå
(måttbilden fälldes i omgång 7, och k10 är en nästan-dubblett).

Nio saker som gäller nästa block:

1. ☠️ **Parallella uppladdningar får HTTP 429 av Aosoms bildserver.** Tre `UploadImageToWixSite`-anrop med 25, 25 och 21 adresser samtidigt gav elva `success: false` i det
   sista (*Failed to import image from URL (HTTP 429)*, en post per adress). De elva i ett eget anrop direkt efteråt gick igenom. Läs `success` på varje post, ladda upp ett
   anrop i taget och lägg bara om de adresser som föll. `cowork-ladda.py para` stoppar på en saknad fil, så ingenting skrivs utan att märkas.
2. ☠️ **Aosoms färgfält kan vara fel, och bilderna avgör.** Chatten flaggade rad 26 (frukostsetet `bc2368af`: sidan sa Beige, men titeln, artikelnumrets färgkod och alla bilder
   var det grå setet), rad 40 (hundbädden `01ac2f63`: fältet sa Svart, Vit, Brun, bilderna är den gråa) och rad 43 (Cremeweiß är bara ett annat ord för Krämvit). På rad 26 är det
   bildernas avstånd mot vår gråa vy som bevisar färgen (k1, k2 och k10 låg där med avstånd 0). Stryk aldrig en rad på färgfältet ensamt.
3. ☠️ **`FINNS?` mot en annan färgs vy är samma pose i en annan färg, alltså en ny bild för den här.** dHash är gråskala. Regnscenen på hundvagnen `d27a28ae` låg i Grås vy
   med grå vagn, och chattens bild var samma scen med blå vagn: den är Blås egen och valdes. Tvärtom stryks en bild som är samma färg och nästan samma pose som en bild i vyn
   (nio gånger: hundgrindarnas smala och breda uppställning på `5fa26137` och `6eb13a16`, samma packshot med och utan massagepunkter på kontorsstolen `6e810d9c` (tre färger),
   fotstödet i ett något annat läge på `4439afff` och `db13253d`, och trehjulingen `a76e97f1` med och utan minicykeln i hörnet). Avståndet avgör inte (de låg över gränsen 12), ögat gör det.
   ☠️ **Jag läste själv fel på etiketten en gång.** Cykelkärrans `1004b036` Svart k12 stod som `FINNS g=… (annan vy/gemensam)` och hoppades över som om den redan låg i
   vyn, men var ett nytt, rent packshot av den svarta och gråa kärran mot vit botten. Den hittades när jag gick igenom alla tio kandidater med den etiketten (en bild i taget mot
   färgens egen vy), laddades upp och skrevs 22:50 UTC (galleri 19 → 20, Svart 4 → 5, 0 avvikelser, `variantbild.yml` rättade 1 av 1, live ALLT OK 22:54). Det var den enda missen
   av de tio. `(i vyn)` betyder *i den här färgens vy*. `(annan vy/gemensam)` betyder att närmaste träff inte är det, och då ska ögat jämföra med färgens egen vy innan bilden
   hoppas över. `granskning.tsv` skiljer därför `finns i vyn` (136) från `liknar annan färgs vy` (10).
4. ☠️ **Måttbilder och tillbehör kontrolleras mot sidtexten innan de skrivs** (`kolla-tal-mot-text.js`, ren läsning). Gamingfåtöljens `6575766f` alla tal står i texten (maxbelastning 120 kg),
   och kontorsstolens `6e810d9c` Grå och Ljusbruna anger fler mått än texten (höjd 107–116 cm) men inget som säger emot. **Krämvit anger sitthöjd 45–55 cm mot sidans 46–56 och stryks.**
   Hundbädden `01ac2f63` har ett foto på en bärväska, men texten nämner ingen väska (noll träffar på väska, påse och ryggsäck), så bilden lovar mer än sidan säljer och stryks.
5. **Säsongsmotiv stryks som höstpumporna:** studsmattans julgran och present i bakgrunden (`39319e6c`, plats 10) kom inte med.
6. ⚠️ **Ett gränsfall är taget med och flaggat:** cykelkärran `1004b036` Svart fick två nya foton, kvinnan på elcykeln vid sjön och ett packshot (punkt 3). I det första säger en skylt *Radweg* och
   *Gemeinsam mehr erleben* (tysk text på en rekvisita, ungefär 3 % av bilden). Autostrykningen på textyta hade tagit bort den. Jag tog med den eftersom den är en skylt i ett foto och
   runbooken släpper text på rekvisita, men Leonard avgör (se FLAGGADE, öppna frågor). Märken som sitter tryckta på varan (*Vinsetto*, *PawHut*, *Outsunny*) stryks inte, men en
   bild där loggan är motivet gör det (närbilderna på nackkudden hos gamingfåtöljen `6575766f` och på lumbarkudden hos gamingstolen `4439afff`).
7. **Tvåaxliga sidor skrivs med färglänken ensam** (`91f5c078`, `6eb13a16`, `01ac2f63`, `8bc0dd26`). Hammocköverdragets nya bilder (rad 31, 177 cm) är miljöfoton utan tal, och
   177 cm-artikelns packshots lades inte till eftersom vyn redan har 205 cm-artikelns.
8. **Samma pose i två färgers svar är normalt** (frukostsetet, gamingfåtöljen, trampolinen, elbilarna). Varje fil länkas till sin egen färg (`skriv-fargbilder.js`), och
   dubblettkontrollen (`live-dubbletter.py`) jämför bara inom en färgvy.
9. ☠️ **Skyddskollens standardkörning kraschade på det nya katalognamnet.** `bygg-skyddskoll.py` sorterade `tillagg.json` på `fargtillagg-<siffror>` och föll på
   `fargtillagg-cowork-1` (`AttributeError`), vilket hade fällt den schemalagda kollen 2026-10-24 utan att något sagt det i förväg. Den hittades när jag körde
   standardanropet för att se att de nya filerna kom med. Sorteringen känner nu `fargtillagg-<N>` och `fargtillagg-cowork-<N>`, och ett okänt katalognamn avbryter
   i stället för att hoppas över (en hoppad plan lämnar filer utan skyddskoll). Standardkörningen ger 426 sidor och 1 101 filer i fyra anrop. Kör standardanropet
   efter varje ny katalog i `tools/polish-assets/`.

**Skrivet 22:33–22:36 UTC** (efter Aosoms prisfönster 21:12–21:29, före lagerfönstret 00:12): `skriv-fargbilder.js`, åtta sidor per körning i fyra körningar, 28 av 28 sidor
återlästa utan avvikelse (galleri, länkar, variant-id, SKU, pris, synlighet, andra optioners länkar), revision +2 per sida. `variantbild.yml` (skarp, `ids`, 22:37 UTC): **28 kontrollerade,
28 rättade**, 0 avvikelser (varukorgens bild per färg var fel på alla 28, som efter varje skrivning som rör galleriet). **Live 22:39–22:41 UTC** (`live-par.sh`, `kolla-live-farg.py`): **ALLT OK på 28 av 28 sidor**, varje tillagd fil syns i sin egen färgs vy och i ingen annans. De 44 färgvyerna gick från 130 till 202 bilder (tre på två, 40 på tre och en på fyra före; efteråt två på tre, 25 på fyra, 13 på fem, en på sex, två på åtta och en på nio), så 42 av 44 når fyra eller fler. Den 72:a bilden (kärran `1004b036` Svart, se punkt 3) skrevs 22:50 UTC, `variantbild.yml` rättade 1 av 1, och live 22:54 visade fem bilder i Svarts vy utan dubblett; mätningen 22:39–22:41 gjordes före den. De som står kvar på tre är växthusduken `a706542f` Vit och stolsdynorna `e76a4098` Ljusgrå, där chattens svar bara hade en ren ny bild. `live-dubbletter.py` fann ingen dubblett i en vy vi rört (ett par *likt men olika* i Svart på kontorsstolen `db13253d`, som vi inte rörde). ⚠️ **Butikens cache hade fyra av 28 sidor på gamla vyer fyra minuter efter skrivningen** (de som skrevs sist, 22:36): `kolla-live-farg.py` sa *saknas* på de fyra, och en omätning ett par minuter senare var rätt. Mät om bara de sidor som saknar filer innan du kallar dem trasiga.

**OCR över alla färgvyer** (`ocr-live.py`, 22:43–22:51 UTC, 367 unika bilder i de 44 vyerna, bara läsning, körd före den 72:a bilden): 171 REN, 38 SIFFROR och 158 TEXT. Jag tittade på
de 22 träffar som kunde vara främmande text, på kontaktark. **Ingen tysk eller engelsk säljgrafik ligger på någon av de 44 vyerna.** Träffarna är märken och dekaler tryckta på varan
(*HOMCOM*, *Outsunny*, *Vinsetto*, *PawHut*, *DEFENDER*, *DISCOVERY LAND ROVER*, *RS e-tron GT*, *TRICYCLE*, *Kart TOP DRIVER*), knappar och display på apparater (*CANCEL/DEFROST*,
*HIGH SPEED/LOW SPEED*, *Intensity* på en fjärrkontroll), text på rekvisita (bokryggar, en affisch med *Street Food*, figurinaskar, ett bildspel på en projektorduk) och våra egna
svenska kort (studsmattan `39319e6c`, elbilen `2f6ff71c`). Det enda engelska som sitter som en etikett är papperslappen på den hopvikta växthusduken hos `faa2bdb4` Vit och Grön
(*REPLACEMENT WALK-IN GREENHOUSE HEAVY DUTY COVER*), men den sitter på varan i fotot och låg på sidan före omgången. Den tyska skylten i kärrans foto (`1004b036`) är den enda
tyska text den här omgången själv lagt till (punkt 6).

### Delade måttbilder på storleksidor visas under fel storlek (2026-10-22)

Leonards skärmbild 22:31 (svensk tid) av skrivbordet `041fa621`: under 200 × 60 cm visades måttbilden för 180 × 60 cm. Den låg olänkad i galleriet (bild 8, alt-texten
slutade på *180 × 60 cm, bild 2*), och en bild som inget val länkar visar butiken för ALLA val. Givarens första bild var länkad till sin storlek och resten låg gemensamma.
Sammanslagningen länkar sedan 2026-09-30 alla givarens bilder till det nya valet, så sidan är troligen äldre (datumet är inte kontrollerat i historiken). Rättat 20:51 UTC med
`lank-om-bilder.js` (bara länkar: 180 × 60 cm 1 → 2, galleri, id, SKU, pris och synlighet orörda och återlästa utan avvikelse), och mätt live direkt efteråt: 200 × 60 visar sex bilder
utan 180-bilden och 180 × 60 sex med sin egen. Samma miljöfoto låg dessutom två gånger i galleriet (bild 2 och 3, pixelskillnad 0). Leonard sa ja till att ta bort den ena, och `bilder-bort.yml`
(torrt 21:10 UTC, skarpt 21:30 UTC med planens sha) tog bort bild 2, den med den allmänna alt-texten: galleriet 8 → 7, återläst (galleri, alt-texter, länkar, synlighet och varianter), och miljöfotot
med den beskrivande alt-texten är andra bild i båda vyerna. Live 21:38 UTC: 180 × 60 visar fem bilder och 200 × 60 fem, den borttagna syns inte i någon.

☠️ **En måttbild som anger ETT vals tal är inte gemensam.** På en färgsida delar färgerna oftast mått (frågan om gemensamma måttbilder står under *Väntar på Leonard*), men på en
storleksida anger bilden olika tal per val och motsäger de andra storlekarna. Kort som listar ALLA storlekar (*Tre storlekar med 10, 31 och 49 liter*, *WiFi eller 4G*, en
storleksguide) ska vara gemensamma. ☠️ **Ett antal visar inte felet:** skrivbordet hade sex bilder i vardera vyn både före och efter, och bara bilden avgör.

Skanningen `katalogkontroll-delade-malbilder.js` (läser bara, 32 s): av de 210 sidorna med ett enda val som inte är färg har 40 en olänkad bild vars alt-text nämner ett val eller är en
måttbild (18 på namn, 27 måttbilder utan nämnt val). Alla 45 bilderna granskades på kontaktark med OCR (`ocr-forgranska.py --tal`). De flesta är kort som listar alla storlekar, eller delar
mått mellan valen (västen, skivorna, stenarna, slalomstolparna), och står rätt. **Sju Aosom-sidor visade en måttbild för EN storlek under alla:** hönsgården `946d76bb` (3 × 2 m), terrariet
`ebf8a214` (30 × 30 × 30 cm), plyo-boxen `3a5e0e72` (61 × 51 × 41 cm), soptunnan `9d2c88bd` (30 liter), polytunneln `5556a448` (295 × 195 cm), hantelsetet `c6ff6fe8` (1, 3 och 5 kg) och buxbomen
`0fda8bfe` (varje storleks foto). Leverantören kontrollerades för resten med `polish-mapping.yml` (`las`, fältet `supplier` i den allowlistade loggen): sängramen `b996cd55`, soptunnan `dcd756bd`,
verktygslådan `370918a9` och byråerna `15c66a4d`, `57873e12` och `7b12a7f5` är Aosom, medan elementskyddet `675ba9bc` och förvaringslådan `a2a51783` inte har någon `supplier` (alltså AliExpress, som
huset räknar en rad utan fältet) och rörs inte utan Leonards ja. Sju sidor (`52a5d92b`, `4e58a5de`, `f258d141`, `834c9648`, `60f84a27`, `f6ab1dd4`, `1c883b87`) har en måttbild som gäller alla val
(samma mått eller en tabell över alla) och står rätt, och fyra sidor med rå valnamn (julgranen `6e72bacc`, lekhagen `147f159f`, mahjongbordet `250487a8`, jaktstolen `e0e6dd5a`) liknar
AliExpress och rörs inte utan ja.

**Leonards ja (2026-10-22) gällde dubbletten, de sju sidorna och tre till som torrkörningen visat säkra. Skrivet 21:31–21:34 UTC**, efter att Aosoms priskörning (21:20) loggat sin summering 21:21
(skrivningar går inte i :12–:29 vid synktimmarna). `bygg-lank.py` byggde skripten ur en spec (`[{id, axel, val: {valets namn: [hex6]}}]`) och `lank-om-bilder.js` skrev dem via ExecuteWixAPI, tre sidor
per körning. Varje körning läste tillbaka valens länkar, galleriets ordning, varianternas id, SKU, synlighet och pris, andra optioners länkar, namn och adress: **10 av 10 utan avvikelse**, revision +1
per sida. `variantbild.yml` (skarp, `ids`, de tio och skrivbordet) rättade varukorgens bild på 10 av 11 sidor och fann en redan rätt, 0 avvikelser. **Live 21:37 UTC** (`live-par.sh` och det nya
`kolla-delade-live.py`): varje måttbild syns under sin egen storlek och under ingen annan, ingen storlek visar färre än fyra bilder, och antalet per storlek är det modellen räknade fram på 10 av 10
sidor.

| sida | storlek: före → efter (butikens vy) |
| :-- | :-- |
| hönsgården `946d76bb` | 3 × 2 m 4 → 4 · 3 × 4 m 5 → 4 · 3 × 6 m 5 → 4 |
| terrariet `ebf8a214` | 30 × 30 × 30 cm 4 → 4 · 50 × 30 × 25 cm 5 → 4 · 50 × 30 × 35 cm 5 → 4 |
| plyo-boxen `3a5e0e72` | 61 × 51 × 41 cm 5 → 5 · 51 × 48 × 41 cm 5 → 4 · 76 × 61 × 51 cm 5 → 4 |
| soptunnan `9d2c88bd` | 50 liter 5 → 4 · 30 liter 4 → 4 |
| polytunneln `5556a448` | 295 × 195 cm 4 → 4 · 395 × 297 cm 5 → 4 |
| hantelsetet `c6ff6fe8` | 1, 3 och 5 kg 5 → 5 · 3, 4 och 5 kg 5 → 4 |
| buxbomen `0fda8bfe` | 90 cm 6 → 5 · 115 cm 6 → 5 |
| sängramen `b996cd55` | 140 × 200 cm 6 → 6 · 90 × 200 cm 6 → 5 |
| soptunnan `dcd756bd` | 58 liter 5 → 5 · 48 liter 5 → 4 |
| verktygslådan `370918a9` | Två lådor 5 → 5 · Fyra lådor 6 → 5 |

Fyra egenskaper som inte ska tas bort:

1. ☠️ **Kontrollen kan fälla.** `kolla-delade-live.py <spec.json> <katalog> <prefix> [--fore <katalog> <prefix>]` kräver tre saker per sida: bilden syns under sitt eget val, under inget annat, och varje val
   visar minst fyra bilder. Mot mätningen FÖRE rättningen gav den **14 avvikelser på exakt de tio sidorna** och efter rättningen noll. En kontroll som aldrig prövats mot felet den ska fånga kan inte skilja ett
   rent resultat från ett blint.
2. ☠️ **Rättningen sänker de andra storlekarnas antal, och det är rätt.** Bilden visades under en storlek den inte gäller. Sjunker en vy under fyra av det skälet väntar sidan på nya bilder i stället för att
   felbilden får ligga kvar. Det gäller byråerna `15c66a4d` (4 lådor 2 → 2, 5 lådor 5 → 4), `7b12a7f5` (3 lådor 3 → 2, 6 lådor 6 → 5) och `57873e12` (4 lådor 4 → 3, 5 lådor 5 → 5), som torrkörningen
   2026-10-22 21:1x UTC visade. De är rad 326, 327 och 380 i Cowork-filen för storlekar, och rättas i SAMMA skrivning som de nya bilderna (`skriv-fargbilder.js` med `axel: "Storlek"` och
   `"gemensam": true` i picks.json för en bild som ska gälla alla).
3. ☠️ **Leverantören kontrolleras före skrivningen.** En sida utan `supplier` räknas som AliExpress och rörs inte utan Leonards ja, hur lik den än är en Aosom-sida (`675ba9bc` och `a2a51783`).
4. **Hexkoderna är de sex första tecknen efter `b379ce_`** och ska ge exakt en träff i galleriet; `bygg-lank.py` avbryter annars, och lägger de nya länkarna i galleriets ordning utan att släppa en gammal länk.

### Tvåaxliga sidor: färgfoton på färgen, ett kort per storlek (2026-10-23)

Leonards skärmbild 2026-10-23 00:16 (svensk tid) av soptunnan `c841717c` (Aosom, tre fack i rostfritt stål, Storlek 45 och 60 liter × Färg Svart och Silver, 1 959 kr): med Silver och 60 liter valda
var andra bilden en kvinna i ett kök med en **svart** tunna och tredje en svart tunna. Leonard: *"storleken o färgen har blandade bilder"*, och bad mig rätta sidan (*"kommer du typ fixa denna"*).
Det var hans ja för just den här sidan.

Mätt live per kombination (`live-galleri.mjs`), galleriets plats som siffra (1–7 svarta bilder, 8–14 silverbilder):

| kombination | butikens vy före | efter |
| :-- | :-- | :-- |
| 45 liter × Svart | 2 · 1 · 3 · 4 · 5 · 14 | 1–7 |
| 45 liter × Silver | 8 · **1** · **4** · **5** · 9–14 | 8–14 |
| 60 liter × Svart | 2 · 3 · 4 · 6 · 7 · 14 | 1–7 |
| 60 liter × Silver | 8 · **4** · **6** · **7** · 9–14 | 8–14 |

Sidan hade länkade bilder på **båda** optionerna: Storlek 45 liter länkade den svarta packshoten (1) och en svart måttskiss (5), 60 liter en svart packshot (6) och en svart måttbild (7), eftersom givarnas
första bilder var svarta, och Färg länkade två svarta lifestylefoton till Svart och sex silverbilder till Silver. Två bilder var olänkade, det svarta köksfotot (4) och silvertunnans måttbild för 45 liter (14).
Silver fick därför svarta bilder via storleken och via den olänkade, och Svart fick silvertunnans måttbild.

☠️ **Varukorgens bild var fel på alla fyra varianter.** Wix räknade variantens bild ur storlekens länkar (regeln nedan), så Silver fick en svart tunna i varukorgen, kassan och ordern.
`variantbild.yml` kunde inte laga det: `forvantadBild` räknade då ett snitt mellan optionernas länkar, snittet var tomt för varje kombination (`inget_snitt`), och rutten rapporterade det som `okanda`,
rättade ingenting och gav ingen röd körning. (Motorn rättades samma natt, se *Motorn rättar nu sidor med länkar på båda optionerna* nedan.)

Rättat med `lank-om-bilder.js`, bara länkar, två planer på samma sida (Färg, sedan Storlek med `tomt`): **Svart länkar alla sju svarta bilder (1–7), Silver alla sju silverbilder (8–14) och Storlek inga.**
Galleriets ordning, varianternas id, SKU, pris, lager och synlighet och produktens namn och adress orörda (revision 36 → 38, 0 avvikelser i återläsningen). `variantbild.yml` rättade 1 av 1 (Svart → svart
packshot, Silver → silverpackshoten; revision 39). Skrivet 23:46–23:47 UTC, före Aosoms lagerfönster 00:12–00:29. Live 23:5x UTC (sidans cache renderad 23:50:51, efter skrivningen): Svart visar 1–7 och Silver 8–14 i båda
storlekarna, priserna 1 299, 2 029, 1 959 och 1 179 kr oförändrade. Silver 45 liter är slutsåld sedan 2026-10-17 (lagret orört). Skärmbilder med en mobilstor webbläsare av 60 liter × Svart och × Silver visar rätt färg.

#### Det som inte går att rätta med länkar: en måttbild som visar EN färg i EN storlek

Leonards nästa meddelande samma natt: *"specifikationsbilderna är inte helt rätt på den. Om jag väljer storlek 45 liter så finns 60 liter specifikation bild med och om jag väljer 60 finns 45 med."* Det är
fem bilder som var och en visar en färg i en storlek: svart 45 (5), svart 60 (7), silverkortet för 60 (9), ett silverfoto med 60-litersmåtten inritade (10) och silvertunnans måttbild för 45 (14).

Butiken visar för en kombination bilder som **ägs** av färgens eller storlekens val, plus de olänkade. Sidans egen data säger det rakt ut: `imageOwners` är en karta från bild till ETT val (det första som
länkar den), `variantTable[].image` är Wix bild för varje variant och `variantAxes` är väljarna. Hämta sidan med `curl`, byt `\"` mot `"` och läs dem för att se vad butiken kommer att visa utan webbläsare.
Det finns ingen skärning: en bild som ägs av *45 liter* syns under båda färgerna, och en som ägs av *Silver* syns under båda storlekarna. Wix egen dokumentation för V1 säger samma sak (*"media items can only
be set for choices within one option at a time"*). Det som går är bilder som är **färgneutrala och storleksspecifika**, länkade till storleken, och färgfoton som är storleksneutrala, länkade till färgen.

#### Wix:s regel för variantens bild (mätt 2026-10-23 på tre dolda testprodukter, raderade direkt efteråt)

| skrivning (Storlek och Färg har länkade bilder, Storlek först) | variantens bild |
| :-- | :-- |
| länkarna skrivna med `products` PATCH och val-id | huvudbilden för alla fyra (☠️ se rättelsen nedan: det var **nollställd**, inte oförändrad) |
| namn-skrivning (`products-with-inventory`, valen bara med namn), valen Storlek först | **storlekens första bild** (S → kort 1, L → kort 2, båda färgerna) |
| samma, men bara optionerna omvända, varianternas val kvar Storlek först | samma: storlekskortet |
| samma, optionerna OCH varje variants val Färg först | **färgens första bild** (Svart → svart, Silver → silver), kvar efter en omskrivning |

Regeln: **variantens bild är första länkade bilden hos det första valet i variantens egen `choices`-lista som har länkade bilder**, och den räknas om bara vid en namn-skrivning. Optionernas ordning ensam
räcker inte, och Wix tar emot en ändrad optionsordning (`optionsordning` gick från *Storlek > Färg* till *Färg > Storlek* i en PATCH). `forvantadBild` i `lib/wix/variant-media.ts` räknade då ett snitt i stället (borttaget samma natt, se nedan),
och på de åtta sidorna nedan (25 varianter), där snittet är tomt för någon kombination, var den lagrade bilden inte huvudbilden på någon av dem som skiljde sig (till exempel Svart × 99 tum på projektorduken
och alla fyra varianterna på förvaringskistan) utan alltid första bilden hos första valet.

☠️ **Rättelse 2026-10-23 ca 02:20 UTC: en id-skrivning av optionerna NOLLSTÄLLER variantens bild till huvudbilden.** Första raden i tabellen sa *oförändrad*, men variantbilden var redan huvudbilden i det provet, så
det gick inte att skilja *oförändrad* från *nollställd*. Ett nytt prov på en dold testprodukt (Storlek > Färg, färgerna länkade, raderad direkt efteråt) skilde dem åt:

| steg | Silvers variantbild |
| :-- | :-- |
| namn-skrivning (valen Storlek, Färg), bara färgerna länkade | **Y1**, färgens första foto |
| id-skrivning som omordnar Silvers lista (Y2, Y1) | **X1**, huvudbilden (nollställd, inte Y2) |
| namn-skrivning | **Y2**, färgens nya första foto |
| id-skrivning som länkar storlekarna (båda optionerna har länkar) | **X1**, huvudbilden igen |
| namn-skrivning med varianternas val Färg, Storlek och optionerna kvar Storlek > Färg | **Y2**, färgens första foto |

Följden är större än den här sidan. `lank-om-bilder.js`, `bygg-agare.py`, `avlank-delade.js` och `bilder-bort.yml` skriver optionerna med val-id, och varje sådan skrivning nollställer variantbilden på sidan.
`variantbild.yml` och nattens `/api/cron/variantbild` rättade det på sidor där `forvantadBild` kunde räkna (länkar på EN option), men på en sida med länkar på båda optionerna var snittet tomt (varje bild har en
ägare, så listorna har aldrig något gemensamt), och en variant utan förväntan hoppades över (lagat i motorn samma natt, se *Motorn rättar nu …* nedan). Sådana sidor förblir nollställda tills någon kör en namn-skrivning med färgen först. Det hände soptunnan
`c841717c` (`bilder-bort.yml` 00:51 UTC, två minuter efter att namn-skrivningen satt Silver → silverpackshoten; `variantbilder: rätt` i den körningens svar betydde bara att ingen förväntan fanns) och
alla 16 sidor nedan. Variantens egen valordning styr, inte optionernas: med varje variants val Färg först och optionerna kvar Storlek > Färg räknar Wix variantens bild ur färgens första foto även
när storleken också har länkar. Det betyder att optionerna inte behöver läggas om (som på soptunnan och förvaringskistan) för att varukorgen ska visa rätt färg.

☠️ **Ett galleritillägg nollställer också variantens bild** (mätt 2026-10-23 03:4x UTC på tre publicerade sidor, inte på en testprodukt). `galleri-tillagg.js` lägger filer sist i galleriet med en `products` PATCH och
fältmask `media`, och efteråt var Wix variantbild huvudbilden: på hammocken alla sju varianter (`1d1a5b`), på kantskydden Flerfärgad × Ø244 (`15ac19` → `13c2a1`) och på hundbädden Ljusgrå och svart × 75 × 51 × 18 cm
(`aef2eb` → `49d9fa`). Skrivningen rör varken valens länkar, varianternas id, SKU, pris eller lager (jämförs före och efter), men den räknar om variantbilden till huvudbilden. Kör alltså `variantbild-farg.js` (två optioner) eller
`variantbild.yml` (en option) efter varje galleriskrivning, som efter varje id-skrivning av optionerna.

☠️ **Och en annan bild än Wix egen heter också "variantens bild" i sidans data.** `variantTable[].image` i butikens sidodata är butikens uträkning ur färgvalets första länkade bild
(`lib/variant-price.ts`, `v3MultiVariantData`: färgens `linkedMedia[0]`, annars första axelns), inte Wix `variantsInfo.variants[].media`. Det är butikens första bild i galleriet för valet
(`synligaBilder` lägger den först), och den ändras av en listas ORDNING men aldrig av en nollställning. Varukorgen, Wix kassa och ordern läser Wix variantbild. Därför kunde
katalogkontrollens `VARUKORG` vara 0 medan Wix variantbild var huvudbilden på alla 16 sidor. Wix sida mäts med `tools/polish-gates/variantbild-farg.js` i torrläge (nedan).

#### Katalogkontrollen och de åtta sidorna

`katalogkontroll-tva-lankade-optioner.js` (35 s, bara läsning): av 5 092 publicerade sidor har 49 två optioner med minst två synliga val, och **8 har länkade bilder på båda**, alla med tomt snitt för någon
kombination. Ett tomt snitt är ingen defekt i sig. De åtta mättes live per kombination med den lagade `live-galleri.mjs` och mot sidornas `variantTable`:

| sida | vad kunden ser | åtgärd |
| :-- | :-- | :-- |
| hundgrinden `6eb13a16` | rena vyer, varukorgens bild rätt | ingen |
| bänkdynan `a7aa9370` | rena vyer (varje färg finns i en storlek), varukorgens bild rätt; Ljusgrå visar två bilder | ingen |
| vedboden `4a2ab58e` | rena vyer, varukorgens bild rätt (150 × Mörkgrå och 213 × Grön är slutsålda) | ingen |
| tunnelväxthuset `5466fe81` | rena vyer; Grön × 397 visar tre måttbilder (397 två gånger, 597 en gång) | låg |
| buxbomsklotten `7d1fb82b` | en olänkad 50 cm-bild visas under 40 cm; 50 cm-bilderna nämner ingen färg | låg |
| projektorduken `926ec7a2` | storlekarnas bilder visas **aldrig**: butikens `imageOwners` bär etiketten *85 tum (216 cm)* medan väljaren säger *85 tum*; färgen Svart har ingen variant i 85 tum | butiksfel, se nedan |
| hamsterburen `13fe619f` | ☠️ Naturträ × 85 × 45 visar de fem bilderna av den grå burens storlek och varukorgen en grå bur | kan inte rättas med länkar, Leonard avgör |
| förvaringskistan `b129d5ae` | ☠️ varukorgens, kassans och orderns bild var storlekens måttkort på alla fyra varianter (Storlek först, storlekarna bär länkar) | rättad 2026-10-23 med Leonards ja: Färg först och en namn-skrivning (`farg-forst.js`), se *Förvaringskistan* nedan |

(Kolumnen *varukorgens bild* i tabellen är läst ur sidans `variantTable`, alltså butikens uträkning. Wix egen variantbild mättes för alla 49 sidor först 2026-10-23 02:5x UTC, se *Biverkningen* under *De 16 sidorna rättade*.)

Hamsterburen har tre varianter (100 × 52 Mörkgrå, 85 × 45 Mörkgrå, 85 × 45 Naturträ) och tre bildset. Med unionen går det inte att ge Naturträ bara sina fem och Mörkgrå × 85 × 45 bara sina: det kräver
att valen blir ett enda (*100 × 52 Mörkgrå* med flera). Förvaringskistan har färgfoton på färgen och ett måttkort per storlek: den får Färg först och en namn-skrivning, som soptunnan.

☠️ **Projektorduken är ett fel i BUTIKEN (headless-site), inte i motorn.** Sidans data har två etiketter för samma val, och storleksbilderna matchas mot den som inte stämmer med väljaren. Det finns inget
att göra här, men en storleksbild på en sida där butiken lägger till ett måttord i etiketten visas aldrig. Sidans Wix-data är rätt (`85 tum`).

Fem saker som inte ska tas bort:

1. ☠️ **På en tvåaxlig sida bär EN option bilderna.** Länkar på båda optionerna ger blandade vyer, och en bild som visar en färg i en storlek kan aldrig visas för just den kombinationen. Undantaget är
   färgneutrala måttkort som länkas till storleken.
2. ☠️ **Variantens bild kommer från första valet i variantens `choices`-lista som har länkade bilder.** Skriv Färg först i varje variants val (optionernas ordning behöver inte ändras) och gör en namn-skrivning efteråt.
   En skrivning med val-id (`lank-om-bilder.js`, `skriv-fargbilder.js`, `bilder-bort.yml`) räknar inte om bilden utan NOLLSTÄLLER den till huvudbilden (rättelsen ovan), så `variantbild-farg.js` ska följa efter varje sådan
   skrivning på en sida med länkar på båda optionerna.
3. ☠️ **Läs sidans `imageOwners` och `variantTable` innan du kallar en sida rätt eller fel.** Räknarna i katalogkontrollerna ser länkar, inte vad butiken gör av dem, och en mätning ensam (`live-galleri.mjs`)
   visar bara vyn, inte varför.
4. ☠️ **Mät en kombination i taget, med valen uppslagna på namnet.** `live-galleri.mjs` letade upp valen på etiketten som stod när listan lästes, och den ändras med det andra valet (*Beige – finns inte i
   100 cm*, *150 cm – slut i lager*). Klicket missade då varje färg som saknades i den storlek som var vald, och raden visade föregående färgs galleri (buxbomsklotten Olivgrön och bänkdynan Ljusgrå).
   Lagat 2026-10-23: valet letas upp på namnet före ` – `, i den färska sidan, vid varje klick.
5. ☠️ **En ny test kräver en dold testprodukt som raderas direkt.** De tre testerna ovan gjordes mot `products-with-inventory` (POST, tre PATCH och DELETE, 11–15 s per körning), med bilder som redan låg
   i Media Manager. Produkten raderades i en `finally`, och en läsning efteråt gav 404.

#### Korten per storlek: `runda-bilder-soptunna-storlekskort` (2026-10-23)

Fem måttbilder går inte att rätta med länkar (se ovan), så de ersattes av **två färgneutrala kort, ett per storlek**: `c841717c-45` och `c841717c-60`, byggda med `bygg-kort.py` ur `kort.tsv` (kortgrinden 0 fynd,
två jämförelser mot sidans parentesrader kvitterade i `kort-avvik.txt`: sidan skriver båda storlekarna på samma rad och grindens parentesstrippning tar bort 60-litersvärdet). Fotot är en svart och en silvertunna
sida vid sida (kortet säger *Svart eller silver*), siffrorna kommer ur sidans text (mått 61,9 × 36,6 × 43,2 respektive 56,7 cm, 3 × 15 respektive 3 × 20 liter, fraktvikt 9,8 respektive 11 kg) och
etiketten är *Fraktvikt*, som sidan säger. Korten ligger i grenen, var uppladdade (`b379ce_255c27…` och `b379ce_4731c0…`, byte-lika med de lokala filerna, READY) och skrevs med `skriv-storlekskort.js`
(byggt av `bygg-storlekskort.py` ur `storlekskort-plan.json`; planens FNV-summa räknas om i skriptet). Leonard sa ja 2026-10-23 strax före 00:50 UTC, och skrivningen gjordes 00:49 UTC, före Aosoms
lagerfönster 03:12.

`skriv-storlekskort.js` gör fyra steg, var och ett med återläsning: korten sist i galleriet med alt-text, korten länkade till sin storlek och optionerna Färg först (id-skrivning), varianterna omskrivna med
valen bara med namn och Färg först (namn-skrivning, så att Wix räknar om variantbilden), och en jämförelse av allt som inte ska ändras (varianternas id, SKU, pris, kostnad, synlighet och lager, namn, adress,
färgens länkar och galleriets gamla bilder). Faller länkningen rullas galleriet tillbaka. Det vägrar en storlek som redan bär länkade bilder och ett färgval utan länkade bilder. Torrkörningen 00:3x UTC
(ingenting skrivet) gav `galleri 14 → 16`, `Storlek > Färg` → `Färg > Storlek` och en vy per kombination på de sju färgbilderna plus storlekens kort.

☠️ **Skrivningen är också provad på riktigt, på en dold testprodukt av samma form** (14 filer ur soptunnans galleri, Storlek 45 och 60 liter × Färg Svart och Silver, färgerna länkade, storlekarna olänkade, en lagerrad per
variant). Svaret var `ok: true` med 0 avvikelser, `revision 2 → 5`, `galleri 14 → 16`, optionerna `Färg > Storlek` och variantbilderna Svart → svart packshot (båda storlekarna) och Silver → silverpackshoten (båda storlekarna).
Varje vy visade de sju färgbilderna plus sin storleks kort som sista bild. Testprodukten raderades direkt efteråt, och en läsning gav 404. Torrkörningen ser vad som ska ske, men bara en riktig skrivning visar
att Wix räknar om variantens bild, så en ny sådan sida ska provas på samma sätt först.

De fem gamla måttbilderna togs bort **efteråt** med `bilder-bort.yml` (torrt, sedan skarpt med planens sha), så att ingen vy någonsin visar en bild utan ägare. Efter borttagningen har Svart fem bilder
(1, 2, 3, 4, 6 i det gamla galleriet) och Silver fyra (8, 11, 12, 13), plus ett kort per storlek: varje kombination visar fem bilder.

☠️ **Utfallet på soptunnan, skrivet 2026-10-23 00:49 UTC:** `ok: true`, 0 avvikelser, revision 39 → 42, galleriet 14 → 16, optionerna `Färg > Storlek` och variantbilderna Svart → svart packshot (`9a66fa`)
och Silver → silverpackshoten (`c63be6`) i båda storlekarna. Varianternas id, SKU, pris, kostnad, synlighet och lager var orörda. `bilder-bort.yml` tog bort de fem måttbilderna direkt efteråt (torrt 00:50 UTC,
run 39880507743, skarpt 00:51 UTC, run 39880590274, planens sha `a6438d5f…`): galleriet 16 → 11, återläst (galleri, alt-texter, länkar, synlighet och varianter), `variantbilder: rätt`, revision 44.
Galleriet är nu Svart 1–5, Silver 6–9, kortet för 45 liter (10) och kortet för 60 liter (11); varje storlek länkar bara sitt kort.
☠️ **Variantbilden nollställdes av just den borttagningen och rättades först 02:3x UTC.** `bilder-bort.yml` skriver valens länkar med val-id (se rättelsen under *Wix:s regel för variantens bild*), och
Wix gjorde då Silver → `9a66fa`, huvudbilden, på alla fyra varianterna. `variantbilder: rätt` i körningens svar betydde bara att `forvantadBild` då inte kunde räkna (`inget_snitt`). Mätt 02:2x UTC med
Wix egen läsning, och rättad 02:37 UTC med `variantbild-farg.js` (Silver → `c63be6`, revision 44 → 45, 0 avvikelser). Wix variantbild, som varukorgen, kassan och ordern läser, var alltså den svarta tunnan för
Silver i ungefär 1 tim 45 min. Ingen order lades under fönstret: Search Orders utan statusfilter 2026-10-23 ca 03:00 UTC gav inga ordrar efter 10116 (2026-10-22 20:50 UTC). Varukorgar som aldrig blev order går inte att kontrollera.

**Live 01:0x UTC** (butikens cache renderad 00:55:51, efter sista skrivningen 00:51:31; `live-galleri.mjs` en kombination i taget): Svart × 45 liter visar de fem svarta fotona och 45-kortet (1 299 kr),
Svart × 60 liter de fem och 60-kortet (2 029 kr), Silver × 45 liter de fyra silverfotona och 45-kortet (1 179 kr, slutsåld sedan 2026-10-17) och Silver × 60 liter de fyra och 60-kortet (1 959 kr). Varje storlek
visar bara sitt eget kort, och ingen kombination visar en bild av fel färg. Väljaren står Färg före Storlek. Mobilskärmbilder av Silver × 45 och × 60 liter visar silvertunnan som första bild.

#### Förvaringskistan: samma recept utan kort (`farg-forst.js`, 2026-10-23)

Leonards andra ja (2026-10-23, strax före 00:50 UTC) gällde förvaringskistan `b129d5ae`. Den har två färger (Mörk Khaki och Vit) × två storlekar (M och L), färgfotona länkade till färgen och ett måttkort per
storlek (`531e6d` för M och `2a5942` för L) länkat till storleken. Vyerna var rena, men optionerna och varje variants val stod Storlek före Färg, så Wix räknade variantens bild ur storlekens första länkade
bild: varukorgens, kassans och orderns bild var storlekens måttkort på alla fyra varianter. Galleriet, länkarna och korten behövde inte röras, bara ordningen.

`farg-forst.js` (byggt av `bygg-farg-forst.py` ur `farg-forst-plan.json`, planens FNV-summa räknas om i skriptet) är den avskalade delen av `skriv-storlekskort.js`: steg A lägger Färg före Storlek i optionerna
(id-skrivning med `options`, `variantsInfo` ordagrant ur GET:en och `visible`), steg B skriver varianterna om med valen bara med namn och Färg först (`products-with-inventory`, så att Wix räknar om variantens
bild) och steg C läser tillbaka allt: galleri och alt-texter, optionernas ordning, varje vals länkar, varianternas id, SKU, pris, kostnad, synlighet och namn, produktens namn, adress och synlighet och lagret.
Varje variants bild ska vara färgens första länkade foto och valen ska stå Färg först. `TORR` skriver ingenting och visar variantbilderna före och efter samt butikens vy per kombination.

Tre egenskaper som inte ska tas bort:

1. ☠️ **En färg utan länkade bilder avvisas.** Då finns ingen första bild att räkna fram, och Wix hade valt storlekens kort eller huvudbilden.
2. ☠️ **Varje steg hoppas över när det redan är gjort.** Steg A när optionerna redan står Färg först, steg B när varje variants bild redan är färgens första foto, så en omkörning efter ett fall halvvägs
   gör bara resten.
3. ☠️ **Ingenting utom ordningen ändras, och återläsningen jämför allt.** Galleriet, alla länkar, varianternas id, SKU, pris, kostnad, synlighet och lager ska vara oförändrade, och skriptet stoppar vid första avvikelse.

Torrkörningen 00:56 UTC visade variantbilderna före och efter och en vy per kombination (samma som butiken sedan visade). **Skrivet 00:56:55 UTC:** `ok: true`, 0 avvikelser, revision 9 → 11, optionerna
`Färg > Storlek`, variantbilderna Mörk Khaki → `b5e78a` och Vit → `6bfbb0` i båda storlekarna, och galleri, länkar, priser, SKU, synlighet och lager orörda. **Live 01:0x UTC** (butikens cache renderad 01:00:52,
efter skrivningen): sidans `variantTable` ger Mörk Khaki → `b5e78a` och Vit → `6bfbb0` för M och L (förut storlekens kort), `variantAxes` står Färg före Storlek, och vyerna är Mörk Khaki × M
`b5e78a,42c0b0,68cd08,531e6d` (1 459 kr), Mörk Khaki × L `b5e78a,42c0b0,68cd08,2a5942` (1 559 kr), Vit × M `6bfbb0,4b7331,531e6d` (1 459 kr) och Vit × L `6bfbb0,4b7331,2a5942` (1 559 kr). Varje färg visar
sina egna foton och varje storlek sitt kort, och priserna är oförändrade. ⚠️ **Vit visar tre bilder i båda storlekarna**, under minimimåttet på fyra. Det var så före skrivningen också. Sidan finns inte i
`aosom-ordning.tsv`, så ingen färgbildsomgång har tagit den, och fler bilder till Vit är ett eget beslut.

#### Måttbilder för fel storlek på 16 sidor till (Leonards fråga 2026-10-23)

Leonards fråga efter soptunnan: *"Har vi fler produkter som har samma fel som soptunnan?"* `katalogkontroll-tva-lankade-optioner.js` ovan ser bara sidor med länkade bilder på BÅDA optionerna och svarade
därför nej på den halva av felet som är länkarna. Soptunnans andra fel, att måttbilden för en annan storlek visas under valet, uppstår också när färgen ensam bär bilderna: butikens vy är bilder utan ägare plus
bilder som ägs av det valda färg- eller storleksvalet, och en måttbild som ägs av färgen visas under varje storlek. Det var aldrig mätt på tvåaxliga sidor (`katalogkontroll-delade-malbilder.js` tar bara sidor
med ETT val).

`katalogkontroll-tva-axlar-bilder.py` (ren läsning; `--hamta` hämtar sidorna från butiken; indata ur `katalogkontroll-tva-axlar-slugs.js`, 29 s) läser butikens EGEN sidodata (`images`, `imageOwners`,
`imageAlts`, `variantAxes`, `variantTable`) och räknar vyn per kombination. Modellen är mätt mot webbläsaren (`live-galleri.mjs`) på skrivbordet `3b868848` och matstationen `1d4eb6b1`: samma bilder i samma
ordning på alla elva kombinationer. Körd 2026-10-23 01:2x UTC över alla 49 sidor med två val:

| | sidor |
| :-- | --: |
| minst en MÅTTBILD som hör till ett annat val än det valda (SPEC) | **16** |
| bara foton som nämner ett annat val (FOTO) | 6 |
| varukorgens bild fel där färgen bär bilderna, enligt BUTIKENS uträkning (☠️ inte Wix variantbild, se rättelsen under *Wix:s regel för variantens bild*) | **0** (hamsterburen `13fe619f`, där storleken bär dem, är redan känd) |
| färgträffar (tips) | 8: sammansatta färger, "på vit bakgrund" och avsiktliga kompilationer, utom hamsterburen och projektorduken |

SPEC, måttbild för fel storlek: matstationen `1d4eb6b1` (2 måttbilder), kattrappan `4d9ba658`, den hopfällbara hundbädden `c3d1fa41`, kantskydden `44d4907b`, hammocköverdraget `91f5c078`, odlingstunneln
`38f70f83` (3), julgranen `75a38b7b`, väggspegeln `c438d4ba` (+7 foton), hundsängen med tak `934297b1` (2), hundbädden med tak `01ac2f63` (3), sensorsoptunnan `92fc308c` (+8 foton), vedboden `4a2ab58e`
(+5 foton), tunnelväxthuset `5466fe81` (2), bokhyllan `79ab08fe` (+5 foton), det fällbara skrivbordet `3b868848` (+4 foton) och buxbomsklotten `7d1fb82b`. Bara FOTO: hundgrinden med husdjursdörr `8018bb95`
(5), verktygslådan `aafbf543` (6), de runda kantskydden `14fb0f98`, förvaringsmöbeln för barnrummet `0136e7d9` (2), projektorduken `926ec7a2` (butiksfelet) och soptunnan `c841717c` (två foton av 60-litersversionen
i färgens egen uppsättning, lämnade med flit: de visar samma tunna).

Orsaken är en annan än på soptunnan. Sammanslagningen och färgbildsverktygen länkar givarens och värdens bilder till FÄRGEN (*färgen bär bilden*), och en måttbild som anger måtten för en storlek följer med
dit. Butiken visar sedan färgens alla bilder under båda storlekarna, så under 44 × 24 cm ligger matstationens måttbild för 58,4 × 30,5 cm, och tvärtom. Varukorgens, kassans och orderns bild mättes inte här: kontrollens
VARUKORG-rad är butikens egen uträkning ur färgens första foto, inte Wix variantbild (se rättelsen under *Wix:s regel för variantens bild*).

**Förslaget (Leonard sa ja 2026-10-23 ca 01:40 UTC, och utfallet står i nästa avsnitt):** soptunnans recept, sida för sida. En måttbild som är en ritning utan färg (vit botten, bara mått) länkas bort från färgen och till sin
storlek med `lank-om-bilder.js` (galleriet rörs inte), och Färg sätts före Storlek med `farg-forst.js`. En måttbild som är ett foto av en viss färg (den vita tunnelns måttbild) går inte att länka utan att
visas under fel färg, och ersätts då av ett färgneutralt kort per storlek som på soptunnan (`bygg-kort.py`, `gate-kort.py`, `skriv-storlekskort.js`). Foton som nämner en annan storlek rörs inte: de visar
samma vara och en länk till storleken hade visat dem under fel färg. ⚠️ **Det blev ett enklare recept:** bara länkar, inga nya kort, inga ändrade galleri och ingen ändrad optionsordning (`bygg-agare.py`, nästa avsnitt), följt av en namn-skrivning av varianterna med färgen först (`variantbild-farg.js`), eftersom varje länkskrivning nollställer Wix variantbild.

Tre egenskaper som inte ska tas bort:

1. ☠️ **Kontrollen läser butikens sidodata, inte bara Wix länkar.** En räkning av länkar (`katalogkontroll-tva-lankade-optioner.js`) ser 9 av de 49 sidorna, och 13 av de 16 sidorna med en måttbild för fel
   storlek ligger utanför de 9. Vyn är unionen av ägare, så den räknas ur `imageOwners`. Kontrollen kan fälla (mutationsprov: variantens bild byttes mot en annan färgs på verktygslådan, och VARUKORG fällde
   på just den varianten).
2. ☠️ **Alt-texten är ett tips, bilden avgör.** SPEC och FOTO bygger på att alt-texten nämner ett annat vals tal. En bild vars alt-text inte nämner något val syns inte, och sammansatta färger ("Svart och Röd")
   ger FÄRG-träffar på den egna färgen. Titta på bilden innan en sida rättas.
3. ☠️ **Mät hela katalogen när ett fel hittas på en sida.** Soptunnan hittades av Leonards skärmbild, och samma slags fel låg på 16 sidor som tidigare mätningar (antal bilder per färgvy och per storleksvy) inte
   kunde se, eftersom de räknade bilder och aldrig läste vad bilderna visar.

#### De 16 sidorna rättade: en uttalad ägare per bild (`bygg-agare.py`, 2026-10-23)

Leonard 2026-10-23 ca 01:40 UTC: *"Fixa alla 16 en i taget med visuell kontroll på varje bild är kopplad till rätt variant och storlek"*. Alla 16 sidor är skrivna en i taget 01:4x–02:09 UTC, utanför Aosoms
synkfönster, efter att varje galleribild setts i full storlek på kontaktark (241 bilder: hela galleriet på varje sida, inte bara måttbilderna). Sidorna: matstationen `1d4eb6b1`, kattrappan `4d9ba658`, den
hopfällbara hundbädden `c3d1fa41`, kantskydden `44d4907b`, hammocköverdraget `91f5c078`, odlingstunneln `38f70f83`, julgranen `75a38b7b`, väggspegeln `c438d4ba`, hundsängen med tak `934297b1`, hundbädden med tak
`01ac2f63`, sensorsoptunnan `92fc308c`, vedboden `4a2ab58e`, tunnelväxthuset `5466fe81`, bokhyllan `79ab08fe`, det fällbara skrivbordet `3b868848` och buxbomsklotten `7d1fb82b`. 53 av de 241 bilderna bytte ägare.

☠️ **Skrivningarna hade två biverkningar jag inte såg förrän 02:2x UTC, och båda är rättade (*Biverkningen* nedan):** de nollställde Wix variantbild (varukorg, kassa, order) till huvudbilden på alla 16 sidor, och
mina första listor byggdes i galleriets ordning och bytte därmed butikens första bild på fem färger. Den första versionen av det här avsnittet påstod motsatsen, för jag hade läst butikens uträkning av variantbilden och inte Wix.

`tools/polish-gates/bygg-agare.py <ut.js> <spec.json> [--torr] [--kompakt]` gör `lank-om-bilder.js` till ett färdigt ExecuteWixAPI-skript där VARJE galleribild får en uttalad ägare
(`[{"id": "<fullt produkt-id>", "agare": {"<hex6>": "<valets namn>" | "-"}, "tomt": [], "forst": {"<valets namn>": "<hex6>"}}]`, hex6 = de sex första tecknen efter `b379ce_`, `-` = gemensam bild utan ägare,
`forst` = valfritt: valets första länkade bild). Skrivsteget, spärrarna och återläsningen
är `lank-om-bilder.js`:s, oförändrade: galleriet rörs aldrig, och varianternas id, SKU, synlighet och pris, produktens namn och adress och länkarna i den andra optionen jämförs efter skrivningen.
`tools/polish-gates/kolla-agare.py <spec.json> <slug>` läser sedan butikens egen sidodata och jämför ägare per bild och vy per kombination mot samma plan (exit 1 vid avvikelse). Mutationsprov: en ändrad
ägare i planen fäller exakt den bilden och de vyer den ändrar.

Reglerna jag valde ägare efter, mot butikens vymodell (en bild har ETT ägarval, och en vy är unionen av olänkade bilder och bilder som ägs av de valda valen):

- En måttbild eller ett kort vars tal gäller en storlek ägs av storleken. Ett färgfoto ägs av färgen. En bild som gäller alla val (faktakort, närbild på ett beslag) är olänkad.
- ☠️ **Ett val som finns i bara en kombination ger en exakt ägare.** Vit finns bara i 300 × 397 (tunnelväxthuset), Svart bara i 63 cm (skrivbordet), 150 cm bara i Mörkgrå (vedboden), Olivgrön bara i 40 cm och
  50 cm bara i Ljusgrön (buxbomsklotten), 76 × 61 bara i Blå och 61 × 46 bara i Ljusgrå (hundsängen), 76 × 61 bara i Mörkblå och 61 × 46 bara i Brun (hundbädden). En bild som hör till just den kombinationen
  ägs av det valet och syns bara där. Det är enda sättet att utesluta en bild ur en kombination, eftersom en vy är en union och aldrig en skärning.
- ☠️ **Foton av en annan storlek ligger kvar på sin färg när alla kombinationer finns.** Unionen går inte att undvika där, och att äga fotot av storleken hade visat det under fel färg. Det är mest sådana
  foton katalogkontrollen fortfarande flaggar som FOTO.
- ☠️ **Varje vy ska ha minst fyra bilder.** En bild som hade lämnat en vy under fyra blev kvar där den låg: fotona #1 och #2 på Mörkblå hos hundbädden `01ac2f63` hade gett Mörkblå × 92 × 76 tre bilder om de ägts av 122 × 92.
- Måttbilder med färgens motiv (ett foto av en viss färg med tal i) ägs av storleken och visas därför också under de andra färgerna i den storleken. Det är husets standard, och frågan om de ska länkas till sin
  färg väntar på Leonard (lärdom 147).

| sida | bilder som bytte ägare | bilder per vy före → efter |
| :-- | :-- | --: |
| `1d4eb6b1` matstationen | #14 och #27 (måttbilderna) → sin storlek | 8–10 → 8–11 |
| `4d9ba658` kattrappan | #4 och #16 → 60 × 40 och 45 × 40 | 5–6 → 5–6 |
| `c3d1fa41` hundbädden | #5 → 75 × 51 × 18, #10 → 107 × 61 × 20 | 4–6 → 5 |
| `44d4907b` kantskydden | #5 → Ø244 | 5 → 4–6 |
| `91f5c078` hammocköverdraget | #5, #14, #18 → 205 cm | 5 → 4–8 |
| `38f70f83` odlingstunneln | #4, #11 → 200 cm, #12 → 300 cm | 5–7 → 5–7 |
| `75a38b7b` julgranen | #4 → 120 cm | 5 → 4–6 |
| `c438d4ba` väggspegeln | #4, #14 → 50 × 70, #7 → 60 × 90, #9 → 50 × 110 | 6–9 → 6–8 |
| `934297b1` hundsängen | #3 → 106 × 76, #9, #10 → 76 × 61, #11, #12 → 61 × 46 | 5–7 → 4–6 |
| `01ac2f63` hundbädden | #3 → 122 × 92, #12 → 92 × 76, #14, #15 → 76 × 61, #16 → 61 × 46 | 4–8 → 5–6 |
| `92fc308c` sensorsoptunnan | #6 → 50 liter, #8, #16 → 42 liter, #10 → 30 liter | 7–9 → 7–8 |
| `4a2ab58e` vedboden | #2, #5, #7, #15–#17 → 150 cm, #9 → 213 cm | 8–12 → 5–11 |
| `5466fe81` tunnelväxthuset | #11 → 300 × 397, #12–#15 → 300 × 597 | 6–10 → 6–8 |
| `79ab08fe` bokhyllan | #6, #11 → 109 cm, #8 → 136 cm | 6–7 → 6–7 |
| `3b868848` skrivbordet | #3, #15 → 63 cm, #5, #8 → 80 cm | 5–7 → 6–7 |
| `7d1fb82b` buxbomsklotten | #5 → 40 cm, #12 → 50 cm | 6–8 → 5–7 |

Sex egenskaper som inte ska tas bort:

1. ☠️ **Planen ska omfatta HELA galleriet.** Saknas en bild svarar skriptet `ok: false, steg: "agare"` och skriver ingenting, i stället för att lämna bilden som den var. Ägaren ska också vara exakt ett val på
   sidan (namnet är unikt bland alla val i alla optioner).
2. ☠️ **Alla val i alla optioner får sin lista skriven**, så ingen gammal länk blir kvar på ett val som planen inte nämner. Val som saknar bilder i planen töms, och `lank-om-bilder.js` kräver `tomt` för ett val
   som hade bilder.
3. ☠️ **Optioner som inte är Färg skrivs först och Färg sist.** En bild som flyttas från färg till storlek är då ägd av båda en kort stund (butiken ser färgens länk) i stället för av ingen (butiken visar den
   under varje val).
4. ☠️ **Listornas ordning bevaras, och `forst` anger ett vals första bild.** En bild valet fortfarande äger står kvar på sin plats och nya bilder läggs sist i galleriets ordning. Första versionen byggde varje lista
   i galleriets ordning och bytte därmed butikens första bild på fem färger (*Biverkningen*). En option vars listor redan stämmer skrivs inte alls, och stämmer allt svarar skriptet `redan_ratt` utan att skriva.
5. ☠️ **`variantbild-farg.js` körs efter varje skrivning med verktyget.** En id-skrivning av optionerna nollställer Wix variantbild till huvudbilden (rättelsen under *Wix:s regel för variantens bild*), och
   `variantbild.yml` kan inte rätta det på en sida med länkar på båda optionerna, eftersom `forvantadBild` då gav `inget_snitt` och en variant utan förväntan hoppades över (motorn är ändrad, se *Motorn rättar nu …*).
6. ☠️ **Jämför butikens första bild före och efter**, inte bara vilka bilder som syns. En vy kan innehålla exakt planens bilder och ändå börja med fel bild.

**Biverkningen: Wix variantbild nollställdes, och butikens första bild byttes på fem färger** (upptäckt 02:2x UTC, rättat 02:31–02:37 UTC):

- ☠️ **Wix variantbild (`variantsInfo.variants[].media`, den som varukorgen, kassan och ordern läser) var huvudbilden på alla varianter på alla 16 sidor** från skrivningen (01:47–02:09 UTC) tills den rättades. Jag hade skrivit
  att den inte rörs, men jag hade läst butikens uträkning (`variantTable[].image` och katalogkontrollens VARUKORG: färgvalets första länkade bild, `lib/variant-price.ts`), som bara ändras av en listas ordning. Wix egen läsning gjordes
  först när jag läste `lib/wix/variant-media.ts`, såg att `forvantadBild` gav `inget_snitt` på sidor med länkar på båda optionerna, och körde provet på en dold testprodukt (tabellen under *Wix:s regel för variantens bild*).
  Soptunnan `c841717c` hade samma fel sedan `bilder-bort.yml` 00:51 UTC. Ingen order lades under fönstren: Search Orders utan statusfilter 2026-10-23 ca 03:00 UTC gav inga ordrar efter 10116
  (2026-10-22 20:50 UTC, och samma fråga hittade 23 ordrar sedan 15 oktober, så filtret biter). Varukorgar som aldrig blev order går inte att kontrollera.
- ☠️ **Mina första listor byggdes i galleriets ordning.** Butiken lägger valets första länkade bild först i galleriet, så den bytte på fem färger: julgranens Vit (#7 → #3), väggspegelns Guld (#10 → #3), sensorsoptunnans Silver
  (#11 → #5), vedbodens Grön (#10 → #3) och bokhyllans Vit (#9 → #2), alltså från ett packshot mot vit botten till ett miljöfoto. Det syntes i jämförelsen av butikens första bild före och efter. Återställt 02:31 UTC med
  `forst` (två skrivningar, fem sidor, 0 avvikelser, antalet länkade bilder per val oförändrat).
- **Variantbilden rättades 02:34–02:37 UTC med `variantbild-farg.js`** på de 16 sidorna, soptunnan och förvaringskistan (17 skrivna med 0 avvikelser i återläsningen, revision +1 per sida, förvaringskistan `redan_ratt`).

**`variantbild-farg.js`** (`python3 tools/polish-gates/bygg-variantbild-farg.py <ut.js> <fullt produkt-id>... [--torr] [--kompakt]`, byggt för ExecuteWixAPI, högst fem sidor per skrivkörning och 60 sekunder; en torrkörning
får ta fler, 49 sidor ryms i en körning): på en publicerad sida med färg och en annan option där BÅDA har länkade bilder skrivs varianterna om med valen bara med namn (`products-with-inventory`, ingen fältmask, aldrig
`inventoryItem`) och Färg först i varje variant. Wix räknar då variantens bild ur färgens första länkade foto, utan att optionernas ordning, galleriet eller länkarna ändras. Fem egenskaper som inte ska tas bort:

1. ☠️ **En färg utan länkade bilder avvisas** (`steg: "plan"`), och en sida utan en option som heter Färg eller med fler än två optioner likaså. Då skulle variantens bild bli något annat än färgens foto.
2. ☠️ **Återläsningen jämför allt som inte ska ändras:** galleriet i ordning med alt-texter, optionernas ordning, varje vals länkar, varianternas id, SKU, pris, jämförpris, kostnad, synlighet och val, produktens namn, adress
   och synlighet, och lagret. Kostnaden kräver `MERCHANT_DATA`, och går den inte att läsa skrivs ingenting.
3. ☠️ **En sida som redan är rätt skrivs inte** (`redan_ratt`), så skriptet går att köra om, och en torrkörning (`TORR`, `hasMutations false`) visar variantbilderna före och efter.
4. ☠️ **Nya försök bara på 404, 409, 429 och 5xx**, med omläsning före varje försök. Varje annat fel stoppar med `ingenting ändrat`.
5. ☠️ **Svaret bär bara wix-id, de sex första tecknen i fil-id, antal och avvikelser.** Aldrig alt-texter, namn eller adresser.

**Mätt efteråt, i Wix egen läsning (inte butikens):**

- `variantbild-farg.js` i torrläge 02:37 UTC: **81 av 81 varianter** på de 18 sidorna har färgens första foto som variantbild, och valen ligger Färg först i varje variant.
- Samma läsning mot alla 49 tvåaxliga sidor (02:5x UTC): Wix variantbild är färgens första foto på **47 av 49**. Undantagen är hamsterburen `13fe619f` (storleken bär bilderna, känd och väntar på Leonard) och
  skjutdörrsbeslaget (ingen färgoption, inga länkade bilder). Inga andra tvåaxliga sidor är alltså nollställda, inte heller hundgrinden `6eb13a16` och bänkdynan `a7aa9370`, som färgbildsomgångarna skrev med id kvällen innan.
- Nattens `/api/cron/variantbild` (05:35 UTC) rättar sidor med länkar på EN option, och de ligger utanför den här mätningen.

**Utfall, mätt 02:11–02:17 UTC och på nytt 02:38–02:41 UTC efter rättelserna** (butikens cache hade hunnit ikapp på alla 16, `age` 23–910 s):

- `kolla-agare.py`: **16 av 16 sidor stämmer med planen**, både ägare per bild och vy per kombination. Ingen vy har färre än fyra bilder.
- En riktig webbläsare per kombination (`live-galleri.mjs`, och ett eget klickskript för `c3d1fa41` och `79ab08fe`, som väljer färg med kort): **74 av 74 kombinationer** visar exakt planens bilder, och **butikens första
  bild är densamma som före skrivningarna på alla 74**. Priserna rördes inte.
- Butikens `variantTable` (första bilden per variant): lika som före skrivningarna på **73 av 73 varianter**.
- `katalogkontroll-tva-axlar-bilder.py` över alla 49 sidor: **0 sidor med en måttbild för fel val** (var 16) och 0 som inte gick att läsa. 11 sidor har kvar foton som nämner en annan storlek (var 6) och 14 har
  färgträffar (var 8), mest för att en måttbild som ägs av storleken har färgens motiv. Båda tipsen bygger på alt-texter, och bilden avgör. Dess VARUKORG-rad (0) är butikens uträkning, inte Wix variantbild.

**Det som inte gick att rätta med länkar, och som Leonard avgjorde samma natt (se *Leonards svar på de sex frågorna* nedan):** foton av en annan storlek under fel storlek där alla kombinationer finns (väggspegeln,
sensorsoptunnan, bokhyllan, skrivbordet, matstationen, kattrappan), de tre måttbilderna (en per färg, samma tal) under varje hammock-variant i 205 cm och två under 200 cm (odlingstunneln) och 42 liter (sensorsoptunnan),
måttbilder som saknas (107 × 61 × 20 hos hundbädden, 305 och 366 hos kantskydden och 177 hos hammocköverdraget), och vedbodens 213-cm-packshot som första bild och variantbild under 150 cm × Mörkgrå (färgens enda eget foto).
Det första sätter butikens vymodell (en union) som gräns, det sista kräver att bilden tas bort eller ersätts, och båda var Leonards beslut.

#### Motorn rättar nu sidor med länkar på båda optionerna (Leonards ja 2026-10-23)

Leonard 2026-10-23, på frågan om motorn ska rätta de här sidorna av sig själv: *"Fixa alla frågor så proffsigt som möjligt"*. Varje id-skrivning på en sida med länkar på båda optionerna
(`lank-om-bilder.js`, `avlank-delade.js`, `bilder-bort.yml`, färgbildsverktygen) nollställer variantbilden, och nattens `/api/cron/variantbild` såg det inte. Ändrat i `lib/wix/variant-media.ts`
(PR #762, 53 tester, mutationsprövade).

✅ **Mergad 2026-10-23 04:25 UTC** (squash `048ac5b6`, Leonards *Merga*). Produktionsbygget `dpl_5F7P2hiFDGyysHLKBnRLAXt47wZR` blev READY efter ungefär 84 sekunder, och butiksprojektets bygge
blev CANCELED med `#ignored-build-step`, så butikens ISR-cache rördes inte. Första nattkörningen på den nya koden gick 05:35 UTC (utfallet står i punkt 5 nedan). ☠️ **Fönstret på upp till ett dygn finns kvar** mellan en
galleri- eller länkskrivning och nästa 05:35: kör `variantbild-farg.js` (två optioner) eller `variantbild.yml` (`ids`) direkt efter en sådan skrivning som förut. Cronen är nätet under, inte ersättningen.

☠️ **Wix räknar ingen skärning, och det är mätt, inte antaget.** Motorn förväntade tidigare första bilden som ligger i ALLA valens listor. Ett prov på en dold testprodukt (raderades direkt, 404 efteråt) med
**överlappande** listor: Färg Svart [X2, X1], Silver [Y2, Y1]; Storlek S [K1, X1], L [K2, Y1]. Skärningen för S × Svart är X1 och för L × Silver Y1.

| namn-skrivning | S × Svart | S × Silver | L × Svart | L × Silver |
| :-- | :-- | :-- | :-- | :-- |
| efter länkning med val-id (id-skrivning) | huvudbilden | huvudbilden | huvudbilden | huvudbilden |
| färgen först i varje variant | **X2** | **Y2** | **X2** | **Y2** |
| storleken först | **K1** | **K1** | **K2** | **K2** |
| färgen först igen | **X2** | **Y2** | **X2** | **Y2** |

Ingen variant fick X1 eller Y1. Regeln är alltså alltid första bilden hos det första valet i variantens egen valordning som har kopplade bilder, också när listorna överlappar. I katalogen 2026-10-23 följer
**82 av 82 varianter** med bilder på två val (22 sidor, 93 varianter) den regeln, 81 av 82 med färgen först (undantaget är hamsterburen `13fe619f`, Naturträ × 85 × 45), och **ingen** har överlappande listor.

Fem egenskaper som inte ska tas bort:

1. ☠️ **Förväntan är första bilden hos första valet i skrivordningen** (färgoption först, sedan optionernas ordning), `forsta_val` när flera val har bilder. `snitt` och `inget_snitt` finns inte längre.
   Utan färgoption gäller optionernas ordning.
2. ☠️ **Skrivkroppen lägger färgen först i VARJE variant, men bara när minst en variant har bilder hos flera av sina val** (`behovFargForst`). Annars rörs valordningen inte. Optionerna skickas ordagrant:
   variantens egen valordning styr, inte optionernas, så väljarna i butiken är oförändrade.
3. ☠️ **Kontrollen före och efter jämför valen som en mängd.** Ordningen läggs om med flit, men vilka val varianten har ska stå still (annat val, saknat val eller annat variant-id fäller).
4. **Räknar Wix inte om bilden efter skrivningen** blir utfallet `ej_rattad`, och cronen skriver högst en gång per natt och sida. Det stoppar inte körningen (bara `avvikelse` gör det).
5. **Torrkörningen efter mergen och nattens första körning på den nya koden fann tre sidor, inte en (mätt 2026-10-23).** `variantbild.yml` i läget `torr` mot `main` (run 39900434263, 04:28–04:50 UTC) kontrollerade
   **1 174 flervariantsprodukter** (utkast med): 1 171 redan rätt, **3 med fel kvar**, 0 ej rättade, 0 som inte gick att kontrollera och 0 avvikelser. De tre är hamsterburen `13fe619f` (Naturträ × 85 × 45: varukorgens bild blir
   Naturträts första foto i stället för den grå burens), elbilen `7511fc56` (Röd, Grå och Vit) och hundbädden `3c104444` (Brun). Den här raden sa tidigare att hamsterburen var den enda, men den mätningen räknade bara de 22 sidor
   med bilder på två val; torrkörningen läser alla flervariantsprodukter. Nattens körning (`/api/cron/variantbild`, 05:35 UTC, Vercels runtime-logg) gjorde exakt det torrkörningen förutsade: **1 174 av 1 174 kontrollerade,
   `{"ratt":1171,"rattad":3}`, 0 publicerade och 0 utkast med fel bild efteråt**, och rättade hamsterburens Naturträ-variant (1), elbilens tre varianter och hundbäddens Brun (1). Galleriet, länkarna och väljarna rörs inte av
   cronen, och frågan om hamsterburens storlekar ska bära bilderna är fortfarande Leonards. Orsaken till att elbilen och hundbädden hade fel variantbild är inte utredd.

#### Leonards svar på de sex frågorna: ett kort per storlek, dubbletter borta, gemensamma bilder delas (2026-10-23)

Leonard 2026-10-23 ca 03:0x UTC, på de sex frågorna ovan: *"Fixa alla frågor så proffsigt som möjligt, gemensamma bilder får delas mellan varandra såklart"*. Allt är skrivet 03:42–04:01 UTC, utanför Aosoms
synkfönster, och mätt live 04:01–04:10 UTC.

| fråga | beslut och utfall |
| :-- | :-- |
| 1. foton av en annan storlek under fel storlek där alla kombinationer finns (11 sidor) | **De får vara kvar.** Butikens vy är en union, och ett foto av samma vara i en annan storlek är en gemensam bild. Katalogkontrollen räknar dem fortfarande som FOTO-tips, och bilden avgör. |
| 2. dubbletter | **Hammocken:** de tre måttbilderna (en per färg, samma tal) är ersatta av två färgneutrala kort, `205 cm` och `177 cm`, med alla färger sida vid sida. **Odlingstunneln:** den vita 200-cm-bilden är borta, den gröna står kvar som storlekens enda. **Sensorsoptunnan:** silverbilden med 68 cm är borta, den svarta 42-litersbilden står kvar. |
| 3. måttbilder som saknas | Ett kort per storlek, byggt ur sidans egen text: hammockens 177 cm, kantskyddens Ø305 och Ø366 och hundbäddens 107 × 61 × 20 cm. |
| 4. vedbodens första bild under 150 cm × Mörkgrå | **Ingen ändring.** Bara 213 cm × Mörkgrå har lager (35 st, mätt 2026-10-23 04:0x UTC), och den varianten har rätt bild: färgens första foto, 213-cm-packshoten. 150 × Mörkgrå och 213 × Grön är slutsålda. Ett annat första foto för färgen hade gett den enda varan i lager en bild av fel storlek i varukorgen. |
| 5. nattens variantbild | Motorn är ändrad (föregående avsnitt) och mergad 2026-10-23 (PR #762, squash `048ac5b6`). |
| 6. gemensamma måttbilder under andra färger (lärdom 147) | **De får delas.** Skumklossarnas måttbild, som länkades till *Gul och grå* som prov 2026-10-22, är gemensam igen och visas under båda färgerna. |

**Korten** ligger i `tools/polish-assets/runda-bilder-tva-axlar-kort/` (`kort.tsv`, fem kort, 1 600 × 1 600). Texten och talen kommer ur sidans egen text (`kallor-tal.json`, `<kort>.html`), och `gate-kort.py` fäller på ett tal
som sidan inte bär. Fem rader (Fraktvikt och Paketmått för Ø305 och Ø366, Fraktvikt för hundbäddens stora storlek) klipps av grindens parentesstrippning, eftersom sidan skriver alla storlekarnas värden på samma rad,
och kvitteras med skäl i `kort-avvik.txt`. Hammockens hjältefoto är fyra packshots sida vid sida (`komponera-hjalte.py`; 205 cm: mörkgrön, ljusgrå, svart och mörkgrå, 177 cm: ljusgrå, mörkgrå och mörkgrön), eftersom ett
kort för en storlek inte ska visa EN färg när varan finns i flera. `orig/` med leverantörens foton checkas aldrig in.

**Ordningen per sida** (verktygen ligger i `tools/polish-gates/`):

1. Kortet byggs (`gate-kort.py`, sedan `bygg-kort.py`) och laddas upp (`UploadImageToWixSite`, md5-parat mot den lokala filen, tills Wix säger READY).
2. `galleri-tillagg.js` lägger kortet sist i galleriet med alt-text (`bygg-galleritillagg.py <ut.js> <plan.json>`; planen byggs av rundans `planer.py` ur `kortfiler.json` och `kortalt.tsv`, aldrig för hand).
3. `bygg-agare.py` ger varje bild en uttalad ägare (kortet ägs av sin storlek) och `lank-om-bilder.js` skriver länkarna.
4. De gamla måttbilderna tas bort med `bilder-bort.yml` (torrt, sedan skarpt med planens sha).
5. `variantbild-farg.js` rättar varukorgens bild (två optioner), `variantbild.yml` på en sida med EN option.
6. Live: `kolla-agare.py` (butikens sidodata), `live-galleri.mjs` eller `live-galleri-kort.mjs` (webbläsaren, en kombination i taget) och `katalogkontroll-tva-axlar-bilder.py` över alla 49 sidor.

Sex egenskaper som inte ska tas bort:

1. ☠️ **`galleri-tillagg.js` lägger bara till.** Galleriets gamla bilder står kvar i samma ordning med samma alt-text, och huvudbilden rörs inte.
2. ☠️ **En fil som inte är READY hos Wix hamnar aldrig i ett galleri**, och planens kontrollsumma (FNV-1a) räknas om i samma anrop som skriver, så en plan som skrivits av för hand avvisas.
3. ☠️ **Före och efter jämförs:** varianternas id, SKU, pris, kostnad, synlighet och val, lagret, produktens namn, adress och synlighet, och varje vals länkade bilder. Minsta avvikelse ger `ok: false`.
4. ☠️ **Svaret bär bara wix-id, de sex första tecknen i fil-id, antal och avvikelser.** Aldrig alt-texter, namn eller adresser.
5. ☠️ **Variantbilden nollställs av galleriskrivningen** (se *Wix:s regel för variantens bild*). `variantbild-farg.js` ska följa efter, och skriptet rapporterar variantbilderna före och efter.
6. **Alt-texten till ett kort kontrolleras av `gate-kort.py`** (`kortalt.tsv`: formen, att kortet finns, längd 20–250 tecken, samma grindar som texten och sifferkontrollen mot sidans facit). Mutationsprövat: ett tal sidan inte
   bär ger `[SIFFRA UTAN KÄLLA]` och en saknad alt-text `[ALT SAKNAS]`.

Tre mindre verktyg som kom ur arbetet:

- **`live-galleri-kort.mjs`** mäter en sida där BÅDA axlarna är kort (`.varcard`, hundbädden `c3d1fa41`). `live-galleri.mjs` klickar korten ett i taget och kallar varje kort ett val, så raderna för storlekarna visade den
  färg som klickats sist och såg ut som att storleken inte ändrade något.
- **`kolla-agare.py` klarar en sida med EN option** (skumklossarna `d70e483e`): sidans data har då `variantAxes` och `variantTable` som `$undefined`, och skriptet kraschade på det. Det kontrollerar nu ägarna per bild och
  hänvisar till `live-galleri.mjs` för vyn per val. Mutationsprövat: en ändrad ägare i planen ger exakt den bildens avvikelse och exit 1.
- **`skyddsplan.json`** i rundan är en plan för `bygg-skyddskoll.py` (`python3 -P tools/polish-gates/bygg-skyddskoll.py <ut-katalog> tools/polish-assets/runda-bilder-tva-axlar-kort/skyddsplan.json`), eftersom standardkörningen bara läser
  `fargtillagg-*/tillagg.json`.

**Utfall, mätt 03:42–04:10 UTC:**

- Wix: varje skrivning återlästes utan avvikelse. Hammocken: galleri 20 → 22 → 19, 205 cm äger sitt kort och 177 cm sitt, de tre färgmåttbilderna borta. Kantskydden 10 → 12 (Ø305 och Ø366 äger var sitt kort). Hundbädden
  10 → 11 (107 × 61 × 20 cm äger fotot och kortet). Odlingstunneln 12 → 11. Sensorsoptunnan 16 → 15. Skumklossarna: Gul och grå 5 → 4 länkade, galleriet orört.
- Variantbilden är färgens första foto på alla 26 varianter (7 + 4 + 3 + 4 + 6 + 2), mätt i Wix egen läsning.
- `kolla-agare.py`: hammocken (7 av 7 kombinationer), kantskydden (4 av 4), hundbädden (3 av 3), odlingstunneln (4 av 4) och sensorsoptunnan (6 av 6) stämmer med planen, och skumklossarnas nio bilder har rätt ägare.
- I en riktig webbläsare visar **26 av 26 kombinationer och val** exakt planens bilder. Måttkorten visas bara under sin storlek, och skumklossarnas gemensamma måttbild visas under båda färgerna. Alla fem korten är sedda live
  i huvudbilden, valda med sin storlek (hammockens 205 och 177, kantskyddens Ø305 och Ø366, hundbäddens 107).
- `katalogkontroll-tva-axlar-bilder.py` över alla 49 sidor: **0 med en måttbild för fel val**, 11 bara med foton för fel val (oförändrat, se fråga 1), 12 färgträffar (var 14, de två borttagna måttbilderna) och 0 med fel
  varukorgsbild.
- Skyddskollen: 5 av 5 kortfiler sitter i sina gallerier, bildstädningens egen tolkning ser alla fem och Media Manager har dem (READY). De har källklassen `annan-kalla`, som städningen aldrig raderar.
- Priser, SKU, synlighet och lager är oförändrade (jämförs före och efter i varje skrivning).

De borttagna måttbilderna (fem filer) ligger kvar i Media Manager tills bildstädningen tar dem, tidigast tre dygn efter att den först såg dem oanvända (karenstiden).

#### Färgneutrala måttkort på 16 sidor: alla färger på samma kort (Leonards skärmbilder 2026-10-23 06:47 svensk tid)

Leonard skickade två skärmbilder av matstationen `1d4eb6b1` och skrev *"Såg direkt fel på första produkten ku"*: måttbilden med den espressofärgade stationen visades under Grå och Vit. Det var den halva av felet som ägarlistorna
i *De 16 sidorna rättade* lämnade kvar. Butikens vy är unionen av de oägda bilderna och bilderna som ägs av de valda valen, så en måttbild som ägs av en storlek visas under varje färg i den storleken, också när den föreställer en annan
färg. Ägarlistorna lät sådana bilder ligga kvar (*Måttbilder med färgens motiv ägs av storleken*, lärdom 147, frågan låg hos Leonard), och skärmbilderna besvarar den: en bild på en viss färgs vara ska inte visas under en annan färg.
Det är min tolkning av hans rad, och jag byggde om alla sidor efter den. *Gemensamma bilder får delas* (Leonard, 03:0x UTC) gäller bilder som stämmer för alla färger, och ett kort med alla färger bredvid varandra gör det.

**Mätningen före** (`matning-2026-10-23.txt`, butikens sidodata på de 18 sidor som rättats under natten med ägarlistor, kort eller optionsordning): 16 sidor hade 31 bilder som visade en färg men syntes under en annan. De två andra,
hammocken och soptunnan, hade redan färgneutrala kort.

**Lagningen, en sida i taget** (mandatet är Leonards *Fixa alla 16 en i taget med visuell kontroll på varje bild*):

1. Ett kort per storlek, byggt som soptunnans och hammockens kort (`kort.tsv`, `gate-kort.py`, `bygg-kort.py`), men med ett hjältefoto som är en komposition av ett packshot per färg, sida vid sida (`bygg-hjaltar.py` ur `hjaltar.tsv`,
   som pekar på de exakta Wix-filerna, med layout `2`, `3`, `2,1` eller `1`). Förvaringskistans hjälte byggs av `bygg-hjalte-kista.py`, eftersom den vita kistan bara finns som miljöfoto. Talen i korten kommer ur sidans egen text
   (`kallor-tal.json`). Väggspegelns 50 × 110 cm saknar guldfoto i galleriet, så kortet visar den svarta spegeln ensam och alt-texten säger att den finns i guld.
2. Korten laddas upp (md5-parat mot de lokala filerna), läggs sist i galleriet (`galleri-tillagg.js`, planerna byggs av `planer.py`) och ägs av sin storlek (`bygg-agare.py`, specarna byggs av `agare.py` ur galleriet före,
   `kortfiler.json` och planen).
3. De gamla färgspecifika måttbilderna tas bort efteråt med `bilder-bort.yml` (torrt, sedan skarpt med planens sha), så att ingen vy någonsin saknar måttbild eller visar en bild utan ägare.
4. Variantbilderna rättas av motorn i samma körning: `bilder-bort.yml` loggade `[variantbild] <id>: N varianter rättade` för alla 14 sidor (31 varianter, 05:35 UTC) och för förvaringskistan (2 varianter, 05:47 UTC), mätt i Vercels
   runtime-logg. Det är `lib/wix/variant-media.ts` (mergad 04:25 UTC) som rättar sidor med länkar på båda optionerna.

**Utfall, mätt 05:35–06:01 UTC** (`kort` = nya måttkort, `borta` = borttagna färgspecifika måttbilder, `minsta vy` = minsta antal bilder i en vy):

| sida | kort | borta | galleri efter | minsta vy |
| :-- | --: | --: | --: | --: |
| matstationen `1d4eb6b1` | 2 | 2 | 27 | 8 |
| kattrappan `4d9ba658` | 2 | 2 | 16 | 5 |
| hundbädden `c3d1fa41` | 1 | 1 | 11 | 5 |
| kantskydden `44d4907b` | 1 | 1 | 12 | 5 |
| odlingstunneln `38f70f83` | 2 | 2 | 11 | 5 |
| julgranen `75a38b7b` | 1 | 1 | 10 | 4 |
| väggspegeln `c438d4ba` | 3 | 4 | 14 | 6 |
| hundsängen med tak `934297b1` | 1 | 1 | 12 | 4 |
| hundbädden med tak `01ac2f63` | 1 | 1 | 17 | 5 |
| sensorsoptunnan `92fc308c` | 3 | 3 | 15 | 7 |
| vedboden `4a2ab58e` | 1 | 1 | 17 | 5 |
| tunnelväxthuset `5466fe81` | 1 | 2 | 14 | 5 |
| bokhyllan `79ab08fe` | 2 | 3 | 12 | 6 |
| skrivbordet `3b868848` | 2 | 4 | 16 | 5 |
| buxbomsklotten `7d1fb82b` | 1 | 1 | 13 | 5 |
| förvaringskistan `b129d5ae` | 2 | 2 | 7 | 3 |
| **summa** | **26** | **31** | | |

- Wix: alla skarpa körningar av `bilder-bort.yml` (14 sidor och förvaringskistan) gick igenom, och rutten stoppar vid första avvikelse i återläsningen av galleri, alt-texter, länkar, synlighet och varianter. Galleritilläggen och
  ägarskrivningarna jämförde före och efter (varianternas id, SKU, pris, synlighet och val, produktens namn och adress) utan avvikelse. Förvaringskistan lästes dessutom om i en separat läsning 05:48 UTC: galleriet 7, Mörk Khaki äger tre
  foton, Vit två, M och L äger var sitt kort, varianternas bild är Mörk Khakis första foto (`b5e78a`) respektive Vits (`6bfbb0`), och SKU, pris (1 459 och 1 559 kr) och synlighet är oförändrade.
- **`efter.py` (`kolla-agare.py` mot butikens egen sidodata, 05:58 UTC, cachens `age` 184–790 s, matstationens 2 579 s): 70 av 70 kombinationer på 16 sidor stämmer med planen**, SPEC-tipsen är tomma på alla 16 sidor (ingen måttbild
  visas under ett val den inte hör till) och VARUKORG är 0. FOTO-tips finns kvar på fem sidor (väggspegeln, sensorsoptunnan, vedboden, bokhyllan och skrivbordet): foton av en annan storlek, som får ligga kvar enligt Leonards besked
  på fråga 1. FÄRG-tips finns på matstationen, kantskydden och odlingstunneln, och bilden avgör.
- Webbläsaren (`live-galleri.mjs`, en kombination i taget): förvaringskistans fyra kombinationer 05:51 UTC. Mörk Khaki × M visar färgens tre foton plus M-kortet, Mörk Khaki × L tre foton plus L-kortet, Vit × M och Vit × L färgens två foton
  plus sitt kort (tre bilder), och priserna är oförändrade. De andra sidorna mättes i webbläsaren 05:36–05:37 UTC, direkt efter skrivningarna.
- **Skyddskollen** (`bygg-skyddskoll.py` med `skyddsplan.json`, 06:01 UTC): 26 av 26 kortfiler sitter i sina gallerier, bildstädningens egen tolkning ser alla 26 och Media Manager har dem (`OK`, `READY`). De har källklassen `annan-kalla`,
  som städningen aldrig raderar. De 31 borttagna måttbilderna ligger kvar i Media Manager tills städningen tar dem, tidigast tre dygn efter att den först såg dem oanvända.
- **Slutkontroll av varukorgens bild** (`variantbild.yml`, läget `torr` mot `main`, run 39908059310, 05:52–06:13 UTC, efter den sista skrivningen): **1 174 flervariantsprodukter kontrollerade, 1 174 redan rätt, 0 rättade, 0 med fel kvar,
  0 ej rättade, 0 som inte gick att kontrollera och 0 avvikelser.** Nattens tre sidor (hamsterburen, elbilen och hundbädden) är alltså rättade, och inga av de 16 sidornas varianter har fel bild. Torrkörningen tog 21 minuter och delar
  concurrency-grupp med `polish-write`, så starta den inte mitt i en poleringsskrivning.

Fem egenskaper som inte ska tas bort:

1. ☠️ **En bild som föreställer en viss färgs vara ägs aldrig av en storlek som flera färger delar.** Butiken visar storlekens bilder under varje färg i storleken. Det som går är ett kort som stämmer för alla färger, ägt av storleken.
2. ☠️ **Kortets hjältefoto bär de färger sidan har.** Det byggs av ett packshot per färg ur sidans eget galleri vid fil-id, och `hjaltar.tsv` bär hela fil-id:t, inte en plats i galleriet, eftersom platserna flyttar sig när en bild tas bort.
3. ☠️ **De gamla måttbilderna tas bort efter att korten ligger i galleriet och är ägda av sin storlek, aldrig före.** Faller något halvvägs har sidan ett kort för mycket och ingen vy saknar måttbild.
4. ☠️ **Mät mot en spec utan de borttagna bilderna.** `agare_<id8>.json` skrevs före borttagningen, och `kolla-agare.py` svarar `planen nämner … men bilden finns inte i galleriet` om bilder som är borta med flit. Matstationen gav två sådana
   falska avvikelser (`59c65b` och `2d7a79`) i första körningen, med alla sex kombinationer OK. `efter.py` tar bort bilderna i `bort.json` ur specarna före kontrollen.
5. ⚠️ **Förvaringskistans Vit visar tre bilder i båda storlekarna** (två egna foton och storlekens kort), under minimimåttet på fyra, och det var så före också. Sidan finns inte i färgbildsspårets lista, och frågan om Vit ska få fler bilder
   står hos Leonard.

#### En bild per kombination: revisionen av alla sidor med två val (Leonard 2026-10-23, 13:12 svensk tid)

Leonards skärmbilder av bokhyllan `79ab08fe` (och Wix-panelen): den lilla och den stora hyllan syntes under båda höjderna och båda färgerna. *"gör audit för att lösa det här problemet"*. Underlaget och lösningen står i
`tools/polish-assets/tva-axlar-revision-2026-10-23/` (README, `sidor.tsv`, `klass.tsv`, `givare.tsv`).

Av 49 publicerade sidor med två val visar **16 bilder av fel storlek eller färg tydligt** (bokhyllan, katt- och hundtrappan, hindersetet, verktygslådan, förvaringsmöbeln, hamsterburen, väggspegeln, sensorsoptunnan, skrivbordet `3b868848`,
tre hundgrindar, två hundbäddar och vedboden), 14 där storlekarna ser likadana ut på fotona och 17 som är rätt (13 klädsidor och 4 där varje färg bara finns i en storlek).

☠️ **Orsaken är två, och ingen av dem går att laga med länkar.** Butiken ger varje bild EN ägare, det första val som kopplar den, och visar den under alla val i den andra optionen. Och sammanslagningen och färgbildsverktyget kopplar
givarens bilder till färgen eller storleken, aldrig båda, så varje ny storlek i en befintlig färg hamnar under den gamla. Rättningarna i natt (ägarlistor och kort per storlek, se ovan) kunde bara flytta bilder mellan ägare.

Lösningen, i ordning:

1. **Butiken** (`butik-kopplingar.patch`, PR #770 mot `headless-site` med Leonards ja 2026-10-23, mergas natten till 2026-10-24): en bild syns när den, i varje option som kopplar den, är kopplad till det valda valet; inom en option räcker ett av valen. Kombinationens
   första bild är bilden som passar kombinationen och är kopplad i flest optioner. Ingen publicerad sida har i dag en bild kopplad till två optioner (0 av 5 116), så tvåaxliga sidor ser ut som förut tills de länkas om. På 30 sidor med
   ett val, där en bild är kopplad till flera val, syns bilden under alla de valen i stället för bara under det första. Projektordukens storleksbilder börjar synas (etiketten "85 tum (216 cm)" mot väljarens "85 tum").
2. **Länka om** FEL-sidorna en i taget, varje bild till sin färg OCH sin storlek, med visuell kontroll och givaren som facit. ☠️ Inte före butiksändringen: med en ägare per bild visar en dubbelkopplad bild under alla färger i storleken.
3. **Fyll** kombinationer som hamnar under fyra bilder ur kombinationens egen artikel (vit bokhylla 136 cm har bara packshoten och kortet).
4. **Motorn:** varukorgens bild per variant (Wix tar alltid färgens första bild) och sammanslagningen kopplar en ny storlek i en befintlig färg till båda.

☠️ **En givare är en kombination, och dess pris avgör vilken.** En dold givare är en Aosom-artikel med variantens pris, så `givare.tsv` ger bildens storlek utan att någon räknar steg. Hunden på den vita kattrappan (`acf527`)
räknades först som tre steg; bilden kommer från fyrstegsartikeln och har fyra steg i förstoring.

**Verktygen för steg 2 (2026-10-23).** `bygg-agare.py` tar en lista som ägare (`["Vit", "136 cm"]` är en bild av den vita hyllan på 136 cm), och flera val i samma option betyder "något av dem" (`["Svart", "50 × 70 cm", "60 × 90 cm"]`). Torrkörningen svarar med
`kombinationer`: butikens vy per variant med den nya regeln, kombinationens första bild och Wix variantbild efter en namn-skrivning med färgen först (`varukorg`, `varukorgPassar`). `kolla-agare.py` och
`katalogkontroll-tva-axlar-bilder.py` läser sidans `imageKopplingar` när butiksändringen är ute och räknar vyn som butiken; saknas fältet gäller den gamla regeln, och en lista i planen räknas då som en avvikelse.
Planerna för bokhyllan (`agare-79ab08fe.json`) och projektorduken (`agare-926ec7a2.json`) ligger i revisionsmappen. De är torrkörda mot Wix och mot butiksändringens egen kod, med samma vyer och samma första bild
på alla sju kombinationerna:

| sida | kombination | bilder | första bild | varukorgen (färgens första) |
| :-- | :-- | --: | :-- | :-- |
| bokhyllan | brun × 109 cm | 5 | brun 109-packshot | rätt |
| | brun × 136 cm | 4 | brun 136-packshot | brun 109-packshot, som i dag |
| | vit × 109 cm | 5 | vit 109-packshot | rätt |
| | vit × 136 cm | **2** | vit 136-packshot | vit 109-packshot, som i dag |
| projektorduken | vit × 85 tum | 8 | 85-packshot | rätt |
| | svart × 99 tum | 5 | svart packshot | rätt (de två vita närbilderna syns inte längre här) |
| | vit × 99 tum | 9 | vit 99-packshot | rätt |

☠️ **Bokhyllans Storlek står före Färg.** Med den gamla butiken ägs en dubbelkopplad bild av storleken och visas under båda färgerna, så planen skrivs först när butiksändringen är ute och sidan bär
`imageKopplingar` (`kolla-agare.py` skriver vilket). Bokhyllans plan skriver bara Storlek (109 cm: 1 → 7 länkar, 136 cm: 1 → 3); färgernas listor är redan rätt. Vit × 136 cm får två bilder och fylls i steg 3.
⚠️ Varukorgens bild är färgens första bild för alla storlekar så länge varianterna skrivs med färgen först. Med två färger och två storlekar går det att ge varje variant sin egen bild (två varianter med
färgen först, två med storleken först), men nattens `variantbild` skriver om alla med färgen först. Det kräver motorändringen i steg 4.

☠️ **Spärren sitter i verktyget.** En plan med flera ägare på en bild byggs inte skarpt förrän butikens sida bär `imageKopplingar`: `bygg-agare.py` hämtar planens `slug` och vägrar annars, och
`lank-om-bilder.js` länkar en bild från ett val till i samma option bara när `bygg-agare.py` slår på `FLERA_I_OPTION`. Prövad åt tre håll: utan slug, mot dagens butik och mot en sida som bär fältet.
Spärren gäller NYA länkar: en dubbelkoppling som redan finns får stå kvar eller minska (2026-10-23, prövat åt båda hållen i en torrkörning).

**Före mergen: trädgårdspallen och parkbänken (2026-10-23 13:52 UTC, Leonards ja).** Två av de 30 sidorna med ett val hade en bild kopplad till ett val den inte hör till, och den nya regeln
hade visat den där. Pallen `d886ce9e`: miljöfotot med den gröna pallen är borta från Blå, och korten står kvar på båda färgerna. Bänken `e4aec6ef`: fotot på rosenbänken hör till 40 tum enligt
måttbilderna (46 tum har rutmönstrat ryggstöd och 50 tum svängt) och är länkat bara dit; förut låg det på alla sex modeller och var varukorgens bild för dem alla, även träbänkarna. Båda lästes
tillbaka utan avvikelse, och `variantbild.yml` rättade varukorgens bild. De andra 28 sidorna visar bilden rätt under varje val som länkar den (`delade-lankar.tsv`), så de 15 AliExpress-sidor som väntade
på `avlank-delade.js` (lärdom 163) löses av själva mergen.

**Planerna för alla 16 sidor med fel (2026-10-23, eftermiddag).** `agare-<id8>.json` i revisionsmappen finns för de 16 FEL-sidorna, projektorduken och matstationen, och bär `slug`. De är torrkörda mot Wix
(18 av 18: varje bild hittades och ingenting skrevs) och korskörda genom butiksändringens egen kod: samma bilder och samma första bild i alla 81 kombinationer. `ordning` (nytt fält) lägger packshoten för varje
storlek först i färgens lista, eftersom kombinationens första bild är den första bilden i färgens lista som passar och är kopplad i flest optioner. Tre saker som planerna inte löser:

- ☠️ **Fem kombinationer i lager har inget eget foto:** skrivbordet `3b868848` Vit × 63 cm (110 st; de vita fotona är 80 cm-bordet, mätt sida vid sida i samma scen), spegeln `c438d4ba` Guld × 50 × 110 cm (35),
  järngrinden `233c83cf` Vit × 74–87 (60), Vit × 74–80 (52) och Svart × 74–80 (29). De visar sin färgs foton från de andra storlekarna, som i dag, i stället för ett enda kort. Ett eget foto per
  kombination kräver Cowork-rader eller ett verktyg som hämtar feedens bilder per variant (`aosom-fargtillagg` tar färgens första artikel).
- **Varukorgens bild är färgens första bild för alla storlekar:** 32 av de 81 kombinationerna får en bild av en annan storlek i varukorgen, som i dag. Hamsterburen `13fe619f` blir sämre på en punkt:
  Mörkgrå × 85 × 45 visar i dag sin egen bur i varukorgen (Mörkgrå har inga länkar, så Wix tar storlekens första bild), och efter planen 100-burens packshot.
- **Kombinationer under fyra bilder** med egna foton (dörrgrindarna, hundbäddarna, kattrappan i tre steg, verktygslådan med fyra röda lådor) visar färre bilder än i dag, men bara rätt bilder. De fylls i steg 3.

### Nattens utkast blev sju sammanslagna sidor: mät varje vy live (2026-10-22)

Nattimporten 2026-10-22 skapade 40 utkast (04:40–04:44 UTC). 27 blev egna sidor (N294–N298), 10 blev färg eller storlek på publicerade sidor
(T84, T86 och T87) och 3 pensionerades: en ommappad hundbädd (T85, som också fick en publicerad brun sida som färg) och två dubbletter.
Rundorna, tiderna och utfallen står i `tools/polish-gates/FLAGGADE.md`. Det som gäller framöver:

1. ☠️ **Efter varje sammanslagning mäts varje färg- och storleksvy live** (`node tools/polish-gates/live-galleri.mjs <slug>`, ett val i taget).
   `katalogkontroll-farger.js` ser bara varje vals första länkade bild och var ren på alla sju sidorna, medan butikens vyer visade foton av fel färg eller
   storlek på fyra av dem (hinderset, sminkpallen, spegelskåpet och matstationen). Ett olänkat foto visas under en färg det inte hör till.
2. **Länka dem med `tools/polish-gates/bygg-lank.py`.** Fotona anges som de sex första tecknen i fil-id:t efter `b379ce_` (exakt en träff i galleriet).
   `lank-om-bilder.js` släpper aldrig en gammal länk och rör aldrig galleriet; kör sedan `variantbild.yml` med `ids` och mät om. Högst tre sidor per
   ExecuteWixAPI-körning.
3. **Resultatet ska vara en vy per färg med sina egna foton plus de gemensamma korten.** Efter länkningen visar matstationen Vit 8, Grå 10 och Espresso 9
   bilder (båda storlekarna delar färgens vy), och katalogkontrollen gav 0 val med samma första bild.
4. ☠️ **Ett kedjeskript som kopierats från förra rundan ska få rundnamnet bytt i `ghw.py write`-raden.** N298:s skript pekade först på N297 med N298:s
   sha. Det stoppades efter tolv sekunder och inget skrevs, men det var sha-kontrollen som hade fällt körningen och inte raden som var rätt.

### Bildimporten tystnade — 397 av 675 produkter fick noll bilder

Första skarpa svepet (2026-08-27) importerade 675 produkter. **397 fick NOLL
bilder** och 87 fick färre än fem, medan körningen rapporterade `failed: 0` hela
tiden: produkten skapades ju, det var bara bilderna som föll bort.

Två tysta fel i `lib/wix/media.ts` samverkade:

1. `importMediaUrls` körde `Promise.allSettled` och **filtrerade bort allt som
   rejectade**. Ingen logg, ingen räknare, inget returvärde som skvallrade —
   kommentaren påstod "med varning i konsolen", och det fanns ingen sådan.
2. `importMediaByUrl` hade **inget återförsök alls**. Wix svarar 429 vid för hög
   takt, och fem bilder parallellt per produkt × 129 produkter per varv är ~2,7
   uppladdningar i sekunden. Därför blev det värre över tid: de sist importerade
   fick noll.

Lagat: uppladdningarna går **en i taget** med paus (`MEDIA_UPLOAD_DELAY_MS`,
default 150 ms), återförsök med backoff på 429/5xx/nätverksfel (1 s, 3 s, 8 s,
följer `Retry-After`), och varje miss rapporteras via `onMiss` →
`ImportResult.missadeBilder`. En trasig adress (404) ger däremot upp direkt —
den blir inte bra av att frågas igen.

Samma klass av bugg som recensionsbilderna hade (2026-08-22). Regeln bakom båda:
**en misslyckad uppladdning som ingen kan upptäcka är värre än en som kastar.**

☠️ **`getProductMedia` MÅSTE begära `fields=MEDIA_ITEMS_INFO`.** Utan det
returnerar V3 en produkt med `media.main` ifylld men `media.itemsInfo.items`
TOM — inte ett fel, bara en tystare projektion. Uppmätt 2026-08-27 på en produkt
med fem bilder: 0 utan fältet, 5 med. Två saker gick sönder på det, båda tyst:
bildreparationens torrkörning såg alla 744 Aosom-produkter som bildlösa, och
knappen **"ta bort bild" i `/admin/queue`** filtrerade en tom lista, såg ingen
skillnad och anropade därför aldrig Wix — den hade aldrig gjort något. Ett test
i `client-media.test.ts` fäller om fältet försvinner igen.

`/api/cron/aosom-image-repair` städar upp efteråt (`lib/aosom/image-repair.ts`,
workflow-lägena `bildfix-torr` och `bildfix`). Den **läser tillbaka och räknar** efter
varje skrivning — se nästa avsnitt för varför. Den laddar om ALLA fem bilderna på
en produkt som har för få — en wixstatic-adress avslöjar inte vilken källbild den
kom från, så det går inte att veta vilka som saknas. Två spärrar:

- Skriver **aldrig en tommare lista** än den som redan ligger där. Går
  uppladdningen dåligt igen lämnas produkten orörd till nästa runda i stället för
  att göras sämre.
- Bara `media`, via `setProductMedia` med `fieldMask: ["media"]`. Synlighet,
  varianter, priser och texter är orörda — ett utkast kan inte råka publiceras.

### Reparationen rapporterade 524 av 524 lagade. 214 produkter saknade ändå bilder

Första skarpa bildfixen (2026-08-27, 12 varv) sa **524 trasiga, 524 lagade, noll
missar**. Mätt i Wix efteråt: **214 av 750 Aosom-utkast hade fortfarande färre än
fem bilder**, 207 av dem exakt fyra.

Stickprov visar samma sak varje gång: **fem filer ligger uppladdade och `READY` i
Media Manager, och noll av dem sitter på produkten.** Produkten bär kvar sina
gamla fyra bilder och sin gamla revision. Mönstret är jämnt över hela körningen
(22:01 → 22:38), så det är ingen degradering över tid.

Fyra förklaringar är **uteslutna med mätning**, inte med resonemang:

| hypotes | motbevis |
|---|---|
| Fel kroppsform i `setProductMedia` | Manuell PATCH med exakt samma kropp tog en produkt 4 → 5 |
| Föråldrad revision | Wix svarar **409 `INVALID_REVISION`** och funktionen kastar |
| Dubbletter i källan | De fem källbilderna har fem olika md5 |
| För få bilder i feeden | Feeden ger fem rena positioner på 6 014 av 6 057 rader |

Mekanismen är alltså **fortfarande oförklarad**. Det som däremot är lagat är att
felet var osynligt: `runImageRepair` läser nu tillbaka produkten efter varje
skrivning och räknar `reparerade` först när antalet bilder FAKTISKT steg. Tar
skrivningen inte blir det `misslyckade` + en rad i `errors` med artikelnumret.
Workflowen läste heller aldrig `misslyckade` — den gör det nu, och skriver ut
`errors` per varv.

☠️ **Ett svar utan fel är inget kvitto.** Tredje gången samma klass av bugg biter
här: recensionsbilderna (2026-08-22), `Promise.allSettled` i `media.ts`
(2026-08-27), och nu en skrivning som svarar OK utan att göra något. Regeln är
densamma varje gång — **räkna efter, lita inte på svaret.**

### ☠️ Wix importerade om VARJE bild — halva lagringen var kopior (2026-08-28)

Det här förklarar två problem som såg orelaterade ut: att lagringen tog slut,
och att bildfixen kunde rapportera fem lyckade uppladdningar på en produkt som
sedan hade fyra bilder.

V3:s dokumentation om produktmedia är entydig. Ett media-item tar ANTINGEN
`id` (en fil som redan ligger i Media Manager) ELLER `url` — och `url` betyder
ordagrant *"an external media URL"*. Vi skickade wixstatic-adresser, alltså
bilder som redan låg i Media Manager, och **Wix importerade om varenda en till
en ny fil**.

Uppmätt på 1 200 filer: **591 av 595 wixstatic-filer var kopior av bilder vi
själva laddat upp**, spårbara via sin `sourceUrl`. Media Manager hade **58 160
filer** där hälften räckt.

Omimporten är dessutom ASYNKRON. Det är mekanismen bakom "524 lagade, 214
saknade ändå bilder": produkten bar aldrig våra filer, den bar Wix kopior — och
när en kopia inte hunnit bli klar visade produkten fyra av fem. Den var alltså
aldrig oförklarad, bara felsökt på fel lager.

`importMediaByUrl` returnerade `id` hela tiden. Ingen använde det.

Lagat i `lib/wix/client.ts` (`createProduct` + `setProductMedia`), `pipeline.ts`
och `image-repair.ts`: id:t följer med hela vägen, och `url` skickas bara när
adressen faktiskt är extern. `media.main` skickas inte längre alls — den är
read-only i V3 och gav en extra omimport av huvudbilden. Tre tester i
`client-media.test.ts` låser det.

☠️ Regeln: **skicka aldrig en wixstatic-adress till Wix som om den vore extern.**

### Städningen av det som blev kvar

#### Bildfixen lämnade dessutom sina egna kopior

Fjärde bildfix-körningen dog mitt i: **Wix-lagringen tog slut.**

Orsaken står i `image-repair.ts` egen designkommentar. Den laddar upp ALLA fem
bilderna på nytt för varje produkt den lagar och ersätter medialistan — och de
gamla filerna blir kvar. Kommentaren sa att det "kostar några hundra extra
uppladdningar totalt"; den skrevs när katalogen var 744 produkter och EN körning
var planerad. Verkligheten blev fyra körningar mot en katalog som växte till
2 712 produkter, och varje lagad produkt lämnar fem filer à drygt en megabyte.

`/api/cron/aosom-media-cleanup` (`lib/aosom/media-cleanup.ts`, schemalagd
`50 3 * * *`) raderar Aosom-bilder som ingen produkt använder. Tre egenskaper som
inte ska tas bort:

1. ☠️ **Massfel-spärren kastar.** Är referenslistan mindre än en halv bild per
   läst produkt är det ett LÄSFEL, inte en tom katalog — och en körning hade
   raderat hela butikens bildbank permanent. Samma tanke som `MIN_FEED_RADER`.
2. **Bara filer VÅR kod skapat**, avgjort på `sourceUrl` — inte på namnet.
   `addedBy` duger inte: vår API-nyckel agerar som sajtägaren, så en bild Leonard
   dragit in i editorn ser identisk ut. Men en importerad fil bär adressen den
   hämtades från (leverantörernas CDN), och Wix egna kopior bär en
   wixstatic-adress som pekar tillbaka på en av våra. **En handuppladdad bild har
   ingen `sourceUrl` alls** och kan därför aldrig komma i fråga — det är skyddet
   för logotyper, banners och kategoribilder, som inte syns i något API vi kan
   lista och därför måste undantas på egenskap i stället för på uppräkning.
   Referenslistan byggs ur HELA katalogen, inte bara Aosom-delen.
3. **`permanent: true`.** Papperskorgen räknas fortfarande mot lagringen, så en
   vanlig radering frigör ingenting alls.

Städningen är avsiktligt en SEPARAT körning och inte inbakad i reparationen: en
radering inne i reparationen hade skett innan skrivningen verifierats, och en
produkt vars nya bilder inte fastnade hade då förlorat även de gamla.

#### Bara det som saknas laddas om (byggt 2026-08-28)

Reparationen laddade tidigare om alla fem bilderna per produkt, eftersom en
wixstatic-adress inte avslöjar vilken källbild den kom från. Det var orsaken
till hela incidenten ovan. Kopplingen finns nu i stället för att gissas, från
två håll:

- **`aosomBildFiler` på mappningen** — källbild → Wix-fil-id, sparat efter varje
  VERIFIERAD skrivning. Sparas det före, eller efter en skrivning som inte tog,
  pekar det på filer som inte sitter på produkten.
- **Wix egen `sourceUrl`** (`getMediaSourceUrls`, `POST /files/get-files`) för
  allt som importerades innan fältet fanns. Ett anrop per produkt, och bara en
  gång. ☠️ Den följer ETT hopp extra: en fil Wix omimporterat bär vår fils
  wixstatic-adress, inte leverantörens — och de produkter som ska lagas
  importerades medan omimport-buggen levde, så många pekar just på kopior.

Med kopplingen känd behålls det som redan sitter rätt **vid sitt id** och bara
luckorna fylls. Då uppstår inga föräldralösa alls.

☠️ **Går kopplingen inte att härleda laddas allt om, som förr.** Det är med
flit: vet vi inte vad produkten har kan en påfyllning ge samma bild två gånger
på en kundsida, och en dubblett är värre än en extra uppladdning. `fullOmladdning`
i svaret räknar dem, och talet ska sjunka mot noll.

#### ☠️ Städningen raderade kundernas recensionsbilder (2026-09-04)

Leonards rapport: *"mina produkt recensioner hade bilder förut men inte längre"*.
Uppmätt direkt: **68 av 68 recensionsbilder över fyra produkter svarar 403** —
alla raderade. Datan är intakt, adresserna står kvar i recensionsraderna; det är
filerna som är borta.

Mekanismen är städningens egen referenslista. `listaAnvanda` går igenom
`stores/v3/products/search` och samlar **bara produktmedia** — men en
recensionsbild sitter inte på en produkt, den sitter på en RECENSIONSRAD. Och
eftersom vår kod importerade den från `aliexpress-media.com` bär den en
`sourceUrl` och passerar därmed "vår kod skapade den"-filtret. Föräldralös
enligt planen, `permanent: true`, varje natt sedan cronen schemalades.

Samma dygn, samma orsak, annan skada: fyra **bloggomslag** dog likadant. De
plockas ur produktbilder (`blog-image-picker.mjs`) och bor i markdown i
butiksrepot — ännu mer osynliga för listan. De är självhostade i `/public` nu.

**Fixen är att referenslistan bär recensionsbilderna** (`listaRecensionsbilder`
i deps, både `imageUrl` och `imageUrls`). Två saker att inte röra:

1. ☠️ **Depen är OBLIGATORISK, inte valfri.** En valfri dep kan glömmas av
   nästa anropare, och då börjar raderingen om. Testhjälparen fick följa med
   i stället för att typen mjukades upp.
2. ☠️ **Ett LÄSFEL mot recensionslagret FÄLLER körningen.** Fortsätter den med
   tom lista ser varenda recensionsbild föräldralös ut och raderas permanent —
   exakt skadan fixen finns för. Samma form som `MIN_FEED_RADER`: när ett
   läsfel och ett tomt svar ser likadana ut, och det ena utfallet är
   oåterkalleligt, är avbrott enda säkra svaret. En katalog som HAR noll
   recensionsbilder går däremot igenom — det är felet vi vägrar tolka, inte
   tomheten.

**Regeln, tredje gången huset skriver ned den:** en referenslista är klar först
när ALLA läsare finns med i den. Migreringen lärde sig det om läsare som blev
TOMMA (`/api/tracking-events`) och om en SKRIVARE i ett annat repo
(`/api/omdome`). Det här är samma sak en tredje gång, och den dyraste: en
läsare som bor i en annan tabell syns inte i koden intill, och priset var
kundernas egna foton.

⚠️ **Två läsare till fattades, och de hittades 2026-09-28 inför raderingen av
pensionerade utkast.** Kategoribilderna stod inte i listan, och inte heller valens
kopplade bilder (`linkedMedia`). En kategoribild som är en produkts fil skyddades
bara av produkten, och raderas produkten hade städningen tagit den. Kategoribilderna
är nu en obligatorisk dep (`listaKategoribilder`, ett läsfel fäller körningen), och
vilka filer en produkt använder avgörs på ett ställe, `lib/wix/produkt-media.ts`,
som både städningen och raderingen läser.

⚠️ **Bilderna är inte återställda av fixen.** Den stoppar blödningen. Källan
finns hos AliExpress — recensionerna går att hämta om (`fetchAeReviews`, $0) —
men `repairImages` letar bara efter rader som FORTFARANDE bär en
leverantörs-URL, och de här bär en död wixstatic-adress. Återställning är ett
eget jobb.

#### ☠️ 260 recensioner hade döda foton igen (2026-10-06)

Leonards rapport: hörnskrivbordets recension hade en bild som inte syntes.
Uppmätt på alla publicerade rader via `/api/reviews/<id>`: **2 418 recensioner
med foto, 315 av 3 592 adresser svarade 403**, fördelade på 260 recensioner och
165 produkter (127 AliExpress, 133 Aosom). Butiken döljer en trasig bild
(`onError` i `ProductReviews.tsx`), så kunden såg ingen tom ruta, bara inget foto.

Två orsaker i AliExpress-återställningen (`/api/cron/review-image-restore`):

1. ☠️ **Ommappningen tar bort AE-id:t.** `tillämpaOmmappning` byter
   `supplierProductId` till Aosom, och återställningen räknade produktens
   AE-recensioner som `utanAEMappning`. Hörnskrivbordet `c342826f` var ett av
   dem. AE-synkens tillstånd sparas per Wix-produkt och överlever bytet, så
   id:t läses nu därifrån (`aeIdUrSynken`, räknaren `viaSynkensMinne`).
2. ☠️ **Import File skrev adressen innan Wix hämtat filen.** Slutade hämtningen
   FAILED stod en död adress kvar. Återställningen går nu samma väg som
   Aosom-återställningen: hämta bytena, ladda upp med rätt typ, skriv adressen
   först vid READY (`lib/wix/bekraftad-bild.ts`, delad mellan båda rutterna).

⚠️ Den vanliga publiceringsvägen (`withOwnImage` → `importImageToOwnMedia`)
använder fortfarande Import File utan att vänta. Nya AE-foton kan alltså dö på
samma sätt; en körning av `review-image-restore.yml` fångar dem.

Aosom-raderna kräver källfotona från Aosoms recensionsdata, som bara går att
hämta i Leonards webbläsare (se *Omgång 5*), och körs med
`aosom-review-image-restore.yml`.

#### ☠️ Bloggen, reservkatalogen och ordrarna stod inte i listan (2026-10-14)

Leonards fråga: radera alla bilder som inte används till något, varken
produkter, blogginlägg, recensioner eller annat. Biblioteket hade **44 082
filer** (alla bilder utom en svg), papperskorgen var tom. En torrkörning av
den befintliga städningen gav **2 657 oanvända filer, 2,6 GB**.

Den torrkörningen gick inte att lita på, för referenslistan saknade två läsare
till:

| läsare | id | källor, uppmätt i biblioteket |
|---|--:|---|
| butikens blogg (`content/blog/*.md`) | 215 | 61 Aosom-importer, 122 med Wix-källa, 9 kort |
| reservkatalogen (`products.json`) | 2 399 | stickprov 40: 11 med Wix-källa |
| variantbilderna (`data/variant-images.json`) | 749 | stickprov 30: alla AE-importer |
| ordrarnas varubilder (90 ordrar) | 83 | 25 Aosom-importer, 41 med Wix-källa, 6 kort |

Ingen av dem behöver sitta på en produkt. En bloggbild vars produkt fått nya
bilder, eller en vara vars order kunden fortfarande läser, hade raderats.

Två nya obligatoriska deps i `lib/aosom/media-cleanup.ts`, med samma hållning
som recensionerna: ett läsfel fäller körningen.

1. ☠️ **`listaButikensBilder`** läser butikens `/api/media-referenser`
   (`lib/wix/butikens-media.ts`). Butiken bygger listan vid varje deploy ur
   sina källfiler (`lib/media-referenser.ts` på headless-site), så en bild som
   läggs i ett nytt blogginlägg står i listan utan att någon behöver komma
   ihåg den. Golv per källa på båda sidor (blogg 100, reservkatalog 1 000,
   data 300, kod 1, totalt 1 000), annars 503 från butiken och ett avbrott
   här. Per källa, för att reservkatalogen ensam bär totalen.
2. **`listaOrderbilder`**: alla ordrar, varje Wix-id i orderns JSON
   (`lineItems[].image` är ett objekt med `id` och `url`). Search Orders
   lämnar ute PENDING och REJECTED om de inte efterfrågas, så de läses i ett
   eget anrop (`statusar` i `fetchOrders`).

☠️ **Läsare som kan svara tomt utan att kasta har golv i produktion:**
recensionerna minst 1 000 bildadresser (3 592 uppmätta 2026-10-06; fel
`REVIEWS_BACKEND` hade gett den tömda Wix-kollektionen och `[]`) och ordrarna
minst 40 (83 uppmätta 2026-10-14). Golven ligger i `liveDeps`, inte i
planeringen, så testerna kan fortfarande pröva en tom läsare.

☠️ **Butiken måste deployas FÖRE motorn.** Utan butikens lista avbryts även
nattens städning, vilket är rätt håll att fela åt men ger ett rött jobb.

**Läget `omfang=allt`** (rutten, och workflowen **"Bilder — radera oanvända
bilder i hela mediabiblioteket"**, `bildstadning.yml`, `torr` · `radera`) tar
också poleringens utsnitt och kort. Fyra egenskaper som inte ska tas bort:

1. ☠️ **Bara filer som varken skapats eller ändrats på `minAlderDagar`**
   (standard 14, minst 7, och spärren ligger i `runMediaCleanup`, inte bara i
   rutten). Andra sessioner laddar upp kandidater, utsnitt och kort som sätts
   på produkten först efter granskning; tre sådana uppladdningar kom medan
   mätningen pågick.
2. ☠️ **Aldrig en fil utan källadress eller med okänd källa** (`ingen-kalla`,
   `wix-annan`, `annan-kalla` i `Filklass`). Wix kan inte svara på var en fil
   används, och logotypen, delningsbilden och kundernas egna
   recensionsbilder ligger i de klasserna. De räknas i svaret men rörs inte.
3. **Bara id på den vanliga formen** (`raderbartId` i `lib/wix/media-idn.ts`).
   Butikens mönster är bredare och fångar varje sådant id, så ett id som
   butikens lista kan missa raderas aldrig. Kort räknas bara som våra när de
   kommer ur vårt eget repo; en bloggbild var AI-genererad via Wix
   (`wixmp…/GoogleAiProxy/Gemini`) och ligger i `annan-kalla`.
4. ☠️ **`radera` kräver `hogst`, och golven kontrolleras i motorn FÖRE
   raderingen.** Workflowen börjar med ett torrt förflygningsanrop. Svarar
   rutten utan `omfang: "allt"` är den nya koden inte i produktion, och då
   raderas ingenting. Annars skickas 95 % av varje läsares antal som `golv`
   i varje anrop, och `runMediaCleanup` avbryter efter läsningen men innan
   listningen. En kontroll i workflowen efter anropet hade kommit för sent:
   då var fönstret redan raderat (granskningen 2026-10-14). Taket räknar
   också misslyckade skopor, och raderingen gör inga nya försök efter ett
   nätverksfel, eftersom skopan kan vara raderad fast svaret aldrig kom fram.

☠️ **Ett fönster som aldrig hann börja är ett fel.** Läsarna kan äta upp
listningens tidsbudget, och då kommer inga filer och samma markör tillbaka.
Utan spärren hade det sett ut som ett genomgånget bibliotek utan något att
radera.

Nattens läge (`aosom`) raderar samma filer som förut, men med de nya läsarna.

#### ☠️ Granskningen före första körningen: varianterna och en karenstid (2026-10-14)

Tre oberoende granskningar samma kväll, innan något raderats. De hittade ingen
väg där en fil som någon av läsarna ser raderas, men fem hål runt läsarna:

1. ☠️ **Varianternas egna bilder.** Varukorgen, Wix-kassan och ordern visar
   `variantsInfo.variants[].media` (se *Variantens bild följer bara valet*),
   och den kan peka på en fil som inte längre står i galleriet. Produktsökningen
   bär inga varianter. **`listaVariantbilder`** läser dem ur Read-Only Variants
   API (`POST /stores/v3/products/query-variants`, 1 000 per sida, med markör
   och utan filter; uppmätt 2026-10-14 att `media.id` följer med, även för
   dolda produkter). Obligatorisk, golv 1 000.
2. ☠️ **Karenstid, tre dygn** (`lib/store/bildstadning-karens.ts`, tabellen
   `bildstadning_karens`). En fil raderas först när den varit oanvänd i tre
   dygn, sett av två körningar. Googles flöde serveras upp till ett dygn
   gammalt, kategorisidorna cachas en timme och påminnelsemejlen om en
   övergiven varukorg bär bilden från när varan lades i korgen, upp till 72
   timmar senare. Utan karensen hade en fil som togs bort ur ett galleri i dag
   kunnat raderas i natt och synts som död bild i alla tre. Den stänger också
   glappet i nattens läge, där en import laddar upp bilderna sekunder innan
   produkten skapas. Varje körning antecknar, även torrkörningen; en fil som
   ses i bruk glöms, och klockan börjar om när den blir oanvänd igen. Faller
   bokföringen raderas ingenting. Svaret bär `mogna` (raderbara nu) och
   `iKarens`, och workflowens `hogst` ska vara torrkörningens `mogna`.
3. **Läsarna som kunde svara halvt utan att kasta.** Produktsvepet stäms av mot
   katalogens räknare (`countProducts`, högst fem färre, samma regel som
   raderingen av pensionerade utkast) och kastar vid sidtaket. Kategoriläsaren
   kräver minst 50 lästa KATEGORIER, inte bilder: bara All Products bar en bild
   2026-10-14. Färgbildstabellen har golv 100. Workflowens golv är 95 % men
   minst 1 för en läsare som gav något.
4. **Smalare klasser.** En Wix-kopia måste ha källa i vårt eget bibliotek
   (ägarprefixet `b379ce_` före understrecket); Wix gratisbilder (`11062b_`)
   och mallens bilder (`22e53e_`) bär samma namnsignatur men kan sitta på Wix
   egna sidor. `wix-utsnitt` är bara `/v1/crop/`: butiken visar sina bilder
   som fill- och fit-adresser, och en fil hämtad från en sådan kan vara
   hämtad för hand.
5. **Workflowen** pausar tio sekunder mellan anropen (varje anrop läser ~65
   produktsidor och upp till 60 filsidor mot samma värd), redigerar felraderna
   som import-workflowen gör, och räknar klasstabellen per pass i stället för
   summerat över passen. Rutten avvisar ett `limit` som inte är ett positivt
   heltal: `limit=0.5` blev förr 0, alltså obegränsat.

6. **Den egna dubbelkollen samma kväll** hittade två saker till. Karenstabellen
   jämförs i varje körning i SIN HELHET med det läsarna använder, inte bara med
   fönstrets filer: gamla filer ligger utanför nattens fönster och ses annars
   bara vid en full genomgång, så en fil som tagits i bruk och släppts igen
   däremellan hade behållit sin gamla tid. Tabellen nycklas på samma nyckel som
   jämförelsen (`karensNyckel`: adressens id-del, gemener). Och liveDeps vägrar
   köra när `WIX_SITE_ID` och butikens sajt pekar isär
   (`kontrolleraSammaSajt`), för då läser ordrarna en annan butik än filerna.
   Fönstret är 40 sidor (4 000 filer), inte 60, och produktsvepet pausar 250 ms
   mellan sidorna: läsarna kostar nu ~80–100 anrop mot samma värd innan
   listningen börjar, och 40 håller ett anrop kring de ~125 sidor i rad som
   torrkörningen 2026-10-14 klarade.
7. **En fjärde granskning av rättningen** gav fem saker till, alla lagade:
   - Ett svar från katalogens räknare utan antal blir 0 i `countProducts`. Det
     fäller nu körningen (minst 500), i stället för att stänga av avstämningen
     (`kontrolleraProduktsvep`).
   - Variantläsaren fäller `hasNext` utan markör. Den kräver också varianter
     från minst hälften av katalogens produkter: en enda sida täcker långt
     färre, och utan behörighet för dolda produkter saknas utkasten (~40 %).
   - Ett crop-utsnitt måste också komma ur vårt eget bibliotek.
   - Kategorierna ingår inte i workflowens golv. Bara en kategori bar en bild,
     och tas den bort mitt i körningen hade varje anrop fallit.
   - Felraderna skrivs ut även när ingen skopa föll. En fallen bokföring efter
     raderingen syns bara där. `limit=0` är "inget tak" i en torrkörning, som
     import-workflowens `bildstadning-torr` skickar, men 400 i en skarp körning.

Kvar och känt, medvetet:

- Läser en körning gammal kod (en återställd deploy mitt i workflowen) märks
  det först efter anropet, högst `hogst` filer.
- **Inlägg i Wix Blog** som saknar en lokal markdown-fil visas av butiken
  (`lib/blog.ts` på headless-site) med sitt omslag, och ingen läsare ser dem.
  Inga sådana visas 2026-10-14 (alla sju har lokala ersättare). Ett omslag som
  laddats upp i Wix-editorn saknar källadress och raderas aldrig; bara en
  importerad produktbild vald som omslag kan träffas. En läsare för Wix Blog
  kräver blogg-behörighet på motorns nyckel, som inte är verifierad.
- **Bilder inuti produktbeskrivningar** läses inte (beskrivningen är 3–4 kB per
  produkt). Ingen av de 406 sparade produktsidorna hade någon 2026-10-14.
- Mejl som redan skickats (påminnelser om varukorg efter 72 timmar,
  bevakningsmejl) kan visa en bild som raderats efter karenstiden.
- Karenstiden betyder "oanvänd vid varje körning som tittade under minst tre
  dygn", inte tre dygn i sträck i realtid. En fil som tas i bruk och släpps
  igen mellan två nattkörningar syns inte som i bruk, och dess gamla tid står
  kvar.

#### ☠️ Två skilda 429:or — och den ena går inte att vänta ut

Städningen föll två gånger på rad innan den fungerade, på två olika strypningar
som ser likadana ut i ett felmeddelande men inte är samma sak:

| | svarar | vad som hjälper |
|---|---|---|
| **API-strypningen** | JSON-fel efter ~40–50 sidor i rad | backoff (2 s, 10 s, 30 s), `Retry-After` |
| **Edge-strypningen** | en **HTML-sida** efter ~150 sidor | ingenting inom ruttens 300 s |

Den andra är strukturell: **58 160 filer går inte att lista i ETT anrop**, hur
tålmodigt det än görs. Listningen är därför FÖNSTRAD — 50 sidor per körning (60 före 2026-10-14),
markör i svaret (`cursor` → `?after=`). Samma mönster som svepet och bildfixen,
och av samma skäl.

☠️ **`paging.limit` takas på 100, vad än dokumentationen påstår.** Både Search
Files och Query File Descriptors står som "up to 200 files" i dev.wix.com.
Uppmätt mot skarpa API:t 2026-08-28 svarar BÅDA `400 INVALID_ARGUMENT:
'paging.limit' must be less than or equal to 100`. En körning med 200 föll
direkt på första sidan.

Två designval bakom det som inte ska tas bort:

1. **Referenslistan läses om för VARJE fönster.** Den är ~37 sidor mot en annan
   API-familj och alltså billig. Att bära den mellan körningar hade betytt att
   en produkt som fått nya bilder sedan förra varvet såg ut att sakna dem — och
   fel åt det hållet raderar bilder som ANVÄNDS.
2. **Nattcronen kör medvetet utan markör.** Listningen sorteras nyast först, så
   ett fönster från början är exakt det som hunnit bli föräldralöst sedan i går.
   Den historiska ryggsäcken tas med workflow-läget `bildstadning`, som loopar
   markören genom hela beståndet.

⚠️ **`limit` byter täckning mot djup, och det är inte uppenbart.** Markören är
en OFFSET. Raderar ett fönster N filer krymper listan med N, men markören pekar
fortfarande på "offset 6 000" — så nästa fönster hoppar över exakt N filer:

| `limit` | hoppas över per pass | täckning |
|---:|---:|---|
| 4 000 | ~40 000 | liten del av listan |
| 1 000 | ~10 000 | nästan hela |
| 0 (torrläge) | 0 | hela |

Det förklarar både varför torrpassen träffar exakt 58 160 och varför skarpa pass
gav avtagande utfall (20 625 → 6 200 → 3 949 → 2 342 den 2026-08-28). **Kör ett
stort tak först för att få undan massan, sedan ett litet för att sopa svansen.**

Raderingen är också tidsbudgeterad (listningen får 70 %, raderingen resten).
Utan det kunde en stor `limit` dra förbi `maxDuration` och dödas mitt i skopan:
filerna ÄR raderade men inget svar kommer tillbaka, och nästa körning vet inte
vad som hände.

⚠️ Mät inte beståndet genom en MCP-loop — den slår i taket långt innan den är
klar. Det var så de första 429:orna upptäcktes.

#### ☠️ Ett fel som slukas av en kommandosubstitution finns inte

Den första torrkörningen föll med `exit 1` och **noll rader om varför**, medan
rutten hela tiden svarade 500 med ett tydligt meddelande. `anropa` i workflowen
skrev sina `::error::`-rader till **stdout**, och anroparen gör
`svar=$(anropa ...)` — kommandosubstitutionen slukade dem.

Felen går till stderr nu. Fjärde gången huset lär sig samma sak: recensions-
bilderna (2026-08-22), `Promise.allSettled` i `media.ts` (2026-08-27), en
skrivning som svarade OK utan att göra något (2026-08-27), och nu det här.
**Ett misslyckande som ingen kan se är värre än ett som skriker.**

### Att polera en Aosom-produkt

Allt utom siffrorna är **tyskt**: titel, beskrivning, säljpunkter och varje
spec-VÄRDE. Etiketterna är svenska från start — `buildSpecifications` i
`to-product.ts` sätter **exakt fem**: `Mått`, `Färg`, `Material`, `Vikt`,
`Paketmått` — eftersom feedens `Specification`-fält är tomt i 5 550 av 5 566
rader och underlaget kommer från de strukturerade kolumnerna i stället.

☠️ **`Artikelnummer` är INTE en av dem, och får aldrig läggas till.** Den här
raden räknade tidigare upp en sjätte etikett som koden aldrig har skrivit, och
det stod kvar i månader. Uppmätt 2026-09-03 på live-sajten: **fyra publicerade
produktsidor bär Aosoms artikelnummer i spec-tabellen** — två som `Artikelnummer: …` och en som döpt om etiketten till
`Modellreferens: …`. Importen kan inte ha skrivit dem: `to-product.ts`
sätter fem etiketter och `to-product.test.ts` fäller om numret dyker upp. De är
alltså skrivna vid **poleringen**, av någon som läste den här listan.

Numret är det farligaste vi har att läcka. Det står i Aosoms egen produkt-URL,
och dealproffsen.se publicerar samma sträng som `sku` och `mpn` i sin JSON-LD —
en googling ställer vår sida bredvid deras med vårt inköpspris härlett intill.
Det hör hemma på `supplierProductId` i mappningen och ingen annanstans. Byt inte
heller namn på det: `Modellreferens`, `Artikelnr` och `Referens` läcker exakt
lika mycket.

Platshållaren `[BRAND NAME]`, som står kvar i 4 975 rader, stryks redan vid
importen; den är ett mekaniskt fel med ett mekaniskt svar och får inte lämnas
åt poleringen.

`aosomFreightShare` på mappningen (0–1) säger hur mycket av inköpet som är
frakt. Över 0,5 betyder att frakten kostar mer än varan — polera dem sist, eller
kör svepet med `?skipFreightHeavy=1` och ta dem för sig.

#### ☠️ TITTA PÅ BILDERNA FÖRE TEXTEN, inte efter (2026-09-07)

Arbetsgången har varit: läs den tyska källtexten, skriv den svenska, och ta
sedan fram kontaktarket för att skriva alt-texter. Det är fel ordning, och
runda J1 visade varför.

Källan för golvlampan `13a53d52` säger *"Doppellagiger Lampenschirm"* och
listar **två skärmmått** — `Lampenschirmgröße: Ø24 x 13H cm` och
`Papierseil-Lampenschirm: Ø33 x 16H cm`. Det läses rimligen som två skärmar,
och texten beskrev följaktligen "en liten läsarm på Ø24 cm" och "en stor
skärm på Ø33 cm".

Produktbilden visar **en enda skärm**: en dubbellagrad drumskärm i pappersrep
som hänger från en böjd stång. Det finns ingen arm och ingen andra skärm.
Ø24-måttet är det INRE lagret, osynligt utifrån.

⚠️ **Ingen grind kunde ha fångat det.** Båda talen står i källan, så
siffergrinden var ren. Svenskan var korrekt, så mönstergrindarna var rena.
Felet var en riktig utsaga om en produkt som inte finns — den sortens fel som
bara ett öga på fotot ser.

**Regeln: kontaktarket byggs FÖRE brödtexten.** Det kostar ingenting extra —
bilderna ska ändå hämtas för alt-texterna — och det flyttar granskningen till
innan felet är skrivet i stället för efter att det står i Wix. Titta särskilt
på det källan beskriver med ord i stället för mått: konstruktion, antal delar,
hur något sitter fast.

Samma runda gav ett andra, mildare exempel: `d2dfd1fa` beskrevs som "tre
hyllplan runt stången" när lampan i själva verket är en öppen fyrkantsstomme
utan stång. Även det syns direkt i bilden och i ingen siffra.

#### ☠️ Skriv texten i en FIL först — mätt 9 fel mot 0 (2026-09-04)

Batch 64 skrev åtta produkttexter på två sätt, och skillnaden är inte en
smaksak utan ett tal:

| hur texten skrevs | produkter | fel som nådde Wix |
|---|---:|---:|
| Inline i API-anropet | 5 | **9** |
| Fil först, sedan grep-grind, sedan anrop | 3 | **0** |

Felen var svenska stavfel (`dögnsvarv`, `engangsjobb`, `ihopsattningen`,
`för hard underlag`) plus ETT husregelbrott: *"Leverantören anger 25–35
minuter"* — mot kunden är **vi** leverantören. Alla nio skrevs av samma modell
i samma session; det som skilde var om texten passerade en fil.

Skälet är mekaniskt. En sträng som skrivs direkt i ett JSON-anrop kan inte
läsas av en grind innan den lämnar chatten, och API-svaret ekar tillbaka exakt
det man skrev — det ser rätt ut för att det ÄR det man skrev. En fil går att
`grep`:a, och grinden tog noll sekunder.

☠️ **Och rätta per ORD, inte per förekomst.** `dögnsvarv` hittades tre gånger i
tre separata rundor — i namnet, sedan i en produkts brödtext, sedan i syskonets
— för att varje fynd lagades där det syntes i stället för att sökas i hela
batchen. Tre skrivningar och två extra läsningar för ett ord. Hittar du ett
stavfel: sök det i ALLA batchens texter innan du skriver något.

⚠️ Poleringstexten går inte att verifiera ur PATCH-svaret. `plainDescription`
ekas tillbaka ordagrant, så en felstavning bekräftas som "sparad". Det som
faktiskt fångar den är en grind före skrivningen — eller ögon efter, på en
återläsning. Nionde gången samma familj: **ett svar utan fel är inget kvitto.**

#### ☠️ Och filen är inte det som skickas — `fontagen-weight` (2026-09-06)

Regeln ovan säger *skriv i en fil först*. Den räcker inte, för filen skickas
inte: den TRANSKRIBERAS in i API-anropets kropp, och det är i den kopieringen
felet uppstår. Uppmätt samma dag, på en rättelse av tre klösträd där källfilen
var invändningsfri:

```
i filen:   <span style="font-weight: 700">Finns det något att klösa på?</span>
i anropet: <span style="fontagen-weight: 700">Finns det något att klösa på?</span>
```

☠️ **Wix STRÖP spannet tyst i stället för att avvisa det.** Ett okänt
CSS-egenskapsnamn ger inget fel — `bulkActionMetadata` svarade
`3 totalSuccesses, 0 totalFailures`, och den lagrade texten blev
`<p>Finns det något att klösa på? Ja, …</p>` med fetstilen borta. Ett ogiltigt
attribut är alltså inte ett fel utan en tomt bortstädad tagg.

Det som fångade det var **återläsningen diffad mot filen** — inte skrivsvaret,
inte ögonen. Och det gäller starkare sedan kodvägen föll: med `ExecuteWixAPI`
kunde texten läsas ur en fil server-side, med `CallWixSiteAPI` går varje byte
genom chatten en gång till.

**Regeln: filen är källan, men bara en diff mot den lagrade texten bevisar att
källan kom fram.** Tionde gången samma familj.

✅ **Och sedan 2026-09-13 fångas felet FÖRE skrivningen i stället för efter.**
Regeln ovan upptäcker transkriberingsfelet i återläsningen — alltså efter att
texten redan ligger hos kunden. Det går att stoppa tidigare, och det kostar en
rad: räkna kontrollsumman på den sträng som ligger i API-anropet, **i anropet
självt**, mot filens, och avbryt HELA skrivningen vid avvikelse.

```js
const avvik = plan.filter(p => SUMMA(p.html) !== p.raa);
if (avvik.length) return { AVBRUTET: "transkriberingsfel — ingenting skrivet", avvik };
```

☠️ **Spärren måste ligga i SAMMA anrop som skrivningen.** En kontroll i ett
eget, tidigare anrop bevisar bara att just DEN kopieringen var rätt — nästa
anrop transkriberar om texten, och det är där felet uppstår. Den ska heller
inte bara varna: `fontagen-weight` visar att en delvis skriven batch är det
dyra utfallet, för Wix strök spannet tyst och rapporterade framgång.

Uppmätt i runda M3: åtta texter, åtta träffar, noll avbrott — och
återläsningen mot facit gav LIKA på alla åtta. Återläsningen behövs
fortfarande (den är det som fångar Wix EGNA omskrivningar); den här spärren
tar bort den andra halvan, den som är mitt eget fel.

☠️ **Och i runda M4 FÄLLDE den — på facit, inte på texten (2026-09-13).**
Första skrivningen av `3523deaa` avbröts på **ett tecken av 3 515**:

```
{"AVBRUTET":"transkriberingsfel — ingenting skrivet",
 "fick":833814621,"vantat":848253086,"tecken":3514}
```

Orsaken är filens **avslutande radbrytning**. Facit räknades på filen, men
det som skickas är filen UTAN den: en template-literal som slutar med `</p>`
bär ingen sista `\n`.

⚠️ Det är SAMMA byte som `wixnorm.py` punkt 5 redan dokumenterar — men på
LÄSNINGENS sida (Wix strippar den vid sparandet). Den gällde alltså åt båda
hållen hela tiden, och bara den ena halvan var nedskriven. **Räkna facit på
strängen SOM DEN SKICKAS** (`rstrip("\n")`), inte på filen.

☠️ Och avvikelsen är just därför den farligaste sorten: en byte ser ut som en
struntsak, är omöjlig att skilja från ett äkta transkriberingsfel på ett
tecken, och den som sett den tillräckligt många gånger slutar titta efter
vilket det var. Spärren gjorde rätt som fällde — det som saknades var ett
facit som mätte samma sträng.

✅ **Sedan 2026-09-24 transkriberas ingenting alls** (Leonards beslut). Rundans
filer blir `skrivplan.json` (`tools/polish-gates/bygg-skrivplan.py`), och
workflowen **"Polering — skriv en runda till Wix"** läser planen ur grenen,
kontrollerar dess sha256 och skickar den till `/api/admin/polish-write`
(`lib/polish/skrivplan.ts`). Den skriver text, media, kategorier och SKU i den
ordningen, verifierar i en separat läsning och stämplar varje verifierad
produkt. Spärren ovan behövs inte längre, eftersom det inte finns någon avskrift
kvar som kan bli fel. Arbetsgången står i runbooken under *Rundan steg för steg*.

☠️ **Kör workflowen med `ref` satt till poleringsgrenen.** Default är `main`,
och där finns inte planen. Kontrollen av sha256 fäller en sådan körning innan
något skrivs.

##### ☠️ Och `seoData` glömdes bort av regeln — fem av åtta drev isär (2026-09-07)

Regeln ovan säger *skriv i en fil först*, och runda H3 följde den för
BRÖDTEXTEN. SEO-taggarna skrevs i stället av för hand in i API-anropet, från
minnet av `seo.tsv` i stället för ur filen. Utfallet:

| hur SEO-värdena kom in i anropet | produkter | drev isär |
|---|---:|---:|
| Lästa ur `seo.tsv` med ett skript | 3 | **0** |
| Avskrivna för hand i anropet | 5 | **5** |

Fem av fem. Det är inte slarv i enstaka fall — en avskrift ÄR mekanismen.
Ingen av de fem hade heller passerat `gate-seo.py`, som grindar FILEN: en
titel som aldrig stod i filen kan inte grindas av den. De var som tur var
korrekta när de mättes i efterhand, men det var tur och inte en spärr.

`livegrind.py`:s SEO-svep fångade alla tio avvikelserna. **Orddiffen på
brödtexten var 0 på alla åtta** — alltså exakt den asymmetri regeln förutsäger:
det som gick via fil kom fram, det som skrevs av gjorde det inte.

**Regeln gäller varje fält som når kunden, inte bara brödtexten.** `seo.tsv`
och `namn.tsv` är källor på samma sätt som `<kort>.html` — bygg nyttolasten ur
dem med ett skript.

##### ☠️ `variantsInfo.variants[].sku` ligger på TOPPNIVÅN — en skrivning under `physicalProperties` slukas tyst

Uppmätt 2026-09-07 på alla åtta produkterna i runda H3. Variantobjektet har
BÅDE `sku` och `physicalProperties`, och SKU:n bor i det första:

```
variantNycklar: ["id","visible","sku","choices","price","physicalProperties","inventoryStatus"]
variant:        {"id":"47c9772b…","visible":true,"sku":"FP-laufrad-rutscher",
                 "physicalProperties":{}}
```

En PATCH som lägger `sku` under `physicalProperties` svarar **200 utan fel** och
ändrar ingenting: fältet försvinner, och `physicalProperties` står kvar som
`{}`. Åtta produkter publicerades med sin gamla tyska SKU kvar, och svaret såg
identiskt ut mot en lyckad skrivning.

Tionde gången samma familj — och det som fångade det var återläsningen som
jämför mot det FÖRVÄNTADE värdet. En återläsning som bara kollar att fältet
finns hade sett den gamla SKU:n och sagt ja.

##### ☠️ `variantsInfo` finns ALDRIG i sökprojektionen — SKU-kollen kan passera tomt

Uppmätt 2026-09-07, `stores/v3/products/search` utan `fields`, på fyra
sidstorlekar och två olika filter:

| sidstorlek | träffar | med `variantsInfo` | med `actualPriceRange` |
|---|--:|--:|--:|
| 5 | 5 | **0** | 5 |
| 20 | 20 | **0** | 20 |
| 50 | 20 | **0** | 20 |
| 100 | 20 | **0** | 20 |

Noll av tjugo, vid varje sidstorlek, och samma sak för ett annat filter.
`variantsInfo` saknas HELT ur svaret — inte tomt, utan frånvarande (`nycklar:
28`, `harVariantsInfo: false`). En `GET /stores/v3/products/{id}` bär det.

☠️ **Och det gjorde SKU-kollisionskollen till en no-op.** Mönstret

```js
for (const p of sokträffar) for (const v of p.variantsInfo?.variants || []) …
```

itererar alltid en TOM lista, så `upptagna` blir `{}`, `krock` blir `[]` och
kollen svarar "inga krockar" utan att ha jämfört någonting. Den kördes tre
gånger på en dag och kunde inte falla en enda gång. Elfte gången samma familj:
**ett svar utan fel är inget kvitto** — och en kontroll som inte KAN fälla är
värre än ingen, för den räknas som gjord.

Två regler följer:

1. **Läs priset ur `actualPriceRange.minValue`**, aldrig ur
   `variantsInfo.variants[].price`, när källan är en sökning. Det första
   fältet finns i 100 % av svaren, det andra i 0 %.
2. ☠️ **En koll som bygger på ett fält måste AVBRYTA när fältet saknas**, inte
   rapportera noll fynd. Skillnaden mellan "inga krockar" och "kunde inte
   jämföra" är hela skillnaden mellan en grind och en vana.

⚠️ **Lagerposten bär inte heller SKU.** `inventory-items/query` returnerar
`id, revision, createdDate, updatedDate, variantId, locationId, productId,
quantity, trackQuantity, availabilityStatus, preorderInfo, product` — inget
`sku`. Det finns alltså INGEN bulkväg till variant-SKU:erna, och en
katalogomfattande dubblettrevision är 5 527 GET-anrop. Det är samma slutsats
som redan står som en öppen punkt; nu är den mätt i stället för antagen.

##### ☠️ Och `plainDescription` saknas i PRODUKTENS standardprojektion (2026-09-13)

Raden ovan gäller sökningen. Samma fälla på en enskild `GET`, och den här
gången på det fält hela poleringen handlar om. Uppmätt på en nyss skriven
produkt, samma id i båda anropen:

```
GET /stores/v3/products/{id}                           nycklar: 29, plainDescription SAKNAS
                                                       (typeof undefined — inte tom sträng)
GET /stores/v3/products/{id}?fields=PLAIN_DESCRIPTION   3 434 tecken, rätt svensk text
```

☠️ **Och den vanliga defensiva raden gör det värre.** `p.plainDescription || ""`
förvandlar ett SAKNAT fält till noll tecken — alltså ett svar som i loggen ser
ut som ett bevis på att skrivningen föll. Åtta produkter rapporterades som
oskrivna av en återläsning som aldrig hade bett om fältet.

Det är EN NIVÅ VÄRRE än släpet i avsnittet ovan: släpet är icke-deterministiskt
och går över, det här utfallet är stabilt och reproducerbart, så en omskrivning
på den signalen hade gjorts med full övertygelse — och skrivit över en text som
redan stämde.

**Regeln: en återläsning som rapporterar NOLL måste först bevisa att fältet
fanns i projektionen.** Tre fält krävs på den här rutten och inget är med som
standard:

```
?fields=PLAIN_DESCRIPTION&fields=MEDIA_ITEMS_INFO&fields=DIRECT_CATEGORIES_INFO
```

⚠️ Och `directCategoriesInfo` bär bara `id` i den projektionen, inte `name`. En
kontroll som läser `c.name` får `null` på varenda rad och kan alltså aldrig
fälla — samma klass som SKU-kollen som itererade en tom lista.

⚠️ **Kategoriräkningen är dessutom alltid +1.** Wix lägger själv till
`All Products` (`05e96cd6…`) och använder den som `mainCategoryId`. Ett facit
som räknar bara de kopplade kategorierna blir rött vid varje körning.

##### ⚠️ Kategoriläsningen är eventuellt konsistent — bulk-svaret är kvittot

`bulk/categories/{id}/add-items` följt av en omedelbar
`GET …?fields=DIRECT_CATEGORIES_INFO` rapporterade 7 av 8 kopplade. Den
åttonde var redan kopplad: nästa anrop svarade `ALREADY_EXISTS` på båda
kategorierna, och en läsning en stund senare visade alla tre.

Läsprojektionen släpar alltså efter skrivningen. **Facit är bulk-svarets
`itemMetadata`/`bulkActionMetadata` per rad** — samma form som lagersynkens
`tolkaBulkUtfall` redan bygger på. En snabb återläsning kan UNDERrapportera,
och en omkörning på den signalen är ofarlig men vilseledande.

##### ☠️ Och PRODUKTläsningen släpar likadant — fast åt det DYRA hållet (2026-09-13)

Raden ovan gäller kategorier, där en efterläsning som underrapporterar bara
leder till en ofarlig omkörning. Samma sak mätt på PRODUKTEN i runda M2, och
där kostar felriktningen mer.

Åtta produkter skrevs i en loop som gjorde PATCH och sedan en `GET` i samma
anrop. Två av dem — `321bdedf` och `80e1a550` — läste tillbaka som om
INGENTING hade skrivits:

```
efter PATCH, samma anrop   plainDescription 2 530 tecken, summa 834388551
                           (= exakt KÄLLANS kontrollsumma, alltså tyskan)
                           slug: lebkuchenmann-…   visible: false   5 seo-taggar
en stund senare            revision 2 → 4
                           plainDescription 3 962 tecken, summa 881571526
                           slug: uppblasbar-pepparkaksgubbe-…   visible: true
```

Skrivningen hade tagit hela tiden. Det var LÄSNINGEN som ljög, och den ljög
trovärdigt: kontrollsumman stämde exakt mot källan, alltså såg svaret ut som
ett välgrundat "din text kom aldrig fram".

☠️ **Det farliga är vad man lockas göra.** Ett falskt *"ingenting skrevs"*
inbjuder till en omskrivning av något som redan stämmer — med en revision som
hunnit bli inaktuell, eller ovanpå en skrivning man inte visste fanns. Till
skillnad från kategorifallet finns här inget bulk-svar att falla tillbaka på.

**Regeln blir tre led, och det sista är det som gäller:**

1. PATCH-svaret är ingen återläsning — dess projektion utelämnar
   `plainDescription` och `media.itemsInfo`, så en helt lyckad skrivning
   rapporterar `0 tecken, 0 bilder`.
2. En återläsning i SAMMA anrop är inte heller ett kvitto.
3. Det som räknas är en **separat läsning en stund senare**, mot ett facit
   räknat ur filen.

⚠️ Och innan du kallar en skrivning misslyckad: läs om. Fem av åtta produkter
i samma loop läste tillbaka korrekt direkt — släpet är inte deterministiskt,
så ett enstaka rött utfall är en anledning att titta igen, inte att skriva om.

##### ☠️ Variant-SKU:n tappas TYST i en kombinerad PATCH — skriv den SIST och ENSAM

Uppmätt i runda M2 på fyra produkter. En PATCH med `name` + `slug` +
`plainDescription` + `seoData` + `visible` + `variantsInfo`, följd av en
media-PATCH med `fieldMask: ["media"]`, skrev allt UTOM variantens `sku` — på
**tre av fyra**.

```
skickat   variantsInfo.variants[0].sku = "FP-tomte-240-klappsack"
lagrat    variantsInfo.variants[0].sku = "FP-weihnachtsmann-2-40-m"
svar      200, inget fel, inget bulkActionMetadata att läsa
```

Den fjärde fick sin SKU bara för att den råkade skrivas i ett eget, senare
anrop under felsökningen. Skriven ensam EFTER mediaskrivningen tog den på 8/8.

**Ordningen är alltså inte valfri:** text och identitet först, media sedan,
`variantsInfo` i ett EGET sista anrop — och verifierad i en separat läsning
enligt regeln ovan.

Besläktad med `variantsInfo.variants[].media`, som inte går att sätta efter
skapandet och strippas tyst av bulk-skrivningar. Mönstret är detsamma:
**`variantsInfo` tål inte att samåka med andra fält**, och den tiger när den
inte tas emot.

#### ☠️ Filgrinden täcker bara halva vägen — grinda den PUBLICERADE texten

Raden ovan sa "ögon efter". Ögon räcker inte: batch 65:s två fel stod kvar i
tre rundor, och det ena återinförde jag identiskt i mitt eget rättningsförsök.
Grinden är byggd sedan 2026-09-04 och heter **`tools/polish-gates/livegrind.py`**.

Den hämtar de publicerade sidorna och gör tre saker:

1. **Orddiff mot källfilen.** Det är den som biter. Vilket transkriberingsfel
   som helst blir en rad — inte bara de mönster någon råkat tänka på.
2. **Homoglyfsvep** på live-texten (kyrilliskt/grekiskt).
3. **Sid- och alt-svep**: husmärke, artikelnummer, fraktland, tyska rester.

☠️ **ALT-TEXTERNA MÅSTE SVEPAS SEPARAT.** Ett sidsvep som strippar taggar ser
inte in i `alt=""` — och det är precis där de tyska resterna sitter kvar efter
en polering som bara rört beskrivningen. Batch 66 lämnade åtta produkter med
`alt="Kaninchenstall aus Holz Hasenstall mit Rädern Klappdach…"` efter en
felfri textpolering. Beskrivningen var ren; bilderna skrek tyska.

⚠️ **Butiken skriver om markupen med flit** — beskrivningen delas i flikar
(`pdp-flikar` / `details` / `summary`) vid `<h2>Tekniska specifikationer</h2>`.
En exakt sträng­jämförelse mot källfilen faller därför alltid. Jämför BRÖDTEXT.

⚠️ **Vänta ut butikens ISR-cache.** Sidorna är prerenderade
(`x-nextjs-stale-time: 300`). En hämtning direkt efter skrivningen serverar den
GAMLA sidan, och den ser ut precis som en fungerande ny — samma fälla som
recensionsverifieringen gick i. Första träffen efter fönstret triggar en
bakgrundsrendering; NÄSTA hämtning får den färska sidan. `?cb=` hjälper inte.

Verifierad genom att återinföra batch 65:s exakta fel — ett kyrilliskt `т`
(U+0442) i "granträ" — i en av åtta hämtade sidor: grinden fäller på rätt
produkt, och bara den, med både orddiffen och homoglyfsvepet.

**Regeln: en grind på det du SKICKAR är inte en grind på det som LIGGER UTE.**

#### ☠️ Katalogsvepet: fem fel, och fyra av dem var osynliga (2026-09-07)

Slutkontrollen av flikreparationen ställde ALLA runbook-krav mot hela den
publicerade katalogen i stället för mot de trettio sidor den gällde. Den
hittade fem fel, och bara ett av dem hade någon märkt av sig självt.

| fel | omfattning | hur det syntes |
| :-- | --: | :-- |
| Spec-tabellen under fel rubrik → renderas INLINE | **128 sidor** | inte alls |
| `Frågor och svar` i stället för `Vanliga frågor` | **56 sidor** | inte alls |
| Leverantörens artikelnummer i kundtexten | 2 sidor | inte alls |
| Tyskt `klappbar` där svenskan är `fällbar` | 4 sidor | inte alls |
| Tyska SEO-titlar | 5 sidor | inte alls |

☠️ **De 128 är den dyraste, och runbooken förutsade den exakt:** "det ser inte
trasigt ut, bara som en rubrik till". Sidorna är välskrivna svenska sidor ur
rundorna 19–33 — felet var behållaren, inte texten. Rubrikerna de använde:
`Måtten` (59), `Mått och material` (54), `Mått och vad som ingår`,
`Mått och utrustning`, `Mått och funktioner`.

⚠️ **`klappbar` är tyska**, och det tog sig ända in i två PRODUKTNAMN. Svenskan
är `fällbar`. Samma familj som `Kippskydd` och den danska `et plant gulv`: ett
ord som ser svenskt ut och därför passerar varje grind som letar efter tyska
meningar. Slugen lämnades orörd — en ändrad slug bryter varje befintlig länk.

⚠️ **Och en femtaggars-SEO gömde det sista.** Två av sidorna bar importens FEM
seoData-taggar, inte husets två, och `klappbar` levde kvar i `og:title` sedan
titeln rättats. Regeln "TVÅ taggar, inte fem" är alltså inte kosmetik: en tredje
tagg är ett gömställe. 598 publicerade produkter bär fortfarande fler än två —
inga med tyska (mätt över alla fem taggtyperna), men formen är avvikande.

**Regeln: en riktad kontroll hittar det den letar efter. Kör den breda ändå.**
De fyra osynliga felen hade ingen anledning att dyka upp i någon av de
mätningar de faktiskt hörde hemma i.

#### ☠️ En backfill som rapporterar NOLL kan ha mätt fel sak (2026-09-07)

SEO-backfillen 2026-09-06 tog 49 tyska titlar till 0 över hela katalogen.
Talet stämde — och fem tyska titlar levde ändå kvar, publicerade, i en månad.

Klassificeraren krävde ett tyskt **funktionsord** (`und`, `mit`, `für`, `der`,
`die`, `das`). De fem har inget:

```
Schlafsessel Relaxsessel Gästebett. abnehmbarer Bezug
Polstersessel, Schaumstoff-Füllung, Kautschukholz
Polstersessel im Skandi-Design, Samtoptik, Massivholz
```

Rent tyska titlar, byggda enbart av substantiv och sammansättningar. Anteckningen
sa själv att talet var ett **GOLV** — och just därför var "0" inte samma sak som
"inga". Ett golv som når noll är fortfarande ett golv.

☠️ **Regeln: en nolla från en klassificerare mäter klassificeraren, inte
verkligheten.** Ett svar utan fynd är inget kvitto, tolfte gången — och den här
gången var det inte ens ett fel i koden, bara ett underlag som var smalare än
frågan. Samma familj som livegrinds sextonordslista (avsnittet ovan): grinden
var påslagen, dokumenterad, och kunde inte se.

Bredare klassificerare (tyska substantiv och sammansättningar, inte bara
funktionsord) över hela den publicerade katalogen 2026-09-07: **2 244 produkter,
0 utan SEO-titel, 5 tyska — samma fem.** Efter lagningen 0.

⚠️ Och de fem hittades inte av en SEO-mätning. De föll ut ur en helt annan
kontroll: slutverifieringen av flikreparationen ställde ALLA runbook-kraven mot
de trettio sidorna, inte bara det den var ute efter. En bred slutkontroll hittar
det en riktad aldrig letar efter.

#### ☠️ Och en fjärde: checklistan som ingen mätte (2026-09-06)

Runbookens Klart-kriterium har punkterna. Det som saknades var en KONTROLL av
att de gjorts. Uppmätt över 57 publicerade sidor ur rundorna A–F1, noll
hämtningsfel:

| krav som stod i Klart-kriteriet | föll på |
|---|--:|
| Kategori kopplad (brödsmulan ≠ *Hem / Butik / produkt*) | **41 av 57** |
| Fliken `Användning och skötsel` (obligatorisk sedan 2026-08-30) | **41 av 57** |

Båda syns i den RENDERADE sidan, och båda är nu maskinellt grindade i
`livegrind.py`. Verifierad åt båda hållen: den fäller på alla åtta F1-sidor och
går REN på referenssidor ur andra rundor, som klarar kraven.

✅ **Alla 41 lagade samma dag: 57 av 57 klarar nu båda kraven.** Kategorin är
`Husdjur` + löv för klösträden och `Hem & Inredning` utan löv för sittmöblerna —
trädet har inget sittmöbel-löv, och runbooken säger att toppkategorin räcker då.
Skötseltexten är skriven per materialgrupp och grindad före varje skrivning
(`gate-skotsel.py`): manchester borstas i luggens riktning, teddyfleece dammsugs
med lågt sug, gummiträ torkas torrt, snurrfoten rensas från hår, och golvsoffan
har inga skruvar att efterdra. En mall hade varit snabbare och sagt fel om åtta
av produkterna.

⚠️ **Och ISR-fällan slog till en gång till, i mätningen av lagningen.** Ett svep
med tre pass — varm träff, 310 s, varm träff, 90 s, mät — rapporterade två sidor
som fortfarande trasiga. Wix hade dem rätt, och en omhämtning gav rätt svar
direkt. Svepet läser 57 sidor sekventiellt, så de som lästes tidigt hann inte få
sin omrendering klar. **En sida i taget är facit; ett svep är ett stickprov med
tidsberoende.** Läs age, och läs om de som faller innan du kallar dem trasiga.

☠️ **Lärdomen är inte "läs checklistan noggrannare".** Den lästes — punkterna
citerades till och med i rundornas README-filer. En checklista som bara hjälper
den som redan kommer ihåg punkten är ingen spärr, det är en påminnelse. Samma
klass som `SHIP_AXIS_RE` och `EU_TULL_CODES`: **en regel utan grind glider.**

⚠️ Och en regel till som gäller den som skriver flikarna: strängen måste stämma
ORDAGRANT (`Tekniska specifikationer` · `Användning och skötsel` ·
`Vanliga frågor`). Skriver du `Specifikationer` matchar splittern inte och
spec-tabellen renderas inline mitt i brödtexten — det ser inte trasigt ut, bara
som en rubrik till.

#### ☠️ En grind kan vara PÅSLAGEN och ändå blind — alt-svepet var det (2026-09-07)

Runda J2 publicerade åtta lampor med invändningsfri svensk brödtext
(orddiff **0 på alla åtta**) och **fyrtio tyska alt-texter**. Alt-filen fanns,
`gate-alt.py` gick ren på den — men ingenting skrev den till Wix. Steget
saknades i rundan, och inget svar från något API sa emot: produkten sparades,
bilderna satt kvar, allt rapporterade framgång.

Det som fångade det var live-grindens alt-svep. Det svepet fanns sedan
2026-09-06 — men bar då `livegrind.py`:s EGNA sextonordslista, ett avtryck av
hundkojerundan. Inget av de fyrtio felen stod i den:

```
i alt-texten:  "Deckenlampe mit Acryllampenschirm, Metall, Halogen- und LED-kompatibel"
gamla listan:  hundehütte · kaninchenstall · hasenstall · fressnäpfen · dachterrasse …
gatelibs:      mit · und · für · Weiß · Braun · Stahl · Schwarz …
```

Grinden var alltså **påslagen, dokumenterad och räknad som gjord** — och kunde
inte fälla någonting på en lamprunda. Den hittade felet först samma dag som
ordlistan lades om till gatelibs (se avsnittet ovan), på den allra första
rundan efter ändringen.

☠️ **Regeln: att en grind FINNS säger ingenting om att den kan SE.** Samma
klass som runda G:s döda `(?!)`-mönster, men värre — där var uttrycket trasigt,
här var grinden felfri och underlaget för smalt. En grind vars ordlista är ett
avtryck av en enskild runda mäter bara den rundan.

⚠️ Och lagningen är verifierad åt båda hållen, för det är det enda som skiljer
en levande grind från en död: 24 redan verifierade sidor ger fortsatt 0 fynd
(enda undantaget är butikens egen `EU-lager`-ribbon), och tre planterade fel —
`Gewicht` i `<title>`, `Kunststoff Rückenlehne` i en alt-text och
"Leverantören anger" i brödtexten — ger sex träffar över sid-, alt- och
SEO-svepet.

#### ☠️ Och GRINDARNA själva drev isär — 19 kopior i tre versioner (2026-09-06)

Varje runda kopierade in `gate.py`, `gate-alt.py`, `gate-seo.py` och `hasha.py`
i sin egen katalog. Vad som skilde var inte strukturen utan ORDLISTAN över
tyska rester:

```
runda A/F1   …|Kinder|Sofa|Jahre|Maße|robust|niedlich|gemütlich|…
runda F2     …|Kratzbaum|Katzen|Plüsch|…
runda G1/G2  …|Stuhl|Bezug|Kufen|Polsterung|Schaukel|kuschelig|flauschig|…
```

Varje runda **ersatte** föregående rundas ord med sina egna, så unionen har
aldrig körts. Runda H1 (kattlådor) gatades med gungstolarnas vokabulär —
`Katzen`, `Deckel`, `Schaufel` och `Edelstahl` kontrollerades aldrig.

☠️ **Och runda G:s stavningslista bar ett DÖTT mönster.**
`gungstol(?=en\b)(?!)` — `(?!)` misslyckas alltid, så uttrycket kan aldrig
träffa något. Det hade ersatt runda A:s fungerande `storlek(?!en|ar)`-koll. En
grind som ser komplett ut och inte kontrollerar något är värre än ingen alls,
för den räknas som gjord.

✅ **Skadan är noll, och det är mätt.** Alla fyra tidigare rundor kördes om mot
unionens ordlista: F1, G1, G2 och barstolen ger **0 fynd**. Hålet var latent,
inte utfallet. Det som däremot är utfallet är att **runda F2 saknade
textgrinden helt** — katalogen har varken `gate.py` eller facit-fil för den
rundan, så dess åtta sidor har aldrig siffergrindats.

Grindarna bor sedan dess i `tools/polish-gates/` med ordlistan i `gatelib.py`,
och rundorna anropar dem därifrån — precis som `livegrind.py` redan gjorde:

```
python3 ../../polish-gates/gate.py
```

Fyra egenskaper som inte ska tas bort:

1. ☠️ **Orden får bara LÄGGAS TILL, aldrig bytas ut.** Att stryka ett ord för
   att "det gäller inte den här rundan" är exakt hur listorna drev isär.
2. ☠️ **`lib/polish/gate-kopior.test.ts` fäller om en kopia dyker upp** i en
   rundas katalog, och namnger filen. Verifierad genom att återinföra buggen.
   Rundespecifika grindar (`gate-skotsel.py`, `gate-kort.py`) är undantagna —
   de kodar en enskild rundas materialgrupper och har ingen delad sanning att
   glida ifrån.
3. **Råd-tal ligger i rundans `rad-tal.txt`, inte i koden.** G1 hade `{"20"}`
   hårdkodat i sin kopia; nästa runda ärvde talet utan att veta varför.
4. **Grinden läser BÅDA facit-formaten** (`kallor-tal.json` med tal-listor,
   `kallor.json` med hela källtexten). Annars går en äldre runda inte att
   grinda om — och det är just omgrindningen som avslöjar att listan glidit.

**Regeln, en gång till och nu om grindarna själva: en tvilling glider isär, och
den som glider tystast är den som ser ut att fungera.**

##### ☠️ Och FACIT för återläsningen var en tredje tvilling (2026-09-15)

Runda N2:s återläsning rapporterade `SKILJER` på **alla åtta** produkterna.
Skrivningarna var byte-exakta. Det var facit som var fel, och avvikelsen var
exakt **7 tecken per `<li>`** — 63 till 105 tecken, alla åt samma håll.

`hasha.py`, som bygger varje rundas `vantat-hash.tsv`, hämtade sin
normalisering ur `gatelib`. Tre kopior fanns samtidigt, med tre olika svar på
samma fråga:

```
gatelib.normalisera   2 regler   vitrymd + target="_self"
kvitto.py             4 regler   saknade den avslutande radbrytningen
wixnorm.normalisera   5 regler   uppmätt mot skarpa V3
```

Mot `wixnorm` stämmer den lagrade texten på 8 av 8. De två andra är borta —
`gatelib.normalisera` hade EN användare och togs bort i stället för att lämnas
kvar som en tredje sanning någon kan råka läsa.

⚠️ **Riktningen är det som gör felet dyrt.** En KORREKT skrivning rapporteras
som misslyckad. En återläsning som lyser rött varje gång lär mottagaren att
sluta läsa — samma argument som mot att varna vid 48 h på token-förnyelsen —
och då är även det äkta larmet borta. En spec-flik är alltid en `<ul>`, så
felet gällde varje runda.

`lib/polish/wixnorm-tvilling.test.ts` fäller på tre olika sätt: källkodsgrinden
på att en andra `def normalisera` finns, längdtestet på att `<li>` inte räknas,
hashtestet på att svaret skiljer sig från wixnorm.

#### ☠️ Och en TREDJE blind fläck: `<title>` och metabeskrivningen (2026-09-06)

Poleringen skriver `name` och beskrivningen. Den rör **aldrig `seoData`** —
och det är `seoData` som blir sidans `<title>` och `<meta name="description">`,
alltså precis det Google VISAR i sökresultatet. Aosom-importen sätter dem från
den tyska feeden, och ingenting har någonsin skrivit över dem.

Uppmätt på runda F1:s åtta klösträd, samtliga med **orddiff 0** mot källfilen:

```
<title>Kratzbaum Deckenhoch, 228-260 cm Höhenverstellbarer Katzenbaum</title>
<meta name="description" content="Verwandeln Sie Ihr Zuhause in ein Paradies…">
```

Brödtexten var alltså invändningsfri svenska medan sökresultatet var tyskt.
Över hela katalogen: **49 av 2 032 publicerade sidor** bär tysk SEO-titel
(1 443 har svensk titel med `| Fyndplats`, 540 en autohärledd utan suffix).
Talet är ett GOLV — klassificeraren kräver ett tyskt funktionsord.

☠️ **Båda de gamla svepen missade det, av olika skäl.** Metabeskrivningen ligger
i ett ATTRIBUT, och sidsvepet strippar taggar — samma blinda fläck som
alt-texterna hade. `<title>` syns visserligen i sidsvepet, men det som fällde
var artikelnummer-mönstret som råkade träffa `228-260`; runda D1:s
*"Schlafsessel, Gästebett, verstellbare Rückenlehne"* hade gått rakt igenom.
**Grinden fångade rätt fel av fel skäl, och bara på tre av åtta sidor.**

Grindarna är därför två nu, och den andra är den som biter:

- `gate-seo.py` i rundans katalog — filgrind på `seo.tsv` med siffergrind mot
  produktens egen källtext, längdtak (60/160) och krav på `| Fyndplats`.
- `livegrind.py` har ett **SEO-svep** som läser `<title>`, `description`,
  `og:title` och `og:description` ur den publicerade sidan och jämför dem
  EXAKT mot `seo.tsv` när filen finns. En mekanisk jämförelse behöver inte veta
  vilket språk felet är på — mönstergrindar gör det.

☠️ **Formen är TVÅ taggar, inte fem.** Uppmätt på runda A och C2: med bara
`title` + `meta description` i `seoData.tags` härleder butiken `og:title`,
`og:description` OCH `twitter:title` ur dem. Importens fem taggar bär tyska
og-värden som ska BORT, inte skrivas om. Rensa även
`seoData.settings.keywords` — importen lägger ett tyskt huvudnyckelord där med
`origin: "USER"`.

#### ☠️ En OMERGAD gren skyddar ingenting — workflowen körs från `main` (2026-09-07)

Allowlisten i `polish-mapping.yml` (som utelämnar `costUsd`, `landedCostSek`,
`supplierProductId`, `sourceUrl` och `aosomFreightShare` ur den PUBLIKA
Actions-loggen) skrevs samma dag och låg på en gren. Åtta `las`-körningar i
runda K1 startades med `ref: main` — alltså mot den GAMLA versionen av
workflowen, som skriver ut hela mappningsraden.

Följden var exakt det par som feed-adressen är hemlig för att skydda:

```
"costUsd": …,  "landedCostSek": …,
"supplierProductId": "aosom:…",
"sourceUrl": "https://www.aosom.de/item/…"
```

Loggarna för de åtta körningarna är raderade (`delete_workflow_run_logs`), och
resten av rundan kördes mot grenen i stället. Skadan är därmed begränsad till
det fönster de låg uppe — men den var **helt onödig**.

☠️ **Regeln: en fix som inte är mergad finns inte för den som kör workflowen.**
`workflow_dispatch` tar en `ref`, och default är `main`. Skriver du en spärr i
en workflow måste du antingen merga den innan du kör, eller uttryckligen ange
din gren som `ref` — varje gång, i varje körning. En halvvägs utrullad spärr är
farligare än ingen, för den känns som ett skydd.

⚠️ Och den gamla lärdomen gäller igen: **Actions-loggar på ett publikt repo går
att läsa utan inloggning.** Det finns ingen "intern" logg här.

#### ☠️ Korten GRINDAS sedan 2026-09-16 — och de byggs ur en fil

`KORTLACKAN.md` mätte nio publicerade sidor där leverantörens artikelnummer
eller husmärket ligger **inbränt i en bild vi själva tillverkat**, och bad
uttryckligen om en grind. Den finns nu: `tools/polish-gates/gate-kort.py`
läser rundans `kort.tsv`, och `bygg-kort.py` renderar ur SAMMA fil efter att
ha kört grinden. Ett kort som renderats innan det grindats är ett kort någon
kan hinna ladda upp.

Utan OCR går den renderade PNG:en inte att läsa mekaniskt. Det som går är att
grinda INDATAN — samma regel som redan gäller brödtexten, `seo.tsv` och
`namn.tsv`: **bygg nyttolasten ur filen med ett skript, skriv den aldrig av.**

Åtta kopior försvann på köpet: tre `gate-kort.py` (F2, G1, G2) som
kontrollerade olika saker och fem `bygg-kort.py`. Varje kopia `exec`:ade
byggarens KÄLLKOD med strängdelning, så definitionen gick bara att grinda
genom att köra byggaren. `gate-kopior.test.ts` hade dessutom `gate-kort.py`
som "rundespecifik" — ett felaktigt undantag, och exakt så en tvilling uppstår.

**Grinden fäller på:** allt `gatelib.GRINDAR` fäller · ett tal utan täckning i
källan · ett tal kortet har men sidans spec-rad inte · två kort med identisk
text · en produkt i `slugs.txt` utan kortrad · en alt-text i `kortalt.tsv`
med samma fel · fel enhetsmarkup · en enhet som inte följer på ett tal.

☠️ **EN GRIND PÅ FILEN ÄR INGEN GRIND PÅ PIXLARNA.** Första omgången N2-kort
gick ut med SVARTA UNDERSTRUKNA enheter i stället för husets orange: ett
konverteringsskript hade bytt `<span class=u>` mot `<u>`, filen såg rimlig ut
och grinden var ren. `cardkit` stylar `.u` och ingenting annat, så varje annan
tagg blir webbläsarens default. Det som fångade det var ögon på ett beskuret
PUBLICERAT kort. Korten är utbytta på plats och grinden kräver numera husets
markup.

⚠️ **Två regler prövades och en förkastades av MÄTNINGEN.** En koll på att
enhetsspannets INNEHÅLL är en känd enhet fällde fyra KORREKTA publicerade
G1-kort (`15 cm tjock` är en medveten formulering) och missade defekten den
byggdes för — `m` ÄR ju en giltig enhet. Regeln som gäller är mätt: över sex
rundors kortfiler finns **342 enhetsspann, och 341 föregås av en SIFFRA**.
Den enda avvikelsen var defekten (`…sku` + `m`, ordet *skum* delat av en
avdelare med `(cm|kg|m)$`). En enhet hör till ett tal.

☠️ **UPPLADDNINGENS SVAR EKAR INGEN KÄLL-URL.** `UploadImageToWixSite` ger en
lista med id i samma ordning som `imageUrls`, men utan att säga vilket id som
kom från vilken adress — alltså samma attribution-på-ordning som huset redan
vägrat lita på i lagersynken. Varje uppladdad fil hämtas därför hem igen och
md5-jämförs mot sin lokala kopia. Uppmätt: 8 + 8 + 4 av 12 filer
byte-identiska, alltså är parningen BEVISAD och inte antagen.

⚠️ **Korten är 1600 × 1600**, inte `render`:s råa 3200. Talet är läst ur en
redan publicerad kortfil, inte valt.

#### ☠️ Tre publicerade/utkastade sidor var EN kattlåda (2026-09-16)

Dubblettskärmen i runda N2 pekade ut åtta kandidater. Bildhashen (#243) gav
**noll** träffar på alla åtta — och det är ett ÄKTA negativt, inte en trasig
metod. Kontrollen som visar det: elva produkter, däribland tre par med
IDENTISKT tyskt namn och nästan samma pris, har alla olika hash OCH olika
filstorlek. Det är genuint olika foton. Bildgrinden ser bara den
byte-identiska klassen, precis som huset redan skrivit ned.

Det som avgjorde var måtten — den VIDA trippelkollen, inte `Mått:`-raden:

| | måtttripplar |
|---|---|
| `adb8c31b` **publicerad**, 729 kr | 39,8×41,3×52,4 · 21×44×54 · 14×40×52 · 3,5×10,5×25,5 · 1,5×8×8 |
| `dd8902e8` utkast, 769 kr | **samma fem** |
| `d499532f` utkast, 799 kr | **samma fem** |

Fem av fem identiska, inklusive skopan på 3,5 × 10,5 × 25,5 cm. Tre sidor,
en produkt. Samma sak för hundbäddarna `65d3d373` (719 kr) och `2ed2f82b`
(759 kr): båda tripplarna identiska, samma tyska namn.

☠️ **Och ommappningen var en no-op, precis som `34341c4f`.** Mappningsraden
för den publicerade sidan säger `supplier: "aosom"` — alltså finns ingen
AE-rad att peka om, och hindret `redan_aosom` hade fällt en körning.
Husregeln *"äkta dubbletter mappas om till Aosom"* antar tyst att sidan vi
behåller är en AE-rad. Andra gången den antagandet inte håller.

Åtgärden är därför pensionering: `dd8902e8`, `d499532f` och `2ed2f82b` bär
`draftStatus: "rejected"`, `needsAiPolish: false`. Ingen raderas — ett
osynligt utkast kostar ingenting, och en radering går inte att ångra.

⚠️ **De fyra andra kandidaterna är FRIKÄNDA, inte obehandlade.** `e397f6b3`
är en annan kattlåda (29,7 × 40,2 × 60,2), `9a66c056` krockar med ingen
publicerad soptunna, `b50a2c94` har ingen publicerad motsvarighet alls (de
fyra "publicerade skärmtaken" i första svepet var hundvagnar med *Vordach* i
namnet), och `70c17966` saknar huvudbild helt — vilket är ett eget fynd.

#### ☠️ Flera produkter kan dela EN SKU — kolla varje batch

Importen härleder variant-SKU:n ur den tyska titelns första ord, så produkter
vars titlar börjar likadant får samma sträng. Batch 66 hittade sex produkter på
två SKU:er: fyra kaninhus på `FP-kaninchenstall-aus-holz` och två hundkojor på
`FP-hundehutte-aus`. Det är inte unikt för den batchen — läs `las`-svaren mot
varandra innan du stämplar, och ge varje produkt en egen svensk SKU på BÅDA
sidorna (Wix-variantens `sku` och mappningsradens).

## VEVOR: steg 1 och 3 — leverantören är en uttömmande typ (2026-10-21)

VEVOR kan bli den tredje leverantören. Inga VEVOR-varor finns i butiken. Det
som byggts är grunden, som gör motorn bättre även om VEVOR aldrig blir av.
Steg 2, läsaren av VEVOR:s produktsidor, byggs inte förrän VEVOR svarat på
fråga 4 i mejlet (får vi läsa sidorna?) och Leonard har bestämt sig.

### Steg 1: varje val mellan leverantörer tar ställning till alla

Koden valde väg med två grenar: "är det AliExpress? annars Aosom", eller
tvärtom. En tredje leverantör hade hamnat i fel gren utan att något fel syntes.
Konkurrentpris-planen hade kunnat ge en VEVOR-rad dealproffsens pris, och
ommappningen hade behandlat en VEVOR-sida som en AliExpress-sida.

- `LEVERANTORER = ["aliexpress", "aosom", "vevor"]` i `lib/store/index.ts`.
  `MappingSupplier` härleds ur listan, och `Leverantor` är den plus `"okand"`.
  Prefixen bor i `lib/store/leverantorsprefix.ts`.
- `mappingSupplier()` (`lib/store/supplier.ts`): ett känt sparat fält vinner,
  ett okänt sparat värde blir `"okand"`, och utan fält avgör prefixet (`aosom:`,
  `vevor:`). Annars blir raden `"aliexpress"`, som förut.
- Kod som bara gäller en leverantör använder ett positivt filter
  (`if (!isAosomMapping(m)) continue;`). En verklig skillnad per leverantör är
  ett `switch` med `assertNever`, eller en `Record<Leverantor, …>`. Då stoppar
  `next build` en ny leverantör tills den fått ett svar på varje ställe.
- `frystLeverantor()` skriver klassningen till fältet när `supplierProductId`
  töms (pensionering och radering). Ett okänt sparat värde behålls.

☠️ **Ingen befintlig rad bytte klass.** Den enda väg som fanns är en rad UTAN
fält vars id börjar med `vevor:`: den var AliExpress förut och är VEVOR nu.
Ingen kod har skrivit ett sådant id, och räkningen nedan fäller om det finns ett.

☠️ **Grinden är `lib/store/leverantorsval-grind.test.ts`.** Den läser koden med
TypeScripts egen parser och fäller sex former av tvåvägsval (R1–R6). På main
före ändringen fann den 17 ställen: 15 är omgjorda och 2 är undantagna med skäl
(`UNDANTAG`), och testet fäller om ett undantag inte längre finns i koden.
Verifierad genom att återinföra `if (isAliExpressMapping(m)) {` i
konkurrentpris-planen: exakt den raden fälls, som R3. Ett val som döljs bakom
en funktion ser grinden inte. Tre sådana hittades vid granskningen:
ommappningen, beställningens felmeddelande och poleringens `regelGäller`.

Vad en VEVOR-rad får i dag:

| väg | VEVOR |
|---|---|
| beställningen (`place-order.ts`) | vägras, och felet pekar på VEVOR:s kassa och workflowen "Order — beställd eller skickad för hand" |
| AliExpress-åtgärderna i `/admin` | vägras med eget meddelande (`utanAeIdFel`) |
| ommappningen | hindret `vevor_sida` (`okand_leverantor` för ett okänt värde) |
| konkurrentpris, dealproffsen, Google-tillägget | aldrig med |
| AE-synken och Aosom-synken | aldrig med |
| restock-listan | lagret hos leverantören visas som okänt |
| leverantörslänkarna | namnet VEVOR, och en länk bara ur mappningens `sourceUrl` |

⚠️ **En avsiktlig beteendeändring:** poleringens prisgrind (`regelGäller` i
`lib/polish/mapping-access.ts`) läser klassningen i stället för det råa fältet.
En Aosom-rad som tappat fältet men har prefixet räknas nu som Aosom.

**Räkningen:** workflowen **"Leverantörer — räkna mappningarna per leverantör"**
→ `/api/admin/leverantorsrakning` → `lib/store/leverantorsrakning.ts`. Bara antal:
per leverantör, per sparat fält, id-formen på rader utan fält, rader där fält och
id är oense (`faltOchIdOense`), och AE- och Aosom-synkens urval med synkernas
egna predikat. Jobbet fäller om en rad utan fält bär prefixet `vevor:`. Talen per
id-form är underlaget för om regeln "utan fält är AliExpress" ska skärpas till
"bara siffror är AliExpress". Den är inte skärpt.

### Steg 3: synken tar emot ett besked, inte en Aosom-rad

`lib/sync/leverantorsrad.ts` har radformatet `Leverantorsrad` (artikel, status,
saldo, landad kostnad, avläsningstid), `lagerbesked()` och en profil per
leverantör (`PROFILER`). Profilen säger vad en saknad rad betyder och om
konkurrentregeln gäller. Aosom-synken läser feeden genom en adapter
(`aosomTillRad` i `lib/aosom/sync.ts`), och resten av synken är som förut.

| | Aosom | VEVOR |
|---|---|---|
| raden saknas | saldo 0, enligt Aosoms B2B-guide | **okänt: ingenting rörs** |
| konkurrentregeln | gäller | gäller inte (Leonard 2026-10-21) |

Statusen `ej_levererbar` finns i formatet för Aosoms fraktsentinel: saldot
nollas och priset rörs inte, men raden räknas inte som slut.

Fem egenskaper som inte ska tas bort:

1. ☠️ **Okänt blir aldrig 0.** En plan med okänt besked (`okand`) sorteras bort
   direkt efter planeringen. Den når varken avdraget för sålda enheter,
   rättelsen mot butiken, skrivningen eller stämpeln. En okänd plan bär
   `onskatSaldo: 0`, så en plan som slank förbi hade fått rättelsen mot butiken
   att skriva 0. Ett test låser det.
2. ☠️ **Raden måste komma från mappningens leverantör.** Annars hade en sida som
   mappningen säger är VEVOR fått Aosoms saldo och pris, bara för att
   artikelnumret råkade finnas i feeden.
3. ☠️ **Aosom-synken planerar bara Aosom-rader.** Urvalet går på prefixet
   `aosom:`. Säger fältet en annan leverantör rörs raden inte, och inte heller
   nollas den som tvetydig sida. Samma regel gäller beställningsfilen
   (`/api/admin/aosom-order`), som håller hela ordern med skälet
   "mappningens leverantörsfält säger inte Aosom", och bildfixen, som hoppar
   över raden. Vägar som bara reserverar eller matchar en artikel, som
   dubblettspärren och syskonsvepet, läser fortfarande prefixet: där är det
   säkrare att en oense rad räknas som upptagen.
4. ☠️ **På en sammanslagen sida gör en okänd färg hela sidan okänd.** Sidans
   saldo är summan av färgernas.
5. **Det räknas:** `okantBesked` och `okantBeskedProdukter` (Wix-id) står i
   svaret, loggraden, audit-raden och workflow-summeringen. För Aosom ska talet
   vara 0. Workflowen fäller även i torrläge om det inte är det, för en sådan
   rad synkas inte alls, och ingen körning lagar den av sig själv.

☠️ **Inte samma sak som `okandaVarianter`.** Den räknaren gäller Wix-varianter
som mappningen inte känner till, och de NOLLAS. Ett okänt besked rör ingenting.

Verifierat lokalt mot den gamla synken från main, på samma slumpade indata:
20 000 körningar gav samma summering och samma anrop till alla beroenden i
samma ordning (läsningar, lager, priser, mappningar och restock-mejl), och
44 171 planer var identiska. Ett planterat fel fälldes vid andra fallet.
Jämförelsen ligger inte i repot, eftersom den kräver en kopia av den gamla
synken.

### Inte gjort, med flit

- **Stämpelfälten har kvar sina namn** (`aosomSyncedQty`, `aosomSyncedAt`). Ett
  namnbyte rör 37 ställen i sju filer, 82 i tester, poleringens workflow och
  `tools/polish-gates/gate-lager.py`, och kräver en migrering av alla
  Aosom-rader. Mellan deployen och migreringen hade den ena halvan läst ett tomt
  fält, och synken hade då sett varje stämpel som saknad. Det görs i steg 5,
  när VEVOR-synken behöver fälten, tillsammans med `aosomFreightShare` och
  `aosomBildFiler`.
- **Bufferten, `MIN_FEED_RADER` och fönstret för beställda enheter** är kvar som
  Aosom-konstanter i `lib/aosom/sync.ts`. De flyttar till profilen i steg 5,
  när VEVOR:s värden är bestämda.
- ☠️ **Loggspärren fångar inte VEVOR:s artikelnummer** (22 tecken, versaler och
  siffror). `redigera()` i workflowerna och `ARTNR` i grindarna måste utökas i
  steg 2, innan ett VEVOR-nummer kan nå en logg.
- **AE-synken har ingen torrkörning per anrop.** Dess urval är samma uttryck som
  förut, nu som `arIAeSynkensUrval`, och räkningen visar dess storlek.

**Efter mergen:** kör räkningen och Aosom-synken i torrläge, utan att någon
annan körning av synken pågår. Räkningen ska ge `utanFalt.vevorPrefix` 0 och
`perLeverantor.vevor` 0. Synken ska ge `okantBesked` 0, och samma granskade,
lager, priser och fel som en torrkörning direkt före mergen.

## Prissättningen är marknadskalibrerad, inte påhittad (`FyndplatsPricingConfig`)

Regeln är **`pris = 1,20 × landedCostSek`**, uppåt till närmaste 9 (`charm9`).
Ingen fast del, ingen trappa, inga kategorimultiplikatorer. Satt 2026-08-27.

```
defaultMultiplier 1.20   fixedSurchargeSek 0   categoryMultipliers {}
tiersEnabled false       rounding charm9
```

Marginalen blir **17 % överallt** — p10, median och p90 är alla 17 % över hela
sortimentet, så ingen vara kan råka hamna på 4 %. Ändringen gäller bara nya
importer; befintliga priser står kvar tills någon räknar om dem.

### `charm99` är PÅSLAGEN sedan 2026-09-03

Leonards önskemål 2026-09-03: 99 är den proffsigaste ändelsen, 89 och 09 ser ut
som räknerester. Strategin `charm99` (i `roundPrice`) höjer 89 → 99 och **sänker
09 → 99**. Ungefär vinstneutral — lika många rader upp som ner, 10 kr åt vardera
hållet.

☠️ **Den är den enda strategin utöver `charm90` som får runda NEDÅT**, och
`charm9`:s kommentar ("aldrig nedåt → marginalen skyddas") var inte en vana:
`applyOverrideBounds` räknar fram Custom-tierns **golv** genom att köra
`roundPrice` på det lägsta acceptabla priset, så en nedrundning kunde lägga
golvet under sin egen minimivinst — tyst, eftersom siffran fortfarande ser ut
som ett giltigt pris. Spärren sitter i `applyOverrideBounds`, inte i
`roundPrice`, och ett test fäller om den tas bort.

**Aktiverad genom `rounding: "charm99"` i `FyndplatsPricingConfig`** — inte via
`PRICE_ROUNDING`, av samma skäl som feed-adressen: en miljövariabel slår inte
igenom förrän projektet byggts om.

☠️ **ORDNINGEN VAR INTE VALFRI, och den gäller vid varje framtida strategibyte.**
Sätts konfigen INNAN koden ligger ute känner produktionens `roundPrice` inte igen
namnet, faller igenom alla grenar och returnerar priset **oavrundat** — och
Aosom-synken skriver örespriser över hela katalogen inom sex timmar. Kod först,
verifiera att deployen är `READY`, sedan konfig. (Valideringen ovan fångar det
numera, men bara när den nya koden faktiskt kör.)

Verifierat i drift direkt efter växlingen på vattenfontänen `dd7052d3`:
`landedCostSek 499.91` → 599,89 → charm9 ger 609 → **charm99 ger 599**, och
raden skrev ut `avrundning charm99`. Att talet är ett HELTAL på 99 är kvittot
att den nya koden kör — den gamla hade svarat `599.89`.
Aosom-synken räknar om priset ur kostnaden var 6:e timme, så ~20 % av
Aosom-halvan flyttar sig 10 kr inom ett dygn. AliExpress-halvan står kvar tills
någon kör prisreparationen.

☠️ **Strateginamnet valideras numera i BÅDA dörrarna, och det var ett verkligt
hål.** Ett okänt namn föll rakt igenom till `roundPrice`, som inte känner igen
det och därför returnerar priset **oavrundat** — alltså `none`. Uppmätt:
`roundPrice(541.85, "charm99 ")` = `541.85`. Ett efterföljande blanksteg i
configraden hade tyst stängt av charm-prissättningen för hela katalogen och
börjat skriva örespriser till kund, utan ett enda fel någonstans. Hålet fanns
i `mergePricingRules` (`stored.rounding ?? base`) OCH i `lib/config.ts`
(`process.env.PRICE_ROUNDING as …`) — och eftersom fallbacken går genom den
andra hade en spärr i bara den första varit meningslös. Listan och typen
härleds nu ur samma array (`ROUNDING_STRATEGIES`), så de kan inte glida isär,
och ett test läser källkoden och fäller om `as`-casten kommer tillbaka.

⚠️ **Sekvensera aktiveringen.** Poleringens prisgrind fäller bara på
Aosom-rader (`regelGäller: supplier === "aosom"`), och den räknar ur samma
`roundPrice`. I fönstret mellan att configen ändras och att synken hunnit
skriva om priserna förväntar grinden 599 medan Wix säger 609 — så var femte
Aosom-produkt ger `PRISGRINDEN FALLER — RÖR INTE PRISET` i upp till ett dygn.
Det är inget fel i grinden; den gör precis sitt jobb. Men polera inte
Aosom-produkter i det fönstret — vänta tills synken konvergerat, annars lär
man sig att ignorera larmet. AE-rader berörs inte (de blir `EJ AVGÖRBAR`).

### Var talet kommer ifrån

*Historik: en engångsmätning 2026-08-27. Priset sätts av regeln ovan, och ingen ny
jämförelse görs (Leonard 2026-10-21, se avsnittet "Dealproffsen: vi jämför inte med dem").*

Inte från en marginalambition — från mätning. **dealproffsen.se publicerar
Aosoms artikelnummer som `sku`/`mpn` i sin JSON-LD**, så exakt matchning är
mekanisk. Slagning på 70 spridda artiklar gav **55 exakta träffar**
(`https://www.dealproffsen.se/sok?controller=search&s=<SKU>` — WebFetch får 403,
curl med vanlig browser-UA fungerar).

| multiplikator | billigast på | marginal | vinst där vi vinner |
|---|---:|---:|---:|
| 1,18 | 39/55 | 15 % | 9 903 kr |
| **1,20** | **39/55** | **17 %** | **10 943 kr** |
| 1,25 | 30/55 | 20 % | 11 337 kr |
| 1,28 + 60 *(gammalt)* | 18/55 | 25 % | 9 962 kr |

1,25 tjänar mest på pappret men tappar en tredjedel av försprånget så fort
marknaden ligger 5 % under mätningen — och den gör den, eftersom underlaget
oftast är EN återförsäljare. 1,20 håller (30/55 vid −5 %, mot 1,25:s 21/55).

### Tre fällor som redan kostat

1. **Den fasta delen drog åt fel håll.** "Lite mer på billiga saker" känns rätt
   och är fel: konkurrentens påslag på vår kostnad är **1,12× på den billigaste
   tredjedelen** mot 1,33× på resten. Det finns minst utrymme just där `+60`
   lade mest. Varje rad i sveptestet med fast del är sämre än samma
   multiplikator utan.
2. **Varje fallande trappa inverterar priset vid gränsen** (799 kr kostnad →
   1 139 kr pris, 801 kr → 1 089 kr). Bygg ingen trappa. `tiers` ligger kvar i
   konfigen men avstängd.
3. **Kategorimultiplikatorer upphäver regeln tyst.** `Husdjur: 2,5` hade satt
   60 % marginal på PawHut-sortimentet — en stor del av Aosom. Rensade.

### Referenspriser är fiktion — båda hållen

Aosoms egen `Normal Price` är uppblåst: RRP 443,90 € på en bod där idealo
listar samma artikel för 189,50 € (2,3×). Ett marknadsankare byggt på den
siffran prissätter efter fantasi — avblåst.

Dealproffsens listpris likaså: **55 av 55 produkter står som "Kampanj"** med
median 24 % rabatt. En kampanj som alltid pågår är inget pris. Kampanjpriset ÄR
priset, och det är det som ska jämföras mot.

### Varför vi förlorar på billiga varor — och vad som faktiskt löser det

Konkurrenten är inte billig. Deras påslag på **själva varan** är 1,96× i median
— ett vanligt butikspåslag. Skillnaden är **vår frakt**: Aosom fakturerar per
paket och viktstyrt, vilket blir en platt tull på 240–290 kr per vara i spannet
2–10 kg. På en vara som kostar 400 kr är det +65 %; på en som kostar 3 000 kr
är det +9 %.

| vår fraktandel av inköpet | deras pris ÷ vår kostnad | deras pris ÷ bara varan |
|---|---:|---:|
| under 25 % | 1,32 | 1,75 |
| 25–40 % | 1,28 | 1,92 |
| över 40 % | **1,13** | **2,07** |

☠️ **"1–2 dagars leverans" VAR FEL, och raden stod kvar i tre veckor
(rättat 2026-09-15).** Leonards invändning: *"dom dropshippar också … Alla dom
som har 3-5 dagar dropshippar dom precis som vi."* Mätt på 42 av deras
produktsidor, tio ur vardera gapgrupp: **39 av 39 läsbara säger "Leverera inom
3–5 arbetsdagar". Noll säger 1–2.** Talet var avläst ur deras
marknadsföringstext ("Snabb Leverans"), inte ur en produktsida — ett påstående
om oss själva togs för en mätning.

⚠️ **Och leveranstiden SKILJER INTE mellan grupperna** — 3–5 dagar där vi är
mycket billigare, där vi är lite billigare OCH där vi är dyrare. Den förklarar
alltså ingenting om gapet, åt något håll. Det var den hypotesen mätningen
byggdes för att pröva.

De listar dessutom **minst 4 078 Aosom-artikelnummer** (bara överlappet med vår
katalog; deras verkliga tal är högre). Ingen svensk handlare lagerhåller fyra
tusen skrymmande möbelartiklar — så "lager i Sverige" är med all sannolikhet
en marknadsföringsrad ovanpå samma dropship-upplägg som vårt, inte en
kostnadspost som förklarar deras pris.

☠️ **Följden för prisresonemanget nedan är stor.** Om deras kostnad ≈ vår
kostnad är skillnaden i pris **ren marginal**, inte täckning för lager,
returer och bundet kapital. Då finns det mer utrymme att höja än raden nedan
antyder — och de kan samtidigt matcha oss när de vill.

⚠️ **Vad som INTE är mätt:** var paketen faktiskt skickas ifrån. 3–5
arbetsdagar är förenligt både med dropship från Aosom DE och med svenskt
lager plus långsam möbelfrakt. Deras sidor säger "Lagervara" på 35 av 42.
Det som avgör är fraktvillkoren, och dem ser vi inte.

Gränsen går vid ungefär **900 kr i inköp**: under den är vi billigast i 29–50 %
av fallen, över den i 92–100 %.

**Räknat med frakten satt till 30 kr per vara i stället för per paket blir vi
billigast på 55 av 55.** Det största draget i hela Aosom-affären är alltså inte
prisregeln utan att förhandla samlad frakt. Tills dess är urvalet skyddet:
`?skipFreightHeavy=1` på svepet.

### B2B-kontot är en rabatt på varan och ett straff på frakten (mätt 2026-08-27)

Leonard lade samma bod i kassan på aosom.de två gånger, utloggad och
inloggad på B2B-kontot. Utloggad: 207,80 €. Inloggad: 210,39 €. **Kontot gjorde
varan dyrare.**

Feed-raden förklarar varför, och fraktsiffran står ordagrant i kassan:

```
Wholesale Price          123.01 EUR
SE Ship Fee               84.02 EUR   ← exakt talet i B2B-kassan
Shipping Cost Germany     39.38 EUR
Weight (incl. Package)    50.00 kg
Package                        2
```

Det avgörande talet är inte 84 utan **39,38**. Samma order, samma konto, till en
TYSK adress kostar frakten 39,38 € — medan en utloggad konsument betalar 7,90 €
på exakt den rutten. **B2B-frakten är 5× konsumentfrakten inom Tyskland.** Det
handlar alltså inte om avståndet till Sverige: Aosom subventionerar konsument-
frakten (den ligger inbakad i 199,90 €) och fakturerar B2B den råa fraktsedeln.

Netto mot netto — B2B-fakturan är netto, konsumentpriset innehåller 19 % MwSt:

| | vara | frakt | **netto** |
|---|---:|---:|---:|
| Konsument → DE | 167,98 | 6,64 | **174,62 €** |
| B2B → DE | 126,37 | 39,38 | **165,75 €** |
| B2B → SE | 126,37 | 84,02 | **210,39 €** |

Rabatten på själva varan är verklig (−25 %) och räcker så länge paketet stannar i
Tyskland. Till Sverige blir kontot **20 % dyrare än att vara privatperson**. De
207,80 € såg jämna ut bara för att konsumentpriset bär tysk moms vi aldrig får
tillbaka — kassan underdriver problemet.

Och det gäller sortimentet, inte bara den boden. Över feedens 6 056 rader med
både SE- och DE-frakt:

| | SE | DE |
|---|---:|---:|
| Medianfrakt | 26,40 € | 8,59 € |
| Frakt ÷ inköp (median) | **40 %** | **18 %** |
| Rader där frakten kostar mer än varan | **1 283** | **9** |

SE-frakten är **3,07× DE-frakten** (median per rad). "Frakten kostar mer än
varan" är i praktiken uteslutande ett Sverigeleverans-problem.

Vad det är värt, kört mot de 55 dealproffsen-matchningarna vid oförändrad
prisregel och oförändrad 17 % marginal:

| frakt | billigast på |
|---|---:|
| SE-frakt (som idag) | 39/55 |
| **DE-frakt** | **54/55** |
| 30 kr/vara | 55/55 |

De 30 kronorna ovan är ett räkneexempel. **39,38 € är ett pris Aosom redan tar**,
och det ensamt tar oss från 39 till 54 av 55 utan att röra marginalen. Draget är
samlad frakt eller en tysk leveranspunkt vi vidarebefordrar från — inte en ny
prisregel.

☠️ **Köp inte som privatperson som kringgång.** Ingen B2B-faktura, tysk moms som
inte är avdragsgill i Sverige (bara sökbar via Skatteverket, långsamt), ingen
omvänd skattskyldighet — och det skalar inte till 5 566 artiklar.

### Fler länder: feeden har frakten till 40 (2026-10-21)

Leonards fråga: vilka länder kan vi sälja Aosom-varorna i? Feeden har en
fraktavgift per land, `<landskod> Ship Fee` för 39 länder och
`Shipping Cost Germany` för Tyskland (uppmätt 2026-09-15). Det är EU:s 27
länder och 13 utanför EU: Albanien, Andorra, Bosnien och Hercegovina, Färöarna,
Gibraltar, Kosovo, Monaco, Montenegro, Nordmakedonien, San Marino, Serbien,
Turkiet och Vatikanstaten. Norge, Storbritannien och Island saknas. Schweiz
saknades 2026-09-15 men har en kolumn sedan dess (41 länder 2026-10-22).
Motorn läste bara Sveriges.

Workflowen **"Aosom — frakt och skeppbarhet per land"** →
`/api/admin/aosom-lander` → `lib/aosom/frakt-per-land.ts` räknar per land, för
hela feeden, för våra mappade artiklar och för de publicerade:

- hur många varor som går att skicka dit,
- frakten och den landade kostnaden (inköp plus frakt) jämfört med Sverige, som
  medianer per rad.

Momsen ingår inte. Landets momssats läggs på kundpriset för sig.

**Uppmätt 2026-10-22** på de 5 499 publicerade Aosom-artiklarna i feeden, som
medianer av inköp plus frakt jämfört med Sverige: Danmark 0,95, Litauen 0,97,
Lettland 0,99, Estland 1,01 och Finland 1,09. Frakten till Danmark är lägre än
till Sverige på 99,9 % av varorna. Den femdubbla frakten till Baltikum gäller
bara privatpersoner på aosom.de. För oss ligger den nära Sverige.

Fyra egenskaper som inte ska tas bort:

1. ☠️ **Svaret bär bara antal, andelar och kvoter.** Avgifterna är inköpsled,
   precis som SE-frakten. Ett test serialiserar svaret och letar efter
   artikelnummer och belopp.
2. ☠️ **Ett annat fel än våra egna spärrar svarar utan sin text** (`felSvar`).
   Ett nätverksfel kan bära feedens adress. Texten står i Vercels logg, med
   adresserna bortbytta.
3. **Samma spärrar som synken.** Färre än `MIN_FEED_RADER` rader i feeden,
   färre än `MIN_WIX_PRODUKTER` synliga produkter eller ingen svensk kolumn ger
   503.
4. **Synken och importen läser feeden som förut.** Landskolumnerna läses bara
   med `parseAosomFeed(text, { fraktPerLand: true })`, och en verklig avgift har
   en definition för alla länder (`arVerkligFrakt`).

⚠️ Där Aosom själva säljer till konsument konkurrerar vi mot deras
subventionerade konsumentfrakt (avsnittet ovan). Den 2026-10-21 svarade
aosom-domänerna för Tyskland, Österrike, Belgien, Nederländerna, Frankrike,
Italien, Spanien, Portugal, Irland, Polen och Rumänien som aosom.de. aosom.dk
och aosom.si är domäner till salu.

### Danskt sortiment och pris per sida (2026-10-22)

Leonard valde 2026-10-22 en egen kassa med Stripe för Danmark, och en start med
Aosom-varor utan el och batterier. Workflowen **"Danmark — sortiment och pris
per sida (krypterat)"** → `/api/admin/landsortiment?land=DK` →
`lib/aosom/landsortiment.ts` svarar sida för sida: om den kan säljas i
Danmark, och vad den kostar där i danska kronor.

En publicerad Aosom-sida kan säljas när varje artikel på den finns i feeden, har
ett inköpspris och en verklig fraktavgift dit, inte har en frakt som kostar mer
än varan och inte har el eller batterier. Priset räknas som synkens regelpris
(inköp plus frakten dit, 25 % dansk moms, husets multiplikator och avrundning),
men i danska kronor med kursen `EUR_TO_DKK` (7,46 som standard). Konkurrentregeln
gäller inte, eftersom den jämför med en svensk butik.

Klassningen av el och batterier (`lib/aosom/el-och-batteri.ts`) läser Aosoms
tyska text och vårt svenska namn. Varje träff har en fast etikett, så att
loggen kan räkna etiketter utan att skriva ut text.

Fem egenskaper som inte ska tas bort:

1. ☠️ **Klassningen lutar åt att stoppa.** En vara med el eller batterier som
   släpps igenom säljs i Danmark utan registrering för el och batterier. En
   vara som stoppas i onödan säljs bara inte där än. Ett ord räcker, och varje
   mönster som undviker en känd falsk träff ("Sonnenlicht", "wattiert",
   "Motorik", "elektroverzinkt") har ett test.
2. ☠️ **Listan bär priser och vårt urval, och lämnas bara ut krypterad.**
   Workflowen skriver räknarna, etiketterna och kvoten mot Sverige, och
   krypterar listan (gzip, AES och RSA, som `leverantorslankar.yml`). Listan
   bär varken artikelnummer, inköpspris eller frakt, inte ens krypterad. Ett
   test serialiserar svaret och letar.
3. **En sammanslagen sida stoppas helt av en färg som inte går**, och varje
   färg får sitt eget pris. Listan namnger färgen med Wix-variant-id.
4. **Bara Aosom-sidor räknas.** De andra leverantörerna räknas per leverantör
   och stannar i Sverige.
5. **Bara Danmark.** Ett land i euro behöver en egen avrundning: charm99
   snäpper 89 till 99, alltså tio euro på en vara för 139 euro. Rutten svarar
   400 för andra länder.

### Vad som INTE är fixat

Momsfällan i `computeProfit` är **lagad 2026-08-29** (se avsnittet ovan):
kostnaden momsas nu av på samma sätt som intäkten, och definitionen delas med
auktionens golvbud i stället för att dupliceras.

Kvar är DATA-sidan av samma fälla: **AliExpress-köp på Business Purpose**
faktureras netto men sparas i `landedCostSek`, som läses som brutto. För dem är
det lagrade talet alltså 20 % för lågt, och nu när `computeProfit` dessutom
delar med 1,25 blir felet synligt åt andra hållet — vinsten ser för hög ut.
Aosom-raderna bruttas upp korrekt vid import (`1287a0a`); AE-raderna gör det
inte, och det går inte att laga i kod utan att veta vilka köp som gjordes på
Business Purpose.

### ☠️ Och AE-radernas kostnad FRYSER vid importen (2026-09-06)

Aosom-halvan räknas om var sjätte timme. AE-halvan räknas aldrig om: synken
LARMAR på en prishöjning (`price_increase` i `decideSyncOutcome`, med
`recommendedPriceSek`) men skriver aldrig tillbaka `costUsd` eller
`landedCostSek` på mappningen. Det nya talet bor i synkens eget tillstånd
(`currentCostUsd`), som varken lönsamhetsöversikten, auktionens golvbud eller
poleringens prisgrind läser.

Uppmätt på barstolarna `a260b888` (order 10030), samma fält som pipelinen
själv läser (`offer_sale_price`):

| | |
|---|---:|
| Mappningens `costUsd` (importtillfället) | 48,98 USD |
| AliExpress `offer_sale_price` idag | **80,07 USD** |
| Skillnad | **+63 %** |

Sidan står på 679 kr. Med `USD_TO_SEK` 10,5 är landat pris 840,74 kr, alltså
**−129 kr netto per såld enhet**; med marknadskursen kunden ser (~750 kr på
AE-sidan) −59 kr. Regelpriset på dagens kostnad hade varit 899–999 kr.

Tre saker att inte missförstå:

1. ⚠️ **Larmet är designen, inte skrivningen.** Att synken låter kundpriset
   stå är rätt — ett automatiskt omprissatt sortiment är en beteendeändring
   med hela katalogen som blast-radie. Felet är att det LAGRADE talet blir
   osant under tiden, och att tre läsare tror på det.
2. ☠️ **Ett svar utan fel är inget kvitto, tionde gången.** Prisgrinden i
   `/api/admin/mapping` svarar `EJ AVGÖRBAR` på AE-rader (`regelGäller` är
   bara sann för `supplier === "aosom"`), så en polering av en AE-produkt vars
   inköp sprungit iväg passerar utan invändning.
3. **Kollen är billig.** `freight-check`-workflowen med `raw=true` ger
   `offer_sale_price` per SKU för en produkt. En katalogomfattande jämförelse
   mot mappningens `costUsd` är däremot ett AE-anrop per produkt och lever
   under `maxApiCalls` — den hör hemma i synken, inte i chatten.

## Prishöjning på AE-halvan (`lib/pricing/ae-prishojning.ts`)

Leonards beslut 2026-09-13: **alla AliExpress-produkter +10 %, och en nia på
slutet.** Genomförd samma dag — **732 produkter höjda, noll misslyckade.**

Höjningen är meningsfull BARA på AE-halvan, och det är inte en smaksak:
Aosom-raderna räknas om ur kostnaden var sjätte timme, så en höjning där hade
skrivits tillbaka inom ett dygn. AE-raderna räknas aldrig om (se `#159`), så
en höjning står kvar tills någon rör den igen.

☠️ **Facit är BUTIKEN, inte mappningen.** Höjningen räknas på `listV3ProductPrices`,
aldrig på `grossSek` — samma förväxling som kostade prissynken en månad.

### Sex grindar som inte ska tas bort

1. ☠️ **Kontrollsumman räknas om i SAMMA anrop som skriver.** Den ersätter
   prisreparationens "det finns ingen kör-allt-flagga": på tusen rader vore en
   id-uppräkning teater, så summan gör samma jobb mekaniskt. En kontroll i ett
   eget, tidigare anrop bevisar bara att just DEN planen såg rätt ut — samma
   skäl som transkriberingsspärren i poleringen.
2. ☠️ **Kampanjnamnet ÄR idempotensen.** Rutten har 300 sekunder och katalogen
   ~1 000 AE-rader, så körningen KOMMER att köras om. Utan stämpeln tar en
   omkörning 599 → 659 → 725, och svaret ser likadant ut båda gångerna.
3. ☠️ **Priset måste sluta på 9 — en grind, inte en förhoppning.**
   Avrundningsstrategin bor i `FyndplatsPricingConfig`, alltså utanför koden,
   och ett efterföljande blanksteg där har redan en gång tyst stängt av
   charm-prissättningen. `ejNiokrona` räknar i stället för att örespriser når kund.
4. ☠️ **Alla varianter eller ingen** (`variantavvikelse`). Ett halvt höjt pris
   är svårare att upptäcka än ett orört.
5. ☠️ **Okänt butikspris gissas aldrig** (`utanWixPris`), och **ett låst pris
   rörs aldrig** (`prisLasta`).
6. ☠️ **En höjning som skett men tappat sin stämpel höjs ALDRIG igen** — se nedan.

### ☠️ En tappad stämpel gör omkörningen till 499 → 549 → 609

Hittad av ARITMETIKEN, inte av ett fel. 478 redan höjda + 201 skrivna med noll
misslyckade skulle ge 679; nästa plan sa **678** och en rad mer att höja. Exakt
en produkt hade fått sitt PRIS skrivet utan att få sin STÄMPEL.

Skrivfönstret 17:58–18:02 låg rakt över AE-synkens `0 */2 * * *`, och synken gör
läs-ändra-skriv på samma mappningsrad på fyra ställen. En lost update skriver
över stämpeln utan att något kastar — rutten svarar 200, workflowen går grön.

Stämpeln är hela idempotensen, så en stämpel som kan gå förlorad är en
idempotens som kan gå förlorad.

☠️ **Grinden är ARITMETISK, inte en riktning — och första utkastet var fel på
just den punkten.** Det gatade på "butiken högre än mappningen" och fällde
`räknar på BUTIKEN`-testet, som hade rätt: butiken högre är också signaturen för
husets DOKUMENTERADE drift, där bäddsoffan `efaa0c7b` bar `grossSek: 3529` mot
4 539 kr i Wix. En sådan rad har aldrig höjts och SKA höjas.

Det som skiljer är att en tappad stämpel lämnar butikspriset på EXAKT det tal
kampanjen skulle ha skrivit. Grinden räknar därför om höjningen ur mappningens
tal och kräver exakt träff, ur samma `roundPrice` som planen själv använder.

⚠️ **Grinden hittade TVÅ, inte den ena aritmetiken pekade ut** — och de låg
inom de tolv drivande raderna, så det är ingen slump. De höjs inte, de RÄKNAS,
och sedan 2026-09-13 står deras wix-id i svaret och workflow-summeringen:
ett tal utan id är en oro, ett tal med id är ett beslut. Raderna kan ingen
annan mätning hitta i efterhand — de har varken stämpel eller drift kvar att
känna igen dem på.

### Kvittot

| | |
|---|---:|
| granskade mappningar | 5 745 |
| höjda | **732** |
| misslyckade | **0** |
| ej AliExpress (Aosom) | 4 754 |
| utan entydigt butikspris | 191 |
| variantavvikelse | 66 |
| redan höjd, stämpel tappad | 2 |
| **drivande efter körningen** | **0** |

Sista raden är kvittot: mappningen och butiken är i fas över hela AE-halvan —
samma sak som `jamforelsePris` byggdes för på Aosom-sidan. Live-verifierat på
tre sidor genom butiken (549, 1 749 och 4 899 kr), inte bara i API-svaret.

⚠️ **Vänta ut ISR:en vid den verifieringen.** Första hämtningen gav
`x-vercel-cache: STALE`, `age: 42 781` och det GAMLA priset; nästa hämtning gav
`HIT`, `age: 20` och det nya. Ett API-svar är inget kvitto, och en enstaka
sidhämtning är det inte heller.

## Dealproffsen: vi jämför inte med dem (Leonard 2026-10-21)

Leonard 2026-10-21: *"vi ska inte jämföra med dom"*. Beslutet gäller överallt och ersätter
hans strategi från 2026-09-14 (jämföra alla priser mot dealproffsen.se, ligga 1–2 procent
under dem och göra reklam på det vi var billigast på).

1. **Polering:** kandidater väljs inte efter var vi är billigare än dealproffsen.
   Runbookens §1 har inte längre det kriteriet.
2. **Pris:** kundpriset är husets regel (1,20 × landad kostnad, `charm99`) och inget
   annat. Ingen prisändring motiveras med deras pris, och en prisändring kontrolleras
   inte mot det.
3. **Kör inte** workflowen "Pris — jamfor mot dealproffsen" i läget `jamfor` och inte
   "Pris — konkurrentregeln". Ingen rad får `prisgrupp` (lottningen `lage=lotta` körs
   aldrig). Utan grupp följer varje rad husets regel exakt, så synkens konkurrentregel
   är overksam, och det har den varit sedan den byggdes.
4. **Arkiv:** texterna om jämförelsen (matchningen, vägen in, de sju egenskaperna,
   gap-listan) och om konkurrentregeln är flyttade ordagrant till
   `docs/arkiv/dealproffsen-och-konkurrentregeln.md`. De är historik, inte instruktion.
5. **Koden finns kvar** tills Leonard beslutar om borttagning: `lib/pricing/dealproffsen*.ts`,
   `lib/pricing/konkurrentregel.ts`, `lib/pricing/konkurrentpris-plan.ts`,
   `app/api/admin/dealproffsen`, `app/api/admin/konkurrentpris` och workflowerna
   `dealproffsen.yml` och `konkurrentpris.yml`. Lägena `feed-info`, `ean-jakt` och
   `vara-sidor` i `dealproffsen.yml` är inga prisjämförelser och får användas.
6. **Det som står kvar nedan är inte en jämförelse:** att Aosoms artikelnummer aldrig får
   läcka (dealproffsen publicerar samma sträng som `sku`/`mpn`), att deras EAN inte
   används, white label-beslutet och Google Shopping-attributen.

*Lärdomarna nedan kom ur jämförelsen men gäller även utan den.*

### ☠️ Och den hittade ett tyst tak som redan var passerat (2026-09-14)

`listVisibleV3ProductIds` har ett sidtak. Det låg på **50 sidor = 5 000
produkter** mot en katalog på **~5 500**, alltså redan passerat — och
funktionen svarade med en TYST avkortad mängd. Inget fel, ingen räknare,
ingenting som skiljer "slut på produkter" från "slut på sidor".

☠️ **Riktningen är det som gör felet dyrt.** En produkt som saknas i mängden
behandlas som OSYNLIG, alltså ser en publicerad produkt ut som ett utkast.
Recensionssvepet hoppar då över den, och den arkiverade prisjämförelsen hade lagt den i
listan *"polera dessa först"* — alltså precis fel lista.

Samma klass som `Promise.allSettled` i `media.ts`, som `queryAll`:s eget tak
och som den obegränsade fan-outen: **en konstant som var rätt när den sattes
och blev fel när volymen växte under den.** Det finns ingen commit att skylla
på, och en `git bisect` hade inte hittat något.

Taket är nu 300 sidor och det **FÄLLER i stället för att kapa**, ordagrant som
`queryAll`: *"en avkortad lista är värre än ett fel."* Tre tester, verifierade
genom att återinföra kapningen — två faller, och bara de två.

⚠️ Hittad genom att läsa koden innan den togs i bruk, inte av ett larm. Den
hade inget larm att ge.

### ☠️ Familjer med många publicerade sidor ger krockar (2026-09-15)

Gap-listan rankade opolerade utkast efter kronor och pekade rakt fel första gången den
användes (listan är arkiverad). Det som gäller oberoende av den:

☠️ **Fåtöljfamiljen är MÄTTAD.** Femton fåtöljkandidater ställdes mot de 247 publicerade
sittmöblerna på måtttrippeln: 14 av 15 hade minst en krock (63 krockar totalt) och fyra
hade EXAKT samma mått som en publicerad sida. En av dem (`1bf87dc9`, 79 × 64 × 52)
matchar **fyra** publicerade färgsidor av samma stol. En nionde sida för samma fåtölj är
just den dubblett Google straffar, så familjer väljs efter luckan, inte efter högen.

⚠️ **Trädgård är fel SÄSONG** i mitten av september. En utegrupp som poleras då får sin
första besökare om sju månader.

☠️ **Och måttskärmen har en blind fläck som nästan kostade rundan.** Den
tyska källan skriver totalmåttet med axelbokstaven inne i talet:

```
Gesamtabmessungen: 218B x 79T x 91H cm     <- produktens mått
Paketmått: 92 × 43 × 70 cm                 <- kartongen
```

Ett mönster som kräver `\d+ x \d+ x \d+ cm` hittar bara den ANDRA raden.
Första soffsvepet gav därför "noll krockar" på ett facit som mätte kartongen.
Med produktens mått avlästa för hand föll `c6c880c3` direkt: 213 × 82 × 90 cm
chenille, 360 kg, identiska tal mot publicerade `f7e2b537`.

**Läs produktens mått ur källan, och låt mönstret ta axelbokstaven.**

☠️ **`products/search` avvisar filter + markör ihop** — `400 SE-1141`, samma
form som `inventory-items/query` (2026-09-13). Sida två skickas med BARA
markören. Tredje endpointen i familjen; `orders/search` tar fortfarande emot
båda, så formen är inte gemensam. Mät per endpoint.

#### ☠️ Och `filter` PÅ TOPPNIVÅN ÄR EN NO-OP — svaret är 200 och ofiltrerat (2026-09-16)

Raden ovan gäller när filtret ligger rätt. Ligger det fel finns inget fel att
läsa. `filter` hör **inuti `search`**, exakt som `cursorPaging` (#191); på
kroppens toppnivå kastas det bort tyst.

Uppmätt mot skarpa V3, åt båda hållen — det är det enda som skiljer en levande
grind från en död:

| filtrets plats | synliga | osynliga |
|---|---:|---:|
| kroppens **toppnivå**, `visible: true` | 6 | **94** |
| inuti `search`, `visible: true` | **100** | 0 |
| inuti `search`, `visible: false` | 0 | **100** |
| inuti `search` + markör | **400 SE-1141** | — |

☠️ **Följden är att ett FLERSIDIGT filtrerat svep inte går att göra.** Rätt
plats ger 400 på markören; fel plats ger en markör som fungerar och ett filter
som inte finns. Enda korrekta vägen är att **svepa OFILTRERAT och filtrera i
koden** — samma hållning som husets egen regel om att hämta en avgränsad mängd
och filtrera i kod när ett filter inte stöds.

⚠️ **Och felet är osynligt utom i ETT tal.** Dubblettskärmen i runda N7 läste
**5 748** rader och kallade dem publicerade; katalogen har ~2 800 publicerade
sidor. Ingenting annat i svaret skilde sig från en korrekt filtrerad körning.
Hade katalogen råkat vara dubbelt så stor hade talet sett rimligt ut.

**Regeln, och den är husets vanligaste i ny form: en kontroll som inte KAN
fälla räknas ändå som gjord.** Ett filter som tyst ignoreras är samma klass som
SKU-kollen som itererade en tom lista — skillnaden är att det här svarar 200
med hundra rader i stället för noll, vilket är svårare att misstänka.

##### ☠️ Och `fields` är TVÄRTOM: den MÅSTE skickas om med markören (2026-09-16)

Samma endpoint, samma kroppsform, motsatt regel — och båda felen är tysta åt
var sitt håll. `filter` avvisas med `400 SE-1141` om det skickas om; `fields`
svarar 200 och lämnar fältet FRÅNVARANDE om det INTE skickas om.

Uppmätt på `products/search`, samma markör:

| sida två skickad med | `plainDescription` |
|---|---:|
| bara markören | **0 av 100** |
| markören + `fields` på toppnivån | **100 av 100** |

⚠️ **Följden var ett svep som undermätte med två tiopotenser.** Dubblettskärmen
i runda N9 skickade `fields` bara på första sidan och rapporterade **6 av 2 844
publicerade sidor med måtttrippel**. Med `fields` på varje sida blev talet
**2 221 av 2 844**, 4 135 unika tripplar. Sidräkningen, radantalet och
fördelningen publicerade/utkast var IDENTISKA i båda körningarna — det enda som
skilde var innehållet i ett fält som ingen räknare tittade på.

☠️ **Och det är den farliga formen av tomhet: en dubblettskärm som bara har
sex rader att jämföra hittar noll krockar och ser ut att ha gjort sitt jobb.**
Samma klass som SKU-kollen som itererade en tom lista, men svårare att
misstänka, för svepet levererar rätt antal PRODUKTER — bara inte deras text.

**Regeln: ett svep som bygger ett facit ur ett fält måste räkna hur många rader
som FAKTISKT bar fältet.** `publUtanText` står i svaret sedan dess. Ett nollat
fält är inte samma sak som ett tomt facit, och bara räknaren skiljer dem åt.

### ⚠️ Deras EAN är äkta — men den är INTE vår att publicera (2026-09-14)

Leonards fråga: *"tror du inte dealproffset har hittat på en egen ean då?"*
Rätt fråga att ställa — en falsk GTIN i Google Merchant Center kopplar vår
produkt till fel vara eller får den avvisad, vilket är sämre än ingen GTIN alls.

Mätt på 187 av deras produkter med läsbar kod, fyra oberoende tester:

| test | utfall | varför det avgör något |
|---|---|---|
| Kontrollsiffra | **187 av 187 giltiga** | Slumpade nummer klarar den i ~1 av 10 |
| GS1-landsprefix | **186 av 187 tyska** (425…) | De är ett SVENSKT bolag; svenska koder är 730–739, och ett tyskt prefix går inte att få som svenskt företag |
| Antal företagsprefix | **fyra** (4250871, 4251774, 4255633, 4255826) | Den som hittar på köper ETT prefix; fyra tyska block är vad en tillverkare samlar på sig över år |
| Interna koder (20–29) | **noll** | Det spannet finns just för egna butikskoder — de använder det inte |

☠️ **Det femte testet är det som faktiskt utesluter påhitt.** Genererar man
koder allteftersom man lägger in produkter följer koden ens EGEN
produktnumrering nästan perfekt. Uppmätt rangkorrelation mot deras interna
produkt-id på de tre största blocken: **−0,51 · +0,36 · +0,07** — alltså brus.
De har inte numrerat själva.

⚠️ **Men att koden är ÄKTA är inte samma sak som att den är rätt kopplad, och
inte samma sak som att den är vår att använda.** Verifieringen mot GS1:s egen
databas kom inte i mål: både Google och GEPIR kräver JavaScript, och att rendera
dem hade krävt att proxyns TLS-kontroll stängdes av. Det gjordes INTE.

**Slutsatsen som gäller:** antingen fick de filen av Aosom eller skannade de
kartongen — båda är tillverkarens kod, och det enda felläget som skadar oss
(påhitt) är mätt osannolikt. **Använd dem ändå inte i Merchant Center.** Vi kan
inte stämma av dem mot Aosom, `identifier_exists: no` fungerar, och en GTIN
hämtad från en konkurrents sajt är fel källa för ett fält som ska vara sant.
Frågan till Aosom står kvar som rätt väg — EAN-kolumnen finns i feeden, den är
bara tom.

⚠️ Koden plockas ur deras produktlänk och räknas i `medEan`, men den **används
inte till någonting** — matchningen går på artikelnumret. Den är ett gratis
sidoresultat, inte ett beroende.

### ✅ Aosom svarade: leveransen är WHITE LABEL — vi är varumärkesägaren (2026-09-15)

Henrik Leseberg, ordagrant ur svaret:

> *"As our products are supplied on a white-label basis, we do not provide or
> transfer our own EAN/GTIN codes to customers. Therefore, the EAN column in
> the product feed cannot be populated … The codes printed on some cartons are
> batch-specific logistics barcodes. They may vary between different batches of
> the same SKU and should not be used as product EANs … Most of our white-label
> customers adapt the product descriptions to their own listings and assign
> their own EAN codes. This is also the intended arrangement on our side."*

**Tre saker är därmed avgjorda och behöver inte utredas igen:**

1. ☠️ **EAN-kolumnen kommer ALDRIG att fyllas.** Frågan är ställd och besvarad.
   Sluta mäta feeden efter EAN.
2. ☠️ **Kartongernas streckkoder är LOGISTIKKODER, inte produkt-EAN.** De
   varierar mellan batcher av samma artikel. Att skanna en kartong och lägga
   koden i Merchant Center hade gett en kod som pekar på fel sak — och den
   idén stod som ett öppet uppslag i avsnittet ovan. Den är nu stängd.
3. ✅ **Vi är varumärkesägaren.** Det är precis undantaget i Googles egen text:
   *"Use your store name … if you manufacture the product or if your product is
   a private-label product."*

⚠️ **RÄTTELSE:** en timme före det här svaret stod rådet *"Aldrig
`brand: Fyndplats`"* i den här filen. Det var rätt slutsats av det som då var
mätt — att varorna är HOMCOM/Outsunny — och fel så fort leverantören säger
white label. Rådet gäller inte längre.

**GS1:s regel, hämtad samma dag:** *"The Brand Owner, the organisation that
owns the specifications of the trade item regardless of where and by whom it is
manufactured, is normally responsible for the allocation of the GTIN"*, och för
Own Brand Label: *"Products with an agreement between the Original Manufacturer
and the party identified on the label as the Brand Owner … have the Brand Owner
taking responsibility for GTIN assignment."*

✅ **LEONARD AVGJORDE BÅDA FRÅGORNA 2026-09-15, och de ska inte ställas igen:**

1. **Skriftligt medgivande behövs inte — det står redan i Henriks mejl.** Han
   skriver *"Most of our white-label customers … assign their own EAN codes.
   This is also the intended arrangement on our side"* och ber oss uttryckligen
   bekräfta *"that you will … use your own EAN codes"*. Att fråga om lov en
   gång till hade visat att vi inte läst svaret.
2. **Varorna skickas i ORIGINALFÖRPACKNING, och vårt märke trycks aldrig på
   produkten.** Leonard: *"vårt märke har aldrig varit tryckt på någon
   produkt"*. White label betyder här att vi äger listningen och texten — inte
   att kartongen är omärkt.

⚠️ Punkt #195 (två gamingstolar med VINSETTO tryckt på produkten) står kvar som
en egen observation om de två artiklarna. Den gäller LEVERANTÖRENS märke, inte
vårt, och den ändrar inte upplägget ovan.

☠️ **AVTALET ÄR DET SOM BÄR, inte vår egen tolkning.** Samma GS1-sida säger
också: *"downstream parties, such as distributors, wholesalers, importers and
merchants, should not assign a different GTIN to a trade item that already has
a GTIN, provided that the trade item is not changed."* Vi går alltså in genom
Own-Brand-Label-undantaget, och då måste överenskommelsen finnas i skrift.
**Henriks mejl ÄR den skriften** — spara det.

⚠️ **Och en mätning som talar EMOT att varorna saknar GTIN:** dealproffsen
publicerar en `gtin13` med prefixet 425 för en av artiklarna, och koderna är
mätt äkta (187/187 giltig kontrollsiffra, 186/187 TYSKT GS1-prefix 425x — en
svensk återförsäljare kan inte få ett sådant). Någon tysk part har alltså
registrerat koder för de här artiklarna. Henriks *"we do not provide or
transfer **our own** EAN/GTIN codes"* läser rimligast som "vi har dem men delar
dem inte" — inte som "de finns inte".

☠️ **DÄRFÖR ÄR DEN HÄR FRÅGAN INTE TEKNISK UTAN AVTALSMÄSSIG.** Håller
white-label-upplägget är egna GTIN rätt väg; håller det inte är det en
ommärkning av någon annans vara. Skriftligt besked från Aosom är skillnaden.

✅ **Om det håller löser det HELA sekretessproblemet:** egen GTIN + `brand:
Fyndplats` gör att `mpn` inte längre krävs, och då behöver Aosoms artikelnummer
aldrig lämna `supplierProductId`. Kollisionen i avsnittet nedan upphör.

⚠️ **Kostnaden för GS1-medlemskap är INTE mätt** — deras sida blockerade
hämtningen. Den siffran måste hämtas innan beslutet tas.

### ☠️ Google Shopping: `brand` och `mpn` krockar med två husregler (2026-09-15)

Hämtat ur Googles egen spec samma dag, inte ur minnet. Tre rader avgör:

| attribut | Googles ord |
|---|---|
| `brand` | **Required** "for all new products, except movies, books, and musical recordings" |
| `brand` | *"Only provide a brand if you're sure it's correct. When in doubt don't provide a brand (for example, don't guess or make up a value)."* |
| `brand` | *"Use your store name … if you manufacture the product or if your product is a private-label product."* |
| `mpn` | **"Required for all products without a manufacturer-assigned GTIN"** |
| `mpn` | *"Use the MPN assigned by the manufacturer. Unless you're the manufacturer, don't use a value that you've created."* |
| `identifier_exists` | `no` bara när man är *"certain that your product doesn't have any assigned unique product identifiers"* — annars *"will receive a warning"* |

**Vad vi har, mätt:**

- ☠️ **`brand` finns inte ens som fält i Wix V3 hos oss.** 0 av 100 i sökningen,
  och den fulla GET:en — som mycket riktigt bär `plainDescription` och
  `variantsInfo` — saknar det också. Det är alltså inte en projektionsfälla.
- **GTIN: ingen.** Aosoms kolumn är tom på 6 095 rader, manualerna bar noll.
- **MPN: vi HAR den.** Det är Aosoms artikelnummer på `supplierProductId` —
  exakt den sträng husregeln säger aldrig får nå kund.

☠️ **DÄRFÖR FINNS INGET ALTERNATIV SOM ÄR BÅDE SPEC-ENLIGT OCH HEMLIGT.**
Googles krav på `mpn` när GTIN saknas är precis det fält vi skyddar. Att
utelämna det ger en varning; att fylla i det publicerar numret. Det är ett
affärsbeslut, inte ett tekniskt, och det hör till Leonard.

⚠️ **Och "Fyndplats" som `brand` är INTE utvägen.** Googles formulering
tillåter butiksnamnet bara för egen tillverkning eller eget private label.
Våra varor är HOMCOM/Outsunny/PawHut. Att skriva vårt namn vore att gissa
fram ett värde, vilket samma stycke uttryckligen förbjuder.

#### Vad konkurrenten faktiskt gör — mätt, inte antaget

| | dealproffsen |
|---|---|
| husmärke på produktsidan | **noll träffar** på alla tio märken |
| `manufacturer_name` i deras sök-API | **tomt på 200 av 200** |
| JSON-LD `brand` | **`"Dealproffsen.se"`** — deras eget butiksnamn |
| JSON-LD `mpn` / `sku` | **Aosoms artikelnummer** |
| JSON-LD `gtin13` | **ifylld** |

De gör alltså tre saker: stryker husmärket (som vi), sätter sitt EGET namn
som `brand` (vilket Googles ord inte tillåter för en återförsäljare), och
publicerar artikelnumret och EAN (vilket vi inte gör).

⚠️ **Mätningen gäller deras SAJT, inte deras Merchant Center-feed.** Vi kan
inte se deras feed. Att de gör det i JSON-LD är ett starkt indicium om vad de
skickar till Google, inte ett bevis.

☠️ **Följden för sekretessen:** för varje produkt dealproffsen också säljer är
artikelnumret **redan publikt hos dem**. Vår tystnad skyddar därför inte
numret i sig — den skyddar kopplingen från VÅR sida till numret. Det är en
mindre sak än husregeln antar, och det är värt att veta innan beslutet tas.

### `feed-info`: vad finns EGENTLIGEN i Aosoms feed

Huset har i månader sagt att "feedens EAN-kolumn är tom i 100 % av raderna", på
en mätning från 27 augusti. ☠️ **Men `AosomRow` har inget EAN-fält alls** —
`parseAosomFeed` plockar bara kolumner den känner till vid namn, så även om
Aosom fyllt i kolumnen igår hade vi inte sett det. Vi har aldrig tittat.

`?lage=feed-info` läser rubrikraden och räknar hur full varje kolumn är.
Skillnaden mellan "kolumnen finns men är tom" och "kolumnen finns inte" avgör
vad vi gör härnäst, så de hålls isär.

☠️ **Priskolumnernas VÄRDEN lämnar aldrig servern.** `Wholesale Price` är vårt
inköpspris på 6 057 artiklar och svaret går till en publik logg. Kolumnen
RÄKNAS — vi vill veta att den finns och är ifylld — men aldrig vad som står i
den. Ett test låser det.

☠️ **Och det gällde inte bara priset — jag missade artikelnumret (2026-09-14).**
Första versionen redigerade bara PRIS-kolumner. SKU-kolumnens exempelvärde är
ett Aosom-artikelnummer, och det skrevs därför till en PUBLIK
Actions-summering i den allra första körningen. Numret är exakt den sträng
dealproffsen publicerar som `sku`/`mpn`. Loggarna för den körningen är
raderade, och redigeringen täcker nu identifierarkolumner också.

⚠️ **Ryggtäckningen är på FORMEN, inte bara på namnet.** Döper Aosom om
kolumnen imorgon glider namnlistan, och **en spärr man måste komma ihåg glöms
bort** — samma argument som gjorde `AliExpressProductId` till en typ.
`serUtSomArtikelnummer` fäller på mönstret `DDD-DDDLL` (D = siffra, L = bokstav) oavsett vad kolumnen
heter. Två tester, ett för namnet och ett för formen.

**Utfallet av första körningen:** feeden har **6 085 rader**, EAN-kolumnen
FINNS — och är **ifylld på 0 av dem**. Den gamla anteckningens "tom i 100 %"
stämde alltså, men var fram till nu ett antagande om en kolumn vår parser
aldrig läst. Nu är det mätt, och skillnaden spelar roll: en kolumn som finns
men är tom är ett mejl till Aosom, en kolumn som saknas är en annan källa.

#### ☠️ EAN finns INTE i feeden, och inte i manualerna heller (2026-09-15)

Leonards fråga: *"är du säker på att ean koden är tom i filen vi får och vi inte
får den på något sätt?"* Rätt fråga — svaret vilade på EN loggrad
(`EAN-kolumn: true, ifylld pa 0 av 6095 rader`), och den raden bygger på
`harEanKolumn`, som bara letar efter de namn någon redan tänkt på
(`ean`/`ean13`/`gtin`/`barcode`) och dessutom tar den FÖRSTA träffen
(`findIndex`). Heter kolumnen något annat ser den ingenting.

Hela kolumnlistan fanns i svaret men skrevs bara till `GITHUB_STEP_SUMMARY`,
som inte går att läsa tillbaka programmatiskt. Den går till stdout nu — **namn
och ifyllnadsgrad, aldrig exempelvärdet**, eftersom redigeringen bygger på en
namnlista plus en formkoll och en kolumn som heter något oförutsett (`Net`,
`B2B`) annars hade visat sitt värde.

**Feeden har 71 kolumner och 6 095 rader.** `EAN` ligger som **kolumn TVÅ**,
heter exakt det, och är ifylld på **0**. Det finns ingen `GTIN`, ingen
`Barcode`, ingen `UPC`, ingen `MPN` — koden kan alltså inte gömma sig under ett
annat namn. `Sin` (6 095) och `Psin` (4 521) är Aosoms egna interna nycklar,
inte streckkoder; `Psin` grupperar dessutom *relaterade* varor, se ovan.

⚠️ **Två andra kolumner ingen läst, och de är inte samma sak.**
`Specification` och `Package list` är ifyllda på **18 rader** vardera — det
bekräftar den gamla anteckningens "tomt i 5 550 av 5 566". Men `pdf` är ifylld
på **5 917 (97 %)**, och den är produktmanualen.

##### Manualerna prövades — och bar ingen kod

En manual trycker nästan alltid streckkoden, så det var den enda vägen kvar
utan att fråga Aosom. `?lage=ean-jakt` (`lib/aosom/ean-jakt.ts`,
workflow-läget `ean-jakt`) öppnar manualerna och söker GTIN-13 i texten.
Uppmätt 2026-09-15 på **22 manualer spridda över hela feeden**:

| | |
|---|---:|
| manualer hämtade | 22 |
| för stora för att läsa (>20 MB) | 3 |
| oläsliga | 0 |
| trettonsiffringar hittade | 19 |
| **varav giltig GTIN-13** | **0** |
| **varav tyskt GS1-prefix** | **0** |

☠️ **BRUSSPÄRREN ÄR DET SOM GÖR SVARET LÄSBART.** En slumpmässig
trettonsiffring klarar GS1:s kontrollsiffra i **ett fall av tio**, och en PDF
är full av tal — mått, artikelnummer, datum, koordinater. Det FÖRSTA
stickprovet (9 manualer) gav "2 giltiga", och utan spärren hade den raden
rapporterats som två funna EAN. Den var brus: 2 av 39 är **5 %**, alltså under
slumpen, och noll hade tyskt prefix trots att Aosom är en tysk leverantör vars
koder mätbart ligger på 425x. Tre spärrar krävs och alla tre behövs: talet får
inte sitta i en längre siffersekvens, råtalet rapporteras bredvid så kvoten
avslöjar brus, och prefixet skiljer signal från tillfällighet.

⚠️ **Det som INTE är uteslutet:** en streckkod tryckt som BILD. Svepet läser
text. En EAN-13 ritas normalt med siffrorna under strecken, men i en manual
ligger de ofta i samma bild. Slutsatsen som gäller är alltså *"koden finns inte
som text i manualen"*, inte *"det finns ingen streckkod i manualen"*.

☠️ **Och stickprovet SPRIDS över feeden, inte de första N raderna.** Feeden är
sorterad på artikelnummer, så de första raderna är EN produktfamilj — samma
lärdom som bildmätningen 2026-08-27, som tog "tio ur vardera tredjedel" just
för att kunna säga något om sortimentet. Ett test låser ordningen.

☠️ **Rutten dog först på MINNET, och den döden gick inte via try/catch.**
Första versionen packade upp VARJE ström i PDF:en — inklusive bilderna, som
expanderar tiotals gånger — och samlade alla texter i en array innan den sökte.
Vercel svarade `instance was killed because it ran out of available memory`,
rutten gav 500 utan ett ord om varför, och mitt `catch` såg ingenting. Exakt
samma familj som den obegränsade fan-outen i `runDailySync`. Tre tak:
`MAX_STROM_BYTE` (2 MB komprimerat — det är det som skiljer TEXT från BILD),
`maxOutputLength` (8 MB uppackat, kastar i stället för att svälla) och
`MAX_PDF_BYTE` (20 MB på nedladdningen). Sökningen är dessutom löpande, ingen
text ligger kvar. Hoppade strömmar RÄKNAS (`forStora`) — de tigs inte ihjäl.

**Vägarna till EAN, uttömmande och mätta:**

| väg | utfall |
|---|---|
| Feedens `EAN`-kolumn | **tom**, 0 av 6 095 |
| Någon annan feedkolumn | finns inte — 71 kolumner genomgångna |
| Produktmanualerna (`pdf`) | **0 av 22** bär en kod som text |
| aosom.de konsumentsajt | **403** på allt, även startsidan (Akamai) |
| dealproffsen.se | har koder, mätt äkta — men se avsnittet ovan |
| B2B-portalen inloggad | **oprövad** — bara Leonard kommer in |
| Fråga Aosom | den rena vägen, och nu den enda kvar |

⚠️ Tills dess: **`identifier_exists: no` i Merchant Center.** Det fungerar för
varor utan tillverkarkod, och en GTIN hämtad från en konkurrents sajt är fel
källa för ett fält som ska vara sant.

#### ☠️ Energimärkningen finns inte heller i manualerna (2026-09-30)

Leonards fråga: fyra publicerade torktumlare saknar energimärkning, "kolla
produkt pdf om du kan hitta där". Workflowen **"Aosom — sök energimärkning i
produktmanualer"** (`/api/admin/aosom-manual` → `lib/aosom/manual.ts`) slår upp
sidans manualer i feeden, läser PDF:erna med text, OCR och QR-avläsning, och
slår upp en EPREL-kod i EU:s publika databas.

Uppmätt på alla sidor i fem manualer, som hör till tre av de publicerade
torktumlarna och till de tre utkasten (utkasten delar en manual): **ingen
energietikett, inget produktblad, ingen energiklass och ingen QR-kod alls.** Två av manualerna säger att
ECO-programmet är det energietiketten avser, alltså finns en etikett, men den
står inte i manualen. EPREL:s sökning kräver en API-nyckel (403), så varan går
inte att hitta där på märket. Kvar är att fråga Aosom om EPREL-numren. Den
fjärde publicerade torktumlaren är en AliExpress-sida och har ingen manual i
feeden.

☠️ **Manualens adress bär artikelnumret.** Den maskeras innan något skrivs ut,
varje PDF-rad går genom `redigera`, och manualerna heter A, B, C i loggen, i
stället för en hash eller en storlek i byte som hade gått att matcha mot
Aosoms filer. Inget laddas upp som artefakt.

⚠️ **Och feed-adressen lämnar aldrig servern heller.** Samma nyckel-lösa
upplägg som resten: produktionen har adressen, Actions har `CRON_SECRET`, de
möts i workflowen (**"Pris — jamfor mot dealproffsen"**, där bara lägena `feed-info`, `ean-jakt`
och `vara-sidor` används; `jamfor` körs inte, se *Dealproffsen: vi jämför inte med dem*). Rutten svarar på "vad finns i feeden" utan att någon behöver se
var den ligger.

#### Manualen hämtas krypterad (2026-10-14)

En företagskunds inköpsorder krävde manualer och instruktioner på svenska, och
Aosoms manual finns bara som länk i feeden. Workflowen **"Aosom — hämta
produktmanualen krypterat"** tar en sidas Wix-id och en engångsnyckel
(`kuvert`), slår upp manualerna via `/api/admin/aosom-manual`, laddar ner
PDF:erna och sparar dem som artefakt, krypterade mot nyckeln. Artefakten
raderas efter en dag.

☠️ **Krypteringen är det enda undantaget från "inget laddas upp som
artefakt".** Manualen bär artikelnumret i adressen och ofta på sidorna, och
artefakter på ett publikt repo går att hämta. Adressen maskeras och skrivs
aldrig ut, filerna heter `manual-1.pdf` och så vidare, och faller ett
krypteringssteg sparas ingenting.

## Google Shopping: huvudfeed i butiksrepot, TILLÄGGSFEED här (2026-09-15)

Butiksrepot (`fyndplats-headless`, gren `headless-site`) har sedan 2026-07 en
huvudfeed till Merchant Center: `/feed/google.xml`, RSS på variantnivå med
`g:id` = Wix-variantens id, `g:item_group_id` = produktens, brand Fyndplats,
`identifier_exists` no, kategori via kollektionens slug, upp till tio bilder,
ISR en gång i timmen. **Den behöver ingen tvilling.** Briefens "ingen feed
finns" gällde det här repot.

⚠️ **Huvudfeeden skickar `g:mpn` = Wix-variantens SKU ("FP-…").** Det är vårt
eget, inte Aosoms nummer, så det läcker inget — men briefens beslut #3 är
"ingen mpn", och Google förväntar sig ingen mpn på en rad med
`identifier_exists: no`. Tas bort i butiksrepot (marknadsplan v3, vecka 1).

Det huvudfeeden inte kan bära är det som bara finns i mappningarna här:
prisgruppen (A/B), prisbandet och konkurrensläget. Därför
en **tilläggsfeed** (`lib/feed/google-shopping.ts`,
`/api/feed/google-shopping-tillagg?nyckel=<GOOGLE_FEED_SECRET>`): bara `id`
+ `custom_label_0/1/2`. Merchant Center slår ihop den med huvudfeeden på `id`,
och kampanjen väljer produkter på `custom_label_0` (A/B — tom = inte med).
`?lage=status` (räknarna) nås även med CRON_SECRET — workflow
**"Google Shopping — tillaggsfeedens status"**.

### Fyra egenskaper som inte ska tas bort

1. ☠️ **Id:t är VARIANTENS** (`variants[0].wixVariantId`), inte produktens.
   En rad på produkt-id matchar ingenting i huvudfeeden och etiketten sätts
   tyst aldrig. Utan variant-id utelämnas raden och räknas.
2. ☠️ **Inget artikelnummer, inget inköpspris, inget belopp** — etiketterna
   är ord. Inga belopp står i feeden. Testet låser det.
3. ☠️ **Band och läge räknas på BUTIKENS pris** (`listV3ProductPrices`),
   aldrig på mappningens `grossSek`. Tvetydigt pris → ingen etikett.
4. ☠️ **Under 200 rader svarar rutten 503**, så Google behåller förra
   tilläggsfeeden. Ett tomt svar hade strukit varje etikett — och därmed
   varje produkt ur kampanjen — tills nästa hämtning.

Nyckeln ligger bara på Vercel och matas in i Merchant Center för hand; fel
nyckel ger 404, inte 401. Nio tester.

⚠️ **Prisgrupp och konkurrensläge är avvecklade 2026-10-21** (Leonard: vi jämför inte med
dealproffsen). Ingen rad har `prisgrupp`, så `custom_label_0` är tomt för alla och en kampanj som
väljer på den får inga produkter. Vad kampanjen väljer på i stället är Leonards beslut.
Tilläggsfeeden svarar 503 under 200 rader, så Google behåller förra versionen.

## Aosom-recensioner: hämtas i webbläsaren, läses in via rutt (2026-09-16)

Svepet `/api/cron/aosom-reviews` (2026-08-29) fick 403 på varje sida — Akamai
släpper bara igenom riktiga webbläsare, och 2026-09-16 mättes samma 403 för
`curl` med fulla webbläsarrubriker. Samma dag gav Aosom skriftligt tillstånd
att hämta och översätta recensionerna, så vägen blev:

1. **Hämtning i Leonards Chrome** (Claude in Chrome, en egen flik på aosom.de).
   Deras sök-API `/rest/v1/searchApi/product?keyword=<artikelnummer>` ger
   `sin`, `skuid`, `urlkey`, `score`, `commentCount` och `stockQty`. Deras
   recensions-API `/block/template/detailComment?pageNum&pageSize=50&sin&skuid&_lang=de&_siteId=210&_version=test3&sort=default`
   — samma anrop som deras produktsida gör — ger ALLA recensioner
   (`list[]`: `qualityScore`, `title`, `content`, `ct` = datum, `imgurls` =
   semikolonseparerade foton på img.aosomcdn.com, `sourceName`) och
   `globalRateCount`/`globalReviewCount`. Produktsidans JSON-LD (högst fem
   texter, utan datum och foton) var första vägen och är passerad: gymstationen
   hade tolv recensioner i API:t, fyra i JSON-LD. ~2,4 s per produkt.
   Aosom sa ja till texter OCH foton (2026-09-16).
2. **Inläsning** via `POST /api/admin/aosom-reviews-ingest`
   (`lib/aosom/review-ingest.ts`, tio tester), workflow
   `aosom-reviews-ingest.yml` med `payload_file` i grenen — samma mönster som
   review-translate. Nyttolasten är nycklad på **wixProductId**, bär tyska
   texter, valfria svenska översättningar (`sv`), datum, kundfoton (bara
   img.aosomcdn.com släpps igenom, hemflytt sker i importen), Aosoms betyg och
   antal — aldrig artikelnummer (workflowen vägrar filer som matchar
   artikelnummermönstret) och aldrig recensentens namn.

Fyra egenskaper som inte ska tas bort:

1. Samma lagring som svepet: `importReviewsForProduct(..., { source: "aosom" })`
   med husets filter oförändrat (betyg ≥ 3, längd, spam, utlandsleverans,
   dubbletter), och aggregatet på mappningen (`aosomRating`,
   `aosomReviewCount`) — ☠️ aldrig uträknat ur texterna.
2. ☠️ En översättning skrivs bara på en rad som ligger som `pending` och bara
   om `validateTranslation` godkänner den — samma grind som /admin/reviews.
   Underkända räknas per skäl (`underkandaSkal`) och ligger kvar i kön.
3. Högst 60 rader per anrop och tidsbudget 240 s; svaret bär `kvarFran` så
   workflowen fortsätter från rätt rad. Torrt som default (`dryRun: false`
   krävs för att skriva).
4. Loggen bär bara räknare — rutten anropas från en publik Actions-logg.

Butikssidan räknar i dag snitt och antal ur de SYNLIGA raderna
(headless-site `lib/reviews.ts`), inte ur `aosomRating`/`aosomReviewCount`.
Med filtret betyg ≥ 3 lutar det synliga snittet uppåt mot Aosoms — att visa
Aosoms eget aggregat är nästa steg, inte gjort. Observera att Aosoms API bara
lämnar ut 4- och 5-stjärniga recensioner (8 329 hämtade, ingen under 4), så
snittet är högt oavsett vad vi räknar på.

**Första inläsningen gjordes 2026-09-16** (skarpt, 0 skrivfel): 972 produkter
(alla Aosom-produkter i annonsurvalet), 8 329 texter hämtade, 4 383 kvar efter
husets filter (863 med kundfoton), 2 510 översatta till svenska och synliga —
upp till fem per kampanjprodukt, tre per övrig. Resterande 1 873 ligger som
`pending` (osynliga) och tas i en andra omgång via `review-translate.yml`, som
redan tar en `payload_file` med översättningar. Nyttolasten låg på den
tillfälliga grenen `claude/aosom-recensioner-2026-09-16` (raderad efter
inläsningen — repon är publik). Rådata, filtrerad mängd och alla
översättningar finns lokalt hos Leonard i `_claude_tmp/recensioner/`
(git-exkluderat, bär artikelnummer). Översättningsreglerna som gällde:
leverantörsnamn, budfirmor, recensentens namn, rabatter, sajt/säljare och
utlovade leveranstider bort; kritik kvar; recensioner som bara handlar om
leverans/retur/kundtjänst hoppas över; längd 0,45–2,2 × källan; ordet "fast"
undviks (engelsk-markör i `validateTranslation`). Butikssidorna cachar
recensionerna en timme (`revalidate: 3600`, tagg `reviews`) — omedelbar
uppdatering kräver headless-sitens `/api/admin/revalidate?tag=reviews` med
`ADMIN_SECRET`, som Claude inte läser.

**Kundfotona flyttas hem.** Publicerade recensionsbilder får aldrig peka på
leverantörens CDN (adressen syns vid högerklick). `withOwnImage` i
`lib/store/reviews.ts` gör flytten vid publicering, men listan över
leverantörsvärdar i `lib/wix/media-import.ts` kände bara AliExpress —
`img.aosomcdn.com` lades till 2026-09-16 efter att 709 synliga Aosom-rader
(1 130 foton) publicerats med Aosom-adresser. Redan publicerade rader lagas
med workflowen `review-image-repair.yml` (loopar `repairImages` i
`/api/cron/review-translate`, 40 rader per anrop, stannar när inget minskar).
Pending-rader behåller källadressen med flit — flytten sker när raden blir
synlig. Wix Media hade 12 GB ledigt 2026-09-16 (Leonard). ☠️ Nya Aosom-foton
skickas inte längre med i inläsningen — se omgång 5 nedan.

**Nästa omgång: vilka produkter, och deras artikelnummer (2026-09-23).**
Workflowen `aosom-reviews-kandidater.yml` svarar med SYNLIGA Aosom-produkter
som aldrig fått `reviewsCheckedAt`, och deras artikelnummer — krypterade mot
anroparens engångsnyckel (`kuvert`, obligatoriskt; inget klartextläge). Rutten
är `GET /api/admin/aosom-reviews-kandidater` (`?fore=<ISO>` tar även med
produkter kontrollerade före ett datum), logiken `lib/aosom/review-kandidater.ts`
med elva tester. Stämpeln sätts av inläsningen och av det gamla svepet bara vid
svar, aldrig vid fel, så urvalet är exakt. Förra vägen — jämförelsefilen —
täckte bara annonsurvalet, och `/admin/mappings` laddade inte vid ~5 500
produkter (se nedan).

**Leverantörslänkar för en hel lista (2026-10-07).** Leonard ville ha
Aosom-länken bredvid varje produkt i två listor, 505 produkter. Workflowen
**"Leverantörslänkar — Aosom- och AliExpress-länk för en lista produkter
(krypterat)"** tar Wix-produkt-id, slugs eller butiksadresser och svarar med
samma länk som "Öppna hos Aosom" i `/admin/source-lookup`
(`leverantorskallaFor`). En AliExpress-rad får sin AliExpress-länk, och en
sammanslagen sida får en länk per färg ur flödet. Rutten är
`POST /api/admin/leverantorslankar`, logiken `lib/import/leverantorslankar.ts`.
Tre egenskaper som inte ska tas bort:

1. ☠️ **Kuvertet är obligatoriskt**, som för kandidaterna. Länken bär
   artikelnumret.
2. ☠️ **Svaret bär inga kostnader**, och ett fel från flödet blir en flagga
   (`flodetFel`) utan meddelande, eftersom flödets adress är hemlig.
3. **Slugs slås upp hundra åt gången** med `$in` på slug
   (`getV3ProductIdsBySlugs`, mätt mot skarpa V3 samma dag). Okända slugs,
   produkter utan mappning och ordernummer listas i svaret i stället för att
   tystas.

**`/admin/mappings` laddade inte (2026-09-23).** Sidan skickade hela
`WixV3ProductSummary` för varje produkt till webbläsaren — beskrivning och
JSON-LD-taggar gånger ~5 500 — och ritade ett kort med bild per produkt. Nu går
bara id, namn, slug, bild och varianträkning till klienten, beskrivningen hämtas
inte alls (`listAllV3Products({ beskrivning: false })`), och listan ritas 60 kort
i taget. `listAllV3Products` hade dessutom kvar det tysta 50-sidorstaket som
`listVisibleV3ProductIds` fick bort 2026-09-14: /admin/seo, lönsamhetsrapporten
och mappningssidan räknade på de första 5 000 produkterna. Taket är nu samma som
den andras och KASTAR.

**Omgång 3 (2026-09-23): 1 086 svenska texter på 316 produkter.** Lärdomar
som gäller nästa omgång:

1. **Hämtningen går i en Web Worker.** En dold flik strypte sidans timers till
   ett uppvaknande per minut (Chrome, "intensive wake-up throttling"); samma
   loop i en worker skapad från en blob-URL gick i normal takt (~1,9 s per
   produkt). Fetch från workern kräver absolut URL (`location.origin + väg`).
2. **Aosoms recensionsdata är inte alltid rätt produkt.** Samma text låg på
   upp till fyra olika produkter, och recensioner av en massagefåtölj låg på
   en julgran. Därför: bara recensioner på exakt artikelnummer, INGEN text som
   finns på två olika produkter, och en granskning av varje översättning mot
   produktnamnet innan inläsning.
3. **API:t ger bara 4–5 stjärnor.** Alla 4 545 hämtade texter hade betyg 4
   eller 5.
4. **Den publika recensionsrutten cachas.** Direkt efter inläsning svarade
   `/api/reviews/<id>` tomt för åtta produkter (gammalt CDN-svar); nästa
   anrop var rätt. Produktsidorna cachar i en timme (taggen `reviews`).

**Omgång 5 (2026-09-30): 646 svenska texter på 204 produkter, 334 kundfoton.**
318 produkter importerade sedan omgång 4, upp till fem texter per produkt.
Lärdomar som gäller nästa omgång:

1. ☠️ **Kundfotona följer INTE med i inläsningens nyttolast.** `imageUrls` i
   `aosom-reviews-ingest` går via Wix Import File (`importImageToOwnMedia`),
   som svarar direkt och hämtar senare. Ungefär var sjätte Aosom-bild slutar
   FAILED i efterhand (Aosoms CDN anger fel Content-Type, eller `.heif` på en
   JPEG), och raden pekar då på en död adress. Det var så de 1 358 raderna
   tappade sina foton (återställda 2026-09-28/29, #687/#688). Gör i stället
   så här: läs in texterna UTAN `imageUrls`, lägg fotona i en egen fil
   `{"rader": [{productId, reviewIdAE, sourceImageUrls}]}` i samma tillfälliga
   gren (högst tre foton per recension, `reviewIdAE` = `ensureReviewId` av
   texten), och kör `aosom-review-image-restore.yml` på den efter
   inläsningen, torrt och sedan skarpt. Rutten laddar ner källfotot, bestämmer
   typen ur filens egna byte och skriver adressen först när Wix svarat READY.
   En rad utan foto räknas som återställbar och en rad med fungerande foto rörs
   aldrig, så körningen går att göra om. Utfall: 333 av 334 foton i första
   körningen och det sista i en omkörning. Filerna saknar `sourceUrl`, så
   mediastädningen kan aldrig radera dem.
2. **Artikelnumren lämnar aldrig webbläsaren.** Kandidatlistan dekrypteras i
   Leonards Chrome (WebCrypto med engångsnyckeln) och hämtningen körs där.
   Till molnet går bara en indexnycklad export, i delar om 40 000 tecken via
   sidtexten, och varje del kontrolleras med FNV-1a. JavaScript räknar
   UTF-16-enheter, så jämför hashen och inte längden i Python. Texter som
   innehåller ett kandidat-artikelnummer stryks redan i webbläsaren.
3. **Originaltexten hamnar i en publik gren**, så en recension stryks helt om
   originalet innehåller recensentens namn, en signatur ("Mit freundlichen
   Grüßen" följt av ett namn) eller en kundtjänstpersons namn. Namnet går
   inte att tvätta bort i översättningen. Hämtningen flaggar när recensentens
   förnamn står i texten, och översättare och granskare fångar resten.
4. **Nya strykregler i översättningen:** reklamton (produkttext med varumärke
   och inget eget omdöme), en annan färg än titelns när färgen är poängen, ett
   yngre barn än titelns åldersgräns och påståenden om tillverkningsland.
   Hälsouppgifter ("gör som sjukgymnasten sa", "inte ont i ryggen längre")
   stryks som diagnoser. Texterna kommer från Aosoms alla länder (de, fr, it,
   es, pt, ro, en), och reglerna täcker dem.
5. **Titlar som kunderna säger emot** (antiimma, mått, ram, glas eller
   plexiglas, material, färg) listas för Leonard. Texten stryks, och titeln
   ändras bara efter hans ja.
6. **Tider:** inläsningen tog 59 s för 318 rader, och fotona 23 min för 215
   rader.

## Recensioner daterade före 2021 visas inte (2026-09-23)

Leonards beslut: "Alla recensioner som är äldre än 2021 måste bort." Butiken
startade 2021, och Aosoms API ger omdömen ända från 2015 (159 av 1 086 i
omgång 3). Regeln bor i `lib/reviews/datumgrans.ts` (`TIDIGASTE_RECENSIONSDATUM`)
och används på två ställen:

1. **Husets filter** (`rankaMedGolv` i `lib/import/review-import.ts`) slänger
   omdömen daterade före gränsen vid inläsningen — alla källor, även i
   räddningssvepet för korta texter.
2. **Städningen** `POST /api/admin/recensioner-datumrensning` (workflow
   `recensioner-datumrensning.yml`, torrt som default) DÖLJER det som redan
   ligger i lagret: status → `rejected` på varje synlig eller väntande rad
   före gränsen. Inget raderas; en rad kan återställas i /admin/reviews.

☠️ Okänt datum behålls — att gissa hade tagit bort äkta omdömen. ☠️ Rutten
läser HELA lagret: `listAll` sorterar nyast först och kapar vid 5 000 som
standard, så de äldsta raderna — just de som söks — hade fallit bort tyst.
Svaret säger `trunkerad: true` om läsgränsen ändå nås, och workflowen stannar.

## AliExpress-kön töms: väntande AliExpress-recensioner döljs (2026-10-06)

Leonards beslut: de AliExpress-recensioner som ligger i /admin/reviews och
väntar på översättning och godkännande behövs inte. `POST
/api/admin/recensioner-ae-ko` (workflow `recensioner-ae-ko.yml`, torrt som
default) sätter status `rejected` på varje `pending`-rad vars källa är
AliExpress (`source` saknas eller är `"aliexpress"`). Logiken:
`lib/reviews/ae-ko-rensning.ts`.

☠️ Dölj, radera aldrig: den dolda raden är också dubblettspärren, så en
raderad rad hade köats igen nästa gång produktens AliExpress-recensioner
hämtas. ☠️ Publicerade AliExpress-recensioner, Aosom-rader och kundomdömen
rörs inte.

**Inga nya AliExpress-recensioner hämtas** (Leonard 2026-10-06: "jag vill inte
att vi hämtar aliexpress recensioner längre"). Stoppet sitter på tre ställen:

1. `importReviewsForProduct` sparar ingen rad utan källa (= AliExpress). Det
   täcker produktimporten, tillägget (`/api/reviews/import`) och backfillen.
   Aosom-inläsningen skickar `source: "aosom"` och går igenom.
2. `/api/cron/review-queue` svarar med ett tomt svep (`stoppad: true`) utan
   att hämta något.
3. `/api/import` köar inga recensioner efter en produktimport.

`aeRecensionerStoppade()` i `lib/reviews/ae-ko-rensning.ts` styr 2 och 3.
`AE_RECENSIONER=pa` slår på dem igen, men steg 1 gäller ändå. AliExpress-
fotoåterställningen (`review-image-restore`) hämtar bara foton till rader som
redan finns och rörs inte.

## Kundomdömen utan namn får initialer från ordern (2026-10-18)

Leonards rapport: ett godkänt kundomdöme på en elkamin visade "Verifierad
köpare" som namn. Butikens formulär har ett frivilligt namnfält, och lämnas det
tomt sparar butiken den texten som initialer (headless-site
`lib/customer-review.ts`, `initialsFromName`). Leonard: det ska visa
initialer, som de andra.

Motorn tar numera initialerna från ordern när fältet är tomt
(`/api/reviews/customer` → `lib/reviews/kundinitialer.ts`). Köparens namn på
fakturan gäller först, sedan mottagaren och leveransadressen. Regeln är
butikens: första bokstaven i första och sista ordet. Omdömen som skrevs innan
dess rättas med workflowen **"Recensioner — initialer på kundomdömen som visar
"Verifierad köpare""** (`/api/admin/kundomdome-initialer`, torrt som default).

Fyra egenskaper som inte ska tas bort:

1. ☠️ **En order som inte går att läsa fäller aldrig omdömet.** Då står
   "Verifierad köpare" kvar, och workflowen rättar raden senare.
2. ☠️ **Statusen följer med oförändrad**, och en rad räknas som rättad först
   när den läses tillbaka med de nya initialerna.
3. ☠️ **Loggen och svaret bär bara räknare och produkt-id**, aldrig namn eller
   initialer.
4. ☠️ **Omdömets order-id är oftast ordernumret ("10083"), inte Wix order-id.**
   Butikens omdömeslänk bär `tracking_mapping.order_id`, som är numret, och
   `GET /ecom/v1/orders/{id}` svarar 404 på ett nummer. `fetchOrderKundnamn`
   (`lib/wix/orders.ts`) söker därför fram ett nummer, och träffen måste bära
   samma nummer: ett filter som inte biter hade gett en annan kunds initialer.
   Första versionen slog bara upp id:t, och torrkörningen 2026-10-19 hittade
   ingen av de tre gamla raderna (`orderSaknas` 3 av 3).

⚠️ Formuläret säger "frivilligt – vi visar bara initialer". Lämnar kunden
fältet tomt visas nu initialerna från beställningen, så texten bör säga det.
Det är en ändring i butiken (`components/review-form.tsx`).

## Recensionernas svenska ska låta som en kund, inte som en AI (2026-09-24)

Leonard 2026-09-24: recensionerna var välskrivna men såg AI-skrivna ut —
tankstreck, perfekt grammatik och stela fraser. 709 av 4 268 publicerade
Aosom-texter hade tankstreck. Stilen från och med nu, för all översättning
(även prompten i `buildTranslatePrompt` för /admin/reviews):

- Inga tankstreck (`–`, `—`, ` - `), inga semikolon, inga citattecken, ingen `…`.
- Vardagliga ord och korta meningar: "lätt att sätta ihop", "funkar bra",
  "prisvärd", "rekommenderar". Inga AI-fraser: "Sammantaget",
  "Sammanfattningsvis", "helt och hållet", "förhållandet mellan pris och
  kvalitet", "kan varmt rekommenderas", "ett riktigt blickfång".
- Samma längd och ton som originalet — ett slängigt original får bli lite
  slängigt (gärna utan punkt sist). Inga påhittade stavfel: vardaglig, inte slarvig.
- Innehållet ändras aldrig, och tvätten gäller som förut (inga varumärken,
  butiker, budfirmor, namn, priser, leveranstider, kundtjänst, diagnoser).

**Omskrivning av det som redan är publicerat:** `POST /api/admin/recensioner-omskrivning`
(logik `lib/reviews/omskrivning.ts`, workflow `recensioner-omskrivning.yml` med
`payload_file` i en tillfällig gren, torrt som default). Den ENDA vägen som
byter text på en synlig rad, och bara när: raden är `source: "aosom"`, raden är
synlig, den lagrade texten fortfarande är exakt `fore` (en människas ändring
skrivs aldrig över), och den nya texten klarar `validateTranslation`. En rad
med `dolj: true` döljer en recension som visat sig handla om en annan produkt.

## ☠️ Butikens kategorilista kapades vid 100 (2026-09-24)

Sökordsrundorna S4–S10 skapade drygt 40 kategorier på ett dygn, och
katalogen passerade 100 kategorier. Butiken (`headless-site`,
`lib/products.ts`) läste kategorierna med `.limit(100)` och hämtade aldrig
nästa sida. Det gällde både menyn och listan över kända slugar.

Wix sorterar på id, så en kategori över plats 100 faller bort oavsett hur
gammal eller stor den är. Den försvinner ur menyn, och dess sida svarar 404.
Så gick det:

- Golvlampor gav 404 i produktion.
- Efter S10 låg nio kategorier utanför, bland dem Skönhet & Hälsa, som är en
  huvudavdelning.

Lagat i #649 (`lib/category-paging.ts`). Lagningen hämtar alla sidor, och taket
kastar i stället för att kapa. Tills den var ute var de åtta nya
S10-kategorierna dolda i Wix. Bara synligheten ändrades, inte kopplingarna.

☠️ **Felet syntes på en GAMMAL sida, inte på de nya.** Hantlar & hantelset, som
var OK i förra förhandsbygget, gav 404 i nästa. Den som skapar kategorier ska
därför hämta minst en befintlig kategorisida i förhandsbygget, inte bara de nya.

☠️ **Sida två får bara bära markören.** `categories/query` svarar `400
INVALID_CURSOR` på filter och markör i samma anrop. Det är samma familj som
`inventory-items/query` och `products/search`. SDK:ts `next()` gör rätt av sig
självt, men en handskriven loop gör det inte.

## ☠️ Kategorisidans adress räknas ur NAMNET, och é blev bindestreck (2026-09-24)

Butiken gör sin egen adress av kategorinamnet i Wix (`asciiSlug`, sedan #647 i
`lib/category-slug.ts`). Fram till dess gjorde den bara om å, ä och ö, och alla
andra tecken blev bindestreck. *Skärmtak & entrétak* (runda S13) fick därför
adressen `skarmtak-entr-tak`, medan texterna och Google-flödet var nycklade på
`skarmtak-entretak`. Sidan renderades med den generiska mallen, och den väntade
adressen gav 404.

☠️ **Vakten i skrivanropet kunde inte se det**, för den räknade med en egen
avskrift av funktionen, och avskriften hade två extra regler (`é→e`, `ü→u`).
En vakt som kör en kopia av butikens kod mäter kopian. Det som fångade felet
var förhandsbygget, som läser butikens riktiga svar. **Adressen kontrolleras
alltså i förhandsbygget, inte i skrivanropet.**

Lagningen tar bort accenter med NFD. Mätt mot alla 128 kategorinamn: bara den
kategorins adress ändrades.

## ☠️ Butikens sidovagnar läste bara de 1 200 nyaste produkterna (2026-09-24)

Tre hämtningar i butiken gick nyast först och slutade efter 12 sidor om 100.
De 1 200 nyaste produkterna är Aosom-varor utan färgval, och drygt hälften är
dolda utkast. Färgfiltret visade därför aldrig en färg (alla 239 produkter
med optioner låg bakom taket), och Google-flödet hade extrabilder på 557 av
3 393 produkter. Variantsvepet till flödet hade kapat tyst vid 10 000 i
mitten av november.

Lagat i #647: färgfrågan filtrerar på `options.id`, flödet faller tillbaka på
produktens galleri, och varianttaket loggar ett fel. Detaljerna står i
butikens `CLAUDE.md`. **Ett tak räknat nyast först ser inte katalogen**, och
`filter` går bara med på första sidan, eftersom filter plus markör svarar
`400 INVALID_CURSOR` även på `products/query`.

## ☠️ Menyns underkategorier syntes inte för Google (2026-09-24)

Mega-menyn renderade bara panelen man hovrar över, och Googlebot hovrar
aldrig. Mätt i produktion, både i server-HTML och renderat i Chromium utan
interaktion: **startsidan länkade till 0 av 105 underkategorier**, en
produktsida till 1 (bläddringsraden). Bara /butik (48) och avdelningssidornas
Förfina-chips, som syns först när JS har kört, länkade dit. Startsidan är den
enda sidan med externa länkar (Semrush: 62 + 23 refererande domäner, ingen
annan sida har någon).

En PageRank-modell över sajtens egna länkar gav därför varje
sökordskategori ungefär samma interna värde som en medianprodukt. Kategorin
fanns, med text och FAQ, men sajten pekade inte på den.

Lagat i #647 (`2513ae85`): alla tio paneler ligger i HTML:en, dolda med
`hidden`. Modellen ger underkategorierna 45–86 gånger mer, och en
medianprodukt behåller 77–82 %. Underlaget och skripten står i
`tools/polish-assets/meny-underkategorier/`.

**En ny kategori får sina länkar från menyn, och menyn läser Wix.** Den som
skapar en kategori behöver alltså inte lägga in en länk någonstans. Men den
som bygger en länk som bara renderas vid hovring, klick eller efter mount har
byggt en länk som Google inte ser. Regeln och testet står i butikens
`CLAUDE.md` (`lib/meganav-ssr.test.ts`).

## Långsvansen bärs av smala kategorier, inte av produktsidor (2026-09-24)

Leonards fråga: ett sämre sökord på sida 1 ger mer trafik än det bästa på
sida 3. Det stämmer, och det är mätt. Av domänens 30 sökord på sida 1 har 26
under 200 sökningar i månaden, och av 62 sökord över 500 ligger inget där.

Men sidtypen avgör. dealproffsen.se säljer samma Aosom-varor och ligger topp
10 på 1 425 sökord, mot våra 30. Deras produktsidor ligger topp 10 på 120
långsvansord över 200 sökningar. Vi syns i topp 100 på 8 av dem, även där vår
titel börjar med exakt ordet (*Hundsoffa 98 cm i blått*). Titeln är inte
bromsen, sidans styrka är.

☠️ **Lägg därför ett mindre sökord på en smal kategori, inte på en
produktsida.** Efter #647 länkas varje underkategori från varje sida via
menyn, och produktsidorna har inga sådana länkar. Välj ord där en jämnstor
konkurrent redan rankar med samma sidtyp. Urvalsregeln och mätningen står i
`tools/polish-assets/runda-s14-langsvans-kategorier/`.

⚠️ **Omätningen 2026-10-30 är provet.** Om S14-sidorna inte rör sig medan
dealproffsen ligger på plats 1–5 med samma upplägg, är det domänens styrka som
bromsar. Då är nästa steg externa länkar, inte fler sidor.

## ☠️ Domänen saknar riktiga länkar — det är bromsen nu (2026-09-24)

Semrush räknar 224 länkande domäner till fyndplats.se. De 40 starkaste är
alla automatiska spamsajter (`bye.fyi`, `metamagic.top`, `byteshort.xyz` …),
alltså ingen enda riktig svensk sajt. dealproffsen har 456, varav ett
tjugotal äkta: Reco.se, Cuponation, forum som ifokus, en affiliatesajt och
köpta artiklar på Expressen och lokaltidningar. Tekniken är mätt frisk
(Lighthouse SEO 100, komplett Product-JSON-LD), så varken fler sidor eller
mer teknik flyttar oss förbi dem. Planen och underlaget står i
`tools/polish-assets/seo-granskning-2026-09-24/`.

☠️ **Köp inte följbara länkar**, även om konkurrenten gör det. Googles
spampolicy kräver `rel="sponsored"` på betalda länkar. Prisjämförelse,
rabattkodssajter, affiliate och digital PR med vår egen prisdata är vägarna,
och alla kräver Leonard.

⚠️ **Profilerna finns redan. Kolla butikens `sameAs` innan du föreslår en.**
Google Företagsprofil (4,9), hitta.se, Trustpilot och Reco finns alla.
`app/layout.tsx` på `headless-site` listar de flesta, och granskningen
föreslog ändå att skapa dem. Deras länkar är `nofollow`, och Trustpilot och
Reco har 0 omdömen. Reco är inte ens verifierad, och Trustpilots
inbjudningscron togs ur schemat 2026-08-17 på Leonards beslut.

☠️ **En adress som rankar får aldrig sluta på `/butik`.** `/basta-i-test/massagepistoler`
låg 18:e på *massageapparat bäst i test*. Köpguiden blev tunn när vi slutade
sälja massagepistoler, och koden skickade vidare med 307 till `/butik`, så
rankningen följde med dit. Den pekar nu på bloggens guide (#647, med test).
Före en omdirigering: kontrollera vad adressen rankar på
(`rankande-adresser.tsv` i granskningen) och välj en sida som svarar på
samma fråga. Finns ingen sådan är en ärlig 404 bättre än en irrelevant sida.

## Slutsålda sidor med trafik: omdirigera bara det som är borta för gott (2026-10-18)

Leonards fråga: ska produkter som varit slutsålda länge men får trafik
omdirigeras? Search Console (bildsök 28 dagar, webbsök 7 dagar) jämfört med
butikens flöde och Wix lager:

| helt slutsålda sidor med trafik | sidor | webbklick 7 d | bildklick 28 d |
|---|--:|--:|--:|
| Aosom | 46 | 5 | 4 |
| AliExpress, slut under 30 dagar | 27 | 5 | 41 |
| AliExpress, slut minst 30 dagar | 38 | 4 | 9 |
| **alla** (av 124 och 188 produktklick) | **111** | **14** | **54** |

32 av bildklicken gick till ett enda vägghängt sängbord. "Slut i minst X
dagar" är tiden sedan lagerraden i Wix senast ändrades (`updatedDate` i
`inventory-items/query`), alltså en undre gräns.

Regeln, med Leonards ja samma dag:

1. **Omdirigera bara det som är borta för gott och har en likvärdig vara i
   lager.** Borta för gott är AliExpress slut i minst 30 dagar, eller
   Leonards besked. Målet ska svara på samma sökning, aldrig `/butik` eller en
   bred kategori.
2. **Aosom-sidor ligger kvar.** Flödet tar tillfälligt bort varor med lågt
   lager, och 45 av 46 hade varit slut kortare än 30 dagar. Synken fyller på
   och mejlar bevakarna.
3. **Utan likvärdig vara ligger sidan kvar som slutsåld.** En adress som
   redan svarar 404 får vara en 404.

Nio sidor dolda och tolv rader skrivna 2026-10-18, bland dem två döda
fågelbursadresser. Sängbordet pekar på en sida med samma vara i vitt.

Så görs det, och tre saker att inte missa:

- Raderna först, i en batch med "Lägg till 301-redirect" och `force=true`,
  eftersom källan fortfarande är synlig. Sedan döljs sidan med samma anrop som
  sammanslagningen, `{ product: { revision, visible: false }, fieldMask: {
  paths: ["visible"] } }`, och läses tillbaka.
- ☠️ **Workflowens lista visar bara de 200 senast ändrade raderna**
  (`listRedirects(limit = 200)`), och samlingen hade 529. Leta kedjor i hela
  `FyndplatsRedirects`. En rad pekade på en av sidorna som doldes och pekades
  om i samma batch.
- ☠️ **Wix dolde också den enda varianten på produkter utan val** (1 av 1
  synlig blev 0 av 1). På sidorna med två färger stod varianterna kvar.
  Publiceras en sådan sida igen: kontrollera varianten, annars visar sidan
  "Slutsåld" med fullt lager.
- ⚠️ **Räkna med en kvart innan en dold sida pekar vidare.** Produktsidan
  cachas i sex timmar, och butikens cron `uppdatera-andrade` (var femte
  minut) bygger om sidor vars `updatedDate` flyttats. Tio av tolv adresser
  pekade rätt inom fem minuter och de sista två efter fjorton. Att tömma
  sidan för hand (restock-provets läge `sidan`) behövs inte: två sidor
  byggdes om med gammal produktdata och väntade ändå på cronen.

## Restock-bevakarna (`/admin/restock-list`, 2026-09-30)

Leonards rapport: sidan visade produkterna på engelska. Namnet kom ur
mappningens `seoTitle`, som är leverantörens sidtitel från importen
("… - AliExpress") och aldrig skrivs om av poleringen. Sidan läser nu butikens
namn ur Wix (`searchProductSummaries`, ett anrop per 100 produkter) och visar
leverantören med länk, lagret hos leverantören och lagret hos oss. Vad som
visas bestäms i `lib/restock/rader.ts`.

### Restock-mejlet (2026-09-30)

Leonards granskning av mejlet: leverantörens namn och bild, loggan på vit botten
och en sidfot som sa *"skickades automatiskt av Fyndplats sync-cron. Klicka inte
på okända länkar"* till kunden. Och Aosom-varor fick inget mejl alls. Mejlet
hade dessutom aldrig nått någon: 52 restock-händelser sedan 2026-08-16, noll
notifierade.

Båda synkerna går nu genom `mejlaBevakare` (`lib/restock/notify.ts`). Mejlet
byggs i `lib/restock/mejl.ts` och får butikens kundomslag
(`lib/email/kundmejl.ts`, samma form som butikens egna kundmejl): mörk
rubrikrad med loggan, avsändaren `orders@fyndplats.se`, svar till
kundservice och en sidfot med mejl och telefon.

| synk | när bevakarna mejlas |
|---|---|
| AliExpress | listningen går från slut till aktiv (`justRestocked`), alltså hela produkten |
| Aosom | en lagerrad går från noll till mer än noll i butiken (`aterkomnaLagerrader`) |

Sju egenskaper som inte ska tas bort:

1. ☠️ **Allt kunden ser läses färskt ur Wix precis före utskicket**
   (`getV3ProduktKort`): namn, bild, pris och adress. Mappningens `seoTitle` är
   leverantörens titel, och en bild som inte ligger hos Wix släpps aldrig in.
2. ☠️ **En bevakare stämplas bara när Resend tog emot mejlet.** Den gamla vägen
   stämplade alla, också när `sendEmail` svarade `skipped`. Då var bevakningen
   förbrukad utan att något mejl gått.
3. ☠️ **Aosom räknar per lagerrad, inte per produkt.** Butikens formulär visas när
   den VALDA färgen är slut, också när en annan finns, och bevakningen sparar
   ingen färg. Den 2026-09-30 väntade två av fyra bevakare så (vitt sängbord,
   beige klättervägg). Mejlet säger då vilket utförande som kom tillbaka och
   visar dess bild, ur valets `linkedMedia` — variantens egen `media` bar den
   andra färgens bild. AliExpress-synken ser bara hela produkten och mejlar
   alltså först när varan varit helt slut.
4. ☠️ **Ingen synlig variant, dold produkt eller saknad adress stoppar mejlet.**
   En sida vars enda variant är dold visar "Slutsåld" med fullt lager.
5. ☠️ **Ett pris som synken skrev i samma körning visas inte.** Wix läsning
   släpar efter en skrivning, och mejlet får inte säga ett annat pris än sidan.
6. **Butikens cache för sidan töms före utskicket** (`uppfriskaProduktsida`).
   Produktsidorna cachas en timme och bara en order tömmer dem, så länken hade
   annars kunnat visa "Slutsåld". Kräver `ADMIN_SECRET` i motorns miljö; nyckeln
   går som kakan `fp_admin`, för proxyns `?key=` bygger på en kaka som fetch inte
   sparar. Saknas nyckeln går mejlet ändå, och loggen säger `sidans cache:
   ingen_nyckel`.
7. **Övergången syns bara en gång.** Faller ett utskick får bevakaren inget nytt
   försök förrän varan tagit slut och kommit tillbaka. `restockEjSkickade` i
   Aosom-synkens loggrad ska därför vara noll.

⚠️ **Bevakare vars vara redan finns i lager får inget mejl.** De missade
återkomsten, till exempel för att den skedde innan det här fanns. Adminsidan
säger det på raden.

**Provkörningen** (workflowen **"Restock — provkör sidans cache och mejlet"** →
`/api/admin/restock-prov` → `lib/restock/prov.ts`). `ADMIN_SECRET` finns i två
Vercel-projekt, butiken och motorn, och värdet går inte att läsa tillbaka i
något av dem. Läget `sidan` tömmer en produktsidas cache med samma anrop som före
ett mejl och svarar med butikens statuskod: 200 betyder att värdena är lika, 404
att butikens proxy avvisade nyckeln, och `ingen_nyckel` att den saknas i motorn.
Läget `mejl` skickar restock-mejlet med `[Prov]` i ämnesraden till den interna
larmadressen (samma som vaktens morgonmejl) genom `mejlaBevakare`, utan att röra
en bevakare. Ingen nyckel och ingen adress når loggen.

## Dubblett-spärr vid import

**Båda** importvägarna vägrar nu importera en AliExpress-listning som redan finns,
med `supplierProductId` som nyckel:

- Bulk/CSV: `lib/bulk-import/worker.ts → scrapeAndDedupe` — hoppar över raden.
- Extension: `app/api/import/route.ts` — svarar **409** med den befintliga
  produktens `wixProductId`. Skicka `allowDuplicate: true` för att medvetet
  importera ändå (t.ex. när produkten raderats men mappningsraden blivit kvar).

Båda är **fail-open**: ett trasigt mappnings-uppslag blockerar aldrig en i övrigt
giltig import. `/api/check-duplicate` (pHash + titel, `lib/import/duplicate-check.ts`)
finns kvar som en *rådgivande* varning i tillägget och fångar dessutom det spärren
inte kan se: samma fysiska produkt såld under en **annan** listning. Den varningen
går att klicka förbi — så den ersätter inte spärren, den kompletterar den.

## Varianter får inte dela inköpspris utan täckning

Tilläggets DOM-fallback sätter sidans **synliga** pris på alla varianter när den
inte kommer åt per-SKU-datan. Leonards rapport 2026-08-20: ett 4-pack och ett
6-pack båda 589 kr, två spegelstorlekar båda 1279 kr — den dyra varianten såldes
till den billigas pris. Tre lager täcker det nu, och de gör olika saker:

1. **Spärren** (`lib/import/price-trust.ts`, i pipelinen). Flaggar **precis** när
   båda gäller: fler än en variant delar exakt samma inköpspris **och** vi saknar
   per-SKU-data bakom dem. Produkten hålls som utkast med `priceUnverified` +
   badge i `/admin/queue`. Att alla varianter kostar lika mycket är i sig
   fullkomligt normalt (färgvarianter gör nästan alltid det) — det är *obekräftat*
   delat pris som är defekten. Spärren gissar aldrig fram ett pris.
2. **DS-räddningen i tillägget** (`extension/background.js → dsRescueVariants`,
   0.1.41). Utlöses på `dom-`-varianter i både agent- och bulkvägen. `idx-`
   räknas **medvetet inte** — de bär redan korrekta per-variant-priser, bara
   id:t saknades. Räddningen tömmer `swatchImages`; den bygger dem **inte** om
   (DS:s `imageUrl` är per SKU, inte per värde). Servern äger ombyggnaden.
3. **Efterhands-reparationen** (`lib/import/price-repair.ts` +
   `/api/cron/price-repair`) för produkter som redan ligger felprissatta.

### Så körs reparationen

GitHub Actions-workflowen **"Priser — rätta varianter som delar inköpspris"**,
samma nyckel-lösa upplägg som recensionsöversättningen (produktionen har
Wix-nycklarna, Actions har `CRON_SECRET`).

| Läge | Vad som händer |
|---|---|
| `scan` | Torrkörning. Skriver ingenting. Planen läggs i `tools/price-repair/scan-latest.json` |
| `apply` | Skriver — **bara** för de `wixProductIds` du räknar upp |

Det finns **ingen "kör allt"-flagga** i apply-läget. Listan med id:n är
kvitteringen på att en människa läst planen; ett pris som når kund ska ha
passerat ögon. Kopiera fältet `wixProductIds` ur scan-svaret.

**Tre fält skrivs per rättad variant, aldrig bara det första:** `grossSek` (Wix),
`costUsd` och `landedCostSek` (mappningen). Det sista är lätt att glömma och
värst att missa — lönsamhetsöversikten och **auktionens golvbud**
(`lib/auction/seed.ts → netSupplierCost`) läser båda det fältet, så rättas bara
priset ser marginalen fantastisk ut och auktionen kan sälja under inköp.

Fyra egenskaper som inte ska tas bort:

- **Oförändrat inköpspris → varianten rörs inte alls.** Blast-radien blir exakt
  defekten, och det är också vad som gör en bred kandidatsökning ofarlig: säger
  DS att priserna verkligen är lika blir planen tom.
- **Bara matchning på skuId.** Värdesignatur-matchning (`mapping-repair.ts`) är
  en gissning, och en felgissning här skriver ett pris till kund. Syntetiska id
  rapporteras omatchade — kör mappnings-reparationen i `/admin/mappings` först.
- **Marginalgolv + tak på prisändring** blockerar HELA produkten, aldrig bara en
  variant. Ett halvrättat pris är svårare att upptäcka än ett helt orört.
- **Wix skrivs före mappningen.** Går bara den ena igenom står kunden inför rätt
  pris medan bokföringen är gammal (nästa körning rättar det). Omvänd ordning
  hade gjort mappningen "rättad" medan kunden köper till fel pris — och då
  hittar ingen felet igen.

Rutten varnar också när prisreglerna hunnit ändras sedan importen: de rättade
varianterna får dagens påslag medan de orörda behåller sitt. Vill du ha ett
enhetligt påslag är omimport rätt väg, inte reparationen.

## Lagerlandet är en del av SKU:n — och lagret tar slut per land

AliExpress bakar in lagerlandet i själva SKU:n: "rosa garderob från Tyskland"
och "…från Spanien" är olika SKU:er med **olika saldo och olika pris**. Vid
import sparas EN av dem (`collapseShipFromAxis`, `lib/import/ship-axis.ts` —
lagret är aldrig ett kundval). Synken speglade sedan just den SKU:ns saldo till
Wix, så när vårt lager tog slut blev varan slutsåld i butiken trots att
säljaren hade dussintals kvar i ett annat EU-land (Leonards rapport 2026-08-20).

`lib/sync/warehouse-failover.ts` (steg 3.6 i `checkOne`) **pekar om mappningen**
till ett syskonlager i stället. Att bara visa syskonets saldo hade varit fel —
kundordern läggs på den sparade SKU:n, så en uppblåst siffra hade bara flyttat
felet till kassan. Körs före lagerskrivningen, så bytet slår igenom i samma
körning.

### Två landslistor, och de svarar på olika frågor

Det här är den vanligaste förväxlingen i kodbasen, och den kostade pengar tyst:

| Funktion | Frågan den svarar på | GB/NO |
|---|---|---|
| `isEuCountry` | "kommer paketet fram snabbt?" | **ingår** |
| `isEuCustomsUnion` | "kan vi köpa in därifrån utan tull?" | **ingår inte** |

**Regeln:** allt som **väljer ett lager att köpa från** använder
`isEuCustomsUnion` (`EU_CUSTOMS_UNION` i `lib/aliexpress/eu-countries.ts`). Allt
som beskriver **leveranstid för kunden** — EU-lager-ribbonen, discover-filtret,
`warehouseClass`, badgarna i tillägget — använder `isEuCountry`.

Leonard fångade förväxlingen 2026-08-21 på SucceBuy-klädstället
(1005005972133031): tilläggets "EU-först" bockade i GB-rader åt honom, och
`pickWarehouse` rankade dem lika bra som spanska. Storbritannien lämnade
tullunionen — tulldeklaration och importmoms, kostnader som aldrig syns i
marginalen. Lagerbytet vid slutsålt filtrerade redan rätt; det var **importen**
som valde fel. Nu läser alla tre lagervalen samma lista:
`ship-axis.ts → pickWarehouse`, `mapping-repair.ts → pickPreferred` /
`sortByWarehousePreference`, och `warehouse-failover.ts`.

Tillägget bär en egen kopia (`EU_TULL_CODES` i `extension/eu-countries.js` —
browser-global kan inte importera TS). Ett test i
`lib/aliexpress/eu-countries.test.ts` fäller om de glider isär, samma lärdom som
`SHIP_AXIS_RE`, som drev isär två gånger på två veckor.

I popupen **döljs** rader utanför tullunionen helt — men bara när det finns ett
alternativ inom den. Utan den brasklappen hade varenda Kina-produkt blivit
oimporterbar. Dolda rader bockas alltid av samtidigt: en dold rad som ändå följer
med i importen vore värre än en rad för mycket.

Tre spärrar, och de ska inte tas bort:

1. **Bara EU:s tullunion.** Ett USA-lager kan ha 500 i saldo, men mot en svensk
   kund betyder det tull och veckor i transit. Se tabellen ovan — `isEuCountry`
   duger inte här.
2. **Bara med känt pris.** Priset skiljer mellan lagren ($113,74 från USA mot
   $119,99 inom EU i Leonards fall). Utan det nya priset står `landedCostSek`
   kvar på det gamla och då ljuger både lönsamhetsöversikten och auktionens
   golvpris (`lib/auction/seed.ts` räknar sitt lägsta bud ur det fältet).
   Bytet räknar om `costUsd` + `landedCostSek` proportionellt.
3. **Bara om marginalen håller** (`MIN_FAILOVER_MARGIN_PCT`, netto mot netto).
   Att sälja med förlust är ett sämre utfall än att vara slutsåld en vecka.
   Avstådda byten loggas — de är ett beslut för en människa.

Besläktad, men med annan utlösare: `lib/sync/shippability.ts` byter lager när
frakt-API:t svarar NEJ för vår SKU. Den här byter när lagret är TOMT. Båda
använder `warehouseAlternativeSkuIds` och sätter `previousSupplierVariantId` +
`shipFromSwitchedAt`.

**Inte byggt:** fallback vid själva orderläggningen. AE:s felkod för slut i
lager finns inte dokumenterad någonstans i repot, och att gissa på en
sträng-matchning i `place-order.ts` riskerar dubbelbeställning. Synk-bytet
täcker det normala fallet; kvar är kapplöpningen där lagret tömts mellan
synk och order.

## En död listning FELAR INTE — den svarar 200 med fruset lager

Hela synkens borttagnings-klassificering byggde på att en försvunnen listning
får `getProduct` att **kasta** ("not found", "product offline", kod 7001xxx).
Det stämmer inte alltid. Tar säljaren ner varan svarar `aliexpress.ds.product.get`
ofta **200 OK med full kropp** och SKU-rader vars saldo står kvar **fruset på
sista kända värdet** — medan konsumentsidan säger *"Sorry, this item is no
longer available!"*.

För anroparen var det svaret omöjligt att skilja från en levande produkt. Det
föll igenom till gren 3 i `decideSyncOutcome` ("Listningen är aktiv") och synken
**skrev tillbaka lagret varje körning**. Leonards rapport 2026-08-24: Homcom-
borden (Aosom ES) hade lagersaldo hos oss och såldes, men gick inte att beställa
hos AE. Vi upptäckte det bara för att en kund gjorde det.

Beskedet fanns i basinfon hela tiden — ingen läste det:

| Fält i `ae_item_base_info_dto` | AE:s egen beskrivning |
|---|---|
| `product_status_type` | hyllstatus, `onSelling` = ligger uppe |
| `ws_display` | "reasons for removal of goods", t.ex. `expire_offline` |
| `ws_offline_date` | "the date the product was removed from the shelf", `0` = uppe |

`classifyListingAvailability` (`lib/aliexpress/client.ts`) tolkar dem till
`on_selling` / `offline` / `unknown`, och synken kastar `ListingOfflineError`
som går in i **samma** `removedStreak`-mekanik som ett kastat "not found".

Fyra egenskaper som inte ska tas bort:

- **`onSelling` vinner över ett satt `ws_offline_date`.** Fältet är ett datum
  för *en* nedtagning, inte nödvändigtvis den nuvarande — en gammal nedtagning
  på en återupplagd vara får aldrig nolla ett levande lager.
- **Saknad status → `unknown`, aldrig `offline`.** Tomt fält är ingen bevisning,
  och domen nollar lager. `unknown` beter sig exakt som före fältet fanns.
- **Egen felklass, inte en matchbar text.** Samma lärdom som
  `isDeliveryMethodMissing`: en klassificering som hänger på ordval går sönder
  tyst när någon skriver om meddelandet.
- **Två strikes, och sidan avpubliceras inte.** Ärver `REMOVED_STRIKES_REQUIRED`
  och SEO-beslutet från 2026-08-09 — lagret nollas, sidan ligger kvar, och en
  senare `onSelling`-läsning återställer produkten av sig själv.

### Var hyllstatusen gatas (audit 2026-08-24)

Detektionen i synken var bara ett av hålen. Samma verdikt läses nu i varje väg
där en död listning annars kunde nå kunden:

| Väg | Fil | Vad som händer vid `offline` |
|---|---|---|
| Dagliga synken | `sync/aliexpress-sync.ts` | `ListingOfflineError` → `removedStreak` → lagret nollas |
| Andra synkvägen | `api/aliexpress/sync-all` | lagret nollas direkt (rutten har inget strike-state) |
| Extension-import | `api/import` | 422 `listing_offline`, efter dubblettspärren |
| Bulk-/CSV-import | `import/from-url.ts` | kastar → raden failar synligt i bulk-kön |
| Discover-import | `admin/discover/actions.ts` | vägrar (går förbi /api/import:s guards) |
| Säljarbevakningen | `discover/supplier-watch.ts` | `listing_offline`-reject före enqueue |
| Alternativ-förslag | `aliexpress/alternatives.ts` | sållas bort före cache OCH vid cache-läsning |
| Leverantörsbyte | `admin/actions.ts` | vägrar — annars beställs ordern mot en död listning |
| Tilläggets produktdata | `api/aliexpress/product` | `inStock: false` |

`getInventory` returnerar sedan dess ett **objekt** med `listingAvailability`,
inte en naken array. Formen är vald med flit: funktionen anropade `getProduct`
och projicerade bort statusen, så varje konsument var blind *by construction*.
Nu är det ett typfel att glömma den, inte en tyst regression.

Genomgående regel: bara ett **uttryckligt** `"offline"` fäller. `"unknown"`
beter sig exakt som före fältet fanns.

### ☠️ Token-förnyelsen hoppade över i 30 dygn och lät token dö (2026-08-29)

Hittad direkt efter att fan-out-fixen ovan gjort synken körbar igen: den kom
igång, och fick **99 fel av 106 försök**, alla
`IllegalAccessToken — The specified access token is invalid or expired`.

Tokenraden berättade allt: `updatedAt 2026-07-30`, `expiresAt 2026-08-29T02:37`.
Den hade alltså inte förnyats på **30 dygn**, och dog i natt.

Felet är en storleksordning, inte en bugg i logiken:

| | |
|---|---|
| Workflowen kör | **var 12:e timme** |
| Rutten hoppade över om det fanns mer än | **2 timmar** kvar |

En körning måste alltså råka landa i de SISTA två timmarna för att förnya något
alls — chansen är 2/12. Fyra gånger av fem hinner token dö emellan. Så gick det
till: körningen 21:53 såg 4,7 h kvar och hoppade över, token dog 02:37, nästa
körning låg 09:53.

☠️ **Och workflowen rapporterade `success` hela vägen.** Den kollar bara
HTTP-statusen, och ett "hoppade över" ÄR 200. Sjätte gången samma lärdom.

Kommentaren vid konstanten påstod dessutom att access_token lever "~48h". Mätt:
**30 dygn**. Livstiden spelar dock ingen roll för buggen — schemat gör det.

**Regeln: skip-fönstret måste rymma minst två schemalagda körningar.** Det är
nu `24 h` mot ett 12-timmarsschema. Ändras schemat måste talet följa med.

⚠️ **Priset var högre än en utebliven synk.** Eftersom `refreshAndPersist`
ROTERAR refresh-token vid varje förnyelse höll 30 dygn utan en enda förnyelse
även *refresh*-token att åldras ut:

```
IllegalRefreshToken: The specified refresh token is invalid or expired
```

Den läker INTE av sig själv. Enda vägen tillbaka är ny OAuth för hand:
öppna **`/api/aliexpress/auth`** i en webbläsare, godkänn hos AliExpress, klart
(callbacken sparar de nya tokens). Rutten kräver ingen hemlighet.

Morgonmejlet larmar sedan dess på utgången token, och varnar när mindre än
ETT schemaintervall (12 h) återstår — då har den automatiska förnyelsen redan
haft minst ett försök och missat, alltså är något verkligt fel. Ett tidigare
utkast varnade vid 48 h; det hade gett en varningsrad varje månad i det
NORMALA förloppet, strax innan token förnyade sig själv, och en varning man
lär sig ignorera är värre än ingen alls.

Invarianten är dessutom testad mot verkligheten: `route.test.ts` läser
cron-raden ur `refresh-tokens.yml` och fäller om tröskeln inte rymmer två
körningar. Ändras schemat fäller testet i stället för produktionen.

### Vid felsökning: kolla i den här ordningen

1. **`SYNC_DRY_RUN`.** Default är `"true"` — allt som INTE är strängen `"false"`
   betyder att cronen läser, loggar och mejlar men **aldrig skriver till Wix**.
   Fraktbarhetskontrollen (steg 3.5) hoppas då över helt. Ett tyst dry-run ger
   exakt samma symtom över hela katalogen.
2. **Råsvaret för produkten:** `/api/admin/freight-check?...&raw=1`
   (`debugRawProductGet`). Läs `product_status_type` + per-SKU-lagret. Där ser
   du om AE kastar eller svarar 200 med fruset saldo.
3. **Tidsfönstret.** Även när allt fungerar är kedjan långsam med flit: sync var
   4:e timme, två strikes i rad innan lagret nollas, och fraktbarhetsnejet
   kräver två bekräftelser med ett dygns spridning (`NEGATIVE_MIN_SPAN_MS`).

### Strikes räknas per NÅDD produkt — inte per körning

Det här är den lätta missläsningen, och den kostade tre dygn per död listning.
`REMOVED_STRIKES_REQUIRED = 2` ser ut att betyda "två körningar", alltså åtta
timmar. Men `removedStreak` ökar bara när produkten faktiskt **nås** i loopen,
och sorteringen (äldsta `lastCheckedAt` först) lade en just nådd produkt **sist
i kön**. Två strikes låg därför en hel ROTATION isär:

| Väg | Reaches | Verklig tid |
|---|---|---|
| Bestseller / nyss köpt (`priority=high`) | 2 | ~8 h |
| Normal produkt, DS säger `offline` | 2 | ~72 h |
| Normal produkt, döden syns som oklassat fel | 6 | 9–17 dygn |

> En tidigare version av det här stycket påstod "ett dygn … är förväntat".
> Det gällde bara `priority=high`. Rättat 2026-08-24.

`orderForRotation` (`aliexpress-sync.ts`) ger därför produkter med **öppen
strike-serie** förtur i nästa körning, med tak `OPEN_STREAK_PRIORITY_CAP = 30`
så en masshändelse inte svälter rotationen. `errorStreak` ger medvetet INTE
förtur — den stiger för hela katalogen samtidigt vid AE-driftstörning.

**Cronen går varannan timme sedan 2026-08-25** (`0 */2 * * *`). Tillsammans med
förturen ovan ligger två strikes nu ~2 h isär i stället för en hel rotation, och
tiden till FÖRSTA observationen halveras (~20 h i stället för ~40 vid 980
mappningar).

Priset är att bevisen ligger tätare: en AE-driftstörning som varar över två
timmar kan nu hinna ge två strikes där den förut gav en. Utfallet är dock
begränsat och självläkande — lagret nollas, sidan ligger kvar publicerad,
produkten syns i `/admin/sync-alerts`, och en senare `onSelling`-läsning
återställer den. Avvägningen är medveten: att vara oköpbar några timmar är ett
billigare fel än att sälja något som inte går att beställa.

### Ett tyst dry-run är det farligaste läget

`SYNC_DRY_RUN` är default `"true"`, och i dry-run **fryses strike-fälten**
(`removedStreak`, `zeroStreak`, `errorStreak`). En permanent torrkörande cron
kan alltså aldrig nå strike 2 — ens i principen. Morgonmejlet kunde inte se
det (rollupen läste aldrig `dryRun`, digesten filtrerar bort `dry_run`-rader),
så resultatet blev "✅ allt rullar" medan butiken var oskyddad. Rollupen räknar
nu torrkörningar och statusraden säger det rakt ut.

**Fortfarande inte byggt:**

- **Tillgänglighetskoll vid orderläggningen.** `place-order.ts` hämtar produkten
  för prisvakten och fraktvalet men tittar varken på lager eller hyllstatus.
  Kapplöpningen mellan synk och order är öppen. Medvetet nedprioriterad
  2026-08-24: målet är att felet aldrig ska nå kassan.
- **Synk-livlighet i `health-check`.** Den pingar bara Wix Stores och märker
  aldrig att synken slutat köra. Övervägt 2026-08-24 men utelämnat: routen har
  EN `consecutiveFails`-räknare och EN larm-strypning, så en Wix-utage och en
  stannad synk hade delat tillstånd och larm. Kräver egen state-nyckel.
  Morgonmejlet larmar däremot sedan 2026-08-28 (se nästa avsnitt) — det är
  billigare och räckte för att fånga fallet.

### ☠️ Synken låg nere i 57 timmar och ingenting sa till (2026-08-28)

Hittad i en audit, inte av ett larm. Sista lyckade körningen var
**2026-08-26 kl 10:03**; därefter svarade `/api/cron/aliexpress-sync` **500 vid
varje körning** — 28 körningar i rad. Lager och priser för hela AE-katalogen
stod stilla, och slutsålda eller nedtagna produkter förblev köpbara.

Orsaken var en **obegränsad fan-out** i `runDailySync`: synk-tillståndet lästes
med `Promise.all(mappings.map(...))`, alltså EN Wix-läsning per produkt, alla
avfyrade i samma ögonblick. Det höll på 980 produkter och slutade hålla utan att
någon rörde koden — och Aosom-importen tog sedan talet till **5 423 samtidiga
anrop**.

☠️ **Bomben exploderade när katalogen växte, inte när koden ändrades.** Sista
commiten före haveriet låg ett dygn tidigare, och samma kod gick igenom fyra
lyckade körningar samma morgon. Det finns ingen commit att skylla på, och en
`git bisect` hade inte hittat något.

Det var dessutom **osynligt i alla tre spåren**, vilket är det som gjorde 57
timmar möjliga:

| spår | vad det visade |
|---|---|
| Vercel-loggen | `GET /api/cron/aliexpress-sync 500` — **noll** loggrader |
| `FyndplatsAudit` | ingen `aliexpress-sync-fatal`-rad alls |
| Morgonmejlet | *"Synken: 0 körningar, 0 produkter kollade"* i grå statusremsa |

Fatal-raden saknades för att lambdan **dog** av fan-outen — ruttens `catch`
hann aldrig köra. Ett `try/catch` skyddar bara mot fel som kastas, inte mot en
process som tar slut.

Två lagningar, och båda behövs:

1. **`mapWithConcurrency`** (`lib/concurrency.ts`, default 8, env
   `SYNC_STATE_READ_CONCURRENCY`). Rader loopen ändå hoppar över kostar
   dessutom ingen läsning alls — Aosom-raderna var 4 419 av 5 423, alltså
   merparten av fan-outen. Hjälparen låg tidigare som en privat kopia i
   `eu-discover.ts`; den är flyttad hit i stället för klonad, av samma skäl som
   `SHIP_AXIS_RE` och `EU_TULL_CODES` — tvillingar glider isär.
2. **Noll körningar får en egen larmrad i morgonmejlet** (`guard.ts`), före
   torrkörningsraden: har den inte kört spelar skrivläget ingen roll. Tre
   tester låser det.

☠️ Regeln, femte gången: **ett misslyckande som ingen kan se är värre än ett
som skriker.** Och den nya, som är dyrare: **en obegränsad fan-out skalar med
katalogen — den är en tidsinställd bomb, inte en bugg.** Leta efter
`Promise.all` över något som växer.

## ☠️ Orderpipelinen hade EN väg in, och inget nät under (2026-08-31)

`/admin` läser **bara `store.listTasks()`** — den tittar aldrig på Wix-ordrar.
Enda vägen dit är webhooken `/api/wix-order`. Går den skrivningen fel är ordern
borta för oss medan kunden har betalat, och Wix ger upp efter ett fåtal retries.

Det inträffade. Order 10024, betald 09:27, syntes aldrig i admin. Webhooken kom
fram tre gånger och svarade 500 varje gång:

```
WDE0195: Items limit exceeded. Delete some items and try again.
```

Wix Datas **radtak** var nått. Tre saker gjorde det värre än en tappad order:

1. **Taket stoppar bara NYA rader.** Uppmätt: en `save` mot en befintlig rad
   svarar `"action":"UPDATED"` och går igenom; en ny rad avvisas. Lagersynken
   uppdaterar befintliga mappningar och såg därför fullt frisk ut hela tiden.
2. **Det hade pågått i ett dygn.** Nyaste audit-raden var 2026-08-30 12:25 —
   `aliexpress-sync` hade fällts på `WDE0195` vid varje körning sedan dess (11
   gånger på ett dygn, mätt i Vercel-loggen). Ingen märkte det, eftersom felet
   bara syns som en 500 i en cron ingen läser.
3. **Vakten SÅG det men gjorde ingenting.** `buildGuardFindings.missingTasks`
   räknar precis "betald order utan task" — men rapporterade dem bara i
   morgonmejlet, en gång per dygn. Ordern hade nått Leonard 19 timmar senare.

### `/api/cron/order-backfill` är nätet (`lib/orders/backfill.ts`)

Kör varje timme. Läser Wix-ordrar, jämför mot tasks, skapar det som saknas via
**samma `deriveTasks` som webhooken** — ingen egen tolkning av orderformen, av
samma skäl som `SHIP_AXIS_RE` och `EU_TULL_CODES` ska ha en enda definition.
Urvalet importerar `ACTIONABLE_PAYMENT` och `TASK_GRACE_MS` från vakten, så
återhämtningen och larmet aldrig kan bli oense om vad "tappad order" betyder.

Fyra egenskaper som inte ska tas bort:

1. **Skarp som default**, tvärtemot husets övriga cron-rutter. De andra SKRIVER
   något nytt till kunden och ska be om lov; den här ÅTERSTÄLLER en order kunden
   redan betalat för, och att avstå är det farliga utfallet.
2. ☠️ **Ordens FAKTISKA ålder bärs vidare.** `deriveTasks` stämplar `createdAt`
   med NU — rätt i webhooken, fel här: en order från i förrgår hade fått åldern
   noll och vaktens påminnelser hade börjat om från början. Ett test låser det,
   verifierat genom att återinföra buggen.
3. **Respiten gäller.** En order yngre än `TASK_GRACE_MS` rörs inte — vi ska
   inte tävla med webhooken om en färsk order.
4. **Ett fel fäller inte resten.** Nästa order kan vara den som går att rädda.

Rutten är idempotent (`createTaskIfAbsent` skriver aldrig över) så den är gratis
att köra ofta och ofarlig att köra om.

### Larmet går via mejl, för det är den enda kanal som fungerar

Nätet ovan gick i väggen på exakt samma sak som webhooken: `createTaskIfAbsent`
kastade `WDE0195`, felet fångades per order, lades i `errors` — och rutten
svarade 200. Ett nät som kan misslyckas tyst är inget nät.

☠️ **När task-skrivningen faller är varje annan kanal blockerad av samma vägg.**
Audit-raden är också en ny rad. Vaktens fynd hamnar i morgonmejlet först nästa
dygn (19 timmar för 10024). Admin-listan läser bara tasks, och det är tasken som
saknas. Nästa körnings andra försök faller likadant. Resend rör inte Wix, och är
därför enda vägen ut ur en full databas.

`buildStuckOrdersEmail` bär därför allt som behövs för att expediera ordern för
hand — ordernummer, kund, artikel med SKU och antal, orsaken ordagrant. Mejlet
upprepas varje timme så länge ordern sitter fast; en betald order som inte kan
expedieras SKA tjata, och tjatet upphör av sig självt när skrivningen går
igenom. **Bara raderna som inte hann skrivas listas** — annars beställer man om
en rad som redan ligger i `/admin` och kunden får två paket.

### En manuellt lagd AliExpress-order är osynlig tills numret kopplas (2026-09-01)

Order 10025: lagd för hand i AliExpress konsumentkassa (kampanj/kupong
billigare än DS-API:t), skickad från Polen kl 15:53 — och tasken stod kvar på
`pending` i sexton timmar medan kunden väntade på sitt mejl. Motorn kan inte
hämta spårning för en order den inte vet finns, och vakten säger inget om
`pending` förrän efter 24 timmar. Mätt:

```
poll-tracking:  {"checked":0,"shipped":0,"stillWaiting":0,"heldForReview":0,"errors":[]}
order-guard:    missingTasks:0  placeOrderReminders:0
Wix 10025:      NOT_FULFILLED
```

Tasken fanns, ingen task var `ordered`. Kopplingen fanns bara som knapp bakom
admin-inloggningen. Logiken bor nu i `lib/orders/link-ae-order.ts` och nås från
två håll: samma knapp i `/admin`, och `POST /api/admin/link-ae-order` med
`CRON_SECRET` → workflowen **"Order — koppla manuell AliExpress-order"** tar
butikens ordernummer + AE:s "Ref. Number" (inte spårningsnumret) och går att
köra från en telefon. Efter kopplingen är ordern exakt lika automatisk som en
API-order: kopplingen 21:55 → poll-tracking 21:58 `shipped:1` → Wix-fulfillment
→ butikens "Ditt paket är skickat!" med Resend-id 21:58:07.

Två egenskaper som inte ska tas bort:

1. **Flera kopplingsbara rader på samma order → vägra och lista dem.** Att
   gissa hade kopplat fel AE-order till fel rad, och poll-tracking hade sedan
   skeppat fel artikel med rätt spårningsnummer.
2. ☠️ **Skrivningen läses tillbaka.** `updateTask` är en tyst no-op på en saknad
   rad i alla tre backends. Ett test simulerar en backend vars `updateTask` inte
   gör något: rutten svarar fel, och ingen audit-rad skrivs.

### Faktura och kvitto: våra egna, inte Wix (2026-10-09)

Leonard: *"när vi godkänner skickas vår egen mall ut och inget från wix"* och
*"allt ska vårt eget"*. Första fallet var order 10079, en företagsorder som lades
upp för hand i Wix och betalas mot faktura.

Wix automationer **"Send invoice to customer"** och **"Send a receipt email"**
är avstängda (INACTIVE, kontrollerat med en fråga efteråt). Wix egen
orderbekräftelse till köparen var redan avstängd, och butikens egen
bekräftelse gick ut för 10079. Skicka alltså aldrig en faktura från Wix
fakturaverktyg: kunden får ingenting.

Motorn skickar i stället (`lib/orders/faktura.ts`, `faktura-pdf.ts`,
`faktura-kor.ts`):

| när | vad |
|---|---|
| en handlagd order (`BACKOFFICE_MERCHANT`) godkänns obetald | fakturan, mejl i kundomslaget med PDF |
| ordern markeras betald i Wix | kvittot, mejl med PDF, inom en timme |

Webhooken skickar fakturan direkt. Timcronen `/api/cron/faktura` (`10 * * * *`)
tar det webhooken missade och kvittot, eftersom Wix inte skickar någon
betalningshändelse till motorn. Workflowen **"Faktura — skicka, prova och
ställ in"**: `plan` · `skicka` · `prov` (till den interna larmadressen, med
[Prov]) · `installningar`.

Sex egenskaper som inte ska tas bort:

1. ☠️ **Ingen faktura utan betalningsuppgift.** Vart pengarna ska står i
   `FyndplatsAppConfig` (`fakturaBetalaTill`, `fakturaFSkatt`, `fakturaDagar`),
   satt med `installningar`. Saknas den väntar ordern
   (`vantarPaBetalningsuppgifter`) och nästa körning skickar.
2. ☠️ **Beloppen stäms av mot Wix.** Raderna och momsen räknas i öre och
   jämförs med orderns `priceSummary`. Mer än en krona fel ger ingen faktura.
   Bara SEK och priser inklusive moms.
3. ☠️ **Raden i `faktura_utskick` tas FÖRE utskicket** och släpps om det
   faller. Wix skickar `approved` två gånger (10079: en minut isär), och
   webhooken och cronen kan se samma order. Ett utskick utan Resend-id räknas
   som fallet.
4. **Kvittot kräver att fakturan gick härifrån.** Fakturadatumet läses ur
   loggen, så kvittot visar samma datum som fakturan.
5. **`FAKTURA_FRAN` (2026-10-09).** Äldre handlagda ordrar rörs inte.
6. ☠️ **Svaret bär bara ordernummer**, aldrig kundens namn, e-post eller adress.

Fakturanumret är ordernumret. Kundens org.nr och referens läses ur
ordernoteringen ("org.nr 556000-0000. Referens: Anna Andersson"), så skriv dem
där när ordern läggs upp. Referensen läses fram till första punkten, så ett
inköpsordernummer skrivs efter namnet med komma: "Referens: Anna Andersson,
PO-123".

Fakturan och kvittot anger valutakoden SEK (`VALUTA`, sedan 2026-10-14). En
företagskunds inköpsorder krävde valutakod på fakturan, och "kr" räknas inte
som en.

### Aosom-ordern har ingen automatik alls — den läggs OCH skeppas för hand

AliExpress sköter sig självt: `place-order` lägger ordern, `poll-tracking` hämtar
spårningen var 15:e minut, Wix-fulfillment skapas, kunden får sitt mejl. Aosom har
inget API — `place-order.ts` **vägrar** en Aosom-mappning med flit
(`isAliExpressMapping`) och ordern läggs på `aosom.de/bulkordering` eller i deras
kassa.

Det lämnade en tyst lucka i motorn: ingenting kunde få veta att ordern var lagd, och
när Aosom skickar paketet fanns ingen väg alls att få ut spårningen till kunden.
Uppmätt på order 10026 (2026-09-02, Vinsetto-kontorsstolen): betald
14:57, lagd för hand samma kväll, och tasken hade blivit liggande som `pending`
medan vakten påminde om en order som redan var gjord.

`lib/orders/manual-fulfillment.ts` stänger båda halvorna, nåbar via
`/api/admin/manual-fulfillment` och workflowen **"Order — beställd eller skickad
för hand"**:

| läge | vad som händer |
|---|---|
| `bestalld` | tasken blir `ordered` — vakten slutar påminna, 5-dygnsklockan mot "beställd men inget spår" startar |
| `skickad` | Wix-fulfillment med spårningsnumret → butikens "Ditt paket är skickat!" + 17TRACK, tasken blir `shipped` |

Fem egenskaper som inte ska tas bort:

1. ☠️ **Referensen sparas i `supplierOrderRef`, ALDRIG i `aliexpressOrderId`.** Samma
   fel som `AliExpressProductId`-typen infördes för att göra omöjligt: AE-fältet läses
   som ett AE-id av poll-tracking, av cancel-task (som larmar om manuell
   AE-avbeställning) och av claim/cancel-CAS:en i alla tre backends.
2. ☠️ **F19-backstoppen gäller även den manuella vägen.** `poll-tracking` vägrar
   auto-skeppa en task flaggad `cancelMidOrder`/`refundFlagged`/`orderUncertain`; en
   manuell rutt som hoppar över samma grind vore hålet i nätet. Skeppningen är den
   oåterkalleliga handlingen — kundmejlet går inte att ta tillbaka.
3. ☠️ **En redan skeppad rad skeppas aldrig om.** En andra fulfillment är ett andra
   "ditt paket är skickat" till samma kund.
4. **Wix skrivs före tasken**, samma ordning och samma skäl som `price-repair`. Går
   bara den ena igenom har kunden fått sitt mejl medan böckerna släpar — det billiga
   felet. Omvänt hade tasken stått som `shipped` utan att någon fulfillment fanns.
5. **Flera rader på ordern → vägra och lista dem.** Regeln bor i
   `lib/orders/valj-task.ts` och delas med AE-kopplingen; att gissa hade skeppat fel
   artikel med rätt spårningsnummer.

`pending → shipped` går i ETT steg, men via statusmaskinen: har vi ett spårningsnummer
ÄR ordern lagd, och att vägra på en bokföringsteknikalitet medan paketet är i transit
är fel sorts fel.

**En artikel i flera paket: alla nummer i samma fält** (2026-10-17). Wix tar en
fulfillment per artikelantal, och en fulfillment utan rader nekas ("lineItems must not be
empty"). Order 10095, ett hantelset i två DPD-paket, får därför båda numren i samma
fält, i formen `tracking_number="01234567890123, 01234567890125"` (påhittade nummer). `shipManually` prövar varje nummer
för sig, skriver fältet med komma och mellanslag och vägrar över Wix gräns på 100
tecken. Spårlänken pekar på det första numret (`sparningsLank`). Butiken delar fältet
och skickar ett fraktmejl med alla nummer. ☠️ Delningsregeln står på två ställen,
`lib/tracking-link.ts` här och `lib/fraktmejl-rader.ts` på `headless-site`, och de
måste stämma: komma, semikolon och radbrytning, aldrig mellanslag.

⚠️ **Leveransnotisen ("levererat") bor i butiksrepot, grenen `headless-site`,**
och hade en egen lucka: 17TRACK registrerar bara nummer vars fraktbolag den
känner igen. Både 10023 och 10025 loggade *"carrier odetekterad, inget
format-mönster matchar — ingen push för detta paket"* — ingen push, aldrig ett
"levererat"-mejl. Sedan 2026-09-01 pollar butiken AliExpress-källan (vår
`/api/tracking-events`) varannan timme (`/api/cron/ae-delivery-poll`) och mejlar
genom samma sändare och samma dedup som pushen. Se `SMS-FORWARDING.md` på den
grenen. **Vår rutt är alltså en leveransberoende sedan dess** — går den sönder
uteblir inte bara spårningssidan utan också leveransmejlen för de paket 17TRACK
inte ser.

### ☠️ Ett fullt CMS gör importen till en dubblettfabrik

Ordningen i `lib/aosom/import-run.ts` är påtvingad: mappningen behöver
produktens Wix-id, så produkten skapas först. Faller mappningsskrivningen
däremellan är produkten **föräldralös** — den finns i butiken men syns inte för
lagersynken, prissynken, prisreparationen, bildreparationen eller
lönsamhetsöversikten, som alla itererar mappningar.

Värre: dubblettspärren nycklar på `supplierProductId` i MAPPNINGEN. Utan rad ser
nästa körning artikeln som ny och skapar en **ANDRA** produkt för samma vara —
precis den interna dubbletten som straffas. Och markören flyttas ändå (en trasig
rad får inte stoppa svepet), så ingen körning återkommer till den av sig själv.

Uppmätt 2026-08-31: nattens körning 04:40 skapade `3e6f2d24-e045-44ad-aed9-067030b01f46`
(ett tyskt utkast, `visible:false`) och föll sedan på postgränsen. Noll
mappningsrader pekar på den.

Luckan går inte att stänga genom att byta ordning. Det som går är att vägra
tappa bort den: `summary.orphans` namnger sku + wixProductId, och en
konsolrad skrivs (konsolen kräver ingen databas). `?sku=` kör om riktat när
orsaken är åtgärdad. **En automatisk radering av produkten är medvetet INTE
byggd** — det är en destruktiv åtgärd på något en människa ska titta på först.

⚠️ **Taket löstes senare — och den här radens förklaring var fel.** Den påstod
att "radantalet i Wix Data inte är det som binder", eftersom 18 091 raderade
audit-rader (22 977 → 4 886, verifierat) inte släppte blockeringen. Radantalet
ÄR det som binder. Taket är bara **globalt över alla kollektioner** och ligger på
**4 000**, så de ~18 800 rader som återstod var fortfarande 4,7× över. Städningen
var alltså inte otillräcklig av otur — ingen delmängd kunde räcka. Se nästa
avsnitt.

**Regeln: en pipeline med exakt en väg in behöver ett nät under sig.** Och den
gamla, åttonde gången: ett fel som bara syns som en 500 i en cron ingen läser
är ett fel ingen upptäcker.

## ☠️ Drift-datan bor i Postgres sedan 2026-08-31 — inte i Wix Data

Wix CMS slutade ta emot nya rader: *"You've reached your 4,000 items limit
across all collections."* Taket är **globalt över alla kollektioner** och stoppar
bara NYA rader — befintliga uppdateras som vanligt. Därför såg allt friskt ut
utåt medan order 10024 (betald 09:27) aldrig nådde `/admin`.

☠️ **Delvis städning ger exakt noll.** ~36 000 raderade rader (55 000 → 18 800)
flyttade inte blockeringen en millimeter, och kunde inte göra det: antingen är
man under 4 000 eller så är man blockerad. Ingen delmängd räcker — bara att
flytta ut hela drift-datan (18 800 → ~3 470) gör det.

Hela planen, mätningarna och auditen står i **`POSTGRES-MIGRATION.md`**.

### Var datan bor nu

| | |
|---|---|
| Backend-väljare | `STORE_BACKEND` — `memory` \| `wix-data` \| `postgres` |
| Produktion | **`postgres`** (växlad 2026-08-31) |
| Databas | Neon serverless Postgres, `DATABASE_URL` |
| Flyttade rader | **15 311** (11 tabeller, fem moduler) |
| Kvar i Wix Data | recensioner, auktioner, redirects + småposter |

De tre kollektioner butiken läser **direkt** ur Wix Data stannar där —
`FyndplatsImportedReviews`, `FyndplatsAuctions`, `FyndplatsRedirects`. Flyttas de
måste butiksrepot byggas om, och de frigör inte de rader som binder.

### Fem egenskaper som inte ska tas bort

1. ☠️ **`STORE_BACKEND` har exakt EN läsare** (`lib/store/backend.ts`). Ett
   källkodstest i `backend.test.ts` grep:ar efter `process.env.STORE_BACKEND`
   utanför den filen och fäller. Skälet är husets vanligaste bugg: tvillingar
   glider isär (`SHIP_AXIS_RE`, `EU_TULL_CODES`, `mapWithConcurrency`). En
   backend-väljare läst på sex ställen hade betytt sex olika svar på frågan
   "vilken databas skriver vi till?".
2. ☠️ **Kopieringen vägrar köra när backend redan är `postgres`.**
   `/api/admin/copy-to-postgres` svarar **409** i skarpt läge. Utan grinden hade
   en omkörning skrivit tillbaka Wix gamla rader över levande data — rutten
   läser från Wix och skriver till Postgres, och efter växlingen är Wix den
   föråldrade sidan. `?verify=1` går alltid igenom; den skriver ingenting.
3. ☠️ **Verifieringen jämför KANONISKT, inte ordagrant.** JSONB bevarar inte
   nyckelordning, så en rå `JSON.stringify`-jämförelse flaggade 10/10
   `.variants` och 10/10 `.shippingAddress` medan varje platt fält stämde.
   `lib/migration/kanonisk.ts` sorterar nycklar rekursivt — men behåller
   **array-ordningen**, som är betydelsebärande (varianter, bilder).
4. ☠️ **Ingen unik nyckel på `supplier_product_id`.** Ett första utkast hade
   det, och den skarpa kopieringen avvisade fyra legitima rader: katalogen
   stödjer medvetet dubbletter (`allowDuplicate: true`, båda spärrarna
   fail-open). **En databas som vägrar det applikationen medvetet stödjer är
   fel, hur tilltalande invarianten än ser ut.**
5. ☠️ **`queryAll` KASTAR i stället för att tyst kapa.** Den returnerade
   tidigare de första N raderna utan att säga något; efter `MAX_QUERY_ALL_ROWS`
   (10 000) kastar den. En halv katalog som ser komplett ut är samma klass av
   fel som `Promise.allSettled` i `media.ts` — och den här gången hade det
   betytt en kopia som saknade rader med grönt kvitto.

### Kopiering och verifiering körs från GitHub Actions

Workflowen **"Migrering — kopiera drift-datan till Postgres"**
(`copy-to-postgres.yml`), tre lägen: `torr` · `kopiera` · `verifiera`. Samma
nyckel-lösa upplägg som prisreparationen — produktionen har Wix-nycklarna och
`DATABASE_URL`, Actions har `CRON_SECRET`. Torrkörning är default; utan
`dryRun=false` skrivs ingenting. Rutten är markörbaserad (`cursor` → `?after=`)
av samma skäl som Aosom-svepet: en serverless-rutt har 300 sekunder.

Verifieringen är **asymmetrisk**: fler rader i Postgres än i Wix är OK (nya
skrivningar landar bara i Postgres nu, och Wix gallrar `sync_log`), färre fäller.
Den läser dessutom bara tabeller som står i kopielistan — därför finns
`tabeller.test.ts`, som läser källkoden i alla fem ägande moduler och fäller om
någon nämner en kollektion listan inte täcker. Det testet hittade
`FyndplatsAliExpressTokens`, som annars lämnats kvar med grönt kvitto.

Resultatet vid växlingen: **15 310 lästa / 15 310 skrivna**, alla radantal
stämmer, **noll fältavvikelser**.

### ☠️ Verifieringen fällde en halvtimme efter växlingen — och hade rätt fel

Körningen 22:06 gav rött på tre "avvikelser". Alla tre var frisk drift, och två
av dem är precis det kvitto migrationen behövde:

| tabell | vid växlingen | 22:06 | vad som hände |
|---|---:|---:|---|
| `sync_alerts` | 18 | **32** | synken skriver larm igen — samma skrivningar föll på `WDE0195` kl 04:00 |
| `audit` | 1 796 | 1 790 | synkens egen städning tog 7 rader äldre än 14 dygn |
| `sync_state` | — | 1 fält | `currentCostUsd` uppdaterad av 22:01-körningen |

Produkten i fältavvikelsen är `2861bf83-2976-45e1-a51e-75f4bf880be2` — **samma
rad som kl 04:00 loggade `Wix Data save FyndplatsAliExpressSyncAlerts (429):
WDE0195`.** Den fick sitt larm skrivet den här gången.

Felet låg i verifieringens premiss, inte i datan. Den frågar "speglar kopian
källan?" — en fråga som slutade vara meningsfull i samma sekund som produktionen
började skriva till Postgres. Wix är sedan dess **fruset** (taket blockerar nya
rader, och ingen kod skriver dit), så varje korrekt skrivning får sidorna att
glida isär. En verifiering som lyser rött varje gång driften är frisk lär man
sig att ignorera — samma argument som mot att varna vid 48 h på
token-förnyelsen.

Regeln bor nu i **`lib/migration/verdikt.ts`** och känner till båda lägena:

- **Före växlingen:** strikt. En enda saknad rad är dataförlust och fäller.
- **Efter växlingen:** bara **MASSFEL** fäller (`MASSFEL_ANDEL` 10 % **och**
  `MASSFEL_GOLV` 25 rader — båda krävs, så `webhook_events` med 16 rader inte
  fäller på en enda). Allt annat rapporteras som `drift`.

Båda trösklarna krävs med flit: andelen ensam fäller små tabeller på brus,
golvet ensamt låter en liten tabell tömmas till hälften. Samma spärr-form som
`MIN_FEED_RADER` och halvbildsspärren i media-cleanup — **skydda mot att allt
rasar, inte mot att en rad rör sig.** Elva tester låser talen, verifierade genom
att återinföra buggen: tre faller, och bara de tre.

### Wix-raderna är raderade sedan 2026-09-01 — taket är frigjort

Steg 6 är genomfört: **15 310 granskade, 15 310 raderade, noll fel**, alla
tretton kollektioner klara. Talet är exakt det kopieringen skrev vid växlingen.

Föregicks av ett dygns drift på Postgres med noll `error`-rader i Vercel (mot 12
dygnet före), samtliga cron-rutter körda och tre riktiga ordrar genom webhooken.

☠️ **Torrkörningen stoppade första försöket, och hade rätt.** 71 av 95
audit-rader och 50 av 100 sync_log-rader saknades i kopian — medan radantalen
såg friska ut (`sync_log` hade till och med ÖVERSKOTT). Orsaken var inte en
trasig kopia: synken städar de två tabellerna ur POSTGRES, Wix städas inte
längre av någon, så raderna var utgångna med flit. `beslutaSida` känner nu
skillnaden — en saknad rad får raderas bara om den är äldre än tabellens
retention-fönster, och talen ärvs från `lib/retention.ts`.

**Taket är mätt frigjort, inte uträknat.** Recensionskön kördes direkt efteråt
och skrev `2 köade` — två nya rader i `FyndplatsImportedReviews`, exakt den
skrivning som fallit på `WDE0195` tolv timmar tidigare.

**Marginalen mot taket, mätt 2026-09-01 22:05:** `FyndplatsImportedReviews`
2 514 + `FyndplatsAuctions` 797 + `FyndplatsRedirects` 40 + tre enradskollektioner
≈ **3 355 av 4 000**. Recensionerna är den enda som växer — 10 nya rader på sju
dygn — så ~650 rader räcker länge i normal drift. ☠️ **Men en bulk-backfill av
recensioner (`review-backfill`, `aosom-reviews`) kan äta marginalen på en
körning**, och då stoppas även auktioner och redirects. Räkna före en sådan.

☠️ **Vägen tillbaka är därmed stängd.** Fram till raderingen var rollback en
env-variabel; nu finns drift-datan bara i Postgres, och Neons
point-in-time-återställning är det som gäller. Raderingsrutten
(`/api/admin/radera-wix`) ligger kvar med sina spärrar men har inget kvar att
göra — en omkörning är en no-op.

### ☠️ Raderingen bröt SEO-poleringen — på fem ställen, inte ett

Poleringen körs av Claude i chatten och läste mappningsraden **direkt ur Wix
Data**. Steg 6 tömde den kollektionen, och därmed gick fem beröringspunkter
sönder samtidigt: Steg 3 (facit för pris, lager, EU-ribbon), Steg 4
(prisgrinden), Steg 6/11 (variantfacit), Steg 10 (kategoriförslag) och Steg 13
(stämpeln).

☠️ **Skrivningen var farligast, och den syntes inte.** Steg 13 gjorde
`POST /data/v2/items/save` med HELA raden. Mot en tömd kollektion **skapar** det
en ny rad: anropet rapporterar framgång, ingenting läser raden, produkten kommer
tillbaka i poleringskön för alltid och SKU-skrivningen tappas. En annan session
föreslog att "polera vidare utan prisgrinden" — det hade gått rakt in i den här
fällan, eftersom felet ligger i slutsteget och inte i grinden.

`/api/admin/mapping` ersätter båda vägarna (`lib/polish/mapping-access.ts`,
workflowen **"Polering — läs och stämpla mappningsraden"**). Fyra egenskaper som
inte ska tas bort:

1. ☠️ **Skrivningen är en ALLOWLIST, inte en helradsskrivning.** Poleringen äger
   tre fält: `needsAiPolish`, `draftStatus` och `variants[].sku`. Allt annat
   avvisas med 400 — det ignoreras inte tyst, för ett tyst ignorerat fält är
   exakt hur "svaret sa OK men inget hände" uppstår. Kostnads-, pris- och
   leverantörsfält går inte att röra härifrån.
2. ☠️ **Den skapar ALDRIG en rad.** Saknas mappningen svarar den 404. Det är
   hela skälet till att rutten finns: produkten är då föräldralös och ska
   granskas av en människa, inte poleras.
3. ☠️ **SKU matchas på `wixVariantId`, aldrig på position.** Två fält heter
   `sku` och betyder olika saker; den förväxlingen gjorde att prissynken skrev
   till ingenting i en månad. Positionsmatchning hade återinfört den.
4. **Prisgrinden räknas i rutten, inte i chatten**, ur samma `roundPrice` som
   prissättningen använder — så grinden kan inte drifta från regeln. Saknas
   underlaget svarar den `null` i stället för att gissa, och workflowen
   avslutar med `exit 1` på både `stammer: false` och `EJ AVGORBAR`.

#### ☠️ Grinden säger numera VARFÖR den faller — `slutsald` (2026-09-06)

Cordfåtöljen `1877cf83` fälldes med *"kostnaden har ändrats sedan importen och
priset i Wix är gammalt"*. Talen sa något annat:

```
landedCostSek 2404,4
forvantat     2899      ← 1,20 × 2404,4 = 2885,28 → charm99
faktiskt      2889      ← samma tal      → charm9
```

Båda härleds ur SAMMA kostnad. Kostnaden hade inte rört sig — det var
avrundningsstrategin som byttes 2026-09-03. Raden hade **saldo 0** och hade
fallit ur feeden, och då räknas priset aldrig om:

```ts
// lib/aosom/sync.ts, planeraProdukt
if (!row || opts.skipPrices || !variant) return plan;
```

`nyttSaldo` blir dessutom `null` när saldot redan är noll, så ingen skrivning
sker och `aosomSyncedAt` fryser (här: åtta dygn). **Prisgrinden kunde alltså
aldrig bli grön på den raden, hur länge man än väntade** — och felmeddelandet
skickade felsökningen åt fel håll.

`Prisgrind.slutsald` är tredje fältet i samma familj som `regelGäller` och
`prisLast`: grinden faller, men skälet är ett annat och ska sägas rakt ut.
Fyra egenskaper som inte ska tas bort:

1. ☠️ **Grenen ligger FÖRE `regelGäller`.** Annars vinner "kostnaden har
   ändrats" över det sanna skälet, vilket är hela buggen.
2. ☠️ **Bara ett uttryckligt `0` räknas.** `aosomSyncedQty` är optional och
   saknas på en rad som aldrig synkats; `undefined` är ingen bevisning om
   saldot, precis som en saknad hyllstatus blir `unknown` och aldrig
   `offline`. Ett `!qty` hade fällt varje nyimporterad produkt.
3. ⚠️ **Ett korrekt pris på en slutsåld rad fäller INTE jobbet** — bara en
   varning. En rad som försvinner ur feeden är enligt Aosoms egen guide ett
   lagerbesked, inte en utgången artikel, och sidan ska ligga kvar. Ett rött
   jobb på det hade varit samma falsklarm som `regelGäller` byggdes för.
4. ⚠️ **Fältet skiljer inte "borta ur feeden" från "finns kvar men slutsåld".**
   Båda ger saldo 0 och båda fryser stämpeln, och mappningsraden bär inget
   belägg för vilket det är. Meddelandet påstår därför bara det som går att
   veta. En grind som påstår mer än den vet är precis felet den ersätter.

⚠️ **Och saldot borde kollas FÖRE poleringen, inte fångas av en bieffekt.**
Prisgrinden hittade `1877cf83` av en slump — ingenting i arbetsgången frågar
"går varan att köpa?" innan en text skrivs. En sida för en vara ingen kan köpa
är slöseri i båda ändar, och kollen kostar ett Wix-anrop för en hel runda.

Fyra tester, verifierade genom att återinföra buggarna: `!qty` i stället för
`=== 0` fäller ett, en hårdkodad `false` fäller tre.

### ☠️ Och två fällor till i samma block (2026-09-02)

Hittade när ett e-postbrus skulle förklaras. Poleringsworkflowen mejlade
"Run failed" i tolv timmar; loggen sa två rader tidigare `OK: <id> uppdaterad`.

1. ☠️ **`jq` tillåter inte åäö i naken fältåtkomst.** `.okändaVariantIds` är
   ett SYNTAXFEL (`unexpected INVALID_CHARACTER`), inte ett tomt svar —
   grammatiken tillåter bara `[A-Za-z_][A-Za-z0-9_]*` efter punkten. Raden låg
   EFTER skrivningen, så varje stämpling gjorde sitt jobb och dog sedan på
   rapporteringen. Sexton lyckade körningar rapporterades som misslyckade.
   Övriga svenska fältnamn i filen var korrekt citerade, så det gick inte att
   se genom att läsa: nitton rader rätt och två fel ser likadana ut. Grinden är
   `lib/workflows/jq-syntax.test.ts`, som läser alla workflow-filer. Statisk
   kontroll och inte `jq -n` — en grind som hoppas över när binären saknas är
   ingen grind. **Rapportering efter en skrivning får dessutom aldrig fälla
   jobbet**; den är `|| true` nu.

2. ☠️ **GitHub ersätter ett TOMT workflow-input med dess `default`.**
   `needs_ai_polish` och `draft_status` hade defaulterna `false` och
   `published` medan beskrivningen sa "tomt = rör inte" — det läget gick alltså
   inte att uppnå, och en stämpling som bara ville skriva SKU:er PUBLICERADE
   produkten. Uppmätt: skickade `""` för båda, loggen visade `NEEDS_POLISH:
   false` / `DRAFT_STATUS: published`. Defaulterna är tomma nu. Med 2 700
   opolerade tyska utkast i katalogen är det den farligaste riktningen att fela
   åt — samma klass som `variantsInfo`-PATCHen som publicerade ett utkast.

**Och en tredje, som följde av att den andra undersöktes:** ett okänt
`wixVariantId` skrev raden först och lät verifieringen fälla på det omatchade
id:t → 500 "läste inte tillbaka som förväntat". Meddelandet ljög (de andra
fälten HADE skrivits, produkten kunde vara publicerad) och patchen lämnades
halvt applicerad. Rutten avvisar nu okända id FÖRE skrivningen med **422** som
namnger både de okända id:na och radens riktiga, och skriver ingenting alls.

**Regeln: ett falsklarm som alltid fyrar är lika illa som ett fel ingen ser.**
Båda slutar med att mottagaren slutar läsa — och då är även det äkta larmet
borta.

Fjorton tester, verifierade genom att återinföra alla tre farliga misstagen
(tyst ignorerade fält, positionsmatchad SKU, gissande prisgrind): rätt test
faller för rätt bugg.

**Regeln: en migrering är inte klar när datan flyttat — den är klar när alla
läsare följt med.** Kodauditen hittade inga trasiga läsare eftersom poleringen
inte är kod; den är en runbook som en människa och en modell följer.

### Så såg resonemanget ut innan raderingen

Växlingen är gjord, men de gamla raderna är inte raderade. De är
återställningen: går något fel byts `STORE_BACKEND` tillbaka till `wix-data` och
driften står på fötter igen på en minut. **Det är först raderingen som frigör
4 000-taket**, och den ska göras med Leonards uttryckliga ja efter minst ett
dygns stabil drift — inte samma kväll som växlingen.

Kvittot att skrivvägen fungerar mättes direkt, inte antogs:
`/api/cron/order-backfill` loggade **`1 av 1 saknade tasks skapade, 0 fel
(räddade: 10024)`** 21:25 samma kväll. Ordern som legat oskrivbar sedan morgonen
fick sin task, och `tasks` gick från 12 rader i Wix till 13 i Postgres.

### ☠️ Och den bröt kundens spårningssida — en läsare auditen inte kunde se

`/api/tracking-events` slår upp AliExpress-ordern från ett spårningsnummer, och
gjorde det genom att fråga **Wix Data direkt** med en egen fetch-hjälpare mot
`FyndplatsTasks` i stället för att gå via storen. Steg 6 tömde kollektionen, och
rutten svarade från den sekunden **404 "Okänt spårningsnummer" för varje kund**.
Uppmätt i drift 2026-09-01 kl 20:35 på en riktig kunds nummer.

☠️ **Kodauditen efter raderingen missade den, och det är hela lärdomen.** Den
letade efter LÄSARE SOM GÅR SÖNDER. Den här gick inte sönder — den blev **tom**.
Ett tomt svar från rätt API mot rätt kollektion ser i källkoden exakt likadant ut
som ett friskt anrop, och i loggen är det en 404 som ser ut som ett okänt
spårningsnummer. Samma familj som "ett svar utan fel är inget kvitto", men värre:
här fanns inte ens ett fel att ignorera.

Skadan är större än den ser ut, eftersom butiken anropar rutten **FÖRST**:
17TRACK klarar inte alla EU-fraktkedjor, medan AliExpress alltid känner sin egen
order. Mätt samma kväll på två skarpa ordrar:

| order | fraktväg | butikens 17TRACK-källa |
|---|---|---|
| 10024 | Seller Shipping ES Local → PostNord | 2 händelser, senast samma kväll |
| 10023 | AliExpress Standard shipping-Poland | **noll händelser, 36 h efter avsändning** |

Det är precis 10023 rutten finns för — och det är precis den kunden som fick
"inga spårningshändelser ännu" i stället för AE:s egna.

Lagat genom att flytta uppslaget in i storen: `getTaskByTrackingNumber` finns i
alla tre backends, med uttrycksindex i Postgres. Två egenskaper som inte ska tas
bort:

1. ☠️ **`store-access-audit.test.ts` är grinden, inte ögon.** Den läser
   källkoden i hela repot och fäller om en fil utanför de sex ägande modulerna
   nämner både ett Wix Data-anrop och en flyttad kollektion. Verifierad genom att
   återinföra buggen: testet fäller, och bara det. Den hittade dessutom
   `lib/llm/storage.ts` direkt — den var redan backend-växlad, alltså frisk, men
   det var en genomgång som tog sekunder i stället för en kväll.
2. **Uppslaget är versalokänsligt, och indexet är på samma uttryck.** Rutten
   versaliserar kundens inmatning; en task som bär numret gemener hade annars gett
   exakt samma tysta 404 en gång till.

⚠️ **Vad som INTE är vårt att laga.** Kundmejlen — "Ditt paket är på väg" och
"Ditt paket är framme" — ligger i **butiksrepot**, inte här. `www.fyndplats.se`
pekar på Vercel, så Velo-koden i `wix-velo/` är arv: dess `_functions/track` är
oåtkomlig på domänen, och `TrackingEvents` i Wix har **noll rader** (raderingen
rörde den aldrig — den står inte i någon kopielista). Butiken har tagit över hela
kedjan och den lever: `/_functions/track_webhook` svarar
`configured:true, resendConfigured:true`, tog emot 17TRACK-pushar 07:46 och 19:53
den 2026-09-01, och `/api/track` returnerar svenska händelser. Mejl skickas via
Resend därifrån — leta i butiksrepot, inte i det här.

**Regeln, som nu gäller två gånger:** en migrering är klar först när alla läsare
följt med — och en läsare som blir TOM syns varken i en kodaudit eller i en
felräknare. Det som hittar den är ett källkodstest.

## Fyndauktionen flyttar till Postgres (`AUCTIONS_BACKEND`, 2026-09-29)

Wix CMS var fullt igen: **4 020 rader mot taket 4 000**, och
`FyndplatsAuctions` var **3 561** av dem (3 308 i kön, 5 live, 248
avslutade). Kön är en rad per produkt i katalogen och växer med varje import.
Taket stoppade två sammanslagningars omdirigeringar i runda B64, och
auktionsseeden kan inte lägga nya produkter i kön. Leonard bad om flytten.

Samma ordning som recensionerna, och samma skäl för varje steg:

| steg | vad | frigör taket? |
|---|---|:---:|
| 1 | `auctions`-tabell, Postgres-lager, `AUCTIONS_BACKEND` (default `wix-data`) | nej |
| 2 | butiken läser och avslutar via `/api/auctions/*`, inte Wix Data direkt | nej |
| 3 | kopiera (`?tabeller=auctions`), verifiera strikt | nej |
| 4 | växlingen: defaulten blir `postgres` i koden (2026-09-30) | nej |
| 5 | radera Wix-raderna, med Leonards ja | **ja** |

Två rutter för butiken, båda med `Bearer REVIEW_INGEST_SECRET` (den hemlighet
de två projekten redan delar, så ingen ny behöver föras in för hand):

- `GET /api/auctions/rader?status=live|sold` — raderna butiken visar.
- `POST /api/auctions/avsluta` — butikens webhook avslutar ett sålt live-fynd
  direkt. Priset återställs först, sedan sold, samma ordning som timcronen.

Sex egenskaper som inte ska tas bort:

1. ☠️ **Defaulten var `wix-data` fram till växlingen, även när
   `STORE_BACKEND=postgres`.** Hade auktionerna följt drift-datans växel hade
   ticken läst en tom tabell i samma sekund som lagret deployades. Sedan
   2026-09-30 är defaulten `postgres`. Växlingen gjordes i koden, för Vercel
   svarade 403 på att skapa `AUCTIONS_BACKEND` för produktion. Samma
   produktionsbygge som hade burit variabeln bär nu defaulten.
   `AUCTIONS_BACKEND=wix-data` är vägen tillbaka så länge Wix-raderna finns.
2. ☠️ **Butiken går via motorn.** Läste den Wix direkt hade den efter växlingen
   visat gårdagens fynd, och webhooken hade avslutat auktioner i ett lager
   ingen läser. Nu byter butiken lager i samma ögonblick som motorn.
3. ☠️ **Rutternas svar är en allowlist** (`lib/auction/butiksvy.ts`). Golvet
   (`floorPrice`, `variantPrices`) lämnar aldrig motorn. Stegen följer med för
   live-rader, eftersom butikens server räknar nästa sänkning ur den, och det
   är därför rutterna kräver en hemlighet.
4. ☠️ **Svaret bär `lager`**, alltså vilket lager som faktiskt svarade. En
   env-variabel binds vid deploy, så en växling ska läsas ur svaret och inte
   antas ur Vercels panel.
5. **Ticken läser bara köns första 200** (`köHuvud`). Den främjar högst fem åt
   gången och går var tionde minut. Hela kön är ~2,4 MB, och att läsa den 144
   gånger per dygn hade kostat ~10 GB i månaden ur databasen. Seeden,
   pensioneringens spärr och morgonmejlet läser hela kön, och i Postgres utan
   Wix-frågans tak på 1 000 rader.
6. ☠️ **Kopieringen är tillåten och verifieringen strikt tills växeln slagit
   om** (`EGEN_VÄXEL` i kopieringsrutten, samma undantag som recensionerna
   hade). Efter växlingen vägrar kopieringen, för då hade den skrivit tillbaka
   gamla Wix-rader över levande data.

⚠️ **Radera Wix-raderna direkt efter en verifierad växling, inte ett dygn
senare.** Auktionerna har inget retention-fönster, och efter växlingen tar
seeden (03:17 UTC) och ticken bort rader ur Postgres. En sådan rad finns kvar i
Wix men inte i kopian, och raderingen avbryter då hela sidan.

✅ **Leonard sa ja till raderingen 2026-09-29.** `FyndplatsAuctions` är släppt ur
`ALDRIG_RADERA`, men raderingsverktyget tar den bara när auktionerna bor i
Postgres i den körande deploymenten (`VÄXELSTYRDA` i `lib/migration/radera-wix.ts`,
`auctionsBackend() === "postgres"`). Före växlingen hade en radering tömt den
levande auktionen.

## Recensioner: hämtas server-side från AliExpress, översätts i chatten

Recensionskedjan (filtrering → `FyndplatsImportedReviews` → moderering i
`/admin/reviews` → produktsidans "Kundrecensioner") har funnits sedan 2026-07-08 men stod **tom på
876 produkter** fram till 2026-08-16. Orsaken var inmatningen, inte kedjan:

- Enda vägen in var tilläggets DOM-skrapa (`extension/content.js → scrapeReviews`),
  och AE **lazy-laddar** recensionssektionen — klickar man importera högst upp på
  sidan har den oftast inte renderats, så skrapan returnerade `[]`.
- **Bulk-/CSV-importen rör aldrig recensioner** (`lib/bulk-import/worker.ts` har
  ingen webbläsare). Katalogens senaste ~800 produkter kom in den vägen.

`lib/aliexpress/reviews.ts` hämtar dem nu i stället från AE:s feedback-endpoint
(ren JSON, inget tillägg, $0). Två äkthetsspärrar sitter i mappningen och ska inte
tas bort: recensioner som AE själv markerar som **AI-genererade** (`aigc`) och
sådana som inte är publicerade hos AE (`status !== "1"`) släpps aldrig igenom.
Anonyma konton ("AliExpress Shopper") får inget namn vidare — annars blir varenda
rad "A.S." och sidan ser förfalskad ut.

### Vad som faktiskt gallrar — mätt 2026-08-25

Den vanliga gissningen är att stjärnfiltret stryper hämtningen. Det gör det inte.
Mätt över nio verkliga AE-listningar (204 råa recensioner):

| Regel | Kvar | Kostnad |
|---|---|---|
| `minRating: 3` | 199/204 | **2 %** — nästan allt hos AE är redan 3+ |
| `minLength: 50` | 126/204 | **38 %** |
| spam + dubblett + utlandsleverans | 116/204 | 5 % |
| `DEFAULT_MAX_PER_PRODUCT: 8` | 55/116 | **53 % av det godkända** |

Samtidigt visade **432 av 908 publicerade produktsidor noll recensioner**. Bristen
är alltså BREDD (produkter utan någon recension), inte DJUP (fler per produkt) —
att höja taket från 8 hjälper bara de ~40 produkter som redan har flest.

Två ändringar följde, båda riktade mot bredden:

- **`AE_REVIEW_DEFAULT_PAGES` 2 → 4.** Två sidor är 40 råa; loopen tog slut mitt i
  högen på listningar med fler. Självbegränsande: `fetchAeReviews` bryter på
  `hasNext`, så en tunn listning kostar fortfarande ett anrop.
- **Räddningssvepet (`REVIEW_RESCUE_MIN_LENGTH = 25`).** Gav 50-teckengolvet
  INGENTING görs urvalet om med 25. Golvet sänks aldrig när något klarade 50 — en
  kort äkta recension slår ingen recension, men bara när alternativet verkligen är
  ingen. Ett `minLength` som anroparen satt själv rivs inte (det är ett beslut, och
  överdraget finns för att svepa upp det ett gammalt filter slängde).

Räddningssvepet går INTE förbi någon annan spärr: betyg, spam, dubbletter och
utlandsleverans gäller oförändrat i båda svepen.

Kvar som medvetet orört: taket på 8 i backfillen. Fler hämtade recensioner blir
inte fler synliga — de blir en längre `pending`-kö att skriva om för hand.

### Så körs den

| Vad | Anrop |
|---|---|
| En produkt | `POST /api/reviews/import` med `{ wixProductId }` — utan `reviews` hämtar rutten själv |
| Hela katalogen | `GET /api/cron/review-backfill` |

`review-backfill` är **torrkörning som default** — utan `?dryRun=false` skrivs
ingenting, du får bara siffrorna. Parametrar: `limit` (produkter per körning,
default 25), `maxPerProduct` (default 8), `includeExisting`, `onlyPublished`,
`ignoreCheckedAt`.

Rutten är **inte schemalagd**. Den var det en kort stund 2026-08-16, men Leonard
valde bort maskinöversättning helt ("skit i deep l") — texterna skrivs i stället
om av Claude i chatten, gratis, och sparas via `/admin/reviews`. En
översättnings-cron i bakgrunden hade motverkat det beslutet. Vill du tillbaka
till schemalagd hämtning: lägg in cron-raden igen — hämtningen i sig är gratis.

Backfillen stannar dessutom själv efter **240 s** (`timeBudgetMs`, mot ruttens
`maxDuration` 300 s). Varje recension kan dra upp till tre mediaimporter med
retry, så en körning hann annars dödas mitt i en produkt.

Körningen **konvergerar**. Varje produkt AE svarat på stämplas med
`reviewsCheckedAt` i mappningen — även när AE inte hade några recensioner. Utan
den stämpeln skulle de ~40 % recensionslösa produkterna hämtas om vid varje
körning i all evighet. Produkter som redan har recensioner hoppas över helt, och
en **strypt** hämtning stämplas aldrig (då hade rate-limiting dolt produkten i en
månad). Omkontroll efter `REVIEW_RECHECK_DAYS` (30) — nya recensioner dyker upp
hos AE över tid.

### Bilderna flyttas hem — men vid olika tillfällen i de två vägarna

Kundbilder får aldrig ligga kvar på leverantörens domän när de visas för kund.
Hemflytten sker i `lib/wix/media-import.ts`, men **de två inmatningsvägarna gör
det vid olika tillfällen**, och den skillnaden har lurat mer än en läsare:

| Väg | Bilden flyttas hem |
|---|---|
| Kön (`review-queue` → `queueReviewsForProduct`) | **Vid publicering** — raden sparas `pending` med AE-adressen kvar |
| Direktimport (`/api/reviews/import` → `importReviewsForProduct`) | **Direkt vid skrivning** |

En `pending`-rad som pekar på `aliexpress-media.com` är alltså **normalt**, inte
ett fel. Att flytta hem bilder för rader som kanske aldrig godkänns vore slöseri
med både anrop och medialagring. Grinden sitter i `lib/store/reviews.ts`:
`isVisibleStatus(status) ? await withOwnImage(review) : review`.

Mätt 2026-08-22: 203 synliga recensioner med bild, **alla** på vår egen domän;
31 rader med AE-adress, **noll** av dem synliga. Kontrollera alltid `status`
innan du drar slutsatsen att mediaimporten är trasig — annars felsöker du
designen.

**Misslyckas uppladdningen behålls källadressen** (2026-08-22). Direktimporten
slängde tidigare bilden tyst: ingen logg, `hasImage:false`, och källadressen
sparades ingenstans — felet gick varken att upptäcka eller reparera, eftersom
`repairImages` bara letar efter rader som FORTFARANDE bär en leverantörs-URL.
Nu räknas missarna i svarets `bildmissar` och lagas av nästa repairImages-körning.

### Betygen skickas INTE till Google

Butiken (`headless-site`) har `PRODUCT_REVIEW_SCHEMA`, **default av**. Recensions-
texten visas för kunden, men `aggregateRating`/`Review` läggs inte i produktsidans
JSON-LD medan omdömena är AliExpress-köpares. Googles riktlinjer för review
snippets vill ha betyg från sajtens egna användare. Sätt `=on` först när datan är
förstahands (Trustpilot Product Reviews / egna kundrecensioner). Se
`lib/review-schema.ts` i butiksrepot.

### Översättningen görs i chatten — DeepL är borttaget (2026-08-19)

Kedjan har **ingen översättningstjänst** längre. `lib/translate/` finns inte;
`DEEPL_API_KEY` och `DEEPL_MONTHLY_BUDGET` läses inte av någon kod och kan tas
bort ur Vercel. Wix-kollektionen `FyndplatsTranslationUsage` skapas inte längre
av `scripts/ensure-reviews-collection.mjs` och kan raderas i Wix.

Det var redan så det fungerade i praktiken — cronen var avstängd sedan
2026-08-16 — men koden bar kvar API-nyckel, månadsbudget, ett användningslager
och en **tyst fallback som sparade originaltexten** när budgeten tog slut.

Följdändringen är den viktiga: importerade recensioner **auto-godkänns inte
längre**. De sparas som `status: "pending"` med källtexten i både `textOriginal`
och `textSwedish`, och blir svenska när någon skriver om dem i `/admin/reviews`
(`editReviewText` sätter `edited` → först då syns de publikt). Samma regel som
för butikens egna kundomdömen. Alternativet — direktpublicering utan
översättare — är exakt vad den gamla budget-fallbacken gjorde: engelska omdömen
på en svensk produktsida.

Kostnaden är därmed **noll**, i både credits och tecken. Kvar som mått är
`chars` per produkt i backfill-svaret: hur mycket text som väntar på att skrivas
om, inte vad något kostar. Mätt 2026-08-16 på 40 slumpade publicerade produkter
(692 publicerade mappningar av 876): träffkvot 60 %, ~240 tecken/produkt vid
tak 8 — alltså ~166k tecken för hela butiken. Cirka 40 % av produkterna får inga
recensioner alls, mest nya Aosom-EU-listningar som inte hunnit få några hos AE.

### Recensionerna är UTE ur Wix — hela migreringen klar (2026-09-04)

**Taket är recensionerna.** Efter att drift-datan flyttade 2026-08-31 ligger Wix
på ~3 355 av 4 000 rader, och `FyndplatsImportedReviews` är **2 514 av dem** —
75 % av allt som är kvar. Aosoms egna produktrecensioner är uppmätta till
~9 500 texter (`/api/cron/aosom-reviews`) och får aldrig plats så länge raderna
bor där. Recensionerna är inte offret för taket, de ÄR det.

⚠️ **Översättningen är däremot INTE flaskhalsen**, tvärtemot vad man kunde tro:
2 421 av 2 514 recensioner är redan publikt synliga, och översättningskön är
**7 rader**. Chattflödet via `review-translate.yml` fungerar och är mätt.

| steg | vad | frigör taket? |
|---|---|:---:|
| 1 | `reviews`-tabell + `PostgresReviewStore` + spec i `ATT_KOPIERA` | nej |
| 2 | kopiera 2 514 rader, verifiera kanoniskt | nej |
| 3 | `REVIEWS_BACKEND=postgres` | nej |
| 4 | butiken läser via API, inte Wix Data direkt | nej |
| 5 | radera Wix-raderna | **ja** |

**Alla fem är gjorda.** Steg 5 kördes 2026-09-04: **2 514 granskade, 2 514
raderade, noll fel** — exakt det tal torrkörningen granskat per nyckel minuten
innan.

Kvittot efteråt, mätt och inte uträknat: `/api/review-aggregates` ger
oförändrat **512 produkter / 2 421 synliga omdömen**, den dynamiska
`/api/reviews/<id>` svarar med 42 omdömen på katalogens mest recenserade
produkt, och produktsidan renderar sina tre omdömen med snitt 4,7.
`betyg-diff` svarar **EJ TILLÄMPLIG (`kallanTomd`)** i stället för att bli rött
— tömd-källa-läget byggdes två dygn tidigare för precis den här dagen.

⚠️ **Marginalen mot taket är HÄRLEDD, inte färskmätt.** Wix hade ~3 355 rader
2026-09-01, varav 2 514 recensioner; efter raderingen är ~841 kvar. Bara
recensionsdelen av det talet är mätt idag. Aosoms ~9 500 recensionstexter
belastar dessutom inte längre taket alls — de skrivs till Postgres.

☠️ **Vägen tillbaka är stängd.** Recensionerna finns bara i Postgres, och Neons
point-in-time-återställning är det som gäller.

**Steg 2 är gjort och mätt:** 2 514 lästa, 2 514 skrivna, noll fel, och
verifieringen ger `reviews wix=2514 pg=2514 avvikande=0`.

**Steg 4 är gjort och mätt i drift.** Butiken läser inte längre Wix Data för
recensioner: produktsidan går mot `/api/reviews/<productId>` och listningarnas
kort mot `/api/review-aggregates`. Kvitto på en skarp, OCACHAD rendering
(`?cb=`, `x-vercel-cache: MISS`) samma dag:

| | |
|---|---:|
| produkter med betyg i aggregatet | 512 |
| summa synliga omdömen | **2 421** |
| kort med stjärnor på `/alla-produkter` | 69 |
| produktsidan | 3 omdömen, snitt 4,7 |

Talet 2 421 är exakt det som mättes oberoende mot Wix (2 421 av 2 514 synliga),
alltså räknar de två vägarna samma sak.

⚠️ **Verifiera ALLTID med cache-bust.** ISR-cachen ligger en timme, så en vanlig
hämtning direkt efter deployen serverar den GAMLA sidan — och den ser ut precis
som en fungerande ny. Första mätningen efter merge "visade" att härkomsten inte
renderades; den läste cachad HTML från förra bygget.
`/api/admin/revalidate?tag=reviews` tömmer alla produktsidor på en gång (kräver
`ADMIN_SECRET`), annars löser timmen det av sig själv.

☠️ **`REVIEWS_BACKEND` är FRIKOPPLAD från `STORE_BACKEND`, och default är
`wix-data`.** Ett första utkast lät `getReviewStore()` läsa `STORE_BACKEND` —
produktionen står på postgres, så lagret hade bytts i samma sekund koden
deployades, in i en TOM tabell: `/admin/reviews` hade slutat se de 2 514
raderna, nya recensioner skrivits dit ingen läser, och butiken fortsatt läsa
Wix. Ingenting hade kastat. Samma familj som `/api/tracking-events`
2026-09-01 — en läsare som blir TOM syns varken i en kodaudit eller i en
felräknare.

☠️ **Affärslogiken DELAS mellan lagren** (`normaliseraFörSkrivning`):
statusfallbacken (`pending`, aldrig `approved`) och hemflytten av kundbilder är
regler om RECENSIONER, inte om databasen. En tvilling hade betytt att en
publicerad recension pekar på leverantörens CDN i det ena lagret men inte i det
andra, beroende på vilken env-variabel som råkade vara satt.

**Härkomsten BÄRS av varje rad, men VISAS inte** (rättat 2026-09-03). Den
renderades en kort stund: upplysningsstycket ovanför listan och etiketten
"Importerat omdöme" per rad. **Leonard tog bort båda samma dag** (#596 i
butiksrepot) — ingen informationstext om var omdömena kommer ifrån. Det är hans
beslut som butiksägare, och den här raden påstod motsatsen i ett dygn.

Vad som står kvar, och som är den gräns som gäller:

☠️ **"✓ Verifierat köp" får ALDRIG sättas på en importerad rad.** I den här
koden betyder etiketten ett köp i VÅR butik, verifierat med token per order.
Fotnoten under listan ("skrivna av verifierade köpare") står kvar med flit —
den säger verifierade KÖPARE av varan, inte kunder hos oss.

☠️ **Okänt ursprung blir ALDRIG "vår kund".** Alla rader före 2026-08-17 saknar
fältet och är AE-importer; en fallback på `customer` hade varit överträdelsen
själv. Testerna i `lib/review-source.ts` låser den riktningen, och de gäller
oförändrat — det är bara PRESENTATIONEN som togs bort, inte klassificeringen.

⚠️ Bakgrunden till varför etiketterna byggdes står kvar här för den som tar upp
frågan igen: artikel 7.6 UCPD kräver upplysning om huruvida vi säkerställer att
omdömena kommer från konsumenter som faktiskt använt varan, och bilaga I §23b
förbjuder att presentera andras omdömen som egna kunders. Bedömningen av om
fotnoten ensam räcker är Leonards.

### ☠️ Och en SKRIVARE som skulle blivit föräldralös (2026-09-02)

Hittad genom att leta efter kvarvarande Wix-läsare inför steg 3 — och det var
inte en läsare. Butikens **`/api/omdome`**, dit kunden skriver sitt eget omdöme
efter ett verifierat köp, gjorde `POST /data/v2/items/save` RAKT mot
`FyndplatsImportedReviews`.

Det var rätt så länge recensionerna bodde där. Efter växlingen läser allt ur
Postgres — och kundens omdöme hade fortsatt hamna i Wix, där ingenting läser.
Raden hade aldrig synts i `/admin/reviews`, aldrig kunnat godkännas, aldrig
renderats. Wix svarar 200, så varken kunden, loggen eller en felräknare hade
märkt något.

Spegelbilden av `/api/tracking-events`: där blev en LÄSARE tom, här försvinner
en SKRIVNING. Och dyrare, för kundomdömena är de enda **förstahands**omdömena —
de som bär "✓ Verifierat köp" och som ensamma någonsin får bli
`aggregateRating` mot Google.

☠️ **Kodauditen kunde inte se den.** `store-access-audit.test.ts` läser DET HÄR
repot; skrivaren bor i butiksrepot. Grinden finns därför nu på båda sidor
(`lib/review-store-access.test.ts` på `headless-site`), verifierad genom att
återinföra buggen — den fäller och namnger filen.

Butiken postar nu till **`/api/reviews/customer`** med `REVIEW_INGEST_SECRET`
som Bearer-token. Tre egenskaper som inte ska tas bort:

1. ☠️ **Valideringen ligger kvar i butiken.** Den äger `REVIEW_TOKEN_SECRET`,
   verifierar tokenets signatur, kontrollerar att produkten ingick i ordern och
   att bildadresserna pekar på vår egen Wix Media. Att flytta hit hade betytt
   tvillingar av `verifyReviewToken`, `validateCustomerReview` och
   `buildCustomerReviewRow`. Rutten är tunn: hemligheten är förtroendegränsen.
2. ☠️ **`status` och `source` TVINGAS i rutten**, de läses aldrig ur kroppen.
   En anropare som kunde sätta `approved` hade lagt text direkt på
   produktsidan förbi modereringen, och `source` styr både etiketten och
   UCPD-upplysningen.
3. ☠️ **Fail-closed i båda ändar.** Saknas hemligheten svarar motorn 503 och
   butiken 503 — aldrig 200. Att svara kunden "tack!" på ett omdöme som aldrig
   lagrades är det enda utfall som är sämre än ett fel.

⚠️ **`REVIEW_INGEST_SECRET` måste stå i BÅDA Vercel-projekten med samma värde,
och vara satt innan `REVIEWS_BACKEND` växlas.**

### ☠️ Auditen före raderingen: tre scripts, och grinden var blind för dem

Auditen inför steg 5 hittade **ingen** kvarvarande läsare i `lib/` eller `app/`.
Den hittade tre i `scripts/`, och skälet stod i grinden själv:
`store-access-audit.test.ts` filtrerade bort hela `scripts/`.

- **`katalogkoll.mjs`** läste recensionerna direkt ur Wix. Med kollektionen tömd
  hade **varje** publicerad sida sett ut att sakna recensioner, och `--apply`
  hade köat en AE-hämtning för hela katalogen på ett falskt underlag — ~950 i
  rapporten där sanningen är ~440. Läser nu aggregatet, och **kastar** hellre än
  tolkar ett svar utan `betyg`-fält som noll.
- **`backfill-product-hashes.ts`** och **`backfill-suppliers.mjs`** läste
  `FyndplatsMappings`, tom sedan 2026-09-01. Hash-backfillen rapporterade
  "0 mappningar med AE-id" och hashade varje produkt utan sitt AliExpress-id —
  dubblett-detektorn tappade sin exakta matchning, tyst, i tre dygn.

**Regeln: ett script är inte mindre farligt än en rutt — det är farligare, för
det körs av en människa som tror på siffran den skriver ut.** Undantaget är
borta ur grinden.

### Den spärr som faktiskt skyddade raderingen

Recensionerna har **inget retention-fönster**, så `beslutaSida` kan aldrig
skriva av en saknad rad som "utgången": en enda Wix-rad som inte fanns i
Postgres hade avbrutit hela sidan. Torrkörningen granskade alla 2 514 utan att
avbryta — per-nyckel-bevis, inte en radräkning. Ett test låser riktningen.

### Historik: så såg ordningen ut

1. **Steg 3 — `REVIEWS_BACKEND=postgres` i Vercel.** Butiken läser via API:t
   oavsett vilket lager som svarar, så växlingen är osynlig för kunden. Först
   när den är gjord OCH verifierad släpps `FyndplatsImportedReviews` ur
   `ALDRIG_RADERA` och steg 5 blir möjligt. Spärren står kvar tills dess med
   flit: den är det som hindrar en radering av rader som fortfarande är facit.

   ☠️ **Kör `betyg-diff` FÖRE växlingen** (workflowen "Migrering — kopiera
   drift-datan till Postgres", fjärde läget → `/api/admin/review-backend-diff`).
   Det verifierade radantalet räcker INTE som kvitto här: aggregatet filtrerar
   på `status` och `rating` och grupperar per produkt, så en status av fel typ
   eller ett `rating` som blivit sträng i JSONB passerar en radräkning och
   fäller stjärnorna på varenda produktkort. Rutten instantierar BÅDA lagren
   direkt — aldrig via `getReviewStore()`, som bara returnerar det env pekar på
   och därmed hade jämfört ett lager med sig självt.

   **Körd och grön 2026-09-02**, före växlingen: `wix 512 produkter, 2 421
   synliga omdömen` mot `postgres 512 produkter, 2 421 synliga omdömen`, noll
   avvikande. Samma tal som butiken renderar. Växlingen är därmed mätt ofarlig
   i stället för antagen — kör läget en gång till EFTER den, då ska talen vara
   oförändrade.

   ☠️ **Svaret bär `aktivtLager` — vilket lager som FAKTISKT servar.** Efter
   växlingen ger `/api/review-aggregates` exakt samma tal ur båda lagren; det
   är hela poängen med att migrera bakom ett interface, och samtidigt skälet
   till att växlingen annars är omöjlig att verifiera utifrån. Utan fältet vore
   "steg 3 är gjort" ett antagande om att en deploy plockat upp en variabel.
   ⚠️ En env-variabel binds vid DEPLOY, inte när den sparas — en satt variabel
   utan efterföljande deploy ändrar ingenting, och `betyg-diff` såg exakt
   likadan ut i båda lägena innan fältet fanns.

   Två spärrar i den som inte ska tas bort: ett **golv på 100 produkter per
   sida**, för två tomma aggregat är per definition identiska och en fallen
   läsning hade annars rapporterats som "noll avvikelser, växla på"; och ett
   eget **tömd-källa-läge** (`kallanTomd`) för tiden efter steg 5, eftersom en
   jämförelse mot en raderad källa annars hade gjort jobbet rött vid varje
   körning för alltid. Snittet jämförs med 0,1 i tolerans (Postgres avrundar i
   SQL, Wix i JavaScript), antalet exakt.

## Mediainventering: "utan katalogreferens" är inte "oanvänd"

Mediabiblioteket på headless-sajten hade **30 231 bilder** 2026-08-27, mot 1 696
produkter. Frågan "vilka används inte?" går inte att besvara från chatten — ett
filobjekt är ~1,3 kB, så en full listning är ~39 MB. Den körs därför där
nycklarna finns: GitHub Actions-workflowen **"Bilder — inventera
mediabiblioteket"** → `/api/cron/media-audit`, rapporten hamnar i
`tools/media-audit/scan-latest.json`.

**Rutten kan inte skriva och kan inte radera.** Det är inte försiktighet på
måfå: Wix Media har inget API som svarar på VAR en fil används (kontrollerat
2026-08-27). Vi kan bara räkna vad katalogen pekar på — produkternas galleri,
`media.main`, `linkedMedia` och kategoribilderna. Utanför mätningen ligger
sidor, banners, logotyper, bloggen, Wix-appar och CMS-kollektionerna (bland
annat recensionsbilderna, som dessutom bor på ett **annat site-id**:
`WIX_SITE_ID`, inte butikens `HEADLESS_WIX_SITE_ID`).

Därför heter fältet `utanKatalogreferens`. Listan är ett underlag för en
människa, aldrig en dödslista — samma hållning som prisreparationens
"det finns ingen kör-allt-flagga".

Tre egenskaper som inte ska tas bort:

- **Katalogen läses FÖRE filerna.** Katalogen är den lilla sidan och den som
  gör listan meningsfull. Tar tidsbudgeten slut mitt i filerna får man en
  delrapport med korrekta referenser; tvärtom hade gett en lista där varje
  oläst produkts bilder ser föräldralösa ut.
- **`fullstandig: false` diskvalificerar listan för radering.** Den är sann
  bara när både filerna, katalogen OCH kategorierna gick klart.
- **Dolda kategorier räknas med.** En dold kategori kan publiceras igen, och
  dess bild ska inte hinna raderas under tiden.

Rapporten räknar också **byte-identiska dubbletter** (samma `hash`) och deras
kostnad — bara kopiorna, inte originalet. Dubbletter kostar plats även när de
används, och en stor post är importvägen: filer vars `displayName` är ett annat
Wix-media-id är omimporter av bilder som redan låg i biblioteket.

Övriga LLM-/kostnads-env-variabler dokumenteras i **`LLM-CONFIG.md`**.
