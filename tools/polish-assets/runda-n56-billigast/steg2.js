async function () {
  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };

  const PLAN = [
    {
      kort: "1355eec8",
      pid: "1355eec8-4b26-40ef-ac51-fce1db893004",
      poster: [
        { id: "b379ce_d68f7b1921354d288b0ddcd68b577255~mv2.jpg", altText: "Handbagagekoffert i mörkgrå hårdplast med teleskophandtag och fyra snurrhjul" },
        { id: "b379ce_f6dc783c440f4ff1b2d20c6df9b6fa85~mv2.jpg", altText: "Kofferten på golvet i en flygplatsterminal" },
        { id: "b379ce_ca2de3aaad7a484e8af7cfcadf6139f8~mv2.jpg", altText: "En man i en flygplatslounge med kofferten bredvid fåtöljen" },
        { id: "b379ce_c29e8cbbfd614a489213b5af4caa91aa~mv2.jpg", altText: "En familj går genom en flygplatsterminal med kofferten" },
        { id: "b379ce_5f7671de36ae4b3fbd7b9a55edfda8c0~mv2.jpg", altText: "Måttbild: kofferten är 56 cm hög, 36 cm bred och 24 cm djup och rymmer 40 liter" },
      ],
      raa: 103768105,
      tecken: 553
    },
    {
      kort: "1c908b3f",
      pid: "1c908b3f-9029-4dff-a3f9-e424e345da8b",
      poster: [
        { id: "b379ce_9caa2a8fa1a3457b8bcf4336097b8659~mv2.jpg", altText: "Pokerset i öppen väska med marker i fem färger, kortlekar och dealerknapp" },
        { id: "b379ce_eb4feb79fc8f45ad933eafaa66973cbe~mv2.jpg", altText: "En kvinna håller spelkort vid ett spelbord bredvid den öppna pokerväskan" },
        { id: "b379ce_b204c81b134643ca859dda4b628cfd4d~mv2.jpg", altText: "Tre kvinnor spelar kort med marker ur pokerväskan" },
        { id: "b379ce_f139501fb27843859608b9f847fbc499~mv2.jpg", altText: "En familj spelar kort runt pokerväskan vid ett bord" },
        { id: "b379ce_bda7817b1b114b64a0dd8d68b81c594c~mv2.jpg", altText: "Måttbild: väskan är 39,5 × 28 × 8 cm och spelmattan 90 × 60 cm" },
      ],
      raa: 772460007,
      tecken: 551
    },
    {
      kort: "1da6b037",
      pid: "1da6b037-1532-40c6-af48-cb756b693a62",
      poster: [
        { id: "b379ce_f593eece4cce4776a35b884260af1760~mv2.jpg", altText: "Gnistskydd i svart metall med tre paneler, nät och ett mönster av bågar" },
        { id: "b379ce_adcf3955155749dca1dec01920c37d07~mv2.jpg", altText: "Gnistskyddet framför en brasa i en öppen spis med marmoromfattning" },
        { id: "b379ce_784af956b89543188e2ef9dd5e9f261f~mv2.jpg", altText: "Gnistskyddet framför en eldstad i sten, bredvid en skinnsoffa" },
        { id: "b379ce_6aa43ba91724462eb12f241cd6891276~mv2.jpg", altText: "Gnistskyddet framför en eldstad med tegel i fiskbensmönster och bokhyllor bredvid" },
      ],
      raa: 461652511,
      tecken: 474
    },
    {
      kort: "3ad8c7a4",
      pid: "3ad8c7a4-9d12-4480-94b7-fcb625ca69ee",
      poster: [
        { id: "b379ce_9e8ab6ee29e4444a99a378aa409d3741~mv2.jpg", altText: "Klättervägg för katt i fyra delar: sisalstolpe med liggkorg, hängbro, liggskål och trappa" },
        { id: "b379ce_d7b4dd289d7c426c9b0afe95828e5289~mv2.jpg", altText: "En katt ligger i liggkorgen på sisalstolpen, med de andra delarna på väggen" },
        { id: "b379ce_9dad28ad7dfb41d092c185ded2fb06de~mv2.jpg", altText: "Närbild på en rund plattform i grå plysch med en hängande boll" },
        { id: "b379ce_db063b8822e24aa48dc482c8b37ca317~mv2.jpg", altText: "Närbild på ett sisallindat trappsteg" },
        { id: "b379ce_86b3e87d48774ada8cf3c2d18bf5b737~mv2.jpg", altText: "Måttbild: stolpen är 96 cm hög och trappan 42 cm bred" },
      ],
      raa: 781438011,
      tecken: 559
    },
    {
      kort: "6d0e2d27",
      pid: "6d0e2d27-3ffe-4e11-b5c5-90e2c12d9e95",
      poster: [
        { id: "b379ce_2703fe8401004541a4f2296f24b240cf~mv2.jpg", altText: "Gnistskydd i guldfärgad metall med tre paneler och dubbeldörrar i mitten" },
        { id: "b379ce_0fa58e9656924e629ee32f187e5697f6~mv2.jpg", altText: "Det guldfärgade gnistskyddet framför en brasa i en öppen spis med marmoromfattning" },
        { id: "b379ce_d758ed1517024b42a847df3202f988a4~mv2.jpg", altText: "Det guldfärgade gnistskyddet framför en eldstad i sten, bredvid en brun skinnsoffa" },
        { id: "b379ce_183c7c04fb584e4c90a36496b7723ea0~mv2.jpg", altText: "Det guldfärgade gnistskyddet framför en eldstad med tegel i fiskbensmönster" },
      ],
      raa: 858954995,
      tecken: 506
    },
    {
      kort: "6f4baeef",
      pid: "6f4baeef-f998-4701-8829-63816e0d40a1",
      poster: [
        { id: "b379ce_fba65a86fc454e42bb7cc9cbc49b9a1c~mv2.jpg", altText: "Vinställ för 30 flaskor med rustikt brun skiva och svart metallram med vågformade fack" },
        { id: "b379ce_7c571bf150924bb2939920d3f75a19e1~mv2.jpg", altText: "Vinstället fyllt med vinflaskor i ett kök, med vinglas och bröd på skivan" },
        { id: "b379ce_211d5a6be9024f03b141852282f27be1~mv2.jpg", altText: "Vinstället fyllt med flaskor bredvid ett skåp, med en karaff och glas ovanpå" },
        { id: "b379ce_42627b7ee9804824a4491b93260d190c~mv2.jpg", altText: "Vinstället med flaskor i en matsal, med en vas och vinglas på skivan" },
        { id: "b379ce_85a8c31a008442828a6f9b9e1671fd26~mv2.jpg", altText: "Måttbild: vinstället är 59 × 30 × 88,5 cm och bär 40 kg" },
      ],
      raa: 434981663,
      tecken: 602
    },
    {
      kort: "7e3d0a23",
      pid: "7e3d0a23-7665-45fe-82db-141e6bc7a720",
      poster: [
        { id: "b379ce_b98b15c39062493985e3cf9f28e5c3ca~mv2.jpg", altText: "Vedställ i svart metall med ett överdrag som täcker veden" },
        { id: "b379ce_6001448746de42b19f046d59cb08bf7e~mv2.jpg", altText: "Bärväska i svart canvas fylld med ved" },
        { id: "b379ce_1396f494c426455ba11fde9a56767ffe~mv2.jpg", altText: "Måttbild: stället är 120 × 36 × 99 cm, överdraget 120 × 50 × 95 cm och bärväskan 76 × 35 cm" },
      ],
      raa: 788476181,
      tecken: 331
    },
    {
      kort: "856bdf7e",
      pid: "856bdf7e-bd81-4377-8df8-ad96fbada5a0",
      poster: [
        { id: "b379ce_2736c894bd794a88a5c5517e9970aab7~mv2.jpg", altText: "Två hantlar och samma delar ihopsatta till en skivstång, med svarta viktskivor" },
        { id: "b379ce_38d058a1eb544989bf3c905a9508842a~mv2.jpg", altText: "Hantlarna på en randig matta i ett träningsrum" },
        { id: "b379ce_3fdd2d82a03b47ff881fd798b1c261f3~mv2.jpg", altText: "Närbild på det räfflade greppet" },
        { id: "b379ce_f349a3442ea249078db8605eb3dd8b30~mv2.jpg", altText: "Närbild på en viktskiva och stjärnlåset" },
        { id: "b379ce_03198fd0faff431ab5f626eccebcb54d~mv2.jpg", altText: "Måttbild: viktskivorna är Ø12 och Ø16 cm och förbindelsestången 30 cm" },
      ],
      raa: 292799299,
      tecken: 507
    },
    {
      kort: "868b82c8",
      pid: "868b82c8-5206-45c9-ade5-c6b082a5412b",
      poster: [
        { id: "b379ce_986f922753564b28a9507be57ac9108c~mv2.jpg", altText: "Leksaksaffär i trä med randig markis, kassa, skanner och tillbehör" },
        { id: "b379ce_8df1492a2bb744ffbbd08948517b8ebb~mv2.jpg", altText: "Två barn leker affär vid leksaksaffären" },
        { id: "b379ce_9bdacf1636e745fa987dc43c87a173ff~mv2.jpg", altText: "Leksaksaffären med kassa och lådor med frukt och grönsaker" },
        { id: "b379ce_0b7a48d6a06549a98cca236c19014d6e~mv2.jpg", altText: "Leksaksaffären i ett vardagsrum, med en krittavla och lådor med varor" },
        { id: "b379ce_1af4fe6477ec458c94ecfc8fad1f12cf~mv2.jpg", altText: "Måttbild: affären är 52 × 30 × 92,5 cm" },
      ],
      raa: 690571782,
      tecken: 514
    },
    {
      kort: "95a0993c",
      pid: "95a0993c-df23-499d-acc7-156b42aff4c7",
      poster: [
        { id: "b379ce_ddecc536357849738de6ee45e69c46cb~mv2.jpg", altText: "Fotpall i gräddvit manchester med ben och sidoreglar i ljust gummiträ" },
        { id: "b379ce_edbf777430034f7eae743125b4fde2dd~mv2.jpg", altText: "Fotpallen framför en soffa på en mönstrad matta" },
        { id: "b379ce_4c6428273a214b86afe9a9f7f36ac4c9~mv2.jpg", altText: "Fotpallen vid en soffa, sedd från sidan" },
        { id: "b379ce_0e2a83c6e86743fcb8ee985078f12df4~mv2.jpg", altText: "Närbild på manchestertyget och en sidoregel i gummiträ" },
        { id: "b379ce_57c343b9ae65435bafe84f31c838df7b~mv2.jpg", altText: "Måttbild: pallen är 70 × 46 × 40 cm och bär 120 kg" },
      ],
      raa: 470414792,
      tecken: 503
    },
    {
      kort: "98da447a",
      pid: "98da447a-8700-4465-bc57-e6f9271b4c6f",
      poster: [
        { id: "b379ce_ee66ce226cb8490585315763f0f08e53~mv2.jpg", altText: "Staffli i bokträ med ställbar mast, dukhållare och låda" },
        { id: "b379ce_20d35625543d4bb8afb64981badeb452~mv2.jpg", altText: "Staffliet med en målning i ett ateljéhörn med penslar och en palett" },
        { id: "b379ce_522e8798860146038f8a4a8c2b6a03e5~mv2.jpg", altText: "Närbild på lådan med penslar och färgtuber" },
        { id: "b379ce_55d4d956717e442d85c2e2c06331dcfd~mv2.jpg", altText: "Närbild på dukhållaren med vingmuttrar" },
        { id: "b379ce_90025234ca3149ba8a01b267f56e1ac4~mv2.jpg", altText: "Måttbild: staffliet är 43 × 43,5 cm vid foten och upp till 190 cm högt" },
      ],
      raa: 150156749,
      tecken: 516
    },
    {
      kort: "b62bb65c",
      pid: "b62bb65c-d933-4a61-bda5-b12aca4a5b25",
      poster: [
        { id: "b379ce_3c294611a9a94a048513a160d11ef677~mv2.jpg", altText: "Hantelställ med gul stålram och två svarta hyllor" },
        { id: "b379ce_1c3a0769344548118c12bd7d67bbd8a5~mv2.jpg", altText: "Hantelstället med hantlar i ett hemmagym" },
        { id: "b379ce_f5ba9cb49d184983abc5c5b4d116f7fc~mv2.jpg", altText: "Närbild på en hylla och skruven i ramen" },
        { id: "b379ce_730a704b21b8477585f5ae32438fef59~mv2.jpg", altText: "Hantelstället sett framifrån" },
        { id: "b379ce_a9507950e8e04fc0a6482d3ba101ccef~mv2.jpg", altText: "Måttbild: stället är 92,5 × 50,5 × 80,5 cm och hyllorna 80 × 23 cm" },
      ],
      raa: 167546060,
      tecken: 466
    },
    {
      kort: "e248e9db",
      pid: "e248e9db-a5ce-4f72-8f32-a5689ca18bfe",
      poster: [
        { id: "b379ce_754c91096433451ca7feada7de8771ce~mv2.jpg", altText: "Smalt badrumsskåp i bambu med öppet fack upptill och lamelldörr" },
        { id: "b379ce_7e5b752014184999ace216e07b62d52a~mv2.jpg", altText: "Badrumsskåpet bredvid ett handfat, med flaskor i det öppna facket" },
        { id: "b379ce_85a483807b804fd88131c8f026778db3~mv2.jpg", altText: "Badrumsskåpet i ett badrum med fler möbler i bambu" },
        { id: "b379ce_49a9c6f63c7b4c65a94e99447853c299~mv2.jpg", altText: "Badrumsskåpet mellan ett badkar och ett handfat, med flaskor ovanpå och i facket" },
        { id: "b379ce_dc646b8b58b141729ccf38a15a2042c4~mv2.jpg", altText: "Måttbild: skåpet är 30 × 30 × 80 cm, det öppna facket 27,4 cm brett och 19 cm högt och benen 7,5 cm" },
      ],
      raa: 808106962,
      tecken: 601
    },
    {
      kort: "ed39cd4c",
      pid: "ed39cd4c-d5a6-41ab-9d95-a677a100e9e0",
      poster: [
        { id: "b379ce_7fd27a88163f46619786c90a9b7c7b9e~mv2.jpg", altText: "Toaletthylla i bambu med tre hyllplan och öppen nederdel" },
        { id: "b379ce_d04edc82b6fe4cdea5a9326cc0a456f0~mv2.jpg", altText: "Toaletthyllan över en tvättmaskin med handdukar, tvättmedel och en korg på hyllorna" },
        { id: "b379ce_ef9277215d9b4715a9717ea3113465d7~mv2.jpg", altText: "Två toaletthyllor bredvid varandra, den ena över en tvättmaskin, med handdukar och flaskor" },
        { id: "b379ce_9f9bb8eeda91435d957588a0644296de~mv2.jpg", altText: "Toaletthyllan över en toalett i ett badrum med fler möbler i bambu" },
        { id: "b379ce_933addfdf5ae440b871cbcf251f1b7b4~mv2.jpg", altText: "Måttbild: hyllan är 68 × 20 × 165 cm, 64 cm bred och 92 cm hög under hyllplanen, och varje hyllplan bär 5 kg" },
      ],
      raa: 164033740,
      tecken: 647
    },
    {
      kort: "f2756389",
      pid: "f2756389-3bbe-4926-9d10-6c189eb090d8",
      poster: [
        { id: "b379ce_69b0f535c2d2456d8161c714a5d63b38~mv2.jpg", altText: "Tre satsbord med skivor i trämönster och svart stålram, inskjutna i varandra" },
        { id: "b379ce_55662214ebb84530ac47f176b0e38d40~mv2.jpg", altText: "Satsborden framför en soffa, ihopställda som soffbord" },
        { id: "b379ce_7f9ed94f0fe6495ab85d406689d62863~mv2.jpg", altText: "Närbild på två bordsskivor med en tidning, glasögon och en kopp" },
        { id: "b379ce_e18f348b9cdb4afb9990a22c084641c2~mv2.jpg", altText: "Närbild på ett hörn av bordsskivan och stålramens skruvar" },
        { id: "b379ce_fdc9b856446544a48f71c8f2e7f24d0b~mv2.jpg", altText: "Måttbild: borden är 45 × 45 × 44, 40 × 40 × 39,5 och 34 × 34 × 34,5 cm" },
      ],
      raa: 466766137,
      tecken: 563
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
