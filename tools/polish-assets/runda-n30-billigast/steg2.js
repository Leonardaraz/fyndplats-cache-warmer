async function () {
  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };

  const PLAN = [
    {
      kort: "82d04879",
      pid: "82d04879-148b-4841-84eb-bcb55559335e",
      poster: [
        { id: "b379ce_e22ac623a6b94c10899343cb97c0834e~mv2.jpg", altText: "Grå rastgård i galvat stål med nätväggar, tak i väv och stängd dörr" },
        { id: "b379ce_b2c647226a8347ab89dbe633635e4bc8~mv2.jpg", altText: "En person med foderhink står vid rastgården där höns går inne i hagen" },
        { id: "b379ce_7842a8940e75495983d62bb021150713~mv2.jpg", altText: "Närbild på den öppna dörren med reglar och höns som går ut på gräset" },
        { id: "b379ce_9ff5bf0ab11b4a96850234f2f4fd9975~mv2.jpg", altText: "Rastgården uppställd på en gräsmatta framför ett trästaket" },
        { id: "b379ce_1acbe24907434567b54859d183ee76b4~mv2.jpg", altText: "Måttbild som visar hagen 200 × 200 cm i grundyta, takfot 146 cm och dörr 56 × 167 cm" },
      ],
      raa: 618927193,
      tecken: 590
    },
    {
      kort: "19f566d8",
      pid: "19f566d8-7812-4068-8834-5232a0493306",
      poster: [
        { id: "b379ce_43f9f30d025c492bb57badf6fe321220~mv2.jpg", altText: "Vit sideboard med skiva i ljus träton, två dörrar med guldfärgade knoppar och öppna fack" },
        { id: "b379ce_374b0ce954ed4cadab19bed235d1ecaa~mv2.jpg", altText: "Sideboarden längs en vägg i ett vardagsrum med böcker och foton på skivan" },
        { id: "b379ce_b6a0c01bb65d419988ded6722df13405~mv2.jpg", altText: "Sideboarden i ett kök med kaffemaskin och burkar på skivan" },
        { id: "b379ce_2bbe2135198d410a9bd335ac4c1c2431~mv2.jpg", altText: "Sideboarden i ett vardagsrum med radio och krukväxt i de öppna facken" },
        { id: "b379ce_0231cdc5e4b64ef4849559cd79e054bc~mv2.jpg", altText: "Måttbild som visar möbeln 120 × 35 × 75,2 cm och skåpen 41,6 × 34,1 × 66,7 cm invändigt" },
      ],
      raa: 881001671,
      tecken: 619
    },
    {
      kort: "5f730167",
      pid: "5f730167-3348-49e6-b5f1-bf95ca423b25",
      poster: [
        { id: "b379ce_17c5df82c1054f11b224ac8ddc0418ca~mv2.jpg", altText: "Svart hopfällbar motionscykel med ryggstöd, LCD-display och träningsband" },
        { id: "b379ce_bb75b021b14e4302be6bb499e4c2cb79~mv2.jpg", altText: "En person sitter upprätt och trampar på motionscykeln i ett träningsrum" },
        { id: "b379ce_36064c0b72bd42de8bb349fa8b8129c2~mv2.jpg", altText: "En person trampar tillbakalutad mot ryggstödet i ett ljust vardagsrum" },
        { id: "b379ce_de86a2a3b2a344d8aeed2ee10f8d114a~mv2.jpg", altText: "En person drar i träningsbanden sittande på motionscykeln" },
      ],
      raa: 319620177,
      tecken: 464
    },
    {
      kort: "041fa621",
      pid: "041fa621-e7bb-4a6b-b34d-95fa776bb461",
      poster: [
        { id: "b379ce_f331cc56141d4fd094e24c06238ca3ea~mv2.jpg", altText: "Skrivbord med rustikt brun skiva på svart stålstativ, fogen syns mitt på skivan" },
        { id: "b379ce_18c184e9791c42e4ad6b3a810b052b68~mv2.jpg", altText: "Skrivbordet i ett kontor med bildskärm, kontorsstol och förvaring på skivan" },
        { id: "b379ce_f93e7734917142d89a926e079634071f~mv2.jpg", altText: "Närbild på bordsskivans träimitation med lampa och hörlurar" },
        { id: "b379ce_094d6dc044b042e6bfa990bc9cb5d6da~mv2.jpg", altText: "Närbild på hörnbeslaget mellan bordsben och skiva" },
        { id: "b379ce_2138e8dc1d914d939e31f1c5faeb9da5~mv2.jpg", altText: "Måttbild som visar bordet 200 × 60 × 75 cm och en last på 60 kg" },
      ],
      raa: 492748337,
      tecken: 569
    },
    {
      kort: "cd473c5e",
      pid: "cd473c5e-3158-46ce-bb30-07ea7899aeb0",
      poster: [
        { id: "b379ce_2161487e34b74446a0dbef8e3dfba5f9~mv2.jpg", altText: "Två vita nattduksbord med tre greppfria lådor vardera" },
        { id: "b379ce_3f8a0bcf7cb6495da522385d83c00e54~mv2.jpg", altText: "Ett av nattduksborden vid en säng med stoppad sänggavel" },
        { id: "b379ce_624f84450f4141bdab798b60cc847ef2~mv2.jpg", altText: "Nattduksborden på var sida om en säng i ett ljust sovrum" },
        { id: "b379ce_54deac61c91647b9a9832db699590552~mv2.jpg", altText: "Nattduksborden använda som sidobord vid en soffa" },
        { id: "b379ce_80552623dd284c159ea5d93892243684~mv2.jpg", altText: "Måttbild som visar nattduksbordet 40 × 30 × 59,5 cm och en last på 30 kg" },
      ],
      raa: 344199332,
      tecken: 528
    },
    {
      kort: "d5229703",
      pid: "d5229703-d062-489d-b3f6-35d95472a5d4",
      poster: [
        { id: "b379ce_92f1fa5a1c064201b14affef0e8fe117~mv2.jpg", altText: "Skumklossar i blått, grönt, lila, orange, gult och rött byggda till ett hus" },
        { id: "b379ce_ff5190a2588d4dfaae1ccfc5a6007fda~mv2.jpg", altText: "Ett barn står vid klossarna som byggts till ett hus i ett vardagsrum" },
        { id: "b379ce_4a0702a592df46fd8a7c1c9a2b1cb46d~mv2.jpg", altText: "Klossarna byggda till en hög portal i ett barnrum" },
        { id: "b379ce_27d4d55898394c0886d1e5644b611d44~mv2.jpg", altText: "Klossarna uppbyggda till ett hus på en rund matta" },
        { id: "b379ce_ad6ccd73aaab4a8ba091d152eaf1a897~mv2.jpg", altText: "Måttbild som visar de sex formerna, största triangeln 50 × 50 × 25 cm" },
      ],
      raa: 82731754,
      tecken: 554
    },
    {
      kort: "89b2a551",
      pid: "89b2a551-e5b1-4bcf-a3b3-00e30ed0e52c",
      poster: [
        { id: "b379ce_dde043ebaafd4d5a9a59ea7cd6031a42~mv2.jpg", altText: "Vitt leksakskök med kylskåp, mikrovågsugn, spis, ugn och diskho" },
        { id: "b379ce_172398b694884eaf89ffc9fcaf9979bf~mv2.jpg", altText: "Ett barn leker vid leksaksköket i ett rum med grön vägg" },
        { id: "b379ce_e34dd60a05c44339a3eb7c18508da770~mv2.jpg", altText: "Leksaksköket med öppen kylskåpsdörr och korgar i de öppna hyllorna" },
        { id: "b379ce_c95bf95b270d4596bea8ac9e3f6495b1~mv2.jpg", altText: "Måttbild som visar köket 80 × 29,7 × 100,9 cm och bänkskivan 55,2 cm över golvet" },
      ],
      raa: 199759267,
      tecken: 459
    },
    {
      kort: "10957741",
      pid: "10957741-e44b-4a81-80b8-bba5d31ec488",
      poster: [
        { id: "b379ce_0f1c4433a8184716a5dc98d7efabca76~mv2.jpg", altText: "Vitt hörnkök med tillbehör: kastrull, stekpanna, form, redskap och matbitar i trä" },
        { id: "b379ce_fb9a8adffc404736af1f293ce9c9e478~mv2.jpg", altText: "Ett barn i kockmössa och förkläde leker vid hörnköket" },
        { id: "b379ce_4ed2f00600a246a4843ddbca3c9dbee9~mv2.jpg", altText: "Närbild på diskhon med kranen och matbitar i trä på bänkskivan" },
        { id: "b379ce_9d2ee14d14f745dcb5cf1a4790f6829e~mv2.jpg", altText: "Närbild på den öppna ugnen med stekpanna och kastrull inuti" },
        { id: "b379ce_7de1390cc6cb4e3bac2caeda52c0708d~mv2.jpg", altText: "Måttbild som visar köket 86 × 64 × 84,5 cm och bänkskivan 45 cm över golvet" },
      ],
      raa: 711497231,
      tecken: 574
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
