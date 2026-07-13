// AliExpress Open Platform — Drop Shipping API-klient
//
// Autentisering: OAuth2-flow där butikens ägare (du) autentiserar en gång;
// access_token sparas och refreshas automatiskt.
//
// Signatur (HMAC-SHA256):
//   1. Samla ALLA parametrar (inkl. app_key, method, timestamp etc.).
//   2. Sortera på nyckelnamn (lexikografiskt).
//   3. Konkatenera nyckelvärdepar (ingen separator).
//   4. HMAC-SHA256(app_secret, konkatenering) → uppercase hex.
//
// För /rest-endpoints (token-create, token-refresh): basestring börjar med
// method-path (t.ex. "/auth/token/create") och method tas bort ur params.
//
// Miljövariabler som krävs:
//   ALIEXPRESS_APP_KEY       — App Key från Open Platform
//   ALIEXPRESS_APP_SECRET    — App Secret från Open Platform
//   ALIEXPRESS_ACCESS_TOKEN  — (sätts automatiskt via OAuth-callback)
//   ALIEXPRESS_REFRESH_TOKEN — (sätts automatiskt via OAuth-callback)

import { createHmac } from "node:crypto";
import { getStore } from "../store/factory";
import {
    classifyWarehouses,
    hasAnyEuWarehouse,
    normalizeShipFromCode,
    uniqueShipFromCodes,
} from "./eu-countries";
import type {
    AliExpressDsProduct,
    AliExpressDsVariant,
    DsOrderCreateParams,
    DsOrderCreateResult,
    DsTokenResponse,
    DsTrackingResult,
} from "./types";

const API_BASE = "https://api-sg.aliexpress.com/sync";
const REST_BASE = "https://api-sg.aliexpress.com/rest";
const AUTH_BASE = "https://api-sg.aliexpress.com/oauth";

function sign(params: Record<string, string>, appSecret: string): string {
    const sorted = Object.keys(params)
      .sort()
      .map((k) => `${k}${params[k]}`)
      .join("");
    return createHmac("sha256", appSecret).update(sorted).digest("hex").toUpperCase();
}

/**
 * GOP-protokollets signering (IOP-SDK-konvention): signature base är
 * `apiPath + sorted_concat_params`. Används för /rest/auth/token/* endpoints.
 * Skiljer sig från `sign()` (utan path) som används för /sync business-API.
 */
function signWithPath(apiPath: string, params: Record<string, string>, appSecret: string): string {
    const sortedConcat = Object.keys(params)
      .sort()
      .map((k) => `${k}${params[k]}`)
      .join("");
    const baseString = apiPath + sortedConcat;
    return createHmac("sha256", appSecret).update(baseString).digest("hex").toUpperCase();
}

function buildParams(
    method: string,
    bizParams: Record<string, string>,
    appKey: string,
    appSecret: string,
    accessToken: string,
  ): URLSearchParams {
    const timestamp = String(Date.now());
    const base: Record<string, string> = {
          method,
          app_key: appKey,
          timestamp,
          sign_method: "sha256",
          session: accessToken,
          ...bizParams,
    };
    base.sign = sign(base, appSecret);
    return new URLSearchParams(base);
}

/**
 * Hämtar gällande access_token: persisterad i store först (källa-av-sanning
 * efter Task C-deploy), fallback till env-var för cold bootstrap eller om
 * STORE_BACKEND=memory. Kastar tydligt fel om båda saknas.
 *
 * Exporterad för enhetstester. Produktionskod använder via callApi().
 */
export async function resolveAccessToken(): Promise<string> {
    const stored = await getStore().getAliExpressTokens();
    if (stored?.accessToken) return stored.accessToken;
    const envToken = process.env.ALIEXPRESS_ACCESS_TOKEN;
    if (envToken) return envToken;
    throw new Error(
            "AliExpress access_token saknas (varken i store eller ALIEXPRESS_ACCESS_TOKEN env-var).",
          );
}

async function callApi<T>(
    method: string,
    bizParams: Record<string, string>,
  ): Promise<T> {
    const appKey = process.env.ALIEXPRESS_APP_KEY;
    const appSecret = process.env.ALIEXPRESS_APP_SECRET;

  if (!appKey || !appSecret) {
        throw new Error(
                "ALIEXPRESS_APP_KEY och ALIEXPRESS_APP_SECRET måste vara satta.",
              );
  }

  const accessToken = await resolveAccessToken();
  const params = buildParams(method, bizParams, appKey, appSecret, accessToken);

  const res = await fetch(`${API_BASE}?${params.toString()}`, { method: "POST" });
    if (!res.ok) throw new Error(`AliExpress API HTTP-fel: ${res.status}`);

  const json = (await res.json()) as Record<string, unknown>;
    // Top-level fel ({error_response: {...}}) hanteras separat — annars
    // riskerar vi att returnera ett tomt data-objekt och få oklar nedströms-error.
    if ("error_response" in json) {
          throw new Error(`AliExpress API-fel: ${JSON.stringify(json.error_response)}`);
    }
    const responseKey = method.replaceAll(".", "_") + "_response";
    const data = (json[responseKey] ?? json) as Record<string, unknown>;
    // Både `code` (legacy /sync) och `rsp_code` (DS API) kan signalera fel.
    // OBS: vissa AliExpress-endpoints (text.search, recommend.feed) returnerar
    // "00" som success-kod — så vi tillåter både 0/"0"/"00"/200/"200".
    const codeRaw = data.code ?? data.rsp_code;
    const isSuccessCode =
      codeRaw === undefined
      || codeRaw === null
      || codeRaw === 0
      || codeRaw === "0"
      || codeRaw === "00"
      || codeRaw === 200
      || codeRaw === "200";
    if (!isSuccessCode) {
      const msg = data.msg ?? data.rsp_msg ?? data.sub_msg ?? data.message ?? "okänt fel";
      throw new Error(`AliExpress API-fel ${codeRaw}: ${msg}`);
    }
    return data as T;
}

