# Fyndplats – SEO-optimera en produkt (runbook, inga uppslag behövs)

> Detta är en **körbar** instruktion. Följ stegen i ordning med de färdiga API-anropen nedan. Du behöver **inte** slå upp något schema (`SearchWixAPISpec`) – allt format är redan bekräftat och ifyllt.

## Fasta fakta (gäller alltid)

- Butik: **Fyndplats**, site ID `e6d27e90-4749-4720-9afe-0bbe91c1b3d3`, **Catalog V3** (default). (V1-siten `8c62127f-…` ska INTE användas.)
- Allt innehåll skrivs på **svenska**.
- **Märken – strippa dropship-husmärken, BEHÅLL etablerade märken** (Leonards beslut 2026-06-21). Råimporten lägger märkesnamnet först i `name`/titeln.
  - **Dropship-husmärken** (SucceBuy, Pawhut, HOMCOM, VEVOR, Outsunny, Giantex, Costway, Tobbi, Aosom … = strip-listan i `lib/import/sku.ts`): ta bort **helt** – ur produktnamn (H1), SEO-titel, meta description, slug, sökord och alla bild-alt-texter – och låt det generiska sökordet stå först.
  - **Etablerade tredjepartsmärken med eget sökvärde** (t.ex. **Pagani Design**, **LAIKOU**): **behåll** märket i name/titel/slug/sökord/SKU – det har eget sökvärde. Lägg det generiska sökordet bredvid (t.ex. `Pagani Design 007 – automatklocka herr`). Dessa märken ligger medvetet **inte** i strip-listan, så SKU-algoritmen behåller dem automatiskt.
  - Sätt **inga** separata märkesfält. Behålls märket: lämna ev. `brand`-fält. Strippas märket och ett gammalt `brand`-fält finns ifyllt: rensa det i samma Steg 2-PATCH (`"brand": null`).
  - Osäker på om ett märke är husmärke eller etablerat? **Behåll det och flagga till Leonard.**
- Frontend är headless Next.js/Vercel och uppdateras automatiskt via ISR – **ingen redeploy**.
- **Verifierat (2026-06-05):** frontend läser `seoData`-taggarna `title` + `meta description` → de blir sidans `<title>` och meta. `Product`-JSON-LD (namn, pris, lager, betyg) och OpenGraph **genereras automatiskt** av frontend från produktfälten – du behöver alltså INTE sätta `og:`-taggar i `seoData`.
- `ExecuteWixAPI` kräver godkännande. Skriv `fields` i request-**body** vid query/PATCH. **Läs om `revision` precis före varje PATCH.** API-svar är plain strings (skriv ändå `v?.value ?? v`).
- En PATCH är partiell: **bara fält du skickar ändras**. Skicka aldrig `options`/`variantsInfo` om du inte avser röra varianterna.
- **Priser slutar på 9, inga decimaler.** Importen sätter redan priset till hela kronor som avrundas **uppåt** till närmaste tal som slutar på 9 (t.ex. 499, 489, 579) — **ingen `.90`**. Ändrar du ett pris: avrunda alltid **uppåt** till närmaste 9-slut och skriv hela kronor (aldrig `,90`).
- **SKU sätts automatiskt vid import** (`FP-<produkt>-<variant>`, t.ex. `FP-temperingsmaskin-choklad-17-l`) och syns i kassan/Google/feed. Importen **strippar märkesordet** (HOMCOM/SucceBuy/VEVOR …) men bygger SKU:n ur den **råa** sluggen — så när du byter slug i Steg 2 ska du **re-synka SKU:n** till den nya svenska sluggen, se **Steg 2b**.
  - **SKU:n är en ren etikett — den parsas aldrig tillbaka.** Synk och fulfillment nycklar på **`wixVariantId` → `supplierVariantId`** (lagrad mapping i `lib/sync/aliexpress-sync.ts` + `lib/orders/tasks.ts`), **inte** på SKU-strängen. Att döpa om en SKU bryter alltså INTE leverantörskopplingen — formatet är fritt (krav: ≤40 tecken, unik inom produkten).
  - **Måste du ändå byta en variants SKU live:** skicka `options` **+** `variantsInfo` **verbatim** (som de kom från GET, ändra bara `sku`) + färsk `revision`. Skickar du `variantsInfo` utan `options` på en produkt med varianter → V3 svarar **428 `MISSING_OPTIONS_ON_UPDATE_VARIANTS`**. (En produkt helt utan optioner behöver inte `options`.)

