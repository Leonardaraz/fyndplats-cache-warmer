async function () {
  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };

  const PLAN = [
    {
      kort: "163ce1e2",
      pid: "163ce1e2-803d-4b4c-9210-513337de689d",
      poster: [
        { id: "b379ce_7bc436a5f59a404f8900ee969b48b836~mv2.jpg", altText: "Mörkgrått skoskåp med två klaffluckor och ljus topskiva, mot vit bakgrund" },
        { id: "b379ce_68cdd5281d4d42dabb701ab1fbd942a9~mv2.jpg", altText: "Skoskåpet uppställt i en hall under en hylla med krokar" },
        { id: "b379ce_9a09a6e99a7c4afca5fb76e8f123395d~mv2.jpg", altText: "Skoskåpet i en hall med hörlurar och hatt på hyllan ovanför, vas och miniklocka ovanpå" },
        { id: "b379ce_63556a54660140ee85d7b017fd5d80a3~mv2.jpg", altText: "Skoskåpet i en ljus hall med skor synliga i de öppna luckorna" },
        { id: "b379ce_08d13e4c830e496a8561bfc57a5c4e1d~mv2.jpg", altText: "Måttskiss med 80 × 26 × 72 cm samt luckans breddmått 57 cm" },
        { id: "b379ce_86c9a2258ed34ffc9e3427457f6343ee~mv2.png", altText: "Faktakort: 72 × 26 × 80 cm, mörkgrå, maxbelastning 5 kg per lucka" },
      ],
      raa: 136168561,
      tecken: 691
    },
    {
      kort: "1d3f6755",
      pid: "1d3f6755-a7bf-4ce4-812f-9ab2cffe512d",
      poster: [
        { id: "b379ce_b15b07b873cc401eab66da9b237aa9e3~mv2.jpg", altText: "Fem mjuka byggklossar i blått, grönt och grått, mot vit bakgrund" },
        { id: "b379ce_83a852b1a4a14a2d93239cc2f717fa96~mv2.jpg", altText: "Ett barn kliver på klossarnas ramp och kub i ett lekrum" },
        { id: "b379ce_0c02348e8feb458893121a40cc39120d~mv2.jpg", altText: "Två barn bygger ett torn av grå block, en blå kub och den gröna rampen" },
        { id: "b379ce_134af823bfaf4f81b78e5c81434ab3aa~mv2.jpg", altText: "Klossarna uppställda på en rund matta i ett barnrum med ett tält i bakgrunden" },
        { id: "b379ce_431f4f89f1574a9aa57f66f16893cd0c~mv2.jpg", altText: "Måttskiss på klossarnas fem former med cm-mått" },
        { id: "b379ce_96ff75317f3847b8840443c0f03a89ff~mv2.png", altText: "Faktakort: 40,6 × 40,6 × 20,3 cm, blå/grön/grå, konstläder och EPE-skum" },
      ],
      raa: 122734696,
      tecken: 676
    },
    {
      kort: "300a9113",
      pid: "300a9113-2197-4df4-a914-87bf6a5c224a",
      poster: [
        { id: "b379ce_546fe909432a4ac4b9c430f69a874953~mv2.jpg", altText: "Svart kökssoptunna med pedal och ribbat mönster, mot vit bakgrund" },
        { id: "b379ce_d8452fd69ea34d72a2b4d8360c7d4f44~mv2.jpg", altText: "Soptunnan uppställd i ett kök med marmordiskbänk" },
        { id: "b379ce_e9173c50a2964ad8a3443073ed0d4e52~mv2.jpg", altText: "Soptunnan i ett ljust rum bredvid en hög krukväxt" },
        { id: "b379ce_ea75f2e5768942ebb976ff60efe142ed~mv2.jpg", altText: "Soptunnan öppen med de två löstagbara inneremmarna synliga" },
        { id: "b379ce_4abe8898bdf84a7f99182fb12396ab55~mv2.jpg", altText: "Måttskiss med soptunnans bredd 45,5 cm och de två 20-liters facken" },
        { id: "b379ce_13097b773b724707be07ee08d22d6f57~mv2.png", altText: "Faktakort: 45,5 × 36,5 × 51 cm, svart, 2 x 20 liter" },
      ],
      raa: 580659153,
      tecken: 630
    },
    {
      kort: "671465dc",
      pid: "671465dc-5008-4aca-9f14-6adeecabcceb",
      poster: [
        { id: "b379ce_c74c500d37dc412f91076bf71e0e6bd7~mv2.jpg", altText: "Svart vibrationsplatta i hopfällt läge, med blått LED-ljus längs kanten" },
        { id: "b379ce_6cc512f01ad14df68b3abd797b342946~mv2.jpg", altText: "En kvinna tränar stående på plattan med de medföljande träningsbanden, i ett vardagsrum" },
        { id: "b379ce_2c2aa60f9e694cfe8bad0362e4180986~mv2.jpg", altText: "Måttskiss med plattans mått 48 × 32 × 13 cm och träningsbandens längd 85 cm" },
        { id: "b379ce_818c24240737401a8fdf8003de209185~mv2.png", altText: "Faktakort: 48 × 32 × 13 cm, svart, 120 hastighetslägen" },
      ],
      raa: 1530068,
      tecken: 482
    },
    {
      kort: "90214a8b",
      pid: "90214a8b-975d-4196-84fc-f2a2a7f809b7",
      poster: [
        { id: "b379ce_fc9f7df396e2488b8ecf88264fb76153~mv2.jpg", altText: "Beige stoppad sittbänk med knappdekor på svarvade träben, mot vit bakgrund" },
        { id: "b379ce_68839151b37a464b805f98d6499e276d~mv2.jpg", altText: "Sittbänken uppställd vid en sängkant i ett sovrum" },
        { id: "b379ce_f00c052be847412aab73c37c6874d45a~mv2.jpg", altText: "Närbild på den knappstoppade sitsen och det snidade träbenet" },
        { id: "b379ce_56f90ce6ae124bffbf8365cdffb4e5f0~mv2.jpg", altText: "Närbild på tygets vävstruktur och knapparnas stoppning" },
        { id: "b379ce_625b3beb04a44035b60564bb90b077d0~mv2.jpg", altText: "Måttskiss med 80 cm längd, 40 cm djup och 43 cm höjd" },
        { id: "b379ce_13326039825e4d58b58e95a95cd6cbec~mv2.png", altText: "Faktakort: 80 × 40 × 43 cm, beige, maxbelastning 120 kg" },
      ],
      raa: 203209313,
      tecken: 637
    },
    {
      kort: "fdea573f",
      pid: "fdea573f-a107-4c21-8f1f-3c6a2e7f8ee7",
      poster: [
        { id: "b379ce_dd68f011ef854d77919653b41322eb7d~mv2.jpg", altText: "Grå blomlåda med inbyggt spaljé, planterad med gröna växter på en terrass" },
        { id: "b379ce_719945e66eca414e98eb62467637030d~mv2.jpg", altText: "Måttskiss med 103 cm höjd, 103 cm längd och 29 cm djup" },
        { id: "b379ce_efad8ac9cd2148b8ab62b85538f059f3~mv2.jpg", altText: "Närbild på hörnets flätning där lådan möter spaljén" },
        { id: "b379ce_2147982247d64d73b38977d99107f0e1~mv2.jpg", altText: "Närbild på lådans flätmönster med gröna blad hängande över kanten" },
        { id: "b379ce_6f5fbc644dcc4297b18fff3542610ebe~mv2.jpg", altText: "Närbild på spaljéns flätade konstruktion och sammanfogningen upptill" },
        { id: "b379ce_3ec2100408b047f1abf856ee2bec5687~mv2.png", altText: "Faktakort: 103 × 29 × 103 cm, grå, polyrotting och stål" },
      ],
      raa: 796432539,
      tecken: 659
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
