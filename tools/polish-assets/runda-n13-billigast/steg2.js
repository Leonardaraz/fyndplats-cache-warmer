async function () {
  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };

  const PLAN = [
    {
      kort: "08b40e95",
      pid: "08b40e95-8eb5-444c-8191-7a84a8321426",
      poster: [
        { id: "b379ce_10896ffb4a904097b624893f0c1b6d99~mv2.jpg", altText: "Golvlampa i silver och beige med rund lampskärm, mot vit bakgrund" },
        { id: "b379ce_bfac2d639b204b21bdd78ddf8a7db5e9~mv2.jpg", altText: "Lampan placerad i ett vardagsrum bredvid en soffa" },
        { id: "b379ce_4a3413f4465641939f1b73031e2e09a4~mv2.jpg", altText: "Närbild på fjärrkontrollen och fotströmbrytaren" },
        { id: "b379ce_64c80816cd
steg2.js skriven (11652 tecken)
altText: "Lampan placerad i ett sovrum bredvid sängen" },
        { id: "b379ce_e01e9310c18141d3b281bbefc6ccc7f0~mv2.jpg", altText: "Måttskiss på lampan med höjd 133–168 cm och skärmens mått" },
        { id: "b379ce_2376b0efbeff44059fd4c67bf180139b~mv2.png", altText: "Faktakort: 40 × 40 × 133-168 cm, silver/beige, dimbar 3000–6000 K" },
      ],
      raa: 40033126,
      tecken: 619
    },
    {
      kort: "222f59d6",
      pid: "222f59d6-2c8d-441f-b88d-0dcd68b478c9",
      poster: [
        { id: "b379ce_ffb9aeb506ec48cfbc88a7bc35666a88~mv2.jpg", altText: "Byrå med sju tygklädda lådor i brunt, beige och svart, mot vit bakgrund" },
        { id: "b379ce_94716533a98347759e4a52d64db27503~mv2.jpg", altText: "Byrån placerad i ett vardagsrum" },
        { id: "b379ce_3c51b13f24bc4e73a89162df49ab172c~mv2.jpg", altText: "Närbild på en öppen låda med förvarat innehåll" },
        { id: "b379ce_77c5ce14246a4dd897bd2c37366631da~mv2.jpg", altText: "Närbild på ramens hörnfog" },
        { id: "b379ce_c7a0cb4481a54142a021c5931bab2ba6~mv2.jpg", altText: "Måttskiss på byrån med 80 × 29 × 78,5 cm och lådmåtten" },
        { id: "b379ce_9290173e78e849659f1f47824e5112c3~mv2.png", altText: "Faktakort: 80 × 29 × 78,5 cm, tyg och MDF, 48 kg maxbelastning" },
      ],
      raa: 623234762,
      tecken: 582
    },
    {
      kort: "2dedb89b",
      pid: "2dedb89b-5d4a-4f94-9a39-8ff8b79f60a2",
      poster: [
        { id: "b379ce_73ca3449d36b45a2b283a17345aa893c~mv2.jpg", altText: "Runt sidobord i naturfärgad rattan med glasskiva, mot vit bakgrund" },
        { id: "b379ce_1643f38698ae475a9029d4594d3eb64d~mv2.jpg", altText: "Bordet uppställt på en uteplats bland stolar i samma material" },
        { id: "b379ce_ca0c7d0980fa497a9a19f89bb2642cb6~mv2.jpg", altText: "Närbild på flätningen i rattanstommen" },
        { id: "b379ce_fcd94d65a6a448e9aa27682ea6ba7b39~mv2.jpg", altText: "Bordet använt som avlastning med kopp, bok och vas ovanpå" },
        { id: "b379ce_34c44474c73e4952bfba29c6807df1d5~mv2.jpg", altText: "Måttskiss på bordet med 60 × 60 × 50 cm" },
        { id: "b379ce_9347338416254180a6fe3f90d8397be2~mv2.png", altText: "Faktakort: 60 × 60 × 50 cm, PE-rattan och härdat glas, 50 kg" },
      ],
      raa: 159773929,
      tecken: 613
    },
    {
      kort: "463b807e",
      pid: "463b807e-e81b-4b60-85c5-ea59ed49de51",
      poster: [
        { id: "b379ce_7007f39d16a247edb02b579a1114b86a~mv2.jpg", altText: "Två svarta barstolar med rygg, mot vit bakgrund" },
        { id: "b379ce_480fae908eb248a3adce7512ab5c6cb1~mv2.jpg", altText: "Barstolarna uppställda vid en köksbar" },
        { id: "b379ce_78ac3747b52e482fb2e644442f929584~mv2.jpg", altText: "Närbild på stolens fot och fotstöd" },
        { id: "b379ce_de5173f84bd34a4788dc130886e08ccf~mv2.jpg", altText: "Närbild på det stoppade sätet" },
        { id: "b379ce_4d1ccccfe75444edaf9443c4be5e8507~mv2.jpg", altText: "Måttskiss på stolen med sitthöjd 62–82 cm och totalhöjd 82–104 cm" },
        { id: "b379ce_feff6ae6a91141c6a3e23bbb50ce0955~mv2.png", altText: "Faktakort: 41 × 42 × 82-104 cm, konstläder och stål, 120 kg per stol" },
      ],
      raa: 137176474,
      tecken: 573
    },
    {
      kort: "87c4d80b",
      pid: "87c4d80b-8fdf-4f2e-aaf5-3964c5483539",
      poster: [
        { id: "b379ce_6a597bc5a5be4335bb0262bdfb5846a0~mv2.jpg", altText: "Tvåstegs plantetagerie i granträ med spaljé och tak, mot vit bakgrund" },
        { id: "b379ce_4a1f66c9f0cd4365922ca462fd52b32f~mv2.jpg", altText: "Etagerien uppställd mot en tegelvägg med krukväxter på hyllorna" },
        { id: "b379ce_cce61523f2614aa485c3f8bed190c498~mv2.jpg", altText: "Närbild på hörnbeslaget mellan spaljé och hylla" },
        { id: "b379ce_71629cda73c84fbf909413f05877cb20~mv2.jpg", altText: "Närbild på en kruka med kaktus på den övre hyllan" },
        { id: "b379ce_230926bf63294bbebf0f51ed4b8d6346~mv2.jpg", altText: "Måttskiss på etagerien med 75 × 50 × 166 cm och hyllmåtten" },
        { id: "b379ce_8d22ac0b0dd947aea41862c815a77cc4~mv2.png", altText: "Faktakort: 75 × 50 × 166 cm, granträ, 30 kg per hylla" },
      ],
      raa: 314055710,
      tecken: 632
    },
    {
      kort: "9d4b2bd0",
      pid: "9d4b2bd0-6d62-4b09-a752-1a07c0e99f91",
      poster: [
        { id: "b379ce_662d1d0e22bf41f5a0feca5d86d1aca8~mv2.jpg", altText: "Upphöjt odlingsbord i tre nivåer i granträ, mot vit bakgrund" },
        { id: "b379ce_95d014fec01b4901b0750f371d416ada~mv2.jpg", altText: "Odlingsbordet uppställt på en altan, planterat med blommor" },
        { id: "b379ce_7963bb035dc7421badffcdd4769ccb86~mv2.jpg", altText: "Närbild på en fot och hörnbeslag" },
        { id: "b379ce_68fb9710441a4fbe9d040a1eb5642db2~mv2.jpg", altText: "Närbild på hörnfogen mellan två nivåer" },
        { id: "b379ce_b7920beca80e4eb0b865029a825f4201~mv2.jpg", altText: "Måttskiss på odlingsbordet med 120 × 120 × 56 cm och nivåernas mått" },
        { id: "b379ce_ae0ecfd3056642cea1b3200ad3b6ff97~mv2.png", altText: "Faktakort: 120 × 120 × 56 cm, granträ i tre nivåer" },
      ],
      raa: 935861801,
      tecken: 598
    },
    {
      kort: "a492b6f8",
      pid: "a492b6f8-3754-4de4-b576-1883cd2063a6",
      poster: [
        { id: "b379ce_79e1a62895904d54932bb22c7eb80e7e~mv2.jpg", altText: "Svart hallträd med krokar, hyllor och lådor, mot vit bakgrund" },
        { id: "b379ce_2b6e093f299943eb92c68793bb775fc2~mv2.jpg", altText: "Hallträdet uppställt i en hall med kläder och väskor på krokarna" },
        { id: "b379ce_6447aff9909043b58fa060892390781d~mv2.jpg", altText: "Närbild på en öppen låda med hoprullade tygvaror" },
        { id: "b379ce_9c71013a40cf4a6ba0d570d0bb97030c~mv2.jpg", altText: "Måttskiss på hallträdet med 180,5 × 80 × 30 cm och belastningsangivelser" },
        { id: "b379ce_83c3da86c4c647d6bcdef130ff20e1cc~mv2.png", altText: "Faktakort: 80 × 30 × 180,5 cm, svart, tippskydd ingår" },
      ],
      raa: 910065237,
      tecken: 542
    },
    {
      kort: "c88b22ce",
      pid: "c88b22ce-de97-40f6-b5dd-000e47d026b2",
      poster: [
        { id: "b379ce_ac11063e61d44c339af0ba1e9fc7a4ba~mv2.jpg", altText: "Skärmtak i brunt och svart över en dörr, mot vit bakgrund" },
        { id: "b379ce_cdf6636cca704df7ba0156b6fb8636aa~mv2.jpg", altText: "Skärmtaket monterat ovanför en balkongdörr" },
        { id: "b379ce_8bb0584023334a8ab0990deba06f3ebd~mv2.jpg", altText: "Skärmtaket monterat ovanför ett fönster på en gavel" },
        { id: "b379ce_8dd52d405eba458e84d0ebc772ffc0d7~mv2.jpg", altText: "Måttskiss på skärmtaket med 303 × 96 × 27 cm" },
        { id: "b379ce_5c7ccaf8e24841d7a70796c66ff385b6~mv2.png", altText: "Faktakort: 303 × 96 × 27 cm, polykarbonat och aluminium" },
      ],
      raa: 546576443,
      tecken: 493
    },
    {
      kort: "cfc2d4f4",
      pid: "cfc2d4f4-d150-4f09-bd40-73017a5c680b",
      poster: [
        { id: "b379ce_e8055707d50b4c0bb8cee3c893a156cd~mv2.jpg", altText: "Rund rosa poledance-matta, mot vit bakgrund" },
        { id: "b379ce_7d1663a2c47a469e9007b6a67ee5b698~mv2.jpg", altText: "Mattan utlagd kring en stång som en person tränar vid" },
        { id: "b379ce_dee822722f9f4d4a89ea7ec77afc90a6~mv2.jpg", altText: "Närbild på blixtlåset längs mattans kant" },
        { id: "b379ce_88aeb8de4ae74716bbf29915b1a14bcc~mv2.jpg", altText: "Mattan hopvikt i fyra delar" },
        { id: "b379ce_41e14b98dec94278885f45092ef86ffd~mv2.jpg", altText: "Måttskiss på mattan med Ø150 × 5 cm och hopvikta mått 75 × 75 × 20 cm" },
        { id: "b379ce_a12b67210f9341f68e27d7b40dd9d9ee~mv2.png", altText: "Faktakort: Ø150 × 5 cm, viks ihop till 75 × 75 × 20 cm" },
      ],
      raa: 505792744,
      tecken: 579
    },
    {
      kort: "db1118d0",
      pid: "db1118d0-3817-44f7-ae1d-b5b9625b47a0",
      poster: [
        { id: "b379ce_31b3ef668dc24d339f4223351a8dc191~mv2.jpg", altText: "Basketkorg med transparent ryggplatta, mot vit bakgrund" },
        { id: "b379ce_fc9a9d3612b6472ab4ad4d9d6fe08f6f~mv2.jpg", altText: "Korgen väggmonterad medan två personer spelar basket" },
        { id: "b379ce_8574c8a39de14dfabcecc4d7a3ae544a~mv2.jpg", altText: "Två ungdomar som hoppar och kastar mot korgen" },
        { id: "b379ce_51221fd4f0f04a9e9c43922abf49d692~mv2.jpg", altText: "Två ungdomar som spelar basket vid korgen på en garageentré" },
        { id: "b379ce_63547714b9d94fe69b54c46cb9b1e61d~mv2.jpg", altText: "Måttskiss på korgen med 113 × 61 × 73 cm och ringdiameter 45 cm" },
        { id: "b379ce_87dfb79e7bea4ae99e01e32934a78305~mv2.png", altText: "Faktakort: 113 × 61 × 73 cm, ringdiameter 45 cm, stål" },
      ],
      raa: 393737577,
      tecken: 620
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
