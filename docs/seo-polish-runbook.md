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

Välj det svenska sökord folk faktiskt söker på, sammansatt av **huvudord + kvalificerare**, t.ex. `starthjälp bil`. **Lås inte valet förrän du sett bilderna (Steg 1b)** — bilderna avgör ofta vad produkten *faktiskt* är.
**Ringa in den exakta produkttypen, inte den breda kategorin.** Använd ordet för vad produkten *faktiskt är* (formen/typen), inte en generisk grupp – t.ex. `sadelstol` (inte "arbetsstol"), `hopfällbar massagebänk` (inte "möbel"). Det specifika ordet har oftast högre köpintention och mindre konkurrens, och matchar vad köparen söker.
**Validera ordet mot verklig sökdata innan du låser det.** Gör en snabb `web_search` på 2–4 svenska kandidatord och se vilket **etablerade svenska återförsäljare använder som kategori-/produktnamn** (Biltema, Jula, Clas Ohlson, Mekonomen, Thule, Amazon.se, branschspecialister) samt Googles autocomplete/relaterade sökningar. Kategoriordet de stora aktörerna använder i sina titlar har oftast högst sökvolym → välj det som huvudord (`isMain`), lägg de näst bästa som relaterade sökord. Exempel: `taklastkorg` är en giltig sammansättning, men återförsäljarna kategoriserar produkten som **takkorg / lastkorg** → huvudord blir `takkorg bil`, med `lastkorg`/`taklastkorg` som relaterade.
**Regel:** båda orden MÅSTE hamna i **titel, produktnamn (H1) och slug** – annars flaggar Wix SEO-assistenten dem som röda. Ordet finns redan grönt i beskrivning/meta om det står i texten.
Specs får bara komma från känd importdata eller `web_search` (AliExpress-sidor är JS-blockerade). **Hitta inte på siffror.**

-----

## Steg 1 – Läs produkten (1 anrop, read-only)

```
GET https://www.wixapis.com/stores/v3/products/{PRODUCT_ID}?fields=DESCRIPTION&fields=PLAIN_DESCRIPTION&fields=URL&fields=MEDIA_ITEMS_INFO
```

Spara: `revision`, nuvarande `name`, `slug`, `seoData`, **`visible`**, samt **hela `media`** (du behöver `media.main` + alla `media.itemsInfo.items` med deras `id`, `uploadId`, `image` till Steg 3).

-----

## Steg 1b – Titta på ALLA bilder FÖRST (innan du skriver något)

Chatten kan se bilder — **analysera galleriet innan du väljer sökord eller skriver copy**. Hämta en liten preview av varje galleribild och läs den visuellt:

```
curl -s -o <scratchpad>/img-01.jpg "https://static.wixstatic.com/media/{FILE_ID}/v1/fit/w_320,h_320,q_70/preview.jpg"
```

(`{FILE_ID}` = `image.url`:ens filnamn, t.ex. `b379ce_…~mv2.jpg`; `Read` på den sparade filen visar bilden.)

Den visuella förståelsen styr **allt nedströms** — det är därför steget ligger först:

- **Fokussökordet (Steg 0):** bilderna avslöjar produktens exakta form/typ (t.ex. `sadelstol`, inte "arbetsstol").
- **Beskrivningen (Steg 2):** skriv utifrån det som faktiskt syns — material, detaljer, användningsmiljö — i stället för att gissa från rå-titeln.
- **Alt-texterna (Steg 3):** formuleras per bild utifrån denna granskning.
- **Huvudbilden:** notera om första bilden (= `media.main`, produktkortet) inte är den renaste produktbilden — byt ordning i Steg 3.
- **Tvätt-behov (Steg 3b):** notera dropship-loggor, vattenstämplar, inbränd text (engelska/spanska/kinesiska), fel motiv och dubbletter.
- **Bakgrundsbyte (Steg 3c):** notera vilka bilder som är rena produktbilder på ful/mörk/rörig bakgrund (→ vit hjältebild) vs nyttiga kontextbilder (behålls) vs infografik (bort/flagga).

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

