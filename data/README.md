# `data/` — statisk data för storefronten

## `variant-images.json`

Variant→bild-mappning för hela Fyndplats-katalogen.

### Varför filen finns

Storefrontens **foto-väljare för varianter** (`components/productview.tsx`) kör bild-läge
när varje variantval har en bild. Men `@wix/stores`-SDK:ns besökar-token **släpper
`choice.media`**, och Wix anonyma/publika API exponerar inte kopplingen variant → bild.
Bilderna själva ligger publikt på Wix CDN (`static.wixstatic.com`) och laddas för vem som
helst — det är bara *kopplingen* som är gömd.

Lösningen: hämta kopplingen **en gång** via autentiserat Wix-admin-API och baka in den som
denna statiska fil. Då behövs **ingen `WIX_API_TOKEN`** i storefrontens Vercel-env, ingen
per-request-hämtning, och det funkar för hela katalogen.

### Hur den konsumeras

`lib/products.ts` importerar filen och förberäknar `slug → (choice-värde → bild-URL)`.
I `getProduct(slug)` fyller `optionsForProduct()` i `choice.image` från mappningen, varpå
`productview` växlar till bild-läge. Saknas produkten/värdet i mappen faller pickern tillbaka
på färg-swatch/text precis som förut (ingen regression).

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
          "name": "Metallfärg",
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

- Nycklad per **produkt-slug** (matchar storefrontens `getProduct(slug)`).
- `choice.value` matchas mot pickerns `choice.label`.
- `image` är en publik Wix CDN-URL; valfri storlek fås genom att byta `w_…,h_…`.
- Endast optioner där minst ett val har en bild ingår (193 av 207 produkter; rena
  storlek-/modell-optioner utan per-val-bild är bortfiltrerade).

### Uppdatera

Filen är en ögonblicksbild. Kör om exporten (paginerat `POST /stores/v1/products/query`
mot källsajten via admin-API, plocka `productOptions[].choices[].media.mainMedia.image.url`)
när katalogens varianter eller variantbilder ändras.
