async function () {
  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };

  const PLAN = [
    {
      kort: "19f7c013",
      pid: "19f7c013-3365-4f5a-877c-6c5babf03b44",
      poster: [
        { id: "b379ce_3b9d5c46d0e1425d9ba4c4f58ac1f0c2~mv2.jpg", altText: "Fem mjuka byggklossar i rött, gult, blått och grönt, mot vit bakgrund" },
        { id: "b379ce_a9ecd2e988a0458692eaedfed4069276~mv2.jpg", altText: "Två barn leker med byggklossarna i ett vardagsrum" },
        { id: "b379ce_dadc008583504028a03af410595ce332~mv2.jpg", altText: "Byggklossarna uppställda som en klätterbana i ett barnrum" },
        { id: "b379ce_d05a9ae114294c5a83e27e16733f7222~mv2.jpg", altText: "Närbild på klossarna staplade ovanpå varandra" },
        { id: "b379ce_aa172118bd474b2db35eb058c5e33d39~mv2.jpg", altText: "Måttskiss på klossarnas fem former med cm-mått" },
        { id: "b379ce_2c3a7a0b2d414ca29b733b22f8f8ea23~mv2.png", altText: "Faktakort: 40,6 × 40,6 × 20,3 cm, konstläder och EPE-skum, 5 kg" },
      ],
      raa: 53347179,
      tecken: 622
    },
    {
      kort: "2177e112",
      pid: "2177e112-110a-4cc3-878b-3e7b6df94df4",
      poster: [
        { id: "b379ce_8a8fe86c152c4f378c032089c946ac13~mv2.jpg", altText: "Runt matbord med kryssben i svart stål, mot vit bakgrund" },
        { id: "b379ce_2d5beca6bbd647f0b9bdb4ed0dd93f5e~mv2.jpg", altText: "Matbordet uppställt i ett kök med fyra stolar runt" },
        { id: "b379ce_29c1cd0b38084b03b73e6ba3bae803a2~mv2.jpg", altText: "Närbild underifrån på det X-formade benstativet" },
        { id: "b379ce_dd9a610d14004369abb875e7dcace017~mv2.jpg", altText: "Bordet dukat för middag, sett uppifrån" },
        { id: "b379ce_6aed4301f86043ea97d99828a0132bc0~mv2.jpg", altText: "Måttskiss på bordet med Ø100 × 75 cm och maxbelastning 40 kg" },
        { id: "b379ce_0572584092e54ad282e82385ff7bbf3e~mv2.png", altText: "Faktakort: Ø100 × 75 cm, svart, maxbelastning 40 kg" },
      ],
      raa: 167632273,
      tecken: 595
    },
    {
      kort: "40304dee",
      pid: "40304dee-347f-4fe1-aa90-6648df6b6e8a",
      poster: [
        { id: "b379ce_a028287782ac489183ec065f9493163c~mv2.jpg", altText: "Golvfåtölj i mörkgrå tyg på vridbar pelarfot, mot vit bakgrund" },
        { id: "b379ce_ebf6e76cdde54668853f19f40ab00f85~mv2.jpg", altText: "Fåtöljen uppställd i ett vardagsrum med en filt över armstödet" },
        { id: "b379ce_a4903d8995fa431fbf80bb334efd540b~mv2.jpg", altText: "Närbild på tygets struktur och sömmen vid ryggstödet" },
        { id: "b379ce_92e0a8d67879413fa1756f9936d3aa07~mv2.jpg", altText: "Närbild på dragkedjan under sitsdynan" },
        { id: "b379ce_f5077248409b486490c3105fb9b8769b~mv2.jpg", altText: "Måttskiss på fåtöljen med sitthöjd 37 cm och totalmått 70 × 95 cm" },
        { id: "b379ce_5a596503f2e34c609fd7ce7c8ebdf6b9~mv2.png", altText: "Faktakort: 62 × 70 × 95 cm, mörkgrå, maxbelastning 120 kg" },
      ],
      raa: 596880415,
      tecken: 628
    },
    {
      kort: "4125dd90",
      pid: "4125dd90-93e2-4971-8842-4e1e3c0d1d0b",
      poster: [
        { id: "b379ce_4d827c175b2a4fb9a5c6abf432837361~mv2.jpg", altText: "Espressomaskin i creme och silver, mot vit bakgrund" },
        { id: "b379ce_cae55c54e68e48f9a9943911071dc1dd~mv2.jpg", altText: "Maskinen placerad i ett kök med två koppar på värmeplattan" },
        { id: "b379ce_8cd479f9609147c4936d8ced67eb8238~mv2.jpg", altText: "En kvinna trycker på maskinens knappar medan kaffe bryggs" },
        { id: "b379ce_559487ebe7fd42c38b975169a1162b88~mv2.jpg", altText: "En kvinna häller upp mjölkskum bredvid maskinen" },
        { id: "b379ce_606a055f2d9847a894980367981da427~mv2.png", altText: "Faktakort: 32 × 17 × 31 cm, creme/silver, 1350 W" },
      ],
      raa: 386019479,
      tecken: 505
    },
    {
      kort: "78f897e9",
      pid: "78f897e9-4715-4547-909c-f0e24b10749d",
      poster: [
        { id: "b379ce_1cb5ea49a1a1419fb5889dd23d7b6966~mv2.jpg", altText: "Hopfällbar hundgrind i svart, visad uppställd och i enskilda paneler" },
        { id: "b379ce_fb80f37798e7418990945dfbec9f4b96~mv2.jpg", altText: "Grinden uppställd i en dörröppning med en liten hund framför" },
        { id: "b379ce_93801873f6fc40559e4f80dd2e2e165b~mv2.jpg", altText: "Grinden uppställd framför ett matrum" },
        { id: "b379ce_36ab0cf10c8848e588c8bfcde9e02a4f~mv2.png", altText: "Faktakort: 261,5 × 29,5 × 61 cm, svart, max mankhöjd 41 cm" },
      ],
      raa: 431125079,
      tecken: 417
    },
    {
      kort: "a1294bc8",
      pid: "a1294bc8-204f-4cfc-9505-0794204bc0e5",
      poster: [
        { id: "b379ce_9d20d08fb20643ebb14a2e90ae3b419a~mv2.jpg", altText: "Espressomaskin i svart och stål, mot vit bakgrund" },
        { id: "b379ce_99f3dec01a2f4e92ad5fefb6566f9d4e~mv2.jpg", altText: "Maskinen placerad i ett kök med två koppar på värmeplattan" },
        { id: "b379ce_db60edf9974d4aaca9ad8bfb6efa0489~mv2.jpg", altText: "En kvinna trycker på maskinens knappar i ett kök" },
        { id: "b379ce_44515f2f230a41abb4c14b9b6bc986b7~mv2.jpg", altText: "Maskinen sedd från sidan i ett kök, kaffe hälls upp" },
        { id: "b379ce_ae4fcb55694a41b8a7ea000d49096757~mv2.png", altText: "Faktakort: 29 × 22 × 28 cm, svart, 850 W" },
      ],
      raa: 126396266,
      tecken: 490
    },
    {
      kort: "bee36f80",
      pid: "bee36f80-c3da-40a2-a57a-f3505073e853",
      poster: [
        { id: "b379ce_69a2716b910040c6b215f1d2332e8de2~mv2.jpg", altText: "Grå vertikalmarkis med vev, mot vit bakgrund" },
        { id: "b379ce_0bd8933c20a846a381d585bda617c9f9~mv2.jpg", altText: "Två markiser monterade på en takförsedd uteplats vid en pool" },
        { id: "b379ce_de8feece824843c6ab6bc9326f7b0fc3~mv2.jpg", altText: "Närbild på infästningen och upprullningsmekanismen" },
        { id: "b379ce_6c74da3386a549bfa81c3437814334ae~mv2.jpg", altText: "Närbild på vevstången" },
        { id: "b379ce_d6de69b5f08340a7971b353e961f8824~mv2.jpg", altText: "Måttskiss på markisen med 120 × 200 cm och vevens räckvidd 125 cm" },
        { id: "b379ce_6e2b222923b64b6f98714416bb29a998~mv2.png", altText: "Faktakort: 200 × 120 cm, grå, aluminium och polyester" },
      ],
      raa: 122260913,
      tecken: 586
    },
    {
      kort: "d9658fc2",
      pid: "d9658fc2-ea81-4af6-ab34-f5012f0da75b",
      poster: [
        { id: "b379ce_a99c1d34ce6b475a93b53a4df166bd39~mv2.jpg", altText: "Bistroset i mörkgrå stål med bord och två stolar, uppställt på en uteplats" },
        { id: "b379ce_030186d7c31d418aaec30400e30379b0~mv2.jpg", altText: "Setet uppställt på en balkong med frukost och kaffe på bordet" },
        { id: "b379ce_d1f8d0a1897d4ffda4fd41b6b5727f4d~mv2.jpg", altText: "Setet uppställt på en terrass med ljusslinga och böcker på bordet" },
        { id: "b379ce_4f347558c9eb4cc7b35498676d5d6c93~mv2.jpg", altText: "Setet uppställt på en uteplats med ljusslinga och blommor" },
        { id: "b379ce_404dd0b7745c49fdaf4ed55e401e852c~mv2.jpg", altText: "Måttskiss på stolen med 61 × 65 × 91 cm och bordet med 50 × 50 × 50 cm" },
        { id: "b379ce_082897c774da4c15b9115ede74dc1ca8~mv2.png", altText: "Faktakort: 61 × 65 × 91 cm, mörkgrå, stål och nätstoff" },
      ],
      raa: 442258490,
      tecken: 674
    },
    {
      kort: "ed69489c",
      pid: "ed69489c-8bfd-4866-8713-38a06f98edae",
      poster: [
        { id: "b379ce_5974577c5b434b23a2d71b06ec6a0702~mv2.jpg", altText: "Badrumsskåp med två spegeldörrar i bambu, mot vit bakgrund" },
        { id: "b379ce_419f99cf9bac4c35869e9d8e9b39ef30~mv2.jpg", altText: "Skåpet monterat på en blå badrumsvägg med handdukar och tvål" },
        { id: "b379ce_19c9fd80b4664d69b33cff62be5f0007~mv2.jpg", altText: "Närbild på gångjärnet och hyllan inuti skåpet" },
        { id: "b379ce_e1604f605c484738a2cbdd935fd1d3d9~mv2.jpg", altText: "Måttskiss på skåpet med 65,2 × 14 × 50 cm" },
        { id: "b379ce_2987c9dfba1249438cc705037d5c2d0a~mv2.png", altText: "Faktakort: 65,2 × 14 × 50 cm, natur, maxbelastning 10 kg" },
      ],
      raa: 652970211,
      tecken: 504
    },
    {
      kort: "ee610afd",
      pid: "ee610afd-729e-46aa-8dc2-adea87692302",
      poster: [
        { id: "b379ce_833ba5f3f97145f5a405da8e4c094d17~mv2.jpg", altText: "Vilstol i cremevitt tyg med björkram och utfällt fotstöd, mot vit bakgrund" },
        { id: "b379ce_c12481db5734497ca6acbf7049a84e1c~mv2.jpg", altText: "Stolen uppställd i ett vardagsrum bredvid en soffa och ett soffbord" },
        { id: "b379ce_be1779fba46c4958a55f9381633620b6~mv2.jpg", altText: "Närbild på träramens fog vid armstödet" },
        { id: "b379ce_6f7c52f193e44991859464aa1d7bb4f2~mv2.jpg", altText: "Närbild på träramen och tygets söm" },
        { id: "b379ce_dd1a49335e9c43f9be5931f3f8d9f4e1~mv2.jpg", altText: "Måttskiss på stolen med totalmått 66,5 × 94 × 100 cm och sitsmått" },
        { id: "b379ce_c2da86556919470a82bdd1e92701a97f~mv2.png", altText: "Faktakort: 66,5 × 94 × 100 cm, cremevit, maxbelastning 120 kg" },
      ],
      raa: 29392815,
      tecken: 632
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
