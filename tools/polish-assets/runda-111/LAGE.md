# Runda 111 — rumsavdelarfamiljens svans: sju sidor i SEX konstruktioner

Familjen hade femton publicerade sidor före rundan. De sju här är resten, och
de är inte en familj i vanlig mening: samma produkttyp, sex olika sätt att
bygga den.

| grupp | id | slug | konstruktion | pris |
|---|---|---|---|--:|
| D1 | `e858810e` | `rumsavdelare-160-furu-tyg` | fururam, vit tygfyllning, 4 paneler | 1 419 |
| D1 | `f641d190` | `rumsavdelare-120-furu-tyg` | samma modell, 3 paneler | 1 159 |
| D2 | `1c1eb875` | `rumsavdelare-palmblad-160` | fururam, tryckt fiberduk | 1 319 |
| E1 | `23d20823` | `rumsavdelare-pappersrep-120` | handflätat pappersrep, bågformad topp | 1 299 |
| E2 | `db70e38c` | `rumsavdelare-med-hyllor` | flätad pappersfiber, två hyllplan | 1 119 |
| F1 | `79b349f7` | `rumsavdelare-pa-hjul-252` | polyester på stål, 12 hjul | 1 019 |
| F2 | `99040238` | `rumsavdelare-253-svart` | polyester på metall, 3 paneler | 829 |

| steg | utfall |
|---|---|
| 8 · SKU, båda halvor | 7 mappningar + 7 Wix-varianter, strängarna jämförda par för par |
| 9 · media | 41 alt-texter, kortet på plats 3, måttritningen sist, `visible` orörd |
| 10 · kategori | `Hem & Inredning` — samma som familjens femton publicerade |
| 12 · läs som kund | **fyra tonfel på tre sidor** (nedan) |
| 13 · publicera | 7 av 7 `LIVE`, variant live, SKU-sträng och pris kontrollerade |
| 14 · live-grind | **7 av 7 gröna** |

## ☠️ Steg 12 hittade FYRA fel som varje mekanisk grind hade släppt igenom

Texterna var redan skrivna till Wix när felen hittades. Ingen av meningarna var
osann — det var **vem som talade och till vem** som var fel, och det ser en
faktagrind aldrig:

| id | vad som stod |
|---|---|
| `db70e38c` | "5 kg per hylla **enligt leverantören**." |
| `79b349f7` | "**Leverantören anger uttryckligen att**…" (brödtext) |
| `79b349f7` | "Nej. **Leverantören anger uttryckligen att**…" (FAQ) |
| `23d20823` | "…är den **rundans** lättaste skärm" |

Mot kunden är **vi** leverantören, och `runda` är vårt ord för en arbetsomgång.
Båda står i runbookens Steg 12; ingen av dem stod i `grind.py`.

☠️ **Och den ena grinden fanns redan — en runda för sent i kedjan.** Runda 110:s
LIVE-grind bar `leverantörsattribution` i sin `FORBJUDET`-lista. Den hade alltså
fällt sidan EFTER publicering i stället för före skrivningen. Uppgift #318 mätte
dessutom upp `runda` i publicerad kundtext från runda 68, 77 och 83 — ordet tog
sig hit igen för att ingen grind bar det.

Båda ligger nu i `grind.py`, verifierade genom att återinföra felen: rätt grind
fäller rätt produkt, och bara den. Tre texter skrevs om och lästes tillbaka
(`LEN ok | HASH ok | … | utkast ok | pris orört`); de fyra andra är
byte-identiska, vilket är kvittot på att redigeringen var kirurgisk.

## ☠️ Live-grindens materialkontroll läste HELA sidan — grannens ord blev vårt fel

Första körningen: **6 av 7 gröna**, `79b349f7` fälld på `TRÄORD på en produkt
utan trä: 'bambu'` — på en skärm av polyester och stål.

Mätt, inte resonerat:

| var ordet fanns | förekomster |
|---|--:|
| i sidans FULLA synliga text | **6** |
| i vår egen text (`texter.py`) | **0** |
| i den RENSADE texten | **0** |

Alla sex satt i butikens rekommendationsrad, i grannen *"Skoställ i bambu, fyra
plan"* — namn, alt-text, slug och två serialiseringar av samma kort.

Orsaken är ORDNINGEN i filen: materialkontrollen låg **före** strykningen av
andra produkters identiteter, medan löftesgrindarna låg efter. Runda 110 ärvde
samma ordning och föll aldrig ut — ingen av dess sex sidor råkade få en granne
med ett förbjudet ord. Buggen var alltså latent, inte frånvarande.

