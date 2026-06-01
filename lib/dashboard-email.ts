// lib/dashboard-email.ts
// Renderar morgonmejlet (tl;dr av dashboarden) från DashboardData. Inga charts —
// 7-dagars trend visas som ren ASCII-sparkline (▁▂▃▄▅▆▇█) som renderar i alla
// mejlklienter. Skickas ALLTID, även när allt är 0, så Leonard vet att cronet kör.

import { sek, type DashboardData } from "./dashboard";

const SITE = "https://www.fyndplats.se";

// Unicode block-element sparkline. Tom array → en rad bindestreck.
const BLOCKS = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];
function asciiSparkline(values: number[]): string {
  if (!values.length) return "—";
  const max = Math.max(...values);
  if (max <= 0) return "▁".repeat(values.length);
  return values.map((v) => BLOCKS[Math.min(BLOCKS.length - 1, Math.round((v / max) * (BLOCKS.length - 1)))]).join("");
}

export function morningEmailSubject(d: DashboardData): string {
  const o = d.orders.last24h;
  const head = `${o.orders} ordrar · ${sek(o.revenueMinor)}`;
  const warn = d.warnings.length ? ` · ⚠️ ${d.warnings.length}` : "";
  return `God morgon — ${head}${warn} (Fyndplats)`;
}

export function renderMorningEmailText(d: DashboardData): string {
  const o = d.orders.last24h;
  const orderSpark = asciiSparkline(d.orders.trend7d.map((p) => p.orders));
  const revSpark = asciiSparkline(d.orders.trend7d.map((p) => p.revenueMinor));
  const lines: string[] = [];
  lines.push("GOD MORGON ☀️  — Fyndplats daglig sammanfattning");
  lines.push(new Date(d.generatedAt).toLocaleString("sv-SE", { timeZone: "Europe/Stockholm" }));
  lines.push("");
  lines.push("── SENASTE 24H ─────────────────────────");
  lines.push(`Ordrar:       ${o.orders}`);
  lines.push(`Omsättning:   ${sek(o.revenueMinor)}`);
  lines.push(`AOV:          ${sek(o.aov)}`);
  if (d.analytics.connected) {
    lines.push(`Besökare:     ${d.analytics.visitors24h ?? "—"}`);
    lines.push(`Konvertering: ${d.analytics.conversionPct != null ? d.analytics.conversionPct + "%" : "—"}`);
  }
  if (d.abandoned.available) lines.push(`Ej återhämtade kundvagnar (24h): ${d.abandoned.notRecovered24h}`);
  lines.push("");
  if (d.orders.topProducts.length) {
    lines.push("Topp 3 sålda (24h):");
    d.orders.topProducts.forEach((p, i) => lines.push(`  ${i + 1}. ${p.name} — ${p.qty} st`));
    lines.push("");
  }
  lines.push("── 7-DAGARS TREND ──────────────────────");
  lines.push(`Ordrar:      ${orderSpark}`);
  lines.push(`Omsättning:  ${revSpark}`);
  lines.push("");
  lines.push("── TOPP-VARNINGAR ──────────────────────");
  if (d.warnings.length) d.warnings.forEach((w) => lines.push(`  ⚠️  ${w}`));
  else lines.push("  ✅ Inga akuta varningar.");
  lines.push("");
  lines.push(`Lågt lager: ${d.inventory.lowStock.length} · Slut i lager: ${d.inventory.outOfStock.length}`);
  if (d.newsletter.available) lines.push(`Nya nyhetsbrevs-pren. (7d): ${d.newsletter.new7d}`);
  lines.push("");
  lines.push(`Full vy: ${SITE}/admin/dashboard`);
  return lines.join("\n");
}

