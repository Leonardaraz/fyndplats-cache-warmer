// Skriv- och läs-helpers mot mål-sajten (v3). Inga sidoeffekter utöver
// HTTP-anropen. Funktionerna är endpoint-tunna så orkestratorn kan styra
// flödet, batching och felhantering.

import { WIX_STORES_APP_ID, type V3Product } from "./transform.ts";

const WIX_BASE = "https://www.wixapis.com";

function headers(token: string, siteId: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: token,
    "wix-site-id": siteId,
  };
}

// ---------- catalog version ----------

export async function getCatalogVersion(token: string, siteId: string): Promise<string> {
  const res = await fetch(`${WIX_BASE}/stores/v3/provision/version`, {
    method: "GET",
    headers: headers(token, siteId),
  });
  if (!res.ok) throw new Error(`provision/version ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { catalogVersion: string };
  return data.catalogVersion;
}

// ---------- categories ----------

export interface CategoryTreeInfo {
  rootCategoryId: string;
}

/** Hittar root-category-id för Wix Stores-trädet (krävs som parentCategory.id). */
export async function getRootCategoryId(token: string, siteId: string): Promise<string> {
  const res = await fetch(`${WIX_BASE}/categories/v1/categories/list-trees`, {
    method: "POST",
    headers: headers(token, siteId),
    body: JSON.stringify({ treeReference: { appNamespace: "@wix/stores" } }),
  });
  if (!res.ok) throw new Error(`list-trees ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { trees?: { rootCategoryId?: string }[] };
  const root = data.trees?.[0]?.rootCategoryId;
  if (!root) throw new Error("Hittade ingen root-category för @wix/stores.");
  return root;
}

export async function createCategory(
  token: string,
  siteId: string,
  input: { name: string; visible: boolean; parentId: string },
): Promise<{ id: string; slug: string }> {
  const res = await fetch(`${WIX_BASE}/categories/v1/categories`, {
    method: "POST",
    headers: headers(token, siteId),
    body: JSON.stringify({
      category: {
        name: input.name,
        visible: input.visible,
        parentCategory: { id: input.parentId },
      },
      treeReference: { appNamespace: "@wix/stores" },
    }),
  });
  if (!res.ok) throw new Error(`create-category ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as { category: { id: string; slug: string } };
  return { id: data.category.id, slug: data.category.slug };
}

export async function bulkAddItemsToCategory(
  token: string,
  siteId: string,
  categoryId: string,
  productIds: string[],
): Promise<void> {
  if (productIds.length === 0) return;
  const res = await fetch(
    `${WIX_BASE}/categories/v1/bulk/categories/${encodeURIComponent(categoryId)}/add-items`,
    {
      method: "POST",
      headers: headers(token, siteId),
      body: JSON.stringify({
        items: productIds.map((id) => ({ catalogItemId: id, appId: WIX_STORES_APP_ID })),
        treeReference: { appNamespace: "@wix/stores" },
      }),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`bulk-add-items ${res.status}: ${text.slice(0, 300)}`);
  }
}

// ---------- media (image import) ----------

function guessMime(url: string): string {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "image/jpeg";
}

export async function importMedia(
  token: string,
  siteId: string,
  url: string,
  displayName: string,
): Promise<{ id: string; url: string }> {
  const res = await fetch(`${WIX_BASE}/site-media/v1/files/import`, {
    method: "POST",
    headers: headers(token, siteId),
    body: JSON.stringify({ url, displayName, mimeType: guessMime(url) }),
  });
  if (!res.ok) throw new Error(`media import ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { file?: { id?: string; url?: string } };
  if (!data.file?.url) throw new Error("media import: ingen url i svaret");
  return { id: data.file.id ?? "", url: data.file.url };
}

// ---------- products (bulk create) ----------

export interface BulkCreateResult {
  /** Resultat i samma ordning som inputen; null vid fel. */
  results: ({ id: string; slug: string } | null)[];
  /** Fel-meddelanden per index om något misslyckades. */
  errors: (string | null)[];
}

export async function bulkCreateProducts(
  token: string,
  siteId: string,
  products: V3Product[],
): Promise<BulkCreateResult> {
  const res = await fetch(`${WIX_BASE}/stores/v3/bulk/products/create`, {
    method: "POST",
    headers: headers(token, siteId),
    body: JSON.stringify({
      products,
      returnEntity: true,
      fields: ["URL", "PLAIN_DESCRIPTION"],
    }),
  });
  if (!res.ok) throw new Error(`bulk-create-products ${res.status}: ${(await res.text()).slice(0, 400)}`);
  const data = (await res.json()) as {
    productResults?: { results?: { item?: { id?: string; slug?: string }; itemMetadata?: { success?: boolean; originalItemMetadata?: unknown; itemError?: { message?: string } } }[] };
  };
  const rs = data.productResults?.results ?? [];
  return {
    results: rs.map((r) =>
      r.itemMetadata?.success && r.item?.id ? { id: r.item.id, slug: r.item.slug ?? "" } : null,
    ),
    errors: rs.map((r) => (r.itemMetadata?.success ? null : r.itemMetadata?.itemError?.message ?? "okänt fel")),
  };
}

// ---------- inventory ----------

export interface InventoryItem {
  id: string;
  revision: string;
  variantId: string;
  productId: string;
}

export async function queryInventoryByProductId(
  token: string,
  siteId: string,
  productId: string,
): Promise<InventoryItem[]> {
  const res = await fetch(`${WIX_BASE}/stores/v3/inventory-items/query`, {
    method: "POST",
    headers: headers(token, siteId),
    body: JSON.stringify({ query: { filter: { productId } } }),
  });
  if (!res.ok) throw new Error(`inventory query ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { inventoryItems?: InventoryItem[] };
  return data.inventoryItems ?? [];
}

export async function bulkUpdateInventory(
  token: string,
  siteId: string,
  updates: { id: string; revision: string; quantity: number }[],
): Promise<void> {
  if (updates.length === 0) return;
  const res = await fetch(`${WIX_BASE}/stores/v3/bulk/inventory-items/update`, {
    method: "POST",
    headers: headers(token, siteId),
    body: JSON.stringify({
      inventoryItems: updates.map((u) => ({
        inventoryItem: {
          id: u.id,
          revision: u.revision,
          trackQuantity: true,
          trackingMethod: { quantity: u.quantity },
        },
      })),
    }),
  });
  if (!res.ok) throw new Error(`bulk-update-inventory ${res.status}: ${(await res.text()).slice(0, 200)}`);
}
