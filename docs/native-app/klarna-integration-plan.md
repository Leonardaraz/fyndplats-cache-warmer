# Klarna native checkout — implementeringsplan (Fyndplats-appen)

> **Status:** RESEARCH / PLAN. Ingen kod implementerad. Ligger i
> `fyndplats-headless` tills `fyndplats-app`-repot finns — flyttas dit sedan.
> **Datum:** 2026-06-02. **Stack:** Expo (React Native) + Wix Stores headless +
> Klarna.

---

## 0. TL;DR + paketnamn-korrigering (läs först)

- **Paketnamnet i uppgiften är fel.** Det finns **inget** npm-paket som heter
  `react-native-klarna-mobile-sdk`. Klarnas officiella React Native-wrapper
  heter **`react-native-klarna-inapp-sdk`**. "Klarna Mobile SDK" är namnet på
  det *underliggande native-SDK:t* (iOS/Android); npm-wrappern bär `-inapp-`-namnet.
  - Senaste version: **`react-native-klarna-inapp-sdk@2.5.0`** (släppt 2025-03-31).
  - Repo: <https://github.com/klarna/react-native-klarna-inapp-sdk>
  - Kräver **development build** (native-moduler) → **Expo Go fungerar inte**.

- **Den stora arkitektur-insikten:** Vi använder **Wix-hostad checkout** (Wix
  Payments hanterar Klarna-avtalet). Det betyder att vägen med minst friktion är
  **inte** Klarnas native-SDK utan en **WebView av Wix-managed checkout-URL**
  (där Klarna redan är inkopplat som betalmetod via Wix Payments). Klarnas
  native-SDK kräver att *vi själva* har ett Klarna-handlaravtal och skapar
  Klarna-sessioner server-side (`client_token`) — vilket dubblerar det Wix redan
  gör och kringgår Wix orderhantering. Se **§7 Risker** — detta är den viktigaste
  beslutspunkten.

- **Rekommendation:** Bygg **Flow A (WebView av Wix-checkout)** först — den ger
  100 % av betalfunktionaliteten på vecka 2, återanvänder hela vår befintliga
  webhook-/mejl-/Meta-CAPI-pipeline oförändrat, och kräver inget Klarna-SDK alls.
  Behåll **Flow B (native Klarna-SDK)** som en senare UX-uppgradering *bara om*
  vi skaffar ett direkt Klarna-handlaravtal.

---

## 1. Klarna React Native SDK

| Fält | Värde |
|---|---|
| npm-paket | `react-native-klarna-inapp-sdk` |
| Senaste version | `2.5.0` (2025-03-31) |
| Underliggande | Klarna Mobile SDK (native iOS/Android) |
| Repo / docs | github.com/klarna/react-native-klarna-inapp-sdk · docs.klarna.com/mobile-sdk/ |
| Expo Go | ❌ Stöds inte (innehåller native-kod) |
| Expo dev build | ✅ Krävs (`expo-dev-client` + EAS build / prebuild) |

### Expo-kompatibilitet (viktigt)

`react-native-klarna-inapp-sdk` är en **native-modul** — den länkar in Klarnas
iOS- och Android-SDK. Konsekvenser för Expo:

1. **Expo Go kan aldrig köra den.** Expo Go är en förbyggd app med en fast
   uppsättning native-moduler; Klarna ingår inte.
2. Du måste köra en **development build** (`npx expo run:ios` / `run:android`
   lokalt, eller en EAS-build) med `expo-dev-client` installerat.
3. SDK:t har **ingen officiell Expo config-plugin**. Två vägar:
   - **Continuous Native Generation (prebuild):** lägg paketet i `package.json`,
     kör `npx expo prebuild`, och låt autolinking koppla in det. För Android kan
     du behöva lägga Klarnas Maven-repo i `android/build.gradle` via
     `expo-build-properties`-pluginen (se §8). För nyare RN (≥0.59) är 3:e-parts
     Gradle-repo:n ett känt friktionsmoment.
   - **Egen config-plugin:** skriv en liten plugin som injicerar Gradle-repo +
     ev. iOS-pods. Mer jobb, men reproducerbart i CI (EAS).
4. iOS: kräver att pods installeras (`npx pod-install`) — sker automatiskt i
   prebuild/EAS.

> **Slutsats:** Minst **en EAS development build** behövs innan rad ett av
> Klarna-kod kan testas på riktig enhet. Planera in det vecka 1 (§6).

