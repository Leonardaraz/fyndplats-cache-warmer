// Minimal Resend-klient för cache-warmer-appen.
//
// Duplikat av brand-shell-mönstret från fyndplats-headless/emails/_layout.tsx
// — vi vill inte att cache-warmer-appen ska dela kod-paket med headless-appen
// (separata Vercel-projekt, separata deployer). Logo + färger är hårdkodade
// här så att layout-ändringar bara behöver göras på två ställen.
//
// Använder fetch direkt mot Resend REST-API:t istället för @resend/node-sdk
// så vi slipper en ny dependency (paketet är inte i package.json — håll det
// så för cache-warmer).

const RESEND_API = "https://api.resend.com/emails";

const BRAND = {
  primary: "#F47A35",       // Fyndplats orange — matchar /admin-knappar
  bg: "#fff8f3",            // ljus orange bakgrund för shell
  cardBg: "#ffffff",
  text: "#1f2937",
  muted: "#6b7280",
  border: "#e5e7eb",
  logoUrl: "https://fyndplats.se/email-logo",
} as const;

export interface SendEmailInput {
  to: string;
  subject: string;
  /** HTML-body som ska wrappas i brand-shellet. */
  bodyHtml: string;
  /** Plain-text-fallback (för spam-score + accessibility). */
  bodyText: string;
}

export interface SendEmailResult {
  id?: string;
  skipped?: "no_api_key" | "dry_run";
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (process.env.SYNC_EMAIL_DRY_RUN === "true") {
    return { skipped: "dry_run" };
  }
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { skipped: "no_api_key" };

  const from = process.env.RESEND_FROM_ADDRESS ?? "Fyndplats <noreply@fyndplats.se>";

