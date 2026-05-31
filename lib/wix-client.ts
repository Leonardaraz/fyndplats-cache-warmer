// lib/wix-client.ts
// Minimal authenticated fetch wrapper around the Wix REST surface.
// For Headless we authenticate with an OAuth app instance access token derived from
// WIX_API_KEY (a Wix-issued account-level API key) bound to the site ID.
//
// We deliberately do NOT pull in the @wix/sdk package — direct fetch keeps the bundle
// small and avoids the SDK auto-init pulling secrets at import time.

const WIX_BASE = 'https://www.wixapis.com';

interface WixRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
  path: string;
  body?: unknown;
  // Override site context if needed; defaults to env WIX_SITE_ID.
  siteId?: string;
}

export class WixApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly bodyText: string,
    public readonly path: string,
  ) {
    super(`Wix API ${status} on ${path}: ${bodyText.slice(0, 400)}`);
    this.name = 'WixApiError';
  }
}

function getApiKey(): string {
  const key = process.env.WIX_API_KEY;
  if (!key) throw new Error('WIX_API_KEY env var is required for coupon/abandoned-checkout API calls');
  return key;
}

function getSiteId(siteIdOverride?: string): string {
  const siteId = siteIdOverride ?? process.env.WIX_SITE_ID;
  if (!siteId) throw new Error('WIX_SITE_ID env var is required');
  return siteId;
}

export async function wixFetch<T = unknown>(opts: WixRequestOptions): Promise<T> {
  const url = `${WIX_BASE}${opts.path}`;
  const res = await fetch(url, {
    method: opts.method ?? 'GET',
    headers: {
      Authorization: getApiKey(),
      'wix-site-id': getSiteId(opts.siteId),
      'Content-Type': 'application/json',
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    // App Router edge/node compatible — no Next-specific cache control needed for API calls.
  });

  const text = await res.text();
  if (!res.ok) {
    throw new WixApiError(res.status, text, opts.path);
  }
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

// --------------------------------------------------------------------------
// Stores Catalog V3 — produkt-beskrivning (för /admin/enrich-products)
// --------------------------------------------------------------------------
// Används av flik-back-fillen för att läsa + skriva produktens rika beskrivning
// (plainDescription), där de tabbade PDP-sektionerna lagras som <h2>-block.
// Kräver WIX_API_KEY med Stores read/write (samma nyckel som kupong-/checkout-API:t).

export interface AdminProduct {
  id: string;
  revision: string;
  name: string;
  /** Rik beskrivnings-HTML (V3 PLAIN_DESCRIPTION) — innehåller flik-<h2>-blocken. */
  description: string;
}

/** Hämtar en produkts beskrivning + revision (revisionen krävs för PATCH). */
export async function getAdminProduct(productId: string): Promise<AdminProduct | null> {
  try {
    const data = await wixFetch<{
      product?: { id: string; revision: string; name?: string; plainDescription?: string };
    }>({
      method: 'GET',
      path: `/stores/v3/products/${encodeURIComponent(productId)}?fields=PLAIN_DESCRIPTION`,
    });
    const p = data?.product;
    if (!p) return null;
    return { id: p.id, revision: p.revision, name: p.name ?? '', description: p.plainDescription ?? '' };
  } catch (e) {
    if (e instanceof WixApiError && e.status === 404) return null;
    throw e;
  }
}

/**
 * Skriver om produktens beskrivning (plainDescription) — PATCH med fieldMask så
 * endast beskrivningen rörs. Returnerar nya revisionen.
 */
export async function updateAdminProductDescription(
  productId: string,
  revision: string,
  plainDescription: string,
): Promise<{ revision: string }> {
  const data = await wixFetch<{ product?: { revision?: string } }>({
    method: 'PATCH',
    path: `/stores/v3/products/${encodeURIComponent(productId)}`,
    body: { product: { revision, plainDescription }, fieldMask: { paths: ['plainDescription'] } },
  });
  return { revision: data?.product?.revision ?? revision };
}
