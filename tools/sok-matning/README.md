# Mätning av sökmotorn

Sökmotorn (`lib/search.ts`) ändras aldrig på känn. De här verktygen mäter en
ändring mot hela katalogen innan den byggs. De tre första kom till vid
genomgången 2026-11-19 (se "Sökmotorns genomgång" i `CLAUDE.md`), de tre om
farten 2026-11-20 (se "Sökfältets fart").

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

Sista raden är **hela svaret**: hur många frågor som fick en annan lista
(varje träff i ordning) eller ett annat besked. En ändring som bara ska göra
sökningen snabbare ska ge 0 där.

Indexets sista rad är kategoritabellen (`lib/sok-begrepp.ts`). Verktygen lyfter
av den och ger sökningen kategorierna, som sökrutan gör (`las-index.ts`).

☠️ **Ingen vanlig import mellan verktygens `.ts`-filer.** `import … from
"./las-index.ts"` fäller butikens bygge: typkontrollen i `next build` läser
också `tools/`, och en importsökväg som slutar på `.ts` är ett fel där (mätt
2026-11-20, ett lokalt bygge föll). Hjälparen laddas därför med en uträknad
sökväg, som motorn. Före en push ska
`npx tsc --noEmit -p . | grep -v "\.test\.ts("` vara tom.

Ett tredje argument till `utfall.ts` är en egen frågefil (en fråga per rad),
till exempel kundernas sökningar ur GA4 eller Googles frågor ur Search Console.
De listorna checkas inte in.

## Felstavningar

```
node --experimental-strip-types tools/sok-matning/stavfel.ts /tmp/index.json [annan utcheckning]
```

Mätt 2026-11-19 på 592 felstavningar: täckning 98,6 %, renhet 99,1 %, inga
tomma svar (före genomgången 90,6 %, 97,6 % och 3).

## Farten

Sökrutan räknar om vid varje tangent, så en ny regel som går igenom alla namn
en gång till märks på en telefon. Tre mått, från snabbast att köra till
närmast kunden:

```
# räknetiden per tangent på en dator (sista argumenten: en annan utcheckning, egna ord)
node --experimental-strip-types tools/sok-matning/tangenter.ts /tmp/index.json
# sökläget i Chromium med fyrdubbelt strypt processor: långa uppgifter och väntan per tangent
STRYP=4 node tools/sok-matning/fart.cjs http://localhost:3311
# öppningen: från fingret tills de populära varorna är ritade
STRYP=4 VARV=8 node tools/sok-matning/oppning.cjs http://localhost:3311
```

De två sista behöver ett bygge som svarar (`npx next build && npx next start
-p 3311`), eller mäts mot www. Mätt 2026-11-20 (7 886 varor): 182 tangenter på
904 ms på en dator (morgonens motor 3 544 ms), och tio ord i webbläsaren med
979 ms blockerat och 58 ms som längsta väntan för en tangent (www samma kväll:
8 217 ms och 513 ms).

☠️ **Node kör källkoden, webbläsaren det minifierade paketet.** Det som bara
finns i det byggda paketet (en funktion inbakad i en slinga, ett förvalt
parametervärde som blivit en läsning ur `arguments`) syns inte i
`tangenter.ts`. `lib/sok-minifierat.test.ts` håller de fall som hittats, och
`fart.cjs` är måttet som gäller.

## Vad verktygen inte ser

- Ordningen bland likvärdiga träffar är katalogens, och den byts när
  katalogen gör det. Jämför alltid mot samma `index.json`.
- Sökrutans förslag (`sokforslagINamn`) och kategoriförslagen jämförs inte
  före och efter, bara deras tid (`tangenter.ts`).
- En riktig telefon. Strypningen i Chromium gör processorn långsammare men är
  ingen iPhone: Safari har en annan JavaScript-motor.
