# Runda 88 — åtta sparkcyklar för barn, KLAR. Alla åtta publicerade och live-verifierade.

| id8 | slug | pris | modell | SKU |
|---|---|--:|---|---|
| `b1dcd424` | `sparkcykel-barn-12-tum-bla` | 1 039 | A | `FP-sparkcykel-12-tum-bla` |
| `41269686` | `sparkcykel-barn-12-tum-vinrod` | 1 059 | A | `FP-sparkcykel-12-tum-vinrod` |
| `e9cfa7bf` | `sparkcykel-barn-roda-hjul-30-cm` | 1 059 | B | `FP-sparkcykel-30-cm-rod` |
| `82b5a517` | `sparkcykel-barn-12-tum-svart` | 1 099 | A | `FP-sparkcykel-12-tum-svart` |
| `2b8297df` | `sparkcykel-barn-bla-hjul-30-cm` | 1 139 | B | `FP-sparkcykel-30-cm-bla` |
| `9941383e` | `sparkcykel-barn-grona-hjul-30-cm` | 1 159 | B | `FP-sparkcykel-30-cm-gron` |
| `e4e5a8ef` | `sparkcykel-barn-bla-korg-stankskarmar` | 1 329 | I | `FP-sparkcykel-barn-bla-korg` |
| `b03784dc` | `sparkcykel-barn-rosa-korg-stankskarmar` | 1 459 | I | `FP-sparkcykel-barn-rosa` |

Priserna är orörda.

## ☠️ Rundans dyraste fynd: ett tal ingen källa anger stod i två produktnamn

Modell I:s namn och slug bar **"16 tum"**. Måttritningen ger 139, 58, 90–96,
37 och 12,5 cm och **ingen hjuldiameter alls**, och varken Steg 1, 2 eller
4–5 fann någon. Talet var gissat ur den publicerade syskonsidan
`sparkcykel-barn-rosa-16-tum-luftdack` — som dessutom anger **16 tum fram
och 12 tum bak**, och modell I:s egna bilder visar just ett bakhjul som ser
större ut än framhjulet. Gissningen var alltså sannolikt fel också.

Det upptäcktes EFTER att texten skrivits till Wix, i Steg 9 när
måttritningen granskades för alt-texterna. Rättelsen blev fyra exakta
strängbyten på texten i Wix bakom samma facit-grind — namn, slug, SKU,
sökord och sex korslänkar i sex andra produkter.

**Fyra grindar starkare av det:**

1. **Lint-grind 16:** modell I får inte påstå en hjulstorlek i tum, varken
   i namnet eller i sina egna meningar. Talet får bara stå i en ANKARTEXT,
   där det beskriver den andra produkten.
2. **Grind 2 räknar nu fram sluggens särskiljande del** i stället för att
   anta att den ligger sist. Modell I:s sluggar slutar på `stankskarmar` —
   ett ord båda bär — så den gamla grinden hade krävt att SKU:n bar just
   det ord som INTE skiljer dem åt, medan färgen fått falla bort. En SKU
   utan det särskiljande ordet är exakt hur katalogen fick elva SKU:er
   delade av tjugofyra produkter. Böjningsskillnad tillåts (`rod`/`roda`).
3. **`mönstrat slitbana` → `mönstrad`**, sökt per ORD över hela batchen
   enligt husets regel, inte lagat där det syntes.
4. **Tre nya mutationer** låser alla tre. Mutationstestet är 28/28.

## ⚠️ Live-grinden fällde först FEMTON korrekta sidor — och felet var grindens

Rundans egna grindar (maxlast per modell, korg bara på modell I) kördes på
HELA den renderade sidan. En korslänk beskriver den ANDRA produkten: modell
A och B länkar till *"modellen med korg och stänkskärmar, som tar 100 kg"*,
och sex av åtta föll på ord som inte är påståenden om dem.

Linten hade rätt hela tiden — den kör samma grindar på texten UTAN
ankartexter (`dela_pa_ankare`). Live-grinden gör det nu också, och först
efter att facit bevisat att live-sidan är byte för byte densamma som den
byggda texten. Samma familj som `\b`-fyndet: **en grind som fäller korrekt
text lär mottagaren att sluta läsa.**

## ☠️ Sex av åtta bar KROCKANDE SKU:er från importen

Uppmätt när Steg 8 läste de gamla värdena:

| gammal SKU | antal produkter |
|---|--:|
| `FP-kinderroller` | **3** |
| `FP-kinderroller-mit` | **3** |
| `FP-kinderroller-scooter-mit` | 1 |
| `FP-kinderroller-tretroller` | 1 |

Belägg för #272: krocken skapas av IMPORTEN, inte av poleringen.

## ☠️ De fem publicerade syskonen ligger i FEM OLIKA kategorikombinationer