---

## 2. De två betalflödena

### Flow A — Wix-hostad checkout i WebView ⭐ (rekommenderad start)

```
App  → skapa Wix-checkout (REST)  → få redirect-URL  → öppna i WebView
WebView visar Wix-managed checkout (Klarna redan inkopplat via Wix Payments)
Kund betalar med Klarna inne i Wix HPP  → success-redirect  → app fångar URL
```

- **Snabbast att integrera.** Identisk UX som webben (`checkout.fyndplats.se`).
- **Inget Klarna-SDK krävs** — Klarna körs inuti Wix Hosted Payment Page.
- Återanvänder vår **befintliga `order_created`-webhook** (mejl + Meta-CAPI +
  order-spegling) helt oförändrat — Wix äger betalningen, så samma signal som idag.
- Implementeras med `react-native-webview` + en URL-lyssnare som fångar
  success/`thankYouPageUrl`.
- **Nackdel:** WebView, inte 100 % native-känsla. Men Wix-checkouten är
  mobiloptimerad och Klarna-knappen i den är Klarnas egen.

### Flow B — Klarna Payments native (in-app `react-native-klarna-inapp-sdk`)

```
App  → (backend skapar Klarna-session, får client_token)
App  → KlarnaPaymentView renderas inline  → kund auktoriserar  → authorization_token
App  → backend: skapa/aktivera order mot Klarna + Wix
```

- **Mest native-känsla** — Klarna-betalknapp/-widget renderas inline i appen
  (`KlarnaPaymentView`), öppnar Klarna-appen/-webben vid auktorisering.
- **Kräver ett `client_token` från en Klarna Payments-session.** Det skapas via
  Klarnas Payments API server-side **med VÅRA Klarna-handlarcredentials** —
  inte Wix. Se **§3.4 + §7** för varför detta är den stora hake:n.
- Lämplig **endast** om vi skaffar direkt Klarna-handlaravtal och tar över
  betal-/orderhanteringen från Wix (stor förändring).

> **Beslut:** Leverera A nu. B är en framtida uppgradering bakom ett
> handlaravtals-beslut, inte ett vecka-1-åtagande.

---

## 3. Wix Stores headless checkout-API

All auth som i `lib/wix-client.ts`: header `Authorization: <WIX_API_KEY>` +
`wix-site-id: <WIX_SITE_ID>`. Bas-URL `https://www.wixapis.com`.

### 3.1 Skapa checkout

**`POST https://www.wixapis.com/ecom/v1/checkouts`**

Nyckelfält i body:
- `lineItems[]` — varje rad med `catalogReference` + `quantity`.
  - `catalogReference.appId` = **`215238eb-22a5-4c36-9e7b-e7c08025e04e`**
    (Wix Stores' fasta app-ID — samma värde vi redan ser i webhookens
    `extractContentIds`/`catalogReference`).
  - `catalogReference.catalogItemId` = **productId** (för en variant läggs
    `options.variantId` i `catalogReference.options`).
- `channelType` — sätt `"BACKEND"` (eller `"WEB"`) för headless-anrop.
- `checkoutInfo` — valfri kund-/custom-field-data.
- `billingInfo` / `shippingInfo` — adress + kontakt (kan fyllas av kunden i HPP).

**Payload-exempel:**

```jsonc
// POST https://www.wixapis.com/ecom/v1/checkouts
{
  "channelType": "BACKEND",
  "lineItems": [
    {
      "quantity": 1,
      "catalogReference": {
        "appId": "215238eb-22a5-4c36-9e7b-e7c08025e04e",
        "catalogItemId": "<productId>",
        "options": { "variantId": "<variantId>" }   // utelämna om ingen variant
      }
    }
  ],
  "checkoutInfo": {
    "buyerInfo": { "email": "kund@example.com" },
    "buyerLanguage": "sv"
  }
}
```

**Svar (förkortat):**

```jsonc
{
  "checkout": {
    "id": "<checkoutId>",
    "lineItems": [ /* ... */ ],
    "priceSummary": { "total": { "amount": "199.00", "currency": "SEK" } },
    "payNow": { /* ... */ }
  }
}
```

> Alternativ: **`POST /ecom/v1/checkouts/{id}` → Add To Checkout** för att lägga
> till fler rader, och **`createCheckoutFromCurrentCart()`** (SDK) om vi väljer
> att spegla en Wix-cart. För appen är det enklast att bygga checkouten direkt
> från app-cartens rader (vi äger cart-staten lokalt i appen).

