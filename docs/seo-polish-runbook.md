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
- 🔒 **Bildpolering rör bakgrunden, aldrig varan** (Leonards regel 2026-08-06). Vi tvättar bort det som är **pålagt i bildfilen** — overlay-text, banderoller, vattenstämplar, callouts, rörig bakgrund. Varan själv ska synas exakt som kunden får den: form, färg, ytfinish, alla delar, och **loggor som sitter fysiskt på produkten** (tryckta/graverade/gjutna — både Pagani Design på urtavlan och VEVOR på en paviljongduk).
  - **Ett husmärke på varan är inget problem och ska inte flaggas** (Leonards beslut 2026-08-06): *"om märket sitter fysiskt på varan så gör vi inget åt det, det är så produkten ser ut."* Märket strippas ur texten enligt märkesregeln ovan, men på godset får det sitta kvar. Ingen retusch, ingen flagga, ingen sortimentsåtgärd — gå vidare.
  - **Avgörande-test:** skulle det synas om du fotade varan själv efter uppackning? → rör den inte. Syns det bara för att någon lagt på det i efterhand? → tvätta bort. Osäker → utgå från att det sitter på varan och flagga.
  - ⚠️ **Regeln bryts nästan alltid av misstag, inte med flit.** Ingen retuscherar bort en logga med vilje — men **för snäv beskärning kapar produktens kanter** (barncykelns hjul, 2026-07-09), **`rembg` äter tunna delar** (kablar, smala ben, genomskinliga partier), och en bandbeskärning som ska ta bort text kan skära in i varan. Resultatet är detsamma: kunden ser en annan produkt än den som kommer. Granska därför ALLTID med `Read` — helhet **och** inzoomat på varje kant — innan bilden går upp. Detta är det verkliga skälet till granskningskravet i Steg 3b/3c/3d.
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

## Arbetsordning (röd tråd)

Kör i denna ordning. **Publicering är ALLTID sista handlingen** — allt annat verifierat först.

1. **Steg 0** – Välj fokussökord (preliminärt; låses i Steg 2 efter bildkollen).
2. **Steg 1** – Läs produkten (GET: `revision`, `name`, `slug`, `seoData`, `visible`, `media`).
3. **Steg 1b** – Titta på ALLA bilder — styr sökord, copy, alt-texter och tvätt-/kort-behov.
4. **Steg 1c** – Sanera varianter FÖRST: ta bort döda/slutsålda (mappningen = facit) **innan** du skriver copy.
5. **Steg 2** – PATCH namn + slug + `seoData` (+ beskrivning); lås fokussökordet.
6. **Steg 2b** – Re-synka SKU till den nya sluggen.
7. **Steg 3** – Skriv om alla alt-texter (svenska); fixa dubbletter + huvudbild. Vid behov: **3b** tvätta loggor/inbränd text · **3c** vit hjältebild · **3d** egna svenska feature-/spec-kort.
8. **Steg 4** – Koppla rätt kategori.
9. **Steg 6** – Variantkontroll: koppla variantbilder (`linkedMedia`, 6B) + slutkoll. *(Borttagningen gjordes redan i 1c.)* Görs **före** publiceringen.
10. **Steg 5** – PUBLICERA (`visible:true`) — **sista steget**, när allt är verifierat mot Klart-kriteriet.

*(Sifferordningen är historisk: Steg 6 utförs före Steg 5. Enkla produkter utan bild-/kategori-/variantarbete kan slå ihop Steg 2b + publicering — se Steg 2b.)*

-----

> 🗂️ **Poleringskön ljuger — verifiera mot Wix innan du väljer produkt.** `needsAiPolish` nollställs inte alltid när en produkt polerats, så kön blandar riktigt råa utkast med sedan länge färdiga produkter. 2026-08-11 låg 49 poster i kön varav bara **13 var verkligt opolerade**; resten var publicerade produkter med kvarglömd flagga. Filtrera därför på `visible === false` **och** att namnet saknar å/ä/ö innan du tar "nästa". Nollställ flaggan (`needsAiPolish:false`, `draftStatus:"published"`) som sista steg efter publicering, annars kommer produkten tillbaka i kön.
>
> ⚠️ **Läs om produkten precis innan du börjar — någon annan kan ha hunnit före.** Arbetsstolen `7e730857` stod som rå engelsk draft i kölistan och var fullt polerad och publicerad fyrtio minuter senare, utan att den här sessionen rört den. Hämta alltid `name` + `visible` på nytt i Steg 1 i stället för att lita på listan du hämtade tidigare.

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

-----

## Steg 1c – Sanera varianter FÖRST (innan du skriver copy)

Avgör vilka varianter som faktiskt ska säljas **innan** Steg 2 — annars skriver du beskrivning, bygger spec-kort och alt-texter för en variant som ändå ska bort (dyrt dubbeljobb). **Facit = mappningen, inte marknadsbilderna.**

1. **Läs facit ur mappningen** (read-only) — det som verkligen lagerförs är `supplierVariantId`:
   ```
   GET https://www.wixapis.com/data/v2/items/{PRODUCT_ID}?dataCollectionId=FyndplatsMappings
   ```
   Jämför varje `data.variants[].supplierVariantId` (finns den = riktig, mappad variant) med Wix-produktens `variantsInfo.variants[].inventoryStatus.inStock`.

2. **Ta bort döda varianter NU:** en variant som är **phantom** (ingen `supplierVariantId`) ELLER **slut** (`inStock:false`) ska bort — valet, variantraden och (i Steg 3) dess bilder. Full PATCH-mekanik + "delade-marknadsbilder-ljuger"-fällan står i **Steg 6C**.

3. **Blir bara EN variant kvar → kollapsa till enkel-variant-produkt** direkt (inte en option med ett enda val): `options:[]` + `variantsInfo.variants:[{ id:<kvar>, choices:[], sku, price, inventoryStatus }]`.

Nu — och först nu — skriver Steg 2 (copy), Steg 2b (SKU) och Steg 3/3d (bilder/spec-kort) **bara** för det som är kvar. Ingen omskrivning, inga spec-kort som slängs.

-----

## Steg 2 – PATCH namn + slug + seoData (1 anrop, mutation)

Bygg innehållet:

- **name (H1):** svenskt, sökordsrikt, börjar med fokussökordet (huvud + kvalificerare). **≤ 80 tecken** (hård Wix-gräns — längre ger 400-fel).
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

> **Spara ett anrop — men BARA om inget mer återstår:** har produkten inga bilder att fixa (Steg 3/3b/3c/3d), ingen kategori (Steg 4) och ingen variantkoppling (Steg 6) kvar → lägg `visible: true` i **samma** PATCH så görs 2b + publicering i ett. Återstår något av dessa: **publicera SIST** (Steg 5), aldrig här — annars går produkten live innan bilder/kategori/varianter är klara.
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

**Bild-arbete — vilken metod?** Åtgärda det du flaggade i Steg 1b. Välj per bild:

| Bilden är… | Gör |
|---|---|
| Foto med inbränd text/logga/vattenstämpel | **Tvätta** (Steg 3b) |
| Hjältebild — ren produkt på ful/mörk/rörig bakgrund | **Vit studio-hjälte** (Steg 3c) |
| Mörkt AliExpress feature-collage / engelskt spec-blad (inte enskilt produktfoto) | **Bygg eget svenskt kort** (Steg 3d) |
| **Rent** text-/mätdiagram UTAN användbart produktfoto (mått, pilar, storleksjämförelse) | **Ta bort** (info → "Tekniska specifikationer"). MEN finns ett användbart foto i bilden → bygg foto-kort (3d) i stället, släng inte. |

> **Behåll så många ANVÄNDBARA bilder som möjligt — ju fler bra bilder desto bättre (Leonard 2026-07-10).** En rik produktsida säljer mer än en med 2–3 bilder. Släng BARA exakta dubbletter och bilder utan något användbart visuellt (140px-thumbnails, rena text-/mätdiagram). Leverantörens engelska/tyska feature-collage, i-bruk-foton och spec-blad **byggs om till svenska foto-kort** (Steg 3d) — kastas inte. Då behåller katalogen bilderna, men snyggt och på svenska. Exempel (2026-07-10): låset 10 råbilder → 6 (2 produktvinklar + i-bruk + 3 foto-kort, bara 3 dubbletter + en 140px-thumb slängd); slangen 11 → 6; stegen 18 → 7.
>
> **Aldrig ett rent text-kort. VARJE kort måste ha ett riktigt foto** (produkt, detalj eller i-bruk) med texten som bildtext — inte en textruta man inte kan titta på (Leonard 2026-07-10). Bygg foto-kort med `card_banner` (foto överst + kort rubrik + en rad), inte enbart ett `card_spec`-textrutnät. Spec/feature-text är OK men alltid **ovanpå eller under en bild**. *(Låset fick först fyra rena text-`card_spec`-kort — underkänt; byggdes om till foto-kort med handklovslås, kombinationshjul, väska och i-bruk-scen.)*
>
> **Fotot på kortet ska vara STORT — fyll kortet, inte en liten chip (Leonard 2026-07-10).** Kapa INTE bannern med ett litet `banner_maxh` (då blir bilden en tunn remsa med stor död yta nedtill). Låt bannern fylla höjden (`flex:1`, dvs. lämna `banner_maxh` tomt) och använd `card_banner(..., fit="contain")` så HELA produkten visas stor och obeskuren. *(Spec-korten för verktygssats/baklyktor/insynsskydd hade först produkten onödigt liten i ett litet chip med tom yta under — byggdes om med full banner + `contain`.)*

Två regler gäller ALLA metoder: **radera aldrig originalfilen** ur Media Manager (borttagen ur galleriet blir den föräldralös och städas i orphan-svepen), och är en bild `linkedMedia` för ett variantval — **koppla om valet först** (Steg 6B), annars tappar valet sitt bildbyte tyst.

