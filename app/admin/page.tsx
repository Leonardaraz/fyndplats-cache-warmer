// Admin-vy: konfigurationsstatus + översikt av fulfillment-tasks.
// Läser lagringen direkt server-side (ingen HTTP/token behövs här).
import { getStore } from "@/lib/store/factory";
import type { TaskStatus } from "@/lib/orders/types";
import { paymentFeeFromEnv, pricingConfigFromEnv } from "@/lib/config";
import { summarizeProductProfit } from "@/lib/analytics/profit";

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
  const store = getStore();
  const tasks = await store.listTasks();
  const auditLog = await store.listAudit(15);
  const dryRun = process.env.DRY_RUN === "1";
  const pricing = pricingConfigFromEnv();
  const fee = paymentFeeFromEnv();
  const mappings = await store.listMappings();
  const profits = mappings
    .map((m) => summarizeProductProfit(m, pricing.vatRatePercent, fee))
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .sort((a, b) => b.minProfit - a.minProfit);
  const byStatus = (s: TaskStatus) => tasks.filter((t) => t.status === s).length;
  const pending = tasks.filter((t) => t.status === "pending");

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: "0 16px" }}>
      <h1>Fyndplats — Import & Sync</h1>
      <p>Internt verktyg för produktimport, lagersync och orderhantering (DSers-ersättning).</p>
      {dryRun ? (
        <p style={{ background: "#fff4e5", padding: "6px 10px", borderRadius: 6, fontSize: 13 }}>
          Testläge aktivt (DRY_RUN=1) — inga skrivningar görs mot Wix.
        </p>
      ) : null}

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

      <h2>Lönsamhet per produkt</h2>
      <p style={{ fontSize: 12, color: "#666" }}>
        Vinst = intäkt exkl. moms − landad inköpskostnad − Klarna-avgift ({fee.percent}% + {fee.fixedSek} kr).
        Sorterat på lägsta vinst per produkt (det som blöder överst).
      </p>
      {profits.length > 0 ? (
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
              <th>Produkt</th>
              <th>Varianter</th>
              <th>Vinst (min–max kr)</th>
              <th>Marginal (min–max %)</th>
            </tr>
          </thead>
          <tbody>
            {profits.map((p) => (
              <tr key={p.wixProductId} style={{ borderBottom: "1px solid #f1f1f1" }}>
                <td><code>{p.wixProductId}</code></td>
                <td>{p.variantCount}</td>
                <td>{p.minProfit} – {p.maxProfit}</td>
                <td>{p.minMargin} – {p.maxMargin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ color: "#888" }}>Inga produkter importerade än.</p>
      )}

      <h2>Senaste händelser (audit)</h2>
      {auditLog.length > 0 ? (
        <ul style={{ fontSize: 13 }}>
          {auditLog.map((e, i) => (
            <li key={i}>
              <code>{e.at.slice(0, 19).replace("T", " ")}</code> · <b>{e.kind}</b>
              {e.ref ? ` · ${e.ref}` : ""}
              {e.detail ? ` — ${e.detail}` : ""}
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ color: "#888" }}>Inga händelser loggade än.</p>
      )}
    </main>
  );
}
