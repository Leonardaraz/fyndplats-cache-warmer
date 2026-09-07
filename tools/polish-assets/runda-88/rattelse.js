async () => {
  const SITE = "e6d27e90-4749-4720-9afe-0bbe91c1b3d3";
  const RADER = [{"kort": "b1dcd424", "id": "b1dcd424-da1f-4085-b725-a27ecd3d26bb", "slug": "sparkcykel-barn-12-tum-bla", "name": "Sparkcykel barn 12 tum i blått – bakbroms och styre 80–88 cm", "title": "Sparkcykel barn 12 tum, blå | Fyndplats", "meta": "Blå sparkcykel för barn 5–12 år med 12-tumshjul i EVA, handbroms på bakhjulet och styre som ställs 80–88 cm. Maxlast 50 kg.", "huvudord": "sparkcykel barn", "relord": "sparkcykel barn 12 tum blå", "langd": 3392, "hash": 15711412}, {"kort": "41269686", "id": "41269686-2d04-486f-a581-f3e0a40e2eb0", "slug": "sparkcykel-barn-12-tum-vinrod", "name": "Sparkcykel barn 12 tum i vinrött – bakbroms och styre 80–88 cm", "title": "Sparkcykel barn 12 tum, vinröd | Fyndplats", "meta": "Vinröd sparkcykel för barn 5–12 år med 12-tumshjul i EVA, handbroms på bakhjulet och styre som ställs 80–88 cm. Maxlast 50 kg.", "huvudord": "sparkcykel barn", "relord": "sparkcykel barn vinröd", "langd": 3280, "hash": 113414316}, {"kort": "82b5a517", "id": "82b5a517-5aff-4f8d-ba11-94b360e2be1b", "slug": "sparkcykel-barn-12-tum-svart", "name": "Sparkcykel barn 12 tum i svart – bakbroms och styre 80–88 cm", "title": "Sparkcykel barn 12 tum, svart | Fyndplats", "meta": "Svart sparkcykel för barn 5–12 år med 12-tumshjul i EVA, handbroms på bakhjulet och styre som ställs 80–88 cm. Maxlast 50 kg.", "huvudord": "sparkcykel barn", "relord": "sparkcykel barn svart 12 tum", "langd": 3297, "hash": 6552723}, {"kort": "e9cfa7bf", "id": "e9cfa7bf-fdc1-4b48-a8af-c39a5bcaf81f", "slug": "sparkcykel-barn-roda-hjul-30-cm", "name": "Sparkcykel barn 6–12 år, röda hjul – Ø30 cm och bakbroms", "title": "Sparkcykel barn 6–12 år, röda hjul | Fyndplats", "meta": "Sparkcykel för barn 6–12 år och 100–150 cm, med punkteringsfria EVA-hjul på Ø30 cm, röda maghjul, bakbroms och styre 80–88 cm.", "huvudord": "sparkcykel barn", "relord": "sparkcykel barn 6-12 år", "langd": 3353, "hash": 786498146}, {"kort": "2b8297df", "id": "2b8297df-7f7b-4402-9e1b-37e4c61f09ce", "slug": "sparkcykel-barn-bla-hjul-30-cm", "name": "Sparkcykel barn 6–12 år, blå hjul – Ø30 cm och bakbroms", "title": "Sparkcykel barn 6–12 år, blå hjul | Fyndplats", "meta": "Sparkcykel för barn 6–12 år och 100–150 cm, med punkteringsfria EVA-hjul på Ø30 cm, blå maghjul, bakbroms och styre 80–88 cm.", "huvudord": "sparkcykel barn", "relord": "sparkcykel barn blå hjul", "langd": 3320, "hash": 666132366}, {"kort": "9941383e", "id": "9941383e-952c-4c95-b3ec-52af738cf215", "slug": "sparkcykel-barn-grona-hjul-30-cm", "name": "Sparkcykel barn 6–12 år, gröna hjul – Ø30 cm och bakbroms", "title": "Sparkcykel barn 6–12 år, gröna hjul | Fyndplats", "meta": "Sparkcykel för barn 6–12 år och 100–150 cm, med punkteringsfria EVA-hjul på Ø30 cm, gröna maghjul, bakbroms och styre 80–88 cm.", "huvudord": "sparkcykel barn", "relord": "sparkcykel barn gröna hjul", "langd": 3307, "hash": 4239179}, {"kort": "e4e5a8ef", "id": "e4e5a8ef-501f-43e0-9cc2-b48437154652", "slug": "sparkcykel-barn-bla-korg-stankskarmar", "name": "Sparkcykel barn 139 cm med korg och stänkskärmar, blå – 100 kg", "title": "Sparkcykel barn med korg, blå | Fyndplats", "meta": "Blå sparkcykel 139 cm med avtagbar korg, mugghållare, stänkskärmar och broms på båda hjulen. Maxlast 100 kg, kroppslängd 120–170 cm.", "huvudord": "sparkcykel barn", "relord": "sparkcykel med korg", "langd": 4077, "hash": 299942853}, {"kort": "b03784dc", "id": "b03784dc-12cc-41c0-95e5-048dd1f80c71", "slug": "sparkcykel-barn-rosa-korg-stankskarmar", "name": "Sparkcykel barn 139 cm med korg och stänkskärmar, rosa – 100 kg", "title": "Sparkcykel barn med korg, rosa | Fyndplats", "meta": "Rosa sparkcykel 139 cm med avtagbar vit korg, mugghållare, stänkskärmar och broms på båda hjulen. Maxlast 100 kg, kroppslängd 120–170 cm.", "huvudord": "sparkcykel barn", "relord": "sparkcykel barn rosa med korg", "langd": 4059, "hash": 976020823}];
  const BYTEN = [["sparkcykel-barn-16-tum-korg-bla", "sparkcykel-barn-bla-korg-stankskarmar"], ["sparkcykel-barn-16-tum-korg-rosa", "sparkcykel-barn-rosa-korg-stankskarmar"], ["modellen med 16-tumshjul och korg", "modellen med korg och stänkskärmar"], ["mönstrat slitbana", "mönstrad slitbana"]];
  const synlig = (h) => h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const hasha = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.codePointAt(0)) % 1000000007; return h; };
  const ut = {};
  for (const r of RADER) {
    const g = await wix.request({ scope: "site", siteId: SITE, method: "GET",
      url: "https://www.wixapis.com/stores/v3/products/" + r.id + "?fields=PLAIN_DESCRIPTION" });
    const p = g.data.product;
    let html = p.plainDescription ?? "";
    for (const [fran, till] of BYTEN) html = html.split(fran).join(till);
    const s = synlig(html);
    // ☠️ GRINDEN FORE SKRIVNINGEN — en text som inte stammer mot facit skrivs inte.
    if (s.length !== r.langd || hasha(s) !== r.hash) {
      ut[r.kort] = { GRIND: "FALLER", langd: s.length, vantat: r.langd,
                     hash: hasha(s), vantatHash: r.hash };
      continue;
    }
    const w = await wix.request({ scope: "site", siteId: SITE, method: "PATCH",
      url: "https://www.wixapis.com/stores/v3/products/" + r.id,
      body: { product: { revision: p.revision, name: r.name, slug: r.slug,
                         plainDescription: html, visible: false,
        seoData: { tags: [
          { type: "title", children: r.title, custom: false, disabled: false },
          { type: "meta", props: { name: "description", content: r.meta }, custom: false, disabled: false }
        ], settings: { preventAutoRedirect: false, keywords: [
          { term: r.huvudord, isMain: true, origin: "USER" },
          { term: r.relord, isMain: false, origin: "USER" }
        ] } } } } });
    const np = w.data.product;
    ut[r.kort] = { slug: np.slug?.name ?? np.slug, namn: np.name,
                   synlig: np.visible, langd: s.length, revision: np.revision,
                   sokord: (np.seoData?.settings?.keywords ?? []).map((x) => x.term) };
  }
  return ut;
}