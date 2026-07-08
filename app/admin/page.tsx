// Admin-vy: konfigurationsstatus + översikt av fulfillment-tasks.
// Läser lagringen direkt server-side (ingen HTTP/token behövs här).
import { getStore } from "@/lib/store/factory";
import type { TaskStatus } from "@/lib/orders/types";
import { paymentFeeFromEnv, pricingConfigFromEnv } from "@/lib/config";
import { summarizeProductProfit } from "@/lib/analytics/profit";
import { markTaskOrderedAction } from "./actions";
import { SupplierOverrideClient } from "./supplier-override-client";
import { PlaceOrderButton } from "./place-order-button";
import { EditAddressClient } from "./edit-address-client";
import { TaskRecoveryClient } from "./task-recovery-client";

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
  const pendingReview = mappings.filter(
    (m) => (m.draftStatus ?? "published") === "pending_review",
  );
  const profits = mappings
    .map((m) => summarizeProductProfit(m, pricing.vatRatePercent, fee))
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .sort((a, b) => b.minProfit - a.minProfit);
  // F19: tasks flaggade för manuell granskning (annullering/återbetalning racade in, eller
  // osäkert orderutfall) lyfts UT ur de normala listorna → de auto-skeppas inte (backstopp i
  // poll-tracking) och visas i en egen varnings-sektion så de aldrig är osynliga.
  const needsReview = tasks.filter(
    (t) =>
      (t.refundFlagged || t.cancelMidOrder || t.orderUncertain) &&
      t.status !== "cancelled" &&
      t.status !== "shipped",
  );
  const reviewIds = new Set(needsReview.map((t) => t.taskId));
  // Statussiffrorna exkluderar review-tasks → en flaggad task räknas EN gång (i
  // gransknings-sektionen + den egna räknaren), inte dubbelt i både statussiffran och sektionen.
  const byStatus = (s: TaskStatus) => tasks.filter((t) => t.status === s && !reviewIds.has(t.taskId)).length;
  const pending = tasks.filter((t) => t.status === "pending" && !reviewIds.has(t.taskId));
  const pendingPayment = tasks.filter((t) => t.status === "pending_payment" && !reviewIds.has(t.taskId));
  const orderedWaitingTracking = tasks.filter(
    (t) => t.status === "ordered" && t.aliexpressOrderId && !t.sku?.startsWith("shipped") && !reviewIds.has(t.taskId),
  );

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
        Väntar: <b>{byStatus("pending")}</b> · Väntar betalning: <b>{byStatus("pending_payment")}</b> · Beställda:{" "}
        <b>{byStatus("ordered")}</b> · Skickade: <b>{byStatus("shipped")}</b> · Avbrutna:{" "}
        <b>{byStatus("cancelled")}</b>
        {needsReview.length > 0 ? (
          <span style={{ color: "#b91c1c" }}> · ⚠️ Granskning: <b>{needsReview.length}</b></span>
        ) : null}
      </p>

      {needsReview.length > 0 ? (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "12px 14px", margin: "12px 0" }}>
          <h3 style={{ fontSize: 16, marginTop: 0, color: "#b91c1c" }}>⚠️ Kräver manuell granskning ({needsReview.length})</h3>
          <p style={{ fontSize: 13, color: "#7f1d1d", marginTop: 0 }}>
            En annullering/återbetalning kom in kring orderläggningen, eller orderutfallet är osäkert.
            Dessa <b>auto-skeppas inte</b>. Finns ett AE-order-id: <b>avbeställ manuellt på AliExpress</b> och
            återbetala kunden. Annars kan tasken avbrytas.
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {needsReview.map((t) => (
              <li key={t.taskId} style={{ padding: "8px 0", borderTop: "1px solid #fecaca", fontSize: 13 }}>
                <div>
                  <b>#{t.orderNumber}</b> — {t.productName} ×{t.quantity} <span style={{ color: "#7f1d1d" }}>[{t.status}]</span>
                </div>
                <div style={{ color: "#7f1d1d" }}>
                  {[
                    t.refundFlagged ? "↩️ återbetalning registrerad" : null,
                    t.cancelMidOrder ? "⏸️ annullering under orderläggning" : null,
                    t.orderUncertain ? "❓ osäkert orderutfall" : null,
                  ].filter(Boolean).join(" · ")}
                  {t.aliexpressOrderId ? <> · AE-order: <code>{t.aliexpressOrderId}</code> (avbeställ manuellt)</> : null}
                </div>
                <TaskRecoveryClient taskId={t.taskId} hasAeOrder={Boolean(t.aliexpressOrderId)} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {pending.length > 0 ? (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {pending.map((t) => {
            const a = t.shippingAddress;
            return (
              <li key={t.taskId} style={{ padding: "12px 0", borderBottom: "1px solid #eee" }}>
                <div>
                  <b>#{t.orderNumber}</b> — {t.productName} ×{t.quantity}{" "}
                  {t.sku ? <code style={{ fontSize: 12 }}>({t.sku})</code> : null}
                </div>
                {Object.keys(t.variantChoices).length > 0 ? (
                  <div style={{ fontSize: 13, color: "#666" }}>
                    Variant: {Object.entries(t.variantChoices).map(([k, v]) => `${k}: ${v}`).join(", ")}
                  </div>
                ) : null}
                {a && a.addressLine1 && a.city && a.postalCode ? (
                  <div style={{ fontSize: 13, color: "#666" }}>
                    Skickas till: {a.fullName}, {a.addressLine1}
                    {a.addressLine2 ? `, ${a.addressLine2}` : ""}, {a.postalCode} {a.city}, {a.country}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: "#b45309" }}>
                    ⚠️ Ofullständig leveransadress
                    {a ? `: ${[a.fullName, a.addressLine1, a.postalCode, a.city, a.country].filter(Boolean).join(", ")}` : ""} — komplettera med “Ändra adress” innan du lägger ordern.
                  </div>
                )}
                <EditAddressClient taskId={t.taskId} address={t.shippingAddress} />
                <PlaceOrderButton taskId={t.taskId} />
                <SupplierOverrideClient
                  taskId={t.taskId}
                  variantChoices={t.variantChoices}
                  override={
                    t.overriddenSupplierProductId
                      ? {
                          productId: t.overriddenSupplierProductId,
                          skuId: t.overriddenSupplierVariantId,
                          label: t.overriddenSupplierLabel,
                        }
                      : undefined
                  }
                />
              </li>
            );
          })}
        </ul>
      ) : (
        <p style={{ color: "#888" }}>Inga väntande tasks.</p>
      )}

      {pendingPayment.length > 0 ? (
        <>
          <h3 style={{ fontSize: 16, marginTop: 18 }}>Väntar på betalning hos AliExpress</h3>
          <p style={{ fontSize: 13, color: "#666" }}>
            Ordern är lagd men kräver betalning. Betala på AliExpress och klicka sedan
            <b> Markera som lagd</b> — då hämtar cron-jobbet spårningsnummer automatiskt
            (utan detta fastnar ordern osynligt och kunden skickas aldrig).
          </p>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {pendingPayment.map((t) => {
              const markAction = markTaskOrderedAction.bind(null, t.taskId);
              return (
                <li key={t.taskId} style={{ padding: "10px 0", borderBottom: "1px solid #eee" }}>
                  <div>
                    <b>#{t.orderNumber}</b> — {t.productName} ×{t.quantity}{" "}
                    {t.aliexpressOrderId ? (
                      <code style={{ fontSize: 12 }}>AE-order: {t.aliexpressOrderId}</code>
                    ) : null}
                  </div>
                  {t.paymentUrl?.startsWith("https://") ? (
                    <div style={{ marginTop: 4 }}>
                      <a href={t.paymentUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13 }}>
                        Betala på AliExpress ↗
                      </a>
                    </div>
                  ) : null}
                  <form action={markAction} style={{ marginTop: 6 }}>
                    <button
                      type="submit"
                      style={{
                        background: "#16a34a",
                        color: "#fff",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      Markera som lagd
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}

      {orderedWaitingTracking.length > 0 ? (
        <>
          <h3 style={{ fontSize: 16, marginTop: 18 }}>Väntar på spårningsnummer från AliExpress</h3>
          <p style={{ fontSize: 13, color: "#666" }}>
            Cron-jobbet (var 3:e timme) hämtar spårningsnummer från AliExpress DS API och pushar dem
            till Wix Stores — då skickas "På väg"-mejlet automatiskt.
          </p>
          <ul style={{ fontSize: 13 }}>
            {orderedWaitingTracking.map((t) => (
              <li key={t.taskId}>
                #{t.orderNumber} — AliExpress: <code>{t.aliexpressOrderId}</code>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <h2>Verktyg</h2>
      <ul style={{ fontSize: 14 }}>
        <li>
          <a href="/admin/queue"><b>Granskningskö</b></a> — {pendingReview.length > 0 ? `${pendingReview.length} produkter väntar på publicering` : "publicera nyimporterade utkast (för närvarande tomt)"}
        </li>
        <li><a href="/admin/bulk-import"><b>Bulk-import (CSV)</b></a> — importera många AliExpress-produkter på en gång (alla landar i kön som visible:false)</li>
        <li><a href="/admin/sync-alerts"><b>Sync-alerts</b></a> — daglig AliExpress-sync flaggar prishöjningar och innehållsändringar att granska</li>
        <li><a href="/admin/restock-list"><b>Restock-bevakare</b></a> — kunder som väntar på "tillbaka i lager"-mejl per slutsåld produkt</li>
        <li><a href="/admin/reviews"><b>Recensioner</b></a> — moderera (visa/dölj) importerade AliExpress-recensioner översatta till svenska</li>
        <li><a href="/admin/mappings"><b>AliExpress-mappning</b></a> — länka existerande Wix-produkter till AliExpress-källor (krävs för auto-pipelinen)</li>
        <li><a href="/admin/source-lookup"><b>Hitta AliExpress-källa</b></a> — klistra in Wix-produkt-id, slug eller produkt-URL → få AliExpress-länken för en importerad produkt</li>
        <li><a href="/admin/seo"><b>SEO-migration</b></a> — V1↔V3-matchning, 301-redirects, sitemap, SEO-audit inför headless-cutover</li>
        <li><a href="/admin/profitability"><b>Lönsamhet per produkt</b></a> — sortbar tabell över intäkt/inköp/marginal/sålda enheter (90 dagar default) + CSV-export</li>
        <li><a href="/admin/pricing"><b>Prissättningsregler</b></a> — standard-/kategori-/intervall-multiplikatorer, fast påslag och avrundning (gäller vid import) + förhandsgranskning</li>
        <li><a href="/admin/variant-translations"><b>Variantöversättningar (AI)</b></a> — stickprova de AI-översatta variantvärdena (engelska → svenska) och fånga felöversättningar tidigt</li>
      </ul>

      <h2>Endpoints</h2>
      <ul style={{ fontSize: 14 }}>
        <li><code>POST /api/import</code> — skapa Wix-produkt från AliExpress</li>
        <li><code>POST /api/sync</code> — lager + prisbevakning</li>
        <li><code>POST /api/wix-order</code> — order-webhook → tasks</li>
        <li><code>GET /api/tasks</code> — lista tasks</li>
        <li><code>POST /api/fulfillment/mark-ordered</code> · <code>/complete</code> · <code>/api/orders/cancel</code></li>
        <li><code>POST /api/aliexpress/order</code> · <code>GET /api/aliexpress/tracking</code></li>
        <li><code>GET /api/cron/poll-tracking</code> — körs var 3:e h via Vercel Cron</li>
        <li><code>POST /api/cron/aliexpress-sync</code> — daglig sync 06:00 UTC (Vercel Cron)</li>
        <li><code>POST /api/cron/bulk-import-worker</code> — bulk-import worker (varje minut via Vercel Cron)</li>
        <li><code>POST /api/admin/bulk-import</code> — skapa bulk-import-jobb från CSV</li>
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