> **Utgå från bildgranskningen i Steg 1b** (har du hoppat över den: gör den nu). Alt-texten ska beskriva **det som faktiskt syns** — motiv, färg, vinkel, miljö/detalj — med fokussökordet naturligt invävt; inte samma generiska mall × N bilder.
>
> Åtgärda samtidigt det du noterade i Steg 1b: fel produkt/motiv, dubbletter, eller att **första bilden** (= `media.main`, produktkortets bild i butiken) inte är den renaste produktbilden — byt huvudbild genom att ordna om `itemsInfo.items` (första item blir automatiskt `main`); skicka **hela** arrayen i ny ordning i samma Steg 3-PATCH, ändra inget annat i items.

> **Dubbletter (identiska bilder):** är två eller fler galleri-items **exakt samma motiv** (vanligt från skrapan/DS-API:t) — behåll **en**, ta bort resten ur `itemsInfo.items` (skicka hela arrayen utan dubbletterna). **Kontrollera `linkedMedia` FÖRST:** pekar ett variantval på en kopia du tar bort → koppla om valet till den kvarvarande bilden (Steg 6B), annars tappar valet sitt bildbyte tyst. **Radera INTE filen direkt** i Media Manager — borttagen ur galleriet blir den föräldralös och **frigörs automatiskt i de återkommande orphan-städsvepen** (minnet återtas helt, utan risk att radera en fil som `linkedMedia`:as eller används av en annan produkt). Vill du bekräfta exakt likhet: jämför fil-id:t i `image.url` (samma id = samma fil) eller previews sida vid sida med `Read`.

### Steg 3b – Tvätta bort loggor och inbränd text (vid behov)

Noterade du i Steg 1b **dropship-logga** (SucceBuy/VEVOR/HOMCOM …), **vattenstämpel** eller **inbränd marknadsföringstext** (engelska, spanska, kinesiska …) på en bild — åtgärda det i samma polering i stället för att bara flagga:

1. Hämta **originalupplösningen** (utan transform): `curl -o orig.jpg "https://static.wixstatic.com/media/{FILE_ID}"`.
2. **Slät/enfärgad bakgrund** (typisk studiobild): täck text-/loggregionen med bakgrundsfärgen (PIL eller ImageMagick; `tesseract` ger bbox:ar om regionen är svår att ringa in manuellt). **Rörig bakgrund** eller ren infografik-bild (mest text): tvätta inte — **ta bort bilden ur galleriet** i stället, eller flagga till Leonard om galleriet blir för tunt utan den. **Innan du tar bort en bild:** kontrollera om den är `linkedMedia` för ett variantval — koppla i så fall om valet till en annan lämplig galleribild (Steg 6B) eller flagga, annars tappar färg-/modellvalet sitt bildbyte tyst.
3. Ladda upp den tvättade filen med `mcp__Wix__UploadImageToWixSite` → ny `static.wixstatic.com`-URL.
4. Ersätt item:et på **samma position** i `itemsInfo.items` med `{ "url": "<ny wixstatic-url>", "altText": "<svensk alt>" }` i Steg 3-PATCH:en — samma mönster som importen (`lib/wix/client.ts`). Wix ingest:ar från URL **asynkront** (~5 s); verifiera via re-GET att item:et fått `image.url`. Position 0 = `media.main` = produktkortet.
5. **Radera aldrig originalfilen** ur Media Manager (den blir föräldralös och tas i de återkommande städsvepen). Var den gamla bilden `linkedMedia` för ett variantval: koppla om valet till det **nya** media-item-id:t (Steg 6B), annars tappar färgvalet sitt bildbyte.

