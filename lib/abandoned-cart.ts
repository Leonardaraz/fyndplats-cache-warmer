// lib/abandoned-cart.ts
// Orchestrates the abandoned-cart flow:
//   step 1  +1h   reminder       (no code)
//   step 2  +24h  free shipping  (universal, not a code)
//   step 3  +72h  5% off         (unique per-cart code, anti-abuse gated)
//
// Anti-abuse rules implemented here:
//   * One full flow per email per 30 days     -> enqueue() refuses duplicates
//   * Step 3 skipped (no code) if:
//       - shipping_addr_hash is in used_addresses
//       - phone (normalised) is in used_addresses
//       - subtotal_minor < 200_00
//     -> in those cases, send the "we miss you" no-code variant instead
//   * Code TTL 24h, single-use, scoped via mintAbandonedCartCoupon
//   * Convert event cancels pending sends and revokes any minted code

import { Resend } from 'resend';
import { anvandaAdresser, kundvagnMejl, kundvagnar } from './wix-lager';
import { hashAddress, normalisePhone, type NormalisableAddress } from './address-hash';
import { mintAbandonedCartCoupon, revokeCoupon } from './discount-codes';
import { renderAbandonedCart1 } from '../emails/abandoned-cart-1';
import { renderAbandonedCart2 } from '../emails/abandoned-cart-2';
import { renderAbandonedCart3 } from '../emails/abandoned-cart-3';
import { renderAbandonedCart3NoCode } from '../emails/abandoned-cart-3-no-code';
import { unsubscribeUrl, isSuppressed } from './newsletter';
import { firePush } from './push-send';

const ONE_HOUR_MS = 60 * 60 * 1000;
const STEP_DELAYS_MS: Record<1 | 2 | 3, number> = {
  1: 1 * ONE_HOUR_MS,
  2: 24 * ONE_HOUR_MS,
  3: 72 * ONE_HOUR_MS,
};

const FROM = 'Fyndplats <orders@fyndplats.se>';
const REPLY_TO = 'info@fyndplats.com';
const COOLDOWN_DAYS = 30;
const MIN_SUBTOTAL_FOR_CODE_MINOR = 200_00; // 200 SEK in öre

export type CartItem = {
  name: string;
  quantity: number;
  imageUrl?: string | null;
  priceMinor: number;
};

export interface AbandonedCartInput {
  cartId: string;
  email: string;
  phone?: string | null;
  shippingAddress?: NormalisableAddress | null;
  items: CartItem[];
  subtotalMinor: number;
  currency?: string;
  recoverUrl?: string | null;
  abandonedAt: Date;
  /** Inject a now() for tests so we can simulate the 72h flow inline. */
  nowOverride?: Date;
  /** Inject step delays (ms) for tests so we don't have to wait hours. */
  delaysMsOverride?: Record<1 | 2 | 3, number>;
}

export interface EnqueueResult {
  enqueued: boolean;
  reason?: 'cooldown' | 'already_exists' | 'invalid';
  cartId: string;
}

function resend(): Resend {
  return new Resend(process.env.RESEND_API_KEY);
}

