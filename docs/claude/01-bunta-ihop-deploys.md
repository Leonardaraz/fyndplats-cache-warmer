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
fortfarande sin cache 15:24, efter motorns produktionsbygge 15:08. Mätt igen 2026-10-28 vid mergen av
#786 (bara dokumentation och verktyg): motorns och butikens produktionsbygge blev båda `CANCELED` med
`#ignored-build-step`, och 17 butikssidor behöll sin cache (åldern växte med exakt den förflutna tiden,
8 sekunder och 5 minuter 55 sekunder efter mergen, FLAGGADE lärdom 260).

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