> ⚠️ **KAPA ALDRIG BORT DELAR AV PRODUKTEN. Två fällor som passerade auditen (Leonard fångade båda, 2026-07-10) — härdregler nedan.** Den programmatiska `audit()` fångar BARA kant-kapning + slutna hål; den missar käll-crop-kapning (stegen) och hörn-bett (slang-spolen, ett runt motiv). **Facit är därför ALLTID en visuell `faith_sheet(original, polerad)` som du `Read`-ar före uppladdning** — inte att `audit()` säger OK.
>
> 1. **Vitmåla ALDRIG en rektangel över produkt-silhuetten.** Inbränd text/logga som ligger OVANPÅ produkten tas bort med **inpainting** (`cv2.inpaint(bild, textmask, 6, INPAINT_TELEA)` — fyller med omgivande textur), aldrig med `arr[y0:y1,x0:x1]=255`. Ligger texten på **vit bakgrund bredvid** produkten: ta bort bara text-pixlarna (färg-/röd-tröskel + `cv2.inpaint`), och verifiera att masken inte tangerar produkten. *(Slang-spolen fick ett vitt hack när "50M"-blocket vitmålades in i spolens övre vänstra båge — inpainting av bara textpixlarna löste det utan att röra spolen.)*
> 2. **Beskär en produkt ur en fler-objekt-bild BARA i det vita gapet mellan objekten — med marginal, aldrig en gissad snäv gräns.** Många leverantörsbilder lägger **öppen + ihopfälld** (stege), **flera vinklar** eller **produkt + tillbehör utlagda** i SAMMA bild. Hitta objektets **fulla utbredning** först (kolumn-/rad-densitet: `nz.mean(axis=0)` → leta lågtäthets-*dalen* som skiljer objekten), lägg snittet i dalen + marginal. *(Stegen beskars vid x≈840 fast den öppna stegen nådde x≈1050 → främre benet + halva stegplanen kapades. Rätt snitt låg vid dalen x≈1110, precis före den ihopfällda.)*
> 3. **Obligatorisk faithfulness-grind före uppladdning:** bygg `faith_sheet(original_källcrop, polerad)` och `Read` den. Bekräfta att den polerade silhuetten innehåller **HELA** produkten — inga raka snitt-kanter, inga vita hack/bett, inga borttagna delar/tillbehör. Godkänn först då. Detta är samma grind som redan gäller AI-genererade vita hjältar (Steg 3c) — den gäller **även** manuella crops, vitmålning och kort-urklipp.

### Steg 3b – Tvätta bort loggor och inbränd text (vid behov)

Noterade du i Steg 1b **dropship-logga** (SucceBuy/VEVOR/HOMCOM …), **vattenstämpel** eller **inbränd marknadsföringstext** (engelska, spanska, kinesiska …) på en bild — åtgärda det i samma polering i stället för att bara flagga:

1. Hämta **originalupplösningen** (utan transform): `curl -o orig.jpg "https://static.wixstatic.com/media/{FILE_ID}"` och `Read` den.
2. Klassa bilden:
   - **Ren produktbild ELLER nyttig kontextbild** (detalj, i-bruk, skala — bakgrunden må vara slät ELLER rörig/komplex, med personer/miljö) → **tvätta med Metod A** nedan. Skillnaden mot tidigare: detta är **inte längre begränsat till släta studiobakgrunder** — AI:n klarar numera att ta bort text/loggor/banderoller från komplexa foton (person som använder produkten, regn, trä-/stenbakgrund) och lämna resten helt orört.
   - **Ren infografik/spec-diagram** (mätdiagram, storleksjämförelse, mest text och pilar — inget egentligt produktfoto) → **ta bort bilden ur galleriet** i stället för att tvätta; informationen hör hemma som text under "Tekniska specifikationer", inte som bild.
   - **Innan du tar bort en bild:** kontrollera om den är `linkedMedia` för ett variantval — koppla i så fall om valet till en annan lämplig galleribild (Steg 6B) eller flagga, annars tappar färg-/modellvalet sitt bildbyte tyst.

**Metod A – Wix Generate Image (REKOMMENDERAD, samma mekanism som Steg 3c):**

Samma `POST .../generate-image` → polla `GET .../generated-image/{executionId}` som i Steg 3c, men med en **tvätt-prompt** som uttryckligen **bevarar** bakgrunden i stället för att byta till vit:

> Remove ALL burned-in text, captions, labels, callouts, banners, badges, and graphic overlays from this photo. Keep the photographed product (**&lt;beskriv produkten kort&gt;**), its real background, lighting, shadows, and any people or hands shown, completely unchanged and identical — do not add, remove, redraw, recolor, or restyle any physical part. The final image must be the plain, clean original photograph with zero text or graphic overlays anywhere. Do NOT change the background to white — preserve the original background exactly as photographed. High resolution, professional product photography.

Samma **guardrail som Steg 3c gäller alltid**: `Read` resultatet sida-vid-sida mot originalet innan det används — faktatrohet går alltid före ren bild.

> **Beprövat (2026-07-08):** troget över 19 bilder — handhållna närbilder, person i rörelse, regn, trä-/stenbakgrund; text/banderoller borta, produkt + bakgrund identiska i alla sida-vid-sida-jämförelser.

> **Hastighetsgräns:** `generate-image`-endpointen kan bli hastighetsbegränsad efter många anrop i rad, och avkylningen kan ta **flera minuter** (upplevt: >10 min, inte bara en kort burst-gräns) — planera batchar om **3–6 anrop åt gången**. Misslyckas ett jobb (`status:"FAILED"`): försök om **en gång**; misslyckas det igen → **ta bort bilden** ur galleriet i stället för att fastna i en retry-loop mot en fortsatt begränsad endpoint. Den kan alltid läggas till igen senare.

**Metod B – manuell text-täckning (fallback – bara om Metod A/C är otillgängliga och bakgrunden är helt slät/enfärgad):**

Täck text-/loggregionen med bakgrundsfärgen (PIL eller ImageMagick; `tesseract` ger bbox:ar om regionen är svår att ringa in manuellt). Fungerar bara för släta studiobakgrunder — för komplexa/röriga bakgrunder utan Metod A/C tillgänglig, ta bort bilden i stället för att riskera ett klumpigt manuellt utklipp.

**Metod C – Lokal LaMa-inpainting (proffskvalitet, ingen hastighetsgräns, gratis — när Metod A är blockerad):**

Metod A:s hastighetsgräns kan kvarstå **långt över en timme** (sett denna session), utan synlig kvot i Premium Features API (inte en "slut för månaden"-spärr, se Steg 3c-notiser). Kör då exakt samma sorts textborttagning **lokalt** i sandboxen — samma AI-kvalitet på röriga bakgrunder, men helt utanför Wix rate-limit:

```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install "setuptools<80" wheel && pip install --no-build-isolation fire   # fire kräver äldre setuptools för att bygga
pip install easyocr opencv-python-headless simple-lama-inpainting scikit-image
# LaMa-modellen: Sanster/models på GitHub är ofta egress-blockad i sandboxen -> HF-spegel i stället:
curl -sSL -o big-lama.pt "https://huggingface.co/JosephCatrambone/big-lama-torchscript/resolve/main/lama.pt"
```

Kör modellen **direkt via torch** (hoppa över `simple-lama-inpainting`-paketets wrapper — bygget av dess `fire`-beroende failar ofta ändå): ladda `torch.jit.load("big-lama.pt")`, maska text-regionerna som pixel-rektanglar (identifierade genom att `Read`-granska bilden, inte blint OCR), och kör `model(bild_tensor, mask_tensor)`.

> **Kritisk regel — kompositera ALLTID tillbaka originalet utanför masken:** nätverket garanterar **inte** pixel-identiskt resultat utanför den maskade regionen (kan hallucinera en enstaka färgartefakt nära en svår kant, t.ex. en sadel-urskärning). Sista steget MÅSTE vara `output = where(mask > 0, nätverkets_utdata, originalbilden)` — annars kan ett oskyldigt-seende hörn få en osynlig defekt som bara syns vid inzoomning. Verifierat: en sådan artefakt uppstod och fångades/fixades 2026-07-08 innan leverans.
>
> **Maska aldrig över riktiga fotoobjekt** (person, kroppsdel, produktdetalj) även om text råkar överlappa dem i originalbilden — dela upp masken i flera mindre rektanglar och hellre lämna ett enstaka ord/textfragment kvar (flagga det) än att riskera att förvanska ett fotograferat objekt. Hände en gång denna session (en arm/axel i en collage-bild) — löst genom att bara maska textraden som INTE overlappade kroppsdelen.
>
> **Andra artefaktklassen — maskgräns för nära textens faktiska utsträckning:** till skillnad från kompositeringsbuggen ovan (fel UTANFÖR masken) kan nätverket lämna kvar svaga spöklika prick-/strimmefragment **INNE i** den maskade regionen, om maskens nederkant ligger för nära text-descendrar ("g"/"p"/"y") eller kommatecken som sticker ner under rubrikraden. Facit: zooma in exakt vid den tilltänkta maskgränsen i originalbilden FÖRE körning, och lämna minst ~20–30 px marginal mellan textens synliga utsträckning och maskgränsen (bredare dilate, t.ex. 5–6). Verifiera alltid resultatet genom att zooma in **precis vid maskens gräns** — inte bara helhetsintrycket, för dessa fragment syns knappt i full storlek. Hände på 2 av 5 bilder på CNC-fräs-produkten (2026-07-08), fixat genom att utöka masken nedåt och köra om.
>
> **Verifierat (2026-07-08):** 36 bilder tvättade över 8 produkter (7 WEST BIKING + CNC-fräs) efter att Metod A varit blockerad — samma visuella kvalitet som Metod A (sten/regn/gata/inomhus/mörk-gradient-bakgrunder rekonstruerade naturtroget).