**Input:** Wix-produkt-ID (+ ev. AliExpress-URL).

-----

## Steg 0 – Välj fokussökord (avgör allt annat)

Välj det svenska sökord folk faktiskt söker på, sammansatt av **huvudord + kvalificerare**, t.ex. `starthjälp bil`.
**Ringa in den exakta produkttypen, inte den breda kategorin.** Använd ordet för vad produkten *faktiskt är* (formen/typen), inte en generisk grupp – t.ex. `sadelstol` (inte "arbetsstol"), `hopfällbar massagebänk` (inte "möbel"). Det specifika ordet har oftast högre köpintention och mindre konkurrens, och matchar vad köparen söker.
**Regel:** båda orden MÅSTE hamna i **titel, produktnamn (H1) och slug** – annars flaggar Wix SEO-assistenten dem som röda. Ordet finns redan grönt i beskrivning/meta om det står i texten.
Specs får bara komma från känd importdata eller `web_search` (AliExpress-sidor är JS-blockerade). **Hitta inte på siffror.**

-----

## Steg 1 – Läs produkten (1 anrop, read-only)

```
GET https://www.wixapis.com/stores/v3/products/{PRODUCT_ID}?fields=DESCRIPTION&fields=PLAIN_DESCRIPTION&fields=URL&fields=MEDIA_ITEMS_INFO
```

Spara: `revision`, nuvarande `name`, `slug`, `seoData`, **`visible`**, samt **hela `media`** (du behöver `media.main` + alla `media.itemsInfo.items` med deras `id`, `uploadId`, `image` till Steg 3).

-----

## Steg 2 – PATCH namn + slug + seoData (1 anrop, mutation)

Bygg innehållet:

- **name (H1):** svenskt, sökordsrikt, börjar med fokussökordet (huvud + kvalificerare).
- **slug:** **ASCII** (inte å/ä/ö), gemener, bindestreck, innehåller fokussökordet inkl. kvalificeraren. (ASCII undviker kodningskrångel på headless-frontenden; Google klarar ändå båda.)
  - ⚠️ **Slug-varning (headless):** byt slug **bara på produkter som inte gått live än** (nyimporterade draft-produkter). Wix auto-redirect (`preventAutoRedirect:false`) gäller **bara Wix-hostade sajter, inte din headless** – så att byta slug på en redan indexerad produkt gör att den gamla URL:en **404:ar** och ranking tappas. För en redan publicerad produkt: **behåll befintlig slug**.
- **title-tagg:** ≤ ~60 tecken, fokussökord först, ev. `| Fyndplats`.
- **meta description:** ≤ ~155 tecken, nytta + sökord, **inga overifierade påståenden** (ingen "fri frakt" om det inte stämmer).

> **Viktigt:** en PATCH av `seoData` **ersätter hela objektet** – skicka därför ALLTID med samtliga taggar nedan, inte bara den du ändrar.

```
GET .../products/{PRODUCT_ID}        // hämta färsk revision precis innan
PATCH https://www.wixapis.com/stores/v3/products/{PRODUCT_ID}
```

```json
{ "product": {
  "id": "{PRODUCT_ID}",
  "revision": "{FÄRSK_REVISION}",
  "name": "<Produktnamn med fokussökord>",
  "slug": "<slug-med-fokussokord>",
  "seoData": {
    "tags": [
      { "type": "title", "children": "<SEO-titel ≤60 tecken>", "custom": false, "disabled": false },
      { "type": "meta", "props": { "name": "description", "content": "<meta ≤155 tecken>" }, "children": "", "custom": true, "disabled": false }
    ],
    "settings": {
      "preventAutoRedirect": false,
      "keywords": [
        { "term": "<fokussökord, t.ex. starthjälp bil>", "isMain": true, "origin": "USER" },
        { "term": "<relaterat sökord>", "isMain": false, "origin": "USER" },
        { "term": "<relaterat sökord>", "isMain": false, "origin": "USER" }
      ]
    }
  }
} }
```

> Frontend bygger OpenGraph + `Product`-JSON-LD själv från produktfälten, så `og:`-taggar i `seoData` behövs inte. Vill du ändå ha dem skadar de inte.

### (Om beskrivningen också ska skrivas om)

