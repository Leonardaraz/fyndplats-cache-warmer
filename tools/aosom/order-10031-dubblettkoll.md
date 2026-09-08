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

## Dubbelkollen: samma fråga en gång till, men på MÅTTEN (Leonards begäran)

⚠️ **Det första katalogsvepet var svagare än det såg ut.** Det matchade på
PRODUKTNAMN — och Wix kapar namn vid ~80 tecken, så en sida vars särskiljande
ord ligger efter kapningen är osynlig för ett namnsvep. Ett tyskt utkast som
heter *"2er-Set schwebende Wandregale mit RGB-LED-Beleuchtung und App-Steuerung,
Weiß…"* hade räknats bort på fel grund.

Svepet är därför gjort om mot **brödtexten**, med varans egna mått som
fingeravtryck. Fem pass, sista till `cursor: null`:

| | |
|---|---:|
| Produkter granskade | **5 553** |
| Varav utkast / publicerade | 3 204 / 2 349 (Steg 1-mätningen samma dag) |
| Fält som lästes | `name` + `plainDescription` |

Tre STARKA fingeravtryck (måtten är unika för varan) och en
egenskapskombination som måste finnas i samma text:

```
37 x 32 x 21        yttermått per bord
29 x 23,5 x 7       lådans innermått
34 x 30 x 8,5       öppet fack
kombo:  RGB  +  app/bluetooth  +  vägghängd/wandmontiert/schwebend
```

### Utfallet

☠️ **Den beställda varan matchade sina EGNA tre fingeravtryck och kombon.** Det
är kvittot att grinden fungerar — ett svep som inte hittar ens originalet bevisar
ingenting alls:

```
51611305  Vägghängt sängbord 2-pack …   synlig: true
          ytterm 37x32x21 · lada 29x23,5x7 · fack 34x30x8,5 · kombo ✔
```

**Ingen annan produkt i katalogen matchade ett enda av de tre måtten.** Fyra
rader föll ut på det svaga halvmåttet eller på kombon, och alla fyra är
uppenbart en annan vara:

| id | vad det är | varför den föll ut |
|---|---|---|
| `c9ab8531` | solcellslykta 182 cm (utkast) | `37x32` i paketmåttet |
| `b2a73ee9` | bänkdyna 150 × 100 × 10 cm (utkast) | `37x32` i en måttrad |
| `3a42c047` | Hollywood-sminkspegel med LED (utkast) | RGB + app + hängande |
| `912dca9f` | **sängbas** med RGB, 140 × 190 cm (publicerad) | RGB + app + svävande |

Den sista är den enda som ens är i närheten av samma ordvärld — och en sängbas
på 140 × 190 cm är inte ett nattduksbord på 37 × 32 cm.

### Vad kollen nu vilar på

Tre oberoende mätningar, alla körda till slutet:

1. **Namnsvep** över 5 553 produkter — fyra kandidater jämförda spec mot spec.
2. **Måttsvep** över samma 5 553 produkter, publicerade OCH utkast — noll
   träffar utöver varan själv.
3. **Feedsökning** över Aosoms 6 087 rader med `allaRader=1` — den vägghängda
   2-packen med app-styrning finns inte i den tyska B2B-listan.

**Regeln, och den är ny här: ett namnsvep i den här katalogen är ett SVAGT
bevis.** Namnen är kapade, de tyska utkasten är kapade mitt i meningen, och det
som skiljer två varor åt hamnar ofta efter kapningen. Ska en dubblett bevisas
BORTA måste svepet gå på måtten.

## ☠️ Tredje svepet — för det ANDRA hade ett hål jag inte såg

Leonard bad om dubbelkollen en gång till. Det var befogat: mönstret i svep 2 var
`37\s*x\s*32\s*x\s*21`, och **Aosom skriver måtten som `37B x 32T x 21H cm`.**
Bokstaven sitter MELLAN talet och x:et, så mönstret kunde aldrig matcha en tysk
måttrad. Varan hittades bara för att dess EGEN text är polerad svenska.

Med andra ord: svep 2 sökte efter en dubblett i den enda form en dubblett
troligen INTE har. Ett opolerat tyskt utkast — och 3 204 av katalogens sidor är
utkast — hade varit osynligt.

### Omgjort med tolerant sifferutvinning

