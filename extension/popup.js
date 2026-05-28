// Popup: hämtar extraherad produkt från content-scriptet, visar varianter med
// kryssrutor (variant-filter), och postar valda varianter till import-API:t.

let product = null;

const $title = document.getElementById("title");
const $variants = document.getElementById("variants");
const $import = document.getElementById("import");
const $status = document.getElementById("status");

function setStatus(text, cls) {
  $status.textContent = text;
  $status.className = cls || "";
}

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function load() {
  const tab = await activeTab();
  if (!tab || !/aliexpress\.(com|us)\/item\//.test(tab.url || "")) {
    $title.textContent = "Öppna en AliExpress produktsida först.";
    return;
  }

  chrome.tabs.sendMessage(tab.id, { type: "EXTRACT_PRODUCT" }, (res) => {
    if (chrome.runtime.lastError || !res || !res.ok) {
      $title.textContent = "Kunde inte läsa produkten (ladda om sidan).";
      return;
    }
    product = res.product;
    render();
  });
}

function render() {
  $title.textContent = product.rawTitle || "(ingen titel)";
  $variants.innerHTML = "";
  product.variants.forEach((v, i) => {
    const row = document.createElement("div");
    row.className = "variant";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = v.included;
    cb.id = `v${i}`;
    cb.addEventListener("change", () => (product.variants[i].included = cb.checked));
    const label = document.createElement("label");
    label.htmlFor = `v${i}`;
    const optText = Object.values(v.options).join(" / ") || "Standard";
    label.innerHTML = `${optText} <span class="cost">($${v.costUsd})</span>`;
    row.append(cb, label);
    $variants.append(row);
  });

  if (product._warnings && product._warnings.length) {
    setStatus(product._warnings.join("\n"), "warn");
  }
  $import.disabled = false;
}

$import.addEventListener("click", async () => {
  const chosen = product.variants.filter((v) => v.included);
  if (chosen.length === 0) {
    setStatus("Välj minst en variant.", "err");
    return;
  }
  $import.disabled = true;
  setStatus("Importerar…");

  chrome.runtime.sendMessage({ type: "IMPORT_PRODUCT", product }, (res) => {
    if (chrome.runtime.lastError || !res) {
      setStatus("Fel: " + (chrome.runtime.lastError?.message || "okänt"), "err");
      $import.disabled = false;
      return;
    }
    if (res.ok) {
      setStatus(`Klart! Wix-produkt skapad (${res.result.wixProductId}).`, "ok");
    } else {
      setStatus("Import misslyckades: " + res.error, "err");
      $import.disabled = false;
    }
  });
});

document.getElementById("orders").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("orders.html") });
});

load();
