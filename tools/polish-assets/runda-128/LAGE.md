# Runda 128 — LÄGE

**Nio verktygsskåp, verktygsvagnar och en svetsvagn. 9 av 9 LIVE och gröna.**

| kort | slug | pris | lager | SKU |
|---|---|--:|--:|---|
| `bc2e7191` | svetsvagn-71-cm-tre-hyllplan | 899 | 35 | `FP-svetsvagn-71-cm-tre` |
| `beeada22` | platskap-svart-110-cm-ventilerat | 1 699 | 3 | `FP-platskap-svart-110-cm` |
| `1654dd75` | verktygsvagn-96-cm-sju-lador | 2 479 | 197 | `FP-verktygsvagn-96-cm-sju` |
| `f2495eee` | verktygsvagn-5-lador-rostfri-skiva | 2 799 | 130 | `FP-verktygsvagn-5-lador` |
| `1db06f83` | verktygsskap-hjul-133-cm-halplatta | 3 149 | 41 | `FP-verktygsskap-hjul-133-cm` |
| `b920d526` | verktygsvagn-rod-16-lador | 3 449 | 76 | `FP-verktygsvagn-rod-16` |
| `d9965552` | verktygsvagn-bla-16-lador | 3 459 | 42 | `FP-verktygsvagn-bla-16` |
| `fc6fdd63` | verktygsvagn-14-lador-halvagg | 3 499 | 33 | `FP-verktygsvagn-14-lador` |
| `81c123fa` | verktygsskap-180-cm-tre-laszoner | 3 769 | 135 | `FP-verktygsskap-180-cm-tre` |

## Kvitton

| steg | mätning |
|---|---|
| 1 | svep 57 sidor / 5 649 rader / `avhuggen: false`, 44 publicerade träffar varav 23 verktygsförvaring |
| 4 | fyra bilder bort på tre produkter, alla med TYSK text i pixlarna |
| 6 | källgrind 41 + 43 självtestfall, 9 sidor, 0 fel |
| 7 | nio texter skrivna i tre omgångar, namn/slug/meta lästa tillbaka sanna, alla `visible:false` |
| 8 | nio SKU:er skrivna, **kontrollerade mekaniskt mot `skrivning.json`: 9 av 9**; krockkoll mot 28 syskon: **noll krockar** |
| 9 | 39 alt-texter, `altStammerExakt` sant på alla nio, `utanAlt: 0`, inget publicerat av misstag |
| 10 | Verktyg & Hemmafix på alla nio, läst TVÅ gånger |
| 12 | **9 produkter, 0 avvikelser** — teckenantal OCH teckenkodsumma mot facit |
| 13 | 9 av 9 publicerade, produkt OCH variant `visible: true`, brand `null`; nio stämplingar (Actions 2535–2543) + `las`-verifiering (2544) |
| 14 | 41 + 43 självtestfall, **9 sidor hämtade, 0 fel**, `x-vercel-cache: HIT`, `age=236` |

## Sju fynd

### 1. ☠️ Fyra av nio SKU:er var skrivna FÖR HAND — och stod ett token för korta

