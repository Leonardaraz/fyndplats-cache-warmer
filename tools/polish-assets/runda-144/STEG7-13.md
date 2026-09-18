# Runda 144 — Steg 7–13: text, SKU, kategori, publicering

## ☠️ En RÅ variantsInfo-PATCH publicerar utkastet — även utan Wix-kodens skydd

CLAUDE.md dokumenterar redan att `variantsInfo`-PATCH via `updateV3VariantPrices`
kan publicera ett utkast, och att den funktionen numera alltid skickar tillbaka
`visible` oförändrat som motmedel. Den här rundan visar att skyddet sitter i
DEN FUNKTIONEN — inte i Wix API:t. Ett RÅTT anrop rakt mot
`PATCH /stores/v3/products/{id}` som bara rör `options` + `variantsInfo`
(Steg 8:s SKU-byte) fick alla åtta produkter att gå från `visible:false` till
`visible:true`, TROTS att `visible` aldrig fanns med i anropet.

Verifierat oberoende (ny `GET`, inte bara PATCH-svarets eko) på alla åtta:
`visible: true` på produktnivå, `variantsInfo.variants[0].visible: true`.

**Vad som räddade rundan:** innehållet var redan komplett och korrekt (Steg
3–7 klara) när det hände, så den enda skadan var ORDNINGEN — produkterna gick
live innan Steg 10 (kategori) hunnit köras, alltså några minuter med rätt text
men fel/ingen kategori. Ingen felaktig eller ofärdig text nådde kund. Steg 10
kördes omedelbart efteråt och stängde luckan.

**Regeln för nästa runda: en variantsInfo-PATCH är en publicerings-operation,
punkt.** Kör den ALDRIG separat från Steg 10/13 längre — antingen (a) gör
SKU-bytet i SAMMA anrop som den avsedda publiceringen, efter att kategori och
allt annat är klart, eller (b) om SKU måste bytas tidigare, kör Steg 10
(kategori) OMEDELBART efter, aldrig som ett senare steg i sekvensen. Att lita
på att `visible:false` "står kvar för att jag inte rörde det" är bevisat fel.

## Steg 7 — text, slug, seoData (alla åtta)

Skrivet via `plainDescription` (bekräftat skrivbart HTML-fält i V3:s
`UpdateProduct`-schema — `description`-fältet är rich-content-noder och
används INTE här, eftersom `plainDescription` uttryckligen ignoreras om
`description` också skickas). `seoData` byggd i samma form som källans
tyska (title-tagg, og:title, meta description, og:description, og:type,
`settings.keywords`).

| pid | ny slug | ny SKU |
|---|---|---|
| ff590562 | foliehus-natdorr-stodstanger-396x300-cm | FP-foliehus-natdorr |
| d44fd4bd | bagformat-foliehus-sandficka-180x180-cm | FP-bagformat-foliehus |
| 00e49c84 | tunnelvaxthus-rullbar-dorr-fonster-200x300-cm | FP-tunnelvaxthus-rullbar |
| f8d3a8fd | vaggvaxthus-aluminium-skjutdorr-192x68-cm | FP-vaggvaxthus-aluminium |
| 760f493a | minidrivhus-i-tra-90x52-cm | FP-minidrivhus-tra-90x52-cm |
| 52b12860 | rundbagigt-vaxthus-natfonster-395x195-cm | FP-rundbagigt-vaxthus |
| c816963e | vaxthusskap-i-tra-58x44-cm | FP-vaxthusskap-tra-58x44-cm |
| ca16f9ab | vaxthus-aluminium-skjutdorr-190x132-cm | FP-vaxthus-aluminium |

Alla åtta PATCH-svar gav `ok:true` med stigande `revision` och rätt `slug`/
`urlPath` — verifierat i samma svar, inte antaget.

## Steg 8 — SKU, byggd med KODENS EGEN algoritm, inte gissad

`lib/import/sku.ts` lästes direkt ur repot innan en enda SKU skrevs för hand.
Formatet är `FP-<produkt-tokens joinade ≤24 tecken på ordgräns>` (inget
variant-suffix, eftersom alla åtta är envariantsprodukter). Bindeordet "i"
strippas (`minidrivhus-i-tra` → `minidrivhus-tra-…`), och tokens kapas på
HEL ordgräns, aldrig mitt i ett ord — exakt samma logik som producerar
katalogens övriga `FP-`-SKU:er.