export function renderMorningEmailHtml(d: DashboardData): string {
  const o = d.orders.last24h;
  const orderSpark = asciiSparkline(d.orders.trend7d.map((p) => p.orders));
  const revSpark = asciiSparkline(d.orders.trend7d.map((p) => p.revenueMinor));
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const stat = (label: string, value: string) =>
    `<td style="padding:8px 14px;border:1px solid #eee;border-radius:8px;">
       <div style="font-size:11px;color:#777;">${label}</div>
       <div style="font-size:20px;font-weight:700;color:#1c1c1c;">${value}</div>
     </td>`;

  const top = d.orders.topProducts.length
    ? `<ol style="margin:6px 0 0;padding-left:20px;font-size:14px;color:#1c1c1c;">${d.orders.topProducts
        .map((p) => `<li>${esc(p.name)} — <strong>${p.qty} st</strong> (${sek(p.revenueMinor)})</li>`)
        .join("")}</ol>`
    : `<p style="font-size:13px;color:#777;margin:6px 0 0;">Inga ordrar senaste dygnet.</p>`;

  const warnings = d.warnings.length
    ? `<ul style="margin:6px 0 0;padding-left:20px;color:#b42318;font-size:14px;">${d.warnings
        .map((w) => `<li>${esc(w)}</li>`)
        .join("")}</ul>`
    : `<p style="color:#166534;font-size:14px;margin:6px 0 0;">✅ Inga akuta varningar.</p>`;

  return `<!doctype html><html><body style="margin:0;background:#faf8f6;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <h1 style="font-size:22px;margin:0 0 2px;color:#1c1c1c;">God morgon ☀️</h1>
    <p style="font-size:12px;color:#777;margin:0 0 16px;">${new Date(d.generatedAt).toLocaleString("sv-SE", { timeZone: "Europe/Stockholm" })} · daglig sammanfattning</p>

    <div style="background:${d.warnings.length ? "#fff5f5" : "#f0fdf4"};border:1px solid ${d.warnings.length ? "#f3c2c2" : "#bbf7d0"};border-radius:10px;padding:12px 16px;margin-bottom:16px;">
      <strong style="color:${d.warnings.length ? "#b42318" : "#166534"};">${d.warnings.length ? `⚠️ ${d.warnings.length} sak(er) att kolla` : "Allt lugnt"}</strong>
      ${warnings}
    </div>

    <h2 style="font-size:15px;color:#1c1c1c;margin:0 0 8px;">Senaste 24 timmarna</h2>
    <table style="border-collapse:separate;border-spacing:6px 0;margin-bottom:14px;"><tr>
      ${stat("Ordrar", String(o.orders))}
      ${stat("Omsättning", sek(o.revenueMinor))}
      ${stat("AOV", sek(o.aov))}
      ${d.abandoned.available ? stat("Ej återh. vagnar", String(d.abandoned.notRecovered24h)) : ""}
    </tr></table>

    <div style="border:1px solid #eee;border-radius:10px;padding:12px 16px;margin-bottom:14px;">
      <div style="font-size:13px;font-weight:600;color:#1c1c1c;">Topp 3 sålda (24h)</div>
      ${top}
    </div>

    <h2 style="font-size:15px;color:#1c1c1c;margin:0 0 8px;">7-dagars trend</h2>
    <div style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:18px;letter-spacing:2px;color:#C2410C;line-height:1.6;margin-bottom:6px;">
      <span style="display:inline-block;width:110px;font-size:12px;color:#777;font-family:system-ui;">Ordrar</span> ${orderSpark}<br/>
      <span style="display:inline-block;width:110px;font-size:12px;color:#777;font-family:system-ui;">Omsättning</span> <span style="color:#16804a;">${revSpark}</span>
    </div>

    <p style="font-size:13px;color:#1c1c1c;margin:16px 0 0;">
      Lågt lager: <strong>${d.inventory.lowStock.length}</strong> · Slut i lager: <strong>${d.inventory.outOfStock.length}</strong>
      ${d.newsletter.available ? ` · Nya pren. (7d): <strong>${d.newsletter.new7d}</strong>` : ""}
    </p>

    <p style="margin:24px 0 0;">
      <a href="${SITE}/admin/dashboard" style="display:inline-block;background:#1c1c1c;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Öppna full dashboard →</a>
    </p>
    <p style="font-size:11px;color:#aaa;margin:20px 0 0;">Order-källa: ${d.orders.source}. Detta mejl skickas varje morgon, även när alla siffror är 0.</p>
  </div></body></html>`;
}

export function renderMorningEmail(d: DashboardData): { subject: string; html: string; text: string } {
  return {
    subject: morningEmailSubject(d),
    html: renderMorningEmailHtml(d),
    text: renderMorningEmailText(d),
  };
}
