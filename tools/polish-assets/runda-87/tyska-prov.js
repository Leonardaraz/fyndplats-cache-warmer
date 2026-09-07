const fs = require("fs");
const klart = fs.readFileSync("klart.js", "utf8");
const rad = klart.match(/const TYSKA = (new RegExp\([\s\S]*?"i"\));/)[1];
const TYSKA = eval(rad);
const SV = ["Det är vardagsväder på en öppen tomt.", "Mer duk fångar mer väder.",
            "Ett stadigt underlag och rejäl grund.", "Kläder och läder tål väta sämre än duk."];
const DE = ["Geräteschuppen, Zeltgarage, große Tür, rostfreier Metallrahmen",
            "geräteschuppen zeltgarage große tür",
            "Garagenzelt wasserdicht Zeltgarage mit Tür UV-beständig",
            "Gartenhaus Gerätehaus mit Boden und Fenster, wetterfest",
            "Schwarz, Abmessungen 220 x 157 cm, Lieferumfang: 1 x Zelt"];
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
}
console.log("\natta riktiga texter, traffar: " + tr);
console.log("VERDIKT: " + ((ok && tr === 0) ? "GRINDEN OK I JS" : "GRINDEN DUGER INTE"));
process.exit(ok && tr === 0 ? 0 : 1);
