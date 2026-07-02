import type { Metadata } from "next";
import { unsubscribe } from "../../lib/newsletter";

export const metadata: Metadata = {
  title: "Avregistrera nyhetsbrev",
  robots: { index: false, follow: false },
  // Egen canonical — annars ärvs root-layoutens (= startsidan).
  alternates: { canonical: "https://www.fyndplats.se/avregistrera" },
};

export const dynamic = "force-dynamic";

export default async function Avregistrera({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; t?: string }>;
}) {
  const { e = "", t = "" } = await searchParams;

  let status: "ok" | "invalid" | "error" = "invalid";
  if (e && t) {
    try {
      const res = await unsubscribe(e, t);
      status = res.ok ? "ok" : "invalid";
    } catch {
      status = "error";
    }
  }

  return (
    <section className="sec">
      <div className="container">
        <div className="sechead">
          <div className="eyebrow">Nyhetsbrev</div>
          {status === "ok" ? (
            <>
              <h1>Du är avregistrerad</h1>
              <p>
                Du kommer inte längre att få vårt nyhetsbrev. Ledsen att se dig gå —
                du är alltid välkommen tillbaka.{" "}
                <a href="/butik" style={{ color: "var(--orange)", fontWeight: 600 }}>
                  Fortsätt till butiken →
                </a>
              </p>
            </>
          ) : status === "error" ? (
            <>
              <h1>Något gick fel</h1>
              <p>
                Vi kunde inte hantera din avregistrering just nu. Försök igen senare
                eller mejla{" "}
                <a href="mailto:info@fyndplats.com" style={{ color: "var(--orange)", fontWeight: 600 }}>
                  info@fyndplats.com
                </a>{" "}
                så hjälper vi dig.
              </p>
            </>
          ) : (
            <>
              <h1>Länken är ogiltig</h1>
              <p>
                Avregistreringslänken verkar vara ofullständig eller ha gått ut. Mejla{" "}
                <a href="mailto:info@fyndplats.com" style={{ color: "var(--orange)", fontWeight: 600 }}>
                  info@fyndplats.com
                </a>{" "}
                så avregistrerar vi dig manuellt.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
