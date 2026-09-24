async function () {
  // Genererad av tools/polish-gates/bygg-medieskrivning.py — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };

  const PLAN = [
    {
      kort: "81bff775",
      pid: "81bff775-020f-46de-84c1-d77fbb14654f",
      poster: [
        { id: "b379ce_0e28922ab3674938a265d083b13e953a~mv2.jpg", altText: "Svart trädgårdsbro i metall med bågformat däck och höga räcken med rullverk" },
        { id: "b379ce_65a7666956b74bbb8091d590335aa88b~mv2.jpg", altText: "Bron över en gång mellan blomkrukor framför ett uterum" },
        { id: "b379ce_0600de2e6d65457e92500dcd68863e7c~mv2.jpg", altText: "Måttbild som visar bron 135,5 × 74 cm i grundyta och 91 cm i höjd" },
      ],
      raa: 197282183,
      tecken: 340
    },
    {
      kort: "86c60239",
      pid: "86c60239-41c8-4952-9454-15e9b51398c3",
      poster: [
        { id: "b379ce_a573877008984a28b22670217f443437~mv2.jpg", altText: "Ljusgrå paviljong med dubbeltak och myggnät på alla sidor" },
        { id: "b379ce_1f80df7383594483819432fbd3e4e15a~mv2.jpg", altText: "Paviljongen över ett dukat matbord i en trädgård" },
        { id: "b379ce_ed2d9f96ba654423adbe1c25c5a3fe68~mv2.jpg", altText: "Närbild på springan mellan den övre och den nedre takduken" },
        { id: "b379ce_92425e21e8804c1083edffea4a994aa7~mv2.jpg", altText: "Närbild på knutpunkten där takets stålrör möts under duken" },
        { id: "b379ce_bc3e6cad9c32440eb40ec413a55d4704~mv2.jpg", altText: "Måttbild som visar taket 294 × 294 cm, markytan 285 × 285 cm och 195 cm fri höjd" },
      ],
      raa: 223184910,
      tecken: 545
    },
    {
      kort: "a7c39a89",
      pid: "a7c39a89-c76d-4ca9-a2e6-6b021b9814a9",
      poster: [
        { id: "b379ce_25670c6da785428b8900ef00fe0d97d1~mv2.jpg", altText: "Barbord i grå träton med hylltorn, två vinställ och två runda barpallar" },
        { id: "b379ce_39a16826dcaa43caaee69052575cc698~mv2.jpg", altText: "Bordet dukat med kaffe och en tidning i ett ljust rum" },
        { id: "b379ce_0517959a91a540daab893588b5f61ae1~mv2.jpg", altText: "Bordet längs en vägg med glas i hållarna och saker i hyllorna" },
        { id: "b379ce_a90fff9de8134c8896d61dacd540ef30~mv2.jpg", altText: "Två personer sitter på pallarna vid barbordet" },
        { id: "b379ce_65fccd58e23b471bb488718835a3c01e~mv2.jpg", altText: "Måttbild som visar bordet 121,5 × 40 × 122 cm och pallarna Ø30 × 60 cm" },
      ],
      raa: 179347842,
      tecken: 544
    },
    {
      kort: "cae81077",
      pid: "cae81077-8f5f-4363-8d61-d88854eea921",
      poster: [
        { id: "b379ce_959982611f204995b62641490bd11ee1~mv2.jpg", altText: "Två krämvita matstolar med ryggskal som böjer sig framåt och svarta ben" },
        { id: "b379ce_0aa6a53d46fa42ce91cc5ddad4173e7f~mv2.jpg", altText: "Två av stolarna vid ett matbord i trä" },
        { id: "b379ce_2de650e67fa344d7ad2be85c20c00131~mv2.jpg", altText: "Stolarna runt runda bord i ett kafé" },
        { id: "b379ce_81ebdf390c8f4d01b775ceab5646f674~mv2.jpg", altText: "En av stolarna vid ett litet sidobord på en rund matta" },
        { id: "b379ce_f912b416bee64f3590d492a375ccbd36~mv2.jpg", altText: "Måttbild som visar stolen 55 × 62 × 80 cm och sitsen 48 × 47 cm på 46 cm höjd" },
      ],
      raa: 54604874,
      tecken: 518
    },
    {
      kort: "07d1208e",
      pid: "07d1208e-dc6e-45ab-9c2a-515309167cbd",
      poster: [
        { id: "b379ce_828d833cfedd4e8abd9e24b332fe508c~mv2.jpg", altText: "Svart spinningcykel med röd sadel, LCD-display och pedaler med remmar" },
        { id: "b379ce_8468c3b1e40644a2b561d3e1747f6172~mv2.jpg", altText: "Cykeln uppställd på ett trägolv framför ett fönster" },
        { id: "b379ce_7536c85377394df1a3c4e6073c3f3192~mv2.jpg", altText: "Måttbild som visar cykeln 85 × 46 cm i grundyta, sadeln 78–93 cm och styret 104–114 cm" },
      ],
      raa: 749761879,
      tecken: 352
    },
    {
      kort: "cec4d9a9",
      pid: "cec4d9a9-7534-4beb-b245-f68d51d897a8",
      poster: [
        { id: "b379ce_16da5d4fd1564c549c2f85aeeae71088~mv2.jpg", altText: "Fotbollsspel i ljus träton med grön spelplan, röda och gula spelare och ljusgrå ben" },
        { id: "b379ce_dcca4b3468dd4466ae26e20c1dbb01f2~mv2.jpg", altText: "Två personer spelar vid bordet i ett vardagsrum" },
        { id: "b379ce_7b419e60e72c4b8e809870093d0ad68c~mv2.jpg", altText: "Två personer drar i stängerna från var sin långsida" },
        { id: "b379ce_704eaba7300242d28de4f776c3a92a8a~mv2.jpg", altText: "Spelet mitt i en match med händerna på handtagen" },
        { id: "b379ce_34cbd2181fc84fa794a4ac746f19de84~mv2.jpg", altText: "Måttbild som visar bordet 121 × 87 × 77 cm och spelplanen 105 × 58 cm" },
      ],
      raa: 123757530,
      tecken: 542
    },
    {
      kort: "fda8a9de",
      pid: "fda8a9de-b677-486a-86bf-52fc405fd1a0",
      poster: [
        { id: "b379ce_d3d64f4aa45146868308a2d110e9f6f5~mv2.jpg", altText: "Röd och svart gräsklippare med gräsbox och hopfällbart handtag" },
        { id: "b379ce_9aa6d67397bc4d949ff48007b5db476a~mv2.jpg", altText: "En person klipper gräs med maskinen framför en lada" },
        { id: "b379ce_5c20ea1f13124ad58e94ef94df107a3b~mv2.jpg", altText: "Klipparen körs över en gräsmatta i en trädgård" },
        { id: "b379ce_bab8760e87f641c58d6e7a8ba3ff6846~mv2.jpg", altText: "Närbild på handtaget och reglagen när maskinen körs" },
        { id: "b379ce_8f208e2a4b704966a025bc13cd3bee38~mv2.jpg", altText: "Måttbild som visar klipparen 131 × 46 cm i grundyta och 109 cm i höjd" },
      ],
      raa: 817074262,
      tecken: 523
    },
    {
      kort: "180f81c1",
      pid: "180f81c1-c6d9-4226-b7e7-2a2e86a8bf0c",
      poster: [
        { id: "b379ce_93c6668746db410aacad42149ca60576~mv2.jpg", altText: "Beige hängsoffa i flätad konstrotting med krämvita dynor och fyra kedjor" },
        { id: "b379ce_386b7bd4bb984eed9cff1751c0a20d0c~mv2.jpg", altText: "Två personer sitter i hängsoffan på en altan" },
        { id: "b379ce_b890e7b7ec62415cb3faacfda635e84c~mv2.jpg", altText: "Närbild på de tuftade ryggdynorna och flätningen bakom dem" },
        { id: "b379ce_e42b263e315747bbb004d673c19e1192~mv2.jpg", altText: "Närbild på sittdynan och den flätade framkanten" },
        { id: "b379ce_1a162233f22e495583725b72651a1142~mv2.jpg", altText: "Måttbild som visar soffan 115 × 66 × 44 cm och sittytan 110 × 54 cm" },
      ],
      raa: 612578828,
      tecken: 532
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
