async function () {
  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };

  const PLAN = [
    {
      kort: "82000c6b",
      pid: "82000c6b-7a34-4485-a954-dfc8d37336ba",
      poster: [
        { id: "b379ce_861dd04421094b0abf2bfab39fece4bc~mv2.jpg", altText: "Basketkorg med genomskinlig ryggskiva, svart ram och nät i vitt, rött och blått" },
        { id: "b379ce_69a3b07f580c47ca97034d2ac2ddd05d~mv2.jpg", altText: "Korgen på en grå betongvägg utomhus med krukväxter och en boll på marken" },
        { id: "b379ce_3cfc67e9d5034f42b387a0659e1147aa~mv2.jpg", altText: "Måttbild som visar skivan 110 × 70 cm, ringen Ø45 cm och 28 cm till väggen" },
      ],
      raa: 694033123,
      tecken: 371
    },
    {
      kort: "2f251ce3",
      pid: "2f251ce3-b737-4b27-9394-cc27325b6519",
      poster: [
        { id: "b379ce_e591c9cf16b2442e97918f27aa21d735~mv2.jpg", altText: "Två grå matstolar i sammetslook med skalformad rygg och ben i ljust trä" },
        { id: "b379ce_142139b4c8c041ef9a7c197c709d9e2d~mv2.jpg", altText: "Stolarna vid ett matbord i trä i ett ljust rum" },
        { id: "b379ce_04c839cc85a8481f9d18931d38f35816~mv2.jpg", altText: "Närbild på ett stolsben i ljust trä mot ett grått golv" },
        { id: "b379ce_02c1c97739cb4af0bc5eed8d70718ed1~mv2.jpg", altText: "Närbild på det grå tyget i sammetslook med en söm i ryggen" },
        { id: "b379ce_eb8d1c40e6b14360a9ee9068d1b19159~mv2.jpg", altText: "Måttbild som visar stolen 54 × 57 × 80 cm och sitsen 47 cm över golvet" },
      ],
      raa: 61797460,
      tecken: 543
    },
    {
      kort: "5c566983",
      pid: "5c566983-8079-47a8-9406-0033f451585f",
      poster: [
        { id: "b379ce_ab77ba1db13c49b8be8093be3095573b~mv2.jpg", altText: "Gräddvit matsalsbänk med ryggstöd och smala metallben" },
        { id: "b379ce_a0e6125b2cfd4a5aa647c26d28d96085~mv2.jpg", altText: "Bänken i ett ljust vardagsrum bredvid ett marmorbord och en rund puff" },
        { id: "b379ce_0739ab2dfc5b4aee858e045d72c79a0b~mv2.jpg", altText: "Bänken vid ett matbord i trä på en ljus matta" },
        { id: "b379ce_2dd2996534dc4b64bcff3612880ff706~mv2.jpg", altText: "Bänken vid ett långbord i ett ljust kafé med tre personer i bakgrunden" },
        { id: "b379ce_8b3e08aa9b5e49b0ae4c7f0b974a3d36~mv2.jpg", altText: "Måttbild som visar bänken 120 × 61,5 × 85 cm och sitsen 47 cm över golvet" },
      ],
      raa: 68458874,
      tecken: 554
    },
    {
      kort: "07565140",
      pid: "07565140-2873-4c43-9d43-c30f8d21d37b",
      poster: [
        { id: "b379ce_ff0c8e5069114306850da68d2527d35c~mv2.jpg", altText: "Vit sideboard i lantstil med skiva i träton, två dörrar öppna och kryddhylla i vänster dörr" },
        { id: "b379ce_05400277c4104d7a846eda5e340d7c7e~mv2.jpg", altText: "Sideboarden som kaffestation i ett kök med kryddor i dörren och burkar på hyllorna" },
        { id: "b379ce_ed026e6958554efb9304abedc3f8e427~mv2.jpg", altText: "Sideboarden stängd under en väggmonterad tv, med en skivspelare och böcker på skivan" },
        { id: "b379ce_f798faa01dbe44e8aca7071df12c5dc2~mv2.jpg", altText: "Måttbild som visar sideboarden 100 × 40 × 81 cm och lådan 59,5 cm bred invändigt" },
      ],
      raa: 739311406,
      tecken: 532
    },
    {
      kort: "30f2151f",
      pid: "30f2151f-8142-441b-97db-71236fce027b",
      poster: [
        { id: "b379ce_4832de3e0c454934b23d90f150ed634d~mv2.jpg", altText: "Svart varmluftsfritös och miniugn med vred ovanför glasluckan" },
        { id: "b379ce_3be2dba07f8b46f4a6de64aea1a91cb6~mv2.jpg", altText: "Ugnen på en köksbänk med en pizza bakom glasluckan" },
        { id: "b379ce_1adca3bdc5d84208b15fe85bf423040b~mv2.jpg", altText: "En kyckling på grillspettet i den tända ugnen" },
        { id: "b379ce_3c31f105bd1741e59caccce4f54ebb4c~mv2.jpg", altText: "Ugnen med öppen lucka när en plåt med grönsaker tas ut" },
        { id: "b379ce_dd2ae800c662449f8a534a5d42c45847~mv2.jpg", altText: "Måttbild som visar ugnen 54 × 48 × 48,2 cm med plåt, korg, galler och grillspett" },
      ],
      raa: 429690438,
      tecken: 534
    },
    {
      kort: "dbedaf4c",
      pid: "dbedaf4c-492b-4221-9259-445f305a8a83",
      poster: [
        { id: "b379ce_10e620a568204e1fb019dcc755397f5c~mv2.jpg", altText: "Vit sideboard med två spårade dörrar, fyra lådor och svarta bågformade handtag" },
        { id: "b379ce_59c5952340504081a68f0d633322d3c8~mv2.jpg", altText: "Sideboarden i ett kök med blå väggar, med kaffemaskin och frukt på skivan" },
        { id: "b379ce_bcef014da71346f486751ed8979df0e7~mv2.jpg", altText: "Två utdragna lådor på metallskenor med dukar och servetter" },
        { id: "b379ce_b07baa67f8ca470aae6f78982dff07ac~mv2.jpg", altText: "Närbild på två svarta bågformade handtag på de spårade dörrarna" },
        { id: "b379ce_0ac54609f59f4bc081ce5c903399f428~mv2.jpg", altText: "Måttbild som visar sideboarden 105 × 40 × 76 cm" },
      ],
      raa: 79599947,
      tecken: 563
    },
    {
      kort: "b2b731c7",
      pid: "b2b731c7-fb5b-4c47-8d92-a60ed10d0e77",
      poster: [
        { id: "b379ce_26c68a6deee94700a5843a0f31164a39~mv2.jpg", altText: "Massageapparat i blått och svart med stoppad vaddel och två öppningar för fötterna" },
        { id: "b379ce_4dc8972c019e414d998f3b70028c8128~mv2.jpg", altText: "En kvinna läser i soffan med fötterna och vaderna i massageapparaten" },
        { id: "b379ce_13f1225b57604653a08315e52ec72132~mv2.jpg", altText: "En äldre kvinna i soffan med en filt över benen och fötterna i apparaten" },
        { id: "b379ce_b3c1cfed5ec3484f9f4f40348f2de7f3~mv2.jpg", altText: "En kvinna vid ett skrivbord med fötterna i massageapparaten under bordet" },
        { id: "b379ce_e48e0df178d34a8994b03a8be1d9ea3e~mv2.jpg", altText: "Måttbild som visar apparaten 38 × 37 × 46 cm och hopfälld 27 cm hög" },
      ],
      raa: 620622736,
      tecken: 605
    },
    {
      kort: "b3efdd39",
      pid: "b3efdd39-70f5-4ad0-bedd-98ab8f4608f0",
      poster: [
        { id: "b379ce_fe0e2b7098034b2ba05868b34774c1f2~mv2.jpg", altText: "Vitt matbord med skiva i tre delar och breda skivben" },
        { id: "b379ce_482c8cb186f940acbabc8006c9e5df27~mv2.jpg", altText: "Bordet dukat i ett ljust kök med fyra stolar i beige tyg" },
        { id: "b379ce_e608e74259224ef29268461497969b64~mv2.jpg", altText: "Bordet som skrivbord med en bärbar dator, en lampa och en stol" },
        { id: "b379ce_c7dda7aeed1945c49320c382acf907a3~mv2.jpg", altText: "Bordet dukat till frukost i ett kök med fyra stolar" },
        { id: "b379ce_64142f57fe9246a5af93f1b27df169e3~mv2.jpg", altText: "Måttbild som visar bordet 120 × 60 × 75,5 cm och ett uppfällt fack på 45,5 × 32 × 9 cm" },
      ],
      raa: 418412571,
      tecken: 551
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
