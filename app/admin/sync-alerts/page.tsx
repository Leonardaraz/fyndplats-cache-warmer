// /admin/sync-alerts — synkens kontrollrum: alerts som kräver Leonards beslut,
// lager-/synlighetsläget och hela pris-/lagerhistoriken på samma sida.
//
// Datakällor:
//   - SyncStore.listAlerts("open")        — beslutskorten
//   - SyncStore.listProblemStates()       — slut i lager / dolda / felsviter
//   - SyncStore.listRecentLog(300)        — händelselogg (alla/pris/lager-flikar)
//   - searchProductSummaries (Wix V3)     — batch: produktnamn + slug → länkar
//     till BÅDE AliExpress-ursprunget och live-sidan på fyndplats.se per rad.
//
// Filter (query-params): ?filter=price|content|all  +  ?log=all|price|stock
//
// All UI-text på svenska.

import Link from "next/link";
import { getPricingRules } from "@/lib/store/pricing-config";
import {
  ALERT_BANDS,
  TARGET_MARGIN_PCT,
  alertBandFor,
  alertMarginPct,
  priceForTargetMargin,
} from "@/lib/pricing/margin-bands";
import { roundPrice } from "@/lib/import/pricing";
import { getSyncStore, type SyncAlert, type SyncLogEntry, type SyncStateEntry } from "@/lib/sync/sync-log";
import { searchProductSummaries, type WixProductSummary } from "@/lib/wix/client";
import {
  approveNewPrice,
  bulkApprovePrices,
  dismissContentAlert,
  keepCurrentPrice,
  removeProduct,
} from "./actions";

export const dynamic = "force-dynamic";

type FilterMode = "all" | "price" | "content";
type LogMode = "all" | "price" | "stock";

interface PageProps {
  searchParams: Promise<{ filter?: string; log?: string; band?: string }>;
}

const SEVERITY_COLOR: Record<SyncAlert["severity"], string> = {
  high: "#dc2626",
  medium: "#d97706",
  low: "#0891b2",
};

const SEVERITY_LABEL: Record<SyncAlert["severity"], string> = {
  high: "Hög",
  medium: "Medel",
  low: "Låg",
};

const SEVERITY_RANK: Record<SyncAlert["severity"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const ACTION_SV: Record<SyncLogEntry["actionTaken"], { label: string; color: string }> = {
  none: { label: "—", color: "#94a3b8" },
  hidden: { label: "Dold (listning borta)", color: "#dc2626" },
  marked_oos: { label: "Satt till slut i lager", color: "#d97706" },
  restored: { label: "Återställd i lager", color: "#16a34a" },
  flagged_price: { label: "Prishöjning flaggad", color: "#d97706" },
  flagged_content: { label: "Innehållsändring flaggad", color: "#0891b2" },
  dry_run: { label: "Dry-run", color: "#94a3b8" },
  error: { label: "Fel vid hämtning", color: "#dc2626" },
};

function aeUrl(aliexpressId: string): string {
  return `https://www.aliexpress.com/item/${encodeURIComponent(aliexpressId)}.html`;
}

function fpUrl(slug: string): string {
  const base = (process.env.STORE_PRODUCT_BASE_URL ?? "https://fyndplats.se/produkt").replace(/\/$/, "");
  return `${base}/${slug}`;
}

// Nästa aliexpress-sync-körning: Vercel-cronen kör var 4:e timme på heltimme
// UTC (00, 04, 08, 12, 16, 20) — se vercel.json.
function nextSyncRun(now: Date): string {
  const next = new Date(now);
  next.setUTCMinutes(0, 0, 0);
  next.setUTCHours(next.getUTCHours() + (4 - (next.getUTCHours() % 4)));
  return next.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Stockholm" });
}

function fmtTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("sv-SE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Stockholm" });
}

