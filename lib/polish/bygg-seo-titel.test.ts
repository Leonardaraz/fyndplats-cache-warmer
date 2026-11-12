// tools/polish-gates/bygg-seo-titel.py bygger planen som workflowen
// "SEO — titel och metabeskrivning på publicerade sidor" skickar till rutten.
//
// ☠️ VARFÖR (2026-11-11). De första planerna byggdes ur sidans första "sku" i
// JSON-LD. En sida med färg- eller storleksval är en ProductGroup: produktens id
// står i `productGroupID`, och varje "sku" är en VARIANTS id. 24 av 66 rader bar
// ett variant-id, och rutten hade svarat "en sida gick inte att läsa" för var
// och en. Byggaren jämför därför varje pid med id:t som sidan själv bär, och
// proven här låser det.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const BYGG = resolve(__dirname, "../../tools/polish-gates/bygg-seo-titel.py");

const PRODUKT = "1a2b3c4d-0000-4000-8000-000000000001";
const VARIANT_A = "9f8e7d6c-0000-4000-8000-000000000009";
const VARIANT_B = "8e7d6c5b-0000-4000-8000-000000000008";

const TITEL = "Testbord i ek med två hyllplan | Fyndplats";
const BESK = "Ett testbord i ek med två hyllplan och rundade hörn, för hallen eller vardagsrummet.";

const sida = (jsonld: unknown) =>
  `<!doctype html><html><head><title>Gammal titel | Fyndplats</title>` +
  (jsonld === null ? "" : `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>`) +
  `</head><body><h1>Testbord i ek med två hyllplan</h1><p>${BESK}</p></body></html>`;

const UTAN_VAL = { "@context": "https://schema.org", "@type": "Product", sku: PRODUKT, name: "Testbord i ek" };
const MED_VAL = [
  {
    "@context": "https://schema.org",
    "@type": "ProductGroup",
    name: "Testbord i ek",
    productGroupID: PRODUKT,
    hasVariant: [
      { "@type": "Product", sku: VARIANT_A, name: "Testbord i ek – ljus" },
      { "@type": "Product", sku: VARIANT_B, name: "Testbord i ek – mörk" },
    ],
  },
];

const mappar: string[] = [];
afterEach(() => {
  for (const m of mappar.splice(0)) rmSync(m, { recursive: true, force: true });
});

/** En rundas katalog med en sida, och byggaren körd i den. */
function bygg(pid: string, html: string): { kod: number | null; ut: string; plan: string } {
  const rot = mkdtempSync(join(tmpdir(), "bygg-seo-titel-"));
  mappar.push(rot);
  const runda = join(rot, "runda-seo-prov-1");
  mkdirSync(join(runda, "live"), { recursive: true });
  const kort = pid.slice(0, 8);
  writeFileSync(join(runda, "ids.tsv"), `${kort}\t${pid}\n`);
  writeFileSync(join(runda, "seo.tsv"), `${kort}\t${TITEL}\t${BESK}\n`);
  writeFileSync(join(runda, "live", `${kort}.html`), html);
  const r = spawnSync("python3", [BYGG, "prov-1"], { cwd: runda, encoding: "utf-8" });
  return { kod: r.status, ut: `${r.stdout}\n${r.stderr}`, plan: join(rot, "seo-titel", "prov-1.json") };
}

describe("bygg-seo-titel.py: pid ska vara produktens id", () => {
  it("en sida utan val: Product-postens sku är produktens id, och planen byggs", () => {
    const { kod, ut, plan } = bygg(PRODUKT, sida(UTAN_VAL));
    expect(ut).toContain("sha256:");
    expect(kod).toBe(0);
    expect(JSON.parse(readFileSync(plan, "utf-8"))).toEqual({
      namn: "prov-1",
      rader: [{ kort: "1a2b3c4d", pid: PRODUKT, seoTitel: TITEL, seoBesk: BESK }],
    });
  });

  it("en sida med val: productGroupID är produktens id, och planen byggs", () => {
    const { kod, plan } = bygg(PRODUKT, sida(MED_VAL));
    expect(kod).toBe(0);
    expect(JSON.parse(readFileSync(plan, "utf-8")).rader[0].pid).toBe(PRODUKT);
  });

  it("☠️ en variants id i ids.tsv fäller bygget, och ingen plan skrivs", () => {
    const { kod, ut, plan } = bygg(VARIANT_A, sida(MED_VAL));
    expect(kod).not.toBe(0);
    expect(ut).toContain("9f8e7d6c är inte produktens id");
    expect(ut).toContain("sidan live/9f8e7d6c.html bär 1a2b3c4d");
    expect(existsSync(plan)).toBe(false);
  });

  it("en sida utan produkt i sin JSON-LD fäller bygget", () => {
    const { kod, ut, plan } = bygg(PRODUKT, sida(null));
    expect(kod).not.toBe(0);
    expect(ut).toContain("hittar inte produktens id");
    expect(existsSync(plan)).toBe(false);
  });

  it("två olika produkter på en sida utan val fäller bygget: vi vet inte vilken sidan är", () => {
    const { kod, ut } = bygg(PRODUKT, sida([UTAN_VAL, { "@type": "Product", sku: VARIANT_A }]));
    expect(kod).not.toBe(0);
    expect(ut).toContain("hittar inte produktens id");
  });
});
