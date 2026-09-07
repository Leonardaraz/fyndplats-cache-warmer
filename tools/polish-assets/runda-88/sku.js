async () => {
  const SITE = "e6d27e90-4749-4720-9afe-0bbe91c1b3d3";
  const RADER = [{"kort": "b1dcd424", "id": "b1dcd424-da1f-4085-b725-a27ecd3d26bb", "variantId": "fbc34df4-1d77-4b27-833b-c32e9907812d", "sku": "FP-sparkcykel-12-tum-bla"}, {"kort": "41269686", "id": "41269686-2d04-486f-a581-f3e0a40e2eb0", "variantId": "9388e287-aa59-43e8-ba65-76182785038b", "sku": "FP-sparkcykel-12-tum-vinrod"}, {"kort": "82b5a517", "id": "82b5a517-5aff-4f8d-ba11-94b360e2be1b", "variantId": "b678098f-f173-4f26-8419-eeeb7d49024c", "sku": "FP-sparkcykel-12-tum-svart"}, {"kort": "e9cfa7bf", "id": "e9cfa7bf-fdc1-4b48-a8af-c39a5bcaf81f", "variantId": "46772b88-c8fd-4a46-bfa1-ebd39594c56a", "sku": "FP-sparkcykel-30-cm-rod"}, {"kort": "2b8297df", "id": "2b8297df-7f7b-4402-9e1b-37e4c61f09ce", "variantId": "14bf172a-e835-46b3-b1c9-81a17a3452a4", "sku": "FP-sparkcykel-30-cm-bla"}, {"kort": "9941383e", "id": "9941383e-952c-4c95-b3ec-52af738cf215", "variantId": "f71576ee-1d3c-4560-b403-353cf8b8c57b", "sku": "FP-sparkcykel-30-cm-gron"}, {"kort": "e4e5a8ef", "id": "e4e5a8ef-501f-43e0-9cc2-b48437154652", "variantId": "692983b5-433c-49b7-8acc-685589d687b9", "sku": "FP-sparkcykel-16-tum-korg-bla"}, {"kort": "b03784dc", "id": "b03784dc-12cc-41c0-95e5-048dd1f80c71", "variantId": "8cd00f30-564d-4ed3-81f4-c2bc8768f665", "sku": "FP-sparkcykel-16-tum-korg-rosa"}];
  const ut = {};
  for (const r of RADER) {
    const g = await wix.request({ scope: "site", siteId: SITE, method: "GET",
      url: "https://www.wixapis.com/stores/v3/products/" + r.id + "?fields=VARIANT_OPTION_CHOICE_NAMES" });
    const p = g.data.product;
    const vinfo = p.variantsInfo ?? {};
    const varianter = vinfo.variants ?? [];
    // ☠️ Matcha pa wixVariantId. Ett okant id ska INTE skrivas alls.
    if (!varianter.some((v) => v.id === r.variantId)) {
      ut[r.kort] = { GRIND: "OKANT VARIANT-ID", radensIdn: varianter.map((v) => v.id) };
      continue;
    }
    const fore = varianter.map((v) => v.sku ?? null);
    const nya = varianter.map((v) => (v.id === r.variantId ? { ...v, sku: r.sku } : v));
    const w = await wix.request({ scope: "site", siteId: SITE, method: "PATCH",
      url: "https://www.wixapis.com/stores/v3/products/" + r.id,
      body: { product: { revision: p.revision,
                         visible: false,                 // annars PUBLICERAS utkastet
                         options: p.options ?? [],
                         variantsInfo: { ...vinfo, variants: nya } } } });
    const np = w.data.product;
    const nv = np.variantsInfo?.variants ?? [];
    const trafF = nv.find((v) => v.id === r.variantId);
    ut[r.kort] = { fore, efter: nv.map((v) => v.sku ?? null),
                   stammer: (trafF?.sku ?? "") === r.sku,
                   synlig: np.visible, revision: np.revision };
  }
  return ut;
}