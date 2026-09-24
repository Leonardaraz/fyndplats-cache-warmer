async function () {
  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };

  const PLAN = [
    {
      kort: "2876122a",
      pid: "2876122a-116c-4221-a952-61bcc3216851",
      poster: [
        { id: "b379ce_c4d9a25b4b2a4b75b80febddc2669109~mv2.jpg", altText: "Grå knästol i böjträ (björk) med två stoppade knäpuffar, mot vit bakgrund" },
        { id: "b379ce_3018648b5d4e491bab2aef387a6d0fed~mv2.jpg", altText: "Knästolen uppställd vid ett hörnskrivbord med dator och bordslampa" },
        { id: "b379ce_d8e57d1432774964bfd844d372256aaa~mv2.jpg", altText: "Knästolen sedd bakifrån med justeringsvredet för ryggstödets vinkel" },
        { id: "b379ce_3266ebc525cc45ab9ece7ea29796c1f7~mv2.jpg", altText: "Knästolen i närbild vid ett skrivbord, sedd snett framifrån" },
        { id: "b379ce_fd1c82950b48491cb719355e40eb5f3c~mv2.jpg", altText: "Måttskiss med 51 × 84 × 93 cm samt sittyta 41 × 30 cm och knästöd 26 cm" },
        { id: "b379ce_c96d488f6fd445cfb70f454ac3198792~mv2.png", altText: "Faktakort: 51 × 84 × 93 cm, grå, max belastning 120 kg" },
      ],
      raa: 779687166,
      tecken: 683
    },
    {
      kort: "622bb2a1",
      pid: "622bb2a1-8f2a-4dd2-8d51-34eb9a0af830",
      poster: [
        { id: "b379ce_2f57741a5ac349d3b489dd3ce9aa2ea1~mv2.jpg", altText: "Svart kolgrill på hjul med öppet lock och de två sidoborden nedfällda" },
        { id: "b379ce_a37b05611a8a4fcbb500f3101a5cd2a7~mv2.jpg", altText: "Grillen i användning utomhus med kött och grönsaker på gallret" },
        { id: "b379ce_4b2aded3834f4a76b54fbbdeefb18694~mv2.jpg", altText: "Närbild på ett av sidoborden med en tallrik grillat kött och grönsaker" },
        { id: "b379ce_ca0b4a7d1a2645a0baefb634fbf7d160~mv2.jpg", altText: "Måttskiss med grillens mått 98 × 54 × 91 cm samt grillgallrets 46 × 40 cm" },
        { id: "b379ce_0b10fb3df4a84233881d5e2cbb36b52b~mv2.png", altText: "Faktakort: 98 × 54 × 91 cm, svart, 1840 cm² grillyta" },
      ],
      raa: 240961958,
      tecken: 570
    },
    {
      kort: "75830aad",
      pid: "75830aad-f961-4d5a-9c9d-e8a601d816ab",
      poster: [
        { id: "b379ce_4a048023bba54bb09d1085ecc596462a~mv2.jpg", altText: "Fotbollsspel i brun MDF med svarta ben, spelfigurer i rött, gult och blått" },
        { id: "b379ce_09d11efa7ffb4f64bfbec2a1f118dd1a~mv2.jpg", altText: "Två personer som spelar fotbollsspel i ett vardagsrum" },
        { id: "b379ce_8fd12160f1804d06a03dc4c906ac6e6f~mv2.jpg", altText: "Två unga män som spelar fotbollsspel bredvid en bokhylla" },
        { id: "b379ce_edfe20a5311240c791b694939672da10~mv2.jpg", altText: "Fotbollsspelet uppställt i ett barnrum med leksaker i bakgrunden" },
        { id: "b379ce_3195c9c9cb0948b1b077fd576bb8d1ff~mv2.jpg", altText: "Måttskiss med bordets mått 118 × 104 × 69 cm samt spelytan 104 × 55,5 cm" },
        { id: "b379ce_a8a69525d48f43d583ac7372467ab9d0~mv2.png", altText: "Faktakort: 118 × 104 × 69 cm, brun/svart, 2 bollar ingår" },
      ],
      raa: 340707825,
      tecken: 668
    },
    {
      kort: "8a9b1da9",
      pid: "8a9b1da9-26f4-4a04-b0fa-258a6fe32c92",
      poster: [
        { id: "b379ce_c66a9c0732a24c2eb4478668abb09f22~mv2.jpg", altText: "Basketkorg med transparent ryggplatta och röd kant, sedd rakt framifrån" },
        { id: "b379ce_1dcc5e2c9d974412a1d4ab8930d5f8c8~mv2.jpg", altText: "Basketkorgen väggmonterad utomhus med två personer som spelar" },
        { id: "b379ce_468c82a0d76f473797ccf126c920e741~mv2.jpg", altText: "Närbild på ringens infästning i ryggplattan" },
        { id: "b379ce_98f90fe45eed483395da307bd1037968~mv2.jpg", altText: "Närbild på nätet i vitt, rött och blått" },
        { id: "b379ce_8b126e22032a4c2ba3e2d76183abc646~mv2.jpg", altText: "Måttskiss med ryggplattans mått 113 × 73 cm och ringens diameter 45 cm" },
        { id: "b379ce_e8c41d67e94e4ddcb72678075d400971~mv2.png", altText: "Faktakort: 113 × 61 × 73 cm, röd kant, ringdiameter 45 cm" },
      ],
      raa: 739731668,
      tecken: 634
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
