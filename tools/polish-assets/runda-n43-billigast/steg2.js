async function () {
  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };

  const PLAN = [
    {
      kort: "5a825b3f",
      pid: "5a825b3f-23e6-4733-9868-118784f3ed64",
      poster: [
        { id: "b379ce_7c4fd2928d39403baf576cefb7b59be7~mv2.jpg", altText: "Medicinskåp i rostfritt stål med frostad glasdörr och ett kors på dörren" },
        { id: "b379ce_a27749464e9c4c7cbca830ae489e401c~mv2.jpg", altText: "Medicinskåpet på en badrumsvägg med förpackningar på de tre hyllorna" },
        { id: "b379ce_c7ba7cf97ce44d1b8c3d9d2e04d70d87~mv2.jpg", altText: "Närbild på korset på den frostade glasdörren" },
        { id: "b379ce_044767d5e32043f9b1891ef8da5c5216~mv2.jpg", altText: "Närbild på låset vid dörrens kant" },
        { id: "b379ce_ee878f921a6c42fd9f975ae15c824968~mv2.jpg", altText: "Måttbild med medicinskåpets mått 20, 12 och 58 cm" },
      ],
      raa: 632431004,
      tecken: 510
    },
    {
      kort: "923236e5",
      pid: "923236e5-ad12-4709-bcf9-7e050dbf6435",
      poster: [
        { id: "b379ce_f886b9a186404be9a45d7cff5a3a6b2b~mv2.jpg", altText: "Väggdekor i metall med guldfärgade monsterablad på smala stjälkar" },
        { id: "b379ce_59066b3477184db6ab2ff6e068e0b84d~mv2.jpg", altText: "Väggdekoren stående på en vit vägg bredvid en rottingsoffa och gröna växter" },
        { id: "b379ce_8d5a1dd8531642cbb59f74bf3eeb604f~mv2.jpg", altText: "Väggdekoren liggande ovanför en byrå med en bordslampa och en radio" },
        { id: "b379ce_29fb82b8e1b94c37a1af6b326aeaad7c~mv2.jpg", altText: "Väggdekoren liggande på en vit tegelvägg ovanför böcker och blommor" },
        { id: "b379ce_a3554438943e4f999615f9ce7467d004~mv2.jpg", altText: "Måttbild med dekorens bredd 83 cm och höjd 39 cm" },
      ],
      raa: 790468496,
      tecken: 566
    },
    {
      kort: "b0766f63",
      pid: "b0766f63-5fb7-4ca0-b31f-5d056ad721ab",
      poster: [
        { id: "b379ce_0f2d91bef1b64737b7c67ce4edd238d1~mv2.jpg", altText: "Snöad julgran med tända varmvita lampor och kottar, foten klädd i säckväv" },
        { id: "b379ce_d7e392bc64d248eaa7745d200516134b~mv2.jpg", altText: "Julgranen i ett rum med röd vägg, bredvid inslagna paket" },
        { id: "b379ce_9375a4a5217e4a01a43aa21ea3eb0b86~mv2.jpg", altText: "Julgranen bredvid en öppen spis med paket och en tomtefigur" },
        { id: "b379ce_147a89198813402f85568990100566fa~mv2.jpg", altText: "Måttbild med granens bredd 47 cm bredvid en människosiluett" },
      ],
      raa: 666465742,
      tecken: 442
    },
    {
      kort: "c61ced0e",
      pid: "c61ced0e-46be-4577-99c9-798fd819ad0b",
      poster: [
        { id: "b379ce_d5fff6dbfb304e34a30e488c303abdeb~mv2.jpg", altText: "Öppen hylla i naturfärgad bambu med tre plan av ribbor" },
        { id: "b379ce_03a2b2fb1b694e7a8e90a36a43be0f15~mv2.jpg", altText: "Bambuhyllan i ett kök med tallrikar, burkar och en kastrull" },
        { id: "b379ce_37b9d5f108a54f3ebdc14fba83cd9623~mv2.jpg", altText: "Två bambuhyllor bredvid varandra med krukväxter, varav en ingår" },
        { id: "b379ce_b12914584b624afcba425644ec6601aa~mv2.jpg", altText: "Närbild på hyllans hörn och ribborna" },
        { id: "b379ce_8a40d2d74cd74261892b55e060cc282d~mv2.jpg", altText: "Måttbild med hyllans mått 62, 33 och 80 cm, 27,5 cm mellan planen och 17 cm till golvet" },
      ],
      raa: 219273303,
      tecken: 543
    },
    {
      kort: "e01513c6",
      pid: "e01513c6-4d23-4ac8-8b72-3b2749439b7c",
      poster: [
        { id: "b379ce_6d5d2e0b0e0e42938548c78df7261b5d~mv2.jpg", altText: "Sidobord i C-form med skiva i lönnlook, vit stomme och fyra hjul" },
        { id: "b379ce_389444416ff74679ae73e455150e8c29~mv2.jpg", altText: "Sidobordet vid en soffa med en laptop på skivan" },
        { id: "b379ce_137ec4e619b74bec8feabdd025afaf69~mv2.jpg", altText: "Sidobordet sett framifrån med de två höj- och sänkbara stolparna" },
        { id: "b379ce_dfc7ab35a64c44f38dc574202c618f08~mv2.jpg", altText: "Närbild på den vita stommen och hjulen" },
        { id: "b379ce_0a93d0fa681b4bb1ab163890c57f5217~mv2.jpg", altText: "Måttbild med bordets mått 60 och 40 cm och höjden 68–78 cm" },
      ],
      raa: 930292558,
      tecken: 515
    },
    {
      kort: "5bd95c2c",
      pid: "5bd95c2c-eae0-48fb-96d0-91228125a5af",
      poster: [
        { id: "b379ce_55dc687c2a9a4894b19cb4fd824eefba~mv2.jpg", altText: "Rektangulär väggspegel med svart ram" },
        { id: "b379ce_b38cf3414ba647929c313bf71d457409~mv2.jpg", altText: "Väggspegeln ovanför ett handfat i ett ljust badrum" },
        { id: "b379ce_4d0ea23a0c4c4a94b21eafd842efbd6a~mv2.jpg", altText: "Väggspegeln ovanför ett vitt sminkbord med en stol" },
        { id: "b379ce_b780936762034e1eb435135d19fb33c0~mv2.jpg", altText: "Väggspegeln ovanför en vägghängd skrivbordsskiva bredvid en krukväxt" },
        { id: "b379ce_e1e5b98f7ea5408f8802ce4ade6bbd08~mv2.jpg", altText: "Måttbild med spegelns mått 50 och 70 cm" },
      ],
      raa: 448287006,
      tecken: 487
    },
    {
      kort: "60f84a27",
      pid: "60f84a27-9823-4d93-9d02-59a18b0bd409",
      poster: [
        { id: "b379ce_295ea8f7fdd941a8b85624997e29e56e~mv2.jpg", altText: "Sex balansstenar i olika färger och tre storlekar, utspridda och staplade" },
        { id: "b379ce_b2d1b4694bf24856a61afb13a7d7fc1c~mv2.jpg", altText: "Ett barn balanserar på stenarna i ett barnrum" },
        { id: "b379ce_95ccd05b92df48408d5b3026d98ab57a~mv2.jpg", altText: "Balansstenarna utlagda på en grå matta" },
        { id: "b379ce_fd6dfd4b281c4464a446f9fdcdd1f27f~mv2.jpg", altText: "Närbild på den största stenen med fotavtryck på ovansidan" },
        { id: "b379ce_2a6dfd50d16c45f5b31a32d69176b8a8~mv2.jpg", altText: "Måttbild med stenarnas storlekar 37,5, 34,3 och 23 cm och höjderna 16, 7,6 och 4,3 cm" },
      ],
      raa: 490219706,
      tecken: 542
    },
    {
      kort: "a794b9e7",
      pid: "a794b9e7-76ba-40bc-8d06-ba09dc0e49da",
      poster: [
        { id: "b379ce_085cb040f60e4c57b46e2416f462bfd8~mv2.jpg", altText: "Smal julgran med snö på grenarna och fot av svart metall" },
        { id: "b379ce_e59b40cc7e8e4defb85e0b5ba2fa4cd6~mv2.jpg", altText: "Julgranen i ett rum med röd vägg, en öppen spis och inslagna paket" },
        { id: "b379ce_a3f37e655e1048a6b9fbc2b7fc8c2866~mv2.jpg", altText: "Närbild på granens topp med snöade grenspetsar" },
        { id: "b379ce_4a8fc45e9292404e9899b082ea1bdf53~mv2.jpg", altText: "Närbild på snöade grenar med julpynt, som inte ingår" },
        { id: "b379ce_4134269e656648b1a79dc7b82780b2ac~mv2.jpg", altText: "Måttbild med granens höjd 180 cm och bredd 60 cm bredvid en människosiluett" },
      ],
      raa: 47528891,
      tecken: 539
    },
    {
      kort: "75a38b7b",
      pid: "75a38b7b-e6ba-43d5-806b-b378067f148a",
      poster: [
        { id: "b379ce_e5fe8bd6ac8243c3903e2acaa35e16ed~mv2.jpg", altText: "Fiberoptisk julgran med stjärna i toppen och fot av metall" },
        { id: "b379ce_042dd14f3a1b408b8dd753ace921d2e0~mv2.jpg", altText: "Den tända julgranen lyser i flera färger bredvid en öppen spis" },
        { id: "b379ce_731bebeff4d047ee9c93a2e2aa50533b~mv2.jpg", altText: "Närbild på den genomskinliga stjärnan i toppen med små ljus" },
        { id: "b379ce_ce2fb6ff6cbd42808c08027c586ee157~mv2.jpg", altText: "Måttbild med granens höjd 120 cm och bredd 60 cm" },
      ],
      raa: 802968780,
      tecken: 422
    },
    {
      kort: "c4af8541",
      pid: "c4af8541-efa6-4fec-8bf5-027e2d3a3f5c",
      poster: [
        { id: "b379ce_d5803c1c27224212a59cc1f11aef88f3~mv2.jpg", altText: "Julgirlang med tända varmvita lampor, röda bär och kottar" },
        { id: "b379ce_8d5b8a13cea64c1994a9f549a4c872e9~mv2.jpg", altText: "Julgirlangen på en vit spiselkrans" },
        { id: "b379ce_1c857e71d602400a92616028392ef935~mv2.jpg", altText: "Närbild på snöade grenspetsar, en kotte och tända lampor" },
        { id: "b379ce_f9970ff39e554cac9d49dda034271a4e~mv2.jpg", altText: "Måttbild med girlangens längd 180 cm och höjd 30 cm" },
      ],
      raa: 696765589,
      tecken: 393
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