> **Rör inte loggor som sitter fysiskt PÅ produkten** — varken etablerade märken (t.ex. Pagani Design på urtavlan) eller dropship-märken som är tryckta/graverade på själva varan: kunden får produkten med loggan, och en bortretuscherad logga vore vilseledande. Tvätten gäller **overlay-grafik** (pålagd text/logga/vattenstämpel i bildfilen, inte på varan). Är en dropship-logga tryckt på varan: flagga till Leonard (produkten kanske ska bytas ut i sortimentet). Osäker på om något ska tvättas? Flagga med före/efter-preview i chatten.

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
GET .../products/{PRODUCT_ID}?fields=MEDIA_ITEMS_INFO   // alla items ska ha image.url; count oförändrad — utom bilder som MEDVETET togs bort/ersattes i Steg 3b/3c
```

-----

### Steg 3c – Ren vit hjältebild (premium-look, vid behov)

Leverantörsbilderna har ofta fula/mörka/röriga bakgrunder (ibland med hörn-logga). Det som får katalogen att se ut som ett **riktigt varumärke** är **enhetlighet** — inte att varje bild är vit. Regel: **hjältebilden (första item = `media.main` = produktkortet) ska vara en ren produktbild på vit studio-bakgrund med mjuk skugga.** Konsekvent inramning mellan produkter = proffsigt.

Klassa varje bild utifrån Steg 1b-granskningen:

- **Ren enskild produktbild på ful/mörk/rörig bakgrund** (ev. hörn-logga i bakgrunden) → **klipp ut produkten och lägg på vit + mjuk kontaktskugga**. En overlay-logga i bakgrunden försvinner automatiskt (den ligger utanför produktens silhuett).
- **Nyttig kontextbild** (detalj, i-bruk, skala, storleksjämförelse) → **behåll**, tvätta bara logga/inbränd text (Steg 3b). **Vitmåla inte** — kontexten säljer, och komplexa bilder är där urklippet riskerar klippa kablar/smådelar.
- **Text-tung infografik** → ta bort/flagga (som Steg 3b).

**Metod A – Wix Generate Image (REKOMMENDERAD – server-side AI, ingen uppladdning):**

Wix egen AI byter bakgrund **server-side** och sparar resultatet **direkt i Media Manager** (du får ett `fileId` – **ingen base64-uppladdning**). Fördelar: den klarar det u2net INTE klarar — **mörk-på-mörk + tunna slangar/kablar/lösa klämmor** renderas rent — och utdata blir **~1024 px** (skarpare än en 800 px-källa). Detta är standardvägen för vita hjältar.

```
POST https://www.wixapis.com/social-publisher/v1/generate-image
  body: { "userInput": "<prompt nedan>", "imageUrl": "<wixstatic-url på originalhjälten, UTAN transform>" }
  → { executionId }
GET  https://www.wixapis.com/social-publisher/v1/generated-image/{executionId}   // polla tills status=READY (async ~10–30 s)
  → { status:"READY", imageUrl, fileId }
