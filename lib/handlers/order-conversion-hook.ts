// lib/handlers/order-conversion-hook.ts
// Called from the existing order_created handler (Phase 2) so that an abandoned cart
// that converts to a real order has its pending sends cancelled and its discount code
// revoked. Also seeds used_addresses so the shipping address / phone are remembered as
// "known returning" customers for future flows.
//
// IMPORTANT — wiring: in app/api/wix-webhook/route.ts, inside the existing
// case 'order_created' (or wherever the order_created branch lives), add:
//
//     import { onWixOrderCreatedForAbandonedCart } from '@/lib/handlers/order-conversion-hook';
//     ...
//     await onWixOrderCreatedForAbandonedCart(orderPayload);
//
// See WEBHOOK-PATCH.md.

import { onOrderConverted } from '../abandoned-cart';

interface OrderPayload {
  _id?: string;
  id?: string;
  cartId?: string;
  checkoutId?: string;
  buyerInfo?: { email?: string; phone?: string };
  billingInfo?: { contactDetails?: { phone?: string } };
  shippingInfo?: {
    shippingDestination?: {
      address?: {
        addressLine1?: string;
        addressLine?: string;
        addressLine2?: string;
        postalCode?: string;
        zipCode?: string;
        city?: string;
        country?: string;
      };
      contactDetails?: { phone?: string };
    };
  };
}

export async function onWixOrderCreatedForAbandonedCart(order: OrderPayload | undefined): Promise<void> {
  if (!order) return;
  const cartId = order.cartId ?? order.checkoutId ?? null;
  const email = order.buyerInfo?.email ?? null;
  const phone =
    order.buyerInfo?.phone ??
    order.billingInfo?.contactDetails?.phone ??
    order.shippingInfo?.shippingDestination?.contactDetails?.phone ??
    null;
  const a = order.shippingInfo?.shippingDestination?.address;
  await onOrderConverted({
    cartId,
    email,
    phone,
    shippingAddress: a
      ? {
          addressLine1: a.addressLine1 ?? a.addressLine ?? null,
          addressLine2: a.addressLine2 ?? null,
          postalCode: a.postalCode ?? a.zipCode ?? null,
          city: a.city ?? null,
          country: a.country ?? 'SE',
        }
      : null,
  });
}
