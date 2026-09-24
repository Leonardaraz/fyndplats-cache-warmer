async function () {
  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };

  const PLAN = [
    {
      kort: "07e3cb1d",
      pid: "07e3cb1d-855d-4a77-8336-3bd687e24893",
      poster: [
        { id: "b379ce_b64b12d3141e407dacd4e412c4d7953c~mv2.jpg", altText: "Uppblåsbar tomte i röd släde med julklappar, dragen av tre renar i halsdukar" },
        { id: "b379ce_74fe00b7eacd4a82bbc885bed41d6a3d~mv2.jpg", altText: "Den upplysta tomten med släde och renar framför ett fönster med julbelysning" },
        { id: "b379ce_da50bfd19f9e4a319018696f2890d769~mv2.jpg", altText: "Närbild på en ren med horn, blåvit halsduk och grönt täcke med snöflinga" },
        { id: "b379ce_b91d77a03e1540c894a24a1cbce31903~mv2.jpg", altText: "Närbild på renens gröna täcke med en vit snöflinga" },
        { id: "b379ce_1903b00bf60449568729743472a1e612~mv2.jpg", altText: "Måttbild: figuren är 319 cm lång, 59 cm djup och 132 cm hög" },
      ],
      raa: 28112933,
      tecken: 577
    },
    {
      kort: "16fe3c28",
      pid: "16fe3c28-7409-49d8-88f6-e4bcd02d87d8",
      poster: [
        { id: "b379ce_5c9eeb6d9be14a73b0f84b480f186639~mv2.jpg", altText: "Vitt nattduksbord med två lådor och runda svarta knoppar" },
        { id: "b379ce_1c5e30b1b68841888d8fbf2911d8dce4~mv2.jpg", altText: "Nattduksbordet bredvid en säng med en bordslampa, böcker och en kopp" },
        { id: "b379ce_6c2b8792b5904bfbabe97a39d1c76dba~mv2.jpg", altText: "En kvinna i sängkanten lägger en bok på nattduksbordet" },
        { id: "b379ce_54bc0b5a8f5f466a84b3b25b747f0516~mv2.jpg", altText: "Nattduksbordet bredvid en soffa med en vas med gröna kvistar och en kopp" },
        { id: "b379ce_17e8a56d67ac4a0c8c9ed0e91658dd1e~mv2.jpg", altText: "Måttbild: bordet är 48 × 39,5 × 51 cm och bär 30 kg, och lådan är 32,8 × 33,2 × 10 cm invändigt" },
      ],
      raa: 89081724,
      tecken: 589
    },
    {
      kort: "494e0dab",
      pid: "494e0dab-6481-4b44-a6c6-cd1b6c17f77f",
      poster: [
        { id: "b379ce_32aa67ac741f457797f9e101b852af9b~mv2.jpg", altText: "Rund sittpuff i svart sammet med guldfärgad ram av stålrör" },
        { id: "b379ce_cc9a3666a1794738a1b26893a8081c5e~mv2.jpg", altText: "Sittpuffen på en mönstrad matta framför en grön fåtölj" },
        { id: "b379ce_dfb1f521581249d39fd0ea3dccc1b29f~mv2.jpg", altText: "Sittpuffen i en hall bredvid ett par vita tofflor" },
        { id: "b379ce_353d243b53114a6b837ac83396848e40~mv2.jpg", altText: "Sittpuffen med dynan avlyft och en kudde och böcker i förvaringen" },
        { id: "b379ce_bdcda69ab2064d73932ede544a6514f1~mv2.jpg", altText: "Måttbild: puffen är Ø42 × 39 cm, står 7 cm över golvet och bär 120 kg" },
      ],
      raa: 604683228,
      tecken: 539
    },
    {
      kort: "4bd41e91",
      pid: "4bd41e91-e988-4c57-9fdf-5fb6909bd2cf",
      poster: [
        { id: "b379ce_a9fcf67ff8644ca4bf52b8bef8de0d40~mv2.jpg", altText: "Stativ för kapsåg i röd och svart metall med rullstöd i båda ändar" },
        { id: "b379ce_6de7a379caa449f99524a95640468904~mv2.jpg", altText: "Stativet i en verkstad med en kapsåg monterad och en lång bräda på rullstöden" },
        { id: "b379ce_9320eb2697a04c5a92cf03d35c942a89~mv2.jpg", altText: "Stativet med en grön kapsåg och en bräda i en verkstad" },
        { id: "b379ce_fb01a01df93948b4b9f93edc08bf84dd~mv2.jpg", altText: "En man sågar en lång bräda med en kapsåg på stativet" },
        { id: "b379ce_dd960747d7984205a60d49a9ec24b497~mv2.jpg", altText: "Måttbild: stativet är 94–195 cm långt, 63 cm djupt och 76 cm högt, och hopfällt 94 × 41 × 22,5 cm" },
      ],
      raa: 11888744,
      tecken: 590
    },
    {
      kort: "4f0fa784",
      pid: "4f0fa784-9661-47d4-9fc0-d4f303e59968",
      poster: [
        { id: "b379ce_f49c983fc67e411ea089ba7e81fb4123~mv2.jpg", altText: "Gnistskydd i svart metall med tre paneler och slingor på sidopanelerna" },
        { id: "b379ce_98db505c5ad543b88dc424829f57e3e8~mv2.jpg", altText: "Gnistskyddet framför en tegelspis med brasa, julstrumpor och girlang" },
        { id: "b379ce_223d195066784888b680959824227605~mv2.jpg", altText: "Närbild på nätet och en slinga i metall på en sidopanel" },
        { id: "b379ce_7a8df13b90674e9c8638b9ea457022e6~mv2.jpg", altText: "Närbild på en slinga och skarven mellan två paneler" },
        { id: "b379ce_127fa90a303c42c8949813212f0df783~mv2.jpg", altText: "Måttbild: skyddet täcker 132,5 cm och är 76,5 cm högt, med mittpanel 70 cm och sidopaneler 30 cm" },
      ],
      raa: 877106260,
      tecken: 584
    },
    {
      kort: "4fb02f99",
      pid: "4fb02f99-ae11-4c9a-8482-bcbdb70e8a11",
      poster: [
        { id: "b379ce_791730b96e69496f8c3d44048a701a83~mv2.jpg", altText: "Vit shoppingvagn med låda, teleskophandtag och hjulstjärnor bak, i två vyer" },
        { id: "b379ce_bd7107173e274cedac5f01d2b9fd59de~mv2.jpg", altText: "Shoppingvagnen i en mataffär mellan hyllorna" },
        { id: "b379ce_0b936e7d6b14420c9cd7196c33d4ad41~mv2.jpg", altText: "Närbild på en hjulstjärna med tre hjul för trappor" },
        { id: "b379ce_cb5a15ab87f24fa39e8607d71c48ad1c~mv2.jpg", altText: "Närbild på ett svängbart framhjul med broms" },
        { id: "b379ce_a7780c665b344ad68e1f34fd8b4bb999~mv2.jpg", altText: "Måttbild: vagnen är 52 × 48 × 100 cm och hopfälld 52 × 49 × 19 cm" },
      ],
      raa: 505635301,
      tecken: 521
    },
    {
      kort: "53386372",
      pid: "53386372-173f-4c7f-8aa8-c9504de4467b",
      poster: [
        { id: "b379ce_bdbafbbcebbc4d76b7d0bc882732ad8e~mv2.jpg", altText: "Gnistskydd i svart metall med två nätpaneler, en stor och en mindre" },
        { id: "b379ce_51c3547aaf1c4005a1fe292eabbe49d3~mv2.jpg", altText: "Gnistskyddet framför en öppen spis i sten med brasa i ett vardagsrum" },
        { id: "b379ce_c3457e958d2a4c1eae2fa2a83afce1c2~mv2.jpg", altText: "Gnistskyddet med den mindre panelen vinklad bakåt" },
      ],
      raa: 854283111,
      tecken: 330
    },
    {
      kort: "6200b3c9",
      pid: "6200b3c9-0eba-4dde-810c-9843bf9d9af5",
      poster: [
        { id: "b379ce_ab0b499f63384ac3b83db2c1377d2b05~mv2.jpg", altText: "Sängram i vit metall med ribbor, utan huvudgavel" },
        { id: "b379ce_14d19b7c2c6f483fb115bc6df9325053~mv2.jpg", altText: "Sängramen bäddad med vit madrass och gul kudde, med korgar under sängen" },
        { id: "b379ce_be7a6ada80094735951528417e693c1c~mv2.jpg", altText: "Den bäddade sängramen i ett sovrum med en resväska och en låda under" },
        { id: "b379ce_3f1a53cd13cd4e1ba958622066d6d808~mv2.jpg", altText: "Sängramen med grönt överkast och en grå förvaringslåda under" },
      ],
      raa: 871942409,
      tecken: 442
    },
    {
      kort: "92afa6e3",
      pid: "92afa6e3-103a-4ff7-ad1f-b7a4ab43ff59",
      poster: [
        { id: "b379ce_5a2a100f924e494c90a71c93f6b36a8a~mv2.jpg", altText: "Fyra runda pallar med grå stoppad sits och svarta stålben" },
        { id: "b379ce_df39cd8861fa45aba2b91a1d42db713c~mv2.jpg", altText: "Pallarna vid ett bord i ett kök, två av dem staplade" },
        { id: "b379ce_6a3b7ee708e645e29513e833680132ba~mv2.jpg", altText: "En kvinna sitter på en pall vid ett sminkbord" },
        { id: "b379ce_f3a9bb49f21641b9a621d9d6c5062c77~mv2.jpg", altText: "En pall bredvid ett vitt sidobord och en fåtölj med gröna kuddar" },
        { id: "b379ce_231ddc13168e4085b6410014bb6298dc~mv2.jpg", altText: "Måttbild: pallen är 40 × 40 × 45 cm och bär 120 kg" },
      ],
      raa: 827210283,
      tecken: 512
    },
    {
      kort: "a1c98be2",
      pid: "a1c98be2-42c2-4e8f-8705-3c8cae9b9684",
      poster: [
        { id: "b379ce_599522345b2441e5bee4044ff1de284c~mv2.jpg", altText: "Snurrbar pall med knappad sits i grå sammet och rund silverfärgad fot" },
        { id: "b379ce_5d9fcf18fa1644f98e4f2547bb7fd7cd~mv2.jpg", altText: "Pallen vid en köksbänk med marmorskiva" },
        { id: "b379ce_38eaf11a43eb4bc3b511571a6a7b7cea~mv2.jpg", altText: "Pallen vid en köksbänk i trä med ett glas juice" },
        { id: "b379ce_3270085cbbb64192a75a35946b834a45~mv2.jpg", altText: "En knytnäve trycker ner den stoppade sitsen" },
        { id: "b379ce_ebbcda2e0eb5482caa3eb261e0e6a125~mv2.jpg", altText: "Måttbild: pallen är Ø39 cm och 49–65 cm hög, med ett fack på 35 cm under sitsen och en fot på 38,5 cm" },
      ],
      raa: 8438839,
      tecken: 542
    },
    {
      kort: "c40a2b10",
      pid: "c40a2b10-6597-4cb6-8b72-840609a8e71a",
      poster: [
        { id: "b379ce_c6674e1fef86464fbd75b17783f9cbc5~mv2.jpg", altText: "Smal vit mediahylla med åtta tomma fack" },
        { id: "b379ce_da95acdb5e444fe293743e1b53cd7458~mv2.jpg", altText: "Mediahyllan fylld med cd-skivor i ett arbetsrum bredvid en kontorsstol" },
        { id: "b379ce_7fc3504e9f394b58829d52f8d725f199~mv2.jpg", altText: "Mediahyllan fylld med cd-skivor i alla fack" },
        { id: "b379ce_93d3fcc563104fe58d82efdf22fc3bfd~mv2.jpg", altText: "Måttbild: hyllan är 58 × 24 × 126,3 cm med fack på 47 cm och bär 15 kg" },
      ],
      raa: 240983521,
      tecken: 417
    },
    {
      kort: "c6ff6fe8",
      pid: "c6ff6fe8-2f00-4c3d-881f-06c6630a8150",
      poster: [
        { id: "b379ce_c2a05d62de2b403392a2984b816e7679~mv2.jpg", altText: "Sex sexkantiga hantlar på 1, 3 och 5 kg i ett svart ställ med handtag" },
        { id: "b379ce_3a5e6a7c7cd84c25a9cfb3d98d5d32e6~mv2.jpg", altText: "En kvinna gör utfall med två gröna hantlar, med stället på golvet" },
        { id: "b379ce_242ce3d740674877a05ac53ec1af2abd~mv2.jpg", altText: "En kvinna lyfter stället med hantlarna som en kettlebell på en yogamatta" },
        { id: "b379ce_aae2200b0ab64e22ba9f0d2a7b10985a~mv2.jpg", altText: "Stället med sex hantlar på ett trägolv" },
        { id: "b379ce_f58e8d1d9dc94fe797fae7a7961c86e4~mv2.jpg", altText: "Måttbild med en grön hantel och en tabell över måtten för 1, 3 och 5 kg" },
      ],
      raa: 477420980,
      tecken: 559
    },
    {
      kort: "cbbabd2c",
      pid: "cbbabd2c-d6d3-4364-aaa8-906b6ac7f5eb",
      poster: [
        { id: "b379ce_8eaa113ad1244876b059741857d043b2~mv2.jpg", altText: "Hög vinhylla i svart metall med rustikt bruna skivor, glashållare, låda och flaskhållare" },
        { id: "b379ce_30262cb94f9e49d9a36d75b72570e9b0~mv2.jpg", altText: "Vinhyllan med glas, flaskor och barverktyg bredvid en fåtölj" },
        { id: "b379ce_5ba4d0e4f9f54fe6940814bb0ea8f718~mv2.jpg", altText: "Vinhyllan fylld med vinflaskor och glas bredvid en skänk" },
        { id: "b379ce_d568bbf64e0b41109ab375f38ebc0591~mv2.jpg", altText: "Vinhyllan med flaskor och glas i ett vardagsrum med en taklampa" },
        { id: "b379ce_20b2232ad8284e1f9715e554a7c86325~mv2.jpg", altText: "Måttbild: hyllan är 40 × 30 × 148 cm och bär 31 kg, och lådan är 34 × 28 × 8 cm invändigt" },
      ],
      raa: 493434253,
      tecken: 600
    },
    {
      kort: "d5ed3e90",
      pid: "d5ed3e90-a4d8-4c1c-8941-6cb570e824e9",
      poster: [
        { id: "b379ce_3407c74accd2447aac6e4f30e3c0dcbe~mv2.jpg", altText: "Smal hylla i ljus bambu med sex hyllplan av ribbor" },
        { id: "b379ce_f68ee9ac664248298bdef32184ddae42~mv2.jpg", altText: "Bambuhyllan i ett badrum med flaskor, handdukar och tvättmedel" },
        { id: "b379ce_109a9926f23444f69bd131ba8e68c48b~mv2.jpg", altText: "Bambuhyllan med böcker, lådor och prydnadssaker bredvid en soffa" },
        { id: "b379ce_b4004d3255e8491288dbc0b5010c9b9f~mv2.jpg", altText: "Bambuhyllan i ett kök med burkar, askar och skålar" },
        { id: "b379ce_0361475423144617aac5e94a5febbf65~mv2.jpg", altText: "Måttbild: hyllan är 60 × 26 × 161 cm med 28 cm mellan hyllplanen och bär 36 kg" },
      ],
      raa: 168069925,
      tecken: 548
    },
    {
      kort: "d60cd696",
      pid: "d60cd696-293a-4c7c-9336-41ea9614413c",
      poster: [
        { id: "b379ce_6d552629810f4ddd86e6fcace81dde2e~mv2.jpg", altText: "Julby i trä formad som en ljusbåge med upplysta hus, kyrka och granar" },
        { id: "b379ce_f4e90fafd64747ba96e879d203a990ac~mv2.jpg", altText: "Den upplysta julbyn på en spiselkrans bredvid ljus och julgransgrenar" },
        { id: "b379ce_988c75d9d6434b69a6f0d4f7c7fd2e14~mv2.jpg", altText: "Julbyn på en svart skänk under en julkrans, bredvid en lykta och ljus" },
        { id: "b379ce_dc9b7b85b28f4309bf14642043208f75~mv2.jpg", altText: "Närbild på julbyns hus, kyrka, granar och tomte i trä" },
        { id: "b379ce_8bcd4191cf9c4255a39e7ab7c08a916f~mv2.jpg", altText: "Måttbild: julbyn är 45 × 10 × 35 cm" },
      ],
      raa: 148726842,
      tecken: 539
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
