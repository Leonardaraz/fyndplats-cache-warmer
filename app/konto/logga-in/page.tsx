// /konto/logga-in — dit länken i inloggningsmejlet leder, via
// /api/konto/lank som lagt länkens token i en httpOnly-kaka. Kunden trycker på
// knappen; först då förbrukas länken (ett mejlfilter som öppnar länken gör
// bara GET och kommer aldrig hit med kakan).

import type { Metadata } from "next";
import { cookies } from "next/headers";
import { LANK_KAKA, arToken, hashaToken, maskeradEpost, provaLank } from "@/lib/medlem/inloggning";
import { hamtaInloggning, medlemsHemlighet, medlemsLage } from "@/lib/medlem/lager";
import { feltext } from "../fel";
import s from "../konto.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Logga in",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/** Länkens rad och prövning, läst ur kakan. Utanför komponenten: den läser klockan. */
async function lasLank(oppen: boolean) {
  const t = (await cookies()).get(LANK_KAKA)?.value;
  const rad = oppen && arToken(t) ? await hamtaInloggning(hashaToken(t)).catch(() => null) : null;
  return { rad, prov: rad ? provaLank(rad, Date.now()) : ("utgangen" as const) };
}

export default async function LoggaIn() {
  const oppen = Boolean(medlemsHemlighet()) && (await medlemsLage()) !== "av";
  const { rad, prov } = await lasLank(oppen);

  return (
    <section className="sec">
      <div className="container-narrow">
        <h1 className={s.rubrik}>Logga in</h1>
        {rad && prov === "ok" ? (
          <div className={s.inloggning}>
            <form action="/api/konto/in" method="post" className={s.formular}>
              <p className={s.info}>
                Du loggar in som <strong>{maskeradEpost(rad.epost)}</strong>.
              </p>
              <button type="submit" className={`btn btn-primary ${s.knapp}`}>
                Logga in
              </button>
            </form>
          </div>
        ) : (
          <>
            <p className={s.ingress}>{oppen ? feltext(prov) : feltext("stangd")}</p>
            <a href="/konto" className="btn btn-primary">
              Till inloggningen
            </a>
          </>
        )}
      </div>
    </section>
  );
}
