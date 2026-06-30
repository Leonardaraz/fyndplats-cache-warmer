// lib/shipping.ts
// Single source of truth för Fyndplats leveranslöfte (EU-lager).
//
// RÖD TRÅD: leveranstiden ska se LIKADAN ut överallt. De dynamiska UI-/mejl-
// ytorna importerar konstanten nedan och hålls därför alltid i synk automatiskt:
//   • produktsidans trust-rad (components/productview.tsx) — syns på VARJE produkt
//   • spårnings-ETA-fallback (components/tracking.tsx)
//   • admin-mejltestet (app/api/admin/email-test/route.ts)
//
// De REDAKTIONELLA prosa-meningarna (informationssidor, kategori-FAQ och de
// programmatiska SEO-mallarna) skriver medvetet ut "3–7 arbetsdagar" i naturlig,
// varierad text för läsbarhet/SEO — de kan inte rimligt interpoleras utan att copy
// och variation blir lidande: app/kopvillkor, app/vanliga-fragor, app/kundtjanst,
// app/omoss, app/anvandarvillkor-app, lib/category-content.ts,
// lib/seo/programmatic-templates.ts.
//
// Ändras leveranstiden: uppdatera dagarna nedan här OCH kör
//   grep -rn "arbetsdagar" app lib
// för att fånga prosa-meningarna ovan.
//
// Leveransfönstret i arbetsdagar (mån–fre). DELIVERY_TIME härleds ur dem så att
// fras + konkret datumintervall (components/delivery-estimate.tsx) ALLTID stämmer
// överens — ändra bara siffrorna.
export const DELIVERY_MIN_DAYS = 3;
export const DELIVERY_MAX_DAYS = 7;
export const DELIVERY_TIME = `${DELIVERY_MIN_DAYS}–${DELIVERY_MAX_DAYS} arbetsdagar`;

// EU-lager-trygghet (single source of truth). Alla produkter skickas från lager INOM EU →
// kunden drabbas inte av EU:s nya importtull/förtullningsavgift (1 juli 2026) på paket utifrån
// EU. ÄRLIGT avgränsat: gäller importtull/förtullning — moms (25 %) ingår alltid i priset och
// "pratas aldrig bort"; täcker inte ev. fraktavgift under fri-frakt-gränsen eller returfrakt.
export const EU_STOCK_NOTE = "Skickas från EU-lager – ingen importtull eller förtullningsavgift.";
export const EU_STOCK_NOTE_SHORT = "Skickas från EU-lager – ingen importtull tillkommer.";
