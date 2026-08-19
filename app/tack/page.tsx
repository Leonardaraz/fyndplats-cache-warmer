import type { Metadata } from "next";
import { Suspense } from "react";
import { ThankYou } from "../../components/thankyou";
import { fetchWixOrderInfo } from "../../lib/wix-orders";
import { buildGcrConfig } from "../../lib/gcr";
import { GoogleCustomerReviewsOptIn } from "../../components/google-customer-reviews-optin";

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
  // Ett Wix-anrop ger både det läsbara ordernumret (t.ex. "10003") och det
  // Googles enkät kräver. Faller tillbaka på GUID:t i ThankYou om uppslaget
  // missar → fältet blir aldrig tomt.
  const info = orderId
    ? await fetchWixOrderInfo(orderId)
    : { number: null, email: null, deliveryCountry: null };

  // Google Customer Reviews: opt-in-dialogen som gör att Merchant Center kan
  // börja samla recensioner. buildGcrConfig returnerar null när ordern saknar
  // e-post eller giltigt land — då renderas ingen modul alls, hellre det än ett
  // halvt anrop som Google avvisar tyst.
  //
  // ORDER-ID:t som skickas till Google är det LÄSBARA numret när det finns.
  // Google visar order_id för kunden i enkätmejlet, och Wix interna GUID säger
  // kunden ingenting. Faller tillbaka på GUID:t så modulen inte tappas.
  const gcr = buildGcrConfig(
    {
      orderId: info.number || orderId,
      email: info.email ?? "",
      deliveryCountry: info.deliveryCountry ?? "",
    },
    new Date(),
  );

  return (
    <section className="sec tack-sec">
      <div className="container-narrow">
        <Suspense fallback={<div className="tack-loading">Laddar…</div>}>
          <ThankYou orderNumber={info.number} />
        </Suspense>
      </div>
      <GoogleCustomerReviewsOptIn config={gcr} />
    </section>
  );
}