```

Prompt-mall (låser produkten, byter bara bakgrund — fyll i produktspecifika delar):

> Replace ONLY the background with a clean pure white (#FFFFFF) studio background and add a soft realistic contact shadow beneath the product. Keep the product itself completely unchanged and identical: same shape, proportions, display, buttons, **&lt;slang/klämmor/lins/portar…&gt;**, text, logos and colors. Do not add, remove, redraw, or restyle any part of the product. Professional e-commerce product photo, product centered, high resolution.

Sätt sedan `fileId` som hjälte-item (position 0) i `media.itemsInfo.items` (samma PATCH-mönster som nedan) — ingen uppladdning behövs.

> **Guardrail (obligatoriskt – generativ AI):** ladda ner resultatet, `Read` det och **jämför sida-vid-sida mot originalet**. Verifiera att INGEN produktdetalj ändrats (knappar, text, form, färg, antal delar, loggor). Ser något omritat/tillagt/borttaget ut → generera om med skarpare prompt, annars behåll originalet. **Faktatrohet går alltid före vit bakgrund.** *(Verifierat troget på Baseus kompressor `1dbdec91`, startbooster `86408870`/`63b38487`, bilkamera `e3c3df4c` — inkl. slang/klämmor som u2net ghostade/tappade.)*

**Metod B – rembg-urklipp + uppladdning (fallback – bara om Metod A inte är tillgänglig):**

Två begränsningar mot Metod A: (1) base64-upp via `UploadImageToWixSite` klarar i praktiken bara **~800 px / ~18 kB** innan strängen blir för stor att överföras rent; (2) **mörk-på-mörk med tunna utskott** (slang, flätad kabel, lösa klämmor) ghostas/tappas av u2net. Har du något av dessa → använd Metod A.

```bash
# u2net-modellen (rembg) hämtas EN gång och cachas i ~/.u2net/u2net.onnx.
# GitHub-releasen är egress-blockad (403) → hämta från Hugging Face-spegeln:
mkdir -p ~/.u2net
curl -sL "https://huggingface.co/tomjackson2023/rembg/resolve/main/u2net.onnx" -o ~/.u2net/u2net.onnx
pip install -q rembg onnxruntime pillow
```

```python
from rembg import remove
from PIL import Image, ImageFilter
src = Image.open("orig.jpg").convert("RGB")     # originalupplösning, utan transform
cut = remove(src)                                # RGBA – produkten urklippt
prod = cut.crop(cut.getbbox())
side = int(max(prod.size) / 0.82)                # produkten ~82 % av en 1:1-ruta
canvas = Image.new("RGB", (side, side), (255, 255, 255))
ox, oy = (side - prod.width) // 2, (side - prod.height) // 2
# mjuk, dämpad kontaktskugga (djup + studiokänsla; INTE platt utklipp):
sh = Image.new("RGBA", (side, side), (0, 0, 0, 0)); m = prod.split()[3]
tmp = Image.new("RGBA", prod.size, (0, 0, 0, 0)); tmp.putalpha(m)
sh.paste(tmp, (ox, oy + int(prod.height * 0.03)), tmp)
sh = sh.filter(ImageFilter.GaussianBlur(18))
r, g, b, a = sh.split(); a = a.point(lambda v: int(v * 0.28)); sh = Image.merge("RGBA", (r, g, b, a))
canvas.paste(sh, (0, 0), sh); canvas.paste(prod, (ox, oy), prod)
canvas.convert("RGB").save("white.jpg", quality=92)
```

Ladda upp `white.jpg` via `mcp__Wix__UploadImageToWixSite` → ersätt item:et på **samma position** i `itemsInfo.items` med `{ "url": "<ny wixstatic-url>", "altText": "<svensk alt>" }` (samma mönster som Steg 3b). Position 0 = `media.main` = produktkortet. Skicka **hela** arrayen, patcha **inte** `media.main` (readOnly — se fällan i Steg 3b).

> **Guardrail (obligatoriskt):** öppna resultatet med `Read` och **titta** innan du ersätter. Tunna kablar/lösa smådelar kan klippas fel (halo eller avklippt del). Ser det fel ut → **behåll originalet** och flagga (före/efter-preview i chatten). **Radera aldrig originalfilen** (städas i orphan-svepen). Var bilden `linkedMedia` för ett variantval: koppla om valet till det **nya** media-item-id:t (Steg 6B).

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

1. **GET** produkten med `fields=MEDIA_ITEMS_INFO`, hitta rätt bilds `media.itemsInfo.items[].id` — hämta previews och **titta** på bilderna (samma curl-metod som i Steg 1b) så att rätt färg/modell kopplas; matcha inte enbart på `altText`. Läs färsk `revision`.
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

**C) Ta bort bilder för modeller/varianter som inte finns eller är slutsålda.** Rå-importer buntar ibland flera modeller/storlekar under EN listning och släpar med leverantörens **spec-ark för varianter som inte säljs**. Regel: när du SEO-polerar och en variant/modell **inte finns eller är slut hos leverantören**, ta bort **både** valet (om det finns som option) **och dess bilder** — spec-ark, variantfoton och ev. `linkedMedia` — och skriv SEO/specar efter bara det som är kvar.

**Facit för vad som faktiskt lagerförs = `supplierVariantId` i mappningen — INTE marknadsbilderna** (de delas ofta mellan alla varianter i annonsen och ljuger om storlek/modell). Slå upp mappningen (read-only):

```
GET https://www.wixapis.com/data/v2/items/{PRODUCT_ID}?dataCollectionId=FyndplatsMappings
```

Läs `data.variants[].supplierVariantId` (t.ex. `14:29#3.2 m;…` → varianten som skeppas är **3,2 m**). Behåll bara den variantens spec-ark + de hjälte-/livsstilsbilder som stämmer; ta bort spec-arken för övriga modeller. **Kolla även inbrända siffror** på behållna livsstils-/förpackningsbilder — motsäger de kvarvarande varianten (t.ex. bärväske-mått/vikt för fel storlek) → ta bort dem också, annars krockar bilden med beskrivningen.