### 3.2 Skapa redirect-session (→ hosted checkout-URL)

**`POST https://www.wixapis.com/_api/redirects-api/v1/redirect-session`**

Detta är samma mekanism storefronten redan använder (se memory
[[checkout-flow]]): ge den `checkoutId`, få tillbaka en **Wix-managed
checkout-URL** som vi laddar i WebView:en.

```jsonc
// POST .../v1/redirect-session
{
  "ecomCheckout": { "checkoutId": "<checkoutId>" },
  "callbacks": {
    "postFlowUrl": "https://www.fyndplats.se/tack",       // dit Wix skickar efter köp
    "thankYouPageUrl": "https://www.fyndplats.se/tack",
    "cartPageUrl": "https://www.fyndplats.se/kundvagn"
  }
}
```

**Svar:**

```jsonc
{
  "redirectSession": {
    "fullUrl": "https://checkout.fyndplats.se/...",   // <-- ladda denna i WebView
    "sessionToken": "..."
  }
}
```

> I appen byter vi `postFlowUrl` mot en **deep link** (t.ex.
> `fyndplats://order-complete?orderId=...`) eller en känd success-path som
> WebView-lyssnaren kan upptäcka för att stänga WebView:en och visa
> bekräftelse-screen. Se §4.

### 3.3 Hur Klarna kopplas in

**Klarna är redan inkopplat på Wix-sidan** via Wix Payments → "Adding Klarna as
a Payment Method". I Flow A behöver appen alltså **inte** röra Klarnas API alls:
Klarna dyker upp som betalmetod inuti Wix Hosted Payment Page som WebView:en
visar. Misslyckas Klarna i Wix HPP promptas kunden att välja annan metod — Wix
sköter det.

**Checklista (Leonard, i Wix-admin):** verifiera att Klarna är aktiverat under
*Wix Payments → Payment Methods → Klarna* för site `e6d27e90-…`. Utan det visas
ingen Klarna-knapp i HPP.

### 3.4 (Endast Flow B) direkt Klarna Payments-session

Native-SDK:t kräver ett `client_token` från en **Klarna Payments-session**:

**`POST https://api.klarna.com/payments/v1/sessions`** (Klarna, *inte* Wix) med
Basic-auth av VÅR Klarna-`username:password`. Svar innehåller `client_token` som
matas till `KlarnaPaymentView`. Efter auktorisering får appen ett
`authorization_token` som måste *placeras* till en order
(`POST /payments/v1/authorizations/{authToken}/order`).

> Detta är en **parallell betalstack** till Wix. Det innebär att Wix inte längre
> äger betalningen → `order_created`-webhooken triggas inte automatiskt → vi
> måste själva skapa Wix-ordern (`POST /ecom/v1/orders`) och själva trigga vår
> mejl/CAPI-pipeline. Stor merkostnad. Därför: Flow A först.

---

## 4. Flow-diagram (Flow A — rekommenderad)

```
┌─────────────┐   1. Lägg i kundvagn (lokal app-state)
│  Fyndplats  │
│     App     │   2. Tryck "Till kassan"
└──────┬──────┘
       │ 3. POST /ecom/v1/checkouts        (vår backend-proxy → Wix)
       │    body: lineItems[catalogReference]
       ▼
┌─────────────┐   → { checkout.id }
│  Vår API    │ 4. POST /redirect-session  (checkoutId, postFlowUrl=deep link)
│  (proxy)    │   → { redirectSession.fullUrl }
└──────┬──────┘
       │ 5. fullUrl
       ▼
┌─────────────┐   6. <WebView source={{ uri: fullUrl }} />
│  WebView    │      Kund väljer Klarna i Wix HPP → betalar
│ (Wix HPP +  │
│   Klarna)   │   7. Wix redirectar till postFlowUrl / thankYouPageUrl
└──────┬──────┘      onNavigationStateChange fångar success-URL
       │ 8. stäng WebView, visa "Tack"-screen i appen
       ▼
┌─────────────┐
│  Wix server │ 9. order_created-webhook  →  app/api/wix-webhook/route.ts
└──────┬──────┘      (OFÖRÄNDRAD: orderbekräftelse-mejl + Meta-CAPI Purchase
       │             + order-spegling till Postgres)
       │ 10. (nytt) push-notis till appen via Expo Push
       ▼
   Kund får: in-app bekräftelse + mejl + push
```

