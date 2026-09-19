async function () {
  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };

  const PLAN = [
    {
      kort: "bf4298b2",
      pid: "bf4298b2-4e68-487f-831f-90f092cc361b",
      poster: [
        { id: "b379ce_b890591e3ddb4e9fb440e3d3aeca1b49~mv2.jpg", altText: "Fyra skumklossar i grönt, rött, gult och blått uppställda till en bana med tunnel och ramp" },
        { id: "b379ce_4acb3c7732044c778b300486e400643c~mv2.jpg", altText: "Skumklossarna uppställda på en rund matta i ett barnrum med våningssäng" },
        { id: "b379ce_b00509f07a024d9eb8f0dc3c85c1b6d2~mv2.jpg", altText: "Tunnelklossen med halvcylindern staplad ovanpå framför ett skrivbord i ett barnrum" },
        { id: "b379ce_9e8429263a4e45d9b22da327d1159101~mv2.jpg", altText: "Alla fyra klossarna uppställda som en bana på ett fiskbensparkettgolv" },
        { id: "b379ce_0f1b3fbb5c6242e289a28caf0408d1ce~mv2.jpg", altText: "Måttbild som visar tunnelklossen 50 × 50 × 39 cm, halvcylindern 50 × 30 × 28 cm och rampen 50 × 50 × 25 cm" },
      ],
      raa: 53194234,
      tecken: 662
    },
    {
      kort: "e903f29c",
      pid: "e903f29c-7d9d-45c3-86c8-9373210bed5f",
      poster: [
        { id: "b379ce_8d4484e235c747ffac54f297cdc8def8~mv2.jpg", altText: "Ljusbrun åkhäst i plysch med mörkbrun man, brun sadel och fyra hjul" },
        { id: "b379ce_17ba547725f24be19a1b24d1ee39c3cc~mv2.jpg", altText: "Ett barn sitter på åkhästen på en uppfart framför ett hus med blomkrukor" },
        { id: "b379ce_e3a30a8031534529b8c179a899619b22~mv2.jpg", altText: "Åkhästen står på ett trägolv framför en vägg med bågformade paneler" },
      ],
      raa: 936054995,
      tecken: 352
    },
    {
      kort: "a93e2e5a",
      pid: "a93e2e5a-c54d-4998-ad3d-2c2a3d82ff23",
      poster: [
        { id: "b379ce_7a45120fc1b44e60b380334e6367c910~mv2.jpg", altText: "Grå gnagarbur i metall med fyra plan, ramper, hängmatta och hjul" },
        { id: "b379ce_917ba81d9ac247a29d7cee2cf64c2aa1~mv2.jpg", altText: "Två chinchillor i gnagarburen som står i ett vardagsrum vid ett fönster" },
        { id: "b379ce_b0ec400f359745e198b889f4a85f2220~mv2.jpg", altText: "Närbild på hakspärren som håller en av burens dörrar stängd" },
        { id: "b379ce_ca654f8342774874abe137e7cd735b83~mv2.jpg", altText: "Gnagarburen på en veranda med två chinchillor, hängmatta och gnagleksaker" },
        { id: "b379ce_2e2d45c6b8634218bd06c08643fcbdaa~mv2.jpg", altText: "Måttbild som visar burens mått 80 × 52 × 128 cm, sidodörrarna 51,5 × 48,5 cm och maskavståndet 2,5 cm" },
      ],
      raa: 955008218,
      tecken: 612
    },
    {
      kort: "37f968fe",
      pid: "37f968fe-0a10-4361-b6b3-b5f3a7700c23",
      poster: [
        { id: "b379ce_3312664152de431c91e074c5273c66f6~mv2.jpg", altText: "Barnskrivbordet i vitt och ljus ekdekor med den rullbara sittbänken utdragen" },
        { id: "b379ce_6238ce8b04c64e6eae06c0ef67b5dbfd~mv2.jpg", altText: "Ett barn sitter på bänken och ritar vid barnskrivbordet i ett barnrum" },
        { id: "b379ce_bdebfd2a3f934829aa7c2f605ec8861e~mv2.jpg", altText: "Barnskrivbordet mot en vitmålad tegelvägg med böcker och pennor på hyllorna" },
        { id: "b379ce_10e65d5f126b430fa3caa9998a3a69af~mv2.jpg", altText: "Närbild på det urfrästa greppet i sittbänkens rygg" },
        { id: "b379ce_fc1dfa218ff54c5789dd951e91e1df6e~mv2.jpg", altText: "Måttbild som visar skrivbordet 80 × 29 × 80 cm, bänken 76,5 × 27 × 38 cm och skivhöjden 42 cm" },
      ],
      raa: 699509925,
      tecken: 607
    },
    {
      kort: "d7e75081",
      pid: "d7e75081-3ed0-441e-9bc7-add94ac0d346",
      poster: [
        { id: "b379ce_b64c43e9a0ba40548a3e99c984ab4d86~mv2.jpg", altText: "Vit mediahylla med 18 öppna fack fördelade på två kolumner" },
        { id: "b379ce_498d25234d9842f3ad8c12d2be4647cd~mv2.jpg", altText: "Mediahyllan fylld med cd-skivor, vinylskivor och böcker i ett vardagsrum" },
        { id: "b379ce_1c83d27adced42a9982de0a450874fe2~mv2.jpg", altText: "Mediahyllan i ett ljust vardagsrum med golvlampa och soffa" },
        { id: "b379ce_54a4dcab42a743928c2a3518f67bc82d~mv2.jpg", altText: "Mediahyllan fylld med filmer bredvid en grammofon och en krukväxt" },
        { id: "b379ce_cfb10e3ae8924e158dba3648cf5cd59c~mv2.jpg", altText: "Måttbild som visar mediahyllans mått 78,5 × 24 × 175 cm och lastgränsen 30 kg" },
      ],
      raa: 311219946,
      tecken: 574
    },
    {
      kort: "4b48e10f",
      pid: "4b48e10f-db26-4e63-b1b8-ab780417c92d",
      poster: [
        { id: "b379ce_539ee083b70048feb9f9e2aeb1431fc8~mv2.jpg", altText: "Grå cykelkärra med packväska, uppfällt handtag och två ekerhjul" },
        { id: "b379ce_cb810cb3fc5946c7954ad34dd1e50b56~mv2.jpg", altText: "Cykelkärran kopplad till en cykel på en stenlagd gång" },
        { id: "b379ce_015d77e70e3243398523a63ff07676ed~mv2.jpg", altText: "Närbild på spännbandet med snabbspänne över packväskan" },
        { id: "b379ce_635b62adef7b4ac28433b1ffb1d1e4f7~mv2.jpg", altText: "Måttbild som visar vagnen 53 × 43 × 110 cm, hopfälld 33 × 30 × 72 cm och dragarmen 43 cm" },
      ],
      raa: 174829123,
      tecken: 453
    },
    {
      kort: "590b1f2d",
      pid: "590b1f2d-f5e0-439d-9f3f-1df2063e0968",
      poster: [
        { id: "b379ce_2d76fc6969e8417387beca7bed9c24f1~mv2.jpg", altText: "Klätterställningens delar: klätterbåge, ställning, ramp och griffeltavla" },
        { id: "b379ce_198fd354837f432abe1c5ade1898f61f~mv2.jpg", altText: "Ett barn klättrar på rampen mellan klätterställningen och klätterbågen" },
        { id: "b379ce_89be99d1e43b43c5b28e3774599bf560~mv2.jpg", altText: "Närbild på hakspåret i rampens ände som vilar på en av stegpinnarna" },
        { id: "b379ce_888fde226df6450cbd35e1503420cc3c~mv2.jpg", altText: "Måttbild som visar klätterbågen 100 × 52,5 cm, ställningen 87,5 × 80 cm och rampen 95,5 × 43 cm" },
      ],
      raa: 655474757,
      tecken: 499
    },
    {
      kort: "e5049d65",
      pid: "e5049d65-a68a-4114-a8e2-65d7d493029d",
      poster: [
        { id: "b379ce_6ed795593e744db9a30a6511b879d712~mv2.jpg", altText: "Reptilterrarium i ljus ekdekor på träben med glaslucka och svarta ventilationsgaller" },
        { id: "b379ce_41d9d55a80a947afb76c6fb6f8f9474a~mv2.jpg", altText: "Reptilterrariet i ett vardagsrum med en kameleont på en gren under en värmelampa" },
        { id: "b379ce_f25a604ffd0b4df593b0ba4f388cab6c~mv2.jpg", altText: "Närbild på ventilationsgallren i terrariets gavel och på lockets gångjärn" },
        { id: "b379ce_803947e9e89440a5a7c98123b2fcb928~mv2.jpg", altText: "Reptilterrariet sett uppifrån med locket uppfällt och framrutan synlig" },
        { id: "b379ce_948f3c02eada4ad4ae0de5a115b367e2~mv2.jpg", altText: "Måttbild som visar terrariet 100 × 50 × 60 cm, luckan 100 × 31,5 cm och benhöjden 20 cm" },
      ],
      raa: 998737047,
      tecken: 638
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
