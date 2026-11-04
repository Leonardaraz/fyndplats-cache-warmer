// /konto/avregistrera?m=…&t=…  — sidan bakom länken i mejlen om nivån.
//
// Sidan avregistrerar inte av sig själv: kunden trycker på knappen, som gör ett
// POST till /api/konto/avregistrera. Ett mejlfilter som öppnar länken ändrar
// därför ingenting.

import type { Metadata } from "next";
import { arGiltigAvregistrering } from "@/lib/medlem/inloggning";
import { medlemsHemlighet } from "@/lib/medlem/lager";
import s from "../konto.module.css";

export const metadata: Metadata = {
  title: "Mejl om din nivå",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://www.fyndplats.se/konto/avregistrera" },
};

export const dynamic = "force-dynamic";

const ett = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function Avregistrera({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const m = ett(sp.m);
  const t = ett(sp.t);
  const fel = ett(sp.fel);
  const klar = ett(sp.klar) === "1";
  const hemlighet = medlemsHemlighet();
  const giltig = Boolean(hemlighet && m && t && arGiltigAvregistrering(m, t, hemlighet));

  let rubrik: string;
  let text: string;
  let knapp = false;
  if (klar) {
    rubrik = "Klart";
    text = "Du får inte längre mejl om din nivå. Inloggningskoder och kvitton kommer som vanligt. Vill du ha mejlen igen slår du på dem under Mina sidor.";
  } else if (fel === "tillfalligt") {
    rubrik = "Något gick fel";
    text = "Det gick inte att avregistrera dig just nu. Försök igen om en stund, eller mejla info@fyndplats.com så hjälper vi dig.";
  } else if (fel || !giltig) {
    rubrik = "Länken fungerar inte";
    text = "Logga in och stäng av mejlen om din nivå under Mina sidor, eller mejla info@fyndplats.com så hjälper vi dig.";
  } else {
    rubrik = "Mejl om din nivå";
    text = "Vi mejlar när du når en ny nivå och två veckor innan din nivå sjunker. Vill du inte få de mejlen? Inloggningskoder och kvitton kommer som vanligt.";
    knapp = true;
  }

  return (
    <section className="sec">
      <div className="container-narrow">
        <p className={s.ogonbryn}>Fyndplats medlem</p>
        <h1 className={s.rubrik}>{rubrik}</h1>
        <p className={s.ingress}>{text}</p>
        {knapp && m && t ? (
          <form action={`/api/konto/avregistrera?m=${encodeURIComponent(m)}&t=${encodeURIComponent(t)}`} method="post">
            <button type="submit" className={`btn btn-primary ${s.knapp}`}>
              Avregistrera mig
            </button>
          </form>
        ) : (
          <p className={s.hjalp}>
            <a href="/konto">Till Mina sidor</a>
          </p>
        )}
      </div>
    </section>
  );
}
