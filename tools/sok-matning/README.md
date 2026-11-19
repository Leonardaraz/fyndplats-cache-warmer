# Mätning av sökmotorn

Sökmotorn (`lib/search.ts`) ändras aldrig på känn. De här tre verktygen mäter
en ändring mot hela katalogen innan den byggs, och kom till vid genomgången
2026-11-19 (se "Sökmotorns genomgång" i `CLAUDE.md`).

Allt körs från butikens rot. Sökindexet hämtas från den skarpa butiken:

```
curl -s https://www.fyndplats.se/api/search-index > /tmp/index.json
```

## Före och efter en ändring

```
# före ändringen (eller i en annan utcheckning, se sista argumentet)
node --experimental-strip-types tools/sok-matning/utfall.ts /tmp/index.json /tmp/fore.json
# efter
node --experimental-strip-types tools/sok-matning/utfall.ts /tmp/index.json /tmp/efter.json
node tools/sok-matning/jamfor.cjs /tmp/fore.json /tmp/efter.json 40
```

`jamfor.cjs` säger hur många frågor som bytte antal träffar, hur många som
bytte de fem första, och hur många som gick **från träff till noll**. Den
sista siffran ska vara 0 om ändringen inte är till för att ta bort skräp, och
varje sådan fråga ska då läsas. Urvalet under siffrorna läses med ögonen: en
regel som ser rätt ut i tre exempel kan vara fel i det fjärde.

Ett tredje argument till `utfall.ts` är en egen frågefil (en fråga per rad),
till exempel kundernas sökningar ur GA4 eller Googles frågor ur Search Console.
De listorna checkas inte in.

## Felstavningar

```
node --experimental-strip-types tools/sok-matning/stavfel.ts /tmp/index.json [annan utcheckning]
```

Mätt 2026-11-19 på 592 felstavningar: täckning 98,6 %, renhet 99,1 %, inga
tomma svar (före genomgången 90,6 %, 97,6 % och 3).

## Vad verktygen inte ser

- Ordningen bland likvärdiga träffar är katalogens, och den byts när
  katalogen gör det. Jämför alltid mot samma `index.json`.
- Sökrutans förslag (`sokforslagINamn`) och kategorierna mäts inte här.
- Tiden per tangent mäts inte här. Sökrutan räknar om vid varje tangent, så en
  ny regel som går igenom alla namn en gång till märks på en telefon.
