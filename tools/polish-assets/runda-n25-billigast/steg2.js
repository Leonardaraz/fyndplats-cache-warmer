async function () {
  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };

  const PLAN = [
    {
      kort: "c5d73d3d",
      pid: "c5d73d3d-4aca-447f-af27-272826791752",
      poster: [
        { id: "b379ce_7016428f875b43418290c766afb84396~mv2.jpg", altText: "Mobilt TV-stativ i svart, sett snett framifrån med hyllor och hjul" },
        { id: "b37
steg2.js skriven (9766 tecken)
6548~mv2.jpg", altText: "Kvinna sitter i soffan och tittar på en TV monterad på stativet, med en kamera och böcker på hyllan" },
        { id: "b379ce_c655c83b55b245a9a4a775982d6bbc23~mv2.jpg", altText: "TV-stativet i ett sovrum med en kvinna som sitter på sängen och håller i fjärrkontrollen" },
        { id: "b379ce_f7c5ed290418486aae4c14d798cf1212~mv2.jpg", altText: "TV-stativet i ett mysigt vardagsrum med ljus, en krukväxt och böcker på mellanhyllan" },
        { id: "b379ce_32d3ab6f46bc415db32cd345c712593a~mv2.jpg", altText: "Måttbild som visar TV-stativets höjdjustering 129,5–189 cm samt bredd och djup" },
      ],
      raa: 943274801,
      tecken: 659
    },
    {
      kort: "a00a6b82",
      pid: "a00a6b82-6cdc-48cf-bbaa-a3ca108353bf",
      poster: [
        { id: "b379ce_4ae903da31d748579ccd7f63b3a419a9~mv2.jpg", altText: "Matbord med marmorerad vit bordsskiva och rund fot i svart metall" },
        { id: "b379ce_7fc3ecb8f67c4760abf88c71df392964~mv2.jpg", altText: "Matbordet uppställt i ett kök med två stolar, en vas med blommor och en kaffekopp" },
        { id: "b379ce_03be04751cbd4bd2b4c71d71ebda4178~mv2.jpg", altText: "Matbordet i ett rum med fönster, uppdukat med frukt, böcker och en kaffekopp" },
        { id: "b379ce_46897fe26d3f45f384a60342f7fe792b~mv2.jpg", altText: "Närbild uppifrån på bordsskivan uppdukad med kaffekoppar och en skål med frukt" },
        { id: "b379ce_5e5626ac189c41dd8606418576415dda~mv2.jpg", altText: "Måttbild som visar matbordets mått 70 x 70 x 76 cm samt bordsskivans tjocklek" },
      ],
      raa: 102491524,
      tecken: 621
    },
    {
      kort: "d475b0b9",
      pid: "d475b0b9-bfe9-43ce-922e-573b6e4418f8",
      poster: [
        { id: "b379ce_b780b9e5f6244ccda9fa90d6bf6af852~mv2.jpg", altText: "Ljusgrönt skoskåp med två klaffdörrar i rottingoptik och ben i furu" },
        { id: "b379ce_e698d7bd246448c08dafc4f15836480b~mv2.jpg", altText: "Skoskåpet öppet i en hall med skor synliga i båda facken och en robotdammsugare bredvid" },
        { id: "b379ce_aae299331c274fbdae8988a95f9d6b67~mv2.jpg", altText: "Skoskåpet stängt i en hall med en vas och doftpinnar ovanpå" },
        { id: "b379ce_e30198b310d34e9ab4cadee588b169a8~mv2.jpg", altText: "En kvinna öppnar den nedre klaffen på skoskåpet och tar fram ett par skor" },
        { id: "b379ce_cf23d68735cd445e93ef09bdb7c91dd6~mv2.jpg", altText: "Måttbild som visar skoskåpets mått 80 x 26 x 101 cm samt klaffens innermått" },
      ],
      raa: 186826922,
      tecken: 605
    },
    {
      kort: "a41af4d0",
      pid: "a41af4d0-9d44-4383-abf6-0b783b93fa51",
      poster: [
        { id: "b379ce_4e104a06894141bd859c82bbfea2c9ed~mv2.jpg", altText: "Svart vedhylla i metall med dekorativt bladmönster på sidopanelerna" },
        { id: "b379ce_16affb7b12794d17b105d188cec6feee~mv2.jpg", altText: "Vedhyllan fylld med huggen ved på en uteplats med eldkorg och utemöbler i bakgrunden" },
        { id: "b379ce_298b88f483304692bab563dafd99a069~mv2.jpg", altText: "Fyra bilder som visar vedhyllan använd som växtställ på balkong, uteplats och i vardagsrum" },
        { id: "b379ce_83e10491920d4b4ea958098292e6dfad~mv2.jpg", altText: "Vedhyllan dekorerad med ljusslinga och julgrönt på en snöig veranda" },
        { id: "b379ce_8c25499c07394ef0b953838d696e6f29~mv2.jpg", altText: "Måttbild som visar vedhyllans mått 38 x 38 x 112 cm samt maxbelastning 100 kg" },
      ],
      raa: 840921270,
      tecken: 629
    },
    {
      kort: "7f261d71",
      pid: "7f261d71-8f9c-40b9-8bdb-4358c467e0a0",
      poster: [
        { id: "b379ce_8709527e54ce40a38f0920e5c4dc856f~mv2.jpg", altText: "Vit byrå med fem lådor och runda knoppar, sedd snett framifrån" },
        { id: "b379ce_79ceac69e87141b3a141d5e76dba6e2a~mv2.jpg", altText: "Byrån i ett sovrum med en sjal hängande över kanten och en förvaringslåda ovanpå" },
        { id: "b379ce_dedff33e9fe94405b1531393594f9614~mv2.jpg", altText: "Byrån i ett vardagsrum med en vas, böcker och en tavla ovanpå" },
        { id: "b379ce_45ae693041674f9e9d13c18d22369d9a~mv2.jpg", altText: "Byrån i ett vardagsrum sedd från en annan vinkel med en vas och böcker ovanpå" },
        { id: "b379ce_4f3d1a106cdf44fd96afa5f791edd0e4~mv2.jpg", altText: "Måttbild som visar byråns mått 60 x 39,5 x 95,3 cm samt lådans yttermått" },
      ],
      raa: 338795843,
      tecken: 596
    },
    {
      kort: "76a35e25",
      pid: "76a35e25-1d0c-46e2-b9d3-af57f63277a7",
      poster: [
        { id: "b379ce_5e11817d066849229c466188123d81f5~mv2.jpg", altText: "Vit sängram i furu med naturliga träaccenter på huvud- och fotgavel" },
        { id: "b379ce_df2224e01cda4d2798fecd7ecb724717~mv2.jpg", altText: "Sängramen uppbäddad i ett sovrum med kuddar och en filt" },
        { id: "b379ce_9cbdb9a102f14ae0bff0a22448782aa2~mv2.jpg", altText: "Sängramen i ett sovrum med förvaringslådor placerade under sängen" },
        { id: "b379ce_f5ca207a7a6b49deba94ed8f1d31d3ad~mv2.jpg", altText: "Sängramen i ett sovrum med en robotdammsugare som kör under sängen" },
        { id: "b379ce_21c1a3c8b71a4235a53d10e90ab1b6fc~mv2.jpg", altText: "Måttbild som visar sängramens mått 210 x 98 x 82 cm samt markfriheten 23 cm" },
      ],
      raa: 327892368,
      tecken: 572
    },
    {
      kort: "7b62aa26",
      pid: "7b62aa26-984a-4ab1-ae2c-b0fc057639a0",
      poster: [
        { id: "b379ce_ffd10f8318c84c559a106d308c2ee75a~mv2.jpg", altText: "Röd elmotorcykel för barn med stödhjul, sedd snett framifrån" },
        { id: "b379ce_6d7f5fe000874752ba1cfe7a5d0046b4~mv2.jpg", altText: "En pojke står bredvid elmotorcykeln på en gångväg utomhus" },
        { id: "b379ce_a520974f3b424a6d82e3d2709f7d868b~mv2.jpg", altText: "Närbild på elmotorcykelns bakre fjädring och kedjedetalj" },
        { id: "b379ce_48fa9264a179427ca839a9b55d2d8aca~mv2.jpg", altText: "Närbild på elmotorcykelns fotstöd och pedal" },
        { id: "b379ce_c89080d2d4304db7ab4080c958f57edb~mv2.jpg", altText: "Måttbild som visar elmotorcykelns mått 105 x 57 x 62 cm samt sitshöjden 39 cm" },
      ],
      raa: 478925887,
      tecken: 537
    },
    {
      kort: "fba6f1f4",
      pid: "fba6f1f4-fc70-4109-a7dd-396b0d27f4d0",
      poster: [
        { id: "b379ce_ec461be20006449087d9beb4dbd40c64~mv2.jpg", altText: "Skrivbord med bordsskiva i rustik brun träeffekt och svart stålram" },
        { id: "b379ce_c15731289ea041b4b81ee0092679d2f8~mv2.jpg", altText: "Skrivbordet i ett hemmakontor med en bildskärm, hörlurar och en kontorsstol" },
        { id: "b379ce_50c15889d7ea47bbaecfb72523aac946~mv2.jpg", altText: "Skrivbordet i en gamingmiljö med rgb-belysning, bildskärm och en gamingstol" },
        { id: "b379ce_9230713726fa4627b44df717770df2b3~mv2.jpg", altText: "Skrivbordet sett uppifrån i ett hemmakontor med bokhylla och en bildskärm" },
        { id: "b379ce_c56a1b076bd34e6cb3b8dee62de806ac~mv2.jpg", altText: "Måttbild som visar skrivbordets mått 120 x 60 x 76 cm samt maxbelastning 50 kg" },
      ],
      raa: 844016945,
      tecken: 611
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