☠️ **Felet går åt BÅDA hållen, och den andra riktningen är tystare.** Den
positiva kontrollen (`MATERIALORD`, "sidan MÅSTE nämna polyester") läste också
hela sidan. En sida som tappat sitt eget materialord hade kunnat godkännas av
att en granne bar ordet. **En positiv kontroll mot fel text är lika trasig som
en negativ — den säger bara ja i stället för nej.**

Kontrollmätning på strykningen själv, båda riktningarna: sidans egna ord
(`polyester`, `stål`, `252`, hela alt-texten) står kvar i den rensade texten.

⚠️ **En uppmjukad grind måste provas åt båda hållen**, annars hade `return []`
sett lika grönt ut. `_sjalvtest()` bygger två syntetiska sidor som är identiska
så när som på VAR ordet står:

```
A  'bambu' i sidans egen brödtext        → FÄLLER   ✓
B  'bambu' bara i grannens produktnamn   → SLÄPPER  ✓
```

## Steg 14, ordagrant

```
självtest: 2 fall, 0 fel
OK  rumsavdelare-160-furu-tyg     156666 tecken  cache=HIT   age=19
OK  rumsavdelare-120-furu-tyg     156368 tecken  cache=HIT   age=19
OK  rumsavdelare-palmblad-160     156526 tecken  cache=HIT   age=20
OK  rumsavdelare-pappersrep-120   157557 tecken  cache=HIT   age=19
OK  rumsavdelare-med-hyllor       158179 tecken  cache=HIT   age=20
OK  rumsavdelare-pa-hjul-252      158732 tecken  cache=STALE age=316
OK  rumsavdelare-253-svart        150193 tecken  cache=STALE age=314

7 av 7 sidor gröna
```

## Kvitton som lästes, inte antogs

**Steg 9.** Media-PATCHen lästes tillbaka och jämfördes EXAKT: en hash över
Wix faktiska alt-texter i galleriordning mot samma hash räknad lokalt ur
`alt.py`. Sju `IDENTISK`, kortet på plats 3 och måttritningen sist på alla sju,
`visible` fortfarande `false`. Uppgift #394 varnar för att en enda läsning efter
en media-PATCH kan ljuga åt båda hållen — den här gången tog alla sju vid första
försöket, och hashen gör svaret entydigt i stället för ungefärligt.

⚠️ Revisionerna i PATCH-svaret låg genomgående ETT steg under återläsningens.
Skriptet ekade den revision det LÄSTE före skrivningen, inte den skrivningen
gav. Ofarligt, men det gör svarets `rev` värdelös som kvitto.

**Steg 8, båda halvorna.** Mappningens SKU lästes ur workflow-loggarna, en per
produkt, och Wix egen variant-SKU ur katalogen utan fallback:

| id | mappningen (loggen) | Wix (katalogen) |
|---|---|---|
| `e858810e` | `FP-rumsavdelare-160-furu` | samma |
| `f641d190` | `FP-rumsavdelare-120-furu` | samma |
| `1c1eb875` | `FP-rumsavdelare-palmblad` | samma |
| `23d20823` | `FP-rumsavdelare-pappersrep` | samma |
| `db70e38c` | `FP-rumsavdelare-med-hyllor` | samma |
| `79b349f7` | `FP-rumsavdelare-pa-hjul-252` | samma |
| `99040238` | `FP-rumsavdelare-253-svart` | samma |

`NEEDS_POLISH` och `DRAFT_STATUS` var TOMMA i alla sju SKU-körningarna — inget
utkast kunde publiceras i förtid av den halvan.

**Steg 10.** Kategorin valdes inte ur minnet: familjens femton publicerade sidor
lästes rad för rad och ligger alla i `All Products + Hem & Inredning`, utan löv.
Inget av `Hem & Inredning`s sju löv passar en rumsavdelare, och att avvika från
familjen är precis vad uppgift #323 handlar om. Skrivningen grindades på
`totalSuccesses`, inte på en GET — `directCategoriesInfo` släpar.

**Steg 13.** `visible: true` skickades på BÅDE produkt och variant. Alla sju
läste tillbaka `LIVE | variant live | sku ok | slug ok | pris orört`. Utan
variantledet hade sidorna gått live med en vara som inte går att lägga i
varukorgen — osynligt i produktvyn.

## Vad som INTE gjordes

- **Priserna rördes inte.** Varje skrivning läste priset före och efter och
  rapporterade `pris orört`.
- **Steg 11 är en no-op.** Alla sju är enkelvariantsrader utan optioner
  (uppmätt: `optioner: 0`), så det finns ingen `linkedMedia` att koppla.
- `99040238` behöll sina fem bilder: bild 4 bär tysk text i pixlarna och togs
  bort i Steg 9 i stället för att alt-sättas.
