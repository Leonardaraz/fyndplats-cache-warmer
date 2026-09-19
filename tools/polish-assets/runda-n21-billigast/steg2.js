async function () {
  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };

  const PLAN = [
    {
      kort: "69458759",
      pid: "69458759-48fc-4bfc-bbab-292c80b2e66f",
      poster: [
        { id: "b379ce_be1d13d3c2da4700b335a61d27bb434f~mv2.jpg", altText: "Matbord i kautschukträ med rundade hörn, mot vit bakgrund" },
        { id: "b379ce_2c55b85f71244fdfb114684a5cfa5b95~mv2.jpg", altText: "Matbordet i en ljus köksmiljö med tre stolar, en fruktskål och en brödrost" },
        { id: "b379ce_a0e82e65eb2f45dc9f72299c8441a572~mv2.jpg", altText: "Närbild på bordets undersida och ben i en köksmiljö" },
        { id: "b379ce_53e05096357845a88814e1560c658856~mv2.jpg", altText: "Närbild på skarven mellan ben och underrede, stående på en matta" },
        { id: "b379ce_b5ac2020c86a4cca8e6fd4fb3930eb21~mv2.jpg", altText: "Måttskiss som visar bordets mått 70 x 70 x 75 cm och maximal belastning 50 kg" },
      ],
      raa: 6980455,
      tecken: 567
    },
    {
      kort: "67cc5f53",
      pid: "67cc5f53-d11e-41fc-90ff-ea64c346f835",
      poster: [
        { id: "b379ce_3f6386757ce54c738ef776e58b42d51e~mv2.jpg", altText: "Höjdjusterbar skrivbordsstol i vitt konstläder, mot vit bakgrund" },
        { id: "b379ce_0ec0ef7b15b147f192aa2376812228eb~mv2.jpg", altText: "Stolen vid ett skrivbord där någon sitter och läser, med dator och mugg på bordet" },
        { id: "b379ce_9e3f922742064e7484e20fb2c6a7e38e~mv2.jpg", altText: "Närbild på stoppningen och sömmarna i sitsens konstläder" },
        { id: "b379ce_b448a4aca0144c55b9c61492546c1c93~mv2.jpg", altText: "Närbild på stolens hjul och underrede" },
        { id: "b379ce_f6a8b14563614380831fa4b9a5d49389~mv2.jpg", altText: "Måttskiss som visar stolens mått 65 x 64 x 88–98 cm och sitshöjd 49–59 cm" },
      ],
      raa: 172708461,
      tecken: 555
    },
    {
      kort: "4275e300",
      pid: "4275e300-41f2-4ed4-95af-92f43ebdbab3",
      poster: [
        { id: "b379ce_b5899a53653743e6913270b7d54faa76~mv2.jpg", altText: "Kontorsfåtölj i grön sammetslook med urtagbar ländkudde, mot vit bakgrund" },
        { id: "b379ce_c74e01522be44c7cbfd09bfaa0827504~mv2.jpg", altText: "Fåtöljen i en ljus kontorsmiljö vid ett skrivbord med en datorskärm" },
        { id: "b379ce_97a68b40caef4e17ba7a1405bd0d7ff3~mv2.jpg", altText: "Fåtöljen sedd från sidan i samma kontorsmiljö" },
      ],
      raa: 227874165,
      tecken: 331
    },
    {
      kort: "ffdb99fa",
      pid: "ffdb99fa-a7e8-4266-82d0-e2ff1bd12115",
      poster: [
        { id: "b379ce_6e7c30f626c44675b743415886f96f2e~mv2.jpg", altText: "S-formad solsäng i konstrotting med dyna, mot vit bakgrund" },
        { id: "b379ce_4930ff7124cd4ff3a4c023b6b874f139~mv2.jpg", altText: "Solsängen vid en pool, med en kopp kaffe på ett litet bord bredvid" },
        { id: "b379ce_8b4212a4097d4961b3f6cb9910838fde~mv2.jpg", altText: "Solsängen vid en pool, med ett glas juice på ett bord bredvid" },
        { id: "b379ce_0b644cb54f59464883b5e26a9ddc0e4f~mv2.jpg", altText: "Måttskiss som visar solsängens mått 175 x 57 x 80 cm och sitshöjd 32 cm" },
      ],
      raa: 973365844,
      tecken: 451
    },
    {
      kort: "4bdb33d4",
      pid: "4bdb33d4-001e-47dd-bf66-490a4a4a534e",
      poster: [
        { id: "b379ce_533d5bdd201542e1859c562491fe8e06~mv2.jpg", altText: "Gödselspridare med stor korg och T-handtag, mot vit bakgrund" },
        { id: "b379ce_068a1a32bb7c474db94575d9b5619d2e~mv2.jpg", altText: "En person sprider gödsel över en gräsmatta med spridaren" },
        { id: "b379ce_cb3553c131984806bf92809780bc7bb1~mv2.jpg", altText: "Spridaren uppställd vid ett förrådsskjul med krukor och verktyg" },
        { id: "b379ce_870be85e43b641308354b181800b4e34~mv2.jpg", altText: "Spridaren uppställd vid ett förrådsskjul, sedd från en annan vinkel" },
        { id: "b379ce_efc41a6b72734714866ab0330f7322db~mv2.jpg", altText: "Måttskiss som visar spridarens mått 70 x 40 x 112 cm och handtagslängd 62 eller 67 cm" },
      ],
      raa: 669979106,
      tecken: 575
    },
    {
      kort: "a2f4a42b",
      pid: "a2f4a42b-0199-48cc-b505-d2cc386275fd",
      poster: [
        { id: "b379ce_ef0f1c9c2309419a8d394bea6b77935e~mv2.jpg", altText: "Oval odlingslåda i vågformad, mörkgrå plåt, mot vit bakgrund" },
        { id: "b379ce_2f9f5128d5a644a389dc408c50cb1d8e~mv2.jpg", altText: "Odlingslådan på en uteplats i en trädgårdsmiljö" },
        { id: "b379ce_7cadd9b21ec54daea4b56cf24337ad3f~mv2.jpg", altText: "Odlingslådan vid en entré tillsammans med krukväxter" },
        { id: "b379ce_8ccc70f1b87f4d11952fee19e7acc71c~mv2.jpg", altText: "Odlingslådan vid en plåtvägg med en vattenkanna bredvid" },
        { id: "b379ce_0f35c3580e7c4399b375893574d69492~mv2.jpg", altText: "Måttskiss som visar odlingslådans yttermått 160 x 80 x 80 cm och innermått cirka 159 x 79 x 80 cm" },
      ],
      raa: 959531255,
      tecken: 555
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
