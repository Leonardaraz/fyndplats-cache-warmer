# Order 10031 — finns varan hos Aosom? Nej. (2026-09-08)

Leonards fråga: *"Fick en beställning 10031 kolla upp artikeln och sök igenom om
den finns bland aosom de produkter som dublett så mappar vi om o köper därifrån
istället"*.

**Svaret är nej, och det är mätt i BÅDA riktningarna** — mot hela katalogen och
mot hela feeden, inte mot den importerade delen.

## Vad som beställdes

| | |
|---|---|
| Order | 10031, `46afd1ee-67ad-40c1-b0a4-6849c06e3ea5` |
| Betald | 2026-09-08 10:39 UTC, PAID, **NOT_FULFILLED** |
| Summa | 989,00 kr, 1 st |
| Produkt | `51611305-d9e4-431f-8322-74cccc086cf7` — "Vägghängt sängbord 2-pack – svävande nattduksbord med RGB-LED och app-styrning" |
| Vald variant | `08aa3fa3-…` / `FP-vagghangt-sangbord-ek` |

## ☠️ Varan ÄR en Aosom-vara — men bara i AliExpress-halvan

Mappningsraden säger det rakt ut:

```
seoTitle           Homcom Set of 2 Floating Nightstands with Rgb Led Lights App Control,
supplierName       Sold ByAosom ES (EU) Store(Trader)
supplierProductId  1005010501648131          ← AliExpress-listning
shipsFromCountries ES        hasEuWarehouse true
landedCostSek      759,43    grossSek 989
```

Det är alltså exakt den klass av rad `CLAUDE.md` beskriver: en HOMCOM-vara vi
köper via AliExpress i stället för ur B2B-feeden. Frågan "finns den också i
feeden?" är därför den rätta frågan att ställa — och den är nu ställd.

## Fysisk identitet (ur spec-tabellen på sidan)

Antal 2 st · **37 × 32 × 21 cm** per bord · lådans innermått 29 × 23,5 × 7 ·
öppet fack 34 × 30 × 8,5 · melaminbelagd träskiva · vit eller ekdekor ·
**RGB-LED, app-styrd** · USB 5 V / 2 A · 15 kg per bord, 5 kg per yta ·
vägghängd.

## Mätning 1 — hela katalogen: ingen intern dubblett

Alla **5 553** produkter svepta (`POST /stores/v3/products/search`, fyra pass,
sista med `cursor: null`), namnen filtrerade på
`sängbord|nattduksbord|nachttisch|beistelltisch|schwebend|wandmontier|nachtschrank|wandregal|…`.
De fyra närmaste jämförda spec mot spec:

| sida | mått per bord | LED | antal | dom |
|---|---|---|--:|---|
| **51611305 (beställd)** | **37 × 32 × 21** | **RGB + app** | **2** | — |
| `1fe7b746` (tyskt utkast) | 40 × 30 × 14 | nej | 2 | annan vara |
| `739d7601` (tyskt utkast) | 40 × 39,5 × 35 | nej | 1 | annan vara |
| `d61f504b` (tyskt utkast) | 45 × 40 × 59, golvstående | RGB, ej app | 1 | annan vara |
| `b37d426f` (publicerad) | 45 × 35 × 52, golvstående | RGB + app | 1 | annan vara |

`b37d426f` är intressantast: **samma ljussystem och samma lasttal** (15 kg /
5 kg, USB 5 V 2 A) men golvstående med två lådor. Samma leverantörsfamilj,
inte samma artikel.

## Mätning 2 — hela feeden: artikeln finns inte hos Aosom

`/api/admin/aosom-feed-search` via workflowen, `allaRader=1` (alltså även rader
som inte går att skicka till Sverige), **6 087 rader**:

| fråga | träffar | vad de var |
|---|--:|---|
| `nachttisch led` | 3 | två lampor + `83D-216V90WT` (golvstående) |
| `nachttisch rgb` | **1** | `83D-216V90WT`, samma golvstående |
| `nachttisch wandmontiert` | **1** | `83D-120V90WT`, 2-pack utan LED |
| `schwebend nachttisch` | **0** | — |
| `nachttisch` (hela familjen) | ~39 | ingen med både vägghängt, 2-pack och LED |

**Feeden har alltså EN RGB-nattduksbordsmodell, och den är golvstående.** Den
vägghängda 2-packen med app-styrning finns inte i den tyska B2B-listan.

## Vad det betyder

1. **Ingen ommappning.** Det finns inget artikelnummer att peka om till.
   `aosom-remap` hade avvisat den ändå (steg 3: numret måste finnas).
2. **Ordern läggs som vanligt hos AliExpress.** Varan ligger i Aosoms
   EU-lager i Spanien (`hasEuWarehouse: true`), så leveranstiden är den korta
   redan — det är inte ett Kina-köp som hade tjänat på att bytas.
3. **Priset rörs inte.** Prisgrinden svarar `EJ AVGÖRBAR` (raden är ingen
   Aosom-import, så regeln från 2026-08-27 gäller den inte).

⚠️ **Sidoobservation, inte en åtgärd:** `83D-022V90WT` — *"Nachttisch hängend
Beistelltisch mit Schublade, offenes Fach, 39,8 × 35 × 31,6 cm"*, 584,55 kr
landat, saldo 9 — finns i feeden men inte i katalogen. Det är en ENKEL
vägghängd modell utan belysning, alltså inte den här varan. Värd en egen titt
vid nästa importrunda, inte här.

## Lärdomen

**Katalogen är inte feeden.** Ett svep över de 5 553 importerade produkterna
kan bara svara "vi har ingen sådan sida" — det är feed-sökningen som svarar
"Aosom har ingen sådan artikel". Frågan Leonard ställde krävde båda, och det
är precis därför `aosom-feed-search` byggdes efter order 10027.
