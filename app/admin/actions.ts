"use server";

import { revalidatePath } from "next/cache";
import { extractAliExpressProductId, getInventory, getProduct, getTracking, queryFreightToCountry } from "@/lib/aliexpress/client";
import { matchAeVariant, parseDeliveryOptions } from "@/lib/aliexpress/freight";
import { normalizeCountryCode } from "@/lib/orders/tasks";
import { getStore } from "@/lib/store/factory";
import { assertTransition } from "@/lib/orders/status";
import { placeOrderForTask, type PlaceOrderResult } from "@/lib/orders/place-order";
import { assessDsPrice, normalizeAeOrderId } from "@/lib/orders/price-check";
import { aliExpressIdOf, mappingSupplier } from "@/lib/store/supplier";
import { aliExpressIdFromListing } from "@/lib/aliexpress/product-id";
import { pricingConfigFromEnv } from "@/lib/config";
import type { ShippingAddress, TaskStatus } from "@/lib/orders/types";

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
    const svar = await getInventory(productId);
    // Nedtagen listning (audit 2026-08-24): det HÄR är väljaren Leonard använder
    // för att peka om en order till en annan leverantörsprodukt. Att kunna välja
    // en död listning här är samma fel som startade hela historien, fast manuellt
    // och en order senare. Bara ett UTTRYCKLIGT "offline" avvisar.
    if (svar.listingAvailability === "offline") {
      return {
        ok: false,
        error: `AliExpress-listningen är nedtagen${svar.offlineReason ? ` (${svar.offlineReason})` : ""} — går inte att beställa. Välj en annan produkt.`,
      };
    }
    const inv = svar.variants;
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
  // Redan "ordered" utan ordernummer (t.ex. manuellt markerad som lagd) är ett
  // GILTIGT kopplingsläge — det är id:t som saknas, inte statusen. Audit
  // 2026-08-06: assertTransition(ordered→ordered) skulle annars vägra exakt
  // det fall fältet finns för. Övriga statusar måste kunna GÅ till ordered.
  const alreadyOrdered = task.status === "ordered";
  if (!alreadyOrdered) {
    try {
      assertTransition(task.status, "ordered");
    } catch {
      return { ok: false, message: `Ordern har status "${task.status}" och kan inte kopplas.` };
    }
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

  // Id + status i EN skrivning (updateTask är full-replace-upsert i båda
  // backends) — ett delskrivet läge "id utan ordered" skulle varken pollas
  // eller gå att lägga om, och syns inte i någon vy.
  await store.updateTask(taskId, { aliexpressOrderId: orderId, status: "ordered" });
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
  // ☠️ AOSOM-SPÄRR (hittad 2026-08-28 av den märkta id-typen, inte av en
  // människa). Åtgärden körs på en ORDER-task, och en kund kan lika gärna ha
  // köpt en Aosom-vara: då bär mappningen "aosom:845-030CG" i samma fält, och
  // utan spärren gick artikelnumret rakt in i AE:s API. Felet hade pekat åt
  // fel håll — "produkten hittades inte hos AliExpress" om något som aldrig
  // legat där. Överstyrningen kommer däremot från AE-väljaren och är per
  // definition ett AE-id.
  const aeProductId = task.overriddenSupplierProductId
    ? aliExpressIdFromListing(task.overriddenSupplierProductId)
    : aliExpressIdOf(mapping);
  if (!aeProductId) {
    return {
      ok: false,
      error:
        mappingSupplier(mapping) === "aosom"
          ? "Produkten kommer från Aosom — det här är en AliExpress-funktion. "
            + "Aosom-priser står i feeden och ordrar läggs i klump via /admin/aosom-order."
          : "Mappningen saknar leverantörens produkt-id — koppla om produkten i /admin/mappings först.",
    };
  }
  const supplierVariantId = task.overriddenSupplierVariantId ?? variant?.supplierVariantId;
  if (!supplierVariantId) return { ok: false, error: "Varianten kunde inte matchas mot AliExpress-SKU." };

  try {
    const p = await getProduct(aeProductId);
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
      productUrl: `https://www.aliexpress.com/item/${aeProductId}.html`,
      variantLabel: Object.values(sku.skuProps ?? {}).join(" / ") || undefined,
    };
  } catch (e) {
    return { ok: false, error: `Kunde inte hämta pris: ${e instanceof Error ? e.message : String(e)}` };
  }
}

/**
 * Stänger en task som redan är HANTERAD UTANFÖR systemet, så den lämnar kön och
 * order-guarden slutar påminna om den.
 *
 * Luckan den täpper till (Leonards rapport 2026-08-15): granskningsrutan säger
 * ordagrant "Annars kan tasken avbrytas" — men det fanns ingen knapp som kunde
 * göra det. Enda åtgärden var "Släpp lås", som gör MOTSATSEN: den rensar låset
 * så tasken kan läggas som order igen. På en task där kunden redan fått
 * återbetalning är det aktivt farligt — nästa klick kan lägga en AliExpress-order
 * för en order som inte längre finns.
 *
 * Två utfall, båda terminala:
 *   • "cancelled"  — kunden återbetalad/ordern annullerad. Ingen vara ska skickas.
 *   • "fulfilled"  — varan ÄR beställd/skickad manuellt. Vi kliver via `ordered`
 *     till `shipped` (båda övergångarna lagliga var för sig — statusmaskinen
 *     tillåter inte pending→shipped i ett hopp) så tasken blir terminal i stället
 *     för att ligga kvar som "beställd utan spårning" och larma efter 5 dagar.
 *
 * Skriver alltid en audit-rad med orsak — en task som lämnar kön utan spår är
 * värre än en som ligger kvar.
 */
