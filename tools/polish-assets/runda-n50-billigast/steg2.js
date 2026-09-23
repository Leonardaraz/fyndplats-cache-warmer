async function () {
  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };

  const PLAN = [
    {
      kort: "10fe3278",
      pid: "10fe3278-cb72-4cbf-90ff-9038506050cc",
      poster: [
        { id: "b379ce_bc6e8a98b22e43c58659bd3a88ec0a82~mv2.jpg", altText: "Pokerset i en öppen silverfärgad väska med marker, kortlekar och kortutdelare, bredvid en kortblandare och en grön spelmatta med tärningar" },
        { id: "b379ce_8291134a191b4c8688bb968b02d55393~mv2.jpg", altText: "Två personer spelar kort vid ett bord med den gröna spelmattan, marker och kortblandaren" },
        { id: "b379ce_2cc85d5207b84abc996b35b1eaabc06a~mv2.jpg", altText: "Måttbild: väskan är 36 × 30 cm och spelmattan 90 × 60 cm" },
      ],
      raa: 454018157,
      tecken: 428
    },
    {
      kort: "5fce6a95",
      pid: "5fce6a95-9304-4bc0-b74a-38f2b89273ca",
      poster: [
        { id: "b379ce_9256113b9c33416dad05ab70f1a0d527~mv2.jpg", altText: "Tomt vedställ i svart stål, sett snett framifrån" },
        { id: "b379ce_b1e5fe53da6c4b7db113e031fa9395b6~mv2.jpg", altText: "Vedstället fyllt med kluven ved mot en vit panelvägg" },
        { id: "b379ce_1a9eeb9cbdf542c7895467ed743f0ba8~mv2.jpg", altText: "Närbild på ett hörn av vedställets ram i svartlackerat stål" },
        { id: "b379ce_5c5a960e9a554c1286f19803d37b8b27~mv2.jpg", altText: "Närbild på tvärstagen mellan vedställets ramar" },
        { id: "b379ce_a3bf41fc94ed4cc8836bfe99ecac40e1~mv2.jpg", altText: "Måttbild: vedstället är 60 × 25 × 100 cm" },
      ],
      raa: 43445217,
      tecken: 489
    },
    {
      kort: "cc5b0c14",
      pid: "cc5b0c14-429c-4263-966a-0bced1ae857d",
      poster: [
        { id: "b379ce_d3fd7e41e2be4b96b847ec7f1c175391~mv2.jpg", altText: "Spökdocka med långt svart hår, röda lysande ögon och trasig beige klänning" },
        { id: "b379ce_30f05c70d69041d9b404347e81ab240c~mv2.jpg", altText: "Spökdockan framför ett mörkt, övergivet hus i skogen" },
        { id: "b379ce_1f66b2ae11234505b6397742875f7eb7~mv2.jpg", altText: "Närbild på spökdockans klohand och trasiga klänning med grön gasväv" },
        { id: "b379ce_e2e18f6679454d1485f097f4ea7dfd6f~mv2.jpg", altText: "Spökdockan sittande på golvet bredvid en lykta och pumpor" },
        { id: "b379ce_11b5dd7c4187454ebf75f2d109d18826~mv2.jpg", altText: "Måttbild: spökdockan är 83 cm hög" },
      ],
      raa: 48552193,
      tecken: 527
    },
    {
      kort: "e797e8a4",
      pid: "e797e8a4-d87a-4782-8c70-28a6fbe7b21c",
      poster: [
        { id: "b379ce_ce06aeee5df1471ca8d4e02293238799~mv2.jpg", altText: "Tvättkorg i bambu med ribbor, lock och vit tvättpåse" },
        { id: "b379ce_52805e53ebc241f89e810a29a2768897~mv2.jpg", altText: "Tvättkorgen i ett sovrum bredvid ett vitt sängbord" },
        { id: "b379ce_9f2023f1eb9a4b1ab0a9afb7265871cb~mv2.jpg", altText: "Närbild på lockets gångjärn och den vita tvättpåsen" },
        { id: "b379ce_0ae8c189efbd4d33a68d646b3ea69072~mv2.jpg", altText: "Närbild på bambuns ribbor och ett av benen" },
        { id: "b379ce_a73c77c69a754984b404f0e4e0a5bb82~mv2.jpg", altText: "Måttbild: tvättkorgen är 50 × 36 × 60 cm" },
      ],
      raa: 67061479,
      tecken: 479
    },
    {
      kort: "e947f7aa",
      pid: "e947f7aa-0251-4a15-881e-25cd878cdab0",
      poster: [
        { id: "b379ce_6249832fc5284941bc7be2de6abbf04a~mv2.jpg", altText: "Vattenkokare i glas och rostfritt stål med tesil och knappar på basen" },
        { id: "b379ce_fa02378009d34d88a7b048747cda9d71~mv2.jpg", altText: "Vattenkokaren lyser blått när den kokar, på en köksbänk i marmor" },
        { id: "b379ce_244e60b865214b0da53abe04898d556f~mv2.jpg", altText: "Vattenkokaren på ett träbord bredvid en tekopp och en burk med teblad" },
        { id: "b379ce_dcb3d5b307a74073821e266297877ce3~mv2.jpg", altText: "Måttbild: vattenkokaren är 26,3 cm hög" },
      ],
      raa: 833978833,
      tecken: 435
    },
    {
      kort: "0598eff2",
      pid: "0598eff2-7582-4152-9995-fd78563495c4",
      poster: [
        { id: "b379ce_12cab1d4f29747be9c3bfb8f41cb848f~mv2.jpg", altText: "Vitt väggskåp med vågformad dörrkant i trä och ett öppet fack under" },
        { id: "b379ce_e77587c8e9f4483783b60b2092e4c399~mv2.jpg", altText: "Väggskåpet på en badrumsvägg med tandborstar och flaskor i det öppna facket" },
        { id: "b379ce_5c05f31765c24213866525ea3ac2aed5~mv2.jpg", altText: "Väggskåpet uppe till vänster i ett badrum med andra möbler i samma stil" },
        { id: "b379ce_4ef1bfbd5f56415b8f51b43605a5bbe3~mv2.jpg", altText: "Väggskåpet med öppen dörr och burkar med kryddor och nötter på hyllorna" },
        { id: "b379ce_ffd136eb86cb4601917deae7ea1ee179~mv2.jpg", altText: "Måttbild: väggskåpet är 30 × 17 × 67 cm" },
      ],
      raa: 220334098,
      tecken: 567
    },
    {
      kort: "007c6422",
      pid: "007c6422-b9af-4f68-98c9-73f194dca92b",
      poster: [
        { id: "b379ce_cc231ba4b77646ed99fec30db7535c98~mv2.jpg", altText: "Sängbord i rustikt brunt med svart metallram, öppna hyllor, sidoficka och grenuttag med sladd" },
        { id: "b379ce_e73b73b2ce9244e7b5ea400421a06b1a~mv2.jpg", altText: "Sängbordet bredvid ett staffli, med färgburkar och böcker på hyllorna" },
        { id: "b379ce_745b0f75b7b84de484ef2fecd93b3884~mv2.jpg", altText: "Sängbordet bredvid en säng med en lampa inkopplad i grenuttaget" },
        { id: "b379ce_c3ae016ff3e643509b6686499b6cc98d~mv2.jpg", altText: "En man med dator i soffan bredvid sängbordet" },
        { id: "b379ce_c694a02ef2ea4ffeb3bc62946acba4e0~mv2.jpg", altText: "Måttbild: sängbordet är 60 × 29,8 × 58,5 cm och bär 21 kg" },
      ],
      raa: 166933629,
      tecken: 570
    },
    {
      kort: "536e0244",
      pid: "536e0244-a8d3-4212-b470-447a558780c6",
      poster: [
        { id: "b379ce_eea64ea05eb04b67a565502b52415df5~mv2.jpg", altText: "Hopfällbar hage i grått och ljusblått med nätfönster, dörr och topplucka" },
        { id: "b379ce_fb187af80e874909b55fcaef4f7496ad~mv2.jpg", altText: "Hagen på en gräsmatta i en park med en hund inuti och en kvinna med en hund bredvid" },
        { id: "b379ce_3f983320eb9b4ed39eeb804eeb8cf964~mv2.jpg", altText: "Hagen med öppen topplucka på en matta i ett vardagsrum" },
        { id: "b379ce_ec1598838a3249b587a069d43869814f~mv2.jpg", altText: "Närbild på hagens nätfönster och sidofickor" },
      ],
      raa: 279567384,
      tecken: 447
    },
    {
      kort: "7fdf42e9",
      pid: "7fdf42e9-40fb-4975-bb73-788c01da8ca5",
      poster: [
        { id: "b379ce_b071f6133fa44dbf8efe6fb1186d4d4b~mv2.jpg", altText: "Runt sidobord med ljus ekfärgad skiva, hylla i rökglas och svarta metallben" },
        { id: "b379ce_2e726c6775dd4603a2ad2005849a0892~mv2.jpg", altText: "Sidobordet bredvid en beige soffa med en vas och en kaffekopp på skivan" },
        { id: "b379ce_ffd541aff1c542398c94cf156aae24a9~mv2.jpg", altText: "Sidobordet bredvid en säng med böcker och en vas på skivan" },
        { id: "b379ce_88ee0043efd44806a000f148d179c3c2~mv2.jpg", altText: "Sidobordet bredvid en ljusgrå fåtölj med ett ljus och en vas på skivan" },
        { id: "b379ce_387d4e8b8fe6474c82f2bf55a75bc9ea~mv2.jpg", altText: "Måttbild: sidobordet är 41,8 × 39,8 × 53,5 cm och bär 15 kg" },
      ],
      raa: 282300350,
      tecken: 577
    },
    {
      kort: "ad88f2b4",
      pid: "ad88f2b4-e89b-42ab-8c86-72bcb28e3c9c",
      poster: [
        { id: "b379ce_6d6881f355954ebe925ebefa05cdb892~mv2.jpg", altText: "Smalt, tomt vedställ i svart stål med tvärstag mellan ramarna" },
        { id: "b379ce_63ba85b3fc8e4c989f7bebcdbb4ed892~mv2.jpg", altText: "Vedstället fullt med ved på en uteplats bredvid en murad eldstad" },
        { id: "b379ce_ba2bd0f57a704881bc3830cbb17babdb~mv2.jpg", altText: "Närbild på ett hörn av vedställets svarta stålram" },
        { id: "b379ce_a1aee17482564828b98045521a160fc2~mv2.jpg", altText: "Vedstället med ved bredvid en öppen spis i ett vardagsrum" },
        { id: "b379ce_8a5a303cdd0b49f4b6427279b58526c4~mv2.jpg", altText: "Måttbild: vedstället är 40 × 25 × 100 cm" },
      ],
      raa: 659508240,
      tecken: 515
    },
    {
      kort: "e138b637",
      pid: "e138b637-5b47-409d-bca3-7b78463b3578",
      poster: [
        { id: "b379ce_a7326402d7f74f6bb8fab83b3afbc7b1~mv2.jpg", altText: "Lyftbock för motorcykel i rött stål med svart gummimatta och handtag" },
        { id: "b379ce_49ac31fd5cb34bafa1f6b8fcf383f6a8~mv2.jpg", altText: "En grön motorcykel upplyft på den röda lyftbocken på en gata" },
        { id: "b379ce_65f051e9b2c34469b08dee13674a54b7~mv2.jpg", altText: "Närbild på lyftmekanismen under plattformen" },
        { id: "b379ce_77a6344ad6a841209ef1d05752f5848f~mv2.jpg", altText: "Närbild på handtaget med svart gummigrepp" },
        { id: "b379ce_847c405d2cae4ac082d5c89b317c7afc~mv2.jpg", altText: "Måttbild: lyftbocken är 48 × 34 × 43 cm och lyfter till 27,5 eller 39,5 cm" },
      ],
      raa: 590704396,
      tecken: 530
    },
    {
      kort: "e7bbadb2",
      pid: "e7bbadb2-1e3a-423b-8bd1-ecb63b494f6b",
      poster: [
        { id: "b379ce_db938c08cdf6475bbb4abee518748760~mv2.jpg", altText: "Tv-bänk i svart med två mörkgrå tyglådor och en öppen hylla" },
        { id: "b379ce_29725f0990324bffa437a34c2e095ffa~mv2.jpg", altText: "Tv-bänken med en tv, en spelkonsol och en förstärkare i ett ljust vardagsrum" },
        { id: "b379ce_c21cd803a4a341a7ba7ff37dddb4c014~mv2.jpg", altText: "Tv-bänken ovanifrån med öppna tyglådor" },
        { id: "b379ce_b971e9de05944777a1fd4bfc30180656~mv2.jpg", altText: "Tv-bänken med en tv, en radio och en spelkonsol mot en ljus vägg" },
        { id: "b379ce_df59d5d9e5f445e8bd3574a768c37347~mv2.jpg", altText: "Måttbild: tv-bänken är 98 × 29 × 56 cm och bär 41 kg" },
      ],
      raa: 945575328,
      tecken: 533
    },
    {
      kort: "17595feb",
      pid: "17595feb-4289-4613-aefa-c70ab9e273ea",
      poster: [
        { id: "b379ce_55dc1fc4c076404abe8e1559f20f22b3~mv2.jpg", altText: "Darttavla i sisal med svart skyddsring och sex pilar med blå och röda fjädrar" },
        { id: "b379ce_9376bc7ae4ea4a5ea5e12426e4520f94~mv2.jpg", altText: "En man kastar pil mot darttavlan i ett källarrum medan en kvinna tittar på" },
        { id: "b379ce_d386e236771d4d25837c72cbbe20f06a~mv2.jpg", altText: "En kvinna kastar pil mot darttavlan i ett vardagsrum" },
        { id: "b379ce_403ee2e4b40d445185e5a1cc56082807~mv2.jpg", altText: "En kvinna kastar pil mot darttavlan i ett ljust vardagsrum med en soffa" },
        { id: "b379ce_89486a6323f6415691d333edd40b8ac3~mv2.jpg", altText: "Måttbild: tavlan är Ø45,5 cm och 71,5 cm med skyddsringen" },
      ],
      raa: 825877873,
      tecken: 575
    },
    {
      kort: "261484e7",
      pid: "261484e7-7efd-4384-99d5-7464b7e45647",
      poster: [
        { id: "b379ce_b3eb0f8220c442bfab68a34450a5c5f0~mv2.jpg", altText: "Gnistskydd i svart metallnät med välvd mittpanel och sidopaneler med handtag" },
        { id: "b379ce_cf49efdf1e6b42cca424255128df65e9~mv2.jpg", altText: "Gnistskyddet framför en öppen spis med vit omfattning och en julgran bredvid" },
        { id: "b379ce_dda4c61670fa4e2ebb085933349b9fb0~mv2.jpg", altText: "Närbild på det svarta metallnätet framför elden" },
        { id: "b379ce_9d5f7f193bd64c7fb241715e4deb73ae~mv2.jpg", altText: "Gnistskyddet framför en öppen spis med vit spiselkrans och en fåtölj bredvid" },
        { id: "b379ce_aeb21079b5d447fba07b26d7e777d706~mv2.jpg", altText: "Måttbild: gnistskyddet är 110 cm brett utfällt och 76,5 cm högt" },
      ],
      raa: 469122239,
      tecken: 582
    },
    {
      kort: "a6820dd0",
      pid: "a6820dd0-0bf8-4dee-876d-dc6c62ea6bad",
      poster: [
        { id: "b379ce_062111f6ad8e4d02aaa98156bdb172bd~mv2.jpg", altText: "Spökbrud med dödskalle, vit spetsslöja och vit dräkt med svart blommönster" },
        { id: "b379ce_404532acce8f4f7daf75fd2bb23f0fcc~mv2.jpg", altText: "Spökbruden framför ett mörkt, övergivet hus" },
        { id: "b379ce_80ea5cf97558484ea4999b51e7dfc3e4~mv2.jpg", altText: "Närbild på spökbrudens dödskalle med röda ögon under spetsslöjan" },
        { id: "b379ce_4742869cea804a50b23dba6b30a27591~mv2.jpg", altText: "Spökbruden i en hall bredvid pumpor och en lykta" },
        { id: "b379ce_c4e99ebe9d7b4bfb9c41537d80d04229~mv2.jpg", altText: "Måttbild: spökbruden är 178 cm hög" },
      ],
      raa: 438612788,
      tecken: 507
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
