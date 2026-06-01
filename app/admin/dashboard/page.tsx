// app/admin/dashboard/page.tsx
// Morgon-dashboard: Leonards viktigaste siffror på ETT ställe. Skyddad av proxy.ts
// (ADMIN_SECRET / fp_admin-cookie). noindex.
//
// Hämtar all data parallellt via lib/dashboard#buildDashboard (som i sin tur kör
// Promise.all över varje källa och degraderar trasiga sektioner oberoende).
// ISR: revalidate 60s — "Uppdatera"-knappen kör router.refresh() för färska siffror.

import { buildDashboard, sek, type DashboardData } from "../../../lib/dashboard";
import { Sparkline } from "./Sparkline";
import { QuickActions } from "./QuickActions";

export const metadata = { robots: { index: false, follow: false } };
export const revalidate = 60;

const COLORS = { ink: "#1c1c1c", muted: "#777", warn: "#b42318", ok: "#16804a", brand: "#C2410C" };

function Card({ children, pad = 16 }: { children: React.ReactNode; pad?: number }) {
  return <div style={{ border: "1px solid #eee", borderRadius: 12, padding: pad, background: "#fff" }}>{children}</div>;
}

function Stat({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: string; tone?: "ok" | "warn" }) {
  const color = tone === "warn" ? COLORS.warn : tone === "ok" ? COLORS.ok : COLORS.ink;
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 10, padding: "14px 16px", minWidth: 150, flex: "1 1 150px" }}>
      <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: 17, margin: "32px 0 12px", color: COLORS.ink }}>{children}</h2>;
}

function Note({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 12, color: COLORS.muted, margin: "8px 0 0", fontStyle: "italic" }}>{children}</p>;
}

