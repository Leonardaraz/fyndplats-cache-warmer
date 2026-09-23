# Runda 60 — klar och live

Åtta produkter: en miniugn, en torkapparat, en vattenkokare och fem
frukostset (vattenkokare + brödrost). Alla publicerade, alla verifierade.

| id8 | slug | SKU | bilder |
|---|---|---|---:|
| 4ac902ed | miniugn-30-liter-varmluftsfritos | FP-miniugn-30-liter | 5 |
| 0ceeb412 | torkapparat-fem-plan-frukt-gronsaker | FP-torkapparat-fem-plan | 5 |
| d8c2dec6 | vattenkokare-1-7-liter-gra-koppar | FP-vattenkokare-1-7-liter | 6 |
| 1121b59a | frukostset-svart-vattenkokare-brodrost | FP-frukostset-svart | 4 |
| b330de9c | frukostset-bikakemonster-vattenkokare | FP-frukostset-bikakemonster | 6 |
| 106eafc5 | frukostset-snabbkokande-vattenkokare-brodrost | FP-frukostset-snabbkokande | 4 |
| 70b6bfe2 | frukostset-temperaturval-vattenkokare | FP-frukostset-temperaturval | 4 |
| 6edbe425 | frukostset-fyra-skivor-brodrost | FP-frukostset-fyra-skivor | 4 |

## Kvitton, i den ordning de togs

| steg | vad | kvitto |
|---|---|---|
| 1 | urval + dubblettgrind | fullt svep, 55 sidor, `cursor === null` |
| 2/5 | laglighets- och påståendegrind | uppgift #271 — tre omöjliga påståenden strukna |
| 3 | produkterna lästa | tysk brödtext + spec per produkt |
| 4 | bildgenomgång | fyra kontaktark, 40 bilder granskade |
| 7 | texterna skrivna | `lint.py` → 8/8 rena |
| — | grindarna bevisade | `mutationstest.py` → 16/16 |
| 8 | SKU:erna | `skugrind.py` → 8 distinkta, noll krock i katalogen |
| 9 | korten | 11 kort, alla under 215 kB vid q ≥ 84 |
| 9 | galleriet + alt-texter | `bildplan.py`, proveniens per bild |
| 10 | kategorier | `dd650fed` + `ed3d8796`, 8/8 |
| 4 | prisgrinden | körningarna 1014–1021, 8/8 gröna |
| 11 | publicering + återläsning | 8/8: SKU, text ordagrant, bildantal, kategorier |
| 13 | stämplingen | körningarna 1027–1034, 8/8 gröna |
| 14 | live-kontroll | `live.py` → alla 8 sidor rena |

Textens facit ligger i `facit_synlig.json` (längd + hash på den SYNLIGA
texten, inte på HTML:en — Wix normaliserar taggarna).

## ☠️ Live-grinden fällde åtta korrekta sidor

Första körningen efter publiceringen gav `404` på alla åtta. Sidorna var
riktiga: Wix svarade samtidigt `visible: true` på exakt de slugarna.

Svaret stod i huvudena — `x-vercel-cache: STALE`, `age: 1410`. Slugen svarade
404 medan produkten var utkast, och det svaret låg kvar i ISR-cachen.
Omvalideringen är ASYNKRON, så grindens gamla mönster (hämta en gång för att
beställa ombyggnaden, mät på den andra) hann aldrig se den nya sidan.

⚠️ `?cb=` löser det INTE på produktsidan. Uppmätt: en unik cb-parameter svarade
`HIT age: 44` — samma cache-rad. Frågesträngen ingår inte i nyckeln. Det som
hjälpte var att omvalideringen hunnit klart. Cache-bust-regeln i `CLAUDE.md`
gäller butikens API-rutter, inte produktsidan.

`hamta()` väntar nu ut en STALE-rad (0/10/20/30/60/60/120 s). En färsk sida
kostar fortfarande exakt en hämtning, och en ÄKTA 404 fälls direkt i stället
för att väntas ut i fem minuter per produkt. `vantetest.py` bevisar alla tre
grenarna.

## Kvar till runda 61

Sju vattenkokar/brödrost-set som inte fick plats:
`f523b18d` · `83d2db1a` · `e7f69e8a` · `375bb3c8` · `7805b8bc` ·
`2f2c1c88` · `0ab3483a`