Talen plockas nu ut oavsett vad som står emellan, och jämförs som **mängd**,
eftersom ordningen (B×D×H mot L×B×H) skiljer mellan språken:

```
TAL     (\d{1,4}(?:[.,]\d{1,2})?)
MELLAN  \s*[a-zäöüß]{0,2}\s*[x*×]\s*      ← släpper igenom B, T, H, L, W
```

**Att grinden verkligen läser tyska bevisas av täckningen:** den hittade
måttripplar i **5 126 av 5 553 produkter** (1 183 · 1 155 · 1 189 · 1 109 · 490
per pass). De fyra första passen är nästan uteslutande tyska utkast.

### Utfallet — fem pass, sista till `cursor: null`

| | |
|---|---:|
| Produkter granskade | **5 553** (publicerade **och** utkast) |
| Med minst en måttrippel | 5 126 |
| Träffar på någon av de tre måtten | **1** |

```
51611305  Vägghängt sängbord 2-pack …   synlig: true
          yttermått 37/32/21 ✔   låda 29/23,5/7 ✔   fack 34/30/8,5 ✔
```

**Varan hittade sig själv på alla tre måtten. Ingen annan produkt matchade ett
enda av dem.**

Elva rader föll ut på de svaga TVÅ-talsparen (37/32 respektive 34/30), och alla
elva är en annan produkttyp: konsolbord, kattorn, hönsgård, fågelbur,
balkongmöbelset, sidobord, två badrumsskåp, två köksvagnar, två städvagnar,
verkstadspall och en hallbänk. Ingen av dem är ett nattduksbord.

### Regeln, och den är dyrare än den ser ut

☠️ **En måttgrind måste skrivas för leverantörens FORMAT, inte för vårt eget.**
Vår polerade text skriver `37 × 32 × 21 cm`; Aosoms tyska källa skriver
`37B x 32T x 21H cm`. En grind byggd på den polerade formen letar bara bland de
sidor som redan är polerade — alltså exakt den halva där en oupptäckt dubblett
minst troligt sitter.

Och den generella: **en grind som hittar sitt eget facit har bevisat att den
fungerar; en grind som inte gör det har inte bevisat någonting.** Svep 2 hittade
originalet — men bara för att originalet var polerat, vilket dolde att den var
blind för resten.

## Fjärde och femte svepet: produkttypen, och bilderna

Två hål återstod efter måttsvepet, och båda är nu stängda.

**Hål 1 — 427 produkter saknar måttrippel helt.** De är per definition osynliga
för en måttgrind. **Hål 2 — en dubblett vars säljare skrivit ANDRA siffror**
hade också missats.

Båda stängs av att söka på PRODUKTTYPEN i brödtexten, på båda språken och
oberoende av mått:

```
(nachttisch|nachtschrank|nachtkommode|nachtkonsole|nattduksbord|sängbord|nightstand|bedside)
```

plus ett skyddsnät för väggmonterad möbel UTAN mått, så inget faller mellan.

### Nattduksbordsuniversumet är sex sidor

Fem pass, `cursor: null`, 5 553 produkter. **53 sidor** nämner produkttypen —
de flesta är bordslampor som säger "passar på nattduksbordet". Av dem är
**exakt sex vägghängda eller svävande**, och alla sex är redan jämförda spec
mot spec:

| sida | mått per bord | LED | antal | dom |
|---|---|---|--:|---|
| `739d7601` tyskt utkast | 40 × 39,5 × 35 | nej | 1 | annan vara |
| `1fe7b746` tyskt utkast | 40 × 30 × 14 | nej | 2 | annan vara |
| `91c4388b` publicerad | 40 × 30 × 25 | nej | 2 | annan vara |
| `c62d1496` publicerad | 40 × 30 × 15 | nej | 2 | annan vara |
| `d51d6981` publicerad | 46 × 30 × 30 | nej | 2 | annan vara |
| **`51611305`** | **37 × 32 × 21** | **RGB + app** | **2** | **den beställda** |

Skyddsnätet (väggmonterat utan mått) gav nio rader: chinsstång, tre
väggspeglar, boxningsdyna, skötbord, aktivitetstavla, torkställning,
dipsställning. Inget nattduksbord.

### Bilderna — den axel `CLAUDE.md` säger är den avgörande

*"Det Google DÄREMOT ser är bilderna."* Två sidor som delar bildfil är samma
fysiska vara oavsett vad texten säger. Jämfört mellan den beställda och de fem
andra vägghängda:

