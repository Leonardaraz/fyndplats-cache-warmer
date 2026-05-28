// Admin-vy: konfigurationsstatus + översikt av fulfillment-tasks.
// Läser lagringen direkt server-side (ingen HTTP/token behövs här).
import { getMemoryStore } from "@/lib/store/memory";
import type { TaskStatus } from "@/lib/orders/types";

export const dynamic = "force-dynamic";

function envStatus() {
  return [
    { key: "ANTHROPIC_API_KEY", label: "Claude (översättning/SEO)" },
    { key: "WIX_API_TOKEN", label: "Wix Stores-token" },
    { key: "WIX_SITE_ID", label: "Wix site-ID" },
    { key: "EXTENSION_API_TOKEN", label: "Tilläggets API-token" },
  ].map((e) => ({ ...e, set: Boolean(process.env[e.key]) }));
}

export default async function AdminPage() {
  const status = envStatus();
  const tasks = await getMemoryStore().listTasks();
  const byStatus = (s: TaskStatus) => tasks.filter((t) => t.status === s).length;
  const pending = tasks.filter((t) => t.status === "pending");

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: "0 16px" }}>
      <h1>Fyndplats — Import & Sync</h1>
      <p>Internt verktyg för produktimport, lagersync och orderhantering (DSers-ersättning).</p>

      <h2>Konfiguration</h2>
      <ul>
        {status.map((s) => (
          <li key={s.key}>
            [{s.set ? "OK" : "saknas"}] {s.label} <code>({s.key})</code>
          </li>
        ))}
      </ul>

      <h2>Fulfillment-tasks</h2>
      <p>
        Väntar: <b>{byStatus("pending")}</b> · Beställda: <b>{byStatus("ordered")}</b> · Skickade:{" "}
        <b>{byStatus("shipped")}</b> · Avbrutna: <b>{byStatus("cancelled")}</b>
      </p>
      {pending.length > 0 ? (
        <ul>
          {pending.map((t) => (
            <li key={t.taskId}>
              #{t.orderNumber} — {t.productName} ×{t.quantity}{" "}
              {t.sku ? <code>({t.sku})</code> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ color: "#888" }}>Inga väntande tasks.</p>
      )}

      <h2>Endpoints</h2>
      <ul style={{ fontSize: 14 }}>
        <li><code>POST /api/import</code> — skapa Wix-produkt från AliExpress</li>
        <li><code>POST /api/sync</code> — lager + prisbevakning</li>
        <li><code>POST /api/wix-order</code> — order-webhook → tasks</li>
        <li><code>GET /api/tasks</code> — lista tasks</li>
        <li><code>POST /api/fulfillment/mark-ordered</code> · <code>/complete</code> · <code>/api/orders/cancel</code></li>
      </ul>
    </main>
  );
}
