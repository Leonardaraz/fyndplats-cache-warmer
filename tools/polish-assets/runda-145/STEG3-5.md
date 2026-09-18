# Runda 145 — Steg 3–5: källäsning, prisgrind och bildgranskning

## Steg 3 — alla nio lästa (revision, variant, kategori, prisgrind)

| pid | wixProductId | revision | variant-SKU (rå) | kategori-id (idag) |
|---|---|--:|---|---|
| `0fc3c252` | 0fc3c252-94d2-4c05-b916-bfaf7e1ae356 | 2 | FP-gewachshaus-ca-2-7-x-2-x | 05e96cd6-… (All Products) |
| `97f5f728` | 97f5f728-d291-45ed-8435-dfdec4a9f0a3 | 2 | FP-pop-up-gewachshaus-ca | samma |
| `9cdca665` | 9cdca665-a1e0-4809-b719-11a6bdb81c83 | 2 | FP-polytunnel-gewachshaus | samma |
| `f5f02f8a` | f5f02f8a-ef76-414f-8d59-1a82071c601b | 2 | FP-6-x-3-x-2-m-polytunnel | samma |
| `601ae5f5` | 601ae5f5-8945-4182-a018-b799b8badb50 | 1 | FP-gewachshaus-tragbares | samma |
| `dd97fbc9` | dd97fbc9-1fd8-4ec2-abf4-a1956f6cd39b | 1 | FP-fruhbeet-mini | samma |
| `62d2071e` | 62d2071e-96ee-48e7-aa23-709992fdfc92 | 2 | FP-gewachshaus | samma |
| `a7d1a29b` | a7d1a29b-81c4-4890-bf58-6a0a99b53e0c | 1 | FP-tunnel-gewachshaus | samma |
| `2da078c9` | 2da078c9-71c8-4929-9e39-6379163dfec5 | 2 | FP-wandmontiertes | samma |

Alla nio: `visible:false`, en variant, `variantVisible:true` (redan så vid
import — normalt), samma "All Products"-bucket. Prisgrinden (se Steg 1-2.md)
gav `stämmer:true` på samtliga, `landedCostSek`/`förväntat`/`faktiskt` matchar
regeln `x1,20` + `charm99` rakt av.

## Steg 5 — sjutton källor lästa tre gånger, en verklig precisionspunkt

Alla nio `Beschreibung`/`Technische Daten`/`Lieferumfang`-block hämtade i sin
helhet (inte bara prisgrindens sammandrag) och lästa mot varandra enligt
regeln: Lieferumfang är kontraktet.

**Inga hårda motsägelser** den här rundan — ingen brödtext lovar något
Lieferumfang inte täcker, ingen vikt eller lastsiffra säger två saker. Sju
precisionspunkter värda att bära in i Steg 7:

- **`97f5f728` och `dd97fbc9`: Lieferumfang matchar brödtextens artikelräkning
  exakt.** `97f5f728`s "Acht Bodenheringe und vier Seile" = Lieferumfangs
  "8 x Bodenanker, 4 x Abspannseil". Ingen överdrift att skriva bort.
- **`a7d1a29b`: samma "Mittelgröße"-anomali som redan flaggad i Steg 1-2.**
  De riktiga måtten (300L×200B×195H cm) står i Technische Daten och bekräftas
  dessutom av en egen måttritningsbild (Steg 4). `a7d1a29b`s Lieferumfang
  nämner bara klamrarna (40 st); brödtextens "mitgelieferten Schrauben und
  Folienklammern" ger inget separat skruvantal — skriv "fixeringsklammer"
  utan att lägga till ett skruvtal källan inte ger.
- **`dd97fbc9`: "Zwei abschließbare Türen" — mekanismen är INTE bildbevisad.**
  Bildgranskningen (Steg 4) visar raka handtag på dubbeldörren men ingen
  tydlig hänglåsögla eller cylinder i upplösningen som finns. Samma fälla som
  #459 (`abschliessbar` betyder två olika saker). Skriv "låsbara dörrar" utan
  att namnge mekanismen.
- **Vindklasser med och utan km/h-tal särskiljs.** `97f5f728` (Stufe 3-4,
  <28 km/h), `f5f02f8a` (Stufe 4, <28 km/h), `601ae5f5` (Stufe 4, <28 km/h) och
  `62d2071e` (Stufe 4, <28 km/h) ger ett konkret tal — citeras med talet.
  `9cdca665` och `a7d1a29b` (båda Stufe 5, inget tal) och `0fc3c252` (ingen
  vindklass alls, bara "Gewölbtes Dach verteilt die Windkraft effektiv") ger
  bara nivån — citeras utan påhittat km/h-tal.
- **`62d2071e`s säkerhetsnotis är äkta och ska översättas rakt av**, inte
  mjukas: "Nicht geeignet für extreme Wetterbedingungen" + rekommendationen
  att placera nära en vägg. Lieferumfang bekräftar dessutom att markankare
  OCH abspannlinor faktiskt ingår (4+4) — till skillnad från runda 144:s
  `f8d3a8fd`, där ankare bara rekommenderades. Skriv "markankare och
  abspänningslinor ingår" här, med täckning.
- **`f5f02f8a`s två procenttal är olika egenskaper, inte en motsägelse.**
  80 % blockerad skadlig UV kommer från solskyddsnätet; 85 % ljusgenomsläpp
  kommer från 140 g/m²-plasthöljet. Två olika komponenter, två olika tal —
  båda citeras, ihopblandas inte.
- **Färgfältet tappar ibland ett "+X" mellan Technische Daten och den
  auto-genererade Tekniska specifikationer-tabellen** (`97f5f728`:
  "Grün+Weiß" → "Grün"; `9cdca665`: "Transparent+Silber" → "Transparent").
  Ingen motsägelse, bara en förkortning — brödtexten använder den fylligare
  formen ("grön och vit", "transparent och silver").

Ingen av produkterna nämner glas eller härdat glas; ingen anger en
snölastsiffra. Steg 2:s regler håller oförändrat på alla nio.

## Steg 4 — 27 bilder granskade (position 3, 4, 5 per produkt)

Samma metod som runda 144: kontrollark mot leverantörslogotyp och mot
färg-/materialpåståenden som inte håller vid zoom.

### ☠️ En bild bär leverantörens logotyp

`f5f02f8a` position 5 (en livsstilsbild av en kvinna som vattnar tomatplantor)
har texten **"Outsunny"** väl synlig uppe till vänster — samma klass fynd som
tidigare rundor (#282, #551, #565). Bilden flyttas inte och tas inte bort här
(poleringen skriver bara text/SKU/kategori, aldrig media) — flaggat som
Leonards beslut, samma mönster som #461/#568.

### Övrigt: inga fler logotyper, tre bekräftelser

- **`a7d1a29b`s riktiga mått bekräftade av en egen måttritning**
  (300×200×195 cm, kantlängd 50 cm) — oberoende av både Technische Daten och
  den trasiga "Mittelgröße"-etiketten. Tre källor är nu överens: Technische
  Daten, måttbilden, och (indirekt) Lieferumfangs 40 klamrar som matchar en
  gångtunnel av den storleken.
- **`9cdca665`s färg bekräftad visuellt**: genomskinlig duk med silverfärgad
  kantlist, matchar "Transparent+Silber" bokstavligt.
- **`dd97fbc9`s "Grau" bekräftad**: mörkgrå/antracitfärgad aluminiumram med
  polykarbonatskivor, konsekvent på alla tre granskade bilder.

Inget av de nio faller på bildgranskningen. Alla går vidare till Steg 7 med
ovanstående precisionspunkter som facit.
