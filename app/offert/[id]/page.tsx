// /offert/<id> — offerten för ett företagskonto (E3-10).
//
// Kräver inloggning med kontot som begärde offerten; en annan inloggning får
// 404, så att ett id aldrig visar någon annans priser. Alltid dynamisk och
// privat. "Till kassan" bygger en låst korg med offertens priser, bara inom
// giltighetstiden och bara när kontot handlar som företaget (E3-12).

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { inloggad } from "@/lib/medlem/inloggad";
import { hamtaOffert } from "@/lib/medlem/lager";
import { arOffertId, type Offert } from "@/lib/medlem/offert";
import { OffertVy } from "./offert-vy";
import s from "../../konto/konto.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Offert",
  robots: { index: false, follow: false },
};

/** Offerten och tiden den läses vid; giltigheten prövas mot samma ögonblick. */
async function lasOffert(id: string): Promise<{ o: Offert | null; nu: number }> {
  const o = await hamtaOffert(id);
  return { o, nu: Date.now() };
}

export default async function OffertSida({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!arOffertId(id)) notFound();

  const session = await inloggad();
  if (!session) {
    return (
      <section className="sec">
        <div className="container-narrow">
          <p className={s.ogonbryn}>Offert</p>
          <h1 className={s.rubrik}>Logga in för att se offerten</h1>
          <p className={s.ingress}>Logga in med samma e-postadress som när du begärde offerten.</p>
          <p>
            <a className={`btn btn-primary ${s.knapp}`} href={`/konto?mal=${encodeURIComponent(`/offert/${id}`)}`}>
              Logga in
            </a>
          </p>
        </div>
      </section>
    );
  }

  let o: Offert | null = null;
  let nu = 0;
  try {
    ({ o, nu } = await lasOffert(id));
  } catch {
    return (
      <section className="sec">
        <div className="container-narrow">
          <h1 className={s.rubrik}>Offerten gick inte att läsa just nu</h1>
          <p className={s.ingress}>Försök igen om en stund.</p>
        </div>
      </section>
    );
  }
  if (!o || o.medlemsId !== session.sub) notFound();

  return <OffertVy o={o} nu={nu} />;
}
