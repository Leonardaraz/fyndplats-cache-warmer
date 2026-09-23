async function () {
  // Genererad av runda N40:s bygg-steg.py --rattelse ur <kort>.html + raa-hash.tsv — skriv den aldrig för hand.
  const SUMMA = function (s) {
    let h = 0;
    for (const c of s) h = (h * 31 + (c.codePointAt(0) & 0xFFFF)) % 1000000007;
    return h;
  };
  const PLAN = [
    {
      kort: "8ded5e38",
      pid: "8ded5e38-585e-48ed-adcc-0f46393004c1",
      html: "<p>En gunghäst i form av ett glatt lejon: kroppen är orange och manen randig i rött och orange. Barnet sitter på en sits med ryggstöd och håller i ett handtag av trä som går genom lejonets huvud. Den breda basen och de rundade kanterna gör gungandet tryggt, och gunghästen passar barn från 2 till 5 år.</p>\n\n<h2>Gungar och tränar balansen</h2>\n<p>Den mjuka gungrörelsen tränar bålstyrka, balans och koordination – lek som håller barnet i rörelse i stället för framför en skärm. Sitsen är 15 cm bred och 30 cm djup och sitter 28,5 cm över golvet.</p>\n\n<h2>Plywood som håller</h2>\n<p>Gunghästen är gjord av plywood, bär 25 kg och är byggd för att hålla genom småbarnsåren. Den mäter 59 × 27 × 44 cm.</p>\n\n<h2>Egenskaper</h2>\n<ul>\n<li><p>Lejondesign i glada färger</p></li>\n<li><p>Handtag av trä och sits med ryggstöd</p></li>\n<li><p>Bred bas och rundade kanter</p></li>\n<li><p>Sitthöjd 28,5 cm</p></li>\n<li><p>Plywood</p></li>\n<li><p>För barn 2–5 år, bär 25 kg</p></li>\n<li><p>Mått 59 × 27 × 44 cm</p></li>\n</ul>\n\n<h2>Tekniska specifikationer</h2>\n<ul>\n<li><p><span style=\"font-weight: 700\">Mått:</span> 59 × 27 × 44 cm</p></li>\n<li><p><span style=\"font-weight: 700\">Färg:</span> Orange</p></li>\n<li><p><span style=\"font-weight: 700\">Material:</span> Plywood</p></li>\n<li><p><span style=\"font-weight: 700\">Vikt:</span> 2,9 kg</p></li>\n<li><p><span style=\"font-weight: 700\">Paketmått:</span> 50 × 47 × 7,5 cm</p></li>\n</ul>\n\n<h2>Användning och skötsel</h2>\n<p>Montera gunghästen enligt anvisningen och kontrollera att alla skruvar sitter fast innan den används, och sedan med jämna mellanrum. Ställ den på ett plant golv med fritt utrymme runt medarna. Gunghästen är för barn från 2 år och bär 25 kg, och en vuxen ska alltid ha uppsikt när barnet gungar. Torka av träet med en lätt fuktad trasa och torka torrt efteråt.</p>\n\n<h2>Vanliga frågor</h2>\n<p><span style=\"font-weight: 700\">Från vilken ålder passar gunghästen?</span></p>\n<p>Från 2 år, och den rekommenderas för barn mellan 2 och 5 år.</p>\n<p><span style=\"font-weight: 700\">Hur mycket bär den?</span></p>\n<p>25 kg.</p>\n<p><span style=\"font-weight: 700\">Hur hög är sitsen?</span></p>\n<p>28,5 cm över golvet.</p>\n<p><span style=\"font-weight: 700\">Vad är den gjord av?</span></p>\n<p>Plywood.</p>\n<p><span style=\"font-weight: 700\">Ingår montering?</span></p>\n<p>Nej, gunghästen monteras själv efter leverans.</p>",
      raa: 388036989,
      tecken: 2364
    },
  ];
  // ☠️ SPÄRRARNA LIGGER I SAMMA ANROP SOM SKRIVNINGEN och avbryter HELA batchen.
  const ID = PLAN.map(function (p) { return p.kort + "|" + p.pid; }).join("\n");
  if (SUMMA(ID) !== 680015658 || ID.length !== 45) {
    return { AVBRUTET: "transkriberingsfel i id — ingenting skrivet", fick: SUMMA(ID), tecken: ID.length };
  }
  const avvik = PLAN
    .filter(function (p) { return SUMMA(p.html) !== p.raa || p.html.length !== p.tecken; })
    .map(function (p) { return { kort: p.kort, fick: SUMMA(p.html), vantat: p.raa, tecken: p.html.length, vantatTecken: p.tecken }; });
  if (avvik.length) return { AVBRUTET: "transkriberingsfel — ingenting skrivet", avvik: avvik };

  const ut = [];
  for (const p of PLAN) {
    const f = await wix.request({ method: "GET", url: "/stores/v3/products/" + p.pid });
    const rev = (f.data || f).product.revision;
    const kropp = {
      product: {
        revision: rev,
        plainDescription: p.html
      },
      fieldMask: {
        paths: ["plainDescription"]
      }
    };
    try {
      const r = await wix.request({ method: "PATCH", url: "/stores/v3/products/" + p.pid, body: kropp });
      ut.push({ kort: p.kort, ok: true, revisionFore: rev, revisionEfter: (r.data || r).product.revision });
    } catch (e) {
      ut.push({ kort: p.kort, ok: false, fel: String(e && e.message || e).slice(0, 300) });
    }
  }
  const ok = ut.filter(function (r) { return r.ok; }).length;
  return { rader: ut, SAMMANFATTNING: ok + " av " + ut.length + " skrivna" };
}
