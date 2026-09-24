async function () {
  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };

  const PLAN = [
    {
      kort: "5022e9e5",
      pid: "5022e9e5-b5af-427a-8d83-3a934aafe654",
      poster: [
        { id: "b379ce_dca5aef22bbe4202b353d830ac2f61b8~mv2.jpg", altText: "Vitt tvättskåp med två spjälsdörrar, en öppen och lutad framåt" },
        { id: "b379ce_b8bcbeb762774026805229c55edf4d7e~mv2.jpg", altText: "Skåpet bredvid en tvättmaskin i ett ljust badrum" },
        { id: "b379ce_dbccfc23fb624048a39838a29f521f3a~mv2.jpg", altText: "Skåpet i ett ljust rum med en dörr öppen och tvättkorgen synlig" },
        { id: "b379ce_4fdaea35eca34fa7955bdb25bc9d0bd2~mv2.jpg", altText: "Närbild på spjälorna på en av dörrarna" },
        { id: "b379ce_59e9cb07f74c4f079636755cbc4e4400~mv2.jpg", altText: "Måttbild som visar skåpet 70 × 38 × 73 cm och belastningen 30 kg" },
      ],
      raa: 624267715,
      tecken: 519
    },
    {
      kort: "32140f01",
      pid: "32140f01-3110-4126-854f-3bd210b880bf",
      poster: [
        { id: "b379ce_44028ffdf3c946cc8bfa0183011be3c5~mv2.jpg", altText: "Svart väggkamin med orange lågor bakom böjt glas" },
        { id: "b379ce_a172812370544e988131f84255d41dcd~mv2.jpg", altText: "Kaminen monterad på en vit vägg ovanför ett litet sidobord" },
        { id: "b379ce_9c6bfca9abc84836b2c3cc2b5c050b3f~mv2.jpg", altText: "Närbild på kontrollpanelen med knappar för värme och belysning" },
        { id: "b379ce_8de0f3bd024941a09ba9b43aac88433a~mv2.jpg", altText: "Närbild på sidokanten med blå LED-belysning" },
        { id: "b379ce_91721cdbe7e043a3a59908f0c277d5d9~mv2.jpg", altText: "Måttbild som visar kaminen 65 × 11,4 × 52 cm" },
      ],
      raa: 914163600,
      tecken: 499
    },
    {
      kort: "4f9ef409",
      pid: "4f9ef409-95a2-427a-9095-eff4c2f0d99a",
      poster: [
        { id: "b379ce_d0695da3a2994f95a1a3698085293ec2~mv2.jpg", altText: "Vit tv-bänk med skåp till vänster och öppet fack till höger" },
        { id: "b379ce_fa3193ccdf7849eaa2c5b9dbe1201649~mv2.jpg", altText: "Bänken under en väggmonterad tv i ett ljust vardagsrum" },
        { id: "b379ce_c0b9b70213df4442a84adb190fcdbb86~mv2.jpg", altText: "Bänken med skåpsdörren öppen och en tv ovanför" },
        { id: "b379ce_ba2e308d94514bd2b87414f236016f8e~mv2.jpg", altText: "Måttbild som visar bänken 140 × 40 × 48 cm och tv-storlekar upp till 60 tum" },
      ],
      raa: 244406891,
      tecken: 429
    },
    {
      kort: "8085d0b6",
      pid: "8085d0b6-e58a-41c2-b08c-efb2c9d5c36f",
      poster: [
        { id: "b379ce_23a02333e45b4f41b89757f511ec8f17~mv2.jpg", altText: "Vitt högskåp med tre öppna hyllplan upptill och tre lådor nedtill" },
        { id: "b379ce_05613afe619f4d2fa604811682900f64~mv2.jpg", altText: "Skåpet i ett hemmakontor med böcker på de öppna hyllorna" },
        { id: "b379ce_1b9496f542414808999459446a18bd59~mv2.jpg", altText: "Skåpet i ett rum med en växt bredvid" },
        { id: "b379ce_5b647ab65dd74f3db273af76d192f0a6~mv2.jpg", altText: "Måttbild som visar skåpet 79 × 39,5 × 180 cm och belastningen 60 kg" },
      ],
      raa: 983857616,
      tecken: 419
    },
    {
      kort: "bd2c7da3",
      pid: "bd2c7da3-f4ab-4007-93ac-1c6e530b7793",
      poster: [
        { id: "b379ce_26987375e2754e6abd8886c907d83a3a~mv2.jpg", altText: "Vitt skoskåp med två stängda dörrar" },
        { id: "b379ce_839a4880b7e641b38f9761d6e196bd7f~mv2.jpg", altText: "Skåpet i en hall med en dörr öppen och skor synliga på hyllorna" },
        { id: "b379ce_7891f09582ff405e975fbdbd1904c4d3~mv2.jpg", altText: "Skåpet med båda dörrarna öppna och skor på alla sju hyllplan" },
        { id: "b379ce_99cb8fdcf149491b9b13a535a4775127~mv2.jpg", altText: "Skåpet i en hall med en väska och blommor ovanpå" },
        { id: "b379ce_fb4f16e8f9e04288b02ec3d5eedd9d93~mv2.jpg", altText: "Måttbild som visar skåpet 70 × 35 × 108 cm och de sju hyllnivåerna" },
      ],
      raa: 515450530,
      tecken: 516
    },
    {
      kort: "6b91821a",
      pid: "6b91821a-de53-4f1e-ba56-d9172d5d3cd9",
      poster: [
        { id: "b379ce_fd9d7e7ce8e842978aaba486a4538bc7~mv2.jpg", altText: "Vitt sminkbord med LED-spegel, öppna hyllor och två lådor" },
        { id: "b379ce_8e33a153398840feb07731bd8d0fb1cb~mv2.jpg", altText: "Sminkbordet i ett sovrum med spegeln tänd och sminkprylar på hyllorna" },
        { id: "b379ce_dbdf6ca539cb44e5bbd87b89b4e537e3~mv2.jpg", altText: "Sminkbordet i ett sovrum med en stoppad pall och ett nattduksbord bredvid" },
        { id: "b379ce_201a295f1d9140e0ba321d98c67d80b0~mv2.jpg", altText: "Närbild på hyllorna fyllda med sminkprylar runt spegeln" },
        { id: "b379ce_a32ae0e7741a4c4484550b3ce14003a3~mv2.jpg", altText: "Måttbild som visar sminkbordet 90 × 40 × 144,7 cm och spegeln 52,8 × 39,5 cm" },
      ],
      raa: 299263550,
      tecken: 574
    },
    {
      kort: "3739257b",
      pid: "3739257b-c326-443c-95c3-1ff46dc7fbb2",
      poster: [
        { id: "b379ce_9ed4d2a776ac4871aeccc00d467905ba~mv2.jpg", altText: "Två beige matstolar i linnelook med tunnformad rygg och ben i ljust trä" },
        { id: "b379ce_ae3390d70795436180fef9eef2b62093~mv2.jpg", altText: "Stolarna vid ett matbord i trä i ett ljust rum" },
        { id: "b379ce_2214fc0aa1d54015bc2cfb8534423755~mv2.jpg", altText: "Närbild på tygets struktur och den tunnformade ryggen" },
        { id: "b379ce_5cad63b720d341a5bfa9e5e1c599c5f2~mv2.jpg", altText: "Närbild på träbenets fäste mot sitsramen" },
        { id: "b379ce_3cf09ad6df9943c1a3e319b5eb3b95b3~mv2.jpg", altText: "Måttbild som visar stolen 55 × 56 × 74 cm och sitsen 44 × 44 cm" },
      ],
      raa: 266090486,
      tecken: 517
    },
    {
      kort: "3bf5bd08",
      pid: "3bf5bd08-837b-4c80-863a-21101c27b783",
      poster: [
        { id: "b379ce_bc0ef1116c474d02badb51f227ce5001~mv2.jpg", altText: "Matbord i trämönster med fyra stolar runt" },
        { id: "b379ce_b47fdf7cac994741853a1bd0b9982f56~mv2.jpg", altText: "Matgruppen i ett kök med en tavla på väggen" },
        { id: "b379ce_f767677ca00941078f96bedd8eb35287~mv2.jpg", altText: "Närbild på bordsskivans trämönster och den vita metallramen" },
        { id: "b379ce_495b6be1c4294e69b3714ffd19cc4795~mv2.jpg", altText: "Närbild på en stols ryggstöd i trämönster" },
        { id: "b379ce_08eec0d34b18463ab30ce54c55e1ee4b~mv2.jpg", altText: "Måttbild som visar bordet 100 × 63 × 76,5 cm och stolen 40 × 45 × 82 cm" },
      ],
      raa: 888162740,
      tecken: 499
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
