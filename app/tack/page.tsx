import type { Metadata } from "next";
import { Suspense } from "react";
import { ThankYou } from "../../components/thankyou";

export const metadata: Metadata = {
  title: "Tack för din beställning",
  description: "Tack för din beställning hos Fyndplats. Vi har tagit emot ditt köp och börjar förbereda paketet.",
  alternates: { canonical: "https://www.fyndplats.se/tack" },
  robots: { index: false, follow: true }, // privat confirmation-sida — ska inte indexeras
};

export default function Tack() {
  return (
    <section className="sec tack-sec">
      <div className="container-narrow">
        <Suspense fallback={<div className="tack-loading">Laddar…</div>}>
          <ThankYou />
        </Suspense>
      </div>
    </section>
  );
}
