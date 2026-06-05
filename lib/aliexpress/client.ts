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
          ?? (sku.sku_stock ? 999 : 0);
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
          payment_required?: boolean;
          pay_url?: string;
    };
    is_success?: boolean;
}

export async function createOrder(params: DsOrderCreateParams): Promise<DsOrderCreateResult> {
    const addr = params.shippingAddress;
    const bizParams: Record<string, string> = {
          product_id: params.productId,
          product_count: String(params.quantity),
          sku_id: params.skuId,
          logistics_service_name: params.logisticsServiceName ?? "CAINIAO_ECONOMY_GLOBAL",
          address: addr.addressLine1 + (addr.addressLine2 ? ` ${addr.addressLine2}` : ""),
          city: addr.city,
          country: addr.countryCode,
          zip: addr.postalCode,
          contact_person: addr.name,
          ...(addr.phone ? { mobile_no: addr.phone } : {}),
          ...(params.buyerMessage ? { buyer_message: params.buyerMessage } : {}),
    };

  const raw = await callApi<RawOrderCreate>("aliexpress.ds.order.create", bizParams);
    const result = raw.result ?? {};

  return {
        tradeOrderId: String(result.order_id ?? ""),
        paymentRequired: result.payment_required ?? true,
        paymentUrl: result.pay_url,
  };
}

interface RawTracking {
    result?: {
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
    };
}

export async function getTracking(tradeOrderId: string): Promise<DsTrackingResult> {
    const raw = await callApi<RawTracking>("aliexpress.ds.order.tracking.get", {
          order_id: tradeOrderId,
    });

  const logisticsOrders = raw.result?.logistics_order_list ?? [];
    const first = logisticsOrders[0];

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
  ): Promise<{ skuId: string; price: number; stock: number; skuProps: Record<string, string>; shipFrom?: string }[]> {
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
