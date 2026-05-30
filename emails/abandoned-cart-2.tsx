// emails/abandoned-cart-2.tsx
// Email 2 — +24h, universal free shipping reminder (NOT a unique code).
// Subject: "Vi sparade din kundvagn — fri frakt"

import { renderEmail, type BaseProps } from './_abandoned-cart-helpers';

export function renderAbandonedCart2(props: BaseProps): { html: string; text: string } {
  return renderEmail({
    preheader: 'Vi har fri frakt på alla beställningar.',
    headline: 'Vi sparade din kundvagn — fri frakt',
    intro:
      'Din kundvagn ligger fortfarande kvar. Som påminnelse: vi har fri frakt på alla beställningar — ingen kod behövs.',
    banner: {
      title: 'Fri frakt — för alla',
      body: 'Fri frakt gäller automatiskt i kassan på alla beställningar.',
    },
    ctaLabel: 'Gå till kundvagnen',
    ctaUrl: props.recoverUrl,
    items: props.items,
    subtotalMinor: props.subtotalMinor,
    currency: props.currency,
  });
}
