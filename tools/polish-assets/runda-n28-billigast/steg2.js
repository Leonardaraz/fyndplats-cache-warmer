async function () {
  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };

  const PLAN = [
    {
      kort: "01d8e819",
      pid: "01d8e819-55eb-48dd-8546-56dc1c7cb2dd",
      poster: [
        { id: "b379ce_7cf0993956894cc0938765646ac1facd~mv2.jpg", altText: "Klätterställningens delar: hopfällbar klätterbåge med stegpinnar och en vändbar ramp med färgade klätterklackar" },
        { id: "b379ce_ed6a99f7a67c49b8bae99edb25d6e98f~mv2.jpg", altText: "Två barn leker vid klätterställningen i ett vardagsrum, det yngre klättrar uppför rampen" },
        { id: "b379ce_fa9ed86c4b664cf49c9959e0d8d4f3ee~mv2.jpg", altText: "Måttbild som visar klätterbågen 213 cm utvikt och 70 cm över gaveln, rampen 114 × 43,5 cm och hopfällt mått 70 × 53 × 30 cm" },
      ],
      raa: 543321263,
      tecken: 468
    },
    {
      kort: "a9c2bfd8",
      pid: "a9c2bfd8-9cab-4bcd-9737-71441c92ecac",
      poster: [
        { id: "b379ce_7239febcc5674582bc0fef8731a3d128~mv2.jpg", altText: "Stapel med trapetsprofilerade plåtar i trämönster" },
        { id: "b379ce_dfc839870ffb4f90b897e086502184cc~mv2.jpg", altText: "Plåtarna lagda som tak på ett hönshus i en trädgård" },
        { id: "b379ce_90a2fa806d934a54a11bacebff19b62c~mv2.jpg", altText: "Måttbild som visar en plåt på 129 × 45 cm och en tjockleksmätare som visar 0,25 mm" },
      ],
      raa: 476941641,
      tecken: 328
    },
    {
      kort: "c804d1b7",
      pid: "c804d1b7-1cda-4e36-b335-7ef826dd1c39",
      poster: [
        { id: "b379ce_1f40ee4a441c4482aa92f87da1d87a36~mv2.jpg", altText: "Grå hundvagn med nätfönster, uppfällbar sufflett och svängbart dubbelhjul fram" },
        { id: "b379ce_dc1f068fd15545cd99a94f65ba047fb6~mv2.jpg", altText: "En kvinna rullar hundvagnen med en beagle i på en parkväg" },
        { id: "b379ce_9eed462890814de3ad307cc35533bf18~mv2.jpg", altText: "Måttbild som visar vagnen 92 × 63 × 95 cm, kabinen 73 cm lång och 45 cm bred samt 63 cm hög" },
      ],
      raa: 762123343,
      tecken: 372
    },
    {
      kort: "cb31a581",
      pid: "cb31a581-0678-4223-bc43-848782a42645",
      poster: [
        { id: "b379ce_12bd590237444e1182e6305380cd3ab0~mv2.jpg", altText: "Fyra mörkgröna sittpallar med runda stoppade sitsar och gröna metallben" },
        { id: "b379ce_d3d0baaf4cc748dbac9aa12cc88c3b9d~mv2.jpg", altText: "Fyra sittpallar kring ett runt matbord i ljust trä" },
        { id: "b379ce_7cd74076df2349ee9e60422b9221edc1~mv2.jpg", altText: "Fyra sittpallar vid ett matbord, två av dem staplade på varandra" },
        { id: "b379ce_3704a163e3ee420fbc3a75a9d4e1daee~mv2.jpg", altText: "En sittpall framför ett sminkbord i ett sovrum" },
        { id: "b379ce_6efb1f25442c4653bd3471d98afdff3d~mv2.jpg", altText: "Måttbild som visar pallen 47,5 cm hög, sitsen 40 cm i diameter och 6 cm tjock samt 45 cm mellan benen" },
      ],
      raa: 268365249,
      tecken: 576
    },
    {
      kort: "e5e8754c",
      pid: "e5e8754c-243d-4b60-a682-44393ef16893",
      poster: [
        { id: "b379ce_ecec3c17c3324035aa1328992d444ebd~mv2.jpg", altText: "Vit byrå med fem lådor i vitt, ljusgrått, grått och nästan svart med svarta skålhandtag" },
        { id: "b379ce_4f3484a790fd4ccf8de086b12f851125~mv2.jpg", altText: "Byrån i en hall med krukväxter och prydnadssaker ovanpå" },
        { id: "b379ce_17bf5ad65c504201a452279a38270690~mv2.jpg", altText: "Byrån med alla lådor utdragna bredvid en tv-bänk" },
        { id: "b379ce_7bd8b0a765d64be0917b4590636598c8~mv2.jpg", altText: "Byrån i ett sovrum med en golvlampa bredvid" },
        { id: "b379ce_1ff856af787b4afaafbdc781d80e660b~mv2.jpg", altText: "Måttbild som visar byrån 70 × 38 × 85 cm och 59,2 cm mellan benen" },
      ],
      raa: 103874432,
      tecken: 542
    },
    {
      kort: "329beada",
      pid: "329beada-49b8-4519-8086-b1a22f9869f4",
      poster: [
        { id: "b379ce_ce754b2ee30e4f16824f86175c9b1235~mv2.jpg", altText: "Rosa och ljusgul elscooter för barn med speglar, strålkastare och bagagebox" },
        { id: "b379ce_a2a6eb4df6794c6cb367365763052773~mv2.jpg", altText: "Ett litet barn sitter på elscootern på en gräsmatta" },
        { id: "b379ce_d32d892386644a6fb6ef0beb4a4fbed5~mv2.jpg", altText: "Närbild på styret med backspeglar, strålkastare och orange blinkerglas" },
        { id: "b379ce_bb82211834384f9893aa89df225cda51~mv2.jpg", altText: "Närbild på sitsen och bagageboxen bakom den" },
        { id: "b379ce_1f77746751664830a832f9ee02f59c6b~mv2.jpg", altText: "Måttbild som visar scootern 108 × 51 × 75 cm, sitsen 18 × 23 cm och sitthöjden 40 cm" },
      ],
      raa: 150519610,
      tecken: 567
    },
    {
      kort: "0000fa76",
      pid: "0000fa76-469a-461c-814d-bbe8fe389596",
      poster: [
        { id: "b379ce_7ed65ee225e24e7d866e744df2c5ccf3~mv2.jpg", altText: "Grått och vitt katthus i trä med två plan, takpapp och hyllplan på sidorna" },
        { id: "b379ce_91e0e637d4b946739ce2b2027eb792a2~mv2.jpg", altText: "Två katter vid katthuset utanför ett hus, med den främre takhalvan uppfälld" },
        { id: "b379ce_afcbbb6ac7e24a63b7ccc4dbb7932e6f~mv2.jpg", altText: "Närbild på ett hyllplan och den lägre dörren med genomskinlig lucka" },
        { id: "b379ce_90b6ffa21b4045eb916ad12992b12bf8~mv2.jpg", altText: "Närbild på två hyllplan i olika höjd på husets sida" },
        { id: "b379ce_2612258205e9474babdfcb9032a0097b~mv2.jpg", altText: "Måttbild som visar katthuset 99,5 × 76 × 91 cm, huvudingången 17 × 25 cm och nödutgången 20 × 25,4 cm" },
      ],
      raa: 854390319,
      tecken: 612
    },
    {
      kort: "8ee517cc",
      pid: "8ee517cc-eb9b-4ab7-9ef6-15273e5912cc",
      poster: [
        { id: "b379ce_e85ca488f1dc4ee4993ab87748957fe6~mv2.jpg", altText: "Två grå barstolar med kanalsömmad rygg, snurrsits och rund svart fot" },
        { id: "b379ce_d8ccef09a3a043e883ffdc7544765531~mv2.jpg", altText: "Två barstolar vid ett runt barbord i ett ljust rum" },
        { id: "b379ce_a1118c79c9f649ab96c073f49345df44~mv2.jpg", altText: "Närbild på den runda sitsen och spaken för höjdinställning" },
        { id: "b379ce_754d24021904415bac97ed331032002f~mv2.jpg", altText: "Närbild på ryggens vertikala kanalsöm i sammetslook" },
        { id: "b379ce_979eef206a644368997123ce3c673ebd~mv2.jpg", altText: "Måttbild som visar barstolen 54 × 56 × 91–111 cm, sitsen 46,5 × 41,5 cm, sitthöjden 62–82 cm och fotstödet 21–41 cm" },
      ],
      raa: 992769962,
      tecken: 586
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
