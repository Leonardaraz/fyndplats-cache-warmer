# Runda N16 — fyra produkter, billigast uppåt

Sextonde rundan i urvalet *billigast uppåt bland de produkter där vi är
billigare än dealproffsen*. Alla fyra är Aosom-utkast som publicerats, alla
fyra har fått ett eget Fyndplats-kort sist i bildlistan.

| kort | produkt | pris | kategori |
| :-- | :-- | --: | :-- |
| `2876122a` | Ergonomisk knästol i björk med vaggfunktion, grå | 1 169 kr | Hem & Inredning |
| `622bb2a1` | Kolgrill på vagn i stål med låsbart lock, svart | 1 169 kr | Grill & Utekök |
| `75830aad` | Fotbollsspel med 2 bollar och halkfria handtag, brun/svart | 1 169 kr | Leksaker & Spel |
| `8a9b1da9` | Basketkorg för väggmontering, transparent med röd kant, 113 × 73 cm | 1 169 kr | Trädgård & Utemöbler + Utelek & Spel |

Basketkorgen fick **två** kategorier, matchat mot sin redan publicerade
syskonprodukt `db1118d0` (samma korg, annan färgvariant) för konsekvens
snarare än gissat.

## Screening före polering

Full katalogsvep (5 830 publicerade produkter) på måtttrippel plus
bildjämförelse, per husets stående policy:

- **Gokart-kandidat** uteslöts som falskt positiv: samma fotavtryck som en
  publicerad grill, men en genuint annan produkt (gokart vs. grill).
- **Basketkorgens** måtttrippel gav en nära träff mot en publicerad korg —
  bildjämförelse visade att det är en tillåten FÄRGVARIANT (röd/transparent
  kant mot vit/transparent), inte en dubblett. Kategoriserad enligt policyn
  "om det inte är exakt samma produkt och färg ska den poleras."
- Fullständig varumärkesscreening (18 bilder granskade): noll fynd av
  HOMCOM/Outsunny/PawHut/Aiyaplay/Aosom/SportNow/Vinsetto/Kleankin/Zonekiz/
  Durhand eller andra husmärken. En falsk lek-lådbild med påhittad text och
  äkta, orelaterade spel (Catan, Monopoly) i bakgrunden på fotbollsspelets
  bilder korrekt uteslöts som irrelevanta, inte som varumärkesfynd.
- **Kolgrillens** position 4 (tyskbränd närbild av kontrollpanelen) uteslöts
  som "dirty" bild — produkten gick ut med 4 foton + kort i stället för 5.

## Kvittokedjan

Varje led är MÄTT, inte antaget. Ett svar utan fel är inget kvitto.

| led | utfall |
| :-- | :-- |
| `gate.py` | 0 fynd i 4 filer (siffergrind mot `kallor.json`) |
| `gate-seo.py` | 0 fynd i 4 rader |
| `gate-alt.py` | GRIND REN: 4 produkter, 19 alt-texter, 0 fynd |
| `gate-sku.py` | 0 fynd i 4 rader (längst 29 av 40 tecken) |
| `gate-lankar.py` | 0 fynd, 0 unika mål hämtade |
| `gate-superlativ.py` | GRIND REN: 4 filer, 0 kvitterade superlativ |
| `gate-kort.py` | 0 fynd i 4 kort (siffergrind mot `kallor.json`) |
| `gate-axel.py` (mot `axelfacit.json`, byggd server-side) | 0 axelfel — se fyndet nedan |
| `gate-lager.py` (retroaktivt, se nedan) | 0 fynd i 4 produkter, lägsta saldo 18 |
| Kortens md5 i BÅDA ändarna | 4 av 4 byte-identiska (kort-n16-tmp → nedladdat → jämfört), rättningsversionen likaså |
| Steg 1 — text/namn/slug/SEO/synlighet | 4 av 4 skrivna, KÖRT TVÅ GÅNGER — se rättningen nedan |
| Steg 2 — media ENSAMT, kortet sist | 4 av 4 skrivna, KÖRT TVÅ GÅNGER av samma skäl |
| Steg 3 — kategorier | 4 av 4 kopplingar (`BulkAddItemToCategories`, `totalFailures: 0` på alla fyra, basketkorgen fick två) |
| Steg 4 — `variantsInfo` SIST och ENSAMT | 4 av 4, svensk SKU skriven, variantobjektet round-trippat oförändrat utom `sku` |
| Separat läsning en stund efter skrivningen (efter rättningen) | **4 av 4 helt OK**: plainDescription-hash 4/4 LIKA, bildantal rätt, kortet sist i listan, SKU svensk, produkt+variant synliga |
| `hamta-live.sh` + `livegrind.py` mot de publicerade sidorna (efter rättningen) | **4 av 4 REN, 0 avvikelser** |

