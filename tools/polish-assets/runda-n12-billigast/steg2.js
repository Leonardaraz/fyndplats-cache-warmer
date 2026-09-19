async function () {
  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };

  const PLAN = [
    {
      kort: "062c9bd0",
      pid: "062c9bd0-e280-486a-ba08-9933dfcd3f8b",
      poster: [
        { id: "b379ce_3aac175a78ce4b7082da45a6bc26de45~mv2.jpg", altText: "Grått badrumsskåp med fyra lådor, mot vit bakgrund" },
        { id: "b379ce_76b77e29905a43c4a581d85927a82158~mv2.jpg", altText: "Skåpet placerat i ett badrum bredvid handfatet" },
        { id: "b379ce_87c6f4036d4749a7a081f8d5436505b0~mv2.jpg", altText: "Måttskiss på skåpet med 30 × 30 × 93 cm och lådornas invändiga mått" },
        { id: "b379ce_dc211a408e5647499b34490c74df9818~mv2.jpg", altText: "Skåpet i ett annat badrum med spegel ovanför" },
        { id: "b379ce_b332dbbc8abd4868a76a3634e6ef7fbe~mv2.png", altText: "Faktakort: 30 × 30 × 93 cm, melaminbelagd spånskiva, 30 kg maxbelastning" },
      ],
      raa: 429616458,
      tecken: 523
    },
    {
      kort: "372ee931",
      pid: "372ee931-9b2c-416e-9bc3-52976194153a",
      poster: [
        { id: "b379ce_023ddc7b2371485fb2998405f06089a1~mv2.jpg", altText: "Röd och svart elmotorcykel för barn, sedd snett framifrån mot vit bakgrund" },
        { id: "b379ce_b52eca0c1b4a494586d471b5b93b3aa0~mv2.jpg", altText: "Ett barn som kör motorcykeln utomhus" },
        { id: "b379ce_322413fe31b7480791f4a3cde108a023~mv2.jpg", altText: "Närbild på styret och strålkastaren" },
        { id: "b379ce_2330d9712415444bb1de5eca026ccfe2~mv2.jpg", altText: "Närbild på bakhjulet och sadeln" },
        { id: "b379ce_60f5f3b5a1c244c1b01a9395c8c637fe~mv2.jpg", altText: "Måttskiss på motorcykeln med 86 × 42 × 52 cm och hjulmått" },
        { id: "b379ce_09324864a44a4a2eb4ed4091b4eb8ccc~mv2.png", altText: "Faktakort: 86 × 42 × 52 cm, 3 km/h, 45 min körtid" },
      ],
      raa: 515087849,
      tecken: 575
    },
    {
      kort: "39d1df49",
      pid: "39d1df49-f1cf-45ae-bbf2-209c3e64d8df",
      poster: [
        { id: "b379ce_4087efe949a4455dad761b561ccd18f0~mv2.jpg", altText: "Fyra stapelbara pallar i cremevit med ben i böjd björk, mot vit bakgrund" },
        { id: "b379ce_b171fd032fcc476b887b4038993550b5~mv2.jpg", altText: "Pallarna använda som sittplatser i ett vardagsrum" },
        { id: "b379ce_32c01fef2ad74ab18da59478c6b2fe58~mv2.jpg", altText: "Måttskiss på pallen med Ø40 × 45 cm och sitsens mått" },
        { id: "b379ce_7163b94ea49a4c7c948d6e8d64f9755b~mv2.jpg", altText: "Närbild på böjträbenen och filttassarna under" },
        { id: "b379ce_79e036f4dc3248d398681933c7f41069~mv2.jpg", altText: "Närbild på den stoppade sitsen i linnelook" },
        { id: "b379ce_38a761ef262142028b0c3bff862955ec~mv2.png", altText: "Faktakort: Ø40 × 45 cm, björkplywood, 120 kg per pall" },
      ],
      raa: 589236341,
      tecken: 606
    },
    {
      kort: "70ef279b",
      pid: "70ef279b-cd0a-4db0-ac3b-c13cb5b75ca6",
      poster: [
        { id: "b379ce_047c9762babe41eeb7488e53e1e540b4~mv2.jpg", altText: "Fristående markis i mörkgrå, monterad mellan golv och tak, mot vit bakgrund" },
        { id: "b379ce_ad878eaaa4944f9499518a12be2860d4~mv2.jpg", altText: "Markisen uppsatt på en balkong som insynsskydd" },
        { id: "b379ce_7def2f264a58403c8b00ab423bde5786~mv2.jpg", altText: "Närbild på handkurbeln" },
        { id: "b379ce_4bb1e389811c4696b3242c962a2aa769~mv2.jpg", altText: "Markisen på en uteplats i solljus" },
        { id: "b379ce_335925a1da4a4a089f512e897e07a5cf~mv2.jpg", altText: "Måttskiss på markisen med 150 cm bredd och 220–310 cm justerbar höjd" },
        { id: "b379ce_57891ae60d3e4b368b44cd82293ef84e~mv2.png", altText: "Faktakort: 150 cm bred, 220-310 cm hög, aluminium" },
      ],
      raa: 885630284,
      tecken: 586
    },
    {
      kort: "87689f8d",
      pid: "87689f8d-0c1e-4376-8336-d89ba287cb24",
      poster: [
        { id: "b379ce_61ffffc08acf4694a7ca76bd5508e330~mv2.jpg", altText: "Hopfällbart hängmattestativ i svart och silver, mot vit bakgrund" },
        { id: "b379ce_3ea1fe9cc1944b639acfe852bc849b27~mv2.jpg", altText: "Stativet uppsatt med en randig hängmatta i en trädgård" },
        { id: "b379ce_3b1c83f4289f40aea265d9eec1c2df9d~mv2.jpg", altText: "Stativet omvandlat till stativ för hängande fåtölj" },
        { id: "b379ce_802e2fbe909e47c6b44d09bfb8eed7e4~mv2.jpg", altText: "Närbild på det hopfällda stativet" },
        { id: "b379ce_a447f24550f7487aa880e45623e4bd4f~mv2.jpg", altText: "Måttskiss på stativet med 290 × 92 × 88 cm uppfällt" },
        { id: "b379ce_3716500df6aa40dd9a451ea9e885aaba~mv2.png", altText: "Faktakort: 290 × 92 × 88 cm, stål, 120 kg maxbelastning" },
      ],
      raa: 601140523,
      tecken: 600
    },
    {
      kort: "3ab4521a",
      pid: "3ab4521a-9d86-4f3f-b803-d9ea270c5e51",
      poster: [
        { id: "b379ce_baf99a8834714e519996126f8627995c~mv2.jpg", altText: "Rosa kontorsstol i teddytextil med knappstoppad rygg, mot vit bakgrund" },
        { id: "b379ce_e569ac6997364dd58dc004105754777b~mv2.jpg", altText: "Stolen placerad vid ett skrivbord i ett ljust rum" },
        { id: "b379ce_fa2f80f364944f77a47165f644046b94~mv2.jpg", altText: "Närbild på den knappstoppade ryggen och armstödet" },
        { id: "b379ce_036580321ab94c8283ae35c92857ae0a~mv2.jpg", altText: "Extrem närbild på teddytextilens struktur" },
        { id: "b379ce_56c2f4d1c2144a34bd50236306b21e51~mv2.jpg", altText: "Måttskiss på stolen med 63 × 61,5 × 93–101 cm" },
        { id: "b379ce_e6058977bef3461fa0fec9e5af45889c~mv2.png", altText: "Faktakort: 63 × 61,5 × 93-101 cm, teddytextil, 120 kg maxbelastning" },
      ],
      raa: 377228399,
      tecken: 614
    },
    {
      kort: "84bfc22a",
      pid: "84bfc22a-d488-47b9-84a1-055df0573880",
      poster: [
        { id: "b379ce_a8992def312a49e6862b81b64742a48a~mv2.jpg", altText: "180 cm hög konstgjord Monstera deliciosa i svart kruka, mot vit bakgrund" },
        { id: "b379ce_c2b206c3b1da49aca416749178c933b2~mv2.jpg", altText: "Växten placerad i ett vardagsrum bredvid en fåtölj" },
        { id: "b379ce_2a5b91f6962049bbaa2c10f825c724c1~mv2.jpg", altText: "Närbild på de flikiga bladen i solljus" },
        { id: "b379ce_b7109563ea5842cfb24f59449f372e71~mv2.jpg", altText: "Närbild på stjälkarna och bladens fästen" },
        { id: "b379ce_64c12a3bcc4f42249d427b33bd5c56cf~mv2.jpg", altText: "Måttskiss på växten med 180 cm höjd och Ø20 cm kruka" },
        { id: "b379ce_f199260eb50548dd800637df46e4d6e9~mv2.png", altText: "Faktakort: 180 cm högt, kruka Ø20 × 17,5 cm, plast och metall" },
      ],
      raa: 481586968,
      tecken: 606
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
