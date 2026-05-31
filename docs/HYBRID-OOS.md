# Hybrid slut-i-lager — produktsidans OOS-state + bevakningsformulär

Storefront-delen av Feature 1 (resten ligger i `fyndplats-cache-warmer`).

## Vad som ändrats

- **`components/restock-form.tsx`** (ny) — "Meddela mig när varan är tillbaka i
  lager"-formulär. Postar `{ productId, email }` till cache-warmer-appens
  publika `/api/restock-subscribe`.
- **`components/productview.tsx`** — när `!inStock`:
  - prominent **"Slutsåld"-banner** överst (röd chip, före priset),
  - köp-knappen är inaktiverad och visar "Slutsåld",
  - bevakningsformuläret renderas i köp-boxen.
- **`app/produkt/[slug]/page.tsx`** — JSON-LD `availability: OutOfStock` när
  produkten är slut (fanns redan, oförändrad).
- **`lib/products.ts`** — `forListings()` + `hideOosFromListings()`: filtrerar
  bort slutsålda produkter ur listningarna. Inkopplat i `/butik`,
  `/alla-produkter`, `/kategori/[slug]`.
- **`app/globals.css`** — stilar för `.oos-banner`, `.restock-box`, m.fl.

## Env-vars

| Var | Default | Funktion |
|---|---|---|
| `NEXT_PUBLIC_RESTOCK_API` | `https://fyndplats-cache-warmer.vercel.app/api/restock-subscribe` | Endpoint som bevakningsformuläret postar till. |
| `HIDE_OOS_FROM_LISTINGS` | _(av)_ | `1` = dölj slutsålda produkter från listningarna. **Default AV** så inget i den live:a butiken ändras förrän du aktiverar det. Produktsidan + dess OOS-UI påverkas aldrig av flaggan. |

## Designbeslut

Produkten döljs INTE via Wix `visible:false` (det skulle döda produktsidan).
OOS-signalen är Wix `inventory = 0` (sätts av sync-cronen). Listningarna
filtrerar bort `inStock === false`; produktsidan renderar alltid. Se
`OOS-HYBRID-NOTES.md` i cache-warmer-repot för helheten.

CORS för `/api/restock-subscribe` är öppnat för `fyndplats.se`/`www.fyndplats.se`
+ `*.vercel.app`-preview i cache-warmer-appens `middleware.ts`.
