async function () {
  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };

  const PLAN = [
    {
      kort: "ccae0705",
      pid: "ccae0705-a08d-41de-ae5b-0a48c32f3cc2",
      poster: [
        { id: "b379ce_c3887be0912f4fbc84aa818942ab47cd~mv2.jpg", altText: "Medicinskåp i rostfritt stål med frostad glasdörr och ett kors för första hjälpen" },
        { id: "b379ce_7dd08cd353814100857ee9f9a8133887~mv2.jpg", altText: "Medicinskåpet på en badrumsvägg med dörren öppen och hyllorna fyllda" },
        { id: "b379ce_ccc728ff2c6f406589259ea5541cc4ac~mv2.jpg", altText: "Närbild på låset med nycklarna och tryckspärren" },
        { id: "b379ce_7f49b470c9714306a01ac151f9c368bf~mv2.jpg", altText: "Närbild på tryckspärren som öppnar dörren med ett tryck" },
        { id: "b379ce_96c81ca84b1d4d7493fd0a606d5db8f8~mv2.jpg", altText: "Måttbild: medicinskåpet är 30 cm brett, 18 cm djupt och 50 cm högt" },
      ],
      raa: 256260543,
      tecken: 561
    },
    {
      kort: "f787a854",
      pid: "f787a854-c96d-458c-9640-e3d33c5b5c54",
      poster: [
        { id: "b379ce_b0f332cfd0bb42379207128d5e2f09d2~mv2.jpg", altText: "Julgirlang med snöpudrade kvistar, kottar, röda bär och tända LED-lampor" },
        { id: "b379ce_0024a1e9bb2e4dc68d50c5837798d0d1~mv2.jpg", altText: "Julgirlangen längs en spiselkrans med elektrisk brasa" },
        { id: "b379ce_02e92ee6ab654f1697509044e3b1f52d~mv2.jpg", altText: "Närbild på snöpudrade kvistar och röda bär framför en adventskalender" },
        { id: "b379ce_c61e7cd2eb29464aaa16f5d4c14ea87d~mv2.jpg", altText: "Måttbild: julgirlangen utsträckt, med en diameter på 25 cm" },
      ],
      raa: 319708446,
      tecken: 447
    },
    {
      kort: "f6e74878",
      pid: "f6e74878-d96a-4bdd-af71-8cc870658fa4",
      poster: [
        { id: "b379ce_36c77908a96d4523b89851c25f45573c~mv2.jpg", altText: "Skrivbord med vit metallram, ekfärgad skiva och upphöjd hylla" },
        { id: "b379ce_b93de33bb264413a9c20f38950f11433~mv2.jpg", altText: "Skrivbordet med en bärbar dator och en grön stol bredvid en bokhylla" },
        { id: "b379ce_f915d136c302487886c2bd641e2491b2~mv2.jpg", altText: "Ett barn sitter vid skrivbordet med en surfplatta framför ett fönster" },
        { id: "b379ce_8083f24bb6c74acda187061baf8bd96a~mv2.jpg", altText: "Närbild på skivans ekfärgade yta och rundade hörn" },
        { id: "b379ce_2a1e646f996d406d8071b6baa39c5770~mv2.jpg", altText: "Måttbild: skrivbordet är 84 × 45 × 85 cm med arbetshöjd 71,5 cm, och hyllan är 78 cm bred, 17 cm djup och 11,7 cm hög" },
      ],
      raa: 964514313,
      tecken: 608
    },
    {
      kort: "0d42d53f",
      pid: "0d42d53f-7470-4f92-a41c-14543893ce24",
      poster: [
        { id: "b379ce_561d1b0f7b5441059849b1f617ba58eb~mv2.jpg", altText: "Väggspegel med tunn svart metallram, rundade övre hörn och hylla i underkant" },
        { id: "b379ce_82ba4c59c7a5492d8d6c84386db1444b~mv2.jpg", altText: "Spegeln ovanför ett handfat med tvål och flaskor på hyllan" },
        { id: "b379ce_fcddb14ed3d3461180bcaa4f910b6b32~mv2.jpg", altText: "Närbild på ramens rundade hörn mot en grå vägg" },
        { id: "b379ce_51c8308aaabd41d2bf89a7a0cf2e9314~mv2.jpg", altText: "Närbild på den svarta hyllan i spegelns underkant" },
        { id: "b379ce_a5ed87d3aad64cf4bfa315b707b811ad~mv2.jpg", altText: "Måttbild: spegeln mäter 70 × 50 × 10,2 cm, med spegelglas 56 × 47 cm och en hylla på 50 × 10 cm" },
      ],
      raa: 686436260,
      tecken: 568
    },
    {
      kort: "114d37e5",
      pid: "114d37e5-692b-47eb-919c-63fc4b15032b",
      poster: [
        { id: "b379ce_643cc1cd43a44551bc1988193ea5d344~mv2.jpg", altText: "Fågelskrämma till halloween med säckvävshuvud, orange overall och en pumpa i handen" },
        { id: "b379ce_e955298077c042b8997abc46f1a90515~mv2.jpg", altText: "Fågelskrämman framför ett mörkt hus en höstkväll" },
        { id: "b379ce_bf1c1829fd4d43a2a0539a952cbd2caa~mv2.jpg", altText: "Närbild på den lysande pumpan i fågelskrämmans hand" },
        { id: "b379ce_ac6531eb29ab4d3d9e66470409d43456~mv2.jpg", altText: "Närbild på fågelskrämmans hand och ärm av säckväv" },
        { id: "b379ce_5d561f5e3b744f96bf8f760a0429ffde~mv2.jpg", altText: "Måttbild: fågelskrämman är 60 cm bred, 26 cm djup och 77 cm hög" },
      ],
      raa: 958296620,
      tecken: 538
    },
    {
      kort: "760dd23c",
      pid: "760dd23c-fe45-41f5-9e11-fce3c51172b4",
      poster: [
        { id: "b379ce_efea24a4bd234b6f90f6dd31eedde406~mv2.jpg", altText: "Hopfällbar transportvagn i svart och grönt med uppfällt handtag" },
        { id: "b379ce_a3018e30121544d18b391660a84678ef~mv2.jpg", altText: "Transportvagnen med en gul verktygslåda i en verkstad" },
        { id: "b379ce_5d5f445948cb48ca9f508ff618406f1a~mv2.jpg", altText: "Måttbild: transportvagnen är 49 × 35 × 102 cm och hopfälld 48 × 35 × 15 cm, och den bär 200 kg" },
      ],
      raa: 878263542,
      tecken: 356
    },
    {
      kort: "b8002629",
      pid: "b8002629-89d6-4409-b429-ad6b612d734c",
      poster: [
        { id: "b379ce_7e88036ba001449db7a9704157fbc212~mv2.jpg", altText: "Välvt skärmtak av polykarbonat med svarta konsoler" },
        { id: "b379ce_79cb98e0ab3548efaa7628f57a91b871~mv2.jpg", altText: "Skärmtaket över ett fönster på en vit husvägg" },
        { id: "b379ce_0f5549783df247e089d11cc8fa52189c~mv2.jpg", altText: "Skärmtaket över en balkongdörr bredvid en vägglampa" },
        { id: "b379ce_8e41335409e94850b570b791cb6470dd~mv2.jpg", altText: "Måttbild: skärmtaket är 100 cm brett, 75 cm djupt och 23 cm högt" },
      ],
      raa: 524658476,
      tecken: 405
    },
    {
      kort: "26ec5761",
      pid: "26ec5761-9d0c-4c8a-ac99-2a7aae5cb206",
      poster: [
        { id: "b379ce_84025a7d5b4a41beb7eea2f953d77e9b~mv2.jpg", altText: "Gåvagn i trä med grönt handtag, kulram, formsortering och blå hjul" },
        { id: "b379ce_86f8f5957ec34c2b91a14bcacc49134e~mv2.jpg", altText: "Ett småbarn går med gåvagnen medan en kvinna sitter på golvet" },
        { id: "b379ce_3d8a830084c940039af1747df0c18bc6~mv2.jpg", altText: "Ett skrattande barn skjuter gåvagnen över en matta" },
        { id: "b379ce_bbdb24daadd84f29b18c95ca2e04d008~mv2.jpg", altText: "Barnet håller i gåvagnens handtag medan en vuxen leker bredvid" },
        { id: "b379ce_749b178f3586436287024c7fb464712b~mv2.jpg", altText: "Måttbild: gåvagnen är 41 × 31,5 × 47 cm" },
      ],
      raa: 788772684,
      tecken: 522
    },
    {
      kort: "3b3705f5",
      pid: "3b3705f5-1faa-40c0-a089-86313c8422a8",
      poster: [
        { id: "b379ce_508f0c4b366f430b9013e141f9f1e9c1~mv2.jpg", altText: "Vit bokhylla i trädform med lutande plan" },
        { id: "b379ce_6fa002165e034e0ea25a653abbb5931f~mv2.jpg", altText: "Bokhyllan fylld med böcker i ett ljust vardagsrum" },
        { id: "b379ce_4f9a77fc2be64784874bbe8525fdba4f~mv2.jpg", altText: "Bokhyllan med böcker och en växt bredvid en tv-bänk" },
        { id: "b379ce_eac5fce06d7043369fa920eafaa8d790~mv2.jpg", altText: "Bokhyllan full med böcker bredvid ett skrivbord och en fåtölj" },
        { id: "b379ce_f3f3ed3168d74b108b22867437c5fca8~mv2.jpg", altText: "Måttbild: bokhyllan är 50 cm bred, 24 cm djup och 136 cm hög, varje plan 18 × 22 cm, och den bär 27 kg" },
      ],
      raa: 291153093,
      tecken: 547
    },
    {
      kort: "934297b1",
      pid: "934297b1-51c5-48d6-b570-8b1ab4dae1dd",
      poster: [
        { id: "b379ce_e86ad87f67f64f77b909257e2dbd6003~mv2.jpg", altText: "Upphöjd hundsäng med ljusgrått tak och liggyta av nät" },
        { id: "b379ce_2b412495d3c448b19304f881b057b674~mv2.jpg", altText: "En golden retriever sitter i hundsängen framför en tegelvägg" },
        { id: "b379ce_65d1cd9d8277498ea6c61d33b473d9f1~mv2.jpg", altText: "Närbild på taket och liggytan av nät" },
        { id: "b379ce_6a145e85c7a24bf1825f378ce7536d02~mv2.jpg", altText: "Hundsängen på en uteplats framför ett fönster" },
        { id: "b379ce_48da9d5a4b2d44d499851d726d3601df~mv2.jpg", altText: "Måttbild: hundsängen är 106 × 76 cm och 94 cm hög" },
      ],
      raa: 586274192,
      tecken: 487
    },
    {
      kort: "a62db5fd",
      pid: "a62db5fd-b7b0-4b98-9cb1-7675949e2958",
      poster: [
        { id: "b379ce_11aaf6a9e7b84d31b98e16b27f360c11~mv2.jpg", altText: "Uppblåsbar ren som drar tomten och en snögubbe i en röd släde" },
        { id: "b379ce_29a3bb786e1e43adb4479ca2f6bdd5a6~mv2.jpg", altText: "Den uppblåsta julfiguren tänd framför ett hus med julbelysning" },
        { id: "b379ce_4c47014f4d2b44ea9be06de593f5933c~mv2.jpg", altText: "Närbild på renens hovar och slädens mede" },
        { id: "b379ce_799dce8a529340d0a002a23054ca501e~mv2.jpg", altText: "Närbild på snögubben med hög hatt och blå halsduk" },
        { id: "b379ce_f4f67ff6fee44f3ca6a4aec56391e707~mv2.jpg", altText: "Måttbild: julfiguren är 200 cm lång, 80 cm djup och 128 cm hög, bredvid en mänsklig siluett" },
      ],
      raa: 842416206,
      tecken: 547
    },
    {
      kort: "b51b6e6c",
      pid: "b51b6e6c-c86d-4de4-ad1e-9c795aa4d0d7",
      poster: [
        { id: "b379ce_db96a2a98ae1441480900573a5afcbfe~mv2.jpg", altText: "Två smala konstgjorda granar i svarta krukor" },
        { id: "b379ce_5d9a285e988f40c48e493679c8e6f6e4~mv2.jpg", altText: "Granarna på var sin sida om en öppen spis med julstrumpor" },
        { id: "b379ce_5442c374298f488492e08b93c0730c9a~mv2.jpg", altText: "En familj i ett vardagsrum med granarna vid fönstret" },
        { id: "b379ce_f97290dc10274f1da7f8bcfeb27a9776~mv2.jpg", altText: "En gran bredvid en bokhylla med julklappar på golvet" },
        { id: "b379ce_f29f28d7d0c24882a897f02956ec12dc~mv2.jpg", altText: "Måttbild: granen är 120 cm hög och 35 cm i diameter" },
      ],
      raa: 622849071,
      tecken: 500
    },
    {
      kort: "b94fab48",
      pid: "b94fab48-8509-42a9-9590-fff84a19172f",
      poster: [
        { id: "b379ce_9f6b6f720d214ea2b44a13f8c720463d~mv2.jpg", altText: "Vit badrumsspegel med hyllor till höger och under" },
        { id: "b379ce_0548b91c4103413bb34d3dce3549f594~mv2.jpg", altText: "Spegeln ovanför ett handfat med flaskor och burkar på hyllorna" },
        { id: "b379ce_9e281471d23942949ef7caa5530f2411~mv2.jpg", altText: "Närbild på upphängningsbeslaget på spegelns baksida" },
        { id: "b379ce_4156c98c3a384451abf96adff049b367~mv2.jpg", altText: "Närbild på hyllorna till höger om spegeln" },
        { id: "b379ce_bf31f31948d748dbbb439cdebf17a63f~mv2.jpg", altText: "Måttbild: spegeln är 60 cm bred, 10 cm djup och 48 cm hög, med spegelglas 39,5 × 46,5 cm, och den bär 6 kg" },
      ],
      raa: 759211464,
      tecken: 553
    },
    {
      kort: "f2aa99d9",
      pid: "f2aa99d9-3c12-4c3f-ab09-ffac3d4ed5f9",
      poster: [
        { id: "b379ce_92d1db5ba8d94f04b5d58e20c195ac1b~mv2.jpg", altText: "Hängande halloweenfigur med svart kåpa, röda ögon och grönt lysande mun" },
        { id: "b379ce_8c7ff325b83e4a3d92a894e435136479~mv2.jpg", altText: "Halloweenfiguren hänger på en kyrkogård med pumpor och fladdermöss" },
        { id: "b379ce_31a6e9570f2a4b2099fb1cc386f18e56~mv2.jpg", altText: "Närbild på figurens gröna monsteransikte med vassa tänder" },
        { id: "b379ce_df656dda92b041688e2758dad55f946c~mv2.jpg", altText: "Närbild på figurens klohand" },
        { id: "b379ce_672ca3f550cd4477b7490fe264258939~mv2.jpg", altText: "Måttbild: halloweenfiguren är 70 cm bred, 18 cm djup och 183 cm hög" },
      ],
      raa: 231935998,
      tecken: 532
    },
    {
      kort: "0db7e560",
      pid: "0db7e560-2f60-416b-8bd2-84b09838f798",
      poster: [
        { id: "b379ce_e308ccf2be8542019a792c2360e8fc46~mv2.jpg", altText: "Smådjurshage med ramp, byggd av svarta gallerpaneler" },
        { id: "b379ce_ef3f9979d1ae476688fd8f5d41cb58d1~mv2.jpg", altText: "Kaniner i hagen i ett ljust rum" },
        { id: "b379ce_d8ba3645428b401aab29e3595e5c7293~mv2.jpg", altText: "Närbild på en koppling som håller ihop panelerna" },
        { id: "b379ce_b9232fc1fa374d699ea957faab8217c0~mv2.jpg", altText: "En låg hage med smådjur i ett vardagsrum med en katt bredvid" },
        { id: "b379ce_006ff5529cb24fd89776c404dd9e49c0~mv2.jpg", altText: "Måttbild: hagen är 146 × 73 × 73 cm, panelerna 35 × 35 cm och dörren 26 cm" },
      ],
      raa: 687681939,
      tecken: 509
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
