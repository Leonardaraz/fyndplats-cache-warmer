"use client";
import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { CONSENT_EVENT, hasMarketingConsent } from "../lib/consent";

// Meta Pixel base-snippet. Renderas från app/layout.tsx med pixelId inläst
// server-side ur process.env.META_PIXEL_ID (icke-hemligt — syns ändå i sidans
// källkod). Allt gated på marknadssamtycke: Pixeln laddas BARA när användaren
// godkänt "alla" cookies (se lib/consent). PageView fyras automatiskt av
// snippeten + manuellt vid SPA-navigeringar (Next client-side routing fyrar
// annars bara den första sidvisningen).
export function MetaPixel({ pixelId }: { pixelId: string }) {
  const [enabled, setEnabled] = useState(false);
  const pathname = usePathname();
  const firstPath = useRef(true);

  // Aktivera så snart marknadssamtycke finns. Lyssnar på fp-consent-change
  // (dispatchas av cookieconsent.tsx) + storage (samtycke i annan flik) så att
  // ett klick på "Godkänn alla" startar Pixeln direkt utan sidladdning.
  useEffect(() => {
    const sync = () => setEnabled(hasMarketingConsent());
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CONSENT_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // Extra PageView vid varje route-byte EFTER att Pixeln laddats. Hoppar första
  // pathname-värdet — det täcks redan av fbq('track','PageView') i snippeten.
  useEffect(() => {
    if (!enabled) return;
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }
    const fbq = (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq;
    if (typeof fbq === "function") {
      try { fbq("track", "PageView"); } catch { /* svälj */ }
    }
  }, [pathname, enabled]);

  if (!enabled || !pixelId) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${pixelId}');
fbq('track','PageView');`}
      </Script>
      <noscript>
        {/* Plain <img> tracking-pixel — next/image vore fel här (1×1 beacon). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