  const res = await fetch(RESEND_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: wrapInBrandShell(input.bodyHtml),
      text: input.bodyText,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend send misslyckades (${res.status}): ${text.slice(0, 300)}`);
  }
  const data = (await res.json()) as { id?: string };
  return { id: data.id };
}

/**
 * Wrappar email-bodyn i Fyndplats brand-shell. Inline-CSS (Gmail/Outlook
 * strippar <style> i många klienter), tabell-baserad layout (Outlook).
 */
export function wrapInBrandShell(bodyHtml: string): string {
  return `<!doctype html>
<html lang="sv">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Fyndplats</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${BRAND.text};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BRAND.bg};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:${BRAND.cardBg};border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;">
          <tr>
            <td align="left" style="padding:20px 24px;border-bottom:1px solid ${BRAND.border};">
              <img src="${BRAND.logoUrl}" alt="Fyndplats" width="120" style="display:block;border:0;outline:none;text-decoration:none;height:auto;max-width:120px;" />
            </td>
          </tr>
          <tr>
            <td style="padding:24px;font-size:15px;line-height:1.55;color:${BRAND.text};">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;border-top:1px solid ${BRAND.border};color:${BRAND.muted};font-size:12px;">
              Detta mejl skickades automatiskt av Fyndplats sync-cron. Klicka inte på okända länkar.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

import type { SyncSummary } from "../sync/aliexpress-sync";
import type { AlternativeSupplier } from "../aliexpress/alternatives";

/**
 * Bygger sammanfattnings-mejlet för den dagliga syncen. Returnerar null om
 * det inte finns något att rapportera (skippa mejlet helt — vi spammar inte).
 */
export function buildDailySummaryEmail(
  summary: SyncSummary,
  alertsUrl: string,
): { subject: string; html: string; text: string } | null {
  const hasFlagged = summary.flaggedPrice > 0 || summary.flaggedContent > 0;
  const hasAutoAction =
    summary.hidden > 0
    || summary.markedOos > 0
    || summary.restored > 0
    || summary.oosEvents.length > 0
    || summary.restockNotificationsSent > 0;
  const hasErrors = summary.errors.length > 0;

  if (!hasFlagged && !hasAutoAction && !hasErrors) return null;

  const subjectBits: string[] = [];
  if (summary.flaggedPrice > 0) subjectBits.push(`${summary.flaggedPrice} prishöjningar`);
  if (summary.flaggedContent > 0) subjectBits.push(`${summary.flaggedContent} innehållsändringar`);
  if (summary.hidden > 0) subjectBits.push(`${summary.hidden} inaktiverade`);
  if (summary.markedOos > 0) subjectBits.push(`${summary.markedOos} slut i lager`);
  if (summary.restockNotificationsSent > 0) subjectBits.push(`${summary.restockNotificationsSent} restock-mejl`);
  const subject = `Fyndplats sync: ${subjectBits.join(" · ") || "rapport"}`;

  const dryRunNote = summary.dryRun
    ? `<p style="background:#fff4e5;padding:10px 12px;border-radius:8px;font-size:13px;color:#92400e;margin:0 0 16px;">Körningen var i <b>dry-run</b>-läge — inga ändringar gjordes mot Wix. Sätt <code>SYNC_DRY_RUN=false</code> för att aktivera live-läge.</p>`
    : "";

  const rows: string[] = [
    `<tr><td style="padding:6px 0;">Produkter synkade</td><td align="right"><b>${summary.checked}</b> / ${summary.total}</td></tr>`,
    `<tr><td style="padding:6px 0;">Prishöjningar att granska</td><td align="right"><b>${summary.flaggedPrice}</b></td></tr>`,
    `<tr><td style="padding:6px 0;">Innehållsändringar</td><td align="right"><b>${summary.flaggedContent}</b></td></tr>`,
    `<tr><td style="padding:6px 0;">Satta till slut-i-lager</td><td align="right"><b>${summary.markedOos}</b></td></tr>`,
    `<tr><td style="padding:6px 0;">Real-tids-larm (slut hos leverantör)</td><td align="right"><b>${summary.oosRealtimeAlerts}</b></td></tr>`,
    `<tr><td style="padding:6px 0;">Återställda från slut-i-lager</td><td align="right"><b>${summary.restored}</b></td></tr>`,
    `<tr><td style="padding:6px 0;">Restock-mejl till kunder</td><td align="right"><b>${summary.restockNotificationsSent}</b></td></tr>`,
    `<tr><td style="padding:6px 0;">Inaktiverade (listning borttagen)</td><td align="right"><b>${summary.hidden}</b></td></tr>`,
    `<tr><td style="padding:6px 0;">Hoppade över (rate-limit)</td><td align="right">${summary.skipped}</td></tr>`,
  ];
  if (summary.errors.length > 0) {
    rows.push(
      `<tr><td style="padding:6px 0;color:#b91c1c;">Fel</td><td align="right" style="color:#b91c1c;"><b>${summary.errors.length}</b></td></tr>`,
    );
  }

  const oosEventsBlock = summary.oosEvents.length > 0
    ? `<h3 style="font-size:14px;margin:20px 0 6px;color:#b45309;">Slut hos leverantör idag (${summary.oosEvents.length})</h3>
       <ul style="font-size:13px;color:#374151;padding-left:18px;margin:0;">
         ${summary.oosEvents
           .slice(0, 20)
           .map(
             (e) =>
               `<li>${escapeHtml(e.productName || e.aliexpressId)}${e.sales30d > 0 ? ` — <span style="color:#6b7280;">${e.sales30d} sålda senaste 30 dgr</span>` : ""}</li>`,
           )
           .join("")}
       </ul>
       <p style="font-size:12px;color:#6b7280;margin:6px 0 0;">${summary.dryRun
         ? "Dry-run: inga real-tids-mejl skickades. I live-läge skickas ett mejl med alternativa leverantörer per produkt ovan."
         : "Real-tids-mejl med alternativa leverantörer har skickats för varje produkt ovan."}</p>`
    : "";

  const errorsBlock = summary.errors.length > 0
    ? `<h3 style="font-size:14px;margin:20px 0 6px;color:#b91c1c;">Fel under körningen</h3>
       <ul style="font-size:12px;color:#374151;padding-left:18px;margin:0;">
         ${summary.errors.slice(0, 10).map((e) => `<li><code>${escapeHtml(e.productId)}</code>: ${escapeHtml(e.error)}</li>`).join("")}
       </ul>`
    : "";

  const cta = hasFlagged
    ? `<p style="margin:16px 0 0;"><a href="${alertsUrl}" style="display:inline-block;background:${BRAND.primary};color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600;font-size:14px;">Öppna sync-alerts</a></p>`
    : "";

  const html = `
    <h2 style="margin:0 0 4px;font-size:18px;">Daglig sync-rapport</h2>
    <p style="margin:0 0 16px;color:${BRAND.muted};font-size:13px;">${summary.startedAt.slice(0, 10)} · körtid ${formatDuration(summary.startedAt, summary.finishedAt)}</p>
    ${dryRunNote}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size:14px;border-collapse:collapse;">
      ${rows.join("")}
    </table>
    ${cta}
    ${oosEventsBlock}
    ${errorsBlock}
  `;

  const text = [
    `Daglig sync-rapport (${summary.startedAt.slice(0, 10)})`,
    `Synkade: ${summary.checked}/${summary.total}`,
    `Prishöjningar att granska: ${summary.flaggedPrice}`,
    `Innehållsändringar: ${summary.flaggedContent}`,
    `Slut i lager: ${summary.markedOos}`,
    `Återställda: ${summary.restored}`,
    `Inaktiverade: ${summary.hidden}`,
    `Hoppade över: ${summary.skipped}`,
    summary.errors.length > 0 ? `Fel: ${summary.errors.length}` : "",
    hasFlagged ? `\nGranska: ${alertsUrl}` : "",
  ].filter(Boolean).join("\n");

  return { subject, html, text };
}

function formatDuration(startIso: string, endIso: string): string {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return "—";
  const sec = Math.round((end - start) / 1000);
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

/** Svensk lager-etikett + flagga per warehouse-klass (för alternativ-listan). */
function warehouseLabel(cls: AlternativeSupplier["warehouseClass"]): string {
  switch (cls) {
    case "EU": return "EU-lager 🇪🇺";
    case "CN": return "Kina 🇨🇳";
    case "MIXED": return "Blandat 🇪🇺🇨🇳";
    default: return "Okänt lager";
  }
}

// =====================================================================
// Feature 2 + 3 — real-tids-mejl "Slut hos leverantör" med alternativ
// =====================================================================

export interface OosAlertEmailInput {
  productName: string;
  imageUrl?: string;
  /** AliExpress-produktens URL (för "Öppna hos leverantören"). */
  aliexpressUrl: string;
  /** Sålda enheter senaste 30 dagarna (Wix-orderdata). */
  sales30d: number;
  /** Topp-3 alternativa leverantörer (Feature 3). Tom = inga hittades. */
  alternatives: AlternativeSupplier[];
  /** Länk till /admin/sync-alerts. */
  alertsUrl: string;
}

/**
 * Bygger real-tids-mejlet som skickas till OPS_ALERT_EMAIL i samma sekund som
 * en produkt flippar till slut-i-lager hos leverantören. Innehåller produktbild,
 * 30-dagars-försäljning och färdiga "Importera →"-länkar för alternativen.
 */
export function buildOosAlertEmail(input: OosAlertEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Slut hos leverantör: ${input.productName}`;

  const thumb = input.imageUrl
    ? `<img src="${escapeHtml(input.imageUrl)}" alt="" width="72" height="72" style="display:block;border-radius:8px;object-fit:cover;border:1px solid ${BRAND.border};" />`
    : `<div style="width:72px;height:72px;border-radius:8px;background:#f3f4f6;border:1px solid ${BRAND.border};"></div>`;

  const altRows = input.alternatives
    .map((a, i) => {
      const altThumb = a.imageUrl
        ? `<img src="${escapeHtml(a.imageUrl)}" alt="" width="44" height="44" style="display:block;border-radius:6px;object-fit:cover;border:1px solid ${BRAND.border};" />`
        : `<div style="width:44px;height:44px;border-radius:6px;background:#f3f4f6;border:1px solid ${BRAND.border};"></div>`;
      const price = a.priceSek !== undefined ? `${a.priceSek} kr` : "okänt pris";
      return `
        <tr>
          <td style="padding:8px 8px 8px 0;vertical-align:top;width:44px;">${altThumb}</td>
          <td style="padding:8px 0;vertical-align:top;font-size:13px;line-height:1.4;">
            <div><b>${i + 1}.</b> ${escapeHtml(truncate(a.title, 70))}</div>
            <div style="color:${BRAND.muted};">${price} · ${warehouseLabel(a.warehouseClass)}${a.orders ? ` · ${a.orders} ordrar` : ""} · matchning ${a.score}/100</div>
            ${a.scoreReason ? `<div style="color:#9ca3af;font-size:12px;">${escapeHtml(a.scoreReason)}</div>` : ""}
          </td>
          <td style="padding:8px 0;vertical-align:top;text-align:right;white-space:nowrap;">
            <a href="${escapeHtml(a.importUrl)}" style="display:inline-block;background:${BRAND.primary};color:#fff;text-decoration:none;padding:6px 12px;border-radius:6px;font-weight:600;font-size:13px;">Importera →</a>
          </td>
        </tr>`;
    })
    .join("");

  const altBlock = input.alternatives.length > 0
    ? `<h3 style="font-size:15px;margin:20px 0 4px;">Hittade ${input.alternatives.length} alternativ:</h3>
       <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">${altRows}</table>`
    : `<p style="margin:18px 0 0;color:${BRAND.muted};font-size:13px;">Inga alternativa leverantörer hittades automatiskt — sök manuellt i <a href="${escapeHtml(input.alertsUrl)}">admin</a>.</p>`;

  const html = `
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:12px 14px;margin:0 0 16px;">
      <span style="display:inline-block;background:#dc2626;color:#fff;font-weight:700;font-size:12px;letter-spacing:.04em;padding:4px 10px;border-radius:999px;text-transform:uppercase;">Slut hos leverantör</span>
    </div>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 8px;">
      <tr>
        <td style="padding-right:14px;vertical-align:top;">${thumb}</td>
        <td style="vertical-align:top;">
          <div style="font-size:16px;font-weight:700;line-height:1.3;">${escapeHtml(input.productName)}</div>
          <div style="font-size:13px;color:${BRAND.muted};margin-top:4px;">Sålda senaste 30 dagar: <b>${input.sales30d}</b> st</div>
          <div style="font-size:13px;margin-top:4px;"><a href="${escapeHtml(input.aliexpressUrl)}" style="color:${BRAND.primary};">Öppna hos leverantören →</a></div>
        </td>
      </tr>
    </table>
    ${altBlock}
    <p style="margin:18px 0 0;font-size:12px;color:${BRAND.muted};">
      Produkten har dolts från listningarna men produktsidan lever kvar med "Slutsåld"-banner + bevakningsformulär.
    </p>`;

  const textLines = [
    `SLUT HOS LEVERANTÖR: ${input.productName}`,
    `Sålda senaste 30 dagar: ${input.sales30d} st`,
    `AliExpress: ${input.aliexpressUrl}`,
    "",
  ];
  if (input.alternatives.length > 0) {
    textLines.push(`Hittade ${input.alternatives.length} alternativ:`);
    input.alternatives.forEach((a, i) => {
      const price = a.priceSek !== undefined ? `${a.priceSek} kr` : "okänt pris";
      textLines.push(`${i + 1}. ${truncate(a.title, 70)} — ${price} (${warehouseLabel(a.warehouseClass)}) — matchning ${a.score}/100`);
      textLines.push(`   Importera: ${a.importUrl}`);
    });
  } else {
    textLines.push("Inga alternativ hittades automatiskt.");
  }

  return { subject, html, text: textLines.join("\n") };
}

// =====================================================================
// Feature 1 — restock-mejl till kund ("Tillbaka i lager")
// =====================================================================

export interface RestockEmailInput {
  productName: string;
  /** Produktsidans URL på headless-sajten. */
  productUrl: string;
  imageUrl?: string;
}

/**
 * Bygger kund-mejlet som skickas till alla som bevakade en slutsåld produkt
 * när den kommer tillbaka i lager.
 */
export function buildRestockNotificationEmail(input: RestockEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Tillbaka i lager: ${input.productName}`;
  const thumb = input.imageUrl
    ? `<img src="${escapeHtml(input.imageUrl)}" alt="${escapeHtml(input.productName)}" width="120" style="display:block;border-radius:8px;border:1px solid ${BRAND.border};margin:0 0 14px;" />`
    : "";

  const html = `
    <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:10px 14px;margin:0 0 16px;">
      <span style="display:inline-block;background:#059669;color:#fff;font-weight:700;font-size:12px;padding:4px 10px;border-radius:999px;">Tillbaka i lager</span>
    </div>
    ${thumb}
    <h2 style="margin:0 0 6px;font-size:18px;">${escapeHtml(input.productName)} är tillbaka!</h2>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.55;">
      Goda nyheter — produkten du bevakade finns nu i lager igen. Den säljer ofta slut snabbt, så passa på.
    </p>
    <p style="margin:0;">
      <a href="${escapeHtml(input.productUrl)}" style="display:inline-block;background:${BRAND.primary};color:#fff;text-decoration:none;padding:11px 20px;border-radius:6px;font-weight:600;font-size:15px;">Visa produkten →</a>
    </p>`;

  const text = [
    `${input.productName} är tillbaka i lager!`,
    "",
    "Produkten du bevakade finns nu i lager igen.",
    `Visa produkten: ${input.productUrl}`,
  ].join("\n");

  return { subject, html, text };
}
