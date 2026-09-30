// Admin-vy: restock-bevakare per produkt (Feature 1).
// Visar hur många kunder som väntar på "tillbaka i lager"-mejl för varje
// slutsåld produkt, med butikens namn, leverantörens länk och var varan är slut.
//
// Namnet läses ur Wix, inte ur mappningen: mappningens `seoTitle` är
// leverantörens sidtitel från importen (Leonard 2026-09-30: "produkterna står
// på engelska"). Vad som visas bestäms i lib/restock/rader.ts.
import { getRestockStore, countByProduct } from "@/lib/restock/store";
import {
  byggRestockRader,
  type RestockButiksprodukt,
  type RestockMappning,
  type RestockRad,
  type RestockSynkstatus,
} from "@/lib/restock/rader";
import { getStore } from "@/lib/store/factory";
import { isAliExpressMapping } from "@/lib/store/supplier";
import { getSyncStore } from "@/lib/sync/sync-log";
import { searchProductSummaries } from "@/lib/wix/client";
import { mapWithConcurrency } from "@/lib/concurrency";

export const dynamic = "force-dynamic";

const LANK = { color: "#0891b2" } as const;
const AE_LANK = { color: "#d97706" } as const;

function datum(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : "";
}

function Etikett({ farg, children }: { farg: string; children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 11,
        fontWeight: 600,
        color: farg,
        border: `1px solid ${farg}`,
        borderRadius: 4,
        padding: "0 5px",
        marginRight: 4,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function Produktcell({ rad }: { rad: RestockRad }) {
  return (
    <td style={{ padding: "8px 4px", verticalAlign: "top" }}>
      <div style={{ fontWeight: 600 }}>
        {rad.namn ?? (rad.leverantorensTitel ? (
          <span style={{ fontWeight: 400, color: "#6b7280" }}>
            {rad.leverantorensTitel} <i>(leverantörens titel)</i>
          </span>
        ) : (
          <code>{rad.productId}</code>
        ))}
      </div>
      <div style={{ marginTop: 3 }}>
        {rad.iButiken === "saknas" ? <Etikett farg="#b91c1c">Finns inte i butiken</Etikett> : null}
        {rad.synlig === false ? <Etikett farg="#6b7280">Dold i butiken</Etikett> : null}
        {rad.butikUrl ? (
          <a href={rad.butikUrl} target="_blank" rel="noopener noreferrer" style={LANK}>
            Fyndplats ↗
          </a>
        ) : null}
      </div>
      <div style={{ color: "#9ca3af", fontSize: 11 }}>
        <code>{rad.productId}</code>
      </div>
    </td>
  );
}

function Leverantorscell({ rad }: { rad: RestockRad }) {
  const lev = rad.leverantor;
  if (!lev) {
    return (
      <td style={{ padding: "8px 4px", verticalAlign: "top", color: "#9ca3af" }}>
        {rad.mappningOkand ? "Kunde inte läsa mappningen" : "Ingen mappning"}
      </td>
    );
  }
  const kollad = datum(lev.kontrollerad);
  return (
    <td style={{ padding: "8px 4px", verticalAlign: "top" }}>
      <div>
        {lev.url ? (
          <a
            href={lev.url}
            target="_blank"
            rel="noopener noreferrer"
            style={lev.leverantor === "aliexpress" ? AE_LANK : LANK}
          >
            {lev.namn} ↗
          </a>
        ) : (
          <span>{lev.namn}</span>
        )}
        {lev.lager.length ? <span style={{ color: "#6b7280" }}> · lager {lev.lager.join(", ")}</span> : null}
      </div>
      <div style={{ marginTop: 3 }}>
        {lev.status === "slut" ? (
          <Etikett farg="#b91c1c">
            Slut hos {lev.namn}
            {lev.slutSedan ? ` sedan ${datum(lev.slutSedan)}` : ""}
          </Etikett>
        ) : lev.status === "borttagen" ? (
          <Etikett farg="#b91c1c">Borttagen hos {lev.namn}</Etikett>
        ) : lev.status === "i_lager" ? (
          <Etikett farg="#15803d">
            I lager hos {lev.namn}
            {lev.antal !== null ? ` (${lev.antal} st)` : ""}
          </Etikett>
        ) : (
          <span style={{ color: "#9ca3af", fontSize: 12 }}>Lagret hos {lev.namn} är okänt</span>
        )}
        {kollad ? <span style={{ color: "#9ca3af", fontSize: 11 }}> kollat {kollad}</span> : null}
      </div>
      {!lev.mejlasAutomatiskt && rad.pending > 0 ? (
        <div style={{ color: "#b45309", fontSize: 12, marginTop: 3 }}>
          Får inget automatiskt mejl — Aosom-synken skickar inga.
        </div>
      ) : null}
    </td>
  );
}

function HosOss({ rad }: { rad: RestockRad }) {
  switch (rad.hosOss) {
    case "i_lager":
      return <Etikett farg="#15803d">I lager</Etikett>;
    case "slut":
      return <Etikett farg="#b91c1c">Slut</Etikett>;
    case "delvis":
      return <Etikett farg="#b45309">Delvis slut</Etikett>;
    default:
      return <span style={{ color: "#9ca3af" }}>—</span>;
  }
}

/** Butikens namn, slug, synlighet och lagerstatus. null = uppslaget föll. */
async function lasButiksnamn(
  ids: string[],
): Promise<{ produkter: Map<string, RestockButiksprodukt> | null; fel: string | null }> {
  if (!ids.length) return { produkter: new Map(), fel: null };
  try {
    return { produkter: await searchProductSummaries(ids), fel: null };
  } catch (err) {
    return { produkter: null, fel: err instanceof Error ? err.message : String(err) };
  }
}

export default async function RestockListPage() {
  let counts: ReturnType<typeof countByProduct> = [];
  let loadError: string | null = null;

  // Prenumeranterna är det väsentliga — läs dem fristående. Uppslagen nedan
  // (namn, leverantör, lagerstatus) får ALDRIG fälla hela vyn: tidigare bundlades
  // de i en Promise.all, så ett fel i endera dolde prenumeranterna helt.
  try {
    counts = countByProduct(await getRestockStore().listAll());
  } catch (err) {
    loadError = err instanceof Error ? err.message : String(err);
  }

  const ids = counts.map((c) => c.productId);
  const mappningar = new Map<string, RestockMappning | null>();
  const synk = new Map<string, RestockSynkstatus | null>();

  const [wix] = await Promise.all([
    lasButiksnamn(ids),
    mapWithConcurrency(ids, 8, async (id) => {
      try {
        const m = await getStore().getMappingByWixProductId(id);
        mappningar.set(id, m);
        // Bara AliExpress-rader har ett synktillstånd som beskriver listningen i dag.
        if (m && isAliExpressMapping(m)) {
          synk.set(id, await getSyncStore().getState(id).catch(() => null));
        }
      } catch {
        // Nyckeln saknas → raden visas som "kunde inte läsa mappningen".
      }
    }),
  ]);

  const rader = byggRestockRader({ counts, produkter: wix.produkter, mappningar, synk });
  const mappningsfel = rader.filter((r) => r.mappningOkand).length;
  const totalPending = counts.reduce((s, c) => s + c.pending, 0);
  const totalSubscribers = counts.reduce((s, c) => s + c.total, 0);

  return (
    <main style={{ maxWidth: 1040, margin: "40px auto", padding: "0 16px" }}>
      <p style={{ fontSize: 13 }}>
        <a href="/admin">← Admin</a>
      </p>
      <h1>Restock-bevakare</h1>
      <p style={{ color: "#555", fontSize: 14, maxWidth: 720 }}>
        Kunder som klickat "Meddela mig när varan är tillbaka i lager" på en slutsåld
        produktsida. När AliExpress-synken ser en vara tillbaka i lager mejlas de
        väntande (<b>pending</b>) automatiskt och markeras som notifierade.{" "}
        <b>Aosom-synken skickar inga sådana mejl</b>, så bevakare av Aosom-varor får
        inget besked när varan kommer tillbaka.
      </p>

      {loadError ? (
        <p style={{ background: "#fef2f2", color: "#b91c1c", padding: "10px 12px", borderRadius: 8, fontSize: 13 }}>
          Kunde inte läsa bevakare: <code>{loadError}</code>
          <br />
          (Kollektionen <code>FyndplatsRestockSubscribers</code> skapas automatiskt vid
          första prenumerationen — tom lista tills dess.)
        </p>
      ) : null}
      {wix.fel ? (
        <p style={{ background: "#fffbeb", color: "#92400e", padding: "10px 12px", borderRadius: 8, fontSize: 13 }}>
          Kunde inte läsa namnen från butiken: <code>{wix.fel}</code>
        </p>
      ) : null}
      {mappningsfel > 0 ? (
        <p style={{ background: "#fffbeb", color: "#92400e", padding: "10px 12px", borderRadius: 8, fontSize: 13 }}>
          {mappningsfel} mappningar gick inte att läsa — leverantören saknas på de raderna.
        </p>
      ) : null}

      <p style={{ fontSize: 14 }}>
        Väntar på mejl: <b>{totalPending}</b> · Totalt registrerade: <b>{totalSubscribers}</b> ·
        Produkter med bevakare: <b>{counts.length}</b>
      </p>

      {rader.length > 0 ? (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", marginTop: 12 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                <th style={{ padding: "6px 4px" }}>Produkt</th>
                <th style={{ padding: "6px 4px" }}>Leverantör</th>
                <th style={{ padding: "6px 4px" }}>Hos oss</th>
                <th style={{ padding: "6px 4px", textAlign: "right" }}>Väntar</th>
                <th style={{ padding: "6px 4px", textAlign: "right" }}>Notifierade</th>
                <th style={{ padding: "6px 4px", textAlign: "right" }}>Totalt</th>
                <th style={{ padding: "6px 4px" }}>Senaste anmälan</th>
              </tr>
            </thead>
            <tbody>
              {rader.map((rad) => (
                <tr key={rad.productId} style={{ borderBottom: "1px solid #f1f1f1" }}>
                  <Produktcell rad={rad} />
                  <Leverantorscell rad={rad} />
                  <td style={{ padding: "8px 4px", verticalAlign: "top" }}>
                    <HosOss rad={rad} />
                  </td>
                  <td
                    style={{
                      padding: "8px 4px",
                      verticalAlign: "top",
                      textAlign: "right",
                      fontWeight: rad.pending > 0 ? 700 : 400,
                      color: rad.pending > 0 ? "#b45309" : "#6b7280",
                    }}
                  >
                    {rad.pending}
                  </td>
                  <td style={{ padding: "8px 4px", verticalAlign: "top", textAlign: "right", color: "#6b7280" }}>
                    {rad.notified}
                  </td>
                  <td style={{ padding: "8px 4px", verticalAlign: "top", textAlign: "right" }}>{rad.total}</td>
                  <td style={{ padding: "8px 4px", verticalAlign: "top", color: "#6b7280" }}>
                    {datum(rad.latestSubscribedAt) || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !loadError ? (
        <p style={{ color: "#888" }}>Inga bevakare registrerade än.</p>
      ) : null}
    </main>
  );
}
