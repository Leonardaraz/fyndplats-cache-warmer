/**
 * Uttömmande `switch`. När en union får ett nytt värde blir varje `switch` som
 * inte tar ställning till det ett typfel här, och `next build` stoppar bygget.
 *
 * Når koden ändå hit vid körning, med data utanför typen, kastar den i stället
 * för att välja en gren på måfå. `vad` står i felet, så att det säger vilken
 * sorts värde som saknade en gren.
 */
export function assertNever(varde: never, vad = "värde"): never {
  throw new Error(`Okänt ${vad}: ${JSON.stringify(varde)}`);
}
