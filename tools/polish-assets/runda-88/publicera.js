async () => {
  const SITE = "e6d27e90-4749-4720-9afe-0bbe91c1b3d3";
  const RADER = [{"kort": "b1dcd424", "id": "b1dcd424-da1f-4085-b725-a27ecd3d26bb", "slug": "sparkcykel-barn-12-tum-bla", "langd": 3392, "hash": 15711412, "sku": "FP-sparkcykel-12-tum-bla"}, {"kort": "41269686", "id": "41269686-2d04-486f-a581-f3e0a40e2eb0", "slug": "sparkcykel-barn-12-tum-vinrod", "langd": 3280, "hash": 113414316, "sku": "FP-sparkcykel-12-tum-vinrod"}, {"kort": "82b5a517", "id": "82b5a517-5aff-4f8d-ba11-94b360e2be1b", "slug": "sparkcykel-barn-12-tum-svart", "langd": 3297, "hash": 6552723, "sku": "FP-sparkcykel-12-tum-svart"}, {"kort": "e9cfa7bf", "id": "e9cfa7bf-fdc1-4b48-a8af-c39a5bcaf81f", "slug": "sparkcykel-barn-roda-hjul-30-cm", "langd": 3353, "hash": 786498146, "sku": "FP-sparkcykel-30-cm-rod"}, {"kort": "2b8297df", "id": "2b8297df-7f7b-4402-9e1b-37e4c61f09ce", "slug": "sparkcykel-barn-bla-hjul-30-cm", "langd": 3320, "hash": 666132366, "sku": "FP-sparkcykel-30-cm-bla"}, {"kort": "9941383e", "id": "9941383e-952c-4c95-b3ec-52af738cf215", "slug": "sparkcykel-barn-grona-hjul-30-cm", "langd": 3307, "hash": 4239179, "sku": "FP-sparkcykel-30-cm-gron"}, {"kort": "e4e5a8ef", "id": "e4e5a8ef-501f-43e0-9cc2-b48437154652", "slug": "sparkcykel-barn-bla-korg-stankskarmar", "langd": 4077, "hash": 299942853, "sku": "FP-sparkcykel-barn-bla-korg"}, {"kort": "b03784dc", "id": "b03784dc-12cc-41c0-95e5-048dd1f80c71", "slug": "sparkcykel-barn-rosa-korg-stankskarmar", "langd": 4059, "hash": 976020823, "sku": "FP-sparkcykel-barn-rosa"}];
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