export function buildAuthUrl(redirectUri: string, state?: string): string {
    const appKey = process.env.ALIEXPRESS_APP_KEY;
    if (!appKey) throw new Error("ALIEXPRESS_APP_KEY saknas");
    // force_auth=true tvingar fram fullständig OAuth-login varje gång (per
    // officiell docs). Utan denna kan AliExpress strunta i att leverera en
    // ny code vid re-auth.
    const p = new URLSearchParams({
          response_type: "code",
          force_auth: "true",
          client_id: appKey,
          redirect_uri: redirectUri,
          ...(state ? { state } : {}),
    });
    return `${AUTH_BASE}/authorize?${p.toString()}`;
}

/**
 * AliExpress signed-RPC svar kan vara antingen flat ({access_token, ...})
 * eller wrapped i en namespace-key ({aliexpress_auth_token_create_response: {...}})
 * beroende på app-konfiguration och simplify-flaggan. Den här helpern
 * detekterar wrapper-keyn, plockar ut innehållet, OCH kastar ett tydligt
 * fel om svaret innehåller ett AliExpress error-code-fält.
 */
function unwrapAliExpressResponse(raw: unknown, opName: string): Record<string, unknown> {
    if (raw == null || typeof raw !== "object") {
        throw new Error(`${opName}: ogiltigt svar från AliExpress: ${JSON.stringify(raw)}`);
    }
    const obj = raw as Record<string, unknown>;

    // Detektera wrapper-key (slutar på "_response") och packa upp.
    const wrapperKey = Object.keys(obj).find((k) => k.endsWith("_response"));
    const data = (wrapperKey ? obj[wrapperKey] : obj) as Record<string, unknown>;

    // Kontrollera AliExpress error-shape (code som inte är 0/200 eller error_code/error)
    const codeRaw = data.code ?? data.error_code ?? data.error;
    if (codeRaw !== undefined && codeRaw !== null && codeRaw !== 0 && codeRaw !== "0" && codeRaw !== 200 && codeRaw !== "200") {
        const message = data.message ?? data.error_description ?? data.msg ?? "okänt AliExpress-fel";
        throw new Error(`${opName}: AliExpress fel ${codeRaw}: ${message}`);
    }
    return data;
}

export async function exchangeCode(code: string, redirectUri: string): Promise<DsTokenResponse> {
    const appKey = process.env.ALIEXPRESS_APP_KEY;
    const appSecret = process.env.ALIEXPRESS_APP_SECRET;
    if (!appKey || !appSecret) throw new Error("App-nycklar saknas");

  // AliExpress /rest/auth/token/create — verifierat working pattern
  // (källa: bivex/aliexpress-product-search GitHub-repo):
  //   - HTTP method: GET (inte POST — POST var roten till alla IncompleteSignature-fel)
  //   - Params: app_key, code, redirect_uri, sign_method, timestamp (INTE partner_id)
  //   - Signature base: "/auth/token/create" + sorted_concat(params)
  const apiPath = "/auth/token/create";
  const params: Record<string, string> = {
        app_key: appKey,
        code,
        redirect_uri: redirectUri,
        sign_method: "sha256",
        timestamp: String(Date.now()),
  };
    const signature = signWithPath(apiPath, params, appSecret);
    const query = new URLSearchParams({ ...params, sign: signature }).toString();

  const res = await fetch(`${REST_BASE}${apiPath}?${query}`, { method: "GET" });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Token-utbyte misslyckades (${res.status}): ${text.slice(0, 300)}`);
    }
    return unwrapAliExpressResponse(await res.json(), "exchangeCode") as unknown as DsTokenResponse;
}

export async function refreshAccessToken(refreshToken: string): Promise<DsTokenResponse> {
    const appKey = process.env.ALIEXPRESS_APP_KEY;
    const appSecret = process.env.ALIEXPRESS_APP_SECRET;
    if (!appKey || !appSecret) throw new Error("App-nycklar saknas");

  const apiPath = "/auth/token/refresh";
  const params: Record<string, string> = {
        app_key: appKey,
        refresh_token: refreshToken,
        sign_method: "sha256",
        timestamp: String(Date.now()),
  };
    const signature = signWithPath(apiPath, params, appSecret);
    const query = new URLSearchParams({ ...params, sign: signature }).toString();

  const res = await fetch(`${REST_BASE}${apiPath}?${query}`, { method: "GET" });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Token-refresh misslyckades (${res.status}): ${text.slice(0, 300)}`);
    }
    return unwrapAliExpressResponse(await res.json(), "refreshAccessToken") as unknown as DsTokenResponse;
}

/**
 * Refreshar access_token via AliExpress signed-RPC och persisterar resultatet
 * i store. Validerar svar-shape så vi inte sparar Invalid Date eller tomma
 * fält. Behåller gammal refresh_token om svaret inte innehåller en ny
 * (vissa AliExpress-flöden roterar inte refresh_token vid varje anrop).
 *
 * Returnerar de färska tokensen så caller kan använda dem direkt utan att
 * läsa från store igen (snabbare + ingen eventual-consistency-risk).
 */
export async function refreshAndPersist(): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
}> {
    const store = getStore();
    const current = await store.getAliExpressTokens();
    if (!current) {
        throw new Error("Inga AliExpress-tokens i store. Initial OAuth via /api/aliexpress/auth krävs.");
    }

    const fresh = await refreshAccessToken(current.refreshToken);

    if (
        typeof fresh.access_token !== "string"
        || !fresh.access_token
        || typeof fresh.expires_in !== "number"
        || !Number.isFinite(fresh.expires_in)
        || fresh.expires_in <= 0
    ) {
        throw new Error(
            "AliExpress refresh returnerade ofullständigt svar (saknar access_token eller giltig expires_in).",
        );
    }

    const expiresAt = new Date(Date.now() + fresh.expires_in * 1000);
    const refreshToken = fresh.refresh_token || current.refreshToken;

    await store.saveAliExpressTokens({
        accessToken: fresh.access_token,
        refreshToken,
        expiresAt,
    });

    return { accessToken: fresh.access_token, refreshToken, expiresAt };
}

