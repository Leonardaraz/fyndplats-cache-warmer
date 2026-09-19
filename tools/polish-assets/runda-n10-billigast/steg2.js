async function () {
  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };

  const PLAN = [
    {
      kort: "05e65736",
      pid: "05e65736-4bf2-4d40-9175-b96f2233fb9c",
      poster: [
        { id: "b379ce_5d5ed5c50a174119b009b69b8cb1ec93~mv2.jpg", altText: "Fällbart skrivbord i natur/vitt med öppen hylla och sidoficka, mot vit bakgrund" },
        { id: "b379ce_144b66c513294cb78506f5525c756edf~mv2.jpg", altText: "Kvinna som sitter i soffan och läser med skrivbordet bredvid som sidobord med böcker i hyllan" },
        { id: "b379ce_24d29f8ec6d54e559dec956bb39fb6e2~mv2.jpg", altText: "Skrivbordet bredvid en säng med kaffekopp och bärbar dator på skivan" },
        { id: "b379ce_661a4dc4f29041479eea9aed3e186eb3~mv2.jpg", altText: "Kvinna som arbetar vid skrivbordet i ett vardagsrum med krukväxter i bakgrunden" },
        { id: "b379ce_fd2b409b220f408d8510e96d1117da7d~mv2.jpg", altText: "Måttskiss på skrivbordet med 80 × 50 × 75 cm utfällt och 80 × 21 × 75 cm hopfällt, 50 kg maxbelastning" },
        { id: "b379ce_363795040b2646b4b920f690b9779a4f~mv2.png", altText: "Faktakort: mått 80 × 50 × 75 cm, hopfällt 80 × 21 × 75 cm, maxbelastning 50 kg totalt, skivan 40 kg, vikt 12 kg" },
      ],
      raa: 955368433,
      tecken: 825
    },
    {
      kort: "34f22c58",
      pid: "34f22c58-0df2-41c4-9275-e5046d4b8a7b",
      poster: [
        { id: "b379ce_5dcb57f53b8f4f729312340ded2f10d0~mv2.jpg", altText: "Trädgårdsbänk i naturträ med vagnshjulsformade ben, mot vit bakgrund" },
        { id: "b379ce_6a711480bac7479fb1a7dda30367eb36~mv2.jpg", altText: "Bänken i en trädgård med blommor och en grind i bakgrunden" },
        { id: "b379ce_abe3081bf2b2423c985b8259370d31fb~mv2.jpg", altText: "Måttskiss på bänken med 39,5 cm höjd, 50 cm djup och 98 cm längd" },
        { id: "b379ce_9fe7cd4de427480ea09f1a59b3387434~mv2.jpg", altText: "Närbild på det svängda vagnshjulsbenet underifrån" },
        { id: "b379ce_50ea0861a08d4088a0836921356f195a~mv2.jpg", altText: "Bänken uppställd på en stenlagd uteplats bredvid en gräsmatta" },
        { id: "b379ce_361e533fe3564f598a038429d39352a3~mv2.png", altText: "Faktakort: mått 98 × 50 × 39,5 cm, sitthöjd 39,5 cm, maxbelastning 250 kg, hjulens diameter 41 cm, vikt 9 kg" },
      ],
      raa: 764002571,
      tecken: 701
    },
    {
      kort: "61008b48",
      pid: "61008b48-6332-4a52-ac26-6bad72bd1c18",
      poster: [
        { id: "b379ce_ce12c1d78e7a4ecfbc525ec66f51c15f~mv2.jpg", altText: "Hopfälld hundgrind i brun furu, mot vit bakgrund, uppdelad i två sektioner" },
        { id: "b379ce_c34e06f878ee46a3a09a1f5bbaa64919~mv2.jpg", altText: "Hundgrind uppställd i ett kök med en hund liggande innanför på golvet" },
        { id: "b379ce_ff41152cb3b64383818aa2b53beb10a7~mv2.jpg", altText: "Närbild på händer som öppnar grindens dörr med säkerhetslåset synligt" },
        { id: "b379ce_e99fecba372148659ba7f5bf7f9b733b~mv2.png", altText: "Måttskiss på hundgrinden med 71 cm höjd, 66 cm dörrhöjd, 41,5 cm djup och 113–166 cm bredd" },
        { id: "b379ce_1510d2ee711a4cd596aceb4b40364966~mv2.png", altText: "Faktakort: mått 71 × 113–166 cm, dörrens mått 41,5 × 66 cm, 2 stödfötter, material furu, vikt 6,5 kg" },
      ],
      raa: 146747618,
      tecken: 646
    },
    {
      kort: "6b8aa5a3",
      pid: "6b8aa5a3-fc56-4f78-9b11-3886e3acdf13",
      poster: [
        { id: "b379ce_8b599ff31f1448da917c2f15f058e685~mv2.jpg", altText: "Svart triangelformad kompostbehållare med öppet lock som visar jord och avfall inuti" },
        { id: "b379ce_aa117039c7e24b309289ebaad4c94fc7~mv2.jpg", altText: "Komposten uppställd bredvid ett växthus med krukväxter runt om" },
        { id: "b379ce_5ce48ec30c364955833692949eda8b16~mv2.jpg", altText: "Måttskiss på komposten med 78 cm höjd, 75 cm djup och 78 cm bredd uppställd på en stenlagd uteplats" },
        { id: "b379ce_bd7f441160d842779937279cc8c99c01~mv2.png", altText: "Faktakort: mått 78 × 75 × 78 cm, volym 240 l, 3 luckor, 66 ventilationshål, vikt 8 kg" },
      ],
      raa: 764669180,
      tecken: 525
    },
    {
      kort: "72491f25",
      pid: "72491f25-0dca-4c31-ab40-51b52d3750b7",
      poster: [
        { id: "b379ce_4ba6bd33b66346108907b03fbdef5afa~mv2.jpg", altText: "Smalt badrumsskåp i bambu med öppna hyllfack upptill och spjälad lucka nedtill, mot vit bakgrund" },
        { id: "b379ce_ade5f2203dc741d19f96c8b0549c407c~mv2.jpg", altText: "Badrumsskåpet i ett badrum bredvid ett badkar och en toalettstol, med handdukar och flaskor på hyllorna" },
        { id: "b379ce_564246c986824455a54805ba555fd296~mv2.jpg", altText: "Närbild på hopvikta handdukar i grått och beige på skåpets översta hyllplan" },
        { id: "b379ce_53296190166b47918fb1f019cfeefda2~mv2.jpg", altText: "Närbild på skåpets ben och nedre hörn i bambu" },
        { id: "b379ce_ad4730db79f54204977f09cf2e43cbae~mv2.jpg", altText: "Måttskiss på skåpet med 120 cm höjd, 32,9 cm bredd och 29,9 cm djup" },
        { id: "b379ce_9e684cffbee34cc7b6d53f948d365084~mv2.png", altText: "Faktakort: mått 32,9 × 29,9 × 120 cm, maxbelastning 20 kg totalt, per hyllplan 5 kg, material bambu, vikt 8,5 kg" },
      ],
      raa: 548268605,
      tecken: 791
    },
    {
      kort: "231202df",
      pid: "231202df-5d5a-4145-8d15-4f46970387b1",
      poster: [
        { id: "b379ce_0ce3b0453aa44d9fa0eb9bf08fd28bad~mv2.jpg", altText: "Ergonomisk knästol i cremevitt tyg med björkträram, mot vit bakgrund" },
        { id: "b379ce_96523f1752df4b51b3bf8cc4fca05f1c~mv2.jpg", altText: "Knästolen vid ett skrivbord i ett grått hemmakontor med bokhylla och lampa" },
        { id: "b379ce_05dc262f0aa54fa2ae39e167ae590151~mv2.jpg", altText: "Närbild på knästolen på en matta i ett vardagsrum" },
        { id: "b379ce_7b84996d540f4bfa88f8eeeaa528ab59~mv2.jpg", altText: "Knästolen och en separat pall visade med måtten 55 cm höjd, 85 cm djup, 41 cm och 48 cm bredd" },
        { id: "b379ce_980b8f581f0a41eab65c1cbe765bb713~mv2.png", altText: "Faktakort: mått 55 × 85 × 55 cm, maxbelastning 120 kg, bordshöjd 75–90 cm, dynans tjocklek 7,5 cm, vikt 9 kg" },
      ],
      raa: 863534494,
      tecken: 636
    },
    {
      kort: "3ee7a87a",
      pid: "3ee7a87a-20d9-45c2-8cb8-231fba5c910d",
      poster: [
        { id: "b379ce_d356e3ca205d4bc6acde0897242a1126~mv2.jpg", altText: "Ergonomisk knästol i svart konstläder på en Z-ram med fyra hjul, mot vit bakgrund" },
        { id: "b379ce_8b2f14c134b845a89d1b6edae90acc5f~mv2.jpg", altText: "Knästolen vid ett vitt skrivbord i ett ljust hemmakontor" },
        { id: "b379ce_fec0b02e2cd145cfb9788335049c2d11~mv2.jpg", altText: "Närbild på Z-ramens led och det justerbara handtaget i trä" },
        { id: "b379ce_c967c04cf91344889017ae891b9985a4~mv2.jpg", altText: "Måttskiss på knästolen med 120 kg maxbelastning, 47 cm höjd, 42 cm och 70 cm i botten" },
        { id: "b379ce_a1b26bf556ae4e748fa1bd60162880f7~mv2.png", altText: "Faktakort: mått 42 × 70 × 47 cm, maxbelastning 120 kg, dynans tjocklek 7 cm, material gummiträ/konstläder, vikt 8 kg" },
      ],
      raa: 64628254,
      tecken: 640
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
