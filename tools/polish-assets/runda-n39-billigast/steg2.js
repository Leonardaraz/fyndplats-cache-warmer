async function () {
  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };

  const PLAN = [
    {
      kort: "a9360e2a",
      pid: "a9360e2a-f8ac-47ff-8be6-4664e5f805d6",
      poster: [
        { id: "b379ce_e3bf89c31b584043b7c7b1173abf2c38~mv2.jpg", altText: "Blå balansbom, 236 cm lång, sedd snett från sidan" },
        { id: "b379ce_3e698d2a92c04d369fefbe6b6ec3234c~mv2.jpg", altText: "Kvinna som balanserar på ett ben på den blå balansbommen i ett ljust rum" },
        { id: "b379ce_8454633071fc463288d93030a9623042~mv2.jpg", altText: "Närbild på bommens ände med den halkfria undersidan" },
        { id: "b379ce_dd1fd0dd61aa424ab5a2b70a1bffa117~mv2.jpg", altText: "Närbild på fogen där bommen viks ihop på mitten" },
        { id: "b379ce_651ca767bc9641ceabc0c510cd325981~mv2.jpg", altText: "Måttbild som visar bommen 236 cm lång och 6,5 cm hög, och hopvikt 120 × 15 × 13 cm" },
      ],
      raa: 371739951,
      tecken: 545
    },
    {
      kort: "c694dcaa",
      pid: "c694dcaa-c927-414c-8111-9a65a5e55015",
      poster: [
        { id: "b379ce_ef663c1c231d4f9bada83639a6a7fc7a~mv2.jpg", altText: "Golvlampa med svart trebensstativ och vit, rund tygskärm" },
        { id: "b379ce_d638269c9b8b4450a510b1ad5fa7ad8a~mv2.jpg", altText: "Golvlampan bredvid en ljus soffa i ett vardagsrum" },
        { id: "b379ce_a58fa9c035ba42a5b4d73b40bac13f17~mv2.jpg", altText: "Måttbild som visar lampan 152 cm hög och skärmen Ø37 × 24 cm" },
      ],
      raa: 619005182,
      tecken: 311
    },
    {
      kort: "d3655c3e",
      pid: "d3655c3e-c066-4226-9860-0e960aa5315f",
      poster: [
        { id: "b379ce_1acf4f4c67484a3ba2991452dc2262a2~mv2.jpg", altText: "Tvättställ i bambu med två grå tygkorgar och två hyllplan" },
        { id: "b379ce_9dff974aeb234fbd8bc0cf9e72775fe6~mv2.jpg", altText: "Tvättstället i ett tvättrum bredvid tvättmaskinen, med flaskor och handdukar på hyllorna" },
        { id: "b379ce_8f282542bfcc4cb98902174293fade2a~mv2.jpg", altText: "Tvättstället med utdragna korgar och handdukar på hyllplanen" },
        { id: "b379ce_94fce9da29774a18b7f76fd936a7e496~mv2.jpg", altText: "Måttbild som visar ställningen 44 × 34 × 96 cm och en korg på 34 × 26 × 20 cm" },
      ],
      raa: 953061641,
      tecken: 477
    },
    {
      kort: "e514191b",
      pid: "e514191b-9ed9-4e31-b595-4bb3f0f7345a",
      poster: [
        { id: "b379ce_5702e26b025748b387719d9fd6ab1e24~mv2.jpg", altText: "Svart skohylla i metall med fyra hyllplan och blomdekor" },
        { id: "b379ce_6fd7a59c5d9b402fa697cf988709942a~mv2.jpg", altText: "Skohyllan i en hall med skor på hyllplanen och en väska överst" },
        { id: "b379ce_07019c94ad204ec89096a41791dfe040~mv2.jpg", altText: "Närbild på hyllans överdel med blommor i svart metall" },
        { id: "b379ce_097762af33734a5e825982051ba09c57~mv2.jpg", altText: "Närbild på hyllplanen av metalltråd och blomdekoren på sidan" },
        { id: "b379ce_2bd7c49bd3634bf595208e565409603e~mv2.jpg", altText: "Måttbild som visar hyllan 59,5 × 30 × 92 cm och 18,5 cm mellan hyllplanen" },
      ],
      raa: 582973681,
      tecken: 547
    },
    {
      kort: "f75a8a17",
      pid: "f75a8a17-f7e8-4a9f-9e38-1bba760252c4",
      poster: [
        { id: "b379ce_ef536562baf24d84b58a067c3088f965~mv2.jpg", altText: "Svart hörnblomställ i tre plan med krukväxter" },
        { id: "b379ce_cc70506d5db541a6a57e7fe6ef828887~mv2.jpg", altText: "Blomstället i ett hörn på en uteplats, fyllt med blommor och gröna växter" },
        { id: "b379ce_77d05765377547bb85130d59bed7c4e5~mv2.jpg", altText: "Blomstället framför ett vitt staket med krukväxter på alla tre planen" },
        { id: "b379ce_14e62c6d15454860820b9b160454e774~mv2.jpg", altText: "Blomstället i ett soligt hörn med blommor och en kaktus bredvid" },
        { id: "b379ce_d40890ab0f044d25a4e4815919b8c09d~mv2.jpg", altText: "Måttbild som visar ställningen 87 × 60 × 60 cm och hyllplanen 85, 56 och 28 cm" },
      ],
      raa: 324753252,
      tecken: 572
    },
    {
      kort: "ba454107",
      pid: "ba454107-f4e8-4e19-b0ec-e4985e647c34",
      poster: [
        { id: "b379ce_bae8c2d024434839b98be1ad99263e00~mv2.jpg", altText: "Mörkgrå pall med stoppad sits och svarta ben" },
        { id: "b379ce_ce0b45fa4cd84445bccc6b14bfa0b85e~mv2.jpg", altText: "Pallen framför en ljus soffa på en grå matta" },
        { id: "b379ce_3bd375cbc83f49ba944a4b6bb9192358~mv2.jpg", altText: "Närbild på sitsens mjuka tyg med lockig yta" },
        { id: "b379ce_af3adb338a2d49bd8504308bdf57c617~mv2.jpg", altText: "Närbild på ett av de svarta benen av stål" },
        { id: "b379ce_b463d0e9b7fc49da930c9d1cc6d61c22~mv2.jpg", altText: "Måttbild som visar pallen 42 × 42 × 44 cm" },
      ],
      raa: 601108159,
      tecken: 457
    },
    {
      kort: "f4bdb64c",
      pid: "f4bdb64c-95fa-4127-984c-2e93b416f2f2",
      poster: [
        { id: "b379ce_e4d931c9729448e6ad5a93f3629217cd~mv2.jpg", altText: "Lavendelblå pilatesbräda med glidplattor, handtag, stång och gummiband" },
        { id: "b379ce_9103b8b9eb784fc7845bbd7a864fdc38~mv2.jpg", altText: "Kvinna som gör plankan med armbågarna på brädans glidplattor" },
        { id: "b379ce_b95ff99eaebc4e11b87e4734ec08c1cf~mv2.jpg", altText: "Kvinna som tränar med händerna på brädans glidplattor" },
        { id: "b379ce_4f84b9c539434036964a06b813073691~mv2.jpg", altText: "Kvinna som håller plankan på pilatesbrädan med mobilen i hållaren framför sig" },
        { id: "b379ce_1cbb9ec6c88a44269b1fa2fa4bc7a563~mv2.jpg", altText: "Måttbild som visar brädan 97 × 30 × 3 cm och gummibandet 58 cm" },
      ],
      raa: 996314358,
      tecken: 566
    },
    {
      kort: "95b6f5bd",
      pid: "95b6f5bd-7b89-45de-98ae-0a535e1e44de",
      poster: [
        { id: "b379ce_a607a7b35798486fb0dc282a437520e3~mv2.jpg", altText: "Tvättsorterare i bambu med vit tvättpåse och förvaring i tre fack" },
        { id: "b379ce_18778dbfd7ff4ca2b433121bcc4ca8c6~mv2.jpg", altText: "Tvättsorteraren i ett ljust rum med handdukar i facken och flaskor på hyllan" },
        { id: "b379ce_c057ec8141b54948a674cd773495f108~mv2.jpg", altText: "Tvättsorteraren i ett ljust badrum med tvätt i påsen" },
        { id: "b379ce_47ec633d68bb451a9cc5409db9ae05c3~mv2.jpg", altText: "Närbild på bambuhyllan ovanpå med en bricka, en tvålkopp och en borste" },
        { id: "b379ce_e6b1560c84094fdba374fd8b7f83a6b3~mv2.jpg", altText: "Måttbild som visar sorteraren 70 × 36 × 70 cm och tygdelarnas mått" },
      ],
      raa: 266166284,
      tecken: 573
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