// AliExpress DS product.get-svar: payload sitter alltid under `result` (per
// officiell spec). Basinfo (id/titel/detail) ligger nästat under
// ae_item_base_info_dto. SKU-listan och prop-listan kan vara antingen
// direkt array (när AliExpress-appen är satt till simplify=true) ELLER
// inslagen i en wrapper-key ({ ae_item_sku_info_d_t_o: [...] } resp.
// { ae_sku_property_d_t_o: [...] }) i den icke-förenklade formen. Vi
// avwrappar defensivt så koden funkar oavsett app-konfiguration.
interface RawSkuProp {
  sku_property_name?: string;
  property_value_definition_name?: string;
  property_value_name?: string;
  sku_image?: string;
}
interface RawSku {
  id?: string;
  sku_stock?: boolean;
  sku_available_stock?: number;
  s_k_u_available_stock?: number;
  offer_sale_price?: string;
  sku_price?: string;
  ae_sku_property_dtos?:
    | { ae_sku_property_d_t_o?: RawSkuProp[] }
    | RawSkuProp[];
  aeop_s_k_u_propertys?: RawSkuProp[];
  // AliExpress använder flera olika fältnamn för shipFrom per SKU
  // beroende på app-version och simplify-flagga.
  ship_from?: string;
  ship_from_code?: string;
  shipFromCode?: string;
  warehouse_code?: string;
}
interface RawProduct {
  result?: {
    ae_item_base_info_dto?: {
      product_id?: number | string;
      subject?: string;
      detail?: string;
      mobile_detail?: string;
    };
    ae_multimedia_info_dto?: { ae_video_dtos?: unknown; image_urls?: string };
    ae_item_sku_info_dtos?:
      | { ae_item_sku_info_d_t_o?: RawSku[] }
      | RawSku[];
    // Produkt-nivå shipFrom (default när varianten inte överstyr).
    logistics_info_dto?: { ship_from?: string; ship_from_code?: string };
    package_info_dto?: { ship_from?: string };
    ship_from?: string;
  };
}

function unwrapArray<T>(value: unknown, wrapperKey: string): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object") {
    const inner = (value as Record<string, unknown>)[wrapperKey];
    if (Array.isArray(inner)) return inner as T[];
  }
  return [];
}

export async function getProduct(productId: string): Promise<AliExpressDsProduct> {
    const raw = await callApi<RawProduct>("aliexpress.ds.product.get", {
          product_id: productId,
          target_currency: "USD",
          target_language: "EN",
          ship_to_country: "SE",
    });

  const r = raw.result;
  if (!r) {
    throw new Error(
      `AliExpress DS-svaret saknar result-fält för produkt ${productId}. `
      + `Räkna med {aliexpress_ds_product_get_response:{result:{...}}}; fick: ${JSON.stringify(raw).slice(0, 400)}`,
    );
  }

  const base = r.ae_item_base_info_dto ?? {};
  const images = (r.ae_multimedia_info_dto?.image_urls ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const skuDtos = unwrapArray<RawSku>(r.ae_item_sku_info_dtos, "ae_item_sku_info_d_t_o");

  // Produkt-default shipFrom — används om varianten inte har egen.
  const productDefaultShipFrom = normalizeShipFromCode(
    r.logistics_info_dto?.ship_from_code
      ?? r.logistics_info_dto?.ship_from
      ?? r.package_info_dto?.ship_from
      ?? r.ship_from
      ?? "",
  );

  const variants: AliExpressDsVariant[] = skuDtos.map((sku) => {
        const props: Record<string, string> = {};
        let imageUrl: string | undefined;
        const propList = sku.aeop_s_k_u_propertys
          ?? unwrapArray<RawSkuProp>(sku.ae_sku_property_dtos, "ae_sku_property_d_t_o");
        for (const prop of propList) {
                const name = prop.sku_property_name ?? "Option";
                const value = prop.property_value_definition_name ?? prop.property_value_name ?? "";
                props[name] = value;
                if (prop.sku_image) imageUrl = prop.sku_image;
        }
        const price = parseFloat(sku.offer_sale_price ?? sku.sku_price ?? "0");
        const stock = sku.sku_available_stock
          ?? sku.s_k_u_available_stock
          // sku_stock är en BOOLEAN ("finns i lager") utan antal. Tidigare gav vi
          // 999 → grov oversälj-risk. Använd ett konservativt litet fallback-saldo;
          // riktigt numeriskt saldo skriver över det vid nästa sync.
          ?? (sku.sku_stock ? 5 : 0);
        const variantShipFromRaw = sku.ship_from_code
          ?? sku.shipFromCode
          ?? sku.ship_from
          ?? sku.warehouse_code
          ?? "";
        const variantShipFrom = normalizeShipFromCode(variantShipFromRaw)
          || productDefaultShipFrom;
        return {
                skuId: String(sku.id ?? ""),
                skuProps: props,
                imageUrl,
                price,
                stock,
                shipFrom: variantShipFrom || undefined,
        };
  });

  // Aggregera unika shipFrom-koder över varianter + produkt-default.
  const allCodes: string[] = [];
  for (const v of variants) {
    if (v.shipFrom) allCodes.push(v.shipFrom);
  }
  if (productDefaultShipFrom) allCodes.push(productDefaultShipFrom);
  const shipsFromCountries = uniqueShipFromCodes(allCodes);

  return {
        productId: String(base.product_id ?? productId),
        title: base.subject ?? "",
        description: base.detail ?? base.mobile_detail ?? "",
        images,
        variants,
        shipFrom: productDefaultShipFrom || undefined,
        shipsFromCountries,
        hasEuWarehouse: hasAnyEuWarehouse(shipsFromCountries),
  };
}

interface RawOrderCreate {
    result?: {
          order_id?: string | number;
          // Batch-svarsvarianten lägger order-id:t i order_list.number[] (eller en
          // ren array). Vi läser båda formerna i createOrder.
          order_list?: { number?: Array<string | number> } | Array<string | number>;
          // DS-svaret bär affärsstatusen INNE i result (inte som top-level `code`),
          // så callApi:s generiska code-koll ser den inte → vi läser den här.
          is_success?: boolean;
          error_code?: string | number;
          error_msg?: string;
          payment_required?: boolean;
          pay_url?: string;
    };
    is_success?: boolean;
}

// Länder som AliExpress kräver delstat/region för vid leverans. Vår adressmodell
// saknar `province` → vägra dessa hårt (flödet är SE/EU). Utöka modellen innan de stöds.
const PROVINCE_REQUIRED_COUNTRIES = new Set([
  "US", "CA", "AU", "BR", "CN", "IN", "MX", "ID", "RU", "AR", "JP", "MY", "TH",
]);

/**
 * Valideringsfel vid orderläggning (landskod/adress/kvantitet). Egen typ så att
 * HTTP-anropare kan mappa till 4xx (klientfel, ingen retry) i stället för 500
 * (som order-kö:n annars retry:ar i evighet på ett permanent fel).
 */
export class OrderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderValidationError";
  }
}

