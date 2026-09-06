# Runda 76 — Steg 2 (laglighet), 4 (bilder) och 5 (verifiering)

## Steg 2 — laglighetsgrinden

Kontorsstolar är ingen stoppklass. Fem saker gäller ändå, och tre av dem är
nya för den här rundan.

1. ☠️ **Grupp E har ett angivet MAXIMUM för användarens LÄNGD: `Benutzergröße:
   ≤ 170 cm`.** Det är inte en rekommendation utan leverantörens egen
   begränsning, och den stämmer med stolens mått (55 × 48 cm, sits 45 × 40,
   rygg som slutar lågt). En kund som är 185 cm får en stol som inte passar.
   **Uppgiften MÅSTE stå i texten** — det är exakt den sortens fakta som
   avgör ett köp, och att utelämna den säljer stolen till fel person.
2. ☠️ **Ingen av de åtta får säljas som ARBETSSTOL.** Ingen är provad mot
   EN 1335, och `arbetsstol` antyder godkänd för heltidsarbete. Samma gräns
   som runda 22 och runda 75.
3. ☠️ **Inga hälsopåståenden.** Ingen text om blodcirkulation, ryggsmärta
   eller "rätt hållning". Grupp D marknadsförs på tyska med ordet
   *ergonomischer*, och det ordet får inte bli ett medicinskt löfte.
4. **Grupp F är en LÅG stol, inte en arbetsstol.** Ryggen är 37 cm hög och
   totalhöjden 76–86 cm. Den säljs som `sminkstol` — det är vad den är, och
   det är också vad leverantörens egen miljöbild visar. Texten säger att den
   fungerar vid skrivbordet också, men lovar inte stöd för långa arbetspass.
5. **Alla tre grupperna kräver montering** (`Montage erforderlich`). Det ska
   stå.

## Steg 4 — bilderna

**Noll av fyrtio bilder bär inbränd tysk text.** Första gången i den här
familjen; runda 75 hade tre som fick plockas bort. Måttritningarna (bild 3 i
alla åtta) bär bara siffror och `cm`.

⚠️ **En etikett granskad på nära håll.** `0f7021fb` bild 5 visar gaslyftets
spak med ett tryck. Uppförstorat är det piktogram plus `UP / LIFT / DOWN` —
en gjuten reglagemärkning på varan, inte en leverantörslogotyp. Den stannar:
husregeln säger att text som sitter FYSISKT på produkten inte poleras bort.
Kontrollen gjordes för att runda 64 hittade `HOMCOM by Aosom` inbränt uppe
till vänster i en bild, och en `grep` över källkoden svarar grönt medan
kundens öga läser leverantörens namn.

☠️ **Bilderna avgjorde en dubblettfråga som måtten inte kunde.** Grupp E låg
inom ±5 cm från den publicerade `armlos-skrivbordsstol-ljusbla`
(53 × 43 × 85–93 mot 55 × 48 × 82,5–94,5) och är dessutom ljusblå-aktig.
Bilderna visar att E **har armstöd** — den publicerade sidan heter `armlos-`
och har inga. Olika produkter, avgjort på konstruktionen och inte på talen.

## Steg 5 — färgen mätt ur pixlarna

Tvåstegsskalan är oförändrad: `S < 15 %` → läs ljusheten, annars läs kulören.

| utkast | grupp | källan | mätt | skrivs |
|---|---|---|---|---|
| 10235819 | D | Hellgrau | L 65 %, S 6 % | ljusgrå |
| 4fa0ae0a | D | Dunkelgrau | L 45 %, S 5 % | **grå** |
| 143f9b2d | E | **Grün** | H **184°**, S 19 %, L 71 % | ☠️ **turkos** |
| 6e05f8b7 | E | Rosa | H 4°, S 37 %, L 76 % | rosa |
| 4293c5ce | E | Grau | L 69 %, S 1 % | **ljusgrå** |
| a5454821 | F | Rosa | H 2°, S 46 %, L 75 % | rosa |
| 0f7021fb | F | Grau | L 60 %, S 2 % | grå |
| ce10bfe8 | F | Cremeweiß | H 57°, S 29 %, L 88 % | gräddvit |

