// Content-script för AliExpress SÖK-/KATEGORI-sidor (ej produktsidor — de körs av
// content.js). Två funktioner:
//
//   1. EU-lager-filter — visar bara produkter som skickas från ett EU-lager.
//      AliExpress filtrerar ship-from server-sida via URL-param `shpf_co=<ISO2>`
//      (verifierat live 2026-06-02: `?shpf_co=ES` → 60→9 träffar, alla "Ship from
//      EU"). VIKTIG begränsning: AE:s filter tar bara ETT land i taget (komma-
//      separerat ignoreras). Vi kan alltså inte visa alla EU-länder samtidigt via
//      AE:s officiella filter. Lösning: vi läser vilka EU-länder som finns för
//      sökningen (ur sidofältets "Shipping from"-lista), auto-applicerar det bästa
//      tillgängliga, och visar resten som ett-klicks-chips i banneret. Varje visad
//      produkt är då garanterat EU (server-sidan filtrerar — säkrare än att gissa
//      ur korten, som saknar ship-from-data i DOM/embedded-JSON).
//
//   2. Bulk-select + bulk-import — kryssruta på varje kort, sticky bottom-bar och
//      en import-modal. Vald produkt öppnas i en dold flik av background.js, skrapas
//      med samma path som en enskild import (content.js), och postas till /api/import.
//
// Två nivåer av av/på: global toggle (chrome.storage.sync.euOnly, sätts i popupen)
// och en per-flik-override (sessionStorage) så Leonard kan stänga filtret på EN
// flik utan att stänga av globalt.

