async function () {
  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };

  const PLAN = [
    {
      kort: "115d3831",
      pid: "115d3831-2ca2-4b50-9d32-8e9736a84d0a",
      poster: [
        { id: "b379ce_c9c18f0f4c6740c4b5a8fb83d967766d~mv2.jpg", altText: "Springcykel i trä med ljusblå sadel och handtag och en röd flamma på ramen" },
        { id: "b379ce_a48bf9883ae64b63a3268bf5f49b4b0b~mv2.jpg", altText: "Ett barn åker springcykel på ett torg med fontäner" },
        { id: "b379ce_8d8567589d3f4f5bb5b152e008a48999~mv2.jpg", altText: "Ett barn i röd tröja åker springcykeln i en park" },
        { id: "b379ce_bf12f4dfa6614579bafe72413c578e20~mv2.jpg", altText: "Ett barn åker springcykel på en gångväg vid en lekplats" },
      ],
      raa: 708794743,
      tecken: 422
    },
    {
      kort: "5eb079d2",
      pid: "5eb079d2-4018-43a4-8b1a-dec5cbb2e48d",
      poster: [
        { id: "b379ce_9a5e63adf98f4caaac3fe48ebc8517a3~mv2.jpg", altText: "Rund förvaringspall i beige tyg med juteyta och ben i trä" },
        { id: "b379ce_9ac005ebef3044af92041c1b4aa3b663~mv2.jpg", altText: "En person vilar fötterna på pallen framför soffan" },
        { id: "b379ce_5fd29bd502d646d69bb6977eeaf72eee~mv2.jpg", altText: "En kvinna sitter på en pall och knyter skorna, med en andra pall bredvid" },
        { id: "b379ce_509792bb5cd9432c90b6f5db4c9f0602~mv2.jpg", altText: "Två pallar vid soffan, den ena med locket vänt som bord" },
        { id: "b379ce_cb53aaa2f075417b95317cc824849836~mv2.jpg", altText: "Måttbild: pallen är 38,5 cm i diameter och 33,5 cm hög, förvaringen 35,5 × 19 cm, och bär 120 kg" },
      ],
      raa: 709681583,
      tecken: 573
    },
    {
      kort: "0dff6d43",
      pid: "0dff6d43-4deb-47d2-a7a3-3b43e1b64cb5",
      poster: [
        { id: "b379ce_0de98b21dfbe43178ab0c2d82bd73ded~mv2.jpg", altText: "Pokerset i öppen aluminiumväska med marker, kortlekar, tärningar och dealerknapp" },
        { id: "b379ce_32f1e57a331043288d208c14ab9d5190~mv2.jpg", altText: "Pokersetet på ett grönt spelbord med marker och kort framför väskan" },
        { id: "b379ce_b395874c1c8044de895e1520afbacd33~mv2.jpg", altText: "Blå pokermarker i högar" },
        { id: "b379ce_14bba208e670494caab8999c64185f80~mv2.jpg", altText: "Måttbild: markerna är Ø40 × 3,3 mm, tärningarna 18 mm, dealerknappen Ø50 × 5 mm och väskan 55,5 × 22 × 6,5 cm" },
      ],
      raa: 960837296,
      tecken: 474
    },
    {
      kort: "12c11f43",
      pid: "12c11f43-1791-4828-8463-d4ef2abd9f25",
      poster: [
        { id: "b379ce_61b89b3736a340fda6fe76ac4af580c8~mv2.jpg", altText: "Pall med stoppad sits i beige tyg och ben i ljust trä" },
        { id: "b379ce_b55b882fc7294cab99c20fa11b606d0b~mv2.jpg", altText: "En kvinna vilar fötterna på pallen framför en fåtölj" },
        { id: "b379ce_3aa3c0388a994980a0111a041c331ec2~mv2.jpg", altText: "Närbild på den snidade rosetten i hörnet och det svarvade benet" },
        { id: "b379ce_f650ad3c3deb47b7996b7c55889b86b5~mv2.jpg", altText: "Närbild på sitsens knappar" },
        { id: "b379ce_51d264b2f8b1457bb54dbe80854171ac~mv2.jpg", altText: "Måttbild: pallen är 42 × 32 cm och 46,5 cm hög och bär 120 kg" },
      ],
      raa: 569119909,
      tecken: 499
    },
    {
      kort: "4c8d9de4",
      pid: "4c8d9de4-fd02-4879-a248-e4bb444980c3",
      poster: [
        { id: "b379ce_71ac34c2254c405c9fe89c4b864038f8~mv2.jpg", altText: "Smal konstgjord julgran med konstsnö på en fot av stål" },
        { id: "b379ce_e2efbb1e3b324bbfbea7d069a3e203f6~mv2.jpg", altText: "Julgranen i ett rum med röda väggar och julklappar under" },
        { id: "b379ce_ee8a26b46ae04e67a99e2633ef7343b4~mv2.jpg", altText: "Julgranen pyntad med kulor i ett vitt vardagsrum" },
        { id: "b379ce_643978ed4f004ae884672c3dbf9d3520~mv2.jpg", altText: "Närbild på grenar med konstsnö" },
        { id: "b379ce_5ee0eb0adf5848519c6b82c888145aee~mv2.jpg", altText: "Måttbild: granen är 65 cm bred och står bredvid en mansfigur i samma höjd" },
      ],
      raa: 525911978,
      tecken: 505
    },
    {
      kort: "63a725ab",
      pid: "63a725ab-9224-41b7-8e35-c1fe1a2aa5fc",
      poster: [
        { id: "b379ce_8ad60b4598b344c791eddf6b539c6263~mv2.jpg", altText: "Golvlampa i guldfärgad metall med böjd arm och rund tygskärm" },
        { id: "b379ce_3b47ad0e84224ec9973272c168e623ab~mv2.jpg", altText: "Golvlampan tänd i ett ljust vardagsrum bredvid en soffa" },
        { id: "b379ce_191a81da5b1841e3bf9a1db3b436f834~mv2.jpg", altText: "Golvlampan bredvid två fåtöljer" },
        { id: "b379ce_fafeeaa34dea4d719c833915e000f71b~mv2.jpg", altText: "Golvlampan tänd i ett sovrum bredvid en byrå" },
        { id: "b379ce_0affc3cdf9d74233a3009a496c98e733~mv2.jpg", altText: "Måttbild: skärmen är 28 cm i diameter och 22,5 cm hög, och foten är 25 cm bred och 3 cm hög" },
      ],
      raa: 341534348,
      tecken: 525
    },
    {
      kort: "7720d168",
      pid: "7720d168-8e4d-4391-bd54-15f33ab87191",
      poster: [
        { id: "b379ce_fab99c78b6404bbf83c0c7e4fd04f744~mv2.jpg", altText: "Lekkök i mintgrönt och gräddvitt med spis, ugn, diskho och tillbehör" },
        { id: "b379ce_576a5ecc0177474aa295f7542af759ee~mv2.jpg", altText: "Ett barn i kockmössa leker med lekköket" },
        { id: "b379ce_0a8ae1018b12414d8d2a2eb0231f74c7~mv2.jpg", altText: "Närbild på köksredskapen som hänger på köket" },
        { id: "b379ce_a58018ea14e0404c9f8e267782e86607~mv2.jpg", altText: "Måttbild: köket är 44,5 cm brett, 24 cm djupt och 79 cm högt, med arbetshöjd 41 cm" },
      ],
      raa: 164582039,
      tecken: 428
    },
    {
      kort: "8382289b",
      pid: "8382289b-0e16-463b-a09e-17fa2bd242b5",
      poster: [
        { id: "b379ce_dcb9f8309b7c475da9d34f8c7e12d0ec~mv2.jpg", altText: "Blomställ i svart metall med sex runda hyllor" },
        { id: "b379ce_702b09c1904e45f2b6497cf4c20b7a23~mv2.jpg", altText: "Blomstället med krukväxter mot en vit vägg" },
        { id: "b379ce_06353812ad7746669b045fb0db53ec8d~mv2.jpg", altText: "Blomstället med blommor på en uteplats vid ett staket" },
        { id: "b379ce_a921761ae27d444ea4a898c515f70bee~mv2.jpg", altText: "Närbild på ett ben med fotkåpa" },
        { id: "b379ce_53f75b51bba144739a7cfc9d609d6107~mv2.jpg", altText: "Måttbild: blomstället är 60 × 40 × 80 cm, hopfällt 25 × 23 cm, och varje hylla bär 20 kg" },
      ],
      raa: 638314989,
      tecken: 502
    },
    {
      kort: "875ca38b",
      pid: "875ca38b-a1fc-4fc2-979c-36dc2033b107",
      poster: [
        { id: "b379ce_e415a1f5e3944382a614d98fe2c861bb~mv2.jpg", altText: "Vinhylla i svart stålrör med åtta plan" },
        { id: "b379ce_4fe935c9520e424ab3c4e101ff980556~mv2.jpg", altText: "Vinhyllan med åtta flaskor på en vägg ovanför en skänk" },
        { id: "b379ce_0b1292eb6a1b4225a806d3b38c74dde1~mv2.jpg", altText: "Två vinhyllor bredvid varandra på en vägg ovanför en skänk" },
        { id: "b379ce_f32951b8444a47d99effe8fe7d7826ab~mv2.jpg", altText: "Två vinhyllor på en vägg i ett matrum" },
        { id: "b379ce_aa1dc1fdf304422e89969a2751ec0e2c~mv2.jpg", altText: "Måttbild: vinhyllan är 27 × 10 cm och 93,5 cm hög och bär 16 kg" },
      ],
      raa: 945868630,
      tecken: 494
    },
    {
      kort: "96451d83",
      pid: "96451d83-733f-4ade-bc8d-e02b4f8fb9cc",
      poster: [
        { id: "b379ce_2dbf0496eb914bd8b76b18afbb4080ca~mv2.jpg", altText: "Rutschkana i blått och vitt formad som en giraff, med basketkorg och boll" },
        { id: "b379ce_4e794dd7749d421a929dc10014f9d2c3~mv2.jpg", altText: "Ett småbarn sitter på rutschkanan medan en kvinna tittar på" },
        { id: "b379ce_e049c429ed0e40728010e5cb8a08e5c5~mv2.jpg", altText: "Närbild på giraffhuvudet och stegen" },
        { id: "b379ce_4446df93103141ab8236d28937fd06bb~mv2.jpg", altText: "Rutschkanan i ett barnrum" },
        { id: "b379ce_5d126910ba504f98996a9d21c1728ce1~mv2.jpg", altText: "Måttbild: rutschkanan är 106 × 51,5 × 52 cm, rutschbanan 96 × 32 cm och korgen Ø15 cm" },
      ],
      raa: 898075497,
      tecken: 521
    },
    {
      kort: "b69e5b38",
      pid: "b69e5b38-0903-4e32-871d-84df5dd899a1",
      poster: [
        { id: "b379ce_e18785d36df6462b858586e05f1e8b61~mv2.jpg", altText: "Blomställ i trappform i svart metall med tre gallerhyllor" },
        { id: "b379ce_111c8ff0369542ca9a3b420c411ac0fb~mv2.jpg", altText: "Blomstället fullt med krukväxter mot en vägg" },
        { id: "b379ce_decb7c35e51f44bba8e4ebc7e3c39574~mv2.jpg", altText: "Blomstället med krukväxter på en uteplats" },
        { id: "b379ce_98005d5b863242b9b16c716182bf4fbd~mv2.jpg", altText: "Blomstället med krukväxter bredvid en kaktus" },
        { id: "b379ce_9d96368161754b3f96566cbc323d5559~mv2.jpg", altText: "Måttbild: blomstället är 75 × 70 cm och 66 cm högt, hyllorna 72 × 23 cm på 64, 42 och 20 cm höjd" },
      ],
      raa: 722647553,
      tecken: 526
    },
    {
      kort: "cc7ab001",
      pid: "cc7ab001-a015-4640-89c6-de69e41dd546",
      poster: [
        { id: "b379ce_c8e7ee22070f4a68abdc21a9cd6d84ce~mv2.jpg", altText: "Agilityset för hund med hinder, ring, sex slalomkäppar och blå bärväska" },
        { id: "b379ce_c92442cb0ab5416c80ffd4b0cd143e34~mv2.jpg", altText: "En hund springer mellan slalomkäpparna på en gräsmatta" },
        { id: "b379ce_98813bddb3514c06aed4846dea32efd6~mv2.jpg", altText: "Närbild på ringens kardborrfäste" },
        { id: "b379ce_24f7d09ffe62440d80e342b218e479eb~mv2.jpg", altText: "Närbild på måttskalan på en käpp" },
        { id: "b379ce_b927e1bbbd254a69b940c06117403c5a~mv2.jpg", altText: "Måttbild: hindret är 128 cm brett och käpparna 100 cm höga med fötter på 23 cm" },
      ],
      raa: 356824293,
      tecken: 511
    },
    {
      kort: "ce59dcf5",
      pid: "ce59dcf5-f188-4d89-8633-a17a66915f02",
      poster: [
        { id: "b379ce_44159cc17bbd4079893a9679dd56be6d~mv2.jpg", altText: "Hylla i bambu med fyra öppna plan" },
        { id: "b379ce_7d76718106054a13a328d24c9e7d021d~mv2.jpg", altText: "Bambuhyllan med böcker och prydnadssaker bredvid en soffa" },
        { id: "b379ce_13ef02cbf49c4bf1bfd4caffd5e58629~mv2.jpg", altText: "Närbild på böcker och en korg på hyllan" },
        { id: "b379ce_95d83d79e8224fecafab2e34836c2d9e~mv2.jpg", altText: "Närbild på hyllplanets bambuspjälor" },
        { id: "b379ce_eb3307a2d608450484bf6b3a0d1722dd~mv2.jpg", altText: "Måttbild: hyllan är 62 × 33 cm och 112 cm hög, med 17 cm under det nedersta planet" },
      ],
      raa: 413295647,
      tecken: 490
    },
    {
      kort: "f0817bea",
      pid: "f0817bea-845b-454a-bf32-8e91ceda1c9c",
      poster: [
        { id: "b379ce_aa1dee1367634f418570b8c06647d871~mv2.jpg", altText: "Upplyst julby i trä med snöiga granar, hus och en stjärna" },
        { id: "b379ce_afb803ec3f774dc59b46fb383c5db241~mv2.jpg", altText: "Julbyn på en spiselkrans bredvid ett ljus" },
        { id: "b379ce_abff47afbc544cec966b787c3726173a~mv2.jpg", altText: "Närbild på ett barn med snöboll och kälke framför granarna" },
        { id: "b379ce_b9a2b163dd9145be8e6b3ad0224ec8d0~mv2.jpg", altText: "Närbild på stjärnan och månen i julbyn" },
        { id: "b379ce_fde5108c062c48cda9263f1e2c5d2f3e~mv2.jpg", altText: "Måttbild: julbyn är 45 × 12 cm och 30 cm hög" },
      ],
      raa: 750380222,
      tecken: 482
    },
    {
      kort: "e0d0d880",
      pid: "e0d0d880-9121-4682-8fc3-81c2bb603b16",
      poster: [
        { id: "b379ce_b209e2c5ee4847aaa4d464fd41c81fc1~mv2.jpg", altText: "Gräddvit pedalhink med svart kant och pedal i krom" },
        { id: "b379ce_eecc51f0184843b89a435c8c597cd18f~mv2.jpg", altText: "Pedalhinken på ett trägolv bredvid en krukväxt" },
        { id: "b379ce_64f3d9baa5b341c787318f0fbf30c457~mv2.jpg", altText: "Pedalhinken bredvid ett skrivbord och en krukväxt" },
        { id: "b379ce_734538d8e69d4d6d95ccaa490b9899cc~mv2.jpg", altText: "Pedalhinken med öppet lock i ett sovrum" },
        { id: "b379ce_78c2879edb72408d9dc2b482df8afd83~mv2.jpg", altText: "Måttbild: hinken är 36 × 30 cm och 44,5 cm hög, 20 l" },
      ],
      raa: 391253575,
      tecken: 480
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