☠️ **`143f9b2d` heter `Grün` och stolen är TURKOS.** H 184° ligger mitt i
cyan; grönt börjar först runt 90°. Det är inte en nyans bredvid — det är fel
färgfamilj, och den sortens fel går inte att nyansera sig ur: en kund som
söker en grön stol får en blå hem. Runda 75 fångade tvåstegsfel i ljushet;
det här är första gången källan tar fel på KULÖREN.

⚠️ Två färgord flyttar också ett steg: `Dunkelgrau` mäter L 45 % (mörkgrå
börjar under ~40) och blir **grå**, och `Grau` i grupp E mäter L 69 % och
blir **ljusgrå**. Samma mönster som förra rundan.

## Steg 5 — motsägelse i källan

☠️ **Grupp E:s ryggstödsmått går inte ihop.** Leverantören anger
`Rückenlehnenmaße: 44L x 52B cm` medan hela stolen är 48 cm bred. En rygg kan
inte vara 52 cm bred på ett 48 cm brett chassi. Troligen är det 44 cm brett
och 52 cm högt, men det är en gissning — **måttet utelämnas ur texten**,
precis som runda 75 utelämnade modell C:s ryggstödsbredd av samma skäl. Ett
tal vi inte vet är sant skrivs inte.

⚠️ **Och variantöversättningen missade en färg.** `143f9b2d`:s svenska
spec-block säger `Färg: Green` — engelska, inte svenska. Det är precis det
`variant-ai-translate.ts` finns för att fånga. Poleringen skriver om värdet
ändå, men missen är värd att notera: ordet var dessutom FEL på tyska från
början, så en översättning hade gett "grön" — rätt översatt och fel färg.

## Namnen: huvudord, färgläge och SKU

De 49 publicerade kontorsstolarna delar redan `kontorsstol`, `snurrstol`,
`gamingstol`, `arbetsstol` och `skrivbordsstol`. Varje grupp får därför ett
eget huvudord som beskriver vad stolen FAKTISKT är:

| grupp | huvudord | varför |
|---|---|---|
| D | **chefsstol** | 120–128 cm hög stoppad rygg med nackstöd — ingen publicerad sida använder ordet |
| E | **skrivbordsstol** | kompakt nätryggad stol, 8,5 kg, max 170 cm användare |
| F | **sminkstol** | 37 cm rygg, 76–86 cm total; leverantörens egen miljöbild är ett sminkbord |

☠️ **Färgordet ligger tidigt i sluggen med flit.** `sku_bas` kapar vid 24
tecken på hel ordgräns, så en slug som `kontorsstol-nackstod-ljusgra-…` hade
gett samma SKU för båda D-syskonen. Kontrollerat maskinellt: **8 av 8
distinkta**, och noll krock mot runda 75:s sju.

| utkast | slug | SKU |
|---|---|---|
| 10235819 | `chefsstol-ljusgra-fotstod` | `FP-chefsstol-ljusgra` |
| 4fa0ae0a | `chefsstol-gra-fotstod` | `FP-chefsstol-gra-fotstod` |
| 143f9b2d | `skrivbordsstol-turkos-natrygg` | `FP-skrivbordsstol-turkos` |
| 6e05f8b7 | `skrivbordsstol-rosa-natrygg` | `FP-skrivbordsstol-rosa` |
| 4293c5ce | `skrivbordsstol-ljusgra-natrygg` | `FP-skrivbordsstol-ljusgra` |
| a5454821 | `sminkstol-rosa-teddytyg` | `FP-sminkstol-rosa-teddytyg` |
| 0f7021fb | `sminkstol-gra-teddytyg` | `FP-sminkstol-gra-teddytyg` |
| ce10bfe8 | `sminkstol-graddvit-teddytyg` | `FP-sminkstol-graddvit` |

⚠️ Alla åtta bär importens KROCKANDE SKU i butiken just nu:
`FP-ergonomischer-burostuhl` × 2, `FP-burostuhl-ergonomisch` × 3,
`FP-homeoffice-stuhl` × 3. Steg 8 ersätter dem — och läser butiken först,
inte planen. Runda 75:s lärdom.
