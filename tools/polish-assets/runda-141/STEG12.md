# Runda 141 — Steg 12: läsa sidan som kund

Grinden var grön på alla sju innan det här steget. Det som följer hittades
genom att LÄSA, och ingen av de tre är något en regex kan fånga.

## ☠️ 1. `18b94738` jämförde sig med sidor kunden inte ser

```
Maxlast är 120 kg. Till skillnad från bänkarna med två angivna gränser
finns här bara en enda siffra …
```

*Vilka* bänkar? Meningen förutsätter att läsaren just har läst de sex andra
produktsidorna i rundan. På sin egen sida är den en dinglande referens — samma
klass som runbokens SIDHÄNVISNING-förbud, men formulerad så att mönstret
(`som ovan`, `nedanstående`) inte träffar.

Grinden KRÄVER samtidigt frasen `bara en enda siffra` här, eftersom produkten
har en odelad maxlast och tystnaden annars blir en lucka. Rättelsen behåller
kravet och tar bort jämförelsen:

```
Maxlast är 120 kg. Här finns bara en enda siffra, inte en separat gräns
för användarens vikt — räkna alltså din egen vikt plus hantlarna …
```

⚠️ Den uppenbara omskrivningen hade varit *"leverantören anger bara en
siffra"* — och den bryter husets regel: **mot kunden är VI leverantören.**
Meningen är passiv i stället.

## ⚠️ 2. `a4bbe667`: bänken stod i sin egen ram

`Bänken står i en vit stålram` — ramen ÄR bänken. Rättat till `Bänken har en
vit stålram`.

## ⚠️ 3. `18b94738` sa `handbok` där de sex andra säger `bruksanvisning`

Leverantörens leveranslista skiljer på `Handbuch` och `Anleitung`, och
`handbok` var en trogen översättning. Men skillnaden bär ingen information för
kunden, och sju sidor i samma familj ska säga samma sak om samma slags
papper. Ändrat till `bruksanvisning`.

---

Kontrollerat och lämnat oförändrat, för att nästa granskare inte ska mäta om
dem:

- **`a4bbe667` har TVÅ armstödsmått** — `Armstödsdyna 24 × 40 cm` (läst ur
  måttritningen) och `Armstöd 45 × 30 cm` (leverantörens spec). De mäter dynan
  respektive hela stödet och är etiketterade var för sig. Runbokens regel om
  tal som mäter olika saker gäller: det ser ut som en motsägelse och är det
  inte.
- **`8a0e05f4` säger `monteringsanvisning`** där andra säger `bruksanvisning`.
  Det är inte samma sak som punkt 3 — leveranslistan säger
  `Montageanleitung`, alltså en anvisning för MONTERINGEN, och den skillnaden
  bär information.
- **`8de3c3ef`: "armarna behöver mer utrymme än bänken"** syftar på
  ANVÄNDARENS armar, medan `armarna` på `b4961e6f` är bänkens svängbara armar.
  På var sin sida är båda entydiga i sin egen mening.