**Få in resultatet i Wix utan att spränga kontexten:** en tvättad bild i full storlek (800×800+) blir 75 000+ tokens som base64 — för stort för `Read`+`UploadImageToWixSite`. Två vägar:
1. **Chatt-bifogning**: `SendUserFile` → Leonard bifogar tillbaka i chatten (`download_url` resolveras automatiskt av `UploadImageToWixSite`) — funkar, men chattgränssnittet tillåter bara ~5 filer/meddelande, så stora batchar kräver flera omgångar.
2. **Publik GitHub-branch (rekommenderad för batchar ≥10 bilder):** i en isolerad `git worktree` (rör ALDRIG huvudarbetsträdet), skapa en **orphan-branch namngiven `claude/...`** (repo-push-behörigheten godkänner bara det prefixet — taggar och andra grennamn nekas med 403), lägg in bilderna, committa, pusha. Verifiera först att repot är publikt (`curl` mot en känd fil på `raw.githubusercontent.com`). Anropa sedan `UploadImageToWixSite` med `image:[{download_url:"https://raw.githubusercontent.com/<ägare>/<repo>/<gren>/<fil>"}, …]` — **alla bilder i ett enda anrop**. Radera grenen efteråt; `git push origin --delete` kan nekas av samma behörighetsbegränsning — då är kvarlämnad gren ofarlig (inga hemligheter, bara bildfiler) men be Leonard städa manuellt via GitHub om han vill.
   > **Kostnadsrisk:** en ny gren-push kan trigga en automatisk Vercel-preview-byggning (sett hela denna session på varje `claude/`-gren). Fråga Leonard innan du kör — han avgör om den (troligen försumbara) risken är okej, kontra att vänta eller använda chatt-vägen i stället.

**Så här sätts resultatet in (alla tre metoderna):**

3. Metod A ger ett `fileId` direkt (ingen uppladdning behövs); Metod B/C laddas upp med `mcp__Wix__UploadImageToWixSite` (via chatt-bifogning eller GitHub-branch, se ovan) → ny `static.wixstatic.com`-URL/fileId.
4. Ersätt item:et på **samma position** i `itemsInfo.items` med det **fullständiga item-objektet** (inte bara `url`+`altText` — det är det verifierat fungerande formatet från denna sessions PATCH:ar): `{ "id": "<fileId>", "altText": "<svensk alt>", "mediaType": "IMAGE", "image": { "id": "<fileId>", "url": "https://static.wixstatic.com/media/<fileId>", "altText": "<svensk alt>" } }` i Steg 3-PATCH:en. Verifiera via re-GET att item:et fått `image.url`. Position 0 = `media.main` = produktkortet.
5. **Radera aldrig originalfilen** ur Media Manager (den blir föräldralös och tas i de återkommande städsvepen). Var den gamla bilden `linkedMedia` för ett variantval: koppla om valet till det **nya** media-item-id:t (Steg 6B), annars tappar färgvalet sitt bildbyte.

> 🔒 **Tvätten gäller bara overlay-grafik, aldrig varan** — se den fasta regeln högst upp (inkl. avgörande-testet och misstagsfallen: för snäv beskärning, `rembg` som äter tunna delar). Ett husmärke tryckt på varan lämnas orört **utan att flaggas** — så ser produkten ut. Osäker på om något är pålagt eller sitter på varan? Flagga med före/efter-preview i chatten.

> **Fälla:** skicka tillbaka **hela** `itemsInfo.items`-arrayen och ändra **bara `altText`**. En ofullständig array kan **radera bilderna**. **Verifiera efteråt** att alla items har kvar `image.url`.
>
> ⚠️ **Skicka INTE `media.main`.** I V3 är `media.main` **readOnly** (sätts automatiskt till första item:et). Inkluderar du det svarar Wix `200 OK` men **ignorerar tyst hela `media`-objektet** — revisionen ökar inte och alt-texterna ändras inte (no-op som ser ut att lyckas). Patcha bara `media.itemsInfo.items`; `main` följer med automatiskt.
>
> ⚠️ **PATCH-svaret innehåller INTE `media.itemsInfo`** (det fältet returneras bara när du
> begär `fields=MEDIA_ITEMS_INFO`, vilket PATCH inte tar). Räknar du items i PATCH-svaret får
> du `0` och tror att galleriet raderats. **Verifiera alltid med en separat re-GET** med
> `?fields=MEDIA_ITEMS_INFO`, inte på PATCH-svaret.

> **Katalogsvep — tomma alt-texter.** Rå-importer som aldrig polerats lämnar `altText: ""`
> på hela galleriet, vilket inte syns någonstans i admin. Kör svepet regelbundet:
> `POST /stores/v3/products/search` med `fields:["MEDIA_ITEMS_INFO"]`, paginera på
> `cursorPaging`, och lista produkter där `items.some(m => !m.altText)`. 2026-08-06 gav det
> **13 publicerade produkter / 82 bilder** helt utan alt-text.

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

## Steg 3b – Bild-polering till proffsnivå (rensa utländsk text + Fyndplats-kort)

Rå-importens sekundärbilder (pos 1+) är ofta leverantörs-infographics med engelsk/
kinesisk text, VEVOR-branding, måttpilar och insatscirklar. Målet: **varje bild ska
se ut som ett eget professionellt foto — retuschen får inte synas överhuvudtaget.**
Signalen "produkten är bildpolerad" = galleriet innehåller **Fyndplats spec-/feature-kort**
(gräddvit `(250,248,243)` + orange logga).

**Arbetsgång per produkt** (verktyg: `scratchpad/pro.py`, `cardlib.py`, LaMa via
`simple-lama-inpainting` — modellen `big-lama.pt` hämtas från HuggingFace
`JosephCatrambone/big-lama-torchscript` till `~/.cache/torch/hub/checkpoints/`
eftersom GitHub-releases är blockerade i sessionen):

1. **Ladda ner galleriet i full upplösning** och gör en kontaktkarta. Identifiera per
   bild: ren produktbild (behåll orörd) / foto med textoverlay (rensa) / ren
   leverantörs-spec (ersätt med svenskt kort) / **variant-/måttblad som visar en specifik
   variant (behåll & städa — se variant-regeln nedan, släng ALDRIG)** / äkta dubblett (släng en).
2. **Mät koordinater med rutnät** — rita 0.1-linjer på bilden och läs av exakta boxar.
   Gissa ALDRIG koordinater ur minnet; det är största felkällan.
3. **Välj teknik per zon** (i fallande prioritet):
   - **Komponentrekonstruktion** (vit-bakgrundscollage): behåll stora sammanhängande
     regioner (foton/produkt), släng små (text), bygg om på vit duk. Pixelperfekt,
     ingen retusch alls → använd alltid när bakgrunden är vit. Fungerar EJ när
     pilar/streck binder ihop text med produkten till en komponent.
   - **LaMa-inpainting** för text/loggor/piller över foton. Regler: **smala masker
     per element** (aldrig en stor box över flera element — ger dimma/plattor);
     maskmarginal ~10–15 px UTANFÖR elementets kant (annars förlänger LaMa
     elementets färg); färgpredikat (`m_orange`, `m_dark(t)`, ljus-mask) hellre än
     `m_all` när elementet ligger nära produkt; kompositera resultatet in i
     originalet (bara maskzonen ändras).
   - **Exakt bandbeskärning** när texten ligger i ett rent kant-band/kolumn utan
     produkt/person: skär EXAKT vid bandets kant, inget mer. Aldrig hårda inzoomningar
     som kapar människor eller produkt.
   - **Planpassning + kornighet** (`plane_fill`) för stora ytor på släta väggar/gradienter.
   - **Klonstämpel/HF-transplantat** för texturer (gräs/trä) — verifiera att källan är
     ren och på samma skärpedjup; spegla inte riktade texturer (chevron-artefakter).
4. **QC vid 100 % zoom på varje redigerad zon före publicering.** Leta: spökbokstäver
   (vita halos — öka dilation), färgtoner, dimfläckar, brutna kantlinjer, tile-skarvar.
   Iterera tills osynligt. **Går det inte att göra osynligt → bilden utgår.** Hellre
   färre perfekta bilder än en synlig retusch.
5. **Bygg Fyndplats-kort** med `cardlib.py`: `spec_card` (produktbild + 6 verifierade
   nyckelvärden) och `feature_card` (produktbild + 4 fördelar). **Alla siffror ska vara
   avlästa ur källbilder/beskrivning — aldrig gissade.** Vid flera varianter med olika
   mått: ett spec-kort per variant, länkat till respektive choice (Steg 6-reglerna).
6. **Ta bort dropship-branding även i bilder** (VEVOR-logga på väska/produktfoto →
   LaMa bort). Produktens egen förpackning i bild är OK.
7. **Uppladdning:** committa bilderna till branchen `claude/tmp-image-upload`
   (git worktree, force-push OK) → `UploadImageToWixSite` med raw-GitHub-URL →
   patcha `media.itemsInfo.items` (hela arrayen + svenska alt-texter, ALDRIG
   `media.main`) och omlänka ev. variant-choice-bilder (options + variantsInfo
   ordagrant tillsammans).

> ⚠️ **Variantbilder — varje variant som SER OLIKA UT ska ha sin EGEN bild (Leonard-krav, 2026-07-19, hårt).**
> Skiljer sig varianternas *utseende* (olika modell/design/form/storlek — t.ex. bänkar med olika
> ryggstöd, stege med 4 vs 5 steg, väska 16" vs 20", basketställning med olika backboard) → du får
> **ALDRIG** kollapsa dem till en gemensam bild eller ersätta de olika variant-/måttbladen med **ETT
> gemensamt kort byggt ur hero**. Kunden måste se exakt den variant hen väljer.
> - **Behåll (eller återställ) leverantörens differentierade variant-/måttblad — ett per variant.**
>   Original hämtas från `https://static.wixstatic.com/media/<mediaId>~mv2.jpg` **även efter** att de
>   tagits ur galleriet (filen lever kvar i Media Manager tills orphan-svepen).
> - Städa bara bort **VEVOR-loggan** (vit boxfyll `ImageDraw.rectangle` på vit bg, annars LaMa) och
>   ev. stor **engelsk marknads-/spec-panel** (beskär bort halva bilden). **Måtten (cm/tum/mm)
>   BEHÅLLS — de är inte fula och behövs för att skilja varianterna.**
> - Länka varje choice till sin egen bild: `linkedMedia:[hero, <variant-egen-bild>]` (Steg 6B).
> - **Undantag där gemensam bild ÄR rätt:** varianten ändrar inte utseendet — ren **färgvariant utan
>   separat källfoto** (t.ex. PCP svart/silver, bara en pump fotad) eller **kapacitets-/måttvariant på
>   fysiskt identisk produkt** (t.ex. slangvagn 76/91 m — samma vagn). Då räcker gemensam bild + värdet i texten.
> - **Verifiera efteråt:** GET `VARIANT_OPTION_CHOICE_NAMES` och kontrollera att varje choice har ett
>   **unikt** `linkedMedia`-id (utöver hero). Två olika-seende varianter som pekar på samma icke-hero-id
>   = fel. (Rättat i efterhand på bänk/stege/väska/basket 2026-07-19 — gör aldrig om det.)

