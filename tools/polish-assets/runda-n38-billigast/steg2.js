async function () {
  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };

  const PLAN = [
    {
      kort: "0fda8bfe",
      pid: "0fda8bfe-67ec-4360-942b-4d25c9573b0c",
      poster: [
        { id: "b379ce_836d0c5b156f40f38c4831cc9f8cb049~mv2.jpg", altText: "Konstgjort buxbomsträd med tre klot på tvinnade stammar i en svart kruka" },
        { id: "b379ce_e049bf63208b41dd99ff9bb0404cf8fe~mv2.jpg", altText: "Buxbomsträdet på en terrass framför en utesoffa" },
        { id: "b379ce_cf506a1459494addb99a87d48ce1ac94~mv2.jpg", altText: "Buxbomsträdet i ett vardagsrum bredvid en skänk i trä" },
        { id: "b379ce_de6bc8378f7c4956813969a77ec661a0~mv2.jpg", altText: "Buxbomsträdet bredvid en skänk och ett fönster med ljusa gardiner" },
        { id: "b379ce_c094055b8cea4046aecfb6a11c082d7a~mv2.jpg", altText: "Måttbild som visar trädet 90 cm högt med kloten Ø27, Ø23 och Ø18 cm och krukan 17 × 13,5 cm" },
      ],
      raa: 699660089,
      tecken: 572
    },
    {
      kort: "33c51730",
      pid: "33c51730-339a-4977-98d6-25f46bffc517",
      poster: [
        { id: "b379ce_d518d1b4b9934a808fc79cc781a583a3~mv2.jpg", altText: "Svart paraplyställ i stål med galler, krokar och droppskål" },
        { id: "b379ce_b39ef771cdfd471299c6bd3cb252f288~mv2.jpg", altText: "Paraplyställ i en hall med långa paraplyer i facken och hopfällbara på krokarna" },
        { id: "b379ce_570c96e6384e491cb92c3daed33602dd~mv2.jpg", altText: "Paraplyställ med paraplyer bredvid en dörr och en krukväxt" },
        { id: "b379ce_f97ff8c39a8b4b83b47f7e35c0fae843~mv2.jpg", altText: "Paraplyställ under två krokhängare i en ljus hall" },
        { id: "b379ce_39499363a35c44199a4d0ab264c76f27~mv2.jpg", altText: "Måttbild som visar paraplystället 50 × 24 × 68 cm" },
      ],
      raa: 710738340,
      tecken: 537
    },
    {
      kort: "1a1487a8",
      pid: "1a1487a8-4673-4ecb-9eee-4fc60f89a547",
      poster: [
        { id: "b379ce_784424ac0a8d47428adefdce226e2a45~mv2.jpg", altText: "Skärmtak med välvt tak i genomskinlig polykarbonat och två svarta konsoler" },
        { id: "b379ce_e5c61efc55db4cd69c38150c4fe5dfa7~mv2.jpg", altText: "Skärmtaket monterat ovanför en dörr med spröjsade glasrutor" },
        { id: "b379ce_8da3d7b6a72d47eea9a28c56efaf986f~mv2.jpg", altText: "Skärmtaket över en dubbeldörr på en vit husvägg" },
        { id: "b379ce_56a17825f62e4f30bb3265bfede2f708~mv2.jpg", altText: "Skärmtaket ovanför en dörr i en vit panelvägg" },
        { id: "b379ce_b8f0d6b0cc2541d08981b46c69bb4765~mv2.jpg", altText: "Måttbild som visar skärmtaket 103 × 96,5 cm och 27 cm högt vid väggen" },
      ],
      raa: 59950585,
      tecken: 538
    },
    {
      kort: "084b987b",
      pid: "084b987b-b64b-464c-afc6-486da4a4faef",
      poster: [
        { id: "b379ce_3f5005caccf6477aa8e7cedc52aac626~mv2.jpg", altText: "Sidobord i rustikt brunt med öppet fack och skåp på svart stålram" },
        { id: "b379ce_2b6185f4ada34f029ca1c039a27a91c1~mv2.jpg", altText: "Sidobordet bredvid en ljus soffa med en vas på skivan" },
        { id: "b379ce_dec4540c948b4c1190df320d6f23100e~mv2.jpg", altText: "Närbild på skivan och det öppna facket med en kopp och böcker" },
        { id: "b379ce_0e44ade563e247198e376412c354fee2~mv2.jpg", altText: "Måttbild som visar sidobordet 34 × 30 × 80 cm med skåpdörren öppen" },
      ],
      raa: 317109261,
      tecken: 440
    },
    {
      kort: "12e66c66",
      pid: "12e66c66-5a33-4d88-8c72-18445fab61e5",
      poster: [
        { id: "b379ce_3043ae9dafb3455a9502a7eb026c9f61~mv2.jpg", altText: "Elektronisk darttavla med två utfällda dörrar som håller pilarna" },
        { id: "b379ce_d0515392cc674ae4ab78d7dc75b8b3a3~mv2.jpg", altText: "En person kastar en pil mot darttavlan på väggen" },
        { id: "b379ce_00394500807443c3ade89917c447dcb3~mv2.jpg", altText: "Närbild på en dörr med tre pilar i hållaren" },
        { id: "b379ce_a37e471f405c40e989751ec353318474~mv2.jpg", altText: "Närbild på displayen och knapparna under tavlan" },
        { id: "b379ce_4489be22f1804b57ae5704ad64e8f4f1~mv2.jpg", altText: "Måttbild som visar darttavlan 90,5 cm bred med öppna dörrar och 44 × 50 cm stängd" },
      ],
      raa: 918062148,
      tecken: 527
    },
    {
      kort: "285d9ab7",
      pid: "285d9ab7-8ef5-482d-8744-5babf7ac6cda",
      poster: [
        { id: "b379ce_b3108881c26e4efb859ed33b8e7d198c~mv2.jpg", altText: "Krämvit pedalhink på 30 liter med stängt lock" },
        { id: "b379ce_20afe6150aa8411293d2627e7bdb9d18~mv2.jpg", altText: "Pedalhinken i ett kök bredvid en bardisk och en krukväxt" },
        { id: "b379ce_b4d8063f8b5e4dd3bb2fdd9c7c8dcfb6~mv2.jpg", altText: "Pedalhinken på ett grått golv bredvid en skänk" },
        { id: "b379ce_6ecb4bc9e17b4d8ea8ee683a540ffcb9~mv2.jpg", altText: "Pedalhinken med locket öppet i ett vardagsrum" },
        { id: "b379ce_394af8b89bf740198a2a201e289a2ed3~mv2.jpg", altText: "Måttbild som visar pedalhinken 30 × 36 × 63,5 cm och den svarta innerhinken" },
      ],
      raa: 91150696,
      tecken: 511
    },
    {
      kort: "2af7ec2d",
      pid: "2af7ec2d-a4a3-4a23-8ec2-a86f5d7726de",
      poster: [
        { id: "b379ce_1481dd9e87064840a51816c7a239a486~mv2.jpg", altText: "Rosa staffli för barn med whiteboard, djurmotiv och två tygboxar" },
        { id: "b379ce_768815d458d940b5b7e0d536ce62d0bc~mv2.jpg", altText: "Staffliet med krittavlan i ett barnrum bredvid en nallebjörn" },
        { id: "b379ce_2e4535db402440dea931c5a68a13fa06~mv2.jpg", altText: "Närbild på de två tygboxarna med djurmotiv" },
        { id: "b379ce_7646435f14ec4fe494d3430ead38faa2~mv2.jpg", altText: "Närbild på skylten med giraff, flodhäst, lejon, björn och apa" },
        { id: "b379ce_517881650a404aac9b355c200d1d6fb7~mv2.jpg", altText: "Måttbild som visar staffliet 53,5 × 49 × 113 cm och ritytan 47 × 32 cm" },
      ],
      raa: 223585563,
      tecken: 541
    },
    {
      kort: "3bd54459",
      pid: "3bd54459-485b-4a15-b3bb-edfb18066d90",
      poster: [
        { id: "b379ce_94a8664dc60d43439ea46ed25e4bfd2b~mv2.jpg", altText: "Fågelmatarstation i svart stål med fyra krokar, tre matare och två skålar" },
        { id: "b379ce_fd5b60a6c21c405b852fc433f19b6b09~mv2.jpg", altText: "Fågelmatarstationen på en gräsmatta med en fågel vid skålen" },
        { id: "b379ce_337325d6fec94c999f14d6439bf86c3b~mv2.jpg", altText: "Närbild på ett fäste med vingskruv på stången" },
        { id: "b379ce_3c500c4d40cc4aad92b406e6a4ae1b25~mv2.jpg", altText: "Närbild på vattenskålen i plast på stången" },
        { id: "b379ce_6654ef0e3106492588f85cb2e148ae9b~mv2.jpg", altText: "Måttbild som visar stationen 208 cm hög och 54,5 cm bred med matarnas mått" },
      ],
      raa: 880541090,
      tecken: 537
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
