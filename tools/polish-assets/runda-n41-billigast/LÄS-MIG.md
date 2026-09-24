# Runda N41 — tio produkter, 469–499 kr

Tio Aosom-utkast polerade och publicerade: ett regnskydd för cykelvagn, en
LED-björk på 120 cm, ett vinställ i bambu för 16 flaskor, en babygunga 3-i-1,
en vattenkokare med sju temperaturlägen, tre lysande halloweenspöken, en
krypande halloweenzombie, två väggtavlor i metall, en balanscykel med tre hjul
och en vit julgran på 180 cm.

**Andra rundan utan agenter**, i huvudsessionen, tio produkter per vända
(Leonards besked 2026-09-23). Urvalet är billigast först utan prisjämförelse,
som i N40. Allt är pushat på grenen `claude/seo-polering-runbook-review-uq6fwl`.

| id | produkt | SKU | pris | saldo |
|---|---|---|---:|---:|
| e3256412 | Regnskydd för cykelvagn – genomskinligt, passar kupéer upp till 76 × 61 × 61 cm | FP-regnskydd-cykelvagn-genomskinligt | 469 kr | 90 |
| 3d3f90d3 | LED-björk 120 cm med 72 varmvita lampor – för inomhus och utomhus under tak | FP-ledbjork-120-72-lampor | 479 kr | 197 |
| 6baeb38b | Vinställ i bambu för 16 flaskor – fyra plan, bär 75 kg, 43 × 23,5 × 38 cm | FP-vinstall-bambu-16-flaskor | 479 kr | 67 |
| 8fc578fc | Babygunga 3-i-1 med ryggstöd och säkerhetsbygel – rep 120–180 cm, bär 70 kg | FP-babygunga-3i1-ryggstod-bygel | 479 kr | 51 |
| acc9ab97 | Vattenkokare 1,7 liter med sju temperaturlägen 40–100 °C – 2200 W, svart | FP-vattenkokare-17l-temperaturval | 479 kr | 156 |
| 42949f67 | Halloweenspöken, tre stycken – lysande huvuden och rörelsesensor, 60 cm höga | FP-halloween-spoken-tre-lysande | 499 kr | 197 |
| 5e126c2f | Krypande halloweenzombie 140 cm – ljud och ögon som lyser rött | FP-halloween-zombie-krypande-140 | 499 kr | 197 |
| 050db4d8 | Väggdekor i metall, två tavlor – blad i svart och natur, 40 × 46 cm | FP-vaggdekor-metall-blad-tva | 499 kr | 37 |
| 1c92e587 | Balanscykel med tre hjul för 12–36 månader – tysta EVA-hjul, sitthöjd 26,5 cm | FP-balanscykel-tre-hjul-12-36 | 499 kr | 5 |
| 1f887213 | Vit julgran 180 cm i smal modell – 390 grentoppar, fot som viks ihop | FP-julgran-vit-180-smal | 499 kr | 102 |

**Inget pris är rört.** Prisgrinden stämde (`x1,2`, `charm99`) både i
urvalets `las` och i verifieringen efter stämpeln.

## Urvalet — billigast först, utan prisjämförelse

Katalogen svepades ofiltrerat (61 sidor, 6 025 rader). Varje utkast upp till
549 kr prövades mot alla rundors `ids.tsv`, `FLAGGADE.md` och main:s "Runda
…"-serie (oförändrad sedan N40, senast Runda 147). N40 hade lämnat fyra
produkter först i kön: två oprövade och två reserver. De prövades först.

| skäl | id |
|---|---|
| saldo 2, på eller under `LAGER_BUFFERT` | `0b34e594` julgirlang (469 kr) |
| möjlig dubblett av en publicerad sida (trippelträff) | `7febe06d` skobänk i bambu mot publicerade `8f0a4df1` |
| säsong: trädgård i slutet av september | `3ec9a0f5` utomhusmatta |
| reserver, dubblettskärmade men inte `las`-prövade | `2cfd222e`, `3e2c7389`, `520cc521`, `5c5aedca`, `7f21945e` (alla 499 kr) |

Bland produkterna för 499 kr gick de två halloweenprodukterna först, eftersom
den säsongen tar slut om sex veckor. Resten togs i id-ordning. Dubblettskärmen
körde i N38–N40:s form (ofiltrerat svep, `fields` på varje sida,
trippelmönstrets självtest 9 av 9, `utanText` 0). Den hittade 3 129
publicerade sidor och 2 896 utkast. Varje trippelträff mot en vald produkt är
genomläst i `framsteg.md`. Utom skobänken är alla andra varor med samma tal.

## Källan och bilderna — granskade före texten

`kallor.json` transkriberades ur V3 och verifierades server-side med längd,
h·31 och varje block om 250 tecken: **10 av 10 LIKA**. `bilder.tsv` mot
`media.itemsInfo.items` i ordning gav också **10 av 10 LIKA**.