**Beslutsträd vid problemzoner:** text över slät bakgrund → LaMa · text i kantpanel →
bandbeskärning · stort grafikelement mitt i strukturerad bakgrund (handtag, bordskant,
gräs) → försök LaMa/geometrisk omritning, max ~3 iterationer, annars utgår bilden ·
element som täcker både produkt och bakgrund → LaMa med produkt-skonande färgpredikat.

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

> ⛔ **Använd INTE Metod A på produkter vars etikett bär text du säljer på** (kosmetik, kosttillskott, kemi, allt med innehåll/volym/vikt tryckt på förpackningen). Modellen ritar om etiketten: på hudvårdssetet `e50235e7` blev finstilta ingredienslistor rent nonsens och **"100g/3.53oz" blev "100g/2.53oz"** — en felaktig viktuppgift i huvudbilden. Guardrailen fångade det och resultatet slängdes. För sådana produkter: geometrisk maskning enligt Metod B/D, aldrig generativ.

**Metod D – vit klisterkontur som maskeringsnyckel (när leverantören redan friställt åt dig):**

Många leverantörsbilder (särskilt kosmetik/småvaror) visar produkterna som "dekaler" med en **vit kontur** runt varje vara mot en färgad bakgrund. Konturen är en gratis, pixelperfekt mask — och till skillnad från både rembg och generativ AI rör den inte en enda produktpixel:

```python
vit    = (lum > 225) & (sat < 0.10)                 # konturen + vita partier
kontur = ndimage.binary_closing(vit, iterations=3)
m      = största komponenten av ndimage.binary_fill_holes(kontur)
```

Två fällor, båda sedda på hudvårdssetet `e50235e7`:
- **Instängd bakgrund.** Ligger två produkter kant i kant sluter deras konturer ihop en ficka av bakgrunden som `fill_holes` fyller. Hitta den som en liten **inre** komponent (`m & ~vit`) — produktinsidorna är 100 000+ px, fickorna några tusen — och radera allt under tröskeln, med några px utvidgning för antialias-fransen.
- **Testa mot `vit`, inte mot `kontur`.** Slutningen bryggar över smala springor och sväljer just de fransar du vill bli av med, så de aldrig dyker upp som egen inre komponent. Med `kontur` låg tre orange flisor kvar längs sömmen; med råa `vit` försvann de.

**Ingen slagskugga på den här sorten.** Produkterna bär redan leverantörens egen 3D-skuggning och ligger i en solfjäder utan underlag. Med skugga blir den vita konturen synlig som en dekal-kant; utan skugga försvinner den helt mot vitt. Konturen ska däremot **inte** eroderas bort — vit på vitt syns den ändå inte, och erosion äter produktens egna kanter.

> 🔍 **Läs etiketten i källbilden INNAN du väljer den som hjälte.** Leverantörsfiler kan vara trasiga. Hudvårdssetets bild 2 hade en förstörd tub: finstilta raderna utsmetade och `100g/` bortsuddat (`(/3.53oz.`). Maskningen var perfekt och felet följde ändå med hela vägen till butiken — Leonard såg det på tio sekunder. Zooma in varje etikett med `Read` **på källan**, inte bara på resultatet, och byt källa om texten inte går att läsa.

> 🔑 **Saknar galleriet en användbar källbild — hämta leverantörens original ur mappningen.** `FyndplatsMappings.imageAnalysis` sparar URL:erna till alla leverantörsbilder vid import. **AliExpress mediadomän (`ae-pic-a1.aliexpress-media.com`) svarar 200 härifrån även om produktsidan är blockerad (302, 0 byte)** — så originalen går att ladda ner när galleriet bara innehåller beskurna varianter. Växelriktaren `043bd5c8` hade ett enda produktfoto i galleriet, en extrem närbild av framsidans vänstra hörn; sex original låg kvar i mappningen och ett av dem visade hela enheten. Upplösningen är dock leverantörens: 800×800 var maxvärdet, alla storlekssuffix (`_960x960.jpg`, `_2200x2200.jpg` …) ger samma fil. Räkna därför fram hjältens sida ur varans NATIVA bredd i stället för att slentrianmässigt ta 1600 — här blev 1400 rätt (1,7× uppskalning + lätt oskarp mask).

> ℹ️ **Nyansering av "u2net klarar inte mörkt-på-mörkt":** det som fälls är **tunna utskott** mot mörk bakgrund (slang, flätad kabel, lösa klämmor). En solid mörk kropp mot mörk bakgrund går ofta utmärkt — växelriktaren, nästan svart mot mörkblått, gav en enda komponent med 100 % av alfan och alla ventilgaller och flänsar intakta. Testa innan du drar slutsatsen att Metod A behövs; här var Metod A dessutom förbjuden av etikettregeln ovan, eftersom effektangivelsen står tryckt på höljet.

**Metod E – per-produkt-rembg ur en flatlay (när enda hela källan är en full-bleed miljöbild):**

Kör **inte** rembg på hela flatlayen — modellen letar ETT dominant motiv och gav mos på fem varor (behöll rosa papper, tonade bort tre produkter). Kör den i stället på **en generös låda runt varje produkt** och komponera ihop dem efteråt. Behåll lådornas inbördes placering: det är leverantörens komposition, och varje varas vinkel och ljus hör ihop med den.

Två saker gör metoden ren:
- **Kastskuggan skiljs på ALPHA, inte på luminans.** rembg tar med skuggan på pappret men ger den låg alpha — varan låg på 246–254, skuggan på 113–216. Ett luminanströskel-försök åt i stället upp flaskans mörka bottenband och hade ätit den mörkgröna tuben helt (lum ≈ 123). Ta kärnan på `alpha > 225`, största komponenten, `fill_holes`.
- **Bygg om kanten, ärv den inte.** Originalets yttersta pixlar är halvt papper; behåller man dem mot vitt syns en rosa/grön brätte längs varje vara. Erodera en pixel in i varan och gör en egen mjuk kant (`gaussian_filter(0.8)`), så överlever ingen pappersfärgad pixel.

Kontrollera till sist att ingen produkts slutliga bbox rör sin lådkant — då är den beskuren och lådan måste växa.

**Metod F – bygg om ljuset (produkter som SJÄLVA lyser):** `scripts/hero/lyshero-vit.py`

Regeln "en tänd LED-produkt mot mörk botten går inte att flytta till vitt" står kvar — men den betyder inte att produkten saknar vit hjälte. Den betyder att man måste **bygga om ljuset i stället för att flytta det**.

Urklipp misslyckas här av två skäl samtidigt: glöden finns bara som ljus tillagt i mörker, och själva varan är vit. Hexagonlampan `f267a4e2` hade dessutom bara två hela källor — ett beskuret garagefoto och leverantörens 3D-render mot marinblå botten. Rakt urklipp av rendern mot vitt gav ett spöke: vita rör på vit botten syns inte alls.

Gör så här i stället:

1. **Mät hur varan faktiskt ser ut mot LJUST underlag** i något av leverantörens egna foton. Lägg ett tvärsnitt vinkelrätt genom röret och skriv ut luminansen. På hexagonlampan (a3, x=700/780/860) mättes: tak ~190 → ljusspill upp mot 235 → **mörk kåpkant ned till ~90–165** → mättad vit kärna 255 i ~15 px → spill faller av mot ~155.
2. **Den mörka kanten är hela bilden.** Ett lysande vitt rör syns mot ljus botten tack vare plastkåpans skuggade fläns — inte tack vare glöden. Första försöket satte kanten på 196–212 och lampan försvann; 132–154 gjorde den till ett fysiskt föremål.
3. **Botten får inte vara 255.** Ljus kan bara visas som något ljusare än sin omgivning. Lägg hörnen runt 218 och lyft mot 255 närmast varan (brett spill σ≈110 för rummet, tajt σ≈22 för halon). Kunden läser det som vitt, och det är fysiskt sammanhängande.
4. **Geometrin tas ur leverantörens render, pixel för pixel.** Största ljusa komponenten är lampan; måttpilar och text ligger som egna komponenter och faller bort av sig själva. Rendern är nedtonad mot sin mörka botten — lyft med `255 − (255 − rgb) · 0,5` så rören blir vita men silverdetaljen i kopplingsnoderna överlever.

> ⛔ **Metod A är förbjuden även här**, trots att lampan saknar tryckt text. Vi säljer på **antal** och **mått** — "fem hexagoner", "24 LED-rör", "244 × 170 cm" — och en generativ omritning räknar fel på precis den sortens saker, exakt som den skrev om finstilen på hudvårdstuben. Etikettregeln gäller allt som är räknebart eller mätbart i bilden, inte bara bokstäver.

**Metod G – vit hjälte ur en bokeh-bild (rembg + separat mask för mörka delar):** `scripts/hero/bokeh-hero.py`

Den snyggaste produktbilden ligger ofta INTE på vit botten. Julgranståget `91de8b52` hade sin hjälte hämtad ur en vit remsa på 3,7:1 — varan fyllde en tredjedel av kvadraten och remsan släpade dessutom med leverantörens gyllene notgrafik och en avskuren gran. Den största, skarpaste bilden av hela ekipaget låg i stället mot bokeh, på 1,7:1. Ta den och byt botten.

