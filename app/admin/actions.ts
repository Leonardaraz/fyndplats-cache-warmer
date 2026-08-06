"use server";

import { revalidatePath } from "next/cache";
import { extractAliExpressProductId, getInventory, getProduct, getTracking } from "@/lib/aliexpress/client";
import { getStore } from "@/lib/store/factory";
import { assertTransition } from "@/lib/orders/status";
import { placeOrderForTask, type PlaceOrderResult } from "@/lib/orders/place-order";
import { assessDsPrice, normalizeAeOrderId } from "@/lib/orders/price-check";
import { pricingConfigFromEnv } from "@/lib/config";
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
 *  All logik + guards ligger i den delade placeOrderForTask.
 *  `acceptPrice: true` = Leonard har sett prisvaktens stopp och valt API-vägen ändå. */
export async function placeAliExpressOrderResultAction(
  taskId: string,
  acceptPrice = false,
): Promise<PlaceOrderResult> {
  return placeAliExpressOrder(taskId, acceptPrice);
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
export async function placeAliExpressOrder(taskId: string, acceptPrice = false) {
  const result = await placeOrderForTask(getStore(), taskId, { acceptPrice });
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

/**
 * KOPPLAR en MANUELLT lagd AliExpress-order till en task (garderobs-incidenten
 * 2026-08-06: konsumentkassan med kampanj+kupong var 127 kr billigare än DS-API:t
 * — då beställer Leonard manuellt och klistrar in ordernumret här). Efter
 * kopplingen är ordern exakt lika automatisk som en API-order: poll-tracking-
 * cronen hämtar spårningsnummer → Wix-fulfillment → "På väg"-mejl + 17TRACK.
 *
 * PROBE: vi testar direkt om DS-spårnings-API:t ser ordern (det är byggt för
 * API-lagda ordrar; om det även svarar för konsumentordrar på samma konto är
 * odokumenterat). Svaret avgör bara BESKEDET till Leonard — kopplingen görs
 * ändå, för fallbacken är dagens rutin (klistra spårning i Wix manuellt) och
 * den blir aldrig sämre av ett sparat ordernummer.
 */
export async function linkAliExpressOrderAction(
  taskId: string,
  rawOrderId: string,
): Promise<{ ok: boolean; message: string }> {
  const orderId = normalizeAeOrderId(rawOrderId);
  if (!orderId) {
    return {
      ok: false,
      message: 'Det ser inte ut som ett AliExpress-ordernummer — kopiera "Ref. Number" ur din orderlista (bara siffror).',
    };
  }
  const store = getStore();
  const task = (await store.listTasks()).find((t) => t.taskId === taskId);
  if (!task) return { ok: false, message: "Ordern hittades inte." };
  if (task.aliexpressOrderId) {
    return { ok: false, message: `Ordern är redan kopplad till AE-order ${task.aliexpressOrderId}.` };
  }
  try {
    assertTransition(task.status, "ordered");
  } catch {
    return { ok: false, message: `Ordern har status "${task.status}" och kan inte kopplas.` };
  }

  // Probe FÖRE skrivning — men utfallet påverkar bara beskedet, inte kopplingen.
  let probeNote: string;
  try {
    const t = await getTracking(orderId);
    probeNote = t.trackingNumber
      ? `AliExpress ser ordern (spårning ${t.trackingNumber} finns redan) — allt sköts automatiskt härifrån.`
      : `AliExpress ser ordern${t.status ? ` (status: ${t.status})` : ""} — spårningen hämtas automatiskt när säljaren skickar.`;
  } catch {
    probeNote =
      "OBS: spårnings-API:t svarade inte för ordern ännu (vanligt för nyss lagda/manuella ordrar). " +
      "Kopplingen är gjord — dyker spårningen inte upp av sig själv inom ett dygn, klistra in den i Wix som vanligt.";
  }

  await store.updateTask(taskId, { aliexpressOrderId: orderId });
  await store.setTaskStatus(taskId, "ordered");
  await store.appendAudit({
    at: new Date().toISOString(),
    kind: "ae-order-linked",
    ref: taskId,
    detail: JSON.stringify({ orderId, probe: probeNote.slice(0, 120), source: "manuell koppling via admin" }),
  });
  revalidatePath("/admin");
  return { ok: true, message: `✓ Kopplad till AE-order ${orderId}. ${probeNote}` };
}

/**
 * PRISJÄMFÖRELSE inför orderläggning: dagens DS-API-pris för taskens variant +
 * importbaslinjen + länk till produktsidan. Konsumentkassans kampanjer/kuponger
 * är session-bundna och kan INTE läsas av servern — därför är sista ledet
 * mänskligt: Leonard öppnar produktsidan (inloggad) och jämför själv.
 * Inga skrivningar.
 */
export async function checkDsPriceAction(taskId: string): Promise<
  | {
      ok: true;
      dsPriceUsd: number;
      dsPriceSekApprox: number;
      importCostUsd?: number;
      diffPct?: number;
      verdict: "ok" | "expensive" | "unknown";
      productUrl: string;
      variantLabel?: string;
    }
  | { ok: false; error: string }
> {
  const store = getStore();
  const task = (await store.listTasks()).find((t) => t.taskId === taskId);
  if (!task) return { ok: false, error: "Ordern hittades inte." };
  if (!task.wixCatalogItemId) return { ok: false, error: "Saknar produktkoppling (wixCatalogItemId)." };
  const mapping = await store.getMappingByWixProductId(task.wixCatalogItemId);
  if (!mapping) return { ok: false, error: "Ingen AliExpress-mappning för produkten." };

  // Samma variantupplösning som placeOrderForTask (F49): SKU → entydiga choices →
  // enproduktsgenväg. Override-medveten: vid leverantörsbyte jämförs mot bytet
  // (utan importbaslinje — den gäller bara ordinarie mappning).
  let variant = task.sku ? mapping.variants.find((v) => v.sku === task.sku) : undefined;
  if (!variant) {
    const entries = Object.entries(task.variantChoices);
    if (entries.length > 0) {
      const hits = mapping.variants.filter((v) => entries.every(([k, val]) => v.choices[k] === val));
      variant = hits.length === 1 ? hits[0] : undefined;
    } else if (mapping.variants.length === 1) {
      variant = mapping.variants[0];
    }
  }
  const supplierProductId = task.overriddenSupplierProductId ?? mapping.supplierProductId;
  const supplierVariantId = task.overriddenSupplierVariantId ?? variant?.supplierVariantId;
  if (!supplierVariantId) return { ok: false, error: "Varianten kunde inte matchas mot AliExpress-SKU." };

  try {
    const p = await getProduct(supplierProductId);
    const sku = p.variants.find((v) => v.skuId === supplierVariantId || v.skuAttr === supplierVariantId);
    if (!sku || !(sku.price > 0)) {
      return { ok: false, error: "AliExpress gav inget pris för varianten just nu — försök igen strax." };
    }
    const baseline = task.overriddenSupplierProductId ? undefined : variant?.costUsd;
    const a = assessDsPrice(baseline, sku.price);
    const usdToSek = pricingConfigFromEnv().usdToSek;
    return {
      ok: true,
      dsPriceUsd: sku.price,
      dsPriceSekApprox: Math.round(sku.price * usdToSek),
      importCostUsd: a.importCostUsd,
      diffPct: a.diffPct,
      verdict: a.verdict,
      productUrl: `https://www.aliexpress.com/item/${supplierProductId}.html`,
      variantLabel: Object.values(sku.skuProps ?? {}).join(" / ") || undefined,
    };
  } catch (e) {
    return { ok: false, error: `Kunde inte hämta pris: ${e instanceof Error ? e.message : String(e)}` };
  }
}
