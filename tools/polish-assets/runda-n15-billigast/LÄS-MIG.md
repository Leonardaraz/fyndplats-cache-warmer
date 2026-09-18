# Runda N15 — sex produkter, billigast uppåt

Femtonde rundan i urvalet *billigast uppåt bland de produkter där vi är
billigare än dealproffsen*. Alla sex är Aosom-utkast som publicerats, alla
sex har fått ett eget Fyndplats-kort sist i bildlistan.

| kort | produkt | kategori |
| :-- | :-- | :-- |
| `163ce1e2` | Skoskåp med 2 klaffluckor, justerbar mellanvägg, mörkgrå | Förvaring & Organisering |
| `1d3f6755` | Mjuka byggklossar för barn, 5 delar, blå/grön/grå | Leksaker & Spel |
| `300a9113` | Kökssoptunna med pedal, 2 x 20 liter, svart | Kök & Husgeråd |
| `671465dc` | Vibrationsplatta, 120 hastighetslägen, med träningsband | Träning & Gym |
| `90214a8b` | Sittbänk i vintagestil med knappdekor, beige | Hem & Inredning |
| `fdea573f` | Blomlåda med spaljé, väderbeständig polyrotting, grå | Trädgårdsdekor & Belysning |

Alla sex kategori-ID:n verifierades mot ett färskt
`categories/v1/categories/query`-svar (55 kategorier totalt) innan skrivning.

## Screening före polering — två kandidater stoppade

Urvalet startade på fler än sex kandidater. Två föll bort innan poleringen
ens började, per husets stående dubblett-/varumärkespolicy:

- **`4b49e851` är intern dubblett av redan publicerade `e580e506`** — samma
  fysiska vara, samma färg. Se backlogg #295. Publiceras inte.
- **`6a5c831a`** (en katzenhaus-kandidat) bär **PawHut tryckt på själva
  produkten** i källbilderna. Se backlogg #296 — Leonards beslut om
  husmärkta produkter generellt gäller här också. Publiceras inte.

En tredje kandidat, `90214a8b` (sittbänken), matchar en redan publicerad
produkts formgivning men i en **genuint annan färg** — inte en exakt
produkt+färg-match mot en publicerad sida, alltså inkluderad enligt policyn
"om det inte är exakt samma produkt och färg ska den poleras."

## Kvittokedjan

Varje led är MÄTT, inte antaget. Ett svar utan fel är inget kvitto.

| led | utfall |
| :-- | :-- |
| `gate.py` | 0 fynd i 6 filer (siffergrind mot `kallor.json`), 0 varningar |
| `gate-seo.py` | 0 fynd i 6 rader |
| `gate-alt.py` | GRIND REN: 6 produkter, 28 alt-texter, 0 fynd |
| `gate-sku.py` | 0 fynd i 6 rader (längst 30 av 40 tecken) |
| `gate-lankar.py` | 0 fynd, 0 unika mål hämtade |
| `gate-superlativ.py` | GRIND REN: 6 filer, 0 kvitterade superlativ |
| `gate-kort.py` | 0 fynd i 6 kort (siffergrind mot `kallor.json`) |
| Kortens md5 i BÅDA ändarna | 6 av 6 byte-identiska (kort-n15-tmp → nedladdat → jämfört) |
| Steg 1 — text/namn/slug/SEO/synlighet | 6 av 6 skrivna. Checksumguarden avbröt EN gång på ett eget kopieringsfel (se nedan) innan den korrekta versionen skrevs |
| Steg 2 — media ENSAMT, kortet sist | 6 av 6 skrivna (fem produkter à 6 poster, `671465dc` à 4 — två positioner var tyskbrända och uteslutna) |
| Steg 3 — kategorier | 6 av 6 kopplingar (`BulkAddItemToCategories`, `totalFailures: 0` på alla sex) |
| Steg 4 — `variantsInfo` SIST och ENSAMT | 6 av 6, svensk SKU skriven, variantobjektet round-trippat oförändrat utom `sku` |
| Separat läsning en stund efter skrivningen | **6 av 6 helt OK**: plainDescription-hash 6/6 LIKA, bildantal 6/6 rätt, SKU svensk 6/6, produkt+variant synliga 6/6, kategori kopplad 6/6 |
| `hamta-live.sh` + `livegrind.py` mot de publicerade sidorna | **5 av 6 REN på orddiff (0 avvikelser i texten på alla sex)** — en varning, se nedan |

## Steg 1 — checksumguarden fångade min egen kopieringsmiss

Vid den första körningen av Steg 1 introducerades av misstag en dubblerad
`<h2>Användning och skötsel</h2>`-rubrik i `fdea573f`:s HTML under
manuell inklistring av `steg1.js`. Guarden (`SUMMA(p.html) !== p.raa`)
upptäckte det korrekt — beräknad hash 821079815 mot väntade 429916418,
längd 2891 mot väntade 2859 — och avbröt **HELA batchen** innan någon
skrivning skedde:

