async function () {
  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };

  const PLAN = [
    {
      kort: "80aac077",
      pid: "80aac077-d7e4-4d2f-ace1-09d24eb9c284",
      poster: [
        { id: "b379ce_d2b392815c9541b39b8a44f782b58874~mv2.jpg", altText: "Trehjuling i orange och svart i motorcykeldesign med pedaler på framhjulet" },
        { id: "b379ce_a9f09b249bbe4682b2f35e24b708748f~mv2.jpg", altText: "Ett litet barn i jeansjacka cyklar på trehjulingen framför ett hus" },
        { id: "b379ce_31275722785a4973a79620b988cc8ae6~mv2.jpg", altText: "Trehjulingen sedd framifrån, från sidan och bakifrån" },
        { id: "b379ce_55c5e46e6e4d4ea7821982bf27ba92e9~mv2.jpg", altText: "Trehjulingen på en stenlagd uteplats bredvid krukor med lavendel" },
        { id: "b379ce_38e2097f5bf04b04a779b7c8fdfc9f52~mv2.jpg", altText: "Måttbild: trehjulingen är 79 × 44 × 50 cm" },
      ],
      raa: 755505102,
      tecken: 541
    },
    {
      kort: "ac160e8e",
      pid: "ac160e8e-1e83-4b72-8847-1a73de6c72ae",
      poster: [
        { id: "b379ce_b3cbde6eee7b4c45873ca3db88df27b7~mv2.jpg", altText: "Rosa barnstaffli sett från båda sidor, med whiteboard, krittavla, pappersrulle och två tygkorgar med räv och kanin" },
        { id: "b379ce_078c861ff3e94ce090c22696507c2f3f~mv2.jpg", altText: "En liten flicka målar på staffliets whiteboard i ett barnrum" },
        { id: "b379ce_6ffec15d475849adb1388ff265b13b60~mv2.jpg", altText: "Närbild på tygkorgarna med räv och kanin" },
        { id: "b379ce_b4fe8db9f8164a3699733015a51d59a5~mv2.jpg", altText: "Närbild på krittavlan och pappersrullen överst" },
        { id: "b379ce_16d1b4e866c14f8f8ad389c11d5104f2~mv2.jpg", altText: "Måttbild: staffliet är 54 × 46,5 × 93 cm och tavlorna 47 × 38 cm" },
      ],
      raa: 306102465,
      tecken: 568
    },
    {
      kort: "eb7d67a4",
      pid: "eb7d67a4-8e1e-4539-b484-437ab0e46847",
      poster: [
        { id: "b379ce_85dcbbac99ee4a1ba677770c19a17063~mv2.jpg", altText: "Uppblåsbar snögubbe med hög svart hatt, rutig halsduk, kvistarmar och en röd fågel på ena armen" },
        { id: "b379ce_10c61acde0704924a7be7c51f6c18d85~mv2.jpg", altText: "Snögubben lyser med färgat ljus framför ett tegelhus med julgran och kransar" },
        { id: "b379ce_a8b7a4df83fa45b5b55e0575ec5951de~mv2.jpg", altText: "Närbild på den rutiga halsduken och de röda knapparna" },
        { id: "b379ce_a181bd4d085a401d92b59690cfd220c1~mv2.jpg", altText: "Måttbild: snögubben är 165 × 100 × 240 cm" },
      ],
      raa: 297284451,
      tecken: 460
    },
    {
      kort: "a64af3a4",
      pid: "a64af3a4-290c-4417-829d-96910ca5494d",
      poster: [
        { id: "b379ce_b200aa01d8824493a46f09dbe009bd5b~mv2.jpg", altText: "Svart dörrgrind i stål med dörr i mitten och förlängning på ena sidan" },
        { id: "b379ce_e9c41ec29af843a0b4a94c40e485ec64~mv2.jpg", altText: "En border collie sitter vid dörrgrinden i en dörröppning" },
        { id: "b379ce_71535c0b5ebb4edb8bdd5e549100de55~mv2.jpg", altText: "En beagle sitter framför den stängda dörrgrinden" },
      ],
      raa: 982304524,
      tecken: 319
    },
    {
      kort: "0b66ea13",
      pid: "0b66ea13-010b-49b3-b126-587c85a11ecd",
      poster: [
        { id: "b379ce_3f318b79f7984c6f935a45167079b0a1~mv2.jpg", altText: "Tvättkorg med ram i bambu, hylla med ribbor ovanpå och tre grå tygkorgar" },
        { id: "b379ce_2b0e73d56f7046bb8b805cd72b84729e~mv2.jpg", altText: "Tvättkorgen i ett sovrum med vikta handdukar ovanpå, bredvid ett nattduksbord" },
        { id: "b379ce_bccd9a3e353b44ccbd9f538d7292d5f7~mv2.jpg", altText: "Närbild på hyllan ovanpå med tvättsvampar och en liten tygkorg med kläder" },
        { id: "b379ce_ee04708bade34e1ebd424c9066a7fa62~mv2.jpg", altText: "Närbild på bamburamens hörn vid golvet" },
        { id: "b379ce_892f0281cdb04a83b2b90e61b2869cf8~mv2.jpg", altText: "Måttbild: tvättkorgen är 50 × 32 × 69,7 cm, den stora tygkorgen 30,2 × 30 × 55 cm och de små 30 × 15 × 24 cm" },
      ],
      raa: 280066689,
      tecken: 612
    },
    {
      kort: "163cd19d",
      pid: "163cd19d-d496-4dce-b587-adb01beefb62",
      poster: [
        { id: "b379ce_40076b3b870a456fbf04bb2085a40318~mv2.jpg", altText: "Leksaksdiskmaskin i vitt och ljusblått med diskho, kran, vred och tallriksställ" },
        { id: "b379ce_a6503cdfc2b14afabfb3ca06785202f5~mv2.jpg", altText: "Ett litet barn plockar tallrikar ur leksaksdiskmaskinen med öppen lucka" },
        { id: "b379ce_c20ec1ee73e64d849f00b5b2e20d6186~mv2.jpg", altText: "Närbild på tallriksstället med vita tallrikar med gula och blå ränder" },
        { id: "b379ce_1b3b20f413774a0f9dbf177ae89ac5aa~mv2.jpg", altText: "Närbild på muggar, tallrikar och bestick i trä inne i diskmaskinen" },
      ],
      raa: 104673986,
      tecken: 480
    },
    {
      kort: "2487e6bb",
      pid: "2487e6bb-4412-4524-86b6-5266b4ec1e48",
      poster: [
        { id: "b379ce_367992fad9d24f23ab23d73afff3830f~mv2.jpg", altText: "Blomhylla i svart metall med tre plan och en stång med tre krokar överst" },
        { id: "b379ce_1741edf942504b12b45d5c20d7a570da~mv2.jpg", altText: "Blomhyllan fylld med krukväxter och hängande krukor på en inglasad veranda" },
        { id: "b379ce_af7f7480d6b04c998c486b14815c3de6~mv2.jpg", altText: "Närbild på den välvda sidogaveln och ett hyllplan med galler" },
        { id: "b379ce_6600b75538a14032b7adf95edddf56e1~mv2.jpg", altText: "Närbild på en av krokarna på den översta stången" },
        { id: "b379ce_24c5aad9635c4b7c848d3866b880ae28~mv2.jpg", altText: "Måttbild: blomhyllan är 75 × 25 × 137 cm" },
      ],
      raa: 40093081,
      tecken: 538
    },
    {
      kort: "43d46471",
      pid: "43d46471-c159-41d6-9c02-7c043b14c34c",
      poster: [
        { id: "b379ce_b08cbe1a91534267a4be069fba86c2c8~mv2.jpg", altText: "Skoställ i grått och svart med låda överst och tre öppna hyllor" },
        { id: "b379ce_0001276b2bc343f7ad6cd0093b2762b8~mv2.jpg", altText: "Skostället i en hall med skor på hyllorna och vaser ovanpå" },
        { id: "b379ce_983d34d91f8b449489d64fa90b472394~mv2.jpg", altText: "Skostället i en hall bredvid ett paraply och en krukväxt" },
        { id: "b379ce_09fd4c1b6cde4a44a78b1b2a42dd6a34~mv2.jpg", altText: "Skostället med skor på alla tre hyllorna i en ljus hall" },
        { id: "b379ce_e5dd7da1757449fc837c9ba19510441b~mv2.jpg", altText: "Måttbild: skostället är 70 × 30 × 87,6 cm och lådan 58,8 × 23,6 × 6 cm" },
      ],
      raa: 251386189,
      tecken: 546
    },
    {
      kort: "cb08e980",
      pid: "cb08e980-5f24-43fd-a143-b98c61dadd29",
      poster: [
        { id: "b379ce_ff428e8351e84616a5d9fd7f16bf57de~mv2.jpg", altText: "Ministepper i grått och svart med halkfria pedaler, display och ratt för steghöjden" },
        { id: "b379ce_2fe511e8fdf8479d9fa9935e497ebfb5~mv2.jpg", altText: "En kvinna tränar på ministeppern med ett motståndsband i varje hand" },
        { id: "b379ce_d80167b1cdb0444e8716b7392db22ce1~mv2.jpg", altText: "Ministeppern på golvet framför en soffa med motståndsbanden utlagda" },
        { id: "b379ce_4f27387000954dd094ff6ca69d3d3220~mv2.jpg", altText: "Måttbild: ministeppern är 41 × 30,5 × 18,5 cm och pedalerna 28 × 11 cm" },
      ],
      raa: 937073276,
      tecken: 482
    },
    {
      kort: "5f833adb",
      pid: "5f833adb-164d-4d79-803a-e9b9b0483927",
      poster: [
        { id: "b379ce_dde869f2ad824913a6ee38b0540a3356~mv2.jpg", altText: "Spegelskåp i mörkgrått med spegeldörr, ljusgrå dörr med präglade linjer och öppen hylla nertill" },
        { id: "b379ce_5e14de2172bd44899d1cde6686bb96d8~mv2.jpg", altText: "Spegelskåpet ovanför ett vitt handfat med flaskor och burkar på den öppna hyllan" },
        { id: "b379ce_86e22a3328544e66920442043acc1010~mv2.jpg", altText: "Närbild på den öppna hyllan under dörrarna med flaskor och en tvål" },
        { id: "b379ce_9fc43013627b420cb543f6320249af28~mv2.jpg", altText: "Måttbild: spegelskåpet är 55 × 17 × 55 cm" },
      ],
      raa: 977201987,
      tecken: 477
    },
    {
      kort: "b0f5b1a5",
      pid: "b0f5b1a5-dd26-4c06-8566-446ba23712d0",
      poster: [
        { id: "b379ce_cd0072e53f424674a2628dd98078997d~mv2.jpg", altText: "Två runda sittpallar i gräddvit plisserad sammet, en stor och en liten" },
        { id: "b379ce_43ccad0dc00c45ef9d11c62153d45bb3~mv2.jpg", altText: "Sittpallarna på ett trägolv bredvid en vas och en korg" },
        { id: "b379ce_a833670d0c6f404f99f15d81c9b5042b~mv2.jpg", altText: "Den stora pallen med locket avtaget och en filt i förvaringen, bredvid den lilla" },
        { id: "b379ce_5cc55920a7e24614ac904937f6da13e7~mv2.jpg", altText: "Närbild på en filttass under en av pallarna" },
        { id: "b379ce_0ea0ff35754c4faabacc79c3d1781ff9~mv2.jpg", altText: "Måttbild: den stora pallen är 36 × 36 × 41,5 cm och den lilla 32 × 32 × 33,5 cm, och båda bär 120 kg" },
      ],
      raa: 794224624,
      tecken: 591
    },
    {
      kort: "e95efc20",
      pid: "e95efc20-1c1c-497c-90fc-aa003b932df8",
      poster: [
        { id: "b379ce_9186c12c2a8b4440837c27424f416da7~mv2.jpg", altText: "Whiteboard i vitt glas med pennhylla i aluminium, fyra pennor och ett sudd" },
        { id: "b379ce_8b1775050de6497087eb2498016968b6~mv2.jpg", altText: "Whiteboarden på väggen ovanför ett skrivbord i ett arbetsrum" },
        { id: "b379ce_5d07ab680abf4161a40ef8450e12e28a~mv2.jpg", altText: "Närbild på pennhyllan och en glasklämma i hörnet" },
        { id: "b379ce_abfc509f496e4d5aa22021ac0328c003~mv2.jpg", altText: "En kvinna vid ett skrivbord framför whiteboarden med anteckningar och papper" },
        { id: "b379ce_be6ea2a5aaa342d6b90590686b0aa983~mv2.jpg", altText: "Måttbild: whiteboarden är 90 × 60 cm och pennhyllan 45 × 5 cm" },
      ],
      raa: 121047759,
      tecken: 563
    },
    {
      kort: "e4df6dc7",
      pid: "e4df6dc7-91ab-40b7-bdff-3767c14c4a5e",
      poster: [
        { id: "b379ce_b3234e4d4cc343c4b33bc1d8d8041cbf~mv2.jpg", altText: "Väggspegel i asymmetrisk organisk form med bred ram i furufaner" },
        { id: "b379ce_fa35334c9b9a4751a202d59b766b4176~mv2.jpg", altText: "Väggspegeln ovanför en ljus skänk med en bordslampa och en vas med kvistar" },
        { id: "b379ce_b3904110f53146c59243e746a1309648~mv2.jpg", altText: "Väggspegeln ovanför en skänk i trä med högtalare och böcker" },
        { id: "b379ce_6fd5977f3c74405aa564e0e3a5320348~mv2.jpg", altText: "Väggspegeln på en vit panelvägg ovanför en hylla med krukväxter och en skivspelare" },
        { id: "b379ce_61fc578f1c9f463f947039118888b668~mv2.jpg", altText: "Måttbild: väggspegeln är 91,5 × 45 cm" },
      ],
      raa: 914624316,
      tecken: 559
    },
    {
      kort: "3edd4198",
      pid: "3edd4198-2b09-44e8-9596-f6cb372ac9ca",
      poster: [
        { id: "b379ce_02f15c8bfe1c46f4a7db14ccf6524d02~mv2.jpg", altText: "Hopfällbar säckkärra i aluminium med teleskophandtag, elastisk rem och tre hjul på varje sida" },
        { id: "b379ce_ea2373f87f55495b948dcc9b95fe9a73~mv2.jpg", altText: "En person drar säckkärran med en kartong uppför ett trappsteg" },
        { id: "b379ce_084a73c6f2864817865e3c26c33ff490~mv2.jpg", altText: "Närbild på de tre hjulen på ena sidan" },
        { id: "b379ce_b0a9016d92e1410dbf898e47f11986d5~mv2.jpg", altText: "Närbild på lastplattan i aluminium" },
        { id: "b379ce_9e31b90f0a8a4718886dd961e3670fc9~mv2.jpg", altText: "Måttbild: säckkärran är 47 × 47 × 100 cm" },
      ],
      raa: 877203881,
      tecken: 509
    },
    {
      kort: "855bae98",
      pid: "855bae98-ef41-4c99-a326-2ebedd70bc72",
      poster: [
        { id: "b379ce_05725c68aa694ac6bfc32f72403b3618~mv2.jpg", altText: "Smal vit cd- och dvd-hylla med nio fack" },
        { id: "b379ce_cb8ca1105cb44a65b5dc6e82b038a9ae~mv2.jpg", altText: "Cd-hyllan fylld med skivor i ett vardagsrum bredvid en krukväxt" },
        { id: "b379ce_38b1f49439544ba4a64215c19befe49e~mv2.jpg", altText: "Cd-hyllan fylld med skivor i alla nio facken" },
        { id: "b379ce_481ffb57da774914a6a1dd54e5be323b~mv2.jpg", altText: "Måttbild: hyllan är 33 × 24 × 140 cm och bär 15 kg" },
      ],
      raa: 95861051,
      tecken: 391
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