(() => {
  "use strict";
  if (window.__fpDiscoverLoaded) return; // skydda mot dubbelinjektion
  window.__fpDiscoverLoaded = true;

  // --- EU-konstanter — EN sanningskälla i extension/eu-countries.js -------
  // Laddas före detta skript via manifest.json (content_scripts-arrayen kör
  // filerna i ordning i samma isolerade värld) och exponeras på globalThis.FP_EU.
  const { EU_CODES, EU_PRIORITY, NAME_TO_ISO, ISO_TO_NAME, FLAG } = globalThis.FP_EU;

  const SHIP_HEAD_RE = /^\s*(shipping from|ship from|levereras\s*fr[åa]n|skickas\s*fr[åa]n|frakt(?:as)?\s*fr[åa]n)\s*$/i;

  // --- Litet tillstånd ---------------------------------------------------
  let euOnly = false; // global flagga (storage.sync)
  let featureFlags = null; // AI-funktioner från popupen (skickas vidare till import)
  let apiBase = "";
  const selected = new Map(); // productId -> { id, url, title, thumb }
  const processed = new WeakSet(); // kort-containrar vi redan dekorerat
  let bulkInProgress = false;

  // Per-flik-override: när satt ignoreras EU-filtret på just denna flik.
  const tabDisabled = () => sessionStorage.getItem("fp_eu_tab_off") === "1";
  const setTabDisabled = (v) => {
    if (v) sessionStorage.setItem("fp_eu_tab_off", "1");
    else sessionStorage.removeItem("fp_eu_tab_off");
  };
  // Guard mot upprepad auto-redirect i samma flik (respekterar AE:s "Clear all").
  const autoApplied = () => sessionStorage.getItem("fp_eu_applied") === "1";
  const setAutoApplied = (v) => {
    if (v) sessionStorage.setItem("fp_eu_applied", "1");
    else sessionStorage.removeItem("fp_eu_applied");
  };

  // --- URL-hjälpare ------------------------------------------------------
  function activeShipFrom() {
    try {
      return (new URL(location.href).searchParams.get("shpf_co") || "").toUpperCase();
    } catch (_) {
      return "";
    }
  }
  function urlWithShipFrom(code) {
    const u = new URL(location.href);
    if (code) u.searchParams.set("shpf_co", code);
    else u.searchParams.delete("shpf_co");
    return u.toString();
  }
  function urlWithSort() {
    const u = new URL(location.href);
    u.searchParams.set("sortType", "total_tranpro_desc");
    return u.toString();
  }
  function isSortedByOrders() {
    try {
      return new URL(location.href).searchParams.get("sortType") === "total_tranpro_desc";
    } catch (_) {
      return false;
    }
  }

  // --- Tillgängliga EU-länder ur sidofältets "Shipping from"-lista -------
  // Returnerar { found:boolean, eu:string[], all:string[] }. found=false när
  // listan inte renderats än (eller sökningen saknar ship-from-facett).
  function readAvailableCountries() {
    const heads = [...document.querySelectorAll("div,span,h3,p,label")];
    const head = heads.find((e) => {
      const t = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(" ").trim();
      return SHIP_HEAD_RE.test(t);
    });
    if (!head) return { found: false, eu: [], all: [] };
    // Klättra till en container som faktiskt rymmer landsraderna.
    let box = head.parentElement;
    for (let i = 0; i < 4 && box; i++) {
      if (box.querySelectorAll("label,li,a").length > 3) break;
      box = box.parentElement;
    }
    if (!box) return { found: false, eu: [], all: [] };
    const all = [];
    const seen = new Set();
    for (const row of box.querySelectorAll("label,li,a")) {
      const t = (row.textContent || "").trim();
      if (!t || t.length > 26 || /^all$/i.test(t)) continue;
      const iso = NAME_TO_ISO[t.toUpperCase()];
      if (!iso || seen.has(iso)) continue;
      seen.add(iso);
      all.push(iso);
    }
    return { found: all.length > 0, eu: all.filter((c) => EU_CODES.has(c)), all };
  }

  function preferredEu(available) {
    for (const c of EU_PRIORITY) if (available.includes(c)) return c;
    return available[0] || "";
  }

  // ======================================================================
  //  EU-filter-logik
  // ======================================================================
  function maybeAutoApplyEu() {
    if (!euOnly || tabDisabled()) return;
    const active = activeShipFrom();
    if (active) {
      // Redan ett land valt — låt det stå (även om icke-EU: respektera explicit val,
      // banneret varnar istället). Markera att vi inte ska auto-redirecta igen.
      setAutoApplied(true);
      return;
    }
    if (autoApplied()) return; // användaren rensade filtret medvetet i denna flik

    // Inget land valt → vänta in sidofältet och applicera bästa EU-land.
    let tries = 0;
    const tick = () => {
      if (!euOnly || tabDisabled() || activeShipFrom() || autoApplied()) return;
      const avail = readAvailableCountries();
      if (avail.found) {
        if (avail.eu.length) {
          setAutoApplied(true);
          location.replace(urlWithShipFrom(preferredEu(avail.eu)));
        } else {
          // Sökningen saknar EU-lager — visa info, ingen redirect.
          setAutoApplied(true);
          renderBanner();
        }
        return;
      }
      if (++tries < 12) setTimeout(tick, 450); // ~5,4 s
      else renderBanner(); // sidofältet kom aldrig; visa banner ändå
    };
    tick();
  }

  // ======================================================================
  //  Banner
  // ======================================================================
  let bannerEl = null;
  function renderBanner() {
    const existing = document.getElementById("fp-banner");
    if (!euOnly || tabDisabled()) {
      if (existing) existing.remove();
      bannerEl = null;
      return;
    }
    const active = activeShipFrom();
    const avail = readAvailableCountries();
    // Visa de EU-länder vi känner till för sökningen; om listan inte hittats men
    // ett land redan är aktivt, visa åtminstone det.
    let euList = avail.eu.slice();
    if (active && EU_CODES.has(active) && !euList.includes(active)) euList.unshift(active);

    const bar = existing || document.createElement("div");
    bar.id = "fp-banner";
    bar.className = "fp-banner";
    bar.textContent = "";

    const title = el("span", "fp-banner__title");
    title.append(el("span", "fp-banner__flag", "🇪🇺"), document.createTextNode("EU-lager-läge"));
    bar.append(title);

    // "Alla EU (en sida)" — sammanslagen vy via server-API:t. Visar produkter
    // från ALLA EU-lager i en lista (kringgår AE-söksidans en-land-i-taget-gräns).
    const allEu = el("button", "fp-chip fp-chip--alleu", "🇪🇺 Alla EU (en sida)");
    allEu.title = "Visa produkter från ALLA EU-lager i en enda lista (via Fyndplats-API:t)";
    allEu.onclick = openEuPanel;
    bar.append(allEu);

    if (active && !EU_CODES.has(active)) {
      // Explicit icke-EU-val medan EU-läge är på.
      bar.append(el("span", "fp-banner__msg", `Du visar ett icke-EU-lager (${active}).`));
      const fix = el("button", "fp-chip fp-chip--active", "Byt till EU-lager");
      fix.onclick = () => {
        const c = preferredEu(avail.eu) || "ES";
        location.assign(urlWithShipFrom(c));
      };
      bar.append(fix);
    } else if (euList.length) {
      bar.append(el("span", "fp-banner__msg", "Visar bara produkter från:"));
      for (const code of euList) {
        const chip = el("button", "fp-chip" + (code === active ? " fp-chip--active" : ""));
        chip.append(document.createTextNode(`${FLAG[code] || ""} ${ISO_TO_NAME[code] || code}`));
        chip.title = `Visa endast produkter som skickas från ${ISO_TO_NAME[code] || code}`;
        chip.onclick = () => location.assign(urlWithShipFrom(code));
        bar.append(chip);
      }
      if (!active) {
        bar.append(el("span", "fp-banner__msg", "— välj ett EU-land ovan."));
      }
    } else {
      bar.append(el("span", "fp-banner__msg", "Inga EU-lager hittades för denna sökning. Prova en annan sökterm eller kategori."));
    }

    bar.append(el("span", "fp-banner__spacer"));

    if (!isSortedByOrders() && euList.length) {
      const sortBtn = el("button", "fp-btn-text", "Sortera: Mest sålda");
      sortBtn.onclick = () => location.assign(urlWithSort());
      bar.append(sortBtn);
    }
    const offTab = el("button", "fp-btn-text", "Stäng av på denna flik");
    offTab.onclick = () => {
      setTabDisabled(true);
      if (activeShipFrom()) location.assign(urlWithShipFrom(""));
      else renderBanner();
    };
    bar.append(offTab);

    if (!existing) document.body.insertBefore(bar, document.body.firstChild);
    bannerEl = bar;
  }

  // ======================================================================
  //  "Alla EU" — sammanslagen vy via server-API:t (alla EU-länder, en sida)
  // ======================================================================
  // AE:s egen söksida filtrerar bara ETT ship-from-land i taget. Den här vyn går
  // i stället via Fyndplats-API:t (/api/aliexpress/discover → AliExpress
  // ds.text.search) som filtrerar EU-lager över ALLA länder och returnerar en
  // enda lista. Samma bulk-import-pipeline (öppnar AE-sidan, skrapar, importerar)
  // återanvänds via det delade `selected`-urvalet.
  let euPanel = null; // { query, sortBy, page, results:[], loading, error, done }

  function bgMessage(payload) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(payload, (res) => {
          if (chrome.runtime.lastError) return resolve(null);
          resolve(res);
        });
      } catch (_) {
        resolve(null);
      }
    });
  }

  // Plockar sökordet ur sidan: sökrutan → ?SearchText= → /w|af/<query>.html.
  function currentSearchQuery() {
    const input = document.querySelector(
      'input#search-words, input[name="SearchText"], input[type="search"]',
    );
    if (input && input.value && input.value.trim()) return input.value.trim();
    try {
      const u = new URL(location.href);
      const st = u.searchParams.get("SearchText");
      if (st) return st.trim();
      const m = u.pathname.match(/\/(?:w|af)\/(?:wholesale-)?([^/]+?)\.html/i);
      if (m) return decodeURIComponent(m[1]).replace(/[-+]/g, " ").trim();
    } catch (_) {}
    return "";
  }

  const EU_SORTS = [
    ["orders,desc", "Mest sålda"],
    ["price,asc", "Pris: lågt → högt"],
    ["price,desc", "Pris: högt → lågt"],
    ["evaluate,desc", "Högst betyg"],
  ];
  const EU_PAGE_SIZE = 30; // måste matcha pageSize i background.js DISCOVER_EU

  function openEuPanel() {
    const query = currentSearchQuery();
    if (!query) {
      toast("Hittade ingen sökterm på sidan — sök efter något först.", "err");
      return;
    }
    euPanel = { query, sortBy: "orders,desc", page: 0, results: [], loading: false, error: "", done: false };
    renderBulkBar(); // göm den globala bulk-baren medan panelen är öppen
    renderEuPanel();
    loadEuPage(1);
  }

  function closeEuPanel() {
    euPanel = null;
    const b = document.getElementById("fp-eupanel-backdrop");
    if (b) b.remove();
    renderBulkBar(); // återställ bulk-baren (speglar ev. kvarvarande urval)
  }

  async function loadEuPage(page) {
    if (!euPanel || euPanel.loading) return;
    euPanel.loading = true;
    euPanel.error = "";
    renderEuPanel();
    const res = await bgMessage({ type: "DISCOVER_EU", query: euPanel.query, sortBy: euPanel.sortBy, page });
    if (!euPanel) return; // panelen stängdes under tiden
    euPanel.loading = false;
    if (!res || !res.ok || !res.data || res.data.ok === false) {
      euPanel.error =
        (res && (res.error || (res.data && res.data.error))) ||
        "Sökningen misslyckades. Appen kanske saknar AliExpress sök-permission — använd " +
          "annars per-land-filtret ovan, eller klistra in en produkt-URL i popupen.";
      renderEuPanel();
      return;
    }
    const batch = Array.isArray(res.data.results) ? res.data.results : [];
    euPanel.page = page;
    euPanel.results = page <= 1 ? batch : euPanel.results.concat(batch);
    euPanel.done = batch.length < EU_PAGE_SIZE;
    renderEuPanel();
  }

  // Resultat från API:t → bulk-import-item ({id,url,title,thumb}). URL:en pekar
  // på AE-produktsidan så samma skrap-/import-pipeline som vanligt körs.
  function euItemFromResult(p) {
    const id = String(p.productId || "");
    const url = p.productUrl || `https://www.aliexpress.com/item/${encodeURIComponent(id)}.html`;
    return { id, url, title: (p.title || "").slice(0, 80), thumb: p.imageUrl || "" };
  }

  function renderEuPanel() {
    if (!euPanel) return;
    let back = document.getElementById("fp-eupanel-backdrop");
    if (!back) {
      back = document.createElement("div");
      back.id = "fp-eupanel-backdrop";
      back.className = "fp-eupanel-backdrop";
      back.addEventListener("click", (e) => {
        if (e.target === back) closeEuPanel();
      });
      document.body.appendChild(back);
    }
    back.innerHTML = "";
    const panel = el("div", "fp-eupanel");

    // Header: titel + sortering + stäng
    const head = el("div", "fp-eupanel__head");
    const h = el("div", "fp-eupanel__title");
    h.append(el("span", null, "🇪🇺 Alla EU-lager"), el("span", "fp-eupanel__q", `"${euPanel.query}"`));
    head.append(h);
    const sortSel = document.createElement("select");
    sortSel.className = "fp-eupanel__sort";
    for (const [v, label] of EU_SORTS) {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = label;
      if (v === euPanel.sortBy) o.selected = true;
      sortSel.append(o);
    }
    sortSel.onchange = () => {
      euPanel.sortBy = sortSel.value;
      euPanel.results = [];
      euPanel.page = 0;
      euPanel.done = false;
      loadEuPage(1);
    };
    head.append(sortSel);
    const close = el("button", "fp-eupanel__close", "✕");
    close.title = "Stäng";
    close.onclick = closeEuPanel;
    head.append(close);
    panel.append(head);

    panel.append(
      el(
        "div",
        "fp-eupanel__sub",
        euPanel.error
          ? ""
          : `${euPanel.results.length} EU-lager-produkter${euPanel.done ? "" : "+"} · markera och importera`,
      ),
    );

    // Body
    if (euPanel.error) {
      panel.append(el("div", "fp-eupanel__error", euPanel.error));
    } else if (euPanel.results.length === 0 && euPanel.loading) {
      panel.append(el("div", "fp-eupanel__empty", "Söker…"));
    } else if (euPanel.results.length === 0) {
      panel.append(el("div", "fp-eupanel__empty", "Inga EU-lager-produkter för denna sökterm."));
    } else {
      const grid = el("div", "fp-eupanel__grid");
      for (const p of euPanel.results) grid.append(renderEuCard(p));
      panel.append(grid);
    }

    // Footer: visa fler + importera valda
    const foot = el("div", "fp-eupanel__foot");
    if (!euPanel.error && euPanel.results.length > 0 && !euPanel.done) {
      const more = el("button", "fp-btn-text", euPanel.loading ? "Hämtar…" : "Visa fler");
      more.disabled = euPanel.loading;
      more.onclick = () => loadEuPage(euPanel.page + 1);
      foot.append(more);
    }
    foot.append(el("span", "fp-eupanel__spacer"));
    const importBtn = el("button", "fp-eupanel__import", `Importera valda (${selected.size})`);
    importBtn.disabled = selected.size === 0;
    importBtn.onclick = () => {
      if (selected.size) startBulkImport([...selected.values()]);
    };
    foot.append(importBtn);
    panel.append(foot);

    back.append(panel);
  }

  function renderEuCard(p) {
    const info = euItemFromResult(p);
    const card = el("div", "fp-eucard");
    if (selected.has(info.id)) card.classList.add("fp-eucard--sel");

    const imgWrap = el("div", "fp-eucard__imgwrap");
    if (info.thumb) {
      const img = document.createElement("img");
      img.src = info.thumb;
      img.alt = "";
      imgWrap.append(img);
    }
    const codes = p.shipsFromCountries || [];
    const cls = p.warehouseClass || (codes.some((c) => EU_CODES.has(c)) ? "EU" : "UNKNOWN");
    const badgeText =
      cls === "EU"
        ? `🇪🇺 ${codes.join(", ") || "EU"}`
        : cls === "MIXED"
          ? `🇪🇺 Delvis (${codes.join(", ")})`
          : codes.length
            ? codes.join(", ")
            : "okänt lager";
    imgWrap.append(el("span", "fp-eucard__badge" + (cls === "EU" ? " fp-eucard__badge--eu" : ""), badgeText));
    card.append(imgWrap);

    // Titel som klickbar länk → öppnar produkten på AliExpress i ny flik.
    const titleLink = document.createElement("a");
    titleLink.className = "fp-eucard__title";
    titleLink.href = info.url;
    titleLink.target = "_blank";
    titleLink.rel = "noopener";
    titleLink.textContent = info.title || "(utan titel)";
    titleLink.title = info.title || "";
    card.append(titleLink);

    // Pris (USD) + ev. ordinariepris (överstruket) + rabatt.
    const priceRow = el("div", "fp-eucard__price");
    priceRow.append(
      el(
        "span",
        "fp-eucard__price-now",
        p.priceUsd !== undefined ? `$${Number(p.priceUsd).toFixed(2)}` : "—",
      ),
    );
    if (p.originalPriceUsd !== undefined && p.originalPriceUsd > (p.priceUsd ?? 0)) {
      priceRow.append(
        el("span", "fp-eucard__price-was", `$${Number(p.originalPriceUsd).toFixed(2)}`),
      );
    }
    if (p.discountPct) {
      priceRow.append(el("span", "fp-eucard__price-off", `-${Math.round(Number(p.discountPct))}%`));
    }
    card.append(priceRow);

    // Meta: betyg + antal sålda (visas bara när data finns).
    const meta = el("div", "fp-eucard__meta");
    if (p.rating !== undefined) {
      meta.append(el("span", "fp-eucard__rating", `★ ${Number(p.rating).toFixed(1)}`));
    }
    if (p.orders !== undefined) {
      meta.append(
        el("span", "fp-eucard__orders", `${Number(p.orders).toLocaleString("sv-SE")} sålda`),
      );
    }
    if (meta.childNodes.length) card.append(meta);

    const actions = el("div", "fp-eucard__actions");
    const sel = el("button", "fp-eucard__sel", selected.has(info.id) ? "✓ Vald" : "Markera");
    sel.onclick = () => {
      if (selected.has(info.id)) selected.delete(info.id);
      else selected.set(info.id, info);
      renderEuPanel();
    };
    const open = document.createElement("a");
    open.className = "fp-eucard__open";
    open.href = info.url;
    open.target = "_blank";
    open.rel = "noopener";
    open.textContent = "Öppna ↗";
    open.title = "Öppna produkten på AliExpress i ny flik";
    const imp = el("button", "fp-eucard__imp", "Importera");
    imp.title = "Importera bara denna nu";
    imp.onclick = () => startBulkImport([info]);
    actions.append(sel, open, imp);
    card.append(actions);
    return card;
  }

  // ======================================================================
  //  Kort-dekorering (kryssruta + import-knapp)
  // ======================================================================
  const CHECK_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" fill="#fff"/></svg>';

  function cardInfo(link) {
    const m = (link.getAttribute("href") || "").match(/\/item\/(\d+)\.html/);
    if (!m) return null;
    const id = m[1];
    let url = link.href;
    try {
      url = new URL(link.href).origin + new URL(link.href).pathname; // strippa query/tracking
    } catch (_) {}
    const img = link.querySelector("img");
    const thumb = img ? img.src || img.getAttribute("data-src") || "" : "";
    const titleEl = link.querySelector('[class*="title"], h1, h3');
    const title = ((titleEl && titleEl.textContent) || link.title || link.textContent || "")
      .trim()
      .slice(0, 80);
    return { id, url, title, thumb };
  }

  // Skopa kort-dekoreringen till AliExpress sökresultats-kort så vi inte
  // dekorerar footer-/rekommendationslänkar (som också pekar på /item/…).
  // Verifierade container-klasser (sök-/kategorisida, 2026-06): se nedan.
  const CARD_SCOPE = [
    '.search-item-card-wrapper-gallery a[href*="/item/"]',
    '.search-card-item a[href*="/item/"]',
    '.card-out-wrapper a[href*="/item/"]',
  ].join(", ");

  function decorateCards() {
    // Fallback till bred selektor om AliExpress bytt klassnamn — hellre dekorera
    // brett än att tappa funktionen helt (cardInfo filtrerar ändå på /item/<id>.html).
    let links = document.querySelectorAll(CARD_SCOPE);
    if (links.length === 0) links = document.querySelectorAll('a[href*="/item/"]');
    for (const link of links) {
      // Container att dekorera: kort-wrappern (en div, ej <a>) så våra kontroller
      // inte ärver kortets klick. Faller tillbaka uppåt om wrappern är en länk.
      let wrap = link.closest(".card-out-wrapper");
      if (!wrap) {
        wrap = link.parentElement;
        while (wrap && wrap.tagName === "A") wrap = wrap.parentElement;
      }
      if (!wrap || processed.has(wrap)) continue;
      const info = cardInfo(link);
      if (!info) continue;
      processed.add(wrap);
      wrap.classList.add("fp-card-wrap");
      if (getComputedStyle(wrap).position === "static") wrap.style.position = "relative";
      wrap.dataset.fpId = info.id;

      // Kryssruta
      const tag = document.createElement("div");
      tag.className = "fp-card-tag";
      tag.innerHTML = CHECK_SVG;
      tag.title = "Markera för bulk-import";
      const stop = (e) => {
        e.preventDefault();
        e.stopPropagation();
      };
      tag.addEventListener("click", (e) => {
        stop(e);
        toggleSelect(info, wrap, tag);
      });
      wrap.appendChild(tag);

      // Snabb-import-knapp (en produkt)
      const imp = document.createElement("button");
      imp.className = "fp-card-import";
      imp.textContent = "Importera";
      imp.title = "Importera bara denna produkt nu";
      imp.addEventListener("click", (e) => {
        stop(e);
        startBulkImport([info]);
      });
      wrap.appendChild(imp);

      // Återställ markerings-state vid om-dekorering
      if (selected.has(info.id)) {
        wrap.classList.add("fp-selected");
        tag.classList.add("fp-checked");
      }
    }
  }

  function toggleSelect(info, wrap, tag) {
    if (selected.has(info.id)) {
      selected.delete(info.id);
      wrap.classList.remove("fp-selected");
      tag.classList.remove("fp-checked");
    } else {
      selected.set(info.id, info);
      wrap.classList.add("fp-selected");
      tag.classList.add("fp-checked");
    }
    renderBulkBar();
  }

  function clearSelection() {
    selected.clear();
    for (const w of document.querySelectorAll(".fp-card-wrap.fp-selected")) {
      w.classList.remove("fp-selected");
      const t = w.querySelector(".fp-card-tag");
      if (t) t.classList.remove("fp-checked");
    }
    renderBulkBar();
  }

  // ======================================================================
  //  Sticky bottom-bar
  // ======================================================================
  function renderBulkBar() {
    // Medan "Alla EU"-panelen är öppen sköter dess egen footer importen — göm
    // den globala bulk-baren så de inte överlappar.
    if (euPanel) {
      const open = document.getElementById("fp-bulkbar");
      if (open) open.remove();
      return;
    }
    let bar = document.getElementById("fp-bulkbar");
    if (selected.size === 0) {
      if (bar) bar.remove();
      return;
    }
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "fp-bulkbar";
      bar.className = "fp-bulkbar";
      document.body.appendChild(bar);
    }
    bar.textContent = "";
    bar.append(el("span", "fp-bulkbar__count", `${selected.size} ${selected.size === 1 ? "produkt" : "produkter"} valda`));

    const items = [...selected.values()];
    const thumbs = el("span", "fp-bulkbar__thumbs");
    for (const it of items.slice(0, 5)) {
      if (!it.thumb) continue;
      const img = document.createElement("img");
      img.src = it.thumb;
      img.alt = "";
      thumbs.append(img);
    }
    bar.append(thumbs);
    if (items.length > 5) bar.append(el("span", "fp-bulkbar__more", `+${items.length - 5}`));

    const go = el("button", "fp-bulkbar__btn", `Importera alla valda (${selected.size})`);
    go.onclick = () => startBulkImport([...selected.values()]);
    bar.append(go);

    const clr = el("button", "fp-btn-text fp-bulkbar__clear", "Rensa val");
    clr.onclick = clearSelection;
    bar.append(clr);
  }

  // ======================================================================
  //  Bulk-import-flöde (background gör jobbet, vi visar progress)
  // ======================================================================
  let modalState = null; // { items:[], states:{id->{state,error,wixId}} }

  function startBulkImport(items) {
    if (bulkInProgress) {
      toast("En import pågår redan — vänta tills den är klar.", "err");
      return;
    }
    if (!items.length) return;
    bulkInProgress = true;
    modalState = { items: items.slice(), states: {} };
    for (const it of items) modalState.states[it.id] = { state: "pending" };
    renderModal();
    // Background ackar direkt att kön startat. Löpande status kommer via
    // BULK_PROGRESS och slutresultatet via BULK_DONE (flik-meddelanden) — vi
    // förlitar oss INTE på att detta svars-callback överlever hela jobbet, då
    // MV3-service-workern kan pausas under en flerminuters import.
    chrome.runtime.sendMessage(
      { type: "BULK_IMPORT", items: items.map((i) => ({ id: i.id, url: i.url, title: i.title, thumb: i.thumb })), featureFlags },
      (ack) => {
        if (chrome.runtime.lastError || !ack || !ack.ok) {
          bulkInProgress = false;
          toast(
            "Bulk-import kunde inte startas: " +
              (chrome.runtime.lastError?.message || (ack && ack.error) || "okänt fel"),
            "err",
          );
          renderModal();
        }
      },
    );
  }

  function applyProgress(p) {
    if (!modalState) return;
    if (p.id && modalState.states[p.id]) {
      modalState.states[p.id] = { state: p.state, error: p.error, wixId: p.wixProductId };
    }
    renderModal(p);
  }

  function renderModal(progress) {
    let back = document.getElementById("fp-modal-backdrop");
    if (!back) {
      back = document.createElement("div");
      back.id = "fp-modal-backdrop";
      back.className = "fp-modal-backdrop";
      document.body.appendChild(back);
    }
    const items = modalState.items;
    const states = modalState.states;
    const done = items.filter((i) => ["done", "fail"].includes(states[i.id]?.state)).length;
    const okCount = items.filter((i) => states[i.id]?.state === "done").length;
    const pct = Math.round((done / items.length) * 100);
    const eta = Math.max(1, Math.ceil((items.length - done) * 0.6)); // ~30–40 s/produkt → minuter

    back.innerHTML = "";
    const modal = el("div", "fp-modal");
    modal.append(el("h2", "fp-modal__title", bulkInProgress ? `Importerar ${items.length} produkter…` : "Import klar"));
    modal.append(
      el(
        "p",
        "fp-modal__sub",
        bulkInProgress
          ? `Varje produkt öppnas, skrapas och skickas till Fyndplats. Det tar ungefär ${eta} min — stäng inte fliken.`
          : `${okCount} av ${items.length} importerade.`,
      ),
    );
    const prog = el("div", "fp-progress");
    const fill = el("div", "fp-progress__fill");
    fill.style.width = pct + "%";
    prog.append(fill);
    modal.append(prog);
    modal.append(el("div", "fp-modal__counter", `${done} av ${items.length} klara`));

    const list = el("ul", "fp-list");
    for (const it of items) {
      const st = states[it.id] || { state: "pending" };
      const li = document.createElement("li");
      if (it.thumb) {
        const img = document.createElement("img");
        img.src = it.thumb;
        img.alt = "";
        li.append(img);
      }
      li.append(el("span", "fp-list__name", it.title || it.id));
      const label = { pending: "Väntar", working: "Skrapar…", done: "✓ Klar", fail: "✗ Misslyckades" }[st.state];
      const cls = { pending: "fp-state-pending", working: "fp-state-working", done: "fp-state-done", fail: "fp-state-fail" }[st.state];
      const stEl = el("span", "fp-list__state " + cls, label);
      if (st.state === "fail" && st.error) stEl.title = st.error;
      li.append(stEl);
      if (st.state === "fail" && !bulkInProgress) {
        const retry = el("button", "fp-retry", "Försök igen");
        retry.onclick = () => startBulkImport([it]);
        li.append(retry);
      }
      list.append(li);
    }
    modal.append(list);

    const actions = el("div", "fp-modal__actions");
    if (!bulkInProgress) {
      if (okCount > 0 && apiBase) {
        const review = el("button", "fp-modal__btn fp-modal__btn--primary", "Granska i kö →");
        review.onclick = () => window.open(apiBase.replace(/\/$/, "") + "/admin/queue", "_blank");
        actions.append(review);
      }
      const close = el("button", "fp-modal__btn fp-modal__btn--ghost", "Stäng");
      close.onclick = () => back.remove();
      actions.append(close);
    }
    modal.append(actions);
    back.append(modal);
  }

  function finishModal(ack) {
    // ack: { results: [{id, ok, wixProductId?, error?}] }
    if (ack && Array.isArray(ack.results) && modalState) {
      for (const r of ack.results) {
        modalState.states[r.id] = {
          state: r.ok ? "done" : "fail",
          error: r.error,
          wixId: r.wixProductId,
        };
      }
    }
    renderModal();
    const okCount = modalState ? Object.values(modalState.states).filter((s) => s.state === "done").length : 0;
    const failCount = modalState ? Object.values(modalState.states).filter((s) => s.state === "fail").length : 0;
    if (okCount && !failCount) {
      toast(`✅ ${okCount} produkter importerade — granska dem på /admin/queue.`, "ok");
      // Avmarkera lyckade så listan inte importeras igen av misstag.
      for (const [id, s] of Object.entries(modalState.states)) if (s.state === "done") selected.delete(id);
      clearSelectionVisual();
      renderBulkBar();
    } else if (okCount && failCount) {
      toast(`${okCount} klara, ${failCount} misslyckades — se modalen för "Försök igen".`, "err");
    } else if (failCount) {
      toast(`Inga importerades (${failCount} misslyckades). Se modalen.`, "err");
    }
    if (euPanel) renderEuPanel(); // uppdatera "Importera valda (N)" + vald-status
  }

  function clearSelectionVisual() {
    for (const w of document.querySelectorAll(".fp-card-wrap.fp-selected")) {
      if (!selected.has(w.dataset.fpId)) {
        w.classList.remove("fp-selected");
        const t = w.querySelector(".fp-card-tag");
        if (t) t.classList.remove("fp-checked");
      }
    }
  }

  // ======================================================================
  //  Toast
  // ======================================================================
  let toastTimer = null;
  function toast(msg, kind) {
    let t = document.getElementById("fp-toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "fp-toast";
      document.body.appendChild(t);
    }
    t.className = "fp-toast" + (kind ? " fp-toast--" + kind : "");
    t.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.remove(), 7000);
  }

  // --- DOM-hjälpare ------------------------------------------------------
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // ======================================================================
  //  Meddelanden från popup + background
  // ======================================================================
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (!msg) return;
    if (msg.type === "EU_MODE_CHANGED") {
      euOnly = !!msg.euOnly;
      if (euOnly) {
        setTabDisabled(false);
        setAutoApplied(false);
        maybeAutoApplyEu();
        renderBanner();
      } else {
        // Stäng av globalt → ta bort filter på denna flik också.
        renderBanner();
        if (activeShipFrom()) location.assign(urlWithShipFrom(""));
      }
      sendResponse && sendResponse({ ok: true });
      return;
    }
    if (msg.type === "BULK_PROGRESS") {
      applyProgress(msg);
      return;
    }
    if (msg.type === "BULK_DONE") {
      bulkInProgress = false;
      finishModal(msg);
      return;
    }
  });

  // ======================================================================
  //  Init
  // ======================================================================
  function refresh() {
    decorateCards();
  }

  function init() {
    chrome.storage.sync.get(["euOnly", "featureFlags", "apiBase"], (cfg) => {
      euOnly = cfg.euOnly === true;
      featureFlags = cfg.featureFlags || null;
      apiBase = cfg.apiBase || "";
      maybeAutoApplyEu();
      renderBanner();
      decorateCards();
    });

    // AliExpress lazy-laddar kort vid scroll/paginering → dekorera nya kort.
    let raf = null;
    const obs = new MutationObserver(() => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        refresh();
      });
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });

    // Banner kan behöva ritas om när sidofältet dyker upp sent.
    let bannerTries = 0;
    const bannerPoll = setInterval(() => {
      if (euOnly && !tabDisabled()) renderBanner();
      if (++bannerTries > 10) clearInterval(bannerPoll);
    }, 800);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
