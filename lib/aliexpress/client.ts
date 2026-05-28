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

function signRestRequest(methodPath: string, params: Record<string, string>, appSecret: string): string {
    let basestring = methodPath;
    basestring += Object.keys(params)
      .sort()
      .map((k) => `${k}${params[k]}`)
      .join("");
    return createHmac("sha256", appSecret).update(basestring).digest("hex").toUpperCase();
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
    const responseKey = method.replaceAll(".", "_") + "_response";
    const data = json[responseKey] ?? json;
    if ((data as { code?: number }).code && (data as { code?: number }).code !== 200) {
          throw new Error(`AliExpress API-fel: ${JSON.stringify(data)}`);
    }
    return data as T;
}

export function buildAuthUrl(redirectUri: string, state?: string): string {
    const appKey = process.env.ALIEXPRESS_APP_KEY;
    if (!appKey) throw new Error("ALIEXPRESS_APP_KEY saknas");
    const p = new URLSearchParams({
          response_type: "code",
          client_id: appKey,
          redirect_uri: redirectUri,
          ...(state ? { state } : {}),
    });
    return `${AUTH_BASE}/authorize?${p.toString()}`;
}

export async function exchangeCode(code: string, _redirectUri: string): Promise<DsTokenResponse> {
    const appKey = process.env.ALIEXPRESS_APP_KEY;
    const appSecret = process.env.ALIEXPRESS_APP_SECRET;
    if (!appKey || !appSecret) throw new Error("App-nycklar saknas");

  const params: Record<string, string> = {
        app_key: appKey,
        code,
        sign_method: "sha256",
        simplify: "true",
        timestamp: String(Date.now()),
  };
    const signature = signRestRequest("/auth/token/create", params, appSecret);
    const query = new URLSearchParams({ ...params, sign: signature }).toString();

  const res = await fetch(`${REST_BASE}/auth/token/create?${query}`, { method: "POST" });
    if (!res.ok) throw new Error(`Token-utbyte misslyckades: ${res.status}`);
    return (await res.json()) as DsTokenResponse;
}

export async function refreshAccessToken(refreshToken: string): Promise<DsTokenResponse> {
    const appKey = process.env.ALIEXPRESS_APP_KEY;
    const appSecret = process.env.ALIEXPRESS_APP_SECRET;
    if (!appKey || !appSecret) throw new Error("App-nycklar saknas");

  const params: Record<string, string> = {
        app_key: appKey,
        refresh_token: refreshToken,
        sign_method: "sha256",
        simplify: "true",
        timestamp: String(Date.now()),
  };
    const signature = signRestRequest("/auth/token/refresh", params, appSecret);
    const query = new URLSearchParams({ ...params, sign: signature }).toString();

  const res = await fetch(`${REST_BASE}/auth/token/refresh?${query}`, { method: "POST" });
    if (!res.ok) throw new Error(`Token-refresh misslyckades: ${res.status}`);
    return (await res.json()) as DsTokenResponse;
}

interface RawProduct {
    product?: {
          product_id?: number;
          subject?: string;
          description?: string;
          ae_multimedia_info_dto?: { ae_video_dtos?: unknown; image_urls?: string };
          ae_item_sku_info_dtos?: {
            ae_item_sku_info_d_t_o?: Array<{
              id?: string;
              sku_stock?: boolean;
              sku_available_stock?: number;
              offer_sale_price?: string;
              sku_price?: string;
              ae_sku_property_dtos?: {
                ae_sku_property_d_t_o?: Array<{
                  sku_property_name?: string;
                  property_value_definition_name?: string;
                  sku_image?: string;
                }>;
              };
            }>;
          };
    };
}

export async function getProduct(productId: string): Promise<AliExpressDsProduct> {
    const raw = await callApi<RawProduct>("aliexpress.ds.product.get", {
          product_id: productId,
          target_currency: "USD",
          target_language: "EN",
    });

  const p = raw.product;
    if (!p) throw new Error(`Produkt ${productId} hittades inte i DS-svaret.`);

  const images = (p.ae_multimedia_info_dto?.image_urls ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const skuDtos = p.ae_item_sku_info_dtos?.ae_item_sku_info_d_t_o ?? [];

  const variants: AliExpressDsVariant[] = skuDtos.map((sku) => {
        const props: Record<string, string> = {};
        let imageUrl: string | undefined;
        for (const prop of sku.ae_sku_property_dtos?.ae_sku_property_d_t_o ?? []) {
                const name = prop.sku_property_name ?? "Option";
                const value = prop.property_value_definition_name ?? "";
                props[name] = value;
                if (prop.sku_image) imageUrl = prop.sku_image;
        }
        const price = parseFloat(sku.offer_sale_price ?? sku.sku_price ?? "0");
        const stock = sku.sku_available_stock ?? (sku.sku_stock ? 999 : 0);
        return {
                skuId: String(sku.id ?? ""),
                skuProps: props,
                imageUrl,
                price,
                stock,
        };
  });

  return {
        productId: String(p.product_id ?? productId),
        title: p.subject ?? "",
        description: p.description ?? "",
        images,
        variants,
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
  ): Promise<{ skuId: string; price: number; stock: number }[]> {
    const product = await getProduct(productId);
    return product.variants.map((v) => ({
          skuId: v.skuId,
          price: v.price,
          stock: v.stock ?? 0,
    }));
}
