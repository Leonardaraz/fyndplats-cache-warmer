// emails/_abandoned-cart-helpers.tsx
// Shared helpers for the 3 abandoned-cart templates.
// Mirrors the styling vocabulary used by emails/_layout.tsx in Phase 2:
//   brand orange  #F47A35
//   cta orange    #C2410C
//   text dark     #1F2937
//   muted text    #6B7280
//   panel bg      #FFF7ED
//
// Each template renders both `html` (table-based, email-safe) and a `text` fallback
// so Resend's deliverability stays good.
//
// We deliberately do NOT use React rendering here — keeps the email lib free of a
// react-dom/server dependency and matches the existing Phase 2 emails which are
// inline-styled HTML strings.

export type EmailItem = { name: string; quantity: number; imageUrl?: string | null; priceMinor: number };

export interface BaseProps {
  items: EmailItem[];
  recoverUrl: string;
  subtotalMinor: number;
  currency: string;
  /** GDPR opt-out link (lib/newsletter.unsubscribeUrl). Rendered in the footer. */
  unsubscribeUrl?: string;
}

const BRAND = '#F47A35';
const CTA = '#C2410C';
const TEXT = '#1F2937';
const MUTED = '#6B7280';
const PANEL = '#FFF7ED';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatMoney(minor: number, currency: string): string {
  const major = minor / 100;
  // Swedish formatting: "1 234 kr" with non-breaking thin space.
  const formatted = major.toLocaleString('sv-SE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return currency === 'SEK' ? `${formatted} kr` : `${formatted} ${currency}`;
}

function itemRowsHtml(items: EmailItem[], currency: string): string {
  return items
    .map((item) => {
      const img = item.imageUrl
        ? `<img src="${escapeHtml(item.imageUrl)}" alt="" width="64" height="64" style="display:block;border-radius:6px;border:1px solid #e5e7eb"/>`
        : '<div style="width:64px;height:64px;background:#f3f4f6;border-radius:6px"></div>';
      return `
      <tr>
        <td style="padding:12px 0;vertical-align:top;width:80px">${img}</td>
        <td style="padding:12px 0;vertical-align:top;color:${TEXT};font-size:14px;line-height:1.4">
          <div style="font-weight:600">${escapeHtml(item.name)}</div>
          <div style="color:${MUTED};font-size:12px;margin-top:4px">Antal: ${item.quantity}</div>
        </td>
        <td style="padding:12px 0;vertical-align:top;text-align:right;color:${TEXT};font-size:14px;white-space:nowrap">
          ${formatMoney(item.priceMinor * item.quantity, currency)}
        </td>
      </tr>`;
    })
    .join('');
}

function itemRowsText(items: EmailItem[], currency: string): string {
  return items
    .map((i) => `- ${i.name} x${i.quantity}  ${formatMoney(i.priceMinor * i.quantity, currency)}`)
    .join('\n');
}

export interface LayoutOpts {
  preheader: string;
  headline: string;
  intro: string;
  ctaLabel: string;
  ctaUrl: string;
  /** Optional banner shown above items (e.g. "Fri frakt på alla beställningar" or the code box). */
  banner?: { title: string; body: string; mono?: string };
  items: EmailItem[];
  subtotalMinor: number;
  currency: string;
  closing?: string;
  unsubscribeUrl?: string;
}

export function renderEmail(opts: LayoutOpts): { html: string; text: string } {
  const itemsHtml = itemRowsHtml(opts.items, opts.currency);
  const itemsText = itemRowsText(opts.items, opts.currency);

  const bannerHtml = opts.banner
    ? `
      <tr>
        <td style="padding:0 24px 16px 24px">
          <div style="background:${PANEL};border:1px solid #FED7AA;border-radius:8px;padding:16px;color:${TEXT}">
            <div style="font-weight:700;color:${BRAND};font-size:14px;margin-bottom:4px">${escapeHtml(opts.banner.title)}</div>
            <div style="font-size:14px;line-height:1.5">${escapeHtml(opts.banner.body)}</div>
            ${opts.banner.mono ? `<div style="margin-top:12px;font-family:'SF Mono',Menlo,monospace;font-size:18px;letter-spacing:2px;padding:10px 14px;background:#fff;border:1px dashed ${BRAND};border-radius:6px;text-align:center;color:${CTA};font-weight:700">${escapeHtml(opts.banner.mono)}</div>` : ''}
          </div>
        </td>
      </tr>`
    : '';

  const html = `<!doctype html>
<html lang="sv">
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <meta name="x-apple-disable-message-reformatting"/>
    <title>${escapeHtml(opts.headline)}</title>
  </head>
  <body style="margin:0;padding:0;background:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${TEXT}">
    <!-- preheader -->
    <div style="display:none;font-size:1px;color:#F9FAFB;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${escapeHtml(opts.preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB">
      <tr><td align="center" style="padding:24px 12px">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #E5E7EB">
          <tr><td style="padding:24px 24px 0 24px">
            <table role="presentation" width="100%"><tr>
              <td style="font-size:18px;font-weight:800;color:${BRAND};letter-spacing:-0.01em">Fyndplats</td>
              <td style="text-align:right;color:${MUTED};font-size:12px">fyndplats.se</td>
            </tr></table>
          </td></tr>
          <tr><td style="padding:16px 24px 0 24px">
            <h1 style="margin:0;font-size:22px;color:${TEXT};line-height:1.3">${escapeHtml(opts.headline)}</h1>
            <p style="margin:12px 0 0 0;color:${TEXT};font-size:15px;line-height:1.6">${escapeHtml(opts.intro)}</p>
          </td></tr>
          ${bannerHtml}
          <tr><td style="padding:8px 24px 0 24px">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemsHtml}</table>
          </td></tr>
          <tr><td style="padding:8px 24px 0 24px">
            <table role="presentation" width="100%"><tr>
              <td style="padding-top:12px;border-top:1px solid #E5E7EB;color:${MUTED};font-size:13px">Summa</td>
              <td style="padding-top:12px;border-top:1px solid #E5E7EB;text-align:right;color:${TEXT};font-size:14px;font-weight:700">${formatMoney(opts.subtotalMinor, opts.currency)}</td>
            </tr></table>
          </td></tr>
          <tr><td align="center" style="padding:24px">
            <a href="${escapeHtml(opts.ctaUrl)}" style="display:inline-block;background:${CTA};color:#ffffff;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:8px;font-size:15px">${escapeHtml(opts.ctaLabel)}</a>
          </td></tr>
          ${opts.closing ? `<tr><td style="padding:0 24px 24px 24px;color:${MUTED};font-size:13px;line-height:1.5">${escapeHtml(opts.closing)}</td></tr>` : ''}
          <tr><td style="padding:16px 24px;background:#F9FAFB;color:${MUTED};font-size:12px;text-align:center">
            Du får detta mejl för att du började en beställning hos Fyndplats.${opts.unsubscribeUrl ? ` Vill du inte ha fler påminnelser? <a href="${escapeHtml(opts.unsubscribeUrl)}" style="color:${MUTED};text-decoration:underline">Avregistrera dig här</a>.` : ' Vill du inte ha påminnelser? Svara på det här mejlet så ordnar vi det.'}
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const text = `${opts.headline}

${opts.intro}
${opts.banner ? `\n${opts.banner.title}\n${opts.banner.body}${opts.banner.mono ? `\nKod: ${opts.banner.mono}` : ''}` : ''}

${itemsText}

Summa: ${formatMoney(opts.subtotalMinor, opts.currency)}

${opts.ctaLabel}: ${opts.ctaUrl}

${opts.closing ?? ''}
${opts.unsubscribeUrl ? `\nAvregistrera dig: ${opts.unsubscribeUrl}\n` : ''}
— Fyndplats`;

  return { html, text };
}