export default async function DashboardPage() {
  let d: DashboardData | null = null;
  let error: string | null = null;
  try {
    d = await buildDashboard();
  } catch (e) {
    error = (e as Error).message;
  }

  if (!d) {
    return (
      <section style={{ maxWidth: 980, margin: "40px auto", padding: "0 20px", fontFamily: "system-ui" }}>
        <h1>Morgon-dashboard</h1>
        <p style={{ color: COLORS.warn }}>Kunde inte bygga dashboarden: {error}</p>
      </section>
    );
  }

  const { orders, inventory, abandoned, newsletter, analytics, marketing, service } = d;
  const orderTrend = orders.trend7d.map((p) => p.orders);
  const revTrend = orders.trend7d.map((p) => p.revenueMinor / 100);

  return (
    <section style={{ maxWidth: 980, margin: "32px auto 64px", padding: "0 20px", fontFamily: "system-ui", color: COLORS.ink }}>
      <h1 style={{ marginBottom: 2 }}>God morgon ☀️</h1>
      <p style={{ color: COLORS.muted, marginTop: 0, fontSize: 13 }}>
        Genererad {new Date(d.generatedAt).toLocaleString("sv-SE", { timeZone: "Europe/Stockholm" })} · alla siffror i svensk tid
      </p>

      {/* tl;dr varningar */}
      <div
        style={{
          background: d.warnings.length ? "#fff5f5" : "#f0fdf4",
          border: `1px solid ${d.warnings.length ? "#f3c2c2" : "#bbf7d0"}`,
          borderRadius: 10,
          padding: "12px 16px",
          margin: "14px 0 8px",
        }}
      >
        <strong style={{ color: d.warnings.length ? COLORS.warn : "#166534" }}>
          {d.warnings.length ? `⚠️ ${d.warnings.length} sak(er) att kolla` : "✅ Inga akuta varningar"}
        </strong>
        {d.warnings.length > 0 && (
          <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
            {d.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Snabbåtgärder */}
      <div style={{ margin: "16px 0 8px" }}>
        <QuickActions />
      </div>

      {/* 1. Senaste 24h */}
      <SectionTitle>1 · Senaste 24 timmarna</SectionTitle>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Stat label="Ordrar" value={orders.last24h.orders} />
        <Stat label="Omsättning" value={sek(orders.last24h.revenueMinor)} />
        <Stat label="Snittordervärde (AOV)" value={sek(orders.last24h.aov)} />
        <Stat
          label="Konvertering"
          value={analytics.connected && analytics.conversionPct != null ? `${analytics.conversionPct}%` : "—"}
          sub={analytics.connected ? undefined : "kräver GA4"}
        />
        <Stat
          label="Nya besökare"
          value={analytics.connected && analytics.visitors24h != null ? analytics.visitors24h : "—"}
          sub={analytics.connected ? undefined : "kräver GA4"}
        />
      </div>
      <div style={{ marginTop: 12 }}>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Topp 3 sålda produkter (24h)</div>
          {orders.topProducts.length === 0 ? (
            <p style={{ color: COLORS.muted, fontSize: 13, margin: 0 }}>Inga ordrar senaste dygnet.</p>
          ) : (
            <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14 }}>
              {orders.topProducts.map((p, i) => (
                <li key={i} style={{ marginBottom: 2 }}>
                  {p.name} — <strong>{p.qty} st</strong> ({sek(p.revenueMinor)})
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
      <Card pad={14}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", marginTop: 12 }}>
          <div style={{ fontSize: 13 }}>
            <div style={{ color: COLORS.muted, marginBottom: 2 }}>Ej återhämtade kundvagnar (24h)</div>
            <strong style={{ fontSize: 20, color: abandoned.notRecovered24h ? COLORS.warn : COLORS.ink }}>
              {abandoned.available ? abandoned.notRecovered24h : "—"}
            </strong>
            {abandoned.available && (
              <span style={{ color: COLORS.muted, marginLeft: 8, fontSize: 12 }}>
                ({abandoned.pendingTotal} pågående i flödet)
              </span>
            )}
          </div>
        </div>
        {!abandoned.available && <Note>Övergivna kundvagnar otillgängliga: {abandoned.note}</Note>}
      </Card>
      {orders.note && <Note>{orders.note}</Note>}

      {/* 2. Senaste 7 dagar */}
      <SectionTitle>2 · Senaste 7 dagarna</SectionTitle>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Card>
          <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 6 }}>Order-trend</div>
          <Sparkline values={orderTrend} />
          <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 4 }}>
            {orderTrend.reduce((a, b) => a + b, 0)} ordrar totalt
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 6 }}>Omsättnings-trend</div>
          <Sparkline values={revTrend} color="#16804a" fill="#e7f6ee" />
          <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 4 }}>
            {sek(orders.trend7d.reduce((a, b) => a + b.revenueMinor, 0))} totalt
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 6 }}>Trafik-källor (24h)</div>
          {analytics.connected && analytics.topSources?.length ? (
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
              {analytics.topSources.map((s, i) => (
                <li key={i}>
                  {s.source} — {s.sessions}
                </li>
              ))}
            </ol>
          ) : (
            <p style={{ color: COLORS.muted, fontSize: 12, margin: 0 }}>
              {analytics.note ?? "Ej kopplat."}
            </p>
          )}
        </Card>
      </div>
      <div style={{ marginTop: 12 }}>
        <Card>
          <div style={{ fontSize: 13 }}>
            <strong>Returer (7d):</strong>{" "}
            {service.returnsAvailable ? service.openReturns : <span style={{ color: COLORS.muted }}>ingen data</span>}
          </div>
          {service.returnsNote && <Note>{service.returnsNote}</Note>}
        </Card>
      </div>

      {/* 3. Lagervarningar */}
      <SectionTitle>3 · Lagervarningar</SectionTitle>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Stat label="Produkter totalt" value={inventory.total} />
        <Stat label="Lågt lager (<5)" value={inventory.lowStock.length} tone={inventory.lowStock.length ? "warn" : "ok"} />
        <Stat label="Slut i lager" value={inventory.outOfStock.length} tone={inventory.outOfStock.length ? "warn" : "ok"} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginTop: 12 }}>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Lågt lager — fyll på</div>
          {inventory.lowStock.length === 0 ? (
            <p style={{ color: COLORS.ok, fontSize: 13, margin: 0 }}>Inget lågt lager.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
              {inventory.lowStock.slice(0, 15).map((p) => (
                <li key={p.slug}>
                  <a href={`/produkt/${p.slug}`} style={{ color: COLORS.ink }}>{p.name}</a> — {p.qty} kvar
                </li>
              ))}
              {inventory.lowStock.length > 15 && <li style={{ color: COLORS.muted }}>+{inventory.lowStock.length - 15} till…</li>}
            </ul>
          )}
        </Card>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Slut i lager — överväg auto-dölj</div>
          {inventory.outOfStock.length === 0 ? (
            <p style={{ color: COLORS.ok, fontSize: 13, margin: 0 }}>Inget slut i lager.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
              {inventory.outOfStock.slice(0, 15).map((p) => (
                <li key={p.slug}>
                  <a href={`/produkt/${p.slug}`} style={{ color: COLORS.ink }}>{p.name}</a>
                </li>
              ))}
              {inventory.outOfStock.length > 15 && <li style={{ color: COLORS.muted }}>+{inventory.outOfStock.length - 15} till…</li>}
            </ul>
          )}
        </Card>
      </div>
      <Note>{inventory.staleNote}</Note>
      <Note>{inventory.syncFailNote}</Note>

      {/* 4. Kundservice */}
      <SectionTitle>4 · Kundservice</SectionTitle>
      <Card>
        <p style={{ fontSize: 13, margin: "0 0 6px" }}>{service.unreadInboxNote}</p>
        <p style={{ fontSize: 13, margin: 0 }}>
          <strong>Pågående returer:</strong>{" "}
          {service.returnsAvailable ? service.openReturns : <span style={{ color: COLORS.muted }}>ingen returns-källa</span>}
        </p>
      </Card>

      {/* 5. Marknadsföring */}
      <SectionTitle>5 · Marknadsföring</SectionTitle>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Stat
          label="Meta Ads-kostnad (igår)"
          value={marketing.metaConnected && marketing.metaSpendYesterday != null ? `${marketing.metaSpendYesterday.toLocaleString("sv-SE")} kr` : "—"}
        />
        <Stat
          label="ROAS"
          value={marketing.metaConnected && marketing.metaRoas != null ? `${marketing.metaRoas}×` : "—"}
        />
        <Stat
          label="GA4 konvertering"
          value={analytics.connected && analytics.conversionPct != null ? `${analytics.conversionPct}%` : "—"}
        />
        <Stat
          label="Nya nyhetsbrevs-pren. (7d)"
          value={newsletter.available ? newsletter.new7d : "—"}
          sub={newsletter.available ? `${newsletter.total} totalt` : undefined}
        />
      </div>
      {!marketing.metaConnected && <Note>Meta Ads: {marketing.note}</Note>}
      {!analytics.connected && <Note>GA4: {analytics.note}</Note>}
      {!newsletter.available && <Note>Nyhetsbrev: {newsletter.note}</Note>}

      <p style={{ marginTop: 40, fontSize: 12, color: COLORS.muted }}>
        Order-källa: <code>{orders.source}</code>. Daglig kopia kl 08:00 (svensk sommartid) via /api/cron/morning-email.
      </p>
    </section>
  );
}
