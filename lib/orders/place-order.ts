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
  matchAeVariant,
  parseDeliveryOptions,
  rankDeliveryOptions,
} from "@/lib/aliexpress/freight";
import { normalizeCountryCode, provinceFromSwedishPostalCode } from "@/lib/orders/tasks";
import { isTerminal } from "@/lib/orders/status";
import { assessDsPrice } from "@/lib/orders/price-check";
import type { Store } from "@/lib/store";

/** Fraktsättet createOrder skickar när inget annat anges. */
const DEFAULT_DELIVERY_METHOD = "CAINIAO_ECONOMY_GLOBAL";
/**
 * Tak för hur många fraktsätt vi provar. Listan är rangordnad bäst först, så
 * de senare kandidaterna är i tur och ordning sämre affärer — och varje försök
 * är ett API-anrop i en admin-request som Leonard väntar på.
 */
const MAX_DELIVERY_ATTEMPTS = 4;

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

    // FRAKTVALET, före första försöket.
    //
    // Tidigare skickades ett hårdkodat CAINIAO_ECONOMY_GLOBAL för varje
    // produkt. Två problem med det: tjänsten finns inte hos alla säljare och
    // lager (order #10021 avvisades med DELIVERY_METHOD_NOT_EXIST), och även
    // när den finns är den sällan det bästa valet. Samma vara ligger ofta i
    // flera lager med olika pris OCH olika leveranstid — frakten äter
    // marginalen direkt, och leveranstiden är vad kunden upplever mot vårt
    // löfte om 3–7 arbetsdagar.
    //
    // Därför frågas alternativen fram och rangordnas på båda samtidigt (se
    // deliveryScore). Ett extra API-anrop per orderläggning; det är en
    // admin-åtgärd på en order i taget, så kostnaden är försumbar mot att
    // välja fel lager.
    //
    // FAIL-OPEN: går fraktfrågan inte fram läggs ordern med defaulten precis
    // som förut. En hicka i frakt-API:t får aldrig blockera en kundleverans.
    //
    // EGEN try/catch, inte den yttre: den yttre tolkar ett kast som "okänt fel
    // efter att ordern kan ha lagts" och flaggar tasken för manuell
    // verifiering. Ett kast HÄR sker före varje AE-orderanrop, så det får
    // aldrig ge det utfallet — då hade en hicka i frakt-API:t låst en task som
    // ingen order finns för.
    let alternativ: ReturnType<typeof rankDeliveryOptions> = [];
    try {
      // FRAKT-API:T KRÄVER NUMERISKT sku_id — inte det vi skickar till
      // createOrder. Extension-importens supplierVariantId ÄR AliExpress
      // sku_attr ("14:350853#39 Drawers;200007763:201336106"), och skickas den
      // strängen som sku_id svarar frakt-API:t tomt. Då blir alternativlistan
      // tom, rankningen en no-op och ordern läggs med just den hårdkodade
      // tjänst som fällde #10021 — felet hade alltså tyst återskapats för
      // precis de produkter fixen finns för (granskning 2026-08-19).
      //
      // lib/sync/shippability.ts och freight-check-rutten konverterar redan via
      // matchAeVariant; det gör vi nu också. Är id:t redan numeriskt hoppas
      // uppslaget över, så de flesta ordrar kostar inget extra anrop.
      let freightSkuId: string | null = /^\d+$/.test(supplierVariantId)
        ? supplierVariantId
        : null;
      if (!freightSkuId) {
        const ae = await getProduct(supplierProductId);
        freightSkuId = matchAeVariant(supplierVariantId, ae.variants);
      }
      if (freightSkuId) {
        alternativ = rankDeliveryOptions(
          parseDeliveryOptions(
            await queryFreightToCountry(
              supplierProductId,
              freightSkuId,
              countryCode,
              task.quantity,
            ),
          ),
        );
      } else {
        console.warn(
          `[place-order] task=${taskId} kunde inte härleda numeriskt sku_id — hoppar fraktvalet`,
        );
      }
    } catch (err) {
      console.warn(`[place-order] task=${taskId} fraktfrågan misslyckades`, err);
    }
    // Kapa de RANKADE kandidaterna och lägg sedan på defaulten. Görs det
    // tvärtom hyvlas defaulten bort så fort listan är längre än taket — och då
    // kan en order som förut hade gått igenom med defaulten i stället
    // misslyckas helt (granskning 2026-08-19).
    const kandidater = deliveryCandidates(
      alternativ.slice(0, MAX_DELIVERY_ATTEMPTS - 1),
      DEFAULT_DELIVERY_METHOD,
    );
    if (alternativ.length > 0) {
      const b = alternativ[0];
      console.warn(
        `[place-order] task=${taskId} fraktval: "${b.serviceName}"` +
          ` (${b.costSek ?? "?"} kr, ${b.maxDays ?? "?"} dgr)` +
          ` av ${alternativ.length} alternativ`,
      );
    }

    // EN loop, en payload. Två separata createOrder-anrop (ett för första
    // kandidaten, ett i omförsöket) hade betytt att en framtida ändring av
    // orderns innehåll kan hamna på bara det ena — en bugg som bara syns på
    // omförsöksvägen (granskning 2026-08-19).
    //
    // SÄKERHETSVILLKOREN för att gå vidare till nästa kandidat:
    //   - inget order-id (annars är vi klara),
    //   - orderDefinitelyNotPlaced, som bara sätts när AliExpress UTTRYCKLIGEN
    //     sagt nej — vid ett oklart svar kan en order finnas och ett omförsök
    //     vore en dubbelbeställning,
    //   - och att felet är just "fraktsättet finns inte".
    // Claimen hålls hela vägen, så ingen annan väg kan gå in mellan försöken.
    let result = await createOrder({
      productId: supplierProductId,
      skuId: supplierVariantId,
      quantity: task.quantity,
      shippingAddress: adress,
      logisticsServiceName: kandidater[0],
    });
    for (const tjanst of kandidater.slice(1)) {
      if (result.tradeOrderId) break;
      if (!result.orderDefinitelyNotPlaced) break;
      if (!isDeliveryMethodMissing(result.aeError, result.aeErrorCode)) break;
      console.warn(`[place-order] task=${taskId} fraktsättet saknades — provar "${tjanst}"`);
      result = await createOrder({
        productId: supplierProductId,
        skuId: supplierVariantId,
        quantity: task.quantity,
        shippingAddress: adress,
        logisticsServiceName: tjanst,
      });
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
        // FRAKTDIAGNOS. "DELIVERY_METHOD_NOT_EXIST — försök igen" är en
        // återvändsgränd: den säger inte OM det finns något fraktsätt att
        // försöka med. Nu skiljs de två lägena åt, för åtgärden är helt olika.
        if (isDeliveryMethodMissing(result.aeError, result.aeErrorCode)) {
          if (alternativ.length === 0) {
            return {
              ok: false,
              error:
                `AliExpress har inget fraktsätt till ${countryCode} för den här varianten` +
                ` — ingen order lades. Det hjälper inte att försöka igen: varan går inte att` +
                ` skicka hit från det lagret. Byt leverantör/variant, eller markera` +
                ` ordern som hanterad manuellt.`,
            };
          }
          return {
            ok: false,
            error:
              `AliExpress avvisade alla fraktsätt vi kunde erbjuda` +
              ` (${kandidater.join(", ")}) — ingen order lades.` +
              ` Kontrollera varianten på produktsidan eller beställ manuellt.`,
          };
        }
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
