// Sifferstilssvepet — läser hela katalogen och rapporterar kommalistor av tal
// med enheten sist. SKRIVER INGENTING. Körs via ExecuteWixAPI.
//
// ☠️ Ankra på listans FORM, inte på "komma mellan siffror". Det blunta
//    mönstret \d+(?:,\d+)?, \d fyrar på skalor (1:300), modellnummer (A60),
//    kapslingsklasser (IP44), brak (1/4, 3/8), packnotation (4-i-1, 2-pack)
//    och lagrum (2020:8, 3 kap.) — 101 traffar mot 53 akta.
async function () {
  const ENHET = "cm|mm|centimeter|millimeter|meter|kg|kilo|gram|liter|W|watt|K|" +
                "grader|timmar|minuter|sekunder|procent|lm|volt|V";
  const TAL = "\\d+(?:,\\d+)?";
  const LISTA = new RegExp(TAL + ", (?:" + TAL + ", )*" + TAL +
                           " (?:och|eller) " + TAL + " (?:" + ENHET + ")\\b");
  // Den varsta varianten: decimalkomma direkt bredvid listkomma ("4,5, 7").
  const FARLIG = /\d+,\d+, \d/;
  const synlig = (h) => (h || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  let cursor = null, sidor = 0, publicerade = 0;
  const rader = [];
  while (sidor < 70) {
    const body = { search: { cursorPaging: { limit: 100 } }, fields: ["PLAIN_DESCRIPTION"] };
    if (cursor) body.search.cursorPaging.cursor = cursor;
    const r = await wix.request({ method: "POST", url: "/stores/v3/products/search", body });
    const prods = r.products || [];
    sidor++;
    for (const p of prods) {
      if (!p.visible) continue;             // utkast nar ingen kund
      publicerade++;
      const ytor = [["namn", p.name || ""], ["seo-titel", p.seoTitle || ""],
                    ["meta", p.seoDescription || ""], ["brodtext", synlig(p.plainDescription)]];
      const tr = [];
      for (const [vad, txt] of ytor) {
        const m = txt.match(LISTA);
        if (m) tr.push({ yta: vad, traff: m[0], farlig: FARLIG.test(m[0]) });
      }
      if (tr.length) rader.push({ id8: p.id.slice(0, 8), slug: p.slug && (p.slug.name || p.slug), tr });
    }
    cursor = r.pagingMetadata?.cursors?.next;
    if (!cursor || !prods.length) break;
  }
  return {
    publicerade,
    medForbjudenLista: rader.length,
    farliga: rader.filter((x) => x.tr.some((t) => t.farlig)),
    ovriga: rader.filter((x) => !x.tr.some((t) => t.farlig)).map((x) => x.id8 + " " + x.slug),
  };
}
