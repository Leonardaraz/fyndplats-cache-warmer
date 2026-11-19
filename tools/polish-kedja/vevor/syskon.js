// syskon.js: ExecuteWixAPI-kod (bara läsning) för syskonkontrollen: för varje varuord i ORD räknas VEVOR-raderna i FyndplatsMappings
// vars `seoTitle` innehåller ordet (`$contains` ignorerar skiftläge), och de åtta första visas som id8|status|titel. Skicka som `code`
// med hasMutations: false. Sökningen görs på det enskilda varuordet och inte på en fras, och på flera stavningar när varan har
// flera (`vevor.md`, AliExpress-tvillingskärmen). Svaret är litet (högst cirka 40 000 tecken för 60 ord).
// Bara de åtta första raderna visas: ett ord som ger fler än åtta (`n` över 8) kan dölja ett syskon längre ned (runda 432: det närmaste syskonet till
// lasernivån låg på rad elva). Läs då ordet en gång till med `paging.limit` 25 eller sök på en smalare fras (till exempel *korslinje*) före urvalet.
async function () {
  const ORD = ["suv", "isbollspress"];
  const ut = {};
  const sok = async function (ord) {
    const r = await wix.request({ method: "POST", url: "https://www.wixapis.com/wix-data/v2/items/query", body: { dataCollectionId: "FyndplatsMappings", returnTotalCount: true, query: { filter: { $and: [{ supplier: { $eq: "vevor" } }, { seoTitle: { $contains: ord } }] }, paging: { limit: 8 }, fields: ["wixProductId", "seoTitle", "draftStatus", "needsAiPolish", "variants"] } } });
    const d = r.data || r;
    return { n: d.pagingMetadata && d.pagingMetadata.total, rader: (d.dataItems || []).map(function (it) { const m = it.data || {}; return String(m.wixProductId).slice(0, 8) + "|" + (m.draftStatus || "") + (m.needsAiPolish ? "" : "|polerad") + "|v" + (m.variants || []).length + "|" + String(m.seoTitle || "").replace(/^VEVOR\s+/i, "").slice(0, 56); }) };
  };
  for (let i = 0; i < ORD.length; i += 6) {
    const del = ORD.slice(i, i + 6);
    const sv = await Promise.all(del.map(function (o) { return sok(o).catch(function (e) { return { fel: String(e && e.message || e).slice(0, 80) }; }); }));
    del.forEach(function (o, j) { ut[o] = sv[j]; });
  }
  return ut;
}