**Rekommenderat: skicka beskrivningen som `plainDescription` (ren HTML)** i samma Steg 2-PATCH. Wix **auto-genererar Ricos-`description`** för storefronten (samma väg som importen själv använder — `lib/import/pipeline.ts` skickar `plainDescription`, och V1→V3-migreringen i `lib/wix/v3-products.ts`), och `splitFlikar` läser HTML:ens `<h2>`. Lägre risk än att handbygga Ricos-noder och mycket svårare att göra fel. Lägg fokussökordet naturligt i texten.

PATCH-body: `{ product: { id, revision, name, slug, seoData, plainDescription: "<html…>" } }`.

- **Bra struktur:** ingress → **Egenskaper** (`<p><strong>Egenskaper</strong></p>` + `<ul><li>…</li></ul>`, inline) → `<h2>Tekniska specifikationer</h2>` → `<h2>Användning och skötsel</h2>` (valfritt) → `<h2>Vanliga frågor</h2>` (FAQ-frågor som feta `<p>`-stycken **i beskrivningen** — INTE egna info-sektioner, taket är 400).

> ⚠️ **Flik-rubriker MÅSTE vara rena `<h2>Titel</h2>` — ingen fetstil, inget `<span>`.** Headless-storefronten (`components/productview.tsx` → `splitFlikar`/`FLIK_TITLE_PATTERNS`) och `lib/import/tabs.ts` bygger PDP-flikarna genom att splitta beskrivningen på **bara** `<h2>Titel</h2>`. Blir HTML:en `<h2><span style="font-weight:700">Titel</span></h2>` (BOLD på rubriken) faller matchningen och "Tekniska specifikationer"/"Vanliga frågor" hamnar **inline** i stället för som flikar. Skriv fliktitlarna ordagrant — **Tekniska specifikationer**, **Vanliga frågor**, **Användning och skötsel** ("Kontakta oss" lägger frontenden till själv). Fet text är OK i **stycken** (t.ex. FAQ-frågor), aldrig på `<h2>`-raden. Skickar du ren `<h2>Titel</h2>` i HTML wrappar Wix den inte — då uppstår problemet inte.

> **Alternativ (Ricos direkt):** vill du hellre skicka `"description": { "nodes": [...] }` — stycke `{"type":"PARAGRAPH","id":"p1","nodes":[{"type":"TEXT","id":"","nodes":[],"textData":{"text":"…","decorations":[]}}],"paragraphData":{}}`, rubrik `{"type":"HEADING","id":"h1","nodes":[<TEXT utan decorations>],"headingData":{"level":2}}` (TEXT-noden **helt ren**), punktlista `{"type":"BULLETED_LIST","id":"ul1","nodes":[{"type":"LIST_ITEM","id":"li1","nodes":[{"type":"PARAGRAPH","id":"","nodes":[<TEXT>],"paragraphData":{}}]}]}`, fet `"decorations":[{"type":"BOLD","fontWeightValue":700}]` (bara i stycken, **aldrig** på HEADING). Samma flik-regel gäller.

-----

## Steg 2b – Re-synka SKU till den nya sluggen (1 anrop, mutation)

Importen byggde SKU:n ur den **råa** (engelska, märkesledda) sluggen, t.ex. `FP-2-4g-remote-control-1-st`. När du bytt slug i Steg 2 stämmer den inte längre — re-synka den så den matchar den **polerade svenska** sluggen, t.ex. `FP-radiostyrd-gravmaskin-1-st`. Ofarligt: synk/fulfillment nycklar på `wixVariantId`, inte på SKU-strängen (se SKU-noten i *Fasta fakta*).

**SKU-format** (= `lib/import/sku.ts`): `FP-<produkt>-<variant>` ur den **polerade sluggen** + variantens optionsvärde. ASCII (å/ä→a, ö→o), ledande **dropship-märke strippat** (etablerade märken som Pagani Design/LAIKOU behålls), produkt-delen **≤24 tecken** (kapa på bindestreck), variant-delen **≤12 tecken**, hela **≤40 tecken**, **unikt inom produkten**. Saknar produkten optionsvärden → bara `FP-<produkt>`.

```
GET .../products/{PRODUCT_ID}?fields=VARIANT_OPTION_CHOICE_NAMES   // slug, options, variants (sku + optionsnamn) + färsk revision
PATCH .../products/{PRODUCT_ID}
```

Bygg nya SKU:er ur GET-svaret och PATCHa **bara** `sku` (allt annat verbatim):

