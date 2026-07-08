"use server";

import { revalidatePath } from "next/cache";
import { extractAliExpressProductId, getInventory } from "@/lib/aliexpress/client";
import { getStore } from "@/lib/store/factory";
import { assertTransition } from "@/lib/orders/status";
import { placeOrderForTask, type PlaceOrderResult } from "@/lib/orders/place-order";
import type { ShippingAddress } from "@/lib/orders/types";

type ActionResult = { ok: true } | { ok: false; error: string };

const cleanStr = (s: string | undefined): string | undefined => {
  const t = (s ?? "").trim();
  return t || undefined;
};

/** Form-action-wrapper — returnerar inget och funkar med <form action>. */
export async function placeAliExpressOrderAction(taskId: string): Promise<void> {
  await placeAliExpressOrder(taskId);
}

/** Klient-action som RETURNERAR utfallet så admin-knappen kan visa fel/framgång
 *  i stället för att göra "ingenting" (form-action-wrappern ovan sväljer allt).
 *  All logik + guards ligger i den delade placeOrderForTask. */
export async function placeAliExpressOrderResultAction(taskId: string): Promise<PlaceOrderResult> {
  return placeAliExpressOrder(taskId);
}

/**
 * Markerar en `pending_payment`-task som lagd (status → "ordered") efter att
 * Leonard betalat ordern på AliExpress, så att poll-tracking-cronen plockar upp
 * den och hämtar spårningsnummer. Utan detta fastnar betal-väntande order osynligt.
 */
export async function markTaskOrderedAction(taskId: string): Promise<void> {
  const store = getStore();
  const task = (await store.listTasks()).find((t) => t.taskId === taskId);
  if (!task) return;
  try {
    assertTransition(task.status, "ordered");
  } catch {
    return; // ogiltig övergång (t.ex. redan shipped) — gör inget
  }
  await store.setTaskStatus(taskId, "ordered");
  await store.appendAudit({
    at: new Date().toISOString(),
    kind: "ordered",
    ref: taskId,
    detail: "manuellt markerad som betald/lagd via admin",
  });
  revalidatePath("/admin");
}

/**
 * Redigerar en tasks leveransadress manuellt (t.ex. om Wix-ordern saknade gata,
 * eller kunden hörde av sig med en rättelse) INNAN AliExpress-ordern läggs.
 * Trimmar + tomma-till-undefined. Vägrar när ordern redan är lagd (adressen
 * ligger då hos AliExpress). F50-adressspärren i placeOrderForTask fångar ändå
 * en ofullständig adress vid orderläggningen, så en delvis sparad adress kan
 * aldrig ge en oleverabar order.
 */
