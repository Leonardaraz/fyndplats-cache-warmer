# SEO-polering (färdig, redo att appliceras) — Hopfällbar massagebänk

> **Status:** Innehållet nedan är **förberett och verifieringsklart**, men **INTE applicerat
> live**. Den här sessionen är en GitHub-kodmiljö **utan Wix-MCP-verktyg** (`ExecuteWixAPI`)
> och **utan Wix-credentials** i env — så runbookens live-steg (GET/PATCH/publicera) kan
> **inte** köras härifrån. Poleringen är byggd för Cowork-chatten som har Wix-verktygen
> (se `app/admin/queue/polish-button.tsx`). **Applicera** genom att köra
> `docs/seo-polish-runbook.md` Steg 1–6 med bodyerna nedan (klipp-och-klistra), eller kör
> hela detta i Cowork-chatten. **Publicering (`visible:true`) sker i apply-steget, inte här.**

| Fält | Värde |
|---|---|
| Wix-produkt-ID | `08fa637b-a1e5-4328-93d7-ea700af48973` |
| Rå titel | Homcom Folding Massage Table with Headrest Pink Aluminum Structure |
| AliExpress-källa | https://www.aliexpress.com/item/1005012621231106.html |
| Katalog | Wix Stores V3, site `e6d27e90-4749-4720-9afe-0bbe91c1b3d3` |
| Märke | **HOMCOM = dropship-husmärke → strippas helt** (ligger i `lib/import/sku.ts` `KNOWN_BRAND_TOKENS`) |

## Källor för specar (AliExpress-sidan är JS-blockerad → `web_search`, per runbook Steg 0)

Specarna nedan kommer från återförsäljarlistningar för **samma HOMCOM-modell** (2-sektioners,
72″, hopfällbar massagebänk med huvudstöd, aluminiumram, PU-läder). Inga siffror är påhittade.
- Aosom Canada – "HOMCOM 72Inch 2 Section Adjustable Massage Table … Purple" (`5550-3293`)
- Debenhams / DIY.com / Tesco / Amazon.co.uk – HOMCOM hopfällbar massagebänk, aluminiumram + huvudstöd

Mått (avrundade från tumangivelser): längd ~183 cm (72″), bredd ~60 cm (23,5″), justerbar
höjd ~62–88 cm (flera lägen), 2 sektioner, aluminiumram, PU-/konstläder + skumstoppning,
avtagbart/justerbart huvudstöd med ansiktshål, bärväska + bärhandtag ingår.
> ⚠️ **Bärkapacitet:** källorna spretar (225 kg för aluminium-3-sektion vs ~250 kg/550 lb för
> 2-sektion). Angett som "hög bärkapacitet (ca 250 kg enligt tillverkaren)" och hedgat. Kan
> justeras/tas bort om DS-API/importdata ger exakt siffra. Hitta inte på ett annat tal.

---

## Steg 0 — Fokussökord

**`hopfällbar massagebänk`** (huvudord `massagebänk` + kvalificerare `hopfällbar`).
Exakt produkttyp, hög köpintention — och runbookens egna exempel för just den här typen.
Båda orden ligger i **titel, H1 och slug** (annars röd i Wix SEO-assistenten).

---

## Steg 2 — PATCH namn + slug + seoData + beskrivning

**Hämta färsk `revision` med GET precis före PATCH.** Fyll i `{FÄRSK_REVISION}`.

- **name (H1):** `Hopfällbar massagebänk med huvudstöd – rosa aluminiumram, 2 sektioner`
- **slug (ASCII, ny — produkten är draft/ej live ännu):** `hopfallbar-massagebank-rosa`
- **title (~54 tecken):** `Hopfällbar massagebänk med huvudstöd – rosa | Fyndplats`
- **meta description (~148 tecken):** `Hopfällbar massagebänk med justerbart huvudstöd och lätt aluminiumram i rosa. Portabel 2-sektionsbänk för massage, spa och behandling – med bärväska.`

```
GET  https://www.wixapis.com/stores/v3/products/08fa637b-a1e5-4328-93d7-ea700af48973
PATCH https://www.wixapis.com/stores/v3/products/08fa637b-a1e5-4328-93d7-ea700af48973
```