- **rembg ensamt räcker inte när varan har svarta delar.** u2net gav rälsen alpha ≈ 0,5, och halvgenomskinligt svart mot vit botten blir **grått**. Rälsen såg urblekt ut fastän masken "fungerade". Lägg en egen luminansmask ovanpå: här låg rälsen under 130 och bokehn aldrig under 181, så `np.maximum(rembg_alpha, lum < 130)` gav den solid. Mät alltid bakgrundens minsta luminans innan du väljer tröskel.
- **Låt det som bleder i källan fortsätta bleda.** Rälsen går ut ur vänsterkanten och nederkanten i originalet. Ankra kompositionen mot dukens nederkant så den gör det även i hjälten — klipper man av rälsen mitt i den vita ytan hänger den i luften.
- **Kolla efter fragment ur grannbilden.** Beskärningen tog med underkanten av ringen ovanför, som blev en rad sliprar svävande över tåget. Behåll bara den största sammanhängande komponenten.

**Metod H – hjälten fanns redan, fel bild var vald:** `scripts/hero/vitbotten-hero.py`

Innan du bygger något: **kontrollera om leverantören redan har en hel bild mot ren vit botten.** Fågelbogungan `560760da` hade sin hjälte beskuren ur MÅTTSKISSEN — sitsen kapad av bildkanten, två tredjedelar rep och tomrum, och en kvarglömd streckad måttlinje uppe till höger. Hela gungan låg samtidigt i en annan leverantörsbild mot exakt 255-vitt. Där behövs ingen maskering alls: mät varans bbox, beskär, skala och klistra på en vit duk. Kolla bakgrundens faktiska värden först (`a.min(axis=2) < 235` + största komponenterna) — är den redan 255 rakt igenom är arbetet gjort.

> ⚠️ **Två färgvägar i samma bildset är en fälla.** Gungans måttskiss visar en BRUN sitsduk (RGB ≈ 50,33,26); alla övriga leverantörsbilder och vårt eget materialkort visar en SVART (≈ 37,37,37). Den gamla hjälten ledde alltså med undantaget. Mät sitsens/ytans faktiska RGB i varje källa innan du väljer hjälte, och led aldrig med den variant som bara förekommer i en enda bild. Notera avvikelsen till Leonard i stället för att gissa vilken som skeppas.

> ℹ️ **Människor i hjälten är rätt val ibland.** För en barnprodukt vars titel lovar "kompisgunga" visar bilden med två barn i både hela varan OCH påståendet. Den döljer dessutom sitsduken, vilket är en fördel när färgen är osäker — vi lovar bara det vi vet.

**Metod I – flera rembg-körningar som slås ihop till en mask:** `scripts/hero/flerdelsmask-hero.py`

När produkten består av flera delar i olika färg och ljushet klarar u2net sällan hela scenen i ett svep — och vilken del som tappas beror på beskärningen. Bilbanan `4b127cb9` gav:

| körning | resultat |
|---|---|
| hela bilden | ramp, målbåge och förvaringslåda bra — **startboxen genomskinlig** (mörk plast mot mörkblå vägg) |
| utsnitt runt rampen | startboxen solid — **målbågen tappad** |
| tätt utsnitt runt huset | huset solid |

Lösningen är inte att hitta den enda rätta körningen utan att **köra flera och unionera maskerna**, var och en begränsad till den del den är bra på (`mask_a | mask_b | mask_c`, där b och c maskeras ned till sin egen ruta). Regeln från Metod E gäller alltså även inom en och samma bild: ju mer föremålet dominerar sin ruta, desto bättre alfa.

Två vinster på köpet när man maskerar produkten i stället för att radera bakgrunden: leverantörens rubriktext, inzoomade cirklar och miljö försvinner av sig självt, och **de lösa golvbilarna med dem**. Det senare är viktigt — leverantören visar ofta samma fem bilar två gånger, både på banan och bredvid den, och i en hjälte läser kunden det som tio. Vi säljer fem.

> ⛔ **Metod A är förbjuden även här** — "5 banor" och "5 bilar" står i titeln, och generativ omritning räknar fel på antal. Samma regel som för hexagonlampan.

**Metod J – genomskinlig produkt mot vitt: mät väggen först:** `scripts/hero/genomskinlig-hero.py`

En klar skiva visar det som ligger bakom den, så normalt gäller samma varning som för LED (Metod F): flyttar man den till vitt försvinner den. **Men det är ett mätbart påstående, inte en regel — mät innan du drar slutsatsen.**

Skärmtaket `fbef53b8` var monterat på en gräddvit husvägg:

| | värde |
|---|---|
| väggen bakom | ~244 |
| polykarbonatskivan | ~223 |
| skivans räfflor | ned mot 184 |
| vitt | 255 |

Skillnaden mellan väggen och vitt är alltså **elva nivåer**. Skivans utseende ändras knappt av bytet, och räfflorna, reflexerna, den svarta ramen och aluminiumlisten bär bilden. Då behövs ingen rekonstruktion alls: hämta silhuetten med rembg, behåll originalpixlarna innanför, lägg vitt utanför.

Regeln blir: **ta silhuetten, inte alfan.** För ett genomskinligt föremål ska man inte alfa-blanda mot den nya bottnen — det tunnar ut skivan en gång till. Tröskla masken (`alfa > 0,43`), behåll största komponenten, och kopiera in originalets RGB rakt av.

Ligger produkten i stället mot mörk eller färgad botten går det inte: då bär skivan den bakgrundens färg och måste fotograferas om. Leta i så fall efter en annan leverantörsbild med ljus vägg innan du ger upp.

**Metod K – hitta varan på TEXTUR när luminansen inte räcker:** `scripts/hero/textur-hero.py`

Mattan `14987bb4` hade en närbild i ett rum som hjälte, beskuren på alla fyra kanter — man såg luggen men aldrig varan. En 160 × 120-matta måste visa sin form.

Leverantörens måttbild visade hela mattan platt, men mot en botten som ligger nästan på samma ljushet: **matta ~199, botten ~227**. Ingen luminanströskel i världen hittar den kanten rent. Textur gör det direkt: luggens **lokala standardavvikelse är ~7,9 medan den släta bottnen ligger på exakt 0**.

```python
lok = ndimage.uniform_filter(lum, 9)
std = np.sqrt(np.clip(ndimage.uniform_filter(lum * lum, 9) - lok * lok, 0, None))
m = ndimage.binary_opening(std > 3.0, iterations=4)
```

Varan är en fylld rektangel, så ingen mask behövs — rad- och kolumnprofil på `m` ger de fyra kanterna. Begränsa profilen till ett grovt område först, annars drar måttpilarna och möbelskissen ut rutan (mitt första försök gav kvot 1,53 i stället för 1,36 av just det skälet).

> ✅ **Gratis rättningsprov: jämför rutans kvot mot måtten i titeln.** 1550 × 1143 px = 1,356 mot 160/120 = 1,333. Två procents skillnad är luggens mjuka kant. Hade jag fått 1,53 hade rutan varit fel — och det märks utan att man ens tittar på bilden.

Lägg en mjuk kontaktskugga under (offset ~16 px, `gaussian_filter(26)`, 17 % styrka), annars svävar en platt vara mot vitt.

**Ta bort ett slutsålt variantval (V3):** filtrera bort valet ur `options[].choicesSettings.choices` OCH dess variant ur `variantsInfo.variants` i **samma** PATCH med `fieldMask: ["options", "variantsInfo"]` — delar man upp det blir det 428 `MISSING_VARIANT_OPTION_CHOICE`. Den kvarvarande varianten **behåller sitt id**, så lagersaldo, pris, SKU och mappningens `wixVariantId` överlever orörda (verifierat på klösträdet `30e1851b`: 100 st och 859 kr kvar efter). Wix städar dessutom bort den föräldralösa lagerposten själv — ett `DELETE` på den svarar 404 efteråt. Kom ihåg att ta bort raden ur mappningens `variants` också, annars letar lagersynken efter en variant som inte finns.

**Metod L – hjälten var redan vit men fel beskuren:** `scripts/hero/miniatyr-hero.py`

En vit botten betyder inte att hjälten är gjord. Paviljongen `d78f7211` låg redan mot 255-vitt men var en dålig beskärning av leverantörens original: högra sidan och möblernas underkant kapades av bildkanten, **och uppe i högra hörnet låg ett löst fragment kvar av den inzoomade miniatyr som originalet har där**. Originalet visar hela varan.

Miniatyren och varan går att skilja åt utan risk med komponentmärkning — paviljongen 1,26 Mpx, miniatyren 0,15 Mpx. **Men verifiera överlappningen innan du raderar**, för deras y-intervall snuddar vid varandra (varan börjar y 488, miniatyren slutar y 535) även om de inte möts i x-led:

```python
overlapp = int(vara[my0:my1, mx0:mx1].sum())
if overlapp:
    raise SystemExit("varan ligger i miniatyrens ruta – radera inte blint")
```

> 🔁 **Leta efter samma fel i KORTEN.** Spec-kortet för paviljongen var byggt av exakt samma trasiga beskärning och bar därför samma svävande fragment. Har du hittat en defekt i en beskärning, sök igenom galleriets övriga bilder efter den innan du släpper produkten — den följer med överallt där samma urklipp återanvänts.

När kortets foto byggs om: fotorutan i `card_spec` har kvot 1,64 medan paviljongen är 1,36. **Fyll ut i SIDLED med vitt** i stället för att beskära — en beskärning hade kapat taket.

**Metod M – när varje vit källa har något ivägen, ta miljöbilden i stället:** `scripts/hero/miljobild-hero.py`

Reflexen är att välja den källa som redan ligger mot vitt. Pop-up-tältet `3eb52634` visar varför det kan vara fel val. Mät ÖVERLAPPNINGEN innan du bestämmer dig:

| källa | botten | problem |
|---|---|---|
| a0, collage | vitt | den gula infällda cirkeln (centrum 1510, 1630, radie 284) skär in i tältväggen — väggens underkant ligger på y ≈ 1447, så bågen döljer en lins **434 px bred och upp till 101 px djup** |
| a2, måttbild | ljusgrön | måttstapeln "1,82 m" ligger tvärs över dörröppningen |
| a1, miljöbild | gräs och himmel | inget ivägen — tältet helt och oskymt |

