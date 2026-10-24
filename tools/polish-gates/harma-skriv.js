async function () {
  // harma-skriv.js (2026-10-24, Härma Aosom): lägger uppladdade, redan md5-parade filer sist i galleriet på en publicerad sida med två val (färg och
  // storlek) och kopplar var och en till exakt de val den hör till, i samma körning. Kör via ExecuteWixAPI, byggt av bygg-harma.py ur en plan.
  //
  //   PLANER = [ { id, filer: [ { h, alt, a } ] } ]   (högst fem sidor per körning: skriptet hoppar över resten efter 36 s, 60 s-taket)
  //     h    de 32 hextecknen i Wix fil-id (b379ce_<h>~mv2.jpg)
  //     alt  svensk alt-text (20–250 tecken, ingen adress och inget leverantörs- eller husmärke)
  //     a    ägarna: namnen på de val bilden hör till, i vilken option som helst (namnet ska vara unikt bland alla val på sidan). Flera val i SAMMA
  //          option betyder "något av dem", val i FLERA optioner betyder "alla optioner måste passa" (butikens regel sedan 2026-10-24, PR #770).
  //
  // Samma steg och samma anrop som galleri-tillagg.js (galleriet) och lank-om-bilder.js (länkarna), i den ordningen:
  //   1. Planen mot en färsk läsning: filerna READY hos Media Manager (get-files, en fråga), inte redan i galleriet, högst 50 bilder, ägarna ger en
  //      träff var. Kontrollsumman av den inbäddade planen räknas om här, så en plan som skrivits av för hand avvisas.
  //   2. Galleriet: de nya filerna sist, i planens ordning, med alt-text. Galleriets gamla bilder står kvar i samma ordning med samma alt-text.
  //   3. Länkarna: options och variantsInfo ordagrant ur en färsk läsning (med MERCHANT_DATA, så kostnaden följer med tillbaka), varje vals nya lista är
  //      dess gamla lista med de nya filerna sist. Ingen gammal länk tas bort och ingen gammal ordning ändras. Bara de val vars lista ändras skrivs om.
  //   4. Återläsning: galleri, alt-texter, varje vals lista, optionernas ordning, varianternas id, SKU, pris, kostnad, synlighet och val, lagret,
  //      produktens namn, adress och synlighet.
  // ☠️ En id-skrivning av optionerna NOLLSTÄLLER variantens bild (varukorg, kassa, order) till huvudbilden. Kör variantbild.yml (dryRun=false, ids)
  //    efter varje körning.
  // ☠️ Butikens första bild för en kombination är den första bilden i färgens lista som passar och är kopplad i FLEST optioner (lib/variant-price.ts).
  //    En ny bild kopplad i två optioner kan därför ta förstaplatsen från en gammal bild kopplad i en. Svaret säger per kombination om första bilden
  //    ändras (`forsta`), och torrkörningen ska läsas innan något skrivs.
  // ☠️ Wix tar högst 15 länkade bilder per val (mätt 2026-10-24: 15 gick, 16–21 gav 400 optionSettings.choicesSettings is invalid). LANKTAK räknar varje vals länkar
  //    FÖRE skrivningen och tappar det som inte ryms (tappade): det foto vars borttagning lämnar sina kombinationer bäst försörjda med nya foton, vid lika det sista
  //    i planen. Ett foto som tillhör en färg OCH en storlek räknas mot båda. Utan det föll länkningen EFTER att galleriet skrivits, och sidan stod halvskriven.
  // ☠️ En ny länk kan ändra en GAMMAL bilds vy (en kombination utan kopplad bild visar hela galleriet; en olänkad bilds alt-text kan göra den till en färgs bild).
  //    simulera() bygger butikens regel (imageKopplingar), gamla bilder vars vy skulle ändras pinnas (länkas uttryckligen till sina nuvarande val, förstabilderna
  //    först), och skriptet avbryter före skrivningen om en gammal bilds vy (`vy`) eller en kombinations första bild (`forsta`) ändå skulle ändras, eller om
  //    pinningen ensam ger fler än 15 länkar (`tak`).
  // Omkörning: ligger planens filer redan sist i galleriet (en halvskriven sida) känns de igen (`atertag`) och bara länkarna skrivs. En sida som redan är klar
  //    svarar `ingenAndring`.
  // `TORR` true skriver ingenting. "fake" hoppar dessutom över kontrollen av filerna hos Wix.
  const PLANER = null;
  const SUM = "";
  const TORR = false;
  const T0 = Date.now();

  function fnv(s) {
    const b = new TextEncoder().encode(s);
    let h = 0xcbf29ce484222325n;
    const M = 0xFFFFFFFFFFFFFFFFn;
    for (const c of b) {
      h ^= BigInt(c);
      h = (h * 0x100000001b3n) & M;
    }
    return h.toString(16).padStart(16, "0");
  }
  if (!PLANER) return [{ ok: false, steg: "plan", fel: "ingen plan inbäddad (bygg skriptet med bygg-harma.py)" }];
  if (fnv(JSON.stringify(PLANER)) !== SUM) return [{ ok: false, steg: "plan", fel: "inbäddad plan skiljer från facit (avskriftsfel)" }];

  const paus = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  const nz = function (s) { return String(s || "").toLowerCase().replace(/×/g, "x").replace(/\s*x\s*/g, "x").replace(/,/g, ".").replace(/\s+/g, " ").trim(); };
  const hex = function (id) { return String(id || "").slice(7, 13); };
  const FORBJUDET = /https?:|www\.|\.(?:com|se|de)\b|homcom|outsunny|pawhut|aiyaplay|vinsetto|kleankin|zonekiz|sportnow|durhand|aosom|aliexpress|alibaba|vevor|succebuy|giantex|costway|fyndplats|leverant/i;
  const U = "https://www.wixapis.com/stores/v3/products/";
  const FALT = "?fields=MEDIA_ITEMS_INFO&fields=VARIANT_OPTION_CHOICE_NAMES&fields=MERCHANT_DATA";
  const items = function (p) { return ((p.media && p.media.itemsInfo && p.media.itemsInfo.items) || []).map(function (i) { return { id: i.id, altText: i.altText || "" }; }); };
  const valAv = function (o) { return (o && o.choicesSettings && o.choicesSettings.choices) || []; };
  const lankar = function (c) { return (c.linkedMedia || []).map(function (m) { return m.id; }); };
  const varianter = function (p) { return (p.variantsInfo && p.variantsInfo.variants) || []; };
  const status = function (e) { const m = /\((\d{3})\)/.exec(String(e && e.message ? e.message : e)); return m ? Number(m[1]) : 0; };
  const meddelande = function (e) { return String(e && e.message ? e.message : e).replace(/request id:[^)]*/g, "").slice(0, 500); };
  const varNyckel = function (v) {
    const namn = (v.choices || []).map(function (c) { const n = c.optionChoiceNames || {}; return n.optionName + "=" + n.choiceName; }).sort().join("|");
    return [v.id, v.sku, v.visible, v.price && v.price.actualPrice && v.price.actualPrice.amount, v.price && v.price.compareAtPrice && v.price.compareAtPrice.amount,
      v.revenueDetails && v.revenueDetails.cost && v.revenueDetails.cost.amount, namn].join(";");
  };
  const allaLankar = function (p) { return (p.options || []).map(function (o) { return o.name + ":" + valAv(o).map(function (c) { return c.choiceId + "=" + lankar(c).join("+"); }).join("/"); }).join(";"); };
  const lagerAv = async function (id) {
    const r = await wix.request({ method: "POST", url: "https://www.wixapis.com/stores/v3/inventory-items/query", body: { query: { filter: { productId: { $in: [id] } }, cursorPaging: { limit: 100 } } } });
    return (r.data.inventoryItems || []).map(function (x) { return x.variantId + ":" + x.quantity + ":" + x.availabilityStatus; }).sort().join(";");
  };
  // Butikens vy och första bild per kombination (samma regler som bygg-agare.py: lib/variant-bilder.ts synligaBilderForKombination och lib/variant-price.ts),
  // ur valens listor och galleriets alt-texter (en olänkad bild som alt-texten knyter till exakt en färg räknas som länkad till den, som butiken gör).
  // `forsta` är den bild butiken faktiskt visar först: färgens bästa bild om den syns i kombinationen, annars kombinationens första synliga bild.
  const FORE = "(?<![\\p{L}\\p{N}])";
  const EFTER = "(?![\\p{L}\\p{N}])";
  const BAKGRUND = /(?<![\p{L}])(?:vit|vita|vitt|grå|gråa|grått|svart|svarta|ljus|ljusa|ljusgrå|beige)\s+(?:bakgrund|bakgrunden|studiobakgrund|yta|ytan)(?![\p{L}])/giu;
  const escR = function (s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); };
  const fargFormer = function (e) {
    const w = String(e || "").trim().toLowerCase();
    if (!/^\p{L}{3,}$/u.test(w)) return null;
    const f = new Set([w, w + "a", w + "t", w + "tt"]);
    if (w.endsWith("d")) f.add(w.slice(0, -1) + "tt");
    if (w.endsWith("t")) f.add(w + "t");
    return Array.from(f);
  };
  const namndaAlt = function (alt, etiketter) {
    const text = String(alt || "").replace(BAKGRUND, " ");
    return etiketter.filter(function (e) { const f = fargFormer(e); return !!f && new RegExp(FORE + "(?:" + f.map(escR).join("|") + ")" + EFTER, "iu").test(text); });
  };
  const arKort = function (alt) {
    return /^\s*(?:fyndplats|mått|specifikation)/i.test(alt) || /(?:spec(?:ifikations)?|mått|färg|fakta|storleks)kort/i.test(alt) || /mått(?:bild|ritning|skiss|skisser|uppgifter)/i.test(alt);
  };
  const simulera = function (p, gal, lm, alts) {
    const opts = p.options || [];
    const kopplad = {};
    const forstaAgare = {};
    opts.forEach(function (o, oi) {
      valAv(o).forEach(function (c) {
        (lm[c.choiceId] || []).forEach(function (f) {
          if (!kopplad[f]) kopplad[f] = {};
          if (!kopplad[f][oi]) kopplad[f][oi] = [];
          kopplad[f][oi].push(c.choiceId);
          if (!(f in forstaAgare)) forstaAgare[f] = c.name;
        });
      });
    });
    const fOi = opts.findIndex(function (o) { return /färg|color|kulör/i.test(o.name); });
    const etiketter = fOi >= 0 ? valAv(opts[fOi]).map(function (c) { return c.name; }).filter(function (n) { return fargFormer(n); }) : [];
    const altAgare = {};
    if (etiketter.length >= 2) {
      const agare = Object.assign({}, forstaAgare);
      gal.forEach(function (f) {
        if (f in agare) return;
        const t = namndaAlt(alts[f], etiketter);
        if (t.length === 1) { agare[f] = t[0]; altAgare[f] = t[0]; }
      });
      const huvudFarg = gal.length ? agare[gal[0]] : undefined;
      if (huvudFarg && etiketter.indexOf(huvudFarg) >= 0) {
        const antal = {};
        Object.keys(agare).forEach(function (f) { antal[agare[f]] = (antal[agare[f]] || 0) + 1; });
        if (etiketter.some(function (e) { return e !== huvudFarg && antal[e] === 1; })) {
          gal.forEach(function (f) {
            if (f in agare) return;
            if (arKort(alts[f] || "") || namndaAlt(alts[f], etiketter).length > 1) return;
            agare[f] = huvudFarg;
            altAgare[f] = huvudFarg;
          });
        }
      }
    }
    const idAvNamn = {};
    opts.forEach(function (o) { valAv(o).forEach(function (c) { idAvNamn[c.name] = c.choiceId; }); });
    const grupper = function (f) {
      if (kopplad[f]) return kopplad[f];
      if (altAgare[f] && fOi >= 0) { const g = {}; g[fOi] = [idAvNamn[altAgare[f]]]; return g; }
      return null;
    };
    const ut = {};
    varianter(p).forEach(function (v) {
      if (v.visible === false) return;
      const valId = {};
      const ordning = [];
      (v.choices || []).forEach(function (ch) {
        const ids = ch.optionChoiceIds || {};
        const oi = opts.findIndex(function (o) { return o.id === ids.optionId; });
        if (oi >= 0) { valId[oi] = ids.choiceId; ordning.push(oi); }
      });
      const passar = function (f) { const g = grupper(f); if (!g) return true; return Object.keys(g).every(function (oi) { return g[oi].indexOf(valId[oi]) >= 0; }); };
      const egna = gal.some(function (f) { return !!grupper(f) && passar(f); });
      const vy = egna ? gal.filter(passar) : gal.slice();
      const lista = function (oi) { return lm[valId[oi]] || []; };
      const fargOi = ordning.filter(function (oi) { return oi === fOi; });
      const ovr = ordning.filter(function (oi) { return oi !== fOi; });
      let forsta = null;
      for (const oi of fargOi) { if (lista(oi).length) { forsta = lista(oi)[0]; break; } }
      if (!forsta) for (const oi of ordning) { if (lista(oi).length) { forsta = lista(oi)[0]; break; } }
      let basta = 0;
      fargOi.concat(ovr).forEach(function (oi) {
        lista(oi).forEach(function (f) {
          const antal = Object.keys(kopplad[f] || {}).length;
          if (antal > basta && passar(f)) { basta = antal; forsta = f; }
        });
      });
      const eff = forsta && vy.indexOf(forsta) >= 0 ? forsta : (vy[0] || null);
      const namn = ordning.map(function (oi) { return (valAv(opts[oi]).find(function (c) { return c.choiceId === valId[oi]; }) || {}).name; }).join(" × ");
      ut[namn] = { antal: vy.length, forsta: hex(eff), id: eff, ids: vy.slice(), val: valId };
    });
    Object.defineProperty(ut, "grupper", { value: grupper, enumerable: false });
    return ut;
  };

  // ☠️ Wix tar högst 15 länkade bilder per val (mätt 2026-10-24: 15 gick igenom, 16 till 21 gav 400 på options[].choicesSettings). Skriptet räknar valens nya listor
  // FÖRE första skrivningen och tar bort planens sista filer ur de val som skulle bli för långa (`tappade` i svaret), så att ingen sida hamnar halvskriven.
  const LANKTAK = 15;

  const skriv = async function (PLAN) {
    const id = PLAN.id;
    const id8 = String(id).slice(0, 8);
    const fel = function (steg, text, extra) { return Object.assign({ ok: false, steg: steg, id: id8, fel: text }, extra || {}); };
    const URL = U + id;
    const las = async function () { return (await wix.request({ method: "GET", url: URL + FALT })).data.product; };
    if (!/^[0-9a-f-]{36}$/.test(id)) return fel("plan", "ogiltigt id");
    if (!Array.isArray(PLAN.filer) || PLAN.filer.length === 0) return fel("plan", "inga filer i planen");

    // 1. Planen mot en färsk läsning.
    const p0 = await las();
    const itNu = items(p0);
    const galNu = itNu.map(function (i) { return i.id; });
    const alla = [];
    (p0.options || []).forEach(function (o, oi) { valAv(o).forEach(function (c) { alla.push({ oi: oi, c: c, n: nz(c.name) }); }); });
    const planIdn = PLAN.filer.map(function (f) { return "b379ce_" + f.h + "~mv2.jpg"; });
    // Återupptagning: en körning som föll efter galleriet men före länkarna lämnar planens filer sist i galleriet, olänkade. Galleriet "före" räknas då utan dem.
    const redan = planIdn.filter(function (f) { return galNu.indexOf(f) >= 0; });
    let it0 = itNu;
    if (redan.length > 0) {
      const utan = itNu.filter(function (i) { return redan.indexOf(i.id) < 0; });
      const svans = itNu.slice(utan.length).map(function (i) { return i.id; });
      if (svans.join(",") !== planIdn.filter(function (f) { return redan.indexOf(f) >= 0; }).join(",")) return fel("plan", "planens filer ligger redan i galleriet men inte sist i planens ordning");
      it0 = utan;
    }
    const gal0 = it0.map(function (i) { return i.id; });
    const nyaAlla = [];
    const agare = {};
    for (const f of PLAN.filer) {
      if (!/^[0-9a-f]{32}$/.test(String(f.h))) return fel("plan", "ogiltigt fil-id: " + String(f.h).slice(0, 8));
      const fil = "b379ce_" + f.h + "~mv2.jpg";
      if (nyaAlla.some(function (n) { return n.id === fil; })) return fel("plan", "filen står två gånger i planen: " + hex(fil));
      if (alla.some(function (x) { return lankar(x.c).indexOf(fil) >= 0; })) return fel("plan", "filen är redan länkad till ett val: " + hex(fil));
      const alt = String(f.alt || "").trim();
      if (alt.length < 20 || alt.length > 250 || FORBJUDET.test(alt)) return fel("plan", "alt-texten duger inte för " + hex(fil));
      if (!Array.isArray(f.a) || f.a.length === 0) return fel("plan", "filen har ingen ägare: " + hex(fil));
      const grp = {};
      for (const n of f.a) {
        const tr = alla.filter(function (x) { return x.n === nz(n); });
        if (tr.length !== 1) return fel("plan", "valet \"" + n + "\" ger " + tr.length + " träffar på sidan", { val: alla.map(function (x) { return x.c.name; }) });
        if (!grp[tr[0].oi]) grp[tr[0].oi] = [];
        if (grp[tr[0].oi].indexOf(tr[0].c.choiceId) < 0) grp[tr[0].oi].push(tr[0].c.choiceId);
      }
      agare[fil] = grp;
      nyaAlla.push({ id: fil, altText: alt });
    }
    if (TORR !== "fake") {
      const fr = await wix.request({ method: "POST", url: "https://www.wixapis.com/site-media/v1/files/get-files", body: { fileIds: nyaAlla.map(function (n) { return n.id; }) } });
      const klar = {};
      ((fr.data && fr.data.files) || []).forEach(function (x) { klar[x.id] = x.operationStatus; });
      for (const n of nyaAlla) if (klar[n.id] !== "READY") return fel("plan", "filen är inte klar hos Wix (" + klar[n.id] + "): " + hex(n.id));
    }
    const gamla = {};
    alla.forEach(function (x) { gamla[x.c.choiceId] = lankar(x.c); });
    const alts0 = {};
    it0.forEach(function (i) { alts0[i.id] = i.altText; });
    const gamlaIdn = {};
    gal0.forEach(function (i) { gamlaIdn[i] = true; });
    const simFore = simulera(p0, gal0, gamla, alts0);

    // Räknar galleriet, valens nya listor och vyn för en given uppsättning nya filer. ☠️ En ny bild kopplad i två optioner tar förstaplatsen från en gammal bild kopplad
    // i en (butiken räknar antalet optioner först), och butikens regel för olänkade bilder räknar om sig när en färg får fler bilder (en gammal olänkad bild kan då dyka
    // upp i eller försvinna ur en vy). Varje sådan gammal bild PINNAS: den får en länk i varje option, till de val den redan syns för (dess grupp i butikens regel, till
    // exempel färgen en alt-text knyter den till) eller till alla val om den inte begränsas där. Den syns då lika mycket som förut men räknas i lika många optioner, och
    // vid lika många vinner den som står först i listan. Tillägget läggs sist i valens gamla listor och före de nya filerna.
    const berakna = function (kept) {
      const galNy = it0.concat(kept);
      const galIdnNy = galNy.map(function (i) { return i.id; });
      const altsNy = Object.assign({}, alts0);
      kept.forEach(function (n) { altsNy[n.id] = n.altText; });
      const bygg = function (boost) {
        const lm = {};
        alla.forEach(function (x) { lm[x.c.choiceId] = gamla[x.c.choiceId].slice(); });
        boost.slice().sort(function (p1, p2) { return p1.prio - p2.prio; }).forEach(function (b) { b.till.forEach(function (cid) { if (lm[cid].indexOf(b.x) < 0) lm[cid].push(b.x); }); });
        for (const n of kept) {
          const grp = agare[n.id];
          Object.keys(grp).forEach(function (oi) { grp[oi].forEach(function (cid) { if (lm[cid].indexOf(n.id) < 0) lm[cid].push(n.id); }); });
        }
        return lm;
      };
      const R = { kept: kept, galNy: galNy, galIdnNy: galIdnNy, altsNy: altsNy, boost: [] };
      R.ny = bygg(R.boost);
      R.sim = simulera(p0, galIdnNy, R.ny, altsNy);
      R.andrade = function () { return Object.keys(R.sim).filter(function (k) { return !simFore[k] || simFore[k].id !== R.sim[k].id; }); };
      R.vyAvvik = function () {
        const ut = [];
        Object.keys(R.sim).forEach(function (k) {
          const f0 = simFore[k];
          if (!f0) return;
          const efter = R.sim[k].ids.filter(function (i) { return gamlaIdn[i]; });
          const tappar = f0.ids.filter(function (i) { return efter.indexOf(i) < 0; });
          const far = efter.filter(function (i) { return f0.ids.indexOf(i) < 0; });
          if (tappar.length || far.length) ut.push({ k: k, tappar: tappar, far: far });
        });
        return ut;
      };
      for (let varv = 0; varv < 4; varv++) {
        // Förstabilderna pinnas först (prio 0) och ligger därför före de bilder som bara pinnas för att deras vy ska stå still (prio 1).
        const pinna = [];
        R.andrade().forEach(function (k) { const x = simFore[k] && simFore[k].id ? simFore[k].id : gal0[0]; if (x && !pinna.some(function (q) { return q.x === x; })) pinna.push({ x: x, prio: 0 }); });
        R.vyAvvik().forEach(function (a) { a.tappar.concat(a.far).forEach(function (x) { if (!pinna.some(function (q) { return q.x === x; })) pinna.push({ x: x, prio: 1 }); }); });
        let nytt = false;
        for (const q of pinna) {
          const x = q.x;
          if (R.boost.some(function (b) { return b.x === x; })) continue;
          const g = simFore.grupper(x);
          const till = [];
          (p0.options || []).forEach(function (o, oi) {
            if (valAv(o).some(function (c) { return R.ny[c.choiceId].indexOf(x) >= 0; })) return;
            (g && g[oi] ? g[oi] : valAv(o).map(function (c) { return c.choiceId; })).forEach(function (cid) { till.push(cid); });
          });
          if (till.length > 0) { R.boost.push({ x: x, till: till, prio: q.prio }); nytt = true; }
        }
        if (!nytt) break;
        R.ny = bygg(R.boost);
        R.sim = simulera(p0, galIdnNy, R.ny, altsNy);
      }
      return R;
    };
    // Tak: planens sista fil som ligger i ett för långt val tas bort, tills inget val har fler än LANKTAK länkade bilder.
    let kept = nyaAlla.slice();
    const tappade = [];
    let R = berakna(kept);
    for (;;) {
      const over = alla.filter(function (x) { return R.ny[x.c.choiceId].length > LANKTAK; });
      if (over.length === 0) break;
      // Den fil som lättar ett överfullt val och vars bortfall lämnar de kombinationer den syns i bäst försedda av planens egna bilder (så att tappen sprids jämnt över
      // storlekar och färger i stället för att tömma den kombination som har minst); vid lika väljs den sista i planens ordning.
      let val = -1;
      let valPoang = -1;
      kept.forEach(function (n, i) {
        const grp = agare[n.id];
        if (!over.some(function (x) { return grp[x.oi] && grp[x.oi].indexOf(x.c.choiceId) >= 0; })) return;
        let varst = 1e9;
        Object.keys(R.sim).forEach(function (k) {
          if (R.sim[k].ids.indexOf(n.id) < 0) return;
          const antalNya = kept.filter(function (m) { return R.sim[k].ids.indexOf(m.id) >= 0; }).length - 1;
          if (antalNya < varst) varst = antalNya;
        });
        if (varst >= valPoang) { valPoang = varst; val = i; }
      });
      if (val < 0) return fel("tak", "ett val skulle få fler än " + LANKTAK + " länkade bilder av de gamla bilderna och pinningen ensam (inget skrevs)", { val: over.map(function (x) { return x.c.name + ": " + R.ny[x.c.choiceId].length; }) });
      tappade.push(kept[val]);
      kept = kept.slice(0, val).concat(kept.slice(val + 1));
      R = berakna(kept);
    }
    const galNy = R.galNy;
    const galIdnNy = R.galIdnNy;
    const ny = R.ny;
    if (galNy.length > 50) return fel("plan", "galleriet skulle få " + galNy.length + " bilder, Wix tar 50");
    const komb = Object.keys(R.sim).map(function (k) {
      const a = simFore[k] || { antal: "?", forsta: "?" };
      const b = R.sim[k];
      return { k: k, antal: a.antal + "→" + b.antal, forsta: a.forsta === b.forsta ? a.forsta : a.forsta + "→" + b.forsta };
    });
    const boostText = R.boost.map(function (b) { return hex(b.x) + "+" + b.till.length + " val"; });
    const valLankar = alla.map(function (x) { return x.c.name + ": " + gamla[x.c.choiceId].length + "→" + ny[x.c.choiceId].length; });
    const tappadeText = tappade.map(function (n) { return hex(n.id); });
    // ☠️ Ingen gammal bild får försvinna ur eller dyka upp i en kombinations vy, och varje ny fil ska synas i exakt de kombinationer vars val ligger i dess ägargrupp.
    const synlighet = R.vyAvvik().map(function (a) { return a.k + ": tappar [" + a.tappar.map(hex).join(",") + "] far [" + a.far.map(hex).join(",") + "]"; });
    Object.keys(R.sim).forEach(function (k) {
      const f0 = simFore[k];
      const e1 = R.sim[k];
      if (!f0) { synlighet.push(k + ": kombinationen fanns inte före"); return; }
      kept.forEach(function (n) {
        const grp = agare[n.id];
        const forvantad = Object.keys(grp).every(function (oi) { return grp[oi].indexOf(e1.val[oi]) >= 0; });
        const syns = e1.ids.indexOf(n.id) >= 0;
        if (forvantad !== syns) synlighet.push(k + ": ny fil " + hex(n.id) + (syns ? " syns men ska inte" : " syns inte men ska"));
      });
    });
    if (synlighet.length > 0) return fel("vy", "butikens vy skulle ändras på ett sätt planen inte avser (inget skrevs)", { synlighet: synlighet.slice(0, 12), antal: synlighet.length, boost: boostText });
    if (R.andrade().length > 0) return fel("forsta", "butikens första bild skulle ändras trots tillägg av de gamla förstabilderna (inget skrevs)", { kombinationer: komb, boost: boostText });
    const behovGalleri = galNy.map(function (i) { return i.id + "\u0002" + i.altText; }).join("\u0001") !== itNu.map(function (i) { return i.id + "\u0002" + i.altText; }).join("\u0001");
    const behovLankar = alla.some(function (x) { return ny[x.c.choiceId].length !== gamla[x.c.choiceId].length; });
    if (TORR) return { ok: true, torr: true, id: id8, galleri: galNu.length + " → " + galNy.length, valLankar: valLankar, boost: boostText, tappade: tappadeText, atertag: redan.length > 0, kombinationer: komb };
    if (!behovGalleri && !behovLankar) return { ok: true, id: id8, ingenAndring: true, tappade: tappadeText };

    const lagerFore = await lagerAv(id);
    const fore = {};
    varianter(p0).forEach(function (v) { fore[v.id] = varNyckel(v); });
    const ordningFore = (p0.options || []).map(function (o) { return o.name; }).join(">");

    // 2. Galleriet: nya försök bara på 404, 409, 429 och 5xx, med omläsning före varje försök.
    const post = function (i) { return i.altText ? { id: i.id, altText: i.altText } : { id: i.id }; };
    let pn = p0;
    if (behovGalleri) {
      let sista = "";
      let skrivet = false;
      for (let f = 0; f < 5 && !skrivet; f++) {
        const p = await las();
        try {
          if (items(p).map(function (i) { return i.id; }).join(",") !== galNu.join(",")) return fel("galleri", "galleriet ändrades av något annat");
          await wix.request({ method: "PATCH", url: URL, body: { product: { revision: p.revision, media: { itemsInfo: { items: galNy.map(post) } } }, fieldMask: { paths: ["media"] } } });
          skrivet = true;
        } catch (e) {
          sista = status(e) + " " + meddelande(e);
          const s = status(e);
          if (!(s === 404 || s === 409 || s === 429 || s >= 500)) return fel("galleri", sista);
          await paus(3000);
        }
      }
      if (!skrivet) return fel("galleri", "efter fem försök: " + sista);
      pn = null;
      for (let f = 0; f < 6; f++) {
        await paus(2000);
        pn = await las();
        if (items(pn).map(function (i) { return i.id; }).join(",") === galIdnNy.join(",")) break;
        pn = null;
      }
      if (!pn) return fel("galleri", "galleriet läste inte tillbaka med de nya filerna efter skrivningen (galleriet är skrivet, länkarna inte)");
    }

    // 3. Länkarna: options och variantsInfo ordagrant ur den färska läsningen, valens nya listor, visible explicit.
    let sistaL = "";
    if (behovLankar) {
      const nyaOptions = JSON.parse(JSON.stringify(pn.options));
      nyaOptions.forEach(function (o) { valAv(o).forEach(function (c) { if (ny[c.choiceId].length !== gamla[c.choiceId].length) c.linkedMedia = ny[c.choiceId].map(function (x) { return { id: x }; }); }); });
      const vi = JSON.parse(JSON.stringify(pn.variantsInfo));
      (vi.variants || []).forEach(function (v) { if (v.revenueDetails) { delete v.revenueDetails.profit; delete v.revenueDetails.profitMargin; } });
      let lankat = false;
      let pl = pn;
      for (let f = 0; f < 8 && !lankat; f++) {
        try {
          await wix.request({ method: "PATCH", url: URL, body: { product: { revision: pl.revision, visible: pl.visible, options: nyaOptions, variantsInfo: vi }, fieldMask: { paths: ["options", "variantsInfo", "visible"] } } });
          lankat = true;
        } catch (e) {
          sistaL = status(e) + " " + meddelande(e);
          await paus(3000);
          pl = await las();
          if (allaLankar(pl) !== allaLankar(pn)) return fel("lankar", "valens länkar ändrades av något annat under skrivningen, ingenting skrevs över: " + sistaL);
          const s = status(e);
          if (!(s === 404 || s === 409 || s === 429 || s >= 500)) return fel("lankar", sistaL, { galleriSkrivet: behovGalleri });
        }
      }
      if (!lankat) return fel("lankar", "länkarna skrevs inte: " + sistaL, { galleriSkrivet: behovGalleri });
    }

    // 4. Återläsning.
    const vantatAlt = galNy.map(function (i) { return i.altText; }).join("\u0001");
    const vantatLankar = (pn.options || []).map(function (o) { return o.name + ":" + valAv(o).map(function (c) { return c.choiceId + "=" + (ny[c.choiceId] || []).join("+"); }).join("/"); }).join(";");
    const avvik = [];
    let p2 = null;
    for (let f = 0; f < 5; f++) {
      await paus(2500);
      p2 = await las();
      avvik.length = 0;
      if (items(p2).map(function (i) { return i.id; }).join(",") !== galIdnNy.join(",")) avvik.push("galleriets innehåll eller ordning");
      else if (items(p2).map(function (i) { return i.altText; }).join("\u0001") !== vantatAlt) avvik.push("alt-texterna");
      if (allaLankar(p2) !== vantatLankar) avvik.push("valens länkar");
      if (avvik.length === 0) break;
    }
    if ((p2.options || []).map(function (o) { return o.name; }).join(">") !== ordningFore) avvik.push("optionernas ordning");
    const efterV = varianter(p2);
    if (efterV.length !== varianter(p0).length) avvik.push("antalet varianter");
    efterV.forEach(function (v) { if (fore[v.id] !== varNyckel(v)) avvik.push("variant " + String(v.id).slice(0, 8) + ": id, SKU, pris, kostnad, synlighet eller val"); });
    if (p0.name !== p2.name || p0.slug !== p2.slug) avvik.push("namn eller adress");
    if (p0.visible !== p2.visible) avvik.push("synligheten");
    if ((await lagerAv(id)) !== lagerFore) avvik.push("lagret");
    const huvud = (p2.media && p2.media.main && p2.media.main.id) || (items(p2)[0] || {}).id;
    return {
      ok: avvik.length === 0,
      id: id8,
      avvikelser: avvik,
      revision: p0.revision + " → " + p2.revision,
      galleri: galNu.length + " → " + items(p2).length,
      valLankar: valLankar,
      tappade: tappadeText,
      atertag: redan.length > 0,
      kombinationer: komb,
      variantbilderNollade: efterV.filter(function (v) { return !v.media || !v.media.image || v.media.image.id === huvud; }).length + " av " + efterV.length,
      sek: Math.round((Date.now() - T0) / 100) / 10,
    };
  };

  const ut = [];
  for (const PLAN of PLANER) {
    if (Date.now() - T0 > 36000) { ut.push({ ok: false, steg: "tid", id: String(PLAN.id).slice(0, 8), fel: "ej körd, tiden räckte inte (kör om)" }); continue; }
    try { ut.push(await skriv(PLAN)); } catch (e) { ut.push({ ok: false, steg: "undantag", id: String(PLAN.id).slice(0, 8), fel: meddelande(e) }); }
  }
  return ut;
}
