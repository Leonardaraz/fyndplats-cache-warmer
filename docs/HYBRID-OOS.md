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
| `SHOW_OOS_IN_LISTINGS` | _(av)_ | `1` = visa slutsålda i listningarna igen (gamla beteendet). **Döljning är PÅ som default sedan 2026-08-04.** Produktsidan + dess OOS-UI påverkas aldrig av flaggan. |

## Var slutsålt syns — och var det inte gör det (2026-08-04)

| Yta | Slutsålt | Varför |
|---|---|---|
| Kategori, /butik, /alla-produkter, startsidan | **Dolt** | Bläddring — slutsålt är återvändsgränder (39 av 452 = vart elfte kort) |
| Sökresultat (`/sok`) | **Visas sist**, med badge | Sökning är avsiktsstyrd: hittar man inte varan man såg är det värre än en märkt träff |
| Autocomplete, skriven sökning | **Visas sist**, med etikett | Samma skäl |
| Autocomplete, "Populära produkter" (tomt fält) | **Dolt** | Tomt fält = bläddring, inte sökning |
| "Liknande produkter" på PDP | **Aldrig** | Ett förslag är ett aktivt tips — hellre 3 köpbara än 4 med en död länk |
| Meny-/kategoriantal | **Räknas inte** | Siffran är ett löfte; den måste matcha vad sidan visar |
| Kategori vars ALLA varor är slut | **Försvinner ur menyn**, sidan 307:ar till `/butik` | Självläker när varan fylls på (befintlig mekanik) |
| Produktsidan | **Visas alltid** | Bevakningsformulär + Google-värdet bevaras |
| Sitemap, Google-/Meta-feed | **Med, markerad slut** | Feeds ska markera lagerstatus, inte utelämna artikeln |

"I lager"-filtret i verktygsraden visas bara när listan faktiskt innehåller
något slutsålt (dvs. i sök) — annars vore det ett reglage utan verkan.

## Designbeslut

Produkten döljs INTE via Wix `visible:false` (det skulle döda produktsidan).
OOS-signalen är Wix `inventory = 0` (sätts av sync-cronen). Listningarna
filtrerar bort `inStock === false`; produktsidan renderar alltid. Se
`OOS-HYBRID-NOTES.md` i cache-warmer-repot för helheten.

CORS för `/api/restock-subscribe` är öppnat för `fyndplats.se`/`www.fyndplats.se`
+ `*.vercel.app`-preview i cache-warmer-appens `middleware.ts`.
