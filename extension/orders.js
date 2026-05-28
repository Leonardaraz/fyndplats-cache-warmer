// Order-läge: hämtar väntande tasks, bygger en återupptagbar kö (persisterad i
// chrome.storage.local) och låter användaren beställa en i taget. Speglar
// kö-logiken i lib/queue/queue.ts (som är enhetstestad på serversidan).

const $bar = document.getElementById("bar");
const $list = document.getElementById("list");
const QUEUE_KEY = "orderQueueSnapshot";

let tasksById = {};
let snapshot = { items: [] };

function send(type, payload) {
  return new Promise((resolve) => chrome.runtime.sendMessage({ type, ...payload }, resolve));
}

async function saveSnapshot() {
  await chrome.storage.local.set({ [QUEUE_KEY]: snapshot });
}

function nextPending() {
  return snapshot.items.find((it) => it.state === "pending") || null;
}

function progress() {
  const c = (s) => snapshot.items.filter((it) => it.state === s).length;
  return { total: snapshot.items.length, pending: c("pending"), done: c("done"), error: c("error") };
}

async function load() {
  $bar.textContent = "Laddar tasks…";
  const res = await send("FETCH_TASKS", {});
  if (!res || !res.ok) {
    $bar.textContent = "Fel: " + ((res && res.error) || "okänt");
    return;
  }
  const tasks = res.data.tasks || [];
  tasksById = Object.fromEntries(tasks.map((t) => [t.taskId, t]));

  // Återuppta befintlig kö om den matchar dagens tasks; annars bygg ny.
  const stored = (await chrome.storage.local.get(QUEUE_KEY))[QUEUE_KEY];
  const ids = tasks.map((t) => t.taskId);
  if (stored && stored.items && stored.items.every((it) => ids.includes(it.id))) {
    // Återställ ev. "active" (avbruten mitt i) till "pending".
    snapshot = { items: stored.items.map((it) => (it.state === "active" ? { ...it, state: "pending" } : it)) };
    // Lägg till nya tasks som dykt upp sedan sist.
    for (const id of ids) if (!snapshot.items.find((it) => it.id === id)) snapshot.items.push({ id, state: "pending" });
  } else {
    snapshot = { items: ids.map((id) => ({ id, state: "pending" })) };
  }
  await saveSnapshot();
  render();
}

function render() {
  const p = progress();
  $bar.textContent = `${p.done} klara · ${p.pending} kvar · ${p.error} fel (av ${p.total})`;
  $list.innerHTML = "";

  for (const item of snapshot.items) {
    const t = tasksById[item.id];
    if (!t) continue;
    const div = document.createElement("div");
    div.className = `task ${item.state}`;

    const addr = t.shippingAddress || {};
    const addrText = [addr.fullName, addr.addressLine1, addr.postalCode, addr.city, addr.country]
      .filter(Boolean)
      .join(", ");

    const variants = Object.entries(t.variantChoices || {}).map(([k, v]) => `${k}: ${v}`).join(", ");

    div.innerHTML = `
      <div class="row">
        <strong>#${t.orderNumber || "?"} — ${t.productName || "(namn saknas)"} ×${t.quantity}</strong>
        <span class="state">${item.state}</span>
      </div>
      <div class="meta">${variants ? variants + " · " : ""}SKU: ${t.sku || "-"}</div>
      <div class="meta">Leverans: ${addrText || "(adress saknas)"}</div>
    `;

    if (item.state === "pending" || item.state === "active") {
      const orderedBtn = document.createElement("button");
      orderedBtn.textContent = "Markera beställd";
      orderedBtn.addEventListener("click", () => markOrdered(item.id));
      div.appendChild(orderedBtn);
    }
    $list.appendChild(div);
  }
}

async function markOrdered(taskId) {
  const item = snapshot.items.find((it) => it.id === taskId);
  if (!item) return;
  item.state = "active";
  await saveSnapshot();
  render();

  const res = await send("MARK_ORDERED", { taskId });
  if (res && res.ok) {
    item.state = "done";
  } else {
    item.state = "error";
    item.error = (res && res.error) || "okänt fel";
  }
  await saveSnapshot();
  render();
}

document.getElementById("reload").addEventListener("click", load);
load();
