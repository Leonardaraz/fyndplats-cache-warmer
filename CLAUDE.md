@AGENTS.md

# Analytics

- **Vercel Web Analytics** (`@vercel/analytics/next`) and **Speed Insights**
  (`@vercel/speed-insights/next`) are mounted in `app/layout.tsx`. Both are
  cookie-free / privacy-friendly, so they render unconditionally (outside the
  `CookieConsent` gate) and require no GDPR consent. Beacons hit
  `/_vercel/insights/view` and `/_vercel/speed-insights/vitals`.
- **GA4** (`G-W6NZ87CX2Q`) also runs, loaded `lazyOnload` via `next/script`
  with a synchronous inline `gtag` stub. The two analytics stacks are
  independent.

# Meta Pixel + Conversions API (CAPI)

Facebook/Instagram-annonsspårning med **dubbel signal**: webbläsarens Pixel
(`fbq`) + server-side **Conversions API**. CAPI når fram även när iOS/Safari/
adblock blockerar Pixeln (~30–40 % av trafiken), och de två deduplicerar mot
varandra via en delad `event_id`.

### Filer
- `components/metapixel.tsx` — Pixel base-snippet (`fbq('init')` + `PageView`).
  Renderas från `app/layout.tsx` med `pixelId` ur `process.env.META_PIXEL_ID`.
  **Consent-gated**: laddas bara efter "Godkänn alla" (se nedan). Fyrar även
  `PageView` på SPA-navigeringar.
- `lib/meta.ts` — klientens `metaTrack()`: fyrar Pixel + POSTar `/api/meta/capi`
  med samma `event_id`. `keepalive` så InitiateCheckout överlever kassa-redirect.
- `lib/meta-capi.ts` — server-sändaren (delad). Hashar e-post/telefon med
  SHA-256, berikar med IP/UA, POSTar till Graph API.
- `app/api/meta/capi/route.ts` — POST-endpoint klienten anropar. `GET` =
  health-check (`{ configured: bool }`).
- `lib/analytics.ts` — fyrar Meta-event jämsides med GA4 (en enda källa).
- `app/api/wix-webhook/route.ts` — server-autoritativt **Purchase** vid
  `order_created` (med hashad kund-e-post/telefon), dedupat mot klientens
  `/tack`-Purchase via `event_id = purchase_<orderId>`.

### Event-mappning (Pixel + CAPI, delad event_id)
| Meta-event | Trigger | GA4-motsvarighet |
|---|---|---|
| `PageView` | varje sida (snippet + SPA-route) | — |
| `ViewContent` | PDP laddas | `view_item` |
| `AddToCart` | "Lägg i kundvagn" | `add_to_cart` |
| `InitiateCheckout` | "Till kassan" | `begin_checkout` |
| `Purchase` | `/tack` **+** Wix `order_created`-webhook | `purchase` |

**`AddPaymentInfo` saknas avsiktligt:** Klarna-steget körs inne i den
Wix-hostade kassan (`checkout.fyndplats.se`), som inte är denna kodbas. Det går
inte att instrumentera därifrån. Vill man ha eventet får det läggas via Wix egen
Pixel-/Custom-code-integration i kassan.

### Samtycke (GDPR)
Pixeln + CAPI fyrar **bara** när `localStorage.fp_cookie_consent === "all"`
(`lib/consent.ts`). Detta är striktare än GA4 (som körs ogated) — medvetet, då
annons-pixeln matchar besökaren mot ett Facebook-konto. `CookieConsent`
dispatchar `fp-consent-change` så Pixeln startar direkt vid "Godkänn alla", utan
sidladdning. Vill du köra ogated som GA4: ta bort `hasMarketingConsent()`-grinden
i `lib/meta.ts` + `components/metapixel.tsx`.

### Så här aktiverar du den (Leonard) — steg för steg
1. **Skapa Pixel/Dataset** i Meta Events Manager:
   <https://business.facebook.com/events_manager2/> → *Connect data sources* →
   *Web* → skapa en Pixel. Kopiera **Pixel-ID:t** (numerisk sträng).
2. **Generera CAPI-token**: i Events Manager → din Pixel → **Settings** →
   *Conversions API* → **Generate access token**. Kopiera token (visas en gång).
3. **Lägg in i Vercel** → projektet `fyndplats-headless` →
   *Settings → Environment Variables* (alla tre Environments: Production,
   Preview, Development):
   - `META_PIXEL_ID` = ditt Pixel-ID
   - `META_CAPI_ACCESS_TOKEN` = din CAPI-token
   - `META_TEST_EVENT_CODE` = (valfri) koden från Events Manager → *Test Events*
     — används bara utanför produktion.
   Redeploy:a efter att värdena sparats (env-ändringar slår igenom först vid ny
   deploy). Tills variablerna är ifyllda renderar Pixeln inget och CAPI svarar
   `{ skipped: "not_configured" }` — sajten fungerar oförändrat.
4. **Test Events**: Events Manager → din Pixel → **Test Events**. Sätt
   `META_TEST_EVENT_CODE` i Preview/Dev och surfa på en preview-deploy — events
   dyker upp i panelen i realtid. Verifiera att Pixel- och CAPI-raden för samma
   sidladdning **deduplicerar** (visas som *ett* event med "Deduplicated").
5. Health-check när som helst: `GET https://www.fyndplats.se/api/meta/capi`
   → `{ "configured": true }` när env är satt.

# Package manager

This repo has **both** `pnpm-lock.yaml` (v9) and `package-lock.json` committed.
The canonical manager is **pnpm** (Vercel detects `pnpm-lock.yaml` first, and
local `node_modules` carries pnpm's `.modules.yaml`). When adding deps: run
`pnpm add <pkg>`, then `npm install --package-lock-only` to keep
`package-lock.json` in sync. Don't `npm install` packages directly — it leaves
`pnpm-lock.yaml` stale and the dep won't install on deploy.
