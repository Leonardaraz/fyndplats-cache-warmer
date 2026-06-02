// emails/_abandoned-cart-helpers.tsx
// Shared helpers for the 4 abandoned-cart templates (1h, 24h, 72h-code, 72h-no-code).
//
// These now build on the SAME brand shell as every transactional/lifecycle email
// (emails/_layout.tsx → EmailShell): the white email-logo on the dark header bar,
// the orange accent line, and the shared footer with company postal address,
// Instagram/Facebook, support phone + email. Previously these emails used a
// hand-rolled HTML string with a different palette and no logo/address, which
// looked off-brand next to order confirmations. Migrating to EmailShell removes
// that drift — there is now one source of truth for email chrome.
//
// Each template still returns both `html` and a `text` fallback so Resend's
// deliverability stays good. The HTML is produced by @react-email/render (same as
// the transactional emails), so `renderEmail` is async. The abandoned-cart-only
// concerns — the "you started an order with us" unsubscribe note in the body, and
// the List-Unsubscribe / RFC 8058 headers (set in lib/abandoned-cart.ts) — are
// preserved.

import {
  Column,
  Hr,
  Img,
  Link,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { render } from "@react-email/render";

import { BRAND, EmailShell, block, text } from "./_layout";

export type EmailItem = { name: string; quantity: number; imageUrl?: string | null; priceMinor: number };

export interface BaseProps {
  items: EmailItem[];
  recoverUrl: string;
  subtotalMinor: number;
  currency: string;
  /** GDPR opt-out link (lib/newsletter.unsubscribeUrl). Rendered in the footer note. */
  unsubscribeUrl?: string;
}

export function formatMoney(minor: number, currency: string): string {
  const major = minor / 100;
  // Swedish formatting: "1 234 kr".
  const formatted = major.toLocaleString("sv-SE", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return currency === "SEK" ? `${formatted} kr` : `${formatted} ${currency}`;
}

const rowStyle = {
  borderBottom: `1px solid ${BRAND.line}`,
  padding: "12px 0",
};

export interface LayoutOpts {
  preheader: string;
  headline: string;
  intro: string;
  ctaLabel: string;
  ctaUrl: string;
  /** Optional banner shown above items (e.g. free-shipping reminder or the code box). */
  banner?: { title: string; body: string; mono?: string };
  items: EmailItem[];
  subtotalMinor: number;
  currency: string;
  closing?: string;
  unsubscribeUrl?: string;
}

function AbandonedCartBody(opts: LayoutOpts) {
  return (
    <EmailShell preview={opts.preheader}>
      <Text style={text.h1}>{opts.headline}</Text>
      <Text style={text.body}>{opts.intro}</Text>

      {opts.banner ? (
        <Section style={block.card}>
          <Text style={{ ...text.body, fontWeight: 700, color: BRAND.orange2, margin: "0 0 4px 0" }}>
            {opts.banner.title}
          </Text>
          <Text style={{ ...text.body, margin: 0 }}>{opts.banner.body}</Text>
          {opts.banner.mono ? (
            <Text
              style={{
                marginTop: "12px",
                fontFamily: "'SF Mono', Menlo, Consolas, monospace",
                fontSize: "18px",
                letterSpacing: "2px",
                padding: "10px 14px",
                background: "#ffffff",
                border: `1px dashed ${BRAND.orange}`,
                borderRadius: "8px",
                textAlign: "center" as const,
                color: BRAND.cta,
                fontWeight: 700,
              }}
            >
              {opts.banner.mono}
            </Text>
          ) : null}
        </Section>
      ) : null}

      <Text style={text.h2}>Din kundvagn</Text>
      {opts.items.map((it, i) => (
        <Section key={i} style={rowStyle}>
          <Row>
            <Column style={{ width: "64px", verticalAlign: "top" }}>
              {it.imageUrl ? (
                <Img
                  src={it.imageUrl}
                  alt={it.name}
                  width="56"
                  height="56"
                  style={{ borderRadius: "8px", border: `1px solid ${BRAND.line}`, objectFit: "cover" }}
                />
              ) : (
                <div style={{ width: "56px", height: "56px", borderRadius: "8px", background: BRAND.warm, border: `1px solid ${BRAND.line}` }} />
              )}
            </Column>
            <Column style={{ verticalAlign: "top", paddingLeft: "12px" }}>
              <Text style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: BRAND.ink }}>
                {it.name}
              </Text>
              <Text style={{ fontSize: "12px", color: BRAND.muted, margin: "2px 0 0 0" }}>
                Antal: {it.quantity}
              </Text>
            </Column>
            <Column align="right" style={{ width: "100px", verticalAlign: "top" }}>
              <Text style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: BRAND.ink }}>
                {formatMoney(it.priceMinor * it.quantity, opts.currency)}
              </Text>
            </Column>
          </Row>
        </Section>
      ))}

      <Section style={{ marginTop: "12px" }}>
        <Hr style={{ borderColor: BRAND.line, margin: "10px 0" }} />
        <Row style={{ padding: "4px 0" }}>
          <Column>
            <Text style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: BRAND.ink }}>Summa</Text>
          </Column>
          <Column align="right">
            <Text style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: BRAND.cta }}>
              {formatMoney(opts.subtotalMinor, opts.currency)}
            </Text>
          </Column>
        </Row>
      </Section>

      <Section style={{ textAlign: "center", margin: "28px 0 8px 0" }}>
        <Link href={opts.ctaUrl} style={block.ctaButton}>
          {opts.ctaLabel}
        </Link>
      </Section>

      {opts.closing ? (
        <Text style={{ ...text.muted, marginTop: "16px" }}>{opts.closing}</Text>
      ) : null}

      <Hr style={{ borderColor: BRAND.line, margin: "20px 0 14px 0" }} />
      <Text style={{ ...text.muted, fontSize: "12px", margin: 0 }}>
        Du får detta mejl för att du började en beställning hos Fyndplats.{" "}
        {opts.unsubscribeUrl ? (
          <>
            Vill du inte ha fler påminnelser?{" "}
            <Link href={opts.unsubscribeUrl} style={{ color: BRAND.muted, textDecoration: "underline" }}>
              Avregistrera dig här
            </Link>
            .
          </>
        ) : (
          "Vill du inte ha påminnelser? Svara på det här mejlet så ordnar vi det."
        )}
      </Text>
    </EmailShell>
  );
}

function itemRowsText(items: EmailItem[], currency: string): string {
  return items
    .map((i) => `- ${i.name} x${i.quantity}  ${formatMoney(i.priceMinor * i.quantity, currency)}`)
    .join("\n");
}

export async function renderEmail(opts: LayoutOpts): Promise<{ html: string; text: string }> {
  const html = await render(<AbandonedCartBody {...opts} />);

  const textBody = `${opts.headline}

${opts.intro}
${opts.banner ? `\n${opts.banner.title}\n${opts.banner.body}${opts.banner.mono ? `\nKod: ${opts.banner.mono}` : ""}` : ""}

${itemRowsText(opts.items, opts.currency)}

Summa: ${formatMoney(opts.subtotalMinor, opts.currency)}

${opts.ctaLabel}: ${opts.ctaUrl}

${opts.closing ?? ""}
${opts.unsubscribeUrl ? `\nAvregistrera dig: ${opts.unsubscribeUrl}\n` : ""}
— Fyndplats · ${BRAND.companyName}, ${BRAND.companyAddress}`;

  return { html, text: textBody };
}
