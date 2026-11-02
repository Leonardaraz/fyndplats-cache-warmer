## Flytten tillbaka till Wix CMS (Elite, 2026-10-29)

Leonard köpte Wix Business Elite 2026-10-28 (10 miljoner rader, 100 GB) och
bestämde samma dag: allt ur Neon tillbaka till Wix. Neon kostar 30–40 dollar i
månaden för att datorn aldrig hinner somna, och 4 000-taket som drev ut datan
2026-08-31 gäller inte längre. Butikens tabeller (headless-site) flyttar i en
egen PR, se dess `CLAUDE.md`.

Inventeringen 2026-10-28: 7 374 mappningar, 14 973 recensioner, 4 522
auktioner, 10 009 auditrader, 8 954 synkloggrader och ~5 000 rader till, plus
färgbilderna, karenstiden, synkmarkörerna och fakturaloggen som bara fanns i
Postgres.

| steg | vad | rör driften? |
|---|---|:---:|
| 1 | koden: Wix-versioner + kopieringen, `DRIFTEN_I_WIX = false` | nej |
| 2 | kollektioner, behörighet ADMIN och index i Wix | nej |
| 3 | `kopiera`, sedan `verifiera` rad för rad | nej |
| 4 | `DRIFTEN_I_WIX = true` i en egen PR → deploy (gjort 2026-10-29) | **ja** |
| 5 | `delta` direkt efter, sedan `verifiera` | nej |
| 6 | följ driften några dygn, sedan stängs Neon | — |

Workflowen är **"Migrering — flytta drift-datan tillbaka till Wix"**
(`neon-till-wix.yml`) → `/api/admin/neon-till-wix` →
`lib/migration/neon-till-wix.ts` (regler) och `neon-till-wix-kallor.ts`
(Neon-tabellerna i Wix form). All Wix-trafik går via
`lib/db/wix-data-klient.ts`.

Tolv egenskaper som inte ska tas bort:

1. ☠️ **Växeln ligger i koden** (`DRIFTEN_I_WIX`, `lib/store/backend.ts`).
   Vercel nekar oss att läsa och ändra miljövariablerna (403), och
   `STORE_BACKEND`, `REVIEWS_BACKEND` står på `postgres`. När växeln är sann
   betyder det värdet Wix. Ett test låser att den är sann sedan växlingen 2026-10-29.
2. ☠️ **Klienten läser med markör till slutet och kastar i stället för att
   kapa.** Den gamla Wix-vägen läste auktionskön, importkostnaderna och
   recensionernas betyg med EN sida om 1 000 — alla tre var större än så när
   datan flyttade tillbaka.
3. ☠️ **Kvotstopp försöks alltid om, ett anspråk aldrig blint.** 429/WDE0014
   betyder att anropet aldrig kördes. Efter ett nätverksfel på ett anspråk
   (insert) avgör en återläsning av radens token vem som äger den.
4. ☠️ **En saknad kollektion är ett fel, inte en tom lista.** Efter flytten
   finns alla kollektioner; en tom lista hade sett ut som en tom databas.
5. ☠️ **Delta-regeln:** en Neon-rad skrivs bara om Wix-raden saknas och Neon
   ändrat den efter kopieringen, eller om Wix-raden skrevs FÖRE växlingen. En
   Wix-rad som saknas i Neon tas bort bara om både skapande och senaste
   skrivning ligger före växlingen. `vaxling` = när växlings-PR:en mergades,
   `kopieradSedan` = när den sista kopieringen startade. Kör delta direkt
   efter att växlingens deploy blivit READY.
6. ☠️ **Behörigheten är ADMIN på varje kollektion.** `FyndplatsAuctions` och
   `FyndplatsImportedReviews` stod som läsbara för ANYONE 2026-10-28, och
   auktionsraderna bär golvpriset. Butiken läser via motorns rutter.
7. ☠️ **Index på det som sorteras** (`lib/db/wix-kollektioner.ts`): Wix
   avbryter en fråga efter 5 sekunder (WDE0028) och vägrar sortera en stor
   mängd utan index (WDE0092). Kvoten är sajtens: 3 000 läsningar och 1 500
   skrivningar i minuten.
8. ☠️ **Svaret bär aldrig radernas innehåll**, id som kan bära fritext hashas,
   felen kortas till status och WDE-kod, och markören mellan varven är
   förseglad med `CRON_SECRET` (`lib/aosom/markor.ts`). Loggen är publik.