// RFC 8058 one-click unsubscribe headers so Gmail/Apple Mail show a native
// "Unsubscribe" button that hits the same opt-out URL as the footer link.
function unsubHeaders(email: string): Record<string, string> {
  const url = unsubscribeUrl(email);
  return {
    'List-Unsubscribe': `<${url}>, <mailto:info@fyndplats.com?subject=unsubscribe>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}

// ---------------------------------------------------------------------------
// Tabellerna. Varje läsning och skrivning går genom de här, mot Wix CMS
// (lib/wix-lager.ts). Postgres-vägen togs bort 2026-11-05.
// ---------------------------------------------------------------------------

/** Har adressen fått ett kundvagnsmejl sedan `cutoff` (från en annan vagn än `utomCartId`)? */
async function mejladNyligen(emailLower: string, cutoff: Date, utomCartId?: string): Promise<boolean> {
  return kundvagnMejl.nyligen(emailLower, cutoff.toISOString(), utomCartId);
}

/** Loggar mejlet, en rad per (vagn, steg); en befintlig rad skrivs inte om. */
async function loggaMejl(cart: CartRow, step: 1 | 2 | 3, resendId: string | null, discountCode: string | null = null): Promise<void> {
  await kundvagnMejl.logga({ cartId: cart.id, step, resendId, email: cart.email, discountCode });
}

/** Sätter vagnens status (och updated_at). */
async function sattStatus(cartId: string, status: string): Promise<void> {
  await kundvagnar.uppdatera(cartId, { status });
}

/** Flyttar vagnen till nästa steg. */
async function sattNastaSteg(cartId: string, nextStep: number, nextStepAt: string): Promise<void> {
  await kundvagnar.uppdatera(cartId, { nextStep, nextStepAt });
}

// ---------------------------------------------------------------------------
// Enqueue
// ---------------------------------------------------------------------------

export async function enqueueAbandonedCart(input: AbandonedCartInput): Promise<EnqueueResult> {
  if (!input.email || !input.cartId) {
    return { enqueued: false, reason: 'invalid', cartId: input.cartId };
  }

  const email = input.email.toLowerCase().trim();
  const phone = normalisePhone(input.phone);
  const addrHash = hashAddress(input.shippingAddress);
  const now = input.nowOverride ?? new Date();
  const delays = input.delaysMsOverride ?? STEP_DELAYS_MS;

  // 30-day cooldown: if we have *any* sent_emails row for this email in the window, refuse.
  const cooldownCutoff = new Date(now.getTime() - COOLDOWN_DAYS * 24 * ONE_HOUR_MS);
  if (await mejladNyligen(email, cooldownCutoff)) {
    return { enqueued: false, reason: 'cooldown', cartId: input.cartId };
  }

  const nextStepAt = new Date(input.abandonedAt.getTime() + delays[1]);

  // Idempotent på cartId: en vagn som redan finns skapas inte igen.
  const ny = await kundvagnar.skapa({
    id: input.cartId,
    email,
    phone,
    shippingAddrHash: addrHash,
    items: input.items,
    subtotalMinor: input.subtotalMinor,
    currency: input.currency ?? 'SEK',
    recoverUrl: input.recoverUrl ?? null,
    abandonedAt: input.abandonedAt.toISOString(),
    nextStepAt: nextStepAt.toISOString(),
  });
  return ny
    ? { enqueued: true, cartId: input.cartId }
    : { enqueued: false, reason: 'already_exists', cartId: input.cartId };
}

// ---------------------------------------------------------------------------
// Cancel (called on order conversion)
// ---------------------------------------------------------------------------

export interface OrderConversionInput {
  cartId?: string | null;
  email?: string | null;
  shippingAddress?: NormalisableAddress | null;
  phone?: string | null;
}

/**
 * Called from the existing order_created webhook handler.
 *  1. Mark matching cart as 'converted'
 *  2. Revoke any minted discount code
 *  3. Record shipping address + phone in used_addresses so future flows skip the code
 */
export async function onOrderConverted(input: OrderConversionInput): Promise<{
  cancelledCart: boolean;
  revokedCode: boolean;
  recordedAddress: boolean;
}> {
  let cancelledCart = false;
  let revokedCode = false;
  let recordedAddress = false;

  if (input.cartId) {
    const k = await kundvagnar.konvertera(input.cartId);
    if (k.konverterad) {
      cancelledCart = true;
      if (k.rabattWixId) {
        await revokeCoupon(k.rabattWixId);
        revokedCode = true;
      }
    }
  }

  // Matcha ÄVEN på e-post. Poller-köade vagnar bär Wix abandoned-checkout-id som
  // INTE finns på ordern, så id-matchen ovan missar dem helt → kunden skulle
  // annars få "du glömde din kundvagn / slutför köpet" EFTER ett genomfört köp.
  // E-post är den enda gemensamma nyckeln mellan vagnen och ordern. Avbryt alla
  // kundens pending-vagnar och återkalla ev. kuponger.
  const convEmail = input.email?.toLowerCase().trim() ?? null;
  if (convEmail) {
    const k = await kundvagnar.konverteraForEpost(convEmail);
    if (k.antal > 0) cancelledCart = true;
    for (const wixId of k.rabattWixIdn) {
      await revokeCoupon(wixId);
      revokedCode = true;
    }
  }

  const addrHash = hashAddress(input.shippingAddress);
  const phone = normalisePhone(input.phone);
  const email = input.email?.toLowerCase().trim() ?? null;
  if (addrHash) {
    await anvandaAdresser.registrera(addrHash, email, phone);
    recordedAddress = true;
  }

  return { cancelledCart, revokedCode, recordedAddress };
}

// ---------------------------------------------------------------------------
// Process due cart (called by cron)
// ---------------------------------------------------------------------------

interface CartRow {
  id: string;
  email: string;
  phone: string | null;
  shipping_addr_hash: string | null;
  items_json: CartItem[];
  subtotal_minor: number;
  currency: string;
  recover_url: string | null;
  next_step: number;
  next_step_at: string;
  status: string;
  discount_code: string | null;
  discount_code_wix_id: string | null;
}

export async function fetchDueCarts(limit = 25, nowOverride?: Date): Promise<CartRow[]> {
  const now = (nowOverride ?? new Date()).toISOString();
  return (await kundvagnar.forfallna(now, limit)) as unknown as CartRow[];
}

export interface ProcessResult {
  cartId: string;
  step: number;
  action: 'sent' | 'sent_no_code' | 'skipped_cooldown' | 'skipped_unsubscribed' | 'skipped_below_min' | 'completed' | 'error';
  resendId?: string;
  discountCode?: string;
  error?: string;
}

export async function processDueCart(
  cart: CartRow,
  opts: { now?: Date; delaysMsOverride?: Record<1 | 2 | 3, number> } = {},
): Promise<ProcessResult> {
  const step = cart.next_step as 1 | 2 | 3;
  const now = opts.now ?? new Date();
  const delays = opts.delaysMsOverride ?? STEP_DELAYS_MS;

  try {
    // Cooldown re-check: another flow for this email may have started since we enqueued.
    const cooldownCutoff = new Date(now.getTime() - COOLDOWN_DAYS * 24 * ONE_HOUR_MS);
    if (await mejladNyligen(cart.email.toLowerCase(), cooldownCutoff, cart.id)) {
      await sattStatus(cart.id, 'skipped');
      return { cartId: cart.id, step, action: 'skipped_cooldown' };
    }

    // GDPR opt-out: if the recipient has unsubscribed, stop the whole flow.
    if (await isSuppressed(cart.email)) {
      await sattStatus(cart.id, 'unsubscribed');
      return { cartId: cart.id, step, action: 'skipped_unsubscribed' };
    }

    if (step === 1) {
      const result = await sendStep1(cart);
      // delays here are relative to abandoned_at; for tests we simply advance from now.
      const scheduledNext = new Date(now.getTime() + (delays[2] - delays[1])).toISOString();
      await sattNastaSteg(cart.id, 2, scheduledNext);
      return result;
    }

    if (step === 2) {
      const result = await sendStep2(cart);
      const scheduledNext = new Date(now.getTime() + (delays[3] - delays[2])).toISOString();
      await sattNastaSteg(cart.id, 3, scheduledNext);
      return result;
    }

    if (step === 3) {
      const result = await sendStep3(cart);
      await sattStatus(cart.id, 'done');
      return result;
    }

    return { cartId: cart.id, step, action: 'error', error: 'unexpected step' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Don't kill the cron — log and leave the cart status as-is so we retry next tick.
    console.error('[abandoned-cart] processDueCart error', cart.id, step, msg);
    return { cartId: cart.id, step, action: 'error', error: msg };
  }
}

// ---------------------------------------------------------------------------
// Individual step senders
// ---------------------------------------------------------------------------

async function sendStep1(cart: CartRow): Promise<ProcessResult> {
  const subject = 'Du glömde något i kundvagnen';
  const { html, text } = await renderAbandonedCart1({
    items: cart.items_json,
    recoverUrl: cart.recover_url ?? 'https://www.fyndplats.se',
    subtotalMinor: cart.subtotal_minor,
    currency: cart.currency,
    unsubscribeUrl: unsubscribeUrl(cart.email),
  });
  const send = await resend().emails.send({
    from: FROM,
    to: cart.email,
    replyTo: REPLY_TO,
    subject,
    html,
    text,
    headers: unsubHeaders(cart.email),
  });
  await loggaMejl(cart, 1, send.data?.id ?? null);
  // Push parallellt med +1h-mejlet (snabb påminnelse; mejlet är backup).
  // Fire-and-forget — får aldrig fälla eller fördröja cron-flödet. Kanal 'cart'
  // respekterar mottagarens cartReminders-preferens.
  firePush({
    userEmail: cart.email,
    channel: 'cart',
    title: 'Glömde du något? 🛒',
    body: 'Din kundvagn väntar på dig — slutför köpet innan varorna tar slut.',
    data: { type: 'abandoned_cart', cartId: cart.id, recoverUrl: cart.recover_url ?? undefined },
  });
  return { cartId: cart.id, step: 1, action: 'sent', resendId: send.data?.id };
}

async function sendStep2(cart: CartRow): Promise<ProcessResult> {
  const subject = 'Vi sparade din kundvagn — fri frakt';
  const { html, text } = await renderAbandonedCart2({
    items: cart.items_json,
    recoverUrl: cart.recover_url ?? 'https://www.fyndplats.se',
    subtotalMinor: cart.subtotal_minor,
    currency: cart.currency,
    unsubscribeUrl: unsubscribeUrl(cart.email),
  });
  const send = await resend().emails.send({
    from: FROM,
    to: cart.email,
    replyTo: REPLY_TO,
    subject,
    html,
    text,
    headers: unsubHeaders(cart.email),
  });
  await loggaMejl(cart, 2, send.data?.id ?? null);
  return { cartId: cart.id, step: 2, action: 'sent', resendId: send.data?.id };
}

async function sendStep3NoCode(cart: CartRow): Promise<ProcessResult> {
  const subject = 'Vi saknar dig — din kundvagn väntar';
  const { html, text } = await renderAbandonedCart3NoCode({
    items: cart.items_json,
    recoverUrl: cart.recover_url ?? 'https://www.fyndplats.se',
    subtotalMinor: cart.subtotal_minor,
    currency: cart.currency,
    unsubscribeUrl: unsubscribeUrl(cart.email),
  });
  const send = await resend().emails.send({
    from: FROM,
    to: cart.email,
    replyTo: REPLY_TO,
    subject,
    html,
    text,
    headers: unsubHeaders(cart.email),
  });
  await loggaMejl(cart, 3, send.data?.id ?? null);
  return { cartId: cart.id, step: 3, action: 'sent_no_code', resendId: send.data?.id };
}

async function sendStep3(cart: CartRow): Promise<ProcessResult> {
  // Anti-abuse gate for the discount code -----------------------------------
  const belowMin = cart.subtotal_minor < MIN_SUBTOTAL_FOR_CODE_MINOR;

  let addressKnown = false;
  if (cart.shipping_addr_hash) {
    addressKnown = await anvandaAdresser.finnsHash(cart.shipping_addr_hash);
  }

  let phoneKnown = false;
  const phoneNorm = normalisePhone(cart.phone);
  if (phoneNorm) {
    phoneKnown = await anvandaAdresser.finnsTelefon(phoneNorm);
  }

  const shouldSendNoCode = belowMin || addressKnown || phoneKnown;

  if (shouldSendNoCode) {
    return sendStep3NoCode(cart);
  }

  // Mint and send the 5% code -----------------------------------------------
  // If coupon minting fails (e.g. a transient Wix Coupons API error), we must
  // still send email 3 — fall back to the no-code variant rather than dropping
  // the whole step and retrying forever.
  const subtotalSek = Math.round(cart.subtotal_minor / 100);
  let minted;
  try {
    minted = await mintAbandonedCartCoupon({ cartId: cart.id, subtotalSek });
  } catch (err) {
    console.error('[abandoned-cart] coupon mint failed, sending no-code variant', cart.id, err instanceof Error ? err.message : err);
    return sendStep3NoCode(cart);
  }

  await kundvagnar.uppdatera(cart.id, { discountCode: minted.code, discountCodeWixId: minted.wixCouponId });

  const subject = '5% extra för att slutföra';
  const { html, text } = await renderAbandonedCart3({
    items: cart.items_json,
    recoverUrl: cart.recover_url ?? 'https://www.fyndplats.se',
    subtotalMinor: cart.subtotal_minor,
    currency: cart.currency,
    discountCode: minted.code,
    expiresAt: minted.expiresAt,
    unsubscribeUrl: unsubscribeUrl(cart.email),
  });
  const send = await resend().emails.send({
    from: FROM,
    to: cart.email,
    replyTo: REPLY_TO,
    subject,
    html,
    text,
    headers: unsubHeaders(cart.email),
  });
  await loggaMejl(cart, 3, send.data?.id ?? null, minted.code);
  return {
    cartId: cart.id,
    step: 3,
    action: 'sent',
    resendId: send.data?.id,
    discountCode: minted.code,
  };
}