export default async function SyncAlertsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filter: FilterMode =
    params.filter === "price" || params.filter === "content" ? params.filter : "all";
  const logMode: LogMode =
    params.log === "price" || params.log === "stock" ? params.log : "all";

  const syncStore = getSyncStore();
  const [allAlerts, recentLog, problemStates] = await Promise.all([
    syncStore.listAlerts("open", 500),
    syncStore.listRecentLog(300),
    syncStore.listProblemStates().catch(() => [] as SyncStateEntry[]),
  ]);

  // Batch-uppslag: namn + slug för ALLT som visas på sidan (alerts utan
  // productSlug, problemlagret och loggen) → länkar till AliExpress-ursprunget
  // och live-sidan per rad. Best-effort: utan uppslaget visas id:n som förut.
  let products = new Map<string, WixProductSummary>();
  try {
    products = await searchProductSummaries([
      ...allAlerts.map((a) => a.wixProductId),
      ...problemStates.map((s) => s.wixProductId),
      ...recentLog.map((r) => r.productId),
    ]);
  } catch {
    /* uppslaget är kosmetik — sidan fungerar utan */
  }

  const filtered = allAlerts.filter((a) => {
    if (filter === "price") return a.alertType === "price_increase";
    if (filter === "content") return a.alertType === "content_change";
    return true;
  });

  filtered.sort((a, b) => {
    const sev = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (sev !== 0) return sev;
    return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
  });

  // MARGINALEN RÄKNAS OM HÄR i stället för att visa larmets sparade
  // projectedMarginPct. Larm skrivna före 2026-08-19 räknades med den MOMSADE
  // kostnaden mot nettointäkten och är därför för låga — ofta med fel tecken.
  // Omräkningen gör de redan öppna larmen sanna direkt, utan att invänta en ny
  // synk-körning.
  const prisregler = await getPricingRules();
  const marginalFor = (a: SyncAlert) =>
    alertMarginPct(a, prisregler.usdToSek, prisregler.vatRatePercent) ?? a.projectedMarginPct ?? null;

  // REKOMMENDATIONEN SIKTAR PÅ MÅLMARGINALEN, inte på import-multiplikatorn.
  //
  // Larmen bär ett `recommendedPriceSek` räknat som kostnad × 2,5 — samma regel
  // som vid import. Det ger ~62 % marginal och blir därför ett förslag ingen
  // trycker på: växthuset på 449 kr föreslogs få 1219 kr. Vid målmarginalen
  // landar det på ~639 kr, vilket är en höjning man faktiskt gör.
  //
  // Räknas om här i stället för att visa larmets sparade tal, så de redan
  // öppna larmen får det användbara förslaget direkt.
  const rekommenderatFor = (a: SyncAlert): number | null => {
    if (!(a.newCostUsd && a.newCostUsd > 0)) return a.recommendedPriceSek ?? null;
    const ra = priceForTargetMargin(
      a.newCostUsd * prisregler.usdToSek,
      TARGET_MARGIN_PCT,
      prisregler.vatRatePercent,
    );
    return ra === null ? (a.recommendedPriceSek ?? null) : roundPrice(ra, prisregler.rounding);
  };

  const valtBand = ALERT_BANDS.find((b) => b.id === params.band)?.id ?? null;
  const priceAlertsAlla = filtered.filter((a) => a.alertType === "price_increase");
  const bandRader = ALERT_BANDS.map((b) => ({
    band: b,
    count: priceAlertsAlla.filter((a) => alertBandFor(marginalFor(a))?.id === b.id).length,
  }));
  const priceAlerts = valtBand
    ? priceAlertsAlla.filter((a) => alertBandFor(marginalFor(a))?.id === valtBand)
    : priceAlertsAlla;
  const contentAlerts = filtered.filter((a) => a.alertType === "content_change");

  // Statusraden överst — synk-hälsan i en blick.
  const now = new Date();
  const dayAgo = now.getTime() - 24 * 3600 * 1000;
  const checked24h = recentLog.filter((r) => Date.parse(r.checkedAt) >= dayAgo).length;
  const oosCount = problemStates.filter((s) => s.listingStatus === "out_of_stock").length;
  const removedCount = problemStates.filter((s) => s.listingStatus === "removed").length;
  const errorCount = problemStates.filter((s) => (s.errorStreak ?? 0) > 0 && s.listingStatus !== "removed").length;

  // Händelseloggens flikar: pris = rader där inköpskostnaden faktiskt ändrades
  // (eller flaggades), lager = rader där saldot ändrades eller en lager-åtgärd
  // togs. "Alla" visar allt (inkl. kollar utan förändring).
  const priceRows = recentLog.filter(
    (r) =>
      (r.prevCostSek != null && r.newCostSek != null && r.prevCostSek !== r.newCostSek)
      || r.actionTaken === "flagged_price",
  );
  const stockRows = recentLog.filter(
    (r) =>
      (r.prevStock != null && r.newStock != null && r.prevStock !== r.newStock)
      || r.actionTaken === "marked_oos"
      || r.actionTaken === "restored"
      || r.actionTaken === "hidden",
  );
  const logRows = (logMode === "price" ? priceRows : logMode === "stock" ? stockRows : recentLog).slice(0, 120);

  return (
    <main style={{ maxWidth: 1080, margin: "40px auto", padding: "0 16px" }}>
      <p style={{ fontSize: 13 }}>
        <Link href="/admin">← Tillbaka till admin</Link>
        {" · "}
        <Link href="/admin/margins">Marginalöversikt</Link>
      </p>
      <h1>Pris- &amp; lagersynk</h1>
      <p style={{ fontSize: 14, color: "#444" }}>
        AliExpress-synken kör var 4:e timme: bevakar leverantörens pris, lager
        och innehåll för varje mappad produkt. Prishöjningar som hotar
        marginalen och innehållsändringar kräver ditt beslut nedan — lager
        (slut/återställd) och borttagna listningar sköts automatiskt och syns
        under <a href="#lager">Lager &amp; synlighet</a> och i{" "}
        <a href="#logg">händelseloggen</a>.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 10,
          marginTop: 16,
        }}
      >
        <Stat label="Senaste körning" value={fmtTime(recentLog[0]?.checkedAt)} />
        <Stat label="Nästa körning" value={`ca ${nextSyncRun(now)}`} />
        <Stat label="Kollade senaste dygnet" value={checked24h >= 300 ? "300+" : String(checked24h)} />
        <Stat label="Öppna alerts" value={String(allAlerts.length)} valueColor={allAlerts.length > 0 ? "#d97706" : "#16a34a"} />
        <Stat label="Slut i lager" value={String(oosCount)} valueColor={oosCount > 0 ? "#d97706" : "#16a34a"} />
        <Stat label="Dolda (borttagna)" value={String(removedCount)} />
        <Stat label="Felsviter pågår" value={String(errorCount)} valueColor={errorCount > 0 ? "#dc2626" : "#16a34a"} />
      </div>

      <FilterBar current={filter} totals={{ all: allAlerts.length, price: allAlerts.filter((a) => a.alertType === "price_increase").length, content: allAlerts.filter((a) => a.alertType === "content_change").length }} />

      {filtered.length === 0 ? (
        <p style={{ color: "#888", marginTop: 16 }}>Inga öppna alerts att granska. ✅</p>
      ) : null}

      {priceAlertsAlla.length > 0 ? (
        <section style={{ marginTop: 20 }}>
          <div style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>
            Marginal efter höjningen — klicka för att filtrera. Räknad{" "}
            <strong>netto mot netto</strong>: både priset och inköpspriset bär moms,
            och momsen på inköpet är aldrig en verklig kostnad för ett
            momsregistrerat företag.
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, fontSize: 12 }}>
            {valtBand ? (
              <Link
                href="/admin/sync-alerts?filter=price"
                style={{ padding: "4px 10px", borderRadius: 999, border: "1px solid #d1d5db", textDecoration: "none", color: "#374151" }}
              >
                Visa alla ({priceAlertsAlla.length})
              </Link>
            ) : null}
            {bandRader.map(({ band, count }) => {
              const aktiv = valtBand === band.id;
              return (
                <Link
                  key={band.id}
                  href={`/admin/sync-alerts?filter=price&band=${band.id}`}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    border: `1px solid ${band.color}`,
                    background: aktiv ? band.color : count > 0 ? `${band.color}18` : "transparent",
                    color: aktiv ? "#fff" : count > 0 ? band.color : "#9ca3af",
                    textDecoration: "none",
                    pointerEvents: count > 0 || aktiv ? "auto" : "none",
                  }}
                >
                  {band.label} · {count}
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {priceAlerts.length > 0 ? (
        <section style={{ marginTop: 24 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <h2 style={{ margin: 0 }}>Prishöjningar ({priceAlerts.length})</h2>
            {priceAlerts.length > 1 ? <BulkApproveForm alerts={priceAlerts} /> : null}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
            {priceAlerts.map((a) => <PriceAlertCard key={a.id} alert={a} margin={marginalFor(a)} recommended={rekommenderatFor(a)} slug={a.productSlug ?? products.get(a.wixProductId)?.slug} />)}
          </div>
        </section>
      ) : null}

      {contentAlerts.length > 0 ? (
        <section style={{ marginTop: 32 }}>
          <h2>Innehållsändringar ({contentAlerts.length})</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
            {contentAlerts.map((a) => <ContentAlertCard key={a.id} alert={a} slug={a.productSlug ?? products.get(a.wixProductId)?.slug} />)}
          </div>
        </section>
      ) : null}

      <section id="lager" style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 16 }}>Lager &amp; synlighet ({problemStates.length})</h2>
        <p style={{ fontSize: 12, color: "#666" }}>
          Produkter som synken just nu håller i specialläge: slut i lager hos
          leverantören (0-saldo på sajten, återställs automatiskt vid restock),
          dolda för att listningen försvunnit, eller mitt i en felsvit (5 raka
          fel ⇒ behandlas som borttagen).
        </p>
        {problemStates.length === 0 ? (
          <p style={{ color: "#888", fontSize: 13 }}>Alla mappade produkter är aktiva. ✅</p>
        ) : (
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", marginTop: 8 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", color: "#666" }}>
                <th style={{ padding: "4px 6px" }}>Produkt</th>
                <th style={{ padding: "4px 6px" }}>Status</th>
                <th style={{ padding: "4px 6px" }}>Lager hos leverantör</th>
                <th style={{ padding: "4px 6px" }}>Senast kollad</th>
              </tr>
            </thead>
            <tbody>
              {problemStates.map((s) => {
                const p = products.get(s.wixProductId);
                return (
                  <tr key={s.wixProductId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "5px 6px" }}>
                      <ProductCell name={p?.name} wixProductId={s.wixProductId} aliexpressId={s.aliexpressId} slug={p?.slug} />
                    </td>
                    <td style={{ padding: "5px 6px" }}>
                      <StateBadge state={s} />
                    </td>
                    <td style={{ padding: "5px 6px" }}>{s.currentStock ?? "—"}</td>
                    <td style={{ padding: "5px 6px", fontFamily: "monospace" }}>{fmtTime(s.lastCheckedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <section id="logg" style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 16 }}>Händelselogg</h2>
        <p style={{ fontSize: 12, color: "#666" }}>
          Varje synk-koll loggas. Fliken <b>Prisändringar</b> visar alla kollar
          där inköpskostnaden faktiskt ändrades, <b>Lagerändringar</b> alla där
          saldot ändrades eller en lager-åtgärd togs.
        </p>
        <LogTabs current={logMode} filter={filter} totals={{ all: recentLog.length, price: priceRows.length, stock: stockRows.length }} />
        <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", marginTop: 8 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", color: "#666" }}>
              <th style={{ padding: "4px 6px" }}>Tid</th>
              <th style={{ padding: "4px 6px" }}>Produkt</th>
              <th style={{ padding: "4px 6px" }}>Inköp (SEK)</th>
              <th style={{ padding: "4px 6px" }}>Lager</th>
              <th style={{ padding: "4px 6px" }}>Åtgärd</th>
              <th style={{ padding: "4px 6px" }}>Not</th>
            </tr>
          </thead>
          <tbody>
            {logRows.map((row) => {
              const p = products.get(row.productId);
              return (
                <tr key={row.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "5px 6px", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                    {row.checkedAt.slice(5, 16).replace("T", " ")}
                  </td>
                  <td style={{ padding: "5px 6px" }}>
                    <ProductCell name={p?.name} wixProductId={row.productId} aliexpressId={row.aliexpressId} slug={p?.slug} />
                  </td>
                  <td style={{ padding: "5px 6px", whiteSpace: "nowrap" }}>
                    <Delta prev={row.prevCostSek} next={row.newCostSek} unit=" kr" upIsBad />
                  </td>
                  <td style={{ padding: "5px 6px", whiteSpace: "nowrap" }}>
                    <Delta prev={row.prevStock} next={row.newStock} unit="" />
                  </td>
                  <td style={{ padding: "5px 6px" }}>
                    <ActionBadge action={row.actionTaken} />
                  </td>
                  <td style={{ padding: "5px 6px", color: "#555" }}>{row.notes ?? ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {logRows.length === 0 ? (
          <p style={{ color: "#888", fontSize: 13, marginTop: 8 }}>
            Inga {logMode === "price" ? "prisändringar" : logMode === "stock" ? "lagerändringar" : "händelser"} i de {recentLog.length} senaste kollarna.
          </p>
        ) : null}
      </section>
    </main>
  );
}

/** Produktnamn + länkar till AliExpress-ursprunget och live-sidan. */
function ProductCell({
  name,
  wixProductId,
  aliexpressId,
  slug,
}: {
  name?: string;
  wixProductId: string;
  aliexpressId?: string;
  slug?: string;
}) {
  return (
    <div>
      <div style={{ fontWeight: 600 }}>{name ?? <code>{wixProductId.slice(0, 14)}…</code>}</div>
      <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
        {aliexpressId ? (
          <a href={aeUrl(aliexpressId)} target="_blank" rel="noopener noreferrer" style={{ color: "#d97706" }}>
            AliExpress ↗
          </a>
        ) : null}
        {slug ? (
          <a href={fpUrl(slug)} target="_blank" rel="noopener noreferrer" style={{ color: "#0891b2" }}>
            Fyndplats ↗
          </a>
        ) : null}
      </div>
    </div>
  );
}

function StateBadge({ state }: { state: SyncStateEntry }) {
  if (state.listingStatus === "removed") {
    return <Badge color="#dc2626">Dold — listning borttagen</Badge>;
  }
  if (state.listingStatus === "out_of_stock") {
    const since = state.outOfStockSince ? ` sedan ${fmtTime(state.outOfStockSince)}` : "";
    return <Badge color="#d97706">Slut i lager{since}</Badge>;
  }
  if ((state.errorStreak ?? 0) > 0) {
    return <Badge color="#dc2626">⚠ {state.errorStreak} raka fel (5 ⇒ behandlas som borttagen, lagret nollas)</Badge>;
  }
  return <Badge color="#94a3b8">{state.listingStatus}</Badge>;
}

function ActionBadge({ action }: { action: SyncLogEntry["actionTaken"] }) {
  const a = ACTION_SV[action] ?? { label: action, color: "#94a3b8" };
  if (action === "none") return <span style={{ color: a.color }}>{a.label}</span>;
  return <Badge color={a.color}>{a.label}</Badge>;
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      style={{
        background: `${color}1a`,
        color,
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

/** Förändringscell: "12 → 9" färgkodad. Bara nya värdet när inget ändrats. */
function Delta({
  prev,
  next,
  unit,
  upIsBad,
}: {
  prev: number | null;
  next: number | null;
  unit: string;
  upIsBad?: boolean;
}) {
  if (next == null && prev == null) return <span style={{ color: "#cbd5e1" }}>—</span>;
  if (prev == null || next == null || prev === next) {
    return <span>{(next ?? prev)?.toFixed(0)}{unit}</span>;
  }
  const up = next > prev;
  const color = (up && upIsBad) || (!up && !upIsBad) ? "#dc2626" : "#16a34a";
  return (
    <span>
      <span style={{ color: "#94a3b8" }}>{prev.toFixed(0)}{unit}</span>
      {" → "}
      <b style={{ color }}>{next.toFixed(0)}{unit}</b>
    </span>
  );
}

function Stat({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px" }}>
      <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: 17, color: valueColor ?? "#1f2937" }}>{value}</div>
    </div>
  );
}

function FilterBar({
  current,
  totals,
}: {
  current: FilterMode;
  totals: { all: number; price: number; content: number };
}) {
  const links: { mode: FilterMode; label: string; count: number }[] = [
    { mode: "all", label: "Alla", count: totals.all },
    { mode: "price", label: "Endast prishöjningar", count: totals.price },
    { mode: "content", label: "Endast innehållsändringar", count: totals.content },
  ];
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 16, fontSize: 13 }}>
      {links.map((l) => {
        const active = current === l.mode;
        return (
          <Link
            key={l.mode}
            href={l.mode === "all" ? "/admin/sync-alerts" : `/admin/sync-alerts?filter=${l.mode}`}
            style={{
              padding: "5px 11px",
              borderRadius: 6,
              background: active ? "#1f2937" : "#f1f5f9",
              color: active ? "#fff" : "#1f2937",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            {l.label} ({l.count})
          </Link>
        );
      })}
    </div>
  );
}

function LogTabs({
  current,
  filter,
  totals,
}: {
  current: LogMode;
  filter: FilterMode;
  totals: { all: number; price: number; stock: number };
}) {
  const links: { mode: LogMode; label: string; count: number }[] = [
    { mode: "all", label: "Alla händelser", count: totals.all },
    { mode: "price", label: "Prisändringar", count: totals.price },
    { mode: "stock", label: "Lagerändringar", count: totals.stock },
  ];
  const filterQ = filter !== "all" ? `filter=${filter}&` : "";
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 10, fontSize: 13 }}>
      {links.map((l) => {
        const active = current === l.mode;
        const q = l.mode === "all" ? (filterQ ? `?${filterQ.slice(0, -1)}` : "") : `?${filterQ}log=${l.mode}`;
        return (
          <Link
            key={l.mode}
            href={`/admin/sync-alerts${q}#logg`}
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              background: active ? "#1f2937" : "#f1f5f9",
              color: active ? "#fff" : "#1f2937",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            {l.label} ({l.count})
          </Link>
        );
      })}
    </div>
  );
}

function BulkApproveForm({ alerts }: { alerts: SyncAlert[] }) {
  const total = alerts.length;
  const totalMarginAfter =
    alerts.reduce((sum, a) => sum + (a.projectedMarginPct ?? 0), 0) / Math.max(1, total);
  // <details>-mönster för bekräftelse — server actions utan klient-JS.
  return (
    <details style={{ fontSize: 13 }}>
      <summary
        style={{
          cursor: "pointer",
          padding: "6px 12px",
          background: "#10b981",
          color: "#fff",
          borderRadius: 6,
          listStyle: "none",
          fontWeight: 600,
        }}
      >
        Godkänn alla {total} prishöjningar
      </summary>
      <div
        style={{
          marginTop: 8,
          background: "#ecfdf5",
          border: "1px solid #a7f3d0",
          borderRadius: 8,
          padding: 12,
        }}
      >
        <p style={{ margin: 0, fontSize: 13 }}>
          Du är på väg att godkänna <b>{total}</b> rekommenderade prishöjningar.
          Genomsnittlig projicerad marginal efter höjningen: <b>{totalMarginAfter.toFixed(1)}%</b>.
        </p>
        <form action={bulkApprovePrices} style={{ marginTop: 10 }}>
          {alerts.map((a) => (
            <input key={a.id} type="hidden" name="alertId" value={a.id} />
          ))}
          <button
            type="submit"
            style={{
              background: "#10b981",
              color: "#fff",
              border: "none",
              padding: "6px 14px",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Bekräfta — godkänn alla {total}
          </button>
        </form>
      </div>
    </details>
  );
}

/** Länkrad på beslutskorten: ursprunget hos AliExpress + live-sidan. */
function AlertLinks({ alert, slug }: { alert: SyncAlert; slug?: string }) {
  return (
    <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 12 }}>
      <a href={aeUrl(alert.aliexpressId)} target="_blank" rel="noopener noreferrer" style={{ color: "#d97706", fontWeight: 600 }}>
        Öppna på AliExpress ↗
      </a>
      {slug ? (
        <a href={fpUrl(slug)} target="_blank" rel="noopener noreferrer" style={{ color: "#0891b2", fontWeight: 600 }}>
          Visa på Fyndplats ↗
        </a>
      ) : null}
    </div>
  );
}

function PriceAlertCard({
  alert,
  slug,
  margin: marginIn,
  recommended,
}: {
  alert: SyncAlert;
  slug?: string;
  /** Omräknad marginal (netto mot netto). Se noten vid marginalFor. */
  margin?: number | null;
  /** Omräknat prisförslag mot målmarginalen. Se noten vid rekommenderatFor. */
  recommended?: number | null;
}) {
  const rekommenderat = recommended ?? alert.recommendedPriceSek ?? 0;
  const sevColor = SEVERITY_COLOR[alert.severity];
  const margin = marginIn ?? alert.projectedMarginPct ?? 0;
  const change = (alert.prevCostUsd ?? 0) > 0 && alert.newCostUsd != null
    ? ((alert.newCostUsd - alert.prevCostUsd!) / alert.prevCostUsd!) * 100
    : 0;

  return (
    <div
      style={{
        border: `1px solid ${sevColor}33`,
        borderLeft: `4px solid ${sevColor}`,
        borderRadius: 8,
        background: "#fff",
        padding: 14,
        display: "flex",
        gap: 14,
      }}
    >
      <Thumb url={alert.imageUrl} />
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>
              {alert.productName ?? alert.wixProductId}
            </div>
            <AlertLinks alert={alert} slug={slug} />
          </div>
          <SeverityBadge severity={alert.severity} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 10,
            marginTop: 12,
            fontSize: 13,
          }}
        >
          <Metric
            label="Nuvarande pris"
            value={`${(alert.currentPriceSek ?? 0).toFixed(0)} kr`}
          />
          <Metric
            label="Ursprungs-kost. USD"
            value={(alert.prevCostUsd ?? 0).toFixed(2)}
          />
          <Metric
            label="Nytt inköp USD"
            value={(alert.newCostUsd ?? 0).toFixed(2)}
            sub={change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`}
            subColor={change > 0 ? "#dc2626" : "#16a34a"}
          />
          <Metric
            label="Marginal efter höjning"
            value={`${margin.toFixed(1)}%`}
            valueColor={margin < 0 ? "#dc2626" : margin < 20 ? "#d97706" : "#16a34a"}
          />
        </div>

        <div
          style={{
            marginTop: 12,
            padding: 10,
            background: "#f8fafc",
            borderRadius: 6,
            fontSize: 13,
          }}
        >
          Rekommenderat nytt pris:{" "}
          <b>{rekommenderat.toFixed(0)} kr</b>{" "}
          (ger {TARGET_MARGIN_PCT.toLocaleString("sv-SE")} % marginal)
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <form action={approveNewPrice}>
            <input type="hidden" name="alertId" value={alert.id} />
            <input type="hidden" name="wixProductId" value={alert.wixProductId} />
            <input type="hidden" name="newPriceSek" value={rekommenderat || ""} />
            <button type="submit" style={btn("#16a34a")}>
              Godkänn nytt pris
            </button>
          </form>
          <form action={keepCurrentPrice}>
            <input type="hidden" name="alertId" value={alert.id} />
            <input type="hidden" name="wixProductId" value={alert.wixProductId} />
            <button type="submit" style={btn("#64748b")}>
              Behåll nuvarande pris
            </button>
          </form>
          <form action={removeProduct}>
            <input type="hidden" name="alertId" value={alert.id} />
            <input type="hidden" name="wixProductId" value={alert.wixProductId} />
            <button type="submit" style={btn("#dc2626")}>
              Ta bort produkt
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function ContentAlertCard({ alert, slug }: { alert: SyncAlert; slug?: string }) {
  const bits: string[] = [];
  if (alert.titleChanged) bits.push("titel ändrad");
  if (alert.imageChanged) bits.push("bilder ändrade");
  const label = bits.join(" + ") || "innehåll ändrat";
  return (
    <div
      style={{
        border: "1px solid #fde68a",
        borderLeft: "4px solid #d97706",
        borderRadius: 8,
        background: "#fefce8",
        padding: 14,
        display: "flex",
        gap: 14,
      }}
    >
      <Thumb url={alert.imageUrl} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>
          {alert.productName ?? alert.wixProductId}
        </div>
        <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
          Innehåll ändrat hos leverantör — {label}.
        </div>
        <AlertLinks alert={alert} slug={slug} />
        {alert.newTitle ? (
          <div
            style={{
              marginTop: 8,
              fontSize: 13,
              padding: "8px 10px",
              background: "#fff",
              border: "1px solid #fde68a",
              borderRadius: 6,
            }}
          >
            <b>Ny titel hos AliExpress:</b> {alert.newTitle}
          </div>
        ) : null}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <form action={dismissContentAlert}>
            <input type="hidden" name="alertId" value={alert.id} />
            <input type="hidden" name="wixProductId" value={alert.wixProductId} />
            <button type="submit" style={btn("#64748b")}>
              Ignorera (behåll vår version)
            </button>
          </form>
          <form action={removeProduct}>
            <input type="hidden" name="alertId" value={alert.id} />
            <input type="hidden" name="wixProductId" value={alert.wixProductId} />
            <button type="submit" style={btn("#dc2626")}>
              Ta bort produkt
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Thumb({ url }: { url?: string }) {
  if (!url) {
    return (
      <div
        style={{
          width: 70,
          height: 70,
          background: "#f1f5f9",
          borderRadius: 6,
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      style={{ width: 70, height: 70, objectFit: "cover", borderRadius: 6, flexShrink: 0 }}
    />
  );
}

function SeverityBadge({ severity }: { severity: SyncAlert["severity"] }) {
  const color = SEVERITY_COLOR[severity];
  return (
    <span
      style={{
        background: color,
        color: "#fff",
        padding: "2px 9px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        height: "fit-content",
      }}
    >
      {SEVERITY_LABEL[severity]}
    </span>
  );
}

function Metric({
  label,
  value,
  sub,
  subColor,
  valueColor,
}: {
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
  valueColor?: string;
}) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </div>
      <div style={{ fontWeight: 700, fontSize: 16, color: valueColor ?? "#1f2937" }}>
        {value}
      </div>
      {sub ? (
        <div style={{ fontSize: 11, color: subColor ?? "#666", fontWeight: 600 }}>{sub}</div>
      ) : null}
    </div>
  );
}

function btn(bg: string): React.CSSProperties {
  return {
    background: bg,
    color: "#fff",
    border: "none",
    padding: "6px 14px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  };
}
