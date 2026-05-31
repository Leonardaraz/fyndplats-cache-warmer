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
    // Aggregerade warehouse-koder för EU-filterringen (t.ex. ["ES","CN"]).
    // Tom = okänd — API:t hanterar det som UNKNOWN i Wix-metadatat.
    shipsFrom: Array.isArray(product.shipsFrom) ? product.shipsFrom : [],
    variants: product.variants.map((v) => ({
      supplierVariantId: v.supplierVariantId,
      options: v.options || {},
      costUsd: Number(v.costUsd) || 0,
      stock: v.stock,
      shipFrom: v.shipFrom || "",
      included: Boolean(v.included),
    })),
    ...(product.optionColorCodes ? { optionColorCodes: product.optionColorCodes } : {}),
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

// Samplar dominerande färg från en bild-URL via OffscreenCanvas (i service
// workern, så vi slipper canvas-tainting/CORS). Returnerar hex eller null.
async function sampleColor(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);
    // Skala ner till en liten yta och medelvärdesbilda pixlarna.
    const size = 16;
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue; // hoppa över transparenta pixlar
      r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
    }
    if (n === 0) return null;
    const hex = (x) => Math.round(x / n).toString(16).padStart(2, "0");
    return `#${hex(r)}${hex(g)}${hex(b)}`;
  } catch (_) {
    return null;
  }
}

// Samplar färger för alla swatch-bilder och bygger { [option]: { [choice]: hex } }.
async function sampleSwatchColors(swatchImages) {
  const out = {};
  for (const [optionName, choices] of Object.entries(swatchImages || {})) {
    const codes = {};
    for (const [choiceName, url] of Object.entries(choices)) {
      const hex = await sampleColor(url);
      if (hex) codes[choiceName] = hex;
    }
    if (Object.keys(codes).length) out[optionName] = codes;
  }
  return { ok: true, optionColorCodes: out };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg) return;
  switch (msg.type) {
    case "IMPORT_PRODUCT":
      importProduct(msg.product).then(sendResponse);
      return true;
    case "SAMPLE_COLORS":
      sampleSwatchColors(msg.swatchImages).then(sendResponse);
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
