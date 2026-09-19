# Runda 114 — nio kylprodukter i fem grupper

**LIVE, 9 av 9 gröna.** Kylapparatsfamiljens sista utkast: en kylvagn, två
kosmetikkylar, två minikylar som också värmer, två passiva kylboxar, ett
kylskåp med frysfack och en dryckeskyl.

| nyckel | sida | SKU |
|---|---|---|
| `397b845e` | kylvagn-56-liter-84-cm-bred | `FP-kylvagn-56l-84cm` |
| `412c9f43` | kosmetikkyl-6-liter-spegel-rosa | `FP-kosmetikkyl-6l-rosa` |
| `d754d015` | kosmetikkyl-6-liter-spegel-vit | `FP-kosmetikkyl-6l-vit` |
| `758f0a80` | minikyl-4-liter-kyler-och-varmer-rosa | `FP-minikyl-4l-rosa` |
| `d5cc9efa` | minikyl-4-liter-kyler-och-varmer-cremevit | `FP-minikyl-4l-cremevit` |
| `b3e3aac8` | kylbox-42-6-liter-utan-el | `FP-kylbox-42l-passiv` |
| `b815de72` | kylbox-70-liter-pa-hjul | `FP-kylbox-70l-hjul` |
| `e6d2e70b` | kylskap-91-liter-frysfack | `FP-kylskap-91l-frysfack` |
| `ef0fa603` | dryckeskyl-44-liter-svart | `FP-dryckeskyl-44l` |

Priserna lästes före, ekades tillbaka oförändrade och jämfördes efter:
1629 · 1159 · 869 · 799 · 849 · 1399 · 2099 · 2339 · 2199 — **orörda**.
43 mediaposter med svensk alt-text, återlästa 1:1 med hjältebilden först.
18 kategorilänkar skrivna (2 per produkt), verifierade efter propagering:
alla nio bär tre kategorier — de två skrivna plus "All Products".

## ☠️ Fyra fel som grinden hittade i sig själv, inte i texten

### 1. En FALSK GODKÄNNANDE — negationen låg 120 tecken bort, i ett annat svar

Två färgsyskon med **ordagrant identiska** FAQ-frågor fick olika verdikt. Den
som passerade ursäktades av ett `ingen` som stod i en **annan** FAQ-fråga längre
ned. `_mening_kring` sträckte sig över meningsgränsen.

Lagat: `_nasta_mening` returnerar EN mening, `?` räknas som meningsslut, och
`nej` lades till i NEGATION. Ett självtestfall skiljer nu "…? Nej" från
"…? Ja, absolut. Det finns ingen anledning att tveka."

☠️ **En falsk godkännande är dyrare än ett falsklarm.** Ett falsklarm stoppar
dig; en falsk godkännande släpper igenom och ser ut som ett kvitto.

### 2. Skötseltexten bad ett skåp UTAN frysfack att frosta av frysfacket

`ef0fa603` är en dryckeskyl med termostat 4–18 °C och **inget frysfack**. Den
delade skötseltext med kylskåpet i samma grupp, som har ett. Kunden fick
alltså en instruktion för en del produkten saknar.

Lagat med skötseltext PER PRODUKT (`SKOTSEL.get(k, SKOTSEL.get(g, ""))`) och en
egen grind. ☠️ Grinden fällde först på syskonlänken *"ett kylskåp … med
frysfack"* — den är korrekt, för länken beskriver GRANNEN. Grinden läser
därför `egen`, sidan utan syskonstyckets stycke.

### 3. `SKALAN` var en delsträng — "en hyll**a till g**lasen" räknades som skalan

`"a till g" in txt.lower()` godkände energiskalan på en kylvagn som inte har
någon energiklass. Ordgräns (`\bA till G\b`) i stället. Samma lärdom som `\b`
i runda 88 och den tyska ordlistan i runda 61: **en delsträng är ingen
ordkontroll.**

### 4. Syskonstrykningen stannade INNE I URL:en