export async function createOrder(params: DsOrderCreateParams): Promise<DsOrderCreateResult> {
    const addr = params.shippingAddress;
    // Vägra hellre ordern än att skicka till fel land: ISO alpha-2 krävs. Tidigare
    // defaultade anroparen till "SE" när landet saknades → tyst fel destination.
    const country = (addr.countryCode ?? "").trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(country)) {
      throw new OrderValidationError(
        `Ogiltig landskod "${addr.countryCode ?? ""}" — order avbruten (kräver ISO alpha-2, t.ex. SE/DE).`,
      );
    }
    // Adressmodellen saknar `province`/delstat. Länder som AliExpress kräver delstat
    // för (US/CA/AU/BR…) skulle annars få en order UTAN delstat → leveransfel. Vägra
    // dem hårt (inte bara en kommentar) tills modellen har province. Flödet är SE/EU.
    if (PROVINCE_REQUIRED_COUNTRIES.has(country)) {
      throw new OrderValidationError(
        `Land ${country} kräver delstat/region som vår adressmodell ännu inte stöder — order avbruten (hantera manuellt).`,
      );
    }
    // Leverans-kritiska adressfält måste finnas (annars betald oleverabar order).
    // OBS: guarden täcker EU/SE-flödet; för länder som kräver delstat (US/CA/BR)
    // saknar modellen `province` → utöka adressmodellen innan icke-EU stöds.
    // `contact_person` är kontaktuppgift, inte leverans-kritiskt → defaultas så att
    // en gäst-order utan namn inte blockeras (leverans styrs av adressen).
    const line1 = (addr.addressLine1 ?? "").trim();
    const city = (addr.city ?? "").trim();
    const zip = (addr.postalCode ?? "").trim();
    const addrMissing = ([
      ["addressLine1", line1],
      ["city", city],
      ["postalCode", zip],
    ] as const).filter(([, v]) => !v).map(([k]) => k);
    if (addrMissing.length) {
      throw new OrderValidationError(
        `Ofullständig leveransadress (saknar: ${addrMissing.join(", ")}) — order avbruten.`,
      );
    }
    // Vägra ogiltig kvantitet hellre än att tyst beställa 0 eller 1.
    if (!Number.isInteger(params.quantity) || params.quantity < 1) {
      throw new OrderValidationError(`Ogiltig kvantitet (${params.quantity}) — order avbruten.`);
    }
    const line2 = (addr.addressLine2 ?? "").trim();
    const province = (addr.province ?? "").trim();
    const contactPerson = (addr.name ?? "").trim() || "Mottagare";
    const phone = (addr.phone ?? "").trim();

    // aliexpress.ds.order.create tar ALLA orderfält i ETT enda JSON-inkapslat
    // affärsparameter med `logistics_address` + `product_items`. VIKTIGT om namnet:
    // AliExpress snake_case:ar Java-fältet `paramPlaceOrderRequest4OpenApiDTO` genom
    // att sätta "_" före VARJE versal → wire-namnet blir
    // `param_place_order_request4_open_api_d_t_o` (D, T, O var för sig), INTE
    // `...api_dto` som docs skriver för läsbarhet. Skickade vi `...api_dto` svarade
    // AliExpress "MissingParameter: param_place_order_request4_open_api_d_t_o" och
    // ingen order lades. Byggs som ren funktion (buildPlaceOrderDto) så DTO-formen
    // kan låsas i test.
    const dto = buildPlaceOrderDto({
      productId: params.productId,
      quantity: params.quantity,
      skuId: params.skuId,
      logisticsServiceName: params.logisticsServiceName ?? "CAINIAO_ECONOMY_GLOBAL",
      address: line1 + (line2 ? ` ${line2}` : ""),
      city,
      province,
      country,
      zip,
      contactPerson,
      phone,
      buyerMessage: params.buyerMessage,
    });
    const bizParams: Record<string, string> = {
      param_place_order_request4_open_api_d_t_o: JSON.stringify(dto),
    };

  const raw = await callApi<RawOrderCreate>("aliexpress.ds.order.create", bizParams);
    const result = raw.result ?? {};

    // AFFÄRSSTATUS-GRIND: DS-svaret bär `is_success` INNE i result, så callApi:s
    // generiska top-level-code-koll fångar den inte. Litar vi enbart på ett order-id
    // riskerar vi en falsk "lagd" om AliExpress skulle eka ett id på ett misslyckat
    // svar → tasken markeras `ordered`, re-order hoppas, kunden får aldrig varan.
    // Är is_success uttryckligen false → behandla som INGET id → FC-vägen
    // (markUncertain) flaggar för manuell verifiering i stället.
    const isSuccess = result.is_success ?? raw.is_success;
    // Order-id kan komma som `order_id` (singel) eller `order_list.number[]`
    // (batch-shape) beroende på AliExpress-svarsvariant. Läs båda.
    const ol = result.order_list;
    const orderIdRaw =
      isSuccess === false
        ? undefined
        : (result.order_id ?? (Array.isArray(ol) ? ol[0] : ol?.number?.[0]));

    // Gav AliExpress inget order-id? Fånga ORSAKEN (error_msg/error_code) så den
    // syns i admin + audit i stället för det intetsägande "inget order-id". Och
    // avgör om vi VET att ingen order lades (is_success=false eller en felkod) →
    // då kan claimen släppas för en säker retry i stället för att låsa tasken.
    let aeError: string | undefined;
    let orderDefinitelyNotPlaced = false;
    if (orderIdRaw == null) {
      const emsg = result.error_msg ? String(result.error_msg).trim() : "";
      const ecode = result.error_code != null ? String(result.error_code) : "";
      aeError = emsg || (ecode ? `felkod ${ecode}` : `oväntat svar (is_success=${String(isSuccess)})`);
      orderDefinitelyNotPlaced = isSuccess === false || (ecode !== "" && ecode !== "0");
      console.error(
        `[aliexpress] createOrder: inget order_id. is_success=${String(isSuccess)} error_code=${ecode} error_msg=${emsg} result=${JSON.stringify(result).slice(0, 700)}`,
      );
    }

  return {
        tradeOrderId: orderIdRaw != null ? String(orderIdRaw) : "",
        ...(aeError ? { aeError } : {}),
        ...(orderDefinitelyNotPlaced ? { orderDefinitelyNotPlaced: true } : {}),
        paymentRequired: result.payment_required ?? true,
        paymentUrl: result.pay_url,
  };
}

