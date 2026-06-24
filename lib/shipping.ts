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
// Ändras leveranstiden: uppdatera DELIVERY_TIME här OCH kör
//   grep -rn "arbetsdagar" app lib
// för att fånga prosa-meningarna ovan.
export const DELIVERY_TIME = "3–7 arbetsdagar";