> **Lärdom (tält `2d83ad12`):** listningen buntade **6 tältmodeller** som spec-bilder men bara **3,2 m**-varianten (`14:29#3.2 m`) var mappad/lagerförd. En delad bärväske-marknadsbild matchade 4,0 m och lurade första bedömningen — `supplierVariantId` var facit. Kolla ALLTID mappningen på multi-modell-listningar **innan** du väljer bilder och låser specar.

-----

## Klart-kriterium

- Fokussökordet finns i **titel, produktnamn (H1), slug, beskrivning och meta** → alla punkter i Wix SEO-assistenten blir gröna efter att panelen **laddats om**.
- Alla bilder har svenska alt-texter skrivna utifrån **visuellt granskade** previews (Steg 1b) och **har kvar sina URL:er**.
- Inga bilder med dropship-logga, vattenstämpel eller inbränd säljtext kvar i galleriet (Steg 3b) — tvättade, borttagna eller flaggade.
- **Inga exakta dubblettbilder** kvar i galleriet — behåll en, ta bort resten (`linkedMedia` omkopplat först); de borttagna frigörs i orphan-svepen.
- **Hjältebilden** (produktkortet) är en **ren produktbild på vit studio-bakgrund med mjuk skugga** när originalet hade ful/mörk/rörig bakgrund (Steg 3c) — visuellt granskad via `Read`, original behållet vid felklipp. Nyttiga kontextbilder behålls (bara tvättade), infografik borttagen/flaggad. *(Vit hjälte skapas via Steg 3c Metod A – Wix Generate Image – även för mörk-på-mörk med slang/kablar; resultatet jämförs mot originalet för faktatrohet.)*
- På **multi-modell-listningar**: bara den **lagerförda variantens** bilder/spec-ark finns kvar — övriga modellers spec-ark borttagna, matchat mot mappningens `supplierVariantId` (Steg 6C), och inga inbrända siffror på kvarvarande bilder motsäger varianten.
- Flik-rubrikerna ligger som **rena `<h2>`** (`Tekniska specifikationer`, `Vanliga frågor`, ev. `Användning och skötsel`) — inte feta/`<span>`-lindade — så de renderas som **flikar** på PDP:n, inte inline.
- SKU:n matchar den **polerade sluggen** (`FP-<svensk-slug>-<variant>`) — inga engelska råord, inget **dropship-märke** (etablerade märken som Pagani Design/LAIKOU behålls); re-synkad i Steg 2b.
- Variantkontrollen i Steg 6 är gjord och produkten är **publicerad** (`visible:true`) — annars syns den inte i butiken.
- (Engångs-bekräftat: frontend renderar `<title>`/`<h1>`/meta från fälten och skickar egen `Product`-JSON-LD. Du behöver inte kontrollera detta per produkt.)

-----

## Utanför SEO (gör bara om uttryckligen ombedd)

- **Variant felmärkt som "Färg":** den delade optionen "Färg" (`0b32a475-…`, TEXT_CHOICES) hänger på ~100+ produkter – döp INTE om den. Skapa en egen unikt namngiven option och koppla om varianterna. Unikhet gäller `name`+`type`+`renderType`; choices kräver `choiceType:"CHOICE_TEXT"`; produktens option kräver `choicesSettings`. Se fullständig poleringsreferens.
- **Info-sektioner:** skapa inte en per produkt (taket är 400). Lägg innehåll i beskrivningen.