/**
 * Bygger DTO:t för aliexpress.ds.order.create. Ren funktion → enhetstestbar
 * (låser fältnamnen som AliExpress kräver: sku_attr = leverantörens SKU-attr-
 * sträng, product_id/product_count per rad, logistics_address för leverans).
 * `mobile_no` + `phone_country` (dial-kod, ex "+46") skickas som PAR när telefon
 * finns; saknas dial-kod för landet utelämnas telefonen helt.
 */
/**
 * Translittererar till ren ASCII (Latin). AliExpress order-create avvisar
 * icke-engelska tecken ("Please use English only") → svenska adresser med å/ä/ö
 * (Norrgårdsvägen, Åkersberga, Sjöström) fälls annars. Paketet levereras ändå:
 * postnumret routar det och ASCII-translitterering är standard för internationell
 * frakt till Sverige. OBS: används ENBART för AliExpress-anropet — vår egen
 * lagrade adress/mejl behåller den korrekta svenska stavningen.
 */
export function toAsciiLatin(input: string): string {
  if (!input) return input;
  const map: Record<string, string> = {
    å: "a", ä: "a", ö: "o", Å: "A", Ä: "A", Ö: "O",
    ø: "o", Ø: "O", æ: "ae", Æ: "AE", ß: "ss", đ: "d", Đ: "D", ł: "l", Ł: "L",
  };
  // 1) Explicita mappningar för ligaturer/egna bokstäver som NFD INTE delar upp
  //    (æ, ø, ß, đ, ł). 2) NFD delar upp diakriter (é→e+́, ü→u+̈, ñ, ç, å, ä, ö …)
  //    och en enda ASCII-grind slänger allt icke-utskrivbart-ASCII (kombinations-
  //    tecknen + ev. kvarvarande icke-latinska tecken). Kvar: ren ASCII.
  let s = input.replace(/[åäöÅÄÖøØæÆßđĐłŁ]/g, (c) => map[c] ?? c);
  s = s.normalize("NFD").replace(/[^\x20-\x7E]/g, "");
  return s.replace(/\s+/g, " ").trim();
}

/**
 * AliExpress postnummer-fält accepterar BARA siffror, "-" och "/". Svenska
 * postnummer skrivs "184 36" (med mellanslag) → AliExpress avvisar ("use only
 * digits and/or dash and/or slash"). Ta bort allt annat → "18436". Endast för
 * AliExpress-anropet; vår lagrade adress behåller "184 36".
 */
export function sanitizeZip(zip: string): string {
  return (zip ?? "").replace(/[^0-9/-]/g, "");
}

/**
 * Telefonens landskod (dial code) per ISO alpha-2-land. AliExpress order-create
 * KRÄVER `phone_country` när `mobile_no` skickas — annars svaras "Please enter a
 * country code" och ingen order läggs. Formatet är dial-koden MED plus ("+46"),
 * verifierat mot AliExpress DS-API-exempel (phone_country:"+1"). Täcker hela
 * EU/EES + Norden + UK + US/CA så vilken kund som helst fungerar; ett omappat
 * land ger `undefined` → telefonen utelämnas helt (icke-kritisk för leverans)
 * i stället för att fälla ordern på den här grinden.
 */
const PHONE_DIAL_CODES: Record<string, string> = {
  SE: "+46", NO: "+47", DK: "+45", FI: "+358", IS: "+354",
  DE: "+49", FR: "+33", NL: "+31", BE: "+32", LU: "+352",
  ES: "+34", IT: "+39", PT: "+351", GR: "+30",
  PL: "+48", CZ: "+420", SK: "+421", HU: "+36", RO: "+40",
  BG: "+359", HR: "+385", SI: "+386", AT: "+43", CH: "+41",
  IE: "+353", GB: "+44", EE: "+372", LV: "+371", LT: "+370",
  MT: "+356", CY: "+357", US: "+1", CA: "+1",
};

export function phoneDialCode(country: string): string | undefined {
  return PHONE_DIAL_CODES[(country ?? "").trim().toUpperCase()];
}

/**
 * Nationellt telefonnummer utan landskod: siffror + ev. nationell trunk-nolla
 * bort (svensk "0704806968" → "704806968"), eftersom landskoden skickas separat
 * i `phone_country`. AliExpress vill ha numret utan landskod (ex: "123-456-7890").
 */
export function normalizeMobile(phone: string): string {
  return (phone ?? "").replace(/\D/g, "").replace(/^0/, "");
}

export function buildPlaceOrderDto(p: {
  productId: string;
  quantity: number;
  skuId: string;
  logisticsServiceName: string;
  address: string;
  city: string;
  province: string;
  country: string;
  zip: string;
  contactPerson: string;
  phone: string;
  buyerMessage?: string;
}): {
  logistics_address: Record<string, string>;
  product_items: Array<Record<string, string | number>>;
} {
  const memo = p.buyerMessage ? toAsciiLatin(p.buyerMessage) : "";
  // Telefon skickas BARA tillsammans med sin landskod (phone_country) — AliExpress
  // kräver "country code" när mobile_no finns. Saknas dial-kod för landet (omappat)
  // utelämnas telefonen helt (icke-kritisk för leverans) hellre än att fälla ordern.
  const dial = phoneDialCode(p.country);
  const mobileNo = p.phone ? normalizeMobile(p.phone) : "";
  const includePhone = Boolean(mobileNo && dial);
  return {
    logistics_address: {
      // AliExpress kräver engelska/ASCII → translitterera fritextfälten.
      address: toAsciiLatin(p.address),
      city: toAsciiLatin(p.city),
      // AliExpress kräver "state/province/region" (län) — annars avvisas ordern.
      province: toAsciiLatin(p.province),
      // Postnummer: bara siffror/-/ (svenska "184 36" → "18436").
      zip: sanitizeZip(p.zip),
      country: p.country,
      contact_person: toAsciiLatin(p.contactPerson),
      full_name: toAsciiLatin(p.contactPerson),
      // mobile_no + phone_country skickas som par (dial-kod "+46"), aldrig ensamt.
      ...(includePhone ? { mobile_no: mobileNo, phone_country: dial } : {}),
    },
    product_items: [
      {
        product_id: p.productId,
        product_count: p.quantity,
        sku_attr: p.skuId,
        logistics_service_name: p.logisticsServiceName,
        ...(memo ? { order_memo: memo } : {}),
      },
    ],
  };
}

