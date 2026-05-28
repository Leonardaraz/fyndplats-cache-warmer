# Fyndplats → Ny Headless v3 — Migrationspaket (v2, verifierad)

Detta paket innehåller allt som behövs för att flytta 207 produkter och 68 kategorier från Fyndplats (Wix Stores v1) till den nya headless-sajten (Wix Stores v3) utan kvalitetsförlust. Alla fältnamn och endpoints är verifierade mot Wix officiella live-API-spec.

## Filer

| Fil | Vad det är |
|-----|------------|
| `MIGRATION.md` | **Huvuddokumentet.** Steg-för-steg-instruktioner med fullständig och verifierad v1→v3 fältmappning. |
| `collections.json` | Alla 68 kategorier från Fyndplats. Används för att återskapa kategorier på nya sajten. |
| `sample-products.json` | Exempel-produkter från Fyndplats. Används för dry-run-verifiering innan full körning. |
| `scripts/transform.ts` | Ren v1→v3-transform (testad). |
| `scripts/dry-run.ts` | Kör dry-run mot `sample-products.json` och skriver ut transformerad v3-struktur. |
| `README.md` | Den här filen. |

## Källinfo

- **Källsajt:** Fyndplats (siteId: `8c62127f-c07a-4596-86b8-4e88b5cc502d`)
- **Källans katalog-version:** V1_CATALOG
- **Antal produkter:** 207
- **Antal kategorier:** 68
- **Exportdatum:** 2026-05-28

## Så här kör du paketet

1. Säkerställ att miljön har `WIX_API_TOKEN` (samma konto som båda sajterna) och `TARGET_SITE_ID` (mål-sajten — fås via Wix MCP `ListWixSites`).
2. Kör dry-run:
   ```
   pnpm migrate:dry
   ```
   Granska den utskrivna v3-strukturen.
3. När du är nöjd, kör skarpt i den ordning som anges i `MIGRATION.md`.

## Vad som flyttas utan kvalitetstapp

- Produktnamn, slugs, beskrivningar (HTML konverteras till v3:s Ricos-format via Wix officiella konverterings-API — emojis, fetstil, rubriker, listor, inline-bilder bevaras)
- Info-sektioner (Tekniska specifikationer, Användning, Vanliga frågor, Kontakta oss)
- Priser och valuta (flyttas till variant-nivå enligt v3:s modell)
- Alla varianter med korrekta priser och SKU:er
- Produktbilder (laddas upp till nya sajtens egna mediabibliotek så nya sajten blir självständig)
- Kategoritillhörigheter (primär kategori + sekundära)
- Synlighet, ribbons, varumärke

## Vad som INTE flyttas

- Ordrar och orderhistorik (gäller bara gamla butiken)
- Kundkonton (Fyndplats fortsätter äga sina kunder)
- Recensioner (kopplade till v1-produkt-IDs)
- SEO-omdirigeringar (URL-strukturen skiljer sig)
- Interna ID:n (produkter får nya v3-IDs)

## Tekniska detaljer värt att veta

- **Beskrivningar:** v1 lagrar HTML-strängar, v3 lagrar Ricos rich-content-noder. Migrationsskriptet använder `POST /ricos/v1/ricos-document/convert/to-ricos` för att konvertera utan kvalitetstapp.
- **Priser:** v1 har pris på produktnivå med variant-overrides; v3 har pris bara på variant-nivå. Priser är **strängar** i v3 (`"99.99"` inte `99.99`). För produkter utan varianter skapas en default-variant automatiskt.
- **Lager:** v3 separerar produkt-skapande från lager-sättning. `inventoryStatus.inStock` på variant är bara en boolean — exakta saldon (`quantity: 21`) sätts via separat Inventory API (POST `/stores/v3/bulk/inventory-items/update`) i ett uppföljningssteg.
- **Bilder:** Migrationsskriptet importerar varje bild från Fyndplats CDN till nya sajtens mediabibliotek (`POST /site-media/v1/files/import`). Det tar tid (~2000+ bilder) men gör nya sajten självständig.
- **Kategorier:** v1:s `collections` blir v3:s `categories`. v3-kategorier är hierarkiska och ligger under ett separat `/categories/v1/`-namespace, inte under `/stores/v3/`.
