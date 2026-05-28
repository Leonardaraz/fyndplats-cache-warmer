"use server";

import { revalidatePath } from "next/cache";
import { createOrder } from "@/lib/aliexpress/client";
import { getStore } from "@/lib/store/factory";

/** Form-action-wrapper — returnerar inget och funkar med <form action>. */
export async function placeAliExpressOrderAction(taskId: string): Promise<void> {
  await placeAliExpressOrder(taskId);
}

/**
 * Hämtar en task ur store, slår upp leverantörsmappningen,
 * matchar rätt variant och placerar ordern via AliExpress DS API.
 * Sparar tradeOrderId på tasken så cron-jobbet kan polla för spårning.
 */
export async function placeAliExpressOrder(taskId: string) {
  const store = getStore();
  const tasks = await store.listTasks();
  const task = tasks.find((t) => t.taskId === taskId);
  if (!task) return { ok: false, error: "Task hittades inte" };
  if (task.aliexpressOrderId) return { ok: false, error: "Ordern är redan lagd hos AliExpress" };
  if (!task.wixCatalogItemId) return { ok: false, error: "Saknar wixCatalogItemId — kan inte hitta mappning" };
  if (!task.shippingAddress) return { ok: false, error: "Saknar leveransadress" };

  const mapping = await store.getMappingByWixProductId(task.wixCatalogItemId);
  if (!mapping) return { ok: false, error: "Ingen AliExpress-mappning för produkten" };

  // Matcha variant via SKU eller via choices.
  const variant = task.sku
    ? mapping.variants.find((v) => v.sku === task.sku)
    : mapping.variants.find((v) =>
        Object.entries(task.variantChoices).every(([k, val]) => v.choices[k] === val),
      );
  if (!variant) return { ok: false, error: "Variant kunde inte matchas till AliExpress-SKU" };

  const a = task.shippingAddress;
  try {
    const result = await createOrder({
      productId: mapping.supplierProductId,
      skuId: variant.supplierVariantId,
      quantity: task.quantity,
      shippingAddress: {
        name: a.fullName ?? "",
        addressLine1: a.addressLine1 ?? "",
        addressLine2: a.addressLine2,
        city: a.city ?? "",
        postalCode: a.postalCode ?? "",
        countryCode: a.country ?? "SE",
        phone: a.phone,
      },
    });

    await store.updateTask(taskId, {
      aliexpressOrderId: result.tradeOrderId,
      status: result.paymentRequired ? "pending_payment" : "ordered",
    });
    await store.appendAudit({
      at: new Date().toISOString(),
      kind: "aliexpress-order-placed",
      ref: taskId,
      detail: JSON.stringify({
        tradeOrderId: result.tradeOrderId,
        paymentRequired: result.paymentRequired,
      }),
    });
    revalidatePath("/admin");
    return { ok: true, tradeOrderId: result.tradeOrderId, paymentUrl: result.paymentUrl };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
