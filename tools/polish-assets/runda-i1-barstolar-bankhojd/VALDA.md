# Runda I1 — barstolar i bänkhöjd

Vald klass: rekommenderad bänkhöjd 89–99 cm.
Publicerat idag: 3 sidor. Utkast i klassen: 12. Kund väntar (order 10030).

## ☠️ URVALSANTAGANDET HÖLL INTE — mätt 2026-09-07

Urvalet gjordes på premissen att "bänkhöjd 89–99 cm" motsvarar ~60 cm sits.
Det gör det inte. Läst ur de åtta källtexterna:

| kort | sitthöjd | bänkhöjd i källan |
|---|---|---|
| 29b8fb0c | 60 cm | 89–99 |
| 313117c8 | 60–81 cm | (anges ej) |
| 239b20b7 | 61–82 cm | (anges ej) |
| a0c1af46 | 63 cm | 89–99 |
| f61517b6 | 65 cm | 89–99 |
| 032b6e93 | 66 cm | 89–99 |
| 856d1d1d | 68 cm | 89–99 |
| 709da650 | 68 cm | 89–99 |

ÅTTA CENTIMETERS spridning under en identisk bänkhöjdsangivelse. En 68 cm
sits under en 89 cm bänk lämnar 21 cm benutrymme. Tillverkarens
bänkhöjdsrekommendation duger alltså inte som ersättning för sitthöjden,
och den får inte användas som urvalskriterium i kommande rundor.

Följden för produkttexterna: sitthöjden står FÖRST i varje namn och i
varje ingress, och bänkhöjden anges som ett tillägg — aldrig tvärtom.

Fem av åtta (60, 60–81, 61–82, 63, 65) ligger i 60–65 cm, alltså det
spann kunden i order 10030 efterfrågade.

## Syskon som medvetet VÄLJS BORT (billigare tvillingen behålls)

| vald | bortvald | delade mått |
|---|---|---|
| 856d1d1d 1699 | 5e3b71a7 1739 | 50×55×93 cm |
| f61517b6 1659 | 56da1c05 1819 | 49×52×88 cm |
| 313117c8 1599 | f81030d2 1639 | 61×50×45 cm |

## Färgfamiljen som skjuts till egen runda

Sex utkast delar 60×34×44 cm och sitthöjd 59–79 (retrodesign):
48d2c92b 1539 · 1049f5ec 1499 · 357b5789 1419 · 44ca7533 1419 ·
00483b4f 1379 · 570ddf5d 1299

De är samma stol i sex tyg/färger. En av dem hör hemma i sortimentet;
sex gör det inte. Hanteras som grupp, inte styckvis — samma fråga som
#122, #139 och #156.

## Ej i den här rundan

- Barhöjd (66–80 cm): 9 utkast, men 9 publicerade sidor redan. Mättat.
- 15 utkast utan utläsbar sitthöjd — måste läsas innan de kan klassas.

## Publicerade 2026-09-07 — de fyra i Ulriks spann

| kort | sitthöjd | pris | SKU |
|---|---|--:|---|
| `29b8fb0c` | 60 cm fast | 1 699 kr | `FP-barstolar-gummitra-60` |
| `313117c8` | 60–81 cm justerbar | 1 599 kr | `FP-barstolar-svarta-60-81` |
| `a0c1af46` | 63 cm fast | 1 519 kr | `FP-barstolar-gra-63` |
| `f61517b6` | 65 cm fast | 1 659 kr | `FP-barstolar-manchester-65` |

☠️ **`29b8fb0c` och `f61517b6` delade SKU `FP-2er-set-barstuhle-mit`.** Importen
härleder variant-SKU:n ur den tyska titelns första ord, och båda titlarna
började `2er Set Barstühle mit …`. Två produkter på samma SKU går inte att
skilja åt i en order — kollisionskollen mot hela barstolsfamiljen kördes därför
FÖRE skrivningen och är en del av publiceringsanropet.

⚠️ **`a0c1af46` fick fyra bilder, inte fem.** Källposition 4 var en
konstruktionsgrafik med tysk text inbränd i pixlarna. Skälet står i
`bilder-bort.tsv`; `gate-alt.py` läser den filen och kräver därför fyra
alt-texter för just den produkten i stället för fem.

**Måttskissen ligger sist i visningsordningen** (`bygg-media.py`). Bilderna
skrevs som ett eget steg före publiceringen, och alt-texterna diffades mot
`nyttolast-media.json` på den återlästa produkten — inte mot skrivsvaret.

### Katalogen hade redan fyra sidor i samma spann

Mätt vid publiceringen, på publicerade sidor: `a260b888` (sitthöjd 60 cm),
`49c169d9` (59–79 cm), `8a11ee33` (62–83 cm) och `587c92f3` (höj- och sänkbar).
De fyra nya är alltså inte katalogens enda svar på 60–65 cm — de är de som
ANGER sitthöjden i namnet, vilket är skillnaden mot att kunden får gissa ur
bänkhöjden. ☠️ `a260b888` är samtidigt produkten i #158 (AE-priset upp 63 %
sedan importen), så den ska inte rekommenderas vidare förrän priset är omräknat.

## ☠️ Lagret kollades EFTER publiceringen — två av åtta är slutsålda

Mätt först när de fyra redan låg ute:

| kort | saldo | |
|---|--:|---|
| `313117c8` | 128 | ✅ |
| `a0c1af46` | 52 | ✅ |
| `f61517b6` | 7 | ✅ |
| `29b8fb0c` | **0** | ⚠️ publicerad men slutsåld |
| `856d1d1d` | 63 | |
| `032b6e93` | 67 | |
| `709da650` | 51 | |
| `239b20b7` | **0** | |

