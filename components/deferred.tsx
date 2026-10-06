"use client";
/**
 * Round-2 perf split (commit perf round 2): each component below renders
 * either below the fold, only after scroll, or only after user interaction.
 * Pulling them out of the main bundle via next/dynamic with ssr:false +
 * loading:()=>null shaves them off initial JS and lets the browser hit FCP/LCP
 * without parsing their JS first. They mount client-side once idle.
 *
 * Drawers (cart, wishlist) stay closed by default — losing their DOM from the
 * SSR'd HTML is invisible. BackToTop doesn't render meaningful markup until
 * scroll. CookieConsent only renders on first visit (consent
 * unset) and the small delay before it appears is acceptable.
 *
 * Why ssr:false: in addition to chunk-splitting, this means none of these
 * components' code paths run on the server either, so we don't pay for their
 * render in the streamed HTML. The chunks load after hydration during idle.
 */
import dynamic from "next/dynamic";

export const BackToTop = dynamic(
  () => import("./backtotop").then((m) => m.BackToTop),
  { ssr: false, loading: () => null },
);

export const CookieConsent = dynamic(
  () => import("./cookieconsent").then((m) => m.CookieConsent),
  { ssr: false, loading: () => null },
);

export const CartDrawer = dynamic(
  () => import("./cart").then((m) => m.CartDrawer),
  { ssr: false, loading: () => null },
);

export const WishlistDrawer = dynamic(
  () => import("./wishlist").then((m) => m.WishlistDrawer),
  { ssr: false, loading: () => null },
);

// Tar bort Googles ?srsltid= ur adressfältet när taggen är klar med den
// (lib/srsltid.ts). Den har ingen markup och väntar ändå på gtag.js, som
// laddas med lazyOnload, så den behöver inte ligga i första bunten.
export const RensaSrsltid = dynamic(
  () => import("./rensa-srsltid").then((m) => m.RensaSrsltid),
  { ssr: false, loading: () => null },
);
