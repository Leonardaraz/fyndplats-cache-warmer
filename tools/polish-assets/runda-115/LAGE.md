# Runda 115 — läge

**Sex av sju sidor är LIVE. Den sjunde publicerades INTE: den är en bevisad
dubblett av en sida som redan ligger ute.**

| nyckel | sida | SKU | pris | status |
|---|---|---|--:|---|
| `fb142c5c` | `hjullastare-att-sitta-pa-78-cm` | `FP-hjullastare-sitta-78` | 839 | ✅ live |
| `738ca991` | `bandgravare-att-sitta-pa-larvband` | `FP-bandgravare-larvband` | 799 | ✅ live |
| `0c05c1a0` | `frontlastare-att-sitta-pa-80-cm` | `FP-frontlastare-sitta-80` | 779 | ✅ live |
| `23ba27a5` | `sparktraktor-slap-skopa-grep` | `FP-sparktraktor-skopa-grep` | 929 | ✅ live |
| `39d85f18` | `sparktraktor-slap-sandleksaker-gul` | `FP-sparktraktor-gul` | 799 | ✅ live |
| `389ac5ac` | `sparktraktor-slap-sandleksaker-bla` | `FP-sparktraktor-bla` | 879 | ✅ live |
| `cc6b56f9` | *(publicerades inte)* | — | 949 | ☠️ **DUBBLETT** |

Priserna rördes inte — de lästes före och ekades tillbaka oförändrade, och
jämfördes efter skrivningen.

## ☠️ Det viktigaste fyndet: Steg 1:s familjesvep missade fem publicerade syskon

Dubblettgrinden i Steg 1 jämförde 26 utkast mot 11 publicerade sidor och gav
noll träffar. Den var ändå ofullständig, och orsaken är mekanisk:

**Familjen definierades på LEVERANTÖRENS TYSKA ORD** (`Rutschauto`, `Sitzbagger`,
`Rutsch-Traktor`). Sidor som redan polerats bär SVENSKA sluggar — `akgravmaskin-barn`,
`gravmaskin-akbil-barn`, `eltraktor-barn-slapvagn` — och matchade därför aldrig
filtret. Fem publicerade åkfordon låg utanför grinden.

Mätt i efterhand, pixelavstånd mot de fem:

| | `8dd0fb8f` | `7c7e20ec` | `9c6052be` | `91d28d6f` | `7a83e466` |
|---|--:|--:|--:|--:|--:|
| `cc6b56f9` | **4,63** | 69,45 | 74,18 | 85,84 | 83,17 |
| övriga sex | 62–81 | 57–72 | 51–77 | 48–81 | 71–79 |

**4,63 mot 48–86.** Ögonkontrollen avgjorde: hjältebilderna är samma render, och
livsstilsbilden är **samma foto av samma barn på samma gång med samma rabatt**
— inte ett färgsyskon, samma vara.

`cc6b56f9` hölls därför kvar som utkast. Hjullastarens korslänk pekade på den och
flyttades till den LEVANDE sidan `akgravmaskin-barn`, vilket dessutom är bättre
för kunden än en länk till ett utkast.

**Regeln: ett familjesvep byggt på leverantörens vokabulär ser inte de syskon vi
själva redan har översatt.** Sök på SVENSKA produkttyps­ord också.

## ☠️ Ett fabricerat leveranslöfte i MIN egen text — på fyra ställen

`fb142c5c` såldes som *"skopa fram och **leksakshink**"*, och texten sa att en
hink *"följer med i lådan"*. `matt.INGAR` för produkten är `fordonet,
bruksanvisning`. Bild 4 visar maskinens EGEN frontskopa på sin arm, ingen separat
hink. Löftet fanns i namnet, ingressen, brödtexten och metabeskrivningen.

Ingen befintlig grind kunde se det: det är varken ett tal, ett märke, ett tonfel
eller ett förbjudet ord — det är ett SUBSTANTIV som ingen mätning stöder. Och ett
leveranslöfte är den dyraste sortens fel på en produktsida, för kunden kan räkna
det i lådan.

`leveransloften()` i `grind.py` stänger klassen: hittas ett TILLBEHÖR i en
leveransmening måste det stå i produktens `INGAR`. Två utformningar prövades:

| utkast | utfall |
|---|---|
| granska varje substantiv i meningen | 8 träffar, **6 brus** (`ratten`, `skopan`, verbet `ingår`) |
| granska bara TILLBEHÖR + undanta FAQ-frågor | **1 träff, 0 brus** — exakt defekten |

Ett falsklarm som alltid fyrar lär mottagaren att sluta läsa. Frågeundantaget är
ordagrant samma regel som `loftestraff` redan bär: en fråga ursäktas BARA av att
dess EGET svar negerar (uppgift #415).

## ☠️ Gruppdelad FAQ-text på fel produkt — igen

FAQ:n på båda traktorerna påstod *"Ratten har tuta, ljus och musik"* medan
brödtexten på SAMMA SIDA sa *"tuta och strålkastare"*. Orsaken: else-grenen bar
`23ba27a5`:s formulering. Två motstridiga påståenden på en produktsida, och
grinden såg ingenting — den vaktar tal, märken och ton, inte FUNKTIONER.

Samma klass som uppgift #416. Lagat med `matt.RATTEN` — EN tabell som både
brödtexten och FAQ:n härleder ur, så de inte kan glida isär. `matt.kontroll()`
fäller om musikpåståendet sprider sig till fler än den produkt underlaget nämner.

## ☠️ Jargonggrinden fällde ordet "runda" — som ADJEKTIV

`\brundan?s?\b` matchade *"den **runda** logotypen i rattnavet"* i en korrekt
alt-text. Jargongen är substantivet; adjektivet tar aldrig bestämd `-n` framför
sitt huvudord. Mönstret är nu `\brundans?\b|\brunda\s+\d`, med tre självtestfall
— två som ska fälla och ett som inte får.

Mutationstest: återinför det breda mönstret → 1 självtestfall faller och
alt-grinden fäller. Ta bort grinden helt → 2 faller. Rätt test för rätt bugg.

## Grindarnas läge

| grind | fall | utfall |
|---|--:|---|
| `grind.py` självtest | 22 | 0 fel |
| de sju texterna | 7 | 0 fel |
| `alt.py` (42 alt-texter) | 42 | 0 fel |
| `sku.py` | 7 | 7 distinkta, längsta 26 tecken |
| SKU mot katalogen | 17 grannar | 0 krockar |

## Kvar att göra

1. **Stämpla de sex mappningsraderna** (`needs_ai_polish: false`,
   `draft_status: published`, variant-SKU) via `polish-mapping.yml`.
2. **Stämpla `cc6b56f9`** som `rejected` + `needs_ai_polish: false` — utkastet
   ska inte tillbaka i poleringskön.
3. **Leonards beslut om ommappningen.** Husregeln säger att en äkta dubblett
   mappas om: sidan vi BEHÅLLER (`8dd0fb8f`, redan live) pekar om till Aosoms
   artikelnummer och den andra pensioneras. Det görs inte här — `aosom-remap.yml`
   läcker artikelnumret i den publika Actions-loggen (uppgift #417).
4. **Steg 14: live-grinden** på de sex publicerade sidorna.