☠️ **`variantsInfo`-PATCH ersätter hela variantobjektet, inte bara fältet som
ändras.** Varje variants FULLSTÄNDIGA nuvarande tillstånd lästes (`price`,
`inventoryStatus`, `choices`, `visible`, och — för `00e49c84` och `ca16f9ab`
— ett variant-nivå `media`-objekt) och ekades tillbaka oförändrat i samma
anrop som satte den nya SKU:n. Två av åtta hade redan `media` på
variantnivå; att utelämna det hade riskerat att radera det (samma klass fel
som #501: "VARJE variantsInfo-PATCH raderar variantens media — även en som
inte skickar media").

Alla åtta PATCH-svar bekräftade rätt SKU och `hasMedia:true`.

## Steg 10 — kategori (parent + leaf), inte bara "All Products"

Den kategori-id som redan låg på alla åtta vid import
(`05e96cd6-…`) visade sig vid uppslag vara **"All Products"** — den
automatiska katalogen varje produkt får, inte en riktig kategori. Rätt
kategoripar hämtades genom att slå upp en redan publicerad släkting från
runda 50 (`5f7566a1`, växthus i aluminium) via
`list-categories-for-item`:

- **Trädgård & Utemöbler** (`653ab052-…`, förälder)
- **Växthus & Odling** (`8bcfeb20-…`, löv)

Skrivet med `POST /categories/v1/bulk/categories/add-item` (ett item, två
kategori-id:n i samma anrop). Alla åtta gav `totalSuccesses:2,
totalFailures:0`. Verifierat en gång till med `list-categories-for-items`
efteråt: alla åtta bär nu samtliga tre kategorier (förälder, All Products,
löv) — samma mönster som runda 50:s släkting.

## Steg 12 — läs-som-kund

Kategoriverifieringen ovan fungerade dubbelt: den bekräftade både att Steg 10
landade och att sidorna är fullständiga (rätt namn, rätt slug, rätt SKU, rätt
kategori) innan rundan stängs.

## Steg 13 — publicering

Skedde de facto redan i Steg 8 (se fyndet högst upp), bekräftat oberoende.
Ingen ytterligare publiceringsåtgärd behövdes eller gjordes.

## Mappningen stämplad (Steg 8:s andra halva)

`polish-mapping.yml`, läge `stampla`, kört för alla åtta:
`needs_ai_polish: false`, `draft_status: published`,
`variant_skus: {"<wixVariantId>":"<ny SKU>"}` — exakt kontraktet ur
workflow-filens egen `description`-text (`{"wv1":"FP-baddsoffa"}`-formen),
inte gissat. Alla åtta jobb: `conclusion: success`.

## ✅ Runda 144 LIVE — åtta växthus i sex konstruktioner, 8 av 8 gröna

| pid | namn | pris | konstruktion |
|---|---|--:|---|
| ff590562 | Foliehus med nätdörr och stödstänger | 1 829 | rakväggigt/bågtak, PE+stål |
| d44fd4bd | Bågformat foliehus med sandficka | 799 | låg bågtunnel, plast+stål |
| 00e49c84 | Tunnelväxthus med rullbar dörr och fönster | 1 249 | tunnel, galvaniserat stål |
| f8d3a8fd | Väggväxthus i aluminium med skjutdörr | 2 719 | lutande väggväxthus, PC+aluminium |
| 760f493a | Minidrivhus i trä | 779 | träram, minidrivhus |
| 52b12860 | Rundbågigt växthus med nätfönster | 1 759 | rundbågsform, PE+stål |
| c816963e | Växthusskåp i trä med två hyllplan | 1 099 | skåpsmodell, trä+PC |
| ca16f9ab | Växthus i aluminium med skjutdörr och takfönster | 4 049 | premium, aluminiumlegering+PC |

De resterande ~78 kärnväxthusen (STEG1-2.md) tas i kommande rundor.