`FP-platskap-svart-110`, `FP-verktygsvagn-96-cm`, `FP-verktygsskap-hjul-133`,
`FP-verktygsskap-180-cm` — husregeln i `lib/import/sku.ts` ger ett token till
på varje. Runbookens Steg 8 säger det ordagrant efter att runda 51 fick tre
fel-SKU:er och runda 53 två. **Tredje gången.** Grinden räknar nu om varje SKU
ur `grindar.sku_bas()` (uppgift #483).

### 2. ☠️ Kvittot jämförde Wix mot MIN EGEN felskrivning

SKU-kartan skrevs om för hand i API-anropet. `81c123fa` tappade sitt sista
token på vägen — och återläsningen jämförde mot samma handskrivna literal och
svarade `skuStammer: true`. En tautologi. Runbooken säger "kontrollera
strängen, inte förekomsten"; den saknade halvan är VAD strängen jämförs MOT
(uppgift #485).

### 3. ☠️ Uppgift #357 reproducerade sig LIVE, i den här rundan

`81c123fa` läste tillbaka kategorin som **saknad** på första läsningen och
**satt** på den andra — med skrivningen rapporterad som `lyckade: 1,
misslyckade: 0` däremellan. `badaLasningarnaEniga: false` är kvittot. En
ensam läsning hade rapporterat ett fantomfel på en korrekt skrivning.

### 4. ☠️ Live-grinden var 219 rader TVILLING — nu 80 rader

Runda 127:s `livegrind.py` bar egna kopior av `_lador`, `_matten`, `_last`,
`_hjul` och `_rost`. Reglerna bor nu i `grind.granska(pid, html, live=True)`
och live-grinden skickar bara in butikens HTML. Skillnaden mellan lägena är
fyra rader i `grind.py`, inte 219 i en parallell fil.

### 5. ☠️ `butikstvatt` strök inte `<script>` — 2 513 falska fel

Uppgift #413, mätt: `synlig_meningstext` läser script-innehåll, så Next.js
RSC-payload räknades som synlig kundtext. Nio korrekta sidor gav 2 513 fel,
varenda ett ur butikens chrome. **Lagat i `grindar.butikstvatt`**, alltså för
alla framtida rundor — inte per runda.

### 6. ☠️ Och 369 till ur butikens SYNLIGA chrome

Efter script-strykningen återstod `★★★★★` i betygsraden, `Visa produkt →` i
rekommendationskorten och `©2021–2026 Fyndplats · Trygg svensk e-handel` i
sidfoten. `egna_meningar` räddar inte det — den stryker GRANNARNAS meningar,
och sidfoten nämner ingen granne. **Homoglyfgrinden är källans**: den letar
efter tecken som smugit sig in i text VI skrev, och den renderade sidan bär
butikens egen typografi.

### 7. ⚠️ Lådspärren fällde "med alla lådor STÄNGDA"

Grindens första utkast matchade `alla lådor` oavsett riktning. Meningen är
fullkomligt säker. Grinden kräver nu ett öppet-ord i samma mening, och BÅDA
riktningarna är låsta i självtestet.

## Till Leonard

**☠️ `81c123fa`:s färg är inte avgjord.** Leverantörens spec-block och tyska
titel säger båda "svart". Mätt på studiobilden ligger dörrarna på RGB 66–79
medan `beeada22`, som är svart i samma batch och samma bildkonvention, ligger
på **6/7/5** — en tiopotens. Matt svart under platt ljus och antracit
förklarar båda mätningen, så ingen är bevisad. Färgordet står därför varken i
namn, titel eller meta, bara i spec-raden `Färg: Svart`, som är leverantörens
egen uppgift. Jämför uppgift #472, där både spec-blocket och tyskan ljög om
färgen åt olika håll.

**⚠️ `bc2e7191` bär en liten LOGOTYP på topphyllans plåt** (bild 1, 3 och 5).
Den sitter FYSISKT på varan och följer plåtens perspektiv — din regel är att
den lämnas. Ingen åtgärd gjord; den står inte i någon alt-text.

**⚠️ Sortimentsfråga, oförändrad från Steg 1:** `b920d526`/`d9965552`
(61,5 × 33 × 113, tvådelade) konkurrerar direkt med publicerade
`verktygsskap-bla-82-cm` och `verktygsskap-svart-82-cm` på samma fotavtryck.
De är korslänkade, men om butiken ska ha fyra skåp på samma stomme är ditt
beslut.

**⚠️ Kategorifråga till städningen (uppgift #283):** `beeada22` och `81c123fa`
är allmänna plåtskåp — `81c123fa`:s egna livsstilsbilder visar det i verkstad,
kontor OCH kök. Båda ligger nu i Verktyg & Hemmafix som resten av familjen.
Om Förvaring & Organisering passar bättre hör det till kategoriträdet, inte
till en enskild runda.