interface RawTracking {
    result?: {
          // GAMLA formen (före API-revisionen ~12 juli 2026).
          logistics_order_list?: Array<{
                  tracking_number?: string;
                  logistics_company?: string;
                  details?: {
                    tracking_detail?: Array<{
                      event_desc?: string;
                      event_date?: string;
                      signed_name?: string;
                    }>;
                  };
          }>;
          order_status?: string;
          // NYA formen (verifierad mot rå-svar 13 juli 2026): spårningsnumret
          // heter mail_no, transportören carrier_name, händelserna ligger i
          // detail_node_list med epoch-ms-timestamps, och eta_time_stamps ger
          // beräknad leverans.
          data?: {
                tracking_detail_line_list?: {
                      tracking_detail?: Array<{
                            mail_no?: string;
                            carrier_name?: string;
                            eta_time_stamps?: number;
                            detail_node_list?: {
                                  detail_node?: Array<{
                                        time_stamp?: number;
                                        tracking_name?: string;
                                        tracking_detail_desc?: string;
                                  }>;
                            };
                      }>;
                };
          };
    };
}

export async function getTracking(tradeOrderId: string): Promise<DsTrackingResult> {
    // AliExpress reviderade tracking-API:t (~12 juli 2026): `language` blev
    // obligatorisk OCH order-parametern bytte namn till `ae_order_id`. Utan
    // dem svarar API:t MissingParameter och VARJE tracking-poll failade tyst
    // → inga fulfillments → inga leveransmejl (order #10012 låg utan spårning
    // i 5 dagar trots att paketet var skickat). Gamla `order_id` skickas med
    // som bakåtkompatibilitet ifall API:t rullas tillbaka.
    const raw = await callApi<RawTracking>("aliexpress.ds.order.tracking.get", {
          ae_order_id: tradeOrderId,
          order_id: tradeOrderId,
          language: "en_US",
    });

  const parsed = parseTrackingResponse(tradeOrderId, raw);

    // Diagnostik: om INGEN av formerna gav ett spårningsnummer, logga rå-svaret
    // (trunkerat) så Vercel-loggen visar den faktiska strukturen i stället för
    // att felet göms bakom ett evigt "stillWaiting".
    if (!parsed.trackingNumber) {
          console.warn(
                `[aliexpress] tracking.get ${tradeOrderId}: inget tracking_number i svaret — rå form: ${JSON.stringify(raw).slice(0, 1500)}`,
          );
    }
    return parsed;
}

/**
 * Ren parser för aliexpress.ds.order.tracking.get — NYA svarsformen först
 * (API-revisionen ~12 juli 2026: mail_no/carrier_name/detail_node_list med
 * epoch-ms-timestamps, verifierad mot rå-svar från prod), gamla
 * logistics_order_list-formen som fallback. Exporterad för test.
 */
export function parseTrackingResponse(tradeOrderId: string, raw: RawTracking): DsTrackingResult {
    const line = raw.result?.data?.tracking_detail_line_list?.tracking_detail?.[0];
    if (line?.mail_no) {
          return {
                tradeOrderId,
                trackingNumber: line.mail_no,
                shippingProvider: line.carrier_name,
                status: "SHIPPED",
                etaTimestamp: line.eta_time_stamps,
                events: (line.detail_node_list?.detail_node ?? []).map((e) => ({
                      time: e.time_stamp ? new Date(e.time_stamp).toISOString() : "",
                      description: e.tracking_detail_desc ?? e.tracking_name ?? "",
                      location: undefined,
                })),
          };
    }

    const first = (raw.result?.logistics_order_list ?? [])[0];
    return {
          tradeOrderId,
          trackingNumber: first?.tracking_number,
          shippingProvider: first?.logistics_company,
          status: raw.result?.order_status ?? "UNKNOWN",
          events: (first?.details?.tracking_detail ?? []).map((e) => ({
                time: e.event_date ?? "",
                description: e.event_desc ?? "",
                location: e.signed_name,
          })),
    };
}

export async function getInventory(
    productId: string,
  ): Promise<{ skuId: string; price: number; stock: number; skuProps: Record<string, string>; shipFrom?: string; imageUrl?: string }[]> {
    const product = await getProduct(productId);
    return product.variants.map((v) => ({
          skuId: v.skuId,
          price: v.price,
          stock: v.stock ?? 0,
          // skuProps följer med så importen kan matcha lager på optionskombination
          // när skrapan tappar skuId (AE laddar inte längre SKU-data i sidan).
          skuProps: v.skuProps ?? {},
          // shipFrom (normaliserad landskod) → importen kan välja EU-lagrets saldo
          // när en färg finns i flera lager-länder (policy: endast EU-lagret).
          shipFrom: v.shipFrom,
          // Per-variant bild (sku_image) → importen kan koppla variantbild
          // (linkedMedia) även när skrapan tappade swatch-bilderna.
          imageUrl: v.imageUrl,
    }));
}

export interface AliExpressSearchResult {
  productId: string;
  title: string;
  imageUrl?: string;
  /** Faktiskt försäljningspris (efter rabatt). */
  priceUsd?: number;
  /** Ordinariepris före rabatt — visa överstruket om != priceUsd. */
  originalPriceUsd?: number;
  /** Rabattprocent (0–100). */
  discountPct?: number;
  productUrl?: string;
  /** Antal ordrar (popularitetssignal, om AliExpress returnerar det). */
  orders?: number;
  /** Snittbetyg 0–5. */
  rating?: number;
  /**
   * Warehouse-koder för listade SKU:er om search-svar ger det
   * (varierar mellan endpoints). Tom = okänt → måste hämta produkt-detail.
   */
  shipsFromCountries?: string[];
  hasEuWarehouse?: boolean;
  warehouseClass?: "EU" | "CN" | "MIXED" | "UNKNOWN";
}

