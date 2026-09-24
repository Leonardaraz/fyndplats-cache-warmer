async function () {
  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };

  const PLAN = [
    {
      kort: "8a076c08",
      pid: "8a076c08-9287-4f7e-8dab-ed9735d60209",
      poster: [
        { id: "b379ce_c37d0e901a2845df8d328f7cd6d539f8~mv2.jpg", altText: "Två svarta barstolar i konstläder med kanalsydd rygg och stålunderrede" },
        { id: "b379ce_eea731d067ec4853a90c115d625fe51f~mv2.jpg", altText: "Barstolarna vid en köksö, med pilar som visar att sitsen kan snurra" },
        { id: "b379ce_b1bd0584f8264ef2b746ef037b3950ea~mv2.jpg", altText: "En kvinna sitter i en av barstolarna vid en köksö" },
        { id: "b379ce_fb647046e11d45fcb42e9d5954301d7e~mv2.jpg", altText: "Måttbild som visar stolen 47 × 54,5 × 97,5 cm och belastningen 120 kg" },
      ],
      raa: 602499222,
      tecken: 450
    },
    {
      kort: "b28e1cbe",
      pid: "b28e1cbe-fb7f-4866-abfd-5786f34bb596",
      poster: [
        { id: "b379ce_69ecb8ae29274373aaaa4bfad11b2cb9~mv2.jpg", altText: "Rosa barnsoffa med två jordgubbsformade kuddar" },
        { id: "b379ce_cd4efd11288944f1b0972a357bdfccc1~mv2.jpg", altText: "Soffan i ett barnrum bredvid en säng och en hylla med kläder" },
        { id: "b379ce_322f0a954ce04efebeeb7a4f6601eb36~mv2.jpg", altText: "Närbild på en av jordgubbskuddarnas gröna topp" },
        { id: "b379ce_f6df4ed9cff44d58b16b2a5504044c61~mv2.jpg", altText: "Närbild på jordgubbskuddens rosa yta med vita prickar" },
        { id: "b379ce_0009779cb60f40c49415c758915ae98c~mv2.jpg", altText: "Måttbild som visar soffan 90 × 53 × 48 cm och sitsen 62 × 35 cm" },
      ],
      raa: 491091524,
      tecken: 512
    },
    {
      kort: "1bc0c04e",
      pid: "1bc0c04e-4e8d-4daa-9f38-be92490afb0b",
      poster: [
        { id: "b379ce_41eaaf35df244d5d9ca21cc680c70210~mv2.jpg", altText: "Klätterställning i trä med gunga, rutschkana, klätternät och basketkorg" },
        { id: "b379ce_e853412d2c8a416ca317b93af24c8396~mv2.jpg", altText: "En vuxen och ett barn leker vid klätterställningen inomhus" },
        { id: "b379ce_0e528d2249c04630a2d57de556ce4f2a~mv2.jpg", altText: "Närbild på ett barns fötter på klätterramens sparkstöd" },
        { id: "b379ce_27ea512b79574b769875388677abbaad~mv2.jpg", altText: "Måttbild som visar ställningen 140 × 133 × 43 cm hopfälld" },
      ],
      raa: 744086082,
      tecken: 435
    },
    {
      kort: "69513a61",
      pid: "69513a61-9e15-429f-9a28-2d31d2a86a2b",
      poster: [
        { id: "b379ce_1a81ae2f5e5d4aecae45df6bb6a85c66~mv2.jpg", altText: "Svart gungbänk för tre personer med nätklädsel" },
        { id: "b379ce_e145e9c17e564486895b5dae62c3c865~mv2.jpg", altText: "En familj sitter tillsammans i gungbänken på en altan" },
        { id: "b379ce_c411d2d41e2f4be2b294745f05aed96d~mv2.jpg", altText: "Gungbänken med två kuddar, utomhus vid en husvägg" },
        { id: "b379ce_4183e74c831b42dcbb23d9c0825ee925~mv2.jpg", altText: "Måttbild som visar bänken 147 × 70 × 85 cm" },
      ],
      raa: 405185050,
      tecken: 385
    },
    {
      kort: "3847b7ba",
      pid: "3847b7ba-85cc-4c3e-9257-4e159809064d",
      poster: [
        { id: "b379ce_c53c6d2330d94a2fb57e45ba2766946e~mv2.jpg", altText: "Grå tvåsitssoffa med knapptuftad rygg och ram i ljust trä" },
        { id: "b379ce_8ec12053cc0f4b7c9c84db6514fed088~mv2.jpg", altText: "Soffan i ett vardagsrum med en tavla på väggen" },
        { id: "b379ce_898f1d3a555e44d2b94aac5a6e750a54~mv2.jpg", altText: "Närbild på den knapptuftade ryggdynans mönster" },
        { id: "b379ce_ab065bbda72e46d39207724f8c4b065e~mv2.jpg", altText: "Närbild på ett av benen i trä och foten mot golvet" },
        { id: "b379ce_0ac466e9d8474ddf91e20476015e26e1~mv2.jpg", altText: "Måttbild som visar soffan 115 × 66,5 × 73 cm" },
      ],
      raa: 197776925,
      tecken: 487
    },
    {
      kort: "965ba956",
      pid: "965ba956-907e-4cf6-ae37-4bba05db730d",
      poster: [
        { id: "b379ce_7bf714210c904fafac933079524e3a83~mv2.jpg", altText: "Vit elkamin i konsolmodell med blå lågor" },
        { id: "b379ce_809906a1e1de4010a0e1d4428e8a32bf~mv2.jpg", altText: "Kaminen i ett vardagsrum med juldekorationer på hyllan" },
        { id: "b379ce_5520097bd5764b9081378fde474eadea~mv2.jpg", altText: "Kaminen med gröna lågor och ljusstakar ovanpå" },
        { id: "b379ce_f3ef9d77225e4184807bc78857db7d1d~mv2.jpg", altText: "Kaminen med gröna lågor och dekorationer i ett rum" },
        { id: "b379ce_821cfea1ff204ffaa6c510e91263e14f~mv2.jpg", altText: "Måttbild som visar kaminen 62,5 × 20 × 72,5 cm" },
      ],
      raa: 739497741,
      tecken: 479
    },
    {
      kort: "c4d8cb93",
      pid: "c4d8cb93-732d-4ba5-9d37-77bd165e4a53",
      poster: [
        { id: "b379ce_10f4f252b3c44b10b8baeec888d2c0ad~mv2.jpg", altText: "Vitt köksskåp med två skåp och en öppen mellanhylla" },
        { id: "b379ce_7342a5f76d5e4acf854efc66a01d40b5~mv2.jpg", altText: "Skåpet i ett kök med en mikrovågsugn på mellanhyllan" },
        { id: "b379ce_88eb7e32cf454d67a7f2b0973f9cd236~mv2.jpg", altText: "Närbild på ett av de svarta metallhandtagen" },
        { id: "b379ce_9f6af7c1cbc94cf3b9b9337b4f8855a6~mv2.jpg", altText: "Skåpet med dörrarna öppna och kastruller synliga i det nedre skåpet" },
        { id: "b379ce_53d9da810a964f1cbef820aef0e1550a~mv2.jpg", altText: "Måttbild som visar skåpet 70 × 40 × 170 cm" },
      ],
      raa: 498997569,
      tecken: 499
    },
    {
      kort: "093aedd2",
      pid: "093aedd2-bd79-4bfa-8195-18ee97156187",
      poster: [
        { id: "b379ce_4c95d2555cf34db1a12f41d009e429d3~mv2.jpg", altText: "Två spiralformade konstväxter i cypressform med krukor" },
        { id: "b379ce_93a04c83e08e4cff9eabd339173c11d6~mv2.jpg", altText: "Växterna utomhus vid en uteplats med möbler" },
        { id: "b379ce_b132e6c3c7bd409780a61ec8a9fa9b60~mv2.jpg", altText: "Växterna i ett vardagsrum vid ett fönster" },
        { id: "b379ce_fed8d153f0e442d2935b95c807107082~mv2.jpg", altText: "Närbild på de två växterna mot vit bakgrund" },
        { id: "b379ce_8c41a249e63c4775b8971824effbe579~mv2.jpg", altText: "Måttbild som visar växten 120 cm hög och krukan 28 × 22 cm" },
      ],
      raa: 72673032,
      tecken: 483
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