☠️ **Tre källtexter bär leverantörens artikelnummer** i `Technische Daten`
(`acc9ab97`, `42949f67`, `5e126c2f`). I facit är numret ersatt med
`‹REDIGERAT›`, och kontrollen gjorde samma ersättning server-side före
summan. Det gav **exakt en träff** på var och en av de tre och noll på de
andra sju.

`las` (körningarna 3901–3910, `ref: main`) var grön på alla tio: `aosom`,
`needsAiPolish: true`, `pending_review`, prisgrind `stämmer: true`, inget
`LÅST PRIS` och ingen `SLUTSALD`.

Kontaktarken byggdes innan en rad text skrevs. Sex bilder ströks:

- **`e3256412`** bild 2, där husmärkets logga syns på cykelvagnen i bilden,
  och bild 3, som har tysk text inbränd. Tre bilder är kvar.
- **`8fc578fc`** bild 4, **`acc9ab97`** bild 4 och 5, och **`1c92e587`**
  bild 4, alla med tysk text inbränd.

Rättelser mot källan, alla ur bilderna:

- **`e3256412` är ett regnskydd, inte en vikgarage.** Aosoms namn säger
  "Faltgarage", men källtexten och alla bilder visar ett genomskinligt skydd
  som träs över kupén. Den strukna bild 3 anger att det passar kupéer mindre
  än 76 × 61 × 61 cm och att skjuthandtaget ska tas av. Bild 4 visar
  handtaget på plats utanpå skyddet. Texten säger alla tre sakerna.
- **`42949f67`** står på spett i marken. Det syns på alla foton men nämns inte
  i källtexten.
- **`1c92e587`** har ett hjul fram och två bak.
- **`050db4d8`**: källans leveransinnehåll säger "1 x Wanddekoration", men
  namnet, beskrivningen och bilderna visar ett set om två. Måttbilden visar att
  40 × 46 cm gäller per tavla.
- **`1f887213`** är en VIT gran. Pyntet på bilderna ingår inte, och texten
  säger det.

## Grindar före skrivningen

| Grind | Resultat |
|---|---|
| `gate.py` | **0 fynd, 0 varningar** |
| `bygg-axelfacit.py` + `gate-axel.py` | **0 axelfel** i 10 texter |
| `gate-alt.py` | **REN**, 44 alt-texter |
| `gate-seo.py` | **0 fynd** (efter en rättelse, se nedan) |
| `gate-lager.py` | **0 fynd**, lägsta saldo 5 |
| `gate-sku.py` | **0 fynd** (längsta 36 av 40 tecken) |
| SKU-krock (63 `sku.tsv`, 497 SKU:er) | **0** |
| Slug-krock (6 025 slugs i katalogen + 650 i rundornas `slugs.txt`) | **0** |
| `gate-superlativ.py` | **REN** |
| `gate-lankar.py` | **0 fynd** |
| Läck- och teckensvep, 15 kundvända filer | **0 fynd** |
| Formsvep efter artikelnummer i hela rundkatalogen | **0 träffar** |
| `npx vitest run lib/polish` | **99 av 99** |

⚠️ **`gate-seo.py` fällde "3-i-1" i gungans SEO-titel.** Grinden jämför
SEO-talen mot den SVENSKA brödtexten, inte mot den tyska källan, och
brödtexten sa bara "tre sätt att gunga". Nu börjar inledningen med "En
babygunga 3-i-1". Det står också i källan ("3-in-1-Design"). Grinden är inte
ändrad.

## Två granskningar före skrivningen — båda egna

**Korrekturläsningen** gav elva ändringar i sex filer, alla språkliga:

- Regnskyddets text blandade "ni" och "du".
- Zombien kallades omväxlande "hon" och "den".
- Sex ord upprepades i närliggande meningar: "temperaturen", "automatiskt",
  "passar", "varandra", "djup" och "Hjulen".
- "för cykelvagn för barn" hade ett "för" för mycket.
- En skötselrad för väggtavlorna sa både "med de medföljande krokarna" och
  "välj fästen som passar din vägg".

**Den skeptiska granskningen** ställde varje påstående mot källan och
bilderna. Den gav två ändringar, båda i regnskyddet. Skötseltexten sa att
skjuthandtaget tas av, men inte att det sätts tillbaka. Alt-texten till bild 4
kallade handtaget "ramen". Båda säger nu vad bild 4 visar.

## Skrivningen, stämpeln och verifieringen

Rundans filer pushades före Wix (`ed499df`), och main kontrollerades en gång
till omedelbart före steg 1.