```js
// efter GET: const p = res.product; const slug = p.slug, vinfo = p.variantsInfo||{}, variants = vinfo.variants||[], options = p.options||[];
const BRANDS = new Set(["succebuy","vevor","homcom","pawhut","outsunny","giantex","costway","tobbi","aosom"]); // full lista: lib/import/sku.ts
const slugify = s => (s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
const stripBrand = s => { const p = slugify(s).split("-").filter(Boolean); while (p.length>1 && BRANDS.has(p[0])) p.shift(); return p.join("-"); };
const cut = (s,max) => { if (s.length<=max) return s; let o=""; for (const w of s.split("-")){ if(!w) continue; if(!o){ o = w.length<=max?w:w.slice(0,max); if(w.length>max) break; } else if((o+"-"+w).length<=max){ o+="-"+w; } else break; } return o||s.slice(0,max); };
const prod = cut(stripBrand(slug), 24) || "produkt";
const used = new Set();
const newVariants = variants.map(v => {
  const val = (v.choices||[]).map(c => c.optionChoiceNames && c.optionChoiceNames.choiceName).filter(Boolean).join(" ");
  let base = (val ? `FP-${prod}-${cut(slugify(val),12)}` : `FP-${prod}`).slice(0,40).replace(/-+$/g,"");
  let sku = base; for (let n=2; used.has(sku); n++){ const suf=`-${n}`; sku = base.slice(0,40-suf.length).replace(/-+$/g,"")+suf; }
  used.add(sku); return { ...v, sku };
});
// PATCH body: { product: { id, revision, options, variantsInfo: { ...vinfo, variants: newVariants } } }
```

⚠️ Skicka `options` **+** `variantsInfo` verbatim — annars **428 `MISSING_OPTIONS_ON_UPDATE_VARIANTS`** (en produkt helt utan optioner behöver inte `options`).

> **Spara ett anrop:** lägg `visible: true` i **samma** PATCH → då görs Steg 2b + Steg 5 i ett.
>
> **Undantag:** börjar SKU:n med `FYND-XXX-NNN` (kurerat artikelnummer) eller `AE-<hash>` (äldre schema) — **rör den inte**, flagga till Leonard.

**Verifiera:** nya SKU:n innehåller varken engelska råord eller **dropship-märke** och matchar sluggen. (Etablerade märken som Pagani Design/LAIKOU **behålls** i SKU:n – se märkesregeln i *Fasta fakta*.)

-----

## Steg 3 – Skriv om ALLA bild-alt-texter (1 anrop, mutation)

Rå-import lämnar engelska alt-texter med "AliExpress" – byt alla till svenska, sökordsrika, varierade. Koppla ev. variantbilder till sina optionsvärden.

> **Titta på bilderna först (chatten kan se bilder).** Skriv inte alt-texter i blindo — hämta en liten preview av varje galleribild och läs den visuellt innan du formulerar texten:
>
> ```
> curl -s -o <scratchpad>/img-01.jpg "https://static.wixstatic.com/media/{FILE_ID}/v1/fit/w_320,h_320,q_70/preview.jpg"
> ```
>
> (`{FILE_ID}` = `image.url`:ens filnamn, t.ex. `b379ce_…~mv2.jpg`; `Read` på den sparade filen visar bilden.) Alt-texten ska beskriva **det som faktiskt syns** — motiv, färg, vinkel, miljö/detalj — med fokussökordet naturligt invävt; inte samma generiska mall × N bilder.
>
> Flagga samtidigt till Leonard om du ser: inbränd engelsk/kinesisk text eller vattenstämpel, fel produkt/motiv, dubbletter, eller att **första bilden** (= `media.main`, produktkortets bild i butiken) inte är den renaste produktbilden. Vill Leonard byta huvudbild: ordna om `itemsInfo.items` (första item blir automatiskt `main`) — skicka **hela** arrayen i ny ordning i samma Steg 3-PATCH, ändra inget annat i items.

> **Fälla:** skicka tillbaka **hela** `itemsInfo.items`-arrayen och ändra **bara `altText`**. En ofullständig array kan **radera bilderna**. **Verifiera efteråt** att alla items har kvar `image.url`.
>
> ⚠️ **Skicka INTE `media.main`.** I V3 är `media.main` **readOnly** (sätts automatiskt till första item:et). Inkluderar du det svarar Wix `200 OK` men **ignorerar tyst hela `media`-objektet** — revisionen ökar inte och alt-texterna ändras inte (no-op som ser ut att lyckas). Patcha bara `media.itemsInfo.items`; `main` följer med automatiskt.

