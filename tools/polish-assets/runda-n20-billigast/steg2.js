async function () {
  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };

  const PLAN = [
    {
      kort: "00a83f2f",
      pid: "00a83f2f-4a78-4474-8c5c-d2b7030fef20",
      poster: [
        { id: "b379ce_f22169f212a842c4a55ebcc536f8b94d~mv2.jpg", altText: "Skobänk i bambu med stoppad sits och förvaringsfack, mot vit bakgrund" },
        { id: "b379ce_cee11e099a3b4d8d9f93e9f14c69feef~mv2.jpg", altText: "Skobänken i en ljus hall med skor uppställda bredvid" },
        { id: "b379ce_6353fdc1c68e41178211231a49e7c44c~mv2.jpg", altText: "Skobänken med locket öppet, förvaringsfacket under sitsen synligt" },
        { id: "b379ce_9bb362891fc540f1bc39e1ffc775f6ee~mv2.jpg", altText: "Närbild på bambuns lamellkonstruktion och sömmarna i sitsen" },
        { id: "b379ce_7a4f2fd9074c4022a9105ed7d32b4dde~mv2.jpg", altText: "Måttskiss som visar skobänkens bredd 100 cm, djup 40 cm och höjd 60 cm" },
      ],
      raa: 47765696,
      tecken: 559
    },
    {
      kort: "48e85aee",
      pid: "48e85aee-18cb-408f-9120-a4d73ab20746",
      poster: [
        { id: "b379ce_f1595b569221495b942103cacd601331~mv2.jpg", altText: "Högt badrumsskåp i mörkgrått med ljusgrå luckor, mot vit bakgrund" },
        { id: "b379ce_77a883fd0b1249e781d28416f37f4c1e~mv2.jpg", altText: "Badrumsskåpet monterat på en vägg i ett ljust badrum" },
        { id: "b379ce_091321633a594db0a85d8c97e0383f80~mv2.jpg", altText: "Närbild på skåpets gångjärn och den öppna mellanhyllan" },
        { id: "b379ce_1bba1767187849638f88b1609d4c9aef~mv2.jpg", altText: "Måttskiss som visar skåpets bredd 30 cm, djup 30 cm och höjd 183 cm" },
      ],
      raa: 734373792,
      tecken: 433
    },
    {
      kort: "5a004e82",
      pid: "5a004e82-cb6a-459a-951f-d9e3f82ba2e0",
      poster: [
        { id: "b379ce_ff409447705e42bcbc3d067ad1e60ee3~mv2.jpg", altText: "Tre Halloween-clowner i svart, lila och grönt hår, mot vit bakgrund" },
        { id: "b379ce_1427dc916ad847f0a98024fa28cbb0b0~mv2.jpg", altText: "Clownerna uppställda i en dekorerad Halloween-scen utomhus i mörker" },
        { id: "b379ce_206894415cb14e608e7266109ef8a753~mv2.jpg", altText: "Närbild på den grönhåriga clownens ansikte med röda lysande ögon" },
        { id: "b379ce_3e36d7ddb79e4038b9c35699aacb48a2~mv2.jpg", altText: "Närbild på en av clownernas skor och klädsel" },
        { id: "b379ce_6a58313b24644bd088d5e2de11ef3fcf~mv2.jpg", altText: "Måttskiss som visar de tre clownernas höjder 100, 95 och 85 cm samt bottenmåttet 40 × 35 cm" },
      ],
      raa: 487064013,
      tecken: 577
    },
    {
      kort: "4239a0a5",
      pid: "4239a0a5-bf2e-473e-831c-77ad66f3b254",
      poster: [
        { id: "b379ce_c611f60405b64a3ea13486ef3b9ed195~mv2.jpg", altText: "Vit badrumskommod med tre lådor och skåp, mot vit bakgrund" },
        { id: "b379ce_423a775ae402473eb7c85d9c3fed6cd2~mv2.jpg", altText: "Badrumskommoden placerad bredvid ett handfat i ett ljust badrum" },
        { id: "b379ce_45d1510649e04d9a8cc098240aeec219~mv2.jpg", altText: "Skåpdelen öppen med den justerbara hyllan synlig" },
        { id: "b379ce_c9cd68a8495a48b482effc7580e716b8~mv2.jpg", altText: "Närbild på en utdragen låda med lådstopp" },
        { id: "b379ce_8c395e93f6244e6d9b05b13dcd164d71~mv2.jpg", altText: "Måttskiss som visar kommodens bredd 60 cm, djup 30 cm och höjd 80 cm" },
      ],
      raa: 659044074,
      tecken: 521
    },
    {
      kort: "4c6ffd03",
      pid: "4c6ffd03-a94c-4a93-a334-eae924c2e382",
      poster: [
        { id: "b379ce_07232ac7f3144e6e9433232cabc7c9cc~mv2.jpg", altText: "Konstgjord julgran i granform, 180 cm hög, mot vit bakgrund" },
        { id: "b379ce_c0f6c8989e2e4a13ae8d2bca80a1f4b9~mv2.jpg", altText: "Julgranen uppställd i ett vardagsrum utan dekorationer" },
        { id: "b379ce_0192fe12efe547f6aa6862eec6a1a8a7~mv2.jpg", altText: "Julgranen uppställd inomhus, fotograferad från sidan" },
        { id: "b379ce_1b971a6c2ddf4023a743ba7340e95f92~mv2.jpg", altText: "Närbild på grenspetsarnas struktur och metallfoten" },
        { id: "b379ce_bd4a286b9b9146568815c8ad46d28ffb~mv2.jpg", altText: "Måttskiss som visar granens diameter cirka 120 cm och höjd 180 cm" },
      ],
      raa: 223068230,
      tecken: 524
    },
    {
      kort: "e78ebbb6",
      pid: "e78ebbb6-49b2-45f3-996b-22f53af80290",
      poster: [
        { id: "b379ce_1317eb4325ee480e89c3eccbfbaf4265~mv2.jpg", altText: "Ramlös LED-helkroppsspegel 40 × 150 cm, mot vit bakgrund" },
        { id: "b379ce_250b6442af4547aa80490bf19a8ed6f3~mv2.jpg", altText: "Spegeln lutad mot en vägg i ett sovrum, tänd med varmt ljus" },
        { id: "b379ce_97d12a9027bc43489aad5c8253ad1820~mv2.jpg", altText: "Måttskiss som visar spegelns bredd 40 cm och höjd 150 cm utan stativ" },
      ],
      raa: 322526795,
      tecken: 329
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
