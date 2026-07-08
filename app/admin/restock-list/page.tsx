// Admin-vy: restock-bevakare per produkt (Feature 1).
// Visar hur många kunder som väntar på "tillbaka i lager"-mejl för varje
// slutsåld produkt. Läser Wix Data direkt server-side.
import { getRestockStore, countByProduct } from "@/lib/restock/store";
import { getStore } from "@/lib/store/factory";

export const dynamic = "force-dynamic";

export default async function RestockListPage() {
  let counts: ReturnType<typeof countByProduct> = [];
  let loadError: string | null = null;
  const nameById = new Map<string, string>();

  // Prenumeranterna är det väsentliga — läs dem fristående. Mappnings-läsningen
  // (bara för läsbara produktnamn) får ALDRIG fälla hela vyn: tidigare bundlades
  // de i en Promise.all, så ett fel i endera dolde prenumeranterna helt.
  try {
    counts = countByProduct(await getRestockStore().listAll());
  } catch (err) {
    loadError = err instanceof Error ? err.message : String(err);
  }
  try {
    for (const m of await getStore().listMappings()) {
      nameById.set(m.wixProductId, m.seoTitle ?? m.wixProductId);
    }
  } catch {
    // Namn-uppslag misslyckades → visa produkt-id i stället, men dölj inte listan.
  }

  const totalPending = counts.reduce((s, c) => s + c.pending, 0);
  const totalSubscribers = counts.reduce((s, c) => s + c.total, 0);

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: "0 16px" }}>
      <p style={{ fontSize: 13 }}>
        <a href="/admin">← Admin</a>
      </p>
      <h1>Restock-bevakare</h1>
      <p style={{ color: "#555", fontSize: 14 }}>
        Kunder som klickat "Meddela mig när varan är tillbaka i lager" på en slutsåld
        produktsida. När AliExpress-syncen ser produkten tillbaka i lager skickas ett
        restock-mejl automatiskt till de väntande (<b>pending</b>) och de markeras som
        notifierade.
      </p>

      {loadError ? (
        <p style={{ background: "#fef2f2", color: "#b91c1c", padding: "10px 12px", borderRadius: 8, fontSize: 13 }}>
          Kunde inte läsa bevakare: <code>{loadError}</code>
          <br />
          (Kollektionen <code>FyndplatsRestockSubscribers</code> skapas automatiskt vid
          första prenumerationen — tom lista tills dess.)
        </p>
      ) : null}

      <p style={{ fontSize: 14 }}>
        Väntar på mejl: <b>{totalPending}</b> · Totalt registrerade: <b>{totalSubscribers}</b> ·
        Produkter med bevakare: <b>{counts.length}</b>
      </p>

      {counts.length > 0 ? (
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", marginTop: 12 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
              <th style={{ padding: "6px 4px" }}>Produkt</th>
              <th style={{ padding: "6px 4px", textAlign: "right" }}>Väntar</th>
              <th style={{ padding: "6px 4px", textAlign: "right" }}>Notifierade</th>
              <th style={{ padding: "6px 4px", textAlign: "right" }}>Totalt</th>
              <th style={{ padding: "6px 4px" }}>Senaste anmälan</th>
            </tr>
          </thead>
          <tbody>
            {counts.map((c) => (
              <tr key={c.productId} style={{ borderBottom: "1px solid #f1f1f1" }}>
                <td style={{ padding: "6px 4px" }}>
                  {nameById.get(c.productId) ?? <code>{c.productId}</code>}
                  <div style={{ color: "#9ca3af", fontSize: 11 }}><code>{c.productId}</code></div>
                </td>
                <td style={{ padding: "6px 4px", textAlign: "right", fontWeight: c.pending > 0 ? 700 : 400, color: c.pending > 0 ? "#b45309" : "#6b7280" }}>
                  {c.pending}
                </td>
                <td style={{ padding: "6px 4px", textAlign: "right", color: "#6b7280" }}>{c.notified}</td>
                <td style={{ padding: "6px 4px", textAlign: "right" }}>{c.total}</td>
                <td style={{ padding: "6px 4px", color: "#6b7280" }}>
                  {c.latestSubscribedAt ? c.latestSubscribedAt.slice(0, 10) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : !loadError ? (
        <p style={{ color: "#888" }}>Inga bevakare registrerade än.</p>
      ) : null}
    </main>
  );
}
