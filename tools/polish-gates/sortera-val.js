async function () {
  // sortera-val.js (2026-11-06): lägger valen i en option i storleksordning på PUBLICERADE sidor, utan att röra något annat.
  // Kör via ExecuteWixAPI. Leonards skärmbild 2026-11-06 08:00 svensk tid: hantlarna `4bc344de` visade 2 × 4, 5, 10 och sedan 6 kg, eftersom
  // sammanslagningen (`aosom-sammanslagning`) lägger givarens val SIST i optionen. Svepet `sortera-val-svep.js` hittade 15 publicerade sidor till
  // bland 6 016 (rosenträdet, fem mattor och skrivbord, ett taktält, en pump, ett sortimentskåp, en bänk, ett katthjul, ett arbetsbord m.fl.).
  //
  //   PLANER = [ { id, axel } ]   (högst åtta sidor per körning, 60 s-taket)
  //     id    Wix-produktens fulla id
  //     axel  optionens namn (Storlek, Modell, Antal, Längd …). Utelämnas den tas den enda option som flaggas.
  //   TORR = true skriver ingenting och visar ordningen före och efter. Kör alltid torrt först och läs att varje målordning är rimlig.
  //
  // Verktyget bygger målordningen själv ur sidans färska läsning (samma regel som svepet, funktionen `analysera`), så ingen lista skrivs av
  // för hand. Är sidan redan i ordning, eller är den inte publicerad, skrivs ingenting.
  //
  // Regler som inte ska tas bort:
  //   1. ☠️ Bara publicerade sidor. En variantsInfo-PATCH PUBLICERAR ett utkast (docs/claude/05-aosom-synken/13-variantsinfo-patch-publicerar.md),
  //      så en dold sida rörs aldrig här (`visible` skickas dessutom alltid explicit tillbaka oförändrad).
  //   2. Samma recept som lank-om-bilder.js och lib/aosom/livsbild.ts: options och variantsInfo ordagrant ur produktens egen GET (valens
  //      choiceId, linkedMedia och allt annat följer med, bara ordningen i valen ändras), kostnaden (revenueDetails.cost) med tillbaka,
  //      fältmask options + variantsInfo + visible, ny läsning och nytt försök vid 404/409.
  //   3. Återläsningen jämför valens ordning, varje vals länkar, synlighet och lagerstatus, varianternas id, SKU, synlighet, pris, kostnad och
  //      lagerstatus, galleriets ordning, produktens synlighet, namn, adress och prisspann samt alla andra options. Avviker något är svaret `ok: false`.
  //   4. ☠️ VARIANTENS BILD (varukorgens bild) NOLLAS av skrivningen: Wix ger varje variant den första valets första bild (hantlarna 2026-11-06:
  //      alla fyra varianter fick 4 kg-bilden). Kör variantbild.yml (skarp, `ids` = sidornas fulla id) direkt efter, och läs variantbilderna
  //      innan sidan lämnas. Verktyget rapporterar vilka varianter som ändrades under `variantbilder`.
  //   5. Skriv aldrig om ett dolt utkast för att få ordningen rätt: sidan sorteras när den poleras och publiceras (docs/polish/varianter.md).
  //
  // Ordningsregeln (`analysera`), densamma i svepet:
  //   · bara options med minst två val som inte heter Färg, där varje val har minst ett tal, lika många tal i varje val och inga blandade enheter;
  //   · bokstavsstorlekar (XXS … 7XL) går efter storleksskalan;
  //   · en sida flaggas bara vid ett TYDLIGT fel: ett val som är mindre än ett val före det i varje mått (det domineras), inom samma grupp
  //     (texten före första siffran, så att "Metall 46 tum" och "Trä 63 tum" är två grupper);
  //   · målordningen sorterar varje grupp på måttens produkt (area/volym) och därefter måttens ordning, på de platser gruppen redan har;
  //   · ordningar som kan diskuteras (till exempel 6 × 10 m före 7 × 8 m) rörs inte.
  const PLANER = [{ id: "", axel: "" }];
  const TORR = true;
  const T0 = Date.now();

  const lika = function (a, b) { return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase(); };
  const paus = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  const NUM = /\d+(?:[.,]\d+)?/g;
  const talAv = function (s) { return (String(s).match(NUM) || []).map(function (t) { return parseFloat(t.replace(",", ".")); }); };
  const BOKSTAV = { xxs: 0, xs: 1, s: 2, m: 3, l: 4, xl: 5, xxl: 6, "2xl": 6, xxxl: 7, "3xl": 7, "4xl": 8, "5xl": 9, "6xl": 10, "7xl": 11 };
  const bokstavAv = function (s) { const k = String(s).toLowerCase().replace(/\s+/g, ""); return Object.prototype.hasOwnProperty.call(BOKSTAV, k) ? BOKSTAV[k] : null; };
  const ENH = { mm: ["l", 0.1], cm: ["l", 1], dm: ["l", 10], m: ["l", 100], ml: ["v", 0.001], cl: ["v", 0.01], dl: ["v", 0.1], l: ["v", 1], liter: ["v", 1], g: ["w", 0.001], kg: ["w", 1] };
  const enhetAv = function (s) {
    const m = String(s).toLowerCase().match(/\d\s*(mm|cm|dm|ml|cl|dl|kg|liter|m|l|g)(?![a-zåäö])/);
    return m ? ENH[m[1]] : null;
  };
  const prod = function (a) { return a.reduce(function (x, y) { return x * y; }, 1); };
  const domineras = function (b, a) { return b.every(function (x, k) { return x <= a[k]; }) && b.some(function (x, k) { return x < a[k]; }); };
  // { typ, inv: tydligt fel, area: diskutabel ordning, mal: namnen i målordning } eller { typ } när valen inte går att bedöma.
  const analysera = function (namnen) {
    const bok = namnen.map(bokstavAv);
    if (bok.every(function (x) { return x !== null; })) {
      const mal0 = namnen.map(function (_, i) { return i; }).sort(function (a, b) { return bok[a] - bok[b] || a - b; });
      return { typ: "bokstav", inv: mal0.some(function (v, i) { return v !== i; }), area: false, mal: mal0.map(function (i) { return namnen[i]; }) };
    }
    const tal = namnen.map(talAv);
    if (!tal.every(function (t) { return t.length > 0; })) return { typ: "ovrigt" };
    const dims = tal[0].length;
    if (!tal.every(function (t) { return t.length === dims; })) return { typ: "blandatAntalTal" };
    const enh = namnen.map(enhetAv);
    const fam = enh.filter(Boolean).map(function (e) { return e[0]; });
    if (fam.length > 0 && (fam.length !== enh.length || fam.some(function (f) { return f !== fam[0]; }))) return { typ: "blandadeEnheter" };
    const fakt = enh[0] ? enh.map(function (e) { return e[1]; }) : namnen.map(function () { return 1; });
    const nyckel = tal.map(function (t, i) { return t.map(function (x) { return x * fakt[i]; }); });
    const lead = namnen.map(function (n) { return String(n).split(/\d/)[0].trim().toLowerCase(); });
    const grupper = {};
    lead.forEach(function (l, i) { (grupper[l] = grupper[l] || []).push(i); });
    let inv = false;
    let area = false;
    const mal = namnen.map(function (_, i) { return i; });
    Object.keys(grupper).forEach(function (g) {
      const pos = grupper[g];
      for (let x = 0; x < pos.length; x++) {
        for (let y = x + 1; y < pos.length; y++) {
          const a = nyckel[pos[x]];
          const b = nyckel[pos[y]];
          if (domineras(b, a)) inv = true;
          else if (prod(b) < prod(a)) area = true;
        }
      }
      const sorterad = pos.slice().sort(function (a, b) {
        const d = prod(nyckel[a]) - prod(nyckel[b]);
        if (d !== 0) return d;
        for (let k = 0; k < dims; k++) { if (nyckel[a][k] !== nyckel[b][k]) return nyckel[a][k] - nyckel[b][k]; }
        return a - b;
      });
      pos.forEach(function (p, i) { mal[p] = sorterad[i]; });
    });
    return { typ: "tal" + dims, inv: inv, area: area, mal: mal.map(function (i) { return namnen[i]; }) };
  };
  // ☠️ Varukostnaden (revenueDetails.cost) följer med tillbaka. En variantsInfo-PATCH ersätter varianten, och en läsning utan MERCHANT_DATA
  // bär ingen kostnad. `profit` och `profitMargin` räknas av Wix och är skrivskyddade, så bara kostnaden skickas.
  const utanVinst = function (vi) {
    const ut = JSON.parse(JSON.stringify(vi));
    (ut.variants || []).forEach(function (v) {
      const kost = v.revenueDetails && v.revenueDetails.cost;
      if (kost && typeof kost === "object") v.revenueDetails = { cost: kost }; else delete v.revenueDetails;
    });
    return ut;
  };

  const sorteraEn = async function (PLAN) {
    const URL = "https://www.wixapis.com/stores/v3/products/" + PLAN.id;
    const FALT = "?fields=MEDIA_ITEMS_INFO&fields=VARIANT_OPTION_CHOICE_NAMES&fields=MERCHANT_DATA";
    const id8 = String(PLAN.id).slice(0, 8);
    const las = async function () { return (await wix.request({ method: "GET", url: URL + FALT })).data.product; };
    const fel = function (steg, text) { return { ok: false, steg: steg, id: id8, fel: text }; };
    const valIOption = function (o) { return (o && o.choicesSettings && o.choicesSettings.choices) || []; };
    const lankar = function (c) { return (c.linkedMedia || []).map(function (m) { return m.id; }).join("+"); };
    const andraOptions = function (p, axel) {
      return (p.options || []).filter(function (o) { return !lika(o.name, axel); }).map(function (o) {
        return o.id + ":" + o.name + ":" + valIOption(o).map(function (c) { return c.choiceId + "=" + c.name + "=" + lankar(c) + "=" + c.visible; }).join("/");
      }).join(";");
    };
    const varianter = function (p) {
      return ((p.variantsInfo && p.variantsInfo.variants) || []).map(function (v) {
        return [v.id, v.sku, v.visible, v.price && v.price.actualPrice && v.price.actualPrice.amount, v.revenueDetails && v.revenueDetails.cost && v.revenueDetails.cost.amount, v.inventoryStatus && v.inventoryStatus.inStock].join("|");
      }).sort().join(";");
    };
    const variantbilder = function (p) {
      const m = {};
      ((p.variantsInfo && p.variantsInfo.variants) || []).forEach(function (v) { m[v.id] = (v.media && v.media.id) || ""; });
      return m;
    };
    const galleri = function (p) { return ((p.media && p.media.itemsInfo && p.media.itemsInfo.items) || []).map(function (i) { return i.id; }).join(","); };
    const spann = function (p) { return JSON.stringify([p.actualPriceRange, p.costRange, p.inventory && p.inventory.availabilityStatus]); };

    if (!/^[0-9a-f-]{36}$/.test(PLAN.id)) return fel("plan", "ogiltigt id");
    // 1. Bygg planen ur den färska läsningen.
    const p0 = await las();
    if (p0.visible !== true) return fel("plan", "sidan är inte publicerad: dolda utkast rörs aldrig här");
    const flaggade = [];
    (p0.options || []).forEach(function (o) {
      const val = valIOption(o);
      if (val.length < 2 || /^f[aä]rg$/i.test(String(o.name).trim())) return;
      if (PLAN.axel && !lika(o.name, PLAN.axel)) return;
      const namn = val.map(function (c) { return c.name; });
      if (new Set(namn).size !== namn.length) return;
      const a = analysera(namn);
      if (a.inv) flaggade.push({ axel: o.name, nu: namn, mal: a.mal });
    });
    if (flaggade.length === 0) return { ok: true, id: id8, redanRatt: true };
    if (flaggade.length > 1) return fel("plan", "flera options flaggas, ange axel: " + flaggade.map(function (f) { return f.axel; }).join(", "));
    const F = flaggade[0];
    if (TORR) return { ok: true, torr: true, id: id8, slug: p0.slug, axel: F.axel, fore: F.nu, efter: F.mal };

    // 2. Skriv: options och variantsInfo ordagrant ur GET:en, bara valens ordning ändras. Försöker om vid 404/409 med en färsk läsning.
    const namnAv = function (p) { return valIOption((p.options || []).find(function (x) { return lika(x.name, F.axel); })).map(function (c) { return c.name; }); };
    const byggOptions = function (p) {
      const nya = JSON.parse(JSON.stringify(p.options));
      const ax = nya.find(function (o) { return lika(o.name, F.axel); });
      const perNamn = {};
      ax.choicesSettings.choices.forEach(function (c) { perNamn[c.name] = c; });
      ax.choicesSettings.choices = F.mal.map(function (n) { return perNamn[n]; });
      return nya;
    };
    let skriven = false;
    let sistaFel = "";
    let pn = p0;
    for (let f = 0; f < 8 && !skriven; f++) {
      try {
        await wix.request({
          method: "PATCH",
          url: URL,
          body: { product: { revision: pn.revision, visible: pn.visible, options: byggOptions(pn), variantsInfo: utanVinst(pn.variantsInfo) }, fieldMask: { paths: ["options", "variantsInfo", "visible"] } },
        });
        skriven = true;
      } catch (e) {
        sistaFel = String(e && e.message ? e.message : e).slice(0, 160);
        await paus(3000);
        pn = await las();
        if (pn.visible !== true) return fel("skriv", "sidan blev dold under skrivningen: " + sistaFel);
        const nu = namnAv(pn).join("|");
        if (nu === F.mal.join("|")) { skriven = true; break; }
        if (nu !== F.nu.join("|")) return fel("skriv", "valens ordning ändrades av något annat under skrivningen, ingenting skrevs över: " + sistaFel);
      }
    }
    if (!skriven) return fel("skriv", "ordningen skrevs inte: " + sistaFel);

    // 3. Återläsning av ordningen och av allt som inte ska ändras.
    let p2 = null;
    for (let f = 0; f < 4; f++) {
      await paus(3000);
      p2 = await las();
      if (namnAv(p2).join("|") === F.mal.join("|")) break;
    }
    const avvik = [];
    if (namnAv(p2).join("|") !== F.mal.join("|")) avvik.push("ordningen blev " + namnAv(p2).join(" ; "));
    const valSumma = function (p) {
      const m = {};
      valIOption((p.options || []).find(function (x) { return lika(x.name, F.axel); })).forEach(function (c) { m[c.choiceId] = [c.name, lankar(c), c.visible, c.inStock].join("|"); });
      return m;
    };
    const v0 = valSumma(p0);
    const v2 = valSumma(p2);
    if (JSON.stringify(Object.keys(v0).sort()) !== JSON.stringify(Object.keys(v2).sort())) avvik.push("valens id");
    Object.keys(v0).forEach(function (k) { if (v0[k] !== v2[k]) avvik.push("val " + String(v0[k]).split("|")[0] + " (namn, länkar, synlighet eller lager)"); });
    if (andraOptions(p0, F.axel) !== andraOptions(p2, F.axel)) avvik.push("en annan option");
    if (varianter(p0) !== varianter(p2)) avvik.push("varianternas id, SKU, synlighet, pris, kostnad eller lagerstatus");
    if (galleri(p0) !== galleri(p2)) avvik.push("galleriets ordning");
    if (p0.visible !== p2.visible) avvik.push("synligheten");
    if (p0.slug !== p2.slug || p0.name !== p2.name) avvik.push("namn eller adress");
    if (spann(p0) !== spann(p2)) avvik.push("prisspann, kostnadsspann eller lagerstatus på produkten");
    const vb0 = variantbilder(p0);
    const vb2 = variantbilder(p2);
    const ändrade = Object.keys(vb0).filter(function (k) { return vb0[k] !== vb2[k]; }).map(function (k) { return k.slice(0, 8) + ":" + (vb0[k] || "–").slice(7, 15) + "→" + (vb2[k] || "–").slice(7, 15); });
    return {
      ok: avvik.length === 0,
      id: id8,
      slug: p2.slug,
      axel: F.axel,
      avvikelser: avvik,
      revision: p0.revision + " → " + p2.revision,
      efter: namnAv(p2),
      variantbilder: ändrade,
    };
  };

  const ut = [];
  for (let i = 0; i < PLANER.length; i += 8) {
    if (Date.now() - T0 > 30000) { PLANER.slice(i).forEach(function (P) { ut.push({ ok: false, steg: "tid", id: String(P.id).slice(0, 8), fel: "ej körd, tiden räckte inte (kör om)" }); }); break; }
    const grupp = PLANER.slice(i, i + 8);
    const svar = await Promise.all(grupp.map(function (P) {
      return sorteraEn(P).catch(function (e) { return { ok: false, steg: "undantag", id: String(P.id).slice(0, 8), fel: String(e && e.message ? e.message : e).slice(0, 200) }; });
    }));
    svar.forEach(function (s) { ut.push(s); });
  }
  return ut;
}
