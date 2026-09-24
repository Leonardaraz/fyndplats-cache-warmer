async function () {
  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };

  const PLAN = [
    {
      kort: "62f42597",
      pid: "62f42597-4d7d-4dd3-b548-cefa79bdec11",
      poster: [
        { id: "b379ce_60fb65fe91784bda9e9725f04ca2b8ea~mv2.jpg", altText: "Tre snötäckta konstgranar i olika höjder, uppställda på vit bakgrund" },
        { id: "b379ce_25da466cdc4e4f33afe84dca90a2288d~mv2.jpg", altText: "De tre granarna uppställda i ett vardagsrum vid en öppen spis med julklappar" },
        { id: "b379ce_d977f1388d4c4c91842015e7f3fdbd13~mv2.jpg", altText: "De tre granarna uppställda i ett rum med julklappar och en adventskrans" },
        { id: "b379ce_d2fdb217a4694ed4917c8f5b04a9f0bc~mv2.jpg", altText: "Närbild på en gransockel klädd i konstgjord bark med julklappar i bakgrunden" },
        { id: "b379ce_4d39e53f34d24216bfd943c54e888ee3~mv2.jpg", altText: "Måttbild som visar granarnas höjder 90, 120 och 150 cm jämfört med en person" },
      ],
      raa: 769146437,
      tecken: 611
    },
    {
      kort: "46843188",
      pid: "46843188-acab-4e92-8641-8041c87e3675",
      poster: [
        { id: "b379ce_dbaadeef71514294ae24cbf9733feeaf~mv2.jpg", altText: "Grön sammetsklädd sittbänk med guldfärgade metallben, sedd snett framifrån" },
        { id: "b379ce_1cc23e14b38b4963a1045324af2fe99f~mv2.jpg", altText: "En kvinna sitter på den gröna sittbänken vid fotändan av en säng" },
        { id: "b379ce_281e22bc309b48878f8dcd97088ea1aa~mv2.jpg", altText: "Sittbänken med locket uppfällt och ett öppet förvaringsutrymme med kuddar synligt" },
        { id: "b379ce_f86f45f08b77408699354553ff299551~mv2.jpg", altText: "Närbild på två av sittbänkens guldfärgade metallben" },
        { id: "b379ce_841aef65f4dd46f8857118b07d2eeac0~mv2.jpg", altText: "Måttbild som visar sittbänkens mått 100 x 40 x 42 cm" },
      ],
      raa: 342337162,
      tecken: 566
    },
    {
      kort: "3563d029",
      pid: "3563d029-cdde-4eb0-989d-b1f525f3f9c1",
      poster: [
        { id: "b379ce_8c696b580bd448ad80d5d07e7a459600~mv2.jpg", altText: "Vit leksaksförvaring för barn med sex utdragbara lådor och en sned bokhylla" },
        { id: "b379ce_68dcb7adb58c483ab3159549732b45c4~mv2.jpg", altText: "Ett barn plockar leksaker ur lådorna medan böcker står uppställda i bokhyllan" },
        { id: "b379ce_385def222ebb491eb748943909229478~mv2.jpg", altText: "Leksaksförvaringen i ett barnrum med tavlor, en väska och en rullande låda" },
        { id: "b379ce_81ee6b0c1d2244d9ab18970d2ff73bf0~mv2.jpg", altText: "Måttbild som visar hyllans mått 100 x 30 x 80 cm samt de enskilda delarnas mått" },
      ],
      raa: 810080814,
      tecken: 500
    },
    {
      kort: "2aa6ff77",
      pid: "2aa6ff77-f347-4ab3-869d-2a598f3ee520",
      poster: [
        { id: "b379ce_2956e30312024b6d9dd1e382af9df656~mv2.jpg", altText: "Två vita köksstolar i furu med ribbat ryggstöd, sedda snett framifrån" },
        { id: "b379ce_001451253e244e889289a377114c3f47~mv2.jpg", altText: "De två stolarna vid ett köksbord med porslin och en vas med grönska" },
        { id: "b379ce_5683004f71b24c2585cb997dc4ac8756~mv2.jpg", altText: "Närbild på stolens ryggstöd och benens infästning vid ett bord" },
        { id: "b379ce_eb08d79e6c6a49e4b14529fa9fe98e86~mv2.jpg", altText: "Närbild på stolens sits och ben sedd underifrån" },
        { id: "b379ce_c33f5021dc0c45659ea87d7b2c5cf00d~mv2.jpg", altText: "Måttbild som visar en stols mått 38,5 x 47,5 x 99 cm" },
      ],
      raa: 666391414,
      tecken: 541
    },
    {
      kort: "9ebd976b",
      pid: "9ebd976b-1c7f-4696-a595-4635fa28abdf",
      poster: [
        { id: "b379ce_1f4361ab15ad4cffa65f077c9583607a~mv2.jpg", altText: "Badrumsskåp i bambu med två lamelldörrar, sett snett framifrån" },
        { id: "b379ce_dbb1d46b759d41379ad7c5fcadece18b~mv2.jpg", altText: "Badrumsskåpet placerat under en spegel med handdukar och tvålpumpar ovanpå" },
        { id: "b379ce_4d06481016ef4f038d173d9b31044e82~mv2.jpg", altText: "Närbild på skåpets bambuyta med handdukar och tvålpumpar ovanpå" },
        { id: "b379ce_62cc90420dc74caebf5e9e6785e6be0c~mv2.jpg", altText: "Närbild på skåpets innerhylla med tvålpumpar och hopvikta handdukar" },
        { id: "b379ce_5e0d319a8dd84870994234afa0f219da~mv2.jpg", altText: "Måttbild som visar skåpets mått 68 x 32 x 86 cm" },
      ],
      raa: 361144732,
      tecken: 557
    },
    {
      kort: "5b5855b9",
      pid: "5b5855b9-f7c6-4868-8f68-21babe20cc4f",
      poster: [
        { id: "b379ce_404990e108564d30ad65e9f18429b2dc~mv2.jpg", altText: "Vitt skoskåp med två dörrar och öppna hyllor i fyra nivåer till höger" },
        { id: "b379ce_e3605608ec774a5b9e240be51bbb52e6~mv2.jpg", altText: "Skoskåpet i en hall med skor synliga i de öppna hyllorna och blommor ovanpå" },
        { id: "b379ce_b387eb7e34b04240b163da5fce834561~mv2.jpg", altText: "Skoskåpet i en hall med paraplyer, en klocka och en väska bredvid" },
        { id: "b379ce_29f2361738de41869e32949467af58ff~mv2.jpg", altText: "Närbild på skåpets ovansida med en vas, en klocka och böcker" },
        { id: "b379ce_3f1f66ca3462471d90911ee13dd7d3a6~mv2.jpg", altText: "Måttbild som visar skåpets mått 83 x 30 x 90 cm samt innermått" },
      ],
      raa: 430514245,
      tecken: 575
    },
    {
      kort: "58f8338d",
      pid: "58f8338d-b5c9-428a-9267-8d55d795ae92",
      poster: [
        { id: "b379ce_310b50fd3e9c401585ebd832b2546f24~mv2.jpg", altText: "Bågformad golvspegel i guld med vikbart stöd på baksidan" },
        { id: "b379ce_5c623f26a0614c3791133b5333c7c0cd~mv2.jpg", altText: "Spegeln lutad mot väggen i ett sovrum med en säng och gardiner synliga" },
        { id: "b379ce_e0f01e9259b3437db1796f2a8a5393bf~mv2.jpg", altText: "Närbild på det vikbara stödets nedre infästning" },
        { id: "b379ce_c901eeac68214416b6581b0abe137dff~mv2.jpg", altText: "Närbild på det vikbara stödets övre led och infästning i spegelramen" },
        { id: "b379ce_7a80db35a44d457fba691e93a3fe0dcf~mv2.jpg", altText: "Måttbild som visar spegelns mått i både hopfällt och utfällt läge" },
      ],
      raa: 883791507,
      tecken: 550
    },
    {
      kort: "e42eca69",
      pid: "e42eca69-bbdc-448b-9e3c-7eb6b9786a82",
      poster: [
        { id: "b379ce_c7aa4dbe2bfa4ea0a2dab71951582cd4~mv2.jpg", altText: "Svart avfallshink i rostfritt stål med tre lock och tre pedaler" },
        { id: "b379ce_f06505ee8c984a17a566a45c84d4c3b9~mv2.jpg", altText: "En person slänger en flaska i avfallshinken som står i ett kök" },
        { id: "b379ce_6d58275e471c4b599fbe032c5264ac3d~mv2.jpg", altText: "Avfallshinken i ett kök där en person lagar mat vid köksön" },
        { id: "b379ce_9dda0815c3a542e6acce148ba367d6c0~mv2.jpg", altText: "Måttbild som visar hinkens mått samt varje facks volym på 15 liter" },
      ],
      raa: 601852251,
      tecken: 444
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
