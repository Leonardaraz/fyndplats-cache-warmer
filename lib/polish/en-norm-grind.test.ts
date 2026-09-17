// ☠️ EN-NORMEN GRINDAS MOT PRODUKTENS EGEN KÄLLA — inte som ett blint mönster.
//
// VARFÖR TESTET FINNS. `NORM` satt i `gatelib.GRINDAR`, alltså i listan över
// mönster som fyrar på allt de matchar. Den kan per konstruktion inte se det
// som avgör om en normangivelse är ett FEL: står normen i produktens källtext?
//
// Uppmätt 2026-09-17 på runda N9:s basketställ, vars källa säger ordagrant
// `Zertifizierung: EN 1270` — fyra fynd på en korrekt, sourcad uppgift.
//
// Det är husets dyraste falsklarmsklass, nedskriven två gånger i CLAUDE.md
// och en gång i #250: ett falsklarm som alltid fyrar lär mottagaren att sluta
// läsa, och då är även det äkta larmet borta.
//
// Testet låser tre riktningar, för det är bara det som skiljer en levande
// grind från en död:
//   1. Sourcad norm  -> REN        (falsklarmet är borta)
//   2. Påhittad norm -> FÄLLER     (grinden kan fortfarande se)
//   3. Ingen källtext-> FÄLLER     (fail-closed; tystnad när man inte kan
//                                   veta vore att göra grinden till en vana)
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const GRIND = resolve(__dirname, "../../tools/polish-gates/gate.py");
const KALLA = "<p>Zertifizierung: EN 1270</p><p>Gesamtmaße: 83B x 55T cm</p>";

const BROD = (norm: string) => `<p>Ett basketställ.</p>
<h3>Certifiering</h3>
<p>Stället är certifierat enligt ${norm}.</p>
<h2>Tekniska specifikationer</h2>
<ul><li>Mått: 83 × 55 cm</li></ul>
<h2>Användning och skötsel</h2>
<p>Torka av plattan.</p>
<h2>Vanliga frågor</h2>
<p><span style="font-weight: 700">Certifierat?</span> Ja.</p>
`;

let katalog = "";
afterEach(() => katalog && rmSync(katalog, { recursive: true, force: true }));

function kor(norm: string, facit: "kallor.json" | "kallor-tal.json"): string {
  katalog = mkdtempSync(join(tmpdir(), "en-norm-"));
  writeFileSync(join(katalog, "prod.html"), BROD(norm));
  writeFileSync(join(katalog, "slugs.txt"), "prod basketstall\n");
  writeFileSync(
    join(katalog, facit),
    facit === "kallor.json"
      ? JSON.stringify({ prod: KALLA })
      : JSON.stringify({ prod: ["83", "55", "1270"] }),
  );
  // Grinden avslutar med exit 1 när den hittar något — det är meningen, och
  // därför måste utskriften läsas ur felet också.
  try {
    return execFileSync("python3", [GRIND], { cwd: katalog, encoding: "utf-8" });
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string };
    if (typeof e.stdout === "string") return e.stdout + (e.stderr ?? "");
    throw err;
  }
}

describe("EN-normen grindas mot källan", () => {
  it("är REN när källan certifierar normen ordagrant", () => {
    expect(kor("EN 1270", "kallor.json")).not.toMatch(/EN-NORM UTAN KÄLLA/);
  });

  it("FÄLLER en norm källan inte nämner", () => {
    const ut = kor("EN 12520", "kallor.json");
    expect(ut).toMatch(/EN-NORM UTAN KÄLLA/);
    expect(ut).toMatch(/källan nämner den inte/);
  });

  // ☠️ EN 71 är LEKSAKSSTANDARDEN och alltså den norm som ligger närmast till
  // hands att hitta på i en barnrunda. Det gamla spannet `\d{3,5}` kunde inte
  // se den. Breddningen till `\d{2,5}` är mätt gratis: noll nya träffar över
  // 413 publicerade rundtexter.
  it("ser en TVÅSIFFRIG norm — EN 71 var osynlig förr", () => {
    expect(kor("EN 71", "kallor.json")).toMatch(/EN-NORM UTAN KÄLLA/);
  });

  it("är FAIL-CLOSED när rundan saknar källtext att grinda mot", () => {
    const ut = kor("EN 1270", "kallor-tal.json");
    expect(ut).toMatch(/EN-NORM UTAN KÄLLA/);
    expect(ut).toMatch(/ingen källtext/);
  });
});