interface RawSearchProduct {
  product_id?: string;
  subject?: string;
  product_main_image_url?: string;
  app_sale_price?: string;
  target_app_sale_price?: string;
  original_price?: string;
  discount?: string | number;
  product_detail_url?: string;
  // Optional fields returned by some AliExpress search endpoints:
  lastest_volume?: number | string;
  orders_count?: number | string;
  evaluate_rate?: string;
  average_star?: string;
  ship_to_days?: string;
  ship_from?: string;
  ship_from_country?: string;
}

/**
 * Nyare search-shape (text.search v2 / recommend.feed.get). Fältnamn
 * camelCase istället för snake_case, och payload ligger under `data.products`
 * (eller `data.products[].selection_search_product`).
 */
interface NewSearchProduct {
  itemId?: string | number;
  productId?: string | number;
  product_id?: string | number;
  itemTitle?: string;
  title?: string;
  subject?: string;
  itemMainPic?: string;
  mainPic?: string;
  product_main_image_url?: string;
  originalPrice?: string | number | { amount?: string | number; value?: string | number };
  salePrice?: string | number | { amount?: string | number; value?: string | number };
  app_sale_price?: string | number;
  target_app_sale_price?: string | number;
  // targetSalePrice/targetOriginalPrice är ALLTID i USD (targetOriginalPriceCurrency)
  // medan salePrice kan vara i CNY → föredra target-fälten för priceUsd.
  targetSalePrice?: string | number;
  targetOriginalPrice?: string | number;
  discount?: string | number;
  discountPercent?: string | number;
  itemUrl?: string;
  productDetailUrl?: string;
  product_detail_url?: string;
  ship_from?: string;
  ship_from_country?: string;
  // Popularitet/betyg i nyare shape: orders ("4,000+"), score (stjärnor 0–5).
  orders?: string | number;
  score?: string | number;
  /** Wrapper-shape: data.products[].selection_search_product */
  selection_search_product?: NewSearchProduct;
}

interface RawSearchResponse {
  products?:
    | { traffic_image_product_d_t_o?: RawSearchProduct[] }
    | NewSearchProduct[];
  result_list?: { traffic_image_product_d_t_o?: RawSearchProduct[] };
  /** Total träffar (för pagineringskontroll). */
  total_record_count?: number | string;
  /** Nyare svar lägger payload under `data` med code "00" på top-level. */
  data?: {
    pageIndex?: number;
    pageSize?: number;
    totalCount?: number | string;
    // aliexpress.ds.text.search (2026-06): produkterna ligger under
    // data.products.selection_search_product[] — inte som array direkt.
    products?: NewSearchProduct[] | { selection_search_product?: NewSearchProduct[] };
  };
  totalCount?: number | string;
}

export type AliExpressSortBy = "orders,desc" | "price,asc" | "price,desc" | "evaluate,desc";

export interface AliExpressSearchOptions {
  /** Sortering, default "orders,desc". */
  sortBy?: AliExpressSortBy;
  /** Sida (1-baserad), default 1. */
  page?: number;
  /** Sidstorlek, default 20, max 50. */
  pageSize?: number;
  /** Max-pris i USD (filtreras klient-sidigt om API:t inte stöder det). */
  maxPriceUsd?: number;
  /** Kategori-id om vi vill begränsa. */
  categoryId?: string;
}

function parseFloatSafe(s: unknown): number | undefined {
  if (s == null || s === "") return undefined;
  const n = parseFloat(String(s));
  return Number.isFinite(n) ? n : undefined;
}

function parseIntSafe(s: unknown): number | undefined {
  if (s == null || s === "") return undefined;
  const n = parseInt(String(s), 10);
  return Number.isFinite(n) ? n : undefined;
}

function parseAmount(v: unknown): number | undefined {
  if (v == null || v === "") return undefined;
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[^\d.\-]/g, ""));
    return Number.isFinite(n) ? n : undefined;
  }
  if (typeof v === "object") {
    const obj = v as { amount?: unknown; value?: unknown };
    return parseAmount(obj.amount ?? obj.value);
  }
  return undefined;
}

function mapSearchProduct(p: RawSearchProduct): AliExpressSearchResult {
  const shipFromRaw = p.ship_from_country ?? p.ship_from ?? "";
  const shipsFromCountries = shipFromRaw
    ? uniqueShipFromCodes([shipFromRaw])
    : [];
  const priceUsd = parseFloatSafe(p.target_app_sale_price ?? p.app_sale_price);
  const originalPriceUsd = parseFloatSafe(p.original_price);
  return {
    productId: String(p.product_id ?? ""),
    title: p.subject ?? "",
    imageUrl: p.product_main_image_url,
    priceUsd,
    originalPriceUsd:
      originalPriceUsd && priceUsd && originalPriceUsd > priceUsd
        ? originalPriceUsd
        : undefined,
    discountPct: parseFloatSafe(p.discount),
    productUrl: p.product_detail_url,
    orders: parseIntSafe(p.lastest_volume ?? p.orders_count),
    rating: parseFloatSafe(p.average_star ?? p.evaluate_rate),
    shipsFromCountries,
    hasEuWarehouse: hasAnyEuWarehouse(shipsFromCountries),
    warehouseClass: classifyWarehouses(shipsFromCountries),
  };
}

/**
 * Plockar ut produkt-arrayen ur ett "nyare shape"-svar. Listan kan ligga som
 * array direkt, eller (aliexpress.ds.text.search 2026-06) inbäddad under
 * nyckeln `selection_search_product`. Bug 2026-06-05: bara array-formen stöddes
 * → 0 träffar trots fullt svar (totalCount > 50000).
 */
function extractNewSearchList(prods: unknown): NewSearchProduct[] | undefined {
  if (Array.isArray(prods)) return prods as NewSearchProduct[];
  if (prods && typeof prods === "object") {
    const inner = (prods as { selection_search_product?: unknown }).selection_search_product;
    if (Array.isArray(inner)) return inner as NewSearchProduct[];
  }
  return undefined;
}