```json
{ "product": {
  "id": "08fa637b-a1e5-4328-93d7-ea700af48973",
  "revision": "{FÄRSK_REVISION}",
  "name": "Hopfällbar massagebänk med huvudstöd – rosa aluminiumram, 2 sektioner",
  "slug": "hopfallbar-massagebank-rosa",
  "seoData": {
    "tags": [
      { "type": "title", "children": "Hopfällbar massagebänk med huvudstöd – rosa | Fyndplats", "custom": false, "disabled": false },
      { "type": "meta", "props": { "name": "description", "content": "Hopfällbar massagebänk med justerbart huvudstöd och lätt aluminiumram i rosa. Portabel 2-sektionsbänk för massage, spa och behandling – med bärväska." }, "children": "", "custom": true, "disabled": false }
    ],
    "settings": {
      "preventAutoRedirect": false,
      "keywords": [
        { "term": "hopfällbar massagebänk", "isMain": true, "origin": "USER" },
        { "term": "massagebänk med huvudstöd", "isMain": false, "origin": "USER" },
        { "term": "portabel massagebänk", "isMain": false, "origin": "USER" }
      ]
    }
  },
  "plainDescription": "<p>Den här hopfällbara massagebänken ger en stabil och bekväm behandlingsyta som är enkel att ta med och ställa undan. Den lätta aluminiumramen i rosa väger lite men bär mycket, och det justerbara huvudstödet gör att både du och din klient sitter bekvämt under massage, spa- och skönhetsbehandlingar.</p><p><strong>Egenskaper</strong></p><ul><li>Hopfällbar massagebänk i två sektioner – snabb att fälla ihop och bära</li><li>Lätt men stabil aluminiumram i rosa</li><li>Justerbart, avtagbart huvudstöd med ansiktsöppning</li><li>Höjden justeras i flera lägen för en bekväm arbetshöjd</li><li>Stoppad liggyta klädd i lättskött PU-läder</li><li>Bärväska och bärhandtag ingår för enkel transport</li></ul><h2>Tekniska specifikationer</h2><ul><li>Rammaterial: aluminium</li><li>Klädsel: PU-läder (konstläder)</li><li>Stoppning: skumfyllning</li><li>Antal sektioner: 2 (hopfällbar)</li><li>Längd: ca 183 cm</li><li>Bredd: ca 60 cm</li><li>Justerbar höjd: ca 62–88 cm (flera lägen)</li><li>Huvudstöd: justerbart och avtagbart med ansiktsöppning</li><li>Bärkapacitet: hög, ca 250 kg (enligt tillverkaren)</li><li>Färg: rosa</li><li>Ingår: massagebänk, avtagbart huvudstöd, bärväska</li></ul><h2>Användning och skötsel</h2><p>Fäll upp bänken, lås benen i önskad höjd och sätt fast huvudstödet innan du börjar. Torka av liggytan med en fuktig trasa och milt rengöringsmedel efter varje behandling – undvik starka lösningsmedel som kan skada konstlädret. Fäll ihop bänken och förvara den i bärväskan på en torr plats.</p><h2>Vanliga frågor</h2><p><strong>Är massagebänken enkel att bära med sig?</strong></p><p>Ja. Den fälls ihop i två sektioner, väger lite tack vare aluminiumramen och levereras med bärväska och bärhandtag så att du enkelt tar den med till kunder eller mässor.</p><p><strong>Går höjden att justera?</strong></p><p>Ja, benen kan ställas in i flera höjdlägen så att du hittar en bekväm arbetshöjd oavsett om du står eller sitter under behandlingen.</p><p><strong>Kan huvudstödet tas av?</strong></p><p>Huvudstödet är justerbart och avtagbart med en ansiktsöppning, vilket gör att klienten kan ligga bekvämt på mage och andas fritt.</p><p><strong>Vilket material är liggytan klädd i?</strong></p><p>Liggytan är stoppad med skum och klädd i lättskött PU-läder som torkas av snabbt mellan behandlingarna.</p>"
} }
```

> **Flik-regel (kritisk):** rubrikerna är rena `<h2>Tekniska specifikationer</h2>`,
> `<h2>Användning och skötsel</h2>`, `<h2>Vanliga frågor</h2>` — ingen fetstil/`<span>` på
> `<h2>`-raden (FAQ-frågorna är feta `<p>`, vilket är tillåtet). Så renderas de som **flikar**,
> inte inline. `plainDescription` → Wix auto-genererar Ricos-`description` (samma väg som importen).

---

## Steg 2b — Re-synka SKU till nya sluggen (+ ev. `visible:true`)

Produkt-delen ur `hopfallbar-massagebank-rosa` (`lib/import/sku.ts`, ≤24 tecken, ledande märke
strippas — här finns inget märke kvar): **`hopfallbar-massagebank`**.

