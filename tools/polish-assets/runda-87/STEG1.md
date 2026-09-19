# Runda 87, Steg 1 — förrådstält och garagetält

Katalogsvep: **5 527 produkter, 3 388 osynliga utkast, 2 139 publicerade.**
Svepet gick klart (`avhuggen: false`) och hittade kända publicerade sidor, så
"noll krockar" är inte ett tomt svar den här gången.

## ☠️ Den SNÄVA regexen missade tolv publicerade bodar — och en av dem krockar

Första mätningen sökte på `redskapsbod|tradgardsforrad|tradgardsskap|…` och gav
**30 publicerade** sidor i familjen. En bred körning (`talt|garage|bod|box|…`)
gav tolv till som den första aldrig kunde se, för de heter något annat:

```
plastbod-182x151-cm-sadeltak          platbod-213x130-cm-smal-takfonster
plastbod-dubbeldorr-182-cm            platbod-236x171-cm-skjutdorrar-morkgra
plastbod-enkeldorr-182-cm             platbod-240x206-cm-snolast-30-kg-las-9-stodpelare
plastbod-sadeltak-181-cm              platbod-277x195-cm-4-8-kvm-skjutdorrar-brun
plastskjul-238-x-125-m-golv-ingar     platbod-277x195-cm-glasfibertak-ljusgra
                                      platbod-gra-345x280-cm
                                      platbod-gron-345x280-cm
```

☠️ **Och två av dem har EXAKT de mått fyra utkast bär.**
`platbod-277x195-cm-…` mot utkasten `7f8ea27e` (Gelb), `88211ae3` (Hellgrün),
`4374a31f` (Grau) och `4cae56ac` (Kohlegrau) — alla `2,77 × 1,95 × 1,92`.
Samma sak en storlek ner: `platbod-213x130-cm-smal-takfonster` mot `a414b5b5`,
`98e00d6b` och `c6c4c5a9`, alla `2,13 × 1,30 × 1,85`.

**Metallbodarna med skjutdörrar är alltså INTE en tom kategori** — de är sju
utkast som med stor sannolikhet är färgsyskon till sidor vi redan säljer. Det
är den interna dubbletten CLAUDE.md beskriver, och den kräver en
måttjämförelse produkt för produkt, inte en poleringsrunda. Lämnas till en
egen genomgång.

**Lärdomen är metodisk och gäller varje framtida runda:** en familjemätning
måste köras med en BRED regex och sållas för hand. En snäv regex svarar inte
"noll krockar" — den svarar "jag sökte inte där", och de två ser likadana ut.

## Familjen: tio förvaringstält, noll publicerade konkurrenter

Kvar i förrådsfamiljen efter runda 86 är ~53 utkast. De delar sig i tre
grupper med helt olika förutsättningar:

| grupp | utkast | publicerat | omdöme |
|---|--:|--:|---|
| Metallbodar med skjutdörrar | ~20 | **12 plåtbodar** | ☠️ dubblettrisk, egen genomgång |
| Träbodar och plastbodar | ~15 | 9 | delvis täckt |
| **Tält på stålstomme** | **10** | **0** | **tom kategori → runda 87** |

Den publicerade `cykeltalt-silverbelagd-oxford` är inte en konkurrent: den är
ett **popup-tält i 210D Oxford på glasfiberstommar för 699 kr** som packas i
en bärväska. Våra tio är **galvaniserad stålstomme med PE- eller
polyesterduk, 1 319–3 149 kr**, förankrade i marken. Två olika produkter.

☠️ **Men den äger ordet "cykeltält".** Utkastet `8bdba748` heter
`Fahrradzelt` på tyska, och hade det översatts rakt av hade en 1 499-kronors
sida slagits mot en 699-kronors om samma sökord. Det heter **cykelgarage**
i stället — Tältpartner använder ordet som kategorinamn, och ingen publicerad
sida bär det.

### Sökordet är mätt, inte gissat

