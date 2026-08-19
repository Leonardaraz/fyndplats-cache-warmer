import { randomUUID } from "node:crypto";
import {
  createOrder,
  getProduct,
  OrderValidationError,
  queryFreightToCountry,
} from "@/lib/aliexpress/client";
import {
  deliveryCandidates,
  isDeliveryMethodMissing,
  shippingServiceNames,
} from "@/lib/aliexpress/freight";
import { normalizeCountryCode, provinceFromSwedishPostalCode } from "@/lib/orders/tasks";
import { isTerminal } from "@/lib/orders/status";
import { assessDsPrice } from "@/lib/orders/price-check";
import type { Store } from "@/lib/store";

/** Fraktsättet createOrder skickar när inget annat anges. */
const DEFAULT_DELIVERY_METHOD = "CAINIAO_ECONOMY_GLOBAL";
/**
 * Tak för hur många alternativa fraktsätt vi provar. Varje försök är ett
 * API-anrop i en admin-request; listan kan vara lång och de billigaste ligger
 * först, så tre räcker i praktiken och håller svarstiden nere.
 */
const MAX_DELIVERY_RETRIES = 3;

export type PlaceOrderResult =
  | { ok: true; tradeOrderId: string; paymentUrl?: string }
  | {
      ok: false;
      error: string;
      /**
       * Satt när PRISVAKTEN stoppade (inte ett fel — ett beslut åt Leonard):
       * dagens DS-pris är märkbart över importbaslinjen. UI:t visar siffrorna +
       * produktlänk och erbjuder "Lägg ändå" (acceptPrice: true). Ingen claim
       * togs, ingen order lades — helt säkert att försöka igen.
       */
      priceStop?: { dsPriceUsd: number; importCostUsd: number; diffPct: number; productUrl: string };
    };

/**
 * Lägger AliExpress-ordern för EN fulfillment-task. DELAD av admin-action OCH
 * /api/aliexpress/order så BÅDA vägarna går genom samma guards + samma atomiska
 * dubbel-order-lås (annars kan en oskyddad väg kringgå skyddet).
 *
 * Ordning (säkerhetsbärande — får ej kastas om):
 *   guards → variant-match (F49) → HALV-override-grind → supplier-härledning →
 *   adress (F50) → kvantitet (FD) → land → CLAIM (CAS, sist före createOrder) →
 *   createOrder → utfall:
 *     success              → skriv aliexpressOrderId/status i EGEN try/catch (post-order-
 *                            skrivfel får ALDRIG ge retry-bart fel — ordern är ju lagd).
 *     OrderValidationError → releaseTask (SÄKERT: kastas FÖRE AE-API → ingen order skapad).
 *     okänt fel / tomt id  → release INTE (AE-order kan finnas), flagga orderUncertain +
 *                            audit, "verifiera manuellt". Claimen stannar → ingen auto-reclaim.
 */
