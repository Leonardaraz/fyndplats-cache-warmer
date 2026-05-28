// Service worker: tar emot importförfrågan från popupen och postar den till
// import-API:t med den hemliga token. Begär host-permission för API-origin vid behov.

async function getConfig() {
  const { apiBase, apiToken } = await chrome.storage.sync.get(["apiBase", "apiToken"]);
  return { apiBase, apiToken };
}

async function ensureHostPermission(apiBase) {
  const origin = new URL(apiBase).origin + "/*";
  const has = await chrome.permissions.contains({ origins: [origin] });
  if (has) return true;
  return chrome.permissions.request({ origins: [origin] });
}

async function importProduct(product) {
  const { apiBase, apiToken } = await getConfig();
  if (!apiBase || !apiToken) {
    return { ok: false, error: "Konfigurera API-URL och token i tilläggets inställningar." };
  }

  try {
    await ensureHostPermission(apiBase);
  } catch (_) {
    // request måste ibland ske från en användargest; fortsätt och låt fetch försöka.
  }

  // Skicka bara fält som API:t förväntar sig (utan _warnings).
  const payload = {
    supplierProductId: product.supplierProductId,
    sourceUrl: product.sourceUrl,
    rawTitle: product.rawTitle,
    rawDescription: product.rawDescription || "",
    imageUrls: product.imageUrls || [],
    variants: product.variants.map((v) => ({
      supplierVariantId: v.supplierVariantId,
      options: v.options || {},
      costUsd: Number(v.costUsd) || 0,
      stock: v.stock,
      included: Boolean(v.included),
    })),
  };

  try {
    const res = await fetch(`${apiBase.replace(/\/$/, "")}/api/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-fyndplats-token": apiToken },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.message || data.error || `HTTP ${res.status}` };
    return { ok: true, result: data.result };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// Generisk autentiserad request mot API:t (för order-läget).
async function apiCall(path, options) {
  const { apiBase, apiToken } = await getConfig();
  if (!apiBase || !apiToken) {
    return { ok: false, error: "Konfigurera API-URL och token i inställningarna." };
  }
  try {
    await ensureHostPermission(apiBase);
  } catch (_) {}
  try {
    const res = await fetch(`${apiBase.replace(/\/$/, "")}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", "x-fyndplats-token": apiToken, ...(options?.headers || {}) },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.message || data.error || `HTTP ${res.status}` };
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg) return;
  switch (msg.type) {
    case "IMPORT_PRODUCT":
      importProduct(msg.product).then(sendResponse);
      return true;
    case "FETCH_TASKS":
      apiCall("/api/tasks?status=pending", { method: "GET" }).then(sendResponse);
      return true;
    case "MARK_ORDERED":
      apiCall("/api/fulfillment/mark-ordered", {
        method: "POST",
        body: JSON.stringify({ taskId: msg.taskId }),
      }).then(sendResponse);
      return true;
    default:
      return;
  }
});
