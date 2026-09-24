async function () {
  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };

  const PLAN = [
    {
      kort: "81a3065e",
      pid: "81a3065e-df64-4494-8ed4-5641a5ac7d4b",
      poster: [
        { id: "b379ce_848e6fdc20ce4a27976cc540d574aaab~mv2.jpg", altText: "Tre runda väggkrukor i svart stål med växter och stenar" },
        { id: "b379ce_dc50603775ec4c7bbcbf7949607077ee~mv2.jpg", altText: "Krukorna uppsatta på ett vitt plank bland klätterväxter" },
        { id: "b379ce_a84ebe072eee4251a30bc34e5187e209~mv2.jpg", altText: "Närbild på stålringen med växter bakom akrylfronten" },
        { id: "b379ce_352ce979800f4d0fa692f00039f8b934~mv2.jpg", altText: "Närbild på krukans kant och den genomskinliga fronten" },
        { id: "b379ce_84927441e6b746478e01212635bc060d~mv2.jpg", altText: "Måttbild som visar krukorna Ø30,5, Ø20,5 och Ø15,5 cm och djupet 5 cm" },
      ],
      raa: 140763884,
      tecken: 527
    },
    {
      kort: "ff10ccf5",
      pid: "ff10ccf5-8837-43d8-8d33-aa47252a4b3f",
      poster: [
        { id: "b379ce_be3b3e9020da496da3ec910a22309fda~mv2.jpg", altText: "Smalt sidobord med tre plan i svart metall och brun trälook" },
        { id: "b379ce_41cddfa1babc48669b63494140384063~mv2.jpg", altText: "Sidobordet bredvid en soffa, med böcker på mellanhyllan och en filt nederst" },
        { id: "b379ce_1be61d76c2224ad8bdf47d7169e1320a~mv2.jpg", altText: "Sidobordet bredvid en fåtölj med en bordslampa och filtar på hyllorna" },
        { id: "b379ce_76c147acba77410fad0252ae8780989c~mv2.jpg", altText: "Sidobordet vid en fåtölj med böcker och en korg på hyllorna" },
        { id: "b379ce_51d1e1ecc33c45e3bb950eb009b721ab~mv2.jpg", altText: "Måttbild som visar bordet 43 × 18 × 62,5 cm och belastningen 12 kg" },
      ],
      raa: 488427702,
      tecken: 572
    },
    {
      kort: "e118ae32",
      pid: "e118ae32-a429-493b-9b55-27eff563fe9f",
      poster: [
        { id: "b379ce_9783133db2e147eaaf9cf75889a85e52~mv2.jpg", altText: "Blå fågelbogunga med nät, två rep och två åttformade ringar" },
        { id: "b379ce_11af037024f5479fad10c44254e5fda0~mv2.jpg", altText: "Två barn leker med klossar och en bok i gungan på en gräsmatta" },
        { id: "b379ce_2596f3dfd8ab4fae8864f5916f918103~mv2.jpg", altText: "En flicka gungar i fågelbogungan under ett träd" },
        { id: "b379ce_29fb83734c4d44d7b2a9a563977fd0d8~mv2.jpg", altText: "Två barn sitter tillsammans i gungan framför ett hus" },
        { id: "b379ce_aa8c60199669441f88dda622fe91c552~mv2.jpg", altText: "Måttbild som visar gungans diameter 110 cm" },
      ],
      raa: 886761727,
      tecken: 506
    },
    {
      kort: "ae2ac5e5",
      pid: "ae2ac5e5-6506-49b9-aa3a-c634044272f4",
      poster: [
        { id: "b379ce_6e6088ee711b41fc90fc9477088ea2f8~mv2.jpg", altText: "Tredelat gnistskydd i svart metall med välvd mittpanel" },
        { id: "b379ce_363432717fae4e198d34ddc6121a5820~mv2.jpg", altText: "Gnistskyddet framför en öppen spis i ett vardagsrum" },
        { id: "b379ce_4e8eeb7f083d4c06944342e2ba9e036c~mv2.jpg", altText: "Gnistskyddet framför en brasa i en öppen spis" },
        { id: "b379ce_1bd432ce93c8408b9fd112bcb56eeed5~mv2.jpg", altText: "Närbild på nätet i rombmönster och gångjärnet mellan panelerna" },
        { id: "b379ce_a6a8f972cc564a63af20726d015547f7~mv2.jpg", altText: "Måttbild som visar skyddet 96 × 60 cm utfällt och 50 cm hopvikt" },
      ],
      raa: 175688238,
      tecken: 519
    },
    {
      kort: "f1e0a996",
      pid: "f1e0a996-66b8-4386-a846-6d34b7cea24c",
      poster: [
        { id: "b379ce_0bdd42915cc742d28e217cbd85b4c9c7~mv2.jpg", altText: "Gunghäst i trä med zebraränder, handtag och ryggstöd" },
        { id: "b379ce_77921499b84f4923ba04078cb552ff9f~mv2.jpg", altText: "Ett litet barn gungar på gunghästen i ett barnrum" },
        { id: "b379ce_046fb8cee1ce474a94f8512a978ba946~mv2.jpg", altText: "Gunghästen på en matta i ett barnrum med korgar i bakgrunden" },
        { id: "b379ce_a804e2c3107a4c3581936f6651265f84~mv2.jpg", altText: "Närbild på sitsens kant i plywood och de målade ränderna" },
      ],
      raa: 742226588,
      tecken: 412
    },
    {
      kort: "af4409b8",
      pid: "af4409b8-133a-4dda-a2cd-9dec4c26ac25",
      poster: [
        { id: "b379ce_3c9f5b885ffd4eab927aaf2614ff3d2f~mv2.jpg", altText: "Sängbord i naturfärgad trälook med låda, öppet fack och hylla på ryggskivan" },
        { id: "b379ce_efcc8894175244db8f56a7dca994bb0c~mv2.jpg", altText: "Sängbordet bredvid en säng med en klocka och en bild på hyllan" },
        { id: "b379ce_60481dc237a24870824f78f7f9a1718e~mv2.jpg", altText: "Närbild på lådan och bordets sida i trälook" },
        { id: "b379ce_15f2e4f10a9749c991c9be6e55122f6a~mv2.jpg", altText: "Närbild på hyllan på ryggskivan med en klocka och en figur" },
        { id: "b379ce_44498bd611e0484fa9b5269d92bf9ddb~mv2.jpg", altText: "Måttbild som visar sängbordet 40 × 35 × 66 cm" },
      ],
      raa: 639539188,
      tecken: 527
    },
    {
      kort: "9e16bd7c",
      pid: "9e16bd7c-527d-4566-800a-af22bdcc5bf6",
      poster: [
        { id: "b379ce_1a72c490d5bd49109a91410fd25379f3~mv2.jpg", altText: "Basketställ för barn med fiskformad platta, boll, golfbollar, golfklubba och pump" },
        { id: "b379ce_b0429918c0bc455a9bfce6ff4fc2cf16~mv2.jpg", altText: "Ett barn hoppar mot basketkorgen i ett vardagsrum" },
        { id: "b379ce_d4f52773a205481c903ae12ed9493dba~mv2.jpg", altText: "Närbild på den fiskformade plattan och basketkorgen" },
        { id: "b379ce_823a58e750f6473f89a12425ee9e7b12~mv2.jpg", altText: "Närbild på ringen på stången och den färgglada foten" },
        { id: "b379ce_4606608429c44905960c2614806c06dc~mv2.jpg", altText: "Måttbild som visar stället 134–152 cm högt och foten 46 × 51 cm" },
      ],
      raa: 678539120,
      tecken: 540
    },
    {
      kort: "a7bddc08",
      pid: "a7bddc08-1d6a-4c51-bb05-677e3a4286ee",
      poster: [
        { id: "b379ce_9ab0d06e56c044b2b31e2fa6e02f2d32~mv2.jpg", altText: "Sadelpall i svart konstläder på fem hjul" },
        { id: "b379ce_7c65c89276ca45f2af0b632630d9ffb0~mv2.jpg", altText: "En kvinna målar vid ett staffli sittande på sadelpallen" },
        { id: "b379ce_94dcfed2a12e41c196d54e7fe677668f~mv2.jpg", altText: "Sadelpallen vid ett arbetsbord med hårverktyg" },
        { id: "b379ce_08f90b63555d41ef84b4d1f2bbbe17b1~mv2.jpg", altText: "Sadelpallen i en frisersalong bredvid en frisörstol" },
        { id: "b379ce_859c0cab8c7846e8b5e0127d858f41c8~mv2.jpg", altText: "Måttbild som visar sitthöjden 55–71 cm, sitsen 37 × 39 cm och belastningen 120 kg" },
      ],
      raa: 473542890,
      tecken: 516
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