- Har produkten en färgvariant **`Rosa`** → SKU: **`FP-hopfallbar-massagebank-rosa`** (30 tecken ✓)
- Saknar produkten optionsvärden → SKU: **`FP-hopfallbar-massagebank`**

> Kör runbookens Steg 2b-algoritm på de **faktiska** varianterna från GET
> (`?fields=VARIANT_OPTION_CHOICE_NAMES`) — jag kan inte läsa variantsetet härifrån. Skicka
> `options` **+** `variantsInfo` **verbatim** (ändra bara `sku`) + färsk `revision`, annars
> **428 MISSING_OPTIONS_ON_UPDATE_VARIANTS**. Lägg gärna `visible: true` i samma PATCH (slår
> ihop Steg 2b + Steg 5). Verifiera: nya SKU:n saknar engelska råord och märke.

---

## Steg 3 — Skriv om ALLA bild-alt-texter

Skicka tillbaka **hela** `media.itemsInfo.items`-arrayen, ändra **bara `altText`** (+ `image.altText`).
**Skicka INTE `media.main`** (readOnly). Verifiera efteråt att alla items har kvar `image.url` och
att antalet är oförändrat. Antalet bilder är okänt härifrån — mappa nedan mot faktiska motiv:

1. `Hopfällbar massagebänk med huvudstöd och rosa aluminiumram`
2. `Rosa massagebänk uppfälld med justerbart huvudstöd för behandling`
3. `Hopfällbar massagebänk ihopfälld i två sektioner med bärväska`
4. `Närbild på justerbart huvudstöd med ansiktsöppning på massagebänken`
5. `Massagebänk med höjdjusterbara ben i lätt aluminium`
6. `Rosa massagebänk med lättskött liggyta i PU-läder`
7. `Portabel massagebänk med bärhandtag för enkel transport`
8. `Måttskiss för hopfällbar massagebänk med huvudstöd`

```js
// items = media.itemsInfo.items från Steg 1; newAlt = listan ovan (kapa/utöka till items.length)
const itemsA = items.map((it, i) => ({ ...it, altText: newAlt[i], image: it.image ? { ...it.image, altText: newAlt[i] } : it.image }));
// PATCH { product: { id, revision:{FÄRSK}, media: { itemsInfo: { items: itemsA } } } }   // INGEN media.main
```

---

## Steg 4 — Kategori

Produkten är en möbel/behandlingsbänk. Runbookens möbelregel → **Hem & Inredning**
`3ed832b7-213f-4bd8-bbc4-e95744a9b316` som säker default.
> Bättre träff kan finnas bland de ~45 kategorierna (t.ex. **Träning & Gym** eller en
> **Skönhet/Hälsa**-kategori). Query:a kategorilistan i apply-steget och välj den mest
> specifika; annars Hem & Inredning. (appId `215238eb-22a5-4c36-9e7b-e7c08025e04e`,
> treeReference `{ "appNamespace": "@wix/stores" }`.)

---

## Steg 5 — Publicera

`{ "product": { "id": "08fa637b-a1e5-4328-93d7-ea700af48973", "revision": "{FÄRSK_REVISION}", "visible": true } }`
Publicera **efter** att Steg 2–4 + Steg 6 är verifierade (rena `<h2>`-flikar, alla bilder kvar
med `image.url`, SKU re-synkad). Kan slås ihop med Steg 2b.

---

## Steg 6 — Varianter (kontrollera, fixa bara vid behov)

- Om produkten har en färgvariant: verifiera att värdet är **`Rosa`** (svenska), inte `Pink`.
  Döp **inte** om variantvärden i V3 (låst `choice.key`) — ser värdet engelskt ut, **flagga
  till Leonard** så importens översättningstabell utökas (forcera inte key-byte).
- Om ett färg-/modellval saknar bildbyte (`linkedMedia`): koppla valet till rätt galleribild
  per runbookens Steg 6B (skicka hela `options` + `variantsInfo` verbatim + färsk `revision`).

---

## Klart-kriterium (verifieras i apply-steget)

- [ ] Fokussökordet `hopfällbar massagebänk` i titel, H1, slug, beskrivning och meta → gröna i SEO-assistenten
- [ ] Alla bilder har svenska alt-texter och kvar sina `image.url`
- [ ] Flik-rubrikerna renderas som flikar (rena `<h2>`)
- [ ] SKU matchar polerade sluggen, inget `homcom`/engelska råord
- [ ] Variantkontroll gjord
- [ ] Produkten **publicerad** (`visible:true`)
