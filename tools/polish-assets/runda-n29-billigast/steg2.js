async function () {
  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };

  const PLAN = [
    {
      kort: "ad46f9cc",
      pid: "ad46f9cc-f895-48d8-be45-ad3253b8ed23",
      poster: [
        { id: "b379ce_34574c592f374acea4ee5c93971cd537~mv2.jpg", altText: "Blå elmotorcykel för barn med avtagbara stödhjul och grovmönstrade hjul" },
        { id: "b379ce_f70c7b4bf02c41ffb4fef3d455681ed2~mv2.jpg", altText: "Ett barn står vid elmotorcykeln på en gång i en park" },
        { id: "b379ce_ef0c637d22794b219682c0c911b98297~mv2.jpg", altText: "Fyra vyer av elmotorcykeln: framifrån, från sidan, snett bakifrån och rakt bakifrån" },
        { id: "b379ce_ba24dab15612491ca95f81f27cda1921~mv2.jpg", altText: "Måttbild som visar motorcykeln 109,5 × 60 × 72,5 cm, sitsen 36 × 15 cm och sitthöjden 53 cm" },
      ],
      raa: 441985357,
      tecken: 492
    },
    {
      kort: "93b9d4da",
      pid: "93b9d4da-cf05-48f4-b55c-6180f2b7dd9e",
      poster: [
        { id: "b379ce_51e22fe9988c48d29912cf18b3b3979f~mv2.jpg", altText: "Förvaringsmöbel med nio utdragbara lådor i tre blå nyanser" },
        { id: "b379ce_565c0accbf584496aa1262589655c2b5~mv2.jpg", altText: "Ett litet barn drar ut en av de övre lådorna i ett vardagsrum" },
        { id: "b379ce_9ad26d9f4298447dae3b7509f56cb802~mv2.jpg", altText: "Närbild på öppna lådor med leksaker och böcker i" },
        { id: "b379ce_7ed873be90ca47e2b8e84725d0fdc3fd~mv2.jpg", altText: "Närbild på lådornas fronter och fötterna under den nedersta raden" },
        { id: "b379ce_6ef5e01ba8fa4133b39202a8b94f44f7~mv2.jpg", altText: "Måttbild som visar möbeln 113 cm bred, 37 cm djup och 56,5 cm hög" },
      ],
      raa: 289616062,
      tecken: 541
    },
    {
      kort: "681e5c63",
      pid: "681e5c63-945a-4c6c-90a1-82646796d41e",
      poster: [
        { id: "b379ce_c777e2a6bfa245059b856d6a6e774adb~mv2.jpg", altText: "Svartvit cykelkärra med kapell, dragarm och 20-tumshjul" },
        { id: "b379ce_6775d54aaef7464584fe15c9f7f798cd~mv2.jpg", altText: "Cykelkärran kopplad bakom en cykel på en väg i en park" },
        { id: "b379ce_7d1d31b273734d71b3c47ed7eb9fba2f~mv2.jpg", altText: "Närbild på hjulets snabbkoppling och ramens fäste vid lastutrymmet" },
        { id: "b379ce_025cc3e51c684f34a5c072adc6de9116~mv2.jpg", altText: "Närbild på dragarmens infästning under lastutrymmet" },
        { id: "b379ce_91007343077448bf89a458b7b8eac7ee~mv2.jpg", altText: "Måttbild som visar kärran 140 × 77 × 65 cm och lastutrymmet 86 × 57 × 36 cm" },
      ],
      raa: 233776498,
      tecken: 545
    },
    {
      kort: "5d2a44cf",
      pid: "5d2a44cf-0d6e-4c5c-8ece-f90b0839f470",
      poster: [
        { id: "b379ce_4487454613e642e980f9e1852be810cb~mv2.jpg", altText: "Sju mjuka klossar i konstläder i blått, grönt, gult, lila, orange och rött" },
        { id: "b379ce_26b5c13c39244deabbf18c7a8a932a82~mv2.jpg", altText: "Klossarna utlagda som en bana med trappa, tunnel och ramp i ett vardagsrum" },
        { id: "b379ce_fdfaafb49b3e462399ed9d2317c781b7~mv2.jpg", altText: "Klossarna uppbyggda till en bana på en rund matta i ett barnrum" },
        { id: "b379ce_bb1b8be63f87482592b8e281eaf6b7c5~mv2.jpg", altText: "Närbild på tunnelblocket med halvcylindern ovanpå" },
        { id: "b379ce_b15aceebf9434b479eceab34dea14f80~mv2.jpg", altText: "Måttbild som visar de 6 formerna med mått, tunnelblocket 55 × 40 × 38 cm" },
      ],
      raa: 449405485,
      tecken: 576
    },
    {
      kort: "16a26891",
      pid: "16a26891-8e6b-4852-88a4-2a476ba8dbb1",
      poster: [
        { id: "b379ce_f14a22a7ffc34b6c97d7e908ecd81b6d~mv2.jpg", altText: "Grön gungställning i metall med två gungsitsar och en glidgunga" },
        { id: "b379ce_d3baded3b0a64284bfb16072ca31422c~mv2.jpg", altText: "Gungställningen uppställd på en gräsmatta framför ett trästaket" },
        { id: "b379ce_21fb5bdf85734a3584a4c79418244b92~mv2.jpg", altText: "Närbild på hur benen skruvas ihop med tvärstaget" },
        { id: "b379ce_42dd1522401b4fc698077b7575979b13~mv2.jpg", altText: "Måttbild som visar ställningen 280 × 140 × 178 cm och gungsitsen 35 × 17,3 cm" },
      ],
      raa: 105937668,
      tecken: 446
    },
    {
      kort: "c9c98333",
      pid: "c9c98333-da20-46a8-9a82-35e592eca296",
      poster: [
        { id: "b379ce_cbf28f03905f4abd9d18704639fefa02~mv2.jpg", altText: "Grått och blått tunneltält med två sovrum och ett vardagsrum med förtak" },
        { id: "b379ce_2cc008ee186945dcbf97676c00b680d7~mv2.jpg", altText: "Tunneltältet uppställt på en äng med berg i bakgrunden" },
        { id: "b379ce_504a5e801de848c680f8b88dd6fa37bd~mv2.jpg", altText: "Tunneltältet uppställt vid en sjö med en filt utlagd framför" },
        { id: "b379ce_b790a6a24292412292050ef5a94eef38~mv2.jpg", altText: "Tunneltältet sett snett framifrån med dörren öppen" },
        { id: "b379ce_006eacdb82ca49dba479f8f13f6c9f94~mv2.jpg", altText: "Måttbild som visar tältet 555 × 225 × 190 cm, sovrummet 208 × 170 × 152 cm och dörren 91 × 158 cm" },
      ],
      raa: 338615847,
      tecken: 576
    },
    {
      kort: "346b40f7",
      pid: "346b40f7-8a4b-4e69-b366-193f779616bd",
      poster: [
        { id: "b379ce_9ff95dfc462d4af09329c284dccad6b8~mv2.jpg", altText: "Hopfällbar inversionsbänk med svart och röd dyna, stoppade handtag och vristrullar" },
        { id: "b379ce_fe0c7cedf140474d87bb1e61317ef202~mv2.jpg", altText: "En person hänger upp och ned i inversionsbänken i ett vardagsrum" },
        { id: "b379ce_4c58bc1f40c743548aab5944741c98ff~mv2.jpg", altText: "En person står bredvid den hopfällda inversionsbänken i en träningslokal" },
        { id: "b379ce_d27e804133024f7aa362767e3fcb73e2~mv2.jpg", altText: "Måttbild som visar inversionsbänken 122 × 59 × 130 cm" },
      ],
      raa: 915832320,
      tecken: 466
    },
    {
      kort: "b373ce2d",
      pid: "b373ce2d-5f95-4f38-b805-5391e4dc3a6a",
      poster: [
        { id: "b379ce_8c14e2df5b0443049b23161fa4c633c5~mv2.jpg", altText: "Vit väggmonterad tv-bänk med tre luckor, den vänstra nedfälld" },
        { id: "b379ce_7f8df210af4a40dab47ec6bd909561f4~mv2.jpg", altText: "Tv-bänken monterad under en väggmonterad tv i ett ljust vardagsrum" },
        { id: "b379ce_b32b061b6aba4310a14990866e418ee3~mv2.jpg", altText: "Måttbild som visar bänken 180 × 31,5 × 29,8 cm och facket 57,3 × 28,3 × 25,3 cm" },
      ],
      raa: 475937693,
      tecken: 352
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