export async function updateTaskAddressAction(
  taskId: string,
  address: ShippingAddress,
): Promise<ActionResult> {
  const store = getStore();
  const task = (await store.listTasks()).find((t) => t.taskId === taskId);
  if (!task) return { ok: false, error: "Task hittades inte" };
  if (task.aliexpressOrderId) {
    return { ok: false, error: "Ordern är redan lagd hos AliExpress — adressen kan inte ändras här." };
  }
  const next: ShippingAddress = {
    fullName: cleanStr(address.fullName),
    addressLine1: cleanStr(address.addressLine1),
    addressLine2: cleanStr(address.addressLine2),
    postalCode: cleanStr(address.postalCode),
    city: cleanStr(address.city),
    province: cleanStr(address.province),
    country: cleanStr(address.country)?.toUpperCase(),
    phone: cleanStr(address.phone),
  };
  await store.updateTask(taskId, { shippingAddress: next });
  await store.appendAudit({
    at: new Date().toISOString(),
    kind: "address-edited",
    ref: taskId,
    detail: `leveransadress ändrad manuellt via admin (${next.fullName ?? "?"}, ${next.addressLine1 ?? "?"}, ${next.postalCode ?? ""} ${next.city ?? ""})`,
  });
  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Släpper ett fastlåst task-claim + rensar granskningsflaggorna (osäkert utfall /
 * annullering-race) så en fastnad task kan hanteras/läggas om i appen i stället
 * för databas-kirurgi. SÄKERHET: vägrar när ett AE-order-id finns — då KAN en
 * order redan vara lagd, och att släppa låset skulle riskera en dubbelbeställning.
 * Verifiera/avbeställ på AliExpress först i det fallet.
 */
export async function releaseTaskAction(taskId: string): Promise<ActionResult> {
  const store = getStore();
  const task = (await store.listTasks()).find((t) => t.taskId === taskId);
  if (!task) return { ok: false, error: "Task hittades inte" };
  if (task.aliexpressOrderId) {
    return {
      ok: false,
      error: "Tasken har ett AliExpress-order-id — verifiera/avbeställ ordern på AliExpress först. Låset släpps inte (dubbel-order-risk).",
    };
  }
  await store.updateTask(taskId, {
    claimToken: undefined,
    orderUncertain: undefined,
    uncertainAt: undefined,
    cancelMidOrder: undefined,
    cancelMidOrderAt: undefined,
  });
  await store.appendAudit({
    at: new Date().toISOString(),
    kind: "task-unlocked",
    ref: taskId,
    detail: "lås + granskningsflaggor rensade manuellt via admin",
  });
  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Lägger AliExpress-ordern för en task. Tunn wrapper runt den DELADE
 * `placeOrderForTask` (samma kod som /api/aliexpress/order kör) — guards,
 * variant-match, atomisk dubbel-order-claim och utfallshantering ligger där.
 */
export async function placeAliExpressOrder(taskId: string) {
  const result = await placeOrderForTask(getStore(), taskId);
  if (result.ok) revalidatePath("/admin");
  return result;
}

/**
 * Hämtar en alternativ AliExpress-leverantörs SKU:er så Leonard kan VÄLJA rätt
 * variant vid ett per-order leverantörsbyte (i stället för att gissa skuId, som
 * vid fel skulle ge en felaktig order). Server action som returnerar data till
 * klient-komponenten. Inga skrivningar. (Typen inlinas: en "use server"-fil får
 * bara exportera async-funktioner.)
 */
export async function fetchSupplierVariantsAction(
  productIdOrUrl: string,
): Promise<
  | {
      ok: true;
      productId: string;
      variants: { skuId: string; label: string; price: number; stock: number; shipFrom?: string }[];
    }
  | { ok: false; error: string }
> {
  const productId = extractAliExpressProductId(productIdOrUrl ?? "");
  if (!productId) return { ok: false, error: "Kunde inte tolka produkt-id eller URL" };
  try {
    const inv = await getInventory(productId);
    if (inv.length === 0) return { ok: false, error: "Produkten saknar hämtbara varianter" };
    return {
      ok: true,
      productId,
      variants: inv.map((v) => ({
        skuId: v.skuId,
        label: Object.values(v.skuProps).filter(Boolean).join(" / ") || v.skuId,
        price: v.price,
        stock: v.stock,
        shipFrom: v.shipFrom,
      })),
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Sätter ett per-order leverantörsbyte på en pending task. Påverkar INTE
 * produktens globala mappning — bara denna orderrad. Vägrar om ordern redan är
 * lagd (då skulle bytet vara verkningslöst/missvisande).
 */
export async function setOrderSupplierOverrideAction(
  taskId: string,
  productId: string,
  skuId: string,
  label?: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!productId?.trim() || !skuId?.trim()) {
    return { ok: false, error: "Saknar produkt-id eller SKU" };
  }
  const store = getStore();
  const task = (await store.listTasks()).find((t) => t.taskId === taskId);
  if (!task) return { ok: false, error: "Task hittades inte" };
  if (task.aliexpressOrderId) {
    return { ok: false, error: "Ordern är redan lagd — kan inte byta leverantör" };
  }
  await store.updateTask(taskId, {
    overriddenSupplierProductId: productId.trim(),
    overriddenSupplierVariantId: skuId.trim(),
    overriddenSupplierLabel: label?.trim() || undefined,
  });
  await store.appendAudit({
    at: new Date().toISOString(),
    kind: "order-supplier-override-set",
    ref: taskId,
    detail: JSON.stringify({ productId: productId.trim(), skuId: skuId.trim(), label: label?.trim() }),
  });
  revalidatePath("/admin");
  return { ok: true };
}

/** Tar bort ett per-order leverantörsbyte → ordern faller tillbaka på produktens mappning. */
export async function clearOrderSupplierOverrideAction(
  taskId: string,
): Promise<{ ok: boolean; error?: string }> {
  const store = getStore();
  const task = (await store.listTasks()).find((t) => t.taskId === taskId);
  if (!task) return { ok: false, error: "Task hittades inte" };
  if (task.aliexpressOrderId) {
    return { ok: false, error: "Ordern är redan lagd" };
  }
  // updateTask gör en full-replace-upsert; undefined-fält faller bort vid
  // JSON.stringify (wix-data) resp. lämnas undefined (memory) → fälten rensas i
  // båda backends, ingen stale override blir kvar.
  await store.updateTask(taskId, {
    overriddenSupplierProductId: undefined,
    overriddenSupplierVariantId: undefined,
    overriddenSupplierLabel: undefined,
  });
  await store.appendAudit({
    at: new Date().toISOString(),
    kind: "order-supplier-override-cleared",
    ref: taskId,
  });
  revalidatePath("/admin");
  return { ok: true };
}
