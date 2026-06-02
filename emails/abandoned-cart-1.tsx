// emails/abandoned-cart-1.tsx
// Email 1 — +1h friendly reminder, no discount, low-pressure.
// Subject: "Du glömde något i kundvagnen"

import { renderEmail, type BaseProps } from './_abandoned-cart-helpers';

export function renderAbandonedCart1(props: BaseProps): Promise<{ html: string; text: string }> {
  return renderEmail({
    preheader: 'Vi sparade din kundvagn åt dig.',
    headline: 'Du glömde något i kundvagnen',
    intro:
      'Hej! Vi märkte att du tittade på några grejer hos oss men hann inte slutföra köpet. Vi har sparat din kundvagn så du kan fortsätta där du slutade.',
    ctaLabel: 'Slutför ditt köp',
    ctaUrl: props.recoverUrl,
    items: props.items,
    subtotalMinor: props.subtotalMinor,
    currency: props.currency,
    closing: 'Ingen brådska — vi sparar kundvagnen åt dig.',
    unsubscribeUrl: props.unsubscribeUrl,
  });
}