## ☠️ Knästolens Mått-rad hade bredd och djup omkastade — fångat av gate-axel.py, bekräftat av måttritningen

`gate-axel.py` (byggd efter runda K14, #226) jämför den skrivna texten mot
ett mekaniskt facit (`bygg-axelfacit.py`, körs SERVER-SIDE ur `kallor.json`,
skrivs aldrig för hand). För knästolen `2876122a` gav facitets positionella
läsning `{bredd: 51, djup: 84, hojd: 93}` — men eftersom min skrivna
`Mått:`-rad angav siffrorna i ett kombinerat format
(`"84 × 51 × 93 cm (B×D×H)"`) i stället för en prosa-mening ("N cm bred"),
matchade ingen av grindens MONSTER-regex:ar den och grinden kunde inte fälla
på den — den flaggade bara en "TYSKAN GÄLLER"-notis om att KÄLLANS EGEN
Aosom-genererade `Mått:`-rad (från importtillfället, inte min nya text) är
internt inkonsekvent om vilken bokstav som hör till vilket tal.

Eftersom `gate-axel.py`s mönster inte kunde se det egna misstaget, gjordes
den avgörande kontrollen manuellt: **måttritningen** (position 3 i
bildlistan) hämtades och granskades direkt. Bilden visar TVÅ vyer —
en SIDOVY (84 cm på den horisontella axeln = DJUP, 93 cm på den vertikala =
HÖJD) och en FRAMIFRÅN-vy (51 cm på den horisontella axeln = BREDD).
Bilden bekräftar alltså exakt den mekaniska facitens positionella läsning:
**bredd 51, djup 84** — inte det jag ursprungligen skrivit (bredd 84,
djup 51).

Rättat i sex filer innan skrivningen kördes om: `2876122a.html` (Mått-raden),
`kort.tsv`, `kortalt.tsv`, `alt.tsv` (måttskissens alt-text), samt
regenererat `raa-hash.tsv`, `steg1.js`, kortets PNG, `kort-filer.tsv` (ny
uppladdning, MD5-bevisad), `nyttolast-media.json` och `steg2.js`. Steg 1 och
Steg 2 kördes därefter om för samtliga fyra produkter (endast 2876122a:s
innehåll faktiskt ändrat; de tre andra skrevs identiskt om, ofarligt).

**Regeln denna runda lär ut:** en grind som bara letar efter ett visst
TEXTFORMAT ("N cm bred") kan missa exakt det den är byggd för att fånga när
texten uttrycker samma sak i ett annat format. Bilden är fortfarande sista
ordet — `titta på bilderna FÖRE texten` gäller även när grinden är grön.

## Lagersaldot kollades retroaktivt, inte i urvalssteget

`gate-lager.py` (#173) upptäcktes efter att skrivningarna redan var gjorda —
en process-miss, inte ett textfel. Kollen kördes ändå innan rundan
dokumenterades klar, per samma regel som `slutsald`-grenen i prisgrinden:
"kollen kostar ett Wix-anrop, ingenting görs om det inte behövs."

Alla fyra produkter är `IN_STOCK`: 197, 18, 78 respektive 197 i saldo. Lägsta
(kolgrillen, 18) är över `TUNT`-tröskeln (5) och varnar inte. `lager.tsv`
skrevs retroaktivt med de uppmätta talen och är rundans facit.

⚠️ **Nästa runda: kör `gate-lager.py` FÖRE Steg 1, inte efter.** Att kolla
lagret i efterhand fungerar bara för att det INTE var slutsålt — hade det
varit det hade fyra skrivsteg och en publicering redan skett i onödan.

## Vad som INTE hittades den här rundan

Inga trasiga länkar, inga SKU-kollisioner, inga tyska SEO-titlar, alla fyra
är enkla produkter med en variant vardera (`variantsInfo.variants.length ===
1` bekräftat i Steg 4) — `options`-fältmask-fällan för
flervariantsprodukter gällde alltså inte den här rundan.
