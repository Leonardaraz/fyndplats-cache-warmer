async function () {
  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };

  const PLAN = [
    {
      kort: "2cfd222e",
      pid: "2cfd222e-ab50-4a1c-a020-b9f749a27a5b",
      poster: [
        { id: "b379ce_48ed2c8b43ae45f6a07f31dc93162e5b~mv2.jpg", altText: "Konstgjord växt på 95 cm med stora gröna, ljusstrimmiga blad i en svart kruka" },
        { id: "b379ce_08065e6ed116442690e2da0f741e1268~mv2.jpg", altText: "Konstväxten i ett vardagsrum bredvid ett skrivbord och en fåtölj" },
        { id: "b379ce_ad96b27234394514a6d6e888c4bc962a~mv2.jpg", altText: "Närbild på ett nytt, hoprullat blad bland de större bladen" },
        { id: "b379ce_f46aefc17fd14ef9ac26ffb9c97b2771~mv2.jpg", altText: "Växtens blad framför en spaljé av trä och grönska" },
        { id: "b379ce_718ff8587543475e97a871eea86f6f25~mv2.jpg", altText: "Måttbild med växtens höjd 95 cm och krukans mått 15 och 13 cm" },
      ],
      raa: 107244733,
      tecken: 553
    },
    {
      kort: "3e2c7389",
      pid: "3e2c7389-93ae-4f21-a556-f7186ff0cdb9",
      poster: [
        { id: "b379ce_313115fe8a5b468a9ef152fbd45c5d9c~mv2.jpg", altText: "Skobänk i naturfärgad bambu med sittyta och två ribbade hyllplan" },
        { id: "b379ce_72474422aeca4cb294e7e48fd0fe78a3~mv2.jpg", altText: "Skobänken i en hall vid en trappa, med skor på båda hyllplanen och en hatt på sittytan" },
        { id: "b379ce_efed12d97f474bc7ba980dc1b8ccd235~mv2.jpg", altText: "Närbild på sittytans hörn med skruvfästen och skor på hyllplanet under" },
        { id: "b379ce_bb5f4865aecc45fbb0c3fc84d174775f~mv2.jpg", altText: "Skobänken från sidan med sneakers och läderskor på de två hyllplanen" },
        { id: "b379ce_b6847499918949309ec3e78e3823a008~mv2.jpg", altText: "Måttbild med skobänkens mått 70, 28 och 45 cm" },
      ],
      raa: 824318185,
      tecken: 577
    },
    {
      kort: "5c5aedca",
      pid: "5c5aedca-4952-4ead-b2eb-716d2be7d125",
      poster: [
        { id: "b379ce_aa6776d592de4db698c6298c89ca8eae~mv2.jpg", altText: "Vit julgran på 150 cm med julkulor, klockor, klappar och kottar på en vit metallfot" },
        { id: "b379ce_5b9b7adb05ea4a9a813d708f10957380~mv2.jpg", altText: "Den vita granen i ett vardagsrum med inslagna paket under" },
        { id: "b379ce_22f54febc1dc4ae0b81a306f990c5bbd~mv2.jpg", altText: "Närbild på en rosa julkula som hänger på en vit gren" },
        { id: "b379ce_84e6b010d9134612a7a239ec32fcc6b4~mv2.jpg", altText: "Granen i ett ljust vardagsrum bredvid en grå soffa" },
        { id: "b379ce_2e74028466814674bcfa2620f0abdc1d~mv2.jpg", altText: "Måttbild med granens höjd 150 cm och bredd 85 cm bredvid siluetten av en person" },
      ],
      raa: 797271676,
      tecken: 565
    },
    {
      kort: "7f21945e",
      pid: "7f21945e-3b7b-4700-a943-6558ebe7de08",
      poster: [
        { id: "b379ce_eb70f2bdd3b944b588f8bbbc1eeeb9ec~mv2.jpg", altText: "Tre grå förvaringskorgar i flätad plast med lock och spännen, staplade på varandra" },
        { id: "b379ce_e8e00aa1d7f14d238a16b03b2a4cd6f0~mv2.jpg", altText: "Korgarna staplade bredvid en fåtölj, den översta öppen med vikta textilier i" },
        { id: "b379ce_2b522fe7db9f423aafa64f3d94a5aa85~mv2.jpg", altText: "Korgarna på hyllorna i en öppen förvaringsmöbel" },
        { id: "b379ce_71a0246ce64f4840ba88a3964a665c0f~mv2.jpg", altText: "Måttbild med korgarnas mått 35,5 × 28,5 × 18 cm, 33 × 24 × 15 cm och 28 × 20 × 12,5 cm" },
      ],
      raa: 977555209,
      tecken: 486
    },
    {
      kort: "985ff6d3",
      pid: "985ff6d3-41a8-4214-8b90-b990a2880bd8",
      poster: [
        { id: "b379ce_0114d19a7a3f433e9f90e955bd7a4574~mv2.jpg", altText: "Svart och silverfärgad brödrost för två skivor med vred för rostläge och knappar på framsidan" },
        { id: "b379ce_622c8ef67d1e4a06a09b5fbeff6191f0~mv2.jpg", altText: "Brödrosten på en marmorbänk med en rostad brödskiva i facket" },
        { id: "b379ce_fe541d8a2ee54b7e811b1ddf0c020f46~mv2.jpg", altText: "Brödrosten med värmegallret uppfällt och croissanter på gallret" },
        { id: "b379ce_5503250f278b4586b39440e52105f916~mv2.jpg", altText: "En kvinna tar en rostad skiva ur brödrosten i ett ljust kök" },
        { id: "b379ce_41ce39ee9d914f1a849b0e01d22d2062~mv2.jpg", altText: "Måttbild med brödrostens mått 26,4 × 15,6 × 18,9 cm och fackets mått 13,5 × 3,5 cm" },
      ],
      raa: 894894955,
      tecken: 601
    },
    {
      kort: "988ac121",
      pid: "988ac121-4920-4ec1-8c14-5e8f525bc8bb",
      poster: [
        { id: "b379ce_d9ba5944de4449afb1b715df4b268f18~mv2.jpg", altText: "Svart brasskärm i tre delar med rutmönster i metall" },
        { id: "b379ce_f393a1dc71be4c019e045bdd61133935~mv2.jpg", altText: "Brasskärmen framför en brasa i en öppen spis med vit marmorinramning" },
        { id: "b379ce_6168ba5e9f7e449684c1ee8c97fa77be~mv2.jpg", altText: "Brasskärmen framför en brasa i en öppen spis av natursten" },
        { id: "b379ce_a1c7c88ed8df44e4823c782dfe060549~mv2.jpg", altText: "Brasskärmen framför en eldstad med fiskbensmönstrat tegel" },
      ],
      raa: 106866976,
      tecken: 428
    },
    {
      kort: "b138effc",
      pid: "b138effc-0e30-4c25-9bea-36aae4b04545",
      poster: [
        { id: "b379ce_77edf245762f44b7b415a77778a7d445~mv2.jpg", altText: "Silverfärgad trimningsarm med bordsklämma, en svart ögla och två magslingor i rött och grönt" },
        { id: "b379ce_119582c64d494fd28bfed28e18f96429~mv2.jpg", altText: "En hund på ett trimbord med trimningsarmen fäst vid bordskanten" },
        { id: "b379ce_f2f8975cfb5e4601a024c5f85b7cd553~mv2.jpg", altText: "Närbild på de röda och gröna magslingorna med skumklädda byglar och den svarta öglan" },
      ],
      raa: 363094672,
      tecken: 385
    },
    {
      kort: "cfb722e4",
      pid: "cfb722e4-b588-4fd8-b609-56c5fd15d26e",
      poster: [
        { id: "b379ce_d3a1244431024bf3be6e78a904951e8e~mv2.jpg", altText: "Smal rullvagn i svart metall med fyra nätkorgar, en skiva i trälook överst och ett handtag på sidan" },
        { id: "b379ce_dcf8d32c441d45d69589f28ae5e4a067~mv2.jpg", altText: "Rullvagnen i en smal glipa mellan köksskåpet och kylskåpet, fylld med kryddburkar" },
        { id: "b379ce_6ad558efc8a34c7db324642c811fd2be~mv2.jpg", altText: "Rullvagnen i ett vardagsrum bredvid en fåtölj, med böcker och prydnadssaker i korgarna" },
        { id: "b379ce_45d21d106db24c26b73f5144c1bde38a~mv2.jpg", altText: "Rullvagnen i ett badrum bredvid badkaret, med handdukar och flaskor i korgarna" },
        { id: "b379ce_dea1c8e892374b7aab5b1b2350b166b1~mv2.jpg", altText: "Måttbild med vagnens mått 47 × 13 × 96,5 cm, 23 cm mellan planen och korgarnas mått 38 × 12 × 7 cm" },
      ],
      raa: 69591030,
      tecken: 686
    },
    {
      kort: "dcf149d1",
      pid: "dcf149d1-bc0f-43f7-a8e1-82df588a3a78",
      poster: [
        { id: "b379ce_10ba49a9cd2643b195bd1727f64cb363~mv2.jpg", altText: "Pall för barn i gräddvitt med tre grå steg och två handtag" },
        { id: "b379ce_d448878d98224df2bb59b46022b94f6c~mv2.jpg", altText: "En flicka står på pallen vid handfatet och borstar tänderna bredvid en vuxen" },
        { id: "b379ce_206a27166d1343c9a5167dbace5ca86d~mv2.jpg", altText: "Ett litet barn står på pallen och tvättar händerna vid handfatet" },
        { id: "b379ce_2e5a8514ba7c42cfb19a725911397e36~mv2.jpg", altText: "Ett barn står på pallen och sträcker sig mot en vägghylla" },
        { id: "b379ce_76e7a289134c4d4c97af1074a355365e~mv2.jpg", altText: "Måttbild med pallens mått 43 × 42 × 65,5 cm, stegen 36 × 17,5 cm och steghöjderna 14,5, 25 och 35,8 cm" },
      ],
      raa: 182096548,
      tecken: 601
    },
    {
      kort: "fd940665",
      pid: "fd940665-60f6-472c-922d-11d09cac17bb",
      poster: [
        { id: "b379ce_2cdebbceb1b34591a81b86738899bf20~mv2.jpg", altText: "Sidobord med skåp i trälook och svart handtag på en svart stålstomme" },
        { id: "b379ce_cacad332d05742d58f9dc8a65f759457~mv2.jpg", altText: "Sidobordet i en hall bredvid ett bredare konsolbord, som inte ingår" },
        { id: "b379ce_35c47d2c57b5481d8af12a04a5c828a5~mv2.jpg", altText: "Närbild på skåpdörren i trälook med det svarta handtaget" },
        { id: "b379ce_600e2b50ba684245b72254135188d5b2~mv2.jpg", altText: "Närbild på den svarta stålstommen mot golvet" },
        { id: "b379ce_76cd9feb963e403ea0ead3ef79a1a0aa~mv2.jpg", altText: "Måttbild med sidobordets mått 40 × 30 × 76 cm" },
      ],
      raa: 132992597,
      tecken: 524
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