| | bilder | delade filer med den beställda |
|---|--:|--:|
| BESTÄLLD `51611305` | 8 | — |
| `739d7601` · `1fe7b746` · `91c4388b` · `c62d1496` · `d51d6981` | 5–6 var | **0 · 0 · 0 · 0 · 0** |

## Så säker är jag — och exakt vad det betyder

**Sex oberoende mätningar, alla negativa:**

| # | metod | täcker | utfall |
|---|---|---|---|
| 1 | namnsvep | 5 553 | fyra kandidater, alla annan vara |
| 2 | måttsvep, svensk form | ☠️ blind för tyska | *kasserad* |
| 3 | måttsvep, tolerant form | 5 553 | 1 träff = varan själv |
| 4 | typsvep i brödtexten | 5 553 | 6 vägghängda, 5 avfärdade |
| 5 | väggmonterat utan mått | 427 | inget nattduksbord |
| 6 | delade bildfiler | de 6 | noll delade |
| — | Aosoms feed | 6 087 rader | artikeln finns inte |

⚠️ **Och det jag INTE har testat, sagt rakt ut:** jämförelsen i mätning 6 går på
FIL-ID, inte på pixlar. Två sidor kan bära samma foto som två olika Wix-filer —
det fångas bara av en hash- eller pHash-jämförelse, som inte är gjord. Kvar
finns också det teoretiskt smala fallet: en sida som beskriver samma vara med
andra siffror, ett annat produktsubstantiv OCH utan att nämna väggmontering.

**Slutsatsen är alltså inte "det kan inte finnas en dubblett" utan "sex
oberoende sätt att hitta en hittar ingen".** Det är så säkert katalogens egen
data kan göra det.

## Korsningen: matchade någon BÅDE måttet och typen? (Leonards fråga)

De två svepen hade aldrig korsats mot varandra — det var frågan värd. Svaret är
**ja, exakt en sida ligger i båda listorna**, och den är inte samma vara.

⚠️ **Först en rättelse av mitt eget tal.** Jag skrev "elva rader föll ut på de
svaga tvåtalsparen". Rätt tal, räknat ur alla fem passen, är **14**
(4 + 1 + 3 + 5 + 1). Slutsatsen ändras inte, men siffran var fel och stod som
mätt.

### Den enda som ligger i båda listorna

`084b987b` — **"Beistelltisch mit Stauraum, 2 offene Regale, 3-stufig
verstellbar"**, tyskt utkast, 799 kr.

Den föll ut i **måttsvepet** på paret 34/30, och i **typsvepet** på en enda
mening i den tyska säljtexten:

> *"…perfekt als modischer Beistelltisch oder schmaler **Nachttisch** in jedem
> behaglichen Winkel"*

Alltså: den kan ANVÄNDAS som nattduksbord, den är inte ett.

| | beställd `51611305` | korsningen `084b987b` |
|---|---|---|
| Yttermått | 37 × 32 × **21** | 34 × 30 × **80** |
| Antal | **2 st** | 1 st |
| Montering | **vägghängd** | golvstående |
| Belysning | **RGB-LED, app** | ingen |
| Ström | USB 5 V / 2 A | ingen |
| Maxlast | 15 kg per bord | 10 kg totalt |
| Material | melaminbelagd träskiva | spånskiva + stål |

Paret 34 × 30 är en vanlig möbelfotavtryck — det tredje talet är 80 mot 8,5.
**Ingen produkt utom varan själv matchade en hel måttRIPPEL.**

### Vad korsningen faktiskt visar

Att de två svepen fångar olika saker, och att båda behövs: måttsvepet ensamt
hade aldrig tittat på `084b987b` (bara ett tvåtalspar), och typsvepet ensamt
hade begravt den bland 53 bordslampor. Det är först i korsningen den blir en
kandidat värd att öppna — och först när den öppnas som den kan avfärdas på
höjden.

**De övriga tretton måtträffarna nämner inte produkttypen alls** (konsolbord,
kattorn, hönsgård, fågelbur, balkongset, två badrumsskåp, två köksvagnar, två
städvagnar, verkstadspall, hallbänk), och **de övriga 52 typträffarna matchar
inget mått** — de flesta är bordslampor vars text säger "passar på
nattduksbordet".