| steg | resultat |
|---|---|
| 1 namn/slug/brödtext/`visible`/SEO, spärr över text OCH namn/slug/SEO i samma anrop | **10 av 10**, ingen spärr utlöst |
| 2 media (fil-id + alt, måttbilden sist) | **10 av 10**, 44 bilder |
| 3 kategorier (bulk add-items, uppslag på namn i samma anrop) | **26 av 26 rader success** i femton kategorier, `totalFailures: 0` |
| 4 variant-SKU sist och ensam, round-trip med `options` och `visible` | **10 av 10**; variant och produkt synliga före, pris orört |
| 5 separat återläsning | **10 av 10 helt verifierade** |
| stämpel (`stampla`, körningarna 3911–3920) | **10 av 10** gröna |
| stämpeln verifierad med en EGEN `las` per produkt (3921–3930) | **10 av 10** `needsAiPolish: false`, `published`, rätt SKU, pris orört |

Varje workflow-körning bevisades som min på produktens id i loggen innan
utfallet lästes.

## Live-verifieringen och den andra korrekturläsningen

`hamta-live.sh 130`: alla tio `HTTP 200` med `age` 143–147. `livegrind.py`:
**10 av 10 REN, orddiff 0**. Ur samma sidor, kontrollerat med skript mot
rundans filer:

- JSON-LD `InStock` på alla tio, och priset orört (469/479/499 kr).
- Kategorin syns i brödsmulan.
- Namnet i JSON-LD stämmer mot `namn.tsv`, och `<title>` och
  metabeskrivningen stämmer exakt mot `seo.tsv`.
- **44 av 44** alt-texter ur `alt.tsv` står på sidorna.

**Den andra korrekturläsningen** gjordes på den PUBLICERADE texten, plockad
mekaniskt ur sidorna. **Den gav inga fynd.** Tre ställen prövades mot källan
och står sig:

- "3 AA-batterier" för spökena. Källan säger `3 x AA-Batterie`, som totalt,
  och texten säger inget mer än så.
- Badrummet i väggdekorens rumslista. Källan säger `Geeignet für Bad`.
- Granens grenmått 33 × 6 cm. Det är källans `Zweigmaße`.

Ingen rättelse behövdes, alltså inget omskrivningsanrop.

## `FLAGGADE.md` — nya rader

Inga befintliga rader rörda, bara tillägg:

- `7febe06d` skobänk i bambu — trippelträff mot publicerade `8f0a4df1`.
- `0b34e594` julgirlang — saldo 2; prövas igen när saldot stigit.
- En rad som säger att N40:s kö är tömd: `e3256412`, `3d3f90d3` och
  `6baeb38b` är publicerade i N41.
- Reserverna `2cfd222e`, `3e2c7389`, `520cc521`, `5c5aedca` och `7f21945e`.
- ⚠️ **Tillagd vid avslutet:** `520cc521` bland reserverna är inte en egen
  vara. Den är den GRÖNA versionen av den vita granen `1f887213`, som
  publicerades i den här rundan. Källtexten är densamma, och måtten står som
  `Ø55 x H180` — en diameter, som trippelskärmen inte kan läsa. Därför fångade
  dubblettskärmen den inte. Raden ovan står kvar, med en rättelse under den.

## Frågor till Leonard

1. **Skobänken `7febe06d`** (499 kr) trippelmatchar en publicerad skobänk
   (629 kr). Samma fråga som sockervaddsmaskinen i N40: är det samma bänk står
   ett billigare utkast bakom en publicerad sida.
2. **Regnskyddet** passar kupéer upp till 76 × 61 × 61 cm. Texten ber kunden
   mäta sin vagn. Om vi säljer en cykelvagn där skyddet passar, vore en länk
   mellan sidorna värd att lägga till.

## Faktakort

Faktakorten är medvetet uppskjutna, som i N15–N40. Rundan räknas som klar
utom dem.

## Filer i katalogen

Skrivna för rundan: `bygg-kallor.py` (som bygger `kallor.json`), de tio
`<id>.html`, `namn.tsv`, `slugs.txt`, `seo.tsv`, `sku.tsv`, `alt.tsv`,
`bilder.tsv`, `bilder-bort.tsv`, `kategori.tsv`, `lager.tsv`, `variant.tsv`,
`ids.tsv` och `framsteg.md`.

Genererade av `polish-gates` ur dem: `axelfacit.json`, `raa-hash.tsv`,
`vantat-hash.tsv`, `nyttolast-media.json`, `medieskrivning.json`,
`media-hash.tsv`, `steg1-bas.js` och `steg2.js`.

Genererade av rundans `bygg-steg.py` (kopierad från N40 med rundnamnet
ändrat): `steg1.js` (gitignorerad), `steg3.js`, `steg4.js` och `steg5.js`.

De hämtade live-sidorna (`live/`) är gitignorerade. Kontaktarken och
originalbilderna ligger utanför repot, som i tidigare rundor.
