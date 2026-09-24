async function () {
  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };

  const PLAN = [
    {
      kort: "e392b9d6",
      pid: "e392b9d6-6dc8-4b9d-bb99-4fd2857a51e7",
      poster: [
        { id: "b379ce_58f9f74fd2164d53ac7e8a634d8b4ed1~mv2.jpg", altText: "Leksaksbutik i rosa och beige med kassadisk, hörnhyllor och varuautomat" },
        { id: "b379ce_c21952f4d79049a1a6db9f3f22d37ccc~mv2.jpg", altText: "Två barn leker i leksaksbutiken, ett vid kassadisken och ett vid varuautomaten" },
        { id: "b379ce_b481578f05754c5bb52253b3a9f62756~mv2.jpg", altText: "Leksaksbutiken uppställd i ett barnrum med tavlor, mjukisdjur och en krukväxt" },
        { id: "b379ce_4036befd08c649dd9614547e580f7de3~mv2.jpg", altText: "Närbild på vågen i trä och scannern på kassadiskens arbetsyta" },
        { id: "b379ce_72c1abf52e0249ce9951d9864d20accb~mv2.jpg", altText: "Måttbild som visar leksaksbutikens mått 90,7 × 60 × 73,8 cm och diskhöjden 41,7 cm" },
      ],
      raa: 585519430,
      tecken: 613
    },
    {
      kort: "bd8af49c",
      pid: "bd8af49c-ffac-4bd5-8bca-2282583e3268",
      poster: [
        { id: "b379ce_42a51cb39b884ec4b7d42063dded3191~mv2.jpg", altText: "Grå hamsterbur i trä med tre plan, plexiglasfront och gallerlock" },
        { id: "b379ce_ee8f2c5429a3498d83b4573e158fa7dd~mv2.jpg", altText: "Hamsterburen placerad i ett vardagsrum bredvid en soffa och en krukväxt" },
        { id: "b379ce_5c9337c6126a4a23bcab9409c5aeb163~mv2.jpg", altText: "Närbild uppifrån på det övre planet med trähus och ramp" },
        { id: "b379ce_703fe12311764593a645102f76d0ca4d~mv2.jpg", altText: "Hamsterburen med gallerlocket uppfällt och framluckan nedfälld" },
        { id: "b379ce_d454f6bf86a7436399d8968dbb8053e6~mv2.jpg", altText: "Måttbild som visar hamsterburens mått 115 × 60 × 55 cm och framluckans 75 × 19 cm" },
      ],
      raa: 123556866,
      tecken: 577
    },
    {
      kort: "1f3077a4",
      pid: "1f3077a4-12f1-4f75-b62c-0714d0574990",
      poster: [
        { id: "b379ce_883af272fbd44b54b18184fc865c79db~mv2.jpg", altText: "Trimbord för hund med blå gummiskiva, galge med två lyftremmar och trådkorg" },
        { id: "b379ce_57b82a0097594f2c9dd9bcad528c231f~mv2.jpg", altText: "Trimbordet uppställt mot en vägg med galgen monterad och korgen under skivan" },
        { id: "b379ce_56768baf6a8e4aef8af1ce6d0f9bff22~mv2.jpg", altText: "Närbild på vredet som låser galgens stång mot bordskanten" },
        { id: "b379ce_44d4030c8d524649941978e39e0f8e19~mv2.jpg", altText: "Måttbild som visar trimbordets skiva 107 × 60 cm, arbetshöjden 76 cm och korgen 65 × 32 cm" },
      ],
      raa: 580217290,
      tecken: 493
    },
    {
      kort: "583622e8",
      pid: "583622e8-ce1b-4852-a5f3-a0c2eb924cdc",
      poster: [
        { id: "b379ce_506057263123402eaaca8ac7e2c0ab0e~mv2.jpg", altText: "Svart träningsbänk med uppfällt ryggstöd, armbågsstöd och vadfäste" },
        { id: "b379ce_cddb7ee6f1f647558db88c258e496913~mv2.jpg", altText: "En man sitter på träningsbänken och gör bicepscurl mot armbågsstödet" },
        { id: "b379ce_d3debf2ddf334425b8bc9326bf63295b~mv2.jpg", altText: "En man gör situps på träningsbänken med fötterna låsta under vadfästet" },
        { id: "b379ce_ebb556816dcd4e1891b540941888c773~mv2.jpg", altText: "Måttbild som visar träningsbänkens mått 180 × 68,5 × 93,5 cm och armbågsstödet 30 × 16 cm" },
      ],
      raa: 131476887,
      tecken: 488
    },
    {
      kort: "a23ea344",
      pid: "a23ea344-b9b0-4052-a28b-3d8bbb09eb43",
      poster: [
        { id: "b379ce_31828bc4f5964dadba03b186414ac587~mv2.jpg", altText: "Orange och svart lövblås med blåsrör och två batterier monterade" },
        { id: "b379ce_b82e9d62c2cc4d9b9645025d108e12bf~mv2.jpg", altText: "En man blåser ihop löv på en uppfart med lövblåsen och axelremmen på" },
        { id: "b379ce_3d8139596805473e94b94d1fc8f88589~mv2.jpg", altText: "Lövblåsen används för att blåsa ihop sågspån på ett verkstadsgolv" },
        { id: "b379ce_e1d590bb5e8a453387f26d43c9b6a711~mv2.jpg", altText: "Måttbild som visar lövblåsens mått 102 × 22 × 16 cm samt röret och det platta munstycket" },
      ],
      raa: 807192090,
      tecken: 480
    },
    {
      kort: "53550f18",
      pid: "53550f18-dd1e-4f3e-bd99-b9c0b4229a1c",
      poster: [
        { id: "b379ce_6d5e94f4bf044ba986579af0a4c669d6~mv2.jpg", altText: "Två trädgårdsstolar i svart stål med sits och rygg i eukalyptus" },
        { id: "b379ce_d802aabfa1834ea38d5ddcf6e5b982a2~mv2.jpg", altText: "Trädgårdsstolarna vid ett bord på en stenlagd uteplats i solsken" },
        { id: "b379ce_8c7ace7d0d954f6bb186dd809625e064~mv2.jpg", altText: "Trädgårdsstolarna uppställda på en uteplats med ett litet bord emellan" },
        { id: "b379ce_d39bf309ac0b4693b8e41b0860515c67~mv2.jpg", altText: "Måttbild som visar trädgårdsstolens mått 61 × 47 × 81 cm och sitthöjden 44 cm" },
      ],
      raa: 460293440,
      tecken: 469
    },
    {
      kort: "651939aa",
      pid: "651939aa-a1a3-4989-aed9-f76079a6a90b",
      poster: [
        { id: "b379ce_a1fbc9a07b2e453cabdd8d8acc652265~mv2.jpg", altText: "Förvaringslåda i granträ med spaljé på ryggen och fyra hyllor" },
        { id: "b379ce_f4d860fcd5e84b79ad636364449b5649~mv2.jpg", altText: "Förvaringslådan på ett trädäck med krukväxter på hyllorna och luckan nedfälld" },
        { id: "b379ce_4fedbee3d8ea4fc9b8c5e68600c5a6d4~mv2.jpg", altText: "Närbild på det urfrästa greppet i lockets framkant" },
        { id: "b379ce_eafc657606024b77bd026e2902e034d0~mv2.jpg", altText: "Närbild på bandet som håller den nedfällda luckan vågrät" },
        { id: "b379ce_2158413c99774743a31cfc39544c4087~mv2.jpg", altText: "Måttbild som visar förvaringslådans mått 80 × 45 × 160 cm och innermåtten 74 × 37 × 43 cm" },
      ],
      raa: 17110928,
      tecken: 577
    },
    {
      kort: "66d781f8",
      pid: "66d781f8-54ee-42f1-907f-dd0e83a3ce87",
      poster: [
        { id: "b379ce_53dbe395f01941b58441c99313488946~mv2.jpg", altText: "Svart bistroset i gjuten aluminium med runt bord och två stolar" },
        { id: "b379ce_0bb1e309bd8445609141d1499c37a8de~mv2.jpg", altText: "Bistrosetet dukat med tekanna och koppar på en uteplats framför ett plank" },
        { id: "b379ce_7f3127e651154a07bcc930a3ab25be30~mv2.jpg", altText: "Närbild på ett svängt ben i gjuten aluminium" },
        { id: "b379ce_7c0300dbde804effb964fef19c7a5b6c~mv2.jpg", altText: "Närbild uppifrån på bordsskivans genombrutna bladmönster" },
        { id: "b379ce_2139e12cd3fe4254a3f241c5ef9882c5~mv2.jpg", altText: "Måttbild som visar bordets mått 60 × 65 cm och stolens 40 × 45 × 86 cm" },
      ],
      raa: 207555396,
      tecken: 550
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
