# Runda N10 — sju produkter 1 069–1 079 kr

Tionde rundan i urvalet *billigast uppåt bland de produkter där vi är billigare
än dealproffsen*. Alla sju är Aosom-utkast som publicerats, och alla sju har
fått ett eget Fyndplats-kort sist i bildlistan.

| kort | produkt | pris |
| :-- | :-- | --: |
| `05e65736` | Fällbart skrivbord med hylla, natur/vit | 1 069 kr |
| `34f22c58` | Trädgårdsbänk i gran, vagnshjulsben | 1 069 kr |
| `61008b48` | Hundgrind i furu, 113–166 cm bred | 1 069 kr |
| `6b8aa5a3` | Kompostbehållare 240 liter, svart | 1 069 kr |
| `72491f25` | Smalt badrumsskåp i bambu, 120 cm | 1 069 kr |
| `231202df` | Knästol med gungfunktion, sex lägen | 1 079 kr |
| `3ee7a87a` | Knästol på hjul, svart konstläder | 1 079 kr |

## Kvittokedjan

Varje led är MÄTT, inte antaget. Ett svar utan fel är inget kvitto.

| led | utfall |
| :-- | :-- |
| Källtexterna hämtade ordagrant | 7 av 7 byte-exakta (`kvitto-kalla.json`) |
| Kontaktark FÖRE brödtext | 35 bilder granskade, två fynd ingen siffergrind kan se |
| `gate.py` | 0 fynd, 2 kvitterade ordtalsvarningar (`rad-tal.txt`) |
| `gate-seo.py` · `gate-alt.py` · `gate-axel.py` | 0 · 0 i 30 · 0 axelfel (2 informativa axelkonflikter, tyskan gäller) |
| `gate-superlativ.py` · `gate-lankar.py` · `gate-sku.py` | 0 · 0 · 0 (längst 31 av 40) |
| `gate-kort.py` | 0 fynd i 7 |
| Kortens md5 i BÅDA ändarna | 8 av 8 byte-identiska (7 kort + 1 beskuren mätbild) |
| Steg 1 — text/namn/slug/SEO/synlighet | 7 av 7 skrivna, kontrollsumman passerade |
| Steg 2 — media ENSAMT, kortet sist | 7 av 7 skrivna, alt-textgrinden passerade |
| Steg 3 — kategorier | 11 av 11 kopplingar |
| Steg 4 — `variantsInfo` SIST och ENSAMT | 7 av 7, SKU:er skrivna, `visible` explicit |
| Stämpling via `polish-mapping.yml` | 7 av 7 gröna, körda med uttryckligt `ref` |
| Separat återläsning en stund senare | **7 av 7 LIKA** mot filens FNV-facit |

`livegrind.py` mot de publicerade sidorna körs efter ISR-fönstret — se
avsnittet nedan.

## Två fynd som bara ett öga på fotot kunde se

Kontaktarken byggdes före brödtexten, enligt regeln från runda J1.

- ☠️ **`3ee7a87a`** — källan kallar stolen en knästol med gungfunktion, men
  fotona visar en STYV Z-ram på fyra hjul, inga böjda medar. Jämför
  `231202df` i samma runda, som verkligen gungar. Gungfunktionen skrevs
  aldrig — texten säger "stabil Z-ram i stället för på böjda medar".
- ⚠️ **`72491f25`** — källan antyder hörnanpassning. Skåpet är en rak,
  smal rektangel. Texten säger smal, inte hörnoptimerad.

Ingen siffergrind kunde ha fångat något av detta: talen i källan var korrekta,
felet var en sann utsaga om en produkt som inte finns.

## En germanism och en axelfelsträff, båda fångade före publicering

- `72491f25`s källa kallade konstruktionen *kippsicher*. Ordet skrevs först
  av som "kippsäker" — inte svenska, lånord rakt av. `gate.py`s
  `[STAVNING]`-kontroll fällde det. Rättat till "tippsäker" i både brödtext
  och en ny FAQ-rad.
- `3ee7a87a`s spec-rad hade måtten i fel ordning (70 × 42 i stället för
  42 × 70) mot källans "42B x 70T". Fångat manuellt genom att korsläsa varje
  produkts axelsträng mot källan innan `gate-axel.py` ens kördes — och
  bekräftat av grinden efteråt: 0 axelfel.

## Hundgrindens måttbild byttes, inte bara lades till

`61008b48`s enda måttritning bar BÅDE rena siffror och ett tyskt
HINWEIS-textblock i samma fil. Att kasta hela bilden hade kostat produktens
enda måttritning. Snittet lades i det vita bandet mellan blocken (y=1338 av
2000, mätt ur bilden — inte gissat), och den beskurna svenska versionen
ersätter originalet på SAMMA position (källposition 3) i stället för att
läggas till sist. Kortet ligger därefter sist, som vanligt.

## Dubblettskärmen: nio kandidater, sju hölls tillbaka eller pensionerades

Fullständig genomgång i `DUBBLETTSKARMEN.md`. Kort:

- Miniugnen pensionerad (bild- och mått-bekräftad dubblett).
- Skrivbordsfärgparet löstes genom att publicera en färg och lämna den andra
  som utkast, enligt etablerad husregel.
- Skumblocks-klustret och tredje sidan för väggvärmaren hölls tillbaka.
- Två fynd väntar på Leonards beslut och är kvar i backloggen:
  **#285** (fyra sidor för samma elfyrhjuling — tre utkast plus en
  publicerad) och **#286** (två publicerade miniugnar, samma ugn i två
  färger, 280 kr isär).
- Två kollisioner friades uttryckligen med foto-/textmotivering
  (badrumsskåp-mot-akvarium generisk trippel; knästolarnas
  fotavtrycksöverlapp, olika justermekanism bekräftad i närbild).

## Ett git-missöde under kortuppladdningen, löst utan dataförlust

Orphan-grenens `git rm -rf .` tog bort en redan committad fil
(`61008b48-matt.png`) från arbetsträdet innan de sju nya korten hann
committas. Filen återställdes byte-identiskt ur historiken
(`git show <sha>:<väg>`, md5 verifierad mot den ursprungliga granskningen)
innan uppladdningen fortsatte — ingen del av rundans faktiska arbete gick
förlorad. Se `kort-branches-2026-09-16.json` för den fullständiga
verifieringen av den tillfälliga grenen inför radering.
