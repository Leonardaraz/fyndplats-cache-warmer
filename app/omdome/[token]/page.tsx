// app/omdome/[token]/page.tsx
//
// Sidan kunden landar på från leveransmejlet. Token i adressen bär orderns id
// och är HMAC-signerad — vi verifierar den här och visar bara produkterna som
// faktiskt ingick i just den ordern.
//
// Utan REVIEW_TOKEN_SECRET, med trasig token eller utan träff på ordern blir
// det 404. Ingen halvvägs-sida som antyder att något gick fel med köpet.

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { verifyReviewToken } from "../../../lib/review-token";
import { fetchWixOrder, buildOrderConfirmationProps } from "../../api/wix-webhook/route";
import { ReviewForm } from "../../../components/review-form";

export const dynamic = "force-dynamic";

// Formuläret hör inte hemma i Googles index — det är en privat länk.
export const metadata: Metadata = {
  title: "Lämna omdöme – Fyndplats",
  robots: { index: false, follow: false },
};

interface Vara {
  productId: string;
  name: string;
  imageUrl?: string;
  variant?: string;
}

export default async function OmdomeSida({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const verifierad = verifyReviewToken(token, process.env.REVIEW_TOKEN_SECRET);
  if (!verifierad) notFound();

  const order = await fetchWixOrder(verifierad.orderId);
  if (!order) notFound();
  const props = buildOrderConfirmationProps(order);

  // Produkt-id:t sitter i catalogReference, inte i mejlraderna — vi parar ihop
  // dem i ordning så att formuläret kan skicka rätt id per produkt.
  const rader = (order.lineItems ?? []) as Record<string, unknown>[];
  const varor: Vara[] = rader
    .map((li, i) => ({
      productId: String((li.catalogReference as Record<string, unknown> | undefined)?.catalogItemId ?? ""),
      name: props?.items?.[i]?.name ?? String((li.productName as Record<string, unknown> | undefined)?.original ?? "Produkt"),
      imageUrl: props?.items?.[i]?.imageUrl,
      variant: props?.items?.[i]?.variant,
    }))
    .filter((v) => v.productId);

  if (varor.length === 0) notFound();

  return (
    <section className="sec">
      <div className="container" style={{ maxWidth: 720 }}>
        <div className="sechead">
          <div className="eyebrow">Tack för ditt köp</div>
          <h1>Vad tyckte du?</h1>
        </div>
        <p style={{ color: "var(--soft)", marginTop: -8 }}>
          Ditt omdöme hjälper nästa kund att välja rätt. Vi läser alla innan de publiceras,
          och visar bara dina initialer – aldrig hela namnet.
          {props?.orderNumber ? <> Order {props.orderNumber}.</> : null}
        </p>

        <ReviewForm token={token} varor={varor} />
      </div>
    </section>
  );
}
