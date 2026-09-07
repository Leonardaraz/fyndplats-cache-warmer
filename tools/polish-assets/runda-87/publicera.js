async () => {
  const SITE = "e6d27e90-4749-4720-9afe-0bbe91c1b3d3";
  const RADER = [{"kort": "72051417", "id": "72051417-e179-4f73-9ad8-d25f160cf29c", "slug": "garagetalt-120x179-cm-ljusgra", "langd": 3190, "hash": 673397158, "sku": "FP-garagetalt-120x179-ljusgra"}, {"kort": "a165b178", "id": "a165b178-b8e7-4826-bae5-a137a7e4994c", "slug": "garagetalt-120x179-cm-morkgra", "langd": 3094, "hash": 285765097, "sku": "FP-garagetalt-120x179-morkgra"}, {"kort": "5f6592ad", "id": "5f6592ad-b7e0-4919-b96a-31d84112f073", "slug": "garagetalt-162x222-cm-morkgra", "langd": 3437, "hash": 231208919, "sku": "FP-garagetalt-162x222-morkgra"}, {"kort": "20c0942e", "id": "20c0942e-ed05-476f-8097-12541059e859", "slug": "garagetalt-162x222-cm-ljusgra", "langd": 3111, "hash": 59840300, "sku": "FP-garagetalt-162x222-ljusgra"}, {"kort": "8bdba748", "id": "8bdba748-1286-4e7d-96fe-9616672fc10c", "slug": "cykelgarage-245-cm-brett-bagformat-tak", "langd": 3880, "hash": 693644974, "sku": "FP-cykelgarage-245-bagformat"}, {"kort": "0f5e3fea", "id": "0f5e3fea-08a1-458e-87ad-919e111b75c8", "slug": "garagetalt-190x230-cm-220-cm-hogt", "langd": 3964, "hash": 303867045, "sku": "FP-garagetalt-190x230-hogt"}, {"kort": "6a419d8b", "id": "6a419d8b-c924-4045-8b04-d23911a5f6df", "slug": "garagetalt-300x300-cm-9-kvm", "langd": 3797, "hash": 146451485, "sku": "FP-garagetalt-300x300-cm"}, {"kort": "95a9d7cc", "id": "95a9d7cc-a0cf-4ffc-9cff-f739b71f3157", "slug": "forradstalt-300x447-cm-13-kvm", "langd": 3630, "hash": 301530518, "sku": "FP-forradstalt-300x447-cm"}];
  const synlig = (h) => h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const hasha = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.codePointAt(0)) % 1000000007; return h; };
  const ut = {};
  for (const r of RADER) {
    const g = await wix.request({ scope: "site", siteId: SITE, method: "GET",
      url: "https://www.wixapis.com/stores/v3/products/" + r.id + "?fields=PLAIN_DESCRIPTION" });
    const p = g.data.product;

    // ☠️ GRINDEN LIGGER FORE SKRIVNINGEN. Stammer inte texten mot facit
    //    skrivs ingenting — en felskriven produkt ska inte ga att publicera.
    const s = synlig(p.plainDescription ?? "");
    if (s.length !== r.langd || hasha(s) !== r.hash) {
      ut[r.kort] = { GRIND: "FALLER", langd: s.length, vantat: r.langd,
                     hash: hasha(s), vantatHash: r.hash };
      continue;
    }

    // Hela arrayen ekas ordagrant — en kapad array ger 428
    // MISSING_VARIANT_OPTION_CHOICE.
    const varianter = (p.variantsInfo?.variants ?? []).map((v) => ({ ...v, visible: true }));
    const w = await wix.request({ scope: "site", siteId: SITE, method: "PATCH",
      url: "https://www.wixapis.com/stores/v3/products/" + r.id,
      body: { product: { revision: p.revision, visible: true,
                         variantsInfo: { variants: varianter } },
              fieldMask: { paths: ["visible", "variantsInfo"] } } });

    // Aterlast i ett EGET anrop — svaret pa en skrivning ar inget kvitto.
    const v2 = await wix.request({ scope: "site", siteId: SITE, method: "GET",
      url: "https://www.wixapis.com/stores/v3/products/" + r.id });
    const q = v2.data.product;
    const vs = q.variantsInfo?.variants ?? [];
    ut[r.kort] = {
      status: (q.visible && vs.every((x) => x.visible)) ? "PUBLICERAD" : "EJ SYNLIG",
      slug: typeof q.slug === "string" ? q.slug : (q.slug?.name ?? ""),
      produktSynlig: q.visible, variantSynlig: vs.map((x) => x.visible),
      pris: vs[0]?.price?.actualPrice?.amount ?? null,
      sku: vs[0]?.sku ?? null, skuStammer: (vs[0]?.sku ?? "") === r.sku,
      revision: w.data.product.revision };
  }
  return ut;
}