De två vita källorna hade krävt att man **hittar på produktpixlar** för att fylla igen. Miljöbilden krävde bara en bakgrundsborttagning, och gräs mot mörkgrå duk är hög kontrast som u2net klarar utmärkt. Räkna ut hur stor rekonstruktionen skulle bli innan du väljer — 434 × 101 px påhittad vägg är dyrare än en rembg-körning.

> ⚠️ **Kantbrätten: filtrera inte på färg, bygg om.** Första försöket tog bort gräsgröna pixlar i en 7 px-remsa längs alfakanten. Det åt upp antialiasingen där duken möter gräset och gav en **sågtandad vägg**. Rätt åtgärd är Metod E:s regel: erodera 2 px in i varan och gör en helt egen mjuk kant (`gaussian_filter(0.9) * 1.18`). Då överlever ingen gräsfärgad pixel, och kanten blir rak.

Ett urklipp ur en miljöbild behåller det man ser genom varan — här bord, stolar och huset genom tältets dörröppning. Det är sant och läses som genomsikt, så låt det vara.

Även här gällde regeln från Metod L: **spec-kortet var byggt av samma trasiga beskärning** och bar samma gula fragment. Ombyggt.

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

### Steg 3d – Egna feature-kort (när leverantörens feature-slides är mörka AliExpress-collage)

Vissa produkter (särskilt verktyg/elektronik) har feature-bilder som är **mörka collage/infografik/i-bruk-foton** — inte enskilda produktbilder. De går alltså inte att vitmåla (Steg 3c) och textborttagning (Steg 3b) lämnar dem fortfarande "AliExpress-iga". Då kan du **bygga egna rena, svenska feature-kort** på ljus bakgrund av de RIKTIGA produktfotona — hela katalogen ser då ut som ett eget varumärke. Verifierat på CNC-fräsen (2026-07-08): 5 mörka slides → 5 rena kort, **plus 2 engelska spec-blad → 2 svenska spec-kort** (maskinen urklippt + svensk spec-lista).

> ⚠️ **Position 0 = ren VIT produkt-hjälte, även med eget kort-galleri.** Bygg gärna feature-/spec-KORT för plats 1→N, men produktkortets bild (`media.main` = plats 0) ska vara en **ren vit studio-hjälte** (Steg 3c) — INTE ett kort och INTE en kontext-/livsstilsbild på grå/rörig bakgrund. Har du bara monterade/röriga foton: kör Steg 3c Metod A (Wix Generate Image) på det renaste produktfotot → vit bakgrund. (Lärdom: pakethållarväskan `9e79abae` fick först en rack-livsstilsbild som hjälte i stället för vit — flaggat av Leonard, rättat 2026-07-09; livsstilsbilden flyttades till plats 1 som kontext.)
>
> **Tredje felläget: hjälten är en NÄRBILD.** Vit bakgrund räcker inte — hjälten måste visa HELA varan. Musikbordet `67b738c7` hade en 1780×960-detaljbild som plats 0: benen bortklippta, vindspelet kapat i vänsterkant, tvåtonsblocket i högerkant. Wix beskär dessutom till kvadrat i produktkortet, så en bred bild zoomas in ytterligare. **Mät hjälten:** är den inte ungefär kvadratisk, eller rör varan bildkanten, är den fel. Måttskissen är ofta enda hela studiofotot i galleriet — måttpilarna är overlay och tas bort enligt Steg 3b.
>
> ⚠️ **Klassa overlay per KOMPONENT, inte per pixel, när varan har samma färg som overlayen.** Musikbordets måttpilar är orange — och bordet har orange fötter, orange xylofontangent och orange band på tvåtonsblocket. Ett pixelfilter på orange hade skalperat varan. Etikettera i stället sammanhängande komponenter och släng de vars MEDELFÄRG är overlayens platta vektorton (här (254,155,87) i var och en av 14 komponenter); varans orange sitter inbäddat i den stora produktkomponenten och kan då aldrig råka följa med. Utvidga overlay-masken några pixlar så antialias-brämen runt siffror och pilspetsar går med.
>
> ⚠️ **"Behåll största komponenten" är FEL på produkter med hängande delar.** Vindspelets rör hänger i vita snören som inte överlever bakgrundströskeln — rören blev tre egna komponenter à ~10 000 px och hade fallit bort. Behåll allt utom det du aktivt identifierat som overlay.

> 📐 **`card_spec`-fotot ska ha PANELENS proportion (≈1,64:1) — aldrig 1:1.** Panelen renderas med `object-fit: contain`, så ett kvadratiskt foto skalas efter höjden och krymper. Lasertag-setets kort matades med den kvadratiska hjältebilden, där pistolerna upptar 88 % av bredden men bara 31 % av höjden — resultatet blev att de fyllde **51,6 %** av panelen och såg små ut. Inget fel på kortmotorn, felet låg i indata. Beskär fotot till panelens proportion först: samma bild fyllde då **87,5 %** (1 398 → 2 373 px). Mät före och efter i stället för att titta — skillnaden är lätt att underskatta i miniatyr.

### Döpa om variantalternativ i efterhand (Wix V3)

Rå AliExpress-varianter kan bära namn som är obegripliga eller direkt vilseledande. Mediahyllan `1dd82a63` hade en option som hette **"Färg"** men innehöll fem möbeltyper, och suffixen **TypeA/TypeB betydde motsatta saker beroende på färg**: `24 rader Svart TypeB` var en bred hylla för 1 899 kr, `24 rader Brun TypeB` ett skåp med dörrar för 3 939 kr. **Priset följer möbeln, bokstaven gör det inte** — använd priset som facit när du avkodar leverantörens etiketter, och titta på varje variantbild innan du döper om.

**Omdöpning på plats går INTE.** `choice.name` speglar den låsta `choice.key`. Ett försök att PATCH:a nya namn med bevarade `choiceId` ger `428 MISSING_VARIANT_OPTION_CHOICE` med `optionsMissingChoice: ["färg","modell"]` — Wix tolkar det som "ta bort optionen, skapa en ny" och hittar då varken gamla eller nya val. PATCH:en faller atomiskt, så inget går sönder av försöket.

**Rätt väg — ersätt optionen och laga följdskadorna i ordning:**

1. **Säkerhetskopiera först** till scratchpad: per variant `sku`, `wixVariantId`, pris, synlighet, lagersaldo och lagerpostens id. Utan den kan du inte återställa.
2. **PATCH `options` + `variantsInfo`** (`fieldMask: ["options","variantsInfo"]`). Skicka optionen HELT utan id:n — nytt `name`, nya `choices` med bara `name` + `choiceType` — och identifiera varje variant med `optionChoiceNames` (`optionName` + `choiceName` + `renderType`, alla tre krävs). **Behåll varje `sku` och pris exakt.** `linkedMedia: [{id}]` kan skickas inline med de nya valen och överlever — variantbilderna behöver alltså inte länkas om separat.
3. **Skapa lagerposterna på nytt.** `/stores/v3/products` skapar dem INTE (bara `/products-with-inventory` gör det vid create). Efter steg 2 har produkten noll lagerposter medan den ligger publicerad. Kör `POST /stores/v3/bulk/inventory-items/create` med `{productId, variantId, trackQuantity:true, quantity}` och verifiera saldo mot säkerhetskopian.
4. **Peka om mappningen.** Allt nedströms nycklar på `wixVariantId`: lagersynken (`lib/sync/inventory.ts:27`), `lib/sync/shippability.ts:151` och auktionsmotorn (`lib/auction/seed.ts:96`). Missar du det slutar lagret tyst att uppdateras — varianterna hamnar i `unmatched`, ingen krasch.
5. **Skriv om mappningens `choices` också.** `lib/orders/place-order.ts:66` matchar order → AliExpress-SKU på `v.choices[optionNamn] === valt värde`. Byter optionen namn från "Färg" till "Modell" matchar inget. **Räddningen är att SKU testas först** (rad 62) — därför är regeln: byt aldrig SKU i samma operation.

**Kontrollera till sist** att `FyndplatsAuctions` inte har state med gamla variant-ID (tomt = inget att så om), och att synken inte skriver tillbaka de gamla namnen — `lib/sync/aliexpress-sync.ts` rör varken `options` eller `variantsInfo`, så omdöpningen är beständig.

**Sajten visar gamla namn i upp till 5 minuter** efteråt: headless-PDP:n är ISR med `x-nextjs-stale-time: 300`. Verifiera mot Wix-API:t direkt, och kontrollera sidan igen efter cachefönstret innan du rapporterar klart.
>
> **Gäller även engelska spec-blad:** samma metod bygger om leverantörens spec-blad (Item Model Number / Working Area / Input Voltage …) till rena **svenska spec-kort** (kicker "MODELL X", stor storleksrubrik + effekt-pill, 6-radigt spec-rutnät). Passa på att **rätta felaktig/vilseledande inbränd data**: t.ex. hade CNC-fräsens S4040-blad fel måttcallouts (kopierade från S3020) och båda bladen visade "110V 60Hz" (USA) fast produktens verkliga data är **AC 110/220 V, 50/60 Hz** (EU). Metriska enheter, inga tum/lbs.

