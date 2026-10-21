async function () {
  // katalogkontroll-spec.js (2026-10-21): publicerade sidor där fliken *Tekniska specifikationer* är ett enda stycke i stället för
  // en lista. Posterna står då hopklistrade (*Effekt: 8 kWSpänning: 12 V …*). Skriver ingenting.
  // Kör via ExecuteWixAPI (en körning, ~30 s). `fields` MÅSTE skickas om på varje sida: med bara markören saknas `plainDescription`
  // på sida två, och svepet undermäter tyst (samma rad, fel facit). `publMedText` måste därför vara lika med `publicerade`.
  // Ett block under rubriken utan `<li>` och med tre eller fler "Etikett: värde"-par räknas som en klump.
  // 2026-10-21: 5 010 sidor med specifikationsflik, 4 525 med lista, 5 klumpar (värmaren `ddda87a3` hade samma form och är rättad).
  const t0 = Date.now();
  const RUBRIK = "<h2>Tekniska specifikationer</h2>";
  let cursor = null;
  let produkter = 0, publ = 0, publMedText = 0, medSpec = 0, specLista = 0;
  const klumpar = [];
  while (true) {
    const search = cursor ? { cursorPaging: { limit: 100, cursor: cursor } } : { cursorPaging: { limit: 100 } };
    const r = await wix.request({ method: "POST", url: "https://www.wixapis.com/stores/v3/products/search", body: { search: search, fields: ["PLAIN_DESCRIPTION"] } });
    const ps = r.data.products || [];
    for (const p of ps) {
      produkter++;
      if (p.visible === false) continue;
      publ++;
      const d = p.plainDescription;
      if (typeof d !== "string" || d.length === 0) continue;
      publMedText++;
      const a = d.indexOf(RUBRIK);
      if (a < 0) continue;
      medSpec++;
      const start = a + RUBRIK.length;
      const nasta = d.indexOf("<h2>", start);
      const block = d.slice(start, nasta < 0 ? d.length : nasta);
      if (block.indexOf("<li>") >= 0) { specLista++; continue; }
      const par = (block.match(/[A-ZÅÄÖ][^:<]{1,40}: /g) || []).length;
      if (par >= 3) klumpar.push({ id: p.id.slice(0, 8), par: par, langd: block.length, borjan: block.replace(/<[^>]+>/g, " ").slice(0, 90) });
    }
    const next = r.data.pagingMetadata && r.data.pagingMetadata.cursors && r.data.pagingMetadata.cursors.next;
    if (!next || ps.length === 0) { cursor = null; break; }
    cursor = next;
    if (Date.now() - t0 > 52000) break;
  }
  return { produkter: produkter, publicerade: publ, publMedText: publMedText, medSpecRubrik: medSpec, specSomLista: specLista, specSomKlump: klumpar.length, klumpar: klumpar.slice(0, 40), markorKvar: cursor !== null, ms: Date.now() - t0 };
}
