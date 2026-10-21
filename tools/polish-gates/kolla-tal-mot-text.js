async function () {
  // kolla-tal-mot-text.js (2026-10-21): jämför talen i en tillagd måttbild med sidans text. Läser bara (ExecuteWixAPI, hasMutations false).
  //
  //   INDATA = { "<wix-id (uuid)>": ["34", "240kg", "75,5", ...] }
  //     talen ur `ocr-forgranska.py --tal <bild> …` (decimalkomma; cm utan enhet, kg/l/w/kw/mm med enhet), alla bilder på sidan ihop
  //
  // Svaret per sida: `saknas` (tal i bilderna som inte står i texten), `belastning` (kg i bilderna mot kg i texten) och `meningar`
  // (meningarna i texten som har ett tal med enhet, så att du ser vad sidan faktiskt säger).
  //
  // ☠️ Ett tal som saknas i texten är ingen motsägelse. Det är oftast ett inre mått (ett fack, en skiva, ett läge) som texten inte nämner,
  // och då får bilden stå kvar. Motsägelsen är när bilden anger ANNAT tal för samma sak: en annan belastning (240 kg mot "100 kg per sits"),
  // en annan djup eller höjd på samma del (38 × 20 mot "38 cm bred, 22 cm djup och 12 cm hög"). Det avgör ögat, med `meningar` bredvid.
  // En bild som säger emot sidan tas bort med bilder-bort.yml (också länkade), aldrig med en rättad text: texten kommer ur leverantörens
  // egna uppgifter för den här artikeln, och färgsyskonets bilder kan höra till en artikel med andra mått.
  //
  // ☠️ En bild vars tal avrundats mot texten (38 mot 37,5) är inte en motsägelse, och `saknas` fångar den ändå. Läs meningen.
  // Utfall 2026-10-21 på 18 sidor och 35 givarbilder: 13 sidor utan avvikelse, 3 med fler mått än texten (bilderna stod kvar), 2 som sa emot
  // (soffans 240 kg mot 100 kg per sits, klätterväggens trappa) och togs bort.
  const INDATA = {};
  const t0 = Date.now();
  const norm = function (t) { return String(t).replace(/\./g, ","); };
  const tal = function (s) { return (s.match(/\d+(?:[.,]\d+)?/g) || []).map(norm); };
  const ut = [];
  for (const id of Object.keys(INDATA)) {
    if (Date.now() - t0 > 45000) { ut.push({ id: id.slice(0, 8), fel: "ej körd, tiden räckte inte (kör om)" }); continue; }
    if (!/^[0-9a-f-]{36}$/.test(id)) { ut.push({ id: String(id).slice(0, 8), fel: "ogiltigt id" }); continue; }
    const r = await wix.request({ method: "GET", url: "https://www.wixapis.com/stores/v3/products/" + id + "?fields=PLAIN_DESCRIPTION" });
    const p = r.data.product;
    const html = String((p && p.plainDescription) || "");
    // ☠️ En läsning som rapporterar noll måste först bevisa att fältet fanns (plainDescription saknas i standardprojektionen).
    if (html.length < 200) { ut.push({ id: id.slice(0, 8), fel: "texten saknas eller är kort (" + html.length + " tecken): kontrollen kan inte avgöra något" }); continue; }
    const text = html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
    const iText = new Set(tal(text));
    const kgIText = new Set((text.match(/\d+(?:[.,]\d+)?\s*kg/gi) || []).map(function (m) { return norm(m.replace(/\s*kg/i, "")); }));
    const bild = INDATA[id];
    const saknas = bild.filter(function (t) { return !iText.has(t.replace(/(kg|kw|mm|w|l)$/, "")); });
    const bildKg = bild.filter(function (t) { return /kg$/.test(t); }).map(function (t) { return t.replace(/kg$/, ""); });
    const kgSaknas = bildKg.filter(function (t) { return !kgIText.has(t); });
    const meningar = text.split(/(?<=[.!?])\s+/).filter(function (s) { return /\d\s*(?:kg|cm|mm|liter|l\b)/i.test(s); }).map(function (s) { return s.slice(0, 220); });
    ut.push({
      id: id.slice(0, 8),
      tecken: html.length,
      saknas: saknas,
      belastning: { bild: bildKg, text: Array.from(kgIText), saknasITexten: kgSaknas },
      meningar: meningar,
    });
  }
  // ☠️ En kontroll som inte kan fälla räknas ändå som gjord: `sidor` ska vara över noll.
  return { sidor: ut.length, ut: ut };
}