`Finns också som [^.]*\.` slutade vid första punkten — och `www.fyndplats.se`
bär tre. Strykningen tar nu hela `<p>Finns också som …</p>`.

## ☠️ Live-grinden fällde en korrekt sida på butikens EGNA IKONER (Steg 14)

`kylskap-91-liter-frysfack` föll på det utelämnade fältet `0-5`. Mätt: alla
tre träffarna sitter i **SVG-geometri** — Google-, Facebook- och
Instagram-ikonerna plus presentikonen vid "Fri frakt över 499 kr". `0-5` är
där ett koordinatpar i ett `d`-attribut.

☠️ **Och den läckte genom `<script>`, inte genom `<svg>`.** Uppmätt åt båda
håll: ett HTML-`<svg>` ger **0** träffar i `synlig_meningstext` (taggen stryks
redan), Next.js flight-payloaden ger **3**. Sidan bär båda formerna, och det
är script-formen som når grinden. Ett första självtestfall skrev ikonen som
HTML-`<svg>` och **bevisade ingenting** — mutationsprovet fällde noll fall.
Det var mutationen som var fel, inte grinden; samma klass som självtest H i
runda 113.

Lagat surgiskt: `SVG_GEOMETRI` stryker `d` · `points` · `viewBox` ·
`transform` i BÅDA serialiseringarna — attributvärden, aldrig brödtext.
Verifierat genom att ta bort strykningen: exakt ett fall faller.

Tredje gången samma familj: runda 111 läste grannens produktnamn, runda 112
läste Wix egen `srcset` där `1080w` är en bildbredd. **Den underliggande
orsaken är större än den här rundan** — `synlig_meningstext` läser
`<script>`-innehåll, alltså hela den serialiserade React-payloaden, som om
det vore text kunden ser. Det gäller varje rundas live-grind.

## Tre fynd som lämnas till Leonard

1. ☠️ **De två kylboxarnas burkantal motsäger varandra.** Leverantören anger
   olika antal burkar för samma volym på 42,6- och 70-litersmodellen. Talet
   står därför inte på någon av sidorna, och `BURKTAL`-grinden vaktar det.
2. ⚠️ **`e6d2e70b`:s lås påstås bara av en marknadsföringsikon.** Ingen
   spec-rad, ingen bild av ett lås. Utelämnat, och `LASLOFTE`-grinden vaktar
   det live.
3. ⚠️ **Sju av nio har ingen energiklass alls i underlaget.** De två som har
   den (E) bär klass + skala enligt (EU) 2019/2016. Grinden går åt BÅDA håll:
   en påhittad klass på de sju fäller lika hårt som en saknad på de två.

## Dubbletten (#406) krävde ingen skrivning

`da0e9379` mot publicerade `d4e79563`, bildavstånd 0,00. Båda halvorna av
Leonards ommappningsregel är redan uppfyllda: sidan vi BEHÅLLER (`d4e79563`)
bär `supplier: "aosom"`, `aosomFreightShare 0.219` och ett levande feed-synk
(`aosomSyncedQty 116`, 2026-09-08), och dubbletten `da0e9379` bär redan
`draftStatus: "rejected"` + `needsAiPolish: false`.

☠️ **Men artikelnumret går inte längre att LÄSA härifrån**, och det är rätt så:
sedan 2026-09-07 undanhåller `polish-mapping.yml` `supplierProductId` och
`sourceUrl` ur Actions-loggen, eftersom repot är publikt och numret binder vår
sida till dealproffsen.se och därmed till vårt inköpspris.

⚠️ **Nästa äkta dubblett behöver därför antingen Leonard eller en ruttändring.**
`aosom-remap.yml` tar `sku` som ett vanligt workflow-input, och GitHub skriver
in det i den publika loggen — samma läcka som härdningen stängde. Den mekaniska
vägen är att låta rutten härleda artikelnumret SERVER-SIDE ur
`duplicateWixProductId` i stället för att ta emot det som text.
