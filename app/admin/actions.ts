"use server";

import { revalidatePath } from "next/cache";
import { createOrder, extractAliExpressProductId, getInventory } from "@/lib/aliexpress/client";
import { getStore } from "@/lib/store/factory";
import { normalizeCountryCode } from "@/lib/orders/tasks";
import { assertTransition } from "@/lib/orders/status";

/** Form-action-wrapper — returnerar inget och funkar med <form action>. */
export async function placeAliExpressOrderAction(taskId: string): Promise<void> {
  await placeAliExpressOrder(taskId);
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

  // Matcha variant: SKU först (entydigt). Annars choices med EXAKT EN träff — en
  // ren `find` är VAKUÖST sann för tom variantChoices ({}) och skulle då ta FÖRSTA
  // varianten (fel SKU för multi-variant-produkt; tom {} är normalfallet när Wix
  // utelämnar options). Enproduktsgenväg bara när choices är tom (valet irrelevant);
  // tvetydiga (matchar flera) eller tomma choices på multi-variant → undefined →
  // grinden `if (!supplierVariantId)` nedan avbryter ordern i stället för att gissa.
  // (SKU-MISS faller medvetet vidare till choices/enproduktsfallback — räddar en
  // stale SKU på en enproduktsorder; kräver fortfarande entydig träff.)
  let variant = task.sku ? mapping.variants.find((v) => v.sku === task.sku) : undefined;
  if (!variant) {
    const choiceEntries = Object.entries(task.variantChoices);
    if (choiceEntries.length > 0) {
      const hits = mapping.variants.filter((v) =>
        choiceEntries.every(([k, val]) => v.choices[k] === val),
      );
      variant = hits.length === 1 ? hits[0] : undefined;
    } else if (mapping.variants.length === 1) {
      variant = mapping.variants[0];
    }
  }

  // Säkerhet (betalväg): ett HALVT override (bara produkt ELLER bara SKU) skulle
  // korsa källor — t.ex. leverantör B:s produkt med leverantör A:s SKU → fel vara
  // till kund. Kan inte uppstå via UI:t (set-action kräver båda + skriver atomiskt),
  // men en framtida skrivning/migrering/manuell wix-data-rad skulle kunna → vägra
  // hellre ordern än att lägga en korsad.
  if (Boolean(task.overriddenSupplierProductId) !== Boolean(task.overriddenSupplierVariantId)) {
    return {
      ok: false,
      error: "Ofullständigt leverantörsbyte (produkt utan SKU eller tvärtom) — order avbruten.",
    };
  }

  // Per-order leverantörsbyte vinner över mappningen. När en override-SKU finns
  // beställer vi från en ANNAN källa → ingen variant-match mot mappningen krävs.
  const supplierProductId = task.overriddenSupplierProductId ?? mapping.supplierProductId;
  const supplierVariantId = task.overriddenSupplierVariantId ?? variant?.supplierVariantId;
  if (!supplierVariantId) {
    return { ok: false, error: "Variant kunde inte matchas till AliExpress-SKU" };
  }

  const a = task.shippingAddress;
  // Leverans-kritiska adressfält måste finnas — annars läggs en betald order med
  // tom gata/ort/postnummer som aldrig kan levereras. Namnet är kontaktuppgift och
  // defaultas i createOrder (gäst-order utan namn blockeras inte). Backstop finns
  // även i createOrder (skyddar /api/aliexpress/order-anroparen).
  const addrMissing = ([
    ["gatuadress", a.addressLine1],
    ["ort", a.city],
    ["postnummer", a.postalCode],
  ] as const).filter(([, v]) => !v || !v.trim()).map(([label]) => label);
  if (addrMissing.length) {
    return {
      ok: false,
      error: `Ofullständig leveransadress (saknar: ${addrMissing.join(", ")}) — order avbruten. Komplettera Wix-ordern och försök igen.`,
    };
  }
  // Vägra ogiltig kvantitet hellre än att tyst beställa 0 eller 1.
  if (!Number.isInteger(task.quantity) || task.quantity < 1) {
    return { ok: false, error: `Ogiltig kvantitet (${task.quantity}) — order avbruten.` };
  }
  // Vägra ordern om landskoden saknas/är ogiltig i stället för att tyst skicka
  // till Sverige (tidigare `?? "SE"`-default).
  const countryCode = normalizeCountryCode(a.country);
  if (!countryCode) {
    return {
      ok: false,
      error: `Saknar/ogiltig landskod i leveransadressen ("${a.country ?? ""}") — order avbruten. Kontrollera Wix-ordern.`,
    };
  }
  try {
    const result = await createOrder({
      productId: supplierProductId,
      skuId: supplierVariantId,
      quantity: task.quantity,
      shippingAddress: {
        name: a.fullName ?? "",
        addressLine1: a.addressLine1 ?? "",
        addressLine2: a.addressLine2,
        city: a.city ?? "",
        postalCode: a.postalCode ?? "",
        countryCode,
        phone: a.phone,
      },
    });

    await store.updateTask(taskId, {
      aliexpressOrderId: result.tradeOrderId,
      status: result.paymentRequired ? "pending_payment" : "ordered",
      ...(result.paymentRequired && result.paymentUrl ? { paymentUrl: result.paymentUrl } : {}),
    });
    await store.appendAudit({
      at: new Date().toISOString(),
      kind: "aliexpress-order-placed",
      ref: taskId,
      detail: JSON.stringify({
        tradeOrderId: result.tradeOrderId,
        paymentRequired: result.paymentRequired,
        ...(task.overriddenSupplierProductId
          ? {
              overriddenSupplier: {
                productId: supplierProductId,
                skuId: supplierVariantId,
                label: task.overriddenSupplierLabel,
              },
            }
          : {}),
      }),
    });
    revalidatePath("/admin");
    return { ok: true, tradeOrderId: result.tradeOrderId, paymentUrl: result.paymentUrl };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
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