**Push-notisen (steg 10)** är det enda nya server-sidiga: i webhookens
`order_created`-gren, efter mejlet, slå upp kundens Expo push-token (ny tabell
`device_tokens(email, expo_token)`) och POSTa till Expo Push API. Faller utanför
denna plan men kroken finns redan på rätt ställe (`fireMetaPurchase`-mönstret i
`route.ts:619`).

---

## 5. Webhook-koppling (återanvänds oförändrad)

När Klarna bekräftar betalningen inuti Wix HPP skapar **Wix** ordern och fyrar
`order_created`. Vår befintliga handler (`app/api/wix-webhook/route.ts`) gör
redan exakt rätt:

1. `classify()` → `order_created` (`route.ts:436`).
2. `onWixOrderCreatedForAbandonedCart` — avbryter ev. abandoned-cart-flöde.
3. `recordOrder` — speglar ordern till Postgres (morgon-dashboard).
4. Orderbekräftelse-mejl via Resend.
5. `fireMetaPurchase` — server-autoritativ Meta Purchase (CAPI), dedupad mot
   klientens `/tack`-Purchase via `purchase_<GUID>`.

**Enda tillägget för appen:** steg "push-notis". Allt annat fungerar identiskt
oavsett om köpet kom från webben eller appens WebView, eftersom betalningen i
båda fallen sker i Wix HPP. **Detta är hela poängen med Flow A** — noll
duplicering av order-/mejl-/spårningslogik.

> Flow B skulle kräva att vi *själva* skapar Wix-ordern efter Klarna-auktorisering
> och därmed riskerar att antingen missa eller dubblera `order_created` — ännu en
> anledning att börja med A.

---

## 6. Implementationsplan (fas för fas)

### Vecka 1 — Klarna SDK + dev build grund
- [ ] Skapa `fyndplats-app` (Expo, TypeScript, `expo-router`).
- [ ] `npx expo install expo-dev-client`.
- [ ] `pnpm add react-native-klarna-inapp-sdk@2.5.0` (+ `expo-build-properties`).
- [ ] `npx expo prebuild` → lös Android Maven-repo för Klarna (§8).
- [ ] **Första EAS development build** (iOS + Android) — bevisa att appen
      startar med native Klarna-modulen länkad.
- [ ] Dummy-test: rendera en tom `KlarnaPaymentView` (Flow B-spik) **eller**
      en `react-native-webview` med en statisk URL (Flow A-spik) i dev build.
- **Mål:** native build som inkluderar Klarna-modulen kör på riktig enhet.

### Vecka 2 — Wix checkout-skapande från appen
- [ ] Backend-proxy-route (i `fyndplats-headless`) `POST /api/app/checkout`:
      tar app-cartens rader → `POST /ecom/v1/checkouts` → `redirect-session` →
      returnerar `fullUrl`. (Håller `WIX_API_KEY` server-side, aldrig i appen.)
- [ ] App: "Till kassan"-knapp → anropa proxyn → öppna `fullUrl` i WebView.
- [ ] WebView-lyssnare som fångar success-URL och stänger.
- **Mål:** Flow A fungerar end-to-end mot Wix **sandbox/testbutik**.

### Vecka 3 — End-to-end i testmiljö
- [ ] Klarna **sandbox/playground** aktiverat i Wix testbutik.
- [ ] Genomför testköp hela vägen: app → WebView → Klarna sandbox → success.
- [ ] Verifiera att `order_created`-webhooken fyrar → mejl + Meta-CAPI +
      order-spegling (samma testplan som [[meta-pixel-capi]] men trigga från app).
- [ ] (Om Flow B byggs) Klarna sandbox-session + `KlarnaPaymentView`-auktorisering.
- **Mål:** ett testköp ger orderbekräftelse-mejl + speglad order + Meta-event.

### Vecka 4 — Polish + plattformstester
- [ ] Expo Push: `device_tokens`-tabell + push i webhookens `order_created`-gren.
- [ ] iOS + Android: testa WebView-tillbaka-navigering, deep-link-fångst,
      avbrutet köp, nätfel.
- [ ] **Apple-granskning:** bekräfta att fysiska varor → Klarna är OK (ej IAP, §7).
- [ ] Felhantering: timeout/avbruten WebView → tillbaka till cart utan dubbelorder.
- **Mål:** release-kandidat redo för TestFlight / internal track.