export async function closeTaskAction(
  taskId: string,
  outcome: "cancelled" | "fulfilled",
): Promise<ActionResult> {
  const store = getStore();
  const task = (await store.listTasks()).find((t) => t.taskId === taskId);
  if (!task) return { ok: false, error: "Task hittades inte" };
  if (task.status === "shipped" || task.status === "cancelled") {
    return { ok: false, error: `Tasken är redan ${task.status} — inget att stänga.` };
  }

  const steps: ("ordered" | "shipped" | "cancelled")[] =
    outcome === "cancelled"
      ? ["cancelled"]
      : task.status === "ordered"
        ? ["shipped"]
        : ["ordered", "shipped"];

  let from: TaskStatus = task.status;
  for (const to of steps) {
    try {
      assertTransition(from, to);
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
    await store.setTaskStatus(taskId, to);
    from = to;
  }

  await store.appendAudit({
    at: new Date().toISOString(),
    kind: "task-closed",
    ref: taskId,
    detail:
      outcome === "cancelled"
        ? "stängd manuellt via admin: kunden återbetalad/ordern annullerad — ingen vara skickas"
        : "stängd manuellt via admin: hanterad utanför systemet (beställd/skickad för hand)",
  });
  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Fraktdiagnos för EN task: visar exakt vad AliExpress svarar på vår
 * fraktförfrågan, och vilka SKU:er produkten har.
 *
 * Finns för att order #10021 avvisades med DELIVERY_METHOD_NOT_EXIST medan
 * AliExpress egen produktsida samtidigt erbjöd frakt från tre länder. Två
 * gissningar om orsaken visade sig fel (först fraktsättets namn, sedan att
 * varan inte gick att skicka alls), och en tredje gissning vore inte bättre än
 * de förra. Den här knappen lägger fram rådatat i stället.
 *
 * Läser bara — lägger ingen order och ändrar ingenting.
 */
export async function freightDiagnosticsAction(taskId: string): Promise<
  | {
      ok: true;
      skuIdUsed: string | null;
      supplierVariantId: string;
      country: string;
      optionCount: number;
      options: { serviceName: string; costSek: number | null; maxDays: number | null }[];
      /** Alla SKU:er produkten har — avslöjar om vår pekar på fel lager. */
      allSkus: { skuId: string; props: string }[];
      rawSnippet: string;
    }
  | { ok: false; error: string }
> {
  const store = getStore();
  const task = (await store.listTasks()).find((t) => t.taskId === taskId);
  if (!task) return { ok: false, error: "Ordern hittades inte." };
  if (!task.wixCatalogItemId) return { ok: false, error: "Saknar produktkoppling." };
  const mapping = await store.getMappingByWixProductId(task.wixCatalogItemId);
  if (!mapping) return { ok: false, error: "Ingen AliExpress-mappning." };

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
  // ☠️ AOSOM-SPÄRR (hittad 2026-08-28 av den märkta id-typen, inte av en
  // människa). Åtgärden körs på en ORDER-task, och en kund kan lika gärna ha
  // köpt en Aosom-vara: då bär mappningen "aosom:845-030CG" i samma fält, och
  // utan spärren gick artikelnumret rakt in i AE:s API. Felet hade pekat åt
  // fel håll — "produkten hittades inte hos AliExpress" om något som aldrig
  // legat där. Överstyrningen kommer däremot från AE-väljaren och är per
  // definition ett AE-id.
  const aeProductId = task.overriddenSupplierProductId
    ? aliExpressIdFromListing(task.overriddenSupplierProductId)
    : aliExpressIdOf(mapping);
  if (!aeProductId) {
    return {
      ok: false,
      error:
        mappingSupplier(mapping) === "aosom"
          ? "Produkten kommer från Aosom — det här är en AliExpress-funktion. "
            + "Aosom-priser står i feeden och ordrar läggs i klump via /admin/aosom-order."
          : "Mappningen saknar leverantörens produkt-id — koppla om produkten i /admin/mappings först.",
    };
  }
  const supplierVariantId = task.overriddenSupplierVariantId ?? variant?.supplierVariantId ?? "";
  if (!supplierVariantId) return { ok: false, error: "Kunde inte matcha varianten till en SKU." };

  const country = normalizeCountryCode(task.shippingAddress?.country) ?? "SE";

  try {
    const ae = await getProduct(aeProductId);
    const skuIdUsed = /^\d+$/.test(supplierVariantId)
      ? supplierVariantId
      : matchAeVariant(supplierVariantId, ae.variants);

    const svar = skuIdUsed
      ? await queryFreightToCountry(aeProductId, skuIdUsed, country, task.quantity)
      : null;
    const options = svar ? parseDeliveryOptions(svar) : [];

    return {
      ok: true,
      skuIdUsed,
      supplierVariantId,
      country,
      optionCount: options.length,
      options,
      allSkus: ae.variants.map((v) => ({
        skuId: v.skuId,
        props: Object.entries(v.skuProps ?? {})
          .map(([k, val]) => `${k}: ${val}`)
          .join(", "),
      })),
      rawSnippet: JSON.stringify(svar ?? { note: "inget sku_id kunde härledas" }).slice(0, 1200),
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