/** Mappar nyare search-shape (itemMainPic, salePrice, etc) till resultat. */
function mapNewSearchProduct(raw: NewSearchProduct): AliExpressSearchResult {
  const p = raw.selection_search_product ?? raw;
  const shipFromRaw = p.ship_from_country ?? p.ship_from ?? "";
  const shipsFromCountries = shipFromRaw
    ? uniqueShipFromCodes([shipFromRaw])
    : [];
  // targetSalePrice/targetOriginalPrice är USD; salePrice/originalPrice kan vara
  // CNY → ta USD-fälten först, lägg CNY-fälten sist som nödfallback.
  const priceUsd = parseAmount(
    p.targetSalePrice ?? p.target_app_sale_price ?? p.app_sale_price ?? p.salePrice,
  );
  const originalPriceUsd = parseAmount(p.targetOriginalPrice ?? p.originalPrice);
  const discountPct = parseAmount(p.discountPercent ?? p.discount);
  // Antal sålda: "4,000+" → 4000 (parseIntSafe stannar annars vid kommat).
  const ordersDigits = String(p.orders ?? "").replace(/[^\d]/g, "");
  const orders = ordersDigits ? parseInt(ordersDigits, 10) : undefined;
  const rating = parseFloatSafe(p.score);
  return {
    productId: String(p.itemId ?? p.productId ?? p.product_id ?? ""),
    title: String(p.itemTitle ?? p.title ?? p.subject ?? ""),
    imageUrl: p.itemMainPic ?? p.mainPic ?? p.product_main_image_url,
    priceUsd,
    originalPriceUsd:
      originalPriceUsd && priceUsd && originalPriceUsd > priceUsd
        ? originalPriceUsd
        : undefined,
    discountPct,
    orders,
    rating: rating !== undefined && rating > 0 ? rating : undefined,
    productUrl: p.itemUrl ?? p.productDetailUrl ?? p.product_detail_url,
    shipsFromCountries,
    hasEuWarehouse: hasAnyEuWarehouse(shipsFromCountries),
    warehouseClass: classifyWarehouses(shipsFromCountries),
  };
}

/**
 * Söker AliExpress-produkter via text. Använder aliexpress.ds.text.search-
 * metoden. Om appens permission-grupp inte har sök-tillgång kastar callApi
 * med tydligt felmeddelande (caller fångar och visar paste-URL-fallback).
 *
 * shipFrom på listsidan är inte garanterat — för säkra EU-flaggor krävs
 * en separat produkt-get per träff (gör i UI:t bara för synliga träffar).
 */
/**
 * DEBUG (read-only): returnerar RÅSVARET från aliexpress.ds.text.search,
 * otolkat. Används av /api/admin/ds-search?raw=1 för att skilja parse-fel
 * (produkter finns men i okänd form) från genuint tomt svar (t.ex. saknad
 * API-permission på metoden). Speglar bizParams i searchAliExpressByText.
 */
export async function debugRawTextSearch(query: string): Promise<unknown> {
  const bizParams: Record<string, string> = {
    keyWord: query,
    local: "en_US",
    countryCode: "SE",
    currency: "USD",
    searchExtend: JSON.stringify({ sortBy: "orders,desc" }),
    pageSize: "20",
    pageIndex: "1",
  };
  return callApi<unknown>("aliexpress.ds.text.search", bizParams);
}

export async function searchAliExpressByText(
    query: string,
    options: AliExpressSearchOptions = {},
): Promise<AliExpressSearchResult[]> {
    const sortBy = options.sortBy ?? "orders,desc";
    const page = Math.max(1, options.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, options.pageSize ?? 20));

    const bizParams: Record<string, string> = {
      keyWord: query,
      local: "en_US",
      countryCode: "SE",
      currency: "USD",
      searchExtend: JSON.stringify({ sortBy }),
      pageSize: String(pageSize),
      pageIndex: String(page),
    };
    if (options.categoryId) bizParams.categoryId = options.categoryId;
    if (options.maxPriceUsd !== undefined) {
      // AliExpress text-search stöder maxPrice i vissa app-grupper.
      // Skicka som extra param; om API:t ignorerar det filtrerar vi nedan.
      bizParams.maxSalePrice = String(options.maxPriceUsd);
    }

    const raw = await callApi<RawSearchResponse>("aliexpress.ds.text.search", bizParams);

  // 1) Legacy: { products: { traffic_image_product_d_t_o: [...] } }
  const legacyList =
    (raw.products && !Array.isArray(raw.products)
      ? raw.products.traffic_image_product_d_t_o
      : undefined)
    ?? raw.result_list?.traffic_image_product_d_t_o;

  let results: AliExpressSearchResult[] = [];
  if (legacyList && legacyList.length > 0) {
    results = legacyList.map(mapSearchProduct).filter((p) => p.productId);
  } else {
    // 2/3) Nyare shape: { code:"00", data: { products: { selection_search_product: [...] } } }
    //      eller arrayer direkt under data.products / products (utan wrapper).
    const newList =
      extractNewSearchList(raw.data?.products) ?? extractNewSearchList(raw.products);
    if (newList && newList.length > 0) {
      results = newList.map(mapNewSearchProduct).filter((p) => p.productId);
    }
  }

  // Klient-side maxPris-filter som backup om API:t inte respekterade det.
  if (options.maxPriceUsd !== undefined) {
    results = results.filter(
      (r) => r.priceUsd === undefined || r.priceUsd <= options.maxPriceUsd!,
    );
  }
  return results;
}

/**
 * Extraherar AliExpress productId från en URL eller returnerar input om det
 * redan ser ut som ett produkt-id (12-13 siffror).
 */
export function extractAliExpressProductId(input: string): string | null {
    const trimmed = input.trim();
    if (/^\d{10,16}$/.test(trimmed)) return trimmed;
    // Matchar /item/1234567890.html, /1234567890.html, ?productId=1234567890
    const patterns = [
        /\/item\/(\d{10,16})/,
        /\/(\d{10,16})\.html/,
        /[?&]productId=(\d{10,16})/,
        /[?&]product_id=(\d{10,16})/,
    ];
    for (const re of patterns) {
        const m = trimmed.match(re);
        if (m) return m[1];
    }
    return null;
}
