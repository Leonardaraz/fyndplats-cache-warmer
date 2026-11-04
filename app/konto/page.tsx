// /konto — inloggning eller Mina sidor (medlemskapet E1, 2026-11-04).
//
// Alltid dynamisk och privat: sidan bär kundens köp och får aldrig hamna i
// ISR-cachen. Ingen länk dit från menyn förrän Leonard slår på läget "pa";
// i läget "tyst" fungerar den för den som har adressen.

import type { Metadata } from "next";
import { inloggad } from "@/lib/medlem/inloggad";
import { medlemsHemlighet, medlemsLage } from "@/lib/medlem/lager";
import { minaSidor } from "@/lib/medlem/konto";
import { orderGuid, sakertMal } from "@/lib/medlem/inloggning";
import { KontoInloggning } from "./konto-inloggning";
import { MinaSidorVy } from "./mina-sidor";
import { FornyaSession } from "./fornya";
import s from "./konto.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mina sidor",
  description: "Logga in på ditt konto hos Fyndplats och se din medlemsnivå, dina köp och dina ordrar.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://www.fyndplats.se/konto" },
};

type Sok = Record<string, string | string[] | undefined>;
const ett = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function Konto({ searchParams }: { searchParams: Promise<Sok> }) {
  const sp = await searchParams;
  const oppen = Boolean(medlemsHemlighet()) && (await medlemsLage()) !== "av";

  if (!oppen) {
    return (
      <section className="sec">
        <div className="container-narrow">
          <h1 className={s.rubrik}>Mina sidor</h1>
          <p className={s.ingress}>Medlemskontot öppnar snart. Frågor om en order besvarar kundtjänst som vanligt.</p>
        </div>
      </section>
    );
  }

  const session = await inloggad();
  let data: Awaited<ReturnType<typeof minaSidor>> = null;
  let tekniskt = false;
  if (session) {
    try {
      data = await minaSidor(session.sub);
    } catch (e) {
      tekniskt = true;
      console.error("[konto] Mina sidor gick inte att läsa:", e instanceof Error ? e.message.slice(0, 160) : e);
    }
  }
  if (tekniskt) {
    return (
      <section className="sec">
        <div className="container-narrow">
          <h1 className={s.rubrik}>Mina sidor</h1>
          <p className={s.ingress}>Mina sidor gick inte att läsa just nu. Försök igen om en stund.</p>
        </div>
      </section>
    );
  }
  if (session && data) {
    return (
      <section className="sec">
        <div className="container-narrow">
          <MinaSidorVy data={data} />
        </div>
        <FornyaSession />
      </section>
    );
  }

  const order = orderGuid(ett(sp.order)) ?? undefined;
  const mal = sakertMal(ett(sp.mal));
  return (
    <section className="sec">
      <div className="container-narrow">
        <h1 className={s.rubrik}>{ett(sp.fran) === "tack" ? "Skapa konto – köpet räknas" : "Logga in eller skapa konto"}</h1>
        <p className={s.ingress}>
          Som medlem ser du din nivå, dina köp och dina ordrar på ett ställe. Du loggar in med en kod som vi mejlar, utan
          lösenord. Köp du gjort med samma e-post det senaste året räknas direkt.
        </p>
        <KontoInloggning order={order} mal={mal === "/konto" ? undefined : mal} fel={ett(sp.fel) ?? null} />
        <p className={s.liten}>
          När du skapar ett konto sparar vi din e-postadress och räknar ihop dina köp för medlemsnivån. Läs mer i vår{" "}
          <a href="/sekretesspolicy">sekretesspolicy</a>.
        </p>
      </div>
      {session ? <FornyaSession /> : null}
    </section>
  );
}
