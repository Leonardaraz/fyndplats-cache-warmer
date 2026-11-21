async function () {
  // katalogkontroll-alt.js (2026-11-20): hur många produktbilder saknar alt-text i Wix? Räknar synliga (publicerade) och dolda
  // (utkast) produkter var för sig och listar de synliga sidor som har bilder utan alt-text. Skriver ingenting. Kör via
  // ExecuteWixAPI. Leonards fråga 2026-11-20: "hur många bilder har vi på hemsidan som saknar alt-text".
  //
  // `products/search` med `fields: ["MEDIA_ITEMS_INFO"]` ger galleriet med `altText` per bild. `fields` ligger på kroppens
  // toppnivå, `cursorPaging` inuti `search`, utan filter (filter + markör ger 400). Sidstorlek 100. ☠️ En körning hinner ungefär
  // 5 000 produkter på 24 s (gränsen är ~30 s), så svepet över ~18 300 produkter tar fyra körningar: klistra in `cursor` från
  // förra svaret i START_CURSOR och räkna ihop `agg` för hand. `done: true` betyder att katalogen är slut.
  //
  // Räknar bara poster med en bild (`image`), inte video. En tom eller blank `altText` räknas som saknad.
  //
  // ☠️ ALT-TEXT I WIX ÄR INTE DET SIDAN VISAR. Butiken sätter ett reservvärde på galleribilder utan alt-text: produktnamnet, och
  // "– bild N" från bild 2 och framåt (mätt på en sida med fem tomma alt-texter 2026-11-20). Ingen galleribild är alltså utan
  // alt-attribut i HTML:en, men texten är generisk. Miniatyrerna under galleriet har med flit `alt=""`, liksom kategoribrickor,
  // guidekort och underkategorichips bredvid synlig text.
  //
  // Utfall 2026-11-20: 18 292 produkter (7 850 synliga, 10 442 dolda). Synliga: 52 485 bilder, 889 utan alt-text på 153 sidor
  // (102 utan alt-text på varje bild). Dolda: 63 934 bilder, 355 utan alt-text på 71 utkast. Av de 153 sidorna var 144 Aosom,
  // 7 AliExpress och 2 VEVOR; alla stod som polerade (`needsAiPolish: false`), men bara 7 hade rader i någon rundas alt.tsv.
  const START_CURSOR = null;
  const BUDGET_MS = 24000;
  const MAX_LISTA = 150;
  const t0 = Date.now();
  let cursor = START_CURSOR;
  const agg = {
    sidor: 0, synliga: 0, osynliga: 0,
    bilderSynliga: 0, utanAltSynliga: 0, sidorMedBristSynliga: 0, sidorHelaUtanAltSynliga: 0, synligaUtanBilder: 0,
    bilderOsynliga: 0, utanAltOsynliga: 0, sidorMedBristOsynliga: 0,
  };
  const lista = [];
  let done = false;
  while (true) {
    const search = { cursorPaging: { limit: 100 } };
    if (cursor) search.cursorPaging.cursor = cursor;
    const r = await wix.request({
      method: "POST",
      url: "https://www.wixapis.com/stores/v3/products/search",
      body: { search: search, fields: ["MEDIA_ITEMS_INFO"] },
    });
    const prods = r.data.products || [];
    for (const p of prods) {
      agg.sidor++;
      const items = ((p.media && p.media.itemsInfo && p.media.itemsInfo.items) || []).filter(function (m) { return m && m.image; });
      const utan = items.filter(function (m) { return !String(m.altText || "").trim(); }).length;
      if (p.visible === false) {
        agg.osynliga++;
        agg.bilderOsynliga += items.length;
        agg.utanAltOsynliga += utan;
        if (utan > 0) agg.sidorMedBristOsynliga++;
      } else {
        agg.synliga++;
        agg.bilderSynliga += items.length;
        agg.utanAltSynliga += utan;
        if (items.length === 0) agg.synligaUtanBilder++;
        if (utan > 0) {
          agg.sidorMedBristSynliga++;
          if (utan === items.length) agg.sidorHelaUtanAltSynliga++;
          // wix-id8 | antal utan alt | antal bilder | adress
          if (lista.length < MAX_LISTA) lista.push([p.id.slice(0, 8), utan, items.length, String(p.slug || "").slice(0, 40)].join("|"));
        }
      }
    }
    cursor = r.data.pagingMetadata && r.data.pagingMetadata.cursors && r.data.pagingMetadata.cursors.next;
    if (!cursor || prods.length === 0) { done = true; break; }
    if (Date.now() - t0 > BUDGET_MS) break;
  }
  return { agg: agg, lista: lista, cursor: cursor || null, done: done, ms: Date.now() - t0 };
}