**Pipeline (helt lokalt + gratis, ingen Wix-AI):**
1. **Klipp tillgångar** ur bilder som redan har **vit/ren bakgrund** (oftast hjältebilden): maskin, kontroller, spindel osv. Rektangulär beskärning räcker — vit bakgrund smälter sömlöst in i ett vitt kort (ingen urklippning behövs). Beskär SNÄVT så inga tillbehör/skuggor följer med. Foton från mörka källor (t.ex. en i-bruk-bild) presenteras som **rundad foto-banner** (rundade hörn + mjuk skugga) i stället för full-bleed — då krockar de inte med de ljusa korten. Sitter produkten på en **grå/färgad bakgrund med callouts** (typiskt spec-blad) → klipp ut den med **rembg** (`from rembg import remove`) och lägg på vit + mjuk skugga (samma kompositering som Steg 3c). **Gotcha:** u2net väljer det MEST framträdande objektet — på ett spec-blad kan det bli den vita spec-boxen, inte maskinen. **Beskär först till maskin-regionen** (klipp bort spec-boxen) INNAN `remove()`, och behåll bara största alpha-komponenten (`scipy.ndimage.label`) så lösa callout-text-öar försvinner. Granska alltid med `Read`.
2. **Skriv korten som HTML/CSS** (1600×1600), bädda in fotona som base64 data-URI (self-contained). **Låst premium-mall (from 2026-07-09, `cardkit`-motorn):** typsnitt **Inter** (bädda in `@font-face` som base64-woff2 — Chromium saknar bra default-sans), **varm radial-gradient-bakgrund** i stället för platt vit (`radial-gradient(130% 105% at 50% 20%, #FFF 0%, #FAF7F2 50%, #ECE6DC 100%)` — platt vit såg "billig" ut, Leonard 2026-07-09), centrerad poster-layout, och orange **enhets-accent** (talet i svart ink, enheten i orange: `280–435&nbsp;<span class=u>mm</span>`). Håll typografi + marginaler identiska mellan kort-typerna (banner / stort tal / spec-rutnät); footer-lockupen se nedan. Bygg EN återanvändbar modul (`cardkit.py` — `whitekey` / `ground_shadow` / `hero_white` / `card_banner` / `card_number` / `card_spec`) och importera per produkt så hela katalogen blir pixel-konsekvent.
   > **Footer-märke (obligatoriskt from 2026-07-09):** använd **kub-loggan + "Fyndplats"** (lockup), **inte** den gamla grå gles-versalen "FYNDPLATS". Hämta kuben en gång från `https://www.fyndplats.se/icon.png` (orange 3D-kub, transparent PNG), bädda in som data-URI. CSS: `.brandlock{display:flex;align-items:center;gap:15px}` · `img{width:47px;height:47px}` · `b{font-size:37px;font-weight:700;letter-spacing:-.5px;color:#1B1B1A}`. Leonards beslut: nya loggan gäller alla NYA produkter framåt (äldre kort retrofittas bara på begäran).
3. **Rendera → PNG via förinstallerad Chromium** (ingen Wix-AI, ingen hastighetsgräns):
   ```bash
   CHROME=/opt/pw-browsers/chromium-*/chrome-linux/chrome
   "$CHROME" --headless --disable-gpu --no-sandbox --hide-scrollbars \
     --force-device-scale-factor=2 --window-size=1600,1690 \
     --screenshot=out.png "file://$PWD/card.html"   # 2× → 3200² retina (skarpare i Wix)
   ```
   > ⚠️ **Två renderingsfällor som båda ser ut som designfel men är Chromium-beteende (2026-08-04, kostade två omrenderingar).**
   > 1. **Viewporten blir ~87,5 CSS px LÄGRE än `--window-size`.** Ligger gradienten på `<body>` med `height:1600px` blir bakgrundens positioneringsyta viewporthöjden → gradienten **tilar**, och kortets nedersta ~90 px blir vita medan foten kapas mitt i "Fyndplats". Lägg gradienten på ett **fast `.card`-element** (1600×1600, `overflow:hidden`), rendera med **högre fönsterhöjd** (t.ex. `--window-size=1600,1780`) och **kapa till exakt kvadrat i PIL** efteråt.
   > 2. **Utan `<meta charset="utf-8">` blir å/ä/ö mojibake** (`Ã¥`/`Ã¤`/`Ã¶`) — och inkonsekvent, så några kort ser rätt ut och lurar ögat. Skriv filen med `encoding="utf-8"` OCH sätt meta-taggen.
   >
   > Båda är låsta i **`scripts/cardkit.py`** — importera den i stället för att bygga om mallen (den föregående sessionens kortmallar låg bara i scratchpad och försvann när containern återskapades).
   >
   > **Samma viewport-fälla i SVART variant (2026-08-06, hittad i efterhand på 9 publicerade kort/7 produkter):** renderas med `--window-size=1600,1600` och beskärs till 3200² fylls de saknade ~174 px längst ner med **svart band** under lockupen (i stället för det vita/tilade fallet ovan — beror på bakgrunden). Verifiera därför ALLTID att slutbilden är exakt 3200×3200 **utan** mörka rader i nederkant:
   > ```python
   > a = np.asarray(Image.open(p).convert("RGB")); n = 0
   > for y in range(a.shape[0] - 1, -1, -1):
   >     if a[y].mean() < 40: n += 1
   >     else: break
   > assert n == 0, f"{p}: {n} svarta rader i nederkant — fel window-size"
   > ```
   > Redan drabbade kort lagades utan ombyggnad: bandet är rent tomrum, så bakgrundsgradienten förlängdes ner över det (global lutning + sidled-utjämnad basrad — per-kolumn-extrapolation ger lodräta strimmor).
4. **Granska ALLTID med `Read`** (helhet + inzoomat). Vanliga fel: text kapas (sätt `.photo{flex:1;min-height:0}` så textblocket aldrig trängs bort), och **små källurklipp (<~500 px) blir suddiga** när de skalas upp 2–3× → använd i stället en högupplöst i-bruk-bild som rundad banner, eller acceptera medelstor "spotlight". `object-fit:contain` skalar INTE upp av sig själv; `max-width/height:100%` visar bilden i sin naturliga storlek (små blir små).
5. **Ladda upp** alla kort i ETT `UploadImageToWixSite`-anrop (GitHub-branch-vägen, se Steg 3b) och byt in dem i galleriet.

> ⚠️ **Produkten grundas — beskär den ALDRIG (cover-crop). Lärdom 2026-07-09 (barncykeln).** En **produkt** (cykel, stol, maskin) ska alltid ligga `object-fit:contain` på en grundad scen: hela produkten synlig, "stående" på en **äkta komposit-kontaktskugga** (`ground_shadow` — inte CSS `drop-shadow`, inte en platt `.floor`-oval). `object-fit:cover` (full-bleed banner) är BARA för **kontext-/livsstilsfoton** (en husvagn, en trädgård), aldrig för själva produkten — cover **kapar kanterna** (barncykelns hjul klipptes fram/bak). Två följdregler Leonard tryckte på samma dag:
> - **Beskär källan med marginal runt HELA produkten.** Ett för snävt käll-crop (`x[175:1410]`) klippte hjulkanterna redan innan kortet byggdes — vidga tills det finns luft runt varenda kant, granska sedan med `Read`.
> - **Hjälten ska FYLLA rutan (~80 %).** En liten produkt mitt i en stor tom ruta försvinner i katalog-gridden — skala den grundade produkten så den täcker ~80 % av 1600²-rutan (behåll ändå luft + skugga runt om). Gäller BÅDE plats-0-hjälten och produkt-hjälten på feature-korten.

> ⚠️ **Kritisk gotcha (hände denna gång):** en `media.itemsInfo.items`-PATCH som byter galleriet **nollställer `linkedMedia` på alla variantval** (blir `[]`) — även om du inte rör `options`. Efter gallery-bytet MÅSTE du därför köra en separat PATCH som återställer `options[].choicesSettings.choices[].linkedMedia` (peka på de kvarvarande variant-bildernas id) **med `variantsInfo` skickat verbatim** (annars 428 `MISSING_VARIANT_OPTION_CHOICE`). Verifiera med re-GET att varje val har rätt `linkedMedia.id`. Behåll variant-bilderna (t.ex. spec-blad) i galleriet så id:na är stabila.

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

Rå-importer skapas som **draft** (`visible:false`) och syns inte i butiken. Detta är **sista steget** — kör det när Steg 1c (variantsanering), Steg 2–4 och variantkoppling (Steg 6) är klara och **verifierade** (rena `<h2>`-flikar; alla bilder kvar med `image.url`; **SKU re-synkad i Steg 2b**; variantbilder kopplade). Hämta färsk `revision` först. *(Genväg bara för en produkt UTAN bild-/kategori-/variantarbete: slå ihop med Steg 2b — se noten där.)*

```
GET .../products/{PRODUCT_ID}        // färsk revision
PATCH https://www.wixapis.com/stores/v3/products/{PRODUCT_ID}
```

```json
{ "product": { "id": "{PRODUCT_ID}", "revision": "{FÄRSK_REVISION}", "visible": true } }
```

> Misslyckas någon verifiering: fixa först, publicera sedan. Hoppa över publiceringen bara om Leonard uttryckligen bett om draft. Frontend uppdateras via ISR (ingen redeploy).
>
> ⚠️ **`visible` kan flippa av sig självt under polerings-kedjan — kontrollera det, lita inte på att draft förblir draft (2026-08-04).** Efter Steg 2 → 2b → 3 på sex nyimporterade drafts stod **fem av sex på `visible:true`** redan innan Steg 5 kördes, medan orörda produkter ur samma import fortfarande låg som draft. Den sjätte — den enda med optioner, vars Steg 6-PATCH skickade `options` + `variantsInfo` — stod tvärtom kvar på `false`. Praktisk regel: **läs `visible` i slutkontrollen** och sätt den explicit i Steg 5 i stället för att anta något. Är produkten inte klar än (bilder/kategori/varianter kvar) och har flippat till `true` i förtid: PATCHa tillbaka `visible:false` direkt.
>
> *Historik: #134 införde draft-only ("Leonard granskar och publicerar själv"). 2026-06-09 beslutade Leonard att publicera-efter-polering är standard igen — i linje med polish-knappens prompt (`app/admin/queue/polish-button.tsx`), som hela tiden instruerat publicering.*

-----

## Steg 6 – Varianter (kontrollera, fixa bara vid behov)

> **Borttagning av döda/slutsålda varianter görs redan i Steg 1c** (före copy). Här återstår att koppla variantbilder (`linkedMedia`, 6B) och slutverifiera. 6C nedan är den fullständiga mekaniken som Steg 1c hänvisar till.

Importen sköter varianterna automatiskt och deterministiskt (inga AI-anrop) — oftast behöver du inte göra något:

