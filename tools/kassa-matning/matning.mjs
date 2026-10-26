// Kassans postnummerspärr: svarar rutten i produktion? 2026-10-27.
// tools/kassa-matning/matning.mjs
//
// Skickar ett anrop utan giltig signatur till motorns rutt
// /api/wix-validering/v1/get-violations (PR #774). Den nya koden svarar 200
// med {"violations":[]}. Utan den svarar adressen 404. Anropet ändrar
// ingenting någonstans, och loggen bär bara tid, statuskod och svarets början.
//
// Körs av .github/workflows/kassa-matning.yml. Försöker var 30:e sekund i
// högst åtta minuter, så att ett bygge som inte är klart hinner bli det.

import fs from "node:fs";
import path from "node:path";

const RUTT = "https://fyndplats-cache-warmer.vercel.app/api/wix-validering/v1/get-violations";
const UT = process.env.UT || "tools/kassa-matning/ut";
fs.mkdirSync(UT, { recursive: true });

const rader = [];
const skriv = (s) => { console.log(s); rader.push(s); };

const slut = Date.now() + 8 * 60 * 1000;
let svarar = false;
while (Date.now() < slut) {
  try {
    const r = await fetch(RUTT, {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "inte-ett-jwt",
    });
    const text = (await r.text()).replace(/\s+/g, " ").slice(0, 120);
    skriv(`${new Date().toISOString()} POST → ${r.status} ${text}`);
    if (r.status === 200 && text.includes('"violations":[]')) {
      svarar = true;
      break;
    }
  } catch (e) {
    skriv(`${new Date().toISOString()} POST föll: ${e instanceof Error ? e.message : String(e)}`);
  }
  await new Promise((klar) => setTimeout(klar, 30000));
}
skriv(svarar ? 'RUTTEN SVARAR: 200 {"violations":[]}' : "RUTTEN SVARAR INTE SOM VÄNTAT");
fs.writeFileSync(path.join(UT, "validering.txt"), rader.join("\n") + "\n");
if (!svarar) process.exit(1);
