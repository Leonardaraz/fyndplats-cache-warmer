async function () {
  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };

  const PLAN = [
    {
      kort: "40fb1b24",
      pid: "40fb1b24-d4d6-429c-8cbb-012d38678166",
      poster: [
        { id: "b379ce_91e5ee02179d4131a5a5d39579637894~mv2.jpg", altText: "Svart elkamin för väggmontering med välvd glasfront och ljusa stenar i botten" },
        { id: "b379ce_eb872a0b2ca843328369480179eda949~mv2.jpg", altText: "Kaminen på en vit vägg med tänd låga och orange bakgrundsljus" },
        { id: "b379ce_97c874c5add04256b1e92400c46f8485~mv2.jpg", altText: "Närbild på kaminens kortsida med fyra upplysta lysdiodsfönster" },
        { id: "b379ce_da157820fc544b5f9e5cccb64f2200d0~mv2.jpg", altText: "Närbild på de ljusa stenarna bakom glaset i kaminens botten" },
        { id: "b379ce_3e662b26701c4ec9a23b1469c048f49c~mv2.jpg", altText: "Måttbild som visar kaminen 89,2 × 13,5 × 48 cm" },
      ],
      raa: 881445969,
      tecken: 549
    },
    {
      kort: "c6f8a0f1",
      pid: "c6f8a0f1-b5b6-4b72-9499-abe6b797ba2d",
      poster: [
        { id: "b379ce_ad7a7da3bb0c4fbdbd34dccfcbe93ad6~mv2.jpg", altText: "Tre upplysta renar i vitt och guld med röda rosetter, den största med horn" },
        { id: "b379ce_2b92331d2ee34b2587dfaf177ea3dca2~mv2.jpg", altText: "Renfamiljen tänd i snön framför en entré med en julkrans på dörren" },
        { id: "b379ce_811a74d47f19494e900735ea195b6826~mv2.jpg", altText: "Renarna tända på ett trädäck framför en tegelvägg" },
        { id: "b379ce_7013c96c1e5747e19bc321c4c21f0d98~mv2.jpg", altText: "Måttbild som visar renarna 134, 112 och 70 cm höga" },
      ],
      raa: 805212707,
      tecken: 434
    },
    {
      kort: "8f95113c",
      pid: "8f95113c-33b4-4de1-afc7-44517fffcc3e",
      poster: [
        { id: "b379ce_3f6069cf43624b23b679e9ac7e1fcd1b~mv2.jpg", altText: "Vit madrass med grå kant och en tunn svart list runt ovansidan" },
        { id: "b379ce_7899a81adc70406d8e7b63a4d5460e5f~mv2.jpg", altText: "Madrassen i en säng med beige sänggavel och randiga kuddar" },
        { id: "b379ce_e2387b529f7d4691a9239c406e8822cd~mv2.jpg", altText: "Madrassen i ett ljust sovrum med en pläd över fotänden" },
      ],
      raa: 726827812,
      tecken: 320
    },
    {
      kort: "41b2bc81",
      pid: "41b2bc81-592e-4539-ad28-6983fd25f205",
      poster: [
        { id: "b379ce_60bba72a809540d0ad3e9daf8991e922~mv2.jpg", altText: "Två matstolar i krämfärgad linnelook med böjd rygg och ben i ljust trä" },
        { id: "b379ce_53af0ea15a9f4912a9cd75a2861f5698~mv2.jpg", altText: "Stolarna vid ett matbord i trä på en jutematta" },
        { id: "b379ce_8b1cfc2b112543a298f02a12e47e0ae9~mv2.jpg", altText: "Måttbild som visar stolen 46 × 52 × 76 cm och sitsen 48 cm över golvet" },
      ],
      raa: 509425288,
      tecken: 332
    },
    {
      kort: "6ab7b3b0",
      pid: "6ab7b3b0-f67d-4f31-a2f9-b820c4ad86b6",
      poster: [
        { id: "b379ce_07599821a2a94c019933e3d0506cf8c4~mv2.jpg", altText: "Svart motionscykel med H-formad fot, sadel och uppåtböjt styre" },
        { id: "b379ce_5cd533c537994b7891abd4b4b3f6cf85~mv2.jpg", altText: "En kvinna cyklar på motionscykeln i ett ljust vardagsrum" },
        { id: "b379ce_49758080c0bb4ceba5347a2f979cba00~mv2.jpg", altText: "En man tränar på cykeln i ett gymrum med hantlar på golvet" },
        { id: "b379ce_a1df0b75adf349279f805b8d498788e8~mv2.jpg", altText: "En kvinna cyklar i ett sovrum med stora fönster" },
        { id: "b379ce_ed63d9d792cf43808b67ae7f5296c8b7~mv2.jpg", altText: "Måttbild som visar cykeln 86 × 51 cm i grundyta och 128 cm i höjd" },
      ],
      raa: 689111046,
      tecken: 532
    },
    {
      kort: "b42b4802",
      pid: "b42b4802-508d-4a7e-af8a-d0bc08b49e07",
      poster: [
        { id: "b379ce_a7c2f4778bbe4d83a556d86a4a6dc5d5~mv2.jpg", altText: "Vitt skrivbord med skiva i naturträton, två skåp med dörrar och två öppna fack" },
        { id: "b379ce_f536e420b7e94c76a5f6419108ba031c~mv2.jpg", altText: "Skrivbordet i vinkel med datorskärm, skrivbordslampa och stol" },
        { id: "b379ce_4d51f516b63a4e049161938a1defc69a~mv2.jpg", altText: "Skrivbordet som sminkbord med rund spegel, väskor och flaskor i facken" },
        { id: "b379ce_749ed9c94d2949beab19cd8efabf70f1~mv2.jpg", altText: "Måttbild som visar skivan 100 × 40 cm, höjden 75 cm och benutrymmet 60 cm" },
      ],
      raa: 693257782,
      tecken: 477
    },
    {
      kort: "2808fff3",
      pid: "2808fff3-6d80-43e1-9be4-abecf7c9fe7c",
      poster: [
        { id: "b379ce_3b3f9548c6c741519730cb30539adb35~mv2.jpg", altText: "Rustikt brun tv-bänk med svart stålram och två skjutdörrar med kryssmönster" },
        { id: "b379ce_8cf10002401e483cbf722368b265b8c1~mv2.jpg", altText: "Tv-bänken i ett vardagsrum med tv, böcker och en högtalare i facken" },
        { id: "b379ce_e000109b73ba48d393eb9577d61fdde6~mv2.jpg", altText: "Tv-bänken med båda dörrarna skjutna till mitten" },
        { id: "b379ce_62655e4ee6d247e39b7a83367fa56bfc~mv2.jpg", altText: "Närbild på mittfacket med en receiver och skjutdörrarnas skena" },
        { id: "b379ce_2b24748ee9d04d8e90fe5b040d81e110~mv2.jpg", altText: "Måttbild som visar bänken 120 × 40 × 54 cm och 6 cm över golvet" },
      ],
      raa: 211955632,
      tecken: 558
    },
    {
      kort: "db1d494f",
      pid: "db1d494f-0fc9-444a-b8ad-7e5c91391e6a",
      poster: [
        { id: "b379ce_fb040373e2404a5a99274776b360ce24~mv2.jpg", altText: "Basketkorg med svart ryggskiva, stålring och nät i rött, vitt och blått" },
        { id: "b379ce_b4d3ea0de52c41fcaa46f77c6e153f55~mv2.jpg", altText: "Två spelare under korgen, som sitter på en betongvägg utomhus" },
        { id: "b379ce_7a0d971f3fed41fd85229a37c8d7c900~mv2.jpg", altText: "Fyra spelare i en inomhushall hoppar mot korgen" },
        { id: "b379ce_f7179ca951f547e0a8e5d86e80d054e2~mv2.jpg", altText: "Närbild på ringens fjäderbelastade fäste bakom ryggskivan" },
        { id: "b379ce_ba0bfc95c4da4f7dad6dc2b577f82d50~mv2.jpg", altText: "Måttbild som visar ryggskivan 110 × 75 cm, ringen 45 cm och 23 cm från väggen" },
      ],
      raa: 7111469,
      tecken: 557
    },
  ];

  // ☠️ SPÄRREN LIGGER HÄR, I SAMMA ANROP SOM SKRIVNINGEN, och den avbryter
  // HELA batchen. Facit räknas på `id + "|" + altText` per rad, sammanfogat
  // med radbrytning — alltså BÅDE bildernas ordning och alt-texternas ord.
  const NYCKEL = function (poster) {
    return poster.map(function (p) { return p.id + "|" + p.altText; }).join("\n");
  };
  const avvik = PLAN
    .filter(function (p) { const s = NYCKEL(p.poster); return SUMMA(s) !== p.raa || s.length !== p.tecken; })
    .map(function (p) { const s = NYCKEL(p.poster); return { kort: p.kort, fick: SUMMA(s), vantat: p.raa, tecken: s.length, vantatTecken: p.tecken }; });
  if (avvik.length) return { AVBRUTET: "transkriberingsfel — ingenting skrivet", avvik: avvik };

  const utfall = [];
  for (const p of PLAN) {
    // ⚠️ Revisionen läses i SAMMA anrop — en äldre är inaktuell.
    const f = await wix.request({ method: "GET", url: "/stores/v3/products/" + p.pid });
    // ☠️ Svarets form läses tolerant (#280) — ett svar är ett SVAR, inte en
    // skrivmall. Kroppen som SKICKAS heter alltid `body`.
    const rev = (f.data || f).product.revision;

    // ⚠️ MEDIA SKRIVS ENSAM. `media.main` skickas INTE — den är read-only i
    // V3 och gav en extra omimport av huvudbilden. Hela `itemsInfo.items`
    // ersätts, så listan ÄR produktens bilder efteråt.
    const kropp = {
      product: {
        revision: rev,
        media: { itemsInfo: { items: p.poster } }
      },
      fieldMask: { paths: ["media"] }
    };

    try {
      const r = await wix.request({ method: "PATCH", url: "/stores/v3/products/" + p.pid, body: kropp });
      const prod = (r.data || r).product;
      utfall.push({ kort: p.kort, ok: true, skickade: p.poster.length, revisionEfter: prod.revision });
    } catch (e) {
      utfall.push({ kort: p.kort, ok: false, fel: String(e && e.message || e).slice(0, 300) });
    }
  }

  // ⚠️ PATCH-svaret bär INTE media.itemsInfo i sin projektion — en lyckad
  // skrivning rapporterar 0 bilder (#253). Kvittot är aterlas.js senare.
  const ok = utfall.filter(function (r) { return r.ok; }).length;
  return { rader: utfall, SAMMANFATTNING: ok + " av " + utfall.length + " skrivna" };
}
