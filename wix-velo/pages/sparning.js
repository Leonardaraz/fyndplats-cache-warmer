// Page-code för /sparning-sidan
// Klistra in i Wix Editor → vänster meny → Pages → Sparning → Code (</> symbol)
//
// === ELEMENT-ID:N SOM SIDAN BEHÖVER ===
// Mappa de här ID:na mot element på sidan (Properties-panelen → ID). Saknas
// något skapar du elementet (eller döljer raden i koden).
//
//   #trackingNumberText   – Text:    visar trackingnumret
//   #statusBadge          – Text:    huvudstatus ("På väg till dig", "Levererad", …)
//   #carrierText          – Text:    fraktbolaget (t.ex. "Cainiao")
//   #eventsRepeater       – Repeater: ritar event-tidslinjen
//       inuti repeatern:
//         #eventTitle     – Text:    description
//         #eventTime      – Text:    formaterad tid
//         #eventLocation  – Text:    plats (kan döljas om tom)
//   #stepOrdered          – ikon/bubbla för "Beställd"
//   #stepPacked           – ikon/bubbla för "Packad"
//   #stepShipped          – ikon/bubbla för "Skickad"
//   #stepInTransit        – ikon/bubbla för "På väg"
//   #stepDelivered        – ikon/bubbla för "Levererad"
//   #emptyStateBox        – Box som visas när inga events finns ännu
//   #lastUpdatedText      – Text: "Senast uppdaterad: …"
//   #refreshButton        – Button: trigga manuell re-fetch (valfritt)

import wixLocation from "wix-location";
import { fetch } from "wix-fetch";

const STEP_ORDER = ["ordered", "packed", "shipped", "in_transit", "delivered"];

$w.onReady(async () => {
  const tn = wixLocation.query?.tn;
  if (!tn) {
    safeSet("#statusBadge", "Saknar spårningsnummer");
    return;
  }
  safeSet("#trackingNumberText", tn);
  await loadAndRender(tn);

  // Manuell uppdatering om knappen finns.
  try {
    $w("#refreshButton").onClick(async () => {
      $w("#refreshButton").disable();
      await loadAndRender(tn, true);
      $w("#refreshButton").enable();
    });
  } catch (_) { /* knappen finns inte — strunta i det */ }
});

async function loadAndRender(tn, forceRefresh = false) {
  try {
    const data = await fetchTracking(tn);
    renderHeader(data);
    renderSteps(data);
    renderEvents(data.events || []);
    renderLastUpdated(data.lastFetchedAt);
  } catch (err) {
    console.error("[/sparning] kunde inte hämta tracking:", err);
    safeSet("#statusBadge", "Tillfälligt fel — försök igen om en stund");
  }
}

async function fetchTracking(tn) {
  const res = await fetch(`/_functions/track?tn=${encodeURIComponent(tn)}`, { method: "GET" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function renderHeader(data) {
  const labels = {
    registered:        "Registrerad",
    in_transit:        "På väg till dig",
    pickup:            "Skickad",
    out_for_delivery:  "Ute för leverans",
    undelivered:       "Leveransförsök",
    alert:             "Försenad",
    delivered:         "Levererad",
    expired:           "Spårning avslutad",
    unknown:           "Registrerad",
  };
  safeSet("#statusBadge", labels[data.status] || data.status || "Registrerad");
  safeSet("#carrierText", data.carrier || "Fyndplats Frakt");
}

function renderSteps(data) {
  const reached = STEP_ORDER.indexOf(stepFor(data.status));
  STEP_ORDER.forEach((step, i) => {
    const id = `#step${capitalize(step.replace(/_/g, ""))}`;
    try {
      const el = $w(id);
      if (i <= reached) el.show();
      // Anpassa här om du vill färglägga aktiv/passad/inaktiv:
      // if (i < reached) el.style.opacity = 1;
      // if (i === reached) el.style.opacity = 1;
      // if (i > reached) el.style.opacity = 0.35;
    } catch (_) { /* element saknas, strunt samma */ }
  });
}

function stepFor(status) {
  switch (status) {
    case "delivered":        return "delivered";
    case "out_for_delivery": return "in_transit";
    case "in_transit":       return "in_transit";
    case "pickup":           return "shipped";
    case "registered":       return "packed";
    default:                 return "ordered";
  }
}

function renderEvents(events) {
  if (!events.length) {
    safeShow("#emptyStateBox");
    safeHide("#eventsRepeater");
    return;
  }
  safeHide("#emptyStateBox");
  try {
    $w("#eventsRepeater").data = events.map((e, i) => ({
      _id: String(i),
      title: e.description || "Spårningshändelse",
      time: formatTime(e.time),
      location: e.location || "",
    }));
    $w("#eventsRepeater").onItemReady(($item, item) => {
      safeSetIn($item, "#eventTitle", item.title);
      safeSetIn($item, "#eventTime", item.time);
      safeSetIn($item, "#eventLocation", item.location);
    });
    $w("#eventsRepeater").show();
  } catch (err) {
    console.warn("[/sparning] repeater saknas:", err);
  }
}

function renderLastUpdated(iso) {
  if (!iso) return;
  const d = new Date(iso);
  const formatted = d.toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" });
  safeSet("#lastUpdatedText", `Senast uppdaterad: ${formatted}`);
}

function formatTime(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" });
  } catch (_) {
    return String(iso);
  }
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Hjälpare som inte kraschar om element saknas på sidan.
function safeSet(id, text) {
  try { $w(id).text = String(text); } catch (_) {}
}
function safeShow(id) { try { $w(id).show(); } catch (_) {} }
function safeHide(id) { try { $w(id).hide(); } catch (_) {} }
function safeSetIn($item, id, text) {
  try { $item(id).text = String(text); } catch (_) {}
}
