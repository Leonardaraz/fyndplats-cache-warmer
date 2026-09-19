async () => {
  const SITE = "e6d27e90-4749-4720-9afe-0bbe91c1b3d3";
  const RADER = [{"kort": "c4375606", "id": "c4375606-60f2-4d79-b577-232e4521e335", "variantId": "bb18fb6c-4f70-4caf-85d1-6d1ce3d53771", "sku": "FP-sparkcykel-143-cm-svart"}, {"kort": "79186373", "id": "79186373-24e1-41cd-84ea-e7908c0a851d", "variantId": "bd3585c8-440a-43f1-a2b2-5155848ea21b", "sku": "FP-sparkcykel-143-cm-rosa"}, {"kort": "479e9c2e", "id": "479e9c2e-2fbc-448f-8d44-2f31ad5bedbe", "variantId": "a92d9a34-843b-4e0c-b0c4-0c3e9db64e4d", "sku": "FP-sparkcykel-120-cm-svart"}, {"kort": "d9239c8e", "id": "d9239c8e-dba1-40d4-940f-fb4f9121954f", "variantId": "23467568-f2dd-4be2-9a97-80eaa13d7ea2", "sku": "FP-sparkcykel-120-cm-turkos"}, {"kort": "4fd26086", "id": "4fd26086-5b60-4b27-b2ff-8b3377527cd8", "variantId": "07bdc936-5dfe-4d9b-967d-3aeb4aa67288", "sku": "FP-sparkcykel-framhjul-orange"}, {"kort": "89deaca7", "id": "89deaca7-0619-4693-9573-176dd97952bb", "variantId": "fae53e77-dd1d-4d67-9254-dc273fa0e812", "sku": "FP-sparkcykel-framhjul-turkos"}];
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