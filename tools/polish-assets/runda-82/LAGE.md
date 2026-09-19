# Runda 82 — läget

**Sju** solsängar, solstolar och fällstolar. Alla publicerade och
live-verifierade 2026-09-06; live-grinden gick grön på FÖRSTA passet.

| id8 | slug | pris | antal |
|---|---|--:|--:|
| `d6a11ae3` | `solsang-dyna-huvudkudde-sju-lagen` | 1249 | 1 |
| `f5d857b6` | `solsang-gra-180-cm-huvudkudde` | 1099 | 1 |
| `2a16c507` | `solsang-svart-sitthojd-33-cm` | 1129 | 1 |
| `9ed7ad7a` | `solstolar-2-pack-gra-nackstod` | 1129 | 2 |
| `85ffb47b` | `solstolar-2-pack-svarta-nackstod` | 1099 | 2 |
| `1628620b` | `fallstolar-linnelook-4-pack` | 1099 | 4 |
| `4ca8a6c0` | `fallstolar-konstlader-4-pack` | 1099 | 4 |

## ☠️ Rundans största fynd är den produkt som INTE publicerades

`ee610afd` flaggades i runda 81 som "fjärde färgen" i den publicerade
`vilstol-bjork-*`-familjen. Frågan var för snävt ställd. Mätt mot hela den
publicerade katalogen är det samma stol som **fyra publicerade sidor**, under
två namnmönster, med fem säljbara kulörer — och prisspridningen är
**1 169 till 1 869 kr för identisk vara**.

Beviset är måtten, inte namnen: ryggstöd 75 × 55 × 71 cm och fotstöd
55,5 × 33 cm är för specifika för sammanträffande. Hela tabellen står i
`STEG1.md`; beslutet om vilken sida som behålls är Leonards, eftersom fyra av
de fem talen är priser.

**Att polera vidare hade gjort en femte sida av samma stol.** Utkastet ligger
kvar osynligt — det kostar ingenting medan det väntar, en femte URL kostar för
alltid.

## ☠️ Två gånger valde rundan att INTE skriva ett tal

| var | vad källan säger | vad vi skriver |
|---|---|---|
| `2a16c507` liggläge | texten 180 × 63,5 × 65, ritningen **178 och 70** | ingen rad alls |
| `f5d857b6` + `2a16c507` rygglägen | brödtexten "fünf", punktlistan "7-stufig" | "flera lägen" |

Båda är samma regel som runda 80:s armstödshöjd: **när leverantören motsäger
sig själv väljer man inte, och man medelvärdesbildar inte.** Skillnaden här är
att utelämnandet är GRINDAT — `UTELAMNAT` i linten fäller om talet smyger
tillbaka via en FAQ, en ingress eller ett syskons spec.

⚠️ **Kundens fråga besvaras ändå.** `2a16c507`s FÖRSTA vanliga fråga är
"Hur lång är den i liggläget?" och svarar rakt ut varför talet saknas. Ett
utelämnat mått utan förklaring hade sett ut som slarv.

## ☠️ Mutationstestet hittade ett hål i min EGEN grind

`LAGEN_RE` läste bara siffror. Mutationen skrev **"sju lägen" med bokstäver**
och gled rakt igenom. Ett tal i ord är exakt lika mycket ett påstående som ett
tal i siffror; regexen bär nu `två|tre|fyra|fem|sex|sju|åtta|nio|tio|\d+`.

Slutläge: lint 0/7, mutationstest **20/20**, orörd text 0 fel.

## Övriga fynd

- ☠️ **De två 4-packen heter `Tragbare Bürostühle` i källan.** Ingen gaslyft,
  inga hjul, fast sitthöjd — ordet kontorsstol är förbjudet i hela rundan
  (#123), och linten fäller på det.
- ✅ **Maxlasten är per stol, bevisat i pixlarna.** Båda 4-packens måttritning
  visar "120 kg" med nedåtpilar över EN stol. Runda 81 fick resonera sig fram
  till samma sak.
- ⚠️ Runda 81:s anteckning "`4ca8a6c0` mörkgrå" var fel: båda anges `Schwarz`,
  och skillnaden är **materialet** (linnelookat tyg mot konstläder).
- ⚠️ Hopfällt mått står i **fel ordning** i källan (`45B × 97T × 9H`).
  Ritningen visar stolen på kant: 45 bred, 9 tjock, 97 hög. Vi skriver
  ritningens ordning.
- ☠️ **SKU-krock fångad före skrivning.** `fallstolar-4-pack-linnelook` och
  `-konstlader` kapas båda till `FP-fallstolar-4-pack`. Slugarna lades om så
  det särskiljande ordet kommer före 24-teckensgränsen.
- ⚠️ En bild SÅG ut att vara fel kulör och var det inte. `d6a11ae3` bild 4 mättes
  i pixlarna: RGB (118, 96, 72) mot (81, 84, 89) — varmt solljus på kolgrå
  textilen. Bilden ligger kvar. **Mätt, inte antaget.**

## Kategorier — trädet HAR löv för utomhusdelen

| | kategori |
|---|---|
| fem utomhusprodukter | Trädgård & Utemöbler → Utemöbler |
| två 4-pack (inomhus enligt vår egen text) | Hem & Inredning |

12 av 12 kopplingar `totalSuccesses`. De två 4-packen får bara toppkategorin,
av samma skäl som runda 80:s kontorsstolar: trädet har inget möbellöv under
Hem & Inredning. `All Products` skrivs aldrig (#291).

⚠️ **`products/search` returnerar TOMMA kategorifält** — se uppgift #313.
Kategorier läses med GET på produkten, aldrig ur söksvaret.

## Steg för steg

| steg | utfall |
|---|---|
| 1 | dubblettgrind mot 2 087 publicerade sidor; `ee610afd` föll |
| 2–6 | lint 0/7, mutationstest 20/20, prisgrind grön (körning 1573–1579) |
| 7–9 | sju texter i två anrop, facit-grind 7/7, alla `visible:false` |
| kort | sju kort, 187–214 kB, **inget foto behövde mjukas upp** |
| 11 | media: 6 bilder/produkt, kortet på plats 3, **0 utan alt-text** |
| 10 | 12/12 kategorikopplingar |
| 13 | sju publicerade, SKU skriven, **pris oförändrat på alla sju** |
| stämpling | sju `stampla`-körningar (1580–1586), alla `success` |
| 14 | **alla 7 sidor och 11 länkmål rena, första passet** |

## Kvar

- `4106fc63` — barnset med parasoll. Egen grind (EN 71, barn, parasoll) och
  därför medvetet utanför den här rundan.
- `e4a986ad` (sminkstol) och `bff8e42d` (chefsstol med massage + värme) från
  runda 80. Den senare behöver runda 26:s massagegrind och en krockkontroll
  mot åtta publicerade `massagestol-*`-sidor.
- **#314** — beslutet om björkvilstolens fyra publicerade sidor.

Öppna sedan tidigare: #253, #256, #259, #261, #263, #264, #266, #268, #270,
#271, #272, #283, #295, #298, #300, #302, #305, #313, #314.
