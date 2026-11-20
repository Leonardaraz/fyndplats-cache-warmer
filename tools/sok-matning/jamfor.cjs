// tools/sok-matning/jamfor.cjs
//
// Jämför två utfallsfiler (utfall.ts): hur många frågor bytte antal eller de
// fem första träffarna, hur många tappade alla träffar, och ett jämnt urval.
//
//   node tools/sok-matning/jamfor.cjs <före.json> <efter.json> [antal exempel] [mönster för frågan]
const fs = require("fs");
const [a, b, visa = "25", filter = ""] = process.argv.slice(2);
const A = JSON.parse(fs.readFileSync(a, "utf8"));
const B = JSON.parse(fs.readFileSync(b, "utf8"));
let antal = 0, topp = 0, nollTillTraff = 0, traffTillNoll = 0;
const rader = [];
for (const q of Object.keys(A)) {
  const x = A[q], y = B[q];
  if (!y) continue;
  const nAndrat = x.n !== y.n, tAndrat = x.t.join("|") !== y.t.join("|");
  if (nAndrat) antal++;
  if (tAndrat) topp++;
  if (x.n === 0 && y.n > 0) nollTillTraff++;
  if (x.n > 0 && y.n === 0) traffTillNoll++;
  if ((nAndrat || tAndrat) && (!filter || new RegExp(filter).test(q))) rader.push({ q, x, y });
}
console.log(`${Object.keys(A).length} frågor: ${antal} bytte antal, ${topp} bytte de fem första, ${nollTillTraff} gick från 0 till träff, ${traffTillNoll} från träff till 0`);
const n = Number(visa);
const steg = Math.max(1, Math.floor(rader.length / Math.max(1, n)));
for (let i = 0; i < rader.length && i / steg < n; i += steg) {
  const { q, x, y } = rader[i];
  const struket = (r) => (r.s.length ? ` (-${r.s.join(",")})` : "");
  console.log(`\n"${q}": ${x.n}${struket(x)} → ${y.n}${struket(y)}${y.v ? ` [rättat till ${JSON.stringify(y.v)}]` : ""}`);
  console.log("   före:  " + x.t.slice(0, 3).map((s) => s.slice(0, 44)).join(" ¦ "));
  console.log("   efter: " + y.t.slice(0, 3).map((s) => s.slice(0, 44)).join(" ¦ "));
}