| publicerad sida | kategorier utöver All Products |
|---|---|
| `sparkcykel-barn-rosa-16-tum-luftdack` | Utelek & Spel · Trädgård & Utemöbler · **Barn & Familj** |
| `sparkcykel-barn-luftdack-40-cm` | Sport & Fritid · **Barn & Familj** |
| `sparkcykel-barn-5-12-ar` | Leksaker & Spel · **Barn & Familj** |
| `sparkcykel-barn-trehjulig-led` | Leksaker & Spel · Baby & Småbarn · **Barn & Familj** |
| `trehjulig-sparkcykel` | Leksaker & Spel · **Barn & Familj** |

Bara **Barn & Familj** bärs av alla fem; **Leksaker & Spel** av tre. Rundans
åtta fick de två — 16 av 16 lyckade skrivningar. Spridningen hör hemma i
kategoristädningen, inte här.

☠️ **Kategoriläsarens svarsnyckel heter `directCategoryIds`/`allCategoryIds`,
inte `categories`.** Ett anrop som läser fel nyckel svarar 200 med en tom
lista — det ser ut som "produkten ligger i noll kategorier", inte som ett
fel. Kontrollmätt mot ett garagetält ur runda 87 som bevisligen ligger i tre.

## ⚠️ Korten byggdes på VITBOTTENSBILDEN, inte livsstilsbilden

Alla åtta livsstilsbilder är utomhusfoton med gräs och lövverk. Samtliga
sprängde 215 kB-taket vid q = 85, och en framsökning av oskärpan hade nått
radie 4,8–5,7 utan att vara klar. Att sudda sönder fotot för att få plats är
fel svar när det finns ett bättre foto — och ett faktakort tjänar dessutom
på en bild som visar hela sparkcykeln utan en park bakom.

Med vitbotten klarar alla åtta taket **utan oskärpa**: 206–213 kB.

Vald hjälte kopieras till `kortkalla/`, som kortbygget får som sin
källkatalog. Råbilderna rörs aldrig.

## ✅ Kvitto: stämplade, publicerade, live

**Stämplingen** — åtta körningar av `polish-mapping.yml`, läge `stampla`,
alla `success`. Kvittot är inte jobbets färg utan raden i loggen och
raden i databasen. Läge `las` mot `b1dcd424` efteråt:

```
"sku": "FP-sparkcykel-12-tum-bla"
"draftStatus": "published"
"needsAiPolish": false
=== Steg 4: prisgrinden ===  landedCostSek 865.62 → 1039, stammer true
```

**Klart-kriteriet** — `brister: []` på alla åtta före publiceringen: facit
på både längd och hash, namn, slug, SEO-titel och -meta, svenska sökord,
tre rena `<h2>`-flikrubriker, sex bilder med `image.url` och unika
alt-texter, kortet på plats 3, SKU på rätt `wixVariantId`, tre kategorier.

**Publiceringen** — en PATCH per produkt med `visible: true` på BÅDE
produkten och varianten, med facit-grinden inne i anropet. Alla åtta
`PUBLICERAD`, `produktSynlig: true`, `variantSynlig: [true]`, priser och
SKU:er oförändrade.

**Steg 14, live-grinden:** alla åtta svarar `200` med `x-vercel-cache: MISS`
på första hämtningen — en färsk rendering, inte ett cachat svar från
utkastet (runda 60:s lärdom). Texten stämmer mot facit på **både längd och
hash**: 3 392 / 3 280 / 3 297 / 3 353 / 3 320 / 3 307 / 4 077 / 4 059
tecken. Korslänkarnas **tio mål svarar alla 200**, inklusive de två som
pekar på publicerade syskon utanför rundan
(`sparkcykel-barn-luftdack-40-cm`, `sparkcykel-barn-rosa-16-tum-luftdack`).

## ⚠️ Mappningsraden bär kvar leverantörens tyska SEO-titel

`b1dcd424`:s rad har fortfarande
`"seoTitle": "Kinderroller mit Hinterbremse Kickscooter 12 Zoll Tretroller Roller"`.
Fältet är INTE det Wix serverar — Wix `seoData` skrevs på svenska i Steg 7
och verifierades av klart-kriteriet — men det ligger kvar i bokföringen på
varje polerad Aosom-produkt, eftersom poleringsruttens allowlist bara
tillåter `needsAiPolish`, `draftStatus` och `variants[].sku`. Ingen känd
läsare visar det för kund. Noterat, inte åtgärdat.

## Kvar ur familjen

24 utkast fanns; åtta är klara. **Modell C** (`9518db1e` `473084eb`
`85be4535`), **E** (`369b4b2c` `feac1d03` `c851d101` `1b1d4842`) och **H**
(`ea013fde`) har publicerade syskon och ska poleras MOT deras text, som
runda 69 och 74 gjorde. Utan publicerat syskon återstår **A2**
(`c4375606` `79186373`, luftdäck), **D** (`479e9c2e` `d9239c8e`),
**F** (`4fd26086` `89deaca7`) och **G** (`aef9a8d9` `5129f6b0`).