---

## 7. Risker

| # | Risk | Åtgärd |
|---|---|---|
| 1 | **Native build krävs** — Expo Go funkar inte med Klarna-SDK. | Minst en EAS dev build planerad vecka 1. `expo-dev-client` från dag ett. |
| 2 | **Flow B kräver eget Klarna-handlaravtal** — Klarnas native-SDK behöver `client_token` från VÅR Klarna Payments-session, men idag äger **Wix** Klarna-avtalet. Att gå native dubblerar betalstacken och kringgår `order_created`. | **Börja med Flow A (WebView)** där Wix äger Klarna. Lyft Flow B bara om vi skaffar direkt Klarna-avtal. |
| 3 | **Wix headless-doc tunn för Klarna specifikt** — Klarna nämns som Wix-betalmetod, inte i headless-checkout-doc:en. | Flow A behöver inte Klarna-API:t alls (Klarna lever i Wix HPP). Risken neutraliseras av A. |
| 4 | **Apple IAP-regel** — digitala varor måste gå via Apple IAP. | Fyndplats säljer **fysiska varor** → Klarna/extern betalning är **tillåtet** (Apple Guideline 3.1.3(e)/3.1.5). Dokumentera varukatalogen som fysisk vid granskning. |
| 5 | **Android Gradle 3:e-parts Maven-repo** (RN ≥0.59) för Klarna-SDK. | `expo-build-properties`-plugin som lägger Klarnas Maven-URL i prebuild; verifieras i vecka-1-build. |
| 6 | **WIX_API_KEY får aldrig ligga i appen.** | All Wix-checkout går via vår server-proxy (`/api/app/checkout`). Appen ser bara `fullUrl`. |
| 7 | **Dubbelorder vid WebView-retry/avbrott.** | Idempotens: en checkout = en `checkoutId`; success-URL-fångst innan vi skapar ny checkout. Webhookens order-spegling är redan idempotent. |

---

## 8. Dependencies (`fyndplats-app/package.json`)

```jsonc
{
  "dependencies": {
    "expo": "*",
    "expo-dev-client": "*",                    // native dev build (Klarna kräver det)
    "expo-router": "*",
    "react-native-webview": "*",               // Flow A: Wix HPP i WebView
    "react-native-klarna-inapp-sdk": "2.5.0",  // Flow B: native Klarna (senare)
    "expo-notifications": "*"                   // push-notis vid order_created
  },
  "devDependencies": {
    "expo-build-properties": "*"               // injicera Klarnas Android Maven-repo
  }
}
```

> Pakethanterare: följ repo-konventionen — `pnpm add <pkg>` och håll
> `package-lock.json` i synk (se CLAUDE.md "Package manager"). `@latest` för
> Expo-paketen via `npx expo install` så de matchar SDK-versionen; pinna Klarna
> till `2.5.0`.

### Minimalt React Native-kodexempel

**Flow A — Wix-checkout i WebView (rekommenderad):**

```tsx
// app/checkout.tsx
import { WebView, type WebViewNavigation } from "react-native-webview";
import { useRouter } from "expo-router";

export default function CheckoutScreen({ checkoutUrl }: { checkoutUrl: string }) {
  const router = useRouter();

  // Wix redirectar till postFlowUrl när Klarna-betalningen lyckats.
  function onNav(state: WebViewNavigation) {
    if (state.url.includes("/tack") || state.url.startsWith("fyndplats://order-complete")) {
      router.replace("/order-confirmed"); // stäng WebView, visa app-bekräftelse
    }
  }

  return (
    <WebView
      source={{ uri: checkoutUrl }}        // redirectSession.fullUrl från vår proxy
      onNavigationStateChange={onNav}
      // Klarna körs INUTI denna WebView (Wix HPP) — inget Klarna-SDK behövs.
    />
  );
}
```

```ts
// Hämta checkout-URL från vår server-proxy (håller WIX_API_KEY hemlig)
async function startCheckout(cart: CartLine[]): Promise<string> {
  const res = await fetch("https://www.fyndplats.se/api/app/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lineItems: cart }), // [{ catalogItemId, variantId?, quantity }]
  });
  const { fullUrl } = await res.json();
  return fullUrl; // skickas till <CheckoutScreen checkoutUrl={fullUrl} />
}
```

**Flow B — native Klarna Payments (framtida, kräver Klarna-avtal):**

