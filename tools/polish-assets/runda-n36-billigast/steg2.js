async function () {
  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };

  const PLAN = [
    {
      kort: "46c0fe07",
      pid: "46c0fe07-2912-46ca-8fbe-10d87770ce22",
      poster: [
        { id: "b379ce_9b4b41d0b1b840eeb10512c3015e7f30~mv2.jpg", altText: "Sidobord i C-form med skiva i valnötslook, svart stålram och fyra hjul" },
        { id: "b379ce_b747e60dede9428282723e415545cfc1~mv2.jpg", altText: "Sidobordet vid en säng med en bok och ett glas på skivan" },
        { id: "b379ce_125803cb0c7b4677ad9ad38a5c6340cb~mv2.jpg", altText: "Närbild på skivans hörn med en väckarklocka" },
        { id: "b379ce_76222c76819a48e393efe784f35330b1~mv2.jpg", altText: "Närbild på den nedre hyllan i perforerad metall" },
        { id: "b379ce_f6c32e3d18454b90b186cfc18f6fa359~mv2.jpg", altText: "Måttbild som visar bordet 51 × 36 × 65 cm" },
      ],
      raa: 76106194,
      tecken: 501
    },
    {
      kort: "3bfee58b",
      pid: "3bfee58b-2473-4149-9864-2c223e576565",
      poster: [
        { id: "b379ce_d11137c1a17346099c372f6972ff1552~mv2.jpg", altText: "Svart mopphink på hjul med press och långt handtag" },
        { id: "b379ce_a015d661d88d4dfa8689de1da9b0fe2c~mv2.jpg", altText: "En kvinna moppar golvet i ett vardagsrum med hinken bredvid sig" },
        { id: "b379ce_d4c03f83bff7427fad713e678f993174~mv2.jpg", altText: "Pressen ovanpå hinken sedd uppifrån" },
        { id: "b379ce_74fb60e90baa4ddc8f399de104063df2~mv2.jpg", altText: "Måttbild som visar hinken 60 × 27 × 70,5 cm" },
      ],
      raa: 774232326,
      tecken: 386
    },
    {
      kort: "265b0f61",
      pid: "265b0f61-93f9-4e78-b8e0-d93e994f44e2",
      poster: [
        { id: "b379ce_22e613e4310e4d6a951342eb6480a192~mv2.jpg", altText: "Mörkgrå matta med trianglar av ljusare ränder" },
        { id: "b379ce_12cc79ba499b4a55838825e89d455e06~mv2.jpg", altText: "Mattan framför en ljus soffa i ett vardagsrum" },
        { id: "b379ce_b580da9c29854387b2bf3cd0d7d78362~mv2.jpg", altText: "Mattan vid en säng i ett sovrum" },
        { id: "b379ce_e661d3ff44044d928fe9b2b8db0e83f5~mv2.jpg", altText: "Måttbild som visar mattan 170 × 120 cm framför en soffa" },
      ],
      raa: 158285716,
      tecken: 371
    },
    {
      kort: "69ba5b8b",
      pid: "69ba5b8b-b143-4904-a4cf-406762ad4e10",
      poster: [
        { id: "b379ce_bbbe8a1678504cbfac7beb6a3f150bc1~mv2.jpg", altText: "Staffli för barn i trä med svart krittavla och hylla" },
        { id: "b379ce_101a0fc7fe74415bb2d5fc887f90e4f1~mv2.jpg", altText: "En flicka ritar med krita på staffliet i ett barnrum" },
        { id: "b379ce_c4ba1ec561a949afbd34e6f89d53dbfd~mv2.jpg", altText: "Måttbild som visar staffliet 48,5 × 46,5 × 97 cm och ritytan 32,5 × 43,5 cm" },
      ],
      raa: 7875271,
      tecken: 325
    },
    {
      kort: "2b27c2a4",
      pid: "2b27c2a4-449b-4eb4-91f6-8a9a039ca605",
      poster: [
        { id: "b379ce_73f1f89809a346279ab61adb6c4bd4e8~mv2.jpg", altText: "Grå brödrost för fyra skivor med vågmönster och detaljer i guldfärg" },
        { id: "b379ce_61a08bb5c31d47a38051241261ea9c29~mv2.jpg", altText: "Brödrosten på ett frukostbord med två rostade skivor" },
        { id: "b379ce_0a4d9fefc9ae4a91a03183c7a30301a6~mv2.jpg", altText: "Fyra rostade skivor i brödrosten bredvid kaffe och bär" },
        { id: "b379ce_9ab004b790ba458b9c9df6ffeabe558a~mv2.jpg", altText: "Brödrosten på en köksbänk i trä med fyra skivor" },
        { id: "b379ce_def79e850e004791a291c68e581ca494~mv2.jpg", altText: "Måttbild som visar brödrosten 29,2 × 27,5 × 18,9 cm i ett kök" },
      ],
      raa: 863780299,
      tecken: 525
    },
    {
      kort: "37804a40",
      pid: "37804a40-bc18-4d88-8d4a-83681440edd9",
      poster: [
        { id: "b379ce_97976583f0bf403da4692655f34f1458~mv2.jpg", altText: "Modulgarderob i plast med svarta paneler och vita dörrar med virvelmönster" },
        { id: "b379ce_028646d557ed431984a5e09c45fb963d~mv2.jpg", altText: "Garderoben i ett sovrum bredvid en säng" },
        { id: "b379ce_5757f00a17954d40a8c144824fc662d1~mv2.jpg", altText: "Närbild på de vita kopplingarna mellan dörrarna" },
        { id: "b379ce_40d9351ab66546b8a7e8a04586a216d9~mv2.jpg", altText: "Garderoben öppen med kläder på galgar och vikta textilier på hyllorna" },
        { id: "b379ce_8022d76b9a4e44548d71174cbffd42ad~mv2.jpg", altText: "Måttbild som visar garderoben 111 × 47 × 183 cm" },
      ],
      raa: 19658812,
      tecken: 520
    },
    {
      kort: "6707c9dd",
      pid: "6707c9dd-0970-4d6d-99ed-fdfe59c7761c",
      poster: [
        { id: "b379ce_c0b7ef2c97ea47aa995a733a5b01af63~mv2.jpg", altText: "Blå förvaringshurts för barn med tre lådor i olika nyanser" },
        { id: "b379ce_1245649d3aec44d890d52223fd68c9f8~mv2.jpg", altText: "Ett barn tar leksaker ur den översta lådan" },
        { id: "b379ce_620fbc0440814a8fbfb1cfedc49c514b~mv2.jpg", altText: "Hurtsen i ett barnrum med lådorna utdragna och bollar i den nedersta" },
        { id: "b379ce_acd23871feda45cd92922c86abbddb3f~mv2.jpg", altText: "Hurtsen med öppna lådor fulla av klossar och gosedjur bredvid en bokhylla" },
        { id: "b379ce_916392aaf5004584bc20b479aad3c4b8~mv2.jpg", altText: "Måttbild som visar hurtsen 37 × 37 × 56,5 cm och en låda 33 × 31,5 × 15 cm" },
      ],
      raa: 640367162,
      tecken: 559
    },
    {
      kort: "676e567f",
      pid: "676e567f-e41e-421d-9831-36c436f27ea2",
      poster: [
        { id: "b379ce_a12f43d4b0cd4951a8d804891eb80d57~mv2.jpg", altText: "Mörkgrå brevlåda för vägg med paneler i rostfritt stål och siktfönster" },
        { id: "b379ce_0a5af2decdfc4adea793b34b13ab5916~mv2.jpg", altText: "En kvinna lägger post i brevlådan på en husvägg" },
        { id: "b379ce_ad16a64476e54069bda7638d74e0b326~mv2.jpg", altText: "Brevlådan med locket uppfällt och brev i facket" },
        { id: "b379ce_1c4d8cc1ea4440909c16f7b11bdbc379~mv2.jpg", altText: "En kvinna med post bredvid brevlådan på en husvägg" },
        { id: "b379ce_222b9156448040c1af7d68dd5385da41~mv2.jpg", altText: "Måttbild som visar brevlådan 37 × 10 × 37 cm med locket öppet" },
      ],
      raa: 837434809,
      tecken: 519
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
