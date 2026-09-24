async function () {
  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };

  const PLAN = [
    {
      kort: "127ec9c8",
      pid: "127ec9c8-2bf5-4512-8fa6-ba516bbeb901",
      poster: [
        { id: "b379ce_8384748416224bbd89e64680d3514b6c~mv2.jpg", altText: "Halloweenskelett med rutig skjorta som kryper upp ur marken, med lysande ögon och mun" },
        { id: "b379ce_e747cd7b2cb3458190d093babf30402c~mv2.jpg", altText: "Skelettet i gräset framför ett mörkt hus" },
        { id: "b379ce_a9ed41c9fb354f3fa6c99ec6b2f7ab46~mv2.jpg", altText: "Närbild på skelettets skalle med trasigt tyg" },
        { id: "b379ce_bb079eb0438a486aa38861da0f1d039e~mv2.jpg", altText: "Närbild på skelettets hand och ärm" },
        { id: "b379ce_f253305cfdce462c8a7865be8614df4b~mv2.jpg", altText: "Måttbild: skelettet är 40 cm brett och 70 cm högt" },
      ],
      raa: 245589164,
      tecken: 496
    },
    {
      kort: "876e7e89",
      pid: "876e7e89-6330-4427-9603-95ad2445de63",
      poster: [
        { id: "b379ce_a3731696f371454a92bba28029b0e37b~mv2.jpg", altText: "Svart paraplyställ i metall med genombrutna ränder och krokar" },
        { id: "b379ce_ffa8ca9dc41644b588327863e55f7ed5~mv2.jpg", altText: "Paraplystället i en hall med paraplyer och en sittbänk" },
        { id: "b379ce_61f1e2ebeedf4cf9a13d59b7b6690bf4~mv2.jpg", altText: "Paraplystället med paraplyer bredvid en krukväxt" },
        { id: "b379ce_99abb084aa4d4454b6dd7c38c3b15c20~mv2.jpg", altText: "Närbild på paraplyställets nedre del" },
        { id: "b379ce_1ccc77eb384146359ea586ce99bfdb2a~mv2.jpg", altText: "Måttbild: paraplystället är 15,5 × 15,5 cm och 49 cm högt" },
      ],
      raa: 899954529,
      tecken: 500
    },
    {
      kort: "8cf7b1bb",
      pid: "8cf7b1bb-2517-4a6a-96b2-8dcdc7700962",
      poster: [
        { id: "b379ce_52c45e5cf8a2485ba78b85c7b5f07ef5~mv2.jpg", altText: "Fyra agilitybågar i orange och gult med röda fötter" },
        { id: "b379ce_f5a03bc6f531406dbb3b0bdd0b23b99e~mv2.jpg", altText: "En hund springer genom agilitybågarna på en gräsmatta" },
        { id: "b379ce_8c7acbbde0864b4ea8ce316b2e091ef2~mv2.jpg", altText: "Måttbild: en båge är 100 cm bred, 19,5 cm djup och 95 cm hög" },
      ],
      raa: 407685964,
      tecken: 310
    },
    {
      kort: "a08404ee",
      pid: "a08404ee-bc2c-417c-89cc-76dd344db527",
      poster: [
        { id: "b379ce_ecce8ba4d75a4465b04c40700c258918~mv2.jpg", altText: "Beige skyddsöverdrag över en möbelgrupp" },
        { id: "b379ce_87e1de21c4e348b29bd1e9fa420ad506~mv2.jpg", altText: "Överdraget på en altan i regn" },
        { id: "b379ce_49d399d0100b414c9db1c8979690c38c~mv2.jpg", altText: "Närbild på oxfordtygets väv" },
        { id: "b379ce_0533f54158fc4a63b9be68d008bc83b0~mv2.jpg", altText: "Överdraget hopvikt" },
        { id: "b379ce_45956e60d01b4f2eb5ef645e42d4c118~mv2.jpg", altText: "Måttbild: överdraget är 275 × 205 cm och 90 cm högt" },
      ],
      raa: 890917449,
      tecken: 408
    },
    {
      kort: "c031a4bc",
      pid: "c031a4bc-ebd7-4e4d-b2b9-71fccfd915cd",
      poster: [
        { id: "b379ce_fac2feedfabd46999350395d4e5f3304~mv2.jpg", altText: "Rund förvaringspall i gräddvit plisserad sammet med guldfärgade ben" },
        { id: "b379ce_16c3c7a8c3a846e3bdedf235f8c1df3c~mv2.jpg", altText: "Förvaringspallen vid ett fönster bredvid en vas med kvistar" },
        { id: "b379ce_c536bf4d8c974a7785af75afb6573010~mv2.jpg", altText: "En hand trycker på den stoppade sitsen" },
        { id: "b379ce_d7a0e60455154d03a89ade1d750fbf2f~mv2.jpg", altText: "Närbild på de guldfärgade benen" },
        { id: "b379ce_b6c00232349a47af8e762c1e60da59b4~mv2.jpg", altText: "Måttbild: pallen är 40 cm i diameter och 48 cm hög" },
      ],
      raa: 759021670,
      tecken: 489
    },
    {
      kort: "c4c404c5",
      pid: "c4c404c5-5b01-4d37-8a11-cc93d22df61b",
      poster: [
        { id: "b379ce_a19b2725f74c420fb65b35aa3cafe78f~mv2.jpg", altText: "Skräckdocka med flätor, rosa klänning och röda glödande ögon" },
        { id: "b379ce_7f8f89d77fbb42298918912798171677~mv2.jpg", altText: "Dockan på en kyrkogård med pumpor en halloweennatt" },
        { id: "b379ce_e9b4f6916b914391aa7eea2fd018e8b3~mv2.jpg", altText: "Dockan bakifrån med flätor och klolik hand" },
        { id: "b379ce_fe7e8399258f484cb247b644847a9af6~mv2.jpg", altText: "Närbild på den rosa klänningen" },
        { id: "b379ce_0a8b3c09ddf241e785b356d3d27943c4~mv2.jpg", altText: "Måttbild: dockan är 50 cm bred, 15 cm djup och 76 cm hög" },
      ],
      raa: 402300169,
      tecken: 482
    },
    {
      kort: "e03a7e2e",
      pid: "e03a7e2e-3d5c-40e9-9f5b-f95a4b4fee32",
      poster: [
        { id: "b379ce_f08d48955045437fbb3cc009aeb6e5d1~mv2.jpg", altText: "Växthylla i silvergrå metall med tre plan och fjärilar" },
        { id: "b379ce_0545877208a845ac81d3335b4d7487ed~mv2.jpg", altText: "Växthyllan med krukväxter på en altan" },
        { id: "b379ce_eb2ff23ee5ab4b4c9c4cc2abc5abf32d~mv2.jpg", altText: "Närbild på överdelen med snirklar och fjärilar" },
        { id: "b379ce_3d986c7c03624a3790f514d0d44d9f44~mv2.jpg", altText: "Närbild på en fjäril och ett hyllplan" },
        { id: "b379ce_652d6d615597448aab450ea92264b713~mv2.jpg", altText: "Måttbild: växthyllan är 44 cm bred, 25 cm djup och 96 cm hög, med fötter på 6 cm" },
      ],
      raa: 536705779,
      tecken: 498
    },
    {
      kort: "fa8d498b",
      pid: "fa8d498b-2e28-4eb7-8ed5-7922e7ddb718",
      poster: [
        { id: "b379ce_7981d233601a413fa091246e3d99b20f~mv2.jpg", altText: "Blomställ i trappform med fyra plan och krukväxter" },
        { id: "b379ce_8bd053cb803a48ed847a251f96a18291~mv2.jpg", altText: "Blomstället med växter bredvid ett bord på en uteplats" },
        { id: "b379ce_1ab1510c67b040a394dcee1999d52078~mv2.jpg", altText: "Närbild på en filttass under hyllan" },
        { id: "b379ce_56f5113aa1a04ec2aa65c01a752a4f2f~mv2.jpg", altText: "Närbild på den rustika bruna träytan" },
        { id: "b379ce_5533be49950b48d190a74997fdf451f4~mv2.jpg", altText: "Måttbild: blomstället är 40 × 40 × 81 cm, hyllorna 20 × 20 cm, på 81, 61,5, 40 och 21,5 cm höjd" },
      ],
      raa: 472828458,
      tecken: 514
    },
    {
      kort: "fca0d000",
      pid: "fca0d000-c3e1-407a-a423-8df1cf087792",
      poster: [
        { id: "b379ce_984ec4b476194fecaae94ea575729d6c~mv2.jpg", altText: "Rund förvaringspall i vit sherpa" },
        { id: "b379ce_83eba9b5e74d40329ba77d293e49abd4~mv2.jpg", altText: "En kvinna vilar fötterna på pallen framför soffan" },
        { id: "b379ce_09d084f859c04b6d8be8a45fe0f039e4~mv2.jpg", altText: "Pallen framför ett sminkbord" },
        { id: "b379ce_7fd785e97b0144c7be7c0809718ff821~mv2.jpg", altText: "Pallen bredvid en fåtölj i ett ljust vardagsrum" },
        { id: "b379ce_9fc0e1ddf9df4f0a88185e48f7765129~mv2.jpg", altText: "Måttbild: pallen är 36,5 cm i diameter och 46,5 cm hög och bär 120 kg, med locket vänt" },
      ],
      raa: 293270042,
      tecken: 486
    },
    {
      kort: "0a5d10dc",
      pid: "0a5d10dc-df20-4515-9178-61fbe54a2dbd",
      poster: [
        { id: "b379ce_f8c8e2c32e6c41a391f384c53fbdccfe~mv2.jpg", altText: "Skjutdörrsbeslag med två skendelar, hjul och monteringsdetaljer" },
        { id: "b379ce_9b661bc45f434cdda9a57d5931bc14b2~mv2.jpg", altText: "En skjutdörr i trä monterad på beslaget" },
        { id: "b379ce_0bae8394df054442870e4fcac6b57cdd~mv2.jpg", altText: "Närbild på ett hjul på skenan" },
        { id: "b379ce_7bd45e8ebc1d431fbd6f459da8961d5c~mv2.jpg", altText: "Närbild på de två hjulen med bultar" },
        { id: "b379ce_2004ae8af66d4be0b2b694de775a2c49~mv2.jpg", altText: "Måttbild: skenan är 200 cm och hjulen 6,9 × 5 × 29 cm" },
      ],
      raa: 564859743,
      tecken: 463
    },
    {
      kort: "5a6001cf",
      pid: "5a6001cf-943c-42a8-8338-f85469b73477",
      poster: [
        { id: "b379ce_4aea4ba090bd4fd991a09c8537dd117c~mv2.jpg", altText: "Gåvagn i trä med aktivitetspanel, formklossar och klubba" },
        { id: "b379ce_e0631e29a8c940eba74dcb4f8639644a~mv2.jpg", altText: "Ett småbarn går med gåvagnen medan en kvinna sitter på golvet" },
        { id: "b379ce_544b7027647f4da4b4b9e1abe40d815f~mv2.jpg", altText: "Närbild på spegeln, kugghjulen och bildklossarna" },
        { id: "b379ce_b2f9bdc4c1774701969b47c53e2fcaca~mv2.jpg", altText: "Gåvagnen på en matta i ett barnrum" },
        { id: "b379ce_c579f1f430654e0a8e79bd2bc20e99f5~mv2.jpg", altText: "Måttbild: gåvagnen är 33,5 × 36 × 46,8 cm" },
      ],
      raa: 335637519,
      tecken: 484
    },
    {
      kort: "eefbc35f",
      pid: "eefbc35f-0b9d-466d-b005-5aa820148fa8",
      poster: [
        { id: "b379ce_42d45f31809e400cb92ee87386dba73d~mv2.jpg", altText: "Zombieskelett i svart rock med röda ögon och grön mun" },
        { id: "b379ce_873b271a410543dd854ece27c3267563~mv2.jpg", altText: "Skelettet på en kyrkogård med pumpor" },
        { id: "b379ce_e997f739bad64cf79d1b926595a91240~mv2.jpg", altText: "Skelettet framför ett hus pyntat för halloween" },
        { id: "b379ce_9b506d2cabb544eeba2012d4c0cafeec~mv2.jpg", altText: "Skelettet på en gräsmatta framför en veranda" },
        { id: "b379ce_35fc6060a7914c51a77ed7b33050395e~mv2.jpg", altText: "Måttbild: skelettet är 102 cm brett och 75 cm högt" },
      ],
      raa: 513093653,
      tecken: 473
    },
    {
      kort: "a6a16df2",
      pid: "a6a16df2-4a9b-46c1-9b19-0b60b6d9bc20",
      poster: [
        { id: "b379ce_e655f35f891046388c9dbe881588108d~mv2.jpg", altText: "Fotpall med svängd sits i ljusgrå teddyfleece och ben i bok" },
        { id: "b379ce_11c89340097b4847a9bfe0b021c290ac~mv2.jpg", altText: "Fotpallen framför en grå soffa" },
        { id: "b379ce_bc3fe16857d1491d96288a66e614494c~mv2.jpg", altText: "En kvinna vilar fötterna på fotpallen" },
        { id: "b379ce_bf6788a61809475aafffd0340edf12f1~mv2.jpg", altText: "Närbild på en filttass under ett ben" },
        { id: "b379ce_c5a0824669504ec98cff30b5dab6fab8~mv2.jpg", altText: "Måttbild: fotpallen är 67 × 45 × 38 cm med 24 cm höga ben och bär 120 kg" },
      ],
      raa: 809527498,
      tecken: 478
    },
    {
      kort: "af9c163f",
      pid: "af9c163f-12dc-4204-ae2e-1b52169dcd8c",
      poster: [
        { id: "b379ce_ec526d1dacf840f59153b4dedd08329e~mv2.jpg", altText: "Mattsvart pedalhink på 20 l" },
        { id: "b379ce_6bfd7586da4f4f34a98683c292dd5b23~mv2.jpg", altText: "Pedalhinken i ett kök bredvid en köksö" },
        { id: "b379ce_278ddcfec245493ea4b7a6a8aaec7fc8~mv2.jpg", altText: "Pedalhinken bredvid en krukväxt" },
        { id: "b379ce_dda330f46d654a0c8d74792854b193a5~mv2.jpg", altText: "Pedalhinken i ett vardagsrum" },
        { id: "b379ce_a3afe8583bf242e4895c281ad5af36b2~mv2.jpg", altText: "Måttbild: hinken är 34,2 × 30,6 × 44,2 cm och 67 cm hög med öppet lock, innerhinken 30 × 20 × 41 cm" },
      ],
      raa: 925479176,
      tecken: 467
    },
    {
      kort: "c311e18f",
      pid: "c311e18f-9fce-48ce-b890-8a6169ded050",
      poster: [
        { id: "b379ce_57b387b590a44b17a6fa130a39ced22f~mv2.jpg", altText: "Gräsmattsluftare med grön spikvals och långt skaft" },
        { id: "b379ce_d824093279b64ebcb4c91eadb17d03e5~mv2.jpg", altText: "En man drar luftaren över gräsmattan" },
        { id: "b379ce_06162daccd1a4569ba643040e3642184~mv2.jpg", altText: "Luftaren vid en rabatt" },
        { id: "b379ce_e2bca12dfd2a4565af17b39c59d149a4~mv2.jpg", altText: "Närbild på skaftets fäste och spikvalsen" },
        { id: "b379ce_663ee0b7ca0f4d4eb02177d268bb0b67~mv2.jpg", altText: "Måttbild: luftaren är 45 cm bred och 140 cm hög, med skaft på 100 cm" },
      ],
      raa: 160485776,
      tecken: 460
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