```tsx
// Kräver client_token från en Klarna Payments-session (skapas server-side).
import {
  KlarnaPaymentView,
  KlarnaPaymentCategory,
} from "react-native-klarna-inapp-sdk";
import { useRef } from "react";

export function KlarnaNative({ clientToken }: { clientToken: string }) {
  const ref = useRef<KlarnaPaymentView>(null);

  return (
    <KlarnaPaymentView
      ref={ref}
      category={KlarnaPaymentCategory.PAY_LATER}
      onInitialized={() => ref.current?.load()}
      onAuthorized={(e) => {
        if (e.nativeEvent.authToken) {
          // skicka authToken till backend → placera order mot Klarna + Wix
        }
      }}
      // client_token sätts via ref.current?.initialize(clientToken) efter mount
    />
  );
}
```

### Server-proxy (skiss, ligger i `fyndplats-headless`)

```ts
// app/api/app/checkout/route.ts  (NY — ej implementerad i denna plan)
import { wixFetch } from "@/lib/wix-client";

const WIX_STORES_APP_ID = "215238eb-22a5-4c36-9e7b-e7c08025e04e";

export async function POST(req: Request) {
  const { lineItems } = await req.json(); // [{ catalogItemId, variantId?, quantity }]

  const { checkout } = await wixFetch<{ checkout: { id: string } }>({
    method: "POST",
    path: "/ecom/v1/checkouts",
    body: {
      channelType: "BACKEND",
      lineItems: lineItems.map((l: any) => ({
        quantity: l.quantity,
        catalogReference: {
          appId: WIX_STORES_APP_ID,
          catalogItemId: l.catalogItemId,
          ...(l.variantId ? { options: { variantId: l.variantId } } : {}),
        },
      })),
    },
  });

  const { redirectSession } = await wixFetch<{ redirectSession: { fullUrl: string } }>({
    method: "POST",
    path: "/_api/redirects-api/v1/redirect-session",
    body: {
      ecomCheckout: { checkoutId: checkout.id },
      callbacks: { postFlowUrl: "https://www.fyndplats.se/tack" },
    },
  });

  return Response.json({ fullUrl: redirectSession.fullUrl });
}
```

---

## 9. Total estimerad utvecklingstid

| Omfattning | Estimat |
|---|---|
| **Flow A enbart (rekommenderad MVP)** | **~2–3 veckor** (vecka 1 dev-build-grund + vecka 2 checkout-proxy & WebView + halva vecka 3 e2e-test). Push-notis +2–3 dagar. |
| **+ Flow B (native Klarna)** | **+2–3 veckor** ovanpå, **plus** ledtid för Klarna-handlaravtal (extern, kan vara veckor). |
| **Full plan som skriven (4 veckor)** | Realistisk om Flow A levereras hårt och Flow B endast spikas/utvärderas, inte produktionssätts. |

> **Rekommenderad leverans:** Flow A i produktion på ~3 veckor, native Klarna
> (Flow B) som separat senare epik villkorad av direkt Klarna-avtal.

---

## Källor

- Wix — Create Checkout (REST): <https://dev.wix.com/docs/rest/business-solutions/e-commerce/checkout/create-checkout>
- Wix — Add To Checkout (REST): <https://dev.wix.com/docs/rest/business-solutions/e-commerce/checkout/add-to-checkout>
- Wix — Create Redirect Session (SDK): <https://dev.wix.com/docs/sdk/backend-modules/redirects/redirects/create-redirect-session>
- Wix — eCommerce Quick Start (headless): <https://dev.wix.com/docs/go-headless/get-started/tutorials/self-managed-headless/java-script-sdk-tutorials/e-commerce-quick-start>
- Wix — Stores eCommerce Integration (catalogReference/appId): <https://dev.wix.com/docs/rest/business-solutions/stores/catalog/e-commerce-integration>
- Klarna RN SDK (repo): <https://github.com/klarna/react-native-klarna-inapp-sdk>
- Klarna RN SDK (npm, v2.5.0): <https://www.npmjs.com/package/react-native-klarna-inapp-sdk>
- Klarna ↔ Wix Payments: <https://support.wix.com/en/article/wix-payments-adding-klarna-as-a-payment-method>
- Klarna docs — Wix platform: <https://docs.klarna.com/platform-solutions/e-commerce-platforms/wix/payments/installing-klarna-payments-on-wix/>
</content>
</invoke>
