async function () {
  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };

  const PLAN = [
    {
      kort: "173bc5bd",
      pid: "173bc5bd-59f3-4668-b0c0-824537e1336e",
      poster: [
        { id: "b379ce_5379f5e4a98447b998b3268bf46ea5ba~mv2.jpg", altText: "Smal konstgjord julgran med kottar på en svart metallfot" },
        { id: "b379ce_45560519b51544ce836b0640695726d8~mv2.jpg", altText: "Den smala julgranen med pynt i ett vardagsrum bredvid en öppen spis" },
        { id: "b379ce_cc6be58f10d7462abbacd65f3a50f57b~mv2.jpg", altText: "Den smala julgranen utan pynt i ett vardagsrum med öppen spis" },
        { id: "b379ce_80a6759fda084347abeba790730f29f2~mv2.jpg", altText: "Måttbild: julgranen är 195 cm hög och 54 cm bred, bredvid en mänsklig siluett" },
      ],
      raa: 73052250,
      tecken: 456
    },
    {
      kort: "300d3415",
      pid: "300d3415-01c8-4443-badd-9dfb5280a2e9",
      poster: [
        { id: "b379ce_a86bffc3e5f24031b50c0d7909bf781b~mv2.jpg", altText: "Upplyst julby i trä med kyrka, hus, granar och en lyktstolpe" },
        { id: "b379ce_7e78836bcde8469eb9dff3ba0268db24~mv2.jpg", altText: "Julbyn på ett bord framför en grå soffa" },
        { id: "b379ce_c41680b4c1d0402f97cdad5ea4538164~mv2.jpg", altText: "Närbild på julbyns framsida med utsågade granar, moln och figurer" },
        { id: "b379ce_577346708b424d79a36e662aee067e66~mv2.jpg", altText: "Närbild på ett snötäckt hus, granar och ett staket i julbyn" },
        { id: "b379ce_3099160c83b34fa483edab96aeff94e7~mv2.jpg", altText: "Måttbild: julbyn är 45 cm bred, 10 cm djup och 25 cm hög" },
      ],
      raa: 259208635,
      tecken: 523
    },
    {
      kort: "2cb5b77e",
      pid: "2cb5b77e-4d59-4b08-99a7-20beb2ad40f4",
      poster: [
        { id: "b379ce_1b63b643be4f48cc81a71b224cafa46f~mv2.jpg", altText: "Konstgjord LED-björk med vit stam och tunna grenar" },
        { id: "b379ce_72d17d6994cc427eb72171155fc158ed~mv2.jpg", altText: "LED-björken tänd i ett vardagsrum bredvid en öppen spis" },
        { id: "b379ce_f846794cf6a847b8901c176ecbc1e8d8~mv2.jpg", altText: "Närbild på grenarna med tända LED-lampor" },
        { id: "b379ce_18f7e53839d34e7cadbd8f5ec24c58e8~mv2.jpg", altText: "Närbild på stammen som efterliknar björkbark" },
        { id: "b379ce_93c29bfdb10246edadfe61e5beb1e2ec~mv2.jpg", altText: "Måttbild: björken är 180 cm hög och foten 22 × 22 cm" },
      ],
      raa: 31703254,
      tecken: 485
    },
    {
      kort: "badc577d",
      pid: "badc577d-42a4-408b-9a05-d357932656f2",
      poster: [
        { id: "b379ce_8a17fbaaa9914c80a18a75dab46a4217~mv2.jpg", altText: "Svart nattduksbord med skiva, låda och öppet fack med mellanvägg" },
        { id: "b379ce_b6e0675a3545491891f9633bd34a2d93~mv2.jpg", altText: "Nattduksbordet bredvid en säng, med flaskor i det öppna facket" },
        { id: "b379ce_024888fe25a14b1b9bc1645d6761aa40~mv2.jpg", altText: "Nattduksbordet med lådan utdragen och en växt på skivan" },
        { id: "b379ce_63597e9165ec410bb6997a54942e4fad~mv2.jpg", altText: "Måttbild: nattduksbordet är 40 cm brett, 30 cm djupt och 46 cm högt" },
      ],
      raa: 403306197,
      tecken: 443
    },
    {
      kort: "db4808e6",
      pid: "db4808e6-a557-4345-b6e6-7c5a7aca4981",
      poster: [
        { id: "b379ce_5453c64955054c55b3699e87480c7743~mv2.jpg", altText: "Rosa och vit smart hula hoop med viktkula och digital räknare" },
        { id: "b379ce_15a31bd147e24672bc8219178cfb7d37~mv2.jpg", altText: "Kvinna som tränar med hula hoopen utomhus bland höstlöv" },
        { id: "b379ce_41f43afad2b54bc39eef19e24d7e5f7f~mv2.jpg", altText: "Närbild på ringens delar i rosa och vitt" },
        { id: "b379ce_a642f76146eb4bf4afec586eb21fb882~mv2.jpg", altText: "Närbild på en del av ringen" },
        { id: "b379ce_988ff5a5ebd041de8ac93d6e7342c4c9~mv2.jpg", altText: "Måttbild: ringen passar midjor på 76–113 cm och är 139 cm lång utdragen" },
      ],
      raa: 114105045,
      tecken: 498
    },
    {
      kort: "edac1214",
      pid: "edac1214-56f4-4815-a06f-b18cdad35855",
      poster: [
        { id: "b379ce_963d5389fb7547d794b8da43eceabcc2~mv2.jpg", altText: "Konstgjord bambu med fem stammar i en svart kruka" },
        { id: "b379ce_bd613e82107a44bd99f862c89bd6ee29~mv2.jpg", altText: "Bambun i ett ljust vardagsrum bredvid en fåtölj" },
        { id: "b379ce_c1ce9005974e4ed9a35ba030f7bf6e83~mv2.jpg", altText: "Närbild på bambuns gröna blad" },
        { id: "b379ce_c8e2a998698e42e793eb92ddaed0454f~mv2.jpg", altText: "Närbild på en stam och bladen" },
        { id: "b379ce_8234ce52408a425a9f050664cc5ea4fb~mv2.jpg", altText: "Måttbild: bambun är 90 cm hög och krukan 15 cm bred och 12,5 cm hög" },
      ],
      raa: 549714229,
      tecken: 465
    },
    {
      kort: "06675244",
      pid: "06675244-e3da-4f4a-9ddb-3176bffd5fe5",
      poster: [
        { id: "b379ce_a85405e7b41d4491a6a005daf4c76047~mv2.jpg", altText: "Julgran med snöade spetsar och kottar i en guldfärgad kruka" },
        { id: "b379ce_63dfe7a4c1194616b142a4e39b1e771f~mv2.jpg", altText: "Julgranen bredvid en tomtefigur och julklappar i ett ljust rum" },
        { id: "b379ce_8dfc3ae8784746cd972360169c53e688~mv2.jpg", altText: "Närbild på granens topp med snöade spetsar" },
        { id: "b379ce_3890edc580c94e289cd320bb14d275a7~mv2.jpg", altText: "Måttbild: granen är 100 cm hög och 60 cm bred, bredvid en mänsklig siluett" },
      ],
      raa: 468862787,
      tecken: 432
    },
    {
      kort: "119c6052",
      pid: "119c6052-0e5f-4dd2-9d97-56d69328bc1a",
      poster: [
        { id: "b379ce_23b391b0bd1e4e50b625b9b8b10fb904~mv2.jpg", altText: "Vitt medicinskåp med grått kors, kodlås och handtag upptill" },
        { id: "b379ce_30756d0864de493ca1fbf1cae7dade79~mv2.jpg", altText: "Medicinskåpet på väggen med dörren öppen och mediciner inuti" },
        { id: "b379ce_08250304231b4b32bf855d75e4ee9d59~mv2.jpg", altText: "Medicinskåpet på en byrå i ett vardagsrum" },
        { id: "b379ce_20fa095cf09843e686c986ff27afa60f~mv2.jpg", altText: "Medicinskåpet på väggen ovanför en byrå" },
        { id: "b379ce_78cc11e75c2d468fbabd853aef860fda~mv2.jpg", altText: "Måttbild: skåpet är 30 cm brett, 14 cm djupt och 30 cm högt och bär 5 kg" },
      ],
      raa: 43354372,
      tecken: 515
    },
    {
      kort: "2f1246a1",
      pid: "2f1246a1-0966-4a50-ac55-c8c9e3d5bb26",
      poster: [
        { id: "b379ce_32fe911b0f5347fe815635bfd3a2bb23~mv2.jpg", altText: "Hängande halloweenmumie lindad i gasväv med spindlar" },
        { id: "b379ce_41508c88bde04dd49ea3de9c18acd1d2~mv2.jpg", altText: "Mumien hänger under en pergola bredvid pumpor och en stor spindel" },
        { id: "b379ce_389c9ea9faa14e2993d541c9aba84803~mv2.jpg", altText: "Närbild på mumiens huvud inlindat i gasväv" },
        { id: "b379ce_e5745e8e180a4c5e900265402f9480a1~mv2.jpg", altText: "Närbild på en spindel på gasväven" },
        { id: "b379ce_8703f5cf3c6e4756abe669dcf2f4e0e7~mv2.jpg", altText: "Måttbild: mumien är 142 cm hög och 43 cm bred" },
      ],
      raa: 921737097,
      tecken: 481
    },
    {
      kort: "5f8aed80",
      pid: "5f8aed80-bf3c-4b2c-a7f0-b8112ecce559",
      poster: [
        { id: "b379ce_ac64985a92ae40aca42a573528f77102~mv2.jpg", altText: "Förvaringsskåp med svart stålram, två hyllplan och två lådor i rustikt brunt" },
        { id: "b379ce_af91fcd1dd1f4441872508699b08fea0~mv2.jpg", altText: "Förvaringsskåpet bredvid en soffa, med en klocka och böcker på hyllorna" },
        { id: "b379ce_2324ab409f8743acadeea8ddad564f45~mv2.jpg", altText: "Närbild på ett svart handtag på en låda" },
        { id: "b379ce_3308626b583d4773b1f2e22d50ba7bf0~mv2.jpg", altText: "Närbild på hyllplanets kant i rustikt brunt" },
        { id: "b379ce_cfbd47571dec4ef2a6e999743f87f444~mv2.jpg", altText: "Måttbild: skåpet är 45 cm brett, 40 cm djupt och 70,5 cm högt" },
      ],
      raa: 615306947,
      tecken: 534
    },
    {
      kort: "80558327",
      pid: "80558327-0d74-4b04-b720-a79686326646",
      poster: [
        { id: "b379ce_3d6f58f40f0b4e8ca5c7c45b95ff4bdf~mv2.jpg", altText: "Pall i bambu med ribbor i sitsen och ett hyllplan under" },
        { id: "b379ce_aa89de4663a8425eaa1de787f7667aca~mv2.jpg", altText: "Bambupallen framför ett badkar, med flaskor på sitsen och handdukar på hyllan" },
        { id: "b379ce_897a8e4f63254237ac4102a3b924fa2e~mv2.jpg", altText: "Bambupallen i ett badrum bredvid ett badkar och ett hyllskåp i bambu" },
        { id: "b379ce_86539c16e5f04f23b209e2817be27a74~mv2.jpg", altText: "Måttbild: pallen är 47,5 cm bred, 26 cm djup och 44,5 cm hög" },
      ],
      raa: 538169256,
      tecken: 455
    },
    {
      kort: "b99bb9cc",
      pid: "b99bb9cc-c99d-4100-84ce-5e2594ceb839",
      poster: [
        { id: "b379ce_2d9a8871feef46df9a33c0388cac4023~mv2.jpg", altText: "Vit bokhylla i metall med tre plan på fyra hjul" },
        { id: "b379ce_431862e53e794df6b56c32afce1a3697~mv2.jpg", altText: "Bokhyllan med pärmar, böcker och lådor bredvid ett skrivbord" },
        { id: "b379ce_8e8770ea33d440b28196c56803d8904e~mv2.jpg", altText: "Bokhyllan med böcker och dekorationer i ett vardagsrum" },
        { id: "b379ce_30afad25ba6c489d86ea0eff0ff3db59~mv2.jpg", altText: "Bokhyllan med böcker och tavlor bredvid en golvlampa" },
        { id: "b379ce_46b9d2513bbe4916b31a8920aa7b4ae3~mv2.jpg", altText: "Måttbild: bokhyllan är 69 cm bred, 26 cm djup och 108 cm hög och bär 15 kg" },
      ],
      raa: 700998665,
      tecken: 531
    },
    {
      kort: "be52938b",
      pid: "be52938b-94bf-4eea-b33c-f861a929c8f3",
      poster: [
        { id: "b379ce_1e5bb499c5a447f69114fbdace8def9e~mv2.jpg", altText: "Lekmattans två sidor med skogsdjur och granar, och mattan hopvikt" },
        { id: "b379ce_29c8f2d71e744d93a985f53efebff8bd~mv2.jpg", altText: "Förälder och bebis sitter på lekmattan i ett ljust barnrum" },
        { id: "b379ce_6a8123f5e3154cb6a1be15ea8f25ed8c~mv2.jpg", altText: "Närbild på lekmattans motiv med en igelkott, en björn och flugsvampar" },
        { id: "b379ce_5925b5f963584f05a15340fa62e69a2b~mv2.jpg", altText: "Måttbild: lekmattan är 196 cm lång och 176 cm bred" },
      ],
      raa: 222326334,
      tecken: 437
    },
    {
      kort: "30fe3828",
      pid: "30fe3828-a510-4f3e-b32d-6874a4ce81bd",
      poster: [
        { id: "b379ce_c080932b8ddb4312b6fb82d4a2c41ec0~mv2.jpg", altText: "Smalt sidobord med laddstation, två tyglådor och svart stålram" },
        { id: "b379ce_ffc5d1f9f2d24591ba844b832891a8f7~mv2.jpg", altText: "Sidobordet bredvid en soffa med en telefon som laddar" },
        { id: "b379ce_bc983e8bae2345608420cc6d091972e6~mv2.jpg", altText: "Sidobordet bredvid en soffa, med två personer i rummet" },
        { id: "b379ce_d0080c46619d4cc1b04d5c3720ed417b~mv2.jpg", altText: "Sidobordet bredvid en säng, anslutet till ett vägguttag" },
        { id: "b379ce_67d8f092dfca4b3484274e54e9b63995~mv2.jpg", altText: "Måttbild: sidobordet är 20 cm brett, 40 cm djupt och 63 cm högt" },
      ],
      raa: 963059875,
      tecken: 531
    },
    {
      kort: "33cf9b15",
      pid: "33cf9b15-0375-416c-8bd5-4fb4392bf15f",
      poster: [
        { id: "b379ce_d00e31676c3e496b9ecceafbac8af793~mv2.jpg", altText: "Svart snöskyffel med aluminiumskaft, D-grepp och extra handtag" },
        { id: "b379ce_776ae0dff8cc4684a12b9032cfbe0ecd~mv2.jpg", altText: "Man som skottar snö med skyffeln på en uppfart" },
        { id: "b379ce_39491afd92324894bcf9188fa6f4cec3~mv2.jpg", altText: "Man som skottar snö med skyffeln i en villaträdgård" },
        { id: "b379ce_83642036b50c4410a0c208a70ef2d479~mv2.jpg", altText: "Man som skottar snö längs en väg med skyffeln" },
        { id: "b379ce_72a1d3ef0fc9467c93d7eee48d5c2f7f~mv2.jpg", altText: "Måttbild: skyffeln är 135 cm hög och skopan 45 cm bred och 33 cm djup" },
      ],
      raa: 129145121,
      tecken: 517
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