export async function placeOrderForTask(
  store: Store,
  taskId: string,
  opts: { acceptPrice?: boolean } = {},
): Promise<PlaceOrderResult> {
  const task = (await store.listTasks()).find((t) => t.taskId === taskId);
  if (!task) return { ok: false, error: "Task hittades inte" };
  if (task.aliexpressOrderId) return { ok: false, error: "Ordern är redan lagd hos AliExpress" };
  // F19: en avbruten/skickad order får aldrig beställas, och en återbetald order är
  // blockerad tills Leonard granskat (en återbetalning kan vara delvis → flaggad, ej
  // auto-avbruten). Vägra hellre än att lägga en order för en död/återbetald kund.
  if (isTerminal(task.status)) {
    return { ok: false, error: `Ordern har status "${task.status}" — ingen order läggs.` };
  }
  if (task.refundFlagged) {
    return { ok: false, error: "Återbetalning registrerad för ordern — granska och avbryt manuellt innan en AliExpress-order läggs." };
  }
  if (!task.wixCatalogItemId) return { ok: false, error: "Saknar wixCatalogItemId — kan inte hitta mappning" };
  if (!task.shippingAddress) return { ok: false, error: "Saknar leveransadress" };

  const mapping = await store.getMappingByWixProductId(task.wixCatalogItemId);
  if (!mapping) return { ok: false, error: "Ingen AliExpress-mappning för produkten" };

  // F49: SKU först (entydigt); annars choices med EXAKT EN träff; enproduktsgenväg bara
  // vid tom choices. Tvetydiga/tomma choices på multi-variant → undefined → avbryt nedan.
  let variant = task.sku ? mapping.variants.find((v) => v.sku === task.sku) : undefined;
  if (!variant) {
    const choiceEntries = Object.entries(task.variantChoices);
    if (choiceEntries.length > 0) {
      const hits = mapping.variants.filter((v) => choiceEntries.every(([k, val]) => v.choices[k] === val));
      variant = hits.length === 1 ? hits[0] : undefined;
    } else if (mapping.variants.length === 1) {
      variant = mapping.variants[0];
    }
  }

  // HALV-override-grind MÅSTE ligga FÖRE supplier-fallbacken nedan, annars maskeras en
  // korsad källa (B:s produkt + A:s SKU → fel vara). Vägra hellre än att lägga korsad.
  if (Boolean(task.overriddenSupplierProductId) !== Boolean(task.overriddenSupplierVariantId)) {
    return { ok: false, error: "Ofullständigt leverantörsbyte (produkt utan SKU eller tvärtom) — order avbruten." };
  }
  const supplierProductId = task.overriddenSupplierProductId ?? mapping.supplierProductId;
  const supplierVariantId = task.overriddenSupplierVariantId ?? variant?.supplierVariantId;
  if (!supplierVariantId) return { ok: false, error: "Variant kunde inte matchas till AliExpress-SKU" };

  const a = task.shippingAddress;
  // F50: leverans-kritiska adressfält måste finnas (namn defaultas i createOrder).
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
  // FD: ogiltig kvantitet vägras.
  if (!Number.isInteger(task.quantity) || task.quantity < 1) {
    return { ok: false, error: `Ogiltig kvantitet (${task.quantity}) — order avbruten.` };
  }
  // Land: vägra hellre än att tyst skicka till fel destination.
  const countryCode = normalizeCountryCode(a.country);
  if (!countryCode) {
    return {
      ok: false,
      error: `Saknar/ogiltig landskod i leveransadressen ("${a.country ?? ""}") — order avbruten. Kontrollera Wix-ordern.`,
    };
  }
  // Läns-självläkning (order #10015, 2026-08-08): svenska kassaadresser saknar
  // ofta län — AliExpress avvisade ordern ("Selecciona un estado/provincia/
  // región"). Postnumret pekar ut länet deterministiskt → härled vid order-
  // läggning så även ÄLDRE tasks (skapade före fixen) läker utan att Leonard
  // behöver "Ändra adress". Bara SE; övriga länder kräver explicit province.
  const province =
    a.province ?? (countryCode === "SE" ? provinceFromSwedishPostalCode(a.postalCode) : undefined);

  // ── PRISVAKT (garderobs-incidenten 2026-08-06) ──
  // DS-API:t kan aldrig få kampanjpriser/kuponger, så när DS-priset stuckit
  // iväg mot importbaslinjen ska Leonard få välja väg INNAN någon order skapas.
  // Baslinjen gäller bara produktens egen mappning — vid leverantörsbyte
  // (override) finns ingen jämförbar costUsd → vakten står ned (unknown).
  // Fail-open: kan dagspriset inte hämtas läggs ordern som vanligt — en
  // pris-API-hicka får aldrig blockera en kundleverans. Ligger FÖRE claimen:
  // ett prisstopp låser ingenting och kan alltid provas om.
  if (!opts.acceptPrice) {
    try {
      const baseline = task.overriddenSupplierProductId ? undefined : variant?.costUsd;
      if (baseline && baseline > 0) {
        const now = await getProduct(supplierProductId);
        const skuNow = now.variants.find(
          (v) => v.skuId === supplierVariantId || v.skuAttr === supplierVariantId,
        );
        const price = assessDsPrice(baseline, skuNow?.price);
        if (price.verdict === "expensive") {
          await safeAudit(
            store, taskId, "price-guard-stop",
            `DS-pris $${price.dsPriceUsd} mot importpris $${price.importCostUsd} (+${price.diffPct} %)`,
          );
          return {
            ok: false,
            error:
              `Prisvakt: AliExpress-priset är just nu $${price.dsPriceUsd!.toFixed(2)} — ` +
              `${price.diffPct} % över importpriset $${price.importCostUsd!.toFixed(2)}. ` +
              `Kolla produktsidan: finns kampanj/kupong är manuell beställning ofta billigare ` +
              `(koppla den sedan med ordernumret här i kön). Vill du ändå beställa via API:t: "Lägg ändå".`,
            priceStop: {
              dsPriceUsd: price.dsPriceUsd!,
              importCostUsd: price.importCostUsd!,
              diffPct: price.diffPct!,
              productUrl: `https://www.aliexpress.com/item/${supplierProductId}.html`,
            },
          };
        }
      }
    } catch {
      // Rådgivande vakt — prishämtningsfel får inte stoppa ordern.
    }
  }

  // ── ATOMISK CLAIM (dubbel-order-skydd), sist före createOrder ──
  const token = randomUUID();
  let claimed: boolean;
  try {
    claimed = await store.claimTask(taskId, token);
  } catch {
    return { ok: false, error: "Kunde inte säkra lås på ordern — försök igen om en stund." }; // FAIL-CLOSED
  }
  if (!claimed) {
    return { ok: false, error: "Ordern hanteras redan (eller är redan lagd) — ladda om sidan och försök igen." };
  }

  // F19/race: en annullering/återbetalning kan ha COMMITTATS innan claimen (claimTask:s
  // CAS gatar på aliexpressOrderId+claimToken, inte status → en cancelled task går att
  // claima). Läs om EFTER claimen: är den nu terminal eller återbetalnings-flaggad → släpp
  // claimen och avbryt FÖRE createOrder (ingen order läggs). Från och med att VI håller
  // claimen blir cancelTaskIfFree "blocked" → en parallell cancel flaggar (skriver INTE
  // cancelled), så status kan inte klobbras härefter. Det smala fönstret där en cancel/
  // refund landar EFTER denna re-read men UNDER createOrder fångas av post-order-kollen nedan.
  const afterClaim = (await store.listTasks()).find((t) => t.taskId === taskId);
  if (!afterClaim || isTerminal(afterClaim.status) || afterClaim.refundFlagged) {
    await store.releaseTask(taskId, token);
    return { ok: false, error: "Ordern avbröts eller återbetalades precis — ingen AliExpress-order lades." };
  }

  try {
    const adress = {
      name: a.fullName ?? "",
      addressLine1: a.addressLine1 ?? "",
      addressLine2: a.addressLine2,
      city: a.city ?? "",
      province,
      postalCode: a.postalCode ?? "",
      countryCode,
      phone: a.phone,
    };

    let result = await createOrder({
      productId: supplierProductId,
      skuId: supplierVariantId,
      quantity: task.quantity,
      shippingAddress: adress,
    });

    // FRAKTSÄTT SOM INTE FINNS → försök om med ett som gör det.
    //
    // createOrder skickar CAINIAO_ECONOMY_GLOBAL som default. Den tjänsten finns
    // inte för alla säljare, lager och destinationer, och saknas den vägrar
    // AliExpress HELA ordern med DELIVERY_METHOD_NOT_EXIST (order #10021,
    // 2026-08-19). Alternativen går att fråga efter — vi gjorde det bara aldrig
    // vid orderläggning.
    //
    // SÄKERHETSVILLKORET är `orderDefinitelyNotPlaced`: det sätts bara när
    // AliExpress uttryckligen sagt nej, alltså när ingen order kan ha skapats.
    // Vid ett oklart svar försöker vi ALDRIG om — då kan en order finnas, och
    // ett omförsök vore en dubbelbeställning. Claimen hålls hela vägen, så
    // ingen annan väg kan gå in mellan försöken.
    if (
      !result.tradeOrderId &&
      result.orderDefinitelyNotPlaced &&
      isDeliveryMethodMissing(result.aeError)
    ) {
      const frakt = await queryFreightToCountry(
        supplierProductId,
        supplierVariantId,
        countryCode,
        task.quantity,
      );
      const kandidater = deliveryCandidates(
        shippingServiceNames(frakt),
        DEFAULT_DELIVERY_METHOD,
      ).filter((n) => n !== DEFAULT_DELIVERY_METHOD); // den har redan provats

      for (const tjanst of kandidater.slice(0, MAX_DELIVERY_RETRIES)) {
        console.warn(
          `[place-order] task=${taskId} fraktsätt saknades — provar "${tjanst}"`,
        );
        result = await createOrder({
          productId: supplierProductId,
          skuId: supplierVariantId,
          quantity: task.quantity,
          shippingAddress: adress,
          logisticsServiceName: tjanst,
        });
        // Lyckat, eller ett ANNAT fel än fraktsättet → sluta försöka. Bara
        // "fraktsättet finns inte" motiverar nästa kandidat.
        if (result.tradeOrderId) break;
        if (!result.orderDefinitelyNotPlaced) break;
        if (!isDeliveryMethodMissing(result.aeError)) break;
      }
    }

    // Tomt order_id. Två fall:
    //  a) AliExpress svarade UTTRYCKLIGEN misslyckat (is_success=false / felkod) →
    //     INGEN order lades → släpp claimen så Leonard kan rätta + försöka igen direkt
    //     (ingen låst task, ingen dubbel-order-risk). Orsaken visas i felmeddelandet.
    //  b) Oklart svar (inget id, ingen felsignal) → en order KAN finnas → FC-vägen:
    //     lås + flagga för manuell verifiering.
    if (!result.tradeOrderId) {
      const why = result.aeError ? ` (${result.aeError})` : "";
      if (result.orderDefinitelyNotPlaced) {
        await store.releaseTask(taskId, token);
        await safeAudit(store, taskId, "order-rejected", `AliExpress avvisade ordern${why}`);
        return { ok: false, error: `AliExpress avvisade ordern${why} — ingen order lades. Åtgärda och försök igen.` };
      }
      await markUncertain(store, taskId, `AliExpress gav inget order-id${why}`);
      return { ok: false, error: `AliExpress svarade utan order-id${why} — verifiera manuellt på AliExpress innan nytt försök.` };
    }

    // Ordern ÄR lagd. Kolla om en annullering/återbetalning racade in MEDAN createOrder
    // pågick (cancelMidOrder/refundFlagged satt, eller tasken hann bli terminal). Då får
    // status INTE klottras till "ordered" — men aliexpressOrderId MÅSTE ändå sparas
    // (dubbel-order-skydd: annars ser ett nytt försök tasken obeställd → dubbelbeställer).
    // Flagga i stället loudly för manuell AE-avbeställning.
    const postOrder = (await store.listTasks()).find((t) => t.taskId === taskId);
    const racedIn = !!postOrder && (isTerminal(postOrder.status) || postOrder.refundFlagged || postOrder.cancelMidOrder);

    // Post-order-skrivningen får ALDRIG ge ett retry-bart fel — failar den är ordern ändå
    // lagd → returnera ok:true + audita skrivfelet (annars 500 → retry → dubbel).
    try {
      await store.updateTask(
        taskId,
        racedIn
          ? { aliexpressOrderId: result.tradeOrderId, cancelMidOrder: true, cancelMidOrderAt: new Date().toISOString() }
          : {
              aliexpressOrderId: result.tradeOrderId,
              status: result.paymentRequired ? "pending_payment" : "ordered",
              ...(result.paymentRequired && result.paymentUrl ? { paymentUrl: result.paymentUrl } : {}),
            },
      );
      await store.appendAudit({
        at: new Date().toISOString(),
        kind: racedIn ? "order-placed-but-cancelled" : "aliexpress-order-placed",
        ref: taskId,
        detail: racedIn
          ? `AE-order ${result.tradeOrderId} lagd MEN annullering/återbetalning racade in — avbeställ MANUELLT på AliExpress + återbetala kund.`
          : JSON.stringify({
              tradeOrderId: result.tradeOrderId,
              paymentRequired: result.paymentRequired,
              ...(task.overriddenSupplierProductId
                ? { overriddenSupplier: { productId: supplierProductId, skuId: supplierVariantId, label: task.overriddenSupplierLabel } }
                : {}),
            }),
      });
    } catch (writeErr) {
      console.error(
        `[place-order] order lagd (${result.tradeOrderId}) men task-skrivning failade för ${taskId}:`,
        writeErr instanceof Error ? writeErr.message : writeErr,
      );
      await safeAudit(store, taskId, "order-write-failed", `lagd men ej skriven: ${result.tradeOrderId}`);
    }
    return { ok: true, tradeOrderId: result.tradeOrderId, paymentUrl: result.paymentUrl };
  } catch (err) {
    if (err instanceof OrderValidationError) {
      // SÄKERT: createOrder kastar OrderValidationError FÖRE något AE-API-anrop → ingen order skapad.
      await store.releaseTask(taskId, token);
      return { ok: false, error: err.message };
    }
    // OKÄNT UTFALL: AE-order KAN finnas → release INTE (ingen auto-reclaim). Claimen stannar
    // → tasken är låst tills den verifieras + släpps manuellt. Förhindrar tyst dubbelorder.
    await markUncertain(store, taskId, err instanceof Error ? err.message : String(err));
    return { ok: false, error: "Order-utfall osäkert — verifiera manuellt på AliExpress innan nytt försök." };
  }
}

async function markUncertain(store: Store, taskId: string, detail: string): Promise<void> {
  try {
    await store.updateTask(taskId, { orderUncertain: true, uncertainAt: new Date().toISOString() });
  } catch (e) {
    console.error(`[place-order] kunde inte flagga orderUncertain för ${taskId}:`, e instanceof Error ? e.message : e);
  }
  await safeAudit(store, taskId, "order-uncertain", detail);
}

async function safeAudit(store: Store, taskId: string, kind: string, detail: string): Promise<void> {
  try {
    await store.appendAudit({ at: new Date().toISOString(), kind, ref: taskId, detail });
  } catch (e) {
    console.error(`[place-order] audit (${kind}) failade för ${taskId}:`, e instanceof Error ? e.message : e);
  }
}
