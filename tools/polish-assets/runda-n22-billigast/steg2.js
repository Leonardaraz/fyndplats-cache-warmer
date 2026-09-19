async function () {
  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };

  const PLAN = [
    {
      kort: "fffbe044",
      pid: "fffbe044-9c3b-430a-890e-c83b3b0a2673",
      poster: [
        { id: "b379ce_03005df87e604c1c85eeb838b24b7ad2~mv2.jpg", altText: "Två odlingslådor i mörkgrå metall, sedda snett framifrån på vit bakgrund" },
        { id: "b379ce_bda19e92109046b5ab00904251c4874d~mv2.jpg", altText: "Odlingslådorna i metall uppställda i en trädgård vid ett vitt staket, planterade med grönska" },
        { id: "b379ce_6f7d6af67fe84059bd79745cc07073b0~mv2.jpg", altText: "Närbild på odlingslådans hörnbeslag i svart metall" },
        { id: "b379ce_586d2407dda74b2aae84664c7db520ec~mv2.jpg", altText: "Närbild på hörnfästet där två sidopaneler möts, fastskruvat" },
        { id: "b379ce_797e442f418e475d9ec30197d5d273f4~mv2.jpg", altText: "Måttritning som visar odlingslådans yttermått 120 x 60 x 60 cm" },
      ],
      raa: 627438906,
      tecken: 579
    },
    {
      kort: "d9238d45",
      pid: "d9238d45-8b42-4576-8653-152640c2cfa3",
      poster: [
        { id: "b379ce_a658cb07d06f45d89acf6d5cd89b698d~mv2.jpg", altText: "Smalt vitt badrumsskåp med fem lådor och silverfärgade handtag" },
        { id: "b379ce_7806b89cff724b25be296a06b1660e32~mv2.jpg", altText: "Badrumsskåpet mot en orange kaklad vägg med tvålpumpar och en växt ovanpå" },
        { id: "b379ce_687bd8efd2a045f39965ecfc9b0a3f7c~mv2.jpg", altText: "Badrumsskåpet i ett ljust vardagsrum bredvid en fåtölj, med blommor ovanpå" },
        { id: "b379ce_df4d015eb8da4c0faa7152dc0d278772~mv2.jpg", altText: "Badrumsskåpet i ett beige badrum bredvid ett fristående badkar" },
        { id: "b379ce_bb302ad1cc404d9f8486c9165437ebf2~mv2.jpg", altText: "Måttritning som visar badrumsskåpets mått 30 x 30 x 95 cm samt en öppen låda" },
      ],
      raa: 970332484,
      tecken: 591
    },
    {
      kort: "d48f0b07",
      pid: "d48f0b07-c531-48e1-9253-a77ef907db2f",
      poster: [
        { id: "b379ce_e2bb9189e9b649139858355f0761fb93~mv2.jpg", altText: "Rosa klätterställning i trä med triangel, ramp och klätterbåge, sedd snett framifrån" },
        { id: "b379ce_fa54494c875c4f46a03feb0c1cc3ef90~mv2.jpg", altText: "Rosa klätterställning i trä uppställd i ett lekrum med hyllor och leksaker" },
        { id: "b379ce_b84c7b324dd44e56a7bb3cc3ac608a17~mv2.jpg", altText: "Måttritning som visar klätterställningens mått 188 x 70 x 59 cm" },
      ],
      raa: 460917215,
      tecken: 367
    },
    {
      kort: "d1132894",
      pid: "d1132894-d9b7-42e2-95d1-2eecb0e47a7d",
      poster: [
        { id: "b379ce_e04a4416469a4dcf863e60fe68aba955~mv2.jpg", altText: "Blå sammetsbänk med fyra guldfärgade metallben, sedd snett framifrån" },
        { id: "b379ce_92cc0b39c2634b919aae10d85e910520~mv2.jpg", altText: "Sammetsbänken placerad vid fotändan av en säng i ett mörkblått sovrum" },
        { id: "b379ce_94f83e449e1b4a2ba92f635f57ff35dd~mv2.jpg", altText: "Närbild på ett av de guldfärgade metallbenen" },
        { id: "b379ce_8ba4f7fcf00b449d96103ac39bb4eb32~mv2.jpg", altText: "Närbild på sammetsstoppningens knappar och sömmar" },
        { id: "b379ce_1bd1e2fd46a040b0be59074c852596e2~mv2.jpg", altText: "Måttritning som visar sittbänkens mått 118 x 45 x 42 cm" },
      ],
      raa: 327220797,
      tecken: 529
    },
    {
      kort: "cbba79ae",
      pid: "cbba79ae-5323-46e6-8031-de517a453da8",
      poster: [
        { id: "b379ce_0cfed13446594c11b1db8e4b1d63fb74~mv2.jpg", altText: "Väggmonterad aktivitetstavla i lastbilsform med fem lekzoner" },
        { id: "b379ce_2eedb6a369c04c54899dd60f51a04a9d~mv2.jpg", altText: "Två barn leker vid aktivitetstavlan, monterad på en vägg" },
        { id: "b379ce_24526d99a86f41e089b823eba8c7e913~mv2.jpg", altText: "Aktivitetstavlan monterad längs en låg vägg i en lekmiljö" },
        { id: "b379ce_1c4fa46841f346039fc480853b8e0440~mv2.jpg", altText: "Måttbild som visar aktivitetstavlans bredd 163,8 cm och höjd 40 cm" },
      ],
      raa: 493623863,
      tecken: 434
    },
    {
      kort: "a57587a8",
      pid: "a57587a8-89e9-4069-89da-357e765d1220",
      poster: [
        { id: "b379ce_393b1eabd92c4fcc9ca767c10d979241~mv2.jpg", altText: "Vitt barnkök med mikrovågsugn, spis och diskho" },
        { id: "b379ce_62e461d3f9db470abc92c39a47ba8e21~mv2.jpg", altText: "En vuxen och ett barn leker vid barnköket i ett grönt rum" },
        { id: "b379ce_51b67d93010146738ce703130e158e85~mv2.jpg", altText: "Barnköket med öppna luckor som visar förvaring och låtsasmat" },
        { id: "b379ce_7ce8574baaaa44be8c5b8c561caec632~mv2.jpg", altText: "Barnköket i ett ljust rum med leksaksdjur och möbler i bakgrunden" },
        { id: "b379ce_e67658bbb279432184fed4a3367193f7~mv2.jpg", altText: "Måttritning som visar barnkökets mått 83,8 x 26,8 x 81 cm jämfört med ett barns storlek" },
      ],
      raa: 207860619,
      tecken: 559
    },
    {
      kort: "a00b6e08",
      pid: "a00b6e08-be36-4225-b0a4-2c11d4f58687",
      poster: [
        { id: "b379ce_cc20c7083532491d9ab49ebe11b65b16~mv2.jpg", altText: "Vitt tvättställsskåp med två lådor och silverfärgade handtag" },
        { id: "b379ce_8e4e7774a60f4099b0823999b69e8e31~mv2.jpg", altText: "Tvättställsskåpet monterat under ett runt handfat i ett beige badrum" },
        { id: "b379ce_97d30b3bdeb14ef097ce52e47883d028~mv2.jpg", altText: "Måttritning som visar tvättställsskåpets mått 80 x 30 x 60 cm" },
      ],
      raa: 426913223,
      tecken: 335
    },
    {
      kort: "973e6901",
      pid: "973e6901-69df-4e20-9385-b86daf61d9ad",
      poster: [
        { id: "b379ce_7a25b86fd440490ab6bd3345333f9800~mv2.jpg", altText: "Vitt skrivbord i högglans med två lådor och vita metallben" },
        { id: "b379ce_ed8b11853f594df4bc9e24ebfe5b3b81~mv2.jpg", altText: "Skrivbordet i ett ljust rum med en bärbar dator, böcker och en växt" },
        { id: "b379ce_4e8732a870814763bece849921ddc56b~mv2.jpg", altText: "Skrivbordet i ett rum med en tavla, böcker och en blomvas" },
        { id: "b379ce_29bb5122b0cf4b9fa76205aa44e52b54~mv2.jpg", altText: "Skrivbordet uppifrån med tangentbord, mus och en skärm" },
        { id: "b379ce_54ae8d3ea63740b4b23bb58560859c1d~mv2.jpg", altText: "Måttritning som visar skrivbordets mått 100 x 50 x 75 cm samt maxbelastning" },
      ],
      raa: 115185271,
      tecken: 555
    },
    {
      kort: "7838bc0e",
      pid: "7838bc0e-535d-4628-bbbc-3d44ba73b7e5",
      poster: [
        { id: "b379ce_11b3b7e76b234bedaa1bca34df102d7a~mv2.jpg", altText: "Vitt barnkök med ugn, diskho och tvättmaskin" },
        { id: "b379ce_6019ad2bb91c4d8aa3288bfc3dd6e249~mv2.jpg", altText: "Ett barn i kockmössa och förkläde leker vid barnköket i ett rosa rum" },
        { id: "b379ce_fd0ce79c7e4f49b6bbebaf2ce482ec36~mv2.jpg", altText: "Närbild på en av barnkökets spisplattor" },
        { id: "b379ce_5a02d7637b9d4f0ab83b8c40361b0bcf~mv2.jpg", altText: "Måttritning som visar barnkökets mått 79,5 x 24 x 94 cm" },
      ],
      raa: 162135906,
      tecken: 401
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
