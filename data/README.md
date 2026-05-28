# `data/` — statisk data för headless-storefronten

## `variant-images.json`

Variant→bild-mappning för hela Fyndplats-katalogen.

### Varför filen finns

Headless-storefronten (`fyndplats-headless` på Vercel) har en **foto-väljare för
varianter** (färg-/variant-swatchar → produktfoton). Problemet: Wix **anonyma/publika**
API exponerar *inte* kopplingen variant → bild. Bilderna själva ligger publikt på Wix CDN
(`static.wixstatic.com`) och laddas för vem som helst — det är bara *kopplingen* som är gömd.

Lösningen är att hämta kopplingen en gång via **autentiserat Wix-admin-API** och baka in den
som denna statiska fil. Då behövs ingen `WIX_API_TOKEN` i storefronten, ingen Vercel-ändring
och ingen hemlighet — och det funkar för alla produkter.

### Form

```jsonc
{
  "exportedAt": "2026-05-28",
  "sourceSite": "Fyndplats (8c62127f-...)",
  "sourceCatalogVersion": "V1_CATALOG",
  "totalProductsInSource": 207,
  "productsWithVariantImages": 193,
  "products": {
    "<produkt-slug>": {
      "name": "Produktnamn",
      "options": [
        {
          "name": "Metallfärg",              // optionens namn
          "choices": [
            { "value": "Guld", "image": "https://static.wixstatic.com/media/…" },
            { "value": "Silver", "image": "https://static.wixstatic.com/media/…" }
          ]
        }
      ]
    }
  }
}
```

- Nycklad per **produkt-slug** (samma slug som i produktsidans URL).
- `image` är en publik Wix CDN-URL. Frontend kan be om valfri storlek genom att byta
  `w_…,h_…`-parametrarna i URL:en.
- `image` kan vara `null` för enstaka val som saknar egen bild.
- **Endast optioner där minst ett val har en bild ingår.** Rena storlek-/modell-optioner
  utan per-val-bilder (t.ex. "13 tum / 14 tum") är bortfiltrerade eftersom foto-väljaren
  inte behöver dem.

### Användning i storefronten

Läs in filen vid build/SSR och slå upp på produktens slug. När besökaren väljer ett
optionsvärde, visa motsvarande `image`.

### Uppdatera

Filen är en ögonblicksbild. Kör om exporten (paginerat `POST /stores/v1/products/query`
mot källsajten via admin-API, plocka `productOptions[].choices[].media.mainMedia.image.url`)
när katalogens varianter eller variantbilder ändras.
