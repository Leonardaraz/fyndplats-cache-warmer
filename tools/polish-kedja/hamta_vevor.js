// hamta_vevor.js: mall för ett ExecuteWixAPI-anrop som hämtar VEVOR-utkast och deras avläsning till en ny runda (steg 2).
//
// Byt PIDS mot utkastens fulla Wix-id (högst sex per anrop: svaret sparas av verktyget i en fil och blir avkortat vid
// cirka 100 000 tecken, och datadelen måste ligga före `pad`). Har du bara de åtta första tecknen i id:t: lämna PIDS tom
// och lägg dem i ID8, så slår koden upp de fulla id:na i `FyndplatsMappings` (`wixProductId $startsWith`). Skicka koden som
// `code`, med `hasMutations: false`.
//
// Kandidatlistan över alla väntande VEVOR-utkast (1 200 rader 2026-11-04) hämtas med ett annat anrop: `FyndplatsMappings` med
// `supplier $eq vevor` och `draftStatus $eq pending_review` (fältet heter `supplier`, inte `supplierName`; `seoTitle` bär namnet;
// sidor om 100 med `paging: { limit, offset }`). Skriv bara ut de åtta första tecknen och en kort titel.
// Svaret `{ data, ut, fel, pad }` läses av en `ingest`-fil (jfr `ingest9.py` i en poleringssession): `data` är utkasten
// (fullid, name, slug, visible, revision, html, items [{id, alt}], variants [{sku, id, pris, vis, lager}], options, katNamn,
// lager) och `ut` är VEVOR-avläsningen per utkast: namn, punkter, spec, bilder [{url, egen}], status, saldo, borta,
// levererasTillSe, betyg och mappningsradens status.
//
// ☠️ Artikelnumret (`supplierProductId`, `vevorArtiklar`, avläsningens `sku`) och bildadresserna (de bär artikelnumret)
// skrivs aldrig i en fil i repot, i en commit eller i ett svar till Leonard. Bildadresserna hämtas av `ingest` med `curl` till
// scratchpad under egna namn. Modellrader (`Modell`, `Artikel…`) tas bort av `ingest`.
// Svaret paddas med 101 000 tecken så att verktyget sparar det i en fil i stället för att visa det.
async function () {
  let PIDS = [
    "<fullt-wix-id-1>",
    "<fullt-wix-id-2>"
  ];
  const ID8 = [];   // alternativt: ["043939a9", "fdc73e50"] med PIDS = []
  if (!PIDS.length || PIDS[0].indexOf("<") === 0) {
    PIDS = [];
    for (const k8 of ID8) {
      const q = await wix.request({ method: "POST", url: "https://www.wixapis.com/wix-data/v2/items/query", body: { dataCollectionId: "FyndplatsMappings", query: { filter: { wixProductId: { $startsWith: k8 } }, paging: { limit: 2 } } } });
      const rr = (q.data || q).dataItems || [];
      if (rr.length) PIDS.push(String((rr[0].data || {}).wixProductId));
    }
  }
  const data = [];
  const ut = {};
  const fel = [];
  const kmap = {};
  let kres = await wix.request({ method: "POST", url: "https://www.wixapis.com/categories/v1/categories/query", body: { query: { cursorPaging: { limit: 200 } }, treeReference: { appNamespace: "@wix/stores" }, returnNonVisibleCategories: true } });
  let kd = kres.data || kres;
  (kd.categories || []).forEach(function (c) { kmap[c.id] = c.name; });
  let sidor = 1;
  while (kd.pagingMetadata && kd.pagingMetadata.hasNext && kd.pagingMetadata.cursors && kd.pagingMetadata.cursors.next && sidor < 10) {
    kres = await wix.request({ method: "POST", url: "https://www.wixapis.com/categories/v1/categories/query", body: { query: { cursorPaging: { limit: 200, cursor: kd.pagingMetadata.cursors.next } }, treeReference: { appNamespace: "@wix/stores" }, returnNonVisibleCategories: true } });
    kd = kres.data || kres;
    (kd.categories || []).forEach(function (c) { kmap[c.id] = c.name; });
    sidor += 1;
  }
  const inv = await wix.request({ method: "POST", url: "https://www.wixapis.com/stores/v3/inventory-items/query", body: { query: { filter: { productId: { $in: PIDS } }, cursorPaging: { limit: 100 } } } });
  const lager = {};
  ((inv.data || inv).inventoryItems || []).forEach(function (x) {
    const k = String(x.productId);
    lager[k] = (lager[k] || 0) + (x.quantity || 0);
  });
  const mq = await wix.request({ method: "POST", url: "https://www.wixapis.com/wix-data/v2/items/query", body: { dataCollectionId: "FyndplatsMappings", query: { filter: { wixProductId: { $in: PIDS } }, paging: { limit: 20 } } } });
  const mrader = {};
  ((mq.data || mq).dataItems || []).forEach(function (it) {
    const m = it.data || {};
    mrader[String(m.wixProductId)] = m;
  });
  for (const pid of PIDS) {
    const k = pid.slice(0, 8);
    try {
      const r = await wix.request({ method: "GET", url: "https://www.wixapis.com/stores/v3/products/" + pid + "?fields=PLAIN_DESCRIPTION&fields=MEDIA_ITEMS_INFO&fields=DIRECT_CATEGORIES_INFO&fields=VARIANT_OPTION_CHOICE_NAMES" });
      const p = (r.data || r).product;
      const items = (p.media && p.media.itemsInfo && p.media.itemsInfo.items) || [];
      const vs = (p.variantsInfo && p.variantsInfo.variants) || [];
      const catIds = ((p.directCategoriesInfo && p.directCategoriesInfo.categories) || []).map(function (c) { return c.id; });
      const html = typeof p.plainDescription === "string" ? p.plainDescription : "";
      data.push({
        fullid: pid,
        name: p.name,
        slug: typeof p.slug === "string" ? p.slug : (p.slug && p.slug.name) || "",
        visible: p.visible,
        revision: p.revision,
        html: html,
        text: html,
        items: items.map(function (m) {
          const u = (typeof m.image === "string" ? m.image : (m.image && m.image.url)) || "";
          const a = u.indexOf("/media/");
          return { id: a >= 0 ? u.slice(a + 7).split("/")[0] : (m.id || ""), alt: m.altText || "" };
        }),
        variants: vs.map(function (x) {
          const a = x.price && x.price.actualPrice && x.price.actualPrice.amount;
          return { sku: x.sku, id: x.id, pris: a === undefined || a === null ? null : String(a), vis: x.visible, lager: lager[pid] || 0, ch: (x.choices || []).map(function (c) { return c.optionChoiceNames && c.optionChoiceNames.choiceName; }) };
        }),
        options: (p.options || []).map(function (o) { return { n: o.name, v: (o.choicesSettings && o.choicesSettings.choices || []).map(function (c) { return c.name; }) }; }),
        katNamn: catIds.map(function (id) { return kmap[id] || ("OKAND:" + id); }),
        lager: lager[pid] || 0,
        alts_full: items.map(function (m) { return m.altText || ""; })
      });
      const m = mrader[pid] || {};
      const art = String(m.supplierProductId || "").replace(/^vevor:/, "");
      const o = { funnen: false, nArtiklar: (m.vevorArtiklar || []).length, map: { status: m.draftStatus, polish: m.needsAiPolish, gransk: m.vevorGranskning ? "finns" : null, prisLast: m.prisLast } };
      if (art) {
        try {
          const a = await wix.request({ method: "GET", url: "https://www.wixapis.com/wix-data/v2/items/" + encodeURIComponent(art) + "?dataCollectionId=FyndplatsVevorAvlasningar" });
          const x = ((a.data || a).dataItem || {}).data || {};
          o.funnen = !!x.namn;
          o.namn = x.namn;
          o.punkter = x.punkter || [];
          o.spec = x.spec || [];
          o.bilder = (x.bilder || []).map(function (b) { return { url: b.url, egen: !!b.egen }; });
          o.status = x.status;
          o.saldo = x.saldo;
          o.borta = x.borta;
          o.levererasTillSe = x.levererasTillSe;
          o.betyg = x.betyg || null;
          o.kategorier = (x.kategorier || []).map(function (c) { return c.namn || c.name || c; });
        } catch (e) {
          o.avlasningsfel = String(e && e.message || e).slice(0, 120);
        }
      }
      ut[k] = o;
    } catch (e) {
      fel.push(k + ": " + String(e && e.message || e).slice(0, 160));
    }
  }
  return { data: data, ut: ut, fel: fel, pad: "x".repeat(101000) };
}
