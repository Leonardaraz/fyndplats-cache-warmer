async function () {
  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };

  const PLAN = [
    {
      kort: "cf92c3bd",
      pid: "cf92c3bd-a793-4728-884f-c65c7db5590a",
      poster: [
        { id: "b379ce_4accc13fd3c440678e1b0ed5cb72c620~mv2.jpg", altText: "Konstgjord dieffenbachia med gulrandiga blad i svart kruka" },
        { id: "b379ce_651427f05e19471da6959424b2256b70~mv2.jpg", altText: "Dieffenbachian i ett vardagsrum mellan en grå soffa och en fåtölj" },
        { id: "b379ce_abca2a21710a4f16b402e49f564d67db~mv2.jpg", altText: "Närbild på ett grönt blad med gula ränder" },
        { id: "b379ce_edebdac75d5b42ba9f574165ac2729a3~mv2.jpg", altText: "Dieffenbachian bredvid ett skrivbord med en datorskärm" },
        { id: "b379ce_9606320d875a47ef9909c3b4f47873df~mv2.jpg", altText: "Måttbild med höjden 95 cm och krukans mått 17 och 14,5 cm" },
      ],
      raa: 172865826,
      tecken: 519
    },
    {
      kort: "e36dab73",
      pid: "e36dab73-19e8-4136-9dcf-7b4df9d7cc0e",
      poster: [
        { id: "b379ce_bf95f3657f4b4245b778641937f84eef~mv2.jpg", altText: "Grön konstgjord julgran på 150 cm med kryssfot" },
        { id: "b379ce_8612648a58764839a12b31a23de1df03~mv2.jpg", altText: "Julgranen pyntad med röda och vita kulor i ett vardagsrum" },
        { id: "b379ce_d1a56b971aa14064b802675855e51719~mv2.jpg", altText: "Den opyntade julgranen i ett rum med julklappar och en stjärna" },
        { id: "b379ce_45124a43b93d40be8311aaf3822c1323~mv2.jpg", altText: "Närbild på julgranens gröna grenar och barr" },
        { id: "b379ce_e45ed135821b4d1fb355eac0d074be33~mv2.jpg", altText: "Måttbild med höjden 150 cm och diametern 46 cm bredvid en mänsklig siluett" },
      ],
      raa: 750466444,
      tecken: 526
    },
    {
      kort: "a7e88a1b",
      pid: "a7e88a1b-c751-4d26-945a-71be8dd7d7f5",
      poster: [
        { id: "b379ce_35c5a870276c469fb057638b3f710a52~mv2.jpg", altText: "Svart ergonomisk sittdyna i memoryskum med urtag för svanskotan" },
        { id: "b379ce_82e9c2d221a340d8b3d0b8c679395ece~mv2.jpg", altText: "En person sitter på sittdynan i en fåtölj med armstöd i trä" },
        { id: "b379ce_e7f2566a1cce4817ba9b5a92fcfdfbd4~mv2.jpg", altText: "En person sitter på sittdynan i en kontorsstol" },
        { id: "b379ce_c40d354b3db44c329e06233777f384e1~mv2.jpg", altText: "Måttbild med sittdynans mått 44, 39 och 13 cm" },
      ],
      raa: 893473018,
      tecken: 408
    },
    {
      kort: "b5b3b852",
      pid: "b5b3b852-94da-4b85-a08d-1b122fdf8227",
      poster: [
        { id: "b379ce_890a7b3a2dac4556af6a60700f3f3843~mv2.jpg", altText: "Elektronisk darttavla med LCD-display och måltavla i bikakemönster" },
        { id: "b379ce_7c5fee98b28346a9b5797502c4ba156e~mv2.jpg", altText: "Tre personer kastar pil mot darttavlan på en vägg" },
        { id: "b379ce_5ab6dd2b5c5244f889104959483cfcc4~mv2.jpg", altText: "Fyra vänner spelar dart framför tavlan på en tegelvägg" },
      ],
      raa: 604927592,
      tecken: 315
    },
    {
      kort: "e90dcc5a",
      pid: "e90dcc5a-2d4d-4389-b455-979da533367f",
      poster: [
        { id: "b379ce_701e24136a93466ebac886fac78aea6d~mv2.jpg", altText: "Sex balansstenar i olika färger och storlekar" },
        { id: "b379ce_090dd0dd18c94b15b20418ebec1d557b~mv2.jpg", altText: "Ett barn balanserar på stenarna på en mönstrad matta" },
        { id: "b379ce_73bac915138349aea5a74919f9c8b933~mv2.jpg", altText: "Närbild på en gul sten med fotavtryck i relief" },
        { id: "b379ce_5ef194c662374e5693bd4cd8fc2f3cf3~mv2.jpg", altText: "Balansstenarna utspridda på ett trägolv" },
        { id: "b379ce_19771a67c775482fb8581d30ca122fa9~mv2.jpg", altText: "Måttbild med stenarnas tre storlekar, 21,5, 29 och 34,3 cm" },
      ],
      raa: 700173156,
      tecken: 484
    },
    {
      kort: "0dfaa38b",
      pid: "0dfaa38b-6792-4598-8dca-c6c71d1578b7",
      poster: [
        { id: "b379ce_d0b5a5a2db1b4bf495f1970e5bd247a3~mv2.jpg", altText: "Medicinskåp i rostfritt stål med frostad glasdörr och ett kors" },
        { id: "b379ce_e889d532b48b47acaf7c8bdb0b9e2bb2~mv2.jpg", altText: "Det öppna medicinskåpet på en vägg med förpackningar på hyllorna och nyckeln i låset" },
        { id: "b379ce_2d5e17d5056a4e29a771be5b037d6668~mv2.jpg", altText: "Korset på skåpets frostade dörr i närbild" },
        { id: "b379ce_f5089d2d8576469cbdf8d0c88c46fb29~mv2.jpg", altText: "Närbild på spärren vid dörren" },
        { id: "b379ce_c80e7ac9cd224805941064acc6b5593e~mv2.jpg", altText: "Måttbild med skåpets mått 25, 12 och 48 cm" },
      ],
      raa: 109859821,
      tecken: 502
    },
    {
      kort: "10cd6afb",
      pid: "10cd6afb-34b0-40dc-9c9b-4f7dc510fa58",
      poster: [
        { id: "b379ce_b17ac1cc05674d10a81bb89d3a749b34~mv2.jpg", altText: "Smalt vitt konsolbord med bordsskiva i marmorlook" },
        { id: "b379ce_96492fcb7dfb4d0eb4f67515422261e6~mv2.jpg", altText: "Konsolbordet i en hall med en krukväxt och skor under" },
        { id: "b379ce_5e79a8931868413e9f3eaab83abe1d5e~mv2.jpg", altText: "Konsolbordet bredvid en säng med bordslampa, klocka och böcker" },
        { id: "b379ce_20dbba4bb9d740e99827b6b2bd1a6930~mv2.jpg", altText: "Två konsolbord bredvid varandra i ett vardagsrum, varav ett ingår" },
        { id: "b379ce_534202ab201742969d1cfb61b3a4ad64~mv2.jpg", altText: "Måttbild med bordets mått 75, 24 och 76 cm och bärförmågan 10 kg" },
      ],
      raa: 713056846,
      tecken: 537
    },
    {
      kort: "00d6f785",
      pid: "00d6f785-c15c-4315-afaa-269c53b42fd7",
      poster: [
        { id: "b379ce_73f1c58823f6428090ab4138fa7a2bc3~mv2.jpg", altText: "Vit LED-björk på 150 cm med tända varmvita lampor" },
        { id: "b379ce_0044a25fbc2147899c0db98567abb07f~mv2.jpg", altText: "LED-björken tänd bredvid en öppen spis med julpynt" },
        { id: "b379ce_c09fdf3a72c94aa0a306c97c2842aa88~mv2.jpg", altText: "Närbild på de runda lamporna på grenarna" },
        { id: "b379ce_93375df403cb42ff851424d4872dcf6d~mv2.jpg", altText: "Närbild på stammen och den fyrkantiga foten med sladd" },
        { id: "b379ce_59a8650cdde246bc895c55ffeb89dc85~mv2.jpg", altText: "Måttbild med höjden 150 cm och foten 20 × 20 cm" },
      ],
      raa: 993806717,
      tecken: 483
    },
    {
      kort: "0feec456",
      pid: "0feec456-5102-4095-990c-b8e2da80727c",
      poster: [
        { id: "b379ce_be1581a977b44911a285f0ee6303d048~mv2.jpg", altText: "Grått tipitält för husdjur med mönstrad dyna och fjäderleksak" },
        { id: "b379ce_9637818418d34488aaebcbec1ca9a6df~mv2.jpg", altText: "En katt ligger på dynan i tipitältet i ett vardagsrum" },
        { id: "b379ce_a368eb704bf442d5af3e1e972595d553~mv2.jpg", altText: "En svartvit katt vilar i tipitältet på en rund matta" },
        { id: "b379ce_c096f992486d473cacf64c07d27a3a38~mv2.jpg", altText: "Måttbild med tältets mått 60, 60 och 76 cm, ingången och dynan" },
      ],
      raa: 428626290,
      tecken: 423
    },
    {
      kort: "1476f00c",
      pid: "1476f00c-8e41-4fef-af8f-ea10972f1002",
      poster: [
        { id: "b379ce_0fdda030bb5949b390014542331214fc~mv2.jpg", altText: "Grön leksakshylla med sex tygboxar tryckta med djur, träd och berg" },
        { id: "b379ce_06489b31fe764b58857d716beebac002~mv2.jpg", altText: "En flicka leker med ett leksaksflygplan framför leksakshyllan" },
        { id: "b379ce_c0849043731e41a8886a02a016c54210~mv2.jpg", altText: "Hyllans gröna gavel och boxar med böcker och gosedjur" },
        { id: "b379ce_8cfcf66f194b4a3cb5e18863c50768dc~mv2.jpg", altText: "Närbild på den stora boxen med bergsmotiv" },
        { id: "b379ce_16b3149e17724ddf9e8497ae0f10079a~mv2.jpg", altText: "Måttbild med hyllans mått 63, 30 och 66 cm och boxarnas mått" },
      ],
      raa: 873255041,
      tecken: 525
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
