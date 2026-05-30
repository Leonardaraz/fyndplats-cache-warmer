// emails/abandoned-cart-3.tsx
// Email 3 — +72h, unique 5% code (single-use, 24h TTL, locked to address+phone,
// minimum 200 kr cart). The anti-abuse gating is done in lib/abandoned-cart.ts —
// if any guard trips, the no-code variant in abandoned-cart-3-no-code.tsx is used.
// Subject: "5% extra för att slutföra"

import { renderEmail, type BaseProps } from './_abandoned-cart-helpers';

export interface Cart3Props extends BaseProps {
  discountCode: string;
  expiresAt: string; // ISO
}

function formatExpiry(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('sv-SE', {
    timeZone: 'Europe/Stockholm',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function renderAbandonedCart3(props: Cart3Props): { html: string; text: string } {
  return renderEmail({
    preheader: `Använd koden ${props.discountCode} inom 24 timmar.`,
    headline: '5% extra för att slutföra',
    intro:
      'Vi vill att du ska få dina grejer. Här är en personlig 5%-kod för din kundvagn — engångsanvändning, gäller i 24 timmar.',
    banner: {
      title: '5% rabatt — din personliga kod',
      body: `Gäller på kundvagnar över 200 kr, single use. Sista chans: ${formatExpiry(props.expiresAt)}.`,
      mono: props.discountCode,
    },
    ctaLabel: 'Använd koden',
    ctaUrl: props.recoverUrl,
    items: props.items,
    subtotalMinor: props.subtotalMinor,
    currency: props.currency,
    closing: 'Koden är personlig och kopplad till din kundvagn.',
  });
}