Familjeordet är **garagetält**. Det är kategorinamnet hos Jula
(*Bil och garage → … → Bilkapell och överdrag*) och hos BAUHAUS
(*Förvaringstält & Garagetält*), och Tältpartners kategori heter
*garagetält & cykelförråd*. `förrådstält` och `förvaringstält` förekommer i
brödtext men inte som kategorinamn — de blir relaterade sökord.

☠️ **Åtta sidor på ordet "garagetält" kannibaliserar varandra** om inget
skiljer dem. Kvalificeraren är därför STORLEKEN i namn, slug och titel, precis
som runda 85 gjorde med literantalet och runda 86 med bredden.

⚠️ **Och marknaden säljer exakt vår produkt.** Julas *Garagetält
2,2 × 1,57 × 1,63 m, plats för tre cyklar, galvaniserade stålrör, PE-duk
195 g/m²* är samma vara som `20c0942e`/`5f6592ad` (162 × 221,5 × 163 cm).
Formuleringen "plats för tre cyklar" är hur marknaden beskriver kapacitet —
och våra tyska texter anger den siffran själva, så den behöver inte gissas.

## De åtta

| id8 | mått B × D × H | golvyta | duk | dörr | vikt¹ | pris | färg |
|---|---|--:|---|---|--:|--:|---|
| `72051417` | 120 × 179 × 165 | 2,15 m² | PE | 106 × 126 | 14 kg | 1 379 | ljusgrå |
| `a165b178` | 120 × 179 × 165 | 2,15 m² | PE | 106 × 126 | 14 kg | 1 399 | mörkgrå |
| `5f6592ad` | 162 × 221,5 × 163 | 3,59 m² | PE | 130 × 126 | 17 kg | 1 319 | mörkgrå |
| `20c0942e` | 162 × 221,5 × 163 | 3,59 m² | PE | 130 × 126 | 17 kg | 1 599 | ljusgrå |
| `8bdba748` | 245 × 120 × 200 | 2,94 m² | 200 g/m² | 157 × 160 | 12,6 kg | 1 499 | mörkgrå |
| `0f5e3fea` | 190 × 230 × 220 | 4,37 m² | polyester | 147 × 185 | 18,5 kg | 1 869 | mörkgrå |
| `6a419d8b` | 300 × 300 × 210 | 9 m² | 200 g/m² | 166 × 172 | 23 kg | 2 129 | mörkgrå |
| `95a9d7cc` | 300 × 447 × 255 | 13,4 m² | PE | 237 × 190 | 54,5 kg | 3 139 | ljusgrå |

¹ Paketvikt — se fynd 5.

**Deferrade med skäl:**

- `204b66ce` (160 × 218 × 172, 1 599 kr). Golvytan är 3,49 m² mot
  `5f6592ad`/`20c0942e`:s 3,59 — två centimeter på bredden och tre och en
  halv på djupet. Den ska skrivas MOT det paret, inte bredvid det, och paret
  skrivs den här rundan.
- `f1acf38f` (300 × 300 × 235, 3 149 kr). Exakt samma fotavtryck som
  `6a419d8b` men 25 cm högre och tusen kronor dyrare. Samma resonemang.

## Sju fynd

### ☠️ 1. Fyra produkter delar två SKU:er — och det är IMPORTEN som gör det

```
FP-gartenschuppen-lagerzelt   72051417 + a165b178
FP-garagenzelt-2-2-x-1-6-m    20c0942e + 5f6592ad
FP-tragbarer-gartenschuppen   8bdba748 + 6a419d8b
```

SKU:n härleds ur det tyska NAMNET, och färgsyskon delar namn. Det är samma
mekanism som redan är nedskriven: krocken skapas vid importen, inte av
poleringen. Steg 8 ger var och en en egen SKU ur den nya sluggen.

### ☠️ 2. `8bdba748` och `6a419d8b` har SAMMA NAMN och är OLIKA PRODUKTER

Båda heter `Tragbarer Gartenschuppen, Fahrradzelt, Rolltür mit
Reißverschluss`. Sedan säger de tekniska data:

