# Runda 77 — fem ritstolar och ett hjärtryggat färgpar

Alla fjorton steg klara. Sju sidor publicerade och live-verifierade.

| id8 | slug | SKU | pris | modell |
|---|---|---|--:|---|
| d739872f | `ritstol-uppfallbara-armstod` | `FP-ritstol-uppfallbara` | 1 399 | G1 · sitthöjd 53–78 cm, uppfällbara armstöd |
| 795c5ee2 | `ritstol-utan-armstod` | `FP-ritstol-utan-armstod` | 1 199 | G2 · sitthöjd 50–70 cm, fotring Ø45 cm |
| 3033003c | `ritstol-med-svankstod` | `FP-ritstol-svankstod` | 1 649 | G3 · 53 cm bred sits, svankstöd |
| 83fd57c9 | `ritstol-95-115-cm` | `FP-ritstol-95-115-cm` | 1 199 | G4 · sitthöjd 52–72 cm |
| f1f861ea | `ritstol-sitthojd-87-cm` | `FP-ritstol-sitthojd-87-cm` | 1 519 | G5 · sitthöjd upp till 87 cm |
| df0d351f | `skrivbordsstol-vit-hjartrygg` | `FP-skrivbordsstol-vit` | 959 | H · vit, hjärtformad rygg |
| cc0ec7ba | `skrivbordsstol-rosa-hjartrygg` | `FP-skrivbordsstol-rosa` | 1 099 | H · rosa, hjärtformad rygg |

## Kvitton

| steg | kvitto |
|---|---|
| lint | 0 fel i 7 produkter |
| mutationstest | **32/32 fångade**, orörd text 0 fel |
| kort (Steg 9) | 7/7 byte-identiska i Wix, `sourceUrl` mot `runda-77/kort/` |
| bilder (Steg 9) | 7/7 antal + alt-texthash STÄMMER, kortet på position 3, ritningen sist, 0 tomma alt |
| kategori (Steg 10) | `totalSuccesses: 1` × 7 |
| prisgrind (Steg 11) | 7/7 gröna `las` (1458–1464), `stammer true`, alla priser oförändrade |
| SKU (Steg 8) | 7/7 skrivna, alla distinkta |
| publicering (Steg 12) | 7/7 `visible=true` + `variant.visible=true`, priser orörda |
| stämpling (Steg 13) | 7/7 gröna `stampla` (1465–1471) + oberoende `las` per modellgrupp (1472–1474) |
| **live (Steg 14)** | **7/7 `200`, cache `MISS`, text byte-identisk med facit**, eget kort i sidkällan, **8/8 länkmål `200`** |

## ☠️ Sökordskrocken låg på sida 31 av 56 — svepet fick inte kapas

Fem ritstolar av samma sort i EN runda hade blivit fem sidor som konkurrerar om
samma sökning. Det som gjorde frågan skarp var att en sjätte redan är
publicerad: **`ritstol-fotring-natrygg-55-76-cm`**, och den ligger på sida 31 av
56 i katalogsvepet. Ett svep som stannat vid trettio sidor — takgränsen per
anrop — hade missat den och lagt fem kannibaliserande sidor bredvid en sida
ingen visste fanns.

Lösningen är att varje sida bär sin EGEN särskiljare i namn, slug OCH title, och
att alla fem korslänkar varandra och den publicerade. Sjutton interna länkar mot
åtta mål.

⚠️ **`avhuggen: false` är därför inte en formalitet.** Kravet finns just för det
här: sveptaket är en gräns i anropet, inte i katalogen.

## ☠️ Faciten hashar ankartexten men INTE adressen — ny grind i Steg 14

Faciten hashar den synliga texten. En `href` bor i ett attribut och stryks av
strip, så en korslänk kan peka på en slug som inte finns medan varenda textgrind
lyser grönt — en 404 för kunden mitt i brödtexten, osynlig för hela kedjan.

`live.py` samlar därför varje `href` ur våra egna texter och kräver `200` på
målet. Sju av åtta mål är rundans egna sidor och kostar ingen extra hämtning;
det åttonde är den publicerade ritstolen.

| mål | länkar |
|---|--:|
| `ritstol-fotring-natrygg-55-76-cm` | 5 |
| `ritstol-uppfallbara-armstod` | 3 |
| `ritstol-95-115-cm`, `ritstol-med-svankstod`, `ritstol-utan-armstod` | 2 var |
| `ritstol-sitthojd-87-cm`, `skrivbordsstol-vit-hjartrygg`, `skrivbordsstol-rosa-hjartrygg` | 1 var |

## ☠️ `sku_bas` INVERTERADE betydelsen — `utan` är ett fogeord

`795c5ee2` är ritstolen **utan** armstöd. `sku_bas` stryker fogeord, och `utan`
står i den listan, så `ritstol-utan-armstod` blev `FP-ritstol-armstod` — en SKU
som säger raka motsatsen till vad varan är, och som dessutom hade legat nära
`d739872f`:s.

Fogeordet är därför behållet med flit: `FP-ritstol-utan-armstod`. Runda 58 satte
precedensen — regeln får frångås när den producerar en felaktig SKU — men det är
första gången avvikelsen handlar om BETYDELSE och inte om längd.

⚠️ Samma mekanik styrde hjärtparets slug: färgen står FÖRE särskiljaren
(`skrivbordsstol-vit-hjartrygg`, inte `skrivbordsstol-hjartrygg-vit`) eftersom
`sku_bas` kapar vid helt ord på 24 tecken och den andra ordningen hade gett
`FP-skrivbordsstol-hjartrygg` för BÅDA.

## ☠️ Korslänksundantaget i linten var ett hål jag själv hade öppnat

Ett tal i en länktext beskriver den LÄNKADE sidan, inte den här — därför ett
undantag. Första versionen lät undantaget gälla hela sidan, och då passerade
`40 × 44` på en sida där 44 bara står i ett SYSKONS sitsmått. Mutationstestet
fällde det (23/32) innan något skrevs.

Undantaget gäller nu bara texten INUTI `<a>`, och bara mot de mått som är mätta
för det länkade målet (`EXTERN_TAL`). Ett tal i brödtexten måste stå i
produktens egen spec, precis som förut.

## ☠️ Fyra tyska bilder bort — och en ordlista som inte får ärvas

`3033003c` tappade tre av sex bilder och `d739872f`/`795c5ee2` en var: tyska
funktionsgrafiker som inte går att polera bort. Två produkter står därför på
fyra respektive fem bilder inklusive kortet.

Live-grindens tyska ordlista är byggd för den här familjen, inte ärvd från
runda 76. Kontrollmätt mot rundans egen text får dessa ord INTE stå i den:
**`rosa`** (cc0ec7ba ÄR rosa), **`teddy`** (vår text säger "teddytyg"),
**`arm`** ("armstöd"), **`gas`** ("gaslyft"), plus de rent svenska `samt`,
`grun`(d), `hell`(re), `dunkel`, `beige`, `rader`, `rollen`, `matt`.
Sammansättningarna är säkra: `armlehne`, `teddyfleece`, `hellgrau`, `dunkelgrau`.

Noll fel på sju sidor betyder både att ingen tysk sträng nådde kunden OCH att
ingen post i listan är ett falsklarm mot vår text.

## Nästa

Kontorsstolsfamiljen har ~164 utkast kvar.
