// lib/admin-links.ts
//
// Deeplänkar från admin till de två ställen man faktiskt vill komma:
// kundens vy (butikssidan) och redigeringsvyn (Wix-dashboarden).
//
// VARFÖR EN EGEN MODUL: länkarna fanns i tre kopior som hunnit driva isär, och
// två av dem var fel.
//
//   app/admin/sync-alerts/page.tsx   fpUrl()      — rätt
//   lib/import/duplicate-check.ts    dashboardUrl() — fel SITE-ID
//   app/admin/profitability/…        editorUrl    — fel SÖKVÄG
//
// Site-id:t är den vanligaste fällan. `WIX_SITE_ID` pekar på GAMLA Fyndplats
// där CMS-collectionerna (FyndplatsMappings m.fl.) lever. Produkterna ligger i
// V3-katalogen på HEADLESS-sajten, som har sitt eget id. En dashboard-länk
// byggd på fel id landar på fel sajt.
//
// Samma lärdom som SHIP_AXIS_RE och EU-listorna: kopior av en sträng som måste
// stämma driver isär, och ingen märker det förrän någon klickar.

/** Headless-sajtens metaSiteId — samma id som Wix Data/V3-anropen använder. */
const DEFAULT_HEADLESS_SITE_ID = "e6d27e90-4749-4720-9afe-0bbe91c1b3d3";

export function headlessSiteId(): string {
  return process.env.HEADLESS_WIX_SITE_ID || DEFAULT_HEADLESS_SITE_ID;
}

/**
 * Butikssidan för kunden. Basen är override:bar för att den skiljer sig mellan
 * preview och produktion (och för att domänen en gång bytts).
 */
export function storeProductBase(): string {
  return (process.env.STORE_PRODUCT_BASE_URL ?? "https://www.fyndplats.se/produkt").replace(/\/$/, "");
}

/** Live-sidan för en produkt. Tom sträng när slugen saknas — länken utelämnas då. */
export function storeProductUrl(slug: string | undefined | null): string {
  const s = String(slug ?? "").trim();
  return s ? `${storeProductBase()}/${encodeURIComponent(s)}` : "";
}

/**
 * Produktens redigeringsvy i Wix-dashboarden.
 *
 * Sökvägen är override:bar via `WIX_DASHBOARD_PRODUCT_BASE` — Wix har flyttat
 * butiksvyerna mer än en gång, och den dagen de gör det igen ska det vara en
 * env-variabel att ändra, inte en utrullning.
 */
export function wixProductEditBase(): string {
  const custom = process.env.WIX_DASHBOARD_PRODUCT_BASE;
  if (custom) return custom.replace(/\/$/, "");
  return `https://manage.wix.com/dashboard/${headlessSiteId()}/store/products/product`;
}

export function wixProductEditUrl(wixProductId: string | undefined | null): string {
  const id = String(wixProductId ?? "").trim();
  return id ? `${wixProductEditBase()}/${encodeURIComponent(id)}` : "";
}

/** AliExpress-listningen. Här för att alla tre länkarna ska bo ihop. */
export function aliExpressItemUrl(supplierProductId: string | undefined | null): string {
  const id = String(supplierProductId ?? "").trim();
  return id ? `https://www.aliexpress.com/item/${encodeURIComponent(id)}.html` : "";
}
