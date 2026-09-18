async function () {
  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };

  const PLAN = [
    {
      kort: "ffaa3fad",
      pid: "ffaa3fad-d362-4af7-b9c4-3e1eb64952d7",
      poster: [
        { id: "b379ce_7c24433b2b2240bd92ec1e146bb88e58~mv2.jpg", altText: "Runt trädgårdsbord i gjutet svart aluminium med spröjsmönster i skivan, mot vit bakgrund" },
        { id: "b379ce_4aaa2d1d43574327a3c80e94732de2da~mv2.jpg", altText: "Bordet på en uteplats bredvid en hängstol, med böcker och en kaffekopp på skivan" },
        { id: "b379ce_ae5dd585479f453cbfd0e7b42340bb3a~mv2.jpg", altText: "Närbild på benens ring och spröjsmönstret underifrån, med en krukväxt i bakgrunden" },
        { id: "b379ce_7119e816b5db4ccab30d7bb11601e0b9~mv2.jpg", altText: "Närbild på benens ring i solljus på en uteplats" },
        { id: "b379ce_5dee8d852ee5402282b28c402abda1d2~mv2.jpg", altText: "Måttskiss på bordet med 60 cm diameter och 53 cm höjd" },
        { id: "b379ce_749e063f148f462dab7e61bab96428fa~mv2.png", altText: "Faktakort: 60 × 60 × 53 cm, gjutaluminium, 50 kg maxbelastning" },
      ],
      raa: 823383292,
      tecken: 705
    },
    {
      kort: "0136e7d9",
      pid: "0136e7d9-0f52-47f6-b347-74aab2daf89e",
      poster: [
        { id: "b379ce_9686fcfca9524bdd9db0c5687dbe6184~mv2.jpg", altText: "Förvaringstorn med sex lådor i två torn, i tre blå nyanser, mot vit bakgrund" },
        { id: "b379ce_74377fc70ea044e0902691f81c3c74ac~mv2.jpg", altText: "Ett barn som plockar leksaker ur lådorna i ett barnrum med festlig väggdekor" },
        { id: "b379ce_88c27905e54b4ddaaa31bdf103329b76~mv2.jpg", altText: "Närbild på lådornas rundade handtagsgrepp i de tre blå nyanserna" },
        { id: "b379ce_2a6b9997a58b4a1d8d60e08495b59875~mv2.jpg", altText: "Måttskiss på tornen med 75 × 37 × 56,5 cm totalt och en enskild lådas mått" },
        { id: "b379ce_75fc047d26504183b3f7a9a2a921f0f0~mv2.png", altText: "Faktakort: 75 × 37 × 56,5 cm, sex lådor, 10 kg per låda" },
      ],
      raa: 805306504,
      tecken: 589
    },
    {
      kort: "17c747cb",
      pid: "17c747cb-bafa-4f64-8b3a-0b66d1b34706",
      poster: [
        { id: "b379ce_618f61aad4724279a76b3c361a8da628~mv2.jpg", altText: "Fyra stapelbara pallar med grå stoppad sits och böjträben i björk, mot vit bakgrund" },
        { id: "b379ce_a99e3ce9a5b848e28d057659aedb0a0f~mv2.jpg", altText: "Pallarna uppställda runt ett matbord i ett kök" },
        { id: "b379ce_1808fdb26f244cd5a6c903211431080b~mv2.jpg", altText: "Pallarna staplade på varandra bredvid ett sideboard, med en fruktskål ovanpå" },
        { id: "b379ce_c7394c323b674168921cc4c342ff3346~mv2.jpg", altText: "Närbild på sitsens gråa tyg och det böjda björkbenet" },
        { id: "b379ce_430e8af07ec74e489ed08163c1104cb0~mv2.jpg", altText: "Måttskiss på en pall med Ø40 × 45 cm, sits Ø32 cm och 120 kg maxbelastning" },
        { id: "b379ce_a510ae613120439c84bbe6185e2589e0~mv2.png", altText: "Faktakort: Ø40 × 45 cm, björkplywood, 120 kg per pall" },
      ],
      raa: 655265500,
      tecken: 677
    },
    {
      kort: "227fae7d",
      pid: "227fae7d-67bc-49ed-8924-a89f0aa8c57f",
      poster: [
        { id: "b379ce_d1e0f04b3a3a4f538e37caf2ec0d0340~mv2.jpg", altText: "Konstgjort bambuträd, 180 cm högt i svart kruka, mot vit bakgrund" },
        { id: "b379ce_b7222138f05f4d6188b0addc00370abc~mv2.jpg", altText: "Trädet i ett vardagsrum bredvid en grå fåtölj och en tavla" },
        { id: "b379ce_c76216d401cc4e0e904884a959290b9a~mv2.jpg", altText: "Trädet i ett fönsterparti bredvid ett matbord" },
        { id: "b379ce_15869bac2cf64c25af17945ede097e29~mv2.jpg", altText: "Närbild på bambuträdets gröna blad" },
        { id: "b379ce_c6e370bc1d574465849792bc107c6e56~mv2.jpg", altText: "Måttskiss på trädet med 180 cm höjd och kruka Ø18 × 14 cm" },
        { id: "b379ce_d434006160484e0990252d063b1576ac~mv2.png", altText: "Faktakort: 180 cm högt, kruka Ø18 × 14 cm, polyeten" },
      ],
      raa: 498775374,
      tecken: 603
    },
    {
      kort: "2bc98714",
      pid: "2bc98714-1b36-489b-9380-50d98c473409",
      poster: [
        { id: "b379ce_9cc9fdf380bc4fc1828cc9012a849509~mv2.jpg", altText: "Skobänk i bambu med mörk stoppad sits och öppen hylla i spjälor, mot vit bakgrund" },
        { id: "b379ce_2427cefa7efd4282a2a3f8faef3c72ff~mv2.jpg", altText: "En kvinna som sitter på bänken och tar på sig skor i en hall med skor och korgar under" },
        { id: "b379ce_4829c67b6d944942a74a062ba45c5af1~mv2.jpg", altText: "En kvinna som sitter på bänken vid en säng med böcker under" },
        { id: "b379ce_1d1ad36366964ada8804a50c3d0776fa~mv2.jpg", altText: "Bänken använd som soffbord i ett vardagsrum med böcker och dekor ovanpå" },
        { id: "b379ce_6e7464ee03144ed8bb87b7c4ac18eca0~mv2.jpg", altText: "Måttskiss på bänken med 220 kg maxbelastning, 45 cm höjd, 33 cm djup och 102 cm bredd" },
        { id: "b379ce_599fb829a48644b4b030db02eac590b7~mv2.png", altText: "Faktakort: 102 × 33 × 45 cm, bambu, 220 kg maxbelastning" },
      ],
      raa: 794792319,
      tecken: 731
    },
    {
      kort: "56b32f2f",
      pid: "56b32f2f-b27a-40ab-8e60-0bb5af3b8422",
      poster: [
        { id: "b379ce_79245e331ac0488fb847e289690598c9~mv2.jpg", altText: "Soptunna i borstat rostfritt stål med fotpedal, mot vit bakgrund" },
        { id: "b379ce_cda94471279f4c7187d80ac3404361e7~mv2.jpg", altText: "Tunnan i ett vitt kök bredvid en köksö" },
        { id: "b379ce_1df344bb319c4b769b095ee315813fd2~mv2.jpg", altText: "Tunnan i ett ljust kök med vedspis i bakgrunden" },
        { id: "b379ce_3c4141f673e54312875100bc22e9c532~mv2.jpg", altText: "Tunnan i ett mörkgrått kök bredvid en köksö med kaffemaskin" },
        { id: "b379ce_d024ea1d65944716be8d1b77581d10b6~mv2.jpg", altText: "Måttskiss på tunnan med 41,8 × 36,7 × 58 cm" },
        { id: "b379ce_606c1cf3c8eb4cad9ddf90ace6545c90~mv2.png", altText: "Faktakort: 41,8 × 36,7 × 58 cm, rostfritt stål, 2 × 20 liter" },
      ],
      raa: 87096588,
      tecken: 604
    },
    {
      kort: "5f66bf37",
      pid: "5f66bf37-f65f-4b64-9034-01df6025cdc3",
      poster: [
        { id: "b379ce_4bd3d1e86d9e40c5870aa176038b4fbd~mv2.jpg", altText: "Vibrationsplatta i svart med LED-display och motståndsband, mot vit bakgrund" },
        { id: "b379ce_c63ac1bce01f4a51b3d2ca524eb61c8b~mv2.jpg", altText: "En kvinna som tränar med motståndsbanden stående på plattan i ett vardagsrum" },
        { id: "b379ce_d36c1f46b58441c59a134eaa1b923cb0~mv2.jpg", altText: "Måttskiss på plattan med 48 × 32 × 12,5 cm" },
        { id: "b379ce_721681d8d06846829c3061a816b39199~mv2.png", altText: "Faktakort: 48 × 32 × 12,5 cm, 120 hastigheter, 120 kg maxbelastning" },
      ],
      raa: 739160798,
      tecken: 456
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