Procedur (utgå från `media.itemsInfo.items` från Steg 1):

```js
const itemsA = items.map((it, i) => ({ ...it, altText: newAlt[i], image: it.image ? { ...it.image, altText: newAlt[i] } : it.image }));
// hämta färsk revision, sedan (OBS: inget media.main – det är readOnly):
PATCH .../products/{PRODUCT_ID}
body = { product: { id:"{PRODUCT_ID}", revision:"{FÄRSK}", media: { itemsInfo: { items: itemsA } } } }
```

Verifiera direkt efter:

```
GET .../products/{PRODUCT_ID}?fields=MEDIA_ITEMS_INFO   // alla items ska ha image.url, count oförändrad
```

-----

## Steg 4 (rekommenderat) – koppla rätt kategori

Om produkten bara ligger i "All Products", koppla en riktig kategori (1 anrop, mutation):

```
POST https://www.wixapis.com/categories/v1/bulk/categories/add-item
```

```json
{ "item": { "catalogItemId": "{PRODUCT_ID}", "appId": "215238eb-22a5-4c36-9e7b-e7c08025e04e" },
  "categoryIds": ["{CATEGORY_ID}"],
  "treeReference": { "appNamespace": "@wix/stores" } }
```

Vanliga kategori-ID: **Bil & Cykel** `b02b889a-a80e-414e-ad12-00ba5722244b` · Elektronik & Tillbehör `9054fdce-2f3d-4ad4-9cd9-c00645cbabea` · Friluftsliv & Resa `34c37816-2384-49d1-bb47-8d1415daad41` · Verktyg & Hemmafix `43674676-4407-406d-889d-a5eee646d167` · **Hem & Inredning** `3ed832b7-213f-4bd8-bbc4-e95744a9b316` · Sport & Fritid `de100f8d-755f-433d-90b2-9b18edb41b9d`.

> **Hittar du ingen passande?** Hämta alla kategorier och matcha på `name` (read-only): `POST https://www.wixapis.com/categories/v1/categories/query` med body `{ "query": { "paging": { "limit": 100 } }, "treeReference": { "appNamespace": "@wix/stores" } }`. Det finns ~45 (bl.a. Hem & Inredning, Dekoration & Prydnad, Belysning, Hushållsapparater, Husdjur, Träning & Gym, Kök & Husgeråd). Möbler/utemöbler → **Hem & Inredning**.

-----

## Steg 5 – PUBLICERA produkten (1 anrop, mutation)

Rå-importer skapas som **draft** (`visible:false`) och syns inte i butiken. När Steg 2–4 är klara och **verifierade** (rena `<h2>`-flikar; alla bilder kvar med `image.url`; **SKU re-synkad i Steg 2b**) och variantkontrollen i **Steg 6** är gjord: publicera produkten (hämta färsk `revision` först). *(Du kan slå ihop detta med Steg 2b — `visible:true` i samma SKU-PATCH.)*

```
GET .../products/{PRODUCT_ID}        // färsk revision
PATCH https://www.wixapis.com/stores/v3/products/{PRODUCT_ID}
```

```json
{ "product": { "id": "{PRODUCT_ID}", "revision": "{FÄRSK_REVISION}", "visible": true } }
```

> Misslyckas någon verifiering: fixa först, publicera sedan. Hoppa över publiceringen bara om Leonard uttryckligen bett om draft. Frontend uppdateras via ISR (ingen redeploy).
>
> *Historik: #134 införde draft-only ("Leonard granskar och publicerar själv"). 2026-06-09 beslutade Leonard att publicera-efter-polering är standard igen — i linje med polish-knappens prompt (`app/admin/queue/polish-button.tsx`), som hela tiden instruerat publicering.*

-----

## Steg 6 – Varianter (kontrollera, fixa bara vid behov)

Importen sköter varianterna automatiskt och deterministiskt (inga AI-anrop) — oftast behöver du inte göra något:

- **Bildbyte per färg/modell är redan kopplat** (`linkedMedia`): huvudbilden byts när kunden väljer t.ex. "Blå". **Rör inte detta när det fungerar** (det gör det i de flesta fall — från skrapans swatch-bilder eller DS-API:ts per-SKU-bilder).
- **Variantnamn översätts till svenska** deterministiskt vid import ("Color"→"Färg", "Red"→"Röd", "100 inch"→"100 tum"). Tabellen täcker inte allt — ovanliga värden kan bli halv-engelska. Men se A): variant-**värden** går inte att döpa om i efterhand i V3.

