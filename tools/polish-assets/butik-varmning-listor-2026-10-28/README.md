# Butiken: värmaren lämnar listorna till ett eget led (punkt 4)

Patch mot `headless-site` (bas `5d53d4e3`, PR #770). Inte pushad och ingen PR öppnad:
en merge till `headless-site` deployar butiken och tömmer dess ISR-cache, så
den väntar på Leonards ja och bör följa med nästa butiksdeploy (en deploy per dag).

## Felet

Efter butiksdeployen 2026-10-24 00:33 UTC värmde led 2 sina 1 796 sista
produkter på hela sin deadline och loggade

```
[varm-katalogen] led 2: värmde 1796/1796 — katalogen klar. Listor: 0/133 (avbruten på deadline)
```

Produktlistorna bakom "Visa fler", filter och sortering (`/api/lista`, en per
kategori plus alla och rea) delar ledets deadline och fick därför ingen tid.
Huvudlistorna blir varma av nästa kvartskörning, men de ungefär 120
underkategorilistorna stod kalla tills någon bad om dem. Listsidornas egen HTML
var varm ändå (18 av 21 var förbyggda av deployen).

## Ändringen

Ett avbrutet listpass lämnar resten till ett nytt led, på samma sätt som ett
avbrutet produktpass: samma `POST /api/cron/varm-katalogen`, men med
`{ led, listorFran }` i stället för `{ led, kvar }`.

- `lib/warm-urval.ts`: `Listled`, `MAX_LISTOR`, `listorEfterPass`,
  `varmListorMedOverlamning` (den rena överlämningen, med injicerade `varm` och
  `starta`), och `tolkaLed` tar emot ett listled. Kroppen bär bara ett heltal;
  nycklarna räknas om ur kategorierna i ledet självt, så den kan aldrig peka på
  en sökväg.
- `lib/warm.ts`: `startaLed` och nya `startaListled` delar `skickaLed`. Samma
  `MAX_LED`-tak, samma `CRON_SECRET`, bara i produktion.
- `app/api/cron/varm-katalogen/route.ts`: alla tre ställen som värmde hela
  listan (GET, produktledets slut, listledet) går genom `varmListorFran`.
- `CLAUDE.md`: loggraderna att läsa efter en deploy.

Loggen efter en deploy ska sluta med `katalogen klar. Listor: 133/133` eller,
när listorna fick ett eget led, `led N: listor från 0. Listor: 133/133 — listorna klara`.

## Prövat

- `lib/warm.test.ts`: 23 av 23 (8 nya). Hela butikens svit: 1 454 av 1 454.
- Fem fel återinfördes ett i taget, och rätt test föll för varje: överlämningen
  borttagen (4 faller), `fran` tappad (2), kropp med både `kvar` och `listorFran`
  accepterad (1), rutten värmer hela listan direkt igen (1), `MAX_LED` ignorerat
  av listkedjan (1).
- `tsc`: inga nya fel i de ändrade filerna (testfilerna har sedan förut
  TS5097 på alla `.ts`-importer). `eslint` ren på de fyra filerna.
- Patchen tillämpas rent mot `5d53d4e3` (`git apply --check`).

## Så tillämpas den

```
git checkout -b <gren> origin/headless-site
git apply tools/polish-assets/butik-varmning-listor-2026-10-28/butik-varmning-listor.patch
node --test --experimental-strip-types --no-warnings lib/warm.test.ts
```

Efter mergen och butikens produktionsbygge: läs `[varm-katalogen] led N`-raderna
i butikens runtime-logg och kontrollera att den sista säger `Listor: 133/133`
eller `listorna klara`.
