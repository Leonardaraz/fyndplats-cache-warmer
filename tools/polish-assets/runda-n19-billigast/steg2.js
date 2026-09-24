async function () {
  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };

  const PLAN = [
    {
      kort: "f0e40907",
      pid: "f0e40907-1200-4ca8-9478-e1bf129a03b4",
      poster: [
        { id: "b379ce_3cfe8fa9bb3e4d7f982444653e00d9ba~mv2.jpg", altText: "Svart väggarderob i trädform med grenar, löv och fyra fåglar, mot vit bakgrund" },
        { id: "b379ce_ed3d18eab5db4649b61b2b8fe474179c~mv2.jpg", altText: "Väggarderoben i en ljus hall med en kofta på galge, en väska och en kamera hängande i grenarna" },
        { id: "b379ce_beea9237d43847bbbeb688167ec2fa0b~mv2.jpg", altText: "Väggarderoben i ett vardagsrum med hörlurar hängande i en gren, bredvid ett golvskåp och en golvlampa" },
        { id: "b379ce_77e104fa74dc45b38637ba0a2c0bb13e~mv2.jpg", altText: "Väggarderoben vid en ytterdörr med ett hopfällt paraply hängande i en gren" },
        { id: "b379ce_6268cc3311fd4701bb743582bdce2ec8~mv2.jpg", altText: "Måttskiss som visar trädets höjd 175 cm och bredd 120 cm" },
      ],
      raa: 763105564,
      tecken: 647
    },
    {
      kort: "5d79afbe",
      pid: "5d79afbe-2cd6-44ce-bb28-77ecfd10dba4",
      poster: [
        { id: "b379ce_15eda706a6574cb0be54e676b5313505~mv2.jpg", altText: "Orangefärgat smådjursstall i två plan med trådnät och lameller, mot vit bakgrund" },
        { id: "b379ce_5be171eac130401f837f5e4a96596169~mv2.jpg", altText: "En vit kanin sitter i det övre planet, omgiven av krukväxter i en trädgård" },
        { id: "b379ce_47d6ac1393104e8ba21d43fd4a741df8~mv2.jpg", altText: "Stallet med taket uppfällt, båda planens utdragbara bottentråg synliga, i en trädgård" },
        { id: "b379ce_dd0563b957774098bb86cc839cc292f3~mv2.jpg", altText: "Närbild på dörrens metallregel och gångjärn" },
        { id: "b379ce_99c32a3ecf3c4d68a44015694b78b8f1~mv2.jpg", altText: "Måttskiss som visar stallets bredd 90 cm och djup 45 cm jämfört med en människas storlek" },
      ],
      raa: 558809875,
      tecken: 614
    },
    {
      kort: "1f055143",
      pid: "1f055143-96e1-48dd-8259-02f1a569f627",
      poster: [
        { id: "b379ce_9d7a3f393a8a46079e655eb5c23a09c7~mv2.jpg", altText: "Böjt skärmtak i genomskinlig polykarbonat med tre svarta konsoler, mot vit bakgrund" },
        { id: "b379ce_f328e9e58d5b402a958dde46bbe32719~mv2.jpg", altText: "Skärmtaket monterat ovanför en balkongdörr, med en barvagn och krukväxter under" },
        { id: "b379ce_a51402f3aeaf4f9cbc95980e1a3c0d6d~mv2.jpg", altText: "Närbild på konsolens aluminiumlist och den höghållfasta plasthållaren" },
        { id: "b379ce_536974b5710b440aa5681023be52b6d3~mv2.jpg", altText: "Skärmtaket monterat ovanför en dubbeldörr på en villas gavel" },
        { id: "b379ce_33d3e3b6251242c7b2999ab475438b43~mv2.jpg", altText: "Måttskiss som visar skärmtakets bredd 295 cm, djup 90 cm och höjd 23,5 cm" },
      ],
      raa: 971013046,
      tecken: 608
    },
    {
      kort: "ecb304cd",
      pid: "ecb304cd-ef92-4e1d-b81d-e92f30e9c313",
      poster: [
        { id: "b379ce_e68b69bfbc314f2cab7884d8648c00a1~mv2.jpg", altText: "Hopfällbart bord med svart skiva och vita geometriska mönster för dryckesspel, mot vit bakgrund" },
        { id: "b379ce_7c28cee8e0e742168a6b7e4d0888908d~mv2.jpg", altText: "Bordet vid en sjö i fjällandskap med en kylbox och ryggsäckar ovanpå" },
        { id: "b379ce_95c7bc2d8ade4a339532597cac8645ee~mv2.jpg", altText: "En grupp vänner spelar dryckesspel med bägare och en boll vid bordet i en skogsbacke" },
        { id: "b379ce_41ad5100590d47e2a8fe9c394656d3a5~mv2.jpg", altText: "Undersidan av bordet som visar de infällbara benen och bärhandtaget" },
        { id: "b379ce_e77d8ec095b342c1a079504c2d99f906~mv2.jpg", altText: "Måttskiss som visar bordets längd 240 cm, bredd 60 cm och de tre höjderna 54, 62 och 70 cm" },
      ],
      raa: 849814080,
      tecken: 648
    },
    {
      kort: "ba3e6e04",
      pid: "ba3e6e04-be97-4f9e-a1f2-79a71f49c7d2",
      poster: [
        { id: "b379ce_20709ea65f2d4ee98dd44708fc988a4b~mv2.jpg", altText: "Svart ståbord i C-form med fyra hjul, mot vit bakgrund" },
        { id: "b379ce_94cecc30c44448d29a0b4905c3ed270a~mv2.jpg", altText: "Bordet bredvid en beige soffa med en bärbar dator, en klocka och en växt på skivan" },
        { id: "b379ce_e9bc4db1ce0f47608a2ad19226e46cf7~mv2.jpg", altText: "Bordet bredvid en grön soffa med böcker och en fotoram på skivan" },
        { id: "b379ce_26b8251778d340cd9d8b8c0f873ab9a3~mv2.jpg", altText: "Uppifrånvy av skivan med en bärbar dator, klocka, mobil och hörlurar" },
        { id: "b379ce_0a93b63ef09a43ad8e5ffd6d9fddd9de~mv2.jpg", altText: "Måttskiss som visar skivans mått 65 × 48 cm, höjdintervallet 73–110 cm och maxlasten 70 kg" },
      ],
      raa: 290250962,
      tecken: 602
    },
    {
      kort: "f6be9960",
      pid: "f6be9960-22c8-4f7d-80d4-76d116ad1577",
      poster: [
        { id: "b379ce_eaa07dd276cf4e569ba8fad57686a557~mv2.jpg", altText: "Växttrappa i stål med fyra gråbruna balkar, tom, mot vit bakgrund" },
        { id: "b379ce_c822f0da48fe4629ac6422f049013ba8~mv2.jpg", altText: "Växttrappan utomhus mot en grå vägg, med blommor planterade i varje nivå" },
        { id: "b379ce_c09ff2ca9bda4e5b995327245ff60e3e~mv2.jpg", altText: "Närbild på växttrappan med rosmarin och hängande makramékrukor" },
        { id: "b379ce_4c17ddd8615c48d7b5db6a1bbac9fca5~mv2.jpg", altText: "Närbild på den nedersta nivån med vita blomkrukor" },
        { id: "b379ce_fea4e88bc4b04138aa88001f3ee53e96~mv2.jpg", altText: "Måttskiss som visar växttrappans bredd 76 cm, djup 79 cm och höjd 162 cm" },
      ],
      raa: 633880035,
      tecken: 564
    },
    {
      kort: "92a468c7",
      pid: "92a468c7-7b14-47aa-beb4-a6b5837bd8b1",
      poster: [
        { id: "b379ce_85fcfb556bf54be19879c5f93732bfed~mv2.jpg", altText: "Trimbord för hund i svart med en hopfällbar bygel och ett koppel, mot vit bakgrund" },
        { id: "b379ce_73166d381edf43558438134cd2e4c5d4~mv2.jpg", altText: "En yorkshireterrier med rosett ligger på trimbordet i ett ljust rum med en växt i bakgrunden" },
        { id: "b379ce_022c07ecf03249d3be794f297f090362~mv2.jpg", altText: "Närbild på bygelns krok och det hopvridna kopplet" },
        { id: "b379ce_bb1598af38b44836bc6c7027b2ef2ae4~mv2.jpg", altText: "Närbild på höjdjusteringsvredet vid bygelns fot" },
        { id: "b379ce_5c7c0eb33f7b45ba8862f0328665f143~mv2.jpg", altText: "Måttskiss som visar bygelns höjdintervall 20–70 cm, bordets bredd 91,5 cm och djup 61,5 cm" },
      ],
      raa: 274330390,
      tecken: 604
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
