// En signal som avbryter en hämtning efter en tidsgräns, också i Safari före iOS 16.
//
// AbortSignal.timeout finns först i Safari 16.0. I äldre Safari är den
// undefined, och ett anrop kastar då synkront. Står anropet i en effekt fäller
// det hela sidan till felsidan "Något gick fel".
//
// ☠️ Mätt på riktiga telefoner 2026-11-20 (BrowserStack): iPhone 12 med iOS 14.1
// och iPhone 13 med iOS 15.4 visade felsidan på varje sida, iPhone 14 med
// iOS 16.5 visade butiken. Felet kastades i lib/use-klarna-ruta.ts, som kom
// med Stripe-kassan 2026-11-06 och körs på varje sida. Samma fel var redan
// känt och antecknat i components/card-gallery.tsx, men ingenting hindrade
// nästa fil från att göra om det.
//
// Därför går all kod som kan hamna i webbläsaren genom den här funktionen, och
// lib/tidsgrans-signal.test.ts fäller om klientkod anropar AbortSignal.timeout
// själv.

export function tidsgransSignal(ms: number): AbortSignal | undefined {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") return AbortSignal.timeout(ms);
  // Äldre webbläsare: samma tidsgräns med AbortController. Hämtningen avbryts
  // då med AbortError i stället för TimeoutError.
  if (typeof AbortController !== "function") return undefined;
  const ctl = new AbortController();
  setTimeout(() => ctl.abort(), ms);
  return ctl.signal;
}