**A) Variantvärden (t.ex. "100 inch", "Blå") — döp INTE om dem.** I V3 är `choices[].name` låst till `choices[].key`: att ändra bara `name` **fastnar inte**, och att röra `key` riskerar leverantörs-SKU-mappningen (`FP-…`) och fulfillment. Importen lokaliserar redan kända enheter/färger/storlekar vid import (inch→tum, Color→Färg, Red→Röd) → värdet är rätt från start. Ser ett värde ändå fel ut: **flagga till Leonard** så utökas importens översättningstabell — forcera inte ett key-byte. Det polerade produktnamnet/titeln/beskrivningen styr ändå vad kunden främst läser.

**B) Om ett färg-/modellval saknar bildbyte** (text-val utan att huvudbilden ändras) — koppla valet till rätt galleribild. Verifierat mot V3:

1. **GET** produkten med `fields=MEDIA_ITEMS_INFO`, hitta rätt bilds `media.itemsInfo.items[].id` — hämta previews och **titta** på bilderna (samma curl-metod som i Steg 3) så att rätt färg/modell kopplas; matcha inte enbart på `altText`. Läs färsk `revision`.
2. **PATCH**: sätt `linkedMedia: [{ "id": "<media-item-id>" }]` på rätt `choices[]`. Skicka **HELA** `options` + `variantsInfo` **verbatim** + färsk `revision`.
3. Wix ingest:ar bilder **asynkront** (~5 s) — verifiera via re-GET att `linkedMedia` sitter kvar; annars PATCHa om med ny `revision`.

```
GET .../products/{PRODUCT_ID}?fields=MEDIA_ITEMS_INFO        // media-item-id + färsk revision
PATCH https://www.wixapis.com/stores/v3/products/{PRODUCT_ID}
```

```json
{ "product": {
  "revision": "{FÄRSK_REVISION}",
  "options": [
    { "name": "Färg",
      "choicesSettings": { "choices": [
        { "name": "Blå", "linkedMedia": [ { "id": "{MEDIA_ITEM_ID}" } ] }
      ] } }
  ],
  "variantsInfo": "{VERBATIM_FRÅN_GET}"
} }
```

> Skicka `options` **komplett** (alla optioner och val, inte bara det du ändrar) och `variantsInfo` exakt som det kom från GET — annars svarar V3 428 `MISSING_VARIANT_OPTION_CHOICE`. Bilden måste redan ligga i produktens media-pool (den gör den efter import).

-----

## Klart-kriterium

- Fokussökordet finns i **titel, produktnamn (H1), slug, beskrivning och meta** → alla punkter i Wix SEO-assistenten blir gröna efter att panelen **laddats om**.
- Alla bilder har svenska alt-texter skrivna utifrån **visuellt granskade** previews (Steg 3) och **har kvar sina URL:er**.
- Flik-rubrikerna ligger som **rena `<h2>`** (`Tekniska specifikationer`, `Vanliga frågor`, ev. `Användning och skötsel`) — inte feta/`<span>`-lindade — så de renderas som **flikar** på PDP:n, inte inline.
- SKU:n matchar den **polerade sluggen** (`FP-<svensk-slug>-<variant>`) — inga engelska råord, inget **dropship-märke** (etablerade märken som Pagani Design/LAIKOU behålls); re-synkad i Steg 2b.
- Variantkontrollen i Steg 6 är gjord och produkten är **publicerad** (`visible:true`) — annars syns den inte i butiken.
- (Engångs-bekräftat: frontend renderar `<title>`/`<h1>`/meta från fälten och skickar egen `Product`-JSON-LD. Du behöver inte kontrollera detta per produkt.)

-----

## Utanför SEO (gör bara om uttryckligen ombedd)

- **Variant felmärkt som "Färg":** den delade optionen "Färg" (`0b32a475-…`, TEXT_CHOICES) hänger på ~100+ produkter – döp INTE om den. Skapa en egen unikt namngiven option och koppla om varianterna. Unikhet gäller `name`+`type`+`renderType`; choices kräver `choiceType:"CHOICE_TEXT"`; produktens option kräver `choicesSettings`. Se fullständig poleringsreferens.
- **Info-sektioner:** skapa inte en per produkt (taket är 400). Lägg innehåll i beskrivningen.