9. **Färgbilderna är ett dokument per sida i Wix**, inte en rad per bild.
   Postgres ersatte en sidas rader i en sats; ett Wix-dokument skrivs atomiskt,
   så en ersättning kan aldrig lämna sidan utan rader.
10. ☠️ **`$exists: false` matchar inte `null`** (uppmätt 2026-10-29). En rad
    där fältet är `null` räknas som att fältet finns. Dubbel-order-låset
    (`FRI_TASK`) kräver att `claimToken` och `aliexpressOrderId` saknas eller
    är tomma, så tasks kopieras utan null-fält (`utanNull`), och `updateTask`
    tar bort ett fält som sätts till `null` i stället för att skriva null.
    Övriga tabeller kommer över exakt som i Neon.
11. ☠️ **Ett `_id` i Wix är högst 128 tecken: ASCII-bokstäver, siffror och
    skiljetecken** (uppmätt 2026-10-29, `WDE0075`). Mellanslag och å, ä, ö
    avvisas. Motorns nycklar (order-id, task-id, artikel-id) klarar det;
    butikens e-postnycklar gör det inte alltid, se dess `CLAUDE.md`.
12. ☠️ **En sidad aggregering måste sorteras på grupperingsfälten**
    (uppmätt 2026-10-29). Utan sortering kommer grupperna i en ny ordning för
    varje anrop, och sidorna överlappar: av recensionernas 3 663 produkter kom
    2 625 fram med offset och 2 504 med markör, trots att sidorna innehöll
    1 000 + 1 000 + 1 000 + 663 rader. Efter växlingen saknade ~1 000
    produktkort sina stjärnor. Sorterat på `productId` ger båda vägarna 3 663
    produkter och 12 404 omdömen, samma tal som Neon. `aggregera` sorterar
    alltid och kastar om en grupp kommer två gånger.

Planen 2026-10-29 (efter #791): alla 20 kollektioner fanns och var tomma, och
motorns Neon-databas har inga andra tabeller. **Butiken har alltså en egen
Neon-databas**, och dess tabeller kopieras av butiken själv: workflowens val
`system: butik` går via `/api/admin/butik-neon-till-wix`, som skickar anropet
vidare till butikens `/api/admin/neon-till-wix` med `ADMIN_SECRET` som kakan
`fp_admin`. Butikens svar är redigerat där (hashade id, korta fel).

**Utfallet 2026-10-29**, i den ordning det gjordes:

| steg | när (UTC) | utfall |
|---|---|---|
| kopiera, tre små tabeller | 23:37 | tasks 146, synkmarkörer 2, fakturaloggen 3 |
| kopiera, allt | 23:40–23:44 | ~55 000 rader, noll fel, två varv |
| verifiera | 23:47–23:48 | alla 20 tabeller lika rad för rad, nycklarna lika |
| index | 23:55 | alla ACTIVE, radantalen som kopian |
| växeln sann (#794) | 00:01:39, READY 00:03:05 | motorn läser och skriver Wix |
| `delta` | 00:03–00:05 | alla 20 tabeller lika, ingenting att skriva |
| stjärnbetygen | 00:05 | 2 697 produkter i stället för 3 663, se punkt 12 |

Efter mergen: kör `kopiera` en gång till precis före (dess start är
`kopierad_sedan`), merga, vänta tills bygget är READY, och kör `delta` med
`vaxling` = mergens tid. Ett hoppat `delta` lämnar det som skrevs till Neon
mellan kopian och växlingen kvar där.

**Butikens flytt samma natt** (läget `butik`). Butikens växel är en rad i Wix
(`FyndplatsButikInstallningar/datalager`), så omslaget krävde inget bygge:

| steg | när (UTC) | utfall |
|---|---|---|
| kopiera | 03:05–03:21 | 181 174 rader i 15 tabeller, varav prishistoriken 180 309, noll fel |
| verifiera | 03:24–03:32 | alla 15 tabeller lika rad för rad, inget extra i Wix |
| index | 03:24 | 18 egna index på 10 kollektioner, alla ACTIVE |
| växeln till `wix` | 03:33:27 | raden läst tillbaka |
| `delta` två gånger | 03:36–03:45, 03:55–04:03 | alla tabeller lika, ingenting att skriva eller ta bort |
| driften | 03:37–04:01 | ett GLS-paket spårades ur Wix, ordersynken hittade 54 av 54 ordrar, inga körfel |

Neon ligger kvar som reserv till 2026-11-05 (Leonards ja). Sedan tas
Postgres-vägarna bort i båda repona, och Neon kan sägas upp.