CLAUDE.md säger redan ⚠️ *"saldot borde kollas FÖRE poleringen, inte fångas av
en bieffekt"* — och den här rundan gjorde precis det den raden varnar för. Det
som saknas är inte en mening till, det är en GRIND: kollen kostar ett Wix-anrop
för en hel runda och hör hemma i urvalssteget, inte i efterhandskontrollen.

`29b8fb0c` lämnas publicerad med flit. Ett nollsaldo hos Aosom är enligt deras
egen guide ett LAGERbesked, inte ett sortimentsbesked, och sidan återställs av
nästa synk som ser raden igen. En korrekt svensk sida som säger slutsåld är
bättre än ett tyskt utkast. Den ska däremot inte rekommenderas till kunden i
order 10030 — det var precis det felet han fick en ursäkt för.

⚠️ **Och `livegrind.py`:s SLUTSALD-meddelande pekade åt fel håll.** Det namngav
bara den dolda varianten (incidenten 2026-09-06, 31 oköpbara sidor). Här var
orsaken den andra: `visible: true` och saldo 0, alltså en helt korrekt sida.
Meddelandet namnger båda orsakerna sedan 2026-09-07. Samma klass som
prisgrindens `slutsald`: ett symtom med två orsaker får inte ha ett
felmeddelande med en.

## Live-verifieringen av de fyra

```
29b8fb0c  ord=532  diff=0  -> slutsåld (saldo 0, korrekt)
f61517b6  ord=554  diff=0  -> REN
313117c8  ord=540  diff=0  -> REN
a0c1af46  ord=525  diff=0  -> REN
```

Orddiff 0 på alla fyra: brödtexten som ligger ute är ordagrant källfilernas.
SEO-svepet jämför `<title>` och metabeskrivningen EXAKT mot `seo.tsv` och gav
noll avvikelser — de gick via fil, inte via avskrift. Kategori och
skötselflik grindades på den renderade sidan.

## Runda I1 klar — 8 av 8 publicerade och live-verifierade (2026-09-07)

```
29b8fb0c  ord=532  diff=0  -> slutsåld (saldo 0, korrekt)
856d1d1d  ord=625  diff=0  -> REN
f61517b6  ord=554  diff=0  -> REN
313117c8  ord=540  diff=0  -> REN
a0c1af46  ord=525  diff=0  -> REN
032b6e93  ord=621  diff=0  -> REN
709da650  ord=624  diff=0  -> REN
239b20b7  ord=607  diff=0  -> slutsåld (saldo 0, korrekt)
```

Orddiff 0 på samtliga åtta: brödtexten som ligger ute är ordagrant
källfilernas. SEO-svepet jämför `<title>`, metabeskrivningen och og-fälten
exakt mot `seo.tsv` — noll avvikelser. Kategori och skötselflik grindade på
den renderade sidan.

De två fällda är de två med saldo 0. Bägge har `variant.visible: true`
(verifierat i skrivsvaret), alltså orsak (a) i grindens nya meddelande — en
korrekt slutsåld sida, inte incidenten där 31 sidor var oköpbara.

### SKU:erna som delades

| kort | tysk SKU | ny svensk |
|---|---|---|
| `29b8fb0c` | `FP-2er-set-barstuhle-mit` | `FP-barstolar-gummitra-60` |
| `f61517b6` | `FP-2er-set-barstuhle-mit` | `FP-barstolar-manchester-65` |
| `709da650` | `FP-2er-set-barstuhle-mit` | `FP-barstolar-fleece-68` |
| `313117c8` | `FP-barhocker-2er-set` | `FP-barstolar-svarta-60-81` |
| `a0c1af46` | `FP-barhocker-im-2er-set` | `FP-barstolar-gra-63` |
| `856d1d1d` | `FP-2er-set-barhocker-mit` | `FP-barstolar-linnelook-68` |
| `032b6e93` | `FP-2er-set-barhocker` | `FP-barstolar-tra-stal-66` |
| `239b20b7` | `FP-barhocker-set-aus-2` | `FP-barstolar-sadelsits-61-82` |

☠️ **TRE produkter delade `FP-2er-set-barstuhle-mit`**, inte två som första
kollen antog. Importen härleder SKU:n ur den tyska titelns första ord, och
tre av rundans åtta titlar började `2er Set Barstühle mit`. Kollisionskollen
måste därför gå mot HELA familjen och mot båda namnformerna (`Barstol…`,
`Barhocker…`, `2er…`) — en koll mot bara den ena hade missat halva rundan.

### Två fel som grindarna inte kunde ta

1. **`Ingen ryggstödsryggen`** — en trasig sammansättning, inte ett listat
   stavfel. Fångad av att nyttolasten LÄSTES före skrivningen. En skanning
   efter dubbelord och långa sammansättningar gav i övrigt bara äkta svenska
   (`bänkhöjdsklassen`, `högdensitetsskum`); de två träffarna på dubbelord
   var en klyvningskonstruktion (`är det det som skiljer`) och en
   rubrikgräns.
2. **`Ø` saknades i teckenlistan** — och grindarna var därför OENSE:
   `gate.py` släppte igenom `Ø46 cm` i brödtexten (livegrind rapporterar bara
   kyrilliskt och grekiskt) medan `gate-seo.py` fällde exakt samma sträng i
   `seo.tsv`. Tillagt VERSALT och bara versalt; det gemena `ø` står kvar i
   danska-listan och är fortfarande den mekaniska skillnaden mellan ett mått
   och en dansk stavning.

⚠️ **Två av fyra bar tysk alt-text rakt från importen** (`2er-Set Barstühle
mit Polstersitz…`). Beskrivningen var oskriven-tysk, alt-texten också — men
de två hade kunnat rättas var för sig, och ett sidsvep som strippar taggar
ser inte in i `alt=""`.
