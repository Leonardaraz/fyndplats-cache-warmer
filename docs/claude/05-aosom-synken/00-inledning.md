## Aosom-synken: ett anrop ger hela sanningen (`lib/aosom/sync.ts`)

Lager och pris speglas av `/api/cron/aosom-sync`. Lagret körs `20 */6 * * *`
(`skipPrices=1`, rotation `lager`) sedan 2026-10-13 — se *Synken nådde aldrig
svansen* nedan. Priserna körs **en gång om dagen**, `13 3 * * *` (rotation
`pris`, ett helt varv), med tre fortsättningar `13 9,15,21 * * *` som bara gör
något när varvet inte hanns med — se
`41-en-priskorning-om-dagen.md` (2026-11-11).

Den är byggd tvärtemot AliExpress-synken, och skälet är strukturellt. AE måste
ringa DS-API:t **en gång per produkt**, lever under `maxApiCalls` och roterar
därför genom katalogen — ett varv tar ~20 timmar, och därav hela strike-mekaniken.
Aosom är **ett enda HTTP-anrop** som ger alla 6 057 rader med saldo och pris.
Ingen budget, ingen rotation, inga strikes: varje körning ser allt samtidigt.

Det gör problemet mindre men flyttar risken. När en körning kan röra hela
sortimentet är en trasig feed farligare än en trasig produkt — därför ligger
spärrarna mot MASSFEL, inte mot enskilda fel.
