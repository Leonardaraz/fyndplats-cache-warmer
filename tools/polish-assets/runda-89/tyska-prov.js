const fs = require("fs");
const klart = fs.readFileSync("klart.js", "utf8");
const TYSKA = eval(klart.match(/const TYSKA = (new RegExp\([\s\S]*?"i"\));/)[1]);
const SV = ["Det är vardagsväder på en öppen gata.",
            "Ett stadigt underlag och rejäl fotplatta.",
            "Kläder och läder tål väta sämre än lack.",
            "Den som bromsar sent hinner inte stanna."];
const DE = ["Ein Tretroller für die ganze Familie mit Luftbereifung und V-Bremsen",
            "Kugelgelagerter, höhenverstellbarer Lenker von 92 auf max. 100 cm",
            "Langlebige aufblasbare Gummiräder im Fußballdesign für drinnen",
            "Stahlrahmen mit rostbeständiger Pulverbeschichtung, belastbar 100 kg",
            "Duales Bremssystem für Vorderrad und Hinterrad, rutschfestes Trittbrett"];
let ok = true;
console.log("SVENSKA (far INTE falla):");
for (const t of SV) { const m = TYSKA.exec(t); if (m) ok = false;
  console.log("   " + (m ? "FALLER " + m[0] : "slapper") + "   " + t.slice(0, 46)); }
console.log("TYSKA (MASTE falla):");
for (const t of DE) { const m = TYSKA.exec(t); if (!m) ok = false;
  console.log("   " + (m ? "FALLER " + m[0] : "SLAPPER!") + "   " + t.slice(0, 46)); }
const plan = JSON.parse(fs.readFileSync("skrivplan.json", "utf8"));
let tr = 0;
for (const r of plan) {
  const s = r.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const m = s.match(TYSKA);
  if (m) { tr++; console.log("   TRAFF " + r.kort + ": " + m[0]); }
  for (const f of ["name", "title", "meta", "slug"]) {
    const mm = String(r[f]).match(TYSKA);
    if (mm) { tr++; console.log("   TRAFF " + r.kort + "/" + f + ": " + mm[0]); }
  }
}
console.log("\natta riktiga texter, traffar: " + tr);
console.log("VERDIKT: " + ((ok && tr === 0) ? "GRINDEN OK I JS" : "GRINDEN DUGER INTE"));
process.exit(ok && tr === 0 ? 0 : 1);
