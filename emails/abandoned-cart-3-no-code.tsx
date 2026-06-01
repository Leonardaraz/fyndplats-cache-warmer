// emails/abandoned-cart-3-no-code.tsx
// Email 3 — no-code variant. Sent when anti-abuse rules block the 5% code:
//   - shipping address already used by a previous order
//   - phone number already used
//   - cart subtotal under 200 kr
// Subject: "Vi saknar dig — din kundvagn väntar"

import { renderEmail, type BaseProps } from './_abandoned-cart-helpers';

export function renderAbandonedCart3NoCode(props: BaseProps): { html: string; text: string } {
  return renderEmail({
    preheader: 'Din kundvagn ligger kvar — välkommen tillbaka.',
    headline: 'Vi saknar dig — din kundvagn väntar',
    intro:
      'Vi sparar din kundvagn ett tag till. Hör av dig om något i din beställning krånglar — vi finns här om du behöver hjälp.',
    ctaLabel: 'Slutför ditt köp',
    ctaUrl: props.recoverUrl,
    items: props.items,
    subtotalMinor: props.subtotalMinor,
    currency: props.currency,
    closing: 'Frågor? Svara på det här mejlet så hör vi av oss.',
    unsubscribeUrl: props.unsubscribeUrl,
  });
}
