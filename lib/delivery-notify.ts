// lib/delivery-notify.ts
//
// Skickar leveransnotisen ("ute för leverans" / "levererat") till kunden.
// EN sändare för båda källorna:
//   - 17TRACK-push        (app/api/track17-webhook)
//   - AliExpress-pollen   (app/api/cron/ae-delivery-poll)
//
// Bruten ur webhooken 2026-09-01 när pollen byggdes. Mejlets innehåll —
// ordersammanfattning, omdömeslänk, maskerad transportör — och dedupen mot
// SMS-flödet är samma oavsett vem som upptäckte leveransen; en andra kopia i
// pollen hade varit exakt den tvilling som förr eller senare mejlar något
// annat än webhooken.
//
// Maskering: mejlet visar generisk status + (allowlistad) transportör + ev.
// /sparning-länk. Inga händelser, ingen ursprungs-carrier, inget land → kan
// inte läcka dropship-ursprunget. Ordersammanfattningen hämtas ur VÅR
// Wix-order, alltså svenska titlar och vår egen media.

import { Resend } from "resend";
import { render } from "@react-email/render";
import { maskCarrierOrUndefined } from "@/lib/carrier-mask";
import { claimDeliveryNotification, releaseDeliveryNotification } from "@/lib/delivery-dedup";
import { reviewFormUrl } from "@/lib/review-token";
import { fetchWixOrder, buildOrderConfirmationProps } from "@/app/api/wix-webhook/route";
import type { OrderLineItem } from "@/emails/order-confirmation";
import DeliveryNotificationEmail, { deliverySubject } from "@/emails/delivery-notification";
import type { NotisStatus } from "@/lib/delivery-status";

const FROM = "Fyndplats <orders@fyndplats.se>";
const REPLY_TO = "info@fyndplats.com";

/** Det pollen och webhooken vet om kunden — raden ur tracking_mapping. */
export type NotisMottagare = {
  order_id: string | null;
  customer_email: string;
  customer_name: string | null;
};

export type NotisUtfall =
  | { sent: true; resendId?: string }
  | {
      sent: false;
      reason: "resend_not_configured" | "duplicate_suppressed" | "resend_failed" | "internal_error";
    };

function firstName(fullName: string | null): string {
  if (!fullName) return "kund";
  return fullName.trim().split(/\s+/)[0] || "kund";
}

/**
 * Skickar notisen, med dedup. Kastar aldrig — utfallet bär skälet.
 *
 * `channel` är dedup-nyckelns avsändare ("track17" / "ae-poll") och syns i
 * delivery_notifications så en audit kan se vilken källa som vann.
 * `rawCarrier` maskas HÄR (allowlist) — anroparen skickar vad källan sa.
 */
export async function sendDeliveryNotification(args: {
  trackingNumber: string;
  mottagare: NotisMottagare;
  status: NotisStatus;
  rawCarrier?: string | null;
  channel: string;
  /** Loggprefix, t.ex. "[track17-webhook]". */
  logg: string;
}): Promise<NotisUtfall> {
  const { trackingNumber, mottagare, status, channel, logg } = args;

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error(`${logg} RESEND_API_KEY saknas — kan inte mejla`);
    return { sent: false, reason: "resend_not_configured" };
  }

  // Ordersammanfattning + omdömeslänk — SAMMA innehåll som SMS-vägen bygger.
  // Best-effort: misslyckas Wix-uppslaget skickas mejlet ändå, bara utan
  // sammanfattningen.
  //
  // FÖRE dedup-anspråket, inte efter. Anspråket är ett löfte att vi skickar:
  // dör funktionen mellan anspråk och utskick ligger det kvar och mejlet
  // uteblir tyst. Uppslaget får ta upp till 8 s (fetchWixOrder:s tidsgräns)
  // och hade förlängt just det fönstret. Här kostar det på sin höjd ett
  // bortkastat Wix-anrop när en dubblett ändå skulle förlora anspråket.
  let orderSummary: { orderNumber?: string; items?: OrderLineItem[] } = {};
  if (mottagare.order_id) {
    try {
      const order = await fetchWixOrder(mottagare.order_id);
      const built = order ? buildOrderConfirmationProps(order) : null;
      if (built) orderSummary = { orderNumber: built.orderNumber, items: built.items };
    } catch (err) {
      console.warn(`${logg} kunde inte hämta order för mejlet:`, err instanceof Error ? err.message : err);
    }
  }

  // Null utan REVIEW_TOKEN_SECRET → ingen knapp. Mallen visar den dessutom
  // bara vid levererat, så "på väg"-mejlet frågar aldrig om omdöme.
  const reviewUrl = mottagare.order_id
    ? reviewFormUrl(mottagare.order_id, "https://www.fyndplats.se", process.env.REVIEW_TOKEN_SECRET) ?? undefined
    : undefined;

  // Dedup mot SMS-flödet OCH mellan push och poll: först till (number, status)
  // vinner. Allt tungt är gjort — härifrån till send() är det bara rendering.
  const won = await claimDeliveryNotification(trackingNumber, status, channel, mottagare.customer_email);
  if (!won) return { sent: false, reason: "duplicate_suppressed" };

  const props = {
    ...orderSummary,
    reviewUrl,
    firstName: firstName(mottagare.customer_name),
    status,
    // Spåra-knapp bara för "på väg" (meningslös efter levererat).
    trackingNumber: status === "delivered" ? undefined : trackingNumber,
    carrier: maskCarrierOrUndefined(args.rawCarrier),
  };

  try {
    const html = await render(DeliveryNotificationEmail(props));
    const subject = deliverySubject({ status });
    const sent = await new Resend(resendKey).emails.send({
      from: FROM,
      to: mottagare.customer_email,
      replyTo: REPLY_TO,
      subject,
      html,
    });
    if (sent.error) {
      // Släpp anspråket så en retry (eller den andra kanalen) kan ta över.
      await releaseDeliveryNotification(trackingNumber, status);
      console.error(`${logg} Resend-fel`, sent.error);
      return { sent: false, reason: "resend_failed" };
    }
    console.log(`${logg} notis skickad: ${trackingNumber} → ${mottagare.customer_email} (${status}, via ${channel}, resendId=${sent.data?.id})`);
    return { sent: true, resendId: sent.data?.id };
  } catch (err) {
    await releaseDeliveryNotification(trackingNumber, status);
    console.error(`${logg} oväntat fel under email-send`, err);
    return { sent: false, reason: "internal_error" };
  }
}