```json
{"AVBRUTET":"transkriberingsfel — ingenting skrivet","avvik":[...]}
```

Exakt spärren som byggdes för det här: den skyddar lika mycket mot en AI:s
egen kopieringsmiss som mot en människas. Fixat genom att läsa tillbaka
`steg1.js`:s exakta innehåll för `fdea573f` och skicka om hela anropet, som
då gav "6 av 6 skrivna".

## `300a9113`: livegrind flaggade OutOfStock — mätt, inte en bugg

`livegrind.py` fällde kökssoptunnan med `SLUTSALD`: sidan är publicerad men
renderar OutOfStock. Enligt grindens egen instruktion — "läs lagret innan du
lagar något" — kontrollerades `inventory-items/query` direkt:

```
quantity: 0, trackQuantity: true, availabilityStatus: "OUT_OF_STOCK"
updatedDate: 2026-09-18T22:14:20Z   (variantVisible: true, sku korrekt)
```

Saldot är genuint 0, uppdaterat av Aosom-synken (`20 */6 * * *`) nästan i
exakt samma stund som live-verifieringen kördes. Det är fall (a) i grindens
egen varningstext: **saldot är 0, och då är sidan korrekt** — inte fall (b)
(variantens `visible` felaktigt `false` trots saldo; den separata
återläsningen ovan bevisade redan `variantSynlig: true`). Ingenting att laga
här: nästa Aosom-synkkörning återställer sidan automatiskt så fort
leverantören har varan i lager igen, exakt som `LAGER_BUFFERT`-mekaniken är
byggd för att göra.

## Bildaudit — vad som uteslöts

**`671465dc`** (vibrationsplattan): två av fem källpositioner var
tyskbrända (LED-display i närbild med tysk text) och uteslöts. Produkten
gick ut med 3 foton + kort i stället för 5 + kort.

## Alt-text-korrigeringar hittade genom att titta på bilderna igen

Fem innehålls-/positionsfel restes av en proaktiv omgranskning av de
faktiska bilderna (inte av någon grind — grindarna kan bara se siffror och
ordlistor, inte bildinnehåll):

- **`163ce1e2`** (skoskåp): position 4:s alt-text nämnde en radio som i
  själva verket satt i position 2:s bild; position 5:s alt-text påstod ett
  exakt antal skor utan täckning i bilden. Båda rättade.
- **`1d3f6755`** (byggklossar): position 4:s alt-text nämnde en cylinder som
  inte syns i bilden (grå block + blå kub + grön ramp, ingen cylinder).
  Rättad.
- **`671465dc`** (vibrationsplatta): alla tre kvarvarande positioner var
  en TREVÄGS förväxling — position 1 (hopfälld, ingen person) hade fått
  position 2:s "kvinna tränar"-text, position 2 hade fått position 3:s
  måttritningstext, och position 3 (den faktiska måttritningen) hade fått
  en beskrivning som hörde till den redan uteslutna, tyskbrända position 4.
  Alla tre rättade till att matcha sin egen bild.

## Textfel som gate.py fångade

- **`163ce1e2`**: "Kippsäker"/"kippsäkra" (tysk-svensk hybrid, på
  `STAV_ORD`-listan) → rättat till "Vältsäker"/"vältsäkra" på båda
  ställena texten förekom.
- **`300a9113`**: "Pedalen" flaggades av `gatelib`s TYSKA_ORD-lista (ett
  ord tillagt för en tidigare runda, äkta falsklarm här — "pedalen" är
  korrekt svenska för den här produkten). Ordlistan rördes INTE (orden får
  bara läggas till, aldrig tas bort); meningen skrevs i stället om med "en
  pedal" (obestämd form, matchar inte listans böjda former).
- **`671465dc`**: "fyra kraftiga sugproppar" — källan säger bara "starken
  Saugnäpfen" utan antal. "Fyra" togs bort på två ställen (både
  brödtexten och Egenskaper-listan; det andra stället missades i första
  rättningen och fångades av en omkörning av gate.py).
- **`300a9113`**: alt-texten citerade "78 cm" (synligt i måttritningen) utan
  källtäckning — talet togs bort ur alt-texten i stället för att läggas i
  `foto-tal.txt`, eftersom det var en mindre/icke-väsentlig detalj.

## Vad som INTE hittades den här rundan

Inga axelfel, inga trasiga länkar, inga SKU-kollisioner, inga tyska
SEO-titlar, alla sex är enkla produkter utan variantaxlar (en variant per
produkt) — `options`-fältmask-fällan för flervariantsprodukter gällde
alltså inte den här rundan.