| | `8bdba748` | `6a419d8b` |
|---|---|---|
| Mått | 245 × 120 × 200 | **300 × 300 × 210** |
| Golvyta | 2,94 m² | **9 m²** |
| Vikt | 12,6 kg | **23 kg** |
| Fönster | nej | **ja, 47 × 40** |
| Pris | 1 499 | **2 129** |

Namnet bevisar ingenting; `Technische Daten` gör det. Samma lärdom som
runda 59.

### ☠️ 3. Två färgsyskon skiljer 280 kr — och det är inte vårt att röra

`5f6592ad` (mörkgrå) 1 319 kr mot `20c0942e` (ljusgrå) 1 599 kr, identiska
i varje mått, vikt och materialrad. Priset sätts av importen ur
leverantörens inköpspris och är Leonards beslut. **Texten får därför aldrig
påstå att syskonen kostar lika mycket** — den nämner färgen och länkar, inget
mer. Flaggat, inte rättat.

### ☠️ 4. Den svenska måttraden har KASTAT OM bredd och djup

Tyskan skriver `190B x 230T x 220H` — 190 bred, 230 djup. Den maskinsatta
svenska raden säger `Mått: 190L x 230B x 220H`, alltså 190 LÅNG och 230 BRED.
Tyskans `B` (Breite) har blivit svenskans `L` och tyskans `T` (Tiefe) har
blivit `B`. Samma omkastning på alla åtta.

**Varje mått i den här rundan läses ur `Technische Daten`, aldrig ur den
svenska raden.** En kund som väljer plats efter "190 lång" ställer tältet
tvärtom.

### ☠️ 5. `Vikt` är PAKETVIKT — runda 86:s fynd gäller här också

Feedens kolumn heter `Weight (incl. Package)`. Ingen av de åtta anger
produktvikt separat, så raden heter **`Vikt med emballage`** överallt.

### ☠️ 6. `0f5e3fea` säger emot sig själv om vattentätheten

Namnet: `Wasserabweisend` (vattenavvisande). Brödtexten två rader ned:
`wasserdichter … Abdeckung` och `Wasserfeste Polyesterabdeckung`
(vattentät). Det är två olika löften om samma duk.

Sidan säger därför **vattenavvisande** — det svagare av de två, eftersom vi
inte kan avgöra vilket som stämmer och ett för starkt löfte om en duk är ett
löfte om innehållet under den.

### ☠️ 7. SNÖLASTEN är rundans farligaste uppgift

Bara två av åtta anger en siffra: **5 kg/m²** (`0f5e3fea`) och **10 kg/m²**
(`20c0942e`/`5f6592ad`). Till jämförelse bär husets egen publicerade
`platbod-240x206-cm-snolast-30-kg-…` texten *"30 kg/m² är inte mycket i
fjällvärlden, men det är en siffra"* — och tälten ligger på en sjättedel
respektive en tredjedel av det.

☠️ **Och tyskan kallar två av dem `winterfest`.** `0f5e3fea` säljs som en
*"winterfeste Lösung"* med 5 kg/m², och `95a9d7cc` som ett *"winterfestes
Lagerzelt"* utan att ange någon snölast alls.

**Ordet "vinterklar", "vintersäker" eller "vinterfast" får inte förekomma på
någon av de åtta sidorna.** Det som skrivs i stället är husets etablerade
formulering från plåtboden: den angivna snölasten är en gräns och inte en
garanti, snön ska bort från taket, och står tältet ute över vintern är det
den som måste skottas.

⚠️ Vindtåligheten är i samma klass: `20c0942e`/`5f6592ad` anger
*"Windresistenz bis zu Stufe 5"* — Beaufort 5, alltså frisk bris. Tre av de
åtta säger dessutom uttryckligen att tältet ska ställas mot en vägg för att
tåla vind bättre. Det är ett användningsvillkor, inte en säljpunkt, och står
som ett sådant.