- **Bildbyte per färg/modell är redan kopplat** (`linkedMedia`): huvudbilden byts när kunden väljer t.ex. "Blå". **Rör inte detta när det fungerar** (det gör det i de flesta fall — från skrapans swatch-bilder eller DS-API:ts per-SKU-bilder).
- **Variantnamn översätts till svenska** deterministiskt vid import ("Color"→"Färg", "Red"→"Röd", "100 inch"→"100 tum"). Tabellen täcker inte allt — ovanliga värden kan bli halv-engelska. Men se A): variant-**värden** går inte att döpa om i efterhand i V3.

**A) Variantvärden (t.ex. "100 inch", "Blå") — döp INTE om dem.** I V3 är `choices[].name` låst till `choices[].key`: att ändra bara `name` **fastnar inte**, och att röra `key` riskerar leverantörs-SKU-mappningen (`FP-…`) och fulfillment. Importen lokaliserar redan kända enheter/färger/storlekar vid import (inch→tum, Color→Färg, Red→Röd) → värdet är rätt från start. Ser ett värde ändå fel ut: **flagga till Leonard** så utökas importens översättningstabell — forcera inte ett key-byte. Det polerade produktnamnet/titeln/beskrivningen styr ändå vad kunden främst läser.

**B) Om ett färg-/modellval saknar bildbyte** (text-val utan att huvudbilden ändras) — koppla valet till rätt galleribild. Verifierat mot V3:

1. **GET** produkten med `fields=MEDIA_ITEMS_INFO`, hitta rätt bilds `media.itemsInfo.items[].id` — hämta previews och **titta** på bilderna (samma curl-metod som i Steg 1b) så att rätt färg/modell kopplas; matcha inte enbart på `altText`. Läs färsk `revision`.
2. **PATCH**: sätt `linkedMedia: [{ "id": "<media-item-id>" }]` på rätt `choices[]`. Skicka **HELA** `options` + `variantsInfo` **verbatim** + färsk `revision`.
3. Wix ingest:ar bilder **asynkront** (~5 s) — verifiera via re-GET att `linkedMedia` sitter kvar; annars PATCHa om med ny `revision`.

> **Fastnar `linkedMedia` inte** (re-GET visar `—` trots färsk revision)? Två fällor från 2026-07-09: (1) en **rå GET utan `fields=MEDIA_ITEMS_INFO` returnerar en TOM `items`-array**, så `items[pos]` blir undefined och du kopplar mot intet — GET:a alltid med fältet. (2) Om media-item-`id`:t ändå inte biter, prova **fil-id:t** `items[].image.id` (wixstatic-fileId) i stället för media-item-`id`:t — det var det som fick om-kopplingen av Skobänk/Babybadkar/Katthjul att sitta.

```
GET .../products/{PRODUCT_ID}?fields=MEDIA_ITEMS_INFO        // media-item-id + färsk revision
PATCH https://www.wixapis.com/stores/v3/products/{PRODUCT_ID}
```

```json
{ "product": {
  "revision": "{FÄRSK_REVISION}",
  "visible": true,
  "options": [
    { "name": "Färg",
      "choicesSettings": { "choices": [
        { "name": "Blå", "linkedMedia": [ { "id": "{MEDIA_ITEM_ID}" } ] }
      ] } }
  ],
  "variantsInfo": "{VERBATIM_FRÅN_GET}"
} }
```

> Skicka `options` **komplett** (alla optioner och val, inte bara det du ändrar) och `variantsInfo` exakt som det kom från GET — annars svarar V3 428 `MISSING_VARIANT_OPTION_CHOICE`. Bilden måste redan ligga i produktens media-pool (den gör den efter import). **Skicka ALLTID `visible:true` i samma PATCH** — en `variantsInfo`-PATCH på en publicerad produkt kan annars flippa den till draft (`visible:false`) och ta bort den ur butiken (hände bordsskyddet 2026-07-09).
>
> ⚠️ **Flippen slår åt BÅDA hållen (batch-lärdom 2026-08-04, 5 av 11 produkter):** en `variantsInfo`-PATCH (t.ex. Steg 2b:s SKU-resynk) på en **draft** kan tyst flippa den till `visible:true` — produkten går live innan poleringen är klar. **Re-GET:a `visible` direkt efter VARJE PATCH som innehåller `variantsInfo`** och återställ omedelbart om den flippat (skicka `visible:false` med färsk revision). Gäller alltså även opublicerade produkter där du "inte rör" synligheten.
>
> ☠️ **FÖLJDBUGGEN — produkten blir OSÄLJBAR (2026-08-05):** när du sätter tillbaka `visible:false` på produkten **kaskaderar det ned till `variantsInfo.variants[].visible:false`**. Att sedan publicera (`visible:true`) återställer INTE varianten — produkten syns i butiken men går inte att lägga i varukorgen. Drabbade 2 produkter i batch 1 (köksön `07a6b8bf`, slangvindan `3995dfd4`) innan det upptäcktes.
>
> **Obligatorisk kontroll före publicering:** GET med `fields=VARIANT_OPTION_CHOICE_NAMES` och verifiera att **varje** `variantsInfo.variants[].visible === true`. Är någon `false`: PATCHa `variantsInfo` med `visible:true` på alla varianter (skicka `options` verbatim om produkten har optioner) och re-GET-verifiera. Gör detta som sista steg efter publiceringen också.

> ⚠️ **Varje variant har sin EGEN bild — slå ALDRIG ihop två varianter på samma bild. Lärdom 2026-07-09 (Leonard fångade det två gånger).** Frestelsen: två storlekar/modeller ser "nästan lika" ut → peka bådas `linkedMedia` på samma hjälte. Fel — kunden ska se exakt den variant hen väljer. Volleybollnätet (**gult** nät 1,25 tum vs **orange** nät 1,75 tum) och hund-cykelvagnen (liten boxig PTS101/30 kg vs stor avlång PTS21-C/40 kg) har genuint olika exemplar. Har du bara EN bild:
> - **Återskapa den saknade varianten ur källan.** Käll-bilderna ligger i CMS: `GET /data/v2/items/{PRODUCT_ID}?dataCollectionId=FyndplatsMappings` → fältet `imageAnalysis` listar AliExpress käll-URL:er (`ae01.alicdn.com`, hämtas **direkt med curl** — till skillnad från produktsidan som är JS-blockerad). Klipp rätt exemplar ur rätt spec-/variantbild, AI-tvätta bort engelsk text (Steg 3b `generate-image` — **vänta ut hastighetsgränsen** mellan anrop), grunda på vit, ladda upp, koppla per variant.
> - **Finns ingen egen bild alls** (t.ex. färg utan foto) → ta bort varianten (6C), koppla inte en delad bild.
>
> **Hitta buggen i hela katalogen:** för varje produkt med >1 variantval, GET:a `fields=MEDIA_ITEMS_INFO` och jämför `choices[].linkedMedia[].id` — **samma id på 2+ val = merge-bugg** (åtgärda), **tomma** = omappad storleks-/spec-variant (oftast ofarlig). Den fulla katalog-svepen (417 produkter, 2026-07-09) hittade bara cykelvagnen med den äkta buggen.

**C) Ta bort bilder för modeller/varianter som inte finns eller är slutsålda.** Rå-importer buntar ibland flera modeller/storlekar under EN listning och släpar med leverantörens **spec-ark för varianter som inte säljs**. Regel: när du SEO-polerar och en variant/modell **inte finns eller är slut hos leverantören**, ta bort **både** valet (om det finns som option) **och dess bilder** — spec-ark, variantfoton och ev. `linkedMedia` — och skriv SEO/specar efter bara det som är kvar.

> **Gäller även en RIKTIG (mappad) variant som bara är `inStock:false`** — inte bara phantom-/obundna modeller. Regeln är "slut hos leverantören → bort", så en variant som har en egen `supplierVariantId` men är slut tas ändå bort (den kan re-läggas om den kommer i lager igen). Verifierat på racingstället `40955353` (2026-07-08): "Typ A" var slut → togs bort.
>
> **Blir bara EN variant kvar → kollapsa hela optionen till en enkel-variant-produkt** (inte en option med ett enda val — ful dropdown). PATCH: `options:[]` + `variantsInfo.variants:[{ id:<behållna variantens id>, choices:[], sku, price, inventoryStatus }]` (V3 accepterar det; SKU blir `FP-<produkt>` utan variant-del). Byt **också** ut ev. feature-/hjältebilder som visar den BORTTAGNA variantens exemplar (t.ex. ett urklipp gjort ur den slutsålda modellens bild) mot den kvarvarande variantens — annars visar galleriet en produkt kunden inte kan köpa. Ta bort "två storlekar"/"Typ A/B"-språk ur namn, meta, beskrivning och FAQ.

- Flik-rubrikerna ligger som **rena `<h2>`** (`Tekniska specifikationer`, `Vanliga frågor`, ev. `Användning och skötsel`) — inte feta/`<span>`-lindade — så de renderas som **flikar** på PDP:n, inte inline.
- SKU:n matchar den **polerade sluggen** (`FP-<svensk-slug>-<variant>`) — inga engelska råord, inget **dropship-märke** (etablerade märken som Pagani Design/LAIKOU behålls); re-synkad i Steg 2b.
- Variantsaneringen (**Steg 1c**) och variantbildkopplingen (**Steg 6**) är gjorda, och produkten är **publicerad** (`visible:true`) som sista steg — annars syns den inte i butiken.
- (Engångs-bekräftat: frontend renderar `<title>`/`<h1>`/meta från fälten och skickar egen `Product`-JSON-LD. Du behöver inte kontrollera detta per produkt.)

-----

## Utanför SEO (gör bara om uttryckligen ombedd)

- **Variant felmärkt som "Färg":** den delade optionen "Färg" (`0b32a475-…`, TEXT_CHOICES) hänger på ~100+ produkter – döp INTE om den. Skapa en egen unikt namngiven option och koppla om varianterna. Unikhet gäller `name`+`type`+`renderType`; choices kräver `choiceType:"CHOICE_TEXT"`; produktens option kräver `choicesSettings`. Se fullständig poleringsreferens.
- **Info-sektioner:** skapa inte en per produkt (taket är 400). Lägg innehåll i beskrivningen.
