import type { Metadata } from "next";
import { Suspense } from "react";
import { ThankYou } from "../../components/thankyou";
import { fetchWixOrderNumber } from "../../lib/wix-orders";

export const metadata: Metadata = {
  title: "Tack för din beställning",
  description: "Tack för din beställning hos Fyndplats. Vi har tagit emot ditt köp och börjar förbereda paketet.",
  alternates: { canonical: "https://www.fyndplats.se/tack" },
  robots: { index: false, follow: true }, // privat confirmation-sida — ska inte indexeras
};

// Per-order + Wix-uppslag → får aldrig cachas statiskt.
export const dynamic = "force-dynamic";

export default async function Tack({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const pick = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  // Wix headless redirectar med orderns interna _id (GUID) i ?orderId. Olika
  // Wix-versioner använt olika param-namn → prova flera defensivt.
  const orderId = pick(sp.orderId) || pick(sp.orderNumber) || pick(sp.order) || pick(sp.orderID) || "";
  // Slå upp det läsbara ordernumret (t.ex. "10003") server-side. Faller tillbaka
  // på GUID:t i ThankYou om uppslaget missar → fältet blir aldrig tomt.
  const orderNumber = orderId ? await fetchWixOrderNumber(orderId) : null;

  return (
    <section className="sec tack-sec">
      <div className="container-narrow">
        <Suspense fallback={<div className="tack-loading">Laddar…</div>}>
          <ThankYou orderNumber={orderNumber} />
        </Suspense>
      </div>
    </section>
  );
}
